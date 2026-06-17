/**
 * Hassle — Home Screen widget data (RN side).
 *
 * Builds the snapshot the iOS widget shows and pushes it to the shared App Group
 * (group.com.hassle.app) so WidgetKit can read it. The RN side owns all the
 * logic — including which Lola "pose" image to show for the current energy — so
 * the SwiftUI widget stays dumb (just reads + draws).
 *
 * The actual write uses `ExtensionStorage` from `@bacons/apple-targets`, loaded
 * lazily so this module is safe to import on web / before the native widget is
 * enabled (e.g. on `main`, where the package isn't installed). See
 * WIDGET_SETUP.md and targets/widget/.
 */

import { DayState, EnergyMode } from '@/constants/types';

/** App Group shared between the app and the widget extension. */
export const WIDGET_APP_GROUP = 'group.com.hassle.app';
/** Key the snapshot JSON is stored under in the App Group. */
export const WIDGET_SNAPSHOT_KEY = 'snapshot';

// The Lola pose assets we actually shipped (assets/widget/). The widget picks
// the nearest one for the current energy, so we never reference a missing image.
const BATTERY_LEVELS = [0, 10, 20, 30, 40, 60, 80, 100];
const SPOON_LEVELS = [0, 1, 2, 4, 6, 8, 10, 12];

function nearest(value: number, levels: number[]): number {
  return levels.reduce((best, lvl) =>
    Math.abs(lvl - value) < Math.abs(best - value) ? lvl : best
  );
}

/** Image name (no extension) for the current energy — matches assets/widget/. */
function poseFor(mode: EnergyMode, energyPercent: number, energyRemaining: number): string {
  if (mode === 'battery') {
    return `battery-${nearest(Math.max(0, Math.min(100, energyPercent)), BATTERY_LEVELS)}`;
  }
  return `spoon-${nearest(Math.max(0, energyRemaining), SPOON_LEVELS)}`;
}

export interface WidgetSnapshot {
  date: string;
  checkedIn: boolean;
  energyMode: EnergyMode;
  energyRemaining: number;
  energyMax: number;
  /** 0–100, used to pick Lola's pose. */
  energyPercent: number;
  /** Image name for Lola's current pose (e.g. "battery-80" / "spoon-6"). */
  pose: string;
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
    pose: poseFor(day.energyMode, energyPercent, energyRemaining),
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
 * Push the snapshot to the iOS App Group and reload the widget timelines.
 *
 * Lazily loads `@bacons/apple-targets` so this is a safe no-op anywhere the
 * native widget isn't present (web, or builds without the widget target).
 */
export async function updateWidget(snapshot: WidgetSnapshot | null): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { ExtensionStorage } = require('@bacons/apple-targets');
    const storage = new ExtensionStorage(WIDGET_APP_GROUP);
    if (snapshot) {
      storage.set(WIDGET_SNAPSHOT_KEY, JSON.stringify(snapshot));
    } else {
      storage.remove(WIDGET_SNAPSHOT_KEY);
    }
    ExtensionStorage.reloadWidget();
  } catch {
    // Package not installed / not on iOS / widget not enabled — no-op.
  }
}
