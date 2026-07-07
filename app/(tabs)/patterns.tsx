
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Text } from '@/components/ui/AppText';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, Fonts, Radius } from '@/constants/theme';
import { useDay } from '@/hooks/useDay';
import { useFontFamily } from '@/hooks/useFontFamily';
import { loadHistory } from '@/services/storage';
import { DayState, EnergyMode } from '@/constants/types';
import { formatCost } from '@/services/formatCost';
import { Lola } from '@/constants/lola';
import { formatDateStringForRegion } from '@/services/regionFormat';
import { AssistantHero } from '@/components/ui/AssistantHero';
import { ObservationCard } from '@/components/ui/ObservationCard';
import { SectionBlock } from '@/components/ui/SectionBlock';
import { ActionTile } from '@/components/ui/ActionTile';
import { EmptyState } from '@/components/ui/primitives/EmptyState';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

function formatDate(dateStr: string): string {
  return formatDateStringForRegion(dateStr, 'short');
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


type Observation = {
  text: string;
  confidenceLabel?: string;
  actionLabel?: string;
  onPress?: () => void;
};

function buildObservationCards(
  allDays: DayState[],
  insightsByMode: ModeInsights[],
  onOpenReport: () => void
): Observation[] {
  const observations: Observation[] = [];
  const days = allDays.slice(0, 30);
  const totalDays = days.length;
  const flareDays = days.filter((d) => d.isFlareDay).length;
  const movedCount = days.flatMap((d) => d.tasks).filter((t) => t.status === 'moved').length;
  const commonTag = insightsByMode
    .flatMap((insights) => insights.commonTags)
    .sort((a, b) => b.count - a.count)[0];
  const topTask = insightsByMode
    .map((insights) => insights.topTask ? { ...insights.topTask, mode: insights.mode } : null)
    .filter((task): task is { name: string; avgCost: number; mode: EnergyMode } => task !== null)
    .sort((a, b) => b.avgCost - a.avgCost)[0];

  if (topTask) {
    observations.push({
      text: `${topTask.name} seems to be one of your heavier tasks lately. It may be worth making it smaller.`,
      confidenceLabel: 'task pattern',
    });
  }

  if (commonTag && commonTag.count >= 2) {
    observations.push({
      text: `${commonTag.tag} has shown up often in your recent history. Hassle will keep holding that context for you.`,
      confidenceLabel: 'recent tag',
    });
  }

  if (movedCount >= 2) {
    observations.push({
      text: `You moved tasks forward ${movedCount} times recently. A smaller plan may help.`,
      confidenceLabel: 'task friction',
    });
  }

  if (flareDays > 0) {
    observations.push({
      text: `${flareDays} ${flareDays === 1 ? 'day has' : 'days have'} been marked as flare ${flareDays === 1 ? 'time' : 'times'} recently. That may be useful context for pacing.`,
      confidenceLabel: 'flare context',
    });
  }

  if (totalDays >= 7) {
    observations.push({
      text: 'You have enough recent history for a useful doctor report.',
      confidenceLabel: 'report ready',
      actionLabel: 'Preview doctor report',
      onPress: onOpenReport,
    });
  }

  if (observations.length === 0 && totalDays > 0) {
    observations.push({
      text: 'A few details are here already. Hassle needs a little more time before naming patterns.',
      confidenceLabel: 'early signal',
    });
  }

  return observations.slice(0, 4);
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
  const router = useRouter();
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
  }, [taskCount, doneCount, reload]);

  const batteryDays = history.filter((d) => d.energyMode === 'battery');
  const spoonDays = history.filter((d) => d.energyMode === 'spoon');
  const hasMixed = batteryDays.length > 0 && spoonDays.length > 0;

  const batteryInsights = buildInsights(history, 'battery');
  const spoonInsights = buildInsights(history, 'spoon');

  function openReport() {
    router.push('/report' as any);
  }

  const observations = buildObservationCards(history, [spoonInsights, batteryInsights], openReport);

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
        <AssistantHero
          title="What we noticed."
          subtitle="One thing at a time."
          lola={Lola.books}
        />

        {/* Lead observation — shown prominently before anything else */}
        {!loading && observations.length > 0 ? (
          <View style={styles.leadObservation}>
            <Text style={[styles.leadLabel, { fontFamily: ff.regular }]}>Something small I've seen…</Text>
            <Text style={[styles.leadText, { fontFamily: ff.regular }]}>{observations[0].text}</Text>
            {observations[0].actionLabel ? (
              <Pressable
                onPress={observations[0].onPress}
                style={({ pressed }) => [styles.leadAction, pressed && { opacity: 0.7 }]}
                accessibilityRole="button"
              >
                <Text style={[styles.leadActionText, { fontFamily: ff.semibold }]}>
                  {observations[0].actionLabel}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {/* History insights */}
        <SectionBlock
          title="Hassle noticed"
          action={
            <Pressable
              onPress={reload}
              style={({ pressed }) => [
                styles.refreshBtn,
                pressed && { opacity: 0.7 },
              ]}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Refresh insights"
            >
              <MaterialIcons name="refresh" size={18} color={Colors.textSubtle} />
            </Pressable>
          }
        >
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={Colors.primary} size="small" />
              <Text style={[styles.loadingText, { fontFamily: ff.regular }]}>Loading history…</Text>
            </View>
          ) : history.length === 0 ? (
            <EmptyState
              lola={Lola.shrug}
              title="I need a few days to notice patterns."
              body="No pressure. Just use Hassle when it helps."
            />
          ) : (
            <>
              {observations.length > 1 ? (
                <View style={styles.observationStack}>
                  {observations.slice(1).map((observation) => (
                    <ObservationCard
                      key={`${observation.confidenceLabel}-${observation.text}`}
                      text={observation.text}
                      confidenceLabel={observation.confidenceLabel}
                      actionLabel={observation.actionLabel}
                      onPress={observation.onPress}
                      style={styles.observationCard}
                    />
                  ))}
                </View>
              ) : null}

              {history.length >= 7 ? (
                <View style={styles.reportTileWrap}>
                  <ActionTile
                    title="Doctor report ready"
                    body="Preview your recent appointment summary."
                    icon={<MaterialIcons name="picture-as-pdf" size={22} color={Colors.accent} />}
                    onPress={openReport}
                    style={styles.reportTile}
                  />
                </View>
              ) : null}

              {hasMixed ? (
                <View style={styles.mixedNotice}>
                  <MaterialIcons
                    name="info-outline"
                    size={16}
                    color={Colors.accent}
                  />
                  <Text style={[styles.mixedNoticeText, { fontFamily: ff.regular }]}>
                    You have used more than one energy tracking style. Supporting details are
                    shown separately for accuracy — battery days and spoon days are
                    never merged.
                  </Text>
                </View>
              ) : null}

              <Text style={[styles.supportingTitle, { fontFamily: ff.regular }]}>Supporting details</Text>

              {spoonInsights.days.length > 0 ? (
                <InsightSection insights={spoonInsights} />
              ) : null}

              {batteryInsights.days.length > 0 ? (
                <InsightSection insights={batteryInsights} />
              ) : null}
            </>
          )}
        </SectionBlock>

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
  observationStack: {
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  observationCard: {
    marginHorizontal: 0,
    marginBottom: 0,
  },
  reportTileWrap: {
    marginBottom: Spacing.md,
  },
  reportTile: {
    flexBasis: 'auto',
    width: '100%',
  },
  supportingTitle: {
    fontSize: FontSizes.sm,
    fontWeight: Fonts.medium,
    color: Colors.textSubtle,
    marginBottom: Spacing.md,
    letterSpacing: 0.3,
    textTransform: 'uppercase' as const,
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
  leadObservation: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  leadLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textSubtle,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  leadText: {
    fontSize: FontSizes.md,
    color: Colors.text,
    lineHeight: 34,
    letterSpacing: -0.2,
  },
  leadAction: {
    marginTop: Spacing.md,
  },
  leadActionText: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
  },
});
