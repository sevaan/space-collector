import WidgetKit
import SwiftUI

// Space Collector widgets (2026-10-22, Sevaan; design/widgets.html, style A: the card's picture sits in the target
// circle and the circle's ring counts down to the pass). One idea in every size: what to look up for next, and when.
// The app writes tonight's plan (js/main.js sendWidgets → App/WidgetBridge.swift) to plan.json in the shared App Group,
// with the small card pictures as art/<name>.png. The widget steps through it by itself: `chain` is the next catch from
// each moment on, so countdowns stay right all night without the app. Every widget comes with Plus (2026-10-22, Sevaan);
// without it they show what Plus is, and the widget gallery shows a sample night.

// MARK: - The plan

struct Pass: Codable, Hashable {
    let key: String, name: String, tier: String, icon: Bool, art: String?
    let start: Double, end: Double, `where`: String, short: String, kick: String, cloud: Bool
    var startDate: Date { Date(timeIntervalSince1970: start / 1000) }
    var endDate: Date { Date(timeIntervalSince1970: end / 1000) }
    var url: URL { URL(string: "spacecollector://pass/" + (key.addingPercentEncoding(withAllowedCharacters: .alphanumerics) ?? key))! }
}
struct Step: Codable { let from: Double; let pass: Pass }
struct Haul: Codable { let n: Int; let top: String?; let topN: Int }
struct Wx: Codable { let ok: Bool; let line: String; let next: String }
struct Plan: Codable {
    let at: Double, place: String, plus: Bool, dusk: Double?, dawn: Double, eve: Double
    let chain: [Step], list: [Pass], run: [Pass], back: Double?, haul: Haul, bars: [Double], wx: Wx?, missions: Int
    var duskDate: Date? { dusk.map { Date(timeIntervalSince1970: $0 / 1000) } }
    var dawnDate: Date { Date(timeIntervalSince1970: dawn / 1000) }
}

enum Store {
    static var dir: URL? {
        let id = (Bundle.main.bundleIdentifier ?? "").replacingOccurrences(of: ".widgets", with: "")
        return FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: "group." + id)
    }
    static func plan() -> Plan? {
        guard let d = dir, let data = try? Data(contentsOf: d.appendingPathComponent("plan.json")) else { return nil }
        return try? JSONDecoder().decode(Plan.self, from: data)
    }
    static func art(_ name: String?) -> UIImage? {
        guard let n = name, let d = dir else { return nil }
        return UIImage(contentsOfFile: d.appendingPathComponent("art/\(n).png").path)
    }
}

// What a widget shows at a given moment.
enum Moment {
    case day(dusk: Date, head: Pass?)   // before dark: counting to dark, tonight's headliner named
    case next(Pass)                     // the next catch, counting down
    case upNow(Pass)                    // it's up: where to look
    case cloudy(Wx)                     // no countdown on a cloudy night
    case late(back: Date?)              // satellites are in Earth's shadow
    case noPlan                         // the app hasn't planned tonight
}
func moment(_ plan: Plan?, at d: Date) -> Moment {
    guard let p = plan, d < p.dawnDate, d.timeIntervalSince1970 * 1000 - p.at < 20 * 3600_000 else { return .noPlan }
    if let w = p.wx, !w.ok { return .cloudy(w) }
    let step = p.chain.last { Date(timeIntervalSince1970: $0.from / 1000) <= d && $0.pass.endDate > d }
        ?? p.chain.first { $0.pass.endDate > d }
    if let dusk = p.duskDate, d < dusk.addingTimeInterval(-45 * 60), (step == nil || step!.pass.startDate > dusk.addingTimeInterval(-45 * 60)) {
        return .day(dusk: dusk, head: p.chain.first { $0.pass.kick == "headliner" }?.pass ?? step?.pass)
    }
    if let s = step { return d >= s.pass.startDate ? .upNow(s.pass) : .next(s.pass) }
    return .late(back: p.back.map { Date(timeIntervalSince1970: $0 / 1000) }.flatMap { $0 > d ? $0 : nil })
}

// MARK: - Timeline

