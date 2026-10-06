import test from 'node:test';
import assert from 'node:assert/strict';
import { progress, missionsFor, streaks, RANKS } from '../js/progress.js';

const INFO = { a: { tier: 'rare', type: 'rocket-body', owner: 'CIS', launch: '1965-01-01' }, b: { tier: 'common', type: 'satellite', owner: 'US', launch: '2024-01-01' },
  moon: { tier: 'common', type: 'moon', natural: 'moon' }, s1: { tier: 'common', type: 'star', natural: 'star', con: 'Cru' }, s2: { tier: 'rare', type: 'star', natural: 'star', con: 'Cru' } };
const info = (k) => INFO[k] ?? null;
const T = Date.parse('2026-10-06T02:30:00Z'); // 10:30 pm in Ontario
const s = (k, dt, extra = {}) => ({ cardKey: k, time: T + dt * 1000, lon: -78.3, el: 40, ...extra });

test('XP: first catch by rarity, repeats only once per night, shiny bonus', () => {
  const p = progress([s('a', 0), s('a', 30), s('b', 3600, { shiny: 'overhead' })], info, { now: T + 7200e3 });
  assert.ok(p.xp >= 40 + 10 + 100);
  assert.equal(p.cards, 2);
});
test('three missions per night, the same for everyone, no repeats', () => {
  const m = missionsFor('2026-10-05');
  assert.equal(m.length, 3); assert.equal(new Set(m.map((x) => x.id)).size, 3);
  assert.deepEqual(missionsFor('2026-10-05').map((x) => x.id), m.map((x) => x.id));
});
test('achievements: Space Race, Old Timer, Double Sighting, Star Map', () => {
  const p = progress([s('a', 0), s('b', 40), s('s1', 100), s('s2', 200)], info, { constellations: [{ id: 'Cru', stars: ['s1', 's2'], zodiac: false }], now: T + 3600e3 });
  const got = new Set(p.achievements.filter((x) => x.done).map((x) => x.id));
  for (const id of ['first', 'race', 'oldtimer', 'double', 'constellation']) assert.ok(got.has(id), id);
  assert.ok(!got.has('zodiac'));
});
test('weekly streaks forgive missed nights but not missed weeks', () => {
  const w = 7 * 86400e3;
  const st = streaks([{ time: T - 3 * w }, { time: T - 2 * w }, { time: T - w }, { time: T }], T);
  assert.equal(st.current, 4); assert.equal(st.best, 4);
  assert.equal(streaks([{ time: T - 3 * w }], T).current, 0);
});
test('ranks climb with XP', () => {
  assert.equal(RANKS[0][1], 'Stargazer');
  assert.equal(progress([], info).rank.name, 'Stargazer');
});
