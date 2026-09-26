import { Image } from 'expo-image';
import { router } from 'expo-router';
import { type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Palette, Spacing } from '@/constants/theme';

export function KarmaLogo({ size = 46 }: { size?: number }) {
  return <Image source={require('@/assets/images/karma-vajra-logo.jpeg')} style={{ width: size, height: size, borderRadius: size / 2 }} contentFit="cover" />;
}

export function AppIcon({ name, active = false }: { name: string; active?: boolean }) {
  const icons: Record<string, string> = { home: '⌂', practice: '◌', learn: '▤', connect: '♡', profile: '♙', bell: '♧', back: '‹', check: '✓', circle: '○', play: '▶', spark: '✦', book: '▣', heart: '♡', calendar: '□', settings: '⚙', chat: '◌' };
  return <Text style={[styles.icon, { color: active ? Palette.goldDark : Palette.stone }]}>{icons[name] || '•'}</Text>;
}

export function Screen({ children, scroll = true, style }: { children: ReactNode; scroll?: boolean; style?: ViewStyle }) {
  const content = <View style={[styles.screenContent, style]}>{children}</View>;
  return <SafeAreaView style={styles.safe}>{scroll ? <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>{content}</ScrollView> : content}</SafeAreaView>;
}

export function AppHeader({ title, subtitle, back = false, action }: { title: string; subtitle?: string; back?: boolean; action?: ReactNode }) {
  return <View style={styles.header}>
    {back ? <Pressable style={styles.back} onPress={() => router.back()}><AppIcon name="back" /></Pressable> : <KarmaLogo size={42} />}
    <View style={styles.headerCopy}><Text style={styles.headerTitle}>{title}</Text>{subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}</View>
    {action || <View style={styles.headerSpacer} />}
  </View>;
}

export function SectionTitle({ children, action }: { children: string; action?: ReactNode }) {
  return <View style={styles.sectionTitle}><View><Text style={styles.sectionText}>{children}</Text><View style={styles.underline} /></View>{action}</View>;
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) { return <View style={[styles.card, style]}>{children}</View>; }

export function ActionButton({ label, onPress, variant = 'gold', disabled = false }: { label: string; onPress: () => void; variant?: 'gold' | 'outline' | 'quiet'; disabled?: boolean }) {
  return <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, variant === 'outline' && styles.buttonOutline, variant === 'quiet' && styles.buttonQuiet, (pressed || disabled) && styles.pressed]}><Text style={[styles.buttonText, variant !== 'gold' && styles.buttonTextAlt]}>{label}</Text></Pressable>;
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><TextInput placeholderTextColor={Palette.stoneLight} style={styles.input} {...props} /></View>;
}

export function Pill({ children }: { children: string }) { return <View style={styles.pill}><Text style={styles.pillText}>{children}</Text></View>; }

export function ProgressBar({ pct, height = 8 }: { pct: number; height?: number }) {
  return (
    <View style={[pbStyles.track, { height }]}>
      <View style={[pbStyles.fill, { width: `${Math.min(100, Math.max(0, pct))}%` }]} />
    </View>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <View style={scStyles.card}>
      <Text style={scStyles.label}>{label}</Text>
      <Text style={scStyles.value}>{value}</Text>
      <Text style={scStyles.hint}>{hint}</Text>
    </View>
  );
}

export function ListItem({
  icon,
  title,
  subtitle,
  onPress,
  right,
  last = false,
}: {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  right?: ReactNode;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[liStyles.row, !last && liStyles.border]}
    >
      {icon ? <View style={liStyles.iconWrap}>{icon}</View> : null}
      <View style={liStyles.copy}>
        <Text style={liStyles.title}>{title}</Text>
        {subtitle ? <Text style={liStyles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right !== undefined ? right : onPress ? <Text style={liStyles.arrow}>›</Text> : null}
    </Pressable>
  );
}

export const ui = StyleSheet.create({ title: { fontFamily: 'serif', color: Palette.charcoal, fontSize: 29, fontWeight: '700' }, body: { color: Palette.stone, fontSize: 16, lineHeight: 23 }, small: { color: Palette.stone, fontSize: 13 } });

const pbStyles = StyleSheet.create({
  track: { width: '100%', borderRadius: 8, backgroundColor: Palette.goldSoft, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 8, backgroundColor: Palette.gold },
});

const scStyles = StyleSheet.create({
  card: { width: 200, backgroundColor: Palette.surface, borderRadius: 22, padding: 18, borderWidth: 1, borderColor: Palette.line, gap: 6 },
  label: { color: Palette.stone, fontSize: 14, fontWeight: '600' },
  value: { color: Palette.charcoal, fontFamily: 'serif', fontSize: 32, fontWeight: '700' },
  hint: { color: Palette.stoneLight, fontSize: 12 },
});

const liStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 13, minHeight: 56, paddingVertical: 4 },
  border: { borderBottomWidth: 1, borderBottomColor: Palette.line },
  iconWrap: { width: 36, alignItems: 'center' },
  copy: { flex: 1, gap: 2 },
  title: { color: Palette.charcoal, fontSize: 16, fontWeight: '600' },
  subtitle: { color: Palette.stone, fontSize: 13 },
  arrow: { color: Palette.goldDark, fontSize: 26 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.ivory }, scroll: { flexGrow: 1 }, screenContent: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: Spacing.three, paddingTop: Spacing.two, paddingBottom: 118, gap: Spacing.three },
  header: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 11, borderBottomWidth: 1, borderColor: Palette.line, paddingBottom: 13 }, headerCopy: { flex: 1 }, headerTitle: { color: Palette.charcoal, fontFamily: 'serif', fontSize: 23, fontWeight: '700' }, headerSubtitle: { color: Palette.stone, fontSize: 12, marginTop: 2 }, headerSpacer: { width: 42 }, back: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 21, backgroundColor: Palette.surface },
  icon: { fontSize: 26, fontWeight: '500', textAlign: 'center' }, sectionTitle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 9 }, sectionText: { fontFamily: 'serif', color: Palette.charcoal, fontSize: 24, fontWeight: '700' }, underline: { width: 51, height: 4, borderRadius: 4, backgroundColor: Palette.gold, marginTop: 7 },
  card: { backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.line, borderRadius: 26, padding: 20, gap: 12, shadowColor: Palette.charcoal, shadowOpacity: 0.05, shadowRadius: 13, shadowOffset: { width: 0, height: 8 }, elevation: 2 }, button: { minHeight: 52, borderRadius: 17, backgroundColor: Palette.gold, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 }, buttonOutline: { backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.goldDark }, buttonQuiet: { backgroundColor: Palette.goldSoft }, buttonText: { color: Palette.charcoal, fontSize: 16, fontWeight: '700', fontFamily: 'serif' }, buttonTextAlt: { color: Palette.goldDark }, pressed: { opacity: 0.7 },
  field: { gap: 7 }, fieldLabel: { color: Palette.charcoal, fontSize: 14, fontWeight: '600' }, input: { backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.line, borderRadius: 15, color: Palette.charcoal, minHeight: 53, paddingHorizontal: 16, fontSize: 16 }, pill: { alignSelf: 'flex-start', borderRadius: 20, backgroundColor: Palette.goldSoft, paddingHorizontal: 11, paddingVertical: 5 }, pillText: { color: Palette.goldDark, fontSize: 12, fontWeight: '700' },
});
