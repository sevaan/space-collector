// Running inside the native iPhone/Android app (Capacitor, native/)? Then a few things go through native plugins
// instead of the browser APIs. Plugins are reached through the bridge Capacitor injects (no bundler needed).
export const isNative = () => !!globalThis.Capacitor?.isNativePlatform?.();
// A native plugin as an object of async methods, called through the bridge’s nativePromise (the @capacitor/core
// registerPlugin helper isn’t loaded, since the web app has no bundler).
// The Collection runs in an iframe, and Android's Capacitor refuses plugin calls made from a frame ("Plugin execution
// is allowed in Main Frame only"; Android playtest 2026-10-20: Share and every Collection haptic did nothing). Same-origin
// frames call through the top window's bridge instead, so the call counts as the main frame's.
const capOf = () => { try { if (window.top !== window && window.top.Capacitor) return window.top.Capacitor; } catch {} return globalThis.Capacitor; };
export function plugin(name) {
  const cap = capOf();
  if (!isNative() || typeof cap?.nativePromise !== 'function') return null;
  return new Proxy({}, { get: (_, method) => (opts = {}) => cap.nativePromise(name, String(method), opts) });
}
// One location fix. In the app this uses the native plugin, so the player sees only the iPhone’s own prompt (the
// web view’s getCurrentPosition stacked a second "localhost would like to use your location" on top, 2026-10-11).
// Resolves a GeolocationPosition-like { coords }, rejects with { code } (1 = denied) like the browser API.
export async function getPosition(opts) {
  const geo = plugin('Geolocation');
  if (geo) {
    try {
      // Approximate is plenty for the sky (QA 2026-10-11: asking for precise made Android loop "change to precise?").
      let perm = await geo.checkPermissions().catch(() => null);
      if (perm?.location !== 'granted' && perm?.coarseLocation !== 'granted') perm = await geo.requestPermissions({ permissions: ['coarseLocation'] });
      if (perm?.location !== 'granted' && perm?.coarseLocation !== 'granted') throw { code: 1 };
      // Low accuracy can time out where only GPS has a fix; retry with GPS only if precise access is already granted
      // (asking for it is what made Android show "change to precise?" again, QA 2026-10-11).
      try { return await geo.getCurrentPosition(opts); }
      catch (e) { if (perm?.location === 'granted') return await geo.getCurrentPosition({ ...opts, enableHighAccuracy: true, timeout: 20000 }); throw e; }
    } catch (e) { const m = `${e?.code ?? ''} ${e?.message ?? ''}`; throw { code: e?.code === 1 || /denied/i.test(m) ? 1 : /GLOC-0007|not enabled|services are (off|disabled)/i.test(m) ? 3 : 2 }; } // 3 = the phone's location is switched off (Android playtest 2026-10-20)
  }
  if (!navigator.geolocation) throw { code: 2 };
  return new Promise((ok, no) => navigator.geolocation.getCurrentPosition(ok, no, opts));
}

