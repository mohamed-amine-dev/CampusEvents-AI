import { Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing } from '../../constants/theme'

interface ChipProps {
  label: string
  selected?: boolean
  onPress?: () => void
  style?: ViewStyle
}

export function Chip({ label, selected, onPress, style }: ChipProps) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.selected, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.text, selected && styles.textSelected]}>{label}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  text: {
    fontSize: FontSize.label,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  textSelected: {
    color: Colors.textWhite,
    fontWeight: FontWeight.semibold,
  },
})
