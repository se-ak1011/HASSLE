import React from 'react';
import { Image, ImageSourcePropType, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/AppText';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, FontSizes, Radius, Spacing } from '@/constants/theme';
import { useFontFamily } from '@/hooks/useFontFamily';

export type CompanionChip = {
  key: string;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  position: 'left' | 'top' | 'right' | 'bottom';
  onPress: () => void;
};

type CompanionZoneProps = {
  companion: ImageSourcePropType;
  chips?: CompanionChip[];
  label?: string;
  size?: 'medium' | 'large';
};

function chipPosition(position: CompanionChip['position']) {
  switch (position) {
    case 'left':
      return styles.leftChip;
    case 'top':
      return styles.topChip;
    case 'right':
      return styles.rightChip;
    case 'bottom':
      return styles.bottomChip;
  }
}

export function CompanionZone({ companion, chips = [], label, size = 'large' }: CompanionZoneProps) {
  const ff = useFontFamily();
  return (
    <View style={styles.zone}>
      <View style={[styles.orbit, size === 'medium' && styles.orbitMedium]}>
        {label ? <Text style={[styles.label, { fontFamily: ff.semibold }]}>{label}</Text> : null}
        <Image source={companion} style={[styles.lola, size === 'medium' && styles.lolaMedium]} resizeMode="contain" accessibilityLabel="Lola" />
        {chips.map((chip) => (
          <Pressable
            key={chip.key}
            style={({ pressed }) => [styles.chip, chipPosition(chip.position), pressed && styles.chipPressed]}
            onPress={chip.onPress}
            accessibilityRole="button"
            accessibilityLabel={chip.label}
          >
            <MaterialIcons name={chip.icon} size={18} color={Colors.primary} />
            <Text style={[styles.chipText, { fontFamily: ff.semibold }]}>{chip.label}</Text>
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
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    minHeight: 350,
  },
  orbit: {
    width: 300,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitMedium: {
    width: 250,
    height: 260,
  },
  label: {
    position: 'absolute',
    top: 12,
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  lola: {
    width: 176,
    height: 210,
  },
  lolaMedium: {
    width: 142,
    height: 170,
  },
  chip: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  chipPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  chipText: {
    fontSize: FontSizes.sm,
    color: Colors.text,
  },
  leftChip: {
    left: 0,
    top: 132,
  },
  topChip: {
    top: 46,
  },
  rightChip: {
    right: 0,
    top: 132,
  },
  bottomChip: {
    bottom: 28,
  },
});
