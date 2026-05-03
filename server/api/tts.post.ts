import OpenAI from 'openai'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { text, voice = 'nova' } = await readBody<{ text: string; voice?: string }>(event)

  if (!text?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'text is required' })
  }

  const openai = new OpenAI({ apiKey: config.openaiApiKey })

  const response = await openai.audio.speech.create({
    model: 'tts-1-hd',
    voice,
    input: text,
    response_format: 'mp3',
  })

  const buffer = Buffer.from(await response.arrayBuffer())

  setResponseHeaders(event, {
    'Content-Type': 'audio/mpeg',
    'Content-Length': String(buffer.length),
  })

  return buffer
})
