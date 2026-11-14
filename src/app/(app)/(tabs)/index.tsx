import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  AppHeader,
  AppIcon,
  Card,
  ProgressBar,
  Screen,
  SectionTitle,
  ui,
} from '@/components/karma-ui';
import { Palette } from '@/constants/theme';
import { useSession } from '@/context/auth-context';
import {
  type Course,
  type MeditationStats,
  type SiteAnnouncement,
  apiGetAnnouncement,
  apiGetCourses,
  apiGetMeditationStats,
  apiGetUnreadCount,
} from '@/services/api';

export default function HomeScreen() {
  const { user, session } = useSession();
  const firstName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Seeker';
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const [meditationStats, setMeditationStats] = useState<MeditationStats | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [announcement, setAnnouncement] = useState<SiteAnnouncement | null>(null);
  const [announcementVisible, setAnnouncementVisible] = useState(false);

  // Fetch the site announcement once on mount (public endpoint, no token needed)
  useEffect(() => {
    apiGetAnnouncement().then((data) => {
      if (data?.enabled && data.title.trim() && data.message.trim()) {
        setAnnouncement(data);
        setAnnouncementVisible(true);
      }
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!session) return;
      setLoading(true);
      Promise.allSettled([
        apiGetMeditationStats(session),
        apiGetCourses(session),
        apiGetUnreadCount(session),
      ]).then(([statsRes, coursesRes, countRes]) => {
        if (statsRes.status === 'fulfilled' && statsRes.value.data) {
          setMeditationStats(statsRes.value.data);
        }
        if (coursesRes.status === 'fulfilled' && coursesRes.value.data) {
          setCourses(coursesRes.value.data.courses);
        }
        if (countRes.status === 'fulfilled') {
          setUnreadCount(countRes.value);
        }
        setLoading(false);
      });
    }, [session])
  );

  const enrolledCourses = courses.filter((c) => c.enrolled);
  const mostRecentCourse = enrolledCourses.find((c) => (c.progress_pct ?? 0) > 0 && (c.progress_pct ?? 0) < 100) ?? enrolledCourses[0] ?? null;

  return (
    <Screen>
      {/* ── Site announcement popup ── */}
      {announcement && (
        <Modal
          visible={announcementVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setAnnouncementVisible(false)}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setAnnouncementVisible(false)}>
            <Pressable style={styles.announcementCard} onPress={() => {}}>
              <Text style={styles.announcementTitle}>{announcement.title}</Text>
              <Text style={styles.announcementMessage}>{announcement.message}</Text>
              {!!announcement.actionLabel && !!announcement.actionUrl && (
                <Pressable
                  style={styles.announcementCta}
                  onPress={() => {
                    setAnnouncementVisible(false);
                    router.push(announcement.actionUrl as any);
                  }}
                >
                  <Text style={styles.announcementCtaText}>{announcement.actionLabel}</Text>
                </Pressable>
              )}
              <Pressable style={styles.announcementDismiss} onPress={() => setAnnouncementVisible(false)}>
                <Text style={styles.announcementDismissText}>Dismiss</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {/* ── Header ── */}
      <AppHeader
        title="Karma Vajra"
        action={
          <Pressable
            style={styles.bellBtn}
            onPress={() => router.push('/notifications' as any)}
          >
            <AppIcon name="bell" />
            {unreadCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>
                  {unreadCount > 9 ? '9+' : String(unreadCount)}
                </Text>
              </View>
            )}
          </Pressable>
        }
      />

      {/* ── Welcome hero — matches website's user-dashboard-welcome ── */}
      <Card style={styles.heroCard}>
        <View style={styles.heroContent}>
          <Text style={styles.heroEyebrow}>YOUR SPACE</Text>
          <Text style={styles.heroHeading}>
            {greeting},{'\n'}{firstName}
          </Text>
          <Text style={[ui.body, { marginTop: 4 }]}>
            Pick up where you left off or find something new for your practice today.
          </Text>
          <Pressable
            style={styles.heroCta}
            onPress={() => router.push('/sadhana' as any)}
          >
            <Text style={styles.heroCtaText}>Open Daily Sadhana →</Text>
          </Pressable>
        </View>
        <View style={styles.heroArt} aria-hidden>
          <Ionicons name="flower-outline" size={52} color={Palette.goldDark} />
        </View>
      </Card>

      {/* ── Stats grid — matches website's dash-stats-grid ── */}
      {loading ? (
        <View style={styles.statsLoading}>
          <ActivityIndicator color={Palette.gold} />
        </View>
      ) : (
        <View style={styles.statsGrid}>
          <StatCard
            label="Meditation Sessions"
            value={String(meditationStats?.sessionsPlayed ?? 0)}
            meta={`${meditationStats?.sessionsCompleted ?? 0} completed`}
          />
          <StatCard
            label="Bookmarked"
            value={String(meditationStats?.bookmarkCount ?? 0)}
            meta="saved items"
          />
          <StatCard
            label="Courses"
            value={String(enrolledCourses.length)}
            meta="enrolled"
          />
        </View>
      )}

      {/* ── Widget grid — matches website's dash-widgets-grid ── */}
      <SectionTitle>Your practice</SectionTitle>
      <View style={styles.widgetsGrid}>

        {/* Widget 1: Continue Meditation */}
        <Card style={styles.widget}>
          <View style={styles.widgetIconRow}>
            <View style={styles.widgetIconBadge}>
              <Ionicons name="headset-outline" size={18} color={Palette.goldDark} />
            </View>
            <Text style={styles.widgetTitle}>Continue Meditation</Text>
          </View>
          {meditationStats?.lastPlayed ? (
            <>
              <Text style={styles.widgetValue} numberOfLines={2}>
                {meditationStats.lastPlayed.title}
              </Text>
              <Text style={ui.small}>
                {meditationStats.lastPlayed.completed ? 'Completed' : 'In progress'}
              </Text>
              <Pressable
                style={styles.widgetBtn}
                onPress={() =>
                  router.push(`/meditation/${meditationStats.lastPlayed!.id}` as any)
                }
              >
                <Text style={styles.widgetBtnText}>
                  {meditationStats.lastPlayed.completed ? 'Play again →' : 'Resume →'}
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={ui.small}>You haven't started a session yet.</Text>
              <Pressable
                style={styles.widgetBtn}
                onPress={() => router.push('/meditations' as any)}
              >
                <Text style={styles.widgetBtnText}>Explore meditations →</Text>
              </Pressable>
            </>
          )}
        </Card>

        {/* Widget 2: My Courses */}
        <Card style={styles.widget}>
          <View style={styles.widgetIconRow}>
            <View style={styles.widgetIconBadge}>
              <FontAwesome5 name="book-open" size={16} color={Palette.goldDark} />
            </View>
            <Text style={styles.widgetTitle}>My Courses</Text>
          </View>
          {mostRecentCourse ? (
            <>
              <Text style={styles.widgetValue} numberOfLines={2}>
                {mostRecentCourse.title}
              </Text>
              {mostRecentCourse.mentor_name && (
                <Text style={ui.small}>with {mostRecentCourse.mentor_name}</Text>
              )}
              {(mostRecentCourse.progress_pct ?? 0) > 0 && (
                <ProgressBar pct={mostRecentCourse.progress_pct ?? 0} />
              )}
              <Pressable
                style={styles.widgetBtn}
                onPress={() => router.push(`/courses/${mostRecentCourse.id}` as any)}
              >
                <Text style={styles.widgetBtnText}>Continue course →</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={ui.small}>You haven't enrolled in any courses yet.</Text>
              <Pressable
                style={styles.widgetBtn}
                onPress={() => router.push('/courses' as any)}
              >
                <Text style={styles.widgetBtnText}>Browse courses →</Text>
              </Pressable>
            </>
          )}
        </Card>

        {/* Widget 3: Saved Items */}
        <Card style={styles.widget}>
          <View style={styles.widgetIconRow}>
            <View style={styles.widgetIconBadge}>
              <Ionicons name="bookmark-outline" size={18} color={Palette.goldDark} />
            </View>
            <Text style={styles.widgetTitle}>Saved for Later</Text>
          </View>
          <Text style={ui.small}>
            Keep your favourite courses, meditations, and products close at hand.
          </Text>
          <Pressable
            style={[styles.widgetBtn, styles.widgetBtnOutline]}
            onPress={() => router.push('/bookmarks' as any)}
          >
            <Text style={styles.widgetBtnOutlineText}>View saved items →</Text>
          </Pressable>
        </Card>

        {/* Widget 4: Shop */}
        <Card style={styles.widget}>
          <View style={styles.widgetIconRow}>
            <View style={styles.widgetIconBadge}>
              <MaterialCommunityIcons name="store-outline" size={18} color={Palette.goldDark} />
            </View>
            <Text style={styles.widgetTitle}>Divine Shop</Text>
          </View>
          <Text style={ui.small}>
            Explore meaningful items chosen to support your spiritual journey.
          </Text>
          <Pressable
            style={[styles.widgetBtn, styles.widgetBtnOutline]}
            onPress={() => router.push('/shop' as any)}
          >
            <Text style={styles.widgetBtnOutlineText}>Explore products →</Text>
          </Pressable>
        </Card>

      </View>

      {/* ── Daily Sadhana shortcut ── */}
      {/* <Pressable onPress={() => router.push('/sadhana' as any)}>
        <Card style={styles.sadhanaCard}>
          <View style={styles.sadhanaLeft}>
            <Text style={styles.sadhanaEyebrow}>TODAY</Text>
            <Text style={styles.sadhanaTitle}>Daily Sadhana</Text>
            <Text style={ui.small}>Complete today's practice to keep your streak.</Text>
          </View>
          <Text style={styles.sadhanaArrow}>›</Text>
        </Card>
      </Pressable> */}
    </Screen>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatCard({ label, value, meta }: { label: string; value: string; meta: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statMeta}>{meta}</Text>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

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
  bellBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Palette.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  bellBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },

  // Hero card
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.goldSoft,
    borderColor: Palette.gold,
    gap: 0,
  },
  heroContent: { flex: 1, gap: 6 },
  heroEyebrow: {
    color: Palette.goldDark,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  heroHeading: {
    color: Palette.charcoal,
    fontFamily: 'serif',
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
  },
  heroCta: {
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  heroCtaText: {
    color: Palette.goldDark,
    fontSize: 14,
    fontWeight: '700',
  },
  heroArt: { marginLeft: 8, alignItems: 'center', justifyContent: 'center' },

  // Stats grid
  statsLoading: { paddingVertical: 24, alignItems: 'center' },
  statsGrid: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: Palette.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Palette.line,
    padding: 14,
    gap: 3,
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0px 2px 6px rgba(42,36,28,0.04)' },
      default: {
        shadowColor: Palette.charcoal,
        shadowOpacity: 0.04,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
      },
    }),
  },
  statValue: {
    color: Palette.goldDark,
    fontFamily: 'serif',
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    color: Palette.charcoal,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  statMeta: { color: Palette.stone, fontSize: 10, textAlign: 'center' },

  // Widgets grid
  widgetsGrid: { gap: 12 },
  widget: { gap: 10 },
  widgetIconRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  widgetIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Palette.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  widgetTitle: {
    color: Palette.charcoal,
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  widgetValue: {
    color: Palette.charcoal,
    fontFamily: 'serif',
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
  },
  widgetBtn: {
    marginTop: 4,
    alignSelf: 'flex-start',
    backgroundColor: Palette.charcoal,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  widgetBtnText: { color: Palette.surface, fontSize: 13, fontWeight: '700' },
  widgetBtnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Palette.goldDark,
  },
  widgetBtnOutlineText: { color: Palette.goldDark, fontSize: 13, fontWeight: '700' },

  // Sadhana shortcut
  sadhanaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.charcoal,
    borderColor: Palette.charcoal,
  },
  sadhanaLeft: { flex: 1, gap: 4 },
  sadhanaEyebrow: { color: Palette.gold, fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  sadhanaTitle: {
    color: '#F0E6CC',
    fontFamily: 'serif',
    fontSize: 18,
    fontWeight: '700',
  },
  sadhanaArrow: { color: Palette.gold, fontSize: 32 },

  // Announcement modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(37,37,37,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  announcementCard: {
    backgroundColor: Palette.surface,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    gap: 14,
    borderWidth: 1,
    borderColor: Palette.line,
  },
  announcementTitle: {
    color: Palette.charcoal,
    fontFamily: 'serif',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
  },
  announcementMessage: {
    color: Palette.stone,
    fontSize: 14,
    lineHeight: 20,
  },
  announcementCta: {
    backgroundColor: Palette.charcoal,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  announcementCtaText: {
    color: Palette.surface,
    fontSize: 14,
    fontWeight: '700',
  },
  announcementDismiss: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  announcementDismissText: {
    color: Palette.stoneLight,
    fontSize: 13,
  },
});