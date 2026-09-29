import test from 'node:test';
import assert from 'node:assert/strict';
import { isPractice, collectedDuringPass, canCapture } from '../js/observation.js';

const live = { timeOffsetMs: 0, dragOn: false, sensorsLive: true, locationReady: true, captureAny: false, preview: false };
const now = Date.UTC(2026, 8, 29, 22, 0);
const minute = 60 * 1000;

test('current GPS, time, and live pointing allow an earned observation', () => {
  assert.equal(isPractice(live), false);
});

test('visibility override is practice even with real GPS and sensors', () => {
  assert.equal(isPractice({ ...live, captureAny: true }), true);
});

test('missing or stale GPS/sensors cannot earn a card', () => {
  assert.equal(isPractice({ ...live, locationReady: false }), true);
  assert.equal(isPractice({ ...live, sensorsLive: false }), true);
  assert.equal(isPractice(), true);
});

test('manual pointing, time travel, and preview each force practice', () => {
  for (const override of [{ dragOn: true }, { timeOffsetMs: minute }, { timeOffsetMs: -minute }, { preview: true }]) {
    assert.equal(isPractice({ ...live, ...override }), true);
  }
});

test('simulated sightings cannot block a real sighting during the same pass', () => {
  const sightings = [{ objectId: 25544, time: now, sim: true }];
  assert.equal(collectedDuringPass(sightings, 25544, now + minute, false), false);
  assert.equal(collectedDuringPass(sightings, 25544, now + minute, true), true);
});

test('real sightings cannot block practice during the same pass', () => {
  const sightings = [{ objectId: 25544, time: now, sim: false }];
  assert.equal(collectedDuringPass(sightings, 25544, now + minute, true), false);
  assert.equal(collectedDuringPass(sightings, 25544, now + minute, false), true);
});

test('one object can be captured again on a later pass, at the twenty-minute boundary', () => {
  const sightings = [{ objectId: 25544, time: now, sim: false }];
  assert.equal(collectedDuringPass(sightings, 25544, now + 19 * minute, false), true);
  assert.equal(collectedDuringPass(sightings, 25544, now + 20 * minute, false), false);
  assert.equal(collectedDuringPass(sightings, 25544, now + 90 * minute, false), false);
  assert.equal(collectedDuringPass(sightings, 48274, now, false), false);
});

test('backward practice time does not duplicate a capture from the same pass', () => {
  const sightings = [{ objectId: 25544, time: now, sim: true }];
  assert.equal(collectedDuringPass(sightings, 25544, new Date(now - minute), true), true);
});

test('legacy unflagged sightings are real; explicit practice records remain practice', () => {
  assert.equal(collectedDuringPass([{ objectId: 25544, time: now }], 25544, now, false), true);
  assert.equal(collectedDuringPass([{ objectId: 25544, time: now, practice: true }], 25544, now, false), false);
});

test('invalid search time or pass duration cannot report a previous capture', () => {
  const sightings = [{ objectId: 25544, time: now }];
  assert.equal(collectedDuringPass(sightings, 25544, NaN, false), false);
  assert.equal(collectedDuringPass(sightings, 25544, now, false, 0), false);
});

test('alignment is required for visible objects and every practice override', () => {
  assert.equal(canCapture({ visible: true, aligned: false }), false);
  assert.equal(canCapture({ visible: false, aligned: false, practice: true, allowAny: true }), false);
  assert.equal(canCapture({ visible: true, aligned: true }), true);
});

test('visibility override never permits a real capture', () => {
  assert.equal(canCapture({ visible: false, aligned: true, practice: false, allowAny: true }), false);
  assert.equal(canCapture({ visible: false, aligned: true, practice: true, allowAny: true }), true);
  assert.equal(canCapture({ visible: false, aligned: true, practice: true, allowAny: false }), false);
});
