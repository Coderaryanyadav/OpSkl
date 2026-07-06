-- Epic 4: Booking Lifecycle Activity Timeline Schema

-- 1. TIMELINE EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.booking_timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_id UUID NOT NULL REFERENCES public.gigs(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('job_created', 'application_submitted', 'worker_hired', 'status_updated')),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for chronological search
CREATE INDEX IF NOT EXISTS idx_booking_timeline_gig ON public.booking_timeline_events(gig_id);

-- Enable RLS
ALTER TABLE public.booking_timeline_events ENABLE ROW LEVEL SECURITY;

-- SELECT Policy
CREATE POLICY "Booking parties can view timeline events"
  ON public.booking_timeline_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.gigs g
      WHERE g.id = booking_timeline_events.gig_id
      AND (
        g.client_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.worker_profiles wp
          WHERE wp.id = g.assigned_worker_id AND wp.user_id = auth.uid()
        )
      )
    )
  );

-- 2. TRIGGER FUNCTIONS
-- A. Log Job Created
CREATE OR REPLACE FUNCTION public.log_gig_created_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.booking_timeline_events (gig_id, event_type, created_by, description)
  VALUES (
    NEW.id,
    'job_created',
    NEW.client_id,
    'Gig listing created: ' || NEW.title
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_gig_created_log_timeline
  AFTER INSERT ON public.gigs
  FOR EACH ROW EXECUTE FUNCTION public.log_gig_created_event();


-- B. Log Bid Application Submitted
CREATE OR REPLACE FUNCTION public.log_bid_created_event()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get worker's profile user ID
  SELECT user_id INTO v_user_id
  FROM public.worker_profiles
  WHERE id = NEW.worker_id;

  INSERT INTO public.booking_timeline_events (gig_id, event_type, created_by, description)
  VALUES (
    NEW.gig_id,
    'application_submitted',
    v_user_id,
    'Worker submitted application proposal for ₹' || NEW.proposed_amount
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_bid_created_log_timeline
  AFTER INSERT ON public.gig_bids
  FOR EACH ROW EXECUTE FUNCTION public.log_bid_created_event();


-- C. Log Worker Hired & Status Updates
CREATE OR REPLACE FUNCTION public.log_gig_update_events()
RETURNS TRIGGER AS $$
DECLARE
  v_worker_uid UUID;
BEGIN
  -- Case A: Worker Hired
  IF (OLD.assigned_worker_id IS NULL AND NEW.assigned_worker_id IS NOT NULL) THEN
    SELECT user_id INTO v_worker_uid
    FROM public.worker_profiles
    WHERE id = NEW.assigned_worker_id;

    INSERT INTO public.booking_timeline_events (gig_id, event_type, created_by, description)
    VALUES (
      NEW.id,
      'worker_hired',
      NEW.client_id,
      'Client selected and hired worker for the task'
    );
  END IF;

  -- Case B: Status Updated
  IF (OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.booking_timeline_events (gig_id, event_type, created_by, description)
    VALUES (
      NEW.id,
      'status_updated',
      NEW.client_id,
      'Gig booking transitioned to status: ' || NEW.status
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_gig_update_log_timeline
  AFTER UPDATE ON public.gigs
  FOR EACH ROW EXECUTE FUNCTION public.log_gig_update_events();
