import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DayState,
  UserPreferences,
  DEFAULT_PREFERENCES,
  ScheduledTask,
} from '@/constants/types';

const KEYS = {
  DAY_PREFIX: 'hassle_day_',
  PREFERENCES: 'hassle_prefs',
  HISTORY: 'hassle_history',
  SCHEDULED: 'hassle_scheduled',
};

/** Tasks deferred to a future date (rescheduled via "move"). */
export async function loadScheduledTasks(): Promise<ScheduledTask[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SCHEDULED);
    if (!raw) return [];
    return JSON.parse(raw) as ScheduledTask[];
  } catch {
    return [];
  }
}

export async function saveScheduledTasks(list: ScheduledTask[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.SCHEDULED, JSON.stringify(list));
  } catch {
    // silent
  }
}

function todayKey(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${KEYS.DAY_PREFIX}${yyyy}-${mm}-${dd}`;
}

export function getTodayDateString(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export async function loadTodayState(): Promise<DayState | null> {
  try {
    const raw = await AsyncStorage.getItem(todayKey());
    if (!raw) return null;
    return JSON.parse(raw) as DayState;
  } catch {
    return null;
  }
}

export async function saveTodayState(state: DayState): Promise<void> {
  try {
    await AsyncStorage.setItem(todayKey(), JSON.stringify(state));
  } catch {
    // silent
  }
}

/**
 * Remove today's active day from storage.
 * Called after endDay() so there is no stale day on the next app launch.
 */
export async function clearTodayState(): Promise<void> {
  try {
    await AsyncStorage.removeItem(todayKey());
  } catch {
    // silent
  }
}

export async function loadPreferences(): Promise<UserPreferences> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.PREFERENCES);
    if (!raw) return { ...DEFAULT_PREFERENCES };
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export async function savePreferences(prefs: UserPreferences): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.PREFERENCES, JSON.stringify(prefs));
  } catch {
    // silent
  }
}

export async function loadPastDays(count = 30): Promise<DayState[]> {
  try {
    const results: DayState[] = [];
    const today = new Date();
    for (let i = 1; i <= count; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const key = `${KEYS.DAY_PREFIX}${yyyy}-${mm}-${dd}`;
      const raw = await AsyncStorage.getItem(key);
      if (raw) results.push(JSON.parse(raw));
    }
    return results;
  } catch {
    return [];
  }
}

/**
 * Save a completed day snapshot to the dedicated history archive.
 * History is an array of DayState objects, newest first.
 * Each day is deduplicated by date — a second save on the same date overwrites.
 */
export async function saveCompletedDay(day: DayState): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.HISTORY);
    const history: DayState[] = raw ? JSON.parse(raw) : [];
    // Replace any existing entry for this date, else prepend
    const filtered = history.filter((d) => d.date !== day.date);
    const updated = [day, ...filtered].slice(0, 90); // keep up to 90 days
    await AsyncStorage.setItem(KEYS.HISTORY, JSON.stringify(updated));
  } catch {
    // silent
  }
}

/**
 * Load the completed-day history archive.
 * Returns an empty array if nothing has been saved yet.
 */
export async function loadHistory(): Promise<DayState[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.HISTORY);
    if (!raw) return [];
    return JSON.parse(raw) as DayState[];
  } catch {
    return [];
  }
}

/**
 * Wipe all Hassle data from local storage:
 * - active day
 * - history archive
 * - user preferences (custom tags, learned task costs, energy mode)
 *
 * Leaves the app in a completely fresh state.
 */
export async function clearAllData(): Promise<void> {
  try {
    // Clear history, prefs, and any scheduled (moved) tasks
    await AsyncStorage.multiRemove([KEYS.HISTORY, KEYS.PREFERENCES, KEYS.SCHEDULED]);
    // Clear today's active day key
    await AsyncStorage.removeItem(todayKey());
    // Also sweep any day keys from the last 90 days to be thorough
    const keysToRemove: string[] = [];
    const today = new Date();
    for (let i = 0; i <= 90; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      keysToRemove.push(`${KEYS.DAY_PREFIX}${yyyy}-${mm}-${dd}`);
    }
    await AsyncStorage.multiRemove(keysToRemove);
  } catch {
    // silent
  }
}
