import React, {
  createContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
  useCallback,
  useMemo,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  DayState,
  UserPreferences,
  Task,
  CompletionFeeling,
  EnergyMode,
  DailyTag,
  BUILT_IN_TAGS,
  dedupeCustomTags,
  DEFAULT_PREFERENCES,
  DefaultDailyTask,
  ReminderSettings,
} from '@/constants/types';
import {
  loadTodayState,
  saveTodayState,
  clearTodayState,
  loadPreferences,
  savePreferences,
  saveCompletedDay,
  clearAllData,
  getTodayDateString,
} from '@/services/storage';

// ─── Pure Helpers ─────────────────────────────────────────────────────────────

/** Minimum cost floor — a task can never cost less than 1 unit */
const MIN_COST = 1;

/**
 * Single source of truth for cost calculation.
 * effectiveCost is NEVER stored — always computed.
 * Always rounds UP (ceiling) after flare multiplication.
 * Flare applies to the CURRENT baseCost (post-learning), not the original.
 */
export function getEffectiveCost(baseCost: number, isFlareDay: boolean): number {
  const base = Math.max(MIN_COST, baseCost);
  if (isFlareDay) return Math.max(MIN_COST, Math.ceil(base * 1.5));
  return base;
}

/**
 * Hydrate stored tasks with live effectiveCost based on current flare state.
 * Call this every time tasks are read from storage or flare state changes.
 */
function hydrateTasks(tasks: Task[], isFlareDay: boolean): Task[] {
  return tasks.map((t) => ({
    ...t,
    effectiveCost: getEffectiveCost(t.baseCost, isFlareDay),
  }));
}

// ─── Context Type ────────────────────────────────────────────────────────────

export interface DayContextType {
  day: DayState | null;
  prefs: UserPreferences | null;
  isLoading: boolean;

  /**
   * Preview flare typography before a day is started. The check-in screen's
   * flare toggle sets this so the whole UI switches to the flare font even
   * though no active day exists yet.
   */
  flarePreview: boolean;
  setFlarePreview(value: boolean): void;

  // Check-in
  completeCheckIn(
    mode: EnergyMode,
    level: number,
    isFlare: boolean,
    tags: DailyTag[]
  ): Promise<void>;

  // Flare toggle (from home screen) — recalculates all tasks immediately
  toggleFlare(value: boolean): void;

  // Tasks
  addTask(name: string, baseCost: number, category?: string, isPreMade?: boolean): void;
  completeTask(taskId: string, feeling: CompletionFeeling): void;
  moveTaskToTomorrow(taskId: string): void;
  dismissTask(taskId: string): void;
  updateTaskDefault(name: string, baseCost: number, saveAsDefault: boolean): void;

  // Reflection
  saveJournal(entry: string, prompts: DayState['guidedPrompts']): void;

  /** Add a user-created custom tag and persist it. Returns false if duplicate. */
  addCustomTag(tag: string): boolean;

  /**
   * End the current day: archives today's full snapshot to history,
   * then clears the active day so the user returns to check-in.
   * Learned task costs in prefs are preserved.
   */
  endDay(): Promise<void>;

  /**
   * Wipe all local data: history, active day, prefs (custom tags, learned costs).
   * Resets the app to a completely fresh state.
   */
  resetAllData(): Promise<void>;

  /**
   * Called at the end of first-launch onboarding.
   * Saves the user's default daily tasks and reminder settings,
   * and marks onboarding as complete.
   */
  completeOnboarding(
    defaultTasks: DefaultDailyTask[],
    reminders: ReminderSettings
  ): Promise<void>;

  /** Update reminder settings (called from Settings screen). */
  updateReminders(reminders: ReminderSettings): void;

  /** Update the user's default daily tasks (called from Settings screen). */
  updateDefaultDailyTasks(tasks: DefaultDailyTask[]): void;

  /** Update the user's name / conditions (local only, called from Settings). */
  updateProfile(profile: { name?: string; conditions?: string[] }): void;

  // Computed
  energyUsed: number;
  energyRemaining: number;
}

// ─── Initial Day ─────────────────────────────────────────────────────────────

function emptyDay(): DayState {
  return {
    date: getTodayDateString(),
    energyMode: 'spoon',
    energyLevel: 6,
    isFlareDay: false,
    tags: [],
    tasks: [],
    checkedIn: false,
  };
}

// ─── Context ─────────────────────────────────────────────────────────────────

export const DayContext = createContext<DayContextType | undefined>(undefined);

