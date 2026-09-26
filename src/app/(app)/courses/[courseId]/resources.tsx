import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader, Card, Screen, SectionTitle, ui } from '@/components/karma-ui';
import { Palette } from '@/constants/theme';
import { useSession } from '@/context/auth-context';
import { type Resource, apiGetCourseDetail, getResourceUrl } from '@/services/api';

export default function ResourcesScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const { session } = useSession();
  const [resources, setResources] = useState<Resource[]>([]);
  const [courseTitle, setCourseTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session || !courseId) return;
    const res = await apiGetCourseDetail(session, Number(courseId));
    if (res.error) {
      setError(res.error);
    } else {
      setResources(res.data?.resources ?? []);
      setCourseTitle(res.data?.course.title ?? 'Course');
    }
    setLoading(false);
  }, [session, courseId]);

  useEffect(() => { load(); }, [load]);

  const handleOpen = (r: Resource) => {
    if (r.file_url && session) {
      const targetUrl = getResourceUrl(r.file_url, session);
      Linking.openURL(targetUrl).catch(() =>
        Alert.alert('Cannot open', 'Unable to open this file right now.')
      );
    } else {
      Alert.alert(
        'Coming soon',
        'The PDF for this resource has not been uploaded yet. Check back later.'
      );
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Screen>
        <AppHeader title="Resources" subtitle={courseTitle} back />

        <View>
          <Text style={ui.title}>Course materials</Text>
          <Text style={[ui.body, { marginTop: 6 }]}>
            Download or open these resources to deepen your understanding of the
            course content.
          </Text>
        </View>

        {loading && (
          <View style={styles.center}>
            <ActivityIndicator color={Palette.gold} size="large" />
          </View>
        )}

        {!loading && error && (
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        )}

        {!loading && !error && resources.length === 0 && (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptySymbol}>📄</Text>
            <Text style={styles.emptyTitle}>No resources yet</Text>
            <Text style={[ui.small, { textAlign: 'center' }]}>
              Resources for this course will appear here once they are uploaded.
            </Text>
          </Card>
        )}

        {!loading && !error && resources.length > 0 && (
          <>
            <SectionTitle>PDFs & documents</SectionTitle>
            <View style={styles.list}>
              {resources.map((r) => (
                <ResourceCard key={r.id} resource={r} onPress={() => handleOpen(r)} />
              ))}
            </View>

            <Card style={styles.noteCard}>
              <Text style={styles.noteTitle}>💡 Tip</Text>
              <Text style={ui.body}>
                Print the workbook and keep it beside you during your practice
                sessions. Handwriting your reflections deepens retention.
              </Text>
            </Card>
          </>
        )}
      </Screen>
    </SafeAreaView>
  );
}

function ResourceCard({
  resource,
  onPress,
}: {
  resource: Resource;
  onPress: () => void;
}) {
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={onPress}
    >
      <Card style={[styles.card, pressed && styles.cardPressed] as any}>
        {/* Icon */}
        <View style={styles.iconWrap}>
          <View style={styles.pdfIcon}>
            <Text style={styles.pdfIconText}>PDF</Text>
          </View>
          {resource.file_url ? (
            <View style={styles.availableDot} />
          ) : (
            <View style={styles.pendingDot} />
          )}
        </View>

        {/* Text */}
        <View style={styles.info}>
          <Text style={styles.title}>{resource.title}</Text>
          {resource.description ? (
            <Text style={ui.small} numberOfLines={2}>
              {resource.description}
            </Text>
          ) : null}
          <Text style={styles.status}>
            {resource.file_url ? '↓  Tap to open' : 'Coming soon'}
          </Text>
        </View>

        <Text style={styles.arrow}>›</Text>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.ivory },
  center: { paddingVertical: 48, alignItems: 'center' },

  errorCard: { backgroundColor: Palette.blush, borderColor: Palette.blush },
  errorText: { color: Palette.danger, textAlign: 'center', fontSize: 14 },

  emptyCard: { alignItems: 'center', gap: 12, paddingVertical: 40 },
  emptySymbol: { fontSize: 48 },
  emptyTitle: {
    color: Palette.charcoal,
    fontFamily: 'serif',
    fontSize: 20,
    fontWeight: '700',
  },

  list: { gap: 12 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    borderRadius: 20,
  },
  cardPressed: { opacity: 0.75 },

  iconWrap: { position: 'relative', flexShrink: 0 },
  pdfIcon: {
    width: 50,
    height: 58,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomRightRadius: 2,
  },
  pdfIconText: { color: '#991B1B', fontSize: 12, fontWeight: '800' },
  availableDot: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: Palette.surface,
  },
  pendingDot: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Palette.stoneLight,
    borderWidth: 2,
    borderColor: Palette.surface,
  },

  info: { flex: 1, gap: 4 },
  title: { color: Palette.charcoal, fontSize: 15, fontWeight: '700' },
  status: { color: Palette.goldDark, fontSize: 12, fontWeight: '600', marginTop: 2 },

  arrow: { color: Palette.goldDark, fontSize: 28 },

  noteCard: { gap: 8, backgroundColor: Palette.goldSoft, borderColor: Palette.gold },
  noteTitle: { color: Palette.charcoal, fontWeight: '700', fontSize: 15 },
});
