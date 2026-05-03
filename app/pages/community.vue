<template>
  <div class="community-page">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <!-- Header -->
      <div class="text-center mb-10">
        <span class="text-5xl mb-3 block">👥</span>
        <h1 class="font-display font-bold text-3xl sm:text-4xl text-white">Community</h1>
        <p class="text-gray-400 mt-2 max-w-lg mx-auto">
          Find English learners nearby. Message them. Meet up. Practice together.
        </p>
      </div>

      <!-- City filter -->
      <div class="flex items-center justify-center gap-2 flex-wrap mb-8">
        <button
          v-for="c in cities"
          :key="c"
          :class="['city-btn', { active: selectedCity === c }]"
          @click="selectedCity = c"
        >
          {{ c === 'all' ? '🌍 All Cities' : `📍 ${c}` }}
        </button>
      </div>

      <!-- Set your city prompt (if logged in and no city set) -->
      <div v-if="user && !myCity" class="set-city-card">
        <div class="flex items-center gap-3 mb-3">
          <span class="text-2xl">📍</span>
          <p class="text-white font-semibold">Set your city to appear in the community!</p>
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          <select v-model="cityToSet" class="city-select">
            <option value="">Choose your city...</option>
            <option v-for="c in kazakhstanCities" :key="c" :value="c">{{ c }}</option>
          </select>
          <button class="save-city-btn" :disabled="!cityToSet" @click="saveMyCity">
            Save
          </button>
        </div>
      </div>

      <!-- Learners list -->
      <div v-if="loading" class="text-center py-12">
        <div class="text-gray-500">Loading community...</div>
      </div>

      <div v-else-if="filteredUsers.length === 0" class="text-center py-12">
        <span class="text-4xl mb-3 block">😢</span>
        <p class="text-gray-400">No learners found in this city yet.</p>
        <p class="text-gray-600 text-sm mt-1">Be the first to set your city!</p>
      </div>

      <div v-else class="learners-grid">
        <div v-for="learner in filteredUsers" :key="learner.id" class="learner-card">
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div class="learner-avatar">{{ (learner.username || '?').charAt(0).toUpperCase() }}</div>
              <div>
                <h3 class="font-display font-bold text-white">{{ learner.username || 'Anonymous' }}</h3>
                <div class="flex items-center gap-2 mt-0.5">
                  <span class="text-xs text-gray-500">📍 {{ learner.city || 'Unknown' }}</span>
                  <span v-if="learner.streak_days" class="text-xs text-orange-400">🔥 {{ learner.streak_days }}d streak</span>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-1">
              <span class="xp-badge">{{ learner.total_xp || 0 }} XP</span>
            </div>
          </div>

          <p v-if="learner.bio" class="text-sm text-gray-400 mt-3 line-clamp-2">{{ learner.bio }}</p>
          <p v-else class="text-sm text-gray-600 mt-3 italic">No bio yet</p>

          <!-- Actions -->
          <div class="flex items-center gap-2 mt-4">
            <button
              v-if="user && learner.id !== user.id"
              class="message-btn"
              @click="openChat(learner)"
            >
              💬 Message
            </button>
            <NuxtLink :to="`/profile/${learner.id}`" class="profile-link">
              View Profile →
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Chat Modal -->
    <ChatModal
      :is-open="chatOpen"
      :partner-id="chatPartner?.id || ''"
      :partner-name="chatPartner?.username || ''"
      :partner-city="chatPartner?.city || ''"
      @close="chatOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const loading = ref(true)
const allUsers = ref<any[]>([])
const selectedCity = ref('all')
const chatOpen = ref(false)
const chatPartner = ref<any>(null)
const myCity = ref('')
const cityToSet = ref('')

const kazakhstanCities = [
  'Almaty', 'Astana', 'Shymkent', 'Karaganda', 'Aktobe',
  'Taraz', 'Pavlodar', 'Ust-Kamenogorsk', 'Semey', 'Atyrau',
  'Kostanay', 'Oral', 'Petropavl', 'Aktau', 'Turkestan',
]

const cities = computed(() => {
  const userCities = [...new Set(allUsers.value.map(u => u.city).filter(Boolean))]
  return ['all', ...userCities.sort()]
})

const filteredUsers = computed(() => {
  if (selectedCity.value === 'all') return allUsers.value
  return allUsers.value.filter(u => u.city === selectedCity.value)
})

const fetchUsers = async () => {
  loading.value = true
  const { data } = await (supabase.from('profiles') as any)
    .select('id, username, city, bio, streak_days, total_xp, total_roasts')
    .order('streak_days', { ascending: false })

  allUsers.value = data || []

  // Set current user's city
  if (user.value) {
    const me = allUsers.value.find((u: any) => u.id === user.value?.id)
    if (me?.city) myCity.value = me.city
  }

  loading.value = false
}

const saveMyCity = async () => {
  if (!user.value || !cityToSet.value) return

  await (supabase.from('profiles') as any)
    .update({ city: cityToSet.value })
    .eq('id', user.value.id)

  myCity.value = cityToSet.value
  await fetchUsers()
}

const openChat = (learner: any) => {
  chatPartner.value = learner
  chatOpen.value = true
}

onMounted(fetchUsers)

useHead({ title: 'Community — Tayaq.ai' })
</script>

<style scoped>
.community-page {
  min-height: calc(100vh - 4rem);
}

.city-btn {
  padding: 0.5rem 1rem;
  background: rgba(17, 17, 17, 0.8);
  border: 1px solid rgba(42, 42, 42, 0.5);
  border-radius: 9999px;
  color: #9ca3af;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.city-btn:hover {
  border-color: rgba(239, 68, 68, 0.3);
  color: white;
}

.city-btn.active {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.5);
  color: #ef4444;
}

.set-city-card {
  background: rgba(239, 68, 68, 0.05);
  border: 1px solid rgba(239, 68, 68, 0.15);
  border-radius: 1rem;
  padding: 1.25rem;
  margin-bottom: 2rem;
}

.city-select {
  background: rgba(17, 17, 17, 0.8);
  border: 1px solid rgba(42, 42, 42, 0.5);
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  color: white;
  font-size: 0.8125rem;
  outline: none;
}

.city-select:focus {
  border-color: rgba(239, 68, 68, 0.4);
}

.save-city-btn {
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 0.5rem;
  padding: 0.5rem 1.25rem;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.save-city-btn:hover:not(:disabled) {
  background: #dc2626;
}

.save-city-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.learners-grid {
  display: grid;
  gap: 1rem;
}

.learner-card {
  background: rgba(17, 17, 17, 0.6);
  border: 1px solid rgba(42, 42, 42, 0.4);
  border-radius: 1rem;
  padding: 1.25rem;
  transition: all 0.25s;
}

.learner-card:hover {
  border-color: rgba(239, 68, 68, 0.2);
  transform: translateY(-2px);
}

.learner-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(249, 115, 22, 0.2));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fca5a5;
  font-weight: 800;
  font-size: 1rem;
  border: 2px solid rgba(239, 68, 68, 0.15);
}

.xp-badge {
  font-size: 0.6875rem;
  font-weight: 700;
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.1);
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
}

.message-btn {
  padding: 0.5rem 1rem;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 0.5rem;
  color: #fca5a5;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.message-btn:hover {
  background: rgba(239, 68, 68, 0.25);
  border-color: rgba(239, 68, 68, 0.4);
}

.profile-link {
  padding: 0.5rem 1rem;
  color: #9ca3af;
  font-size: 0.8125rem;
  font-weight: 500;
  transition: color 0.2s;
  text-decoration: none;
}

.profile-link:hover {
  color: white;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
