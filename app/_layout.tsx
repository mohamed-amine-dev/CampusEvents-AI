import { useEffect, useRef } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { ThemeProvider, useTheme } from '../context/ThemeContext'
import { AuthProvider, useAuth } from '../context/AuthContext'
import { initDatabase } from '../database/init'
import { View, ActivityIndicator } from 'react-native'

function RootLayoutContent() {
  const { user, isLoading } = useAuth()
  const { theme } = useTheme()
  const segments = useSegments()
  const router = useRouter()
  const dbReady = useRef(false)

  useEffect(() => {
    if (dbReady.current) return
    try { initDatabase() } catch (e) { console.warn('DB init error:', e) }
    dbReady.current = true
  }, [])

  useEffect(() => {
    if (isLoading) return

    const inAuthGroup = segments[0] === 'login'

    if (!user && !inAuthGroup) {
      router.replace('/login')
    } else if (user && inAuthGroup) {
      if (user.role === 'admin') {
        router.replace('/(admin)')
      } else {
        router.replace('/(student)')
      }
    }
  }, [user, isLoading])

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    )
  }

  return (
    <>
      <StatusBar style={theme.colors.statusBar} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="(student)" />
        <Stack.Screen name="event/[id]" options={{ headerShown: true, presentation: 'card' }} />
      </Stack>
    </>
  )
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootLayoutContent />
      </AuthProvider>
    </ThemeProvider>
  )
}
