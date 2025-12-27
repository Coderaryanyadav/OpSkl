-- 🚀 OPSKL LAUNCH READY MASTER SCHEMA
-- This script aggregates all Trust & Safety features, Logic, and Tables required for launch.
-- Execute this entirely in the Supabase SQL Editor.

-- ==========================================
-- 1. BASE TABLES (If not exists from V2)
-- ==========================================

-- Reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  gig_id uuid REFERENCES public.gigs(id) NOT NULL,
  reviewer_id uuid REFERENCES public.profiles(id) NOT NULL,
  target_id uuid REFERENCES public.profiles(id) NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Portfolio
CREATE TABLE IF NOT EXISTS public.portfolio_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) NOT NULL,
  title text NOT NULL,
  description text,
  image_url text NOT NULL,
  link_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Deliverables
DO $$ BEGIN
    CREATE TYPE deliverable_status AS ENUM ('submitted', 'accepted', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.deliverables (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  gig_id uuid REFERENCES public.gigs(id) NOT NULL,
  worker_id uuid REFERENCES public.profiles(id) NOT NULL,
  file_url text NOT NULL,
  description text,
  status deliverable_status DEFAULT 'submitted',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Escrow
DO $$ BEGIN
    CREATE TYPE escrow_status AS ENUM ('held', 'released', 'refunded', 'disputed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.escrow_transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  gig_id uuid REFERENCES public.gigs(id) NOT NULL,
  client_id uuid REFERENCES public.profiles(id) NOT NULL,
  worker_id uuid REFERENCES public.profiles(id) NOT NULL,
  amount_cents integer NOT NULL,
  status escrow_status DEFAULT 'held',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  released_at timestamp with time zone
);

-- Favorite Workers
CREATE TABLE IF NOT EXISTS favorite_workers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(client_id, worker_id)
);

-- Notification Preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    new_gigs BOOLEAN DEFAULT true,
    applications BOOLEAN DEFAULT true,
    messages BOOLEAN DEFAULT true,
    payments BOOLEAN DEFAULT true,
    reviews BOOLEAN DEFAULT true,
    system BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Disputes
CREATE TABLE IF NOT EXISTS disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gig_id UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
    initiator_id UUID NOT NULL REFERENCES auth.users(id),
    defendant_id UUID NOT NULL REFERENCES auth.users(id),
    reason TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'dismissed')),
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 2. SECURITY POLICIES (RLS)
-- ==========================================

-- Enable RLS everywhere
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

-- Clean existing policies to prevent conflicts
DROP POLICY IF EXISTS "Reviews are public" ON public.reviews;
DROP POLICY IF EXISTS "Users can create reviews" ON public.reviews;
DROP POLICY IF EXISTS "Portfolio is public" ON public.portfolio_items;
DROP POLICY IF EXISTS "Users manage own portfolio" ON public.portfolio_items;
DROP POLICY IF EXISTS "Deliverables visible to gig participants" ON public.deliverables;
DROP POLICY IF EXISTS "Workers submit deliverables" ON public.deliverables;
DROP POLICY IF EXISTS "Escrow visible to participants" ON public.escrow_transactions;
DROP POLICY IF EXISTS "Users can view own favorites" ON favorite_workers;
DROP POLICY IF EXISTS "Users can add favorites" ON favorite_workers;
DROP POLICY IF EXISTS "Users can remove favorites" ON favorite_workers;
DROP POLICY IF EXISTS "Users can view own notification preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can update own notification preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can insert own notification preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can view disputes they are involved in" ON disputes;
DROP POLICY IF EXISTS "Users can create disputes" ON disputes;

-- Re-create Policies
CREATE POLICY "Reviews are public" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "Portfolio is public" ON public.portfolio_items FOR SELECT USING (true);
CREATE POLICY "Users manage own portfolio" ON public.portfolio_items FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Deliverables visible to gig participants" ON public.deliverables FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.gigs WHERE id = deliverables.gig_id AND (client_id = auth.uid() OR auth.uid() = deliverables.worker_id))
);
CREATE POLICY "Workers submit deliverables" ON public.deliverables FOR INSERT WITH CHECK (auth.uid() = worker_id);

CREATE POLICY "Escrow visible to participants" ON public.escrow_transactions FOR SELECT USING (
  auth.uid() = client_id OR auth.uid() = worker_id
);
CREATE POLICY "Escrow update logic" ON public.escrow_transactions FOR UPDATE USING (
    auth.uid() = client_id -- Allow client to release funds
);

CREATE POLICY "Users can view own favorites" ON favorite_workers FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Users can add favorites" ON favorite_workers FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Users can remove favorites" ON favorite_workers FOR DELETE USING (auth.uid() = client_id);

