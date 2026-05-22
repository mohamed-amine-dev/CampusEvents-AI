import { useState, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, RefreshControl, Alert } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../context/AuthContext'
import { getEventById, Event } from '../../database/events'
import { getRegistrationsByUser, cancelRegistration } from '../../database/registrations'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing, Shadow, formatDate, getEventImage } from '../../constants/theme'
import { Badge, EmptyState, Button } from '../../components/ui'

export default function RegistrationsScreen() {
  const { user } = useAuth()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [registrations, setRegistrations] = useState<(Event & { registrationId: string })[]>([])
  const [refreshing, setRefreshing] = useState(false)

  function loadRegistrations() {
    if (!user) return
    const regs = getRegistrationsByUser(user.email)
    const events = regs.map((r) => {
      const e = getEventById(r.eventId)
      return e ? { ...e, registrationId: r.id } : null
    }).filter(Boolean) as (Event & { registrationId: string })[]
    setRegistrations(events)
  }

  useFocusEffect(useCallback(() => { loadRegistrations() }, [user]))

  function onRefresh() {
    setRefreshing(true)
    loadRegistrations()
    setRefreshing(false)
  }

  function handleCancel(eventId: string, title: string) {
    if (!user) return
    Alert.alert(
      'Annuler l\'inscription',
      `Es-tu sûr de vouloir annuler ton inscription à "${title}" ?`,
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: () => {
            cancelRegistration(eventId, user.email)
            setRegistrations((prev) => prev.filter((e) => e.id !== eventId))
          },
        },
      ]
    )
  }

  function renderEvent({ item }: { item: Event & { registrationId: string } }) {
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
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(item.id, item.title)}>
            <Ionicons name="close-circle" size={22} color={Colors.error} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes Inscriptions</Text>
        <Text style={styles.count}>{registrations.length} inscription{registrations.length !== 1 ? 's' : ''}</Text>
      </View>
      <FlatList
        data={registrations}
        keyExtractor={(item) => item.registrationId}
        renderItem={renderEvent}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListEmptyComponent={
          <EmptyState
            icon="calendar-outline"
            title="Aucune inscription"
            subtitle="Inscris-toi à des événements depuis le catalogue"
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
  cardActions: { justifyContent: 'center', paddingHorizontal: Spacing.md },
  cancelBtn: { padding: Spacing.sm },
})
