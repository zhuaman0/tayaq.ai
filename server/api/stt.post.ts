import OpenAI, { toFile } from 'openai'
import { serverSupabaseUser } from '#supabase/server'
import { checkRateLimit } from '~~/server/utils/rateLimit'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event).catch(() => null)
  // STT is expensive per call. 30 transcriptions / 5 min is generous.
  await checkRateLimit(event, { bucket: 'stt', windowMs: 5 * 60_000, max: 30 }, user?.id)

  const config = useRuntimeConfig()
  const formData = await readMultipartFormData(event)

  if (!formData?.length) {
    throw createError({ statusCode: 400, statusMessage: 'Audio file required' })
  }

  const audioField = formData.find(f => f.name === 'audio')
  if (!audioField?.data) {
    throw createError({ statusCode: 400, statusMessage: 'audio field missing' })
  }

  const openai = new OpenAI({ apiKey: config.openaiApiKey })

  const file = await toFile(audioField.data, 'audio.webm', { type: 'audio/webm' })

  const transcription = await openai.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    language: 'en',
  })

  return { text: transcription.text }
})
