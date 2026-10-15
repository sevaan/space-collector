// Card review (2026-10-14, Sevaan): every card in the game on one page, to scan the art and layout for anything that
// needs redoing. Cards are drawn as collected (so the painted art shows) with the same renderCard as the app. "One per
// picture" shows one card for each art file (most satellites share a picture by kind) with how many cards use it.
// Stars (☆) are saved in this browser (localStorage 'reviewStars'); "Copy starred" puts a list on the clipboard to
// hand back. Not linked from the app.
import { expandFacts } from './catalog-facts.js?v=0.1.708';
import { renderCard, miniCard, artImage } from './card.js?v=0.1.708';
import { buildCards } from './card-model.js?v=0.1.708';
import { TIERS, TIER_INFO } from './rarity.js?v=0.1.708';
import { loadLore, titleFor, debrisOf } from './lore.js?v=0.1.708';
import './stories.js?v=0.1.680';
import { CON_FIGURES } from './con-figures.js?v=0.1.708';
import { loadConstellations, CON_BY_ID } from './constellations.js?v=0.1.708';
import { loadComets } from './comets.js?v=0.1.708';

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
let NEW_ART = new Set();
async function loadNewArt() { try { NEW_ART = new Set(await (await fetch('design/restyle-preview/manifest.json', { cache: 'no-store' })).json()); } catch {} }
function markNew(el, c) {
  const isNew = c._art && NEW_ART.has(c._art);
  if (isNew) for (const im of el.querySelectorAll('.card__art img.card-art-image')) im.src = `design/restyle-preview/${c._art}.webp`;
  return isNew;
}
function face(c, full = false) {
  const sightings = [{ time: SEEN, cardKey: c.key, objectId: c.id }];
  // Every star of its constellation owned, so the figure shows fully in focus (2026-10-15, Sevaan).
  const ownedKeys = c.con ? new Set(CON_BY_ID.get(c.con)?.stars ?? []) : undefined;
  const el = full ? renderCard(c, { sightings, ownedKeys }) : miniCard(c, { sightings, ownedKeys, status: c._art ?? 'drawn' });
  markNew(el, c); return el;
}

// Draw a tile's card only when it scrolls near the screen (there are thousands).
const io = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) { const slot = e.target; io.unobserve(slot); slot.replaceChildren(face(slot._card)); slot.classList.toggle('old-art', !(slot._card._art && NEW_ART.has(slot._card._art))); } }, { rootMargin: '600px 0px' });

function list() {
  const q = $('q').value.trim().toLowerCase(), type = $('type').value, tier = $('tier').value, art = $('art').value, one = $('one').checked, only = $('starred').checked;
  let out = cards.filter((c) => (!type || c._type === type) && (!tier || c.tier === tier) && (!art || (art === 'painted') === !!c._art)
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

function render() {
  const { out, one } = list(), grid = $('grid');
  io.disconnect(); grid.replaceChildren();
  $('count').textContent = `${out.length.toLocaleString()} shown · ${cards.length.toLocaleString()} cards · ${NEW_ART.size} new pictures · ${stars.size} starred`;
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
    <div class="acts"><button type="button" class="vstar">${stars.has(k) ? '★ Starred' : '☆ Star for redo'}</button><button type="button" class="vclose">Close</button></div></div>`;
  v.querySelector('.host').appendChild(face(c, true));
  v.querySelector('.vstar').addEventListener('click', (e) => { toggle(c, k); e.currentTarget.textContent = stars.has(k) ? '★ Starred' : '☆ Star for redo'; render(); });
  const close = () => { v.hidden = true; v.replaceChildren(); };
  v.querySelector('.vclose').addEventListener('click', close);
  v.onclick = (e) => { if (e.target === v) close(); };
  v.hidden = false;
}

async function boot() {
  const [cat] = await Promise.all([
    fetch('data/catalog.json').then((r) => r.json()).then((d) => { for (const o of d.objects) expandFacts(o); return d; }),
    loadLore(), loadConstellations(), loadComets(),
  ]);
  const seen = new Set();
  cards = buildCards(cat).filter((c) => !seen.has(c.key) && seen.add(c.key));
  await loadNewArt();
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
$('clear').addEventListener('click', () => { if (stars.size && confirm(`Clear all ${stars.size} stars?`)) { stars.clear(); saveStars(); render(); } });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('view').hidden) { $('view').hidden = true; $('view').replaceChildren(); } });
setInterval(async () => { const n = NEW_ART.size; await loadNewArt(); if (NEW_ART.size !== n) render(); }, 60000); // new pictures appear as they arrive
boot().catch((e) => { $('count').textContent = `Couldn't load: ${e.message}`; });
