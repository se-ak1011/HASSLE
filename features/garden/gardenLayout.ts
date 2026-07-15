// Lola's Garden — the single source of truth for WHERE everything lives.
//
// This is a *world-coordinate system*, not a pile of stickers on a picture.
// The base garden illustration (assets/base/Base_garden.png, 1536×1024) is one
// permanent canvas. Every overlay is positioned in NORMALISED coordinates —
// x and y each run 0→1 as a proportion of that canvas — so the whole scene
// scales, letterboxes and pans as one coherent place on any screen.
//
// Three placement types:
//   • FIXED_SLOTS   — location-specific things (Lola, gazebo, pond…) that must
//                     always sit in one hand-mapped spot.
//   • ZONES         — planting/roaming areas where small repeatable things
//                     (flowers, wildlife, insects, leaves) may be scattered.
//   • EXCLUSIONS    — regions no scattered asset may enter (shed, path, fence,
//                     gate, welcome sign, trees, edges).
//
// Coordinates are hand-estimated from the illustration and meant to be
// fine-tuned with the in-app Garden Coordinate Editor (dev only). Nothing here
// uses device pixels.

import { GardenAssetId } from './gardenAssets';

// ── World canvas ────────────────────────────────────────────────────────────
export const ORIGINAL_WIDTH = 1536;
export const ORIGINAL_HEIGHT = 1024;
export const GARDEN_ASPECT_RATIO = ORIGINAL_WIDTH / ORIGINAL_HEIGHT; // 1.5 (3:2)

// ── Layers / depth ──────────────────────────────────────────────────────────
// Numeric z-order. Render order is (layer, then y): within a layer, whatever is
// lower in the garden (higher y) draws in front, so nothing small ever covers
// Lola or a structure.
export const LAYER = {
  background: 0,
  largeNature: 8, // trees, big bushes — the backdrop
  water: 12, // pond, stream, bridge (on the ground)
  groundPlants: 16,
  flowers: 20,
  seasonalGround: 22, // pumpkins, leaves, blossom on the ground
  structures: 30, // gazebo, greenhouse, fence, arch, wall, sign, campfire
  furniture: 34, // bench, hammock, bird bath…
  lolaAndAnimals: 40, // Lola + wildlife share this plane
  birdsAndInsects: 50,
  seasonalAttach: 55, // lights / icicles that sit over a structure
  foreground: 60,
  ui: 70,
} as const;
export type GardenLayer = keyof typeof LAYER;

// ── Anchors ─────────────────────────────────────────────────────────────────
// An anchor is where, within the asset's own box, the coordinate "grabs" it.
// bottomCenter → the point where the object touches the ground.
export type Anchor = { x: number; y: number };
export const ANCHOR = {
  bottomCenter: { x: 0.5, y: 1 } as Anchor,
  center: { x: 0.5, y: 0.5 } as Anchor,
  topCenter: { x: 0.5, y: 0 } as Anchor,
  topLeft: { x: 0, y: 0 } as Anchor,
};

export type NormPoint = { x: number; y: number };
export type Rect = { xMin: number; xMax: number; yMin: number; yMax: number };

// ── Categories ──────────────────────────────────────────────────────────────
export type GardenCategory =
  | 'structure'
  | 'largeNature'
  | 'water'
  | 'furniture'
  | 'flowers'
  | 'smallPlants'
  | 'wildlife'
  | 'birds'
  | 'insects'
  | 'seasonalGround'
  | 'seasonalAttach'
  | 'fallingLeaf'
  | 'sky'
  | 'lola';

// Which placement engine handles a category.
export const FIXED_CATEGORIES: GardenCategory[] = [
  'structure',
  'largeNature',
  'water',
  'furniture',
  'seasonalAttach',
  'lola',
];
// Categories that never render (kept for data-model completeness — the base has
// no sky, so we do not drop sun/moon/cloud onto the ground).
export const HIDDEN_CATEGORIES: GardenCategory[] = ['sky'];