CREATE POLICY "Users can view own notification preferences" ON notification_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notification preferences" ON notification_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notification preferences" ON notification_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view disputes they are involved in" ON disputes FOR SELECT USING (auth.uid() = initiator_id OR auth.uid() = defendant_id);
CREATE POLICY "Users can create disputes" ON disputes FOR INSERT WITH CHECK (auth.uid() = initiator_id);

-- ==========================================
-- 3. LOGIC & FUNCTIONS (RPC)
-- ==========================================

-- Function to Release Escrow safely
CREATE OR REPLACE FUNCTION release_escrow(p_gig_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_amount int;
  v_worker_id uuid;
  v_client_id uuid;
BEGIN
  -- Verify Escrow exists and is held
  SELECT amount_cents, worker_id, client_id INTO v_amount, v_worker_id, v_client_id
  FROM escrow_transactions
  WHERE gig_id = p_gig_id AND status = 'held';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Escrow not found or unable to release';
  END IF;

  -- Verify Caller is the Client
  IF auth.uid() != v_client_id THEN
    RAISE EXCEPTION 'Unauthorized: Only client can release funds';
  END IF;

  -- 1. Mark Escrow Released
  UPDATE escrow_transactions
  SET status = 'released', released_at = now()
  WHERE gig_id = p_gig_id;

  -- 2. Credit Worker Wallet (Ensure wallet exists)
  INSERT INTO wallets (user_id, balance_cents)
  VALUES (v_worker_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE wallets
  SET balance_cents = balance_cents + v_amount,
      updated_at = now()
  WHERE user_id = v_worker_id;

  -- 3. Mark Gig Completed
  UPDATE gigs
  SET status = 'completed'
  WHERE id = p_gig_id;

END;
$$;

-- Function to Release specific Milestone
CREATE OR REPLACE FUNCTION release_milestone(p_milestone_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_amount int;
  v_worker_id uuid;
  v_client_id uuid;
  v_gig_id uuid;
  v_status text;
BEGIN
  -- 1. Get Milestone Details
  SELECT amount_cents, gig_id, status INTO v_amount, v_gig_id, v_status
  FROM milestones
  WHERE id = p_milestone_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Milestone not found';
  END IF;

  IF v_status = 'paid' THEN
    RAISE EXCEPTION 'Milestone already paid';
  END IF;

  -- 2. Get Gig/Worker details (Accepted worker)
  SELECT client_id, (SELECT worker_id FROM applications WHERE gig_id = v_gig_id AND status = 'accepted' LIMIT 1) 
  INTO v_client_id, v_worker_id
  FROM gigs
  WHERE id = v_gig_id;

  -- 3. Verify Caller is Client
  IF auth.uid() != v_client_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- 4. Mark Milestone as Paid
  UPDATE milestones SET status = 'paid' WHERE id = p_milestone_id;

  -- 5. Credit Worker Wallet
  INSERT INTO wallets (user_id, balance_cents)
  VALUES (v_worker_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE wallets
  SET balance_cents = balance_cents + v_amount,
      updated_at = now()
  WHERE user_id = v_worker_id;

END;
$$;

-- Profile Aggregations
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avg_rating numeric(3,2) DEFAULT 0.0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS review_count integer DEFAULT 0;

-- Indices
CREATE INDEX IF NOT EXISTS idx_gigs_status ON gigs(status);
CREATE INDEX IF NOT EXISTS idx_gigs_urgency ON gigs(urgency_level);
CREATE INDEX IF NOT EXISTS idx_gigs_budget ON gigs(budget);

-- ==========================================
-- 4. ANALYTICS & MESSAGING UPDATES
-- ==========================================

-- Analytics Table
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name text NOT NULL,
  properties jsonb DEFAULT '{}'::jsonb,
  device_info jsonb DEFAULT '{}'::jsonb,
  user_id uuid REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can log analytics" ON analytics_events FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Read Receipts
ALTER TABLE messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;

-- Create Index for fast message fetch
CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id);

-- ==========================================
-- 5. SAVED SEARCHES (Power User Feature)
-- ==========================================

CREATE TABLE IF NOT EXISTS saved_searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    query_text TEXT,
    filters JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own searches" ON saved_searches FOR ALL USING (auth.uid() = user_id);

-- ==========================================
-- 6. PROJECT MILESTONES (Enterprise Feature)
-- ==========================================

CREATE TABLE IF NOT EXISTS milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gig_id UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    amount_cents INTEGER NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'paid', 'disputed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view milestones" ON milestones FOR SELECT USING (true);
CREATE POLICY "Client manage milestones" ON milestones FOR ALL USING (
    auth.uid() IN (SELECT client_id FROM gigs WHERE id = gig_id)
);
