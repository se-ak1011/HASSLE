import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '@/components/ui/AppText';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, FontSizes, Radius, Spacing } from '@/constants/theme';
import { useFontFamily } from '@/hooks/useFontFamily';
import { useVoiceDictation } from '@/hooks/useVoiceDictation';
import { tellLolaAboutBody, type BodyLolaCategory } from '@/services/aiLola';
import type { BodyDraft } from '@/services/bodyDrafts';

// The logging surface for one Body category — chips + "Tell Lola" — with no
// header, title, or Lola image of its own. Rendered inline under the Body
// carousel (and reused by the standalone /body-* routes). Keep this the single
// place body logging happens so the data model stays identical everywhere.

type BodyLogPanelProps = {
  category: BodyLolaCategory;
  primaryChips: string[];
  secondaryTitle?: string;
  secondaryChips?: string[];
  textPlaceholder?: string;
  // Remembered selections for this category. When provided, the panel starts
  // from them and reports every change back so the parent can autosave.
  initialDraft?: BodyDraft;
  onChangeDraft?: (draft: BodyDraft) => void;
};

type BodyAiResult = { summary?: string; structured?: unknown; originalTranscript?: string };

function resultToText(result: unknown): string {
  if (typeof result === 'string') return result;
  if (result && typeof result === 'object') {
    const record = result as BodyAiResult;
    if (typeof record.summary === 'string') return record.summary;
  }
  return 'Lola has noted that.';
}

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter(item => item !== value) : [...list, value];
}

