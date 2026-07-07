/**
 * app/onboarding.tsx
 *
 * Conversation-first onboarding: talk → Lola listens → Lola organises → confirm.
 */

import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Image } from 'react-native';
import { Text, TextInput } from '@/components/ui/AppText';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, Fonts, Radius } from '@/constants/theme';
import { useFontFamily } from '@/hooks/useFontFamily';
import { useDay } from '@/hooks/useDay';
import { ReminderFrequency, PHYSICAL_CONDITIONS, MENTAL_LOAD_CONDITIONS } from '@/constants/types';
import { extractOnboardingProfileWithLola, OnboardingExtractedProfile } from '@/services/aiLola';
import { Companion } from '@/constants/companion';
import { useRegion } from '@/localization/RegionContext';
import { Region } from '@/localization/region';

const INTRO_EXAMPLES = [
  "I've got fibromyalgia.",
  'I have two children.',
  'I forget medication.',
  'Mornings are difficult.',
  'My dog helps.',
  'My biggest problem is showering.',
];

type ExtractedProfile = {
  name: string;
  region: Region | null;
  physicalConditions: string[];
  mentalLoadConditions: string[];
};

type ProfileListKey = Exclude<keyof OnboardingExtractedProfile, 'preferredName' | 'countryRegion' | 'physicalConditions' | 'neurodivergentMentalLoadConditions'>;

const PROFILE_LIST_FIELDS: { key: ProfileListKey; label: string; placeholder: string }[] = [
  { key: 'family', label: 'Family', placeholder: 'People Lola should know about' },
  { key: 'pets', label: 'Pets', placeholder: 'Pets or assistance animals' },
  { key: 'hobbies', label: 'Hobbies', placeholder: 'Things you enjoy' },
  { key: 'usualTasks', label: 'Usual tasks', placeholder: 'Regular tasks or routines' },
  { key: 'difficultTasks', label: 'Difficult tasks', placeholder: 'Tasks that are hard right now' },
  { key: 'reminders', label: 'Reminders', placeholder: 'Things you may want reminders for' },
  { key: 'thingsThatHelp', label: 'Things that help', placeholder: 'Supports, tools, strategies' },
  { key: 'thingsThatMakeDaysHarder', label: 'Things that make days harder', placeholder: 'Triggers, barriers, draining things' },
  { key: 'goals', label: 'Goals', placeholder: 'What you want help with' },
  { key: 'notes', label: 'Notes', placeholder: 'Anything else Lola noticed' },
];

function normalise(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function conditionAliases(condition: string): string[] {
  const base = normalise(condition);
  const aliases: Record<string, string[]> = {
    'me cfs': ['me cfs', 'cfs', 'chronic fatigue'],
    'pots dysautonomia': ['pots', 'dysautonomia'],
    'eds hypermobility': ['eds', 'ehlers danlos', 'hypermobility'],
    'chronic migraine': ['migraine', 'migraines', 'chronic migraine'],
    'long covid': ['long covid', 'longcovid'],
    'ptsd trauma': ['ptsd', 'trauma'],
    'sensory processing issues': ['sensory processing', 'sensory issues', 'sensory overload'],
  };
  return aliases[base] ?? [base];
}

function extractName(text: string): string {
  const match = text.match(/(?:my name is|i am|i'm|im)\s+([a-zA-Z][a-zA-Z' -]{0,38})/i);
  if (!match) return '';
  return match[1]
    .split(/[.,;!?\n]/)[0]
    .replace(/\b(and|with|but|who|i|have|has|am)\b.*$/i, '')
    .trim();
}

function extractRegion(text: string): Region | null {
  const lower = text.toLowerCase();
  if (/\b(united kingdom|uk|britain|england|scotland|wales)\b/.test(lower)) return 'GB';
  if (/\b(united states|usa|u\.s\.|america|american)\b/.test(lower)) return 'US';
  return null;
}

function extractConditions(text: string, options: string[]) {
  const normalizedText = ` ${normalise(text)} `;
  return options.filter((condition) =>
    condition !== 'Other' && conditionAliases(condition).some((alias) => normalizedText.includes(` ${alias} `))
  );
}