export function DayProvider({ children }: { children: ReactNode }) {
  const [day, setDayRaw] = useState<DayState | null>(null);
  const [prefs, setPrefsRaw] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [flarePreview, setFlarePreview] = useState(false);
  const dayRef = useRef<DayState | null>(null);

  // Keep dayRef in sync so AppState handler can read latest day without stale closure
  useEffect(() => {
    dayRef.current = day;
  }, [day]);

  // Persist whenever day changes — strip effectiveCost before saving (never store derived values)
  const setDay = useCallback(
    (updater: DayState | ((prev: DayState) => DayState)) => {
      setDayRaw((prev) => {
        const next =
          typeof updater === 'function' ? updater(prev ?? emptyDay()) : updater;

        // Always ensure tasks have correct effectiveCost based on current flare state
        const hydratedNext: DayState = {
          ...next,
          tasks: hydrateTasks(next.tasks, next.isFlareDay),
        };

        // Save with baseCost preserved — effectiveCost will be recomputed on load
        saveTodayState(hydratedNext);
        return hydratedNext;
      });
    },
    []
  );

  const setPrefs = useCallback((p: UserPreferences) => {
    setPrefsRaw(p);
    savePreferences(p);
  }, []);

  /**
   * Auto-archive a day into history if it belongs to a past date.
   * Called on mount and when the app comes back to the foreground.
   * Does NOT clear the active day key — user can still see it in Reflect.
   * If the user never pressed "End Day", the previous day's data is still preserved.
   */
  const autoArchivePastDay = useCallback(async (savedDay: DayState) => {
    const today = getTodayDateString();
    if (savedDay.date !== today && savedDay.checkedIn) {
      // Day is from a previous date — archive it to history automatically
      await saveCompletedDay(savedDay);
      await clearTodayState();
      return null; // signal that active day should be cleared
    }
    return savedDay;
  }, []);

  // Load on mount — hydrate tasks immediately with stored flare state
  useEffect(() => {
    (async () => {
      const [savedDay, savedPrefs] = await Promise.all([
        loadTodayState(),
        loadPreferences(),
      ]);

      if (savedDay) {
        const archived = await autoArchivePastDay(savedDay);
        if (archived) {
          // Re-hydrate effectiveCost from stored baseCost + stored flare state
          const hydrated: DayState = {
            ...archived,
            tasks: hydrateTasks(archived.tasks, archived.isFlareDay),
          };
          setDayRaw(hydrated);
        } else {
          // Past day was auto-archived — return to check-in
          setDayRaw(null);
        }
      } else {
        // No active day — stay null so the Today tab shows the check-in screen
        setDayRaw(null);
      }

      // Migrate any stale case-duplicate custom tags (e.g. "Period" left over
      // from before "period" became a built-in) and persist the cleaned list.
      if (savedPrefs) {
        const rawCustom = savedPrefs.customTags ?? [];
        const cleanedCustom = dedupeCustomTags(rawCustom);
        const changed =
          cleanedCustom.length !== rawCustom.length ||
          cleanedCustom.some((t, i) => t !== rawCustom[i]);
        if (changed) {
          const migrated = { ...savedPrefs, customTags: cleanedCustom };
          setPrefsRaw(migrated);
          savePreferences(migrated);
        } else {
          setPrefsRaw(savedPrefs);
        }
      } else {
        setPrefsRaw(savedPrefs);
      }
      setIsLoading(false);
    })();
  }, [autoArchivePastDay]);

  // Listen for app coming back to foreground — check if the date has changed
  // and auto-archive the previous day's data if needed
  useEffect(() => {
    const handleAppStateChange = async (nextState: AppStateStatus) => {
      if (nextState !== 'active') return;
      const current = dayRef.current;
      if (!current) return;
      const today = getTodayDateString();
      if (current.date !== today && current.checkedIn) {
        await saveCompletedDay(current);
        await clearTodayState();
        setDayRaw(null);
      }
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
  }, []);

  // ── Check-in ────────────────────────────────────────────────────────────────

  const completeCheckIn = useCallback(
    async (mode: EnergyMode, level: number, isFlare: boolean, tags: DailyTag[]) => {
      // Auto-generate tasks from the user's saved default daily tasks
      const currentPrefs = await loadPreferences();
      const defaultTasks: Task[] = (currentPrefs.defaultDailyTasks ?? []).map(
        (dt) => ({
          id: `default-${Date.now()}-${Math.random()}`,
          name: dt.name,
          baseCost: currentPrefs.taskDefaults[dt.name] ?? dt.baseCost,
          effectiveCost: currentPrefs.taskDefaults[dt.name] ?? dt.baseCost,
          category: dt.category,
          status: 'pending' as const,
          isPreMade: true,
          isDefaultTask: true,
        })
      );

      const newDay: DayState = {
        date: getTodayDateString(),
        energyMode: mode,
        energyLevel: level,
        isFlareDay: isFlare,
        tags,
        tasks: defaultTasks,
        checkedIn: true,
      };
      // Hydrate tasks — applies flare multiplier if needed
      const hydrated: DayState = {
        ...newDay,
        tasks: hydrateTasks(newDay.tasks, newDay.isFlareDay),
      };
      saveTodayState(hydrated);
      setDayRaw(hydrated);
    },
    []
  );

  // ── Flare Toggle ─────────────────────────────────────────────────────────────
  // Toggling flare recalculates ALL task effectiveCosts immediately.
  // baseCost is never touched — only effectiveCost changes.

  const toggleFlare = useCallback(
    (value: boolean) => {
      setDay((prev) => ({
        ...prev,
        isFlareDay: value,
        // hydrateTasks is called inside setDay, but we set isFlareDay first
        // so the hydration in setDay will use the new value. However, since
        // setDay's hydration reads next.isFlareDay which is `value`, this is correct.
      }));
    },
    [setDay]
  );

  // ── Add Task ─────────────────────────────────────────────────────────────────
  // Store ONLY baseCost. effectiveCost is derived by setDay's hydration pass.
  // Enforce minimum cost floor at creation.

  const addTask = useCallback(
    (name: string, baseCost: number, category?: string, isPreMade?: boolean) => {
      setDay((prev) => {
        const safeCost = Math.max(1, baseCost);
        const task: Task = {
          id: `${Date.now()}-${Math.random()}`,
          name,
          category,
          baseCost: safeCost,
          effectiveCost: safeCost, // will be overwritten by hydrateTasks in setDay
          status: 'pending',
          isPreMade,
        };
        return { ...prev, tasks: [...prev.tasks, task] };
      });
    },
    [setDay]
  );

  // ── Complete Task ─────────────────────────────────────────────────────────────
  // completedCost = effectiveCost AT TIME OF COMPLETION (historical accuracy)
  // baseCost is adjusted slightly based on feeling (learning system)

  const completeTask = useCallback(
    (taskId: string, feeling: CompletionFeeling) => {
      setDay((prev) => {
        const updatedTasks = prev.tasks.map((t) => {
          if (t.id !== taskId) return t;

          // Record the cost exactly as it was at completion time
          const completedCost = t.effectiveCost;

          // Gradually adjust baseCost for learning (never from flare)
          // Order: 1. baseCost  2. apply learning  3. flare multiplier applies on top
          let newBase = t.baseCost;
          if (feeling === 'easier') newBase = Math.max(1, t.baseCost - 1);
          if (feeling === 'harder') newBase = Math.max(1, t.baseCost + 1);

          return {
            ...t,
            status: 'completed' as const,
            completedCost,
            completionFeeling: feeling,
            baseCost: newBase,
            // effectiveCost will be recalculated by hydrateTasks in setDay
          };
        });

        // Update prefs if task name is known
        const completed = updatedTasks.find((t) => t.id === taskId);
        if (completed && prefs) {
          const updated: UserPreferences = {
            ...prefs,
            taskDefaults: {
              ...prefs.taskDefaults,
              [completed.name]: completed.baseCost,
            },
          };
          setPrefs(updated);
        }

        return { ...prev, tasks: updatedTasks };
      });
    },
    [setDay, prefs, setPrefs]
  );

  // ── Move to Tomorrow ──────────────────────────────────────────────────────────

  const moveTaskToTomorrow = useCallback(
    (taskId: string) => {
      setDay((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === taskId ? { ...t, status: 'moved' as const } : t
        ),
      }));
    },
    [setDay]
  );

  // ── Dismiss Task ──────────────────────────────────────────────────────────────

  const dismissTask = useCallback(
    (taskId: string) => {
      setDay((prev) => ({
        ...prev,
        tasks: prev.tasks.filter((t) => t.id !== taskId),
      }));
    },
    [setDay]
  );

  // ── Update Task Default ────────────────────────────────────────────────────────

  const updateTaskDefault = useCallback(
    (name: string, baseCost: number, saveAsDefault: boolean) => {
      if (saveAsDefault && prefs) {
        setPrefs({
          ...prefs,
          taskDefaults: { ...prefs.taskDefaults, [name]: baseCost },
        });
      }
    },
    [prefs, setPrefs]
  );

  // ── Add Custom Tag ─────────────────────────────────────────────────────────
  // Persists to prefs.customTags; deduplicates case-insensitively.
  // Returns true if added, false if duplicate.

  const addCustomTag = useCallback(
    (raw: string): boolean => {
      const tag = raw.trim().slice(0, 30);
      if (!tag) return false;
      const currentCustom = prefs?.customTags ?? [];
      const allExisting = [...BUILT_IN_TAGS, ...currentCustom].map((t) =>
        t.toLowerCase()
      );
      if (allExisting.includes(tag.toLowerCase())) return false;
      const updated: UserPreferences = {
        ...(prefs ?? { energyMode: 'spoon', taskDefaults: {}, customTags: [] }),
        customTags: [...currentCustom, tag],
      };
      setPrefs(updated);
      return true;
    },
    [prefs, setPrefs]
  );

  // ── End Day ───────────────────────────────────────────────────────────────────
  // Archives today's full snapshot to history (energy, tasks, reflection, flare,
  // symptoms, tags, learned costs). Then clears the active day so the user is
  // returned to the check-in screen. Prefs (learned task costs) are preserved.

  const endDay = useCallback(async () => {
    if (!day) return;
    // 1. Save the full snapshot to persistent history
    await saveCompletedDay(day);
    // 2. Remove today's key from AsyncStorage — no stale day on next app launch
    await clearTodayState();
    // 3. Set day to null — Today tab shows check-in screen immediately
    setDayRaw(null);
  }, [day]);

  // ── Reset All Data ────────────────────────────────────────────────────────────
  // Wipes all local storage and resets both day and prefs to null/defaults.

  const resetAllData = useCallback(async () => {
    await clearAllData();
    setDayRaw(null);
    setPrefsRaw(DEFAULT_PREFERENCES);
  }, []);

  // ── Complete Onboarding ───────────────────────────────────────────────────────
  // Called at the end of the onboarding flow. Saves default tasks, reminder
  // settings, and marks onboarding complete.

  const completeOnboarding = useCallback(
    async (defaultTasks: DefaultDailyTask[], reminders: ReminderSettings) => {
      const current = await loadPreferences();
      const updated: UserPreferences = {
        ...current,
        defaultDailyTasks: defaultTasks,
        reminders,
        hasCompletedOnboarding: true,
      };
      setPrefs(updated);
    },
    [setPrefs]
  );

  // ── Update Reminders ──────────────────────────────────────────────────────────

  const updateReminders = useCallback(
    (reminders: ReminderSettings) => {
      if (!prefs) return;
      setPrefs({ ...prefs, reminders });
    },
    [prefs, setPrefs]
  );

  // ── Update Default Daily Tasks ────────────────────────────────────────────────

  const updateDefaultDailyTasks = useCallback(
    (tasks: DefaultDailyTask[]) => {
      if (!prefs) return;
      setPrefs({ ...prefs, defaultDailyTasks: tasks });
    },
    [prefs, setPrefs]
  );

  // ── Update Profile (name / conditions) ────────────────────────────────────────

  const updateProfile = useCallback(
    (profile: { name?: string; conditions?: string[] }) => {
      if (!prefs) return;
      setPrefs({ ...prefs, ...profile });
    },
    [prefs, setPrefs]
  );

  // ── Journal ────────────────────────────────────────────────────────────────────

  const saveJournal = useCallback(
    (entry: string, prompts: DayState['guidedPrompts']) => {
      setDay((prev) => ({ ...prev, journalEntry: entry, guidedPrompts: prompts }));
    },
    [setDay]
  );

  // ── Computed — always derived from live effectiveCost ─────────────────────────

  const energyUsed = useMemo(
    () =>
      day?.tasks
        .filter((t) => t.status === 'completed')
        .reduce((sum, t) => sum + (t.completedCost ?? t.effectiveCost), 0) ?? 0,
    [day?.tasks]
  );

  const energyRemaining = useMemo(
    () => Math.max(0, (day?.energyLevel ?? 0) - energyUsed),
    [day?.energyLevel, energyUsed]
  );

  return (
    <DayContext.Provider
      value={{
        day,
        prefs,
        isLoading,
        flarePreview,
        setFlarePreview,
        completeCheckIn,
        toggleFlare,
        addTask,
        completeTask,
        moveTaskToTomorrow,
        dismissTask,
        updateTaskDefault,
        saveJournal,
        addCustomTag,
        endDay,
        resetAllData,
        completeOnboarding,
        updateReminders,
        updateDefaultDailyTasks,
        updateProfile,
        energyUsed,
        energyRemaining,
      }}
    >
      {children}
    </DayContext.Provider>
  );
}
