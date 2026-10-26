// Shared set-up for the App Store captures and previews (scripts/store/*.mjs).
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
export const APP = 'http://localhost:8765/';
const PHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const PAD_UA = 'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
// App Store sizes: iPhone 6.3" 1206 × 2622 (402 × 874 @3x); iPad 13" 2064 × 2752 (1032 × 1376 @2x); iPhone Duo inner
// display in landscape 2853 × 2007 (951 × 669 @3x), its status bar an 84pt strip down the trailing edge (safeR).
export const DEVICES = {
  phone: { viewport: { width: 402, height: 874 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: PHONE_UA, safeTop: 54, safeBottom: 30 },
  pad: { viewport: { width: 1032, height: 1376 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: PAD_UA, safeTop: 24, safeBottom: 20 },
  duo: { viewport: { width: 951, height: 669 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: PHONE_UA, safeTop: 0, safeBottom: 20, safeR: 84 },
};
// Toronto-ish, so the sky and the Tonight plan are real for a place with a big audience.
export const PLACE = { latitude: 44.3, longitude: -78.3, tz: 'America/Toronto' };
const nextEvening = () => { const d = new Date(); d.setHours(20, 30, 0, 0); return d; }; // tonight, 8:30 PM local

// A believable collection: 22 satellites (stations, telescopes, old stages, Vanguard), the Moon and four planets, and a
// shiny ISS (caught as it faded) so the card shot has the shimmer.
const SATS = [25544, 20580, 48274, 6126, 38358, 29, 7736, 6683, 9330, 5, 11, 12, 397, 716, 3047, 12442, 19920, 26452, 21223, 10820, 11416, 7593];
// heroIss (store screenshots and previews, 2026-10-19): the ISS is NOT owned, so the hero shot catches it as a new card
// (its art is drawn from real references; Sevaan didn't trust a generic picture there), and the shiny showcase card is
// Hubble instead. The promo video keeps the original set.
function collection(now, { heroIss = false } = {}) {
  const cat = JSON.parse(readFileSync(join(ROOT, 'data/catalog.json'), 'utf8')).objects, byId = new Map(cat.map((o) => [o.id, o])), D = 864e5;
  const at = { lat: PLACE.latitude, lon: PLACE.longitude }, list = [];
  (heroIss ? SATS.filter((id) => id !== 25544) : SATS).forEach((id, i) => { const o = byId.get(id); if (o) list.push({ time: now - (i % 9 + 1) * D - i * 3600e3, cardKey: String(id), objectId: id, name: o.name, type: o.type ?? 'satellite', ...at }); });
  for (const [k, n, t] of [['moon', 'Moon', 'moon'], ['planet:jupiter', 'Jupiter', 'planet'], ['planet:saturn', 'Saturn', 'planet'], ['planet:mars', 'Mars', 'planet'], ['planet:venus', 'Venus', 'planet']]) list.push({ time: now - 3 * D, cardKey: k, objectId: k, name: n, type: t, ...at });
  list.push(heroIss ? { time: now - 2 * D, cardKey: '20580', objectId: 20580, name: 'HST', type: 'satellite', ...at, shiny: 'eclipse' }
    : { time: now - 2 * D, cardKey: '25544', objectId: 25544, name: 'ISS (ZARYA)', type: 'station', ...at, shiny: 'eclipse' });
  return list;
}

// A returning player on a clear evening: seeded collection, the App Store safe areas, no testing button.
// clear: the weather can't be fetched, so the Tonight page shows the plan without a forecast (2026-10-22: a date picked for a
// good ISS pass came out 'Overcast all night', the real forecast for that week).
// locale (2026-10-26, Sevaan: units for the US App Store): 'en-US' gives miles, °F and US spelling (the app's auto units);
// 'en-CA' gives km and °C for every other storefront.
export async function setup(browser, kind, { when, video = null, extra = [], heroIss = false, clear = false, storage = {}, locale = 'en-CA' } = {}) {
  const d = DEVICES[kind], at = when ? new Date(when) : nextEvening();
  const ctx = await browser.newContext({ viewport: d.viewport, deviceScaleFactor: d.deviceScaleFactor, isMobile: d.isMobile, hasTouch: d.hasTouch, userAgent: d.userAgent,
    serviceWorkers: 'block', locale, timezoneId: PLACE.tz, geolocation: { latitude: PLACE.latitude, longitude: PLACE.longitude }, permissions: ['geolocation'], ...(video ? { recordVideo: video } : {}) });
  await ctx.addInitScript(([t, bt, r]) => { const add = () => { const s = document.createElement('style');
    s.textContent = `:root, html.standalone { --safe-top: ${t}px !important; --safe-bottom: ${bt}px !important;${r ? ` --safe-r: ${r}px !important;` : ''} } #peak-toggle { display: none !important; }`; document.head.append(s); };
    if (document.head) add(); else document.addEventListener('DOMContentLoaded', add); }, [d.safeTop, d.safeBottom, d.safeR ?? 0]);
  // A handle on the app's state, for aiming (capture only; nothing is saved).
  await ctx.route(/\/js\/main\.js/, async (route) => { const r = await route.fetch(); await route.fulfill({ response: r, body: (await r.text()) + '\n;window.__store = { state, sky, skyAt: (ra, dec) => { const v = eqToEnu(now(), state.observer)(starVector(ra, dec)); return { az: (Math.atan2(v[0], v[1]) * 180 / Math.PI + 360) % 360, el: Math.asin(v[2]) * 180 / Math.PI }; } };', headers: { ...r.headers(), 'content-type': 'text/javascript' } }); });
  // Log the app's sounds with their wall-clock time (the promo puts them in its soundtrack at the same moments).
  await ctx.route(/\/js\/sfx\.js/, async (route) => { const r = await route.fetch(); const body = (await r.text()).replace('export function sfx(name, { gain = 1, gap = 0, delay = 0 } = {}) {', 'export function sfx(name, { gain = 1, gap = 0, delay = 0 } = {}) { (window.__sfxLog ??= []).push([name, Date.now() + delay * 1000]); try { window.__sfxReal?.(name, delay); } catch {}'); await route.fulfill({ response: r, body, headers: { ...r.headers(), 'content-type': 'text/javascript' } }); });
  if (clear) await ctx.route(/open-meteo\.com|spacecollector\.app\/api\/wx/, (route) => route.abort());
  await ctx.route(/spacecollector\.app\/api\/(planes|t)\b/, (route) => route.abort()); // our server (2026-10-26): no live planes, no usage notes from store footage
  await ctx.route(/adsb|val\.run|adsbdb/, (route) => route.abort()); // no live planes in store footage (one crossed the circle in a take, 2026-10-24)
  await ctx.clock.install({ time: at });
  const p = await ctx.newPage(), errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(APP + 'cards.html'); await p.waitForTimeout(1500);
  await p.evaluate(async ([list, storage]) => { const m = await import('./js/store.js'); for (const s of list) await m.addSighting(s); for (const [k, v] of Object.entries(storage)) localStorage.setItem(k, v);
    localStorage.setItem('wcSeen', '1'); localStorage.setItem('started', '1'); localStorage.setItem('radarTip', '1'); localStorage.setItem('shinyExplained', '1');
    const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); localStorage.setItem('recapWeek', String(d.getTime())); }, [[...collection(at.getTime(), { heroIss }), ...extra], storage]);
  await p.goto(APP); await p.waitForTimeout(9000);
  return { ctx, p, errs };
}

// The 2026-10-24 store set (marketing review): more to show in the Collection, on the Moon card and on the patch wall.
// Five Moon phases stamped (a sighting every ~3.7 days back, each a different phase), Tiangong gold (10 nights), two bright
// stars, and two secret patches found (the fossil and Dizzy). Every date is on or before the capture night.
export function storeExtras(at) {
  const t = at.getTime(), D = 864e5, here = { lat: PLACE.latitude, lon: PLACE.longitude }, out = [];
  for (const k of [1, 4.7, 8.4, 12.1, 15.8]) out.push({ time: t - k * D - 3 * 3600e3, cardKey: 'moon', objectId: 'moon', name: 'Moon', type: 'moon', ...here });
  for (let k = 1; k <= 10; k++) out.push({ time: t - k * D - 2 * 3600e3, cardKey: '48274', objectId: 48274, name: 'CSS (TIANHE)', type: 'station', ...here });
  for (const [key, name] of [['star:vega', 'Vega'], ['star:arcturus', 'Arcturus']]) out.push({ time: t - 5 * D, cardKey: key, objectId: key, name, type: 'star', ...here });
  return out;
}
export const storeStorage = (at) => { const t = at.getTime() - 6 * 864e5; return { fossilFound: JSON.stringify({ at: t }), secrets: JSON.stringify({ dizzy: t - 864e5 }) }; };
export const captureNight = (when) => (when ? new Date(when) : (() => { const d = new Date(); d.setHours(20, 30, 0, 0); return d; })());

// No notices, badges or tips over the shots.
export const hideNoise = (p) => p.addStyleTag({ content: '#toasts, .patch-coins, .pc-badge, .radar-tip, #until-dark { display: none !important; }' });

// Point at the best new thing up (a station, then rarer, then brighter), steadying the view on it; if nothing is up,
// move the clock on a few minutes and look again.
export async function jumpToHero(p) {
  // The hero shot deserves a Rare or better (2026-10-19 marketing pass): wait for tonight's plan and jump the clock to the
  // peak of the best Rare+ pass before dawn, high in the sky (on 2026-10-19 the only ones were around 5 AM); otherwise take what's up.
  for (let i = 0; i < 30 && !(await p.evaluate(() => !!window.__store.state.tonight)); i++) await p.waitForTimeout(1000);
  const ahead = await p.evaluate(() => { const st = window.__store.state, T = st.tonight, rank = { legendary: 0, epic: 1, rare: 2 }, now = Date.now();
    const best = (T?.passes ?? []).filter((x) => x.peakEl >= 30 && x.peakAt > now + 60000 && x.peakAt < now + 11 * 3600e3).map((x) => ({ x, o: st.byId.get(x.id) }))
      .filter(({ o }) => o && rank[o.tier] != null && !o.family && !st.sightings.some((s) => String(s.objectId) === String(o.id)))
      .sort((a, b) => (!!(b.o.icon || b.o.type === 'station') - !!(a.o.icon || a.o.type === 'station')) || rank[a.o.tier] - rank[b.o.tier] || a.x.peakAt - b.x.peakAt)[0]; // a station or icon first: its art is drawn from references
    return best ? best.x.peakAt - now : 0; });
  if (ahead > 0) { await p.clock.fastForward(Math.round(ahead)); await p.waitForTimeout(2500); }
}
export async function aimBest(p, { follow = true } = {}) {
  await jumpToHero(p);
  for (let tries = 0; tries < 12; tries++) {
    const name = await p.evaluate(() => { const st = window.__store.state, own = new Set(st.sightings.map((s) => String(s.objectId)));
      const rank = { legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4 };
      const it = (st.items ?? []).filter((x) => x.look?.visible && x.look.el > 12 && !own.has(String(x.obj.id)) && !x.obj.family)
        .sort((a, b) => (b.obj.type === 'station') - (a.obj.type === 'station') || (rank[a.obj.tier] ?? 5) - (rank[b.obj.tier] ?? 5) || (a.look.mag ?? 9) - (b.look.mag ?? 9))[0];
      if (!it) return null; st.drag.on = true; st.pinnedId = it.obj.id; return `${it.obj.name} (${it.obj.tier})`; });
    if (name) {
      if (follow) for (let i = 0; i < 12; i++) { await p.evaluate(() => { const st = window.__store.state, it = st.items.find((x) => x.obj.id === st.pinnedId); if (it) { st.drag.az = it.look.az; st.drag.el = it.look.el; } }); await p.waitForTimeout(250); }
      return name;
    }
    await p.clock.fastForward('05:00'); await p.waitForTimeout(1500);
  }
  return null;
}
