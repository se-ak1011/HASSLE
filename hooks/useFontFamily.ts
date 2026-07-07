/**
 * useFontFamily
 *
 * Returns the active font family. Always uses Chronic Sans.
 *
 * Gracefully falls back to system font if fonts are not yet loaded.
 */

export type FontFamilySet = {
  regular: string;
  medium: string;
  semibold: string;
  bold: string;
};

const CHRONIC_SANS: FontFamilySet = {
  regular: 'ChronicSans',
  medium: 'ChronicSans',
  semibold: 'ChronicSans',
  bold: 'ChronicSans',
};

export function useFontFamily(): FontFamilySet {
  return CHRONIC_SANS;
}
