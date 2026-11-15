import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ActionButton, AppHeader, Card, ChipRow, EmptyState, Eyebrow, Loading, Notice, Screen, SearchField, SectionTitle, ui } from '@/components/karma-ui';
import { BrandFonts, Palette } from '@/constants/theme';
import { useSession } from '@/context/auth-context';
import { type HelpCategory, type HelpFaq, apiGetHelpCategories, apiGetHelpFaqs, apiSubmitFaqFeedback } from '@/services/api';

export default function HelpScreen() {
  const { session } = useSession();
  const [categories, setCategories] = useState<HelpCategory[]>([]);
  const [faqs, setFaqs] = useState<HelpFaq[]>([]);
  const [category, setCategory] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Record<number, 'yes' | 'no'>>({});
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!session) return;
    void apiGetHelpCategories(session).then((res) => {
      const raw: any = res.data;
      setCategories(Array.isArray(raw) ? raw : raw?.categories ?? []);
    });
  }, [session]);

  const loadFaqs = useCallback(async (cat: string, search: string) => {
    if (!session) return;
    const res = await apiGetHelpFaqs(session, { category: cat || undefined, search: search.trim() || undefined });
    if (res.error) setError(res.error);
    else { setError(''); setFaqs(res.data?.faqs ?? []); }
    setLoading(false);
  }, [session]);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => { void loadFaqs(category, query); }, 300);
    return () => { if (debounce.current) clearTimeout(debounce.current); };
  }, [category, query, loadFaqs]);

  const sendFeedback = async (faqId: number, helpful: boolean) => {
    if (!session || feedback[faqId]) return;
    setFeedback((f) => ({ ...f, [faqId]: helpful ? 'yes' : 'no' }));
    await apiSubmitFaqFeedback(session, faqId, helpful);
  };

  return <Screen>
    <AppHeader title="Help centre" back />

    <Card>
      <Eyebrow>HELP CENTRE</Eyebrow>
      <Text style={styles.heroTitle}>How can we help?</Text>
      <SearchField value={query} onChangeText={setQuery} placeholder='e.g. "How do I register for an event?"' />
    </Card>

    {categories.length ? <ChipRow options={[{ key: '', label: 'All' }, ...categories.map((c) => ({ key: c.slug, label: c.name }))]} value={category} onChange={setCategory} /> : null}

    <SectionTitle>Frequently asked questions</SectionTitle>
    {error ? <Notice tone="error">{error}</Notice> : null}
    {loading ? <Loading /> : faqs.length === 0 ? (
      <EmptyState icon="search-outline" title="No matching articles" message="Try a different search or select another category." />
    ) : (
      <View style={{ gap: 10 }}>
        {faqs.map((faq) => {
          const expanded = expandedId === faq.id;
          return <Card key={faq.id} style={{ gap: 10 }}>
            <Pressable onPress={() => setExpandedId(expanded ? null : faq.id)} style={styles.faqRow} accessibilityRole="button" accessibilityState={{ expanded }}>
              <Text style={styles.question}>{faq.question}</Text>
              <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={Palette.goldDark} />
            </Pressable>
            {expanded ? <>
              <Text style={ui.body}>{faq.answer}</Text>
              {feedback[faq.id] ? (
                <Text style={styles.thanks}>Thanks for your feedback.</Text>
              ) : (
                <View style={styles.feedbackRow}>
                  <Text style={ui.small}>Was this helpful?</Text>
                  <Pressable onPress={() => void sendFeedback(faq.id, true)} style={styles.feedbackBtn} accessibilityRole="button" accessibilityLabel="Yes, helpful">
                    <Ionicons name="thumbs-up-outline" size={16} color={Palette.goldDark} /><Text style={styles.feedbackText}>Yes</Text>
                  </Pressable>
                  <Pressable onPress={() => void sendFeedback(faq.id, false)} style={styles.feedbackBtn} accessibilityRole="button" accessibilityLabel="No, not helpful">
                    <Ionicons name="thumbs-down-outline" size={16} color={Palette.goldDark} /><Text style={styles.feedbackText}>No</Text>
                  </Pressable>
                </View>
              )}
            </> : null}
          </Card>;
        })}
      </View>
    )}

    <Card style={{ gap: 10 }}>
      <View style={styles.contactIcon}><Ionicons name="chatbubbles-outline" size={24} color={Palette.goldDark} /></View>
      <Text style={styles.contactTitle}>Still need help?</Text>
      <Text style={ui.small}>Can’t find what you’re looking for? Send us a request and our team will follow up.</Text>
      <ActionButton icon="create-outline" label="Contact support" onPress={() => router.push('/support/new' as any)} />
      <ActionButton variant="outline" icon="list-outline" label="My support requests" onPress={() => router.push('/support' as any)} />
    </Card>
  </Screen>;
}

const styles = StyleSheet.create({
  heroTitle: { fontFamily: BrandFonts.heading, fontSize: 24, color: Palette.charcoal },
  faqRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  question: { flex: 1, fontFamily: BrandFonts.bodySemi, fontSize: 15, lineHeight: 21, color: Palette.charcoal },
  feedbackRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  feedbackBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: Palette.line },
  feedbackText: { fontFamily: BrandFonts.bodySemi, fontSize: 13, color: Palette.goldDark },
  thanks: { fontFamily: BrandFonts.bodyMedium, fontSize: 13, color: Palette.success },
  contactIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: Palette.goldSoft, alignItems: 'center', justifyContent: 'center' },
  contactTitle: { fontFamily: BrandFonts.heading, fontSize: 20, color: Palette.charcoal },
});
