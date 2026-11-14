import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader, Card, Screen, ui } from '@/components/karma-ui';
import { Palette } from '@/constants/theme';
import { useSession } from '@/context/auth-context';
import { apiGetProfile, apiUpdateProfile } from '@/services/api';

export default function EditProfileScreen() {
  const { session, user, updateUser } = useSession();

  // Pre-fill from auth context immediately — API call will overwrite with full data
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [age, setAge] = useState<number | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session) return;
    apiGetProfile(session).then((res) => {
      if (res.data) {
        setName(res.data.name ?? user?.name ?? '');
        setPhone(res.data.phone_number ?? '');
        setDob(res.data.date_of_birth?.slice(0, 10) ?? '');
        setAge(res.data.age ?? null);
      }
      // Always hide the loading indicator regardless of success/fail
      setProfileLoading(false);
    });
  }, [session]);

  const handleSave = async () => {
    if (!session) return;
    setError('');
    setSaving(true);

    const res = await apiUpdateProfile(session, {
      name: name.trim(),
      phoneNumber: phone.trim(),
      dateOfBirth: dob,
    });

    setSaving(false);

    if (res.error) {
      setError(res.error);
    } else {
      if (res.data?.age !== undefined) setAge(res.data.age);
      // Update the name in the auth context so Account screen reflects it immediately
      updateUser({ name: name.trim() });
      // Go back to Account screen
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Screen>
          <AppHeader title="Edit Profile" subtitle="Update your personal details." back />

          {/* Profile header */}
          <Card style={styles.headerCard}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>
                {(name || user?.email || 'S')[0].toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={styles.headerName}>{name || 'Your Name'}</Text>
              <Text style={ui.small}>{user?.email}</Text>
              {age !== null && (
                <View style={styles.ageBadge}>
                  <Text style={styles.ageBadgeText}>{age} years old</Text>
                </View>
              )}
            </View>
          </Card>

          {/* Form — always visible; fields show loading shimmer while fetching */}
          <Card style={styles.formCard}>
            <Text style={styles.sectionEyebrow}>PERSONAL DETAILS</Text>
            <Text style={styles.sectionTitle}>Basic information</Text>

            {/* Subtle loading indicator while profile data fetches */}
            {profileLoading && (
              <View style={styles.fetchingRow}>
                <ActivityIndicator size="small" color={Palette.gold} />
                <Text style={styles.fetchingText}>Loading your details…</Text>
              </View>
            )}

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Full name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                autoComplete="name"
                returnKeyType="next"
                placeholder="Your full name"
                placeholderTextColor={Palette.stoneLight}
                maxLength={100}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email address</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={user?.email ?? ''}
                editable={false}
                selectTextOnFocus={false}
              />
              <Text style={[ui.small, { marginTop: 4 }]}>Email cannot be changed.</Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Phone number</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoComplete="tel"
                placeholder="Include country code if needed"
                placeholderTextColor={Palette.stoneLight}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Date of birth</Text>
              <TextInput
                style={styles.input}
                value={dob}
                onChangeText={setDob}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Palette.stoneLight}
                keyboardType="numeric"
                maxLength={10}
              />
              <Text style={[ui.small, { marginTop: 4 }]}>
                Your age is calculated from this date.
              </Text>
            </View>

            {error !== '' && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={15} color={Palette.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Pressable
              style={[styles.saveBtn, (saving || profileLoading) && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving || profileLoading}
            >
              {saving ? (
                <ActivityIndicator color={Palette.surface} />
              ) : (
                <Text style={styles.saveBtnText}>Save profile</Text>
              )}
            </Pressable>
          </Card>
        </Screen>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.ivory },

  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Palette.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Palette.gold,
    flexShrink: 0,
  },
  avatarInitials: {
    color: Palette.goldDark,
    fontFamily: 'serif',
    fontSize: 24,
    fontWeight: '700',
  },
  headerName: {
    color: Palette.charcoal,
    fontFamily: 'serif',
    fontSize: 20,
    fontWeight: '700',
  },
  ageBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Palette.goldSoft,
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 2,
    marginTop: 2,
  },
  ageBadgeText: { color: Palette.goldDark, fontSize: 11, fontWeight: '700' },

  formCard: { gap: 16 },
  sectionEyebrow: {
    color: Palette.goldDark,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  sectionTitle: {
    color: Palette.charcoal,
    fontFamily: 'serif',
    fontSize: 20,
    fontWeight: '700',
    marginTop: -8,
  },

  fetchingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Palette.goldSoft,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  fetchingText: { color: Palette.goldDark, fontSize: 13, fontWeight: '600' },

  fieldGroup: { gap: 6 },
  fieldLabel: { color: Palette.charcoal, fontSize: 14, fontWeight: '700' },
  input: {
    backgroundColor: Palette.ivory,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Palette.line,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: Palette.charcoal,
    fontSize: 15,
  },
  inputDisabled: { color: Palette.stone, backgroundColor: '#F5F4F0' },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 10,
  },
  errorText: { color: Palette.danger, fontSize: 13, flex: 1 },

  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#D1FAE5',
    borderRadius: 10,
    padding: 10,
  },
  noticeText: { color: '#065F46', fontSize: 13, fontWeight: '700', flex: 1 },

  saveBtn: {
    backgroundColor: Palette.charcoal,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: Palette.surface, fontSize: 15, fontWeight: '700' },
});
