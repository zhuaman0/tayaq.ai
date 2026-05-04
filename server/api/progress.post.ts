import { ensureProgress, markTopicMastered, recordSession } from '~~/server/utils/progress'

interface ProgressPostBody {
  subjectId?: string
  action?: 'ensure' | 'mark_mastered' | 'record_session'
  seedLevel?: string
  masteredSlug?: string
  durationSeconds?: number
}

/**
 * POST /api/progress
 * Body actions:
 *  - ensure: idempotent first-touch — create row if missing, return current
 *  - mark_mastered: AI's mark_topic_mastered tool call hits this
 *  - record_session: bump session_count + total_seconds at end of /live
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<ProgressPostBody>(event)
  const subjectId = body?.subjectId?.trim() ?? ''

  if (!subjectId || subjectId.length < 8 || subjectId.length > 200) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid subjectId' })
  }

  const action = body.action ?? 'ensure'

  if (action === 'ensure') {
    const progress = await ensureProgress({ subjectId, seedLevel: body.seedLevel })
    return { progress, levelChanged: false }
  }

  if (action === 'mark_mastered') {
    const slug = body.masteredSlug?.trim()
    if (!slug) {
      throw createError({ statusCode: 400, statusMessage: 'masteredSlug required' })
    }
    return await markTopicMastered({ subjectId, masteredSlug: slug })
  }

  if (action === 'record_session') {
    const seconds = Math.max(0, Math.min(3600, Number(body.durationSeconds) || 0))
    await recordSession({ subjectId, durationSeconds: seconds })
    return { ok: true }
  }

  throw createError({ statusCode: 400, statusMessage: `Unknown action: ${action}` })
})
