-- Phase 7: Escrow Dispute Resolution Database Migration

-- 1. DISPUTES TABLE
CREATE TABLE IF NOT EXISTS public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_id UUID NOT NULL REFERENCES public.gigs(id) ON DELETE CASCADE,
  disputed_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  evidence_attachments JSONB DEFAULT '[]'::JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'arbitrating', 'resolved_refunded', 'resolved_paid')),
  resolution_details TEXT,
  moderator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for speedy join lookups
CREATE INDEX IF NOT EXISTS idx_disputes_gig ON public.disputes(gig_id);
CREATE INDEX IF NOT EXISTS idx_disputes_disputed_by ON public.disputes(disputed_by);

-- Enable RLS
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Disputes viewable by gig parties or moderator"
  ON public.disputes FOR SELECT
  USING (
    auth.uid() = disputed_by OR
    EXISTS (
      SELECT 1 FROM public.gigs g
      WHERE g.id = disputes.gig_id
      AND (g.client_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.worker_profiles wp
        WHERE wp.id = g.assigned_worker_id AND wp.user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Gig parties can file disputes"
  ON public.disputes FOR INSERT
  WITH CHECK (
    auth.uid() = disputed_by AND
    EXISTS (
      SELECT 1 FROM public.gigs g
      WHERE g.id = gig_id
      AND (g.client_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.worker_profiles wp
        WHERE wp.id = g.assigned_worker_id AND wp.user_id = auth.uid()
      ))
    )
  );

-- 2. ESCROW HOLD TRIGGER ON DISPUTE CREATION
CREATE OR REPLACE FUNCTION public.hold_disputed_wallet_funds()
RETURNS TRIGGER AS $$
DECLARE
  v_budget DECIMAL;
  v_client_id UUID;
  v_available_bal DECIMAL;
BEGIN
  -- 1. Update related Gig status to 'disputed'
  UPDATE public.gigs
  SET status = 'disputed',
      updated_at = NOW()
  WHERE id = NEW.gig_id
  RETURNING budget_amount, client_id INTO v_budget, v_client_id;

  -- 2. Fetch client wallet details
  SELECT available_balance INTO v_available_bal
  FROM public.wallets
  WHERE user_id = v_client_id;

  -- 3. Hold funds in client's wallet to secure the payment
  IF v_available_bal >= v_budget THEN
    UPDATE public.wallets
    SET held_balance = held_balance + v_budget,
        updated_at = NOW()
    WHERE user_id = v_client_id;
  ELSE
    -- If available balance is lower (should not happen in escrow system), hold all available balance
    UPDATE public.wallets
    SET held_balance = held_balance + v_available_bal,
        updated_at = NOW()
    WHERE user_id = v_client_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_dispute_hold_wallet_funds
  AFTER INSERT ON public.disputes
  FOR EACH ROW EXECUTE FUNCTION public.hold_disputed_wallet_funds();

-- Update timestamp trigger
CREATE OR REPLACE TRIGGER update_disputes_updated_at
  BEFORE UPDATE ON public.disputes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
