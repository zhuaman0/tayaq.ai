import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { serverSupabaseUser } from '#supabase/server'
import { checkRateLimit } from '~~/server/utils/rateLimit'

interface LookupResult {
  definition: string
  example: string
  translation: string
}

export default defineEventHandler(async (event) => {
  // ─── Auth ────────────────────────────────────────────────
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  // ─── Rate limit (20 lookups / 5 min / user) ──────────────
  await checkRateLimit(event, { bucket: 'vocab-lookup', windowMs: 5 * 60_000, max: 20 }, user.id)

  // ─── Validate ────────────────────────────────────────────
  const { word } = await readBody<{ word: string }>(event)
  if (!word?.trim()) throw createError({ statusCode: 400, statusMessage: 'word is required' })
  const normalized = word.trim().toLowerCase()

  const config = useRuntimeConfig()

  // ─── Global cache lookup (service-role bypasses RLS) ─────
  // Migration 002 creates `vocab_lookup_cache`; until that migration is
  // applied this block fails open — we just skip the cache and call OpenAI.
  const supabaseUrl = process.env.SUPABASE_URL
  const serviceKey = config.supabaseServiceKey
  const cacheClient =
    supabaseUrl && serviceKey
      ? createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
      : null

  if (cacheClient) {
    const { data: cached } = await cacheClient
      .from('vocab_lookup_cache')
      .select('definition, example, translation')
      .eq('word', normalized)
      .maybeSingle()
    if (cached) return cached as LookupResult
  }

  // ─── OpenAI call ─────────────────────────────────────────
  const openai = new OpenAI({ apiKey: config.openaiApiKey })

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: 'You are a bilingual English-Kazakh dictionary. Return ONLY valid JSON.',
      },
      {
        role: 'user',
        content: `For the English word "${normalized}", return exactly this JSON:
{
  "definition": "short English definition (1 sentence, no more than 15 words)",
  "example": "one natural example sentence using the word",
  "translation": "Kazakh translation of the word (1-3 words only)"
}`,
      },
    ],
    temperature: 0.3,
    max_tokens: 200,
  })

  const raw = response.choices[0]?.message?.content?.trim() || '{}'
  let parsed: LookupResult
  try {
    parsed = JSON.parse(raw)
  } catch {
    parsed = { definition: '', example: '', translation: '' }
  }

  // ─── Write to cache (best-effort) ────────────────────────
  if (cacheClient && parsed.definition) {
    cacheClient
      .from('vocab_lookup_cache')
      .upsert(
        {
          word: normalized,
          definition: parsed.definition,
          example: parsed.example,
          translation: parsed.translation,
        },
        { onConflict: 'word' },
      )
      .then(({ error }) => {
        if (error) console.warn('vocab cache upsert failed:', error.message)
      })
  }

  return parsed
})
