// Accounts and cloud backup (2026-10-10). Optional sign-in, with Google or an emailed link, backs up the sighting log
// and keeps it the same on every device. Firebase project space-collector-91cc7 (Sevaan's personal account), rules:
// each user reads and writes only users/{uid}/…
//   users/{uid}                     a few progress keys from localStorage (secrets found, mission deals, XP carry…)
//   users/{uid}/sightings/{id}      one doc per sighting; id = a stable hash of time + card + object
// The phone's own log (IndexedDB, js/store.js) stays the source the app reads; sync merges both ways:
//   · in the cloud but not here → added here      · here and not yet uploaded → uploaded
//   · here, uploaded before, gone from the cloud → deleted on another device, so deleted here
//   · deleted here while offline → remembered (localStorage acctDeleted) and deleted from the cloud next sync
// Firebase loads only when someone signs in or was signed in before, so a blocked or slow Google never stops the app.
import { allSightings, addSighting, putSighting, deleteSighting } from './store.js?v=0.1.447';

const FB = 'https://www.gstatic.com/firebasejs/12.4.0/';
const CONFIG = {
  apiKey: 'AIzaSyDROR9ZTza6vqoo3f7exk61MNtSYNOB8Bw', // a Firebase web key is public by design; the rules do the protecting
  authDomain: 'space-collector-91cc7.firebaseapp.com',
  projectId: 'space-collector-91cc7',
  storageBucket: 'space-collector-91cc7.firebasestorage.app',
  messagingSenderId: '798585939717',
  appId: '1:798585939717:web:829d6ab8b51a8f7448796c',
};
const STATE_KEYS = ['secrets', 'fossilFound', 'ufoFound', 'missionDeals', 'xpCarry2', 'patchSeen'];

const ls = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} } };
const json = (k, d) => { try { return JSON.parse(ls.get(k)) ?? d; } catch { return d; } };

let fb = null, loading = null, listeners = new Set(), syncing = null;
export const account = () => json('acct', null); // { uid, email, name, syncedAt } while signed in
export const onAccount = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
const emit = (extra = {}) => listeners.forEach((fn) => { try { fn({ ...account(), ...extra }); } catch {} });

async function load() {
  if (fb) return fb;
  loading ??= (async () => {
    const [A, Au, F] = await Promise.all([import(`${FB}firebase-app.js`), import(`${FB}firebase-auth.js`), import(`${FB}firebase-firestore.js`)]);
    const app = A.initializeApp(CONFIG), auth = Au.getAuth(app), db = F.getFirestore(app);
    fb = { auth, db, Au, F };
    Au.onAuthStateChanged(auth, (u) => {
      if (u) { ls.set('acct', JSON.stringify({ uid: u.uid, email: u.email, name: u.displayName, syncedAt: account()?.syncedAt ?? null })); emit(); syncNow(); }
      else if (account()) { ls.set('acct', null); emit(); }
    });
    return fb;
  })();
  try { return await loading; } catch (e) { loading = null; throw e; }
}

// On startup: only touch Firebase if this phone was signed in, or it's opening an emailed sign-in link.
export async function initAccount() {
  const link = /[?&](apiKey|oobCode)=/.test(location.search);
  if (!account() && !link) return;
  try { const { auth, Au } = await load(); if (link && Au.isSignInWithEmailLink(auth, location.href)) await completeEmailLink(location.href); } catch {}
}

export async function signInGoogle() {
  const { auth, Au } = await load();
  await Au.signInWithPopup(auth, new Au.GoogleAuthProvider());
}
export async function sendEmailLink(email) {
  const { auth, Au } = await load();
  await Au.sendSignInLinkToEmail(auth, email, { url: `${location.origin}${location.pathname}`, handleCodeInApp: true });
  ls.set('emailForSignIn', email);
}
// The emailed link, opened here (or pasted in, for the Home Screen app, which the link can't open).
export async function completeEmailLink(url, email = ls.get('emailForSignIn')) {
  const { auth, Au } = await load();
  if (!Au.isSignInWithEmailLink(auth, url)) throw new Error('That isn\'t a Space Collector sign-in link.');
  if (!email) throw new Error('need-email');
  await Au.signInWithEmailLink(auth, email, url);
  ls.set('emailForSignIn', null);
  if (location.search) history.replaceState(null, '', location.pathname); // drop the link's codes from the address bar
}
export async function signOut() {
  if (!fb) await load();
  await fb.Au.signOut(fb.auth);
  ls.set('acct', null); emit();
}

