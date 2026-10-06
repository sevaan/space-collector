import test from 'node:test';
import assert from 'node:assert/strict';
import { shinyFor } from '../js/shiny.js';

const sat = { id: 1, type: 'satellite', launch: '2020-01-01' };
const at = Date.parse('2026-10-05T02:00:00Z');
const up = (el) => ({ el, enu: [0, Math.cos(el * Math.PI / 180), Math.sin(el * Math.PI / 180)], sunlit: true });

test('ordinary passes are not shiny', () => {
  assert.equal(shinyFor(sat, up(40), up(41), null, at), null);
});
test('slipping into Earth\'s shadow, straight overhead, fresh launches', () => {
  assert.equal(shinyFor(sat, up(40), { ...up(41), sunlit: false }, null, at), 'eclipse');
  assert.equal(shinyFor(sat, up(84), up(83), null, at), 'overhead');
  assert.equal(shinyFor({ ...sat, launch: '2026-09-20' }, up(40), up(41), null, at), 'fresh');
});
test('beside the Moon: within 1° for satellites, 5° for planets and stars', () => {
  const moon = { enu: up(40).enu, illum: 0.5 };
  assert.equal(shinyFor(sat, up(40.5), up(41), moon, at), 'moon');
  assert.equal(shinyFor(sat, up(43), up(44), moon, at), null);
  assert.equal(shinyFor({ id: 'planet:saturn', type: 'planet', natural: 'planet' }, up(43), null, moon, at), 'moon');
});
test('the Moon itself is shiny only when full', () => {
  assert.equal(shinyFor({ id: 'moon', type: 'moon', natural: 'moon' }, { ...up(30), illum: 0.99 }, null, null, at), 'fullmoon');
  assert.equal(shinyFor({ id: 'moon', type: 'moon', natural: 'moon' }, { ...up(30), illum: 0.6 }, null, null, at), null);
});
