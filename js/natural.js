import { extinction } from './sky-limit.js?v=0.1.1143';
// The Moon, the naked-eye planets and the brightest named stars, as collectible cards.
// Positions come from js/celestial.js (state.bodies, state.skyEnu); this file holds the card facts and
// the "can you see it right now" rules. No DOM. Every fact must be true; approximate values say so.
// Sources: NASA planetary fact sheets / science.nasa.gov, JPL physical parameters, standard star data.

// The Sun: catchable by day (the Sun card is the daytime loop). You aim the phone, not your eyes.
const sunCard = {
  key: 'sun', id: 'sun', natural: 'sun', type: 'sun', name: 'The Sun', tier: 'common', /* Common: everyone sees it every day (2026-10-12, Sevaan; was Rare, Epic before that) */ order: 0, code: 'OUR STAR',
  far: ['8.3', 'LIGHT-MINUTES AWAY'],
  stats: [['DIAMETER', '1,392,700', 'km'], ['EQUATOR SPIN', '~25', 'd'], ['AGE', '4.6', 'billion yr']],
  fact: 'A middle-aged star with **1.3 million times Earth’s volume**. Never look straight at it: point the phone, catch it, and keep your eyes on the screen.',
};
// Earth (2026-10-16, Sevaan): look straight down at your feet, the centre of the ring on the ground, and collect the
// planet you’re standing on. Any time, day or night. Its own type (not 'planet'), so it never counts toward planet
// missions or the Solar System patch.
const earthCard = {
  key: 'earth', id: 'earth', natural: 'earth', type: 'earth', name: 'Earth', tier: 'common', order: 1.5, code: 'UNDER YOUR FEET',
  far: ['8.3', 'LIGHT-MINUTES FROM THE SUN'],
  stats: [['DIAMETER', '12,742', 'km'], ['ONE YEAR', '365.25', 'd'], ['ONE SPIN', '23.9', 'h']],
  fact: 'You’re standing on it. Earth carries you around the Sun at about **107,000 km/h**, and it’s the only place we know of with **life**.',
};
const moon = {
  key: 'moon', id: 'moon', natural: 'moon', type: 'moon', name: 'Moon', tier: 'common', order: 1, code: "EARTH’S MOON",
  far: ['1.3', 'LIGHT-SECONDS AWAY'],
  stats: [['MEAN DISTANCE', '384,400', 'km'], ['PHASE CYCLE', '29.5', 'd'], ['DIAMETER', '3,474', 'km']],
  fact: 'The Moon spins once per orbit, keeping **nearly the same face** toward Earth. A slight wobble lets us peek around its edges. It drifts about **3.8 cm** farther away each year.',
};

// Rarity (2026-10-09, Sevaan): the Moon and every star you can see from a city are Common; the bright planets are
// Uncommon; Mercury (low in twilight, a few weeks a year) Rare; Uranus Epic and Neptune Legendary (dark skies / binoculars).
// Planet: [name, tier, order, light-minutes from the Sun, diameter km, year, day, fact]
const PLANETS = [
  ['Mercury', 'rare', 2, '3.2', '4,879', ['88', 'd'], ['59', 'd'], 'The smallest planet and the closest to the Sun, so it never strays far from it in our sky. It races round in **88 days**. Look low, just after sunset or before dawn.'],
  ['Venus', 'uncommon', 3, '6.0', '12,104', ['225', 'd'], ['243', 'd'], 'One **rotation takes 243 Earth days**, longer than its 225-day year. It spins opposite to most planets and is the brightest natural object in the night sky after the Moon.'],
  ['Mars', 'uncommon', 4, '12.7', '6,779', ['687', 'd'], ['24.6', 'h'], 'Its red colour is **rust** in the dust. It also has the tallest volcano we know of, **Olympus Mons**, about two and a half times the height of Everest.'],
  ['Jupiter', 'uncommon', 5, '43', '139,820', ['11.9', 'yr'], ['9.9', 'h'], 'The biggest planet, with more than **1,300 times Earth’s volume**. A pair of binoculars shows its four largest moons as tiny dots.'],
  ['Saturn', 'uncommon', 6, '79', '116,460', ['29.4', 'yr'], ['10.7', 'h'], 'Its rings are countless chunks of **ice and rock**, hidden around that steady golden dot until you use a telescope. Saturn’s **average density is lower than water’s**.'],
  ['Uranus', 'epic', 7, '160', '50,724', ['84', 'yr'], ['17.2', 'h'], 'It spins almost **on its side**, with each pole facing years of sunlight and darkness. Under a truly dark sky, keen eyes can just pick it out as a **faint point of light**.'],
  ['Neptune', 'legendary', 8, '250', '49,244', ['165', 'yr'], ['16.1', 'h'], 'The first planet found through **mathematical prediction**: Uranus’s unexpected motion pointed astronomers toward it in 1846. Too faint for unaided eyes; use binoculars or a telescope to find it.'],
].map(([name, tier, order, lm, dia, year, day, fact]) => ({
  key: `planet:${name.toLowerCase()}`, id: `planet:${name.toLowerCase()}`, natural: 'planet', type: 'planet', name, tier, order,
  code: `${{ Mercury: '1ST', Venus: '2ND', Mars: '4TH', Jupiter: '5TH', Saturn: '6TH', Uranus: '7TH', Neptune: '8TH' }[name]} FROM THE SUN`,
  far: [lm, 'LIGHT-MINUTES FROM THE SUN'],
  stats: [['DIAMETER', dia, 'km'], ['ONE YEAR', ...year], ['ONE SPIN', ...day]],
  fact,
}));

