// App Store product page header (2026-10-19, Sevaan): the new wide banner at the top of the App Store page.
// Step 1 captures the pieces from the real app (a wide night sky locked on the ISS, and three cards from the
// collection viewer); step 2 lays them out with the wordmark. Outputs store/appstore/header/header-5244x2950.png and
// header-3840x1646.png. Re-run after the sky, the cards or the words change.
// Usage: node scripts/store/header.mjs        (needs the app on :8765, Node 22, Playwright)
import { webkit, chromium } from 'playwright';
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, DEVICES, setup, hideNoise, aimBest } from './common.mjs';

const OUT = join(ROOT, 'store/appstore/header'), RAW = join(ROOT, 'store/raw'); mkdirSync(OUT, { recursive: true }); mkdirSync(RAW, { recursive: true });
// The words. Eyebrow = fact, headline = feeling (the store screenshots' rule).
const WORDS = { eyebrow: 'Real satellites · right now', headline: 'Collect the night sky', line: 'Point your phone up. Every light that moves is a card.' };
// The three cards in the fan, left to right; the middle one sits in front.
const CARDS = [['hubble', /hubble/i], ['iss', /space station/i], ['saturn', /saturn/i]];

DEVICES.wide = { viewport: { width: 1311, height: 738 }, deviceScaleFactor: 4, isMobile: false, hasTouch: false, userAgent: undefined, safeTop: 0, safeBottom: 0 };

// 1a · the sky: wide, locked on the ISS (not yet collected, so the circle is orange), nothing but the canvas.
{
  const b = await webkit.launch();
  const { p } = await setup(b, 'wide', { heroIss: true });
  await hideNoise(p);
  console.log('sky aim:', await aimBest(p));
  await p.evaluate(() => { window.__store.state.showShadow = false; }); // no "Earth's shadow" label in the banner
  await p.addStyleTag({ content: 'body > *:not(#sky) { visibility: hidden !important; }' });
  await p.waitForTimeout(1500);
  await p.locator('#sky').screenshot({ path: join(RAW, 'header-sky.png') });
  await b.close();
}
// 1b · the cards, from the collection viewer (the usual seed: shiny ISS, Hubble, Saturn).
{
  const b = await webkit.launch();
  const { p } = await setup(b, 'pad');
  await p.click('#nav-collection'); await p.waitForTimeout(3500);
  const f = p.frameLocator('#collection-frame');
  for (const [name, re] of CARDS) {
    await f.locator('.card-tile', { hasText: re }).first().click(); await p.waitForTimeout(2800);
    await f.locator('#slot .card').first().screenshot({ path: join(RAW, `header-card-${name}.png`) });
    await f.locator('#viewer').evaluate((v) => v.open && v.close()).catch(() => {}); await p.waitForTimeout(700);
  }
  await b.close();
}

// 2 · lay it out.
const data = (f, type = 'image/png') => `data:${type};base64,${readFileSync(f).toString('base64')}`;
const font = (f) => data(join(ROOT, 'fonts', f), 'font/ttf');
function page(W, H) {
  // Three zones left to right: the words (to 41%), the target circle locked on the ISS (the sky's centre, 50%), the card
  // fan (from 56%). Cards are sized from the free width so nothing ever covers the circle or runs off the edge.
  const u = H / 1000, R = 1208 / 1812;                       // R = a card's width / height
  // 2026-10-31 (Sevaan): the right card's edge ran off the banner. The circle and the fan move left by S, and the fan is
  // sized so the tilted right card (its corner reaches ~2.23 card widths past the fan's start) ends inside 97.5%.
  const S = W * 0.035, x0 = W * 0.56 - S;
  const free = W * 0.975 - x0, w = Math.min(free / 2.3, 0.53 * H * R), ch = w / R, cx = x0 + 1.07 * w;
  const card = (n, x, rot, h, z, dy = 0) => `<img class="card" src="${data(join(RAW, `header-card-${n}.png`))}" style="left:${x - (h * R) / 2}px;top:${H / 2 - h / 2 + dy}px;height:${h}px;transform:rotate(${rot}deg);z-index:${z}">`;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: D; src: url('${font('RussoOne-Regular.ttf')}'); }
@font-face { font-family: L; src: url('${font('BarlowCondensed-Medium.ttf')}'); }
html, body { margin: 0; width: ${W}px; height: ${H}px; overflow: hidden; background: #060b15; }
.sky { position: absolute; inset: 0 0 0 ${-2 * S}px; background: url('${data(join(RAW, 'header-sky.png'))}') center / cover; filter: brightness(1.15); }
.shade { position: absolute; inset: 0; background: linear-gradient(90deg, rgba(6,11,21,.82) 0%, rgba(6,11,21,.6) 30%, rgba(6,11,21,0) 43%, rgba(6,11,21,0) 58%, rgba(6,11,21,.35) 80%, rgba(6,11,21,.5) 100%); }
.words { position: absolute; left: ${W * 0.05}px; top: 50%; transform: translateY(-50%); width: ${W * 0.36}px; color: #fff2b3; }
.eb { font: 500 ${30 * u}px/1 L; letter-spacing: .26em; text-transform: uppercase; color: #fa8127; white-space: nowrap; }
.mark { margin-top: ${30 * u}px; font: 400 ${44 * u}px/1 D; letter-spacing: .02em; opacity: .9; white-space: nowrap; }
.hl { margin-top: ${16 * u}px; font: 400 ${Math.min(112 * u, W * 0.36 / 6.6)}px/1.02 D; letter-spacing: -.01em; text-wrap: balance; }
.ln { margin-top: ${34 * u}px; font: 500 ${40 * u}px/1.3 L; letter-spacing: .03em; color: #c9d3de; }
.card { position: absolute; border-radius: ${18 * u}px; box-shadow: 0 ${26 * u}px ${80 * u}px rgba(0,0,0,.65), 0 0 ${50 * u}px rgba(250,129,39,.12); }
</style></head><body><div class="sky"></div><div class="shade"></div>
<div class="words"><div class="eb">${WORDS.eyebrow}</div><div class="mark">SPACE COLLECTOR</div><div class="hl">${WORDS.headline}</div><div class="ln">${WORDS.line}</div></div>
${card('hubble', cx - 0.62 * w, -8, ch * 0.9, 1, 0.03 * H)}
${card('saturn', cx + 0.62 * w, 8, ch * 0.9, 1, 0.03 * H)}
${card('iss', cx, 0, ch, 2)}
</body></html>`;
}
const b = await chromium.launch();
for (const [W, H] of [[5244, 2950], [3840, 1646], [1024, 500]]) { // 1024 × 500: the Google Play feature graphic (2026-10-27)
  const pg = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  await pg.setContent(page(W, H), { waitUntil: 'load' }); await pg.evaluate(() => document.fonts.ready);
  await pg.screenshot({ path: join(OUT, `header-${W}x${H}.png`) }); console.log('header', W, H);
  await pg.close();
}
await b.close();
