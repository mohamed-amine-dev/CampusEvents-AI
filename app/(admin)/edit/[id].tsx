import { useState, useEffect } from 'react'
import { View, StyleSheet } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { EventForm } from '../../../components/EventForm'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'
import { ErrorState } from '../../../components/ui/ErrorState'
import { useTheme } from '../../../context/ThemeContext'
import { getEventById, updateEvent } from '../../../database/events'
import { EventFormData } from '../../../types'

export default function EditEvent() {
  const { theme } = useTheme()
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [event, setEvent] = useState(getEventById(id))
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (id) {
      setEvent(getEventById(id))
    }
  }, [id])

  if (!event) {
    return <ErrorState message="Événement introuvable" onRetry={() => router.back()} />
  }

  const initialData: EventFormData = {
    title: event.title,
    description: event.description,
    category: event.category,
    startDateTime: new Date(event.startDateTime),
    endDateTime: event.endDateTime ? new Date(event.endDateTime) : undefined,
    locationName: event.locationName,
    locationAddress: event.locationAddress,
    organizerName: event.organizerName,
    capacity: event.capacity?.toString(),
    tags: event.tags,
  }

  const handleSubmit = (data: EventFormData) => {
    setLoading(true)
    try {
      updateEvent({
        ...event,
        title: data.title,
        description: data.description,
        category: data.category,
        startDateTime: data.startDateTime.toISOString(),
        endDateTime: data.endDateTime?.toISOString(),
        locationName: data.locationName,
        locationAddress: data.locationAddress,
        organizerName: data.organizerName,
        capacity: data.capacity ? parseInt(data.capacity, 10) : undefined,
        tags: data.tags,
      })
      router.back()
    } catch (e) {
      console.warn(e)
    }
    setLoading(false)
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <EventForm initialData={initialData} onSubmit={handleSubmit} onCancel={() => router.back()} loading={loading} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
})
