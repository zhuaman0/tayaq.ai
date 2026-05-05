import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const { data: { user }, error: authError } = await client.auth.getUser()
  if (authError || !user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const { data, error } = await client
    .from('vocab_collections')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return data
})
