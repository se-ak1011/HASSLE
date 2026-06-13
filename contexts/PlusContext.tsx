import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Hassle Plus — optional paid tier.
 *
 * The entire core app (check-in, energy tracking, tasks, flare, reflection,
 * patterns, the standard export) is and stays FREE. Plus only unlocks *new*
 * additions on top of that, and helps fund ongoing development.
 *
 * Billing is not wired yet. `unlock()` is the seam a real in-app purchase
 * (e.g. RevenueCat / expo-in-app-purchases) will drop into later — for now it
 * grants the entitlement locally so Plus features can be built and tested.
 */

const PLUS_KEY = 'hassle_plus';

interface PlusContextType {
  isPlus: boolean;
  isLoading: boolean;
  /** Grant the entitlement. Real IAP replaces the body; callers stay the same. */
  unlock(): Promise<void>;
  /** Re-check entitlement (placeholder for "restore purchases"). */
  restore(): Promise<boolean>;
  /** Revoke entitlement — for testing the locked state. */
  lock(): Promise<void>;
}

const PlusContext = createContext<PlusContextType | undefined>(undefined);

export function PlusProvider({ children }: { children: ReactNode }) {
  const [isPlus, setIsPlus] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(PLUS_KEY);
        setIsPlus(raw === 'true');
      } catch {
        // silent — default to free
      }
      setIsLoading(false);
    })();
  }, []);

  const unlock = useCallback(async () => {
    setIsPlus(true);
    try {
      await AsyncStorage.setItem(PLUS_KEY, 'true');
    } catch {
      // silent
    }
  }, []);

  const restore = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(PLUS_KEY);
      const has = raw === 'true';
      setIsPlus(has);
      return has;
    } catch {
      return false;
    }
  }, []);

  const lock = useCallback(async () => {
    setIsPlus(false);
    try {
      await AsyncStorage.removeItem(PLUS_KEY);
    } catch {
      // silent
    }
  }, []);

  return (
    <PlusContext.Provider value={{ isPlus, isLoading, unlock, restore, lock }}>
      {children}
    </PlusContext.Provider>
  );
}

export function usePlus(): PlusContextType {
  const ctx = useContext(PlusContext);
  if (!ctx) throw new Error('usePlus must be used within a PlusProvider');
  return ctx;
}
