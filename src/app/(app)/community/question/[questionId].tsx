import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AuthorLine } from '@/components/connect-cards';
import {
  ActionButton,
  AppHeader,
  Card,
  EmptyState,
  Eyebrow,
  Field,
  Loading,
  Notice,
  Screen,
  SectionTitle,
  ui,
} from '@/components/karma-ui';
import { BrandFonts, Palette } from '@/constants/theme';
import { useSession } from '@/context/auth-context';
import {
  type CommunityQuestionDetail,
  type CommunityReply,
  apiGetCommunityGroup,
  apiGetQuestion,
  apiJoinCommunityGroup,
  apiReplyToQuestion,
} from '@/services/api';

export default function QuestionScreen() {
  const { questionId } = useLocalSearchParams<{ questionId: string }>();
  const id = Number(questionId);
  const { session } = useSession();

  const [question, setQuestion] = useState<CommunityQuestionDetail | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [answer, setAnswer] = useState('');
  const [posting, setPosting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);

  const load = useCallback(async () => {
    if (!session || !Number.isInteger(id)) return;
    const res = await apiGetQuestion(session, id);
    if (res.error || !res.data) {
      setLoadError(res.error ?? 'This discussion could not be found.');
      setLoading(false);
      return;
    }
    setLoadError('');
    setQuestion(res.data);
    // Membership decides whether the user can answer (same check as the website).
    const group = await apiGetCommunityGroup(session, res.data.group_id);
    setIsMember(Boolean(group.data?.is_member));
    setLoading(false);
  }, [session, id]);

  useEffect(() => { void load(); }, [load]);

  const postAnswer = async () => {
    if (!session || !question || !answer.trim()) return;
    setPosting(true);
    setError('');
    setMessage('');
    const res = await apiReplyToQuestion(session, question.id, answer.trim());
    setPosting(false);
    if (res.error) return setError(res.error);
    setAnswer('');
    setMessage(res.data?.message || 'Your answer has been shared.');
    void load();
  };

  const postComment = async (parentId: number, content: string) => {
    if (!session || !question) return 'Not signed in.';
    const res = await apiReplyToQuestion(session, question.id, content, parentId);
    if (res.error) return res.error;
    void load();
    return null;
  };

  const joinGroup = async () => {
    if (!session || !question) return;
    setJoining(true);
    const res = await apiJoinCommunityGroup(session, question.group_id);
    setJoining(false);
    if (res.error) return setError(res.error);
    setIsMember(true);
  };

  if (loading) return <Screen><AppHeader title="Discussion" back /><Loading /></Screen>;

  if (loadError || !question) {
    return <Screen>
      <AppHeader title="Discussion" back />
      <EmptyState icon="chatbubbles-outline" title="Discussion unavailable" message={loadError} action={<ActionButton variant="outline" label="Try again" onPress={() => { setLoading(true); void load(); }} />} />
    </Screen>;
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <AppHeader title="Discussion" subtitle={question.group_name} back />

        <Card>
          <Pressable onPress={() => router.push(`/community/group/${question.group_id}` as any)} accessibilityRole="link">
            <Eyebrow>{(question.group_name || 'Community').toUpperCase()}</Eyebrow>
          </Pressable>
          <Text style={styles.title}>{question.title}</Text>
          <AuthorLine author={question.author} createdAt={question.created_at} />
          <Text style={styles.content}>{question.content}</Text>
        </Card>

        <SectionTitle>{`Answers (${question.replies?.length ?? 0})`}</SectionTitle>

        {question.replies?.length ? (
          <View style={{ gap: 12 }}>
            {question.replies.map((reply) => (
              <ReplyItem key={reply.id} reply={reply} canComment={isMember} onComment={postComment} depth={0} />
            ))}
          </View>
        ) : (
          <EmptyState icon="chatbubble-ellipses-outline" title="No answers yet" message="Members, mentors and admins can all share a response." />
        )}

        {message ? <Notice tone="success">{message}</Notice> : null}
        {error ? <Notice tone="error">{error}</Notice> : null}

        {isMember ? (
          <Card>
            <Eyebrow>YOUR ANSWER</Eyebrow>
            <Field label="Share your answer" placeholder="Write a thoughtful response…" value={answer} onChangeText={setAnswer} multiline maxLength={5000} />
            <ActionButton label="Post answer" onPress={postAnswer} loading={posting} disabled={!answer.trim()} />
          </Card>
        ) : (
          <Card style={styles.joinCard}>
            <Text style={ui.body}>Join this community to answer or continue the discussion.</Text>
            <ActionButton icon="person-add-outline" label="Join community" onPress={joinGroup} loading={joining} />
          </Card>
        )}
      </Screen>
    </KeyboardAvoidingView>
  );
}

