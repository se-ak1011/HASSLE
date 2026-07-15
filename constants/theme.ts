// Hassle — Design System
// Black & purple identity — Lola's lavender hoodie, fibromyalgia purple. Dark,
// calm, restful, but unmistakably lavender (not grey, not olive).

export const Colors = {
  background: '#151517',
  surface: '#202225',
  surfaceElevated: '#2A2D31',
  surfaceDark: '#111213',

  primary: '#A78BC9',       // lavender — Lola's hoodie, the core accent
  primaryLight: '#C4B4E4',  // light lavender
  primaryFaint: '#221D2E',  // dark lavender-tinted (reads purple, not neutral)

  accent: '#A78BC9',        // lavender (unified accent)
  accentFaint: '#221D2E',   // dark lavender-tinted

  flare: '#A06B63',         // muted terracotta (flare state)
  flareFaint: '#271A18',    // dark terracotta-tinted
  warning: '#A06B63',       // muted terracotta
  warningFaint: '#2A1C1A',
  danger: '#A06B63',        // understated, same as warning
  dangerFaint: '#2A1C1A',

  success: '#6A5A8C',       // deep understated purple — a quiet "done", not a green pop
  successFaint: '#1D1826',  // almost-black, purple-tinted

  text: '#F3F1ED',
  textPrimary: '#F3F1ED',
  textSecondary: '#C8C6C1',
  textMuted: '#A9ACA8',
  textSubtle: '#6E7370',

  border: '#2E3134',
  hairline: '#252729',
  borderLight: '#3A3D41',

  white: '#F3F1ED',
  overlay: 'rgba(10, 10, 10, 0.65)',
};

export const Fonts = {
  // Weights only — used alongside FontFamily
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

/**
 * Font family names — local .otf files loaded via expo-font in app/_layout.tsx.
 * Use useFontFamily() hook in components to get the correct set.
 * Chronic Sans is always used regardless of flare state.
 */
export const FontFamily = {
  normal: {
    regular: 'ChronicSans',
    medium: 'ChronicSans',
    semibold: 'ChronicSans',
    bold: 'ChronicSans',
  },
};

export const FontSizes = {
  xs: 13,
  sm: 15,
  base: 18,
  md: 22,
  lg: 24,
  xl: 28,
  xxl: 36,
  xxxl: 46,
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
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  medium: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.26,
    shadowRadius: 12,
    elevation: 6,
  },
};


export const SemanticColors = {
  background: Colors.background,
  surface: Colors.surface,
  surfaceElevated: Colors.surfaceElevated,
  border: Colors.border,
  hairline: Colors.hairline,
  textPrimary: Colors.textPrimary,
  textSecondary: Colors.textSecondary,
  textMuted: Colors.textSubtle,
  accent: Colors.primary,
  success: Colors.success,
  warning: Colors.warning,
  danger: Colors.danger,
};

export const Elevation = {
  none: {},
  soft: Shadow.soft,
  medium: Shadow.medium,
};

export const Animation = {
  fast: 120,
  base: 180,
  slow: 240,
  pressScale: 0.985,
  pressOpacity: 0.92,
};

export const TouchTarget = {
  minHeight: 44,
  minWidth: 44,
};

export const Haptics = {
  none: 'none',
  light: 'light',
  medium: 'medium',
  success: 'success',
  warning: 'warning',
  error: 'error',
} as const;
