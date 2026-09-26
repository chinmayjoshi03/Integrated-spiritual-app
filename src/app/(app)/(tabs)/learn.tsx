import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader, Card, Pill, Screen, SectionTitle, ui } from '@/components/karma-ui';
import { Palette } from '@/constants/theme';
import { useSession } from '@/context/auth-context';
import { type Course, apiGetCourses } from '@/services/api';

const LEVEL_COLOR: Record<string, string> = {
  Beginner: '#D4EDDA',
  Intermediate: '#FFF3CD',
  Advanced: '#F8D7DA',
};
const LEVEL_TEXT: Record<string, string> = {
  Beginner: '#2D6A4F',
  Intermediate: '#856404',
  Advanced: '#842029',
};

export default function LearnScreen() {
  const { session } = useSession();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCourses = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    const res = await apiGetCourses(session);
    if (res.data) setCourses(res.data.courses);
    setLoading(false);
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      fetchCourses();
    }, [fetchCourses])
  );

  const inProgress = courses.find((c) => c.progress_pct > 0 && c.progress_pct < 100);
  const rest = courses.filter((c) => c.id !== inProgress?.id).slice(0, 4);

  return (
    <Screen>
      <AppHeader title="Learn" subtitle="Wisdom for everyday life" />

      <View>
        <Text style={ui.title}>Your learning path</Text>
        <Text style={[ui.body, { marginTop: 6 }]}>
          Structured teachings to support your practice — explore at your own pace.
        </Text>
      </View>

      {loading && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Palette.gold} size="large" />
        </View>
      )}

      {!loading && (
        <>
          {/* ── Featured / in-progress course ── */}
          {inProgress ? (
            <>
              <SectionTitle>Continue learning</SectionTitle>
              <Pressable onPress={() => router.push(`/courses/${inProgress.id}` as any)}>
                <Card style={styles.featured}>
                  <View style={styles.featuredArt}>
                    <Text style={styles.artSymbol}>◉</Text>
                  </View>
                  <View style={styles.featuredBody}>
                    <Pill>IN PROGRESS</Pill>
                    <Text style={styles.featuredTitle} numberOfLines={2}>
                      {inProgress.title}
                    </Text>
                    <Text style={ui.small}>
                      {inProgress.completed_lessons} of {inProgress.total_lessons} lessons complete
                    </Text>
                    <View style={styles.track}>
                      <View style={[styles.fill, { width: `${inProgress.progress_pct}%` }]} />
                    </View>
                    <Text style={styles.pctLabel}>{inProgress.progress_pct}% complete</Text>
                  </View>
                </Card>
              </Pressable>
            </>
          ) : courses.length > 0 ? (
            <>
              <SectionTitle>Start learning</SectionTitle>
              <Pressable onPress={() => router.push(`/courses/${courses[0].id}` as any)}>
                <Card style={styles.featured}>
                  <View style={styles.featuredArt}>
                    <Text style={styles.artSymbol}>◉</Text>
                  </View>
                  <View style={styles.featuredBody}>
                    <Pill>{courses[0].level.toUpperCase()}</Pill>
                    <Text style={styles.featuredTitle} numberOfLines={2}>
                      {courses[0].title}
                    </Text>
                    <Text style={ui.small}>
                      {courses[0].total_lessons} lessons · Begin today
                    </Text>
                  </View>
                </Card>
              </Pressable>
            </>
          ) : null}

          {/* ── Course list ── */}
          {rest.length > 0 && (
            <>
              <SectionTitle
                action={
                  <Pressable onPress={() => router.push('/courses' as any)}>
                    <Text style={styles.seeAll}>See all ›</Text>
                  </Pressable>
                }
              >
                Explore courses
              </SectionTitle>

              <View style={styles.list}>
                {rest.map((c, index) => (
                  <Pressable key={c.id} onPress={() => router.push(`/courses/${c.id}` as any)}>
                    <Card style={styles.courseRow}>
                      <Text style={styles.number}>
                        {String(index + 1).padStart(2, '0')}
                      </Text>
                      <View style={styles.courseInfo}>
                        <Text style={styles.courseTitle} numberOfLines={1}>
                          {c.title}
                        </Text>
                        <View style={styles.courseMeta}>
                          <View
                            style={[
                              styles.levelBadge,
                              { backgroundColor: LEVEL_COLOR[c.level] ?? Palette.goldSoft },
                            ]}
                          >
                            <Text
                              style={[
                                styles.levelText,
                                { color: LEVEL_TEXT[c.level] ?? Palette.goldDark },
                              ]}
                            >
                              {c.level}
                            </Text>
                          </View>
                          <Text style={ui.small}>
                            {c.total_lessons} lesson{c.total_lessons !== 1 ? 's' : ''}
                          </Text>
                          {c.progress_pct === 100 && (
                            <Text style={styles.completedMark}>✓ Done</Text>
                          )}
                        </View>
                      </View>
                      <Text style={styles.arrow}>›</Text>
                    </Card>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          {/* ── Empty state ── */}
          {courses.length === 0 && (
            <Card style={styles.empty}>
              <Text style={styles.emptySymbol}>◉</Text>
              <Text style={styles.emptyTitle}>No courses found</Text>
              <Text style={[ui.small, { textAlign: 'center' }]}>
                Tap below to refresh and load teachings from the server.
              </Text>
              <Pressable style={styles.browseBtn} onPress={fetchCourses}>
                <Text style={styles.browseBtnText}>Refresh Courses</Text>
              </Pressable>
            </Card>
          )}

          {/* ── Browse all CTA ── */}
          {courses.length > 0 && (
            <Pressable
              style={styles.browseBtn}
              onPress={() => router.push('/courses' as any)}
            >
              <Text style={styles.browseBtnText}>Browse all courses</Text>
            </Pressable>
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loadingWrap: { paddingVertical: 48, alignItems: 'center' },

  // Featured card
  featured: { gap: 0, padding: 0, overflow: 'hidden' },
  featuredArt: {
    height: 150,
    backgroundColor: Palette.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artSymbol: { fontSize: 56, color: Palette.goldDark },
  featuredBody: { padding: 18, gap: 8 },
  featuredTitle: {
    color: Palette.charcoal,
    fontFamily: 'serif',
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
  },
  track: {
    height: 7,
    borderRadius: 8,
    backgroundColor: Palette.goldSoft,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 8, backgroundColor: Palette.gold },
  pctLabel: { color: Palette.goldDark, fontSize: 12, fontWeight: '700' },

  // Course list
  seeAll: { color: Palette.goldDark, fontSize: 14, fontWeight: '700' },
  list: { gap: 10 },
  courseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderRadius: 20,
  },
  number: {
    color: Palette.goldDark,
    fontFamily: 'serif',
    fontSize: 22,
    fontWeight: '700',
    minWidth: 34,
    textAlign: 'center',
  },
  courseInfo: { flex: 1, gap: 5 },
  courseTitle: { color: Palette.charcoal, fontWeight: '700', fontSize: 15 },
  courseMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  levelBadge: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  levelText: { fontSize: 11, fontWeight: '700' },
  completedMark: { color: '#2D6A4F', fontSize: 12, fontWeight: '700' },
  arrow: { color: Palette.goldDark, fontSize: 28 },

  // Browse all button
  browseBtn: {
    minHeight: 52,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: Palette.goldDark,
    backgroundColor: Palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  browseBtnText: { color: Palette.goldDark, fontSize: 16, fontWeight: '700' },

  // Empty
  empty: { alignItems: 'center', gap: 12, paddingVertical: 40 },
  emptySymbol: { fontSize: 48, color: Palette.stoneLight },
  emptyTitle: {
    color: Palette.charcoal,
    fontFamily: 'serif',
    fontSize: 20,
    fontWeight: '700',
  },
});
