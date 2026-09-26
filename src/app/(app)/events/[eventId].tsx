import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader, Card, Pill, Screen, SectionTitle, ui } from '@/components/karma-ui';
import { Palette } from '@/constants/theme';
import { useSession } from '@/context/auth-context';
import { type EventItem, apiGetEventDetail, apiToggleRegisterEvent } from '@/services/api';

export default function EventDetailScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const { session } = useSession();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  const loadEvent = useCallback(async () => {
    if (!session || !eventId) return;
    setLoading(true);
    const res = await apiGetEventDetail(session, Number(eventId));
    if (res.data) {
      setEvent(res.data.event);
    }
    setLoading(false);
  }, [session, eventId]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  const handleRegister = async () => {
    if (!session || !event) return;

    setRegistering(true);
    const res = await apiToggleRegisterEvent(session, event.id);
    setRegistering(false);

    if (res.data) {
      setEvent((prev) =>
        prev
          ? {
              ...prev,
              registered_by_user: res.data!.registered,
              attendees_count: res.data!.attendees_count,
            }
          : null
      );

      if (res.data.registered) {
        Alert.alert('RSVP Confirmed', 'You are registered for this event. We look forward to being together!');
      } else {
        Alert.alert('RSVP Cancelled', 'Your registration has been cancelled.');
      }
    }
  };

  const handleOpenLink = () => {
    if (event?.meeting_link) {
      Linking.openURL(event.meeting_link).catch(() =>
        Alert.alert('Link Error', 'Unable to open event meeting link.')
      );
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Palette.gold} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.safe}>
        <Screen>
          <AppHeader title="Event Not Found" back />
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>This event could not be loaded.</Text>
          </Card>
        </Screen>
      </SafeAreaView>
    );
  }

  const dateObj = new Date(event.event_date);
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <SafeAreaView style={styles.safe}>
      <Screen>
        <AppHeader title="Gathering Details" subtitle={event.is_online ? 'Online Event' : 'In-Person Event'} back />

        <Card style={styles.eventMainCard}>
          <View style={styles.headerPillsRow}>
            {event.is_online ? (
              <Pill>ONLINE SANCTUARY</Pill>
            ) : (
              <View style={styles.inPersonPill}>
                <Text style={styles.inPersonText}>IN-PERSON GATHERING</Text>
              </View>
            )}
            <Text style={styles.attendeesBadge}>👥 {event.attendees_count} Attending</Text>
          </View>

          <Text style={styles.title}>{event.title}</Text>

          {/* Date & Location Grid */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>📅</Text>
              <View>
                <Text style={styles.detailLabel}>Date & Day</Text>
                <Text style={styles.detailValue}>{formattedDate}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>⏰</Text>
              <View>
                <Text style={styles.detailLabel}>Time</Text>
                <Text style={styles.detailValue}>{event.time_str}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>📍</Text>
              <View>
                <Text style={styles.detailLabel}>Location / Venue</Text>
                <Text style={styles.detailValue}>{event.location}</Text>
              </View>
            </View>
          </View>

          <SectionTitle>About This Gathering</SectionTitle>
          <Text style={styles.description}>{event.description}</Text>

          {event.is_online && event.meeting_link && event.registered_by_user && (
            <Pressable style={styles.joinLinkBtn} onPress={handleOpenLink}>
              <Text style={styles.joinLinkText}>🔗 Open Online Meeting Link</Text>
            </Pressable>
          )}

          {/* RSVP Action Button */}
          <Pressable
            style={[styles.rsvpBtn, event.registered_by_user && styles.rsvpBtnDone]}
            onPress={handleRegister}
            disabled={registering}
          >
            {registering ? (
              <ActivityIndicator color={Palette.surface} />
            ) : (
              <Text style={[styles.rsvpBtnText, event.registered_by_user && styles.rsvpBtnTextDone]}>
                {event.registered_by_user ? '✓ Confirmed (Tap to Cancel RSVP)' : 'Confirm RSVP / Register Now'}
              </Text>
            )}
          </Pressable>
        </Card>
      </Screen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.ivory },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorCard: { padding: 20, alignItems: 'center' },
  errorText: { color: Palette.danger, fontSize: 16 },

  eventMainCard: { gap: 14, padding: 20 },
  headerPillsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  inPersonPill: { backgroundColor: '#E0F2FE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  inPersonText: { color: '#0369A1', fontSize: 11, fontWeight: '800' },
  attendeesBadge: { color: Palette.stone, fontSize: 13, fontWeight: '600' },

  title: { color: Palette.charcoal, fontFamily: 'serif', fontSize: 24, fontWeight: '700', lineHeight: 30 },

  detailsGrid: { gap: 12, backgroundColor: Palette.ivory, padding: 14, borderRadius: 16, marginVertical: 4 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  detailIcon: { fontSize: 20 },
  detailLabel: { color: Palette.stone, fontSize: 11, fontWeight: '600' },
  detailValue: { color: Palette.charcoal, fontSize: 14, fontWeight: '700' },

  description: { color: Palette.charcoal, fontSize: 15, lineHeight: 22 },

  joinLinkBtn: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#6366F1',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    marginVertical: 4,
  },
  joinLinkText: { color: '#4338CA', fontSize: 14, fontWeight: '700' },

  rsvpBtn: {
    backgroundColor: Palette.goldDark,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  rsvpBtnDone: { backgroundColor: '#059669' },
  rsvpBtnText: { color: Palette.surface, fontSize: 16, fontWeight: '700' },
  rsvpBtnTextDone: { color: Palette.surface },
});
