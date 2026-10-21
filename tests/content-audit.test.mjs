import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fixIssDeployed } from '../scripts/iss-deployed.mjs';
import { applyCatalogCorrections } from '../scripts/catalog-corrections.mjs';

const read = (path) => JSON.parse(fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
globalThis.fetch = async (url) => ({ json: async () => {
  const path = String(url).replace(/\?.*$/, ''), data = read(path);
  // Also exercise a stale cached distance file: the runtime must reject the old bad parallax.
  return path.endsWith('star-dist.json') ? { ...data, 89341: [36239.6, 3.111] } : data;
} });
const version = read('version.json').version;
// Use the same module instances as the app’s versioned imports.
const natural = await import(`../js/natural.js?v=${version}`);
const cons = await import(`../js/constellations.js?v=${version}`);
const lore = await import(`../js/lore.js?v=${version}`);
const { buildCards } = await import(`../js/card-model.js?v=${version}`);
const { expandFacts } = await import(`../js/catalog-facts.js?v=${version}`);
const { orbitalCardStats } = await import(`../js/card.js?v=${version}`);
await Promise.all([cons.loadConstellations(), lore.loadLore()]);
await import(`../js/stories.js?v=${version}`);
const catalogue = read('data/catalog.json');
catalogue.objects.forEach(expandFacts);
const cards = buildCards(catalogue), byKey = new Map(cards.map((c) => [c.key, c]));

test('the expanded, fully loaded catalogue has one card per key and retains every figure member', () => {
  assert.equal(cons.CONSTELLATIONS.length, 89, 'all 88 constellations and the Big Dipper loaded');
  assert.equal(byKey.size, cards.length, 'duplicate card keys');
  for (const c of cons.CONSTELLATIONS) for (const key of c.stars) assert.ok(byKey.has(key), `${c.name}: ${key}`);
  assert.ok(byKey.has('star:alpha-centauri'), 'retain existing bright-star collection key');
  for (const c of cards) assert.ok(lore.factFor(c) && lore.factFor(c) !== 'A tracked object in Earth orbit.', c.key);
});

test('shared stars have physical IAU constellations independent of the figure they help draw', () => {
  const expected = { 677: 'Andromeda', 25428: 'Taurus', 39429: 'Puppis', 79593: 'Ophiuchus', 39953: 'Vela', 42913: 'Vela', 31685: 'Puppis', 12770: 'Cetus' };
  for (const [hip, constellation] of Object.entries(expected)) {
    const star = cards.find((c) => c.type === 'star' && c.hip === Number(hip));
    assert.equal(star?.constellation, constellation, hip);
    assert.equal(star.stats.find((s) => s[0] === 'CONSTELLATION')?.[1], constellation, hip);
  }
  for (const key of cons.CON_BY_ID.get('BigDipper').stars) assert.equal(byKey.get(key).constellation, 'Ursa Major');
  assert.ok(cons.CON_BY_ID.get('Aur').stars.includes('star:hip25428'), 'Elnath still completes the Auriga figure');
});

test('a statistically insignificant parallax does not become a displayed distance', () => {
  const polis = byKey.get('star:hip89341');
  assert.equal(cons.starDistance(89341), null);
  assert.ok(!polis.stats.some((s) => s[0] === 'DISTANCE'));
  assert.doesNotMatch(polis.fact, /36,?200|36,?239|27 days/);
  for (const value of Object.values(read('data/star-dist.json'))) assert.ok(value[0] > 0 && value[1] >= 0 && value[1] < 1);
});

test('orbital card speeds are approximate for circular orbits and explicitly variable for eccentric ones', () => {
  const circular = orbitalCardStats({ perigee: 400, apogee: 400, period: 92.5 });
  assert.deepEqual(circular[0], ['MEAN HEIGHT', '400', 'km']);
  assert.equal(circular[1][2], 'km/h');
  const kmh = Number(circular[1][1].replace(/[~,]/g, ''));
  assert.ok(kmh > 27000 && kmh < 28000, String(kmh));
  assert.deepEqual(orbitalCardStats({ perigee: 500, apogee: 39000, period: 720 })[1], ['SPEED', 'Varies', '']);
  assert.deepEqual(orbitalCardStats({ period: 95 })[1], ['SPEED', '—', '']);
});

test('unrelated stars in a pattern are not assigned one light-departure date', () => {
  const coathanger = byKey.get('deep:coathanger');
  assert.ok(coathanger.stats.some((s) => s[0] === 'DISTANCES' && s[1] === 'Different'));
  assert.deepEqual(coathanger.far, ['Various', 'STELLAR DISTANCES']);
  assert.ok(!coathanger.stats.some((s) => s[0] === 'LIGHT LEFT IT'));
});

test('orbital inference and historical firsts remain qualified across every applicable card', () => {
  const typical = lore.computedFacts({ perigee: 500, apogee: 510, incl: 97.5, period: 95, type: 'satellite' }).find((s) => s.includes('sun-synchronous'));
  assert.match(typical, /typical/);
  assert.doesNotMatch(typical, /always looks the same/);
  for (const c of cards) assert.doesNotMatch(lore.factFor(c), /first-ever crash between two satellites/, c.key);
  const debris = cards.find((c) => c.type === 'debris' && read('data/debris.json')[c.id]);
  assert.equal(lore.factSourceFor(debris), 'Researched debris');
});

test('ISS deployables use documented cargo launch dates, never neighbouring catalogue dates', () => {
  const known = { id: 67683, cospar: '1998-067YA', launch: '1998-11-20', year: 1998 };
  const unknown = { id: 999999, cospar: '1998-067ZZZ', launch: '1998-11-20', year: 1998 };
  const station = { id: 25544, cospar: '1998-067A', launch: '1998-11-20' };
  const neighbour = { id: 999998, cospar: '2026-123A', launch: '2026-06-01' };
  fixIssDeployed([station, known, neighbour, unknown], read('data/catalog-corrections.json'));
  assert.equal(known.launch, '2025-10-26'); assert.equal(known.year, 2025);
  assert.equal(unknown.launch, undefined); assert.equal(unknown.year, undefined);
  assert.equal(unknown.issDeploy, 1); assert.equal(station.launch, '1998-11-20');
});

test('curated metadata survives a refresh, checks identity and never changes live orbital elements', () => {
  const corrections = read('data/catalog-corrections.json');
  const el = ['2026-10-21', 15.3, 0.001, 97];
  const valid = { id: 23526, cospar: '1995-012A', launch: '1995-03-21', el };
  const reassigned = { id: 23526, cospar: '2026-999A', launch: '2026-10-21', el };
  const doubtful = { id: 11792, cospar: '1966-096C', launch: '1966-10-26', parent: 'X', year: 1966, el };
  assert.equal(applyCatalogCorrections([valid, reassigned, doubtful], corrections), 2);
  assert.equal(valid.launch, '1995-03-22'); assert.equal(valid.el, el);
  assert.equal(reassigned.launch, '2026-10-21'); assert.equal(doubtful.launch, undefined);
  assert.equal(doubtful.parent, undefined); assert.equal(doubtful.year, undefined);
});

test('the shipped snapshot carries the reviewed launch dates and rocket classification', () => {
  const byId = new Map(catalogue.objects.map((o) => [o.id, o]));
  for (const [id, entry] of Object.entries(read('data/catalog-corrections.json'))) {
    const o = byId.get(Number(id)); if (!o) continue;
    for (const [field, value] of Object.entries(entry.fields)) assert.equal(o[field] ?? null, value, `${id}:${field}`);
  }
  assert.equal(byId.get(67647).type, 'rocket-body');
});
