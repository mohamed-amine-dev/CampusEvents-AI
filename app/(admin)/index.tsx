import { useState, useCallback } from 'react'
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { useTheme } from '../../context/ThemeContext'
import { getAllEvents, deleteEvent } from '../../database/events'
import { Event } from '../../types'

const CATEGORY_COLORS: Record<string, string> = {
  Talk: '#3B82F6',
  Workshop: '#10B981',
  Club: '#F59E0B',
  Exam: '#EF4444',
  Other: '#8B5CF6',
}

export default function AdminEventList() {
  const { theme } = useTheme()
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  const loadEvents = useCallback(() => {
    setLoading(true)
    try {
      const data = getAllEvents()
      setEvents(data)
    } catch (e) {
      console.warn(e)
    }
    setLoading(false)
  }, [])

  useFocusEffect(useCallback(() => { loadEvents() }, [loadEvents]))

  const handleDelete = (event: Event) => {
    Alert.alert(
      'Confirmer la suppression',
      `Êtes-vous sûr de vouloir supprimer "${event.title}" ? Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            deleteEvent(event.id)
            loadEvents()
          },
        },
      ]
    )
  }

  if (loading) return <LoadingSpinner />

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState icon="📋" title="Aucun événement" message="Créez votre premier événement" />}
        renderItem={({ item }) => {
          const startDate = new Date(item.startDateTime)
          const dateStr = startDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
          const past = startDate < new Date()

          return (
            <Card style={styles.eventCard}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.title, { color: theme.colors.text }]}>{item.title}</Text>
                  <View style={styles.metaRow}>
                    <Badge label={item.category} color={CATEGORY_COLORS[item.category]} />
                    {past && <Badge label="Passé" color={theme.colors.textSecondary} />}
                  </View>
                </View>
              </View>

              <View style={styles.details}>
                <Text style={[styles.detail, { color: theme.colors.textSecondary }]}>📅 {dateStr}</Text>
                <Text style={[styles.detail, { color: theme.colors.textSecondary }]}>📍 {item.locationName}</Text>
                <Text style={[styles.detail, { color: theme.colors.textSecondary }]}>
                  👤 {item.registeredCount}{item.capacity ? ` / ${item.capacity}` : ''} inscrits
                </Text>
              </View>

              <View style={styles.actions}>
                <Button
                  title="Modifier"
                  onPress={() => router.push(`/(admin)/edit/${item.id}`)}
                  variant="secondary"
                  size="sm"
                  style={{ flex: 1, marginRight: 8 }}
                />
                <Button
                  title="Supprimer"
                  onPress={() => handleDelete(item)}
                  variant="danger"
                  size="sm"
                  style={{ flex: 1, marginLeft: 8 }}
                />
              </View>
            </Card>
          )
        }}
      />

      <View style={[styles.fab, { backgroundColor: theme.colors.primary }]}>
        <TouchableOpacity onPress={() => router.push('/(admin)/create')}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  eventCard: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 6,
  },
  details: {
    gap: 4,
    marginBottom: 12,
  },
  detail: {
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabText: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '300',
    marginTop: -2,
  },
})
