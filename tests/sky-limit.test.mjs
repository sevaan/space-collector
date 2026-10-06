import test from 'node:test';
import assert from 'node:assert/strict';
import { skyLimit, extinction, starlinkStdMag, nelmFromSb, SKIES } from '../js/sky-limit.js';

test('darker skies show fainter objects, in the usual ranges', () => {
  const m = Object.fromEntries(Object.keys(SKIES).map((k) => [k, skyLimit({ sky: k }).stars]));
  assert.ok(m.city < m.suburbs && m.suburbs < m.rural && m.rural < m.dark);
  assert.ok(m.city > 3.5 && m.city < 4.5);
  assert.ok(m.suburbs > 4.4 && m.suburbs < 5.2);
  assert.ok(m.dark > 6.2 && m.dark < 6.8);
  assert.ok(Math.abs(nelmFromSb(21.9) - 6.6) < 0.1); // pristine sky
});

test('the Moon and twilight brighten the sky; satellites are a little harder than stars', () => {
  const base = skyLimit({ sky: 'rural' });
  assert.ok(skyLimit({ sky: 'rural', moonEl: 50, moonIllum: 1 }).stars < base.stars - 0.8);
  assert.ok(skyLimit({ sky: 'rural', moonEl: 50, moonIllum: 0.1 }).stars > base.stars - 0.2); // thin crescent barely matters
  assert.equal(skyLimit({ sky: 'rural', moonEl: -5, moonIllum: 1 }).stars, base.stars);     // Moon below the horizon
  assert.ok(skyLimit({ sky: 'rural', sunEl: -9 }).stars < base.stars - 1.5);
  assert.ok(base.satellites < base.stars && base.binoculars > base.satellites);
});

test('objects low in the sky are dimmed', () => {
  assert.ok(Math.abs(extinction(90)) < 1e-6);
  assert.ok(extinction(30) > 0.2 && extinction(30) < 0.4);
  assert.ok(extinction(10) > 1);
});

test('working Starlinks are faint, newly launched ones bright', () => {
  const now = Date.parse('2026-10-05T00:00:00Z');
  assert.ok(starlinkStdMag({ launch: '2026-09-25', perigee: 300 }, now) < 5.5);
  assert.ok(starlinkStdMag({ launch: '2024-01-10', perigee: 540 }, now) > 6.5);
});
