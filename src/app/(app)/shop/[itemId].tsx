import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader, Card, Screen } from '@/components/karma-ui';
import { Palette } from '@/constants/theme';
import { useSession } from '@/context/auth-context';
import {
  type ShopItem,
  apiGetShopItemDetail,
  apiPurchaseShopItem,
} from '@/services/api';

const CATEGORY_META: Record<string, { emoji: string; color: string; tagBg: string }> = {
  Malas:           { emoji: '\uD83D\uDCFF', color: '#7C3AED', tagBg: '#EDE9FE' },
  Incense:         { emoji: '\uD83C\uDF3F', color: '#059669', tagBg: '#D1FAE5' },
  Crystals:        { emoji: '\uD83D\uDC8E', color: '#0EA5E9', tagBg: '#E0F2FE' },
  Texts:           { emoji: '\uD83D\uDCD6', color: '#D97706', tagBg: '#FEF3C7' },
  'Ritual Tools':  { emoji: '\uD83D\uDD14', color: '#C9A24D', tagBg: '#F1E3BE' },
  Apparel:         { emoji: '\uD83E\uDDD8', color: '#E11D48', tagBg: '#FFE4E6' },
};

function getItemMeta(category: string) {
  return CATEGORY_META[category] ?? { emoji: '\u2728', color: '#C9A24D', tagBg: '#F1E3BE' };
}

function formatPrice(price: string | number, currency: string, qty = 1): string {
  const num = parseFloat(String(price)) * qty;
  if (currency === 'INR') return '\u20b9' + num.toLocaleString('en-IN');
  return '$' + num.toFixed(2);
}

