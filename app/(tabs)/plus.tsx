import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { Text } from '@/components/ui/AppText';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, Radius } from '@/constants/theme';
import { useFontFamily } from '@/hooks/useFontFamily';
import { usePlus } from '@/contexts/PlusContext';
import { Lola } from '@/constants/lola';
import { PaywallModal } from '@/components/ui/PaywallModal';
import { PLUS_TRIAL_DAYS } from '@/constants/pricing';

export default function PlusScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const ff = useFontFamily();
  const { isPlus } = usePlus();
  const [showPaywall, setShowPaywall] = useState(false);

  function openFeature(path: string) {
    if (!isPlus) {
      setShowPaywall(true);
      return;
    }
    router.push(path as any);
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleRow}>
          <Text style={[styles.title, { fontFamily: ff.bold }]}>Hassle Plus</Text>
          <View style={styles.badge}>
            <MaterialIcons name="auto-awesome" size={13} color={Colors.background} />
            <Text style={[styles.badgeText, { fontFamily: ff.semibold }]}>PLUS</Text>
          </View>
        </View>

        {isPlus ? (
          <View style={styles.activeBanner}>
            <MaterialIcons name="check-circle" size={18} color={Colors.success} />
            <Text style={[styles.activeText, { fontFamily: ff.medium }]}>
              Plus is active — thank you for supporting Hassle 💜
            </Text>
          </View>
        ) : (
          <Pressable
            style={({ pressed }) => [styles.upsell, pressed && { opacity: 0.9 }]}
            onPress={() => setShowPaywall(true)}
          >
            <Text style={[styles.upsellTitle, { fontFamily: ff.semibold }]}>
              Extra tools, and a way to support Hassle
            </Text>
            <Text style={[styles.upsellBody, { fontFamily: ff.regular }]}>
              The whole core app stays free. Plus adds the features below — try it free for{' '}
              {PLUS_TRIAL_DAYS} days.
            </Text>
            <View style={styles.upsellBtn}>
              <Text style={[styles.upsellBtnText, { fontFamily: ff.semibold }]}>
                Start {PLUS_TRIAL_DAYS}-day free trial
              </Text>
            </View>
          </Pressable>
        )}

        {/* Reading library */}
        <Pressable
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          onPress={() => openFeature('/library')}
        >
          <Image source={Lola.books} style={styles.thumb} resizeMode="contain" />
          <View style={styles.cardText}>
            <View style={styles.cardTitleRow}>
              <Text style={[styles.cardTitle, { fontFamily: ff.semibold }]}>Reading library</Text>
              {!isPlus ? <LockTag ff={ff} /> : null}
            </View>
            <Text style={[styles.cardSub, { fontFamily: ff.regular }]}>
              Plain-language reads, each linked to a real study.
            </Text>
          </View>
          <MaterialIcons name={isPlus ? 'chevron-right' : 'lock'} size={isPlus ? 22 : 16} color={Colors.textSubtle} />
        </Pressable>

        {/* Specialist directory */}
        <Pressable
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          onPress={() => openFeature('/directory')}
        >
          <Image source={Lola.explorer} style={styles.thumb} resizeMode="contain" />
          <View style={styles.cardText}>
            <View style={styles.cardTitleRow}>
              <Text style={[styles.cardTitle, { fontFamily: ff.semibold }]}>Specialist directory</Text>
              {!isPlus ? <LockTag ff={ff} /> : null}
            </View>
            <Text style={[styles.cardSub, { fontFamily: ff.regular }]}>
              Clinicians who understand invisible illness. Coming soon.
            </Text>
          </View>
          <MaterialIcons name={isPlus ? 'chevron-right' : 'lock'} size={isPlus ? 22 : 16} color={Colors.textSubtle} />
        </Pressable>

        {/* Doctor-visit report */}
        <Pressable
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          onPress={() => openFeature('/report')}
        >
          <Image source={Lola.report} style={styles.thumb} resizeMode="contain" />
          <View style={styles.cardText}>
            <View style={styles.cardTitleRow}>
              <Text style={[styles.cardTitle, { fontFamily: ff.semibold }]}>Doctor-visit report</Text>
              {!isPlus ? <LockTag ff={ff} /> : null}
            </View>
            <Text style={[styles.cardSub, { fontFamily: ff.regular }]}>
              A 30-day clinical PDF — trends plus a symptom log for appointments.
            </Text>
          </View>
          <MaterialIcons name={isPlus ? 'chevron-right' : 'lock'} size={isPlus ? 22 : 16} color={Colors.textSubtle} />
        </Pressable>

        <Text style={[styles.footnote, { fontFamily: ff.regular }]}>
          Everything you already use stays free. Plus only adds the above and helps fund development.
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
  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
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
