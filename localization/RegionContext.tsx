import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_REGION, Region, RegionConfig, coerceRegion, regionConfig } from './region';

const REGION_KEY = 'hassle_region';

interface RegionContextValue {
  region: Region;
  config: RegionConfig;
  setRegion: (region: Region) => void;
  isLoading: boolean;
}

const RegionContext = createContext<RegionContextValue | undefined>(undefined);

let activeRegion: Region = DEFAULT_REGION;

export function getActiveRegion(): Region {
  return activeRegion;
}

export function getActiveRegionConfig(): RegionConfig {
  return regionConfig(activeRegion);
}

export function RegionProvider({ children }: { children: ReactNode }) {
  const [region, setRegionState] = useState<Region>(DEFAULT_REGION);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(REGION_KEY);
        const nextRegion = coerceRegion(stored);
        activeRegion = nextRegion;
        setRegionState(nextRegion);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const setRegion = useCallback((nextRegion: Region) => {
    activeRegion = nextRegion;
    setRegionState(nextRegion);
    AsyncStorage.setItem(REGION_KEY, nextRegion).catch(() => {});
  }, []);

  const value = useMemo<RegionContextValue>(
    () => ({
      region,
      config: regionConfig(region),
      setRegion,
      isLoading,
    }),
    [region, setRegion, isLoading]
  );

  return <RegionContext.Provider value={value}>{children}</RegionContext.Provider>;
}

export function useRegion(): RegionContextValue {
  const ctx = useContext(RegionContext);
  if (!ctx) throw new Error('useRegion must be used within a RegionProvider');
  return ctx;
}
