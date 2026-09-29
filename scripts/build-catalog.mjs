// Builds data/catalog.json: every tracked object bright enough to see with the naked eye or binoculars,
// with catalogue facts, rarity tier and card grouping.
// Run: node scripts/build-catalog.mjs   (add --fresh to ignore the 12-hour cache)
//
// Sources (CelesTrak): the full SATCAT for facts, and orbital elements fetched per launch year
// (gp.php?INTDES=YYYY), which together cover the whole public catalogue. Be polite: responses are
// cached in scripts/.cache for 12 hours and requests are spaced out.

import { writeFileSync, readFileSync, mkdirSync, statSync } from 'node:fs';
import { tierFor } from '../js/rarity.js';

const GP = 'https://celestrak.org/NORAD/elements/gp.php';
const SATCAT_URL = 'https://celestrak.org/pub/satcat.csv';
const CACHE = new URL('./.cache/', import.meta.url);
const FRESH = process.argv.includes('--fresh');
const CACHE_MS = 12 * 3600 * 1000;

// Brightness cutoffs, as the best-case magnitude when the object passes straight overhead.
const NAKED_EYE_MAG = 5.0;
const BINOCULAR_MAG = 8.0;

// Standard magnitude (at 1000 km, half lit) for specific objects. Lower = brighter.
const STD_MAG = {
  25544: -1.8, // ISS
  48274: -0.8, // Tiangong
  20580: 2.2, // Hubble
};

// Constellations become one card per launch. Standard magnitudes are typical values.
const FAMILIES = [
  { id: 'STARLINK', re: /^STARLINK/, name: 'Starlink', stdMag: 5.8, owner: 'US', maker: 'SpaceX' },
  { id: 'ONEWEB', re: /^ONEWEB/, name: 'OneWeb', stdMag: 7.2, owner: 'UK', maker: 'Eutelsat OneWeb' },
  { id: 'QIANFAN', re: /^(QIANFAN|G60)/, name: 'Qianfan', stdMag: 5.8, owner: 'PRC', maker: 'Shanghai Spacecom' },
  { id: 'KUIPER', re: /^KUIPER/, name: 'Kuiper', stdMag: 5.8, owner: 'US', maker: 'Amazon' },
];

