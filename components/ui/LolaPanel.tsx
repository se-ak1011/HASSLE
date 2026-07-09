import { useEffect, useRef } from 'react';
import { Animated, Easing, ImageSourcePropType, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Text } from '@/components/ui/AppText';
import { Colors, FontSizes, Fonts, Spacing } from '@/constants/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';

type LolaPanelProps = {
  image: ImageSourcePropType;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  alignment?: 'center' | 'start' | 'end';
  title?: string;
  subtitle?: string;
  style?: StyleProp<ViewStyle>;
};

export function LolaPanel({ image, size = 'medium', alignment = 'center', title, subtitle, style }: LolaPanelProps) {
  const breath = useRef(new Animated.Value(0)).current;
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      breath.stopAnimation();
      breath.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, { toValue: 1, duration: 3600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(breath, { toValue: 0, duration: 3600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [breath, reduceMotion]);

  const animatedStyle = reduceMotion
    ? null
    : {
        transform: [
          { translateY: breath.interpolate({ inputRange: [0, 1], outputRange: [0, -2] }) },
          { scale: breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.006] }) },
        ],
      };

  return (
    <View style={[styles.container, styles[alignment], style]}>
      <Animated.Image source={image} style={[styles.image, styles[`${size}Image`], animatedStyle]} resizeMode="contain" />
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  center: { alignItems: 'center' },
  start: { alignItems: 'flex-start' },
  end: { alignItems: 'flex-end' },
  image: {},
  smallImage: { width: 72, height: 86 },
  mediumImage: { width: 112, height: 132 },
  largeImage: { width: 140, height: 166 },
  xlargeImage: { width: 220, height: 260 },
  title: {
    fontSize: FontSizes.base,
    fontWeight: Fonts.semibold,
    color: Colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSubtle,
    lineHeight: 20,
    textAlign: 'center',
  },
});
