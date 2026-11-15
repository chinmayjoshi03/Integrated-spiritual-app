/**
 * RazorpayCheckoutSheet
 *
 * A reusable bottom-sheet modal that mirrors the website's RazorpayCheckoutPreview:
 *   1. Shows merchant name, purpose, amount, and order details.
 *   2. User taps "Continue to pay" → creates the gateway order → opens the
 *      backend /api/payments/checkout-page via expo-web-browser.
 *   3. After the browser returns, the app verifies the payment with the backend.
 *   4. On success, calls `onPaymentComplete(verified)`.
 *
 * Usage (course enrollment):
 *   <RazorpayCheckoutSheet
 *     visible={checkoutOpen}
 *     amount={Number(course.price)}
 *     merchantName="The Karm Vajra"
 *     purpose="Course enrollment"
 *     details={[
 *       { label: 'Course',     value: course.title },
 *       { label: 'Instructor', value: course.mentor_name ?? 'TBA' },
 *     ]}
 *     createOrder={() => apiCreateCoursePaymentOrder(session, courseId)}
 *     onPaymentComplete={(verified) => { setEnrolled(true); reload(); }}
 *     onClose={() => setCheckoutOpen(false)}
 *   />
 */

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Palette } from '@/constants/theme';
import {
  BASE_URL,
  type RazorpayOrder,
  type VerifiedPayment,
  apiVerifyPayment,
} from '@/services/api';

export interface CheckoutDetail {
  label: string;
  value: string;
}

export interface RazorpayCheckoutSheetProps {
  visible: boolean;
  /** Display amount in rupees (e.g. 799) */
  amount: number;
  merchantName: string;
  /** Short description shown under merchant name, e.g. "Course enrollment" */
  purpose: string;
  /** Key-value rows shown in the detail section (Course, Instructor, etc.) */
  details?: CheckoutDetail[];
  /** Called when the sheet should open — must return { order: RazorpayOrder } or throw */
  createOrder: () => Promise<{ data?: { order: RazorpayOrder }; error?: string }>;
  /** Called after the backend verifies and fulfils the payment */
  onPaymentComplete?: (payment: VerifiedPayment) => void | Promise<void>;
  /** Auth token for the verify call (pass null for guest) */
  token: string | null;
  onClose: () => void;
  /** Text shown on the button while processing */
  processingLabel?: string;
}

/** Parse `?a=1&b=2` from a deep-link URL (the URL polyfill on Hermes is incomplete). */
function parseQuery(url: string): Record<string, string> {
  const query = url.split('?')[1]?.split('#')[0] ?? '';
  const out: Record<string, string> = {};
  for (const part of query.split('&')) {
    if (!part) continue;
    const [k, ...rest] = part.split('=');
    out[decodeURIComponent(k)] = decodeURIComponent(rest.join('=').replace(/\+/g, ' '));
  }
  return out;
}

