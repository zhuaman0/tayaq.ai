import OpenAI from 'openai'
import { createHash } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { serverSupabaseUser } from '#supabase/server'
import { checkRateLimit } from '~~/server/utils/rateLimit'

const TTS_BUCKET = 'tts-cache'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event).catch(() => null)
  // TTS is the cheapest of the three but called per-sentence during streaming
  // — keep the cap loose enough that a long reply doesn't get cut off.
  await checkRateLimit(event, { bucket: 'tts', windowMs: 60_000, max: 60 }, user?.id)

  const config = useRuntimeConfig()
  const { text, voice = 'nova' } = await readBody<{ text: string; voice?: string }>(event)

  if (!text?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'text is required' })
  }

  const cleanText = text.trim()
  const key = createHash('sha256').update(`${voice}:${cleanText}`).digest('hex')
  const storagePath = `${key}.mp3`

  // ─── Cache lookup ────────────────────────────────────────
  // Migrations 003 creates `tts_cache` + `tts-cache` storage bucket.
  // Until applied, this fails open and we re-synth every request.
  const supabaseUrl = process.env.SUPABASE_URL
  const serviceKey = config.supabaseServiceKey
  const cacheClient =
    supabaseUrl && serviceKey
      ? createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
      : null

  if (cacheClient) {
    const { data: row } = await cacheClient
      .from('tts_cache')
      .select('storage_path, byte_length')
      .eq('key', key)
      .maybeSingle()

    if (row?.storage_path) {
      const { data: blob, error: dlError } = await cacheClient.storage
        .from(TTS_BUCKET)
        .download(row.storage_path)
      if (!dlError && blob) {
        const buf = Buffer.from(await blob.arrayBuffer())
        setResponseHeaders(event, {
          'Content-Type': 'audio/mpeg',
          'Content-Length': String(buf.length),
          'X-TTS-Cache': 'HIT',
        })
        return buf
      }
    }
  }

  // ─── Synthesize ──────────────────────────────────────────
  const openai = new OpenAI({ apiKey: config.openaiApiKey })

  const response = await openai.audio.speech.create({
    model: 'tts-1-hd',
    voice,
    input: cleanText,
    response_format: 'mp3',
  })

  const buffer = Buffer.from(await response.arrayBuffer())

  // ─── Write cache (best-effort, non-blocking) ─────────────
  if (cacheClient) {
    cacheClient.storage
      .from(TTS_BUCKET)
      .upload(storagePath, buffer, { contentType: 'audio/mpeg', upsert: true })
      .then(({ error }) => {
        if (error) {
          console.warn('tts cache upload failed:', error.message)
          return
        }
        return cacheClient.from('tts_cache').upsert(
          {
            key,
            voice,
            text_preview: cleanText.slice(0, 200),
            storage_path: storagePath,
            byte_length: buffer.length,
          },
          { onConflict: 'key' },
        )
      })
  }

  setResponseHeaders(event, {
    'Content-Type': 'audio/mpeg',
    'Content-Length': String(buffer.length),
    'X-TTS-Cache': 'MISS',
  })

  return buffer
})
