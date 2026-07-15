import { GardenAssetId } from './gardenAssets';
import { GARDEN_LAYOUT, GARDEN_LAYERS } from './gardenLayout';
import { GardenActivity, GardenState } from './gardenState';

export const PERMANENT_UNLOCK_IDS: GardenAssetId[] = [
  'campfire', 'fence', 'gardenArchway', 'gazebo', 'greenhouse', 'stoneWall', 'woodenGate', 'woodenSign',
  'bush', 'cherryBlossom', 'sapling', 'willowTree',
  'pond', 'stream', 'lillyPads', 'woodenBridge',
  'floweringBush', 'wildflowerPatch', 'sunflowerPatch', 'lavenderPot', 'hydrangeaPot', 'reeds',
  'bench', 'benchSwing', 'birdBath', 'hammock', 'treeSwing',
];

const WILDLIFE: GardenAssetId[] = ['fox', 'squirrel', 'dog', 'cat', 'rabbit', 'hedgehog'];
const BIRDS: GardenAssetId[] = ['blueTit', 'crow', 'blackbird', 'owl', 'robin'];
const INSECTS: GardenAssetId[] = ['bee', 'butterfly', 'ladybird', 'snail', 'dragonfly'];

const SUMMER: GardenAssetId[] = ['cherryBlossomBranch', 'daffodils', 'summerWildflowers', 'tulips'];
const AUTUMN: GardenAssetId[] = ['acornBrown', 'acornGreen', 'autumnLeaves', 'birchLeaf', 'mapleLeaf', 'oakLeaf', 'pumpkinGreen', 'pumpkinOrange', 'pumpkinWhite', 'yellowLeaf'];
const WINTER: GardenAssetId[] = ['christmasLights', 'icicles', 'snowflake', 'snowman'];

function hash(seed: string) {
  let value = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    value ^= seed.charCodeAt(i);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function pickStable(ids: GardenAssetId[], seed: string, max: number) {
  const shuffled = [...ids].sort((a, b) => hash(`${seed}:${a}`) - hash(`${seed}:${b}`));
  const count = hash(`${seed}:count`) % (max + 1);
  return shuffled.slice(0, count);
}

export function todaySeed(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function calculateDailyVisitors(state: GardenState, seed = todaySeed()): GardenAssetId[] {
  const birds = BIRDS.filter(id => id !== 'owl' || state.timeOfDay === 'night');
  const insects = INSECTS.filter(id => {
    if (state.weather === 'rain') return id !== 'bee' && id !== 'butterfly';
    return id !== 'snail';
  });
  return [
    ...pickStable(WILDLIFE, `${seed}:wildlife`, 2),
    ...pickStable(birds, `${seed}:birds`, 2),
    ...pickStable(insects, `${seed}:insects`, 2),
  ];
}

function isVisuallyQuietDefault(state: GardenState) {
  return state.unlockedAssetIds.length === 0
    && state.dailyVisitorIds.length === 0
    && !state.recentActivity
    && state.season === 'spring'
    && state.weather === 'clear'
    && state.timeOfDay === 'day';
}

export function getSkyAssetIds(state: GardenState): GardenAssetId[] {
  if (isVisuallyQuietDefault(state)) return [];
  if (state.weather === 'rain') return state.timeOfDay === 'night' ? ['moon', 'stars', 'stormCloud'] : ['stormCloud'];
  if (state.timeOfDay === 'night') return hash(`${todaySeed()}:night`) % 8 === 0 ? ['moon', 'stars', 'shootingStar'] : ['moon', 'stars'];
  if (state.weather === 'cloudy') return ['cloud'];
  return ['sun'];
}

export function getSeasonalAssetIds(state: GardenState): GardenAssetId[] {
  if (state.season === 'summer') return SUMMER;
  if (state.season === 'autumn') return AUTUMN;
  if (state.season === 'winter') return WINTER;
  return [];
}

const ACTIVITY_LOLA: Partial<Record<GardenActivity, GardenAssetId>> = {
  journaling: 'lolaJournaling',
  reading: 'lolaReadingBook',
  music: 'lolaListeningToMusic',
  gardening: 'lolaWateringFlowers',
  comfort: 'lolaWrappedInBlanket',
};

// One Lola, chosen to fit the moment — season, then weather, then what the user
// has been doing, then who's visiting, then the time of day. Comforting, never
// random. Every pose here maps to a real asset.
export function getLolaAssetId(state: GardenState): GardenAssetId {
  if (state.season === 'winter') return 'lolaBuildSnowman';
  if (state.weather === 'rain') return 'lolaHoldingUmbrella';
  if (state.recentActivity && ACTIVITY_LOLA[state.recentActivity]) return ACTIVITY_LOLA[state.recentActivity] ?? 'lolaReadingBook';
  if (state.season === 'autumn') return 'lolaHoldingPumpkin';
  if (state.dailyVisitorIds.includes('fox')) return 'lolaPettingFox';
  if (state.dailyVisitorIds.includes('robin')) return 'lolaHoldingRobin';
  if (state.partOfDay === 'morning') return 'lolaDrinkingCoffee';
  if (state.timeOfDay === 'night') return 'lolaStargazing';
  if (state.season === 'summer' && state.weather === 'clear') return 'lolaLyingOnGrass';
  return 'lolaReadingBook';
}

export function getVisibleOverlayIds(state: GardenState): GardenAssetId[] {
  const ids = [
    ...state.unlockedAssetIds,
    ...state.dailyVisitorIds,
    ...getSkyAssetIds(state),
    ...getSeasonalAssetIds(state),
    getLolaAssetId(state),
  ];
  return Array.from(new Set(ids)).sort((a, b) => GARDEN_LAYERS.indexOf(GARDEN_LAYOUT[a].layer) - GARDEN_LAYERS.indexOf(GARDEN_LAYOUT[b].layer));
}
