import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const { data: { user }, error: authError } = await client.auth.getUser()
  if (authError || !user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required' })

  const { error } = await client
    .from('vocab_collections')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return { success: true }
})