struct Entry: TimelineEntry { let date: Date; let plan: Plan? }

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> Entry { Entry(date: .now, plan: Sample.plan) }
    func getSnapshot(in context: Context, completion: @escaping (Entry) -> Void) {
        completion(Entry(date: .now, plan: context.isPreview ? Sample.plan : Store.plan())) // the gallery always shows what you'd get
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> Void) {
        let plan = Store.plan(), now = Date()
        // A new entry wherever what's shown changes: each pass starting and ending, dark, dawn, plus every 30 minutes.
        var dates: Set<Date> = [now]
        if let p = plan {
            for s in p.chain { dates.insert(Date(timeIntervalSince1970: s.from / 1000)); dates.insert(s.pass.startDate); dates.insert(s.pass.endDate) }
            if let d = p.duskDate { dates.insert(d.addingTimeInterval(-45 * 60)); dates.insert(d) }
            dates.insert(p.dawnDate)
            var t = now; while t < p.dawnDate { t = t.addingTimeInterval(1800); dates.insert(t) }
        }
        let list = dates.filter { $0 >= now.addingTimeInterval(-1) }.sorted().prefix(80)
        let entries = list.map { Entry(date: $0, plan: plan) }
        completion(Timeline(entries: Array(entries), policy: .after((list.last ?? now).addingTimeInterval(1800))))
    }
}

// MARK: - Look

extension Color {
    init(hex: UInt32, a: Double = 1) { self.init(.sRGB, red: Double(hex >> 16 & 255) / 255, green: Double(hex >> 8 & 255) / 255, blue: Double(hex & 255) / 255, opacity: a) }
    static let navy = Color(hex: 0x080f1b), cream = Color(hex: 0xf3ead0), ink = Color(hex: 0xfff2b3), muted = Color(hex: 0xa9b0a4)
    static let orange = Color(hex: 0xfa8127), line = Color(hex: 0x22324a), gold = Color(hex: 0xf2c14e)
}
enum Tier {
    static func color(_ t: String) -> Color {
        switch t { case "uncommon": return Color(hex: 0x5fd08a); case "rare": return Color(hex: 0x4aa8ff); case "epic": return Color(hex: 0xe46ad6); case "legendary": return Color(hex: 0xffc545); default: return Color(hex: 0x9aa4b1) }
    }
    static func gem(_ t: String) -> String { ["common": "●", "uncommon": "▲", "rare": "◆", "epic": "✦", "legendary": "★"][t] ?? "●" }
    static func label(_ t: String) -> String { t.capitalized }
}
extension Font {
    static func display(_ s: CGFloat) -> Font { .custom("RussoOne-Regular", size: s) }
    static func label(_ s: CGFloat) -> Font { .custom("BarlowCondensed-Medium", size: s) }
}
struct Lab: View {
    let text: String; var color: Color = .ink.opacity(0.8); var size: CGFloat = 11
    var body: some View { Text(text.uppercased()).font(.label(size)).tracking(size * 0.16).foregroundStyle(color).lineLimit(1) }
}
struct TierLine: View {
    let pass: Pass; var size: CGFloat = 11
    var body: some View {
        HStack(spacing: 4) {
            Text(pass.icon ? Tier.gem(pass.tier) : "\(Tier.gem(pass.tier)) \(Tier.label(pass.tier).uppercased())").font(.label(size)).tracking(size * 0.14).foregroundStyle(Tier.color(pass.tier))
            if pass.icon { Text("ICON").font(.label(size - 2)).tracking(1).foregroundStyle(Color(hex: 0x1b1405)).padding(.horizontal, 4).background(Color.gold, in: RoundedRectangle(cornerRadius: 4)) }
        }.lineLimit(1)
    }
}
func timeText(_ d: Date) -> Text { Text(d, style: .time) }

