import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { DefaultTheme, ThemeProvider } from 'expo-router';

import { SessionProvider, useSession } from '@/context/auth-context';
import { PrototypeProvider } from '@/context/prototype-context';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <SessionProvider>
      <PrototypeProvider>
        <ThemeProvider value={DefaultTheme}>
          <SplashScreenController />
          <RootNavigator />
        </ThemeProvider>
      </PrototypeProvider>
    </SessionProvider>
  );
}

/**
 * Keeps the splash screen visible until auth state is loaded.
 */
function SplashScreenController() {
  const { isLoading } = useSession();

  if (!isLoading) {
    SplashScreen.hide();
  }

  return null;
}

/**
 * Uses Stack.Protected to guard authenticated routes.
 * - When signed in → show (app) group (tabs)
 * - When signed out → show sign-in / sign-up screens
 */
function RootNavigator() {
  const { session } = useSession();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>

      <Stack.Protected guard={!session}>
        <Stack.Screen name="sign-in" />
        <Stack.Screen
          name="sign-up"
          options={{
            presentation: 'card',
          }}
        />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="mobile-login" />
        <Stack.Screen name="otp" />
      </Stack.Protected>
    </Stack>
  );
}
