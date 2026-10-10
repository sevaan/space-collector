import test from 'node:test';
import assert from 'node:assert/strict';
import { nightKey, nightsIn, collectedTonight } from '../js/observation.js';
import { NATURAL, naturalTargets, SOLAR_SYSTEM } from '../js/natural.js';
import { buildCards } from '../js/card-model.js';
import { levelFor, cardLevel } from '../js/card.js';

const H = 3600e3;
// 22:00 and 02:00 local (lon 0) are the same observing night; the next evening is a new one.
const evening = Date.UTC(2026, 9, 5, 22), small = Date.UTC(2026, 9, 6, 2), next = Date.UTC(2026, 9, 6, 21);

test('an observing night runs local noon to noon', () => {
  assert.equal(nightKey(evening, 0), nightKey(small, 0));
  assert.notEqual(nightKey(small, 0), nightKey(next, 0));
  // Peterborough (lon -78): 21:00 local = 02:00 UTC next day, still the same night as 23:00 local.
  assert.equal(nightKey(Date.UTC(2026, 9, 6, 2), -78.3), nightKey(Date.UTC(2026, 9, 6, 4), -78.3));
});

test('nights count distinct observing nights, ignoring practice', () => {
  const s = [{ time: evening }, { time: small }, { time: next }, { time: next + 30 * 24 * H, sim: true }];
  assert.equal(nightsIn(s), 2);
});

test('natural objects: once per night', () => {
  const s = [{ cardKey: 'moon', time: evening, lon: 0 }];
  assert.equal(collectedTonight(s, 'moon', small, 0), true);
  assert.equal(collectedTonight(s, 'moon', next, 0), false);
  assert.equal(collectedTonight(s, 'planet:venus', small, 0), false);
});

test('levels: nights 1/3/10, and sightings-based levels earned before Oct 2026 are kept', () => {
  assert.equal(levelFor(1), 'bronze'); assert.equal(levelFor(3), 'silver'); assert.equal(levelFor(10), 'gold');
  const sameNight = Array.from({ length: 6 }, (_, i) => ({ time: Date.UTC(2026, 8, 20, 22) + i * 60e3, lon: 0 }));
  assert.equal(cardLevel(sameNight), 'silver'); // legacy: 5+ sightings before the change
  const newRules = Array.from({ length: 6 }, (_, i) => ({ time: evening + i * 60e3, lon: 0 }));
  assert.equal(cardLevel(newRules), 'bronze'); // one night under the new rules
});

test('Moon, seven planets and 21 stars become cards in their own sets (the Solar System is a patch now)', () => {
  const cards = buildCards({ objects: [], families: {} }).filter((c) => c.natural);
  assert.equal(cards.length, 30);
  assert.deepEqual(cards.filter((c) => c.set === 'wanderers').map((c) => c.name), ['The Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune']);
  assert.ok(!cards.some((c) => c.key === 'system:solar'));
  assert.equal(SOLAR_SYSTEM.stars.length, 9); assert.ok(SOLAR_SYSTEM.stars.includes('planet:neptune') && SOLAR_SYSTEM.stars.includes('moon') && SOLAR_SYSTEM.stars.includes('sun'));
  assert.equal(cards.filter((c) => c.set === 'bright-stars').length, 21);
  assert.equal(cards.find((c) => c.key === 'star:sirius').setNumber, 1);
  for (const c of NATURAL) assert.ok(c.fact && c.stats.length === 3 && (c.system || c.far.length === 2), c.key);
});

test('visibility rules: Moon in daylight, planets after sunset, stars only when dark', () => {
  const up = (el) => [0, Math.cos(el * Math.PI / 180), Math.sin(el * Math.PI / 180)];
  const at = (sunEl) => naturalTargets(
    [{ kind: 'sun', enu: up(sunEl) }, { kind: 'moon', enu: up(40), illum: 0.6 }, { kind: 'planet', name: 'Venus', enu: up(10), mag: -4 }],
    [{ name: 'Sirius', enu: up(30), mag: -1.4 }],
  ).map((n) => [n.obj.key, n.look.visible]);
  assert.deepEqual(at(20), [['sun', true], ['moon', true], ['planet:venus', false], ['star:sirius', false]]); // the Sun is a daytime catch
  assert.deepEqual(at(-4), [['sun', false], ['moon', true], ['planet:venus', true], ['star:sirius', false]]);
  assert.deepEqual(at(-12), [['sun', false], ['moon', true], ['planet:venus', true], ['star:sirius', true]]);
});
