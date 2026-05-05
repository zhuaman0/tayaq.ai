import type { H3Event } from 'h3'

interface Bucket {
  count: number
  resetAt: number
}

interface RateLimitOptions {
  bucket: string
  windowMs: number
  max: number
}

// Extracts a stable identifier per requester: prefer user.id, fall back to IP.
function getIdentifier(event: H3Event, userId?: string | null): string {
  if (userId) return `u:${userId}`
  const ip =
    getRequestHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim() ||
    getRequestHeader(event, 'x-real-ip') ||
    event.node.req.socket?.remoteAddress ||
    'unknown'
  return `ip:${ip}`
}

// Note: the default Nitro storage driver is in-memory and resets on restart.
// For production, configure a Redis/Upstash driver in nuxt.config.ts under
// `nitro.storage`. The contract here doesn't change — only the backing store.
export async function checkRateLimit(
  event: H3Event,
  opts: RateLimitOptions,
  userId?: string | null,
): Promise<void> {
  const storage = useStorage('rateLimit')
  const id = getIdentifier(event, userId)
  const slot = `${opts.bucket}:${id}`
  const now = Date.now()

  const existing = (await storage.getItem<Bucket>(slot)) || null
  const entry: Bucket =
    existing && now < existing.resetAt
      ? existing
      : { count: 0, resetAt: now + opts.windowMs }

  if (entry.count >= opts.max) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    setResponseHeader(event, 'Retry-After', retryAfter)
    throw createError({
      statusCode: 429,
      statusMessage: `Rate limit exceeded. Retry in ${retryAfter}s.`,
    })
  }

  entry.count++
  await storage.setItem(slot, entry)
}
