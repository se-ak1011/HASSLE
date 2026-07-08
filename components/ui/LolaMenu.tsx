import React from 'react';
import { Image, ImageSourcePropType, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/AppText';
import { Colors, FontSizes, Radius, Spacing } from '@/constants/theme';
import { useFontFamily } from '@/hooks/useFontFamily';

export type LolaMenuChip = {
  key: string;
  label: string;
  position: 'upperLeft' | 'upperRight' | 'lowerLeft' | 'lowerRight';
  onPress: () => void;
  highlighted?: boolean;
};

type LolaMenuProps = {
  companion: ImageSourcePropType;
  chips: LolaMenuChip[];
  size?: 'home' | 'page';
};

function chipPosition(position: LolaMenuChip['position']) {
  switch (position) {
    case 'upperLeft':
      return styles.upperLeft;
    case 'upperRight':
      return styles.upperRight;
    case 'lowerLeft':
      return styles.lowerLeft;
    case 'lowerRight':
      return styles.lowerRight;
  }
}

export function LolaMenu({ companion, chips, size = 'home' }: LolaMenuProps) {
  const ff = useFontFamily();
  return (
    <View style={[styles.zone, size === 'page' && styles.zonePage]}>
      <View style={[styles.orbit, size === 'page' && styles.orbitPage]}>
        <Image
          source={companion}
          style={[styles.lola, size === 'page' && styles.lolaPage]}
          resizeMode="contain"
          accessibilityLabel="Lola"
        />
        {chips.map((chip) => (
          <Pressable
            key={chip.key}
            style={({ pressed }) => [
              styles.chip,
              chip.highlighted && styles.chipHighlighted,
              chipPosition(chip.position),
              pressed && styles.chipPressed,
            ]}
            onPress={chip.onPress}
            accessibilityRole="button"
            accessibilityLabel={chip.label}
          >
            <Text
              style={[
                styles.chipText,
                chip.highlighted && styles.chipTextHighlighted,
                { fontFamily: ff.semibold },
              ]}
            >
              {chip.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  zone: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 460,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  zonePage: {
    minHeight: 330,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  orbit: {
    width: 360,
    height: 390,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitPage: {
    width: 320,
    height: 310,
  },
  lola: {
    width: 230,
    height: 300,
  },
  lolaPage: {
    width: 180,
    height: 235,
  },
  chip: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 112,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 11,
  },
  chipHighlighted: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  chipPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },
  chipText: {
    color: Colors.text,
    fontSize: FontSizes.base,
  },
  chipTextHighlighted: {
    color: Colors.background,
  },
  upperLeft: {
    left: 4,
    top: 92,
  },
  upperRight: {
    right: 4,
    top: 76,
  },
  lowerLeft: {
    left: 18,
    bottom: 86,
  },
  lowerRight: {
    right: 0,
    bottom: 70,
  },
});
