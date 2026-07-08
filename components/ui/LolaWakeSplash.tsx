import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Colors } from '@/constants/theme';
import { LOLA_ASLEEP_DATA_URI, LOLA_AWAKE_DATA_URI } from '@/constants/lolaWakeImages';

const ASLEEP_LOLA = { uri: LOLA_ASLEEP_DATA_URI };
const AWAKE_LOLA = { uri: LOLA_AWAKE_DATA_URI };

type LolaWakeSplashProps = {
  onDone: () => void;
};

export function LolaWakeSplash({ onDone }: LolaWakeSplashProps) {
  const [loaded, setLoaded] = useState({ asleep: false, awake: false });
  const finishedRef = useRef(false);
  const overlayOpacity = useRef(new Animated.Value(1)).current;
  const asleepOpacity = useRef(new Animated.Value(1)).current;
  const awakeOpacity = useRef(new Animated.Value(0)).current;

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onDone();
  }, [onDone]);

  useEffect(() => {
    const fallback = setTimeout(finish, 3200);
    return () => clearTimeout(fallback);
  }, [finish]);

  useEffect(() => {
    if (!loaded.asleep || !loaded.awake || finishedRef.current) return;

    const sequence = Animated.sequence([
      Animated.delay(450),
      Animated.parallel([
        Animated.timing(asleepOpacity, {
          toValue: 0,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(awakeOpacity, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(550),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 360,
        useNativeDriver: true,
      }),
    ]);

    sequence.start(({ finished }) => {
      if (finished) finish();
    });

    return () => sequence.stop();
  }, [asleepOpacity, awakeOpacity, finish, loaded.asleep, loaded.awake, overlayOpacity]);

  return (
    <Animated.View pointerEvents="none" style={[styles.overlay, { opacity: overlayOpacity }]}>
      <View style={styles.imageWrap}>
        <Animated.Image
          source={ASLEEP_LOLA}
          style={[styles.lola, { opacity: asleepOpacity }]}
          resizeMode="contain"
          onLoad={() => setLoaded((current) => ({ ...current, asleep: true }))}
          onError={finish}
        />
        <Animated.Image
          source={AWAKE_LOLA}
          style={[styles.lola, styles.awakeLola, { opacity: awakeOpacity }]}
          resizeMode="contain"
          onLoad={() => setLoaded((current) => ({ ...current, awake: true }))}
          onError={finish}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  imageWrap: {
    width: 240,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lola: {
    width: 240,
    height: 280,
  },
  awakeLola: {
    position: 'absolute',
  },
});
