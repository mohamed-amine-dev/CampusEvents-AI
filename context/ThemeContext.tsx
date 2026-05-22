import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useColorScheme, Animated } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { lightTheme, darkTheme } from '../constants/colors'
import { Theme } from '../types'

interface ThemeContextType {
  theme: Theme
  isDark: boolean
  toggleTheme: () => void
  fadeAnim: Animated.Value
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const THEME_STORAGE_KEY = '@campus.theme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme()
  const [isDark, setIsDark] = useState(false)
  const [fadeAnim] = useState(() => new Animated.Value(1))
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((stored) => {
      if (stored === 'dark') {
        setIsDark(true)
      } else if (stored === 'light') {
        setIsDark(false)
      } else {
        setIsDark(systemScheme === 'dark')
      }
      setLoaded(true)
    })
  }, [systemScheme])

  const toggleTheme = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start()
    setIsDark((prev) => {
      const next = !prev
      AsyncStorage.setItem(THEME_STORAGE_KEY, next ? 'dark' : 'light')
      return next
    })
  }

  const theme = isDark ? darkTheme : lightTheme

  if (!loaded) return null

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, fadeAnim }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}
