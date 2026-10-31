import test from 'node:test';
import assert from 'node:assert/strict';

// The compass's first seconds (2026-10-31): a stale first heading must not send the player the wrong way and then jump.
const handlers = {};
globalThis.screen = { orientation: { angle: 0 } };
globalThis.window = { addEventListener: (name, fn) => { handlers[name] = fn; } };
globalThis.DeviceOrientationEvent = function DeviceOrientationEvent() {};
let clock = 1000; globalThis.performance = { now: () => clock };

const sensors = await import('../js/sensors.js');
await sensors.startSensors();

const azOf = (v) => (Math.atan2(v[0], v[1]) * 180 / Math.PI + 360) % 360;
const angleDiff = (a, b) => Math.abs(((a - b + 540) % 360) - 180);
const ios = (alpha, heading, n = 1, acc = 10) => { for (let i = 0; i < n; i++) { clock += 16; handlers.deviceorientation({ alpha, beta: 90, gamma: 0, webkitCompassHeading: heading, webkitCompassAccuracy: acc }); } };

test('while the compass wakes, directions wait (settling)', () => {
  ios(40, 250, 30, -1); // stale, uncalibrated: the phone really faces east (90)
  assert.equal(sensors.compassSettling(), true);
});

test('the real heading is taken at once, with the phone held still', () => {
  ios(40, 90, 3); // the compass wakes up: east
  assert.ok(angleDiff(azOf(sensors.trueBasis().back), 90) < 2, `snapped to east, got ${azOf(sensors.trueBasis().back)}`);
});

test('settled after it agrees with itself for a moment', () => {
  ios(40, 90, 200); // ~3.2 s of agreeing readings
  assert.equal(sensors.compassSettling(), false);
  assert.equal(sensors.pointing.settled, true);
});

test('never holds directions for more than a few seconds', () => {
  // a compass that keeps wandering: still released after SETTLE_MAX_MS
  for (let i = 0; i < 400; i++) ios(40, 90 + (i % 2 ? 15 : -15), 1);
  assert.equal(sensors.compassSettling(), false);
});
