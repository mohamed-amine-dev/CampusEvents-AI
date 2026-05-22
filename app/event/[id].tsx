import { useState, useEffect } from 'react'
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native'
import { useRouter, useLocalSearchParams, Stack } from 'expo-router'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorState } from '../../components/ui/ErrorState'
import { DarkModeToggle } from '../../components/DarkModeToggle'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { getEventById } from '../../database/events'
import { registerForEvent, cancelRegistration, getRegistration } from '../../database/registrations'
import { addFavorite, removeFavorite, isFavorite } from '../../database/favorites'
import { Event } from '../../types'

const CATEGORY_COLORS: Record<string, string> = {
  Talk: '#3B82F6',
  Workshop: '#10B981',
  Club: '#F59E0B',
  Exam: '#EF4444',
  Other: '#8B5CF6',
}

export default function EventDetail() {
  const { theme } = useTheme()
  const { user } = useAuth()
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [event, setEvent] = useState<Event | undefined>(getEventById(id))
  const [registered, setRegistered] = useState(false)
  const [fav, setFav] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (event && user) {
      setRegistered(!!getRegistration(event.id, user.email))
      setFav(isFavorite(event.id, user.email))
    }
  }, [event, user])

  if (!event) {
    return <ErrorState message="Événement introuvable" onRetry={() => router.back()} />
  }

  const startDate = new Date(event.startDateTime)
  const endDate = event.endDateTime ? new Date(event.endDateTime) : null
  const isPast = startDate < new Date()
  const isFull = event.capacity ? event.registeredCount >= event.capacity : false

  const handleRegister = async () => {
    if (!user) return
    setLoading(true)
    if (registered) {
      cancelRegistration(event.id, user.email)
      setRegistered(false)
    } else {
      const result = registerForEvent(event.id, user.email)
      if (!result.success) {
        Alert.alert('Erreur', result.error)
        setLoading(false)
        return
      }
      setRegistered(true)
    }
    setEvent(getEventById(event.id))
    setLoading(false)
  }

  const toggleFav = () => {
    if (!user) return
    if (fav) {
      removeFavorite(event.id, user.email)
      setFav(false)
    } else {
      addFavorite(event.id, user.email)
      setFav(true)
    }
  }

  const dateStr = startDate.toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  const startStr = startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const endStr = endDate?.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  return (
    <>
      <Stack.Screen options={{ headerTitle: event.title, headerRight: () => <DarkModeToggle /> }} />
      <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.hero}>
          <View style={[styles.dateBadge, { backgroundColor: theme.colors.primaryLight }]}>
            <Text style={[styles.dayBig, { color: theme.colors.primary }]}>{startDate.getDate()}</Text>
            <Text style={[styles.monthBig, { color: theme.colors.primary }]}>
              {startDate.toLocaleDateString('fr-FR', { month: 'long' })}
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: theme.colors.text }]}>{event.title}</Text>
            {user?.role === 'student' && (
              <Button title={fav ? '❤️' : '🤍'} onPress={toggleFav} variant="ghost" size="sm" />
            )}
          </View>

          <View style={styles.metaRow}>
            <Badge label={event.category} color={CATEGORY_COLORS[event.category]} />
            {isPast && <Badge label="Passé" color={theme.colors.textSecondary} />}
            {isFull && !isPast && <Badge label="Complet" color={theme.colors.error} />}
          </View>

          <Card style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📅</Text>
              <View>
                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Date</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>{dateStr}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>🕒</Text>
              <View>
                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Horaire</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                  {startStr}{endStr ? ` - ${endStr}` : ''}
                </Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📍</Text>
              <View>
                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Lieu</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>{event.locationName}</Text>
                {event.locationAddress && (
                  <Text style={[styles.infoSub, { color: theme.colors.textSecondary }]}>{event.locationAddress}</Text>
                )}
              </View>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>👤</Text>
              <View>
                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Organisateur</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>{event.organizerName}</Text>
              </View>
            </View>
            {event.capacity && (
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>👥</Text>
                <View>
                  <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Capacité</Text>
                  <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                    {event.registeredCount}/{event.capacity} inscrits
                  </Text>
                </View>
              </View>
            )}
          </Card>

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Description</Text>
          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
            {event.description}
          </Text>

          {event.tags && event.tags.length > 0 && (
            <View style={styles.tagsSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Tags</Text>
              <View style={styles.tagsRow}>
                {event.tags.map((tag: string) => (
                  <Badge key={tag} label={tag} />
                ))}
              </View>
            </View>
          )}

          {user?.role === 'student' && !isPast && (
            <Button
              title={registered ? 'Annuler l\'inscription' : isFull ? 'Complet' : 'S\'inscrire'}
              onPress={handleRegister}
              disabled={isFull && !registered}
              loading={loading}
              variant={registered ? 'secondary' : 'primary'}
              size="lg"
              style={styles.registerBtn}
            />
          )}
        </View>
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  dateBadge: {
    width: 100,
    height: 100,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayBig: {
    fontSize: 36,
    fontWeight: '800',
  },
  monthBig: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 20,
  },
  infoCard: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  infoIcon: {
    fontSize: 18,
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 1,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  infoSub: {
    fontSize: 13,
    marginTop: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 4,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 16,
  },
  tagsSection: {
    marginBottom: 24,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  registerBtn: {
    width: '100%',
    marginTop: 8,
  },
})