export default function ShopItemDetailScreen() {
  const { session } = useSession();
  const { itemId } = useLocalSearchParams<{ itemId: string }>();

  const [item, setItem] = useState<ShopItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [address, setAddress] = useState('');
  const [purchasing, setPurchasing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!session || !itemId) return;
      setLoading(true);
      apiGetShopItemDetail(session, parseInt(itemId, 10)).then((res) => {
        if (res.data) setItem(res.data.item);
        setLoading(false);
      });
    }, [session, itemId])
  );

  const handlePurchase = async () => {
    if (!session || !item) return;
    if (!address.trim()) {
      Alert.alert('Address Required', 'Please enter your shipping address to continue.');
      return;
    }
    if (quantity > item.stock_quantity) {
      Alert.alert('Insufficient Stock', `Only ${item.stock_quantity} units are available.`);
      return;
    }
    setPurchasing(true);
    const res = await apiPurchaseShopItem(session, item.id, quantity, address.trim());
    setPurchasing(false);
    if (res.error) {
      Alert.alert('Order Failed', res.error);
      return;
    }
    Alert.alert(
      'Order Placed!',
      `Your order for "${item.title}" is confirmed. May it serve your spiritual journey.`,
      [
        { text: 'View Orders', onPress: () => router.replace('/shop/orders' as any) },
        { text: 'Continue Shopping', onPress: () => router.back() },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <Screen>
          <AppHeader title="Sacred Item" back />
          <View style={styles.loadingWrap}>
            <ActivityIndicator color="#C9A24D" size="large" />
          </View>
        </Screen>
      </SafeAreaView>
    );
  }

  if (!item) {
    return (
      <SafeAreaView style={styles.safe}>
        <Screen>
          <AppHeader title="Sacred Item" back />
          <Card style={styles.errorCard}>
            <Text style={styles.errorIcon}>🛕</Text>
            <Text style={styles.errorTitle}>Item not found</Text>
          </Card>
        </Screen>
      </SafeAreaView>
    );
  }

  const meta = getItemMeta(item.category);
  const outOfStock = item.stock_quantity === 0;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Screen>
          <AppHeader title={item.category} subtitle="Sacred Item" back />

          <View style={[styles.artBanner, { backgroundColor: meta.color + '18' }]}>
            <Text style={styles.artEmoji}>{meta.emoji}</Text>
            {item.is_featured && (
              <View style={styles.featuredBadge}>
                <Text style={styles.featuredBadgeText}>FEATURED</Text>
              </View>
            )}
            {outOfStock && (
              <View style={styles.soldOutBadge}>
                <Text style={styles.soldOutText}>SOLD OUT</Text>
              </View>
            )}
          </View>

          <Card style={styles.infoCard}>
            <View style={[styles.catBadge, { backgroundColor: meta.tagBg }]}>
              <Text style={[styles.catBadgeText, { color: meta.color }]}>
                {item.category.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemDesc}>{item.description}</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Price per unit</Text>
              <Text style={styles.priceValue}>{formatPrice(item.price, item.currency)}</Text>
            </View>
            <Text style={styles.stockLabel}>
              {outOfStock ? 'Out of stock' : `${item.stock_quantity} in stock`}
            </Text>
          </Card>

          {!outOfStock && (
            <Card style={styles.checkoutCard}>
              <Text style={styles.checkoutTitle}>Place Your Order</Text>

              <View style={styles.qtyRow}>
                <Text style={styles.fieldLabel}>Quantity</Text>
                <View style={styles.qtyControls}>
                  <Pressable style={styles.qtyBtn} onPress={() => setQuantity((q) => Math.max(1, q - 1))}>
                    <Text style={styles.qtyBtnText}>-</Text>
                  </Pressable>
                  <Text style={styles.qtyValue}>{quantity}</Text>
                  <Pressable style={styles.qtyBtn} onPress={() => setQuantity((q) => Math.min(item.stock_quantity, q + 1))}>
                    <Text style={styles.qtyBtnText}>+</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.addressWrap}>
                <Text style={styles.fieldLabel}>Shipping Address</Text>
                <TextInput
                  style={styles.addressInput}
                  placeholder="Enter your full delivery address..."
                  placeholderTextColor="#A79E8B"
                  value={address}
                  onChangeText={setAddress}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{formatPrice(item.price, item.currency, quantity)}</Text>
              </View>

              <Pressable
                style={[styles.buyBtn, purchasing && styles.buyBtnDisabled]}
                onPress={handlePurchase}
                disabled={purchasing}
              >
                {purchasing ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.buyBtnText}>Place Sacred Order</Text>
                )}
              </Pressable>
            </Card>
          )}
        </Screen>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F5ED' },
  loadingWrap: { paddingVertical: 60, alignItems: 'center' },
  artBanner: {
    height: 200, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
    marginBottom: 16, position: 'relative', overflow: 'hidden',
  },
  artEmoji: { fontSize: 88 },
  featuredBadge: {
    position: 'absolute', top: 14, left: 14, backgroundColor: '#A77A1C',
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12,
  },
  featuredBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  soldOutBadge: {
    position: 'absolute', bottom: 14, right: 14, backgroundColor: '#8B3B31CC',
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12,
  },
  soldOutText: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  infoCard: { gap: 10, marginBottom: 14 },
  catBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  catBadgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  itemTitle: { color: '#252525', fontFamily: 'serif', fontSize: 22, fontWeight: '700', lineHeight: 28 },
  itemDesc: { color: '#6F6B63', fontSize: 14, lineHeight: 22 },
  priceRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 10, borderTopWidth: 1, borderTopColor: '#E8D8AE',
  },
  priceLabel: { color: '#6F6B63', fontSize: 14, fontWeight: '600' },
  priceValue: { color: '#A77A1C', fontFamily: 'serif', fontSize: 24, fontWeight: '800' },
  stockLabel: { color: '#6F6B63', fontSize: 13, fontWeight: '600' },
  checkoutCard: { gap: 16, marginBottom: 100 },
  checkoutTitle: { color: '#252525', fontFamily: 'serif', fontSize: 18, fontWeight: '700' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fieldLabel: { color: '#252525', fontSize: 14, fontWeight: '700' },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  qtyBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1E3BE',
    borderWidth: 1, borderColor: '#E8D8AE', alignItems: 'center', justifyContent: 'center',
  },
  qtyBtnText: { color: '#A77A1C', fontSize: 18, fontWeight: '700' },
  qtyValue: { color: '#252525', fontSize: 18, fontWeight: '700', minWidth: 24, textAlign: 'center' },
  addressWrap: { gap: 8 },
  addressInput: {
    borderWidth: 1, borderColor: '#E8D8AE', borderRadius: 14, padding: 12,
    color: '#252525', fontSize: 14, minHeight: 80, backgroundColor: '#FFFFFF',
  },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#F1E3BE', padding: 14, borderRadius: 14,
  },
  totalLabel: { color: '#6F6B63', fontSize: 15, fontWeight: '700' },
  totalValue: { color: '#A77A1C', fontFamily: 'serif', fontSize: 22, fontWeight: '800' },
  buyBtn: {
    backgroundColor: '#A77A1C', paddingVertical: 16, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  buyBtnDisabled: { opacity: 0.6 },
  buyBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  errorCard: { alignItems: 'center', gap: 12, paddingVertical: 40 },
  errorIcon: { fontSize: 48 },
  errorTitle: { color: '#252525', fontFamily: 'serif', fontSize: 18, fontWeight: '700' },
});
