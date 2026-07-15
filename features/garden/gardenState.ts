import { useCallback, useEffect, useMemo, useState } from 'react';
import { loadJsonState, saveJsonState } from '@/services/storage';
import { GardenAssetId } from './gardenAssets';
import { reconcileDiscoveries } from './gardenProgress';

export type GardenSeason = 'spring' | 'summer' | 'autumn' | 'winter';
export type GardenWeather = 'clear' | 'cloudy' | 'rain';
export type GardenTimeOfDay = 'day' | 'night';
export type PartOfDay = 'morning' | 'day' | 'evening' | 'night';
export type GardenActivity = 'journaling' | 'reading' | 'music' | 'gardening' | 'comfort';

export type GardenState = {
  unlockedAssetIds: GardenAssetId[];
  recentActivity?: GardenActivity | null;
  season: GardenSeason;
  weather: GardenWeather;
  timeOfDay: GardenTimeOfDay;
  partOfDay?: PartOfDay; // transient, from the real clock; drives Lola's pose
  dailyVisitorIds: GardenAssetId[];
};

/**
 * Invisible progress ledger — the only thing actually saved. Discoveries are
 * DERIVED from it, so the garden is idempotent: same care history → same garden,
 * forever. There is no decay and nothing is stored that could be read as a score.
 */
type GardenProgress = {
  careDates: string[]; // unique YYYY-MM-DD the user showed up
  themeTotals: Record<string, number>; // gentle bias for which discovery appears
  devUnlocks: GardenAssetId[]; // dev/debug overlay only
};

const STORAGE_KEY = 'garden';

const DEFAULT_PROGRESS: GardenProgress = { careDates: [], themeTotals: {}, devUnlocks: [] };

export const DEFAULT_GARDEN_STATE: GardenState = {
  unlockedAssetIds: [],
  recentActivity: null,
  season: 'spring',
  weather: 'clear',
  timeOfDay: 'day',
  dailyVisitorIds: [],
};

let progress: GardenProgress = { ...DEFAULT_PROGRESS };
let hydrated = false;
let notifyUnlockListeners: ((ids: GardenAssetId[]) => void) | null = null;

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

/**
 * Load saved progress into the module before any mutation, exactly once. Without
 * this, a check-in made before the garden screen has ever mounted would write
 * over saved history — this guarantees we always build on what's already there.
 */
async function ensureHydrated() {
  if (hydrated) return;
  const saved = await loadJsonState<Partial<GardenProgress> & { unlockedAssetIds?: GardenAssetId[] }>(STORAGE_KEY, DEFAULT_PROGRESS);
  progress = {
    careDates: unique(saved.careDates ?? []),
    themeTotals: saved.themeTotals ?? {},
    devUnlocks: unique(saved.devUnlocks ?? saved.unlockedAssetIds ?? []),
  };
  hydrated = true;
}

function derivedUnlocks(): GardenAssetId[] {
  return unique([
    ...reconcileDiscoveries(progress.careDates.length, progress.themeTotals),
    ...progress.devUnlocks,
  ]);
}

async function persist() {
  await saveJsonState(STORAGE_KEY, progress);
}

function announce() {
  notifyUnlockListeners?.(derivedUnlocks());
}

/**
 * "Showing up" — record a care-day and the themes of what was logged. Idempotent
 * per date, so repeated check-ins on the same day never inflate progress.
 */
export async function recordCareDay(dateStr: string, themes: string[] = []) {
  await ensureHydrated();
  if (!progress.careDates.includes(dateStr)) {
    progress.careDates = [...progress.careDates, dateStr];
  }
  if (themes.length) {
    const totals = { ...progress.themeTotals };
    for (const theme of themes) totals[theme] = (totals[theme] ?? 0) + 1;
    progress.themeTotals = totals;
  }
  await persist();
  announce();
  return derivedUnlocks();
}

// ── Dev/debug overlay (never used in production; the debug panel is __DEV__) ──
export async function unlockGardenAsset(assetId: GardenAssetId) {
  await ensureHydrated();
  if (!progress.devUnlocks.includes(assetId)) {
    progress.devUnlocks = unique([...progress.devUnlocks, assetId]);
    await persist();
    announce();
  }
  return derivedUnlocks();
}

export async function setGardenUnlocks(assetIds: GardenAssetId[]) {
  await ensureHydrated();
  progress.devUnlocks = unique(assetIds);
  await persist();
  announce();
  return derivedUnlocks();
}

export async function resetGardenUnlocks() {
  progress = { careDates: [], themeTotals: {}, devUnlocks: [] };
  hydrated = true;
  await persist();
  announce();
  return derivedUnlocks();
}

export function useGardenState() {
  const [state, setState] = useState<GardenState>(DEFAULT_GARDEN_STATE);

  useEffect(() => {
    let mounted = true;
    ensureHydrated().then(() => {
      if (!mounted) return;
      setState(prev => ({ ...prev, unlockedAssetIds: derivedUnlocks() }));
    });
    notifyUnlockListeners = ids => setState(prev => ({ ...prev, unlockedAssetIds: ids }));
    return () => {
      mounted = false;
      notifyUnlockListeners = null;
    };
  }, []);

  const updateGardenState = useCallback((patch: Partial<GardenState>) => {
    setState(prev => ({ ...prev, ...patch }));
  }, []);

  const actions = useMemo(
    () => ({ updateGardenState, recordCareDay, unlockGardenAsset, setGardenUnlocks, resetGardenUnlocks }),
    [updateGardenState]
  );

  return { state, actions };
}
