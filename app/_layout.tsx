import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlertProvider } from '@/template';
import { DayProvider } from '@/contexts/DayContext';
import { View, ActivityIndicator } from 'react-native';
import {
  useFonts,
  Caveat_400Regular,
  Caveat_500Medium,
  Caveat_600SemiBold,
  Caveat_700Bold,
} from '@expo-google-fonts/caveat';
import {
  PermanentMarker_400Regular,
} from '@expo-google-fonts/permanent-marker';
import { Colors } from '@/constants/theme';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Caveat_400Regular,
    Caveat_500Medium,
    Caveat_600SemiBold,
    Caveat_700Bold,
    PermanentMarker_400Regular,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={Colors.primary} size="small" />
      </View>
    );
  }

  return (
    <AlertProvider>
      <SafeAreaProvider>
        <DayProvider>
          <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="checkin" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </DayProvider>
      </SafeAreaProvider>
    </AlertProvider>
  );
}