// The target circle with the card's picture in it; the ring empties over the last hour before the pass.
struct RingArt: View {
    let pass: Pass?; var size: CGFloat = 62; var full = false; var until: Date? = nil
    var body: some View {
        ZStack {
            if let img = Store.art(pass?.art) {
                Image(uiImage: img).resizable().scaledToFill().frame(width: size - 14, height: size - 14).clipShape(Circle())
            } else {
                Circle().fill(Color(hex: 0x15233a)).frame(width: size - 14, height: size - 14)
                Circle().fill(Color.orange).frame(width: size * 0.18, height: size * 0.18)
            }
            Circle().stroke(Color.white.opacity(0.12), lineWidth: 2.5)
            if full {
                Circle().stroke(Color.orange, lineWidth: 2.5)
            } else if let t = until ?? pass?.startDate {
                ProgressView(timerInterval: t.addingTimeInterval(-3600)...t, countsDown: true, label: { EmptyView() }, currentValueLabel: { EmptyView() })
                    .progressViewStyle(.circular).tint(.orange)
            }
            ForEach(0..<4) { i in
                Rectangle().fill(Color.orange).frame(width: 2, height: 5).offset(y: -size / 2 + 3).rotationEffect(.degrees(Double(i) * 90))
            }
        }.frame(width: size, height: size)
    }
}
struct Stars: View {
    var body: some View {
        Canvas { ctx, sz in
            for (x, y, r) in [(0.12, 0.18, 1.0), (0.72, 0.12, 0.9), (0.88, 0.44, 1.2), (0.34, 0.62, 0.8), (0.58, 0.84, 0.9), (0.08, 0.88, 0.8), (0.46, 0.08, 0.7), (0.94, 0.9, 0.8)] {
                ctx.fill(Path(ellipseIn: CGRect(x: x * sz.width, y: y * sz.height, width: r * 1.6, height: r * 1.6)), with: .color(.white.opacity(0.45)))
            }
        }
    }
}

// MARK: - Small (free): the next catch

struct NextCatch: View {
    let m: Moment; var compact = false
    var body: some View {
        let ring: CGFloat = compact ? 54 : 62
        VStack(alignment: .leading, spacing: 0) {
            switch m {
            case .next(let p), .upNow(let p):
                let up: Bool = { if case .upNow = m { return true }; return false }()
                Lab(text: up ? "Look up" : p.kick == "headliner" ? "Tonight's headliner" : "Next catch")
                HStack(spacing: 9) {
                    RingArt(pass: p, size: ring, full: up)
                    VStack(alignment: .leading, spacing: 3) {
                        TierLine(pass: p, size: 10)
                        Text(p.name).font(.display(compact ? 14 : 15)).foregroundStyle(Color.ink).lineLimit(3).minimumScaleFactor(0.6).fixedSize(horizontal: false, vertical: true)
                    }
                }.padding(.top, 7)
                Spacer(minLength: 2)
                if up {
                    Text("UP NOW").font(.display(27)).foregroundStyle(Color.orange)
                    (Text("Look \(p.where.lowercased().replacingOccurrences(of: "high in the ", with: "").replacingOccurrences(of: "halfway up in the ", with: "").replacingOccurrences(of: "low in the ", with: "")) · fades ") + timeText(p.endDate))
                        .font(.label(12)).foregroundStyle(Color.muted).lineLimit(1)
                } else {
                    Text(timerInterval: Date.now...p.startDate, countsDown: true).font(.display(32)).foregroundStyle(Color.orange).monospacedDigit().lineLimit(1).minimumScaleFactor(0.7)
                    (timeText(p.startDate) + Text(" · \(p.cloud ? "cloud forecast" : p.where.lowercased())"))
                        .font(.label(12)).foregroundStyle(Color.muted).lineLimit(1).minimumScaleFactor(0.8)
                }
            case .day(let dusk, let head):
                Lab(text: head?.kick == "headliner" ? "Tonight's headliner" : "Tonight")
                if let h = head {
                    HStack(spacing: 9) {
                        RingArt(pass: h, size: ring, full: true)
                        VStack(alignment: .leading, spacing: 3) {
                            TierLine(pass: h, size: 10)
                            Text(h.name).font(.display(compact ? 13 : 14)).foregroundStyle(Color.ink).lineLimit(3).minimumScaleFactor(0.75).fixedSize(horizontal: false, vertical: true)
                        }
                    }.padding(.top, 7)
                }
                Spacer(minLength: 2)
                Lab(text: "Dark in", color: .muted, size: 10)
                Text(timerInterval: Date.now...dusk, countsDown: true).font(.display(28)).foregroundStyle(Color.ink).monospacedDigit().lineLimit(1).minimumScaleFactor(0.7)
                if let h = head {
                    (Text("Up at ") + timeText(h.startDate) + Text(" · \(h.short)")).font(.label(12)).foregroundStyle(Color.muted).lineLimit(1)
                } else {
                    (Text("Dark at ") + timeText(dusk)).font(.label(12)).foregroundStyle(Color.muted)
                }
            case .cloudy(let w):
                Lab(text: "Tonight")
                Spacer(minLength: 2)
                Image(systemName: "cloud.fill").font(.system(size: 26)).foregroundStyle(Color(hex: 0xaab4c2))
                Text("Cloudy tonight").font(.display(16)).foregroundStyle(Color.ink).padding(.top, 4)
                if !w.next.isEmpty { (Text("Next clear night: ") + Text(w.next.capitalized).foregroundStyle(Color.ink)).font(.label(12)).foregroundStyle(Color.muted) }
                Text("Gaps still count").font(.label(12)).foregroundStyle(Color.muted)
            case .late(let back):
                Lab(text: "Late night")
                Spacer(minLength: 2)
                Text("Tonight is for stars").font(.display(16)).foregroundStyle(Color.ink).lineLimit(2)
                if let b = back {
                    Lab(text: "Satellites back", color: .muted, size: 10).padding(.top, 4)
                    timeText(b).font(.display(26)).foregroundStyle(Color.orange)
                } else {
                    Text("Planets, the Moon and stars are up").font(.label(12)).foregroundStyle(Color.muted)
                }
            case .noPlan:
                Spacer()
                HStack { Spacer(); RingArt(pass: nil, size: 40, full: true); Spacer() }
                Text("Plan tonight").font(.display(15)).foregroundStyle(Color.ink).frame(maxWidth: .infinity).padding(.top, 8)
                Text("Open Space Collector to see what's up").font(.label(12)).foregroundStyle(Color.muted).multilineTextAlignment(.center).frame(maxWidth: .infinity)
                Spacer()
            }
        }.frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    }
}

