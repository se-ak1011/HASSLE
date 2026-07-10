import React, { useMemo, useState } from 'react';
import { Image, ImageStyle, LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { GARDEN_ASSETS, GardenAssetId } from './gardenAssets';
import { GARDEN_LAYOUT, GardenLayoutItem } from './gardenLayout';
import { GardenState } from './gardenState';
import { getVisibleOverlayIds } from './gardenRules';

const baseSize = Image.resolveAssetSource(GARDEN_ASSETS.baseGarden);
const BASE_ASPECT_RATIO = baseSize.width / baseSize.height;

type GardenCanvasProps = {
  gardenState: GardenState;
};

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

export function GardenCanvas({ gardenState }: GardenCanvasProps) {
  const [containerWidth, setContainerWidth] = useState(0);

  const canvas = useMemo(() => {
    const width = containerWidth;
    return { width, height: width > 0 ? width / BASE_ASPECT_RATIO : 0 };
  }, [containerWidth]);

  const visibleIds = useMemo(() => getVisibleOverlayIds(gardenState), [gardenState]);

  function onLayout(event: LayoutChangeEvent) {
    setContainerWidth(event.nativeEvent.layout.width);
  }

  return (
    <View onLayout={onLayout} style={styles.frame}>
      {canvas.width > 0 ? (
        <View style={[styles.canvas, { width: canvas.width, height: canvas.height }]}>
          <Image source={GARDEN_ASSETS.baseGarden} resizeMode="contain" style={styles.base} accessibilityLabel="Lola's garden" />
          {visibleIds.map((id: GardenAssetId) => {
            const layout = GARDEN_LAYOUT[id];
            return (
              <Image
                key={id}
                source={GARDEN_ASSETS[id]}
                resizeMode="contain"
                style={[styles.overlay, itemStyle(layout, canvas.width, canvas.height)]}
              />
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { width: '100%', alignItems: 'center' },
  canvas: { overflow: 'hidden' },
  base: { width: '100%', height: '100%' },
  overlay: { position: 'absolute', aspectRatio: 1 },
});
