import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Image, ActivityIndicator } from 'react-native';
import { Text } from '@/components/ui/AppText';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, FontSizes, Radius } from '@/constants/theme';
import { useFontFamily } from '@/hooks/useFontFamily';
import { useAlert } from '@/template';
import { Companion } from '@/constants/companion';
import { ReportReadyCard } from '@/components/ui/ReportReadyCard';
import {
  loadClinicalSummary,
  exportClinicalReport,
  printClinicalReport,
  formatEnergyUnit,
  ClinicalSummary,
} from '@/services/exportService';

const RANGE_DAYS = 30;
/** Minimum days of history before the report is considered "ready". */
const MIN_DAYS_READY = 7;

export default function ReportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const ff = useFontFamily();
  const { showAlert } = useAlert();

  const [summary, setSummary] = useState<ClinicalSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<'save' | 'print' | null>(null);

  useEffect(() => {
    loadClinicalSummary(RANGE_DAYS)
      .then(setSummary)
      .finally(() => setLoading(false));
  }, []);

  function handleResult(result: { success: boolean; error?: string }) {
    if (result.success) return;
    if (result.error === 'sharing_unavailable') {
      showAlert('Sharing not available', 'Your device does not support file sharing.');
    } else if (result.error !== 'no_data') {
      showAlert('Something went wrong', 'Could not generate the report. Please try again.');
    }
  }

  async function handleSave() {
    if (busy) return;
    setBusy('save');
    try {
      handleResult(await exportClinicalReport(RANGE_DAYS));
    } finally {
      setBusy(null);
    }
  }

  async function handlePrint() {
    if (busy) return;
    setBusy('print');
    try {
      handleResult(await printClinicalReport(RANGE_DAYS));
    } finally {
      setBusy(null);
    }
  }

  // Treat null summary (no history yet) the same as building with 0 days —
  // the report grows over time; we never hard-block the screen.
  const daysFound = summary?.daysFound ?? 0;
  const reportStatus = daysFound < MIN_DAYS_READY ? 'building' : 'ready';

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back">
          <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { fontFamily: ff.semibold }]}>Appointment summary</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.primary} />
          </View>

        ) : reportStatus === 'building' ? (
          // ── Growing report — always shown, even on day 0 ─────────────────────
          <View style={styles.stateBlock}>
            <Image source={Companion.Report} style={styles.lolaImg} resizeMode="contain" />
            <Text style={[styles.stateTitle, { fontFamily: ff.bold }]}>
              {daysFound === 0
                ? 'Hassle is beginning to understand your days.'
                : 'Your report is growing.'}
            </Text>
            <Text style={[styles.stateBody, { fontFamily: ff.regular }]}>
              {daysFound === 0
                ? 'Keep using Hassle naturally — I\'ll be quietly paying attention. Your appointment summary will be ready in a few days.'
                : `I've started recognising patterns from your ${daysFound} ${daysFound === 1 ? 'day' : 'days'} so far. Keep using Hassle naturally — your appointment summary will be ready soon.`}
            </Text>
            <View style={styles.progressRow}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(100, (daysFound / MIN_DAYS_READY) * 100)}%` as any },
                  ]}
                />
              </View>
              <Text style={[styles.progressLabel, { fontFamily: ff.medium }]}>
                {daysFound} / {MIN_DAYS_READY} days
              </Text>
            </View>
            <View style={styles.miniGrid}>
              <View style={styles.miniStat}>
                <Text style={[styles.miniValue, { fontFamily: ff.bold }]}>{daysFound}</Text>
                <Text style={[styles.miniLabel, { fontFamily: ff.regular }]}>days tracked</Text>
              </View>
              <View style={styles.miniStat}>
                <Text style={[styles.miniValue, { fontFamily: ff.bold }]}>{summary?.totalFlareDays ?? 0}</Text>
                <Text style={[styles.miniLabel, { fontFamily: ff.regular }]}>flare days</Text>
              </View>
              <View style={styles.miniStat}>
                <Text style={[styles.miniValue, { fontFamily: ff.bold }]}>{summary?.totalTasksCompleted ?? 0}</Text>
                <Text style={[styles.miniLabel, { fontFamily: ff.regular }]}>tasks done</Text>
              </View>
            </View>
            {summary?.topTags && summary.topTags.length > 0 ? (
              <View style={styles.miniTagsBlock}>
                <Text style={[styles.miniTagsLabel, { fontFamily: ff.medium }]}>Recent tags</Text>
                <View style={styles.miniTagsRow}>
                  {summary.topTags.slice(0, 4).map((t) => (
                    <View key={t.tag} style={styles.miniTag}>
                      <Text style={[styles.miniTagText, { fontFamily: ff.medium }]}>{t.tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </View>

        ) : (
          // ── Report ready ─────────────────────────────────────────────────────
          <>
            {/* Opening question */}
            <View style={styles.heroBlock}>
              <Image source={Companion.Report} style={styles.heroLola} resizeMode="contain" />
              <Text style={[styles.heroQuestion, { fontFamily: ff.bold }]}>
                Ready to see what we&apos;ve collected?
              </Text>
            </View>

            <ReportReadyCard
              status="ready"
              title="Your appointment summary is ready."
              subtitle="Hassle has been quietly paying attention."
              dateRange={`${summary!.dateRange} · ${summary!.daysFound} days`}
              primaryAction={{ label: 'Save as PDF', onPress: handleSave }}
              secondaryAction={{ label: 'Print', onPress: handlePrint }}
              style={styles.readyCard}
            />

            {busy ? (
              <View style={styles.busyRow}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={[styles.busyText, { fontFamily: ff.regular }]}>
                  {busy === 'save' ? 'Preparing your PDF…' : 'Opening print…'}
                </Text>
              </View>
            ) : null}

            {/* ── Preview ───────────────────────────────────────────────────── */}
            <View style={styles.divider} />

            {/* Overview */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { fontFamily: ff.medium }]}>Overview</Text>
              <View style={styles.statGrid}>
                <View style={styles.statCard}>
                  <Text style={[styles.statValue, { fontFamily: ff.bold }]}>{summary!.daysFound}</Text>
                  <Text style={[styles.statLabel, { fontFamily: ff.regular }]}>days tracked</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={[styles.statValue, { fontFamily: ff.bold }]}>{summary!.totalTasksCompleted}</Text>
                  <Text style={[styles.statLabel, { fontFamily: ff.regular }]}>tasks completed</Text>
                </View>
                {summary!.symptomNoteCount > 0 ? (
                  <View style={styles.statCard}>
                    <Text style={[styles.statValue, { fontFamily: ff.bold }]}>{summary!.symptomNoteCount}</Text>
                    <Text style={[styles.statLabel, { fontFamily: ff.regular }]}>days with notes</Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* Energy */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { fontFamily: ff.medium }]}>Energy</Text>
              <View style={styles.statGrid}>
                <View style={styles.statCard}>
                  <Text style={[styles.statValue, { fontFamily: ff.bold }]}>
                    {formatEnergyUnit(summary!.avgEnergyStarted, summary!.energyMode)}
                  </Text>
                  <Text style={[styles.statLabel, { fontFamily: ff.regular }]}>avg at start of day</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={[styles.statValue, { fontFamily: ff.bold }]}>
                    {formatEnergyUnit(summary!.avgEnergyUsed, summary!.energyMode)}
                  </Text>
                  <Text style={[styles.statLabel, { fontFamily: ff.regular }]}>avg used per day</Text>
                </View>
              </View>
            </View>

            {/* Flare */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { fontFamily: ff.medium }]}>Flare overview</Text>
              <View style={styles.statGrid}>
                <View style={styles.statCard}>
                  <Text style={[styles.statValue, { fontFamily: ff.bold }]}>{summary!.totalFlareDays}</Text>
                  <Text style={[styles.statLabel, { fontFamily: ff.regular }]}>flare days</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={[styles.statValue, { fontFamily: ff.bold }]}>{summary!.flarePercent}%</Text>
                  <Text style={[styles.statLabel, { fontFamily: ff.regular }]}>of days tracked</Text>
                </View>
              </View>
            </View>

            {/* Most demanding task */}
            {summary!.mostDemandingTask ? (
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { fontFamily: ff.medium }]}>Task capacity</Text>
                <View style={styles.rowCard}>
                  <Text style={[styles.rowCardLabel, { fontFamily: ff.regular }]}>Most demanding task</Text>
                  <Text style={[styles.rowCardValue, { fontFamily: ff.semibold }]}>
                    {summary!.mostDemandingTask}
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Common tags */}
            {summary!.topTags.length > 0 ? (
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { fontFamily: ff.medium }]}>Patterns noticed</Text>
                <View style={styles.tagsWrap}>
                  {summary!.topTags.map((t) => (
                    <View key={t.tag} style={styles.tagChip}>
                      <Text style={[styles.tagChipText, { fontFamily: ff.medium }]}>
                        {t.tag}
                      </Text>
                      <Text style={[styles.tagChipCount, { fontFamily: ff.regular }]}>
                        {t.count}×
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {/* Notes */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { fontFamily: ff.medium }]}>Notes</Text>
              <Text style={[styles.notesBody, { fontFamily: ff.regular }]}>
                {summary!.symptomNoteCount > 0
                  ? `You added symptom or reflection notes on ${summary!.symptomNoteCount} ${summary!.symptomNoteCount === 1 ? 'day' : 'days'}. These are included in the full PDF.`
                  : 'No symptom or reflection notes were added during this period. You can add them during end-of-day reflection.'}
              </Text>
            </View>

            {/* PDF note */}
            <View style={styles.pdfNote}>
              <MaterialIcons name="info-outline" size={15} color={Colors.textSubtle} />
              <Text style={[styles.pdfNoteText, { fontFamily: ff.regular }]}>
                The PDF also includes a full day-by-day log and your symptom &amp; reflection notes.
              </Text>
            </View>

            {/* Medical disclaimer */}
            <Text style={[styles.disclaimer, { fontFamily: ff.regular }]}>
              Self-reported data to support a conversation with your clinician — not a medical record.
            </Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.hairline,
  },
  headerTitle: { fontSize: FontSizes.base, color: Colors.text },
  scroll: { paddingHorizontal: Spacing.lg },
  center: { paddingTop: Spacing.xxl, alignItems: 'center' },

  // ── State screens ────────────────────────────────────────────────────────────
  stateBlock: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    gap: Spacing.md,
  },
  lolaImg: { width: 150, height: 168, marginBottom: Spacing.sm },
  stateTitle: {
    fontSize: FontSizes.xl,
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  stateBody: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: Spacing.sm,
  },
  hintCard: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    alignSelf: 'stretch',
    marginTop: Spacing.sm,
  },
  hintText: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    lineHeight: 20,
  },
  progressRow: {
    alignSelf: 'stretch',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    backgroundColor: Colors.accent,
    borderRadius: Radius.full,
  },
  progressLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textSubtle,
    textAlign: 'right',
  },
  miniGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignSelf: 'stretch',
    marginTop: Spacing.xs,
  },
  miniStat: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 3,
  },
  miniValue: { fontSize: FontSizes.lg, color: Colors.text },
  miniLabel: { fontSize: FontSizes.xs, color: Colors.textMuted, textAlign: 'center' },
  miniTagsBlock: {
    alignSelf: 'stretch',
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  miniTagsLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textSubtle,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.6,
  },
  miniTagsRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: Spacing.sm,
  },
  miniTag: {
    backgroundColor: Colors.accentFaint,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  miniTagText: { fontSize: FontSizes.xs, color: Colors.accent },

  // ── Ready state ──────────────────────────────────────────────────────────────
  heroBlock: { alignItems: 'center', paddingTop: Spacing.md, paddingBottom: Spacing.md, gap: Spacing.sm },
  heroLola: { width: 110, height: 124 },
  heroQuestion: {
    fontSize: FontSizes.xl,
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: -0.4,
    lineHeight: 34,
    paddingHorizontal: Spacing.lg,
  },
  readyCard: { marginBottom: Spacing.lg },
  busyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  busyText: { fontSize: FontSizes.sm, color: Colors.textMuted },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.hairline,
    marginBottom: Spacing.lg,
  },

  // ── Preview sections ─────────────────────────────────────────────────────────
  section: { marginBottom: Spacing.lg, gap: Spacing.sm },
  sectionLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textSubtle,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: Fonts.medium,
  },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  statCard: {
    flexGrow: 1,
    flexBasis: '45%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  statValue: { fontSize: FontSizes.lg, color: Colors.text },
  statLabel: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 2, lineHeight: 17 },
  rowCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: 4,
  },
  rowCardLabel: { fontSize: FontSizes.xs, color: Colors.textSubtle, textTransform: 'uppercase', letterSpacing: 0.5 },
  rowCardValue: { fontSize: FontSizes.base, color: Colors.text },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.accentFaint,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
  },
  tagChipText: { fontSize: FontSizes.sm, color: Colors.accent },
  tagChipCount: { fontSize: FontSizes.xs, color: Colors.textSubtle },
  notesBody: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    lineHeight: 22,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  pdfNote: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  pdfNoteText: { flex: 1, fontSize: FontSizes.sm, color: Colors.textMuted, lineHeight: 20 },
  disclaimer: {
    fontSize: FontSizes.xs,
    color: Colors.textSubtle,
    lineHeight: 17,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
});
