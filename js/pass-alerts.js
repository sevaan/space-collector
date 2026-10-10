// Pass alerts (2026-10-10, playtest #14). Not named push.js: content blockers block scripts called push.js, and on
// Sevaan's iPhone that stopped the whole app loading (main.js's imports failed).
// real push notifications a few minutes before a bright or new pass. The
// phone works out the passes; relay/push.ts (a Val Town val) holds the next few alert times and pushes them when due.
// On iPhone, web push only works once Space Collector is added to the Home Screen (iOS 16.4+).
// PUSH: the push val (val.town/x/sevaan/space-collector-push, deployed 2026-10-10). The Settings row hides if it's empty.
export const PUSH = 'https://sevaan--54192ae4c4ad11f18b0f1607ee4eb77e.web.val.run';

export const pushConfigured = () => !!PUSH;
export const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
export const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
export const isIOS = () => /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export const pushOn = () => { try { return localStorage.getItem('pushOn') === '1'; } catch { return false; } };

const b64 = (s) => { const p = '='.repeat((4 - (s.length % 4)) % 4), raw = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(raw, (c) => c.charCodeAt(0)); };
// The server's public key, fetched ahead of time and kept (2026-10-10: on iPhone, fetching it between the tap and the
// subscribe could make the subscribe fail, so the tap goes straight from permission to subscribe).
let keyP = null;
export function prefetchKey() {
  try { const k = localStorage.getItem('vapidKey'); if (k) return (keyP = Promise.resolve(k)); } catch {}
  if (!PUSH) return null;
  return (keyP ??= fetch(`${PUSH}/vapid`).then((r) => r.json()).then(({ publicKey }) => { try { localStorage.setItem('vapidKey', publicKey); } catch {} return publicKey; }).catch((e) => { keyP = null; throw e; }));
}
async function subscription(create) {
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub && create) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(await prefetchKey()) });
  return sub;
}
// Turn alerts on: ask permission (must run from a tap), subscribe. Returns 'on' | 'denied' | 'install' | 'unsupported',
// or 'error: <why>' so the toast can say what went wrong.
export async function enablePush() {
  if (!pushConfigured() || !pushSupported()) return isIOS() && !isStandalone() ? 'install' : 'unsupported';
  if (isIOS() && !isStandalone()) return 'install';
  let step = 'key';
  try {
    await prefetchKey();
    step = 'permission';
    if ((await Notification.requestPermission()) !== 'granted') return 'denied';
    step = 'service worker';
    if (!navigator.serviceWorker.controller) await navigator.serviceWorker.register('sw.js');
    step = 'subscribe';
    await subscription(true);
    try { localStorage.setItem('pushOn', '1'); } catch {}
    return 'on';
  } catch (e) { return `error: ${step}: ${e?.name ?? ''} ${e?.message ?? e}`.trim(); }
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
