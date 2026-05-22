import { ReactNode } from 'react'
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native'
import { Colors, BorderRadius, Spacing, Shadow } from '../../constants/theme'

interface CardProps {
  children: ReactNode
  onPress?: () => void
  style?: ViewStyle
  noPadding?: boolean
}

export function Card({ children, onPress, style, noPadding }: CardProps) {
  const Wrapper = onPress ? TouchableOpacity : View
  return (
    <Wrapper
      style={[styles.card, noPadding && styles.noPadding, style]}
      onPress={onPress}
      activeOpacity={0.95}
    >
      {children}
    </Wrapper>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.level1,
  },
  noPadding: { padding: 0 },
})
