import { start, frames, shot } from './_pxlib.mjs';
const small = process.argv[2] === 'small', tag = small ? 's-' : '';
const { browser, p, errs } = await start({ small, plus: true });
await p.click('#nav-sky'); await p.waitForTimeout(1500);
const ok = await p.evaluate(() => { const bell = [...document.querySelectorAll('#visible .nh-bell, #visible .hl-bell, #visible .bell, #visible .b-alarm')].find((b) => { const r = b.getBoundingClientRect(); return !b.disabled && r.top > 100 && r.bottom < innerHeight - 100 && r.width; });
  if (!bell) return 'nobell'; window.__bell = bell; bell.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); bell.click(); return bell.className; });
console.log('bell', ok); await p.waitForTimeout(800); await shot(p, tag + 'pr-sheet');
const hasSheet = await p.evaluate(() => !document.getElementById('pr-sheet').hidden); console.log('sheet', hasSheet);
if (hasSheet) { await p.evaluate(() => { document.querySelector('#pr-opts .pr-row')?.classList.add('on'); window.__t.prFold(window.__bell, '8:52 PM'); }); await frames(p, tag + 'prfold', 16, 0); }
// All around you
await p.click('#nav-explore'); await p.waitForTimeout(1500);
await p.evaluate(() => window.__t.openAround()); await p.waitForTimeout(1500); await shot(p, tag + 'around');
await p.evaluate(() => { window.__sfxLog = []; });
// drag the strip slowly right-to-left across a full turn
const W = small ? 375 : 402, H = small ? 667 : 874, y = 260;
await p.mouse.move(W - 30, y); await p.mouse.down(); let k = 0;
for (let i = 0; i < 30; i++) { await p.mouse.move(W - 30 - i * 11, y); if (i % 3 === 0) await shot(p, tag + `ardrag-${String(k++).padStart(2, '0')}`); else await p.waitForTimeout(30); }
await p.mouse.up(); await p.waitForTimeout(300);
const log = await p.evaluate(() => __sfxLog.map((x) => x[0])); console.log('sfx during drag', log.join(','));
await p.mouse.move(W - 30, y); await p.mouse.down(); for (let i = 0; i < 12; i++) { await p.mouse.move(W - 30 - i * 28, y); await p.waitForTimeout(16); } await p.mouse.up();
console.log('sfx after fast drag', (await p.evaluate(() => __sfxLog.map((x) => x[0]))).length);
await p.waitForTimeout(800); await shot(p, tag + 'around-after');
console.log('errs', errs); await browser.close();
