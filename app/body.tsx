import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from '@/components/ui/AppText';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSizes } from '@/constants/theme';
import { useFontFamily } from '@/hooks/useFontFamily';
import { HomeBackButton } from '@/components/ui/HomeBackButton';
import { CompanionOrbit } from '@/components/ui/CompanionOrbit';
import { Companion } from '@/constants/companion';

export default function BodyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const ff = useFontFamily();

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
          <Text style={[styles.subtitle, { fontFamily: ff.regular }]}>How&apos;s your body today?</Text>
        </View>
        <CompanionOrbit
          companion={Companion.Body}
          size="page"
          chips={[
            { key: 'pain', label: 'Pain', onPress: () => router.push('/body-pain' as any) },
            { key: 'fatigue', label: 'Fatigue', onPress: () => router.push('/body-fatigue' as any) },
            { key: 'symptoms', label: 'Symptoms', onPress: () => router.push('/body-symptoms' as any) },
            { key: 'medication', label: 'Medication', onPress: () => router.push('/body-medication' as any) },
            { key: 'self-care', label: 'Self-care', onPress: () => router.push('/body-self-care' as any), highlighted: true },
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
  title: { color: Colors.text, fontSize: FontSizes.xxxl, lineHeight: 44, letterSpacing: -0.8 },
  subtitle: { color: Colors.textMuted, fontSize: FontSizes.base, lineHeight: 24 },
});
