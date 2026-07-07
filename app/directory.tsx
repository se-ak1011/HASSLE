import React from 'react';
import { View, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { Text } from '@/components/ui/AppText';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, Radius } from '@/constants/theme';
import { useFontFamily } from '@/hooks/useFontFamily';
import { Companion } from '@/constants/companion';

interface Plan {
  icon: keyof typeof MaterialIcons.glyphMap;
  text: string;
}

const PLANNED: Plan[] = [
  { icon: 'verified', text: 'Clinicians who genuinely understand invisible and energy-limiting illness.' },
  { icon: 'place', text: 'Searchable by location and specialty.' },
  { icon: 'rate-review', text: 'Honest notes from the community on what an appointment was actually like.' },
];

export default function DirectoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const ff = useFontFamily();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back">
          <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { fontFamily: ff.semibold }]}>Specialist directory</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Image source={Companion.Directory} style={styles.heroImg} resizeMode="contain" />
        </View>

        <View style={styles.badge}>
          <MaterialIcons name="schedule" size={13} color={Colors.accent} />
          <Text style={[styles.badgeText, { fontFamily: ff.medium }]}>In the works</Text>
        </View>

        <Text style={[styles.title, { fontFamily: ff.bold }]}>Finding the right people</Text>
        <Text style={[styles.body, { fontFamily: ff.regular }]}>
          Lola’s still mapping this one out. The plan is a directory of specialists who actually get
          invisible illness — so you spend less energy explaining yourself and more being believed.
        </Text>

        <View style={styles.planList}>
          {PLANNED.map((p) => (
            <View key={p.text} style={styles.planRow}>
              <View style={styles.planIcon}>
                <MaterialIcons name={p.icon} size={18} color={Colors.primary} />
              </View>
              <Text style={[styles.planText, { fontFamily: ff.regular }]}>{p.text}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.footnote, { fontFamily: ff.regular }]}>
          We’d rather ship this with real, trustworthy data than rush it. It’s included in Hassle Plus
          and will switch on in a future update — no extra charge.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerTitle: { fontSize: FontSizes.lg, color: Colors.text },
  scroll: { paddingHorizontal: Spacing.lg, alignItems: 'center' },
  hero: { alignItems: 'center', marginTop: Spacing.md },
  heroImg: { width: 170, height: 180 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.accentFaint,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: Spacing.sm,
  },
  badgeText: { fontSize: FontSizes.xs, color: Colors.accent },
  title: {
    fontSize: FontSizes.xl,
    color: Colors.text,
    letterSpacing: -0.4,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  body: {
    fontSize: FontSizes.base,
    color: Colors.textMuted,
    lineHeight: 24,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  planList: { alignSelf: 'stretch', marginTop: Spacing.xl, gap: Spacing.md },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  planIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: Colors.accentFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planText: { flex: 1, fontSize: FontSizes.sm, color: Colors.text, lineHeight: 20 },
  footnote: {
    fontSize: FontSizes.xs,
    color: Colors.textSubtle,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
});
