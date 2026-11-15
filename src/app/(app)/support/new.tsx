import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text } from 'react-native';

import { ActionButton, AppHeader, Card, ChipRow, Field, Notice, Screen } from '@/components/karma-ui';
import { BrandFonts, Palette } from '@/constants/theme';
import { useSession } from '@/context/auth-context';
import { type HelpCategory, type SupportPriority, apiCreateSupportTicket, apiGetHelpCategories } from '@/services/api';

const PRIORITIES: { key: SupportPriority; label: string }[] = [
  { key: 'low', label: 'Low' },
  { key: 'normal', label: 'Normal' },
  { key: 'high', label: 'High' },
  { key: 'urgent', label: 'Urgent' },
];

export default function NewSupportScreen() {
  const { session } = useSession();
  const [categories, setCategories] = useState<HelpCategory[]>([]);
  const [categoryId, setCategoryId] = useState('none');
  const [priority, setPriority] = useState<SupportPriority>('normal');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session) return;
    void apiGetHelpCategories(session).then((res) => {
      const raw: any = res.data;
      setCategories(Array.isArray(raw) ? raw : raw?.categories ?? []);
    });
  }, [session]);

  const submit = async () => {
    if (!session) return;
    setError('');
    if (!subject.trim() || !description.trim()) return setError('Subject and description are required.');
    setSubmitting(true);
    const res = await apiCreateSupportTicket(session, {
      subject: subject.trim(),
      description: description.trim(),
      category_id: categoryId === 'none' ? null : Number(categoryId),
      priority,
    });
    setSubmitting(false);
    if (res.error || !res.data) return setError(res.error ?? 'Unable to create this support request.');
    router.replace(`/support/${res.data.id}?created=1` as any);
  };

  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <Screen>
      <AppHeader title="New support request" back />
      <Card>
        <Field label="Subject" value={subject} onChangeText={setSubject} placeholder="A short summary" maxLength={200} />
        <Text style={styles.label}>Category</Text>
        <ChipRow options={[{ key: 'none', label: 'General' }, ...categories.map((c) => ({ key: String(c.id), label: c.name }))]} value={categoryId} onChange={setCategoryId} />
        <Text style={styles.label}>Priority</Text>
        <ChipRow options={PRIORITIES} value={priority} onChange={setPriority} />
        <Field label="Description" value={description} onChangeText={setDescription} placeholder="Tell us what happened and how we can help." multiline maxLength={5000} />
        {error ? <Notice tone="error">{error}</Notice> : null}
        <ActionButton icon="send-outline" label="Submit request" onPress={submit} loading={submitting} />
      </Card>
    </Screen>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  label: { fontFamily: BrandFonts.bodySemi, fontSize: 14, color: Palette.charcoal },
});
