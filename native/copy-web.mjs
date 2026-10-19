// Copies the web app (repo root) into native/www for Capacitor. The web app itself has no build step; this is the
// only "build" and it's a plain copy. Leaves out design boards, scripts, tests, the relay and this folder.
import { cpSync, rmSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url)), root = join(here, '..'), out = join(here, 'www');
const KEEP = ['index.html', 'cards.html', 'manifest.webmanifest', 'version.json', 'sw.js', 'css', 'js', 'fonts', 'assets', 'data', 'icons'];
rmSync(out, { recursive: true, force: true }); mkdirSync(out);
for (const f of KEEP) cpSync(join(root, f), join(out, f), { recursive: true, filter: (p) => !p.endsWith('.DS_Store') });
// The tester app (native/build-tester.sh): js/build-flavor.js says TESTER = true in this copy only.
if (process.env.SC_TESTER === '1') { const f = join(out, 'js', 'build-flavor.js'); writeFileSync(f, readFileSync(f, 'utf8').replace('export const TESTER = false', 'export const TESTER = true')); console.log('Tester build: TESTER = true'); }
console.log(`Copied ${KEEP.length} items to native/www`);
