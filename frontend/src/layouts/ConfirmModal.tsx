import { useMediaQuery } from '../hooks/useMediaQuery'

interface ConfirmModalProps {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  danger = true,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const isMobile = useMediaQuery('(max-width: 639px)')
  return (
    <>
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 999,
          background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        onClick={onCancel}
      >
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--modal-padding)',
            width: 'var(--modal-width)',
            maxWidth: isMobile ? 400 : '90vw',
            boxShadow: '0 16px 48px rgba(0,0,0,0.2)',
          }}
          onClick={e => e.stopPropagation()}
        >
          <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
            {title}
          </h3>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {message}
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
            <button
              onClick={onCancel}
              style={{
                padding: isMobile ? '8px 14px' : '8px 18px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                background: 'transparent',
                color: 'var(--text-primary)',
                fontSize: isMobile ? 12 : 13, fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              style={{
                padding: isMobile ? '8px 14px' : '8px 18px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: danger ? '#DC2626' : 'var(--primary)',
                color: '#fff',
                fontSize: isMobile ? 12 : 13, fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}