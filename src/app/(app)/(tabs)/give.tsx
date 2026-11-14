import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppHeader, Card, Screen, SectionTitle, ui } from '@/components/karma-ui';
import { Palette } from '@/constants/theme';
import { useSession } from '@/context/auth-context';
import {
  type DonationRecord,
  type VolunteerOpportunity,
  apiApplyVolunteer,
  apiCreateDonation,
  apiGetMyDonations,
  apiGetVolunteerOpportunities,
} from '@/services/api';

type Segment = 'donate' | 'seva';

const PRESET_AMOUNTS = [250, 500, 1000, 2500];

const money = (amount: number) =>
  `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  completed: { bg: '#D1FAE5', text: '#065F46' },
  pending:   { bg: '#FEF3C7', text: '#92400E' },
  failed:    { bg: '#FEE2E2', text: '#991B1B' },
};

export default function GiveScreen() {
  const [activeSegment, setActiveSegment] = useState<Segment>('donate');

  return (
    <Screen>
      <AppHeader title="Give & Serve" subtitle="Donations and seva opportunities" />

      {/* Segment controller */}
      <View style={styles.segmentContainer}>
        <Pressable
          style={[styles.segBtn, activeSegment === 'donate' && styles.segBtnActive]}
          onPress={() => setActiveSegment('donate')}
        >
          <Text style={[styles.segText, activeSegment === 'donate' && styles.segTextActive]}>
            🤲 Donate
          </Text>
        </Pressable>
        <Pressable
          style={[styles.segBtn, activeSegment === 'seva' && styles.segBtnActive]}
          onPress={() => setActiveSegment('seva')}
        >
          <Text style={[styles.segText, activeSegment === 'seva' && styles.segTextActive]}>
            🤝 Seva
          </Text>
        </Pressable>
      </View>

      {activeSegment === 'donate' && <DonateSection />}
      {activeSegment === 'seva' && <SevaSection />}
    </Screen>
  );
}

// ─── Donate Section ────────────────────────────────────────────────────────────

function DonateSection() {
  const { session } = useSession();

  const [amount, setAmount] = useState('500');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useFocusEffect(
    useCallback(() => {
      if (!session) return;
      apiGetMyDonations(session)
        .then((res) => {
          if (res.data) setDonations(res.data.donations);
        })
        .finally(() => setLoading(false));
    }, [session])
  );

  const handleSubmit = async () => {
    const numAmount = Number(amount);
    if (!numAmount || numAmount < 1) {
      setError('Please enter a valid donation amount.');
      return;
    }
    if (!session) return;

    setError('');
    setNotice('');
    setSubmitting(true);

    const res = await apiCreateDonation(session, {
      amount: numAmount,
      message: message.trim() || undefined,
      isAnonymous,
    });

    setSubmitting(false);

    if (res.error) {
      setError(res.error);
    } else {
      setNotice(`Thank you for your generous offering of ${money(numAmount)}. Your donation has been received.`);
      setAmount('500');
      setMessage('');
      setIsAnonymous(false);
      // Refresh history
      apiGetMyDonations(session).then((r) => {
        if (r.data) setDonations(r.data.donations);
      });
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Welcome section */}
      <Card style={styles.welcomeCard}>
        <View style={styles.welcomeIconRow}>
          <Text style={styles.welcomeIcon}>🤲</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.welcomeEyebrow}>GENERAL FUND</Text>
            <Text style={styles.welcomeHeading}>Every contribution supports our community</Text>
          </View>
        </View>
        <Text style={ui.small}>
          All contributions support the organisation as a whole and help sustain teachings, events, and community care.
        </Text>
      </Card>

      {/* Success notice */}
      {notice !== '' && (
        <Card style={styles.noticeCard}>
          <Text style={styles.noticeText}>✓ {notice}</Text>
        </Card>
      )}

      {/* Donation form */}
      <SectionTitle>Make a contribution</SectionTitle>
      <Card style={styles.formCard}>
        <Text style={styles.fieldLabel}>Donation amount (₹)</Text>

        {/* Preset buttons */}
        <View style={styles.presetsRow}>
          {PRESET_AMOUNTS.map((preset) => (
            <Pressable
              key={preset}
              style={[
                styles.presetBtn,
                Number(amount) === preset && styles.presetBtnActive,
              ]}
              onPress={() => setAmount(String(preset))}
            >
              <Text
                style={[
                  styles.presetText,
                  Number(amount) === preset && styles.presetTextActive,
                ]}
              >
                {money(preset)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Custom amount */}
        <TextInput
          style={styles.amountInput}
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
          placeholder="Enter custom amount"
          placeholderTextColor={Palette.stoneLight}
        />

        <Text style={styles.fieldLabel}>Message (optional)</Text>
        <TextInput
          style={styles.messageInput}
          value={message}
          onChangeText={setMessage}
          placeholder="Add a note for the organisation"
          placeholderTextColor={Palette.stoneLight}
          multiline
          maxLength={500}
        />

        {/* Anonymous toggle */}
        <View style={styles.anonRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.anonLabel}>Keep my name private</Text>
            <Text style={ui.small}>Admins can still see your account.</Text>
          </View>
          <Switch
            value={isAnonymous}
            onValueChange={setIsAnonymous}
            trackColor={{ false: Palette.line, true: Palette.gold }}
            thumbColor={Palette.surface}
          />
        </View>

        {error !== '' && <Text style={styles.errorText}>{error}</Text>}

        <Text style={[ui.small, { marginTop: 4 }]}>
          Payment processing will start once Razorpay is connected.
        </Text>

        <Pressable
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={Palette.surface} />
          ) : (
            <Text style={styles.submitBtnText}>Continue to secure payment</Text>
          )}
        </Pressable>
      </Card>

      {/* Donation history */}
      <SectionTitle>Your giving history</SectionTitle>
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Palette.gold} />
        </View>
      ) : donations.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>🤍</Text>
          <Text style={styles.emptyTitle}>No donations yet</Text>
          <Text style={[ui.small, { textAlign: 'center' }]}>
            Your donation records will appear here.
          </Text>
        </Card>
      ) : (
        <View style={styles.historyList}>
          {donations.map((d) => {
            const statusStyle = STATUS_COLORS[d.status] ?? STATUS_COLORS.pending;
            return (
              <Card key={d.id} style={styles.historyItem}>
                <View style={styles.historyRow}>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={styles.historyTitle}>Donation to the organisation</Text>
                    <Text style={ui.small}>{formatDate(d.created_at)}</Text>
                    {d.message ? (
                      <Text style={ui.small}>"{d.message}"</Text>
                    ) : null}
                  </View>
                  <View style={styles.historyRight}>
                    <Text style={styles.historyAmount}>{money(d.amount)}</Text>
                    <View
                      style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}
                    >
                      <Text style={[styles.statusText, { color: statusStyle.text }]}>
                        {d.status}
                      </Text>
                    </View>
                  </View>
                </View>
              </Card>
            );
          })}
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

// ─── Seva Section ──────────────────────────────────────────────────────────────

function SevaSection() {
  const { session } = useSession();
  const [opportunities, setOpportunities] = useState<VolunteerOpportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!session) return;
      setLoading(true);
      apiGetVolunteerOpportunities(session)
        .then((res) => {
          if (res.data) setOpportunities(res.data.opportunities);
        })
        .finally(() => setLoading(false));
    }, [session])
  );

  const handleApply = async (opp: VolunteerOpportunity) => {
    if (!session || opp.applied_by_user) return;

    Alert.alert(
      'Offer Seva',
      `Would you like to register your interest for "${opp.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setOpportunities((prev) =>
              prev.map((o) =>
                o.id === opp.id
                  ? { ...o, applied_by_user: true, current_volunteers: o.current_volunteers + 1 }
                  : o
              )
            );
            await apiApplyVolunteer(session, opp.id);
            Alert.alert('Seva Application Sent', 'Thank you for offering your time and skills!');
          },
        },
      ]
    );
  };

  return (
    <View style={{ gap: 12 }}>
      <Card style={styles.welcomeCard}>
        <View style={styles.welcomeIconRow}>
          <Text style={styles.welcomeIcon}>🤝</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.welcomeEyebrow}>SEVA</Text>
            <Text style={styles.welcomeHeading}>Offer your time and skills</Text>
          </View>
        </View>
        <Text style={ui.small}>
          Selfless service in support of the community. Apply for any role that speaks to you.
        </Text>
      </Card>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Palette.gold} size="large" />
        </View>
      ) : opportunities.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>🤝</Text>
          <Text style={styles.emptyTitle}>No active Seva roles</Text>
          <Text style={[ui.small, { textAlign: 'center' }]}>
            All volunteer positions are currently filled. Check back soon.
          </Text>
        </Card>
      ) : (
        <View style={{ gap: 12 }}>
          {opportunities.map((opp) => (
            <Card key={opp.id} style={styles.sevaCard}>
              <View style={styles.sevaHeader}>
                <View style={styles.sevaCatBadge}>
                  <Text style={styles.sevaCatText}>{opp.category.toUpperCase()}</Text>
                </View>
                <Text style={ui.small}>
                  {opp.current_volunteers} / {opp.required_volunteers} volunteers
                </Text>
              </View>
              <Text style={styles.sevaTitle}>{opp.title}</Text>
              <Text style={styles.sevaLocation}>📍 {opp.location}</Text>
              <Text style={[ui.small, { lineHeight: 18, marginTop: 2 }]}>{opp.description}</Text>
              <Pressable
                style={[styles.sevaApplyBtn, opp.applied_by_user && styles.sevaApplyBtnDone]}
                onPress={() => handleApply(opp)}
              >
                <Text
                  style={[
                    styles.sevaApplyText,
                    opp.applied_by_user && styles.sevaApplyTextDone,
                  ]}
                >
                  {opp.applied_by_user
                    ? '✓ Seva Application Submitted'
                    : 'Offer Seva / Volunteer'}
                </Text>
              </Pressable>
            </Card>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Segment controller
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: Palette.surface,
    borderRadius: 18,
    padding: 4,
    borderWidth: 1,
    borderColor: Palette.line,
    marginVertical: 12,
  },
  segBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
  },
  segBtnActive: { backgroundColor: Palette.goldDark },
  segText: { color: Palette.charcoal, fontSize: 13, fontWeight: '700' },
  segTextActive: { color: Palette.surface },

  // Welcome card
  welcomeCard: { backgroundColor: Palette.goldSoft, borderColor: Palette.gold, gap: 10 },
  welcomeIconRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  welcomeIcon: { fontSize: 28, marginTop: 2 },
  welcomeEyebrow: { color: Palette.goldDark, fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  welcomeHeading: {
    color: Palette.charcoal,
    fontFamily: 'serif',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    marginTop: 2,
  },

  // Notice
  noticeCard: { backgroundColor: '#D1FAE5', borderColor: '#6EE7B7' },
  noticeText: { color: '#065F46', fontSize: 14, fontWeight: '700' },

  // Form
  formCard: { gap: 14 },
  fieldLabel: { color: Palette.charcoal, fontSize: 14, fontWeight: '700', marginBottom: -6 },
  presetsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  presetBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Palette.ivory,
    borderWidth: 1,
    borderColor: Palette.line,
  },
  presetBtnActive: { backgroundColor: Palette.goldDark, borderColor: Palette.goldDark },
  presetText: { color: Palette.charcoal, fontSize: 13, fontWeight: '700' },
  presetTextActive: { color: Palette.surface },
  amountInput: {
    backgroundColor: Palette.ivory,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Palette.line,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Palette.charcoal,
    fontSize: 16,
  },
  messageInput: {
    backgroundColor: Palette.ivory,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Palette.line,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Palette.charcoal,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  anonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Palette.ivory,
    borderRadius: 14,
    padding: 14,
  },
  anonLabel: { color: Palette.charcoal, fontSize: 14, fontWeight: '600' },
  errorText: { color: Palette.danger, fontSize: 13 },
  submitBtn: {
    backgroundColor: Palette.charcoal,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: Palette.surface, fontSize: 15, fontWeight: '700' },

  // History
  loadingWrap: { paddingVertical: 32, alignItems: 'center' },
  historyList: { gap: 10 },
  historyItem: { gap: 0 },
  historyRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  historyTitle: { color: Palette.charcoal, fontSize: 14, fontWeight: '700' },
  historyRight: { alignItems: 'flex-end', gap: 6, flexShrink: 0 },
  historyAmount: {
    color: Palette.goldDark,
    fontFamily: 'serif',
    fontSize: 18,
    fontWeight: '800',
  },
  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusText: { fontSize: 11, fontWeight: '700' },

  // Empty
  emptyCard: { alignItems: 'center', gap: 10, paddingVertical: 36 },
  emptyIcon: { fontSize: 44 },
  emptyTitle: {
    color: Palette.charcoal,
    fontFamily: 'serif',
    fontSize: 18,
    fontWeight: '700',
  },

  // Seva
  sevaCard: { gap: 8, padding: 16 },
  sevaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sevaCatBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  sevaCatText: { color: '#047857', fontSize: 10, fontWeight: '800' },
  sevaTitle: {
    color: Palette.charcoal,
    fontFamily: 'serif',
    fontSize: 18,
    fontWeight: '700',
  },
  sevaLocation: { color: Palette.goldDark, fontSize: 12, fontWeight: '600' },
  sevaApplyBtn: {
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.goldDark,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  sevaApplyBtnDone: { backgroundColor: '#059669', borderColor: '#059669' },
  sevaApplyText: { color: Palette.goldDark, fontSize: 14, fontWeight: '700' },
  sevaApplyTextDone: { color: Palette.surface },
});
