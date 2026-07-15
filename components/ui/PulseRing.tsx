import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, ViewStyle } from 'react-native';
import { Colors } from '@/constants/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';

// A soft, breathing ring — the same "tap me" affordance the Home Lola has,
// reused behind other interactive Lolas. Purely decorative (pointerEvents none)
// and fully disabled under reduce-motion.
type PulseRingProps = {
  size: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

export function PulseRing({ size, color = Colors.primaryLight, style }: PulseRingProps) {
  const reduceMotion = useReducedMotion();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) {
      pulse.stopAnimation();
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
  }, [pulse, reduceMotion]);

  if (reduceMotion) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 1,
          borderColor: color,
          backgroundColor: 'rgba(167, 139, 201, 0.07)',
          opacity: pulse.interpolate({ inputRange: [0, 0.55, 1], outputRange: [0.16, 0.32, 0] }),
          transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1.28] }) }],
        },
        style,
      ]}
    />
  );
}
