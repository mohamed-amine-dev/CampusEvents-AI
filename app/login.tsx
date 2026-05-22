import { useState } from 'react'
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Animated } from 'react-native'
import { useRouter } from 'expo-router'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { DarkModeToggle } from '../components/DarkModeToggle'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'

export default function LoginScreen() {
  const { theme, isDark } = useTheme()
  const { login } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [fadeAnim] = useState(() => new Animated.Value(0))

  useState(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start()
  })

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Veuillez remplir tous les champs')
      return
    }
    setLoading(true)
    setError('')
    const result = await login(email, password)
    setLoading(false)
    if (!result.success) {
      setError(result.error || 'Erreur de connexion')
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.toggleContainer}>
          <DarkModeToggle />
        </View>

        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <View style={[styles.logoContainer, { backgroundColor: theme.colors.primaryLight }]}>
            <Text style={styles.logo}>🎓</Text>
          </View>
          <Text style={[styles.title, { color: theme.colors.text }]}>CampusEvents</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Votre agenda intelligent
          </Text>

          <View style={styles.form}>
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="admin@campus.ma"
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
            />
            <Input
              label="Mot de passe"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
            />

            {error ? (
              <View style={[styles.errorBox, { backgroundColor: theme.colors.error + '15', borderColor: theme.colors.error + '30' }]}>
                <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
              </View>
            ) : null}

            <Button title="Se connecter" onPress={handleLogin} loading={loading} size="lg" style={{ width: '100%', marginTop: 8 }} />

            <View style={[styles.divider, { borderColor: theme.colors.border }]} />
            <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>
              Comptes de démonstration :
            </Text>
            <View style={styles.demoAccounts}>
              <View style={[styles.demoRow, { backgroundColor: theme.colors.inputBackground }]}>
                <Text style={[styles.demoRole, { color: theme.colors.primary }]}>Admin</Text>
                <Text style={[styles.demoCreds, { color: theme.colors.textSecondary }]}>admin@campus.ma / admin123</Text>
              </View>
              <View style={[styles.demoRow, { backgroundColor: theme.colors.inputBackground }]}>
                <Text style={[styles.demoRole, { color: theme.colors.success }]}>Étudiant</Text>
                <Text style={[styles.demoCreds, { color: theme.colors.textSecondary }]}>etudiant@campus.ma / etudiant123</Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toggleContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 24,
    zIndex: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  logo: {
    fontSize: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 40,
  },
  form: {
    width: '100%',
  },
  errorBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 13,
    textAlign: 'center',
  },
  divider: {
    borderTopWidth: 1,
    marginVertical: 24,
  },
  hint: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
  },
  demoAccounts: {
    gap: 8,
  },
  demoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    gap: 10,
  },
  demoRole: {
    fontSize: 12,
    fontWeight: '700',
    minWidth: 56,
  },
  demoCreds: {
    fontSize: 11,
    flex: 1,
  },
})
