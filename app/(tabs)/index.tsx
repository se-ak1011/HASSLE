import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Text, TextInput } from '@/components/ui/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, Fonts, Radius } from '@/constants/theme';
import { useFontFamily } from '@/hooks/useFontFamily';
import { useDay } from '@/hooks/useDay';
import { useAlert } from '@/template';
import { EnergyBar } from '@/components/ui/EnergyBar';
import { TaskCard } from '@/components/ui/TaskCard';
import { AddTaskModal } from '@/components/ui/AddTaskModal';
import { CompletionModal } from '@/components/ui/CompletionModal';
import { Task, CompletionFeeling, EnergyMode, DailyTag, BUILT_IN_TAGS, HEADER_QUOTES } from '@/constants/types';
import { Lola } from '@/constants/lola';

// ─── Check-In (inline, shown when no active day exists) ───────────────────────

const SPOON_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const BATTERY_VALUES = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

function CheckInView() {
  const insets = useSafeAreaInsets();
  const { completeCheckIn, prefs, addCustomTag } = useDay();
  const ff = useFontFamily();

  const [mode, setMode] = useState<EnergyMode>(prefs?.energyMode ?? 'spoon');
  const [energyLevel, setEnergyLevel] = useState<number | null>(null);
  const [isFlare, setIsFlare] = useState(false);
  const [tags, setTags] = useState<DailyTag[]>([]);
  const [showCustomSpoon, setShowCustomSpoon] = useState(false);
  const [customSpoonInput, setCustomSpoonInput] = useState('');

  const [showTagInput, setShowTagInput] = useState(false);
  const [tagInputValue, setTagInputValue] = useState('');
  const [tagInputError, setTagInputError] = useState('');

  const allTags: string[] = [...BUILT_IN_TAGS, ...(prefs?.customTags ?? [])];

  function handleAddCustomTag() {
    const trimmed = tagInputValue.trim().slice(0, 30);
    if (!trimmed) return;
    const added = addCustomTag(trimmed);
    if (!added) {
      setTagInputError('That tag already exists.');
      return;
    }
    setTags((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    setTagInputValue('');
    setTagInputError('');
    setShowTagInput(false);
  }

  const values = mode === 'spoon' ? SPOON_VALUES : BATTERY_VALUES;
  const isCustomActive = mode === 'spoon' && showCustomSpoon;

  function handleModeSelect(m: EnergyMode) {
    setMode(m);
    setEnergyLevel(null);
    setShowCustomSpoon(false);
    setCustomSpoonInput('');
  }

  function handleStandardSpoonPress(v: number) {
    setEnergyLevel(v);
    setShowCustomSpoon(false);
    setCustomSpoonInput('');
  }

  function handleCustomChipPress() {
    setShowCustomSpoon(true);
    if (energyLevel !== null && energyLevel > 12) {
      setCustomSpoonInput(String(energyLevel));
    } else {
      setEnergyLevel(null);
      setCustomSpoonInput('');
    }
  }

  function handleCustomSpoonChange(text: string) {
    const digits = text.replace(/[^0-9]/g, '');
    setCustomSpoonInput(digits);
    const num = parseInt(digits, 10);
    if (!isNaN(num) && num >= 1 && num <= 50) {
      setEnergyLevel(num);
    } else {
      setEnergyLevel(null);
    }
  }

  function toggleTag(tag: string) {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  async function handleContinue() {
    if (energyLevel === null) return;
    await completeCheckIn(mode, energyLevel, isFlare, tags);
  }

  const canStart = energyLevel !== null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          checkInStyles.scroll,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Typography logo */}
        <View style={checkInStyles.logoBlock}>
          <Text style={[checkInStyles.logoText, { fontFamily: ff.bold }]}>HASSLE</Text>
        </View>

        {/* Title */}
        <View style={checkInStyles.titleBlock}>
          <Text style={[checkInStyles.title, { fontFamily: ff.bold }]}>
            {prefs?.name ? `How are you today, ${prefs.name}?` : 'How are you today?'}
          </Text>
          <Text style={[checkInStyles.subtitle, { fontFamily: ff.regular }]}>
            No judgement. Just where you are right now.
          </Text>
        </View>

        {/* Mode selector */}
        <View style={checkInStyles.section}>
          <Text style={[checkInStyles.label, { fontFamily: ff.medium }]}>
            How would you like to track energy?
          </Text>
          <View style={checkInStyles.modeRow}>
            <Pressable
              style={[
                checkInStyles.modeCard,
                mode === 'spoon' && checkInStyles.modeCardActive,
              ]}
              onPress={() => handleModeSelect('spoon')}
            >
              <Text style={checkInStyles.modeIcon}>🥄</Text>
              <Text
                style={[
                  checkInStyles.modeTitle,
                  mode === 'spoon' && checkInStyles.modeTitleActive,
                  { fontFamily: ff.semibold },
                ]}
              >
                Spoon
              </Text>
              <Text style={[checkInStyles.modeDesc, { fontFamily: ff.regular }]}>for flare-based energy</Text>
            </Pressable>
            <Pressable
              style={[
                checkInStyles.modeCard,
                mode === 'battery' && checkInStyles.modeCardActive,
              ]}
              onPress={() => handleModeSelect('battery')}
            >
              <Text style={checkInStyles.modeIcon}>🔋</Text>
              <Text
                style={[
                  checkInStyles.modeTitle,
                  mode === 'battery' && checkInStyles.modeTitleActive,
                  { fontFamily: ff.semibold },
                ]}
              >
                Battery
              </Text>
              <Text style={[checkInStyles.modeDesc, { fontFamily: ff.regular }]}>for percentage tracking</Text>
            </Pressable>
          </View>
        </View>

        {/* Energy level selector */}
        <View style={checkInStyles.section}>
          <Text style={[checkInStyles.label, { fontFamily: ff.medium }]}>
            {mode === 'spoon'
              ? energyLevel !== null
                ? `How many spoons do you have today? (${energyLevel})`
                : 'How many spoons do you have today?'
              : energyLevel !== null
              ? `What is your battery level? (${energyLevel}%)`
              : 'What is your battery level?'}
          </Text>
          <View style={checkInStyles.energyGrid}>
            {values.map((v) => (
              <Pressable
                key={v}
                style={[
                  checkInStyles.energyChip,
                  !isCustomActive && energyLevel === v && checkInStyles.energyChipActive,
                ]}
                onPress={() =>
                  mode === 'spoon' ? handleStandardSpoonPress(v) : setEnergyLevel(v)
                }
              >
                <Text
                  style={[
                    checkInStyles.energyChipText,
                    !isCustomActive && energyLevel === v && checkInStyles.energyChipTextActive,
                    { fontFamily: ff.medium },
                  ]}
                >
                  {mode === 'battery' ? `${v}%` : v}
                </Text>
              </Pressable>
            ))}
            {mode === 'spoon' ? (
              <Pressable
                style={[
                  checkInStyles.energyChip,
                  isCustomActive && checkInStyles.energyChipActive,
                ]}
                onPress={handleCustomChipPress}
              >
                <Text
                  style={[
                    checkInStyles.energyChipText,
                    isCustomActive && checkInStyles.energyChipTextActive,
                    { fontFamily: ff.medium },
                  ]}
                >
                  Custom
                </Text>
              </Pressable>
            ) : null}
          </View>
          {isCustomActive ? (
            <View style={checkInStyles.customInputWrap}>
              <TextInput
                style={[checkInStyles.customInput, { fontFamily: ff.regular }]}
                value={customSpoonInput}
                onChangeText={handleCustomSpoonChange}
                placeholder="Enter spoon count (1–50)"
                placeholderTextColor={Colors.textSubtle}
                keyboardType="number-pad"
                maxLength={2}
                autoFocus
              />
              {customSpoonInput !== '' && (parseInt(customSpoonInput, 10) < 1 || parseInt(customSpoonInput, 10) > 50) ? (
                <Text style={[checkInStyles.customInputError, { fontFamily: ff.regular }]}>Must be between 1 and 50.</Text>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Flare day */}
        <View style={checkInStyles.flareSectionWrap}>
          <View style={checkInStyles.flareSection}>
            <View style={checkInStyles.flareRow}>
              <View style={checkInStyles.flareLeft}>
                <Text style={[checkInStyles.flareTitle, { fontFamily: ff.semibold }]}>Flare day</Text>
                <Text style={[checkInStyles.flareDesc, { fontFamily: ff.regular }]}>
                  Task costs will increase by 50%
                </Text>
              </View>
              <Switch
                value={isFlare}
                onValueChange={setIsFlare}
                trackColor={{ false: Colors.border, true: Colors.flare }}
                thumbColor={Colors.white}
              />
            </View>
            {isFlare ? (
              <View style={checkInStyles.flareMessage}>
                <Text style={[checkInStyles.flareMessageText, { fontFamily: ff.regular }]}>
                  Be gentle with yourself today. Flare days are hard.
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Tags */}
        <View style={checkInStyles.section}>
          <Text style={[checkInStyles.label, { fontFamily: ff.medium }]}>
            Anything worth noting? (optional)
          </Text>
          <View style={checkInStyles.tagsWrap}>
            {allTags.map((tag) => (
              <Pressable
                key={tag}
                style={[
                  checkInStyles.tag,
                  tags.includes(tag) && checkInStyles.tagActive,
                ]}
                onPress={() => toggleTag(tag)}
              >
                <Text
                  style={[
                    checkInStyles.tagText,
                    tags.includes(tag) && checkInStyles.tagTextActive,
                    { fontFamily: ff.medium },
                  ]}
                >
                  {tag}
                </Text>
              </Pressable>
            ))}
            {!showTagInput ? (
              <Pressable
                style={checkInStyles.customTagChip}
                onPress={() => {
                  setShowTagInput(true);
                  setTagInputError('');
                }}
              >
                <MaterialIcons name="add" size={13} color={Colors.textSubtle} />
                <Text style={[checkInStyles.customTagChipText, { fontFamily: ff.medium }]}>Custom</Text>
              </Pressable>
            ) : null}
          </View>

          {showTagInput ? (
            <View style={checkInStyles.tagInputWrap}>
              <TextInput
                style={[checkInStyles.tagInput, { fontFamily: ff.regular }]}
                value={tagInputValue}
                onChangeText={(t) => {
                  setTagInputValue(t.slice(0, 30));
                  setTagInputError('');
                }}
                placeholder="Add your own tag"
                placeholderTextColor={Colors.textSubtle}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleAddCustomTag}
                maxLength={30}
              />
              <View style={checkInStyles.tagInputActions}>
                <Pressable
                  style={({ pressed }) => [
                    checkInStyles.tagConfirmBtn,
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={handleAddCustomTag}
                >
                  <Text style={[checkInStyles.tagConfirmText, { fontFamily: ff.semibold }]}>Add</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    checkInStyles.tagCancelBtn,
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => {
                    setShowTagInput(false);
                    setTagInputValue('');
                    setTagInputError('');
                  }}
                >
                  <Text style={[checkInStyles.tagCancelText, { fontFamily: ff.medium }]}>Cancel</Text>
                </Pressable>
              </View>
              {tagInputError ? (
                <Text style={[checkInStyles.tagInputError, { fontFamily: ff.regular }]}>{tagInputError}</Text>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* CTA */}
        <Pressable
          style={({ pressed }) => [
            checkInStyles.continueBtn,
            !canStart && checkInStyles.continueBtnDisabled,
            pressed && canStart && { opacity: 0.85 },
          ]}
          onPress={handleContinue}
          disabled={!canStart}
        >
          <Text style={[checkInStyles.continueBtnText, { fontFamily: ff.semibold }]}>Start the day</Text>
        </Pressable>

        {!canStart ? (
          <Text style={[checkInStyles.chooseHint, { fontFamily: ff.regular }]}>
            Select an energy level to continue.
          </Text>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Today Screen ─────────────────────────────────────────────────────────────

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const ff = useFontFamily();
  const {
    day,
    prefs,
    energyUsed,
    energyRemaining,
    completeTask,
    moveTaskToTomorrow,
    toggleFlare,
    endDay,
  } = useDay();

  const [showAddModal, setShowAddModal] = useState(false);
  const [pendingCompletion, setPendingCompletion] = useState<Task | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!feedbackMsg) return;
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(2400),
      Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(() => setFeedbackMsg(null));
  }, [feedbackMsg]);

  if (!day || !day.checkedIn) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <CheckInView />
      </View>
    );
  }

  const pending = day.tasks.filter((t) => t.status === 'pending');
  const completed = day.tasks.filter((t) => t.status === 'completed');
  const moved = day.tasks.filter((t) => t.status === 'moved');

  function handleCompletePress(task: Task) {
    setPendingCompletion(task);
  }

  function handleFeelingSelected(feeling: CompletionFeeling, feedback: string) {
    if (!pendingCompletion) return;
    completeTask(pendingCompletion.id, feeling);
    setPendingCompletion(null);
    fadeAnim.setValue(0);
    setFeedbackMsg(feedback);
  }

  function handleDismissCompletion() {
    if (!pendingCompletion) return;
    completeTask(pendingCompletion.id, 'right');
    setPendingCompletion(null);
  }

  async function handleEndDay() {
    showAlert(
      'End the day?',
      "Today\u2019s tasks, energy, and reflection will be saved to your history. You\u2019ll be brought back to check-in to start fresh.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End day',
          style: 'default',
          onPress: async () => {
            await endDay();
          },
        },
      ]
    );
  }

  const tagColors: Record<string, string> = {
    pain: Colors.flare,
    fatigue: Colors.accent,
    'brain fog': Colors.textSubtle,
    overstimulated: Colors.accent,
    anxious: Colors.accent,
    rested: Colors.success,
    nauseous: Colors.textMuted,
    'low mood': Colors.textSubtle,
    'decent day': Colors.success,
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerText, { fontFamily: ff.regular }]}>
            {HEADER_QUOTES[new Date().getDate() % HEADER_QUOTES.length]}
          </Text>
          {day.isFlareDay ? (
            <View style={styles.flarePill}>
              <Text style={[styles.flarePillText, { fontFamily: ff.semibold }]}>Flare day</Text>
            </View>
          ) : null}
        </View>

        {/* Lola — looks worse the more drained you are, or on a flare day */}
        <Image
          source={day.isFlareDay || energyRemaining <= 20 ? Lola.xeyes : Lola.standing}
          style={styles.lola}
          resizeMode="contain"
        />

        {/* Tags */}
        {day.tags.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tagsScroll}
          >
            <View style={styles.tagsRow}>
              {day.tags.map((tag) => (
                <View
                  key={tag}
                  style={[
                    styles.tagPill,
                    { borderColor: tagColors[tag] ?? Colors.border },
                  ]}
                >
                  <Text
                    style={[
                      styles.tagPillText,
                      { color: tagColors[tag] ?? Colors.textSubtle },
                      { fontFamily: ff.medium },
                    ]}
                  >
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        ) : null}

        {/* Energy Bar */}
        <View style={styles.section}>
          <EnergyBar
            mode={day.energyMode}
            total={day.energyLevel}
            used={energyUsed}
            remaining={energyRemaining}
            isFlare={day.isFlareDay}
          />
        </View>

        {/* Inline feedback message */}
        {feedbackMsg ? (
          <Animated.View style={[styles.feedbackRow, { opacity: fadeAnim }]}>
            <Text style={[styles.feedbackText, { fontFamily: ff.regular }]}>{feedbackMsg}</Text>
          </Animated.View>
        ) : null}

        {/* Flare day toggle */}
        <View style={[styles.section, styles.flareToggleCard]}>
          <View style={styles.flareToggleLeft}>
            <Text style={[styles.flareToggleTitle, { fontFamily: ff.medium }]}>Flare day</Text>
            <Text style={[styles.flareToggleDesc, { fontFamily: ff.regular }]}>
              {day.isFlareDay
                ? 'All task costs are increased by 50%'
                : 'Toggle on to increase task costs by 50%'}
            </Text>
          </View>
          <Switch
            value={day.isFlareDay}
            onValueChange={toggleFlare}
            trackColor={{ false: Colors.border, true: Colors.flare }}
            thumbColor={Colors.white}
          />
        </View>

        {day.isFlareDay ? (
          <View style={styles.flareMsgSection}>
            <Text style={[styles.flareMsg, { fontFamily: ff.regular }]}>
              Be gentle with yourself today. This is enough.
            </Text>
          </View>
        ) : null}

        {/* Pending tasks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { fontFamily: ff.semibold }]}>Today&apos;s tasks</Text>
            <Text style={[styles.sectionCount, { fontFamily: ff.medium }]}>{pending.length}</Text>
          </View>

          {pending.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🌱</Text>
              <Text style={[styles.emptyText, { fontFamily: ff.medium }]}>Nothing on your list yet.</Text>
              <Text style={[styles.emptySubtext, { fontFamily: ff.regular }]}>
                Add only what you can realistically do today.
              </Text>
            </View>
          ) : (
            <View style={styles.taskList}>
              {pending.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  mode={day.energyMode}
                  onComplete={() => handleCompletePress(task)}
                  onMove={() => moveTaskToTomorrow(task.id)}
                />
              ))}
            </View>
          )}

          <Pressable
            style={({ pressed }) => [
              styles.addTaskBtn,
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => setShowAddModal(true)}
          >
            <MaterialIcons name="add" size={20} color={Colors.primary} />
            <Text style={[styles.addTaskText, { fontFamily: ff.medium }]}>Add a task</Text>
          </Pressable>
        </View>

        {/* Done today */}
        {completed.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { fontFamily: ff.semibold }]}>Done today</Text>
              <Text style={[styles.sectionCount, { fontFamily: ff.medium }]}>{completed.length}</Text>
            </View>
            <View style={styles.taskList}>
              {completed.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  mode={day.energyMode}
                  onComplete={() => {}}
                  onMove={() => {}}
                />
              ))}
            </View>
          </View>
        ) : null}

        {/* Moved to tomorrow */}
        {moved.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { fontFamily: ff.semibold }]}>Moved to tomorrow</Text>
              <Text style={[styles.sectionCount, { fontFamily: ff.medium }]}>{moved.length}</Text>
            </View>
            <View style={styles.taskList}>
              {moved.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  mode={day.energyMode}
                  onComplete={() => {}}
                  onMove={() => {}}
                />
              ))}
            </View>
          </View>
        ) : null}

        {/* End day */}
        <View style={styles.section}>
          <Pressable
            style={({ pressed }) => [
              styles.endDayBtn,
              pressed && { opacity: 0.7 },
            ]}
            onPress={handleEndDay}
          >
            <MaterialIcons name="nights-stay" size={16} color={Colors.textSubtle} />
            <Text style={[styles.endDayText, { fontFamily: ff.medium }]}>End the day</Text>
          </Pressable>
        </View>

        <View style={{ height: insets.bottom + Spacing.xl }} />
      </ScrollView>

      <AddTaskModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
      />

      <CompletionModal
        visible={pendingCompletion !== null}
        taskName={pendingCompletion?.name ?? ''}
        onSelect={handleFeelingSelected}
        onDismiss={handleDismissCompletion}
      />
    </View>
  );
}

