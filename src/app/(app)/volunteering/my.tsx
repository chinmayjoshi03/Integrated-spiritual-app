import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';

import { VolunteerCard } from '@/components/connect-cards';
import { ActionButton, AppHeader, ChipRow, EmptyState, Loading, Notice, Screen } from '@/components/karma-ui';
import { useSession } from '@/context/auth-context';
import { shareVolunteerCertificate } from '@/lib/documents';
import { type VolunteerApplicationStatus, type VolunteerOpportunity, apiGetMyVolunteering } from '@/services/api';

type Filter = 'all' | VolunteerApplicationStatus;
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'applied', label: 'Applied' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'completed', label: 'Completed' },
];

export default function MyVolunteeringScreen() {
  const { session } = useSession();
  const [items, setItems] = useState<VolunteerOpportunity[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [certError, setCertError] = useState('');
  const [certBusyId, setCertBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    const res = await apiGetMyVolunteering(session);
    if (res.error) setError(res.error);
    else { setError(''); setItems(res.data ?? []); }
    setLoading(false);
  }, [session]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const filtered = useMemo(
    () => (filter === 'all' ? items : items.filter((i) => i.application_status === filter)),
    [items, filter]
  );

  const download = async (applicationId: number) => {
    if (!session) return;
    setCertBusyId(applicationId);
    setCertError('');
    const err = await shareVolunteerCertificate(session, applicationId);
    setCertBusyId(null);
    if (err) setCertError(err);
  };

  return <Screen>
    <AppHeader title="My Volunteering" back />
    <ChipRow options={FILTERS} value={filter} onChange={setFilter} />
    {certError ? <Notice tone="error">{certError}</Notice> : null}

    {loading ? <Loading /> : error ? (
      <EmptyState icon="alert-circle-outline" title="Unable to load your applications" message={error} action={<ActionButton variant="outline" label="Try again" onPress={() => { setLoading(true); void load(); }} />} />
    ) : filtered.length === 0 ? (
      <EmptyState
        icon="heart-outline"
        title={filter === 'all' ? 'No applications yet' : `No ${filter} applications`}
        message="Browse opportunities to offer your time and skills."
        action={<ActionButton label="Browse opportunities" onPress={() => router.replace('/connect?segment=volunteering' as any)} />}
      />
    ) : (
      <View style={{ gap: 14 }}>
        {filtered.map((o) => <View key={o.application_id ?? o.id} style={{ gap: 8 }}>
          <VolunteerCard opportunity={o} showApplication />
          {o.certificate_status === 'available' && o.application_id
            ? <ActionButton variant="outline" icon="ribbon-outline" label="Download certificate (PDF)" loading={certBusyId === o.application_id} onPress={() => download(o.application_id!)} />
            : null}
        </View>)}
      </View>
    )}
  </Screen>;
}
