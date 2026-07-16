import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Text } from '@/components/ui/AppText';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, Radius } from '@/constants/theme';
import { useFontFamily } from '@/hooks/useFontFamily';
import { useAccount, AccountMode, AuthProvider } from '@/contexts/AccountContext';
import { useDay } from '@/contexts/DayContext';
import { useAlert } from '@/template';
import { formatDateTimeForRegion } from '@/services/regionFormat';

interface OptionMeta {
  key: AccountMode;
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  body: string;
  tag: string;
}

// Flip to true once Sign in with Apple is configured in the Supabase + Apple
// dashboards. Apple requires this before App Store submission if Google is
// offered (guideline 4.8) — so re-enable it before you ship to the store.
const APPLE_SIGNIN_ENABLED = false;

// Deliberately parallel: same length, same structure, same visual weight.
// Neither is framed as the "real" or "better" option.
const OPTIONS: OptionMeta[] = [
  {
    key: 'local',
    icon: 'phone-iphone',
    title: 'Keep it on this device',
    body: 'Everything works, fully and offline. Your data stays on your phone — no account, no email, nothing to remember.',
    tag: 'Private by default',
  },
  {
    key: 'cloud',
    icon: 'sync',
    title: 'Sync across your devices',
    body: 'Sign in to mirror your data to your other phone or tablet, and keep a backup. Same app, same features — just in more places.',
    tag: 'Optional & free',
  },
];

