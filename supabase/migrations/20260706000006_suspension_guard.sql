-- Phase 9: Suspension Guard Database Security Migration

-- Helper function to check if a user is suspended securely
CREATE OR REPLACE FUNCTION public.is_suspended(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE((SELECT is_suspended FROM public.profiles WHERE id = p_user_id), FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. RE-APPLY SECURE RLS POLICIES FOR public.gigs
DROP POLICY IF EXISTS "Clients can create and manage their own gigs" ON public.gigs;

CREATE POLICY "Clients can create and manage their own gigs"
  ON public.gigs FOR ALL
  USING (
    auth.uid() = client_id 
    AND NOT public.is_suspended(auth.uid())
  );

-- 2. RE-APPLY SECURE RLS POLICIES FOR public.gig_bids
DROP POLICY IF EXISTS "Workers can place/manage bids" ON public.gig_bids;

CREATE POLICY "Workers can place/manage bids"
  ON public.gig_bids FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.worker_profiles wp
      WHERE wp.id = gig_bids.worker_id
      AND wp.user_id = auth.uid()
    )
    AND NOT public.is_suspended(auth.uid())
  );

-- 3. RE-APPLY SECURE RLS POLICIES FOR public.messages
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;

CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id 
    AND NOT public.is_suspended(auth.uid())
  );

-- 4. RE-APPLY SECURE RLS POLICIES FOR public.reviews
DROP POLICY IF EXISTS "Reviewer can insert and update own review" ON public.reviews;

CREATE POLICY "Reviewer can insert and update own review"
  ON public.reviews FOR ALL
  USING (
    auth.uid() = reviewer_id 
    AND NOT public.is_suspended(auth.uid())
  );

-- 5. RE-APPLY SECURE RLS POLICIES FOR public.locations
DROP POLICY IF EXISTS "Users can manage own locations" ON public.locations;

CREATE POLICY "Users can manage own locations"
  ON public.locations FOR ALL
  USING (
    auth.uid() = user_id 
    AND NOT public.is_suspended(auth.uid())
  );
