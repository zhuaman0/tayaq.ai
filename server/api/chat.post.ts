import OpenAI from 'openai'
import { buildSystemPrompt } from '~~/server/utils/persona'
import { serverSupabaseUser } from '#supabase/server'
import { checkRateLimit } from '~~/server/utils/rateLimit'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ChatRequest {
  messages: ChatMessage[]
  age: number
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const apiKey = config.openaiApiKey

  if (!apiKey || apiKey === 'sk-YOUR-KEY-HERE') {
    throw createError({
      statusCode: 500,
      statusMessage: 'OpenAI API key not configured. Please set OPENAI_API_KEY in your .env file.'
    })
  }

  // Chat is open to anonymous users (signed-out browsing the demo), so we
  // rate-limit by user.id when present and fall back to IP otherwise.
  const user = await serverSupabaseUser(event).catch(() => null)
  await checkRateLimit(event, { bucket: 'chat', windowMs: 5 * 60_000, max: 30 }, user?.id)

  const body = await readBody<ChatRequest>(event)

  if (!body.messages || !Array.isArray(body.messages)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'messages array is required'
    })
  }

  const age = body.age || 20
  const systemPrompt = buildSystemPrompt({ age })

  const openai = new OpenAI({ apiKey })

  const stream = await openai.chat.completions.create({
    model: 'gpt-4.1',
    messages: [
      { role: 'system', content: systemPrompt },
      ...body.messages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }))
    ],
    stream: true,
    temperature: 0.9,
    max_tokens: 400,
  })

  // Set SSE headers
  setResponseHeaders(event, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  })

  const encoder = new TextEncoder()
  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content
          if (content) {
            const data = `data: ${JSON.stringify({ content })}\n\n`
            controller.enqueue(encoder.encode(data))
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      } catch (error: any) {
        const errorData = `data: ${JSON.stringify({ error: error.message || 'Stream error' })}\n\n`
        controller.enqueue(encoder.encode(errorData))
        controller.close()
      }
    }
  })

  return sendStream(event, readableStream)
})
