import { Image } from 'expo-image';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { type ComponentProps, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandFonts, Palette, Spacing, StatusTone } from '@/constants/theme';
import { useProfilePhoto } from '@/context/profile-photo';
import { resolveMediaUrl } from '@/services/api';

export type IoniconName = ComponentProps<typeof Ionicons>['name'];

export function KarmaLogo({ size = 46 }: { size?: number }) {
  return <Image source={require('@/assets/images/karma-vajra-logo.jpeg')} style={{ width: size, height: size, borderRadius: size / 2 }} contentFit="cover" />;
}

// Icon definitions using @expo/vector-icons — works on iOS, Android, and web.
type IconDef =
  | { lib: 'ionicons'; name: IoniconName }
  | { lib: 'fa5'; name: ComponentProps<typeof FontAwesome5>['name'] }
  | { lib: 'mci'; name: ComponentProps<typeof MaterialCommunityIcons>['name'] };

const ICON_MAP: Record<string, IconDef> = {
  home:     { lib: 'ionicons', name: 'home-outline' },
  learn:    { lib: 'fa5',      name: 'book-open' },
  connect:  { lib: 'ionicons', name: 'people-outline' },
  heart:    { lib: 'ionicons', name: 'heart-outline' },
  give:     { lib: 'mci',      name: 'hand-heart-outline' },
  profile:  { lib: 'ionicons', name: 'person' },
  account:  { lib: 'ionicons', name: 'person-outline' },
  bell:     { lib: 'ionicons', name: 'notifications-outline' },
  back:     { lib: 'ionicons', name: 'chevron-back' },
  check:    { lib: 'ionicons', name: 'checkmark' },
  circle:   { lib: 'ionicons', name: 'ellipse-outline' },
  play:     { lib: 'ionicons', name: 'play' },
  spark:    { lib: 'ionicons', name: 'sparkles-outline' },
  book:     { lib: 'ionicons', name: 'book-outline' },
  calendar: { lib: 'ionicons', name: 'calendar-outline' },
  settings: { lib: 'ionicons', name: 'settings-outline' },
  chat:     { lib: 'ionicons', name: 'chatbubble-outline' },
  practice: { lib: 'mci',      name: 'meditation' },
  lock:     { lib: 'ionicons', name: 'lock-closed' },
  unlock:   { lib: 'ionicons', name: 'lock-open' },
};

export function AppIcon({ name, active = false, size = 26 }: { name: string; active?: boolean; size?: number }) {
  const color = active ? Palette.goldDark : Palette.stone;
  const icon = ICON_MAP[name] ?? { lib: 'ionicons' as const, name: 'ellipse-outline' as const };

  if (icon.lib === 'fa5') return <FontAwesome5 name={icon.name} size={size - 3} color={color} />;
  if (icon.lib === 'mci') return <MaterialCommunityIcons name={icon.name} size={size} color={color} />;
  return <Ionicons name={icon.name} size={size} color={color} />;
}

export function Screen({ children, scroll = true, style }: { children: ReactNode; scroll?: boolean; style?: ViewStyle }) {
  const content = <View style={[styles.screenContent, style]}>{children}</View>;
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {content}
        </ScrollView>
      ) : content}
    </SafeAreaView>
  );
}

export function AppHeader({ title, subtitle, back = false, action }: { title: string; subtitle?: string; back?: boolean; action?: ReactNode }) {
  return <View style={styles.header}>
    {back ? (
      <Pressable style={styles.back} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} accessibilityLabel="Go back">
        <AppIcon name="back" />
      </Pressable>
    ) : <KarmaLogo size={42} />}
    <View style={styles.headerCopy}>
      <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
      {subtitle ? <Text style={styles.headerSubtitle} numberOfLines={2}>{subtitle}</Text> : null}
    </View>
    {action || <View style={styles.headerSpacer} />}
  </View>;
}

export function SectionTitle({ children, action }: { children: string; action?: ReactNode }) {
  return <View style={styles.sectionTitle}><View style={{ flexShrink: 1 }}><Text style={styles.sectionText}>{children}</Text><View style={styles.underline} /></View>{action}</View>;
}

export function Eyebrow({ children, style }: { children: string; style?: StyleProp<any> }) {
  return <Text style={[styles.eyebrow, style]}>{children}</Text>;
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) { return <View style={[styles.card, style]}>{children}</View>; }

