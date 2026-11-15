import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';

import { QuestionCard } from '@/components/connect-cards';
import {
  ActionButton,
  AppHeader,
  Banner,
  Card,
  EmptyState,
  Eyebrow,
  Field,
  Loading,
  Notice,
  Screen,
  SectionTitle,
  StatusBadge,
  ui,
} from '@/components/karma-ui';
import { BrandFonts, Palette } from '@/constants/theme';
import { useSession } from '@/context/auth-context';
import {
  type CommunityGroup,
  type CommunityQuestion,
  apiAskGroupQuestion,
  apiGetCommunityGroup,
  apiGetGroupQuestions,
  apiJoinCommunityGroup,
  apiLeaveCommunityGroup,
} from '@/services/api';

export default function CommunityGroupScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const id = Number(groupId);
  const { session } = useSession();

  const [group, setGroup] = useState<CommunityGroup | null>(null);
  const [questions, setQuestions] = useState<CommunityQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [membershipBusy, setMembershipBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  const [askOpen, setAskOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [asking, setAsking] = useState(false);
  const [askError, setAskError] = useState('');
  const [askSuccess, setAskSuccess] = useState('');

  const load = useCallback(async () => {
    if (!session || !Number.isInteger(id)) return;
    const [g, q] = await Promise.all([apiGetCommunityGroup(session, id), apiGetGroupQuestions(session, id)]);
    if (g.error || !g.data) {
      setLoadError(g.error ?? 'This community could not be found.');
    } else {
      setLoadError('');
      setGroup(g.data);
    }
    setQuestions(q.data ?? []);
    setLoading(false);
  }, [session, id]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const handleJoin = async () => {
    if (!session || !group || membershipBusy) return;
    setMembershipBusy(true);
    setActionError('');
    const res = await apiJoinCommunityGroup(session, group.id);
    setMembershipBusy(false);
    if (res.error) return setActionError(res.error);
    setGroup({ ...group, is_member: true, member_count: (group.member_count ?? 0) + 1 });
  };

  const handleLeave = () => {
    if (!session || !group) return;
    Alert.alert('Leave community?', `You won't be able to ask or answer in ${group.name} until you join again.`, [
      { text: 'Stay', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          setMembershipBusy(true);
          setActionError('');
          const res = await apiLeaveCommunityGroup(session, group.id);
          setMembershipBusy(false);
          if (res.error) return setActionError(res.error);
          setGroup({ ...group, is_member: false, member_count: Math.max(0, (group.member_count ?? 1) - 1) });
          setAskOpen(false);
        },
      },
    ]);
  };

  const handleAsk = async () => {
    if (!session || !group) return;
    setAskError('');
    setAskSuccess('');
    if (!title.trim() || !content.trim()) return setAskError('Title and question are required.');
    setAsking(true);
    const res = await apiAskGroupQuestion(session, group.id, title.trim(), content.trim());
    setAsking(false);
    if (res.error) return setAskError(res.error);
    setTitle('');
    setContent('');
    setAskOpen(false);
    setAskSuccess(res.data?.message || 'Your question has been shared.');
    void load();
  };

  if (loading) return <Screen><AppHeader title="Community" back /><Loading /></Screen>;

  if (loadError || !group) {
    return <Screen>
      <AppHeader title="Community" back />
      <EmptyState icon="people-outline" title="Community unavailable" message={loadError || 'This community could not be found.'} action={<ActionButton variant="outline" label="Try again" onPress={() => { setLoading(true); void load(); }} />} />
    </Screen>;
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <AppHeader title={group.name} subtitle="Community" back />

        <Card style={styles.hero}>
          {group.banner_url ? <Banner uri={group.banner_url} icon="people-outline" height={150} /> : null}
          <View style={styles.heroBody}>
            <View style={styles.heroTop}>
              {group.category ? <Eyebrow>{group.category.toUpperCase()}</Eyebrow> : <View />}
              {group.is_member ? <StatusBadge status="approved" label="Joined" /> : null}
            </View>
            <Text style={ui.title}>{group.name}</Text>
            {group.description ? <Text style={ui.body}>{group.description}</Text> : null}
            <View style={styles.stats}>
              <View style={styles.stat}><Ionicons name="people-outline" size={16} color={Palette.goldDark} /><Text style={styles.statText}>{group.member_count ?? 0} members</Text></View>
              <View style={styles.stat}><Ionicons name="chatbubbles-outline" size={16} color={Palette.goldDark} /><Text style={styles.statText}>{questions.length} discussions</Text></View>
            </View>
            {actionError ? <Notice tone="error">{actionError}</Notice> : null}
            {group.is_member ? (
              <View style={styles.actions}>
                <ActionButton style={{ flex: 1 }} icon="create-outline" label="Ask a question" onPress={() => { setAskOpen((v) => !v); setAskSuccess(''); }} />
                <ActionButton style={styles.leaveBtn} variant="outline" label="Leave" loading={membershipBusy} onPress={handleLeave} />
              </View>
            ) : (
              <ActionButton icon="person-add-outline" label="Join community" loading={membershipBusy} onPress={handleJoin} />
            )}
          </View>
        </Card>

        {!group.is_member ? <Notice tone="info">Join this community to ask a question or answer others.</Notice> : null}
        {askSuccess ? <Notice tone="success">{askSuccess}</Notice> : null}

        {group.is_member && askOpen ? (
          <Card>
            <Eyebrow>NEW DISCUSSION</Eyebrow>
            <Text style={styles.formTitle}>Ask the community</Text>
            {askError ? <Notice tone="error">{askError}</Notice> : null}
            <Field label="Question title" placeholder="e.g. How do you stay present on busy days?" value={title} onChangeText={setTitle} maxLength={200} />
            <Field label="Details" placeholder="Share some context so others can help." value={content} onChangeText={setContent} multiline maxLength={5000} />
            <ActionButton label="Share question" onPress={handleAsk} loading={asking} />
          </Card>
        ) : null}

        <SectionTitle>Discussions</SectionTitle>
        {questions.length === 0 ? (
          <EmptyState icon="chatbubbles-outline" title="No discussions yet" message={group.is_member ? 'Be the first to ask a question.' : 'Join to start the first conversation.'} />
        ) : (
          <View style={{ gap: 12 }}>{questions.map((q) => <QuestionCard key={q.id} question={q} showGroup={false} />)}</View>
        )}
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  hero: { padding: 0, gap: 0, overflow: 'hidden' },
  heroBody: { padding: 20, gap: 12 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stats: { flexDirection: 'row', gap: 18, flexWrap: 'wrap' },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { fontFamily: BrandFonts.bodyMedium, fontSize: 14, color: Palette.stone },
  actions: { flexDirection: 'row', gap: 10 },
  leaveBtn: { paddingHorizontal: 20 },
  formTitle: { fontFamily: BrandFonts.heading, fontSize: 20, color: Palette.charcoal },
});
