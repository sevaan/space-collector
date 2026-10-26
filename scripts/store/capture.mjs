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
// 2026-10-26 store set (review room + Sevaan): two locales (--locale=en-US → miles, US spelling, into store/raw-us; else
// en-CA → km, into store/raw), and a second evening (--later, default 2026-11-02) for the shots that need the new
// features: the daytime home, Tonight from the top (headliner and countdown), and "every night" (the week, missions).
const locale = args.find((a) => a.startsWith('--locale='))?.slice(9) ?? 'en-CA', us = locale === 'en-US';
const later = args.find((a) => a.startsWith('--later='))?.slice(8) ?? '2026-11-02T19:30:00-05:00';
const OUT = join(ROOT, us ? 'store/raw-us' : 'store/raw'); mkdirSync(OUT, { recursive: true });

for (const kind of which === 'all' ? Object.keys(DEVICES) : [which]) {
  const b = await webkit.launch();
  // The later evening: by day (14:30), then Tonight at the top and the week + missions further down.
  { const day = new Date(Date.parse(later) - 5 * 3600e3), n2 = new Date(later);
    const { p, ctx, errs } = await setup(b, kind, { when: day.toISOString(), heroIss: true, clear: true, extra: storeExtras(n2), storage: storeStorage(n2), locale });
    const w = (ms) => p.waitForTimeout(ms), shot = (n) => p.screenshot({ path: join(OUT, `${kind}-${n}.png`) });
    await p.addStyleTag({ content: '#toasts, .patch-coins, .pc-badge, .radar-tip, #tk, #discover, #help-card, #sky-match { display: none !important; } #sky-plus-line { display: none !important; }' });
    for (let i = 0; i < 30 && !(await p.evaluate(() => !!window.__store.state.tonight)); i++) await w(1000);
    // Look toward tonight's headliner's rise point, a little above it, so its marker and the "Right now you can catch" chips show.
    // The sky draws tonight's pass markers (dashed rings, "NAME · 7:54 PM"); look just beside the first one, so it and its
    // neighbours sit in view around the empty circle.
    await p.evaluate(() => { const sk = window.__store.sky, f = sk.drawGhosts.bind(sk); sk.drawGhosts = (g) => { window.__gh = g; return f(g); }; window.__store.state.drag.on = true; });
    await w(2500);
    const aim = await p.evaluate(() => { const st = window.__store.state, g = (window.__gh ?? []).filter((x) => x.enu?.[2] > 0.1)[0]; if (!g) return null;
      const [e, n, u] = g.enu; st.drag.az = (Math.atan2(e, n) * 180 / Math.PI + 360 + 16) % 360; st.drag.el = Math.asin(u) * 180 / Math.PI - 9; return g.name; });
    await w(3000); await shot('day'); console.log(kind, 'day aim:', aim);
    await p.clock.fastForward(Math.round(n2 - day)); await w(4000);
    await p.click('#nav-sky'); await w(5000); await p.evaluate(() => { document.getElementById('visible').scrollTop = 0; }); await w(900); await shot('tonight');
    await p.evaluate(() => {
      /* Scroll whichever box actually scrolls (the page on phones, a book page on iPad/Duo). If the week box is
         already near the top (book layouts), go on to the missions so the shot isn't the Tonight shot again. */
      const scroller = (el) => { for (let n = el.parentElement; n; n = n.parentElement) { const o = getComputedStyle(n).overflowY; if ((o === 'auto' || o === 'scroll') && n.scrollHeight > n.clientHeight) return n; } return document.getElementById('visible'); };
      const v = document.getElementById('visible'), wk = v.querySelector('.week-box'), ms = document.getElementById('sj-missions');
      let el = wk ?? ms; if (!el) return;
      let sc = scroller(el); if (wk && ms && wk.getBoundingClientRect().top - sc.getBoundingClientRect().top < sc.clientHeight * 0.4) { el = ms; sc = scroller(ms); }
      sc.scrollTop += el.getBoundingClientRect().top - sc.getBoundingClientRect().top - 70;
    }); await w(900); await shot('every');
    console.log(kind, 'later session', errs.length ? errs : 'no page errors'); await ctx.close(); }
  const night = captureNight(when);
  const { p, errs } = await setup(b, kind, { when, heroIss: true, clear: true, extra: storeExtras(night), storage: storeStorage(night), locale });
  const w = (ms) => p.waitForTimeout(ms), shot = (n) => p.screenshot({ path: join(OUT, `${kind}-${n}.png`) });
  const duo = kind === 'duo';
  // Tonight first, while it's still the evening (the hero shot moves the clock on to the ISS pass).
  await hideNoise(p); await p.addStyleTag({ content: '#sky-plus-line { display: none !important; }' }); // no Plus banner in a store shot
  // A secret: Voyager 1's spot held in the circle (20:24 that evening) → the Pale Blue Dot story card, turned over
  await p.clock.fastForward(Math.max(0, Date.parse('2026-10-17T20:24:00-04:00') - await p.evaluate(() => Date.now()))); await w(800);
  for (let i = 0; i < 40 && !(await p.evaluate(() => !document.getElementById('reveal').hidden)); i++) {
    await p.evaluate(() => { const s = window.__store.state, q = window.__store.skyAt(258.2, 12.1); s.drag.on = true; s.pinnedId = null; s.drag.az = q.az; s.drag.el = q.el; }); await w(250); }
  await w(1000); await p.locator('#rv-holder').click({ timeout: 2000 }).catch(() => {}); await w(2600); await shot('story');
  await p.locator('#reveal .x-close').first().click().catch(() => {}); await w(1500);
  // The sky, locked on the ISS, then Collect → the catch card
  console.log(kind, 'aim:', await aimBest(p)); await w(900); await shot('sky');
  await p.click('#d-cta').catch((e) => console.log(kind, 'no Collect:', e.message.slice(0, 80))); await w(3300); await shot('reveal');
  await p.locator('#reveal .x-close').first().click().catch(() => {}); await w(1500);
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
  if (duo) { // the Duo: the grid with Saturn open beside it (an empty dock read as 'tap a card')
    await f.locator('.card-tile', { hasText: /saturn/i }).first().click().catch(() => {}); await w(2600);
    await f.locator('#v-up, #v-next').evaluateAll((els) => els.forEach((e) => { e.hidden = true; })).catch(() => {}); await shot('collection');
    await f.locator('#viewer').evaluate((v) => v.open && v.close()).catch(() => {}); await w(800); }
  await toGrid('#grid'); await w(600);
  await card(/^\s*moon|moon\b/i, 'moon');
  // Patches, the wall scrolled up under the tabs
  await f.locator('#tab-patches').click().catch(() => {}); await w(2200);
  await toGrid('#patch-wall'); await w(900); await shot('patches');
  console.log(kind, errs.length ? errs : 'no page errors');
  await b.close();
}
