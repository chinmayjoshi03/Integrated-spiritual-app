import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader, Card, Screen, SectionTitle, ui } from '@/components/karma-ui';
import { Palette } from '@/constants/theme';
import { useSession } from '@/context/auth-context';
import { type ShopItem, apiGetShopItems } from '@/services/api';

const CATEGORIES = ['All', 'Malas', 'Incense', 'Crystals', 'Texts', 'Ritual Tools', 'Apparel'] as const;

const CATEGORY_META: Record<string, { emoji: string; color: string; tagBg: string }> = {
  Malas:           { emoji: '📿', color: '#7C3AED', tagBg: '#EDE9FE' },
  Incense:         { emoji: '🌿', color: '#059669', tagBg: '#D1FAE5' },
  Crystals:        { emoji: '💎', color: '#0EA5E9', tagBg: '#E0F2FE' },
  Texts:           { emoji: '📖', color: '#D97706', tagBg: '#FEF3C7' },
  'Ritual Tools':  { emoji: '🔔', color: '#C9A24D', tagBg: '#F1E3BE' },
  Apparel:         { emoji: '🧘', color: '#E11D48', tagBg: '#FFE4E6' },
};

function getItemMeta(category: string) {
  return CATEGORY_META[category] ?? { emoji: '✨', color: Palette.goldDark, tagBg: Palette.goldSoft };
}

function formatPrice(price: string, currency: string): string {
  const num = parseFloat(price);
  if (currency === 'INR') return '\u20b9' + num.toLocaleString('en-IN');
  return '$' + num.toFixed(2);
}

export default function DivineShopScreen() {
  const { session } = useSession();
  const [selectedCat, setSelectedCat] = useState<string>('All');
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(
    async () => {
      if (!session) return;
      setLoading(true);
      const res = await apiGetShopItems(session, selectedCat);
      if (res.data) setItems(res.data.items);
      setLoading(false);
    },
    [session, selectedCat]
  );

  useFocusEffect(
    useCallback(() => {
      fetchItems();
    }, [fetchItems])
  );

  const featured = items.find((i) => i.is_featured) || items[0];
  const gridItems = items.filter((i) => i.id !== featured?.id);

  return (
    <SafeAreaView style={styles.safe}>
      <Screen>
        <AppHeader
          title="Divine Shop"
          subtitle="Sacred items curated for your journey"
          back
        />

        {/* Orders button */}
        <Pressable
          style={styles.ordersBtn}
          onPress={() => router.push('/shop/orders' as any)}
        >
          <Text style={styles.ordersBtnText}>📦  My Orders</Text>
        </Pressable>

        {/* Category filter bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.catScrollView}
          contentContainerStyle={styles.catBar}
        >
          {CATEGORIES.map((cat) => {
            const active = selectedCat === cat;
            const meta = getItemMeta(cat);
            return (
              <Pressable
                key={cat}
                onPress={() => setSelectedCat(cat)}
                style={[styles.catPill, active && styles.catPillActive]}
              >
                <Text style={[styles.catText, active && styles.catTextActive]}>
                  {cat === 'All' ? '✦ All' : `${meta.emoji} ${cat}`}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={Palette.gold} size="large" />
          </View>
        ) : (
          <>
            {/* Featured Item Hero */}
            {featured && selectedCat === 'All' && (
              <View style={styles.featuredSection}>
                <SectionTitle>Featured Sacred Item</SectionTitle>
                <Pressable onPress={() => router.push(('/shop/' + featured.id) as any)}>
                  <View style={styles.heroCard}>
                    <View style={[styles.heroArt, { backgroundColor: getItemMeta(featured.category).color + '22' }]}>
                      <Text style={styles.heroEmoji}>{getItemMeta(featured.category).emoji}</Text>
                      <View style={styles.featuredBadge}>
                        <Text style={styles.featuredBadgeText}>✦ FEATURED</Text>
                      </View>
                    </View>
                    <View style={styles.heroBody}>
                      <View style={[styles.heroCatBadge, { backgroundColor: getItemMeta(featured.category).tagBg }]}>
                        <Text style={[styles.heroCatText, { color: getItemMeta(featured.category).color }]}>
                          {featured.category.toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.heroTitle}>{featured.title}</Text>
                      <Text style={styles.heroDesc} numberOfLines={2}>{featured.description}</Text>
                      <View style={styles.heroFooter}>
                        <Text style={styles.heroPrice}>{formatPrice(featured.price, featured.currency)}</Text>
                        <View style={styles.viewBtn}>
                          <Text style={styles.viewBtnText}>View Item →</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </Pressable>
              </View>
            )}

            {/* Items Grid */}
            <SectionTitle>
              {selectedCat === 'All' ? 'All Sacred Items' : selectedCat}
            </SectionTitle>

            {items.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>🛕</Text>
                <Text style={styles.emptyTitle}>No items in this category</Text>
                <Text style={[ui.small, { textAlign: 'center' }]}>
                  Check back soon for new arrivals.
                </Text>
              </Card>
            ) : (
              <View style={styles.grid}>
                {(selectedCat === 'All' ? gridItems : items).map((item) => (
                  <ShopItemCard key={item.id} item={item} />
                ))}
              </View>
            )}
          </>
        )}
      </Screen>
    </SafeAreaView>
  );
}

