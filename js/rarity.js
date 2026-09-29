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

// Big constellations: plentiful, so Common.
const CONSTELLATION = /^(STARLINK|ONEWEB|QIANFAN|GUOWANG|KUIPER|IRIDIUM|GLOBALSTAR|ORBCOMM|SPACEMOBILE|BLUEBIRD)/;
// Crewed and cargo craft visiting a station.
const VISITOR = /^(DRAGON|CREW DRAGON|SOYUZ|PROGRESS|SHENZHOU|TIANZHOU|CYGNUS|STARLINER|HTV)/;

// o: { id, name, kind: 'PAY'|'R/B'|'DEB'|'UNK', owner, launch: 'YYYY-MM-DD', ops }
export function tierFor(o) {
  const year = o.launch ? Number(o.launch.slice(0, 4)) : null;
  // Blank status on an old payload almost always means it stopped working long ago.
  const dead = o.kind === 'PAY' && (o.ops === '-' || o.ops === 'D' || ((!o.ops || o.ops === '?') && year && year < 2000));
  if (LEGENDARY_IDS.has(o.id) || (year && year < 1980)) return 'legendary';
  if (VISITOR.test(o.name)) return 'epic';
  if (o.kind === 'R/B' && o.owner === 'CIS') return 'epic';
  if (dead && year && year < 2000) return 'epic';
  if (o.kind === 'R/B' || o.kind === 'DEB') return 'rare';
  if (dead) return 'rare';
  if (CONSTELLATION.test(o.name)) return 'common';
  return 'uncommon';
}
