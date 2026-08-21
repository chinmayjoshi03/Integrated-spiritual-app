import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';

import { useSession } from '@/context/auth-context';
import { Colors, Spacing, BottomTabInset } from '@/constants/theme';

export default function HomeScreen() {
  const { signOut, user, session } = useSession();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  const displayName = user?.name || user?.email?.split('@')[0] || 'Seeker';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea}>
        {/* Welcome Section */}
        <View style={styles.heroSection}>
          <Text style={styles.emoji}>🙏</Text>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>Namaste</Text>
          <Text style={[styles.name, { color: colors.text }]}>{displayName}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            May your journey be filled with light
          </Text>
        </View>

        {/* Info Card */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.backgroundElement },
          ]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Your Profile</Text>
          {user?.email && (
            <View style={styles.cardRow}>
              <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Email</Text>
              <Text style={[styles.cardValue, { color: colors.text }]}>{user.email}</Text>
            </View>
          )}
          {user?.name && (
            <View style={styles.cardRow}>
              <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Name</Text>
              <Text style={[styles.cardValue, { color: colors.text }]}>{user.name}</Text>
            </View>
          )}
          <View style={styles.cardRow}>
            <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Status</Text>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Connected</Text>
            </View>
          </View>
        </View>

        {/* Sign Out */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={signOut}
          activeOpacity={0.8}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.three,
    alignItems: 'center',
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: Spacing.one,
  },
  emoji: {
    fontSize: 56,
    marginBottom: Spacing.two,
  },
  greeting: {
    fontSize: 16,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  name: {
    fontSize: 32,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 15,
    marginTop: Spacing.one,
  },
  card: {
    alignSelf: 'stretch',
    borderRadius: 16,
    padding: Spacing.four,
    gap: Spacing.three,
    marginBottom: Spacing.four,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.one,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: 14,
  },
  cardValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '500',
  },
  signOutButton: {
    alignSelf: 'stretch',
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  signOutText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '600',
  },
});
