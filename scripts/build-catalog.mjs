// Fetches orbital elements from CelesTrak and writes data/catalog.json.
// Run: node scripts/build-catalog.mjs
// Be polite: CelesTrak blocks clients that pull too often. Once a day is plenty.

import { writeFileSync } from 'node:fs';

const BASE = 'https://celestrak.org/NORAD/elements/gp.php';

// The "visual" group is CelesTrak's list of the brightest ~150 objects.
const GROUPS = ['visual'];

// Always include these, even if they drop out of the visual group.
const EXTRA_IDS = [
  25544, // ISS
  48274, // Tiangong (Tianhe core)
  20580, // Hubble
];

// Standard magnitude (brightness at 1000 km, half lit). Lower = brighter.
// Objects not listed get a default estimate from their type.
const STD_MAG = {
  25544: -1.8,
  48274: -0.8,
  20580: 2.2,
};

async function fetchTle(query) {
  const res = await fetch(`${BASE}?${query}&FORMAT=tle`);
  if (!res.ok) throw new Error(`CelesTrak ${query}: HTTP ${res.status}`);
  return parseTle(await res.text());
}

function parseTle(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trimEnd()).filter(Boolean);
  const out = [];
  for (let i = 0; i + 2 < lines.length; i += 3) {
    const [name, l1, l2] = lines.slice(i, i + 3);
    if (!l1?.startsWith('1 ') || !l2?.startsWith('2 ')) continue;
    out.push({ name: name.trim(), l1, l2, id: Number(l1.slice(2, 7)) });
  }
  return out;
}

function guessType(name) {
  if (/R\/B|ROCKET|CENTAUR|AGENA|DELTA|ATLAS|TITAN|ARIANE|H-2A|CZ-|SL-/i.test(name)) return 'rocket-body';
  if (/DEB/i.test(name)) return 'debris';
  if (/ISS|TIANHE|TIANGONG|CSS/i.test(name)) return 'station';
  return 'satellite';
}

function defaultStdMag(type) {
  return type === 'rocket-body' ? 3.5 : 4.0;
}

// International designator (e.g. 63047A) -> launch year
function launchYear(l1) {
  const yy = Number(l1.slice(9, 11));
  if (Number.isNaN(yy)) return null;
  return yy < 57 ? 2000 + yy : 1900 + yy;
}

const byId = new Map();
for (const g of GROUPS) {
  for (const o of await fetchTle(`GROUP=${g}`)) byId.set(o.id, o);
}
for (const id of EXTRA_IDS) {
  if (byId.has(id)) continue;
  for (const o of await fetchTle(`CATNR=${id}`)) byId.set(o.id, o);
}

const objects = [...byId.values()]
  .map((o) => {
    const type = guessType(o.name);
    return {
      id: o.id,
      name: o.name,
      type,
      year: launchYear(o.l1),
      stdMag: STD_MAG[o.id] ?? defaultStdMag(type),
      l1: o.l1,
      l2: o.l2,
    };
  })
  .sort((a, b) => a.id - b.id);

const catalog = { generated: new Date().toISOString(), source: 'CelesTrak', count: objects.length, objects };
writeFileSync(new URL('../data/catalog.json', import.meta.url), JSON.stringify(catalog));
console.log(`Wrote ${objects.length} objects to data/catalog.json`);
