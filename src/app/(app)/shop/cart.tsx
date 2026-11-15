import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
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

import { AppHeader, Card, Screen, SectionTitle, ui } from '@/components/karma-ui';
import RazorpayCheckoutSheet from '@/components/RazorpayCheckoutSheet';
import { Brand, BrandFonts, Palette } from '@/constants/theme';
import { useSession } from '@/context/auth-context';
import {
  type CartItem,
  apiCreateShopPaymentOrder,
  apiGetCart,
  apiRemoveCartItem,
  apiUpdateCartItem,
  resolveMediaUrl,
} from '@/services/api';

const money = (amount: number) =>
  `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export default function CartScreen() {
  const { session, user } = useSession();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyItemId, setBusyItemId] = useState<number | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  // Delivery address fields
  const [fullName, setFullName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState('');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [pin, setPin] = useState('');
  const [country, setCountry] = useState('India');

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

  // Inline confirmation (Alert buttons don't work on web) + real error handling.
  const removeItem = async (item: CartItem) => {
    if (!session) return;
    setConfirmRemoveId(null);
    setBusyItemId(item.id);
    setError('');
    const res = await apiRemoveCartItem(session, item.id);
    setBusyItemId(null);
    if (res.error) {
      setError(`Could not remove ${item.name}: ${res.error}`);
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    // Re-sync with the server so the cart never shows a stale item.
    const fresh = await apiGetCart(session);
    if (fresh.data) setItems(fresh.data.items);
  };

  const validateAddress = (): string | null => {
    if (!fullName.trim() || !phone.trim() || !line1.trim() || !city.trim() || !stateName.trim() || !pin.trim()) {
      return 'Please fill in all required delivery fields.';
    }
    return null;
  };

  const handlePay = () => {
    const err = validateAddress();
    if (err) { Alert.alert('Missing details', err); return; }
    setCheckoutOpen(true);
  };

  const addressStr = [fullName, `Phone: ${phone}`, line1, line2, `${city}, ${stateName} ${pin}`, country]
    .filter(Boolean).join('\n');

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Screen>
          <AppHeader title="Your Cart" back />

          {error !== '' && (
            <Card style={styles.errorCard}>
              <Ionicons name="alert-circle-outline" size={16} color={Palette.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </Card>
          )}

          {loading ? (
            <View style={styles.loadingWrap}><ActivityIndicator color={Palette.gold} size="large" /></View>
          ) : items.length === 0 ? (
            <Card style={styles.emptyCard}>
              <MaterialCommunityIcons name="cart-outline" size={44} color={Palette.stoneLight} />
              <Text style={styles.emptyTitle}>Your cart is empty</Text>
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
                  const busy = busyItemId === item.id;
                  return (
                    <Card key={item.id} style={styles.itemCard}>
                      <View style={styles.itemRow}>
                        {/* Art — real image or icon placeholder */}
                        <View style={styles.itemArt}>
                          {item.image_url ? (
                            <Image
                              source={{ uri: resolveMediaUrl(item.image_url) }}
                              style={{ width: 54, height: 54, borderRadius: 12 }}
                              contentFit="cover"
                            />
                          ) : (
                            <MaterialCommunityIcons name="package-variant-closed" size={26} color={Palette.stoneLight} />
                          )}
                        </View>

                        {/* Info */}
                        <View style={styles.itemInfo}>
                          <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                          <Text style={ui.small}>{money(item.price)} each</Text>
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
                          {confirmRemoveId === item.id ? (
                            <View style={styles.confirmRow}>
                              <Pressable style={styles.keepBtn} onPress={() => setConfirmRemoveId(null)} hitSlop={6} accessibilityRole="button">
                                <Text style={styles.keepText}>Keep</Text>
                              </Pressable>
                              <Pressable style={styles.removeBtn} onPress={() => void removeItem(item)} hitSlop={6} accessibilityRole="button" accessibilityLabel={`Confirm remove ${item.name}`}>
                                <Text style={styles.removeText}>Remove</Text>
                              </Pressable>
                            </View>
                          ) : (
                            <Pressable
                              style={styles.removeBtn}
                              onPress={() => setConfirmRemoveId(item.id)}
                              disabled={busy}
                              hitSlop={8}
                              accessibilityRole="button"
                              accessibilityLabel={`Remove ${item.name}`}
                            >
                              {busy ? (
                                <ActivityIndicator size="small" color={Palette.danger} />
                              ) : (
                                <Ionicons name="trash-outline" size={18} color={Palette.danger} />
                              )}
                            </Pressable>
                          )}
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
                    <Field label="State *" value={stateName} onChange={setStateName} placeholder="State" />
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

              {/* ── Order summary + Pay button ── */}
              <Card style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>{money(subtotal)}</Text>
                </View>
                <View style={[styles.summaryRow, styles.summaryTotal]}>
                  <Text style={styles.summaryTotalLabel}>Total</Text>
                  <Text style={styles.summaryTotalValue}>{money(subtotal)}</Text>
                </View>

                <Pressable style={styles.checkoutBtn} onPress={handlePay}>
                  <Ionicons name="lock-closed-outline" size={16} color={Palette.surface} />
                  <Text style={styles.checkoutBtnText}>Pay {money(subtotal)}</Text>
                </Pressable>
                <Text style={[ui.small, { textAlign: 'center', marginTop: 4 }]}>
                  Secure payment via Razorpay
                </Text>
              </Card>
            </>
          )}
        </Screen>
      </KeyboardAvoidingView>

      {/* ── Razorpay checkout sheet ── */}
      <RazorpayCheckoutSheet
        visible={checkoutOpen}
        amount={subtotal}
        merchantName={Brand.name}
        purpose="Shop order"
        details={[
          { label: 'Items', value: `${items.length} item${items.length !== 1 ? 's' : ''}` },
          { label: 'Delivery to', value: city || 'Your address' },
        ]}
        createOrder={() => apiCreateShopPaymentOrder(session!, addressStr)}
        onPaymentComplete={async () => {
          Alert.alert(
            'Order Placed!',
            'Your payment was successful. May these items support your spiritual journey.',
            [{ text: 'View Orders', onPress: () => router.replace('/shop/orders' as any) }]
          );
        }}
        token={session ?? null}
        onClose={() => setCheckoutOpen(false)}
      />
    </>
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
  loadingWrap: { paddingVertical: 48, alignItems: 'center' },
  errorCard: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2' },
  errorText: { color: Palette.danger, fontSize: 14, flex: 1 },

  emptyCard: { alignItems: 'center', gap: 14, paddingVertical: 48 },
  emptyTitle: { color: Palette.charcoal, fontFamily: BrandFonts.heading, fontSize: 20 },
  shopBtn: {
    backgroundColor: Palette.goldDark, paddingHorizontal: 24,
    paddingVertical: 12, borderRadius: 20, marginTop: 4,
  },
  shopBtnText: { color: Palette.surface, fontSize: 14, fontWeight: '700' },

  itemsList: { gap: 10 },
  itemCard: { gap: 0 },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  itemArt: {
    width: 54, height: 54, borderRadius: 12, backgroundColor: Palette.goldSoft,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden',
  },
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
  itemTotal: { color: Palette.goldDark, fontFamily: BrandFonts.heading, fontSize: 16 },
  removeBtn: { minWidth: 36, minHeight: 36, paddingHorizontal: 10, borderRadius: 10, backgroundColor: Palette.dangerSoft, alignItems: 'center', justifyContent: 'center' },
  removeText: { fontFamily: BrandFonts.bodySemi, fontSize: 13, color: Palette.danger },
  confirmRow: { flexDirection: 'row', gap: 6 },
  keepBtn: { minHeight: 36, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1, borderColor: Palette.line, alignItems: 'center', justifyContent: 'center' },
  keepText: { fontFamily: BrandFonts.bodySemi, fontSize: 13, color: Palette.stone },

  addressCard: { gap: 14 },
  twoCol: { flexDirection: 'row', gap: 10 },
  fieldGroup: { gap: 5 },
  fieldLabel: { color: Palette.charcoal, fontSize: 13, fontWeight: '700' },
  fieldInput: {
    backgroundColor: Palette.ivory, borderRadius: 12, borderWidth: 1,
    borderColor: Palette.line, paddingHorizontal: 12, paddingVertical: 10,
    color: Palette.charcoal, fontSize: 14,
  },

  summaryCard: { gap: 14 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { color: Palette.stone, fontSize: 14 },
  summaryValue: { color: Palette.charcoal, fontSize: 14, fontWeight: '700' },
  summaryTotal: { paddingTop: 12, borderTopWidth: 1, borderTopColor: Palette.line },
  summaryTotalLabel: { color: Palette.charcoal, fontSize: 16, fontWeight: '700' },
  summaryTotalValue: { color: Palette.goldDark, fontFamily: BrandFonts.heading, fontSize: 22 },
  checkoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Palette.charcoal, borderRadius: 16, paddingVertical: 16, marginTop: 4,
  },
  checkoutBtnText: { color: Palette.surface, fontSize: 15, fontWeight: '700' },
});
