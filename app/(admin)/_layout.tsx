import { Stack } from 'expo-router'
import { TouchableOpacity, Text, View, StyleSheet, Platform } from 'react-native'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { DarkModeToggle } from '../../components/DarkModeToggle'

export default function AdminLayout() {
  const { theme } = useTheme()
  const { logout } = useAuth()

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.text,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Gestion Événements',
          headerRight: () => (
            <View style={styles.headerRight}>
              <DarkModeToggle />
              <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                <Text style={[styles.logoutText, { color: theme.colors.error }]}>Déconnexion</Text>
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <Stack.Screen
        name="create"
        options={{
          title: 'Créer un événement',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="edit/[id]"
        options={{
          title: 'Modifier l\'événement',
          presentation: 'modal',
        }}
      />
    </Stack>
  )
}

const styles = StyleSheet.create({
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoutBtn: {
    paddingHorizontal: 8,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '600',
  },
})
