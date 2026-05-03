export function useSTT(onResult: (text: string) => void) {
  const isListening = ref(false)
  const isSupported = ref(false)
  const transcript = ref('')

  let mediaRecorder: MediaRecorder | null = null
  let chunks: Blob[] = []
  let sr: any = null

  onMounted(() => {
    isSupported.value = !!(navigator.mediaDevices && window.MediaRecorder)

    // Browser SpeechRecognition for live subtitle display only
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SR) {
      sr = new SR()
      sr.lang = 'en-US'
      sr.interimResults = true
      sr.continuous = true
      sr.onresult = (event: any) => {
        let interim = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          interim += event.results[i][0].transcript
        }
        transcript.value = interim
      }
      sr.onerror = () => {}
    }
  })

  async function startListening() {
    if (!isSupported.value || isListening.value) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunks = []
      transcript.value = ''

      mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunks, { type: 'audio/webm' })
        chunks = []
        if (blob.size < 1000) {
          isListening.value = false
          transcript.value = ''
          return
        }
        const formData = new FormData()
        formData.append('audio', blob, 'audio.webm')
        try {
          const res = await fetch('/api/stt', { method: 'POST', body: formData })
          const data = await res.json()
          if (data.text?.trim()) onResult(data.text.trim())
        } catch (e) {
          console.warn('STT error:', e)
        } finally {
          isListening.value = false
          transcript.value = ''
        }
      }

      mediaRecorder.start()
      isListening.value = true
      if (sr) try { sr.start() } catch (e) {}
    } catch (e) {
      console.warn('Microphone error:', e)
      isListening.value = false
    }
  }

  function stopListening() {
    if (sr) try { sr.stop() } catch (e) {}
    if (mediaRecorder && isListening.value) mediaRecorder.stop()
  }

  function toggleListening() {
    if (isListening.value) stopListening()
    else startListening()
  }

  onUnmounted(() => stopListening())

  return { startListening, stopListening, toggleListening, isListening, isSupported, transcript }
}
