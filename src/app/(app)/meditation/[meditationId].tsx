import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/karma-ui';
import RazorpayCheckoutSheet from '@/components/RazorpayCheckoutSheet';
import { Brand, BrandFonts, Palette } from '@/constants/theme';
import { useSession } from '@/context/auth-context';
import {
  type Meditation,
  apiCreateCoursePaymentOrder,
  apiGetMeditationDetail,
  apiSaveMeditationProgress,
  apiGetMeditationBookmarkStatus,
  apiToggleMeditationBookmark,
  getAudioUrl,
} from '@/services/api';

// One warm theme for every category — the website's colours (ivory background, gold accent).
const PLAYER_THEME = {
  bg: Palette.ivory,
  text: Palette.charcoal,
  sub: Palette.stone,
  accent: Palette.gold,
  circle: Palette.goldSelected,
};

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function MeditationPlayerScreen() {
  const { meditationId } = useLocalSearchParams<{ meditationId: string }>();
  const { session } = useSession();

  const [meditation, setMeditation] = useState<Meditation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Audio state
  const [audioUrl, setAudioUrl] = useState<string>('');
  const player = useAudioPlayer(audioUrl ? { uri: audioUrl } : null);
  const status = useAudioPlayerStatus(player);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkBusy, setBookmarkBusy] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const isPlaying = status.playing ?? false;
  const positionSec = Math.floor((status.currentTime ?? 0));
  const durationSec = Math.floor((status.duration ?? meditation?.duration_sec ?? 0));

  // Pulse animation for breathing circle
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse Loop animation
  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    if (isPlaying) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.35,
            duration: 4000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 4000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
    } else {
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    }
    return () => loop?.stop();
  }, [isPlaying, pulseAnim]);

  // Load meditation detail
  const loadDetail = useCallback(async () => {
    if (!session || !meditationId) return;
    const res = await apiGetMeditationDetail(session, Number(meditationId));
    if (res.error || !res.data) {
      setError(res.error || 'Failed to load meditation.');
    } else {
      setMeditation(res.data.meditation);
      setIsCompleted(res.data.meditation.completed);
      // Read (don't toggle!) the current bookmark state.
      apiGetMeditationBookmarkStatus(session, Number(meditationId)).then((b) => {
        setIsBookmarked(Boolean(b.data?.bookmarked));
      });
    }
    setLoading(false);
  }, [session, meditationId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  // Set audio mode & load URL when meditation is ready
  useEffect(() => {
    if (!meditation || !session) return;

    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'duckOthers',
    }).catch(console.error);

    const url = getAudioUrl(meditation.audio_filename, session);
    if (url) setAudioUrl(url);
  }, [meditation, session]);

  // Auto-play once player is ready
  useEffect(() => {
    if (audioUrl && player && status.isLoaded) {
      player.seekTo(meditation?.listened_sec ?? 0);
      player.play();
    }
  }, [audioUrl, status.isLoaded]);

  // Track completion
  useEffect(() => {
    if (status.didJustFinish && !isCompleted) {
      setIsCompleted(true);
      setShowCompleteModal(true);
      if (session && meditation) {
        apiSaveMeditationProgress(session, meditation.id, durationSec || positionSec, true);
      }
    }
  }, [status.didJustFinish]);



  // Save progress periodically (every 5s)
  useEffect(() => {
    if (!isPlaying || !session || !meditation || positionSec <= 0) return;

    const timer = setInterval(() => {
      apiSaveMeditationProgress(session, meditation.id, positionSec, false);
    }, 5000);

    return () => clearInterval(timer);
  }, [isPlaying, session, meditation, positionSec]);

  // Controls
  const togglePlayPause = () => {
    if (!player) return;
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  };

  const seekRelative = (offsetSeconds: number) => {
    if (!player) return;
    const target = Math.max(0, positionSec + offsetSeconds);
    player.seekTo(target);
  };

  const theme = PLAYER_THEME;

  if (loading) {
    return (
      <View style={[styles.loadingScreen, { backgroundColor: theme.bg }]}>
        <ActivityIndicator color={theme.accent} size="large" />
      </View>
    );
  }

  if (error || !meditation) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
        <View style={styles.errorWrap}>
          <Text style={[styles.errorText, { color: theme.text }]}>{error || 'Meditation not found.'}</Text>
          <Pressable style={[styles.backBtn, { borderColor: theme.accent }]} onPress={() => router.back()}>
            <Text style={[styles.backBtnText, { color: theme.text }]}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const progressPct = durationSec > 0 ? (positionSec / durationSec) * 100 : 0;

  // ── Enrollment wall — matches website's /dashboard/meditation/:id locked state ──
  if (meditation.locked) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: Palette.ivory }]}>
        {/* Header */}
        <View style={styles.wallHeader}>
          <Pressable onPress={() => router.back()} style={styles.wallBack}>
            <Ionicons name="arrow-back" size={22} color={Palette.charcoal} />
            <Text style={styles.wallBackText}>Back</Text>
          </Pressable>
        </View>

        <View style={styles.wallContent}>
          <Text style={styles.wallTitle}>{meditation.title}</Text>
          <Text style={styles.wallSubtitle}>Meditation</Text>

          {/* Enrollment card */}
          <View style={styles.wallCard}>
            <Text style={styles.wallEyebrow}>COURSE ENROLLMENT REQUIRED</Text>
            <Text style={styles.wallHeading}>Pay to access this meditation</Text>
            <Text style={styles.wallBody}>
              This meditation is included with{' '}
              <Text style={styles.wallBold}>{meditation.course_title ?? 'a course'}</Text>.
              {' '}Enroll in the course to unlock the audio and video.
            </Text>

            {meditation.course_id && (
              <Pressable
                style={styles.wallCta}
                onPress={() => setCheckoutOpen(true)}
              >
                <Text style={styles.wallCtaText}>
                  View course{meditation.course_price && Number(meditation.course_price) > 0
                    ? ` and pay ₹${Number(meditation.course_price).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
                    : ''}
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Checkout sheet */}
        {meditation.course_id && (
          <RazorpayCheckoutSheet
            visible={checkoutOpen}
            amount={Number(meditation.course_price ?? 0)}
            merchantName={Brand.name}
            purpose="Course enrollment"
            details={[
              { label: 'Course', value: meditation.course_title ?? 'Course' },
            ]}
            createOrder={() => apiCreateCoursePaymentOrder(session!, meditation.course_id!)}
            onPaymentComplete={async () => {
              setCheckoutOpen(false);
              // Reload the meditation — it will now be unlocked
              loadDetail();
            }}
            token={session ?? null}
            onClose={() => setCheckoutOpen(false)}
          />
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="close" size={22} color={theme.text} />
        </Pressable>


        <Pressable
          style={styles.iconBtn}
          onPress={async () => {
            if (!session || bookmarkBusy) return;
            const previous = isBookmarked;
            setIsBookmarked(!previous); // instant feedback
            setBookmarkBusy(true);
            const res = await apiToggleMeditationBookmark(session, meditation.id);
            setBookmarkBusy(false);
            if (res.error || !res.data) setIsBookmarked(previous);
            else setIsBookmarked(res.data.bookmarked);
          }}
          accessibilityRole="button"
          accessibilityLabel={isBookmarked ? 'Remove bookmark' : 'Bookmark this meditation'}
          hitSlop={8}
        >
          <Ionicons name={isBookmarked ? 'bookmark' : 'bookmark-outline'} size={22} color={theme.text} />
        </Pressable>
      </View>

      {/* ── Breathing Pulse Circle Visualizer ── */}
      <View style={styles.visualizerWrap}>
        <Animated.View
          style={[
            styles.outerPulse,
            {
              backgroundColor: theme.circle,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />
        <View style={[styles.innerCircle, { backgroundColor: theme.accent }]}>
          <Ionicons
            name={meditation.category === 'Sound' ? 'musical-notes' : meditation.category === 'Breathwork' ? 'leaf' : meditation.category === 'Ambient' ? 'sparkles' : 'flower'}
            size={44}
            color={Palette.onAccent}
          />
        </View>
      </View>

      {/* ── Titles & Description ── */}
      <View style={styles.infoWrap}>
        <Text style={[styles.title, { color: theme.text }]}>{meditation.title}</Text>
        <Text style={[styles.guide, { color: theme.sub }]}>Guided by {meditation.guide_name}</Text>
        <Text style={[styles.desc, { color: theme.sub }]} numberOfLines={2}>
          {meditation.description}
        </Text>
      </View>

      {/* ── Progress Slider Bar ── */}
      <View style={styles.sliderWrap}>
        <View style={[styles.trackBg, { backgroundColor: theme.circle }]}>
          <View style={[styles.trackFill, { width: `${progressPct}%`, backgroundColor: theme.accent }]} />
        </View>
        <View style={styles.timeRow}>
          <Text style={[styles.timeText, { color: theme.sub }]}>{formatTime(positionSec)}</Text>
          <Text style={[styles.timeText, { color: theme.sub }]}>-{formatTime(Math.max(0, durationSec - positionSec))}</Text>
        </View>
      </View>

      {/* ── Controls Row ── */}
      <View style={styles.controlsRow}>
        <Pressable style={styles.secBtn} onPress={() => seekRelative(-15)}>
          <Text style={[styles.secBtnText, { color: theme.text }]}>-15s</Text>
        </Pressable>

        <Pressable style={[styles.mainPlayBtn, { backgroundColor: theme.accent }]} onPress={togglePlayPause}>
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={30} color={Palette.onAccent} style={isPlaying ? undefined : { marginLeft: 3 }} />
        </Pressable>

        <Pressable style={styles.secBtn} onPress={() => seekRelative(15)}>
          <Text style={[styles.secBtnText, { color: theme.text }]}>+15s</Text>
        </Pressable>
      </View>

      {/* ── Completion Modal ── */}
      <Modal visible={showCompleteModal} transparent animationType="fade">
        <View style={styles.modalBg}>
          <Card style={styles.modalCard}>
            <Ionicons name="flower-outline" size={44} color={Palette.goldDark} />
            <Text style={styles.modalTitle}>Session Complete</Text>
            <Text style={styles.modalBody}>
              You have completed “{meditation.title}”. Take a deep breath and carry this peace into your day.
            </Text>

            <Pressable
              style={styles.modalDoneBtn}
              onPress={() => {
                setShowCompleteModal(false);
                router.back();
              }}
            >
              <Text style={styles.modalDoneBtnText}>Complete & Return</Text>
            </Pressable>
          </Card>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  loadingScreen: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.line },
  closeIcon: { fontSize: 22, fontWeight: '600' },
  tagPill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  tagText: { fontFamily: BrandFonts.bodySemi, fontSize: 11, letterSpacing: 1 },

  // Visualizer
  visualizerWrap: {
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  outerPulse: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
  },
  innerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    ...Platform.select({
      web: { boxShadow: '0px 6px 18px rgba(166,127,28,0.30)' },
      default: { shadowColor: Palette.goldDark, shadowOpacity: 0.3, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
    }),
  },
  centerIcon: { fontSize: 44 },

  // Info
  infoWrap: { paddingHorizontal: 28, alignItems: 'center', gap: 6 },
  title: { fontFamily: BrandFonts.heading, fontSize: 24, textAlign: 'center' },
  guide: { fontFamily: BrandFonts.bodySemi, fontSize: 14, marginBottom: 4 },
  desc: { fontFamily: BrandFonts.body, fontSize: 14, textAlign: 'center', lineHeight: 20 },

  // Slider
  sliderWrap: { paddingHorizontal: 28, marginTop: 32, gap: 8 },
  trackBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  trackFill: { height: '100%', borderRadius: 3 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  timeText: { fontFamily: BrandFonts.bodyMedium, fontSize: 12 },

  // Controls
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
    marginTop: 24,
  },
  secBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secBtnText: { fontFamily: BrandFonts.bodySemi, fontSize: 13 },
  mainPlayBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
  mainPlayIcon: { color: '#FFFFFF', fontSize: 24, marginLeft: 2 },

  // Modal
  modalBg: { flex: 1, backgroundColor: 'rgba(63,51,40,0.55)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: Palette.surface, alignItems: 'center', gap: 14, padding: 24, borderRadius: 24, width: '100%' },
  modalSymbol: { fontSize: 48 },
  modalTitle: { color: Palette.charcoal, fontFamily: BrandFonts.heading, fontSize: 22 },
  modalBody: { color: Palette.stone, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  modalDoneBtn: {
    backgroundColor: Palette.goldDark,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    marginTop: 6,
  },
  modalDoneBtnText: { color: Palette.surface, fontSize: 16, fontWeight: '700' },

  errorWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  errorText: { fontSize: 16 },
  backBtn: { borderWidth: 1, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 16 },
  backBtnText: { fontWeight: '700' },

  // Enrollment wall
  wallHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
  },
  wallBack: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  wallBackText: { color: Palette.charcoal, fontSize: 15, fontWeight: '600' },
  wallContent: { padding: 24, gap: 6 },
  wallTitle: { color: Palette.charcoal, fontFamily: BrandFonts.heading, fontSize: 26, lineHeight: 32 },
  wallSubtitle: { color: Palette.stone, fontSize: 14, marginBottom: 24 },
  wallCard: {
    backgroundColor: Palette.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Palette.line,
    padding: 22,
    gap: 12,
  },
  wallEyebrow: { color: Palette.goldDark, fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  wallHeading: { color: Palette.charcoal, fontFamily: BrandFonts.heading, fontSize: 20, lineHeight: 26 },
  wallBody: { color: Palette.stone, fontSize: 14, lineHeight: 21 },
  wallBold: { color: Palette.charcoal, fontWeight: '700' },
  wallCta: {
    backgroundColor: Palette.goldDark,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 4,
  },
  wallCtaText: { color: Palette.surface, fontSize: 15, fontWeight: '700' },
});
