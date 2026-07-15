import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/AppText';
import { Colors, FontSizes, Spacing } from '@/constants/theme';
import { useFontFamily } from '@/hooks/useFontFamily';
import { GardenCanvas } from '@/features/garden/GardenCanvas';
import { GardenCoordinateEditor } from '@/features/garden/GardenCoordinateEditor';
import { GardenDebugPanel } from '@/features/garden/GardenDebugPanel';
import { calculateDailyVisitors, todaySeed } from '@/features/garden/gardenRules';
import { useGardenState } from '@/features/garden/gardenState';
import { seasonForDate, weatherForDate, timeOfDayForDate, partOfDayForDate } from '@/features/garden/gardenEnvironment';
import { whisperFor } from '@/features/garden/gardenWhisper';

// A soft ambient tint behind the garden so the letterbox margins feel like sky
// and dusk rather than a dead black void. Dark to blend with the garden's edges.
const AMBIENT: Record<string, string> = {
  morning: '#181420',
  day: '#141118',
  evening: '#191122',
  night: '#0e0d16',
};

export default function GardenScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const ff = useFontFamily();
  const fade = useRef(new Animated.Value(0)).current;
  const dailySeed = useRef(todaySeed()).current;
  const { state, actions } = useGardenState();
  const [editor, setEditor] = useState(false);
  const [devPanel, setDevPanel] = useState(false);

  // Lola's Garden is a landscape place. Lock to landscape on entry and restore
  // the app's portrait orientation when leaving.
  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        } catch {
          /* unsupported (web/simulator) — ignore */
        }
      })();
      return () => {
        (async () => {
          try {
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
          } catch {
            /* ignore */
          }
        })();
      };
    }, [])
  );

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
    const shouldShowVisitors =
      state.weather !== 'clear' ||
      state.timeOfDay !== 'day' ||
      state.season !== 'spring' ||
      Boolean(state.recentActivity) ||
      state.unlockedAssetIds.length > 0;
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
    <View style={[styles.root, { backgroundColor: ambient }]}>
      <StatusBar hidden />

      {/* The garden is the whole page. */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: fade }]}>
        <GardenCanvas
          gardenState={state}
          interactive={!editor}
          renderOverlay={editor ? geom => <GardenCoordinateEditor geom={geom} /> : undefined}
        />
      </Animated.View>

      {/* Minimal floating back button (safe-area aware for the landscape notch). */}
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Leave the garden"
        style={[styles.back, { top: insets.top + 8, left: Math.max(insets.left, 12) }]}
      >
        <MaterialIcons name="chevron-left" size={24} color={Colors.text} />
      </Pressable>

      {/* Subtle title overlay. */}
      <Text style={[styles.title, { top: insets.top + 10, fontFamily: ff.bold }]}>Lola&apos;s Garden</Text>

      {/* Lola's whisper — a soft, wandering line floating over the lower garden. */}
      {!editor ? (
        <Text style={[styles.whisper, { bottom: insets.bottom + 12, fontFamily: ff.regular }]} numberOfLines={2}>
          {whisper}
        </Text>
      ) : null}

      {/* Dev-only tools: coordinate editor + season/unlock panel. */}
      {__DEV__ ? (
        <View style={[styles.devButtons, { top: insets.top + 8, right: Math.max(insets.right, 12) }]}>
          <Pressable style={[styles.devBtn, editor && styles.devBtnOn]} onPress={() => setEditor(v => !v)}>
            <Text style={styles.devBtnText}>{editor ? 'edit ✕' : 'edit'}</Text>
          </Pressable>
          <Pressable style={[styles.devBtn, devPanel && styles.devBtnOn]} onPress={() => setDevPanel(v => !v)}>
            <Text style={styles.devBtnText}>{devPanel ? 'dev ✕' : 'dev'}</Text>
          </Pressable>
        </View>
      ) : null}

      {__DEV__ && devPanel ? (
        <View style={[styles.devDrawer, { top: insets.top + 40, right: Math.max(insets.right, 12) }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
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
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  back: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    zIndex: 10,
  },
  title: {
    position: 'absolute',
    alignSelf: 'center',
    color: Colors.text,
    fontSize: FontSizes.base,
    opacity: 0.85,
    zIndex: 10,
  },
  whisper: {
    position: 'absolute',
    alignSelf: 'center',
    maxWidth: '80%',
    color: Colors.textMuted,
    fontSize: FontSizes.sm,
    fontStyle: 'italic',
    textAlign: 'center',
    zIndex: 10,
  },
  devButtons: { position: 'absolute', flexDirection: 'row', gap: 6, zIndex: 20 },
  devBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  devBtnOn: { backgroundColor: 'rgba(138,180,255,0.85)', borderColor: '#8ab4ff' },
  devBtnText: { color: '#fff', fontSize: 11 },
  devDrawer: {
    position: 'absolute',
    width: 300,
    maxHeight: 240,
    backgroundColor: 'rgba(10,10,12,0.92)',
    borderRadius: 12,
    padding: Spacing.sm,
    zIndex: 20,
  },
});
