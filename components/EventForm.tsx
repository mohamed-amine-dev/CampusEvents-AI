import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform } from 'react-native'
import { Input } from './ui/Input'
import { Button } from './ui/Button'
import { Chip } from './ui/Chip'
import { useTheme } from '../context/ThemeContext'
import { Category, EventFormData } from '../types'
import { useState } from 'react'

const CATEGORIES: Category[] = ['Talk', 'Workshop', 'Club', 'Exam', 'Other']

interface EventFormProps {
  initialData?: Partial<EventFormData>
  onSubmit: (data: EventFormData) => void
  onCancel: () => void
  loading?: boolean
}

export function EventForm({ initialData, onSubmit, onCancel, loading }: EventFormProps) {
  const { theme } = useTheme()
  const [title, setTitle] = useState(initialData?.title ?? '')
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [category, setCategory] = useState<Category>(initialData?.category ?? 'Talk')
  const [startDate, setStartDate] = useState(
    initialData?.startDateTime
      ? initialData.startDateTime.toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  )
  const [startTime, setStartTime] = useState(
    initialData?.startDateTime
      ? initialData.startDateTime.toTimeString().slice(0, 5)
      : '09:00'
  )
  const [endDate, setEndDate] = useState(
    initialData?.endDateTime
      ? initialData.endDateTime.toISOString().split('T')[0]
      : ''
  )
  const [endTime, setEndTime] = useState(
    initialData?.endDateTime
      ? initialData.endDateTime.toTimeString().slice(0, 5)
      : ''
  )
  const [locationName, setLocationName] = useState(initialData?.locationName ?? '')
  const [locationAddress, setLocationAddress] = useState(initialData?.locationAddress ?? '')
  const [organizerName, setOrganizerName] = useState(initialData?.organizerName ?? '')
  const [capacity, setCapacity] = useState(initialData?.capacity ?? '')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? [])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!title.trim()) newErrors.title = 'Le titre est requis'
    if (!description.trim()) newErrors.description = 'La description est requise'
    if (!startDate.trim()) newErrors.startDate = 'La date est requise'
    if (!startTime.trim()) newErrors.startTime = 'L\'heure est requise'
    if (!locationName.trim()) newErrors.locationName = 'Le lieu est requis'
    if (!organizerName.trim()) newErrors.organizerName = 'L\'organisateur est requis'

    if (endDate && endTime) {
      const start = new Date(`${startDate}T${startTime}`)
      const end = new Date(`${endDate}T${endTime}`)
      if (end <= start) {
        newErrors.endDate = 'La date de fin doit être postérieure à la date de début'
      }
    }

    if (capacity.trim()) {
      const capNum = parseInt(capacity, 10)
      if (isNaN(capNum) || capNum <= 0 || !Number.isInteger(capNum)) {
        newErrors.capacity = 'La capacité doit être un entier positif'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return

    const startDateTime = new Date(`${startDate}T${startTime}`)
    let endDateTime: Date | undefined
    if (endDate && endTime) {
      endDateTime = new Date(`${endDate}T${endTime}`)
    }

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      category,
      startDateTime,
      endDateTime,
      locationName: locationName.trim(),
      locationAddress: locationAddress.trim() || undefined,
      organizerName: organizerName.trim(),
      capacity: capacity.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
    })
  }

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) {
      setTags([...tags, t])
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
      <Input label="Titre *" value={title} onChangeText={setTitle} error={errors.title} placeholder="Ex: Introduction au ML" />

      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: theme.colors.text }]}>Description *</Text>
        <View style={[styles.textArea, { backgroundColor: theme.colors.inputBackground, borderColor: errors.description ? theme.colors.error : theme.colors.border }]}>
          <View style={styles.textAreaInput}>
            <Input
              value={description}
              onChangeText={setDescription}
              placeholder="Décrivez votre événement..."
              multiline
              numberOfLines={4}
              error={errors.description}
              style={{ minHeight: 100, textAlignVertical: 'top' }}
            />
          </View>
        </View>
      </View>

      <Text style={[styles.label, { color: theme.colors.text }]}>Catégorie *</Text>
      <View style={styles.chipsRow}>
        {CATEGORIES.map((cat) => (
          <Chip key={cat} label={cat} selected={category === cat} onPress={() => setCategory(cat)} />
        ))}
      </View>

      <View style={styles.dateRow}>
        <View style={styles.halfField}>
          <Input label="Date début *" value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" error={errors.startDate} />
        </View>
        <View style={styles.halfField}>
          <Input label="Heure début *" value={startTime} onChangeText={setStartTime} placeholder="HH:MM" error={errors.startTime} />
        </View>
      </View>

      <View style={styles.dateRow}>
        <View style={styles.halfField}>
          <Input label="Date fin" value={endDate} onChangeText={setEndDate} placeholder="YYYY-MM-DD" error={errors.endDate} />
        </View>
        <View style={styles.halfField}>
          <Input label="Heure fin" value={endTime} onChangeText={setEndTime} placeholder="HH:MM" />
        </View>
      </View>

      <Input label="Lieu *" value={locationName} onChangeText={setLocationName} error={errors.locationName} placeholder="Ex: Salle 103" />
      <Input label="Adresse" value={locationAddress} onChangeText={setLocationAddress} placeholder="Ex: Bâtiment A, 1er étage" />
      <Input label="Organisateur" value={organizerName} onChangeText={setOrganizerName} placeholder="Ex: Club IA" />
      <Input label="Capacité maximale" value={capacity} onChangeText={setCapacity} placeholder="Ex: 30" keyboardType="numeric" error={errors.capacity} />

      <Text style={[styles.label, { color: theme.colors.text }]}>Tags</Text>
      <View style={styles.tagInputRow}>
        <View style={{ flex: 1 }}>
          <Input value={tagInput} onChangeText={setTagInput} placeholder="Ajouter un tag" />
        </View>
        <Button title="+" onPress={addTag} size="sm" style={{ height: 48, width: 48 }} />
      </View>
      <View style={styles.tagsRow}>
        {tags.map((tag) => (
          <TouchableOpacity key={tag} onPress={() => removeTag(tag)}>
            <Chip label={`${tag} ✕`} selected />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.buttons}>
        <Button title="Annuler" onPress={onCancel} variant="secondary" style={{ flex: 1, marginRight: 8 }} />
        <Button title={initialData ? 'Modifier' : 'Créer'} onPress={handleSubmit} loading={loading} style={{ flex: 1, marginLeft: 8 }} />
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 4,
  },
  fieldGroup: {
    marginBottom: 8,
  },
  textArea: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    marginBottom: 4,
  },
  textAreaInput: {
    marginBottom: -12,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  tagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  buttons: {
    flexDirection: 'row',
    marginTop: 16,
  },
})
