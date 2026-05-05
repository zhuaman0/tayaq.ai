import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const { data: { user }, error: authError } = await client.auth.getUser()
  if (authError || !user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const body = await readBody<{ name: string; emoji: string }>(event)
  if (!body.name?.trim()) throw createError({ statusCode: 400, statusMessage: 'name is required' })

  const { data, error } = await client
    .from('vocab_collections')
    .insert({ user_id: user.id, name: body.name.trim(), emoji: body.emoji || '📚' })
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return data
})
