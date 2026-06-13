import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncService, SyncStatus } from '@/services/syncService';

/**
 * Hassle — Account & Sync (opt-in).
 *
 * Local-first is the default and a full first-class experience: no account, no
 * email, everything on-device. A synced account is entirely OPTIONAL and free —
 * it only mirrors the same data across devices. Nothing about the app is gated
 * behind having an account (that's separate from Hassle Plus).
 *
 * `signIn` is the seam real OAuth (Sign in with Apple / Google) drops into. For
 * now it establishes the account identity locally so the opt-in flow and its UI
 * states are real; the actual cloud backup activates when `syncService` is
 * configured.
 */

export type AccountMode = 'local' | 'cloud';
export type AuthProvider = 'apple' | 'google';

export interface Account {
  id: string;
  provider: AuthProvider;
  displayName: string;
  email?: string;
}

const ACCOUNT_KEY = 'hassle_account';

interface AccountContextType {
  /** 'local' (default) or 'cloud' once signed in. Derived from `account`. */
  mode: AccountMode;
  account: Account | null;
  isLoading: boolean;
  syncStatus: SyncStatus;
  lastSyncedAt: number | null;
  /** Opt in to syncing by signing in. Seam for real OAuth. */
  signIn(provider: AuthProvider): Promise<{ ok: boolean; error?: string }>;
  /** Return to device-only. Local data is kept untouched. */
  signOut(): Promise<void>;
  /** Manually push/pull now. No-op (reports status) until backend is wired. */
  syncNow(): Promise<void>;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

function providerLabel(p: AuthProvider): string {
  return p === 'apple' ? 'Apple' : 'Google';
}

export function AccountProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(ACCOUNT_KEY);
        if (raw) setAccount(JSON.parse(raw) as Account);
      } catch {
        // silent — default to local
      }
      setIsLoading(false);
    })();
  }, []);

  const signIn = useCallback(async (provider: AuthProvider) => {
    // Seam: a real Sign in with Apple / Google flow replaces this body and
    // returns the verified identity. Until then we establish the account
    // locally so the opt-in experience is real.
    const acct: Account = {
      id: `${provider}_${Date.now()}`,
      provider,
      displayName: providerLabel(provider) + ' account',
    };
    setAccount(acct);
    try {
      await AsyncStorage.setItem(ACCOUNT_KEY, JSON.stringify(acct));
    } catch {
      // silent
    }
    // Kick an initial sync (no-op until configured).
    const result = await syncService.pull();
    setSyncStatus(result.status);
    if (result.syncedAt) setLastSyncedAt(result.syncedAt);
    return { ok: true };
  }, []);

  const signOut = useCallback(async () => {
    setAccount(null);
    setSyncStatus('idle');
    setLastSyncedAt(null);
    try {
      await AsyncStorage.removeItem(ACCOUNT_KEY);
    } catch {
      // silent
    }
  }, []);

  const syncNow = useCallback(async () => {
    if (!account) return;
    setSyncStatus('syncing');
    const result = await syncService.push();
    setSyncStatus(result.status);
    if (result.syncedAt) setLastSyncedAt(result.syncedAt);
  }, [account]);

  const mode: AccountMode = account ? 'cloud' : 'local';

  return (
    <AccountContext.Provider
      value={{ mode, account, isLoading, syncStatus, lastSyncedAt, signIn, signOut, syncNow }}
    >
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount(): AccountContextType {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error('useAccount must be used within an AccountProvider');
  return ctx;
}
