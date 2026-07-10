import { useState, useEffect, useRef, useCallback, memo } from 'react'
import { Copy, Check, Loader } from 'lucide-react'
import DOMPurify from 'dompurify'
import MedicalImageViewer from '../consultation/MedicalImageViewer'
import AnalysisPanel from '../consultation/AnalysisPanel'
import type { Message } from '../../types'
import { renderMarkdown } from '../../lib/markdown'

interface AIResponseProps {
  message: Message
  onRephrase?: (msgId: string, level: string) => void
}

function formatTimestamp(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  const todayPh = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Manila' })
  const datePh = d.toLocaleDateString('en-US', { timeZone: 'Asia/Manila' })
  if (datePh === todayPh) {
    return d.toLocaleTimeString('en-US', { timeZone: 'Asia/Manila', hour12: true, hour: 'numeric', minute: '2-digit' })
  }
  const datePart = d.toLocaleDateString('en-US', { timeZone: 'Asia/Manila', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const timePart = d.toLocaleTimeString('en-US', { timeZone: 'Asia/Manila', hour12: true, hour: 'numeric', minute: '2-digit' })
  return `${datePart} at ${timePart}`
}

const s = {
  wrapper: {
    display: 'flex',
    marginBottom: 24,
  } as const,
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 'var(--radius-sm)',
    flexShrink: 0,
    marginRight: 12,
    marginTop: 2,
  } as const,
  content: {
    flex: 1,
    maxWidth: 'calc(100% - 44px)',
  } as const,
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  } as const,
  name: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-primary)',
  } as const,
  badge: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    padding: '2px 6px',
    borderRadius: '4px',
    background: 'var(--primary-light)',
    color: 'var(--primary)',
    fontWeight: 500,
  } as const,
  timestamp: {
    fontSize: 11,
    color: 'var(--text-muted)',
  } as const,
  message: {
    fontSize: 'var(--chat-font-size, 14px)',
    lineHeight: 1.9,
    color: 'var(--text-secondary)',
    marginBottom: 16,
    textAlign: 'justify',
  } as const,
}

function getAnimatedIds(): string[] {
  try {
    const stored = sessionStorage.getItem('xasread-animated')
    return stored ? JSON.parse(stored) : []
  } catch { return [] }
}
function addAnimatedId(id: string) {
  try {
    const ids = getAnimatedIds()
    if (!ids.includes(id)) {
      ids.push(id)
      sessionStorage.setItem('xasread-animated', JSON.stringify(ids))
    }
  } catch { /* ignore */ }
}
function removeAnimatedId(id: string) {
  try {
    const ids = getAnimatedIds().filter((i: string) => i !== id)
    sessionStorage.setItem('xasread-animated', JSON.stringify(ids))
  } catch { /* ignore */ }
}

