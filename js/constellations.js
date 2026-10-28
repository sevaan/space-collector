// Collectable constellations: all 88 plus the Big Dipper (2026-10-11; first the 12 zodiac signs, Orion, the Dippers,
// Cassiopeia, Cygnus and the Southern Cross), from data/constellations.json (scripts/build-constellations.mjs).
// Every star in a stick figure (magnitude <= 5) is its own card; the constellation card turns gold when
// you own all of them. Bright stars that already have cards (Regulus, Spica…) count as members.
// No DOM.
import { NATURAL, NATURAL_BY_KEY, SOLAR_SYSTEM } from './natural.js?v=0.1.1281';
import { starVector } from './celestial.js?v=0.1.1281';

const GEN = { Ari: 'Arietis', Tau: 'Tauri', Gem: 'Geminorum', Cnc: 'Cancri', Leo: 'Leonis', Vir: 'Virginis', Lib: 'Librae', Sco: 'Scorpii', Sgr: 'Sagittarii',
  Cap: 'Capricorni', Aqr: 'Aquarii', Psc: 'Piscium', Ori: 'Orionis', BigDipper: 'Ursae Majoris', UMi: 'Ursae Minoris', Cas: 'Cassiopeiae', Cyg: 'Cygni', Cru: 'Crucis',
  // the other 70 (2026-10-11)
  And: 'Andromedae', Ant: 'Antliae', Aps: 'Apodis', Aql: 'Aquilae', Ara: 'Arae', Aur: 'Aurigae', Boo: 'Boötis', Cae: 'Caeli', Cam: 'Camelopardalis',
  CVn: 'Canum Venaticorum', CMa: 'Canis Majoris', CMi: 'Canis Minoris', Car: 'Carinae', Cen: 'Centauri', Cep: 'Cephei', Cet: 'Ceti', Cha: 'Chamaeleontis',
  Cir: 'Circini', Col: 'Columbae', Com: 'Comae Berenices', CrA: 'Coronae Australis', CrB: 'Coronae Borealis', Crv: 'Corvi', Crt: 'Crateris', Del: 'Delphini',
  Dor: 'Doradus', Dra: 'Draconis', Equ: 'Equulei', Eri: 'Eridani', For: 'Fornacis', Gru: 'Gruis', Her: 'Herculis', Hor: 'Horologii', Hya: 'Hydrae', Hyi: 'Hydri',
  Ind: 'Indi', Lac: 'Lacertae', LMi: 'Leonis Minoris', Lep: 'Leporis', Lup: 'Lupi', Lyn: 'Lyncis', Lyr: 'Lyrae', Men: 'Mensae', Mic: 'Microscopii',
  Mon: 'Monocerotis', Mus: 'Muscae', Nor: 'Normae', Oct: 'Octantis', Oph: 'Ophiuchi', Pav: 'Pavonis', Peg: 'Pegasi', Per: 'Persei', Phe: 'Phoenicis',
  Pic: 'Pictoris', PsA: 'Piscis Austrini', Pup: 'Puppis', Pyx: 'Pyxidis', Ret: 'Reticuli', Sge: 'Sagittae', Scl: 'Sculptoris', Sct: 'Scuti', Ser: 'Serpentis',
  Sex: 'Sextantis', Tel: 'Telescopii', Tri: 'Trianguli', TrA: 'Trianguli Australis', Tuc: 'Tucanae', UMa: 'Ursae Majoris', Vel: 'Velorum', Vol: 'Volantis', Vul: 'Vulpeculae' };
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
const tierFor = (mag) => (mag <= 3 ? 'common' : 'uncommon'); // seen from a city: Common; needs darker skies: Uncommon. No star is Rare or above (2026-10-09, Sevaan)
const colourOf = (bv) => bv == null ? '—' : bv < 0 ? 'Blue-white' : bv < 0.3 ? 'White' : bv < 0.6 ? 'Yellow-white' : bv < 1.0 ? 'Yellow' : bv < 1.4 ? 'Orange' : 'Red';

