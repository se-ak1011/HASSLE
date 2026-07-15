/**
 * lookingForward.ts
 *
 * "Looking forward to" — a small, gentle list of nice things ahead: a wedding
 * you're hoping to make, a project, a trip, a quiet plan. No pressure, no
 * deadlines enforced — just things worth holding onto. Stored locally.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'hassle_looking_forward_v1';

export type LookingForwardItem = {
  id: string;
  title: string;
  note?: string;
  date?: string | null; // optional 'YYYY-MM-DD'
  createdAt: number;
};

export async function loadLookingForward(): Promise<LookingForwardItem[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as LookingForwardItem[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

async function save(list: LookingForwardItem[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // silent
  }
}

export async function addLookingForward(title: string, note?: string, date?: string | null): Promise<LookingForwardItem[]> {
  const item: LookingForwardItem = {
    id: `lf_${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
    title: title.trim(),
    note: note?.trim() || undefined,
    date: date || null,
    createdAt: Date.now(),
  };
  const list = await loadLookingForward();
  const next = [...list, item];
  await save(next);
  return next;
}

export async function removeLookingForward(id: string): Promise<LookingForwardItem[]> {
  const list = await loadLookingForward();
  const next = list.filter(i => i.id !== id);
  await save(next);
  return next;
}

/** Items sorted by their date (soonest first); undated items go last. */
export function sortByDate(list: LookingForwardItem[]): LookingForwardItem[] {
  return [...list].sort((a, b) => {
    if (a.date && b.date) return a.date.localeCompare(b.date);
    if (a.date) return -1;
    if (b.date) return 1;
    return a.createdAt - b.createdAt;
  });
}
