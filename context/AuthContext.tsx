import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { User } from '../types'

const PRECONFIGURED_ACCOUNTS = [
  { email: 'admin@campus.ma', password: 'admin123', role: 'admin' as const },
  { email: 'etudiant@campus.ma', password: 'etudiant123', role: 'student' as const },
]

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  updateUser: (updates: Partial<User>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const AUTH_STORAGE_KEY = '@campus.auth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    AsyncStorage.getItem(AUTH_STORAGE_KEY).then((stored) => {
      if (stored) {
        try { setUser(JSON.parse(stored)) } catch {}
      }
      setIsLoading(false)
    })
  }, [])

  function getDefaultName(email: string): string {
    const localPart = email.split('@')[0]
    return localPart.charAt(0).toUpperCase() + localPart.slice(1)
  }

  const login = async (email: string, password: string) => {
    const account = PRECONFIGURED_ACCOUNTS.find(
      (a) => a.email.toLowerCase() === email.toLowerCase() && a.password === password
    )
    if (!account) return { success: false, error: 'Email ou mot de passe incorrect' }

    const userData: User = { email: account.email, role: account.role, name: getDefaultName(account.email) }
    setUser(userData)
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData))
    return { success: true }
  }

  const updateUser = async (updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev
      const updated = { ...prev, ...updates }
      AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }

  const logout = async () => {
    setUser(null)
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
