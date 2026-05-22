import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing, Shadow } from '../../constants/theme'
import { Button, TextField } from '../../components/ui'

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user?.name || '')

  async function handleSave() {
    if (!name.trim()) return
    await updateUser({ name: name.trim() })
    setEditing(false)
  }

  async function handleLogout() {
    Alert.alert(
      'Déconnexion',
      'Es-tu sûr de vouloir te déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: async () => {
            await logout()
            // _layout.tsx watches user state and redirects to '/' automatically
          },
        },
      ]
    )
  }

  if (!user) return null

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Profil</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color={Colors.textWhite} />
          </View>
          {editing ? (
            <TextField
              value={name}
              onChangeText={setName}
              placeholder="Votre nom"
              style={{ width: 200, textAlign: 'center', height: 44 }}
            />
          ) : (
            <Text style={styles.name}>{user.name}</Text>
          )}
          <Text style={styles.email}>{user.email}</Text>
          <View style={styles.roleBadge}>
            <Ionicons name={user.role === 'admin' ? 'shield' : 'school'} size={14} color={Colors.textWhite} />
            <Text style={styles.roleText}>{user.role === 'admin' ? 'Admin' : 'Étudiant'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Préférences</Text>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name={isDark ? 'moon' : 'sunny'} size={22} color={Colors.textPrimary} />
              <Text style={styles.rowText}>Mode sombre</Text>
            </View>
            <TouchableOpacity style={[styles.toggle, isDark && styles.toggleActive]} onPress={toggleTheme}>
              <View style={[styles.toggleDot, isDark && styles.toggleDotActive]} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.actions}>
          {editing ? (
            <View style={{ flexDirection: 'row', gap: Spacing.md }}>
              <Button title="Annuler" variant="secondary" onPress={() => { setEditing(false); setName(user.name) }} style={{ flex: 1 }} />
              <Button title="Enregistrer" onPress={handleSave} style={{ flex: 1 }} />
            </View>
          ) : (
            <Button title="Modifier le profil" variant="secondary" onPress={() => setEditing(true)} />
          )}
          <Button title="Se déconnecter" variant="danger" onPress={handleLogout} />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg },
  title: { fontSize: FontSize.heading, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  content: { padding: Spacing.xl, gap: Spacing.xxl },
  avatarSection: { alignItems: 'center', gap: Spacing.md },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
    ...Shadow.level2,
  },
  name: { fontSize: FontSize.title, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  email: { fontSize: FontSize.body, color: Colors.textSecondary },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  roleText: { fontSize: FontSize.caption, fontWeight: FontWeight.semibold, color: Colors.textWhite },
  section: { gap: Spacing.md },
  sectionTitle: { fontSize: FontSize.label, fontWeight: FontWeight.bold, color: Colors.textSecondary, letterSpacing: 1.5, textTransform: 'uppercase' },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.surface, padding: Spacing.lg,
    borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  rowText: { fontSize: FontSize.body, fontWeight: FontWeight.medium, color: Colors.textPrimary },
  toggle: {
    width: 48, height: 28, borderRadius: 14,
    backgroundColor: Colors.border, justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleActive: { backgroundColor: Colors.primary },
  toggleDot: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: Colors.textWhite,
    ...Shadow.level1,
  },
  toggleDotActive: { alignSelf: 'flex-end' },
  actions: { gap: Spacing.md, marginTop: Spacing.xl },
})
