/**
 * useFontFamily
 *
 * Returns the active font family based on the current day's flare state.
 * - Normal mode:  Chronic Sans
 * - Flare mode:   Chronic Sans Flare
 *
 * Gracefully falls back to system font if fonts are not yet loaded.
 */
import { useDay } from '@/hooks/useDay';

export type FontFamilySet = {
  regular: string;
  medium: string;
  semibold: string;
  bold: string;
};

const NORMAL_FONTS: FontFamilySet = {
  regular: 'ChronicSans',
  medium: 'ChronicSans',
  semibold: 'ChronicSans',
  bold: 'ChronicSans',
};

const FLARE_FONTS: FontFamilySet = {
  regular: 'ChronicSansFlare',
  medium: 'ChronicSansFlare',
  semibold: 'ChronicSansFlare',
  bold: 'ChronicSansFlare',
};

export function useFontFamily(): FontFamilySet {
  // Gracefully handle the case where this is called before DayContext is ready
  try {
    const { day, flarePreview } = useDay();
    return day?.isFlareDay || flarePreview ? FLARE_FONTS : NORMAL_FONTS;
  } catch {
    return NORMAL_FONTS;
  }
}
