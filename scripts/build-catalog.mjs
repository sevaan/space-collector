// Fetches orbital elements and catalogue facts from CelesTrak and writes data/catalog.json.
// Run: node scripts/build-catalog.mjs
// Be polite: CelesTrak blocks clients that pull too often. Once a day is plenty.
// The full SATCAT (~7 MB) is cached in scripts/.cache for 12 hours.

import { writeFileSync, readFileSync, mkdirSync, statSync } from 'node:fs';
import { tierFor } from '../js/rarity.js';

const GP = 'https://celestrak.org/NORAD/elements/gp.php';
const SATCAT_URL = 'https://celestrak.org/pub/satcat.csv';
const CACHE = new URL('./.cache/', import.meta.url);

// The "visual" group is CelesTrak's list of the brightest ~150 objects.
const GROUPS = ['visual'];

// Always include these, even if they drop out of the visual group.
const EXTRA_IDS = [
  25544, // ISS
  48274, // Tiangong (Tianhe core)
  20580, // Hubble
];

// Standard magnitude (brightness at 1000 km, half lit). Lower = brighter.
// Objects not listed get an estimate from radar cross-section, or a type default.
const STD_MAG = {
  25544: -1.8,
  48274: -0.8,
  20580: 2.2,
};

async function fetchTle(query) {
  const res = await fetch(`${GP}?${query}&FORMAT=tle`);
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

async function loadSatcat() {
  mkdirSync(CACHE, { recursive: true });
  const file = new URL('satcat.csv', CACHE);
  let text;
  try {
    if (Date.now() - statSync(file).mtimeMs < 12 * 3600 * 1000) text = readFileSync(file, 'utf8');
  } catch {}
  if (!text) {
    const res = await fetch(SATCAT_URL);
    if (!res.ok) throw new Error(`SATCAT: HTTP ${res.status}`);
    text = await res.text();
    writeFileSync(file, text);
  }
  const [header, ...rows] = text.trim().split(/\r?\n/);
  const cols = header.split(',');
  const byId = new Map();
  for (const row of rows) {
    const v = row.split(','); // SATCAT has no quoted commas
    const r = Object.fromEntries(cols.map((c, i) => [c, v[i]]));
    byId.set(Number(r.NORAD_CAT_ID), r);
  }
  return byId;
}

function kindToType(kind, name, id) {
  if ([25544, 48274].includes(id) || /^(ISS|CSS|TIANHE|TIANGONG)/.test(name)) return 'station';
  if (kind === 'R/B') return 'rocket-body';
  if (kind === 'DEB') return 'debris';
  return 'satellite';
}

// Rough standard magnitude from radar cross-section (m²). Bigger reflects more light.
function stdMagFrom(rcs, type) {
  if (rcs > 0) return Math.max(1.5, Math.min(6, 5.2 - 2.5 * Math.log10(rcs)));
  return type === 'rocket-body' ? 3.5 : 4.0;
}

const num = (s) => (s === undefined || s === '' ? null : Number(s));

const satcat = await loadSatcat();
const tles = new Map();
for (const g of GROUPS) for (const o of await fetchTle(`GROUP=${g}`)) tles.set(o.id, o);
for (const id of EXTRA_IDS) {
  if (!tles.has(id)) for (const o of await fetchTle(`CATNR=${id}`)) tles.set(o.id, o);
}

// Main payload of each launch, so a rocket stage's card can say what it carried.
const payloadByLaunch = new Map();
for (const r of satcat.values()) {
  if (r.OBJECT_TYPE !== 'PAY') continue;
  const launch = r.OBJECT_ID.slice(0, 8); // e.g. 1969-011
  if (!payloadByLaunch.has(launch) || r.OBJECT_ID.endsWith('A')) payloadByLaunch.set(launch, r.OBJECT_NAME);
}

const objects = [...tles.values()].map((t) => {
  const s = satcat.get(t.id) ?? {};
  const kind = s.OBJECT_TYPE ?? 'UNK';
  const type = kindToType(kind, t.name, t.id);
  const cospar = s.OBJECT_ID ?? null;
  const o = {
    id: t.id,
    name: t.name,
    cospar,
    kind,
    type,
    owner: s.OWNER ?? null,
    launch: s.LAUNCH_DATE || null,
    site: s.LAUNCH_SITE || null,
    decay: s.DECAY_DATE || null,
    ops: s.OPS_STATUS_CODE || null,
    period: num(s.PERIOD),
    incl: num(s.INCLINATION),
    apogee: num(s.APOGEE),
    perigee: num(s.PERIGEE),
    rcs: num(s.RCS),
    parent: kind !== 'PAY' && cospar ? payloadByLaunch.get(cospar.slice(0, 8)) ?? null : null,
    l1: t.l1,
    l2: t.l2,
  };
  o.year = o.launch ? Number(o.launch.slice(0, 4)) : null;
  o.stdMag = STD_MAG[t.id] ?? stdMagFrom(o.rcs, type);
  o.tier = tierFor(o);
  return o;
}).sort((a, b) => a.id - b.id);

const catalog = { generated: new Date().toISOString(), source: 'CelesTrak', count: objects.length, objects };
writeFileSync(new URL('../data/catalog.json', import.meta.url), JSON.stringify(catalog));
const tally = objects.reduce((m, o) => ((m[o.tier] = (m[o.tier] ?? 0) + 1), m), {});
console.log(`Wrote ${objects.length} objects to data/catalog.json`, tally);
