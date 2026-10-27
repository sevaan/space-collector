import test from 'node:test';
import assert from 'node:assert/strict';
import { progress, missionsFor, streaks, RANKS } from '../js/progress.js';
import { nightKey } from '../js/observation.js';

const INFO = { a: { tier: 'rare', type: 'rocket-body', owner: 'CIS', launch: '1965-01-01' }, b: { tier: 'common', type: 'satellite', owner: 'US', launch: '2024-01-01' },
  moon: { tier: 'common', type: 'moon', natural: 'moon' }, s1: { tier: 'common', type: 'star', natural: 'star', con: 'Cru' }, s2: { tier: 'rare', type: 'star', natural: 'star', con: 'Cru' } };
const info = (k) => INFO[k] ?? null;
const T = Date.parse('2026-10-06T02:30:00Z'); // 10:30 pm in Ontario
const s = (k, dt, extra = {}) => ({ cardKey: k, time: T + dt * 1000, lon: -78.3, el: 40, ...extra });

test('XP: first catch by rarity, repeats only once per night, shiny bonus', () => {
  const p = progress([s('a', 0), s('a', 30), s('b', 3600, { shiny: 'overhead' })], info, { now: T + 7200e3 });
  assert.ok(p.xp >= 25 + 10 + 100); // rare 25, common 10 (flattened 2026-10-10), shiny 100
  assert.equal(p.cards, 2);
});
test('three missions per night, the same for everyone, no repeats', () => {
  const m = missionsFor('2026-10-05');
  assert.equal(m.length, 3); assert.equal(new Set(m.map((x) => x.id)).size, 3);
  assert.deepEqual(missionsFor('2026-10-05').map((x) => x.id), m.map((x) => x.id));
});
test('achievements: Space Race, Old Timer, Double Sighting, a constellation patch', () => {
  const p = progress([s('a', 0), s('b', 40), s('s1', 100), s('s2', 200)], info, { constellations: [{ id: 'Cru', name: 'Southern Cross', nick: 'Crux', stars: ['s1', 's2'], zodiac: false }], now: T + 3600e3 });
  const got = new Set(p.achievements.filter((x) => x.done).map((x) => x.id));
  for (const id of ['first', 'race', 'oldtimer', 'double', 'con-Cru']) assert.ok(got.has(id), id);
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
test('a first night gets the starter missions; a stored deal is used after that', () => {
  assert.deepEqual(progress([], info, { now: T }).missions.map((m) => m.id), ['firstcard', 'satellite', 'planet']);
  const later = T + 3 * 86400e3, night = String(nightKey(later, -78.3));
  const p = progress([s('a', 0)], info, { now: later, deals: { [night]: ['stage', 'old', 'five'] } });
  assert.deepEqual(p.missions.map((m) => m.id), ['stage', 'old', 'five']);
});
test('XP carry keeps an earlier rank', () => {
  const p = progress([s('a', 0)], info, { now: T + 3600e3, carry: 600 });
  assert.ok(p.xp >= 600); assert.equal(p.rank.name, 'Spotter'); // ranks 0 / 300 / 1,000… since 2026-10-12
});
test('XP: a new card caught at its peak gets +10 (2026-10-25)', () => {
  const plain = progress([s('a', 0)], info, { now: T + 3600e3 }).xp, peak = progress([s('a', 0, { peak: true })], info, { now: T + 3600e3 }).xp;
  assert.equal(peak - plain, 10);
});
test('themed weeks: stage week done with three countries gives +150 and the badge (2026-10-25)', () => {
  const ws = new Date(2026, 10, 2).getTime(); // a Monday, local midnight (weeks count from 2026-10-26)
  const id = 'stages', themes = { [new Date(ws).setHours(0, 0, 0, 0)]: id };
  const I = { ...INFO, c: { tier: 'common', type: 'rocket-body', owner: 'US', launch: '1990-01-01' }, d: { tier: 'common', type: 'rocket-body', owner: 'PRC', launch: '2010-01-01' } };
  const inf = (k) => I[k] ?? null, t = ws + 2 * 86400e3, sg = (k, m) => ({ cardKey: k, time: t + m * 60e3, lon: -78.3, el: 40 });
  const two = progress([sg('a', 0), sg('c', 5)], inf, { now: t + 3600e3, weekThemes: themes }), three = progress([sg('a', 0), sg('c', 5), sg('d', 10)], inf, { now: t + 3600e3, weekThemes: themes });
  assert.equal(two.week.id, 'stages'); assert.equal(two.week.have, 2);
  assert.equal(three.week.have, 3);
  assert.equal(three.xp - two.xp, 10 + 150); // the third stage's own XP, plus the week
  assert.ok(three.achievements.find((x) => x.id === 'week-stages').done);
});

test('Star week counts new constellation stars (bug hunt 2026-10-27: the weeks loop had no first flag)', () => {
  const ws = new Date(2026, 10, 2).getTime(); // a Monday
  const themes = { [new Date(ws).setHours(0, 0, 0, 0)]: 'stars' };
  const I = { ...INFO }; for (let k = 0; k < 12; k++) I[`st${k}`] = { tier: 'common', type: 'star', natural: 'star', con: 'Ori' };
  const inf = (k) => I[k] ?? null, t = ws + 2 * 86400e3, sg = (k, m) => ({ cardKey: k, time: t + m * 60e3, lon: -78.3, el: 40 });
  const nine = progress(Array.from({ length: 9 }, (_, k) => sg(`st${k}`, k)), inf, { now: t + 3600e3, weekThemes: themes });
  assert.equal(nine.week.id, 'stars'); assert.equal(nine.week.have, 9);
  const ten = progress(Array.from({ length: 11 }, (_, k) => sg(`st${k}`, k)), inf, { now: t + 3600e3, weekThemes: themes });
  assert.equal(ten.week.have, 10);
  assert.ok(ten.achievements.find((x) => x.id === 'week-stars').done);
  const again = progress([sg('st0', 0), sg('st0', 5), sg('st0', 10)], inf, { now: t + 3600e3, weekThemes: themes });
  assert.equal(again.week.have, 1); // the same star again is not a new one
});
test('fleet cards level by stamps, not nights (bug hunt 2026-10-27)', () => {
  const I = { ...INFO, STARLINK: { tier: 'common', type: 'satellite', owner: 'US', launch: '2019-05-24' } };
  const inf = (k) => I[k] ?? null, night = nightKey(T, -78.3), deals = { [night]: ['levelup2', 'china', 'deep'] };
  const sl = (n, dayOffset) => ({ cardKey: 'STARLINK', stampKey: `STARLINK:2024-${String(n).padStart(3, '0')}`, time: T + dayOffset * 86400e3 + n * 60e3, lon: -78.3, el: 40 });
  // one launch seen on three nights: the card stays bronze, so no level-up mission and no Regular Visitor
  const nights3 = progress([s('b', -3 * 86400), sl(1, -2), sl(1, -1), sl(1, 0)], inf, { now: T + 3600e3, deals });
  assert.equal(nights3.missions.find((m) => m.id === 'levelup2').done, false);
  assert.equal(nights3.achievements.find((x) => x.id === 'silver').done, false);
  // the tenth launch stamped tonight turns Starlink silver
  const ten = progress([s('b', -3 * 86400), ...Array.from({ length: 10 }, (_, k) => sl(k + 1, 0))], inf, { now: T + 3600e3, deals });
  assert.equal(ten.missions.find((m) => m.id === 'levelup2').done, true);
  // 50 Starlink launches and two fleets at 10: three gold cards
  const golds = [s('b', -3 * 86400), ...Array.from({ length: 50 }, (_, k) => sl(k + 1, 0)),
    ...Array.from({ length: 10 }, (_, k) => ({ cardKey: 'ONEWEB', stampKey: `ONEWEB:2024-${k}`, time: T + 100e3 + k, lon: -78.3, el: 40 })),
    ...Array.from({ length: 10 }, (_, k) => ({ cardKey: 'KUIPER', stampKey: `KUIPER:2024-${k}`, time: T + 200e3 + k, lon: -78.3, el: 40 }))];
  assert.equal(progress(golds, inf, { now: T + 3600e3, deals }).achievements.find((x) => x.id === 'gold3').done, true);
});
