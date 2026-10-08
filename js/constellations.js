// Collectable constellations: the 12 zodiac signs plus Orion, the Big and Little Dippers, Cassiopeia,
// Cygnus and the Southern Cross (data/constellations.json, built by scripts/build-constellations.mjs).
// Every star in a stick figure (magnitude <= 5) is its own card; the constellation card turns gold when
// you own all of them. Bright stars that already have cards (Regulus, Spica…) count as members.
// No DOM.
import { NATURAL, NATURAL_BY_KEY } from './natural.js?v=0.1.277';
import { starVector } from './celestial.js?v=0.1.277';

const GEN = { Ari: 'Arietis', Tau: 'Tauri', Gem: 'Geminorum', Cnc: 'Cancri', Leo: 'Leonis', Vir: 'Virginis', Lib: 'Librae', Sco: 'Scorpii', Sgr: 'Sagittarii',
  Cap: 'Capricorni', Aqr: 'Aquarii', Psc: 'Piscium', Ori: 'Orionis', BigDipper: 'Ursae Majoris', UMi: 'Ursae Minoris', Cas: 'Cassiopeiae', Cyg: 'Cygni', Cru: 'Crucis' };
const ABBR = { BigDipper: 'UMa', Cru: 'Cru' };
const FACT = {
  Ori: 'The **Hunter**, one of the easiest constellations to recognise: look for three stars in a row, his belt.',
  BigDipper: 'Seven stars of the Great Bear, Ursa Major. The two at the end of the bowl **point to the North Star**.',
  UMi: 'The Little Bear. The end of its handle is **Polaris, the North Star**.',
  Cas: 'A **W** of five stars, on the opposite side of the North Star from the Big Dipper.',
  Cyg: 'The **Swan**, also called the **Northern Cross**, flying along the Milky Way.',
  Cru: 'The **smallest** of the 88 constellations, shown on the flags of Australia, New Zealand and Brazil.',
};
// Greek letters spelled out for card names: in the capitals of the title font, "ι" reads as "I".
const GREEK = { α: 'Alpha', β: 'Beta', γ: 'Gamma', δ: 'Delta', ε: 'Epsilon', ζ: 'Zeta', η: 'Eta', θ: 'Theta', ι: 'Iota', κ: 'Kappa', λ: 'Lambda', μ: 'Mu',
  ν: 'Nu', ξ: 'Xi', ο: 'Omicron', π: 'Pi', ρ: 'Rho', σ: 'Sigma', τ: 'Tau', υ: 'Upsilon', φ: 'Phi', χ: 'Chi', ψ: 'Psi', ω: 'Omega' };
const SUP = { 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const spell = (bayer) => bayer.replace(/^([α-ω])(\d?)$/, (m, g, n) => `${GREEK[g] ?? g}${n ? SUP[n] : ''}`);
const ordinal = (n) => n === 1 ? '' : `${n}${n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th'} `;
// Rarity follows how hard a star is to see.
const tierFor = (mag) => (mag <= 2.5 ? 'common' : mag <= 3.5 ? 'uncommon' : mag <= 4.3 ? 'rare' : 'epic');
const colourOf = (bv) => bv == null ? '—' : bv < 0 ? 'Blue-white' : bv < 0.3 ? 'White' : bv < 0.6 ? 'Yellow-white' : bv < 1.0 ? 'Yellow' : bv < 1.4 ? 'Orange' : 'Red';

export const CONSTELLATIONS = [];
export const CON_BY_ID = new Map();
export const CON_STARS = [];               // star cards with a v (equatorial unit vector) for targeting
let loading = null;
export function loadConstellations(url = 'data/constellations.json') {
  return (loading ??= fetch(url).then((r) => r.json()).then(register).catch(() => {}));
}

function register(data) {
  const byName = new Map(NATURAL.filter((o) => o.type === 'star').map((o) => [o.name.toLowerCase(), o]));
  let order = 100;
  for (const c of data.constellations) {
    const abbr = ABBR[c.id] ?? c.id, gen = GEN[c.id];
    const used = new Set(), keys = [];
    c.stars.forEach((s, i) => {
      const existing = s.name && byName.get(s.name.toLowerCase());
      let card = existing;
      if (!card) {
        const sci = s.bayer ? `${spell(s.bayer)} ${gen}` : s.flam ? `${s.flam} ${gen}` : `HIP ${s.hip}`;
        const name = s.name && !used.has(s.name) ? s.name : sci;
        used.add(name);
        const key = `star:hip${s.hip}`;
        card = {
          key, id: key, card: key, natural: 'star', type: 'star', name, skyName: null, hip: s.hip, tier: tierFor(s.mag), order: order++,
          code: s.bayer ? `${s.bayer} ${abbr}` : s.flam ? `${s.flam} ${abbr}` : `HIP ${s.hip}`, constellation: c.name, mag: s.mag,
          stats: [['BRIGHTNESS', s.mag.toFixed(1).replace('-', '−'), 'mag'], ['CONSTELLATION', c.name, ''], ['COLOUR', colourOf(s.bv), '']],
          fact: `One of the **${c.stars.length} stars** that draw **${c.name}**, ${c.nick}, and the **${ordinal(i + 1)}brightest** of them.`,
        };
        NATURAL.push(card); NATURAL_BY_KEY.set(key, card);
      }
      card.con ??= c.id; card.v ??= starVector(s.ra, s.dec); card.hip ??= s.hip; card.mag ??= s.mag;
      if (!CON_STARS.includes(card)) CON_STARS.push(card);
      keys.push(card.key);
    });
    const key = `con:${c.id}`;
    const brightest = NATURAL_BY_KEY.get(keys[0]);
    const con = {
      key, id: key, card: key, natural: 'constellation', type: 'constellation', name: c.name, tier: c.zodiac ? 'rare' : 'uncommon', order: order++,
      code: c.nick.toUpperCase(), constellation: c.name, con: c.id, stars: keys, zodiac: c.zodiac, data: c,
      stats: [['STARS', String(keys.length), ''], ['BRIGHTEST', brightest?.name ?? '—', ''], [c.zodiac ? 'ZODIAC' : 'KNOWN AS', c.zodiac ? 'Yes' : c.nick.replace(/^the /, ''), '']],
      fact: FACT[c.id] ?? `One of the 12 **zodiac** constellations: the Sun passes in front of ${c.name} every year. Collect all ${keys.length} of its stars to turn this card **gold**.`,
    };
    NATURAL.push(con); NATURAL_BY_KEY.set(key, con);
    CONSTELLATIONS.push(con); CON_BY_ID.set(c.id, con);
  }
}

// Constellation progress from a set of collected card keys: { have, total, level }.
export function conProgress(con, ownedKeys) {
  const have = con.stars.filter((k) => ownedKeys.has(k)).length, total = con.stars.length;
  const level = have >= total ? 'gold' : have * 2 >= total ? 'silver' : have ? 'bronze' : 'none';
  return { have, total, level };
}
