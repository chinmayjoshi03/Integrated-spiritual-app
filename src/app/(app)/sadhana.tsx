import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader, Card, Screen, SectionTitle, ui } from '@/components/karma-ui';
import { Palette } from '@/constants/theme';
import { useSession } from '@/context/auth-context';
import {
  type SadhanaEntry,
  type SadhanaLeaderboardEntry,
  type SadhanaStreak,
  apiCompleteSadhana,
  apiGetSadhanaLeaderboard,
  apiGetTodaySadhana,
} from '@/services/api';

export default function SadhanaScreen() {
  const { session, user } = useSession();

  const [sadhana, setSadhana] = useState<SadhanaEntry | null>(null);
  const [streak, setStreak] = useState<SadhanaStreak>({ current: 0, longest: 0 });
  const [leaderboard, setLeaderboard] = useState<SadhanaLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      if (!session) return;
      setLoading(true);
      setError('');
      Promise.allSettled([
        apiGetTodaySadhana(session),
        apiGetSadhanaLeaderboard(session),
      ]).then(([todayRes, leaderRes]) => {
        if (todayRes.status === 'fulfilled' && todayRes.value.data) {
          setSadhana(todayRes.value.data.sadhana);
          setStreak(todayRes.value.data.streak);
        } else if (todayRes.status === 'rejected' || todayRes.value.error) {
          setError('Daily sadhana could not be loaded. Please try again.');
        }
        if (leaderRes.status === 'fulfilled' && Array.isArray(leaderRes.value.data)) {
          setLeaderboard(leaderRes.value.data);
        }
        setLoading(false);
      });
    }, [session])
  );

  const handleComplete = async () => {
    if (!session || !sadhana || sadhana.completed || saving) return;
    setSaving(true);
    setError('');
    const res = await apiCompleteSadhana(session);
    setSaving(false);
    if (res.error) {
      setError(res.error);
    } else {
      setSadhana((prev) => (prev ? { ...prev, completed: true } : prev));
      if (res.data?.streak) setStreak(res.data.streak);
      // Refresh leaderboard
      apiGetSadhanaLeaderboard(session).then((r) => {
        if (r.data) setLeaderboard(r.data);
      });
    }
  };

  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <SafeAreaView style={styles.safe}>
      <Screen>
        <AppHeader title="Daily Sadhana" subtitle="One mindful practice, shared each day." back />

        {error !== '' && (
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        )}

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={Palette.gold} size="large" />
          </View>
        ) : (
          <>
            {/* Today's practice card */}
            <Card style={styles.todayCard}>
              <Text style={styles.todayEyebrow}>TODAY · {todayLabel.toUpperCase()}</Text>
              {sadhana ? (
                <>
                  <Text style={styles.todayTitle}>{sadhana.title}</Text>
                  {sadhana.description ? (
                    <Text style={[ui.body, { marginTop: 4 }]}>{sadhana.description}</Text>
                  ) : (
                    <Text style={ui.body}>
                      Take a few moments to complete today's practice.
                    </Text>
                  )}

                  {sadhana.completed ? (
                    <View style={styles.completedBadge}>
                      <Text style={styles.completedBadgeText}>✓ Completed today</Text>
                    </View>
                  ) : (
                    <Pressable
                      style={[styles.completeBtn, saving && styles.completeBtnDisabled]}
                      onPress={handleComplete}
                      disabled={saving}
                    >
                      {saving ? (
                        <ActivityIndicator color={Palette.surface} />
                      ) : (
                        <Text style={styles.completeBtnText}>Mark today complete</Text>
                      )}
                    </Pressable>
                  )}
                </>
              ) : (
                <>
                  <Text style={styles.todayTitle}>No practice scheduled for today.</Text>
                  <Text style={ui.small}>
                    Please check back tomorrow. The next daily practice will appear here automatically.
                  </Text>
                </>
              )}
            </Card>

            {/* Streak stats */}
            <SectionTitle>Your streak</SectionTitle>
            <View style={styles.statsRow}>
              <Card style={styles.statCard}>
                <Text style={styles.statValue}>{streak.current}</Text>
                <Text style={styles.statUnit}>days</Text>
                <Text style={styles.statLabel}>Current streak</Text>
                <Text style={ui.small}>consecutive completed days</Text>
              </Card>
              <Card style={styles.statCard}>
                <Text style={styles.statValue}>{streak.longest}</Text>
                <Text style={styles.statUnit}>days</Text>
                <Text style={styles.statLabel}>Longest streak</Text>
                <Text style={ui.small}>your personal best</Text>
              </Card>
            </View>

            {/* Community leaderboard */}
            {leaderboard.length > 0 && (
              <>
                <SectionTitle>Community practice</SectionTitle>
                <Card style={styles.leaderboardCard}>
                  <View style={styles.leaderboardHeader}>
                    <Text style={styles.leaderboardEyebrow}>STREAK LEADERBOARD</Text>
                    <Text style={[ui.small, { fontWeight: '700' }]}>Longest</Text>
                  </View>
                  {leaderboard.map((entry, index) => {
                    const isMe = String(entry.id) === String(user?.id);
                    return (
                      <View
                        key={entry.id}
                        style={[styles.leaderRow, isMe && styles.leaderRowMe]}
                      >
                        <Text style={styles.leaderRank}>{index + 1}</Text>
                        <Text style={[styles.leaderName, isMe && styles.leaderNameMe]}>
                          {entry.name}
                          {isMe ? ' (You)' : ''}
                        </Text>
                        <Text style={styles.leaderScore}>
                          {entry.current} active · {entry.longest} best
                        </Text>
                      </View>
                    );
                  })}
                </Card>
              </>
            )}
          </>
        )}
      </Screen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.ivory },
  loadingWrap: { paddingVertical: 48, alignItems: 'center' },
  errorCard: { backgroundColor: Palette.blush },
  errorText: { color: Palette.danger, fontSize: 14 },

  // Today card
  todayCard: {
    backgroundColor: Palette.goldSoft,
    borderColor: Palette.gold,
    gap: 12,
  },
  todayEyebrow: {
    color: Palette.goldDark,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  todayTitle: {
    color: Palette.charcoal,
    fontFamily: 'serif',
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
  },
  completedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#D1FAE5',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 4,
  },
  completedBadgeText: { color: '#065F46', fontSize: 14, fontWeight: '700' },
  completeBtn: {
    backgroundColor: Palette.charcoal,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  completeBtnDisabled: { opacity: 0.6 },
  completeBtnText: { color: Palette.surface, fontSize: 15, fontWeight: '700' },

  // Stats
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 20 },
  statValue: {
    color: Palette.goldDark,
    fontFamily: 'serif',
    fontSize: 36,
    fontWeight: '700',
  },
  statUnit: { color: Palette.stone, fontSize: 12, fontWeight: '600', marginTop: -4 },
  statLabel: {
    color: Palette.charcoal,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 6,
  },

  // Leaderboard
  leaderboardCard: { gap: 10 },
  leaderboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
  },
  leaderboardEyebrow: {
    color: Palette.goldDark,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  leaderRowMe: {
    backgroundColor: Palette.goldSoft,
    borderRadius: 10,
    paddingHorizontal: 8,
  },
  leaderRank: {
    color: Palette.goldDark,
    fontFamily: 'serif',
    fontSize: 18,
    fontWeight: '700',
    minWidth: 28,
    textAlign: 'center',
  },
  leaderName: {
    color: Palette.charcoal,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  leaderNameMe: { fontWeight: '800', color: Palette.goldDark },
  leaderScore: { color: Palette.stone, fontSize: 12, fontWeight: '600' },
});
