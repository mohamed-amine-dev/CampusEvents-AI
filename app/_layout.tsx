import { useEffect, useState } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { ThemeProvider, useTheme } from '../context/ThemeContext'
import { AuthProvider, useAuth } from '../context/AuthContext'
import { initDatabase } from '../database/init'

function RootContent() {
  const { user, isLoading } = useAuth()
  const { theme } = useTheme()
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!isLoading) setReady(true)
  }, [isLoading])

  useEffect(() => {
    if (ready && !user) {
      router.replace('/')
    }
  }, [ready, user])

  if (!ready) return null

  return (
    <>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="(student)" />
        <Stack.Screen name="event/[id]" />
      </Stack>
    </>
  )
}

export default function RootLayout() {
  useEffect(() => {
    initDatabase().catch((e) => console.warn('DB init error:', e))
  }, [])

  return (
    <GestureHandlerRootView style={styles.container}>
      <ThemeProvider>
        <AuthProvider>
          <RootContent />
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
})
