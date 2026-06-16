// Hassle — TEMPORARY startup probe entry.
//
// The standalone diagnostic proved the RN shell, bundle and splash all work, so
// the startup fault is a module that throws the moment it's loaded (before any
// screen renders — which is why expo-router never mounts and the splash sticks).
//
// This probe loads each module in dependency order (leaves first) inside a
// try/catch and shows ✅/❌ per module. The FIRST ❌ is the culprit, and its
// error message is printed right there. Once we know it, we fix that file and
// restore the real entry (the commented line below).
import './services/earlyErrorGuard';
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { registerRootComponent } from 'expo';

// import 'expo-router/entry'; // <- real app entry (restore after diagnosis)

SplashScreen.preventAutoHideAsync().catch(() => {});

// Ordered leaves -> up. require() runs a module's top-level code (and its
// imports'), so the first one that throws localises the failure.
const PROBES = [
  ['constants/Colors', () => require('./constants/Colors')],
  ['constants/theme', () => require('./constants/theme')],
  ['constants/types', () => require('./constants/types')],
  ['constants/lola', () => require('./constants/lola')],
  ['constants/pricing', () => require('./constants/pricing')],
  ['constants/conditions', () => require('./constants/conditions')],
  ['constants/library', () => require('./constants/library')],
  ['services/dates', () => require('./services/dates')],
  ['services/formatCost', () => require('./services/formatCost')],
  ['services/storage', () => require('./services/storage')],
  ['services/supabase', () => require('./services/supabase')],
  ['services/billing', () => require('./services/billing')],
  ['services/widgetData', () => require('./services/widgetData')],
  ['services/syncService', () => require('./services/syncService')],
  ['services/notificationService', () => require('./services/notificationService')],
  ['services/exportService', () => require('./services/exportService')],
  ['hooks/useFontFamily', () => require('./hooks/useFontFamily')],
  ['hooks/useDay', () => require('./hooks/useDay')],
  ['template', () => require('./template')],
  ['components/ErrorBoundary', () => require('./components/ErrorBoundary')],
  ['contexts/DayContext', () => require('./contexts/DayContext')],
  ['contexts/PlusContext', () => require('./contexts/PlusContext')],
  ['contexts/AccountContext', () => require('./contexts/AccountContext')],
  ['app/_layout', () => require('./app/_layout')],
  ['app/index', () => require('./app/index')],
  ['app/onboarding', () => require('./app/onboarding')],
  ['app/checkin', () => require('./app/checkin')],
  ['app/account', () => require('./app/account')],
  ['app/library', () => require('./app/library')],
  ['app/directory', () => require('./app/directory')],
  ['app/report', () => require('./app/report')],
  ['app/+not-found', () => require('./app/+not-found')],
  ['app/(tabs)/_layout', () => require('./app/(tabs)/_layout')],
  ['app/(tabs)/index', () => require('./app/(tabs)/index')],
  ['app/(tabs)/patterns', () => require('./app/(tabs)/patterns')],
  ['app/(tabs)/plus', () => require('./app/(tabs)/plus')],
  ['app/(tabs)/reflect', () => require('./app/(tabs)/reflect')],
  ['app/(tabs)/settings', () => require('./app/(tabs)/settings')],
];

function Probe() {
  const [results, setResults] = useState([]);
  const [firstFail, setFirstFail] = useState(null);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
    const out = [];
    let failed = null;
    for (const [name, fn] of PROBES) {
      try {
        fn();
        out.push({ name, ok: true });
      } catch (e) {
        const msg = (e && e.message) || String(e);
        out.push({ name, ok: false, msg });
        if (!failed) failed = { name, msg, stack: e && e.stack };
      }
    }
    setResults(out);
    setFirstFail(failed);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#1A1916' }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 64 }}>
        <Text style={{ color: '#F2ECE4', fontSize: 20, fontWeight: '700' }}>
          Hassle startup probe 🦴
        </Text>
        <Text style={{ color: '#9A9097', fontSize: 13, marginTop: 6, marginBottom: 16 }}>
          The first ❌ is the module that breaks startup. Screenshot this.
        </Text>

        {firstFail ? (
          <View
            style={{
              backgroundColor: '#3D2638',
              borderRadius: 12,
              padding: 14,
              marginBottom: 18,
            }}
          >
            <Text style={{ color: '#F2ECE4', fontWeight: '700', fontSize: 15 }}>
              ❌ First failure: {firstFail.name}
            </Text>
            <Text style={{ color: '#F2ECE4', marginTop: 8, fontSize: 13 }}>
              {firstFail.msg}
            </Text>
            {firstFail.stack ? (
              <Text style={{ color: '#D2CCC3', marginTop: 8, fontSize: 10, fontFamily: 'Courier' }}>
                {firstFail.stack}
              </Text>
            ) : null}
          </View>
        ) : results.length ? (
          <Text style={{ color: '#7A5478', marginBottom: 18, fontSize: 15 }}>
            ✅ All modules loaded cleanly — the fault is a runtime/mount error, not
            a load-time one. Tell me and I&apos;ll switch to the mount probe.
          </Text>
        ) : null}

        {results.map((r) => (
          <Text key={r.name} style={{ color: r.ok ? '#9A9097' : '#E7A0C0', fontSize: 13, marginBottom: 3 }}>
            {r.ok ? '✅' : '❌'} {r.name}
            {r.ok ? '' : ` — ${r.msg}`}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

registerRootComponent(Probe);
