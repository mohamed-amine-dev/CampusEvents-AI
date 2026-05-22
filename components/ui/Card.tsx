import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native'
import { useTheme } from '../../context/ThemeContext'

interface CardProps {
  children: React.ReactNode
  onPress?: () => void
  style?: ViewStyle
  padded?: boolean
}

export function Card({ children, onPress, style, padded = true }: CardProps) {
  const { theme } = useTheme()

  const content = (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.dark ? theme.colors.border : 'transparent',
          shadowColor: theme.colors.cardShadow,
          padding: padded ? 16 : 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  )

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    )
  }

  return content
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 0.5,
  },
})
