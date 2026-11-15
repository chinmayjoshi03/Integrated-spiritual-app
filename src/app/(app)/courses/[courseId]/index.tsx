import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import RazorpayCheckoutSheet from '@/components/RazorpayCheckoutSheet';
import {
  ActionButton,
  AppHeader,
  Banner,
  Card,
  EmptyState,
  Eyebrow,
  Loading,
  Notice,
  ProgressBar,
  Screen,
  SectionTitle,
  StatusBadge,
  ui,
} from '@/components/karma-ui';
import { Brand, BrandFonts, Palette } from '@/constants/theme';
import { useSession } from '@/context/auth-context';
import {
  type CourseDetail,
  type Lesson,
  apiCreateCoursePaymentOrder,
  apiEnrollCourse,
  apiGetCourseBookmarkStatus,
  apiGetCourseDetail,
  apiGetEnrollmentStatus,
  apiToggleBookmark,
} from '@/services/api';

const formatScheduled = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

export default function CourseDetailScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const id = Number(courseId);
  const { session, user } = useSession();

  const [detail, setDetail] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');
  const [enrolled, setEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkBusy, setBookmarkBusy] = useState(false);

  const load = useCallback(async () => {
    if (!session || !Number.isInteger(id)) return;
    const [res, status, bookmark] = await Promise.all([
      apiGetCourseDetail(session, id),
      apiGetEnrollmentStatus(session, id),
      apiGetCourseBookmarkStatus(session, id),
    ]);
    if (res.error || !res.data) setError(res.error ?? 'Course not found.');
    else { setError(''); setDetail(res.data); }
    setEnrolled(Boolean(status.data?.enrolled));
    setBookmarked(Boolean(bookmark.data?.bookmarked));
    setLoading(false);
  }, [session, id]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const enroll = async () => {
    if (!session || !detail) return;
    setActionError('');
    if (Number(detail.course.price) > 0) return setCheckoutOpen(true);
    setEnrolling(true);
    const res = await apiEnrollCourse(session, id);
    setEnrolling(false);
    if (res.error && !res.error.toLowerCase().includes('already enrolled')) return setActionError(res.error);
    setEnrolled(true);
    setNotice('You are enrolled. Happy learning!');
    void load();
  };

  const toggleBookmark = async () => {
    if (!session || bookmarkBusy) return;
    setBookmarkBusy(true);
    const res = await apiToggleBookmark(session, 'course', id);
    setBookmarkBusy(false);
    if (res.error) return setActionError(res.error);
    setBookmarked(Boolean(res.data?.bookmarked));
  };

  if (loading) return <Screen><AppHeader title="Course" back /><Loading /></Screen>;
  if (error || !detail) {
    return <Screen>
      <AppHeader title="Course" back />
      <EmptyState icon="school-outline" title="Course unavailable" message={error} action={<ActionButton variant="outline" label="Try again" onPress={() => { setLoading(true); void load(); }} />} />
    </Screen>;
  }

  const { course, lessons, locked } = detail;
  const isMentor = user?.role === 'mentor';
  const hasFullAccess = enrolled || !locked;
  const completedCount = lessons.filter((l) => l.completed).length;
  const pct = lessons.length ? Math.round((completedCount / lessons.length) * 100) : 0;
  const resumeLesson = lessons.find((l) => !l.completed && l.watched_sec > 0) ?? lessons.find((l) => !l.completed);
  const hasPreview = lessons.some((l) => l.is_free);
  const price = Number(course.price);

  const openLesson = (lesson: Lesson) => {
    const lessonLocked = locked && !lesson.is_free;
    if (lessonLocked) return setActionError('Enroll in this course to unlock this lesson.');
    router.push(`/courses/${id}/lesson/${lesson.id}` as any);
  };

  return <Screen>
    <AppHeader title="Course" back />

    <Card style={styles.hero}>
      <Banner uri={course.thumbnail_url} icon="school-outline" height={180} />
      <View style={styles.heroBody}>
        <View style={styles.badges}>
          <StatusBadge status="neutral" label={(course.delivery_mode || 'online').toUpperCase()} />
          {hasFullAccess ? <StatusBadge status="approved" label={enrolled ? 'Enrolled' : isMentor ? 'Instructor access' : 'Full access'} /> : null}
        </View>
        <Text style={styles.title}>{course.title}</Text>
        <Text style={ui.small}>with {course.mentor_name || 'TBD'}</Text>
        {course.description ? <Text style={ui.body}>{course.description}</Text> : null}
        {course.delivery_mode === 'live' ? <Text style={ui.small}>Live session times and Meet links are listed with each lesson.</Text> : null}
        <Pressable onPress={toggleBookmark} style={styles.bookmark} accessibilityRole="button" accessibilityState={{ selected: bookmarked }} disabled={bookmarkBusy}>
          <Ionicons name={bookmarked ? 'bookmark' : 'bookmark-outline'} size={18} color={Palette.goldDark} />
          <Text style={styles.bookmarkText}>{bookmarked ? 'Saved for later' : 'Save course for later'}</Text>
        </Pressable>
      </View>
    </Card>

    {notice ? <Notice tone="success">{notice}</Notice> : null}
    {actionError ? <Notice tone="error">{actionError}</Notice> : null}

    {!hasFullAccess ? (
      <Card>
        <Eyebrow>ENROLL</Eyebrow>
        <Text style={styles.price}>{price > 0 ? `₹${price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : 'Free'}</Text>
        {hasPreview ? <Text style={ui.small}>Preview the free demo lessons below before enrolling.</Text> : null}
        <ActionButton label={price > 0 ? 'Continue to payment' : 'Enroll for free'} onPress={enroll} loading={enrolling} />
      </Card>
    ) : null}

    {enrolled && lessons.length > 0 ? (
      <Card>
        <Eyebrow>YOUR PROGRESS</Eyebrow>
        <View style={styles.progressHead}>
          <Text style={styles.progressPct}>{pct}% complete</Text>
          <Text style={ui.small}>{completedCount} of {lessons.length} lessons</Text>
        </View>
        <ProgressBar pct={pct} />
        {resumeLesson ? <ActionButton icon="play-circle-outline" label={`Continue: ${resumeLesson.title}`} onPress={() => openLesson(resumeLesson)} /> : null}
      </Card>
    ) : null}

    <SectionTitle>Curriculum & lessons</SectionTitle>
    {lessons.length === 0 ? <EmptyState icon="list-outline" title="No lessons yet" message="Lessons will appear here once they are added." /> : (
      <View style={{ gap: 10 }}>
        {lessons.map((lesson, idx) => {
          const lessonLocked = locked && !lesson.is_free;
          const meta = [
            lesson.is_free && locked ? 'FREE DEMO' : null,
            (lesson.content_type || 'video').toUpperCase(),
            lessonLocked ? 'Enroll to unlock' : null,
            lesson.completed ? 'Completed' : lesson.watched_sec > 0 ? 'Continue where you left off' : null,
          ].filter(Boolean).join(' · ');
          return <Card key={lesson.id} style={styles.lessonCard}>
            <Pressable onPress={() => openLesson(lesson)} accessibilityRole="button" accessibilityLabel={lesson.title} style={styles.lessonRow}>
              <View style={[styles.lessonNum, lesson.completed && styles.lessonNumDone]}>
                {lesson.completed
                  ? <Ionicons name="checkmark" size={18} color={Palette.success} />
                  : <Text style={styles.lessonNumText}>{lesson.position || idx + 1}</Text>}
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.lessonTitle} numberOfLines={2}>{lesson.title}</Text>
                <Text style={ui.small}>{meta}</Text>
                {course.delivery_mode === 'live' && lesson.scheduled_at ? <Text style={ui.small}>Live session · {formatScheduled(lesson.scheduled_at)}</Text> : null}
              </View>
              <Ionicons
                name={lessonLocked ? 'lock-closed-outline' : lesson.content_type === 'pdf' ? 'document-text-outline' : 'play-circle-outline'}
                size={24}
                color={lessonLocked ? Palette.stoneLight : Palette.gold}
              />
            </Pressable>
            {/* Sibling of the row button, not inside it (a link can't sit inside a <button> on web). */}
            {!lessonLocked && lesson.meet_link ? (
              <Pressable onPress={() => Linking.openURL(lesson.meet_link!).catch(() => setActionError('Could not open the Meet link.'))} style={styles.meet} accessibilityRole="link">
                <Ionicons name="videocam-outline" size={15} color={Palette.goldDark} />
                <Text style={styles.meetText}>Join this lesson</Text>
              </Pressable>
            ) : null}
          </Card>;
        })}
      </View>
    )}

    <RazorpayCheckoutSheet
      visible={checkoutOpen}
      amount={price}
      merchantName={Brand.name}
      purpose="Course enrollment"
      details={[
        { label: 'Course', value: course.title },
        { label: 'Instructor', value: course.mentor_name ?? 'To be announced' },
      ]}
      createOrder={() => apiCreateCoursePaymentOrder(session!, id)}
      onPaymentComplete={() => { setEnrolled(true); setNotice('Payment successful. You are enrolled — happy learning!'); void load(); }}
      token={session ?? null}
      onClose={() => setCheckoutOpen(false)}
    />
  </Screen>;
}

const styles = StyleSheet.create({
  hero: { padding: 0, gap: 0, overflow: 'hidden' },
  heroBody: { padding: 20, gap: 10 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  title: { fontFamily: BrandFonts.heading, fontSize: 26, lineHeight: 33, color: Palette.charcoal },
  bookmark: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: Palette.line, backgroundColor: Palette.surfaceRaised },
  bookmarkText: { fontFamily: BrandFonts.bodySemi, fontSize: 14, color: Palette.goldDark },
  price: { fontFamily: BrandFonts.heading, fontSize: 30, color: Palette.charcoal },
  progressHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  progressPct: { fontFamily: BrandFonts.heading, fontSize: 20, color: Palette.charcoal },
  lessonCard: { paddingVertical: 14, gap: 6 },
  lessonRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  lessonNum: { width: 42, height: 42, borderRadius: 21, backgroundColor: Palette.goldSoft, alignItems: 'center', justifyContent: 'center' },
  lessonNumDone: { backgroundColor: Palette.successSoft },
  lessonNumText: { fontFamily: BrandFonts.heading, fontSize: 16, color: Palette.goldDark },
  lessonTitle: { fontFamily: BrandFonts.bodySemi, fontSize: 15, color: Palette.charcoal },
  meet: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 4, marginLeft: 56 },
  meetText: { fontFamily: BrandFonts.bodySemi, fontSize: 13, color: Palette.goldDark },
});
