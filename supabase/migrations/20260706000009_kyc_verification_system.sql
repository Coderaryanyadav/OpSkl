-- Epic 2: KYC & Government Identity Verification System

-- 1. KYC VERIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.kyc_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  id_type TEXT NOT NULL CHECK (id_type IN ('Aadhaar', 'PAN', 'Passport', 'GST')),
  id_number TEXT NOT NULL, -- Stored encrypted in production
  document_url TEXT NOT NULL,
  selfie_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint: one active KYC verification request type per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_kyc_user_type_active ON public.kyc_verifications (user_id, id_type) WHERE status != 'rejected';

-- Enable RLS
ALTER TABLE public.kyc_verifications ENABLE ROW LEVEL SECURITY;

-- SELECT Policy
CREATE POLICY "Users or moderators can view KYC requests"
  ON public.kyc_verifications FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.user_type = 'admin'
    )
  );

-- INSERT Policy
CREATE POLICY "Users can insert own pending KYC requests"
  ON public.kyc_verifications FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    status = 'pending'
  );

-- UPDATE Policy (Only admin moderators can update status/rejection details)
CREATE POLICY "Only administrators can update KYC verifications"
  ON public.kyc_verifications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.user_type = 'admin'
    )
  );

-- 2. TRIGGER TO UPDATE PROFILE VERIFICATION LEVEL ON KYC APPROVAL
CREATE OR REPLACE FUNCTION public.update_profile_level_on_kyc_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.status = 'pending' AND NEW.status = 'approved') THEN
    -- If GST certificate is verified, grant Gold tier (verified business)
    IF NEW.id_type = 'GST' THEN
      UPDATE public.profiles
      SET verification_level = 'gold',
          updated_at = NOW()
      WHERE id = NEW.user_id;
    ELSE
      -- Standard government ID grants Silver tier (verified individual)
      UPDATE public.profiles
      SET verification_level = 'silver',
          updated_at = NOW()
      WHERE id = NEW.user_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_kyc_approval_update_profile_level
  AFTER UPDATE ON public.kyc_verifications
  FOR EACH ROW EXECUTE FUNCTION public.update_profile_level_on_kyc_approval();

-- Update timestamp trigger
CREATE OR REPLACE TRIGGER update_kyc_verifications_updated_at
  BEFORE UPDATE ON public.kyc_verifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
