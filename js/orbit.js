// Orbit math: where every object is in the observer's sky, and whether it can be seen.
// Pure functions, no DOM, so this module carries over unchanged to a native wrapper.

import * as sat from './lib/satellite.js';

const RAD = Math.PI / 180;
const EARTH_RADIUS_KM = 6371;
const AU_KM = 149597870.7;

// Sun must be this far below the horizon before satellites stand out (nautical twilight).
export const DARK_SUN_ELEVATION = -6;
// Faintest magnitude we count as naked-eye visible from a darkish backyard.
export const FAINTEST_MAG = 5.0;

export async function loadCatalog(url) {
  const res = await fetch(url, { cache: 'no-cache' });
  const data = await res.json();
  const objects = [];
  for (const o of data.objects) {
    const satrec = sat.twoline2satrec(o.l1, o.l2);
    if (satrec.error) continue;
    objects.push({ ...o, satrec });
  }
  return { generated: new Date(data.generated), objects };
}

// Observer: { lat, lon, heightKm } in degrees
function observerGd(obs) {
  return { latitude: obs.lat * RAD, longitude: obs.lon * RAD, height: obs.heightKm ?? 0 };
}

// Unit vector in local East-North-Up from azimuth/elevation (degrees)
export function enuFromAzEl(az, el) {
  const a = az * RAD, e = el * RAD;
  return [Math.cos(e) * Math.sin(a), Math.cos(e) * Math.cos(a), Math.sin(e)];
}

export function azElFromEnu([x, y, z]) {
  const az = (Math.atan2(x, y) / RAD + 360) % 360;
  const el = Math.asin(Math.max(-1, Math.min(1, z))) / RAD;
  return { az, el };
}

// Everything that depends on time but not on a particular object.
export function frame(date, obs) {
  const gmst = sat.gstime(date);
  const gd = observerGd(obs);
  const obsEci = sat.ecfToEci(sat.geodeticToEcf(gd), gmst);
  const s = sat.sunPos(sat.jday(date)).rsun;
  const sunEci = { x: s[0] * AU_KM, y: s[1] * AU_KM, z: s[2] * AU_KM };
  const sunLook = sat.ecfToLookAngles(gd, sat.eciToEcf(sunEci, gmst));
  const sunLen = Math.hypot(sunEci.x, sunEci.y, sunEci.z);
  return {
    date, gmst, gd, obsEci,
    sunDir: { x: sunEci.x / sunLen, y: sunEci.y / sunLen, z: sunEci.z / sunLen },
    sunEl: sunLook.elevation / RAD,
  };
}

// Cylindrical Earth-shadow model: good enough for naked-eye visibility.
function isSunlit(r, sunDir) {
  const along = r.x * sunDir.x + r.y * sunDir.y + r.z * sunDir.z;
  if (along > 0) return true;
  const px = r.x - along * sunDir.x, py = r.y - along * sunDir.y, pz = r.z - along * sunDir.z;
  return Math.hypot(px, py, pz) > EARTH_RADIUS_KM;
}

// Apparent magnitude from standard magnitude, range and sun-object-observer phase angle.
function apparentMag(stdMag, rangeKm, r, f) {
  const toObs = { x: f.obsEci.x - r.x, y: f.obsEci.y - r.y, z: f.obsEci.z - r.z };
  const len = Math.hypot(toObs.x, toObs.y, toObs.z);
  const cosPhase = (toObs.x * f.sunDir.x + toObs.y * f.sunDir.y + toObs.z * f.sunDir.z) / len;
  const phase = Math.acos(Math.max(-1, Math.min(1, cosPhase)));
  const lit = ((Math.PI - phase) * Math.cos(phase) + Math.sin(phase)) / Math.PI;
  // Standard magnitude is defined at 1000 km and 90° phase (lit = 1/π).
  return stdMag + 5 * Math.log10(rangeKm / 1000) - 2.5 * Math.log10(Math.max(lit * Math.PI, 1e-3));
}

// Position of one object in the observer's sky. Returns null if propagation fails.
export function look(obj, f) {
  const pv = sat.propagate(obj.satrec, f.date);
  if (!pv || !pv.position) return null;
  const r = pv.position;
  const la = sat.ecfToLookAngles(f.gd, sat.eciToEcf(r, f.gmst));
  const el = la.elevation / RAD;
  const az = (la.azimuth / RAD + 360) % 360;
  if (el < 0) return { az, el, rangeKm: la.rangeSat, sunlit: false, visible: false, mag: null };
  const sunlit = isSunlit(r, f.sunDir);
  const dark = f.sunEl < DARK_SUN_ELEVATION;
  const mag = sunlit ? apparentMag(obj.stdMag, la.rangeSat, r, f) : null;
  const bright = mag !== null && mag <= FAINTEST_MAG;
  return { az, el, rangeKm: la.rangeSat, sunlit, dark, bright, visible: sunlit && dark && bright, mag };
}

// Sky path over a window, sampled every stepSec. Entries keep their time offset.
export function track(obj, date, obs, fromSec, toSec, stepSec) {
  const pts = [];
  for (let t = fromSec; t <= toSec; t += stepSec) {
    const f = frame(new Date(date.getTime() + t * 1000), obs);
    const l = look(obj, f);
    if (l) pts.push({ t, ...l });
  }
  return pts;
}

const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
export function compassPoint(az) {
  return COMPASS[Math.round(((az % 360) + 360) % 360 / 45) % 8];
}

// Which way an object is moving across the sky, e.g. "moving NE, rising".
export function motion(obj, date, obs) {
  const a = look(obj, frame(date, obs));
  const b = look(obj, frame(new Date(date.getTime() + 5000), obs));
  if (!a || !b) return null;
  const va = enuFromAzEl(a.az, a.el), vb = enuFromAzEl(b.az, b.el);
  const dirAz = (Math.atan2(vb[0] - va[0], vb[1] - va[1]) / RAD + 360) % 360;
  return { dirAz, heading: compassPoint(dirAz), rising: b.el > a.el };
}

// Find the next time something in the catalogue is visible. Coarse 1-minute scan.
export function nextVisiblePass(objects, date, obs, hours = 24) {
  for (let m = 0; m <= hours * 60; m++) {
    const d = new Date(date.getTime() + m * 60000);
    const f = frame(d, obs);
    if (f.sunEl >= DARK_SUN_ELEVATION) { m += 9; continue; }
    let best = null;
    for (const o of objects) {
      const l = look(o, f);
      if (l && l.visible && l.el > 15 && (!best || l.mag < best.look.mag)) best = { obj: o, look: l };
    }
    if (best) return { date: d, ...best };
  }
  return null;
}
