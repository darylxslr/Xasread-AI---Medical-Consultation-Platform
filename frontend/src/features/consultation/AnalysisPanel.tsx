import { useState } from 'react'
import { AlertTriangle, Droplets, Heart, Stethoscope, FileText, Info, Thermometer, Activity, Brain } from 'lucide-react'
import type { ClinicalData, SimpleData, AlertItem } from '../../types'

const iconMap: Record<string, typeof Activity> = {
  lungs: Stethoscope,
  heart: Heart,
  brain: Brain,
  thermometer: Thermometer,
  activity: Activity,
  droplets: Droplets,
}

const s = {
  panel: {
    background: 'var(--bg-card)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-color)',
    overflow: 'hidden',
  } as const,
  toggleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderBottom: '1px solid var(--border-color)',
  } as const,
  toggleGroup: {
    display: 'flex',
    background: 'var(--bg-main)',
    borderRadius: 'var(--radius-pill)',
    padding: 3,
  } as const,
  toggleBtn: (active: boolean) => ({
    padding: '6px 16px',
    borderRadius: 'var(--radius-pill)',
    border: 'none',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer' as const,
    background: active ? 'var(--bg-card)' : 'transparent',
    color: active ? 'var(--text-primary)' : 'var(--text-muted)',
    boxShadow: active ? 'var(--shadow-sm)' : 'none',
    transition: 'all 0.2s',
  }),
  label: {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  } as const,
  body: {
    padding: 20,
  } as const,
  section: {
    marginBottom: 20,
  } as const,
  sectionTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: 10,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  } as const,
  icdCard: {
    padding: '10px 14px',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--bg-main)',
    marginBottom: 6,
    borderLeft: '3px solid var(--primary)',
  } as const,
  icdCode: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--primary)',
  } as const,
  icdDesc: {
    fontSize: 'var(--chat-font-size, 14px)',
    color: 'var(--text-secondary)',
    marginTop: 2,
  } as const,
  severityBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    background: 'var(--bg-main)',
    overflow: 'hidden',
    marginTop: 6,
  } as const,
  severityFill: (width: number, _color: string) => ({
    height: '100%',
    width: `${width}%`,
    borderRadius: 4,
    background: 'linear-gradient(90deg, #22C55E, #F59E0B 50%, #EF4444)',
    transition: 'width 0.6s ease',
  }),
  severityLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 12,
    color: 'var(--text-muted)',
    marginTop: 4,
  } as const,
  diffCard: (likelihood: string) => {
    let borderColor = 'var(--text-muted)'
    if (likelihood === 'High' || likelihood === 'Confirmed') borderColor = '#EF4444'
    else if (likelihood === 'Moderate') borderColor = '#F59E0B'
    else if (likelihood === 'Low' || likelihood === 'Low-Moderate') borderColor = '#22C55E'
    return {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 14px',
      borderRadius: 'var(--radius-sm)',
      background: 'var(--bg-main)',
      marginBottom: 6,
      borderLeft: `3px solid ${borderColor}`,
    }
  },
  diffName: {
    fontSize: 'var(--chat-font-size, 14px)',
    color: 'var(--text-secondary)',
  } as const,
  diffBadge: (likelihood: string) => {
    let bg = 'var(--bg-main)'
    let fg = 'var(--text-muted)'
    if (likelihood === 'High' || likelihood === 'Confirmed') { bg = 'rgba(239, 68, 68, 0.1)'; fg = '#EF4444' }
    else if (likelihood === 'Moderate') { bg = 'rgba(245, 158, 11, 0.1)'; fg = '#F59E0B' }
    else if (likelihood === 'Low' || likelihood === 'Low-Moderate') { bg = 'rgba(34, 197, 94, 0.1)'; fg = '#22C55E' }
    return {
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      fontWeight: 600,
      padding: '2px 8px',
      borderRadius: 'var(--radius-pill)',
      background: bg,
      color: fg,
    }
  },
  metricRow: {
    display: 'flex',
    gap: 12,
    marginBottom: 12,
    flexWrap: 'wrap' as const,
  } as const,
  metricCard: {
    flex: '1 0 calc(50% - 6px)',
    padding: '12px 14px',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--bg-main)',
    minWidth: 120,
  } as const,
  metricValue: {
    fontFamily: 'var(--font-mono)',
    fontSize: 18,
    fontWeight: 600,
    color: 'var(--text-primary)',
  } as const,
  metricLabel: {
    fontSize: 11,
    color: 'var(--text-muted)',
    marginTop: 2,
  } as const,
  note: {
    fontSize: 'var(--chat-font-size, 14px)',
    lineHeight: 1.6,
    color: 'var(--text-secondary)',
    padding: '10px 14px',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--bg-main)',
    borderLeft: '3px solid var(--blue-box)',
  } as const,
  recCard: {
    padding: '14px 16px',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--primary-light)',
    borderLeft: '3px solid var(--primary)',
    fontSize: 'var(--chat-font-size, 14px)',
    lineHeight: 1.6,
    color: 'var(--text-secondary)',
    transition: 'all 0.2s',
  } as const,
  simpleCard: {
    padding: '14px 16px',
    borderRadius: 'var(--radius-md)',
    background: 'var(--bg-main)',
    marginBottom: 12,
    fontSize: 'var(--chat-font-size, 14px)',
    lineHeight: 1.7,
    color: 'var(--text-secondary)',
  } as const,
  alertItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    padding: '10px 14px',
    borderRadius: 'var(--radius-sm)',
    background: 'rgba(249, 115, 22, 0.08)',
    marginBottom: 8,
    borderLeft: '3px solid #F97316',
  } as const,
  alertIcon: {
    marginTop: 1,
    flexShrink: 0,
    color: '#F97316',
  } as const,
  alertText: {
    fontSize: 'var(--chat-font-size, 14px)',
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
  } as const,
  warningCard: {
    padding: '14px 16px',
    borderRadius: 'var(--radius-md)',
    background: 'rgba(239, 68, 68, 0.06)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    display: 'flex',
    gap: 10,
    alignItems: 'flex-start',
  } as const,
  warningIcon: {
    color: '#EF4444',
    flexShrink: 0,
    marginTop: 1,
  } as const,
  warningText: {
    fontSize: 'var(--chat-font-size, 14px)',
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
  } as const,
  warningTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: '#EF4444',
    marginBottom: 4,
  } as const,
  statusText: (status?: string) => {
    if (!status) return {}
    const color = status === 'Elevated' || status === 'Blunted (L)' ? '#F59E0B' : status === 'Borderline' ? '#F97316' : 'var(--text-muted)'
    return { fontFamily: 'var(--font-mono)', fontSize: 11, color, marginTop: 1 }
  },
}

