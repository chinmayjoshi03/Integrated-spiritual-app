import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ActionButton, AppHeader, Banner, Card, Eyebrow, type IoniconName, Screen, ui } from '@/components/karma-ui';
import { BrandFonts, Palette } from '@/constants/theme';
import { type AboutContent, apiGetAboutContent, resolveMediaUrl } from '@/services/api';

/** Same defaults as the website (spiritual-website/src/features/siteContent/siteContentService.ts). */
const DEFAULT_ABOUT: AboutContent = {
  introTitle: 'Conscious learning for human flourishing.',
  introParagraphs: [
    'KarmVajra Omniversity is a learning institution focused on consciousness, self-development, emotional intelligence, inner wellness, and sustainable personal growth.',
    'Guided by Dr. Keeran Singh (Gurumaa), we develop learning frameworks and experiences that help people cultivate clarity, emotional steadiness, self-awareness, and a deeper sense of purpose.',
  ],
  introImage: '',
  introCaption: 'A community committed to learning and growth',
  beliefQuote: '“Every human being possesses immense untapped potential.”',
  beliefDescription: 'When people develop greater awareness, emotional balance, clarity, resilience, and alignment with purpose, they can contribute more fully to their families, workplaces, communities, and society.',
  values: [
    { title: 'Universal principles', description: 'Human growth beyond cultural or ideological boundaries.' },
    { title: 'Practical learning', description: 'Useful tools that connect timeless principles with modern life.' },
    { title: 'Inclusive by design', description: 'Experiences open to people of all faiths and backgrounds.' },
  ],
  focusTitle: 'Whole-person development, made practical.',
  focusDescription: 'Our work connects inner well-being with the skills and relationships that support people at home, in teams, and in leadership.',
  focusAreas: [
    { title: 'Mindfulness & attention', description: 'Focus, presence, and clarity in everyday life.' },
    { title: 'Emotional intelligence', description: 'Self-awareness and more thoughtful connection.' },
    { title: 'Conscious leadership', description: 'Purposeful leadership, communication, and decisions.' },
    { title: 'Well-being & resilience', description: 'Tools for meeting pressure and change with steadiness.' },
    { title: 'Human potential', description: 'Growth mindset, purpose discovery, and personal mastery.' },
    { title: 'Team culture', description: 'Trust, collaboration, inclusion, and shared purpose.' },
  ],
  programsTitle: 'Supporting individuals, leaders, and organizations.',
  programsDescription: 'Programs can be shaped for employee groups, managers, senior leaders, and wider organizational communities.',
  programs: [
    { title: 'Workplace well-being', description: 'Stress and energy management, emotional well-being, focus, and personal resilience.' },
    { title: 'Leadership excellence', description: 'Conscious leadership, communication, team motivation, trust, and strategic decision-making.' },
    { title: 'Human potential development', description: 'Self-awareness, purpose discovery, personal mastery, and performance growth.' },
    { title: 'Organizational culture', description: 'Collaboration, inclusion, conflict transformation, and alignment around shared purpose.' },
  ],
  partnershipTitle: 'Bring conscious growth into your organization.',
  partnershipDescription: "We offer several ways to create a learning experience around your team's goals and context.",
  partnershipItems: [
    'Corporate learning programs',
    'Leadership development and executive mentoring',
    'Curated knowledge content partnerships',
    'Retreats and immersive team experiences',
  ],
  visionTitle: 'A global ecosystem of conscious learning.',
  visionDescription: 'To help people from every background discover, nurture, and express their highest potential - and to contribute to a world with healthier individuals, stronger teams, and purpose-driven organizations.',
};

const FOCUS_ICONS: IoniconName[] = ['eye-outline', 'heart-outline', 'compass-outline', 'leaf-outline', 'trending-up-outline', 'people-outline'];

