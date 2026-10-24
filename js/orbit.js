// Orbit math: where every object is in the observer’s sky, and whether it can be seen.
// Pure functions, no DOM, so this module carries over unchanged to a native wrapper.

import { expandFacts } from './catalog-facts.js?v=0.1.1114';
import * as sat from './lib/satellite.js?v=0.1.1114';
import { extinction, starlinkStdMag } from './sky-limit.js?v=0.1.1114';

const RAD = Math.PI / 180;
const EARTH_RADIUS_KM = 6371;
const AU_KM = 149597870.7;

// Sun must be this far below the horizon before satellites stand out (nautical twilight).
export const DARK_SUN_ELEVATION = -6;
// Faintest satellite magnitude we count as visible, straight overhead. It follows your sky (light
// pollution, Moon, twilight: js/sky-limit.js) via setSkyLimit; objects lower down are dimmed by extinction.
export const NAKED_EYE_MAG = 5.0;
export const BINOCULAR_MAG = 8.0;
let nakedLimit = 4.3, binoLimit = 7.3, binoculars = false;
export function setBinocularMode(on) { binoculars = !!on; }
export function setSkyLimit(limit) { if (limit) { nakedLimit = limit.satellites; binoLimit = limit.binoculars; } }
export const currentLimit = () => (binoculars ? binoLimit : nakedLimit);

export async function loadCatalog(url) {
  const res = await fetch(url, { cache: 'no-cache' });
  const data = await res.json();
  const objects = [];
  const families = data.families ?? {};
  for (const o of data.objects) {
    expandFacts(o);
    const satrec = satrecFor(o);
    if (!satrec || satrec.error) continue;
    // Constellation members share their family’s facts to keep the file small.
    const fam = o.family ? families[o.family] : null;
    if (fam) Object.assign(o, { kind: 'PAY', type: 'satellite', tier: fam.tier ?? 'common', stdMag: o.family === 'STARLINK' ? starlinkStdMag(o) : o.stdMag ?? fam.stdMag, owner: fam.owner, familyName: fam.name, year: o.launch ? Number(o.launch.slice(0, 4)) : null });
    o.card ??= String(o.id);
    o.satrec = satrec;
    delete o.l1; delete o.l2; // el stays: last chance cards (fallAt) and the orbit globe read it (bug hunt 2026-10-22: deleting it switched both off in the app)
    objects.push(o);
  }
  // Shared with the Collection layer so it doesn’t download and parse the catalogue again (2026-10-08 performance).
  globalThis.__catalogShare = { generated: data.generated, source: data.source, families, objects };
  return { generated: new Date(data.generated), families, objects };
}

// Orbital elements come as JSON (OMM) values in scripts/build-catalog.mjs EL_FIELDS order. Older
// catalogues carried TLE lines, which can’t hold catalogue numbers above 99999.
const EL_FIELDS = ['EPOCH', 'MEAN_MOTION', 'ECCENTRICITY', 'INCLINATION', 'RA_OF_ASC_NODE', 'ARG_OF_PERICENTER', 'MEAN_ANOMALY', 'BSTAR', 'MEAN_MOTION_DOT', 'MEAN_MOTION_DDOT'];
// Workers get the orbit numbers (el), not the satrecs, and rebuild them (bug hunt 2026-10-22: copying 16,710 satrecs of
// 102 keys each into a worker held the main thread ~100 ms, ~4x the cost without them).
export const toWorker = (list) => list.map(({ satrec, ...o }) => o);
export function withSatrecs(list) { for (const o of list ?? []) o.satrec ??= satrecFor(o); return list; }
export function satrecFor(o) {
  if (o.el) return sat.json2satrec({ NORAD_CAT_ID: o.id, ...Object.fromEntries(EL_FIELDS.map((k, i) => [k, o.el[i]])) });
  if (o.l1 && o.l2) return sat.twoline2satrec(o.l1, o.l2);
  return null;
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

// Position of one object in the observer’s sky. Returns null if propagation fails.
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
  // mag includes the dimming from the air near the horizon, so it’s what you’d see.
  const mag = sunlit ? apparentMag(obj.stdMag, la.rangeSat, r, f) + extinction(el) : null;
  const bright = mag !== null && mag <= currentLimit();
  return { az, el, rangeKm: la.rangeSat, sunlit, dark, bright, visible: sunlit && dark && bright, mag };
}

// The point on Earth it’s over, its height and its speed: { lat, lon (degrees), altKm, kmh } or null.
export function overEarth(obj, date) {
  const pv = sat.propagate(obj.satrec, date);
  if (!pv?.position || !pv.velocity) return null;
  const g = sat.eciToGeodetic(pv.position, sat.gstime(date)), v = pv.velocity;
  return { lat: g.latitude / RAD, lon: g.longitude / RAD, altKm: g.height, kmh: Math.hypot(v.x, v.y, v.z) * 3600 };
}

