// Comets as limited-time cards (2026-10-11, Sevaan). data/comets.json (scripts/build-comets.mjs, from JPL’s Small-Body
// Database) lists comets due to be bright enough to see; each is a card only while it really is (magnitude <= 6
// and above the horizon at night). Positions come from their orbits: perihelion distance q, eccentricity e,
// inclination i, node om, argument of perihelion w (degrees, J2000 ecliptic), perihelion time tp (Julian day).
// Brightness: m = M1 + 5 log10(Δ) + K1 log10(r), Δ and r in AU. No DOM.
import { NATURAL, NATURAL_BY_KEY } from './natural.js?v=0.1.917';
const RAD = Math.PI / 180, K = 0.01720209895; // Gaussian gravitational constant
const jd = (date) => date.getTime() / 86400000 + 2440587.5;

// True anomaly and distance from the Sun for any eccentricity (elliptic, near-parabolic, hyperbolic).
function anomaly(q, e, dt) {
  if (Math.abs(1 - e) < 1e-4) { // parabolic: Barker’s equation
    const W = 3 * K * dt / Math.sqrt(2 * q * q * q), Y = Math.cbrt(W / 2 + Math.sqrt(W * W / 4 + 1)), s = Y - 1 / Y;
    const v = 2 * Math.atan(s); return { v, r: q * (1 + s * s) };
  }
  const a = q / (1 - e);
  if (e < 1) {
    const M = K * dt / Math.pow(a, 1.5);
    let E = e > 0.8 ? Math.PI : M; for (let k = 0; k < 60; k++) { const d = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E)); E -= d; if (Math.abs(d) < 1e-12) break; }
    const v = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
    return { v, r: a * (1 - e * Math.cos(E)) };
  }
  const M = K * dt / Math.pow(-a, 1.5);
  let H = Math.asinh(M / e); for (let k = 0; k < 60; k++) { const d = (e * Math.sinh(H) - H - M) / (e * Math.cosh(H) - 1); H -= d; if (Math.abs(d) < 1e-12) break; }
  const v = 2 * Math.atan2(Math.sqrt(e + 1) * Math.sinh(H / 2), Math.sqrt(e - 1) * Math.cosh(H / 2));
  return { v, r: a * (1 - e * Math.cosh(H)) };
}
// Heliocentric ecliptic position (AU) of a body on orbit c at Julian day t.
function helio(c, t) {
  const { v, r } = anomaly(c.q, c.e, t - c.tp), u = v + c.w * RAD, O = c.om * RAD, i = c.i * RAD;
  return [r * (Math.cos(O) * Math.cos(u) - Math.sin(O) * Math.sin(u) * Math.cos(i)), r * (Math.sin(O) * Math.cos(u) + Math.cos(O) * Math.sin(u) * Math.cos(i)), r * Math.sin(u) * Math.sin(i), r];
}
// Earth’s heliocentric ecliptic position (low precision, enough for a comet’s place in the sky).
function earth(t) {
  const d = t - 2451545.0, L = (280.460 + 0.9856474 * d) * RAD, g = (357.528 + 0.9856003 * d) * RAD;
  const lam = L + (1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * RAD, R = 1.00014 - 0.01671 * Math.cos(g) - 0.00014 * Math.cos(2 * g);
  return [-R * Math.cos(lam), -R * Math.sin(lam), 0];
}
// Where comet c is at `date`: { ra, dec (degrees, J2000), mag, r, delta }.
export function cometAt(c, date) {
  const t = jd(date), [x, y, z, r] = helio(c, t), E = earth(t);
  const gx = x - E[0], gy = y - E[1], gz = z - E[2], delta = Math.hypot(gx, gy, gz);
  const eps = 23.4393 * RAD, ex = gx, ey = gy * Math.cos(eps) - gz * Math.sin(eps), ez = gy * Math.sin(eps) + gz * Math.cos(eps);
  const ra = ((Math.atan2(ey, ex) / RAD) + 360) % 360, dec = Math.asin(ez / delta) / RAD;
  const mag = c.M1 + 5 * Math.log10(delta) + c.K1 * Math.log10(r);
  return { ra, dec, mag, r, delta };
}
// Comet cards. A comet is only a card in the window it’s bright enough (built in, so old sightings keep their card).
export const NAKED_EYE = 6;
let list = [];
export const comets = () => list;
// Loads the list and registers each comet as a natural card (once), so the Collection and the sky both know it.
export async function loadComets(url = 'data/comets.json') {
  if (list.length) return list;
  try { const d = await (await fetch(url)).json(); list = (d.comets ?? []).map(card); } catch { list = []; }
  for (const c of list) if (!NATURAL_BY_KEY.has(c.key)) { NATURAL.push(c); NATURAL_BY_KEY.set(c.key, c); }
  return list;
}
function card(c) {
  const key = `comet:${c.id}`;
  return { ...c, key, id: key, card: key, natural: 'comet', type: 'comet', tier: 'legendary', order: 40,
    code: c.designation, far: ['', ''],
    stats: [['TYPE', c.periodic ? 'Periodic comet' : 'Long-period comet', ''], ['CLOSEST TO SUN', c.perihelion, ''], ['RETURNS', c.returns, '']],
    fact: c.fact };
}
