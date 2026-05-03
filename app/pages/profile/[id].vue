<template>
  <div class="profile-page">
    <div class="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <!-- Loading -->
      <div v-if="loading" class="text-center py-20">
        <div class="w-8 h-8 border-2 border-accent-red/30 border-t-accent-red rounded-full animate-spin mx-auto" />
        <p class="text-sm text-gray-500 mt-3">Loading profile...</p>
      </div>

      <!-- Not Found -->
      <div v-else-if="!profileData" class="text-center py-20">
        <span class="text-5xl block mb-3">😵</span>
        <h2 class="font-display font-bold text-xl text-white mb-2">User not found</h2>
        <p class="text-sm text-gray-500 mb-4">This profile doesn't exist.</p>
        <NuxtLink to="/leaderboard" class="inline-block px-6 py-2.5 bg-accent-red/10 border border-accent-red/30 text-accent-red font-semibold rounded-lg hover:bg-accent-red/20 transition-all">
          ← Back to Leaderboard
        </NuxtLink>
      </div>

      <!-- Profile -->
      <div v-else>
        <!-- Back button -->
        <NuxtLink to="/leaderboard" class="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors mb-6">
          ← Back to Leaderboard
        </NuxtLink>

        <!-- Header Card -->
        <div class="profile-card mb-6">
          <div class="flex items-center gap-4 mb-4">
            <div class="w-16 h-16 rounded-full bg-accent-red/20 flex items-center justify-center text-3xl">
              😤
            </div>
            <div>
              <h1 class="font-display font-bold text-2xl text-white">
                {{ profileData.username }}
                <span v-if="isOwnProfile" class="text-sm text-accent-red ml-1">(you)</span>
              </h1>
              <p class="text-xs text-gray-600 mt-0.5">Joined {{ joinDate }}</p>
            </div>
          </div>

          <!-- Streak Hero -->
          <div class="streak-hero">
            <div class="streak-hero-inner">
              <span class="text-4xl" :class="{ 'animate-pulse': profileData.streak_days >= 7 }">🔥</span>
              <div>
                <p class="font-display font-bold text-4xl text-white">{{ profileData.streak_days }}</p>
                <p class="text-sm text-gray-400">day{{ profileData.streak_days !== 1 ? 's' : '' }} streak</p>
              </div>
            </div>
            <p v-if="profileData.streak_days === 0" class="text-xs text-gray-600 mt-2 text-center">
              Streak lost! Come back tomorrow to start again.
            </p>
            <p v-else-if="profileData.streak_days >= 7" class="text-xs text-accent-red mt-2 text-center">
              🔥 On fire! {{ profileData.streak_days }} days strong!
            </p>
          </div>
        </div>

        <!-- Stats Grid -->
        <div class="grid grid-cols-3 gap-3 mb-6">
          <div class="stat-card">
            <span class="text-2xl">🔥</span>
            <p class="stat-value">{{ profileData.total_xp }}</p>
            <p class="stat-label">Total XP</p>
          </div>
          <div class="stat-card">
            <span class="text-2xl">📅</span>
            <p class="stat-value">{{ profileData.streak_days }}</p>
            <p class="stat-label">Day Streak</p>
          </div>
          <div class="stat-card">
            <span class="text-2xl">💀</span>
            <p class="stat-value">{{ profileData.total_roasts }}</p>
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

        <!-- Actions for own profile -->
        <div v-if="isOwnProfile" class="space-y-3">
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

const route = useRoute()
const supabase = useSupabaseClient()
const currentUser = useSupabaseUser()
const { ensureProfile } = useEnsureProfile()

const profileId = route.params.id as string

interface ProfileData {
  id: string
  username: string
  total_xp: number
  total_roasts: number
  streak_days: number
  created_at: string
}

const profileData = ref<ProfileData | null>(null)
const loading = ref(true)

const isOwnProfile = computed(() => currentUser.value?.id === profileId)

const joinDate = computed(() => {
  if (!profileData.value?.created_at) return ''
  return new Date(profileData.value.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
})

// Rank system based on XP
const rankEmoji = computed(() => {
  const xp = profileData.value?.total_xp || 0
  if (xp >= 5000) return '☠️'
  if (xp >= 2000) return '💀'
  if (xp >= 1000) return '🔥'
  if (xp >= 500) return '🌶️'
  return '🌱'
})

const rankTitle = computed(() => {
  const xp = profileData.value?.total_xp || 0
  if (xp >= 5000) return 'No Mercy Survivor'
  if (xp >= 2000) return 'Roast Veteran'
  if (xp >= 1000) return 'Flame Walker'
  if (xp >= 500) return 'Spice Apprentice'
  return 'Fresh Meat'
})

const rankDescription = computed(() => {
  const xp = profileData.value?.total_xp || 0
  if (xp >= 5000) return 'You\'ve survived the worst. Respect.'
  if (xp >= 2000) return 'You\'ve been roasted so much, you\'re fireproof.'
  if (xp >= 1000) return 'Getting tougher. Keep going!'
  if (xp >= 500) return 'Starting to feel the heat.'
  return 'Just started. Prepare for pain!'
})

const fetchProfile = async () => {
  loading.value = true

  // If viewing own profile, ensure profile exists and track streak
  if (isOwnProfile.value && currentUser.value) {
    const uname = currentUser.value.user_metadata?.username || currentUser.value.email?.split('@')[0] || 'Anonymous'
    await ensureProfile(currentUser.value.id, uname)

    try {
      await $fetch('/api/streak', {
        method: 'POST',
        body: {
          userId: currentUser.value.id,
          username: uname,
        },
      })
    } catch (e) {
      console.warn('Streak update skipped:', e)
    }
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, total_xp, total_roasts, streak_days, created_at')
      .eq('id', profileId)
      .single()

    if (error) throw error

    if (data) {
      const d = data as any
      profileData.value = {
        id: d.id,
        username: d.username || 'Anonymous',
        total_xp: d.total_xp || 0,
        total_roasts: d.total_roasts || 0,
        streak_days: d.streak_days || 0,
        created_at: d.created_at || '',
      }
    }
  } catch (e) {
    console.log('Profile fetch failed:', e)
    profileData.value = null
  }

  loading.value = false
}

const handleLogout = async () => {
  await supabase.auth.signOut()
  navigateTo('/')
}

onMounted(() => {
  fetchProfile()
})

useHead({
  title: computed(() =>
    profileData.value
      ? `${profileData.value.username}'s Profile — Tayaq.ai`
      : 'Profile — Tayaq.ai'
  ),
})
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
