import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { authClient } from '../../lib/auth-client'

export interface User {
  id: string
  email: string
  name?: string
  role?: string
  skillLevel?: string
  image?: string
  background_software?: string
  background_hardware?: string
  goal?: string
}

interface AuthContextValue {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (
    email: string,
    password: string,
    name: string,
    role: string,
    skillLevel: string,
    profileExtras?: Record<string, string>,
  ) => Promise<void>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshSession = useCallback(async () => {
    try {
      const { data: session } = await authClient.getSession()
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: (session.user as any).role,
          skillLevel: (session.user as any).skillLevel,
          image: session.user.image,
          background_software: (session.user as any).background_software,
          background_hardware: (session.user as any).background_hardware,
          goal: (session.user as any).goal,
        })
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshSession()
  }, [refreshSession])

  const signInHandler = useCallback(async (email: string, password: string) => {
    try {
      await authClient.signIn.email({ email, password })
    } catch (err: any) {
      throw new Error(err?.message || 'Sign in failed. Check your credentials and try again.')
    }
    await refreshSession()
  }, [refreshSession])

  const signUpHandler = useCallback(async (
    email: string,
    password: string,
    name: string,
    role: string,
    skillLevel: string,
    profileExtras?: Record<string, string>,
  ) => {
    try {
      await authClient.signUp.email({ email, password, name, role, skillLevel, ...profileExtras })
    } catch (err: any) {
      throw new Error(err?.message || 'Sign up failed. Check your email and try again.')
    }
    await refreshSession()
  }, [refreshSession])

  const signOutHandler = useCallback(async () => {
    await authClient.signOut()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn: signInHandler,
        signUp: signUpHandler,
        signOut: signOutHandler,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
