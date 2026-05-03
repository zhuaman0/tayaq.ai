<template>
  <Teleport to="body">
    <div v-if="isOpen" class="chat-overlay" @click.self="$emit('close')">
      <div class="chat-modal">
        <!-- Header -->
        <div class="chat-header">
          <div class="flex items-center gap-3">
            <div class="avatar">{{ partnerName.charAt(0).toUpperCase() }}</div>
            <div>
              <h3 class="font-display font-bold text-white text-sm">{{ partnerName }}</h3>
              <p class="text-xs text-gray-500">{{ partnerCity || 'Tayaq.ai learner' }}</p>
            </div>
          </div>
          <button class="close-btn" @click="$emit('close')">✕</button>
        </div>

        <!-- Messages -->
        <div ref="messagesContainerRef" class="chat-messages">
          <div v-if="loading" class="flex justify-center py-8">
            <div class="text-gray-500 text-sm">Loading messages...</div>
          </div>
          <div v-else-if="messages.length === 0" class="empty-state">
            <span class="text-3xl">👋</span>
            <p class="text-gray-400 text-sm mt-2">Start a conversation!</p>
            <p class="text-gray-600 text-xs mt-1">Say hi and practice English together</p>
          </div>
          <template v-else>
            <div
              v-for="msg in messages"
              :key="msg.id"
              :class="['message', msg.sender_id === currentUserId ? 'sent' : 'received']"
            >
              <div class="message-bubble">
                <p class="text-sm">{{ msg.content }}</p>
                <span class="message-time">{{ formatTime(msg.created_at) }}</span>
              </div>
            </div>
          </template>
        </div>

        <!-- Input -->
        <div class="chat-input">
          <input
            v-model="newMessage"
            type="text"
            placeholder="Type a message..."
            class="message-input"
            @keyup.enter="handleSend"
          />
          <button
            class="send-btn"
            :disabled="!newMessage.trim() || sending"
            @click="handleSend"
          >
            {{ sending ? '...' : '→' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{
  isOpen: boolean
  partnerId: string
  partnerName: string
  partnerCity?: string
}>()

const emit = defineEmits(['close'])

const { loadConversation, sendMessage } = useMessages()
const user = useSupabaseUser()

const messages = ref<any[]>([])
const newMessage = ref('')
const loading = ref(true)
const sending = ref(false)
const messagesContainerRef = ref<HTMLElement | null>(null)

const currentUserId = computed(() => user.value?.id || '')

const formatTime = (dateStr: string) => {
  const d = new Date(dateStr)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) {
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainerRef.value) {
      messagesContainerRef.value.scrollTop = messagesContainerRef.value.scrollHeight
    }
  })
}

const load = async () => {
  if (!user.value?.id || !props.partnerId) return
  loading.value = true
  messages.value = await loadConversation(props.partnerId)
  loading.value = false
  scrollToBottom()
}

const handleSend = async () => {
  if (!user.value?.id || !newMessage.value.trim() || sending.value) return
  sending.value = true
  const msg = await sendMessage(props.partnerId, newMessage.value)
  if (msg) {
    messages.value.push(msg)
    newMessage.value = ''
    scrollToBottom()
  }
  sending.value = false
}

// Load messages when chat opens + poll every 5s
let interval: ReturnType<typeof setInterval> | null = null

watch(() => props.isOpen, (open) => {
  if (interval) {
    clearInterval(interval)
    interval = null
  }

  if (open) {
    load()
    interval = setInterval(() => {
      if (props.isOpen && user.value?.id) {
        loadConversation(props.partnerId).then(data => {
          messages.value = data
        })
      }
    }, 5000)
  }
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
})
</script>

<style scoped>
.chat-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.chat-modal {
  width: 420px;
  max-width: 95vw;
  height: 600px;
  max-height: 85vh;
  background: #111;
  border: 1px solid rgba(42, 42, 42, 0.5);
  border-radius: 1.25rem;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5);
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid rgba(42, 42, 42, 0.5);
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ef4444;
  font-weight: 700;
  font-size: 0.875rem;
}

.close-btn {
  color: #6b7280;
  font-size: 1rem;
  cursor: pointer;
  background: none;
  border: none;
  padding: 0.25rem;
}

.close-btn:hover {
  color: white;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.message {
  display: flex;
  max-width: 80%;
}

.message.sent {
  align-self: flex-end;
}

.message.received {
  align-self: flex-start;
}

.message-bubble {
  padding: 0.625rem 0.875rem;
  border-radius: 1rem;
  position: relative;
}

.sent .message-bubble {
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.15);
  border-bottom-right-radius: 0.25rem;
  color: #fca5a5;
}

.received .message-bubble {
  background: rgba(42, 42, 42, 0.5);
  border: 1px solid rgba(42, 42, 42, 0.5);
  border-bottom-left-radius: 0.25rem;
  color: #d1d5db;
}

.message-time {
  font-size: 0.625rem;
  color: #6b7280;
  margin-top: 0.25rem;
  display: block;
}

.chat-input {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-top: 1px solid rgba(42, 42, 42, 0.5);
}

.message-input {
  flex: 1;
  background: rgba(17, 17, 17, 0.8);
  border: 1px solid rgba(42, 42, 42, 0.5);
  border-radius: 9999px;
  padding: 0.625rem 1rem;
  color: white;
  font-size: 0.8125rem;
  outline: none;
}

.message-input:focus {
  border-color: rgba(239, 68, 68, 0.4);
}

.message-input::placeholder {
  color: #4b5563;
}

.send-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #ef4444;
  color: white;
  font-weight: 700;
  font-size: 1.125rem;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.send-btn:hover:not(:disabled) {
  background: #dc2626;
  transform: scale(1.05);
}

.send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
