import OpenAI, { toFile } from 'openai'

export default defineEventHandler(async (event) => {
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