export const CONSTELLATIONS = [];
export const CON_BY_ID = new Map();
export const CON_STARS = [];               // star cards with a v (equatorial unit vector) for targeting
// "690" light-years, rounded as far as the measurement allows: whole numbers close by, tens past 100, hundreds past
// 1,000, and a "~" when the parallax is uncertain by more than 10% (2026-10-17).
const lyText = ([ly, err]) => { const r = ly < 100 ? Math.round(ly) : ly < 1000 ? Math.round(ly / 10) * 10 : Math.round(ly / 100) * 100; return `${err > 0.1 ? '~' : ''}${r.toLocaleString('en-US')}`; };
let loading = null, starFacts = {}, starDist = {};
export const starDistance = (hip) => starDist[hip] ?? null; // [light-years, relative error] or null
export function loadConstellations(url = 'data/constellations.json') {
  // Each star’s own researched fact (pre-launch writing review, 2026-10-15): data/star-facts.json, keyed by HIP.
  const facts = fetch(url.replace('constellations.json', 'star-facts.json')).then((r) => r.json()).catch(() => ({}));
  // Distances (2026-10-17): Hipparcos parallaxes, data/star-dist.json { hip: [light-years, relative error] }.
  const dist = fetch(url.replace('constellations.json', 'star-dist.json')).then((r) => r.json()).then((d) => Object.fromEntries(Object.entries(d).filter(([, v]) => Array.isArray(v) && v[0] > 0 && v[1] >= 0 && v[1] < 1))).catch(() => ({}));
  return (loading ??= Promise.all([fetch(url).then((r) => r.json()), facts, dist]).then(([d, f, ds]) => { starFacts = f ?? {}; starDist = ds ?? {}; register(d); }).catch(() => {}));
}

