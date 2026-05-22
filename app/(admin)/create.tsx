import { v4 as uuidv4 } from 'uuid'
import { useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { EventForm } from '../../components/EventForm'
import { useTheme } from '../../context/ThemeContext'
import { createEvent } from '../../database/events'
import { EventFormData } from '../../types'

export default function CreateEvent() {
  const { theme } = useTheme()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = (data: EventFormData) => {
    setLoading(true)
    try {
      createEvent({
        id: uuidv4(),
        title: data.title,
        description: data.description,
        category: data.category,
        startDateTime: data.startDateTime.toISOString(),
        endDateTime: data.endDateTime?.toISOString(),
        locationName: data.locationName,
        locationAddress: data.locationAddress,
        organizerName: data.organizerName,
        capacity: data.capacity ? parseInt(data.capacity, 10) : undefined,
        registeredCount: 0,
        tags: data.tags,
        createdAt: new Date().toISOString(),
      })
      router.back()
    } catch (e) {
      console.warn(e)
    }
    setLoading(false)
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <EventForm onSubmit={handleSubmit} onCancel={() => router.back()} loading={loading} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
})
