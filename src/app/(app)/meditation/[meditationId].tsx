import { Audio } from 'expo-av';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon, Card } from '@/components/karma-ui';
import { Palette } from '@/constants/theme';
import { useSession } from '@/context/auth-context';
import {
  type Meditation,
  apiGetMeditationDetail,
  apiSaveMeditationProgress,
  getAudioUrl,
} from '@/services/api';

const THEMES: Record<string, { bg: string; text: string; sub: string; accent: string; circle: string }> = {
  Guided: { bg: '#0F172A', text: '#F8FAFC', sub: '#94A3B8', accent: '#6366F1', circle: 'rgba(99, 102, 241, 0.25)' },
  Sound: { bg: '#1E1B4B', text: '#FAF5FF', sub: '#D8B4FE', accent: '#F59E0B', circle: 'rgba(245, 158, 11, 0.25)' },
  Breathwork: { bg: '#064E3B', text: '#ECFDF5', sub: '#A7F3D0', accent: '#10B981', circle: 'rgba(16, 185, 129, 0.25)' },
  Ambient: { bg: '#2E1065', text: '#FAF5FF', sub: '#DDD6FE', accent: '#A855F7', circle: 'rgba(168, 85, 247, 0.25)' },
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

  // Audio State
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionSec, setPositionSec] = useState(0);
  const [durationSec, setDurationSec] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

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
      setDurationSec(res.data.meditation.duration_sec);
      setPositionSec(res.data.meditation.listened_sec);
      setIsCompleted(res.data.meditation.completed);
    }
    setLoading(false);
  }, [session, meditationId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  // Sound setup & teardown
  useEffect(() => {
    let isMounted = true;

    async function initSound() {
      if (!meditation || !session) return;

      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });

        const audioUrl = getAudioUrl(meditation.audio_filename, session);
        if (!audioUrl) return;

        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: true, positionMillis: meditation.listened_sec * 1000 },
          onPlaybackStatusUpdate
        );

        if (isMounted) {
          soundRef.current = newSound;
          setIsPlaying(true);
        } else {
          await newSound.unloadAsync();
        }
      } catch (err) {
        console.error('Audio initialization error:', err);
      }
    }

    if (meditation) {
      initSound();
    }

    return () => {
      isMounted = false;
      if (soundRef.current) {
        soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    };
  }, [meditation, session]);

  // Playback Status Callback
  const onPlaybackStatusUpdate = (status: any) => {
    if (!status.isLoaded) return;

    setIsPlaying(status.isPlaying);

    const posSeconds = Math.floor(status.positionMillis / 1000);
    const durSeconds = Math.floor((status.durationMillis || 0) / 1000);

    setPositionSec(posSeconds);
    if (durSeconds > 0) setDurationSec(durSeconds);

    // Audio finished
    if (status.didJustFinish) {
      setIsPlaying(false);
      setIsCompleted(true);
      setShowCompleteModal(true);
      if (session && meditation) {
        apiSaveMeditationProgress(session, meditation.id, durSeconds || posSeconds, true);
      }
    }
  };

  // Save progress periodically (every 5s)
  useEffect(() => {
    if (!isPlaying || !session || !meditation || positionSec <= 0) return;

    const timer = setInterval(() => {
      apiSaveMeditationProgress(session, meditation.id, positionSec, false);
    }, 5000);

    return () => clearInterval(timer);
  }, [isPlaying, session, meditation, positionSec]);

  // Controls
  const togglePlayPause = async () => {
    if (!soundRef.current) return;
    if (isPlaying) {
      await soundRef.current.pauseAsync();
    } else {
      await soundRef.current.playAsync();
    }
  };

  const seekRelative = async (offsetSeconds: number) => {
    if (!soundRef.current) return;
    const targetMillis = Math.max(0, (positionSec + offsetSeconds) * 1000);
    await soundRef.current.setPositionAsync(targetMillis);
  };

  const theme = meditation ? THEMES[meditation.category] || THEMES.Guided : THEMES.Guided;

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

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <Text style={[styles.closeIcon, { color: theme.text }]}>✕</Text>
        </Pressable>

        <View style={[styles.tagPill, { backgroundColor: theme.circle }]}>
          <Text style={[styles.tagText, { color: theme.accent }]}>{meditation.category.toUpperCase()}</Text>
        </View>

        <View style={{ width: 40 }} />
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
          <Text style={styles.centerIcon}>
            {meditation.category === 'Sound' ? '🎵' : meditation.category === 'Breathwork' ? '🫁' : meditation.category === 'Ambient' ? '✨' : '🧘'}
          </Text>
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
          <Text style={styles.mainPlayIcon}>{isPlaying ? '❚❚' : '▶'}</Text>
        </Pressable>

        <Pressable style={styles.secBtn} onPress={() => seekRelative(15)}>
          <Text style={[styles.secBtnText, { color: theme.text }]}>+15s</Text>
        </Pressable>
      </View>

      {/* ── Completion Modal ── */}
      <Modal visible={showCompleteModal} transparent animationType="fade">
        <View style={styles.modalBg}>
          <Card style={styles.modalCard}>
            <Text style={styles.modalSymbol}>🌸</Text>
            <Text style={styles.modalTitle}>Session Complete</Text>
            <Text style={styles.modalBody}>
              You have completed "{meditation.title}". Take a deep breath and carry this peace into your day.
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
  iconBtn: { padding: 8 },
  closeIcon: { fontSize: 22, fontWeight: '600' },
  tagPill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  tagText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },

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
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  centerIcon: { fontSize: 44 },

  // Info
  infoWrap: { paddingHorizontal: 28, alignItems: 'center', gap: 6 },
  title: { fontFamily: 'serif', fontSize: 24, fontWeight: '700', textAlign: 'center' },
  guide: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  desc: { fontSize: 13, textAlign: 'center', lineHeight: 18 },

  // Slider
  sliderWrap: { paddingHorizontal: 28, marginTop: 32, gap: 8 },
  trackBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  trackFill: { height: '100%', borderRadius: 3 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  timeText: { fontSize: 12, fontWeight: '600' },

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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secBtnText: { fontSize: 13, fontWeight: '700' },
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
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: Palette.surface, alignItems: 'center', gap: 14, padding: 24, borderRadius: 24, width: '100%' },
  modalSymbol: { fontSize: 48 },
  modalTitle: { color: Palette.charcoal, fontFamily: 'serif', fontSize: 22, fontWeight: '700' },
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
});
