import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
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
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.dateBox, { backgroundColor: theme.colors.primaryLight }]}>
          <Text style={[styles.day, { color: theme.colors.primary }]}>{day}</Text>
          <Text style={[styles.month, { color: theme.colors.primary }]}>{month}</Text>
        </View>
        <View style={styles.info}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
              {event.title}
            </Text>
            <TouchableOpacity onPress={toggleFav} hitSlop={8}>
              <Text style={{ fontSize: 18 }}>{fav ? '❤️' : '🤍'}</Text>
            </TouchableOpacity>
          </View>
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
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
  },
  dateBox: {
    width: 56,
    height: 64,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
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
  info: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
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
    marginBottom: 4,
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
