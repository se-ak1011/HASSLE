import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlertProvider } from '@/template';
import { DayProvider } from '@/contexts/DayContext';
import { PlusProvider } from '@/contexts/PlusContext';
import { AccountProvider } from '@/contexts/AccountContext';
import { View, ActivityIndicator } from 'react-native';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import { Colors } from '@/constants/theme';
import { billing } from '@/services/billing';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    ChronicSans: require('@/assets/fonts/ChronicSans.otf'),
    ChronicSansFlare: require('@/assets/fonts/ChronicSansFlare.otf'),
  });

  // Initialise the billing SDK once (no-op on web).
  useEffect(() => {
    billing.configure();
  }, []);

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
          <PlusProvider>
            <AccountProvider>
              <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="onboarding" />
                <Stack.Screen name="checkin" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="account" />
                <Stack.Screen name="library" />
                <Stack.Screen name="directory" />
                <Stack.Screen name="report" />
              </Stack>
            </AccountProvider>
          </PlusProvider>
        </DayProvider>
      </SafeAreaProvider>
    </AlertProvider>
  );
}
