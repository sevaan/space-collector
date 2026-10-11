// Running inside the native iPhone/Android app (Capacitor, native/)? Then a few things go through native plugins
// instead of the browser APIs. Plugins are reached through the bridge Capacitor injects (no bundler needed).
export const isNative = () => !!globalThis.Capacitor?.isNativePlatform?.();
// A native plugin as an object of async methods, called through the bridge's nativePromise (the @capacitor/core
// registerPlugin helper isn't loaded, since the web app has no bundler).
export function plugin(name) {
  const cap = globalThis.Capacitor;
  if (!isNative() || typeof cap?.nativePromise !== 'function') return null;
  return new Proxy({}, { get: (_, method) => (opts = {}) => cap.nativePromise(name, String(method), opts) });
}
// One location fix. In the app this uses the native plugin, so the player sees only the iPhone's own prompt (the
// web view's getCurrentPosition stacked a second "localhost would like to use your location" on top, 2026-10-11).
// Resolves a GeolocationPosition-like { coords }, rejects with { code } (1 = denied) like the browser API.
export async function getPosition(opts) {
  const geo = plugin('Geolocation');
  if (geo) {
    try {
      const perm = await geo.requestPermissions({ permissions: ['location'] });
      if (perm?.location === 'denied') throw { code: 1 };
      return await geo.getCurrentPosition(opts);
    } catch (e) { throw { code: e?.code === 1 || /denied/i.test(e?.message ?? '') ? 1 : 2 }; }
  }
  if (!navigator.geolocation) throw { code: 2 };
  return new Promise((ok, no) => navigator.geolocation.getCurrentPosition(ok, no, opts));
}
