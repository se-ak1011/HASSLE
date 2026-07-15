import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { Text } from '@/components/ui/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSizes, Radius } from '@/constants/theme';
import { useFontFamily } from '@/hooks/useFontFamily';
import { HomeBackButton } from '@/components/ui/HomeBackButton';
import { BodyLogPanel } from '@/components/ui/BodyLogPanel';
import { PulseRing } from '@/components/ui/PulseRing';
import { BODY_CATEGORIES } from '@/constants/bodyCategories';
import { BodyDraft, BodyDrafts, loadBodyDrafts, saveBodyDrafts } from '@/services/bodyDrafts';

// Body is a single screen: a horizontal carousel of Lola poses (one active at a
// time). Swiping or tapping a tab changes the active Lola, and that category's
// logging chips + "Tell Lola" appear directly underneath — no navigation, no
// modal. Everything is logged from here.
// Gentle "bloom" — Lola's chips ease in from her when tapped open.
function RevealView({ children }: { children: React.ReactNode }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 260, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
  }, [v]);
  return (
    <Animated.View
      style={{
        opacity: v,
        transform: [
          { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) },
          { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}

export default function BodyScreen() {
  const insets = useSafeAreaInsets();
  const ff = useFontFamily();
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const carousel = useRef<FlatList>(null);

  const active = BODY_CATEGORIES[index];

  // Tap Lola to reveal her chips (like the Home Lola). Each new Lola starts
  // calm — swiping or tapping a tab collapses the previous one.
  const [open, setOpen] = useState(false);
  useEffect(() => {
    setOpen(false);
  }, [index]);

  // Remembered chips + note per category. Loaded once, autosaved on every change
  // (so swiping, tapping a tab, or leaving all keep what you'd picked).
  const [drafts, setDrafts] = useState<BodyDrafts>({});
  const [draftsLoaded, setDraftsLoaded] = useState(false);
  const activeIdRef = useRef(active.id);
  activeIdRef.current = active.id;

  useEffect(() => {
    loadBodyDrafts().then(d => {
      setDrafts(d);
      setDraftsLoaded(true);
    });
  }, []);

  const handleDraftChange = useCallback((draft: BodyDraft) => {
    const cat = activeIdRef.current;
    setDrafts(prev => {
      const next = { ...prev, [cat]: draft };
      saveBodyDrafts(next);
      return next;
    });
  }, []);

  const goTo = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(BODY_CATEGORIES.length - 1, next));
      setIndex(clamped);
      carousel.current?.scrollToIndex({ index: clamped, animated: true });
    },
    []
  );

  const onMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = Math.round(e.nativeEvent.contentOffset.x / width);
      if (next !== index) setIndex(next);
    },
    [index, width]
  );

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
          <Text style={[styles.subtitle, { fontFamily: ff.regular }]}>Swipe Lola to the part that fits. Tap what you notice.</Text>
        </View>

        {/* Category tabs — highlight the active Lola, jump on tap. */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabRow}
          style={styles.tabScroll}
        >
          {BODY_CATEGORIES.map((c, i) => {
            const on = i === index;
            return (
              <Pressable
                key={c.id}
                onPress={() => goTo(i)}
                style={({ pressed }) => [styles.tab, on && styles.tabOn, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={c.label}
              >
                <Text style={[styles.tabText, on && styles.tabTextOn, { fontFamily: ff.semibold }]}>{c.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* The Lola carousel — one active pose. Swipe (or tap a tab) to change
            area; tap Lola to open her chips, like the Home Lola. A soft pulse
            behind her signals she's tappable while closed. */}
        <View style={[styles.carouselWrap, { width, marginLeft: -Spacing.lg }]}>
          {!open ? <PulseRing size={230} style={styles.pulse} /> : null}
          <FlatList
            ref={carousel}
            data={BODY_CATEGORIES}
            keyExtractor={c => c.id}
            horizontal
            pagingEnabled
            extraData={`${index}-${open}`}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onMomentumEnd}
            getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => setOpen(o => !o)}
                style={[styles.slide, { width }]}
                accessibilityRole="button"
                accessibilityState={{ expanded: open }}
                accessibilityLabel={`Lola — ${item.label}. Tap to ${open ? 'close' : 'open'} what you can log.`}
              >
                <Image source={item.companion} style={styles.lola} resizeMode="contain" />
              </Pressable>
            )}
          />
        </View>

        {open ? (
          <RevealView key={active.id}>
            <Text style={[styles.activeTitle, { fontFamily: ff.bold }]}>{active.title}</Text>
            <Text style={[styles.activeSubtitle, { fontFamily: ff.regular }]}>{active.subtitle}</Text>
            <BodyLogPanel
              key={`${active.id}-${draftsLoaded}`}
              category={active.id}
              primaryChips={active.primaryChips}
              secondaryTitle={active.secondaryTitle}
              secondaryChips={active.secondaryChips}
              textPlaceholder={active.textPlaceholder}
              initialDraft={drafts[active.id]}
              onChangeDraft={handleDraftChange}
            />
          </RevealView>
        ) : (
          <Text style={[styles.tapHint, { fontFamily: ff.regular }]}>Tap Lola to note your {active.label.toLowerCase()}.</Text>
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
  copy: { alignItems: 'center', gap: Spacing.xs, paddingTop: Spacing.sm, paddingBottom: Spacing.md },
  title: { color: Colors.text, fontSize: FontSizes.xxxl, lineHeight: 44, letterSpacing: -0.8 },
  subtitle: { color: Colors.textMuted, fontSize: FontSizes.base, lineHeight: 24, textAlign: 'center' },
  tabScroll: { flexGrow: 0 },
  tabRow: { gap: Spacing.sm, paddingVertical: Spacing.xs, paddingRight: Spacing.sm },
  tab: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.full, backgroundColor: Colors.surface, paddingHorizontal: Spacing.md, paddingVertical: 8 },
  tabOn: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  tabText: { color: Colors.textMuted, fontSize: FontSizes.sm },
  tabTextOn: { color: Colors.background },
  carouselWrap: { alignItems: 'center', justifyContent: 'center' },
  pulse: { position: 'absolute', top: 19, alignSelf: 'center' },
  slide: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.md },
  lola: { width: 200, height: 236 },
  activeTitle: { color: Colors.text, fontSize: FontSizes.xl, textAlign: 'center', marginTop: Spacing.sm },
  activeSubtitle: { color: Colors.textMuted, fontSize: FontSizes.sm, lineHeight: 20, textAlign: 'center', marginTop: 2, marginBottom: Spacing.xs },
  tapHint: { color: Colors.textSubtle, fontSize: FontSizes.sm, fontStyle: 'italic', textAlign: 'center', marginTop: Spacing.md },
  pressed: { opacity: 0.75 },
});
