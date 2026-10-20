// Builds data/comets.json: comets due to be bright enough to see with your eyes (magnitude <= 6 at their best)
// within a year either side of today, from NASA/JPL's Small-Body Database (ssd-api.jpl.nasa.gov, public domain).
// Each gets a card only while it's really that bright (js/comets.js). Run: node scripts/build-comets.mjs
import { writeFileSync } from 'node:fs';
import { cometAt } from '../js/comets.js';
const API = 'https://ssd-api.jpl.nasa.gov/sbdb_query.api?fields=full_name,pdes,e,q,i,om,w,tp,M1,K1,per_y&sb-kind=c&sb-ns=n';
const d = await (await fetch(API)).json();
const F = d.fields, now = Date.now(), out = [];
for (const row of d.data) {
  const o = Object.fromEntries(F.map((f, k) => [f, row[k]]));
  const c = { q: +o.q, e: +o.e, i: +o.i, om: +o.om, w: +o.w, tp: +o.tp, M1: +o.M1, K1: +o.K1 };
  if (![c.q, c.e, c.i, c.om, c.w, c.tp, c.M1, c.K1].every(Number.isFinite)) continue;
  const tpMs = (c.tp - 2440587.5) * 86400000;
  if (Math.abs(tpMs - now) > 365 * 86400000) continue; // perihelion within a year of today
  let best = 99, bestT = 0;
  for (let t = tpMs - 200 * 86400000; t <= tpMs + 200 * 86400000; t += 86400000) { const p = cometAt(c, new Date(t)); if (p.mag < best) { best = p.mag; bestT = t; } }
  if (best > 6) continue;
  const name = o.full_name.trim().replace(/^\d+P\//, (m) => m), short = name.replace(/^.*\(([^)]+)\)$/, '$1').trim() || name;
  const periodic = /^\d+P/.test(o.pdes);
  out.push({ id: o.pdes.replace(/[^\w]+/g, '-').toLowerCase(), name: periodic ? `Comet ${name.split('/')[1] ?? name}` : `Comet ${short}`, designation: o.pdes, periodic,
    ...c, peakMag: +best.toFixed(1), peakDate: new Date(bestT).toISOString().slice(0, 10),
    perihelion: `${c.q.toFixed(2)} AU`, returns: o.per_y && +o.per_y < 1000 ? `every ${Math.round(+o.per_y)} yr` : 'not for thousands of years',
    fact: `A comet you can only collect while it’s bright: it peaks around **${new Date(bestT).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}**. ${periodic ? `It comes back about every ${Math.round(+o.per_y)} years.` : 'Once it leaves, it won’t be back in our lifetimes.'}` });
}
writeFileSync(new URL('../data/comets.json', import.meta.url), JSON.stringify({ source: 'NASA/JPL Small-Body Database', built: new Date().toISOString().slice(0, 10), comets: out }, null, 1));
console.log(out.length, 'comets', out.map((c) => `${c.name} peak ${c.peakMag} on ${c.peakDate}`).join('; '));