// The year the starlight reaching you tonight set off (approximate distances marked with ~).
function lightLeft(ly) {
  const year = Math.round(new Date().getFullYear() - Number(ly.replace(/[~,]/g, '')));
  // Before year 1 it’s BC (playtest room 2026-10-11: "~-5474 AD" for the Double Cluster).
  return `${ly.startsWith('~') ? '~' : ''}${year < 1 ? `${(1 - year).toLocaleString('en-US')} BC` : year < 1000 ? `${year} AD` : year}`;
}

// Star: [card name, name in data/sky.json, designation, constellation, distance (light-years), tier,
//        apparent magnitude (from data/sky.json; Betelgeuse and Antares vary), fact]
const STARS = [
  ['Sirius', 'Sirius', 'α CMa', 'Canis Major', '8.6', 'common', -1.44, 'The **brightest star** in the night sky; its name comes from the Greek for **scorching**. A tiny white dwarf, Sirius B, circles it.'],
  ['Canopus', 'Canopus', 'α Car', 'Carina', '~310', 'common', -0.62, 'The **second-brightest star** in the night sky. Spacecraft have used it as a guide star to keep themselves pointed the right way.'],
  ['Arcturus', 'Arcturus', 'α Boo', 'Boötes', '37', 'common', -0.05, 'An **orange giant** about 25 times wider than the Sun. In 1933 its light was used to switch on the lights of the **Chicago World’s Fair**.'],
  ['Alpha Centauri', 'Rigil Kentaurus', 'α Cen', 'Centaurus', '4.4', 'common', -0.01, 'Part of the **nearest star system** to the Sun. Its faint third star, Proxima, is the closest star of all.'],
  ['Vega', 'Vega', 'α Lyr', 'Lyra', '25', 'common', 0.03, 'One corner of the **Summer Triangle**, with Deneb and Altair. In about 12,000 years, Earth’s wobble will make it the North Star.'],
  ['Capella', 'Capella', 'α Aur', 'Auriga', '43', 'common', 0.08, 'It looks like one star, but it’s **four**: two yellow giants orbiting each other, plus a faint pair of red dwarfs.'],
  ['Rigel', 'Rigel', 'β Ori', 'Orion', '~860', 'common', 0.18, 'Orion’s bright **blue-white foot**, a supergiant tens of thousands of times brighter than the Sun.'],
  ['Procyon', 'Procyon', 'α CMi', 'Canis Minor', '11.5', 'common', 0.4, 'One of our **closest neighbours**, just over 11 light-years away. Like Sirius, it has a faint white-dwarf companion.'],
  ['Achernar', 'Achernar', 'α Eri', 'Eridanus', '139', 'common', 0.45, 'It spins so fast it’s **squashed**: much wider across its middle than from pole to pole.'],
  ['Betelgeuse', 'Betelgeuse', 'α Ori', 'Orion', '~550', 'common', 0.45, 'A **red supergiant** in Orion’s shoulder. Put it where the Sun is and it would reach past the orbit of Mars.'],
  ['Hadar', 'Hadar', 'β Cen', 'Centaurus', '~390', 'common', 0.61, 'With Alpha Centauri, one of the two **Pointers** that lead your eye to the Southern Cross.'],
  ['Altair', 'Altair', 'α Aql', 'Aquila', '17', 'common', 0.76, 'One of the **fastest-spinning** bright stars: it turns once in under 8 hours. The Sun takes nearly a month.'],
  ['Acrux', 'Acrux', 'α Cru', 'Crux', '~320', 'common', 0.77, 'The brightest star of the **Southern Cross**, which appears on the flags of Australia, New Zealand and Brazil.'],
  ['Aldebaran', 'Aldebaran', 'α Tau', 'Taurus', '65', 'common', 0.87, 'The **red eye of Taurus**, the Bull. It seems to sit in the Hyades star cluster, but it’s less than half as far away.'],
  ['Spica', 'Spica', 'α Vir', 'Virgo', '~250', 'common', 0.98, 'Really **two hot stars** so close together that they orbit each other every four days.'],
  ['Antares', 'Antares', 'α Sco', 'Scorpius', '~550', 'common', 1.06, 'Its name means **rival of Mars**, because its red colour looks so like the planet.'],
  ['Pollux', 'Pollux', 'β Gem', 'Gemini', '34', 'common', 1.16, 'The closest **giant star** to the Sun, and it has a planet of its own.'],
  ['Fomalhaut', 'Fomalhaut', 'α PsA', 'Piscis Austrinus', '25', 'common', 1.17, 'A lonely bright star in a dim patch of sky, wrapped in a huge **ring of dust**.'],
  ['Deneb', 'Deneb', 'α Cyg', 'Cygnus', '~2,000', 'common', 1.25, 'One of the most **distant stars** you can see with your eyes. To look this bright from so far, it must shine **tens of thousands of times** brighter than the Sun.'],
  ['Regulus', 'Regulus', 'α Leo', 'Leo', '79', 'common', 1.36, 'The heart of Leo sits close to the **ecliptic**, the Sun’s yearly path across our sky. The Moon sometimes passes in front of it, briefly hiding the star.'],
  ['Polaris', 'Polaris', 'α UMi', 'Ursa Minor', '~430', 'common', 1.97, 'The **North Star** lies close to the direction of Earth’s North Pole, so it barely shifts as the northern sky turns. It isn’t even among the **40 brightest stars** at night.'],
].map(([name, skyName, desig, con, ly, tier, mag, fact], i) => ({
  key: `star:${name.toLowerCase().replace(/\s+/g, '-')}`, id: `star:${name.toLowerCase().replace(/\s+/g, '-')}`, natural: 'star', type: 'star',
  name, skyName, tier, order: 10 + i, code: desig, constellation: con,
  far: [ly, 'LIGHT-YEARS AWAY'],
  stats: [['BRIGHTNESS', mag.toFixed(1).replace('-', '−'), 'mag'], ['DISTANCE', ly, 'ly'], ['LIGHT LEFT IT', lightLeft(ly), '']], // distance, not the constellation (it's in the line above: "Star in Aquila"; 2026-10-20, Sevaan)
  fact,
}));

