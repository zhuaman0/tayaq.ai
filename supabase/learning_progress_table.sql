-- ==========================================
-- Tayaq.ai — Learning progress tracking
-- Run this SQL in: Supabase Dashboard → SQL Editor
-- ==========================================
--
-- subject_id is a TEXT primary key so it works for both:
--   * anonymous users (device_id from localStorage UUID)
--   * authenticated users (auth.users.id cast to text)
--
-- Server reads/writes always go through the service role key, bypassing
-- RLS — so the row is owned by whoever holds the device_id (acceptable
-- for a learning-progress table that does not expose sensitive data).

CREATE TABLE IF NOT EXISTS learning_progress (
  subject_id TEXT PRIMARY KEY,
  level TEXT NOT NULL DEFAULT 'beginner',           -- 'beginner' | 'intermediate' | 'advanced'
  current_topic_slug TEXT,                          -- topic the user is currently on
  mastered_topics TEXT[] NOT NULL DEFAULT '{}',     -- list of topic slugs the user has finished
  session_count INTEGER NOT NULL DEFAULT 0,
  total_seconds INTEGER NOT NULL DEFAULT 0,         -- cumulative voice minutes (cost tracking)
  last_session_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for browsing recent learners (admin / leaderboard)
CREATE INDEX IF NOT EXISTS idx_learning_progress_last_session
  ON learning_progress (last_session_at DESC);

-- RLS: service-role only by default. We do NOT add SELECT/INSERT/UPDATE
-- policies for the anon role — all access is server-side via service key.
ALTER TABLE learning_progress ENABLE ROW LEVEL SECURITY;

-- Auto-bump updated_at on any update
CREATE OR REPLACE FUNCTION public.touch_learning_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_learning_progress_updated_at ON learning_progress;
CREATE TRIGGER trg_learning_progress_updated_at
  BEFORE UPDATE ON learning_progress
  FOR EACH ROW EXECUTE FUNCTION public.touch_learning_progress_updated_at();
