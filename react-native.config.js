/**
 * React Native autolinking config.
 *
 * Hassle is a gentle daily planner. The starter template it grew out of pulled
 * in a large set of heavyweight native modules that the app never imports or
 * uses. Even though no JavaScript references them, autolinking still compiled
 * them into the iOS binary and initialised them at launch — and at least one
 * was throwing a native Objective-C exception on a background queue during
 * startup, crashing the app right after the splash screen.
 *
 * Setting a dependency's platforms to `null` removes it from the native build
 * via autolinking, WITHOUT removing the npm package or changing the lockfile.
 * The JS packages stay installed but dormant. If any of these is genuinely
 * needed later, delete its line here and rebuild.
 *
 * Verified unused in app source before excluding (see commit history). The real
 * startup crash turned out to be a missing iOS calendar permission, not any of
 * these — but they're still dead weight, so they stay excluded. The one
 * exception is `react-native-purchases` (RevenueCat), now re-enabled for IAP.
 */
const off = { platforms: { ios: null, android: null } };

module.exports = {
  dependencies: {
    // Heavyweight, obviously-unused frameworks (round 1).
    'react-native-webrtc': off,
    '@stripe/stripe-react-native': off,
    'react-native-maps': off,
    '@shopify/react-native-skia': off,
    'react-native-keyboard-controller': off,
    'react-native-webview': off,

    // Classic-bridge modules the app never calls.
    'lottie-react-native': off,
    '@react-native-community/netinfo': off,
    '@react-native-community/datetimepicker': off,
    '@react-native-community/slider': off,
    '@react-native-segmented-control/segmented-control': off,
    '@react-native-clipboard/clipboard': off,
    'react-native-pager-view': off,
    'react-native-view-shot': off,
    '@shopify/flash-list': off,
  },
};
