import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader, Card, Screen } from '@/components/karma-ui';
import { BrandFonts, Palette } from '@/constants/theme';
import { useSession } from '@/context/auth-context';
import { type ShopItem, apiAddToCart, apiGetProductBookmarkStatus, apiGetShopItemDetail, apiToggleBookmark } from '@/services/api';

function formatPrice(price: string | number, currency: string, qty = 1): string {
  const num = parseFloat(String(price)) * qty;
  if (currency === 'INR') return '₹' + num.toLocaleString('en-IN');
  return '$' + num.toFixed(2);
}

export default function ShopItemDetailScreen() {
  const { session } = useSession();
  const { itemId } = useLocalSearchParams<{ itemId: string }>();

  const [item, setItem] = useState<ShopItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkBusy, setBookmarkBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!session || !itemId) return;
      setLoading(true);
      apiGetShopItemDetail(session, parseInt(itemId, 10)).then((res) => {
        if (res.data) setItem(res.data.item);
        setLoading(false);
      });
      apiGetProductBookmarkStatus(session, parseInt(itemId, 10)).then((res) => {
        setBookmarked(Boolean(res.data?.bookmarked));
      });
    }, [session, itemId])
  );

  const toggleBookmark = async () => {
    if (!session || !item || bookmarkBusy) return;
    setBookmarkBusy(true);
    const res = await apiToggleBookmark(session, 'product', item.id);
    setBookmarkBusy(false);
    if (res.error) Alert.alert('Could not update saved items', res.error);
    else setBookmarked(Boolean(res.data?.bookmarked));
  };

  const handleAddToCart = async () => {
    if (!session || !item) return;
    setAddingToCart(true);
    const res = await apiAddToCart(session, item.id, quantity);
    setAddingToCart(false);
    if (res.error) {
      Alert.alert('Could not add to cart', res.error);
    } else {
      setAddedToCart(true);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <Screen>
          <AppHeader title="Item" back />
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={Palette.gold} size="large" />
          </View>
        </Screen>
      </SafeAreaView>
    );
  }

  if (!item) {
    return (
      <SafeAreaView style={styles.safe}>
        <Screen>
          <AppHeader title="Item" back />
          <Card style={styles.errorCard}>
            <MaterialCommunityIcons name="package-variant-closed" size={44} color={Palette.stoneLight} />
            <Text style={styles.errorTitle}>Item not found</Text>
          </Card>
        </Screen>
      </SafeAreaView>
    );
  }

  const outOfStock = item.stock_quantity === 0;

  return (
    <SafeAreaView style={styles.safe}>
      <Screen>
        <AppHeader
          title={item.category}
          subtitle="Shop"
          back
          action={
            <Pressable onPress={toggleBookmark} style={styles.bookmarkBtn} disabled={bookmarkBusy} accessibilityRole="button" accessibilityLabel={bookmarked ? 'Remove from saved items' : 'Save for later'}>
              <Ionicons name={bookmarked ? 'bookmark' : 'bookmark-outline'} size={20} color={Palette.goldDark} />
            </Pressable>
          }
        />

        {/* Product gallery or no-image placeholder */}
        {item.images.length > 0 ? (
          <Gallery images={item.images} />
        ) : (
          <View style={styles.noImageBanner}>
            <MaterialCommunityIcons name="package-variant-closed" size={56} color={Palette.stoneLight} />
            <Text style={styles.noImageText}>Image not available</Text>
          </View>
        )}

        {/* Info card */}
        <Card style={styles.infoCard}>
          <Text style={styles.categoryEyebrow}>{item.category.toUpperCase()}</Text>
          <Text style={styles.itemTitle}>{item.title}</Text>
          <Text style={styles.itemDesc}>{item.description}</Text>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Price</Text>
            <Text style={styles.priceValue}>{formatPrice(item.price, item.currency)}</Text>
          </View>

          <View style={styles.stockRow}>
            <Ionicons
              name={outOfStock ? 'close-circle-outline' : 'checkmark-circle-outline'}
              size={15}
              color={outOfStock ? Palette.danger : Palette.success}
            />
            <Text style={[styles.stockText, outOfStock && styles.stockTextOut]}>
              {outOfStock ? 'Out of stock' : `${item.stock_quantity} in stock`}
            </Text>
          </View>
        </Card>

        {/* Add to cart card */}
        {!outOfStock && (
          <Card style={styles.checkoutCard}>
            {/* Quantity selector */}
            <View style={styles.qtyRow}>
              <Text style={styles.fieldLabel}>Quantity</Text>
              <View style={styles.qtyControls}>
                <Pressable
                  style={[styles.qtyBtn, quantity <= 1 && styles.qtyBtnDisabled]}
                  onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                >
                  <Text style={styles.qtyBtnText}>−</Text>
                </Pressable>
                <Text style={styles.qtyValue}>{quantity}</Text>
                <Pressable
                  style={[styles.qtyBtn, quantity >= item.stock_quantity && styles.qtyBtnDisabled]}
                  onPress={() => setQuantity((q) => Math.min(item.stock_quantity, q + 1))}
                  disabled={quantity >= item.stock_quantity}
                >
                  <Text style={styles.qtyBtnText}>+</Text>
                </Pressable>
              </View>
            </View>

            {/* Total */}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatPrice(item.price, item.currency, quantity)}</Text>
            </View>

            {/* Add to cart */}
            {addedToCart ? (
              <View style={styles.addedRow}>
                <Ionicons name="checkmark-circle" size={20} color="#059669" />
                <Text style={styles.addedText}>Added to cart!</Text>
              </View>
            ) : (
              <Pressable
                style={[styles.addToCartBtn, addingToCart && styles.btnDisabled]}
                onPress={handleAddToCart}
                disabled={addingToCart}
              >
                {addingToCart ? (
                  <ActivityIndicator color={Palette.goldDark} size="small" />
                ) : (
                  <>
                    <Ionicons name="cart-outline" size={18} color={Palette.goldDark} />
                    <Text style={styles.addToCartBtnText}>Add to Cart</Text>
                  </>
                )}
              </Pressable>
            )}

            {/* Go to cart */}
            <Pressable style={styles.viewCartBtn} onPress={() => router.push('/shop/cart' as any)}>
              <Text style={styles.viewCartBtnText}>View cart</Text>
            </Pressable>
          </Card>
        )}
      </Screen>
    </SafeAreaView>
  );
}

