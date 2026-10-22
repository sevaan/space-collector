import { start, frames, shot, OUT } from './_pxlib.mjs';
const small = process.argv[2] === 'small', tag = small ? 's-' : '';
const { browser, p, errs } = await start({ small });
const pick = async (tiers) => p.evaluate((tiers) => { const st = window.__store.state, own = new Set(st.sightings.map((s) => String(s.objectId)));
  const o = [...st.byId.values()].find((o) => tiers.includes(o.tier) && !own.has(String(o.id)) && !o.family && !o.launches && typeof o.id === 'number');
  st.sightings.unshift({ time: Date.now(), cardKey: String(o.id), objectId: o.id, name: o.name, type: o.type ?? 'satellite', lat: 44.3, lon: -78.3 });
  window.__t.showCaptureCard(o); return o.name + ' ' + o.tier; }, tiers);
console.log('epic:', await pick(['legendary', 'epic']));
const t0 = Date.now(); await frames(p, tag + 'hb', 26, 0); console.log('hb frames ms', Date.now() - t0);
await p.waitForTimeout(3000); await shot(p, tag + 'hb-landed');
// close with ✕ → binder fly
const x = await p.$('#reveal .x-close, #rv-close, #reveal [aria-label=Close]'); console.log('close btn', !!x);
await x?.click(); const t1 = Date.now(); await frames(p, tag + 'binder', 14, 0); console.log('binder ms', Date.now() - t1);
// a common one too, close quickly (the "every catch" case)
await p.waitForTimeout(800);
console.log('common:', await pick(['common']));
await p.waitForTimeout(3500); await shot(p, tag + 'common-reveal');
await p.click('#reveal .x-close, #rv-close, #reveal [aria-label=Close]').catch((e) => console.log('noclose', e.message.slice(0, 60)));
await frames(p, tag + 'binder2', 10, 0);
console.log('errs', errs);
await browser.close();
