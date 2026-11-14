import { Stack } from 'expo-router';

export default function AuthenticatedLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      {/* Tab navigator */}
      <Stack.Screen name="(tabs)" />

      {/* courses/ has its own _layout.tsx — no explicit Screen needed; router discovers it */}

      {/* Meditations library — folder with index.tsx, no nested layout */}
      <Stack.Screen name="meditations" />

      {/* Meditation player */}
      <Stack.Screen
        name="meditation/[meditationId]"
        options={{ animation: 'fade_from_bottom' }}
      />

      {/* Community */}
      <Stack.Screen name="community/create-post" options={{ presentation: 'modal' }} />
      <Stack.Screen name="community/[postId]" />

      {/* Events */}
      <Stack.Screen name="events/[eventId]" />

      {/* Shop */}
      <Stack.Screen name="shop/index" />
      <Stack.Screen name="shop/[itemId]" />
      <Stack.Screen name="shop/cart" />
      <Stack.Screen name="shop/orders" />

      {/* Account */}
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="bookmarks" />
      <Stack.Screen name="notifications" />

      {/* Practice */}
      <Stack.Screen name="sadhana" />

      {/* Help */}
      <Stack.Screen name="help" />
    </Stack>
  );
}
