/**
 * Composable for sending and receiving direct messages via Supabase.
 */
export function useMessages() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  /**
   * Load conversation history between current user and another user.
   */
  const loadConversation = async (otherUserId: string) => {
    const myId = user.value?.id
    if (!myId || !otherUserId) return []

    const { data, error } = await (supabase.from('messages') as any)
      .select('*')
      .or(`and(sender_id.eq.${myId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${myId})`)
      .order('created_at', { ascending: true })

    if (error) {
      console.warn('Failed to load messages:', error)
      return []
    }

    return data || []
  }

  /**
   * Send a message to another user.
   */
  const sendMessage = async (receiverId: string, content: string) => {
    const myId = user.value?.id
    if (!myId || !receiverId || !content.trim()) return null

    const { data, error } = await (supabase.from('messages') as any).insert({
      sender_id: myId,
      receiver_id: receiverId,
      content: content.trim(),
    }).select().single()

    if (error) {
      console.warn('Failed to send message:', error)
      return null
    }

    return data
  }

  /**
   * Get list of users the current user has conversations with,
   * along with their last message.
   */
  const getConversationList = async () => {
    const myId = user.value?.id
    if (!myId) return []

    // Get all messages involving current user
    const { data: messages, error } = await (supabase.from('messages') as any)
      .select('*')
      .or(`sender_id.eq.${myId},receiver_id.eq.${myId}`)
      .order('created_at', { ascending: false })

    if (error || !messages) return []

    // Group by conversation partner
    const convos = new Map<string, any>()
    for (const msg of messages) {
      const partnerId = msg.sender_id === myId ? msg.receiver_id : msg.sender_id
      if (!convos.has(partnerId)) {
        convos.set(partnerId, {
          partnerId,
          lastMessage: msg.content,
          lastMessageAt: msg.created_at,
          unread: msg.receiver_id === myId && !msg.read ? 1 : 0,
        })
      } else if (msg.receiver_id === myId && !msg.read) {
        convos.get(partnerId).unread += 1
      }
    }

    return Array.from(convos.values())
  }

  return { loadConversation, sendMessage, getConversationList }
}
