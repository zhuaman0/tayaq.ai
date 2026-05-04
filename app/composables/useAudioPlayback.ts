/**
 * Plays back PCM16 audio chunks streamed from Gemini Live.
 * Gemini sends 24kHz mono PCM16 base64 chunks; we decode and queue them seamlessly.
 */

function base64ToPcm16(base64: string): Int16Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Int16Array(bytes.buffer)
}

function pcm16ToFloat32(pcm: Int16Array): Float32Array {
  const out = new Float32Array(pcm.length)
  for (let i = 0; i < pcm.length; i++) out[i] = pcm[i] / 0x8000
  return out
}

export function useAudioPlayback() {
  const isPlaying = ref(false)
  let audioContext: AudioContext | null = null
  let nextStartTime = 0
  const PLAYBACK_SAMPLE_RATE = 24000

  function ensureContext() {
    if (!audioContext || audioContext.state === 'closed') {
      audioContext = new AudioContext({ sampleRate: PLAYBACK_SAMPLE_RATE })
      nextStartTime = 0
    }
    if (audioContext.state === 'suspended') {
      audioContext.resume()
    }
    return audioContext
  }

  function enqueue(base64Pcm: string) {
    const ctx = ensureContext()
    const pcm = base64ToPcm16(base64Pcm)
    if (pcm.length === 0) return

    const float32 = pcm16ToFloat32(pcm)
    const buffer = ctx.createBuffer(1, float32.length, PLAYBACK_SAMPLE_RATE)
    buffer.getChannelData(0).set(float32)

    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(ctx.destination)

    const startAt = Math.max(ctx.currentTime, nextStartTime)
    source.start(startAt)
    nextStartTime = startAt + buffer.duration
    isPlaying.value = true

    source.onended = () => {
      if (ctx.currentTime >= nextStartTime - 0.05) {
        isPlaying.value = false
      }
    }
  }

  function stop() {
    isPlaying.value = false
    audioContext?.close()
    audioContext = null
    nextStartTime = 0
  }

  onUnmounted(() => stop())

  return { enqueue, stop, isPlaying }
}
