// Copies the web app (repo root) into native/www for Capacitor. The web app itself has no build step; this is the
// only "build" and it's a plain copy. Leaves out design boards, scripts, tests, the relay and this folder.
import { cpSync, rmSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url)), root = join(here, '..'), out = join(here, 'www');
const KEEP = ['index.html', 'cards.html', 'manifest.webmanifest', 'version.json', 'sw.js', 'css', 'js', 'fonts', 'assets', 'data', 'icons'];
rmSync(out, { recursive: true, force: true }); mkdirSync(out);
for (const f of KEEP) cpSync(join(root, f), join(out, f), { recursive: true, filter: (p) => !p.endsWith('.DS_Store') });
console.log(`Copied ${KEEP.length} items to native/www`);
