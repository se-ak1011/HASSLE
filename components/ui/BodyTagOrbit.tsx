import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Image, ImageSourcePropType, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text } from '@/components/ui/AppText';
import { Colors, FontSizes, Radius, Shadow, Spacing } from '@/constants/theme';
import { useFontFamily } from '@/hooks/useFontFamily';
import { useReducedMotion } from '@/hooks/useReducedMotion';

// One Lola in the Body carousel, with her tags spreading radially around her when
// tapped — the same "menu chips" feel as the Home/Mind orbit, but the chips are
// multi-select toggles that stay put while you pick. Closed: just Lola + her
// category label, with a soft pulse inviting a tap.

type Props = {
  companion: ImageSourcePropType;
  label: string;
  tags: string[];
  selected: string[];
  open: boolean;
  onPressLola: () => void;
  onToggleTag: (tag: string) => void;
};

// Evenly distribute points around a circle, starting at the top.
function slotFor(index: number, count: number): { x: number; y: number } {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / Math.max(count, 1);
  return { x: Math.cos(angle), y: Math.sin(angle) };
}

export function BodyTagOrbit({ companion, label, tags, selected, open, onPressLola, onToggleTag }: Props) {
  const ff = useFontFamily();
  const { width } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const progress = useRef(new Animated.Value(0)).current;
  const breath = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  const metrics = useMemo(() => {
    const zone = Math.min(width, 420);
    const lolaWidth = 150;
    const lolaHeight = 182;
    // Keep the ring inside the page so nothing clips at the carousel edges.
    const radiusX = Math.min(zone / 2 - 62, 140);
    const radiusY = 152;
    return { zone, lolaWidth, lolaHeight, radiusX, radiusY };
  }, [width]);

  useEffect(() => {
    Animated.spring(progress, { toValue: open ? 1 : 0, useNativeDriver: true, friction: 8, tension: 80 }).start();
  }, [open, progress]);

  // Gentle idle breath on Lola.
  useEffect(() => {
    if (reduceMotion) {
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

  // "Tap me" pulse while closed.
  useEffect(() => {
    if (reduceMotion || open) {
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 2200, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [open, pulse, reduceMotion]);

  return (
    <View style={[styles.zone, { width: metrics.zone, height: 400 }]}>
      {/* Tap-me pulse. */}
      {!reduceMotion ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.pulse,
            {
              opacity: pulse.interpolate({ inputRange: [0, 0.55, 1], outputRange: [0.14, 0.3, 0] }),
              transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.3] }) }],
            },
          ]}
        />
      ) : null}

      {/* Tags spread around Lola. */}
      {tags.map((tag, i) => {
        const slot = slotFor(i, tags.length);
        const isOn = selected.includes(tag);
        const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, slot.x * metrics.radiusX] });
        const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [0, slot.y * metrics.radiusY] });
        const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });
        const opacity = progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.15, 1] });
        return (
          <Animated.View key={tag} pointerEvents={open ? 'auto' : 'none'} style={[styles.chipSlot, { opacity, transform: [{ translateX }, { translateY }, { scale }] }]}>
            <Pressable
              onPress={() => onToggleTag(tag)}
              style={({ pressed }) => [styles.chip, isOn && styles.chipOn, pressed && styles.chipPressed]}
              accessibilityRole="button"
              accessibilityState={{ selected: isOn }}
              accessibilityLabel={tag}
            >
              <Text style={[styles.chipText, isOn && styles.chipTextOn, { fontFamily: ff.semibold }]} numberOfLines={2}>{tag}</Text>
            </Pressable>
          </Animated.View>
        );
      })}

      {/* Lola — tap to open/close her tags. */}
      <Pressable onPress={onPressLola} accessibilityRole="button" accessibilityState={{ expanded: open }} accessibilityLabel={`${label}. Tap to ${open ? 'close' : 'open'} tags.`} style={styles.lolaBtn}>
        <Animated.View
          pointerEvents="none"
          style={reduceMotion ? null : { transform: [{ translateY: breath.interpolate({ inputRange: [0, 1], outputRange: [0, -3] }) }] }}
        >
          <Image source={companion} style={{ width: metrics.lolaWidth, height: metrics.lolaHeight }} resizeMode="contain" />
        </Animated.View>
      </Pressable>

      {/* Category label under Lola — hidden while the tags are spread. */}
      <Animated.Text
        style={[styles.label, { fontFamily: ff.bold, opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}
        pointerEvents="none"
      >
        {label.toUpperCase()}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  zone: { alignItems: 'center', justifyContent: 'center' },
  pulse: { position: 'absolute', width: 210, height: 210, borderRadius: 105, borderWidth: 1, borderColor: Colors.primaryLight, backgroundColor: 'rgba(167,139,201,0.06)' },
  lolaBtn: { alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  label: { position: 'absolute', bottom: 40, color: Colors.text, fontSize: FontSizes.lg, letterSpacing: 6 },
  chipSlot: { position: 'absolute', zIndex: 3 },
  chip: {
    minWidth: 58,
    maxWidth: 106,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: 'rgba(42, 45, 49, 0.94)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
    ...Shadow.soft,
  },
  chipOn: { borderColor: Colors.primaryLight, backgroundColor: Colors.primary },
  chipPressed: { opacity: 0.75, transform: [{ scale: 0.97 }] },
  chipText: { color: Colors.text, fontSize: FontSizes.sm, textAlign: 'center' },
  chipTextOn: { color: Colors.background },
});
