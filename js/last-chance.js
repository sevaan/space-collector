// Last chance cards (2026-10-14, Sevaan; design/fun-and-learning.html): satellites low enough to be falling. The
// catalogue's orbit carries how fast it's speeding up (MEAN_MOTION_DOT, revs/day² ÷ 2); at that rate, when does it
// reach ~16.4 laps a day (about 150 km, where it burns up)? A straight-line guess: real decay speeds up, so the true
// date is usually a little sooner. Fleet members (Starlink…) are left out: they're stamps, not cards.
const MU = 398600.4418, RE = 6378.137;
export function fallAt(o) {
  if (!o?.el || o.family) return null;
  const mm = o.el[1], ecc = o.el[2], dot = o.el[8];
  if (!(mm > 0) || !(dot > 0)) return null;
  const a = Math.cbrt(MU / ((mm * 2 * Math.PI / 86400) ** 2)), perigee = a * (1 - ecc) - RE;
  if (perigee > 300) return null;
  const days = (16.4 - mm) / (2 * dot);
  if (!(days < 45)) return null;
  return Date.parse(`${o.el[0]}Z`) + Math.max(0.5, days) * 86400e3;
}
export const daysLeft = (t, now = Date.now()) => Math.max(0, Math.round((t - now) / 86400e3));
export const fallWords = (t, now = Date.now()) => { const d = daysLeft(t, now); return d <= 1 ? 'falls any day now' : `falls in about ${d} days`; };
const STEP = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
export const bumpTier = (t) => STEP[Math.min(STEP.length - 1, STEP.indexOf(t) + 1)] ?? t;
