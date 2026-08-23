import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';

import { AppHeader, AppIcon, Card, ActionButton, Pill, Screen, SectionTitle, ui } from '@/components/karma-ui';
import { Palette } from '@/constants/theme';
import { useSession } from '@/context/auth-context';
import { usePrototype } from '@/context/prototype-context';

const tasks = ['Morning prayer', 'Reading', 'Reflection'];

export default function HomeScreen() {
  const { user } = useSession();
  const { completedTasks, toggleTask, courseProgress } = usePrototype();
  const name = user?.name || user?.email?.split('@')[0] || 'Seeker';
  return <Screen>
    <AppHeader title="Karma Vajra" action={<Pressable onPress={() => router.push('/flows/notifications' as any)}><AppIcon name="bell" /></Pressable>} />
    <View><Text style={ui.title}>Good morning, {name}</Text><Text style={ui.body}>Take a moment for yourself today.</Text></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stats}>
      <Stat label="Today’s sadhana" value={`${completedTasks.length}/5`} hint="Tasks completed" />
      <Stat label="Meditation" value="12" hint="Sessions this month" />
      <Stat label="Learning" value={`${courseProgress}%`} hint="Course progress" />
    </ScrollView>
    <SectionTitle action={<Text style={styles.counter}>{completedTasks.length}/5</Text>}>Today’s spiritual practice</SectionTitle>
    <Card>
      {tasks.map((task, index) => { const done = completedTasks.includes(task); return <Pressable key={task} onPress={() => toggleTask(task)} style={[styles.task, index === tasks.length - 1 && styles.lastTask]}><AppIcon name={done ? 'check' : 'circle'} /><Text style={styles.taskName}>{task}</Text><Text style={[styles.status, done ? styles.done : styles.pending]}>{done ? 'Done' : 'Pending'}</Text></Pressable>; })}
      <ActionButton label="Continue sadhana" onPress={() => router.push('/flows/sadhana' as any)} />
    </Card>
    <SectionTitle>Continue learning</SectionTitle>
    <Pressable onPress={() => router.push('/flows/course-detail' as any)}><Card style={styles.learning}><View style={styles.courseArt}><Text style={styles.courseGlyph}>✦</Text></View><Pill>IN PROGRESS</Pill><Text style={styles.cardTitle}>Foundations of mindful living</Text><Text style={ui.small}>{courseProgress}% complete · Continue lesson 3</Text></Card></Pressable>
    <SectionTitle>For your journey</SectionTitle>
    <View style={styles.grid}>
      <JourneyCard icon="play" title="Today’s meditation" detail="Stillness within · 12 min" flow="meditation-player" />
      <JourneyCard icon="calendar" title="Upcoming event" detail="Full moon meditation" flow="event-detail" />
      <JourneyCard icon="heart" title="Daily check-in" detail="How are you feeling?" flow="mood" />
      <JourneyCard icon="spark" title="Guru’s message" detail="A word for today" flow="guide" />
    </View>
  </Screen>;
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) { return <View style={styles.stat}><Text style={styles.statLabel}>{label}</Text><Text style={styles.statValue}>{value}</Text><Text style={styles.statHint}>{hint}</Text></View>; }
function JourneyCard({ icon, title, detail, flow }: { icon: string; title: string; detail: string; flow: string }) { return <Pressable style={styles.journey} onPress={() => router.push(`/flows/${flow}` as any)}><AppIcon name={icon} /><Text style={styles.journeyTitle}>{title}</Text><Text style={ui.small}>{detail}</Text></Pressable>; }

const styles = StyleSheet.create({ stats: { gap: 12, paddingRight: 16 }, stat: { width: 205, backgroundColor: Palette.surface, borderRadius: 24, padding: 18, borderWidth: 1, borderColor: Palette.line, gap: 6 }, statLabel: { color: Palette.stone, fontSize: 15, fontWeight: '600' }, statValue: { color: Palette.charcoal, fontFamily: 'serif', fontSize: 34, fontWeight: '700' }, statHint: { color: Palette.stoneLight, fontSize: 13 }, counter: { color: Palette.goldDark, fontSize: 18, fontWeight: '800' }, task: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 54, borderBottomWidth: 1, borderBottomColor: Palette.line }, lastTask: { borderBottomWidth: 0 }, taskName: { flex: 1, color: Palette.charcoal, fontSize: 17, fontWeight: '600' }, status: { fontSize: 15, fontWeight: '700' }, done: { color: Palette.goldDark }, pending: { color: Palette.stoneLight }, learning: { gap: 10 }, courseArt: { height: 135, borderRadius: 20, backgroundColor: Palette.goldSoft, alignItems: 'center', justifyContent: 'center' }, courseGlyph: { fontSize: 47, color: Palette.goldDark }, cardTitle: { color: Palette.charcoal, fontFamily: 'serif', fontWeight: '700', fontSize: 21 }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, journey: { width: '48%', flexGrow: 1, minHeight: 146, backgroundColor: Palette.surface, borderRadius: 22, padding: 15, gap: 8, borderWidth: 1, borderColor: Palette.line }, journeyTitle: { color: Palette.charcoal, fontFamily: 'serif', fontSize: 17, fontWeight: '700' } });
