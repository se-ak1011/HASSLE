/**
 * Hassle — Sync Service
 *
 * Hassle is local-first: everything lives in AsyncStorage and the app is fully
 * functional with no account. Syncing is an OPT-IN mirror of that same data to
 * the signed-in Supabase account, so it can be backed up and carried across
 * devices.
 *
 * Design (deliberately conservative for a first version):
 *   - push: upload preferences + every completed day + the scheduled-task list.
 *   - pull: NON-DESTRUCTIVE. Add remote completed days that are missing locally.
 *     Preferences and scheduled tasks are only hydrated on a *fresh* device
 *     (empty local history), so we never clobber data on an active device.
 * A smarter per-field, timestamp-based merge can come once this is field-tested.
 */

import { supabase } from './supabase';
import {
  loadPreferences,
  savePreferences,
  loadHistory,
  saveCompletedDay,
  loadScheduledTasks,
  saveScheduledTasks,
} from './storage';
import { DayState } from '@/constants/types';

export type SyncStatus =
  | 'idle'
  | 'syncing'
  | 'synced'
  | 'offline'
  | 'error'
  | 'not_configured';

export interface SyncResult {
  status: SyncStatus;
  /** epoch ms of the successful sync, when status === 'synced'. */
  syncedAt?: number;
  error?: string;
}

async function currentUserId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export const syncService = {
  /** The backend is wired. push/pull still no-op gracefully without a session. */
  isConfigured: true,

  /** Push local data up to the account. */
  async push(): Promise<SyncResult> {
    const userId = await currentUserId();
    if (!userId) return { status: 'not_configured' };
    try {
      const now = new Date().toISOString();
      const [prefs, history, scheduled] = await Promise.all([
        loadPreferences(),
        loadHistory(),
        loadScheduledTasks(),
      ]);

      const prefRes = await supabase
        .from('preferences')
        .upsert({ user_id: userId, payload: prefs, updated_at: now });
      if (prefRes.error) return { status: 'error', error: prefRes.error.message };

      if (history.length > 0) {
        const rows = history.map((d) => ({
          user_id: userId,
          date: d.date,
          payload: d,
          updated_at: now,
        }));
        const dayRes = await supabase.from('days').upsert(rows);
        if (dayRes.error) return { status: 'error', error: dayRes.error.message };
      }

      const schedRes = await supabase
        .from('scheduled_tasks')
        .upsert({ user_id: userId, payload: scheduled, updated_at: now });
      if (schedRes.error) return { status: 'error', error: schedRes.error.message };

      return { status: 'synced', syncedAt: Date.now() };
    } catch (e) {
      return { status: 'error', error: e instanceof Error ? e.message : 'Sync failed' };
    }
  },

  /** Pull account data down and merge into local (non-destructive). */
  async pull(): Promise<SyncResult> {
    const userId = await currentUserId();
    if (!userId) return { status: 'not_configured' };
    try {
      const localHistory = await loadHistory();
      const fresh = localHistory.length === 0;
      const localDates = new Set(localHistory.map((d) => d.date));

      const { data: dayRows, error } = await supabase
        .from('days')
        .select('date,payload');
      if (error) return { status: 'error', error: error.message };

      for (const row of dayRows ?? []) {
        const r = row as { date: string; payload: DayState };
        if (!localDates.has(r.date)) {
          await saveCompletedDay(r.payload);
        }
      }

      // Only hydrate preferences / scheduled tasks on a brand-new device, so an
      // active device's data is never overwritten.
      if (fresh) {
        const { data: pref } = await supabase
          .from('preferences')
          .select('payload')
          .maybeSingle();
        if (pref?.payload) await savePreferences(pref.payload);

        const { data: sched } = await supabase
          .from('scheduled_tasks')
          .select('payload')
          .maybeSingle();
        if (sched?.payload) await saveScheduledTasks(sched.payload);
      }

      return { status: 'synced', syncedAt: Date.now() };
    } catch (e) {
      return { status: 'error', error: e instanceof Error ? e.message : 'Sync failed' };
    }
  },
};
