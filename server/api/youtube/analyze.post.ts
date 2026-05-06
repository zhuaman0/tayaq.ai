import { YoutubeTranscript } from 'youtube-transcript'
import { Supadata } from '@supadata/js'
import OpenAI from 'openai'

interface VocabWord {
  word: string
  definition: string
  example: string
  translation: string
}

interface TranscriptChunk {
  text: string
  offset: number // seconds
}

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/,
    /youtube\.com\/watch\?.*&v=([A-Za-z0-9_-]{11})/,
  ]
  for (const re of patterns) {
    const m = url.match(re)
    if (m) return m[1] ?? null
  }
  return null
}

/**
 * Fetch transcript via Supadata (works on Vercel — youtube-transcript does not).
 * Returns null if the API key is missing or Supadata can't find a transcript;
 * caller falls back to youtube-transcript (works locally on residential IPs).
 */
async function fetchViaSupadata(videoId: string, apiKey: string): Promise<TranscriptChunk[] | null> {
  try {
    const supadata = new Supadata({ apiKey })
    const result = await supadata.youtube.transcript({
      videoId,
      lang: 'en',
      text: false,
    }) as { content?: Array<{ text: string; offset: number; duration?: number }> }

    if (!result?.content || !Array.isArray(result.content)) return null
    return result.content.map((c) => ({
      text: c.text,
      offset: Math.floor((c.offset ?? 0) / 1000),
    }))
  } catch (err: any) {
    const status = err?.statusCode ?? err?.status
    // 404 = no captions, 403 = restricted — bubble up the original 422 message
    if (status === 404) return null
    if (status === 403) {
      throw createError({
        statusCode: 422,
        statusMessage: 'This video is private, age-restricted, or region-locked.',
      })
    }
    console.error('[supadata] transcript error:', err?.message || err)
    return null
  }
}

/**
 * Direct YouTube scrape via `youtube-transcript`. Works on residential IPs
 * (local dev), blocked on Vercel — use Supadata in production.
 */
async function fetchViaScraper(videoId: string): Promise<TranscriptChunk[] | null> {
  try {
    const raw = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' })
    return raw.map((t) => ({
      text: t.text.replace(/\[.*?\]/g, '').trim(),
      offset: Math.floor(t.offset / 1000),
    })).filter((t) => t.text)
  } catch {
    try {
      const raw = await YoutubeTranscript.fetchTranscript(videoId)
      return raw.map((t) => ({
        text: t.text.replace(/\[.*?\]/g, '').trim(),
        offset: Math.floor(t.offset / 1000),
      })).filter((t) => t.text)
    } catch {
      return null
    }
  }
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { url, transcript } = await readBody<{ url: string; transcript?: string }>(event)

  if (!url?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'YouTube URL is required' })
  }

  const videoId = extractVideoId(url.trim())
  if (!videoId) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid YouTube URL' })
  }

  // Strategy:
  // 1. If user supplied a manual transcript → use it directly (skips YouTube fetch)
  // 2. If Supadata key configured → use Supadata
  // 3. Otherwise → fall back to youtube-transcript scraper
  //    (works on residential IPs / local dev, blocked on Vercel)
  let segments: TranscriptChunk[] | null = null
  let usedManualPaste = false

  const pasted = transcript?.trim() ?? ''
  if (pasted.length >= 50) {
    // Treat each line as a segment so the UI can still show the transcript
    // even though we don't have real timestamps.
    segments = pasted
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((text, i) => ({ text, offset: i * 5 })) // synthetic 5s spacing
    usedManualPaste = true
  }

  if (!segments && config.supadataApiKey) {
    segments = await fetchViaSupadata(videoId, config.supadataApiKey)
  }

  if (!segments) {
    segments = await fetchViaScraper(videoId)
  }

  if (!segments || !segments.length) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Could not fetch transcript automatically. Open the video on YouTube, click "Show transcript" below it, copy the text, and paste it into the manual transcript field.',
    })
  }

  // Build full transcript text and timed segments
  const fullText = segments.map((t) => t.text).filter(Boolean).join(' ')
  const truncated = fullText.slice(0, 4000) // cap for GPT prompt

  // Use GPT to extract key vocabulary
  if (!config.openaiApiKey) {
    throw createError({ statusCode: 500, statusMessage: 'OpenAI API key is not configured on the server.' })
  }

  const openai = new OpenAI({ apiKey: config.openaiApiKey })

  let response
  try {
    response = await openai.chat.completions.create({
      model: 'gpt-4.1',
      messages: [
        {
          role: 'system',
          content: 'You are a bilingual English-Kazakh vocabulary extractor. Return ONLY valid JSON, no markdown.',
        },
        {
          role: 'user',
          content: `From this YouTube video transcript, extract the 12 most useful English vocabulary words for a Kazakh learner to study. Focus on intermediate-advanced words (not basic words like "the", "is", "go").

Transcript:
"""
${truncated}
"""

Return exactly this JSON structure:
{
  "title_guess": "short 5-word description of what the video is about",
  "words": [
    {
      "word": "the vocabulary word",
      "definition": "clear English definition in 1 sentence (max 12 words)",
      "example": "the exact sentence from the transcript where this word appears, or a natural example",
      "translation": "Kazakh translation (1-3 words)"
    }
  ]
}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1200,
    })
  } catch (e: any) {
    throw createError({ statusCode: 500, statusMessage: `AI request failed: ${e?.message || 'Unknown error'}` })
  }

  const raw = response.choices[0]?.message?.content?.trim() || '{}'

  let parsed: { title_guess: string; words: VocabWord[] }
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw createError({ statusCode: 500, statusMessage: 'Failed to parse AI response' })
  }

  return {
    videoId,
    titleGuess: parsed.title_guess || '',
    words: parsed.words || [],
    segments: segments.slice(0, 200), // cap for UI
    fullText: fullText.slice(0, 8000),
    source: usedManualPaste ? 'manual' : 'auto',
  }
})
