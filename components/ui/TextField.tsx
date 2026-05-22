import { View, Text, TextInput, StyleSheet, TextInputProps, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing } from '../../constants/theme'

interface TextFieldProps extends TextInputProps {
  label?: string
  error?: string
}

export function TextField({ label, error, style, ...props }: TextFieldProps) {
  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, error && styles.inputError, style]}
        placeholderTextColor={Colors.textMuted}
        {...props}
      />
      {error && (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={14} color={Colors.error} />
          <Text style={styles.error}>{error}</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { gap: Spacing.sm },
  label: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    letterSpacing: 1.5,
    marginLeft: Spacing.xs,
  },
  input: {
    height: 56,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.xl,
    fontSize: FontSize.body,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  inputError: { borderColor: Colors.error },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: Spacing.xs },
  error: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.medium,
    color: Colors.error,
  },
})
