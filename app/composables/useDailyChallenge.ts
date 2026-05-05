export interface DailyChallenge {
  id: string
  date: string
  kazakh_sentence: string
  difficulty: string
  completed: boolean
  completion: {
    is_correct: boolean
    score: number
    feedback: string | null
    user_answer: string
    xp_awarded: number
    completed_at: string
  } | null
}

export interface DailyChallengeResult {
  is_correct: boolean
  score: number
  feedback: string | null
  user_answer: string
  expected_english: string
  xp_awarded: number
  alreadySubmitted: boolean
}

export function useDailyChallenge() {
  const challenge = ref<DailyChallenge | null>(null)
  const loading = ref(false)
  const submitting = ref(false)
  const error = ref<string | null>(null)
  const result = ref<DailyChallengeResult | null>(null)

  async function fetchToday() {
    loading.value = true
    error.value = null
    try {
      challenge.value = await $fetch<DailyChallenge>('/api/daily-challenge')
    } catch (e: any) {
      // 401 means signed out — caller decides whether to surface
      error.value = e?.statusMessage || e?.message || 'Failed to load challenge'
    } finally {
      loading.value = false
    }
  }

  async function submit(answer: string) {
    if (!answer.trim() || submitting.value) return
    submitting.value = true
    error.value = null
    try {
      const data = await $fetch<DailyChallengeResult>('/api/daily-challenge/submit', {
        method: 'POST',
        body: { answer: answer.trim() },
      })
      result.value = data
      // Reflect completion in the loaded challenge
      if (challenge.value) {
        challenge.value.completed = true
        challenge.value.completion = {
          is_correct: data.is_correct,
          score: data.score,
          feedback: data.feedback,
          user_answer: data.user_answer,
          xp_awarded: data.xp_awarded,
          completed_at: new Date().toISOString(),
        }
      }
    } catch (e: any) {
      error.value = e?.statusMessage || e?.message || 'Failed to submit'
    } finally {
      submitting.value = false
    }
  }

  return { challenge, loading, submitting, error, result, fetchToday, submit }
}
