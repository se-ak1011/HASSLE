import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/services/supabase';
import { billing } from '@/services/billing';

/**
 * Hassle Plus — optional paid tier.
 *
 * The entire core app (check-in, energy tracking, tasks, flare, reflection,
 * patterns, the standard export) is and stays FREE. Plus only unlocks *new*
 * additions on top of that, and helps fund ongoing development.
 *
 * `isPlus` is the OR of three sources:
 *   1. localUnlock — the beta placeholder (`unlock()` flips a local flag so Plus
 *      can be used before billing is live).
 *   2. comped      — a tester/comp grant from the Supabase `comps` table, keyed
 *      to the signed-in user. This is how named testers get Plus free forever.
 *   3. purchased   — a real RevenueCat entitlement (seam in services/billing.ts;
 *      returns false until the SDK is wired).
 */

const PLUS_KEY = 'hassle_plus';

interface PlusContextType {
  isPlus: boolean;
  isLoading: boolean;
  /** Whether Plus is granted via a tester/comp record (vs purchased/unlocked). */
  isComped: boolean;
  /** Beta placeholder grant. At launch the paywall calls billing.purchasePlus(). */
  unlock(): Promise<void>;
  /** Re-check all entitlement sources (purchases, comp, local). */
  restore(): Promise<boolean>;
  /** Revoke the local beta unlock (for testing the locked state). */
  lock(): Promise<void>;
}

const PlusContext = createContext<PlusContextType | undefined>(undefined);

/** Looks up whether the signed-in user has a comp/tester grant. */
async function fetchComped(): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;
    const { data, error } = await supabase
      .from('comps')
      .select('plus')
      .eq('user_id', user.id)
      .maybeSingle();
    if (error) return false;
    return Boolean(data?.plus);
  } catch {
    return false;
  }
}

export function PlusProvider({ children }: { children: ReactNode }) {
  const [localUnlock, setLocalUnlock] = useState(false);
  const [comped, setComped] = useState(false);
  const [purchased, setPurchased] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const isPlus = localUnlock || comped || purchased;

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(PLUS_KEY);
        setLocalUnlock(raw === 'true');
      } catch {
        // silent — default to free
      }
      // These are best-effort; failures just leave the user on the free tier.
      setPurchased(await billing.hasPlusEntitlement());
      setComped(await fetchComped());
      setIsLoading(false);
    })();

    // Re-check the comp grant whenever auth changes (sign in / out).
    const { data: sub } = supabase.auth.onAuthStateChange(async () => {
      setComped(await fetchComped());
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const unlock = useCallback(async () => {
    setLocalUnlock(true);
    try {
      await AsyncStorage.setItem(PLUS_KEY, 'true');
    } catch {
      // silent
    }
  }, []);

  const restore = useCallback(async () => {
    const [p, c] = await Promise.all([billing.restore(), fetchComped()]);
    setPurchased(p);
    setComped(c);
    let local = false;
    try {
      local = (await AsyncStorage.getItem(PLUS_KEY)) === 'true';
    } catch {
      // silent
    }
    setLocalUnlock(local);
    return p || c || local;
  }, []);

  const lock = useCallback(async () => {
    setLocalUnlock(false);
    try {
      await AsyncStorage.removeItem(PLUS_KEY);
    } catch {
      // silent
    }
  }, []);

  return (
    <PlusContext.Provider value={{ isPlus, isLoading, isComped: comped, unlock, restore, lock }}>
      {children}
    </PlusContext.Provider>
  );
}

export function usePlus(): PlusContextType {
  const ctx = useContext(PlusContext);
  if (!ctx) throw new Error('usePlus must be used within a PlusProvider');
  return ctx;
}
