import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';
import { syncService, SyncStatus } from '@/services/syncService';

/**
 * Hassle — Account & Sync (opt-in, powered by Supabase).
 *
 * Local-first is the default and a full first-class experience: no account, no
 * email, everything on-device. A synced account is entirely OPTIONAL and free —
 * it only mirrors the same data across devices. Nothing about the app is gated
 * behind having an account (that's separate from Hassle Plus).
 */

export type AccountMode = 'local' | 'cloud';
export type AuthProvider = 'apple' | 'google';

export interface Account {
  id: string;
  provider: AuthProvider;
  displayName: string;
  email?: string;
}

interface AccountContextType {
  mode: AccountMode;
  account: Account | null;
  isLoading: boolean;
  syncStatus: SyncStatus;
  lastSyncedAt: number | null;
  signIn(provider: AuthProvider): Promise<{ ok: boolean; error?: string }>;
  signOut(): Promise<void>;
  syncNow(): Promise<void>;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

// Runs at module load (Expo Router eagerly requires every screen at startup).
// Guarded so a throw here can never abort the app before React even mounts.
try {
  WebBrowser.maybeCompleteAuthSession();
} catch {
  // no pending auth session / native not ready — safe to ignore
}

function accountFromSession(session: Session | null): Account | null {
  const u = session?.user;
  if (!u) return null;
  const rawProvider = (u.app_metadata?.provider as string) ?? 'google';
  const provider: AuthProvider = rawProvider === 'apple' ? 'apple' : 'google';
  const meta = u.user_metadata ?? {};
  const displayName =
    meta.full_name || meta.name || u.email || `${provider === 'apple' ? 'Apple' : 'Google'} account`;
  return { id: u.id, provider, displayName, email: u.email ?? undefined };
}

export function AccountProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('[HSTART] AccountProvider effect: start — creating client + getSession');
    supabase.auth.getSession().then(({ data }) => {
      // eslint-disable-next-line no-console
      console.log('[HSTART] AccountProvider: getSession resolved');
      setAccount(accountFromSession(data.session));
      setIsLoading(false);
    });
    // eslint-disable-next-line no-console
    console.log('[HSTART] AccountProvider: getSession called, registering auth listener');

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAccount(accountFromSession(session));
    });
    // eslint-disable-next-line no-console
    console.log('[HSTART] AccountProvider effect: setup done');
    return () => sub.subscription.unsubscribe();
  }, []);

  // After sign-in: pull (restore on a new device), then push (back up).
  const runInitialSync = useCallback(async () => {
    setSyncStatus('syncing');
    await syncService.pull();
    const result = await syncService.push();
    setSyncStatus(result.status);
    if (result.syncedAt) setLastSyncedAt(result.syncedAt);
  }, []);

  const signIn = useCallback(
    async (provider: AuthProvider) => {
      try {
        const redirectTo = makeRedirectUri({ scheme: 'hassle', path: 'auth-callback' });
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider,
          options: { redirectTo, skipBrowserRedirect: true },
        });
        if (error || !data?.url) {
          return { ok: false, error: error?.message ?? 'Could not start sign-in.' };
        }

        const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        if (res.type !== 'success' || !res.url) {
          return { ok: false, error: 'Sign-in was cancelled.' };
        }

        // Establish the session from the redirect. Supports both the PKCE
        // (?code=) and implicit (#access_token=) OAuth flows.
        const sessionError = await establishSession(res.url);
        if (sessionError) return { ok: false, error: sessionError };

        runInitialSync();
        return { ok: true };
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : 'Sign-in failed.' };
      }
    },
    [runInitialSync]
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setAccount(null);
    setSyncStatus('idle');
    setLastSyncedAt(null);
  }, []);

  const syncNow = useCallback(async () => {
    setSyncStatus('syncing');
    const result = await syncService.push();
    setSyncStatus(result.status);
    if (result.syncedAt) setLastSyncedAt(result.syncedAt);
  }, []);

  const mode: AccountMode = account ? 'cloud' : 'local';

  return (
    <AccountContext.Provider
      value={{ mode, account, isLoading, syncStatus, lastSyncedAt, signIn, signOut, syncNow }}
    >
      {children}
    </AccountContext.Provider>
  );
}

/** Returns an error string on failure, or null on success. */
async function establishSession(url: string): Promise<string | null> {
  const hash = url.includes('#') ? url.split('#')[1] : '';
  const query = url.includes('?') ? url.split('?')[1].split('#')[0] : '';
  const params = new URLSearchParams(hash || query);

  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  if (access_token && refresh_token) {
    const { error } = await supabase.auth.setSession({ access_token, refresh_token });
    return error ? error.message : null;
  }

  const code = params.get('code');
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    return error ? error.message : null;
  }

  return 'No session was returned from sign-in.';
}

export function useAccount(): AccountContextType {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error('useAccount must be used within an AccountProvider');
  return ctx;
}