function ClinicalView({ clinical }: { clinical: ClinicalData }) {
  return (
    <div>
      <div style={s.section}>
        <div style={s.sectionTitle}><FileText size={14} /> ICD-10 Codes</div>
        {clinical.icd10.map((icd, i) => (
          <div key={i} style={s.icdCard}>
            <div style={s.icdCode}>{icd.code}</div>
            <div style={s.icdDesc}>{icd.description}</div>
          </div>
        ))}
      </div>

      <div style={s.section}>
        <div style={s.sectionTitle}><AlertTriangle size={14} /> Severity Assessment</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: clinical.severity.color, marginBottom: 2 }}>
          {clinical.severity.label}
        </div>
        <div style={s.severityBar}>
          <div style={s.severityFill(clinical.severity.value, clinical.severity.color)} />
        </div>
        <div style={s.severityLabel}>
          <span>Minimal</span>
          <span>Severe</span>
        </div>
      </div>

      <div style={s.section}>
        <div style={s.sectionTitle}><Activity size={14} /> Differential Diagnoses</div>
        {clinical.differentialDiagnoses.map((dd, i) => (
          <div key={i} style={s.diffCard(dd.likelihood)}>
            <span style={s.diffName}>{dd.condition}</span>
            <span style={s.diffBadge(dd.likelihood)}>{dd.likelihood}</span>
          </div>
        ))}
      </div>

      <div style={s.section}>
        <div style={s.sectionTitle}><Heart size={14} /> Vitals Summary</div>
        <div style={s.metricRow}>
          {clinical.vitals.map((v, i) => (
            <div key={i} style={s.metricCard}>
              <div style={s.metricValue}>{v.value}</div>
              <div style={s.metricLabel}>{v.label}</div>
              {v.status && <div style={s.statusText(v.status)}>{v.status}</div>}
            </div>
          ))}
        </div>
      </div>

      <div style={s.section}>
        <div style={s.sectionTitle}><Stethoscope size={14} /> Clinical Assessment</div>
        <div style={s.note}>{clinical.assessment}</div>
      </div>

      <div style={s.section}>
        <div style={s.sectionTitle}><Info size={14} /> Recommendation</div>
        <div className="analysis-rec-card" style={s.recCard}>{clinical.recommendation}</div>
      </div>
    </div>
  )
}

function AlertRow({ alert }: { alert: AlertItem }) {
  const Icon = iconMap[alert.type] || AlertTriangle
  return (
    <div style={s.alertItem}>
      <div style={s.alertIcon}><Icon size={16} /></div>
      <div style={s.alertText}>{alert.text}</div>
    </div>
  )
}

function SimpleView({ simple }: { simple: SimpleData }) {
  return (
    <div>
      <div style={s.section}>
        <div style={s.sectionTitle}><Info size={14} /> Summary</div>
        <div style={s.simpleCard}>{simple.explanation}</div>
      </div>

      <div style={s.section}>
        <div style={s.sectionTitle}><AlertTriangle size={14} /> Key Findings</div>
        {simple.alerts.map((alert, i) => (
          <AlertRow key={i} alert={alert} />
        ))}
      </div>

      <div style={s.section}>
        <div style={s.warningCard}>
          <div style={s.warningIcon}><AlertTriangle size={18} /></div>
          <div>
            <div style={s.warningTitle}>Recommended Next Steps</div>
            <div style={s.warningText}>{simple.nextSteps}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface AnalysisPanelProps {
  clinical: ClinicalData
  simple: SimpleData
}

export default function AnalysisPanel({ clinical, simple }: AnalysisPanelProps) {
  const [mode, setMode] = useState<'clinical' | 'simple'>('clinical')

  return (
    <div style={s.panel}>
      <style>{`
        .analysis-toggle-btn:hover { opacity: 0.85 !important; }
        .analysis-rec-card { transition: all 0.2s !important; }
        .analysis-rec-card:hover { box-shadow: var(--shadow-sm) !important; }
      `}</style>
      <div style={s.toggleRow}>
        <span style={s.label}>Analysis Mode</span>
        <div style={s.toggleGroup}>
          <button className="analysis-toggle-btn" style={s.toggleBtn(mode === 'simple')} onClick={() => setMode('simple')}>
            Simple
          </button>
          <button className="analysis-toggle-btn" style={s.toggleBtn(mode === 'clinical')} onClick={() => setMode('clinical')}>
            Clinical
          </button>
        </div>
      </div>
      <div style={s.body}>
        {mode === 'clinical' ? <ClinicalView clinical={clinical} /> : <SimpleView simple={simple} />}
      </div>
    </div>
  )
}
