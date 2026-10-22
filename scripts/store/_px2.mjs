import { start, frames, shot } from './_pxlib.mjs';
const { browser, p, errs } = await start({});
await p.evaluate(() => { window.__ev = []; const t0 = performance.now(); window.__t0 = t0;
  addEventListener('sc:heartbeat', (e) => __ev.push(['beat' + (e.detail.strong ? 'S' : 'w'), Math.round(performance.now() - t0)]));
  new MutationObserver(() => { const h = document.getElementById('rv-holder'); const l = h.classList.contains('live'); if (l !== window.__live) { window.__live = l; __ev.push([l ? 'live' : 'unlive', Math.round(performance.now() - t0)]); } }).observe(document.getElementById('rv-holder'), { attributes: true });
  const st = window.__store.state, own = new Set(st.sightings.map((s) => String(s.objectId)));
  const o = [...st.byId.values()].find((o) => o.tier === 'legendary' && !own.has(String(o.id)) && !o.family && !o.launches && typeof o.id === 'number');
  st.sightings.unshift({ time: Date.now(), cardKey: String(o.id), objectId: o.id, name: o.name, type: o.type ?? 'satellite', lat: 44.3, lon: -78.3 });
  window.__t.showCaptureCard(o); __ev.push(['name', o.name]);
  const dim = document.getElementById('rv-dim'); setInterval(() => __ev.push(['dim', Math.round(performance.now() - t0), getComputedStyle(dim).opacity, getComputedStyle(document.getElementById('rv-holder')).transform]), 50);
});
await p.waitForTimeout(4500);
const ev = await p.evaluate(() => __ev); console.log(JSON.stringify(ev.filter((e) => e[0] !== 'dim')));
const d = ev.filter((e) => e[0] === 'dim'); let last = ''; for (const e of d) { const s = e[2] + ' ' + e[3].slice(0, 40); if (s !== last) { console.log(e[1], s); last = s; } }
await browser.close();