// MARK: - Medium and large (Plus)

struct PassRow: View {
    let p: Pass; var art = false; var lead = false
    var body: some View {
        Link(destination: p.url) {
            HStack(spacing: 8) {
                timeText(p.startDate).font(.display(13)).foregroundStyle(lead ? Color.orange : Color.cream).frame(width: 46, alignment: .leading).lineLimit(1).minimumScaleFactor(0.7)
                if art {
                    Group { if let img = Store.art(p.art) { Image(uiImage: img).resizable().scaledToFill() } else { Color(hex: 0x15233a) } }
                        .frame(width: 26, height: 26).clipShape(Circle()).overlay(Circle().stroke(lead ? Color.orange : Color.white.opacity(0.15), lineWidth: 1.5))
                }
                VStack(alignment: .leading, spacing: 0) {
                    Text(p.name).font(.label(14)).foregroundStyle(Color.cream).lineLimit(1).minimumScaleFactor(0.75)
                    Text(art ? "\(Tier.label(p.tier)) · \(p.where.lowercased())" : p.short).font(.label(12)).foregroundStyle(Color.muted).lineLimit(1)
                }
                Spacer(minLength: 4)
                Text(Tier.gem(p.tier)).font(.system(size: 10)).foregroundStyle(p.kick == "headliner" ? Color.gold : Tier.color(p.tier))
            }.padding(.vertical, 5).overlay(alignment: .top) { Rectangle().fill(Color.line).frame(height: 1) }
        }
    }
}
func wxWord(_ p: Plan) -> String { guard let w = p.wx else { return "" }; return w.ok ? "Clear" : "Cloudy" }

struct Medium: View {
    let plan: Plan; let m: Moment; let now: Date
    var body: some View {
        let main: Pass? = { switch m { case .next(let p), .upNow(let p): return p; default: return nil } }()
        let after = plan.list.filter { $0.endDate > now && $0.key != main?.key }.prefix(3) // what's next tonight, before or after the main pick (2026-10-22: rows only after the headliner left the list empty)
        HStack(spacing: 13) {
            NextCatch(m: m, compact: true).frame(width: 140)
            Rectangle().fill(Color.line).frame(width: 1)
            VStack(alignment: .leading, spacing: 4) {
                HStack { Lab(text: "Tonight", color: .orange); Spacer(); Lab(text: "☾ " + wxWord(plan), color: .cream, size: 11) }
                if after.isEmpty {
                    Spacer(); Text("Nothing else new tonight").font(.label(13)).foregroundStyle(Color.muted); Spacer()
                } else {
                    ForEach(Array(after), id: \.self) { PassRow(p: $0) }
                    Spacer(minLength: 0)
                }
            }
        }
    }
}

