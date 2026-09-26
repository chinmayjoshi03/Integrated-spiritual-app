import { Stack } from 'expo-router';

export default function CoursesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      {/* Course list */}
      <Stack.Screen name="index" />
      {/* Course detail group */}
      <Stack.Screen name="[courseId]/index" />
      <Stack.Screen name="[courseId]/lesson/[lessonId]" />
      <Stack.Screen name="[courseId]/resources" />
      <Stack.Screen name="[courseId]/assignments/[assignmentId]" />
      <Stack.Screen name="[courseId]/quiz/[quizId]" />
    </Stack>
  );
}
