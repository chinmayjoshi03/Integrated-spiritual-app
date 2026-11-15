import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { View } from 'react-native';

import { EventCard } from '@/components/connect-cards';
import { ActionButton, AppHeader, EmptyState, Loading, Screen } from '@/components/karma-ui';
import { useSession } from '@/context/auth-context';
import { type EventItem, apiGetMyEvents } from '@/services/api';

export default function MyEventsScreen() {
  const { session } = useSession();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!session) return;
    const res = await apiGetMyEvents(session);
    if (res.error) setError(res.error);
    else { setError(''); setEvents((res.data ?? []).map((e) => ({ ...e, is_registered: true }))); }
    setLoading(false);
  }, [session]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  return <Screen>
    <AppHeader title="My Events" back />
    {loading ? <Loading /> : error ? (
      <EmptyState icon="alert-circle-outline" title="Unable to load your events" message={error} action={<ActionButton variant="outline" label="Try again" onPress={() => { setLoading(true); void load(); }} />} />
    ) : events.length === 0 ? (
      <EmptyState icon="calendar-outline" title="No registered events yet" message="Browse upcoming gatherings and register to see them here." action={<ActionButton label="Browse events" onPress={() => router.replace('/connect?segment=events' as any)} />} />
    ) : (
      <View style={{ gap: 14 }}>{events.map((e) => <EventCard key={e.id} event={e} />)}</View>
    )}
  </Screen>;
}
