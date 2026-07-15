import React, { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Text } from '@/components/ui/AppText';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSizes, Radius } from '@/constants/theme';
import { useFontFamily } from '@/hooks/useFontFamily';
import { HomeBackButton } from '@/components/ui/HomeBackButton';
import { CompanionOrbit } from '@/components/ui/CompanionOrbit';
import { Companion } from '@/constants/companion';
import { loadLookingForward } from '@/services/lookingForward';
import { loadLetters, openCount, sealedCount } from '@/services/futureLetters';

export default function MindScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const ff = useFontFamily();
  const [lookingCount, setLookingCount] = useState(0);
  const [sealed, setSealed] = useState(0);
  const [ready, setReady] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadLookingForward().then(list => setLookingCount(list.length));
      loadLetters().then(list => {
        const now = Date.now();
        setSealed(sealedCount(list, now));
        setReady(openCount(list, now));
      });
    }, [])
  );

  const lookingSub =
    lookingCount > 0 ? `${lookingCount} nice thing${lookingCount === 1 ? '' : 's'} ahead` : 'A wedding, a project, a plan — hold onto it';

  const lettersSub =
    ready > 0
      ? `${ready} ready to open 💜`
      : sealed > 0
      ? `${sealed} sealed, waiting for you`
      : 'Write to future-you and seal it for later';

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

        {/* Top card — nice things ahead, above Lola. */}
        <FeatureCard
          ff={ff}
          icon="favorite"
          title="Looking forward to"
          subtitle={lookingSub}
          onPress={() => router.push('/looking-forward' as any)}
        />

        {/* Lola's reflection orbit — untouched. */}
        <CompanionOrbit
          companion={Companion.Reflect}
          size="page"
          chips={[
            { key: 'insights', label: 'Insights', onPress: () => router.push('/patterns' as any) },
            { key: 'journal', label: 'Journal', onPress: () => router.push('/journal' as any), highlighted: true },
            { key: 'lola', label: 'Talk to Lola', onPress: () => router.push('/ai-coach' as any) },
          ]}
        />

        {/* Bottom card — letters to yourself, under Lola. */}
        <FeatureCard
          ff={ff}
          icon="mail-outline"
          title="Letters to yourself"
          subtitle={lettersSub}
          badge={ready > 0 ? ready : undefined}
          onPress={() => router.push('/letters' as any)}
        />
      </ScrollView>
    </View>
  );
}

function FeatureCard({
  ff,
  icon,
  title,
  subtitle,
  badge,
  onPress,
}: {
  ff: ReturnType<typeof useFontFamily>;
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle: string;
  badge?: number;
  onPress: () => void;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]} onPress={onPress} accessibilityRole="button" accessibilityLabel={title}>
      <View style={styles.cardIcon}>
        <MaterialIcons name={icon} size={22} color={Colors.primaryLight} />
      </View>
      <View style={styles.cardText}>
        <View style={styles.cardTitleRow}>
          <Text style={[styles.cardTitle, { fontFamily: ff.semibold }]}>{title}</Text>
          {badge ? (
            <View style={styles.badge}>
              <Text style={[styles.badgeText, { fontFamily: ff.semibold }]}>{badge}</Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.cardSub, { fontFamily: ff.regular }]}>{subtitle}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={22} color={Colors.textSubtle} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  headerTitle: { color: Colors.text, fontSize: FontSizes.lg },
  scroll: { paddingHorizontal: Spacing.lg },
  copy: { alignItems: 'center', gap: Spacing.xs, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  title: { color: Colors.text, fontSize: FontSizes.xxxl, lineHeight: 44, letterSpacing: -0.8 },
  subtitle: { color: Colors.textMuted, fontSize: FontSizes.base, lineHeight: 24 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginVertical: Spacing.sm,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.accentFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  cardTitle: { color: Colors.text, fontSize: FontSizes.base },
  cardSub: { color: Colors.textMuted, fontSize: FontSizes.sm, lineHeight: 19, marginTop: 2 },
  badge: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 6, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: Colors.background, fontSize: 11 },
  pressed: { opacity: 0.8 },
});
