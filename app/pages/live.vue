<template>
  <div class="live-page">
    <!-- Header -->
    <header class="live-header">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-accent-red/20 flex items-center justify-center text-lg">😤</div>
          <div>
            <h1 class="font-display font-bold text-white text-sm sm:text-base">Қатал Мұғалім · Live Voice</h1>
            <p class="text-xs flex items-center gap-1" :class="statusColor">
              <span class="w-1.5 h-1.5 rounded-full animate-pulse" :class="statusDotColor" />
              {{ statusText }}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2 sm:gap-3">
          <span v-if="userAge" class="px-2 sm:px-3 py-1 rounded-full bg-brand-card border border-brand-border text-xs text-gray-400">
            Age: <span class="text-white font-bold">{{ userAge }}</span>
          </span>
          <NuxtLink
            to="/"
            class="px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm text-gray-400 hover:text-white hover:bg-brand-card transition-all"
          >
            ←
          </NuxtLink>
        </div>
      </div>
    </header>

    <!-- Main subtitle area (AI speech) -->
    <section class="live-main">
      <div class="max-w-3xl w-full px-6 text-center">
        <!-- AI subtitle (large, central) -->
        <div v-if="aiSubtitle" class="ai-subtitle font-display">
          <template v-for="(segment, i) in parsedAiSubtitle" :key="i">
            <span v-if="segment.kind === 'kazakh'" class="kazakh-roast">{{ segment.text }}</span>
            <span v-else>{{ segment.text }}</span>
          </template>
        </div>

        <!-- Idle hint -->
        <div v-else-if="!isListening" class="idle-hint text-gray-500">
          <p class="font-display text-2xl mb-2">Press and hold the button to talk</p>
          <p class="text-sm">Speak in English. Қатал Мұғалім will roast your mistakes 🔥</p>
        </div>

        <!-- Listening indicator -->
        <div v-else class="listening-pulse">
          <p class="font-display text-2xl text-accent-amber animate-pulse">Listening...</p>
        </div>

        <!-- Error display -->
        <div v-if="error" class="error-banner">
          <p class="text-accent-red text-sm">⚠️ {{ error }}</p>
        </div>
      </div>
    </section>

    <!-- Mic button (push-to-talk) -->
    <section class="mic-section">
      <button
        class="mic-button"
        :class="{ 'is-listening': isListening, 'is-disabled': !isConnected && !isListening }"
        @mousedown="startTalking"
        @mouseup="stopTalking"
        @mouseleave="stopTalking"
        @touchstart.prevent="startTalking"
        @touchend.prevent="stopTalking"
        @touchcancel.prevent="stopTalking"
      >
        <svg class="mic-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 14a3 3 0 003-3V5a3 3 0 00-6 0v6a3 3 0 003 3z" />
          <path d="M19 11a1 1 0 00-2 0 5 5 0 01-10 0 1 1 0 00-2 0 7 7 0 006 6.92V20H8a1 1 0 000 2h8a1 1 0 000-2h-3v-2.08A7 7 0 0019 11z" />
        </svg>
      </button>
      <p class="mt-3 text-xs text-gray-500 text-center">
        {{ isListening ? 'Release to send' : 'Hold to talk' }}
      </p>
    </section>

    <!-- User subtitle (bottom captions) -->
    <section class="user-subtitle-bar">
      <div class="max-w-3xl mx-auto px-4">
        <p class="text-[10px] uppercase tracking-wider text-gray-600 mb-1">You said:</p>
        <p class="user-subtitle">{{ userSubtitle || ' ' }}</p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'chat' })

const route = useRoute()
const userAge = computed(() => Number(route.query.age) || null)

const ageRef = computed(() => userAge.value)
const {
  isConnected,
  isConnecting,
  isListening,
  isSpeaking,
  userSubtitle,
  aiSubtitle,
  error,
  connect,
  startListening,
  stopListening,
} = useRealtimeVoice({ age: ageRef })

