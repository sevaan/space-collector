import { start, frames, shot } from './_pxlib.mjs';
const small = process.argv[2] === 'small', night = process.argv[3] === 'night', tag = (small ? 's-' : '') + (night ? 'n-' : '');
const { browser, p, errs } = await start({ small, plus: true });
if (night) { await p.evaluate(() => window.__t.toggleNight(true)); await p.waitForTimeout(800); }
await p.click('#nav-sky'); await p.waitForTimeout(1500);
const info = await p.evaluate(() => { const all = [...document.querySelectorAll('#visible .nh-bell, #visible .hl-bell, #visible .bell, #visible .b-alarm')]; return all.map((b) => [b.className, b.disabled, Math.round(b.getBoundingClientRect().top)]); });
console.log(JSON.stringify(info));
const bell = await p.evaluateHandle(() => [...document.querySelectorAll('#visible .nh-bell, #visible .hl-bell, #visible .bell, #visible .b-alarm')].find((b) => !b.disabled && b.getBoundingClientRect().width));
await bell.evaluate((b) => b.scrollIntoView({ block: 'center' })); await p.waitForTimeout(600);
await bell.click(); await p.waitForTimeout(800); await shot(p, tag + 'pr-sheet');
const hasSheet = await p.evaluate(() => !document.getElementById('pr-sheet').hidden); console.log('sheet', hasSheet);
if (hasSheet) { await bell.evaluate((b) => { document.querySelector('#pr-opts .pr-row')?.classList.add('on'); window.__t.prFold(b, '8:52 PM'); }); await frames(p, tag + 'prfold', 16, 0); }
console.log('errs', errs); await browser.close();
