import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const { data: { user }, error: authError } = await client.auth.getUser()
  if (authError || !user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required' })

  const body = await readBody<{ collection_id: string | null }>(event)

  const { error } = await client
    .from('vocabulary')
    .update({ collection_id: body.collection_id ?? null })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  const { data, error: fetchError } = await client
    .from('vocabulary')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (fetchError) throw createError({ statusCode: 500, statusMessage: fetchError.message })
  return data
})
