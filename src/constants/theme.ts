import { Platform } from 'react-native';

export const Palette = {
  ivory: '#F8F5ED',
  surface: '#FFFFFF',
  charcoal: '#252525',
  gold: '#C9A24D',
  goldDark: '#A77A1C',
  goldSoft: '#F1E3BE',
  stone: '#6F6B63',
  stoneLight: '#A79E8B',
  line: '#E8D8AE',
  blush: '#F6E7DF',
  danger: '#8B3B31',
} as const;

/** Compatibility tokens for legacy shared components. Karma Vajra is intentionally light-only. */
export const Colors = {
  light: {
    text: Palette.charcoal,
    background: Palette.ivory,
    backgroundElement: Palette.surface,
    backgroundSelected: Palette.goldSoft,
    textSecondary: Palette.stone,
  },
  dark: {
    text: Palette.charcoal,
    background: Palette.ivory,
    backgroundElement: Palette.surface,
    backgroundSelected: Palette.goldSoft,
    textSecondary: Palette.stone,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light;

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', serif: 'ui-serif', rounded: 'ui-rounded', mono: 'ui-monospace' },
  default: { sans: 'normal', serif: 'serif', rounded: 'normal', mono: 'monospace' },
  web: { sans: 'var(--font-display)', serif: 'var(--font-serif)', rounded: 'var(--font-rounded)', mono: 'var(--font-mono)' },
});

export const Spacing = { half: 2, one: 4, two: 8, three: 16, four: 24, five: 32, six: 48 } as const;
export const BottomTabInset = 88;
export const MaxContentWidth = 760;
