// Hassle — app entry.
//
// Install the global JS error guard before anything else loads, then hand off to
// Expo Router. In development the guard delegates to React Native's red error
// overlay so the real message is visible; in production it shows our in-app
// error screen instead of aborting. See services/earlyErrorGuard.ts.
import './services/earlyErrorGuard';
import 'expo-router/entry';
