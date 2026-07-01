import WidgetKit
import SwiftUI

// MARK: - Shared data (App Group)

private let appGroup = "group.com.hassle.app"
private let snapshotKey = "snapshot"

struct HassleSnapshot: Codable {
    var checkedIn: Bool
    var energyMode: String
    var energyRemaining: Double
    var energyMax: Double
    var energyPercent: Int
    var pose: String
    var tasksDone: Int
    var tasksTotal: Int
    var pendingTasks: [String]
    var isFlareDay: Bool
    var tags: [String]
    var reflection: String?
}

func loadSnapshot() -> HassleSnapshot? {
    guard let defaults = UserDefaults(suiteName: appGroup),
          let raw = defaults.string(forKey: snapshotKey),
          let data = raw.data(using: .utf8) else { return nil }
    return try? JSONDecoder().decode(HassleSnapshot.self, from: data)
}

// MARK: - Timeline

struct HassleEntry: TimelineEntry {
    let date: Date
    let snapshot: HassleSnapshot?
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> HassleEntry {
        HassleEntry(date: Date(), snapshot: nil)
    }
    func getSnapshot(in context: Context, completion: @escaping (HassleEntry) -> Void) {
        completion(HassleEntry(date: Date(), snapshot: loadSnapshot()))
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<HassleEntry>) -> Void) {
        let entry = HassleEntry(date: Date(), snapshot: loadSnapshot())
        // Fallback hourly refresh; the app also reloads the widget on changes.
        let next = Calendar.current.date(byAdding: .hour, value: 1, to: Date())
            ?? Date().addingTimeInterval(3600)
        completion(Timeline(entries: [entry], policy: .after(next)))
    }
}

// MARK: - Colours (match constants/theme.ts)

extension Color {
    init(hexString: String) {
        let scanner = Scanner(string: hexString.replacingOccurrences(of: "#", with: ""))
        var rgb: UInt64 = 0
        scanner.scanHexInt64(&rgb)
        self.init(
            .sRGB,
            red: Double((rgb >> 16) & 0xFF) / 255,
            green: Double((rgb >> 8) & 0xFF) / 255,
            blue: Double(rgb & 0xFF) / 255,
            opacity: 1
        )
    }
}

private let hassleBg = Color(hexString: "#191A1C")
private let hassleText = Color(hexString: "#F2ECE4")
private let hassleMuted = Color(hexString: "#9A9097")
private let hassleAccent = Color(hexString: "#7A5478")

// MARK: - View

struct HassleWidgetView: View {
    @Environment(\.widgetFamily) var family
    var entry: HassleEntry

    var body: some View {
        if let snapshot = entry.snapshot {
            switch family {
            case .systemMedium:
                mediumView(snapshot)
            default:
                smallView(snapshot)
            }
        } else {
            emptyView
        }
    }

    private func energyLabel(_ s: HassleSnapshot) -> String {
        if s.energyMode == "battery" {
            return "\(s.energyPercent)% energy"
        }
        let spoons = Int(s.energyRemaining.rounded())
        return "\(spoons) \(spoons == 1 ? "spoon" : "spoons") left"
    }

    private func smallView(_ s: HassleSnapshot) -> some View {
        VStack(spacing: 6) {
            Image(s.pose)
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(maxHeight: 72)
            Text(energyLabel(s))
                .font(.system(size: 15, weight: .bold))
                .foregroundColor(hassleText)
            Text("\(s.tasksDone)/\(s.tasksTotal) done")
                .font(.system(size: 12))
                .foregroundColor(hassleMuted)
        }
        .padding(12)
    }

    private func mediumView(_ s: HassleSnapshot) -> some View {
        HStack(spacing: 14) {
            Image(s.pose)
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(maxHeight: 96)
            VStack(alignment: .leading, spacing: 5) {
                Text(energyLabel(s))
                    .font(.system(size: 17, weight: .bold))
                    .foregroundColor(hassleText)
                if s.isFlareDay {
                    Text("Flare day — be gentle 💜")
                        .font(.system(size: 12))
                        .foregroundColor(hassleAccent)
                }
                Text("\(s.tasksDone)/\(s.tasksTotal) done")
                    .font(.system(size: 13))
                    .foregroundColor(hassleMuted)
                if let first = s.pendingTasks.first {
                    Text("Next: \(first)")
                        .font(.system(size: 12))
                        .foregroundColor(hassleMuted)
                        .lineLimit(1)
                }
            }
            Spacer(minLength: 0)
        }
        .padding(14)
    }

    private var emptyView: some View {
        VStack(spacing: 6) {
            Text("Hassle")
                .font(.system(size: 16, weight: .bold))
                .foregroundColor(hassleText)
            Text("Open the app to check in")
                .font(.system(size: 12))
                .foregroundColor(hassleMuted)
                .multilineTextAlignment(.center)
        }
        .padding(12)
    }
}

// MARK: - Widget

struct HassleWidget: Widget {
    let kind = "HassleWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            if #available(iOS 17.0, *) {
                HassleWidgetView(entry: entry)
                    .containerBackground(for: .widget) { hassleBg }
            } else {
                HassleWidgetView(entry: entry)
                    .background(hassleBg)
            }
        }
        .configurationDisplayName("Hassle")
        .description("Your energy and tasks at a glance.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

@main
struct HassleWidgetBundle: WidgetBundle {
    var body: some Widget {
        HassleWidget()
    }
}
