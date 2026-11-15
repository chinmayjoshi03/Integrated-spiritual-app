import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
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

import { AppHeader, Card, Screen, SearchField, SectionTitle, ui } from '@/components/karma-ui';
import { BrandFonts, Palette } from '@/constants/theme';
import { useSession } from '@/context/auth-context';
import { type ShopItem, apiGetCart, apiGetShopItems, resolveMediaUrl } from '@/services/api';


function formatPrice(price: string, currency: string): string {
  const num = parseFloat(price);
  if (currency === 'INR') return '₹' + num.toLocaleString('en-IN');
  return '$' + num.toFixed(2);
}

export default function DivineShopScreen() {
  const { session } = useSession();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const [search, setSearch] = useState('');

  const fetchItems = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    const [shopRes, cartRes] = await Promise.allSettled([
      apiGetShopItems(session),
      apiGetCart(session),
    ]);
    if (shopRes.status === 'fulfilled' && shopRes.value.data)
      setItems(shopRes.value.data.items);
    if (cartRes.status === 'fulfilled' && cartRes.value.data)
      setCartCount(cartRes.value.data.items.reduce((s, i) => s + i.quantity, 0));
    setLoading(false);
  }, [session]);

  useFocusEffect(useCallback(() => { fetchItems(); }, [fetchItems]));

  const q = search.trim().toLowerCase();
  const visible = q
    ? items.filter((i) => `${i.title} ${i.description} ${i.category}`.toLowerCase().includes(q))
    : items;
  const featured = q ? null : (visible.find((i) => i.is_featured) ?? visible[0] ?? null);
  const gridItems = visible.filter((i) => i.id !== featured?.id);

  return (
    <SafeAreaView style={styles.safe}>
      <Screen>
        <AppHeader
          title="Shop"
         
          back
          action={
            <Pressable style={styles.cartBtn} onPress={() => router.push('/shop/cart' as any)}>
              <Ionicons name="cart-outline" size={22} color={Palette.charcoal} />
              {cartCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartCount > 9 ? '9+' : String(cartCount)}</Text>
                </View>
              )}
            </Pressable>
          }
        />

        <SearchField value={search} onChangeText={setSearch} placeholder="Search products" />

        {loading ? (
          <View style={styles.loadingWrap}><ActivityIndicator color={Palette.gold} size="large" /></View>
        ) : visible.length === 0 ? (
          <Card style={styles.emptyCard}>
            <MaterialCommunityIcons name="package-variant-closed" size={44} color={Palette.stoneLight} />
            <Text style={styles.emptyTitle}>{q ? 'No products match your search' : 'No products yet'}</Text>
            <Text style={[ui.small, { textAlign: 'center' }]}>Check back soon for new arrivals.</Text>
          </Card>
        ) : (
          <>
            {/* Featured hero */}
            {featured && (
              <>
                <SectionTitle>Featured Sacred Item</SectionTitle>
                <Pressable onPress={() => router.push((`/shop/${featured.id}`) as any)}>
                  <Card style={styles.heroCard}>
                    <ProductImage url={featured.image_url} height={160} />
                    {featured.is_featured && (
                      <View style={styles.featuredBadge}>
                        <Text style={styles.featuredBadgeText}>FEATURED</Text>
                      </View>
                    )}
                    <View style={styles.heroBody}>
                      <Text style={styles.heroCategory}>{featured.category.toUpperCase()}</Text>
                      <Text style={styles.heroTitle}>{featured.title}</Text>
                      <Text style={styles.heroDesc} numberOfLines={2}>{featured.description}</Text>
                      <View style={styles.heroFooter}>
                        <Text style={styles.heroPrice}>{formatPrice(featured.price, featured.currency)}</Text>
                        <View style={styles.viewBtn}>
                          <Text style={styles.viewBtnText}>View item</Text>
                        </View>
                      </View>
                    </View>
                  </Card>
                </Pressable>
              </>
            )}

            {/* Grid */}
            <SectionTitle>{q ? 'Search results' : 'All products'}</SectionTitle>
            <View style={styles.grid}>
              {gridItems.map((item) => (
                <ShopItemCard key={item.id} item={item} />
              ))}
            </View>
          </>
        )}
      </Screen>
    </SafeAreaView>
  );
}