// A stable id for a sighting, the same on every device.
function cloudId(s) {
  if (s.cloudId) return s.cloudId;
  let h = 2166136261; for (const c of `${s.time}|${s.cardKey}|${s.objectId ?? ''}`) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return `${s.time}-${h.toString(36)}`;
}
const toCloud = (s) => { const { key, synced, cloudId: _c, ...rest } = s; return JSON.parse(JSON.stringify(rest)); }; // drop local-only fields and undefineds

// After a new sighting is saved here: upload it straight away if signed in (a failure just waits for the next sync).
export async function pushSighting(s) {
  const a = account(); if (!a || s.sim) return;
  try { const { db, F } = await load(); const id = cloudId(s); await F.setDoc(F.doc(db, 'users', a.uid, 'sightings', id), toCloud(s)); if (s.key != null) await putSighting({ ...s, cloudId: id, synced: true }); } catch {}
}
// After a sighting is deleted here.
export async function removeSighting(s) {
  const a = account(); if (!a || !s?.synced) return;
  const id = cloudId(s);
  try { const { db, F } = await load(); await F.deleteDoc(F.doc(db, 'users', a.uid, 'sightings', id)); }
  catch { ls.set('acctDeleted', JSON.stringify([...new Set([...json('acctDeleted', []), id])])); }
}

// Merge this phone and the cloud. Returns { added, removed, uploaded } (counts of local changes / uploads).
export function syncNow() {
  return (syncing ??= (async () => {
    const a = account(); if (!a) return null;
    const { db, F } = await load();
    const col = F.collection(db, 'users', a.uid, 'sightings');
    for (const id of json('acctDeleted', [])) await F.deleteDoc(F.doc(col, id)).catch(() => {});
    ls.set('acctDeleted', null);
    const snap = await F.getDocs(col), cloud = new Map(snap.docs.map((d) => [d.id, d.data()]));
    const local = await allSightings(), here = new Set();
    let added = 0, removed = 0, uploaded = 0, batch = F.writeBatch(db), pending = 0;
    for (const s of local) {
      if (s.sim) continue; // test sightings from Testing tools stay on the phone
      const id = cloudId(s); here.add(id);
      if (cloud.has(id)) { if (!s.synced || !s.cloudId) await putSighting({ ...s, cloudId: id, synced: true }); }
      else if (s.synced) { await deleteSighting(s.key); removed++; }
      else { batch.set(F.doc(col, id), toCloud(s)); pending++; uploaded++; await putSighting({ ...s, cloudId: id, synced: true }); if (pending >= 400) { await batch.commit(); batch = F.writeBatch(db); pending = 0; } }
    }
    if (pending) await batch.commit();
    for (const [id, s] of cloud) if (!here.has(id)) { await addSighting({ ...s, cloudId: id, synced: true }); added++; }
    await syncState(db, F, a.uid);
    ls.set('acct', JSON.stringify({ ...account(), syncedAt: Date.now() }));
    emit({ changed: added + removed > 0, added, removed, uploaded });
    return { added, removed, uploaded };
  })().finally(() => { syncing = null; }));
}

// Progress kept in localStorage, merged so nothing earned on either device is lost.
async function syncState(db, F, uid) {
  const ref = F.doc(db, 'users', uid), cloud = (await F.getDoc(ref)).data()?.state ?? {};
  const merged = {};
  for (const k of STATE_KEYS) {
    const mine = json(k, null), theirs = cloud[k] ?? null;
    let v = mine ?? theirs;
    if (mine != null && theirs != null) {
      if (k === 'xpCarry2') v = Math.max(Number(mine) || 0, Number(theirs) || 0);
      else if (Array.isArray(mine) || Array.isArray(theirs)) v = [...new Set([...(mine ?? []), ...(theirs ?? [])])];
      else if (typeof mine === 'object') { v = { ...theirs, ...mine }; for (const x of Object.keys(theirs)) if (typeof theirs[x] === 'number' && typeof mine[x] === 'number') v[x] = Math.min(mine[x], theirs[x]); } // earliest date found
    }
    if (v != null) { merged[k] = v; ls.set(k, typeof v === 'string' ? v : JSON.stringify(v)); }
  }
  await F.setDoc(ref, { state: merged, updated: Date.now() }, { merge: true });
}
