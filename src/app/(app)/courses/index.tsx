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

type FilterKey = 'all' | 'enrolled' | 'available';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',       label: 'All' },
  { key: 'enrolled',  label: 'Enrolled' },
  { key: 'available', label: 'Available' },
];

function formatPrice(price: number | string): string {
  const n = Number(price);
  if (!n || n === 0) return 'Free';
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export default function CoursesScreen() {
  const { session } = useSession();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>('all');

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    apiGetCourses(session).then((res) => {
      if (res.error) setError(res.error);
      else setCourses(res.data?.courses ?? []);
      setLoading(false);
    });
  }, [session]);

  const enrolled  = courses.filter((c) => c.enrolled);
  const available = courses.filter((c) => !c.enrolled);

  const displayed =
    filter === 'enrolled'  ? enrolled  :
    filter === 'available' ? available :
    courses;

  const handlePress = (course: Course) => {
    if (!course.enrolled && Number(course.price) > 0) {
      // Not purchased — navigate to detail which shows enroll/pay CTA
      router.push(`/courses/${course.id}` as any);
    } else {
      router.push(`/courses/${course.id}` as any);
    }
  };

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
              <StatChip value={String(courses.length)}  label="Courses" />
              <StatChip value={String(enrolled.length)} label="Enrolled" accent />
              <StatChip value={String(available.length)} label="Available" />
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

          {loading && (
            <View style={styles.center}>
              <ActivityIndicator color={Palette.gold} size="large" />
            </View>
          )}

          {!loading && error && (
            <Card style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
            </Card>
          )}

          {!loading && !error && (
            <>
              {displayed.length === 0 ? (
                <EmptyState
                  symbol={filter === 'enrolled' ? '📚' : '🎓'}
                  title={filter === 'enrolled' ? 'No enrolled courses' : filter === 'available' ? 'No available courses' : 'No courses yet'}
                  body={filter === 'enrolled' ? 'Purchase a course below to get started.' : 'Check back soon — new teachings are added regularly.'}
                />
              ) : (
                <View style={styles.list}>
                  {displayed.map((c) => (
                    <CourseCard key={c.id} course={c} onPress={() => handlePress(c)} />
                  ))}
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Course card ──────────────────────────────────────────────────────────────

function CourseCard({ course, onPress }: { course: Course; onPress: () => void }) {
  const isLocked = !course.enrolled && Number(course.price) > 0;

  return (
    <Pressable onPress={onPress}>
      <Card style={[styles.courseCard, isLocked && styles.courseCardLocked] as any}>
        {/* Art banner */}
        <View style={[styles.courseBanner, isLocked && styles.courseBannerLocked]}>
          <Text style={styles.courseBannerEmoji}>{isLocked ? '🔒' : '📖'}</Text>
          {isLocked && (
            <View style={styles.priceBadge}>
              <Text style={styles.priceBadgeText}>{formatPrice(course.price)}</Text>
            </View>
          )}
          {course.enrolled && (
            <View style={styles.enrolledBadge}>
              <Text style={styles.enrolledBadgeText}>✓ Enrolled</Text>
            </View>
          )}
        </View>

        {/* Course info */}
        <View style={styles.courseBody}>
          {/* Level / status pill */}
          {course.level ? (
            <View style={styles.levelPill}>
              <Text style={styles.levelPillText}>{course.level.toUpperCase()}</Text>
            </View>
          ) : null}

          <Text style={styles.courseTitle} numberOfLines={2}>{course.title}</Text>

          {course.mentor_name && (
            <Text style={ui.small}>with {course.mentor_name}</Text>
          )}

          {/* Progress bar for enrolled */}
          {course.enrolled && (course.progress_pct ?? 0) > 0 && (
            <View style={styles.progressRow}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${course.progress_pct ?? 0}%` as any }]} />
              </View>
              <Text style={styles.progressPct}>{course.progress_pct ?? 0}%</Text>
            </View>
          )}

          {/* CTA row */}
          <View style={styles.courseFooter}>
            {isLocked ? (
              <>
                <Text style={styles.lockPrice}>{formatPrice(course.price)}</Text>
                <View style={styles.unlockBtn}>
                  <Text style={styles.unlockBtnText}>Enroll →</Text>
                </View>
              </>
            ) : (
              <View style={styles.openBtn}>
                <Text style={styles.openBtnText}>
                  {(course.progress_pct ?? 0) > 0 ? 'Continue →' : 'Start course →'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

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

// ─── Styles ───────────────────────────────────────────────────────────────────

const chipStyles = StyleSheet.create({
  wrap: {
    flex: 1, alignItems: 'center', gap: 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14, paddingVertical: 10,
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

  // Hero band
  hero: {
    backgroundColor: Palette.charcoal,
    paddingHorizontal: Spacing.three,
    paddingTop: 20,
    paddingBottom: 28,
    gap: 10,
  },
  heroTitle: { color: '#F0E6CC', fontFamily: 'serif', fontSize: 26, fontWeight: '700' },
  heroBody: { color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 20 },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 6 },

  body: { paddingHorizontal: Spacing.three, paddingTop: Spacing.three, gap: Spacing.three },

  // Filter tabs
  filterRow: { gap: 8, paddingVertical: 2 },
  filterTab: {
    paddingHorizontal: 18, paddingVertical: 9,
    borderRadius: 20, backgroundColor: Palette.surface,
    borderWidth: 1, borderColor: Palette.line,
  },
  filterTabActive: { backgroundColor: Palette.charcoal, borderColor: Palette.charcoal },
  filterLabel: { color: Palette.stone, fontSize: 13, fontWeight: '600' },
  filterLabelActive: { color: '#FFFFFF' },

  center: { paddingVertical: 48, alignItems: 'center' },
  errorCard: { backgroundColor: Palette.blush },
  errorText: { color: Palette.danger, fontSize: 14 },

  list: { gap: 16 },

  // Course card
  courseCard: { gap: 0, padding: 0, overflow: 'hidden' },
  courseCardLocked: { opacity: 0.92 },

  courseBanner: {
    height: 140,
    backgroundColor: Palette.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  courseBannerLocked: { backgroundColor: '#F0EEF0' },
  courseBannerEmoji: { fontSize: 52 },

  priceBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: Palette.charcoal,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  priceBadgeText: {
    color: Palette.gold,
    fontSize: 13,
    fontWeight: '800',
    fontFamily: 'serif',
  },

  enrolledBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  enrolledBadgeText: { color: '#065F46', fontSize: 12, fontWeight: '800' },

  courseBody: { padding: 16, gap: 8 },

  levelPill: {
    alignSelf: 'flex-start',
    backgroundColor: Palette.goldSoft,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  levelPillText: { color: Palette.goldDark, fontSize: 11, fontWeight: '800', letterSpacing: 0.4 },

  courseTitle: {
    color: Palette.charcoal,
    fontFamily: 'serif',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },

  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressTrack: {
    flex: 1, height: 6, borderRadius: 6,
    backgroundColor: Palette.goldSoft, overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 6, backgroundColor: Palette.gold },
  progressPct: { color: Palette.goldDark, fontSize: 12, fontWeight: '700', minWidth: 34, textAlign: 'right' },

  courseFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Palette.line,
  },
  lockPrice: {
    color: Palette.charcoal,
    fontFamily: 'serif',
    fontSize: 20,
    fontWeight: '800',
  },
  unlockBtn: {
    backgroundColor: Palette.goldDark,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
  },
  unlockBtnText: { color: Palette.surface, fontSize: 13, fontWeight: '700' },
  openBtn: {
    backgroundColor: Palette.charcoal,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
  },
  openBtnText: { color: Palette.surface, fontSize: 13, fontWeight: '700' },
});
