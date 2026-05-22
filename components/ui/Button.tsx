import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native'
import { useTheme } from '../../context/ThemeContext'

interface ButtonProps {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  icon?: React.ReactNode
  style?: ViewStyle
}

export function Button({ title, onPress, variant = 'primary', size = 'md', disabled, loading, icon, style }: ButtonProps) {
  const { theme } = useTheme()

  const bgColor = variant === 'primary' ? theme.colors.primary
    : variant === 'danger' ? theme.colors.error
    : variant === 'ghost' ? 'transparent'
    : theme.colors.surface

  const textColor = variant === 'ghost' ? theme.colors.primary
    : theme.colors.textInverse

  const borderColor = variant === 'secondary' ? theme.colors.border : 'transparent'

  const paddingV = size === 'sm' ? 8 : size === 'lg' ? 16 : 12
  const paddingH = size === 'sm' ? 16 : size === 'lg' ? 32 : 24
  const fontSize = size === 'sm' ? 13 : size === 'lg' ? 17 : 15

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.button,
        {
          backgroundColor: bgColor,
          borderColor,
          borderWidth: variant === 'secondary' ? 1 : 0,
          paddingVertical: paddingV,
          paddingHorizontal: paddingH,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, { color: textColor, fontSize, marginLeft: icon ? 8 : 0 }]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
  },
})
