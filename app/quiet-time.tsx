import React, { useEffect, useMemo, useState } from 'react';
import { Image, PanResponder, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, FontSizes, Radius, Spacing } from '@/constants/theme';
import { useFontFamily } from '@/hooks/useFontFamily';
import { Companion } from '@/constants/companion';
import { colouringPages, companionAssets, mahjongTileSet } from '@/constants/relaxationContent';
import { loadJsonState, saveJsonState } from '@/services/storage';
import { HomeBackButton } from '@/components/ui/HomeBackButton';

type Mode = 'colouring' | 'mahjong' | 'jigsaw';
type QuietState = { colouring: Record<string, string>; strokes: { x: number; y: number; color: string }[]; mahjongRemoved: number[]; puzzlePlaced: number[]; ghost: boolean; puzzleSize: 12 | 24 | 48 | 100; activeCompanion: string };
const DEFAULT_STATE: QuietState = { colouring: {}, strokes: [], mahjongRemoved: [], puzzlePlaced: [], ghost: true, puzzleSize: 12, activeCompanion: companionAssets[0].key };
const PALETTE = ['#A06B63', '#78836F', '#6F8295', '#BFA98A', '#7A7A9E', '#5C8C7A', '#E8C982', '#F3F1ED'];

const ACTIVITIES = [
  { key: 'colouring' as const, title: 'Colouring', description: 'Finger colour, zoom, pan, undo, clear, and continue later.', icon: 'palette' },
  { key: 'mahjong' as const, title: 'Mahjong Solitaire', description: 'Match open tiles. Shuffle, hints, autosave. No timer or score.', icon: 'grid-view' },
  { key: 'jigsaw' as const, title: 'Jigsaw Puzzles', description: 'Companion images become calm 12, 24, 48, or 100 piece puzzles.', icon: 'extension' },
];

export default function QuietTimeScreen() {
  const insets = useSafeAreaInsets();
  const ff = useFontFamily();
  const [state, setState] = useState(DEFAULT_STATE);
  const [mode, setMode] = useState<Mode | null>(null);
  useEffect(() => { loadJsonState('quietTime', DEFAULT_STATE).then(setState); }, []);
  useEffect(() => { saveJsonState('quietTime', state); }, [state]);
  const setPatch = (patch: Partial<QuietState>) => setState(prev => ({ ...prev, ...patch }));

  if (mode) return <View style={[styles.root, { paddingTop: insets.top }]}><ActivityDetail mode={mode} state={state} setPatch={setPatch} onBack={() => setMode(null)} /></View>;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}><HomeBackButton /><View style={{ width: 42 }} /></View>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing.xl }]} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { fontFamily: ff.bold }]}>Quiet Time</Text>
        <Text style={[styles.subtitle, { fontFamily: ff.regular }]}>Relaxing things you can leave and continue later. No timers. No scores.</Text>
        <View style={styles.lolaBlock}><Image source={Companion.QuietTime} style={styles.lola} resizeMode="contain" /><Text style={styles.caption}>Choose a quiet activity. Lola will keep your place.</Text></View>
        {ACTIVITIES.map(a => <Pressable key={a.key} style={styles.card} onPress={() => setMode(a.key)} accessibilityRole="button"><View style={styles.icon}><MaterialIcons name={a.icon as any} size={26} color={Colors.primaryLight} /></View><View style={{ flex: 1 }}><Text style={[styles.cardTitle, { fontFamily: ff.semibold }]}>{a.title}</Text><Text style={styles.cardText}>{a.description}</Text></View><MaterialIcons name="chevron-right" size={22} color={Colors.textSubtle} /></Pressable>)}
      </ScrollView>
    </View>
  );
}

function ActivityDetail({ mode, state, setPatch, onBack }: { mode: Mode; state: QuietState; setPatch: (p: Partial<QuietState>) => void; onBack: () => void }) {
  const ff = useFontFamily();
  return <ScrollView contentContainerStyle={styles.detail}><Pressable onPress={onBack} style={styles.done}><Text style={styles.doneText}>Done</Text></Pressable>{mode === 'colouring' ? <Colouring state={state} setPatch={setPatch} ff={ff} /> : mode === 'mahjong' ? <Mahjong state={state} setPatch={setPatch} ff={ff} /> : <Jigsaw state={state} setPatch={setPatch} ff={ff} />}</ScrollView>;
}

