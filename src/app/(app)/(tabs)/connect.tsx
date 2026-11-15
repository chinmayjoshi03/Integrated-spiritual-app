import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CommunityGroupCard, EventCard, VolunteerCard } from '@/components/connect-cards';
import {
  AppHeader,
  ChipRow,
  EmptyState,
  Loading,
  Notice,
  SearchField,
  SectionTitle,
  Segmented,
} from '@/components/karma-ui';
import { BrandFonts, Palette } from '@/constants/theme';
import { useAppPreferences } from '@/context/app-preferences';
import { useSession } from '@/context/auth-context';
import {
  type CommunityGroup,
  type EventItem,
  type VolunteerOpportunity,
  apiGetCommunityGroups,
  apiGetEvents,
  apiGetVolunteerOpportunities,
  apiJoinCommunityGroup,
} from '@/services/api';
import { SafeAreaView } from 'react-native-safe-area-context';

type Section = 'community' | 'events' | 'volunteering';
type VolunteerType = 'all' | 'online' | 'offline';

const SECTIONS: { key: Section; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { key: 'community', label: 'Community', icon: 'people-outline' },
  { key: 'events', label: 'Events', icon: 'calendar-outline' },
  { key: 'volunteering', label: 'Volunteering', icon: 'heart-outline' },
];

export default function ConnectScreen() {
  const params = useLocalSearchParams<{ segment?: string }>();
  const [section, setSection] = useState<Section>('community');

  // Allow deep links like /connect?segment=volunteering
  useEffect(() => {
    if (params.segment === 'events' || params.segment === 'volunteering' || params.segment === 'community') {
      setSection(params.segment);
    }
  }, [params.segment]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.fixedTop}>
        <AppHeader title="Connect" />
        <Segmented options={SECTIONS} value={section} onChange={setSection} />
      </View>
      {section === 'community' ? <CommunitySection /> : null}
      {section === 'events' ? <EventsSection /> : null}
      {section === 'volunteering' ? <VolunteeringSection /> : null}
    </SafeAreaView>
  );
}

/** Scroll container with pull-to-refresh, shared by the three sections. */
function SectionScroll({ children, refreshing, onRefresh }: { children: React.ReactNode; refreshing: boolean; onRefresh: () => void }) {
  return <ScrollView
    contentContainerStyle={styles.scroll}
    keyboardShouldPersistTaps="handled"
    showsVerticalScrollIndicator={false}
    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Palette.gold} />}
  >
    {children}
  </ScrollView>;
}

// ── Community ────────────────────────────────────────────────────────────────

function CommunitySection() {
  const { session } = useSession();
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [joiningId, setJoiningId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    setError('');
    const g = await apiGetCommunityGroups(session);
    if (g.error) setError(g.error);
    setGroups(g.data ?? []);
    setLoading(false);
    setRefreshing(false);
  }, [session]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const handleJoin = async (group: CommunityGroup) => {
    if (!session || joiningId) return;
    setJoiningId(group.id);
    setError('');
    const res = await apiJoinCommunityGroup(session, group.id);
    setJoiningId(null);
    if (res.error) {
      setError(res.error);
      return;
    }
    setGroups((prev) => prev.map((g) => (g.id === group.id ? { ...g, is_member: true, member_count: (g.member_count ?? 0) + 1 } : g)));
    router.push(`/community/group/${group.id}` as any);
  };

  const query = search.trim().toLowerCase();
  const visibleGroups = useMemo(() => groups.filter((g) =>
    !query || [g.name, g.description, g.category].some((v) => v?.toLowerCase().includes(query))
  ), [groups, query]);
  const joined = visibleGroups.filter((g) => g.is_member);
  const others = visibleGroups.filter((g) => !g.is_member);

  return <SectionScroll refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }}>

    {error ? <Notice tone="error">{error}</Notice> : null}

    {loading ? <Loading /> : (
      <>
        <SearchField value={search} onChangeText={setSearch} placeholder="Search communities" />
        {visibleGroups.length === 0 ? (
          <EmptyState icon="people-outline" title={query ? 'No communities match that search' : 'No communities yet'} message={query ? 'Try a different word.' : 'Communities will appear here once they are created.'} />
        ) : null}
        {joined.length > 0 ? <>
          <SectionTitle>Your communities</SectionTitle>
          <View style={styles.list}>{joined.map((g) => <CommunityGroupCard key={g.id} group={g} onJoin={() => handleJoin(g)} />)}</View>
        </> : null}
        {others.length > 0 ? <>
          <SectionTitle>Find your circle</SectionTitle>
          <View style={styles.list}>{others.map((g) => <CommunityGroupCard key={g.id} group={g} busy={joiningId === g.id} onJoin={() => handleJoin(g)} />)}</View>
        </> : null}
      </>
    )}
  </SectionScroll>;
}

