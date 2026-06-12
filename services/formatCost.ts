import { EnergyMode } from '@/constants/types';

interface FormatOptions {
  /** Omit the unit label — return just the number */
  short?: boolean;
  /** Prefix with "base " */
  base?: boolean;
}

/**
 * Single source of truth for displaying energy costs.
 *
 * formatCost(3, 'spoon')                    → "3 spoons"
 * formatCost(1, 'spoon')                    → "1 spoon"
 * formatCost(3, 'spoon', { short: true })   → "3"
 * formatCost(3, 'spoon', { base: true })    → "base 3 spoons"
 * formatCost(15, 'battery')                 → "15%"
 * formatCost(15, 'battery', { base: true }) → "base 15%"
 */
export function formatCost(
  cost: number,
  mode: EnergyMode,
  options?: FormatOptions,
): string {
  const prefix = options?.base ? 'base ' : '';

  if (mode === 'battery') {
    return `${prefix}${cost}%`;
  }

  // Spoon mode
  if (options?.short) return `${prefix}${cost}`;
  const unit = cost === 1 ? 'spoon' : 'spoons';
  return `${prefix}${cost} ${unit}`;
}
