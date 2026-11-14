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

function money(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatDate(iso: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  paid:      { bg: '#D1FAE5', text: '#059669' },
  Confirmed: { bg: '#D1FAE5', text: '#059669' },
  Shipped:   { bg: '#E0F2FE', text: '#0EA5E9' },
  Delivered: { bg: '#EDE9FE', text: '#7C3AED' },
  Cancelled: { bg: '#FFE4E6', text: '#E11D48' },
};

export default function ShopOrdersScreen() {
  const { session } = useSession();
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

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
            <ActivityIndicator color={Palette.gold} size="large" />
          </View>
        ) : orders.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyTitle}>No orders yet</Text>
            <Text style={styles.emptySubtitle}>Your sacred purchases will appear here.</Text>
            <Pressable style={styles.shopBtn} onPress={() => router.replace('/shop' as any)}>
              <Text style={styles.shopBtnText}>Browse Divine Shop</Text>
            </Pressable>
          </Card>
        ) : (
          <>
            <SectionTitle>{`${orders.length} order${orders.length !== 1 ? 's' : ''}`}</SectionTitle>
            <View style={styles.list}>
              {orders.map((order) => {
                const statusKey = order.status ?? 'paid';
                const statusStyle = STATUS_COLORS[statusKey] ?? STATUS_COLORS.paid;
                const isExpanded = expandedId === order.id;
                const items = order.order_items ?? [];
                const itemCount = items.reduce((s, i) => s + i.quantity, 0);

                return (
                  <Pressable key={order.id} onPress={() => setExpandedId(isExpanded ? null : order.id)}>
                    <Card style={styles.orderCard}>
                      {/* ── Order header ── */}
                      <View style={styles.orderHeader}>
                        <View style={styles.orderHeaderLeft}>
                          <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>
                          <Text style={styles.orderMeta}>
                            {itemCount} item{itemCount !== 1 ? 's' : ''} · {money(order.total_price)}
                          </Text>
                        </View>
                        <View style={styles.orderHeaderRight}>
                          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                            <Text style={[styles.statusText, { color: statusStyle.text }]}>
                              {statusKey === 'paid' ? 'Confirmed' : statusKey}
                            </Text>
                          </View>
                          <Text style={styles.chevron}>{isExpanded ? '▲' : '▼'}</Text>
                        </View>
                      </View>

                      {/* ── Item thumbnail strip (collapsed preview) ── */}
                      {!isExpanded && items.length > 0 && (
                        <View style={styles.thumbStrip}>
                          {items.slice(0, 3).map((item, idx) => (
                            <View key={idx} style={styles.thumbBox}>
                              <Text style={styles.thumbEmoji}>✨</Text>
                            </View>
                          ))}
                          {items.length > 3 && (
                            <View style={[styles.thumbBox, styles.thumbMore]}>
                              <Text style={styles.thumbMoreText}>+{items.length - 3}</Text>
                            </View>
                          )}
                          <Text style={styles.thumbLabel} numberOfLines={1}>
                            {items[0]?.product_name ?? order.item_title}
                            {items.length > 1 ? ` + ${items.length - 1} more` : ''}
                          </Text>
                        </View>
                      )}

                      {/* ── Expanded: full item list ── */}
                      {isExpanded && (
                        <View style={styles.expandedBody}>
                          {items.map((item, idx) => (
                            <View key={idx} style={styles.itemRow}>
                              <View style={styles.itemThumb}>
                                <Text style={styles.thumbEmoji}>✨</Text>
                              </View>
                              <View style={styles.itemInfo}>
                                <Text style={styles.itemName} numberOfLines={2}>
                                  {item.product_name}
                                </Text>
                                <Text style={styles.itemMeta}>
                                  {money(item.price_at_purchase)} × {item.quantity}
                                </Text>
                              </View>
                              <Text style={styles.itemLineTotal}>
                                {money(item.price_at_purchase * item.quantity)}
                              </Text>
                            </View>
                          ))}

                          {/* Total */}
                          <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.totalValue}>{money(order.total_price)}</Text>
                          </View>

                          {/* Shipping address */}
                          {!!order.shipping_address && (
                            <View style={styles.addressBlock}>
                              <Text style={styles.addressLabel}>Delivery address</Text>
                              <Text style={styles.addressText}>{order.shipping_address}</Text>
                            </View>
                          )}
                        </View>
                      )}
                    </Card>
                  </Pressable>
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
  safe: { flex: 1, backgroundColor: Palette.ivory },
  loadingWrap: { paddingVertical: 60, alignItems: 'center' },

  emptyCard: { alignItems: 'center', gap: 12, paddingVertical: 48 },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { color: Palette.charcoal, fontFamily: 'serif', fontSize: 20, fontWeight: '700' },
  emptySubtitle: { color: Palette.stone, fontSize: 14, textAlign: 'center' },
  shopBtn: {
    backgroundColor: Palette.goldDark, paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 20, marginTop: 8,
  },
  shopBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },

  list: { gap: 12, paddingBottom: 100 },

  orderCard: { gap: 10 },
  orderHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  orderHeaderLeft: { gap: 2 },
  orderDate: { color: Palette.charcoal, fontSize: 14, fontWeight: '700' },
  orderMeta: { color: Palette.stone, fontSize: 12 },
  orderHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '800' },
  chevron: { color: Palette.stoneLight, fontSize: 12 },

  // Thumbnail strip (collapsed)
  thumbStrip: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  thumbBox: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: Palette.goldSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  thumbMore: { backgroundColor: Palette.line },
  thumbMoreText: { color: Palette.stone, fontSize: 11, fontWeight: '700' },
  thumbEmoji: { fontSize: 18 },
  thumbLabel: { flex: 1, color: Palette.stone, fontSize: 12 },

  // Expanded body
  expandedBody: { gap: 10, borderTopWidth: 1, borderTopColor: Palette.line, paddingTop: 10 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemThumb: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: Palette.goldSoft,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  itemInfo: { flex: 1, gap: 2 },
  itemName: { color: Palette.charcoal, fontSize: 13, fontWeight: '600' },
  itemMeta: { color: Palette.stone, fontSize: 12 },
  itemLineTotal: { color: Palette.goldDark, fontSize: 13, fontWeight: '700', flexShrink: 0 },

  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 8, borderTopWidth: 1, borderTopColor: Palette.line,
  },
  totalLabel: { color: Palette.charcoal, fontSize: 14, fontWeight: '700' },
  totalValue: { color: Palette.goldDark, fontFamily: 'serif', fontSize: 18, fontWeight: '800' },

  addressBlock: { gap: 3 },
  addressLabel: { color: Palette.stone, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  addressText: { color: Palette.charcoal, fontSize: 12, lineHeight: 18 },
});
