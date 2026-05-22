import { ReactNode } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing, Shadow } from '../../constants/theme'

interface HeaderProps {
  title: string
  subtitle?: string
  onBack?: () => void
  rightAction?: ReactNode
}

export function Header({ title, subtitle, onBack, rightAction }: HeaderProps) {
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.header, { paddingTop: insets.top + Spacing.xl }]}>
      <View style={styles.left}>
        {onBack && (
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.center}>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.right}>{rightAction}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  left: { width: 48 },
  backBtn: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.level1,
  },
  center: { flex: 1, alignItems: 'center' },
  right: { width: 48, alignItems: 'flex-end' },
  subtitle: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    letterSpacing: 2,
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: FontSize.subhead,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
})
