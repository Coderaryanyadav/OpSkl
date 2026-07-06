-- Phase XI: Automated Notification Triggers

-- 1. TRIGGER FOR GIG BIDS (NEW OR ACCEPTED)
CREATE OR REPLACE FUNCTION public.dispatch_bid_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_client_id UUID;
  v_worker_uid UUID;
  v_title TEXT;
BEGIN
  -- Fetch gig and worker details
  SELECT g.client_id, g.title, wp.user_id
  INTO v_client_id, v_title, v_worker_uid
  FROM public.gigs g
  LEFT JOIN public.worker_profiles wp ON wp.id = NEW.worker_id
  WHERE g.id = NEW.gig_id;

  -- Case A: New bid is submitted
  IF (TG_OP = 'INSERT' AND NEW.status = 'pending') THEN
    INSERT INTO public.notifications (user_id, title, body, notification_type)
    VALUES (
      v_client_id,
      'New Applicant',
      'A worker has applied to your gig: ' || v_title,
      'match'
    );
  END IF;

  -- Case B: Bid is accepted
  IF (TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'accepted') THEN
    INSERT INTO public.notifications (user_id, title, body, notification_type)
    VALUES (
      v_worker_uid,
      'Application Accepted',
      'Your application for the gig: ' || v_title || ' has been accepted!',
      'match'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_bid_change_notify
  AFTER INSERT OR UPDATE ON public.gig_bids
  FOR EACH ROW EXECUTE FUNCTION public.dispatch_bid_notification();


-- 2. TRIGGER FOR GIG DISPUTES
CREATE OR REPLACE FUNCTION public.dispatch_dispute_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_client_id UUID;
  v_worker_uid UUID;
  v_title TEXT;
BEGIN
  -- Fetch gig and worker details
  SELECT g.client_id, g.title, wp.user_id
  INTO v_client_id, v_title, v_worker_uid
  FROM public.gigs g
  LEFT JOIN public.worker_profiles wp ON g.assigned_worker_id = wp.id
  WHERE g.id = NEW.gig_id;

  -- Notify both parties
  IF v_client_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, body, notification_type)
    VALUES (
      v_client_id,
      'Dispute Filed',
      'A dispute has been initiated for the gig: ' || v_title,
      'dispute'
    );
  END IF;

  IF v_worker_uid IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, body, notification_type)
    VALUES (
      v_worker_uid,
      'Dispute Filed',
      'A dispute has been initiated for the gig: ' || v_title,
      'dispute'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_dispute_create_notify
  AFTER INSERT ON public.disputes
  FOR EACH ROW EXECUTE FUNCTION public.dispatch_dispute_notification();
