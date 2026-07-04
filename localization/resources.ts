// Hassle — region resources resolver.
//
// resources/<code>.json holds region-specific FACTS (not just wording):
// currency, calendar week-start, healthcare terminology, emergency numbers,
// clinical sources. us.json is the reference shape; every region file mirrors
// it so the whole thing stays strongly typed off `typeof us`.

import us from '@/resources/us.json';
import uk from '@/resources/uk.json';
import { Region } from './region';

export type RegionResources = typeof us;

const RESOURCES: Record<Region, RegionResources> = {
  US: us,
  GB: uk as RegionResources,
};

export function resourcesFor(region: Region): RegionResources {
  return RESOURCES[region] ?? RESOURCES.US;
}

// ── Active-region singleton (for non-React callers) ──────────────────────────
let activeResources: RegionResources = us;

export function setActiveResources(region: Region): void {
  activeResources = resourcesFor(region);
}

export function getActiveResources(): RegionResources {
  return activeResources;
}
