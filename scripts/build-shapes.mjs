// data/shapes.json (2026-10-26): the real shape and size of every satellite that has no picture of its own, from GCAT
// (J. McDowell, planet4589.org/space/gcat, CC BY): { NORAD: [shape words, length m, diameter m, span m, bus] }.
// js/shape-art.js draws them to scale. Rerun after the catalogue gains objects:
//   node scripts/build-shapes.mjs [path to GCAT satcat.tsv]   (default: downloads it)
import { readFileSync, writeFileSync } from 'node:fs';
import { expandFacts } from '../js/catalog-facts.js';
import { buildCards } from '../js/card-model.js';
import { artKeyFor } from '../js/art-keys.js';
import { fileURLToPath } from 'node:url';
const R = fileURLToPath(new URL('..', import.meta.url));
const tsv = process.argv[2] ? readFileSync(process.argv[2], 'utf8') : await (await fetch('https://planet4589.org/space/gcat/tsv/cat/satcat.tsv')).text();
const rows = tsv.split('\n'), hdr = rows[0].slice(1).split('\t'), by = new Map();
for (const r of rows.slice(2)) { const f = r.split('\t'); if (f.length < 30) continue; const o = Object.fromEntries(hdr.map((h, i) => [h, f[i]?.trim()])); if (Number(o.Satcat)) by.set(Number(o.Satcat), o); }
const cat = JSON.parse(readFileSync(R + 'data/catalog.json', 'utf8')); for (const o of cat.objects) expandFacts(o);
const ser = JSON.parse(readFileSync(R + 'data/series.json', 'utf8')).members;
export const GENERIC = /^((classic|modern|early)-satellite|smallsat|us-military|chinese-eo|us-weather)$/;
const out = {}; const num = (v) => (v && v !== '-' && Number(v) > 0 ? Math.round(Number(v) * 100) / 100 : 0);
for (const c of buildCards(cat)) {
  if (c.natural || c.launches) continue;
  if (!GENERIC.test(artKeyFor(c, { [c.id]: ser[c.id] }))) continue;
  const g = by.get(Number(c.id)); if (!g || !g.Shape || g.Shape === '-') continue;
  out[c.id] = [g.Shape, num(g.Length), num(g.Diameter), num(g.Span), g.Bus && g.Bus !== '-' ? g.Bus : ''];
}
writeFileSync(R + 'data/shapes.json', JSON.stringify(out));
console.log(Object.keys(out).length, 'shapes');
