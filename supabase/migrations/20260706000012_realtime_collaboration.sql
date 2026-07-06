-- Epic 5: Real-time Communication, Chat Rooms, and Push Notifications

-- 1. CHAT ROOMS TABLE
CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on Chat Rooms
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;

-- 2. CHAT ROOM PARTICIPANTS TABLE
CREATE TABLE IF NOT EXISTS public.chat_room_participants (
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (room_id, user_id)
);

-- Enable RLS on Participants
ALTER TABLE public.chat_room_participants ENABLE ROW LEVEL SECURITY;

-- Participants policies
CREATE POLICY "Users can view participants in own rooms"
  ON public.chat_room_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_room_participants p
      WHERE p.room_id = chat_room_participants.room_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add themselves to rooms"
  ON public.chat_room_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Chat rooms policy: select allowed if participant
CREATE POLICY "Users can view own chat rooms"
  ON public.chat_rooms FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_room_participants p
      WHERE p.room_id = chat_rooms.id
      AND p.user_id = auth.uid()
    )
  );

-- 3. LINK MESSAGES TABLE TO CHAT ROOMS
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE;

-- Index for speedy room queries
CREATE INDEX IF NOT EXISTS idx_messages_room ON public.messages(room_id);

-- Re-apply Messages RLS Policy to check room membership
DROP POLICY IF EXISTS "Users can view messages in their room" ON public.messages;
CREATE POLICY "Users can view messages in their room"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_room_participants p
      WHERE p.room_id = messages.room_id
      AND p.user_id = auth.uid()
    )
  );

-- 4. PUSH TOKENS REGISTRY TABLE
CREATE TABLE IF NOT EXISTS public.push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  device_type TEXT NOT NULL CHECK (device_type IN ('ios', 'android', 'web')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON public.push_tokens(user_id);

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- Push Token Policies
CREATE POLICY "Users can manage own push tokens"
  ON public.push_tokens FOR ALL
  USING (auth.uid() = user_id);

-- 5. NOTIFICATION PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  chat_push BOOLEAN DEFAULT TRUE,
  match_push BOOLEAN DEFAULT TRUE,
  payment_push BOOLEAN DEFAULT TRUE,
  dispute_push BOOLEAN DEFAULT TRUE,
  marketing_push BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Preference Policies
CREATE POLICY "Users can manage own notification preferences"
  ON public.notification_preferences FOR ALL
  USING (auth.uid() = user_id);

-- Trigger to automatically create preferences profile on user creation
CREATE OR REPLACE FUNCTION public.create_user_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_profile_create_setup_preferences
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_user_notification_preferences();

-- Update timestamp triggers
CREATE OR REPLACE TRIGGER update_push_tokens_updated_at
  BEFORE UPDATE ON public.push_tokens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
