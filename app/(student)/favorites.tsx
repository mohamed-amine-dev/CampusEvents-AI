import { useState, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, RefreshControl } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../context/AuthContext'
import { getEventById, Event } from '../../database/events'
import { getFavoritesByUser, removeFavorite } from '../../database/favorites'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing, Shadow, formatDate, getEventImage } from '../../constants/theme'
import { Badge, EmptyState, Screen } from '../../components/ui'

export default function FavoritesScreen() {
  const { user } = useAuth()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [favoriteEvents, setFavoriteEvents] = useState<Event[]>([])
  const [refreshing, setRefreshing] = useState(false)

  function loadFavorites() {
    if (!user) return
    const favs = getFavoritesByUser(user.email)
    const events = favs.map((f) => getEventById(f.eventId)).filter(Boolean) as Event[]
    setFavoriteEvents(events)
  }

  useFocusEffect(useCallback(() => { loadFavorites() }, [user]))

  function onRefresh() {
    setRefreshing(true)
    loadFavorites()
    setRefreshing(false)
  }

  function handleRemove(eventId: string) {
    if (!user) return
    removeFavorite(eventId, user.email)
    setFavoriteEvents((prev) => prev.filter((e) => e.id !== eventId))
  }

  function renderEvent({ item }: { item: Event }) {
    const fd = formatDate(item.startDateTime)
    const imageUri = getEventImage(item.imageUrl, item.category)
    return (
      <TouchableOpacity style={styles.card} onPress={() => router.push(`/event/${item.id}`)} activeOpacity={0.95}>
        <Image source={{ uri: imageUri! }} style={styles.cardImage} />
        <View style={styles.cardBody}>
          <Badge label={item.category} variant="category" />
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          <View style={styles.cardMeta}>
            <Ionicons name="calendar-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.metaText}>{fd.day} {fd.month} à {fd.time}</Text>
          </View>
          <View style={styles.cardMeta}>
            <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.metaText}>{item.locationName}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemove(item.id)}>
          <Ionicons name="heart" size={22} color={Colors.favorite} />
        </TouchableOpacity>
      </TouchableOpacity>
    )
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes Favoris</Text>
        <Text style={styles.count}>{favoriteEvents.length} événement{favoriteEvents.length !== 1 ? 's' : ''}</Text>
      </View>
      <FlatList
        data={favoriteEvents}
        keyExtractor={(item) => item.id}
        renderItem={renderEvent}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListEmptyComponent={
          <EmptyState icon="heart-outline" title="Aucun favori" subtitle="Ajoute des événements à tes favoris depuis le catalogue" />
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg },
  title: { fontSize: FontSize.heading, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  count: { fontSize: FontSize.label, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  listContent: { padding: Spacing.xl, paddingBottom: 120, gap: Spacing.md },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadow.level1,
  },
  cardImage: { width: 100, height: 100 },
  cardBody: { flex: 1, padding: Spacing.md, gap: 4 },
  cardTitle: { fontSize: FontSize.body, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: FontSize.caption, color: Colors.textMuted },
  removeBtn: { justifyContent: 'center', paddingHorizontal: Spacing.md },
})
