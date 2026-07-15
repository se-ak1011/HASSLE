// Lola's whisper — an occasional soft line inside the garden.
//
// Never a number, never a streak, never a push notification. Just a gentle,
// contextual note in Lola's voice: about something newly discovered, a visitor,
// the season, or simply that she's glad you're here. Deterministic per day so it
// doesn't flit about between renders.

import { GardenAssetId } from './gardenAssets';
import { GardenSeason, GardenWeather } from './gardenState';
import { PartOfDay } from './gardenEnvironment';

const DISCOVERY_LINES: Partial<Record<GardenAssetId, string>> = {
  wildflowerPatch: 'Some wildflowers came up by the path.',
  floweringBush: 'The bush is flowering now.',
  lavenderPot: "The lavender's come in — it smells lovely.",
  hydrangeaPot: 'A hydrangea settled in nicely.',
  reeds: 'Reeds are growing by the water.',
  sunflowerPatch: 'The sunflowers turned up to face the light.',
  birdBath: "There's a bird bath now — the birds found it fast.",
  bench: "I put a bench out, if you'd like to sit.",
  sapling: 'A little sapling took root.',
  bush: 'A new bush filled that empty corner.',
  treeSwing: 'A swing appeared on the old tree.',
  benchSwing: "There's a swing bench to rest on now.",
  hammock: 'Strung up a hammock. No rush to use it.',
  lillyPads: 'Lily pads drifted onto the pond.',
  willowTree: 'The willow grew in — it sways in the wind.',
  cherryBlossom: 'A cherry tree blossomed over here.',
  pond: 'A little pond settled in.',
  woodenSign: 'A small sign by the gate now.',
  woodenBridge: 'A bridge crosses the water now.',
  stream: 'A stream started running through.',
  gardenArchway: 'An archway grew over with green.',
  fence: 'A fence went up — cosy, not closed in.',
  stoneWall: 'An old stone wall appeared.',
  woodenGate: 'A gate for the path now.',
  campfire: "There's a fire pit for the cold evenings.",
  gazebo: "The gazebo's finished — somewhere to shelter.",
  greenhouse: 'A greenhouse, for growing things slowly.',
};

const VISITOR_LINES: Partial<Record<GardenAssetId, string>> = {
  robin: "A robin's been visiting.",
  blackbird: 'A blackbird stopped by.',
  blueTit: 'A blue tit flitted through.',
  owl: "There's an owl about tonight.",
  crow: 'A crow is keeping watch.',
  fox: 'A fox wandered through earlier.',
  squirrel: 'A squirrel was busy in the trees.',
  rabbit: 'A rabbit hopped past.',
  hedgehog: 'A hedgehog snuffled by.',
  dog: "There's a dog dozing in the sun.",
  cat: "A cat curled up somewhere warm.",
  butterfly: 'Butterflies about today.',
  bee: 'A bee is working the flowers.',
  dragonfly: 'A dragonfly hovered over the water.',
  ladybird: 'Spotted a ladybird on a leaf.',
  snail: 'A snail is taking its time.',
};

const SEASON_LINES: Record<GardenSeason, string> = {
  spring: 'Everything is just waking up.',
  summer: "It's warm and green out here.",
  autumn: 'The leaves are turning.',
  winter: 'Quiet and still under the cold.',
};

const GENERIC_LINES = [
  "I'm glad you're here.",
  'No rush. Sit a while.',
  "Nothing needs doing here.",
  "It's enough, just to be here.",
];

function fnv(seed: string): number {
  let value = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    value ^= seed.charCodeAt(i);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

export type WhisperInput = {
  recentDiscoveryId?: GardenAssetId | null;
  visitors: GardenAssetId[];
  season: GardenSeason;
  weather: GardenWeather;
  partOfDay: PartOfDay;
  seed: string;
};

/** A single gentle line for the garden. Always returns something soft. */
export function whisperFor({ recentDiscoveryId, visitors, season, weather, partOfDay, seed }: WhisperInput): string {
  const roll = fnv(seed) % 100;

  // Most often, acknowledge the newest discovery — that's the "oh, that's new" moment.
  if (recentDiscoveryId && DISCOVERY_LINES[recentDiscoveryId] && roll < 45) {
    return DISCOVERY_LINES[recentDiscoveryId] as string;
  }

  // Otherwise a visitor, if any are about.
  if (visitors.length > 0 && roll < 75) {
    const pick = visitors[fnv(`${seed}:v`) % visitors.length];
    if (VISITOR_LINES[pick]) return VISITOR_LINES[pick] as string;
  }

  if (weather === 'rain' && roll < 85) return 'Gentle rain today. A good day to stay in.';
  if (partOfDay === 'night' && roll < 90) return 'The stars are out.';
  if (roll < 96) return SEASON_LINES[season];

  return GENERIC_LINES[fnv(`${seed}:g`) % GENERIC_LINES.length];
}