// Status display
const statusText = computed(() => {
  if (error.value) return 'Error — check console'
  if (isListening.value) return 'Listening to you...'
  if (isSpeaking.value) return 'Қатал Мұғалім is speaking...'
  if (isConnected.value) return 'Connected · ready'
  if (isConnecting.value) return 'Connecting...'
  return 'Click the button to start'
})

const statusColor = computed(() => {
  if (error.value) return 'text-accent-red'
  if (isListening.value) return 'text-accent-amber'
  if (isSpeaking.value) return 'text-accent-flame'
  if (isConnected.value) return 'text-green-400'
  if (isConnecting.value) return 'text-yellow-400'
  return 'text-gray-500'
})

const statusDotColor = computed(() => {
  if (error.value) return 'bg-accent-red'
  if (isListening.value) return 'bg-accent-amber'
  if (isSpeaking.value) return 'bg-accent-flame'
  if (isConnected.value) return 'bg-green-400'
  if (isConnecting.value) return 'bg-yellow-400'
  return 'bg-gray-500'
})

// Parse [KZ:"..."] markers in AI subtitle for visual styling
type Segment = { kind: 'english' | 'kazakh'; text: string }

const parsedAiSubtitle = computed<Segment[]>(() => {
  const text = aiSubtitle.value
  if (!text) return []
  const re = /\[KZ:"([^"]+)"\]/g
  const segments: Segment[] = []
  let last = 0
  let m
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      segments.push({ kind: 'english', text: text.slice(last, m.index) })
    }
    segments.push({ kind: 'kazakh', text: m[1] })
    last = m.index + m[0].length
  }
  if (last < text.length) {
    segments.push({ kind: 'english', text: text.slice(last) })
  }
  return segments
})

// Push-to-talk handlers (must be a regular function for click/touch)
function startTalking() {
  if (isListening.value) return
  startListening()
}

function stopTalking() {
  if (!isListening.value) return
  stopListening()
}

// Connect on mount
onMounted(() => {
  connect()
})

useHead({
  title: 'Live Voice — Tayaq.ai',
})
</script>

<style scoped>
.live-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
}

.live-header {
  flex-shrink: 0;
  border-bottom: 1px solid rgba(42, 42, 42, 0.3);
  background: rgba(17, 17, 17, 0.5);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
}

.live-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
}

.ai-subtitle {
  font-size: clamp(1.25rem, 2.5vw, 2rem);
  line-height: 1.4;
  color: white;
  font-weight: 700;
  text-wrap: balance;
}

.kazakh-roast {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  margin: 0 0.125rem;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(245, 158, 11, 0.15));
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 0.375rem;
  color: #fca5a5;
  font-style: italic;
}

.idle-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.listening-pulse p {
  letter-spacing: 0.02em;
}

.error-banner {
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 0.75rem;
}

.mic-section {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem 0;
}

.mic-button {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ef4444, #f97316);
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5);
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
}

.mic-button:hover:not(.is-disabled) {
  transform: scale(1.05);
  box-shadow: 0 0 30px rgba(239, 68, 68, 0.4);
}

.mic-button:active {
  transform: scale(0.95);
}

.mic-button.is-listening {
  background: linear-gradient(135deg, #f59e0b, #ef4444);
  animation: micPulse 1.2s ease-in-out infinite;
  transform: scale(1.1);
}

.mic-button.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.mic-icon {
  width: 48px;
  height: 48px;
}

@keyframes micPulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.6);
  }
  50% {
    box-shadow: 0 0 0 24px rgba(245, 158, 11, 0);
  }
}

.user-subtitle-bar {
  flex-shrink: 0;
  padding: 1rem 0 1.5rem;
  border-top: 1px solid rgba(42, 42, 42, 0.3);
  background: rgba(10, 10, 10, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  min-height: 80px;
}

.user-subtitle {
  font-family: 'Menlo', 'Monaco', monospace;
  font-size: 1rem;
  color: #9ca3af;
  text-align: center;
  min-height: 1.5rem;
  line-height: 1.5;
}
</style>
