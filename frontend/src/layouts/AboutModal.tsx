import { useEffect, type ReactNode } from 'react'
import { X, Lock, MessageSquareText, Eye, EyeOff, AlertTriangle } from 'lucide-react'

interface AboutModalProps {
  open: boolean
  onClose: () => void
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 9999,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
}

const cardStyle: React.CSSProperties = {
  position: 'relative',
  width: 520,
  maxWidth: '100%',
  maxHeight: '90vh',
  overflowY: 'auto',
  background: 'var(--bg-card)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--border-color)',
  boxShadow: 'var(--shadow-lg)',
  padding: 0,
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 20px',
  borderBottom: '1px solid var(--border-color)',
  position: 'sticky',
  top: 0,
  background: 'var(--bg-card)',
  zIndex: 1,
}

const bodyStyle: React.CSSProperties = {
  padding: '20px 20px 0',
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
}

const sectionTitle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--text-primary)',
  marginBottom: 8,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
}

const paragraph: React.CSSProperties = {
  fontSize: 13,
  lineHeight: 1.8,
  color: 'var(--text-secondary)',
  margin: 0,
}

const pillarGrid: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
}

const pillarCard: React.CSSProperties = {
  padding: '12px 14px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-main)',
}

const pillarTitle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: 'var(--text-primary)',
  marginBottom: 4,
  display: 'flex',
  alignItems: 'center',
  gap: 6,
}

const pillarDesc: React.CSSProperties = {
  fontSize: 12,
  lineHeight: 1.6,
  color: 'var(--text-muted)',
  margin: 0,
}

const dosDontsGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 10,
}

const dosDontsCard: React.CSSProperties = {
  padding: '12px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-main)',
}

const dosDontsLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  marginBottom: 6,
  display: 'flex',
  alignItems: 'center',
  gap: 4,
}

const dosDontsList: React.CSSProperties = {
  fontSize: 12,
  lineHeight: 1.7,
  color: 'var(--text-secondary)',
  margin: 0,
  paddingLeft: 14,
}

const disclaimerBox: React.CSSProperties = {
  padding: '12px 14px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid rgba(239,68,68,0.15)',
  background: 'rgba(239,68,68,0.04)',
}

const disclaimerText: React.CSSProperties = {
  fontSize: 11.5,
  lineHeight: 1.7,
  color: 'var(--text-secondary)',
  margin: 0,
}

const footerBox: React.CSSProperties = {
  padding: '14px 20px',
  borderTop: '1px solid var(--border-color)',
  textAlign: 'center',
  marginTop: 20,
}

const footerText: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--text-muted)',
  lineHeight: 1.6,
  margin: 0,
}

function Pillar({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) {
  return (
    <div style={pillarCard}>
      <div style={pillarTitle}>
        {icon}
        {title}
      </div>
      <p style={pillarDesc}>{desc}</p>
    </div>
  )
}

export default function AboutModal({ open, onClose }: AboutModalProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div style={overlayStyle} onClick={onClose}>
      <style>{`
        .about-modal-card { animation: msgSlideIn 0.25s ease; }
        .about-modal-card::-webkit-scrollbar { width: 4px; }
      `}</style>
      <div className="about-modal-card" style={cardStyle} onClick={e => e.stopPropagation()}>
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/logo.svg" alt="" style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)' }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>About Xasread</span>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 'var(--radius-sm)',
              border: 'none', background: 'transparent', color: 'var(--text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'background 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-hover)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={bodyStyle}>
          <p style={paragraph}>
            <strong>Xasread</strong> is an immediate, accessible, AI-powered pre-doctor triage
            and medical record translation tool.
          </p>
          <p style={paragraph}>
            When you feel unwell or receive a medical imaging file like an X-ray, the wait time
            to see a specialist can be filled with anxiety. On top of that, trying to decipher
            complex medical jargon on your own can be incredibly intimidating. Xasread was built
            to bridge that gap — providing you with clear, calm, and structured educational
            insights about your health concerns before you step foot into the clinic.
          </p>

          <div>
            <div style={sectionTitle}>Our Core Philosophy</div>
            <div style={pillarGrid}>
              <Pillar
                icon={<MessageSquareText size={14} style={{ color: 'var(--primary)' }} />}
                title="Zero Friction"
                desc="No sign-up forms, subscription paywalls, or account creation screens. Open the app, ask your question or upload your scan, and get immediate insight."
              />
              <Pillar
                icon={<Lock size={14} style={{ color: 'var(--green-online)' }} />}
                title="Absolute Privacy"
                desc="We never save your data. Chat logs live temporarily only in your browser's local session. Once you close the tab, your history is permanently wiped."
              />
              <Pillar
                icon={<Eye size={14} style={{ color: 'var(--primary)' }} />}
                title="Clear Communication"
                desc="Medical reports are written for doctors, not patients. Our built-in language toggle lets you instantly translate dense clinical terms into straightforward, everyday language."
              />
            </div>
          </div>

          <div>
            <div style={{ ...sectionTitle, marginBottom: 4 }}>What Xasread Does (and Doesn't Do)</div>
            <p style={{ ...paragraph, fontSize: 12.5, marginBottom: 10 }}>
              To ensure your safety, it is important to understand how to best use this tool
              alongside professional medical care:
            </p>
            <div style={dosDontsGrid}>
              <div style={{ ...dosDontsCard, borderColor: 'rgba(34,197,94,0.2)' }}>
                <div style={{ ...dosDontsLabel, color: 'var(--green-online)' }}>
                  <Eye size={12} /> We Do
                </div>
                <ul style={dosDontsList}>
                  <li>Analyze your symptoms</li>
                  <li>Read structural details on uploaded diagnostic images (like X-rays)</li>
                  <li>Highlight areas of interest</li>
                  <li>Provide a basic urgency baseline</li>
                  <li>Generate highly specific questions for your doctor</li>
                </ul>
              </div>
              <div style={{ ...dosDontsCard, borderColor: 'rgba(239,68,68,0.15)' }}>
                <div style={{ ...dosDontsLabel, color: '#EF4444' }}>
                  <EyeOff size={12} /> We Don't
                </div>
                <ul style={dosDontsList}>
                  <li>Provide an official medical diagnosis</li>
                  <li>Prescribe medications</li>
                  <li>Replace a human healthcare provider</li>
                  <li>Store your medical records</li>
                  <li>Track your identity</li>
                </ul>
              </div>
            </div>
          </div>

          <div style={disclaimerBox}>
            <div style={{ ...sectionTitle, marginBottom: 6, color: '#EF4444', fontSize: 12 }}>
              <AlertTriangle size={14} /> Official Medical Disclaimer
            </div>
            <p style={disclaimerText}>
              Xasread is an <strong>educational decision-support platform</strong> designed to help
              you prepare for clinical consultations. The assessments, visual mappings, and triage
              recommendations generated by this AI are not definitive medical diagnoses.
              <br /><br />
              <strong>Always consult a licensed physician</strong> or qualified healthcare professional
              regarding any medical condition or treatment plan. If you are experiencing a
              life-threatening medical emergency, please contact your local emergency services immediately.
            </p>
          </div>
        </div>

        <div style={footerBox}>
          <p style={footerText}>
            A solo project by <strong style={{ color: 'var(--text-primary)' }}>xasdev05@gmail.com</strong>
            <br />
            Email your concerns so I can take quick action
          </p>
        </div>
      </div>
    </div>
  )
}
