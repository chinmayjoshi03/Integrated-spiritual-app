import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader, Card, Screen, ui } from '@/components/karma-ui';
import { Palette } from '@/constants/theme';
import { useSession } from '@/context/auth-context';
import { type BookmarkItem, apiGetBookmarks, apiToggleBookmark } from '@/services/api';

const TYPE_LABELS: Record<string, string> = {
  course:    'COURSE',
  meditation: 'MEDITATION',
  product:   'SHOP PRODUCT',
};

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  course:    { bg: '#EEF2FF', text: '#4338CA' },
  meditation: { bg: '#F0FDF4', text: '#16A34A' },
  product:   { bg: Palette.goldSoft, text: Palette.goldDark },
};

function pathForItem(item: BookmarkItem): string {
  if (item.type === 'course') return `/courses/${item.id}`;
  if (item.type === 'meditation') return `/meditation/${item.id}`;
  return `/shop/${item.id}`;
}

export default function BookmarksScreen() {
  const { session } = useSession();
  const [items, setItems] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      if (!session) return;
      setLoading(true);
      setError('');
      apiGetBookmarks(session)
        .then((res) => {
          if (res.data) setItems(res.data.items ?? []);
          else setError(res.error ?? 'Could not load saved items.');
        })
        .catch(() => setError('Could not load saved items.'))
        .finally(() => setLoading(false));
    }, [session])
  );

  const handleRemove = async (item: BookmarkItem) => {
    if (!session) return;
    // Optimistic removal
    setItems((prev) => prev.filter((i) => !(i.id === item.id && i.type === item.type)));
    await apiToggleBookmark(session, item.type, item.id);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Screen>
        <AppHeader
          title="Saved Items"
          subtitle="Courses, meditations and products you've bookmarked."
          back
        />

        {error !== '' && (
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        )}

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={Palette.gold} size="large" />
          </View>
        ) : items.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🔖</Text>
            <Text style={styles.emptyTitle}>No saved items yet</Text>
            <Text style={[ui.small, { textAlign: 'center' }]}>
              Bookmark a course, meditation, or product to keep it here for later.
            </Text>
            <Pressable style={styles.exploreBtn} onPress={() => router.push('/meditations' as any)}>
              <Text style={styles.exploreBtnText}>Explore Meditations</Text>
            </Pressable>
          </Card>
        ) : (
          <View style={styles.grid}>
            {items.map((item) => {
              const typeMeta = TYPE_COLORS[item.type] ?? TYPE_COLORS.product;
              return (
                <Pressable
                  key={`${item.type}-${item.id}`}
                  onPress={() => router.push(pathForItem(item) as any)}
                >
                  <Card style={styles.itemCard}>
                    {/* Type badge + remove button */}
                    <View style={styles.itemTopRow}>
                      <View style={[styles.typeBadge, { backgroundColor: typeMeta.bg }]}>
                        <Text style={[styles.typeBadgeText, { color: typeMeta.text }]}>
                          {TYPE_LABELS[item.type] ?? item.type.toUpperCase()}
                        </Text>
                      </View>
                      <Pressable
                        style={styles.removeBtn}
                        onPress={() => handleRemove(item)}
                        hitSlop={8}
                      >
                        <Text style={styles.removeBtnIcon}>🔖</Text>
                      </Pressable>
                    </View>

                    {/* Title */}
                    <Text style={styles.itemTitle} numberOfLines={2}>
                      {item.title}
                    </Text>

                    {/* Subtitle — mentor for courses, description for others */}
                    {item.mentor_name ? (
                      <Text style={ui.small}>with {item.mentor_name}</Text>
                    ) : item.description ? (
                      <Text style={ui.small} numberOfLines={2}>
                        {item.description}
                      </Text>
                    ) : null}

                    {/* Price */}
                    {item.price !== null && item.price !== undefined && (
                      <Text style={styles.itemPrice}>
                        ₹{Number(item.price).toLocaleString('en-IN')}
                      </Text>
                    )}
                  </Card>
                </Pressable>
              );
            })}
          </View>
        )}
      </Screen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.ivory },
  loadingWrap: { paddingVertical: 48, alignItems: 'center' },
  errorCard: { backgroundColor: Palette.blush },
  errorText: { color: Palette.danger, fontSize: 14 },

  emptyCard: { alignItems: 'center', gap: 12, paddingVertical: 48 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: {
    color: Palette.charcoal,
    fontFamily: 'serif',
    fontSize: 20,
    fontWeight: '700',
  },
  exploreBtn: {
    backgroundColor: Palette.goldDark,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    marginTop: 4,
  },
  exploreBtnText: { color: Palette.surface, fontSize: 14, fontWeight: '700' },

  grid: { gap: 12 },
  itemCard: { gap: 8 },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  typeBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  removeBtn: { padding: 4 },
  removeBtnIcon: { fontSize: 18 },
  itemTitle: {
    color: Palette.charcoal,
    fontFamily: 'serif',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  itemPrice: {
    color: Palette.goldDark,
    fontFamily: 'serif',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
});
