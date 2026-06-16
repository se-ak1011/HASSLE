// Hassle — TEMPORARY progressive mount probe.
//
// No crash report + stuck on splash = a HANG (deadlock), not a throw: mounting
// the provider stack blocks the JS thread before anything can render. React runs
// child effects before the root's splash-hide effect, so a blocking provider
// effect strands us on the splash.
//
// This probe hides the splash FIRST, then mounts the providers ONE AT A TIME
// (~1.2s apart) with a live checklist. Each provider shows ◦ waiting → ⏳
// mounting → ✅ ok. If the app FREEZES, exactly one stays ⏳ — that's the
// culprit. Render/async errors are still surfaced too. Restore the real entry
// (commented line) after diagnosis.
import './services/earlyErrorGuard';
import React, { useEffect, useState, Component } from 'react';
import { View, Text, ScrollView } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { registerRootComponent } from 'expo';
import { getLastStartupError, subscribeStartupError } from './services/earlyErrorGuard';

import { AlertProvider } from './template';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DayProvider } from './contexts/DayContext';
import { PlusProvider } from './contexts/PlusContext';
import { AccountProvider } from './contexts/AccountContext';

// import 'expo-router/entry'; // <- real app entry (restore after diagnosis)

SplashScreen.preventAutoHideAsync().catch(() => {});

// Same order as app/_layout.
const PROVIDERS = [
  ['AlertProvider', AlertProvider],
  ['SafeAreaProvider', SafeAreaProvider],
  ['DayProvider', DayProvider],
  ['PlusProvider', PlusProvider],
  ['AccountProvider', AccountProvider],
];

function ErrorView({ title, error }) {
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
    </ScrollView>
  );
}

class Catch extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error) {
    if (this.props.onError) this.props.onError(error);
  }
  render() {
    return this.state.error ? null : this.props.children;
  }
}

function ProgressiveProbe() {
  const [count, setCount] = useState(0);
  const [splashHidden, setSplashHidden] = useState(false);
  const [err, setErr] = useState(getLastStartupError());

  useEffect(() => {
    SplashScreen.hideAsync()
      .catch(() => {})
      .finally(() => setSplashHidden(true));
    const unsub = subscribeStartupError((e) => setErr(e));
    return unsub;
  }, []);

  useEffect(() => {
    if (!splashHidden) return;
    if (count > PROVIDERS.length) return;
    const t = setTimeout(() => setCount((c) => c + 1), 1200);
    return () => clearTimeout(t);
  }, [splashHidden, count]);

  if (err) return <ErrorView title="Error caught during mount" error={err} />;

  const n = Math.min(count, PROVIDERS.length);
  let tree = <View />;
  for (let i = n - 1; i >= 0; i--) {
    const P = PROVIDERS[i][1];
    tree = <P>{tree}</P>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#1A1916', padding: 20, paddingTop: 64 }}>
      <Text style={{ color: '#F2ECE4', fontSize: 20, fontWeight: '700' }}>Provider mount probe 🦴</Text>
      <Text style={{ color: '#9A9097', fontSize: 13, marginTop: 6, marginBottom: 18 }}>
        Mounts providers one by one. If it FREEZES, the one stuck on ⏳ is the
        culprit. Screenshot it.
      </Text>

      {PROVIDERS.map(([name], i) => {
        let mark = '◦';
        let color = '#6B6B6B';
        if (count > i + 1) {
          mark = '✅';
          color = '#9A9097';
        } else if (count === i + 1) {
          mark = '⏳';
          color = '#E7A0C0';
        }
        return (
          <Text key={name} style={{ color, fontSize: 16, marginBottom: 8 }}>
            {mark}  {name}
          </Text>
        );
      })}

      {count > PROVIDERS.length ? (
        <Text style={{ color: '#7A5478', fontSize: 16, marginTop: 16 }}>
          ✅ All providers mounted — the fault is in the router / screens.
        </Text>
      ) : null}

      {/* Providers mount here (off-screen) so their effects run while the
          checklist above stays visible. */}
      <View style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }} pointerEvents="none">
        <Catch onError={setErr}>{tree}</Catch>
      </View>
    </View>
  );
}

registerRootComponent(ProgressiveProbe);