/** One answer with its nested comments (website: CommunityReplyList). */
function ReplyItem({
  reply,
  canComment,
  onComment,
  depth,
}: {
  reply: CommunityReply;
  canComment: boolean;
  onComment: (parentId: number, content: string) => Promise<string | null>;
  depth: number;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const isMentor = reply.author?.role === 'mentor';

  const submit = async () => {
    if (!draft.trim()) return;
    setBusy(true);
    setError('');
    const err = await onComment(reply.id, draft.trim());
    setBusy(false);
    if (err) return setError(err);
    setDraft('');
    setOpen(false);
  };

  return <View style={[styles.reply, depth > 0 && styles.replyNested, isMentor && styles.replyMentor]}>
    <AuthorLine author={reply.author} createdAt={reply.created_at} />
    <Text style={styles.replyText}>{reply.content}</Text>

    {canComment && depth === 0 ? (
      <Pressable style={styles.commentToggle} onPress={() => setOpen((v) => !v)} accessibilityRole="button">
        <Ionicons name="return-down-forward-outline" size={15} color={Palette.goldDark} />
        <Text style={styles.commentToggleText}>{open ? 'Cancel' : 'Comment'}</Text>
      </Pressable>
    ) : null}

    {open ? (
      <View style={styles.commentBox}>
        <TextInput
          style={styles.commentInput}
          placeholder="Add a comment…"
          placeholderTextColor={Palette.stoneLight}
          value={draft}
          onChangeText={setDraft}
          multiline
          maxLength={5000}
        />
        {error ? <Text style={styles.commentError}>{error}</Text> : null}
        <ActionButton label="Share comment" onPress={submit} loading={busy} disabled={!draft.trim()} />
      </View>
    ) : null}

    {reply.replies?.length ? (
      <View style={styles.children}>
        {reply.replies.map((child) => (
          <ReplyItem key={child.id} reply={child} canComment={canComment} onComment={onComment} depth={depth + 1} />
        ))}
      </View>
    ) : null}
  </View>;
}

const styles = StyleSheet.create({
  title: { fontFamily: BrandFonts.heading, fontSize: 24, lineHeight: 31, color: Palette.charcoal },
  content: { fontFamily: BrandFonts.body, fontSize: 16, lineHeight: 24, color: Palette.charcoal },
  joinCard: { alignItems: 'stretch' },
  reply: { backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.line, borderRadius: 18, padding: 16, gap: 8 },
  replyMentor: { borderColor: Palette.gold, backgroundColor: Palette.highlight },
  replyNested: { borderRadius: 14, padding: 12, backgroundColor: Palette.ivory },
  replyText: { fontFamily: BrandFonts.body, fontSize: 15, lineHeight: 22, color: Palette.charcoal },
  commentToggle: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingVertical: 4 },
  commentToggleText: { fontFamily: BrandFonts.bodySemi, fontSize: 13, color: Palette.goldDark },
  commentBox: { gap: 8 },
  commentInput: { fontFamily: BrandFonts.body, minHeight: 80, borderWidth: 1, borderColor: Palette.line, borderRadius: 12, padding: 12, fontSize: 15, color: Palette.charcoal, backgroundColor: Palette.surfaceRaised, textAlignVertical: 'top' },
  commentError: { fontFamily: BrandFonts.body, fontSize: 13, color: Palette.danger },
  children: { gap: 8, marginTop: 4, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: Palette.goldSoft },
});
