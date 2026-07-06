-- Epic 7: Trust, Safety & User Reporting System

-- 1. EXTEND PROFILES WITH RISK FLAG
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_high_risk BOOLEAN DEFAULT FALSE;

-- 2. MODERATION CASES TABLE
CREATE TABLE IF NOT EXISTS public.moderation_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reported_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_gig_id UUID REFERENCES public.gigs(id) ON DELETE CASCADE,
  reason_category TEXT NOT NULL CHECK (reason_category IN (
    'spam', 'fake_profile', 'abuse', 'harassment', 'scam', 'fake_review', 'fake_job', 'fraud', 'inappropriate_content', 'safety_concern', 'other'
  )),
  description TEXT NOT NULL,
  evidence_urls JSONB DEFAULT '[]'::JSONB,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'under_investigation', 'resolved_action_taken', 'resolved_no_action', 'dismissed')),
  resolution_details TEXT,
  moderator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Ensure a case targets either a profile or a gig, or both, but is not empty
  CONSTRAINT chk_case_targets CHECK (reported_profile_id IS NOT NULL OR reported_gig_id IS NOT NULL)
);

-- Indexes for active queues
CREATE INDEX IF NOT EXISTS idx_moderation_cases_status ON public.moderation_cases(status);
CREATE INDEX IF NOT EXISTS idx_moderation_cases_reported_profile ON public.moderation_cases(reported_profile_id);

-- Enable RLS
ALTER TABLE public.moderation_cases ENABLE ROW LEVEL SECURITY;

-- SELECT Policy
CREATE POLICY "Users can select own reports or admins can select all"
  ON public.moderation_cases FOR SELECT
  USING (
    auth.uid() = reporter_id OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.user_type = 'admin'
    )
  );

-- INSERT Policy
CREATE POLICY "Users can insert own reports"
  ON public.moderation_cases FOR INSERT
  WITH CHECK (
    auth.uid() = reporter_id
  );

-- UPDATE Policy (Only admins can resolve/investigate cases)
CREATE POLICY "Only admins can update moderation cases"
  ON public.moderation_cases FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.user_type = 'admin'
    )
  );

-- 3. TRIGGER TO CHECK REPORT THRESHOLDS AND FLAG ACCOUNTS
CREATE OR REPLACE FUNCTION public.check_user_report_risk_threshold()
RETURNS TRIGGER AS $$
DECLARE
  v_reported_user_id UUID;
  v_open_reports_count INTEGER;
BEGIN
  -- Determine target user profile ID being reported
  IF NEW.reported_profile_id IS NOT NULL THEN
    v_reported_user_id := NEW.reported_profile_id;
  ELSE
    SELECT client_id INTO v_reported_user_id
    FROM public.gigs
    WHERE id = NEW.reported_gig_id;
  END IF;

  -- Count open/investigating cases for this user
  IF v_reported_user_id IS NOT NULL THEN
    SELECT COUNT(1) INTO v_open_reports_count
    FROM public.moderation_cases
    WHERE (reported_profile_id = v_reported_user_id OR reported_gig_id IN (SELECT id FROM public.gigs WHERE client_id = v_reported_user_id))
    AND status IN ('open', 'under_investigation');

    -- Flag account as high risk if threshold exceeded (>= 5 reports)
    IF v_open_reports_count >= 5 THEN
      UPDATE public.profiles
      SET is_high_risk = TRUE,
          updated_at = NOW()
      WHERE id = v_reported_user_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_report_inserted_check_risk
  AFTER INSERT ON public.moderation_cases
  FOR EACH ROW EXECUTE FUNCTION public.check_user_report_risk_threshold();

-- Update timestamp trigger
CREATE OR REPLACE TRIGGER update_moderation_cases_updated_at
  BEFORE UPDATE ON public.moderation_cases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
