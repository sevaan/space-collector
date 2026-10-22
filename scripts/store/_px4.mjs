import { start, frames, shot } from './_pxlib.mjs';
const small = process.argv[2] === 'small', tag = small ? 's-' : '';
const { browser, p, errs } = await start({ small });
// 14 night sweep on Settings
await p.click('#nav-more'); await p.waitForTimeout(900); await shot(p, tag + 'settings');
await p.evaluate(() => window.__t.toggleNight(true)); await frames(p, tag + 'nighton', 10, 0); await p.waitForTimeout(500); await shot(p, tag + 'settings-night');
await p.evaluate(() => window.__t.toggleNight(false)); await frames(p, tag + 'nightoff', 9, 0);
await p.click('#nav-more'); await p.waitForTimeout(800);
// 15 fan
await p.evaluate(() => window.__t.cardsTurnOver()); const tf = Date.now(); await frames(p, tag + 'fan', 30, 40); console.log('fan ms', Date.now() - tf);
await p.waitForTimeout(2500);
// 13 reminder fold from a sky page bell
await p.click('#nav-sky'); await p.waitForTimeout(1500);
const ok = await p.evaluate(() => { const st = window.__store.state, T = st.tonight; const bell = [...document.querySelectorAll('#visible .nh-bell, #visible .hl-bell, #visible .bell, #visible .b-alarm')].find((b) => { const r = b.getBoundingClientRect(); return r.top > 100 && r.bottom < innerHeight - 100 && r.width; });
  if (!bell) return 'nobell'; const ps = T.passes.filter((x) => x.start > Date.now() + 20 * 60000); const x = ps[0]; const obj = st.byId.get(x.id);
  bell.click(); setTimeout(() => {}, 0); window.__bell = bell; return [bell.className, obj?.name]; });
console.log('bell', ok); await p.waitForTimeout(700); await shot(p, tag + 'pr-sheet');
const hasSheet = await p.evaluate(() => !document.getElementById('pr-sheet').hidden);
console.log('sheet open', hasSheet);
if (hasSheet) { await p.evaluate(() => { document.querySelector('#pr-opts .pr-row')?.classList.add('on'); window.__t.prFold(window.__bell, '8:52 PM'); }); await frames(p, tag + 'prfold', 16, 0); }
// 16 fuse
await p.click('#nav-explore').catch(() => {}); await p.waitForTimeout(1200);
await p.evaluate(() => { document.getElementById('onboard').hidden = false; window.__t.obFinish(true); }); const t2 = Date.now(); await frames(p, tag + 'fuse', 24, 60); console.log('fuse ms', Date.now() - t2);
await p.waitForTimeout(1500); await shot(p, tag + 'tonight');
console.log('errs', errs); await browser.close();
