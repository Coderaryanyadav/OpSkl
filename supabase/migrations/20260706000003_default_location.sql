-- Phase 6 Autonomous CTO Optimization: Default Location trigger for new workers

CREATE OR REPLACE FUNCTION public.set_default_worker_location()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user is registered as a worker or both and does not have any locations configured
  IF (NEW.user_type = 'worker' OR NEW.user_type = 'both') THEN
    IF NOT EXISTS (SELECT 1 FROM public.locations WHERE user_id = NEW.id) THEN
      INSERT INTO public.locations (
        user_id,
        latitude,
        longitude,
        formatted_address,
        city,
        state,
        country,
        is_primary,
        location_type
      ) VALUES (
        NEW.id,
        19.0760, -- Mumbai Latitude
        72.8777, -- Mumbai Longitude
        'Mumbai, Maharashtra, India',
        'Mumbai',
        'Maharashtra',
        'India',
        TRUE,
        'home'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to execute AFTER user profile registration is completed
CREATE OR REPLACE TRIGGER on_profile_create_default_location
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_default_worker_location();
