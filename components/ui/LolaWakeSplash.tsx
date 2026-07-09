import { Image, StyleSheet, View } from 'react-native';
import { Colors } from '@/constants/theme';

const SLEEPING_LOLA = require('@/assets/companion/lola-asleep.png');

type LolaWakeSplashProps = { onDone: () => void };

export function LolaWakeSplash({ onDone }: LolaWakeSplashProps) {
  return (
    <View pointerEvents="none" style={styles.overlay}>
      <Image source={SLEEPING_LOLA} style={styles.lola} resizeMode="contain" onLoadEnd={onDone} onError={onDone} />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  lola: { width: 240, height: 280 },
});