// Defaults for scattered (zone-placed) categories. Per-asset overrides live in
// ASSET_META. Sizes and spacing are normalised (fractions of canvas width).
type CategoryRule = { width: number; layer: GardenLayer; anchor: Anchor; minSpacing: number };
export const CATEGORY_RULES: Partial<Record<GardenCategory, CategoryRule>> = {
  flowers: { width: 0.07, layer: 'flowers', anchor: ANCHOR.bottomCenter, minSpacing: 0.05 },
  smallPlants: { width: 0.08, layer: 'groundPlants', anchor: ANCHOR.bottomCenter, minSpacing: 0.055 },
  wildlife: { width: 0.08, layer: 'lolaAndAnimals', anchor: ANCHOR.bottomCenter, minSpacing: 0.08 },
  birds: { width: 0.06, layer: 'birdsAndInsects', anchor: ANCHOR.bottomCenter, minSpacing: 0.05 },
  insects: { width: 0.045, layer: 'birdsAndInsects', anchor: ANCHOR.bottomCenter, minSpacing: 0.045 },
  seasonalGround: { width: 0.08, layer: 'seasonalGround', anchor: ANCHOR.bottomCenter, minSpacing: 0.05 },
  fallingLeaf: { width: 0.05, layer: 'seasonalGround', anchor: ANCHOR.bottomCenter, minSpacing: 0.035 },
};

// ── Fixed slots ─────────────────────────────────────────────────────────────
// Location-specific assets. Keyed by asset id; the comment names the "slot".
// (x, y) is the ground-contact point in normalised world coords.
export type FixedSlot = { x: number; y: number; width: number; anchor: Anchor };

export const FIXED_SLOTS: Partial<Record<GardenAssetId, FixedSlot>> = {
  // Structures — placed in the open meadow / edges, clear of the base artwork.
  gazebo: { x: 0.57, y: 0.64, width: 0.19, anchor: ANCHOR.bottomCenter },
  greenhouse: { x: 0.73, y: 0.72, width: 0.18, anchor: ANCHOR.bottomCenter },
  campfire: { x: 0.45, y: 0.7, width: 0.11, anchor: ANCHOR.bottomCenter },
  gardenArchway: { x: 0.36, y: 0.6, width: 0.15, anchor: ANCHOR.bottomCenter }, // where the path enters the meadow
  stoneWall: { x: 0.13, y: 0.6, width: 0.16, anchor: ANCHOR.bottomCenter }, // left edge
  fence: { x: 0.9, y: 0.64, width: 0.15, anchor: ANCHOR.bottomCenter }, // extra fence run, right edge
  woodenGate: { x: 0.5, y: 0.52, width: 0.1, anchor: ANCHOR.bottomCenter }, // a back gate in the hedge
  woodenSign: { x: 0.63, y: 0.76, width: 0.09, anchor: ANCHOR.bottomCenter },

  // Large nature.
  willowTree: { x: 0.3, y: 0.5, width: 0.16, anchor: ANCHOR.bottomCenter },
  cherryBlossom: { x: 0.66, y: 0.46, width: 0.16, anchor: ANCHOR.bottomCenter },
  sapling: { x: 0.47, y: 0.52, width: 0.1, anchor: ANCHOR.bottomCenter },
  bush: { x: 0.53, y: 0.52, width: 0.1, anchor: ANCHOR.bottomCenter },

  // Water cluster — bottom-centre of the meadow.
  stream: { x: 0.44, y: 0.9, width: 0.22, anchor: ANCHOR.bottomCenter },
  woodenBridge: { x: 0.44, y: 0.885, width: 0.15, anchor: ANCHOR.bottomCenter },
  pond: { x: 0.6, y: 0.89, width: 0.22, anchor: ANCHOR.bottomCenter },
  lillyPads: { x: 0.6, y: 0.865, width: 0.09, anchor: ANCHOR.center },
  reeds: { x: 0.7, y: 0.885, width: 0.08, anchor: ANCHOR.bottomCenter },

  // Furniture.
  bench: { x: 0.52, y: 0.58, width: 0.15, anchor: ANCHOR.bottomCenter },
  benchSwing: { x: 0.22, y: 0.58, width: 0.14, anchor: ANCHOR.bottomCenter },
  birdBath: { x: 0.71, y: 0.56, width: 0.09, anchor: ANCHOR.bottomCenter },
  hammock: { x: 0.6, y: 0.55, width: 0.17, anchor: ANCHOR.bottomCenter },
  treeSwing: { x: 0.16, y: 0.44, width: 0.11, anchor: ANCHOR.bottomCenter }, // hangs from the big tree

  // Seasonal fixtures.
  snowman: { x: 0.66, y: 0.7, width: 0.11, anchor: ANCHOR.bottomCenter },
  christmasLights: { x: 0.87, y: 0.2, width: 0.18, anchor: ANCHOR.center }, // along the shed roof
  icicles: { x: 0.87, y: 0.31, width: 0.14, anchor: ANCHOR.center }, // shed eave
  cherryBlossomBranch: { x: 0.2, y: 0.22, width: 0.2, anchor: ANCHOR.center }, // over the big tree

  // Lola — always beside the shed by default; context poses get their own slot.
  // (All Lola poses fall back to LOLA_DEFAULT_SLOT in gardenPlacement.)
  lolaStargazing: { x: 0.5, y: 0.74, width: 0.14, anchor: ANCHOR.bottomCenter },
  lolaLyingOnGrass: { x: 0.52, y: 0.76, width: 0.17, anchor: ANCHOR.bottomCenter },
  lolaWateringFlowers: { x: 0.24, y: 0.7, width: 0.14, anchor: ANCHOR.bottomCenter },
  lolaBuildSnowman: { x: 0.59, y: 0.71, width: 0.14, anchor: ANCHOR.bottomCenter }, // beside the snowman
  lolaHoldingPumpkin: { x: 0.46, y: 0.72, width: 0.14, anchor: ANCHOR.bottomCenter },
};

