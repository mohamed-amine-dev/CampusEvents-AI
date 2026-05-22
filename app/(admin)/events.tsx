import { useState, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, RefreshControl, Alert } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../context/AuthContext'
import { getAllEvents, deleteEvent, Event } from '../../database/events'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing, Shadow, formatDate, getCategoryStyle } from '../../constants/theme'
import { Badge, Button, EmptyState } from '../../components/ui'

export default function AdminEventsScreen() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [events, setEvents] = useState<Event[]>([])
  const [refreshing, setRefreshing] = useState(false)

  function handleLogout() {
    Alert.alert('Déconnexion', 'Es-tu sûr de vouloir te déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Se déconnecter', style: 'destructive', onPress: async () => { await logout(); router.replace('/') } },
    ])
  }

  function loadEvents() {
    setEvents(getAllEvents())
  }

  useFocusEffect(useCallback(() => { loadEvents() }, []))

  function onRefresh() {
    setRefreshing(true)
    loadEvents()
    setRefreshing(false)
  }

  function handleDelete(id: string, title: string) {
    Alert.alert(
      'Supprimer',
      `Supprimer "${title}" ? Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            deleteEvent(id)
            loadEvents()
          },
        },
      ]
    )
  }

  function renderEvent({ item }: { item: Event }) {
    const fd = formatDate(item.startDateTime)
    const catStyle = getCategoryStyle(item.category)

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push({ pathname: '/(admin)/edit/[id]', params: { id: item.id } })}
        activeOpacity={0.95}
      >
        {item.imageUrl && <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />}
        <View style={styles.cardBody}>
          <Badge label={item.category} variant="category" />
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          <View style={styles.cardMeta}>
            <Ionicons name="calendar-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.metaText}>{fd.day} {fd.month}</Text>
          </View>
          <View style={styles.cardMeta}>
            <Ionicons name="people-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.metaText}>{item.registeredCount}/{item.capacity || '∞'} inscrits</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id, item.title)}>
          <Ionicons name="trash-outline" size={20} color={Colors.error} />
        </TouchableOpacity>
      </TouchableOpacity>
    )
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Événements</Text>
          <Text style={styles.count}>{events.length} au total</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          <TouchableOpacity style={styles.addBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color={Colors.textWhite} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/(admin)/create')}>
            <Ionicons name="add" size={24} color={Colors.textWhite} />
          </TouchableOpacity>
        </View>
      </View>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={renderEvent}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListEmptyComponent={
          <EmptyState
            icon="calendar-outline"
            title="Aucun événement"
            subtitle="Crée ton premier événement"
            action={<Button title="Créer un événement" onPress={() => router.push('/(admin)/create')} />}
          />
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg },
  title: { fontSize: FontSize.heading, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  count: { fontSize: FontSize.label, color: Colors.textSecondary, fontWeight: FontWeight.medium, marginTop: 2 },
  addBtn: {
    width: 48, height: 48, borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
    ...Shadow.level2,
  },
  listContent: { padding: Spacing.xl, paddingBottom: 120, gap: Spacing.md },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadow.level1,
  },
  cardImage: { width: 100, height: 100 },
  cardBody: { flex: 1, padding: Spacing.md, gap: 4 },
  cardTitle: { fontSize: FontSize.body, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: FontSize.caption, color: Colors.textMuted },
  deleteBtn: { justifyContent: 'center', paddingHorizontal: Spacing.md },
})
