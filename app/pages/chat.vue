<template>
  <div class="chat-page">
    <!-- Chat Header -->
    <div class="chat-header">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-accent-red/20 flex items-center justify-center text-lg">
            😤
          </div>
          <div>
            <h1 class="font-display font-bold text-white text-sm sm:text-base">Qatel Mugalim</h1>
            <p class="text-xs flex items-center gap-1" :class="isLoading ? 'text-accent-amber' : 'text-accent-red'">
              <span class="w-1.5 h-1.5 rounded-full animate-pulse" :class="isLoading ? 'bg-accent-amber' : 'bg-accent-red'" />
              {{ isLoading ? 'Typing...' : 'Online · Ready to judge you' }}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2 sm:gap-3">
          <span v-if="userAge" class="px-2 sm:px-3 py-1 rounded-full bg-brand-card border border-brand-border text-xs text-gray-400">
            Age: <span class="text-white font-bold">{{ userAge }}</span>
          </span>
          <span class="px-2 sm:px-3 py-1 rounded-full bg-accent-red/10 border border-accent-red/20 text-xs font-bold" :class="roastColor">
            {{ roastLabel }}
          </span>
          <NuxtLink
            to="/"
            class="px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm text-gray-400 hover:text-white hover:bg-brand-card transition-all"
          >
            ←
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Messages Area -->
    <div ref="messagesContainer" class="chat-messages">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        <!-- Messages -->
        <div
          v-for="(msg, i) in messages"
          :key="i"
          class="chat-message animate-slide-up"
          :class="msg.role === 'user' ? 'chat-message-user' : 'chat-message-ai'"
        >
          <!-- AI Avatar -->
          <div v-if="msg.role === 'assistant'" class="chat-avatar">
            😤
          </div>

          <!-- Message Bubble -->
          <div class="chat-bubble" :class="msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'">
            <div class="chat-content" v-html="formatMessage(msg.content)" />
            <div class="chat-time">
              {{ formatTime(msg.timestamp) }}
            </div>
          </div>
        </div>

        <!-- Typing Indicator -->
        <div v-if="isLoading && !currentAiMessage" class="chat-message chat-message-ai">
          <div class="chat-avatar">😤</div>
          <div class="chat-bubble chat-bubble-ai">
            <div class="typing-dots">
              <span /><span /><span />
            </div>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="error" class="max-w-md mx-auto">
          <div class="p-3 rounded-xl bg-accent-red/10 border border-accent-red/20 text-center">
            <p class="text-sm text-accent-red mb-2">{{ error }}</p>
            <button
              class="text-xs text-gray-400 hover:text-white transition-colors underline"
              @click="error = null"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Suggestions -->
    <div v-if="messages.length <= 1 && !isLoading" class="suggestions-bar">
      <div class="max-w-4xl mx-auto px-4 sm:px-6">
        <p class="text-xs text-gray-500 mb-2">Try one of these:</p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="(suggestion, i) in suggestions"
            :key="i"
            class="suggestion-chip"
            @click="sendSuggestion(suggestion)"
          >
            {{ suggestion }}
          </button>
        </div>
      </div>
    </div>

    <!-- Input Area -->
    <div class="chat-input-bar">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 py-3">
        <form class="chat-input-form" @submit.prevent="handleSend">
          <input
            ref="inputRef"
            v-model="inputText"
            type="text"
            placeholder="Type an English sentence..."
            class="chat-input"
            :disabled="isLoading"
            autocomplete="off"
          />
          <button
            type="submit"
            class="chat-send-btn"
            :disabled="!inputText.trim() || isLoading"
          >
            <svg v-if="!isLoading" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
            <div v-else class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </button>
        </form>
        <p class="text-[10px] text-gray-600 mt-1.5 text-center">
          Press Enter to send · Qatel Mugalim uses GPT-4o
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'chat' })

const route = useRoute()
const userAge = computed(() => Number(route.query.age) || null)

const { messages, isLoading, error, sendMessage, initWelcome } = useChat(userAge)

const inputText = ref('')
const inputRef = ref(null)
const messagesContainer = ref(null)

// Roast level display
const roastLabel = computed(() => {
  const age = userAge.value
  if (!age) return '?'
  if (age <= 15) return '🌶️ Mild'
  if (age <= 20) return '🌶️🌶️ Spicy'
  if (age <= 25) return '🌶️🌶️🌶️ Pain'
  if (age <= 30) return '💀 Brutal'
  return '☠️ No Mercy'
})

const roastColor = computed(() => {
  const age = userAge.value
  if (!age) return 'text-gray-400'
  if (age <= 15) return 'text-yellow-400'
  if (age <= 20) return 'text-accent-amber'
  if (age <= 25) return 'text-accent-flame'
  if (age <= 30) return 'text-accent-red'
  return 'text-red-400'
})

// Check if AI is currently streaming
const currentAiMessage = computed(() => {
  const last = messages.value[messages.value.length - 1]
  return last?.role === 'assistant' && isLoading.value ? last.content : ''
})

// Suggestion chips
const suggestions = [
  'I am agree with you',
  'She don\'t like me',
  'I have went to store',
  'He can to swim very good',
  'I didn\'t knew about it',
  'Me and him is friends',
]

