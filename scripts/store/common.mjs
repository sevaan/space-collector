// Shared set-up for the App Store captures and previews (scripts/store/*.mjs).
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
export const APP = 'http://localhost:8765/';
const PHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const PAD_UA = 'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
// App Store sizes: iPhone 6.3" 1206 × 2622 (402 × 874 @3x); iPad 13" 2064 × 2752 (1032 × 1376 @2x).
export const DEVICES = {
  phone: { viewport: { width: 402, height: 874 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: PHONE_UA, safeTop: 54, safeBottom: 30 },
  pad: { viewport: { width: 1032, height: 1376 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: PAD_UA, safeTop: 24, safeBottom: 20 },
};
// Toronto-ish, so the sky and the Tonight plan are real for a place with a big audience.
export const PLACE = { latitude: 44.3, longitude: -78.3, tz: 'America/Toronto' };
const nextEvening = () => { const d = new Date(); d.setHours(20, 30, 0, 0); return d; }; // tonight, 8:30 PM local

// A believable collection: 22 satellites (stations, telescopes, old stages, Vanguard), the Moon and four planets, and a
// shiny ISS (caught as it faded) so the card shot has the shimmer.
const SATS = [25544, 20580, 48274, 6126, 38358, 29, 7736, 6683, 9330, 5, 11, 12, 397, 716, 3047, 12442, 19920, 26452, 21223, 10820, 11416, 7593];
function collection(now) {
  const cat = JSON.parse(readFileSync(join(ROOT, 'data/catalog.json'), 'utf8')).objects, byId = new Map(cat.map((o) => [o.id, o])), D = 864e5;
  const at = { lat: PLACE.latitude, lon: PLACE.longitude }, list = [];
  SATS.forEach((id, i) => { const o = byId.get(id); if (o) list.push({ time: now - (i % 9 + 1) * D - i * 3600e3, cardKey: String(id), objectId: id, name: o.name, type: o.type ?? 'satellite', ...at }); });
  for (const [k, n, t] of [['moon', 'Moon', 'moon'], ['planet:jupiter', 'Jupiter', 'planet'], ['planet:saturn', 'Saturn', 'planet'], ['planet:mars', 'Mars', 'planet'], ['planet:venus', 'Venus', 'planet']]) list.push({ time: now - 3 * D, cardKey: k, objectId: k, name: n, type: t, ...at });
  list.push({ time: now - 2 * D, cardKey: '25544', objectId: 25544, name: 'ISS (ZARYA)', type: 'station', ...at, shiny: 'eclipse' });
  return list;
}

// A returning player on a clear evening: seeded collection, the App Store safe areas, no testing button.
export async function setup(browser, kind, { when, video = null, extra = [] } = {}) {
  const d = DEVICES[kind], at = when ? new Date(when) : nextEvening();
  const ctx = await browser.newContext({ viewport: d.viewport, deviceScaleFactor: d.deviceScaleFactor, isMobile: d.isMobile, hasTouch: d.hasTouch, userAgent: d.userAgent,
    serviceWorkers: 'block', timezoneId: PLACE.tz, geolocation: { latitude: PLACE.latitude, longitude: PLACE.longitude }, permissions: ['geolocation'], ...(video ? { recordVideo: video } : {}) });
  await ctx.addInitScript(([t, bt]) => { const add = () => { const s = document.createElement('style');
    s.textContent = `:root, html.standalone { --safe-top: ${t}px !important; --safe-bottom: ${bt}px !important; } #peak-toggle { display: none !important; }`; document.head.append(s); };
    if (document.head) add(); else document.addEventListener('DOMContentLoaded', add); }, [d.safeTop, d.safeBottom]);
  // A handle on the app's state, for aiming (capture only; nothing is saved).
  await ctx.route(/\/js\/main\.js/, async (route) => { const r = await route.fetch(); await route.fulfill({ response: r, body: (await r.text()) + '\n;window.__store = { state, sky };', headers: { ...r.headers(), 'content-type': 'text/javascript' } }); });
  // Log the app's sounds with their wall-clock time (the promo puts them in its soundtrack at the same moments).
  await ctx.route(/\/js\/sfx\.js/, async (route) => { const r = await route.fetch(); const body = (await r.text()).replace('export function sfx(name, { gain = 1, gap = 0, delay = 0 } = {}) {', 'export function sfx(name, { gain = 1, gap = 0, delay = 0 } = {}) { (window.__sfxLog ??= []).push([name, Date.now() + delay * 1000]);'); await route.fulfill({ response: r, body, headers: { ...r.headers(), 'content-type': 'text/javascript' } }); });
  await ctx.clock.install({ time: at });
  const p = await ctx.newPage(), errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(APP + 'cards.html'); await p.waitForTimeout(1500);
  await p.evaluate(async (list) => { const m = await import('./js/store.js'); for (const s of list) await m.addSighting(s);
    localStorage.setItem('wcSeen', '1'); localStorage.setItem('started', '1'); localStorage.setItem('radarTip', '1'); localStorage.setItem('shinyExplained', '1');
    const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); localStorage.setItem('recapWeek', String(d.getTime())); }, [...collection(at.getTime()), ...extra]);
  await p.goto(APP); await p.waitForTimeout(9000);
  return { ctx, p, errs };
}

// No notices, badges or tips over the shots.
export const hideNoise = (p) => p.addStyleTag({ content: '#toasts, .patch-coins, .pc-badge, .radar-tip, #until-dark { display: none !important; }' });

// Point at the best new thing up (a station, then rarer, then brighter), steadying the view on it; if nothing is up,
// move the clock on a few minutes and look again.
export async function aimBest(p, { follow = true } = {}) {
  // The hero shot deserves a Rare or better (2026-10-19 marketing pass): wait for tonight's plan and jump the clock to the
  // peak of the best Rare+ pass before dawn, high in the sky (on 2026-10-19 the only ones were around 5 AM); otherwise take what's up.
  for (let i = 0; i < 30 && !(await p.evaluate(() => !!window.__store.state.tonight)); i++) await p.waitForTimeout(1000);
  const ahead = await p.evaluate(() => { const st = window.__store.state, T = st.tonight, rank = { legendary: 0, epic: 1, rare: 2 }, now = Date.now();
    const best = (T?.passes ?? []).filter((x) => x.peakEl >= 30 && x.peakAt > now + 60000 && x.peakAt < now + 11 * 3600e3).map((x) => ({ x, o: st.byId.get(x.id) }))
      .filter(({ o }) => o && rank[o.tier] != null && !o.family).sort((a, b) => rank[a.o.tier] - rank[b.o.tier] || a.x.peakAt - b.x.peakAt)[0];
    return best ? best.x.peakAt - now : 0; });
  if (ahead > 0) { await p.clock.fastForward(Math.round(ahead)); await p.waitForTimeout(2500); }
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
