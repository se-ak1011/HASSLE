// Hassle — UI string resolver.
//
// locales/en-US.json is the base. locales/en-GB.json holds ONLY the keys whose
// wording/spelling differs (e.g. "judgment" vs "judgement"); everything else
// falls back to en-US. Adding a locale later = one more overrides file.
//
// Two ways to read a string:
//   • translate(region, key)  — pure, region passed explicitly (use in React via useRegion().t)
//   • t(key)                  — uses the app's active region singleton (for services /
//                               non-React code like notifications & exports)

import enUS from '@/locales/en-US.json';
import enGB from '@/locales/en-GB.json';
import { Region, DEFAULT_REGION } from './region';

type StringTable = Record<string, string>;

const BASE = enUS as StringTable;

// GB inherits every US key, then overrides. A missing GB key => US fallback.
const TABLES: Record<Region, StringTable> = {
  US: BASE,
  GB: { ...BASE, ...(enGB as StringTable) },
};

export function translate(
  region: Region,
  key: string,
  vars?: Record<string, string | number>
): string {
  const table = TABLES[region] ?? BASE;
  let out = table[key] ?? BASE[key] ?? key;
  if (vars) {
    for (const k of Object.keys(vars)) {
      out = out.split(`{${k}}`).join(String(vars[k]));
    }
  }
  return out;
}

// ── Active-region singleton (for non-React callers) ──────────────────────────
// The RegionProvider keeps this in sync with the user's choice. Services that
// aren't inside React (notificationService, exportService) read through here.
let activeRegion: Region = DEFAULT_REGION;

export function setActiveRegion(region: Region): void {
  activeRegion = region;
}

export function getActiveRegion(): Region {
  return activeRegion;
}

/** Translate with the app's currently-active region. For use outside React. */
export function t(key: string, vars?: Record<string, string | number>): string {
  return translate(activeRegion, key, vars);
}
