import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildCards } from '../js/card-model.js';
import { factFor, computedFacts, factSourceFor, loadLore } from '../js/lore.js';

const read = (p) => JSON.parse(fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8'));
const cat = read('data/catalog.json');
const cards = buildCards(cat);
globalThis.fetch = async (u) => ({ json: async () => read(String(u)) });
await loadLore('data/lore.json');
const series = read('data/series.json'), lore = read('data/lore.json');

test('every card has a real fact', () => {
  for (const c of cards) {
    const f = factFor(c);
    assert.ok(f && f !== 'A tracked object in Earth orbit.', `${c.key} ${c.name} has no fact`);
  }
});

test('facts never extrapolate the orbit over decades, and debris never "carried" anything', () => {
  for (const c of cards) {
    const f = factFor(c);
    assert.doesNotMatch(f, /lapped Earth|has travelled|trips to the Moon/, c.name);
    if (c.type === 'debris') assert.doesNotMatch(f, /It carried|size of a bus|Same rocket family/, c.name);
    if (c.kind !== 'PAY' && !c.natural && !c.launches) assert.doesNotMatch(f, /weather satellite run by|is the name the Soviet Union/, c.name);
  }
});

test('speed is only claimed for near-circular orbits', () => {
  const oval = { id: 1, name: 'X', launch: '2000-01-01', period: 600, apogee: 35000, perigee: 300, incl: 20, type: 'rocket-body', kind: 'R/B' };
  assert.ok(!computedFacts(oval).some((f) => f.includes('km every second')));
  assert.ok(computedFacts(oval).some((f) => f.includes('long oval')));
  const round = { ...oval, apogee: 550, perigee: 540, period: 95 };
  assert.ok(computedFacts(round).some((f) => f.includes('km every second')));
});

test('date comparisons use the real dates', () => {
  const at = (launch) => computedFacts({ id: 1, name: 'X', launch, type: 'satellite', kind: 'PAY' });
  assert.ok(at('1969-07-19').some((f) => f.includes('Apollo 11')));
  assert.ok(at('1989-06-01').some((f) => f.includes('before Google')));   // after the web was proposed
  assert.ok(!at('1989-06-01').some((f) => f.includes('World Wide Web')));
  assert.ok(at('2007-06-28').some((f) => f.includes('iPhone')));
  assert.ok(!at('2007-06-30').some((f) => f.includes('iPhone')));
});

test('researched Kosmos series facts reach their satellites, and each series cites a source', () => {
  for (const [key, ser] of Object.entries(series.series)) for (const src of [ser.source].flat()) assert.match(src, /^https:\/\//, key);
  const byId = new Map(cards.map((c) => [String(c.id), c]));
  for (const [id, key] of Object.entries(series.members)) {
    const c = byId.get(id); if (!c) continue;
    const ser = series.series[key];
    const expected = lore[id]?.fact ?? (ser.facts ? ser.facts[Number(id) % ser.facts.length] : ser.fact);
    assert.equal(factFor(c), expected, `${c.name} (${key})`);
  }
  assert.match(factFor(byId.get('13301')), /British Columbia/);   // Kosmos 1383, COSPAS 1
  assert.equal(factSourceFor(byId.get('13301')), 'Hand-written');
  assert.match(factFor(byId.get('22675')), /Iridium 33/);         // Kosmos 2251
});

test('every hand-written fact added with a source names it', () => {
  for (const [id, entry] of Object.entries(lore)) if (entry?.source) assert.match(entry.source, /^https:\/\//, id);
});
