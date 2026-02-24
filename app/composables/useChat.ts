export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export function useChat(age: Ref<number | null>) {
  const messages = ref<ChatMessage[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Add welcome message on init
  const initWelcome = () => {
    if (messages.value.length === 0) {
      const ageVal = age.value || 20
      let greeting = ''

      if (ageVal <= 15) {
        greeting = '🔥 Сәлем, жас бала! Мен — Қател Мұғалім, сенің ең қатал ағылшын мұғалімің!\n\nМаған ағылшынша сөйлем жаз, мен тексеремін. Дайын бол — мархабат! 😤'
      } else if (ageVal <= 20) {
        greeting = '🔥 Е, сәлем! Мен — Қател Мұғалім. Сенің ағылшыныңды тексеруге келдім.\n\nМаған бір ағылшынша сөйлем жаз — көрейінші, не білесің! Қорықпа, тек аздап сөгемін 😏'
      } else if (ageVal <= 25) {
        greeting = '🔥 Сәлем, студент! Мен — Қател Мұғалім, Қазақстанның ең қатал ағылшын мұғалімі!\n\nУниверситетті бітірдің бе, жоқ па — маған бәрібір. Маған ағылшынша жаз, мен тексеремін. Дайын бол, жеңіл болмайды! 💀'
      } else {
        greeting = '🔥 О, сәлеметсіз бе! Мен — Қател Мұғалім. ' + ageVal + ' жасқа келіпсіз, бірақ ағылшыныңыз қалай — соны көрейік!\n\nМаған ағылшынша сөйлем жазыңыз. Мен тексеремін, бірақ ескертемін — аяушылық жоқ! ☠️'
      }

      messages.value.push({
        role: 'assistant',
        content: greeting,
        timestamp: new Date()
      })
    }
  }

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading.value) return

    error.value = null

    // Add user message
    messages.value.push({
      role: 'user',
      content: text.trim(),
      timestamp: new Date()
    })

    isLoading.value = true

    // Add placeholder for AI response
    const aiMessageIndex = messages.value.length
    messages.value.push({
      role: 'assistant',
      content: '',
      timestamp: new Date()
    })

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.value
            .filter(m => m.content) // skip empty placeholder
            .map(m => ({ role: m.role, content: m.content })),
          age: age.value || 20
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || `HTTP ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response stream')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              if (parsed.error) {
                throw new Error(parsed.error)
              }
              if (parsed.content && messages.value[aiMessageIndex]) {
                messages.value[aiMessageIndex].content += parsed.content
              }
            } catch (e) {
              // Skip malformed JSON lines
            }
          }
        }
      }
    } catch (e: any) {
      error.value = e.message || 'Failed to send message'
      // Remove empty AI message on error
      if (messages.value[aiMessageIndex] && !messages.value[aiMessageIndex].content) {
        messages.value.splice(aiMessageIndex, 1)
      }
    } finally {
      isLoading.value = false
    }
  }

  const clearMessages = () => {
    messages.value = []
    initWelcome()
  }

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    initWelcome,
  }
}
