// Fragments show the object they came from, broken apart (2026-10-26, Sevaan: "with debris fragments it says what the
// object is, so just fragments doesn't always make sense"). For every debris card data/debris.json calls a "Fragment"
// (and that has no picture of its own), find the parent by name in GCAT (J. McDowell, CC BY; it lists objects that have
// since re-entered too) and record which picture that parent uses: data/debris.json gets parent (name) and parentArt.
//   node scripts/build-debris-parents.mjs [path to GCAT satcat.tsv]
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { artFileFor } from '../js/art-keys.js';
import { ART_FILES } from '../js/art-files.js';
const R = fileURLToPath(new URL('..', import.meta.url));
const tsv = process.argv[2] ? readFileSync(process.argv[2], 'utf8') : await (await fetch('https://planet4589.org/space/gcat/tsv/cat/satcat.tsv')).text();
const rows = tsv.split('\n'), hdr = rows[0].slice(1).split('\t'), byName = new Map();
for (const r of rows.slice(2)) { const f = r.split('\t'); if (f.length < 30) continue; const o = Object.fromEntries(hdr.map((h, i) => [h, f[i]?.trim()]));
  if (!Number(o.Satcat) || !['P', 'R'].includes(o.Type?.[0])) continue; const k = (o.Name || '').toUpperCase(); if (!byName.has(k)) byName.set(k, o); }
const cat = JSON.parse(readFileSync(R + 'data/catalog.json', 'utf8')), names = new Map(cat.objects.map((o) => [String(o.id), o.name]));
const SJ = JSON.parse(readFileSync(R + 'data/series.json', 'utf8')), ser = SJ.members;
// GCAT's programme name (PLName, e.g. Parus, Tselina-D) → our series key, for parents no longer in our catalogue
const plKey = (pl) => { const k = String(pl ?? '').toLowerCase().replace(/\s+/g, '-'); return SJ.series[k] ? k : null; };
const deb = JSON.parse(readFileSync(R + 'data/debris.json', 'utf8'));
let n = 0, miss = [];
for (const [id, d] of Object.entries(deb)) {
  delete d.parent; delete d.parentArt;
  if (d.what !== 'Fragment' || (d.art && ART_FILES.has(`deb-${d.art}`))) continue;
  const raw = names.get(id) ?? ''; const parent = raw.replace(/\s*(DEB\b.*|\[.*\]|\(.*\))\s*$/g, '').trim(); if (!parent) continue;
  const rocket = /^(DELTA|THOR|ARIANE|CZ-|SL-|BREEZE|TITAN|ATLAS|AGENA|PSLV|FREGAT|CENTAUR)/.test(parent);
  const alt = parent.replace(/^COSMOS /, 'KOSMOS-'); // GCAT writes Kosmos-1275
  const g = byName.get(parent) ?? byName.get(alt) ?? byName.get(`${parent} R/B`) ?? [...byName.entries()].find(([k]) => k.startsWith(parent + ' ') || k.startsWith(alt + ' '))?.[1];
  const card = { id: Number(g?.Satcat) || 0, name: rocket ? `${parent} R/B` : parent, type: rocket ? 'rocket-body' : 'payload', launch: g?.LDate?.slice(0, 4) ?? '' };
  const art = artFileFor(card, { [card.id]: ser[card.id] ?? plKey(g?.PLName) });
  if (!ART_FILES.has(art)) { miss.push(`${id} ${parent} → ${art}`); continue; }
  d.parent = parent; d.parentArt = art; n++;
}
writeFileSync(R + 'data/debris.json', JSON.stringify(deb, null, 1).replace(/^ +/gm, '') + '\n'); // the file's own layout (one key per line, no indent)
console.log(n, 'fragments linked to their parent'); if (miss.length) console.log('no picture:', miss.slice(0, 20));
