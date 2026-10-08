// More secrets (2026-10-08, design/easter-eggs.html): Santa's sleigh, Starman's Roadster, a shooting star, Voyager's
// golden record and Dizzy. None is mentioned anywhere; each earns a secret patch. Found ones: localStorage 'secrets'.
export const SECRET_PATCHES = {
  santa: { id: 'santa', name: 'Nice List', text: 'You waved at Santa on Christmas Eve.' },
  roadster: { id: 'roadster', name: "Don't Panic", text: 'You found Starman and his Roadster, still driving round the Sun.' },
  meteor: { id: 'meteor', name: 'Make a Wish', text: 'You caught a shooting star.' },
  voyager: { id: 'voyager', name: 'Pale Blue Dot', text: 'You found Voyager 1 and its golden record, 24 billion km away.' },
  dizzy: { id: 'dizzy', name: 'Dizzy', text: 'Three full turns. The compass needs a sit-down.' },
};
for (const p of Object.values(SECRET_PATCHES)) { p.secret = true; p.icon = ''; }
export function found() { try { return JSON.parse(localStorage.getItem('secrets')) || {}; } catch { return {}; } }
export function markFound(id) { const f = found(); f[id] ??= Date.now(); try { localStorage.setItem('secrets', JSON.stringify(f)); } catch {} }

// Santa: Christmas Eve night only, a two-minute crossing at the start of every 20 minutes.
let santaForced = null;
export function santa(t) {
  if (santaForced && t < santaForced.end) return santaForced;
  const d = new Date(t); if (!(d.getMonth() === 11 && (d.getDate() === 24 || (d.getDate() === 25 && d.getHours() < 6)))) return null;
  const start = Math.floor(t / 1200e3) * 1200e3; if (t > start + 120e3) return null;
  return { start, end: start + 120e3, az0: (start / 1200e3 * 73) % 360 };
}
export function summonSanta(t) { santaForced = { start: t, end: t + 120e3, az0: Math.random() * 360 }; }
export const santaWhere = (f, t) => { const k = (t - f.start) / (f.end - f.start); return { az: (f.az0 + 160 * k) % 360, el: 8 + 42 * Math.sin(Math.PI * k) }; };

// Shooting star: during a meteor shower, every few minutes while you're looking up, one streaks through near the circle.
let nextMeteor = 0, meteor = null;
export function meteorAt(t, active, aimAz, aimEl) {
  if (meteor && t < meteor.end + 400) return meteor;
  meteor = null;
  if (!active) return null;
  if (!nextMeteor) nextMeteor = t + (60 + Math.random() * 120) * 1000;
  if (t < nextMeteor) return null;
  nextMeteor = t + (180 + Math.random() * 300) * 1000;
  const ang = Math.random() * Math.PI * 2, off = Math.random() * 3; // passes within 3° of where you're aiming
  const cAz = aimAz + Math.cos(ang) * off, cEl = aimEl + Math.sin(ang) * off, dir = Math.random() * Math.PI * 2;
  return (meteor = { start: t, end: t + 700, from: [cAz - Math.cos(dir) * 9, cEl - Math.sin(dir) * 9], to: [cAz + Math.cos(dir) * 5, cEl + Math.sin(dir) * 5] });
}
export function summonMeteor() { nextMeteor = 1; meteor = null; }

// Voyager 1: RA 17h13m, Dec +12° (it barely moves).
export const VOYAGER = { ra: 258.2, dec: 12.1 };

// Dizzy: three full turns (1,080°) within 30 seconds.
const turns = [];
let lastHeading = null;
export function dizzyStep(t, heading) {
  if (lastHeading != null) { const dh = ((heading - lastHeading + 540) % 360) - 180; if (Math.abs(dh) < 40) turns.push([t, dh]); }
  lastHeading = heading;
  while (turns.length && t - turns[0][0] > 30000) turns.shift();
  const sum = turns.reduce((a, [, d]) => a + d, 0);
  if (Math.abs(sum) >= 1080) { turns.length = 0; return true; }
  return false;
}