function AIResponse({ message, onRephrase }: AIResponseProps) {
  const [chatMode, setChatMode] = useState(() => {
    try {
      const s = localStorage.getItem('xasread-settings')
      if (s) return JSON.parse(s).chatMode || 'standard'
    } catch {}
    return 'standard'
  })
  const [typedLen, setTypedLen] = useState(() => getAnimatedIds().includes(message.id) ? (message.content || '').length : 0)
  const timerRef = useRef<number | null>(null)
  const fullText = message.content || ''

  useEffect(() => {
    if (getAnimatedIds().includes(message.id) || typedLen === fullText.length) {
      setTypedLen(fullText.length)
      return
    }
    setTypedLen(0)
    if (!fullText) return
    const speed = 100
    const startTime = performance.now()
    let active = true

    const animate = (now: number) => {
      if (!active) return
      const elapsed = now - startTime
      const next = Math.min(Math.round((elapsed * speed) / 1000), fullText.length)
      setTypedLen(next)
      if (next < fullText.length) {
        timerRef.current = requestAnimationFrame(animate)
      } else {
        addAnimatedId(message.id)
      }
    }

    timerRef.current = requestAnimationFrame(animate)
    return () => {
      active = false
      if (timerRef.current) cancelAnimationFrame(timerRef.current)
    }
  }, [message.id, fullText])

  useEffect(() => {
    const handler = () => {
      try {
        const s = localStorage.getItem('xasread-settings')
        if (s) setChatMode(JSON.parse(s).chatMode || 'standard')
      } catch {}
    }
    window.addEventListener('xasread-settings-changed', handler)
    return () => window.removeEventListener('xasread-settings-changed', handler)
  }, [])

  const isTyping = typedLen < fullText.length
  const visibleHtml = renderMarkdown(fullText.slice(0, typedLen))
  const [copied, setCopied] = useState(false)
  const [showLevels, setShowLevels] = useState(false)
  const [isRephrasing, setIsRephrasing] = useState(false)
  const [activeFindingId, setActiveFindingId] = useState<string | null>(null)
  const levelRef = useRef<HTMLDivElement>(null)

  const levelLabels: Record<string, string> = { plain: 'Plain', standard: 'Standard', clinical: 'Clinical' }
  const currentLevel = levelLabels[chatMode] || chatMode
  const levelColors: Record<string, string> = { plain: 'var(--text-muted)', standard: 'var(--primary)', clinical: '#D4782F' }
  const levelDots: Record<string, string> = { plain: '○○○', standard: '●○○', clinical: '●●●' }
  const levelBadgeStyle = (lvl: string) => ({
    ...s.badge,
    background: 'var(--bg-main)',
    cursor: 'pointer' as const,
    userSelect: 'none' as const,
    color: levelColors[lvl] || 'var(--primary)',
    border: `1px solid ${levelColors[lvl] || 'var(--primary)'}`,
  })

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (levelRef.current && !levelRef.current.contains(e.target as Node)) setShowLevels(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCopy = () => {
    navigator.clipboard.writeText(fullText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  const handleLevelChange = useCallback(async (level: string) => {
    setShowLevels(false)
    setIsRephrasing(true)
    removeAnimatedId(message.id)
    setTypedLen(0)
    try {
      const s = localStorage.getItem('xasread-settings')
      const settings = s ? JSON.parse(s) : {}
      settings.chatMode = level
      localStorage.setItem('xasread-settings', JSON.stringify(settings))
      setChatMode(level)
      if (onRephrase) {
        onRephrase(message.id, level)
      }
    } catch { /* ignore */ }
    setIsRephrasing(false)
  }, [message.id, onRephrase])

  return (
    <div className="msg-enter" style={s.wrapper}>
      <div style={s.avatar}>
        <img src="/logo.svg" alt="Xasread AI" style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)' }} />
      </div>
      <div style={s.content}>
        <div style={s.header}>
          <span style={s.name}>Xasread AI</span>
          <span style={s.badge}>v3.0</span>
          <div ref={levelRef} style={{ position: 'relative' }}>
            <span
              style={levelBadgeStyle(chatMode)}
              onClick={() => !isRephrasing && setShowLevels(o => !o)}
              title="Change response level"
            >
              {isRephrasing ? <Loader size={10} style={{ animation: 'spin 0.8s linear infinite' }} /> : `${levelDots[chatMode] || ''} ${currentLevel}`}
            </span>
            {showLevels && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, zIndex: 10, marginTop: 4,
                background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                overflow: 'hidden', minWidth: 100,
              }}>
                {Object.entries(levelLabels).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => handleLevelChange(key)}
                    style={{
                      display: 'block', width: '100%', padding: '6px 12px',
                      border: 'none', background: key === chatMode ? 'var(--primary-light)' : 'transparent',
                      color: 'var(--text-primary)', fontSize: 12, cursor: 'pointer',
                      textAlign: 'left', fontFamily: 'inherit',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <span style={s.timestamp}>{formatTimestamp(message.created_at)}</span>
          {!isTyping && (
            <button
              onClick={handleCopy}
              title="Copy response"
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: copied ? 'var(--green-online)' : 'var(--text-muted)',
                padding: 2,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
            </button>
          )}
        </div>
        <div style={s.message}>
          <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(visibleHtml) }} />
          {isTyping && <span style={{ display: 'inline-block', width: 2, height: '1em', background: 'var(--primary)', marginLeft: 2, animation: 'blink 0.6s step-end infinite', verticalAlign: 'text-bottom' }} />}
        </div>
        {message.image && <MedicalImageViewer image={message.image} activeFindingId={activeFindingId} onFindingClick={setActiveFindingId} />}
        {message.clinical && message.simple && (
          <AnalysisPanel clinical={message.clinical} simple={message.simple} />
        )}
      </div>
      <style>{`
        @keyframes blink { 50% { opacity: 0; } }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        p { margin: 0 0 16px 0; }
        hr { border: none; border-top: 1px solid var(--border-color); margin: 24px 0; }
        table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
        th, td { border: 1px solid var(--border-color); padding: 10px 12px; text-align: left; vertical-align: top; }
        th { background: var(--primary-light); color: var(--text-primary); font-weight: 600; }
        td { color: var(--text-secondary); }
        h1, h2, h3 { color: var(--text-primary); margin: 16px 0 8px; }
        h1 { font-size: 16px; }
        h2 { font-size: 15px; }
        h3 { font-size: 14px; }
        ul, ol { padding-left: 20px; margin: 12px 0; }
        li { margin-bottom: 8px; }
      `}</style>
    </div>
  )
}

export default memo(AIResponse)



