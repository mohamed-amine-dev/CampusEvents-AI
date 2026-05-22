import { View, Text, StyleSheet } from 'react-native'
import { useTheme } from '../../context/ThemeContext'

interface BadgeProps {
  label: string
  color?: string
}

export function Badge({ label, color }: BadgeProps) {
  const { theme } = useTheme()

  const bgColor = color || theme.colors.primaryLight
  const textColor = color ? theme.colors.textInverse : theme.colors.primary

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }]}>
      <Text style={[styles.text, { color: textColor }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
})
