import { useState, useMemo } from 'react'
import { useMediaQuery } from '../hooks/useMediaQuery'

const prefixes = ["Last visit:", "Previous:", "Your last consultation:"]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

interface FreshBannerProps {
  lastConvTitle: string | null
  onSend: (text: string) => void
}

function generalSuggestions(lastTitle: string | null): string[] {
  if (lastTitle && lastTitle !== 'New Consultation') {
    return [
      `Follow-up: ${lastTitle}`,
      "I have a headache",
      "I have a fever and cough",
      "I need a general check-up",
    ]
  }
  return [
    "I have a headache",
    "I have a fever and cough",
    "I have stomach pain",
    "I need a general check-up",
  ]
}

export default function FreshBanner({ lastConvTitle, onSend }: FreshBannerProps) {
  const isMobile = useMediaQuery('(max-width: 639px)')
  const [prefix] = useState(() => pick(prefixes))
  const suggestions = useMemo(() => generalSuggestions(lastConvTitle), [lastConvTitle])

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '0 16px' : '0 32px',
      textAlign: 'center',
    }}>
      <p style={{ fontSize: isMobile ? 15 : 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
        How can I help you today?
      </p>
      {lastConvTitle && lastConvTitle !== 'New Consultation' && (
        <p style={{ fontSize: isMobile ? 12 : 13, color: 'var(--text-muted)', marginBottom: isMobile ? 12 : 16 }}>
          {prefix} {lastConvTitle}
        </p>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: isMobile ? 6 : 8, justifyContent: 'center', marginTop: 12 }}>
        {suggestions.map(s => (
          <button
            key={s}
            onClick={() => onSend(s)}
            style={{
              padding: isMobile ? '6px 14px' : '8px 18px',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              fontSize: isMobile ? 12 : 13, fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--primary)'; (e.currentTarget as HTMLButtonElement).style.background = 'var(--primary-light)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-color)'; (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-card)' }}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}