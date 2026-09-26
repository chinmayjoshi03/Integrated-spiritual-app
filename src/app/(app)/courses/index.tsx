import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader, Card, Screen, SectionTitle, ui } from '@/components/karma-ui';
import { Palette, Spacing } from '@/constants/theme';
import { useSession } from '@/context/auth-context';
import { type Course, apiGetCourses } from '@/services/api';

type FilterKey = 'all' | 'inProgress' | 'completed';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'inProgress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
];

const LEVEL_GRADIENT: Record<string, { bg: string; accent: string; text: string }> = {
  Beginner:     { bg: '#E8F5E9', accent: '#4CAF50', text: '#1B5E20' },
  Intermediate: { bg: '#FFF8E1', accent: '#FFC107', text: '#7B5500' },
  Advanced:     { bg: '#FCE4EC', accent: '#E91E63', text: '#7B0020' },
};
const LEVEL_DEFAULT = { bg: Palette.goldSoft, accent: Palette.gold, text: Palette.goldDark };

export default function CoursesScreen() {
  const { session } = useSession();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>('all');

  useEffect(() => {
    if (!session) return;
    apiGetCourses(session).then((res) => {
      if (res.error) setError(res.error);
      else setCourses(res.data?.courses ?? []);
      setLoading(false);
    });
  }, [session]);

  const inProgress = courses.filter((c) => c.progress_pct > 0 && c.progress_pct < 100);
  const completed   = courses.filter((c) => c.progress_pct === 100);
  const notStarted  = courses.filter((c) => c.progress_pct === 0);

  const filteredCourses =
    filter === 'all'        ? courses :
    filter === 'inProgress' ? inProgress :
    /* completed */           completed;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.headerOuter}>
          <AppHeader title="Courses" subtitle="Learn at your own pace" />
        </View>

        {/* Hero band */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Your Learning Path</Text>
          <Text style={styles.heroBody}>
            Structured teachings to support your practice — from beginner foundations to deep self-inquiry.
          </Text>
          {!loading && (
            <View style={styles.statsRow}>
              <StatChip value={String(courses.length)}     label="Courses" />
              <StatChip value={String(inProgress.length)}  label="In Progress" accent />
              <StatChip value={String(completed.length)}   label="Completed" />
            </View>
          )}
        </View>

        <View style={styles.body}>

          {/* Filter tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {FILTERS.map((f) => (
              <Pressable
                key={f.key}
                style={[styles.filterTab, filter === f.key && styles.filterTabActive]}
                onPress={() => setFilter(f.key)}
              >
                <Text style={[styles.filterLabel, filter === f.key && styles.filterLabelActive]}>
                  {f.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Loading */}
          {loading && (
            <View style={styles.center}>
              <ActivityIndicator color={Palette.gold} size="large" />
            </View>
          )}

          {/* Error */}
          {!loading && error && (
            <Card style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
            </Card>
          )}

          {/* Content */}
          {!loading && !error && (
            <>
              {/* Continue learning (always shown if any) */}
              {filter === 'all' && inProgress.length > 0 && (
                <>
                  <SectionTitle>Continue learning</SectionTitle>
                  <View style={styles.list}>
                    {inProgress.map((c) => (
                      <CourseCard key={c.id} course={c} featured />
                    ))}
                  </View>
                </>
              )}

              {/* Filtered results */}
              {filter !== 'all' && (
                <>
                  {filteredCourses.length > 0 ? (
                    <View style={styles.list}>
                      {filteredCourses.map((c) => (
                        <CourseCard key={c.id} course={c} featured={filter === 'inProgress'} />
                      ))}
                    </View>
                  ) : (
                    <EmptyState
                      symbol={filter === 'inProgress' ? '📚' : '🏆'}
                      title={filter === 'inProgress' ? 'Nothing in progress' : 'No completed courses'}
                      body={filter === 'inProgress' ? 'Start any course below to track your progress.' : 'Complete courses to see them here.'}
                    />
                  )}
                </>
              )}

              {/* All courses section */}
              {filter === 'all' && notStarted.length > 0 && (
                <>
                  <SectionTitle>All courses</SectionTitle>
                  <View style={styles.list}>
                    {notStarted.map((c) => (
                      <CourseCard key={c.id} course={c} />
                    ))}
                  </View>
                </>
              )}

              {/* Completed */}
              {filter === 'all' && completed.length > 0 && (
                <>
                  <SectionTitle>Completed</SectionTitle>
                  <View style={styles.list}>
                    {completed.map((c) => (
                      <CourseCard key={c.id} course={c} />
                    ))}
                  </View>
                </>
              )}

              {courses.length === 0 && (
                <EmptyState symbol="◉" title="No courses yet" body="Check back soon — new teachings are added regularly." />
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatChip({ value, label, accent = false }: { value: string; label: string; accent?: boolean }) {
  return (
    <View style={[chipStyles.wrap, accent && chipStyles.wrapAccent]}>
      <Text style={[chipStyles.value, accent && chipStyles.valueAccent]}>{value}</Text>
      <Text style={chipStyles.label}>{label}</Text>
    </View>
  );
}

function EmptyState({ symbol, title, body }: { symbol: string; title: string; body: string }) {
  return (
    <Card style={emptyStyles.card}>
      <Text style={emptyStyles.symbol}>{symbol}</Text>
      <Text style={emptyStyles.title}>{title}</Text>
      <Text style={[ui.small, { textAlign: 'center' }]}>{body}</Text>
    </Card>
  );
}

function CourseCard({ course, featured = false }: { course: Course; featured?: boolean }) {
  const lvl = LEVEL_GRADIENT[course.level] ?? LEVEL_DEFAULT;

  return (
    <Pressable onPress={() => router.push(`/courses/${course.id}` as any)}>
      {featured ? (
        /* Featured / in-progress card — tall with banner */
        <Card style={styles.featuredCard}>
          {/* Banner */}
          <View style={[styles.banner, { backgroundColor: lvl.bg }]}>
            <View style={[styles.bannerAccent, { backgroundColor: lvl.accent }]} />
            <Text style={styles.bannerEmoji}>📖</Text>
            {/* Level badge */}
            <View style={[styles.levelBadge, { backgroundColor: lvl.accent + '22', borderColor: lvl.accent + '66' }]}>
              <Text style={[styles.levelText, { color: lvl.text }]}>{course.level}</Text>
            </View>
          </View>

          <View style={styles.featuredMeta}>
            <Text style={styles.courseTitle} numberOfLines={2}>{course.title}</Text>
            {course.description ? (
              <Text style={ui.small} numberOfLines={2}>{course.description}</Text>
            ) : null}
            {/* Progress */}
            <View style={styles.progressRow}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${course.progress_pct}%` }]} />
              </View>
              <Text style={styles.progressPct}>{course.progress_pct}%</Text>
            </View>
            <Text style={styles.lessonCount}>
              {course.completed_lessons} / {course.total_lessons} lessons
            </Text>
          </View>
        </Card>
      ) : (
        /* Compact card for available / completed */
        <Card style={styles.compactCard}>
          <View style={[styles.compactIcon, { backgroundColor: lvl.bg }]}>
            <Text style={styles.compactIconEmoji}>📖</Text>
          </View>
          <View style={styles.compactMeta}>
            <View style={[styles.compactLevelBadge, { backgroundColor: lvl.bg }]}>
              <Text style={[styles.levelText, { color: lvl.text }]}>{course.level}</Text>
            </View>
            <Text style={styles.courseTitle} numberOfLines={2}>{course.title}</Text>
            <View style={styles.compactFooter}>
              <Text style={styles.lessonCount}>
                {course.total_lessons} lesson{course.total_lessons !== 1 ? 's' : ''}
              </Text>
              {course.progress_pct === 100 && (
                <View style={styles.completedBadge}>
                  <Text style={styles.completedText}>✓ Complete</Text>
                </View>
              )}
            </View>
          </View>
          <Text style={styles.arrow}>›</Text>
        </Card>
      )}
    </Pressable>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const chipStyles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    paddingVertical: 10,
  },
  wrapAccent: { backgroundColor: 'rgba(201,162,77,0.25)' },
  value: { color: '#FFFFFF', fontFamily: 'serif', fontSize: 22, fontWeight: '700' },
  valueAccent: { color: Palette.gold },
  label: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
});

const emptyStyles = StyleSheet.create({
  card: { alignItems: 'center', gap: 12, paddingVertical: 40 },
  symbol: { fontSize: 48 },
  title: { color: Palette.charcoal, fontFamily: 'serif', fontSize: 20, fontWeight: '700' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.ivory },
  scroll: { paddingBottom: 120 },

  headerOuter: { paddingHorizontal: Spacing.three },

  // ── Hero band ──
  hero: {
    backgroundColor: Palette.charcoal,
    marginHorizontal: 0,
    paddingHorizontal: Spacing.three,
    paddingTop: 20,
    paddingBottom: 28,
    gap: 10,
  },
  heroTitle: {
    color: '#F0E6CC',
    fontFamily: 'serif',
    fontSize: 26,
    fontWeight: '700',
  },
  heroBody: { color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 20 },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 6 },

  body: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    gap: Spacing.three,
  },

  // ── Filters ──
  filterRow: { gap: 8, paddingVertical: 2 },
  filterTab: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.line,
  },
  filterTabActive: { backgroundColor: Palette.charcoal, borderColor: Palette.charcoal },
  filterLabel: { color: Palette.stone, fontSize: 13, fontWeight: '600' },
  filterLabelActive: { color: '#FFFFFF' },

  center: { paddingVertical: 48, alignItems: 'center' },
  errorCard: { borderColor: Palette.blush, backgroundColor: Palette.blush },
  errorText: { color: Palette.danger, fontSize: 14, textAlign: 'center' },

  list: { gap: 14 },

  // ── Featured card ──
  featuredCard: {
    gap: 0,
    padding: 0,
    overflow: 'hidden',
    flexDirection: 'column',
  },
  banner: {
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  bannerAccent: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    opacity: 0.15,
  },
  bannerEmoji: { fontSize: 52, marginBottom: 6 },
  levelBadge: {
    position: 'absolute',
    top: 12,
    left: 14,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
  },
  levelText: { fontSize: 11, fontWeight: '700' },
  featuredMeta: { padding: 16, gap: 8 },

  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 6,
    backgroundColor: Palette.goldSoft,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 6, backgroundColor: Palette.gold },
  progressPct: { color: Palette.goldDark, fontSize: 12, fontWeight: '700', minWidth: 34, textAlign: 'right' },

  courseTitle: {
    color: Palette.charcoal,
    fontFamily: 'serif',
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 23,
  },
  lessonCount: { color: Palette.stone, fontSize: 13 },

  // ── Compact card ──
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
  },
  compactIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  compactIconEmoji: { fontSize: 28 },
  compactMeta: { flex: 1, gap: 5 },
  compactLevelBadge: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 1,
  },
  compactFooter: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },

  completedBadge: {
    backgroundColor: '#D4EDDA',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  completedText: { color: '#2D6A4F', fontSize: 12, fontWeight: '700' },

  arrow: { color: Palette.goldDark, fontSize: 28, paddingRight: 6 },
});
