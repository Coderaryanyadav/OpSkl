-- Enable PostGIS for geospatial querying
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE,
  full_name TEXT NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('worker', 'client', 'both')),
  avatar_url TEXT,
  bio TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'India',
  is_email_verified BOOLEAN DEFAULT FALSE,
  is_phone_verified BOOLEAN DEFAULT FALSE,
  is_identity_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  is_suspended BOOLEAN DEFAULT FALSE,
  suspension_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::JSONB,
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON public.profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles viewable by all authenticated users"
  ON public.profiles FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can edit own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 2. WORKER PROFILES
CREATE TABLE IF NOT EXISTS public.worker_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  headline TEXT,
  hourly_rate DECIMAL(10, 2),
  experience_years INTEGER,
  education TEXT,
  certifications JSONB DEFAULT '[]'::JSONB,
  portfolio_url TEXT,
  portfolio_items JSONB DEFAULT '[]'::JSONB,
  is_available BOOLEAN DEFAULT TRUE,
  preferred_work_radius INTEGER DEFAULT 10, -- in kilometers
  work_days JSONB DEFAULT '["monday","tuesday","wednesday","thursday","friday"]'::JSONB,
  work_hours JSONB DEFAULT '{"start":"09:00","end":"18:00"}'::JSONB,
  total_gigs_completed INTEGER DEFAULT 0,
  total_earnings DECIMAL(12, 2) DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  success_rate DECIMAL(5, 2) DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_worker_profiles_available ON public.worker_profiles(is_available);
CREATE INDEX IF NOT EXISTS idx_worker_profiles_rating ON public.worker_profiles(average_rating DESC);

ALTER TABLE public.worker_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Worker profiles viewable by authenticated users"
  ON public.worker_profiles FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Workers can update own worker profile"
  ON public.worker_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- 3. SKILLS
CREATE TABLE IF NOT EXISTS public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  icon_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Skills are readable by authenticated users"
  ON public.skills FOR SELECT
  USING (auth.role() = 'authenticated');

-- Seed initial skills
INSERT INTO public.skills (name, slug, category) VALUES
  ('Plumbing', 'plumbing', 'Home Services'),
  ('Electrical Work', 'electrical', 'Home Services'),
  ('Carpentry', 'carpentry', 'Home Services'),
  ('Painting', 'painting', 'Home Services'),
  ('Web Development', 'web-dev', 'Technology'),
  ('Mobile Development', 'mobile-dev', 'Technology'),
  ('Graphic Design', 'graphic-design', 'Creative'),
  ('Content Writing', 'content-writing', 'Creative')
ON CONFLICT (slug) DO NOTHING;

-- 4. WORKER SKILLS (Junction)
CREATE TABLE IF NOT EXISTS public.worker_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  proficiency_level TEXT CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  years_of_experience INTEGER,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(worker_id, skill_id)
);

ALTER TABLE public.worker_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Worker skills viewable by everyone"
  ON public.worker_skills FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Workers can modify own skills"
  ON public.worker_skills FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.worker_profiles wp
      WHERE wp.id = worker_skills.worker_id
      AND wp.user_id = auth.uid()
    )
  );

-- 5. LOCATIONS
CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  geog GEOGRAPHY(POINT, 4326),
  formatted_address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  postal_code TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  location_type TEXT CHECK (location_type IN ('home', 'work', 'other')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_locations_geog ON public.locations USING GIST(geog);
CREATE INDEX IF NOT EXISTS idx_locations_user ON public.locations(user_id);

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Locations viewable by all authenticated users"
  ON public.locations FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage own locations"
  ON public.locations FOR ALL
  USING (auth.uid() = user_id);

-- PostGIS location triggers
CREATE OR REPLACE FUNCTION public.update_location_geog()
RETURNS TRIGGER AS $$
BEGIN
  NEW.geog = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_location_geog_trigger
  BEFORE INSERT OR UPDATE ON public.locations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_location_geog();

-- 6. GIGS
CREATE TABLE IF NOT EXISTS public.gigs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  skill_id UUID REFERENCES public.skills(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  budget_type TEXT NOT NULL CHECK (budget_type IN ('fixed', 'hourly')),
  budget_amount DECIMAL(10, 2) NOT NULL,
  budget_currency TEXT DEFAULT 'INR',
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  is_remote BOOLEAN DEFAULT FALSE,
  start_date DATE,
  end_date DATE,
  estimated_duration INTEGER, -- hours
  required_experience TEXT,
  required_skills JSONB DEFAULT '[]'::JSONB,
  attachments JSONB DEFAULT '[]'::JSONB,
  status TEXT DEFAULT 'open' CHECK (status IN ('draft', 'open', 'in_progress', 'completed', 'cancelled', 'disputed')),
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'invited_only')),
  assigned_worker_id UUID REFERENCES public.worker_profiles(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  bid_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::JSONB
);

