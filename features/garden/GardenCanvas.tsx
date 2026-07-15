import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Image, LayoutChangeEvent, PanResponder, StyleSheet, View } from 'react-native';
import { GARDEN_ASSETS, GardenAssetId } from './gardenAssets';
import { GARDEN_ASPECT_RATIO, layerFor } from './gardenLayout';
import { PlacedAsset, resolvePlacements } from './gardenPlacement';
import { GardenState } from './gardenState';
import { getVisibleOverlayIds } from './gardenRules';
import { useReducedMotion } from '@/hooks/useReducedMotion';

// Intrinsic aspect ratio (w/h) of each asset PNG, resolved once from the bundled
// metadata. An <Image> with only `width` set lays out to zero height, so we must
// give every overlay a real height derived from its own proportions — this also
// makes the bottom-anchor sit exactly on the ground.
const ASSET_ASPECT: Partial<Record<GardenAssetId, number>> = {};
function aspectOf(id: GardenAssetId): number {
  const cached = ASSET_ASPECT[id];
  if (cached) return cached;
  const src = Image.resolveAssetSource(GARDEN_ASSETS[id]);
  const ratio = src && src.width && src.height ? src.width / src.height : 1;
  ASSET_ASPECT[id] = ratio;
  return ratio;
}

// ── Geometry of the contained world inside the viewport ──────────────────────
export type WorldGeometry = {
  left: number; // px offset of the world box within the viewport
  top: number;
  width: number; // px size of the world box (base image drawn at this size)
  height: number;
};

function containWorld(viewportWidth: number, viewportHeight: number): WorldGeometry {
  if (viewportWidth <= 0 || viewportHeight <= 0) return { left: 0, top: 0, width: 0, height: 0 };
  // Fit the whole 3:2 world into the viewport (contain), centred. The base art
  // is already an oval on black, so any letterbox margin reads as part of it.
  let width = viewportWidth;
  let height = width / GARDEN_ASPECT_RATIO;
  if (height > viewportHeight) {
    height = viewportHeight;
    width = height * GARDEN_ASPECT_RATIO;
  }
  return {
    left: (viewportWidth - width) / 2,
    top: (viewportHeight - height) / 2,
    width,
    height,
  };
}

// ── Gentle idle motion per layer ─────────────────────────────────────────────
type Motion = 'float' | 'sway' | 'breathe' | 'none';
function motionForAsset(id: GardenAssetId): Motion {
  const layer = layerFor(id);
  if (layer === 'birdsAndInsects') return 'float';
  if (layer === 'flowers' || layer === 'seasonalGround' || layer === 'groundPlants') return 'sway';
  if (layer === 'lolaAndAnimals') return 'breathe';
  return 'none';
}

function hashPhase(id: string): number {
  let value = 2166136261;
  for (let i = 0; i < id.length; i += 1) {
    value ^= id.charCodeAt(i);
    value = Math.imul(value, 16777619);
  }
  return (value >>> 0) % 1000;
}

