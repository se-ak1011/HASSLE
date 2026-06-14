import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Image, ActivityIndicator } from 'react-native';
import { Text } from '@/components/ui/AppText';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, Radius } from '@/constants/theme';
import { useFontFamily } from '@/hooks/useFontFamily';
import { useAlert } from '@/template';
import { Lola } from '@/constants/lola';
import {
  loadClinicalSummary,
  exportClinicalReport,
  printClinicalReport,
  formatEnergyUnit,
  ClinicalSummary,
} from '@/services/exportService';

const RANGE_DAYS = 30;

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

  const stats = summary
    ? [
        { label: 'days tracked', value: String(summary.daysFound) },
        { label: 'avg energy at start', value: formatEnergyUnit(summary.avgEnergyStarted, summary.energyMode) },
        { label: 'avg energy used', value: formatEnergyUnit(summary.avgEnergyUsed, summary.energyMode) },
        { label: 'flare days', value: `${summary.totalFlareDays} (${summary.flarePercent}%)` },
        { label: 'tasks completed', value: String(summary.totalTasksCompleted) },
        { label: 'symptom notes', value: String(summary.symptomNoteCount) },
      ]
    : [];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back">
          <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { fontFamily: ff.semibold }]}>Doctor-visit report</Text>
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
        ) : !summary ? (
          // ── Empty state ─────────────────────────────────────────────────
          <View style={styles.empty}>
            <Image source={Lola.report} style={styles.emptyLola} resizeMode="contain" />
            <Text style={[styles.emptyTitle, { fontFamily: ff.bold }]}>Nothing here yet</Text>
            <Text style={[styles.emptyBody, { fontFamily: ff.regular }]}>
              Complete and end at least one day, and your report will appear here — ready to preview,
              print, or save as a PDF for appointments.
            </Text>
          </View>
        ) : (
          // ── Preview ─────────────────────────────────────────────────────
          <>
            <View style={styles.hero}>
              <Image source={Lola.report} style={styles.heroImg} resizeMode="contain" />
            </View>
            <Text style={[styles.rangeLabel, { fontFamily: ff.semibold }]}>Last {RANGE_DAYS} days</Text>
            <Text style={[styles.rangeSub, { fontFamily: ff.regular }]}>{summary.dateRange}</Text>

            <View style={styles.grid}>
              {stats.map((s) => (
                <View key={s.label} style={styles.statCard}>
                  <Text style={[styles.statValue, { fontFamily: ff.bold }]}>{s.value}</Text>
                  <Text style={[styles.statLabel, { fontFamily: ff.regular }]}>{s.label}</Text>
                </View>
              ))}
            </View>

            {summary.topTags.length > 0 ? (
              <View style={styles.tagsBlock}>
                <Text style={[styles.blockLabel, { fontFamily: ff.medium }]}>Most common tags</Text>
                <View style={styles.tagsRow}>
                  {summary.topTags.map((t) => (
                    <View key={t.tag} style={styles.tagChip}>
                      <Text style={[styles.tagChipText, { fontFamily: ff.medium }]}>
                        {t.tag} · {t.count}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {summary.mostDemandingTask ? (
              <Text style={[styles.demanding, { fontFamily: ff.regular }]}>
                Most demanding task: <Text style={{ fontFamily: ff.semibold }}>{summary.mostDemandingTask}</Text>
              </Text>
            ) : null}

            <View style={styles.previewNote}>
              <MaterialIcons name="info-outline" size={15} color={Colors.textSubtle} />
              <Text style={[styles.previewNoteText, { fontFamily: ff.regular }]}>
                This is a summary preview. The PDF also includes a full day-by-day log and your
                symptom &amp; reflection notes.
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
              onPress={handleSave}
              disabled={busy !== null}
            >
              {busy === 'save' ? (
                <ActivityIndicator size="small" color={Colors.background} />
              ) : (
                <>
                  <MaterialIcons name="picture-as-pdf" size={18} color={Colors.background} />
                  <Text style={[styles.primaryBtnText, { fontFamily: ff.semibold }]}>Save as PDF</Text>
                </>
              )}
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.85 }]}
              onPress={handlePrint}
              disabled={busy !== null}
            >
              {busy === 'print' ? (
                <ActivityIndicator size="small" color={Colors.text} />
              ) : (
                <>
                  <MaterialIcons name="print" size={18} color={Colors.text} />
                  <Text style={[styles.secondaryBtnText, { fontFamily: ff.semibold }]}>Print</Text>
                </>
              )}
            </Pressable>

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
  },
  headerTitle: { fontSize: FontSizes.lg, color: Colors.text },
  scroll: { paddingHorizontal: Spacing.lg },
  center: { paddingTop: Spacing.xxl, alignItems: 'center' },
  // Empty
  empty: { alignItems: 'center', paddingTop: Spacing.xl },
  emptyLola: { width: 170, height: 190, marginBottom: Spacing.md },
  emptyTitle: { fontSize: FontSizes.xl, color: Colors.text, marginBottom: Spacing.sm },
  emptyBody: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
  },
  // Preview
  hero: { alignItems: 'center', marginTop: Spacing.sm },
  heroImg: { width: 130, height: 140 },
  rangeLabel: { fontSize: FontSizes.lg, color: Colors.text, textAlign: 'center', marginTop: Spacing.sm },
  rangeSub: { fontSize: FontSizes.sm, color: Colors.textMuted, textAlign: 'center', marginBottom: Spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  statCard: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 100,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  statValue: { fontSize: FontSizes.lg, color: Colors.text },
  statLabel: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 2 },
  tagsBlock: { marginTop: Spacing.lg },
  blockLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: Spacing.sm,
  },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  tagChip: {
    backgroundColor: Colors.accentFaint,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagChipText: { fontSize: FontSizes.sm, color: Colors.accent },
  demanding: { fontSize: FontSizes.sm, color: Colors.textMuted, marginTop: Spacing.lg },
  previewNote: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  previewNoteText: { flex: 1, fontSize: FontSizes.sm, color: Colors.textMuted, lineHeight: 20 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
  },
  primaryBtnText: { fontSize: FontSizes.base, color: Colors.background },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
  },
  secondaryBtnText: { fontSize: FontSizes.base, color: Colors.text },
  disclaimer: {
    fontSize: FontSizes.xs,
    color: Colors.textSubtle,
    lineHeight: 17,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
});
