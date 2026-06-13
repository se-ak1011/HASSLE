
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Text } from '@/components/ui/AppText';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, Fonts, Radius } from '@/constants/theme';
import { useDay } from '@/hooks/useDay';
import { useFontFamily } from '@/hooks/useFontFamily';
import { loadHistory } from '@/services/storage';
import { DayState, EnergyMode } from '@/constants/types';
import { formatCost } from '@/services/formatCost';
import { Lola } from '@/constants/lola';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

interface ModeInsights {
  mode: EnergyMode;
  days: DayState[];
  avgEnergy: number;
  avgUsed: number;
  flareDays: number;
  topTask: { name: string; avgCost: number } | null;
  commonTags: { tag: string; count: number }[];
}

function buildInsights(days: DayState[], mode: EnergyMode): ModeInsights {
  const filtered = days.filter((d) => d.energyMode === mode);

  const avgEnergy = avg(filtered.map((d) => d.energyLevel));

  const avgUsed = avg(
    filtered.map((d) =>
      d.tasks
        .filter((t) => t.status === 'completed')
        .reduce((sum, t) => sum + (t.completedCost ?? t.effectiveCost ?? t.baseCost), 0)
    )
  );

  const flareDays = filtered.filter((d) => d.isFlareDay).length;

  const taskMap: Record<string, number[]> = {};
  filtered.forEach((d) => {
    d.tasks
      .filter((t) => t.status === 'completed')
      .forEach((t) => {
        if (!taskMap[t.name]) taskMap[t.name] = [];
        taskMap[t.name].push(t.completedCost ?? t.effectiveCost ?? t.baseCost);
      });
  });

  let topTask: ModeInsights['topTask'] = null;
  let maxAvg = 0;
  Object.entries(taskMap).forEach(([name, costs]) => {
    if (costs.length >= 2) {
      const a = avg(costs);
      if (a > maxAvg) {
        maxAvg = a;
        topTask = { name, avgCost: a };
      }
    }
  });

  const tagMap: Record<string, number> = {};
  filtered.forEach((d) =>
    d.tags.forEach((tag) => {
      tagMap[tag] = (tagMap[tag] ?? 0) + 1;
    })
  );
  const commonTags = Object.entries(tagMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([tag, count]) => ({ tag, count }));

  return { mode, days: filtered, avgEnergy, avgUsed, flareDays, topTask, commonTags };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  value,
  label,
  highlight,
}: {
  value: string;
  label: string;
  highlight?: boolean;
}) {
  return (
    <View style={[statStyles.card, highlight && statStyles.cardHighlight]}>
      <Text style={[statStyles.value, highlight && statStyles.valueHighlight]}>
        {value}
      </Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHighlight: {
    backgroundColor: Colors.flareFaint,
    borderColor: Colors.flare,
  },
  value: {
    fontSize: FontSizes.xl,
    fontWeight: Fonts.bold,
    color: Colors.primary,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  valueHighlight: {
    color: Colors.flare,
  },
  label: {
    fontSize: FontSizes.xs,
    color: Colors.textSubtle,
    textAlign: 'center',
    lineHeight: 16,
  },
});

function InsightSection({ insights }: { insights: ModeInsights }) {
  const { mode, days, avgEnergy, avgUsed, flareDays, topTask, commonTags } = insights;

  if (days.length === 0) return null;

  const modeLabel = mode === 'battery' ? 'Battery' : 'Spoon';
  const modeIcon: 'battery-std' | 'rice-bowl' =
    mode === 'battery' ? 'battery-std' : 'rice-bowl';

  return (
    <View style={sectionStyles.container}>
      <View style={sectionStyles.modeHeader}>
        <View style={sectionStyles.modeBadge}>
          <MaterialIcons name={modeIcon} size={14} color={Colors.primary} />
          <Text style={sectionStyles.modeBadgeText}>{modeLabel} tracking</Text>
        </View>
        <Text style={sectionStyles.dayCount}>
          {days.length} {days.length === 1 ? 'day' : 'days'}
        </Text>
      </View>

      <View style={sectionStyles.statsRow}>
        <StatCard
          value={formatCost(avgEnergy, mode, { short: true })}
          label={'avg energy\nstarted with'}
        />
        <StatCard
          value={formatCost(avgUsed, mode, { short: true })}
          label={'avg energy\nused'}
        />
        <StatCard
          value={String(flareDays)}
          label={'flare\ndays'}
          highlight={flareDays > 0}
        />
      </View>

      {topTask ? (
        <View style={sectionStyles.infoCard}>
          <MaterialIcons name="priority-high" size={16} color={Colors.accent} />
          <View style={sectionStyles.infoText}>
            <Text style={sectionStyles.infoTitle}>Most demanding task</Text>
            <Text style={sectionStyles.infoValue}>
              {topTask.name} — avg {formatCost(topTask.avgCost, mode)}
            </Text>
          </View>
        </View>
      ) : null}

      {commonTags.length > 0 ? (
        <View style={sectionStyles.tagsBlock}>
          <Text style={sectionStyles.tagsTitle}>How you often felt</Text>
          <View style={sectionStyles.tagsRow}>
            {commonTags.map(({ tag, count }) => (
              <View key={tag} style={sectionStyles.tagChip}>
                <Text style={sectionStyles.tagText}>{tag}</Text>
                <Text style={sectionStyles.tagCount}>{count}×</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <View style={sectionStyles.recentBlock}>
        <Text style={sectionStyles.recentTitle}>Recent days</Text>
        {days.slice(0, 5).map((d) => {
          const done = d.tasks.filter((t) => t.status === 'completed').length;
          const used = d.tasks
            .filter((t) => t.status === 'completed')
            .reduce(
              (sum, t) => sum + (t.completedCost ?? t.effectiveCost ?? t.baseCost),
              0
            );
          return (
            <View key={d.date} style={sectionStyles.recentRow}>
              <Text style={sectionStyles.recentDate}>{formatDate(d.date)}</Text>
              {d.isFlareDay ? (
                <View style={sectionStyles.flareDot} />
              ) : null}
              <Text style={sectionStyles.recentTasks}>
                {done} {done === 1 ? 'task' : 'tasks'}
              </Text>
              <Text style={sectionStyles.recentUsed}>
                {formatCost(used, mode)} used
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  modeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryFaint,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modeBadgeText: {
    fontSize: FontSizes.xs,
    color: Colors.primary,
    fontWeight: Fonts.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dayCount: {
    fontSize: FontSizes.sm,
    color: Colors.textSubtle,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.accentFaint,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoText: {
    flex: 1,
  },
  infoTitle: {
    fontSize: FontSizes.xs,
    color: Colors.textSubtle,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: Fonts.medium,
    marginBottom: 3,
  },
  infoValue: {
    fontSize: FontSizes.base,
    color: Colors.text,
    fontWeight: Fonts.medium,
  },
  tagsBlock: {
    gap: Spacing.sm,
  },
  tagsTitle: {
    fontSize: FontSizes.xs,
    color: Colors.textSubtle,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: Fonts.medium,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagText: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    fontWeight: Fonts.medium,
  },
  tagCount: {
    fontSize: FontSizes.xs,
    color: Colors.textSubtle,
  },
  recentBlock: {
    gap: Spacing.sm,
  },
  recentTitle: {
    fontSize: FontSizes.xs,
    color: Colors.textSubtle,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: Fonts.medium,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  recentDate: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    fontWeight: Fonts.medium,
    width: 52,
  },
  flareDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.flare,
    marginRight: -Spacing.xs,
  },
  recentTasks: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.textSubtle,
  },
  recentUsed: {
    fontSize: FontSizes.sm,
    color: Colors.textSubtle,
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function PatternsScreen() {
  const insets = useSafeAreaInsets();
  const { day } = useDay();
  const ff = useFontFamily();

  const [history, setHistory] = useState<DayState[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const h = await loadHistory();
    setHistory(h);
    setLoading(false);
  }, []);

  // Refresh history every time the tab is focused
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  // Also refresh in real-time when tasks change during the active day
  const taskCount = day?.tasks.length ?? 0;
  const doneCount = day?.tasks.filter((t) => t.status === 'completed').length ?? 0;
  useEffect(() => {
    reload();
    // The error message "Definition for rule 'react-hooks/exhaustive-deps' was not found."
    // indicates an ESLint configuration issue, not a TypeScript syntax error.
    // To fix this, we should remove the ESLint directive that attempts to disable
    // a rule that doesn't exist or isn't configured, as it's causing the linter itself to complain.
    // The dependency array itself is correct, as 'reload' is stable and 'taskCount' and 'doneCount'
    // are indeed dependencies.
  }, [taskCount, doneCount, reload]);

  const batteryDays = history.filter((d) => d.energyMode === 'battery');
  const spoonDays = history.filter((d) => d.energyMode === 'spoon');
  const hasMixed = batteryDays.length > 0 && spoonDays.length > 0;

  const batteryInsights = buildInsights(history, 'battery');
  const spoonInsights = buildInsights(history, 'spoon');

  // Today at a glance — always live from context
  const flareDay = day?.isFlareDay ?? false;
  const energyDisplay = day && day.checkedIn
    ? formatCost(day.energyLevel, day.energyMode, { short: true })
    : '—';

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { fontFamily: ff.bold }]}>Patterns</Text>
          <Text style={[styles.subtitle, { fontFamily: ff.regular }]}>Your history, kept honestly.</Text>
        </View>

        {/* Today at a glance */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontFamily: ff.semibold }]}>Today at a glance</Text>
          <View style={styles.glanceGrid}>
            <View style={styles.glanceCard}>
              <Text style={[styles.glanceValue, { fontFamily: ff.bold }]}>{energyDisplay}</Text>
              <Text style={[styles.glanceLabel, { fontFamily: ff.regular }]}>
                {day?.energyMode === 'battery' ? 'battery' : 'spoons'}
              </Text>
            </View>
            <View style={styles.glanceCard}>
              <Text style={[styles.glanceValue, { fontFamily: ff.bold }]}>{doneCount}</Text>
              <Text style={[styles.glanceLabel, { fontFamily: ff.regular }]}>done</Text>
            </View>
            <View style={[styles.glanceCard, flareDay && styles.glanceCardFlare]}>
              <Text style={[styles.glanceValue, flareDay && styles.glanceFlareValue, { fontFamily: ff.bold }]}>
                {flareDay ? 'Yes' : 'No'}
              </Text>
              <Text style={[styles.glanceLabel, { fontFamily: ff.regular }]}>flare day</Text>
            </View>
          </View>
        </View>

        {/* Tags */}
        {(day?.tags ?? []).length > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { fontFamily: ff.semibold }]}>How you felt today</Text>
            <View style={styles.tagsWrap}>
              {(day?.tags ?? []).map((tag) => (
                <View key={tag} style={styles.tagChip}>
                  <Text style={[styles.tagChipText, { fontFamily: ff.medium }]}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* History insights */}
        <View style={styles.section}>
          <View style={styles.insightsHeader}>
            <Text style={[styles.sectionTitle, { fontFamily: ff.semibold }]}>History insights</Text>
            <Pressable
              onPress={reload}
              style={({ pressed }) => [
                styles.refreshBtn,
                pressed && { opacity: 0.6 },
              ]}
              hitSlop={12}
            >
              <MaterialIcons name="refresh" size={18} color={Colors.textSubtle} />
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={Colors.primary} size="small" />
              <Text style={[styles.loadingText, { fontFamily: ff.regular }]}>Loading history…</Text>
            </View>
          ) : history.length === 0 ? (
            <View style={styles.emptyBox}>
              <Image source={Lola.shrug} style={styles.emptyLola} resizeMode="contain" />
              <Text style={[styles.emptyTitle, { fontFamily: ff.semibold }]}>
                Patterns will start to appear after a few completed days.
              </Text>
              <Text style={[styles.emptyDesc, { fontFamily: ff.regular }]}>
                Use &quot;End the day&quot; on the Today screen when your day is done.
                Each saved day is stored in your history and will shape your
                insights over time.
              </Text>
            </View>
          ) : (
            <>
              {hasMixed ? (
                <View style={styles.mixedNotice}>
                  <MaterialIcons
                    name="info-outline"
                    size={16}
                    color={Colors.accent}
                  />
                  <Text style={[styles.mixedNoticeText, { fontFamily: ff.regular }]}>
                    You have used more than one energy tracking style. Insights are
                    shown separately for accuracy — battery days and spoon days are
                    never merged.
                  </Text>
                </View>
              ) : null}

              {spoonInsights.days.length > 0 ? (
                <InsightSection insights={spoonInsights} />
              ) : null}

              {batteryInsights.days.length > 0 ? (
                <InsightSection insights={batteryInsights} />
              ) : null}
            </>
          )}
        </View>

        <View style={{ height: insets.bottom + Spacing.xl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    paddingBottom: Spacing.xxxl,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: Fonts.bold,
    color: Colors.text,
    letterSpacing: -0.5,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSizes.base,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSizes.md,
    fontWeight: Fonts.semibold,
    color: Colors.text,
    marginBottom: Spacing.md,
    letterSpacing: -0.2,
  },
  glanceGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  glanceCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  glanceCardFlare: {
    backgroundColor: Colors.flareFaint,
    borderColor: Colors.flare,
  },
  glanceValue: {
    fontSize: FontSizes.xl,
    fontWeight: Fonts.bold,
    color: Colors.primary,
    marginBottom: 4,
  },
  glanceFlareValue: {
    color: Colors.flare,
  },
  glanceLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textSubtle,
    textAlign: 'center',
    lineHeight: 16,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  tagChip: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagChipText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    fontWeight: Fonts.medium,
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  refreshBtn: {
    padding: 4,
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  loadingText: {
    fontSize: FontSizes.sm,
    color: Colors.textSubtle,
  },
  emptyBox: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primaryFaint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyLola: {
    width: 120,
    height: 130,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSizes.base,
    fontWeight: Fonts.semibold,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
    lineHeight: 24,
  },
  emptyDesc: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  mixedNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.accentFaint,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mixedNoticeText: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.accent,
    lineHeight: 20,
  },
});
