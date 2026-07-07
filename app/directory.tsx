import React, { useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Image, Linking } from 'react-native';
import { Text } from '@/components/ui/AppText';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, Radius } from '@/constants/theme';
import { useFontFamily } from '@/hooks/useFontFamily';
import { Companion } from '@/constants/companion';
import {
  DIRECTORY_CONDITION_FILTERS,
  DIRECTORY_SPECIALTY_FILTERS,
  SPECIALIST_DIRECTORY_SEED,
} from '@/constants/directory';

const ALL_FILTERS = [...DIRECTORY_CONDITION_FILTERS, ...DIRECTORY_SPECIALTY_FILTERS];

export default function DirectoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const ff = useFontFamily();
  const [filter, setFilter] = useState<string | null>(null);

  const entries = useMemo(() => {
    if (!filter) return SPECIALIST_DIRECTORY_SEED;
    return SPECIALIST_DIRECTORY_SEED.filter((entry) =>
      [...entry.conditions, ...entry.specialties, ...entry.tags].some(
        (item) => item.toLowerCase() === filter.toLowerCase()
      )
    );
  }, [filter]);

  function openUrl(url: string) {
    Linking.openURL(url).catch(() => {});
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}> 
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back">
          <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { fontFamily: ff.semibold }]}>Specialist directory</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing.xl }]} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Image source={Companion.Directory} style={styles.heroImg} resizeMode="contain" />
          <Text style={[styles.title, { fontFamily: ff.bold }]}>Finding people who get invisible illness.</Text>
          <Text style={[styles.body, { fontFamily: ff.regular }]}>This directory is being built. Listings should be checked before booking.</Text>
        </View>

        <View style={styles.noticeCard}>
          <MaterialIcons name="info-outline" size={18} color={Colors.accent} />
          <Text style={[styles.noticeText, { fontFamily: ff.regular }]}>These are static US-first public-info seeds for review. Hassle does not endorse or recommend any listing.</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
          <View style={styles.filtersRow}>
            <Pressable style={[styles.filterChip, !filter && styles.filterChipSelected]} onPress={() => setFilter(null)}>
              <Text style={[styles.filterText, !filter && styles.filterTextSelected, { fontFamily: ff.medium }]}>All</Text>
            </Pressable>
            {ALL_FILTERS.map((item) => {
              const selected = filter === item;
              return (
                <Pressable key={item} style={[styles.filterChip, selected && styles.filterChipSelected]} onPress={() => setFilter(selected ? null : item)}>
                  <Text style={[styles.filterText, selected && styles.filterTextSelected, { fontFamily: ff.medium }]}>{item}</Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <View style={styles.list}>
          {entries.map((entry) => (
            <View key={entry.id} style={styles.entryCard}>
              <View style={styles.entryHeader}>
                <View style={styles.entryCopy}>
                  <Text style={[styles.entryName, { fontFamily: ff.bold }]}>{entry.name}</Text>
                  <Text style={[styles.entryClinic, { fontFamily: ff.regular }]}>{entry.clinicName}</Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={[styles.statusText, { fontFamily: ff.medium }]}>{entry.verificationStatus}</Text>
                </View>
              </View>
              <Text style={[styles.entryMeta, { fontFamily: ff.regular }]}>{entry.profession} · {entry.city}, {entry.regionState}</Text>
              <Text style={[styles.entryNotes, { fontFamily: ff.regular }]}>{entry.notes}</Text>
              <View style={styles.tagsRow}>
                {entry.tags.slice(0, 4).map((tag) => <Text key={tag} style={[styles.tag, { fontFamily: ff.medium }]}>{tag}</Text>)}
              </View>
              <Pressable style={styles.sourceLink} onPress={() => openUrl(entry.sourceUrl)} accessibilityRole="link">
                <Text style={[styles.sourceText, { fontFamily: ff.medium }]}>Check source</Text>
                <MaterialIcons name="open-in-new" size={15} color={Colors.primary} />
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  headerTitle: { fontSize: FontSizes.lg, color: Colors.text },
  scroll: { paddingHorizontal: Spacing.lg },
  hero: { alignItems: 'center', marginTop: Spacing.md },
  heroImg: { width: 170, height: 180 },
  title: { fontSize: FontSizes.xl, color: Colors.text, letterSpacing: -0.4, marginTop: Spacing.md, textAlign: 'center' },
  body: { fontSize: FontSizes.base, color: Colors.textMuted, lineHeight: 24, textAlign: 'center', marginTop: Spacing.sm },
  noticeCard: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, backgroundColor: Colors.accentFaint, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, marginTop: Spacing.lg },
  noticeText: { flex: 1, fontSize: FontSizes.sm, color: Colors.textSecondary, lineHeight: 20 },
  filtersScroll: { marginTop: Spacing.lg, marginHorizontal: -Spacing.lg },
  filtersRow: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.lg },
  filterChip: { borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, paddingHorizontal: Spacing.md, paddingVertical: 8 },
  filterChipSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: FontSizes.sm, color: Colors.textMuted },
  filterTextSelected: { color: Colors.background },
  list: { gap: Spacing.md, marginTop: Spacing.lg },
  entryCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, gap: Spacing.sm },
  entryHeader: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  entryCopy: { flex: 1 },
  entryName: { fontSize: FontSizes.base, color: Colors.text, lineHeight: 23 },
  entryClinic: { fontSize: FontSizes.sm, color: Colors.textSubtle, marginTop: 2 },
  statusBadge: { borderRadius: Radius.full, backgroundColor: Colors.primaryFaint, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 11, color: Colors.primary },
  entryMeta: { fontSize: FontSizes.sm, color: Colors.textSecondary, lineHeight: 20 },
  entryNotes: { fontSize: FontSizes.sm, color: Colors.textMuted, lineHeight: 20 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { fontSize: 12, color: Colors.textSecondary, backgroundColor: Colors.surfaceElevated, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 4 },
  sourceLink: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', marginTop: 2 },
  sourceText: { fontSize: FontSizes.sm, color: Colors.primary },
});
