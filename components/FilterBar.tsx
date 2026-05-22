import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { Chip } from './ui/Chip'
import { Category } from '../types'
import { useTheme } from '../context/ThemeContext'

const CATEGORIES: { label: string; value: string }[] = [
  { label: 'Tous', value: '' },
  { label: 'Talk', value: 'Talk' },
  { label: 'Workshop', value: 'Workshop' },
  { label: 'Club', value: 'Club' },
  { label: 'Exam', value: 'Exam' },
  { label: 'Autre', value: 'Other' },
]

const PERIODS: { label: string; value: string }[] = [
  { label: 'Tous', value: '' },
  { label: 'À venir', value: 'upcoming' },
  { label: 'Passés', value: 'past' },
]

interface FilterBarProps {
  selectedCategory: string
  onCategoryChange: (category: string) => void
  selectedPeriod: string
  onPeriodChange: (period: string) => void
}

export function FilterBar({ selectedCategory, onCategoryChange, selectedPeriod, onPeriodChange }: FilterBarProps) {
  const { theme } = useTheme()

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Catégorie</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
        {CATEGORIES.map((cat) => (
          <Chip
            key={cat.value}
            label={cat.label}
            selected={selectedCategory === cat.value}
            onPress={() => onCategoryChange(cat.value)}
          />
        ))}
      </ScrollView>
      <Text style={[styles.label, { color: theme.colors.textSecondary, marginTop: 8 }]}>Période</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
        {PERIODS.map((p) => (
          <Chip
            key={p.value}
            label={p.label}
            selected={selectedPeriod === p.value}
            onPress={() => onPeriodChange(p.value)}
          />
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipsRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
})
