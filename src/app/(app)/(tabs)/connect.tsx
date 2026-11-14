import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppHeader, Card, Pill, Screen, SectionTitle, ui } from '@/components/karma-ui';
import { Palette } from '@/constants/theme';
import { useSession } from '@/context/auth-context';
import {
  type CommunityPost,
  type EventItem,
  type VolunteerOpportunity,
  apiApplyVolunteer,
  apiDeletePost,
  apiGetEvents,
  apiGetPosts,
  apiGetVolunteerOpportunities,
  apiToggleLikePost,
} from '@/services/api';

type TabSegment = 'community' | 'events' | 'volunteer';

const POST_CATEGORIES = ['All', 'Q&A', 'Reflections', 'Teachings', 'Meditation'] as const;

export default function ConnectScreen() {
  const { session, user } = useSession();
  const [activeSegment, setActiveSegment] = useState<TabSegment>('community');

  // Community state
  const [selectedPostCat, setSelectedPostCat] = useState<string>('All');
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);

  // Events state
  const [events, setEvents] = useState<EventItem[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  // Volunteer state
  const [opportunities, setOpportunities] = useState<VolunteerOpportunity[]>([]);
  const [volunteersLoading, setVolunteersLoading] = useState(true);

  // Load Data
  const loadCommunity = useCallback(async () => {
    if (!session) return;
    setPostsLoading(true);
    const res = await apiGetPosts(session, selectedPostCat);
    if (res.data) setPosts(res.data.posts);
    setPostsLoading(false);
  }, [session, selectedPostCat]);

  const loadEvents = useCallback(async () => {
    if (!session) return;
    setEventsLoading(true);
    const res = await apiGetEvents(session);
    if (res.data) setEvents(res.data.events);
    setEventsLoading(false);
  }, [session]);

  const loadVolunteers = useCallback(async () => {
    if (!session) return;
    setVolunteersLoading(true);
    const res = await apiGetVolunteerOpportunities(session);
    if (res.data) setOpportunities(res.data.opportunities);
    setVolunteersLoading(false);
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      if (activeSegment === 'community') loadCommunity();
      if (activeSegment === 'events') loadEvents();
      if (activeSegment === 'volunteer') loadVolunteers();
    }, [activeSegment, loadCommunity, loadEvents, loadVolunteers])
  );

  // Actions
  const handleLikePost = async (post: CommunityPost) => {
    if (!session) return;
    // Optimistic toggle
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? {
              ...p,
              liked_by_user: !p.liked_by_user,
              likes_count: p.liked_by_user ? p.likes_count - 1 : p.likes_count + 1,
            }
          : p
      )
    );
    await apiToggleLikePost(session, post.id);
  };

  const handleDeletePost = async (_post: CommunityPost) => {
    Alert.alert('Not supported', 'Post deletion is not available.');
  };

  const handleRegisterEvent = async (_event: EventItem) => {
    // Registration is handled on the event detail screen
  };

  const handleApplyVolunteer = async (opp: VolunteerOpportunity) => {
    if (!session || opp.applied_by_user) return;
    Alert.alert(
      'Offer Seva',
      `Would you like to register your interest for "${opp.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Application',
          onPress: async () => {
            setOpportunities((prev) =>
              prev.map((o) =>
                o.id === opp.id
                  ? { ...o, applied_by_user: true, current_volunteers: o.current_volunteers + 1 }
                  : o
              )
            );
            await apiApplyVolunteer(session, opp.id, 'Applied via mobile app');
            Alert.alert('Seva Application Sent', 'Thank you for offering your time!');
          },
        },
      ]
    );
  };

  return (
    <Screen>
      <AppHeader title="Connect & Seva" subtitle="Community, events & service" />

      {/* ── Segment Controller ── */}
      <View style={styles.segmentContainer}>
        <Pressable
          style={[styles.segmentBtn, activeSegment === 'community' && styles.segmentBtnActive]}
          onPress={() => setActiveSegment('community')}
        >
          <Ionicons
            name="chatbubbles-outline"
            size={14}
            color={activeSegment === 'community' ? Palette.surface : Palette.stone}
          />
          <Text style={[styles.segmentText, activeSegment === 'community' && styles.segmentTextActive]}>
            Community
          </Text>
        </Pressable>

        <Pressable
          style={[styles.segmentBtn, activeSegment === 'events' && styles.segmentBtnActive]}
          onPress={() => setActiveSegment('events')}
        >
          <Ionicons
            name="calendar-outline"
            size={14}
            color={activeSegment === 'events' ? Palette.surface : Palette.stone}
          />
          <Text style={[styles.segmentText, activeSegment === 'events' && styles.segmentTextActive]}>
            Events
          </Text>
        </Pressable>

        <Pressable
          style={[styles.segmentBtn, activeSegment === 'volunteer' && styles.segmentBtnActive]}
          onPress={() => setActiveSegment('volunteer')}
        >
          <MaterialCommunityIcons
            name="hand-heart-outline"
            size={15}
            color={activeSegment === 'volunteer' ? Palette.surface : Palette.stone}
          />
          <Text style={[styles.segmentText, activeSegment === 'volunteer' && styles.segmentTextActive]}>
            Seva
          </Text>
        </Pressable>
      </View>

      {/* ════════════════════════ COMMUNITY ════════════════════════ */}
      {activeSegment === 'community' && (
        <View style={styles.sectionWrap}>
          <View style={styles.communityHeaderRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catPillsRow}>
              {POST_CATEGORIES.map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => setSelectedPostCat(cat)}
                  style={[styles.catPill, selectedPostCat === cat && styles.catPillActive]}
                >
                  <Text style={[styles.catPillText, selectedPostCat === cat && styles.catPillTextActive]}>
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable style={styles.newPostBtn} onPress={() => router.push('/community/create-post' as any)}>
              <Text style={styles.newPostBtnText}>+ Post</Text>
            </Pressable>
          </View>

          {postsLoading ? (
            <View style={styles.loadingWrap}><ActivityIndicator color={Palette.gold} size="large" /></View>
          ) : posts.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="chatbubbles-outline" size={44} color={Palette.stoneLight} />
              <Text style={styles.emptyTitle}>No posts in this topic</Text>
              <Text style={[ui.small, { textAlign: 'center' }]}>
                Be the first to start a conversation!
              </Text>
              <Pressable style={styles.createFirstBtn} onPress={() => router.push('/community/create-post' as any)}>
                <Text style={styles.createFirstText}>Create First Post</Text>
              </Pressable>
            </Card>
          ) : (
            <View style={styles.postList}>
              {posts.map((post) => (
                <Pressable key={post.id} onPress={() => router.push(`/community/${post.id}` as any)}>
                  <Card style={styles.postCard}>
                    <View style={styles.postTopRow}>
                      <View style={styles.authorBadge}>
                        <Ionicons name="person-circle-outline" size={18} color={Palette.stone} />
                        <Text style={styles.authorName}>{post.author_name}</Text>
                      </View>
                      <View style={styles.postTag}>
                        <Text style={styles.postTagText}>{post.category}</Text>
                      </View>
                    </View>

                    <Text style={styles.postTitle}>{post.title}</Text>
                    <Text style={styles.postSnippet} numberOfLines={3}>{post.content}</Text>

                    <View style={styles.postFooter}>
                      {/* Upvote button — commented out per request */}
                      {/* <Pressable style={styles.likeBtn} onPress={() => handleLikePost(post)}>
                        <Ionicons
                          name={post.liked_by_user ? 'arrow-up-circle' : 'arrow-up-circle-outline'}
                          size={16}
                          color={post.liked_by_user ? Palette.goldDark : Palette.stone}
                        />
                        <Text style={[styles.likeCount, post.liked_by_user && styles.likeCountActive]}>
                          {post.likes_count}
                        </Text>
                      </Pressable> */}

                      <View style={styles.postFooterRight}>
                        <View style={styles.commentBadge}>
                          <Ionicons name="chatbubble-outline" size={14} color={Palette.stone} />
                          <Text style={styles.commentCount}>{post.comments_count} replies</Text>
                        </View>
                        {user?.id === post.user_id && (
                          <Pressable
                            style={styles.deleteBtn}
                            onPress={(e) => {
                              e.stopPropagation();
                              handleDeletePost(post);
                            }}
                          >
                            <Ionicons name="trash-outline" size={14} color="#991B1B" />
                          </Pressable>
                        )}
                      </View>
                    </View>
                  </Card>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      )}

      {/* ════════════════════════ EVENTS ════════════════════════ */}
      {activeSegment === 'events' && (
        <View style={styles.sectionWrap}>
          <SectionTitle>Upcoming gatherings</SectionTitle>

          {eventsLoading ? (
            <View style={styles.loadingWrap}><ActivityIndicator color={Palette.gold} size="large" /></View>
          ) : events.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="calendar-outline" size={44} color={Palette.stoneLight} />
              <Text style={styles.emptyTitle}>No upcoming events</Text>
              <Text style={[ui.small, { textAlign: 'center' }]}>Check back soon for new community gatherings.</Text>
            </Card>
          ) : (
            <View style={styles.eventsList}>
              {events.map((event) => {
                const dateObj = new Date(event.event_date);
                const monthStr = dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
                const dayStr = dateObj.getDate();

                return (
                  <Card key={event.id} style={styles.eventCard}>
                    {/* Event details */}
                    <View style={styles.eventHeaderRow}>
                      <View style={styles.dateBlock}>
                        <Text style={styles.dateMonth}>{monthStr}</Text>
                        <Text style={styles.dateDay}>{dayStr}</Text>
                      </View>

                      <View style={styles.eventMainInfo}>
                        <View style={styles.eventPillRow}>
                          {event.is_online ? (
                            <Pill>ONLINE</Pill>
                          ) : (
                            <View style={styles.inPersonPill}>
                              <Text style={styles.inPersonText}>IN PERSON</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.eventTitle}>{event.title}</Text>
                      </View>
                    </View>

                    <View style={styles.eventMetaBlock}>
                      <View style={styles.eventMetaRow}>
                        <Ionicons name="calendar-outline" size={14} color={Palette.goldDark} />
                        <Text style={styles.eventMetaText}>
                          {dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </Text>
                      </View>
                      <View style={styles.eventMetaRow}>
                        <Ionicons name="time-outline" size={14} color={Palette.goldDark} />
                        <Text style={styles.eventMetaText}>{event.time_str}</Text>
                      </View>
                      <View style={styles.eventMetaRow}>
                        <Ionicons name="people-outline" size={14} color={Palette.goldDark} />
                        <Text style={styles.eventMetaText}>{event.attendees_count} registered</Text>
                      </View>
                      <View style={styles.eventMetaRow}>
                        <Ionicons name="location-outline" size={14} color={Palette.goldDark} />
                        <Text style={styles.eventMetaText}>{event.location}</Text>
                      </View>
                    </View>

                    {event.description ? (
                      <Text style={styles.eventDesc} numberOfLines={2}>{event.description}</Text>
                    ) : null}

                    {/* View Event button at the bottom */}
                    <Pressable
                      style={styles.viewEventBtn}
                      onPress={() => router.push(`/events/${event.id}` as any)}
                    >
                      <Ionicons name="eye-outline" size={16} color={Palette.goldDark} />
                      <Text style={styles.viewEventText}>View Event</Text>
                      <Ionicons name="chevron-forward" size={14} color={Palette.goldDark} />
                    </Pressable>
                  </Card>
                );
              })}
            </View>
          )}
        </View>
      )}

      {/* ════════════════════════ SEVA ════════════════════════ */}
      {activeSegment === 'volunteer' && (
        <View style={styles.sectionWrap}>
          <SectionTitle>Seva opportunities</SectionTitle>
          <Text style={[ui.body, { marginBottom: 4 }]}>
            Offer your time and skills in selfless service to support the community.
          </Text>

          {volunteersLoading ? (
            <View style={styles.loadingWrap}><ActivityIndicator color={Palette.gold} size="large" /></View>
          ) : opportunities.length === 0 ? (
            <Card style={styles.emptyCard}>
              <MaterialCommunityIcons name="hand-heart-outline" size={44} color={Palette.stoneLight} />
              <Text style={styles.emptyTitle}>No active Seva roles</Text>
              <Text style={[ui.small, { textAlign: 'center' }]}>All volunteer positions are currently filled.</Text>
            </Card>
          ) : (
            <View style={styles.volunteerList}>
              {opportunities.map((opp) => (
                <Card key={opp.id} style={styles.volunteerCard}>
                  {/* ── 1. View Seva button (at top, like event) ── */}
                  <View style={styles.volViewRow}>
                    <View style={styles.volCatBadge}>
                      <Text style={styles.volCatText}>{opp.category.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.volCountBadge}>
                      {opp.current_volunteers} / {opp.required_volunteers} volunteers
                    </Text>
                  </View>

                  {/* ── 2. Seva details ── */}
                  <Text style={styles.volTitle}>{opp.title}</Text>

                  <View style={styles.volMetaBlock}>
                    <View style={styles.eventMetaRow}>
                      <Ionicons name="location-outline" size={14} color={Palette.goldDark} />
                      <Text style={styles.eventMetaText}>{opp.location}</Text>
                    </View>
                    <View style={styles.eventMetaRow}>
                      <MaterialCommunityIcons name="hand-heart-outline" size={14} color={Palette.goldDark} />
                      <Text style={styles.eventMetaText}>{opp.category}</Text>
                    </View>
                  </View>

                  <Text style={styles.volDesc}>{opp.description}</Text>

                  {/* ── 3. Apply / Register button ── */}
                  <Pressable
                    style={[styles.volApplyBtn, opp.applied_by_user && styles.volApplyBtnDone]}
                    onPress={() => handleApplyVolunteer(opp)}
                    disabled={opp.applied_by_user}
                  >
                    <Ionicons
                      name={opp.applied_by_user ? 'checkmark-circle' : 'person-add-outline'}
                      size={16}
                      color={opp.applied_by_user ? Palette.surface : Palette.goldDark}
                    />
                    <Text style={[styles.volApplyText, opp.applied_by_user && styles.volApplyTextDone]}>
                      {opp.applied_by_user ? 'Seva Application Submitted' : 'Offer Seva / Volunteer'}
                    </Text>
                  </Pressable>
                </Card>
              ))}
            </View>
          )}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loadingWrap: { paddingVertical: 48, alignItems: 'center' },

  // ── Segment Controller ──
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: Palette.surface,
    borderRadius: 18,
    padding: 4,
    borderWidth: 1,
    borderColor: Palette.line,
    marginVertical: 12,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  segmentBtnActive: { backgroundColor: Palette.goldDark },
  segmentText: { color: Palette.charcoal, fontSize: 12, fontWeight: '700' },
  segmentTextActive: { color: Palette.surface },

  sectionWrap: { gap: 12 },

  // ── Community ──
  communityHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },
  catPillsRow: { gap: 6, paddingRight: 8 },
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.line,
  },
  catPillActive: { backgroundColor: Palette.goldSoft, borderColor: Palette.gold },
  catPillText: { fontSize: 12, fontWeight: '600', color: Palette.charcoal },
  catPillTextActive: { color: Palette.goldDark, fontWeight: '700' },
  newPostBtn: {
    backgroundColor: Palette.goldDark,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  newPostBtnText: { color: Palette.surface, fontSize: 13, fontWeight: '700' },

  postList: { gap: 12 },
  postCard: { gap: 8, padding: 16 },
  postTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  authorBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  authorName: { color: Palette.charcoal, fontSize: 13, fontWeight: '700' },
  postTag: { backgroundColor: Palette.goldSoft, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  postTagText: { color: Palette.goldDark, fontSize: 11, fontWeight: '700' },
  postTitle: { color: Palette.charcoal, fontFamily: 'serif', fontSize: 17, fontWeight: '700', lineHeight: 22 },
  postSnippet: { color: Palette.stone, fontSize: 14, lineHeight: 20 },
  postFooter: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 6 },
  // likeBtn — commented out (upvote hidden)
  // likeBtn: { ... },
  // likeCount: { ... },
  // likeCountActive: { ... },
  postFooterRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  deleteBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  commentBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  commentCount: { color: Palette.stone, fontSize: 12, fontWeight: '600' },

  // ── Events ──
  eventsList: { gap: 14 },
  eventCard: { gap: 12, padding: 16 },

  // 1. View Event button
  viewEventBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: Palette.goldSoft,
    borderWidth: 1,
    borderColor: Palette.gold,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  viewEventText: { color: Palette.goldDark, fontSize: 13, fontWeight: '700', flex: 1 },

  // 2. Event header
  eventHeaderRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  dateBlock: {
    width: 52,
    height: 56,
    borderRadius: 14,
    backgroundColor: Palette.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Palette.gold,
  },
  dateMonth: { color: Palette.goldDark, fontSize: 11, fontWeight: '800' },
  dateDay: { color: Palette.charcoal, fontFamily: 'serif', fontSize: 20, fontWeight: '700' },
  eventMainInfo: { flex: 1, gap: 4 },
  eventPillRow: { flexDirection: 'row', alignItems: 'center' },
  inPersonPill: { backgroundColor: '#E0F2FE', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  inPersonText: { color: '#0369A1', fontSize: 10, fontWeight: '800' },
  eventTitle: { color: Palette.charcoal, fontFamily: 'serif', fontSize: 17, fontWeight: '700', lineHeight: 22 },

  // Detail rows
  eventMetaBlock: { gap: 6 },
  eventMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eventMetaText: { color: Palette.charcoal, fontSize: 13, fontWeight: '600', flex: 1 },

  eventDesc: { color: Palette.stone, fontSize: 13, lineHeight: 18 },

  // ── Seva / Volunteer ──
  volunteerList: { gap: 12 },
  volunteerCard: { gap: 10, padding: 16 },

  volViewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  volCatBadge: { backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  volCatText: { color: '#047857', fontSize: 10, fontWeight: '800' },
  volCountBadge: { color: Palette.stone, fontSize: 12, fontWeight: '600' },
  volTitle: { color: Palette.charcoal, fontFamily: 'serif', fontSize: 18, fontWeight: '700' },
  volMetaBlock: { gap: 5 },
  volDesc: { color: Palette.stone, fontSize: 13, lineHeight: 18 },
  volApplyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.goldDark,
    paddingVertical: 11,
    borderRadius: 14,
    marginTop: 4,
  },
  volApplyBtnDone: { backgroundColor: '#059669', borderColor: '#059669' },
  volApplyText: { color: Palette.goldDark, fontSize: 14, fontWeight: '700' },
  volApplyTextDone: { color: Palette.surface },

  // ── Empty states ──
  emptyCard: { alignItems: 'center', gap: 10, paddingVertical: 36 },
  emptyTitle: { color: Palette.charcoal, fontFamily: 'serif', fontSize: 18, fontWeight: '700' },
  createFirstBtn: { backgroundColor: Palette.goldDark, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14, marginTop: 4 },
  createFirstText: { color: Palette.surface, fontSize: 14, fontWeight: '700' },
});