export function ActionButton({
  label,
  onPress,
  variant = 'gold',
  disabled = false,
  loading = false,
  icon,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: 'gold' | 'outline' | 'quiet' | 'dark' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  icon?: IoniconName;
  style?: StyleProp<ViewStyle>;
}) {
  const textColor = variant === 'gold' ? Palette.onAccent
    : variant === 'dark' ? Palette.onAccent
    : variant === 'danger' ? Palette.danger
    : Palette.goldDark;
  return <Pressable
    accessibilityRole="button"
    disabled={disabled || loading}
    onPress={onPress}
    style={({ pressed }) => [
      styles.button,
      variant === 'outline' && styles.buttonOutline,
      variant === 'quiet' && styles.buttonQuiet,
      variant === 'dark' && styles.buttonDark,
      variant === 'danger' && styles.buttonDanger,
      (pressed || disabled || loading) && styles.pressed,
      style,
    ]}
  >
    {loading ? <ActivityIndicator color={textColor} /> : <>
      {icon ? <Ionicons name={icon} size={17} color={textColor} /> : null}
      <Text style={[styles.buttonText, { color: textColor }]}>{label}</Text>
    </>}
  </Pressable>;
}

export function Field({ label, hint, ...props }: TextInputProps & { label: string; hint?: string }) {
  return <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput placeholderTextColor={Palette.stoneLight} style={[styles.input, props.multiline && styles.inputMultiline]} {...props} />
    {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
  </View>;
}

export function Pill({ children }: { children: string }) { return <View style={styles.pill}><Text style={styles.pillText}>{children}</Text></View>; }

/** Status badge shared by events, volunteering, donations and tickets. */
const POSITIVE = ['published', 'approved', 'present', 'confirmed', 'registered', 'resolved', 'available', 'upcoming'];
const NEGATIVE = ['cancelled', 'rejected', 'absent', 'closed', 'failed'];
const WARM = ['applied', 'partial', 'pending', 'live', 'open', 'in_progress', 'waiting_for_user'];
export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const key = status.toLowerCase();
  const tone = POSITIVE.includes(key) ? StatusTone.positive
    : NEGATIVE.includes(key) ? StatusTone.negative
    : WARM.includes(key) ? StatusTone.warm
    : StatusTone.neutral;
  return <View style={[styles.badge, { backgroundColor: tone.bg }]}>
    <Text style={[styles.badgeText, { color: tone.text }]}>{(label ?? status).replace(/_/g, ' ').toUpperCase()}</Text>
  </View>;
}

/** Segmented control (two to four options). */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: T; label: string; icon?: IoniconName }[];
  value: T;
  onChange: (next: T) => void;
}) {
  return <View style={styles.segmented}>
    {options.map((opt) => {
      const active = opt.key === value;
      return <Pressable key={opt.key} accessibilityRole="tab" accessibilityState={{ selected: active }} style={[styles.segment, active && styles.segmentActive]} onPress={() => onChange(opt.key)}>
        {opt.icon ? <Ionicons name={opt.icon} size={15} color={active ? Palette.onAccent : Palette.stone} /> : null}
        <Text style={[styles.segmentText, active && styles.segmentTextActive]} numberOfLines={1}>{opt.label}</Text>
      </Pressable>;
    })}
  </View>;
}

/** Horizontal row of filter chips. */
export function ChipRow<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
}) {
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
    {options.map((opt) => {
      const active = opt.key === value;
      return <Pressable key={opt.key} onPress={() => onChange(opt.key)} style={[styles.chip, active && styles.chipActive]}>
        <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
      </Pressable>;
    })}
  </ScrollView>;
}

export function SearchField({ value, onChangeText, placeholder }: { value: string; onChangeText: (v: string) => void; placeholder: string }) {
  return <View style={styles.search}>
    <Ionicons name="search-outline" size={18} color={Palette.stoneLight} />
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={Palette.stoneLight}
      style={styles.searchInput}
      returnKeyType="search"
      autoCorrect={false}
    />
    {value ? <Pressable onPress={() => onChangeText('')} hitSlop={8} accessibilityLabel="Clear search"><Ionicons name="close-circle" size={18} color={Palette.stoneLight} /></Pressable> : null}
  </View>;
}

export function EmptyState({ icon, title, message, action }: { icon: IoniconName; title: string; message?: string; action?: ReactNode }) {
  return <Card style={styles.empty}>
    <View style={styles.emptyIcon}><Ionicons name={icon} size={30} color={Palette.goldDark} /></View>
    <Text style={styles.emptyTitle}>{title}</Text>
    {message ? <Text style={[ui.small, { textAlign: 'center' }]}>{message}</Text> : null}
    {action}
  </Card>;
}

export function Loading({ label }: { label?: string }) {
  return <View style={styles.loading}><ActivityIndicator color={Palette.gold} size="large" />{label ? <Text style={ui.small}>{label}</Text> : null}</View>;
}

