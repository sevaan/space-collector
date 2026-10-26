// js/art-shared.js (2026-10-26, Sevaan: "where you are using the same photo for multiple cards, tint the colour
// differently each time so each card looks different"): the picture files that more than one card uses. card.js gives
// those a per-card tint. Rerun after changing which cards use which picture (art-keys.js, import-art.py).
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expandFacts } from '../js/catalog-facts.js';
import { buildCards } from '../js/card-model.js';
import { artFileFor } from '../js/art-keys.js';
import { ART_FILES } from '../js/art-files.js';
const R = fileURLToPath(new URL('..', import.meta.url));
const cat = JSON.parse(readFileSync(R + 'data/catalog.json', 'utf8')); for (const o of cat.objects) expandFacts(o);
const ser = JSON.parse(readFileSync(R + 'data/series.json', 'utf8')).members, n = {};
for (const c of buildCards(cat)) { if (c.natural) continue; const f = artFileFor(c, { [c.id]: ser[c.id] }); if (ART_FILES.has(f)) n[f] = (n[f] ?? 0) + 1; }
const shared = Object.keys(n).filter((f) => n[f] > 1).sort();
writeFileSync(R + 'js/art-shared.js', `// Written by scripts/build-art-shared.mjs: picture files used by more than one card (each card tints its copy).\nexport const ART_SHARED = new Set(${JSON.stringify(shared)});\n`);
console.log(shared.length, 'shared pictures');
