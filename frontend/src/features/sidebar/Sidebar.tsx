import { useState, useRef, useEffect } from 'react'
import { useTheme } from '../../context/ThemeContext'
import SettingsPanel from '../settings/SettingsPanel'
import GuestExpiryBanner from './GuestExpiryBanner'
import { Plus, Search, MessageSquare, Settings, Sun, Moon, Clock, Inbox, LogOut, Users, Trash2 } from 'lucide-react'
import type { Conversation } from '../../types'

interface SidebarProps {
  conversations: Conversation[]
  activeConv: string | null
  onSelectConv: (id: string | null) => void
  onNewConsultation: () => void
  onDeleteConv: (id: string) => void
  onSignOut: () => void
  disabled?: boolean
  userName?: string
  avatarUrl?: string
  isOpen?: boolean
  onToggle?: () => void
  guestExpiresAt?: string | null
}

const s = {
  sidebar: {
    width: 'var(--sidebar-width)',
    minWidth: 'var(--sidebar-width)',
    height: '100vh',
    background: 'var(--bg-sidebar)',
    borderRight: '1px solid var(--border-color)',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    left: 0,
    top: 0,
    zIndex: 100,
  } as const,
  logoArea: {
    padding: '20px 16px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  } as const,
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 'var(--radius-sm)',
    background: 'linear-gradient(135deg, #D4782F 0%, #E8954F 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: 16,
    fontWeight: 700,
    flexShrink: 0,
  } as const,
  logoText: {
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--text-primary)',
    letterSpacing: '-0.3px',
  } as const,
  logoSub: {
    fontSize: 11,
    color: 'var(--text-muted)',
    fontWeight: 500,
    marginTop: -2,
  } as const,
  newBtn: {
    margin: '4px 12px 12px',
    padding: '10px 16px',
    borderRadius: 'var(--radius-pill)',
    border: '1px solid var(--border-color)',
    background: 'transparent',
    color: 'var(--text-primary)',
    fontSize: 14,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
    transition: 'all 0.2s',
  } as const,
  searchWrap: {
    padding: '0 12px 8px',
    position: 'relative',
  } as const,
  searchInput: {
    width: '100%',
    padding: '8px 12px 8px 36px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-color)',
    background: 'var(--bg-main)',
    color: 'var(--text-primary)',
    fontSize: 13,
    outline: 'none',
    transition: 'border-color 0.2s',
  } as const,
  searchIcon: {
    position: 'absolute',
    left: 23,
    top: '40%',
    transform: 'translateY(-50%)',
    color: 'var(--text-muted)',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as const,
  history: {
    flex: 1,
    overflowY: 'auto',
    padding: '4px 8px',
  } as const,
  historyItem: {
    padding: '10px 12px',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    marginBottom: 2,
  } as const,
  historyTitle: {
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--text-primary)',
    lineHeight: 1.3,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  } as const,
  historyTime: {
    fontSize: 11,
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  } as const,
  emptyState: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 24px',
    textAlign: 'center',
    gap: 8,
  } as const,
  emptyIcon: {
    color: 'var(--text-muted)',
    opacity: 0.4,
    marginBottom: 4,
  } as const,
  emptyText: {
    fontSize: 13,
    color: 'var(--text-muted)',
    lineHeight: 1.5,
  } as const,
  footer: {
    borderTop: '1px solid var(--border-color)',
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
  } as const,
  userBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    padding: 0,
    borderRadius: 'var(--radius-sm)',
    transition: 'all 0.15s',
    flex: 1,
  } as const,
  avatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: 'var(--primary-light)',
    border: '2px solid var(--primary-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--primary)',
    fontSize: 13,
    fontWeight: 600,
    flexShrink: 0,
  } as const,
  userName: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-primary)',
  } as const,
  userRole: {
    fontSize: 11,
    color: 'var(--text-muted)',
  } as const,
  footerActions: {
    display: 'flex',
    gap: 2,
  } as const,
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    background: 'transparent',
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s',
  } as const,
  accountDropdown: {
    position: 'absolute' as const,
    bottom: '100%',
    left: 8,
    marginBottom: 4,
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-lg)',
    minWidth: 180,
    zIndex: 200,
    overflow: 'hidden',
  } as const,
  accountDropdownItem: {
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

export default function Sidebar({ conversations, activeConv, onSelectConv, onNewConsultation, onDeleteConv, onSignOut, disabled, userName, avatarUrl, isOpen, onToggle, guestExpiresAt }: SidebarProps) {
  const { theme, toggleTheme } = useTheme()
  const [search, setSearch] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const accountMenuRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef(0)

  const filtered = conversations
    .filter(c => c.title.toLowerCase().includes(search.toLowerCase()))

  const isEmpty = conversations.length === 0
  const noResults = !isEmpty && filtered.length === 0

  useEffect(() => {
    if (!accountMenuOpen) return
    const handler = (e: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [accountMenuOpen])

  const sidebarContent = (
    <aside style={{ ...s.sidebar, zIndex: isOpen ? 101 : 100 }}>
      <style>{`
        .sidebar-new-btn:hover { background: var(--primary-light) !important; border-color: var(--primary) !important; }
        .sidebar-new-btn:active { transform: scale(0.97) !important; }
        .sidebar-history-item:hover { background: var(--bg-hover) !important; }
        .sidebar-history-item:hover .sidebar-del-btn { opacity: 1 !important; }
        .sidebar-del-btn:hover { color: #EF4444 !important; background: rgba(239,68,68,0.08) !important; }
        .sidebar-footer-btn:hover { background: var(--bg-hover) !important; color: var(--text-secondary) !important; }
        .sidebar-search-input:focus { border-color: var(--primary) !important; box-shadow: 0 0 0 2px var(--primary-light) !important; }
        .sidebar-user-btn:hover { background: var(--bg-hover) !important; }
        .sidebar-account-item:hover { background: var(--bg-hover) !important; }
        .sidebar-account-item.danger:hover { background: rgba(239,68,68,0.08) !important; color: #EF4444 !important; }
      `}</style>
      <div style={s.logoArea}>
        <div style={s.logoIcon}>X</div>
        <div>
          <div style={s.logoText}>Xasread</div>
          <div style={s.logoSub}>AI Medical Consultant</div>
        </div>
      </div>

      <button className="sidebar-new-btn" style={{ ...s.newBtn, opacity: disabled ? 0.4 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }} disabled={disabled} onClick={onNewConsultation}>
        <Plus size={16} />
        New Consultation
      </button>

      {!isEmpty && (
        <div style={s.searchWrap}>
          <input
            className="sidebar-search-input"
            style={s.searchInput}
            placeholder="Search consultations..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div style={s.searchIcon}>
            <Search size={14} />
          </div>
        </div>
      )}

      {isEmpty ? (
        <div style={s.emptyState}>
          <div style={s.emptyIcon}><Inbox size={32} /></div>
          <p style={s.emptyText}>No consultations yet.<br />Start a new consultation to begin.</p>
        </div>
      ) : noResults ? (
        <div style={s.emptyState}>
          <div style={s.emptyIcon}><Search size={28} style={{ opacity: 0.4 }} /></div>
          <p style={s.emptyText}>No consultations match<br />"{search}"</p>
        </div>
      ) : (
        <div style={s.history}>
          {filtered.map(conv => (
            <div
              key={conv.id}
              className="sidebar-history-item"
              style={{
                ...s.historyItem,
                background: activeConv === conv.id ? 'var(--primary-light)' : 'transparent',
                borderLeft: activeConv === conv.id ? '3px solid var(--primary)' : '3px solid transparent',
                position: 'relative',
                paddingRight: 40,
              }}
              onClick={() => onSelectConv(conv.id)}
            >
              <div style={s.historyTitle}>
                <MessageSquare size={12} style={{ marginRight: 6, color: 'var(--text-muted)', verticalAlign: -1 }} />
                {conv.title}
              </div>
                <div style={s.historyTime}>
                <Clock size={10} />
                {formatTimestamp(conv.timestamp)}
              </div>
              <button
                className="sidebar-del-btn"
                style={{
                  position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                  width: 24, height: 24, borderRadius: 'var(--radius-sm)',
                  border: 'none', background: 'transparent', color: 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', opacity: 0, transition: 'all 0.15s',
                  padding: 0,
                }}
                onClick={e => { e.stopPropagation(); onDeleteConv(conv.id) }}
                title="Delete consultation"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

            {guestExpiresAt && (
        <GuestExpiryBanner expiresAt={guestExpiresAt} />
      )}

      <div style={s.footer}>
        <div ref={accountMenuRef} style={{ position: 'relative', flex: 1 }}>
          <button className="sidebar-user-btn" style={s.userBtn} onClick={() => setAccountMenuOpen(o => !o)}>
            <div style={s.avatar}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                userName ? userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'G'
              )}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={s.userName}>{userName || 'Guest User'}</div>
              <div style={s.userRole}>{guestExpiresAt ? 'Guest' : 'User'}</div>
            </div>
          </button>
          {accountMenuOpen && (
            <div style={s.accountDropdown}>
              <button className="sidebar-account-item" style={s.accountDropdownItem} onClick={() => { setAccountMenuOpen(false); onSignOut(); }}>
                <Users size={14} />
                Switch Account
              </button>
              <button className="sidebar-account-item danger" style={s.accountDropdownItem} onClick={() => { setAccountMenuOpen(false); onSignOut(); }}>
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          )}
        </div>
        <div style={s.footerActions}>
          <button className="sidebar-footer-btn" style={s.iconBtn} onClick={toggleTheme} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          <button className="sidebar-footer-btn" style={s.iconBtn} title="Settings" onClick={() => setShowSettings(true)}>
            <Settings size={16} />
          </button>
        </div>
      </div>

      {showSettings && (
        <SettingsPanel onClose={() => setShowSettings(false)} onSignOut={onSignOut} />
      )}
    </aside>
  )

  return (
    <>
      <div className="sidebar-desktop">
        {sidebarContent}
      </div>
      <div className={`sidebar-mobile sidebar-overlay${isOpen ? ' open' : ''}`} onClick={onToggle} />
      <div className={`sidebar-mobile sidebar-drawer${isOpen ? ' open' : ''}`} style={{ position: 'fixed', left: 0, top: 0, zIndex: 100 }}
        onTouchStart={e => { touchStartX.current = e.touches[0].clientX }}
        onTouchEnd={e => {
          const dx = touchStartX.current - e.changedTouches[0].clientX
          if (dx > 80) onToggle?.()
        }}
      >
        {sidebarContent}
      </div>
    </>
  )
}