function extractProfile(transcript: string): ExtractedProfile {
  return {
    name: extractName(transcript),
    region: extractRegion(transcript),
    physicalConditions: extractConditions(transcript, PHYSICAL_CONDITIONS),
    mentalLoadConditions: extractConditions(transcript, MENTAL_LOAD_CONDITIONS),
  };
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const ff = useFontFamily();
  const { completeOnboarding, prefs } = useDay();
  const { region, setRegion } = useRegion();

  const [transcript, setTranscript] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [organising, setOrganising] = useState(false);
  const [organiseMessage, setOrganiseMessage] = useState('');
  const extracted = useMemo(() => extractProfile(transcript), [transcript]);
  const [nameOverride, setNameOverride] = useState('');
  const [physicalOverride, setPhysicalOverride] = useState<string[] | null>(null);
  const [mentalOverride, setMentalOverride] = useState<string[] | null>(null);
  const [regionOverride, setRegionOverride] = useState<Region | null>(null);
  const [profileDetails, setProfileDetails] = useState<OnboardingExtractedProfile | null>(null);

  const name = nameOverride || extracted.name;
  const physicalConditions = physicalOverride ?? extracted.physicalConditions;
  const mentalLoadConditions = mentalOverride ?? extracted.mentalLoadConditions;
  const selectedRegion = regionOverride ?? extracted.region ?? region;

  function mergeProfileDetails(details: OnboardingExtractedProfile | null) {
    const fallbackRegion = extracted.region ?? region;
    setNameOverride(details?.preferredName ?? extracted.name);
    setPhysicalOverride(details?.physicalConditions?.length ? details.physicalConditions : extracted.physicalConditions);
    setMentalOverride(details?.neurodivergentMentalLoadConditions?.length ? details.neurodivergentMentalLoadConditions : extracted.mentalLoadConditions);
    setRegionOverride(details?.countryRegion === 'UK' ? 'GB' : details?.countryRegion ?? fallbackRegion);
    setProfileDetails(details);
  }

  async function beginReview() {
    const trimmedTranscript = transcript.trim();
    if (!trimmedTranscript || organising) return;
    setOrganising(true);
    setOrganiseMessage('');
    try {
      const details = await extractOnboardingProfileWithLola({
        transcript: trimmedTranscript,
        regionHint: region === 'GB' ? 'UK' : region ?? null,
        existingProfile: prefs ?? undefined,
      });
      mergeProfileDetails(details);
    } catch {
      mergeProfileDetails(null);
      setOrganiseMessage('Lola saved what you said, but couldn’t organise it just now. You can still edit anything.');
    } finally {
      setOrganising(false);
      setReviewing(true);
    }
  }

  function updateProfileList(key: ProfileListKey, text: string) {
    const items = text.split(/[\n,]+/).map((item) => item.trim()).filter(Boolean);
    setProfileDetails((current) => ({
      preferredName: name || null,
      countryRegion: selectedRegion === 'GB' ? 'UK' : selectedRegion,
      physicalConditions,
      neurodivergentMentalLoadConditions: mentalLoadConditions,
      family: [],
      pets: [],
      hobbies: [],
      usualTasks: [],
      difficultTasks: [],
      reminders: [],
      thingsThatHelp: [],
      thingsThatMakeDaysHarder: [],
      goals: [],
      notes: [],
      ...(current ?? {}),
      [key]: items,
    }));
  }

  function toggleCondition(condition: string, group: 'physical' | 'mental') {
    const current = group === 'physical' ? physicalConditions : mentalLoadConditions;
    const next = current.includes(condition) ? current.filter((c) => c !== condition) : [...current, condition];
    if (group === 'physical') setPhysicalOverride(next);
    else setMentalOverride(next);
  }

  function formatApprovedProfile() {
    const lines = ['Raw transcript:', transcript.trim()];
    if (profileDetails) {
      lines.push('', 'Approved Lola profile:');
      PROFILE_LIST_FIELDS.forEach(({ key, label }) => {
        const values = profileDetails[key];
        if (values.length) lines.push(`${label}: ${values.join(', ')}`);
      });
    }
    return lines.join('\n');
  }

  async function handleConfirm() {
    if (finishing) return;
    setFinishing(true);
    const finalFrequency: ReminderFrequency = 'off';
    setRegion(selectedRegion);
    await completeOnboarding(
      [],
      { enabled: false, frequency: finalFrequency },
      {
        name,
        physicalConditions,
        mentalLoadConditions,
        conditions: [...physicalConditions, ...mentalLoadConditions],
        lolaIntro: formatApprovedProfile(),
      }
    );
    router.replace('/(tabs)');
  }

  function ConditionReview({ title, options, selected, group }: { title: string; options: string[]; selected: string[]; group: 'physical' | 'mental' }) {
    return (
      <View style={styles.reviewGroup}>
        <Text style={[styles.sectionLabel, { fontFamily: ff.semibold }]}>{title}</Text>
        <View style={styles.chipWrap}>
          {options.map((condition) => {
            const isSelected = selected.includes(condition);
            return (
              <Pressable key={`${title}-${condition}`} style={[styles.conditionChip, isSelected && styles.conditionChipSelected]} onPress={() => toggleCondition(condition, group)} accessibilityRole="checkbox" accessibilityState={{ checked: isSelected }} accessibilityLabel={condition}>
                <Text style={[styles.conditionText, isSelected && styles.conditionTextSelected, { fontFamily: ff.semibold }]}>{condition}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  if (reviewing) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}> 
        <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing.xl }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.lolaBlockSmall}>
            <Image source={Companion.Loading} style={styles.smallLola} resizeMode="contain" />
          </View>
          <Text style={[styles.stepTitle, { fontFamily: ff.bold }]}>Here’s what Lola understood.</Text>
          <Text style={[styles.stepSubtitle, { fontFamily: ff.regular }]}>Check what feels right. Anything uncertain is left blank and editable.</Text>
          {organiseMessage ? <Text style={[styles.warningText, { fontFamily: ff.regular }]}>{organiseMessage}</Text> : null}

          <View style={styles.card}>
            <Text style={[styles.sectionLabel, { fontFamily: ff.semibold }]}>Name</Text>
            <TextInput style={[styles.input, { fontFamily: ff.regular }]} value={name} onChangeText={setNameOverride} placeholder="Preferred name" placeholderTextColor={Colors.textSubtle} />

            <Text style={[styles.sectionLabel, { fontFamily: ff.semibold }]}>Region</Text>
            <View style={styles.regionRow}>
              {(['US', 'GB'] as Region[]).map((code) => {
                const selected = selectedRegion === code;
                return (
                  <Pressable key={code} style={[styles.regionCard, selected && styles.regionCardSelected]} onPress={() => setRegionOverride(code)}>
                    <Text style={[styles.regionText, selected && styles.regionTextSelected, { fontFamily: ff.semibold }]}>{code === 'US' ? 'United States' : 'United Kingdom'}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <ConditionReview title="Physical / Disability" options={PHYSICAL_CONDITIONS} selected={physicalConditions} group="physical" />
          <ConditionReview title="Neurodivergence / Mental Health" options={MENTAL_LOAD_CONDITIONS} selected={mentalLoadConditions} group="mental" />


          {profileDetails ? (
            <View style={styles.card}>
              <Text style={[styles.sectionLabel, { fontFamily: ff.semibold }]}>Other things Lola noticed</Text>
              {PROFILE_LIST_FIELDS.map(({ key, label, placeholder }) => (
                <View key={key} style={styles.detailField}>
                  <Text style={[styles.detailLabel, { fontFamily: ff.semibold }]}>{label}</Text>
                  <TextInput
                    style={[styles.detailInput, { fontFamily: ff.regular }]}
                    value={profileDetails[key].join('\n')}
                    onChangeText={(text) => updateProfileList(key, text)}
                    placeholder={placeholder}
                    placeholderTextColor={Colors.textSubtle}
                    multiline
                    textAlignVertical="top"
                  />
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={[styles.sectionLabel, { fontFamily: ff.semibold }]}>Source transcript</Text>
            <TextInput style={[styles.transcriptReview, { fontFamily: ff.regular }]} value={transcript} onChangeText={setTranscript} multiline textAlignVertical="top" placeholder="What you told Lola" placeholderTextColor={Colors.textSubtle} />
          </View>

          <Pressable style={[styles.primaryBtn, finishing && { opacity: 0.6 }]} onPress={handleConfirm} disabled={finishing}>
            <Text style={[styles.primaryBtnText, { fontFamily: ff.semibold }]}>{finishing ? 'Saving...' : 'Looks right'}</Text>
          </Pressable>
          <Pressable style={styles.secondaryBtn} onPress={() => setReviewing(false)}>
            <Text style={[styles.secondaryBtnText, { fontFamily: ff.semibold }]}>Back to transcript</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}> 
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing.xl }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.lolaBlock}>
          <Image source={Companion.FirstLaunch} style={styles.waveLola} resizeMode="contain" />
        </View>
        <Text style={[styles.stepTitle, { fontFamily: ff.bold }]}>Tell Lola about yourself.</Text>
        <Text style={[styles.stepSubtitle, { fontFamily: ff.regular }]}>Talk first. Lola will quietly organise what she can.</Text>

        <Pressable style={styles.micButton} onPress={() => setShowTyping(true)} accessibilityRole="button" accessibilityLabel="Tell Lola by voice">
          <MaterialIcons name="mic" size={46} color={Colors.text} />
          <Text style={[styles.micLabel, { fontFamily: ff.semibold }]}>Start with voice</Text>
          <Text style={[styles.micHint, { fontFamily: ff.regular }]}>Voice transcription is not available in this build yet. Type it exactly as you would say it.</Text>
        </Pressable>

        <View style={styles.examplesBox}>
          {INTRO_EXAMPLES.map((example) => (
            <Text key={example} style={[styles.exampleText, { fontFamily: ff.regular }]}>“{example}”</Text>
          ))}
        </View>

        {!showTyping ? (
          <Pressable style={styles.secondaryBtn} onPress={() => setShowTyping(true)}>
            <Text style={[styles.secondaryBtnText, { fontFamily: ff.semibold }]}>Type instead</Text>
          </Pressable>
        ) : (
          <TextInput
            style={[styles.introInput, { fontFamily: ff.regular }]}
            value={transcript}
            onChangeText={setTranscript}
            placeholder="Tell Lola anything useful…"
            placeholderTextColor={Colors.textSubtle}
            multiline
            textAlignVertical="top"
            maxLength={1200}
          />
        )}

        <Pressable style={[styles.primaryBtn, (transcript.trim().length === 0 || organising) && styles.primaryBtnDisabled]} onPress={beginReview} disabled={transcript.trim().length === 0 || organising}>
          <Text style={[styles.primaryBtnText, { fontFamily: ff.semibold }]}>{organising ? 'Lola is organising...' : 'Let Lola organise this'}</Text>
        </Pressable>
        <Text style={[styles.futureNoteText, { fontFamily: ff.regular }]}>Lola uses the secure Supabase AI function to organise your transcript. If that is unavailable, your transcript stays local and editable.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxxl, gap: Spacing.lg },
  lolaBlock: { alignItems: 'center', paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  lolaBlockSmall: { alignItems: 'center', paddingTop: Spacing.md },
  waveLola: { width: 190, height: 190 },
  smallLola: { width: 120, height: 140 },
  stepTitle: { fontSize: FontSizes.xxl, fontWeight: Fonts.bold, color: Colors.text, letterSpacing: -0.5 },
  stepSubtitle: { fontSize: FontSizes.base, color: Colors.textMuted, lineHeight: 24 },
  micButton: { alignItems: 'center', justifyContent: 'center', minHeight: 190, borderRadius: Radius.xl, borderWidth: 1.5, borderColor: Colors.primary, backgroundColor: Colors.primaryFaint, gap: Spacing.sm, padding: Spacing.lg },
  micLabel: { fontSize: FontSizes.lg, color: Colors.text, textAlign: 'center' },
  micHint: { fontSize: FontSizes.sm, color: Colors.textSubtle, textAlign: 'center', lineHeight: 20 },
  examplesBox: { gap: 6, backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md },
  exampleText: { fontSize: FontSizes.sm, color: Colors.textSecondary, lineHeight: 20 },
  secondaryBtn: { alignSelf: 'center', paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg },
  secondaryBtnText: { fontSize: FontSizes.base, color: Colors.primary },
  introInput: { minHeight: 170, backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.border, paddingVertical: 14, paddingHorizontal: Spacing.md, fontSize: FontSizes.base, color: Colors.text, lineHeight: 24 },
  primaryBtn: { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: 16, alignItems: 'center' },
  primaryBtnDisabled: { opacity: 0.45 },
  primaryBtnText: { fontSize: FontSizes.base, fontWeight: Fonts.semibold, color: Colors.background, letterSpacing: 0.2 },
  futureNoteText: { fontSize: FontSizes.sm, color: Colors.textSubtle, lineHeight: 20, textAlign: 'center' },
  warningText: { fontSize: FontSizes.sm, color: Colors.textSecondary, lineHeight: 20, backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, gap: Spacing.md },
  input: { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, paddingVertical: 12, paddingHorizontal: Spacing.md, fontSize: FontSizes.base, color: Colors.text },
  sectionLabel: { fontSize: FontSizes.sm, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.7 },
  regionRow: { gap: Spacing.sm },
  regionCard: { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, padding: Spacing.md },
  regionCardSelected: { backgroundColor: Colors.primaryFaint, borderColor: Colors.primary },
  regionText: { fontSize: FontSizes.base, color: Colors.text },
  regionTextSelected: { color: Colors.primary },
  reviewGroup: { gap: Spacing.sm },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  conditionChip: { borderRadius: Radius.full, paddingVertical: 10, paddingHorizontal: Spacing.md, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border },
  conditionChipSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  conditionText: { fontSize: FontSizes.sm, color: Colors.text },
  conditionTextSelected: { color: Colors.background },
  detailField: { gap: 6 },
  detailLabel: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  detailInput: { minHeight: 54, backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, fontSize: FontSizes.base, color: Colors.text, lineHeight: 22 },
  transcriptReview: { minHeight: 110, backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, fontSize: FontSizes.base, color: Colors.text, lineHeight: 24 },
});
