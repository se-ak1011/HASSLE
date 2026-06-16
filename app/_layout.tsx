import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlertProvider } from '@/template';
import { DayProvider } from '@/contexts/DayContext';
import { PlusProvider } from '@/contexts/PlusContext';
import { AccountProvider } from '@/contexts/AccountContext';
import { View, ActivityIndicator } from 'react-native';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { Colors } from '@/constants/theme';
import { billing } from '@/services/billing';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Keep the native splash up until we explicitly hide it, so we control when it
// goes away (rather than racing the router). Paired with the unconditional
// hideAsync() below, this means a font hiccup can never strand us on the splash.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  // Proceed even if a custom font fails to load — a missing font just falls back
  // to the system font and must never block the whole app from starting.
  const [fontsLoaded, fontError] = useFonts({
    ChronicSans: require('@/assets/fonts/ChronicSans.otf'),
    ChronicSansFlare: require('@/assets/fonts/ChronicSansFlare.otf'),
  });
  const ready = fontsLoaded || !!fontError;

  // eslint-disable-next-line no-console
  console.log('[HSTART] RootLayout render; ready=', ready, 'fontError=', !!fontError);

  // Always hide the splash shortly after mount, regardless of fonts, so we can
  // never get stuck on it. Once it's down, the ErrorBoundary can surface any
  // captured startup error instead of an endless splash.
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('[HSTART] RootLayout mounted, hiding splash');
    const t = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 50);
    return () => clearTimeout(t);
  }, []);

  // Initialise the billing SDK once (no-op on web / in the beta stub).
  useEffect(() => {
    billing.configure();
  }, []);

  return (
    <ErrorBoundary>
      {!ready ? (
        <View
          style={{
            flex: 1,
            backgroundColor: Colors.background,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <ActivityIndicator color={Colors.primary} size="small" />
        </View>
      ) : (
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
      )}
    </ErrorBoundary>
  );
}
