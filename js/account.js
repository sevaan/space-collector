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
import { allSightings, addSighting, putSighting, deleteSighting } from './store.js?v=0.1.637';
import { isNative, plugin } from './native.js?v=0.1.637';

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
    // In the native app there's no popup or redirect sign-in (Google blocks it in app web views), so auth starts
    // without the popup resolver, which otherwise tries to load an iframe from authDomain and stalls.
    const app = A.initializeApp(CONFIG), db = F.getFirestore(app);
    const auth = isNative() ? Au.initializeAuth(app, { persistence: Au.indexedDBLocalPersistence }) : Au.getAuth(app);
    fb = { auth, db, Au, F };
    Au.onAuthStateChanged(auth, (u) => {
      if (u) { setAcct(u); emit(); syncNow(); }
      else if (account()) { ls.set('acct', null); emit(); }
    });
    return fb;
  })();
  try { return await loading; } catch (e) { loading = null; throw e; }
}

// Record the signed-in user straight away. A sign-in call can resolve before onAuthStateChanged runs, and a sync
// started in that gap found no account and brought nothing back ("nothing to restore", 2026-10-11, Sevaan).
function setAcct(u) { const a = account(), pid = u.providerData?.[0]?.providerId ?? ''; ls.set('acct', JSON.stringify({ uid: u.uid, email: u.email, name: u.displayName, provider: pid.startsWith('apple') ? 'apple' : pid.startsWith('google') ? 'google' : pid ? 'email' : a?.provider ?? null, syncedAt: a?.uid === u.uid ? a.syncedAt ?? null : null })); }

// On startup: only touch Firebase if this phone was signed in, or it's opening an emailed sign-in link.
// Sync happens by itself (2026-10-13, Sevaan: "Not a manual process"): at start, when the app comes back to the
// front, when the connection comes back, and shortly after a failed upload. At most every 2 minutes.
let lastAuto = 0, autoTimer = null;
export function autoSync(delay = 0) {
  if (!account()) return;
  clearTimeout(autoTimer);
  autoTimer = setTimeout(() => { if (Date.now() - lastAuto < 120e3 || !account()) return; lastAuto = Date.now(); syncNow().catch(() => { lastAuto = 0; }); }, delay);
}
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => { if (!document.hidden) autoSync(1500); });
  addEventListener('online', () => autoSync(1500));
}
export async function initAccount() {
  const link = /[?&](apiKey|oobCode)=/.test(location.search);
  if (!account() && !link) return;
  try { const { auth, Au } = await load(); if (link && Au.isSignInWithEmailLink(auth, location.href)) await completeEmailLink(location.href); } catch {}
  autoSync(4000); // catch up anything this phone or another one did while the app was closed
}

export async function signInGoogle() {
  const { auth, Au } = await load();
  if (isNative()) {
    // Google's own sign-in sheet on the phone (@capacitor-firebase/authentication, skipNativeAuth), then the same
    // Firebase web session as the website, so backup and sync are unchanged (2026-10-11).
    const r = await plugin('FirebaseAuthentication').signInWithGoogle();
    const c = r?.credential; if (!c?.idToken) throw new Error('Google sign-in was cancelled.');
    setAcct((await Au.signInWithCredential(auth, Au.GoogleAuthProvider.credential(c.idToken, c.accessToken))).user);
    return;
  }
  setAcct((await Au.signInWithPopup(auth, new Au.GoogleAuthProvider())).user);
}
// Sign in with Apple (2026-10-12): the native iPhone app only. Apple's own sheet through the plugin (skipNativeAuth),
// then the same Firebase web session as Google. Apple sends the name only the first time.
export async function signInApple() {
  const { auth, Au } = await load();
  const r = await plugin('FirebaseAuthentication').signInWithApple({ skipNativeAuth: true });
  const c = r?.credential; if (!c?.idToken) throw new Error('Apple sign-in was cancelled.');
  const cred = new Au.OAuthProvider('apple.com').credential({ idToken: c.idToken, rawNonce: c.nonce });
  const res = await Au.signInWithCredential(auth, cred);
  if (!res.user.displayName && r?.user?.displayName) try { await Au.updateProfile(res.user, { displayName: r.user.displayName }); } catch {}
  setAcct({ ...res.user, displayName: res.user.displayName ?? r?.user?.displayName ?? null });
}
// Where an emailed sign-in link should land: the website (the app's own address, capacitor://localhost, isn't a
// web address; the app then takes the pasted link, like the Home Screen app).
const LINK_HOME = 'https://sevaan.github.io/space-collector/';
export async function sendEmailLink(email) {
  const { auth, Au } = await load();
  await Au.sendSignInLinkToEmail(auth, email, { url: isNative() ? LINK_HOME : `${location.origin}${location.pathname}`, handleCodeInApp: true });
  ls.set('emailForSignIn', email);
}
// The emailed link, opened here (or pasted in, for the Home Screen app, which the link can't open).
export async function completeEmailLink(url, email = ls.get('emailForSignIn')) {
  const { auth, Au } = await load();
  if (!Au.isSignInWithEmailLink(auth, url)) throw new Error('That isn\'t a Space Collector sign-in link.');
  if (!email) throw new Error('need-email');
  setAcct((await Au.signInWithEmailLink(auth, email, url)).user);
  ls.set('emailForSignIn', null);
  if (location.search) history.replaceState(null, '', location.pathname); // drop the link's codes from the address bar
}
export async function signOut() {
  if (!fb) await load();
  await fb.Au.signOut(fb.auth);
  if (isNative()) try { await plugin('FirebaseAuthentication').signOut(); } catch {} // forget the Google account choice too
  ls.set('acct', null); emit();
}

// Delete the account and everything backed up with it (2026-10-12: App Store rule 5.1.1(v)). The phone keeps its own
// collection, marked not-yet-uploaded so a later sign-in can back it up again. Firebase wants a recent sign-in to delete
// an account: if it's been a while, sign in again and retry (reauth = signInGoogle, or null for "ask the user").
export async function deleteAccount(reauth = null) {
  const a = account(); if (!a) return;
  const { auth, db, F, Au } = await load();
  const user = auth.currentUser; if (!user) throw new Error('not-signed-in');
  const col = F.collection(db, 'users', a.uid, 'sightings');
  for (;;) { const snap = await F.getDocs(F.query(col, F.limit(400))); if (snap.empty) break; const b = F.writeBatch(db); snap.docs.forEach((d) => b.delete(d.ref)); await b.commit(); }
  await F.deleteDoc(F.doc(db, 'users', a.uid)).catch(() => {});
  try { await Au.deleteUser(user); }
  catch (e) { if (/requires-recent-login/.test(e?.code ?? '') && reauth) { await reauth(); await Au.deleteUser(auth.currentUser); } else throw e; }
  if (isNative()) try { await plugin('FirebaseAuthentication').signOut(); } catch {}
  for (const s of await allSightings()) if (s.synced || s.cloudId) await putSighting({ ...s, synced: false, cloudId: undefined });
  ls.set('acct', null); ls.set('acctDeleted', null); emit();
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
  try { const { db, F } = await load(); const id = cloudId(s); await F.setDoc(F.doc(db, 'users', a.uid, 'sightings', id), toCloud(s)); if (s.key != null) await putSighting({ ...s, cloudId: id, synced: true });
    ls.set('acct', JSON.stringify({ ...account(), syncedAt: Date.now() })); emit(); } // backed up: say so (it read 'synced not yet')
  catch { autoSync(30e3); } // no signal: a full sync catches it up shortly
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
