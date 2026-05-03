import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/streak
 * Called on login or profile visit to update the user's login streak.
 *
 * Streak logic:
 *  - last_login_at === today     → no change (already counted)
 *  - last_login_at === yesterday → streak_days + 1
 *  - last_login_at is older      → streak resets to 0, then set to 1 for today
 *  - no profile yet              → create one with streak 1
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const userId = body?.userId
  const username = body?.username

  if (!userId) {
    throw createError({ statusCode: 400, message: 'Missing userId' })
  }

  const config = useRuntimeConfig()
  const supabaseUrl = process.env.SUPABASE_URL || ''
  const supabaseServiceKey = config.supabaseServiceKey || ''

  if (!supabaseUrl || !supabaseServiceKey) {
    throw createError({ statusCode: 500, message: 'Supabase not configured (missing service key)' })
  }

  // Use service role client to bypass RLS
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  // Get current profile
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('streak_days, last_login_at')
    .eq('id', userId)
    .single()

  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

  if (!profile) {
    // No profile exists — create one with upsert to avoid conflicts
    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      username: username || 'Anonymous',
      streak_days: 1,
      last_login_at: today,
      total_xp: 0,
      total_roasts: 0,
    }, { onConflict: 'id' })

    if (error) {
      console.error('Streak upsert error:', JSON.stringify(error))
      // Don't throw — just return a soft error so the page still loads
      return { streak_days: 0, updated: false, error: error.message }
    }

    return { streak_days: 1, updated: true }
  }

  // Profile exists — calculate streak
  const lastLogin = profile.last_login_at
  let newStreak = profile.streak_days || 0

  if (lastLogin === today) {
    // Already logged in today, no change
    return { streak_days: newStreak, updated: false }
  }

  if (lastLogin) {
    // Calculate difference in days
    const lastDate = new Date(lastLogin + 'T00:00:00Z')
    const todayDate = new Date(today + 'T00:00:00Z')
    const diffMs = todayDate.getTime() - lastDate.getTime()
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      // Yesterday → increment streak
      newStreak += 1
    } else if (diffDays > 1) {
      // Missed a day → streak resets to 0, then this visit counts as day 1
      newStreak = 1
    }
  } else {
    // No last_login_at set — treat as first login
    newStreak = 1
  }

  // Update profile
  const { error } = await supabase
    .from('profiles')
    .update({
      streak_days: newStreak,
      last_login_at: today,
    })
    .eq('id', userId)

  if (error) {
    console.error('Streak update error:', JSON.stringify(error))
    return { streak_days: newStreak, updated: false, error: error.message }
  }

  return { streak_days: newStreak, updated: true }
})
