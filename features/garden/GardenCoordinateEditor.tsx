import React, { useMemo, useRef, useState } from 'react';
import { PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { WorldGeometry } from './GardenCanvas';
import {
  EXCLUSIONS,
  FIXED_SLOTS,
  LOLA_DEFAULT_SLOT,
  Rect,
  ZONES,
} from './gardenLayout';

// Dev-only visual mapping tool. It renders INSIDE the world container (which is
// pinned to the fit view — zoom 1, no pan — while the editor is open), so every
// screen pixel maps cleanly to a normalised coordinate. Use it to read off the
// hand-illustrated garden instead of guessing coordinates in code.
//
// • tap the garden      → shows normalised x / y at that point
// • drag the ◆ marker    → move a test asset; its x / y / width read out live
// • toggles              → grid, zones, exclusions, fixed slots, collision boxes
// • Copy                 → copies the marker's { x, y, width } to the clipboard

function rectStyle(rect: Rect, geom: WorldGeometry) {
  return {
    position: 'absolute' as const,
    left: rect.xMin * geom.width,
    top: rect.yMin * geom.height,
    width: (rect.xMax - rect.xMin) * geom.width,
    height: (rect.yMax - rect.yMin) * geom.height,
  };
}

async function copyToClipboard(text: string) {
  try {
    // Lazy require so a missing module never crashes the app.
    const Clipboard = require('expo-clipboard');
    await Clipboard.setStringAsync(text);
  } catch {
    // no-op — the value is also visible on-screen and logged
  }
  // eslint-disable-next-line no-console
  console.log('[garden] placement', text);
}

type Props = { geom: WorldGeometry };

export function GardenCoordinateEditor({ geom }: Props) {
  const [showGrid, setShowGrid] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [showExclusions, setShowExclusions] = useState(true);
  const [showSlots, setShowSlots] = useState(true);
  const [showBoxes, setShowBoxes] = useState(false);
  const [tap, setTap] = useState<{ x: number; y: number } | null>(null);
  const [marker, setMarker] = useState({ x: 0.5, y: 0.7, width: 0.13 });
  const markerStart = useRef(marker);

  const w = geom.width;
  const h = geom.height;

  const dragResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          markerStart.current = marker;
        },
        onPanResponderMove: (_e, g) => {
          setMarker(m => ({
            ...m,
            x: Math.max(0, Math.min(1, markerStart.current.x + g.dx / w)),
            y: Math.max(0, Math.min(1, markerStart.current.y + g.dy / h)),
          }));
        },
      }),
    [marker, w, h]
  );

  const slots = useMemo(() => {
    const entries = Object.entries(FIXED_SLOTS).map(([id, slot]) => ({ id, ...slot! }));
    entries.push({ id: 'lolaDefault', ...LOLA_DEFAULT_SLOT });
    return entries;
  }, []);

  const grid = useMemo(() => {
    if (!showGrid) return null;
    const lines: React.ReactNode[] = [];
    for (let i = 1; i < 10; i += 1) {
      lines.push(<View key={`v${i}`} style={[styles.gridLine, { left: (i / 10) * w, top: 0, width: 1, height: h }]} />);
      lines.push(<View key={`hz${i}`} style={[styles.gridLine, { top: (i / 10) * h, left: 0, height: 1, width: w }]} />);
    }
    return lines;
  }, [showGrid, w, h]);

  const markerBox = 0.13; // representative asset size for the collision preview

  return (
    <>
      {/* Tap-catcher — reports the normalised coordinate under a tap. */}
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={e => {
          const { locationX, locationY } = e.nativeEvent;
          setTap({ x: locationX / w, y: locationY / h });
        }}
      />

      {showGrid ? grid : null}

      {showZones
        ? ZONES.map(z => (
            <View key={z.id} pointerEvents="none" style={[rectStyle(z.rect, geom), styles.zone]}>
              <Text style={styles.rectLabel}>{z.id}</Text>
            </View>
          ))
        : null}

      {showExclusions
        ? EXCLUSIONS.map(ex => (
            <View key={ex.id} pointerEvents="none" style={[rectStyle(ex.rect, geom), styles.exclusion]}>
              <Text style={styles.rectLabel}>⊘ {ex.id}</Text>
            </View>
          ))
        : null}

      {showSlots
        ? slots.map(s => (
            <View
              key={s.id}
              pointerEvents="none"
              style={[styles.slotDot, { left: s.x * w - 4, top: s.y * h - 4 }]}
            >
              <Text style={styles.slotLabel}>{s.id.replace(/^lola/, '')}</Text>
            </View>
          ))
        : null}

      {/* Tap crosshair + readout. */}
      {tap ? (
        <View pointerEvents="none" style={[styles.crosshair, { left: tap.x * w - 6, top: tap.y * h - 6 }]}>
          <Text style={styles.crosshairText}>
            {tap.x.toFixed(3)}, {tap.y.toFixed(3)}
          </Text>
        </View>
      ) : null}

      {/* Draggable test marker + optional collision box. */}
      {showBoxes ? (
        <View
          pointerEvents="none"
          style={[
            styles.collisionBox,
            {
              left: (marker.x - markerBox / 2) * w,
              top: (marker.y - markerBox) * h,
              width: markerBox * w,
              height: markerBox * h,
            },
          ]}
        />
      ) : null}
      <View {...dragResponder.panHandlers} style={[styles.marker, { left: marker.x * w - 16, top: marker.y * h - 16 }]}>
        <Text style={styles.markerText}>◆</Text>
      </View>

      {/* Controls — pinned to the world's top-left (zoom is 1 while editing). */}
      <View style={styles.panel} pointerEvents="box-none">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toggleRow}>
          <Toggle label="grid" on={showGrid} onPress={() => setShowGrid(v => !v)} />
          <Toggle label="zones" on={showZones} onPress={() => setShowZones(v => !v)} />
          <Toggle label="excl" on={showExclusions} onPress={() => setShowExclusions(v => !v)} />
          <Toggle label="slots" on={showSlots} onPress={() => setShowSlots(v => !v)} />
          <Toggle label="box" on={showBoxes} onPress={() => setShowBoxes(v => !v)} />
        </ScrollView>
        <View style={styles.readoutRow}>
          <Text style={styles.readout}>
            x {marker.x.toFixed(3)}  y {marker.y.toFixed(3)}  w {marker.width.toFixed(3)}
          </Text>
          <Pressable style={styles.wBtn} onPress={() => setMarker(m => ({ ...m, width: Math.max(0.02, m.width - 0.01) }))}>
            <Text style={styles.wBtnText}>w−</Text>
          </Pressable>
          <Pressable style={styles.wBtn} onPress={() => setMarker(m => ({ ...m, width: Math.min(0.6, m.width + 0.01) }))}>
            <Text style={styles.wBtnText}>w+</Text>
          </Pressable>
          <Pressable
            style={styles.copyBtn}
            onPress={() => copyToClipboard(`{ x: ${marker.x.toFixed(3)}, y: ${marker.y.toFixed(3)}, width: ${marker.width.toFixed(3)}, anchor: ANCHOR.bottomCenter }`)}
          >
            <Text style={styles.copyBtnText}>copy</Text>
          </Pressable>
        </View>
      </View>
    </>
  );
}

