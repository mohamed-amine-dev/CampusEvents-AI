import { useState } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { createEvent } from '../../database/events'
import { generateId } from '../../utils/uuid'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing, Shadow } from '../../constants/theme'
import { TextField, Button, Chip } from '../../components/ui'

const CATEGORIES = ['Workshop', 'Talk', 'Club', 'Exam', 'Other']

export default function CreateEventScreen() {
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
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const errs: Record<string, string> = {}
    if (!form.title.trim()) errs.title = 'Le titre est requis'
    if (!form.description.trim()) errs.description = 'La description est requise'
    if (!form.startDate.trim()) errs.startDate = 'La date est requise'
    if (!form.startTime.trim()) errs.startTime = 'L\'heure est requise'
    if (!form.locationName.trim()) errs.locationName = 'Le lieu est requis'
    if (!form.organizerName.trim()) errs.organizerName = "L'organisateur est requis"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleCreate() {
    if (!validate()) return
    setLoading(true)

    const startDateTime = new Date(`${form.startDate}T${form.startTime}`)
    const endDateTime = form.endDate && form.endTime ? new Date(`${form.endDate}T${form.endTime}`) : undefined

    createEvent({
      id: generateId(),
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
      tags: [],
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
        <Text style={styles.headerTitle}>Nouvel événement</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
        <TextField label="Titre" value={form.title} onChangeText={(v) => updateField('title', v)} error={errors.title} placeholder="Titre de l'événement" />
        <TextField label="Description" value={form.description} onChangeText={(v) => updateField('description', v)} error={errors.description} placeholder="Description détaillée" multiline numberOfLines={4} />

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

        <TextField label="Lieu" value={form.locationName} onChangeText={(v) => updateField('locationName', v)} error={errors.locationName} placeholder="Nom du lieu" />
        <TextField label="Adresse (optionnel)" value={form.locationAddress} onChangeText={(v) => updateField('locationAddress', v)} placeholder="Adresse complète" />
        <TextField label="Organisateur" value={form.organizerName} onChangeText={(v) => updateField('organizerName', v)} error={errors.organizerName} placeholder="Nom de l'organisateur" />
        <TextField label="Capacité (optionnel)" value={form.capacity} onChangeText={(v) => updateField('capacity', v)} placeholder="Nombre de places" keyboardType="number-pad" />
        <TextField label="Image URL (optionnel)" value={form.imageUrl} onChangeText={(v) => updateField('imageUrl', v)} placeholder="https://..." keyboardType="url" />

        <Button title="Créer l'événement" onPress={handleCreate} loading={loading} size="lg" style={{ marginTop: Spacing.xl }} />
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
