import { type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { KarmaLogo, ui } from '@/components/karma-ui';
import { Palette } from '@/constants/theme';

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return <SafeAreaView style={styles.safe}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}><ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled"><View style={styles.brand}><KarmaLogo size={82} /><Text style={ui.title}>{title}</Text><Text style={[ui.body, styles.center]}>{subtitle}</Text></View>{children}</ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
export const authStyles = StyleSheet.create({ form: { gap: 16 }, error: { color: Palette.danger, fontSize: 14, textAlign: 'center', backgroundColor: Palette.blush, padding: 12, borderRadius: 12 }, row: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: 4 }, plain: { color: Palette.stone, fontSize: 15 }, link: { color: Palette.goldDark, fontWeight: '800', fontSize: 15 }, passwordWrap: { position: 'relative' }, passwordToggle: { position: 'absolute', right: 14, top: 36, zIndex: 1 }, divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 2 }, line: { height: 1, backgroundColor: Palette.line, flex: 1 }, dividerText: { color: Palette.stoneLight, fontSize: 12 } });
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: Palette.ivory }, scroll: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingVertical: 38, gap: 24, maxWidth: 560, width: '100%', alignSelf: 'center' }, brand: { alignItems: 'center', gap: 10 }, center: { textAlign: 'center' } });
