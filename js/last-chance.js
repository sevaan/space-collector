// Last chance cards (2026-10-14, Sevaan; design/fun-and-learning.html): satellites low enough to be falling. The
// catalogue’s orbit carries how fast it’s speeding up (MEAN_MOTION_DOT, revs/day² ÷ 2); at that rate, when does it
// reach about 150 km, where it burns up? See fallAt for the decay model. Fleet members (Starlink…) are left out: they’re stamps, not cards.
const MU = 398600.4418, RE = 6378.137;
export function fallAt(o) {
  if (!o?.el || o.family) return null;
  const mm = o.el[1], ecc = o.el[2], dot = o.el[8];
  if (!(mm > 0) || !(dot > 0)) return null;
  const a = Math.cbrt(MU / ((mm * 2 * Math.PI / 86400) ** 2)), perigee = a * (1 - ecc) - RE;
  if (perigee > 300) return null;
  // Speeding up as it sinks (2026-10-29, Sevaan: the straight line said Swift falls Nov 14, the trackers said ~Nov 2):
  // today's sink rate from the catalogue (km/day), then step it down to 150 km with the air thickening exponentially,
  // its scale height shrinking with altitude (≈18 km at 150 km, ≈42 km at 250 km). Swift: ~Nov 4.
  const rate0 = (2 / 3) * (a / mm) * 2 * dot; // km/day
  let alt = perigee, lnRho = 0, days = 0;
  while (alt > 150 && days < 11) { const dt = 0.02, d = rate0 * Math.exp(lnRho) * dt; alt -= d; lnRho += d / (18 + 0.25 * Math.max(0, alt - 150)); days += dt; }
  if (!(days < 10)) return null; /* last chance means days, not weeks: with the speeding-up model 45 days caught ~110 */
  return Date.parse(`${o.el[0]}Z`) + Math.max(0.5, days) * 86400e3;
}
export const daysLeft = (t, now = Date.now()) => Math.max(0, Math.round((t - now) / 86400e3));
export const fallWords = (t, now = Date.now()) => { const d = daysLeft(t, now); return d <= 1 ? 'falls any day now' : `falls in about ${d} days`; };
const STEP = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
export const bumpTier = (t) => STEP[Math.min(STEP.length - 1, STEP.indexOf(t) + 1)] ?? t;
