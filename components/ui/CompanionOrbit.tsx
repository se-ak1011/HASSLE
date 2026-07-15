import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { Text } from '@/components/ui/AppText';
import { Colors, FontSizes, Radius, Shadow, Spacing } from '@/constants/theme';
import { useFontFamily } from '@/hooks/useFontFamily';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export type CompanionOrbitChip = {
  key: string;
  label: string;
  onPress: () => void;
  highlighted?: boolean;
};

type CompanionOrbitProps = {
  companion: ImageSourcePropType;
  chips: CompanionOrbitChip[];
  size?: 'home' | 'page';
  accessibilityLabel?: string;
};

type OrbitPoint = { x: number; y: number };

function slotFor(index: number, count: number): OrbitPoint {
  if (count === 5) {
    return [
      { x: 0, y: -1 },
      { x: -0.86, y: -0.36 },
      { x: 0.86, y: -0.36 },
      { x: -0.74, y: 0.68 },
      { x: 0.74, y: 0.68 },
    ][index] ?? { x: 0, y: 1 };
  }

  if (count === 4) {
    return [
      { x: -0.88, y: -0.48 },
      { x: 0.88, y: -0.48 },
      { x: -0.78, y: 0.62 },
      { x: 0.78, y: 0.62 },
    ][index] ?? { x: 0, y: 1 };
  }

  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / Math.max(count, 1);
  return { x: Math.cos(angle), y: Math.sin(angle) };
}

export function CompanionOrbit({ companion, chips, size = 'home', accessibilityLabel = 'Lola' }: CompanionOrbitProps) {
  const ff = useFontFamily();
  const { width } = useWindowDimensions();
  const [open, setOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const reduceMotion = useReducedMotion();
  const progress = useRef(new Animated.Value(0)).current;
  const breath = useRef(new Animated.Value(0)).current;
  const tapPulse = useRef(new Animated.Value(0)).current;

  const metrics = useMemo(() => {
    const zoneWidth = Math.min(width - Spacing.lg * 2, size === 'home' ? 390 : 350);
    const zoneHeight = size === 'home' ? 455 : 375;
    const lolaWidth = size === 'home' ? 218 : 174;
    const lolaHeight = size === 'home' ? 280 : 226;
    const radiusX = Math.max(122, Math.min(zoneWidth / 2 - 64, size === 'home' ? 154 : 134));
    const radiusY = size === 'home' ? 168 : 142;
    const pulseSize = lolaWidth + 60;
    return { zoneWidth, zoneHeight, lolaWidth, lolaHeight, radiusX, radiusY, pulseSize };
  }, [size, width]);


  useEffect(() => {
    Animated.spring(progress, {
      toValue: open ? 1 : 0,
      useNativeDriver: true,
      friction: 8,
      tension: 90,
    }).start();
  }, [open, progress]);

  useEffect(() => {
    if (reduceMotion) {
      breath.stopAnimation();
      breath.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, { toValue: 1, duration: 4200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(breath, { toValue: 0, duration: 4200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [breath, reduceMotion]);

  useEffect(() => {
    if (reduceMotion || hasOpened || open) {
      tapPulse.stopAnimation();
      tapPulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(tapPulse, { toValue: 1, duration: 2200, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(tapPulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [hasOpened, open, reduceMotion, size, tapPulse]);

  function toggleOpen() {
    setHasOpened(true);
    setOpen((current) => !current);
  }

  function close() {
    setOpen(false);
  }

  return (
    <View style={styles.outer}>
      {open ? <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Close Lola actions" /> : null}
      <View style={[styles.zone, { width: metrics.zoneWidth, height: metrics.zoneHeight }]}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.anchorRing,
            {
              opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
              transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
            },
          ]}
        >
          <View style={styles.anchorDot} />
        </Animated.View>

        {chips.map((chip, index) => {
          const slot = slotFor(index, chips.length);
          const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, slot.x * metrics.radiusX] });
          const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [0, slot.y * metrics.radiusY] });
          const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.72, 1] });
          const opacity = progress.interpolate({ inputRange: [0, 0.55, 1], outputRange: [0, 0.2, 1] });

          return (
            <Animated.View
              key={chip.key}
              pointerEvents={open ? 'auto' : 'none'}
              style={[styles.chipSlot, { opacity, transform: [{ translateX }, { translateY }, { scale }] }]}
            >
              <Pressable
                style={({ pressed }) => [
                  styles.chip,
                  chip.highlighted && styles.chipHighlighted,
                  pressed && styles.chipPressed,
                ]}
                onPress={() => {
                  close();
                  chip.onPress();
                }}
                accessibilityRole="button"
                accessibilityLabel={chip.label}
              >
                <View style={[styles.chipDot, chip.highlighted && styles.chipDotHighlighted]} />
                <Text style={[styles.chipText, chip.highlighted && styles.chipTextHighlighted, { fontFamily: ff.semibold }]} numberOfLines={1}>
                  {chip.label}
                </Text>
              </Pressable>
            </Animated.View>
          );
        })}

        {!hasOpened && !reduceMotion ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.tapPulse,
              {
                width: metrics.pulseSize,
                height: metrics.pulseSize,
                borderRadius: metrics.pulseSize / 2,
                opacity: tapPulse.interpolate({ inputRange: [0, 0.55, 1], outputRange: [0.16, 0.32, 0] }),
                transform: [{ scale: tapPulse.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1.28] }) }],
              },
            ]}
          />
        ) : null}

        <Pressable
          onPress={toggleOpen}
          accessibilityRole="button"
          accessibilityLabel={open ? 'Close Lola actions' : 'Open Lola actions'}
          accessibilityState={{ expanded: open }}
          style={({ pressed }) => [styles.lolaButton, pressed && styles.lolaPressed]}
        >
          <Animated.View
            pointerEvents="none"
            style={
              reduceMotion
                ? null
                : {
                    transform: [
                      { translateY: breath.interpolate({ inputRange: [0, 1], outputRange: [0, -3] }) },
                      { scale: breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.008] }) },
                    ],
                  }
            }
          >
            <Image
              source={companion}
              style={{ width: metrics.lolaWidth, height: metrics.lolaHeight }}
              resizeMode="contain"
              accessibilityLabel={accessibilityLabel}
            />
          </Animated.View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 370,
  },
  zone: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  lolaButton: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  lolaPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
  anchorRing: {
    position: 'absolute',
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(167, 139, 201, 0.08)',
  },
  tapPulse: {
    position: 'absolute',
    width: 236,
    height: 236,
    borderRadius: 118,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    backgroundColor: 'rgba(167, 139, 201, 0.07)',
    zIndex: 1,
  },
  anchorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primaryLight,
    opacity: 0.72,
  },
  chipSlot: {
    position: 'absolute',
    zIndex: 3,
  },
  chip: {
    minWidth: 92,
    maxWidth: 128,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: 'rgba(42, 45, 49, 0.88)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 9,
    ...Shadow.soft,
  },
  chipHighlighted: {
    borderColor: Colors.primaryLight,
    backgroundColor: 'rgba(167, 139, 201, 0.92)',
  },
  chipPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primaryLight,
    opacity: 0.7,
  },
  chipDotHighlighted: {
    backgroundColor: Colors.background,
  },
  chipText: {
    color: Colors.text,
    fontSize: FontSizes.sm,
  },
  chipTextHighlighted: {
    color: Colors.background,
  },
});
