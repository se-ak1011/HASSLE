/**
 * Hassle — Home Screen widget data (RN side).
 *
 * Builds the small snapshot the iOS widget shows (today's energy, tasks, flare)
 * and pushes it to the shared App Group so WidgetKit can read it.
 *
 * `updateWidget` is a SEAM: it's a no-op until the native bridge is wired (see
 * WIDGET_SETUP.md). The RN side already computes the data here, so the remaining
 * work is purely native (write to the App Group + reload widget timelines).
 * No native imports here, so this stays safe for the web/SSR bundle.
 */

import { DayState, EnergyMode } from '@/constants/types';

export interface WidgetSnapshot {
  date: string;
  checkedIn: boolean;
  energyMode: EnergyMode;
  energyRemaining: number;
  energyMax: number;
  tasksDone: number;
  tasksTotal: number;
  isFlareDay: boolean;
  updatedAt: number;
}

export function buildWidgetSnapshot(
  day: DayState | null,
  energyRemaining: number
): WidgetSnapshot | null {
  if (!day) return null;
  const tasksDone = day.tasks.filter((t) => t.status === 'completed').length;
  const tasksTotal = day.tasks.filter((t) => t.status !== 'moved').length;
  return {
    date: day.date,
    checkedIn: day.checkedIn,
    energyMode: day.energyMode,
    energyRemaining,
    energyMax: day.energyLevel,
    tasksDone,
    tasksTotal,
    isFlareDay: day.isFlareDay,
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
