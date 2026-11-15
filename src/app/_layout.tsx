import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import { useFonts } from 'expo-font';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import { AppSplash } from '@/components/app-splash';
import { Palette } from '@/constants/theme';
import { SessionProvider, useSession } from '@/context/auth-context';

SplashScreen.preventAutoHideAsync();

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: Palette.ivory, card: Palette.surface, text: Palette.charcoal, border: Palette.line, primary: Palette.goldDark },
};

export default function RootLayout() {
  // Website typography: Playfair Display (headings) + Inter (body).
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
  });

  return (
    <SessionProvider>
      <ThemeProvider value={navTheme}>
        <StatusBar style="dark" />
        {/* Render screens only after fonts load: Android measures text with the fallback
            font otherwise and clips it once the wider brand font is applied. */}
        {fontsLoaded || fontError ? <RootNavigator /> : null}
        <SplashGate fontsReady={fontsLoaded || !!fontError} />
      </ThemeProvider>
    </SessionProvider>
  );
}

/** Shows the branded splash until fonts and auth state are ready, then animates it away. */
function SplashGate({ fontsReady }: { fontsReady: boolean }) {
  const { isLoading } = useSession();
  return <AppSplash ready={fontsReady && !isLoading} />;
}

/**
 * Stack.Protected guards authenticated routes.
 * - Signed in  → (app) group (tabs + detail screens)
 * - Signed out → sign-in / sign-up / forgot-password / email OTP
 */
function RootNavigator() {
  const { session } = useSession();

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Palette.ivory } }}>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>

      <Stack.Protected guard={!session}>
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="sign-up" options={{ presentation: 'card' }} />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="otp" />
      </Stack.Protected>
    </Stack>
  );
}