struct Large: View {
    let plan: Plan; let now: Date
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack { Lab(text: plan.place.isEmpty ? "Tonight" : "Tonight · \(plan.place)", color: .orange); Spacer(); Lab(text: "☾ " + wxWord(plan), color: .cream) }
            if let w = plan.wx, !w.ok {
                Text(w.line).font(.display(19)).foregroundStyle(Color.ink).lineLimit(2).padding(.top, 8)
                Text(w.next.isEmpty ? "If you spot a gap, they still count" : "Next clear night: \(w.next)").font(.label(13)).foregroundStyle(Color.muted)
            } else {
                (Text("\(plan.haul.n) new card\(plan.haul.n == 1 ? "" : "s")") + (plan.haul.top.map { Text(", ") + Text("\(plan.haul.topN) \(Tier.label($0))").foregroundStyle(Tier.color($0)) } ?? Text("")))
                    .font(.display(21)).foregroundStyle(Color.ink).lineLimit(1).minimumScaleFactor(0.7).padding(.top, 8)
                if let d = plan.duskDate { (Text("Dark ") + timeText(d) + Text(" · until ") + timeText(plan.dawnDate)).font(.label(13)).foregroundStyle(Color.muted) }
            }
            Chart(plan: plan, now: now).frame(height: 40).padding(.top, 8)
            HStack { Lab(text: "Dark", color: Color(hex: 0x6f7c8c), size: 10); Spacer(); Lab(text: "Midnight", color: Color(hex: 0x6f7c8c), size: 10); Spacer(); Lab(text: "Dawn", color: Color(hex: 0x6f7c8c), size: 10) }.padding(.top, 3)
            let stops = plan.run.filter { $0.endDate > now }
            VStack(spacing: 0) {
                ForEach(Array(stops.prefix(4).enumerated()), id: \.element) { i, p in PassRow(p: p, art: true, lead: i == 0) }
            }.padding(.top, 8)
            if stops.isEmpty { Text("No more new cards this evening").font(.label(13)).foregroundStyle(Color.muted).padding(.top, 10) }
            Spacer(minLength: 0)
            HStack {
                Lab(text: plan.missions > 0 ? "\(plan.missions) mission\(plan.missions == 1 ? "" : "s") left tonight" : "Missions done", color: Color(hex: 0x6f7c8c), size: 10)
                Spacer(); Lab(text: "Open the sky ›", color: .ink, size: 10)
            }.padding(.top, 6).overlay(alignment: .top) { Rectangle().fill(Color.line).frame(height: 1) }
        }
    }
}
struct Chart: View {
    let plan: Plan; let now: Date
    var body: some View {
        let mx = max(plan.bars.max() ?? 1, 1), pk = plan.bars.firstIndex(of: mx) ?? -1
        let a = plan.dusk ?? plan.at, b = plan.dawn, nowI = Int(((now.timeIntervalSince1970 * 1000 - a) / max(b - a, 1)) * 16)
        HStack(alignment: .bottom, spacing: 3) {
            ForEach(Array(plan.bars.enumerated()), id: \.offset) { i, v in
                RoundedRectangle(cornerRadius: 1.5).fill(i == pk ? Color.orange : i == nowI ? Color.cream : Color(hex: 0x2c4060))
                    .frame(maxWidth: .infinity).frame(height: max(3, 40 * v / mx))
            }
        }
    }
}

