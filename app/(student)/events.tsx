import { useState, useCallback } from 'react'
import { View, FlatList, StyleSheet, Text } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { SearchBar } from '../../components/SearchBar'
import { FilterBar } from '../../components/FilterBar'
import { EventCard } from '../../components/EventCard'
import { EmptyState } from '../../components/ui/EmptyState'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { getAllEvents, searchEvents, getUpcomingEvents, getPastEvents, getEventsByCategory } from '../../database/events'
import { isFavorite } from '../../database/favorites'
import { Event, Category } from '../../types'

export default function EventsScreen() {
  const { theme } = useTheme()
  const { user } = useAuth()
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [period, setPeriod] = useState('')

  const loadEvents = useCallback(() => {
    setLoading(true)
    try {
      let results: Event[]
      if (search.trim()) {
        results = searchEvents(search.trim())
      } else {
        results = getAllEvents()
      }

      if (category) {
        results = results.filter((e) => e.category === category)
      }

      if (period === 'upcoming') {
        results = results.filter((e) => new Date(e.startDateTime) > new Date())
        results.sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime())
      } else if (period === 'past') {
        results = results.filter((e) => new Date(e.startDateTime) <= new Date())
        results.sort((a, b) => new Date(b.startDateTime).getTime() - new Date(a.startDateTime).getTime())
      } else {
        results.sort((a, b) => new Date(b.startDateTime).getTime() - new Date(a.startDateTime).getTime())
      }

      setEvents(results)
    } catch (e) {
      console.warn(e)
    }
    setLoading(false)
  }, [search, category, period])

  useFocusEffect(useCallback(() => { loadEvents() }, [loadEvents]))

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Rechercher un événement..." onClear={() => setSearch('')} />
      </View>
      <View style={styles.filters}>
        <FilterBar
          selectedCategory={category}
          onCategoryChange={setCategory}
          selectedPeriod={period}
          onPeriodChange={setPeriod}
        />
      </View>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              icon="📭"
              title="Aucun événement trouvé"
              message={search ? `Aucun résultat pour "${search}"` : 'Aucun événement à afficher'}
            />
          }
          renderItem={({ item }) => (
            <EventCard event={item} onPress={() => router.push(`/event/${item.id}`)} />
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  filters: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  list: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
})
