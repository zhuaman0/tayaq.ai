import { WebSocket } from 'ws'
import { buildVoicePersonaPrompt } from '~~/server/utils/voicePersona'

const GEMINI_WS_URL = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent'
const MODEL = 'models/gemini-3.1-flash-live-preview'

interface PeerContext {
  upstream?: WebSocket
  age: number
}

export default defineWebSocketHandler({
  open(peer) {
    const config = useRuntimeConfig()
    if (!config.geminiApiKey) {
      peer.send(JSON.stringify({ error: 'GEMINI_API_KEY not configured on server' }))
      peer.close()
      return
    }

    const url = new URL(peer.request?.url ?? '/api/gemini-ws', 'http://localhost')
    const ageRaw = url.searchParams.get('age')
    const age = Number(ageRaw) || 20

    const ctx = peer.context as unknown as PeerContext
    ctx.age = age

    const upstream = new WebSocket(`${GEMINI_WS_URL}?key=${config.geminiApiKey}`)
    ctx.upstream = upstream

    upstream.on('open', () => {
      const setup = {
        setup: {
          model: MODEL,
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Charon' },
              },
            },
          },
          systemInstruction: {
            parts: [{ text: buildVoicePersonaPrompt({ age }) }],
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
      }
      upstream.send(JSON.stringify(setup))
    })

    upstream.on('message', (data: Buffer) => {
      try {
        peer.send(data.toString())
      } catch {}
    })

    upstream.on('close', (code, reason) => {
      try {
        peer.send(JSON.stringify({ event: 'upstream_closed', code, reason: reason?.toString() }))
        peer.close()
      } catch {}
    })

    upstream.on('error', (err) => {
      try {
        peer.send(JSON.stringify({ error: 'upstream_error', message: err.message }))
      } catch {}
    })
  },

  message(peer, message) {
    const ctx = peer.context as unknown as PeerContext
    if (ctx.upstream?.readyState === WebSocket.OPEN) {
      ctx.upstream.send(message.text())
    }
  },

  close(peer) {
    const ctx = peer.context as unknown as PeerContext
    ctx.upstream?.close()
  },

  error(peer) {
    const ctx = peer.context as unknown as PeerContext
    ctx.upstream?.close()
  },
})
