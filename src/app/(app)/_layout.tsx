import { Stack } from 'expo-router';

/** Every screen behind sign-in. Members only — admin accounts use the website. */
export default function AuthenticatedLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="(tabs)" />

      {/* Learn (courses/ has its own _layout.tsx) */}
      <Stack.Screen name="meditations" />
      <Stack.Screen name="meditation/[meditationId]" options={{ animation: 'fade_from_bottom' }} />

      {/* Connect */}
      <Stack.Screen name="community/group/[groupId]" />
      <Stack.Screen name="community/question/[questionId]" />
      <Stack.Screen name="events/[eventId]" />
      <Stack.Screen name="events/my" />
      <Stack.Screen name="volunteering/[opportunityId]" />
      <Stack.Screen name="volunteering/my" />

      {/* Shop */}
      <Stack.Screen name="shop/index" />
      <Stack.Screen name="shop/[itemId]" />
      <Stack.Screen name="shop/cart" />
      <Stack.Screen name="shop/orders" />

      {/* Account */}
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="journey" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="bookmarks" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="about" />

      {/* Practice */}
      <Stack.Screen name="sadhana" />

      {/* Help & support */}
      <Stack.Screen name="help" />
      <Stack.Screen name="support/index" />
      <Stack.Screen name="support/new" />
      <Stack.Screen name="support/[ticketId]" />
    </Stack>
  );
}