const handleSend = () => {
  if (!inputText.value.trim() || isLoading.value) return
  sendMessage(inputText.value)
  inputText.value = ''
}

const sendSuggestion = (text) => {
  sendMessage(text)
}

// Format message with basic markdown-like rendering
const formatMessage = (content) => {
  if (!content) return ''
  return content
    // Bold: **text**
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // headers
    .replace(/^### (.*$)/gm, '<h4 class="font-display font-bold text-white mt-3 mb-1">$1</h4>')
    .replace(/^## (.*$)/gm, '<h3 class="font-display font-bold text-white mt-3 mb-1">$1</h3>')
    // Correct/Wrong markers
    .replace(/✅/g, '<span class="text-green-400">✅</span>')
    .replace(/❌/g, '<span class="text-accent-red">❌</span>')
    // Newlines
    .replace(/\n/g, '<br/>')
}

// Format timestamp
const formatTime = (date) => {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// Auto-scroll to bottom when messages change
watch(
  () => messages.value.length + (messages.value[messages.value.length - 1]?.content?.length || 0),
  () => {
    nextTick(() => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      }
    })
  }
)

// Initialize welcome message and focus input
onMounted(() => {
  initWelcome()
  nextTick(() => {
    inputRef.value?.focus()
  })
})

useHead({
  title: 'Chat — Qatel Mugalim'
})
</script>

<style scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
}

.chat-header {
  flex-shrink: 0;
  border-bottom: 1px solid rgba(42, 42, 42, 0.3);
  background: rgba(17, 17, 17, 0.5);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  z-index: 10;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  scroll-behavior: smooth;
}

.chat-message {
  display: flex;
  gap: 0.75rem;
  max-width: 85%;
  animation: slideUp 0.3s ease-out;
}

.chat-message-user {
  margin-left: auto;
  flex-direction: row-reverse;
}

.chat-message-ai {
  margin-right: auto;
}

.chat-avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  background: rgba(239, 68, 68, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  flex-shrink: 0;
  margin-top: 0.25rem;
}

.chat-bubble {
  padding: 0.75rem 1rem;
  border-radius: 1.25rem;
  max-width: 100%;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.chat-bubble-user {
  background: linear-gradient(135deg, #ef4444, #f97316);
  color: white;
  border-bottom-right-radius: 0.375rem;
}

.chat-bubble-ai {
  background: rgba(26, 26, 26, 0.8);
  border: 1px solid rgba(42, 42, 42, 0.5);
  color: #d1d5db;
  border-bottom-left-radius: 0.375rem;
}

.chat-content {
  font-size: 0.9375rem;
  line-height: 1.6;
}

.chat-content :deep(strong) {
  color: white;
  font-weight: 600;
}

.chat-content :deep(h3),
.chat-content :deep(h4) {
  font-family: 'Outfit', sans-serif;
}

.chat-time {
  font-size: 0.625rem;
  color: rgba(156, 163, 175, 0.5);
  margin-top: 0.375rem;
  text-align: right;
}

.chat-bubble-user .chat-time {
  color: rgba(255, 255, 255, 0.5);
}

/* Typing dots */
.typing-dots {
  display: flex;
  gap: 4px;
  padding: 4px 0;
}

.typing-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
  animation: typingBounce 1.4s infinite ease-in-out both;
}

.typing-dots span:nth-child(1) { animation-delay: -0.32s; }
.typing-dots span:nth-child(2) { animation-delay: -0.16s; }
.typing-dots span:nth-child(3) { animation-delay: 0s; }

@keyframes typingBounce {
  0%, 80%, 100% { 
    transform: scale(0.6);
    opacity: 0.4;
  }
  40% { 
    transform: scale(1);
    opacity: 1;
  }
}

/* Suggestions */
.suggestions-bar {
  flex-shrink: 0;
  padding: 0.75rem 0;
  border-top: 1px solid rgba(42, 42, 42, 0.2);
}

.suggestion-chip {
  padding: 0.375rem 0.875rem;
  font-size: 0.8125rem;
  border-radius: 9999px;
  background: rgba(26, 26, 26, 0.6);
  border: 1px solid rgba(42, 42, 42, 0.5);
  color: #9ca3af;
  white-space: nowrap;
  transition: all 0.2s ease;
  cursor: pointer;
}

.suggestion-chip:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
  color: white;
  transform: translateY(-1px);
}

/* Input area */
.chat-input-bar {
  flex-shrink: 0;
  border-top: 1px solid rgba(42, 42, 42, 0.3);
  background: rgba(10, 10, 10, 0.95);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
}

.chat-input-form {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.chat-input {
  flex: 1;
  padding: 0.75rem 1.25rem;
  background: rgba(26, 26, 26, 0.8);
  border: 1px solid rgba(42, 42, 42, 0.5);
  border-radius: 1.25rem;
  color: white;
  font-size: 0.9375rem;
  outline: none;
  transition: all 0.2s ease;
}

.chat-input::placeholder {
  color: #4b5563;
}

.chat-input:focus {
  border-color: rgba(239, 68, 68, 0.4);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.chat-input:disabled {
  opacity: 0.5;
}

.chat-send-btn {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background: linear-gradient(135deg, #ef4444, #f97316);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
}

.chat-send-btn:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.3);
}

.chat-send-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.chat-send-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