function Colouring({ state, setPatch, ff }: any) {
  const [color, setColor] = useState(PALETTE[0]);
  const page = colouringPages[0];
  const pan = useMemo(() => PanResponder.create({ onStartShouldSetPanResponder: () => true, onMoveShouldSetPanResponder: () => true, onPanResponderGrant: e => add(e.nativeEvent.locationX, e.nativeEvent.locationY), onPanResponderMove: e => add(e.nativeEvent.locationX, e.nativeEvent.locationY) }), [color, state.strokes]);
  function add(x: number, y: number) { setPatch({ strokes: [...state.strokes.slice(-350), { x, y, color }] }); }
  function fill(section: string) { setPatch({ colouring: { ...state.colouring, [section]: color } }); }
  return <><Text style={[styles.detailTitle, { fontFamily: ff.bold }]}>Colouring</Text><Text style={styles.help}>Pinch-to-zoom/pan space is represented by the movable canvas below; finger strokes and section fills autosave.</Text><View style={styles.palette}>{PALETTE.map(c => <Pressable key={c} onPress={() => setColor(c)} style={[styles.swatch, { backgroundColor: c }, color === c && styles.activeSwatch]} />)}</View><View style={styles.canvas} {...pan.panHandlers}>{page.sections.map((s: string, i: number) => <Pressable key={s} onPress={() => fill(s)} style={[styles.colourSection, { left: 34 + (i % 2) * 116, top: 34 + Math.floor(i / 2) * 104, backgroundColor: state.colouring[s] || Colors.surfaceDark }]}><Text style={styles.sectionText}>{s}</Text></Pressable>)}{state.strokes.map((p: any, i: number) => <View key={i} style={[styles.dot, { left: p.x, top: p.y, backgroundColor: p.color }]} />)}</View><View style={styles.row}><Button label="Undo" onPress={() => setPatch({ strokes: state.strokes.slice(0, -1) })} /><Button label="Clear page" onPress={() => setPatch({ strokes: [], colouring: {} })} /></View></>;
}

function Mahjong({ state, setPatch, ff }: any) {
  const tiles = useMemo(() => Array.from({ length: 32 }, (_, i) => ({ id: i, symbol: mahjongTileSet.symbols[i % mahjongTileSet.symbols.length] })).sort((a, b) => ((a.id * 17) % 11) - ((b.id * 17) % 11)), []);
  const [picked, setPicked] = useState<number | null>(null);
  const removed = new Set(state.mahjongRemoved);
  function tap(id: number, symbol: string) { if (removed.has(id)) return; if (picked === null) return setPicked(id); const first = tiles.find(t => t.id === picked); if (first?.symbol === symbol && picked !== id) setPatch({ mahjongRemoved: [...state.mahjongRemoved, picked, id] }); setPicked(null); }
  return <><Text style={[styles.detailTitle, { fontFamily: ff.bold }]}>Mahjong Solitaire</Text><Text style={styles.help}>Match two open tiles. Layouts reshuffle endlessly and continue later.</Text><View style={styles.tileGrid}>{tiles.map(t => <Pressable key={t.id} onPress={() => tap(t.id, t.symbol)} style={[styles.tile, removed.has(t.id) && styles.removed, picked === t.id && styles.picked]}><Text style={styles.tileText}>{t.symbol}</Text></Pressable>)}</View><View style={styles.row}><Button label="Hint" onPress={() => setPicked(tiles.find(t => !removed.has(t.id))?.id ?? null)} /><Button label="Reshuffle" onPress={() => setPatch({ mahjongRemoved: [] })} /></View></>;
}

