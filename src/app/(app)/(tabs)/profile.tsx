import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
    AppHeader,
    AppIcon,
    Card,
    KarmaLogo,
    ListItem,
    Screen,
    SectionTitle,
    ui,
} from '@/components/karma-ui';
import { Palette } from '@/constants/theme';
import { useSession } from '@/context/auth-context';
import { type Course, type DailyTask, apiGetCourses, apiGetTodayTasks } from '@/services/api';

const LINKS = [
  { label: 'Profile & preferences', flow: 'profile', icon: 'settings' },
  { label: 'Mood & wellbeing', flow: 'mood-insights', icon: 'heart' },
  { label: 'AI spiritual guide', flow: 'guide', icon: 'spark' },
  { label: 'Achievements', flow: 'achievements', icon: 'check' },
  { label: 'Activity history', flow: 'activity-history', icon: 'calendar' },
  { label: 'Notifications', flow: 'notifications', icon: 'bell' },
  { label: 'Device sessions', flow: 'sessions', icon: 'profile' },
] as const;

export default function ProfileScreen() {
  const { user, session, signOut } = useSession();

  const name = user?.name || user?.email?.split('@')[0] || 'Seeker';
  const initials = name
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Member since — format the real created_at from the user object
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : 'Recently joined';

  // Stats from API
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  const loadStats = useCallback(async () => {
    if (!session) return;
    const [tasksRes, coursesRes] = await Promise.all([
      apiGetTodayTasks(session),
      apiGetCourses(session),
    ]);
    if (tasksRes.data) setTasks(tasksRes.data.tasks);
    if (coursesRes.data) setCourses(coursesRes.data.courses);
  }, [session]);

  useEffect(() => { loadStats(); }, [loadStats]);

  const completedToday = tasks.filter((t) => t.completed).length;
  const inProgressCourse = courses.find((c) => c.progress_pct > 0 && c.progress_pct < 100);
  const learningPct = inProgressCourse?.progress_pct ?? 0;
  const completedCourses = courses.filter((c) => c.progress_pct === 100).length;

  return (
    <Screen>
      <AppHeader title="Profile" subtitle="Your personal sanctuary" />

      {/* User identity card */}
      <Card style={styles.identityCard}>
        <View style={styles.avatarWrap}>
          <KarmaLogo size={72} />
          <View style={styles.avatarInitials}>
            <Text style={styles.avatarInitialsText}>{initials}</Text>
          </View>
        </View>
        <View style={styles.identityCopy}>
          <Text style={styles.userName}>{name}</Text>
          <Text style={ui.small}>{user?.email}</Text>
          <View style={styles.memberBadge}>
            <Text style={styles.memberBadgeText}>Member since {memberSince}</Text>
          </View>
        </View>
      </Card>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <StatTile
          value={`${completedToday}/${tasks.length || 5}`}
          label="Today's practice"
          color={Palette.goldDark}
        />
        <StatTile
          value={`${learningPct}%`}
          label="Learning"
          color={Palette.goldDark}
        />
        <StatTile
          value={String(completedCourses)}
          label={completedCourses === 1 ? 'Course done' : 'Courses done'}
          color="#2D6A4F"
        />
      </View>

      {/* Courses shortcut */}
      <Pressable onPress={() => router.push('/courses' as any)}>
        <Card style={styles.coursesShortcut}>
          <View style={styles.coursesIcon}>
            <Text style={styles.coursesIconText}>▤</Text>
          </View>
          <View style={styles.coursesCopy}>
            <Text style={styles.coursesTitle}>My courses</Text>
            <Text style={ui.small}>
              {courses.length} course{courses.length !== 1 ? 's' : ''} available
              {inProgressCourse ? ` · ${inProgressCourse.progress_pct}% in progress` : ''}
            </Text>
          </View>
          <Text style={styles.coursesArrow}>›</Text>
        </Card>
      </Pressable>

      {/* Settings links */}
      <SectionTitle>Your journey</SectionTitle>
      <Card style={styles.linksCard}>
        {LINKS.map((l, idx) => (
          <ListItem
            key={l.flow}
            icon={<AppIcon name={l.icon} active />}
            title={l.label}
            onPress={() => router.push(`/flows/${l.flow}` as any)}
            last={idx === LINKS.length - 1}
          />
        ))}
      </Card>

      {/* Sign out */}
      <Pressable style={styles.signOutBtn} onPress={signOut}>
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>

      {/* App version */}
      <Text style={styles.version}>Karma Vajra · v1.0.0</Text>
    </Screen>
  );
}

function StatTile({
  value,
  label,
  color,
}: {
  value: string;
  label: string;
  color: string;
}) {
  return (
    <View style={styles.statTile}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Identity card
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarWrap: { position: 'relative', flexShrink: 0 },
  avatarInitials: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Palette.gold,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Palette.surface,
  },
  avatarInitialsText: {
    color: Palette.charcoal,
    fontSize: 10,
    fontWeight: '800',
  },
  identityCopy: { flex: 1, gap: 4 },
  userName: {
    color: Palette.charcoal,
    fontFamily: 'serif',
    fontSize: 22,
    fontWeight: '700',
  },
  memberBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Palette.goldSoft,
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 3,
    marginTop: 2,
  },
  memberBadgeText: { color: Palette.goldDark, fontSize: 11, fontWeight: '700' },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10 },
  statTile: {
    flex: 1,
    minHeight: 80,
    backgroundColor: Palette.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Palette.line,
    padding: 14,
    gap: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontFamily: 'serif',
    fontSize: 22,
    fontWeight: '700',
  },
  statLabel: { color: Palette.stone, fontSize: 11, textAlign: 'center' },

  // Courses shortcut
  coursesShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
  },
  coursesIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: Palette.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  coursesIconText: { color: Palette.goldDark, fontSize: 22 },
  coursesCopy: { flex: 1, gap: 3 },
  coursesTitle: {
    color: Palette.charcoal,
    fontFamily: 'serif',
    fontSize: 17,
    fontWeight: '700',
  },
  coursesArrow: { color: Palette.goldDark, fontSize: 28 },

  // Links
  linksCard: { gap: 0, paddingVertical: 6 },

  // Sign out
  signOutBtn: {
    minHeight: 52,
    borderRadius: 17,
    backgroundColor: Palette.blush,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutText: {
    color: Palette.danger,
    fontSize: 16,
    fontWeight: '800',
  },

  version: {
    color: Palette.stoneLight,
    fontSize: 12,
    textAlign: 'center',
    paddingBottom: 8,
  },
});