// Name and constellation fixes from the pre-launch fact check (2026-10-15): d3-celestial gives some stars a name that
// belongs to a neighbour (η Aql "Tarazed" is γ Aql’s, κ¹ Pup "Markab" is α Peg’s…) or an old name the IAU never adopted;
// those show their Bayer name instead. Stars shared by figures (the False Cross) get the constellation they’re really in.
// 2026-10-20 star QA: names follow the IAU WGSN list (exopla.net, adopted through 2026-10-15); unofficial names that
// clash with another star's IAU name (Atik, Nembus, Angetenar, Al Kiladah, Aldhiba) show the Bayer name; `bayer` fixes a
// letter; `colour` is the COLOUR stat from the spectral class where B-V misleads (K giants with B-V 1.4+ are orange);
// `bv` is the star's own colour for hot stars reddened by dust (drives both COLOUR and the temperature strip).
const STAR_FIX = {
  // IAU boundaries checked for all figure stars with Astropy (Roman 1987), 2026-10-21.
  677: { con: 'Andromeda', id: 'And' }, 25428: { con: 'Taurus', id: 'Tau' },
  39429: { con: 'Puppis', id: 'Pup' }, 79593: { con: 'Ophiuchus', id: 'Oph' },
  746: { colour: 'White' }, 3031: { name: 'Anunitu' }, 3092: { name: 'Kuda' }, 3179: { name: 'Schedar' }, 3693: { name: 'Shimu' },
  3786: { name: 'Waiping', colour: 'Orange' }, 4427: { name: 'Tiansi' }, 4463: { name: 'Kui' }, 4906: { colour: 'Orange' },
  5364: { name: 'Gajahmina' }, 5434: { name: 'Junnanmen', bv: -0.16 }, 6537: { name: 'Tiancang' }, 8068: { name: 'Dajiangjunbei' },
  8198: { colour: 'Orange' }, 8832: { bayer: 'γ2' }, 8833: { colour: 'Orange' }, 10064: { name: 'Alaybasan' }, 10670: { name: 'Apdu' },
  12770: { con: 'Cetus', id: 'Cet' }, 13954: { name: null }, 14576: { colour: 'Blue-white' }, 15474: { name: null }, 16228: { bv: -0.06 },
  16537: { colour: 'Orange' }, 17358: { name: 'Sarvvis' }, 17448: { bv: -0.26 }, 17884: { name: 'Custos' }, 17959: { name: 'Shaowei' },
  18246: { name: null, bv: -0.26 }, 18532: { name: 'Áldu' }, 18614: { bv: -0.31 }, 18724: { name: 'Bibing' }, 19343: { name: null },
  19780: { name: 'Rhombus' }, 20042: { name: null }, 20455: { colour: 'Orange' }, 20535: { colour: 'Orange' }, 23015: { colour: 'Orange' },
  23685: { name: 'Ping', colour: 'Orange' }, 24305: { name: 'Bade' }, 25985: { colour: 'Yellow-white' }, 27288: { name: 'Darlugal' },
  27654: { colour: 'Orange' }, 28358: { name: 'Bagu' }, 28716: { bv: -0.24 }, 29271: { name: 'Hoerikwaggo' }, 29997: { name: 'Shangwei' },
  31685: { name: 'Pipit', con: 'Puppis', id: 'Pup' }, 33160: { colour: 'Orange' }, 33694: { name: 'Tonglingxing' },
  33856: { name: 'Nganurganity', colour: 'Orange' }, 34444: { colour: 'Yellow-white' }, 35264: { colour: 'Orange' }, 37229: { name: null },
  38170: { colour: 'Yellow' }, 38835: { colour: 'Yellow-white' }, 39953: { con: 'Vela', id: 'Vel' }, 40526: { colour: 'Orange' },
  41075: { colour: 'Orange' }, 42913: { con: 'Vela', id: 'Vel' }, 43103: { name: 'Yuyu' }, 43234: { colour: 'White' }, 44816: { colour: 'Orange' },
  46390: { colour: 'Orange' }, 46515: { colour: 'Orange' }, 50371: { colour: 'Orange' }, 51069: { colour: 'Orange' }, 51172: { colour: 'Orange' },
  51839: { colour: 'Orange' }, 53253: { colour: 'Orange' }, 54463: { colour: 'Yellow' }, 54751: { colour: 'White' }, 55219: { colour: 'Orange' },
  55687: { colour: 'Orange' }, 60965: { colour: 'White' }, 64962: { name: 'Naga' }, 65109: { name: 'Kulou' }, 67275: { name: 'Tepiamenit' },
  67464: { name: 'Heng' }, 68002: { name: 'Leepwal' }, 71053: { name: 'Kalasungsang' }, 71681: { colour: 'Orange' }, 71860: { name: 'Uridim' },
  71908: { name: 'Xami' }, 72105: { colour: 'Orange' }, 72220: { name: 'Maenalus' }, 72370: { name: 'Paradys', colour: 'Orange' },
  72571: { name: 'Solitaire' }, 72607: { colour: 'Orange' }, 74395: { colour: 'Orange' }, 74666: { name: 'Qigong' }, 75177: { colour: 'Orange' },
  75323: { bv: -0.2 }, 76127: { name: 'Guansuo' }, 76952: { name: 'Baltesha' }, 77233: { name: 'Zhou' }, 77512: { name: 'Matrichakra' },
  78072: { name: 'Muning' }, 78493: { name: 'Aurwandilsta' }, 79992: { name: 'Asuusiha' }, 80112: { bv: -0.26 }, 80473: { bv: -0.24 },
  80569: { bv: -0.24 }, 80582: { name: 'Yaqana' }, 81065: { colour: 'Orange' }, 81377: { bv: -0.31 }, 81693: { name: 'Tianji' },
  82273: { colour: 'Orange' }, 82363: { colour: 'Orange' }, 83081: { colour: 'Orange' }, 83153: { colour: 'Orange' },
  83207: { name: 'Khepdenreret' }, 84345: { colour: 'Red' }, 84380: { name: 'Nüchuang', colour: 'Orange' }, 85258: { colour: 'Orange' },
  85829: { name: 'Alawaidh' }, 86670: { name: 'Girtab' }, 87073: { name: null }, 87108: { name: 'Bake-eo' }, 87833: { colour: 'Orange' },
  88048: { colour: 'Orange' }, 89341: { bv: -0.1 }, 89642: { name: 'Heryibwia' }, 89908: { name: null }, 90098: { colour: 'Orange' },
  90568: { colour: 'Orange' }, 90982: { name: 'Bie' }, 91117: { name: 'Tianbian' }, 91971: { name: 'Kautoki' }, 92041: { name: 'Nandou' },
  92175: { colour: 'Yellow' }, 92420: { colour: 'Blue-white' }, 92761: { colour: 'Orange' }, 92791: { name: 'Jiantai' }, 93085: { name: 'Jian' },
  93683: { name: 'Alqiladah' }, 94005: { name: 'Qedty' }, 94160: { name: 'Alqubba' }, 94643: { name: null, colour: 'Orange' }, 94779: { name: null },
  94820: { colour: 'Yellow' }, 95168: { name: 'Kenemu' }, 95176: { bv: -0.24 }, 95501: { name: 'Guqi' }, 96837: { name: 'Shakh' },
  97278: { colour: 'Orange' }, 97365: { name: 'Zuoqi', colour: 'Red' }, 97804: { name: 'Pagru', colour: 'Yellow-white' },
  98110: { name: 'Almighzal' }, 98337: { name: 'Telum' }, 98495: { colour: 'White' }, 99473: { name: 'Antinous' }, 100027: { name: 'Sukhurmashu' },
  102831: { colour: 'Yellow' }, 102978: { colour: 'Orange' }, 103045: { colour: 'White' }, 104139: { name: 'Udang' }, 104732: { name: 'Tianjinnan' },
  104858: { name: 'Tepennekhet' }, 104987: { colour: 'Yellow' }, 105140: { name: 'Aerostaticus' }, 105881: { colour: 'Yellow' },
  107259: { name: 'Garnet Star' }, 107315: { colour: 'Orange' }, 107380: { name: 'Baijiu' }, 109176: { name: 'Jiu' }, 109410: { name: 'Neichu' },
  109857: { colour: 'Yellow-white' }, 109937: { colour: 'Orange' }, 110130: { name: 'Lang-Exster' }, 110395: { colour: 'White' },
  110538: { name: 'Alsamaka' }, 110609: { bv: -0.06 }, 110991: { colour: 'Yellow-white' }, 110997: { colour: 'Yellow' }, 111169: { name: 'Stellio' },
  111188: { name: 'Tiangang' }, 111497: { name: 'Fenmu' }, 112440: { name: 'Ligong', colour: 'Yellow' }, 112447: { name: 'Tugongli' },
  112961: { name: 'Shatabhisha' }, 113638: { colour: 'Orange' }, 113726: { name: 'Alfarasalkamil' }, 114341: { name: 'Safina' },
  114971: { name: 'Yunyu' }, 116584: { name: 'Udkadua' }, 116631: { name: 'Rasalnaqa' }, 116771: { name: 'Puwuh Atarung' },
  116805: { name: 'Kaffalmusalsala' }, 117221: { colour: 'Yellow' }, 118268: { name: 'Pili' },
};
function register(data) {
  // Reuse HIP cards shared by drawn figures without changing existing collection keys.
  const byName = new Map(NATURAL.filter((o) => o.type === 'star').map((o) => [o.name.toLowerCase(), o]));
  let order = 100;
  for (const c of data.constellations) {
    const abbr = ABBR[c.id] ?? c.id, gen = GEN[c.id];
    const used = new Set(), keys = [];
    c.stars.forEach((s, i) => {
      const fix = STAR_FIX[s.hip]; if (fix) s = { ...s, ...fix }; // name, bayer, bv overrides
      const conName = fix?.con ?? (c.id === 'BigDipper' ? 'Ursa Major' : c.name);
      const existing = NATURAL_BY_KEY.get(`star:hip${s.hip}`) ?? (s.name && byName.get(s.name.toLowerCase()));
      let card = existing;
      if (!card) {
        const gen = GEN[fix?.id] ?? GEN[c.id], abbr = fix?.id ?? (ABBR[c.id] ?? c.id);
        const sci = s.bayer ? `${spell(s.bayer)} ${gen}` : s.flam ? `${s.flam} ${gen}` : `HIP ${s.hip}`;
        const name = s.name && !used.has(s.name) ? s.name : sci;
        used.add(name);
        const key = `star:hip${s.hip}`;
        card = {
          key, id: key, card: key, natural: 'star', type: 'star', name, skyName: null, hip: s.hip, tier: tierFor(s.mag), order: order++,
          code: s.bayer ? `${s.bayer} ${abbr}` : s.flam ? `${s.flam} ${abbr}` : `HIP ${s.hip}`, constellation: conName, mag: s.mag,
          stats: [['BRIGHTNESS', s.mag.toFixed(1).replace('-', '−'), 'mag'], ...(starDist[s.hip] ? [['DISTANCE', lyText(starDist[s.hip]), 'ly']] : []), ['CONSTELLATION', conName, ''], ['COLOUR', fix?.colour ?? colourOf(s.bv), '']],
          src: starFacts[s.hip]?.source, fact: starFacts[s.hip]?.fact ?? `One of the **${c.stars.length} stars** that draw **${c.name}**, ${c.nick}, and the **${ordinal(i + 1)}brightest** of them.`,
        };
        NATURAL.push(card); NATURAL_BY_KEY.set(key, card);
      }
      card.con ??= c.id; card.v ??= starVector(s.ra, s.dec); card.hip ??= s.hip; card.mag ??= s.mag; card.bv ??= s.bv;
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
    // Not a card any more (2026-10-09, Sevaan): completing a constellation earns its mission patch (js/progress.js).
    CONSTELLATIONS.push(con); CON_BY_ID.set(c.id, con);
  }
}

// What progress() needs: each constellation (and the Solar System) with its member card keys, for completion
// counts and the per-constellation mission patches.
export const conList = () => [...CONSTELLATIONS, SOLAR_SYSTEM].map((c) => ({ id: c.con, name: c.name, nick: c.data?.nick ?? '', stars: c.stars, zodiac: c.zodiac, system: !!c.system }));

// Constellation progress from a set of collected card keys: { have, total, level }.
export function conProgress(con, ownedKeys) {
  const have = con.stars.filter((k) => ownedKeys.has(k)).length, total = con.stars.length;
  const level = have >= total ? 'gold' : have * 2 >= total ? 'silver' : have ? 'bronze' : 'none';
  return { have, total, level };
}
