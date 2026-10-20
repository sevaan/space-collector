// Sighting log in IndexedDB. Small, promise-based, no dependencies.

const DB_NAME = 'space-collector';
const STORE = 'sightings';

let dbPromise;
// Robust on real phones (bug hunt 2026-10-20): the open times out instead of hanging (a WebKit open that never answers
// left the app on the loader), a closed or lost connection is dropped so the next call opens a fresh one, and a
// transaction that aborts (storage full, "connection lost") rejects instead of hanging forever (Collect went dead).
function db() {
  dbPromise ??= new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('storage open timed out')), 5000);
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const s = req.result.createObjectStore(STORE, { keyPath: 'key', autoIncrement: true });
      s.createIndex('objectId', 'objectId');
    };
    req.onsuccess = () => {
      clearTimeout(timer); const d = req.result;
      d.onversionchange = () => { d.close(); dbPromise = null; }; // lets Reset everything delete it at once (QA 2026-10-08)
      d.onclose = () => { dbPromise = null; };
      resolve(d);
    };
    req.onerror = () => { clearTimeout(timer); reject(req.error); };
    req.onblocked = () => { clearTimeout(timer); reject(new Error('storage blocked')); };
  }).catch((e) => { dbPromise = null; throw e; });
  return dbPromise;
}

function once(mode, fn) {
  return db().then((d) => new Promise((resolve, reject) => {
    const t = d.transaction(STORE, mode);
    const result = fn(t.objectStore(STORE));
    t.oncomplete = () => resolve(result?.result ?? result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error ?? new DOMException('aborted', 'AbortError'));
  }));
}
// A dead connection (iOS after time in the background) throws on every transaction: open a fresh one and try once more.
function tx(mode, fn) {
  return once(mode, fn).catch((e) => {
    if (!/InvalidState|Unknown|Abort|closing|lost/i.test(`${e?.name} ${e?.message}`)) throw e;
    dbPromise = null; return once(mode, fn);
  });
}

export function addSighting(s) {
  return tx('readwrite', (store) => store.add(s));
}

export function allSightings() {
  return tx('readonly', (store) => store.getAll()).then((list) => list.sort((a, b) => b.time - a.time));
}

export function deleteSighting(key) {
  return tx('readwrite', (store) => store.delete(key));
}

// Replace a stored sighting (by its key): (kept for tools; the old account sync used it).
export function putSighting(s) {
  return tx('readwrite', (store) => store.put(s));
}
