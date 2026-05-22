import { ReactNode } from 'react'
import { View, ScrollView, StyleSheet, ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors, Spacing } from '../../constants/theme'

interface ScreenProps {
  children: ReactNode
  scroll?: boolean
  style?: ViewStyle
  contentContainerStyle?: ViewStyle
  noInsets?: boolean
}

export function Screen({ children, scroll, style, contentContainerStyle, noInsets }: ScreenProps) {
  const insets = useSafeAreaInsets()
  const paddingTop = noInsets ? 0 : insets.top

  if (scroll) {
    return (
      <View style={[styles.container, { paddingTop }, style]}>
        <ScrollView contentContainerStyle={[styles.scrollContent, contentContainerStyle]} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </View>
    )
  }

  return <View style={[styles.container, { paddingTop }, style]}>{children}</View>
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: Spacing.xl, paddingBottom: 120 },
})
