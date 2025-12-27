-- 🛡️ SUPABASE ROW LEVEL SECURITY (RLS) POLICIES
-- Apply these in your Supabase SQL Editor to secure the 'OpSkl' node.

-- ENABLE RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE gigs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 👤 PROFILES
-- Publicly readable, but only owner can update.
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 💼 GIGS
-- All open gigs are viewable. Clients can manage their own.
CREATE POLICY "Open gigs are viewable by everyone" ON gigs FOR SELECT USING (status = 'open' OR auth.uid() = client_id OR auth.uid() = assigned_worker_id);
CREATE POLICY "Clients can insert their own gigs" ON gigs FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Clients can update their own gigs" ON gigs FOR UPDATE USING (auth.uid() = client_id);

-- 📝 APPLICATIONS
-- Workers can see their own. Clients can see applications for their gigs.
CREATE POLICY "Workers can view their own applications" ON applications FOR SELECT USING (auth.uid() = worker_id);
CREATE POLICY "Clients can view applications for their gigs" ON applications FOR SELECT USING (
    EXISTS (SELECT 1 FROM gigs WHERE gigs.id = applications.gig_id AND gigs.client_id = auth.uid())
);
CREATE POLICY "Workers can apply for gigs" ON applications FOR INSERT WITH CHECK (auth.uid() = worker_id);
CREATE POLICY "Participants can update applications" ON applications FOR UPDATE USING (
    auth.uid() = worker_id OR EXISTS (SELECT 1 FROM gigs WHERE gigs.id = applications.gig_id AND gigs.client_id = auth.uid())
);

-- 💰 WALLETS & TRANSACTIONS
-- Strictly private.
CREATE POLICY "Users can view their own wallet" ON wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);

-- 💬 CHAT
-- Room access restricted to participants.
CREATE POLICY "Users can view participate rooms" ON chat_rooms FOR SELECT USING (
    EXISTS (SELECT 1 FROM gigs WHERE gigs.id = chat_rooms.gig_id AND (gigs.client_id = auth.uid() OR gigs.assigned_worker_id = auth.uid()))
);
CREATE POLICY "Users can view room messages" ON messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM chat_rooms WHERE chat_rooms.id = messages.room_id)
);
CREATE POLICY "Users can insert messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
