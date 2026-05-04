/**
 * useRealtimeVoice — Vue composable wrapping OpenAI's Realtime API session.
 *
 * Architecture:
 * 1. Browser fetches an ephemeral token from our /api/realtime-token endpoint
 * 2. Browser opens a direct WebRTC connection to OpenAI (api.openai.com/v1/realtime)
 *    - Mic audio is added as an outgoing track (initially muted = push-to-talk)
 *    - AI audio comes back on a remote track and plays via an <audio> element
 *    - Events flow over a data channel named 'oai-events'
 * 3. Push-to-talk: hold the button → unmute mic; release → commit + create response
 * 4. Subtitles: incremental delta events for both user input and AI output
 *
 * Refs:
 * - https://platform.openai.com/docs/guides/realtime-webrtc
 * - https://github.com/openai/openai-realtime-agents (push-to-talk pattern)
 */

interface RealtimeVoiceOptions {
  age: Ref<number | null>
}

export function useRealtimeVoice(opts: RealtimeVoiceOptions) {
  const isConnected = ref(false)
  const isConnecting = ref(false)
  const isListening = ref(false)
  const isSpeaking = ref(false)
  const userSubtitle = ref('')
  const aiSubtitle = ref('')
  const error = ref<string | null>(null)

  let pc: RTCPeerConnection | null = null
  let dc: RTCDataChannel | null = null
  let audioEl: HTMLAudioElement | null = null
  let micTrack: MediaStreamTrack | null = null

  function handleEvent(raw: string) {
    let evt: any
    try {
      evt = JSON.parse(raw)
    } catch {
      return
    }

    switch (evt.type) {
      case 'session.created':
      case 'session.updated':
        // Server confirmed our session config
        break

      // User speech transcription (live deltas while they speak)
      case 'conversation.item.input_audio_transcription.delta':
        userSubtitle.value += evt.delta ?? ''
        break
      case 'conversation.item.input_audio_transcription.completed':
        if (evt.transcript) userSubtitle.value = evt.transcript
        break

      // AI speech transcription (live deltas while AI speaks)
      case 'response.output_audio_transcript.delta':
      case 'response.audio_transcript.delta':
        aiSubtitle.value += evt.delta ?? ''
        break
      case 'response.output_audio_transcript.done':
      case 'response.audio_transcript.done':
        if (evt.transcript) aiSubtitle.value = evt.transcript
        break

      // AI started speaking
      case 'response.created':
        isSpeaking.value = true
        break
      case 'response.audio.done':
      case 'response.done':
        isSpeaking.value = false
        break

      // User started talking — interrupt AI
      case 'input_audio_buffer.speech_started':
        if (isSpeaking.value) {
          // Tell server to truncate current response
          dc?.send(JSON.stringify({ type: 'response.cancel' }))
          isSpeaking.value = false
        }
        break

      case 'error':
        error.value = evt.error?.message || 'Unknown realtime error'
        break
    }
  }

  async function connect() {
    if (pc || isConnecting.value) return
    isConnecting.value = true
    error.value = null

    try {
      // 1. Mint ephemeral token from our server
      const age = opts.age.value ?? 20
      const tokenRes = await $fetch<{ token: string; model: string }>(
        `/api/realtime-token?age=${age}`
      )

      // 2. Set up peer connection + audio element for AI playback
      pc = new RTCPeerConnection()

      audioEl = document.createElement('audio')
      audioEl.autoplay = true
      pc.ontrack = (e) => {
        if (audioEl && e.streams[0]) {
          audioEl.srcObject = e.streams[0]
        }
      }

      // 3. Get microphone, add track, START MUTED (push-to-talk)
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      })
      micTrack = stream.getTracks()[0]
      micTrack.enabled = false // muted until user holds the button
      pc.addTrack(micTrack, stream)

      // 4. Open data channel for events
      dc = pc.createDataChannel('oai-events')
      dc.onmessage = (e) => handleEvent(e.data)
      dc.onopen = () => {
        isConnected.value = true
        isConnecting.value = false
      }

      // 5. SDP offer/answer handshake
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      // GA endpoint is /v1/realtime/calls (not /v1/realtime which is beta).
      // Beta endpoint with GA token returns "API version mismatch".
      const sdpRes = await fetch(
        `https://api.openai.com/v1/realtime/calls?model=${tokenRes.model}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${tokenRes.token}`,
            'Content-Type': 'application/sdp',
          },
          body: offer.sdp,
        }
      )

      if (!sdpRes.ok) {
        throw new Error(`SDP exchange failed: ${sdpRes.status} ${await sdpRes.text()}`)
      }

      const answerSdp = await sdpRes.text()
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp })
    } catch (e: any) {
      error.value = e.message || String(e)
      isConnecting.value = false
      disconnect()
    }
  }

  function startListening() {
    if (!isConnected.value || !micTrack) {
      error.value = 'Not connected — please wait'
      return
    }
    userSubtitle.value = ''
    aiSubtitle.value = ''
    micTrack.enabled = true
    isListening.value = true
  }

  function stopListening() {
    if (!isListening.value || !micTrack) return
    micTrack.enabled = false
    isListening.value = false

    // Commit the audio buffer and ask the model to reply
    if (dc?.readyState === 'open') {
      dc.send(JSON.stringify({ type: 'input_audio_buffer.commit' }))
      dc.send(JSON.stringify({ type: 'response.create' }))
    }
  }

  function disconnect() {
    micTrack?.stop()
    if (dc) {
      try {
        dc.close()
      } catch {}
    }
    if (pc) {
      try {
        pc.close()
      } catch {}
    }
    audioEl?.pause()
    if (audioEl) audioEl.srcObject = null
    pc = null
    dc = null
    audioEl = null
    micTrack = null
    isConnected.value = false
    isConnecting.value = false
    isListening.value = false
    isSpeaking.value = false
  }

  onUnmounted(() => disconnect())

  return {
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
    disconnect,
  }
}
