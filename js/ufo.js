// A UFO crossing the sky (2026-10-08, design/ufo.html): a rare night-time secret. One 90-second chance in each
// 8-hour block, at a moment fixed per device and block; it only flies if the Sun is down and at least 3 other
// things are up. It crosses once (about 90 s) and is gone. Line it up and tap: the secret Close Encounter patch.
const BLOCK = 8 * 3600e3, LEN = 90e3;
const deviceSeed = (() => { let s; try { s = Number(localStorage.getItem('ufoSeed')); } catch {} if (!s) { s = 1 + Math.floor(Math.random() * 2e9); try { localStorage.setItem('ufoSeed', String(s)); } catch {} } return s; })();
const hash = (n) => { let x = (n ^ deviceSeed) >>> 0; x = Math.imul(x ^ (x >>> 16), 0x45d9f3b) >>> 0; x = Math.imul(x ^ (x >>> 16), 0x45d9f3b) >>> 0; return ((x ^ (x >>> 16)) >>> 0) / 4294967296; };
let forced = null; // testing tool: fly one now

export function flight(t) {
  if (forced && t >= forced.start && t <= forced.end) return forced;
  const b = Math.floor(t / BLOCK), r = hash(b), start = b * BLOCK + r * (BLOCK - LEN);
  if (t < start || t > start + LEN) return null;
  return { start, end: start + LEN, az0: hash(b + 7) * 360, peak: 35 + hash(b + 13) * 40 };
}
export function summon(t) { forced = { start: t, end: t + LEN, az0: Math.random() * 360, peak: 50 }; }
// Where it is at time t: across 150° of sky, rising from 8° to its peak and back down.
export function where(f, t) {
  const k = (t - f.start) / (f.end - f.start), el = 8 + (f.peak - 8) * Math.sin(Math.PI * k), az = (f.az0 + 150 * k) % 360;
  return { az, el };
}
export function caught() { try { return JSON.parse(localStorage.getItem('ufoFound')); } catch { return null; } }
export function markCaught() { const c = { at: Date.now() }; try { localStorage.setItem('ufoFound', JSON.stringify(c)); } catch {} return c; }
export const UFO_PATCH = { id: 'ufo', name: 'Close Encounter', text: "Something crossed your sky that isn't in any catalogue. You were looking.", icon: '', secret: true };
