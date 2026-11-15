import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';

import { Brand, BrandFonts, Palette } from '@/constants/theme';

/** Must match `imageWidth` / `backgroundColor` of expo-splash-screen in app.json
 *  so the hand-off from the native splash to this one is seamless. */
const LOGO_WIDTH = 200;
const LOGO_ASPECT = 1024 / 1001;
const SPLASH_BG = '#FFFFFF';

/** How long the name stays fully visible before the splash fades away. */
const HOLD_MS = 900;

/**
 * Branded launch screen: continues the native splash (same logo, same spot),
 * fades in the app name underneath, then fades out to reveal the app.
 * Rendered as an overlay so the app mounts behind it while it plays.
 */
export function AppSplash({ ready }: { ready: boolean }) {
  const [visible, setVisible] = useState(true);
  // Lazily created once; held in state so render never reads a ref.
  const [textAnim] = useState(() => new Animated.Value(0));
  const [overlayAnim] = useState(() => new Animated.Value(1));
  const started = useRef(false);

  useEffect(() => {
    if (!ready || started.current) return;
    started.current = true;

    // The overlay is already on screen in the same position, so hide the native splash instantly.
    SplashScreen.hide();

    Animated.sequence([
      Animated.timing(textAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.delay(HOLD_MS),
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: 450,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => setVisible(false));
  }, [ready, textAnim, overlayAnim]);

  if (!visible) return null;

  const textTranslate = textAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });

  return (
    <Animated.View
      style={[styles.overlay, { opacity: overlayAnim }]}
      pointerEvents={ready ? 'none' : 'auto'}
      accessibilityLabel={`${Brand.name} is loading`}
    >
      <Image
        source={require('../../assets/images/splash-logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Animated.View
        style={[styles.textBlock, { opacity: textAnim, transform: [{ translateY: textTranslate }] }]}
      >
        <Text style={styles.name}>{Brand.name}</Text>
        <View style={styles.rule} />
        <Text style={styles.tagline}>{Brand.tagline}</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: SPLASH_BG,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    elevation: 1000,
  },
  logo: {
    width: LOGO_WIDTH,
    height: LOGO_WIDTH / LOGO_ASPECT,
  },
  // Positioned absolutely below centre so the logo stays exactly where the native splash put it.
  textBlock: {
    position: 'absolute',
    top: '50%',
    marginTop: LOGO_WIDTH / LOGO_ASPECT / 2 + 28,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  name: {
    fontFamily: BrandFonts.heading,
    fontSize: 28,
    color: Palette.charcoal,
    textAlign: 'center',
  },
  rule: {
    width: 40,
    height: 2,
    borderRadius: 1,
    backgroundColor: Palette.gold,
    marginVertical: 10,
  },
  tagline: {
    fontFamily: BrandFonts.bodySemi,
    fontSize: 12,
    letterSpacing: 4,
    color: Palette.goldDark,
  },
});
