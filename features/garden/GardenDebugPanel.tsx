import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/AppText';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { PERMANENT_UNLOCK_IDS } from './gardenRules';
import { GardenActivity, GardenSeason, GardenState, GardenTimeOfDay, GardenWeather } from './gardenState';

type Props = {
  state: GardenState;
  updateState: (patch: Partial<GardenState>) => void;
  toggleUnlock: (assetId: (typeof PERMANENT_UNLOCK_IDS)[number]) => void;
  resetGardenState: () => void;
};

const seasons: GardenSeason[] = ['spring', 'summer', 'autumn', 'winter'];
const weather: GardenWeather[] = ['clear', 'cloudy', 'rain'];
const times: GardenTimeOfDay[] = ['day', 'night'];
const activities: Array<GardenActivity | null> = [null, 'journaling', 'reading', 'music', 'gardening', 'comfort'];

export function GardenDebugPanel({ state, updateState, toggleUnlock, resetGardenState }: Props) {
  if (!__DEV__) return null;

  return (
    <View style={styles.panel}>
      <Text style={styles.title}>Garden debug</Text>
      <Row label="Season" values={seasons} active={state.season} onPress={season => updateState({ season })} />
      <Row label="Weather" values={weather} active={state.weather} onPress={next => updateState({ weather: next })} />
      <Row label="Time" values={times} active={state.timeOfDay} onPress={timeOfDay => updateState({ timeOfDay })} />
      <Row label="Activity" values={activities} active={state.recentActivity ?? null} onPress={recentActivity => updateState({ recentActivity })} />
      <View style={styles.wrap}>
        {PERMANENT_UNLOCK_IDS.map(id => {
          const active = state.unlockedAssetIds.includes(id);
          return (
            <Pressable key={id} style={[styles.chip, active && styles.active]} onPress={() => toggleUnlock(id)}>
              <Text style={styles.chipText}>{active ? '✓ ' : ''}{id}</Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable style={styles.reset} onPress={resetGardenState}><Text style={styles.chipText}>reset garden state</Text></Pressable>
    </View>
  );
}

function Row<T extends string | null>({ label, values, active, onPress }: { label: string; values: T[]; active: T; onPress: (value: T) => void }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.wrap}>{values.map(value => (
        <Pressable key={value ?? 'none'} style={[styles.chip, value === active && styles.active]} onPress={() => onPress(value)}>
          <Text style={styles.chipText}>{value ?? 'none'}</Text>
        </Pressable>
      ))}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { borderWidth: 1, borderColor: Colors.borderLight, borderRadius: Radius.md, padding: Spacing.md, gap: Spacing.sm },
  title: { color: Colors.text, fontSize: 13 },
  row: { gap: 6 },
  label: { color: Colors.textMuted, fontSize: 12 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderWidth: 1, borderColor: Colors.borderLight, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 5 },
  active: { backgroundColor: Colors.primaryFaint },
  reset: { alignSelf: 'flex-start', borderWidth: 1, borderColor: Colors.borderLight, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 6 },
  chipText: { color: Colors.textSecondary, fontSize: 11 },
});
