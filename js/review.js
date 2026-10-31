// Card review (2026-10-14, Sevaan): every card in the game on one page, to scan the art and layout for anything that
// needs redoing. Cards are drawn as collected (so the painted art shows) with the same renderCard as the app. "One per
// picture" shows one card for each art file (most satellites share a picture by kind) with how many cards use it.
// Stars (☆) are saved in this browser (localStorage 'reviewStars'); "Copy starred" puts a list on the clipboard to
// hand back. Not linked from the app.
import { expandFacts } from './catalog-facts.js?v=0.1.1491';
import { renderCard, miniCard, artImage } from './card.js?v=0.1.1491';
import { ART_CREDITS } from './art-credits.js?v=0.1.1491';
import { buildCards } from './card-model.js?v=0.1.1491';
import { TIERS, TIER_INFO } from './rarity.js?v=0.1.1491';
import { loadLore, titleFor, debrisOf } from './lore.js?v=0.1.1491';
import './stories.js?v=0.1.1491';
import { CON_FIGURES } from './con-figures.js?v=0.1.1491';
import { loadConstellations, CON_BY_ID } from './constellations.js?v=0.1.1491';
import { loadComets } from './comets.js?v=0.1.1491';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const SEEN = Date.parse('2026-10-01T03:00:00Z'); // a pretend sighting, so every card shows its picture
let cards = [], stars = new Map(), usage = new Map();
try { stars = new Map(JSON.parse(localStorage.getItem('reviewStars') ?? '[]')); } catch {}
const saveStars = () => { try { localStorage.setItem('reviewStars', JSON.stringify([...stars])); } catch {} };

const artOf = (c) => { const d = debrisOf(c); if (d?.art && NEW_ART.has(`deb-${d.art}`)) return `deb-${d.art}`; const src = artImage(c); if (src) return src.split('/').pop().replace(/\.webp$/, ''); return c.con && CON_FIGURES.has(c.con) && !c.skyName ? `figure-${c.con}` : null; }; // constellation star cards: their figure
const starKey = (c, one) => (one && c._art ? `art:${c._art}` : `card:${c.key}`);
const typeOf = (c) => c.natural ? (c.natural === 'star' ? 'star' : c.type) : c.launches ? 'fleet' : c.type ?? 'satellite';

function toast(text) { const t = $('toast'); t.textContent = text; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => { t.hidden = true; }, 2200); }

