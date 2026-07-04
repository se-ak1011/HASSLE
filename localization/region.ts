// Hassle — region model.
//
// A "region" is the country whose content + wording the app shows. It is the
// single knob everything localisation-related hangs off. Adding a country later
// = add an entry here + a resources/<code>.json + (optionally) a locales
// overrides file. Nothing else needs to change.

export type Region = 'US' | 'GB';

export interface RegionMeta {
  code: Region;
  /** User-facing name shown in Settings. */
  label: string;
  flag: string;
  /** BCP-47 locale used for date/number formatting when this region is active. */
  locale: string;
}

// US is FIRST = the default. Order here is the order shown in the Settings picker.
export const REGIONS: RegionMeta[] = [
  { code: 'US', label: 'United States', flag: '🇺🇸', locale: 'en-US' },
  { code: 'GB', label: 'United Kingdom', flag: '🇬🇧', locale: 'en-GB' },
];

export const DEFAULT_REGION: Region = 'US';

export function regionMeta(code: Region): RegionMeta {
  return REGIONS.find((r) => r.code === code) ?? REGIONS[0];
}

/** Narrow an arbitrary stored string back to a valid Region (defaults to US). */
export function coerceRegion(value: unknown): Region {
  return REGIONS.some((r) => r.code === value) ? (value as Region) : DEFAULT_REGION;
}
