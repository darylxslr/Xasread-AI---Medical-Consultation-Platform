import { useState, useRef, useEffect, useMemo } from 'react'
import { Shield, MoreVertical, LogOut, Info, AlertCircle, Download, Menu } from 'lucide-react'
import { useMediaQuery } from '../hooks/useMediaQuery'

interface TopHeaderProps {
  onEndSession: () => void
  onExport?: () => void
  onToggleSidebar?: () => void
}

const s = {
  header: {
    height: 'var(--header-height)',
    background: 'var(--bg-card)',
    borderBottom: '1px solid var(--border-color)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    position: 'sticky',
    top: 0,
    zIndex: 50,
    flexShrink: 0,
  } as const,
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  } as const,
  sessionLabel: {
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--text-muted)',
  } as const,
  sessionId: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    color: 'var(--text-secondary)',
    background: 'var(--bg-main)',
    padding: '4px 8px',
    borderRadius: 'var(--radius-sm)',
  } as const,
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    fontWeight: 500,
    color: 'var(--green-online)',
  } as const,
  pulse: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: 'var(--green-online)',
  } as const,
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    position: 'relative',
  } as const,
  hipaaBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 12px',
    borderRadius: 'var(--radius-pill)',
    border: '1px solid var(--green-online)',
    color: 'var(--green-online)',
    fontSize: 11,
    fontWeight: 600,
    background: 'rgba(34, 197, 94, 0.08)',
  } as const,
  iconBtn: {
    width: 32, height: 32, borderRadius: 'var(--radius-sm)',
    border: 'none', background: 'transparent', color: 'var(--text-muted)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
  } as const,
  dropdown: {
    position: 'absolute' as const,
    top: '100%',
    right: 0,
    marginTop: 4,
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-lg)',
    minWidth: 180,
    zIndex: 100,
    overflow: 'hidden',
  } as const,
  dropdownItem: {
    padding: '10px 14px',
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    cursor: 'pointer',
    border: 'none',
    background: 'transparent',
    width: '100%',
    textAlign: 'left' as const,
    transition: 'background 0.1s',
  } as const,
}

const pulseKeyframes = `
@keyframes pulse-ring {
  0% { transform: scale(1); opacity: 0.6; }
  100% { transform: scale(2.5); opacity: 0; }
}`

function PulseDot() {
  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <div style={s.pulse} />
      <style>{pulseKeyframes}</style>
      <div style={{
        position: 'absolute',
        inset: 0,
        borderRadius: '50%',
        background: 'var(--green-online)',
        animation: 'pulse-ring 2s ease-out infinite',
      }} />
    </div>
  )
}

export default function TopHeader({ onEndSession, onExport, onToggleSidebar }: TopHeaderProps) {
  const isMobile = useMediaQuery('(max-width: 639px)')
  const [menuOpen, setMenuOpen] = useState(false)
  const [alertMsg, setAlertMsg] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const sessionId = useMemo(() => `SID-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 9000) + 1000)}`, [])

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  useEffect(() => {
    if (alertMsg) {
      const t = setTimeout(() => setAlertMsg(null), 2500)
      return () => clearTimeout(t)
    }
  }, [alertMsg])

  const headerStyle = { ...s.header, padding: isMobile ? '0 12px' : '0 24px' }

  return (
    <header style={headerStyle}>
      <style>{`
        .header-icon-btn:hover { background: var(--bg-hover) !important; color: var(--text-secondary) !important; }
        .header-dropdown-item:hover { background: var(--bg-hover) !important; }
      `}</style>
      <div style={{ ...s.left, gap: isMobile ? 8 : 16 }}>
        <button className="header-icon-btn hamburger-btn" style={s.iconBtn} onClick={onToggleSidebar}>
          <Menu size={18} />
        </button>
        <span style={s.sessionLabel}>Session</span>
        <span style={s.sessionId}>{sessionId}</span>
        <div style={s.statusBadge}>
          <PulseDot />
          Model Active
        </div>
      </div>
      <div style={s.right}>
        <div style={s.hipaaBadge}>
          <Shield size={12} />
          HIPAA-Safe
        </div>
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button className="header-icon-btn" style={s.iconBtn} onClick={() => setMenuOpen(o => !o)}>
            <MoreVertical size={16} />
          </button>
          {menuOpen && (
            <div style={s.dropdown}>
              <button className="header-dropdown-item" style={s.dropdownItem} onClick={() => { setMenuOpen(false); onEndSession(); }}>
                <LogOut size={14} />
                End Session
              </button>
              {onExport && (
                <button className="header-dropdown-item" style={s.dropdownItem} onClick={() => { setMenuOpen(false); onExport(); }}>
                  <Download size={14} />
                  Export Conversation
                </button>
              )}
              <button className="header-dropdown-item" style={s.dropdownItem} onClick={() => { setMenuOpen(false); setAlertMsg('Xasread AI v3.0 — HIPAA-compliant medical consultation assistant.'); }}>
                <Info size={14} />
                About Xasread
              </button>
              <button className="header-dropdown-item" style={s.dropdownItem} onClick={() => { setMenuOpen(false); setAlertMsg('Report submitted. Thank you.'); }}>
                <AlertCircle size={14} />
                Report Issue
              </button>
            </div>
          )}
        </div>
      </div>
      {alertMsg && (
        <div style={{
          position: 'fixed',
          top: 80,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--text-primary)',
          color: 'var(--bg-card)',
          padding: '10px 20px',
          borderRadius: 'var(--radius-pill)',
          fontSize: 13,
          fontWeight: 500,
          boxShadow: 'var(--shadow-lg)',
          zIndex: 9999,
          animation: 'toast-in 0.3s ease',
          maxWidth: '90vw',
          whiteSpace: 'nowrap',
        }}>
          {alertMsg}
        </div>
      )}
      <style>{`@keyframes toast-in { from { opacity: 0; transform: translateX(-50%) translateY(10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }`}</style>
    </header>
  )
}
