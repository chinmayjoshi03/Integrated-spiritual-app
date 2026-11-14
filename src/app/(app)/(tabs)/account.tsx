import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  AppHeader,
  AppIcon,
  Card,
  ListItem,
  Screen,
  SectionTitle,
  ui,
} from '@/components/karma-ui';
import { Palette } from '@/constants/theme';
import { useSession } from '@/context/auth-context';
import {
  type DonationRecord,
  type MyVolunteerApplication,
  apiGetMyDonations,
  apiGetMyVolunteering,
} from '@/services/api';

const STATIC_LINKS = [
  { label: 'Edit Profile',   route: '/edit-profile',   icon: 'settings'  },
  { label: 'Saved Items',    route: '/bookmarks',       icon: 'heart'     },
  { label: 'My Orders',      route: '/shop/orders',     icon: 'practice'  },
  { label: 'Notifications',  route: '/notifications',   icon: 'bell'      },
  { label: 'Help & Support', route: '/help',            icon: 'spark'     },
] as const;

export default function AccountScreen() {
  const { user, session, signOut } = useSession();

  const name = user?.name || user?.email?.split('@')[0] || 'Seeker';
  const initials = name
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const memberSince = (user as any)?.created_at
    ? new Date((user as any).created_at).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : 'Recently joined';

  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [volunteering, setVolunteering] = useState<MyVolunteerApplication[]>([]);

  useEffect(() => {
    if (!session) return;
    Promise.allSettled([
      apiGetMyDonations(session),
      apiGetMyVolunteering(session),
    ]).then(([donRes, volRes]) => {
      if (donRes.status === 'fulfilled' && donRes.value.data)
        setDonations(donRes.value.data.donations);
      if (volRes.status === 'fulfilled' && volRes.value.data)
        setVolunteering(volRes.value.data.applications);
    });
  }, [session]);

  // Build the history rows with live counts
  const HISTORY_LINKS = [
    {
      label: 'My Donations',
      subtitle: donations.length > 0 ? `${donations.length} donation${donations.length !== 1 ? 's' : ''}` : 'No donations yet',
      icon: <Ionicons name="heart-outline" size={20} color={Palette.goldDark} />,
      route: '/give' as const,
    },
    {
      label: 'My Seva & Volunteering',
      subtitle: volunteering.length > 0 ? `${volunteering.length} application${volunteering.length !== 1 ? 's' : ''}` : 'No applications yet',
      icon: <Ionicons name="hand-left-outline" size={20} color={Palette.goldDark} />,
      route: '/connect' as const,
    },
  ];

  return (
    <Screen>
      <AppHeader title="Account" subtitle="Your personal sanctuary" />

      {/* ── Identity card: initials only, no app logo ── */}
      <Card style={styles.identityCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.initialsText}>{initials}</Text>
        </View>
        <View style={styles.identityCopy}>
          <Text style={styles.userName}>{name}</Text>
          <Text style={ui.small}>{user?.email}</Text>
          <View style={styles.memberBadge}>
            <Text style={styles.memberBadgeText}>Member since {memberSince}</Text>
          </View>
        </View>
      </Card>

      {/* ── Your account links ── */}
      <SectionTitle>Your account</SectionTitle>
      <Card style={styles.linksCard}>
        {STATIC_LINKS.map((l, idx) => (
          <ListItem
            key={l.route}
            icon={<AppIcon name={l.icon} active />}
            title={l.label}
            onPress={() => router.push(l.route as any)}
            last={idx === STATIC_LINKS.length - 1}
          />
        ))}
      </Card>

      {/* ── History items inside a card, same visual style ── */}
      <SectionTitle>History</SectionTitle>
      <Card style={styles.linksCard}>
        {HISTORY_LINKS.map((l, idx) => (
          <ListItem
            key={l.label}
            icon={l.icon}
            title={l.label}
            subtitle={l.subtitle}
            onPress={() => router.push(l.route as any)}
            last={idx === HISTORY_LINKS.length - 1}
          />
        ))}
      </Card>

      {/* ── Sign out ── */}
      <Pressable style={styles.signOutBtn} onPress={signOut}>
        <Ionicons name="log-out-outline" size={18} color={Palette.danger} />
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>

      <Text style={styles.version}>Karma Vajra · v1.0.0</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  identityCard: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Palette.goldSoft,
    borderWidth: 2,
    borderColor: Palette.gold,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  initialsText: {
    color: Palette.goldDark,
    fontFamily: 'serif',
    fontSize: 26,
    fontWeight: '700',
  },
  identityCopy: { flex: 1, gap: 4 },
  userName: { color: Palette.charcoal, fontFamily: 'serif', fontSize: 22, fontWeight: '700' },
  memberBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Palette.goldSoft,
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 3,
    marginTop: 2,
  },
  memberBadgeText: { color: Palette.goldDark, fontSize: 11, fontWeight: '700' },

  linksCard: { gap: 0, paddingVertical: 6 },

  signOutBtn: {
    minHeight: 52,
    borderRadius: 17,
    backgroundColor: Palette.blush,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  signOutText: { color: Palette.danger, fontSize: 16, fontWeight: '800' },

  version: { color: Palette.stoneLight, fontSize: 12, textAlign: 'center', paddingBottom: 8 },
});
