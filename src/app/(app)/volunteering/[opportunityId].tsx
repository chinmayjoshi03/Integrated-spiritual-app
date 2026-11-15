import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  ActionButton,
  AppHeader,
  Banner,
  Card,
  EmptyState,
  Eyebrow,
  InfoRow,
  Loading,
  Notice,
  Screen,
  StatusBadge,
  ui,
} from '@/components/karma-ui';
import { BrandFonts, Palette } from '@/constants/theme';
import { useSession } from '@/context/auth-context';
import { shareVolunteerCertificate } from '@/lib/documents';
import {
  formatDate,
  formatDuration,
  formatTime,
  getVolunteerLifecycle,
  lifecycleLabel,
  volunteerDurationMinutes,
} from '@/lib/lifecycle';
import {
  type VolunteerOpportunity,
  apiApplyVolunteer,
  apiCancelVolunteerApplication,
  apiGetVolunteerOpportunity,
} from '@/services/api';

export default function VolunteerOpportunityScreen() {
  const { opportunityId } = useLocalSearchParams<{ opportunityId: string }>();
  const id = Number(opportunityId);
  const { session } = useSession();

  const [opportunity, setOpportunity] = useState<VolunteerOpportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState(false);
  const [certBusy, setCertBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!session || !Number.isInteger(id)) return;
    const res = await apiGetVolunteerOpportunity(session, id);
    if (res.error || !res.data) setLoadError(res.error ?? 'This opportunity could not be found.');
    else { setLoadError(''); setOpportunity(res.data); }
    setLoading(false);
  }, [session, id]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const apply = async () => {
    if (!session || !opportunity) return;
    setBusy(true);
    setError('');
    setMessage('');
    const res = await apiApplyVolunteer(session, opportunity.id);
    setBusy(false);
    if (res.error) return setError(res.error);
    setMessage(res.data?.message || 'Your application has been submitted.');
    void load();
  };

  const cancel = () => {
    if (!session || !opportunity) return;
    Alert.alert('Cancel application?', 'Your place will be released for another volunteer.', [
      { text: 'Keep application', style: 'cancel' },
      {
        text: 'Cancel application',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          setError('');
          setMessage('');
          const res = await apiCancelVolunteerApplication(session, opportunity.id);
          setBusy(false);
          if (res.error) return setError(res.error);
          setMessage(res.data?.message || 'Your application has been cancelled.');
          void load();
        },
      },
    ]);
  };

  const downloadCertificate = async () => {
    if (!session || !opportunity?.my_application?.id) return;
    setCertBusy(true);
    setError('');
    const err = await shareVolunteerCertificate(session, opportunity.my_application.id);
    setCertBusy(false);
    if (err) setError(err);
  };

  if (loading) return <Screen><AppHeader title="Volunteering" back /><Loading /></Screen>;
  if (loadError || !opportunity) {
    return <Screen>
      <AppHeader title="Volunteering" back />
      <EmptyState icon="heart-outline" title="Opportunity unavailable" message={loadError} action={<ActionButton variant="outline" label="Try again" onPress={() => { setLoading(true); void load(); }} />} />
    </Screen>;
  }

  const isOnline = opportunity.volunteer_type === 'online';
  const lifecycle = getVolunteerLifecycle(opportunity);
  const applicationStatus = opportunity.my_application?.status;
  const canApply = opportunity.status === 'published' && !opportunity.is_full && !applicationStatus;
  const canCancel = (applicationStatus === 'applied' || applicationStatus === 'approved') && opportunity.status !== 'completed';
  const duration = formatDuration(volunteerDurationMinutes(opportunity.start_time, opportunity.end_time));
  const capacityLabel = opportunity.capacity === null
    ? `${opportunity.occupied} applied`
    : `${opportunity.occupied} / ${opportunity.capacity} volunteers${opportunity.remaining !== null ? ` · ${opportunity.remaining} places left` : ''}`;

  return <Screen>
    <AppHeader title="Volunteering" back />

    <Card style={styles.hero}>
      <Banner uri={opportunity.banner_url} icon="heart-outline" height={190} />
      <View style={styles.heroBody}>
        <View style={styles.badges}>
          <StatusBadge status="neutral" label={isOnline ? 'Online' : 'Offline'} />
          <StatusBadge status={lifecycle} label={lifecycleLabel(lifecycle)} />
          {applicationStatus ? <StatusBadge status={applicationStatus} /> : null}
        </View>
        {opportunity.category ? <Eyebrow>{opportunity.category.toUpperCase()}</Eyebrow> : null}
        <Text style={styles.title}>{opportunity.title}</Text>
      </View>
    </Card>

    <Card>
      <InfoRow icon="calendar-outline" label="Date" value={formatDate(opportunity.event_date)} />
      <InfoRow icon="time-outline" label="Time" value={`${formatTime(opportunity.start_time)} – ${formatTime(opportunity.end_time)}${duration ? ` · ${duration}` : ''}`} />
      {!isOnline && opportunity.location ? <InfoRow icon="location-outline" label="Location" value={opportunity.location} /> : null}
      <InfoRow icon="people-outline" label="Volunteers" value={opportunity.is_full ? 'No places remaining' : capacityLabel} />
    </Card>

    <Card>
      <Eyebrow>ABOUT THIS OPPORTUNITY</Eyebrow>
      <Text style={ui.body}>{opportunity.description}</Text>
    </Card>

    {opportunity.requirements ? <Card>
      <Eyebrow>REQUIREMENTS</Eyebrow>
      <Text style={ui.body}>{opportunity.requirements}</Text>
    </Card> : null}

    {opportunity.meeting_url ? <Card>
      <Eyebrow>MEETING INFORMATION</Eyebrow>
      <Pressable onPress={() => Linking.openURL(opportunity.meeting_url!).catch(() => setError('Could not open the meeting link.'))} accessibilityRole="link">
        <Text style={ui.link}>{opportunity.meeting_url}</Text>
      </Pressable>
    </Card> : isOnline ? <Card>
      <Eyebrow>MEETING INFORMATION</Eyebrow>
      <Text style={ui.body}>The meeting link is shared after your application is approved.</Text>
    </Card> : null}

    <Card>
      <Text style={styles.panelTitle}>Application</Text>
      {opportunity.status !== 'published' && !applicationStatus ? <Text style={ui.body}>This opportunity is not accepting applications.</Text> : null}
      {opportunity.status === 'published' && opportunity.is_full && !applicationStatus ? <Notice tone="info">This opportunity is full.</Notice> : null}

      {applicationStatus ? <Row label="Status" value={<StatusBadge status={applicationStatus} />} /> : null}
      {opportunity.my_attendance ? <Row label="Attendance" value={<Text style={styles.value}>{opportunity.my_attendance.status}{opportunity.my_attendance.duration_minutes ? ` · ${formatDuration(opportunity.my_attendance.duration_minutes)}` : ''}</Text>} /> : null}
      {opportunity.certificate_status && opportunity.certificate_status !== 'not_available'
        ? <Row label="Certificate" value={<Text style={styles.value}>{opportunity.certificate_status}</Text>} />
        : null}

      {message ? <Notice tone="success">{message}</Notice> : null}
      {error ? <Notice tone="error">{error}</Notice> : null}

      {canApply ? <ActionButton icon="hand-left-outline" label="Apply to volunteer" onPress={apply} loading={busy} /> : null}
      {canCancel ? <ActionButton variant="danger" icon="close-circle-outline" label="Cancel application" onPress={cancel} loading={busy} /> : null}
      {opportunity.certificate_status === 'available' && opportunity.my_application?.id
        ? <ActionButton variant="outline" icon="ribbon-outline" label="Download certificate (PDF)" onPress={downloadCertificate} loading={certBusy} />
        : null}
    </Card>
  </Screen>;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return <View style={styles.row}><Text style={ui.small}>{label}</Text>{value}</View>;
}

const styles = StyleSheet.create({
  hero: { padding: 0, gap: 0, overflow: 'hidden' },
  heroBody: { padding: 20, gap: 10 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  title: { fontFamily: BrandFonts.heading, fontSize: 26, lineHeight: 33, color: Palette.charcoal },
  panelTitle: { fontFamily: BrandFonts.heading, fontSize: 20, color: Palette.charcoal },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Palette.line },
  value: { fontFamily: BrandFonts.bodySemi, fontSize: 15, color: Palette.charcoal, textTransform: 'capitalize' },
});