function Toggle({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.toggle, on && styles.toggleOn]} onPress={onPress}>
      <Text style={[styles.toggleText, on && styles.toggleTextOn]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  gridLine: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.12)' },
  zone: { borderWidth: 1, borderColor: 'rgba(120,220,150,0.7)', backgroundColor: 'rgba(120,220,150,0.12)' },
  exclusion: { borderWidth: 1, borderColor: 'rgba(230,90,90,0.8)', backgroundColor: 'rgba(230,90,90,0.14)' },
  rectLabel: { color: '#fff', fontSize: 8, padding: 1 },
  slotDot: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: '#8ab4ff', alignItems: 'center' },
  slotLabel: { position: 'absolute', top: 8, fontSize: 7, color: '#8ab4ff', width: 80 },
  crosshair: { position: 'absolute', width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#ffd166' },
  crosshairText: { position: 'absolute', top: 12, left: 12, width: 90, fontSize: 10, color: '#ffd166' },
  collisionBox: { position: 'absolute', borderWidth: 1, borderColor: 'rgba(255,209,102,0.9)', backgroundColor: 'rgba(255,209,102,0.12)' },
  marker: { position: 'absolute', width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  markerText: { color: '#ffd166', fontSize: 22, textShadowColor: '#000', textShadowRadius: 3 },
  panel: { position: 'absolute', left: 6, top: 6, gap: 4 },
  toggleRow: { flexDirection: 'row', gap: 4 },
  toggle: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.55)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  toggleOn: { backgroundColor: 'rgba(138,180,255,0.85)', borderColor: '#8ab4ff' },
  toggleText: { color: '#ddd', fontSize: 10 },
  toggleTextOn: { color: '#0b0b0b' },
  readoutRow: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  readout: { color: '#fff', fontSize: 10 },
  wBtn: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.15)' },
  wBtnText: { color: '#fff', fontSize: 10 },
  copyBtn: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 5, backgroundColor: '#ffd166' },
  copyBtnText: { color: '#0b0b0b', fontSize: 10, fontWeight: '600' },
});
