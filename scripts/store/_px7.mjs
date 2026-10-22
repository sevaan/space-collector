import { start, frames, shot } from './_pxlib.mjs';
const small = process.argv[2] === 'small', night = process.argv[3] === 'night', tag = (small ? 's-' : '') + (night ? 'n-' : '');
const { browser, p, errs } = await start({ small });
if (night) { await p.evaluate(() => window.__t.toggleNight(true)); await p.waitForTimeout(800); }
await p.evaluate(() => localStorage.setItem('colVisit', JSON.stringify({ at: Date.now() - 1.5 * 864e5, xp: 600 })));
await p.click('#nav-collection'); const t0 = Date.now(); await frames(p, tag + 'col', 16, 80); console.log('col ms', Date.now() - t0);
await p.waitForTimeout(2500); await shot(p, tag + 'col-settled');
const fr = p.frame({ url: /cards\.html/ }); console.log('frame', !!fr);
const info = await fr.evaluate(() => ({ news: document.querySelectorAll('.tile-new').length, since: document.querySelector('.lb-since')?.textContent ?? null }));
console.log(info);
// press and hold a tile
const tile = await fr.evaluate(() => { const t = [...document.querySelectorAll('#grid .tile-slot[data-key]')].find((s) => { const r = s.getBoundingClientRect(); return r.top > 300 && r.bottom < innerHeight - 120; }); const r = t.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, key: t.dataset.key }; });
const off = await p.evaluate(() => { const r = document.getElementById('collection-frame').getBoundingClientRect(); return { x: r.left, y: r.top }; });
console.log('tile', tile, off);
await p.mouse.move(off.x + tile.x, off.y + tile.y); await p.mouse.down(); await frames(p, tag + 'peek', 10, 40); await p.mouse.up(); await frames(p, tag + 'peekoff', 5, 0);
await p.waitForTimeout(700); await shot(p, tag + 'after-peek');
console.log('viewer open after peek release?', await fr.evaluate(() => document.getElementById('viewer')?.open));
// tap a NEW tile → viewer and peel
const nt = await fr.evaluate(() => { const t = document.querySelector('#grid .tile-new')?.closest('.tile-slot'); if (!t) return null; t.scrollIntoView({ block: 'center' }); const r = t.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
if (nt) { await p.waitForTimeout(500); await shot(p, tag + 'newtile'); await p.mouse.click(off.x + nt.x, off.y + nt.y); await p.waitForTimeout(1800); await shot(p, tag + 'viewer'); await p.keyboard.press('Escape'); await frames(p, tag + 'peel', 8, 60); }
// scroll down for slim row
await fr.evaluate(() => (document.scrollingElement).scrollTo({ top: 1400 })); await p.waitForTimeout(900); await shot(p, tag + 'slim');
console.log('errs', errs); await browser.close();