// Restyle preview (2026-10-15, Sevaan): pictures already redone in the new engraved style come from
// design/restyle-preview/<art>.webp (listed in manifest.json, refreshed as the batch runs); cards still on their
// original art show at 50% so the two are easy to tell apart.
let NEW_ART = new Set(), NEW_SHIFT = {};
const ART_T = Date.now(); // replaced pictures keep their name, so bust the browser cache on each visit (2026-10-16)
// Framing that has been baked into the art (design/restyle-preview/baked.json, written when Claude bakes a "Copy framing"):
// a saved frame that matches is dropped, so it isn’t applied a second time on top of the new picture.
async function dropBaked() {
  try {
    const baked = await (await fetch('design/restyle-preview/baked.json', { cache: 'no-store' })).json(); let n = 0;
    for (const [art, f] of Object.entries(frames)) { const b = baked[art]; if (b && ['x', 'y', 'z'].every((k) => Math.abs((b[k] ?? 0) - (f[k] ?? 0)) < 1e-4)) { delete frames[art]; n++; } }
    if (n) { saveFrames(); toast(`${n} framing${n === 1 ? '' : 's'} now baked into the art`); }
  } catch {}
}
async function loadNewArt() { try { NEW_ART = new Set(await (await fetch('design/restyle-preview/manifest.json', { cache: 'no-store' })).json()); } catch {} }
function markNew(el, c) {
  if (c._art && ART_CREDITS[c._art]) return true; // a real photo (2026-10-26): shown as it is, never the restyle preview
  const isNew = c._art && NEW_ART.has(c._art);
  if (isNew) for (const im of el.querySelectorAll('.card__art img.card-art-image')) { im.src = `design/restyle-preview/${c._art}.webp?t=${ART_T}`; }
  return isNew;
}
// Framing (2026-10-16, Sevaan): in the card viewer, tap the picture to drag it into place (and drag the corner or pinch
// to zoom), then Save. Saved per picture in this browser (localStorage 'reviewFrames') and shown on every card using it;
// "Copy framing" hands the numbers back so scripts bake them into the art file itself (no CSS shifting in the game).
// A frame is { x, y, z, py }: shift in units of the picture’s width, zoom, and where the window’s centre sits in the
// picture (0–1 down it), which is the point the zoom is around.
// 'reviewFrames2' (2026-10-16): Sevaan started over once the edges were locked; earlier saves under 'reviewFrames' are ignored.
let frames = {}; try { frames = JSON.parse(localStorage.getItem('reviewFrames2') ?? '{}'); } catch {}
const saveFrames = () => { try { localStorage.setItem('reviewFrames2', JSON.stringify(frames)); } catch {} };
const imgW = (im) => Math.max(im.offsetWidth, im.offsetHeight * 4 / 3); // object-fit: cover on a 4:3 picture
function centreY(im) { // the window’s centre, as a fraction down the picture
  const w = imgW(im), ih = w * 0.75, eh = im.offsetHeight, pos = parseFloat(getComputedStyle(im).objectPosition.split(' ')[1] ?? '50') / 100;
  return ih > eh ? ((ih - eh) * pos + eh / 2) / ih : 0.5;
}
function setFrame(im, f) {
  if (!f) { im.style.transform = ''; return; }
  const w = imgW(im); im.style.transformOrigin = '50% 50%';
  im.style.transform = `translate(${f.x * w}px, ${f.y * w}px) scale(${f.z})`;
}
function applyFrames(el, art) { const f = art && frames[art]; for (const im of el.querySelectorAll('.card__art img.card-art-image')) setFrame(im, f); }
function face(c, full = false) {
  const sightings = [{ time: SEEN, cardKey: c.key, objectId: c.id }];
  // Every star of its constellation owned, so the figure shows fully in focus (2026-10-15, Sevaan).
  const ownedKeys = c.con ? new Set(CON_BY_ID.get(c.con)?.stars ?? []) : undefined;
  const el = full ? renderCard(c, { sightings, ownedKeys }) : miniCard(c, { sightings, ownedKeys, status: c._art ?? 'drawn' });
  markNew(el, c); requestAnimationFrame(() => applyFrames(el, c._art)); return el;
}

// Draw a tile’s card only when it scrolls near the screen (there are thousands).
const io = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) { const slot = e.target; io.unobserve(slot); slot.replaceChildren(face(slot._card)); slot.classList.toggle('old-art', !(slot._card._art && (ART_CREDITS[slot._card._art] || NEW_ART.has(slot._card._art)))); slot.classList.toggle('framed', !!(slot._card._art && frames[slot._card._art])); } }, { rootMargin: '600px 0px' });

function list() {
  const q = $('q').value.trim().toLowerCase(), type = $('type').value, tier = $('tier').value, art = $('art').value, one = $('one').checked, only = $('starred').checked;
  let out = cards.filter((c) => (!type || c._type === type) && (!tier || c.tier === tier) && (!art || (art === 'photo' ? !!ART_CREDITS[c._art] : (art === 'painted') === (!!c._art && !ART_CREDITS[c._art])))
    && (!q || `${c._name} ${c._type} ${c._art ?? 'drawn'} ${c.key} ${c.id}`.toLowerCase().includes(q)));
  if (one) { // one card per painted picture; drawn cards stay one each
    const by = new Map();
    for (const c of out) { const k = c._art ? `art:${c._art}` : `card:${c.key}`; const g = by.get(k); if (g) g.n++; else by.set(k, { c, n: 1 }); }
    out = [...by.values()].map(({ c, n }) => ({ c, n }));
  } else out = out.map((c) => ({ c, n: 1 }));
  // Most used first (default): a bad picture used by 370 cards matters more than one used by 2.
  const sort = $('sort').value, used = (c) => (c._art ? usage.get(c._art) : 1);
  if (sort === 'used') out.sort((a, b) => used(b.c) - used(a.c) || TIERS.indexOf(b.c.tier) - TIERS.indexOf(a.c.tier));
  else if (sort === 'name') out.sort((a, b) => a.c._name.localeCompare(b.c._name));
  if (only) out = out.filter(({ c }) => stars.has(starKey(c, one)) || stars.has(`card:${c.key}`) || (c._art && stars.has(`art:${c._art}`)));
  return { out, one };
}

