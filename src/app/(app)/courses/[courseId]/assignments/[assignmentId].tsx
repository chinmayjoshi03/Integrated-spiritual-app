import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Keyboard,
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

import { AppHeader, Card, Pill, ui } from '@/components/karma-ui';
import { Palette, Spacing } from '@/constants/theme';
import { useSession } from '@/context/auth-context';
import { type Assignment, apiGetCourseDetail, apiSubmitAssignment } from '@/services/api';

export default function AssignmentScreen() {
  const { courseId, assignmentId } = useLocalSearchParams<{
    courseId: string;
    assignmentId: string;
  }>();
  const { session } = useSession();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [courseTitle, setCourseTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  const load = useCallback(async () => {
    if (!session || !courseId) return;
    const res = await apiGetCourseDetail(session, Number(courseId));
    if (res.data) {
      const a = res.data.assignments.find((a) => String(a.id) === String(assignmentId));
      setAssignment(a ?? null);
      setCourseTitle(res.data.course.title);
      if (a?.response_text) {
        setText(a.response_text);
        setSubmitted(true);
        setSubmittedAt(a.submitted_at);
      }
    }
    setLoading(false);
  }, [session, courseId, assignmentId]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    if (text.trim().length < 10) {
      Alert.alert('Too short', 'Please write at least a few sentences before submitting.');
      return;
    }
    Keyboard.dismiss();
    setSubmitting(true);
    const res = await apiSubmitAssignment(
      session!,
      Number(courseId),
      Number(assignmentId),
      text
    );
    setSubmitting(false);
    if (res.error) {
      Alert.alert('Error', res.error);
    } else {
      setSubmitted(true);
      setSubmittedAt(res.data?.submitted_at ?? new Date().toISOString());
      Alert.alert('Submitted ✓', 'Your response has been saved.');
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

  if (!assignment) {
    return (
      <SafeAreaView style={styles.safe}>
        <AppHeader title="Assignment" back />
        <Text style={styles.errorText}>Assignment not found.</Text>
      </SafeAreaView>
    );
  }

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerWrap}>
            <AppHeader title="Assignment" subtitle={courseTitle} back />
          </View>

          <View style={styles.body}>
            {/* Status badge */}
            {submitted ? (
              <View style={styles.submittedBanner}>
                <Text style={styles.submittedBannerText}>✓ Submitted</Text>
                {submittedAt && (
                  <Text style={styles.submittedDate}>
                    {new Date(submittedAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                )}
              </View>
            ) : (
              <Pill>{`DUE IN ${assignment.due_offset_days} DAYS`}</Pill>
            )}

            {/* Title */}
            <Text style={styles.title}>{assignment.title}</Text>

            {/* Description */}
            {assignment.description ? (
              <Text style={ui.body}>{assignment.description}</Text>
            ) : null}

            {/* Instructions card */}
            {assignment.instructions && (
              <Card style={styles.instructionsCard}>
                <Text style={styles.instructionsHeading}>Instructions</Text>
                <Text style={ui.body}>{assignment.instructions}</Text>
              </Card>
            )}

            {/* Tips card */}
            <Card style={styles.tipsCard}>
              <Text style={styles.tipsHeading}>✦  Tips for a good response</Text>
              <View style={styles.tipsList}>
                {[
                  'Write honestly — there are no right or wrong answers here.',
                  'Aim for at least 150 words to explore your experience fully.',
                  'Re-reading your own words is part of the practice.',
                ].map((tip, i) => (
                  <View key={i} style={styles.tipRow}>
                    <Text style={styles.tipDot}>·</Text>
                    <Text style={[ui.body, { flex: 1 }]}>{tip}</Text>
                  </View>
                ))}
              </View>
            </Card>

            {/* Response input */}
            <View style={styles.inputBlock}>
              <View style={styles.inputHeader}>
                <Text style={styles.inputLabel}>Your response</Text>
                <Text style={styles.wordCount}>{wordCount} words</Text>
              </View>
              <TextInput
                ref={inputRef}
                style={[styles.input, submitted && styles.inputReadOnly]}
                value={text}
                onChangeText={setText}
                placeholder="Begin writing your reflection here…"
                placeholderTextColor={Palette.stoneLight}
                multiline
                textAlignVertical="top"
                editable={!submitted}
                scrollEnabled={false}
              />
            </View>

            {/* Submit / re-submit */}
            {!submitted ? (
              <Pressable
                style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                disabled={submitting}
                onPress={handleSubmit}
              >
                {submitting ? (
                  <ActivityIndicator color={Palette.charcoal} size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>Submit response</Text>
                )}
              </Pressable>
            ) : (
              <Pressable
                style={styles.resubmitBtn}
                onPress={() => {
                  setSubmitted(false);
                  setSubmittedAt(null);
                  setTimeout(() => inputRef.current?.focus(), 200);
                }}
              >
                <Text style={styles.resubmitBtnText}>Edit & resubmit</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

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

  submittedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#D4EDDA',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  submittedBannerText: { color: '#2D6A4F', fontWeight: '700', fontSize: 14 },
  submittedDate: { color: '#2D6A4F', fontSize: 13 },

  title: {
    color: Palette.charcoal,
    fontFamily: 'serif',
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 32,
  },

  instructionsCard: { gap: 10, backgroundColor: Palette.goldSoft, borderColor: Palette.gold },
  instructionsHeading: {
    color: Palette.charcoal,
    fontFamily: 'serif',
    fontSize: 16,
    fontWeight: '700',
  },

  tipsCard: { gap: 10 },
  tipsHeading: { color: Palette.charcoal, fontWeight: '700', fontSize: 14 },
  tipsList: { gap: 8 },
  tipRow: { flexDirection: 'row', gap: 8 },
  tipDot: { color: Palette.gold, fontSize: 20, lineHeight: 23 },

  inputBlock: { gap: 8 },
  inputHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  inputLabel: { color: Palette.charcoal, fontSize: 15, fontWeight: '600' },
  wordCount: { color: Palette.stone, fontSize: 13 },
  input: {
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.line,
    borderRadius: 18,
    color: Palette.charcoal,
    minHeight: 200,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    lineHeight: 24,
  },
  inputReadOnly: {
    backgroundColor: Palette.ivory,
    borderColor: Palette.line,
    color: Palette.stone,
  },

  submitBtn: {
    minHeight: 54,
    borderRadius: 17,
    backgroundColor: Palette.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: {
    color: Palette.charcoal,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'serif',
  },

  resubmitBtn: {
    minHeight: 54,
    borderRadius: 17,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.goldDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resubmitBtnText: { color: Palette.goldDark, fontSize: 16, fontWeight: '700' },
});