// ─── Check-In Styles ──────────────────────────────────────────────────────────

const checkInStyles = StyleSheet.create({
  scroll: {
    paddingBottom: Spacing.xxxl,
  },
  logoBlock: {
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    alignItems: 'center',
  },
  logoText: {
    fontSize: 42,
    fontWeight: '900' as const,
    color: Colors.text,
    letterSpacing: 14,
    textTransform: 'uppercase' as const,
    includeFontPadding: false,
  },
  titleBlock: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: Fonts.bold,
    color: Colors.text,
    letterSpacing: -0.5,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSizes.base,
    color: Colors.textMuted,
    lineHeight: 24,
    fontWeight: Fonts.regular,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: Fonts.medium,
    color: Colors.textSubtle,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  modeRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  modeCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  modeCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryFaint,
  },
  modeIcon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  modeTitle: {
    fontSize: FontSizes.base,
    fontWeight: Fonts.semibold,
    color: Colors.text,
    marginBottom: 2,
  },
  modeTitleActive: {
    color: Colors.primary,
  },
  modeDesc: {
    fontSize: FontSizes.xs,
    color: Colors.textSubtle,
    textAlign: 'center',
  },
  energyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  energyChip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    minWidth: 52,
    alignItems: 'center',
  },
  energyChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  energyChipText: {
    fontSize: FontSizes.base,
    fontWeight: Fonts.medium,
    color: Colors.text,
  },
  energyChipTextActive: {
    color: Colors.background,
    fontWeight: Fonts.semibold,
  },
  flareSectionWrap: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  flareSection: {
    backgroundColor: Colors.flareFaint,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.flare,
  },
  flareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flareLeft: {
    flex: 1,
    marginRight: Spacing.md,
  },
  flareTitle: {
    fontSize: FontSizes.base,
    fontWeight: Fonts.semibold,
    color: Colors.flare,
    marginBottom: 2,
  },
  flareDesc: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  flareMessage: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  flareMessageText: {
    fontSize: FontSizes.base,
    color: Colors.flare,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  tag: {
    paddingVertical: 7,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  tagText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    fontWeight: Fonts.medium,
  },
  tagTextActive: {
    color: Colors.background,
    fontWeight: Fonts.semibold,
  },
  customInputWrap: {
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  customInput: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: FontSizes.base,
    color: Colors.text,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  customInputError: {
    fontSize: FontSizes.xs,
    color: Colors.flare,
    fontStyle: 'italic',
    paddingHorizontal: Spacing.xs,
  },
  customTagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderStyle: 'dashed',
  },
  customTagChipText: {
    fontSize: FontSizes.sm,
    color: Colors.textSubtle,
    fontWeight: Fonts.medium,
  },
  tagInputWrap: {
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  tagInput: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 11,
    fontSize: FontSizes.base,
    color: Colors.text,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  tagInputActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  tagConfirmBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tagConfirmText: {
    fontSize: FontSizes.sm,
    fontWeight: Fonts.semibold,
    color: Colors.background,
  },
  tagCancelBtn: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagCancelText: {
    fontSize: FontSizes.sm,
    fontWeight: Fonts.medium,
    color: Colors.textMuted,
  },
  tagInputError: {
    fontSize: FontSizes.xs,
    color: Colors.flare,
    fontStyle: 'italic',
    paddingHorizontal: Spacing.xs,
  },
  continueBtn: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueBtnDisabled: {
    opacity: 0.35,
  },
  continueBtnText: {
    fontSize: FontSizes.md,
    fontWeight: Fonts.semibold,
    color: Colors.background,
    letterSpacing: 0.2,
  },
  chooseHint: {
    textAlign: 'center',
    marginTop: Spacing.md,
    fontSize: FontSizes.sm,
    color: Colors.textSubtle,
    fontStyle: 'italic',
  },
});

