-- Phase 8: Financial Audit Logs Migration (First-Principles Ledger)

-- 1. WALLET AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.wallet_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  old_balance DECIMAL(12, 2) NOT NULL,
  new_balance DECIMAL(12, 2) NOT NULL,
  old_held_balance DECIMAL(12, 2) NOT NULL,
  new_held_balance DECIMAL(12, 2) NOT NULL,
  change_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for wallet history auditing
CREATE INDEX IF NOT EXISTS idx_wallet_audit_logs_wallet ON public.wallet_audit_logs(wallet_id);

-- Enable RLS
ALTER TABLE public.wallet_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies (SELECT only, deny all write operations)
CREATE POLICY "Users can select own wallet audit log"
  ON public.wallet_audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.wallets w
      WHERE w.id = wallet_audit_logs.wallet_id
      AND w.user_id = auth.uid()
    )
  );

-- 2. IMMUTABILITY TRIGGER ON WALLET UPDATE
CREATE OR REPLACE FUNCTION public.log_wallet_balance_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log old vs new states only if balance or held_balance has mutated
  IF (OLD.balance IS DISTINCT FROM NEW.balance OR OLD.held_balance IS DISTINCT FROM NEW.held_balance) THEN
    INSERT INTO public.wallet_audit_logs (
      wallet_id,
      old_balance,
      new_balance,
      old_held_balance,
      new_held_balance,
      change_reason
    ) VALUES (
      NEW.id,
      OLD.balance,
      NEW.balance,
      OLD.held_balance,
      NEW.held_balance,
      'Automated State Synchronization Ledger Update'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_wallet_balance_change_log_audit
  AFTER UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION public.log_wallet_balance_changes();
