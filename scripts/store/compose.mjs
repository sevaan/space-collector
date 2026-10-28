// App Store captures, step 2 of 3: the captioned screenshots. Takes store/raw/<device>-<n>-<scene>.png (from
// capture.mjs), sets each under a short caption on the night-sky background, adds an iOS status bar, and writes
// store/appstore/<device>/<n>-<scene>.png at the exact App Store size. Edit CAPTIONS to change the words.
// Usage: node scripts/store/compose.mjs [phone|pad|duo|all]
// duo (2026-10-22): the iPhone Duo's inner display on its side, 2853 × 2007: the caption in a band across the top, the
// screen below with the Duo's status bar drawn in its 84pt strip down the right-hand edge.
import { chromium } from 'playwright';
import { readdirSync, mkdirSync, readFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './common.mjs';

// Marketing pass (2026-10-19, Sevaan's "room full of marketers"): screenshot 1 states the whole idea, the shiny ISS
// moves up to 3 (collectors buy rarity), every eyebrow is a fact and every headline a feeling; "Free · no ads" closes.
// ORDER sets the App Store order (file numbers); CAPTIONS sets the words. Change either and re-run this script.
export const ORDER = ['sky', 'reveal', 'collection', 'card', 'tonight', 'story', 'day', 'every', 'patches', 'moon']; // 2026-10-26 review room: the grid moves up to 3 (search shows 3), two new shots (by day, every night), All around you cut, the Moon an optional 10th
export const CAPTIONS = {
  sky: ['Point your phone at the sky', 'Every light up there has a name'],
  reveal: ['Line it up · tap Collect', 'Catch it. Keep its card.'],
  card: ['Tap as it slips into Earth’s shadow', 'Catch the fade, get a shiny'], // the shiny Hubble ("Caught the fade" on its tag)
  tonight: ['Tonight, timed to the minute', 'Know when to look up'],
  story: ['Hidden in the sky', 'Some lights hide a secret'], // Pale Blue Dot, found at Voyager 1's spot
  collection: ['Stations · rockets · planets · stars', '4,000+ real cards to find'],
  moon: ['One Moon, eight phases', 'Collect every phase'],
  patches: ['Free · no ads · no loot boxes', '180+ patches to earn'],
  day: ['Catch the Sun and Moon by day', 'Plan tonight’s catches'],
  every: ['30 missions · 12 themed weeks', 'Something new every night'],
};
const SIZE = { phone: [1206, 2622], pad: [2064, 2752], duo: [2853, 2007], android: [1080, 2160] };
const which = process.argv.slice(2).find((a) => !a.startsWith('--')) ?? 'all', US = process.argv.includes('--us'), RAW = join(ROOT, US ? 'store/raw-us' : 'store/raw'); // --us: the US set (miles), into store/appstore/<device>-us
const data = (f, type) => `data:${type};base64,${readFileSync(f).toString('base64')}`; // inline: a page from setContent can't load file:// URLs
const font = (f) => data(join(ROOT, 'fonts', f), 'font/ttf');

const ICONS = `<svg viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx=".7" fill="#fff"/><rect x="5" y="5.5" width="3" height="6.5" rx=".7" fill="#fff"/><rect x="10" y="3" width="3" height="9" rx=".7" fill="#fff"/><rect x="15" y="0" width="3" height="12" rx=".7" fill="#fff"/></svg>
    <svg viewBox="0 0 16 12"><path d="M8 11.5 5.6 8.9a3.4 3.4 0 0 1 4.8 0zM3.4 6.7a6.5 6.5 0 0 1 9.2 0l-1.3 1.3a4.6 4.6 0 0 0-6.6 0zM1 4.3a9.9 9.9 0 0 1 14 0l-1.3 1.3a8 8 0 0 0-11.4 0z" fill="#fff"/></svg>
    <svg viewBox="0 0 27 13"><rect x=".5" y=".5" width="23" height="12" rx="3.5" fill="none" stroke="#fff" stroke-opacity=".45"/><rect x="2" y="2" width="20" height="9" rx="2" fill="#fff"/><rect x="25" y="4.5" width="1.6" height="4" rx=".8" fill="#fff" fill-opacity=".45"/></svg>`;
const STARS = (W, H) => Array.from({ length: 110 }, (_, i) => { const x = (i * 9301 + 49297) % 233280 / 233280, y = (i * 7919 + 1543) % 104729 / 104729, r = i % 11 === 0 ? 3 : 1.6; return `<i style="left:${(x * W).toFixed(0)}px;top:${(y * H * 0.7).toFixed(0)}px;width:${r}px;height:${r}px;opacity:${(0.25 + (i % 5) * 0.12).toFixed(2)}"></i>`; }).join('');
// The iPhone Duo on its side: a wide canvas, so the caption runs across the top and the screen sits under it, centred.
// The Duo's status bar is a strip down the trailing edge (84pt of the 951pt screen): the time, then the icons, stacked.
function duoPage(img, [eyebrow, line]) {
  const [W, H] = SIZE.duo, shotW = 2150, shotH = Math.round(shotW * 669 / 951), top = 430, scale = shotW / 2853, strip = 84 * 3 * scale;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: D; src: url('${font('RussoOne-Regular.ttf')}'); }
@font-face { font-family: L; src: url('${font('BarlowCondensed-Medium.ttf')}'); }
html, body { margin: 0; width: ${W}px; height: ${H}px; overflow: hidden; }
body { background: radial-gradient(70% 60% at 50% 0%, #17304d 0%, #0b1628 45%, #060b15 100%); color: #fff2b3; font-family: L; position: relative; }
.stars i { position: absolute; border-radius: 50%; background: #fff2b3; }
.cap { position: absolute; left: 200px; right: 200px; top: 120px; text-align: center; }
.eb { font: 500 44px/1 L; letter-spacing: .26em; text-transform: uppercase; color: #fa8127; }
.hl { margin-top: 30px; font: 400 104px/1.04 D; letter-spacing: -.01em; white-space: nowrap; }
.dev { position: absolute; left: ${(W - shotW) / 2}px; top: ${top}px; width: ${shotW}px; height: ${shotH}px; border-radius: 70px; overflow: hidden;
  box-shadow: 0 0 0 11px #1b2738, 0 0 0 13px #34465a, 0 40px 120px rgba(0,0,0,.6), 0 0 180px rgba(250,129,39,.12); }
.dev img { width: 100%; height: 100%; display: block; }
.sbar { position: absolute; top: 0; bottom: 0; right: 0; width: ${strip}px; display: flex; flex-direction: column; align-items: center; justify-content: space-between; padding: 34px 0 40px; box-sizing: border-box; font: 600 34px/1 -apple-system, 'SF Pro Text', system-ui, sans-serif; color: #fff; }
.sbar .ic { display: flex; flex-direction: column; align-items: center; gap: 16px; }
.sbar svg { height: 22px; }
</style></head><body>
<div class="stars">${STARS(W, H)}</div>
<div class="cap"><div class="eb">${eyebrow}</div><div class="hl">${line}</div></div>
<div class="dev"><img src="${data(img, 'image/png')}">
  <div class="sbar"><span>9:41</span><span class="ic">${ICONS}</span></div>
</div></body></html>`;
}

function page(kind, img, caption) {
  if (kind === 'duo') return duoPage(img, caption);
  const [eyebrow, line] = caption;
  const [W, H] = SIZE[kind], pad = kind === 'pad';
  const andr = kind === 'android'; // Google Play: the phone layout at 1080 wide, a status bar of 24pt and no island
  const shotW = pad ? 1660 : andr ? 896 : 1000, top = pad ? 600 : andr ? 520 : 590, radius = pad ? 64 : andr ? 70 : 84, sb = pad ? 48 : andr ? 72 : 162; // status bar height in the shot
  const scale = shotW / W;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: D; src: url('${font('RussoOne-Regular.ttf')}'); }
@font-face { font-family: L; src: url('${font('BarlowCondensed-Medium.ttf')}'); }
html, body { margin: 0; width: ${W}px; height: ${H}px; overflow: hidden; }
body { background: radial-gradient(90% 55% at 50% 0%, #17304d 0%, #0b1628 45%, #060b15 100%); color: #fff2b3; font-family: L; position: relative; }
.stars i { position: absolute; border-radius: 50%; background: #fff2b3; }
.cap { position: absolute; left: ${pad ? 160 : 80}px; right: ${pad ? 160 : 80}px; top: ${pad ? 190 : 170}px; text-align: center; }
.eb { font: 500 ${pad ? 46 : 40}px/1 L; letter-spacing: .26em; text-transform: uppercase; color: #fa8127; }
.hl { margin-top: ${pad ? 34 : 30}px; font: 400 ${pad ? 104 : 86}px/1.04 D; letter-spacing: -.01em; text-wrap: balance; }
.dev { position: absolute; left: ${(W - shotW) / 2}px; top: ${top}px; width: ${shotW}px; height: ${Math.round(H * scale)}px; border-radius: ${radius}px; overflow: hidden;
  box-shadow: 0 0 0 ${pad ? 10 : 9}px #1b2738, 0 0 0 ${pad ? 12 : 11}px #34465a, 0 40px 120px rgba(0,0,0,.6), 0 0 160px rgba(250,129,39,.12); }
.dev img { width: 100%; height: 100%; display: block; }
.sbar { position: absolute; left: 0; right: 0; top: 0; height: ${sb * scale}px; display: flex; align-items: center; justify-content: space-between; padding: 0 ${pad ? 40 : 74}px; box-sizing: border-box; font: 600 ${pad ? 30 : 46}px/1 -apple-system, 'SF Pro Text', system-ui, sans-serif; color: #fff; }
.sbar svg { height: ${pad ? 22 : 34}px; margin-left: ${pad ? 10 : 14}px; }
.island { position: absolute; left: 50%; top: ${pad ? 0 : 33 * scale}px; width: ${pad || andr ? 0 : 372 * scale}px; height: ${pad ? 0 : 110 * scale}px; transform: translateX(-50%); border-radius: 99px; background: #000; }
</style></head><body>
<div class="stars">${Array.from({ length: 90 }, (_, i) => { const x = (i * 9301 + 49297) % 233280 / 233280, y = (i * 7919 + 1543) % 104729 / 104729, r = i % 11 === 0 ? 3 : 1.6; return `<i style="left:${(x * W).toFixed(0)}px;top:${(y * H * 0.7).toFixed(0)}px;width:${r}px;height:${r}px;opacity:${(0.25 + (i % 5) * 0.12).toFixed(2)}"></i>`; }).join('')}</div>
<div class="cap"><div class="eb">${eyebrow}</div><div class="hl">${line}</div></div>
<div class="dev"><img src="${data(img, 'image/png')}">
  <div class="island"></div>
  <div class="sbar"><span>9:41</span><span style="display:flex;align-items:center">
    <svg viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx=".7" fill="#fff"/><rect x="5" y="5.5" width="3" height="6.5" rx=".7" fill="#fff"/><rect x="10" y="3" width="3" height="9" rx=".7" fill="#fff"/><rect x="15" y="0" width="3" height="12" rx=".7" fill="#fff"/></svg>
    <svg viewBox="0 0 16 12"><path d="M8 11.5 5.6 8.9a3.4 3.4 0 0 1 4.8 0zM3.4 6.7a6.5 6.5 0 0 1 9.2 0l-1.3 1.3a4.6 4.6 0 0 0-6.6 0zM1 4.3a9.9 9.9 0 0 1 14 0l-1.3 1.3a8 8 0 0 0-11.4 0z" fill="#fff"/></svg>
    <svg viewBox="0 0 27 13"><rect x=".5" y=".5" width="23" height="12" rx="3.5" fill="none" stroke="#fff" stroke-opacity=".45"/><rect x="2" y="2" width="20" height="9" rx="2" fill="#fff"/><rect x="25" y="4.5" width="1.6" height="4" rx=".8" fill="#fff" fill-opacity=".45"/></svg>
  </span></div>
</div></body></html>`;
}

const b = await chromium.launch();
for (const kind of which === 'all' ? Object.keys(SIZE) : [which]) {
  const out = join(ROOT, 'store/appstore', US ? `${kind}-us` : kind); mkdirSync(out, { recursive: true }); for (const f of readdirSync(out)) if (/^\d+-\w+\.png$/.test(f)) unlinkSync(join(out, f)); // a fresh set each time
  const shots = readdirSync(RAW).filter((f) => f.startsWith(kind + '-') && f.endsWith('.png')).sort();
  const pg = await b.newPage({ viewport: { width: SIZE[kind][0], height: SIZE[kind][1] }, deviceScaleFactor: 1 });
  for (const f of shots) {
    const scene = f.replace(/^\w+-(\d-)?/, '').replace('.png', ''), n = ORDER.indexOf(scene) + 1;
    if (!n) { console.log(kind, 'skipping', f, '(not in ORDER)'); continue; }
    await pg.setContent(page(kind, join(RAW, f), CAPTIONS[scene] ?? ['', scene]), { waitUntil: 'load' }); await pg.evaluate(() => document.fonts.ready);
    await pg.screenshot({ path: join(out, `${n}-${scene}.png`) }); console.log(kind, n, scene);
  }
  await pg.close();
}
await b.close();