CREATE INDEX IF NOT EXISTS idx_gigs_client ON public.gigs(client_id);
CREATE INDEX IF NOT EXISTS idx_gigs_status ON public.gigs(status);
CREATE INDEX IF NOT EXISTS idx_gigs_skill ON public.gigs(skill_id);

ALTER TABLE public.gigs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gigs viewable by all authenticated users"
  ON public.gigs FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Clients can create and manage their own gigs"
  ON public.gigs FOR ALL
  USING (auth.uid() = client_id);

-- 7. GIG BIDS
CREATE TABLE IF NOT EXISTS public.gig_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_id UUID NOT NULL REFERENCES public.gigs(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
  proposed_amount DECIMAL(10, 2) NOT NULL,
  proposed_duration INTEGER, -- hours
  cover_letter TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  UNIQUE(gig_id, worker_id)
);

ALTER TABLE public.gig_bids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bids viewable by gig client or bid worker"
  ON public.gig_bids FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.gigs g
      WHERE g.id = gig_bids.gig_id
      AND g.client_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.worker_profiles wp
      WHERE wp.id = gig_bids.worker_id
      AND wp.user_id = auth.uid()
    )
  );

CREATE POLICY "Workers can place/manage bids"
  ON public.gig_bids FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.worker_profiles wp
      WHERE wp.id = gig_bids.worker_id
      AND wp.user_id = auth.uid()
    )
  );

