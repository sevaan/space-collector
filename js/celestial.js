// Stars, constellations, Sun, Moon and planets, for orientation. Pure math, no DOM.
// Planet and Moon positions use Paul Schlyter's low-precision method ("How to compute planetary
// positions"), good to a few arcminutes — far better than a phone compass.

import { gstime } from './lib/satellite.js?v=0.1.9';

const RAD = Math.PI / 180;
const sin = (d) => Math.sin(d * RAD), cos = (d) => Math.cos(d * RAD);
const rev = (d) => ((d % 360) + 360) % 360;

// Unit vector in the equatorial frame from RA/Dec (degrees)
function eq(raDeg, decDeg) {
  return [cos(decDeg) * cos(raDeg), cos(decDeg) * sin(raDeg), sin(decDeg)];
}

// Precess J2000 RA/Dec to the current date (linear approximation, fine for decades).
function precess(raDeg, decDeg, years) {
  const m = 0.012806, n = 0.005567; // degrees per year
  const tanDec = Math.tan(Math.min(89.9, Math.abs(decDeg)) * RAD) * Math.sign(decDeg);
  return [raDeg + (m + n * sin(raDeg) * tanDec) * years, decDeg + n * cos(raDeg) * years];
}

export async function loadSky(url) {
  const data = await (await fetch(url)).json();
  const years = (Date.now() / 86400000 + 2440587.5 - 2451545) / 365.25;
  const p = (ra, dec) => eq(...precess(ra, dec, years));
  return {
    stars: data.stars.map(([ra, dec, mag, name]) => ({ v: p(ra, dec), mag, name })),
    lines: data.lines.map((seg) => seg.map(([ra, dec]) => p(ra, dec))),
    constellations: data.constellations.map(([ra, dec, name, rank]) => ({ v: p(ra, dec), name, rank })),
  };
}

// Rotation from equatorial frame to local East-North-Up, for a given time and place.
export function eqToEnu(date, obs) {
  const lst = gstime(date) + obs.lon * RAD;
  const cl = Math.cos(lst), sl = Math.sin(lst);
  const cp = Math.cos(obs.lat * RAD), sp = Math.sin(obs.lat * RAD);
  return ([x, y, z]) => {
    const xh = x * cl + y * sl;   // toward the meridian (cos δ cos H)
    const yh = -x * sl + y * cl;  // (−cos δ sin H) = East
    return [yh, z * cp - xh * sp, z * sp + xh * cp];
  };
}

// ---------- Sun, Moon, planets ----------

const PLANETS = {
  Mercury: { N: [48.3313, 3.24587e-5], i: [7.0047, 5.0e-8], w: [29.1241, 1.01444e-5], a: 0.387098, e: [0.205635, 5.59e-10], M: [168.6562, 4.0923344368] },
  Venus:   { N: [76.6799, 2.4659e-5], i: [3.3946, 2.75e-8], w: [54.891, 1.38374e-5], a: 0.72333, e: [0.006773, -1.302e-9], M: [48.0052, 1.6021302244] },
  Mars:    { N: [49.5574, 2.11081e-5], i: [1.8497, -1.78e-8], w: [286.5016, 2.92961e-5], a: 1.523688, e: [0.093405, 2.516e-9], M: [18.6021, 0.5240207766] },
  Jupiter: { N: [100.4542, 2.76854e-5], i: [1.303, -1.557e-7], w: [273.8777, 1.64505e-5], a: 5.20256, e: [0.048498, 4.469e-9], M: [19.895, 0.0830853001] },
  Saturn:  { N: [113.6634, 2.3898e-5], i: [2.4886, -1.081e-7], w: [339.3939, 2.97661e-5], a: 9.55475, e: [0.055546, -9.499e-9], M: [316.967, 0.0334442282] },
};

// Visual magnitude: base + 5 log10(r·R) + phase terms (FV = phase angle, degrees)
const MAG = {
  Mercury: (fv) => -0.36 + 0.027 * fv + 2.2e-13 * fv ** 6,
  Venus: (fv) => -4.34 + 0.013 * fv + 4.2e-7 * fv ** 3,
  Mars: (fv) => -1.51 + 0.016 * fv,
  Jupiter: (fv) => -9.25 + 0.014 * fv,
  Saturn: (fv) => -9.0 + 0.044 * fv,
};

const lin = ([a, b], d) => a + b * d;

function kepler(M, e) {
  let E = M + (e / RAD) * sin(M) * (1 + e * cos(M));
  for (let k = 0; k < 6; k++) E -= (E - (e / RAD) * sin(E) - M) / (1 - e * cos(E));
  return E;
}

// Heliocentric (or geocentric for the Moon) ecliptic rectangular position
function orbitPos(N, i, w, a, e, M) {
  const E = kepler(M, e);
  const xv = a * (cos(E) - e), yv = a * Math.sqrt(1 - e * e) * sin(E);
  const v = Math.atan2(yv, xv) / RAD, r = Math.hypot(xv, yv);
  const vw = v + w;
  return {
    x: r * (cos(N) * cos(vw) - sin(N) * sin(vw) * cos(i)),
    y: r * (sin(N) * cos(vw) + cos(N) * sin(vw) * cos(i)),
    z: r * sin(vw) * sin(i),
    r,
  };
}

