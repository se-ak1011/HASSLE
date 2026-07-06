import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { Text } from './AppText';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, Fonts, Radius, Shadow } from '@/constants/theme';
import { useFontFamily } from '@/hooks/useFontFamily';
import { usePlus } from '@/contexts/PlusContext';
import { billing } from '@/services/billing';
import { PLUS_TRIAL_DAYS } from '@/constants/pricing';
import { useRegion } from '@/localization/RegionContext';

interface Props {
  visible: boolean;
  onClose: () => void;
}

interface Benefit {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  desc: string;
  soon?: boolean;
}

const BENEFITS: Benefit[] = [
  {
    icon: 'description',
    title: 'Doctor-visit reports',
    desc: 'A clean, longer-range PDF of your energy, flares, symptoms and patterns to bring to appointments.',
  },
  {
    icon: 'menu-book',
    title: 'Invisible-illness library',
    desc: 'Plain-language reading on chronic and neurodivergent conditions, each linked to the real study behind it.',
  },
  {
    icon: 'place',
    title: 'Specialist directory',
    desc: 'Find clinicians who actually understand invisible illness.',
    soon: true,
  },
];

export function PaywallModal({ visible, onClose }: Props) {
  const ff = useFontFamily();
  const { isPlus, unlock, restore } = usePlus();
  const { config } = useRegion();
  const [busy, setBusy] = useState(false);

  async function handleUnlock() {
    setBusy(true);
    try {
      const res = await billing.purchasePlus();
      if (res.ok) {
        await restore();
        return;
      }
      if (res.error === 'cancelled') return;
      // No products yet / not configured (web + beta): keep the free unlock so
      // testers aren't blocked while billing is being set up.
      await unlock();
    } finally {
      setBusy(false);
    }
  }

  async function handleRestore() {
    setBusy(true);
    try {
      await restore();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <View style={styles.badge}>
                <MaterialIcons name="auto-awesome" size={14} color={Colors.background} />
                <Text style={[styles.badgeText, { fontFamily: ff.semibold }]}>PLUS</Text>
              </View>
              <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
                <MaterialIcons name="close" size={22} color={Colors.textMuted} />
              </Pressable>
            </View>

            <Text style={[styles.title, { fontFamily: ff.bold }]}>Hassle Plus</Text>
            <Text style={[styles.subtitle, { fontFamily: ff.regular }]}>
              The whole app stays free — every tab, every feature you already use. Plus only adds
              extra tools on top, and helps keep Hassle going.
            </Text>

            <View style={styles.benefits}>
              {BENEFITS.map((b) => (
                <View key={b.title} style={styles.benefit}>
                  <View style={styles.benefitIcon}>
                    <MaterialIcons name={b.icon} size={20} color={Colors.primary} />
                  </View>
                  <View style={styles.benefitText}>
                    <View style={styles.benefitTitleRow}>
                      <Text style={[styles.benefitTitle, { fontFamily: ff.semibold }]}>{b.title}</Text>
                      {b.soon ? (
                        <View style={styles.soonBadge}>
                          <Text style={[styles.soonText, { fontFamily: ff.medium }]}>soon</Text>
                        </View>
                      ) : (
                        <View style={styles.nowBadge}>
                          <Text style={[styles.nowText, { fontFamily: ff.medium }]}>available</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.benefitDesc, { fontFamily: ff.regular }]}>{b.desc}</Text>
                  </View>
                </View>
              ))}
            </View>

            {isPlus ? (
              <View style={styles.activeRow}>
                <MaterialIcons name="check-circle" size={20} color={Colors.success} />
                <Text style={[styles.activeText, { fontFamily: ff.semibold }]}>Plus is active — thank you 💜</Text>
              </View>
            ) : (
              <>
                <Pressable
                  style={({ pressed }) => [styles.unlockBtn, pressed && { opacity: 0.85 }]}
                  onPress={handleUnlock}
                  disabled={busy}
                  accessibilityRole="button"
                  accessibilityLabel={`Start ${PLUS_TRIAL_DAYS}-day free trial`}
                >
                  {busy ? (
                    <ActivityIndicator size="small" color={Colors.background} />
                  ) : (
                    <Text style={[styles.unlockText, { fontFamily: ff.semibold }]}>
                      Start {PLUS_TRIAL_DAYS}-day free trial
                    </Text>
                  )}
                </Pressable>
                <Text style={[styles.priceNote, { fontFamily: ff.regular }]}>
                  {PLUS_TRIAL_DAYS} days free, then {config.currency.plusPriceLabel}. Cancel
                  anytime. A hardship option will always exist.
                </Text>
                <Pressable onPress={handleRestore} disabled={busy} hitSlop={8}>
                  <Text style={[styles.restoreLink, { fontFamily: ff.medium }]}>
                    Restore purchases
                  </Text>
                </Pressable>
              </>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.xl,
    maxHeight: '88%',
    ...Shadow.medium,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 11,
    color: Colors.background,
    letterSpacing: 1,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: Fonts.bold,
    color: Colors.text,
    letterSpacing: -0.4,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  benefits: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  benefit: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-start',
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.accentFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: {
    flex: 1,
  },
  benefitTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 2,
  },
  benefitTitle: {
    fontSize: FontSizes.base,
    color: Colors.text,
    fontWeight: Fonts.semibold,
  },
  benefitDesc: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    lineHeight: 19,
  },
  soonBadge: {
    backgroundColor: Colors.surfaceDark,
    borderRadius: Radius.full,
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  soonText: {
    fontSize: 9,
    color: Colors.textSubtle,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nowBadge: {
    backgroundColor: Colors.accentFaint,
    borderRadius: Radius.full,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  nowText: {
    fontSize: 9,
    color: Colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  unlockBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  unlockText: {
    fontSize: FontSizes.base,
    color: Colors.background,
    fontWeight: Fonts.semibold,
  },
  priceNote: {
    fontSize: FontSizes.xs,
    color: Colors.textSubtle,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 16,
  },
  restoreLink: {
    fontSize: FontSizes.sm,
    color: Colors.accent,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  activeText: {
    fontSize: FontSizes.base,
    color: Colors.text,
    fontWeight: Fonts.semibold,
  },
});
