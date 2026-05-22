import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { User } from '../types'

const USERS: Record<string, { password: string; role: 'admin' | 'student'; name: string }> = {
  'admin@campus.ma': { password: 'admin123', role: 'admin', name: 'Admin' },
  'etudiant@campus.ma': { password: 'etudiant123', role: 'student', name: 'Étudiant' },
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const AUTH_STORAGE_KEY = '@campus.auth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    AsyncStorage.getItem(AUTH_STORAGE_KEY).then((stored) => {
      if (stored) {
        try {
          setUser(JSON.parse(stored))
        } catch {}
      }
      setIsLoading(false)
    })
  }, [])

  const login = async (email: string, password: string) => {
    const account = USERS[email.toLowerCase().trim()]
    if (!account) {
      return { success: false, error: 'Email non trouvé' }
    }
    if (account.password !== password) {
      return { success: false, error: 'Mot de passe incorrect' }
    }
    const user: User = { email: email.toLowerCase(), role: account.role, name: account.name }
    setUser(user)
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
    return { success: true }
  }

  const logout = async () => {
    setUser(null)
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
