# OpSkl Database Schema

## Overview

OpSkl uses PostgreSQL 15 with PostGIS extension for geospatial capabilities. The database follows a normalized design with Row Level Security (RLS) enabled on all tables.

## Entity Relationship Diagram

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Users     │────────▶│   Profiles   │◀────────│  Locations  │
└─────────────┘         └──────────────┘         └─────────────┘
      │                        │
      │                        │
      ▼                        ▼
┌─────────────┐         ┌──────────────┐
│   Wallets   │         │ Worker Skills│
└─────────────┘         └──────────────┘
      │                        │
      │                        │
      ▼                        ▼
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│Transactions │         │     Gigs     │────────▶│  Gig Bids   │
└─────────────┘         └──────────────┘         └─────────────┘
                               │
                               │
                               ▼
                        ┌──────────────┐
                        │   Reviews    │
                        └──────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │   Messages   │
                        └──────────────┘
```

## Tables

### 1. Users (auth.users)

Managed by Supabase Auth, extended via triggers.

**Purpose**: Store authentication credentials and basic user information.

```sql
-- Managed by Supabase Auth
-- Fields: id, email, phone, created_at, updated_at, etc.
```

### 2. Profiles

**Purpose**: Store extended user profile information for both workers and clients.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE,
  full_name TEXT NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('worker', 'client', 'both')),
  avatar_url TEXT,
  bio TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  
  -- Address Information
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'India',
  
  -- Verification Status
  is_email_verified BOOLEAN DEFAULT FALSE,
  is_phone_verified BOOLEAN DEFAULT FALSE,
  is_identity_verified BOOLEAN DEFAULT FALSE,
  
  -- Account Status
  is_active BOOLEAN DEFAULT TRUE,
  is_suspended BOOLEAN DEFAULT FALSE,
  suspension_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB,
  
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- Indexes
CREATE INDEX idx_profiles_user_type ON profiles(user_type);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_phone ON profiles(phone);
CREATE INDEX idx_profiles_created_at ON profiles(created_at DESC);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Public profiles viewable by all authenticated users"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');
```

### 3. Worker Profiles

**Purpose**: Additional information specific to workers/freelancers.

```sql
CREATE TABLE worker_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Professional Information
  headline TEXT,
  hourly_rate DECIMAL(10, 2),
  experience_years INTEGER,
  education TEXT,
  certifications JSONB DEFAULT '[]'::JSONB,
  
  -- Portfolio
  portfolio_url TEXT,
  portfolio_items JSONB DEFAULT '[]'::JSONB,
  
  -- Availability
  is_available BOOLEAN DEFAULT TRUE,
  preferred_work_radius INTEGER DEFAULT 10, -- in kilometers
  work_days JSONB DEFAULT '["monday","tuesday","wednesday","thursday","friday"]'::JSONB,
  work_hours JSONB DEFAULT '{"start":"09:00","end":"18:00"}'::JSONB,
  
  -- Statistics
  total_gigs_completed INTEGER DEFAULT 0,
  total_earnings DECIMAL(12, 2) DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  success_rate DECIMAL(5, 2) DEFAULT 100,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Indexes
CREATE INDEX idx_worker_profiles_user_id ON worker_profiles(user_id);
CREATE INDEX idx_worker_profiles_available ON worker_profiles(is_available);
CREATE INDEX idx_worker_profiles_rating ON worker_profiles(average_rating DESC);
```

### 4. Skills

**Purpose**: Master table of available skills/categories.

```sql
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  icon_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sample Data
INSERT INTO skills (name, slug, category) VALUES
  ('Plumbing', 'plumbing', 'Home Services'),
  ('Electrical Work', 'electrical', 'Home Services'),
  ('Carpentry', 'carpentry', 'Home Services'),
  ('Painting', 'painting', 'Home Services'),
  ('Web Development', 'web-dev', 'Technology'),
  ('Mobile Development', 'mobile-dev', 'Technology'),
  ('Graphic Design', 'graphic-design', 'Creative'),
  ('Content Writing', 'content-writing', 'Creative');
```

### 5. Worker Skills

**Purpose**: Junction table linking workers to their skills.

