import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlertProvider } from '@/template';
import { DayProvider } from '@/contexts/DayContext';
import { PlusProvider } from '@/contexts/PlusContext';
import { AccountProvider } from '@/contexts/AccountContext';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { billing } from '@/services/billing';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RegionProvider } from '@/localization/RegionContext';

// Keep the native splash up until we explicitly hide it, so we control when it
// goes away (rather than racing the router). Paired with the unconditional
// hideAsync() below, this means a font hiccup can never strand us on the splash.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  // Proceed even if a custom font fails to load — a missing font just falls back
  // to the system font and must never block the whole app from starting.
  const [fontsLoaded, fontError] = useFonts({
    ChronicSans: require('@/assets/fonts/ChronicSans.otf'),
  });

  const ready = fontsLoaded || !!fontError;

  // Keep the native Expo splash visible until the app is ready. We no longer
  // render a second in-app loading splash, which prevents the previous
  // placeholder-then-sticker double splash transition.
  useEffect(() => {
    if (!ready) return;
    SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  // Initialise the billing SDK once (RevenueCat on native, no-op on web).
  useEffect(() => {
    billing.configure();
  }, []);

  return (
    <ErrorBoundary>
      {!ready ? null : (
        <RegionProvider>
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
                    <Stack.Screen name="quiet-time" />
                    <Stack.Screen name="life" />
                    <Stack.Screen name="body" />
                    <Stack.Screen name="body-pain" />
                    <Stack.Screen name="body-fatigue" />
                    <Stack.Screen name="body-symptoms" />
                    <Stack.Screen name="body-medication" />
                    <Stack.Screen name="body-self-care" />
                    <Stack.Screen name="ai-coach" />
                  </Stack>
                </AccountProvider>
              </PlusProvider>
            </DayProvider>
          </SafeAreaProvider>
          </AlertProvider>
        </RegionProvider>
      )}
    </ErrorBoundary>
  );
}
