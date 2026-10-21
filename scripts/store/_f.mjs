import { webkit } from 'playwright';
const b = await webkit.launch(); const p = await b.newPage({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 });
p.on('pageerror', (e) => console.log('ERR', e.message));
await p.goto('http://localhost:8765/review.html'); await p.waitForTimeout(4000);
const out = [];
for (const q of ['pale blue dot', 'the plaque', 'the sun', 'hubble', 'molniya', 'wow', 'heart of pluto', 'starlink', 'grand tour']) {
  await p.fill('#q', q); await p.dispatchEvent('#q', 'input'); await p.waitForTimeout(900);
  const first = p.locator('#grid > *').first(); if (!(await first.count())) { console.log('none', q); continue; }
  await first.click(); await p.waitForTimeout(1200);
  const r = await p.evaluate(() => { const st = [...document.querySelectorAll('#view .card__stat, #view .card__stats > *')]; const over = st.filter((e) => e.scrollWidth > e.clientWidth + 1 || [...e.querySelectorAll('*')].some((c) => c.getBoundingClientRect().right > e.closest('.card__face').getBoundingClientRect().right - 2)).map((e) => e.textContent.trim().slice(0, 40)); const f = document.querySelector('#view .card__fact'); return { stats: [...document.querySelectorAll('#view .card__stats .card__stat, #view [class*=stat]')].slice(0, 4).map((e) => e.textContent.replace(/\s+/g, ' ').trim()).join(' | '), over, factFont: f?.style.fontSize || 'base', factOverflow: f ? f.scrollHeight > f.clientHeight + 1 : null }; });
  console.log(q, JSON.stringify(r));
  const fn = q.replace(/\s/g, '_'); await p.locator('#view .card').first().screenshot({ path: `/private/tmp/claude-501/-Users-sevaan/04a71ae5-eb6a-4f90-ae24-1b4114851804/scratchpad/gpt-${fn}.png` });
  await p.locator('#view .vclose').click().catch(() => {}); await p.waitForTimeout(300);
}
await b.close();
