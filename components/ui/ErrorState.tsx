import { View, Text, StyleSheet } from 'react-native'
import { Button } from './Button'
import { useTheme } from '../../context/ThemeContext'

interface ErrorStateProps {
  message: string
  onRetry?: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const { theme } = useTheme()

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={[styles.message, { color: theme.colors.text }]}>{message}</Text>
      {onRetry && (
        <Button title="Réessayer" onPress={onRetry} variant="secondary" size="sm" />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
})
