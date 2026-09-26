import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import {
    ActionButton,
    AppHeader,
    AppIcon,
    Card,
    Pill,
    ProgressBar,
    Screen,
    SectionTitle,
    StatCard,
    ui,
} from '@/components/karma-ui';
import { Palette } from '@/constants/theme';
import { useSession } from '@/context/auth-context';
import {
    type Course,
    type DailyTask,
    apiGetCourses,
    apiGetTodayTasks,
    apiToggleTask,
} from '@/services/api';

export default function HomeScreen() {
  const { user, session } = useSession();
  const firstName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Seeker';
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [inProgressCourse, setInProgressCourse] = useState<Course | null>(null);
  const [firstCourse, setFirstCourse] = useState<Course | null>(null);
  const [coursesLoading, setCoursesLoading] = useState(true);

  // Load today's tasks
  const loadTasks = useCallback(async () => {
    if (!session) return;
    const res = await apiGetTodayTasks(session);
    if (res.data) setTasks(res.data.tasks);
    setTasksLoading(false);
  }, [session]);

  // Load courses to find the in-progress one
  const loadCourses = useCallback(async () => {
    if (!session) return;
    const res = await apiGetCourses(session);
    if (res.data) {
      const courses = res.data.courses;
      const active = courses.find((c) => c.progress_pct > 0 && c.progress_pct < 100);
      setInProgressCourse(active ?? null);
      setFirstCourse(courses[0] ?? null);
    }
    setCoursesLoading(false);
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      loadTasks();
      loadCourses();
    }, [loadTasks, loadCourses])
  );

  const handleToggleTask = async (task: DailyTask) => {
    if (!session) return;
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, completed: !t.completed } : t))
    );
    const res = await apiToggleTask(session, task.id);
    if (res.error) {
      // Revert on failure
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, completed: task.completed } : t))
      );
    }
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const featuredCourse = inProgressCourse ?? firstCourse;

  return (
    <Screen>
      {/* Header */}
      <AppHeader
        title="Karma Vajra"
        action={
          <Pressable
            style={styles.bellBtn}
            onPress={() => router.push('/flows/notifications' as any)}
          >
            <AppIcon name="bell" />
          </Pressable>
        }
      />

      {/* Greeting */}
      <View style={styles.greetBlock}>
        <Text style={ui.title}>
          {greeting},{'\n'}
          {firstName}
        </Text>
        <Text style={[ui.body, { marginTop: 6 }]}>
          Take a moment for yourself today.
        </Text>
      </View>

      {/* Stat strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.statsRow}
      >
        <StatCard
          label="Today's practice"
          value={`${completedCount}/${tasks.length || 5}`}
          hint="Tasks completed"
        />
        <StatCard
          label="Meditation"
          value="12"
          hint="Sessions this month"
        />
        <StatCard
          label="Learning"
          value={featuredCourse ? `${featuredCourse.progress_pct}%` : '—'}
          hint="Course progress"
        />
      </ScrollView>

      {/* Daily practice checklist */}
      <SectionTitle
        action={
          <Text style={styles.counter}>
            {completedCount}/{tasks.length || 5}
          </Text>
        }
      >
        Today's practice
      </SectionTitle>

      <Card>
        {tasksLoading ? (
          <View style={styles.taskLoading}>
            <ActivityIndicator color={Palette.gold} />
          </View>
        ) : (
          tasks.map((task, idx) => (
            <Pressable
              key={task.id}
              onPress={() => handleToggleTask(task)}
              style={[styles.taskRow, idx === tasks.length - 1 && styles.taskRowLast]}
            >
              <View style={[styles.taskCheck, task.completed && styles.taskCheckDone]}>
                {task.completed && <Text style={styles.taskCheckMark}>✓</Text>}
              </View>
              <Text
                style={[styles.taskName, task.completed && styles.taskNameDone]}
              >
                {task.task_name}
              </Text>
              <Text
                style={[
                  styles.taskStatus,
                  task.completed ? styles.taskStatusDone : styles.taskStatusPending,
                ]}
              >
                {task.completed ? 'Done' : 'Pending'}
              </Text>
            </Pressable>
          ))
        )}
        <ActionButton
          label="View full sadhana"
          onPress={() => router.push('/flows/sadhana' as any)}
          variant="quiet"
        />
      </Card>

      {/* Continue learning */}
      {!coursesLoading && featuredCourse && (
        <>
          <SectionTitle>Continue learning</SectionTitle>
          <Pressable onPress={() => router.push(`/courses/${featuredCourse.id}` as any)}>
            <Card style={styles.courseCard}>
              <View style={styles.courseArt}>
                <Text style={styles.courseGlyph}>◉</Text>
              </View>
              <Pill>
                {featuredCourse.progress_pct > 0 ? 'IN PROGRESS' : featuredCourse.level.toUpperCase()}
              </Pill>
              <Text style={styles.courseTitle} numberOfLines={2}>
                {featuredCourse.title}
              </Text>
              <Text style={ui.small}>
                {featuredCourse.progress_pct > 0
                  ? `${featuredCourse.progress_pct}% complete · ${featuredCourse.completed_lessons} of ${featuredCourse.total_lessons} lessons`
                  : `${featuredCourse.total_lessons} lessons · Begin today`}
              </Text>
              {featuredCourse.progress_pct > 0 && (
                <ProgressBar pct={featuredCourse.progress_pct} />
              )}
            </Card>
          </Pressable>
        </>
      )}

      {/* Journey grid */}
      <SectionTitle>For your journey</SectionTitle>
      <View style={styles.grid}>
        <JourneyCard
          icon="play"
          title="Today's meditation"
          detail="Stillness within · 12 min"
          onPress={() => router.push('/meditation/1' as any)}
        />
        <JourneyCard
          icon="calendar"
          title="Upcoming event"
          detail="Full moon meditation"
          onPress={() => router.push('/flows/event-detail' as any)}
        />
        <JourneyCard
          icon="heart"
          title="Daily check-in"
          detail="How are you feeling?"
          onPress={() => router.push('/flows/mood' as any)}
        />
        <JourneyCard
          icon="spark"
          title="Guru's message"
          detail="A word for today"
          onPress={() => router.push('/flows/guide' as any)}
        />
        <JourneyCard
          icon="practice"
          title="Divine Shop"
          detail="Sacred items & offerings"
          onPress={() => router.push('/shop' as any)}
        />
      </View>
    </Screen>
  );
}

