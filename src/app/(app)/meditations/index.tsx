import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader, Card, Pill, ProgressBar, Screen, SectionTitle, ui } from '@/components/karma-ui';
import { Palette } from '@/constants/theme';
import { useSession } from '@/context/auth-context';
import {
  type Meditation,
  type MeditationSummary,
  apiGetMeditations,
} from '@/services/api';

const CATEGORIES = ['All', 'Guided', 'Sound', 'Breathwork', 'Ambient'] as const;

const CATEGORY_COLORS: Record<string, { bg: string; text: string; tagBg: string }> = {
  Guided: { bg: '#4F46E5', text: '#FFFFFF', tagBg: '#E0E7FF' },
  Sound: { bg: '#D97706', text: '#FFFFFF', tagBg: '#FEF3C7' },
  Breathwork: { bg: '#059669', text: '#FFFFFF', tagBg: '#D1FAE5' },
  Ambient: { bg: '#7C3AED', text: '#FFFFFF', tagBg: '#EDE9FE' },
};

function formatMin(sec: number): string {
  const m = Math.round(sec / 60);
  return `${m} min`;
}

export default function MeditationsLibraryScreen() {
  const { session } = useSession();
  const [selectedCat, setSelectedCat] = useState<string>('All');
  const [meditations, setMeditations] = useState<Meditation[]>([]);
  const [summary, setSummary] = useState<MeditationSummary>({ completed_count: 0, total_minutes: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMeditations = useCallback(
    async (isRef = false) => {
      if (!session) return;
      if (isRef) setRefreshing(true);
      else setLoading(true);

      const res = await apiGetMeditations(session, selectedCat);
      if (res.data) {
        setMeditations(res.data.meditations);
        setSummary(res.data.summary);
      }
      setLoading(false);
      setRefreshing(false);
    },
    [session, selectedCat]
  );

  useFocusEffect(
    useCallback(() => {
      fetchMeditations();
    }, [fetchMeditations])
  );

  const featured = meditations.find((m) => m.is_featured) || meditations[0];
  const listData = meditations.filter((m) => m.id !== featured?.id);

  return (
    <SafeAreaView style={styles.safe}>
      <Screen>
        <AppHeader title="Meditation Sanctuary" subtitle="Guided sessions, sound baths & stillness" back />

        {/* ── Stats Strip ── */}
        <View style={styles.statsStrip}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{summary.total_minutes}</Text>
            <Text style={styles.statLbl}>Minutes Meditated</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{summary.completed_count}</Text>
            <Text style={styles.statLbl}>Sessions Done</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{meditations.length}</Text>
            <Text style={styles.statLbl}>Practices Available</Text>
          </View>
        </View>

        {/* ── Category Filter Bar ── */}
        <View style={styles.catBar}>
          {CATEGORIES.map((cat) => {
            const active = selectedCat === cat;
            return (
              <Pressable
                key={cat}
                onPress={() => setSelectedCat(cat)}
                style={[styles.catPill, active && styles.catPillActive]}
              >
                <Text style={[styles.catText, active && styles.catTextActive]}>
                  {cat === 'Sound' ? '🎵 Sound' : cat === 'Guided' ? '🧘 Guided' : cat === 'Breathwork' ? '🫁 Breath' : cat === 'Ambient' ? '✨ Ambient' : '✦ All'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {loading && !refreshing ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={Palette.gold} size="large" />
          </View>
        ) : (
          <>
            {/* ── Featured Daily Meditation ── */}
            {featured && selectedCat === 'All' && (
              <View style={styles.featuredSection}>
                <SectionTitle>Featured practice</SectionTitle>
                <Pressable onPress={() => router.push(`/meditation/${featured.id}` as any)}>
                  <Card style={styles.featuredCard}>
                    <View style={styles.featuredHeader}>
                      <View style={styles.catBadge}>
                        <Text style={styles.catBadgeText}>{featured.category.toUpperCase()}</Text>
                      </View>
                      <Text style={styles.durBadge}>{formatMin(featured.duration_sec)}</Text>
                    </View>

                    <Text style={styles.featuredTitle}>{featured.title}</Text>
                    <Text style={styles.featuredDesc} numberOfLines={2}>
                      {featured.description}
                    </Text>

                    <View style={styles.featuredFooter}>
                      <View style={styles.guideRow}>
                        <Text style={styles.guideAvatar}>🧘‍♂️</Text>
                        <Text style={styles.guideName}>{featured.guide_name}</Text>
                      </View>
                      <View style={styles.playFab}>
                        <Text style={styles.playFabIcon}>▶</Text>
                      </View>
                    </View>
                  </Card>
                </Pressable>
              </View>
            )}

            {/* ── Meditation List ── */}
            <SectionTitle>
              {selectedCat === 'All' ? 'All Sessions' : `${selectedCat} Sessions`}
            </SectionTitle>

            {meditations.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>🧘‍♀️</Text>
                <Text style={styles.emptyTitle}>No sessions in this category</Text>
                <Text style={[ui.small, { textAlign: 'center' }]}>
                  Try selecting another category or tap Refresh to reload.
                </Text>
              </Card>
            ) : (
              <View style={styles.listWrap}>
                {(selectedCat === 'All' ? listData : meditations).map((m) => (
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
  const catTheme = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.Guided;
  const pct = item.duration_sec > 0 ? Math.round((item.listened_sec / item.duration_sec) * 100) : 0;

  return (
    <Pressable onPress={() => router.push(`/meditation/${item.id}` as any)}>
      <Card style={styles.card}>
        <View style={[styles.cardArt, { backgroundColor: catTheme.bg }]}>
          <Text style={styles.artSymbol}>
            {item.category === 'Sound' ? '🎵' : item.category === 'Breathwork' ? '🫁' : item.category === 'Ambient' ? '✨' : '🧘'}
          </Text>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.cardTopRow}>
            <View style={[styles.miniCatBadge, { backgroundColor: catTheme.tagBg }]}>
              <Text style={[styles.miniCatText, { color: catTheme.bg }]}>{item.category}</Text>
            </View>
            <Text style={styles.durationText}>{formatMin(item.duration_sec)}</Text>
          </View>

          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>

          <Text style={styles.cardGuide} numberOfLines={1}>
            Guided by {item.guide_name}
          </Text>

          {item.completed ? (
            <View style={styles.completedRow}>
              <Text style={styles.checkDone}>✓ Completed</Text>
            </View>
          ) : pct > 0 ? (
            <View style={styles.progressRow}>
              <View style={styles.miniTrack}>
                <View style={[styles.miniFill, { width: `${pct}%` }]} />
              </View>
              <Text style={styles.pctText}>{pct}%</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.playCircle}>
          <Text style={styles.playCircleIcon}>▶</Text>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.ivory },
  loadingWrap: { paddingVertical: 48, alignItems: 'center' },

  // Stats strip
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
  statVal: { color: Palette.goldDark, fontFamily: 'serif', fontSize: 22, fontWeight: '700' },
  statLbl: { color: Palette.stone, fontSize: 11, fontWeight: '600', marginTop: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: Palette.line },

  // Category filter bar
  catBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 12,
  },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.line,
  },
  catPillActive: {
    backgroundColor: Palette.goldDark,
    borderColor: Palette.goldDark,
  },
  catText: { color: Palette.charcoal, fontSize: 13, fontWeight: '600' },
  catTextActive: { color: Palette.surface, fontWeight: '700' },

  // Featured card
  featuredSection: { gap: 8 },
  featuredCard: {
    backgroundColor: '#1E1B4B', // Dark indigo night ambient theme
    padding: 20,
    borderRadius: 24,
    gap: 12,
  },
  featuredHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  catBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  catBadgeText: { color: '#E0E7FF', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  durBadge: { color: '#C7D2FE', fontSize: 12, fontWeight: '700' },
  featuredTitle: { color: '#FFFFFF', fontFamily: 'serif', fontSize: 22, fontWeight: '700', lineHeight: 28 },
  featuredDesc: { color: '#A5B4FC', fontSize: 14, lineHeight: 20 },
  featuredFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  guideRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  guideAvatar: { fontSize: 18 },
  guideName: { color: '#E0E7FF', fontSize: 13, fontWeight: '600' },
  playFab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Palette.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playFabIcon: { color: Palette.charcoal, fontSize: 16, marginLeft: 2 },

  // List cards
  listWrap: { gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    gap: 14,
  },
  cardArt: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artSymbol: { fontSize: 24 },
  cardBody: { flex: 1, gap: 4 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  miniCatBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  miniCatText: { fontSize: 10, fontWeight: '800' },
  durationText: { color: Palette.stone, fontSize: 12, fontWeight: '600' },
  cardTitle: { color: Palette.charcoal, fontSize: 16, fontWeight: '700' },
  cardGuide: { color: Palette.stone, fontSize: 13 },
  completedRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  checkDone: { color: '#059669', fontSize: 12, fontWeight: '700' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  miniTrack: { flex: 1, height: 4, borderRadius: 4, backgroundColor: Palette.line, overflow: 'hidden' },
  miniFill: { height: '100%', borderRadius: 4, backgroundColor: Palette.gold },
  pctText: { color: Palette.goldDark, fontSize: 11, fontWeight: '700' },

  playCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Palette.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playCircleIcon: { color: Palette.goldDark, fontSize: 14, marginLeft: 2 },

  // Empty state
  emptyCard: { alignItems: 'center', gap: 10, paddingVertical: 36 },
  emptyIcon: { fontSize: 44 },
  emptyTitle: { color: Palette.charcoal, fontFamily: 'serif', fontSize: 18, fontWeight: '700' },
});