// ---- Native integrations (2026-10-11, QA pass). Each falls back to the web way when not in the app. ----
// Listen to a plugin event (App backButton, appStateChange…). Returns a remover.
export function onNative(pluginName, event, fn) {
  const cap = globalThis.Capacitor;
  if (!isNative() || typeof cap?.addListener !== 'function') return () => {};
  const h = cap.addListener(pluginName, event, fn); return () => h?.remove?.();
}
const b64 = (blob) => new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1]); r.onerror = no; r.readAsDataURL(blob); });
// Write a file to the app’s cache and hand it to the system share sheet (images, .ics, exports). Resolves true if a
// share sheet opened. Web: the Web Share API with the file, else false (the caller downloads instead).
export async function shareFile(blob, name, { title = '', text = '' } = {}) {
  if (isNative()) {
    try {
      const fs = plugin('Filesystem'), sh = plugin('Share');
      const { uri } = await fs.writeFile({ path: name, data: await b64(blob), directory: 'CACHE' });
      await sh.share({ title, text, files: [uri], dialogTitle: title || 'Share' });
      return true;
    } catch (e) { return /cancel/i.test(e?.message ?? '') ? true : false; }
  }
  try {
    const file = new File([blob], name, { type: blob.type });
    if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title, text }); return true; }
  } catch (e) { if (e?.name === 'AbortError') return true; }
  return false;
}
// Save or share a generated file: native share sheet in the app (Save to Files / calendar / mail), download on the web.
export async function saveFile(blob, name, opts = {}) {
  if (await shareFile(blob, name, opts)) return true;
  if (isNative()) return false;
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000); return true;
}
// Haptics: a soft tick, a firmer thud, a success buzz. Web: navigator.vibrate where it exists (not iOS).
export function haptic(kind = 'light') {
  if (isNative()) {
    const h = plugin('Haptics');
    if (kind === 'success' || kind === 'warning') h?.notification({ type: kind.toUpperCase() }).catch(() => {});
    // iOS only plays selectionChanged between selectionStart and selectionEnd (UX room 2026-10-12: every "select" was silent).
    else if (kind === 'select') { h?.selectionStart?.().then?.(() => h.selectionChanged()).then?.(() => h.selectionEnd()).catch?.(() => {}); }
    else h?.impact({ style: kind === 'heavy' ? 'HEAVY' : kind === 'medium' ? 'MEDIUM' : 'LIGHT' }).catch(() => {});
    return;
  }
  navigator.vibrate?.({ light: 8, select: 6, medium: 16, heavy: 28, success: [12, 60, 18], warning: [20, 40, 20] }[kind] ?? 8);
}
// Local notifications (pass reminders): no server, works offline. Resolves 'on' | 'denied' | 'unsupported'.
let notifId = 1000;
export async function notifyAt(at, title, body, { id } = {}) {
  if (!isNative()) return 'unsupported';
  const ln = plugin('LocalNotifications');
  try {
    let p = await ln.checkPermissions(); if (p.display !== 'granted') p = await ln.requestPermissions();
    if (p.display !== 'granted') return 'denied';
    await ln.schedule({ notifications: [{ id: id ?? notifId++, title, body, schedule: { at: new Date(at), allowWhileIdle: true }, isExactNotification: false }] }); // a few minutes' slack is fine; exact alarms send Android players to a system screen and need a Play-restricted permission (Android playtest 2026-10-19)
    return 'on';
  } catch { return 'unsupported'; }
}
export async function cancelNotify(id) { if (isNative()) try { await plugin('LocalNotifications').cancel({ notifications: [{ id }] }); } catch {} }
// The app’s chrome is always dark: light status-bar icons on both platforms, from the first frame.
export function nativeChrome() {
  if (!isNative()) return;
  const sb = plugin('StatusBar');
  sb?.setStyle({ style: 'DARK' }).catch(() => {}); // DARK = light text, for dark backgrounds
}

// The same haptics with the player’s Vibration setting applied (localStorage 'haptics'), for pages without main.js’s
// buzz (the Collection; 2026-10-17 haptics playtest: it had none at all).
export function feel(kind = 'light') { try { if (localStorage.getItem('haptics') === '0') return; } catch {} haptic(kind); }

// Links out of the app open in an in-app browser sheet, not full Safari or Chrome (iOS playtest 2026-10-20: Terms of Use
// left the app and showed Safari's start page first). The bundled privacy.html opens the live page, so there's always a
// way back. On the website links behave normally.
if (isNative()) document.addEventListener('click', (e) => {
  const a = e.target.closest?.('a[href]'); if (!a) return;
  const href = a.getAttribute('href') ?? '';
  let url = null;
  if (/^https?:\/\//i.test(href)) url = href;
  else if (/^privacy\.html/i.test(href)) url = 'https://spacecollector.app/privacy';
  if (!url) return;
  const b = plugin('Browser'); if (!b) return;
  e.preventDefault(); e.stopPropagation();
  b.open({ url, presentationStyle: 'popover' }).catch(() => { location.href = url; });
}, true);
