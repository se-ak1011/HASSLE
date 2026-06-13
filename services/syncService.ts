/**
 * Hassle — Sync Service (foundation seam)
 *
 * Hassle is local-first: everything lives in AsyncStorage and the app is fully
 * functional with no account. Syncing is an OPT-IN mirror of that same data to
 * a signed-in account, so it can be carried across devices.
 *
 * This module is the seam a real backend (e.g. Supabase, or a custom API) drops
 * into later. For now `push`/`pull` are no-ops that report `not_configured`, so
 * the UI can show honest status without claiming a backup exists.
 *
 * When wired, the implementation should:
 *   - serialise preferences + history + scheduled tasks,
 *   - push on local change (debounced) and pull on sign-in / app open,
 *   - resolve conflicts last-write-wins per day, and
 *   - never block the local experience on the network.
 */

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

export const syncService = {
  /** Whether a real backend has been wired up. Flip to true when implemented. */
  isConfigured: false,

  /** Push local data up to the account. No-op until configured. */
  async push(): Promise<SyncResult> {
    if (!this.isConfigured) return { status: 'not_configured' };
    // TODO: serialise + upload local state.
    return { status: 'synced', syncedAt: Date.now() };
  },

  /** Pull account data down and merge into local. No-op until configured. */
  async pull(): Promise<SyncResult> {
    if (!this.isConfigured) return { status: 'not_configured' };
    // TODO: download + merge remote state.
    return { status: 'synced', syncedAt: Date.now() };
  },
};
