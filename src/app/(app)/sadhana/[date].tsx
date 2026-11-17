import { Ionicons } from '@expo/vector-icons';
import { useEvent } from 'expo';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { router, useLocalSearchParams } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { activityIcon, indiaToday } from '@/components/daily-activity-calendar';
import { ActionButton, AppHeader, Card, EmptyState, Loading, Notice, ProgressBar, Screen, ui } from '@/components/karma-ui';
import { BrandFonts, Palette } from '@/constants/theme';
import { useSession } from '@/context/auth-context';
import { type SadhanaEntry, apiCompleteSadhanaById, apiGetSadhanaByDate, resolveMediaUrl } from '@/services/api';

const clock = (sec: number) => {
  const s = Math.max(0, Math.floor(sec || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

const TYPE_LABEL: Record<string, string> = {
  video: 'VIDEO', audio: 'AUDIO', pdf: 'READING', mcq: 'QUICK CHECK-IN', meditation: 'MEDITATION', text: 'PRACTICE',
};

export default function DailyActivityScreen() {
  const { date = '' } = useLocalSearchParams<{ date: string }>();
  const { session } = useSession();

  const [activity, setActivity] = useState<SadhanaEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!session || !date) return;
    let active = true;
    apiGetSadhanaByDate(session, date).then((res) => {
      if (!active) return;
      if (res.data?.activity) {
        setActivity(res.data.activity);
        setAnswers(new Array(res.data.activity.content_data?.questions?.length ?? 0).fill(-1));
      } else {
        setError('There is no published activity for this date.');
      }
      setLoading(false);
    });
    return () => { active = false; };
  }, [session, date]);

  const dayLabel = /^\d{4}-\d{2}-\d{2}$/.test(date)
    ? new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  if (loading) return <Screen><AppHeader title="Daily Activity" back /><Loading /></Screen>;
  if (!activity) {
    return <Screen>
      <AppHeader title="No activity scheduled" subtitle={dayLabel} back />
      <EmptyState icon="calendar-clear-outline" title="Nothing for this day" message={error || 'There isn’t a published activity for this date yet.'} />
    </Screen>;
  }

  const isToday = date === indiaToday();
  const questions = activity.content_data?.questions ?? [];
  const isMeditation = activity.content_type === 'meditation';
  const mediaUrl = resolveMediaUrl(isMeditation ? activity.meditation_media_url : activity.media_url);
  const mediaKind = isMeditation ? (activity.meditation_media_type === 'video' ? 'video' : 'audio') : activity.content_type;
  const quizPending = questions.length > 0 && !submitted;

  const complete = async () => {
    if (!session || activity.completed || saving || quizPending) return;
    setSaving(true);
    setError('');
    const res = await apiCompleteSadhanaById(session, activity.id);
    setSaving(false);
    if (res.error) return setError(res.error || 'Could not save your completion. Please try again.');
    setActivity({ ...activity, completed: true });
  };

  return <Screen>
    <AppHeader title={activity.title} subtitle={dayLabel} back />

    <Card style={styles.introCard}>
      <View style={styles.introRow}>
        <View style={styles.iconBubble}><Ionicons name={activityIcon(activity.content_type)} size={22} color={Palette.goldDark} /></View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.eyebrow}>FREE DAILY ACTIVITY · {TYPE_LABEL[activity.content_type ?? 'text'] ?? 'PRACTICE'}</Text>
          <Text style={styles.title}>{activity.title}</Text>
        </View>
        {activity.completed ? <Ionicons name="checkmark-circle" size={24} color={Palette.success} /> : null}
      </View>
      <Text style={ui.body}>{activity.description || 'Take a little time for today’s activity.'}</Text>
    </Card>

    {mediaUrl && mediaKind === 'video' ? <VideoMedia uri={mediaUrl} /> : null}
    {mediaUrl && mediaKind === 'audio' ? <AudioMedia uri={mediaUrl} title={isMeditation ? activity.meditation_title ?? activity.title : activity.title} /> : null}
    {mediaUrl && mediaKind === 'pdf' ? <PdfMedia uri={mediaUrl} onError={setError} /> : null}
    {['video', 'audio', 'pdf', 'meditation'].includes(activity.content_type ?? '') && !mediaUrl
      ? <Notice tone="info">This activity’s media is not available yet.</Notice> : null}

    {isMeditation && activity.meditation_title
      ? <Text style={ui.small}>Selected meditation: <Text style={{ fontWeight: '700', color: Palette.charcoal }}>{activity.meditation_title}</Text></Text>
      : null}

    {activity.content_type === 'mcq' && questions.length > 0 ? (
      <Card style={{ gap: 14 }}>
        <Text style={styles.sectionHeading}>Quick check-in</Text>
        {questions.map((q, qi) => (
          <View key={qi} style={{ gap: 8 }}>
            <Text style={styles.question}>{qi + 1}. {q.prompt}</Text>
            {q.options.map((option, oi) => {
              const selected = answers[qi] === oi;
              const correct = submitted && q.answer === oi;
              const wrong = submitted && selected && q.answer !== oi;
              const locked = submitted || activity.completed || !isToday;
              return <Pressable
                key={oi}
                disabled={locked}
                onPress={() => setAnswers((cur) => cur.map((a, i) => (i === qi ? oi : a)))}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected, disabled: locked }}
                style={[styles.option, selected && styles.optionSelected, correct && styles.optionCorrect, wrong && styles.optionWrong]}
              >
                <Ionicons
                  name={correct ? 'checkmark-circle' : wrong ? 'close-circle' : selected ? 'radio-button-on' : 'radio-button-off'}
                  size={18}
                  color={correct ? Palette.success : wrong ? Palette.danger : Palette.goldDark}
                />
                <Text style={styles.optionText}>{option}</Text>
              </Pressable>;
            })}
            {submitted && answers[qi] !== q.answer ? <Text style={styles.retryHint}>Review the activity and try again.</Text> : null}
          </View>
        ))}
        {isToday && !activity.completed ? (
          <ActionButton
            variant="outline"
            label={submitted ? 'Answers submitted' : 'Submit answers'}
            onPress={() => setSubmitted(true)}
            disabled={submitted || answers.some((a) => a < 0)}
          />
        ) : null}
      </Card>
    ) : null}

    {error && activity ? <Notice tone="error">{error}</Notice> : null}

    <Card style={styles.completionCard}>
      <View style={styles.completionRow}>
        <Ionicons
          name={activity.completed ? 'checkmark-circle' : isToday ? 'lock-open-outline' : 'lock-closed-outline'}
          size={16}
          color={activity.completed ? Palette.success : Palette.stone}
        />
        <Text style={[ui.small, { flex: 1 }]}>
          {activity.completed
            ? 'Completed on its scheduled day'
            : isToday ? 'Free for every member' : 'Review only · this day’s activity can no longer be completed'}
        </Text>
      </View>
      {isToday && !activity.completed ? (
        <ActionButton
          icon="checkmark-circle-outline"
          label={quizPending ? 'Submit your answers first' : 'Mark complete'}
          onPress={complete}
          loading={saving}
          disabled={quizPending}
        />
      ) : null}
      {activity.completed && isToday ? (
        <ActionButton variant="quiet" label="Back to Daily Sadhana" onPress={() => (router.canGoBack() ? router.back() : router.replace('/sadhana' as any))} />
      ) : null}
    </Card>
  </Screen>;
}

