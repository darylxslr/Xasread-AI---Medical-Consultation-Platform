import { useState } from 'react'
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import type { ImageData, Finding } from '../../types'

const FINDING_COLORS: Record<string, { stroke: string; fill: string; hoverFill: string; labelBg: string }> = {
  orange: { stroke: '#F97316', fill: 'rgba(249, 115, 22, 0.12)', hoverFill: 'rgba(249, 115, 22, 0.28)', labelBg: '#F97316' },
  blue: { stroke: '#3B82F6', fill: 'rgba(59, 130, 246, 0.12)', hoverFill: 'rgba(59, 130, 246, 0.28)', labelBg: '#3B82F6' },
  green: { stroke: '#22C55E', fill: 'rgba(34, 197, 94, 0.12)', hoverFill: 'rgba(34, 197, 94, 0.28)', labelBg: '#22C55E' },
}

const s = {
  container: {
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    background: 'var(--viewer-bg)',
    border: '1px solid var(--viewer-border)',
    marginBottom: 16,
  } as const,
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 14px',
    background: 'rgba(255,255,255,0.03)',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  } as const,
  toolbarLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  } as const,
  toolbarActions: {
    display: 'flex',
    gap: 4,
  } as const,
  iconBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    border: 'none',
    background: 'rgba(255,255,255,0.06)',
    color: 'rgba(255,255,255,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  } as const,
  viewport: {
    position: 'relative',
    width: '100%',
    paddingTop: '75%',
    overflow: 'hidden',
    cursor: 'crosshair',
  } as const,
  imageContainer: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as const,
  viewportInfo: {
    position: 'absolute',
    bottom: 8,
    right: 10,
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: 'rgba(255,255,255,0.3)',
    pointerEvents: 'none',
  } as const,
}

function CornerBrackets({ x, y, w, h, color, isHovered }: {
  x: number; y: number; w: number; h: number; color: string; isHovered: boolean
}) {
  const c = FINDING_COLORS[color]
  const len = 10
  const strokeW = 2.5
  const strokeColor = isHovered ? '#fff' : c.stroke

  return (
    <g>
      <rect
        x={`${x}%`}
        y={`${y}%`}
        width={`${w}%`}
        height={`${h}%`}
        fill={isHovered ? c.hoverFill : c.fill}
        stroke={c.stroke}
        strokeWidth={isHovered ? 2 : 1.5}
        strokeOpacity={isHovered ? 1 : 0.8}
        rx={4}
        style={{ transition: 'all 0.2s' }}
      />
      <path d={`M ${x}% ${y + len}% L ${x}% ${y}% L ${x + len}% ${y}%`}
        fill="none" stroke={strokeColor} strokeWidth={strokeW} strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M ${x + w - len}% ${y}% L ${x + w}% ${y}% L ${x + w}% ${y + len}%`}
        fill="none" stroke={strokeColor} strokeWidth={strokeW} strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M ${x}% ${y + h - len}% L ${x}% ${y + h}% L ${x + len}% ${y + h}%`}
        fill="none" stroke={strokeColor} strokeWidth={strokeW} strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M ${x + w - len}% ${y + h}% L ${x + w}% ${y + h}% L ${x + w}% ${y + h - len}%`}
        fill="none" stroke={strokeColor} strokeWidth={strokeW} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  )
}

function FindingBox({ finding, active = false }: { finding: Finding; active?: boolean }) {
  const [hovered, setHovered] = useState(false)
  const color = FINDING_COLORS[finding.color]
  const cx = finding.x + finding.w / 2
  const cy = finding.y - 4.5
  const isActive = active || hovered

  return (
    <g
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: 'pointer' }}
    >
      <CornerBrackets x={finding.x} y={finding.y} w={finding.w} h={finding.h} color={finding.color} isHovered={isActive} />
      {isActive && (
        <rect
          x={`${finding.x}%`}
          y={`${finding.y}%`}
          width={`${finding.w}%`}
          height={`${finding.h}%`}
          fill={color.hoverFill}
          stroke={color.stroke}
          strokeWidth={active ? 3 : 2}
          rx={4}
        />
      )}
      <foreignObject x={`${cx - 6}%`} y={`${cy}%`} width="12%" height="20" style={{ overflow: 'visible' }}>
        <div
          style={{
            background: isActive ? '#fff' : color.labelBg,
            padding: '2px 8px',
            borderRadius: 6,
            fontSize: 10,
            fontWeight: 600,
            color: isActive ? '#000' : '#fff',
            fontFamily: 'var(--font-mono)',
            textAlign: 'center',
            whiteSpace: 'nowrap',
            boxShadow: isActive ? '0 2px 12px rgba(255,255,255,0.5)' : '0 2px 6px rgba(0,0,0,0.4)',
            display: 'inline-block',
            marginLeft: '-50%',
            transition: 'all 0.15s',
          }}
        >
          {finding.label} · {finding.confidence}%
        </div>
      </foreignObject>
    </g>
  )
}

interface MedicalImageViewerProps {
  image: ImageData
  activeFindingId?: string | null
  onFindingClick?: (id: string) => void
}

export default function MedicalImageViewer({ image, activeFindingId, onFindingClick }: MedicalImageViewerProps) {
  const [zoom, setZoom] = useState(1)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const findings = image.findings || []

  const handleFindingHover = (id: string | null) => {
    setHoveredId(id)
  }

  return (
    <div style={s.container}>
      <div style={s.toolbar}>
        <span style={s.toolbarLabel}>{image.fileName.toUpperCase()}</span>
        <div style={s.toolbarActions}>
          <button style={s.iconBtn} onClick={() => setZoom(z => Math.min(z + 0.2, 3))}>
            <ZoomIn size={14} />
          </button>
          <button style={s.iconBtn} onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))}>
            <ZoomOut size={14} />
          </button>
          <button style={s.iconBtn} onClick={() => setZoom(1)}>
            <Maximize2 size={13} />
          </button>
        </div>
      </div>
      <div style={s.viewport}>
        <div style={{
          ...s.imageContainer,
          transform: `scale(${zoom})`,
          transition: 'transform 0.2s',
        }}>
          <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
            <defs>
              <radialGradient id="imgGrad" cx="50%" cy="50%" r="50%">
                <stop offset="20%" stopColor="#1a1a2e" />
                <stop offset="50%" stopColor="#16213e" />
                <stop offset="80%" stopColor="#0f0f23" />
                <stop offset="100%" stopColor="#0a0a0a" />
              </radialGradient>
            </defs>
            <rect width="100" height="100" fill="url(#imgGrad)" />
            {findings.length === 0 && (
              <foreignObject x="25%" y="40%" width="50%" height="20%">
                <div style={{
                  color: 'rgba(255,255,255,0.3)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  textAlign: 'center',
                }}>
                  No marked findings
                </div>
              </foreignObject>
            )}
            {findings.map(f => {
    const isActive = activeFindingId === f.id
    const isHovered = hoveredId === f.id
    return (
      <g
        key={f.id}
        onMouseEnter={() => handleFindingHover(f.id)}
        onMouseLeave={() => handleFindingHover(null)}
        onClick={() => onFindingClick?.(f.id)}
        style={{ cursor: onFindingClick ? 'pointer' : 'default' }}
      >
        <FindingBox finding={f} active={isActive || isHovered} />
      </g>
    )
  })}
          </svg>
        </div>
        <div style={s.viewportInfo}>
          {findings.length > 0 ? `${findings.length} findings · confidence >85%` : 'No annotations'}
        </div>
      </div>
    </div>
  )
}
