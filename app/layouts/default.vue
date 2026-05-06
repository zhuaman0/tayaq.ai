<template>
  <div class="min-h-screen bg-brand-black text-white">
    <!-- Navbar -->
    <nav class="fixed top-0 left-0 right-0 z-50 bg-brand-black/80 backdrop-blur-xl border-b border-brand-border/30">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <NuxtLink to="/" class="flex items-center gap-2 group">
            <img :src="logo" alt="Tayaq" class="w-8 h-8 rounded-full object-cover ring-1 ring-accent-red/30" />
            <span class="font-display font-bold text-xl text-white group-hover:text-accent-red transition-colors">
              Tayaq.ai
            </span>
          </NuxtLink>
          <div class="flex items-center gap-4 sm:gap-6">
            <NuxtLink
              to="/live"
              class="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block"
            >
              🎤 Live
            </NuxtLink>
            <NuxtLink
              to="/grammar"
              class="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block"
            >
              📝 Grammar
            </NuxtLink>
            <NuxtLink
              to="/challenge"
              class="text-sm font-semibold text-accent-amber hover:text-white transition-colors hidden sm:block"
            >
              ⚡ Challenge
            </NuxtLink>
            <NuxtLink
              to="/vocab"
              class="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block"
            >
              📚 Vocab
            </NuxtLink>
            <NuxtLink
              to="/leaderboard"
              class="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block"
            >
              🏆 Leaderboard
            </NuxtLink>
            <NuxtLink
              to="/map"
              class="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block"
            >
              🗺️ Map
            </NuxtLink>
            <NuxtLink
              to="/community"
              class="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block"
            >
              👥 Community
            </NuxtLink>
            <!-- Authenticated -->
            <template v-if="user">
              <NuxtLink
                to="/profile"
                class="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1.5"
              >
                <span class="w-6 h-6 rounded-full bg-accent-red/20 flex items-center justify-center text-xs">😤</span>
                <span class="hidden sm:inline">{{ displayName }}</span>
              </NuxtLink>
            </template>
            <!-- Guest -->
            <template v-else>
              <NuxtLink
                to="/login"
                class="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block"
              >
                Sign In
              </NuxtLink>
              <NuxtLink
                to="/register"
                class="px-4 py-2 text-sm font-semibold text-white bg-accent-red/10 border border-accent-red/30 rounded-lg hover:bg-accent-red/20 transition-all"
              >
                Sign Up
              </NuxtLink>
            </template>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="pt-16">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="border-t border-brand-border/30 bg-brand-dark/50 mt-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="flex flex-col md:flex-row items-center justify-between gap-6">
          <div class="flex items-center gap-2">
            <img :src="logo" alt="Tayaq" class="w-7 h-7 rounded-full object-cover" />
            <span class="font-display font-bold text-lg">Tayaq.ai</span>
          </div>
          <p class="text-sm text-gray-500 text-center">
            © {{ currentYear }} Tayaq.ai. Learning English was never this painful — or this effective.
          </p>
          <div class="flex gap-4">
            <NuxtLink to="/leaderboard" class="text-gray-500 hover:text-accent-red transition-colors text-sm">Leaderboard</NuxtLink>
            <a href="#" class="text-gray-500 hover:text-accent-red transition-colors text-sm">Privacy</a>
            <a href="#" class="text-gray-500 hover:text-accent-red transition-colors text-sm">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import logo from '~/assets/logo.jpg'

const currentYear = new Date().getFullYear()
const user = useSupabaseUser()

const displayName = computed(() => {
  return user.value?.user_metadata?.username || user.value?.email?.split('@')[0] || 'Profile'
})
</script>