function VideoMedia({ uri }: { uri: string }) {
  const { width } = useWindowDimensions();
  const player = useVideoPlayer(uri, (p) => { p.loop = false; });
  const { status } = useEvent(player, 'statusChange', { status: player.status });
  return <View style={{ gap: 8 }}>
    <View style={styles.playerWrap}>
      <VideoView
        style={{ width: '100%', height: Math.round(Math.min(width, 760) * 9 / 16) }}
        player={player}
        nativeControls
        fullscreenOptions={{ enable: true }}
        contentFit="contain"
      />
    </View>
    {status === 'error' ? <Notice tone="error">This video could not be played. Please check your connection and try again.</Notice> : null}
  </View>;
}

function AudioMedia({ uri, title }: { uri: string; title: string }) {
  const player = useAudioPlayer({ uri });
  const status = useAudioPlayerStatus(player);
  const duration = status.duration || 0;
  const position = status.currentTime || 0;
  const pct = duration > 0 ? Math.min(100, Math.round((position / duration) * 100)) : 0;

  const toggle = () => {
    if (status.playing) return player.pause();
    if (status.didJustFinish || (duration > 0 && position >= duration - 0.5)) void player.seekTo(0);
    player.play();
  };
  const skip = (sec: number) => void player.seekTo(Math.max(0, Math.min(duration || Infinity, position + sec)));

  return <Card style={styles.audioCard}>
    <Text style={styles.audioTitle} numberOfLines={2}>{title}</Text>
    <ProgressBar pct={pct} height={6} />
    <View style={styles.timeRow}><Text style={ui.small}>{clock(position)}</Text><Text style={ui.small}>{clock(duration)}</Text></View>
    <View style={styles.controls}>
      <Pressable onPress={() => skip(-15)} accessibilityRole="button" accessibilityLabel="Back 15 seconds" style={styles.skipBtn}>
        <Ionicons name="play-back-outline" size={22} color={Palette.goldDark} />
      </Pressable>
      <Pressable onPress={toggle} disabled={!status.isLoaded} accessibilityRole="button" accessibilityLabel={status.playing ? 'Pause' : 'Play'} style={[styles.playBtn, !status.isLoaded && { opacity: 0.5 }]}>
        <Ionicons name={status.playing ? 'pause' : 'play'} size={28} color={Palette.onAccent} />
      </Pressable>
      <Pressable onPress={() => skip(15)} accessibilityRole="button" accessibilityLabel="Forward 15 seconds" style={styles.skipBtn}>
        <Ionicons name="play-forward-outline" size={22} color={Palette.goldDark} />
      </Pressable>
    </View>
    {!status.isLoaded ? <Text style={[ui.small, { textAlign: 'center' }]}>Loading audio…</Text> : null}
  </Card>;
}

