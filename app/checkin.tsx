import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Platform,
} from 'react-native';
import { Text, TextInput } from '@/components/ui/AppText';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSizes, Fonts, Radius } from '@/constants/theme';
import { EnergyMode, DailyTag, BUILT_IN_TAGS } from '@/constants/types';
import { useDay } from '@/hooks/useDay';

const SPOON_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const BATTERY_VALUES = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

export default function CheckInScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { completeCheckIn, prefs, addCustomTag } = useDay();

  const [mode, setMode] = useState<EnergyMode>(prefs?.energyMode ?? 'spoon');
  const [energyLevel, setEnergyLevel] = useState(mode === 'spoon' ? 6 : 50);
  const [isFlare, setIsFlare] = useState(false);
  const [tags, setTags] = useState<DailyTag[]>([]);

  // Custom tag state
  const [showTagInput, setShowTagInput] = useState(false);
  const [tagInputValue, setTagInputValue] = useState('');
  const [tagInputError, setTagInputError] = useState('');

  const allTags: string[] = [...BUILT_IN_TAGS, ...(prefs?.customTags ?? [])];

  function handleAddCustomTag() {
    const trimmed = tagInputValue.trim().slice(0, 30);
    if (!trimmed) return;
    const added = addCustomTag(trimmed);
    if (!added) {
      setTagInputError('That tag already exists.');
      return;
    }
    setTags((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    setTagInputValue('');
    setTagInputError('');
    setShowTagInput(false);
  }

  const values = mode === 'spoon' ? SPOON_VALUES : BATTERY_VALUES;

  function handleModeSelect(m: EnergyMode) {
    setMode(m);
    setEnergyLevel(m === 'spoon' ? 6 : 50);
  }

  function toggleTag(tag: string) {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  async function handleContinue() {
    await completeCheckIn(mode, energyLevel, isFlare, tags);
    router.replace('/(tabs)');
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero image */}
        <View style={styles.heroContainer}>
          <Image
            source={require('@/assets/images/checkin-hero.png')}
            style={styles.heroImage}
            contentFit="cover"
            transition={400}
          />
          <View style={styles.heroOverlay} />
        </View>

        {/* Title */}
        <View style={styles.titleBlock}>
          <Text style={styles.title}>
            {prefs?.name ? `How are you today, ${prefs.name}?` : 'How are you today?'}
          </Text>
          <Text style={styles.subtitle}>
            No judgement. Just where you are right now.
          </Text>
        </View>

        {/* Mode selector */}
        <View style={styles.section}>
          <Text style={styles.label}>How would you like to track energy?</Text>
          <View style={styles.modeRow}>
            <Pressable
              style={[styles.modeCard, mode === 'spoon' && styles.modeCardActive]}
              onPress={() => handleModeSelect('spoon')}
            >
              <Text style={styles.modeIcon}>🥄</Text>
              <Text
                style={[
                  styles.modeTitle,
                  mode === 'spoon' && styles.modeTitleActive,
                ]}
              >
                Spoon
              </Text>
              <Text style={styles.modeDesc}>for flare-based energy</Text>
            </Pressable>
            <Pressable
              style={[
                styles.modeCard,
                mode === 'battery' && styles.modeCardActive,
              ]}
              onPress={() => handleModeSelect('battery')}
            >
              <Text style={styles.modeIcon}>🔋</Text>
              <Text
                style={[
                  styles.modeTitle,
                  mode === 'battery' && styles.modeTitleActive,
                ]}
              >
                Battery
              </Text>
              <Text style={styles.modeDesc}>for percentage tracking</Text>
            </Pressable>
          </View>
        </View>

        {/* Energy level selector */}
        <View style={styles.section}>
          <Text style={styles.label}>
            {mode === 'spoon'
              ? `How many spoons do you have today? (${energyLevel})`
              : `What is your battery level? (${energyLevel}%)`}
          </Text>
          <View style={styles.energyGrid}>
            {values.map((v) => (
              <Pressable
                key={v}
                style={[
                  styles.energyChip,
                  energyLevel === v && styles.energyChipActive,
                ]}
                onPress={() => setEnergyLevel(v)}
              >
                <Text
                  style={[
                    styles.energyChipText,
                    energyLevel === v && styles.energyChipTextActive,
                  ]}
                >
                  {mode === 'battery' ? `${v}%` : v}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Flare day — visually separated */}
        <View style={styles.flareSectionWrap}>
          <View style={styles.flareSection}>
            <View style={styles.flareRow}>
              <View style={styles.flareLeft}>
                <Text style={styles.flareTitle}>Flare day</Text>
                <Text style={styles.flareDesc}>
                  Task costs will increase by 50%
                </Text>
              </View>
              <Switch
                value={isFlare}
                onValueChange={setIsFlare}
                trackColor={{ false: Colors.border, true: Colors.flare }}
                thumbColor={Colors.white}
              />
            </View>
            {isFlare ? (
              <View style={styles.flareMessage}>
                <Text style={styles.flareMessageText}>
                  Be gentle with yourself today. Flare days are hard.
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Tags */}
        <View style={styles.section}>
          <Text style={styles.label}>Anything worth noting? (optional)</Text>
          <View style={styles.tagsWrap}>
            {allTags.map((tag) => (
              <Pressable
                key={tag}
                style={[styles.tag, tags.includes(tag) && styles.tagActive]}
                onPress={() => toggleTag(tag)}
              >
                <Text
                  style={[
                    styles.tagText,
                    tags.includes(tag) && styles.tagTextActive,
                  ]}
                >
                  {tag}
                </Text>
              </Pressable>
            ))}
            {!showTagInput ? (
              <Pressable
                style={styles.customTagChip}
                onPress={() => {
                  setShowTagInput(true);
                  setTagInputError('');
                }}
              >
                <Text style={styles.customTagChipText}>+ Custom</Text>
              </Pressable>
            ) : null}
          </View>

          {showTagInput ? (
            <View style={styles.tagInputWrap}>
              <TextInput
                style={styles.tagInput}
                value={tagInputValue}
                onChangeText={(t) => {
                  setTagInputValue(t.slice(0, 30));
                  setTagInputError('');
                }}
                placeholder="Add your own tag"
                placeholderTextColor={Colors.textSubtle}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleAddCustomTag}
                maxLength={30}
              />
              <View style={styles.tagInputActions}>
                <Pressable style={styles.tagConfirmBtn} onPress={handleAddCustomTag}>
                  <Text style={styles.tagConfirmText}>Add</Text>
                </Pressable>
                <Pressable
                  style={styles.tagCancelBtn}
                  onPress={() => {
                    setShowTagInput(false);
                    setTagInputValue('');
                    setTagInputError('');
                  }}
                >
                  <Text style={styles.tagCancelText}>Cancel</Text>
                </Pressable>
              </View>
              {tagInputError ? (
                <Text style={styles.tagInputError}>{tagInputError}</Text>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* CTA */}
        <Pressable
          style={({ pressed }) => [
            styles.continueBtn,
            pressed && { opacity: 0.85 },
          ]}
          onPress={handleContinue}
        >
          <Text style={styles.continueBtnText}>Start the day</Text>
        </Pressable>

        <View style={{ height: insets.bottom + Spacing.xl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    paddingBottom: Spacing.xxxl,
  },
  heroContainer: {
    height: 200,
    width: '100%',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 25, 22, 0.5)',
  },
  titleBlock: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: Fonts.bold,
    color: Colors.text,
    letterSpacing: -0.5,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSizes.base,
    color: Colors.textMuted,
    lineHeight: 24,
    fontWeight: Fonts.regular,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: Fonts.medium,
    color: Colors.textSubtle,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  modeRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  modeCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  modeCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryFaint,
  },
  modeIcon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  modeTitle: {
    fontSize: FontSizes.base,
    fontWeight: Fonts.semibold,
    color: Colors.text,
    marginBottom: 2,
  },
  modeTitleActive: {
    color: Colors.primary,
  },
  modeDesc: {
    fontSize: FontSizes.xs,
    color: Colors.textSubtle,
    textAlign: 'center',
  },
  energyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  energyChip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    minWidth: 52,
    alignItems: 'center',
  },
  energyChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  energyChipText: {
    fontSize: FontSizes.base,
    fontWeight: Fonts.medium,
    color: Colors.text,
  },
  energyChipTextActive: {
    color: Colors.background,
    fontWeight: Fonts.semibold,
  },
  flareSectionWrap: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  flareSection: {
    backgroundColor: Colors.flareFaint,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.flare,
  },
  flareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flareLeft: {
    flex: 1,
    marginRight: Spacing.md,
  },
  flareTitle: {
    fontSize: FontSizes.base,
    fontWeight: Fonts.semibold,
    color: Colors.flare,
    marginBottom: 2,
  },
  flareDesc: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  flareMessage: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  flareMessageText: {
    fontSize: FontSizes.base,
    color: Colors.flare,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  tag: {
    paddingVertical: 7,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  tagText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    fontWeight: Fonts.medium,
  },
  tagTextActive: {
    color: Colors.background,
    fontWeight: Fonts.semibold,
  },
  customTagChip: {
    paddingVertical: 7,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  customTagChipText: {
    fontSize: FontSizes.sm,
    color: Colors.textSubtle,
    fontWeight: Fonts.medium,
  },
  tagInputWrap: {
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  tagInput: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 11,
    fontSize: FontSizes.base,
    color: Colors.text,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  tagInputActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  tagConfirmBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tagConfirmText: {
    fontSize: FontSizes.sm,
    fontWeight: Fonts.semibold,
    color: Colors.background,
  },
  tagCancelBtn: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagCancelText: {
    fontSize: FontSizes.sm,
    fontWeight: Fonts.medium,
    color: Colors.textMuted,
  },
  tagInputError: {
    fontSize: FontSizes.xs,
    color: Colors.flare,
    fontStyle: 'italic',
  },
  continueBtn: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueBtnText: {
    fontSize: FontSizes.md,
    fontWeight: Fonts.semibold,
    color: Colors.background,
    letterSpacing: 0.2,
  },
});
