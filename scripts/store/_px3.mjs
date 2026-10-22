import { start, frames, shot } from './_pxlib.mjs';
const small = process.argv[2] === 'small', night = process.argv[3] === 'night', tag = (small ? 's-' : '') + (night ? 'n-' : '');
const { browser, p, errs } = await start({ small });
await p.evaluate(() => localStorage.setItem('plusTest', '1')); await p.reload(); await p.waitForTimeout(9000);
await p.addInitScript(() => {});
if (night) { await p.evaluate(() => window.__t.toggleNight(true)); await p.waitForTimeout(800); }
await p.click('#nav-sky'); await p.waitForTimeout(1500); await shot(p, tag + 'sky-top');
// scroll to Every pass card
const y = await p.evaluate(() => { const v = document.getElementById('visible'), c = v.querySelector('.ev-chart'); if (!c) return null; return c.getBoundingClientRect().top - v.getBoundingClientRect().top + v.scrollTop; });
console.log('chart y', y);
if (y != null) {
  await p.evaluate((y) => { const v = document.getElementById('visible'); v.scrollTo({ top: y - 300 }); }, y); await frames(p, tag + 'evgrow', 12, 0);
  const r = await p.evaluate(() => { const b = document.querySelector('#visible .ev-chart').getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; });
  console.log('chart rect', r);
  await p.mouse.move(r.x + 10, r.y + r.h / 2); await p.mouse.down();
  for (let i = 0; i <= 6; i++) { await p.mouse.move(r.x + 10 + (r.w - 20) * i / 6, r.y + r.h / 2); await shot(p, tag + `scrub-${i}`); }
  await p.mouse.up(); await p.waitForTimeout(1200); await shot(p, tag + 'scrub-after');
}
// reminder bell on the sky page
const bells = await p.$$('#visible .rs-acts .bell, #visible .hl-bell, #visible .nh-bell');
console.log('bells', bells.length);
let bell = null; for (const b of bells) { if (await b.isVisible() && await b.isEnabled()) { await b.scrollIntoViewIfNeeded(); await p.waitForTimeout(400); await b.click(); bell = b; break; } }
await p.waitForTimeout(700); await shot(p, tag + 'pr-sheet');
const row = await p.$('#pr-opts .pr-row');
if (row && bell) { await row.evaluate((r) => r.classList.add('on')); await bell.evaluate((b) => window.__t.prFold(b, '8:52 PM')); await frames(p, tag + 'prfold', 14, 0); await p.waitForTimeout(500); await shot(p, tag + 'prfold-after'); } else console.log('no reminder row');
console.log('errs', errs);
await browser.close();
