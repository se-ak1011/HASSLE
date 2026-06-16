// Hassle — custom app entry.
//
// Install the global JS error guard BEFORE anything else loads, then hand off to
// Expo Router's normal entry. Doing this at the true entry point (rather than
// inside a React component) means a startup error is caught even if it fires
// before the UI mounts — so the app shows the real message instead of aborting
// via RCTFatal. See services/earlyErrorGuard.ts.
import './services/earlyErrorGuard';
import 'expo-router/entry';
