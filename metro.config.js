const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

/**
 * Workaround for pnpm's deduped-but-unbuilt expo-modules-core copy.
 *
 * In some pnpm layouts Metro resolves `expo-modules-core` to the flat-hoisted
 * copy at node_modules/.pnpm/node_modules/expo-modules-core whose build/
 * directory was never compiled (only the versioned per-package copy has it).
 * Pointing extraNodeModules at the project-level symlink ensures Metro always
 * lands on the copy that actually has build/index.js.
 */
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'expo-modules-core': path.resolve(__dirname, 'node_modules/expo-modules-core'),
};

module.exports = config;
