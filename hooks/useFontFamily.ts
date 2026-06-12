/**
 * useFontFamily
 *
 * Returns the active font family based on the current day's flare state.
 * - Normal mode:  Caveat (organic, handwritten feel)
 * - Flare mode:   Permanent Marker (heavier, bolder — signals intensity)
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
  regular: 'Caveat_400Regular',
  medium: 'Caveat_500Medium',
  semibold: 'Caveat_600SemiBold',
  bold: 'Caveat_700Bold',
};

const FLARE_FONTS: FontFamilySet = {
  regular: 'PermanentMarker_400Regular',
  medium: 'PermanentMarker_400Regular',
  semibold: 'PermanentMarker_400Regular',
  bold: 'PermanentMarker_400Regular',
};

export function useFontFamily(): FontFamilySet {
  // Gracefully handle the case where this is called before DayContext is ready
  try {
    const { day } = useDay();
    return day?.isFlareDay ? FLARE_FONTS : NORMAL_FONTS;
  } catch {
    return NORMAL_FONTS;
  }
}
