<template>
  <div class="auth-page">
    <div class="auth-card">
      <!-- Logo -->
      <div class="text-center mb-8">
        <span class="text-4xl">🔥</span>
        <h1 class="font-display font-bold text-2xl text-white mt-3">Welcome Back</h1>
        <p class="text-gray-400 text-sm mt-1">Sign in to continue your roasting journey</p>
      </div>

      <!-- Error -->
      <div v-if="errorMsg" class="p-3 mb-4 rounded-xl bg-accent-red/10 border border-accent-red/20">
        <p class="text-sm text-accent-red text-center">{{ errorMsg }}</p>
      </div>

      <!-- Form -->
      <form class="space-y-4" @submit.prevent="handleLogin">
        <div>
          <label class="block text-xs text-gray-400 mb-1.5 font-medium">Email</label>
          <input
            v-model="email"
            type="email"
            placeholder="you@example.com"
            class="auth-input"
            required
          />
        </div>
        <div>
          <label class="block text-xs text-gray-400 mb-1.5 font-medium">Password</label>
          <input
            v-model="password"
            type="password"
            placeholder="••••••••"
            class="auth-input"
            required
          />
        </div>
        <button
          type="submit"
          class="auth-btn"
          :disabled="loading"
        >
          <div v-if="loading" class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span v-else>Sign In</span>
        </button>
      </form>

      <!-- Link to register -->
      <p class="text-center text-sm text-gray-500 mt-6">
        Don't have an account?
        <NuxtLink to="/register" class="text-accent-red hover:text-accent-flame transition-colors font-medium">
          Sign Up
        </NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const supabase = useSupabaseClient()
const router = useRouter()
const { ensureProfile } = useEnsureProfile()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

const handleLogin = async () => {
  loading.value = true
  errorMsg.value = ''

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  })

  if (error) {
    errorMsg.value = error.message
  } else {
    const userId = data.user?.id
    const uname = data.user?.user_metadata?.username || data.user?.email?.split('@')[0] || 'Anonymous'

    // Ensure profile row exists
    if (userId) {
      await ensureProfile(userId, uname)

      // Track login streak
      try {
        await $fetch('/api/streak', {
          method: 'POST',
          body: { userId, username: uname },
        })
      } catch (e) {
        console.warn('Streak update skipped:', e)
      }
    }

    router.push('/')
  }

  loading.value = false
}

useHead({ title: 'Sign In — Tayaq.ai' })
</script>

<style scoped>
.auth-page {
  min-height: calc(100vh - 4rem);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
}

.auth-card {
  width: 100%;
  max-width: 400px;
  padding: 2.5rem;
  background: rgba(17, 17, 17, 0.8);
  border: 1px solid rgba(42, 42, 42, 0.5);
  border-radius: 1.5rem;
  backdrop-filter: blur(24px);
}

.auth-input {
  width: 100%;
  padding: 0.75rem 1rem;
  background: rgba(26, 26, 26, 0.8);
  border: 1px solid rgba(42, 42, 42, 0.5);
  border-radius: 0.75rem;
  color: white;
  font-size: 0.9375rem;
  outline: none;
  transition: all 0.2s ease;
}

.auth-input::placeholder {
  color: #4b5563;
}

.auth-input:focus {
  border-color: rgba(239, 68, 68, 0.4);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.auth-btn {
  width: 100%;
  padding: 0.75rem;
  background: linear-gradient(135deg, #ef4444, #f97316);
  color: white;
  font-weight: 600;
  font-size: 0.9375rem;
  border: none;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.auth-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(239, 68, 68, 0.3);
}

.auth-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