// Deep sky (2026-10-11, Sevaan): star clusters, nebulae and galaxies you can see with your eyes from a dark enough
// sky. J2000 positions. `need` is how good the sky has to be: the faintest star you can see (js/sky-limit.js starLimit)
// must reach it; extended glows need more than their total brightness suggests. Distances are rounded, ~ marks
// estimates. Facts stay conservative and true. [key, name, kind, ra°, dec°, constellation id, mag, need, light-years,
//  tier, fact]
const DEEP = [
  ['pleiades', 'The Pleiades', 'Open cluster', 56.85, 24.12, 'Tau', 1.6, 3.2, '444', 'uncommon', 'The **Seven Sisters**. Most people count six stars by eye, but the cluster holds over a thousand. In Japan it is **Subaru**, the car maker’s name and logo.'],
  ['hyades', 'The Hyades', 'Open cluster', 66.75, 15.87, 'Tau', 0.5, 3.5, '153', 'uncommon', 'The **nearest open star cluster** to Earth. Its V of stars is the face of Taurus the Bull. Bright Aldebaran sits in front of it but isn’t a member.'],
  ['alpha-persei', 'The Alpha Persei Cluster', 'Open cluster', 51.6, 49.0, 'Per', 1.2, 4.0, '~570', 'uncommon', 'A loose spray of stars around **Mirfak**, the brightest star of Perseus. Binoculars turn it into a glittering river.'],
  ['orion-nebula', 'The Orion Nebula', 'Nebula', 83.82, -5.39, 'Ori', 4.0, 4.0, '~1,344', 'rare', 'A cloud of gas where **new stars are being born**. It is the fuzzy middle “star” of the sword that hangs from Orion’s belt.'],
  ['beehive', 'The Beehive Cluster', 'Open cluster', 130.03, 19.67, 'Cnc', 3.7, 5.0, '~577', 'rare', 'About a thousand stars in Cancer. To the eye a faint misty patch; **Galileo** saw it as a swarm of stars through his telescope and wrote about it in 1610.'],
  ['double-cluster', 'The Double Cluster', 'Open cluster', 35.13, 57.13, 'Per', 3.7, 5.0, '~7,500', 'rare', '**Two star clusters side by side** in Perseus, each with thousands of stars. A faint smudge to the eye, a stunning pair in binoculars.'],
  ['ptolemy-cluster', 'Ptolemy’s Cluster', 'Open cluster', 268.47, -34.79, 'Sco', 3.3, 4.5, '~980', 'rare', 'Recorded by **Ptolemy** nearly 2,000 years ago as a misty patch after the sting of Scorpius, one of the first deep-sky objects anyone wrote down.'],
  ['coathanger', 'The Coathanger', 'Star pattern', 291.35, 20.18, 'Vul', 3.6, 6.0, '~200–1,100', 'rare', 'Looks just like an **upside-down coat hanger** in binoculars. It isn’t a real cluster: its stars are at very different distances and only line up from here.'],
  ['andromeda', 'The Andromeda Galaxy', 'Galaxy', 10.68, 41.27, 'And', 3.4, 5.0, '2.5 million', 'epic', 'A whole galaxy of about a **trillion stars**. The light you see left it **2.5 million years ago**, and it is slowly heading toward the Milky Way.'],
  ['hercules-cluster', 'The Hercules Cluster', 'Globular cluster', 250.42, 36.46, 'Her', 5.8, 6.0, '~25,000', 'epic', 'Hundreds of thousands of stars packed into a ball. In **1974** the Arecibo radio telescope beamed a message toward it.'],
  ['lagoon-nebula', 'The Lagoon Nebula', 'Nebula', 270.9, -24.38, 'Sgr', 6.0, 5.6, '~4,100', 'epic', 'A glowing cloud where stars are forming, in the thick of the Milky Way toward the **centre of our galaxy**. From a dark site it is a faint patch you can see without binoculars.'],
  ['carina-nebula', 'The Carina Nebula', 'Nebula', 161.27, -59.87, 'Car', 1.0, 4.5, '~7,500', 'epic', 'One of the **biggest, brightest nebulae** in the sky. It holds **Eta Carinae**, a star that briefly became the second-brightest in the night sky in the 1840s.'],
  ['omega-centauri', 'Omega Centauri', 'Globular cluster', 201.7, -47.48, 'Cen', 3.9, 4.5, '~17,000', 'epic', 'The Milky Way’s **biggest globular cluster**, about 10 million stars. It may be the core of a small galaxy our own swallowed long ago.'],
  ['lmc', 'The Large Magellanic Cloud', 'Galaxy', 80.89, -69.76, 'Dor', 0.9, 4.0, '~160,000', 'rare', 'A small galaxy **orbiting the Milky Way**. It’s named after Ferdinand Magellan, whose crew described it on their voyage around the world.'],
  ['smc', 'The Small Magellanic Cloud', 'Galaxy', 13.19, -72.83, 'Tuc', 2.7, 4.5, '~200,000', 'rare', 'The Large Cloud’s smaller partner, another galaxy circling ours. You have to be **far enough south** to see either of them.'],
  ['triangulum', 'The Triangulum Galaxy', 'Galaxy', 23.46, 30.66, 'Tri', 5.7, 6.3, '~2.7 million', 'legendary', 'A spiral galaxy right at the **limit of what eyes can see**. You need a truly dark sky, and it helps to look slightly to one side of it.'],
];
const CON_NAME = { Tau: 'Taurus', Per: 'Perseus', Ori: 'Orion', Cnc: 'Cancer', Sco: 'Scorpius', Vul: 'Vulpecula', And: 'Andromeda', Her: 'Hercules', Sgr: 'Sagittarius', Car: 'Carina', Cen: 'Centaurus', Dor: 'Dorado', Tuc: 'Tucana', Tri: 'Triangulum' };
const longAgo = (ly) => /million/.test(ly) ? `${ly.replace('~', '')} yr ago` : lightLeft(ly.split('–')[0]);
export const DEEP_SKY = DEEP.map(([id, name, kind, ra, dec, con, mag, need, ly, tier, fact], i) => ({
  key: `deep:${id}`, id: `deep:${id}`, natural: 'deepsky', type: 'deepsky', kind, name, tier, order: 60 + i, ra, dec, conId: con, mag, need,
  code: `IN ${CON_NAME[con] ?? con}`.toUpperCase(), constellation: CON_NAME[con] ?? con, far: kind === 'Star pattern' ? ['Various', 'STELLAR DISTANCES'] : [ly.replace('~', ''), 'LIGHT-YEARS AWAY'],
  // A line-of-sight pattern has several distances, so it has no single light-departure date.
  stats: [['BRIGHTNESS', mag.toFixed(1), 'mag'], ['TYPE', kind, ''], kind === 'Star pattern' ? ['DISTANCES', 'Different', ''] : ['LIGHT LEFT IT', longAgo(ly), '']],
  fact,
}));

