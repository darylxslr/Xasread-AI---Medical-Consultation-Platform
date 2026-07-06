import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import { X, Sun, Moon, Monitor, Type, LogOut } from 'lucide-react'
import type { AppSettings } from '../types'

interface SettingsPanelProps {
  onClose: () => void
  onSignOut?: () => void
}

function loadSettings(): AppSettings {
  try {
    const s = localStorage.getItem('xasread-settings')
    if (s) return JSON.parse(s)
  } catch {}
  return { fontSize: 'medium', chatMode: 'standard' }
}

function saveSettings(s: AppSettings) {
  localStorage.setItem('xasread-settings', JSON.stringify(s))
}

const fontSizeMap = { small: 13, medium: 14, large: 16 }

export default function SettingsPanel({ onClose, onSignOut }: SettingsPanelProps) {
  const { theme, setTheme, followSystem, isSystem } = useTheme()
  const [settings, setSettings] = useState<AppSettings>(loadSettings)

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const next = { ...settings, [key]: value }
    setSettings(next)
    saveSettings(next)
    document.documentElement.style.setProperty('--chat-font-size', `${fontSizeMap[next.fontSize]}px`)
    window.dispatchEvent(new CustomEvent('xasread-settings-changed'))
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9998,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <style>{`
        .settings-overlay { background: rgba(0,0,0,0.4); animation: settings-fadein 0.2s ease; }
        .settings-panel { animation: settings-slideup 0.25s ease; }
        .settings-btn:hover { background: var(--bg-hover) !important; }
        .settings-btn.active { background: var(--primary-light) !important; border-color: var(--primary) !important; color: var(--primary) !important; }
        .settings-signout:hover { background: rgba(239,68,68,0.08) !important; color: #EF4444 !important; }
        @keyframes settings-fadein { from { opacity: 0; } to { opacity: 1; } }
        @keyframes settings-slideup { from { opacity: 0; transform: translateY(16px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>
      <div className="settings-overlay" style={{
        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)',
      }} />
      <div
        className="settings-panel"
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative',
          width: 400,
          maxWidth: '90vw',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-lg)',
          padding: 0,
          overflow: 'hidden',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Settings</h2>
          <button className="settings-btn" onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 'var(--radius-sm)',
            border: 'none', background: 'transparent', color: 'var(--text-muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10, display: 'block' }}>Appearance</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className={`settings-btn${!isSystem && theme === 'light' ? ' active' : ''}`}
                onClick={() => setTheme('light')}
                style={{
                  flex: 1, padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)', background: 'transparent',
                  color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer',
                }}
              >
                <Sun size={14} /> Light
              </button>
              <button
                className={`settings-btn${!isSystem && theme === 'dark' ? ' active' : ''}`}
                onClick={() => setTheme('dark')}
                style={{
                  flex: 1, padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)', background: 'transparent',
                  color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer',
                }}
              >
                <Moon size={14} /> Dark
              </button>
              <button
                className={`settings-btn${isSystem ? ' active' : ''}`}
                onClick={followSystem}
                style={{
                  flex: 1, padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)', background: 'transparent',
                  color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer',
                }}
              >
                <Monitor size={14} /> System
              </button>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10, display: 'block' }}>
              <Type size={12} style={{ marginRight: 4, verticalAlign: -1 }} /> Font Size
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['small', 'medium', 'large'] as const).map(s => (
                <button
                  key={s}
                  className={`settings-btn${settings.fontSize === s ? ' active' : ''}`}
                  onClick={() => updateSetting('fontSize', s)}
                  style={{
                    flex: 1, padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)', background: 'transparent',
                    color: 'var(--text-secondary)', fontSize: s === 'small' ? 12 : s === 'medium' ? 14 : 16,
                    fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10, display: 'block' }}>Response Detail</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['standard', 'concise', 'detailed'] as const).map(m => (
                <button
                  key={m}
                  className={`settings-btn${settings.chatMode === m ? ' active' : ''}`}
                  onClick={() => updateSetting('chatMode', m)}
                  style={{
                    flex: 1, padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)', background: 'transparent',
                    color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', textTransform: 'capitalize',
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

        </div>

        {onSignOut && (
          <>
            <div style={{ borderTop: '1px solid var(--border-color)', padding: '12px 20px' }}>
              <button
                className="settings-signout"
                onClick={() => { onClose(); onSignOut(); }}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(239,68,68,0.2)', background: 'transparent',
                  color: '#EF4444', fontSize: 13, fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
