import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from './AppText';
import { Colors, Spacing, FontSizes, Fonts, Radius } from '@/constants/theme';
import { EnergyMode } from '@/constants/types';
import { useFontFamily } from '@/hooks/useFontFamily';

interface Props {
  mode: EnergyMode;
  total: number;
  used: number;
  remaining: number;
  isFlare: boolean;
}

export function EnergyBar({ mode, total, used, remaining, isFlare }: Props) {
  const ff = useFontFamily();
  const usedRatio = total > 0 ? Math.min(used / total, 1) : 0;

  // Fix: never double-append % — only append unit once, clearly
  const unit = mode === 'spoon' ? (total === 1 ? 'spoon' : 'spoons') : '%';

  const isOverCapacity = used > total;

  // Always derive display strings from the actual `used` value — never from `total`
  const displayUsed =
    mode === 'battery' ? `${used}%` : `${used} ${unit}`;
  const displayTotal =
    mode === 'battery' ? `${total}%` : `${total} ${unit}`;
  const displayRemaining =
    mode === 'battery' ? `${remaining}%` : `${remaining} ${unit}`;

  // Over-capacity text shows exactly how much the user used, not the total cap
  const statsLabel = isOverCapacity
    ? `${displayUsed} used (over capacity)`
    : `${displayUsed} used · ${displayTotal} total`;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.remainingLabel, { fontFamily: ff.medium }]}>Remaining</Text>
          <View style={styles.remainingRow}>
            <Text style={[styles.remainingValue, isFlare && styles.remainingFlare, { fontFamily: ff.bold }]}>
              {displayRemaining}
            </Text>
            {isFlare ? (
              <View style={styles.flareBadge}>
                <Text style={[styles.flareBadgeText, { fontFamily: ff.semibold }]}>flare</Text>
              </View>
            ) : null}
          </View>
        </View>
        <View style={styles.statsRight}>
          <Text style={[styles.statsText, isOverCapacity && styles.statsOver, { fontFamily: ff.regular }]}>
            {statsLabel}
          </Text>
        </View>
      </View>

      {/* Bar track */}
      <View style={styles.barBg}>
        <View
          style={[
            styles.barFill,
            { width: `${Math.round(Math.max(0, Math.min(usedRatio, 1)) * 100)}%` },
            isFlare && styles.barFillFlare,
          ]}
        />
      </View>

      {/* Low energy hint */}
      {remaining <= (mode === 'spoon' ? 2 : 20) && remaining > 0 ? (
        <Text style={[styles.lowHint, { fontFamily: ff.regular }]}>Running low. Rest counts.</Text>
      ) : null}
      {remaining === 0 ? (
        <Text style={[styles.emptyHint, { fontFamily: ff.regular }]}>You have given a lot today.</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  remainingLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textSubtle,
    fontWeight: Fonts.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  remainingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  remainingValue: {
    fontSize: FontSizes.xl,
    fontWeight: Fonts.bold,
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  remainingFlare: {
    color: Colors.flare,
  },
  flareBadge: {
    backgroundColor: Colors.flareFaint,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.flare,
  },
  flareBadgeText: {
    fontSize: FontSizes.xs,
    color: Colors.flare,
    fontWeight: Fonts.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  statsRight: {
    alignItems: 'flex-end',
  },
  statsText: {
    fontSize: FontSizes.sm,
    color: Colors.textSubtle,
    fontWeight: Fonts.regular,
  },
  statsOver: {
    color: Colors.flare,
  },
  barBg: {
    height: 6,
    backgroundColor: Colors.surfaceDark,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
  },
  barFillFlare: {
    backgroundColor: Colors.flare,
  },
  lowHint: {
    fontSize: FontSizes.xs,
    color: Colors.textSubtle,
    fontStyle: 'italic',
    marginTop: -Spacing.xs,
  },
  emptyHint: {
    fontSize: FontSizes.xs,
    color: Colors.flare,
    fontStyle: 'italic',
    marginTop: -Spacing.xs,
  },
});