function Gallery({ images }: { images: string[] }) {
  const { width } = useWindowDimensions();
  const slideWidth = Math.min(width, 760) - 32;
  const [index, setIndex] = useState(0);
  const scroller = useRef<ScrollView>(null);
  const go = (i: number) => { setIndex(i); scroller.current?.scrollTo({ x: i * slideWidth, animated: true }); };
  return <View style={{ gap: 10 }}>
    <ScrollView
      ref={scroller}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / slideWidth))}
      style={{ borderRadius: 20 }}
    >
      {images.map((uri) => <Image key={uri} source={{ uri }} style={[styles.productImage, { width: slideWidth, marginBottom: 0 }]} contentFit="cover" />)}
    </ScrollView>
    {images.length > 1 ? (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {images.map((uri, i) => <Pressable key={uri} onPress={() => go(i)} accessibilityRole="button" accessibilityLabel={`Image ${i + 1}`}>
          <Image source={{ uri }} style={[styles.thumb, i === index && styles.thumbActive]} contentFit="cover" />
        </Pressable>)}
      </ScrollView>
    ) : null}
  </View>;
}

const styles = StyleSheet.create({
  bookmarkBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Palette.goldSoft, alignItems: 'center', justifyContent: 'center' },
  thumb: { width: 60, height: 60, borderRadius: 12, borderWidth: 2, borderColor: 'transparent' },
  thumbActive: { borderColor: Palette.gold },
  safe: { flex: 1, backgroundColor: Palette.ivory },
  loadingWrap: { paddingVertical: 60, alignItems: 'center' },

  productImage: { width: '100%', height: 240, borderRadius: 20, marginBottom: 16 },
  noImageBanner: {
    width: '100%', height: 200, borderRadius: 20, marginBottom: 16,
    backgroundColor: Palette.goldSoft, alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  noImageText: { color: Palette.stoneLight, fontSize: 13, fontWeight: '600' },

  infoCard: { gap: 10, marginBottom: 14 },
  categoryEyebrow: { color: Palette.goldDark, fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
  itemTitle: { color: Palette.charcoal, fontFamily: BrandFonts.heading, fontSize: 22, lineHeight: 28 },
  itemDesc: { color: Palette.stone, fontSize: 14, lineHeight: 22 },
  priceRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 10, borderTopWidth: 1, borderTopColor: Palette.line,
  },
  priceLabel: { color: Palette.stone, fontSize: 14, fontWeight: '600' },
  priceValue: { color: Palette.goldDark, fontFamily: BrandFonts.heading, fontSize: 24 },
  stockRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stockText: { color: '#059669', fontSize: 13, fontWeight: '600' },
  stockTextOut: { color: Palette.danger },

  checkoutCard: { gap: 16, marginBottom: 40 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fieldLabel: { color: Palette.charcoal, fontSize: 14, fontWeight: '700' },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  qtyBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: Palette.goldSoft,
    borderWidth: 1, borderColor: Palette.gold, alignItems: 'center', justifyContent: 'center',
  },
  qtyBtnDisabled: { opacity: 0.4 },
  qtyBtnText: { color: Palette.goldDark, fontSize: 18, fontWeight: '700' },
  qtyValue: { color: Palette.charcoal, fontSize: 18, fontWeight: '700', minWidth: 24, textAlign: 'center' },

  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Palette.goldSoft, padding: 14, borderRadius: 14,
  },
  totalLabel: { color: Palette.stone, fontSize: 15, fontWeight: '700' },
  totalValue: { color: Palette.goldDark, fontFamily: BrandFonts.heading, fontSize: 22 },

  addedRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#D1FAE5', borderRadius: 16, paddingVertical: 14,
  },
  addedText: { color: '#065F46', fontSize: 15, fontWeight: '700' },

  addToCartBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Palette.goldSoft, borderWidth: 1, borderColor: Palette.goldDark,
    paddingVertical: 14, borderRadius: 16,
  },
  addToCartBtnText: { color: Palette.goldDark, fontSize: 15, fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },

  viewCartBtn: { alignSelf: 'center', paddingVertical: 4 },
  viewCartBtnText: { color: Palette.goldDark, fontSize: 13, fontWeight: '700' },

  errorCard: { alignItems: 'center', gap: 12, paddingVertical: 40 },
  errorTitle: { color: Palette.charcoal, fontFamily: BrandFonts.heading, fontSize: 18 },
});
