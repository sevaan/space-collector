import test from 'node:test';
import assert from 'node:assert/strict';
import { sunPos } from '../js/lib/satellite.js';

// The vendored satellite.js 6.0.2 sunPos mixed degrees and radians in the Sun's mean anomaly (bug hunt 2026-10-27):
// the Sun sat up to 1.1° off its true place, so fades, eclipse shinies and dusk drifted through the year. Pinned here
// against the Sun's right ascension at the solstices and an equinox (Vallado / Meeus low-precision, good to ~0.01°).
const jd = (iso) => Date.parse(iso) / 86400000 + 2440587.5;
const deg = (r) => ((r * 180 / Math.PI) % 360 + 360) % 360;
const ra = (iso) => { const [x, y] = sunPos(jd(iso)).rsun; return deg(Math.atan2(y, x)); };
const dec = (iso) => { const [x, y, z] = sunPos(jd(iso)).rsun; return Math.asin(z / Math.hypot(x, y, z)) * 180 / Math.PI; };

test('the Sun is where it should be at the solstices and the equinox', () => {
  assert.ok(Math.abs(ra('2026-06-21T17:00:00Z') - 90.37) < 0.1, `June: ${ra('2026-06-21T17:00:00Z')}`);
  assert.ok(Math.abs(ra('2026-12-21T12:00:00Z') - 269.59) < 0.1, `December: ${ra('2026-12-21T12:00:00Z')}`);
  assert.ok(Math.abs(dec('2026-03-20T14:46:00Z')) < 0.05, `equinox declination: ${dec('2026-03-20T14:46:00Z')}`); // equinox 2026-03-20 14:46 UTC
});
