import { View, TextInput, StyleSheet, TouchableOpacity, Text } from 'react-native'
import { useTheme } from '../context/ThemeContext'

interface SearchBarProps {
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
  onClear?: () => void
}

export function SearchBar({ value, onChangeText, placeholder = 'Rechercher...', onClear }: SearchBarProps) {
  const { theme } = useTheme()

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.inputBackground, borderColor: theme.colors.border }]}>
      <Text style={[styles.icon, { color: theme.colors.textSecondary }]}>🔍</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        style={[styles.input, { color: theme.colors.text }]}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={onClear} style={styles.clearBtn}>
          <Text style={[styles.clearText, { color: theme.colors.textSecondary }]}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 48,
  },
  icon: {
    fontSize: 16,
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  clearBtn: {
    padding: 4,
  },
  clearText: {
    fontSize: 16,
  },
})
