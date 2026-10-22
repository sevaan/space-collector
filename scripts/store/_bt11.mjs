import { webkit } from 'playwright';
import { setup2, SHOT, col } from './_bthelp.mjs';
const b = await webkit.launch();
const { p, errs, cons } = await setup2(b);
const pick = (tier, n = 0) => p.evaluate(([tier, n]) => { const st = __store.state, own = new Set(st.sightings.map((s) => String(s.cardKey)));
  return [...st.byId.values()].filter((o) => o.tier === tier && !own.has(String(o.id)) && !o.family && !o.natural && typeof o.id === 'number')[n]?.id; }, [tier, n]);
const catchIt = (id) => p.evaluate(async (id) => { const o = __store.state.byId.get(id); const ok = await __h.recordSighting(o, __h.now(), { az: 180, el: 45, visible: true, mag: 3 }); if (ok) __h.showCaptureCard(o); return o.name; }, id);
const openCol = async () => { await p.tap('#nav-collection'); await p.waitForTimeout(2500); };
const closeCol = async () => { await p.tap('#nav-explore'); await p.waitForTimeout(1500); };
const ci = () => col(p).evaluate(() => ({ stickers: [...document.querySelectorAll('.tile-new')].map(t => t.closest('.tile-slot')?.dataset.key + (t.classList.contains('peel') ? ':peel' : '')), viewer: document.getElementById('viewer').open, peek: document.querySelectorAll('.peek').length, body: document.body.className, peeled: localStorage.getItem('colPeeled') }));
await openCol(); await closeCol(); await p.clock.fastForward('00:10:00');
const id = await pick('rare'); await catchIt(id); await p.waitForTimeout(3500); await p.evaluate(() => __h.closePanel('reveal')); await p.waitForTimeout(1200);
await closeCol(); await openCol(); console.log('visit2', await ci()); await closeCol(); await openCol(); console.log('visit3', await ci());
const f = col(p);
const box = async (key) => { const r = await f.evaluate((k) => { const t = document.querySelector(`.tile-slot[data-key="${k}"]`); t.scrollIntoView({ block: 'center' }); const b = t.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; }, key); const fr = await (await f.frameElement()).boundingBox(); return { x: fr.x + r.x, y: fr.y + r.y }; };
// open the stickered card on visit 3
let c = await box(String(id)); await p.mouse.click(c.x, c.y); await p.waitForTimeout(1200); console.log('opened on visit3', await ci());
await f.evaluate(() => document.getElementById('viewer').close()); await p.waitForTimeout(800);
// PEEK via touch-like hold: use CDP-less: dispatch pointer events with mouse
const other = await f.evaluate(() => [...document.querySelectorAll('#grid .tile-slot[data-key]')].map(s => s.dataset.key).slice(3, 6));
c = await box(other[0]);
await p.mouse.move(c.x, c.y); await p.mouse.down(); await p.waitForTimeout(600); console.log('holding', await ci()); await p.screenshot({ path: SHOT + '11-peek.png' });
await p.mouse.up(); await p.waitForTimeout(80); console.log('released', await ci()); await p.waitForTimeout(600); console.log('released+600', await ci());
// next tap should open viewer
await p.mouse.click(c.x, c.y); await p.waitForTimeout(900); console.log('next tap', await ci()); await f.evaluate(() => document.getElementById('viewer').close()); await p.waitForTimeout(700);
// hold then immediate tap within 450ms on a different tile
await p.mouse.move(c.x, c.y); await p.mouse.down(); await p.waitForTimeout(600); await p.mouse.up(); await p.waitForTimeout(100);
const c2 = await box(other[1]); await p.mouse.click(c2.x, c2.y); await p.waitForTimeout(900); console.log('tap other right after peek', await ci()); await f.evaluate(() => document.getElementById('viewer').close()); await p.waitForTimeout(700);
// touch: real touch via CDP not in webkit; use dispatchEvent pointer types touch
const tp = (k, type, extra = {}) => f.evaluate(([k, type, extra]) => { const t = document.querySelector(`.tile-slot[data-key="${k}"]`).firstElementChild; const r = t.getBoundingClientRect(); t.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerType: 'touch', pointerId: 5, isPrimary: true, clientX: r.x + 20 + (extra.dx ?? 0), clientY: r.y + 20, button: 0 })); }, [k, type, extra]);
await tp(other[2], 'pointerdown'); await p.waitForTimeout(500); console.log('touch hold', await ci());
// navigate away mid-peek
await p.tap('#nav-explore'); await p.waitForTimeout(1500); console.log('left mid-peek', await ci());
await openCol(); console.log('back', await ci()); await p.screenshot({ path: SHOT + '11-back.png' });
await tp(other[2], 'pointerup'); await p.waitForTimeout(500); console.log('up later', await ci());
// does a tap on that tile now open viewer?
c = await box(other[2]); await p.mouse.click(c.x, c.y); await p.waitForTimeout(900); console.log('tap after', await ci());
console.log('errs', errs, cons);
await b.close();
