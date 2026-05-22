import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native'
import { Card } from './ui/Card'
import { Badge } from './ui/Badge'
import { useTheme } from '../context/ThemeContext'
import { Event } from '../types'
import { useAuth } from '../context/AuthContext'
import { isFavorite, addFavorite, removeFavorite } from '../database/favorites'
import { getRegistration } from '../database/registrations'
import { useState } from 'react'

interface EventCardProps {
  event: Event
  onPress: () => void
}

const CATEGORY_COLORS: Record<string, string> = {
  Talk: '#3B82F6',
  Workshop: '#10B981',
  Club: '#F59E0B',
  Exam: '#EF4444',
  Other: '#8B5CF6',
}

export function EventCard({ event, onPress }: EventCardProps) {
  const { theme } = useTheme()
  const { user } = useAuth()
  const [fav, setFav] = useState(() => user ? isFavorite(event.id, user.email) : false)
  const [imgError, setImgError] = useState(false)

  const startDate = new Date(event.startDateTime)
  const isPast = startDate < new Date()
  const isFull = event.capacity ? event.registeredCount >= event.capacity : false
  const isRegistered = user ? !!getRegistration(event.id, user.email) : false

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

  const day = startDate.getDate().toString().padStart(2, '0')
  const month = startDate.toLocaleDateString('fr-FR', { month: 'short' })
  const time = startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  return (
    <Card onPress={onPress} padded={false} style={styles.card}>
      {event.imageUrl && !imgError ? (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: event.imageUrl }}
            style={styles.image}
            onError={() => setImgError(true)}
          />
          <View style={[styles.imageOverlay, { backgroundColor: theme.dark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.3)' }]}>
            <View style={[styles.dateBadge, { backgroundColor: theme.colors.primaryLight }]}>
              <Text style={[styles.dayText, { color: theme.colors.primary }]}>{day}</Text>
              <Text style={[styles.monthText, { color: theme.colors.primary }]}>{month}</Text>
            </View>
          </View>
          {user && (
            <TouchableOpacity onPress={toggleFav} style={styles.favBtn} hitSlop={12}>
              <Text style={{ fontSize: 22 }}>{fav ? '❤️' : '🤍'}</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.headerRow}>
          <View style={[styles.dateBox, { backgroundColor: theme.colors.primaryLight }]}>
            <Text style={[styles.day, { color: theme.colors.primary }]}>{day}</Text>
            <Text style={[styles.month, { color: theme.colors.primary }]}>{month}</Text>
          </View>
          {user && (
            <TouchableOpacity onPress={toggleFav} hitSlop={8} style={styles.favInline}>
              <Text style={{ fontSize: 18 }}>{fav ? '❤️' : '🤍'}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.body}>
        <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
          {event.title}
        </Text>

        <View style={styles.metaRow}>
          <Badge label={event.category} color={CATEGORY_COLORS[event.category]} />
          {isPast && <Badge label="Passé" color={theme.colors.textSecondary} />}
          {isFull && !isPast && <Badge label="Complet" color={theme.colors.error} />}
          {isRegistered && <Badge label="Inscrit" color={theme.colors.success} />}
        </View>

        <View style={styles.details}>
          <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
            🕒 {time}
          </Text>
          <Text style={[styles.detailText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
            📍 {event.locationName}
          </Text>
        </View>

        {event.capacity && (
          <View style={styles.capacityBar}>
            <View style={[styles.capacityBg, { backgroundColor: theme.colors.border }]}>
              <View
                style={[
                  styles.capacityFill,
                  {
                    backgroundColor: isFull ? theme.colors.error : theme.colors.success,
                    width: `${Math.min(100, (event.registeredCount / event.capacity) * 100)}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.capacityText, { color: theme.colors.textSecondary }]}>
              {event.registeredCount}/{event.capacity}
            </Text>
          </View>
        )}
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 160,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  dateBadge: {
    width: 64,
    height: 72,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 24,
    fontWeight: '800',
  },
  monthText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  favBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 0,
  },
  dateBox: {
    width: 56,
    height: 64,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favInline: {
    marginLeft: 'auto',
    padding: 4,
  },
  body: {
    padding: 16,
  },
  day: {
    fontSize: 20,
    fontWeight: '800',
  },
  month: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 6,
  },
  details: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 6,
  },
  detailText: {
    fontSize: 12,
  },
  capacityBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  capacityBg: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  capacityFill: {
    height: '100%',
    borderRadius: 2,
  },
  capacityText: {
    fontSize: 11,
    fontWeight: '500',
  },
})
