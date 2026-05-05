-- Vocabulary tables for Tayaq.ai
-- Run this in: Supabase Dashboard → SQL Editor

-- 1. Word Collections (must come first — vocabulary references it)
CREATE TABLE IF NOT EXISTS public.vocab_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '📚',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vocab_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own collections"
  ON public.vocab_collections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own collections"
  ON public.vocab_collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections"
  ON public.vocab_collections FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS vocab_collections_user_id_idx ON public.vocab_collections(user_id);

-- 2. Vocabulary Words
CREATE TABLE IF NOT EXISTS public.vocabulary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  collection_id UUID REFERENCES public.vocab_collections(id) ON DELETE SET NULL,
  word TEXT NOT NULL,
  definition TEXT NOT NULL DEFAULT '',
  example TEXT NOT NULL DEFAULT '',
  translation TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vocabulary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own vocab"
  ON public.vocabulary FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vocab"
  ON public.vocabulary FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vocab"
  ON public.vocabulary FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own vocab"
  ON public.vocabulary FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS vocabulary_user_id_idx ON public.vocabulary(user_id);
