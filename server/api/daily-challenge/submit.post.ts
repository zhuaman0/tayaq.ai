import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { serverSupabaseUser } from '#supabase/server'
import { checkRateLimit } from '~~/server/utils/rateLimit'

const XP_PERFECT = 50
const XP_PARTIAL = 20  // awarded when the model judges "is_correct: false" but score >= 60

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  // Tight rate limit — one submit attempt is normal; 5/min covers retries.
  await checkRateLimit(event, { bucket: 'daily-submit', windowMs: 60_000, max: 5 }, user.id)

  const { answer } = await readBody<{ answer: string }>(event)
  if (!answer?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'answer is required' })
  }

  const config = useRuntimeConfig()
  const supabaseUrl = process.env.SUPABASE_URL
  const serviceKey = config.supabaseServiceKey
  if (!supabaseUrl || !serviceKey) {
    throw createError({ statusCode: 500, statusMessage: 'Supabase service key not configured' })
  }

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
  const today = new Date().toISOString().split('T')[0]

  // Fetch today's challenge
  const { data: challenge } = await admin
    .from('daily_challenges')
    .select('id, kazakh_sentence, expected_english')
    .eq('date', today)
    .maybeSingle()

  if (!challenge) {
    throw createError({ statusCode: 404, statusMessage: 'No challenge available today. Visit /api/daily-challenge first.' })
  }

  // Block double-submits — the unique (user_id, challenge_id) index would catch
  // it too, but checking up-front lets us return the existing completion.
  const { data: existing } = await admin
    .from('daily_challenge_completions')
    .select('is_correct, score, feedback, user_answer, xp_awarded')
    .eq('user_id', user.id)
    .eq('challenge_id', challenge.id)
    .maybeSingle()

  if (existing) {
    return { ...existing, alreadySubmitted: true }
  }

  // Grade with GPT
  const grade = await gradeAnswer(
    config.openaiApiKey,
    challenge.kazakh_sentence,
    challenge.expected_english,
    answer.trim(),
  )

  const xp = grade.is_correct ? XP_PERFECT : grade.score >= 60 ? XP_PARTIAL : 0

  // Insert completion
  const { error: insertError } = await admin.from('daily_challenge_completions').insert({
    user_id: user.id,
    challenge_id: challenge.id,
    user_answer: answer.trim(),
    is_correct: grade.is_correct,
    score: grade.score,
    feedback: grade.feedback,
    xp_awarded: xp,
  })

  if (insertError) {
    throw createError({ statusCode: 500, statusMessage: insertError.message })
  }

  // Bump profile XP (best-effort — failure here shouldn't fail the submission)
  if (xp > 0) {
    const { data: profile } = await admin
      .from('profiles')
      .select('total_xp')
      .eq('id', user.id)
      .maybeSingle()
    const newTotal = (profile?.total_xp || 0) + xp
    await admin.from('profiles').update({ total_xp: newTotal }).eq('id', user.id)
  }

  return {
    is_correct: grade.is_correct,
    score: grade.score,
    feedback: grade.feedback,
    user_answer: answer.trim(),
    expected_english: challenge.expected_english,
    xp_awarded: xp,
    alreadySubmitted: false,
  }
})

async function gradeAnswer(apiKey: string, kazakh: string, expected: string, userAnswer: string) {
  const openai = new OpenAI({ apiKey })
  const resp = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    temperature: 0.2,
    max_tokens: 250,
    messages: [
      {
        role: 'system',
        content: `You grade English translations from Kazakh. Stay in the Tayaq.ai persona — sarcastic, bilingual, but ultimately fair. Score generously: minor word choice differences are fine; only mark "is_correct: false" if the meaning is off, the grammar is wrong, or critical words are missing. Return ONLY valid JSON.`,
      },
      {
        role: 'user',
        content: `Kazakh sentence: "${kazakh}"
A natural English translation: "${expected}"
Student's translation: "${userAnswer}"

Return JSON:
{
  "is_correct": true | false,
  "score": <0-100 integer>,
  "feedback": "1-2 sentence feedback in mixed Kazakh + English. Be funny but specific about what was right or wrong."
}`,
      },
    ],
  })

  const raw = resp.choices[0]?.message?.content?.trim() || '{}'
  try {
    const parsed = JSON.parse(raw)
    return {
      is_correct: !!parsed.is_correct,
      score: Math.max(0, Math.min(100, Number(parsed.score) || 0)),
      feedback: String(parsed.feedback || '').slice(0, 500),
    }
  } catch {
    return { is_correct: false, score: 0, feedback: 'Grading failed — try again.' }
  }
}
