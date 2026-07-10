import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Image,
  ImageSourcePropType,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import { Text, TextInput } from '@/components/ui/AppText';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, Fonts, Radius } from '@/constants/theme';
import { useFontFamily } from '@/hooks/useFontFamily';
import { useDay } from '@/hooks/useDay';
import { useAlert } from '@/template';
import { useRegion } from '@/localization/RegionContext';
import { AddTaskModal } from '@/components/ui/AddTaskModal';
import { EnergyMode, DailyTag, BUILT_IN_TAGS, dedupeCustomTags } from '@/constants/types';
import { Companion } from '@/constants/companion';
import { IntentSheet } from '@/components/ui/IntentSheet';
import { NavDrawer } from '@/components/ui/NavDrawer';
import { CompanionOrbit, CompanionOrbitChip } from '@/components/ui/CompanionOrbit';



// ─── Lightweight Home Daily Check-In ─────────────────────────────────────────

type HomeDailyCheckIn = {
  date: string;
  energyMode: EnergyMode;
  energyLevel: number;
  /** Legacy battery value kept so older saved check-ins can still be read. */
  battery?: number;
  affecting: string[];
  mustDo: string[];
};

const HOME_CHECK_IN_KEY = 'hassle_home_daily_checkin_v1';
const AFFECTING_OPTIONS = ['Pain', 'Fatigue', 'Brain fog', 'Poor sleep', 'Heat', 'Cold', 'Stress', 'Anxiety', 'Flare', 'Illness', 'Low mood', 'Other'];
const MUST_DO_OPTIONS = ['Medication', 'Eat', 'Drink water', 'Doctor', 'School run', 'Work', 'Shopping', 'Laundry', 'Exercise', 'Rest', 'Custom'];

function localDateString(date = new Date()) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function greetingForDate(date = new Date(), name?: string | null) {
  const hour = date.getHours();
  const greeting = hour >= 5 && hour < 12
    ? 'Good morning'
    : hour >= 12 && hour < 17
    ? 'Good afternoon'
    : hour >= 17 && hour < 21
    ? 'Good evening'
    : 'Good night';
  return name ? `${greeting}, ${name}.` : `${greeting}.`;
}

