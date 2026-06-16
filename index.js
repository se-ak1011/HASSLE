// Hassle — app entry.
//
// Install the global JS error guard before anything else loads, then hand off to
// Expo Router. In development the guard delegates to React Native's red error
// overlay so the real message is visible; in production it shows our in-app
// error screen instead of aborting. See services/earlyErrorGuard.ts.
import './services/earlyErrorGuard';

// Startup tracing — shows in the Metro terminal so we can see how far startup
// gets if it hangs. Remove once the startup issue is resolved.
// eslint-disable-next-line no-console
console.log('[HSTART] entry: guard installed, loading expo-router…');
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('expo-router/entry');
// eslint-disable-next-line no-console
console.log('[HSTART] entry: expo-router loaded');
