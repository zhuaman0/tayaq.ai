/**
 * Composable that ensures a profile row exists in the Supabase `profiles` table.
 * Call this after any auth action (login, register, profile visit).
 * Uses upsert to avoid duplicates.
 */
export function useEnsureProfile() {
  const supabase = useSupabaseClient()

  /**
   * Ensure a profile row exists for the given user.
   * Creates it if missing, leaves it alone if it already exists.
   */
  const ensureProfile = async (userId: string, username: string) => {
    if (!userId) return // Guard: skip if auth hasn't hydrated yet

    try {
      // Check if profile exists first
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single()

      if (!existing) {
        // Create the profile
        await (supabase.from('profiles') as any).insert({
          id: userId,
          username: username || 'Anonymous',
          streak_days: 1,
          last_login_at: new Date().toISOString().split('T')[0],
          total_xp: 0,
          total_roasts: 0,
        })
      }
    } catch (e) {
      // If select fails (row doesn't exist), try to insert
      try {
        await (supabase.from('profiles') as any).insert({
          id: userId,
          username: username || 'Anonymous',
          streak_days: 1,
          last_login_at: new Date().toISOString().split('T')[0],
          total_xp: 0,
          total_roasts: 0,
        })
      } catch (insertErr) {
        console.warn('Profile insert failed (may already exist):', insertErr)
      }
    }
  }

  return { ensureProfile }
}
