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

import { AppHeader, Card, Screen, SectionTitle } from '@/components/karma-ui';
import { Palette } from '@/constants/theme';
import { useSession } from '@/context/auth-context';
import { type ShopOrder, apiGetShopOrders } from '@/services/api';

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

function formatPrice(price: string, currency: string): string {
  const num = parseFloat(price);
  if (currency === 'INR') return '\u20b9' + num.toLocaleString('en-IN');
  return '$' + num.toFixed(2);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Confirmed: { bg: '#D1FAE5', text: '#059669' },
  Shipped:   { bg: '#E0F2FE', text: '#0EA5E9' },
  Delivered: { bg: '#EDE9FE', text: '#7C3AED' },
  Cancelled: { bg: '#FFE4E6', text: '#E11D48' },
};

export default function ShopOrdersScreen() {
  const { session } = useSession();
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!session) return;
      setLoading(true);
      apiGetShopOrders(session).then((res) => {
        if (res.data) setOrders(res.data.orders);
        setLoading(false);
      });
    }, [session])
  );

  return (
    <SafeAreaView style={styles.safe}>
      <Screen>
        <AppHeader title="My Orders" subtitle="Your sacred purchases" back />

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color="#C9A24D" size="large" />
          </View>
        ) : orders.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyTitle}>No orders yet</Text>
            <Text style={styles.emptySubtitle}>Your sacred purchases will appear here.</Text>
            <Pressable
              style={styles.shopBtn}
              onPress={() => router.replace('/shop' as any)}
            >
              <Text style={styles.shopBtnText}>Browse Divine Shop</Text>
            </Pressable>
          </Card>
        ) : (
          <>
            <SectionTitle>{orders.length} order{orders.length !== 1 ? 's' : ''}</SectionTitle>
            <View style={styles.list}>
              {orders.map((order) => {
                const meta = getItemMeta(order.item_category);
                const statusStyle = STATUS_COLORS[order.status] ?? STATUS_COLORS.Confirmed;
                return (
                  <Card key={order.id} style={styles.orderCard}>
                    <View style={styles.orderHeader}>
                      <View style={[styles.orderArt, { backgroundColor: meta.color + '18' }]}>
                        <Text style={styles.orderEmoji}>{meta.emoji}</Text>
                      </View>
                      <View style={styles.orderInfo}>
                        <Text style={styles.orderTitle} numberOfLines={2}>{order.item_title}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                          <Text style={[styles.statusText, { color: statusStyle.text }]}>{order.status}</Text>
                        </View>
                      </View>
                      <Text style={styles.orderPrice}>{formatPrice(order.total_price, 'INR')}</Text>
                    </View>
                    <View style={styles.orderDetails}>
                      <Text style={styles.orderMeta}>Qty: {order.quantity}  •  {formatDate(order.created_at)}</Text>
                      <Text style={styles.orderAddress} numberOfLines={1}>{order.shipping_address}</Text>
                    </View>
                  </Card>
                );
              })}
            </View>
          </>
        )}
      </Screen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F5ED' },
  loadingWrap: { paddingVertical: 60, alignItems: 'center' },
  emptyCard: { alignItems: 'center', gap: 12, paddingVertical: 48 },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { color: '#252525', fontFamily: 'serif', fontSize: 20, fontWeight: '700' },
  emptySubtitle: { color: '#6F6B63', fontSize: 14, textAlign: 'center' },
  shopBtn: {
    backgroundColor: '#A77A1C', paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 20, marginTop: 8,
  },
  shopBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  list: { gap: 12, paddingBottom: 100 },
  orderCard: { gap: 10 },
  orderHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  orderArt: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  orderEmoji: { fontSize: 26 },
  orderInfo: { flex: 1, gap: 6 },
  orderTitle: { color: '#252525', fontSize: 14, fontWeight: '700', lineHeight: 18 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '800' },
  orderPrice: { color: '#A77A1C', fontFamily: 'serif', fontSize: 16, fontWeight: '800' },
  orderDetails: { borderTopWidth: 1, borderTopColor: '#E8D8AE', paddingTop: 8, gap: 4 },
  orderMeta: { color: '#6F6B63', fontSize: 12, fontWeight: '600' },
  orderAddress: { color: '#A79E8B', fontSize: 12 },
});
