import { YoutubeTranscript } from 'youtube-transcript'
import OpenAI from 'openai'

interface VocabWord {
  word: string
  definition: string
  example: string
  translation: string
}

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/,
    /youtube\.com\/watch\?.*&v=([A-Za-z0-9_-]{11})/,
  ]
  for (const re of patterns) {
    const m = url.match(re)
    if (m) return m[1]
  }
  return null
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { url } = await readBody<{ url: string }>(event)

  if (!url?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'YouTube URL is required' })
  }

  const videoId = extractVideoId(url.trim())
  if (!videoId) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid YouTube URL' })
  }

  // Fetch transcript
  let rawTranscript: { text: string; offset: number }[] = []
  try {
    rawTranscript = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' })
  } catch {
    try {
      // Fallback: try without language constraint
      rawTranscript = await YoutubeTranscript.fetchTranscript(videoId)
    } catch (e: any) {
      throw createError({
        statusCode: 422,
        statusMessage: 'Could not fetch transcript. Make sure the video has English subtitles/captions enabled.',
      })
    }
  }

  if (!rawTranscript.length) {
    throw createError({ statusCode: 422, statusMessage: 'This video has no transcript available.' })
  }

  // Build full transcript text and timed segments
  const fullText = rawTranscript.map(t => t.text.replace(/\[.*?\]/g, '').trim()).filter(Boolean).join(' ')
  const segments = rawTranscript.map(t => ({
    text: t.text.replace(/\[.*?\]/g, '').trim(),
    offset: Math.floor(t.offset / 1000), // seconds
  })).filter(t => t.text)

  // Limit to ~4000 chars for GPT to avoid token overflow
  const truncated = fullText.slice(0, 4000)

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
  }
})
