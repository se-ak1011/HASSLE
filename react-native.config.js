/**
 * React Native autolinking config.
 *
 * Hassle is a gentle daily planner. The starter template it grew out of pulled
 * in a large set of heavyweight native modules that the app never imports or
 * uses (video calling, payments SDK, maps, a GPU canvas, a keyboard engine).
 * Even though no JavaScript references them, autolinking still compiled them
 * into the iOS binary and initialised them at launch — and at least one
 * (react-native-webrtc, whose WebRTC.framework was loaded in the startup crash
 * report) threw a native Objective-C exception during launch, crashing the app
 * right after the splash screen.
 *
 * Setting a dependency's platforms to `null` removes it from the native build
 * via autolinking, WITHOUT removing the npm package or changing the lockfile.
 * The JS packages stay installed but dormant. If any of these is genuinely
 * needed later, delete its line here and rebuild.
 */
module.exports = {
  dependencies: {
    'react-native-webrtc': { platforms: { ios: null, android: null } },
    '@stripe/stripe-react-native': { platforms: { ios: null, android: null } },
    'react-native-maps': { platforms: { ios: null, android: null } },
    '@shopify/react-native-skia': { platforms: { ios: null, android: null } },
    'react-native-keyboard-controller': { platforms: { ios: null, android: null } },
    'react-native-webview': { platforms: { ios: null, android: null } },
  },
};
