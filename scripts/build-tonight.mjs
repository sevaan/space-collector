// Tonight for every city in js/tz-places.js (2026-10-16, design/website-plan.md v2): the website shows "Around Toronto ·
// ISS about 9:40, southwest" from these files instead of planning the night in the visitor's browser.
// Runs the app's own night planner (js/tonight-worker.js) with a suburban sky, picks tonight's headliner the way the
// app does (bright enough for a city sky, stations and icons first, then rarity, height, brightness) and samples each
// pass's path so the page can replay it with no orbit maths.
// Usage: node scripts/build-tonight.mjs [outDir=site/public/tonight] [city filter]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..'), J = (f) => 'file://' + join(ROOT, 'js', f);
const OUT = process.argv[2] ?? join(ROOT, 'site/public/tonight'), ONLY = process.argv[3] ?? null;
globalThis.fetch = async (u) => { const p = join(ROOT, String(u).replace(/^\.?\//, '').split('?')[0]); const raw = readFileSync(p, 'utf8'); return { ok: true, json: async () => JSON.parse(raw), text: async () => raw }; };
let msg; globalThis.self = { postMessage: (m) => { if (!m.progress) msg = m; } };
await import(J('tonight-worker.js'));
const orbit = await import(J('orbit.js'));
const { TZ_PLACES } = await import(J('tz-places.js'));
const { buildCards, cardKeyFor } = await import(J('card-model.js'));
const { expandFacts } = await import(J('catalog-facts.js'));
const lore = await import(J('lore.js')); await lore.loadLore();
const { skyLimit } = await import(J('sky-limit.js'));
const { artFileFor } = await import(J('art-keys.js'));

const objs = await orbit.loadCatalog('data/catalog.json'); const all = Array.isArray(objs) ? objs : objs.objects;
const rawCat = JSON.parse(readFileSync(join(ROOT, 'data/catalog.json'), 'utf8')); for (const o of rawCat.objects) expandFacts(o);
const cards = new Map(buildCards(rawCat).map((c) => [String(c.key), c])), byId = new Map(all.map((o) => [o.id, o]));
const RANK = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };
const ICON = new Set([25544, 48274, 20580]); // ISS, Tiangong, Hubble
const SB = 19.45, limit = skyLimit({ sb: SB }).satellites; // the app's default (halfway) sky
const DIR = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'], dir = (az) => DIR[Math.round((((az % 360) + 360) % 360) / 45) % 8];
const hourIn = (t, tz) => Number(new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', hourCycle: 'h23' }).format(new Date(t)));
mkdirSync(OUT, { recursive: true });
const index = {};
// Tonight starts at the city's local noon today (or yesterday's, before 4 AM local: still last night).
function noonFor(tz) {
  const now = Date.now(), h = hourIn(now, tz);
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(now)).map((x) => [x.type, x.value]));
  const offset = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute) - Math.floor(now / 60000) * 60000; // local - UTC
  const noonUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, 12) - offset;
  return h < 4 ? noonUtc - 86400e3 : noonUtc;
}
for (const [tz, [lat, lon, city]] of Object.entries(TZ_PLACES)) {
  if (ONLY && !city.toLowerCase().includes(ONLY.toLowerCase())) continue;
  const observer = { lat, lon, alt: 0 };
  self.onmessage({ data: { requestId: 1, objects: all, observer, startMs: noonFor(tz), sb: SB, binoculars: false, hours: 30 } });
  if (msg.error) { console.warn(city, msg.error); continue; }
  const dusk = msg.dusk, dawn = msg.dawn;
  // The evening (as in the app's eveningEnd): until 11:30 PM local, or 2 h after a late dusk, never past dawn.
  let evEnd = dusk ? dusk + 2 * 3600e3 : null;
  if (dusk) { for (let t = dusk; t < (dawn ?? dusk + 12 * 3600e3); t += 600e3) { const h = hourIn(t, tz); if (h >= 23 || h < 6) break; evEnd = t; } evEnd = Math.max(evEnd, dusk + 2 * 3600e3); if (dawn) evEnd = Math.min(evEnd, dawn); }
  const pass = (p) => {
    const o = byId.get(p.id), c = cards.get(cardKeyFor(o)) ?? o;
    const path = orbit.track(o, new Date(p.start), observer, -30, Math.round((p.end - p.start) / 1000) + 20, 4).map((x) => [x.t, +x.az.toFixed(1), +x.el.toFixed(1), x.sunlit ? 1 : 0]);
    return { id: p.id, key: cardKeyFor(o), name: lore.titleFor(c), tier: c.tier, icon: !!c.icon || ICON.has(p.id), role: lore.roleOf?.(c) ?? '', fact: lore.factFor(c),
      art: artFileFor(c), start: p.start, end: p.end, peakAt: p.peakAt, peakEl: p.peakEl, peakAz: Math.round(p.peakAz), riseAz: Math.round(p.riseAz), rise: dir(p.riseAz), peak: dir(p.peakAz),
      mag: p.mag, eclipseAt: p.eclipseAt ?? null, path };
  };
  const evening = msg.passes.filter((p) => p.start >= dusk && p.start <= evEnd && p.mag <= limit - 0.8 && p.peakEl >= 25 && byId.get(p.id) && !byId.get(p.id).family);
  // Stations and icons first, then rarity; height, length and brightness break ties. Debris only when nothing else is up.
  const score = (p) => { const o = byId.get(p.id), c = cards.get(cardKeyFor(o)) ?? o; return (ICON.has(p.id) || c.icon ? 100 : 0) - (o.type === 'debris' ? 50 : 0) + (RANK[c.tier] ?? 0) * 10 + p.peakEl / 10 + Math.min(4, (p.end - p.start) / 60000) - p.mag; };
  const ranked = evening.slice().sort((a, b) => score(b) - score(a));
  const seen = new Set(), picks = [];
  for (const p of ranked) { const k = cardKeyFor(byId.get(p.id)); if (seen.has(k)) continue; seen.add(k); picks.push(p); if (picks.length === 6) break; }
  const shiny = evening.filter((p) => p.eclipseAt).sort((a, b) => score(b) - score(a))[0] ?? null;
  const file = city.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const out = { city, tz, lat, lon, built: Date.now(), sb: SB, dusk, dawn, eveningEnd: evEnd, moonIllum: msg.moonIllum, head: picks[0] ? pass(picks[0]) : null, more: picks.slice(1).map(pass), shiny: shiny ? pass(shiny) : null,
    busiest: msg.curve.reduce((a, b) => (b[1] > a[1] ? b : a), [0, 0]) };
  writeFileSync(join(OUT, `${file}.json`), JSON.stringify(out));
  index[tz] = [file, city];
  console.log(city.padEnd(18), out.head ? `${out.head.name} ${new Date(out.head.start).toLocaleTimeString('en-CA', { timeZone: tz, hour: 'numeric', minute: '2-digit' })} ${out.head.rise} peak ${out.head.peakEl}° mag ${out.head.mag}` : 'nothing bright', `(${msg.passes.length} passes)`);
}
if (!ONLY) writeFileSync(join(OUT, 'index.json'), JSON.stringify(index));
