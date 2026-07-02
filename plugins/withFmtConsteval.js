/**
 * withFmtConsteval — Expo config plugin (iOS).
 *
 * React Native 0.79 vendors a `fmt` whose format-string checks use C++
 * `consteval`. Xcode 26's clang treats those as HARD errors when the
 * expression isn't a constant expression:
 *
 *   error: call to consteval function
 *          'fmt::basic_format_string<...>::basic_format_string<FMT_COMPILE_STRING, 0>'
 *          is not a constant expression   (in fmt/src/format.cc)
 *
 * We used to dodge this by pinning Xcode 16.2, but that ships the iOS 18 SDK
 * and Apple now rejects App Store uploads not built against the iOS 26 SDK.
 * So we're back on the latest Xcode and fix `fmt` directly.
 *
 * HISTORY / why the source patch:
 *   - Attempt 1: define FMT_CONSTEVAL empty. fmt redefines that macro
 *     unconditionally, so the command-line value was clobbered. Failed.
 *   - Attempt 2: define FMT_USE_CONSTEVAL=0. The correct gate macro, BUT the
 *     `fmt` pod's compile pulls its -D defines from a *shared* Xcode response
 *     file, and the define didn't actually take hold for the fmt target —
 *     identical error persisted. Unreliable.
 *   - Attempt 3 (this): stop depending on preprocessor plumbing. In the
 *     Podfile post_install (which runs during `pod install`, after the pods are
 *     downloaded but before compile), physically rewrite fmt's headers so
 *     `#define FMT_CONSTEVAL consteval` becomes `#define FMT_CONSTEVAL` — i.e.
 *     the macro always expands to nothing. This is the same non-consteval
 *     fallback fmt uses on compilers without `consteval`; format-string
 *     checking just happens at runtime. Guaranteed to reach fmt because it
 *     edits the actual source the compiler reads. The FMT_USE_CONSTEVAL=0
 *     build setting is kept too, as harmless belt-and-braces.
 *
 * Runs during `expo prebuild` (patches the Podfile), so it survives
 * `prebuild --clean` regenerating the Podfile every CI build.
 *
 * @type {import('@expo/config-plugins').ConfigPlugin}
 */
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const MARKER = 'post_install do |installer|';
// Sentinel that proves our block is already in a given Podfile (idempotency).
const GUARD = 'withFmtConsteval';

const INJECTION = `${MARKER}
    # withFmtConsteval: Xcode 26's clang rejects fmt's consteval format-string
    # checks ("call to consteval function ... is not a constant expression" in
    # fmt/src/format.cc). Neutralise them two ways:
    #   1) FMT_USE_CONSTEVAL=0 build setting (belt), and
    #   2) physically rewrite fmt's headers so FMT_CONSTEVAL expands to nothing
    #      (braces) — reliable regardless of how Xcode plumbs -D defines through
    #      its response files.
    installer.pods_project.targets.each do |__fmt_target|
      __fmt_target.build_configurations.each do |__fmt_config|
        __fmt_defs = __fmt_config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] || ['$(inherited)']
        __fmt_defs = [__fmt_defs] unless __fmt_defs.is_a?(Array)
        __fmt_defs << 'FMT_USE_CONSTEVAL=0' unless __fmt_defs.include?('FMT_USE_CONSTEVAL=0')
        __fmt_config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] = __fmt_defs
      end
    end
    __fmt_root = File.join(installer.sandbox.root.to_s, 'fmt')
    if Dir.exist?(__fmt_root)
      __fmt_patched = 0
      Dir.glob(File.join(__fmt_root, '**', '*.h')).each do |__fmt_header|
        __fmt_text = File.read(__fmt_header)
        if __fmt_text.include?('define FMT_CONSTEVAL consteval')
          File.write(__fmt_header, __fmt_text.gsub('define FMT_CONSTEVAL consteval', 'define FMT_CONSTEVAL'))
          __fmt_patched += 1
        end
      end
      Pod::UI.puts "[withFmtConsteval] disabled fmt consteval in #{__fmt_patched} header(s)" if defined?(Pod::UI)
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
