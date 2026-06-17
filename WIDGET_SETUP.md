# Home Screen widget setup (iOS)

Status: **scaffolded on branch `claude/ios-widget-groundwork`.** `main` is
untouched — this never affects your normal builds until you deliberately build
this branch. The Swift is written but **untested** (no Mac to preview), so expect
1–2 EAS build iterations to polish it.

## What's already done (on the branch)
- **`@bacons/apple-targets`** plugin installed + added to `app.json` plugins.
- **App Group** `group.com.hassle.app` declared in `app.json` (`ios.entitlements`)
  and in the widget target — this is the shared box the app and widget talk through.
- **Apple Team ID** `6R7SGGG57X` set in `app.json` (`ios.appleTeamId`).
- **Widget target** in `targets/widget/`:
  - `expo-target.config.js` — auto-maps every Lola pose in `targets/widget/assets/`
    (the 16 `battery-*` / `spoon-*` images), dark plum palette.
  - `index.swift` — SwiftUI widget (small + medium) that reads the snapshot and
    shows Lola's pose, energy (% or spoons), flare flag, and tasks done / next.
  - `Info.plist` — WidgetKit extension.
- **Data bridge (RN side):** `services/widgetData.ts` now computes Lola's `pose`
  (nearest battery %/spoon level) and writes the whole snapshot into the App Group
  via `ExtensionStorage`, then calls `reloadWidget()`. `DayContext` already calls
  this whenever the day/energy changes, so the widget stays live. It's a safe
  no-op on web / on `main` (lazy-loaded).

## What's left (do these together when ready — after RevenueCat)

### 1. Register the App Group in Apple (likely automatic)
EAS Build usually creates the App Group and adds it to the provisioning profile
automatically because the entitlement is in `app.json`. If a build complains
about the group, register it manually:
- developer.apple.com → **Certificates, Identifiers & Profiles** → **Identifiers**
  → top-right filter → **App Groups** → **＋** → description "Hassle", id
  **`group.com.hassle.app`**.
- Then **Identifiers → App IDs → com.hassle.app → App Groups → Edit** → tick it.

### 2. Build the branch
```
git checkout claude/ios-widget-groundwork
git pull origin claude/ios-widget-groundwork
eas build --platform ios --profile preview
```
(Use `--profile development` if you want to keep iterating the Swift live.)

### 3. Add the widget
Install the build → long-press the Home Screen → **＋** → search **Hassle** → add
the small or medium widget. Do a check-in in the app so there's data to show.

### 4. Expect to iterate
The SwiftUI is a careful first pass but unproven on-device. Likely tweaks:
image sizing, text truncation, the `containerBackground`. Each fix is a quick
rebuild. Send me a screenshot and I'll adjust.

## When it's working
Merge `claude/ios-widget-groundwork` into `main` so the widget ships with the app
(this also brings `@bacons/apple-targets` + the App Group into the main build —
which is why we kept it on a branch until proven).

## Notes
- The widget target is additive — no `react-native-purchases`-style exclusions needed.
- The pose buckets live in `services/widgetData.ts` (`BATTERY_LEVELS` /
  `SPOON_LEVELS`) — easy to retune to match the art.
- Live Activities / Lock Screen widgets are a later, separate target if wanted.