function ShopItemCard({ item }: { item: ShopItem }) {
  const meta = getItemMeta(item.category);
  const outOfStock = item.stock_quantity === 0;

  return (
    <Pressable
      onPress={() => router.push(('/shop/' + item.id) as any)}
      style={({ pressed }) => [styles.gridCard, pressed && styles.gridCardPressed]}
    >
      <View style={[styles.gridArt, { backgroundColor: meta.color + '18' }]}>
        <Text style={styles.gridEmoji}>{meta.emoji}</Text>
        {outOfStock && (
          <View style={styles.soldBadge}>
            <Text style={styles.soldBadgeText}>Sold Out</Text>
          </View>
        )}
      </View>
      <View style={styles.gridBody}>
        <View style={[styles.miniCatBadge, { backgroundColor: meta.tagBg }]}>
          <Text style={[styles.miniCatText, { color: meta.color }]}>{item.category}</Text>
        </View>
        <Text style={styles.gridTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.gridPrice}>{formatPrice(item.price, item.currency)}</Text>
        {!outOfStock && item.stock_quantity <= 5 && (
          <Text style={styles.lowStock}>Only {item.stock_quantity} left</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.ivory },
  loadingWrap: { paddingVertical: 48, alignItems: 'center' },

  ordersBtn: {
    alignSelf: 'flex-end',
    backgroundColor: Palette.goldSoft,
    borderWidth: 1,
    borderColor: Palette.line,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 4,
  },
  ordersBtnText: { color: Palette.goldDark, fontSize: 13, fontWeight: '700' },

  catScrollView: { flexGrow: 0 },
  catBar: { flexDirection: 'row', gap: 8, paddingVertical: 10 },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.line,
  },
  catPillActive: { backgroundColor: Palette.goldDark, borderColor: Palette.goldDark },
  catText: { color: Palette.charcoal, fontSize: 13, fontWeight: '600' },
  catTextActive: { color: Palette.surface, fontWeight: '700' },

  featuredSection: { gap: 8, marginBottom: 8 },
  heroCard: {
    backgroundColor: Palette.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Palette.line,
    overflow: 'hidden',
  },
  heroArt: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  heroEmoji: { fontSize: 72 },
  featuredBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: Palette.goldDark,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  featuredBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  heroBody: { padding: 16, gap: 8 },
  heroCatBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  heroCatText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  heroTitle: { color: Palette.charcoal, fontFamily: 'serif', fontSize: 20, fontWeight: '700', lineHeight: 26 },
  heroDesc: { color: Palette.stone, fontSize: 14, lineHeight: 20 },
  heroFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  heroPrice: { color: Palette.goldDark, fontFamily: 'serif', fontSize: 22, fontWeight: '800' },
  viewBtn: { backgroundColor: Palette.goldDark, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20 },
  viewBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingBottom: 100 },
  gridCard: {
    width: '47%',
    backgroundColor: Palette.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Palette.line,
    overflow: 'hidden',
  },
  gridCardPressed: { opacity: 0.85 },
  gridArt: { height: 110, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  gridEmoji: { fontSize: 48 },
  soldBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: '#8B3B31CC',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  soldBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  gridBody: { padding: 12, gap: 5 },
  miniCatBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  miniCatText: { fontSize: 10, fontWeight: '800' },
  gridTitle: { color: Palette.charcoal, fontSize: 13, fontWeight: '700', lineHeight: 18 },
  gridPrice: { color: Palette.goldDark, fontSize: 15, fontWeight: '800', fontFamily: 'serif' },
  lowStock: { color: Palette.danger, fontSize: 11, fontWeight: '600' },

  emptyCard: { alignItems: 'center', gap: 10, paddingVertical: 40 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { color: Palette.charcoal, fontFamily: 'serif', fontSize: 18, fontWeight: '700' },
});
