// Hassle — region-first English configuration.
//
// This is the single source of truth for regional behavior. Hassle is US-first,
// with UK variants only where regional English, formatting, currency, or support
// wording genuinely differs. It is not a full multi-language i18n layer.

export type Region = 'US' | 'GB';

export interface RegionConfig {
  code: Region;
  label: string;
  flag: string;
  locale: string;
  spelling: 'US English' | 'UK English';
  currency: {
    code: 'USD' | 'GBP';
    symbol: '$' | '£';
    plusPriceLabel: string;
  };
  date: {
    short: Intl.DateTimeFormatOptions;
    medium: Intl.DateTimeFormatOptions;
    long: Intl.DateTimeFormatOptions;
    dateTime: Intl.DateTimeFormatOptions;
    firstDayOfWeek: 0 | 1;
  };
  units: {
    distance: 'miles' | 'miles';
    temperature: 'fahrenheit' | 'celsius';
  };
  support: {
    emergency: string;
    mentalHealthCrisis: string;
    nonEmergencyHealth: string;
  };
  copy: {
    noJudgment: string;
    middayCheckOff: string;
    schoolDropOffTask: string;
  };
}

export const REGION_CONFIGS: Record<Region, RegionConfig> = {
  US: {
    code: 'US',
    label: 'United States',
    flag: '🇺🇸',
    locale: 'en-US',
    spelling: 'US English',
    currency: {
      code: 'USD',
      symbol: '$',
      plusPriceLabel: '$6.99/month',
    },
    date: {
      short: { month: 'short', day: 'numeric' },
      medium: { month: 'long', day: 'numeric', year: 'numeric' },
      long: { weekday: 'long', month: 'long', day: 'numeric' },
      dateTime: { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' },
      firstDayOfWeek: 0,
    },
    units: {
      distance: 'miles',
      temperature: 'fahrenheit',
    },
    support: {
      emergency: '911',
      mentalHealthCrisis: '988 Suicide & Crisis Lifeline',
      nonEmergencyHealth: 'Contact your provider, or dial 211 for local health services',
    },
    copy: {
      noJudgment: 'No judgment. Just where you are right now.',
      middayCheckOff: "How's it going? Check anything off if you like.",
      schoolDropOffTask: 'School drop-off',
    },
  },
  GB: {
    code: 'GB',
    label: 'United Kingdom',
    flag: '🇬🇧',
    locale: 'en-GB',
    spelling: 'UK English',
    currency: {
      code: 'GBP',
      symbol: '£',
      plusPriceLabel: '£4.99/month',
    },
    date: {
      short: { day: 'numeric', month: 'short' },
      medium: { day: 'numeric', month: 'long', year: 'numeric' },
      long: { weekday: 'long', day: 'numeric', month: 'long' },
      dateTime: { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' },
      firstDayOfWeek: 1,
    },
    units: {
      distance: 'miles',
      temperature: 'celsius',
    },
    support: {
      emergency: '999',
      mentalHealthCrisis: 'Samaritans 116 123',
      nonEmergencyHealth: 'Call NHS 111 for urgent but non-emergency help',
    },
    copy: {
      noJudgment: 'No judgement. Just where you are right now.',
      middayCheckOff: "How's it going? Tick anything off if you like.",
      schoolDropOffTask: 'School run',
    },
  },
};

export const DEFAULT_REGION: Region = 'US';
export const REGIONS = Object.values(REGION_CONFIGS);

export function regionConfig(region: Region): RegionConfig {
  return REGION_CONFIGS[region] ?? REGION_CONFIGS[DEFAULT_REGION];
}

export function coerceRegion(value: unknown): Region {
  return value === 'GB' || value === 'US' ? value : DEFAULT_REGION;
}