function JourneyCard({
  icon,
  title,
  detail,
  onPress,
}: {
  icon: string;
  title: string;
  detail: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.journeyCard} onPress={onPress}>
      <AppIcon name={icon} active />
      <Text style={styles.journeyTitle}>{title}</Text>
      <Text style={ui.small}>{detail}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bellBtn: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.line,
  },

  greetBlock: { gap: 2 },

  statsRow: { gap: 12, paddingRight: 4, paddingBottom: 4 },

  counter: {
    color: Palette.goldDark,
    fontSize: 17,
    fontWeight: '800',
    fontFamily: 'serif',
  },

  // Tasks
  taskLoading: { paddingVertical: 20, alignItems: 'center' },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    minHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
  },
  taskRowLast: { borderBottomWidth: 0 },
  taskCheck: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: Palette.line,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  taskCheckDone: {
    backgroundColor: Palette.gold,
    borderColor: Palette.gold,
  },
  taskCheckMark: { color: Palette.charcoal, fontSize: 13, fontWeight: '800' },
  taskName: {
    flex: 1,
    color: Palette.charcoal,
    fontSize: 16,
    fontWeight: '600',
  },
  taskNameDone: { color: Palette.stoneLight, textDecorationLine: 'line-through' },
  taskStatus: { fontSize: 13, fontWeight: '700' },
  taskStatusDone: { color: Palette.goldDark },
  taskStatusPending: { color: Palette.stoneLight },

  // Course card
  courseCard: { gap: 10, padding: 0, overflow: 'hidden' },
  courseArt: {
    height: 140,
    backgroundColor: Palette.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  courseGlyph: { fontSize: 52, color: Palette.goldDark },
  courseTitle: {
    color: Palette.charcoal,
    fontFamily: 'serif',
    fontSize: 21,
    fontWeight: '700',
    lineHeight: 27,
    paddingHorizontal: 20,
  },

  // Journey grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  journeyCard: {
    width: '47%',
    flexGrow: 1,
    minHeight: 140,
    backgroundColor: Palette.surface,
    borderRadius: 22,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: Palette.line,
    shadowColor: Palette.charcoal,
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  journeyTitle: {
    color: Palette.charcoal,
    fontFamily: 'serif',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
});
