// Hassle — TEMPORARY startup diagnostic entry.
//
// We're stuck on the splash: none of the app's code (router/providers) appears
// to run, so we can't show the error from inside the app. This entry loads NONE
// of that — it installs the error guard, hides the splash, and renders a tiny
// standalone screen. It tells us one decisive thing:
//   • If this screen shows, the React Native shell + JS bundle + splash control
//     all work, so the crash/stall is in the app code (expo-router/providers).
//   • If the splash stays, the problem is deeper (native / bundle level).
//
// The real entry is the two commented lines below — restore them once we know.
import './services/earlyErrorGuard';
import React, { useEffect } from 'react';
import { View, Text, Image, ActivityIndicator } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { registerRootComponent } from 'expo';

// import 'expo-router/entry'; // <- real app entry (restore after diagnosis)

SplashScreen.preventAutoHideAsync().catch(() => {});

function StartupDiagnostic() {
  useEffect(() => {
    const t = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#1A1916',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 28,
      }}
    >
      <Image
        source={require('./assets/images/splash.png')}
        style={{ width: 200, height: 200, resizeMode: 'contain' }}
      />
      <Text
        style={{ color: '#F2ECE4', fontSize: 22, fontWeight: '700', marginTop: 24 }}
      >
        working on it… 😂
      </Text>
      <ActivityIndicator color="#7A5478" style={{ marginTop: 18 }} />
      <Text
        style={{
          color: '#9A9097',
          fontSize: 13,
          marginTop: 28,
          textAlign: 'center',
          lineHeight: 19,
        }}
      >
        If you can read this, Hassle&apos;s shell is alive — {'\n'}we&apos;re wiring up the rest. 🦴
      </Text>
    </View>
  );
}

registerRootComponent(StartupDiagnostic);
