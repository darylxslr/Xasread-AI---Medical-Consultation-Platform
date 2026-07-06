import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { Theme, ThemeContextType } from '../types'

function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getInitialTheme(): Theme {
  const saved = localStorage.getItem('xasread-theme') as Theme | null
  if (saved === 'light' || saved === 'dark') return saved
  return getSystemTheme()
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme)
  const [systemPref, setSystemPref] = useState<Theme>(getSystemTheme())

  const setTheme = (t: Theme) => {
    setThemeState(t)
    localStorage.setItem('xasread-theme', t)
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      setSystemPref(e.matches ? 'dark' : 'light')
      const saved = localStorage.getItem('xasread-theme') as Theme | null
      if (!saved) {
        setThemeState(e.matches ? 'dark' : 'light')
      }
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const toggleTheme = () => setThemeState(t => t === 'light' ? 'dark' : 'light')

  const followSystem = () => {
    localStorage.removeItem('xasread-theme')
    setThemeState(systemPref)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, systemPref, followSystem, isSystem: !localStorage.getItem('xasread-theme') }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = (): ThemeContextType => {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
