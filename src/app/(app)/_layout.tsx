import { Stack } from 'expo-router';

export default function AuthenticatedLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
    <Stack.Screen name="(tabs)" />
    <Stack.Screen name="flows/[flow]" />
  </Stack>;
}
