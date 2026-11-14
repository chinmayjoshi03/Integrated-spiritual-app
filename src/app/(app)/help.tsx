import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
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
import { type HelpCategory, type HelpFaq, apiGetHelpCategories, apiGetHelpFaqs } from '@/services/api';

export default function HelpScreen() {
  const { session } = useSession();
  const [categories, setCategories] = useState<HelpCategory[]>([]);
  const [faqs, setFaqs] = useState<HelpFaq[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('');
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      if (!session) return;
      setLoading(true);
      apiGetHelpCategories(session)
        .then((res) => {
          if (res.data) setCategories(res.data);
        });
      apiGetHelpFaqs(session)
        .then((res) => {
          if (res.data) setFaqs(res.data.faqs);
          else setError(res.error ?? 'Could not load help articles.');
        })
        .finally(() => setLoading(false));
    }, [session])
  );

  // Re-fetch when filter changes
  const applyFilter = useCallback(
    async (cat: string, search: string) => {
      if (!session) return;
      const res = await apiGetHelpFaqs(session, {
        category: cat || undefined,
        search: search.trim() || undefined,
      });
      if (res.data) setFaqs(res.data.faqs);
    },
    [session]
  );

  const handleCategoryPress = (slug: string) => {
    const next = activeCategory === slug ? '' : slug;
    setActiveCategory(next);
    applyFilter(next, query);
  };

  const handleSearch = (text: string) => {
    setQuery(text);
    applyFilter(activeCategory, text);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Screen>
          <AppHeader title="Help & Support" subtitle="Find answers and get support." back />

          {/* Welcome */}
          <Card style={styles.welcomeCard}>
            <Text style={styles.welcomeKicker}>Help Centre</Text>
            <Text style={styles.welcomeTitle}>How can we help?</Text>
            <Text style={ui.small}>
              Search the knowledge base below. Answers come only from published
              platform guides.
            </Text>
          </Card>

          {/* Search bar */}
          <View style={styles.searchRow}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={handleSearch}
              placeholder='Search — e.g. "How do I register for an event?"'
              placeholderTextColor={Palette.stoneLight}
              returnKeyType="search"
            />
          </View>

          {/* Category chips */}
          {categories.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.catBar}
            >
              <Pressable
                style={[styles.catChip, !activeCategory && styles.catChipActive]}
                onPress={() => handleCategoryPress('')}
              >
                <Text style={[styles.catChipText, !activeCategory && styles.catChipTextActive]}>
                  All
                </Text>
              </Pressable>
              {categories.map((cat) => (
                <Pressable
                  key={cat.id}
                  style={[styles.catChip, activeCategory === cat.slug && styles.catChipActive]}
                  onPress={() => handleCategoryPress(cat.slug)}
                >
                  <Text
                    style={[
                      styles.catChipText,
                      activeCategory === cat.slug && styles.catChipTextActive,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}

          {error !== '' && (
            <Card style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
            </Card>
          )}

          {/* FAQ list */}
          <SectionTitle>Frequently Asked Questions</SectionTitle>
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={Palette.gold} size="large" />
            </View>
          ) : faqs.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyTitle}>No matching articles</Text>
              <Text style={[ui.small, { textAlign: 'center' }]}>
                Try a different search or select another category.
              </Text>
            </Card>
          ) : (
            <View style={styles.faqList}>
              {faqs.map((faq) => {
                const expanded = expandedId === faq.id;
                return (
                  <Pressable
                    key={faq.id}
                    onPress={() => setExpandedId(expanded ? null : faq.id)}
                  >
                    <Card style={styles.faqCard}>
                      <View style={styles.faqRow}>
                        <Text style={styles.faqQuestion} numberOfLines={expanded ? undefined : 2}>
                          {faq.question}
                        </Text>
                        <Text style={styles.faqChevron}>{expanded ? '▲' : '▼'}</Text>
                      </View>
                      {expanded && (
                        <Text style={styles.faqAnswer}>{faq.answer}</Text>
                      )}
                    </Card>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Contact support banner */}
          <Card style={styles.contactCard}>
            <Text style={styles.contactTitle}>Still need help?</Text>
            <Text style={ui.small}>
              Can't find what you're looking for? Send us a message and our team will follow up.
            </Text>
            <Pressable style={styles.contactBtn} onPress={() => {
              // TODO: open support ticket screen when built
            }}>
              <Text style={styles.contactBtnText}>Contact Support</Text>
            </Pressable>
          </Card>
        </Screen>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.ivory },
  loadingWrap: { paddingVertical: 48, alignItems: 'center' },

  welcomeCard: {
    backgroundColor: Palette.goldSoft,
    borderColor: Palette.gold,
    gap: 6,
  },
  welcomeKicker: { color: Palette.goldDark, fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  welcomeTitle: {
    color: Palette.charcoal,
    fontFamily: 'serif',
    fontSize: 22,
    fontWeight: '700',
  },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Palette.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Palette.line,
    paddingHorizontal: 14,
    paddingVertical: 2,
  },
  searchIcon: { fontSize: 16 },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    color: Palette.charcoal,
    fontSize: 15,
  },

  catBar: { flexDirection: 'row', gap: 8, paddingVertical: 8 },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.line,
  },
  catChipActive: { backgroundColor: Palette.goldDark, borderColor: Palette.goldDark },
  catChipText: { color: Palette.charcoal, fontSize: 13, fontWeight: '600' },
  catChipTextActive: { color: Palette.surface, fontWeight: '700' },

  errorCard: { backgroundColor: Palette.blush },
  errorText: { color: Palette.danger, fontSize: 14 },

  emptyCard: { alignItems: 'center', gap: 10, paddingVertical: 36 },
  emptyIcon: { fontSize: 44 },
  emptyTitle: {
    color: Palette.charcoal,
    fontFamily: 'serif',
    fontSize: 18,
    fontWeight: '700',
  },

  faqList: { gap: 10 },
  faqCard: { gap: 10 },
  faqRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  faqQuestion: {
    flex: 1,
    color: Palette.charcoal,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },
  faqChevron: { color: Palette.goldDark, fontSize: 12, marginTop: 4 },
  faqAnswer: {
    color: Palette.charcoal,
    fontSize: 14,
    lineHeight: 22,
    borderTopWidth: 1,
    borderTopColor: Palette.line,
    paddingTop: 10,
  },

  contactCard: {
    backgroundColor: Palette.charcoal,
    borderColor: Palette.charcoal,
    gap: 10,
    marginBottom: 8,
  },
  contactTitle: {
    color: '#F0E6CC',
    fontFamily: 'serif',
    fontSize: 18,
    fontWeight: '700',
  },
  contactBtn: {
    backgroundColor: Palette.gold,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  contactBtnText: { color: Palette.charcoal, fontSize: 14, fontWeight: '700' },
});