export function Notice({ tone = 'success', children }: { tone?: 'success' | 'error' | 'info'; children: string }) {
  const palette = tone === 'success' ? StatusTone.positive : tone === 'error' ? StatusTone.negative : StatusTone.warm;
  const icon: IoniconName = tone === 'success' ? 'checkmark-circle' : tone === 'error' ? 'alert-circle' : 'information-circle';
  return <View style={[styles.notice, { backgroundColor: palette.bg }]} accessibilityRole={tone === 'error' ? 'alert' : undefined}>
    <Ionicons name={icon} size={18} color={palette.text} />
    <Text style={[styles.noticeText, { color: palette.text }]}>{children}</Text>
  </View>;
}

/** Icon + label + value row used on detail pages. */
export function InfoRow({ icon, label, value }: { icon: IoniconName; label: string; value: string }) {
  return <View style={styles.infoRow}>
    <View style={styles.infoIcon}><Ionicons name={icon} size={18} color={Palette.goldDark} /></View>
    <View style={{ flex: 1 }}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>;
}

/** Banner image with an on-brand placeholder when no image exists. */
export function Banner({ uri, icon, height = 170 }: { uri?: string | null; icon: IoniconName; height?: number }) {
  if (uri) return <Image source={{ uri: resolveMediaUrl(uri) }} style={[styles.banner, { height }]} contentFit="cover" transition={150} />;
  return <View style={[styles.banner, styles.bannerPlaceholder, { height }]}><Ionicons name={icon} size={44} color={Palette.goldDark} /></View>;
}

/** User avatar: local profile photo when set, otherwise initials. */
export function Avatar({ name, size = 56 }: { name?: string | null; size?: number }) {
  const photo = useProfilePhoto();
  const initials = (name || 'Seeker').split(' ').filter(Boolean).map((w) => w[0]).join('').toUpperCase().slice(0, 2);
  if (photo) return <Image source={{ uri: photo }} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: Palette.goldSoft }} contentFit="cover" />;
  return <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
    <Text style={[styles.avatarText, { fontSize: size * 0.36 }]}>{initials}</Text>
  </View>;
}

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
    <Pressable onPress={onPress} style={[liStyles.row, !last && liStyles.border]}>
      {icon ? <View style={liStyles.iconWrap}>{icon}</View> : null}
      <View style={liStyles.copy}>
        <Text style={liStyles.title}>{title}</Text>
        {subtitle ? <Text style={liStyles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right !== undefined ? right : onPress ? <Ionicons name="chevron-forward" size={18} color={Palette.goldDark} /> : null}
    </Pressable>
  );
}

export const ui = StyleSheet.create({
  title: { fontFamily: BrandFonts.heading, color: Palette.charcoal, fontSize: 28, lineHeight: 34 },
  body: { fontFamily: BrandFonts.body, color: Palette.stone, fontSize: 16, lineHeight: 23 },
  small: { fontFamily: BrandFonts.body, color: Palette.stone, fontSize: 13, lineHeight: 18 },
  link: { fontFamily: BrandFonts.bodySemi, color: Palette.goldDark, fontSize: 14 },
});

const shadow = Platform.select({
  web: { boxShadow: '0px 8px 13px rgba(63,51,40,0.05)' },
  default: { shadowColor: Palette.charcoal, shadowOpacity: 0.05, shadowRadius: 13, shadowOffset: { width: 0, height: 8 } },
}) as ViewStyle;

const pbStyles = StyleSheet.create({
  track: { width: '100%', borderRadius: 8, backgroundColor: Palette.goldSoft, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 8, backgroundColor: Palette.gold },
});

const scStyles = StyleSheet.create({
  card: { width: 200, backgroundColor: Palette.surface, borderRadius: 22, padding: 18, borderWidth: 1, borderColor: Palette.line, gap: 6 },
  label: { fontFamily: BrandFonts.bodySemi, color: Palette.stone, fontSize: 14 },
  value: { color: Palette.charcoal, fontFamily: BrandFonts.heading, fontSize: 32 },
  hint: { fontFamily: BrandFonts.body, color: Palette.stoneLight, fontSize: 12 },
});

const liStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 13, minHeight: 56, paddingVertical: 4 },
  border: { borderBottomWidth: 1, borderBottomColor: Palette.line },
  iconWrap: { width: 36, alignItems: 'center' },
  copy: { flex: 1, gap: 2 },
  title: { fontFamily: BrandFonts.bodySemi, color: Palette.charcoal, fontSize: 16 },
  subtitle: { fontFamily: BrandFonts.body, color: Palette.stone, fontSize: 13 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.ivory },
  scroll: { flexGrow: 1 },
  screenContent: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: Spacing.three, paddingTop: Spacing.two, paddingBottom: 118, gap: Spacing.three },
  header: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 11, borderBottomWidth: 1, borderColor: Palette.line, paddingBottom: 13 },
  headerCopy: { flex: 1 },
  headerTitle: { color: Palette.charcoal, fontFamily: BrandFonts.heading, fontSize: 23 },
  headerSubtitle: { fontFamily: BrandFonts.body, color: Palette.stone, fontSize: 12, marginTop: 2 },
  headerSpacer: { width: 42 },
  back: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 21, backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.line },
  sectionTitle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 9, gap: 10 },
  sectionText: { fontFamily: BrandFonts.heading, color: Palette.charcoal, fontSize: 22 },
  underline: { width: 51, height: 4, borderRadius: 4, backgroundColor: Palette.gold, marginTop: 7 },
  eyebrow: { fontFamily: BrandFonts.bodyBold, color: Palette.goldDark, fontSize: 11, letterSpacing: 1 },
  card: { backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.line, borderRadius: 24, padding: 20, gap: 12, elevation: 2, ...shadow },
  button: { minHeight: 52, borderRadius: 16, backgroundColor: Palette.gold, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, flexDirection: 'row', gap: 8 },
  buttonOutline: { backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.goldDark },
  buttonQuiet: { backgroundColor: Palette.goldSoft },
  buttonDark: { backgroundColor: Palette.brown },
  buttonDanger: { backgroundColor: Palette.dangerSoft, borderWidth: 1, borderColor: Palette.danger },
  buttonText: { fontSize: 16, fontFamily: BrandFonts.bodySemi },
  pressed: { opacity: 0.65 },
  field: { gap: 7 },
  fieldLabel: { fontFamily: BrandFonts.bodySemi, color: Palette.charcoal, fontSize: 14 },
  fieldHint: { fontFamily: BrandFonts.body, color: Palette.stoneLight, fontSize: 12 },
  input: { fontFamily: BrandFonts.body, backgroundColor: Palette.surfaceRaised, borderWidth: 1, borderColor: Palette.line, borderRadius: 14, color: Palette.charcoal, minHeight: 52, paddingHorizontal: 16, fontSize: 16 },
  inputMultiline: { minHeight: 110, paddingTop: 14, textAlignVertical: 'top' },
  pill: { alignSelf: 'flex-start', borderRadius: 20, backgroundColor: Palette.goldSoft, paddingHorizontal: 11, paddingVertical: 5 },
  pillText: { fontFamily: BrandFonts.bodyBold, color: Palette.goldDark, fontSize: 11, letterSpacing: 0.4 },
  badge: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontFamily: BrandFonts.bodyBold, fontSize: 10, letterSpacing: 0.5 },
  segmented: { flexDirection: 'row', backgroundColor: Palette.surface, borderRadius: 18, padding: 4, borderWidth: 1, borderColor: Palette.line },
  segment: { flex: 1, minHeight: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, paddingHorizontal: 6 },
  segmentActive: { backgroundColor: Palette.goldDark },
  segmentText: { fontFamily: BrandFonts.bodySemi, color: Palette.stone, fontSize: 13 },
  segmentTextActive: { color: Palette.onAccent },
  chipRow: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.line },
  chipActive: { backgroundColor: Palette.goldDark, borderColor: Palette.goldDark },
  chipText: { fontFamily: BrandFonts.bodyMedium, color: Palette.charcoal, fontSize: 13 },
  chipTextActive: { fontFamily: BrandFonts.bodySemi, color: Palette.onAccent },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Palette.surfaceRaised, borderWidth: 1, borderColor: Palette.line, borderRadius: 16, paddingHorizontal: 14, minHeight: 48 },
  searchInput: { flex: 1, fontFamily: BrandFonts.body, fontSize: 15, color: Palette.charcoal, paddingVertical: 10 },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 36 },
  emptyIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: Palette.goldSoft, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontFamily: BrandFonts.heading, color: Palette.charcoal, fontSize: 19, textAlign: 'center' },
  loading: { paddingVertical: 48, alignItems: 'center', gap: 10 },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 14, padding: 12 },
  noticeText: { flex: 1, fontFamily: BrandFonts.bodyMedium, fontSize: 14, lineHeight: 20 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: Palette.goldSoft, alignItems: 'center', justifyContent: 'center' },
  infoLabel: { fontFamily: BrandFonts.body, color: Palette.stoneLight, fontSize: 12 },
  infoValue: { fontFamily: BrandFonts.bodySemi, color: Palette.charcoal, fontSize: 15 },
  banner: { width: '100%', borderRadius: 20, backgroundColor: Palette.goldSoft },
  bannerPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  avatar: { backgroundColor: Palette.goldSoft, borderWidth: 2, borderColor: Palette.gold, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: BrandFonts.heading, color: Palette.goldDark },
});
