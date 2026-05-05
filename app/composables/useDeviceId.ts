/**
 * Stable per-browser identifier persisted in localStorage.
 *
 * Used as the `subject_id` for learning_progress rows when the user is
 * not authenticated. UUID generated once on first call. SSR-safe (returns
 * empty string on server, real value on client after mount).
 */
const STORAGE_KEY = 'tayaq_device_id'

function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Fallback for ancient browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function useDeviceId(): Ref<string> {
  const id = useState<string>('tayaq-device-id', () => '')

  onMounted(() => {
    if (id.value) return
    try {
      const existing = localStorage.getItem(STORAGE_KEY)
      if (existing && existing.length >= 16) {
        id.value = existing
        return
      }
      const fresh = generateUuid()
      localStorage.setItem(STORAGE_KEY, fresh)
      id.value = fresh
    } catch {
      // localStorage blocked (private mode, etc.) — fall back to per-session id
      id.value = generateUuid()
    }
  })

  return id
}
