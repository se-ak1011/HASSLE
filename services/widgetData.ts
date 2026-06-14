/**
 * Hassle — Home Screen widget data (RN side).
 *
 * Builds the snapshot the iOS widget shows and pushes it to the shared App Group
 * so WidgetKit can read it. Supports the small (energy + symptom tags), medium
 * (energy + tasks + last reflection), and Lola-pose (by energy %) designs.
 *
 * `updateWidget` is a SEAM: a no-op until the native bridge is wired (see
 * WIDGET_SETUP.md). The RN side already computes everything here, so the
 * remaining work is purely native. No native imports — safe for web/SSR bundles.
 */

import { DayState, EnergyMode } from '@/constants/types';

export interface WidgetSnapshot {
  date: string;
  checkedIn: boolean;
  energyMode: EnergyMode;
  energyRemaining: number;
  energyMax: number;
  /** 0–100, used to pick Lola's pose. */
  energyPercent: number;
  tasksDone: number;
  tasksTotal: number;
  /** Names of the next few pending tasks (for the medium "tasks left" layout). */
  pendingTasks: string[];
  isFlareDay: boolean;
  /** Today's tags (for the small layout). */
  tags: string[];
  /** Today's reflection text, if any (for the medium layout). */
  reflection?: string;
  updatedAt: number;
}

export function buildWidgetSnapshot(
  day: DayState | null,
  energyRemaining: number
): WidgetSnapshot | null {
  if (!day) return null;
  const tasksDone = day.tasks.filter((t) => t.status === 'completed').length;
  const tasksTotal = day.tasks.filter((t) => t.status !== 'moved').length;
  const pendingTasks = day.tasks
    .filter((t) => t.status === 'pending')
    .map((t) => t.name)
    .slice(0, 3);
  const energyMax = day.energyLevel;
  const energyPercent = energyMax > 0 ? Math.round((energyRemaining / energyMax) * 100) : 0;
  const reflection =
    day.journalEntry?.trim() || day.guidedPrompts?.drained?.trim() || undefined;

  return {
    date: day.date,
    checkedIn: day.checkedIn,
    energyMode: day.energyMode,
    energyRemaining,
    energyMax,
    energyPercent,
    tasksDone,
    tasksTotal,
    pendingTasks,
    isFlareDay: day.isFlareDay,
    tags: day.tags.slice(0, 3),
    reflection,
    updatedAt: Date.now(),
  };
}

/**
 * Push the snapshot to the iOS App Group so the Home Screen widget can read it.
 * No-op until the native bridge exists — see WIDGET_SETUP.md. When wired, this
 * should JSON-serialise to the shared App Group (group.com.hassle.app) and call
 * WidgetCenter.reloadAllTimelines().
 */
export async function updateWidget(_snapshot: WidgetSnapshot | null): Promise<void> {
  // TODO (native): write to the shared App Group + reload widget timelines.
}
