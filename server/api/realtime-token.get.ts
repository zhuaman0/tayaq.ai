/**
 * Mints an ephemeral OpenAI Realtime API token.
 *
 * The browser uses this short-lived token (`ek_...`, valid ~60s for connecting,
 * sessions can run up to 60 min once connected) to open a direct WebRTC
 * connection to OpenAI without exposing our permanent API key.
 *
 * Pattern: https://platform.openai.com/docs/guides/realtime-webrtc
 */

import { buildVoicePersonaPrompt } from '~~/server/utils/voicePersona'

const REALTIME_MODEL = 'gpt-realtime-1.5'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  if (!config.openaiApiKey) {
    throw createError({ statusCode: 500, statusMessage: 'OPENAI_API_KEY not configured on server' })
  }

  const query = getQuery(event)
  const age = Math.max(10, Math.min(99, Number(query.age) || 20))
  const instructions = buildVoicePersonaPrompt({ age })

  const res = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      session: {
        type: 'realtime',
        model: REALTIME_MODEL,
        instructions,
        audio: {
          input: {
            transcription: { model: 'gpt-4o-mini-transcribe' },
            turn_detection: null,
          },
          output: {
            voice: 'cedar',
          },
        },
      },
    }),
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw createError({
      statusCode: res.status,
      statusMessage: `Failed to mint realtime token: ${errorText.slice(0, 200)}`,
    })
  }

  const data = await res.json() as { value?: string; client_secret?: { value: string } }
  const token = data.value ?? data.client_secret?.value

  if (!token) {
    throw createError({
      statusCode: 500,
      statusMessage: `Token response missing client_secret: ${JSON.stringify(data).slice(0, 200)}`,
    })
  }

  return {
    token,
    model: REALTIME_MODEL,
    age,
  }
})
