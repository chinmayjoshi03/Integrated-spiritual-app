import { Ionicons } from '@expo/vector-icons';
import { useEvent } from 'expo';
import { router, useLocalSearchParams } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import {
  ActionButton,
  AppHeader,
  Card,
  EmptyState,
  Loading,
  Notice,
  ProgressBar,
  Screen,
  SectionTitle,
  ui,
} from '@/components/karma-ui';
import { BrandFonts, Palette } from '@/constants/theme';
import { useSession } from '@/context/auth-context';
import { type CourseDetail, type Lesson, apiGetCourseDetail, apiMarkLessonProgress, resolveMediaUrl } from '@/services/api';

const clock = (sec: number) => {
  const s = Math.max(0, Math.floor(sec || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export default function LessonScreen() {
  const { courseId, lessonId } = useLocalSearchParams<{ courseId: string; lessonId: string }>();
  const cId = Number(courseId);
  const lId = Number(lessonId);
  const { session } = useSession();

  const [detail, setDetail] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!session || !Number.isInteger(cId)) return;
    const res = await apiGetCourseDetail(session, cId);
    if (res.error || !res.data) setError(res.error ?? 'Lesson not found.');
    else setDetail(res.data);
    setLoading(false);
  }, [session, cId]);

  useEffect(() => { void load(); }, [load]);

  const lessons = detail?.lessons ?? [];
  const index = lessons.findIndex((l) => l.id === lId);
  const lesson = index >= 0 ? lessons[index] : undefined;

  if (loading) return <Screen><AppHeader title="Lesson" back /><Loading /></Screen>;
  if (error || !lesson || !detail) {
    return <Screen><AppHeader title="Lesson" back /><EmptyState icon="alert-circle-outline" title="Lesson unavailable" message={error || 'Lesson not found.'} /></Screen>;
  }

  const lessonLocked = detail.locked && !lesson.is_free;
  const next = index < lessons.length - 1 ? lessons[index + 1] : null;

  return <Screen>
    <AppHeader title={`Lesson ${index + 1} of ${lessons.length}`} subtitle={detail.course.title} back />

    {lessonLocked || !lesson.content_url ? (
      <EmptyState
        icon={lessonLocked ? 'lock-closed-outline' : 'time-outline'}
        title={lessonLocked ? 'Enroll to unlock' : 'Content coming soon'}
        message={lessonLocked ? 'This lesson is available after you enroll in the course.' : 'This lesson’s content has not been published yet.'}
      />
    ) : lesson.content_type === 'pdf' ? (
      <PdfLesson key={lesson.id} lesson={lesson} courseId={cId} session={session!} onCompleted={load} />
    ) : (
      <VideoLesson key={lesson.id} lesson={lesson} courseId={cId} session={session!} onCompleted={load} />
    )}

    <Card>
      {lesson.is_free && detail.locked ? <Text style={styles.freeTag}>FREE DEMO</Text> : null}
      <Text style={styles.title}>{lesson.title}</Text>
      {lesson.description ? <Text style={ui.body}>{lesson.description}</Text> : null}
    </Card>

    {next ? <>
      <SectionTitle>Up next</SectionTitle>
      <Pressable onPress={() => router.replace(`/courses/${cId}/lesson/${next.id}` as any)} accessibilityRole="button">
        <Card style={styles.nextRow}>
          <Ionicons name={next.completed ? 'checkmark-circle' : 'play-circle-outline'} size={26} color={next.completed ? Palette.success : Palette.gold} />
          <View style={{ flex: 1 }}>
            <Text style={styles.nextTitle} numberOfLines={2}>{next.title}</Text>
            {detail.locked && !next.is_free ? <Text style={ui.small}>Enroll to unlock</Text> : null}
          </View>
          <Ionicons name="chevron-forward" size={18} color={Palette.goldDark} />
        </Card>
      </Pressable>
    </> : null}
  </Screen>;
}

type LessonProps = { lesson: Lesson; courseId: number; session: string; onCompleted: () => void };

