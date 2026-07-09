import { useState, useCallback, useMemo } from 'react'
import { fetchConversationsApi, createConversationApi, deleteConversationApi } from '../lib/api'
import type { Message } from '../types'

export interface ConversationListItem {
  id: string
  title: string
  created_at: string | null
  updated_at: string | null
  message_count: number
}

export function useConversations(token: string | null, isGuest: boolean) {
  const [conversations, setConversations] = useState<ConversationListItem[]>([])
  const [activeConv, setActiveConv] = useState<string | null>(null)
  const [guestMessages, setGuestMessages] = useState<Record<string, Message[]>>({})

  const authHeaders = useMemo(() => {
    return token ? { Authorization: `Bearer ${token}` } as Record<string, string> : {} as Record<string, string>
  }, [token])

  const fetchConversations = useCallback(async () => {
    if (!token) return
    const data = await fetchConversationsApi(token)
    setConversations(data)
  }, [token])

  const createConversation = useCallback(async (title: string) => {
    const now = new Date().toISOString()
    if (isGuest) {
      const id = crypto.randomUUID()
      const conv = { id, title, created_at: now, updated_at: now, message_count: 0 }
      setConversations(prev => [conv, ...prev])
      setActiveConv(id)
      return id
    }
    if (!token) return null
    const conv = await createConversationApi(token, title)
    if (conv) {
      setConversations(prev => [{ ...conv, message_count: 0 }, ...prev])
      setActiveConv(conv.id)
      return conv.id
    }
    return null
  }, [token, isGuest])

  const deleteConversation = useCallback(async (id: string) => {
    if (isGuest) {
      if (guestMessages[id]) {
        const { [id]: _, ...rest } = guestMessages
        setGuestMessages(rest)
      }
      setConversations(prev => prev.filter(c => c.id !== id))
      if (activeConv === id) {
        setActiveConv(null)
      }
      return
    }
    if (!token) return
    const ok = await deleteConversationApi(token, id)
    if (ok) {
      setConversations(prev => prev.filter(c => c.id !== id))
      if (activeConv === id) {
        setActiveConv(null)
      }
    }
  }, [token, isGuest, guestMessages, activeConv])

  return {
    conversations,
    setConversations,
    activeConv,
    setActiveConv,
    guestMessages,
    setGuestMessages,
    authHeaders,
    fetchConversations,
    createConversation,
    deleteConversation,
  }
}