import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { Text } from '@/components/ui/AppText';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, Radius } from '@/constants/theme';
import { useFontFamily } from '@/hooks/useFontFamily';
import { usePlus } from '@/contexts/PlusContext';
import { Companion } from '@/constants/companion';
import { PaywallModal } from '@/components/ui/PaywallModal';
import { PLUS_TRIAL_DAYS } from '@/constants/pricing';
import { AssistantHero } from '@/components/ui/AssistantHero';
import { HomeBackButton } from '@/components/ui/HomeBackButton';

export default function PlusScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const ff = useFontFamily();
  const { isPlus } = usePlus();
  const [showPaywall, setShowPaywall] = useState(false);

  function openFeature(path: string) {
    router.push(path as any);
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.headerBar}>
        <HomeBackButton />
      </View>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <AssistantHero
          kicker="Hassle Plus"
          title={isPlus ? 'Long-term insight is active.' : 'Deeper patterns, when you want them.'}
          subtitle={isPlus ? 'Thank you for supporting Hassle.' : 'Day-to-day coping stays free.'}
          lola={Companion.Settings}
          style={{ marginHorizontal: -Spacing.lg }}
        />

        {isPlus ? null : (
          <Pressable
            style={({ pressed }) => [styles.upsell, pressed && { opacity: 0.9 }]}
            onPress={() => setShowPaywall(true)}
          >
            <Text style={[styles.upsellTitle, { fontFamily: ff.semibold }]}>
              Long-term insight, and a way to support Hassle
            </Text>
            <Text style={[styles.upsellBody, { fontFamily: ff.regular }]}>
              Everyday support stays free. Plus focuses on summaries, trends, exports, and shared-care insight — try it free for{' '}
              {PLUS_TRIAL_DAYS} days.
            </Text>
            <View style={styles.upsellBtn}>
              <Text style={[styles.upsellBtnText, { fontFamily: ff.semibold }]}>
                Start {PLUS_TRIAL_DAYS}-day free trial
              </Text>
            </View>
          </Pressable>
        )}

        {/* Plus insight features */}
        {[
          ['Weekly AI summaries', 'A gentle weekly recap of energy, symptoms, tasks, and reflections.'],
          ['Monthly health summaries', 'Longer-range health context for planning and appointments.'],
          ['Trend + correlation analysis', 'Symptom trends, possible correlations, and long-term charts.'],
          ['Unlimited history + PDF exports', 'Keep more history and export polished summaries when needed.'],
          ['Family profiles + shared care', 'Support households, carers, widgets, and advanced analytics over time.'],
        ].map(([title, sub]) => (
          <View key={title} style={styles.card}>
            <Image source={Companion.Report} style={styles.thumb} resizeMode="contain" />
            <View style={styles.cardText}>
              <View style={styles.cardTitleRow}>
                <Text style={[styles.cardTitle, { fontFamily: ff.semibold }]}>{title}</Text>
                {!isPlus ? <LockTag ff={ff} /> : null}
              </View>
              <Text style={[styles.cardSub, { fontFamily: ff.regular }]}>{sub}</Text>
            </View>
            <MaterialIcons name={isPlus ? 'check-circle' : 'lock'} size={isPlus ? 22 : 16} color={Colors.textSubtle} />
          </View>
        ))}

        <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]} onPress={() => openFeature('/report')}>
          <Image source={Companion.Report} style={styles.thumb} resizeMode="contain" />
          <View style={styles.cardText}>
            <Text style={[styles.cardTitle, { fontFamily: ff.semibold }]}>Doctor Report</Text>
            <Text style={[styles.cardSub, { fontFamily: ff.regular }]}>Free day-to-day coping export for appointments.</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color={Colors.textSubtle} />
        </Pressable>

        <Text style={[styles.footnote, { fontFamily: ff.regular }]}>
          Body, Mind, Quiet Time, Life, Doctor Report, Directory, and Library stay free. Plus is for longer-term insight and helps fund development.
        </Text>
      </ScrollView>

      <PaywallModal visible={showPaywall} onClose={() => setShowPaywall(false)} />
    </View>
  );
}

function LockTag({ ff }: { ff: ReturnType<typeof useFontFamily> }) {
  return (
    <View style={styles.lockTag}>
      <Text style={[styles.lockTagText, { fontFamily: ff.semibold }]}>PLUS</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    minHeight: 44,
  },
  scroll: { paddingHorizontal: Spacing.lg, paddingTop: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.lg },
  title: { fontSize: FontSizes.xxl, color: Colors.text, letterSpacing: -0.5 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  badgeText: { fontSize: 10, color: Colors.background, letterSpacing: 1 },
  activeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  activeText: { flex: 1, fontSize: FontSizes.sm, color: Colors.text, lineHeight: 20 },
  upsell: {
    backgroundColor: Colors.accentFaint,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  upsellTitle: { fontSize: FontSizes.base, color: Colors.text, marginBottom: 4 },
  upsellBody: { fontSize: FontSizes.sm, color: Colors.textMuted, lineHeight: 20, marginBottom: Spacing.md },
  upsellBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
  },
  upsellBtnText: { fontSize: FontSizes.sm, color: Colors.background },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardPressed: { opacity: 0.7 },
  thumb: { width: 48, height: 48 },
  iconThumb: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.accentFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 2 },
  cardTitle: { fontSize: FontSizes.base, color: Colors.text },
  cardSub: { fontSize: FontSizes.sm, color: Colors.textMuted, lineHeight: 19 },
  lockTag: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  lockTagText: { fontSize: 8, color: Colors.background, letterSpacing: 0.8 },
  footnote: {
    fontSize: FontSizes.xs,
    color: Colors.textSubtle,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
});
