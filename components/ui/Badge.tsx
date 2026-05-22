import { View, Text, StyleSheet, ViewStyle } from 'react-native'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing, getCategoryStyle } from '../../constants/theme'

interface BadgeProps {
  label: string
  variant?: 'category' | 'status' | 'default'
  color?: string
  style?: ViewStyle
}

export function Badge({ label, variant = 'default', color, style }: BadgeProps) {
  const categoryStyle = variant === 'category' ? getCategoryStyle(label) : null
  const bgColor = color || categoryStyle?.bg || Colors.borderLight
  const textColor = color || categoryStyle?.text || Colors.textSecondary

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }, style]}>
      <Text style={[styles.text, { color: textColor }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  text: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semibold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
})
