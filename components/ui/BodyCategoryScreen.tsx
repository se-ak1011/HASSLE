import React from 'react';
import { Image, ImageSourcePropType, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontSizes, Spacing } from '@/constants/theme';
import { useFontFamily } from '@/hooks/useFontFamily';
import { Companion } from '@/constants/companion';
import { BackButton } from '@/components/ui/BackButton';
import { BodyLogPanel } from '@/components/ui/BodyLogPanel';
import type { BodyLolaCategory } from '@/services/aiLola';

// Standalone /body-* route: header + Lola + the shared logging panel. The Body
// hub now logs everything inline via the same BodyLogPanel, so these routes and
// the carousel always behave identically.
type BodyCategoryScreenProps = {
  category: BodyLolaCategory;
  title: string;
  subtitle: string;
  primaryChips: string[];
  secondaryTitle?: string;
  secondaryChips?: string[];
  textPlaceholder?: string;
  companion?: ImageSourcePropType;
};

export function BodyCategoryScreen({
  category,
  title,
  subtitle,
  primaryChips,
  secondaryTitle,
  secondaryChips = [],
  textPlaceholder = 'Tell Lola in your own words...',
  companion = Companion.Body,
}: BodyCategoryScreenProps) {
  const insets = useSafeAreaInsets();
  const ff = useFontFamily();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <BackButton />
        <Text style={[styles.headerTitle, { fontFamily: ff.semibold }]}>{title}</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing.xl }]} showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <Text style={[styles.title, { fontFamily: ff.bold }]}>{title}</Text>
          <Text style={[styles.subtitle, { fontFamily: ff.regular }]}>{subtitle}</Text>
        </View>

        <View style={styles.lolaWrap}>
          <Image source={companion} style={styles.lola} resizeMode="contain" accessibilityLabel="Lola" />
        </View>

        <BodyLogPanel
          category={category}
          primaryChips={primaryChips}
          secondaryTitle={secondaryTitle}
          secondaryChips={secondaryChips}
          textPlaceholder={textPlaceholder}
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
  intro: { gap: Spacing.xs, paddingTop: Spacing.md, paddingBottom: Spacing.lg },
  title: { color: Colors.text, fontSize: FontSizes.xxxl, lineHeight: 44, letterSpacing: -0.8 },
  subtitle: { color: Colors.textMuted, fontSize: FontSizes.base, lineHeight: 24 },
  lolaWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.lg },
  lola: { width: 176, height: 220 },
});
