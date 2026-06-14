# Home Screen widget (iOS) — setup plan

Small widget showing today's **energy + symptom tags**, a medium with **tasks
left + last reflection**, and the star of the show: a **Lola widget** where she
changes pose based on your energy. For the "make it part of my routine
seamlessly" feedback, this is the strongest single feature — it's *visible*
without remembering to open the app.

## ✅ You do NOT need a Mac
iOS widgets are native (WidgetKit / SwiftUI) and need a macOS compile — but
**EAS Build runs on Expo's cloud Macs**, so you build everything from your iPad:

1. The Swift + config live in the repo (I write them).
2. You run `eas build -p ios --profile development` (or production).
3. EAS compiles on a cloud Mac and gives you an install link; you test on iPhone.

No Mac to buy, no Xcode to install. The only trade-off: you can't live-preview
the Swift design in Xcode, so each visual tweak means another cloud build
(slower iteration). There is no JS-only iOS widget — native is unavoidable —
but the Mac requirement is solved by EAS. (Android widgets can be written in JS
via `react-native-android-widget`, but you're iOS-first.)

> ⚠️ I can't compile/test native widget code from the cloud editor, and adding a
> native target touches `app.json` (a place that can break EAS builds). So the
> safe order is: **get the plain app building on EAS/TestFlight first**, then add
> the widget as a follow-on — if a build breaks, we know it's the widget.

## The three designs — all possible
The RN side already computes everything (`services/widgetData.ts → WidgetSnapshot`):
```json
{ "checkedIn": true, "energyMode": "battery", "energyRemaining": 58,
  "energyMax": 100, "energyPercent": 58, "tasksDone": 2, "tasksTotal": 5,
  "pendingTasks": ["Eat lunch", "Shower"], "isFlareDay": false,
  "tags": ["pain","fatigue","brain fog"], "reflection": "Harder than expected",
  "updatedAt": 1750000000000 }
```
- **Small** → energy + top symptom tags ✓ (`energyRemaining`, `energyMode`, `tags`)
- **Medium** → energy + tasks left + last reflection ✓ (`pendingTasks`, `reflection`)
- **Lola** → pose by `energyPercent` ✓ (best one)

### Lola pose mapping
| Energy | Pose | Asset |
|---|---|---|
| ≥ 80% | standing | `lola-standing` ✅ have |
| 40–79% | sitting | `lola-sitting` ✅ have |
| 15–39% | lying on sofa | ⚠️ **new asset needed** |
| < 15% | face down on floor | ⚠️ **new asset needed** (or reuse `lola-xeyes`) |

So the Lola widget needs **2 new Lola drawings** (lying on sofa, face-down) to
fully land — when you make them, drop them in `assets/images/` and I'll add them
to the widget's asset catalog. Until then it can fall back to standing/sitting +
`xeyes` for the lowest.

### Battery vs Spoon asset sets
The snapshot carries `energyMode` *and* `energyPercent`, so the widget can show a
whole **different set of designs** depending on the measure the user picked, and
the right image for their current level. All images live in the widget's asset
catalog; the Swift selects by name.

Suggested file naming (flexible — tell me how many levels you drew per mode and
I'll match the buckets):
```
widget-battery-full   widget-spoon-full
widget-battery-high   widget-spoon-high
widget-battery-mid    widget-spoon-mid
widget-battery-low    widget-spoon-low
widget-battery-empty  widget-spoon-empty
```
Selector:
```swift
func widgetAsset(mode: String, pct: Int) -> String {
  let level: String
  switch pct {
  case 80...:    level = "full"
  case 60..<80:  level = "high"
  case 40..<60:  level = "mid"
  case 15..<40:  level = "low"
  default:       level = "empty"
  }
  return "widget-\(mode)-\(level)"   // e.g. widget-battery-mid, widget-spoon-low
}
```
(`mode` is `"battery"` or `"spoon"` straight from the snapshot.)


## Steps (when the main app is on TestFlight)
1. **App Group** — in the Apple Developer portal add `group.com.hassle.app` to the
   app id, and to both the app and widget entitlements.
2. **Install + configure** `@bacons/apple-targets`:
   ```
   npx expo install @bacons/apple-targets
   ```
   Add it to `app.json` plugins with the App Group; create `targets/widget/` with
   the Swift below + the Lola images in its asset catalog.
3. **Implement the bridge** — fill in `updateWidget()` in `services/widgetData.ts`
   to write the JSON to `UserDefaults(suiteName: "group.com.hassle.app")` and call
   `WidgetCenter.shared.reloadAllTimelines()`.
4. **Build** with EAS and add the widget on your iPhone.

### SwiftUI (starter — symptom, tasks, and Lola)
```swift
import WidgetKit
import SwiftUI

struct Entry: TimelineEntry {
  let date: Date
  let checkedIn: Bool; let energyMode: String
  let energyRemaining: Int; let energyPercent: Int
  let tasksDone: Int; let tasksTotal: Int
  let pendingTasks: [String]; let tags: [String]
  let reflection: String; let isFlareDay: Bool
}

func lolaAsset(for pct: Int) -> String {
  switch pct {
  case 80...: return "lola-standing"
  case 40..<80: return "lola-sitting"
  case 15..<40: return "lola-sofa"        // new asset
  default: return "lola-facedown"          // new asset (or "lola-xeyes")
  }
}

struct Provider: TimelineProvider {
  let suite = UserDefaults(suiteName: "group.com.hassle.app")
  func placeholder(in: Context) -> Entry { sample }
  func getSnapshot(in: Context, completion: @escaping (Entry) -> Void) { completion(load()) }
  func getTimeline(in: Context, completion: @escaping (Timeline<Entry>) -> Void) {
    let next = Calendar.current.date(byAdding: .hour, value: 1, to: Date())!
    completion(Timeline(entries: [load()], policy: .after(next)))
  }
  private func load() -> Entry {
    guard let raw = suite?.string(forKey: "today"),
          let d = raw.data(using: .utf8),
          let j = try? JSONSerialization.jsonObject(with: d) as? [String: Any]
    else { return sample }
    return Entry(date: Date(),
      checkedIn: j["checkedIn"] as? Bool ?? false,
      energyMode: j["energyMode"] as? String ?? "spoon",
      energyRemaining: j["energyRemaining"] as? Int ?? 0,
      energyPercent: j["energyPercent"] as? Int ?? 0,
      tasksDone: j["tasksDone"] as? Int ?? 0,
      tasksTotal: j["tasksTotal"] as? Int ?? 0,
      pendingTasks: j["pendingTasks"] as? [String] ?? [],
      tags: j["tags"] as? [String] ?? [],
      reflection: j["reflection"] as? String ?? "",
      isFlareDay: j["isFlareDay"] as? Bool ?? false)
  }
  private var sample: Entry {
    Entry(date: Date(), checkedIn: true, energyMode: "battery", energyRemaining: 58,
      energyPercent: 58, tasksDone: 2, tasksTotal: 5,
      pendingTasks: ["Eat lunch","Shower"], tags: ["pain","fatigue","brain fog"],
      reflection: "Harder than expected", isFlareDay: false)
  }
}

func energyText(_ e: Entry) -> String {
  e.energyMode == "battery" ? "\(e.energyRemaining)% battery"
                            : "\(e.energyRemaining) spoons left"
}

// Small — energy + symptom tags
struct SmallView: View { var e: Entry
  var body: some View {
    VStack(alignment: .leading, spacing: 6) {
      Text(energyText(e)).font(.headline)
      ForEach(e.tags.prefix(3), id: \.self) { Text($0).font(.subheadline).foregroundStyle(.secondary) }
    }.padding().containerBackground(.fill.tertiary, for: .widget).widgetURL(URL(string: "hassle://"))
  }
}

// Medium — tasks left + last reflection
struct MediumView: View { var e: Entry
  var body: some View {
    VStack(alignment: .leading, spacing: 4) {
      Text("Today's \(e.energyMode == "battery" ? "battery" : "energy"): \(energyText(e))").font(.subheadline)
      Text("Tasks left:").font(.caption).foregroundStyle(.secondary)
      ForEach(e.pendingTasks.prefix(2), id: \.self) { Text("◻︎ \($0)") }
      if !e.reflection.isEmpty {
        Text("Last reflection:").font(.caption).foregroundStyle(.secondary).padding(.top, 2)
        Text("\"\(e.reflection)\"").font(.footnote).italic()
      }
    }.padding().containerBackground(.fill.tertiary, for: .widget).widgetURL(URL(string: "hassle://"))
  }
}

// Lola — pose by energy
struct LolaView: View { var e: Entry
  var body: some View {
    VStack { Image(lolaAsset(for: e.energyPercent)).resizable().scaledToFit() }
      .padding().containerBackground(.fill.tertiary, for: .widget).widgetURL(URL(string: "hassle://"))
  }
}

struct HassleWidgetView: View {
  @Environment(\.widgetFamily) var family
  var entry: Entry
  var body: some View {
    switch family {
    case .systemSmall: SmallView(e: entry)
    default: MediumView(e: entry)
    }
  }
}

@main
struct HassleWidgets: WidgetBundle {
  var body: some Widget { HassleWidget(); LolaWidget() }
}
struct HassleWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "HassleWidget", provider: Provider()) { HassleWidgetView(entry: $0) }
      .configurationDisplayName("Hassle").description("Energy, tasks, and how today's going.")
      .supportedFamilies([.systemSmall, .systemMedium])
  }
}
struct LolaWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "LolaWidget", provider: Provider()) { LolaView(entry: $0) }
      .configurationDisplayName("Lola").description("Lola mirrors your energy.")
      .supportedFamilies([.systemSmall])
  }
}
```

## Phasing
1. **v1**: the three widgets above (Lola can start with standing/sitting + xeyes).
2. **v2**: deep-link straight to check-in if not started; lock-screen widget.
3. **Android** later: `react-native-android-widget` (JS) — separate effort.

When the main app is on TestFlight and you're ready, ping me — I'll wire the
plugin + `updateWidget()` and we kick a cloud build.