// The Solar System: a constellation-style card (progress through its members, gold when all are collected,
// see conProgress in js/constellations.js) whose "stars" are the Moon and the seven other planets.
export const SOLAR_SYSTEM = {
  key: 'system:solar', id: 'system:solar', card: 'system:solar', natural: 'constellation', type: 'constellation', system: true, name: 'The Solar System', tier: 'legendary', order: 0,
  code: 'HOME SYSTEM', con: 'solar', stars: ['sun', 'moon', ...PLANETS.map((p) => p.key)], zodiac: false,
  stats: [['WORLDS', '9', ''], ['PLANETS', '7', 'of 8'], ['AGE', '4.6', 'billion yr']],
  fact: 'Everything in the Solar System you can see with your own eyes. Collect the Sun, the Moon and all **seven** planets to turn this card **gold**.',
};
export const NATURAL = [sunCard, moon, earthCard, ...PLANETS, ...STARS, ...DEEP_SKY]; // SOLAR_SYSTEM is a mission patch now, not a card (2026-10-09)
for (const o of NATURAL) o.card = o.key;
export const NATURAL_BY_KEY = new Map(NATURAL.map((o) => [o.key, o]));
const STAR_BY_SKY_NAME = new Map(STARS.map((o) => [o.skyName, o]));
const PLANET_BY_NAME = new Map(PLANETS.map((o) => [o.name, o]));

