import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { StyleSheet } from 'react-native'
import { ThemeProvider, useTheme } from '../context/ThemeContext'
import { AuthProvider } from '../context/AuthContext'
import { initDatabase } from '../database/init'

function RootContent() {
  const { theme } = useTheme()

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
    try { initDatabase() } catch (e) { console.warn('DB init error:', e) }
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
