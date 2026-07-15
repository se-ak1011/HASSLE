// The placement engine — turns a set of visible asset ids into concrete,
// deterministic, collision-free positions in the normalised world.
//
// Guarantees:
//   • Deterministic. The same asset always lands in the same place — no
//     reshuffling on re-render, relaunch, resize or orientation change. Each
//     asset seeds its own RNG from its id, and assets are always processed in a
//     fixed canonical order, so adding a new discovery never moves existing ones.
//   • Constrained. Scattered assets can only appear inside a compatible zone and
//     never inside an exclusion, over a fixed asset, or over Lola. Fixed assets
//     always sit in their hand-mapped slot.
//   • Honest. If no valid position exists for a scattered asset, it is simply
//     not placed (rather than forced into an overlap).

import { GardenAssetId } from './gardenAssets';
import {
  ANCHOR,
  ASSET_META,
  Anchor,
  CATEGORY_RULES,
  EXCLUSIONS,
  FIXED_CATEGORIES,
  FIXED_SLOTS,
  GardenCategory,
  GardenLayer,
  HIDDEN_CATEGORIES,
  LAYER,
  LOLA_DEFAULT_SLOT,
  Rect,
  ZONES,
  layerFor,
} from './gardenLayout';

export type PlacedAsset = {
  id: GardenAssetId;
  x: number; // ground-contact point, normalised
  y: number;
  width: number; // normalised width
  anchor: Anchor;
  layer: GardenLayer;
  z: number; // final render order (layer, tie-broken by y)
};