```sql
CREATE TABLE worker_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id UUID NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  proficiency_level TEXT CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  years_of_experience INTEGER,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(worker_id, skill_id)
);

-- Indexes
CREATE INDEX idx_worker_skills_worker ON worker_skills(worker_id);
CREATE INDEX idx_worker_skills_skill ON worker_skills(skill_id);
```

### 6. Locations

**Purpose**: Store user locations with geospatial capabilities.

```sql
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Location Data
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  geog GEOGRAPHY(POINT, 4326), -- PostGIS geography point
  
  -- Address
  formatted_address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  postal_code TEXT,
  
  -- Metadata
  is_primary BOOLEAN DEFAULT FALSE,
  location_type TEXT CHECK (location_type IN ('home', 'work', 'other')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_locations_user ON locations(user_id);
CREATE INDEX idx_locations_geog ON locations USING GIST(geog);
CREATE INDEX idx_locations_primary ON locations(user_id, is_primary);

-- Trigger to update geog from lat/long
CREATE OR REPLACE FUNCTION update_location_geog()
RETURNS TRIGGER AS $$
BEGIN
  NEW.geog = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_location_geog_trigger
  BEFORE INSERT OR UPDATE ON locations
  FOR EACH ROW
  EXECUTE FUNCTION update_location_geog();
```

### 7. Gigs

**Purpose**: Store job postings from clients.

```sql
CREATE TABLE gigs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Gig Information
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  skill_id UUID REFERENCES skills(id),
  category TEXT NOT NULL,
  
 -- Budget
  budget_type TEXT NOT NULL CHECK (budget_type IN ('fixed', 'hourly')),
  budget_amount DECIMAL(10, 2) NOT NULL,
  budget_currency TEXT DEFAULT 'INR',
  
  -- Location
  location_id UUID REFERENCES locations(id),
  is_remote BOOLEAN DEFAULT FALSE,
  
  -- Timeline
  start_date DATE,
  end_date DATE,
  estimated_duration INTEGER, -- in hours
  
  -- Requirements
  required_experience TEXT,
  required_skills JSONB DEFAULT '[]'::JSONB,
  attachments JSONB DEFAULT '[]'::JSONB,
  
  -- Status
  status TEXT DEFAULT 'open' CHECK (status IN ('draft', 'open', 'in_progress', 'completed', 'cancelled', 'disputed')),
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'invited_only')),
  
  -- Assignment
  assigned_worker_id UUID REFERENCES worker_profiles(id),
  assigned_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Statistics
  view_count INTEGER DEFAULT 0,
  bid_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB
);

-- Indexes
CREATE INDEX idx_gigs_client ON gigs(client_id);
CREATE INDEX idx_gigs_status ON gigs(status);
CREATE INDEX idx_gigs_skill ON gigs(skill_id);
CREATE INDEX idx_gigs_created_at ON gigs(created_at DESC);
CREATE INDEX idx_gigs_assigned_worker ON gigs(assigned_worker_id);
```

### 8. Gig Bids

**Purpose**: Store worker bids/proposals for gigs.

```sql
CREATE TABLE gig_bids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gig_id UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
  
  -- Bid Information
  proposed_amount DECIMAL(10, 2) NOT NULL,
  proposed_duration INTEGER, -- in hours
  cover_letter TEXT NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  
  UNIQUE(gig_id, worker_id)
);

-- Indexes
CREATE INDEX idx_gig_bids_gig ON gig_bids(gig_id);
CREATE INDEX idx_gig_bids_worker ON gig_bids(worker_id);
CREATE INDEX idx_gig_bids_status ON gig_bids(status);
```

### 9. Wallets

**Purpose**: Store user wallet balances and payment information.

```sql
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Balance
  balance DECIMAL(12, 2) DEFAULT 0 CHECK (balance >= 0),
  currency TEXT DEFAULT 'INR',
  
  -- Holds
  held_balance DECIMAL(12, 2) DEFAULT 0,
  available_balance DECIMAL(12, 2) GENERATED ALWAYS AS (balance - held_balance) STORED,
  
  -- Lifetime Stats
  total_earned DECIMAL(12, 2) DEFAULT 0,
  total_spent DECIMAL(12, 2) DEFAULT 0,
  total_withdrawn DECIMAL(12, 2) DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata
  payment_methods JSONB DEFAULT '[]'::JSONB
);

-- Indexes
CREATE INDEX idx_wallets_user ON wallets(user_id);
```

