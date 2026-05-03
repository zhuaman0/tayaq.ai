/**
 * GET /api/geo/heatmap
 *
 * Proxy to Python H3 geo service — returns student density
 * heatmap data with H3 hexagonal cell boundaries.
 */
export default defineEventHandler(async () => {
  try {
    const data = await $fetch('http://localhost:8000/heatmap')
    return data
  } catch (error) {
    throw createError({
      statusCode: 502,
      message: 'Python geo service unavailable. Make sure it is running on port 8000.',
    })
  }
})
