import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ActionButton, Banner, Card, StatusBadge, ui } from '@/components/karma-ui';
import { BrandFonts, Palette } from '@/constants/theme';
import {
  formatDate,
  formatDuration,
  formatShortDate,
  formatTime,
  getEventLifecycle,
  getVolunteerLifecycle,
  lifecycleLabel,
  timeAgo,
  volunteerDurationMinutes,
} from '@/lib/lifecycle';
import type { CommunityAuthor, CommunityGroup, CommunityQuestion, EventItem, VolunteerOpportunity } from '@/services/api';

function Meta({ icon, text }: { icon: React.ComponentProps<typeof Ionicons>['name']; text: string }) {
  return <View style={styles.metaRow}>
    <Ionicons name={icon} size={15} color={Palette.goldDark} />
    <Text style={styles.metaText} numberOfLines={1}>{text}</Text>
  </View>;
}

// ── Events ───────────────────────────────────────────────────────────────────

export function EventCard({ event }: { event: EventItem }) {
  const lifecycle = getEventLifecycle(event);
  const isOnline = event.event_type === 'online';
  const isFull = event.capacity !== null && (event.registered_count ?? 0) >= event.capacity;
  const capacity = event.capacity === null
    ? `${event.registered_count ?? 0} registered`
    : `${event.registered_count ?? 0} / ${event.capacity} registered`;

  return <Pressable onPress={() => router.push(`/events/${event.id}` as any)} accessibilityRole="button" accessibilityLabel={`View ${event.title}`}>
    <Card style={styles.flushCard}>
      <Banner uri={event.banner_url} icon="calendar-outline" height={140} />
      <View style={styles.body}>
        <View style={styles.topRow}>
          <View style={styles.typePill}>
            <Ionicons name={isOnline ? 'videocam-outline' : 'location-outline'} size={13} color={Palette.goldDark} />
            <Text style={styles.typeText}>{isOnline ? 'ONLINE' : 'IN PERSON'}</Text>
          </View>
          <View style={styles.badges}>
            {event.is_registered ? <StatusBadge status="registered" /> : null}
            <StatusBadge status={lifecycle} label={lifecycleLabel(lifecycle)} />
          </View>
        </View>
        <Text style={styles.title} numberOfLines={2}>{event.title}</Text>
        {event.description ? <Text style={ui.small} numberOfLines={2}>{event.description}</Text> : null}
        <View style={styles.metaBlock}>
          <Meta icon="calendar-outline" text={formatShortDate(event.event_date)} />
          <Meta icon="time-outline" text={`${formatTime(event.start_time)}${event.duration_minutes ? ` · ${formatDuration(event.duration_minutes)}` : ''}`} />
          {!isOnline && event.location ? <Meta icon="location-outline" text={event.location} /> : null}
          <Meta icon="people-outline" text={isFull ? 'Event is full' : capacity} />
        </View>
        <View style={styles.footer}>
          <Text style={styles.fee}>{Number(event.fee) > 0 ? `₹${Number(event.fee).toLocaleString('en-IN')}` : 'Free'}</Text>
          <View style={styles.cta}><Text style={styles.ctaText}>View details</Text><Ionicons name="chevron-forward" size={15} color={Palette.goldDark} /></View>
        </View>
      </View>
    </Card>
  </Pressable>;
}

// ── Volunteering ─────────────────────────────────────────────────────────────

