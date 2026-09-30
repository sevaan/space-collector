// Orbit math: where every object is in the observer's sky, and whether it can be seen.
// Pure functions, no DOM, so this module carries over unchanged to a native wrapper.

import * as sat from './lib/satellite.js?v=0.1.40';

const RAD = Math.PI / 180;
const EARTH_RADIUS_KM = 6371;
const AU_KM = 149597870.7;

// Sun must be this far below the horizon before satellites stand out (nautical twilight).
export const DARK_SUN_ELEVATION = -6;
// Faintest magnitude we count as visible: naked eye from a darkish backyard, or with binoculars.
export const NAKED_EYE_MAG = 5.0;
export const BINOCULAR_MAG = 8.0;
let faintest = NAKED_EYE_MAG;
export function setBinocularMode(on) { faintest = on ? BINOCULAR_MAG : NAKED_EYE_MAG; }

export async function loadCatalog(url) {
  const res = await fetch(url, { cache: 'no-cache' });
  const data = await res.json();
  const objects = [];
  const families = data.families ?? {};
  for (const o of data.objects) {
    const satrec = sat.twoline2satrec(o.l1, o.l2);
    if (satrec.error) continue;
    // Constellation members share their family's facts to keep the file small.
    const fam = o.family ? families[o.family] : null;
    if (fam) Object.assign(o, { kind: 'PAY', type: 'satellite', tier: 'common', stdMag: fam.stdMag, owner: fam.owner, year: o.launch ? Number(o.launch.slice(0, 4)) : null });
    o.card ??= String(o.id);
    o.satrec = satrec;
    delete o.l1; delete o.l2;
    objects.push(o);
  }
  return { generated: new Date(data.generated), families, objects };
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
  const bright = mag !== null && mag <= faintest;
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

// Find the next time something bright is visible. Coarse 2-minute scan over the brighter objects only,
// so it stays quick with a catalogue of thousands.
export function nextVisiblePass(allObjects, date, obs, hours = 24) {
  const objects = allObjects.filter((o) => o.stdMag <= 4.5);
  for (let m = 0; m <= hours * 60; m += 2) {
    const d = new Date(date.getTime() + m * 60000);
    const f = frame(d, obs);
    if (f.sunEl >= DARK_SUN_ELEVATION) { m += 8; continue; }
    let best = null;
    for (const o of objects) {
      const l = look(o, f);
      if (l && l.visible && l.el > 15 && (!best || l.mag < best.look.mag)) best = { obj: o, look: l };
    }
    if (best) return { date: d, ...best };
  }
  return null;
}

// Keeps track of what's above the horizon without recomputing the whole catalogue every frame.
// Each frame it checks a slice of the catalogue (a full sweep takes ~3 s), and for objects above the
// horizon it keeps two exact samples one second apart and interpolates between them.
const SAMPLE_MS = 1000;
const SWEEP_FRAMES = 180;

export class SkyModel {
  constructor(objects) {
    this.objects = objects;
    this.cursor = 0;
    this.above = new Map(); // id -> { obj, t0, s0, t1, s1 }
    this.frames = new Map();
    this.lastT = null;
  }

  frameAt(t, obs) {
    let f = this.frames.get(t);
    if (!f) {
      if (this.frames.size > 24) this.frames.clear();
      f = frame(new Date(t), obs);
      this.frames.set(t, f);
    }
    return f;
  }

  // Forget everything (after a time jump or location change).
  reset() { this.above.clear(); this.frames.clear(); this.cursor = 0; this.primed = false; }

  // Full sweep at once, used right after a reset so the sky isn't empty for 3 seconds.
  prime(date, obs) {
    const f = frame(date, obs);
    for (const o of this.objects) {
      const l = look(o, f);
      if (l && l.el > -3) this.add(o, date.getTime(), obs);
    }
    this.primed = true;
  }

  add(o, t, obs) {
    const q = Math.floor(t / 250) * 250;
    const t0 = q, t1 = q + SAMPLE_MS + 250 * (o.id % 4); // stagger resampling across frames
    const s0 = look(o, this.frameAt(t0, obs)), s1 = look(o, this.frameAt(t1, obs));
    if (s0 && s1) this.above.set(o.id, { obj: o, t0, s0, t1, s1 });
  }

  update(date, obs) {
    const t = date.getTime();
    if (this.lastT !== null && Math.abs(t - this.lastT) > 5000) this.reset();
    this.lastT = t;
    if (!this.primed) this.prime(date, obs);

    // Sweep a slice of the catalogue for objects rising above the horizon.
    const n = this.objects.length;
    const slice = Math.ceil(n / SWEEP_FRAMES);
    const f = this.frameAt(Math.floor(t / 250) * 250, obs);
    for (let i = 0; i < slice; i++) {
      const o = this.objects[this.cursor];
      this.cursor = (this.cursor + 1) % n;
      if (this.above.has(o.id)) continue;
      const l = look(o, f);
      if (l && l.el > -3) this.add(o, t, obs);
    }

    // Advance samples for objects we're tracking; drop ones that have set.
    for (const [id, e] of this.above) {
      if (t < e.t1) continue;
      const next = e.t1 + SAMPLE_MS;
      const s = look(e.obj, this.frameAt(next, obs));
      if (!s || (s.el < -3 && e.s1.el < -3)) { this.above.delete(id); continue; }
      e.t0 = e.t1; e.s0 = e.s1; e.t1 = next; e.s1 = s;
    }
  }

  // Current interpolated positions: [{ obj, look }] for everything above the horizon.
  items(date) {
    const t = date.getTime();
    const out = [];
    for (const e of this.above.values()) {
      const u = Math.max(0, Math.min(1.5, (t - e.t0) / (e.t1 - e.t0)));
      const a = enuFromAzEl(e.s0.az, e.s0.el), b = enuFromAzEl(e.s1.az, e.s1.el);
      const v = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
      const l = Math.hypot(v[0], v[1], v[2]) || 1;
      const { az, el } = azElFromEnu([v[0] / l, v[1] / l, v[2] / l]);
      if (el < 0) continue;
      const s = u < 0.5 ? e.s0 : e.s1;
      out.push({ obj: e.obj, look: { ...s, az, el } });
    }
    return out;
  }
}
