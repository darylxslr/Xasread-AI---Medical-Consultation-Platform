export default function TypingIndicator() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      padding: '12px 16px',
      margin: '8px 0',
    }}>
      <span style={dotStyle(0)} />
      <span style={dotStyle(0.15)} />
      <span style={dotStyle(0.3)} />
      <span style={{
        marginLeft: 8,
        fontSize: 12,
        color: 'var(--text-muted)',
      }}>
        AI is thinking
      </span>
    </div>
  )
}

function dotStyle(delay: number): React.CSSProperties {
  return {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: 'var(--text-muted)',
    display: 'inline-block',
    animation: `typingBounce 1.4s ${delay}s ease-in-out infinite`,
  }
}
