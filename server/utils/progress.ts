import { getSupabaseAdmin } from './supabaseAdmin'
import { applyMastery, getNextLearningTarget, type Level } from './curriculum'

const TABLE = 'learning_progress'

export interface LearningProgress {
  subject_id: string
  level: Level
  current_topic_slug: string | null
  mastered_topics: string[]
  session_count: number
  total_seconds: number
  last_session_at: string | null
  updated_at: string
}

const VALID_LEVELS: Level[] = ['beginner', 'intermediate', 'advanced']

function normalizeLevel(level: string | undefined | null): Level {
  return VALID_LEVELS.includes((level || '') as Level) ? (level as Level) : 'beginner'
}

/**
 * Fetch existing progress for a subject (device_id or user_id). Returns
 * null when the row does not exist yet — callers decide whether to create
 * one based on user-provided level/topic.
 */
export async function fetchProgress(subjectId: string): Promise<LearningProgress | null> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('subject_id', subjectId)
    .maybeSingle()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: `Failed to fetch progress: ${error.message}` })
  }
  return (data as LearningProgress | null) ?? null
}

/**
 * Idempotently ensure a progress row exists. If the row is missing we
 * create it using the supplied seed level (from the home modal). If it
 * exists, we leave it untouched and return what was stored — the user's
 * saved level wins over whatever was passed in the URL.
 */
export async function ensureProgress(args: {
  subjectId: string
  seedLevel?: string
}): Promise<LearningProgress> {
  const existing = await fetchProgress(args.subjectId)
  if (existing) return existing

  const seedLevel = normalizeLevel(args.seedLevel)
  const initial = getNextLearningTarget({ currentLevel: seedLevel, masteredTopics: [] })

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      subject_id: args.subjectId,
      level: initial.level,
      current_topic_slug: initial.topicSlug,
      mastered_topics: [],
    })
    .select('*')
    .single()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: `Failed to create progress: ${error.message}` })
  }
  return data as LearningProgress
}

/**
 * Called when the model invokes mark_topic_mastered. Updates the row,
 * advances current_topic, possibly bumps level. Returns the new state.
 */
export async function markTopicMastered(args: {
  subjectId: string
  masteredSlug: string
}): Promise<{ progress: LearningProgress; levelChanged: boolean }> {
  const current = await fetchProgress(args.subjectId)
  if (!current) {
    throw createError({ statusCode: 404, statusMessage: 'No progress row to update' })
  }

  const next = applyMastery({
    level: current.level,
    masteredTopics: current.mastered_topics ?? [],
    masteredSlug: args.masteredSlug,
  })

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from(TABLE)
    .update({
      level: next.level,
      current_topic_slug: next.currentTopicSlug,
      mastered_topics: next.masteredTopics,
    })
    .eq('subject_id', args.subjectId)
    .select('*')
    .single()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: `Failed to mark mastered: ${error.message}` })
  }
  return { progress: data as LearningProgress, levelChanged: next.levelChanged }
}

/**
 * Bump session_count and total_seconds — called when a /live session
 * disconnects. Best-effort; silently no-ops if row is missing.
 */
export async function recordSession(args: {
  subjectId: string
  durationSeconds: number
}): Promise<void> {
  const supabase = getSupabaseAdmin()
  const current = await fetchProgress(args.subjectId)
  if (!current) return

  await supabase
    .from(TABLE)
    .update({
      session_count: (current.session_count ?? 0) + 1,
      total_seconds: (current.total_seconds ?? 0) + Math.max(0, args.durationSeconds),
      last_session_at: new Date().toISOString(),
    })
    .eq('subject_id', args.subjectId)
}
