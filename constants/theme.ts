// Hassle — Design System
// Dark, grounded, editorial palette. Worn-in, honest, muted.
// Plum/charcoal — matched to drained.life (monochrome purple, no green/olive).

export const Colors = {
  background: '#191A1C',
  surface: '#292728',
  surfaceElevated: '#332F32',
  surfaceDark: '#141315',

  primary: '#5C3F5A',       // plum
  primaryLight: '#7A5478',  // mauve
  primaryFaint: '#2A2230',  // very dark faint plum

  accent: '#7A5478',        // mauve (matches web --accent)
  accentFaint: '#261F2A',   // very dark faint mauve

  flare: '#7A5268',         // plum flare accent (web --flare-foreground)
  flareFaint: '#3D2638',    // very dark faint flare (web --flare)

  success: '#7A5478',       // mauve — palette is monochrome, no green
  successFaint: '#261F2A',

  text: '#E7E0D8',
  textMuted: '#B8B2AA',
  textSubtle: '#675E61',

  border: '#353239',
  borderLight: '#3F3B42',

  white: '#E7E0D8',
  overlay: 'rgba(10, 10, 9, 0.65)',
};

export const Fonts = {
  // Weights only — used alongside FontFamily
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

/**
 * Font family names — loaded via @expo-google-fonts.
 * Use useFontFamily() hook in components to get the correct set
 * based on flare state (Caveat = normal, PermanentMarker = flare).
 */
export const FontFamily = {
  // Normal mode: organic handwritten feel
  normal: {
    regular: 'Caveat_400Regular',
    medium: 'Caveat_500Medium',
    semibold: 'Caveat_600SemiBold',
    bold: 'Caveat_700Bold',
  },
  // Flare mode: heavy, bold handwritten
  flare: {
    regular: 'PermanentMarker_400Regular',
    medium: 'PermanentMarker_400Regular',
    semibold: 'PermanentMarker_400Regular',
    bold: 'PermanentMarker_400Regular',
  },
};

export const FontSizes = {
  xs: 11,
  sm: 13,
  base: 16,
  md: 18,
  lg: 20,
  xl: 24,
  xxl: 30,
  xxxl: 38,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const Radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  full: 999,
};

export const Shadow = {
  soft: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  medium: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
};
