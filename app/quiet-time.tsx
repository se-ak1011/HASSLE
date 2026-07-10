import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, PanResponder, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { ClipPath, Defs, Image as SvgImage, Path, Rect } from 'react-native-svg';
import { Text } from '@/components/ui/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, FontSizes, Radius, Spacing } from '@/constants/theme';
import { useFontFamily } from '@/hooks/useFontFamily';
import { Companion } from '@/constants/companion';
import { companionAssets, mahjongTileSet } from '@/constants/relaxationContent';
import { loadJsonState, saveJsonState } from '@/services/storage';
import { HomeBackButton } from '@/components/ui/HomeBackButton';

type Mode = 'colouring' | 'mahjong' | 'jigsaw';
type Stroke = { color: string; width: number; points: { x: number; y: number }[]; eraser?: boolean };
type MahjongTile = { id: string; symbol: string; x: number; y: number; z: number; removed?: boolean };
type JigsawPiece = { id: number; correctX: number; correctY: number; x: number; y: number; placed: boolean };
type QuietState = { strokes: Stroke[]; strokesByPage?: Record<string, Stroke[]>; colouringPage: string; mahjongTiles: MahjongTile[]; puzzlePieces: JigsawPiece[]; ghost: boolean; puzzleSize: 12 | 24; activeCompanion: string };
const DEFAULT_STATE: QuietState = { strokes: [], colouringPage: 'colouring_1', mahjongTiles: [], puzzlePieces: [], ghost: true, puzzleSize: 12, activeCompanion: companionAssets[0].key };
const PALETTE = ['#A06B63', '#78836F', '#6F8295', '#BFA98A', '#7A7A9E', '#5C8C7A', '#E8C982', '#F3F1ED'];
const BOARD = 320;
const COLOURING_TEMPLATES = [
  { key: 'colouring_1', title: 'Floral Skull', source: require('../assets/colouring/colouring_1.png') },
  { key: 'colouring_2', title: 'Music Skull', source: require('../assets/colouring/colouring_2.png') },
  { key: 'colouring_3', title: 'Catrina Roses', source: require('../assets/colouring/colouring_3.png') },
  { key: 'colouring_4', title: 'Sugar Skull', source: require('../assets/colouring/colouring_4.png') },
  { key: 'colouring_5', title: 'Catrina Portrait', source: require('../assets/colouring/colouring_5.png') },
];


const MAHJONG_ASSETS = {
  alarm_clock: require('../assets/mahjong/alarm_clock.png'),
  backpack: require('../assets/mahjong/backpack.png'),
  blanket: require('../assets/mahjong/blanket.png'),
  book: require('../assets/mahjong/book.png'),
  candle: require('../assets/mahjong/candle.png'),
  cloud: require('../assets/mahjong/cloud.png'),
  coffee_mug: require('../assets/mahjong/coffee_mug.png'),
  cup: require('../assets/mahjong/cup.png'),
  feather: require('../assets/mahjong/feather.png'),
  flower: require('../assets/mahjong/flower.png'),
  headphones: require('../assets/mahjong/headphones.png'),
  hood: require('../assets/mahjong/hood.png'),
  journal: require('../assets/mahjong/journal.png'),
  lantern: require('../assets/mahjong/lantern.png'),
  leaf: require('../assets/mahjong/leaf.png'),
  medicine_bottle: require('../assets/mahjong/medicine_bottle.png'),
  moon: require('../assets/mahjong/moon.png'),
  notebook: require('../assets/mahjong/notebook.png'),
  pebble: require('../assets/mahjong/pebble.png'),
  pencil: require('../assets/mahjong/pencil.png'),
  pill: require('../assets/mahjong/pill.png'),
  plant: require('../assets/mahjong/plant.png'),
  rain_cloud: require('../assets/mahjong/rain_cloud.png'),
  shell: require('../assets/mahjong/shell.png'),
  skull: require('../assets/mahjong/skull.png'),
  slippers: require('../assets/mahjong/slippers.png'),
  snowflake: require('../assets/mahjong/snowflake.png'),
  sun: require('../assets/mahjong/sun.png'),
  teapot: require('../assets/mahjong/teapot.png'),
  tree: require('../assets/mahjong/tree.png'),
  water_bottle: require('../assets/mahjong/water_bottle.png'),
  wooden_spoon: require('../assets/mahjong/wooden_spoon.png'),
};
const MAHJONG_LEGACY_ASSET_KEYS = { rain: 'rain_cloud', star: 'sun', stone: 'pebble' } as const;

