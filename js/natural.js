import { extinction } from './sky-limit.js?v=0.1.124';
// The Moon, the naked-eye planets and the brightest named stars, as collectible cards.
// Positions come from js/celestial.js (state.bodies, state.skyEnu); this file holds the card facts and
// the "can you see it right now" rules. No DOM. Every fact must be true; approximate values say so.
// Sources: NASA planetary fact sheets / science.nasa.gov, JPL physical parameters, standard star data.

const moon = {
  key: 'moon', id: 'moon', natural: 'moon', type: 'moon', name: 'Moon', tier: 'common', order: 1, code: "EARTH'S MOON",
  far: ['1.3', 'LIGHT-SECONDS AWAY'],
  stats: [['MEAN DISTANCE', '384,400', 'km'], ['PHASE CYCLE', '29.5', 'd'], ['DIAMETER', '3,474', 'km']],
  fact: 'The Moon spins exactly once for every trip around Earth, so it always keeps the **same face** turned towards us.',
};

// Planet: [name, tier, order, light-minutes from the Sun, diameter km, year, day, fact]
const PLANETS = [
  ['Mercury', 'rare', 2, '3.2', '4,879', ['88', 'd'], ['59', 'd'], 'The smallest planet and the closest to the Sun. It races round in **88 days**, so it never strays far from the Sun in our sky: look low, just after sunset or before dawn.'],
  ['Venus', 'common', 3, '6.0', '12,104', ['225', 'd'], ['243', 'd'], 'A day on Venus is **longer than its year**, and it spins the opposite way to most planets. It\'s the brightest thing in the night sky after the Moon.'],
  ['Mars', 'uncommon', 4, '12.7', '6,779', ['687', 'd'], ['24.6', 'h'], 'Its red colour is **rust**: iron minerals in the dust on its surface have oxidised.'],
  ['Jupiter', 'common', 5, '43', '139,820', ['11.9', 'yr'], ['9.9', 'h'], 'The biggest planet: more than **1,300 Earths** would fit inside it. A pair of binoculars shows its four largest moons as tiny dots.'],
  ['Saturn', 'uncommon', 6, '79', '116,460', ['29.4', 'yr'], ['10.7', 'h'], 'Its rings are countless chunks of **ice and rock**. You need a telescope to see them, but they\'re there around that steady golden dot.'],
].map(([name, tier, order, lm, dia, year, day, fact]) => ({
  key: `planet:${name.toLowerCase()}`, id: `planet:${name.toLowerCase()}`, natural: 'planet', type: 'planet', name, tier, order,
  code: `${{ Mercury: '1ST', Venus: '2ND', Mars: '4TH', Jupiter: '5TH', Saturn: '6TH' }[name]} FROM THE SUN`,
  far: [lm, 'LIGHT-MINUTES FROM THE SUN'],
  stats: [['DIAMETER', dia, 'km'], ['ONE YEAR', ...year], ['ONE SPIN', ...day]],
  fact,
}));

// The year the starlight reaching you tonight set off (approximate distances marked with ~).
function lightLeft(ly) {
  const year = Math.round(new Date().getFullYear() - Number(ly.replace(/[~,]/g, '')));
  return `${ly.startsWith('~') ? '~' : ''}${year < 1000 ? `${year} AD` : year}`;
}