### 10. Transactions

**Purpose**: Record all financial transactions.

```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Parties
  from_user_id UUID REFERENCES profiles(id),
  to_user_id UUID REFERENCES profiles(id),
  
  -- Transaction Details
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  currency TEXT DEFAULT 'INR',
  type TEXT NOT NULL CHECK (type IN ('payment', 'refund', 'withdrawal', 'deposit', 'fee', 'bonus')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  
  -- References
  gig_id UUID REFERENCES gigs(id),
  reference_type TEXT,
  reference_id TEXT,
  
  -- Payment Gateway
  payment_gateway TEXT,
  payment_gateway_transaction_id TEXT,
  payment_method TEXT,
  
  -- Description
  description TEXT,
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB
);

-- Indexes
CREATE INDEX idx_transactions_from_user ON transactions(from_user_id);
CREATE INDEX idx_transactions_to_user ON transactions(to_user_id);
CREATE INDEX idx_transactions_gig ON transactions(gig_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_payment_gateway_id ON transactions(payment_gateway_transaction_id);
```

### 11. Reviews

**Purpose**: Store ratings and reviews for completed gigs.

```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gig_id UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
  
  -- Parties
  reviewer_id UUID NOT NULL REFERENCES profiles(id),
  reviewee_id UUID NOT NULL REFERENCES profiles(id),
  
  -- Review Content
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  
  -- Category Ratings
  quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
  communication_rating INTEGER CHECK (communication_rating BETWEEN 1 AND 5),
  professionalism_rating INTEGER CHECK (professionalism_rating BETWEEN 1 AND 5),
  timeliness_rating INTEGER CHECK (timeliness_rating BETWEEN 1 AND 5),
  
  -- Status
  is_visible BOOLEAN DEFAULT TRUE,
  is_flagged BOOLEAN DEFAULT FALSE,
  flag_reason TEXT,
  
  -- Response
  response_text TEXT,
  responded_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(gig_id, reviewer_id)
);

-- Indexes
CREATE INDEX idx_reviews_gig ON reviews(gig_id);
CREATE INDEX idx_reviews_reviewer ON reviews(reviewer_id);
CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
```

### 12. Messages

