import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import RazorpayCheckoutSheet from '@/components/RazorpayCheckoutSheet';
import {
  ActionButton,
  AppHeader,
  Card,
  EmptyState,
  Eyebrow,
  Field,
  Loading,
  Notice,
  Screen,
  SectionTitle,
  StatusBadge,
  ui,
} from '@/components/karma-ui';
import { Brand, BrandFonts, Palette } from '@/constants/theme';
import { useSession } from '@/context/auth-context';
import { type ReceiptData, shareDonationReceipt } from '@/lib/documents';
import {
  type DonationRecord,
  type VerifiedPayment,
  apiCreateDonationPaymentOrder,
  apiGetMyDonations,
} from '@/services/api';

const PRESET_AMOUNTS = [250, 500, 1000, 2500];
const money = (amount: number) => `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
const receiptNumberFor = (id: number) => `KVU-${String(id).padStart(6, '0')}`;

type Step = 'home' | 'form' | 'receipt';

export default function GiveScreen() {
  const { session, user } = useSession();

  const [step, setStep] = useState<Step>('home');
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');

  const [amount, setAmount] = useState('500');
  const [purpose, setPurpose] = useState('General support');
  const [address, setAddress] = useState('');
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState('');

  const loadHistory = useCallback(async () => {
    if (!session) return;
    const res = await apiGetMyDonations(session);
    if (res.error) setHistoryError(res.error);
    else { setHistoryError(''); setDonations(res.data?.donations ?? []); }
    setLoading(false);
  }, [session]);

  useFocusEffect(useCallback(() => { void loadHistory(); }, [loadHistory]));

  const openCheckout = () => {
    setFormError('');
    const value = Number(amount);
    if (!Number.isFinite(value) || value < 1) return setFormError('Please enter a donation amount of at least ₹1.');
    if (value > 10_000_000) return setFormError('Please enter an amount up to ₹1,00,00,000.');
    if (!purpose.trim()) return setFormError('Please tell us what you would like to support.');
    if (!address.trim()) return setFormError('Please enter your address for the receipt.');
    setCheckoutOpen(true);
  };

  const handlePaymentComplete = async (payment: VerifiedPayment) => {
    if (payment.purpose !== 'donation' || !payment.referenceId) return;
    const paidAt = payment.paidAt || new Date().toISOString();
    setReceipt({
      receiptNumber: payment.receiptNumber || receiptNumberFor(payment.referenceId),
      donorName: payment.donor?.name || user?.name || 'Donor',
      donorEmail: payment.donor?.email || user?.email,
      donorPhone: payment.donor?.phone ?? user?.phoneNumber ?? null,
      amount: Number(payment.amount) || Number(amount),
      purpose: payment.donationPurpose || purpose,
      date: paidAt,
    });
    setStep('receipt');
    setMessage('');
    setAddress('');
    void loadHistory();
  };

  const viewReceipt = (d: DonationRecord) => {
    setPdfError('');
    setReceipt({
      receiptNumber: receiptNumberFor(d.id),
      donorName: d.donor_name || user?.name || 'Donor',
      donorEmail: d.donor_email || user?.email,
      donorPhone: d.donor_phone ?? user?.phoneNumber ?? null,
      amount: d.amount,
      purpose: d.purpose || 'General support',
      date: d.confirmed_at || d.created_at,
    });
    setStep('receipt');
  };

  const savePdf = async () => {
    if (!receipt) return;
    setPdfBusy(true);
    setPdfError('');
    try {
      await shareDonationReceipt(receipt);
    } catch {
      setPdfError('Could not create the receipt PDF. Please try again.');
    }
    setPdfBusy(false);
  };

  // ── Receipt ──
  if (step === 'receipt' && receipt) {
    return <Screen>
      <AppHeader title="Donation receipt" />
      <Card style={styles.receipt}>
        <View style={styles.receiptHead}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.receiptBrand}>{Brand.name}</Text>
            <Eyebrow>AUTOMATED DONATION RECEIPT</Eyebrow>
            <Text style={styles.receiptTitle}>Thank you for your contribution</Text>
          </View>
          <Text style={styles.receiptNumber}>{receipt.receiptNumber}</Text>
        </View>
        <ReceiptRow label="Donor name" value={receipt.donorName} />
        <ReceiptRow label="Amount" value={money(receipt.amount)} />
        <ReceiptRow label="Purpose" value={receipt.purpose} />
        <ReceiptRow label="Date" value={formatDate(receipt.date)} />
        <Text style={ui.small}>This is an automated receipt. No signature is required.</Text>
      </Card>
      {pdfError ? <Notice tone="error">{pdfError}</Notice> : null}
      <ActionButton icon="document-text-outline" label="Download receipt (PDF)" onPress={savePdf} loading={pdfBusy} />
      <ActionButton variant="outline" icon="arrow-back" label="Back to donations" onPress={() => setStep('home')} />
    </Screen>;
  }

  // ── Donation form ──
  if (step === 'form') {
    return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <Pressable onPress={() => setStep('home')} style={styles.back} accessibilityRole="button">
          <Ionicons name="arrow-back" size={18} color={Palette.goldDark} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <View style={{ gap: 6 }}>
          <Eyebrow>DONATION DETAILS</Eyebrow>
          <Text style={ui.title}>Make your contribution</Text>
        </View>

        <Card>
          <Field label="Donation amount (₹)" keyboardType="decimal-pad" value={amount} onChangeText={(v) => setAmount(v.replace(/[^\d.]/g, ''))} />
          <View style={styles.presets}>
            {PRESET_AMOUNTS.map((p) => {
              const active = Number(amount) === p;
              return <Pressable key={p} onPress={() => setAmount(String(p))} style={[styles.preset, active && styles.presetActive]} accessibilityRole="button" accessibilityState={{ selected: active }}>
                <Text style={[styles.presetText, active && styles.presetTextActive]}>{money(p)}</Text>
              </Pressable>;
            })}
          </View>
          <Field label="Purpose" placeholder="What would you like to support?" value={purpose} onChangeText={setPurpose} maxLength={200} />
          <Field label="Address" placeholder="Donor address" value={address} onChangeText={setAddress} multiline maxLength={500} />
          <Field label="Message (optional)" placeholder="Add a note for the organisation" value={message} onChangeText={setMessage} multiline maxLength={500} />
          {formError ? <Notice tone="error">{formError}</Notice> : null}
          <ActionButton icon="heart" label={`Donate ${Number(amount) > 0 ? money(Number(amount)) : ''}`.trim()} onPress={openCheckout} />
          <Text style={[ui.small, { textAlign: 'center' }]}>Payments are processed securely by Razorpay (test mode).</Text>
        </Card>

        <RazorpayCheckoutSheet
          visible={checkoutOpen}
          amount={Number(amount) || 0}
          merchantName={Brand.name}
          purpose="General donation"
          details={[
            { label: 'Purpose', value: purpose },
            { label: 'Donor', value: user?.name || 'Member' },
          ]}
          token={session ?? null}
          createOrder={() => apiCreateDonationPaymentOrder(session!, { amount: Number(amount), purpose: purpose.trim(), address: address.trim(), message: message.trim() })}
          onPaymentComplete={handlePaymentComplete}
          processingLabel={undefined}
          onClose={() => setCheckoutOpen(false)}
        />
      </Screen>
    </KeyboardAvoidingView>;
  }

  // ── Home ──
  return <Screen>
    <AppHeader title="Give" />

    <Card style={styles.welcome}>
      <Eyebrow>GENERAL FUND</Eyebrow>
      <Text style={styles.welcomeTitle}>Support the work of {Brand.name}</Text>
      <ActionButton icon="heart" label="Donate now" onPress={() => { setFormError(''); setStep('form'); }} />
    </Card>

    <SectionTitle>Donation history</SectionTitle>
    {loading ? <Loading /> : historyError ? (
      <EmptyState icon="alert-circle-outline" title="Unable to load donations" message={historyError} action={<ActionButton variant="outline" label="Try again" onPress={() => { setLoading(true); void loadHistory(); }} />} />
    ) : donations.length === 0 ? (
      <EmptyState icon="heart-outline" title="No donations yet" message="Your donation records will appear here." />
    ) : (
      <View style={{ gap: 10 }}>
        {donations.map((d) => <Card key={d.id} style={styles.historyItem}>
          <View style={styles.historyTop}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.historyPurpose} numberOfLines={2}>{d.purpose || 'Donation to the organisation'}</Text>
              <Text style={ui.small}>{formatDate(d.created_at)}{d.source === 'offline' ? ' · Recorded offline' : ''}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <Text style={styles.historyAmount}>{money(d.amount)}</Text>
              <StatusBadge status={d.status} />
            </View>
          </View>
          {d.status === 'confirmed' ? (
            <Pressable onPress={() => viewReceipt(d)} style={styles.receiptLink} accessibilityRole="button">
              <Ionicons name="receipt-outline" size={16} color={Palette.goldDark} />
              <Text style={styles.receiptLinkText}>View receipt</Text>
            </Pressable>
          ) : null}
        </Card>)}
      </View>
    )}
  </Screen>;
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return <View style={styles.receiptRow}>
    <Text style={ui.small}>{label}</Text>
    <Text style={styles.receiptValue}>{value}</Text>
  </View>;
}

const styles = StyleSheet.create({
  welcome: { gap: 10 },
  welcomeTitle: { fontFamily: BrandFonts.heading, fontSize: 22, lineHeight: 29, color: Palette.charcoal },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 4 },
  backText: { fontFamily: BrandFonts.bodySemi, fontSize: 15, color: Palette.goldDark },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  preset: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, borderWidth: 1, borderColor: Palette.line, backgroundColor: Palette.surfaceRaised },
  presetActive: { backgroundColor: Palette.gold, borderColor: Palette.gold },
  presetText: { fontFamily: BrandFonts.bodySemi, fontSize: 14, color: Palette.charcoal },
  presetTextActive: { color: Palette.onAccent },
  historyItem: { gap: 10 },
  historyTop: { flexDirection: 'row', gap: 12 },
  historyPurpose: { fontFamily: BrandFonts.bodySemi, fontSize: 15, color: Palette.charcoal },
  historyAmount: { fontFamily: BrandFonts.heading, fontSize: 18, color: Palette.charcoal },
  receiptLink: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  receiptLinkText: { fontFamily: BrandFonts.bodySemi, fontSize: 14, color: Palette.goldDark },
  receipt: { gap: 12, borderColor: Palette.gold },
  receiptHead: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: Palette.line },
  receiptBrand: { fontFamily: BrandFonts.heading, fontSize: 18, color: Palette.goldDark },
  receiptTitle: { fontFamily: BrandFonts.heading, fontSize: 20, lineHeight: 26, color: Palette.charcoal },
  receiptNumber: { fontFamily: BrandFonts.bodySemi, fontSize: 13, color: Palette.stone },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Palette.line },
  receiptValue: { fontFamily: BrandFonts.bodySemi, fontSize: 15, color: Palette.charcoal, flexShrink: 1, textAlign: 'right' },
});