export default function AccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const ff = useFontFamily();
  const { mode, account, syncStatus, lastSyncedAt, signIn, signOut, syncNow, deleteAccount } = useAccount();
  const { resetAllData } = useDay();
  const { showAlert } = useAlert();

  const [intent, setIntent] = useState<AccountMode>(mode);
  const [busy, setBusy] = useState<AuthProvider | 'out' | 'sync' | 'delete' | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleDeleteAccount() {
    showAlert(
      'Delete your account?',
      'This permanently deletes your account and all synced data. Data on this device will also be cleared. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: async () => {
            setBusy('delete');
            setError(null);
            const res = await deleteAccount();
            if (!res.ok) {
              setBusy(null);
              setError(res.error ?? 'Could not delete your account. Please try again.');
              return;
            }
            // Wipe everything local, then restart at onboarding.
            await resetAllData();
            setBusy(null);
            router.replace('/onboarding' as any);
          },
        },
      ]
    );
  }

  async function handleSignIn(provider: AuthProvider) {
    setBusy(provider);
    setError(null);
    try {
      const result = await signIn(provider);
      if (!result.ok && result.error) setError(result.error);
    } finally {
      setBusy(null);
    }
  }

  async function handleSignOut() {
    setBusy('out');
    try {
      await signOut();
      setIntent('local');
    } finally {
      setBusy(null);
    }
  }

  async function handleSync() {
    setBusy('sync');
    try {
      await syncNow();
    } finally {
      setBusy(null);
    }
  }

  const lastSyncedLabel =
    lastSyncedAt != null
      ? formatDateTimeForRegion(new Date(lastSyncedAt))
      : 'Not synced yet — tap Sync now';

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Back" accessibilityRole="button">
          <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { fontFamily: ff.semibold }]}>Account &amp; sync</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.intro, { fontFamily: ff.regular }]}>
          Hassle works fully without an account — that&apos;s the default, and it&apos;s complete. Syncing is
          optional and free; it simply mirrors the same data to your other devices. Either way, you
          get the whole app.
        </Text>

        {OPTIONS.map((opt) => {
          const selected = intent === opt.key;
          const isCurrent = mode === opt.key;
          return (
            <Pressable
              key={opt.key}
              onPress={() => setIntent(opt.key)}
              style={[styles.card, selected && styles.cardSelected]}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
            >
              <View style={styles.cardTop}>
                <View style={styles.cardIcon}>
                  <MaterialIcons name={opt.icon} size={22} color={Colors.primary} />
                </View>
                <View style={styles.cardTitleWrap}>
                  <Text style={[styles.cardTitle, { fontFamily: ff.semibold }]}>{opt.title}</Text>
                  <View style={styles.tagRow}>
                    <Text style={[styles.tag, { fontFamily: ff.medium }]}>{opt.tag}</Text>
                    {isCurrent ? (
                      <View style={styles.currentPill}>
                        <Text style={[styles.currentText, { fontFamily: ff.medium }]}>Current</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
                <MaterialIcons
                  name={selected ? 'radio-button-checked' : 'radio-button-unchecked'}
                  size={20}
                  color={selected ? Colors.primary : Colors.textSubtle}
                />
              </View>
              <Text style={[styles.cardBody, { fontFamily: ff.regular }]}>{opt.body}</Text>
            </Pressable>
          );
        })}

        {/* Action area reflects the chosen intent */}
        <View style={styles.actions}>
          {intent === 'local' && mode === 'local' ? (
            <View style={styles.infoLine}>
              <MaterialIcons name="check-circle" size={18} color={Colors.success} />
              <Text style={[styles.infoLineText, { fontFamily: ff.regular }]}>
                You&apos;re all set — nothing to do. Everything&apos;s saved on this device.
              </Text>
            </View>
          ) : null}

          {intent === 'local' && mode === 'cloud' ? (
            <>
              <Pressable
                style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.85 }]}
                onPress={handleSignOut}
                disabled={busy === 'out'}
              >
                {busy === 'out' ? (
                  <ActivityIndicator size="small" color={Colors.text} />
                ) : (
                  <Text style={[styles.secondaryBtnText, { fontFamily: ff.semibold }]}>
                    Switch to device-only
                  </Text>
                )}
              </Pressable>
              <Text style={[styles.note, { fontFamily: ff.regular }]}>
                Your data stays exactly as it is on this device — signing out never deletes anything.
              </Text>
            </>
          ) : null}

          {intent === 'cloud' && mode === 'local' ? (
            <>
              {APPLE_SIGNIN_ENABLED ? (
                <Pressable
                  style={({ pressed }) => [styles.appleBtn, pressed && { opacity: 0.85 }]}
                  onPress={() => handleSignIn('apple')}
                  disabled={busy === 'apple'}
                >
                  {busy === 'apple' ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="apple" size={20} color={Colors.white} />
                      <Text style={[styles.appleBtnText, { fontFamily: ff.semibold }]}>
                        Continue with Apple
                      </Text>
                    </>
                  )}
                </Pressable>
              ) : null}
              <Pressable
                style={({ pressed }) => [styles.googleBtn, pressed && { opacity: 0.85 }]}
                onPress={() => handleSignIn('google')}
                disabled={busy === 'google'}
              >
                {busy === 'google' ? (
                  <ActivityIndicator size="small" color={Colors.text} />
                ) : (
                  <>
                    <MaterialCommunityIcons name="google" size={18} color={Colors.text} />
                    <Text style={[styles.googleBtnText, { fontFamily: ff.semibold }]}>
                      Continue with Google
                    </Text>
                  </>
                )}
              </Pressable>
              <Text style={[styles.note, { fontFamily: ff.regular }]}>
                Free, and separate from Hassle Plus. Your data syncs privately to your account —
                only you can see it.
              </Text>
              {error ? (
                <View style={styles.errorRow}>
                  <MaterialIcons name="error-outline" size={15} color={Colors.flare} />
                  <Text style={[styles.errorText, { fontFamily: ff.regular }]}>{error}</Text>
                </View>
              ) : null}
            </>
          ) : null}

          {intent === 'cloud' && mode === 'cloud' && account ? (
            <View style={styles.signedInCard}>
              <View style={styles.signedInRow}>
                <View style={styles.providerIcon}>
                  <MaterialCommunityIcons
                    name={account.provider === 'apple' ? 'apple' : 'google'}
                    size={18}
                    color={Colors.text}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.signedInName, { fontFamily: ff.semibold }]}>
                    {account.displayName}
                  </Text>
                  {account.email ? (
                    <Text style={[styles.signedInSub, { fontFamily: ff.regular }]}>{account.email}</Text>
                  ) : null}
                </View>
              </View>

              <View style={styles.syncRow}>
                <MaterialIcons name="cloud-queue" size={16} color={Colors.textMuted} />
                <Text style={[styles.syncText, { fontFamily: ff.regular }]}>
                  {syncStatus === 'syncing' ? 'Syncing…' : lastSyncedLabel}
                </Text>
              </View>

              <View style={styles.signedInActions}>
                <Pressable
                  style={({ pressed }) => [styles.smallBtn, pressed && { opacity: 0.85 }]}
                  onPress={handleSync}
                  disabled={busy === 'sync'}
                >
                  {busy === 'sync' ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  ) : (
                    <Text style={[styles.smallBtnText, { fontFamily: ff.semibold }]}>Sync now</Text>
                  )}
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.smallBtn, pressed && { opacity: 0.85 }]}
                  onPress={handleSignOut}
                  disabled={busy === 'out'}
                >
                  {busy === 'out' ? (
                    <ActivityIndicator size="small" color={Colors.text} />
                  ) : (
                    <Text style={[styles.smallBtnText, { fontFamily: ff.semibold }]}>Sign out</Text>
                  )}
                </Pressable>
              </View>

              <Pressable
                style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.85 }]}
                onPress={handleDeleteAccount}
                disabled={busy === 'delete'}
                accessibilityRole="button"
                accessibilityLabel="Delete account"
              >
                {busy === 'delete' ? (
                  <ActivityIndicator size="small" color={Colors.danger} />
                ) : (
                  <>
                    <MaterialIcons name="delete-outline" size={16} color={Colors.danger} />
                    <Text style={[styles.deleteBtnText, { fontFamily: ff.semibold }]}>Delete account</Text>
                  </>
                )}
              </Pressable>
              {error ? (
                <View style={styles.errorRow}>
                  <MaterialIcons name="error-outline" size={15} color={Colors.flare} />
                  <Text style={[styles.errorText, { fontFamily: ff.regular }]}>{error}</Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
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
  scroll: { paddingHorizontal: Spacing.lg },
  intro: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    lineHeight: 21,
    marginBottom: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  cardSelected: { borderColor: Colors.primary },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.accentFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleWrap: { flex: 1 },
  cardTitle: { fontSize: FontSizes.base, color: Colors.text, marginBottom: 4 },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  tag: { fontSize: FontSizes.xs, color: Colors.accent },
  currentPill: {
    backgroundColor: Colors.accentFaint,
    borderRadius: Radius.full,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  currentText: { fontSize: 9, color: Colors.accent, textTransform: 'uppercase', letterSpacing: 0.5 },
  cardBody: { fontSize: FontSizes.sm, color: Colors.textMuted, lineHeight: 20, marginTop: Spacing.sm },
  actions: { marginTop: Spacing.sm },
  infoLine: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm },
  infoLineText: { flex: 1, fontSize: FontSizes.sm, color: Colors.textMuted, lineHeight: 20 },
  appleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: '#000',
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
  },
  appleBtnText: { fontSize: FontSizes.base, color: Colors.white },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
  },
  googleBtnText: { fontSize: FontSizes.base, color: Colors.text },
  secondaryBtn: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  secondaryBtnText: { fontSize: FontSizes.base, color: Colors.text },
  note: { fontSize: FontSizes.xs, color: Colors.textSubtle, lineHeight: 17, marginTop: 2 },
  errorRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: Spacing.sm },
  errorText: { flex: 1, fontSize: FontSizes.xs, color: Colors.flare, lineHeight: 17 },
  signedInCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
  signedInRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  providerIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signedInName: { fontSize: FontSizes.base, color: Colors.text },
  signedInSub: { fontSize: FontSizes.sm, color: Colors.textMuted },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  syncText: { fontSize: FontSizes.xs, color: Colors.textMuted },
  signedInActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  smallBtn: {
    flex: 1,
    backgroundColor: Colors.surfaceDark,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  smallBtnText: { fontSize: FontSizes.sm, color: Colors.text },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.danger + '55',
  },
  deleteBtnText: { fontSize: FontSizes.sm, color: Colors.danger },
});