type MahjongAssetKey = keyof typeof MAHJONG_ASSETS;
function mahjongAssetKey(symbol: string): MahjongAssetKey {
  return (symbol in MAHJONG_ASSETS ? symbol : MAHJONG_LEGACY_ASSET_KEYS[symbol as keyof typeof MAHJONG_LEGACY_ASSET_KEYS] ?? 'leaf') as MahjongAssetKey;
}
function mahjongAssetLabel(assetKey: MahjongAssetKey) { return assetKey.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '); }

const ACTIVITIES = [
  { key: 'colouring' as const, title: 'Colouring', description: 'Draw directly on line art. Pinch/drag to move the page, undo, clear, and continue later.', icon: 'palette' },
  { key: 'mahjong' as const, title: 'Mahjong Solitaire', description: 'Match only free tiles, use hints, reshuffle a playable board, and clear every pair.', icon: 'grid-view' },
  { key: 'jigsaw' as const, title: 'Jigsaw Puzzles', description: 'Drag shuffled companion-image pieces until they snap into place.', icon: 'extension' },
];

function shuffle<T>(items: T[]) { return [...items].sort(() => Math.random() - 0.5); }
function makeMahjongBoard(): MahjongTile[] {
  const pairCount = 20;
  const symbols = shuffle(Array.from({ length: pairCount * 2 }, (_, i) => mahjongTileSet.symbols[Math.floor(i / 2) % mahjongTileSet.symbols.length]));
  const tiles: MahjongTile[] = [];
  let i = 0;
  for (let y = 0; y < 4; y++) for (let x = 0; x < 8; x++) tiles.push({ id: `b-${i}`, symbol: symbols[i++], x, y, z: 0 });
  for (let y = 1; y < 3; y++) for (let x = 2; x < 6; x++) tiles.push({ id: `m-${i}`, symbol: symbols[i++], x, y, z: 1 });
  return findMove(tiles) ? tiles : makeMahjongBoard();
}
function tileBlocked(tile: MahjongTile, tiles: MahjongTile[]) {
  if (tile.removed) return true;
  const active = tiles.filter(t => !t.removed);
  const covered = active.some(t => t.z > tile.z && Math.abs(t.x - tile.x) < 1 && Math.abs(t.y - tile.y) < 1);
  const left = active.some(t => t.z === tile.z && t.y === tile.y && t.x === tile.x - 1);
  const right = active.some(t => t.z === tile.z && t.y === tile.y && t.x === tile.x + 1);
  return covered || (left && right);
}
function findMove(tiles: MahjongTile[]) {
  const free = tiles.filter(t => !tileBlocked(t, tiles));
  for (let i = 0; i < free.length; i++) for (let j = i + 1; j < free.length; j++) if (free[i].symbol === free[j].symbol) return [free[i].id, free[j].id];
  return null;
}
function makePuzzle(size: 12 | 24): JigsawPiece[] {
  const cols = size === 12 ? 4 : 6;
  const rows = size / cols;
  const w = BOARD / cols;
  const h = BOARD / rows;
  const trayCols = size === 12 ? 4 : 6;
  const trayCellW = BOARD / trayCols;
  const trayCellH = h + 28;
  return Array.from({ length: size }, (_, id) => ({
    id,
    correctX: (id % cols) * w,
    correctY: Math.floor(id / cols) * h,
    x: (id % trayCols) * trayCellW + (trayCellW - w) / 2,
    y: BOARD + 34 + Math.floor(id / trayCols) * trayCellH,
    placed: false,
  }));
}

export default function QuietTimeScreen() {
  const insets = useSafeAreaInsets(); const ff = useFontFamily(); const [state, setState] = useState(DEFAULT_STATE); const [mode, setMode] = useState<Mode | null>(null);
  useEffect(() => { loadJsonState('quietTime', DEFAULT_STATE).then(s => setState({ ...s, mahjongTiles: s.mahjongTiles?.length ? s.mahjongTiles : makeMahjongBoard(), puzzlePieces: s.puzzlePieces?.length ? s.puzzlePieces : makePuzzle(s.puzzleSize ?? 12) })); }, []);
  useEffect(() => { saveJsonState('quietTime', state); }, [state]);
  const setPatch = (patch: Partial<QuietState>) => setState(prev => ({ ...prev, ...patch }));
  if (mode) return <View style={[styles.root, { paddingTop: insets.top }]}><ActivityDetail mode={mode} state={state} setPatch={setPatch} onBack={() => setMode(null)} /></View>;
  return <View style={[styles.root, { paddingTop: insets.top }]}><View style={styles.header}><HomeBackButton /><View style={{ width: 42 }} /></View><ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing.xl }]} showsVerticalScrollIndicator={false}><Text style={[styles.title, { fontFamily: ff.bold }]}>Quiet Time</Text><Text style={[styles.subtitle, { fontFamily: ff.regular }]}>Real relaxing activities you can leave and continue later. No timers. No scores.</Text><View style={styles.lolaBlock}><Image source={Companion.QuietTime} style={styles.lola} resizeMode="contain" /><Text style={styles.caption}>Lola will keep your place.</Text></View>{ACTIVITIES.map(a => <Pressable key={a.key} style={styles.card} onPress={() => setMode(a.key)} accessibilityRole="button"><View style={styles.icon}><MaterialIcons name={a.icon as any} size={26} color={Colors.primaryLight} /></View><View style={{ flex: 1 }}><Text style={[styles.cardTitle, { fontFamily: ff.semibold }]}>{a.title}</Text><Text style={styles.cardText}>{a.description}</Text></View><MaterialIcons name="chevron-right" size={22} color={Colors.textSubtle} /></Pressable>)}</ScrollView></View>;
}
function ActivityDetail({ mode, state, setPatch, onBack }: { mode: Mode; state: QuietState; setPatch: (p: Partial<QuietState>) => void; onBack: () => void }) { const ff = useFontFamily(); const [scrollEnabled, setScrollEnabled] = useState(true); return <ScrollView scrollEnabled={scrollEnabled} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.detail}><Pressable onPress={onBack} style={styles.done}><Text style={styles.doneText}>Done</Text></Pressable>{mode === 'colouring' ? <Colouring state={state} setPatch={setPatch} ff={ff} setScrollEnabled={setScrollEnabled} /> : mode === 'mahjong' ? <Mahjong state={state} setPatch={setPatch} ff={ff} /> : <Jigsaw state={state} setPatch={setPatch} ff={ff} setScrollEnabled={setScrollEnabled} />}</ScrollView>; }

