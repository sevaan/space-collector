// Phone orientation -> where the back of the phone is pointing in the sky.
// Produces a camera basis in local East-North-Up: right, up (screen edges) and back (view direction).

const RAD = Math.PI / 180;

export const pointing = {
  source: 'none',        // 'ios' | 'absolute' | 'relative' | 'none'
  basis: null,           // { right, up, back } unit vectors in ENU, before heading offset
  headingOffset: 0,      // degrees added to raw azimuth to get true azimuth
  compassAccuracy: null, // iOS: ± degrees, -1 = uncalibrated
  lastEvent: 0,
};

let manualNudge = 0;
export function nudgeHeading(deg) { manualNudge = (manualNudge + deg + 360) % 360; }
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

let offsetSeeded = false;
function onOrientation(e, absolute) {
  if (e.alpha === null || e.beta === null || e.gamma === null) return;
  const basis = basisFromEuler(e.alpha, e.beta, e.gamma);
  pointing.basis = basis;
  pointing.lastEvent = performance.now();

  if (typeof e.webkitCompassHeading === 'number' && e.webkitCompassHeading >= 0) {
    // iOS: alpha has an arbitrary zero. webkitCompassHeading is the direction the camera faces,
    // so the difference between the two is a (nearly constant) offset we track and smooth.
    pointing.source = 'ios';
    pointing.compassAccuracy = e.webkitCompassAccuracy;
    const elBack = Math.asin(Math.max(-1, Math.min(1, basis.back[2]))) / RAD;
    // Near straight up/down the compass heading is unreliable; keep the last offset.
    if (elBack > -50 && elBack < 65) {
      const measured = (e.webkitCompassHeading - rawAzimuth(basis.back) + 360) % 360;
      pointing.headingOffset = offsetSeeded ? blendAngle(pointing.headingOffset, measured, 0.05) : measured;
      offsetSeeded = true;
    }
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
  const off = pointing.headingOffset + manualNudge;
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
