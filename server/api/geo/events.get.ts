/**
 * GET /api/geo/events
 *
 * Proxy to Python H3 geo service — returns all events
 * with their H3 hexagonal cell IDs.
 */
export default defineEventHandler(async () => {
  try {
    const data = await $fetch('http://localhost:8000/events')
    return data
  } catch (error) {
    throw createError({
      statusCode: 502,
      message: 'Python geo service unavailable. Make sure it is running on port 8000.',
    })
  }
})