struct PlusOnly: View {
    var compact = false
    var body: some View {
        VStack(spacing: 6) {
            RingArt(pass: nil, size: 40, full: true)
            Text(compact ? "Plus" : "Space Collector Plus").font(.display(15)).foregroundStyle(Color.ink)
            Text("Widgets come with Plus. Tap to see what's in it.").font(.label(13)).foregroundStyle(Color.muted).multilineTextAlignment(.center)
        }.frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - Lock screen (Plus)

func shortName(_ n: String) -> String {
    let w = n.split(separator: " ").first.map(String.init) ?? n
    return n.hasPrefix("Space Station") || n.hasPrefix("International Space Station") ? "ISS" : String(w.prefix(7))
}
struct LockView: View {
    @Environment(\.widgetFamily) var family
    let plan: Plan?; let m: Moment
    var body: some View {
        if plan?.plus != true {
            switch family {
            case .accessoryInline: Text("Space Collector Plus")
            case .accessoryCircular: ZStack { AccessoryWidgetBackground(); Text("PLUS").font(.system(size: 12, weight: .bold)) }
            default: VStack(alignment: .leading) { Text("Space Collector").font(.headline); Text("Lock screen widgets come with Plus").font(.caption) }
            }
        } else {
            switch family {
            case .accessoryInline: inline
            case .accessoryCircular: circular
            default: rectangular
            }
        }
    }
    @ViewBuilder var inline: some View {
        switch m {
        case .next(let p): Text("✦ \(shortName(p.name)) ") + timeText(p.startDate) + Text(" · \(p.where.lowercased())")
        case .upNow(let p): Text("✦ \(shortName(p.name)) up now · look \(p.short.split(separator: "·").last.map { $0.trimmingCharacters(in: .whitespaces) } ?? "")")
        case .day(let dusk, _): Text("☾ Dark at ") + timeText(dusk)
        case .cloudy: Text("☁ Cloudy tonight")
        case .late(let back): back.map { Text("☾ Satellites back ") + timeText($0) } ?? Text("☾ Tonight is for stars")
        case .noPlan: Text("Space Collector: plan tonight")
        }
    }
    @ViewBuilder var circular: some View {
        switch m {
        case .next(let p):
            ProgressView(timerInterval: p.startDate.addingTimeInterval(-3600)...p.startDate, countsDown: true) { EmptyView() } currentValueLabel: {
                VStack(spacing: 0) { Text(shortName(p.name)).font(.system(size: 9, weight: .semibold)); Text(timerInterval: Date.now...p.startDate, countsDown: true).font(.system(size: 11, weight: .bold)).monospacedDigit().multilineTextAlignment(.center) }
            }.progressViewStyle(.circular)
        case .upNow(let p):
            ZStack { AccessoryWidgetBackground(); VStack(spacing: 0) { Text(shortName(p.name)).font(.system(size: 9, weight: .semibold)); Text("UP").font(.system(size: 16, weight: .bold)) } }
        case .day(let dusk, _):
            ZStack { AccessoryWidgetBackground(); VStack(spacing: 0) { Text("DARK").font(.system(size: 9, weight: .semibold)); timeText(dusk).font(.system(size: 12, weight: .bold)).minimumScaleFactor(0.6) } }
        case .cloudy: ZStack { AccessoryWidgetBackground(); Image(systemName: "cloud.fill").font(.system(size: 20)) }
        case .late, .noPlan: ZStack { AccessoryWidgetBackground(); Image(systemName: "moon.stars.fill").font(.system(size: 20)) }
        }
    }
    @ViewBuilder var rectangular: some View {
        VStack(alignment: .leading, spacing: 1) {
            switch m {
            case .next(let p):
                Text(p.kick == "headliner" ? "◎ HEADLINER" : "◎ NEXT").font(.system(size: 12, weight: .semibold)).opacity(0.8)
                Text(p.name).font(.headline).lineLimit(1).minimumScaleFactor(0.7)
                (timeText(p.startDate) + Text(" · \(p.short)")).font(.system(size: 13, weight: .semibold)).opacity(0.8).lineLimit(1).minimumScaleFactor(0.8)
                ProgressView(timerInterval: p.startDate.addingTimeInterval(-3600)...p.startDate, countsDown: true) { EmptyView() } currentValueLabel: { EmptyView() }
            case .upNow(let p):
                Text("◎ UP NOW").font(.system(size: 12, weight: .semibold)).opacity(0.8)
                Text(p.name).font(.headline).lineLimit(1).minimumScaleFactor(0.7)
                Text("Look \(p.where.lowercased())").font(.system(size: 13, weight: .semibold)).opacity(0.8).lineLimit(1)
            case .day(let dusk, let head):
                Text(head?.kick == "headliner" ? "◎ HEADLINER" : "☾ TONIGHT").font(.system(size: 12, weight: .semibold)).opacity(0.8)
                if let h = head {
                    Text(h.name).font(.headline).lineLimit(1).minimumScaleFactor(0.7)
                    (timeText(h.startDate) + Text(" · \(h.short)")).font(.system(size: 13, weight: .semibold)).opacity(0.8).lineLimit(1).minimumScaleFactor(0.8)
                } else {
                    (Text("Dark at ") + timeText(dusk)).font(.headline)
                }
            case .cloudy(let w):
                Text("☁ TONIGHT").font(.system(size: 12, weight: .semibold)).opacity(0.8)
                Text("Cloudy tonight").font(.headline)
                if !w.next.isEmpty { Text("Next clear night: \(w.next)").font(.system(size: 13, weight: .semibold)).opacity(0.8) }
            case .late(let back):
                Text("☾ LATE NIGHT").font(.system(size: 12, weight: .semibold)).opacity(0.8)
                Text("Tonight is for stars").font(.headline)
                if let b = back { (Text("Satellites back ") + timeText(b)).font(.system(size: 13, weight: .semibold)).opacity(0.8) }
            case .noPlan:
                Text("SPACE COLLECTOR").font(.system(size: 12, weight: .semibold)).opacity(0.8)
                Text("Plan tonight").font(.headline)
                Text("Open the app to see what's up").font(.system(size: 13, weight: .semibold)).opacity(0.8)
            }
        }.frame(maxWidth: .infinity, alignment: .leading)
    }
}

// MARK: - The widget

struct SCWidgetView: View {
    @Environment(\.widgetFamily) var family
    let entry: Entry
    var body: some View {
        let m = moment(entry.plan, at: entry.date)
        let link: URL = { switch m { case .next(let p), .upNow(let p): return p.url; default: return URL(string: "spacecollector://tonight")! } }()
        Group {
            switch family {
            case .systemSmall:
                if let p = entry.plan, !p.plus { PlusOnly(compact: true) } else { NextCatch(m: m) }
            case .systemMedium:
                if let p = entry.plan, p.plus { Medium(plan: p, m: m, now: entry.date) } else if entry.plan == nil { NextCatch(m: m) } else { PlusOnly() }
            case .systemLarge:
                if let p = entry.plan, p.plus { Large(plan: p, now: entry.date) } else if entry.plan == nil { NextCatch(m: m) } else { PlusOnly() }
            default: LockView(plan: entry.plan, m: m)
            }
        }
        .padding(family == .systemSmall || family == .systemMedium || family == .systemLarge ? 14 : 0)
        .widgetURL(entry.plan?.plus == false ? URL(string: "spacecollector://plus")! : link)
        .containerBackground(for: .widget) {
            if family == .systemSmall || family == .systemMedium || family == .systemLarge { ZStack { Color.navy; Stars() } } else { Color.clear }
        }
    }
}

@main
struct SCWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "SpaceCollectorNext", provider: Provider()) { SCWidgetView(entry: $0) }
            .configurationDisplayName("Space Collector")
            .description("What to look up for next, and when.")
            .supportedFamilies([.systemSmall, .systemMedium, .systemLarge, .accessoryCircular, .accessoryRectangular, .accessoryInline])
            .contentMarginsDisabled()
    }
}

