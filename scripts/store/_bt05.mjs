import { webkit } from 'playwright';
import { setup2, SHOT, col } from './_bthelp.mjs';
const b = await webkit.launch();
const { p, errs, cons } = await setup2(b);
await p.evaluate(() => { window.__hb = []; addEventListener('sc:heartbeat', (e) => __hb.push([performance.now() | 0, e.detail.strong])); });
const pick = (tier, n = 0) => p.evaluate(([tier, n]) => { const st = __store.state, own = new Set(st.sightings.map((s) => String(s.objectId)));
  const o = [...st.byId.values()].filter((o) => o.tier === tier && !own.has(String(o.id)) && !o.family && !o.natural && typeof o.id === 'number')[n]; return o?.id; }, [tier, n]);
const catchIt = (id) => p.evaluate(async (id) => { const o = __store.state.byId.get(id); window.__t0 = performance.now(); __hb.length = 0; const ok = await __h.recordSighting(o, __h.now(), { az: 180, el: 45, visible: true, mag: 3 }); if (ok) __h.showCaptureCard(o); return { ok: !!ok, name: o.name, rb: __h.rb }; }, id);
const dom = () => p.evaluate(() => ({ ap: __h.ap, rb: __h.rb, fly: document.querySelectorAll('.binder-fly').length, plus: document.querySelectorAll('.binder-plus').length, reveal: document.getElementById('reveal').hidden, body: document.body.className, hb: __hb.map(([t, s]) => [t - (window.__t0|0), s]) }));
const epic = await pick('epic'); console.log('epic', epic);
console.log(await catchIt(epic)); await p.waitForTimeout(500); await p.screenshot({ path: SHOT + '05-beat.png' });
await p.waitForTimeout(4000); console.log('after epic', await dom()); await p.screenshot({ path: SHOT + '05-epic-open.png' });
// close via X
const x = await p.evaluate(() => { const c = [...document.querySelectorAll('#reveal button')].filter(b => b.offsetParent && /close|✕/i.test((b.getAttribute('aria-label') ?? '') + b.textContent)); return c.map(b => b.id || b.className); }); console.log('close btns', x);
await p.tap('#' + x[0]).catch(async () => p.evaluate(() => __h.closePanel('reveal')));
await p.waitForTimeout(250); console.log('mid fly', await dom()); await p.screenshot({ path: SHOT + '07-fly.png' });
await p.waitForTimeout(1500); console.log('after fly', await dom());
// legendary tap during beats
const leg = await pick('legendary'); console.log('leg', leg);
if (leg) { console.log(await catchIt(leg)); await p.waitForTimeout(400); await p.tap('#rv-holder').catch(e => console.log(e.message)); await p.waitForTimeout(2000); console.log('leg tapped early', await dom()); }
// close X twice rapidly
await p.evaluate(() => __h.closePanel('reveal')); await p.evaluate(() => __h.closePanel('reveal')); await p.waitForTimeout(1500); console.log('double close', await dom());
// epic: close during heartbeat
const e2 = await pick('epic', 1); console.log(await catchIt(e2)); await p.waitForTimeout(600); await p.evaluate(() => __h.closePanel('reveal')); await p.waitForTimeout(2500); console.log('closed mid-beat', await dom());
await p.screenshot({ path: SHOT + '05-closed-midbeat.png' });
// rare: no heartbeat; close, then open collection right away mid-fly
const r = await pick('rare'); console.log(await catchIt(r)); await p.waitForTimeout(3500); await p.evaluate(() => __h.closePanel('reveal')); await p.waitForTimeout(150); await p.tap('#nav-collection'); await p.waitForTimeout(200); console.log('fly+col', await dom()); await p.screenshot({ path: SHOT + '07-fly-col.png' }); await p.waitForTimeout(1500); console.log('fly+col after', await dom());
await p.evaluate(() => __h.closeCollection()); await p.waitForTimeout(1200);
// reduced motion: catch, close, then catch owned (view) and close -> stale rb?
await p.emulateMedia({ reducedMotion: 'reduce' });
const e3 = await pick('epic', 2); console.log(await catchIt(e3)); await p.waitForTimeout(2500); console.log('reduced epic', await dom()); await p.evaluate(() => __h.closePanel('reveal')); await p.waitForTimeout(300); console.log('reduced closed', await dom());
console.log('errs', errs, cons);
await b.close();
