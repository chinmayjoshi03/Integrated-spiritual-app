import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { DateField } from '@/components/date-field';
import { ActionButton, AppHeader, Avatar, Card, Eyebrow, Field, Loading, Notice, Screen, ui } from '@/components/karma-ui';
import { BrandFonts, Palette } from '@/constants/theme';
import { useSession } from '@/context/auth-context';
import { removeProfilePhoto, saveProfilePhoto, useProfilePhoto } from '@/context/profile-photo';
import { apiGetProfile, apiUpdateProfile } from '@/services/api';

const PHONE_RE = /^\+?\d{7,15}$/;
const normalisePhone = (v: string) => v.replace(/[\s()-]/g, '');

export default function EditProfileScreen() {
  const { required } = useLocalSearchParams<{ required?: string }>();
  const mustComplete = required === '1';
  const { session, user, updateUser, signOut } = useSession();
  const photo = useProfilePhoto();

  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phoneNumber ?? '');
  const [dob, setDob] = useState(user?.dateOfBirth?.slice(0, 10) ?? '');
  const [age, setAge] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [photoError, setPhotoError] = useState('');

  useEffect(() => {
    if (!session) return;
    void apiGetProfile(session).then((res) => {
      if (res.data) {
        setName(res.data.name ?? '');
        setPhone(res.data.phone_number ?? '');
        setDob(res.data.date_of_birth?.slice(0, 10) ?? '');
        setAge(res.data.age ?? null);
      }
      setLoading(false);
    });
  }, [session]);

  const pickPhoto = async () => {
    setPhotoError('');
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return setPhotoError('Allow photo access in Settings to choose a profile picture.');
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (result.canceled || !result.assets?.[0]) return;
    try {
      await saveProfilePhoto(result.assets[0].uri);
    } catch {
      setPhotoError('Could not save this photo. Please try another one.');
    }
  };

  const photoOptions = () => {
    if (!photo) return void pickPhoto();
    Alert.alert('Profile photo', undefined, [
      { text: 'Choose a new photo', onPress: () => void pickPhoto() },
      { text: 'Remove photo', style: 'destructive', onPress: () => void removeProfilePhoto() },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const save = async () => {
    if (!session) return;
    setError('');
    const cleanPhone = normalisePhone(phone);
    if (!name.trim()) return setError('Please enter your name.');
    if (!PHONE_RE.test(cleanPhone)) return setError('Enter a valid phone number (7–15 digits, optional +).');
    if (!dob) return setError('Please choose your date of birth.');
    setSaving(true);
    const res = await apiUpdateProfile(session, { name: name.trim(), phoneNumber: cleanPhone, dateOfBirth: dob });
    setSaving(false);
    if (res.error || !res.data) return setError(res.error ?? 'Could not save your profile.');
    updateUser({ name: res.data.name, phoneNumber: res.data.phone_number, dateOfBirth: res.data.date_of_birth, profileComplete: true });
    if (mustComplete) router.replace('/');
    else router.back();
  };

  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <Screen>
      <AppHeader title={mustComplete ? 'Complete your profile' : 'Edit profile'} back={!mustComplete} />

      {mustComplete ? <Notice tone="info">Please add your phone number and date of birth to continue.</Notice> : null}

      <Card style={styles.photoCard}>
        <Pressable onPress={photoOptions} accessibilityRole="button" accessibilityLabel="Change profile photo">
          <Avatar name={name || user?.email} size={96} />
          <View style={styles.cameraBadge}><Ionicons name="camera" size={16} color={Palette.onAccent} /></View>
        </Pressable>
        <Text style={styles.name}>{name || 'Your name'}</Text>
        <Text style={ui.small}>{user?.email}</Text>
        {age !== null ? <Text style={ui.small}>{age} years old</Text> : null}
        <Text style={styles.photoHint}>The photo is stored on this device only.</Text>
        {photoError ? <Notice tone="error">{photoError}</Notice> : null}
      </Card>

      <Card>
        <Eyebrow>PERSONAL DETAILS</Eyebrow>
        {loading ? <Loading label="Loading your details…" /> : <>
          <Field label="Full name" value={name} onChangeText={setName} autoComplete="name" placeholder="Your full name" maxLength={120} />
          <Field label="Email" value={user?.email ?? ''} editable={false} hint="Email can't be changed." />
          <Field label="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" placeholder="+91 98765 43210" />
          <DateField label="Date of birth" value={dob} onChange={setDob} maximumDate={new Date()} placeholder="Choose your date of birth" />
        </>}
        {error ? <Notice tone="error">{error}</Notice> : null}
        <ActionButton label="Save changes" onPress={save} loading={saving} disabled={loading} />
        {mustComplete ? <ActionButton variant="quiet" label="Sign out" onPress={signOut} /> : null}
      </Card>
    </Screen>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  photoCard: { alignItems: 'center', gap: 6 },
  cameraBadge: { position: 'absolute', right: 0, bottom: 0, width: 32, height: 32, borderRadius: 16, backgroundColor: Palette.gold, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Palette.surface },
  name: { fontFamily: BrandFonts.heading, fontSize: 22, color: Palette.charcoal, marginTop: 8 },
  photoHint: { fontFamily: BrandFonts.body, fontSize: 12, color: Palette.stoneLight },
});
