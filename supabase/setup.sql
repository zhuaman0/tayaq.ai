-- ==========================================
-- Tayaq.ai — Supabase Database Setup
-- Run this SQL in: Supabase Dashboard → SQL Editor
-- ==========================================

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT,
  avatar_url TEXT,
  total_xp INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  total_roasts INTEGER DEFAULT 0,
  last_login_at DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- If table already exists, add columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login_at DATE DEFAULT CURRENT_DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS h3_index TEXT;

-- 2. Enable RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. Allow users to read all profiles (for leaderboard + community)
DO $$ BEGIN
  CREATE POLICY "Profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4. Allow users to update their own profile
DO $$ BEGIN
  CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 5. Allow users to insert their own profile
DO $$ BEGIN
  CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 6. Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, streak_days, last_login_at)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)), 1, CURRENT_DATE);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Trigger to call function on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- MESSAGES TABLE — for community chat
-- ==========================================

CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users can read messages where they are sender or receiver
DO $$ BEGIN
  CREATE POLICY "Users can read own messages"
    ON messages FOR SELECT
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Users can send messages (insert where they are sender)
DO $$ BEGIN
  CREATE POLICY "Users can send messages"
    ON messages FOR INSERT
    WITH CHECK (auth.uid() = sender_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Users can mark messages as read
DO $$ BEGIN
  CREATE POLICY "Users can update received messages"
    ON messages FOR UPDATE
    USING (auth.uid() = receiver_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ==========================================
-- CHAT SESSIONS TABLE — AI tutor conversations
-- ==========================================

CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  roast_level INTEGER DEFAULT 1,
  h3_index TEXT,
  messages_count INTEGER DEFAULT 0,
  mistakes_found INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can read own sessions"
    ON chat_sessions FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can create own sessions"
    ON chat_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own sessions"
    ON chat_sessions FOR UPDATE
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ==========================================
-- AUDIT LOG TABLE — Tracks all system events
-- ==========================================

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  h3_index TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Audit log is read-only for admins, insert-only for service role
-- No user-facing SELECT policy — only service role can read

-- ==========================================
-- DAILY STATS TABLE — Aggregated analytics
-- ==========================================

CREATE TABLE IF NOT EXISTS daily_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stat_date DATE NOT NULL,
  city TEXT,
  h3_index TEXT,
  total_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  sessions_started INTEGER DEFAULT 0,
  total_xp_earned INTEGER DEFAULT 0,
  total_mistakes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(stat_date, city)
);

ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;

-- Anyone can read stats (for dashboard)
DO $$ BEGIN
  CREATE POLICY "Stats are viewable by everyone"
    ON daily_stats FOR SELECT
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
