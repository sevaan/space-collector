import { webkit } from 'playwright';
import { setup2, SHOT } from './_bthelp.mjs';
const b = await webkit.launch();
const { p, errs, cons } = await setup2(b);
await p.tap('#nav-sky'); await p.waitForTimeout(2500);
const ev = () => p.evaluate(() => { const c = document.querySelector('.ev-chart'); return c ? { cls: c.className, sc: document.getElementById('visible').scrollTop, lab: c.querySelector('.ev-scrub span')?.textContent, hidden: c.querySelector('.ev-scrub').hidden, sel: c.querySelectorAll('i.sel').length } : null; });
console.log('top', await ev());
await p.evaluate(() => document.querySelector('.ev-chart').scrollIntoView({ block: 'center' })); await p.waitForTimeout(1200); console.log('in view', await ev());
await p.screenshot({ path: SHOT + '08-grown.png' });
const r = await p.evaluate(() => { const b = document.querySelector('.ev-chart').getBoundingClientRect(); return { x: b.x, y: b.y + b.height / 2, w: b.width }; });
await p.evaluate(() => { window.__buzz = []; });
await p.mouse.move(r.x + 5, r.y); await p.mouse.down(); for (let i = 0; i <= 20; i++) { await p.mouse.move(r.x + 5 + (r.w - 10) * i / 20, r.y); await p.waitForTimeout(30); }
console.log('scrubbing', await ev(), (await p.evaluate(() => __buzz.length))); await p.screenshot({ path: SHOT + '08-scrub.png' });
await p.mouse.up(); await p.waitForTimeout(1200); console.log('released', await ev());
// scrub left edge label & right edge label
await p.mouse.move(r.x + 2, r.y); await p.mouse.down(); await p.waitForTimeout(100); await p.screenshot({ path: SHOT + '08-left.png' }); await p.mouse.up();
await p.mouse.move(r.x + r.w - 2, r.y); await p.mouse.down(); await p.waitForTimeout(100); await p.screenshot({ path: SHOT + '08-right.png' }); await p.mouse.up();
// leave and come back: grows again?
await p.tap('#nav-explore'); await p.waitForTimeout(1200); await p.tap('#nav-sky'); await p.waitForTimeout(400); console.log('back (kept scroll)', await ev()); await p.waitForTimeout(1200); console.log('back +1.2s', await ev());
// re-render while in view (renderTonight via clock ticks) - does pre come back?
await p.clock.fastForward('00:02:00'); await p.waitForTimeout(1500); console.log('after 2 min', await ev());
// scrub while page closes (pointer down, then close)
await p.mouse.move(r.x + 40, r.y); await p.mouse.down(); await p.tap('#nav-explore').catch(()=>{}); await p.waitForTimeout(800); await p.mouse.up(); console.log('closed while scrubbing', await ev());
// reduced
await p.emulateMedia({ reducedMotion: 'reduce' }); await p.tap('#nav-sky'); await p.waitForTimeout(1500); console.log('reduced', await ev());
console.log('errs', errs, cons);
await b.close();
