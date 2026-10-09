// Offline caching (2026-10-08 performance). After the first visit the app opens from the phone, works with poor signal
// outdoors, and refreshes quietly in the background:
//  · versioned files (?v=…: scripts, styles): cache first (a new version is a new URL)
//  · art, fonts and icons (no version in their URLs): the cached copy now, refreshed in the background (QA 2026-10-08:
//    redrawn art under the same file name never reached a phone that had the old one)
//  · the page itself: the network first (3 s), the cache when offline (QA 2026-10-08: "Tap to update" reloaded the
//    cached old page, so it took two taps)
//  · data (catalogue, sky, lore): use the cache straight away, fetch a fresh copy for next time
//  · version.json and other sites (weather, planes): straight to the network
const CACHE = 'sc-v2';
self.addEventListener('install', (e) => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./', 'index.html', 'cards.html', 'data/catalog.json', 'data/sky.json']).catch(() => {}))); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || url.pathname.endsWith('version.json') || url.pathname.endsWith('sw.js')) return;
  if (req.mode === 'navigate') {
    e.respondWith(caches.open(CACHE).then(async (c) => {
      const key = new Request(url.origin + url.pathname);
      try {
        const r = await Promise.race([fetch(req, { cache: 'no-cache' }), new Promise((_, no) => setTimeout(() => no(new Error('slow')), 3000))]);
        if (r.ok) c.put(key, r.clone());
        return r;
      } catch { return (await c.match(key)) || fetch(req); }
    }));
    return;
  }
  const versioned = url.searchParams.has('v');
  if (!versioned && /\/(assets|fonts|icons)\//.test(url.pathname)) {
    e.respondWith(caches.open(CACHE).then(async (c) => {
      const hit = await c.match(req);
      const net = fetch(req, { cache: 'no-cache' }).then((r) => { if (r.ok) c.put(req, r.clone()); return r; });
      if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
      return net;
    }));
    return;
  }
  if (versioned) {
    e.respondWith(caches.open(CACHE).then(async (c) => (await c.match(req)) || fetch(req).then((r) => {
      if (r.ok) { c.put(req, r.clone()); // and drop older versions of the same file
        if (url.searchParams.has('v')) c.keys().then((ks) => ks.forEach((k) => { const u = new URL(k.url); if (u.pathname === url.pathname && u.search !== url.search) c.delete(k); })); }
      return r; })));
    return;
  }
  // Pages and data: the cached copy now (ignoring cache-busting query strings), a fresh one fetched for next time.
  e.respondWith(caches.open(CACHE).then(async (c) => {
    const key = new Request(url.origin + url.pathname);
    const hit = await c.match(key);
    const net = fetch(req).then((r) => { if (r.ok) c.put(key, r.clone()); return r; }).catch(() => hit);
    if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
    return net;
  }));
});
