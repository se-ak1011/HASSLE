import { useCallback, useEffect, useMemo, useState } from 'react';
import { loadJsonState, saveJsonState } from '@/services/storage';
import { GardenAssetId } from './gardenAssets';

export type GardenSeason = 'spring' | 'summer' | 'autumn' | 'winter';
export type GardenWeather = 'clear' | 'cloudy' | 'rain';
export type GardenTimeOfDay = 'day' | 'night';
export type GardenActivity = 'journaling' | 'reading' | 'music' | 'gardening' | 'comfort';

export type GardenState = {
  unlockedAssetIds: GardenAssetId[];
  recentActivity?: GardenActivity | null;
  season: GardenSeason;
  weather: GardenWeather;
  timeOfDay: GardenTimeOfDay;
  dailyVisitorIds: GardenAssetId[];
};

const STORAGE_KEY = 'garden';

export const DEFAULT_GARDEN_STATE: GardenState = {
  unlockedAssetIds: [],
  recentActivity: null,
  season: 'spring',
  weather: 'clear',
  timeOfDay: 'day',
  dailyVisitorIds: [],
};

let currentUnlocks: GardenAssetId[] = [];
let notifyUnlockListeners: ((ids: GardenAssetId[]) => void) | null = null;

function unique(ids: GardenAssetId[]) {
  return Array.from(new Set(ids));
}

export async function unlockGardenAsset(assetId: GardenAssetId) {
  if (currentUnlocks.includes(assetId)) return currentUnlocks;
  currentUnlocks = unique([...currentUnlocks, assetId]);
  await saveJsonState(STORAGE_KEY, { unlockedAssetIds: currentUnlocks });
  notifyUnlockListeners?.(currentUnlocks);
  return currentUnlocks;
}

export async function setGardenUnlocks(assetIds: GardenAssetId[]) {
  currentUnlocks = unique(assetIds);
  await saveJsonState(STORAGE_KEY, { unlockedAssetIds: currentUnlocks });
  notifyUnlockListeners?.(currentUnlocks);
  return currentUnlocks;
}

export async function resetGardenUnlocks() {
  return setGardenUnlocks([]);
}

export function useGardenState() {
  const [state, setState] = useState<GardenState>(DEFAULT_GARDEN_STATE);

  useEffect(() => {
    let mounted = true;
    loadJsonState<{ unlockedAssetIds?: GardenAssetId[] }>(STORAGE_KEY, { unlockedAssetIds: [] }).then(saved => {
      if (!mounted) return;
      currentUnlocks = unique(saved.unlockedAssetIds ?? []);
      setState(prev => ({ ...prev, unlockedAssetIds: currentUnlocks }));
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

  const actions = useMemo(() => ({ updateGardenState, unlockGardenAsset, setGardenUnlocks, resetGardenUnlocks }), [updateGardenState]);

  return { state, actions };
}
