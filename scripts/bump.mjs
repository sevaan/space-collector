// Bump the patch version and stamp it onto every script/stylesheet reference, so phones never mix
// a new page with cached old modules. Run before every commit:
//   node scripts/bump.mjs
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const jsPath = new URL('js/version.js', root);
const js = readFileSync(jsPath, 'utf8');
const current = js.match(/VERSION = '(\d+)\.(\d+)\.(\d+)'/);
const next = `${current[1]}.${current[2]}.${Number(current[3]) + 1}`;
writeFileSync(jsPath, js.replace(/VERSION = '[^']+'/, `VERSION = '${next}'`));
writeFileSync(new URL('version.json', root), JSON.stringify({ version: next }) + '\n');

// import ... from './x.js'  →  './x.js?v=NEXT'
const stampImports = (s) => s.replace(/(from\s+'\.{1,2}\/[^'?]+\.js)(\?v=[^']*)?'/g, `$1?v=${next}'`);
for (const f of readdirSync(new URL('js/', root))) {
  if (!f.endsWith('.js')) continue;
  const p = new URL(`js/${f}`, root);
  const s = readFileSync(p, 'utf8');
  const out = stampImports(s);
  if (out !== s) writeFileSync(p, out);
}

// <script src="js/x.js"> and <link href="css/x.css">  →  ?v=NEXT
for (const f of readdirSync(root)) {
  if (!f.endsWith('.html')) continue;
  const p = new URL(f, root);
  const s = readFileSync(p, 'utf8');
  const out = s.replace(/((?:src|href)="(?:js|css)\/[^"?]+\.(?:js|css))(\?v=[^"]*)?"/g, `$1?v=${next}"`);
  if (out !== s) writeFileSync(p, out);
}

// sw.js: a cache per version, so each deploy's service worker starts clean (2026-10-10).
{ const p = new URL('sw.js', root), s = readFileSync(p, 'utf8'); writeFileSync(p, s.replace(/const CACHE = '[^']+';/, `const CACHE = 'sc-${next}';`)); }

console.log(`v${next}`);
