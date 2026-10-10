// Pass alerts (2026-10-10, playtest #14): real push notifications a few minutes before a bright or new pass. The
// phone works out the passes; relay/push.ts (a Val Town val) holds the next few alert times and pushes them when due.
// On iPhone, web push only works once Space Collector is added to the Home Screen (iOS 16.4+).
// PUSH: the push val's URL. Empty until it's deployed; the Settings row stays hidden until then.
export const PUSH = '';

export const pushConfigured = () => !!PUSH;
export const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
export const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
export const isIOS = () => /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export const pushOn = () => { try { return localStorage.getItem('pushOn') === '1'; } catch { return false; } };

const b64 = (s) => { const p = '='.repeat((4 - (s.length % 4)) % 4), raw = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(raw, (c) => c.charCodeAt(0)); };
async function subscription(create) {
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub && create) {
    const { publicKey } = await (await fetch(`${PUSH}/vapid`)).json();
    sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(publicKey) });
  }
  return sub;
}
// Turn alerts on: ask permission (must run from a tap), subscribe. Returns 'on' | 'denied' | 'install' | 'unsupported' | 'error'.
export async function enablePush() {
  if (!pushConfigured() || !pushSupported()) return isIOS() && !isStandalone() ? 'install' : 'unsupported';
  if (isIOS() && !isStandalone()) return 'install';
  try {
    if ((await Notification.requestPermission()) !== 'granted') return 'denied';
    await subscription(true);
    try { localStorage.setItem('pushOn', '1'); } catch {}
    return 'on';
  } catch { return 'error'; }
}
export async function disablePush() {
  try { localStorage.removeItem('pushOn'); } catch {}
  try { const sub = await subscription(false); if (sub) { await fetch(`${PUSH}/unsubscribe`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: sub.endpoint }) }); await sub.unsubscribe(); } } catch {}
}
// Send the next alerts ([{ at, title, body, tag }]); replaces whatever the server had for this phone.
let lastSent = '';
export async function schedulePush(alerts) {
  if (!pushConfigured() || !pushOn() || Notification.permission !== 'granted') return;
  const key = JSON.stringify(alerts.map((a) => [a.at, a.tag])); if (key === lastSent) return;
  try { const sub = await subscription(false); if (!sub) return; await fetch(`${PUSH}/schedule`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sub: sub.toJSON(), alerts }) }); lastSent = key; } catch {}
}
