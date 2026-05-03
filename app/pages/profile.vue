<template>
  <div class="profile-page">
    <div class="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <!-- Loading -->
      <div v-if="loading" class="text-center py-20">
        <div class="w-8 h-8 border-2 border-accent-red/30 border-t-accent-red rounded-full animate-spin mx-auto" />
        <p class="text-sm text-gray-500 mt-3">Loading your profile...</p>
      </div>

      <!-- Not logged in -->
      <div v-else-if="!user" class="text-center py-20">
        <span class="text-5xl mb-4 block">🔒</span>
        <h2 class="font-display font-bold text-xl text-white mb-2">Sign in to view your profile</h2>
        <NuxtLink to="/login" class="inline-block mt-4 px-6 py-2.5 bg-accent-red/10 border border-accent-red/30 text-accent-red font-semibold rounded-lg hover:bg-accent-red/20 transition-all">
          Sign In
        </NuxtLink>
      </div>

      <!-- Profile -->
      <div v-else>
        <!-- Header Card -->
        <div class="profile-card mb-6">
          <div class="flex items-center gap-4 mb-4">
            <div class="w-16 h-16 rounded-full bg-accent-red/20 flex items-center justify-center text-3xl">
              😤
            </div>
            <div>
              <h1 class="font-display font-bold text-2xl text-white">{{ displayName }}</h1>
              <p class="text-sm text-gray-400">{{ user.email }}</p>
              <p class="text-xs text-gray-600 mt-0.5">Joined {{ joinDate }}</p>
            </div>
          </div>

          <!-- Streak Hero -->
          <div class="streak-hero">
            <div class="streak-hero-inner">
              <span class="text-4xl" :class="{ 'animate-pulse': stats.streakDays >= 7 }">🔥</span>
              <div>
                <p class="font-display font-bold text-4xl text-white">{{ stats.streakDays }}</p>
                <p class="text-sm text-gray-400">day{{ stats.streakDays !== 1 ? 's' : '' }} streak</p>
              </div>
            </div>
            <p v-if="stats.streakDays === 0" class="text-xs text-gray-600 mt-2 text-center">
              Streak lost! Come back tomorrow to start again.
            </p>
            <p v-else-if="stats.streakDays >= 7" class="text-xs text-accent-red mt-2 text-center">
              🔥 On fire! {{ stats.streakDays }} days strong!
            </p>
          </div>
        </div>

        <!-- Stats Grid -->
        <div class="grid grid-cols-3 gap-3 mb-6">
          <div class="stat-card">
            <span class="text-2xl">🔥</span>
            <p class="stat-value">{{ stats.totalXp }}</p>
            <p class="stat-label">Total XP</p>
          </div>
          <div class="stat-card">
            <span class="text-2xl">📅</span>
            <p class="stat-value">{{ stats.streakDays }}</p>
            <p class="stat-label">Day Streak</p>
          </div>
          <div class="stat-card">
            <span class="text-2xl">💀</span>
            <p class="stat-value">{{ stats.totalRoasts }}</p>
            <p class="stat-label">Roasts Survived</p>
          </div>
        </div>

        <!-- Rank Badge -->
        <div class="profile-card mb-6">
          <h3 class="font-display font-bold text-sm text-gray-400 mb-3">CURRENT RANK</h3>
          <div class="flex items-center gap-3">
            <span class="text-3xl">{{ rankEmoji }}</span>
            <div>
              <p class="font-display font-bold text-lg text-white">{{ rankTitle }}</p>
              <p class="text-xs text-gray-500">{{ rankDescription }}</p>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="space-y-3">
          <NuxtLink
            to="/chat"
            class="block w-full p-3 text-center bg-accent-red/10 border border-accent-red/30 text-accent-red font-semibold rounded-xl hover:bg-accent-red/20 transition-all"
          >
            🎤 Start Practicing
          </NuxtLink>
          <NuxtLink
            to="/leaderboard"
            class="block w-full p-3 text-center bg-brand-card border border-brand-border text-gray-300 font-medium rounded-xl hover:bg-brand-card/80 transition-all"
          >
            🏆 View Leaderboard
          </NuxtLink>
          <button
            class="w-full p-3 text-center text-gray-500 text-sm hover:text-accent-red transition-colors rounded-xl"
            @click="handleLogout"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()
