import { Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { Colors, Radius } from '@/constants/theme';

export function GardenButton() {
  const router = useRouter();
  const pathname = usePathname();
  if (pathname === '/garden' || pathname === '/onboarding') return null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open Lola's Garden"
      onPress={() => router.push('/garden' as any)}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <MaterialCommunityIcons name="leaf" size={22} color={Colors.primaryLight} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    top: 54,
    right: 18,
    zIndex: 1000,
    width: 42,
    height: 42,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceElevated + 'EE',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  pressed: { opacity: 0.7, transform: [{ scale: 0.96 }] },
});
