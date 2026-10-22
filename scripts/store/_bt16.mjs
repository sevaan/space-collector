import { webkit } from 'playwright';
import { setup2, SHOT } from './_bthelp.mjs';
const b = await webkit.launch();
const small = process.argv[2] === 'small';
const { p, errs, cons } = await setup2(b, small ? 'small' : 'phone');
const st = () => p.evaluate(() => { const tl = document.querySelector('#od-body .od-tl'); const n = tl?.querySelector('.od-now'); return { shown: !document.getElementById('ob-done').hidden, rows: [...(tl?.querySelectorAll('.it') ?? [])].map(r => `${r.offsetTop}:${new Date(+r.dataset.t).toTimeString().slice(0,5)}`), now: n ? `${n.style.top} ${n.className}` : null, nows: document.querySelectorAll('.od-now').length, sparks: document.querySelectorAll('.od-spark').length, clock: new Date(__h.now()).toTimeString().slice(0,5), timer: __h.odT }; });
const open = () => p.evaluate(() => { document.getElementById('onboard').hidden = false; __h.obFinish(true); });
await open(); await p.waitForTimeout(400); await p.screenshot({ path: SHOT + '16-fuse.png' }); await p.waitForTimeout(2500);
console.log('single', await st()); await p.screenshot({ path: SHOT + (small ? '16-small.png' : '16-now.png') });
for (let i = 0; i < 6; i++) { await p.clock.fastForward('00:05:00'); await p.waitForTimeout(150); } await p.waitForTimeout(1200);
console.log('single +30min', await st());
// close
await p.tap('#od-close'); await p.waitForTimeout(1200); console.log('closed', await st());
// double open quickly
await open(); await p.waitForTimeout(100); await open(); await p.waitForTimeout(3000);
console.log('double', await st());
for (let i = 0; i < 6; i++) { await p.clock.fastForward('00:05:00'); await p.waitForTimeout(150); } await p.waitForTimeout(1200);
console.log('double +30min', await st()); await p.screenshot({ path: SHOT + '16-double.png' });
// close mid-fuse then reopen
await p.tap('#od-close'); await p.waitForTimeout(1200);
await open(); await p.waitForTimeout(250); await p.tap('#od-close'); await p.waitForTimeout(1500); console.log('closed mid-fuse', await st());
await p.emulateMedia({ reducedMotion: 'reduce' }); await open(); await p.waitForTimeout(300); console.log('reduced', await st()); await p.screenshot({ path: SHOT + '16-reduced.png' });
console.log('errs', errs, cons);
await b.close();