/** Renders product image if available, otherwise a "Not available" placeholder matching the website. */
function ProductImage({ url, height }: { url?: string; height: number }) {
  if (url) {
    return (
      <Image
        source={{ uri: resolveMediaUrl(url) }}
        style={{ width: '100%', height, backgroundColor: Palette.goldSoft }}
        contentFit="cover"
      />
    );
  }
  return (
    <View style={[styles.noImageWrap, { height }]}>
      <MaterialCommunityIcons name="package-variant-closed" size={36} color={Palette.stoneLight} />
      <Text style={styles.noImageText}>Image not available</Text>
    </View>
  );
}

function ShopItemCard({ item }: { item: ShopItem }) {
  const outOfStock = item.stock_quantity === 0;
  return (
    <Pressable
      onPress={() => router.push((`/shop/${item.id}`) as any)}
      style={({ pressed }) => [styles.gridCard, pressed && { opacity: 0.85 }]}
    >
      <View style={styles.gridArtWrap}>
        <ProductImage url={item.image_url} height={110} />
        {outOfStock && (
          <View style={styles.soldBadge}>
            <Text style={styles.soldBadgeText}>Sold Out</Text>
          </View>
        )}
      </View>
      <View style={styles.gridBody}>
        <Text style={styles.gridCategory}>{item.category}</Text>
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

  cartBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: Palette.surface,
    borderWidth: 1, borderColor: Palette.line, alignItems: 'center', justifyContent: 'center',
  },
  cartBadge: {
    position: 'absolute', top: 4, right: 4, minWidth: 16, height: 16,
    borderRadius: 8, backgroundColor: Palette.goldDark,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  cartBadgeText: { color: Palette.surface, fontSize: 9, fontWeight: '800' },

  ordersBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-end', backgroundColor: Palette.goldSoft,
    borderWidth: 1, borderColor: Palette.line, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8, marginBottom: 4,
  },
  ordersBtnText: { color: Palette.goldDark, fontSize: 13, fontWeight: '700' },

  catBar: { flexDirection: 'row', gap: 8, paddingVertical: 10 },
  catPill: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.line,
  },
  catPillActive: { backgroundColor: Palette.goldDark, borderColor: Palette.goldDark },
  catText: { color: Palette.charcoal, fontSize: 13, fontWeight: '600' },
  catTextActive: { color: Palette.surface, fontWeight: '700' },

  // Hero card
  heroCard: { gap: 0, padding: 0, overflow: 'hidden', marginBottom: 8, position: 'relative' },
  featuredBadge: {
    position: 'absolute', top: 12, left: 12, zIndex: 1,
    backgroundColor: Palette.goldDark, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  featuredBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  heroBody: { padding: 16, gap: 6 },
  heroCategory: { color: Palette.goldDark, fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
  heroTitle: { color: Palette.charcoal, fontFamily: BrandFonts.heading, fontSize: 20 },
  heroDesc: { color: Palette.stone, fontSize: 14, lineHeight: 20 },
  heroFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  heroPrice: { color: Palette.goldDark, fontFamily: BrandFonts.heading, fontSize: 22 },
  viewBtn: { backgroundColor: Palette.goldDark, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20 },
  viewBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },

  // Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingBottom: 100 },
  gridCard: {
    width: '47%', backgroundColor: Palette.surface,
    borderRadius: 20, borderWidth: 1, borderColor: Palette.line, overflow: 'hidden',
  },
  gridArtWrap: { position: 'relative' },
  soldBadge: {
    position: 'absolute', bottom: 6, right: 6,
    backgroundColor: 'rgba(139,59,49,0.85)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8,
  },
  soldBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  gridBody: { padding: 12, gap: 4 },
  gridCategory: { color: Palette.goldDark, fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  gridTitle: { color: Palette.charcoal, fontSize: 13, fontWeight: '700', lineHeight: 18 },
  gridPrice: { color: Palette.goldDark, fontSize: 15, fontWeight: '800', fontFamily: BrandFonts.heading },
  lowStock: { color: Palette.danger, fontSize: 11, fontWeight: '600' },

  // No-image placeholder
  noImageWrap: {
    width: '100%', backgroundColor: Palette.goldSoft,
    alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  noImageText: { color: Palette.stoneLight, fontSize: 12, fontWeight: '600' },

  // Empty
  emptyCard: { alignItems: 'center', gap: 10, paddingVertical: 40 },
  emptyTitle: { color: Palette.charcoal, fontFamily: BrandFonts.heading, fontSize: 18 },
});