// Below the horizon, as if the Earth were glass and you stood at a dark site (2026-10-11, Sevaan): lit by the Sun
// and bright enough for a dark sky (limit) as it would be on a pass over you, not at its true distance (far-side
// satellites are 10,000+ km off, and judged there almost none would show). Null when it’s above the horizon.
export function lookBelow(obj, f, limit) {
  const pv = sat.propagate(obj.satrec, f.date);
  if (!pv || !pv.position) return null;
  const r = pv.position;
  const la = sat.ecfToLookAngles(f.gd, sat.eciToEcf(r, f.gmst));
  const el = la.elevation / RAD;
  if (el >= 0) return null;
  const az = (la.azimuth / RAD + 360) % 360;
  const mag = isSunlit(r, f.sunDir) ? obj.stdMag : null;
  return { az, el, mag, rangeKm: la.rangeSat, show: mag !== null && mag <= limit };
}
// Everything under the horizon that would shine at a dark site. Sweeps the catalogue a slice per frame (so a full pass
// takes ~40 frames) and moves each one along between its last two samples. Only runs while you look down.
export class BelowModel {
  constructor(objects, frames = 40) { this.objects = objects; this.frames = frames; this.cursor = 0; this.map = new Map(); this.lastT = null; }
  update(date, f, limit) {
    const t = date.getTime();
    if (this.lastT !== null && Math.abs(t - this.lastT) > 5000) this.map.clear();
    this.lastT = t;
    const n = this.objects.length, slice = Math.ceil(n / this.frames);
    for (let i = 0; i < slice; i++) {
      const o = this.objects[this.cursor]; this.cursor = (this.cursor + 1) % n;
      if (o.stdMag == null || o.stdMag > limit) continue; // can’t reach the limit from thousands of km away
      const l = lookBelow(o, f, limit), prev = this.map.get(o.id);
      if (!l) { this.map.delete(o.id); continue; }
      this.map.set(o.id, { obj: o, t0: prev?.t1 ?? null, s0: prev?.s1 ?? null, t1: t, s1: l });
    }
  }
  // [{ obj, enu, mag }]
  items(date) {
    const t = date.getTime(), out = [];
    for (const e of this.map.values()) {
      if (!e.s1.show) continue;
      let v = enuFromAzEl(e.s1.az, e.s1.el);
      if (e.s0 && e.t1 - e.t0 > 0 && e.t1 - e.t0 < 4000) {
        const a = enuFromAzEl(e.s0.az, e.s0.el), u = Math.min(2, (t - e.t1) / (e.t1 - e.t0));
        v = [v[0] + (v[0] - a[0]) * u, v[1] + (v[1] - a[1]) * u, v[2] + (v[2] - a[2]) * u];
        const l = Math.hypot(v[0], v[1], v[2]) || 1; v = [v[0] / l, v[1] / l, v[2] / l];
      }
      if (v[2] >= 0) continue;
      out.push({ obj: e.obj, enu: v, mag: e.s1.mag, rangeKm: e.s1.rangeKm });
    }
    return out;
  }
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

// Keeps track of what’s above the horizon without recomputing the whole catalogue every frame.
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

  // Full sweep at once, used right after a reset so the sky isn’t empty for 3 seconds.
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

    // Advance samples for objects we’re tracking; drop ones that have set.
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

// "Coming up": interesting objects that are below the horizon now but will rise, lit and visible,
// within the next 10 minutes. Checks a slice of candidates each frame (full sweep every ~10 s) and
// reuses one frame per minute, so it stays cheap.
export class RisingSoon {
  constructor(objects) {
    this.pool = objects.filter((o) => !o.family && !o.bino && (o.stdMag <= 4 || o.tier === 'legendary' || o.tier === 'epic'));
    this.cursor = 0;
    this.found = new Map();
    this.frames = new Map();
  }
  reset() { this.found.clear(); this.frames.clear(); this.cursor = 0; }
  frameAt(ms, obs) {
    let f = this.frames.get(ms);
    if (!f) { if (this.frames.size > 30) this.frames.clear(); f = frame(new Date(ms), obs); this.frames.set(ms, f); }
    return f;
  }
  update(date, obs, perFrame = 4) {
    const n = this.pool.length;
    if (!n) return;
    const t = date.getTime(), base = Math.floor(t / 60000) * 60000;
    for (let i = 0; i < perFrame; i++) {
      const o = this.pool[this.cursor];
      this.cursor = (this.cursor + 1) % n;
      const now = look(o, this.frameAt(base, obs));
      if (!now || now.el > 0) { this.found.delete(o.id); continue; }
      let hit = null;
      for (let m = 1; m <= 10; m++) {
        const l = look(o, this.frameAt(base + m * 60000, obs));
        if (l && l.el > 0) { hit = { m, l }; break; }
      }
      if (!hit) { this.found.delete(o.id); continue; }
      const after = look(o, this.frameAt(base + (hit.m + 1) * 60000, obs));
      if (hit.l.visible || after?.visible) this.found.set(o.id, { obj: o, at: base + hit.m * 60000 - 30000, az: hit.l.az });
      else this.found.delete(o.id);
    }
    for (const [id, e] of this.found) if (e.at < t - 30000) this.found.delete(id);
  }
  list(date, max = 6) {
    const t = date.getTime();
    return [...this.found.values()].filter((e) => e.at > t - 30000).sort((a, b) => a.at - b.at).slice(0, max);
  }
}