const { ensureProfile } = useEnsureProfile()

const loading = ref(true)

const stats = reactive({
  totalXp: 0,
  streakDays: 0,
  totalRoasts: 0,
})

const displayName = computed(() => {
  return user.value?.user_metadata?.username || user.value?.email?.split('@')[0] || 'Student'
})

const joinDate = computed(() => {
  if (!user.value?.created_at) return ''
  return new Date(user.value.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
})

// Rank system based on XP
const rankEmoji = computed(() => {
  const xp = stats.totalXp
  if (xp >= 5000) return '☠️'
  if (xp >= 2000) return '💀'
  if (xp >= 1000) return '🔥'
  if (xp >= 500) return '🌶️'
  return '🌱'
})

const rankTitle = computed(() => {
  const xp = stats.totalXp
  if (xp >= 5000) return 'No Mercy Survivor'
  if (xp >= 2000) return 'Roast Veteran'
  if (xp >= 1000) return 'Flame Walker'
  if (xp >= 500) return 'Spice Apprentice'
  return 'Fresh Meat'
})

const rankDescription = computed(() => {
  const xp = stats.totalXp
  if (xp >= 5000) return 'You\'ve survived the worst. Respect.'
  if (xp >= 2000) return 'You\'ve been roasted so much, you\'re fireproof.'
  if (xp >= 1000) return 'Getting tougher. Keep going!'
  if (xp >= 500) return 'Starting to feel the heat.'
  return 'Just started. Prepare for pain!'
})

const fetchProfile = async () => {
  if (!user.value) {
    loading.value = false
    return
  }

  const userId = user.value.id
  const uname = user.value.user_metadata?.username || user.value.email?.split('@')[0] || 'Anonymous'

  // Ensure profile row exists
  await ensureProfile(userId, uname)

  // Track streak
  try {
    await $fetch('/api/streak', {
      method: 'POST',
      body: { userId, username: uname },
    })
  } catch (e) {
    console.warn('Streak skipped:', e)
  }

  // Fetch updated stats
  try {
    const { data } = await supabase
      .from('profiles')
      .select('total_xp, streak_days, total_roasts')
      .eq('id', userId)
      .single()

    if (data) {
      const d = data as any
      stats.totalXp = d.total_xp || 0
      stats.streakDays = d.streak_days || 0
      stats.totalRoasts = d.total_roasts || 0
    }
  } catch (e) {
    console.log('Profile fetch skipped:', e)
  }

  loading.value = false
}

const handleLogout = async () => {
  await supabase.auth.signOut()
  router.push('/')
}

// Watch for user auth state — fetch profile when user becomes available
watch(user, (u) => {
  if (u) {
    fetchProfile()
  } else {
    loading.value = false
  }
}, { immediate: true })

useHead({ title: 'Profile — Tayaq.ai' })
</script>

<style scoped>
.profile-page {
  min-height: calc(100vh - 4rem);
}

.profile-card {
  padding: 1.5rem;
  background: rgba(17, 17, 17, 0.8);
  border: 1px solid rgba(42, 42, 42, 0.5);
  border-radius: 1.25rem;
  backdrop-filter: blur(24px);
}

.streak-hero {
  padding: 1.25rem;
  background: rgba(239, 68, 68, 0.05);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 1rem;
}

.streak-hero-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.stat-card {
  padding: 1.25rem 1rem;
  background: rgba(17, 17, 17, 0.8);
  border: 1px solid rgba(42, 42, 42, 0.5);
  border-radius: 1rem;
  text-align: center;
}

.stat-value {
  font-family: 'Outfit', sans-serif;
  font-weight: 800;
  font-size: 1.5rem;
  color: white;
  margin-top: 0.5rem;
}

.stat-label {
  font-size: 0.6875rem;
  color: #6b7280;
  margin-top: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
</style>
