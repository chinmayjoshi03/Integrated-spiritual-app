import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader, Card, Screen, SectionTitle, ui } from '@/components/karma-ui';
import { Palette } from '@/constants/theme';
import { useSession } from '@/context/auth-context';
import {
  type CommunityPost,
  type PostComment,
  apiAddComment,
  apiDeletePost,
  apiGetPostDetail,
  apiToggleLikePost,
} from '@/services/api';

export default function PostDetailScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const { session, user } = useSession();

  const [post, setPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);

  const loadPost = useCallback(async () => {
    if (!session || !postId) return;
    setLoading(true);
    const res = await apiGetPostDetail(session, Number(postId));
    if (res.data) {
      setPost(res.data.post);
      setComments(res.data.comments);
    }
    setLoading(false);
  }, [session, postId]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  const handleToggleLike = async () => {
    if (!session || !post) return;

    setPost((prev) =>
      prev
        ? {
            ...prev,
            liked_by_user: !prev.liked_by_user,
            likes_count: prev.liked_by_user ? prev.likes_count - 1 : prev.likes_count + 1,
          }
        : null
    );
    await apiToggleLikePost(session, post.id);
  };

  const handleDeletePost = () => {
    if (!session || !post) return;

    Alert.alert(
      'Delete Post',
      'This will permanently remove your post and all replies. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const res = await apiDeletePost(session, post.id);
            if (res.error) {
              Alert.alert('Error', res.error);
            } else {
              router.back();
            }
          },
        },
      ]
    );
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    if (!session || !post) return;

    setSubmittingComment(true);
    const res = await apiAddComment(session, post.id, newComment.trim());
    setSubmittingComment(false);

    if (res.data) {
      setComments((prev) => [...prev, res.data!.comment]);
      setPost((prev) => (prev ? { ...prev, comments_count: prev.comments_count + 1 } : null));
      setNewComment('');
    } else {
      Alert.alert('Error', 'Failed to post comment.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Palette.gold} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={styles.safe}>
        <Screen>
          <AppHeader title="Post Not Found" back />
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>This post could not be loaded.</Text>
          </Card>
        </Screen>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Screen>
          <AppHeader title="Discussion Thread" subtitle={`In ${post.category}`} back />

          {/* Post Header & Body Card */}
          <Card style={styles.postMainCard}>
            <View style={styles.postHeaderRow}>
              <View style={styles.authorBadge}>
                <Text style={styles.avatar}>👤</Text>
                <View>
                  <Text style={styles.authorName}>{post.author_name}</Text>
                  <Text style={ui.small}>
                    {new Date(post.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
              </View>
              <View style={styles.categoryPill}>
                <Text style={styles.categoryPillText}>{post.category}</Text>
              </View>
            </View>

            <Text style={styles.postTitle}>{post.title}</Text>
            <Text style={styles.postContent}>{post.content}</Text>

            <View style={styles.postActionsRow}>
              <Pressable style={styles.upvoteBtn} onPress={handleToggleLike}>
                <Text style={[styles.upvoteIcon, post.liked_by_user && styles.upvoteIconActive]}>
                  {post.liked_by_user ? '▲ Liked' : '△ Upvote'}
                </Text>
                <Text style={styles.upvoteCount}>{post.likes_count}</Text>
              </Pressable>

              <View style={styles.postActionsRight}>
                <Text style={styles.repliesCountText}>{comments.length} replies</Text>
                {user?.id === post.user_id && (
                  <Pressable style={styles.deleteBtn} onPress={handleDeletePost}>
                    <Text style={styles.deleteBtnText}>🗑 Delete</Text>
                  </Pressable>
                )}
              </View>
            </View>
          </Card>

          {/* Comments Section */}
          <SectionTitle>{`Discussion Replies (${comments.length})`}</SectionTitle>

          {comments.length === 0 ? (
            <Card style={styles.emptyCommentsCard}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyText}>No replies yet. Share your thoughts below!</Text>
            </Card>
          ) : (
            <View style={styles.commentsList}>
              {comments.map((comment) => (
                <Card key={comment.id} style={styles.commentCard}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.commentAuthor}>👤 {comment.author_name}</Text>
                    <Text style={ui.small}>
                      {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <Text style={styles.commentText}>{comment.content}</Text>
                </Card>
              ))}
            </View>
          )}

          {/* Add Comment Input */}
          <Card style={styles.inputCard}>
            <TextInput
              style={styles.commentInput}
              placeholder="Write a thoughtful reply..."
              placeholderTextColor={Palette.stoneLight}
              value={newComment}
              onChangeText={setNewComment}
              multiline
            />
            <Pressable
              style={[styles.sendBtn, (!newComment.trim() || submittingComment) && styles.sendBtnDisabled]}
              onPress={handlePostComment}
              disabled={!newComment.trim() || submittingComment}
            >
              {submittingComment ? (
                <ActivityIndicator color={Palette.surface} size="small" />
              ) : (
                <Text style={styles.sendBtnText}>Reply</Text>
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
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorCard: { padding: 20, alignItems: 'center' },
  errorText: { color: Palette.danger, fontSize: 16 },

  postMainCard: { gap: 12, padding: 18 },
  postHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  authorBadge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: { fontSize: 20 },
  authorName: { color: Palette.charcoal, fontSize: 14, fontWeight: '700' },
  categoryPill: { backgroundColor: Palette.goldSoft, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  categoryPillText: { color: Palette.goldDark, fontSize: 11, fontWeight: '800' },
  postTitle: { color: Palette.charcoal, fontFamily: 'serif', fontSize: 20, fontWeight: '700', lineHeight: 26 },
  postContent: { color: Palette.charcoal, fontSize: 15, lineHeight: 22 },
  postActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Palette.line,
    paddingTop: 10,
    marginTop: 4,
  },
  upvoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.ivory,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Palette.line,
  },
  upvoteIcon: { fontSize: 13, fontWeight: '700', color: Palette.stone },
  upvoteIconActive: { color: Palette.goldDark },
  upvoteCount: { color: Palette.charcoal, fontSize: 13, fontWeight: '700' },
  repliesCountText: { color: Palette.stone, fontSize: 13, fontWeight: '600' },
  postActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  deleteBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  deleteBtnText: { color: '#DC2626', fontSize: 12, fontWeight: '700' },

  // Comments
  commentsList: { gap: 10 },
  commentCard: { gap: 6, padding: 14, backgroundColor: Palette.surface },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  commentAuthor: { color: Palette.charcoal, fontSize: 13, fontWeight: '700' },
  commentText: { color: Palette.charcoal, fontSize: 14, lineHeight: 20 },

  emptyCommentsCard: { alignItems: 'center', gap: 8, paddingVertical: 24 },
  emptyIcon: { fontSize: 32 },
  emptyText: { color: Palette.stone, fontSize: 13, textAlign: 'center' },

  inputCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, marginTop: 12 },
  commentInput: {
    flex: 1,
    backgroundColor: Palette.ivory,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxHeight: 90,
    color: Palette.charcoal,
    fontSize: 14,
  },
  sendBtn: {
    backgroundColor: Palette.goldDark,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnText: { color: Palette.surface, fontSize: 14, fontWeight: '700' },
});
