// One-night sky events (2026-10-25, Sevaan: "fill the gaps" between meteor showers), worked out from the game's own sky
// model (js/celestial.js, Schlyter's formulas) and written to js/sky-events-data.js, so the app needs nothing online.
//   node scripts/build-sky-events.mjs [fromYear] [toYear]     (default 2026–2030)
// Kinds: a planet at its brightest (opposition: Mars, Jupiter, Saturn), Venus at its greatest distance from the Sun,
// the Moon passing close to a bright planet (under 2°, the planet well clear of the Sun), supermoons (a full Moon nearer
// than 360,000 km), the solstices and equinoxes, and total or partial lunar eclipses (NASA's catalogue, by hand).
// Each event is the observing night of a local date ("YYYY-MM-DD", the evening it starts); the app turns that into noon
// to noon wherever the player is, like the showers.
import { writeFileSync } from 'node:fs';
import { solarSystem } from '../js/celestial.js';

const from = Number(process.argv[2] ?? 2026), to = Number(process.argv[3] ?? 2030);
const OBS = { lat: 45, lon: -75 }; // angles between bodies barely depend on where you stand (the Moon's ~1° parallax aside)
const sep = (a, b) => Math.acos(Math.max(-1, Math.min(1, a.v[0] * b.v[0] + a.v[1] * b.v[1] + a.v[2] * b.v[2]))) * 180 / Math.PI;
const at = (t) => { const bs = solarSystem(new Date(t), OBS); return Object.fromEntries(bs.map((b) => [b.name, b])); };
const day = (t) => new Date(t).toISOString().slice(0, 10);
const H = 3600e3, D = 24 * H;
const t0 = Date.UTC(from, 0, 1), t1 = Date.UTC(to + 1, 0, 1);
const out = [];

// Daily samples, then refine extremes hourly.
const daily = []; for (let t = t0; t < t1; t += D) daily.push({ t, s: at(t) });
const refine = (t, f, dir = 1) => { let best = t, bv = f(at(t)) * dir; for (let u = t - D; u <= t + D; u += H) { const v = f(at(u)) * dir; if (v > bv) { bv = v; best = u; } } return best; };

// Oppositions: elongation from the Sun peaks near 180°.
for (const [p, words] of [['Mars', 'red and bright'], ['Jupiter', 'brilliant'], ['Saturn', 'with its rings tilted toward us']]) {
  const el = (s) => sep(s[p], s.Sun);
  for (let i = 1; i < daily.length - 1; i++) { const a = el(daily[i - 1].s), b = el(daily[i].s), c = el(daily[i + 1].s);
    if (b >= a && b >= c && b > 170) { const t = refine(daily[i].t, el); const s = at(t);
      out.push({ id: `opp-${p.toLowerCase()}`, kind: 'planet', date: day(t), name: `${p} at its brightest`, body: `planet:${p.toLowerCase()}`,
        text: `${p} is opposite the Sun: up all night, ${words}, at magnitude ${s[p].mag.toFixed(1)}. Catch it for the badge.` }); } }
}
// Venus at its greatest elongation (evening when east of the Sun, morning when west).
{ const el = (s) => sep(s.Venus, s.Sun);
  for (let i = 1; i < daily.length - 1; i++) { const a = el(daily[i - 1].s), b = el(daily[i].s), c = el(daily[i + 1].s);
    if (b >= a && b >= c && b > 40) { const t = refine(daily[i].t, el), s = at(t);
      // East of the Sun: its right ascension is ahead of the Sun's.
      const raV = Math.atan2(s.Venus.v[1], s.Venus.v[0]), raS = Math.atan2(s.Sun.v[1], s.Sun.v[0]), east = ((raV - raS + 3 * Math.PI) % (2 * Math.PI)) - Math.PI > 0;
      out.push({ id: 'venus-elong', kind: 'planet', date: day(t), name: `Venus at its ${east ? 'evening' : 'morning'} best`, body: 'planet:venus',
        text: `Venus is as far from the Sun as it gets, ${Math.round(b)}°: a brilliant light in the ${east ? 'west after sunset' : 'east before sunrise'}. Catch it for the badge.` }); } } }
