/**
 * app/onboarding.tsx
 *
 * First-launch onboarding flow.
 * Shown once, then never again.
 *
 * Step 1: Welcome
 * Step 2: Name (optional)
 * Step 3: Pick default daily tasks (multi-select, tap only)
 * Step 4: Enable reminders (optional)
 * Step 5: All set
 *
 * Only the name is typed, and it's fully optional/skippable.
 * Designed for low-energy, brain fog, and ADHD users.
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  Switch,
  Animated,
  Image,
} from 'react-native';
import { Text, TextInput } from '@/components/ui/AppText';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, Fonts, Radius } from '@/constants/theme';
import { useFontFamily } from '@/hooks/useFontFamily';
import { useDay } from '@/hooks/useDay';
import {
  ONBOARDING_TASK_OPTIONS,
  DefaultDailyTask,
  ReminderFrequency,
  REMINDER_FREQUENCY_LABELS,
  PRESET_CONDITIONS,
} from '@/constants/types';
import { Lola } from '@/constants/lola';
import { scheduleReminders } from '@/services/notificationService';

const TOTAL_STEPS = 6;

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const ff = useFontFamily();
  const { completeOnboarding } = useDay();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<DefaultDailyTask[]>([]);

  function toggleCondition(condition: string) {
    setSelectedConditions((prev) =>
      prev.includes(condition) ? prev.filter((c) => c !== condition) : [...prev, condition]
    );
  }
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [frequency, setFrequency] = useState<ReminderFrequency>('low');
  const [finishing, setFinishing] = useState(false);

  function toggleTask(task: DefaultDailyTask) {
    setSelectedTasks((prev) =>
      prev.some((t) => t.name === task.name)
        ? prev.filter((t) => t.name !== task.name)
        : [...prev, task]
    );
  }

  async function handleFinish() {
    if (finishing) return;
    setFinishing(true);

    const finalFrequency: ReminderFrequency = remindersEnabled ? frequency : 'off';

    await completeOnboarding(
      selectedTasks,
      {
        enabled: remindersEnabled,
        frequency: finalFrequency,
      },
      { name, conditions: selectedConditions }
    );

    if (remindersEnabled && finalFrequency !== 'off') {
      await scheduleReminders(finalFrequency);
    }

    router.replace('/(tabs)');
  }

  function nextStep() {
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }

  function prevStep() {
    setStep((s) => Math.max(s - 1, 1));
  }

  // ── Progress dots ──────────────────────────────────────────────────────────

  function ProgressDots() {
    return (
      <View style={styles.dots}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i + 1 === step && styles.dotActive,
              i + 1 < step && styles.dotDone,
            ]}
          />
        ))}
      </View>
    );
  }

  // ── Step 1: Welcome ────────────────────────────────────────────────────────

  function StepWelcome() {
    return (
      <View style={styles.stepContent}>
        <View style={styles.welcomeLolaBlock}>
          <Image source={Lola.welcome} style={styles.welcomeLola} resizeMode="contain" />
        </View>

        <Text style={[styles.stepTitle, { fontFamily: ff.bold }]}>
          Hi, I&apos;m Lola.
        </Text>
        <Text style={[styles.stepBody, { fontFamily: ff.regular }]}>
          I&apos;ll help you track your energy, symptoms, and the things that take more out of you
          than people realise.
        </Text>
        <Text style={[styles.stepBody, styles.stepBodyCalm, { fontFamily: ff.regular }]}>
          Everything here is optional, and you can change it later.
        </Text>

        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.7 }]}
          onPress={nextStep}
        >
          <Text style={[styles.primaryBtnText, { fontFamily: ff.semibold }]}>Get started</Text>
        </Pressable>
      </View>
    );
  }

  // ── Step 2: Name (optional) ────────────────────────────────────────────────

  function StepName() {
    const hasName = name.trim().length > 0;
    return (
      <View style={styles.stepContent}>
        <Text style={[styles.stepTitle, { fontFamily: ff.bold }]}>
          What should I call you?
        </Text>
        <Text style={[styles.stepSubtitle, { fontFamily: ff.regular }]}>
          Optional — just so I can greet you. You can always change this later.
        </Text>

        <TextInput
          style={[styles.nameInput, { fontFamily: ff.regular }]}
          value={name}
          onChangeText={setName}
          placeholder="Your name or nickname"
          placeholderTextColor={Colors.textSubtle}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="done"
          maxLength={40}
          onSubmitEditing={nextStep}
        />

        <View style={styles.navRow}>
          <Pressable style={styles.backBtn} onPress={prevStep}>
            <MaterialIcons name="arrow-back" size={18} color={Colors.textMuted} />
            <Text style={[styles.backBtnText, { fontFamily: ff.medium }]}>Back</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.primaryBtnSmall, pressed && { opacity: 0.7 }]}
            onPress={nextStep}
          >
            <Text style={[styles.primaryBtnText, { fontFamily: ff.semibold }]}>
              {hasName ? 'Continue' : 'Skip'}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Step 3: Conditions (optional) ──────────────────────────────────────────

  function StepConditions() {
    return (
      <View style={styles.stepContent}>
        <Text style={[styles.stepTitle, { fontFamily: ff.bold }]}>
          Do any of these sound like you?
        </Text>
        <Text style={[styles.stepSubtitle, { fontFamily: ff.regular }]}>
          Optional. These simply help me suggest useful symptom tags and defaults. You can change
          them later.
        </Text>

        <View style={styles.taskGrid}>
          {PRESET_CONDITIONS.map((condition) => {
            const selected = selectedConditions.includes(condition);
            return (
              <Pressable
                key={condition}
                style={({ pressed }) => [
                  styles.taskChip,
                  selected && styles.taskChipSelected,
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => toggleCondition(condition)}
              >
                <View style={styles.taskChipInner}>
                  {selected ? (
                    <MaterialIcons name="check" size={15} color={Colors.background} />
                  ) : null}
                  <Text
                    style={[
                      styles.taskChipText,
                      selected && styles.taskChipTextSelected,
                      { fontFamily: ff.medium },
                    ]}
                  >
                    {condition}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.selectionNote}>
          <MaterialIcons
            name={selectedConditions.length > 0 ? 'check-circle' : 'info-outline'}
            size={14}
            color={selectedConditions.length > 0 ? Colors.success : Colors.textSubtle}
          />
          <Text style={[styles.selectionNoteText, { fontFamily: ff.regular }]}>
            {selectedConditions.length > 0
              ? `${selectedConditions.length} selected — I'll suggest matching symptom tags`
              : "Nothing selected — that's completely fine"}
          </Text>
        </View>

        <View style={styles.navRow}>
          <Pressable style={styles.backBtn} onPress={prevStep}>
            <MaterialIcons name="arrow-back" size={18} color={Colors.textMuted} />
            <Text style={[styles.backBtnText, { fontFamily: ff.medium }]}>Back</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.primaryBtnSmall, pressed && { opacity: 0.7 }]}
            onPress={nextStep}
          >
            <Text style={[styles.primaryBtnText, { fontFamily: ff.semibold }]}>
              {selectedConditions.length > 0 ? 'Continue' : 'Skip'}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Step 4: Default daily tasks ────────────────────────────────────────────

  function StepDefaultTasks() {
    return (
      <View style={styles.stepContent}>
        <Text style={[styles.stepTitle, { fontFamily: ff.bold }]}>
          What do you usually do every day?
        </Text>
        <Text style={[styles.stepSubtitle, { fontFamily: ff.regular }]}>
          These will be added to your task list automatically each morning.
          Tap everything that applies — or none if you prefer to add manually.
        </Text>

        <View style={styles.taskGrid}>
          {ONBOARDING_TASK_OPTIONS.map((task) => {
            const selected = selectedTasks.some((t) => t.name === task.name);
            return (
              <Pressable
                key={task.name}
                style={({ pressed }) => [
                  styles.taskChip,
                  selected && styles.taskChipSelected,
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => toggleTask(task)}
              >
                <View style={styles.taskChipInner}>
                  {selected ? (
                    <MaterialIcons name="check" size={15} color={Colors.background} />
                  ) : null}
                  <Text
                    style={[
                      styles.taskChipText,
                      selected && styles.taskChipTextSelected,
                      { fontFamily: ff.medium },
                    ]}
                  >
                    {task.name}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {selectedTasks.length > 0 ? (
          <View style={styles.selectionNote}>
            <MaterialIcons name="check-circle" size={14} color={Colors.success} />
            <Text style={[styles.selectionNoteText, { fontFamily: ff.regular }]}>
              {selectedTasks.length} {selectedTasks.length === 1 ? 'task' : 'tasks'} selected — added automatically each day
            </Text>
          </View>
        ) : (
          <View style={styles.selectionNote}>
            <MaterialIcons name="info-outline" size={14} color={Colors.textSubtle} />
            <Text style={[styles.selectionNoteText, { fontFamily: ff.regular }]}>
              Nothing selected — you can always add tasks manually
            </Text>
          </View>
        )}

        <View style={styles.navRow}>
          <Pressable style={styles.backBtn} onPress={prevStep}>
            <MaterialIcons name="arrow-back" size={18} color={Colors.textMuted} />
            <Text style={[styles.backBtnText, { fontFamily: ff.medium }]}>Back</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.primaryBtnSmall, pressed && { opacity: 0.7 }]}
            onPress={nextStep}
          >
            <Text style={[styles.primaryBtnText, { fontFamily: ff.semibold }]}>Continue</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Step 5: Reminders ──────────────────────────────────────────────────────

  const FREQ_OPTIONS: { value: Exclude<ReminderFrequency, 'off'>; desc: string }[] = [
    { value: 'low', desc: 'A gentle evening wind-down (7:30pm)' },
    { value: 'medium', desc: 'Morning and evening (10am & 7:30pm)' },
    { value: 'high', desc: 'Morning, midday and evening (9am, 2pm, 7:30pm)' },
  ];

  function StepReminders() {
    return (
      <View style={styles.stepContent}>
        <Text style={[styles.stepTitle, { fontFamily: ff.bold }]}>
          Gentle reminders?
        </Text>
        <Text style={[styles.stepSubtitle, { fontFamily: ff.regular }]}>
          On by default — just one gentle evening nudge to help it become routine. No pressure, and
          you can turn it off here or in Settings anytime.
        </Text>

        <View style={styles.reminderToggleCard}>
          <View style={styles.reminderToggleLeft}>
            <Text style={[styles.reminderToggleTitle, { fontFamily: ff.semibold }]}>
              Enable reminders
            </Text>
            <Text style={[styles.reminderToggleDesc, { fontFamily: ff.regular }]}>
              Short, low-pressure check-in prompts
            </Text>
          </View>
          <Switch
            value={remindersEnabled}
            onValueChange={setRemindersEnabled}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor={Colors.white}
            accessibilityLabel="Enable reminders"
          />
        </View>

        {remindersEnabled ? (
          <View style={styles.freqBlock}>
            <Text style={[styles.freqLabel, { fontFamily: ff.medium }]}>How often?</Text>
            {FREQ_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                style={({ pressed }) => [
                  styles.freqOption,
                  frequency === opt.value && styles.freqOptionSelected,
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => setFrequency(opt.value)}
              >
                <View style={styles.freqOptionInner}>
                  <View
                    style={[
                      styles.freqRadio,
                      frequency === opt.value && styles.freqRadioSelected,
                    ]}
                  />
                  <View style={styles.freqOptionText}>
                    <Text
                      style={[
                        styles.freqOptionTitle,
                        frequency === opt.value && styles.freqOptionTitleSelected,
                        { fontFamily: ff.medium },
                      ]}
                    >
                      {REMINDER_FREQUENCY_LABELS[opt.value]}
                    </Text>
                    <Text style={[styles.freqOptionDesc, { fontFamily: ff.regular }]}>
                      {opt.desc}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}

            <View style={styles.reminderExampleBox}>
              <MaterialIcons name="notifications-none" size={16} color={Colors.accent} />
              <Text style={[styles.reminderExampleText, { fontFamily: ff.regular }]}>
                Example: &quot;Quick check-in — want to log anything from today?&quot;
              </Text>
            </View>
          </View>
        ) : null}

        <View style={styles.navRow}>
          <Pressable style={styles.backBtn} onPress={prevStep}>
            <MaterialIcons name="arrow-back" size={18} color={Colors.textMuted} />
            <Text style={[styles.backBtnText, { fontFamily: ff.medium }]}>Back</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.primaryBtnSmall, pressed && { opacity: 0.7 }]}
            onPress={nextStep}
          >
            <Text style={[styles.primaryBtnText, { fontFamily: ff.semibold }]}>Continue</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Step 6: All set ────────────────────────────────────────────────────────

  function StepAllSet() {
    return (
      <View style={styles.stepContent}>
        <View style={styles.allSetIcon}>
          <MaterialIcons name="favorite" size={36} color={Colors.primary} />
        </View>

        <Text style={[styles.stepTitle, { fontFamily: ff.bold }]}>
          You&apos;re all set.
        </Text>
        <Text style={[styles.stepBody, { fontFamily: ff.regular }]}>
          Hassle is ready. Start each day by choosing your energy level — and
          your default tasks will appear automatically.
        </Text>
        <Text style={[styles.stepBodyCalm, styles.stepBody, { fontFamily: ff.regular }]}>
          You can change any of this in Settings anytime.
        </Text>

        {selectedTasks.length > 0 ? (
          <View style={styles.confirmBox}>
            <Text style={[styles.confirmTitle, { fontFamily: ff.semibold }]}>
              Daily tasks ready
            </Text>
            <View style={styles.confirmTasks}>
              {selectedTasks.map((t) => (
                <View key={t.name} style={styles.confirmTask}>
                  <MaterialIcons name="check" size={13} color={Colors.success} />
                  <Text style={[styles.confirmTaskText, { fontFamily: ff.regular }]}>{t.name}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <Pressable
          style={({ pressed }) => [
            styles.primaryBtn,
            finishing && { opacity: 0.6 },
            pressed && !finishing && { opacity: 0.85 },
          ]}
          onPress={handleFinish}
          disabled={finishing}
        >
          <Text style={[styles.primaryBtnText, { fontFamily: ff.semibold }]}>
            {finishing ? 'Setting up...' : 'Start using Hassle'}
          </Text>
        </Pressable>
      </View>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ProgressDots />

        {step === 1 ? <StepWelcome /> : null}
        {step === 2 ? <StepName /> : null}
        {step === 3 ? <StepConditions /> : null}
        {step === 4 ? <StepDefaultTasks /> : null}
        {step === 5 ? <StepReminders /> : null}
        {step === 6 ? <StepAllSet /> : null}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotActive: {
    backgroundColor: Colors.primary,
    width: 22,
  },
  dotDone: {
    backgroundColor: Colors.primaryLight,
  },
  stepContent: {
    paddingTop: Spacing.lg,
    gap: Spacing.lg,
  },
  // ── Welcome ────────────────────────────────────────────────────────────────
  welcomeLolaBlock: {
    alignItems: 'center',
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  welcomeLola: {
    width: 180,
    height: 180,
  },
  stepTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: Fonts.bold,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  stepSubtitle: {
    fontSize: FontSizes.base,
    color: Colors.textMuted,
    lineHeight: 24,
  },
  stepBody: {
    fontSize: FontSizes.base,
    color: Colors.textMuted,
    lineHeight: 26,
  },
  stepBodyCalm: {
    color: Colors.textSubtle,
    fontStyle: 'italic',
  },
  featureList: {
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 4,
  },
  featureText: {
    fontSize: FontSizes.base,
    color: Colors.text,
    flex: 1,
    lineHeight: 22,
  },
  // ── Name ───────────────────────────────────────────────────────────────────
  nameInput: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    fontSize: FontSizes.base,
    color: Colors.text,
  },
  // ── Task selection ─────────────────────────────────────────────────────────
  taskGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  taskChip: {
    borderRadius: Radius.lg,
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    minWidth: 100,
  },
  taskChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  taskChipInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
  },
  taskChipText: {
    fontSize: FontSizes.base,
    fontWeight: Fonts.medium,
    color: Colors.text,
    textAlign: 'center',
  },
  taskChipTextSelected: {
    color: Colors.background,
    fontWeight: Fonts.semibold,
  },
  selectionNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectionNoteText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    flex: 1,
    lineHeight: 20,
  },
  // ── Reminders ──────────────────────────────────────────────────────────────
  reminderToggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reminderToggleLeft: {
    flex: 1,
    marginRight: Spacing.md,
  },
  reminderToggleTitle: {
    fontSize: FontSizes.base,
    fontWeight: Fonts.semibold,
    color: Colors.text,
    marginBottom: 2,
  },
  reminderToggleDesc: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  freqBlock: {
    gap: Spacing.sm,
  },
  freqLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSubtle,
    fontWeight: Fonts.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  freqOption: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  freqOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryFaint,
  },
  freqOptionInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  freqRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceDark,
  },
  freqRadioSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  freqOptionText: {
    flex: 1,
  },
  freqOptionTitle: {
    fontSize: FontSizes.base,
    fontWeight: Fonts.medium,
    color: Colors.text,
    marginBottom: 2,
  },
  freqOptionTitleSelected: {
    color: Colors.primary,
  },
  freqOptionDesc: {
    fontSize: FontSizes.sm,
    color: Colors.textSubtle,
    lineHeight: 18,
  },
  reminderExampleBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.accentFaint,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.sm,
  },
  reminderExampleText: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.accent,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  // ── All set ────────────────────────────────────────────────────────────────
  allSetIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primaryFaint,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    alignSelf: 'center',
    marginBottom: Spacing.sm,
  },
  confirmBox: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  confirmTitle: {
    fontSize: FontSizes.sm,
    fontWeight: Fonts.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  confirmTasks: {
    gap: 6,
  },
  confirmTask: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confirmTaskText: {
    fontSize: FontSizes.base,
    color: Colors.text,
  },
  // ── Navigation ─────────────────────────────────────────────────────────────
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
    paddingRight: Spacing.md,
  },
  backBtnText: {
    fontSize: FontSizes.base,
    color: Colors.textMuted,
    fontWeight: Fonts.medium,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  primaryBtnSmall: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    flex: 1,
  },
  primaryBtnText: {
    fontSize: FontSizes.base,
    fontWeight: Fonts.semibold,
    color: Colors.background,
    letterSpacing: 0.2,
  },
});
