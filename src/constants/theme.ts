import { Platform } from 'react-native';

/**
 * Brand palette — same values as the website (spiritual-website/src/index.css).
 * Token names are kept from the original app so existing screens keep working:
 *   ivory  = --color-background      surface   = --color-surface
 *   charcoal = --color-text          stone     = --color-text-muted
 *   gold   = --color-primary         goldDark  = --color-primary-dark
 *   goldSoft = --color-surface-warm  line      = --color-border
 */
export const Palette = {
  ivory: '#F7F1E6',
  surface: '#FFFDF8',
  surfaceRaised: '#FFFFFF',
  charcoal: '#3F3328',
  brown: '#4A3827',
  gold: '#C99A24',
  goldDark: '#A67F1C',
  goldSoft: '#EFE4CF',
  goldSelected: '#EBD7B5',
  highlight: '#FFF8E8',
  stone: '#6B5A48',
  stoneLight: '#8A8175',
  line: '#E9DFCD',
  blush: '#F8ECEB',
  danger: '#B3413D',
  dangerSoft: '#F8ECEB',
  success: '#4A8C5A',
  successSoft: '#E6F1E8',
  onAccent: '#FFFFFF',
} as const;

/** Status colours used for badges (events, volunteering, donations, tickets). */
export const StatusTone = {
  positive: { bg: Palette.successSoft, text: Palette.success },
  negative: { bg: Palette.dangerSoft, text: Palette.danger },
  warm: { bg: Palette.highlight, text: Palette.goldDark },
  neutral: { bg: Palette.goldSoft, text: Palette.stone },
} as const;

/** Compatibility tokens for legacy shared components. The app is light-only (matches the website default). */
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

/**
 * Website typography: Playfair Display for headings, Inter for body text.
 * The font files are loaded in src/app/_layout.tsx (useFonts).
 */
export const BrandFonts = {
  heading: 'PlayfairDisplay_700Bold',
  headingSemi: 'PlayfairDisplay_600SemiBold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
} as const;

export const Fonts = Platform.select({
  ios: { sans: BrandFonts.body, serif: BrandFonts.heading, rounded: 'ui-rounded', mono: 'ui-monospace' },
  default: { sans: BrandFonts.body, serif: BrandFonts.heading, rounded: 'normal', mono: 'monospace' },
  web: { sans: 'var(--font-display)', serif: 'var(--font-serif)', rounded: 'var(--font-rounded)', mono: 'var(--font-mono)' },
});

export const Brand = {
  name: 'The Karm Vajra',
  tagline: 'OMNIVERSITY',
  merchantName: 'The Karm Vajra',
} as const;

export const Spacing = { half: 2, one: 4, two: 8, three: 16, four: 24, five: 32, six: 48 } as const;
export const BottomTabInset = 88;
export const MaxContentWidth = 760;