// ── Deterministic RNG (mulberry32 over an FNV-1a hash of the seed) ───────────
function hashSeed(seed: string): number {
  let value = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    value ^= seed.charCodeAt(i);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function makeRng(seed: string): () => number {
  let a = hashSeed(seed);
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Geometry ────────────────────────────────────────────────────────────────
// A scattered asset is treated as a square of side `width` anchored at (x, y).
function boxFor(x: number, y: number, width: number, anchor: Anchor): Rect {
  const w = width;
  const h = width; // square approximation is plenty for spacing/overlap
  return {
    xMin: x - anchor.x * w,
    xMax: x - anchor.x * w + w,
    yMin: y - anchor.y * h,
    yMax: y - anchor.y * h + h,
  };
}

function rectsOverlap(a: Rect, b: Rect, pad = 0): boolean {
  return a.xMin - pad < b.xMax && a.xMax + pad > b.xMin && a.yMin - pad < b.yMax && a.yMax + pad > b.yMin;
}

function pointInRect(x: number, y: number, r: Rect): boolean {
  return x >= r.xMin && x <= r.xMax && y >= r.yMin && y <= r.yMax;
}

// ── Canonical processing order ──────────────────────────────────────────────
// Fixed structures claim their space first; scattered life fills in after; Lola
// last (so she always sits on top). Order is independent of which assets happen
// to be visible, which is what keeps placement stable as discoveries are added.
const CATEGORY_PRIORITY: Record<GardenCategory, number> = {
  structure: 0,
  largeNature: 1,
  water: 2,
  furniture: 3,
  seasonalAttach: 4,
  flowers: 5,
  smallPlants: 5,
  seasonalGround: 6,
  fallingLeaf: 7,
  wildlife: 8,
  birds: 9,
  insects: 10,
  sky: 98,
  lola: 99,
};

function canonicalOrder(ids: GardenAssetId[]): GardenAssetId[] {
  return [...ids].sort((a, b) => {
    const pa = CATEGORY_PRIORITY[ASSET_META[a].category];
    const pb = CATEGORY_PRIORITY[ASSET_META[b].category];
    if (pa !== pb) return pa - pb;
    return hashSeed(a) - hashSeed(b); // stable tie-break
  });
}

function zForLayer(layer: GardenLayer): number {
  return LAYER[layer];
}

function widthFor(id: GardenAssetId): number {
  const meta = ASSET_META[id];
  if (meta.width) return meta.width;
  const rule = CATEGORY_RULES[meta.category];
  return rule ? rule.width : 0.1;
}

function anchorFor(id: GardenAssetId): Anchor {
  const meta = ASSET_META[id];
  if (meta.anchor) return meta.anchor;
  const rule = CATEGORY_RULES[meta.category];
  return rule ? rule.anchor : ANCHOR.bottomCenter;
}

// Try to find a collision-free spot inside a compatible zone.
const MAX_ATTEMPTS = 28;
function placeScattered(
  id: GardenAssetId,
  occupied: Rect[]
): { x: number; y: number } | null {
  const meta = ASSET_META[id];
  const rule = CATEGORY_RULES[meta.category];
  const zones = ZONES.filter(z => z.categories.includes(meta.category));
  if (!zones.length) return null;

  const width = widthFor(id);
  const anchor = anchorFor(id);
  const minSpacing = rule ? rule.minSpacing : 0.05;
  const rng = makeRng(`place:${id}`);

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const zone = zones[Math.floor(rng() * zones.length) % zones.length];
    const x = zone.rect.xMin + rng() * (zone.rect.xMax - zone.rect.xMin);
    const y = zone.rect.yMin + rng() * (zone.rect.yMax - zone.rect.yMin);
    const box = boxFor(x, y, width, anchor);

    // Reject if the box would crop off the canvas.
    if (box.xMin < 0.01 || box.xMax > 0.99 || box.yMin < 0.01 || box.yMax > 0.99) continue;
    // Reject exclusions.
    if (EXCLUSIONS.some(ex => rectsOverlap(box, ex.rect))) continue;
    // Reject overlap with anything already placed, with spacing.
    if (occupied.some(o => rectsOverlap(box, o, minSpacing))) continue;

    return { x, y };
  }
  return null; // no room — leave it for another day
}

export type ResolveOptions = {
  // Assets the placement engine should skip entirely (e.g. never render sky).
  hiddenIds?: GardenAssetId[];
  // User rearrangements — a per-asset {x,y} that overrides the computed position
  // (the coordinate system still decides everything else, incl. which assets
  // appear and their size/layer). Applied after placement so the defaults always
  // stand when there is no override.
  overrides?: Partial<Record<GardenAssetId, { x: number; y: number }>>;
};

/**
 * Resolve every visible asset into a concrete placement. Fixed assets go to
 * their slot; scattered assets get a deterministic, collision-free spot; hidden
 * categories are dropped. Result is sorted for rendering: by layer, then by y
 * (lower in the garden draws in front).
 */
export function resolvePlacements(visibleIds: GardenAssetId[], options: ResolveOptions = {}): PlacedAsset[] {
  const hidden = new Set(options.hiddenIds ?? []);
  const order = canonicalOrder(visibleIds);
  const occupied: Rect[] = [];
  const placed: PlacedAsset[] = [];

  for (const id of order) {
    const meta = ASSET_META[id];
    if (hidden.has(id)) continue;
    if (HIDDEN_CATEGORIES.includes(meta.category)) continue;

    const layer = layerFor(id);

    // A hand-mapped slot always wins — this covers structures, furniture, water,
    // seasonal fixtures (e.g. the snowman) and every Lola pose. Lola falls back
    // to her default slot beside the shed if her pose has no dedicated one.
    const slot = FIXED_SLOTS[id] ?? (meta.category === 'lola' ? LOLA_DEFAULT_SLOT : undefined);
    if (slot) {
      const width = meta.width ?? slot.width;
      occupied.push(boxFor(slot.x, slot.y, width, slot.anchor));
      placed.push({ id, x: slot.x, y: slot.y, width, anchor: slot.anchor, layer, z: zForLayer(layer) });
      continue;
    }

    // Fixed-category assets that have no slot are simply not shown (never forced
    // into a random position).
    if (FIXED_CATEGORIES.includes(meta.category)) continue;

    // Scattered.
    const spot = placeScattered(id, occupied);
    if (!spot) continue;
    const width = widthFor(id);
    const anchor = anchorFor(id);
    occupied.push(boxFor(spot.x, spot.y, width, anchor));
    placed.push({ id, x: spot.x, y: spot.y, width, anchor, layer, z: zForLayer(layer) });
  }

  // Apply user rearrangements last, so defaults always stand without them.
  const overrides = options.overrides;
  const finalPlaced = overrides
    ? placed.map(p => {
        const o = overrides[p.id];
        return o ? { ...p, x: o.x, y: o.y } : p;
      })
    : placed;

  // Final render order: layer first, then y (lower in the garden = in front).
  return finalPlaced.sort((a, b) => (a.z !== b.z ? a.z - b.z : a.y - b.y));
}

// Helpers shared with the debug editor.
export { boxFor, pointInRect, rectsOverlap };
