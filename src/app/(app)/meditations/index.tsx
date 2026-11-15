import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader, Card, type IoniconName, Screen, SectionTitle } from '@/components/karma-ui';
import { BrandFonts, Palette } from '@/constants/theme';
import { useSession } from '@/context/auth-context';
import {
  type Meditation,
  apiGetMeditations,
  apiGetMeditationStats,
} from '@/services/api';


function categoryTheme(cat: string | null | undefined) {
  // Website palette only — the icon distinguishes the category.
  const CATEGORY_THEME: Record<string, { bg: string; tagBg: string; icon: IoniconName }> = {
    Guided:     { bg: Palette.goldDark, tagBg: Palette.goldSoft, icon: 'body-outline' },
    Sound:      { bg: Palette.brown,    tagBg: Palette.goldSoft, icon: 'musical-notes-outline' },
    Breathwork: { bg: Palette.success,  tagBg: Palette.successSoft, icon: 'leaf-outline' },
    Ambient:    { bg: Palette.gold,     tagBg: Palette.goldSoft, icon: 'sparkles-outline' },
  };
  return CATEGORY_THEME[cat ?? ''] ?? { bg: Palette.goldDark, tagBg: Palette.goldSoft, icon: 'flower-outline' as IoniconName };
}

function formatMin(sec: number | null | undefined): string {
  if (!sec) return '';
  const m = Math.round(sec / 60);
  return m > 0 ? `${m} min` : '';
}

export default function MeditationsLibraryScreen() {
  const { session } = useSession();
  const [allMeditations, setAllMeditations] = useState<Meditation[]>([]);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMeditations = useCallback(
    async (isRef = false) => {
      if (!session) return;
      if (isRef) setRefreshing(true);
      else setLoading(true);

      // Always fetch all meditations; filter client-side by scope
      const res = await apiGetMeditations(session);
      if (res.data) {
        const list = res.data.meditations ?? [];
        setAllMeditations(list);
        setCompletedCount(list.filter((m) => m.completed).length);
        apiGetMeditationStats(session).then((sr) => {
          if (sr.data) setTotalMinutes(sr.data.totalMinutes);
        });
      }
      setLoading(false);
      setRefreshing(false);
    },
    [session]
  );

  useFocusEffect(
    useCallback(() => { fetchMeditations(); }, [fetchMeditations])
  );

  const displayed = allMeditations;

  const featured = displayed[0] ?? null;
  const listData = displayed.slice(1);

  return (
    <SafeAreaView style={styles.safe}>
      <Screen>
        <AppHeader
          title="Meditations"
          back
        />

        {/* Stats strip */}
        <View style={styles.statsStrip}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{totalMinutes}</Text>
            <Text style={styles.statLbl}>Minutes Meditated</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{completedCount}</Text>
            <Text style={styles.statLbl}>Sessions Done</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{allMeditations.length}</Text>
            <Text style={styles.statLbl}>Available</Text>
          </View>
        </View>

        {loading && !refreshing ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={Palette.gold} size="large" />
          </View>
        ) : (
          <>
            {/* Featured card */}
            {featured && (
              <>
                <SectionTitle>Featured practice</SectionTitle>
                <Pressable
                  onPress={() => router.push(`/meditation/${featured.id}` as any)}
                >
                  <Card style={[styles.featuredCard, featured.locked && styles.featuredCardLocked] as any}>
                    <View style={styles.featuredHeader}>
                      <View />
                      <View style={styles.featuredHeaderRight}>
                        {featured.duration_sec > 0 && (
                          <Text style={styles.durBadge}>{formatMin(featured.duration_sec)}</Text>
                        )}
                        {featured.locked && (
                          <View style={styles.lockBadge}>
                            <Text style={styles.lockBadgeText}>Enroll to unlock</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    <Text style={styles.featuredTitle}>{featured.title}</Text>
                    {featured.description ? (
                      <Text style={styles.featuredDesc} numberOfLines={2}>
                        {featured.description}
                      </Text>
                    ) : null}

                    <View style={styles.featuredFooter}>
                      <View style={styles.guideRow}>
                        <Ionicons name="person-circle-outline" size={20} color={Palette.goldSoft} />
                        <Text style={styles.guideName}>{featured.guide_name}</Text>
                      </View>
                      {!featured.locked && (
                        <View style={styles.playFab}>
                          <Ionicons name="play" size={16} color={Palette.charcoal} style={{ marginLeft: 2 }} />
                        </View>
                      )}
                    </View>
                  </Card>
                </Pressable>
              </>
            )}

            {/* Full list */}
            <SectionTitle>All sessions</SectionTitle>

            {displayed.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Ionicons name="headset-outline" size={40} color={Palette.stoneLight} />
                <Text style={styles.emptyTitle}>No sessions available</Text>
              </Card>
            ) : (
              <View style={styles.listWrap}>
                {listData.map((m) => (
                  <MeditationCard key={m.id} item={m} />
                ))}
              </View>
            )}
          </>
        )}
      </Screen>
    </SafeAreaView>
  );
}

