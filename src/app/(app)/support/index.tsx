import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ActionButton, AppHeader, Card, ChipRow, EmptyState, Loading, Screen, StatusBadge, ui } from '@/components/karma-ui';
import { BrandFonts, Palette } from '@/constants/theme';
import { useSession } from '@/context/auth-context';
import { supportStatusLabel, timeAgo } from '@/lib/lifecycle';
import { type SupportStatus, type SupportTicket, apiGetMySupportTickets } from '@/services/api';

type Filter = 'all' | SupportStatus;
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'waiting_for_user', label: 'Waiting for you' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'closed', label: 'Closed' },
];

export default function MySupportScreen() {
  const { session } = useSession();
  const [filter, setFilter] = useState<Filter>('all');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!session) return;
    const res = await apiGetMySupportTickets(session, filter === 'all' ? undefined : filter);
    if (res.error) setError(res.error);
    else { setError(''); setTickets(res.data ?? []); }
    setLoading(false);
  }, [session, filter]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  return <Screen>
    <AppHeader title="My Support" back action={
      <Pressable onPress={() => router.push('/support/new' as any)} style={styles.newBtn} accessibilityRole="button" accessibilityLabel="New support request">
        <Ionicons name="add" size={22} color={Palette.onAccent} />
      </Pressable>
    } />
    <ChipRow options={FILTERS} value={filter} onChange={(f) => { setLoading(true); setFilter(f); }} />
    {loading ? <Loading /> : error ? (
      <EmptyState icon="alert-circle-outline" title="Unable to load requests" message={error} action={<ActionButton variant="outline" label="Try again" onPress={() => { setLoading(true); void load(); }} />} />
    ) : tickets.length === 0 ? (
      <EmptyState icon="chatbox-ellipses-outline" title="No support requests" message="Need help with something? Our team is here for you." action={<ActionButton icon="add" label="Create a request" onPress={() => router.push('/support/new' as any)} />} />
    ) : (
      <View style={{ gap: 10 }}>
        {tickets.map((t) => <Pressable key={t.id} onPress={() => router.push(`/support/${t.id}` as any)} accessibilityRole="button">
          <Card style={{ gap: 6 }}>
            <View style={styles.top}>
              <Text style={styles.number}>{t.ticket_number}</Text>
              <StatusBadge status={t.status} label={supportStatusLabel(t.status)} />
            </View>
            <Text style={styles.subject} numberOfLines={2}>{t.subject}</Text>
            <Text style={ui.small}>{t.category_name || 'General'} · Updated {timeAgo(t.updated_at)}</Text>
          </Card>
        </Pressable>)}
      </View>
    )}
  </Screen>;
}

const styles = StyleSheet.create({
  newBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Palette.gold, alignItems: 'center', justifyContent: 'center' },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  number: { fontFamily: BrandFonts.bodySemi, fontSize: 12, color: Palette.stoneLight, letterSpacing: 0.5 },
  subject: { fontFamily: BrandFonts.bodySemi, fontSize: 16, color: Palette.charcoal },
});
