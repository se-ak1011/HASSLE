/**
 * Hassle — Home Screen widget target (@bacons/apple-targets).
 *
 * Auto-maps every Lola pose PNG in ./assets so the SwiftUI widget can load them
 * by name (e.g. Image("battery-80")). Shares the group.com.hassle.app App Group
 * with the main app so the RN side (services/widgetData.ts -> ExtensionStorage)
 * can push the daily snapshot the widget reads.
 *
 * @type {import('@bacons/apple-targets/app.plugin').Config}
 */
const fs = require('fs');
const path = require('path');

// Build { "battery-80": "./assets/battery-80.png", ... } from whatever ships.
const images = fs
  .readdirSync(path.join(__dirname, 'assets'))
  .filter((f) => f.toLowerCase().endsWith('.png'))
  .reduce((acc, f) => {
    acc[path.basename(f, path.extname(f))] = `./assets/${f}`;
    return acc;
  }, {});

module.exports = {
  type: 'widget',
  name: 'Hassle',
  // Matches the app's dark, plum palette (constants/theme.ts).
  colors: {
    $widgetBackground: '#191A1C',
    $accent: '#7A5478',
    $text: '#F2ECE4',
    $textMuted: '#9A9097',
  },
  images,
  entitlements: {
    'com.apple.security.application-groups': ['group.com.hassle.app'],
  },
};
