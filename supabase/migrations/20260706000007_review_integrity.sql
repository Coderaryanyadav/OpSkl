-- Phase 10: Review Integrity & Trust Engine Database Migration

CREATE OR REPLACE FUNCTION public.validate_review_submission()
RETURNS TRIGGER AS $$
DECLARE
  v_status TEXT;
  v_client_id UUID;
  v_assigned_worker_uid UUID;
BEGIN
  -- 1. Fetch gig status and assignment details
  SELECT g.status, g.client_id, wp.user_id
  INTO v_status, v_client_id, v_assigned_worker_uid
  FROM public.gigs g
  LEFT JOIN public.worker_profiles wp ON g.assigned_worker_id = wp.id
  WHERE g.id = NEW.gig_id;

  -- 2. Reject reviews if gig is not completed
  IF v_status IS DISTINCT FROM 'completed' THEN
    RAISE EXCEPTION 'Reviews can only be submitted for completed gigs (Current status: %)', COALESCE(v_status, 'none');
  END IF;

  -- 3. Reject reviews if reviewer/reviewee are not valid parties of the gig
  IF NOT (
    -- Client reviewing Worker
    (NEW.reviewer_id = v_client_id AND NEW.reviewee_id = v_assigned_worker_uid) OR
    -- Worker reviewing Client
    (NEW.reviewer_id = v_assigned_worker_uid AND NEW.reviewee_id = v_client_id)
  ) THEN
    RAISE EXCEPTION 'Invalid review relationship. The reviewer and reviewee must be the client and the assigned worker for this gig.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply validation check before review insertion
CREATE OR REPLACE TRIGGER on_review_insert_validate
  BEFORE INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.validate_review_submission();
