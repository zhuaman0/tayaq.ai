import { fetchProgress } from '~~/server/utils/progress'

/**
 * GET /api/progress?subjectId=<device_id>
 * Returns null progress for first-time visitors (no row created yet).
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const subjectId = typeof query.subjectId === 'string' ? query.subjectId.trim() : ''

  if (!subjectId || subjectId.length < 8 || subjectId.length > 200) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid subjectId' })
  }

  const progress = await fetchProgress(subjectId)
  return { progress }
})
