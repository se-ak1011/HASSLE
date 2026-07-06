import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Text } from '@/components/ui/AppText';
import { Colors, FontSizes, Fonts, Radius, Spacing } from '@/constants/theme';

type TodaySupportCardProps = {
  nextTask?: string;
  remainingCount: number;
  isFlare?: boolean;
  action?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function TodaySupportCard({ nextTask, remainingCount, isFlare = false, action, style }: TodaySupportCardProps) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.copy}>
        <Text style={styles.label}>{isFlare ? 'Flare support' : 'Today support'}</Text>
        <Text style={styles.title}>{nextTask ?? 'Nothing urgent.'}</Text>
        <Text style={styles.body}>
          {remainingCount === 0
            ? 'Add only what would help.'
            : remainingCount === 1
            ? 'One thing is waiting.'
            : `${remainingCount} things are waiting.`}
        </Text>
      </View>
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  copy: {
    gap: Spacing.xs,
  },
  label: {
    fontSize: FontSizes.xs,
    color: Colors.textSubtle,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: Fonts.medium,
  },
  title: {
    fontSize: FontSizes.base,
    color: Colors.text,
    fontWeight: Fonts.semibold,
  },
  body: {
    fontSize: FontSizes.sm,
    color: Colors.textSubtle,
    lineHeight: 20,
  },
  action: {
    alignSelf: 'flex-start',
  },
});
