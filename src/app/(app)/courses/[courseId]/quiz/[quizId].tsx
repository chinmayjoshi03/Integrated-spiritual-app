import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader, Card, ui } from '@/components/karma-ui';
import { Palette, Spacing } from '@/constants/theme';
import { useSession } from '@/context/auth-context';
import {
  type QuizDetail,
  type QuizFeedbackItem,
  type QuizResult,
  apiGetQuiz,
  apiSubmitQuiz,
} from '@/services/api';

type Screen = 'intro' | 'questions' | 'result';

export default function QuizScreen() {
  const { courseId, quizId } = useLocalSearchParams<{
    courseId: string;
    quizId: string;
  }>();
  const { session } = useSession();

  const [detail, setDetail] = useState<QuizDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [screen, setScreen] = useState<Screen>('intro');
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [result, setResult] = useState<QuizResult | null>(null);

  const load = useCallback(async () => {
    if (!session || !courseId || !quizId) return;
    const res = await apiGetQuiz(session, Number(courseId), Number(quizId));
    if (res.data) {
      setDetail(res.data);
      setAnswers(new Array(res.data.questions.length).fill(null));
    }
    setLoading(false);
  }, [session, courseId, quizId]);

  useEffect(() => { load(); }, [load]);

  const handleStart = () => {
    setCurrentQ(0);
    setAnswers(new Array(detail?.questions.length ?? 0).fill(null));
    setScreen('questions');
  };

  const handleSelect = (optionIdx: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[currentQ] = optionIdx;
      return next;
    });
  };

  const handleNext = () => {
    if (currentQ < (detail?.questions.length ?? 1) - 1) {
      setCurrentQ((q) => q + 1);
    }
  };

  const handlePrev = () => {
    if (currentQ > 0) setCurrentQ((q) => q - 1);
  };

  const handleSubmit = async () => {
    if (!session || !detail) return;
    setSubmitting(true);
    const res = await apiSubmitQuiz(
      session,
      Number(courseId),
      Number(quizId),
      answers.map((a) => a ?? 0)
    );
    setSubmitting(false);
    if (res.data) {
      setResult(res.data);
      setScreen('result');
    }
  };

  // ── Loading ──
  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Palette.gold} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!detail) {
    return (
      <SafeAreaView style={styles.safe}>
        <AppHeader title="Quiz" back />
        <Text style={styles.errorText}>Quiz not found.</Text>
      </SafeAreaView>
    );
  }

  // ── Intro screen ──
  if (screen === 'intro') {
    const best = detail.attempts[0];
    const bestPct = best ? Math.round((best.score / best.total) * 100) : null;
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.headerWrap}>
            <AppHeader title="Quiz" back />
          </View>
          <View style={styles.body}>
            {/* Hero */}
            <View style={styles.quizHero}>
              <View style={styles.quizHeroCircle}>
                <Text style={styles.quizHeroQ}>?</Text>
              </View>
              <Text style={styles.quizTitle}>{detail.quiz.title}</Text>
              {detail.quiz.description ? (
                <Text style={[ui.body, { textAlign: 'center' }]}>{detail.quiz.description}</Text>
              ) : null}
            </View>

            {/* Stats row */}
            <Card style={styles.statsCard}>
              <View style={styles.statsRow}>
                <StatBit label="Questions" value={String(detail.questions.length)} />
                <View style={styles.statsDivider} />
                <StatBit label="Attempts" value={String(detail.attempts.length)} />
                {best && (
                  <>
                    <View style={styles.statsDivider} />
                    <StatBit
                      label="Best score"
                      value={`${best.score}/${best.total}`}
                      sub={`${bestPct}%`}
                      highlight
                    />
                  </>
                )}
              </View>
            </Card>

            {/* Previous attempts */}
            {detail.attempts.length > 0 && (
              <View style={styles.attemptsWrap}>
                <Text style={styles.attemptsHeading}>Previous attempts</Text>
                {detail.attempts.map((a) => {
                  const pct = Math.round((a.score / a.total) * 100);
                  const passed = pct >= 60;
                  return (
                    <Card key={a.id} style={styles.attemptCard}>
                      <View style={[styles.attemptScoreChip, passed ? styles.attemptPass : styles.attemptFail]}>
                        <Text style={[styles.attemptScoreText, passed ? styles.attemptPassText : styles.attemptFailText]}>
                          {a.score}/{a.total}
                        </Text>
                        <Text style={[styles.attemptPct, passed ? styles.attemptPassText : styles.attemptFailText]}>
                          {pct}%
                        </Text>
                      </View>
                      <Text style={styles.attemptDate}>
                        {new Date(a.attempted_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </Text>
                    </Card>
                  );
                })}
              </View>
            )}

            <Pressable style={styles.startBtn} onPress={handleStart}>
              <Text style={styles.startBtnText}>
                {detail.attempts.length > 0 ? 'Retake quiz' : 'Start quiz'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Questions screen ──
  if (screen === 'questions') {
    const q = detail.questions[currentQ];
    const selected = answers[currentQ];
    const allAnswered = answers.every((a) => a !== null);
    const isLast = currentQ === detail.questions.length - 1;
    const progressPct = Math.round(((currentQ + (selected !== null ? 1 : 0)) / detail.questions.length) * 100);
    const answeredCount = answers.filter((a) => a !== null).length;

    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.headerWrap}>
            <AppHeader title={detail.quiz.title} back />
          </View>

          {/* Top progress bar */}
          <View style={styles.quizProgressWrap}>
            <View style={styles.quizProgressTrack}>
              <View style={[styles.quizProgressFill, { width: `${progressPct}%` }]} />
            </View>
            <Text style={styles.quizProgressText}>{answeredCount} of {detail.questions.length} answered</Text>
          </View>

          <View style={styles.body}>
            {/* Question dots */}
            <View style={styles.dotsRow}>
              {detail.questions.map((_, i) => (
                <Pressable key={i} onPress={() => setCurrentQ(i)}>
                  <View
                    style={[
                      styles.dot,
                      i === currentQ && styles.dotActive,
                      answers[i] !== null && i !== currentQ && styles.dotAnswered,
                    ]}
                  />
                </Pressable>
              ))}
            </View>

            <Text style={styles.qCounter}>
              Question {currentQ + 1} of {detail.questions.length}
            </Text>

            {/* Question card */}
            <Card style={styles.questionCard}>
              <Text style={styles.questionText}>{q.question}</Text>
            </Card>

            {/* Options */}
            <View style={styles.optionsList}>
              {(q.options as string[]).map((opt, oi) => (
                <Pressable key={oi} onPress={() => handleSelect(oi)}>
                  <View style={[styles.option, selected === oi && styles.optionSelected]}>
                    <View style={[styles.optionBullet, selected === oi && styles.optionBulletSelected]}>
                      <Text style={[styles.optionBulletText, selected === oi && styles.optionBulletTextSel]}>
                        {String.fromCharCode(65 + oi)}
                      </Text>
                    </View>
                    <Text style={[styles.optionText, selected === oi && styles.optionTextSelected]}>
                      {opt}
                    </Text>
                    {selected === oi && (
                      <Text style={styles.selectedCheck}>✓</Text>
                    )}
                  </View>
                </Pressable>
              ))}
            </View>

            {/* Navigation */}
            <View style={styles.navRow}>
              <Pressable
                style={[styles.navBtn, currentQ === 0 && styles.navBtnDisabled]}
                disabled={currentQ === 0}
                onPress={handlePrev}
              >
                <Text style={styles.navBtnText}>‹  Back</Text>
              </Pressable>

              {!isLast ? (
                <Pressable
                  style={[styles.navBtnPrimary, selected === null && styles.navBtnDisabled]}
                  disabled={selected === null}
                  onPress={handleNext}
                >
                  <Text style={styles.navBtnPrimaryText}>Next  ›</Text>
                </Pressable>
              ) : (
                <Pressable
                  style={[styles.submitQuizBtn, (!allAnswered || submitting) && styles.navBtnDisabled]}
                  disabled={!allAnswered || submitting}
                  onPress={handleSubmit}
                >
                  {submitting ? (
                    <ActivityIndicator color={Palette.charcoal} size="small" />
                  ) : (
                    <Text style={styles.submitQuizBtnText}>Submit quiz</Text>
                  )}
                </Pressable>
              )}
            </View>

            {!allAnswered && isLast && (
              <Text style={styles.unansweredNote}>
                Answer all {detail.questions.length} questions to submit.
              </Text>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Result screen ──
  if (screen === 'result' && result) {
    const passed = result.pct >= 60;
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.headerWrap}>
            <AppHeader title="Quiz results" back />
          </View>
          <View style={styles.body}>
            {/* Score circle card */}
            <Card style={[styles.scoreCard, passed ? styles.scoreCardPass : styles.scoreCardFail] as any}>
              <View style={[styles.scoreCircle, passed ? styles.scoreCirclePass : styles.scoreCircleFail]}>
                <Text style={[styles.scorePct, passed ? styles.scorePctPass : styles.scorePctFail]}>
                  {result.pct}%
                </Text>
                <Text style={styles.scoreCircleLabel}>score</Text>
              </View>
              <Text style={styles.scoreEmoji}>{passed ? '🎉' : '🙏'}</Text>
              <Text style={[styles.scoreHeading, passed ? styles.scoreHeadingPass : styles.scoreHeadingFail]}>
                {passed ? 'Well done!' : 'Keep going'}
              </Text>
              <Text style={styles.scoreSubLabel}>
                {result.score} out of {result.total} correct
              </Text>
              <Text style={[styles.scoreMessage, passed ? styles.scoreMessagePass : styles.scoreMessageFail]}>
                {passed
                  ? 'You have a solid understanding of the material.'
                  : 'Revisit the lessons and try again when you feel ready.'}
              </Text>

              {/* Mini score bar */}
              <View style={styles.scoreMiniBarTrack}>
                <View
                  style={[
                    styles.scoreMiniBarFill,
                    { width: `${result.pct}%` },
                    passed ? styles.scoreMiniBarPass : styles.scoreMiniBarFail,
                  ]}
                />
              </View>
            </Card>

            {/* Review */}
            <Text style={styles.feedbackHeading}>Review answers</Text>
            {result.feedback.map((item, i) => (
              <FeedbackCard key={item.question_id} item={item} index={i} />
            ))}

            {/* Actions */}
            <View style={styles.resultActions}>
              <Pressable style={styles.retakeBtn} onPress={handleStart}>
                <Text style={styles.retakeBtnText}>Retake quiz</Text>
              </Pressable>
              <Pressable style={styles.backCourseBtn} onPress={() => router.back()}>
                <Text style={styles.backCourseBtnText}>Back to course</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatBit({
  label,
  value,
  sub,
  highlight = false,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <View style={{ alignItems: 'center', flex: 1, gap: 3 }}>
      <Text style={[styles.infoBitValue, highlight && styles.infoBitValueHL]}>{value}</Text>
      {sub && <Text style={styles.infoBitSub}>{sub}</Text>}
      <Text style={styles.infoBitLabel}>{label}</Text>
    </View>
  );
}

function FeedbackCard({ item, index }: { item: QuizFeedbackItem; index: number }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Card style={[styles.feedbackCard, item.is_correct ? styles.feedbackCorrect : styles.feedbackWrong] as any}>
      <Pressable onPress={() => setExpanded((e) => !e)} style={styles.feedbackHeader}>
        <View style={[styles.feedbackBadge, item.is_correct ? styles.badgeCorrect : styles.badgeWrong]}>
          <Text style={[styles.feedbackBadgeText, item.is_correct ? styles.badgeCorrectText : styles.badgeWrongText]}>
            {item.is_correct ? '✓' : '✗'}
          </Text>
        </View>
        <Text style={styles.feedbackQ} numberOfLines={expanded ? undefined : 2}>
          {index + 1}. {item.question}
        </Text>
        <Text style={styles.expandIcon}>{expanded ? '▲' : '▼'}</Text>
      </Pressable>

      {expanded && (
        <View style={styles.feedbackBody}>
          {(item.options as string[]).map((opt, oi) => {
            const isSelected = oi === item.selected_idx;
            const isCorrect = oi === item.correct_idx;
            return (
              <View
                key={oi}
                style={[
                  styles.feedbackOpt,
                  isCorrect && styles.feedbackOptCorrect,
                  isSelected && !isCorrect && styles.feedbackOptWrong,
                ]}
              >
                <Text
                  style={[
                    styles.feedbackOptText,
                    isCorrect && styles.feedbackOptTextCorrect,
                    isSelected && !isCorrect && styles.feedbackOptTextWrong,
                  ]}
                >
                  {isCorrect ? '✓ ' : isSelected ? '✗ ' : '   '}
                  {opt}
                </Text>
              </View>
            );
          })}
          {item.explanation && (
            <View style={styles.explanationWrap}>
              <Text style={styles.explanationLabel}>Explanation</Text>
              <Text style={ui.body}>{item.explanation}</Text>
            </View>
          )}
        </View>
      )}
    </Card>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.ivory },
  scroll: { paddingBottom: 120 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: Palette.danger, padding: 24, textAlign: 'center' },
  headerWrap: { paddingHorizontal: Spacing.three, paddingTop: Spacing.two },
  body: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    gap: Spacing.three,
    maxWidth: 760,
    alignSelf: 'center',
    width: '100%',
  },

  // ── Intro ──
  quizHero: { alignItems: 'center', gap: 14, paddingVertical: 8 },
  quizHeroCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Palette.goldSoft,
    borderWidth: 3,
    borderColor: Palette.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quizHeroQ: { fontFamily: 'serif', fontSize: 48, color: Palette.goldDark, fontWeight: '700' },
  quizTitle: { color: Palette.charcoal, fontFamily: 'serif', fontSize: 26, fontWeight: '700', lineHeight: 32, textAlign: 'center' },

  statsCard: { paddingVertical: 20 },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statsDivider: { width: 1, height: 36, backgroundColor: Palette.line },
  infoBitValue: { color: Palette.charcoal, fontFamily: 'serif', fontSize: 24, fontWeight: '700' },
  infoBitValueHL: { color: Palette.goldDark },
  infoBitSub: { color: Palette.gold, fontSize: 12, fontWeight: '700' },
  infoBitLabel: { color: Palette.stone, fontSize: 12 },

  attemptsWrap: { gap: 8 },
  attemptsHeading: { color: Palette.charcoal, fontFamily: 'serif', fontSize: 17, fontWeight: '700' },
  attemptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderRadius: 16,
  },
  attemptScoreChip: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  attemptPass: { backgroundColor: '#D4EDDA' },
  attemptFail: { backgroundColor: Palette.goldSoft },
  attemptScoreText: { fontFamily: 'serif', fontSize: 18, fontWeight: '700' },
  attemptPct: { fontSize: 13, fontWeight: '700' },
  attemptPassText: { color: '#2D6A4F' },
  attemptFailText: { color: Palette.goldDark },
  attemptDate: { color: Palette.stone, fontSize: 13 },

  startBtn: { minHeight: 54, borderRadius: 17, backgroundColor: Palette.gold, alignItems: 'center', justifyContent: 'center' },
  startBtnText: { color: Palette.charcoal, fontSize: 16, fontWeight: '700', fontFamily: 'serif' },

  // ── Questions ──
  quizProgressWrap: { paddingHorizontal: Spacing.three, gap: 6, marginTop: 4 },
  quizProgressTrack: {
    height: 6,
    borderRadius: 6,
    backgroundColor: Palette.goldSoft,
    overflow: 'hidden',
  },
  quizProgressFill: { height: '100%', borderRadius: 6, backgroundColor: Palette.gold },
  quizProgressText: { color: Palette.stone, fontSize: 12, fontWeight: '600' },

  dotsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Palette.line },
  dotActive: { backgroundColor: Palette.gold, width: 24, borderRadius: 5 },
  dotAnswered: { backgroundColor: Palette.goldDark },

  qCounter: { color: Palette.stone, fontSize: 13, fontWeight: '600' },
  questionCard: { backgroundColor: Palette.goldSoft, borderColor: Palette.gold, gap: 0 },
  questionText: { color: Palette.charcoal, fontFamily: 'serif', fontSize: 18, fontWeight: '700', lineHeight: 26 },

  optionsList: { gap: 10 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Palette.surface,
    borderWidth: 1.5,
    borderColor: Palette.line,
    borderRadius: 18,
    padding: 16,
  },
  optionSelected: { borderColor: Palette.gold, backgroundColor: Palette.goldSoft },
  optionBullet: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Palette.ivory,
    borderWidth: 1.5,
    borderColor: Palette.line,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  optionBulletSelected: { backgroundColor: Palette.gold, borderColor: Palette.gold },
  optionBulletText: { color: Palette.stone, fontWeight: '700', fontSize: 14 },
  optionBulletTextSel: { color: Palette.charcoal },
  optionText: { flex: 1, color: Palette.charcoal, fontSize: 15, lineHeight: 22 },
  optionTextSelected: { fontWeight: '600' },
  selectedCheck: { color: Palette.goldDark, fontSize: 16, fontWeight: '800' },

  navRow: { flexDirection: 'row', gap: 12 },
  navBtn: {
    flex: 1,
    minHeight: 50,
    borderRadius: 15,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnPrimary: { flex: 1, minHeight: 50, borderRadius: 15, backgroundColor: Palette.gold, alignItems: 'center', justifyContent: 'center' },
  navBtnDisabled: { opacity: 0.4 },
  navBtnText: { color: Palette.stone, fontSize: 15, fontWeight: '600' },
  navBtnPrimaryText: { color: Palette.charcoal, fontSize: 15, fontWeight: '700' },
  submitQuizBtn: { flex: 2, minHeight: 50, borderRadius: 15, backgroundColor: Palette.charcoal, alignItems: 'center', justifyContent: 'center' },
  submitQuizBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', fontFamily: 'serif' },
  unansweredNote: { color: Palette.stoneLight, fontSize: 13, textAlign: 'center' },

  // ── Result ──
  scoreCard: { alignItems: 'center', gap: 12, paddingVertical: 32 },
  scoreCardPass: { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' },
  scoreCardFail: { backgroundColor: '#FFFBEB', borderColor: Palette.line },

  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 5,
    gap: 2,
  },
  scoreCirclePass: { borderColor: '#22C55E', backgroundColor: '#F0FDF4' },
  scoreCircleFail: { borderColor: Palette.gold, backgroundColor: '#FFFBEB' },
  scorePct: { fontFamily: 'serif', fontSize: 32, fontWeight: '800' },
  scorePctPass: { color: '#16A34A' },
  scorePctFail: { color: Palette.goldDark },
  scoreCircleLabel: { color: Palette.stone, fontSize: 11 },

  scoreEmoji: { fontSize: 36 },
  scoreHeading: { fontFamily: 'serif', fontSize: 22, fontWeight: '700' },
  scoreHeadingPass: { color: '#166534' },
  scoreHeadingFail: { color: Palette.charcoal },
  scoreSubLabel: { color: Palette.stone, fontSize: 15 },
  scoreMessage: { textAlign: 'center', fontSize: 14, lineHeight: 22, maxWidth: 300, paddingHorizontal: 8 },
  scoreMessagePass: { color: '#166534' },
  scoreMessageFail: { color: Palette.stone },

  scoreMiniBarTrack: {
    width: '80%',
    height: 8,
    borderRadius: 8,
    backgroundColor: Palette.line,
    overflow: 'hidden',
    marginTop: 4,
  },
  scoreMiniBarFill: { height: '100%', borderRadius: 8 },
  scoreMiniBarPass: { backgroundColor: '#22C55E' },
  scoreMiniBarFail: { backgroundColor: Palette.gold },

  feedbackHeading: { color: Palette.charcoal, fontFamily: 'serif', fontSize: 20, fontWeight: '700' },
  feedbackCard: { gap: 0, padding: 0, overflow: 'hidden', borderRadius: 20 },
  feedbackCorrect: { borderColor: '#86EFAC' },
  feedbackWrong: { borderColor: '#FCA5A5' },
  feedbackHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16 },
  feedbackBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  badgeCorrect: { backgroundColor: '#D4EDDA' },
  badgeWrong: { backgroundColor: '#FEE2E2' },
  feedbackBadgeText: { fontSize: 14, fontWeight: '800' },
  badgeCorrectText: { color: '#2D6A4F' },
  badgeWrongText: { color: '#991B1B' },
  feedbackQ: { flex: 1, color: Palette.charcoal, fontSize: 14, fontWeight: '600', lineHeight: 20 },
  expandIcon: { color: Palette.stoneLight, fontSize: 12, marginTop: 3 },
  feedbackBody: { paddingHorizontal: 16, paddingBottom: 16, gap: 6 },
  feedbackOpt: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: Palette.ivory },
  feedbackOptCorrect: { backgroundColor: '#D4EDDA' },
  feedbackOptWrong: { backgroundColor: '#FEE2E2' },
  feedbackOptText: { color: Palette.stone, fontSize: 14 },
  feedbackOptTextCorrect: { color: '#2D6A4F', fontWeight: '600' },
  feedbackOptTextWrong: { color: '#991B1B', fontWeight: '600' },
  explanationWrap: { marginTop: 8, gap: 4, backgroundColor: Palette.goldSoft, borderRadius: 12, padding: 12 },
  explanationLabel: { color: Palette.goldDark, fontSize: 12, fontWeight: '700' },

  resultActions: { gap: 10 },
  retakeBtn: { minHeight: 52, borderRadius: 17, backgroundColor: Palette.gold, alignItems: 'center', justifyContent: 'center' },
  retakeBtnText: { color: Palette.charcoal, fontSize: 16, fontWeight: '700', fontFamily: 'serif' },
  backCourseBtn: { minHeight: 52, borderRadius: 17, backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.goldDark, alignItems: 'center', justifyContent: 'center' },
  backCourseBtnText: { color: Palette.goldDark, fontSize: 16, fontWeight: '700' },
});
