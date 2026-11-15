import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Switch, Text, View } from 'react-native';

import { DateField } from '@/components/date-field';
import { ActionButton, AppHeader, Card, Eyebrow, Field, Loading, Notice, Screen, ui } from '@/components/karma-ui';
import { BrandFonts, Palette } from '@/constants/theme';
import { updateAppPreferences, useAppPreferences } from '@/context/app-preferences';
import { useSession } from '@/context/auth-context';
import {
  type NotificationPreferences,
  apiChangePassword,
  apiGetNotificationPreferences,
  apiUpdateNotificationPreferences,
} from '@/services/api';

type ToggleKey = Exclude<keyof NotificationPreferences, 'daily_practice_reminder_time' | 'daily_practice_reminder_enabled'>;

const NOTIFICATION_OPTIONS: { key: ToggleKey; label: string; help: string }[] = [
  { key: 'event_notifications', label: 'Event updates', help: 'New events and event updates' },
  { key: 'community_notifications', label: 'Community activity', help: 'Answers and comments on your discussions' },
  { key: 'volunteering_notifications', label: 'Volunteering updates', help: 'New opportunities and application updates' },
  { key: 'camp_notifications', label: 'Camp announcements', help: 'News about upcoming camps' },
  { key: 'course_notifications', label: 'Course updates', help: 'New course announcements' },
  { key: 'meditation_notifications', label: 'Meditation updates', help: 'New meditations and sessions' },
  { key: 'reminder_notifications', label: 'Reminders', help: 'Upcoming event and volunteering reminders' },
];

function validatePassword(value: string) {
  if (value.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Za-z]/.test(value)) return 'Password must contain at least one letter.';
  if (!/\d/.test(value)) return 'Password must contain at least one number.';
  return '';
}

export default function SettingsScreen() {
  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <Screen>
      <AppHeader title="Settings" back />
      <SecuritySection />
      <NotificationSection />
      <PreferencesSection />
      <AccountSection />
    </Screen>
  </KeyboardAvoidingView>;
}

function ToggleRow({ label, help, value, onChange, disabled }: { label: string; help?: string; value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return <View style={styles.toggleRow}>
    <View style={{ flex: 1, gap: 2 }}>
      <Text style={styles.toggleLabel}>{label}</Text>
      {help ? <Text style={ui.small}>{help}</Text> : null}
    </View>
    <Switch
      value={value}
      onValueChange={onChange}
      disabled={disabled}
      trackColor={{ false: Palette.line, true: Palette.gold }}
      thumbColor={Palette.surface}
      accessibilityLabel={label}
    />
  </View>;
}

function SecuritySection() {
  const { session } = useSession();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const save = async () => {
    if (!session) return;
    setError('');
    setMessage('');
    if (!current) return setError('Enter your current password.');
    const invalid = validatePassword(next);
    if (invalid) return setError(invalid);
    if (next !== confirm) return setError('New passwords do not match.');
    setSaving(true);
    const res = await apiChangePassword(session, current, next);
    setSaving(false);
    if (res.error) return setError(res.error);
    setMessage('Password updated successfully.');
    setCurrent(''); setNext(''); setConfirm('');
  };

  return <Card>
    <Eyebrow>SECURITY</Eyebrow>
    <Text style={styles.title}>Change password</Text>
    <Field label="Current password" value={current} onChangeText={setCurrent} secureTextEntry autoComplete="current-password" />
    <Field label="New password" value={next} onChangeText={setNext} secureTextEntry autoComplete="new-password" hint="At least 8 characters with a letter and a number." />
    <Field label="Confirm new password" value={confirm} onChangeText={setConfirm} secureTextEntry autoComplete="new-password" />
    {message ? <Notice tone="success">{message}</Notice> : null}
    {error ? <Notice tone="error">{error}</Notice> : null}
    <ActionButton icon="lock-closed-outline" label="Change password" onPress={save} loading={saving} />
  </Card>;
}

function NotificationSection() {
  const { session } = useSession();
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [saved, setSaved] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session) return;
    void apiGetNotificationPreferences(session).then((res) => {
      if (res.error || !res.data) setError(res.error ?? 'Unable to load notification preferences.');
      else { setPrefs(res.data); setSaved(res.data); }
      setLoading(false);
    });
  }, [session]);

  const dirty = prefs && saved && NOTIFICATION_OPTIONS.some((o) => prefs[o.key] !== saved[o.key]);

  const save = async () => {
    if (!session || !prefs) return;
    setSaving(true);
    setError('');
    setMessage('');
    const patch = Object.fromEntries(NOTIFICATION_OPTIONS.map((o) => [o.key, prefs[o.key]])) as Partial<NotificationPreferences>;
    const res = await apiUpdateNotificationPreferences(session, patch);
    setSaving(false);
    if (res.error || !res.data) return setError(res.error ?? 'Unable to save notification preferences.');
    setPrefs(res.data);
    setSaved(res.data);
    setMessage('Notification preferences saved.');
  };

  return <Card>
    <Eyebrow>NOTIFICATIONS</Eyebrow>
    <Text style={styles.title}>Notification preferences</Text>
    {loading ? <Loading label="Loading notification preferences…" /> : prefs ? <>
      {NOTIFICATION_OPTIONS.map((o) => <ToggleRow key={o.key} label={o.label} help={o.help} value={Boolean(prefs[o.key])} onChange={(v) => { setMessage(''); setPrefs({ ...prefs, [o.key]: v }); }} />)}
      {message ? <Notice tone="success">{message}</Notice> : null}
      <ActionButton label={dirty ? 'Save preferences' : 'Preferences up to date'} onPress={save} loading={saving} disabled={!dirty} />
    </> : null}
    {error ? <Notice tone="error">{error}</Notice> : null}
  </Card>;
}

