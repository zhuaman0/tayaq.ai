export function useTTS() {
  const isSpeaking = ref(false)
  const isMuted = ref(false)

  const audioQueue: HTMLAudioElement[] = []
  let isPlayingQueue = false
  let currentAudio: HTMLAudioElement | null = null

  function cleanText(text: string): string {
    return text
      .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F000}-\u{1FFFF}]/gu, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/^#{1,4}\s+/gm, '')
      .replace(/✅/g, 'Correct: ')
      .replace(/❌/g, 'Wrong: ')
      .replace(/\n{2,}/g, '. ')
      .replace(/\n/g, '. ')
      .replace(/\s{2,}/g, ' ')
      .trim()
  }

  async function fetchAudio(text: string): Promise<HTMLAudioElement | null> {
    const cleaned = cleanText(text)
    if (!cleaned) return null
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleaned, voice: 'nova' }),
      })
      if (!res.ok) return null
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audio.onended = () => URL.revokeObjectURL(url)
      return audio
    } catch {
      return null
    }
  }

  function playNext() {
    if (audioQueue.length === 0) {
      isPlayingQueue = false
      isSpeaking.value = false
      currentAudio = null
      return
    }
    const audio = audioQueue.shift()!
    currentAudio = audio
    isSpeaking.value = true
    audio.onended = () => playNext()
    audio.onerror = () => playNext()
    audio.play().catch(() => playNext())
  }

  // Queued sentence-by-sentence TTS — call during streaming for low latency
  async function speakChunk(text: string) {
    if (isMuted.value || !text.trim()) return
    const audio = await fetchAudio(text)
    if (!audio) return
    audioQueue.push(audio)
    if (!isPlayingQueue) {
      isPlayingQueue = true
      playNext()
    }
  }

  // Full-text speak for replay — clears queue first
  async function speak(text: string) {
    if (isMuted.value || !text.trim()) return
    stop()
    const audio = await fetchAudio(text)
    if (!audio) return
    currentAudio = audio
    isSpeaking.value = true
    audio.onended = () => { isSpeaking.value = false; currentAudio = null }
    audio.onerror = () => { isSpeaking.value = false; currentAudio = null }
    audio.play().catch(() => { isSpeaking.value = false })
  }

  function stop() {
    audioQueue.length = 0
    isPlayingQueue = false
    if (currentAudio) {
      currentAudio.pause()
      currentAudio = null
    }
    isSpeaking.value = false
  }

  function toggleMute() {
    isMuted.value = !isMuted.value
    if (isMuted.value) stop()
  }

  onUnmounted(() => stop())

  return {
    speak,
    speakChunk,
    stop,
    toggleMute,
    isSpeaking,
    isMuted,
    isSupported: ref(true),
  }
}
