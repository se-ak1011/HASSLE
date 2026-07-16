import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Text } from '@/components/ui/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontSizes, Radius, Spacing } from '@/constants/theme';
import { useFontFamily } from '@/hooks/useFontFamily';
import { BackButton } from '@/components/ui/BackButton';
import { LegalSection, MEDICAL_DISCLAIMER, PRIVACY_POLICY, TERMS } from '@/constants/legal';

function Section({ section }: { section: LegalSection }) {
  const ff = useFontFamily();
  return (
    <View style={styles.section}>
      <Text style={[styles.heading, { fontFamily: ff.semibold }]}>{section.heading}</Text>
      {section.body.map((p, i) => (
        <Text key={i} style={[styles.body, { fontFamily: ff.regular }]}>{p}</Text>
      ))}
    </View>
  );
}

export default function LegalScreen() {
  const insets = useSafeAreaInsets();
  const ff = useFontFamily();
  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <BackButton />
        <Text style={[styles.headerTitle, { fontFamily: ff.semibold }]}>Privacy & terms</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing.xl }]} showsVerticalScrollIndicator={false}>
        {/* Health & safety, up top. */}
        <View style={styles.safety}>
          <MaterialIcons name="favorite" size={18} color={Colors.primaryLight} />
          <Text style={[styles.safetyText, { fontFamily: ff.regular }]}>{MEDICAL_DISCLAIMER}</Text>
        </View>

        <Text style={[styles.title, { fontFamily: ff.bold }]}>Privacy policy</Text>
        {PRIVACY_POLICY.map(s => <Section key={s.heading} section={s} />)}

        <Text style={[styles.title, { fontFamily: ff.bold }]}>Terms of use</Text>
        {TERMS.map(s => <Section key={s.heading} section={s} />)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  headerTitle: { color: Colors.text, fontSize: FontSizes.lg },
  scroll: { paddingHorizontal: Spacing.lg, gap: Spacing.md },
  safety: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: Colors.accentFaint,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.accent + '30',
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  safetyText: { flex: 1, color: Colors.textSecondary, fontSize: FontSizes.sm, lineHeight: 21 },
  title: { color: Colors.text, fontSize: FontSizes.xl, marginTop: Spacing.lg },
  section: { gap: Spacing.xs },
  heading: { color: Colors.text, fontSize: FontSizes.base, marginTop: Spacing.sm },
  body: { color: Colors.textMuted, fontSize: FontSizes.sm, lineHeight: 21 },
});
