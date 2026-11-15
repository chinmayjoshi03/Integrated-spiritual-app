import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Linking, StyleSheet, Text, View } from 'react-native';

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
import { shareCalendarFile, shareCertificate } from '@/lib/documents';
import {
  buildEventIcs,
  formatDate,
  formatDuration,
  formatTime,
  getEventLifecycle,
  getEventStart,
  lifecycleLabel,
} from '@/lib/lifecycle';
import {
  type EventItem,
  apiGetEventDetail,
  apiGetMyEventCertificate,
  apiHeartbeatEventSession,
  apiJoinEventSession,
  apiLeaveEventSession,
  apiRegisterForEvent,
} from '@/services/api';

const attendanceLabel = (e: EventItem) =>
  e.attendance_status === 'present' ? 'Present' : e.attendance_status === 'absent' ? 'Absent' : 'Not recorded yet';
const certificateLabel = (e: EventItem) =>
  e.certificate_status === 'available' ? 'Available' : e.certificate_status === 'pending' ? 'Pending' : 'Not available';

export default function EventDetailScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const id = Number(eventId);
  const { session } = useSession();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [now, setNow] = useState(() => new Date());

  const [registering, setRegistering] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sessionBusy, setSessionBusy] = useState(false);
  const [inSession, setInSession] = useState(false);
  const [certBusy, setCertBusy] = useState(false);
  const inSessionRef = useRef(false);

  const load = useCallback(async () => {
    if (!session || !Number.isInteger(id)) return;
    const res = await apiGetEventDetail(session, id);
    if (res.error || !res.data) setLoadError(res.error ?? 'This event could not be found.');
    else { setLoadError(''); setEvent(res.data); }
    setLoading(false);
  }, [session, id]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  // Re-evaluate the lifecycle (upcoming → live → completed) every 15 seconds, like the website.
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(timer);
  }, []);

  // While in a live session: heartbeat every 15s, and when the app comes back to the foreground.
  useEffect(() => {
    inSessionRef.current = inSession;
    if (!inSession || !session || !event) return;
    const beat = () => { void apiHeartbeatEventSession(session, event.id); };
    const timer = setInterval(beat, 15_000);
    const sub = AppState.addEventListener('change', (state) => { if (state === 'active' || state === 'background') beat(); });
    return () => { clearInterval(timer); sub.remove(); };
  }, [inSession, session, event]);

  // Leaving the screen ends the session record (website: pagehide → leave).
  useEffect(() => () => {
    if (inSessionRef.current && session && Number.isInteger(id)) void apiLeaveEventSession(session, id);
  }, [session, id]);

  const register = async () => {
    if (!session || !event) return;
    setRegistering(true);
    setError('');
    setMessage('');
    const res = await apiRegisterForEvent(session, event.id);
    setRegistering(false);
    if (res.error) return setError(res.error);
    setMessage(res.data?.message || 'You are registered for this event.');
    void load();
  };

  const joinSession = async () => {
    if (!session || !event) return;
    setSessionBusy(true);
    setError('');
    const res = await apiJoinEventSession(session, event.id);
    setSessionBusy(false);
    if (res.error) return setError(res.error);
    setInSession(true);
    setMessage('Your attendance is being recorded. Keep the app open in the background while you attend.');
    if (res.data?.meeting_url) {
      Linking.openURL(res.data.meeting_url).catch(() => setError('Could not open the meeting link on this device.'));
    }
  };

  const leaveSession = async () => {
    if (!session || !event) return;
    setSessionBusy(true);
    const res = await apiLeaveEventSession(session, event.id);
    setSessionBusy(false);
    if (res.error) return setError(res.error);
    setInSession(false);
    setMessage('You have left the session.');
  };

  const addToCalendar = async () => {
    if (!event) return;
    try {
      const ok = await shareCalendarFile(buildEventIcs(event), event.title);
      if (!ok) setError('Calendar sharing is not available on this device.');
    } catch {
      setError('Could not create the calendar file.');
    }
  };

  const downloadCertificate = async () => {
    if (!session || !event) return;
    setCertBusy(true);
    setError('');
    const res = await apiGetMyEventCertificate(session, event.id);
    if (res.error || !res.data) {
      setCertBusy(false);
      return setError(res.error ?? 'Certificate is not available yet.');
    }
    try {
      await shareCertificate({
        title: 'Certificate of Participation',
        participantName: res.data.participant_name,
        activityName: res.data.event_title,
        dateLabel: 'Event date',
        activityDate: formatDate(res.data.event_date),
        certificateNumber: res.data.certificate_number,
        issuedDate: res.data.issued_at ? formatDate(res.data.issued_at) : undefined,
      });
    } catch {
      setError('Could not create the certificate PDF.');
    }
    setCertBusy(false);
  };

  if (loading) return <Screen><AppHeader title="Event" back /><Loading /></Screen>;
  if (loadError || !event) {
    return <Screen>
      <AppHeader title="Event" back />
      <EmptyState icon="calendar-outline" title="Event unavailable" message={loadError} action={<ActionButton variant="outline" label="Try again" onPress={() => { setLoading(true); void load(); }} />} />
    </Screen>;
  }

  const lifecycle = getEventLifecycle(event, now);
  const isOnline = event.event_type === 'online';
  const isRegistered = Boolean(event.is_registered);
  const isFull = event.capacity !== null && (event.registered_count ?? 0) >= event.capacity;
  const canRegister = lifecycle === 'upcoming' && !isRegistered && !isFull;
  const showCalendar = isRegistered && (lifecycle === 'upcoming' || lifecycle === 'live');
  const joinOpensAt = getEventStart(event).getTime() - 10 * 60 * 1000;
  const canJoinSession = isRegistered && isOnline && (lifecycle === 'live' || (lifecycle === 'upcoming' && now.getTime() >= joinOpensAt));
  const fee = Number(event.fee) > 0 ? `₹${Number(event.fee).toLocaleString('en-IN')}` : 'Free';

  return <Screen>
    <AppHeader title="Event" back />

    <Card style={styles.hero}>
      <Banner uri={event.banner_url} icon="calendar-outline" height={190} />
      <View style={styles.heroBody}>
        <View style={styles.badges}>
          <StatusBadge status={isOnline ? 'neutral' : 'neutral'} label={isOnline ? 'Online' : 'In person'} />
          <StatusBadge status={lifecycle} label={lifecycleLabel(lifecycle)} />
          {isRegistered ? <StatusBadge status="registered" /> : null}
        </View>
        <Text style={styles.title}>{event.title}</Text>
        {event.created_by_name ? <Text style={ui.small}>Hosted by {event.created_by_name}</Text> : null}
      </View>
    </Card>

    <Card>
      <InfoRow icon="calendar-outline" label="Date" value={formatDate(event.event_date)} />
      <InfoRow icon="time-outline" label="Time" value={`${formatTime(event.start_time)}${event.duration_minutes ? ` · ${formatDuration(event.duration_minutes)}` : ''}`} />
      {!isOnline && event.location ? <InfoRow icon="location-outline" label="Location" value={event.location} /> : null}
      <InfoRow icon="people-outline" label="Participants" value={event.capacity === null ? `${event.registered_count ?? 0} registered` : `${event.registered_count ?? 0} / ${event.capacity} registered`} />
      <InfoRow icon="pricetag-outline" label="Fee" value={fee} />
    </Card>

    {event.description ? <Card>
      <Eyebrow>ABOUT THIS EVENT</Eyebrow>
      <Text style={ui.body}>{event.description}</Text>
    </Card> : null}

    {isOnline ? <Card>
      <Eyebrow>MEETING INFORMATION</Eyebrow>
      <Text style={ui.body}>
        {isRegistered
          ? 'Registered participants can enter through Join Session. The meeting address stays private and is opened only after your participation is recorded. Joining opens 10 minutes before the start.'
          : 'The live session is available to registered participants through Join Session.'}
      </Text>
    </Card> : null}

    <Card>
      <Text style={styles.panelTitle}>{lifecycle === 'completed' ? 'Your event' : 'Registration'}</Text>
      {message ? <Notice tone="success">{message}</Notice> : null}
      {error ? <Notice tone="error">{error}</Notice> : null}

      {lifecycle === 'draft' ? <Text style={ui.body}>This event is not available for registration.</Text> : null}
      {lifecycle === 'cancelled' ? <Text style={ui.body}>This event has been cancelled. New registrations are closed.</Text> : null}
      {lifecycle === 'upcoming' && isRegistered ? <Notice tone="success">You are registered for this event.</Notice> : null}
      {lifecycle === 'upcoming' && !isRegistered && isFull ? <Notice tone="info">This event is full.</Notice> : null}

      {canRegister ? <ActionButton icon="checkmark-circle-outline" label="Register" onPress={register} loading={registering} /> : null}
      {showCalendar ? <ActionButton variant="outline" icon="calendar-outline" label="Add to calendar" onPress={addToCalendar} /> : null}
      {canJoinSession && !inSession ? <ActionButton icon="videocam-outline" label="Join session" onPress={joinSession} loading={sessionBusy} /> : null}
      {canJoinSession && inSession ? <ActionButton variant="outline" icon="exit-outline" label="Leave session" onPress={leaveSession} loading={sessionBusy} /> : null}

      {lifecycle === 'live' && !isRegistered ? <Text style={ui.body}>Registration is closed while this event is live. Join access is available to registered participants.</Text> : null}
      {lifecycle === 'live' && isRegistered && !isOnline ? <Text style={ui.body}>This event is happening now at the listed location.</Text> : null}

      {lifecycle === 'completed' && isRegistered ? <View style={{ gap: 10 }}>
        <View style={styles.summaryRow}><Text style={ui.small}>Attendance</Text><Text style={styles.summaryValue}>{attendanceLabel(event)}</Text></View>
        <View style={styles.summaryRow}><Text style={ui.small}>Certificate</Text><Text style={styles.summaryValue}>{certificateLabel(event)}</Text></View>
        {event.certificate_status === 'available'
          ? <ActionButton icon="ribbon-outline" label="Download certificate (PDF)" onPress={downloadCertificate} loading={certBusy} />
          : null}
      </View> : null}
      {lifecycle === 'completed' && !isRegistered ? <Text style={ui.body}>This event has ended. Attendance and certificates are available to registered participants.</Text> : null}
    </Card>
  </Screen>;
}

const styles = StyleSheet.create({
  hero: { padding: 0, gap: 0, overflow: 'hidden' },
  heroBody: { padding: 20, gap: 10 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  title: { fontFamily: BrandFonts.heading, fontSize: 26, lineHeight: 33, color: Palette.charcoal },
  panelTitle: { fontFamily: BrandFonts.heading, fontSize: 20, color: Palette.charcoal },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Palette.line },
  summaryValue: { fontFamily: BrandFonts.bodySemi, fontSize: 15, color: Palette.charcoal },
});