// Random mix (2026-10-26, Sevaan: "a page of random cards of each kind, and I can keep refreshing"): six random cards of
// every kind (fragment debris counted apart from named pieces), grouped by kind; press again for a new set. Touching
// any filter or the search goes back to the normal list.
let mix = null;
const kindOf = (c) => (c._type === 'debris' && debrisOf(c)?.group ? 'fragment' : c._type);
function randomMix(per = 6) {
  const by = new Map(); for (const c of cards) { const k = kindOf(c); if (!by.has(k)) by.set(k, []); by.get(k).push(c); }
  const out = [];
  for (const [, cs] of [...by].sort((a, b) => String(a[0]).localeCompare(String(b[0])))) {
    const pool = cs.slice(); for (let i = 0; i < per && pool.length; i++) out.push({ c: pool.splice(Math.floor(Math.random() * pool.length), 1)[0], n: 1 });
  }
  return out;
}
function render() {
  const { out, one } = mix ? { out: mix, one: false } : list(), grid = $('grid');
  io.disconnect(); grid.replaceChildren();
  $('count').textContent = `${mix ? 'Random mix · ' : ''}${out.length.toLocaleString()} shown · ${cards.length.toLocaleString()} cards · ${NEW_ART.size} new pictures · ${stars.size} starred`;
  const frag = document.createDocumentFragment();
  for (const { c, n } of out) {
    const k = starKey(c, one), el = document.createElement('div');
    el.className = `rv${stars.has(k) ? ' starred' : ''}`;
    el.innerHTML = `<div class="slot" role="button" tabindex="0" aria-label="Open ${esc(c._name)}"></div><button type="button" class="star" aria-label="Star for redo" aria-pressed="${stars.has(k)}">${stars.has(k) ? '★' : '☆'}</button>
      <div class="cap"><b>${esc(c._name)}</b> · ${esc(TIER_INFO[c.tier]?.label ?? c.tier)}</div>
      <div class="cap">${esc(c._art ?? 'drawn')}${c._art && usage.get(c._art) > 1 ? ` · used by ${usage.get(c._art).toLocaleString()}` : ''}</div>`;
    const slot = el.querySelector('.slot'); slot._card = c; io.observe(slot);
    slot.addEventListener('click', () => open(c, k));
    slot.addEventListener('keydown', (e) => { if (e.key === 'Enter') open(c, k); });
    el.querySelector('.star').addEventListener('click', () => { toggle(c, k); el.classList.toggle('starred', stars.has(k)); const b = el.querySelector('.star'); b.textContent = stars.has(k) ? '★' : '☆'; b.setAttribute('aria-pressed', stars.has(k)); $('count').textContent = $('count').textContent.replace(/\d+ starred/, `${stars.size} starred`); });
    frag.appendChild(el);
  }
  grid.appendChild(frag);
}

function toggle(c, k) {
  if (stars.has(k)) stars.delete(k);
  else stars.set(k, { name: c._name, key: c.key, id: c.id, art: c._art ?? null, type: c._type, tier: c.tier, at: Date.now() });
  saveStars();
}

function open(c, k) {
  const v = $('view');
  v.innerHTML = `<div class="wrap"><div class="host"></div><div class="meta"><b>${esc(c._name)}</b> · ${esc(c._type)} · ${esc(TIER_INFO[c.tier]?.label ?? c.tier)}<br>art: <b>${esc(c._art ?? 'drawn')}</b> · key ${esc(c.key)}</div>
    ${c._art ? '<p class="fr-hint">Tap the picture to adjust its framing</p><p class="fr-read" hidden></p>' : ''}
    <div class="acts"><button type="button" class="vstar">${stars.has(k) ? '★ Starred' : '☆ Star for redo'}</button><button type="button" class="vclose">Close</button></div>
    <div class="acts fr-acts" hidden><button type="button" class="fr-save on">Save framing</button><button type="button" class="fr-reset">Reset</button><button type="button" class="fr-cancel">Cancel</button></div></div>`;
  const host = v.querySelector('.host'); host.appendChild(face(c, true));
  v.querySelector('.vstar').addEventListener('click', (e) => { toggle(c, k); e.currentTarget.textContent = stars.has(k) ? '★ Starred' : '☆ Star for redo'; render(); });
  const close = () => { v.hidden = true; v.replaceChildren(); };
  v.querySelector('.vclose').addEventListener('click', close);
  v.onclick = (e) => { if (e.target === v) close(); };
  v.hidden = false;
  if (c._art) host.querySelector('.card__art')?.addEventListener('click', () => frameEdit(v, host, c), { once: true });
}

