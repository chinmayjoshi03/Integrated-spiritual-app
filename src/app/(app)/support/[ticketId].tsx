import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';

import { ActionButton, AppHeader, Card, EmptyState, Field, Loading, Notice, Screen, StatusBadge, ui } from '@/components/karma-ui';
import { BrandFonts, Palette } from '@/constants/theme';
import { useSession } from '@/context/auth-context';
import { supportStatusLabel, timeAgo } from '@/lib/lifecycle';
import { type SupportTicket, apiGetMySupportTicket, apiReopenSupportTicket, apiReplySupportTicket } from '@/services/api';

const priorityLabel = (p: string) => p.charAt(0).toUpperCase() + p.slice(1);

export default function SupportTicketScreen() {
  const { ticketId, created } = useLocalSearchParams<{ ticketId: string; created?: string }>();
  const id = Number(ticketId);
  const { session } = useSession();
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(created === '1' ? 'Support request created.' : '');

  const load = useCallback(async () => {
    if (!session || !Number.isInteger(id)) return;
    const res = await apiGetMySupportTicket(session, id);
    if (res.error || !res.data) setLoadError(res.error ?? 'Request not found.');
    else { setLoadError(''); setTicket(res.data); }
    setLoading(false);
  }, [session, id]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const send = async () => {
    if (!session || !ticket || !reply.trim()) return;
    setBusy(true);
    setError('');
    const res = await apiReplySupportTicket(session, ticket.id, reply.trim());
    setBusy(false);
    if (res.error) return setError(res.error);
    setReply('');
    setNotice('Reply sent.');
    void load();
  };

  const reopen = async () => {
    if (!session || !ticket) return;
    setBusy(true);
    setError('');
    const res = await apiReopenSupportTicket(session, ticket.id);
    setBusy(false);
    if (res.error) return setError('Unable to reopen this request.');
    setNotice('Request reopened.');
    void load();
  };

  if (loading) return <Screen><AppHeader title="Support request" back /><Loading /></Screen>;
  if (loadError || !ticket) return <Screen><AppHeader title="Support request" back /><EmptyState icon="alert-circle-outline" title="Request unavailable" message={loadError} /></Screen>;

  const canReply = !['resolved', 'closed'].includes(ticket.status);

  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <Screen>
      <AppHeader title={ticket.ticket_number} subtitle="Support request" back />
      {notice ? <Notice tone="success">{notice}</Notice> : null}
      <Card>
        <StatusBadge status={ticket.status} label={supportStatusLabel(ticket.status)} />
        <Text style={styles.subject}>{ticket.subject}</Text>
        <Text style={ui.small}>{ticket.category_name || 'General'} · {priorityLabel(ticket.priority)} priority · Created {timeAgo(ticket.created_at)}</Text>
      </Card>

      <View style={{ gap: 10 }}>
        {(ticket.messages ?? []).map((m) => {
          const fromSupport = m.sender_role === 'admin';
          return <View key={m.id} style={[styles.message, fromSupport ? styles.messageSupport : styles.messageMine]}>
            <Text style={styles.sender}>{fromSupport ? 'Support' : m.sender_name || 'You'}</Text>
            <Text style={styles.body}>{m.message}</Text>
            <Text style={ui.small}>{timeAgo(m.created_at)}</Text>
          </View>;
        })}
      </View>

      {error ? <Notice tone="error">{error}</Notice> : null}
      {canReply ? (
        <Card>
          <Field label="Reply" value={reply} onChangeText={setReply} multiline placeholder="Write your reply…" maxLength={5000} />
          <ActionButton icon="send-outline" label="Send reply" onPress={send} loading={busy} disabled={!reply.trim()} />
        </Card>
      ) : (
        <ActionButton variant="outline" icon="refresh-outline" label="Reopen request" onPress={reopen} loading={busy} />
      )}
    </Screen>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  subject: { fontFamily: BrandFonts.heading, fontSize: 22, lineHeight: 28, color: Palette.charcoal },
  message: { borderRadius: 16, padding: 14, gap: 4, borderWidth: 1 },
  messageMine: { backgroundColor: Palette.surface, borderColor: Palette.line, marginLeft: 24 },
  messageSupport: { backgroundColor: Palette.highlight, borderColor: Palette.goldSoft, marginRight: 24 },
  sender: { fontFamily: BrandFonts.bodySemi, fontSize: 13, color: Palette.goldDark },
  body: { fontFamily: BrandFonts.body, fontSize: 15, lineHeight: 22, color: Palette.charcoal },
});
