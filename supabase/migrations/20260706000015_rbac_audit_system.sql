-- Epic 8: Enterprise RBAC, Admin Audit Logging & Critical Schema Fixes

-- ============================================================
-- SECTION A: Fix profiles.user_type CHECK constraint
-- The existing constraint only allows ('worker', 'client', 'both').
-- Multiple RLS policies in migrations 9, 13, 14 reference 'admin'.
-- Without this fix, no admin user can exist, breaking KYC approvals,
-- withdrawal approvals, and moderation case updates.
-- ============================================================

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_type_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_type_check
  CHECK (user_type IN ('worker', 'client', 'both', 'admin'));


-- ============================================================
-- SECTION B: RBAC - Admin Roles & Assignments
-- ============================================================

-- B1. Admin Roles Definition Table
CREATE TABLE IF NOT EXISTS public.admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '[]'::JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view roles"
  ON public.admin_roles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.user_type = 'admin'
    )
  );

-- Seed default roles
INSERT INTO public.admin_roles (name, description, permissions) VALUES
  ('super_admin', 'Full platform access', '["*"]'::JSONB),
  ('ops_manager', 'Operations management', '["users.read","users.update","bookings.*","reports.read"]'::JSONB),
  ('finance', 'Financial operations', '["wallets.read","transactions.read","withdrawals.*","refunds.*","reports.financial"]'::JSONB),
  ('support', 'Customer support', '["users.read","bookings.read","messages.read","tickets.*"]'::JSONB),
  ('moderator', 'Trust and safety moderation', '["users.read","reports.*","moderation.*","kyc.*"]'::JSONB),
  ('verification', 'Identity verification team', '["kyc.*","users.read"]'::JSONB),
  ('read_only', 'View-only access', '["*.read"]'::JSONB)
ON CONFLICT (name) DO NOTHING;

-- B2. Admin Role Assignments (Junction Table)
CREATE TABLE IF NOT EXISTS public.admin_role_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.admin_roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_admin_role_assignments_user ON public.admin_role_assignments(user_id);

ALTER TABLE public.admin_role_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view role assignments"
  ON public.admin_role_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.user_type = 'admin'
    )
  );

CREATE POLICY "Super admins can manage role assignments"
  ON public.admin_role_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_role_assignments ara
      JOIN public.admin_roles ar ON ara.role_id = ar.id
      WHERE ara.user_id = auth.uid()
      AND ar.name = 'super_admin'
    )
  );


-- ============================================================
-- SECTION C: Immutable Admin Audit Log
-- ============================================================

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  previous_value JSONB,
  new_value JSONB,
  ip_address INET,
  user_agent TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_actor ON public.admin_audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_target ON public.admin_audit_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created ON public.admin_audit_log(created_at DESC);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Admins can read audit logs
CREATE POLICY "Admins can read audit logs"
  ON public.admin_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.user_type = 'admin'
    )
  );

-- Admins can insert audit log entries (via application layer)
CREATE POLICY "Admins can insert audit log entries"
  ON public.admin_audit_log FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.user_type = 'admin'
    )
  );

-- No UPDATE or DELETE policies — audit log is immutable


-- ============================================================
-- SECTION D: Fix transactions table column compatibility
-- Epic 6 withdrawal triggers reference wallet_id and transaction_type
-- but the init schema uses from_user_id/to_user_id and type.
-- ============================================================

-- D1. Add wallet_id column to transactions
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON public.transactions(wallet_id);

-- D2. Add transaction_type column mirroring type for trigger compatibility
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS transaction_type TEXT;

-- D3. Keep transaction_type in sync with type on insert/update
CREATE OR REPLACE FUNCTION public.sync_transaction_type_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- If transaction_type is set but type is not, copy to type
  IF NEW.transaction_type IS NOT NULL AND NEW.type IS NULL THEN
    NEW.type := NEW.transaction_type;
  END IF;
  -- Always keep transaction_type in sync with type
  NEW.transaction_type := COALESCE(NEW.transaction_type, NEW.type);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER sync_transaction_type_on_insert
  BEFORE INSERT ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.sync_transaction_type_columns();

-- Update timestamp trigger for admin tables
CREATE OR REPLACE TRIGGER update_admin_roles_updated_at
  BEFORE UPDATE ON public.admin_roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
