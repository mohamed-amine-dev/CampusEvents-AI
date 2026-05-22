import { Stack } from 'expo-router'

export default function AdminLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="events" />
      <Stack.Screen name="create" />
      <Stack.Screen name="edit/[id]" />
    </Stack>
  )
}
