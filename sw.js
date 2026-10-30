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
const CACHE = 'sc-0.1.1445';
// Data copies carry the time they were fetched (sw-at), so they're refreshed at most every 3 hours instead of on every
// open, and a new version's worker takes the data over from the old cache instead of downloading the 4 MB catalogue
// again (perf audit 2026-10-29).
const DATA_AGE = 3 * 3600e3;
const stamp = async (r) => { const h = new Headers(r.headers); h.set('sw-at', String(Date.now())); return new Response(await r.blob(), { status: r.status, statusText: r.statusText, headers: h }); };
self.addEventListener('install', (e) => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(async (c) => {
  await c.addAll(['./', 'index.html', 'cards.html']).catch(() => {});
  for (const f of ['data/catalog.json', 'data/sky.json']) {
    const key = new Request(new URL(f, self.registration.scope).href), prev = await caches.match(key), old = prev && Date.now() - Number(prev.headers.get('sw-at') ?? 0) < 3600e3 ? prev : null; // only a copy from the last hour, so a new version rarely meets an older catalogue (code review 2026-10-30)
    try { await c.put(key, old ?? await stamp(await fetch(key))); } catch { if (prev) try { await c.put(key, prev); } catch {} } // offline: an older copy beats none
  }
})); });
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
      if (hit && Date.now() - Number(hit.headers.get('sw-at') || 0) < 24 * 3600e3) return hit; // checked for a redrawn copy once a day, not on every use (perf audit 2026-10-29: each card picture asked the server again on every load)
      const net = fetch(req, { cache: 'no-cache' }).then(async (r) => { if (r.status === 200) { const st = await stamp(r); c.put(req, st.clone()).catch(() => {}); return st; } return r; });
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
    if (hit && Date.now() - Number(hit.headers.get('sw-at') || 0) < DATA_AGE) return hit;
    const net = fetch(req).then(async (r) => { if (r.ok) { const st = await stamp(r); c.put(key, st.clone()); return st; } return r; }).catch(() => hit);
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
