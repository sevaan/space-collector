// Offline caching (2026-10-08 performance). After the first visit the app opens from the phone, works with poor signal
// outdoors, and refreshes quietly in the background:
//  · versioned files (?v=…: scripts, styles): cache first (a new version is a new URL)
//  · art, fonts and icons (no version in their URLs): the cached copy now, refreshed in the background (QA 2026-10-08:
//    redrawn art under the same file name never reached a phone that had the old one)
//  · the page itself: the network first (3 s), the cache when offline (QA 2026-10-08: "Tap to update" reloaded the
//    cached old page, so it took two taps)
//  · data (catalogue, sky, lore): use the cache straight away, fetch a fresh copy for next time
//  · version.json and other sites (weather, planes): straight to the network
// One cache per version (2026-10-10: a phone stuck on the loader). A shared cache could hand a slow-network fallback
// page old files mixed with new ones that don't fit together. Now each deploy's worker (scripts/bump.mjs stamps the
// version below) starts its own cache and deletes the others, so a page only ever meets files from its own version.
const CACHE = 'sc-0.1.440';
self.addEventListener('install', (e) => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./', 'index.html', 'cards.html', 'data/catalog.json', 'data/sky.json']).catch(() => {}))); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || url.pathname.endsWith('version.json') || url.pathname.endsWith('sw.js')) return;
  if (req.mode === 'navigate') {
    e.respondWith(caches.open(CACHE).then(async (c) => {
      const key = new Request(url.origin + url.pathname);
      try {
        const r = await Promise.race([fetch(req, { cache: 'no-cache' }), new Promise((_, no) => setTimeout(() => no(new Error('slow')), 5000))]);
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
      if (r.ok) c.put(req, r.clone()); // older versions go with their whole cache when the next worker activates
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

// Pass alerts (2026-10-10, playtest #14; server: relay/push.ts). The payload is { title, body, tag, at }.
self.addEventListener('push', (e) => {
  let a = {}; try { a = e.data?.json() ?? {}; } catch { a = { title: 'Space Collector', body: e.data?.text() ?? '' }; }
  e.waitUntil(self.registration.showNotification(a.title || 'Space Collector', { body: a.body || '', tag: a.tag || undefined, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', data: { at: a.at } }));
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cs) => { const c = cs.find((x) => new URL(x.url).pathname.endsWith('/') || x.url.includes('index.html')); return c ? c.focus() : self.clients.openWindow('./'); }));
});
