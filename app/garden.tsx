import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/AppText';
import { Colors, FontSizes, Spacing } from '@/constants/theme';
import { useFontFamily } from '@/hooks/useFontFamily';
import { GardenCanvas } from '@/features/garden/GardenCanvas';
import { GardenDebugPanel } from '@/features/garden/GardenDebugPanel';
import { calculateDailyVisitors, todaySeed } from '@/features/garden/gardenRules';
import { useGardenState } from '@/features/garden/gardenState';
import { seasonForDate, weatherForDate, timeOfDayForDate, partOfDayForDate } from '@/features/garden/gardenEnvironment';
import { whisperFor } from '@/features/garden/gardenWhisper';

// A soft ambient tint behind the garden so the letterbox margins feel like sky
// and dusk rather than a dead black void. Dark to blend with the garden's edges.
const AMBIENT: Record<string, string> = {
  morning: '#191611',
  day: '#12160f',
  evening: '#17111a',
  night: '#0c0f16',
};

export default function GardenScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const ff = useFontFamily();
  const fade = useRef(new Animated.Value(0)).current;
  const dailySeed = useRef(todaySeed()).current;
  const { state, actions } = useGardenState();
  const [scrollEnabled, setScrollEnabled] = useState(true);

  // Seasons, light, and weather pass through the garden from real life — no input.
  useEffect(() => {
    const now = new Date();
    actions.updateGardenState({
      season: seasonForDate(now),
      weather: weatherForDate(now),
      timeOfDay: timeOfDayForDate(now),
      partOfDay: partOfDayForDate(now),
    });
  }, [actions]);

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, [fade]);

  useEffect(() => {
    const shouldShowVisitors = state.weather !== 'clear' || state.timeOfDay !== 'day' || state.season !== 'spring' || Boolean(state.recentActivity) || state.unlockedAssetIds.length > 0;
    if (!shouldShowVisitors) return;
    const nextVisitors = calculateDailyVisitors(state, dailySeed);
    if (nextVisitors.join(',') !== state.dailyVisitorIds.join(',')) {
      actions.updateGardenState({ dailyVisitorIds: nextVisitors });
    }
  }, [actions, dailySeed, state]);

  const whisper = useMemo(
    () =>
      whisperFor({
        recentDiscoveryId: state.unlockedAssetIds[state.unlockedAssetIds.length - 1] ?? null,
        visitors: state.dailyVisitorIds,
        season: state.season,
        weather: state.weather,
        partOfDay: state.partOfDay ?? (state.timeOfDay === 'night' ? 'night' : 'day'),
        seed: dailySeed,
      }),
    [state.unlockedAssetIds, state.dailyVisitorIds, state.season, state.weather, state.partOfDay, state.timeOfDay, dailySeed]
  );

  const ambient = AMBIENT[state.partOfDay ?? 'day'] ?? AMBIENT.day;

  return (
    <View style={[styles.root, { paddingTop: insets.top, backgroundColor: ambient }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" style={styles.back}>
          <MaterialIcons name="chevron-left" size={26} color={Colors.text} />
        </Pressable>
        <Text style={[styles.title, { fontFamily: ff.bold }]}>Lola's Garden</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView
        scrollEnabled={scrollEnabled}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.canvasWrap, { opacity: fade }]}>
          <GardenCanvas gardenState={state} setScrollEnabled={setScrollEnabled} />
        </Animated.View>

        {/* Lola's whisper — a soft, wandering line. No numbers, no pressure. */}
        <View style={styles.whisperWrap}>
          <Text style={[styles.whisper, { fontFamily: ff.regular }]}>{whisper}</Text>
        </View>

        <View style={styles.debugWrap}>
          <GardenDebugPanel
            state={state}
            updateState={actions.updateGardenState}
            toggleUnlock={assetId => {
              const nextUnlocks = state.unlockedAssetIds.includes(assetId)
                ? state.unlockedAssetIds.filter(id => id !== assetId)
                : [...state.unlockedAssetIds, assetId];
              actions.setGardenUnlocks(nextUnlocks);
            }}
            resetGardenState={() => {
              actions.resetGardenUnlocks();
              actions.updateGardenState({ recentActivity: null, dailyVisitorIds: [] });
            }}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg },
  back: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  title: { color: Colors.text, fontSize: FontSizes.lg },
  headerSpacer: { width: 42 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingBottom: Spacing.lg, gap: Spacing.lg },
  canvasWrap: { width: '100%' },
  whisperWrap: { paddingHorizontal: Spacing.xl, alignItems: 'center' },
  whisper: { color: Colors.textMuted, fontSize: FontSizes.base, fontStyle: 'italic', textAlign: 'center', lineHeight: 24 },
  debugWrap: { paddingHorizontal: Spacing.lg },
});
