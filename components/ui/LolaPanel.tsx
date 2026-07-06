import { Image, ImageSourcePropType, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Text } from '@/components/ui/AppText';
import { Colors, FontSizes, Fonts, Spacing } from '@/constants/theme';

type LolaPanelProps = {
  image: ImageSourcePropType;
  size?: 'small' | 'medium' | 'large';
  alignment?: 'center' | 'start' | 'end';
  title?: string;
  subtitle?: string;
  style?: StyleProp<ViewStyle>;
};

export function LolaPanel({ image, size = 'medium', alignment = 'center', title, subtitle, style }: LolaPanelProps) {
  return (
    <View style={[styles.container, styles[alignment], style]}>
      <Image source={image} style={[styles.image, styles[`${size}Image`]]} resizeMode="contain" />
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
