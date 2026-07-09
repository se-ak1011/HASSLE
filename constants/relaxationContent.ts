import { ImageSourcePropType } from 'react-native';

export type CompanionAsset = { key: string; label: string; source: ImageSourcePropType };

export const companionAssets: CompanionAsset[] = [
  { key: 'wave', label: 'Waving Lola', source: require('@/assets/companion/wave.png') },
  { key: 'reading', label: 'Reading Lola', source: require('@/assets/companion/reading.png') },
  { key: 'stretch', label: 'Stretching Lola', source: require('@/assets/companion/stretch.png') },
  { key: 'coffee', label: 'Drinking Lola', source: require('@/assets/companion/coffee.png') },
  { key: 'sleeping', label: 'Sleeping Lola', source: require('@/assets/companion/lola-asleep.png') },
  { key: 'blanket', label: 'Resting Lola', source: require('@/assets/companion/blanket.png') },
  { key: 'journal', label: 'Writing Lola', source: require('@/assets/companion/journal.png') },
  { key: 'standing', label: 'Standing Lola', source: require('@/assets/companion/standing.png') },
];

export const colouringPages = [
  { key: 'garden-cup', title: 'Garden cup', sections: ['steam', 'cup', 'leaf', 'saucer'] },
  { key: 'quiet-flower', title: 'Quiet flower', sections: ['petals', 'middle', 'stem', 'pot'] },
  { key: 'resting-moon', title: 'Resting moon', sections: ['moon', 'cloud', 'star', 'sky'] },
];

export const mahjongTileSet = {
  key: 'soft-symbols',
  title: 'Soft symbols',
  symbols: ['leaf', 'moon', 'cup', 'book', 'star', 'stone', 'rain', 'flower'],
};
