<template>
  <div class="daily-challenge-card">
    <!-- Header -->
    <div class="flex items-start justify-between gap-3 mb-4">
      <div>
        <p class="text-xs uppercase tracking-widest text-accent-amber font-bold mb-1">
          🔥 Daily Challenge
        </p>
        <h3 class="font-display font-bold text-white text-lg leading-tight">
          Translate this to English
        </h3>
      </div>
      <span v-if="challenge?.difficulty" class="diff-badge" :class="diffClass">
        {{ challenge.difficulty }}
      </span>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="py-6 text-center text-gray-500 text-sm">
      Loading today's challenge...
    </div>

    <!-- Error / signed out -->
    <div v-else-if="error" class="py-4 text-center">
      <p class="text-sm text-gray-400 mb-3">
        {{ requiresAuth ? 'Sign in to take the daily challenge.' : error }}
      </p>
      <NuxtLink
        v-if="requiresAuth"
        to="/login"
        class="inline-block px-4 py-2 bg-accent-red/10 border border-accent-red/30 text-accent-red rounded-lg text-sm font-semibold hover:bg-accent-red/20 transition-all"
      >
        Sign In
      </NuxtLink>
    </div>

    <!-- Loaded -->
    <div v-else-if="challenge">
      <!-- Kazakh sentence -->
      <div class="bg-brand-black/60 border border-brand-border/30 rounded-xl p-4 mb-4">
        <p class="text-white font-medium text-base leading-snug">
          {{ challenge.kazakh_sentence }}
        </p>
      </div>

      <!-- Already completed -->
      <div v-if="challenge.completed && challenge.completion">
        <div
          class="rounded-xl p-4 mb-3"
          :class="challenge.completion.is_correct
            ? 'bg-green-500/5 border border-green-500/30'
            : 'bg-accent-red/5 border border-accent-red/30'"
        >
          <div class="flex items-center justify-between mb-2">
            <span
              class="font-bold text-sm"
              :class="challenge.completion.is_correct ? 'text-green-400' : 'text-accent-red'"
            >
              {{ challenge.completion.is_correct ? '✅ Done' : `${challenge.completion.score}/100` }}
            </span>
            <span v-if="challenge.completion.xp_awarded > 0" class="text-xs font-bold text-accent-amber">
              +{{ challenge.completion.xp_awarded }} XP
            </span>
          </div>
          <p class="text-sm text-gray-300 leading-snug">
            <span class="text-gray-500 text-xs uppercase tracking-wide">Your answer · </span>
            "{{ challenge.completion.user_answer }}"
          </p>
          <p v-if="challenge.completion.feedback" class="text-sm text-gray-400 mt-2 italic leading-snug">
            {{ challenge.completion.feedback }}
          </p>
        </div>
        <p class="text-xs text-gray-500 text-center">Come back tomorrow for a new one.</p>
      </div>

      <!-- Submit form -->
      <div v-else>
        <textarea
          v-model="answerText"
          rows="2"
          placeholder="Type your English translation here..."
          class="w-full px-4 py-3 bg-brand-black border border-brand-border/50 rounded-xl text-white text-sm placeholder-gray-600 outline-none focus:border-accent-red/50 transition-colors resize-none mb-3"
          :disabled="submitting"
          @keydown.ctrl.enter="onSubmit"
          @keydown.meta.enter="onSubmit"
        />
        <button
          class="w-full py-3 bg-gradient-to-r from-accent-red to-accent-flame text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
          :disabled="!answerText.trim() || submitting"
          @click="onSubmit"
        >
          {{ submitting ? 'Grading...' : 'Submit Translation →' }}
        </button>
        <p class="text-[10px] text-gray-600 text-center mt-2">
          Ctrl/⌘ + Enter to submit · Win up to 50 XP
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { challenge, loading, submitting, error, fetchToday, submit } = useDailyChallenge()
const user = useSupabaseUser()
const answerText = ref('')

const requiresAuth = computed(() => !user.value || error.value?.toLowerCase().includes('unauthorized'))

const diffClass = computed(() => {
  switch (challenge.value?.difficulty) {
    case 'easy': return 'diff-easy'
    case 'hard': return 'diff-hard'
    default: return 'diff-medium'
  }
})

async function onSubmit() {
  await submit(answerText.value)
  answerText.value = ''
}

onMounted(() => {
  if (user.value) fetchToday()
})

watch(user, (u) => {
  if (u) fetchToday()
})
</script>

<style scoped>
.daily-challenge-card {
  @apply rounded-2xl p-6 bg-brand-card/60 border border-brand-border/30 backdrop-blur-sm;
  background-image: radial-gradient(circle at top right, rgba(245, 158, 11, 0.08), transparent 60%);
}

.diff-badge {
  @apply px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider;
}

.diff-easy {
  @apply bg-green-500/15 text-green-400 border border-green-500/30;
}

.diff-medium {
  @apply bg-accent-amber/15 text-accent-amber border border-accent-amber/30;
}

.diff-hard {
  @apply bg-accent-red/15 text-accent-red border border-accent-red/30;
}
</style>