// The Moon close to a bright planet: under 3.5°, the planet 30°+ from the Sun. At most one every 10 days, the closest.
{ const cands = [];
  for (const p of ['Venus', 'Jupiter', 'Mars', 'Saturn']) {
    for (let t = t0; t < t1; t += 3 * H) { const s = at(t), d = sep(s.Moon, s[p]);
      if (d < 3.5 && sep(s[p], s.Sun) > 30 && sep(s.Moon, s.Sun) > 25) { const prev = cands.at(-1); if (prev && prev.p === p && t - prev.t < 2 * D) { if (d < prev.d) Object.assign(prev, { t, d }); } else cands.push({ p, t, d }); } } }
  cands.sort((a, b) => a.t - b.t); let last = -Infinity;
  for (const c of cands) { if (c.t - last < 10 * D) continue; last = c.t;
    out.push({ id: `moon-${c.p.toLowerCase()}`, kind: 'moon', date: day(c.t - 6 * H), name: `The Moon meets ${c.p}`, body: ['moon', `planet:${c.p.toLowerCase()}`],
      text: `${c.p} sits just ${c.d < 1 ? 'under a degree' : `${c.d.toFixed(1)}°`} from the Moon. Catch either one tonight for the badge.` }); } }
// Supermoons: full Moon (most lit) nearer than 360,000 km.
for (let i = 1; i < daily.length - 1; i++) { const il = (s) => s.Moon.illum ?? 0, a = il(daily[i - 1].s), b = il(daily[i].s), c = il(daily[i + 1].s);
  if (b >= a && b >= c && b > 0.97) { const t = refine(daily[i].t, il), s = at(t);
    if (s.Moon.distKm < 360000) out.push({ id: 'supermoon', kind: 'moon', date: day(t - 6 * H), name: 'Supermoon', body: 'moon',
      text: `A full Moon at its closest, ${(Math.round(s.Moon.distKm / 1000) * 1000).toLocaleString('en-US')} km away: a little bigger and brighter than usual. Catch it for the badge.` }); } }
// Solstices and equinoxes (dates by hand; within a day for every time zone).
const SEASONS = { 2026: ['03-20', '06-21', '09-22', '12-21'], 2027: ['03-20', '06-21', '09-23', '12-22'], 2028: ['03-20', '06-20', '09-22', '12-21'], 2029: ['03-20', '06-21', '09-22', '12-21'], 2030: ['03-20', '06-21', '09-22', '12-21'] };
const SNAME = [['March equinox', 'Day and night are about the same length everywhere.'], ['June solstice', 'The longest day in the north, the longest night in the south.'], ['September equinox', 'Day and night are about the same length everywhere.'], ['December solstice', 'The longest night of the year in the north.']];
for (let y = from; y <= to; y++) (SEASONS[y] ?? []).forEach((md, k) => out.push({ id: ['equinox-mar', 'solstice-jun', 'equinox-sep', 'solstice-dec'][k], kind: 'season', date: `${y}-${md}`, name: SNAME[k][0], text: `${SNAME[k][1]} Catch any card tonight for the badge.` }));
// Lunar eclipses (NASA eclipse catalogue; total and partial only). Seen wherever the Moon is up at the time. Dates are
// the observing night (the evening it starts) where it's seen, not NASA's UTC date: the 2028-01-12 04:13 and 2029-06-26
// 03:22 UTC eclipses are the nights of the 11th and 25th in the Americas and Europe (bug hunt 2026-10-26).
const ECL = [['2026-03-03', 'total'], ['2026-08-28', 'partial'], ['2028-01-11', 'partial'], ['2028-07-06', 'partial'], ['2028-12-31', 'total'], ['2029-06-25', 'total'], ['2029-12-20', 'total'], ['2030-06-15', 'partial']];
for (const [dt, k] of ECL) if (+dt.slice(0, 4) >= from && +dt.slice(0, 4) <= to) out.push({ id: 'eclipse', kind: 'eclipse', date: dt, name: `${k === 'total' ? 'Total' : 'Partial'} lunar eclipse`, body: 'moon',
  text: `Earth's shadow ${k === 'total' ? 'covers the whole Moon, turning it a deep red' : 'takes a bite out of the Moon'}. If the Moon is up where you are, catch it for the badge.` });

out.sort((a, b) => a.date.localeCompare(b.date));
// One event a night: an eclipse beats a supermoon beats the rest.
const rank = { eclipse: 0, moon: 2, planet: 1, season: 3 }; const byDay = new Map();
for (const e of out) { const o = byDay.get(e.date); if (!o || (rank[e.kind] ?? 9) < (rank[o.kind] ?? 9) || (e.id === 'supermoon' && o.kind === 'moon')) byDay.set(e.date, e); }
const list = [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date));
writeFileSync(new URL('../js/sky-events-data.js', import.meta.url), `// Written by scripts/build-sky-events.mjs (${new Date().toISOString().slice(0, 10)}). One-night sky events, ${from}–${to}.\nexport const SKY_EVENTS = ${JSON.stringify(list, null, 0).replace(/},{/g, '},\n  {')};\n`);
console.log(list.length, 'events'); for (const e of list) console.log(e.date, e.kind.padEnd(7), e.name);
