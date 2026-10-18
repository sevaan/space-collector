// App Store captures, step 2 of 3: the captioned screenshots. Takes store/raw/<device>-<n>-<scene>.png (from
// capture.mjs), sets each under a short caption on the night-sky background, adds an iOS status bar, and writes
// store/appstore/<device>/<n>-<scene>.png at the exact App Store size. Edit CAPTIONS to change the words.
// Usage: node scripts/store/compose.mjs [phone|pad|all]
import { chromium } from 'playwright';
import { readdirSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './common.mjs';

export const CAPTIONS = {
  sky: ['Point your phone up', 'Every light up there is a card.'],
  reveal: ['Line it up · tap Collect', 'Catch it, and it’s yours.'],
  tonight: ['Plan your night', 'Know what’s passing over you tonight.'],
  card: ['Shiny cards', 'Catch it at a lucky moment and it shimmers.'],
  collection: ['Build your collection', 'Space stations, rocket stages, planets and stars.'],
  patches: ['Missions and patches', 'Rank up from Stargazer to Mission Control.'],
};
const SIZE = { phone: [1206, 2622], pad: [2064, 2752] };
const which = process.argv[2] ?? 'all', RAW = join(ROOT, 'store/raw');
const data = (f, type) => `data:${type};base64,${readFileSync(f).toString('base64')}`; // inline: a page from setContent can't load file:// URLs
const font = (f) => data(join(ROOT, 'fonts', f), 'font/ttf');

function page(kind, img, [eyebrow, line]) {
  const [W, H] = SIZE[kind], pad = kind === 'pad';
  const shotW = pad ? 1660 : 1000, top = pad ? 600 : 590, radius = pad ? 64 : 84, sb = pad ? 48 : 162; // status bar height in the shot
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
.island { position: absolute; left: 50%; top: ${pad ? 0 : 33 * scale}px; width: ${pad ? 0 : 372 * scale}px; height: ${pad ? 0 : 110 * scale}px; transform: translateX(-50%); border-radius: 99px; background: #000; }
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
  const out = join(ROOT, 'store/appstore', kind); mkdirSync(out, { recursive: true });
  const shots = readdirSync(RAW).filter((f) => f.startsWith(kind + '-') && f.endsWith('.png')).sort();
  const pg = await b.newPage({ viewport: { width: SIZE[kind][0], height: SIZE[kind][1] }, deviceScaleFactor: 1 });
  for (const f of shots) {
    const scene = f.replace(/^\w+-\d-/, '').replace('.png', ''), n = f.match(/-(\d)-/)[1];
    await pg.setContent(page(kind, join(RAW, f), CAPTIONS[scene] ?? ['', scene]), { waitUntil: 'load' }); await pg.evaluate(() => document.fonts.ready);
    await pg.screenshot({ path: join(out, `${n}-${scene}.png`) }); console.log(kind, n, scene);
  }
  await pg.close();
}
await b.close();
