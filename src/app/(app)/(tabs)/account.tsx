import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader, Avatar, Card, type IoniconName, ListItem, Screen, SectionTitle, ui } from '@/components/karma-ui';
import { Brand, BrandFonts, Palette } from '@/constants/theme';
import { useSession } from '@/context/auth-context';
import { apiGetMyDonations, apiGetMyEvents, apiGetMyVolunteering } from '@/services/api';

type LinkRow = { label: string; route: string; icon: IoniconName; subtitle?: string };

const Icon = ({ name }: { name: IoniconName }) => <Ionicons name={name} size={20} color={Palette.goldDark} />;

export default function AccountScreen() {
  const { user, session, signOut } = useSession();
  const [counts, setCounts] = useState<{ donations?: number; events?: number; volunteering?: number }>({});

  useFocusEffect(useCallback(() => {
    if (!session) return;
    void Promise.all([apiGetMyDonations(session), apiGetMyEvents(session), apiGetMyVolunteering(session)]).then(([d, e, v]) => {
      setCounts({ donations: d.data?.donations.length, events: e.data?.length, volunteering: v.data?.length });
    });
  }, [session]));

  const name = user?.name || user?.email?.split('@')[0] || 'Member';
  const isDikshan = (user?.userCategory ?? user?.user_category) === 'dikshan';
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : null;
  const count = (n: number | undefined, one: string, many: string, empty: string) =>
    n === undefined ? undefined : n === 0 ? empty : `${n} ${n === 1 ? one : many}`;

  const profileLinks: LinkRow[] = [
    { label: 'Edit profile', route: '/edit-profile', icon: 'person-circle-outline', subtitle: 'Photo, name, phone and date of birth' },
    { label: 'My Journey', route: '/journey', icon: 'trail-sign-outline', subtitle: 'Your practice and learning at a glance' },
    { label: 'Settings', route: '/settings', icon: 'settings-outline', subtitle: 'Password, notifications and preferences' },
  ];
  const activityLinks: LinkRow[] = [
    { label: 'My Events', route: '/events/my', icon: 'calendar-outline', subtitle: count(counts.events, 'event', 'events', 'No registrations yet') },
    { label: 'My Volunteering', route: '/volunteering/my', icon: 'hand-left-outline', subtitle: count(counts.volunteering, 'application', 'applications', 'No applications yet') },
    { label: 'My Donations', route: '/give', icon: 'heart-outline', subtitle: count(counts.donations, 'donation', 'donations', 'No donations yet') },
    { label: 'My Orders', route: '/shop/orders', icon: 'bag-handle-outline' },
    { label: 'Saved items', route: '/bookmarks', icon: 'bookmark-outline' },
    { label: 'Notifications', route: '/notifications', icon: 'notifications-outline' },
  ];
  const supportLinks: LinkRow[] = [
    { label: 'Help centre', route: '/help', icon: 'help-buoy-outline', subtitle: 'FAQs and guides' },
    { label: 'Support tickets', route: '/support', icon: 'chatbox-ellipses-outline', subtitle: 'Raise and track requests' },
    { label: `About ${Brand.name}`, route: '/about', icon: 'information-circle-outline' },
  ];

  const confirmSignOut = () => Alert.alert('Sign out?', 'You will need to sign in again to continue.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Sign out', style: 'destructive', onPress: signOut },
  ]);

  return <Screen>
    <AppHeader title="Account" />

    <Card style={styles.identity}>
      <Avatar name={name} size={72} />
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={styles.name}>{name}</Text>
        <Text style={ui.small}>{user?.email}</Text>
        <View style={styles.badges}>
          {isDikshan ? <View style={styles.dikshan}><Ionicons name="sparkles" size={12} color={Palette.onAccent} /><Text style={styles.dikshanText}>DIKSHAN USER</Text></View> : null}
          {user?.role === 'mentor' ? <View style={styles.member}><Text style={styles.memberText}>MENTOR</Text></View> : null}
          {memberSince ? <View style={styles.member}><Text style={styles.memberText}>Member since {memberSince}</Text></View> : null}
        </View>
      </View>
    </Card>

    <Section title="Profile" rows={profileLinks} />
    <Section title="Your activity" rows={activityLinks} />
    <Section title="Help & information" rows={supportLinks} />

    <Pressable style={styles.signOut} onPress={confirmSignOut} accessibilityRole="button">
      <Ionicons name="log-out-outline" size={18} color={Palette.danger} />
      <Text style={styles.signOutText}>Sign out</Text>
    </Pressable>
    <Text style={styles.version}>{Brand.name} · {Brand.tagline} · v1.0.0</Text>
  </Screen>;
}

function Section({ title, rows }: { title: string; rows: LinkRow[] }) {
  return <>
    <SectionTitle>{title}</SectionTitle>
    <Card style={styles.links}>
      {rows.map((r, i) => <ListItem key={r.route} icon={<Icon name={r.icon} />} title={r.label} subtitle={r.subtitle} onPress={() => router.push(r.route as any)} last={i === rows.length - 1} />)}
    </Card>
  </>;
}

const styles = StyleSheet.create({
  identity: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  name: { fontFamily: BrandFonts.heading, fontSize: 22, color: Palette.charcoal },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  dikshan: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Palette.gold, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  dikshanText: { fontFamily: BrandFonts.bodySemi, fontSize: 10, letterSpacing: 0.8, color: Palette.onAccent },
  member: { backgroundColor: Palette.goldSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  memberText: { fontFamily: BrandFonts.bodyMedium, fontSize: 11, color: Palette.goldDark },
  links: { paddingVertical: 4, paddingHorizontal: 8, gap: 0 },
  signOut: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: Palette.dangerSoft, backgroundColor: Palette.surface },
  signOutText: { fontFamily: BrandFonts.bodySemi, fontSize: 15, color: Palette.danger },
  version: { fontFamily: BrandFonts.body, fontSize: 12, color: Palette.stoneLight, textAlign: 'center' },
});
