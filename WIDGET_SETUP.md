# Home Screen widget (iOS) — setup plan

A small widget showing today's **energy left**, **tasks done**, and a **flare**
marker, tapping through to the app. For the feedback person ("make it part of my
routine seamlessly") this is the strongest single feature: it's *visible* without
remembering to open the app.

> ⚠️ **This is a Mac + Xcode task.** iOS widgets are native (WidgetKit / SwiftUI).
> They can't be built in the cloud editor or run in Expo Go — they need a dev/
> standalone build. The RN side is already done (`services/widgetData.ts` computes
> the snapshot on every day change); what's left is native.

## How the data gets to the widget
The app and the widget share an **App Group** container. The RN app writes a tiny
JSON snapshot to the group's `UserDefaults`; the widget reads it and renders.

Snapshot shape (already produced by `buildWidgetSnapshot`):
```json
{ "date": "2026-06-14", "checkedIn": true, "energyMode": "spoon",
  "energyRemaining": 6, "energyMax": 12, "tasksDone": 2, "tasksTotal": 5,
  "isFlareDay": false, "updatedAt": 1750000000000 }
```

## Recommended approach
Use **`@bacons/apple-targets`** (Evan Bacon's Expo config plugin for native
targets) — it lets you add a WidgetKit extension to an Expo app and wires the App
Group. Alternative: `react-native-widget-extension`.

### Steps
1. **App Group** — in the Apple Developer portal, add `group.com.hassle.app` to
   the app's identifier, and add the entitlement to both the app and the widget.
2. **Install + configure** the plugin:
   ```
   npx expo install @bacons/apple-targets
   ```
   Add it to `app.json` plugins with the App Group, and create a `targets/widget`
   folder with the Swift below.
3. **Implement the bridge** — in `services/widgetData.ts`, fill in `updateWidget`
   to write the JSON to the App Group `UserDefaults(suiteName: "group.com.hassle.app")`
   and call `WidgetCenter.shared.reloadAllTimelines()`. (`@bacons/apple-targets`
   exposes a shared-defaults helper; or a 10-line native module.)
4. **Build** with `eas build` (dev or production) and add the widget on a device.

### SwiftUI widget (starter)
```swift
import WidgetKit
import SwiftUI

struct HassleEntry: TimelineEntry {
  let date: Date
  let energyRemaining: Int
  let energyMax: Int
  let energyMode: String
  let tasksDone: Int
  let tasksTotal: Int
  let isFlareDay: Bool
  let checkedIn: Bool
}

struct Provider: TimelineProvider {
  let suite = UserDefaults(suiteName: "group.com.hassle.app")

  func placeholder(in: Context) -> HassleEntry { sample }
  func getSnapshot(in: Context, completion: @escaping (HassleEntry) -> Void) { completion(load()) }
  func getTimeline(in: Context, completion: @escaping (Timeline<HassleEntry>) -> Void) {
    // Refresh roughly hourly; the app also pushes reloads on changes.
    let next = Calendar.current.date(byAdding: .hour, value: 1, to: Date())!
    completion(Timeline(entries: [load()], policy: .after(next)))
  }

  private func load() -> HassleEntry {
    guard let raw = suite?.string(forKey: "today"),
          let data = raw.data(using: .utf8),
          let j = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
    else { return sample }
    return HassleEntry(
      date: Date(),
      energyRemaining: j["energyRemaining"] as? Int ?? 0,
      energyMax: j["energyMax"] as? Int ?? 0,
      energyMode: j["energyMode"] as? String ?? "spoon",
      tasksDone: j["tasksDone"] as? Int ?? 0,
      tasksTotal: j["tasksTotal"] as? Int ?? 0,
      isFlareDay: j["isFlareDay"] as? Bool ?? false,
      checkedIn: j["checkedIn"] as? Bool ?? false)
  }
  private var sample: HassleEntry {
    HassleEntry(date: Date(), energyRemaining: 6, energyMax: 12, energyMode: "spoon",
                tasksDone: 2, tasksTotal: 5, isFlareDay: false, checkedIn: true)
  }
}

struct HassleWidgetView: View {
  var entry: HassleEntry
  var body: some View {
    VStack(alignment: .leading, spacing: 6) {
      Text(entry.isFlareDay ? "Flare day" : "Today")
        .font(.caption).foregroundStyle(entry.isFlareDay ? .pink : .secondary)
      if entry.checkedIn {
        Text(entry.energyMode == "battery"
             ? "\(entry.energyRemaining)% left"
             : "\(entry.energyRemaining) spoons left")
          .font(.headline)
        Text("\(entry.tasksDone)/\(entry.tasksTotal) done")
          .font(.subheadline).foregroundStyle(.secondary)
      } else {
        Text("Tap to start your day").font(.subheadline)
      }
    }
    .padding()
    .containerBackground(.fill.tertiary, for: .widget)
    .widgetURL(URL(string: "hassle://"))
  }
}

@main
struct HassleWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "HassleWidget", provider: Provider()) { entry in
      HassleWidgetView(entry: entry)
    }
    .configurationDisplayName("Hassle")
    .description("Today's energy and tasks at a glance.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}
```

## Phasing
1. **v1** (above): read-only status widget, small + medium, taps into the app.
2. **v2**: deep-link straight to check-in if not yet started; lock-screen widget.
3. **Android** later: separate effort (Glance / Kotlin) — iOS first.

When you're at a Mac with Xcode and ready to do a dev build, ping me — I'll fill
in `updateWidget` and the plugin config to match whichever library you pick.
