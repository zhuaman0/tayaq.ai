import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const body = await readBody<{ word: string; definition: string; example: string; translation: string }>(event)
  if (!body.word?.trim()) throw createError({ statusCode: 400, statusMessage: 'word is required' })

  const client = await serverSupabaseClient(event)
  const { data, error } = await client
    .from('vocabulary')
    .insert({
      user_id: user.id,
      word: body.word.trim().toLowerCase(),
      definition: body.definition?.trim() || '',
      example: body.example?.trim() || '',
      translation: body.translation?.trim() || '',
    })
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return data
})
