-- Epic 6: Payouts and Withdrawal Requests System

-- 1. WITHDRAWAL REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  payout_method TEXT NOT NULL CHECK (payout_method IN ('upi', 'bank_transfer')),
  payout_details JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  admin_notes TEXT,
  processed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user payout history searches
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user ON public.withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON public.withdrawal_requests(status);

-- Enable RLS
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- SELECT Policy
CREATE POLICY "Users or admins can view withdrawal requests"
  ON public.withdrawal_requests FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.user_type = 'admin'
    )
  );

-- INSERT Policy (Only users can insert own pending requests)
CREATE POLICY "Users can submit own withdrawal requests"
  ON public.withdrawal_requests FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    status = 'pending'
  );

-- UPDATE Policy (Admins can approve/reject, Users can cancel if pending)
CREATE POLICY "Users or admins can update withdrawal requests"
  ON public.withdrawal_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.user_type = 'admin'
    ) OR (
      auth.uid() = user_id AND
      status = 'pending' AND
      OLD.status = 'pending' AND
      NEW.status = 'cancelled'
    )
  );

-- 2. TRIGGER TO VALIDATE AND HOLD FUNDS ON WITHDRAWAL CREATION
CREATE OR REPLACE FUNCTION public.hold_withdrawal_funds()
RETURNS TRIGGER AS $$
DECLARE
  v_available_bal DECIMAL;
BEGIN
  -- Fetch user's available balance
  SELECT available_balance INTO v_available_bal
  FROM public.wallets
  WHERE user_id = NEW.user_id;

  -- Verify sufficient funds exist
  IF v_available_bal IS NULL OR v_available_bal < NEW.amount THEN
    RAISE EXCEPTION 'Insufficient wallet balance for withdrawal (Available: ₹%)', COALESCE(v_available_bal, 0.00);
  END IF;

  -- Hold funds in client's wallet to prevent double-spending
  UPDATE public.wallets
  SET available_balance = available_balance - NEW.amount,
      held_balance = held_balance + NEW.amount,
      updated_at = NOW()
  WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_withdrawal_request_hold_funds
  BEFORE INSERT ON public.withdrawal_requests
  FOR EACH ROW EXECUTE FUNCTION public.hold_withdrawal_funds();


-- 3. TRIGGER TO SETTLE WALLET BALANCES ON WITHDRAWAL STATUS CHANGE
CREATE OR REPLACE FUNCTION public.settle_withdrawal_funds()
RETURNS TRIGGER AS $$
DECLARE
  v_wallet_id UUID;
BEGIN
  -- Fetch wallet ID
  SELECT id INTO v_wallet_id
  FROM public.wallets
  WHERE user_id = NEW.user_id;

  -- Only process if transitioning from pending
  IF OLD.status = 'pending' AND NEW.status != 'pending' THEN
    
    -- Case A: Approved (Deduct held amount and balance permanently)
    IF NEW.status = 'approved' THEN
      UPDATE public.wallets
      SET held_balance = held_balance - NEW.amount,
          balance = balance - NEW.amount,
          updated_at = NOW()
      WHERE id = v_wallet_id;

      -- Insert completed transaction ledger record
      INSERT INTO public.transactions (wallet_id, amount, transaction_type, status, metadata)
      VALUES (
        v_wallet_id,
        NEW.amount,
        'withdrawal',
        'completed',
        jsonb_build_object('withdrawal_id', NEW.id, 'payout_method', NEW.payout_method)
      );
    
    -- Case B: Rejected or Cancelled (Return held amount to available balance)
    ELSIF NEW.status IN ('rejected', 'cancelled') THEN
      UPDATE public.wallets
      SET held_balance = held_balance - NEW.amount,
          available_balance = available_balance + NEW.amount,
          updated_at = NOW()
      WHERE id = v_wallet_id;

      -- Insert failed transaction ledger record
      INSERT INTO public.transactions (wallet_id, amount, transaction_type, status, metadata)
      VALUES (
        v_wallet_id,
        NEW.amount,
        'withdrawal',
        'failed',
        jsonb_build_object('withdrawal_id', NEW.id, 'rejection_reason', NEW.admin_notes)
      );
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_withdrawal_status_change_settle_wallet
  AFTER UPDATE ON public.withdrawal_requests
  FOR EACH ROW EXECUTE FUNCTION public.settle_withdrawal_funds();

-- Update timestamp trigger
CREATE OR REPLACE TRIGGER update_withdrawal_requests_updated_at
  BEFORE UPDATE ON public.withdrawal_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
