import React, { useCallback, useRef, useState } from 'react';
import {
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

// Body is a single screen: a horizontal carousel of Lola poses (one active at a
// time). Swiping or tapping a tab changes the active Lola, and that category's
// logging chips + "Tell Lola" appear directly underneath — no navigation, no
// modal. Everything is logged from here.
export default function BodyScreen() {
  const insets = useSafeAreaInsets();
  const ff = useFontFamily();
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const carousel = useRef<FlatList>(null);

  const active = BODY_CATEGORIES[index];

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

        {/* The Lola carousel — one active pose, swipe or tap to change. A soft
            pulse behind the active Lola signals she's interactive, like Home. */}
        <View style={[styles.carouselWrap, { width, marginLeft: -Spacing.lg }]}>
          <PulseRing size={230} style={styles.pulse} />
          <FlatList
            ref={carousel}
            data={BODY_CATEGORIES}
            keyExtractor={c => c.id}
            horizontal
            pagingEnabled
            extraData={index}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onMomentumEnd}
            getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => goTo((index + 1) % BODY_CATEGORIES.length)}
                style={[styles.slide, { width }]}
                accessibilityRole="button"
                accessibilityLabel={`Lola — ${item.label}. Tap for the next area.`}
              >
                <Image source={item.companion} style={styles.lola} resizeMode="contain" />
              </Pressable>
            )}
          />
        </View>

        {/* Active category copy + inline logging. Keyed so each category starts
            fresh (its own chips / note), reducing to: swipe → tap chips → done. */}
        <Text style={[styles.activeTitle, { fontFamily: ff.bold }]}>{active.title}</Text>
        <Text style={[styles.activeSubtitle, { fontFamily: ff.regular }]}>{active.subtitle}</Text>

        <BodyLogPanel
          key={active.id}
          category={active.id}
          primaryChips={active.primaryChips}
          secondaryTitle={active.secondaryTitle}
          secondaryChips={active.secondaryChips}
          textPlaceholder={active.textPlaceholder}
        />
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
  pressed: { opacity: 0.75 },
});