// Lola's home: on the grass just in front-left of the shed — beside it, never in
// the centre of the meadow. Any pose without its own slot uses this.
export const LOLA_DEFAULT_SLOT: FixedSlot = { x: 0.71, y: 0.6, width: 0.13, anchor: ANCHOR.bottomCenter };

// ── Zones ───────────────────────────────────────────────────────────────────
// Rectangular planting / roaming areas. A scattered asset may only land inside a
// zone whose categories include its own.
export type Zone = { id: string; rect: Rect; categories: GardenCategory[] };

export const ZONES: Zone[] = [
  {
    id: 'flowers_front_left',
    rect: { xMin: 0.06, xMax: 0.2, yMin: 0.58, yMax: 0.76 },
    categories: ['flowers', 'smallPlants', 'seasonalGround', 'fallingLeaf'],
  },
  {
    id: 'flowers_shed_edge',
    rect: { xMin: 0.8, xMax: 0.95, yMin: 0.52, yMax: 0.66 },
    categories: ['flowers', 'smallPlants', 'seasonalGround', 'fallingLeaf'],
  },
  {
    id: 'meadow_left',
    rect: { xMin: 0.44, xMax: 0.56, yMin: 0.54, yMax: 0.76 },
    categories: ['flowers', 'smallPlants', 'wildlife', 'insects', 'seasonalGround', 'fallingLeaf'],
  },
  {
    id: 'meadow_center',
    rect: { xMin: 0.42, xMax: 0.64, yMin: 0.6, yMax: 0.82 },
    categories: ['flowers', 'smallPlants', 'wildlife', 'insects', 'seasonalGround', 'fallingLeaf'],
  },
  {
    id: 'meadow_right',
    rect: { xMin: 0.62, xMax: 0.78, yMin: 0.58, yMax: 0.8 },
    categories: ['flowers', 'smallPlants', 'wildlife', 'insects', 'seasonalGround', 'fallingLeaf'],
  },
  {
    id: 'pond_edge',
    rect: { xMin: 0.5, xMax: 0.74, yMin: 0.78, yMax: 0.9 },
    categories: ['wildlife', 'insects', 'smallPlants'],
  },
  {
    id: 'air_low',
    rect: { xMin: 0.3, xMax: 0.74, yMin: 0.46, yMax: 0.62 },
    categories: ['insects'],
  },
  {
    id: 'perch_big_tree',
    rect: { xMin: 0.12, xMax: 0.3, yMin: 0.28, yMax: 0.42 },
    categories: ['birds'],
  },
  {
    id: 'perch_sapling',
    rect: { xMin: 0.54, xMax: 0.64, yMin: 0.16, yMax: 0.32 },
    categories: ['birds'],
  },
  {
    id: 'perch_ground',
    rect: { xMin: 0.46, xMax: 0.72, yMin: 0.6, yMax: 0.78 },
    categories: ['birds'],
  },
];

