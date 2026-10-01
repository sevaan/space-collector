import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildCards } from '../js/card-model.js';
import { factFor, computedFacts } from '../js/lore.js';

const cat = JSON.parse(fs.readFileSync(new URL('../data/catalog.json', import.meta.url), 'utf8'));
const cards = buildCards(cat);

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
