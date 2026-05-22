import { View, StyleSheet } from 'react-native'
import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../context/ThemeContext'
import { BorderRadius, Spacing } from '../../constants/theme'

export default function StudentLayout() {
  const { theme } = useTheme()
  const c = theme.colors

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: c.surface,
          borderTopWidth: 1,
          borderTopColor: c.border,
          height: 56,
        },
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.textMuted,
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="catalog"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <View style={styles.iconWrap}>
              <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <View style={styles.iconWrap}>
              <Ionicons name={focused ? 'heart' : 'heart-outline'} size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.aiTab, focused && { backgroundColor: c.primary }]}>
              <Ionicons name="flash" size={24} color={focused ? '#fff' : c.textMuted} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="registrations"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <View style={styles.iconWrap}>
              <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <View style={styles.iconWrap}>
              <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  iconWrap: { justifyContent: 'center', alignItems: 'center', height: '100%' },
  aiTab: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
})
