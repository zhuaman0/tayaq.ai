-- ============================================================
-- Migration 003: TTS Cache
-- ============================================================
-- Caches synthesized speech keyed by sha256(voice + ':' + text).
-- The audio bytes themselves live in the `tts-cache` Supabase
-- Storage bucket; this table just maps key → storage path so we
-- can avoid a HEAD request on every cache check.
-- ============================================================

CREATE TABLE IF NOT EXISTS tts_cache (
  key          TEXT PRIMARY KEY,        -- sha256(voice + ':' + text)
  voice        TEXT NOT NULL,
  text_preview TEXT NOT NULL,           -- first 200 chars, for debugging
  storage_path TEXT NOT NULL,           -- e.g. 'tts-cache/abc123.mp3'
  byte_length  INT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE tts_cache ENABLE ROW LEVEL SECURITY;
-- No client policies — server uses service role.

-- ─── Storage bucket ──────────────────────────────────────────
-- Run this in the Supabase SQL editor (or via dashboard):
--
--   INSERT INTO storage.buckets (id, name, public)
--   VALUES ('tts-cache', 'tts-cache', true)
--   ON CONFLICT (id) DO NOTHING;
--
-- We make it public so the audio URLs can be served directly to
-- the browser without re-signing. If you need privacy, change to
-- private + use signed URLs in the API handler.
