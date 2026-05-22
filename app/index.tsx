import { useState, useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Animated } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../context/AuthContext'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing, Shadow, SCREEN } from '../constants/theme'
import { TextField, Button } from '../components/ui'

export default function LoginScreen() {
  const { user, isLoading, login } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('etudiant@campus.ma')
  const [password, setPassword] = useState('etudiant123')
  const [error, setError] = useState('')
  const [selectedRole, setSelectedRole] = useState<'student' | 'admin'>('student')
  const [showPassword, setShowPassword] = useState(false)
  const insets = useSafeAreaInsets()

  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start()
  }, [])

  useEffect(() => {
    if (user) {
      router.replace(user.role === 'admin' ? '/(admin)/events' : '/(student)/catalog')
    }
  }, [user])

  useEffect(() => {
    if (selectedRole === 'admin') {
      setEmail('admin@campus.ma'); setPassword('admin123')
    } else {
      setEmail('etudiant@campus.ma'); setPassword('etudiant123')
    }
  }, [selectedRole])

  async function handleLogin() {
    setError('')
    const result = await login(email, password)
    if (!result.success) setError(result.error || 'Erreur de connexion')
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    )
  }

  if (user) return null

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Animated.View style={[styles.content, { paddingTop: insets.top + (SCREEN.isSmall ? Spacing.xl : Spacing.xxxl), paddingBottom: insets.bottom + Spacing.lg, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.logoSection}>
          <View style={styles.logoOuter}>
            <View style={styles.logoInner}>
              <Ionicons name="flash" size={24} color={Colors.textWhite} />
            </View>
          </View>
          <Text style={[styles.title, SCREEN.isSmall && { fontSize: 30, lineHeight: 36 }]}>
            Campus{'\n'}
            <Text style={styles.titleAccent}>Events.ai</Text>
          </Text>
          <Text style={styles.subtitle}>L'expérience de demain.</Text>
        </View>

        <View style={styles.form}>
          <TextField placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <View style={styles.passwordWrap}>
            <TextField placeholder="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
            <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color={Colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          <Button title="Commencer" onPress={handleLogin} size="lg" />
        </View>

        <View style={styles.roleToggleContainer}>
          <View style={styles.roleToggle}>
            {(['admin', 'student'] as const).map((role) => (
              <TouchableOpacity
                key={role}
                style={[styles.roleButton, selectedRole === role && styles.roleButtonActive]}
                onPress={() => setSelectedRole(role)}
              >
                <Text style={[styles.roleButtonText, selectedRole === role && styles.roleButtonTextActive]}>
                  {role === 'admin' ? 'Admin' : 'Étudiant'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  content: { flex: 1, paddingHorizontal: Spacing.xxl, justifyContent: 'space-between' },
  logoSection: { marginBottom: SCREEN.isSmall ? Spacing.xl : Spacing.xxxl },
  logoOuter: {
    width: 64, height: 64, borderRadius: BorderRadius.lg, backgroundColor: Colors.surface,
    ...Shadow.level1, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.lg,
    transform: [{ rotate: '-3deg' }], borderWidth: 1, borderColor: Colors.border,
  },
  logoInner: { width: 48, height: 48, borderRadius: BorderRadius.md, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.primary },
  title: { fontSize: 34, fontWeight: FontWeight.bold, color: Colors.textPrimary, lineHeight: 40, marginBottom: Spacing.xs },
  titleAccent: { color: Colors.primary },
  subtitle: { fontSize: FontSize.body, fontWeight: FontWeight.medium, color: Colors.textSecondary },
  form: { gap: Spacing.md },
  passwordWrap: { position: 'relative' },
  eyeButton: { position: 'absolute', right: Spacing.lg, top: 18 },
  errorContainer: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.xs },
  errorText: { color: Colors.error, fontSize: FontSize.caption, fontWeight: FontWeight.semibold },
  roleToggleContainer: { marginTop: 'auto' },
  roleToggle: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.xs, borderWidth: 1, borderColor: Colors.border },
  roleButton: { flex: 1, paddingVertical: Spacing.sm, borderRadius: BorderRadius.sm, alignItems: 'center' },
  roleButtonActive: { backgroundColor: Colors.primary },
  roleButtonText: { fontSize: FontSize.label, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  roleButtonTextActive: { color: Colors.textWhite },
})
