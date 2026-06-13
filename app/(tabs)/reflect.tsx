import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, Fonts, Radius } from '@/constants/theme';
import { useDay } from '@/hooks/useDay';
import { useAlert } from '@/template';
import { formatCost } from '@/services/formatCost';
import { loadHistory } from '@/services/storage';
import { useFontFamily } from '@/hooks/useFontFamily';
import { DayState } from '@/constants/types';
import { Lola } from '@/constants/lola';

// ─── Prompt Input Component ───────────────────────────────────────────────────

function PromptInput({
  prompt,
  value,
  onChangeText,
  readOnly,
}: {
  prompt: string;
  value: string;
  onChangeText?: (t: string) => void;
  readOnly?: boolean;
}) {
  return (
    <View style={promptStyles.container}>
      <Text style={promptStyles.label}>{prompt}</Text>
      {readOnly ? (
        value ? (
          <View style={promptStyles.readOnlyBox}>
            <Text style={promptStyles.readOnlyText}>{value}</Text>
          </View>
        ) : (
          <View style={promptStyles.readOnlyBox}>
            <Text style={promptStyles.readOnlyEmpty}>Not answered</Text>
          </View>
        )
      ) : (
        <TextInput
          style={promptStyles.input}
          value={value}
          onChangeText={onChangeText}
          multiline
          numberOfLines={3}
          placeholder="..."
          placeholderTextColor={Colors.textSubtle}
          textAlignVertical="top"
        />
      )}
    </View>
  );
}

const promptStyles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    fontWeight: Fonts.medium,
    marginBottom: Spacing.sm,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: FontSizes.base,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 80,
    lineHeight: 22,
  },
  readOnlyBox: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 56,
  },
  readOnlyText: {
    fontSize: FontSizes.base,
    color: Colors.textMuted,
    lineHeight: 22,
  },
  readOnlyEmpty: {
    fontSize: FontSizes.sm,
    color: Colors.textSubtle,
    fontStyle: 'italic',
  },
});

// ─── Summary Stats Row ────────────────────────────────────────────────────────

function SummaryRow({
  dayData,
  used,
  remaining,
}: {
  dayData: DayState;
  used: number;
  remaining: number;
}) {
  const completedTasks = dayData.tasks.filter((t) => t.status === 'completed');
  const usedDisplay = formatCost(used, dayData.energyMode, { short: true });
  const remainingDisplay = formatCost(remaining, dayData.energyMode, { short: true });

  return (
    <View style={styles.summaryRow}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryValue}>{completedTasks.length}</Text>
        <Text style={styles.summaryLabel}>done</Text>
      </View>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryValue}>{usedDisplay}</Text>
        <Text style={styles.summaryLabel}>used</Text>
      </View>
      <View style={styles.summaryCard}>
        <Text
          style={[
            styles.summaryValue,
            dayData.isFlareDay && styles.flareValue,
          ]}
        >
          {remainingDisplay}
        </Text>
        <Text style={styles.summaryLabel}>left</Text>
      </View>
    </View>
  );
}

// ─── Read-Only Past Day View ──────────────────────────────────────────────────

