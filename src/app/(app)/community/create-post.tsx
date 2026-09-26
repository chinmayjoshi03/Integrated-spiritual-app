import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader, Card, Field, Screen, ui } from '@/components/karma-ui';
import { Palette } from '@/constants/theme';
import { useSession } from '@/context/auth-context';
import { apiCreatePost } from '@/services/api';

const CATEGORIES = ['General', 'Reflections', 'Q&A', 'Teachings', 'Meditation'] as const;

export default function CreatePostScreen() {
  const { session } = useSession();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<string>('General');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a title for your post.');
      return;
    }
    if (!content.trim()) {
      Alert.alert('Missing Content', 'Please enter your thoughts or question.');
      return;
    }

    if (!session) return;
    setSubmitting(true);

    const res = await apiCreatePost(session, title.trim(), content.trim(), category);
    setSubmitting(false);

    if (res.error) {
      Alert.alert('Error', res.error);
    } else {
      Alert.alert('Post Published', 'Your post has been shared with the community circle!');
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Screen>
        <AppHeader title="New Discussion" subtitle="Share your thoughts with the circle" back />

        <Card style={styles.formCard}>
          <Text style={styles.label}>Select Topic Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat}
                onPress={() => setCategory(cat)}
                style={[styles.catChip, category === cat && styles.catChipActive]}
              >
                <Text style={[styles.catChipText, category === cat && styles.catChipTextActive]}>
                  {cat}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.label}>Post Title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., How do you stay present during busy work days?"
            placeholderTextColor={Palette.stoneLight}
            value={title}
            onChangeText={setTitle}
            maxLength={120}
          />

          <Text style={styles.label}>Content / Reflection</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Write freely... Share your question, reflection, or insight for the community."
            placeholderTextColor={Palette.stoneLight}
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={6}
          />

          <Pressable
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={Palette.surface} />
            ) : (
              <Text style={styles.submitBtnText}>Publish Post</Text>
            )}
          </Pressable>
        </Card>
      </Screen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.ivory },
  formCard: { gap: 14, padding: 20 },
  label: { color: Palette.charcoal, fontSize: 14, fontWeight: '700' },
  catRow: { gap: 8, paddingBottom: 4 },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.line,
  },
  catChipActive: { backgroundColor: Palette.goldDark, borderColor: Palette.goldDark },
  catChipText: { color: Palette.charcoal, fontSize: 13, fontWeight: '600' },
  catChipTextActive: { color: Palette.surface, fontWeight: '700' },
  input: {
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.line,
    borderRadius: 14,
    padding: 12,
    color: Palette.charcoal,
    fontSize: 15,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: Palette.goldDark,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: Palette.surface, fontSize: 16, fontWeight: '700' },
});