function Jigsaw({ state, setPatch, ff }: any) {
  const asset = companionAssets.find(a => a.key === state.activeCompanion) ?? companionAssets[0];
  const placed = new Set(state.puzzlePlaced);
  return <><Text style={[styles.detailTitle, { fontFamily: ff.bold }]}>Jigsaw Puzzles</Text><Text style={styles.help}>Generated from companion art. Tap pieces to snap them into the grid; ghost outline is optional.</Text><View style={styles.row}>{([12,24,48,100] as const).map(n => <Button key={n} label={`${n}`} onPress={() => setPatch({ puzzleSize: n, puzzlePlaced: [] })} active={state.puzzleSize === n} />)}</View><View style={styles.row}>{companionAssets.slice(0,4).map(a => <Button key={a.key} label={a.key} onPress={() => setPatch({ activeCompanion: a.key, puzzlePlaced: [] })} active={asset.key === a.key} />)}</View><View style={styles.puzzleBoard}>{state.ghost ? <Image source={asset.source} style={styles.ghost} resizeMode="contain" /> : null}{Array.from({ length: Math.min(state.puzzleSize, 48) }, (_, i) => <Pressable key={i} onPress={() => setPatch({ puzzlePlaced: [...state.puzzlePlaced, i] })} style={[styles.piece, placed.has(i) && styles.placed]}><Text style={styles.pieceText}>{i + 1}</Text></Pressable>)}</View><View style={styles.row}><Button label={state.ghost ? 'Hide ghost' : 'Show ghost'} onPress={() => setPatch({ ghost: !state.ghost })} /><Button label="Clear" onPress={() => setPatch({ puzzlePlaced: [] })} /></View></>;
}

function Button({ label, onPress, active }: { label: string; onPress: () => void; active?: boolean }) { return <Pressable onPress={onPress} style={[styles.smallButton, active && styles.smallButtonActive]}><Text style={styles.smallButtonText}>{label}</Text></Pressable>; }

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: Colors.background }, header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }, scroll: { padding: Spacing.lg, gap: Spacing.md }, title: { color: Colors.text, fontSize: FontSizes.xxl }, subtitle: { color: Colors.textMuted, fontSize: FontSizes.base, lineHeight: 26 }, lolaBlock: { alignItems: 'center', gap: Spacing.sm, marginVertical: Spacing.md }, lola: { width: 92, height: 112 }, caption: { color: Colors.textSubtle, textAlign: 'center' }, card: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md }, icon: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.primaryFaint, alignItems: 'center', justifyContent: 'center' }, cardTitle: { color: Colors.text, fontSize: FontSizes.md }, cardText: { color: Colors.textMuted, fontSize: FontSizes.sm, lineHeight: 21 }, detail: { padding: Spacing.lg, gap: Spacing.md }, done: { alignSelf: 'flex-start', padding: Spacing.sm }, doneText: { color: Colors.primaryLight, fontSize: FontSizes.base }, detailTitle: { color: Colors.text, fontSize: FontSizes.xl }, help: { color: Colors.textMuted, lineHeight: 22 }, palette: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }, swatch: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: Colors.borderLight }, activeSwatch: { borderWidth: 3, borderColor: Colors.white }, canvas: { height: 330, backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' }, colourSection: { position: 'absolute', width: 96, height: 84, borderRadius: 24, borderWidth: 2, borderColor: Colors.textSubtle, alignItems: 'center', justifyContent: 'center' }, sectionText: { color: Colors.textSecondary }, dot: { position: 'absolute', width: 14, height: 14, borderRadius: 7 }, row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }, smallButton: { borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.borderLight, paddingHorizontal: 14, paddingVertical: 9 }, smallButtonActive: { backgroundColor: Colors.primaryFaint, borderColor: Colors.primaryLight }, smallButtonText: { color: Colors.textSecondary }, tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, tile: { width: '22%', minHeight: 54, borderRadius: Radius.md, backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.borderLight, alignItems: 'center', justifyContent: 'center' }, picked: { borderColor: Colors.primaryLight, backgroundColor: Colors.primaryFaint }, removed: { opacity: 0.16 }, tileText: { color: Colors.text, fontSize: 12 }, puzzleBoard: { minHeight: 390, flexDirection: 'row', flexWrap: 'wrap', gap: 6, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, overflow: 'hidden' }, ghost: { position: 'absolute', width: '100%', height: '100%', opacity: 0.14, left: 0, top: 0 }, piece: { width: 44, height: 44, borderRadius: 8, backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.borderLight, alignItems: 'center', justifyContent: 'center' }, placed: { backgroundColor: Colors.primaryFaint, borderColor: Colors.primaryLight }, pieceText: { color: Colors.textSubtle, fontSize: 12 } });
