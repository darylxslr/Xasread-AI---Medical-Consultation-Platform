import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { UserOut } from '../types'

export interface AuthContextType {
  user: UserOut | null
  token: string | null
  isGuest: boolean
  isAuthenticated: boolean
  isLoading: boolean
  signIn: (token: string) => void
  continueAsGuest: () => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserOut | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('xasread-token') || null)
  const [isGuest, setIsGuest] = useState<boolean>(() => localStorage.getItem('xasread-guest') === 'true')
  const [isLoading, setIsLoading] = useState(() => !!localStorage.getItem('xasread-token'))

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
    localStorage.setItem('xasread-token', newToken)
    setToken(newToken)
    setIsGuest(false)
    localStorage.removeItem('xasread-guest')
  }, [])

  const continueAsGuest = useCallback(() => {
    setIsGuest(true)
    setUser(null)
    setToken(null)
    localStorage.setItem('xasread-guest', 'true')
    localStorage.removeItem('xasread-token')
  }, [])

  const signOut = useCallback(() => {
    setUser(null)
    setToken(null)
    setIsGuest(false)
    localStorage.removeItem('xasread-token')
    localStorage.removeItem('xasread-guest')
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isGuest,
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