// Drag to move, drag a corner (or pinch, or scroll) to zoom. Zooming out shows the window’s background where the
// picture no longer reaches: the bake step has the background painted in there.
function frameEdit(v, host, c) {
  const art = host.querySelector('.card__art'), im = art.querySelector('img.card-art-image'); if (!im) return;
  const was = frames[c._art] ?? null, f = { x: 0, y: 0, z: 1, ...was, py: centreY(im) };
  const ov = document.createElement('div'); ov.className = 'fr-ov';
  ov.innerHTML = '<p class="fr-tip">Drag a corner to zoom in, then drag to move</p><b class="fr-h tl"></b><b class="fr-h tr"></b><b class="fr-h bl"></b><b class="fr-h br"></b>';
  art.appendChild(ov); host.classList.add('framing');
  const read = v.querySelector('.fr-read'), acts = v.querySelector('.fr-acts');
  v.querySelector('.fr-hint').hidden = true; read.hidden = false; acts.hidden = false; v.querySelector('.acts:not(.fr-acts)').hidden = true;
  const pct = (n) => Math.round(Math.abs(n) * 100);
  const show = () => { clampXY(); setFrame(im, f); read.textContent = `Zoom ${pct(f.z)}% · ${f.y < -0.002 ? `up ${pct(f.y)}%` : f.y > 0.002 ? `down ${pct(f.y)}%` : 'level'} · ${f.x < -0.002 ? `left ${pct(f.x)}%` : f.x > 0.002 ? `right ${pct(f.x)}%` : 'centred'}`; };
  // The picture’s edges always stay on the frame’s edges (2026-10-16, Sevaan): zoom 100% or more, and the shift is
  // limited so the zoomed picture still covers the whole 4:3 picture area (x, y in picture widths; height = 0.75 width).
  const clampZ = (z) => Math.min(2.5, Math.max(1, z));
  const clampXY = () => { const e = f.z - 1; f.x = Math.min(e / 2, Math.max(-e / 2, f.x)); f.y = Math.min(0.75 * f.py * e, Math.max(-0.75 * (1 - f.py) * e, f.y)); };
  const pts = new Map(); let start = null;
  const centre = () => { const r = art.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
  const scaleOf = () => art.getBoundingClientRect().width / art.offsetWidth; // the viewer card is drawn at a font size, not a transform, but be safe
  const begin = () => {
    const ps = [...pts.values()], [cx, cy] = centre();
    start = { f: { ...f }, ps: ps.map((p) => [...p]), d: ps.length > 1 ? Math.hypot(ps[0][0] - ps[1][0], ps[0][1] - ps[1][1]) : Math.hypot(ps[0][0] - cx, ps[0][1] - cy), handle: start?.handle };
  };
  ov.addEventListener('pointerdown', (e) => { e.preventDefault(); ov.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); start = { handle: e.target.classList.contains('fr-h') }; begin(); });
  ov.addEventListener('pointermove', (e) => {
    if (!pts.has(e.pointerId) || !start) return; pts.set(e.pointerId, [e.clientX, e.clientY]);
    const ps = [...pts.values()], w = imgW(im) * scaleOf(), [cx, cy] = centre();
    if (ps.length > 1) { const d = Math.hypot(ps[0][0] - ps[1][0], ps[0][1] - ps[1][1]); f.z = clampZ(start.f.z * d / start.d); }
    else if (start.handle) f.z = clampZ(start.f.z * Math.hypot(ps[0][0] - cx, ps[0][1] - cy) / start.d);
    else { f.x = start.f.x + (ps[0][0] - start.ps[0][0]) / w; f.y = start.f.y + (ps[0][1] - start.ps[0][1]) / w; }
    show();
  });
  const up = (e) => { pts.delete(e.pointerId); if (pts.size) begin(); else start = null; };
  ov.addEventListener('pointerup', up); ov.addEventListener('pointercancel', up);
  ov.addEventListener('wheel', (e) => { e.preventDefault(); f.z = clampZ(f.z * Math.exp(-e.deltaY / 500)); show(); }, { passive: false });
  const done = () => { ov.remove(); host.classList.remove('framing'); acts.hidden = true; read.hidden = true; v.querySelector('.acts:not(.fr-acts)').hidden = false; const h = v.querySelector('.fr-hint'); h.hidden = false; art.addEventListener('click', () => frameEdit(v, host, c), { once: true }); };
  v.querySelector('.fr-save').onclick = () => {
    const flat = Math.abs(f.x) < 0.002 && Math.abs(f.y) < 0.002 && Math.abs(f.z - 1) < 0.005;
    if (flat) delete frames[c._art]; else frames[c._art] = { x: +f.x.toFixed(4), y: +f.y.toFixed(4), z: +f.z.toFixed(4), py: +f.py.toFixed(4) };
    saveFrames(); setFrame(im, frames[c._art]); done(); render(); $('copy-frames').textContent = `Copy framing (${Object.keys(frames).length})`; toast(flat ? 'Framing cleared' : `Framing saved for ${c._art}`);
  };
  v.querySelector('.fr-reset').onclick = () => { Object.assign(f, { x: 0, y: 0, z: 1 }); show(); };
  v.querySelector('.fr-cancel').onclick = () => { setFrame(im, was); done(); };
  show();
}

