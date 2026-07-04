import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlertProvider } from '@/template';
import { DayProvider } from '@/contexts/DayContext';
import { PlusProvider } from '@/contexts/PlusContext';
import { AccountProvider } from '@/contexts/AccountContext';
import { View, Text, Image, ActivityIndicator } from 'react-native';
import { useFonts } from 'expo-font';
import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { Colors } from '@/constants/theme';
import { billing } from '@/services/billing';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Keep the native splash up until we explicitly hide it, so we control when it
// goes away (rather than racing the router). Paired with the unconditional
// hideAsync() below, this means a font hiccup can never strand us on the splash.
SplashScreen.preventAutoHideAsync().catch(() => {});

/** Brief loading screen shown while fonts settle (usually a blink). */
function LoadingScreen() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 28,
        // Extra bottom padding shifts the centred content (sticker + text) up
        // the screen so Lola sits higher rather than dead-centre.
        paddingBottom: 160,
      }}
    >
      <Image
        source={require('@/assets/images/splash.png')}
        style={{ width: 180, height: 180, resizeMode: 'contain' }}
      />
      <Text style={{ color: Colors.text, fontSize: 22, fontWeight: '700', marginTop: 18 }}>
        Loading… 🦴
      </Text>
      <Text style={{ color: Colors.textSubtle, fontSize: 15, marginTop: 14 }}>(Maybe)</Text>
      <ActivityIndicator color={Colors.primary} style={{ marginTop: 16 }} />
    </View>
  );
}

export default function RootLayout() {
  // Proceed even if a custom font fails to load — a missing font just falls back
  // to the system font and must never block the whole app from starting.
  const [fontsLoaded, fontError] = useFonts({
    ChronicSans: require('@/assets/fonts/ChronicSans.otf'),
    ChronicSansFlare: require('@/assets/fonts/ChronicSansFlare.otf'),
  });

  // Hold the loading screen for at least half a second so "Loading… 🦴 (Maybe)"
  // is actually readable — fonts usually load in a blink, which would otherwise
  // flash the screen past too fast to see.
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMinTimeElapsed(true), 500);
    return () => clearTimeout(t);
  }, []);

  const ready = (fontsLoaded || !!fontError) && minTimeElapsed;

  // Always hide the splash shortly after mount, regardless of fonts, so we can
  // never get stuck on it. Once it's down, the ErrorBoundary can surface any
  // captured startup error instead of an endless splash.
  useEffect(() => {
    const t = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 50);
    return () => clearTimeout(t);
  }, []);

  // Initialise the billing SDK once (RevenueCat on native, no-op on web).
  useEffect(() => {
    billing.configure();
  }, []);

  return (
    <ErrorBoundary>
      {!ready ? (
        <LoadingScreen />
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
