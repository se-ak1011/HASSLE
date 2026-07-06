import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useDay } from '@/hooks/useDay';
import { Colors } from '@/constants/theme';

/**
 * Root entry point.
 * - If loading, show spinner.
 * - If onboarding not complete, redirect to onboarding.
 * - Otherwise go to the main tab layout.
 */
export default function EntryScreen() {
  const router = useRouter();
  const { isLoading, prefs } = useDay();

  useEffect(() => {
    if (isLoading) return;
    if (!prefs?.hasCompletedOnboarding) {
      router.replace('/onboarding' as any);
    } else {
      router.replace('/(tabs)' as any);
    }
  }, [isLoading, prefs?.hasCompletedOnboarding]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <ActivityIndicator color={Colors.textMuted} />
    </View>
  );
}
