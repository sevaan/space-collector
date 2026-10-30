import test from 'node:test';
import assert from 'node:assert/strict';

// Minimal browser stand-ins so sensors.js can run under Node.
const handlers = {};
globalThis.screen = { orientation: { angle: 0 } };
globalThis.window = { addEventListener: (name, fn) => { handlers[name] = fn; } };
globalThis.DeviceOrientationEvent = function DeviceOrientationEvent() {};
let clock = 1000; globalThis.performance = { now: () => clock }; // ~60 events a second, so the turn rate is real

const sensors = await import('../js/sensors.js');
await sensors.startSensors();

const azOf = (v) => (Math.atan2(v[0], v[1]) * 180 / Math.PI + 360) % 360;
const elOf = (v) => Math.asin(v[2]) * 180 / Math.PI;
const angleDiff = (a, b) => Math.abs(((a - b + 540) % 360) - 180);
const ios = (alpha, beta, heading, n = 1) => {
  for (let i = 0; i < n; i++) { clock += 16; handlers.deviceorientation({ alpha, beta, gamma: 0, webkitCompassHeading: heading, webkitCompassAccuracy: 10 }); }
};
// Turning on the spot: alpha and the compass move together (the phone turns left by `deg` over n events).
const turn = (alpha0, beta, heading0, deg, n) => { for (let i = 1; i <= n; i++) ios(alpha0 + deg * i / n, beta, heading0 - deg * i / n); };

test('holding the phone upright calibrates the heading', () => {
  ios(40, 90, 90, 40); // upright, camera facing east (arbitrary alpha of 40)
  const b = sensors.trueBasis();
  assert.ok(angleDiff(azOf(b.back), 90) < 1, `faces east, got ${azOf(b.back)}`);
  assert.ok(Math.abs(elOf(b.back)) < 1);
});

test('tipping the phone overhead does not spin the sky when iOS flips its compass reading', () => {
  // Tip back to 60° and 80° up. iOS now measures from the top edge, which points west: reading ~270.
  ios(40, 150, 270, 200);
  ios(40, 170, 270, 200);
  const b = sensors.trueBasis();
  // Camera still points up and toward the east, not toward the west.
  assert.ok(elOf(b.back) > 75, `points high, got ${elOf(b.back)}`);
  assert.ok(angleDiff(azOf(b.back), 90) < 3, `still east, got ${azOf(b.back)}`);
});

test('back upright, a brief compass glitch is ignored', () => {
  ios(40, 90, 90, 30);
  ios(40, 90, 200, 20); // a short burst of nonsense (e.g. passing a metal railing)
  const b = sensors.trueBasis();
  assert.ok(angleDiff(azOf(b.back), 90) < 3, `glitch ignored, got ${azOf(b.back)}`);
});

test('held still, a disagreeing compass does not turn the sky', () => {
  ios(40, 90, 100, 300); // 10° off for 5 s with the phone still: the sky stays where it was
  const b = sensors.trueBasis();
  assert.ok(angleDiff(azOf(b.back), 90) < 1, `held, got ${azOf(b.back)}`);
});

test('a real, lasting change in the compass is accepted after a moment', () => {
  ios(40, 90, 130, 400); // consistently 40° different for several seconds…
  turn(40, 90, 130, 20, 30); ios(60, 90, 110, 120); // …taken as soon as the phone moves
  const b = sensors.trueBasis();
  assert.ok(angleDiff(azOf(b.back), 110) < 5, `recalibrated, got ${azOf(b.back)}`);
});
