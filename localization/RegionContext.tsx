// Hassle — region provider.
//
// Owns the user's selected country/region. Persists it to its own storage key
// (device-level, independent of account data and of onboarding), defaults to
// US, and keeps the non-React singletons (strings + resources) in sync so
// services resolve the same region. Changing region re-renders the app so all
// localised content updates immediately.

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Region, DEFAULT_REGION, coerceRegion, regionMeta } from './region';
import { translate, setActiveRegion } from './strings';
import { resourcesFor, setActiveResources, RegionResources } from './resources';

const REGION_KEY = 'hassle_region';

interface RegionContextValue {
  region: Region;
  setRegion: (r: Region) => void;
  isLoading: boolean;
  /** Translate a UI string key for the active region. */
  t: (key: string, vars?: Record<string, string | number>) => string;
  /** Region-specific facts (currency, terminology, emergency, etc.). */
  res: RegionResources;
  /** BCP-47 locale for date/number formatting. */
  locale: string;
}

const RegionContext = createContext<RegionContextValue | undefined>(undefined);

export function RegionProvider({ children }: { children: ReactNode }) {
  const [region, setRegionState] = useState<Region>(DEFAULT_REGION);
  const [isLoading, setIsLoading] = useState(true);

  // Load the persisted region once, syncing the service-side singletons.
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(REGION_KEY);
        const r = coerceRegion(stored);
        setRegionState(r);
        setActiveRegion(r);
        setActiveResources(r);
      } catch {
        // default (US) already applied
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const setRegion = useCallback((r: Region) => {
    setRegionState(r);
    setActiveRegion(r);
    setActiveResources(r);
    AsyncStorage.setItem(REGION_KEY, r).catch(() => {});
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => translate(region, key, vars),
    [region]
  );

  const value = useMemo<RegionContextValue>(
    () => ({
      region,
      setRegion,
      isLoading,
      t,
      res: resourcesFor(region),
      locale: regionMeta(region).locale,
    }),
    [region, setRegion, isLoading, t]
  );

  return <RegionContext.Provider value={value}>{children}</RegionContext.Provider>;
}

export function useRegion(): RegionContextValue {
  const ctx = useContext(RegionContext);
  if (!ctx) throw new Error('useRegion must be used within a RegionProvider');
  return ctx;
}
