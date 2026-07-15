// The discovery engine — how caring for yourself quietly grows the garden.
//
// Philosophy (do not violate):
//  • "Showing up" is what earns growth. Any day the user checks in counts —
//    resting, surviving, and self-care all count equally. What they log only
//    *themes* which discovery appears, never whether one does.
//  • Slow & sparse. Discoveries follow a self-slowing schedule (1st after 1
//    care-day, then 3, 6, 10, 15 …). A full garden takes ~a year of gentle
//    presence. Real gardens take time.
//  • Permanent. Nothing is ever removed. Six months away changes nothing.
//  • No streaks, no counts shown, no pressure. This is all invisible bookkeeping.

import { GardenAssetId } from './gardenAssets';

export type GardenTheme = 'water' | 'nourish' | 'calm' | 'comfort' | 'steady' | 'structure';

/** Map a check-in "must do" label to a garden theme (region-agnostic). */
export function themeForMustDo(label: string): GardenTheme | null {
  const l = label.trim().toLowerCase();
  if (l.includes('water')) return 'water';
  if (l === 'eat' || l.includes('breakfast') || l.includes('lunch') || l.includes('dinner')) return 'nourish';
  if (l.includes('medication') || l.includes('meds')) return 'calm';
  if (l.includes('doctor') || l.includes('appointment')) return 'structure';
  if (l === 'rest' || l.includes('laundry')) return 'comfort';
  if (l.includes('work') || l.includes('shop') || l.includes('exercise') || l.includes('school')) return 'steady';
  return null;
}

/** Which themes each discoverable asset leans toward (used only to bias order). */
const ASSET_THEMES: Partial<Record<GardenAssetId, GardenTheme[]>> = {
  reeds: ['water'], lillyPads: ['water'], pond: ['water'], woodenBridge: ['water', 'structure'], stream: ['water', 'structure'], birdBath: ['water', 'nourish'],
  sunflowerPatch: ['nourish'], wildflowerPatch: ['nourish'], floweringBush: ['nourish'],
  lavenderPot: ['calm'], hydrangeaPot: ['calm'], hammock: ['calm', 'comfort'], benchSwing: ['calm', 'comfort'],
  bench: ['comfort'], campfire: ['comfort'],
  bush: ['steady'], sapling: ['steady'], willowTree: ['steady'], cherryBlossom: ['steady'], treeSwing: ['steady'],
  gardenArchway: ['structure'], fence: ['structure'], stoneWall: ['structure'], woodenGate: ['structure'], woodenSign: ['structure'], gazebo: ['structure'], greenhouse: ['structure'],
};

/**
 * Discoveries in growing order — small first, grand structures last. The garden
 * reveals these one at a time; within a tier, the next one is nudged by what the
 * user has been logging (themes), so it feels personal but never cluttered.
 */
const DISCOVERY_TIERS: GardenAssetId[][] = [
  ['wildflowerPatch', 'floweringBush', 'lavenderPot', 'hydrangeaPot', 'reeds', 'sunflowerPatch'],
  ['birdBath', 'bench', 'sapling', 'bush'],
  ['treeSwing', 'benchSwing', 'hammock', 'lillyPads'],
  ['willowTree', 'cherryBlossom', 'pond', 'woodenSign'],
  ['woodenBridge', 'stream', 'gardenArchway', 'fence', 'stoneWall', 'woodenGate'],
  ['campfire', 'gazebo', 'greenhouse'],
];

const TOTAL_DISCOVERABLE = DISCOVERY_TIERS.reduce((n, tier) => n + tier.length, 0);

function fnv(seed: string): number {
  let value = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    value ^= seed.charCodeAt(i);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

/**
 * How many discoveries a given number of care-days has earned. Triangular
 * schedule: thresholds at 1, 3, 6, 10, 15, 21 … so gaps grow and the pace keeps
 * slowing — "some weeks nothing changes."
 */
export function earnedCountForCareDays(careDays: number): number {
  if (careDays <= 0) return 0;
  const n = Math.floor((Math.sqrt(8 * careDays + 1) - 1) / 2);
  return Math.min(n, TOTAL_DISCOVERABLE);
}

/** Care-days needed for the NEXT discovery after `earned` (for gentle internal pacing). */
export function careDaysForDiscovery(index: number): number {
  return (index * (index + 1)) / 2;
}

/**
 * Reconcile the ordered list of discovered assets from invisible progress.
 * Deterministic + idempotent: same inputs → same garden, always. Order within a
 * tier is biased by accumulated themes, tie-broken by a stable hash.
 */
export function reconcileDiscoveries(careDays: number, themeTotals: Record<string, number>): GardenAssetId[] {
  const earned = earnedCountForCareDays(careDays);
  if (earned <= 0) return [];
  const ordered: GardenAssetId[] = [];
  for (const tier of DISCOVERY_TIERS) {
    const sorted = [...tier].sort((a, b) => {
      const scoreA = (ASSET_THEMES[a] ?? []).reduce((s, t) => s + (themeTotals[t] ?? 0), 0);
      const scoreB = (ASSET_THEMES[b] ?? []).reduce((s, t) => s + (themeTotals[t] ?? 0), 0);
      if (scoreB !== scoreA) return scoreB - scoreA;
      return fnv(a) - fnv(b);
    });
    ordered.push(...sorted);
  }
  return ordered.slice(0, earned);
}

export { TOTAL_DISCOVERABLE };
