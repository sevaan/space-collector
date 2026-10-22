import { webkit } from 'playwright';
import { setup2, SHOT } from './_bthelp.mjs';
const b = await webkit.launch();
const { p, errs, cons } = await setup2(b);
await p.tap('#radar'); await p.waitForTimeout(1500);
const st = () => p.evaluate(() => ({ ap: __h.ap, body: document.body.className, flash: JSON.stringify(__h.arFlash), pings: __h.arPings, pan: __h.arPan.toFixed(1), buzz: (window.__buzz ?? []).length, toggles: (window.__sfxLog ?? []).filter(x => x[0] === 'toggle').length }));
console.log('open', await st());
await p.evaluate(() => { window.__buzz = []; window.__sfxLog = []; });
// pan slowly through 360
for (let i = 0; i <= 72; i++) { await p.evaluate((v) => __h.setPan(v), i * 5); await p.waitForTimeout(40); }
console.log('full turn', await st()); await p.screenshot({ path: SHOT + '09-turn.png' });
// tremble around a cardinal: find pan that puts centre at N
await p.evaluate(() => { window.__buzz = []; window.__sfxLog = []; });
const face = await p.evaluate(() => { return null; });
const base = await p.evaluate(() => { const pan = __h.arPan; return pan; });
// we don't know heading; pan sweeps: find crossing by stepping 0.5 deg and watching flash
let cross = null; for (let a = 0; a < 360 && cross == null; a += 1) { const before = await p.evaluate(() => JSON.stringify(__h.arFlash)); await p.evaluate((v) => __h.setPan(v), a); await p.waitForTimeout(35); if (await p.evaluate(() => JSON.stringify(__h.arFlash)) !== before) cross = a; }
console.log('cross at', cross);
await p.evaluate(() => { window.__buzz = []; window.__sfxLog = []; });
for (let i = 0; i < 60; i++) { await p.evaluate((v) => __h.setPan(v), cross - 0.5 + (i % 2)); await p.waitForTimeout(34); }
console.log('tremble ±0.5 at N for 2 s', await st());
// close mid, check raf stops
await p.evaluate(() => __h.closePanel('around')); await p.waitForTimeout(600); const r1 = await p.evaluate(() => __h.arRaf); await p.waitForTimeout(500); console.log('after close raf', r1, await p.evaluate(() => __h.arRaf), await st());
// open twice rapid
await p.tap('#radar'); await p.tap('#radar').catch(()=>{}); await p.waitForTimeout(1200); console.log('double open', await st());
// pings check: initial seeded none; drag item into view
console.log('errs', errs, cons);
await b.close();
