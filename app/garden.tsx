import React, { useEffect, useRef, useState } from 'react';
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

export default function GardenScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const ff = useFontFamily();
  const fade = useRef(new Animated.Value(0)).current;
  const dailySeed = useRef(todaySeed()).current;
  const { state, actions } = useGardenState();
  const [scrollEnabled, setScrollEnabled] = useState(true);

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

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" style={styles.back}>
          <MaterialIcons name="chevron-left" size={26} color={Colors.text} />
        </Pressable>
        <Text style={[styles.title, { fontFamily: ff.bold }]}>Lola's Garden</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView scrollEnabled={scrollEnabled} contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <Animated.View style={[styles.canvasWrap, { opacity: fade }]}>
          <GardenCanvas gardenState={state} setScrollEnabled={setScrollEnabled} />
        </Animated.View>
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
              actions.updateGardenState({ recentActivity: null, season: 'spring', weather: 'clear', timeOfDay: 'day', dailyVisitorIds: [] });
            }}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg },
  back: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  title: { color: Colors.text, fontSize: FontSizes.lg },
  headerSpacer: { width: 42 },
  scroll: { paddingTop: Spacing.sm, paddingBottom: Spacing.lg, gap: Spacing.lg },
  canvasWrap: { width: '100%', opacity: 1 },
  debugWrap: { paddingHorizontal: Spacing.lg },
});