export default function AboutScreen() {
  const [content, setContent] = useState<AboutContent>(DEFAULT_ABOUT);

  useEffect(() => {
    void apiGetAboutContent().then((saved) => { if (saved) setContent({ ...DEFAULT_ABOUT, ...saved }); });
  }, []);

  const introImage = content.introImage && !content.introImage.startsWith('/images/') ? resolveMediaUrl(content.introImage) : null;

  return <Screen>
    <AppHeader title="About" back />

    <Card style={styles.flush}>
      {introImage ? <Banner uri={introImage} icon="people-outline" height={190} /> : null}
      <View style={styles.pad}>
        <Eyebrow>ABOUT KARMVAJRA OMNIVERSITY</Eyebrow>
        <Text style={styles.h1}>{content.introTitle}</Text>
        {content.introParagraphs.map((p, i) => <Text key={i} style={ui.body}>{p}</Text>)}
        <ActionButton icon="school-outline" label="Explore courses" onPress={() => router.push('/courses' as any)} />
      </View>
    </Card>

    <Card style={styles.belief}>
      <Eyebrow>WHAT WE BELIEVE</Eyebrow>
      <Text style={styles.quote}>{content.beliefQuote}</Text>
      <Text style={ui.body}>{content.beliefDescription}</Text>
      {content.values.map((v) => <View key={v.title} style={styles.value}>
        <Text style={styles.itemTitle}>{v.title}</Text>
        <Text style={ui.small}>{v.description}</Text>
      </View>)}
    </Card>

    <View style={{ gap: 6 }}>
      <Eyebrow>OUR AREAS OF FOCUS</Eyebrow>
      <Text style={styles.h2}>{content.focusTitle}</Text>
      <Text style={ui.body}>{content.focusDescription}</Text>
    </View>
    <View style={styles.grid}>
      {content.focusAreas.map((f, i) => <Card key={`${f.title}-${i}`} style={styles.gridCard}>
        <View style={styles.icon}><Ionicons name={FOCUS_ICONS[i % FOCUS_ICONS.length]} size={20} color={Palette.goldDark} /></View>
        <Text style={styles.itemTitle}>{f.title}</Text>
        <Text style={ui.small}>{f.description}</Text>
      </Card>)}
    </View>

    <Card>
      <Eyebrow>LEARNING EXPERIENCES</Eyebrow>
      <Text style={styles.h2}>{content.programsTitle}</Text>
      <Text style={ui.body}>{content.programsDescription}</Text>
      {content.programs.map((p, i) => <View key={`${p.title}-${i}`} style={styles.program}>
        <Text style={styles.programNum}>{String(i + 1).padStart(2, '0')}</Text>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.itemTitle}>{p.title}</Text>
          <Text style={ui.small}>{p.description}</Text>
        </View>
      </View>)}
    </Card>

    <Card>
      <Eyebrow>PARTNERSHIP OPPORTUNITIES</Eyebrow>
      <Text style={styles.h2}>{content.partnershipTitle}</Text>
      <Text style={ui.body}>{content.partnershipDescription}</Text>
      {content.partnershipItems.map((item, i) => <View key={`${item}-${i}`} style={styles.bullet}>
        <Ionicons name="checkmark-circle" size={18} color={Palette.gold} />
        <Text style={[ui.body, { flex: 1 }]}>{item}</Text>
      </View>)}
      <ActionButton variant="outline" icon="chatbubbles-outline" label="Start a conversation" onPress={() => router.push('/support/new' as any)} />
    </Card>

    <Card style={styles.vision}>
      <Eyebrow>OUR VISION</Eyebrow>
      <Text style={styles.h2}>{content.visionTitle}</Text>
      <Text style={ui.body}>{content.visionDescription}</Text>
    </Card>
  </Screen>;
}

const styles = StyleSheet.create({
  flush: { padding: 0, gap: 0, overflow: 'hidden' },
  pad: { padding: 20, gap: 12 },
  h1: { fontFamily: BrandFonts.heading, fontSize: 28, lineHeight: 35, color: Palette.charcoal },
  h2: { fontFamily: BrandFonts.heading, fontSize: 22, lineHeight: 29, color: Palette.charcoal },
  belief: { backgroundColor: Palette.highlight, gap: 12 },
  quote: { fontFamily: BrandFonts.headingSemi, fontStyle: 'italic', fontSize: 22, lineHeight: 30, color: Palette.goldDark },
  value: { gap: 2, paddingTop: 10, borderTopWidth: 1, borderTopColor: Palette.line },
  itemTitle: { fontFamily: BrandFonts.bodySemi, fontSize: 15, color: Palette.charcoal },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridCard: { flexGrow: 1, flexBasis: '45%', minWidth: 150, gap: 6, padding: 16 },
  icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: Palette.goldSoft, alignItems: 'center', justifyContent: 'center' },
  program: { flexDirection: 'row', gap: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: Palette.line },
  programNum: { fontFamily: BrandFonts.heading, fontSize: 18, color: Palette.gold, width: 28 },
  bullet: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  vision: { backgroundColor: Palette.goldSoft, gap: 10 },
});
