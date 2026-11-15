import { type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { KarmaLogo, ui } from '@/components/karma-ui';
import { Brand, BrandFonts, Palette } from '@/constants/theme';

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <KarmaLogo size={82} />
            <View style={styles.wordmark}>
              <Text style={styles.brandName}>{Brand.name}</Text>
              <Text style={styles.brandTagline}>{Brand.tagline}</Text>
            </View>
            <Text style={[ui.title, styles.center]}>{title}</Text>
            <Text style={[ui.body, styles.center]}>{subtitle}</Text>
          </View>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export const authStyles = StyleSheet.create({
  form: { gap: 16 },
  success: { fontFamily: BrandFonts.bodyMedium, color: Palette.success, fontSize: 14, textAlign: 'center', backgroundColor: Palette.successSoft, padding: 12, borderRadius: 12 },
  error: { fontFamily: BrandFonts.bodyMedium, color: Palette.danger, fontSize: 14, textAlign: 'center', backgroundColor: Palette.dangerSoft, padding: 12, borderRadius: 12 },
  row: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  plain: { fontFamily: BrandFonts.body, color: Palette.stone, fontSize: 15 },
  link: { fontFamily: BrandFonts.bodyBold, color: Palette.goldDark, fontSize: 15 },
  passwordWrap: { position: 'relative' },
  passwordToggle: { position: 'absolute', right: 14, top: 40, zIndex: 1 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.ivory },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingVertical: 38, gap: 24, maxWidth: 560, width: '100%', alignSelf: 'center' },
  brand: { alignItems: 'center', gap: 10 },
  // Stretch + centre (not shrink-to-fit) so Android never clips the last word of a line.
  wordmark: { alignSelf: 'stretch', alignItems: 'stretch', marginBottom: 6 },
  brandName: { fontFamily: BrandFonts.heading, fontSize: 18, color: Palette.charcoal, textAlign: 'center' },
  brandTagline: { fontFamily: BrandFonts.bodySemi, fontSize: 10, letterSpacing: 3, color: Palette.goldDark, textAlign: 'center' },
  center: { textAlign: 'center', alignSelf: 'stretch' },
});
