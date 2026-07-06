import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Text } from '@/components/ui/AppText';
import { Colors, FontSizes, Fonts, Radius, Spacing } from '@/constants/theme';
import { InteractivePressable } from '@/components/ui/primitives/InteractivePressable';

type ObservationCardProps = {
  label?: string;
  text: string;
  confidenceLabel?: string;
  icon?: ReactNode;
  actionLabel?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function ObservationCard({
  label = 'Hassle noticed',
  text,
  confidenceLabel,
  icon,
  actionLabel,
  onPress,
  style,
}: ObservationCardProps) {
  const content = (
    <View style={[styles.card, style]}>
      <View style={styles.headerRow}>
        <View style={styles.labelRow}>
          {icon}
          <Text style={styles.label}>{label}</Text>
        </View>
        {confidenceLabel ? <Text style={styles.confidence}>{confidenceLabel}</Text> : null}
      </View>
      <Text style={styles.text}>{text}</Text>
      {actionLabel ? <Text style={styles.action}>{actionLabel}</Text> : null}
    </View>
  );

  if (!onPress) return content;

  return (
    <InteractivePressable accessibilityRole="button" onPress={onPress} haptics="light" style={styles.pressable}>
      {content}
    </InteractivePressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  card: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  label: {
    fontSize: FontSizes.xs,
    color: Colors.textSubtle,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: Fonts.medium,
  },
  confidence: {
    fontSize: FontSizes.xs,
    color: Colors.textSubtle,
  },
  text: {
    fontSize: FontSizes.base,
    color: Colors.textMuted,
    lineHeight: 25,
  },
  action: {
    marginTop: Spacing.md,
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: Fonts.semibold,
  },
});