async function boot() {
  const [cat] = await Promise.all([
    fetch('data/catalog.json').then((r) => r.json()).then((d) => { for (const o of d.objects) expandFacts(o); return d; }),
    loadLore(), loadConstellations(), loadComets(),
  ]);
  const seen = new Set();
  cards = buildCards(cat).filter((c) => !seen.has(c.key) && seen.add(c.key));
  await loadNewArt(); await dropBaked(); $('copy-frames').textContent = `Copy framing (${Object.keys(frames).length})`;
  for (const c of cards) { c._name = titleFor(c); c._art = artOf(c); c._type = typeOf(c); if (c._art) usage.set(c._art, (usage.get(c._art) ?? 0) + 1); }
  // Rarest first, then by picture so cards sharing art sit together.
  cards.sort((a, b) => TIERS.indexOf(b.tier) - TIERS.indexOf(a.tier) || String(a._art ?? '~').localeCompare(String(b._art ?? '~')) || a._name.localeCompare(b._name));
  for (const t of [...new Set(cards.map((c) => c._type))].sort()) $('type').add(new Option(t, t));
  for (const t of TIERS.slice().reverse()) $('tier').add(new Option(TIER_INFO[t].label, t));
  render();
}

let deb = 0;
$('q').addEventListener('input', () => { clearTimeout(deb); deb = setTimeout(render, 200); });
for (const id of ['type', 'tier', 'art', 'sort', 'one', 'starred']) $(id).addEventListener('change', render);
for (const id of ['one', 'starred']) $(id).addEventListener('change', () => $(`${id}-l`).classList.toggle('on', $(id).checked));
$('one-l').classList.toggle('on', $('one').checked);
const setSize = () => document.documentElement.style.setProperty('--mini-s', $('size').value);
$('size').addEventListener('input', setSize); setSize();
$('copy').addEventListener('click', async () => {
  const lines = [...stars.values()].map((s) => `- ${s.art ? `art "${s.art}"` : 'drawn art'} · ${s.name} (${s.type}, ${s.tier}, key ${s.key})`);
  const text = `Space Collector cards to redo (${lines.length}):\n${lines.join('\n')}`;
  try { await navigator.clipboard.writeText(text); toast(`Copied ${lines.length} starred`); } catch { prompt('Copy this list:', text); }
});
$('copy-frames').textContent = `Copy framing (${Object.keys(frames).length})`;
$('copy-frames').addEventListener('click', async () => {
  const n = Object.keys(frames).length; if (!n) { toast('No framing saved yet'); return; }
  const text = `Space Collector framing (${n}):\n${JSON.stringify(frames)}`;
  try { await navigator.clipboard.writeText(text); toast(`Copied framing for ${n} picture${n === 1 ? '' : 's'}`); } catch { prompt('Copy this:', text); }
});
$('clear').addEventListener('click', () => { if (stars.size && confirm(`Clear all ${stars.size} stars?`)) { stars.clear(); saveStars(); render(); } });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('view').hidden) { $('view').hidden = true; $('view').replaceChildren(); } });
setInterval(async () => { const n = NEW_ART.size; await loadNewArt(); if (NEW_ART.size !== n) render(); }, 60000); // new pictures appear as they arrive
boot().catch((e) => { $('count').textContent = `Couldn’t load: ${e.message}`; });

$('random').addEventListener('click', () => { mix = randomMix(); render(); scrollTo(0, 0); });
for (const el of document.querySelectorAll('header input, header select, .bar input, .bar select')) for (const ev of ['input', 'change']) el.addEventListener(ev, () => { mix = null; }, true);