// ── Exclusions ──────────────────────────────────────────────────────────────
// No scattered asset may intersect these. (Fixed slots are hand-placed and are
// intentionally allowed to sit where they belong.)
export type NamedRect = { id: string; rect: Rect };
export const EXCLUSIONS: NamedRect[] = [
  { id: 'shed', rect: { xMin: 0.74, xMax: 1.0, yMin: 0.12, yMax: 0.5 } },
  { id: 'big_tree', rect: { xMin: 0.02, xMax: 0.34, yMin: 0.0, yMax: 0.46 } },
  { id: 'sapling', rect: { xMin: 0.5, xMax: 0.66, yMin: 0.06, yMax: 0.36 } },
  { id: 'path_lower', rect: { xMin: 0.22, xMax: 0.4, yMin: 0.72, yMax: 0.94 } },
  { id: 'path_upper', rect: { xMin: 0.28, xMax: 0.44, yMin: 0.5, yMax: 0.74 } },
  { id: 'fence_gate', rect: { xMin: 0.0, xMax: 0.36, yMin: 0.62, yMax: 0.94 } },
  { id: 'welcome_sign', rect: { xMin: 0.32, xMax: 0.46, yMin: 0.72, yMax: 0.9 } },
  { id: 'lavender_bush', rect: { xMin: 0.88, xMax: 1.0, yMin: 0.38, yMax: 0.56 } },
];

// ── Per-asset metadata ──────────────────────────────────────────────────────
// Category + optional overrides. Every asset id (except baseGarden and the
// hidden sky assets that we keep only for the data model) appears here.
export type AssetMeta = {
  category: GardenCategory;
  width?: number; // override CATEGORY_RULES / FIXED_SLOTS width
  layer?: GardenLayer; // override category layer
  anchor?: Anchor;
};

