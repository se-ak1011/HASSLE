import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text, TextInput } from '@/components/ui/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, Radius } from '@/constants/theme';
import { useFontFamily } from '@/hooks/useFontFamily';
import { HomeBackButton } from '@/components/ui/HomeBackButton';
import { formatDateTimeForRegion } from '@/services/regionFormat';

const JOURNAL_KEY = 'hassle_journal_entries_v1';

type JournalEntry = {
  id: string;
  createdAt: string; // ISO timestamp
  text: string;
};

async function loadEntries(): Promise<JournalEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(JOURNAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function persistEntries(entries: JournalEntry[]): Promise<void> {
  try {
    await AsyncStorage.setItem(JOURNAL_KEY, JSON.stringify(entries));
  } catch {
    // silent local persistence failure
  }
}

export default function JournalScreen() {
  const insets = useSafeAreaInsets();
  const ff = useFontFamily();

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [draft, setDraft] = useState('');
  const [showTyping, setShowTyping] = useState(false);

  useEffect(() => {
    let mounted = true;
    loadEntries().then((loaded) => {
      if (mounted) setEntries(loaded);
    });
    return () => {
      mounted = false;
    };
  }, []);

  async function handleSave() {
    const text = draft.trim();
    if (!text) return;
    const entry: JournalEntry = {
      id: `${Date.now()}-${Math.round(Math.random() * 1e6)}`,
      createdAt: new Date().toISOString(),
      text,
    };
    const next = [entry, ...entries];
    setEntries(next);
    setDraft('');
    setShowTyping(false);
    await persistEntries(next);
  }

  async function handleDelete(id: string) {
    const next = entries.filter((e) => e.id !== id);
    setEntries(next);
    await persistEntries(next);
  }

  function formatWhen(iso: string): string {
    try {
      return formatDateTimeForRegion(new Date(iso));
    } catch {
      return iso;
    }
  }

  const canSave = draft.trim().length > 0;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <HomeBackButton />
        <Text style={[styles.headerTitle, { fontFamily: ff.semibold }]}>Journal</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing.xl }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.copy}>
            <Text style={[styles.title, { fontFamily: ff.bold }]}>Anything on your mind?</Text>
            <Text style={[styles.subtitle, { fontFamily: ff.regular }]}>Write whenever you like. No prompts, no pressure — Lola keeps it here for you.</Text>
          </View>

          {/* Voice-first entry (transcription stubbed for now, like onboarding) */}
          <Pressable
            style={styles.micButton}
            onPress={() => setShowTyping(true)}
            accessibilityRole="button"
            accessibilityLabel="Add a journal entry by voice"
          >
            <MaterialIcons name="mic" size={40} color={Colors.text} />
            <Text style={[styles.micLabel, { fontFamily: ff.semibold }]}>Start with voice</Text>
            <Text style={[styles.micHint, { fontFamily: ff.regular }]}>Voice transcription isn&apos;t available in this build yet. Tap to type it instead.</Text>
          </Pressable>

          {showTyping ? (
            <View style={styles.composer}>
              <TextInput
                style={[styles.input, { fontFamily: ff.regular }]}
                value={draft}
                onChangeText={setDraft}
                placeholder="Type whatever you'd say out loud…"
                placeholderTextColor={Colors.textSubtle}
                multiline
                textAlignVertical="top"
                autoFocus
                maxLength={4000}
              />
              <View style={styles.composerActions}>
                <Pressable
                  style={styles.cancelBtn}
                  onPress={() => {
                    setShowTyping(false);
                    setDraft('');
                  }}
                >
                  <Text style={[styles.cancelText, { fontFamily: ff.medium }]}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
                  onPress={handleSave}
                  disabled={!canSave}
                >
                  <Text style={[styles.saveText, { fontFamily: ff.semibold }]}>Save entry</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable style={styles.typeInsteadBtn} onPress={() => setShowTyping(true)}>
              <Text style={[styles.typeInsteadText, { fontFamily: ff.semibold }]}>Type instead</Text>
            </Pressable>
          )}

          {/* Past entries */}
          {entries.length > 0 ? (
            <View style={styles.entriesBlock}>
              <Text style={[styles.entriesHeading, { fontFamily: ff.medium }]}>Earlier</Text>
              {entries.map((entry) => (
                <View key={entry.id} style={styles.entryCard}>
                  <View style={styles.entryHeader}>
                    <Text style={[styles.entryWhen, { fontFamily: ff.medium }]}>{formatWhen(entry.createdAt)}</Text>
                    <Pressable
                      onPress={() => handleDelete(entry.id)}
                      hitSlop={10}
                      accessibilityRole="button"
                      accessibilityLabel="Delete entry"
                    >
                      <MaterialIcons name="close" size={16} color={Colors.textSubtle} />
                    </Pressable>
                  </View>
                  <Text style={[styles.entryText, { fontFamily: ff.regular }]}>{entry.text}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyBlock}>
              <Text style={[styles.emptyText, { fontFamily: ff.regular }]}>Whatever you write will live here — come back to it anytime.</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  headerTitle: { color: Colors.text, fontSize: FontSizes.lg },
  scroll: { paddingHorizontal: Spacing.lg },
  copy: { gap: Spacing.xs, paddingTop: Spacing.md, paddingBottom: Spacing.lg },
  title: { color: Colors.text, fontSize: FontSizes.xxl, lineHeight: 36, letterSpacing: -0.5 },
  subtitle: { color: Colors.textMuted, fontSize: FontSizes.base, lineHeight: 24 },
  micButton: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
  },
  micLabel: { color: Colors.text, fontSize: FontSizes.lg },
  micHint: { color: Colors.textSubtle, fontSize: FontSizes.sm, textAlign: 'center', lineHeight: 20 },
  composer: { marginTop: Spacing.md, gap: Spacing.md },
  input: {
    minHeight: 140,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    padding: Spacing.md,
    fontSize: FontSizes.base,
    color: Colors.text,
    lineHeight: 24,
  },
  composerActions: { flexDirection: 'row', gap: Spacing.sm },
  cancelBtn: { flex: 1, alignItems: 'center', paddingVertical: 13, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  cancelText: { color: Colors.textMuted, fontSize: FontSizes.sm },
  saveBtn: { flex: 2, alignItems: 'center', paddingVertical: 13, borderRadius: Radius.md, backgroundColor: Colors.primary },
  saveBtnDisabled: { opacity: 0.4 },
  saveText: { color: Colors.background, fontSize: FontSizes.base },
  typeInsteadBtn: { alignItems: 'center', paddingVertical: Spacing.md, marginTop: Spacing.sm },
  typeInsteadText: { color: Colors.primary, fontSize: FontSizes.sm },
  entriesBlock: { marginTop: Spacing.xl, gap: Spacing.sm },
  entriesHeading: { color: Colors.textSubtle, fontSize: FontSizes.sm, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.xs },
  entryCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, gap: Spacing.sm },
  entryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  entryWhen: { color: Colors.textSubtle, fontSize: FontSizes.xs },
  entryText: { color: Colors.text, fontSize: FontSizes.base, lineHeight: 23 },
  emptyBlock: { marginTop: Spacing.xl, alignItems: 'center', paddingHorizontal: Spacing.lg },
  emptyText: { color: Colors.textSubtle, fontSize: FontSizes.sm, textAlign: 'center', lineHeight: 20, fontStyle: 'italic' },
});
