import { ReactNode } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors, FontSize, FontWeight, Spacing } from '../../constants/theme'

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap
  title: string
  subtitle?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={48} color={Colors.textMuted} />
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {action}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingTop: 80, gap: Spacing.sm },
  title: { fontSize: FontSize.subhead, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.label, fontWeight: FontWeight.medium, color: Colors.textSecondary },
})
