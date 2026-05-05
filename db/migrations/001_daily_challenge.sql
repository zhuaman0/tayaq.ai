-- ============================================================
-- Migration 001: Daily Challenge
-- ============================================================
-- Adds the "translate this Kazakh sentence to English" feature.
-- One challenge per calendar date, shared globally across users.
-- Completion grants bonus XP but does NOT gate the streak.
-- ============================================================

CREATE TABLE IF NOT EXISTS daily_challenges (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date            DATE UNIQUE NOT NULL,
  kazakh_sentence TEXT NOT NULL,
  expected_english TEXT NOT NULL,
  difficulty      TEXT NOT NULL DEFAULT 'medium',
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_daily_challenges_date ON daily_challenges(date DESC);

CREATE TABLE IF NOT EXISTS daily_challenge_completions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id  UUID NOT NULL REFERENCES daily_challenges(id) ON DELETE CASCADE,
  user_answer   TEXT NOT NULL,
  is_correct    BOOLEAN NOT NULL,
  score         INT NOT NULL CHECK (score BETWEEN 0 AND 100),
  feedback      TEXT,
  xp_awarded    INT NOT NULL DEFAULT 0,
  completed_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, challenge_id)
);

CREATE INDEX IF NOT EXISTS idx_dcc_user ON daily_challenge_completions(user_id, completed_at DESC);

-- ─── RLS ────────────────────────────────────────────────────
ALTER TABLE daily_challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "daily_challenges_read_authed" ON daily_challenges;
CREATE POLICY "daily_challenges_read_authed"
  ON daily_challenges FOR SELECT
  TO authenticated USING (true);

ALTER TABLE daily_challenge_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dcc_select_own" ON daily_challenge_completions;
CREATE POLICY "dcc_select_own"
  ON daily_challenge_completions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "dcc_insert_own" ON daily_challenge_completions;
CREATE POLICY "dcc_insert_own"
  ON daily_challenge_completions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
