import { useState, useEffect } from 'react'
import { View, Text, ScrollView, StyleSheet, Alert, Image, Dimensions, TouchableOpacity } from 'react-native'
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

const { width } = Dimensions.get('window')

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
  const [imgError, setImgError] = useState(false)

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
      <Stack.Screen options={{ headerTitle: '', headerRight: () => <DarkModeToggle /> }} />
      <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {event.imageUrl && !imgError ? (
          <View style={styles.imageHero}>
            <Image
              source={{ uri: event.imageUrl }}
              style={styles.heroImage}
              onError={() => setImgError(true)}
            />
            <View style={[styles.heroOverlay, { backgroundColor: theme.dark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.4)' }]}>
              <View style={[styles.heroDateBadge, { backgroundColor: theme.colors.primaryLight }]}>
                <Text style={[styles.heroDay, { color: theme.colors.primary }]}>{startDate.getDate()}</Text>
                <Text style={[styles.heroMonth, { color: theme.colors.primary }]}>
                  {startDate.toLocaleDateString('fr-FR', { month: 'long' })}
                </Text>
              </View>
              {user?.role === 'student' && (
                <TouchableOpacity onPress={toggleFav} style={styles.heroFav} hitSlop={12}>
                  <Text style={{ fontSize: 28 }}>{fav ? '❤️' : '🤍'}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          <View style={[styles.heroFallback, { backgroundColor: theme.colors.primaryLight }]}>
            <View style={[styles.heroDateBadge, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.heroDay, { color: theme.colors.primary }]}>{startDate.getDate()}</Text>
              <Text style={[styles.heroMonth, { color: theme.colors.primary }]}>
                {startDate.toLocaleDateString('fr-FR', { month: 'long' })}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.content}>
          <View style={styles.titleSection}>
            <Text style={[styles.title, { color: theme.colors.text }]}>{event.title}</Text>
            <View style={styles.metaRow}>
              <Badge label={event.category} color={CATEGORY_COLORS[event.category]} />
              {isPast && <Badge label="Passé" color={theme.colors.textSecondary} />}
              {isFull && !isPast && <Badge label="Complet" color={theme.colors.error} />}
            </View>
          </View>

          <Card style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📅</Text>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Date</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>{dateStr}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>🕒</Text>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Horaire</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                  {startStr}{endStr ? ` - ${endStr}` : ''}
                </Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📍</Text>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Lieu</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>{event.locationName}</Text>
                {event.locationAddress && (
                  <Text style={[styles.infoSub, { color: theme.colors.textSecondary }]}>{event.locationAddress}</Text>
                )}
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>👤</Text>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Organisateur</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>{event.organizerName}</Text>
              </View>
            </View>
            {event.capacity && (
              <>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoIcon}>👥</Text>
                  <View style={styles.infoContent}>
                    <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Capacité</Text>
                    <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                      {event.registeredCount}/{event.capacity} inscrits
                    </Text>
                    {event.capacity && (
                      <View style={styles.capacityMiniBar}>
                        <View style={[styles.capacityMiniBg, { backgroundColor: theme.colors.border }]}>
                          <View
                            style={[
                              styles.capacityMiniFill,
                              {
                                backgroundColor: isFull ? theme.colors.error : theme.colors.success,
                                width: `${Math.min(100, (event.registeredCount / event.capacity) * 100)}%`,
                              },
                            ]}
                          />
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              </>
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
  imageHero: {
    position: 'relative',
  },
  heroImage: {
    width,
    height: 280,
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroDateBadge: {
    width: 90,
    height: 100,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroDay: {
    fontSize: 32,
    fontWeight: '800',
  },
  heroMonth: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  heroFav: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroFallback: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  titleSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 8,
    lineHeight: 32,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 6,
  },
  infoCard: {
    marginBottom: 20,
    padding: 0,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 14,
    width: 28,
    textAlign: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  infoSub: {
    fontSize: 13,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 14,
    opacity: 0.5,
  },
  capacityMiniBar: {
    marginTop: 6,
  },
  capacityMiniBg: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  capacityMiniFill: {
    height: '100%',
    borderRadius: 2,
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
