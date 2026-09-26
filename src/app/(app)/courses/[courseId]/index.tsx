import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader, Card, Pill, SectionTitle, ui } from '@/components/karma-ui';
import { Palette, Spacing } from '@/constants/theme';
import { useSession } from '@/context/auth-context';
import { type CourseDetail, apiGetCourseDetail } from '@/services/api';

type TabKey = 'lessons' | 'resources' | 'assignments' | 'quiz';

const LEVEL_COLORS: Record<string, { bg: string; text: string }> = {
  Beginner:     { bg: '#E8F5E9', text: '#1B5E20' },
  Intermediate: { bg: '#FFF8E1', text: '#7B5500' },
  Advanced:     { bg: '#FCE4EC', text: '#7B0020' },
};

export default function CourseDetailScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const { session } = useSession();
  const [detail, setDetail] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('lessons');

  const load = useCallback(
    async (silent = false) => {
      if (!session || !courseId) return;
      if (!silent) setLoading(true);
      const res = await apiGetCourseDetail(session, Number(courseId));
      if (res.error) setError(res.error);
      else setDetail(res.data ?? null);
      setLoading(false);
      setRefreshing(false);
    },
    [session, courseId]
  );

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Palette.gold} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !detail) {
    return (
      <SafeAreaView style={styles.safe}>
        <AppHeader title="Course" back />
        <Text style={styles.errorText}>{error ?? 'Course not found.'}</Text>
      </SafeAreaView>
    );
  }

  const { course, lessons, resources, assignments, quizzes } = detail;
  const lvlColor = LEVEL_COLORS[course.level] ?? { bg: Palette.goldSoft, text: Palette.goldDark };

  const tabs: { key: TabKey; label: string; count: number; emoji: string }[] = [
    { key: 'lessons',     label: 'Lessons',     count: lessons.length,     emoji: '▶' },
    { key: 'resources',   label: 'Resources',   count: resources.length,   emoji: '📄' },
    { key: 'assignments', label: 'Assignments', count: assignments.length, emoji: '✎' },
    { key: 'quiz',        label: 'Quiz',        count: quizzes.length,     emoji: '?' },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(true); }}
            tintColor={Palette.gold}
          />
        }
      >
        {/* Back header over dark hero */}
        <View style={styles.heroOuter}>
          <View style={styles.heroHeaderRow}>
            <AppHeader title="" back />
          </View>

          {/* Hero */}
          <View style={styles.heroContent}>
            <View style={[styles.levelBadge, { backgroundColor: lvlColor.bg }]}>
              <Text style={[styles.levelText, { color: lvlColor.text }]}>{course.level}</Text>
            </View>
            <Text style={styles.heroTitle}>{course.title}</Text>
            {course.description ? (
              <Text style={styles.heroDesc} numberOfLines={3}>{course.description}</Text>
            ) : null}
            <Text style={styles.heroMeta}>
              {course.total_lessons} lessons · {course.completed_lessons} completed
            </Text>
          </View>

          {/* Progress ring row */}
          {course.progress_pct > 0 && (
            <View style={styles.progressBlock}>
              <View style={styles.progressLabelRow}>
                <Text style={styles.progressLabel}>Your progress</Text>
                <Text style={styles.progressPct}>{course.progress_pct}%</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${course.progress_pct}%` }]} />
              </View>
            </View>
          )}
        </View>

        {/* Body card — sits below the dark hero */}
        <View style={styles.body}>

          {/* Tab bar */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBar}>
            {tabs.map((t) => (
              <Pressable
                key={t.key}
                style={[styles.tab, activeTab === t.key && styles.tabActive]}
                onPress={() => setActiveTab(t.key)}
              >
                <Text style={[styles.tabEmoji, activeTab === t.key && styles.tabEmojiActive]}>
                  {t.emoji}
                </Text>
                <Text style={[styles.tabLabel, activeTab === t.key && styles.tabLabelActive]}>
                  {t.label}
                </Text>
                {t.count > 0 && (
                  <View style={[styles.tabBadge, activeTab === t.key && styles.tabBadgeActive]}>
                    <Text style={[styles.tabBadgeText, activeTab === t.key && styles.tabBadgeTextActive]}>
                      {t.count}
                    </Text>
                  </View>
                )}
              </Pressable>
            ))}
          </ScrollView>

          {/* ── Lessons ── */}
          {activeTab === 'lessons' && (
            <View style={styles.section}>
              {lessons.length === 0 && <EmptyMsg text="No lessons for this course yet." />}
              {lessons.map((lesson, idx) => (
                <Pressable
                  key={lesson.id}
                  onPress={() => router.push(`/courses/${courseId}/lesson/${lesson.id}` as any)}
                >
                  <Card style={styles.lessonCard}>
                    <View style={[styles.lessonNum, lesson.completed && styles.lessonNumDone]}>
                      <Text style={[styles.lessonNumText, lesson.completed && styles.lessonNumTextDone]}>
                        {lesson.completed ? '✓' : String(idx + 1).padStart(2, '0')}
                      </Text>
                    </View>
                    <View style={styles.lessonInfo}>
                      <Text style={styles.lessonTitle} numberOfLines={2}>{lesson.title}</Text>
                      <View style={styles.lessonMeta}>
                        <Text style={styles.lessonDuration}>{formatDuration(lesson.duration_sec)}</Text>
                        {lesson.is_free && (
                          <View style={styles.freeBadge}>
                            <Text style={styles.freeText}>FREE</Text>
                          </View>
                        )}
                        {lesson.watched_sec > 0 && !lesson.completed && (
                          <Text style={styles.resumeText}>Resume</Text>
                        )}
                      </View>
                    </View>
                    {lesson.video_filename ? (
                      <View style={[styles.playBtn, lesson.completed && styles.playBtnDone]}>
                        <Text style={[styles.playIcon, lesson.completed && styles.playIconDone]}>
                          {lesson.completed ? '✓' : '▶'}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.noVideoBtn}>
                        <Text style={styles.noVideoIcon}>○</Text>
                      </View>
                    )}
                  </Card>
                </Pressable>
              ))}
            </View>
          )}

          {/* ── Resources ── */}
          {activeTab === 'resources' && (
            <View style={styles.section}>
              {resources.length === 0 && <EmptyMsg text="No resources for this course yet." />}
              {resources.map((r) => (
                <Pressable
                  key={r.id}
                  onPress={() => router.push(`/courses/${courseId}/resources` as any)}
                >
                  <Card style={styles.rowCard}>
                    <View style={styles.pdfIcon}>
                      <Text style={styles.pdfIconText}>PDF</Text>
                      {r.file_url && <View style={styles.availableDot} />}
                    </View>
                    <View style={styles.rowInfo}>
                      <Text style={styles.rowTitle}>{r.title}</Text>
                      {r.description ? (
                        <Text style={ui.small} numberOfLines={1}>{r.description}</Text>
                      ) : null}
                      <Text style={styles.rowStatus}>
                        {r.file_url ? '↓  Available' : 'Coming soon'}
                      </Text>
                    </View>
                    <Text style={styles.arrow}>›</Text>
                  </Card>
                </Pressable>
              ))}
            </View>
          )}

          {/* ── Assignments ── */}
          {activeTab === 'assignments' && (
            <View style={styles.section}>
              {assignments.length === 0 && <EmptyMsg text="No assignments for this course yet." />}
              {assignments.map((a) => (
                <Pressable
                  key={a.id}
                  onPress={() => router.push(`/courses/${courseId}/assignments/${a.id}` as any)}
                >
                  <Card style={styles.rowCard}>
                    <View style={[styles.assignIcon, a.submitted_at && styles.assignIconDone]}>
                      <Text style={styles.assignIconText}>{a.submitted_at ? '✓' : '✎'}</Text>
                    </View>
                    <View style={styles.rowInfo}>
                      <Text style={styles.rowTitle}>{a.title}</Text>
                      {a.description ? (
                        <Text style={ui.small} numberOfLines={1}>{a.description}</Text>
                      ) : null}
                      {a.submitted_at ? (
                        <View style={styles.submittedBadge}>
                          <Text style={styles.submittedText}>✓ Submitted</Text>
                        </View>
                      ) : (
                        <Text style={styles.dueText}>Due in {a.due_offset_days} days</Text>
                      )}
                    </View>
                    <Text style={styles.arrow}>›</Text>
                  </Card>
                </Pressable>
              ))}
            </View>
          )}

          {/* ── Quiz ── */}
          {activeTab === 'quiz' && (
            <View style={styles.section}>
              {quizzes.length === 0 && <EmptyMsg text="No quizzes for this course yet." />}
              {quizzes.map((q) => {
                const pct = q.best_score !== null && q.total_questions
                  ? Math.round((q.best_score / q.total_questions) * 100)
                  : null;
                return (
                  <Pressable
                    key={q.id}
                    onPress={() => router.push(`/courses/${courseId}/quiz/${q.id}` as any)}
                  >
                    <Card style={styles.rowCard}>
                      <View style={[styles.quizIcon, pct !== null && pct >= 60 && styles.quizIconPass]}>
                        <Text style={[styles.quizIconText, pct !== null && pct >= 60 && styles.quizIconTextPass]}>
                          {pct !== null && pct >= 60 ? '✓' : '?'}
                        </Text>
                      </View>
                      <View style={styles.rowInfo}>
                        <Text style={styles.rowTitle}>{q.title}</Text>
                        {q.description ? (
                          <Text style={ui.small} numberOfLines={1}>{q.description}</Text>
                        ) : null}
                        {q.best_score !== null && q.total_questions ? (
                          <Text style={styles.quizScore}>
                            Best: {q.best_score}/{q.total_questions} ({pct}%)
                            · {q.attempt_count} attempt{q.attempt_count !== 1 ? 's' : ''}
                          </Text>
                        ) : (
                          <Text style={styles.notAttempted}>Not attempted yet</Text>
                        )}
                      </View>
                      <Text style={styles.arrow}>›</Text>
                    </Card>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function EmptyMsg({ text }: { text: string }) {
  return <Text style={styles.emptyMsg}>{text}</Text>;
}

function formatDuration(sec: number): string {
  if (!sec) return '—';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')} min`;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.ivory },
  scroll: { paddingBottom: 120 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: Palette.danger, padding: 24, textAlign: 'center' },

  // ── Hero (dark band) ──
  heroOuter: {
    backgroundColor: Palette.charcoal,
    paddingBottom: 28,
  },
  heroHeaderRow: { paddingHorizontal: Spacing.three },
  heroContent: {
    paddingHorizontal: Spacing.three,
    gap: 10,
    marginTop: 8,
  },
  levelBadge: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  levelText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  heroTitle: {
    color: '#F0E6CC',
    fontFamily: 'serif',
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 32,
  },
  heroDesc: { color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 20 },
  heroMeta: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },

  progressBlock: {
    paddingHorizontal: Spacing.three,
    gap: 8,
    marginTop: 16,
  },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  progressPct: { color: Palette.gold, fontSize: 12, fontWeight: '700' },
  progressTrack: {
    height: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 6, backgroundColor: Palette.gold },

  // ── Body ──
  body: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    gap: Spacing.three,
  },

  // ── Tab bar ──
  tabBar: { gap: 8, paddingVertical: 4 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.line,
  },
  tabActive: { backgroundColor: Palette.charcoal, borderColor: Palette.charcoal },
  tabEmoji: { fontSize: 13, color: Palette.stone },
  tabEmojiActive: { color: Palette.gold },
  tabLabel: { color: Palette.stone, fontSize: 13, fontWeight: '600' },
  tabLabelActive: { color: '#FFFFFF' },
  tabBadge: {
    backgroundColor: Palette.line,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  tabBadgeActive: { backgroundColor: 'rgba(255,255,255,0.15)' },
  tabBadgeText: { color: Palette.stone, fontSize: 11, fontWeight: '700' },
  tabBadgeTextActive: { color: '#FFFFFF' },

  section: { gap: 10 },
  emptyMsg: { color: Palette.stoneLight, fontSize: 14, textAlign: 'center', paddingVertical: 24 },

  // ── Lesson card ──
  lessonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    borderRadius: 20,
  },
  lessonNum: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Palette.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  lessonNumDone: { backgroundColor: '#D4EDDA' },
  lessonNumText: { color: Palette.goldDark, fontFamily: 'serif', fontSize: 15, fontWeight: '700' },
  lessonNumTextDone: { color: '#2D6A4F' },
  lessonInfo: { flex: 1, gap: 5 },
  lessonTitle: { color: Palette.charcoal, fontSize: 15, fontWeight: '600' },
  lessonMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lessonDuration: { color: Palette.stone, fontSize: 12 },
  freeBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  freeText: { color: '#2D6A4F', fontSize: 10, fontWeight: '800' },
  resumeText: { color: Palette.goldDark, fontSize: 11, fontWeight: '600' },
  playBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Palette.gold,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  playBtnDone: { backgroundColor: '#D4EDDA' },
  playIcon: { color: Palette.charcoal, fontSize: 14, marginLeft: 2 },
  playIconDone: { color: '#2D6A4F', marginLeft: 0 },
  noVideoBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Palette.line,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  noVideoIcon: { color: Palette.stoneLight, fontSize: 16 },

  // ── Shared row card ──
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    borderRadius: 20,
  },
  rowInfo: { flex: 1, gap: 4 },
  rowTitle: { color: Palette.charcoal, fontSize: 15, fontWeight: '600' },
  rowStatus: { color: Palette.goldDark, fontSize: 12, fontWeight: '600' },

  // PDF
  pdfIcon: {
    width: 46,
    height: 54,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    position: 'relative',
  },
  pdfIconText: { color: '#991B1B', fontSize: 11, fontWeight: '800' },
  availableDot: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: Palette.surface,
  },

  // Assignment
  assignIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Palette.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  assignIconDone: { backgroundColor: '#D4EDDA' },
  assignIconText: { color: Palette.goldDark, fontSize: 20 },
  submittedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#D4EDDA',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 2,
  },
  submittedText: { color: '#2D6A4F', fontSize: 11, fontWeight: '700' },
  dueText: { color: Palette.stone, fontSize: 12, marginTop: 2 },

  // Quiz
  quizIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Palette.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  quizIconPass: { backgroundColor: '#D4EDDA' },
  quizIconText: { color: Palette.goldDark, fontFamily: 'serif', fontSize: 20, fontWeight: '700' },
  quizIconTextPass: { color: '#2D6A4F' },
  quizScore: { color: Palette.goldDark, fontSize: 12, fontWeight: '600', marginTop: 2 },
  notAttempted: { color: Palette.stoneLight, fontSize: 12, marginTop: 2 },

  arrow: { color: Palette.goldDark, fontSize: 28 },
});
