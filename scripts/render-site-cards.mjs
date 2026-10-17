// Renders the real card image for every pass in site/public/tonight/*.json into site/public/cards/<key>.webp (600 px
// wide, transparent corners), using the app's own renderCard via design/card-render.html. Needs the local server on 8765
// and Playwright (scratchpad pw/node_modules). Usage: node scripts/render-site-cards.mjs
import { readFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..'), DIR = join(ROOT, 'site/public/tonight'), OUT = join(ROOT, 'site/public/cards');
const { chromium } = await import(process.env.PW ?? 'playwright');
mkdirSync(OUT, { recursive: true });
const keys = new Set();
for (const f of readdirSync(DIR)) { if (f === 'index.json') continue; const d = JSON.parse(readFileSync(join(DIR, f))); for (const p of [d.head, ...(d.more ?? []), d.shiny]) if (p) keys.add(p.key); }
const todo = [...keys].filter((k) => !existsSync(join(OUT, `${k}.webp`)));
console.log(keys.size, 'cards,', todo.length, 'to render');
const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2 })).newPage();
for (let i = 0; i < todo.length; i += 24) {
  await p.goto(`http://localhost:8765/design/card-render.html#${todo.slice(i, i + 24).join(',')}`); await p.reload();
  await p.waitForFunction(() => document.body.dataset.ready, null, { timeout: 60000 });
  for (const el of await p.$$('#stage > [data-key]')) {
    const k = await el.getAttribute('data-key'), png = join(OUT, `${k}.png`);
    await (await el.$('.card')).screenshot({ path: png, omitBackground: true, animations: 'disabled' });
    execFileSync('python3', ['-c', `from PIL import Image; im=Image.open('${png}').convert('RGBA'); im=im.resize((600, round(im.height*600/im.width)), Image.LANCZOS); im.save('${png.replace('.png', '.webp')}', quality=86, method=6); import os; os.remove('${png}')`]);
  }
}
await b.close();