export function BodyLogPanel({
  category,
  primaryChips,
  secondaryTitle,
  secondaryChips = [],
  textPlaceholder = 'Tell Lola in your own words...',
  initialDraft,
  onChangeDraft,
}: BodyLogPanelProps) {
  const ff = useFontFamily();
  const [selectedPrimary, setSelectedPrimary] = useState<string[]>(initialDraft?.primary ?? []);
  const [selectedSecondary, setSelectedSecondary] = useState<string[]>(initialDraft?.secondary ?? []);
  const [transcript, setTranscript] = useState(initialDraft?.transcript ?? '');
  const [voiceRequested, setVoiceRequested] = useState(false);

  // Autosave: report selections up whenever they change. Skips the very first
  // render so we don't immediately echo the initial draft back.
  const hydrated = useRef(false);
  useEffect(() => {
    if (!hydrated.current) {
      hydrated.current = true;
      return;
    }
    onChangeDraft?.({ primary: selectedPrimary, secondary: selectedSecondary, transcript });
  }, [selectedPrimary, selectedSecondary, transcript, onChangeDraft]);
  const [loading, setLoading] = useState(false);
  const [lolaNote, setLolaNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const voice = useVoiceDictation(text => setTranscript(text));

  async function tellLola() {
    if (loading) return;
    setLoading(true);
    setError(null);
    setLolaNote(null);
    let response: Awaited<ReturnType<typeof tellLolaAboutBody>>;
    try {
      response = await tellLolaAboutBody({
        category,
        selected: { primary: selectedPrimary, secondary: selectedSecondary },
        transcript,
        voiceRequested,
        instruction: 'Summarise this body conversation into structured information while preserving the original transcript.',
      });
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Lola could not listen right now.';
      response = { ok: false, error: message, fallback: true };
    }
    setLoading(false);
    if (!response.ok) {
      setError(response.error ?? 'Lola could not listen right now. Saved locally — try Lola again later.');
      return;
    }
    setLolaNote(resultToText(response.result));
  }

  const canTellLola = selectedPrimary.length > 0 || selectedSecondary.length > 0 || transcript.trim().length > 0 || voiceRequested;

  return (
    <View>
      <View style={styles.chipGroup}>
        {primaryChips.map(chip => {
          const selected = selectedPrimary.includes(chip);
          return (
            <Pressable
              key={chip}
              style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressed]}
              onPress={() => setSelectedPrimary(current => toggle(current, chip))}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={chip}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected, { fontFamily: ff.semibold }]}>{chip}</Text>
            </Pressable>
          );
        })}
      </View>

      {selectedPrimary.length > 0 && secondaryChips.length > 0 ? (
        <View style={styles.softSection}>
          {secondaryTitle ? <Text style={[styles.sectionTitle, { fontFamily: ff.semibold }]}>{secondaryTitle}</Text> : null}
          <View style={styles.chipGroupTight}>
            {secondaryChips.map(chip => {
              const selected = selectedSecondary.includes(chip);
              return (
                <Pressable
                  key={chip}
                  style={({ pressed }) => [styles.smallChip, selected && styles.chipSelected, pressed && styles.pressed]}
                  onPress={() => setSelectedSecondary(current => toggle(current, chip))}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={chip}
                >
                  <Text style={[styles.smallChipText, selected && styles.chipTextSelected, { fontFamily: ff.semibold }]}>{chip}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      <View style={styles.tellLola}>
        <Text style={[styles.tellTitle, { fontFamily: ff.semibold }]}>Tell Lola</Text>
        <Text style={[styles.tellSubtitle, { fontFamily: ff.regular }]}>Voice or text. Only if it helps.</Text>
        <View style={styles.tellActions}>
          <Pressable
            style={({ pressed }) => [styles.voiceButton, (voice.listening || voiceRequested) && styles.voiceButtonSelected, pressed && styles.pressed]}
            onPress={() => {
              setVoiceRequested(true);
              if (voice.supported) voice.toggle();
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: voice.listening || voiceRequested }}
            accessibilityLabel="Voice note"
          >
            <MaterialIcons name="mic" size={17} color={voice.listening || voiceRequested ? Colors.background : Colors.textMuted} />
            <Text style={[styles.voiceText, (voice.listening || voiceRequested) && styles.voiceTextSelected, { fontFamily: ff.semibold }]}>
              {voice.listening ? 'Listening…' : 'Voice'}
            </Text>
          </Pressable>
        </View>
        <TextInput
          value={transcript}
          onChangeText={setTranscript}
          placeholder={textPlaceholder}
          placeholderTextColor={Colors.textSubtle}
          style={[styles.input, { fontFamily: ff.regular }]}
          multiline
          textAlignVertical="top"
        />
        <Pressable
          style={({ pressed }) => [styles.sendButton, !canTellLola && styles.sendButtonDisabled, pressed && canTellLola && styles.pressed]}
          onPress={tellLola}
          disabled={!canTellLola || loading}
          accessibilityRole="button"
          accessibilityLabel="Send to Lola"
        >
          {loading ? <ActivityIndicator color={Colors.background} size="small" /> : <MaterialIcons name="auto-awesome" size={17} color={Colors.background} />}
          <Text style={[styles.sendText, { fontFamily: ff.semibold }]}>{loading ? 'Listening...' : 'Send to Lola'}</Text>
        </Pressable>
        {lolaNote ? <Text style={[styles.lolaNote, { fontFamily: ff.regular }]}>{lolaNote}</Text> : null}
        {error ? <Text style={[styles.error, { fontFamily: ff.regular }]}>{error}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chipGroup: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.sm, paddingVertical: Spacing.md },
  chipGroupTight: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.sm },
  chip: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.full, backgroundColor: Colors.surface, paddingHorizontal: Spacing.lg, paddingVertical: 11 },
  smallChip: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.full, backgroundColor: Colors.surface, paddingHorizontal: Spacing.md, paddingVertical: 9 },
  chipSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  chipText: { color: Colors.text, fontSize: FontSizes.base },
  smallChipText: { color: Colors.text, fontSize: FontSizes.sm },
  chipTextSelected: { color: Colors.background },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
  softSection: { gap: Spacing.sm, paddingVertical: Spacing.md },
  sectionTitle: { color: Colors.textMuted, fontSize: FontSizes.sm, textAlign: 'center' },
  tellLola: { gap: Spacing.sm, paddingTop: Spacing.lg },
  tellTitle: { color: Colors.text, fontSize: FontSizes.xl },
  tellSubtitle: { color: Colors.textMuted, fontSize: FontSizes.sm, lineHeight: 20 },
  tellActions: { flexDirection: 'row' },
  voiceButton: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 9, backgroundColor: Colors.surface },
  voiceButtonSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  voiceText: { color: Colors.textMuted, fontSize: FontSizes.sm },
  voiceTextSelected: { color: Colors.background },
  input: { minHeight: 104, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.xl, backgroundColor: Colors.surface, color: Colors.text, fontSize: FontSizes.base, lineHeight: 23, padding: Spacing.md },
  sendButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: Spacing.lg, paddingVertical: 11 },
  sendButtonDisabled: { opacity: 0.42 },
  sendText: { color: Colors.background, fontSize: FontSizes.base },
  lolaNote: { color: Colors.textMuted, fontSize: FontSizes.sm, lineHeight: 21, paddingTop: Spacing.sm },
  error: { color: Colors.danger, fontSize: FontSizes.sm, lineHeight: 20 },
});
