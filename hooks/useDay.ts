import { useContext } from 'react';
import { DayContext, DayContextType } from '@/contexts/DayContext';

export function useDay(): DayContextType {
  const ctx = useContext(DayContext);
  if (!ctx) throw new Error('useDay must be used within DayProvider');
  return ctx;
}
