import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { useMediaQuery } from './hooks/useMediaQuery'
import Sidebar from './features/sidebar/Sidebar'
import TopHeader from './layouts/TopHeader'
import UserMessage from './features/chat/UserMessage'
import AIResponse from './features/chat/AIResponse'
import InputArea from './features/chat/InputArea'
import FreshBanner from './features/chat/FreshBanner'
import ConfirmModal from './layouts/ConfirmModal'
import SettingsPanel from './features/settings/SettingsPanel'
import LandingPage from './features/auth/LandingPage'
import TypingIndicator from './features/chat/TypingIndicator'
import GuestExpiryBanner from './features/sidebar/GuestExpiryBanner'
import { getChatMode, applyFontSize } from './lib/storage'
import type { Message } from './types'

function ChatArea({ messages, onRephrase, isTyping }: { messages: Message[]; onRephrase?: (msgId: string, level: string) => void; isTyping?: boolean }) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages.length, scrollToBottom])

  useEffect(() => {
    const el = innerRef.current
    if (!el) return
    const observer = new ResizeObserver(() => {
      scrollToBottom()
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [scrollToBottom])

  const handleEdit = (id: string, newContent: string) => {
    console.log('Edit message:', id, newContent)
  }
  const handleDelete = (id: string) => {
    console.log('Delete message:', id)
  }

  return (
    <div ref={containerRef} style={{
      flex: 1,
      overflowY: 'auto',
      padding: 'var(--chat-padding)',
      maxWidth: '100%',
      margin: '0 auto',
      width: '100%',
    }}>
      <div ref={innerRef} style={{ maxWidth: 'var(--chat-max-width)', margin: '0 auto' }}>
        {messages.map(msg => {
          if (msg.role === 'user') return <UserMessage key={msg.id} message={msg} onEdit={handleEdit} onDelete={handleDelete} />
          if (msg.role === 'assistant') return <AIResponse key={`${msg.id}-${msg.rephraseVersion || 0}`} message={msg} onRephrase={onRephrase} />
          return null
        })}
        {isTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}


const FEATURE_CARDS = [
  { title: 'Symptom Checker', desc: 'Describe your symptoms and get a clear, structured analysis of possible causes and recommendations.' },
  { title: 'Image Analysis', desc: 'Upload X-rays, CT scans, or lab results for instant AI-powered visual interpretation.' },
  { title: 'Health Records', desc: 'Review and understand medical documents, reports, and clinical data in plain language.' },
]

interface WelcomeScreenProps {
  conversations: { id: string; title: string }[]
  onNewConsultation: () => void
  onSelectConv: (id: string) => void
}

function WelcomeScreen({ conversations, onNewConsultation, onSelectConv }: WelcomeScreenProps) {
  const { isGuest, user } = useAuth()
  const isMobile = useMediaQuery('(max-width: 639px)')
  const recent = conversations.slice(0, 3)

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      padding: isMobile ? '24px 20px' : '40px 32px',
    }}>
      <div style={{
        maxWidth: 700,
        margin: '0 auto',
        textAlign: 'center',
      }}>
<img
          src="/logo.svg"
          alt="Xasread"
          style={{
            width: isMobile ? 56 : 72,
            height: isMobile ? 56 : 72,
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 8px 32px rgba(212, 120, 47, 0.2)',
          }}
        />
        <h1 style={{
          fontSize: isMobile ? 22 : 28,
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: 8,
        }}>
          {isGuest ? 'Welcome to Xasread' : `Welcome back${user?.name ? `, ${user.name}` : ''}`}
        </h1>

        <p style={{
          fontSize: isMobile ? 14 : 15,
          color: 'var(--text-muted)',
          lineHeight: 1.7,
          maxWidth: 480,
          margin: '0 auto 32px',
        }}>
          {isGuest
            ? 'AI-powered medical consultation. Describe your symptoms, upload medical images or lab results, and get instant analysis.'
            : 'AI-powered medical assistant for symptoms, medical images, and lab results. Start a new consultation or pick up where you left off.'}
        </p>

        {recent.length > 0 && (
          <div style={{ marginBottom: 24, textAlign: 'left' }}>
            <h2 style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-muted)',
              marginBottom: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              Recent Consultations
            </h2>
            {recent.map(c => (
              <button
                key={c.id}
                onClick={() => onSelectConv(c.id)}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  marginBottom: 6,
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'var(--primary-light)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'var(--bg-card)' }}
              >
                {c.title}
              </button>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 40 }}>
          <button
            onClick={onNewConsultation}
            style={{
              padding: '14px 36px',
              borderRadius: 'var(--radius-pill)',
              border: 'none',
              background: 'linear-gradient(135deg, #D4782F 0%, #E8954F 100%)',
              color: '#fff',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(212, 120, 47, 0.25)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 24px rgba(212, 120, 47, 0.35)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(212, 120, 47, 0.25)'; e.currentTarget.style.transform = 'none' }}
          >
            Start a Consultation
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: 12,
          textAlign: 'left',
        }}>
          {FEATURE_CARDS.map(f => (
            <div key={f.title} style={{
              padding: '20px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
            }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AuthCallbackHandler({ onSignedIn }: { onSignedIn: () => void }) {
  const { signIn } = useAuth()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (token) {
      signIn(token)
      window.history.replaceState({}, '', '/')
      onSignedIn()
    }
  }, [signIn, onSignedIn])

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 14,
      color: 'var(--text-muted)',
    }}>
      Signing you in...
    </div>
  )
}

interface ConversationListItem {
  id: string
  title: string
  created_at: string | null
  updated_at: string | null
  message_count: number
}

function AuthenticatedApp() {
  const { user, token, isGuest, guestUsername, guestToken, signOut } = useAuth()
  const [conversations, setConversations] = useState<ConversationListItem[]>([])
  const [activeConv, setActiveConv] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [pendingFile, setPendingFile] = useState<{ name: string; data: string } | null>(null)
  const [guestMessages, setGuestMessages] = useState<Record<string, Message[]>>({})
  const [isFreshConsult, setIsFreshConsult] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [lastConvTitle, setLastConvTitle] = useState<string | null>(null)
  const randomSuffix = useMemo(() => String(Math.floor(Math.random() * 9000) + 1000), [])
  const sessionId = useMemo(() => `SID-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randomSuffix}`, [randomSuffix])
  const shortId = useMemo(() => `SID-${randomSuffix}`, [randomSuffix])
  const [guestExpiresAt, setGuestExpiresAt] = useState<string | null>(null)
  const guestStorageKey = useMemo(() =>
    'xasread-guest-data-' + (guestUsername || 'default') + '-' + (guestToken || 'anon'),
    [guestUsername, guestToken]
  )
  const fileInputRef = useRef<HTMLInputElement>(null)
  const toggleSidebar = useCallback(() => setSidebarOpen(o => !o), [])

  const persistActiveConv = useCallback((id: string | null) => {
    setActiveConv(id)
    if (id) localStorage.setItem('xasread-active-conv', id)
    else localStorage.removeItem('xasread-active-conv')
  }, [])

  useEffect(() => {
    if (!isGuest) {
      setGuestExpiresAt(null)
      return
    }
    try {
      const stored = localStorage.getItem(guestStorageKey)
      if (stored) {
        const data = JSON.parse(stored)
        const savedAt = new Date(data.savedAt).getTime()
        const expiresAt = savedAt + 24 * 60 * 60 * 1000
        if (Date.now() < expiresAt) {
          setConversations(data.conversations || [])
          setGuestMessages(data.messages || {})
          setGuestExpiresAt(new Date(expiresAt).toISOString())
          if (data.activeConv && data.conversations?.some((c: { id: string }) => c.id === data.activeConv)) {
            setActiveConv(data.activeConv)
          }
          return
        }
        localStorage.removeItem(guestStorageKey)
      }
      setGuestExpiresAt(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString())
    } catch {
      setGuestExpiresAt(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString())
    }
  }, [isGuest, guestStorageKey])

  useEffect(() => {
    if (!isGuest) {
      localStorage.removeItem(guestStorageKey)
      return
    }
    if (conversations.length === 0 && Object.keys(guestMessages).length === 0) {
      return
    }
    const payload = {
      conversations,
      messages: guestMessages,
      activeConv,
      savedAt: new Date().toISOString(),
    }
    localStorage.setItem(guestStorageKey, JSON.stringify(payload))
  }, [isGuest, guestStorageKey, conversations, guestMessages, activeConv])

  const authHeaders = useMemo(() => token ? { Authorization: `Bearer ${token}` } as Record<string, string> : {} as Record<string, string>, [token])

  const fetchConversations = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch('/conversations', { headers: authHeaders })
      if (res.ok) {
        const data = await res.json()
        setConversations(data)
        const saved = localStorage.getItem('xasread-active-conv')
        if (saved && data.some((c: ConversationListItem) => c.id === saved)) {
          setActiveConv(saved)
        }
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err)
    }
  }, [token, authHeaders])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  useEffect(() => {
    if (!activeConv) {
      setMessages([])
      return
    }
    if (isGuest) {
      setMessages(guestMessages[activeConv] || [])
      return
    }
    if (!token) return

    setIsLoadingMessages(true)
    fetch(`/conversations/${activeConv}/messages`, { headers: authHeaders })
      .then(res => res.ok ? res.json() : [])
      .then(data => setMessages(data))
      .catch(() => setMessages([]))
      .finally(() => setIsLoadingMessages(false))
  }, [activeConv, token, authHeaders, isGuest, guestMessages])

  const handleNewConsultation = useCallback(async () => {
    const prevTitle = conversations.length > 0 ? conversations[0].title : null
    setLastConvTitle(prevTitle)
    setIsFreshConsult(true)
    if (isGuest) {
      const id = crypto.randomUUID()
      const now = new Date().toISOString()
      setConversations(prev => [{ id, title: 'New Consultation', created_at: now, updated_at: now, message_count: 0 }, ...prev])
      persistActiveConv(id)
      setMessages([])
      return
    }
    if (!token) return
    try {
      const res = await fetch('/conversations', {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Consultation' }),
      })
      if (res.ok) {
        const conv = await res.json()
        setConversations(prev => [{ ...conv, message_count: 0 }, ...prev])
        persistActiveConv(conv.id)
      }
    } catch (err) {
      console.error('Failed to create conversation:', err)
    }
  }, [isGuest, token, authHeaders, persistActiveConv])


  const handleDeleteConv = (id: string) => {
    setDeleteTarget(id)
  }

  const confirmDelete = async () => {
    const id = deleteTarget
    if (!id) return
    setDeleteTarget(null)
    if (isGuest) {
      if (guestMessages[id]) {
        const { [id]: _, ...rest } = guestMessages
        setGuestMessages(rest)
      }
      setConversations(prev => prev.filter(c => c.id !== id))
      if (activeConv === id) {
        persistActiveConv(null)
        setMessages([])
      }
      return
    }
    if (!token) return
    try {
      const res = await fetch(`/conversations/${id}`, {
        method: 'DELETE',
        headers: authHeaders,
      })
      if (res.ok) {
        setConversations(prev => prev.filter(c => c.id !== id))
        if (activeConv === id) {
          persistActiveConv(null)
          setMessages([])
        }
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err)
    }
  }

  const handleSend = useCallback(async (text: string, _fileName?: string) => {
    let targetConv = activeConv
    const title = text.length > 50 ? text.slice(0, 50) + '...' : text
    const now = new Date().toISOString()
    const chatMode = getChatMode()

    if (!targetConv) {
      if (isGuest) {
        const id = crypto.randomUUID()
        setConversations(prev => [{ id, title, created_at: now, updated_at: now, message_count: 0 }, ...prev])
        persistActiveConv(id)
        targetConv = id
      } else if (token) {
        const res = await fetch('/conversations', {
          method: 'POST',
          headers: { ...authHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ title }),
        })
        if (res.ok) {
          const conv = await res.json()
          setConversations(prev => [{ ...conv, message_count: 0 }, ...prev])
          persistActiveConv(conv.id)
          targetConv = conv.id
        } else {
          return
        }
      } else {
        return
      }
    }

    setIsFreshConsult(false)

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      created_at: now,
    }
    setMessages(prev => [...prev, userMsg])

    if (targetConv) {
      const updated = conversations.find(c => c.id === targetConv)
      if (updated?.title === 'New Consultation') {
        setConversations(prev => prev.map(c => c.id === targetConv ? { ...c, title } : c))
        if (!isGuest && token) {
          fetch(`/conversations/${targetConv}`, {
            method: 'PATCH',
            headers: { ...authHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ title }),
          }).catch(() => {})
        }
      }
    }

    const body: Record<string, unknown> = { content: text, mode: chatMode }
    if (pendingFile) {
      body.file = { name: pendingFile.name, data: pendingFile.data }
      setPendingFile(null)
    }

    if (isGuest && targetConv) {
      setGuestMessages(prev => ({
        ...prev,
        [targetConv!]: [...(prev[targetConv!] || []), userMsg],
      }))
      setIsTyping(true)
      try {
        const res = await fetch('/conversations/guest-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (res.ok) {
          const data = await res.json()
          const aiMsg: Message = { id: `ai-${Date.now()}`, role: 'assistant', content: data.content, created_at: new Date().toISOString(), image: data.image || undefined }
          setMessages(prev => [...prev, aiMsg])
          setGuestMessages(prev => ({
            ...prev,
            [targetConv!]: [...(prev[targetConv!] || []), aiMsg],
          }))
        }
      } catch {
        // silently fail
      } finally {
        setIsTyping(false)
      }
      return
    }

    body.role = 'user'
    body.content = text

    setIsTyping(true)
    try {
      const chatRes = await fetch(`/conversations/${targetConv}/chat`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (chatRes.ok) {
        const aiMsg = await chatRes.json()
        setMessages(prev => [...prev, aiMsg])
      } else {
        setMessages(prev => prev.map(m => m.id === userMsg.id ? { ...userMsg } : m))
      }
    } catch (err) {
      console.error('Failed to send message:', err)
      setMessages(prev => prev.map(m => m.id === userMsg.id ? { ...userMsg } : m))
    } finally {
      setIsTyping(false)
    }
  }, [activeConv, isGuest, token, authHeaders, conversations, pendingFile, persistActiveConv])


  const handleFilePick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setPendingFile({ name: file.name, data: reader.result as string })
    }
    if (file.type.startsWith('image/') || file.type === 'application/pdf') {
      reader.readAsDataURL(file)
    } else {
      reader.readAsText(file)
    }
    e.target.value = ''
  }

  const handleRephrase = useCallback(async (msgId: string, level: string) => {
    if (!activeConv) return
    if (isGuest) {
      try {
        const res = await fetch('/conversations/guest-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: `Rephrase at ${level} level: ${messages.find(m => m.id === msgId)?.content || ''}`, mode: level }),
        })
        if (res.ok) {
          const data = await res.json()
          setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: data.content } : m))
          if (guestMessages[activeConv]) {
            setGuestMessages(prev => ({
              ...prev,
              [activeConv!]: prev[activeConv!].map(m => m.id === msgId ? { ...m, content: data.content } : m),
            }))
          }
        }
      } catch { /* ignore */ }
      return
    }
    if (!token) return
    try {
      const res = await fetch(`/conversations/${activeConv}/rephrase`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message_id: msgId, level }),
      })
      if (res.ok) {
        const updated = await res.json()
        setMessages(prev => prev.map(m => m.id === msgId ? updated : m))
      }
    } catch { /* ignore */ }
  }, [activeConv, isGuest, token, authHeaders, messages, guestMessages])


  const handleEndSession = () => {
    signOut()
  }

  const handleSwitchAccount = useCallback(() => {
    signOut()
    if (!isGuest) {
      window.location.href = '/auth/google'
    }
  }, [signOut, isGuest])

  return (
    <div style={{ display: 'flex', height: 'var(--full-height, 100vh)', overflow: 'hidden' }}>
        <Sidebar
          conversations={conversations.map(c => ({
            id: c.id,
            title: c.title,
            timestamp: c.updated_at || '',
            messages: [],
          }))}
          activeConv={activeConv}
          onSelectConv={persistActiveConv}
          onNewConsultation={handleNewConsultation}
          onDeleteConv={handleDeleteConv}
          onSignOut={signOut}
          onSwitchAccount={handleSwitchAccount}
          userName={user?.name || guestUsername || undefined}
          avatarUrl={user?.avatar_url}
          isOpen={sidebarOpen}
          onToggle={toggleSidebar}
          guestExpiresAt={guestExpiresAt}
          onOpenSettings={() => setShowSettings(true)}
        />

      <div style={{
        flex: 1,
        marginLeft: 'var(--content-ml)',
        display: 'flex',
        flexDirection: 'column',
        height: 'var(--full-height, 100vh)',
        background: 'var(--bg-main)',
        position: 'relative',
      }}>
        <TopHeader onEndSession={handleEndSession} onToggleSidebar={toggleSidebar} sessionId={sessionId} />

        {guestExpiresAt && (
          <div className="header-mobile-only" style={{ flexShrink: 0, width: '100%' }}>
            <GuestExpiryBanner expiresAt={guestExpiresAt} />
          </div>
        )}

        {isLoadingMessages ? (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            color: 'var(--text-muted)',
          }}>
            Loading messages...
          </div>
        ) : messages.length > 0 || isFreshConsult ? (
          <>
            {isFreshConsult && messages.length === 0 && (
              <FreshBanner lastConvTitle={lastConvTitle} onSend={handleSend} />
            )}
            <ChatArea messages={messages} onRephrase={handleRephrase} isTyping={isTyping} />
          </>
        ) : (
          <WelcomeScreen conversations={conversations} onNewConsultation={handleNewConsultation} onSelectConv={persistActiveConv} />
        )}

        {(activeConv || isFreshConsult) && <InputArea onSend={handleSend} onFilePick={handleFilePick} pendingFile={pendingFile} sessionId={shortId} />}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx,.txt,.csv"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {deleteTarget && (
          <ConfirmModal
            title="Delete Consultation"
            message="This consultation and all its messages will be permanently deleted. This cannot be undone."
            confirmLabel="Delete"
            cancelLabel="Cancel"
            danger
            onConfirm={confirmDelete}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
        {showSettings && (
          <SettingsPanel onClose={() => setShowSettings(false)} onSignOut={signOut} />
        )}
      </div>
    </div>
  )
}

function AppContent() {
  const { isAuthenticated, isLoading, continueAsGuest } = useAuth()
  const [showApp, setShowApp] = useState(() => {
    if (window.location.pathname === '/auth/callback') return true
    const mode = sessionStorage.getItem('xasread-auth-mode')
    if (mode === 'google' || mode === 'guest') return true
    return !!localStorage.getItem('xasread-token')
  })

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        background: 'var(--bg-main)',
      }}>
        <img
          src="/logo.svg"
          alt="Xasread"
          style={{
            width: 56,
            height: 56,
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 8px 32px rgba(212, 120, 47, 0.2)',
            animation: 'pulse-ring 2s ease-out infinite',
          }}
        />
        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
          Loading Xasread...
        </span>
      </div>
    )
  }

  if (window.location.pathname === '/auth/callback') {
    return <AuthCallbackHandler onSignedIn={() => setShowApp(true)} />
  }

  if (!showApp || !isAuthenticated) {
    return <LandingPage onContinueAsGuest={continueAsGuest} onEnterApp={() => setShowApp(true)} />
  }

  return <AuthenticatedApp />
}

export default function App() {
  useEffect(() => {
    applyFontSize()
  }, [])

  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