function PreferencesSection() {
  const { session } = useSession();
  const appPrefs = useAppPreferences();
  const [reminder, setReminder] = useState<{ enabled: boolean; time: string } | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!session) return;
    void apiGetNotificationPreferences(session).then((res) => {
      if (res.data) setReminder({ enabled: Boolean(res.data.daily_practice_reminder_enabled), time: String(res.data.daily_practice_reminder_time || '07:00').slice(0, 5) });
      else setError('Unable to load your daily practice reminder.');
    });
  }, [session]);

  const saveReminder = async (patch: { enabled?: boolean; time?: string }) => {
    if (!session || !reminder) return;
    const nextValue = { ...reminder, ...patch };
    const previous = reminder;
    setReminder(nextValue);
    setError('');
    setMessage('');
    const res = await apiUpdateNotificationPreferences(session, {
      daily_practice_reminder_enabled: nextValue.enabled,
      daily_practice_reminder_time: nextValue.time,
    });
    if (res.error) { setReminder(previous); return setError('Unable to save your daily practice reminder.'); }
    setMessage('Preference saved.');
  };

  return <Card>
    <Eyebrow>PREFERENCES</Eyebrow>
    <Text style={styles.title}>Platform preferences</Text>
    <ToggleRow
      label="Events"
      help="Show online events before in-person events."
      value={appPrefs.showOnlineEventsFirst}
      onChange={(v) => { setMessage('Preference saved.'); void updateAppPreferences({ showOnlineEventsFirst: v }); }}
    />
    {reminder ? <>
      <ToggleRow
        label="Daily practice reminder"
        help="Receive a gentle reminder for your daily spiritual practice."
        value={reminder.enabled}
        onChange={(v) => void saveReminder({ enabled: v })}
      />
      {reminder.enabled ? <DateField mode="time" label="Daily practice reminder time" value={reminder.time} onChange={(t) => void saveReminder({ time: t })} /> : null}
    </> : null}
    {message ? <Notice tone="success">{message}</Notice> : null}
    {error ? <Notice tone="error">{error}</Notice> : null}
  </Card>;
}

function AccountSection() {
  const { user, signOut } = useSession();
  return <Card>
    <Eyebrow>ACCOUNT</Eyebrow>
    <Text style={styles.title}>Account information</Text>
    <View style={styles.infoRow}><Text style={ui.small}>Email</Text><Text style={styles.infoValue}>{user?.email}</Text></View>
    <View style={styles.infoRow}><Text style={ui.small}>Access</Text><Text style={styles.infoValue}>{user?.role === 'mentor' ? 'Mentor' : 'Member'}</Text></View>
    <ActionButton variant="danger" icon="log-out-outline" label="Sign out" onPress={signOut} />
  </Card>;
}

const styles = StyleSheet.create({
  title: { fontFamily: BrandFonts.heading, fontSize: 20, color: Palette.charcoal },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Palette.line },
  toggleLabel: { fontFamily: BrandFonts.bodySemi, fontSize: 15, color: Palette.charcoal },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Palette.line },
  infoValue: { fontFamily: BrandFonts.bodySemi, fontSize: 14, color: Palette.charcoal, flexShrink: 1, textAlign: 'right' },
});
