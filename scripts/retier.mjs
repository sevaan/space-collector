// Re-tiers data/catalog.json by difficulty (js/rarity.js retier) without re-fetching anything.
// Keeps each object's previous tier as `tier0` once, so existing players' XP can be carried over (js/progress.js xpCarry).
// Run: node scripts/retier.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { retier } from '../js/rarity.js';
const url = new URL('../data/catalog.json', import.meta.url), cat = JSON.parse(readFileSync(url, 'utf8'));
for (const o of cat.objects) if (!o.family && o.tier && o.tier0 == null) o.tier0 = o.tier;
const changed = retier(cat.objects);
for (const o of cat.objects) if (o.tier0 === o.tier) delete o.tier0;
writeFileSync(url, JSON.stringify(cat));
const tally = {}; for (const o of cat.objects) if (!o.family) tally[o.tier] = (tally[o.tier] ?? 0) + 1;
console.log(`re-tiered: ${changed} changed`, tally);
