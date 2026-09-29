// Builds data/sky.json: bright stars, constellation lines and labels, from d3-celestial
// (https://github.com/ofrohn/d3-celestial, BSD-3-Clause). Only needs re-running if we change the cutoffs.
// Run: node scripts/build-sky.mjs

import { writeFileSync } from 'node:fs';

const BASE = 'https://raw.githubusercontent.com/ofrohn/d3-celestial/master/data';
const FAINTEST = 5.0; // naked-eye limit from a darkish backyard
const NAME_MAG = 2.6; // label stars at least this bright

const get = async (f) => {
  const res = await fetch(`${BASE}/${f}`);
  if (!res.ok) throw new Error(`${f}: HTTP ${res.status}`);
  return res.json();
};

const [stars, names, lines, consts] = await Promise.all([
  get('stars.6.json'), get('starnames.json'), get('constellations.lines.json'), get('constellations.json'),
]);

// d3-celestial stores RA as longitude in degrees (-180..180). Convert to 0..360.
const ra = (lon) => +(((lon % 360) + 360) % 360).toFixed(3);
const dec = (lat) => +lat.toFixed(3);

const starList = stars.features
  .filter((f) => f.properties.mag <= FAINTEST)
  .map((f) => {
    const [lon, lat] = f.geometry.coordinates;
    const n = names[f.id]?.name;
    const row = [ra(lon), dec(lat), +f.properties.mag.toFixed(2)];
    if (n && f.properties.mag <= NAME_MAG) row.push(n);
    return row;
  })
  .sort((a, b) => a[2] - b[2]);

const lineList = lines.features.flatMap((f) =>
  f.geometry.coordinates.map((seg) => seg.map(([lon, lat]) => [ra(lon), dec(lat)])));

const labels = consts.features.map((f) => {
  const [lon, lat] = f.geometry.coordinates;
  return [ra(lon), dec(lat), f.properties.name, Number(f.properties.rank)];
});

const sky = {
  source: 'd3-celestial (BSD-3-Clause), J2000',
  stars: starList,      // [raDeg, decDeg, mag, name?]
  lines: lineList,      // [[raDeg, decDeg], ...] polylines
  constellations: labels, // [raDeg, decDeg, name, rank]
};
writeFileSync(new URL('../data/sky.json', import.meta.url), JSON.stringify(sky));
console.log(`Wrote ${starList.length} stars, ${lineList.length} line segments, ${labels.length} constellations`);