const elOf = (enu) => Math.asin(Math.max(-1, Math.min(1, enu[2]))) * 180 / Math.PI;
const azOf = (enu) => ((Math.atan2(enu[0], enu[1]) * 180 / Math.PI) + 360) % 360;

// Where each natural target is right now and whether it can be collected.
//   Moon: above the horizon and not new (it counts in daylight too).
//   Planets: a little above the horizon with the Sun below it (Venus and Jupiter show in twilight).
//   Stars: above the horizon haze, and the sky properly dark.
// bodies: state.bodies (with .enu). stars: state.skyEnu.stars. Returns [{ obj, look }].
// extra: constellation stars that aren’t in data/sky.json’s named list, as [{ obj, enu }]. Fainter stars
// only count when they’re bright enough for tonight’s sky (starLimit, js/sky-limit.js).
// How light the sky can still be for a bright planet to count (2026-10-08, Sevaan saw Venus at dusk with no card):
// the brighter it is, the earlier it shows. Mars (~+1) needs the Sun 3° down; Jupiter (−2) about 1.5° down; Venus
// (−4) is collectable from just before sunset.
const brightLimit = (mag) => -3 + Math.max(0, Math.min(5, (-1 - mag) * 1.6));
// binoLimit: tonight’s star limit through binoculars, when binocular mode is on (2026-10-12: Neptune, about magnitude
// 7.8, could never be collected, which made the gold Solar System patch impossible).
export function naturalTargets(bodies, stars, extra = [], starLimit = 6.5, binoLimit = null) {
  const out = [];
  const sun = bodies?.find((b) => b.kind === 'sun');
  const sunEl = sun ? elOf(sun.enu) : -90;
  for (const b of bodies ?? []) {
    const obj = b.kind === 'moon' ? moon : b.kind === 'sun' ? sunCard : b.kind === 'planet' ? PLANET_BY_NAME.get(b.name) : null;
    if (!obj) continue;
    const el = elOf(b.enu);
    // Faint planets (Uranus, Neptune) also have to beat tonight’s limit, after extinction, like the faint stars.
    const faint = b.kind === 'planet' && b.mag > 3;
    // By day the Moon needs to be well lit or well away from the Sun to be seen (astronomers 2026-10-11: a 3% Moon next
    // to the Sun was collectable at 1 PM). Low planets in twilight need some height to clear the glow (Mercury at 3°).
    const sunSep = sun ? Math.acos(Math.max(-1, Math.min(1, b.enu[0] * sun.enu[0] + b.enu[1] * sun.enu[1] + b.enu[2] * sun.enu[2]) / ((Math.hypot(...b.enu) * Math.hypot(...sun.enu)) || 1))) * 180 / Math.PI : 180;
    const moonOk = sunEl < -6 ? b.illum >= 0.03 : b.illum >= 0.15 && sunSep >= 30;
    const visible = b.kind === 'sun' ? el > -0.8 /* catchable until its top edge sets (2026-10-21, Sevaan: it was still showing at sunset); refraction lifts it ~0.6° */ : b.kind === 'moon' ? el > 0 && moonOk : b.kind === 'planet' && !faint && sunEl > -12 && el < 6 && b.name !== 'Venus' ? false : faint ? el > 5 && sunEl < -12 && b.mag + extinction(el) <= Math.max(starLimit, binoLimit ?? -99) : el > 2 && sunEl < brightLimit(b.mag);
    out.push({ obj, look: { az: azOf(b.enu), el, mag: b.mag, visible, enu: b.enu, phaseName: b.phaseName, illum: b.illum, distKm: b.distKm } });
  }
  out.push({ obj: earthCard, look: { az: 0, el: -90, mag: -99, visible: true, enu: [0, 0, -1] } }); // straight down, always there
  for (const s of stars ?? []) {
    const obj = s.name && STAR_BY_SKY_NAME.get(s.name);
    if (!obj) continue;
    const el = elOf(s.enu);
    out.push({ obj, look: { az: azOf(s.enu), el, mag: s.mag, visible: el > 3 && sunEl < -6 && s.mag + extinction(el) <= starLimit, enu: s.enu } }); // dimmed low down, like constellation stars (astronomers 2026-10-11)
  }
  // Deep sky (extra entries with obj.natural === 'deepsky'): high enough to clear the haze, properly dark, and a sky
  // good enough for the faint glow (obj.need, plus some of the extra air low down).
  for (const { obj, enu } of extra) if (obj.natural === 'deepsky' || obj.natural === 'comet') {
    const el = elOf(enu);
    // Comets are often best low in twilight, just after sunset: the brighter, the lighter the sky can be.
    const comet = obj.natural === 'comet', dark = comet ? sunEl < brightLimit(obj.mag) - 3 : sunEl < -12;
    // Bright clusters only need 8° (Ptolemy’s Cluster never clears 11° from southern Canada; astronomers 2026-10-11).
    out.push({ obj, look: { az: azOf(enu), el, mag: obj.mag, visible: el > (comet ? 4 : obj.need <= 4.5 ? 8 : 12) && dark && obj.need + extinction(el) * (comet ? 0.3 : 0.6) <= starLimit, enu } });
  }
  for (const { obj, enu } of extra) {
    if (obj.natural === 'deepsky' || obj.natural === 'comet') continue;
    const el = elOf(enu), mag = obj.mag + extinction(el);
    out.push({ obj, look: { az: azOf(enu), el, mag, visible: el > 3 && sunEl < -6 && mag <= starLimit, enu } });
  }
  return out;
}
