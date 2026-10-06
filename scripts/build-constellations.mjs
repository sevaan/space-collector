// Builds data/constellations.json: the collectable constellations (12 zodiac signs + Orion, the Big and
// Little Dippers, Cassiopeia, Cygnus and the Southern Cross) with the stars of their stick figures, from
// d3-celestial (https://github.com/ofrohn/d3-celestial, BSD-3-Clause). Only stars a person can see
// (magnitude <= 5) are collectable. Run: node scripts/build-constellations.mjs
import { writeFileSync } from 'node:fs';
const BASE = 'https://raw.githubusercontent.com/ofrohn/d3-celestial/master/data';
const get = async (f) => (await fetch(`${BASE}/${f}`)).json();
const FAINTEST = 5.0;
const ra = (lon) => ((lon % 360) + 360) % 360; // d3 longitude is RA in degrees (-180..180)
const SET = [
  ['Ari', 'Aries', 'the Ram', true], ['Tau', 'Taurus', 'the Bull', true], ['Gem', 'Gemini', 'the Twins', true], ['Cnc', 'Cancer', 'the Crab', true],
  ['Leo', 'Leo', 'the Lion', true], ['Vir', 'Virgo', 'the Maiden', true], ['Lib', 'Libra', 'the Scales', true], ['Sco', 'Scorpius', 'the Scorpion', true],
  ['Sgr', 'Sagittarius', 'the Archer', true], ['Cap', 'Capricornus', 'the Sea Goat', true], ['Aqr', 'Aquarius', 'the Water Bearer', true], ['Psc', 'Pisces', 'the Fishes', true],
  ['Ori', 'Orion', 'the Hunter', false], ['BigDipper', 'Big Dipper', 'part of the Great Bear', false], ['UMi', 'Little Dipper', 'the Little Bear', false],
  ['Cas', 'Cassiopeia', 'the Queen', false], ['Cyg', 'Cygnus', 'the Swan', false], ['Cru', 'Southern Cross', 'Crux', false],
];
// The Big Dipper is part of Ursa Major: its seven stars and their two lines (bowl, handle).
const DIPPER = [54061, 53910, 58001, 59774, 62956, 65378, 67301];
const DIPPER_LINES = [[54061, 53910, 58001, 59774, 54061], [59774, 62956, 65378, 67301]];
const [stars, names, lines] = await Promise.all([get('stars.6.json'), get('starnames.json'), get('constellations.lines.json')]);
const byId = new Map(stars.features.map((f) => [f.id, f]));
const near = (lon, lat) => {
  let best = null, bd = 0.03;
  for (const f of stars.features) { const [x, y] = f.geometry.coordinates; const d = Math.hypot((x - lon) * Math.cos(lat * Math.PI / 180), y - lat); if (d < bd) { bd = d; best = f; } }
  return best;
};
const starInfo = (f) => {
  const n = names[f.id] ?? {};
  return { hip: f.id, name: n.name || '', bayer: n.bayer || '', flam: n.flam || '', mag: +f.properties.mag.toFixed(2), bv: f.properties.bv ? +(+f.properties.bv).toFixed(2) : null,
    ra: +ra(f.geometry.coordinates[0]).toFixed(4), dec: +f.geometry.coordinates[1].toFixed(4) };
};
const out = [];
for (const [id, name, nick, zodiac] of SET) {
  let polylines;
  if (id === 'BigDipper') polylines = DIPPER_LINES.map((l) => l.map((h) => byId.get(h).geometry.coordinates));
  else polylines = lines.features.find((f) => f.id === id).geometry.coordinates;
  const seen = new Map();
  for (const pl of polylines) for (const [lon, lat] of pl) { const f = near(lon, lat); if (f && !seen.has(f.id)) seen.set(f.id, f); }
  const all = [...seen.values()].map(starInfo).sort((a, b) => a.mag - b.mag);
  out.push({ id, name, nick, zodiac, lines: polylines.map((pl) => pl.map(([lon, lat]) => [+ra(lon).toFixed(4), +lat.toFixed(4)])),
    stars: all.filter((s) => s.mag <= FAINTEST), faint: all.filter((s) => s.mag > FAINTEST).map((s) => [s.ra, s.dec, s.mag]) });
}
writeFileSync(new URL('../data/constellations.json', import.meta.url), JSON.stringify({ source: 'd3-celestial (BSD-3-Clause), J2000; collectable stars mag <= 5', constellations: out }));
for (const c of out) console.log(c.name.padEnd(15), c.stars.length, 'stars', c.faint.length ? `(+${c.faint.length} too faint)` : '', c.stars.map((s) => s.name || s.bayer || s.flam || s.hip).join(', '));
