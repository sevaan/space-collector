import { webkit } from 'playwright';
import { setup2, SHOT, col } from './_bthelp.mjs';
const b = await webkit.launch();
const { p, errs, cons } = await setup2(b);
const pick = (tier, n = 0) => p.evaluate(([tier, n]) => { const st = __store.state, own = new Set(st.sightings.map((s) => String(s.cardKey)));
  return [...st.byId.values()].filter((o) => o.tier === tier && !own.has(String(o.id)) && !o.family && !o.natural && typeof o.id === 'number')[n]?.id; }, [tier, n]);
const catchIt = (id) => p.evaluate(async (id) => { const o = __store.state.byId.get(id); const ok = await __h.recordSighting(o, __h.now(), { az: 180, el: 45, visible: true, mag: 3 }); if (ok) __h.showCaptureCard(o); return o.name; }, id);
const cinfo = async () => { const f = col(p); return f ? f.evaluate(() => ({ stickers: [...document.querySelectorAll('.tile-new')].map(t => t.closest('.tile-slot')?.dataset.key), since: document.querySelector('.lb-since')?.textContent, xp: document.querySelector('#logbook .lb-xp b')?.textContent, visit: localStorage.getItem('colVisit'), peeled: localStorage.getItem('colPeeled') })) : 'noframe'; };
const openCol = async () => { await p.tap('#nav-collection'); await p.waitForTimeout(2500); };
const closeCol = async () => { await p.tap('#nav-explore'); await p.waitForTimeout(1500); };
await openCol(); console.log('first visit', await cinfo()); await p.screenshot({ path: SHOT + '10-first.png' }); await closeCol();
console.log('after leave', await cinfo());
await p.clock.fastForward('00:10:00');
const ids = [await pick('rare'), await pick('uncommon')];
for (const id of ids) { console.log('caught', await catchIt(id)); await p.waitForTimeout(3500); await p.evaluate(() => __h.closePanel('reveal')); await p.waitForTimeout(1200); }
await openCol(); await p.waitForTimeout(300); console.log('second visit', await cinfo()); await p.screenshot({ path: SHOT + '10-second.png' });
await p.waitForTimeout(1500); await p.screenshot({ path: SHOT + '10-second-b.png' });
await closeCol(); await p.clock.fastForward('00:05:00');
await openCol(); console.log('third visit (not opened)', await cinfo()); await p.screenshot({ path: SHOT + '10-third.png' });
// scroll the grid to bottom and back to see if late-rendered tiles get stickers
await closeCol();
// reload page (new iframe) and open
await p.reload(); await p.waitForTimeout(8000); await openCol(); console.log('after reload', await cinfo());
console.log('errs', errs, cons);
await b.close();