const money = (value: number) =>
  `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export default function RazorpayCheckoutSheet({
  visible,
  amount,
  merchantName,
  purpose,
  details = [],
  createOrder,
  onPaymentComplete,
  token,
  onClose,
  processingLabel,
}: RazorpayCheckoutSheetProps) {
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  // If Razorpay returns a response but /verify fails, we keep the response so the
  // user can retry verification without paying again (matches website behaviour).
  const [pendingVerification, setPendingVerification] = useState<{
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  } | null>(null);

  const reset = () => {
    setStarting(false);
    setError('');
    setPendingVerification(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const confirmPayment = async (params: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => {
    setStarting(true);
    setError('');
    const res = await apiVerifyPayment(token, params);
    if (res.error || !res.data) {
      // Keep pending so the user can retry without paying again
      setPendingVerification(params);
      setError(res.error ?? 'Payment was received but order confirmation failed. Tap "Retry" before paying again.');
      setStarting(false);
      return;
    }
    setStarting(false);
    reset();
    await onPaymentComplete?.(res.data);
    onClose();
  };

  const startPayment = async () => {
    if (starting) return;
    setStarting(true);
    setError('');

    // 1. Create gateway order
    let order: RazorpayOrder;
    try {
      const res = await createOrder();
      if (res.error || !res.data?.order) {
        setError(res.error ?? 'Could not start the payment. Please try again.');
        setStarting(false);
        return;
      }
      order = res.data.order;
    } catch (e: any) {
      setError(e?.message ?? 'Could not start the payment. Please try again.');
      setStarting(false);
      return;
    }

    // 2. Open the backend checkout-page (self-contained Razorpay HTML page)
    //    It redirects to return_url with payment params appended.
    const returnUrl = 'integratedspiritualapp://payment-callback';
    const checkoutUrl =
      `${BASE_URL}/api/payments/checkout-page` +
      `?key_id=${encodeURIComponent(order.keyId)}` +
      `&order_id=${encodeURIComponent(order.orderId)}` +
      `&amount=${encodeURIComponent(String(order.amount))}` +
      `&currency=${encodeURIComponent(order.currency)}` +
      `&name=${encodeURIComponent(merchantName)}` +
      `&return_url=${encodeURIComponent(returnUrl)}`;

    const result = await WebBrowser.openAuthSessionAsync(checkoutUrl, returnUrl);

    if (result.type !== 'success' || !result.url) {
      // User cancelled or browser closed
      setError('');
      setStarting(false);
      return;
    }

    // 3. Parse callback params from the deep-link URL
    let callbackParams: Record<string, string> = {};
    try {
      callbackParams = parseQuery(result.url);
    } catch {
      setError('Could not read payment response. Contact support if payment was deducted.');
      setStarting(false);
      return;
    }

    if (callbackParams.cancelled === '1') {
      setError('');
      setStarting(false);
      return;
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = callbackParams;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      setError('Payment response was incomplete. Contact support if payment was deducted.');
      setStarting(false);
      return;
    }

    // 4. Verify with the backend
    await confirmPayment({ razorpay_order_id, razorpay_payment_id, razorpay_signature });
  };

  if (!visible) return null;

  const displayAmount = amount > 0 ? amount : null;
  const isProcessing = starting;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      {/* Backdrop — tap outside to close */}
      <Pressable style={styles.backdrop} onPress={handleClose}>
        {/* Sheet — stop propagation */}
        <Pressable style={styles.sheet} onPress={() => {}}>

          {/* ── Header ── */}
          <View style={styles.header}>
            <View>
              <Text style={styles.brandName}>Razorpay</Text>
              <Text style={styles.brandSub}>Secure checkout</Text>
            </View>
            <Pressable onPress={handleClose} style={styles.closeBtn} hitSlop={12}>
              <Ionicons name="close" size={20} color={Palette.stone} />
            </Pressable>
          </View>

          {/* ── Merchant row ── */}
          <View style={styles.merchantRow}>
            <View style={styles.merchantIcon}>
              <MaterialCommunityIcons name="credit-card-outline" size={19} color={Palette.goldDark} />
            </View>
            <View style={styles.merchantInfo}>
              <Text style={styles.merchantName}>{merchantName}</Text>
              <Text style={styles.merchantPurpose}>{purpose}</Text>
            </View>
            <Text style={styles.merchantAmount}>
              {displayAmount === null ? '—' : money(displayAmount)}
            </Text>
          </View>

          {/* ── Details ── */}
          {details.length > 0 && (
            <View style={styles.detailsBlock}>
              {details.map((d) => (
                <View key={d.label} style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{d.label}</Text>
                  <Text style={styles.detailValue}>{d.value}</Text>
                </View>
              ))}
            </View>
          )}

          {/* ── Payment methods ── */}
          <View style={styles.body}>
            <Text style={styles.methodsLabel}>PAYMENT METHODS</Text>
            <View style={styles.methodsRow}>
              <View style={styles.methodPill}>
                <Text style={styles.methodText}>UPI</Text>
              </View>
              <View style={styles.methodPill}>
                <Ionicons name="card-outline" size={13} color={Palette.charcoal} />
                <Text style={styles.methodText}>Cards</Text>
              </View>
              <View style={styles.methodPill}>
                <Ionicons name="lock-closed-outline" size={12} color={Palette.charcoal} />
                <Text style={styles.methodText}>Netbanking</Text>
              </View>
              <View style={styles.methodPill}>
                <Text style={styles.methodText}>Wallets</Text>
              </View>
            </View>
            <Text style={styles.hint}>
              Choose a method in Razorpay’s secure checkout. Test Mode won’t charge real money.
            </Text>

            {/* Error */}
            {!!error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={16} color={Palette.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Retry verification (after payment captured but verify failed) */}
            {pendingVerification && !isProcessing && (
              <Pressable
                style={[styles.ctaBtn, styles.ctaBtnOutline]}
                onPress={() => void confirmPayment(pendingVerification)}
              >
                <Text style={styles.ctaBtnOutlineText}>Retry order confirmation</Text>
              </Pressable>
            )}

            {/* Main CTA */}
            {!pendingVerification && (
              <Pressable
                style={[styles.ctaBtn, (isProcessing || displayAmount === null) && styles.ctaBtnDisabled]}
                onPress={() => void startPayment()}
                disabled={isProcessing || displayAmount === null}
              >
                {isProcessing ? (
                  <ActivityIndicator color={Palette.onAccent} size="small" />
                ) : (
                  <Text style={styles.ctaBtnText}>
                    {displayAmount === null
                      ? 'Amount unavailable'
                      : processingLabel ?? `Continue to pay ${money(displayAmount)}`}
                  </Text>
                )}
              </Pressable>
            )}
          </View>

          {/* ── Footer ── */}
          <View style={styles.footer}>
            <Ionicons name="lock-closed" size={11} color={Palette.stoneLight} />
            <Text style={styles.footerText}>RAZORPAY SECURE CHECKOUT · TEST MODE</Text>
          </View>

        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(37,37,37,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Palette.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    // Shadow
    ...Platform.select({
      web: { boxShadow: '0px -4px 24px rgba(0,0,0,0.12)' },
      default: { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 24, shadowOffset: { width: 0, height: -4 } },
    }),
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
  },
  brandName: { color: '#072654', fontSize: 18, fontWeight: '800' },
  brandSub: { color: '#888', fontSize: 12, marginTop: 1 },
  closeBtn: { padding: 4, marginTop: 2 },

  // Merchant
  merchantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
  },
  merchantIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Palette.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  merchantInfo: { flex: 1 },
  merchantName: { color: Palette.charcoal, fontSize: 15, fontWeight: '700' },
  merchantPurpose: { color: Palette.stone, fontSize: 12, marginTop: 1 },
  merchantAmount: { color: Palette.charcoal, fontSize: 17, fontWeight: '800' },

  // Details
  detailsBlock: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
  },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { color: Palette.stone, fontSize: 13 },
  detailValue: { color: Palette.charcoal, fontSize: 13, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },

  // Body
  body: { paddingHorizontal: 20, paddingTop: 16, gap: 12 },
  methodsLabel: { color: '#888', fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  methodsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  methodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: Palette.line,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  methodText: { color: Palette.charcoal, fontSize: 12, fontWeight: '600' },
  hint: { color: Palette.stone, fontSize: 12, lineHeight: 17 },

  // Error
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Palette.dangerSoft,
    borderRadius: 10,
    padding: 12,
  },
  errorText: { color: Palette.danger, fontSize: 13, flex: 1, lineHeight: 18 },

  // CTA
  ctaBtn: {
    backgroundColor: Palette.gold,
    borderRadius: 10,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  ctaBtnDisabled: { opacity: 0.5 },
  ctaBtnText: { color: Palette.onAccent, fontSize: 16, fontWeight: '700' },
  ctaBtnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Palette.gold,
  },
  ctaBtnOutlineText: { color: Palette.gold, fontSize: 15, fontWeight: '700' },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingTop: 14,
    paddingHorizontal: 20,
  },
  footerText: { color: Palette.stoneLight, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
});
