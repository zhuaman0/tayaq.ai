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
 * 5. Function calls: model can call mark_topic_mastered → we POST /api/progress
 *    and feed the result back via conversation.item.create + response.create
 *
 * Refs:
 * - https://platform.openai.com/docs/guides/realtime-webrtc
 * - https://github.com/openai/openai-realtime-agents (push-to-talk pattern)
 */

interface RealtimeVoiceOptions {
  age: Ref<number | null>
  level?: Ref<string | null>
  topic?: Ref<string | null>
  subjectId?: Ref<string>
}

export interface MasteryEvent {
  slug: string
  score: number
  reason: string
  newLevel: string
  newTopicSlug: string | null
  levelChanged: boolean
}

export function useRealtimeVoice(opts: RealtimeVoiceOptions) {
  const isConnected = ref(false)
  const isConnecting = ref(false)
  const isListening = ref(false)
  const isSpeaking = ref(false)
  const userSubtitle = ref('')
  const aiSubtitle = ref('')
  const error = ref<string | null>(null)
  const sessionInfo = ref<{ level: string; topic: string | null } | null>(null)
  const masteryEvents = ref<MasteryEvent[]>([])

  let pc: RTCPeerConnection | null = null
  let dc: RTCDataChannel | null = null
  let audioEl: HTMLAudioElement | null = null
  let micTrack: MediaStreamTrack | null = null
  let connectedAt = 0

  async function handleFunctionCall(item: { call_id: string; name: string; arguments: string }) {
    let payload: Record<string, unknown> = {}
    try {
      payload = JSON.parse(item.arguments || '{}')
    } catch {
      payload = {}
    }

    let toolResult: Record<string, unknown> = { ok: false, error: 'unknown_tool' }

    if (item.name === 'mark_topic_mastered') {
      const slug = String(payload.slug ?? '')
      const score = Number(payload.score ?? 0)
      const reason = String(payload.reason ?? '')
      const subjectId = opts.subjectId?.value

      if (!subjectId) {
        toolResult = { ok: false, error: 'no_subject_id' }
      } else if (!slug) {
        toolResult = { ok: false, error: 'missing_slug' }
      } else {
        try {
          const res = await $fetch<{
            progress: { level: string; current_topic_slug: string | null; mastered_topics: string[] }
            levelChanged: boolean
          }>('/api/progress', {
            method: 'POST',
            body: {
              subjectId,
              action: 'mark_mastered',
              masteredSlug: slug,
            },
          })

          masteryEvents.value.push({
            slug,
            score,
            reason,
            newLevel: res.progress.level,
            newTopicSlug: res.progress.current_topic_slug,
            levelChanged: res.levelChanged,
          })

          toolResult = {
            ok: true,
            new_level: res.progress.level,
            new_topic_slug: res.progress.current_topic_slug,
            level_changed: res.levelChanged,
            mastered_count: res.progress.mastered_topics.length,
          }
        } catch (e: any) {
          toolResult = { ok: false, error: e?.message || 'progress_update_failed' }
        }
      }
    }

    // Send the tool result back to the model
    if (dc?.readyState === 'open') {
      dc.send(
        JSON.stringify({
          type: 'conversation.item.create',
          item: {
            type: 'function_call_output',
            call_id: item.call_id,
            output: JSON.stringify(toolResult),
          },
        })
      )
      // Trigger the model to continue speaking with the tool result
      dc.send(JSON.stringify({ type: 'response.create' }))
    }
  }

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
        isSpeaking.value = false
        break

      // Function call complete — handle and reply
      case 'response.output_item.done':
        if (evt.item?.type === 'function_call') {
          handleFunctionCall(evt.item)
        }
        break

      case 'response.done':
        isSpeaking.value = false
        break

      // User started talking — interrupt AI
      case 'input_audio_buffer.speech_started':
        if (isSpeaking.value) {
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
      const level = opts.level?.value ?? ''
      const topic = opts.topic?.value ?? ''
      const subjectId = opts.subjectId?.value ?? ''
      const params = new URLSearchParams({ age: String(age) })
      if (level) params.set('level', level)
      if (topic) params.set('topic', topic)
      if (subjectId) params.set('subjectId', subjectId)
      const tokenRes = await $fetch<{
        token: string
        model: string
        level: string
        topic: string | null
      }>(`/api/realtime-token?${params.toString()}`)

      sessionInfo.value = { level: tokenRes.level, topic: tokenRes.topic }

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
      micTrack = stream.getTracks()[0]!
      micTrack.enabled = false
      pc.addTrack(micTrack, stream)

      // 4. Open data channel for events
      dc = pc.createDataChannel('oai-events')
      dc.onmessage = (e) => handleEvent(e.data)
      dc.onopen = () => {
        isConnected.value = true
        isConnecting.value = false
        connectedAt = Date.now()
      }

      // 5. SDP offer/answer handshake
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

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

    if (dc?.readyState === 'open') {
      dc.send(JSON.stringify({ type: 'input_audio_buffer.commit' }))
      dc.send(JSON.stringify({ type: 'response.create' }))
    }
  }

  function disconnect() {
    // Best-effort: record the session duration so we can track total minutes
    const subjectId = opts.subjectId?.value
    if (subjectId && connectedAt > 0) {
      const seconds = Math.round((Date.now() - connectedAt) / 1000)
      if (seconds > 1) {
        $fetch('/api/progress', {
          method: 'POST',
          body: { subjectId, action: 'record_session', durationSeconds: seconds },
        }).catch(() => {})
      }
    }
    connectedAt = 0

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
    sessionInfo,
    masteryEvents,
    connect,
    startListening,
    stopListening,
    disconnect,
  }
}
