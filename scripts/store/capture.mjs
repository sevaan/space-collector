// App Store captures, step 1 of 3 (2026-10-18, Sevaan: "remember how to do the screenshots… regenerate them again no
// problem"). Runs the real app (served at localhost:8765) in WebKit at the exact App Store pixel size, with a seeded
// collection and the iPhone's safe areas, and saves eight raw scenes to store/raw/<device>-<scene>.png (compose.mjs ORDER numbers them).
// Then scripts/store/compose.mjs adds the captions and scripts/store/preview.mjs records the App Preview videos.
// Usage: node scripts/store/capture.mjs [phone|pad|duo|all] [--when=2026-10-19T20:30:00-04:00]
// The 2026-10-24 set (marketing review, Sevaan: 8 shots): sky → catch → Tonight → shiny Hubble → Collection grid →
// Moon phases → patches → All around you. duo (iPhone Duo, inner display on its side): the same scenes in its own layouts.
// Needs: python3 -m http.server 8765 running in the project folder; Node 22; `npm i` (Playwright is a devDependency).
import { webkit } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, DEVICES, setup, aimBest, hideNoise, storeExtras, storeStorage, captureNight } from './common.mjs';

const args = process.argv.slice(2), which = args.find((a) => !a.startsWith('--')) ?? 'all';
const when = args.find((a) => a.startsWith('--when='))?.slice(7);
const OUT = join(ROOT, 'store/raw'); mkdirSync(OUT, { recursive: true });

for (const kind of which === 'all' ? Object.keys(DEVICES) : [which]) {
  const b = await webkit.launch(), night = captureNight(when);
  const { p, errs } = await setup(b, kind, { when, heroIss: true, clear: true, extra: storeExtras(night), storage: storeStorage(night) });
  const w = (ms) => p.waitForTimeout(ms), shot = (n) => p.screenshot({ path: join(OUT, `${kind}-${n}.png`) });
  const duo = kind === 'duo';
  // Tonight first, while it's still the evening (the hero shot moves the clock on to the ISS pass).
  await hideNoise(p); await p.click('#nav-sky'); await w(4500); await shot('tonight'); await p.click('#nav-explore'); await w(1800);
  await hideNoise(p);
  // The sky, locked on the ISS, then Collect → the catch card
  console.log(kind, 'aim:', await aimBest(p)); await w(900); await shot('sky');
  await p.click('#d-cta').catch((e) => console.log(kind, 'no Collect:', e.message.slice(0, 80))); await w(3300); await shot('reveal');
  await p.locator('#reveal .x-close').first().click().catch(() => {}); await w(1500);
  // All around you (the radar): the horizon all the way round
  await p.click('#radar').catch(() => {}); await w(3200); await shot('around');
  await p.click('#nav-more').catch(() => {}); await w(1200);
  // The Collection, scrolled past the rank card so the grid fills the frame
  await p.click('#nav-collection'); await w(3500);
  const f = p.frameLocator('#collection-frame');
  const toGrid = (sel) => f.locator(sel).evaluate((el) => { const tabs = document.querySelector('.collection-tabs'), tools = document.querySelector('.collection-tools');
    const bar = tools && tools.offsetHeight ? tools : tabs, under = (parseFloat(getComputedStyle(bar).top) || 0) + bar.offsetHeight; /* where the bar sits once pinned */
    scrollTo(0, scrollY + el.getBoundingClientRect().top - under - 10); }).catch(() => {});
  await toGrid('#grid'); await w(1400); if (!duo) await shot('collection');
  // A card in the viewer, chrome hidden (no "2 / 27", no pass panel), tilted under a finger so the foil catches
  const card = async (re, name) => {
    await f.locator('.card-tile', { hasText: re }).first().click().catch((e) => console.log(kind, name, 'tile:', e.message.slice(0, 80))); await w(2600);
    await f.locator('#v-up, #v-next, #v-position').evaluateAll((els) => els.forEach((e) => { e.style.visibility = 'hidden'; if (e.id !== 'v-position') e.hidden = true; })).catch(() => {});
    const r = await f.locator('#slot .card').first().boundingBox().catch(() => null);
    if (r) { await p.mouse.move(r.x + r.width * 0.5, r.y + r.height * 0.5); await p.mouse.move(r.x + r.width * 0.2, r.y + r.height * 0.25, { steps: 12 }); }
    await w(900); await shot(name);
    await f.locator('#viewer').evaluate((v) => v.open && v.close()).catch(() => {}); await w(800);
  };
  await card(/hubble/i, 'card');
  if (duo) await shot('collection'); // the Duo: the grid with the card it last opened beside it
  await toGrid('#grid'); await w(600);
  await card(/^\s*moon|moon\b/i, 'moon');
  // Patches, the wall scrolled up under the tabs
  await f.locator('#tab-patches').click().catch(() => {}); await w(2200);
  await toGrid('#patch-wall'); await w(900); await shot('patches');
  console.log(kind, errs.length ? errs : 'no page errors');
  await b.close();
}
