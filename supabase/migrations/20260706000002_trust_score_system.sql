-- Phase 4: Trust & Reputation Database Migration

-- Add columns to public.worker_profiles
ALTER TABLE public.worker_profiles
ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 50 CHECK (trust_score BETWEEN 0 AND 100),
ADD COLUMN IF NOT EXISTS verification_level TEXT DEFAULT 'none' CHECK (verification_level IN ('none', 'bronze', 'silver', 'gold'));

-- Stored procedure to calculate a worker's Trust Score dynamically
CREATE OR REPLACE FUNCTION public.calculate_worker_trust_score(p_worker_id UUID)
RETURNS INTEGER AS $$
DECLARE
  base_score INTEGER := 50;
  v_user_id UUID;
  v_is_id_verified BOOLEAN;
  v_is_phone_verified BOOLEAN;
  v_is_email_verified BOOLEAN;
  v_avg_rating DECIMAL(3,2);
  v_completed_count INTEGER;
BEGIN
  -- Get user_id and stats
  SELECT user_id, average_rating, total_gigs_completed INTO v_user_id, v_avg_rating, v_completed_count
  FROM public.worker_profiles
  WHERE id = p_worker_id;

  -- Get verification stats from profile
  SELECT is_identity_verified, is_phone_verified, is_email_verified 
  INTO v_is_id_verified, v_is_phone_verified, v_is_email_verified
  FROM public.profiles
  WHERE id = v_user_id;

  -- 1. Verification adjustments
  IF v_is_id_verified THEN
    base_score := base_score + 20;
  END IF;
  IF v_is_phone_verified THEN
    base_score := base_score + 10;
  END IF;
  IF v_is_email_verified THEN
    base_score := base_score + 10;
  END IF;

  -- 2. Ratings adjustments
  IF v_avg_rating > 4.5 THEN
    base_score := base_score + 10;
  ELSIF v_avg_rating < 3.0 AND v_avg_rating > 0 THEN
    base_score := base_score - 20;
  END IF;

  -- 3. Experience adjustment
  IF v_completed_count >= 10 THEN
    base_score := base_score + 10;
  END IF;

  -- Cap at [0, 100]
  IF base_score > 100 THEN
    base_score := 100;
  ELSIF base_score < 0 THEN
    base_score := 0;
  END IF;

  RETURN base_score;
END;
$$ LANGUAGE plpgsql;

-- Trigger logic to update trust score automatically
CREATE OR REPLACE FUNCTION public.trigger_update_trust_score()
RETURNS TRIGGER AS $$
DECLARE
  v_worker_id UUID;
BEGIN
  IF TG_TABLE_NAME = 'worker_profiles' THEN
    v_worker_id := NEW.id;
  ELSIF TG_TABLE_NAME = 'profiles' THEN
    SELECT id INTO v_worker_id FROM public.worker_profiles WHERE user_id = NEW.id;
  ELSIF TG_TABLE_NAME = 'reviews' THEN
    -- Find worker profile related to reviewee
    SELECT id INTO v_worker_id FROM public.worker_profiles WHERE user_id = NEW.reviewee_id;
  END IF;

  IF v_worker_id IS NOT NULL THEN
    UPDATE public.worker_profiles
    SET trust_score = public.calculate_worker_trust_score(v_worker_id),
        verification_level = CASE 
          WHEN public.calculate_worker_trust_score(v_worker_id) >= 90 THEN 'gold'
          WHEN public.calculate_worker_trust_score(v_worker_id) >= 75 THEN 'silver'
          WHEN public.calculate_worker_trust_score(v_worker_id) >= 60 THEN 'bronze'
          ELSE 'none'
        END
    WHERE id = v_worker_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE OR REPLACE TRIGGER on_worker_profile_change_trust
  AFTER UPDATE OF average_rating, total_gigs_completed ON public.worker_profiles
  FOR EACH ROW EXECUTE FUNCTION public.trigger_update_trust_score();

CREATE OR REPLACE TRIGGER on_profile_verify_change_trust
  AFTER UPDATE OF is_identity_verified, is_phone_verified, is_email_verified ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.trigger_update_trust_score();

CREATE OR REPLACE TRIGGER on_new_review_update_trust
  AFTER INSERT OR UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.trigger_update_trust_score();
