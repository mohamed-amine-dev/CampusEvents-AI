import { View, Text, StyleSheet } from 'react-native'
import { useTheme } from '../context/ThemeContext'

export function AiWarning() {
  const { theme } = useTheme()

  return (
    <View style={[styles.warning, { backgroundColor: theme.colors.warning + '20', borderColor: theme.colors.warning + '40' }]}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={[styles.text, { color: theme.colors.textSecondary }]}>
        Ne soumettez pas de données personnelles ou sensibles
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  warning: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  icon: {
    fontSize: 16,
    marginRight: 8,
  },
  text: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
})
