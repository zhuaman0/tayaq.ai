/**
 * Mints an ephemeral OpenAI Realtime API token.
 *
 * The browser uses this short-lived token (`ek_...`, valid ~60s for connecting,
 * sessions can run up to 60 min once connected) to open a direct WebRTC
 * connection to OpenAI without exposing our permanent API key.
 *
 * Pattern: https://platform.openai.com/docs/guides/realtime-webrtc
 *
 * If `subjectId` is provided, we ensure a `learning_progress` row exists
 * for that subject and override `level` + `topic` from the saved progress
 * (so the user always continues from where they left off). We also inject
 * the `mark_topic_mastered` tool so the model can advance the curriculum
 * mid-conversation.
 */

import { buildVoicePersonaPrompt } from '~~/server/utils/voicePersona'
import { ensureProgress } from '~~/server/utils/progress'
import type { Level } from '~~/server/utils/curriculum'

const REALTIME_MODEL = 'gpt-realtime-1.5'

const TOOLS = [
  {
    type: 'function' as const,
    name: 'mark_topic_mastered',
    description:
      'Call this when the student has demonstrated solid mastery of the current topic during conversation — they used the target vocabulary correctly, applied the grammar focus without prompting, and answered follow-up questions confidently. After you call this, the system will advance them to the next topic; you should celebrate briefly in Kazakh and seamlessly transition.',
    parameters: {
      type: 'object',
      properties: {
        slug: {
          type: 'string',
          description: 'Slug of the topic the student just mastered (must match the topic slug from the curriculum injected in the prompt).',
        },
        score: {
          type: 'number',
          description: 'Confidence 0-100 for how well the student mastered the topic.',
        },
        reason: {
          type: 'string',
          description: 'One short sentence explaining what they did well.',
        },
      },
      required: ['slug', 'score', 'reason'],
    },
  },
]

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  if (!config.openaiApiKey) {
    throw createError({ statusCode: 500, statusMessage: 'OPENAI_API_KEY not configured on server' })
  }

  const query = getQuery(event)
  const age = Math.max(10, Math.min(99, Number(query.age) || 20))
  const seedLevel = typeof query.level === 'string' ? query.level : undefined
  const seedTopic = typeof query.topic === 'string' ? query.topic : undefined
  const subjectId = typeof query.subjectId === 'string' ? query.subjectId.trim() : ''

  // If a subjectId is provided, fetch saved progress; otherwise fall back
  // to whatever the client passed in the URL (anonymous one-shot session).
  let level: Level = (seedLevel as Level) || 'beginner'
  let topicSlug = seedTopic
  let progressInfo: {
    subjectId: string
    masteredCount: number
    totalTopicsAtLevel: number
  } | null = null

  if (subjectId && subjectId.length >= 8) {
    try {
      const progress = await ensureProgress({ subjectId, seedLevel })
      level = progress.level
      topicSlug = progress.current_topic_slug ?? topicSlug
      progressInfo = {
        subjectId,
        masteredCount: progress.mastered_topics?.length ?? 0,
        totalTopicsAtLevel: 6, // matches curriculum config
      }
    } catch (err) {
      // Don't break the session if Supabase is unavailable — just continue
      // without progress tracking and let the user pick level via URL.
      console.error('[realtime-token] progress lookup failed, continuing anonymous:', err)
    }
  }

  const instructions = buildVoicePersonaPrompt({ age, level, topicSlug })

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
        tools: TOOLS,
        tool_choice: 'auto',
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

  const data = (await res.json()) as { value?: string; client_secret?: { value: string } }
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
    level,
    topic: topicSlug ?? null,
    progress: progressInfo,
  }
})
