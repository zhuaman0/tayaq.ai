import OpenAI from 'openai'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { word } = await readBody<{ word: string }>(event)

  if (!word?.trim()) throw createError({ statusCode: 400, statusMessage: 'word is required' })

  const openai = new OpenAI({ apiKey: config.openaiApiKey })

  const response = await openai.chat.completions.create({
    model: 'gpt-4.1',
    messages: [
      {
        role: 'system',
        content: 'You are a bilingual English-Kazakh dictionary. Return ONLY valid JSON, no markdown, no explanation.',
      },
      {
        role: 'user',
        content: `For the English word "${word.trim()}", return exactly this JSON:
{
  "definition": "short English definition (1 sentence, no more than 15 words)",
  "example": "one natural example sentence using the word",
  "translation": "Kazakh translation of the word (1-3 words only)"
}`,
      },
    ],
    temperature: 0.3,
    max_tokens: 200,
  })

  const raw = response.choices[0]?.message?.content?.trim() || '{}'
  try {
    return JSON.parse(raw)
  } catch {
    return { definition: '', example: '', translation: '' }
  }
})
