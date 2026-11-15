import { Stack } from 'expo-router';

export default function CoursesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[courseId]/index" />
      <Stack.Screen name="[courseId]/lesson/[lessonId]" />
    </Stack>
  );
}
