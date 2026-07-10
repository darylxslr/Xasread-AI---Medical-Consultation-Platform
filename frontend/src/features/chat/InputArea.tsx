import { useState, useRef, useEffect } from 'react'
import { Paperclip, Mic, SendHorizonal, Shield } from 'lucide-react'

interface InputAreaProps {
  onSend: (text: string, fileName?: string) => void
  onFilePick: () => void
  pendingFile: { name: string; data: string } | null
  sessionId?: string
}

const s = {
  wrapper: {
    position: 'sticky',
    bottom: 0,
    padding: '12px 24px 20px',
    background: 'linear-gradient(transparent, var(--bg-main) 20%)',
    flexShrink: 0,
    overflow: 'hidden',
  } as const,
  container: {
    maxWidth: 800,
    margin: '0 auto',
  } as const,
  topRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    padding: '0 4px',
  } as const,
  modeGroup: {
    display: 'flex',
    gap: 4,
  } as const,
  modeChip: (active: boolean, disabled: boolean = false) => ({
    padding: '4px 12px',
    borderRadius: 'var(--radius-pill)',
    border: `1px solid ${active ? 'var(--primary)' : 'var(--border-color)'}`,
    fontSize: 11,
    fontWeight: 600,
    cursor: disabled ? 'default' as const : 'pointer' as const,
    background: active ? 'var(--primary-light)' : disabled ? 'transparent' : 'transparent',
    color: active ? 'var(--primary)' : disabled ? 'var(--text-muted)' : 'var(--text-muted)',
    opacity: disabled ? 0.4 : 1,
  }),
  hipaaBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--green-online)',
    padding: '4px 10px',
    borderRadius: 'var(--radius-pill)',
    border: '1px solid rgba(34, 197, 94, 0.3)',
    background: 'rgba(34, 197, 94, 0.06)',
  } as const,
  inputBar: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 8,
    padding: '10px 14px',
    borderRadius: 'var(--radius-lg)',
    background: 'var(--bg-input)',
    border: '1px solid var(--border-color)',
    boxShadow: 'var(--shadow-md)',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  } as const,
  inputBarFocused: {
    borderColor: 'var(--primary)',
    boxShadow: '0 0 0 3px var(--primary-light), var(--shadow-md)',
  } as const,
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    background: 'transparent',
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as const,
    flexShrink: 0,
    transition: 'all 0.15s',
  } as const,
  textarea: {
    flex: 1,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    color: 'var(--text-primary)',
    fontSize: 'var(--chat-font-size, 14px)',
    lineHeight: 1.5,
    resize: 'none' as const,
    padding: '6px 0',
    minHeight: 24,
    maxHeight: 120,
    fontFamily: 'inherit',
    wordSpacing: 4,
    fontVariantLigatures: 'none',
    whiteSpace: 'pre-wrap',
  } as const,
  sendBtn: (active: boolean) => ({
    width: 36,
    height: 36,
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    background: 'var(--primary)',
    color: '#fff',
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    cursor: active ? 'pointer' as const : 'default' as const,
    flexShrink: 0,
    opacity: active ? 1 : 0.5,
    transition: 'all 0.2s',
  }),
  divider: {
    width: 1,
    height: 24,
    background: 'var(--border-color)',
    flexShrink: 0,
  } as const,
}

const modeKeys = ['plain', 'standard', 'clinical']

function loadModeFromStorage(): string {
  try {
    const s = localStorage.getItem('xasread-settings')
    if (s) return JSON.parse(s).chatMode || 'standard'
  } catch { /* ignore */ }
  return 'standard'
}

function saveModeToStorage(mode: string) {
  try {
    const s = localStorage.getItem('xasread-settings')
    const settings = s ? JSON.parse(s) : {}
    settings.chatMode = mode
    localStorage.setItem('xasread-settings', JSON.stringify(settings))
  } catch { /* ignore */ }
}

const modeChipLabels: Record<string, string> = {
  plain: 'Plain',
  standard: 'Standard',
  clinical: 'Clinical',
}

