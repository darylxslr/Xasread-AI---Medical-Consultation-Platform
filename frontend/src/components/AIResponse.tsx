import { useState, useEffect, useRef, useCallback } from 'react'
import { Bot, Copy, Check, Loader } from 'lucide-react'
import MedicalImageViewer from './MedicalImageViewer'
import AnalysisPanel from './AnalysisPanel'
import type { Message } from '../types'

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

function inlineFormat(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\*/g, '')
}

function renderMarkdown(text: string): string {
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  const lines = html.split('\n')
  const out: string[] = []
  let inList = false
  let listType: 'ul' | 'ol' | null = null

  for (const line of lines) {
    const ulMatch = line.match(/^[-*] (.+)$/)
    const olMatch = line.match(/^\d+[.)] (.+)$/)
    const isEmpty = line.trim() === ''

    if (ulMatch) {
      if (!inList || listType !== 'ul') {
        if (inList) out.push(listType === 'ul' ? '</ul>' : '</ol>')
        out.push('<ul>')
        inList = true
        listType = 'ul'
      }
      out.push(`<li>${inlineFormat(ulMatch[1])}</li>`)
    } else if (olMatch) {
      if (!inList || listType !== 'ol') {
        if (inList) out.push(listType === 'ul' ? '</ul>' : '</ol>')
        out.push('<ol>')
        inList = true
        listType = 'ol'
      }
      out.push(`<li>${inlineFormat(olMatch[1])}</li>`)
    } else {
      if (inList) {
        out.push(listType === 'ul' ? '</ul>' : '</ol>')
        inList = false
        listType = null
      }
      if (!isEmpty) {
        out.push(inlineFormat(line))
      }
    }
  }
  if (inList) {
    out.push(listType === 'ul' ? '</ul>' : '</ol>')
  }

  html = out.join('\n')
  html = html.replace(/\n/g, '<br/>')
  return html
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
    background: 'linear-gradient(135deg, #D4782F 0%, #E8954F 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
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
    lineHeight: 1.7,
    color: 'var(--text-secondary)',
    marginBottom: 16,
  } as const,
}

const animatedIds = new Set<string>()

export default function AIResponse({ message, onRephrase }: AIResponseProps) {
  const [chatMode, setChatMode] = useState(() => {
    try {
      const s = localStorage.getItem('xasread-settings')
      if (s) return JSON.parse(s).chatMode || 'standard'
    } catch {}
    return 'standard'
  })
  const [typedLen, setTypedLen] = useState(() => animatedIds.has(message.id) ? (message.content || '').length : 0)
  const timerRef = useRef<number | null>(null)
  const fullText = message.content || ''

  useEffect(() => {
    if (animatedIds.has(message.id) || typedLen === fullText.length) {
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
        animatedIds.add(message.id)
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
  const levelRef = useRef<HTMLDivElement>(null)

  const levelLabels: Record<string, string> = { simple: 'Simple', standard: 'Standard', advanced: 'Advanced' }
  const currentLevel = levelLabels[chatMode] || chatMode

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
    <div style={s.wrapper}>
      <div style={s.avatar}>
        <Bot size={16} />
      </div>
      <div style={s.content}>
        <div style={s.header}>
          <span style={s.name}>Xasread AI</span>
          <span style={s.badge}>v3.0</span>
          <div ref={levelRef} style={{ position: 'relative' }}>
            <span
              style={{ ...s.badge, background: 'var(--bg-main)', cursor: 'pointer', userSelect: 'none' }}
              onClick={() => !isRephrasing && setShowLevels(o => !o)}
              title="Change response level"
            >
              {isRephrasing ? <Loader size={10} style={{ animation: 'spin 0.8s linear infinite' }} /> : currentLevel}
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
          <span dangerouslySetInnerHTML={{ __html: visibleHtml }} />
          {isTyping && <span style={{ display: 'inline-block', width: 2, height: '1em', background: 'var(--primary)', marginLeft: 2, animation: 'blink 0.6s step-end infinite', verticalAlign: 'text-bottom' }} />}
        </div>
        {message.image && <MedicalImageViewer image={message.image} />}
        {message.clinical && message.simple && (
          <AnalysisPanel clinical={message.clinical} simple={message.simple} />
        )}
      </div>
      <style>{`@keyframes blink { 50% { opacity: 0; } }@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
