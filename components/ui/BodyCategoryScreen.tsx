import React, { useState } from 'react';
import { useVoiceDictation } from '@/hooks/useVoiceDictation';
import { ActivityIndicator, Image, ImageSourcePropType, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '@/components/ui/AppText';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontSizes, Radius, Spacing } from '@/constants/theme';
import { useFontFamily } from '@/hooks/useFontFamily';
import { Companion } from '@/constants/companion';
import { BackButton } from '@/components/ui/BackButton';
import { tellLolaAboutBody } from '@/services/aiLola';

type BodyCategoryScreenProps = {
  category: 'pain' | 'fatigue' | 'symptoms' | 'medication' | 'self-care';
  title: string;
  subtitle: string;
  primaryChips: string[];
  secondaryTitle?: string;
  secondaryChips?: string[];
  textPlaceholder?: string;
  companion?: ImageSourcePropType;
};

type BodyAiResult = {
  summary?: string;
  structured?: unknown;
  originalTranscript?: string;
};

function resultToText(result: unknown): string {
  if (typeof result === 'string') return result;
  if (result && typeof result === 'object') {
    const record = result as BodyAiResult;
    if (typeof record.summary === 'string') return record.summary;
  }
  return 'Lola has noted that.';
}

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export function BodyCategoryScreen({
  category,
  title,
  subtitle,
  primaryChips,
  secondaryTitle,
  secondaryChips = [],
  textPlaceholder = 'Tell Lola in your own words...',
  companion = Companion.Body,
}: BodyCategoryScreenProps) {
  const insets = useSafeAreaInsets();
  const ff = useFontFamily();
  const [selectedPrimary, setSelectedPrimary] = useState<string[]>([]);
  const [selectedSecondary, setSelectedSecondary] = useState<string[]>([]);
  const [transcript, setTranscript] = useState('');
  const [voiceRequested, setVoiceRequested] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lolaNote, setLolaNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Stream spoken words into the note. Falls back to plain typing if unsupported.
  const voice = useVoiceDictation((text) => setTranscript(text));

  async function tellLola() {
    if (loading) return;
    setLoading(true);
    setError(null);
    setLolaNote(null);
    let response: Awaited<ReturnType<typeof tellLolaAboutBody>>;
    try {
      response = await tellLolaAboutBody({
        category,
        selected: {
          primary: selectedPrimary,
          secondary: selectedSecondary,
        },
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
    <View style={[styles.root, { paddingTop: insets.top }]}> 
      <View style={styles.header}>
        <BackButton />
        <Text style={[styles.headerTitle, { fontFamily: ff.semibold }]}>{title}</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing.xl }]} showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <Text style={[styles.title, { fontFamily: ff.bold }]}>{title}</Text>
          <Text style={[styles.subtitle, { fontFamily: ff.regular }]}>{subtitle}</Text>
        </View>

        <View style={styles.lolaWrap}>
          <Image source={companion} style={styles.lola} resizeMode="contain" accessibilityLabel="Lola" />
        </View>

        <View style={styles.chipGroup}>
          {primaryChips.map((chip) => {
            const selected = selectedPrimary.includes(chip);
            return (
              <Pressable
                key={chip}
                style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressed]}
                onPress={() => setSelectedPrimary((current) => toggle(current, chip))}
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
              {secondaryChips.map((chip) => {
                const selected = selectedSecondary.includes(chip);
                return (
                  <Pressable
                    key={chip}
                    style={({ pressed }) => [styles.smallChip, selected && styles.chipSelected, pressed && styles.pressed]}
                    onPress={() => setSelectedSecondary((current) => toggle(current, chip))}
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
              <MaterialIcons name="mic" size={17} color={(voice.listening || voiceRequested) ? Colors.background : Colors.textMuted} />
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  headerTitle: { color: Colors.text, fontSize: FontSizes.lg },
  scroll: { paddingHorizontal: Spacing.lg },
  intro: { gap: Spacing.xs, paddingTop: Spacing.md, paddingBottom: Spacing.lg },
  title: { color: Colors.text, fontSize: FontSizes.xxxl, lineHeight: 44, letterSpacing: -0.8 },
  subtitle: { color: Colors.textMuted, fontSize: FontSizes.base, lineHeight: 24 },
  lolaWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.lg },
  lola: { width: 176, height: 220 },
  chipGroup: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.sm, paddingVertical: Spacing.lg },
  chipGroupTight: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.full, backgroundColor: Colors.surface, paddingHorizontal: Spacing.lg, paddingVertical: 11 },
  smallChip: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.full, backgroundColor: Colors.surface, paddingHorizontal: Spacing.md, paddingVertical: 9 },
  chipSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  chipText: { color: Colors.text, fontSize: FontSizes.base },
  smallChipText: { color: Colors.text, fontSize: FontSizes.sm },
  chipTextSelected: { color: Colors.background },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
  softSection: { gap: Spacing.sm, paddingVertical: Spacing.md },
  sectionTitle: { color: Colors.textMuted, fontSize: FontSizes.sm },
  tellLola: { gap: Spacing.sm, paddingTop: Spacing.xl },
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
