import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ActionButton, AppHeader, Card, EmptyState, Eyebrow, Loading, Screen, SectionTitle, ui } from '@/components/karma-ui';
import { BrandFonts, Palette } from '@/constants/theme';
import { useSession } from '@/context/auth-context';
import { type Course, type MeditationStats, apiGetMeditationStats, apiGetMyEnrolledCourses } from '@/services/api';

export default function JourneyScreen() {
  const { session, user } = useSession();
  const [stats, setStats] = useState<MeditationStats | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    if (!session) return;
    void Promise.all([apiGetMeditationStats(session), apiGetMyEnrolledCourses(session)]).then(([m, c]) => {
      if (m.data) setStats(m.data);
      if (c.data) setCourses(c.data);
      setLoading(false);
    });
  }, [session]));

  const firstName = user?.name?.split(' ')[0];

  return <Screen>
    <AppHeader title="My Journey" back />

    <Card style={styles.welcome}>
      <Eyebrow>YOUR PRACTICE</Eyebrow>
      <Text style={styles.welcomeTitle}>Every small step is part of your journey{firstName ? `, ${firstName}` : ''}.</Text>
      <ActionButton icon="sparkles-outline" label="Open today’s sadhana" onPress={() => router.push('/sadhana' as any)} />
    </Card>

    <View style={styles.stats}>
      <Stat label="Meditation sessions" value={loading ? '—' : String(stats?.sessionsPlayed ?? 0)} hint={`${stats?.sessionsCompleted ?? 0} completed`} />
      <Stat label="Saved meditations" value={loading ? '—' : String(stats?.bookmarkCount ?? 0)} hint="in Saved items" />
      <Stat label="Courses joined" value={loading ? '—' : String(courses.length)} hint="your learning path" />
    </View>

    {stats?.lastPlayed ? (
      <Pressable onPress={() => router.push(`/meditation/${stats.lastPlayed!.id}` as any)} accessibilityRole="button">
        <Card style={styles.lastRow}>
          <View style={styles.icon}><Ionicons name="flower-outline" size={22} color={Palette.goldDark} /></View>
          <View style={{ flex: 1 }}>
            <Eyebrow>LAST MEDITATION</Eyebrow>
            <Text style={styles.rowTitle}>{stats.lastPlayed.title}</Text>
            <Text style={ui.small}>{stats.lastPlayed.completed ? 'Completed' : 'In progress'}</Text>
          </View>
          <Text style={styles.link}>Return to it</Text>
        </Card>
      </Pressable>
    ) : null}

    <SectionTitle>My courses</SectionTitle>
    {loading ? <Loading label="Loading your learning activity…" /> : courses.length === 0 ? (
      <EmptyState icon="book-outline" title="No courses yet" message="You haven’t joined a course yet. Find a course that feels right for you." action={<ActionButton variant="outline" label="Explore courses" onPress={() => router.push('/courses' as any)} />} />
    ) : (
      <View style={{ gap: 10 }}>
        {courses.map((c) => <Pressable key={c.id} onPress={() => router.push(`/courses/${c.id}` as any)} accessibilityRole="button">
          <Card style={styles.lastRow}>
            <View style={styles.icon}><Ionicons name="book-outline" size={20} color={Palette.goldDark} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{c.title}</Text>
              <Text style={ui.small}>{c.mentor_name ? `With ${c.mentor_name}` : 'Continue your course'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Palette.goldDark} />
          </Card>
        </Pressable>)}
      </View>
    )}
  </Screen>;
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return <Card style={styles.stat}>
    <Text style={ui.small}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statHint}>{hint}</Text>
  </Card>;
}

const styles = StyleSheet.create({
  welcome: { gap: 10, backgroundColor: Palette.highlight },
  welcomeTitle: { fontFamily: BrandFonts.heading, fontSize: 22, lineHeight: 29, color: Palette.charcoal },
  stats: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  stat: { flexGrow: 1, flexBasis: '30%', minWidth: 100, gap: 4, padding: 14 },
  statValue: { fontFamily: BrandFonts.heading, fontSize: 26, color: Palette.charcoal },
  statHint: { fontFamily: BrandFonts.body, fontSize: 11, color: Palette.stoneLight },
  lastRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 44, height: 44, borderRadius: 22, backgroundColor: Palette.goldSoft, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontFamily: BrandFonts.bodySemi, fontSize: 15, color: Palette.charcoal },
  link: { fontFamily: BrandFonts.bodySemi, fontSize: 13, color: Palette.goldDark },
});
