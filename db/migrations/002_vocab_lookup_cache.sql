-- ============================================================
-- Migration 002: Vocab Lookup Cache (global)
-- ============================================================
-- One row per lowercase word — shared by all users so we only
-- pay OpenAI once per unique word, ever. Read-only for clients;
-- writes happen from the server with the service role key.
-- ============================================================

CREATE TABLE IF NOT EXISTS vocab_lookup_cache (
  word        TEXT PRIMARY KEY,
  definition  TEXT NOT NULL DEFAULT '',
  example     TEXT NOT NULL DEFAULT '',
  translation TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE vocab_lookup_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vocab_cache_read_all" ON vocab_lookup_cache;
CREATE POLICY "vocab_cache_read_all"
  ON vocab_lookup_cache FOR SELECT
  TO authenticated USING (true);
-- No INSERT/UPDATE policies — server uses service role to write.
