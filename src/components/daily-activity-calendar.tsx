import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, ui } from '@/components/karma-ui';
import { BrandFonts, Palette } from '@/constants/theme';
import { type DailyActivitySummary, type DailyActivityType, apiGetSadhanaCalendar } from '@/services/api';

type IoniconName = keyof typeof Ionicons.glyphMap;

/** Today in India ("YYYY-MM-DD") — the backend schedules activities on IST days. */
export const indiaToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());

export const activityIcon = (type?: DailyActivityType | string | null): IoniconName =>
  type === 'video' ? 'film-outline'
    : type === 'audio' ? 'musical-notes-outline'
    : type === 'pdf' ? 'document-text-outline'
    : type === 'mcq' ? 'help-circle-outline'
    : 'flower-outline';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** Month grid of daily activities. Past and today's days open the activity; future days stay locked. */
export function DailyActivityCalendar({ session }: { session: string }) {
  const thisMonth = indiaToday().slice(0, 7);
  const [month, setMonth] = useState(thisMonth);
  const [activities, setActivities] = useState<DailyActivitySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Refetch on focus so a day completed on the detail screen shows as completed here.
  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    apiGetSadhanaCalendar(session, month).then((res) => {
      if (!active) return;
      if (res.error) setError('Could not load the activity calendar. Please try again.');
      else { setActivities(res.data?.activities ?? []); setError(''); }
      setLoading(false);
    });
    return () => { active = false; };
  }, [session, month]));

  const { year, monthNumber, daysInMonth, leadingDays, label } = useMemo(() => {
    const [y, m] = month.split('-').map(Number);
    const first = new Date(y, m - 1, 1);
    return {
      year: y,
      monthNumber: m,
      daysInMonth: new Date(y, m, 0).getDate(),
      leadingDays: first.getDay(),
      label: first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
    };
  }, [month]);

  const byDate = useMemo(
    () => new Map(activities.map((a) => [a.scheduled_for.slice(0, 10), a])),
    [activities]
  );

  const today = indiaToday();
  const canGoNext = month < thisMonth;
  const shiftMonth = (amount: number) => {
    const next = new Date(year, monthNumber - 1 + amount, 1);
    setMonth(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`);
  };

  const cells: ({ date: string; day: number } | null)[] = [
    ...Array.from({ length: leadingDays }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      date: `${year}-${String(monthNumber).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`,
    })),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return <Card style={styles.card}>
    <View style={styles.header}>
      <Pressable onPress={() => shiftMonth(-1)} style={styles.navBtn} accessibilityRole="button" accessibilityLabel="Previous month">
        <Ionicons name="chevron-back" size={18} color={Palette.goldDark} />
      </Pressable>
      <Text style={styles.month}>{label}</Text>
      <Pressable onPress={() => shiftMonth(1)} disabled={!canGoNext} style={[styles.navBtn, !canGoNext && styles.disabled]} accessibilityRole="button" accessibilityLabel="Next month">
        <Ionicons name="chevron-forward" size={18} color={Palette.goldDark} />
      </Pressable>
    </View>

    {error ? <Text style={styles.error}>{error}</Text> : null}

    <View style={styles.row}>
      {WEEKDAYS.map((d, i) => <Text key={i} style={styles.weekday}>{d}</Text>)}
    </View>

    {Array.from({ length: cells.length / 7 }, (_, r) => (
      <View key={r} style={styles.row}>
        {cells.slice(r * 7, r * 7 + 7).map((cell, c) => {
          if (!cell) return <View key={c} style={styles.cell} />;
          const activity = byDate.get(cell.date);
          const isToday = cell.date === today;
          const isFuture = cell.date > today;
          const completed = Boolean(activity?.completed);
          const missed = Boolean(activity) && !completed && !isToday;
          const a11y = `${cell.date}${isToday ? ', today' : ''}${activity ? (completed ? ': completed' : ': not completed') : isFuture ? ': upcoming' : ': no activity'}`;
          return <Pressable
            key={c}
            disabled={isFuture}
            onPress={() => router.push(`/sadhana/${cell.date}` as any)}
            accessibilityRole="button"
            accessibilityLabel={a11y}
            style={({ pressed }) => [
              styles.cell,
              styles.day,
              activity && styles.hasActivity,
              completed && styles.completed,
              isToday && styles.today,
              isFuture && styles.future,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.dayNum, isToday && styles.todayNum, completed && styles.completedNum]}>{cell.day}</Text>
            {activity ? (
              <Ionicons
                name={completed ? 'checkmark-circle' : missed ? 'close-circle-outline' : activityIcon(activity.content_type)}
                size={13}
                color={completed ? Palette.success : missed ? Palette.stoneLight : Palette.goldDark}
              />
            ) : <View style={{ height: 13 }} />}
          </Pressable>;
        })}
      </View>
    ))}

    {loading ? <ActivityIndicator color={Palette.gold} style={{ marginTop: 6 }} /> : null}

    <View style={styles.legend}>
      <Legend icon="checkmark-circle" color={Palette.success} label="Completed" />
      <Legend icon="close-circle-outline" color={Palette.stoneLight} label="Not completed" />
      <Legend icon="flower-outline" color={Palette.goldDark} label="Activity" />
    </View>
  </Card>;
}

function Legend({ icon, color, label }: { icon: IoniconName; color: string; label: string }) {
  return <View style={styles.legendItem}>
    <Ionicons name={icon} size={13} color={color} />
    <Text style={ui.small}>{label}</Text>
  </View>;
}

const styles = StyleSheet.create({
  card: { gap: 6 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  navBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: Palette.goldSoft },
  disabled: { opacity: 0.35 },
  month: { color: Palette.charcoal, fontFamily: BrandFonts.heading, fontSize: 18, fontWeight: '700' },
  error: { color: Palette.danger, fontSize: 13 },
  row: { flexDirection: 'row', gap: 4 },
  weekday: { flex: 1, textAlign: 'center', color: Palette.stone, fontSize: 11, fontWeight: '800', paddingVertical: 4 },
  cell: { flex: 1, aspectRatio: 1, minHeight: 40 },
  day: { borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 1, borderWidth: 1, borderColor: 'transparent' },
  hasActivity: { backgroundColor: Palette.highlight, borderColor: Palette.line },
  completed: { backgroundColor: Palette.successSoft, borderColor: Palette.successSoft },
  today: { borderColor: Palette.gold, borderWidth: 2 },
  future: { opacity: 0.4 },
  pressed: { opacity: 0.6 },
  dayNum: { color: Palette.charcoal, fontSize: 13, fontWeight: '600' },
  todayNum: { color: Palette.goldDark, fontWeight: '800' },
  completedNum: { color: Palette.success, fontWeight: '700' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
