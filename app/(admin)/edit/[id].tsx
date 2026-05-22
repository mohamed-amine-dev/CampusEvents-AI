import { useState, useEffect } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { getEventById, updateEvent } from '../../../database/events'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing, Shadow } from '../../../constants/theme'
import { TextField, Button, Chip } from '../../../components/ui'

const CATEGORIES = ['Workshop', 'Talk', 'Club', 'Exam', 'Other']

export default function EditEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Workshop',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    locationName: '',
    locationAddress: '',
    organizerName: '',
    capacity: '',
    imageUrl: '',
    tags: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!id) return
    const event = getEventById(id)
    if (!event) return

    const start = new Date(event.startDateTime)
    const end = event.endDateTime ? new Date(event.endDateTime) : null

    setForm({
      title: event.title,
      description: event.description,
      category: event.category,
      startDate: start.toISOString().split('T')[0],
      startTime: `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`,
      endDate: end ? end.toISOString().split('T')[0] : '',
      endTime: end ? `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}` : '',
      locationName: event.locationName,
      locationAddress: event.locationAddress || '',
      organizerName: event.organizerName,
      capacity: event.capacity !== undefined ? String(event.capacity) : '',
      imageUrl: event.imageUrl || '',
      tags: event.tags ? event.tags.join(', ') : '',
    })
  }, [id])

  function validate() {
    const errs: Record<string, string> = {}
    if (!form.title.trim()) errs.title = 'Le titre est requis'
    if (!form.description.trim()) errs.description = 'La description est requise'
    if (!form.startDate.trim()) errs.startDate = 'La date est requise'
    if (!form.startTime.trim()) errs.startTime = 'L\'heure est requise'
    if (!form.locationName.trim()) errs.locationName = 'Le lieu est requis'
    if (!form.organizerName.trim()) errs.organizerName = "L'organisateur est requis"

    if (form.capacity) {
      const cap = parseInt(form.capacity)
      if (isNaN(cap) || cap <= 0) errs.capacity = 'La capacité doit être un nombre positif'
    }

    if (form.startDate && form.startTime && form.endDate && form.endTime) {
      const startDateTime = new Date(`${form.startDate}T${form.startTime}`)
      const endDateTime = new Date(`${form.endDate}T${form.endTime}`)
      if (endDateTime <= startDateTime) {
        errs.endDate = 'La fin doit être après le début'
      }
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleUpdate() {
    if (!validate() || !id) return
    setLoading(true)

    const startDateTime = new Date(`${form.startDate}T${form.startTime}`)
    const endDateTime = form.endDate && form.endTime ? new Date(`${form.endDate}T${form.endTime}`) : undefined

    updateEvent({
      id,
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category as any,
      startDateTime: startDateTime.toISOString(),
      endDateTime: endDateTime?.toISOString(),
      locationName: form.locationName.trim(),
      locationAddress: form.locationAddress.trim() || undefined,
      organizerName: form.organizerName.trim(),
      capacity: form.capacity ? parseInt(form.capacity) : undefined,
      imageUrl: form.imageUrl.trim() || undefined,
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    })

    setLoading(false)
    router.back()
  }

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => { const next = { ...prev }; delete next[field]; return next })
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Modifier l'événement</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
        <TextField label="Titre" value={form.title} onChangeText={(v) => updateField('title', v)} error={errors.title} />
        <TextField label="Description" value={form.description} onChangeText={(v) => updateField('description', v)} error={errors.description} multiline numberOfLines={4} />

        <View style={styles.labelRow}>
          <Text style={styles.label}>Catégorie</Text>
        </View>
        <View style={styles.chipsRow}>
          {CATEGORIES.map((cat) => (
            <Chip key={cat} label={cat} selected={form.category === cat} onPress={() => updateField('category', cat)} />
          ))}
        </View>

        <View style={styles.row}>
          <TextField label="Date de début" value={form.startDate} onChangeText={(v) => updateField('startDate', v)} error={errors.startDate} placeholder="YYYY-MM-DD" style={{ flex: 1 }} />
          <TextField label="Heure" value={form.startTime} onChangeText={(v) => updateField('startTime', v)} error={errors.startTime} placeholder="HH:MM" style={{ width: 100 }} />
        </View>

        <View style={styles.row}>
          <TextField label="Date de fin (optionnel)" value={form.endDate} onChangeText={(v) => updateField('endDate', v)} placeholder="YYYY-MM-DD" style={{ flex: 1 }} />
          <TextField label="Heure" value={form.endTime} onChangeText={(v) => updateField('endTime', v)} placeholder="HH:MM" style={{ width: 100 }} />
        </View>

        <TextField label="Lieu" value={form.locationName} onChangeText={(v) => updateField('locationName', v)} error={errors.locationName} />
        <TextField label="Adresse (optionnel)" value={form.locationAddress} onChangeText={(v) => updateField('locationAddress', v)} />
        <TextField label="Organisateur" value={form.organizerName} onChangeText={(v) => updateField('organizerName', v)} error={errors.organizerName} />
        <TextField label="Capacité (optionnel)" value={form.capacity} onChangeText={(v) => updateField('capacity', v)} error={errors.capacity} keyboardType="number-pad" />
        <TextField label="Tags (optionnel)" value={form.tags} onChangeText={(v) => updateField('tags', v)} placeholder="IA, React, Atelier..." />
        <TextField label="Image URL (optionnel)" value={form.imageUrl} onChangeText={(v) => updateField('imageUrl', v)} keyboardType="url" />

        <Button title="Enregistrer les modifications" onPress={handleUpdate} loading={loading} size="lg" style={{ marginTop: Spacing.xl }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surface },
  backBtn: { width: 48, height: 48, borderRadius: BorderRadius.md, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  headerTitle: { fontSize: FontSize.subhead, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  form: { padding: Spacing.xl, gap: Spacing.md, paddingBottom: 120 },
  labelRow: { marginTop: Spacing.sm },
  label: { fontSize: FontSize.caption, fontWeight: FontWeight.semibold, color: Colors.textSecondary, letterSpacing: 1.5, marginLeft: Spacing.xs },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  row: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-end' },
})
