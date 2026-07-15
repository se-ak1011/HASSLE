// Remembered Body drafts. Each category keeps its selected chips and note so
// swiping between Lolas, tapping a tab, or leaving and coming back never loses
// what you'd picked. Persisted locally and autosaved on every change.

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BodyLolaCategory } from '@/services/aiLola';

const STORAGE_KEY = 'hassle_body_drafts_v1';

export type BodyDraft = { primary: string[]; secondary: string[]; transcript: string };
export type BodyDrafts = Partial<Record<BodyLolaCategory, BodyDraft>>;

export const EMPTY_DRAFT: BodyDraft = { primary: [], secondary: [], transcript: '' };

export async function loadBodyDrafts(): Promise<BodyDrafts> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as BodyDrafts;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export async function saveBodyDrafts(drafts: BodyDrafts): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
  } catch {
    // silent — the draft still lives in memory for this session
  }
}

/** True when a draft has nothing worth keeping (used to prune empties). */
export function isEmptyDraft(d: BodyDraft): boolean {
  return d.primary.length === 0 && d.secondary.length === 0 && d.transcript.trim().length === 0;
}