// A sample night for the widget gallery, before the app has planned one.
enum Sample {
    static var plan: Plan {
        let now = Date().timeIntervalSince1970 * 1000, min = 60_000.0
        func pass(_ k: String, _ n: String, _ t: String, _ s: Double, _ w: String, _ sh: String, kick: String = "next", icon: Bool = false, art: String? = nil) -> Pass {
            Pass(key: k, name: n, tier: t, icon: icon, art: art, start: now + s * min, end: now + (s + 5) * min, where: w, short: sh, kick: kick, cloud: false)
        }
        let iss = pass("25544@0", "Space Station", "rare", 12, "High in the southeast", "High · SE", icon: true, art: "iss")
        let list = [pass("1@1", "Radiation Sat (5E-1)", "rare", 23, "High in the southeast", "High · SE"), pass("2@2", "Kosmos 422", "epic", 45, "Halfway up in the north", "Halfway · N", kick: "headliner"), pass("3@3", "Hubble", "rare", 71, "Low in the south", "Low · S")]
        return Plan(at: now, place: "Peterborough", plus: true, dusk: now - 90 * min, dawn: now + 600 * min, eve: now + 180 * min,
                    chain: [Step(from: now, pass: iss)], list: [iss] + list, run: [iss] + list, back: nil,
                    haul: Haul(n: 39, top: "rare", topN: 1), bars: [3, 5, 8, 12, 15, 18, 16, 12, 9, 7, 5, 4, 3, 2, 2, 3], wx: Wx(ok: true, line: "Clear", next: ""), missions: 3)
    }
}
