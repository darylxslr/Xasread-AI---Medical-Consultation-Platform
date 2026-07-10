const SETTINGS_KEY = 'xasread-settings'

export function getSettings(): Record<string, any> {
  try {
    const s = localStorage.getItem(SETTINGS_KEY)
    return s ? JSON.parse(s) : {}
  } catch {
    return {}
  }
}

export function getChatMode(): string {
  return getSettings().chatMode || 'standard'
}

export function applyFontSize(): void {
  try {
    const { fontSize } = getSettings()
    const map: Record<string, number> = { small: 13, medium: 14, large: 16 }
    document.documentElement.style.setProperty('--chat-font-size', `${map[fontSize] || 14}px`)
  } catch { /* ignore */ }
}