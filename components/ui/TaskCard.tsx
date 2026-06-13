import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text } from './AppText';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, Fonts, Radius, Shadow } from '@/constants/theme';
import { formatCost } from '@/services/formatCost';
import { formatShortDate } from '@/services/dates';
import { Task } from '@/constants/types';
import { useFontFamily } from '@/hooks/useFontFamily';

interface Props {
  task: Task;
  onComplete: () => void;
  onMove: () => void;
  onRevert?: () => void;
  mode: 'spoon' | 'battery';
}

export function TaskCard({ task, onComplete, onMove, onRevert, mode }: Props) {
  const ff = useFontFamily();
  const isCompleted = task.status === 'completed';
  const isMoved = task.status === 'moved';

  // Always display effectiveCost (already computed dynamically in context)
  const displayCost = isCompleted
    ? (task.completedCost ?? task.effectiveCost)
    : task.effectiveCost;

  const costDisplay = formatCost(displayCost, mode);

  // Show flare-adjusted indicator when cost differs from base
  const isFlareAdjusted =
    !isCompleted && !isMoved && task.effectiveCost !== task.baseCost;

  return (
    <View
      style={[
        styles.card,
        isCompleted && styles.cardDone,
        isMoved && styles.cardMoved,
      ]}
    >
      <View style={styles.main}>
        <View style={styles.info}>
          {task.category ? (
            <Text style={[styles.category, { fontFamily: ff.medium }]}>{task.category}</Text>
          ) : null}
          <Text style={[styles.name, isCompleted && styles.nameDone, { fontFamily: ff.medium }]}>
            {task.name}
          </Text>
          <View style={styles.costRow}>
            <Text style={[styles.cost, isCompleted && styles.costDone, { fontFamily: ff.regular }]}>
              {costDisplay}
            </Text>
            {isFlareAdjusted ? (
              <View style={styles.flareCostBadge}>
                <Text style={[styles.flareCostText, { fontFamily: ff.medium }]}>flare ×1.5</Text>
              </View>
            ) : null}
            {task.isPreMade && !isMoved && !isFlareAdjusted ? (
              <View style={styles.premadeBadge}>
                <Text style={[styles.premadeText, { fontFamily: ff.medium }]}>preset</Text>
              </View>
            ) : null}
            {isMoved && task.movedTo ? (
              <View style={styles.movedBadge}>
                <MaterialIcons name="event" size={11} color={Colors.accent} />
                <Text style={[styles.movedText, { fontFamily: ff.medium }]}>{formatShortDate(task.movedTo)}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {!isCompleted && !isMoved ? (
          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [
                styles.actionBtn,
                styles.completeBtn,
                pressed && { opacity: 0.7 },
              ]}
              onPress={onComplete}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Mark "${task.name}" done`}
            >
              <MaterialIcons name="check" size={20} color={Colors.background} />
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.actionBtn,
                styles.moveBtn,
                pressed && { opacity: 0.7 },
              ]}
              onPress={onMove}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Reschedule "${task.name}"`}
            >
              <MaterialIcons name="arrow-forward" size={18} color={Colors.textMuted} />
            </Pressable>
          </View>
        ) : null}

        {isCompleted ? (
          <View style={styles.statusIcon}>
            <MaterialIcons name="check-circle" size={22} color={Colors.success} />
          </View>
        ) : null}

        {isMoved ? (
          onRevert ? (
            <Pressable
              style={({ pressed }) => [
                styles.actionBtn,
                styles.moveBtn,
                pressed && { opacity: 0.7 },
              ]}
              onPress={onRevert}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Undo move of "${task.name}"`}
            >
              <MaterialIcons name="undo" size={18} color={Colors.textMuted} />
            </Pressable>
          ) : (
            <View style={styles.statusIcon}>
              <MaterialIcons name="schedule" size={20} color={Colors.textSubtle} />
            </View>
          )
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    padding: Spacing.md,
    ...Shadow.soft,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardDone: {
    opacity: 0.6,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  cardMoved: {
    opacity: 0.45,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  main: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  category: {
    fontSize: FontSizes.xs,
    color: Colors.textSubtle,
    fontWeight: Fonts.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  name: {
    fontSize: FontSizes.base,
    fontWeight: Fonts.medium,
    color: Colors.text,
    marginBottom: 5,
  },
  nameDone: {
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cost: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    fontWeight: Fonts.regular,
  },
  costDone: {
    color: Colors.textSubtle,
  },
  flareCostBadge: {
    backgroundColor: Colors.flareFaint,
    borderRadius: Radius.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.flare,
  },
  flareCostText: {
    fontSize: 10,
    color: Colors.flare,
    fontWeight: Fonts.medium,
  },
  premadeBadge: {
    backgroundColor: Colors.accentFaint,
    borderRadius: Radius.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  premadeText: {
    fontSize: 10,
    color: Colors.accent,
    fontWeight: Fonts.medium,
  },
  movedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.accentFaint,
    borderRadius: Radius.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  movedText: {
    fontSize: 10,
    color: Colors.accent,
    fontWeight: Fonts.medium,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeBtn: {
    backgroundColor: Colors.primary,
  },
  moveBtn: {
    backgroundColor: Colors.surfaceDark,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusIcon: {
    marginLeft: Spacing.sm,
  },
});
