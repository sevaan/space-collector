// Fresh satellite data for the phone apps (2026-10-25, Sevaan: "How often do I have to do builds to have up to date
// satellite data?" — never). The apps carry the catalogue from build day; orbits drift and new launches are missing
// after a few weeks. So once a day the app fetches today's catalogue from our server (/catalog, built daily by the
// repo's GitHub Action) and keeps it in IndexedDB; the next launch uses whichever copy is newer, the kept one or the
// one in the app. The website always loads its own (it's redeployed with every catalogue). No DOM.
import { SERVER } from './server.js?v=0.1.1175';
import { isNative } from './native.js?v=0.1.1175';
const DB = 'sc-data', STORE = 'files';
const idb = () => new Promise((res, rej) => { const r = indexedDB.open(DB, 1); r.onupgradeneeded = () => r.result.createObjectStore(STORE); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
const get = async (k) => { const db = await idb(); return new Promise((res, rej) => { const t = db.transaction(STORE).objectStore(STORE).get(k); t.onsuccess = () => res(t.result ?? null); t.onerror = () => rej(t.error); }); };
const put = async (k, v) => { const db = await idb(); return new Promise((res, rej) => { const t = db.transaction(STORE, 'readwrite'); t.objectStore(STORE).put(v, k); t.oncomplete = () => res(); t.onerror = () => rej(t.error); }); };
const on = () => { try { return isNative() && !!SERVER; } catch { return false; } };
// The catalogue URL to load: a blob of the kept copy when it's newer than the one in the app, else the app's own.
export async function catalogUrl(bundled = 'data/catalog.json', bundledAt = 0) {
  if (!on()) return bundled;
  try { const k = await get('catalog'); if (k?.at > bundledAt && k.text) return URL.createObjectURL(new Blob([k.text], { type: 'application/json' })); } catch {}
  return bundled;
}
// After start: if the newest copy is over 20 hours old, fetch today's and keep it for next time (quietly; best effort).
export async function refreshCatalog(haveAt) {
  if (!on() || Date.now() - haveAt < 20 * 3600e3) return;
  try {
    const r = await fetch(`${SERVER}/catalog`, { signal: AbortSignal.timeout?.(30000) }); if (!r.ok) return;
    const text = await r.text(), at = Date.parse(/"generated"\s*:\s*"([^"]+)"/.exec(text.slice(0, 2000))?.[1] ?? '') || 0;
    if (at > haveAt) await put('catalog', { at, text });
  } catch {}
}
