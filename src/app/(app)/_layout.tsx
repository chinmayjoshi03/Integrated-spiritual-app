import { Stack } from 'expo-router';

export default function AuthenticatedLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="flows/[flow]" />
      <Stack.Screen name="courses" />
      <Stack.Screen name="meditations" />
      <Stack.Screen name="meditation/[meditationId]" options={{ animation: 'fade_from_bottom' }} />
      <Stack.Screen name="community/create-post" options={{ presentation: 'modal' }} />
      <Stack.Screen name="community/[postId]" />
      <Stack.Screen name="events/[eventId]" />
      <Stack.Screen name="shop/index" />
      <Stack.Screen name="shop/[itemId]" />
      <Stack.Screen name="shop/orders" />
    </Stack>
  );
}