-- 8. WALLETS
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance DECIMAL(12, 2) DEFAULT 0 CHECK (balance >= 0),
  currency TEXT DEFAULT 'INR',
  held_balance DECIMAL(12, 2) DEFAULT 0 CHECK (held_balance >= 0),
  available_balance DECIMAL(12, 2) GENERATED ALWAYS AS (balance - held_balance) STORED,
  total_earned DECIMAL(12, 2) DEFAULT 0,
  total_spent DECIMAL(12, 2) DEFAULT 0,
  total_withdrawn DECIMAL(12, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  payment_methods JSONB DEFAULT '[]'::JSONB
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet"
  ON public.wallets FOR SELECT
  USING (auth.uid() = user_id);

-- 9. TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  to_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  currency TEXT DEFAULT 'INR',
  type TEXT NOT NULL CHECK (type IN ('payment', 'refund', 'withdrawal', 'deposit', 'fee', 'bonus')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  gig_id UUID REFERENCES public.gigs(id) ON DELETE SET NULL,
  reference_type TEXT,
  reference_id TEXT,
  payment_gateway TEXT,
  payment_gateway_transaction_id TEXT,
  payment_method TEXT,
  description TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::JSONB
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view transactions related to them"
  ON public.transactions FOR SELECT
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- 10. REVIEWS
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_id UUID NOT NULL REFERENCES public.gigs(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
  communication_rating INTEGER CHECK (communication_rating BETWEEN 1 AND 5),
  professionalism_rating INTEGER CHECK (professionalism_rating BETWEEN 1 AND 5),
  timeliness_rating INTEGER CHECK (timeliness_rating BETWEEN 1 AND 5),
  is_visible BOOLEAN DEFAULT TRUE,
  is_flagged BOOLEAN DEFAULT FALSE,
  flag_reason TEXT,
  response_text TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(gig_id, reviewer_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews viewable by everyone"
  ON public.reviews FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Reviewer can insert and update own review"
  ON public.reviews FOR ALL
  USING (auth.uid() = reviewer_id);

-- 11. MESSAGES
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'location', 'system')),
  attachments JSONB DEFAULT '[]'::JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  gig_id UUID REFERENCES public.gigs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON public.messages(receiver_id, is_read) WHERE is_read = FALSE;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their conversation messages"
  ON public.messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- 12. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  related_id UUID,
  related_type TEXT,
  action_url TEXT,
  action_data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  is_sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  push_sent BOOLEAN DEFAULT FALSE,
  email_sent BOOLEAN DEFAULT FALSE,
  sms_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = FALSE;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notification status"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- VIEWS & FUNCTIONS

-- 1. Get Nearby Workers Function
CREATE OR REPLACE FUNCTION public.get_nearby_workers(
  target_lat DECIMAL,
  target_lng DECIMAL,
  radius_km INTEGER DEFAULT 10,
  skill_filter UUID DEFAULT NULL
)
RETURNS TABLE (
  worker_id UUID,
  distance_km DECIMAL,
  profile JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wp.id AS worker_id,
    (ST_Distance(
      l.geog,
      ST_SetSRID(ST_MakePoint(target_lng, target_lat), 4326)::geography
    ) / 1000)::DECIMAL AS distance_km,
    jsonb_build_object(
      'user_id', p.id,
      'name', p.full_name,
      'avatar', p.avatar_url,
      'rating', wp.average_rating,
      'hourly_rate', wp.hourly_rate
    ) AS profile
  FROM public.worker_profiles wp
  JOIN public.profiles p ON wp.user_id = p.id
  JOIN public.locations l ON p.id = l.user_id AND l.is_primary = TRUE
  LEFT JOIN public.worker_skills ws ON wp.id = ws.worker_id
  WHERE wp.is_available = TRUE
    AND p.is_active = TRUE
    AND ST_DWithin(
      l.geog,
      ST_SetSRID(ST_MakePoint(target_lng, target_lat), 4326)::geography,
      radius_km * 1000
    )
    AND (skill_filter IS NULL OR ws.skill_id = skill_filter)
  ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql;

-- 2. Update Wallet Balance function
CREATE OR REPLACE FUNCTION public.update_wallet_balance(
  p_user_id UUID,
  p_amount DECIMAL,
  p_operation TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  current_balance DECIMAL;
BEGIN
  SELECT balance INTO current_balance
  FROM public.wallets
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  IF p_operation = 'add' THEN
    UPDATE public.wallets
    SET balance = balance + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;
  ELSIF p_operation = 'subtract' THEN
    IF current_balance >= p_amount THEN
      UPDATE public.wallets
      SET balance = balance - p_amount,
          updated_at = NOW()
    WHERE user_id = p_user_id;
    ELSE
      RAISE EXCEPTION 'Insufficient wallet balance';
    END IF;
  ELSE
    RAISE EXCEPTION 'Invalid operation type';
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- TRIGGERS

-- A. Auto create profile and wallet on Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into public profiles
  INSERT INTO public.profiles (id, email, full_name, user_type, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'OpSkl User'),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'both'),
    NEW.raw_user_meta_data->>'avatar_url'
  );

  -- Insert wallet for new user
  INSERT INTO public.wallets (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- B. Update worker stats on gig completion
CREATE OR REPLACE FUNCTION public.update_worker_stats_on_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.assigned_worker_id IS NOT NULL THEN
    UPDATE public.worker_profiles
    SET total_gigs_completed = total_gigs_completed + 1,
        total_earnings = total_earnings + NEW.budget_amount,
        updated_at = NOW()
    WHERE id = NEW.assigned_worker_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_worker_stats_trigger
  AFTER UPDATE ON public.gigs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_worker_stats_on_completion();

-- C. Generic update_updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_worker_profiles_updated_at
  BEFORE UPDATE ON public.worker_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_locations_updated_at
  BEFORE UPDATE ON public.locations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_gigs_updated_at
  BEFORE UPDATE ON public.gigs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_gig_bids_updated_at
  BEFORE UPDATE ON public.gig_bids
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
