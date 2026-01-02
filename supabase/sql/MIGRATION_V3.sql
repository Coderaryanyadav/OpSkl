-- 🏥 TERM MIGRATION & SECURITY HARDENING V3
-- Authority: Audit Command Center
-- Action: Surgical Terminology Migration & RLS Lockdown

-- 1. Rename columns across all sectors
ALTER TABLE public.deliverables RENAME COLUMN worker_id TO talent_id;
ALTER TABLE public.escrow_transactions RENAME COLUMN worker_id TO talent_id;

-- 2. Migrate Favorite Workers to Favorite Talents (Schema Sync)
ALTER TABLE public.favorite_workers RENAME TO favorite_talents;
ALTER TABLE public.favorite_talents RENAME COLUMN worker_id TO talent_id;

-- 3. Fix Escrow Ledger Privacy Leak (Audit Item #1 & #2)
DROP POLICY IF EXISTS "Ledger visible to participants" ON public.escrow_ledger;
CREATE POLICY "Ledger visible to participants" ON public.escrow_ledger FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.gigs 
    WHERE id = gig_id 
    AND (client_id = auth.uid() OR auth.uid() IN (SELECT talent_id FROM applications WHERE gig_id = public.escrow_ledger.gig_id AND status = 'accepted'))
  )
);

-- 4. Lockdown Milestones (Audit Item #1)
DROP POLICY IF EXISTS "Public view milestones" ON milestones;
CREATE POLICY "Milestone visibility restricted" ON milestones FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.gigs 
    WHERE id = gig_id 
    AND (
      client_id = auth.uid() 
      OR auth.uid() IN (SELECT talent_id FROM applications WHERE gig_id = milestones.gig_id AND status = 'accepted')
      OR status = 'open' -- Allow potential talents to see milestones of open gigs
    )
  )
);

-- 5. Fix release_escrow naming (Audit Item #2)
CREATE OR REPLACE FUNCTION release_escrow(p_gig_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_amount int;
  v_talent_id uuid;
  v_client_id uuid;
BEGIN
  -- Verify Escrow exists and is held
  SELECT amount_cents, talent_id, client_id INTO v_amount, v_talent_id, v_client_id
  FROM escrow_transactions
  WHERE gig_id = p_gig_id AND status = 'held';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Escrow not found or unable to release';
  END IF;

  IF auth.uid() != v_client_id THEN
    RAISE EXCEPTION 'Unauthorized: Only client can release funds';
  END IF;

  UPDATE escrow_transactions SET status = 'released', released_at = now() WHERE gig_id = p_gig_id;

  INSERT INTO wallets (user_id, balance_cents) VALUES (v_talent_id, 0) ON CONFLICT (user_id) DO NOTHING;
  UPDATE wallets SET balance_cents = balance_cents + v_amount, updated_at = now() WHERE user_id = v_talent_id;

  UPDATE gigs SET status = 'completed' WHERE id = p_gig_id;
END;
$$;

-- 6. Fix release_milestone naming
CREATE OR REPLACE FUNCTION release_milestone(p_milestone_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_amount int;
  v_talent_id uuid;
  v_client_id uuid;
  v_gig_id uuid;
  v_status text;
BEGIN
  SELECT amount_cents, gig_id, status INTO v_amount, v_gig_id, v_status FROM milestones WHERE id = p_milestone_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Milestone not found'; END IF;
  IF v_status = 'paid' THEN RAISE EXCEPTION 'Milestone already paid'; END IF;

  SELECT client_id, (SELECT talent_id FROM applications WHERE gig_id = v_gig_id AND status = 'accepted' LIMIT 1) 
  INTO v_client_id, v_talent_id
  FROM gigs WHERE id = v_gig_id;

  IF auth.uid() != v_client_id THEN RAISE EXCEPTION 'Unauthorized'; END IF;

  UPDATE milestones SET status = 'paid' WHERE id = p_milestone_id;
  INSERT INTO wallets (user_id, balance_cents) VALUES (v_talent_id, 0) ON CONFLICT (user_id) DO NOTHING;
  UPDATE wallets SET balance_cents = balance_cents + v_amount, updated_at = now() WHERE user_id = v_talent_id;
END;
$$;

-- 7. Analytics Scalability (Audit Item #3)
CREATE INDEX IF NOT EXISTS idx_analytics_event_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_properties ON analytics_events USING GIN (properties);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at DESC);

-- 8. GPS Drift Compensation (Audit Item #6)
CREATE OR REPLACE FUNCTION get_gigs_in_radius(
  target_lat float8,
  target_long float8,
  radius_meters integer
)
RETURNS SETOF public.gigs
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_buffer_meters integer := 100; -- Street-Grade Fuzzy Buffer
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.gigs
  WHERE status = 'open'
    AND ST_DWithin(
      location_point,
      ST_SetSRID(ST_MakePoint(target_long, target_lat), 4326)::geography,
      radius_meters + v_buffer_meters
    )
  ORDER BY ST_Distance(
    location_point,
    ST_SetSRID(ST_MakePoint(target_long, target_lat), 4326)::geography
  );
END;
$$;

-- 🏁 AUDIT REMEDIATION COMPLETE
-- All P0/ P1 items from BRUTAL_AUDIT_LOG.md have been neutralized.

