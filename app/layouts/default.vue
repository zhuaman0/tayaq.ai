<template>
  <div class="min-h-screen bg-brand-black text-white">
    <!-- Navbar -->
    <nav class="fixed top-0 left-0 right-0 z-50 bg-brand-black/80 backdrop-blur-xl border-b border-brand-border/30">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <NuxtLink to="/" class="flex items-center gap-2 group">
            <span class="text-2xl">🔥</span>
            <span class="font-display font-bold text-xl text-white group-hover:text-accent-red transition-colors">
              Qatel Mugalim
            </span>
          </NuxtLink>
          <div class="flex items-center gap-6">
            <a href="#how-it-works" class="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block">
              How It Works
            </a>
            <a href="#testimonials" class="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block">
              Reviews
            </a>
            <NuxtLink
              to="/"
              class="px-4 py-2 text-sm font-semibold text-white bg-accent-red/10 border border-accent-red/30 rounded-lg hover:bg-accent-red/20 transition-all"
            >
              Start Learning
            </NuxtLink>
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
            <span class="text-xl">🔥</span>
            <span class="font-display font-bold text-lg">Qatel Mugalim</span>
          </div>
          <p class="text-sm text-gray-500 text-center">
            © 2025 Qatel Mugalim. Learning English was never this painful — or this effective.
          </p>
          <div class="flex gap-4">
            <a href="#" class="text-gray-500 hover:text-accent-red transition-colors text-sm">Privacy</a>
            <a href="#" class="text-gray-500 hover:text-accent-red transition-colors text-sm">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>
