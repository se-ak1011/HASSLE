import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Image, Linking } from 'react-native';
import { Text } from '@/components/ui/AppText';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, Radius } from '@/constants/theme';
import { useFontFamily } from '@/hooks/useFontFamily';
import { Companion } from '@/constants/companion';
import { getLibrary, LIBRARY_DISCLAIMER, LibraryArticle, SourceKind } from '@/constants/library';
import { useRegion } from '@/localization/RegionContext';

const KIND_LABEL: Record<SourceKind, string> = {
  study: 'Study',
  guideline: 'Guideline',
  essay: 'Essay',
};

export default function LibraryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const ff = useFontFamily();
  const { region } = useRegion();
  const library = getLibrary(region);
  const [open, setOpen] = useState<LibraryArticle | null>(null);

  function openSource(url: string) {
    Linking.openURL(url).catch(() => {
      // silently ignore — nothing we can do if no browser is available
    });
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => (open ? setOpen(null) : router.back())}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={open ? 'Back to library' : 'Back'}
        >
          <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { fontFamily: ff.semibold }]} numberOfLines={1}>
          {open ? open.tag : 'Library'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {open ? (
          // ── Article detail ──────────────────────────────────────────────
          <>
            <Text style={[styles.articleTag, { fontFamily: ff.medium }]}>{open.tag}</Text>
            <Text style={[styles.articleTitle, { fontFamily: ff.bold }]}>{open.title}</Text>
            <Text style={[styles.articleBody, { fontFamily: ff.regular }]}>{open.body}</Text>

            {open.note ? (
              <View style={styles.noteCard}>
                <MaterialIcons name="info-outline" size={16} color={Colors.accent} />
                <Text style={[styles.noteText, { fontFamily: ff.regular }]}>{open.note}</Text>
              </View>
            ) : null}

            <Text style={[styles.sourcesLabel, { fontFamily: ff.semibold }]}>Sources</Text>
            {open.sources.map((s) => (
              <Pressable
                key={s.url}
                style={({ pressed }) => [styles.sourceRow, pressed && styles.rowPressed]}
                onPress={() => openSource(s.url)}
                accessibilityRole="link"
              >
                <View style={styles.kindBadge}>
                  <Text style={[styles.kindText, { fontFamily: ff.medium }]}>{KIND_LABEL[s.kind]}</Text>
                </View>
                <Text style={[styles.sourceLabel, { fontFamily: ff.regular }]}>{s.label}</Text>
                <MaterialIcons name="open-in-new" size={16} color={Colors.textSubtle} />
              </Pressable>
            ))}

            <Text style={[styles.disclaimer, { fontFamily: ff.regular }]}>{LIBRARY_DISCLAIMER}</Text>
          </>
        ) : (
          // ── Article list ────────────────────────────────────────────────
          <>
            <View style={styles.hero}>
              <Image source={Companion.Library} style={styles.heroImg} resizeMode="contain" />
            </View>
            <Text style={[styles.intro, { fontFamily: ff.regular }]}>
              Short, plain-language reads on living with chronic illness — each one linking out to the
              real studies and guidelines behind it.
            </Text>

            {library.map((a) => (
              <Pressable
                key={a.id}
                style={({ pressed }) => [styles.card, pressed && styles.rowPressed]}
                onPress={() => setOpen(a)}
                accessibilityRole="button"
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTag, { fontFamily: ff.medium }]}>{a.tag}</Text>
                  <Text style={[styles.cardTitle, { fontFamily: ff.semibold }]}>{a.title}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={Colors.textSubtle} />
              </Pressable>
            ))}

            <Text style={[styles.disclaimer, { fontFamily: ff.regular }]}>{LIBRARY_DISCLAIMER}</Text>
          </>
        )}
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
  headerTitle: { fontSize: FontSizes.lg, color: Colors.text, flex: 1, textAlign: 'center' },
  scroll: { paddingHorizontal: Spacing.lg },
  hero: { alignItems: 'center', marginBottom: Spacing.sm },
  heroImg: { width: 150, height: 150 },
  intro: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    lineHeight: 21,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  cardTag: { fontSize: FontSizes.xs, color: Colors.accent, marginBottom: 3 },
  cardTitle: { fontSize: FontSizes.base, color: Colors.text },
  rowPressed: { opacity: 0.7 },
  // Detail
  articleTag: { fontSize: FontSizes.sm, color: Colors.accent, marginTop: Spacing.sm },
  articleTitle: {
    fontSize: FontSizes.xl,
    color: Colors.text,
    letterSpacing: -0.4,
    marginTop: 4,
    marginBottom: Spacing.md,
  },
  articleBody: { fontSize: FontSizes.base, color: Colors.text, lineHeight: 26 },
  noteCard: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: Colors.accentFaint,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.lg,
  },
  noteText: { flex: 1, fontSize: FontSizes.sm, color: Colors.textMuted, lineHeight: 20 },
  sourcesLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  kindBadge: {
    backgroundColor: Colors.surfaceDark,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  kindText: { fontSize: 10, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  sourceLabel: { flex: 1, fontSize: FontSizes.sm, color: Colors.text, lineHeight: 19 },
  disclaimer: {
    fontSize: FontSizes.xs,
    color: Colors.textSubtle,
    lineHeight: 17,
    fontStyle: 'italic',
    marginTop: Spacing.xl,
  },
});