export default function InputArea({ onSend, onFilePick, pendingFile, sessionId }: InputAreaProps) {
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const [mode, setMode] = useState(loadModeFromStorage)
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 120) + 'px'
    }
  }, [value])

  const handleSend = () => {
    if (!value.trim()) return
    onSend(value.trim())
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleMic = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser. Try Chrome or Edge.')
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-PH'
    recognition.continuous = false
    recognition.interimResults = false
    recognitionRef.current = recognition
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setValue(prev => prev ? `${prev} ${transcript}` : transcript)
      setIsListening(false)
    }
    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)
    recognition.start()
    setIsListening(true)
  }

  const handleModeClick = (m: string) => {
    setMode(m)
    saveModeToStorage(m)
  }

  const wrapperStyle = { ...s.wrapper, padding: 'var(--input-padding)' }
  const containerStyle = { ...s.container, maxWidth: 'var(--input-container-max)' }

  return (
    <div style={wrapperStyle}>
      <style>{`
        .input-icon-btn:hover { background: var(--bg-hover) !important; color: var(--primary) !important; }
        .input-send-btn:hover:not(:disabled) { background: var(--primary-hover) !important; transform: scale(1.05) !important; }
        .input-send-btn:active:not(:disabled) { transform: scale(0.95) !important; }
        @keyframes mic-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .waveform-bar { width: 3px; border-radius: 2px; background: var(--primary); animation: wave 0.8s ease-in-out infinite; }
        .waveform-bar:nth-child(1) { height: 12px; animation-delay: 0s; }
        .waveform-bar:nth-child(2) { height: 18px; animation-delay: 0.1s; }
        .waveform-bar:nth-child(3) { height: 24px; animation-delay: 0.2s; }
        .waveform-bar:nth-child(4) { height: 14px; animation-delay: 0.3s; }
        .waveform-bar:nth-child(5) { height: 20px; animation-delay: 0.4s; }
        .waveform-bar:nth-child(6) { height: 10px; animation-delay: 0.5s; }
        .waveform-bar:nth-child(7) { height: 16px; animation-delay: 0.6s; }
        .waveform-bar:nth-child(8) { height: 22px; animation-delay: 0.7s; }
        @keyframes wave { 0%, 100% { transform: scaleY(0.5); } 50% { transform: scaleY(1); } }
      `}</style>
      <div style={containerStyle}>
        <div style={s.topRow}>
          <div style={s.modeGroup}>
            {modeKeys.map(m => {
              const fileAttached = !!pendingFile
              return (
                <button
                  key={m}
                  style={s.modeChip(mode === m, fileAttached)}
                  onClick={() => !fileAttached && handleModeClick(m)}
                  title={fileAttached ? 'Image analysis uses Clinical AI automatically' : modeChipLabels[m]}
                >
                  {modeChipLabels[m]}
                </button>
              )
            })}
            {pendingFile && (
              <span style={{
                fontSize: 10,
                color: 'var(--primary)',
                fontWeight: 600,
                marginLeft: 6,
                whiteSpace: 'nowrap',
              }}>
                🔬 Image Analysis
              </span>
            )}
          </div>
          <div className="header-mobile-hide" style={s.hipaaBadge}>
            <Shield size={12} />
            HIPAA-Safe Session
          </div>
          <div className="header-mobile-only" style={{
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
            fontWeight: 600,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: 120,
          }}>
            {sessionId}
          </div>
        </div>
        <div
          style={{
            ...s.inputBar,
            ...(focused ? s.inputBarFocused : {}),
          }}
        >
          <button className="input-icon-btn" style={s.iconBtn} title="Upload medical image or document" onClick={onFilePick}>
            <Paperclip size={18} />
          </button>
          {pendingFile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, maxWidth: 150 }}>
              {pendingFile.data.startsWith('data:image/') ? (
                <img
                  src={pendingFile.data}
                  alt={pendingFile.name}
                  style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', objectFit: 'cover', flexShrink: 0 }}
                />
              ) : (
                <Paperclip size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              )}
              <span style={{
                fontSize: 11,
                color: 'var(--primary)',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }} title={pendingFile.name}>
                {pendingFile.name}
              </span>
            </div>
          )}
          <div style={s.divider} />
          <textarea
            ref={textareaRef}
            className="main-input-textarea"
            style={s.textarea}
            placeholder="Describe symptoms or ask about a medical concern..."
            value={value}
            onChange={e => setValue(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            rows={1}
            onKeyDown={handleKeyDown}
          />
          <button
            className="input-icon-btn"
            style={{
              ...s.iconBtn,
              ...(isListening ? { color: 'var(--primary)', animation: 'mic-pulse 1s ease-in-out infinite' } : {}),
            }}
            title={isListening ? 'Listening...' : 'Voice input'}
            onClick={handleMic}
          >
            <Mic size={18} />
          </button>
          {isListening && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, paddingRight: 4 }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="waveform-bar" />
              ))}
            </div>
          )}
          <div style={s.divider} />
          <button
            className="input-send-btn"
            style={s.sendBtn(value.trim().length > 0)}
            disabled={!value.trim()}
            title="Send"
            onClick={handleSend}
          >
            <SendHorizonal size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