export function VolunteerCard({ opportunity, showApplication = false }: { opportunity: VolunteerOpportunity; showApplication?: boolean }) {
  const isOnline = opportunity.volunteer_type === 'online';
  const lifecycle = getVolunteerLifecycle(opportunity);
  const applicationStatus = opportunity.application_status ?? opportunity.my_application?.status;
  const capacity = opportunity.capacity === null ? `${opportunity.occupied} applied` : `${opportunity.occupied} / ${opportunity.capacity} volunteers`;
  const duration = formatDuration(volunteerDurationMinutes(opportunity.start_time, opportunity.end_time));

  return <Pressable onPress={() => router.push(`/volunteering/${opportunity.id}` as any)} accessibilityRole="button" accessibilityLabel={`View ${opportunity.title}`}>
    <Card style={styles.flushCard}>
      <Banner uri={opportunity.banner_url} icon="heart-outline" height={130} />
      <View style={styles.body}>
        <View style={styles.topRow}>
          <View style={styles.typePill}>
            <Ionicons name={isOnline ? 'videocam-outline' : 'location-outline'} size={13} color={Palette.goldDark} />
            <Text style={styles.typeText}>{isOnline ? 'ONLINE' : 'OFFLINE'}</Text>
          </View>
          <View style={styles.badges}>
            {applicationStatus ? <StatusBadge status={applicationStatus} /> : null}
            {lifecycle !== 'upcoming' ? <StatusBadge status={lifecycle} label={lifecycleLabel(lifecycle)} /> : null}
          </View>
        </View>
        {opportunity.category ? <Text style={styles.category}>{opportunity.category.toUpperCase()}</Text> : null}
        <Text style={styles.title} numberOfLines={2}>{opportunity.title}</Text>
        <Text style={ui.small} numberOfLines={2}>{opportunity.description}</Text>
        <View style={styles.metaBlock}>
          <Meta icon="calendar-outline" text={formatDate(opportunity.event_date)} />
          <Meta icon="time-outline" text={`${formatTime(opportunity.start_time)} – ${formatTime(opportunity.end_time)}${duration ? ` · ${duration}` : ''}`} />
          {!isOnline && opportunity.location ? <Meta icon="location-outline" text={opportunity.location} /> : null}
          <Meta icon="people-outline" text={opportunity.is_full ? 'Full' : capacity} />
        </View>
        {showApplication && (opportunity.attendance_status || (opportunity.certificate_status && opportunity.certificate_status !== 'not_available')) ? (
          <View style={styles.participation}>
            {opportunity.attendance_status ? <Text style={ui.small}>Attendance: <Text style={styles.strong}>{opportunity.attendance_status}</Text></Text> : null}
            {opportunity.certificate_status && opportunity.certificate_status !== 'not_available'
              ? <Text style={ui.small}>Certificate: <Text style={styles.strong}>{opportunity.certificate_status}</Text></Text>
              : null}
          </View>
        ) : null}
        <View style={styles.footer}>
          <View />
          <View style={styles.cta}><Text style={styles.ctaText}>View details</Text><Ionicons name="chevron-forward" size={15} color={Palette.goldDark} /></View>
        </View>
      </View>
    </Card>
  </Pressable>;
}

// ── Community ────────────────────────────────────────────────────────────────

export function RoleBadge({ role }: { role: CommunityAuthor['role'] }) {
  if (role !== 'mentor' && role !== 'admin') return null;
  return <View style={[styles.roleBadge, role === 'admin' && styles.roleBadgeAdmin]}>
    <Ionicons name={role === 'mentor' ? 'school-outline' : 'shield-checkmark-outline'} size={11} color={role === 'mentor' ? Palette.goldDark : Palette.brown} />
    <Text style={[styles.roleText, role === 'admin' && { color: Palette.brown }]}>{role === 'mentor' ? 'Mentor' : 'Admin'}</Text>
  </View>;
}

export function AuthorLine({ author, createdAt }: { author: CommunityAuthor; createdAt: string }) {
  const initial = (author?.name || '?').charAt(0).toUpperCase();
  return <View style={styles.authorRow}>
    <View style={styles.authorAvatar}><Text style={styles.authorInitial}>{initial}</Text></View>
    <Text style={styles.authorName} numberOfLines={1}>{author?.name || 'Community member'}</Text>
    <RoleBadge role={author?.role} />
    <Text style={styles.authorTime}>· {timeAgo(createdAt)}</Text>
  </View>;
}

export function CommunityGroupCard({
  group,
  busy,
  onJoin,
}: {
  group: CommunityGroup;
  busy?: boolean;
  onJoin: () => void;
}) {
  const open = () => router.push(`/community/group/${group.id}` as any);
  // The card is not itself a button: on web a <button> can't contain the Join <button>.
  return <Card style={styles.flushCard}>
    <Pressable onPress={open} accessibilityRole="button" accessibilityLabel={`Open ${group.name}`}>
      {group.banner_url ? <Banner uri={group.banner_url} icon="people-outline" height={110} /> : null}
      <View style={[styles.body, styles.groupInfo]}>
        <View style={styles.topRow}>
          {group.category ? <Text style={styles.category}>{group.category.toUpperCase()}</Text> : <View />}
          {group.is_member ? <StatusBadge status="approved" label="Joined" /> : null}
        </View>
        <Text style={styles.title}>{group.name}</Text>
        {group.description ? <Text style={ui.small} numberOfLines={3}>{group.description}</Text> : null}
        <View style={styles.groupStats}>
          <Meta icon="people-outline" text={`${group.member_count ?? 0} member${group.member_count === 1 ? '' : 's'}`} />
          <Meta icon="chatbubbles-outline" text={`${group.question_count ?? 0} discussion${group.question_count === 1 ? '' : 's'}`} />
        </View>
      </View>
    </Pressable>
    <View style={styles.groupAction}>
      {group.is_member ? (
        <ActionButton variant="quiet" icon="arrow-forward" label="Open community" onPress={open} />
      ) : (
        <ActionButton icon="person-add-outline" label="Join community" loading={busy} onPress={onJoin} />
      )}
    </View>
  </Card>;
}

