import * as WebBrowser from 'expo-web-browser';
import { router, useFocusEffect } from 'expo-router';
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

import { AppHeader, Card, Screen, SectionTitle, ui } from '@/components/karma-ui';
import { Palette } from '@/constants/theme';
import { useSession } from '@/context/auth-context';
import {
  type CartItem,
  BASE_URL as API_BASE_URL,
  apiCreateShopPaymentOrder,
  apiGetCart,
  apiRemoveCartItem,
  apiUpdateCartItem,
  apiVerifyPayment,
} from '@/services/api';

const money = (amount: number) =>
  `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const CATEGORY_EMOJI: Record<string, string> = {
  Malas: '📿', Incense: '🌿', Crystals: '💎', Texts: '📖',
  'Ritual Tools': '🔔', Apparel: '🧘',
};

export default function CartScreen() {
  const { session, user } = useSession();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyItemId, setBusyItemId] = useState<number | null>(null);
  const [error, setError] = useState('');

  // Delivery address fields
  const [fullName, setFullName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState('');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pin, setPin] = useState('');
  const [country, setCountry] = useState('India');
  const [checkingOut, setCheckingOut] = useState(false);

  const loadCart = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    const res = await apiGetCart(session);
    if (res.data) setItems(res.data.items);
    else setError(res.error ?? 'Could not load your cart.');
    setLoading(false);
  }, [session]);

  useFocusEffect(useCallback(() => { loadCart(); }, [loadCart]));

  const changeQty = async (item: CartItem, delta: number) => {
    const next = item.quantity + delta;
    if (next < 1 || next > item.stock) return;
    setBusyItemId(item.id);
    setError('');
    const res = await apiUpdateCartItem(session!, item.id, next);
    if (res.error) setError(res.error);
    else setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, quantity: next } : i));
    setBusyItemId(null);
  };

  const removeItem = (item: CartItem) => {
    Alert.alert('Remove item', `Remove "${item.name}" from your cart?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          setBusyItemId(item.id);
          await apiRemoveCartItem(session!, item.id);
          setItems((prev) => prev.filter((i) => i.id !== item.id));
          setBusyItemId(null);
        },
      },
    ]);
  };

  const handleCheckout = async () => {
    if (!session || items.length === 0) return;
    if (!fullName.trim() || !phone.trim() || !line1.trim() || !city.trim() || !state.trim() || !pin.trim()) {
      Alert.alert('Missing details', 'Please fill in all required delivery fields.');
      return;
    }
    const addressStr = [fullName, `Phone: ${phone}`, line1, line2, `${city}, ${state} ${pin}`, country]
      .filter(Boolean).join('\n');

    setCheckingOut(true);
    setError('');

    // Step 1 — create a Razorpay gateway order on the backend
    const orderRes = await apiCreateShopPaymentOrder(session, addressStr);
    if (orderRes.error) {
      setError(orderRes.error);
      setCheckingOut(false);
      return;
    }

    const { keyId, orderId, amount, currency } = orderRes.data!.order;

    // Step 2 — open the backend-hosted Razorpay checkout page in a browser session
    // The checkout page lives at /api/payments/checkout-page?... and returns
    // razorpay_order_id, razorpay_payment_id, razorpay_signature via deep-link
    // callback back to the app.  While waiting, we block the UI.
    const checkoutUrl =
      `${API_BASE_URL}/api/payments/checkout-page` +
      `?key_id=${encodeURIComponent(keyId)}` +
      `&order_id=${encodeURIComponent(orderId)}` +
      `&amount=${encodeURIComponent(String(amount))}` +
      `&currency=${encodeURIComponent(currency)}` +
      `&name=${encodeURIComponent(fullName)}` +
      `&return_url=${encodeURIComponent('integratedspiritualapp://payment-callback')}`;

    const result = await WebBrowser.openAuthSessionAsync(checkoutUrl, 'integratedspiritualapp://payment-callback');

    if (result.type !== 'success' || !result.url) {
      // User cancelled or browser was closed without completing payment
      setError('Payment was cancelled. Your cart has been saved — tap "Pay" to try again.');
      setCheckingOut(false);
      return;
    }

    // Step 3 — extract Razorpay params from the callback URL
    let callbackParams: Record<string, string> = {};
    try {
      const callbackUrl = new URL(result.url);
      callbackParams = Object.fromEntries(callbackUrl.searchParams.entries());
    } catch {
      setError('Could not read payment response. Please contact support if your payment was deducted.');
      setCheckingOut(false);
      return;
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = callbackParams;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      setError('Payment response was incomplete. Please contact support if your payment was deducted.');
      setCheckingOut(false);
      return;
    }

    // Step 4 — verify the payment on the backend (this also creates the order)
    const verifyRes = await apiVerifyPayment(session, {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    setCheckingOut(false);

    if (verifyRes.error) {
      setError(verifyRes.error);
      return;
    }

    Alert.alert(
      'Order Placed! 🙏',
      'Your payment was successful. May these items support your spiritual journey.',
      [{ text: 'View Orders', onPress: () => router.replace('/shop/orders' as any) }]
    );
  };

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Screen>
          <AppHeader title="Your Cart" subtitle="Review your items and add delivery details." back />

          {error !== '' && (
            <Card style={styles.errorCard}><Text style={styles.errorText}>{error}</Text></Card>
          )}

          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={Palette.gold} size="large" />
            </View>
          ) : items.length === 0 ? (
            /* ── Empty cart ── */
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyTitle}>Your cart is waiting</Text>
              <Text style={[ui.small, { textAlign: 'center' }]}>
                Add something from the shop and it will appear here.
              </Text>
              <Pressable style={styles.shopBtn} onPress={() => router.push('/shop' as any)}>
                <Text style={styles.shopBtnText}>Continue shopping</Text>
              </Pressable>
            </Card>
          ) : (
            <>
              {/* ── Cart items ── */}
              <SectionTitle>
                {`Your selection · ${items.length} ${items.length === 1 ? 'item' : 'items'}`}
              </SectionTitle>

              <View style={styles.itemsList}>
                {items.map((item) => {
                  const emoji = CATEGORY_EMOJI[item.name] ?? '✨';
                  const busy = busyItemId === item.id;
                  return (
                    <Card key={item.id} style={styles.itemCard}>
                      <View style={styles.itemRow}>
                        {/* Art */}
                        <View style={styles.itemArt}>
                          <Text style={styles.itemEmoji}>{emoji}</Text>
                        </View>

                        {/* Info */}
                        <View style={styles.itemInfo}>
                          <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                          <Text style={ui.small}>{money(item.price)} each</Text>

                          {/* Quantity control */}
                          <View style={styles.qtyRow}>
                            <Pressable
                              style={[styles.qtyBtn, (item.quantity <= 1 || busy) && styles.qtyBtnDisabled]}
                              onPress={() => changeQty(item, -1)}
                              disabled={item.quantity <= 1 || busy}
                            >
                              <Text style={styles.qtyBtnText}>−</Text>
                            </Pressable>
                            <Text style={styles.qtyValue}>{item.quantity}</Text>
                            <Pressable
                              style={[styles.qtyBtn, (item.quantity >= item.stock || busy) && styles.qtyBtnDisabled]}
                              onPress={() => changeQty(item, 1)}
                              disabled={item.quantity >= item.stock || busy}
                            >
                              <Text style={styles.qtyBtnText}>+</Text>
                            </Pressable>
                          </View>
                        </View>

                        {/* Price + remove */}
                        <View style={styles.itemSide}>
                          <Text style={styles.itemTotal}>{money(item.price * item.quantity)}</Text>
                          <Pressable
                            style={styles.removeBtn}
                            onPress={() => removeItem(item)}
                            disabled={busy}
                          >
                            {busy ? (
                              <ActivityIndicator size="small" color={Palette.danger} />
                            ) : (
                              <Text style={styles.removeBtnText}>🗑 Remove</Text>
                            )}
                          </Pressable>
                        </View>
                      </View>
                    </Card>
                  );
                })}
              </View>

              {/* ── Delivery address ── */}
              <SectionTitle>Delivery details</SectionTitle>
              <Card style={styles.addressCard}>
                <Field label="Full name *" value={fullName} onChange={setFullName} placeholder="Your full name" />
                <Field label="Phone number *" value={phone} onChange={setPhone} placeholder="+91 ..." keyboardType="phone-pad" />
                <Field label="Address line 1 *" value={line1} onChange={setLine1} placeholder="House number, street, area" />
                <Field label="Address line 2" value={line2} onChange={setLine2} placeholder="Landmark, apartment (optional)" />
                <View style={styles.twoCol}>
                  <View style={{ flex: 1 }}>
                    <Field label="City *" value={city} onChange={setCity} placeholder="City" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Field label="State *" value={state} onChange={setState} placeholder="State" />
                  </View>
                </View>
                <View style={styles.twoCol}>
                  <View style={{ flex: 1 }}>
                    <Field label="PIN code *" value={pin} onChange={(v) => setPin(v.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit PIN" keyboardType="numeric" maxLength={6} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Field label="Country *" value={country} onChange={setCountry} placeholder="Country" />
                  </View>
                </View>
              </Card>

              {/* ── Order summary ── */}
              <Card style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>{money(subtotal)}</Text>
                </View>
                <View style={[styles.summaryRow, styles.summaryTotal]}>
                  <Text style={styles.summaryTotalLabel}>Total</Text>
                  <Text style={styles.summaryTotalValue}>{money(subtotal)}</Text>
                </View>

                <Pressable
                  style={[styles.checkoutBtn, checkingOut && styles.checkoutBtnDisabled]}
                  onPress={handleCheckout}
                  disabled={checkingOut}
                >
                  {checkingOut ? (
                    <ActivityIndicator color={Palette.surface} />
                  ) : (
                    <Text style={styles.checkoutBtnText}>Pay ₹{subtotal.toLocaleString('en-IN')}</Text>
                  )}
                </Pressable>
                <Text style={[ui.small, { textAlign: 'center', marginTop: 4 }]}>
                  🔒 Secure payment via Razorpay
                </Text>
              </Card>
            </>
          )}
        </Screen>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label, value, onChange, placeholder, keyboardType, maxLength,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; keyboardType?: any; maxLength?: number;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={Palette.stoneLight}
        keyboardType={keyboardType ?? 'default'}
        maxLength={maxLength}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.ivory },
  loadingWrap: { paddingVertical: 48, alignItems: 'center' },
  errorCard: { backgroundColor: Palette.blush },
  errorText: { color: Palette.danger, fontSize: 14 },

  emptyCard: { alignItems: 'center', gap: 14, paddingVertical: 48 },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { color: Palette.charcoal, fontFamily: 'serif', fontSize: 20, fontWeight: '700' },
  shopBtn: {
    backgroundColor: Palette.goldDark, paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 20, marginTop: 4,
  },
  shopBtnText: { color: Palette.surface, fontSize: 14, fontWeight: '700' },

  // Items
  itemsList: { gap: 10 },
  itemCard: { gap: 0 },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  itemArt: {
    width: 54, height: 54, borderRadius: 14, backgroundColor: Palette.goldSoft,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  itemEmoji: { fontSize: 26 },
  itemInfo: { flex: 1, gap: 5 },
  itemName: { color: Palette.charcoal, fontSize: 14, fontWeight: '700', lineHeight: 18 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 2 },
  qtyBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: Palette.goldSoft,
    borderWidth: 1, borderColor: Palette.gold, alignItems: 'center', justifyContent: 'center',
  },
  qtyBtnDisabled: { opacity: 0.4 },
  qtyBtnText: { color: Palette.goldDark, fontSize: 18, fontWeight: '700' },
  qtyValue: { color: Palette.charcoal, fontSize: 16, fontWeight: '700', minWidth: 24, textAlign: 'center' },
  itemSide: { alignItems: 'flex-end', gap: 8, flexShrink: 0 },
  itemTotal: { color: Palette.goldDark, fontFamily: 'serif', fontSize: 16, fontWeight: '800' },
  removeBtn: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 10, backgroundColor: '#FEE2E2' },
  removeBtnText: { color: Palette.danger, fontSize: 12, fontWeight: '700' },

  // Address
  addressCard: { gap: 14 },
  twoCol: { flexDirection: 'row', gap: 10 },
  fieldGroup: { gap: 5 },
  fieldLabel: { color: Palette.charcoal, fontSize: 13, fontWeight: '700' },
  fieldInput: {
    backgroundColor: Palette.ivory, borderRadius: 12, borderWidth: 1,
    borderColor: Palette.line, paddingHorizontal: 12, paddingVertical: 10,
    color: Palette.charcoal, fontSize: 14,
  },

  // Summary
  summaryCard: { gap: 14 },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  summaryLabel: { color: Palette.stone, fontSize: 14 },
  summaryValue: { color: Palette.charcoal, fontSize: 14, fontWeight: '700' },
  summaryTotal: {
    paddingTop: 12, borderTopWidth: 1, borderTopColor: Palette.line,
  },
  summaryTotalLabel: { color: Palette.charcoal, fontSize: 16, fontWeight: '700' },
  summaryTotalValue: {
    color: Palette.goldDark, fontFamily: 'serif', fontSize: 22, fontWeight: '800',
  },
  checkoutBtn: {
    backgroundColor: Palette.charcoal, borderRadius: 16, paddingVertical: 16,
    alignItems: 'center', marginTop: 4,
  },
  checkoutBtnDisabled: { opacity: 0.6 },
  checkoutBtnText: { color: Palette.surface, fontSize: 15, fontWeight: '700' },
});
