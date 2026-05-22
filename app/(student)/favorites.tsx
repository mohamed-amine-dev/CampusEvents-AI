import { useState, useCallback } from 'react'
import { View, FlatList, StyleSheet } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { EventCard } from '../../components/EventCard'
import { EmptyState } from '../../components/ui/EmptyState'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { getFavoritesByUser } from '../../database/favorites'
import { getEventById } from '../../database/events'
import { Event } from '../../types'

export default function FavoritesScreen() {
  const { theme } = useTheme()
  const { user } = useAuth()
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  const loadFavorites = useCallback(() => {
    if (!user) return
    setLoading(true)
    try {
      const favs = getFavoritesByUser(user.email)
      const eventList = favs
        .map((f) => getEventById(f.eventId))
        .filter((e): e is Event => e !== undefined)
      setEvents(eventList)
    } catch (e) {
      console.warn(e)
    }
    setLoading(false)
  }, [user])

  useFocusEffect(useCallback(() => { loadFavorites() }, [loadFavorites]))

  if (loading) return <LoadingSpinner />

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState icon="❤️" title="Aucun favori" message="Ajoutez des événements à vos favoris depuis le catalogue" />
        }
        renderItem={({ item }) => (
          <EventCard event={item} onPress={() => router.push(`/event/${item.id}`)} />
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 16,
    paddingBottom: 24,
  },
})
