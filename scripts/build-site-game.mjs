// The website's playable sky (2026-10-18, Sevaan: "Don't we have the actual game's code already web-ready? Duplicate it,
// chop out everything we don't need"). Copies the app's real sky renderer, orbit model, star chart and their imports
// (followed automatically) into site/public/play/js, plus a trimmed catalogue (only what a suburban eye can see) and
// the data, fonts and Milky Way photo they load. site/public/play/play.js is the small driver that replaces main.js.
// Re-run after changing the app's sky code or to refresh the orbits. Usage: node scripts/build-site-game.mjs
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, rmSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..'), OUT = join(ROOT, 'site/public/play');
const ENTRIES = ['sky.js', 'orbit.js', 'celestial.js', 'natural.js', 'sky-limit.js', 'lore.js', 'tz-places.js', 'rarity.js'];
const MAG = 4.5; // satellites brighter than this at standard distance (~2,300 of 16,700); stations and named icons always

rmSync(join(OUT, 'js'), { recursive: true, force: true });
const seen = new Set(), queue = ENTRIES.map((f) => join(ROOT, 'js', f));
while (queue.length) {
  const file = queue.pop(); if (seen.has(file)) continue; seen.add(file);
  const src = readFileSync(file, 'utf8'), dest = join(OUT, 'js', relative(join(ROOT, 'js'), file));
  mkdirSync(dirname(dest), { recursive: true }); writeFileSync(dest, src.replace(/(\.js)\?v=[0-9.]+/g, '$1')); // unstamped, so the pages' own imports share one copy of each module
  for (const m of src.matchAll(/^\s*import\s[^'"]*['"](\.{1,2}\/[^'"?]+)/gm)) queue.push(join(dirname(file), m[1]));
}
console.log('modules', [...seen].map((f) => relative(join(ROOT, 'js'), f)).sort().join(' '));

const cat = JSON.parse(readFileSync(join(ROOT, 'data/catalog.json'), 'utf8')), fams = cat.families ?? {};
const keep = cat.objects.filter((o) => { const m = o.stdMag ?? fams[o.family]?.stdMag; return o.icon || o.type === 'station' || (m != null && m <= MAG); });
const usedFams = Object.fromEntries(Object.entries(fams).filter(([k]) => keep.some((o) => o.family === k)));
mkdirSync(join(OUT, 'data'), { recursive: true });
writeFileSync(join(OUT, 'data/catalog.json'), JSON.stringify({ ...cat, families: usedFams, objects: keep }));
console.log('catalogue', keep.length, 'of', cat.objects.length);
// The homepage's background sky (site/public/home/home.js) wants a busier sky: every single satellite, stage and piece of
// debris brighter than 7 (no mega-constellation members), seen as from a dark site.
const home = cat.objects.filter((o) => o.icon || o.type === 'station' || (!o.family && o.stdMag != null && o.stdMag <= 7));
writeFileSync(join(OUT, 'data/catalog-home.json'), JSON.stringify({ ...cat, families: {}, objects: home }));
console.log('home catalogue', home.length);
for (const f of ['sky.json', 'lore.json']) copyFileSync(join(ROOT, 'data', f), join(OUT, 'data', f));
for (const f of ['series.json', 'purpose.json', 'debris.json', 'facts.json']) writeFileSync(join(OUT, 'data', f), '{}'); // lore.js asks; titles only need lore.json
mkdirSync(join(OUT, 'assets/sky'), { recursive: true }); copyFileSync(join(ROOT, 'assets/sky/milkyway.webp'), join(OUT, 'assets/sky/milkyway.webp'));
mkdirSync(join(OUT, 'fonts'), { recursive: true });
for (const f of ['RussoOne-Regular.ttf', 'BarlowCondensed-Medium.ttf']) copyFileSync(join(ROOT, 'fonts', f), join(OUT, 'fonts', f));
