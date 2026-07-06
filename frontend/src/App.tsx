import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { useMediaQuery } from './hooks/useMediaQuery'
import Sidebar from './components/Sidebar'
import TopHeader from './components/TopHeader'
import UserMessage from './components/UserMessage'
import AIResponse from './components/AIResponse'
import InputArea from './components/InputArea'
import FreshBanner from './components/FreshBanner'
import ConfirmModal from './components/ConfirmModal'
import LandingPage from './components/LandingPage'
import TypingIndicator from './components/TypingIndicator'
import type { Message } from './types'

function ChatArea({ messages, onRephrase, isTyping }: { messages: Message[]; onRephrase?: (msgId: string, level: string) => void; isTyping?: boolean }) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const isMobile = useMediaQuery('(max-width: 639px)')

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, isTyping])

  const handleEdit = (id: string, newContent: string) => {
    console.log('Edit message:', id, newContent)
  }
  const handleDelete = (id: string) => {
    console.log('Delete message:', id)
  }

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      padding: isMobile ? '12px 12px' : '24px 32px',
      maxWidth: '100%',
      margin: '0 auto',
      width: '100%',
    }}>
      <div style={{ maxWidth: isMobile ? '100%' : 720, margin: '0 auto' }}>
        {messages.map(msg => {
          if (msg.role === 'user') return <UserMessage key={msg.id} message={msg} onEdit={handleEdit} onDelete={handleDelete} />
          if (msg.role === 'assistant') return <AIResponse key={msg.id} message={msg} onRephrase={onRephrase} />
          return null
        })}
        {isTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}

interface WelcomeScreenProps {
  conversations: { id: string; title: string }[]
  onNewConsultation: () => void
  onSelectConv: (id: string) => void
  onSend: (text: string) => void
}

