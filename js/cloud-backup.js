// Backup without accounts (2026-10-16, Sevaan: "do we need account signups?"). In the iPhone app the sighting log and a
// few progress keys are kept in the player’s own iCloud key-value store (native plugin ICloudKV, native/ios/App/App/
// ICloudKV.swift), so a reinstall or an iPad gets the same collection back, with no sign-in and nothing sent to us.
// Android restores app data to a new phone with its own Auto Backup (allowBackup in the manifest). The website keeps
// everything on the device.
//   iCloud key 'sc-backup' = { v: 1, s: [sightings], gone: [ids deleted], st: { progress keys }, at }
// Sync merges both ways and never loses anything earned: sightings are a union by a stable id (time + card + object),
// minus ids someone deleted; progress keys merge as in the old account sync.
import { allSightings, addSighting, deleteSighting } from './store.js?v=0.1.925';
import { plugin, onNative, isNative } from './native.js?v=0.1.925';

const KEY = 'sc-backup';
const STATE_KEYS = ['secrets', 'fossilFound', 'ufoFound', 'missionDeals', 'xpCarry2', 'patchSeen', 'patchDates', 'backEarned', 'rankFloor2'];
const ls = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} } };
const json = (k, d) => { try { return JSON.parse(ls.get(k)) ?? d; } catch { return d; } };
const kv = () => (isNative() && /iP(hone|ad|od)|Mac/.test(navigator.userAgent) ? plugin('ICloudKV') : null);

export function backupId(s) {
  let h = 2166136261; for (const c of `${s.time}|${s.cardKey}|${s.objectId ?? ''}`) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return `${s.time}-${h.toString(36)}`;
}
const strip = (s) => { const { key, synced, cloudId, ...rest } = s; return JSON.parse(JSON.stringify(rest)); }; // local-only fields out

const listeners = new Set();
export const onBackupChange = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
export const backupAvailable = () => !!kv();
let running = null, again = false, timer = 0, failed = false, offUntil = 0; // offUntil: iCloud said it’s off, so don’t try every save (iOS playtest 2026-10-19)

// Where the collection is kept right now, for Settings (2026-10-16 playtest: the row said "Backed up to your iCloud"
// even with iCloud off). 'icloud' | 'icloud-off' (signed out, iCloud Drive off, or the last write failed) |
// 'android' (Auto Backup, if the player has Google backup on) | 'web'.
export async function backupStatus() {
  if (!isNative()) return 'web';
  const store = kv(); if (!store) return 'android';
  try { const r = await store.status(); return r?.available && !failed ? 'icloud' : 'icloud-off'; } catch { return 'icloud-off'; }
}

// Merge this phone with iCloud. Calls listeners with { added } when sightings arrived from iCloud.
export function backupNow() {
  if (!kv()) return Promise.resolve(null);
  if (running) { again = true; return running; }
  running = (async () => {
    const store = kv();
    if (Date.now() < offUntil) return null;
    try { const r = await store.status(); if (!r?.available) { offUntil = Date.now() + 5 * 60e3; failed = true; return null; } } catch {}
    let cloud = { v: 1, s: [], gone: [], st: {} };
    try { const r = await store.get({ key: KEY }); if (r?.found && r.value) cloud = { ...cloud, ...JSON.parse(r.value) }; } catch (e) { console.warn('icloud read failed', e); return null; }
    const gone = new Set([...(cloud.gone ?? []), ...json('backupGone', [])]);
    const local = (await allSightings()).filter((s) => !s.sim);
    const here = new Map(local.map((s) => [backupId(s), s]));
    let added = 0;
    for (const [id, s] of here) if (gone.has(id)) { await deleteSighting(s.key); here.delete(id); }
    const theirs = new Map((cloud.s ?? []).map((s) => [backupId(s), s]));
    for (const [id, s] of theirs) if (!here.has(id) && !gone.has(id)) { await addSighting(s); added++; }
    const merged = new Map([...theirs].filter(([id]) => !gone.has(id))); for (const [id, s] of here) merged.set(id, strip(s));
    const st = mergeState(cloud.st ?? {});
    const out = { v: 1, s: [...merged.values()], gone: [...gone].slice(-2000), st, at: Date.now() };
    try { await store.set({ key: KEY, value: JSON.stringify(out) }); failed = false; ls.set('backupGone', null); ls.set('backupAt', String(Date.now())); }
    catch (e) { failed = true; console.warn('icloud write failed', e?.message ?? e); }
    if (added) listeners.forEach((fn) => { try { fn({ added }); } catch {} });
    return { added, total: out.s.length };
  })().finally(() => { running = null; if (again) { again = false; backupSoon(2000); } });
  return running;
}
// After a catch: back up shortly (several catches in a row become one write).
export function backupSoon(ms = 4000) { if (!kv()) return; clearTimeout(timer); timer = setTimeout(() => backupNow().catch(() => {}), ms); }
// A sighting deleted on this phone stays deleted everywhere.
export function forgetSighting(s) { if (!s) return; ls.set('backupGone', JSON.stringify([...new Set([...json('backupGone', []), backupId(s)])])); backupSoon(); }
// Reset everything: the iCloud copy goes too, or it would bring the old collection straight back.
export async function clearBackup() { try { await kv()?.remove({ key: KEY }); } catch {} }

// Progress kept in localStorage, merged so nothing earned on either device is lost.
function mergeState(cloud) {
  const merged = {};
  for (const k of STATE_KEYS) {
    const mine = json(k, null), theirs = cloud[k] ?? null;
    let v = mine ?? theirs;
    if (mine != null && theirs != null) {
      if (typeof mine === 'number' || typeof theirs === 'number') v = Math.max(Number(mine) || 0, Number(theirs) || 0);
      else if (Array.isArray(mine) || Array.isArray(theirs)) v = [...new Set([...(mine ?? []), ...(theirs ?? [])])];
      else if (typeof mine === 'object') { v = { ...theirs, ...mine }; for (const x of Object.keys(theirs)) if (typeof theirs[x] === 'number' && typeof mine[x] === 'number') v[x] = Math.min(mine[x], theirs[x]); } // earliest date wins
    }
    if (v != null) { merged[k] = v; ls.set(k, typeof v === 'string' ? v : JSON.stringify(v)); }
  }
  return merged;
}

// Start: merge once, again whenever the app comes back to the front, and when another device changes iCloud.
export function initBackup() {
  if (!kv()) return;
  backupNow().catch(() => {});
  document.addEventListener('visibilitychange', () => { if (!document.hidden) backupSoon(1500); });
  onNative('ICloudKV', 'change', () => backupSoon(500));
}
