import { useState, useCallback, useEffect } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, RefreshControl } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { getAllEvents, Event } from '../../database/events'
import { getFavoritesByUser, addFavorite, removeFavorite } from '../../database/favorites'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing, Shadow, formatDate, getCategoryStyle, getEventImage } from '../../constants/theme'
import { SearchBar, Chip, Badge, EmptyState } from '../../components/ui'

export default function CatalogScreen() {
  const { user } = useAuth()
  const { theme } = useTheme()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Tout')
  const [refreshing, setRefreshing] = useState(false)
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())

  const categories = ['Tout', 'Workshop', 'Talk', 'Club', 'Exam', 'Other']

  function loadEvents() {
    const all = getAllEvents()
    setEvents(all)
    applyFilters(all, searchQuery, selectedCategory)
  }

  function loadFavorites() {
    if (!user) return
    const favs = getFavoritesByUser(user.email)
    setFavoriteIds(new Set(favs.map((f) => f.eventId)))
  }

  function applyFilters(all: Event[], query: string, category: string) {
    let filtered = all
    if (query.trim()) {
      const q = query.toLowerCase()
      filtered = filtered.filter((e) => e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q))
    }
    if (category !== 'Tout') {
      filtered = filtered.filter((e) => e.category === category)
    }
    setFilteredEvents(filtered)
  }

  useEffect(() => {
    loadEvents()
  }, [])

  useEffect(() => {
    loadFavorites()
  }, [user])

  useEffect(() => {
    applyFilters(events, searchQuery, selectedCategory)
  }, [searchQuery, selectedCategory, events])

  useFocusEffect(
    useCallback(() => {
      loadEvents()
      loadFavorites()
    }, [user])
  )

  function onRefresh() {
    setRefreshing(true)
    loadEvents()
    loadFavorites()
    setRefreshing(false)
  }

  function toggleFavorite(eventId: string) {
    if (!user) return
    if (favoriteIds.has(eventId)) {
      removeFavorite(eventId, user.email)
      setFavoriteIds((prev) => { const next = new Set(prev); next.delete(eventId); return next })
    } else {
      addFavorite(eventId, user.email)
      setFavoriteIds((prev) => { const next = new Set(prev); next.add(eventId); return next })
    }
  }

  function renderEvent({ item }: { item: Event }) {
    const fd = formatDate(item.startDateTime)
    const isFav = favoriteIds.has(item.id)
    const imageUri = getEventImage(item.imageUrl, item.category)

    return (
      <TouchableOpacity style={styles.eventCard} onPress={() => router.push(`/event/${item.id}`)} activeOpacity={0.95}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri! }} style={styles.image} />
          <View style={styles.imageOverlay} />
          <View style={styles.dateBadge}>
            <Text style={styles.dateDay}>{fd.day}</Text>
            <Text style={styles.dateMonth}>{fd.month}</Text>
          </View>
          {item.capacity && (
            <View style={styles.capacityBadge}>
              <Ionicons name="people" size={12} color="#fff" />
              <Text style={styles.capacityText}>{item.registeredCount}/{item.capacity}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.favButton} onPress={() => toggleFavorite(item.id)}>
          <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={22} color={isFav ? Colors.favorite : Colors.textWhite} />
        </TouchableOpacity>
        <View style={styles.cardBody}>
          <Badge label={item.category} variant="category" />
          <Text style={styles.eventTitle} numberOfLines={2}>{item.title}</Text>
          <View style={styles.eventMeta}>
            <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.metaText}>{item.locationName}</Text>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={[styles.topBar, { paddingHorizontal: Spacing.xl }]}>
        <Text style={styles.greeting}>Découvrir</Text>
        <TouchableOpacity onPress={() => router.push('/(student)/profile')}>
          <Ionicons name="person-circle-outline" size={32} color={theme.colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchSection}>
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Rechercher un événement..." />
      </View>

      <View style={styles.chipsRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item}
          contentContainerStyle={{ gap: Spacing.sm, paddingHorizontal: Spacing.xl }}
          renderItem={({ item }) => (
            <Chip label={item} selected={selectedCategory === item} onPress={() => setSelectedCategory(item)} />
          )}
        />
      </View>

      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => item.id}
        renderItem={renderEvent}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={{ gap: Spacing.md }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListEmptyComponent={
          <EmptyState
            icon="calendar-outline"
            title="Aucun événement trouvé"
            subtitle="Essaye de modifier tes filtres"
          />
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.md },
  greeting: { fontSize: FontSize.heading, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  searchSection: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.md },
  chipsRow: { marginBottom: Spacing.lg },
  listContent: { padding: Spacing.xl, gap: Spacing.md, paddingBottom: 120 },
  eventCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadow.level1,
  },
  imageContainer: { position: 'relative', height: 120 },
  image: { width: '100%', height: 120 },
  imageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.12)' },
  dateBadge: {
    position: 'absolute', top: Spacing.sm, left: Spacing.sm,
    backgroundColor: Colors.overlay,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs / 2,
    alignItems: 'center',
  },
  dateDay: { fontSize: FontSize.title, fontWeight: FontWeight.bold, color: Colors.textWhite, lineHeight: 22 },
  dateMonth: { fontSize: FontSize.caption, fontWeight: FontWeight.semibold, color: Colors.textWhite, textTransform: 'uppercase', marginTop: -2 },
  capacityBadge: {
    position: 'absolute', bottom: Spacing.sm, right: Spacing.sm,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm, paddingVertical: 2,
  },
  capacityText: { fontSize: FontSize.caption, color: Colors.textWhite, fontWeight: FontWeight.semibold },
  favButton: { position: 'absolute', top: Spacing.sm, right: Spacing.sm, zIndex: 10 },
  cardBody: { padding: Spacing.md, gap: Spacing.xs },
  eventTitle: { fontSize: FontSize.body, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  eventMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: FontSize.caption, color: Colors.textMuted, flex: 1 },
})