function smoothPath(points: { x: number; y: number }[]) {
  if (points.length < 2) return points[0] ? `M${points[0].x} ${points[0].y}` : '';
  let d = `M${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const mid = { x: (points[i].x + points[i + 1].x) / 2, y: (points[i].y + points[i + 1].y) / 2 };
    d += ` Q${points[i].x} ${points[i].y} ${mid.x} ${mid.y}`;
  }
  const last = points[points.length - 1];
  return `${d} L${last.x} ${last.y}`;
}
const PAPER_COLOR = '#F6F1E8';
const MIN_CANVAS_SCALE = 0.8;
const MAX_CANVAS_SCALE = 4;

function clamp(value: number, min: number, max: number) { return Math.max(min, Math.min(max, value)); }
function distance(a: { x: number; y: number }, b: { x: number; y: number }) { return Math.hypot(a.x - b.x, a.y - b.y); }
function midpoint(a: { x: number; y: number }, b: { x: number; y: number }) { return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; }
function touchPoint(touch: any, fallback: any) { return { x: touch?.locationX ?? fallback.locationX ?? 0, y: touch?.locationY ?? fallback.locationY ?? 0 }; }
function clampOffset(offset: { x: number; y: number }, scale: number) {
  const slack = BOARD * scale * 0.45;
  return { x: clamp(offset.x, -slack, slack), y: clamp(offset.y, -slack, slack) };
}
function interpolatePoints(from: { x: number; y: number }, to: { x: number; y: number }) {
  const gap = distance(from, to);
  const steps = Math.max(1, Math.ceil(gap / 2.2));
  return Array.from({ length: steps }, (_, i) => ({ x: from.x + ((to.x - from.x) * (i + 1)) / steps, y: from.y + ((to.y - from.y) * (i + 1)) / steps }));
}

function Colouring({ state, setPatch, ff, setScrollEnabled }: any) {
  const [color, setColor] = useState(PALETTE[0]);
  const [brushSize, setBrushSize] = useState(9);
  const [eraser, setEraser] = useState(false);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [redoByPage, setRedoByPage] = useState<Record<string, Stroke[]>>({});
  const mode = useRef<'idle' | 'draw' | 'pan'>('idle');
  const start = useRef({ x: 0, y: 0 });
  const base = useRef(offset);
  const pinch = useRef({ distance: 0, scale: 1, offset: { x: 0, y: 0 }, focal: { x: 0, y: 0 }, content: { x: 0, y: 0 } });
  const activeStroke = useRef<Stroke | null>(null);
  const activeStrokes = useRef<Stroke[]>([]);
  const selectedTemplate = COLOURING_TEMPLATES.find(page => page.key === state.colouringPage) ?? COLOURING_TEMPLATES[0];
  const pageKey = selectedTemplate.key;
  const pageStrokes: Stroke[] = state.strokesByPage?.[pageKey] ?? (state.colouringPage === pageKey ? state.strokes : []);

  useEffect(() => { activeStrokes.current = pageStrokes; }, [pageKey, pageStrokes]);

  function commitStrokes(next: Stroke[]) {
    activeStrokes.current = next;
    setPatch({ strokes: next, strokesByPage: { ...(state.strokesByPage ?? {}), [pageKey]: next } });
  }

  function toPage(x: number, y: number) {
    return { x: clamp((x - offset.x) / scale, 0, BOARD), y: clamp((y - offset.y) / scale, 0, BOARD) };
  }

  function beginStroke(point: { x: number; y: number }) {
    const stroke: Stroke = { color: eraser ? PAPER_COLOR : color, width: eraser ? brushSize * 1.6 : brushSize, points: [point], eraser };
    activeStroke.current = stroke;
    commitStrokes([...activeStrokes.current, stroke]);
    setRedoByPage(prev => ({ ...prev, [pageKey]: [] }));
  }

  function pushPoint(point: { x: number; y: number }) {
    const current = activeStroke.current;
    if (!current) return;
    const last = current.points[current.points.length - 1];
    if (last && distance(last, point) < 0.8) return;
    const additions = last ? interpolatePoints(last, point) : [point];
    const stroke = { ...current, points: [...current.points, ...additions] };
    activeStroke.current = stroke;
    const next = [...activeStrokes.current.slice(0, -1), stroke];
    commitStrokes(next);
  }

  function handleUndo() {
    if (!pageStrokes.length) return;
    const removed = pageStrokes[pageStrokes.length - 1];
    commitStrokes(pageStrokes.slice(0, -1));
    setRedoByPage(prev => ({ ...prev, [pageKey]: [...(prev[pageKey] ?? []), removed] }));
  }

  function handleRedo() {
    const redo = redoByPage[pageKey] ?? [];
    if (!redo.length) return;
    const restored = redo[redo.length - 1];
    commitStrokes([...pageStrokes, restored]);
    setRedoByPage(prev => ({ ...prev, [pageKey]: redo.slice(0, -1) }));
  }

  function clearPage() {
    commitStrokes([]);
    setRedoByPage(prev => ({ ...prev, [pageKey]: [] }));
  }

  function resetView() {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }

  const pan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onStartShouldSetPanResponderCapture: () => true,
    onMoveShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponderCapture: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: e => {
      setScrollEnabled?.(false);
      const touches = e.nativeEvent.touches ?? [];
      if (touches.length > 1) {
        mode.current = 'pan';
        const a = touchPoint(touches[0], e.nativeEvent);
        const b = touchPoint(touches[1], e.nativeEvent);
        const focal = midpoint(a, b);
        start.current = focal;
        base.current = offset;
        pinch.current = { distance: Math.max(1, distance(a, b)), scale, offset, focal, content: toPage(focal.x, focal.y) };
        return;
      }
      mode.current = 'draw';
      beginStroke(toPage(e.nativeEvent.locationX, e.nativeEvent.locationY));
    },
    onPanResponderMove: e => {
      const touches = e.nativeEvent.touches ?? [];
      if (mode.current === 'draw') {
        if (touches.length > 1) return;
        pushPoint(toPage(e.nativeEvent.locationX, e.nativeEvent.locationY));
        return;
      }
      if (mode.current === 'pan' && touches.length > 1) {
        const a = touchPoint(touches[0], e.nativeEvent);
        const b = touchPoint(touches[1], e.nativeEvent);
        const focal = midpoint(a, b);
        const nextScale = clamp(pinch.current.scale * (distance(a, b) / pinch.current.distance), MIN_CANVAS_SCALE, MAX_CANVAS_SCALE);
        const nextOffset = clampOffset({ x: focal.x - pinch.current.content.x * nextScale, y: focal.y - pinch.current.content.y * nextScale }, nextScale);
        setScale(nextScale);
        setOffset(nextOffset);
      }
    },
    onPanResponderRelease: () => { activeStroke.current = null; mode.current = 'idle'; setScrollEnabled?.(true); },
    onPanResponderTerminate: () => { activeStroke.current = null; mode.current = 'idle'; setScrollEnabled?.(true); },
  }), [brushSize, color, eraser, offset, pageKey, pageStrokes, redoByPage, scale, setScrollEnabled, state.strokesByPage]);

  return <><Text style={[styles.detailTitle, { fontFamily: ff.bold }]}>Colouring</Text><Text style={styles.help}>Draw with one finger or stylus. Use two fingers to pan or pinch without interrupting the brush.</Text><View style={styles.templateGrid}>{COLOURING_TEMPLATES.map(page => <Pressable key={page.key} accessibilityRole="button" accessibilityLabel={page.title} style={[styles.templateCard, selectedTemplate.key === page.key && styles.templateCardActive]} onPress={() => { setPatch({ colouringPage: page.key }); resetView(); }}><Image source={page.source} style={styles.templatePreview} resizeMode="contain" /><Text style={styles.templateLabel}>{page.title}</Text></Pressable>)}</View><View style={styles.palette}>{PALETTE.map(c => <Pressable key={c} onPress={() => { setColor(c); setEraser(false); }} style={[styles.swatch, { backgroundColor: c }, !eraser && color === c && styles.activeSwatch]} />)}</View><View style={styles.row}>{[5, 9, 14, 20].map(size => <Button key={size} label={`${size}px`} active={brushSize === size} onPress={() => setBrushSize(size)} />)}<Button label={eraser ? 'Eraser on' : 'Eraser'} active={eraser} onPress={() => setEraser(!eraser)} /><Button label="Reset View" onPress={resetView} /></View><View style={styles.canvas} onTouchStart={() => setScrollEnabled?.(false)} onTouchEnd={() => setScrollEnabled?.(true)} onTouchCancel={() => setScrollEnabled?.(true)} {...pan.panHandlers}><View style={{ transform: [{ translateX: offset.x }, { translateY: offset.y }, { scale }] }}><Svg width={BOARD} height={BOARD} viewBox={`0 0 ${BOARD} ${BOARD}`}><Rect x="0" y="0" width={BOARD} height={BOARD} fill={PAPER_COLOR} /><SvgImage href={selectedTemplate.source} x="0" y="0" width={BOARD} height={BOARD} preserveAspectRatio="xMidYMid meet" opacity={0.16} />{pageStrokes.map((s: Stroke, i: number) => <Path key={i} d={smoothPath(s.points)} fill="none" stroke={s.color} strokeWidth={s.width} strokeLinecap="round" strokeLinejoin="round" opacity={s.eraser ? 1 : 0.82} />)}<SvgImage href={selectedTemplate.source} x="0" y="0" width={BOARD} height={BOARD} preserveAspectRatio="xMidYMid meet" opacity={0.38} /></Svg></View></View><View style={styles.row}><Button label="Undo" onPress={handleUndo} /><Button label="Redo" onPress={handleRedo} /><Button label="Clear page" onPress={clearPage} /></View></>;
}
function Mahjong({ state, setPatch, ff }: any) {
  const [picked, setPicked] = useState<string | null>(null); const [hint, setHint] = useState<string[]>([]); const tiles: MahjongTile[] = state.mahjongTiles?.length ? state.mahjongTiles : makeMahjongBoard(); const active = tiles.filter(t => !t.removed); const won = active.length === 0;
  function tap(tile: MahjongTile) { if (tileBlocked(tile, tiles)) return; if (!picked) return setPicked(tile.id); const first = tiles.find(t => t.id === picked); if (first && first.id !== tile.id && first.symbol === tile.symbol && !tileBlocked(first, tiles)) setPatch({ mahjongTiles: tiles.map(t => t.id === first.id || t.id === tile.id ? { ...t, removed: true } : t) }); setPicked(null); setHint([]); }
  function showHint() { const move = findMove(tiles); setHint(move ?? []); }
  return <><Text style={[styles.detailTitle, { fontFamily: ff.bold }]}>Mahjong Solitaire</Text><Text style={styles.help}>{won ? 'The board is clear. Nothing else is required.' : 'Only tiles with a free left or right side and no tile above can be matched.'}</Text><View style={styles.mahjongBoard}>{tiles.map(t => { const blocked = tileBlocked(t, tiles); const assetKey = mahjongAssetKey(t.symbol); return <Pressable key={t.id} disabled={t.removed} onPress={() => tap(t)} accessibilityLabel={`${mahjongAssetLabel(assetKey)} Mahjong tile`} style={[styles.mahjongTile, { left: 8 + t.x * 38 + t.z * 18, top: 16 + t.y * 54 - t.z * 8, zIndex: t.z + 1 }, t.removed && styles.removed, blocked && styles.blocked, picked === t.id && styles.picked, hint.includes(t.id) && styles.hint]}><Image source={MAHJONG_ASSETS[assetKey]} resizeMode="contain" style={styles.mahjongIcon} /></Pressable>; })}</View><View style={styles.row}><Button label="Hint" onPress={showHint} /><Button label="Reshuffle" onPress={() => { setPicked(null); setHint([]); setPatch({ mahjongTiles: makeMahjongBoard() }); }} /></View></>;
}
function Jigsaw({ state, setPatch, ff, setScrollEnabled }: any) {
  const asset = companionAssets.find(a => a.key === state.activeCompanion) ?? companionAssets[0];
  const pieces: JigsawPiece[] = state.puzzlePieces?.length ? state.puzzlePieces : makePuzzle(state.puzzleSize);
  const cols = state.puzzleSize === 12 ? 4 : 6;
  const rows = state.puzzleSize / cols;
  const w = BOARD / cols;
  const h = BOARD / rows;
  const trayCols = state.puzzleSize === 12 ? 4 : 6;
  const trayRows = Math.ceil(state.puzzleSize / trayCols);
  const puzzleHeight = BOARD + 44 + trayRows * (h + 28);
  const [drag, setDrag] = useState<number | null>(null);

  function update(id: number, x: number, y: number) {
    const snapRadius = Math.max(18, Math.min(w, h) * 0.38);
    setPatch({
      puzzlePieces: pieces.map(q => {
        if (q.id !== id) return q;
        const close = Math.hypot(x - q.correctX, y - q.correctY) <= snapRadius;
        return { ...q, x: close ? q.correctX : clamp(x, 0, BOARD - w), y: close ? q.correctY : clamp(y, BOARD + 8, puzzleHeight - h - 8), placed: close || q.placed };
      }),
    });
  }

  function changeSize(n: 12 | 24) {
    setDrag(null);
    setScrollEnabled(true);
    setPatch({ puzzleSize: n, puzzlePieces: makePuzzle(n) });
  }

  return <><Text style={[styles.detailTitle, { fontFamily: ff.bold }]}>Jigsaw Puzzles</Text><Text style={styles.help}>Drag pieces from the tray into the image area. Pieces snap when they are close to home.</Text><View style={styles.row}>{([12, 24] as const).map(n => <Button key={n} label={`${n} pieces`} active={state.puzzleSize === n} onPress={() => changeSize(n)} />)}<Button label={state.ghost ? 'Hide ghost' : 'Show ghost'} onPress={() => setPatch({ ghost: !state.ghost })} /><Button label="Restart" onPress={() => changeSize(state.puzzleSize)} /></View><View style={[styles.puzzleArea, { height: puzzleHeight }]}>{state.ghost ? <View pointerEvents="none" style={styles.ghost}><Image source={asset.source} style={styles.ghostImage} resizeMode="contain" /></View> : null}{pieces.map(p => <PuzzlePiece key={p.id} piece={p} asset={asset.source} cols={cols} rows={rows} w={w} h={h} drag={drag === p.id} onDragStart={() => { setDrag(p.id); setScrollEnabled(false); }} onDragEnd={(x: number, y: number) => { setDrag(null); setScrollEnabled(true); update(p.id, x, y); }} onDragCancel={() => { setDrag(null); setScrollEnabled(true); }} />)}</View></>;
}
function jigsawPath(w: number, h: number, col: number, row: number, cols: number, rows: number) {
  const tab = Math.min(w, h) * 0.18;
  const top = row === 0 ? `L${w} 0` : `L${w * .38} 0 Q${w * .5} ${-tab} ${w * .62} 0 L${w} 0`;
  const right = col === cols - 1 ? `L${w} ${h}` : `L${w} ${h * .38} Q${w + tab} ${h * .5} ${w} ${h * .62} L${w} ${h}`;
  const bottom = row === rows - 1 ? `L0 ${h}` : `L${w * .62} ${h} Q${w * .5} ${h + tab} ${w * .38} ${h} L0 ${h}`;
  const left = col === 0 ? 'L0 0' : `L0 ${h * .62} Q${-tab} ${h * .5} 0 ${h * .38} L0 0`;
  return `M0 0 ${top} ${right} ${bottom} ${left} Z`;
}
function PuzzlePiece({ piece, asset, cols, rows, w, h, drag, onDragStart, onDragEnd, onDragCancel }: any) {
  const [pos, setPos] = useState({ x: piece.x, y: piece.y });
  const start = useRef({ x: piece.x, y: piece.y, px: 0, py: 0 });
  useEffect(() => { if (!drag) setPos({ x: piece.x, y: piece.y }); }, [drag, piece.x, piece.y]);
  const pan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => !piece.placed,
    onStartShouldSetPanResponderCapture: () => !piece.placed,
    onMoveShouldSetPanResponder: () => !piece.placed,
    onMoveShouldSetPanResponderCapture: () => !piece.placed,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: e => {
      start.current = { x: pos.x, y: pos.y, px: e.nativeEvent.pageX, py: e.nativeEvent.pageY };
      onDragStart();
    },
    onPanResponderMove: e => {
      setPos({ x: start.current.x + e.nativeEvent.pageX - start.current.px, y: start.current.y + e.nativeEvent.pageY - start.current.py });
    },
    onPanResponderRelease: e => {
      onDragEnd(start.current.x + e.nativeEvent.pageX - start.current.px, start.current.y + e.nativeEvent.pageY - start.current.py);
    },
    onPanResponderTerminate: onDragCancel,
  }), [onDragCancel, onDragEnd, onDragStart, piece.placed, pos.x, pos.y]);
  const col = piece.id % cols;
  const row = Math.floor(piece.id / cols);
  const path = jigsawPath(w, h, col, row, cols, rows);
  return <Animated.View {...pan.panHandlers} pointerEvents={piece.placed ? 'none' : 'auto'} style={[styles.puzzlePiece, { width: w + 18, height: h + 18, left: pos.x - 9, top: pos.y - 9, zIndex: drag ? 50 : piece.placed ? 2 : 10, transform: [{ scale: drag ? 1.04 : 1 }] }]}><Svg width={w + 18} height={h + 18} viewBox={`-9 -9 ${w + 18} ${h + 18}`}><Defs><ClipPath id={`clip-${piece.id}`}><Path d={path} /></ClipPath></Defs><SvgImage href={asset} width={BOARD} height={BOARD} x={-col * w} y={-row * h} preserveAspectRatio="xMidYMid slice" clipPath={`url(#clip-${piece.id})`} /><Path d={path} fill="none" stroke={piece.placed ? Colors.primaryLight : Colors.borderLight} strokeWidth="1.5" /></Svg></Animated.View>;
}
function Button({ label, onPress, active }: { label: string; onPress: () => void; active?: boolean }) { return <Pressable onPress={onPress} style={[styles.smallButton, active && styles.smallButtonActive]}><Text style={styles.smallButtonText}>{label}</Text></Pressable>; }
const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: Colors.background }, header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }, scroll: { padding: Spacing.lg, gap: Spacing.md }, title: { color: Colors.text, fontSize: FontSizes.xxl }, subtitle: { color: Colors.textMuted, fontSize: FontSizes.base, lineHeight: 26 }, lolaBlock: { alignItems: 'center', gap: Spacing.sm, marginVertical: Spacing.md }, lola: { width: 92, height: 112 }, caption: { color: Colors.textSubtle, textAlign: 'center' }, card: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md }, icon: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.primaryFaint, alignItems: 'center', justifyContent: 'center' }, cardTitle: { color: Colors.text, fontSize: FontSizes.md }, cardText: { color: Colors.textMuted, fontSize: FontSizes.sm, lineHeight: 21 }, detail: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: 80 }, done: { alignSelf: 'flex-start', padding: Spacing.sm }, doneText: { color: Colors.primaryLight, fontSize: FontSizes.base }, detailTitle: { color: Colors.text, fontSize: FontSizes.xl }, help: { color: Colors.textMuted, lineHeight: 22 }, palette: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }, swatch: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: Colors.borderLight }, activeSwatch: { borderWidth: 3, borderColor: Colors.white }, canvas: { width: BOARD, height: BOARD, alignSelf: 'center', backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' }, row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }, templateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }, templateCard: { width: '31%', minWidth: 92, backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.borderLight, padding: Spacing.xs, alignItems: 'center', gap: 4 }, templateCardActive: { borderColor: Colors.primaryLight, backgroundColor: Colors.primaryFaint }, templatePreview: { width: '100%', height: 84 }, templateLabel: { color: Colors.textSecondary, fontSize: FontSizes.xs, textAlign: 'center' }, smallButton: { borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.borderLight, paddingHorizontal: 14, paddingVertical: 9 }, smallButtonActive: { backgroundColor: Colors.primaryFaint, borderColor: Colors.primaryLight }, smallButtonText: { color: Colors.textSecondary }, mahjongBoard: { height: 292, backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, position: 'relative' }, mahjongTile: { position: 'absolute', width: 38, height: 52, borderRadius: 10, backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.borderLight, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 3, alignItems: 'center', justifyContent: 'center' }, blocked: { opacity: 0.38, backgroundColor: Colors.surface }, picked: { borderColor: Colors.primaryLight, backgroundColor: Colors.primaryFaint, transform: [{ translateY: -3 }, { scale: 1.04 }] }, hint: { borderColor: '#E8C982', borderWidth: 3 }, removed: { opacity: 0 }, mahjongIcon: { width: '72%', height: '72%' }, puzzleArea: { width: BOARD, alignSelf: 'center', backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', position: 'relative' }, ghost: { position: 'absolute', width: BOARD, height: BOARD, opacity: 0.18, left: 0, top: 0 }, ghostImage: { width: BOARD, height: BOARD }, puzzlePiece: { position: 'absolute' }, placed: { borderColor: Colors.primaryLight } });
