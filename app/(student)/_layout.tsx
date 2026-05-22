import { Tabs } from 'expo-router'
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { DarkModeToggle } from '../../components/DarkModeToggle'

export default function StudentLayout() {
  const { theme } = useTheme()
  const { logout, user } = useAuth()

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: theme.colors.tabBarBackground,
          borderTopColor: theme.colors.tabBarBorder,
          borderTopWidth: 0.5,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
          elevation: 0,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.text,
        headerTitleStyle: { fontWeight: '700' },
        headerRight: () => (
          <View style={styles.headerRight}>
            <DarkModeToggle />
            <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
              <Text style={[styles.logoutText, { color: theme.colors.error }]}>Déconnexion</Text>
            </TouchableOpacity>
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="events"
        options={{
          title: 'Événements',
          tabBarIcon: ({ color, size }) => <Text style={{ fontSize: size - 4 }}>📅</Text>,
          headerTitle: 'CampusEvents',
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favoris',
          tabBarIcon: ({ color, size }) => <Text style={{ fontSize: size - 4 }}>❤️</Text>,
        }}
      />
      <Tabs.Screen
        name="registrations"
        options={{
          title: 'Inscriptions',
          tabBarIcon: ({ color, size }) => <Text style={{ fontSize: size - 4 }}>📋</Text>,
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          title: 'Assistant',
          tabBarIcon: ({ color, size }) => <Text style={{ fontSize: size - 4 }}>🤖</Text>,
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginRight: 12,
  },
  logoutBtn: {
    paddingHorizontal: 4,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '600',
  },
})
