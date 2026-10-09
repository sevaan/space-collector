// Phone orientation -> where the back of the phone is pointing in the sky.
// Produces a camera basis in local East-North-Up: right, up (screen edges) and back (view direction).
import { declination } from './declination.js?v=0.1.349';

const RAD = Math.PI / 180;

export const pointing = {
  source: 'none',        // 'ios' | 'absolute' | 'relative' | 'none'
  basis: null,           // { right, up, back } unit vectors in ENU, before heading offset
  headingOffset: 0,      // degrees added to raw azimuth to get true azimuth
  compassAccuracy: null, // iOS: ± degrees, -1 = uncalibrated
  compassJumpAt: 0,      // when the compass last swung far enough that we had to accept a big correction
  compassDoubt: 0,       // 0..1: how much the compass currently disagrees with where we think north is
  lastEvent: 0,
};

// The compass nudge is remembered on this phone (2026-10-08, Sevaan: −20° lined everything up). Most of a steady
// error like that is the phone's compass plus magnetic declination (iOS reports magnetic north), which don't change
// from night to night, so it shouldn't need redoing every visit.
const readNudge = () => { try { const n = Number(localStorage.getItem('compassNudge')); return Number.isFinite(n) ? n : 0; } catch { return 0; } };
let manualNudge = readNudge(), headingLocked = false, nudgeSave = 0;
export function lockHeading(on) { headingLocked = !!on; }
// True north (2026-10-08): iOS's compass is magnetic, so add the local declination (js/declination.js, WMM2025).
// The first time it's applied, a saved nudge is moved by the same amount so the sky doesn't jump for someone who
// had already lined it up by hand (Sevaan's −20° becomes about −9°).
let decl = 0, declAt = '';
export function setCompassPlace(lat, lon) {
  if (lat == null || lon == null) return;
  const k = `${lat.toFixed(1)},${lon.toFixed(1)}`; if (k === declAt) return;
  declAt = k;
  try { decl = declination(lat, lon); } catch { decl = 0; }
  try {
    if (!localStorage.getItem('declApplied')) {
      if (manualNudge) { manualNudge = (manualNudge - decl + 360) % 360; localStorage.setItem('compassNudge', String(Math.round(manualNudge * 10) / 10)); }
      localStorage.setItem('declApplied', '1');
    }
  } catch {}
}
export function getDeclination() { return decl; }
export function nudgeHeading(deg) {
  manualNudge = (manualNudge + deg + 360) % 360;
  clearTimeout(nudgeSave); // drags nudge in small steps; save once they settle
  nudgeSave = setTimeout(() => { try { localStorage.setItem('compassNudge', String(Math.round(manualNudge * 10) / 10)); } catch {} }, 400);
}
export function getNudge() { return manualNudge; }

// W3C DeviceOrientation: R = Rz(alpha) · Rx(beta) · Ry(gamma), device frame -> earth frame.
function basisFromEuler(alpha, beta, gamma) {
  const a = alpha * RAD, b = beta * RAD, g = gamma * RAD;
  const cA = Math.cos(a), sA = Math.sin(a), cB = Math.cos(b), sB = Math.sin(b), cG = Math.cos(g), sG = Math.sin(g);
  const col1 = [cA * cG - sA * sB * sG, cG * sA + cA * sB * sG, -cB * sG]; // device +X (screen right)
  const col2 = [-cB * sA, cA * cB, sB];                                    // device +Y (screen up)
  const col3 = [cA * sG + cG * sA * sB, sA * sG - cA * cG * sB, cB * cG];  // device +Z (out of screen)
  let right = col1, up = col2;
  // Account for the screen being rotated (landscape).
  const angle = (screen.orientation?.angle ?? window.orientation ?? 0) * RAD;
  if (angle) {
    const c = Math.cos(angle), s = Math.sin(angle);
    right = [col1[0] * c - col2[0] * s, col1[1] * c - col2[1] * s, col1[2] * c - col2[2] * s];
    up = [col1[0] * s + col2[0] * c, col1[1] * s + col2[1] * c, col1[2] * s + col2[2] * c];
  }
  return { right, up, back: [-col3[0], -col3[1], -col3[2]] };
}

function rawAzimuth(v) {
  return (Math.atan2(v[0], v[1]) / RAD + 360) % 360;
}

// Circular smoothing so the heading offset doesn't jitter.
function blendAngle(prev, next, k) {
  const d = ((next - prev + 540) % 360) - 180;
  return (prev + d * k + 360) % 360;
}