function eclToEq({ x, y, z }, ecl) {
  return [x, y * cos(ecl) - z * sin(ecl), y * sin(ecl) + z * cos(ecl)];
}

const unit = (v) => { const l = Math.hypot(...v); return [v[0] / l, v[1] / l, v[2] / l]; };

// All solar-system bodies as equatorial unit vectors (topocentric for the Moon).
export function solarSystem(date, obs) {
  const d = date.getTime() / 86400000 + 2440587.5 - 2451543.5;
  const ecl = 23.4393 - 3.563e-7 * d;

  // Sun
  const ws = 282.9404 + 4.70935e-5 * d, es = 0.016709 - 1.151e-9 * d, Ms = rev(356.047 + 0.9856002585 * d);
  const sunP = orbitPos(0, 0, ws, 1, es, Ms);
  const sunEq = eclToEq(sunP, ecl);
  const bodies = [{ name: 'Sun', kind: 'sun', v: unit(sunEq), mag: -26.7 }];

  // Moon (geocentric, Earth radii) with the main perturbations
  const Nm = rev(125.1228 - 0.0529538083 * d), wm = rev(318.0634 + 0.1643573223 * d), Mm = rev(115.3654 + 13.0649929509 * d);
  const mp = orbitPos(Nm, 5.1454, wm, 60.2666, 0.0549, Mm);
  let lon = Math.atan2(mp.y, mp.x) / RAD, lat = Math.atan2(mp.z, Math.hypot(mp.x, mp.y)) / RAD, dist = mp.r;
  const Ls = rev(Ms + ws), Lm = rev(Mm + wm + Nm), D = rev(Lm - Ls), F = rev(Lm - Nm);
  lon += -1.274 * sin(Mm - 2 * D) + 0.658 * sin(2 * D) - 0.186 * sin(Ms) - 0.059 * sin(2 * Mm - 2 * D)
    - 0.057 * sin(Mm - 2 * D + Ms) + 0.053 * sin(Mm + 2 * D) + 0.046 * sin(2 * D - Ms) + 0.041 * sin(Mm - Ms)
    - 0.035 * sin(D) - 0.031 * sin(Mm + Ms) - 0.015 * sin(2 * F - 2 * D) + 0.011 * sin(Mm - 4 * D);
  lat += -0.173 * sin(F - 2 * D) - 0.055 * sin(Mm - F - 2 * D) - 0.046 * sin(Mm + F - 2 * D)
    + 0.033 * sin(F + 2 * D) + 0.017 * sin(2 * Mm + F);
  dist += -0.58 * cos(Mm - 2 * D) - 0.46 * cos(2 * D);
  const moonGeo = eclToEq({ x: dist * cos(lat) * cos(lon), y: dist * cos(lat) * sin(lon), z: dist * sin(lat) }, ecl);
  // Topocentric correction: the Moon is close enough that parallax shifts it by up to ~1°.
  const lst = gstime(date) + obs.lon * RAD;
  const cp = Math.cos(obs.lat * RAD);
  const obsEq = [cp * Math.cos(lst), cp * Math.sin(lst), Math.sin(obs.lat * RAD)];
  const moonTopo = [moonGeo[0] - obsEq[0], moonGeo[1] - obsEq[1], moonGeo[2] - obsEq[2]];
  // Phase: elongation from the Sun gives illuminated fraction; waxing if the Moon is east of the Sun.
  const sunU = unit(sunEq), moonU = unit(moonTopo);
  const elong = Math.acos(Math.max(-1, Math.min(1, sunU[0] * moonU[0] + sunU[1] * moonU[1] + sunU[2] * moonU[2]))) / RAD;
  const phaseAngle = 180 - elong;
  const illum = (1 + cos(phaseAngle)) / 2;
  const waxing = rev(lon - Math.atan2(sunP.y, sunP.x) / RAD) < 180;
  bodies.push({ name: 'Moon', kind: 'moon', v: moonU, mag: -12.7 + 0.026 * phaseAngle, illum, phaseAngle, waxing, phaseName: phaseName(illum, waxing) });

  // Planets
  const xs = sunP.x, ys = sunP.y;
  for (const [name, p] of Object.entries(PLANETS)) {
    const h = orbitPos(lin(p.N, d), lin(p.i, d), lin(p.w, d), p.a, lin(p.e, d), rev(lin(p.M, d)));
    const g = { x: h.x + xs, y: h.y + ys, z: h.z };
    const R = Math.hypot(g.x, g.y, g.z);
    const fv = Math.acos(Math.max(-1, Math.min(1, (h.r ** 2 + R ** 2 - sunP.r ** 2) / (2 * h.r * R)))) / RAD;
    bodies.push({ name, kind: 'planet', v: unit(eclToEq(g, ecl)), mag: MAG[name](fv) + 5 * Math.log10(h.r * R) });
  }
  return bodies;
}

function phaseName(illum, waxing) {
  if (illum < 0.03) return 'New moon';
  if (illum > 0.97) return 'Full moon';
  if (Math.abs(illum - 0.5) < 0.06) return waxing ? 'First quarter' : 'Last quarter';
  return `${waxing ? 'Waxing' : 'Waning'} ${illum < 0.5 ? 'crescent' : 'gibbous'}`;
}
