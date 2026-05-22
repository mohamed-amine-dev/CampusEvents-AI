import { TouchableOpacity, Text, StyleSheet, Animated } from 'react-native'
import { useTheme } from '../context/ThemeContext'

export function DarkModeToggle() {
  const { theme, isDark, toggleTheme, fadeAnim } = useTheme()

  return (
    <TouchableOpacity
      onPress={toggleTheme}
      activeOpacity={0.7}
      style={[
        styles.toggle,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
      ]}
    >
      <Animated.View style={{ opacity: fadeAnim }}>
        <Text style={styles.icon}>{isDark ? '☀️' : '🌙'}</Text>
      </Animated.View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  toggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  icon: {
    fontSize: 18,
  },
})