export function QuestionCard({ question, showGroup = true }: { question: CommunityQuestion; showGroup?: boolean }) {
  return <Pressable onPress={() => router.push(`/community/question/${question.id}` as any)} accessibilityRole="button" accessibilityLabel={`Open discussion ${question.title}`}>
    <Card style={styles.questionCard}>
      {showGroup && question.group_name ? <Text style={styles.category}>{question.group_name.toUpperCase()}</Text> : null}
      <Text style={styles.questionTitle}>{question.title}</Text>
      <Text style={ui.small} numberOfLines={3}>{question.content}</Text>
      <View style={styles.questionFooter}>
        <AuthorLine author={question.author} createdAt={question.created_at} />
        <View style={styles.replyCount}>
          <Ionicons name="chatbubble-outline" size={14} color={Palette.stone} />
          <Text style={styles.replyText}>{question.reply_count ?? 0}</Text>
        </View>
      </View>
    </Card>
  </Pressable>;
}

const styles = StyleSheet.create({
  groupInfo: { paddingBottom: 8 },
  groupAction: { paddingHorizontal: 18, paddingBottom: 18 },
  flushCard: { padding: 0, gap: 0, overflow: 'hidden' },
  body: { padding: 18, gap: 9 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  badges: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end', flexShrink: 1 },
  typePill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Palette.goldSoft, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  typeText: { fontFamily: BrandFonts.bodyBold, fontSize: 10, letterSpacing: 0.6, color: Palette.goldDark },
  category: { fontFamily: BrandFonts.bodyBold, fontSize: 10, letterSpacing: 1, color: Palette.goldDark },
  title: { fontFamily: BrandFonts.heading, fontSize: 19, lineHeight: 25, color: Palette.charcoal },
  metaBlock: { gap: 6, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { fontFamily: BrandFonts.body, fontSize: 13, color: Palette.stone, flexShrink: 1 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, paddingTop: 10, borderTopWidth: 1, borderTopColor: Palette.line },
  fee: { fontFamily: BrandFonts.bodyBold, fontSize: 14, color: Palette.charcoal },
  cta: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ctaText: { fontFamily: BrandFonts.bodySemi, fontSize: 14, color: Palette.goldDark },
  participation: { backgroundColor: Palette.highlight, borderRadius: 12, padding: 10, gap: 3 },
  strong: { fontFamily: BrandFonts.bodySemi, color: Palette.charcoal, textTransform: 'capitalize' },
  groupStats: { flexDirection: 'row', gap: 16, flexWrap: 'wrap', marginVertical: 2 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: Palette.goldSoft, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  roleBadgeAdmin: { backgroundColor: Palette.goldSelected },
  roleText: { fontFamily: BrandFonts.bodyBold, fontSize: 10, color: Palette.goldDark },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  authorAvatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: Palette.goldSoft, alignItems: 'center', justifyContent: 'center' },
  authorInitial: { fontFamily: BrandFonts.bodyBold, fontSize: 11, color: Palette.goldDark },
  authorName: { fontFamily: BrandFonts.bodySemi, fontSize: 13, color: Palette.charcoal, flexShrink: 1 },
  authorTime: { fontFamily: BrandFonts.body, fontSize: 12, color: Palette.stoneLight },
  questionCard: { gap: 8, padding: 18 },
  questionTitle: { fontFamily: BrandFonts.heading, fontSize: 18, lineHeight: 24, color: Palette.charcoal },
  questionFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 4 },
  replyCount: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  replyText: { fontFamily: BrandFonts.bodySemi, fontSize: 13, color: Palette.stone },
});
