import { ReactNode, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  GestureResponderEvent,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Animation, Colors, TouchTarget } from '@/constants/theme';
import { HapticPolicy, triggerHaptic } from './haptics';

type InteractivePressableProps = Omit<PressableProps, 'children' | 'style'> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  haptics?: HapticPolicy;
  loading?: boolean;
  sinkScale?: number;
};

export function InteractivePressable({
  children,
  style,
  contentStyle,
  disabled,
  haptics = 'light',
  loading = false,
  onPress,
  onPressIn,
  onPressOut,
  sinkScale = Animation.pressScale,
  accessibilityState,
  ...props
}: InteractivePressableProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const [reduceMotion, setReduceMotion] = useState(false);
  const isDisabled = disabled || loading;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  const animate = (pressed: boolean) => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: reduceMotion || !pressed ? 1 : sinkScale,
        duration: Animation.fast,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: pressed ? Animation.pressOpacity : 1,
        duration: Animation.fast,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePress = async (event: GestureResponderEvent) => {
    if (isDisabled) return;
    await triggerHaptic(haptics);
    onPress?.(event);
  };

  return (
    <Pressable
      {...props}
      disabled={isDisabled}
      onPress={handlePress}
      onPressIn={(event) => {
        animate(true);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        animate(false);
        onPressOut?.(event);
      }}
      accessibilityState={{ ...accessibilityState, disabled: isDisabled, busy: loading }}
      style={[styles.touchTarget, isDisabled && styles.disabled, style]}
    >
      <Animated.View style={[{ transform: [{ scale }], opacity }, contentStyle]}>
        {loading ? <ActivityIndicator color={Colors.textSecondary} /> : children}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  touchTarget: {
    minHeight: TouchTarget.minHeight,
    minWidth: TouchTarget.minWidth,
  },
  disabled: {
    opacity: 0.55,
  },
});
