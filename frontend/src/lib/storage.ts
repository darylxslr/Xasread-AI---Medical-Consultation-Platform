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

export function saveSettings(settings: Record<string, any>): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    window.dispatchEvent(new CustomEvent('xasread-settings-changed'))
  } catch { /* ignore */ }
}

export function applyFontSize(): void {
  try {
    const { fontSize } = getSettings()
    const map: Record<string, number> = { small: 13, medium: 14, large: 16 }
    document.documentElement.style.setProperty('--chat-font-size', `${map[fontSize] || 14}px`)
  } catch { /* ignore */ }
}

export function getToken(): string | null {
  try {
    return localStorage.getItem('xasread-token')
  } catch {
    return null
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem('xasread-token', token)
    else localStorage.removeItem('xasread-token')
  } catch { /* ignore */ }
}

export function getGuestFlag(): boolean {
  try {
    return localStorage.getItem('xasread-guest') === 'true'
  } catch {
    return false
  }
}

export function setGuestFlag(guest: boolean): void {
  try {
    if (guest) localStorage.setItem('xasread-guest', 'true')
    else localStorage.removeItem('xasread-guest')
  } catch { /* ignore */ }
}

export function clearAuth(): void {
  try {
    localStorage.removeItem('xasread-token')
    localStorage.removeItem('xasread-guest')
  } catch { /* ignore */ }
}