function VideoLesson({ lesson, courseId, session, onCompleted }: LessonProps) {
  const { width } = useWindowDimensions();
  const [completed, setCompleted] = useState(lesson.completed);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const lastSaved = useRef(lesson.watched_sec);

  const uri = resolveMediaUrl(lesson.content_url);
  const player = useVideoPlayer(uri ?? null, (p) => {
    p.loop = false;
    p.timeUpdateEventInterval = 1;
  });

  // Resume where the member left off once the video is ready.
  const { status } = useEvent(player, 'statusChange', { status: player.status });
  const resumed = useRef(false);
  useEffect(() => {
    if (status === 'readyToPlay' && !resumed.current) {
      resumed.current = true;
      if (lesson.watched_sec > 0 && !lesson.completed) player.currentTime = lesson.watched_sec;
    }
    if (status === 'error') setError('This video could not be played. Please check your connection and try again.');
  }, [status, player, lesson.watched_sec, lesson.completed]);

  const { currentTime } = useEvent(player, 'timeUpdate', { currentTime: player.currentTime, currentLiveTimestamp: null, currentOffsetFromLive: null, bufferedPosition: 0 });
  const duration = player.duration || lesson.duration_sec || 0;

  const save = useCallback(async (markComplete: boolean) => {
    const seconds = Math.floor(player.currentTime || 0);
    const res = await apiMarkLessonProgress(session, courseId, lesson.id, { watched_sec: seconds, completed: markComplete });
    if (!res.error) lastSaved.current = seconds;
    return res.error;
  }, [player, session, courseId, lesson.id]);

  // Save progress every 15 seconds of playback; auto-complete at 90%.
  useEffect(() => {
    if (completed) return;
    if (duration > 0 && currentTime / duration >= 0.9) {
      setCompleted(true);
      void save(true).then(() => onCompleted());
      return;
    }
    if (Math.abs(currentTime - lastSaved.current) >= 15) void save(false);
  }, [currentTime, duration, completed, save, onCompleted]);

  // Save on leave.
  useEffect(() => () => { if (!completed) void save(false); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const markComplete = async () => {
    setSaving(true);
    const err = await save(true);
    setSaving(false);
    if (err) return setError(err);
    setCompleted(true);
    player.pause();
    onCompleted();
  };

  const pct = duration > 0 ? Math.min(100, Math.round((currentTime / duration) * 100)) : 0;

  return <View style={{ gap: 12 }}>
    <View style={styles.playerWrap}>
      <VideoView style={{ width: '100%', height: Math.round(Math.min(width, 760) * 9 / 16) }} player={player} nativeControls allowsPictureInPicture fullscreenOptions={{ enable: true }} contentFit="contain" />
    </View>
    <ProgressBar pct={pct} height={6} />
    <View style={styles.timeRow}><Text style={ui.small}>{clock(currentTime)}</Text><Text style={ui.small}>{clock(duration)}</Text></View>
    {error ? <Notice tone="error">{error}</Notice> : null}
    {completed
      ? <Notice tone="success">Lesson completed</Notice>
      : <ActionButton icon="checkmark-circle-outline" label="Mark as complete" onPress={markComplete} loading={saving} />}
  </View>;
}

function PdfLesson({ lesson, courseId, session, onCompleted }: LessonProps) {
  const [completed, setCompleted] = useState(lesson.completed);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const open = async () => {
    const uri = resolveMediaUrl(lesson.content_url);
    if (!uri) return;
    try { await WebBrowser.openBrowserAsync(uri); } catch { setError('Could not open this document.'); }
  };

  const markComplete = async () => {
    setSaving(true);
    const res = await apiMarkLessonProgress(session, courseId, lesson.id, { watched_sec: 0, completed: true });
    setSaving(false);
    if (res.error) return setError(res.error);
    setCompleted(true);
    onCompleted();
  };

  return <Card style={{ alignItems: 'stretch' }}>
    <View style={styles.pdfIcon}><Ionicons name="document-text-outline" size={34} color={Palette.goldDark} /></View>
    <Text style={[ui.body, { textAlign: 'center' }]}>This lesson is a reading. Open it, then mark it complete when you are done.</Text>
    <ActionButton icon="open-outline" label="Open document" onPress={open} />
    {error ? <Notice tone="error">{error}</Notice> : null}
    {completed
      ? <Notice tone="success">Lesson completed</Notice>
      : <ActionButton variant="outline" icon="checkmark-circle-outline" label="Mark as complete" onPress={markComplete} loading={saving} />}
  </Card>;
}

const styles = StyleSheet.create({
  playerWrap: { borderRadius: 18, overflow: 'hidden', backgroundColor: Palette.brown },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  title: { fontFamily: BrandFonts.heading, fontSize: 24, lineHeight: 31, color: Palette.charcoal },
  freeTag: { fontFamily: BrandFonts.bodySemi, fontSize: 11, letterSpacing: 1, color: Palette.success },
  nextRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  nextTitle: { fontFamily: BrandFonts.bodySemi, fontSize: 15, color: Palette.charcoal },
  pdfIcon: { alignSelf: 'center', width: 68, height: 68, borderRadius: 34, backgroundColor: Palette.goldSoft, alignItems: 'center', justifyContent: 'center' },
});