**Purpose**: Store chat messages between users.

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL,
  
  -- Parties
  sender_id UUID NOT NULL REFERENCES profiles(id),
  receiver_id UUID NOT NULL REFERENCES profiles(id),
  
  -- Message Content
  message_text TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'location', 'system')),
  attachments JSONB DEFAULT '[]'::JSONB,
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  
  -- Related Gig
  gig_id UUID REFERENCES gigs(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_unread ON messages(receiver_id, is_read) WHERE is_read = FALSE;
```

### 13. Notifications

**Purpose**: Store user notifications and alerts.

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Notification Content
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  
  -- Related Entities
  related_id UUID,
  related_type TEXT,
  
  -- Actions
  action_url TEXT,
  action_data JSONB,
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  is_sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  
  -- Delivery Channels
  push_sent BOOLEAN DEFAULT FALSE,
  email_sent BOOLEAN DEFAULT FALSE,
  sms_sent BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```

## Views

### 1. Active Gigs View

```sql
CREATE OR REPLACE VIEW active_gigs_view AS
SELECT 
  g.*,
  p.full_name AS client_name,
  p.avatar_url AS client_avatar,
  s.name AS skill_name,
  l.formatted_address,
  l.geog,
  COUNT(DISTINCT gb.id) AS bid_count
FROM gigs g
LEFT JOIN profiles p ON g.client_id = p.id
LEFT JOIN skills s ON g.skill_id = s.id
LEFT JOIN locations l ON g.location_id = l.id
LEFT JOIN gig_bids gb ON g.id = gb.gig_id
WHERE g.status = 'open'
  AND g.expires_at > NOW()
GROUP BY g.id, p.id, s.id, l.id;
```

### 2. Worker Stats View

```sql
CREATE OR REPLACE VIEW worker_stats_view AS
SELECT 
  wp.user_id,
  wp.total_gigs_completed,
  wp.total_earnings,
  wp.average_rating,
  wp.success_rate,
  COUNT(DISTINCT ws.skill_id) AS total_skills,
  ARRAY_AGG(DISTINCT s.name) AS skills_list
FROM worker_profiles wp
LEFT JOIN worker_skills ws ON wp.id = ws.worker_id
LEFT JOIN skills s ON ws.skill_id = s.id
GROUP BY wp.user_id, wp.total_gigs_completed, wp.total_earnings, wp.average_rating, wp.success_rate;
```

## Functions

### 1. Get Nearby Workers

```sql
CREATE OR REPLACE FUNCTION get_nearby_workers(
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
    wp.user_id,
    ST_Distance(
      l.geog,
      ST_SetSRID(ST_MakePoint(target_lng, target_lat), 4326)::geography
    ) / 1000 AS distance_km,
    jsonb_build_object(
      'name', p.full_name,
      'avatar', p.avatar_url,
      'rating', wp.average_rating,
      'hourly_rate', wp.hourly_rate
    ) AS profile
  FROM worker_profiles wp
  JOIN profiles p ON wp.user_id = p.id
  JOIN locations l ON p.id = l.user_id AND l.is_primary = TRUE
  LEFT JOIN worker_skills ws ON wp.id = ws.worker_id
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
```

### 2. Update Wallet Balance

```sql
CREATE OR REPLACE FUNCTION update_wallet_balance(
  p_user_id UUID,
  p_amount DECIMAL,
  p_operation TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  current_balance DECIMAL;
BEGIN
  -- Get current balance
  SELECT balance INTO current_balance
  FROM wallets
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  -- Update based on operation
  IF p_operation = 'add' THEN
    UPDATE wallets
    SET balance = balance + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;
  ELSIF p_operation = 'subtract' THEN
    IF current_balance >= p_amount THEN
      UPDATE wallets
      SET balance = balance - p_amount,
          updated_at = NOW()
      WHERE user_id = p_user_id;
    ELSE
      RAISE EXCEPTION 'Insufficient balance';
    END IF;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
```

## Triggers

### 1. Update Timestamp Trigger

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Repeat for other tables...
```

### 2. Create Wallet on User Registration

```sql
CREATE OR REPLACE FUNCTION create_wallet_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO wallets (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_wallet_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_wallet_for_new_user();
```

### 3. Update Worker Stats on Gig Completion

```sql
CREATE OR REPLACE FUNCTION update_worker_stats_on_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE worker_profiles
    SET total_gigs_completed = total_gigs_completed + 1,
        total_earnings = total_earnings + NEW.budget_amount
    WHERE id = NEW.assigned_worker_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_worker_stats_trigger
  AFTER UPDATE ON gigs
  FOR EACH ROW
  EXECUTE FUNCTION update_worker_stats_on_completion();
```

## Indexes Strategy

### Performance Optimization

1. **Primary Keys**: Automatic B-tree index
2. **Foreign Keys**: Indexed for join performance
3. **Search Fields**: Full-text search indexes on text fields
4. **Geospatial**: GiST indexes on geography columns
5. **Timestamp**: Indexes on created_at for chronological queries
6. **Status Fields**: Partial indexes on status columns

## Partitioning Strategy

For high-volume tables, implement time-based partitioning:

```sql
-- Example: Partition messages by month
CREATE TABLE messages_2026_01 PARTITION OF messages
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
```

## Backup & Maintenance

### Automated Backups
- **Frequency**: Daily at 2:00 AM UTC
- **Retention**: 30 days
- **Type**: Full backup with point-in-time recovery

### Maintenance Tasks
- **VACUUM**: Weekly on Sunday at 3:00 AM
- **ANALYZE**: Daily at 4:00 AM
- **Index Rebuild**: Monthly

---

**Schema Version**: 1.0  
**Last Updated**: 2026-01-09  
**Database**: PostgreSQL 15 with PostGIS
