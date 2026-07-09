import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserOut | null>(null)
  const [token, setToken] = useState<string | null>(() => {
    if (sessionStorage.getItem('xasread-guest') === 'true') return null
    return localStorage.getItem('xasread-token') || null
  })
  const [isGuest, setIsGuest] = useState<boolean>(() =>
    sessionStorage.getItem('xasread-guest') === 'true'
  )
  const [guestUsername, setGuestUsername] = useState<string | null>(() =>
    sessionStorage.getItem('xasread-guest-user')
  )
  const [guestToken, setGuestToken] = useState<string | null>(() =>
    sessionStorage.getItem('xasread-guest-token')
  )
  const [isLoading, setIsLoading] = useState(() => {
    if (sessionStorage.getItem('xasread-guest') === 'true') return false
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
          sessionStorage.removeItem('xasread-guest')
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
    localStorage.setItem('xasread-token', newToken)
    setToken(newToken)
    setIsGuest(false)
    sessionStorage.removeItem('xasread-guest')
  }, [])

  const continueAsGuest = useCallback((name: string) => {
    const token = Math.random().toString(36).slice(2, 8)
    setIsGuest(true)
    setGuestUsername(name)
    setGuestToken(token)
    setUser(null)
    setToken(null)
    sessionStorage.setItem('xasread-guest', 'true')
    sessionStorage.setItem('xasread-guest-user', name)
    sessionStorage.setItem('xasread-guest-token', token)
    localStorage.removeItem('xasread-token')
  }, [])

  const signOut = useCallback(() => {
    setUser(null)
    setToken(null)
    setIsGuest(false)
    setGuestUsername(null)
    setGuestToken(null)
    localStorage.removeItem('xasread-token')
    localStorage.removeItem('xasread-active-conv')
    sessionStorage.removeItem('xasread-guest')
    sessionStorage.removeItem('xasread-guest-user')
    sessionStorage.removeItem('xasread-guest-token')
  }, [])

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
