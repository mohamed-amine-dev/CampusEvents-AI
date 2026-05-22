import { View, ActivityIndicator, Text, StyleSheet } from 'react-native'
import { useTheme } from '../../context/ThemeContext'

interface LoadingSpinnerProps {
  message?: string
  size?: 'small' | 'large'
}

export function LoadingSpinner({ message, size = 'large' }: LoadingSpinnerProps) {
  const { theme } = useTheme()

  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={theme.colors.primary} />
      {message && (
        <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
          {message}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  message: {
    marginTop: 12,
    fontSize: 14,
  },
})
