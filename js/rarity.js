// Rarity tiers and the rules that assign them. Used by the catalogue build (scripts/build-catalog.mjs)
// and by the app for labels and colours. Pure, no DOM.

export const TIERS = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

export const TIER_INFO = {
  common:    { label: 'Common',    gem: '●', color: '#9aa4b1' },
  uncommon:  { label: 'Uncommon',  gem: '◆', color: '#5fd08a' },
  rare:      { label: 'Rare',      gem: '◆', color: '#4aa8ff' },
  epic:      { label: 'Epic',      gem: '✦', color: '#b57bff' },
  legendary: { label: 'Legendary', gem: '★', color: '#ffc545' },
};

// Hand-picked Legendaries regardless of age.
export const LEGENDARY_IDS = new Set([
  25544, // ISS
  48274, // Tiangong (Tianhe core module)
  20580, // Hubble Space Telescope
]);

// Crewed and cargo craft visiting a station.
const VISITOR = /^(DRAGON|CREW DRAGON|SOYUZ|PROGRESS|SHENZHOU|TIANZHOU|CYGNUS|STARLINER|HTV)/;

// The original rule, older = rarer. Since 2026-10-10 the catalogue build re-tiers by difficulty (retier, below);
// this still seeds new objects. Constellation launch cards are always Common (set at catalogue build).
//   Legendary  launched before 1970 (the Space Race), plus ISS, Tiangong, Hubble   ~6%
//   Epic       1970s, and spacecraft visiting a station                           ~13%
//   Rare       1980–1991, up to the end of the Soviet Union                        ~22%
//   Uncommon   1992–2009                                                           ~28%
//   Common     2010 onward                                                         ~31%
// Debris: Rare if from before 1980, otherwise Uncommon.
// o: { id, name, kind: 'PAY'|'R/B'|'DEB'|'UNK', launch: 'YYYY-MM-DD' }
export function tierFor(o) {
  const year = o.launch ? Number(o.launch.slice(0, 4)) : 2026;
  if (LEGENDARY_IDS.has(o.id)) return 'legendary';
  if (o.kind === 'DEB') return year < 1980 ? 'rare' : 'uncommon';
  if (VISITOR.test(o.name)) return 'epic';
  if (year < 1970) return 'legendary';
  if (year < 1980) return 'epic';
  if (year < 1992) return 'rare';
  if (year < 2010) return 'uncommon';
  return 'common';
}

// ---------- rarity by difficulty (2026-10-10, playtest #19) ----------
// Rarity now means "hard to catch", not "old": the ISS (the brightest satellite there is) was Legendary, and 1 card in
// 14 was. Each object gets a difficulty score from its catalogue entry, and the tiers are cut by share of the
// catalogue: 40% Common, 30% Uncommon, 18% Rare, 9% Epic, 3% Legendary. The parts of the score:
//   brightness  (half)   best-case magnitude straight overhead at perigee; binocular-only objects score high
//   reach       (30%)    how far from the equator it's ever seen: inclination plus how far it can be seen from, so a
//                        low-inclination object never rises for most players (who live at 30–55°)
//   night light (10%)    low orbits are only sunlit in twilight; higher ones stay lit later into the night
//   age         (15%)    a nod to history, so Space Race objects still lean rare
// The famous three (ISS, Tiangong, Hubble) are easy to see, so they sit at Rare with an Icon badge (`icon: 1`).
const MU = 398600.4418, RE = 6378.137;
export function difficulty(o) {
  const el = o.el ?? [], n = el[1], e = el[2] ?? 0, incl = el[3] ?? 51.6;
  const a = n ? Math.cbrt(MU / Math.pow((n * 2 * Math.PI) / 86400, 2)) : RE + 500, perigee = Math.max(150, a * (1 - e) - RE);
  const best = (o.stdMag ?? 6) + 5 * Math.log10(Math.max(perigee, 200) / 1000);
  const bright = Math.max(0, Math.min(1, (best - 1) / 7));
  const reachDeg = Math.min(incl > 90 ? 180 - incl : incl, 90) + (Math.acos(RE / (RE + perigee)) * 180 / Math.PI) * 0.6;
  const reach = Math.max(0, Math.min(1, (50 - reachDeg) / 25));
  const lit = perigee < 450 ? 0.6 : perigee < 800 ? 0.3 : 0;
  const year = o.launch ? Number(String(o.launch).slice(0, 4)) : 2026;
  const age = year < 1970 ? 1 : year < 1980 ? 0.7 : year < 1992 ? 0.4 : year < 2010 ? 0.15 : 0;
  return 0.5 * bright + 0.3 * reach + 0.1 * lit + 0.15 * age;
}
export const TIER_SHARE = [['common', 0.40], ['uncommon', 0.30], ['rare', 0.18], ['epic', 0.09], ['legendary', 0.03]];
// Re-tiers single-object cards in place (fleet members keep their family's tier). Returns how many changed.
export function retier(objects) {
  const solo = objects.filter((o) => !o.family).map((o) => ({ o, d: difficulty(o) })).sort((x, y) => x.d - y.d);
  let changed = 0, i = 0;
  for (const [tier, share] of TIER_SHARE) {
    const end = tier === 'legendary' ? solo.length : Math.min(solo.length, i + Math.round(share * solo.length));
    for (; i < end; i++) { const o = solo[i].o; if (o.tier !== tier) changed++; o.tier = tier; }
  }
  for (const id of LEGENDARY_IDS) { const o = objects.find((x) => x.id === id); if (o) { o.tier = 'rare'; o.icon = 1; } }
  return changed;
}
