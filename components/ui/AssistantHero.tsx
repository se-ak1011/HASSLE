import { ReactNode } from 'react';
import { ImageSourcePropType, Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Text } from '@/components/ui/AppText';
import { Colors, FontSizes, Fonts, Spacing } from '@/constants/theme';
import { Button } from '@/components/ui/primitives/Button';
import { LolaPanel } from './LolaPanel';

type AssistantHeroAction = {
  label: string;
  onPress: () => void;
};

type AssistantHeroProps = {
  kicker?: string;
  title: string;
  subtitle: string;
  lola: ImageSourcePropType;
  lolaSize?: 'medium' | 'large';
  primaryAction?: AssistantHeroAction;
  secondaryAction?: AssistantHeroAction;
  badge?: ReactNode;
  style?: StyleProp<ViewStyle>;
  onLolaPress?: () => void;
};

export function AssistantHero({
  kicker = 'Today, together.',
  title,
  subtitle,
  lola,
  lolaSize = 'large',
  primaryAction,
  secondaryAction,
  badge,
  style,
  onLolaPress,
}: AssistantHeroProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.copy}>
        {kicker ? <Text style={styles.kicker}>{kicker}</Text> : null}
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        {badge}
        {primaryAction || secondaryAction ? (
          <View style={styles.actions}>
            {primaryAction ? <Button title={primaryAction.label} onPress={primaryAction.onPress} /> : null}
            {secondaryAction ? (
              <Button title={secondaryAction.label} onPress={secondaryAction.onPress} variant="secondary" />
            ) : null}
          </View>
        ) : null}
      </View>
      {onLolaPress ? (
        <Pressable
          onPress={onLolaPress}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Open Lola"
        >
          <LolaPanel image={lola} size={lolaSize} />
        </Pressable>
      ) : (
        <LolaPanel image={lola} size={lolaSize} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  copy: {
    flex: 1,
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  kicker: {
    fontSize: FontSizes.xs,
    color: Colors.textSubtle,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    fontWeight: Fonts.medium,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: Fonts.bold,
    color: Colors.text,
    letterSpacing: -0.8,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: FontSizes.lg,
    color: Colors.textMuted,
    lineHeight: 30,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
});
