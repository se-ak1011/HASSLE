import React, { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, FontSizes, Radius, Spacing } from '@/constants/theme';
import { useFontFamily } from '@/hooks/useFontFamily';
import { companionAssets } from '@/constants/relaxationContent';
import { loadJsonState, saveJsonState } from '@/services/storage';

type GardenState = { cameraX: number; cameraY: number; lastVisitedAt?: string; favoriteSpot: string };
const DEFAULT_STATE: GardenState = { cameraX: 0, cameraY: 0, favoriteSpot: 'bench' };

function seasonFor(date: Date) {
  const m = date.getMonth();
  if (m <= 1 || m === 11) return { name: 'winter', sky: '#202733', ground: '#465046', note: 'The garden is resting quietly.' };
  if (m <= 4) return { name: 'spring', sky: '#25322E', ground: '#526A4F', note: 'Small green things are awake.' };
  if (m <= 7) return { name: 'summer', sky: '#29374A', ground: '#5C704F', note: 'Everything is warm and unhurried.' };
  return { name: 'autumn', sky: '#332B25', ground: '#66533D', note: 'Leaves change. Nothing is lost.' };
}
function timeOfDay(date: Date) {
  const h = date.getHours();
  if (h < 6) return { name: 'night', tint: '#111827AA' };
  if (h < 12) return { name: 'morning', tint: '#F8DDA433' };
  if (h < 18) return { name: 'afternoon', tint: '#FFFFFF10' };
  return { name: 'evening', tint: '#AA6B6333' };
}
function weatherFor(date: Date) {
  const seed = date.getFullYear() + date.getMonth() * 31 + date.getDate();
  return ['clear', 'cloudy', 'soft rain'][seed % 3];
}

export default function GardenScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const ff = useFontFamily();
  const [state, setState] = useState(DEFAULT_STATE);
  const now = useMemo(() => new Date(), []);
  const season = seasonFor(now);
  const dayPart = timeOfDay(now);
  const weather = weatherFor(now);
  const lola = companionAssets[Math.floor(now.getHours() / 3) % companionAssets.length];

  useEffect(() => { loadJsonState('garden', DEFAULT_STATE).then(setState); }, []);
  useEffect(() => { saveJsonState('garden', { ...state, lastVisitedAt: new Date().toISOString() }); }, [state]);

  function move(dx: number, dy: number) {
    setState(prev => ({ ...prev, cameraX: Math.max(-1, Math.min(1, prev.cameraX + dx)), cameraY: Math.max(-1, Math.min(1, prev.cameraY + dy)) }));
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" style={styles.back}><MaterialIcons name="chevron-left" size={26} color={Colors.text} /></Pressable>
        <Text style={[styles.title, { fontFamily: ff.bold }]}>Lola's Garden</Text>
        <View style={{ width: 42 }} />
      </View>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <View style={[styles.garden, { backgroundColor: season.sky }]}>
          <View style={[styles.ground, { backgroundColor: season.ground, transform: [{ translateX: state.cameraX * -18 }, { translateY: state.cameraY * -10 }] }]} />
          <View style={[styles.sun, dayPart.name === 'night' && styles.moon]} />
          {weather !== 'clear' ? <View style={styles.cloud} /> : null}
          {weather === 'soft rain' ? Array.from({ length: 9 }).map((_, i) => <View key={i} style={[styles.rain, { left: 35 + i * 24 }]} />) : null}
          <View style={[styles.tree, { left: 34, top: 112 }]}><View style={styles.trunk} /><View style={styles.crown} /></View>
          <View style={styles.bench}><View style={styles.benchSeat} /><View style={styles.benchLegs} /></View>
          {[0, 1, 2].map(i => <View key={`b${i}`} style={[styles.bush, { left: 70 + i * 78, top: 245 + (i % 2) * 15 }]} />)}
          {[0, 1, 2, 3].map(i => <View key={`r${i}`} style={[styles.rock, { left: 38 + i * 68, top: 326 - (i % 2) * 18 }]} />)}
          <Image source={lola.source} resizeMode="contain" style={styles.lola} accessibilityLabel={lola.label} />
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: dayPart.tint }]} />
        </View>
        <View style={styles.panel}>
          <Text style={[styles.panelTitle, { fontFamily: ff.semibold }]}>A place that waits</Text>
          <Text style={[styles.panelText, { fontFamily: ff.regular }]}>{season.note} It is {dayPart.name}, the weather is {weather}, and Lola is nearby. No streaks, no timers, no chores.</Text>
          <View style={styles.controls}>
            <Pressable style={styles.chip} onPress={() => move(-0.5, 0)}><Text style={styles.chipText}>look left</Text></Pressable>
            <Pressable style={styles.chip} onPress={() => move(0.5, 0)}><Text style={styles.chipText}>look right</Text></Pressable>
            <Pressable style={styles.chip} onPress={() => move(0, -0.5)}><Text style={styles.chipText}>look up</Text></Pressable>
            <Pressable style={styles.chip} onPress={() => move(0, 0.5)}><Text style={styles.chipText}>look down</Text></Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg }, back: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }, title: { color: Colors.text, fontSize: FontSizes.lg }, scroll: { padding: Spacing.lg, gap: Spacing.lg },
  garden: { height: 420, borderRadius: Radius.xl, overflow: 'hidden', borderWidth: 1, borderColor: Colors.borderLight }, ground: { position: 'absolute', left: -40, right: -40, bottom: -40, height: 220, borderTopLeftRadius: 180, borderTopRightRadius: 180 }, sun: { position: 'absolute', right: 38, top: 34, width: 52, height: 52, borderRadius: 26, backgroundColor: '#E8C982' }, moon: { backgroundColor: '#D9DEE8' }, cloud: { position: 'absolute', left: 75, top: 54, width: 110, height: 34, borderRadius: 20, backgroundColor: '#D7DBD380' }, rain: { position: 'absolute', top: 78, width: 2, height: 44, backgroundColor: '#C8D7E088', transform: [{ rotate: '12deg' }] }, tree: { position: 'absolute', alignItems: 'center' }, trunk: { width: 24, height: 80, backgroundColor: '#6B4F3A', borderRadius: 12, top: 65 }, crown: { position: 'absolute', width: 105, height: 95, borderRadius: 52, backgroundColor: Colors.primaryLight }, bench: { position: 'absolute', left: 148, top: 258 }, benchSeat: { width: 130, height: 24, borderRadius: 8, backgroundColor: '#7B5C43' }, benchLegs: { width: 110, height: 32, borderLeftWidth: 8, borderRightWidth: 8, borderColor: '#624734', marginLeft: 10 }, bush: { position: 'absolute', width: 58, height: 38, borderRadius: 28, backgroundColor: '#6D875F' }, rock: { position: 'absolute', width: 36, height: 22, borderRadius: 18, backgroundColor: '#8B8D86' }, lola: { position: 'absolute', right: 34, bottom: 48, width: 112, height: 132 }, panel: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.md, borderWidth: 1, borderColor: Colors.border }, panelTitle: { color: Colors.text, fontSize: FontSizes.md }, panelText: { color: Colors.textMuted, fontSize: FontSizes.sm, lineHeight: 22 }, controls: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }, chip: { borderWidth: 1, borderColor: Colors.borderLight, borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 8 }, chipText: { color: Colors.textSecondary },
});
