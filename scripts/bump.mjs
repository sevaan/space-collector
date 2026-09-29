// Bump the patch version in js/version.js and version.json. Run before every commit:
//   node scripts/bump.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const jsPath = new URL('../js/version.js', import.meta.url);
const jsonPath = new URL('../version.json', import.meta.url);
const js = readFileSync(jsPath, 'utf8');
const current = js.match(/VERSION = '(\d+)\.(\d+)\.(\d+)'/);
const next = `${current[1]}.${current[2]}.${Number(current[3]) + 1}`;
writeFileSync(jsPath, js.replace(/VERSION = '[^']+'/, `VERSION = '${next}'`));
writeFileSync(jsonPath, JSON.stringify({ version: next }) + '\n');
console.log(`v${next}`);
