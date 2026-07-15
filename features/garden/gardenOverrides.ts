// User rearrangements of the garden. The coordinate system in gardenLayout.ts is
// always the default; these are optional per-asset position overrides the user
// sets by dragging things around in "Rearrange" mode. Nothing is added or
// removed — only moved — and if a user never edits, the defaults stand.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { GardenAssetId } from './gardenAssets';

const STORAGE_KEY = 'hassle_garden_overrides_v1';

export type GardenOverride = { x: number; y: number };
export type GardenOverrides = Partial<Record<GardenAssetId, GardenOverride>>;

export async function loadGardenOverrides(): Promise<GardenOverrides> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as GardenOverrides;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export async function saveGardenOverrides(overrides: GardenOverrides): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch {
    // silent — the override still lives in memory for this session
  }
}

export async function clearGardenOverrides(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // silent
  }
}