// Star: [card name, name in data/sky.json, designation, constellation, distance (light-years), tier,
//        apparent magnitude (from data/sky.json; Betelgeuse and Antares vary), fact]
const STARS = [
  ['Sirius', 'Sirius', 'α CMa', 'Canis Major', '8.6', 'common', -1.44, 'The **brightest star** in the night sky. It has a tiny, faint companion: a white dwarf called Sirius B.'],
  ['Canopus', 'Canopus', 'α Car', 'Carina', '~310', 'common', -0.62, 'The **second-brightest star** in the night sky. Spacecraft have used it as a guide star to keep themselves pointed the right way.'],
  ['Arcturus', 'Arcturus', 'α Boo', 'Boötes', '37', 'common', -0.05, 'The brightest star in the northern half of the sky, an **orange giant** many times wider than the Sun.'],
  ['Alpha Centauri', 'Rigil Kentaurus', 'α Cen', 'Centaurus', '4.4', 'common', -0.01, 'Part of the **nearest star system** to the Sun. Its faint third star, Proxima, is the closest star of all.'],
  ['Vega', 'Vega', 'α Lyr', 'Lyra', '25', 'common', 0.03, 'One corner of the **Summer Triangle**, with Deneb and Altair. In about 12,000 years, Earth\'s wobble will make it the North Star.'],
  ['Capella', 'Capella', 'α Aur', 'Auriga', '43', 'common', 0.08, 'It looks like one star, but it\'s **four**: two yellow giants orbiting each other, plus a faint pair of red dwarfs.'],
  ['Rigel', 'Rigel', 'β Ori', 'Orion', '~860', 'common', 0.18, 'Orion\'s bright **blue-white foot**, a supergiant tens of thousands of times brighter than the Sun.'],
  ['Procyon', 'Procyon', 'α CMi', 'Canis Minor', '11.5', 'common', 0.4, 'One of our **closest neighbours**, just over 11 light-years away. Like Sirius, it has a faint white-dwarf companion.'],
  ['Achernar', 'Achernar', 'α Eri', 'Eridanus', '139', 'common', 0.45, 'It spins so fast it\'s **squashed**: much wider across its middle than from pole to pole.'],
  ['Betelgeuse', 'Betelgeuse', 'α Ori', 'Orion', '~550', 'common', 0.45, 'A **red supergiant** in Orion\'s shoulder. Put it where the Sun is and it would reach past the orbit of Mars.'],
  ['Hadar', 'Hadar', 'β Cen', 'Centaurus', '~390', 'common', 0.61, 'With Alpha Centauri, one of the two **Pointers** that lead your eye to the Southern Cross.'],
  ['Altair', 'Altair', 'α Aql', 'Aquila', '17', 'common', 0.76, 'One of the **fastest-spinning** bright stars: it turns once in about 9 hours. The Sun takes nearly a month.'],
  ['Acrux', 'Acrux', 'α Cru', 'Crux', '~320', 'common', 0.77, 'The brightest star of the **Southern Cross**, which appears on the flags of Australia, New Zealand and Brazil.'],
  ['Aldebaran', 'Aldebaran', 'α Tau', 'Taurus', '65', 'common', 0.87, 'The **red eye of Taurus**, the Bull. It seems to sit in the Hyades star cluster, but it\'s less than half as far away.'],
  ['Spica', 'Spica', 'α Vir', 'Virgo', '~250', 'common', 0.98, 'Really **two hot stars** so close together that they orbit each other every four days.'],
  ['Antares', 'Antares', 'α Sco', 'Scorpius', '~550', 'common', 1.06, 'Its name means **rival of Mars**, because its red colour looks so like the planet.'],
  ['Pollux', 'Pollux', 'β Gem', 'Gemini', '34', 'common', 1.16, 'The closest **giant star** to the Sun, and it has a planet of its own.'],
  ['Fomalhaut', 'Fomalhaut', 'α PsA', 'Piscis Austrinus', '25', 'common', 1.17, 'A lonely bright star in the autumn sky, wrapped in a huge **ring of dust**.'],
  ['Deneb', 'Deneb', 'α Cyg', 'Cygnus', '~2,000', 'common', 1.25, 'One of the most **distant stars** you can see with your eyes, yet still one of the brightest. Estimates of its distance vary a lot.'],
  ['Regulus', 'Regulus', 'α Leo', 'Leo', '79', 'common', 1.36, 'The heart of Leo. It sits almost exactly on the **Moon\'s path**, so the Moon often passes in front of it.'],
  ['Polaris', 'Polaris', 'α UMi', 'Ursa Minor', '~430', 'uncommon', 1.97, 'The **North Star**. It sits almost exactly above Earth\'s North Pole, so it barely moves while every other star circles around it.'],
].map(([name, skyName, desig, con, ly, tier, mag, fact], i) => ({
  key: `star:${name.toLowerCase().replace(/\s+/g, '-')}`, id: `star:${name.toLowerCase().replace(/\s+/g, '-')}`, natural: 'star', type: 'star',
  name, skyName, tier, order: 10 + i, code: desig, constellation: con,
  far: [ly, 'LIGHT-YEARS AWAY'],
  stats: [['BRIGHTNESS', mag.toFixed(1).replace('-', '−'), 'mag'], ['CONSTELLATION', con, ''], ['LIGHT LEFT IT', lightLeft(ly), '']],
  fact,
}));

export const NATURAL = [moon, ...PLANETS, ...STARS];
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
// extra: constellation stars that aren't in data/sky.json's named list, as [{ obj, enu }]. Fainter stars
// only count when they're bright enough for tonight's sky (starLimit, js/sky-limit.js).
export function naturalTargets(bodies, stars, extra = [], starLimit = 6.5) {
  const out = [];
  const sun = bodies?.find((b) => b.kind === 'sun');
  const sunEl = sun ? elOf(sun.enu) : -90;
  for (const b of bodies ?? []) {
    const obj = b.kind === 'moon' ? moon : b.kind === 'planet' ? PLANET_BY_NAME.get(b.name) : null;
    if (!obj) continue;
    const el = elOf(b.enu);
    const visible = b.kind === 'moon' ? el > 0 && b.illum >= 0.03 : el > 2 && sunEl < -3;
    out.push({ obj, look: { az: azOf(b.enu), el, mag: b.mag, visible, enu: b.enu, phaseName: b.phaseName, illum: b.illum } });
  }
  for (const s of stars ?? []) {
    const obj = s.name && STAR_BY_SKY_NAME.get(s.name);
    if (!obj) continue;
    const el = elOf(s.enu);
    out.push({ obj, look: { az: azOf(s.enu), el, mag: s.mag, visible: el > 3 && sunEl < -6, enu: s.enu } });
  }
  for (const { obj, enu } of extra) {
    const el = elOf(enu), mag = obj.mag + extinction(el);
    out.push({ obj, look: { az: azOf(enu), el, mag, visible: el > 3 && sunEl < -6 && mag <= starLimit, enu } });
  }
  return out;
}
