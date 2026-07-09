import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

interface GuestExpiryBannerProps {
  expiresAt: string
}

function computeRemaining(expiresAt: string): { hours: number; minutes: number; total: number } | null {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return null
  return {
    hours: Math.floor(diff / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    total: diff,
  }
}

export default function GuestExpiryBanner({ expiresAt }: GuestExpiryBannerProps) {
  const [remaining, setRemaining] = useState(() => computeRemaining(expiresAt))

  useEffect(() => {
    const tick = () => setRemaining(computeRemaining(expiresAt))
    tick()
    const id = setInterval(tick, 60000)
    return () => clearInterval(id)
  }, [expiresAt])

  if (!remaining) return null

  return (
    <div
      style={{
        padding: '6px 16px',
        fontSize: 11,
        color: 'var(--text-muted)',
        borderTop: '1px solid var(--border-color)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
        <Clock size={11} />
        <span>Guest session: <strong>{remaining.hours}h {remaining.minutes}m</strong></span>
      </div>
      <div style={{ paddingLeft: 17, fontSize: 10, lineHeight: 1.4 }}>
        Sign in with Google for permanent storage
      </div>
    </div>
  )
}
