import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native'
import { useTheme } from '../../context/ThemeContext'

interface InputProps extends TextInputProps {
  label?: string
  error?: string
}

export function Input({ label, error, style, ...props }: InputProps) {
  const { theme } = useTheme()

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>
      )}
      <TextInput
        placeholderTextColor={theme.colors.textSecondary}
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.inputBackground,
            borderColor: error ? theme.colors.error : theme.colors.border,
            color: theme.colors.text,
          },
          style,
        ]}
        {...props}
      />
      {error && (
        <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
  },
})
