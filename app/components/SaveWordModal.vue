<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="open" class="modal-backdrop" @click.self="close">
        <div class="modal-card">
          <!-- Header -->
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-display font-bold text-white text-lg flex items-center gap-2">
              <span>📚</span> Save to Vocabulary
            </h3>
            <button class="modal-close" @click="close">✕</button>
          </div>

          <!-- Word input + lookup -->
          <div class="flex gap-2 mb-3">
            <input
              ref="inputRef"
              v-model="word"
              type="text"
              placeholder="The word to save..."
              class="flex-1 px-3 py-2 bg-brand-black border border-brand-border/50 rounded-lg text-white text-sm outline-none focus:border-accent-red/50"
              :disabled="lookingUp || saving"
              @keydown.enter="lookup"
            />
            <button
              class="px-3 py-2 bg-accent-red/10 border border-accent-red/30 text-accent-red rounded-lg text-sm font-semibold hover:bg-accent-red/20 transition-all disabled:opacity-40"
              :disabled="!word.trim() || lookingUp || saving"
              @click="lookup"
            >
              {{ lookingUp ? '...' : '🔍' }}
            </button>
          </div>

          <!-- Lookup result -->
          <div v-if="result" class="space-y-2 mb-4">
            <div>
              <label class="text-[10px] text-gray-500 uppercase tracking-wide">Definition</label>
              <input v-model="result.definition" class="word-field" />
            </div>
            <div>
              <label class="text-[10px] text-gray-500 uppercase tracking-wide">Example</label>
              <input v-model="result.example" class="word-field" />
            </div>
            <div>
              <label class="text-[10px] text-gray-500 uppercase tracking-wide">Kazakh</label>
              <input v-model="result.translation" class="word-field" />
            </div>
          </div>

          <!-- Save -->
          <button
            v-if="result"
            class="w-full py-2.5 bg-gradient-to-r from-accent-red to-accent-flame text-white rounded-lg font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
            :disabled="saving || !word.trim()"
            @click="save"
          >
            {{ saving ? 'Saving...' : '💾 Save Word' }}
          </button>

          <!-- Status -->
          <p v-if="message" class="text-xs text-center mt-3" :class="messageClass">
            {{ message }}
          </p>

          <p v-if="!user" class="text-xs text-gray-500 text-center mt-3">
            <NuxtLink to="/login" class="text-accent-red hover:underline">Sign in</NuxtLink> to save words.
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{ open: boolean; initialWord?: string }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'saved'): void }>()

const user = useSupabaseUser()
const word = ref('')
const result = ref<{ definition: string; example: string; translation: string } | null>(null)
const lookingUp = ref(false)
const saving = ref(false)
const message = ref('')
const messageClass = ref('text-gray-500')
const inputRef = ref<HTMLInputElement | null>(null)

watch(() => props.open, (val) => {
  if (val) {
    word.value = props.initialWord?.trim() || ''
    result.value = null
    message.value = ''
    nextTick(() => inputRef.value?.focus())
    if (word.value) lookup()
  }
})

function close() {
  emit('close')
}

async function lookup() {
  if (!word.value.trim() || lookingUp.value) return
  lookingUp.value = true
  result.value = null
  message.value = ''
  try {
    result.value = await $fetch<{ definition: string; example: string; translation: string }>(
      '/api/vocab/lookup',
      { method: 'POST', body: { word: word.value.trim() } },
    )
  } catch (e: any) {
    message.value = e?.statusMessage || 'Lookup failed'
    messageClass.value = 'text-accent-red'
  } finally {
    lookingUp.value = false
  }
}

async function save() {
  if (!result.value || !word.value.trim() || saving.value) return
  saving.value = true
  message.value = ''
  try {
    await $fetch('/api/vocab', {
      method: 'POST',
      body: {
        word: word.value.trim(),
        definition: result.value.definition,
        example: result.value.example,
        translation: result.value.translation,
      },
    })
    message.value = '✅ Saved!'
    messageClass.value = 'text-green-400'
    emit('saved')
    setTimeout(close, 800)
  } catch (e: any) {
    message.value = e?.statusMessage || 'Save failed'
    messageClass.value = 'text-accent-red'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal-card {
  width: 100%;
  max-width: 420px;
  background: rgba(17, 17, 17, 0.95);
  border: 1px solid rgba(42, 42, 42, 0.6);
  border-radius: 1.25rem;
  padding: 1.25rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.modal-close {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  color: #9ca3af;
  background: rgba(26, 26, 26, 0.6);
  border: 1px solid rgba(42, 42, 42, 0.5);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.75rem;
}

.modal-close:hover {
  color: white;
  border-color: rgba(239, 68, 68, 0.3);
}

.word-field {
  @apply w-full mt-1 px-3 py-2 bg-brand-black border border-brand-border/40 rounded-lg text-white text-sm outline-none focus:border-accent-red/40 transition-colors;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