// iOS heading calibration. webkitCompassHeading is only trustworthy as "the direction the camera faces"
// while the phone is held roughly upright (top edge up, camera near the horizon). Tip the phone back
// overhead and iOS switches to measuring from the top edge instead, so the reading swings ~180°; if we
// kept blending that in, the whole sky would slowly spin. So: calibrate only in the upright pose, and
// once calibrated, ignore readings that disagree wildly (a flipped or disturbed compass).
let offsetSeeded = false;   // any estimate at all
let offsetTrusted = false;  // estimate came from the upright pose
let goodSamples = 0;
let rejectStreak = 0;
function updateHeadingOffset(heading, basis) {
  const elBack = Math.asin(Math.max(-1, Math.min(1, basis.back[2]))) / RAD;
  const upright = basis.up[2] > 0.6 && Math.abs(elBack) < 40;
  const measured = (heading - rawAzimuth(basis.back) + 360) % 360;
  if (!offsetSeeded) { pointing.headingOffset = measured; offsetSeeded = true; offsetTrusted = upright; return; }
  if (!upright) return; // hold the last good offset while pointing high or at odd angles
  const diff = Math.abs(((measured - pointing.headingOffset + 540) % 360) - 180);
  if (!offsetTrusted) { // first upright reading replaces a guess taken in a bad pose
    pointing.headingOffset = measured; offsetTrusted = true; goodSamples = 1; return;
  }
  if (goodSamples > 20 && diff > 35) {
    // A sudden big disagreement: usually interference or a flip. Only accept it if it persists.
    pointing.compassDoubt = Math.min(1, rejectStreak / 90);
    if (++rejectStreak < 90) return; // ~1.5 s of consistent readings at 60 Hz
    pointing.compassJumpAt = performance.now(); // it persisted: north really moved, so the compass was off
  }
  rejectStreak = 0; pointing.compassDoubt = 0;
  goodSamples++;
  // Hold steady (2026-10-08, Sevaan: the sky ticked round while the phone was still): iOS reports the compass in
  // whole degrees and it jitters, so once settled, small disagreements are ignored. After you line the sky up by hand
  // (headingLocked), only a big, persistent change (handled above) moves it.
  if (goodSamples > 30 && (diff < 2.5 || headingLocked)) return;
  pointing.headingOffset = blendAngle(pointing.headingOffset, measured, goodSamples < 30 ? 0.2 : 0.02);
}

function onOrientation(e, absolute) {
  if (e.alpha === null || e.beta === null || e.gamma === null) return;
  // Android sends both absolute (north-referenced) and relative events; mixing them makes the sky jump.
  if (!absolute && pointing.source === 'absolute') return;
  const basis = basisFromEuler(e.alpha, e.beta, e.gamma);
  pointing.basis = basis;
  pointing.lastEvent = performance.now();

  if (typeof e.webkitCompassHeading === 'number' && e.webkitCompassHeading >= 0) {
    // iOS: alpha has an arbitrary zero; the compass heading pins it to true directions.
    pointing.source = 'ios';
    pointing.compassAccuracy = e.webkitCompassAccuracy;
    updateHeadingOffset(e.webkitCompassHeading, basis);
  } else if (absolute) {
    pointing.source = 'absolute';
    pointing.headingOffset = 0;
  } else if (pointing.source !== 'absolute') {
    pointing.source = 'relative';
  }
}

export function needsPermission() {
  return typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function';
}

let listening = false;

// Must be called from a user tap on iOS.
export async function startSensors() {
  if (listening) return true;
  if (typeof DeviceOrientationEvent === 'undefined') return false;
  if (needsPermission()) {
    const result = await DeviceOrientationEvent.requestPermission();
    if (result !== 'granted') return false;
  }
  window.addEventListener('deviceorientationabsolute', (e) => onOrientation(e, true));
  window.addEventListener('deviceorientation', (e) => onOrientation(e, e.absolute === true));
  listening = true;
  return true;
}

export function hasLiveSensors() {
  return pointing.basis !== null && performance.now() - pointing.lastEvent < 2000;
}

// Rotate an ENU vector about the Up axis by deg (positive = clockwise seen from above, like azimuth).
export function rotateAz(v, deg) {
  const a = deg * RAD, c = Math.cos(a), s = Math.sin(a);
  return [v[0] * c + v[1] * s, -v[0] * s + v[1] * c, v[2]];
}

// Camera basis in true ENU (heading offset and manual nudge applied).
export function trueBasis() {
  const b = pointing.basis;
  if (!b) return null;
  const off = pointing.headingOffset + (pointing.source === 'ios' ? decl : 0) + manualNudge;
  return { right: rotateAz(b.right, off), up: rotateAz(b.up, off), back: rotateAz(b.back, off) };
}

// Build a camera basis from azimuth/elevation (used by sim/desktop drag mode). Roll is zero.
export function basisFromAzEl(az, el) {
  const a = az * RAD, e = el * RAD;
  const back = [Math.cos(e) * Math.sin(a), Math.cos(e) * Math.cos(a), Math.sin(e)];
  const right = [Math.cos(a), -Math.sin(a), 0];
  const up = [
    back[1] * right[2] - back[2] * right[1],
    back[2] * right[0] - back[0] * right[2],
    back[0] * right[1] - back[1] * right[0],
  ];
  // up = back × right gives screen-up; make sure it tilts skyward.
  if (up[2] < 0) { up[0] = -up[0]; up[1] = -up[1]; up[2] = -up[2]; }
  return { right, up, back };
}