// Anchor-aware overlay: a normalised ground-contact point + width becomes an
// absolutely-positioned image inside the shared world container.
function AnimatedOverlay({ item, worldW, worldH }: { item: PlacedAsset; worldW: number; worldH: number }) {
  const motion = motionForAsset(item.id);
  const reduceMotion = useReducedMotion();
  const enter = useRef(new Animated.Value(0)).current;
  const loop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(enter, { toValue: 1, duration: 700, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
  }, [enter]);

  useEffect(() => {
    if (reduceMotion || motion === 'none') {
      loop.setValue(0);
      return;
    }
    const duration = motion === 'float' ? 2600 : motion === 'sway' ? 3600 : 4200;
    const delay = hashPhase(item.id) % duration;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(loop, { toValue: 1, duration, delay, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(loop, { toValue: 0, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [item.id, loop, motion, reduceMotion]);

  const transform: any[] = [];
  if (motion === 'float') transform.push({ translateY: loop.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) });
  if (motion === 'breathe') {
    transform.push({ translateY: loop.interpolate({ inputRange: [0, 1], outputRange: [0, -2] }) });
    transform.push({ scale: loop.interpolate({ inputRange: [0, 1], outputRange: [1, 1.006] }) });
  }
  if (motion === 'sway') transform.push({ rotate: loop.interpolate({ inputRange: [0, 1], outputRange: ['-1.5deg', '1.5deg'] }) });

  const w = item.width * worldW;
  const h = w / aspectOf(item.id);
  const left = item.x * worldW - item.anchor.x * w;
  const top = item.y * worldH - item.anchor.y * h;

  return (
    <Animated.Image
      source={GARDEN_ASSETS[item.id]}
      resizeMode="contain"
      style={[{ position: 'absolute', left, top, width: w, height: h, opacity: enter, transform }]}
    />
  );
}

// In "Rearrange" mode every overlay becomes draggable. Pan/zoom is locked to the
// fit view (zoom 1, no offset), so a screen-space drag maps straight to a
// normalised delta. On release we report the new ground-contact point.
function DraggableOverlay({
  item,
  worldW,
  worldH,
  onMove,
}: {
  item: PlacedAsset;
  worldW: number;
  worldH: number;
  onMove: (id: GardenAssetId, x: number, y: number) => void;
}) {
  const posRef = useRef({ x: item.x, y: item.y });
  const startRef = useRef(posRef.current);
  const [, setTick] = useState(0);

  useEffect(() => {
    posRef.current = { x: item.x, y: item.y };
    setTick(t => t + 1);
  }, [item.x, item.y]);

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          startRef.current = posRef.current;
        },
        onPanResponderMove: (_e, g) => {
          posRef.current = {
            x: Math.max(0.02, Math.min(0.98, startRef.current.x + g.dx / worldW)),
            y: Math.max(0.04, Math.min(0.99, startRef.current.y + g.dy / worldH)),
          };
          setTick(t => t + 1);
        },
        onPanResponderRelease: () => onMove(item.id, posRef.current.x, posRef.current.y),
        onPanResponderTerminate: () => onMove(item.id, posRef.current.x, posRef.current.y),
      }),
    [worldW, worldH, item.id, onMove]
  );

  const w = item.width * worldW;
  const h = w / aspectOf(item.id);
  const left = posRef.current.x * worldW - item.anchor.x * w;
  const top = posRef.current.y * worldH - item.anchor.y * h;

  return (
    <View {...responder.panHandlers} style={{ position: 'absolute', left, top, width: w, height: h }}>
      <Image source={GARDEN_ASSETS[item.id]} resizeMode="contain" style={{ width: w, height: h }} />
      <View pointerEvents="none" style={styles.editOutline} />
    </View>
  );
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 2.5;

type Point = { x: number; y: number };
function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}
function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
function midpoint(a: Point, b: Point) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}
function touchPoint(touch: any, fallback: any): Point {
  return { x: touch?.pageX ?? fallback.pageX ?? 0, y: touch?.pageY ?? fallback.pageY ?? 0 };
}
function clampOffset(offset: Point, zoom: number, w: number, h: number) {
  const maxX = Math.max(0, (w * zoom - w) / 2);
  const maxY = Math.max(0, (h * zoom - h) / 2);
  return { x: clamp(offset.x, -maxX, maxX), y: clamp(offset.y, -maxY, maxY) };
}

type GardenCanvasProps = {
  gardenState: GardenState;
  // When true, pan/zoom is locked to the fit view so the coordinate editor can
  // map taps reliably. The editor is rendered via `renderOverlay`.
  interactive?: boolean;
  renderOverlay?: (geom: WorldGeometry) => React.ReactNode;
  onGeometry?: (geom: WorldGeometry) => void;
  // User rearrangements applied over the coordinate system.
  overrides?: Partial<Record<GardenAssetId, { x: number; y: number }>>;
  // "Rearrange" mode — overlays become draggable and report their new position.
  editMode?: boolean;
  onMoveAsset?: (id: GardenAssetId, x: number, y: number) => void;
};

