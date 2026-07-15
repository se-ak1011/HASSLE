// Real-world environment for the garden.
//
// The garden itself never changes — only the seasons, light, and weather pass
// through it. These derive from the device clock/calendar so the garden quietly
// tracks real life without any input, notification, or pressure.

import { GardenSeason, GardenTimeOfDay, GardenWeather, PartOfDay } from './gardenState';

export type { PartOfDay };

/** Northern-hemisphere season by month (gentle month boundaries). */
export function seasonForDate(date = new Date()): GardenSeason {
  const m = date.getMonth(); // 0 = Jan
  if (m === 11 || m <= 1) return 'winter'; // Dec, Jan, Feb
  if (m <= 4) return 'spring'; // Mar, Apr, May
  if (m <= 7) return 'summer'; // Jun, Jul, Aug
  return 'autumn'; // Sep, Oct, Nov
}

export function partOfDayForDate(date = new Date()): PartOfDay {
  const h = date.getHours();
  if (h >= 5 && h < 11) return 'morning';
  if (h >= 11 && h < 17) return 'day';
  if (h >= 17 && h < 21) return 'evening';
  return 'night';
}

export function timeOfDayForDate(date = new Date()): GardenTimeOfDay {
  return partOfDayForDate(date) === 'night' ? 'night' : 'day';
}

/**
 * Calm, offline pseudo-weather — mostly clear, sometimes cloudy, rarely rain.
 * Deterministic per calendar day so it never flickers between renders, and it
 * never needs a network call or location permission. Weather is only ever
 * gentle; there are no storms that punish or alarm.
 */
export function weatherForDate(date = new Date()): GardenWeather {
  const seed = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const n = (h >>> 0) % 100;
  if (n < 66) return 'clear'; // ~66%
  if (n < 90) return 'cloudy'; // ~24%
  return 'rain'; // ~10%
}
