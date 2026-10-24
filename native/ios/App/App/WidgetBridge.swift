import Foundation
import UIKit
import Capacitor
import WidgetKit
import StoreKit

// Widgets (2026-10-22, design/widgets.html): the web app hands over tonight's plan (js/main.js sendWidgets) and this
// saves it where the widget extension (SCWidgets) can read it: plan.json in the App Group "group.<app id>", with the
// small card pictures it names copied beside it as art/<name>.png (240 px, so the widget never decodes WebP or a big
// file). Then the widgets are asked to reload.
public class WidgetBridgePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "WidgetBridgePlugin"
    public let jsName = "Widgets"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "save", returnType: CAPPluginReturnPromise),
    ]

    static var groupId: String { "group." + (Bundle.main.bundleIdentifier ?? "io.github.sevaan.spacecollector") }

    @objc func save(_ call: CAPPluginCall) {
        guard let plan = call.getString("plan"),
              let dir = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: Self.groupId) else {
            call.reject("No shared container"); return
        }
        let art = call.getArray("art", String.self) ?? []
        DispatchQueue.global(qos: .utility).async {
            let fm = FileManager.default, artDir = dir.appendingPathComponent("art", isDirectory: true)
            try? fm.createDirectory(at: artDir, withIntermediateDirectories: true)
            for rel in art {
                let name = ((rel as NSString).lastPathComponent as NSString).deletingPathExtension
                let out = artDir.appendingPathComponent(name + ".png")
                if fm.fileExists(atPath: out.path) { continue }
                let src = Bundle.main.bundleURL.appendingPathComponent("public").appendingPathComponent(rel)
                guard let img = UIImage(contentsOfFile: src.path) else { continue }
                let side: CGFloat = 240, s = side / min(img.size.width, img.size.height)
                let size = CGSize(width: img.size.width * s, height: img.size.height * s)
                let fmt = UIGraphicsImageRendererFormat(); fmt.scale = 1
                let png = UIGraphicsImageRenderer(size: CGSize(width: side, height: side), format: fmt).pngData { _ in
                    img.draw(in: CGRect(x: (side - size.width) / 2, y: (side - size.height) / 2, width: size.width, height: size.height)) // centre square
                }
                try? png.write(to: out)
            }
            do {
                try plan.data(using: .utf8)?.write(to: dir.appendingPathComponent("plan.json"), options: .atomic)
            } catch { call.reject("Couldn't save the plan"); return }
            DispatchQueue.main.async { WidgetCenter.shared.reloadAllTimelines(); call.resolve() }
        }
    }
}

// Review prompt (2026-10-24, Sevaan): Apple's own "Enjoying Space Collector?" sheet. Apple decides whether it actually
// shows (at most three times a year; never in TestFlight, always in a simulator/Xcode build). The web app only calls
// this at calm moments (js/main.js maybeAskReview). Lives in this file so the Xcode project needs no new entry.
public class ReviewPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "ReviewPlugin"
    public let jsName = "Review"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "request", returnType: CAPPluginReturnPromise),
    ]
    @objc func request(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard let scene = UIApplication.shared.connectedScenes.first(where: { $0.activationState == .foregroundActive }) as? UIWindowScene else {
                call.reject("No active window"); return
            }
            if #available(iOS 16.0, *) { AppStore.requestReview(in: scene) } else { SKStoreReviewController.requestReview(in: scene) }
            call.resolve()
        }
    }
}
