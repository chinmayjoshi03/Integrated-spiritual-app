import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
    AppHeader,
    AppIcon,
    Card,
    ListItem,
    Pill,
    Screen,
    SectionTitle,
    ui,
} from '@/components/karma-ui';
import { Palette } from '@/constants/theme';

const PRACTICES = [
  {
    title: 'Meditation library',
    subtitle: 'Audio and video practices for every moment',
    flow: 'meditation',
    icon: 'play',
  },
  {
    title: 'Your mindful plan',
    subtitle: 'Mood, sleep, and stress recommendations',
    flow: 'recommendations',
    icon: 'spark',
  },
  {
    title: 'Daily sadhana',
    subtitle: 'Prayer, reading, gratitude, yoga, and reflection',
    flow: 'sadhana',
    icon: 'check',
  },
  {
    title: 'Gratitude journal',
    subtitle: 'Pause and notice what is supporting you',
    flow: 'journal',
    icon: 'heart',
  },
  {
    title: 'Spiritual streak',
    subtitle: 'Celebrate the rhythm you are creating',
    flow: 'streak',
    icon: 'calendar',
  },
  {
    title: 'Achievements',
    subtitle: 'Remember every meaningful milestone',
    flow: 'achievements',
    icon: 'spark',
  },
] as const;

export default function PracticeScreen() {
  return (
    <Screen>
      <AppHeader title="Practice" subtitle="Your daily space for stillness" />

      {/* Intro */}
      <View style={styles.intro}>
        <Text style={ui.title}>Return to yourself</Text>
        <Text style={[ui.body, { marginTop: 6 }]}>
          Choose the practice that meets you where you are right now.
        </Text>
      </View>

      {/* Today's featured meditation hero */}
      <Card style={styles.hero}>
        <View style={styles.heroTop}>
          <Pill>TODAY'S MEDITATION</Pill>
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>12 min</Text>
          </View>
        </View>

        <Text style={styles.heroTitle}>Stillness within</Text>
        <Text style={ui.body}>
          A guided return to the breath and the quiet that lives beneath all
          thought.
        </Text>

        <View style={styles.heroMeta}>
          <View style={styles.metaChip}>
            <Text style={styles.metaChipText}>🎧  Guided audio</Text>
          </View>
          <View style={styles.metaChip}>
            <Text style={styles.metaChipText}>◌  Beginner friendly</Text>
          </View>
        </View>

        <Pressable
          style={styles.playBtn}
          onPress={() => router.push('/meditations' as any)}
        >
          <View style={styles.playCircle}>
            <Text style={styles.playIcon}>▶</Text>
          </View>
          <Text style={styles.playLabel}>Explore Meditations</Text>
        </Pressable>
      </Card>

      {/* Quick-access mood check */}
      <Pressable onPress={() => router.push('/flows/mood' as any)}>
        <Card style={styles.moodCard}>
          <View style={styles.moodLeft}>
            <Text style={styles.moodQuestion}>How are you feeling right now?</Text>
            <Text style={ui.small}>A quick check-in takes just 10 seconds.</Text>
          </View>
          <Text style={styles.moodArrow}>›</Text>
        </Card>
      </Pressable>

      {/* Practice list */}
      <SectionTitle>Build your practice</SectionTitle>
      <Card style={styles.listCard}>
        {PRACTICES.map((p, idx) => (
          <ListItem
            key={p.flow}
            icon={<AppIcon name={p.icon} active />}
            title={p.title}
            subtitle={p.subtitle}
            onPress={() => {
              if (p.flow === 'meditation') {
                router.push('/meditations' as any);
              } else {
                router.push(`/flows/${p.flow}` as any);
              }
            }}
            last={idx === PRACTICES.length - 1}
          />
        ))}
      </Card>

      {/* Streak nudge */}
      <Card style={styles.streakCard}>
        <View style={styles.streakRow}>
          <View>
            <Text style={styles.streakNumber}>7</Text>
            <Text style={styles.streakLabel}>day streak</Text>
          </View>
          <View style={styles.streakDivider} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.streakMessage}>
              You have shown up for yourself every day this week.
            </Text>
            <Pressable onPress={() => router.push('/flows/streak' as any)}>
              <Text style={styles.streakLink}>View your streak →</Text>
            </Pressable>
          </View>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: 2 },

  // Hero
  hero: {
    backgroundColor: Palette.goldSoft,
    borderColor: Palette.gold,
    gap: 12,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  durationBadge: {
    backgroundColor: Palette.surface,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Palette.line,
  },
  durationText: { color: Palette.stone, fontSize: 12, fontWeight: '600' },
  heroTitle: {
    color: Palette.charcoal,
    fontFamily: 'serif',
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  heroMeta: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  metaChip: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  metaChipText: { color: Palette.stone, fontSize: 12, fontWeight: '600' },
  playBtn: {
    marginTop: 4,
    height: 52,
    borderRadius: 16,
    backgroundColor: Palette.charcoal,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  playCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Palette.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: { color: Palette.charcoal, fontSize: 13, marginLeft: 2 },
  playLabel: { color: Palette.surface, fontSize: 15, fontWeight: '700' },

  // Mood card
  moodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    gap: 0,
  },
  moodLeft: { flex: 1, gap: 4 },
  moodQuestion: {
    color: Palette.charcoal,
    fontFamily: 'serif',
    fontSize: 17,
    fontWeight: '700',
  },
  moodArrow: { color: Palette.goldDark, fontSize: 28 },

  // Practice list card
  listCard: { gap: 0, paddingVertical: 6 },

  // Streak card
  streakCard: {
    backgroundColor: Palette.charcoal,
    borderColor: Palette.charcoal,
  },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  streakNumber: {
    color: Palette.gold,
    fontFamily: 'serif',
    fontSize: 42,
    fontWeight: '700',
  },
  streakLabel: { color: Palette.stoneLight, fontSize: 13 },
  streakDivider: { width: 1, height: 48, backgroundColor: '#3A3A3A' },
  streakMessage: { color: '#D0CBC0', fontSize: 14, lineHeight: 20 },
  streakLink: { color: Palette.gold, fontSize: 13, fontWeight: '700', marginTop: 2 },
});
