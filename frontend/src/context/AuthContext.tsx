import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import type { UserOut } from '../types'

export interface AuthContextType {
  user: UserOut | null
  token: string | null
  isGuest: boolean
  guestUsername: string | null
  guestToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  signIn: (token: string) => void
  continueAsGuest: (name: string) => void
  signOut: () => void
  getStoredGuestName: () => string | null
  resumeGuestSession: () => void
  endGuestSession: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function hasStoredGuest(): boolean {
  if (localStorage.getItem('xasread-guest') !== 'true') return false
  return !!localStorage.getItem('xasread-guest-user') && !!localStorage.getItem('xasread-guest-token')
}

export function isGuestSessionExpired(): boolean {
  const createdAt = localStorage.getItem('xasread-guest-created-at')
  if (!createdAt) return true
  return Date.now() - Number(createdAt) > 24 * 60 * 60 * 1000
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserOut | null>(null)
  const [token, setToken] = useState<string | null>(() => {
    const mode = sessionStorage.getItem('xasread-auth-mode')
    if (mode === 'guest') return null
    return localStorage.getItem('xasread-token') || null
  })

  const guestValid = useRef<boolean | null>(null)
  if (guestValid.current === null) {
    guestValid.current = hasStoredGuest()
  }

  const [isGuest, setIsGuest] = useState(() => {
    if (guestValid.current) {
      sessionStorage.setItem('xasread-auth-mode', 'guest')
      return true
    }
    sessionStorage.removeItem('xasread-auth-mode')
    return false
  })
  const [guestUsername, setGuestUsername] = useState<string | null>(() => {
    if (!guestValid.current) return null
    return localStorage.getItem('xasread-guest-user')
  })
  const [guestToken, setGuestToken] = useState<string | null>(() => {
    if (!guestValid.current) return null
    return localStorage.getItem('xasread-guest-token')
  })
  const [isLoading, setIsLoading] = useState(() => {
    const mode = sessionStorage.getItem('xasread-auth-mode')
    if (mode === 'google') return true
    if (guestValid.current) return false
    return !!localStorage.getItem('xasread-token')
  })

  useEffect(() => {
    if (!token) {
      setIsLoading(false)
      return
    }

    fetch('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        if (data.is_authenticated && data.user) {
          setUser(data.user)
          setIsGuest(false)
          localStorage.removeItem('xasread-guest')
        } else {
          localStorage.removeItem('xasread-token')
          setToken(null)
          setUser(null)
        }
      })
      .catch(() => {
        localStorage.removeItem('xasread-token')
        setToken(null)
        setUser(null)
      })
      .finally(() => setIsLoading(false))
  }, [token])

  const signIn = useCallback((newToken: string) => {
    setIsLoading(true)
    sessionStorage.setItem('xasread-auth-mode', 'google')
    localStorage.setItem('xasread-token', newToken)
    setToken(newToken)
    setIsGuest(false)
    localStorage.removeItem('xasread-guest')
    localStorage.removeItem('xasread-guest-user')
    localStorage.removeItem('xasread-guest-token')
    localStorage.removeItem('xasread-guest-created-at')
  }, [])

  const continueAsGuest = useCallback((name: string) => {
    if (hasStoredGuest() && !isGuestSessionExpired()) {
      const existingName = localStorage.getItem('xasread-guest-user')
      const existingToken = localStorage.getItem('xasread-guest-token')
      if (existingName && existingToken) {
        sessionStorage.setItem('xasread-auth-mode', 'guest')
        setIsGuest(true)
        setGuestUsername(existingName)
        setGuestToken(existingToken)
        setUser(null)
        setToken(null)
        localStorage.removeItem('xasread-token')
      }
      return
    }
    if (localStorage.getItem('xasread-guest') === 'true') {
      Object.keys(localStorage)
        .filter(k => k.startsWith('xasread-guest-data-'))
        .forEach(k => localStorage.removeItem(k))
      localStorage.removeItem('xasread-guest')
      localStorage.removeItem('xasread-guest-user')
      localStorage.removeItem('xasread-guest-token')
      localStorage.removeItem('xasread-guest-created-at')
      localStorage.removeItem('xasread-active-conv')
    }
    const token = Math.random().toString(36).slice(2, 8)
    sessionStorage.setItem('xasread-auth-mode', 'guest')
    localStorage.setItem('xasread-guest', 'true')
    localStorage.setItem('xasread-guest-user', name)
    localStorage.setItem('xasread-guest-token', token)
    localStorage.setItem('xasread-guest-created-at', Date.now().toString())
    setIsGuest(true)
    setGuestUsername(name)
    setGuestToken(token)
    setUser(null)
    setToken(null)
    localStorage.removeItem('xasread-token')
  }, [])

  const getStoredGuestName = useCallback((): string | null => {
    if (!hasStoredGuest() || isGuestSessionExpired()) return null
    return localStorage.getItem('xasread-guest-user')
  }, [])

  const resumeGuestSession = useCallback(() => {
    if (!hasStoredGuest() || isGuestSessionExpired()) return
    const name = localStorage.getItem('xasread-guest-user')
    const token = localStorage.getItem('xasread-guest-token')
    if (!name || !token) return
    sessionStorage.setItem('xasread-auth-mode', 'guest')
    setIsGuest(true)
    setGuestUsername(name)
    setGuestToken(token)
    setUser(null)
    setToken(null)
  }, [])

  const endGuestSession = useCallback(() => {
    setUser(null)
    setToken(null)
    setIsGuest(false)
    setGuestUsername(null)
    setGuestToken(null)
    sessionStorage.removeItem('xasread-auth-mode')
    Object.keys(localStorage)
      .filter(k => k.startsWith('xasread-guest-data-'))
      .forEach(k => localStorage.removeItem(k))
    localStorage.removeItem('xasread-guest')
    localStorage.removeItem('xasread-guest-user')
    localStorage.removeItem('xasread-guest-token')
    localStorage.removeItem('xasread-guest-created-at')
    localStorage.removeItem('xasread-active-conv')
    localStorage.removeItem('xasread-token')
  }, [])

  const signOut = useCallback(() => {
    setUser(null)
    setToken(null)
    setIsGuest(false)
    setGuestUsername(null)
    setGuestToken(null)
    sessionStorage.removeItem('xasread-auth-mode')
    if (isGuest) {
      // Guest: keep localStorage data so they can resume within 24h
      return
    }
    // Google user: clear everything
    localStorage.removeItem('xasread-token')
    localStorage.removeItem('xasread-active-conv')
    localStorage.removeItem('xasread-guest')
    localStorage.removeItem('xasread-guest-user')
    localStorage.removeItem('xasread-guest-token')
    localStorage.removeItem('xasread-guest-created-at')
  }, [isGuest])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isGuest,
        guestUsername,
        guestToken,
        isAuthenticated: !!user || isGuest,
        isLoading,
        signIn,
        continueAsGuest,
        signOut,
        getStoredGuestName,
        resumeGuestSession,
        endGuestSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
