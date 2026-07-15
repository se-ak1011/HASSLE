import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '@/components/ui/AppText';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontSizes, Radius, Spacing } from '@/constants/theme';
import { useFontFamily } from '@/hooks/useFontFamily';
import { BackButton } from '@/components/ui/BackButton';
import { useVoiceDictation } from '@/hooks/useVoiceDictation';
import {
  addLetter,
  deleteLetter,
  FutureLetter,
  isOpen,
  loadLetters,
  openDateLabel,
  SEAL_OPTIONS,
  SealDuration,
} from '@/services/futureLetters';

export default function LettersScreen() {
  const insets = useSafeAreaInsets();
  const ff = useFontFamily();
  const [body, setBody] = useState('');
  const [duration, setDuration] = useState<SealDuration>('6m');
  const [letters, setLetters] = useState<FutureLetter[]>([]);
  const [sealing, setSealing] = useState(false);
  const voice = useVoiceDictation(text => setBody(text));

  const refresh = useCallback(() => {
    loadLetters().then(setLetters);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  async function seal() {
    const text = body.trim();
    if (!text || sealing) return;
    setSealing(true);
    try {
      if (voice.listening) voice.stop();
      await addLetter(text, duration);
      setBody('');
      refresh();
      const label = SEAL_OPTIONS.find(o => o.key === duration)?.label ?? 'later';
      Alert.alert('Sealed 💜', `Your letter is sealed for ${label}. It'll be waiting for you.`);
    } finally {
      setSealing(false);
    }
  }

  function confirmDelete(letter: FutureLetter) {
    Alert.alert('Remove this letter?', 'This can’t be undone.', [
      { text: 'Keep', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => deleteLetter(letter.id).then(setLetters) },
    ]);
  }

  const now = Date.now();
  const sealed = letters.filter(l => !isOpen(l, now));
  const opened = letters.filter(l => isOpen(l, now));

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <BackButton />
        <Text style={[styles.headerTitle, { fontFamily: ff.semibold }]}>Letters</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.intro}>
          <Text style={[styles.title, { fontFamily: ff.bold }]}>Letters to yourself</Text>
          <Text style={[styles.subtitle, { fontFamily: ff.regular }]}>
            Write something to future-you, seal it, and open it later. A note from a day you got through.
          </Text>
        </View>

        {/* Compose */}
        <View style={styles.card}>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="Dear future me…"
            placeholderTextColor={Colors.textSubtle}
            style={[styles.input, { fontFamily: ff.regular }]}
            multiline
            textAlignVertical="top"
          />
          <View style={styles.composeRow}>
            <Pressable
              style={({ pressed }) => [styles.voiceButton, voice.listening && styles.voiceButtonOn, pressed && styles.pressed]}
              onPress={() => voice.supported && voice.toggle()}
              accessibilityRole="button"
              accessibilityLabel="Dictate your letter"
            >
              <MaterialIcons name="mic" size={17} color={voice.listening ? Colors.background : Colors.textMuted} />
              <Text style={[styles.voiceText, voice.listening && styles.voiceTextOn, { fontFamily: ff.semibold }]}>
                {voice.listening ? 'Listening…' : 'Voice'}
              </Text>
            </Pressable>
          </View>

          <Text style={[styles.sealLabel, { fontFamily: ff.semibold }]}>Open it in…</Text>
          <View style={styles.durationRow}>
            {SEAL_OPTIONS.map(o => {
              const on = o.key === duration;
              return (
                <Pressable
                  key={o.key}
                  onPress={() => setDuration(o.key)}
                  style={({ pressed }) => [styles.durationChip, on && styles.durationChipOn, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                >
                  <Text style={[styles.durationText, on && styles.durationTextOn, { fontFamily: ff.semibold }]}>{o.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            style={({ pressed }) => [styles.sealButton, !body.trim() && styles.sealButtonDisabled, pressed && !!body.trim() && styles.pressed]}
            onPress={seal}
            disabled={!body.trim() || sealing}
            accessibilityRole="button"
            accessibilityLabel="Seal this letter"
          >
            <MaterialIcons name="lock" size={17} color={Colors.background} />
            <Text style={[styles.sealButtonText, { fontFamily: ff.semibold }]}>{sealing ? 'Sealing…' : 'Seal it'}</Text>
          </Pressable>
        </View>

        {/* Ready to open */}
        {opened.length > 0 ? (
          <>
            <Text style={[styles.sectionTitle, { fontFamily: ff.semibold }]}>Ready to open</Text>
            {opened.map(letter => (
              <View key={letter.id} style={[styles.card, styles.openedCard]}>
                <View style={styles.openedHeader}>
                  <MaterialIcons name="mail" size={18} color={Colors.primaryLight} />
                  <Text style={[styles.openedDate, { fontFamily: ff.semibold }]}>Sealed {openDateLabel(letter)}</Text>
                  <Pressable onPress={() => confirmDelete(letter)} hitSlop={10} accessibilityLabel="Remove letter">
                    <MaterialIcons name="close" size={16} color={Colors.textSubtle} />
                  </Pressable>
                </View>
                <Text style={[styles.openedBody, { fontFamily: ff.regular }]}>{letter.body}</Text>
              </View>
            ))}
          </>
        ) : null}

        {/* Sealed */}
        {sealed.length > 0 ? (
          <>
            <Text style={[styles.sectionTitle, { fontFamily: ff.semibold }]}>Sealed</Text>
            {sealed.map(letter => (
              <View key={letter.id} style={[styles.card, styles.sealedCard]}>
                <MaterialIcons name="lock" size={18} color={Colors.textSubtle} />
                <View style={styles.sealedText}>
                  <Text style={[styles.sealedTitle, { fontFamily: ff.semibold }]}>A letter to yourself</Text>
                  <Text style={[styles.sealedDate, { fontFamily: ff.regular }]}>Opens {openDateLabel(letter)}</Text>
                </View>
                <Pressable onPress={() => confirmDelete(letter)} hitSlop={10} accessibilityLabel="Remove letter">
                  <MaterialIcons name="close" size={16} color={Colors.textSubtle} />
                </Pressable>
              </View>
            ))}
          </>
        ) : null}

        {letters.length === 0 ? (
          <Text style={[styles.empty, { fontFamily: ff.regular }]}>No letters yet. Whenever you’re ready.</Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  headerTitle: { color: Colors.text, fontSize: FontSizes.lg },
  scroll: { paddingHorizontal: Spacing.lg },
  intro: { gap: Spacing.xs, paddingTop: Spacing.sm, paddingBottom: Spacing.lg },
  title: { color: Colors.text, fontSize: FontSizes.xxxl, lineHeight: 44, letterSpacing: -0.8 },
  subtitle: { color: Colors.textMuted, fontSize: FontSizes.base, lineHeight: 24 },
  card: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.md },
  input: { minHeight: 128, color: Colors.text, fontSize: FontSizes.base, lineHeight: 24 },
  composeRow: { flexDirection: 'row', marginTop: Spacing.sm },
  voiceButton: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 8, backgroundColor: Colors.surfaceElevated },
  voiceButtonOn: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  voiceText: { color: Colors.textMuted, fontSize: FontSizes.sm },
  voiceTextOn: { color: Colors.background },
  sealLabel: { color: Colors.textMuted, fontSize: FontSizes.sm, marginTop: Spacing.md, marginBottom: Spacing.sm },
  durationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  durationChip: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.full, backgroundColor: Colors.surfaceElevated, paddingHorizontal: Spacing.md, paddingVertical: 8 },
  durationChipOn: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  durationText: { color: Colors.textMuted, fontSize: FontSizes.sm },
  durationTextOn: { color: Colors.background },
  sealButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: Spacing.lg, paddingVertical: 11 },
  sealButtonDisabled: { opacity: 0.42 },
  sealButtonText: { color: Colors.background, fontSize: FontSizes.base },
  sectionTitle: { color: Colors.textMuted, fontSize: FontSizes.sm, marginTop: Spacing.sm, marginBottom: Spacing.sm },
  openedCard: { borderColor: Colors.accent + '40' },
  openedHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  openedDate: { flex: 1, color: Colors.textSecondary, fontSize: FontSizes.sm },
  openedBody: { color: Colors.text, fontSize: FontSizes.base, lineHeight: 24 },
  sealedCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  sealedText: { flex: 1 },
  sealedTitle: { color: Colors.textSecondary, fontSize: FontSizes.base },
  sealedDate: { color: Colors.textSubtle, fontSize: FontSizes.sm, marginTop: 2 },
  empty: { color: Colors.textSubtle, fontSize: FontSizes.sm, textAlign: 'center', paddingTop: Spacing.lg },
  pressed: { opacity: 0.75 },
});
