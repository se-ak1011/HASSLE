/**
 * app/onboarding.tsx
 *
 * First-launch onboarding that feels like meeting Lola, not registration.
 */

import React, { useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Image } from 'react-native';
import { Text, TextInput } from '@/components/ui/AppText';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, Fonts, Radius } from '@/constants/theme';
import { useFontFamily } from '@/hooks/useFontFamily';
import { useDay } from '@/hooks/useDay';
import { ReminderFrequency, PHYSICAL_CONDITIONS, MENTAL_LOAD_CONDITIONS } from '@/constants/types';
import { Companion } from '@/constants/companion';
import { useRegion } from '@/localization/RegionContext';
import { REGIONS } from '@/localization/region';

const TOTAL_STEPS = 4;
const INTRO_EXAMPLES = [
  "I've got fibromyalgia.",
  'I have two children.',
  'I forget medication.',
  'Mornings are difficult.',
  'My dog helps.',
  'My biggest problem is showering.',
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const ff = useFontFamily();
  const { completeOnboarding } = useDay();
  const { region, setRegion } = useRegion();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [selectedPhysicalConditions, setSelectedPhysicalConditions] = useState<string[]>([]);
  const [selectedMentalLoadConditions, setSelectedMentalLoadConditions] = useState<string[]>([]);
  const [lolaIntro, setLolaIntro] = useState('');
  const [showTypeInput, setShowTypeInput] = useState(false);
  const [finishing, setFinishing] = useState(false);

  function toggleFromList(condition: string, setter: React.Dispatch<React.SetStateAction<string[]>>) {
    setter((prev) =>
      prev.includes(condition) ? prev.filter((c) => c !== condition) : [...prev, condition]
    );
  }

  function nextStep() {
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }

  function prevStep() {
    setStep((s) => Math.max(s - 1, 1));
  }

  async function handleFinish() {
    if (finishing) return;
    setFinishing(true);
    const finalFrequency: ReminderFrequency = 'off';
    await completeOnboarding(
      [],
      { enabled: false, frequency: finalFrequency },
      {
        name,
        physicalConditions: selectedPhysicalConditions,
        mentalLoadConditions: selectedMentalLoadConditions,
        conditions: [...selectedPhysicalConditions, ...selectedMentalLoadConditions],
        lolaIntro,
      }
    );
    router.replace('/(tabs)');
  }

  function ProgressDots() {
    return (
      <View style={styles.dots}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <View key={i} style={[styles.dot, i + 1 === step && styles.dotActive, i + 1 < step && styles.dotDone]} />
        ))}
      </View>
    );
  }

  function StepWelcome() {
    return (
      <View style={styles.stepContent}>
        <View style={styles.lolaBlock}>
          <Image source={Companion.FirstLaunch} style={styles.waveLola} resizeMode="contain" />
        </View>
        <Text style={[styles.heroHi, { fontFamily: ff.bold }]}>Hi.</Text>
        <Text style={[styles.stepTitle, { fontFamily: ff.bold }]}>I&apos;m Lola.</Text>
        <Text style={[styles.stepBody, { fontFamily: ff.regular }]}>I&apos;m here to make difficult days a little smaller.</Text>
        <Pressable style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]} onPress={nextStep}>
          <Text style={[styles.primaryBtnText, { fontFamily: ff.semibold }]}>Let&apos;s begin</Text>
        </Pressable>
      </View>
    );
  }

  function StepNameRegion() {
    return (
      <View style={styles.stepContent}>
        <Text style={[styles.stepTitle, { fontFamily: ff.bold }]}>What should Lola call you?</Text>
        <TextInput
          style={[styles.input, { fontFamily: ff.regular }]}
          value={name}
          onChangeText={setName}
          placeholder="Preferred name"
          placeholderTextColor={Colors.textSubtle}
          autoCapitalize="words"
          autoCorrect={false}
          maxLength={40}
        />

        <Text style={[styles.sectionLabel, { fontFamily: ff.semibold }]}>Region</Text>
        <View style={styles.regionRow}>
          {REGIONS.filter((r) => r.code === 'US' || r.code === 'GB').map((r) => {
            const selected = region === r.code;
            return (
              <Pressable key={r.code} style={[styles.regionCard, selected && styles.regionCardSelected]} onPress={() => setRegion(r.code)}>
                <Text style={[styles.regionText, selected && styles.regionTextSelected, { fontFamily: ff.semibold }]}>{r.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <NavButtons onNext={nextStep} nextLabel="Done" />
      </View>
    );
  }

  function ConditionSection({ title, options, selected, onToggle }: { title: string; options: string[]; selected: string[]; onToggle: (condition: string) => void }) {
    return (
      <View style={styles.conditionSection}>
        <Text style={[styles.sectionLabel, { fontFamily: ff.semibold }]}>{title}</Text>
        <View style={styles.chipWrap}>
          {options.map((condition) => {
            const isSelected = selected.includes(condition);
            return (
              <Pressable key={`${title}-${condition}`} style={[styles.conditionChip, isSelected && styles.conditionChipSelected]} onPress={() => onToggle(condition)}>
                <Text style={[styles.conditionText, isSelected && styles.conditionTextSelected, { fontFamily: ff.medium }]}>{condition}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  function StepConditions() {
    return (
      <View style={styles.stepContent}>
        <Text style={[styles.stepTitle, { fontFamily: ff.bold }]}>Tell Lola what matters.</Text>
        <Text style={[styles.stepSubtitle, { fontFamily: ff.regular }]}>Only what helps. You can skip anything.</Text>
        <ConditionSection title="Physical / Disability" options={PHYSICAL_CONDITIONS} selected={selectedPhysicalConditions} onToggle={(condition) => toggleFromList(condition, setSelectedPhysicalConditions)} />
        <ConditionSection title="Neurodivergence / Mental Health" options={MENTAL_LOAD_CONDITIONS} selected={selectedMentalLoadConditions} onToggle={(condition) => toggleFromList(condition, setSelectedMentalLoadConditions)} />
        <NavButtons onNext={nextStep} nextLabel="Continue" />
      </View>
    );
  }

  function StepTellLola() {
    return (
      <View style={styles.stepContent}>
        <Text style={[styles.stepTitle, { fontFamily: ff.bold }]}>Tell Lola.</Text>
        <Text style={[styles.stepSubtitle, { fontFamily: ff.regular }]}>Whatever feels useful.</Text>

        <Pressable style={[styles.micButton, styles.micButtonDisabled]} onPress={() => setShowTypeInput(true)} accessibilityRole="button" accessibilityLabel="Tell Lola by voice">
          <MaterialIcons name="mic" size={42} color={Colors.text} />
          <Text style={[styles.micLabel, { fontFamily: ff.semibold }]}>Voice notes coming soon</Text>
          <Text style={[styles.micHint, { fontFamily: ff.regular }]}>For now, type it exactly as you&apos;d say it.</Text>
        </Pressable>

        <View style={styles.examplesBox}>
          {INTRO_EXAMPLES.map((example) => (
            <Text key={example} style={[styles.exampleText, { fontFamily: ff.regular }]}>“{example}”</Text>
          ))}
        </View>

        {!showTypeInput ? (
          <Pressable style={styles.secondaryBtn} onPress={() => setShowTypeInput(true)}>
            <Text style={[styles.secondaryBtnText, { fontFamily: ff.semibold }]}>Type instead</Text>
          </Pressable>
        ) : (
          <TextInput
            style={[styles.introInput, { fontFamily: ff.regular }]}
            value={lolaIntro}
            onChangeText={setLolaIntro}
            placeholder="Tell Lola anything useful…"
            placeholderTextColor={Colors.textSubtle}
            multiline
            textAlignVertical="top"
            maxLength={800}
          />
        )}

        <View style={styles.futureNote}>
          <Text style={[styles.futureNoteText, { fontFamily: ff.regular }]}>Saved locally as entered. No AI extraction yet.</Text>
        </View>

        <NavButtons onNext={handleFinish} nextLabel={finishing ? 'Saving...' : 'Start using Hassle'} nextDisabled={finishing} />
      </View>
    );
  }

  function NavButtons({ onNext, nextLabel, nextDisabled }: { onNext: () => void; nextLabel: string; nextDisabled?: boolean }) {
    return (
      <View style={styles.navRow}>
        {step > 1 ? (
          <Pressable style={styles.backBtn} onPress={prevStep}>
            <MaterialIcons name="arrow-back" size={18} color={Colors.textMuted} />
            <Text style={[styles.backBtnText, { fontFamily: ff.medium }]}>Back</Text>
          </Pressable>
        ) : <View />}
        <Pressable style={[styles.primaryBtnSmall, nextDisabled && { opacity: 0.6 }]} onPress={onNext} disabled={nextDisabled}>
          <Text style={[styles.primaryBtnText, { fontFamily: ff.semibold }]}>{nextLabel}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}> 
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing.xl }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <ProgressDots />
        {step === 1 ? StepWelcome() : null}
        {step === 2 ? StepNameRegion() : null}
        {step === 3 ? StepConditions() : null}
        {step === 4 ? StepTellLola() : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxxl },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingTop: Spacing.xl, paddingBottom: Spacing.md },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border },
  dotActive: { backgroundColor: Colors.primary, width: 22 },
  dotDone: { backgroundColor: Colors.primaryLight },
  stepContent: { paddingTop: Spacing.lg, gap: Spacing.lg },
  lolaBlock: { alignItems: 'center', paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  waveLola: { width: 190, height: 190 },
  heroHi: { fontSize: FontSizes.xxxl, color: Colors.text, lineHeight: 52, letterSpacing: -1 },
  stepTitle: { fontSize: FontSizes.xxl, fontWeight: Fonts.bold, color: Colors.text, letterSpacing: -0.5 },
  stepSubtitle: { fontSize: FontSizes.base, color: Colors.textMuted, lineHeight: 24 },
  stepBody: { fontSize: FontSizes.lg, color: Colors.textMuted, lineHeight: 30 },
  input: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.border, paddingVertical: 14, paddingHorizontal: Spacing.md, fontSize: FontSizes.base, color: Colors.text },
  sectionLabel: { fontSize: FontSizes.sm, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.7 },
  regionRow: { gap: Spacing.sm },
  regionCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.border, padding: Spacing.md },
  regionCardSelected: { backgroundColor: Colors.primaryFaint, borderColor: Colors.primary },
  regionText: { fontSize: FontSizes.base, color: Colors.text },
  regionTextSelected: { color: Colors.primary },
  conditionSection: { gap: Spacing.sm },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  conditionChip: { borderRadius: Radius.full, paddingVertical: 10, paddingHorizontal: Spacing.md, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border },
  conditionChipSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  conditionText: { fontSize: FontSizes.sm, color: Colors.text },
  conditionTextSelected: { color: Colors.background },
  micButton: { alignItems: 'center', justifyContent: 'center', minHeight: 170, borderRadius: Radius.xl, borderWidth: 1.5, borderColor: Colors.primary, backgroundColor: Colors.primaryFaint, gap: Spacing.sm, padding: Spacing.lg },
  micButtonDisabled: { opacity: 0.95 },
  micLabel: { fontSize: FontSizes.lg, color: Colors.text, textAlign: 'center' },
  micHint: { fontSize: FontSizes.sm, color: Colors.textSubtle, textAlign: 'center', lineHeight: 20 },
  examplesBox: { gap: 6, backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md },
  exampleText: { fontSize: FontSizes.sm, color: Colors.textSecondary, lineHeight: 20 },
  secondaryBtn: { alignSelf: 'center', paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg },
  secondaryBtnText: { fontSize: FontSizes.base, color: Colors.primary },
  introInput: { minHeight: 150, backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.border, paddingVertical: 14, paddingHorizontal: Spacing.md, fontSize: FontSizes.base, color: Colors.text, lineHeight: 24 },
  futureNote: { backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md },
  futureNoteText: { fontSize: FontSizes.sm, color: Colors.textSubtle, lineHeight: 20, textAlign: 'center' },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md, marginTop: Spacing.sm },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: Spacing.sm, paddingRight: Spacing.md },
  backBtnText: { fontSize: FontSizes.base, color: Colors.textMuted, fontWeight: Fonts.medium },
  primaryBtn: { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: 16, alignItems: 'center', marginTop: Spacing.sm },
  primaryBtnSmall: { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: 14, paddingHorizontal: Spacing.xl, alignItems: 'center', flex: 1 },
  primaryBtnText: { fontSize: FontSizes.base, fontWeight: Fonts.semibold, color: Colors.background, letterSpacing: 0.2 },
});
