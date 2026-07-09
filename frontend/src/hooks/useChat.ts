import { useState, useCallback } from 'react'
import { sendChatMessageApi, sendGuestChatApi, rephraseApi } from '../lib/api'
import { getChatMode } from '../lib/storage'
import type { Message } from '../types'

export function useChat(
  token: string | null,
  isGuest: boolean,
) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [isFreshConsult, setIsFreshConsult] = useState(false)
  const [pendingFile, setPendingFile] = useState<{ name: string; data: string } | null>(null)

  const sendMessage = useCallback(async (
    text: string,
    targetConv: string | null,
    createAndGetConvId: () => Promise<string | null>,
    onTitleChange: (id: string, title: string) => void,
  ) => {
    let convId = targetConv
    const title = text.length > 50 ? text.slice(0, 50) + '...' : text
    const now = new Date().toISOString()
    const chatMode = getChatMode()

    if (!convId) {
      convId = await createAndGetConvId()
      if (!convId) return
    }

    setIsFreshConsult(false)

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      created_at: now,
    }
    setMessages(prev => [...prev, userMsg])
    onTitleChange(convId, title)

    const body: Record<string, unknown> = { content: text, mode: chatMode }
    if (pendingFile) {
      body.file = { name: pendingFile.name, data: pendingFile.data }
      setPendingFile(null)
    }

    if (isGuest && convId) {
      setIsTyping(true)
      try {
        const data = await sendGuestChatApi(body)
        if (data) {
          const chatMode = getChatMode()
          const contentField = `content_${chatMode}` as keyof Message
          const aiMsg: Message = {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            content: data.content,
            [contentField]: data.content,
            created_at: new Date().toISOString(),
          } as Message
          setMessages(prev => [...prev, aiMsg])
        }
      } catch (err) {
        console.error('Guest chat failed:', err)
      } finally {
        setIsTyping(false)
      }
      return
    }

    if (!token) return

    setIsTyping(true)
    try {
      const aiMsg = await sendChatMessageApi(token, convId, { ...body, role: 'user' })
      if (aiMsg) {
        setMessages(prev => [...prev, aiMsg])
      }
    } catch (err) {
      console.error('Failed to send message:', err)
    } finally {
      setIsTyping(false)
    }
  }, [token, isGuest, pendingFile])

  const rephraseMessage = useCallback(async (convId: string, msgId: string, level: string) => {
    const contentField = `content_${level}` as keyof Message

    const cached = messages.find(m => m.id === msgId)?.[contentField]
    if (cached && typeof cached === 'string') {
      setMessages(prev => prev.map(m =>
        m.id === msgId
          ? { ...m, content: cached, rephraseVersion: (m.rephraseVersion || 0) + 1 }
          : m
      ))
      return
    }

    if (isGuest) {
      const aiIndex = messages.findIndex(m => m.id === msgId)
      const userMsg = aiIndex > 0 ? messages[aiIndex - 1] : null
      try {
        const data = await sendGuestChatApi({
          content: userMsg?.content || messages.find(m => m.id === msgId)?.content || '',
          mode: level,
        })
        if (data) {
          setMessages(prev => prev.map(m => {
            if (m.id === msgId) {
              const version = (m.rephraseVersion || 0) + 1
              return { ...m, content: data.content, [contentField]: data.content, rephraseVersion: version }
            }
            return m
          }))
        }
      } catch (err) {
        console.error('Guest rephrase failed:', err)
      }
      return
    }
    if (!token || !convId) return
    try {
      const updated = await rephraseApi(token, convId, msgId, level)
      if (updated) {
        setMessages(prev => prev.map(m => {
          if (m.id === msgId) {
            const version = (m.rephraseVersion || 0) + 1
            return { ...updated, rephraseVersion: version }
          }
          return m
        }))
      }
    } catch (err) {
      console.error('Rephrase failed:', err)
    }
  }, [token, isGuest, messages])

  return {
    messages,
    setMessages,
    isTyping,
    setIsTyping,
    isFreshConsult,
    setIsFreshConsult,
    pendingFile,
    setPendingFile,
    sendMessage,
    rephraseMessage,
  }
}