import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { Text, TextInput } from '@/components/ui/AppText';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSizes, Radius } from '@/constants/theme';
import { useFontFamily } from '@/hooks/useFontFamily';
import { HomeBackButton } from '@/components/ui/HomeBackButton';
import { BodyTagOrbit } from '@/components/ui/BodyTagOrbit';
import { useVoiceDictation } from '@/hooks/useVoiceDictation';
import { BODY_CATEGORIES } from '@/constants/bodyCategories';
import { BodyDrafts, EMPTY_DRAFT, loadBodyDrafts, saveBodyDrafts } from '@/services/bodyDrafts';
import { tellLolaAboutBody } from '@/services/aiLola';

// Body is a single screen: a carousel of Lolas (one per category). Each Lola
// shows her category label; tap her and the tags spread radially around her like
// the Home/Mind menu chips. Selecting tags logs them (remembered per category);
// a "Tell Lola" note and any follow-up tags sit just below when she's open.

function resultToText(result: unknown): string {
  if (typeof result === 'string') return result;
  if (result && typeof result === 'object' && typeof (result as { summary?: string }).summary === 'string') {
    return (result as { summary: string }).summary;
  }
  return 'Lola has noted that.';
}

export default function BodyScreen() {
  const insets = useSafeAreaInsets();
  const ff = useFontFamily();
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const carousel = useRef<FlatList>(null);

  const active = BODY_CATEGORIES[index];
  const activeIdRef = useRef(active.id);
  activeIdRef.current = active.id;

  // Remembered tags + note per category, autosaved on every change.
  const [drafts, setDrafts] = useState<BodyDrafts>({});
  const [draftsLoaded, setDraftsLoaded] = useState(false);
  useEffect(() => {
    loadBodyDrafts().then(d => {
      setDrafts(d);
      setDraftsLoaded(true);
    });
  }, []);

  const activeDraft = drafts[active.id] ?? EMPTY_DRAFT;

  const toggleField = useCallback((cat: string, field: 'primary' | 'secondary', value: string) => {
    setDrafts(prev => {
      const cur = prev[cat as keyof BodyDrafts] ?? EMPTY_DRAFT;
      const list = cur[field];
      const nextList = list.includes(value) ? list.filter(v => v !== value) : [...list, value];
      const next = { ...prev, [cat]: { ...cur, [field]: nextList } };
      saveBodyDrafts(next);
      return next;
    });
  }, []);

  const setTranscript = useCallback((cat: string, text: string) => {
    setDrafts(prev => {
      const cur = prev[cat as keyof BodyDrafts] ?? EMPTY_DRAFT;
      const next = { ...prev, [cat]: { ...cur, transcript: text } };
      saveBodyDrafts(next);
      return next;
    });
  }, []);

  const voice = useVoiceDictation(text => setTranscript(activeIdRef.current, text));

  // AI "Tell Lola" state — reset when the category changes.
  const [loading, setLoading] = useState(false);
  const [lolaNote, setLolaNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setOpen(false);
    setLolaNote(null);
    setError(null);
  }, [index]);

  const goTo = useCallback((next: number) => {
    const clamped = Math.max(0, Math.min(BODY_CATEGORIES.length - 1, next));
    setIndex(clamped);
    carousel.current?.scrollToIndex({ index: clamped, animated: true });
  }, []);

  const onMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = Math.round(e.nativeEvent.contentOffset.x / width);
      if (next !== index) setIndex(next);
    },
    [index, width]
  );

  async function tellLola() {
    if (loading) return;
    setLoading(true);
    setError(null);
    setLolaNote(null);
    try {
      const response = await tellLolaAboutBody({
        category: active.id,
        selected: { primary: activeDraft.primary, secondary: activeDraft.secondary },
        transcript: activeDraft.transcript,
        voiceRequested: voice.listening,
        instruction: 'Summarise this body conversation into structured information while preserving the original transcript.',
      });
      if (!response.ok) {
        setError(response.error ?? 'Lola could not listen right now. Saved locally — try again later.');
      } else {
        setLolaNote(resultToText(response.result));
      }
    } catch {
      setError('Lola could not listen right now. Saved locally — try again later.');
    } finally {
      setLoading(false);
    }
  }

  const hasSecondary = (active.secondaryChips?.length ?? 0) > 0 && activeDraft.primary.length > 0;
  const canTellLola = activeDraft.primary.length > 0 || activeDraft.secondary.length > 0 || activeDraft.transcript.trim().length > 0;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <HomeBackButton />
        <Text style={[styles.headerTitle, { fontFamily: ff.semibold }]}>Body</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.copy}>
          <Text style={[styles.title, { fontFamily: ff.bold }]}>Body</Text>
          <Text style={[styles.subtitle, { fontFamily: ff.regular }]}>Swipe to the part that fits. Tap Lola, and pick what you notice.</Text>
        </View>

        {/* Category tabs — jump + position. */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow} style={styles.tabScroll}>
          {BODY_CATEGORIES.map((c, i) => {
            const on = i === index;
            return (
              <Pressable key={c.id} onPress={() => goTo(i)} style={({ pressed }) => [styles.tab, on && styles.tabOn, pressed && styles.pressed]} accessibilityRole="button" accessibilityState={{ selected: on }}>
                <Text style={[styles.tabText, on && styles.tabTextOn, { fontFamily: ff.semibold }]}>{c.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* The Lola carousel — each one spreads her tags on tap. */}
        <View style={[styles.carouselWrap, { width, marginLeft: -Spacing.lg }]}>
          <FlatList
            ref={carousel}
            data={BODY_CATEGORIES}
            keyExtractor={c => c.id}
            horizontal
            pagingEnabled
            scrollEnabled={!open}
            extraData={{ index, open, draftsLoaded, drafts }}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onMomentumEnd}
            getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
            renderItem={({ item }) => (
              <View style={{ width, alignItems: 'center' }}>
                <BodyTagOrbit
                  companion={item.companion}
                  label={item.label}
                  tags={item.primaryChips}
                  selected={(drafts[item.id]?.primary) ?? []}
                  open={open && item.id === active.id}
                  onPressLola={() => setOpen(o => !o)}
                  onToggleTag={tag => toggleField(item.id, 'primary', tag)}
                />
              </View>
            )}
          />
        </View>

        {!open ? (
          <Text style={[styles.hint, { fontFamily: ff.regular }]}>Tap Lola to spread her tags.</Text>
        ) : (
          <View style={styles.below}>
            {/* Follow-up tags (e.g. what the pain feels like). */}
            {hasSecondary ? (
              <View style={styles.secondaryWrap}>
                {active.secondaryTitle ? <Text style={[styles.secondaryTitle, { fontFamily: ff.semibold }]}>{active.secondaryTitle}</Text> : null}
                <View style={styles.secondaryChips}>
                  {active.secondaryChips!.map(chip => {
                    const on = activeDraft.secondary.includes(chip);
                    return (
                      <Pressable key={chip} onPress={() => toggleField(active.id, 'secondary', chip)} style={({ pressed }) => [styles.smallChip, on && styles.smallChipOn, pressed && styles.pressed]} accessibilityRole="button" accessibilityState={{ selected: on }}>
                        <Text style={[styles.smallChipText, on && styles.smallChipTextOn, { fontFamily: ff.semibold }]}>{chip}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {/* Tell Lola — voice or text. */}
            <View style={styles.tellLola}>
              <Text style={[styles.tellTitle, { fontFamily: ff.semibold }]}>Tell Lola</Text>
              <View style={styles.tellRow}>
                <Pressable
                  style={({ pressed }) => [styles.voiceButton, voice.listening && styles.voiceButtonOn, pressed && styles.pressed]}
                  onPress={() => voice.supported && voice.toggle()}
                  accessibilityRole="button"
                  accessibilityLabel="Voice note"
                >
                  <MaterialIcons name="mic" size={17} color={voice.listening ? Colors.background : Colors.textMuted} />
                  <Text style={[styles.voiceText, voice.listening && styles.voiceTextOn, { fontFamily: ff.semibold }]}>{voice.listening ? 'Listening…' : 'Voice'}</Text>
                </Pressable>
              </View>
              <TextInput
                value={activeDraft.transcript}
                onChangeText={t => setTranscript(active.id, t)}
                placeholder={active.textPlaceholder ?? 'Tell Lola in your own words…'}
                placeholderTextColor={Colors.textSubtle}
                style={[styles.input, { fontFamily: ff.regular }]}
                multiline
                textAlignVertical="top"
              />
              <Pressable
                style={({ pressed }) => [styles.sendButton, !canTellLola && styles.sendDisabled, pressed && canTellLola && styles.pressed]}
                onPress={tellLola}
                disabled={!canTellLola || loading}
                accessibilityRole="button"
                accessibilityLabel="Send to Lola"
              >
                {loading ? <ActivityIndicator color={Colors.background} size="small" /> : <MaterialIcons name="auto-awesome" size={17} color={Colors.background} />}
                <Text style={[styles.sendText, { fontFamily: ff.semibold }]}>{loading ? 'Listening…' : 'Send to Lola'}</Text>
              </Pressable>
              {lolaNote ? <Text style={[styles.lolaNote, { fontFamily: ff.regular }]}>{lolaNote}</Text> : null}
              {error ? <Text style={[styles.errorText, { fontFamily: ff.regular }]}>{error}</Text> : null}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  headerTitle: { color: Colors.text, fontSize: FontSizes.lg },
  scroll: { paddingHorizontal: Spacing.lg },
  copy: { alignItems: 'center', gap: Spacing.xs, paddingTop: Spacing.sm, paddingBottom: Spacing.sm },
  title: { color: Colors.text, fontSize: FontSizes.xxxl, lineHeight: 44, letterSpacing: -0.8 },
  subtitle: { color: Colors.textMuted, fontSize: FontSizes.base, lineHeight: 24, textAlign: 'center' },
  tabScroll: { flexGrow: 0 },
  tabRow: { gap: Spacing.sm, paddingVertical: Spacing.xs, paddingRight: Spacing.sm },
  tab: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.full, backgroundColor: Colors.surface, paddingHorizontal: Spacing.md, paddingVertical: 8 },
  tabOn: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  tabText: { color: Colors.textMuted, fontSize: FontSizes.sm },
  tabTextOn: { color: Colors.background },
  carouselWrap: { alignItems: 'center' },
  hint: { color: Colors.textSubtle, fontSize: FontSizes.sm, fontStyle: 'italic', textAlign: 'center', marginTop: Spacing.sm },
  below: { marginTop: Spacing.sm },
  secondaryWrap: { gap: Spacing.sm, marginBottom: Spacing.lg },
  secondaryTitle: { color: Colors.textMuted, fontSize: FontSizes.sm, textAlign: 'center' },
  secondaryChips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.sm },
  smallChip: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.full, backgroundColor: Colors.surface, paddingHorizontal: Spacing.md, paddingVertical: 8 },
  smallChipOn: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  smallChipText: { color: Colors.text, fontSize: FontSizes.sm },
  smallChipTextOn: { color: Colors.background },
  tellLola: { gap: Spacing.sm },
  tellTitle: { color: Colors.text, fontSize: FontSizes.xl },
  tellRow: { flexDirection: 'row' },
  voiceButton: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 9, backgroundColor: Colors.surface },
  voiceButtonOn: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  voiceText: { color: Colors.textMuted, fontSize: FontSizes.sm },
  voiceTextOn: { color: Colors.background },
  input: { minHeight: 96, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.xl, backgroundColor: Colors.surface, color: Colors.text, fontSize: FontSizes.base, lineHeight: 23, padding: Spacing.md },
  sendButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: Spacing.lg, paddingVertical: 11 },
  sendDisabled: { opacity: 0.42 },
  sendText: { color: Colors.background, fontSize: FontSizes.base },
  lolaNote: { color: Colors.textMuted, fontSize: FontSizes.sm, lineHeight: 21, paddingTop: Spacing.sm },
  errorText: { color: Colors.danger, fontSize: FontSizes.sm, lineHeight: 20 },
  pressed: { opacity: 0.75 },
});