function MeditationCard({ item }: { item: Meditation }) {
  const theme = categoryTheme(item.category);
  const pct =
    item.duration_sec > 0
      ? Math.min(100, Math.round((item.listened_sec / item.duration_sec) * 100))
      : 0;

  const handlePress = () => {
    // Always navigate to meditation detail — the player screen handles locked state
    router.push(`/meditation/${item.id}` as any);
  };

  return (
    <Pressable onPress={handlePress}>
      <Card style={[styles.card, item.locked && styles.cardLocked] as any}>
        {/* Art */}
        <View style={[styles.cardArt, { backgroundColor: item.locked ? Palette.line : theme.bg }]}>
          <Ionicons name={item.locked ? 'lock-closed' : theme.icon} size={24} color={item.locked ? Palette.stone : Palette.onAccent} />
        </View>

        {/* Body */}
        <View style={styles.cardBody}>
          <View style={styles.cardTopRow}>
            {item.duration_sec > 0 && (
              <Text style={styles.durationText}>{formatMin(item.duration_sec)}</Text>
            )}
          </View>

          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>

          {item.locked ? (
            <>
              <Text style={styles.lockedCourse} numberOfLines={1}>
                {item.course_title ?? 'Course required'}
              </Text>
              {item.course_price && Number(item.course_price) > 0 && (
                <View style={styles.lockedPriceRow}>
                  <Text style={styles.lockedPrice}>
                    ₹{Number(item.course_price).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </Text>
                  <View style={styles.enrollCta}>
                    <Text style={styles.enrollCtaText}>Enroll</Text>
                  </View>
                </View>
              )}
            </>
          ) : (
            <Text style={styles.cardGuide} numberOfLines={1}>
              Guided by {item.guide_name}
            </Text>
          )}

          {!item.locked && item.completed ? (
            <Text style={styles.checkDone}>Completed</Text>
          ) : !item.locked && pct > 0 ? (
            <View style={styles.progressRow}>
              <View style={styles.miniTrack}>
                <View style={[styles.miniFill, { width: `${pct}%` as any }]} />
              </View>
              <Text style={styles.pctText}>{pct}%</Text>
            </View>
          ) : null}
        </View>

        {/* Play / lock */}
        <View style={[styles.playCircle, item.locked && styles.playCircleLocked]}>
          <Ionicons name={item.locked ? 'lock-closed' : 'play'} size={16} color={item.locked ? Palette.stone : Palette.goldDark} />
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.ivory },
  loadingWrap: { paddingVertical: 48, alignItems: 'center' },

  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: Palette.surface,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Palette.line,
  },
  statBox: { alignItems: 'center' },
  statVal: { color: Palette.goldDark, fontFamily: BrandFonts.heading, fontSize: 22 },
  statLbl: { color: Palette.stone, fontSize: 11, fontWeight: '600', marginTop: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: Palette.line },

  catBar: { flexDirection: 'row', gap: 8, paddingVertical: 10 },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.line,
  },
  catPillActive: { backgroundColor: Palette.goldDark, borderColor: Palette.goldDark },
  catText: { color: Palette.charcoal, fontSize: 13, fontWeight: '600' },
  catTextActive: { color: Palette.surface, fontWeight: '700' },

  // Featured
  featuredCard: {
    backgroundColor: Palette.brown,
    padding: 20,
    borderRadius: 24,
    gap: 12,
  },
  featuredCardLocked: {
    backgroundColor: Palette.charcoal,
  },
  featuredHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  featuredHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  catBadgeText: { color: Palette.goldSoft, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  durBadge: { color: Palette.goldSoft, fontSize: 12, fontWeight: '700' },
  lockBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  lockBadgeText: { color: Palette.goldSoft, fontSize: 11, fontWeight: '700' },
  featuredTitle: { color: Palette.onAccent, fontFamily: BrandFonts.heading, fontSize: 22, lineHeight: 28 },
  featuredDesc: { color: Palette.goldSoft, fontSize: 14, lineHeight: 20 },
  featuredFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  guideRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  guideAvatar: { fontSize: 18 },
  guideName: { color: Palette.goldSoft, fontSize: 13, fontWeight: '600' },
  playFab: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Palette.gold, alignItems: 'center', justifyContent: 'center',
  },
  playFabIcon: { color: Palette.charcoal, fontSize: 16, marginLeft: 2 },

  // List
  listWrap: { gap: 12 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 20, gap: 14 },
  cardLocked: { backgroundColor: '#FAFAFA' },
  cardArt: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  artSymbol: { fontSize: 24 },
  cardBody: { flex: 1, gap: 4 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  miniCatBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  miniCatText: { fontSize: 10, fontWeight: '800' },
  durationText: { color: Palette.stone, fontSize: 12, fontWeight: '600' },
  cardTitle: { color: Palette.charcoal, fontSize: 16, fontWeight: '700' },
  cardGuide: { color: Palette.stone, fontSize: 13 },
  lockedCourse: { color: Palette.stone, fontSize: 12 },
  lockedPriceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  lockedPrice: { color: Palette.charcoal, fontFamily: BrandFonts.heading, fontSize: 15 },
  enrollCta: {
    backgroundColor: Palette.goldDark,
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 12,
  },
  enrollCtaText: { color: Palette.surface, fontSize: 12, fontWeight: '700' },
  lockedHint: { color: Palette.danger, fontSize: 12, fontStyle: 'italic' },
  checkDone: { color: '#059669', fontSize: 12, fontWeight: '700' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  miniTrack: { flex: 1, height: 4, borderRadius: 4, backgroundColor: Palette.line, overflow: 'hidden' },
  miniFill: { height: '100%', borderRadius: 4, backgroundColor: Palette.gold },
  pctText: { color: Palette.goldDark, fontSize: 11, fontWeight: '700' },
  playCircle: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Palette.goldSoft, alignItems: 'center', justifyContent: 'center',
  },
  playCircleLocked: { backgroundColor: Palette.line },
  playCircleIcon: { color: Palette.goldDark, fontSize: 14, marginLeft: 2 },

  // Empty
  emptyCard: { alignItems: 'center', gap: 10, paddingVertical: 36 },
  emptyIcon: { fontSize: 44 },
  emptyTitle: { color: Palette.charcoal, fontFamily: BrandFonts.heading, fontSize: 18 },
});
