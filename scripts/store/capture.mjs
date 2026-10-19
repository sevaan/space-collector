// App Store captures, step 1 of 3 (2026-10-18, Sevaan: "remember how to do the screenshots… regenerate them again no
// problem"). Runs the real app (served at localhost:8765) in WebKit at the exact App Store pixel size, with a seeded
// collection and the iPhone's safe areas, and saves six raw scenes to store/raw/<device>-<scene>.png (compose.mjs ORDER numbers them).
// Then scripts/store/compose.mjs adds the captions and scripts/store/preview.mjs records the App Preview videos.
// Usage: node scripts/store/capture.mjs [phone|pad|all] [--when=2026-10-19T20:30:00-04:00]
// Needs: python3 -m http.server 8765 running in the project folder; Node 22; `npm i` (Playwright is a devDependency).
import { webkit } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, DEVICES, setup, aimBest, hideNoise } from './common.mjs';

const args = process.argv.slice(2), which = args.find((a) => !a.startsWith('--')) ?? 'all';
const when = args.find((a) => a.startsWith('--when='))?.slice(7);
const OUT = join(ROOT, 'store/raw'); mkdirSync(OUT, { recursive: true });

for (const kind of which === 'all' ? Object.keys(DEVICES) : [which]) {
  const b = await webkit.launch();
  const { p, errs } = await setup(b, kind, { when, heroIss: true });
  const w = (ms) => p.waitForTimeout(ms), shot = (n) => p.screenshot({ path: join(OUT, `${kind}-${n}.png`) });
  // 1 · Tonight: the daily TONIGHT notice opens the plan for the night
  const see = p.locator('#toasts .ticket[data-eyebrow="TONIGHT"], #toast-tray .ticket[data-eyebrow="TONIGHT"]').first();
  if (await see.count()) { await see.click(); await w(1500); if (await p.locator('#ob-done').isHidden()) { await see.click().catch(() => {}); await w(2000); } /* a tucked chip first unfolds, the second tap opens the plan */ await shot('tonight'); await p.click('#od-close', { force: true, timeout: 3000 }).catch(() => p.keyboard.press('Escape')); await w(900); }
  else console.log(kind, 'no TONIGHT notice (already seen today?)');
  await hideNoise(p);
  // 2 · the sky, locked on the best new thing up
  console.log(kind, 'aim:', await aimBest(p)); await w(900); await shot('sky');
  // 3 · Collect → the reveal
  await p.click('#d-cta').catch((e) => console.log(kind, 'no Collect:', e.message.slice(0, 80))); await w(3300); await shot('reveal');
  await p.locator('#reveal .x-close').first().click().catch(() => {}); await w(1500);
  // 4 · the Collection
  await p.click('#nav-collection'); await w(3500); await shot('collection');
  const f = p.frameLocator('#collection-frame');
  // 5 · the shiny ISS card
  await f.locator('.card-tile', { hasText: /hubble/i }).first().click().catch((e) => console.log(kind, 'Hubble tile:', e.message.slice(0, 80))); await w(2600); await f.locator('#v-up, #v-next').evaluateAll((els) => els.forEach((e) => { e.hidden = true; })).catch(() => {}); /* no 'not visible from here' line under the showcase card */ await shot('card');
  await f.locator('#viewer').evaluate((v) => v.open && v.close()).catch(() => {}); await w(800);
  // 6 · patches
  await f.locator('#tab-patches').click().catch(() => {}); await w(2200); await shot('patches');
  console.log(kind, errs.length ? errs : 'no page errors');
  await b.close();
}
