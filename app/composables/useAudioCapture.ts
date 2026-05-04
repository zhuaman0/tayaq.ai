/**
 * Captures microphone audio as PCM16 16kHz mono and emits base64 chunks.
 * Uses an AudioWorklet for off-main-thread resampling and conversion.
 */

function int16ArrayToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

export function useAudioCapture(onChunk: (base64Pcm: string) => void) {
  const isRecording = ref(false)
  const error = ref<string | null>(null)

  let audioContext: AudioContext | null = null
  let mediaStream: MediaStream | null = null
  let workletNode: AudioWorkletNode | null = null
  let sourceNode: MediaStreamAudioSourceNode | null = null

  async function start() {
    if (isRecording.value) return
    error.value = null

    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 },
      })

      audioContext = new AudioContext()
      await audioContext.audioWorklet.addModule('/audio-worklet/pcm-recorder.js')

      sourceNode = audioContext.createMediaStreamSource(mediaStream)
      workletNode = new AudioWorkletNode(audioContext, 'pcm-recorder')

      workletNode.port.onmessage = (e) => {
        const buffer = e.data as ArrayBuffer
        onChunk(int16ArrayToBase64(buffer))
      }

      sourceNode.connect(workletNode)
      // Don't connect worklet to destination — we don't want to hear our own mic
      isRecording.value = true
    } catch (e: any) {
      error.value = e.message || 'Microphone access denied'
      cleanup()
    }
  }

  function stop() {
    if (!isRecording.value) return
    isRecording.value = false
    cleanup()
  }

  function cleanup() {
    workletNode?.disconnect()
    sourceNode?.disconnect()
    mediaStream?.getTracks().forEach((t) => t.stop())
    audioContext?.close()
    workletNode = null
    sourceNode = null
    mediaStream = null
    audioContext = null
  }

  onUnmounted(() => stop())

  return { start, stop, isRecording, error }
}