export function GardenCanvas({
  gardenState,
  interactive = true,
  renderOverlay,
  onGeometry,
  overrides,
  editMode = false,
  onMoveAsset,
}: GardenCanvasProps) {
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const gesture = useRef({
    mode: 'idle' as 'idle' | 'pan' | 'pinch',
    startPoint: { x: 0, y: 0 },
    startOffset: { x: 0, y: 0 },
    startDistance: 1,
    startZoom: MIN_ZOOM,
  });

  const world = useMemo(() => containWorld(viewport.width, viewport.height), [viewport.width, viewport.height]);

  useEffect(() => {
    if (world.width > 0) onGeometry?.(world);
  }, [world, onGeometry]);

  const placements = useMemo(() => {
    const visible = getVisibleOverlayIds(gardenState);
    return resolvePlacements(visible, { overrides });
  }, [gardenState, overrides]);

  function onLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    setViewport({ width, height });
    setOffset(current => clampOffset(current, zoom, containWorld(width, height).width, containWorld(width, height).height));
  }

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => interactive,
        onMoveShouldSetPanResponder: () => interactive,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: event => {
          const touches = event.nativeEvent.touches ?? [];
          if (touches.length > 1) {
            const a = touchPoint(touches[0], event.nativeEvent);
            const b = touchPoint(touches[1], event.nativeEvent);
            gesture.current = { mode: 'pinch', startPoint: midpoint(a, b), startOffset: offset, startDistance: Math.max(1, distance(a, b)), startZoom: zoom };
            return;
          }
          gesture.current = { mode: 'pan', startPoint: touchPoint(touches[0], event.nativeEvent), startOffset: offset, startDistance: 1, startZoom: zoom };
        },
        onPanResponderMove: event => {
          const touches = event.nativeEvent.touches ?? [];
          if (touches.length > 1) {
            const a = touchPoint(touches[0], event.nativeEvent);
            const b = touchPoint(touches[1], event.nativeEvent);
            const nextZoom = clamp(gesture.current.startZoom * (distance(a, b) / gesture.current.startDistance), MIN_ZOOM, MAX_ZOOM);
            gesture.current.mode = 'pinch';
            setZoom(nextZoom);
            setOffset(clampOffset(gesture.current.startOffset, nextZoom, world.width, world.height));
            return;
          }
          if (gesture.current.mode !== 'pan' || zoom <= MIN_ZOOM) return;
          const point = touchPoint(touches[0], event.nativeEvent);
          setOffset(
            clampOffset(
              {
                x: gesture.current.startOffset.x + point.x - gesture.current.startPoint.x,
                y: gesture.current.startOffset.y + point.y - gesture.current.startPoint.y,
              },
              zoom,
              world.width,
              world.height
            )
          );
        },
        onPanResponderRelease: () => {
          gesture.current.mode = 'idle';
        },
        onPanResponderTerminate: () => {
          gesture.current.mode = 'idle';
        },
      }),
    [interactive, offset, world.width, world.height, zoom]
  );

  // In editor mode we pin to the fit view so tap→coordinate mapping is exact.
  const activeZoom = interactive ? zoom : MIN_ZOOM;
  const activeOffset = interactive ? offset : { x: 0, y: 0 };

  return (
    <View onLayout={onLayout} style={styles.viewport} {...(interactive ? panResponder.panHandlers : {})}>
      {world.width > 0 ? (
        <View
          style={[
            styles.world,
            {
              left: world.left,
              top: world.top,
              width: world.width,
              height: world.height,
              transform: [{ translateX: activeOffset.x }, { translateY: activeOffset.y }, { scale: activeZoom }],
            },
          ]}
        >
          <Image source={GARDEN_ASSETS.baseGarden} resizeMode="contain" style={styles.base} accessibilityLabel="Lola's garden" />
          {placements.map(item =>
            editMode && onMoveAsset ? (
              <DraggableOverlay key={item.id} item={item} worldW={world.width} worldH={world.height} onMove={onMoveAsset} />
            ) : (
              <AnimatedOverlay key={item.id} item={item} worldW={world.width} worldH={world.height} />
            )
          )}
          {renderOverlay ? renderOverlay(world) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: { flex: 1, overflow: 'hidden', backgroundColor: 'transparent' },
  world: { position: 'absolute', overflow: 'visible' },
  base: { width: '100%', height: '100%' },
  editOutline: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderWidth: 1.5,
    borderColor: 'rgba(196, 180, 228, 0.9)',
    borderStyle: 'dashed',
    borderRadius: 8,
  },
});
