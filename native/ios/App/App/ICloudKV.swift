import Foundation
import Capacitor

// iCloud backup without accounts (2026-10-16, Sevaan): the collection is kept in the player's own iCloud key-value
// store, so it comes back after a reinstall and matches on their iPad. Nothing is sent to us. JS: js/cloud-backup.js.
// Values are strings, zlib-compressed here (the store holds 1 MB in all, so compressing keeps years of sightings).
@objc(ICloudKVPlugin)
public class ICloudKVPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "ICloudKVPlugin"
    public let jsName = "ICloudKV"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "get", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "set", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "remove", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "status", returnType: CAPPluginReturnPromise),
    ]
    private let store = NSUbiquitousKeyValueStore.default

    override public func load() {
        NotificationCenter.default.addObserver(self, selector: #selector(changedElsewhere(_:)),
                                               name: NSUbiquitousKeyValueStore.didChangeExternallyNotification, object: store)
        store.synchronize()
    }

    // Another device (or a fresh install's first download) changed the store: tell the page to merge.
    @objc func changedElsewhere(_ note: Notification) {
        let reason = (note.userInfo?[NSUbiquitousKeyValueStoreChangeReasonKey] as? Int) ?? -1
        notifyListeners("change", data: ["reason": reason])
    }

    @objc func get(_ call: CAPPluginCall) {
        guard let key = call.getString("key") else { call.reject("key needed"); return }
        store.synchronize()
        guard let data = store.data(forKey: key) else { call.resolve(["found": false]); return }
        do {
            let raw = try (data as NSData).decompressed(using: .zlib) as Data
            call.resolve(["found": true, "value": String(data: raw, encoding: .utf8) ?? ""])
        } catch { call.reject("could not read the backup") }
    }

    @objc func set(_ call: CAPPluginCall) {
        guard let key = call.getString("key"), let value = call.getString("value") else { call.reject("key and value needed"); return }
        do {
            let packed = try (Data(value.utf8) as NSData).compressed(using: .zlib) as Data
            if packed.count > 950_000 { call.reject("too-big"); return } // the store's limit is 1 MB in total
            store.set(packed, forKey: key)
            // false when the app has no iCloud entitlement; no iCloud account means it stays on this phone only
            if !store.synchronize() { call.reject("icloud-unavailable"); return }
            if FileManager.default.ubiquityIdentityToken == nil { call.reject("icloud-off"); return }
            call.resolve(["bytes": packed.count])
        } catch { call.reject("could not pack the backup") }
    }

    @objc func remove(_ call: CAPPluginCall) {
        guard let key = call.getString("key") else { call.reject("key needed"); return }
        store.removeObject(forKey: key)
        store.synchronize()
        call.resolve()
    }

    // Is iCloud on for this phone? (Without it the store still works, but only on this device.)
    @objc func status(_ call: CAPPluginCall) {
        call.resolve(["available": FileManager.default.ubiquityIdentityToken != nil])
    }
}

// The app's web view controller, with the app's own plugins registered.
class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(ICloudKVPlugin())
    }
}