// ─── Today Styles ─────────────────────────────────────────────────────────────

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
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
    fontSize: FontSizes.lg,
    fontWeight: Fonts.semibold,
    color: Colors.textSubtle,
    fontStyle: 'italic',
    lineHeight: 28,
    marginRight: Spacing.md,
  },
  lola: {
    width: 130,
    height: 150,
    alignSelf: 'center',
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  flarePill: {
    backgroundColor: Colors.flareFaint,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.flare,
  },
  flarePillText: {
    fontSize: FontSizes.xs,
    color: Colors.flare,
    fontWeight: Fonts.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tagsScroll: {
    marginBottom: Spacing.sm,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xs,
  },
  tagPill: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderWidth: 1,
    backgroundColor: Colors.surface,
  },
  tagPillText: {
    fontSize: FontSizes.xs,
    fontWeight: Fonts.medium,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  feedbackRow: {
    paddingHorizontal: Spacing.lg,
    marginTop: -Spacing.sm,
    marginBottom: Spacing.md,
  },
  feedbackText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  flareToggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  flareToggleLeft: {
    flex: 1,
    marginRight: Spacing.md,
  },
  flareToggleTitle: {
    fontSize: FontSizes.base,
    fontWeight: Fonts.medium,
    color: Colors.text,
    marginBottom: 2,
  },
  flareToggleDesc: {
    fontSize: FontSizes.sm,
    color: Colors.textSubtle,
    lineHeight: 18,
  },
  flareMsgSection: {
    paddingHorizontal: Spacing.lg,
    marginTop: -Spacing.sm,
    marginBottom: Spacing.lg,
  },
  flareMsg: {
    fontSize: FontSizes.sm,
    color: Colors.flare,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.md,
    fontWeight: Fonts.semibold,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  sectionCount: {
    fontSize: FontSizes.sm,
    color: Colors.textSubtle,
    fontWeight: Fonts.medium,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
    minWidth: 24,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyIcon: {
    fontSize: 28,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: FontSizes.base,
    fontWeight: Fonts.medium,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  emptySubtext: {
    fontSize: FontSizes.sm,
    color: Colors.textSubtle,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
    lineHeight: 20,
  },
  taskList: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  addTaskBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.primaryFaint,
    borderStyle: 'dashed',
    backgroundColor: Colors.surface,
  },
  addTaskText: {
    fontSize: FontSizes.base,
    fontWeight: Fonts.medium,
    color: Colors.primary,
  },
  endDayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  endDayText: {
    fontSize: FontSizes.sm,
    fontWeight: Fonts.medium,
    color: Colors.textSubtle,
  },
});
