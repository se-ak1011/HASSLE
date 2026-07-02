/**
 * withFmtConsteval — Expo config plugin (iOS).
 *
 * React Native 0.79 vendors an older `fmt` whose format-string checks use
 * C++ `consteval`. Xcode 26's clang treats those as HARD errors when the
 * expression isn't a constant expression:
 *
 *   error: call to consteval function 'fmt::detail::...' is not a
 *          constant expression
 *
 * We used to dodge this by pinning Xcode 16.2, but that ships the iOS 18 SDK
 * and Apple now rejects App Store uploads not built against the iOS 26 SDK.
 * So we're back on the latest Xcode and fix `fmt` directly instead: define
 * `FMT_USE_CONSTEVAL=0`.
 *
 * NOTE: the macro to override is FMT_USE_CONSTEVAL, *not* FMT_CONSTEVAL. fmt
 * redefines FMT_CONSTEVAL unconditionally (no #ifndef guard), so a command-line
 * `-DFMT_CONSTEVAL=` gets clobbered by the header — which is exactly why the
 * first attempt still failed. FMT_USE_CONSTEVAL, by contrast, IS #ifndef-
 * guarded, so forcing it to 0 sticks and makes fmt define FMT_CONSTEVAL empty
 * itself — the same non-consteval fallback path it uses on compilers without
 * `consteval`. Format-string checking just happens at runtime instead of
 * compile time; harmless for a release build.
 *
 * Applied to every Pod target (fmt itself, plus RCT-Folly / React core, which
 * include fmt headers). Runs during `expo prebuild`, so it survives
 * `prebuild --clean` regenerating the Podfile every CI build.
 *
 * @type {import('@expo/config-plugins').ConfigPlugin}
 */
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const MARKER = 'post_install do |installer|';
const GUARD = "FMT_USE_CONSTEVAL=0";

const INJECTION = `${MARKER}
    # withFmtConsteval: disable fmt's consteval format-string checks so the
    # project builds under Xcode 26's clang (needed for the iOS 26 SDK / App
    # Store). FMT_USE_CONSTEVAL=0 => fmt defines FMT_CONSTEVAL empty itself.
    installer.pods_project.targets.each do |__fmt_target|
      __fmt_target.build_configurations.each do |__fmt_config|
        __fmt_defs = __fmt_config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] || ['$(inherited)']
        __fmt_defs = [__fmt_defs] unless __fmt_defs.is_a?(Array)
        __fmt_defs << '${GUARD}' unless __fmt_defs.include?('${GUARD}')
        __fmt_config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] = __fmt_defs
      end
    end`;

module.exports = function withFmtConsteval(config) {
  return withDangerousMod(config, [
    'ios',
    (config) => {
      const podfilePath = path.join(
        config.modRequest.platformProjectRoot,
        'Podfile'
      );
      let contents = fs.readFileSync(podfilePath, 'utf8');

      if (contents.includes(GUARD)) {
        return config; // already patched
      }
      if (!contents.includes(MARKER)) {
        throw new Error(
          `withFmtConsteval: could not find "${MARKER}" in the Podfile.`
        );
      }

      // Only patch the first (Expo's) post_install block.
      contents = contents.replace(MARKER, INJECTION);
      fs.writeFileSync(podfilePath, contents);
      return config;
    },
  ]);
};
