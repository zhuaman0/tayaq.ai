import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { serverSupabaseUser } from '#supabase/server'

interface ChallengeRow {
  id: string
  date: string
  kazakh_sentence: string
  expected_english: string
  difficulty: string
}

interface CompletionRow {
  is_correct: boolean
  score: number
  feedback: string | null
  user_answer: string
  xp_awarded: number
  completed_at: string
}

// Returns today's challenge + whether the current user has already completed it.
// Lazily generates a new challenge with GPT-4o on the first request of the day,
// then everyone reads the same row for the rest of the UTC day.
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const config = useRuntimeConfig()
  const supabaseUrl = process.env.SUPABASE_URL
  const serviceKey = config.supabaseServiceKey
  if (!supabaseUrl || !serviceKey) {
    throw createError({ statusCode: 500, statusMessage: 'Supabase service key not configured' })
  }

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

  // Try to fetch today's challenge
  let { data: challenge } = await admin
    .from('daily_challenges')
    .select('id, date, kazakh_sentence, expected_english, difficulty')
    .eq('date', today)
    .maybeSingle<ChallengeRow>()

  // Generate one on first hit of the day
  if (!challenge) {
    const generated = await generateChallenge(config.openaiApiKey)
    const { data: inserted, error } = await admin
      .from('daily_challenges')
      .insert({
        date: today,
        kazakh_sentence: generated.kazakh_sentence,
        expected_english: generated.expected_english,
        difficulty: generated.difficulty,
      })
      .select('id, date, kazakh_sentence, expected_english, difficulty')
      .single()

    if (error) {
      // Race: another request created the row between our SELECT and INSERT.
      // Re-read instead of failing.
      const { data: refetched } = await admin
        .from('daily_challenges')
        .select('id, date, kazakh_sentence, expected_english, difficulty')
        .eq('date', today)
        .single<ChallengeRow>()
      if (!refetched) throw createError({ statusCode: 500, statusMessage: error.message })
      challenge = refetched
    } else {
      challenge = inserted
    }
  }

  // Look up the user's completion (if any)
  const { data: completion } = await admin
    .from('daily_challenge_completions')
    .select('is_correct, score, feedback, user_answer, xp_awarded, completed_at')
    .eq('user_id', user.id)
    .eq('challenge_id', challenge.id)
    .maybeSingle<CompletionRow>()

  return {
    id: challenge.id,
    date: challenge.date,
    kazakh_sentence: challenge.kazakh_sentence,
    difficulty: challenge.difficulty,
    completed: !!completion,
    completion: completion || null,
    // Note: expected_english is intentionally NOT returned — clients shouldn't
    // see the answer until they submit.
  }
})

async function generateChallenge(apiKey: string) {
  const openai = new OpenAI({ apiKey })
  const resp = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    temperature: 0.8,
    max_tokens: 200,
    messages: [
      {
        role: 'system',
        content: 'You generate daily English-learning challenges for Kazakh students. Return ONLY valid JSON.',
      },
      {
        role: 'user',
        content: `Generate ONE Kazakh sentence (8–14 words) that an intermediate English learner should be able to translate. Use natural colloquial Kazakh — not formal/textbook. The sentence should test useful real-world English (everyday situations, school, social life, travel — not literary or political topics).

Return exactly this JSON:
{
  "kazakh_sentence": "the Kazakh sentence",
  "expected_english": "a single natural English translation",
  "difficulty": "easy" | "medium" | "hard"
}`,
      },
    ],
  })

  const raw = resp.choices[0]?.message?.content?.trim() || '{}'
  const parsed = JSON.parse(raw)
  return {
    kazakh_sentence: String(parsed.kazakh_sentence || '').trim(),
    expected_english: String(parsed.expected_english || '').trim(),
    difficulty: ['easy', 'medium', 'hard'].includes(parsed.difficulty) ? parsed.difficulty : 'medium',
  }
}
