import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Image, ImageStyle, LayoutChangeEvent, PanResponder, StyleSheet, View } from 'react-native';
import { GARDEN_ASSETS, GardenAssetId } from './gardenAssets';
import { GARDEN_LAYOUT, GardenLayer, GardenLayoutItem } from './gardenLayout';
import { GardenState } from './gardenState';
import { getVisibleOverlayIds } from './gardenRules';
import { useReducedMotion } from '@/hooks/useReducedMotion';

// Which gentle idle motion (if any) each layer gets. Nothing flashy — a soft
// bob, a slow sway, a barely-there breath. Everything else stays perfectly still.
type Motion = 'float' | 'sway' | 'breathe' | 'none';
function motionForLayer(layer: GardenLayer): Motion {
  if (layer === 'insects' || layer === 'birds') return 'float';
  if (layer === 'flowersAndGround' || layer === 'seasonal') return 'sway';
  if (layer === 'lola') return 'breathe';
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

function AnimatedOverlay({ id, style, source }: { id: GardenAssetId; style: ImageStyle; source: any }) {
  const layer = GARDEN_LAYOUT[id].layer;
  const motion = motionForLayer(layer);
  const reduceMotion = useReducedMotion();
  const enter = useRef(new Animated.Value(0)).current;
  const loop = useRef(new Animated.Value(0)).current;

  // Soft fade-in when a discovery first renders.
  useEffect(() => {
    Animated.timing(enter, { toValue: 1, duration: 700, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
  }, [enter]);

  useEffect(() => {
    if (reduceMotion || motion === 'none') {
      loop.setValue(0);
      return;
    }
    const duration = motion === 'float' ? 2600 : motion === 'sway' ? 3600 : 4200;
    const delay = hashPhase(id) % duration;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(loop, { toValue: 1, duration, delay, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(loop, { toValue: 0, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [id, loop, motion, reduceMotion]);

  const transform: any[] = [];
  if (motion === 'float') transform.push({ translateY: loop.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) });
  if (motion === 'breathe') {
    transform.push({ translateY: loop.interpolate({ inputRange: [0, 1], outputRange: [0, -2] }) });
    transform.push({ scale: loop.interpolate({ inputRange: [0, 1], outputRange: [1, 1.006] }) });
  }
  if (motion === 'sway') transform.push({ rotate: loop.interpolate({ inputRange: [0, 1], outputRange: ['-1.5deg', '1.5deg'] }) });

  return (
    <Animated.Image
      source={source}
      resizeMode="contain"
      style={[styles.overlay, style, { opacity: enter, transform }]}
    />
  );
}

const baseSize = Image.resolveAssetSource(GARDEN_ASSETS.baseGarden);
const BASE_ASPECT_RATIO = baseSize.width / baseSize.height;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

type GardenCanvasProps = {
  gardenState: GardenState;
  setScrollEnabled?: (enabled: boolean) => void;
};

type Point = { x: number; y: number };

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
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

function clampOffset(offset: Point, zoom: number, viewportWidth: number, viewportHeight: number) {
  const maxX = Math.max(0, (viewportWidth * zoom - viewportWidth) / 2);
  const maxY = Math.max(0, (viewportHeight * zoom - viewportHeight) / 2);
  return {
    x: clamp(offset.x, -maxX, maxX),
    y: clamp(offset.y, -maxY, maxY),
  };
}

function itemStyle(item: GardenLayoutItem, baseWidth: number, baseHeight: number): ImageStyle {
  const width = Math.min(item.width * baseWidth, baseWidth);
  const left = item.x * baseWidth;
  const top = item.y * baseHeight;
  const anchor = item.anchor ?? 'topLeft';

  if (anchor === 'center') {
    return { width, left: left - width / 2, top: top - width / 2 };
  }
  if (anchor === 'bottomCenter') {
    return { width, left: left - width / 2, bottom: baseHeight - top };
  }
  return { width, left, top };
}

export function GardenCanvas({ gardenState, setScrollEnabled }: GardenCanvasProps) {
  const [containerWidth, setContainerWidth] = useState(0);
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const gesture = useRef({
    mode: 'idle' as 'idle' | 'pan' | 'pinch',
    startPoint: { x: 0, y: 0 },
    startOffset: { x: 0, y: 0 },
    startDistance: 1,
    startZoom: MIN_ZOOM,
  });

  const canvas = useMemo(() => {
    const width = containerWidth;
    return { width, height: width > 0 ? width / BASE_ASPECT_RATIO : 0 };
  }, [containerWidth]);

  const visibleIds = useMemo(() => getVisibleOverlayIds(gardenState), [gardenState]);

  function onLayout(event: LayoutChangeEvent) {
    const width = event.nativeEvent.layout.width;
    setContainerWidth(width);
    setOffset(current => clampOffset(current, zoom, width, width / BASE_ASPECT_RATIO));
  }

  function releaseGesture() {
    gesture.current.mode = 'idle';
    setScrollEnabled?.(true);
  }

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onStartShouldSetPanResponderCapture: () => true,
    onMoveShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponderCapture: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: event => {
      setScrollEnabled?.(false);
      const touches = event.nativeEvent.touches ?? [];
      if (touches.length > 1) {
        const a = touchPoint(touches[0], event.nativeEvent);
        const b = touchPoint(touches[1], event.nativeEvent);
        gesture.current = {
          mode: 'pinch',
          startPoint: midpoint(a, b),
          startOffset: offset,
          startDistance: Math.max(1, distance(a, b)),
          startZoom: zoom,
        };
        return;
      }
      gesture.current = {
        mode: 'pan',
        startPoint: touchPoint(touches[0], event.nativeEvent),
        startOffset: offset,
        startDistance: 1,
        startZoom: zoom,
      };
    },
    onPanResponderMove: event => {
      const touches = event.nativeEvent.touches ?? [];
      if (touches.length > 1) {
        const a = touchPoint(touches[0], event.nativeEvent);
        const b = touchPoint(touches[1], event.nativeEvent);
        const nextZoom = clamp(gesture.current.startZoom * (distance(a, b) / gesture.current.startDistance), MIN_ZOOM, MAX_ZOOM);
        const nextOffset = clampOffset(gesture.current.startOffset, nextZoom, canvas.width, canvas.height);
        gesture.current.mode = 'pinch';
        setZoom(nextZoom);
        setOffset(nextOffset);
        return;
      }

      if (gesture.current.mode !== 'pan') return;
      const point = touchPoint(touches[0], event.nativeEvent);
      const nextOffset = clampOffset({
        x: gesture.current.startOffset.x + point.x - gesture.current.startPoint.x,
        y: gesture.current.startOffset.y + point.y - gesture.current.startPoint.y,
      }, zoom, canvas.width, canvas.height);
      setOffset(nextOffset);
    },
    onPanResponderRelease: releaseGesture,
    onPanResponderTerminate: releaseGesture,
  }), [canvas.height, canvas.width, offset, setScrollEnabled, zoom]);

  return (
    <View onLayout={onLayout} style={styles.viewport} {...panResponder.panHandlers}>
      {canvas.width > 0 ? (
        <View
          style={[
            styles.canvas,
            {
              width: canvas.width,
              height: canvas.height,
              transform: [{ translateX: offset.x }, { translateY: offset.y }, { scale: zoom }],
            },
          ]}
        >
          <Image source={GARDEN_ASSETS.baseGarden} resizeMode="contain" style={styles.base} accessibilityLabel="Lola's garden" />
          {visibleIds.map((id: GardenAssetId) => (
            <AnimatedOverlay
              key={id}
              id={id}
              source={GARDEN_ASSETS[id]}
              style={itemStyle(GARDEN_LAYOUT[id], canvas.width, canvas.height)}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: {
    width: '100%',
    aspectRatio: BASE_ASPECT_RATIO,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  canvas: {
    overflow: 'hidden',
  },
  base: { width: '100%', height: '100%' },
  overlay: { position: 'absolute', aspectRatio: 1 },
});
