import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native'
import { useTheme } from '../../context/ThemeContext'

interface ChipProps {
  label: string
  selected?: boolean
  onPress?: () => void
  style?: ViewStyle
}

export function Chip({ label, selected, onPress, style }: ChipProps) {
  const { theme } = useTheme()

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? theme.colors.primary : theme.colors.chipBackground,
          borderColor: selected ? theme.colors.primary : theme.colors.border,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: selected ? theme.colors.textInverse : theme.colors.chipText },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
  },
})
