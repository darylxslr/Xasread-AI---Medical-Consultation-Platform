export interface Finding {
  id: string
  label: string
  confidence: number
  color: 'orange' | 'blue' | 'green'
  x: number
  y: number
  w: number
  h: number
}

export interface ImageData {
  fileName: string
  findings?: Finding[]
}

export interface ICD10Code {
  code: string
  description: string
}

export interface Severity {
  label: string
  value: number
  color: string
}

export interface DifferentialDiagnosis {
  condition: string
  likelihood: string
}

export interface Vital {
  label: string
  value: string
  status?: string
}

export interface ClinicalData {
  icd10: ICD10Code[]
  severity: Severity
  differentialDiagnoses: DifferentialDiagnosis[]
  vitals: Vital[]
  assessment: string
  recommendation: string
}

export interface AlertItem {
  type: string
  text: string
}

export interface SimpleData {
  explanation: string
  alerts: AlertItem[]
  nextSteps: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  content_plain?: string
  content_standard?: string
  content_clinical?: string
  created_at?: string
  fileName?: string
  image?: ImageData
  findings?: Finding[]
  clinical?: ClinicalData
  simple?: SimpleData
  rephraseVersion?: number
}

export interface Conversation {
  id: string
  title: string
  timestamp: string
  messages: Message[]
}

export type Theme = 'light' | 'dark'

export interface ThemeContextType {
  theme: Theme
  setTheme: (t: Theme) => void
  toggleTheme: () => void
  systemPref: Theme
  followSystem: () => void
  isSystem: boolean
}

export interface AppSettings {
  fontSize: 'small' | 'medium' | 'large'
  chatMode: 'plain' | 'standard' | 'clinical'
}

export interface UserOut {
  id: string
  email: string
  name: string
  avatar_url?: string
  created_at?: string
}