function PdfMedia({ uri, onError }: { uri: string; onError: (msg: string) => void }) {
  const open = async () => {
    try { await WebBrowser.openBrowserAsync(uri); } catch { onError('Could not open this document.'); }
  };
  return <Card style={styles.pdfCard}>
    <Ionicons name="document-text-outline" size={36} color={Palette.goldDark} />
    <Text style={[ui.body, { textAlign: 'center' }]}>Today’s reading is a PDF document.</Text>
    <ActionButton icon="open-outline" label="Open PDF" onPress={open} />
  </Card>;
}

const styles = StyleSheet.create({
  introCard: { gap: 10, backgroundColor: Palette.goldSoft, borderColor: Palette.gold },
  introRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBubble: { width: 44, height: 44, borderRadius: 22, backgroundColor: Palette.surface, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { color: Palette.goldDark, fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  title: { color: Palette.charcoal, fontFamily: BrandFonts.heading, fontSize: 20, fontWeight: '700', lineHeight: 26 },
  playerWrap: { borderRadius: 16, overflow: 'hidden', backgroundColor: '#000' },
  audioCard: { gap: 10 },
  audioTitle: { color: Palette.charcoal, fontSize: 15, fontWeight: '700', textAlign: 'center' },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 28 },
  skipBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: Palette.goldSoft },
  playBtn: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: Palette.gold },
  pdfCard: { alignItems: 'center', gap: 10, paddingVertical: 22 },
  sectionHeading: { color: Palette.charcoal, fontFamily: BrandFonts.heading, fontSize: 18, fontWeight: '700' },
  question: { color: Palette.charcoal, fontSize: 15, fontWeight: '700' },
  option: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: Palette.line, backgroundColor: Palette.surface },
  optionSelected: { borderColor: Palette.gold, backgroundColor: Palette.highlight },
  optionCorrect: { borderColor: Palette.success, backgroundColor: Palette.successSoft },
  optionWrong: { borderColor: Palette.danger, backgroundColor: Palette.dangerSoft },
  optionText: { color: Palette.charcoal, fontSize: 14, flex: 1 },
  retryHint: { color: Palette.danger, fontSize: 12 },
  completionCard: { gap: 12 },
  completionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
