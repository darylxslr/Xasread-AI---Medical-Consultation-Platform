import { Shield, ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { useMediaQuery } from '../../hooks/useMediaQuery'

interface LandingPageProps {
  onContinueAsGuest: (name: string) => void
}

const s = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-main)',
    padding: '24px',
  } as const,
  card: {
    background: 'var(--bg-card)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-color)',
    boxShadow: 'var(--shadow-lg)',
    padding: '48px 40px 36px',
    maxWidth: 420,
    width: '100%',
    textAlign: 'center' as const,
  } as const,
  logo: {
    width: 56,
    height: 56,
    borderRadius: 'var(--radius-md)',
    background: 'linear-gradient(135deg, #D4782F 0%, #E8954F 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: 24,
    fontWeight: 700,
    margin: '0 auto 16px',
    boxShadow: '0 8px 32px rgba(212, 120, 47, 0.2)',
  } as const,
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: 'var(--text-primary)',
    letterSpacing: '-0.5px',
    marginBottom: 4,
  } as const,
  titleMobile: {
    fontSize: 24,
    fontWeight: 700,
    color: 'var(--text-primary)',
    letterSpacing: '-0.5px',
    marginBottom: 4,
  } as const,
  subtitle: {
    fontSize: 15,
    color: 'var(--text-muted)',
    fontWeight: 500,
    marginBottom: 28,
  } as const,
  subtitleMobile: {
    fontSize: 14,
    color: 'var(--text-muted)',
    fontWeight: 500,
    marginBottom: 24,
  } as const,
  desc: {
    fontSize: 13,
    lineHeight: 1.7,
    color: 'var(--text-secondary)',
    marginBottom: 12,
  } as const,
  divider: {
    height: 1,
    background: 'var(--border-color)',
    margin: '24px 0',
  } as const,
  googleBtn: {
    width: '100%',
    padding: '12px 20px',
    borderRadius: 'var(--radius-pill)',
    border: '1px solid var(--border-color)',
    background: '#FFFFFF',
    color: '#1F1F1F',
    fontSize: 14,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: 'var(--shadow-sm)',
  } as const,
  guestBtn: {
    width: '100%',
    padding: '12px 20px',
    borderRadius: 'var(--radius-pill)',
    border: '1px solid var(--border-color)',
    background: 'transparent',
    color: 'var(--text-muted)',
    fontSize: 14,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
  } as const,
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 24,
    fontSize: 11,
    color: 'var(--text-muted)',
  } as const,
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

export default function LandingPage({ onContinueAsGuest }: LandingPageProps) {
  const isMobile = useMediaQuery('(max-width: 639px)')
  const [showNameInput, setShowNameInput] = useState(false)
  const [guestName, setGuestName] = useState('')
  const handleGoogleSignIn = () => {
    window.location.href = '/auth/google'
  }

  const cardStyle = { ...s.card, padding: isMobile ? '32px 20px 28px' : '48px 40px 36px' }

  const handleStartGuest = () => {
    const name = guestName.trim()
    if (name) onContinueAsGuest(name)
  }

  return (
    <div style={s.wrapper}>
      <style>{`
        .landing-google-btn:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important; border-color: #d0d0d0 !important; }
        .landing-guest-btn:hover { border-color: var(--primary) !important; color: var(--primary) !important; background: var(--primary-light) !important; }
        .landing-input:focus { border-color: var(--primary) !important; box-shadow: 0 0 0 3px rgba(212,120,47,0.15) !important; outline: none !important; }
        .landing-start-btn:hover { opacity: 0.9 !important; }
      `}</style>
      <div style={cardStyle}>
        <img src="/logo.svg" alt="Xasread" style={{ width: isMobile ? 48 : 56, height: isMobile ? 48 : 56, borderRadius: 'var(--radius-md)' }} />
        <h1 style={isMobile ? s.titleMobile : s.title}>Xasread</h1>
        <p style={isMobile ? s.subtitleMobile : s.subtitle}>AI Medical Consultation</p>

        {showNameInput ? (
          <>
            <button
              onClick={() => { setShowNameInput(false); setGuestName('') }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: 0, marginBottom: 16,
              }}
            >
              <ArrowLeft size={16} /> Back
            </button>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, textAlign: 'left' as const }}>
              Enter a name to identify your guest session. Different names keep data separate.
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, textAlign: 'left' as const }}>
              Note: Guest data is temporary. Closing this tab will clear your session.
            </p>
            <input
              className="landing-input"
              type="text"
              placeholder="Enter your name"
              value={guestName}
              onChange={e => setGuestName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleStartGuest() }}
              autoFocus
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 'var(--radius-pill)',
                border: '1px solid var(--border-color)', background: 'var(--bg-main)',
                color: 'var(--text-primary)', fontSize: 14, boxSizing: 'border-box',
                transition: 'border-color 0.2s, box-shadow 0.2s', marginBottom: 12,
              }}
            />
            <button
              className="landing-start-btn"
              onClick={handleStartGuest}
              disabled={!guestName.trim()}
              style={{
                width: '100%', padding: '12px 20px', borderRadius: 'var(--radius-pill)',
                border: 'none', background: guestName.trim() ? 'linear-gradient(135deg, #D4782F 0%, #E8954F 100%)' : 'var(--border-color)',
                color: guestName.trim() ? '#fff' : 'var(--text-muted)', fontSize: 14, fontWeight: 600,
                cursor: guestName.trim() ? 'pointer' : 'not-allowed', transition: 'all 0.2s',
              }}
            >
              Start
            </button>
          </>
        ) : (
          <>
            <p style={s.desc}>
              Xasread is an AI-powered medical assistant that helps you understand symptoms, 
              review medical images and lab results, and get clear, actionable health insights.
            </p>
            <p style={{ ...s.desc, marginBottom: 0 }}>
              Built for patients, caregivers, and healthcare professionals who want fast, 
              reliable AI-assisted analysis — always private and HIPAA-compliant.
            </p>

            <div style={s.divider} />

            <button
              className="landing-google-btn"
              style={s.googleBtn}
              onClick={handleGoogleSignIn}
            >
              <GoogleIcon />
              Continue with Google
            </button>

            <div style={{ marginTop: 12 }}>
              <button
                className="landing-guest-btn"
                style={s.guestBtn}
                onClick={() => setShowNameInput(true)}
              >
                Continue as Guest
              </button>
            </div>
          </>
        )}

        <div style={s.footer}>
          <Shield size={12} />
          HIPAA-Safe · End-to-end encrypted
        </div>
      </div>
    </div>
  )
}
