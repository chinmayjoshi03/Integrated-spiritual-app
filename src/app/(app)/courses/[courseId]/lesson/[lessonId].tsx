import { useVideoPlayer, VideoView } from 'expo-video';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader, Card, ui } from '@/components/karma-ui';
import { Palette, Spacing } from '@/constants/theme';
import { useSession } from '@/context/auth-context';
import {
  type CourseDetail,
  apiGetCourseDetail,
  apiMarkLessonProgress,
  getVideoUrl,
} from '@/services/api';

const { width: SCREEN_W } = Dimensions.get('window');
const PLAYER_H = Math.round(SCREEN_W * (9 / 16)); // 16:9

// ─── Video platform note ───────────────────────────────────────────────────────
// Currently serving from local backend/videos/<filename>.
// When ready to migrate: replace `getVideoUrl()` in api.ts with:
//   Cloudflare Stream HLS: `https://customer-<id>.cloudflarestream.com/${id}/manifest/video.m3u8`
//   Mux HLS:               `https://stream.mux.com/${playbackId}.m3u8`
// No other changes needed in this file.
// ──────────────────────────────────────────────────────────────────────────────

export default function LessonScreen() {
  const { courseId, lessonId } = useLocalSearchParams<{
    courseId: string;
    lessonId: string;
  }>();
  const { session } = useSession();

  const [detail, setDetail] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [marked, setMarked] = useState(false);
  const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Load course detail ──
  const load = useCallback(async () => {
    if (!session || !courseId) return;
    const res = await apiGetCourseDetail(session, Number(courseId));
    if (res.data) setDetail(res.data);
    setLoading(false);
  }, [session, courseId]);

  useEffect(() => {
    load();
    return () => {
      if (autoSaveRef.current) clearInterval(autoSaveRef.current);
    };
  }, [load]);

  const lesson = detail?.lessons.find((l) => l.id === Number(lessonId));
  const lessonIndex = detail?.lessons.findIndex((l) => l.id === Number(lessonId)) ?? -1;
  const allLessons = detail?.lessons ?? [];

  // Seed marked state from saved progress
  useEffect(() => {
    if (lesson?.completed) setMarked(true);
  }, [lesson]);

  // ── Video player ──
  const videoUri = lesson?.video_filename && session
    ? getVideoUrl(lesson.video_filename, session)
    : null;

  const player = useVideoPlayer(videoUri ?? null, (p) => {
    p.loop = false;
    // Start from where the user left off
    if (lesson?.watched_sec && lesson.watched_sec > 0) {
      p.currentTime = lesson.watched_sec;
    }
  });

  // ── Save progress ──
  const saveProgress = useCallback(
    async (completed: boolean) => {
      if (!session || !courseId || !lessonId) return;
      const watched = Math.floor(player.currentTime ?? 0);
      setSaving(true);
      await apiMarkLessonProgress(session, Number(courseId), Number(lessonId), {
        watched_sec: watched,
        completed,
      });
      setSaving(false);
      if (completed) {
        setMarked(true);
        player.pause();
        load();
      }
    },
    [session, courseId, lessonId, player, load]
  );

  // Auto-save every 15 seconds while playing
  useEffect(() => {
    if (!session) return;
    autoSaveRef.current = setInterval(() => {
      if (player.playing && !marked) {
        saveProgress(false);
      }
    }, 15000);
    return () => {
      if (autoSaveRef.current) clearInterval(autoSaveRef.current);
    };
  }, [player, session, marked, saveProgress]);

  // Auto-mark complete at 90% watched
  useEffect(() => {
    if (marked) return;
    const duration = lesson?.duration_sec ?? 0;
    if (!duration) return;
    const current = player.currentTime ?? 0;
    if (current > 0 && current / duration >= 0.9) {
      saveProgress(true);
    }
  }, [player.currentTime, lesson?.duration_sec, marked, saveProgress]);

  // ── Loading / error states ──
  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Palette.gold} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!lesson) {
    return (
      <SafeAreaView style={styles.safe}>
        <AppHeader title="Lesson" back />
        <Text style={styles.errorText}>Lesson not found.</Text>
      </SafeAreaView>
    );
  }

  const duration = lesson.duration_sec || 0;
  const elapsed = Math.floor(player.currentTime ?? lesson.watched_sec ?? 0);
  const pct = duration > 0 ? Math.min(100, Math.round((elapsed / duration) * 100)) : 0;
  const nextLesson = lessonIndex < allLessons.length - 1 ? allLessons[lessonIndex + 1] : null;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.headerWrap}>
          <AppHeader title="" back />
        </View>

        {/* ── Video Player ── */}
        <View style={styles.playerWrap}>
          {videoUri ? (
            <VideoView
              style={styles.player}
              player={player}
              nativeControls
              allowsPictureInPicture
              fullscreenOptions={{ enable: true }}
              contentFit="contain"
            />
          ) : (
            /* No video file yet — rich placeholder */
            <View style={styles.player}>
              <View style={styles.noVideoInner}>
                <View style={styles.noVideoIconWrap}>
                  <Text style={styles.noVideoIcon}>🎬</Text>
                </View>
                <Text style={styles.noVideoTitle}>Video coming soon</Text>
                <Text style={styles.noVideoSub}>
                  Drop a .mp4 file in{'\n'}
                  <Text style={styles.noVideoCode}>backend/videos/{lesson.video_filename ?? '<filename>.mp4'}</Text>
                  {'\n'}and set{' '}
                  <Text style={styles.noVideoCode}>video_filename</Text> in the DB.
                </Text>
                <Text style={styles.noVideoPlatform}>
                  📡 Cloudflare Stream ready when you are
                </Text>
              </View>
            </View>
          )}

          {/* Progress bar under player */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${pct}%` }]} />
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(elapsed)}</Text>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
        </View>

        {/* ── Lesson Info ── */}
        <View style={styles.body}>

          {/* Lesson badge */}
          <View style={styles.indexRow}>
            <View style={styles.indexBadge}>
              <Text style={styles.indexText}>
                Lesson {lessonIndex + 1} of {allLessons.length}
              </Text>
            </View>
            {lesson.is_free && (
              <View style={styles.freeBadge}>
                <Text style={styles.freeText}>FREE PREVIEW</Text>
              </View>
            )}
          </View>

          <Text style={styles.lessonTitle}>{lesson.title}</Text>

          {lesson.description ? (
            <Text style={[ui.body, { marginTop: 2 }]}>{lesson.description}</Text>
          ) : null}

          {/* Mark complete / completed banner */}
          {!marked ? (
            <Pressable
              style={[styles.markBtn, saving && styles.markBtnDisabled]}
              disabled={saving}
              onPress={() => saveProgress(true)}
            >
              {saving ? (
                <ActivityIndicator color={Palette.charcoal} size="small" />
              ) : (
                <>
                  <Text style={styles.markBtnIcon}>✓</Text>
                  <Text style={styles.markBtnText}>Mark as complete</Text>
                </>
              )}
            </Pressable>
          ) : (
            <View style={styles.completedBanner}>
              <Text style={styles.completedIcon}>✓</Text>
              <Text style={styles.completedText}>Lesson completed</Text>
            </View>
          )}

          {/* Lesson notes */}
          <Card style={styles.notesCard}>
            <Text style={styles.notesSectionTitle}>📝  Lesson notes</Text>
            <Text style={ui.body}>
              {lesson.description ??
                'Reflect on what you hear and feel during this session. Bring a spirit of openness — there is nothing to achieve, only to notice.'}
            </Text>
          </Card>

          {/* Up next */}
          {nextLesson && (
            <View style={styles.upNextWrap}>
              <Text style={styles.upNextLabel}>Up next</Text>
              <Pressable
                onPress={() =>
                  router.replace(`/courses/${courseId}/lesson/${nextLesson.id}` as any)
                }
              >
                <Card style={styles.upNextCard}>
                  <View style={[styles.upNextNum, nextLesson.completed && styles.upNextNumDone]}>
                    <Text style={[styles.upNextNumText, nextLesson.completed && styles.upNextNumTextDone]}>
                      {nextLesson.completed ? '✓' : String(lessonIndex + 2).padStart(2, '0')}
                    </Text>
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={styles.upNextTitle}>{nextLesson.title}</Text>
                    <Text style={styles.upNextDuration}>{formatTime(nextLesson.duration_sec)}</Text>
                  </View>
                  <Text style={styles.arrow}>›</Text>
                </Card>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatTime(sec: number): string {
  if (!sec) return '0:00';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.charcoal },
  scroll: { paddingBottom: 100 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: Palette.danger, padding: 24, textAlign: 'center' },

  headerWrap: {
    paddingHorizontal: Spacing.three,
    backgroundColor: Palette.charcoal,
  },

  // ── Player ──
  playerWrap: { backgroundColor: Palette.charcoal },
  player: {
    width: SCREEN_W,
    height: PLAYER_H,
    backgroundColor: '#0D0D0D',
  },

  // No-video placeholder
  noVideoInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  noVideoIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(201,162,77,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noVideoIcon: { fontSize: 38 },
  noVideoTitle: { color: '#E0D8CC', fontSize: 17, fontWeight: '700', textAlign: 'center' },
  noVideoSub: { color: '#888', fontSize: 12, textAlign: 'center', lineHeight: 18 },
  noVideoCode: { color: Palette.gold, fontWeight: '600' },
  noVideoPlatform: { color: '#555', fontSize: 11, textAlign: 'center' },

  progressTrack: {
    height: 4,
    backgroundColor: '#333',
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: Palette.gold },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 14,
  },
  timeText: { color: '#888', fontSize: 12 },

  // ── Body ──
  body: {
    backgroundColor: Palette.ivory,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -16,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
    maxWidth: 760,
    alignSelf: 'center',
    width: '100%',
  },

  indexRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  indexBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Palette.goldSoft,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  indexText: { color: Palette.goldDark, fontSize: 12, fontWeight: '700' },
  freeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#D4EDDA',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  freeText: { color: '#2D6A4F', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  lessonTitle: {
    color: Palette.charcoal,
    fontFamily: 'serif',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 30,
  },

  markBtn: {
    minHeight: 54,
    borderRadius: 17,
    backgroundColor: Palette.gold,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  markBtnDisabled: { opacity: 0.6 },
  markBtnIcon: { color: Palette.charcoal, fontSize: 18, fontWeight: '800' },
  markBtnText: { color: Palette.charcoal, fontSize: 16, fontWeight: '700', fontFamily: 'serif' },

  completedBanner: {
    minHeight: 54,
    borderRadius: 17,
    backgroundColor: '#D4EDDA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  completedIcon: { color: '#2D6A4F', fontSize: 18, fontWeight: '800' },
  completedText: { color: '#2D6A4F', fontSize: 16, fontWeight: '700' },

  notesCard: { gap: 10 },
  notesSectionTitle: {
    color: Palette.charcoal,
    fontFamily: 'serif',
    fontSize: 17,
    fontWeight: '700',
  },

  upNextWrap: { gap: 10 },
  upNextLabel: { color: Palette.stone, fontSize: 13, fontWeight: '600' },
  upNextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    borderRadius: 20,
  },
  upNextNum: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Palette.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  upNextNumDone: { backgroundColor: '#D4EDDA' },
  upNextNumText: { color: Palette.goldDark, fontFamily: 'serif', fontSize: 15, fontWeight: '700' },
  upNextNumTextDone: { color: '#2D6A4F' },
  upNextTitle: { color: Palette.charcoal, fontSize: 14, fontWeight: '600' },
  upNextDuration: { color: Palette.stone, fontSize: 12 },
  arrow: { color: Palette.goldDark, fontSize: 28 },
});