function PastDayView({ pastDay }: { pastDay: DayState }) {
  const insets = useSafeAreaInsets();
  const ff = useFontFamily();

  const completedTasks = pastDay.tasks.filter((t) => t.status === 'completed');
  const used = completedTasks.reduce(
    (sum, t) => sum + (t.completedCost ?? t.effectiveCost ?? t.baseCost),
    0
  );
  const remaining = Math.max(0, pastDay.energyLevel - used);

  function formatDate(dateStr: string): string {
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Reflection</Text>
          <View style={styles.pastDayBadge}>
            <MaterialIcons name="history" size={13} color={Colors.accent} />
            <Text style={styles.pastDayBadgeText}>{formatDate(pastDay.date)}</Text>
          </View>
          <Text style={styles.subtitle}>
            {pastDay.isFlareDay
              ? 'Getting through that day counted.'
              : 'A look back at how that day went.'}
          </Text>
        </View>

        {/* Summary */}
        <SummaryRow dayData={pastDay} used={used} remaining={remaining} />

        {/* Lola, taking a seat */}
        <Image source={Lola.sitting} style={styles.lola} resizeMode="contain" />

        {/* Flare card */}
        {pastDay.isFlareDay ? (
          <View style={[styles.section, styles.flareCard]}>
            <Text style={styles.flareCardText}>
              This was a flare day. Getting through it at all is enough.
              {'\n'}Rest is not failure. Rest is medicine.
            </Text>
          </View>
        ) : null}

        {/* Tags */}
        {pastDay.tags.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How you felt</Text>
            <View style={styles.tagsRow}>
              {pastDay.tags.map((tag) => (
                <View key={tag} style={styles.tagChip}>
                  <Text style={[styles.tagChipText, { fontFamily: ff.medium }]}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Completed tasks */}
        {completedTasks.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What you did</Text>
            <View style={styles.completedList}>
              {completedTasks.map((t, i) => {
                const rawCost = t.completedCost ?? t.effectiveCost;
                const costDisplay = formatCost(rawCost, pastDay.energyMode);
                return (
                  <View
                    key={t.id}
                    style={[
                      styles.completedItem,
                      i === completedTasks.length - 1 && styles.completedItemLast,
                    ]}
                  >
                    <Text style={styles.completedName}>{t.name}</Text>
                    <Text style={styles.completedCost}>{costDisplay}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.emptyCompleted}>
              <Text style={styles.emptyCompletedText}>
                You existed that day. That matters.
              </Text>
            </View>
          </View>
        )}

        {/* Journal */}
        {pastDay.journalEntry ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Journal</Text>
            <View style={styles.journalReadOnly}>
              <Text style={styles.journalReadOnlyText}>{pastDay.journalEntry}</Text>
            </View>
          </View>
        ) : null}

        {/* Guided prompts — read-only */}
        {(pastDay.guidedPrompts?.drained ||
          pastDay.guidedPrompts?.helped ||
          pastDay.guidedPrompts?.notDone ||
          pastDay.guidedPrompts?.symptoms) ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Guided prompts</Text>
            <PromptInput
              prompt="What drained you most?"
              value={pastDay.guidedPrompts?.drained ?? ''}
              readOnly
            />
            <PromptInput
              prompt="What helped or felt easier?"
              value={pastDay.guidedPrompts?.helped ?? ''}
              readOnly
            />
            <PromptInput
              prompt="What did not get done — and that is okay."
              value={pastDay.guidedPrompts?.notDone ?? ''}
              readOnly
            />
            <PromptInput
              prompt="Any symptom changes to note?"
              value={pastDay.guidedPrompts?.symptoms ?? ''}
              readOnly
            />
          </View>
        ) : null}

        <View style={{ height: insets.bottom + Spacing.xl }} />
      </ScrollView>
    </View>
  );
}

// ─── No History Empty State ───────────────────────────────────────────────────

function EmptyReflectView() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.emptyRoot}>
        <View style={styles.header}>
          <Text style={styles.title}>Reflect</Text>
        </View>
        <View style={styles.emptyBox}>
          <View style={styles.emptyIconCircle}>
            <MaterialIcons name="edit-note" size={28} color={Colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Your reflections will appear here.</Text>
          <Text style={styles.emptyDesc}>
            Once you finish a day, you will be able to look back here anytime.
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ReflectScreen() {
  const insets = useSafeAreaInsets();
  const { day, energyUsed, energyRemaining, saveJournal } = useDay();
  const { showAlert } = useAlert();
  const ff = useFontFamily();

  // Local editable state for the active day
  const [journal, setJournal] = useState(day?.journalEntry ?? '');
  const [drained, setDrained] = useState(day?.guidedPrompts?.drained ?? '');
  const [helped, setHelped] = useState(day?.guidedPrompts?.helped ?? '');
  const [notDone, setNotDone] = useState(day?.guidedPrompts?.notDone ?? '');
  const [symptoms, setSymptoms] = useState(day?.guidedPrompts?.symptoms ?? '');

  // Past day fallback — loaded from history when no active day
  const [pastDay, setPastDay] = useState<DayState | null>(null);
  const [loadingPast, setLoadingPast] = useState(false);

  // Sync local state when active day date changes
  useEffect(() => {
    if (day) {
      setJournal(day.journalEntry ?? '');
      setDrained(day.guidedPrompts?.drained ?? '');
      setHelped(day.guidedPrompts?.helped ?? '');
      setNotDone(day.guidedPrompts?.notDone ?? '');
      setSymptoms(day.guidedPrompts?.symptoms ?? '');
    }
  }, [day?.date]);

  // Load most recent completed day from history when no active day exists (or day not yet started)
  useEffect(() => {
    if (day && day.checkedIn) return; // active started day takes precedence
    setLoadingPast(true);
    loadHistory().then((history) => {
      setPastDay(history.length > 0 ? history[0] : null);
      setLoadingPast(false);
    });
  }, [day]);

  // ── Case 1: No active day OR day not yet started — show past or empty ────────

  if (!day || !day.checkedIn) {
    if (loadingPast) {
      return (
        <View style={[styles.root, styles.centerContent, { paddingTop: insets.top }]}>
          <ActivityIndicator color={Colors.primary} size="small" />
        </View>
      );
    }
    if (pastDay) {
      return <PastDayView pastDay={pastDay} />;
    }
    return <EmptyReflectView />;
  }

  // ── Case 2: Active day — full editable reflection ───────────────────────────

  const completedTasks = day.tasks.filter((t) => t.status === 'completed');

  function handleSave() {
    saveJournal(journal, { drained, helped, notDone, symptoms });
    showAlert('Saved', 'Your reflection has been saved.');
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { fontFamily: ff.bold }]}>End of day</Text>
            <Text style={[styles.subtitle, { fontFamily: ff.regular }]}>
              {day.isFlareDay
                ? 'Getting through today counts.'
                : 'A gentle look at how today went.'}
            </Text>
          </View>

          {/* Summary */}
          <SummaryRow dayData={day} used={energyUsed} remaining={energyRemaining} />

          {/* Lola, taking a seat */}
          <Image source={Lola.sitting} style={styles.lola} resizeMode="contain" />

          {/* Flare day card */}
          {day.isFlareDay ? (
            <View style={[styles.section, styles.flareCard]}>
              <Text style={styles.flareCardText}>
                This was a flare day. Getting through it at all is enough.
                {'\n'}Rest is not failure. Rest is medicine.
              </Text>
            </View>
          ) : null}

          {/* Tags */}
          {day.tags.length > 0 ? (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { fontFamily: ff.semibold }]}>How you felt today</Text>
              <View style={styles.tagsRow}>
                {day.tags.map((tag) => (
                  <View key={tag} style={styles.tagChip}>
                    <Text style={[styles.tagChipText, { fontFamily: ff.medium }]}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* What you did */}
          {completedTasks.length > 0 ? (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { fontFamily: ff.semibold }]}>What you did today</Text>
              <View style={styles.completedList}>
                {completedTasks.map((t, i) => {
                  const rawCost = t.completedCost ?? t.effectiveCost;
                  const costDisplay = formatCost(rawCost, day.energyMode);
                  return (
                    <View
                      key={t.id}
                      style={[
                        styles.completedItem,
                        i === completedTasks.length - 1 && styles.completedItemLast,
                      ]}
                    >
                      <Text style={[styles.completedName, { fontFamily: ff.regular }]}>{t.name}</Text>
                      <Text style={[styles.completedCost, { fontFamily: ff.regular }]}>{costDisplay}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : (
            <View style={styles.section}>
              <View style={styles.emptyCompleted}>
                <Text style={[styles.emptyCompletedText, { fontFamily: ff.regular }]}>
                  You existed today. That matters.
                </Text>
              </View>
            </View>
          )}

          {/* Free journal */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { fontFamily: ff.semibold }]}>Write anything about today</Text>
            <Text style={[styles.sectionSubtitle, { fontFamily: ff.regular }]}>Optional. Just for you.</Text>
            <TextInput
              style={styles.journalInput}
              value={journal}
              onChangeText={setJournal}
              multiline
              numberOfLines={6}
              placeholder="Whatever comes to mind..."
              placeholderTextColor={Colors.textSubtle}
              textAlignVertical="top"
            />
          </View>

          {/* Guided prompts */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { fontFamily: ff.semibold }]}>Guided prompts</Text>
            <Text style={[styles.sectionSubtitle, { fontFamily: ff.regular }]}>Answer any, all, or none.</Text>

            <PromptInput
              prompt="What drained you most today?"
              value={drained}
              onChangeText={setDrained}
            />
            <PromptInput
              prompt="What helped or felt easier?"
              value={helped}
              onChangeText={setHelped}
            />
            <PromptInput
              prompt="What did not get done — and that is okay."
              value={notDone}
              onChangeText={setNotDone}
            />
            <PromptInput
              prompt="Any symptom changes to note?"
              value={symptoms}
              onChangeText={setSymptoms}
            />
          </View>

          {/* Save */}
          <Pressable
            style={({ pressed }) => [
              styles.saveBtn,
              pressed && { opacity: 0.85 },
            ]}
            onPress={handleSave}
          >
            <Text style={[styles.saveBtnText, { fontFamily: ff.semibold }]}>Save reflection</Text>
          </Pressable>

          <View style={{ height: insets.bottom + Spacing.xl }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyRoot: {
    flex: 1,
  },
  scroll: {
    paddingBottom: Spacing.xxxl,
  },
  lola: {
    width: 150,
    height: 160,
    alignSelf: 'center',
    marginVertical: Spacing.md,
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
    marginBottom: Spacing.sm,
  },
  pastDayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.accentFaint,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.border,
    alignSelf: 'flex-start',
    marginBottom: Spacing.sm,
  },
  pastDayBadgeText: {
    fontSize: FontSizes.xs,
    color: Colors.accent,
    fontWeight: Fonts.medium,
  },
  subtitle: {
    fontSize: FontSizes.base,
    color: Colors.textMuted,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryValue: {
    fontSize: FontSizes.xl,
    fontWeight: Fonts.bold,
    color: Colors.primary,
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  flareValue: {
    color: Colors.flare,
  },
  summaryLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textSubtle,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  flareCard: {
    backgroundColor: Colors.flareFaint,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.flare,
    marginHorizontal: Spacing.lg,
  },
  flareCardText: {
    fontSize: FontSizes.base,
    color: Colors.flare,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: FontSizes.md,
    fontWeight: Fonts.semibold,
    color: Colors.text,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSubtle,
    marginBottom: Spacing.md,
  },
  tagsRow: {
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
  completedList: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  completedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  completedItemLast: {
    borderBottomWidth: 0,
  },
  completedName: {
    fontSize: FontSizes.base,
    color: Colors.textSubtle,
    textDecorationLine: 'line-through',
    flex: 1,
  },
  completedCost: {
    fontSize: FontSizes.sm,
    color: Colors.textSubtle,
    marginLeft: Spacing.md,
  },
  emptyCompleted: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyCompletedText: {
    fontSize: FontSizes.base,
    color: Colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 24,
  },
  journalInput: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: FontSizes.base,
    color: Colors.text,
    borderWidth: 1.5,
    borderColor: Colors.border,
    minHeight: 140,
    lineHeight: 24,
  },
  journalReadOnly: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 80,
  },
  journalReadOnlyText: {
    fontSize: FontSizes.base,
    color: Colors.textMuted,
    lineHeight: 24,
  },
  saveBtn: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: FontSizes.base,
    fontWeight: Fonts.semibold,
    color: Colors.background,
  },
  emptyBox: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryFaint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
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
});
