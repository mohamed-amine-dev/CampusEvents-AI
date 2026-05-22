import { useState, useEffect } from 'react'
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { getEventById, Event } from '../../database/events'
import { isFavorite, addFavorite, removeFavorite } from '../../database/favorites'
import { registerForEvent, cancelRegistration, getRegistrationByEventAndUser } from '../../database/registrations'
import { generateId } from '../../utils/uuid'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing, Shadow, formatDate, formatDateLong, getCategoryStyle, getEventImage } from '../../constants/theme'
import { Badge, Button } from '../../components/ui'

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuth()
  const { theme } = useTheme()
  const router = useRouter()
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()

  const [event, setEvent] = useState<Event | null>(null)
  const [isFav, setIsFav] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    const evt = getEventById(id)
    setEvent(evt)
    if (user && evt) {
      setIsFav(isFavorite(evt.id, user.email))
      setIsRegistered(!!getRegistrationByEventAndUser(evt.id, user.email))
    }
    setLoading(false)
  }, [id, user])

  function toggleFavorite() {
    if (!event || !user) return
    if (isFav) {
      removeFavorite(event.id, user.email)
      setIsFav(false)
    } else {
      addFavorite(event.id, user.email)
      setIsFav(true)
    }
  }

  function handleRegister() {
    if (!event || !user) return
    if (isRegistered) {
      cancelRegistration(event.id, user.email)
      setIsRegistered(false)
    } else {
      if (event.capacity && event.registeredCount >= event.capacity) {
        Alert.alert('Complet', 'Cet événement a atteint sa capacité maximale.')
        return
      }
      registerForEvent(generateId(), event.id, user.email)
      setIsRegistered(true)
      setEvent((prev) => prev ? { ...prev, registeredCount: prev.registeredCount + 1 } : prev)
    }
  }

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    )
  }

  if (!event) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <Text style={{ color: Colors.textSecondary }}>Événement non trouvé</Text>
        <Button title="Retour" onPress={() => router.back()} style={{ marginTop: Spacing.lg }} />
      </View>
    )
  }

  const fd = formatDate(event.startDateTime)
  const catStyle = getCategoryStyle(event.category)
  const capacityPercent = event.capacity ? Math.min(event.registeredCount / event.capacity * 100, 100) : 0
  const heroImageUri = getEventImage(event.imageUrl, event.category)

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <Image source={{ uri: heroImageUri! }} style={styles.heroImage} />
        <View style={styles.heroOverlay} />
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textWhite} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.favHeroBtn} onPress={toggleFavorite}>
          <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={24} color={isFav ? Colors.favorite : Colors.textWhite} />
        </TouchableOpacity>
        <View style={styles.heroDateBadge}>
          <Text style={styles.heroDateDay}>{fd.day}</Text>
          <Text style={styles.heroDateMonth}>{fd.month}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Badge label={event.category} variant="category" style={{ marginBottom: Spacing.sm }} />
        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.dateTime}>{formatDateLong(event.startDateTime)} à {fd.time}</Text>
        {event.endDateTime && (
          <Text style={styles.dateTime}>
            Jusqu'au {formatDateLong(event.endDateTime)}
          </Text>
        )}

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={18} color={Colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Lieu</Text>
              <Text style={styles.infoValue}>{event.locationName}</Text>
              {event.locationAddress && <Text style={styles.infoSub}>{event.locationAddress}</Text>}
            </View>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={18} color={Colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Organisateur</Text>
              <Text style={styles.infoValue}>{event.organizerName}</Text>
            </View>
          </View>
          {event.capacity && (
            <>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <Ionicons name="people-outline" size={18} color={Colors.primary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Capacité</Text>
                  <View style={styles.capacityRow}>
                    <View style={styles.capacityBar}>
                      <View style={[styles.capacityFill, { width: `${capacityPercent}%`, backgroundColor: capacityPercent >= 100 ? Colors.error : Colors.primary }]} />
                    </View>
                    <Text style={styles.capacityText}>
                      {event.registeredCount}/{event.capacity}
                      {capacityPercent >= 100 ? ' (Complet)' : ''}
                    </Text>
                  </View>
                </View>
              </View>
            </>
          )}
        </View>

        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{event.description}</Text>
        </View>

        {event.tags && event.tags.length > 0 && (
          <View style={styles.tagsSection}>
            {event.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}

        <Button
          title={isRegistered ? 'Annuler mon inscription' : "S'inscrire"}
          onPress={handleRegister}
          variant={isRegistered ? 'secondary' : 'primary'}
          size="lg"
          style={{ marginTop: Spacing.xl }}
        />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  hero: { height: 280, position: 'relative' },
  heroImage: { width: '100%', height: 280 },
  heroPlaceholder: { width: '100%', height: 280, justifyContent: 'center', alignItems: 'center' },
  heroOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.3)' },
  backBtn: { position: 'absolute', top: 60, left: Spacing.lg, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  favHeroBtn: { position: 'absolute', top: 60, right: Spacing.lg, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  heroDateBadge: {
    position: 'absolute', bottom: Spacing.xl, left: Spacing.xl,
    backgroundColor: Colors.overlay,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  heroDateDay: { fontSize: 28, fontWeight: FontWeight.bold, color: Colors.textWhite, lineHeight: 30 },
  heroDateMonth: { fontSize: FontSize.subhead, fontWeight: FontWeight.semibold, color: Colors.textWhite, textTransform: 'uppercase' },
  content: { padding: Spacing.xl, paddingBottom: 60 },
  title: { fontSize: FontSize.heading, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  dateTime: { fontSize: FontSize.body, color: Colors.textSecondary, marginBottom: 2 },
  infoCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.xl, marginTop: Spacing.xl,
    ...Shadow.level1,
  },
  infoRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: FontSize.caption, fontWeight: FontWeight.semibold, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  infoValue: { fontSize: FontSize.body, fontWeight: FontWeight.medium, color: Colors.textPrimary, marginTop: 2 },
  infoSub: { fontSize: FontSize.caption, color: Colors.textSecondary, marginTop: 2 },
  infoDivider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: Spacing.md },
  capacityRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginTop: Spacing.sm },
  capacityBar: { flex: 1, height: 8, backgroundColor: Colors.borderLight, borderRadius: 4, overflow: 'hidden' },
  capacityFill: { height: '100%', borderRadius: 4 },
  capacityText: { fontSize: FontSize.label, fontWeight: FontWeight.semibold, color: Colors.textSecondary, width: 80, textAlign: 'right' },
  descriptionSection: { marginTop: Spacing.xl },
  sectionTitle: { fontSize: FontSize.subhead, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  description: { fontSize: FontSize.body, color: Colors.textSecondary, lineHeight: 22 },
  tagsSection: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.lg },
  tag: {
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1, borderColor: Colors.primaryBorder,
  },
  tagText: { fontSize: FontSize.caption, fontWeight: FontWeight.medium, color: Colors.primary },
})
