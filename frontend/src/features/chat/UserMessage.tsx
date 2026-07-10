import { useState, useRef, useEffect, useCallback, memo } from 'react'
import { Paperclip, MoreVertical, Edit3, Trash2, Check, X } from 'lucide-react'
import type { Message } from '../../types'

interface UserMessageProps {
  message: Message
  onEdit: (id: string, newContent: string) => void
  onDelete: (id: string) => void
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
    justifyContent: 'flex-end',
    marginBottom: 24,
    position: 'relative',
  } as const,
  container: {
    maxWidth: 'var(--msg-bubble-max)',
  } as const,
  bubble: {
    background: 'var(--user-bubble)',
    color: 'var(--user-bubble-text)',
    padding: '12px 18px',
    borderRadius: '16px 16px 4px 16px',
    fontSize: 'var(--chat-font-size, 14px)',
    lineHeight: 1.6,
    boxShadow: '0 2px 8px rgba(212, 120, 47, 0.15)',
  } as const,
  fileChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    padding: '6px 12px',
    borderRadius: 'var(--radius-pill)',
    background: 'rgba(255, 255, 255, 0.15)',
    fontSize: 12,
    fontWeight: 500,
    color: 'rgba(255, 255, 255, 0.9)',
  } as const,
  time: {
    fontSize: 11,
    color: 'var(--text-muted)',
    marginTop: 6,
    textAlign: 'right',
  } as const,
  menuBtn: {
    position: 'absolute' as const,
    right: -28,
    top: 4,
    width: 24, height: 24,
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    background: 'transparent',
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    opacity: 0,
    transition: 'opacity 0.15s, background 0.15s',
  } as const,
  dropdown: {
    position: 'absolute' as const,
    right: -28,
    top: 30,
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-lg)',
    minWidth: 120,
    zIndex: 200,
    overflow: 'hidden',
  } as const,
  dropdownItem: {
    padding: '8px 12px',
    fontSize: 12,
    fontWeight: 500,
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
    border: 'none',
    background: 'transparent',
    width: '100%',
    textAlign: 'left' as const,
    transition: 'background 0.1s',
  } as const,
  editTextarea: {
    width: '100%',
    border: 'none',
    outline: 'none',
    background: 'rgba(255,255,255,0.1)',
    color: 'var(--user-bubble-text)',
    fontFamily: 'inherit',
    fontSize: 'inherit',
    lineHeight: 1.6,
    resize: 'none' as const,
    padding: '4px 0',
    borderRadius: 4,
  } as const,
  editActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 6,
  } as const,
  editBtn: {
    width: 28, height: 28,
    borderRadius: 'var(--radius-sm)',
    border: '1px solid rgba(255,255,255,0.2)',
    background: 'rgba(255,255,255,0.05)',
    color: 'rgba(255,255,255,0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'background 0.15s',
  } as const,
}

function UserMessage({ message, onEdit, onDelete }: UserMessageProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(message.content)
  const menuRef = useRef<HTMLDivElement>(null)
  const editRef = useRef<HTMLTextAreaElement>(null)
  const fileName = message.fileName || message.image?.fileName

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
    if (editing && editRef.current) {
      editRef.current.focus()
      editRef.current.setSelectionRange(editValue.length, editValue.length)
    }
  }, [editing, editValue.length])

  const handleSave = useCallback(() => {
    if (editValue.trim()) {
      onEdit(message.id, editValue.trim())
    }
    setEditing(false)
  }, [editValue, message.id, onEdit])

  const handleCancel = useCallback(() => {
    setEditValue(message.content)
    setEditing(false)
  }, [message.content])

  const handleDelete = useCallback(() => {
    setMenuOpen(false)
    onDelete(message.id)
  }, [message.id, onDelete])

  return (
    <div
      className="user-msg-wrapper msg-enter"
      style={{ ...s.wrapper, position: 'relative' }}
      onMouseEnter={e => {
        const btn = (e.currentTarget as HTMLElement).querySelector('.user-msg-menu-btn') as HTMLElement
        if (btn) btn.style.opacity = '1'
      }}
      onMouseLeave={e => {
        const btn = (e.currentTarget as HTMLElement).querySelector('.user-msg-menu-btn') as HTMLElement
        if (!menuOpen && btn) btn.style.opacity = '0'
      }}
    >
      <style>{`
        .user-msg-dropdown-item:hover { background: var(--bg-hover) !important; }
        .user-msg-menu-btn:hover { background: var(--bg-hover) !important; }
        .user-msg-edit-btn:hover { background: rgba(255,255,255,0.12) !important; }
      `}</style>
      <div style={s.container}>
        <div style={s.bubble}>
          {editing ? (
            <>
              <textarea
                ref={editRef}
                style={s.editTextarea}
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSave() }
                  if (e.key === 'Escape') { handleCancel() }
                }}
                rows={2}
              />
              <div style={s.editActions}>
                <button className="user-msg-edit-btn" style={s.editBtn} onClick={handleCancel} title="Cancel">
                  <X size={14} />
                </button>
                <button className="user-msg-edit-btn" style={{ ...s.editBtn, background: 'rgba(255,255,255,0.15)' }} onClick={handleSave} title="Save">
                  <Check size={14} />
                </button>
              </div>
            </>
          ) : (
            <>
              {message.content}
              {fileName && (
                <div style={s.fileChip}>
                  <Paperclip size={12} />
                  {fileName}
                </div>
              )}
            </>
          )}
        </div>
        <div style={s.time}>{formatTimestamp(message.created_at)}</div>
      </div>

      {!editing && (
        <div ref={menuRef} className="user-msg-menu-wrap" style={{ position: 'absolute', right: -32, top: 0 }}>
          <style>{`
            .user-msg-menu-wrap { right: -32px; }
            .user-msg-menu-btn { opacity: 0; }
            .user-msg-menu-btn:hover { opacity: 1; }
            @media (hover: none) and (pointer: coarse) {
              .user-msg-menu-wrap { right: 0; }
              .user-msg-menu-btn { opacity: 1 !important; }
            }
          `}</style>
          <button
            className="user-msg-menu-btn"
            style={s.menuBtn}
            onClick={() => setMenuOpen(o => !o)}
          >
            <MoreVertical size={14} />
          </button>
          {menuOpen && (
            <div style={s.dropdown}>
              <button className="user-msg-dropdown-item" style={s.dropdownItem} onClick={() => { setMenuOpen(false); setEditing(true); }}>
                <Edit3 size={12} />
                Edit
              </button>
              <button className="user-msg-dropdown-item" style={{ ...s.dropdownItem, color: '#EF4444' }} onClick={handleDelete}>
                <Trash2 size={12} />
                Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default memo(UserMessage)

