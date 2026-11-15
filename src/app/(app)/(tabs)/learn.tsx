import { FontAwesome5, Ionicons } from '@expo/vector-icons';

import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader, Card, Pill, Screen, SectionTitle, ui } from '@/components/karma-ui';
import { BrandFonts, Palette } from '@/constants/theme';
import { useSession } from '@/context/auth-context';
import { type Course, type Meditation, apiGetCourses, apiGetMeditations, apiGetMeditationStats } from '@/services/api';

type Segment = 'courses' | 'meditations';

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

function formatMin(sec: number | null | undefined): string {
  if (!sec) return '';
  const m = Math.round(sec / 60);
  return m > 0 ? `${m} min` : '';
}

export default function LearnScreen() {
  const { session } = useSession();
  const params = useLocalSearchParams<{ segment?: string }>();
  const [segment, setSegment] = useState<Segment>('courses');

  // ── Courses state ──────────────────────────────────────────────────────────
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);

  const fetchCourses = useCallback(async () => {
    if (!session) return;
    setCoursesLoading(true);
    const res = await apiGetCourses(session);
    if (res.data) setCourses(res.data.courses);
    setCoursesLoading(false);
  }, [session]);

  // ── Meditations state ──────────────────────────────────────────────────────
  const [meditations, setMeditations] = useState<Meditation[]>([]);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [medsLoading, setMedsLoading] = useState(false);
  const [medsLoaded, setMedsLoaded] = useState(false);
  const medsLoadedRef = useRef(false);

  const fetchMeditations = useCallback(async () => {
    if (!session) return;
    setMedsLoading(true);
    const res = await apiGetMeditations(session);
    if (res.data) {
      const list = res.data.meditations ?? [];
      setMeditations(list);
      setCompletedCount(list.filter((m) => m.completed).length);
      apiGetMeditationStats(session).then((sr) => {
        if (sr.data) setTotalMinutes(sr.data.totalMinutes);
      });
    }
    setMedsLoading(false);
    setMedsLoaded(true);
    medsLoadedRef.current = true;
  }, [session]);

  // Lazy-load meditations the first time user switches to that segment
  const handleSegment = useCallback((s: Segment) => {
    setSegment(s);
    if (s === 'meditations' && !medsLoaded) fetchMeditations();
  }, [medsLoaded, fetchMeditations]);

  // If navigated with ?segment=meditations (e.g. from Home "Explore meditations")
  useEffect(() => {
    if (params.segment === 'meditations') {
      handleSegment('meditations');
    }
  }, [params.segment, handleSegment]);

  // Refetch on focus so purchases made on the detail screen (which unlock
  // meditations) are reflected when the user navigates back here.
  useFocusEffect(
    useCallback(() => {
      fetchCourses();
      if (medsLoadedRef.current) fetchMeditations();
    }, [fetchCourses, fetchMeditations])
  );

  const inProgress = courses.find((c) => (c.progress_pct ?? 0) > 0 && (c.progress_pct ?? 0) < 100);
  const rest = courses.filter((c) => c.id !== inProgress?.id).slice(0, 4);

  const displayedMeds = meditations;
  const featuredMed = displayedMeds[0] ?? null;
  const medsListData = displayedMeds.slice(1);

  return (
    <Screen>
      <AppHeader title="Learn" />

      {/* ── Segment switcher: Courses | Meditation ── */}
      <View style={styles.switcher}>
        <Pressable
          style={[styles.switchBtn, segment === 'courses' && styles.switchBtnActive]}
          onPress={() => handleSegment('courses')}
        >
          <FontAwesome5
            name="book-open"
            size={13}
            color={segment === 'courses' ? Palette.surface : Palette.stone}
          />
          <Text style={segment === 'courses' ? styles.switchBtnTextActive : styles.switchBtnText}>
            Courses
          </Text>
        </Pressable>
        <Pressable
          style={[styles.switchBtn, segment === 'meditations' && styles.switchBtnActive]}
          onPress={() => handleSegment('meditations')}
        >
          <Ionicons
            name="headset-outline"
            size={15}
            color={segment === 'meditations' ? Palette.surface : Palette.stone}
          />
          <Text style={segment === 'meditations' ? styles.switchBtnTextActive : styles.switchBtnText}>
            Meditation
          </Text>
        </Pressable>
      </View>

      {/* ═══════════════════════════════ COURSES ═══════════════════════════════ */}
      {segment === 'courses' && (
        <>
          {coursesLoading && (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={Palette.gold} size="large" />
            </View>
          )}

          {!coursesLoading && (
            <>
              {inProgress ? (
                <>
                  <SectionTitle>Continue learning</SectionTitle>
                  <Pressable onPress={() => router.push(`/courses/${inProgress.id}` as any)}>
                    <Card style={styles.featured}>
                      <View style={styles.featuredArt}>
                        <FontAwesome5 name="book-open" size={48} color={Palette.goldDark} />
                      </View>
                      <View style={styles.featuredBody}>
                        <Pill>IN PROGRESS</Pill>
                        <Text style={styles.featuredTitle} numberOfLines={2}>{inProgress.title}</Text>
                        <Text style={ui.small}>
                          {inProgress.completed_lessons ?? 0} of {inProgress.total_lessons ?? '?'} lessons complete
                        </Text>
                        <View style={styles.track}>
                          <View style={[styles.fill, { width: `${inProgress.progress_pct ?? 0}%` }]} />
                        </View>
                        <Text style={styles.pctLabel}>{inProgress.progress_pct ?? 0}% complete</Text>
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
                        <FontAwesome5 name="book-open" size={48} color={Palette.goldDark} />
                      </View>
                      <View style={styles.featuredBody}>
                        <Pill>{(courses[0].level ?? 'Course').toUpperCase()}</Pill>
                        <Text style={styles.featuredTitle} numberOfLines={2}>{courses[0].title}</Text>
                        <Text style={ui.small}>
                          {courses[0].total_lessons ? `${courses[0].total_lessons} lessons · ` : ''}Begin today
                        </Text>
                      </View>
                    </Card>
                  </Pressable>
                </>
              ) : null}

              {rest.length > 0 && (
                <>
                  <SectionTitle
                    action={
                      <Pressable onPress={() => router.push('/courses' as any)}>
                        <Text style={styles.seeAll}>See all</Text>
                      </Pressable>
                    }
                  >
                    Explore courses
                  </SectionTitle>
                  <View style={styles.list}>
                    {rest.map((c, index) => (
                      <Pressable key={c.id} onPress={() => router.push(`/courses/${c.id}` as any)}>
                        <Card style={styles.courseRow}>
                          <Text style={styles.number}>{String(index + 1).padStart(2, '0')}</Text>
                          <View style={styles.courseInfo}>
                            <Text style={styles.courseTitle} numberOfLines={1}>{c.title}</Text>
                            <View style={styles.courseMeta}>
                              <View style={[styles.levelBadge, { backgroundColor: LEVEL_COLOR[c.level ?? ''] ?? Palette.goldSoft }]}>
                                <Text style={[styles.levelText, { color: LEVEL_TEXT[c.level ?? ''] ?? Palette.goldDark }]}>
                                  {c.level ?? 'Course'}
                                </Text>
                              </View>
                              <Text style={ui.small}>
                                {c.total_lessons ? `${c.total_lessons} lesson${c.total_lessons !== 1 ? 's' : ''}` : 'View course'}
                              </Text>
                              {(c.progress_pct ?? 0) === 100 && (
                                <Text style={styles.completedMark}>Done</Text>
                              )}
                            </View>
                          </View>
                          <Ionicons name="chevron-forward" size={20} color={Palette.goldDark} />
                        </Card>
                      </Pressable>
                    ))}
                  </View>
                </>
              )}

              {courses.length === 0 && (
                <Card style={styles.empty}>
                  <FontAwesome5 name="book-open" size={40} color={Palette.stoneLight} />
                  <Text style={styles.emptyTitle}>No courses found</Text>
                  <Text style={[ui.small, { textAlign: 'center' }]}>
                    Tap below to refresh and load teachings from the server.
                  </Text>
                  <Pressable style={styles.browseBtn} onPress={fetchCourses}>
                    <Text style={styles.browseBtnText}>Refresh Courses</Text>
                  </Pressable>
                </Card>
              )}

              {courses.length > 0 && (
                <Pressable style={styles.browseBtn} onPress={() => router.push('/courses' as any)}>
                  <Text style={styles.browseBtnText}>Browse all courses</Text>
                </Pressable>
              )}
            </>
          )}
        </>
      )}

      {/* ═══════════════════════════════ MEDITATIONS ════════════════════════════ */}
      {segment === 'meditations' && (
        <>
          {/* Stats strip */}
          <View style={styles.statsStrip}>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{totalMinutes}</Text>
              <Text style={styles.statLbl}>Min Meditated</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{completedCount}</Text>
              <Text style={styles.statLbl}>Sessions Done</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{meditations.length}</Text>
              <Text style={styles.statLbl}>Available</Text>
            </View>
          </View>

          {medsLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={Palette.gold} size="large" />
            </View>
          ) : (
            <>
              {featuredMed && (
                <>
                  <SectionTitle>Featured practice</SectionTitle>
                  <Pressable onPress={() => !featuredMed.locked && router.push(`/meditation/${featuredMed.id}` as any)}>
                    <Card style={styles.featuredMed}>
                      <View style={styles.featuredMedHeader}>
                        <View />
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          {featuredMed.duration_sec > 0 && (
                            <Text style={styles.durBadge}>{formatMin(featuredMed.duration_sec)}</Text>
                          )}
                          {featuredMed.locked && (
                            <View style={styles.lockBadge}>
                              <Text style={styles.lockBadgeText}>Enroll to unlock</Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <Text style={styles.featuredMedTitle}>{featuredMed.title}</Text>
                      {featuredMed.description ? (
                        <Text style={styles.featuredMedDesc} numberOfLines={2}>{featuredMed.description}</Text>
                      ) : null}
                      <View style={styles.featuredMedFooter}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Ionicons name="person-circle-outline" size={22} color={Palette.goldSoft} />
                          <Text style={styles.guideName}>{featuredMed.guide_name}</Text>
                        </View>
                        {!featuredMed.locked && (
                          <View style={styles.playFab}>
                            <Ionicons name="play" size={16} color={Palette.charcoal} style={{ marginLeft: 2 }} />
                          </View>
                        )}
                      </View>
                    </Card>
                  </Pressable>
                </>
              )}

              <SectionTitle>All sessions</SectionTitle>

              {displayedMeds.length === 0 ? (
                <Card style={styles.empty}>
                  <Ionicons name="headset-outline" size={44} color={Palette.stoneLight} />
                  <Text style={styles.emptyTitle}>No sessions available</Text>
                </Card>
              ) : (
                <View style={styles.list}>
                  {medsListData.map((m) => (
                    <MeditationRow key={m.id} item={m} />
                  ))}
                </View>
              )}
            </>
          )}
        </>
      )}
    </Screen>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function MeditationRow({ item }: { item: Meditation }) {
  const handlePress = () => {
    // Always navigate to the meditation detail screen — it handles locked state
    router.push(`/meditation/${item.id}` as any);
  };

  return (
    <Pressable onPress={handlePress}>
      <Card style={[mStyles.row, item.locked && mStyles.rowLocked] as any}>
        <View style={[mStyles.art, { backgroundColor: item.locked ? '#E5E7EB' : Palette.goldSoft }]}>
          {item.locked
            ? <Ionicons name="lock-closed" size={22} color={Palette.stone} />
            : <Ionicons name="headset-outline" size={22} color={Palette.goldDark} />
          }
        </View>
        <View style={mStyles.body}>
          <Text style={mStyles.title} numberOfLines={1}>{item.title}</Text>
          {item.locked ? (
            <Text style={mStyles.guide} numberOfLines={1}>
              {item.course_title ?? 'Course required'}
            </Text>
          ) : (
            <Text style={mStyles.guide} numberOfLines={1}>
              {item.guide_name}{item.duration_sec > 0 ? ` · ${formatMin(item.duration_sec)}` : ''}
            </Text>
          )}
          {!item.locked && item.completed && (
            <Text style={mStyles.done}>Completed</Text>
          )}
        </View>
        <View style={[mStyles.play, item.locked && mStyles.playLocked]}>
          {item.locked
            ? <Ionicons name="lock-closed" size={14} color={Palette.stone} />
            : <Ionicons name="play" size={14} color={Palette.goldDark} style={{ marginLeft: 2 }} />
          }
        </View>
      </Card>
    </Pressable>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  loadingWrap: { paddingVertical: 48, alignItems: 'center' },

  // Segment switcher
  switcher: {
    flexDirection: 'row',
    backgroundColor: Palette.surface,
    borderRadius: 18,
    padding: 4,
    borderWidth: 1,
    borderColor: Palette.line,
    marginBottom: 4,
  },
  switchBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 14,
    alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6,
  },
  switchBtnActive: { backgroundColor: Palette.charcoal },
  switchBtnText: { color: Palette.stone, fontSize: 13, fontWeight: '700' },
  switchBtnTextActive: { color: Palette.surface, fontSize: 13, fontWeight: '700' },

  // Featured course card
  featured: { gap: 0, padding: 0, overflow: 'hidden' },
  featuredArt: {
    height: 150, backgroundColor: Palette.goldSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  featuredBody: { padding: 18, gap: 8 },
  featuredTitle: {
    color: Palette.charcoal, fontFamily: BrandFonts.heading,
    fontSize: 22, fontWeight: '700', lineHeight: 28,
  },
  track: { height: 7, borderRadius: 8, backgroundColor: Palette.goldSoft, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 8, backgroundColor: Palette.gold },
  pctLabel: { color: Palette.goldDark, fontSize: 12, fontWeight: '700' },

  // Course list
  seeAll: { color: Palette.goldDark, fontSize: 14, fontWeight: '700' },
  list: { gap: 10 },
  courseRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderRadius: 20 },
  number: { color: Palette.goldDark, fontFamily: BrandFonts.heading, fontSize: 22, minWidth: 34, textAlign: 'center' },
  courseInfo: { flex: 1, gap: 5 },
  courseTitle: { color: Palette.charcoal, fontWeight: '700', fontSize: 15 },
  courseMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  levelBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  levelText: { fontSize: 11, fontWeight: '700' },
  completedMark: { color: '#2D6A4F', fontSize: 12, fontWeight: '700' },
  arrow: { color: Palette.goldDark, fontSize: 28 },

  // Browse all / empty
  browseBtn: {
    minHeight: 52, borderRadius: 17, borderWidth: 1,
    borderColor: Palette.goldDark, backgroundColor: Palette.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  browseBtnText: { color: Palette.goldDark, fontSize: 16, fontWeight: '700' },
  empty: { alignItems: 'center', gap: 12, paddingVertical: 40 },
  emptyTitle: { color: Palette.charcoal, fontFamily: BrandFonts.heading, fontSize: 20 },

  // Meditation stats strip
  statsStrip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    backgroundColor: Palette.surface, paddingVertical: 14, paddingHorizontal: 12,
    borderRadius: 20, borderWidth: 1, borderColor: Palette.line,
  },
  statBox: { alignItems: 'center' },
  statVal: { color: Palette.goldDark, fontFamily: BrandFonts.heading, fontSize: 22 },
  statLbl: { color: Palette.stone, fontSize: 11, fontWeight: '600', marginTop: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: Palette.line },

  // Scope filter pills
  catBar: { flexDirection: 'row', gap: 8, paddingVertical: 10 },
  catPill: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.line,
  },
  catPillActive: { backgroundColor: Palette.goldDark, borderColor: Palette.goldDark },
  catText: { color: Palette.charcoal, fontSize: 13, fontWeight: '600' },
  catTextActive: { color: Palette.surface, fontWeight: '700' },

  // Featured meditation card
  featuredMed: { backgroundColor: Palette.brown, padding: 20, borderRadius: 24, gap: 12 },
  featuredMedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  catBadge: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  catBadgeText: { color: Palette.goldSoft, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  durBadge: { color: Palette.goldSoft, fontSize: 12, fontWeight: '700' },
  lockBadge: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  lockBadgeText: { color: Palette.goldSoft, fontSize: 11, fontWeight: '700' },
  featuredMedTitle: { color: Palette.onAccent, fontFamily: BrandFonts.heading, fontSize: 22, lineHeight: 28 },
  featuredMedDesc: { color: Palette.goldSoft, fontSize: 14, lineHeight: 20 },
  featuredMedFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  guideName: { color: Palette.goldSoft, fontSize: 13, fontWeight: '600' },
  playFab: { width: 44, height: 44, borderRadius: 22, backgroundColor: Palette.gold, alignItems: 'center', justifyContent: 'center' },
});

const mStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 20, gap: 14 },
  rowLocked: { backgroundColor: Palette.ivory },
  art: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  body: { flex: 1, gap: 4 },
  title: { color: Palette.charcoal, fontSize: 16, fontWeight: '700' },
  guide: { color: Palette.stone, fontSize: 13 },
  done: { color: Palette.success, fontSize: 12, fontWeight: '700' },
  play: { width: 38, height: 38, borderRadius: 19, backgroundColor: Palette.goldSoft, alignItems: 'center', justifyContent: 'center' },
  playLocked: { backgroundColor: Palette.line },
});
