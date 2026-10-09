// Sighting log in IndexedDB. Small, promise-based, no dependencies.

const DB_NAME = 'space-collector';
const STORE = 'sightings';

let dbPromise;
function db() {
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const s = req.result.createObjectStore(STORE, { keyPath: 'key', autoIncrement: true });
      s.createIndex('objectId', 'objectId');
    };
    req.onsuccess = () => { req.result.onversionchange = () => req.result.close(); resolve(req.result); }; // lets Reset everything delete it at once (QA 2026-10-08)
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx(mode, fn) {
  return db().then((d) => new Promise((resolve, reject) => {
    const t = d.transaction(STORE, mode);
    const result = fn(t.objectStore(STORE));
    t.oncomplete = () => resolve(result?.result ?? result);
    t.onerror = () => reject(t.error);
  }));
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
