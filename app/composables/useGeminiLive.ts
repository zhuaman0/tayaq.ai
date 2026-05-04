/**
 * useGeminiLive — Vue composable wrapping the Gemini Live WebSocket session.
 *
 * Connects to our Nitro proxy at /api/gemini-ws (which relays to Google with
 * the API key). Implements push-to-talk: hold the button to stream mic audio,
 * release to commit the turn and let the AI respond.
 *
 * Subtitles update incrementally via input/output transcription events.
 */

interface GeminiLiveOptions {
  age: Ref<number | null>
}

export function useGeminiLive(opts: GeminiLiveOptions) {
  const isConnected = ref(false)
  const isListening = ref(false)
  const isSpeaking = ref(false)
  const userSubtitle = ref('')
  const aiSubtitle = ref('')
  const error = ref<string | null>(null)

  let ws: WebSocket | null = null

  const audioCapture = useAudioCapture((base64Pcm) => {
    if (ws?.readyState !== WebSocket.OPEN) return
    ws.send(
      JSON.stringify({
        realtimeInput: {
          mediaChunks: [{ mimeType: 'audio/pcm;rate=16000', data: base64Pcm }],
        },
      })
    )
  })

  const audioPlayback = useAudioPlayback()

  function handleMessage(ev: MessageEvent) {
    let msg: any
    try {
      msg = JSON.parse(ev.data)
    } catch {
      return
    }

    if (msg.error) {
      error.value = msg.error
      return
    }
    if (msg.event === 'upstream_closed') {
      isConnected.value = false
      return
    }

    const sc = msg.serverContent
    if (!sc) return

    // User speech transcription (live)
    if (sc.inputTranscription?.text) {
      userSubtitle.value += sc.inputTranscription.text
    }

    // AI speech transcription (live)
    if (sc.outputTranscription?.text) {
      aiSubtitle.value += sc.outputTranscription.text
    }

    // AI audio chunks
    const parts = sc.modelTurn?.parts ?? []
    for (const part of parts) {
      if (part.inlineData?.mimeType?.startsWith('audio/')) {
        isSpeaking.value = true
        audioPlayback.enqueue(part.inlineData.data)
      }
    }

    if (sc.turnComplete) {
      isSpeaking.value = false
    }
    if (sc.interrupted) {
      isSpeaking.value = false
      audioPlayback.stop()
    }
  }

  async function connect() {
    if (ws) return
    error.value = null
    const age = opts.age.value ?? 20
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws'
    ws = new WebSocket(`${protocol}://${location.host}/api/gemini-ws?age=${age}`)
    ws.onopen = () => {
      isConnected.value = true
    }
    ws.onmessage = handleMessage
    ws.onerror = () => {
      error.value = 'WebSocket connection error'
    }
    ws.onclose = () => {
      isConnected.value = false
      ws = null
    }
  }

  async function startListening() {
    if (!isConnected.value) await connect()
    userSubtitle.value = ''
    aiSubtitle.value = ''
    isListening.value = true
    await audioCapture.start()
    if (audioCapture.error.value) {
      error.value = audioCapture.error.value
      isListening.value = false
    }
  }

  function stopListening() {
    isListening.value = false
    audioCapture.stop()
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          realtimeInput: { audioStreamEnd: true },
        })
      )
    }
  }

  function disconnect() {
    audioCapture.stop()
    audioPlayback.stop()
    ws?.close()
    ws = null
    isConnected.value = false
  }

  onUnmounted(() => disconnect())

  return {
    isConnected,
    isListening,
    isSpeaking,
    userSubtitle,
    aiSubtitle,
    error,
    connect,
    startListening,
    stopListening,
    disconnect,
  }
}
