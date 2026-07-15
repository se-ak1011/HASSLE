import React from 'react';
import { View, StyleSheet, ScrollView, Pressable, Image, ImageSourcePropType } from 'react-native';
import { Text } from '@/components/ui/AppText';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSizes, Radius } from '@/constants/theme';
import { useFontFamily } from '@/hooks/useFontFamily';
import { HomeBackButton } from '@/components/ui/HomeBackButton';
import { Companion } from '@/constants/companion';

// The five "aware" Lolas ARE the navigation — one tap straight to each category's
// tags, no fanning-out step. Each pose fits its category (blanket + mug = Fatigue,
// pill mug = Meds, etc.).
type Category = { key: string; label: string; hint: string; route: string; companion: ImageSourcePropType };

const CATEGORIES: Category[] = [
  { key: 'pain', label: 'Pain', hint: 'What hurts', route: '/body-pain', companion: Companion.BodyPain },
  { key: 'fatigue', label: 'Fatigue', hint: 'Your energy', route: '/body-fatigue', companion: Companion.BodyFatigue },
  { key: 'symptoms', label: 'Symptoms', hint: 'What you notice', route: '/body-symptoms', companion: Companion.BodySymptoms },
  { key: 'medication', label: 'Medication', hint: 'Meds & doses', route: '/body-medication', companion: Companion.BodyMedication },
];

const SELF_CARE: Category = {
  key: 'self-care',
  label: 'Self-care',
  hint: "One gentle step, if there's room for it.",
  route: '/body-self-care',
  companion: Companion.BodySelfCare,
};

export default function BodyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const ff = useFontFamily();

  const go = (route: string) => router.push(route as any);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <HomeBackButton />
        <Text style={[styles.headerTitle, { fontFamily: ff.semibold }]}>Body</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing.xl }]} showsVerticalScrollIndicator={false}>
        <View style={styles.copy}>
          <Text style={[styles.title, { fontFamily: ff.bold }]}>Body</Text>
          <Text style={[styles.subtitle, { fontFamily: ff.regular }]}>How&apos;s your body today? Tap wherever fits.</Text>
        </View>

        <View style={styles.contextCard}>
          <Text style={[styles.contextTitle, { fontFamily: ff.semibold }]}>Today&apos;s body summary</Text>
          <Text style={[styles.contextText, { fontFamily: ff.regular }]}>Notice pain, fatigue, symptoms, medication, or one gentle care step — without turning it into a big task.</Text>
        </View>

        <View style={styles.grid}>
          {CATEGORIES.map((c) => (
            <Pressable
              key={c.key}
              style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
              onPress={() => go(c.route)}
              accessibilityRole="button"
              accessibilityLabel={c.label}
            >
              <Image source={c.companion} style={styles.tileImg} resizeMode="contain" />
              <Text style={[styles.tileLabel, { fontFamily: ff.semibold }]}>{c.label}</Text>
              <Text style={[styles.tileHint, { fontFamily: ff.regular }]}>{c.hint}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [styles.hero, pressed && styles.pressed]}
          onPress={() => go(SELF_CARE.route)}
          accessibilityRole="button"
          accessibilityLabel="Self-care"
        >
          <Image source={SELF_CARE.companion} style={styles.heroImg} resizeMode="contain" />
          <View style={styles.heroText}>
            <Text style={[styles.heroLabel, { fontFamily: ff.semibold }]}>Self-care</Text>
            <Text style={[styles.heroHint, { fontFamily: ff.regular }]}>{SELF_CARE.hint}</Text>
          </View>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  headerTitle: { color: Colors.text, fontSize: FontSizes.lg },
  scroll: { paddingHorizontal: Spacing.lg },
  copy: { alignItems: 'center', gap: Spacing.xs, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  title: { color: Colors.text, fontSize: FontSizes.xxxl, lineHeight: 44, letterSpacing: -0.8 },
  subtitle: { color: Colors.textMuted, fontSize: FontSizes.base, lineHeight: 24, textAlign: 'center' },
  contextCard: { borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.lg, gap: Spacing.sm },
  contextTitle: { color: Colors.text, fontSize: FontSizes.base },
  contextText: { color: Colors.textMuted, fontSize: FontSizes.sm, lineHeight: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  tile: {
    width: '48%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  tileImg: { width: '78%', height: 118, marginBottom: Spacing.sm },
  tileLabel: { color: Colors.text, fontSize: FontSizes.base },
  tileHint: { color: Colors.textSubtle, fontSize: FontSizes.xs, textAlign: 'center', marginTop: 2 },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.accentFaint,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.accent + '30',
    padding: Spacing.md,
    marginTop: Spacing.xs,
  },
  heroImg: { width: 84, height: 94 },
  heroText: { flex: 1 },
  heroLabel: { color: Colors.text, fontSize: FontSizes.lg, marginBottom: 2 },
  heroHint: { color: Colors.textSecondary, fontSize: FontSizes.sm, lineHeight: 20 },
  pressed: { opacity: 0.8 },
});
