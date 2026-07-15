import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from '@/components/ui/AppText';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSizes, Radius } from '@/constants/theme';
import { useFontFamily } from '@/hooks/useFontFamily';
import { HomeBackButton } from '@/components/ui/HomeBackButton';
import { CompanionOrbit } from '@/components/ui/CompanionOrbit';
import { Companion } from '@/constants/companion';

export default function MindScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const ff = useFontFamily();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <HomeBackButton />
        <Text style={[styles.headerTitle, { fontFamily: ff.semibold }]}>Mind</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing.xl }]} showsVerticalScrollIndicator={false}>
        <View style={styles.copy}>
          <Text style={[styles.title, { fontFamily: ff.bold }]}>Mind</Text>
          <Text style={[styles.subtitle, { fontFamily: ff.regular }]}>How&apos;s your head today?</Text>
        </View>
        <View style={styles.contextCard}>
          <Text style={[styles.contextTitle, { fontFamily: ff.semibold }]}>A gentle place to think</Text>
          <Text style={[styles.contextText, { fontFamily: ff.regular }]}>Look back at your patterns, jot down whatever&apos;s on your mind, or just talk it through with Lola — no pressure to do any of it.</Text>
        </View>
        <CompanionOrbit
          companion={Companion.Reflect}
          size="page"
          chips={[
            { key: 'insights', label: 'Insights', onPress: () => router.push('/patterns' as any) },
            { key: 'journal', label: 'Journal', onPress: () => router.push('/journal' as any), highlighted: true },
            { key: 'lola', label: 'Talk to Lola', onPress: () => router.push('/ai-coach' as any) },
          ]}
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
  copy: { alignItems: 'center', gap: Spacing.xs, paddingTop: Spacing.xl, paddingBottom: Spacing.md },
  contextCard: { borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.md, gap: Spacing.sm },
  contextTitle: { color: Colors.text, fontSize: FontSizes.base },
  contextText: { color: Colors.textMuted, fontSize: FontSizes.sm, lineHeight: 20 },
  title: { color: Colors.text, fontSize: FontSizes.xxxl, lineHeight: 44, letterSpacing: -0.8 },
  subtitle: { color: Colors.textMuted, fontSize: FontSizes.base, lineHeight: 24 },
});
