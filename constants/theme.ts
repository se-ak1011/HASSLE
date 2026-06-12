// Hassle — Design System
// Dark, grounded, editorial palette. Worn-in, honest, muted.

export const Colors = {
  background: '#1A1916',
  surface: '#232220',
  surfaceElevated: '#2A2925',
  surfaceDark: '#141412',

  primary: '#6F7F5F',       // dusty olive
  primaryLight: '#8E9E7E',  // lighter olive
  primaryFaint: '#2C3026',  // very dark faint olive

  accent: '#9B8A6E',        // dusty tan/gold
  accentFaint: '#2E2920',   // very dark faint tan

  flare: '#A56A5A',         // muted rust
  flareFaint: '#2D1F1B',    // very dark faint flare

  success: '#6A8B66',       // muted sage
  successFaint: '#1E2A1D',

  text: '#EAE6E1',
  textMuted: '#B8B2AA',
  textSubtle: '#7A7570',

  border: '#2E2D2A',
  borderLight: '#353330',

  white: '#EAE6E1',
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