export const ASSET_META: Record<GardenAssetId, AssetMeta> = {
  baseGarden: { category: 'structure', layer: 'background' },

  // Structures.
  campfire: { category: 'structure' },
  fence: { category: 'structure' },
  gardenArchway: { category: 'structure' },
  gazebo: { category: 'structure' },
  greenhouse: { category: 'structure' },
  stoneWall: { category: 'structure' },
  woodenGate: { category: 'structure' },
  woodenSign: { category: 'structure' },

  // Large nature.
  bush: { category: 'largeNature' },
  cherryBlossom: { category: 'largeNature' },
  sapling: { category: 'largeNature' },
  willowTree: { category: 'largeNature' },

  // Water.
  pond: { category: 'water' },
  stream: { category: 'water' },
  lillyPads: { category: 'water' },
  woodenBridge: { category: 'water' },

  // Flowers & potted plants (scattered / potted).
  floweringBush: { category: 'smallPlants', width: 0.11 },
  wildflowerPatch: { category: 'flowers', width: 0.12 },
  sunflowerPatch: { category: 'flowers', width: 0.11 },
  lavenderPot: { category: 'smallPlants', width: 0.07 },
  hydrangeaPot: { category: 'smallPlants', width: 0.08 },
  reeds: { category: 'water' },

  // Furniture.
  bench: { category: 'furniture' },
  benchSwing: { category: 'furniture' },
  birdBath: { category: 'furniture' },
  hammock: { category: 'furniture' },
  treeSwing: { category: 'furniture' },

  // Wildlife.
  fox: { category: 'wildlife' },
  squirrel: { category: 'wildlife', width: 0.06 },
  dog: { category: 'wildlife' },
  cat: { category: 'wildlife', width: 0.07 },
  rabbit: { category: 'wildlife', width: 0.06 },
  hedgehog: { category: 'wildlife', width: 0.06 },

  // Birds.
  blueTit: { category: 'birds', width: 0.05 },
  crow: { category: 'birds' },
  blackbird: { category: 'birds', width: 0.055 },
  owl: { category: 'birds' },
  robin: { category: 'birds', width: 0.05 },

  // Insects.
  bee: { category: 'insects', width: 0.035 },
  butterfly: { category: 'insects' },
  ladybird: { category: 'insects', width: 0.03 },
  snail: { category: 'insects', width: 0.045 },
  dragonfly: { category: 'insects', width: 0.055 },

  // Sky — hidden (no sky in the base; never rendered as ground objects).
  sun: { category: 'sky' },
  moon: { category: 'sky' },
  stars: { category: 'sky' },
  cloud: { category: 'sky' },
  stormCloud: { category: 'sky' },
  shootingStar: { category: 'sky' },
  sparkle: { category: 'sky' },

  // Seasonal — summer.
  cherryBlossomBranch: { category: 'seasonalAttach' },
  daffodils: { category: 'seasonalGround', width: 0.07 },
  summerWildflowers: { category: 'flowers', width: 0.1 },
  tulips: { category: 'seasonalGround', width: 0.07 },

  // Seasonal — autumn.
  acornBrown: { category: 'seasonalGround', width: 0.035 },
  acornGreen: { category: 'seasonalGround', width: 0.035 },
  autumnLeaves: { category: 'seasonalGround', width: 0.13 },
  birchLeaf: { category: 'fallingLeaf' },
  mapleLeaf: { category: 'fallingLeaf' },
  oakLeaf: { category: 'fallingLeaf' },
  yellowLeaf: { category: 'fallingLeaf' },
  pumpkinGreen: { category: 'seasonalGround', width: 0.07 },
  pumpkinOrange: { category: 'seasonalGround', width: 0.08 },
  pumpkinWhite: { category: 'seasonalGround', width: 0.07 },

  // Seasonal — winter.
  christmasLights: { category: 'seasonalAttach' },
  icicles: { category: 'seasonalAttach' },
  snowflake: { category: 'seasonalGround', width: 0.04 },
  snowman: { category: 'seasonalGround' },

  // Lola.
  lolaBuildSnowman: { category: 'lola' },
  lolaHoldingPumpkin: { category: 'lola' },
  lolaHoldingUmbrella: { category: 'lola' },
  lolaJournaling: { category: 'lola' },
  lolaReadingBook: { category: 'lola' },
  lolaListeningToMusic: { category: 'lola' },
  lolaWateringFlowers: { category: 'lola' },
  lolaStargazing: { category: 'lola' },
  lolaWrappedInBlanket: { category: 'lola' },
  lolaDrinkingCoffee: { category: 'lola' },
  lolaPettingFox: { category: 'lola' },
  lolaHoldingRobin: { category: 'lola' },
  lolaLyingOnGrass: { category: 'lola' },
};

export function layerFor(id: GardenAssetId): GardenLayer {
  const meta = ASSET_META[id];
  if (meta.layer) return meta.layer;
  const rule = CATEGORY_RULES[meta.category];
  if (rule) return rule.layer;
  // Fixed categories map to a sensible plane.
  switch (meta.category) {
    case 'structure':
      return 'structures';
    case 'furniture':
      return 'furniture';
    case 'largeNature':
      return 'largeNature';
    case 'water':
      return 'water';
    case 'seasonalAttach':
      return 'seasonalAttach';
    case 'lola':
      return 'lolaAndAnimals';
    default:
      return 'flowers';
  }
}