const STATION_IDS = new Set([25544, 48274]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function cached(name, url, delayMs = 0) {
  mkdirSync(CACHE, { recursive: true });
  const file = new URL(name, CACHE);
  if (!FRESH) {
    try { if (Date.now() - statSync(file).mtimeMs < CACHE_MS) return readFileSync(file, 'utf8'); } catch {}
  }
  if (delayMs) await sleep(delayMs);
  const res = await fetch(url, { headers: { 'User-Agent': 'space-collector (github.com/sevaan/space-collector)' } });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  const text = await res.text();
  writeFileSync(file, text);
  return text;
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
  const text = await cached('satcat.csv', SATCAT_URL);
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

async function loadAllTles() {
  const tles = new Map();
  const thisYear = new Date().getUTCFullYear();
  for (let y = 1958; y <= thisYear; y++) {
    const text = await cached(`gp-${y}.tle`, `${GP}?INTDES=${y}&FORMAT=tle`, 1200);
    for (const t of parseTle(text)) tles.set(t.id, t);
    process.stdout.write(`\rOrbital elements: ${y} (${tles.size} objects)`);
  }
  process.stdout.write('\n');
  return tles;
}

function typeOf(kind, name, id) {
  if (STATION_IDS.has(id)) return 'station';
  if (kind === 'R/B') return 'rocket-body';
  if (kind === 'DEB') return 'debris';
  return 'satellite';
}

// Rough standard magnitude from radar cross-section (m²), or a type default.
function stdMagFor(o, family) {
  if (STD_MAG[o.id] != null) return STD_MAG[o.id];
  if (family) return family.stdMag;
  if (o.rcs > 0) return Math.max(1.5, Math.min(11, 5.2 - 2.5 * Math.log10(o.rcs)));
  // No radar size published (true of most objects launched since ~2015).
  if (o.type === 'rocket-body') return 4.5; // rocket stages are big
  if (o.type === 'debris') return 11; // assume small: too faint
  return 10; // payloads: most recent unsized ones are CubeSats, far too faint
}

const num = (s) => (s === undefined || s === '' ? null : Number(s));

const satcat = await loadSatcat();
const tles = await loadAllTles();

// Main payload of each launch, so a rocket stage's card can say what it carried.
const payloadByLaunch = new Map();
for (const r of satcat.values()) {
  if (r.OBJECT_TYPE !== 'PAY') continue;
  const launch = r.OBJECT_ID.slice(0, 8);
  if (!payloadByLaunch.has(launch) || r.OBJECT_ID.endsWith('A')) payloadByLaunch.set(launch, r.OBJECT_NAME);
}

const objects = [];
const skipped = { decayed: 0, far: 0, faint: 0, noFacts: 0 };
for (const t of tles.values()) {
  const s = satcat.get(t.id);
  if (!s) { skipped.noFacts++; continue; }
  if (s.DECAY_DATE) { skipped.decayed++; continue; }
  const perigee = num(s.PERIGEE), apogee = num(s.APOGEE);
  if (perigee == null || perigee > 2000 || perigee < 120) { skipped.far++; continue; }

  const kind = s.OBJECT_TYPE ?? 'UNK';
  const family = FAMILIES.find((f) => f.re.test(t.name));
  const o = {
    id: t.id,
    name: t.name,
    cospar: s.OBJECT_ID || null,
    kind,
    type: typeOf(kind, t.name, t.id),
    owner: s.OWNER || null,
    launch: s.LAUNCH_DATE || null,
    site: s.LAUNCH_SITE || null,
    ops: s.OPS_STATUS_CODE || null,
    period: num(s.PERIOD),
    incl: num(s.INCLINATION),
    apogee,
    perigee,
    rcs: num(s.RCS),
  };
  o.stdMag = +stdMagFor(o, family).toFixed(2);
  // Best case: straight overhead at perigee.
  const bestMag = o.stdMag + 5 * Math.log10(Math.max(perigee, 200) / 1000);
  if (bestMag > BINOCULAR_MAG) { skipped.faint++; continue; }
  // Debris only counts if it's a sizeable piece (radar size ≥ 0.3 m²).
  if (kind === 'DEB' && !(o.rcs >= 0.3)) { skipped.faint++; continue; }
  if (bestMag > NAKED_EYE_MAG) o.bino = 1;
  if (family) o.family = family.id;
  o.year = o.launch ? Number(o.launch.slice(0, 4)) : null;
  // Card key: constellation satellites share one card per launch.
  o.card = family && o.cospar ? `${family.id}:${o.cospar.slice(0, 8)}` : String(o.id);
  if (!family && kind !== 'PAY' && o.cospar) o.parent = payloadByLaunch.get(o.cospar.slice(0, 8)) ?? null;
  o.tier = family ? 'common' : tierFor(o);
  o.l1 = t.l1;
  o.l2 = t.l2;
  objects.push(o);
}
objects.sort((a, b) => a.id - b.id);

// Drop fields that are null, or shared by the whole family, to keep the file small.
const FAMILY_SHARED = ['kind', 'type', 'owner', 'site', 'ops', 'rcs', 'tier', 'stdMag', 'year'];
for (const o of objects) {
  for (const k of Object.keys(o)) if (o[k] == null) delete o[k];
  if (o.family) for (const k of FAMILY_SHARED) delete o[k];
}

const families = Object.fromEntries(FAMILIES.map((f) => [f.id, { name: f.name, stdMag: f.stdMag, owner: f.owner, maker: f.maker }]));
const catalog = { generated: new Date().toISOString(), source: 'CelesTrak', count: objects.length, families, objects };
const json = JSON.stringify(catalog);
writeFileSync(new URL('../data/catalog.json', import.meta.url), json);

const cards = new Set(objects.map((o) => o.card));
const tally = (f) => objects.reduce((m, o) => ((m[f(o)] = (m[f(o)] ?? 0) + 1), m), {});
console.log(`Wrote ${objects.length} objects (${cards.size} cards), ${(json.length / 1e6).toFixed(1)} MB`);
console.log('by type', tally((o) => o.type));
console.log('by family', tally((o) => o.family ?? '-'));
console.log('binocular only', objects.filter((o) => o.bino).length);
console.log('skipped', skipped);