// ── Events ───────────────────────────────────────────────────────────────────

function EventsSection() {
  const { session } = useSession();
  const { showOnlineEventsFirst } = useAppPreferences();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!session) return;
    setError('');
    const res = await apiGetEvents(session);
    if (res.error) setError(res.error);
    setEvents(res.data ?? []);
    setLoading(false);
    setRefreshing(false);
  }, [session]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const ordered = useMemo(() => {
    if (!showOnlineEventsFirst) return events;
    return events
      .map((event, index) => ({ event, index }))
      .sort((a, b) => Number(b.event.event_type === 'online') - Number(a.event.event_type === 'online') || a.index - b.index)
      .map(({ event }) => event);
  }, [events, showOnlineEventsFirst]);

  return <SectionScroll refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }}>
    <Pressable style={styles.linkCard} onPress={() => router.push('/events/my' as any)} accessibilityRole="button">
      <Ionicons name="bookmark-outline" size={20} color={Palette.goldDark} />
      <Text style={styles.linkCardText}>My events</Text>
      <Ionicons name="chevron-forward" size={18} color={Palette.goldDark} />
    </Pressable>
    {error ? <Notice tone="error">{error}</Notice> : null}
    {loading ? <Loading /> : ordered.length === 0 ? (
      <EmptyState icon="calendar-outline" title="No upcoming events" message="New gatherings will appear here." />
    ) : (
      <View style={styles.list}>{ordered.map((e) => <EventCard key={e.id} event={e} />)}</View>
    )}
  </SectionScroll>;
}

// ── Volunteering ─────────────────────────────────────────────────────────────

function VolunteeringSection() {
  const { session } = useSession();
  const [items, setItems] = useState<VolunteerOpportunity[]>([]);
  const [search, setSearch] = useState('');
  const [type, setType] = useState<VolunteerType>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!session) return;
    setError('');
    const res = await apiGetVolunteerOpportunities(session, {
      search: search.trim() || undefined,
      volunteer_type: type === 'all' ? '' : type,
    });
    if (res.error) setError(res.error);
    setItems(res.data ?? []);
    setLoading(false);
    setRefreshing(false);
  }, [session, search, type]);

  // Debounce search typing.
  useEffect(() => {
    const timer = setTimeout(() => { void load(); }, 300);
    return () => clearTimeout(timer);
  }, [load]);
  // Reload when returning to the tab so application status stays fresh
  // (via a ref, so typing doesn't also trigger this).
  const loadRef = useRef(load);
  loadRef.current = load;
  const firstFocus = useRef(true);
  useFocusEffect(useCallback(() => {
    if (firstFocus.current) { firstFocus.current = false; return; }
    void loadRef.current();
  }, []));

  return <SectionScroll refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }}>
    <Pressable style={styles.linkCard} onPress={() => router.push('/volunteering/my' as any)} accessibilityRole="button">
      <Ionicons name="hand-left-outline" size={20} color={Palette.goldDark} />
      <Text style={styles.linkCardText}>My volunteering</Text>
      <Ionicons name="chevron-forward" size={18} color={Palette.goldDark} />
    </Pressable>
    <SearchField value={search} onChangeText={setSearch} placeholder="Search opportunities" />
    <ChipRow
      options={[{ key: 'all', label: 'All' }, { key: 'online', label: 'Online' }, { key: 'offline', label: 'Offline' }]}
      value={type}
      onChange={setType}
    />
    {error ? <Notice tone="error">{error}</Notice> : null}
    {loading ? <Loading /> : items.length === 0 ? (
      <EmptyState icon="heart-outline" title="No published opportunities" message="Check back soon for new ways to serve." />
    ) : (
      <View style={styles.list}>{items.map((o) => <VolunteerCard key={o.id} opportunity={o} />)}</View>
    )}
  </SectionScroll>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.ivory },
  fixedTop: { paddingHorizontal: 16, paddingTop: 8, gap: 12, paddingBottom: 10, backgroundColor: Palette.ivory, width: '100%', maxWidth: 760, alignSelf: 'center' },
  scroll: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 118, gap: 16, width: '100%', maxWidth: 760, alignSelf: 'center' },
  list: { gap: 14 },
  linkCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.line, borderRadius: 16, paddingHorizontal: 16, minHeight: 52 },
  linkCardText: { flex: 1, fontFamily: BrandFonts.bodySemi, fontSize: 15, color: Palette.charcoal },
});
