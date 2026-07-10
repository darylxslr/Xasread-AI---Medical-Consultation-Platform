import { memo } from 'react'
import { Paperclip } from 'lucide-react'
import type { Message } from '../../types'
import { formatTimestamp } from '../../lib/formatTimestamp'

interface UserMessageProps {
  message: Message
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
}

function UserMessage({ message }: UserMessageProps) {
  const fileName = message.fileName || message.image?.fileName

  return (
    <div className="user-msg-wrapper msg-enter" style={s.wrapper}>
      <div style={s.container}>
        <div style={s.bubble}>
          {message.content}
          {fileName && (
            <div style={s.fileChip}>
              <Paperclip size={12} />
              {fileName}
            </div>
          )}
        </div>
        <div style={s.time}>{formatTimestamp(message.created_at)}</div>
      </div>
    </div>
  )
}

export default memo(UserMessage)