const welcomeSymptomOptions = ["Describe Symptoms", "How are you feeling?", "Tell me what's wrong", "Start a health conversation"]
const welcomeUploadOptions = ["Upload Results", "Share a lab report", "Upload a document", "Add a file"]
const welcomeHistoryOptions = ["View History", "Health library", "How Xasread works", "Quick health check"]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function WelcomeScreen({ conversations, onNewConsultation, onSelectConv, onSend }: WelcomeScreenProps) {
  const { isGuest, user } = useAuth()
  const isMobile = useMediaQuery('(max-width: 639px)')
  const recent = conversations.slice(0, 3)
  const [symptomLabel] = useState(() => pick(welcomeSymptomOptions))
  const [uploadLabel] = useState(() => pick(welcomeUploadOptions))
  const [historyLabel] = useState(() => pick(welcomeHistoryOptions))

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '0 16px' : '0 32px',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        width: isMobile ? 180 : 320,
        height: isMobile ? 180 : 320,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(212,120,47,0.08) 0%, transparent 70%)',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -60%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        width: isMobile ? 48 : 64, height: isMobile ? 48 : 64,
        borderRadius: 'var(--radius-lg)',
        background: 'linear-gradient(135deg, #D4782F 0%, #E8954F 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: 28,
        fontWeight: 700,
        marginBottom: 20,
        position: 'relative',
        boxShadow: '0 8px 32px rgba(212, 120, 47, 0.2)',
      }}>
        X
      </div>
      <h1 style={{
        fontSize: isMobile ? 20 : 24, fontWeight: 700,
        color: 'var(--text-primary)',
        marginBottom: 8,
      }}>
        {isGuest ? 'Welcome to Xasread' : `Welcome back, ${user?.name || 'Doctor'}`}
      </h1>
      <p style={{
        fontSize: isMobile ? 13 : 14, color: 'var(--text-muted)',
        maxWidth: isMobile ? 300 : 400, lineHeight: 1.6,
      }}>
        {isGuest
          ? "You're browsing as a guest. Sign in with Google to save your consultations and access them anytime."
          : recent.length > 0
            ? 'Pick up where you left off or start a new consultation.'
            : 'AI-powered medical consultation. Describe your symptoms, upload medical images or lab results, and get instant analysis.'}
      </p>

      {recent.length > 0 && (
        <div style={{ marginTop: 20, width: '100%', maxWidth: 360 }}>
          {recent.map(c => (
            <button
              key={c.id}
              onClick={() => onSelectConv(c.id)}
              style={{
                display: 'block',
                width: '100%',
                padding: '10px 16px',
                marginBottom: 6,
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {c.title}
            </button>
          ))}
        </div>
      )}

      <style>{`
        .welcome-btn { transition: all 0.2s !important; }
        .welcome-btn:hover { background: var(--primary-light) !important; border-color: var(--primary) !important; color: var(--primary) !important; box-shadow: 0 4px 12px rgba(212, 120, 47, 0.15) !important; transform: translateY(-1px) !important; }
      `}</style>
      <div style={{
        display: 'flex', gap: 8, marginTop: 20,
        flexWrap: 'wrap', justifyContent: 'center',
      }}>
        {recent.length > 0 ? (
          <button className="welcome-btn" onClick={onNewConsultation} style={{
            padding: '8px 22px',
            borderRadius: 'var(--radius-pill)',
            border: 'none',
            background: 'var(--primary)',
            color: '#fff',
            fontSize: 13, fontWeight: 700,
            cursor: 'pointer',
          }}>
            New Consultation
          </button>
        ) : (
          [symptomLabel, uploadLabel, historyLabel].map(label => (
            <button key={label} className="welcome-btn" onClick={() => onSend(label)} style={{
              padding: isMobile ? '6px 14px' : '8px 18px',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              fontSize: isMobile ? 12 : 13, fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}>
              {label}
            </button>
          ))
        )}
      </div>
    </div>
  )
}

function AuthCallbackHandler() {
  const { signIn } = useAuth()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (token) {
      signIn(token)
      window.history.replaceState({}, '', '/')
    }
  }, [signIn])

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
  const { user, token, isGuest, signOut } = useAuth()
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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isMobile = useMediaQuery('(max-width: 639px)')
  const toggleSidebar = useCallback(() => setSidebarOpen(o => !o), [])

  const authHeaders = useMemo(() => token ? { Authorization: `Bearer ${token}` } as Record<string, string> : {} as Record<string, string>, [token])

  const fetchConversations = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch('/conversations', { headers: authHeaders })
      if (res.ok) {
        const data = await res.json()
        setConversations(data)
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

  const handleNewConsultation = async () => {
    const prevTitle = conversations.length > 0 ? conversations[0].title : null
    setLastConvTitle(prevTitle)
    setIsFreshConsult(true)
    if (isGuest) {
      const id = crypto.randomUUID()
      const now = new Date().toISOString()
      setConversations(prev => [{ id, title: 'New Consultation', created_at: now, updated_at: now, message_count: 0 }, ...prev])
      setActiveConv(id)
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
        setActiveConv(conv.id)
      }
    } catch (err) {
      console.error('Failed to create conversation:', err)
    }
  }

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
        setActiveConv(null)
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
          setActiveConv(null)
          setMessages([])
        }
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err)
    }
  }

  const getChatMode = (): string => {
    try {
      const s = localStorage.getItem('xasread-settings')
      if (s) return JSON.parse(s).chatMode || 'standard'
    } catch { /* ignore */ }
    return 'standard'
  }

  const handleSend = async (text: string, _fileName?: string) => {
    let targetConv = activeConv
    const title = text.length > 50 ? text.slice(0, 50) + '...' : text
    const now = new Date().toISOString()
    const chatMode = getChatMode()

    if (!targetConv) {
      if (isGuest) {
        const id = crypto.randomUUID()
        setConversations(prev => [{ id, title, created_at: now, updated_at: now, message_count: 0 }, ...prev])
        setActiveConv(id)
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
          setActiveConv(conv.id)
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
      setConversations(prev => prev.map(c => c.id === targetConv && c.title === 'New Consultation' ? { ...c, title } : c))
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
          const aiMsg: Message = { id: `ai-${Date.now()}`, role: 'assistant', content: data.content, created_at: new Date().toISOString() }
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
  }

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

  const handleRephrase = async (msgId: string, level: string) => {
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
  }

  const handleEndSession = () => {
    signOut()
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        conversations={conversations.map(c => ({
          id: c.id,
          title: c.title,
          timestamp: c.updated_at || '',
          messages: [],
        }))}
        activeConv={activeConv}
        onSelectConv={setActiveConv}
        onNewConsultation={handleNewConsultation}
        onDeleteConv={handleDeleteConv}
        onSignOut={signOut}
        userName={user?.name}
        avatarUrl={user?.avatar_url}
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
      />

      <div style={{
        flex: 1,
        marginLeft: isMobile ? 0 : 'var(--sidebar-width)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: 'var(--bg-main)',
        position: 'relative',
      }}>
        <TopHeader onEndSession={handleEndSession} onToggleSidebar={toggleSidebar} />

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
          <WelcomeScreen conversations={conversations} onNewConsultation={handleNewConsultation} onSelectConv={setActiveConv} onSend={handleSend} />
        )}

        <InputArea onSend={handleSend} onFilePick={handleFilePick} pendingFile={pendingFile?.name ?? null} />
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
      </div>
    </div>
  )
}

function AppContent() {
  const { isAuthenticated, isLoading, continueAsGuest } = useAuth()

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-main)',
        fontSize: 14,
        color: 'var(--text-muted)',
      }}>
        Loading...
      </div>
    )
  }

  if (window.location.pathname === '/auth/callback') {
    return <AuthCallbackHandler />
  }

  if (!isAuthenticated) {
    return <LandingPage onContinueAsGuest={continueAsGuest} />
  }

  return <AuthenticatedApp />
}

export default function App() {
  useEffect(() => {
    try {
      const s = localStorage.getItem('xasread-settings')
      if (s) {
        const { fontSize } = JSON.parse(s)
        const map: Record<string, number> = { small: 13, medium: 14, large: 16 }
        document.documentElement.style.setProperty('--chat-font-size', `${map[fontSize] || 14}px`)
      }
    } catch { /* ignore parse errors */ }
  }, [])

  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  )
}