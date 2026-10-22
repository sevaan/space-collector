import { webkit } from 'playwright';
import { setup2, SHOT, col } from './_bthelp.mjs';
const b = await webkit.launch();
const { p, errs, cons } = await setup2(b);
const st = () => p.evaluate(() => ({ night: __store.state.night, body: document.body.classList.contains('night'), html: document.documentElement.dataset.theme, sweeps: document.querySelectorAll('.night-sweep').length, chk: document.getElementById('chk-night').checked }));
await p.tap('#night-toggle'); await p.waitForTimeout(250); await p.screenshot({ path: SHOT + '14-mid.png' }); await p.waitForTimeout(700);
console.log('one tap', await st());
await p.tap('#night-toggle'); await p.waitForTimeout(900); console.log('off', await st());
// rapid
for (let i = 0; i < 5; i++) { await p.tap('#night-toggle'); await p.waitForTimeout(90); }
console.log('rapid5 immediately', await st()); await p.waitForTimeout(1200); console.log('rapid5 after', await st());
await p.screenshot({ path: SHOT + '14-rapid.png' });
for (let i = 0; i < 4; i++) { await p.tap('#night-toggle'); await p.waitForTimeout(60); }
await p.waitForTimeout(1200); console.log('rapid4 after', await st());
// on then off mid-sweep 200ms
await p.tap('#night-toggle'); await p.waitForTimeout(200); await p.tap('#night-toggle'); await p.waitForTimeout(100); console.log('on-off@200 +100', await st()); await p.screenshot({ path: SHOT + '14-onoff-mid.png' }); await p.waitForTimeout(1000); console.log('on-off after', await st());
// on, then reload mid
await p.tap('#night-toggle'); await p.waitForTimeout(200); await p.reload(); await p.waitForTimeout(6000); console.log('reload mid', await st());
// collection iframe night
const f = col(p); console.log('col frame', !!f);
// open collection and toggle
await p.tap('#nav-collection').catch(e=>console.log('nocol', e.message)); await p.waitForTimeout(1500);
await p.tap('#night-toggle'); await p.waitForTimeout(1000); console.log('in col', await st(), await col(p)?.evaluate(() => ({ b: document.body.className, h: document.documentElement.dataset.theme })));
await p.screenshot({ path: SHOT + '14-col.png' });
// reduced motion
await p.emulateMedia({ reducedMotion: 'reduce' }); await p.tap('#night-toggle'); await p.waitForTimeout(50); console.log('reduced', await st());
console.log('errs', errs, cons);
await b.close();
