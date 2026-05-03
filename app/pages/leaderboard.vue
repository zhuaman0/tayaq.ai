<template>
  <div class="leaderboard-page">
    <div class="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <!-- Header -->
      <div class="text-center mb-8">
        <span class="text-4xl">🏆</span>
        <h1 class="font-display font-bold text-3xl text-white mt-3">Leaderboard</h1>
        <p class="text-gray-400 text-sm mt-1">Who can keep the streak alive longest?</p>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-12">
        <div class="w-8 h-8 border-2 border-accent-red/30 border-t-accent-red rounded-full animate-spin mx-auto" />
        <p class="text-sm text-gray-500 mt-3">Loading rankings...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="players.length === 0" class="text-center py-12">
        <span class="text-5xl block mb-3">🌵</span>
        <h3 class="font-display font-bold text-lg text-white mb-1">No players yet</h3>
        <p class="text-sm text-gray-500 mb-4">Be the first to get roasted!</p>
        <NuxtLink
          to="/register"
          class="inline-block px-6 py-2.5 bg-accent-red/10 border border-accent-red/30 text-accent-red font-semibold rounded-lg hover:bg-accent-red/20 transition-all"
        >
          Sign Up Now
        </NuxtLink>
      </div>

      <!-- Rankings -->
      <div v-else class="space-y-3">
        <NuxtLink
          v-for="(player, i) in players"
          :key="player.id"
          :to="`/profile/${player.id}`"
          class="leaderboard-row"
          :class="{
            'leaderboard-gold': i === 0,
            'leaderboard-silver': i === 1,
            'leaderboard-bronze': i === 2,
            'leaderboard-me': player.id === currentUserId,
          }"
        >
          <!-- Rank -->
          <div class="leaderboard-rank">
            <span v-if="i === 0" class="text-xl">🥇</span>
            <span v-else-if="i === 1" class="text-xl">🥈</span>
            <span v-else-if="i === 2" class="text-xl">🥉</span>
            <span v-else class="text-sm font-bold text-gray-500">#{{ i + 1 }}</span>
          </div>

          <!-- Avatar & Name -->
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <div class="w-9 h-9 rounded-full bg-accent-red/15 flex items-center justify-center text-sm flex-shrink-0">
              😤
            </div>
            <div class="min-w-0">
              <p class="font-semibold text-white text-sm truncate">
                {{ player.username }}
                <span v-if="player.id === currentUserId" class="text-xs text-accent-red ml-1">(you)</span>
              </p>
              <p class="text-[10px] text-gray-600">
                {{ player.total_xp }} XP · {{ player.total_roasts }} roasts
              </p>
            </div>
          </div>

          <!-- Streak Badge -->
          <div class="text-right flex-shrink-0">
            <div class="streak-badge" :class="{ 'streak-active': player.streak_days > 0 }">
              <span class="streak-fire" :class="{ 'animate-pulse': player.streak_days >= 7 }">🔥</span>
              <span class="font-display font-bold text-white text-sm">{{ player.streak_days }}</span>
            </div>
            <p class="text-[10px] text-gray-500 mt-0.5">day{{ player.streak_days !== 1 ? 's' : '' }}</p>
          </div>
        </NuxtLink>
      </div>

      <!-- Your rank (if not in top list) -->
      <div v-if="currentUserRank && currentUserRank > 50" class="mt-6 text-center">
        <p class="text-sm text-gray-500">Your rank: <span class="text-white font-bold">#{{ currentUserRank }}</span></p>
      </div>

      <!-- CTA -->
      <div class="mt-8 text-center">
        <NuxtLink
          to="/chat"
          class="inline-block px-6 py-2.5 bg-accent-red/10 border border-accent-red/30 text-accent-red font-semibold rounded-lg hover:bg-accent-red/20 transition-all"
        >
          🎤 Start Practicing
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()

interface Player {
  id: string
  username: string
  total_xp: number
  total_roasts: number
  streak_days: number
}

const players = ref<Player[]>([])
const loading = ref(true)
const currentUserId = computed(() => user.value?.id || null)
const currentUserRank = ref<number | null>(null)

const fetchLeaderboard = async () => {
  loading.value = true

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, total_xp, total_roasts, streak_days')
      .order('streak_days', { ascending: false })
      .order('total_xp', { ascending: false })
      .limit(50)

    if (error) throw error

    if (data) {
      players.value = data.map((p: any) => ({
        id: p.id,
        username: p.username || 'Anonymous',
        total_xp: p.total_xp || 0,
        total_roasts: p.total_roasts || 0,
        streak_days: p.streak_days || 0,
      }))

      // Find current user rank
      if (currentUserId.value) {
        const idx = players.value.findIndex(p => p.id === currentUserId.value)
        currentUserRank.value = idx >= 0 ? idx + 1 : null
      }
    }
  } catch (e) {
    console.log('Leaderboard fetch failed:', e)
    players.value = []
  }

  loading.value = false
}

onMounted(() => {
  fetchLeaderboard()
})

useHead({ title: 'Leaderboard — Tayaq.ai' })
</script>

<style scoped>
.leaderboard-page {
  min-height: calc(100vh - 4rem);
}

.leaderboard-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  background: rgba(17, 17, 17, 0.8);
  border: 1px solid rgba(42, 42, 42, 0.5);
  border-radius: 1rem;
  transition: all 0.2s ease;
  cursor: pointer;
  text-decoration: none;
}

.leaderboard-row:hover {
  border-color: rgba(239, 68, 68, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.leaderboard-gold {
  border-color: rgba(255, 215, 0, 0.3);
  background: rgba(255, 215, 0, 0.05);
}

.leaderboard-gold:hover {
  border-color: rgba(255, 215, 0, 0.5);
}

.leaderboard-silver {
  border-color: rgba(192, 192, 192, 0.3);
  background: rgba(192, 192, 192, 0.03);
}

.leaderboard-bronze {
  border-color: rgba(205, 127, 50, 0.3);
  background: rgba(205, 127, 50, 0.03);
}

.leaderboard-me {
  border-color: rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.05);
}

.leaderboard-rank {
  width: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.streak-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.streak-active {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.4);
  box-shadow: 0 0 12px rgba(239, 68, 68, 0.15);
}

.streak-fire {
  font-size: 0.875rem;
}
</style>