async function loadHomeDailyCheckIn(): Promise<HomeDailyCheckIn | null> {
  try {
    const raw = await AsyncStorage.getItem(HOME_CHECK_IN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as HomeDailyCheckIn;
    if (parsed.date !== localDateString()) return null;
    return {
      ...parsed,
      energyMode: parsed.energyMode ?? 'battery',
      energyLevel: parsed.energyLevel ?? parsed.battery ?? 70,
    };
  } catch {
    return null;
  }
}

async function saveHomeDailyCheckIn(checkIn: HomeDailyCheckIn) {
  try {
    await AsyncStorage.setItem(HOME_CHECK_IN_KEY, JSON.stringify(checkIn));
  } catch {
    // silent local persistence failure
  }
}

function toggleSelection(value: string, selected: string[], setSelected: (next: string[]) => void) {
  setSelected(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);
}

function DailyCheckInModal({ visible, onSave }: { visible: boolean; onSave: (checkIn: HomeDailyCheckIn) => void }) {
  const ff = useFontFamily();
  const [step, setStep] = useState(1);
  const [energyMode, setEnergyMode] = useState<EnergyMode>('battery');
  const [energyLevel, setEnergyLevel] = useState(70);
  const [showCustomSpoon, setShowCustomSpoon] = useState(false);
  const [customSpoonInput, setCustomSpoonInput] = useState('');
  const [affecting, setAffecting] = useState<string[]>([]);
  const [mustDo, setMustDo] = useState<string[]>([]);

  useEffect(() => {
    if (!visible) return;
    setStep(1);
    setEnergyMode('battery');
    setEnergyLevel(70);
    setShowCustomSpoon(false);
    setCustomSpoonInput('');
    setAffecting([]);
    setMustDo([]);
  }, [visible]);

  function handleEnergyModeSelect(nextMode: EnergyMode) {
    setEnergyMode(nextMode);
    setShowCustomSpoon(false);
    setCustomSpoonInput('');
    setEnergyLevel(nextMode === 'battery' ? 70 : 6);
  }

  function handleCustomSpoonPress() {
    setShowCustomSpoon(true);
    setCustomSpoonInput(energyMode === 'spoon' && energyLevel > 12 ? String(energyLevel) : '');
  }

  function handleCustomSpoonChange(text: string) {
    const digits = text.replace(/[^0-9]/g, '').slice(0, 2);
    setCustomSpoonInput(digits);
    const nextValue = parseInt(digits, 10);
    if (!Number.isNaN(nextValue)) {
      setEnergyLevel(nextValue);
    }
  }

  function handlePrimaryPress() {
    if (step < 3) {
      setStep((current) => current + 1);
      return;
    }
    onSave({
      date: localDateString(),
      energyMode,
      energyLevel,
      battery: energyMode === 'battery' ? energyLevel : undefined,
      affecting,
      mustDo,
    });
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => {}}>
      <View style={homeCheckInStyles.backdrop}>
        <View style={homeCheckInStyles.sheet}>
          <Text style={[homeCheckInStyles.stepLabel, { fontFamily: ff.medium }]}>Daily check-in · {step}/3</Text>
          {step === 1 ? (
            <View style={homeCheckInStyles.sectionBlock}>
              <Text style={[homeCheckInStyles.title, { fontFamily: ff.bold }]}>How are you feeling today?</Text>
              <View style={homeCheckInStyles.energyModeRow}>
                <Pressable
                  style={[homeCheckInStyles.energyModeChip, energyMode === 'battery' && homeCheckInStyles.energyModeChipActive]}
                  onPress={() => handleEnergyModeSelect('battery')}
                  accessibilityRole="button"
                >
                  <Text style={[homeCheckInStyles.energyModeText, energyMode === 'battery' && homeCheckInStyles.energyModeTextActive, { fontFamily: ff.medium }]}>🔋 Battery</Text>
                </Pressable>
                <Pressable
                  style={[homeCheckInStyles.energyModeChip, energyMode === 'spoon' && homeCheckInStyles.energyModeChipActive]}
                  onPress={() => handleEnergyModeSelect('spoon')}
                  accessibilityRole="button"
                >
                  <Text style={[homeCheckInStyles.energyModeText, energyMode === 'spoon' && homeCheckInStyles.energyModeTextActive, { fontFamily: ff.medium }]}>🥄 Spoons</Text>
                </Pressable>
              </View>
              {energyMode === 'battery' ? (
                <>
                  <Text style={[homeCheckInStyles.batteryValue, { fontFamily: ff.bold }]}>{energyLevel}%</Text>
                  <Slider
                    value={energyLevel}
                    minimumValue={0}
                    maximumValue={100}
                    step={1}
                    minimumTrackTintColor={Colors.primary}
                    maximumTrackTintColor={Colors.border}
                    thumbTintColor={Colors.primary}
                    onValueChange={setEnergyLevel}
                    accessibilityLabel="Battery percentage"
                  />
                </>
              ) : (
                <>
                  <Text style={[homeCheckInStyles.batteryValue, { fontFamily: ff.bold }]}>{energyLevel} spoon{energyLevel === 1 ? '' : 's'}</Text>
                  <View style={homeCheckInStyles.spoonGrid}>
                    {Array.from({ length: 13 }, (_, value) => (
                      <Pressable
                        key={value}
                        style={[homeCheckInStyles.spoonChip, !showCustomSpoon && energyLevel === value && homeCheckInStyles.spoonChipActive]}
                        onPress={() => { setEnergyLevel(value); setShowCustomSpoon(false); setCustomSpoonInput(''); }}
                      >
                        <Text style={[homeCheckInStyles.spoonChipText, !showCustomSpoon && energyLevel === value && homeCheckInStyles.spoonChipTextActive, { fontFamily: ff.medium }]}>{value}</Text>
                      </Pressable>
                    ))}
                    <Pressable style={[homeCheckInStyles.spoonChip, showCustomSpoon && homeCheckInStyles.spoonChipActive]} onPress={handleCustomSpoonPress}>
                      <Text style={[homeCheckInStyles.spoonChipText, showCustomSpoon && homeCheckInStyles.spoonChipTextActive, { fontFamily: ff.medium }]}>Custom</Text>
                    </Pressable>
                  </View>
                  {showCustomSpoon ? (
                    <TextInput
                      style={[homeCheckInStyles.customSpoonInput, { fontFamily: ff.regular }]}
                      value={customSpoonInput}
                      onChangeText={handleCustomSpoonChange}
                      placeholder="Custom spoons"
                      placeholderTextColor={Colors.textSubtle}
                      keyboardType="number-pad"
                      maxLength={2}
                      autoFocus
                    />
                  ) : null}
                </>
              )}
            </View>
          ) : null}
          {step === 2 ? (
            <View style={homeCheckInStyles.sectionBlock}>
              <Text style={[homeCheckInStyles.title, { fontFamily: ff.bold }]}>What's affecting today?</Text>
              <View style={homeCheckInStyles.chipsWrap}>
                {AFFECTING_OPTIONS.map((option) => (
                  <Pressable
                    key={option}
                    style={[homeCheckInStyles.chip, affecting.includes(option) && homeCheckInStyles.chipActive]}
                    onPress={() => toggleSelection(option, affecting, setAffecting)}
                  >
                    <Text style={[homeCheckInStyles.chipText, affecting.includes(option) && homeCheckInStyles.chipTextActive, { fontFamily: ff.medium }]}>{option}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}
          {step === 3 ? (
            <View style={homeCheckInStyles.sectionBlock}>
              <Text style={[homeCheckInStyles.title, { fontFamily: ff.bold }]}>What absolutely needs doing today?</Text>
              <View style={homeCheckInStyles.chipsWrap}>
                {MUST_DO_OPTIONS.map((option) => (
                  <Pressable
                    key={option}
                    style={[homeCheckInStyles.chip, mustDo.includes(option) && homeCheckInStyles.chipActive]}
                    onPress={() => toggleSelection(option, mustDo, setMustDo)}
                  >
                    <Text style={[homeCheckInStyles.chipText, mustDo.includes(option) && homeCheckInStyles.chipTextActive, { fontFamily: ff.medium }]}>{option}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}
          <Pressable style={homeCheckInStyles.primaryButton} onPress={handlePrimaryPress}>
            <Text style={[homeCheckInStyles.primaryButtonText, { fontFamily: ff.semibold }]}>{step === 3 ? 'Start today' : 'Next'}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function TodayCheckInCard({ checkIn }: { checkIn: HomeDailyCheckIn }) {
  const ff = useFontFamily();
  return (
    <View style={homeCheckInStyles.cardWrap}>
      <View style={homeCheckInStyles.summaryCard}>
        <Text style={[homeCheckInStyles.summaryLabel, { fontFamily: ff.medium }]}>{checkIn.energyMode === 'spoon' ? 'Spoons' : 'Battery'}</Text>
        <Text style={[homeCheckInStyles.summaryBattery, { fontFamily: ff.bold }]}>
          {checkIn.energyMode === 'spoon' ? `${checkIn.energyLevel} spoon${checkIn.energyLevel === 1 ? '' : 's'}` : `${checkIn.energyLevel ?? checkIn.battery ?? 0}%`}
        </Text>
        <SummaryList title="Affecting today" items={checkIn.affecting} />
        <SummaryList title="Must do" items={checkIn.mustDo} />
      </View>
    </View>
  );
}

function SummaryList({ title, items }: { title: string; items: string[] }) {
  const ff = useFontFamily();
  return (
    <View style={homeCheckInStyles.summarySection}>
      <Text style={[homeCheckInStyles.summaryLabel, { fontFamily: ff.medium }]}>{title}</Text>
      {items.length > 0 ? items.map((item) => (
        <Text key={item} style={[homeCheckInStyles.summaryItem, { fontFamily: ff.regular }]}>• {item}</Text>
      )) : (
        <Text style={[homeCheckInStyles.summaryEmpty, { fontFamily: ff.regular }]}>• Nothing added</Text>
      )}
    </View>
  );
}

function HomeCompanionWithDailyCheckIn({ companion, chips, checkIn, onNeedCheckIn }: {
  companion: ImageSourcePropType;
  chips: CompanionOrbitChip[];
  checkIn: HomeDailyCheckIn | null;
  onNeedCheckIn: () => void;
}) {
  return (
    <View style={homeCheckInStyles.orbitWrap}>
      <CompanionOrbit companion={companion} chips={chips} />
      {!checkIn ? (
        <Pressable
          style={homeCheckInStyles.lolaTapCatcher}
          onPress={onNeedCheckIn}
          accessibilityRole="button"
          accessibilityLabel="Start daily check-in"
        />
      ) : null}
    </View>
  );
}

// ─── Check-In (inline, shown when no active day exists) ───────────────────────

const SPOON_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const BATTERY_VALUES = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

function CheckInView() {
  const insets = useSafeAreaInsets();
  const { completeCheckIn, prefs, addCustomTag } = useDay();
  const ff = useFontFamily();
  const { config } = useRegion();

  const [mode, setMode] = useState<EnergyMode>(prefs?.energyMode ?? 'spoon');
  const [energyLevel, setEnergyLevel] = useState<number | null>(null);
  const [isFlare, setIsFlare] = useState(false);

  const [tags, setTags] = useState<DailyTag[]>([]);
  const [showCustomSpoon, setShowCustomSpoon] = useState(false);
  const [customSpoonInput, setCustomSpoonInput] = useState('');

  const [showTagInput, setShowTagInput] = useState(false);
  const [tagInputValue, setTagInputValue] = useState('');
  const [tagInputError, setTagInputError] = useState('');

  const allTags: string[] = [...BUILT_IN_TAGS, ...dedupeCustomTags(prefs?.customTags ?? [])];

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
            {config.copy.noJudgment}
          </Text>
        </View>

        {/* Mode selector */}
        <View style={checkInStyles.section}>
          <Text style={[checkInStyles.label, { fontFamily: ff.medium }]}>
            How do you track your energy?
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
          <View style={checkInStyles.energyLabelRow}>
            <Text style={[checkInStyles.label, checkInStyles.energyLabelText, { fontFamily: ff.medium }]}>
              {mode === 'spoon'
                ? energyLevel !== null
                  ? `How many spoons do you have today? (${energyLevel})`
                  : 'How many spoons do you have today?'
                : energyLevel !== null
                ? `What is your battery level? (${energyLevel}%)`
                : 'What is your battery level?'}
            </Text>
            <Image
              source={Companion.WrapUp}
              style={checkInStyles.energyLola}
              resizeMode="contain"
            />
          </View>
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
                onValueChange={(v) => {
                  setIsFlare(v);
                }}
                trackColor={{ false: Colors.border, true: Colors.flare }}
                thumbColor={Colors.white}
                accessibilityLabel="Flare day"
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
  const router = useRouter();
  const { showAlert } = useAlert();
  const ff = useFontFamily();
  const {
    day,
    prefs,
    energyRemaining,
    toggleFlare,
    endDay,
  } = useDay();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showHomeCheckIn, setShowHomeCheckIn] = useState(false);
  const [homeCheckIn, setHomeCheckIn] = useState<HomeDailyCheckIn | null>(null);
  const [showIntentSheet, setShowIntentSheet] = useState(false);
  const [showNavDrawer, setShowNavDrawer] = useState(false);

  useEffect(() => {
    let mounted = true;
    loadHomeDailyCheckIn().then((saved) => {
      if (mounted) setHomeCheckIn(saved);
    });
    return () => {
      mounted = false;
    };
  }, []);

  async function handleSaveHomeCheckIn(checkIn: HomeDailyCheckIn) {
    setHomeCheckIn(checkIn);
    await saveHomeDailyCheckIn(checkIn);
    setShowHomeCheckIn(false);
  }

  const homeChips = [
    { key: 'body', label: 'Body', onPress: () => router.push('/body' as any) },
    { key: 'mind', label: 'Mind', onPress: () => router.push('/reflect' as any) },
    { key: 'life', label: 'Life', onPress: () => router.push('/life' as any) },
    { key: 'quiet', label: 'Quiet Time', onPress: () => router.push('/quiet-time' as any), highlighted: true },
  ];
  const todaysHomeCheckIn = homeCheckIn?.date === localDateString() ? homeCheckIn : null;

  if (!day || !day.checkedIn) {
    if (showCheckIn) {
      return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
          <View style={styles.headerBar}>
            <Pressable onPress={() => setShowNavDrawer(true)} hitSlop={12} accessibilityRole="button" accessibilityLabel="Open menu">
              <MaterialIcons name="menu" size={22} color={Colors.textSubtle} />
            </Pressable>
            <Pressable onPress={() => router.push('/settings' as any)} hitSlop={12} accessibilityRole="button" accessibilityLabel="Settings">
              <MaterialIcons name="tune" size={22} color={Colors.textSubtle} />
            </Pressable>
          </View>
          <CheckInView />
          <NavDrawer visible={showNavDrawer} onClose={() => setShowNavDrawer(false)} />
        </View>
      );
    }

    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.headerBar}>
          <Pressable onPress={() => setShowNavDrawer(true)} hitSlop={12} accessibilityRole="button" accessibilityLabel="Open menu">
            <MaterialIcons name="menu" size={22} color={Colors.textSubtle} />
          </Pressable>
          <Pressable onPress={() => router.push('/settings' as any)} hitSlop={12} accessibilityRole="button" accessibilityLabel="Settings">
            <MaterialIcons name="tune" size={22} color={Colors.textSubtle} />
          </Pressable>
        </View>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing.xl }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.homeIntro}>
            <Text style={[styles.homeTitle, { fontFamily: ff.bold }]}>{greetingForDate(new Date(), prefs?.name)}</Text>
            <Text style={[styles.homeSubtitle, { fontFamily: ff.regular }]}>Tap Lola when you need something.</Text>
          </View>
          <HomeCompanionWithDailyCheckIn
            companion={Companion.Home}
            chips={homeChips}
            checkIn={todaysHomeCheckIn}
            onNeedCheckIn={() => setShowHomeCheckIn(true)}
          />
          {todaysHomeCheckIn ? <TodayCheckInCard checkIn={todaysHomeCheckIn} /> : null}
        </ScrollView>

        <DailyCheckInModal visible={showHomeCheckIn} onSave={handleSaveHomeCheckIn} />

        <IntentSheet
          visible={showIntentSheet}
          onClose={() => setShowIntentSheet(false)}
          handlers={{ openFlareWorkflow: () => setShowCheckIn(true) }}
        />


        <NavDrawer visible={showNavDrawer} onClose={() => setShowNavDrawer(false)} />
      </View>
    );
  }


  const isLowEnergy = energyRemaining <= 20;
  let heroImage = Companion.Home;
  let heroSentence = 'What would help today?';
  if (day.isFlareDay) {
    heroImage = Companion.Flare;
    heroSentence = 'Protect your energy today.';
  } else if (isLowEnergy) {
    heroImage = Companion.Flare;
    heroSentence = "Let's make today smaller.";
  }

  async function handleEndDay() {
    showAlert(
      'Wrap up today?',
      "Today\u2019s tasks, energy, and reflections will be saved. You\u2019ll be ready to start fresh tomorrow.",
      [
        { text: 'Not yet', style: 'cancel' },
        {
          text: 'Yes, wrap up',
          style: 'default',
          onPress: async () => {
            await endDay();
          },
        },
      ]
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.headerBar}>
        <Pressable onPress={() => setShowNavDrawer(true)} hitSlop={12} accessibilityRole="button" accessibilityLabel="Open menu">
          <MaterialIcons name="menu" size={22} color={Colors.textSubtle} />
        </Pressable>
        <Pressable onPress={() => router.push('/settings' as any)} hitSlop={12} accessibilityRole="button" accessibilityLabel="Settings">
          <MaterialIcons name="tune" size={22} color={Colors.textSubtle} />
        </Pressable>
      </View>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Ambient assistant hero — Today, together */}
        <View style={styles.homeIntro}>
          <Text style={[styles.homeTitle, { fontFamily: ff.bold }]}>
            {greetingForDate(new Date(), prefs?.name)}
          </Text>
          <Text style={[styles.homeSubtitle, { fontFamily: ff.regular }]}>{heroSentence}</Text>
        </View>
        <HomeCompanionWithDailyCheckIn
          companion={heroImage}
          chips={homeChips}
          checkIn={todaysHomeCheckIn}
          onNeedCheckIn={() => setShowHomeCheckIn(true)}
        />
        {todaysHomeCheckIn ? <TodayCheckInCard checkIn={todaysHomeCheckIn} /> : null}

        <View style={{ height: insets.bottom + Spacing.xl }} />
      </ScrollView>


      <DailyCheckInModal visible={showHomeCheckIn} onSave={handleSaveHomeCheckIn} />

      <AddTaskModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
      />


      <IntentSheet
        visible={showIntentSheet}
        onClose={() => setShowIntentSheet(false)}
        handlers={{
          openFlareWorkflow: day.isFlareDay ? handleEndDay : () => toggleFlare(true),
          openAddTask: () => setShowAddModal(true),
          openMoveTask: () => {
            // No specific task to move; open add-task so user can create/select
            setShowAddModal(true);
          },
          openEndDay: handleEndDay,
          openReflect: () => router.push('/reflect' as any),
        }}
      />


      <NavDrawer visible={showNavDrawer} onClose={() => setShowNavDrawer(false)} />
    </View>
  );
}


const homeCheckInStyles = StyleSheet.create({
  orbitWrap: {
    position: 'relative',
    alignItems: 'center',
  },
  lolaTapCatcher: {
    position: 'absolute',
    width: 230,
    height: 300,
    top: 78,
    alignSelf: 'center',
    zIndex: 10,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(21, 24, 22, 0.34)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: Spacing.md,
  },
  stepLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textSubtle,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionBlock: {
    gap: Spacing.md,
  },
  title: {
    fontSize: FontSizes.lg,
    color: Colors.text,
    lineHeight: 26,
  },
  batteryValue: {
    fontSize: 38,
    color: Colors.text,
    textAlign: 'center',
  },
  energyModeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  energyModeChip: {
    flex: 1,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    alignItems: 'center',
  },
  energyModeChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryFaint,
  },
  energyModeText: {
    color: Colors.textMuted,
    fontSize: FontSizes.sm,
  },
  energyModeTextActive: {
    color: Colors.text,
  },
  spoonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  spoonChip: {
    minWidth: 44,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  spoonChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryFaint,
  },
  spoonChipText: {
    color: Colors.textMuted,
    fontSize: FontSizes.sm,
  },
  spoonChipTextActive: {
    color: Colors.text,
  },
  customSpoonInput: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    color: Colors.text,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: FontSizes.base,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.surface,
  },
  chipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryFaint,
  },
  chipText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  chipTextActive: {
    color: Colors.text,
  },
  primaryButton: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: Colors.background,
    fontSize: FontSizes.base,
  },
  cardWrap: {
    paddingHorizontal: Spacing.lg,
    marginTop: -Spacing.md,
    marginBottom: Spacing.lg,
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  summaryLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSubtle,
  },
  summaryBattery: {
    fontSize: FontSizes.xl,
    color: Colors.text,
  },
  summarySection: {
    gap: 3,
  },
  summaryItem: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    lineHeight: 20,
  },
  summaryEmpty: {
    fontSize: FontSizes.sm,
    color: Colors.textSubtle,
    lineHeight: 20,
  },
});

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
  energyLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  energyLabelText: {
    flex: 1,
    marginBottom: 0,
  },
  energyLola: {
    width: 38,
    height: 46,
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
  homeIntro: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    gap: Spacing.sm,
  },
  homeTitle: {
    color: Colors.text,
    fontSize: 44,
    lineHeight: 50,
    letterSpacing: -1.2,
  },
  homeSubtitle: {
    color: Colors.textMuted,
    fontSize: FontSizes.lg,
    lineHeight: 28,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    minHeight: 44,
  },
  scroll: {
    paddingBottom: Spacing.xxxl,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
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
  reportCardWrap: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  quietTimeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.accentFaint,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.accent + '30',
  },
  quietTimeBannerTitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  quietTimeBannerSub: {
    fontSize: FontSizes.xs,
    color: Colors.textSubtle,
    lineHeight: 18,
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
  comingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  comingInfo: {
    flex: 1,
  },
  comingName: {
    fontSize: FontSizes.base,
    fontWeight: Fonts.medium,
    color: Colors.textMuted,
    marginBottom: 3,
  },
  comingDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  comingDate: {
    fontSize: FontSizes.sm,
    color: Colors.accent,
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
  seePlanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: 10,
  },
  seePlanText: {
    fontSize: FontSizes.sm,
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
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  planTitle: {
    fontSize: FontSizes.md,
    fontWeight: Fonts.semibold,
    color: Colors.text,
    letterSpacing: -0.2,
  },
});
