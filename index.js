// Hassle — TEMPORARY mount probe entry.
//
// The load probe showed every module imports cleanly, so the startup failure is
// a RUNTIME/MOUNT error: a component throws while rendering, or in a startup
// effect (the providers do async supabase / AsyncStorage work on mount).
//
// This probe mounts the REAL provider stack (the same order as app/_layout)
// around a small child, wrapped so we capture whichever path throws:
//   • render / effect errors  -> the <Catch> error boundary
//   • async (promise) errors  -> the early guard, surfaced via subscription
// Whichever fires is printed with its message + stack. Restore the real entry
// (commented line) once we know.
import './services/earlyErrorGuard';
import React, { useEffect, useState, Component } from 'react';
import { View, Text, ScrollView } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { registerRootComponent } from 'expo';
import { getLastStartupError, subscribeStartupError } from './services/earlyErrorGuard';

import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlertProvider } from './template';
import { DayProvider } from './contexts/DayContext';
import { PlusProvider } from './contexts/PlusContext';
import { AccountProvider } from './contexts/AccountContext';
import { useDay } from './hooks/useDay';

// import 'expo-router/entry'; // <- real app entry (restore after diagnosis)

SplashScreen.preventAutoHideAsync().catch(() => {});

function ErrorView({ title, error, extra }) {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#1A1916' }}
      contentContainerStyle={{ padding: 20, paddingTop: 64 }}
    >
      <Text style={{ color: '#F2ECE4', fontSize: 20, fontWeight: '700' }}>❌ {title}</Text>
      <Text style={{ color: '#E7A0C0', marginTop: 10, fontSize: 14 }}>
        {(error && error.name) || 'Error'}: {(error && error.message) || String(error)}
      </Text>
      {error && error.stack ? (
        <Text style={{ color: '#D2CCC3', marginTop: 12, fontSize: 10, fontFamily: 'Courier' }}>
          {error.stack}
        </Text>
      ) : null}
      {extra ? (
        <Text style={{ color: '#9A9097', marginTop: 12, fontSize: 10, fontFamily: 'Courier' }}>
          {extra}
        </Text>
      ) : null}
    </ScrollView>
  );
}

class Catch extends Component {
  state = { error: null, stack: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(_error, info) {
    this.setState({ stack: info && info.componentStack });
  }
  render() {
    if (this.state.error) {
      return <ErrorView title="Render / mount error" error={this.state.error} extra={this.state.stack} />;
    }
    return this.props.children;
  }
}

function Inner() {
  const day = useDay();
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
      <Text style={{ color: '#7A5478', fontSize: 22, fontWeight: '700' }}>✅ Providers mounted</Text>
      <Text style={{ color: '#9A9097', fontSize: 14, marginTop: 12 }}>
        day.isLoading: {String(day && day.isLoading)}
      </Text>
      <Text style={{ color: '#9A9097', fontSize: 13, marginTop: 16, textAlign: 'center', lineHeight: 19 }}>
        If you can read this, the providers are healthy — {'\n'}the fault is in the router / screens. 🦴
      </Text>
    </View>
  );
}

function MountProbe() {
  const [asyncErr, setAsyncErr] = useState(getLastStartupError());

  useEffect(() => {
    const t = setTimeout(() => SplashScreen.hideAsync().catch(() => {}), 50);
    const unsub = subscribeStartupError((e) => setAsyncErr(e));
    return () => {
      clearTimeout(t);
      unsub();
    };
  }, []);

  if (asyncErr) {
    return <ErrorView title="Async startup error (caught by guard)" error={asyncErr} />;
  }

  return (
    <Catch>
      <SafeAreaProvider>
        <AlertProvider>
          <DayProvider>
            <PlusProvider>
              <AccountProvider>
                <Inner />
              </AccountProvider>
            </PlusProvider>
          </DayProvider>
        </AlertProvider>
      </SafeAreaProvider>
    </Catch>
  );
}

registerRootComponent(MountProbe);
