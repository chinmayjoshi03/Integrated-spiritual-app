import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader, AppIcon, Card, Pill, Screen, SectionTitle, ui } from '@/components/karma-ui';
import { Palette } from '@/constants/theme';

const actions = [
  ['Meditation library', 'Audio and video practices for every moment', 'meditation', 'play'],
  ['Your mindful plan', 'Mood, sleep, and stress recommendations', 'recommendations', 'spark'],
  ['Daily sadhana', 'Prayer, reading, gratitude, yoga, and reflection', 'sadhana', 'check'],
  ['Gratitude journal', 'Pause and notice what is supporting you', 'journal', 'heart'],
  ['Your spiritual streak', 'Celebrate the rhythm you are creating', 'streak', 'calendar'],
  ['Badges and achievements', 'Remember every meaningful milestone', 'achievements', 'spark'],
];

export default function PracticeScreen() { return <Screen><AppHeader title="Practice" subtitle="Your daily space for stillness" /><View><Text style={ui.title}>Return to yourself</Text><Text style={ui.body}>Choose the practice that meets you where you are.</Text></View><Card style={styles.hero}><Pill>TODAY’S MEDITATION</Pill><Text style={styles.heroTitle}>Stillness within</Text><Text style={ui.body}>A 12-minute guided breath practice for a calmer mind.</Text><Pressable onPress={() => router.push('/flows/meditation-player' as any)} style={styles.play}><AppIcon name="play" active /><Text style={styles.playText}>Begin meditation</Text></Pressable></Card><SectionTitle>Build your practice</SectionTitle><View style={styles.list}>{actions.map(([title, detail, flow, icon]) => <Pressable key={flow} onPress={() => router.push(`/flows/${flow}` as any)}><Card style={styles.item}><AppIcon name={icon} active /><View style={styles.copy}><Text style={styles.itemTitle}>{title}</Text><Text style={ui.small}>{detail}</Text></View><Text style={styles.chevron}>›</Text></Card></Pressable>)}</View></Screen>; }
const styles = StyleSheet.create({ hero: { backgroundColor: Palette.goldSoft, gap: 10 }, heroTitle: { color: Palette.charcoal, fontFamily: 'serif', fontSize: 28, fontWeight: '700' }, play: { marginTop: 5, height: 48, borderRadius: 15, backgroundColor: Palette.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, playText: { color: Palette.goldDark, fontWeight: '800' }, list: { gap: 10 }, item: { paddingVertical: 15, flexDirection: 'row', alignItems: 'center', gap: 13, borderRadius: 20 }, copy: { flex: 1, gap: 4 }, itemTitle: { color: Palette.charcoal, fontSize: 17, fontWeight: '700' }, chevron: { fontSize: 28, color: Palette.goldDark } });
