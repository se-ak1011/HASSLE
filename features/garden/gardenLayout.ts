import { GardenAssetId } from './gardenAssets';
import { GardenSeason } from './gardenState';

export const GARDEN_LAYERS = ['structures', 'largeNature', 'water', 'flowersAndGround', 'furniture', 'wildlife', 'birds', 'insects', 'skyAndWeather', 'seasonal', 'lola'] as const;
export type GardenLayer = typeof GARDEN_LAYERS[number];
export type GardenAnchor = 'center' | 'bottomCenter' | 'topLeft';

export type GardenLayoutItem = {
  id: GardenAssetId;
  layer: GardenLayer;
  x: number;
  y: number;
  width: number;
  anchor?: GardenAnchor;
  allowedSeason?: GardenSeason[];
};

export const GARDEN_LAYOUT: Record<GardenAssetId, GardenLayoutItem> = {
  baseGarden: { id: 'baseGarden', layer: 'structures', x: 0, y: 0, width: 1 },
  campfire: { id: 'campfire', layer: 'structures', x: 0.37, y: 0.61, width: 0.13, anchor: 'bottomCenter' },
  fence: { id: 'fence', layer: 'structures', x: 0.67, y: 0.35, width: 0.28, anchor: 'bottomCenter' },
  gardenArchway: { id: 'gardenArchway', layer: 'structures', x: 0.47, y: 0.33, width: 0.2, anchor: 'bottomCenter' },
  gazebo: { id: 'gazebo', layer: 'structures', x: 0.6, y: 0.45, width: 0.24, anchor: 'bottomCenter' },
  greenhouse: { id: 'greenhouse', layer: 'structures', x: 0.7, y: 0.45, width: 0.22, anchor: 'bottomCenter' },
  stoneWall: { id: 'stoneWall', layer: 'structures', x: 0.31, y: 0.38, width: 0.2, anchor: 'bottomCenter' },
  woodenGate: { id: 'woodenGate', layer: 'structures', x: 0.48, y: 0.78, width: 0.16, anchor: 'bottomCenter' },
  woodenSign: { id: 'woodenSign', layer: 'structures', x: 0.78, y: 0.71, width: 0.11, anchor: 'bottomCenter' },
  bush: { id: 'bush', layer: 'largeNature', x: 0.24, y: 0.63, width: 0.12, anchor: 'bottomCenter' },
  cherryBlossom: { id: 'cherryBlossom', layer: 'largeNature', x: 0.74, y: 0.41, width: 0.2, anchor: 'bottomCenter' },
  sapling: { id: 'sapling', layer: 'largeNature', x: 0.83, y: 0.6, width: 0.1, anchor: 'bottomCenter' },
  willowTree: { id: 'willowTree', layer: 'largeNature', x: 0.31, y: 0.5, width: 0.19, anchor: 'bottomCenter' },
  pond: { id: 'pond', layer: 'water', x: 0.66, y: 0.67, width: 0.22, anchor: 'bottomCenter' },
  stream: { id: 'stream', layer: 'water', x: 0.59, y: 0.78, width: 0.28, anchor: 'bottomCenter' },
  lillyPads: { id: 'lillyPads', layer: 'water', x: 0.68, y: 0.64, width: 0.09, anchor: 'bottomCenter' },
  woodenBridge: { id: 'woodenBridge', layer: 'water', x: 0.56, y: 0.68, width: 0.15, anchor: 'bottomCenter' },
  floweringBush: { id: 'floweringBush', layer: 'flowersAndGround', x: 0.22, y: 0.72, width: 0.11, anchor: 'bottomCenter' },
  wildflowerPatch: { id: 'wildflowerPatch', layer: 'flowersAndGround', x: 0.37, y: 0.76, width: 0.13, anchor: 'bottomCenter' },
  sunflowerPatch: { id: 'sunflowerPatch', layer: 'flowersAndGround', x: 0.82, y: 0.72, width: 0.11, anchor: 'bottomCenter' },
  lavenderPot: { id: 'lavenderPot', layer: 'flowersAndGround', x: 0.28, y: 0.79, width: 0.07, anchor: 'bottomCenter' },
  hydrangeaPot: { id: 'hydrangeaPot', layer: 'flowersAndGround', x: 0.72, y: 0.76, width: 0.08, anchor: 'bottomCenter' },
  reeds: { id: 'reeds', layer: 'flowersAndGround', x: 0.76, y: 0.63, width: 0.08, anchor: 'bottomCenter' },
  bench: { id: 'bench', layer: 'furniture', x: 0.48, y: 0.72, width: 0.18, anchor: 'bottomCenter' },
  benchSwing: { id: 'benchSwing', layer: 'furniture', x: 0.3, y: 0.49, width: 0.17, anchor: 'bottomCenter' },
  birdBath: { id: 'birdBath', layer: 'furniture', x: 0.78, y: 0.58, width: 0.09, anchor: 'bottomCenter' },
  hammock: { id: 'hammock', layer: 'furniture', x: 0.38, y: 0.52, width: 0.2, anchor: 'bottomCenter' },
  treeSwing: { id: 'treeSwing', layer: 'furniture', x: 0.18, y: 0.5, width: 0.12, anchor: 'bottomCenter' },
  fox: { id: 'fox', layer: 'wildlife', x: 0.36, y: 0.72, width: 0.1, anchor: 'bottomCenter' },
  squirrel: { id: 'squirrel', layer: 'wildlife', x: 0.2, y: 0.58, width: 0.07, anchor: 'bottomCenter' },
  dog: { id: 'dog', layer: 'wildlife', x: 0.57, y: 0.77, width: 0.1, anchor: 'bottomCenter' },
  cat: { id: 'cat', layer: 'wildlife', x: 0.7, y: 0.75, width: 0.08, anchor: 'bottomCenter' },
  rabbit: { id: 'rabbit', layer: 'wildlife', x: 0.82, y: 0.66, width: 0.07, anchor: 'bottomCenter' },
  hedgehog: { id: 'hedgehog', layer: 'wildlife', x: 0.28, y: 0.78, width: 0.06, anchor: 'bottomCenter' },
  blueTit: { id: 'blueTit', layer: 'birds', x: 0.27, y: 0.39, width: 0.06, anchor: 'bottomCenter' },
  crow: { id: 'crow', layer: 'birds', x: 0.69, y: 0.41, width: 0.07, anchor: 'bottomCenter' },
  blackbird: { id: 'blackbird', layer: 'birds', x: 0.6, y: 0.58, width: 0.06, anchor: 'bottomCenter' },
  owl: { id: 'owl', layer: 'birds', x: 0.2, y: 0.36, width: 0.07, anchor: 'bottomCenter' },
  robin: { id: 'robin', layer: 'birds', x: 0.77, y: 0.5, width: 0.055, anchor: 'bottomCenter' },
  bee: { id: 'bee', layer: 'insects', x: 0.32, y: 0.64, width: 0.04, anchor: 'bottomCenter' },
  butterfly: { id: 'butterfly', layer: 'insects', x: 0.76, y: 0.59, width: 0.05, anchor: 'bottomCenter' },
  ladybird: { id: 'ladybird', layer: 'insects', x: 0.42, y: 0.75, width: 0.035, anchor: 'bottomCenter' },
  snail: { id: 'snail', layer: 'insects', x: 0.6, y: 0.79, width: 0.045, anchor: 'bottomCenter' },
  dragonfly: { id: 'dragonfly', layer: 'insects', x: 0.69, y: 0.59, width: 0.055, anchor: 'bottomCenter' },
  sun: { id: 'sun', layer: 'skyAndWeather', x: 0.82, y: 0.14, width: 0.1, anchor: 'center' },
  moon: { id: 'moon', layer: 'skyAndWeather', x: 0.82, y: 0.14, width: 0.09, anchor: 'center' },
  stars: { id: 'stars', layer: 'skyAndWeather', x: 0.55, y: 0.15, width: 0.42, anchor: 'center' },
  cloud: { id: 'cloud', layer: 'skyAndWeather', x: 0.34, y: 0.15, width: 0.2, anchor: 'center' },
  stormCloud: { id: 'stormCloud', layer: 'skyAndWeather', x: 0.36, y: 0.16, width: 0.22, anchor: 'center' },
  shootingStar: { id: 'shootingStar', layer: 'skyAndWeather', x: 0.48, y: 0.11, width: 0.12, anchor: 'center' },
  sparkle: { id: 'sparkle', layer: 'skyAndWeather', x: 0.67, y: 0.18, width: 0.05, anchor: 'center' },
  cherryBlossomBranch: { id: 'cherryBlossomBranch', layer: 'seasonal', x: 0.21, y: 0.18, width: 0.18, anchor: 'center', allowedSeason: ['summer'] },
  daffodils: { id: 'daffodils', layer: 'seasonal', x: 0.28, y: 0.75, width: 0.08, anchor: 'bottomCenter', allowedSeason: ['summer'] },
  summerWildflowers: { id: 'summerWildflowers', layer: 'seasonal', x: 0.72, y: 0.77, width: 0.12, anchor: 'bottomCenter', allowedSeason: ['summer'] },
  tulips: { id: 'tulips', layer: 'seasonal', x: 0.84, y: 0.68, width: 0.08, anchor: 'bottomCenter', allowedSeason: ['summer'] },
  acornBrown: { id: 'acornBrown', layer: 'seasonal', x: 0.28, y: 0.72, width: 0.04, anchor: 'bottomCenter', allowedSeason: ['autumn'] },
  acornGreen: { id: 'acornGreen', layer: 'seasonal', x: 0.76, y: 0.7, width: 0.04, anchor: 'bottomCenter', allowedSeason: ['autumn'] },
  autumnLeaves: { id: 'autumnLeaves', layer: 'seasonal', x: 0.62, y: 0.74, width: 0.14, anchor: 'bottomCenter', allowedSeason: ['autumn'] },
  birchLeaf: { id: 'birchLeaf', layer: 'seasonal', x: 0.38, y: 0.65, width: 0.05, anchor: 'center', allowedSeason: ['autumn'] },
  mapleLeaf: { id: 'mapleLeaf', layer: 'seasonal', x: 0.31, y: 0.5, width: 0.05, anchor: 'center', allowedSeason: ['autumn'] },
  oakLeaf: { id: 'oakLeaf', layer: 'seasonal', x: 0.7, y: 0.52, width: 0.05, anchor: 'center', allowedSeason: ['autumn'] },
  pumpkinGreen: { id: 'pumpkinGreen', layer: 'seasonal', x: 0.82, y: 0.76, width: 0.07, anchor: 'bottomCenter', allowedSeason: ['autumn'] },
  pumpkinOrange: { id: 'pumpkinOrange', layer: 'seasonal', x: 0.22, y: 0.78, width: 0.08, anchor: 'bottomCenter', allowedSeason: ['autumn'] },
  pumpkinWhite: { id: 'pumpkinWhite', layer: 'seasonal', x: 0.67, y: 0.78, width: 0.07, anchor: 'bottomCenter', allowedSeason: ['autumn'] },
  yellowLeaf: { id: 'yellowLeaf', layer: 'seasonal', x: 0.78, y: 0.45, width: 0.05, anchor: 'center', allowedSeason: ['autumn'] },
  christmasLights: { id: 'christmasLights', layer: 'seasonal', x: 0.42, y: 0.3, width: 0.24, anchor: 'center', allowedSeason: ['winter'] },
  icicles: { id: 'icicles', layer: 'seasonal', x: 0.44, y: 0.24, width: 0.16, anchor: 'center', allowedSeason: ['winter'] },
  snowflake: { id: 'snowflake', layer: 'seasonal', x: 0.75, y: 0.24, width: 0.05, anchor: 'center', allowedSeason: ['winter'] },
  snowman: { id: 'snowman', layer: 'seasonal', x: 0.72, y: 0.72, width: 0.11, anchor: 'bottomCenter', allowedSeason: ['winter'] },
  lolaBuildSnowman: { id: 'lolaBuildSnowman', layer: 'lola', x: 0.58, y: 0.72, width: 0.12, anchor: 'bottomCenter' },
  lolaHoldingPumpkin: { id: 'lolaHoldingPumpkin', layer: 'lola', x: 0.31, y: 0.68, width: 0.12, anchor: 'bottomCenter' },
  lolaHoldingUmbrella: { id: 'lolaHoldingUmbrella', layer: 'lola', x: 0.42, y: 0.64, width: 0.13, anchor: 'bottomCenter' },
  lolaJournaling: { id: 'lolaJournaling', layer: 'lola', x: 0.48, y: 0.72, width: 0.12, anchor: 'bottomCenter' },
  lolaReadingBook: { id: 'lolaReadingBook', layer: 'lola', x: 0.36, y: 0.58, width: 0.12, anchor: 'bottomCenter' },
  lolaListeningToMusic: { id: 'lolaListeningToMusic', layer: 'lola', x: 0.5, y: 0.72, width: 0.12, anchor: 'bottomCenter' },
  lolaWateringFlowers: { id: 'lolaWateringFlowers', layer: 'lola', x: 0.3, y: 0.73, width: 0.13, anchor: 'bottomCenter' },
  lolaStargazing: { id: 'lolaStargazing', layer: 'lola', x: 0.58, y: 0.73, width: 0.13, anchor: 'bottomCenter' },
  lolaWrappedInBlanket: { id: 'lolaWrappedInBlanket', layer: 'lola', x: 0.37, y: 0.59, width: 0.12, anchor: 'bottomCenter' },
};
