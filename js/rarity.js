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

// Older = rarer. Constellation launch cards are always Common (set at catalogue build).
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
