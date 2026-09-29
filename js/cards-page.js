// Card gallery: every collectible object, caught ones in full, uncaught as silhouettes.

import { renderCard, attachTilt, attachGyro } from './card.js';
import { SETS, assignSets } from './sets.js';
import { TIERS, TIER_INFO } from './rarity.js';
import { loadLore } from './lore.js';
import { allSightings } from './store.js';

const $ = (id) => document.getElementById(id);

const state = {
  objects: [],
  sightingsById: new Map(),
  filter: 'all',
  preview: readPref('cards.preview', true),
  list: [],
  index: 0,
};

function readPref(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v === '1'; } catch { return d; } }
function writePref(k, v) { try { localStorage.setItem(k, v ? '1' : '0'); } catch {} }

async function boot() {
  const [cat] = await Promise.all([fetch('data/catalog.json', { cache: 'no-cache' }).then((r) => r.json()), loadLore()]);
  state.objects = cat.objects;
  assignSets(state.objects);
  const order = Object.fromEntries(SETS.map((s, i) => [s.id, i]));
  state.objects.sort((a, b) => order[a.set] - order[b.set] || a.setNumber - b.setNumber);
  try {
    for (const s of await allSightings()) {
      if (s.sim) continue; // sim test captures don't count toward the collection
      if (!state.sightingsById.has(s.objectId)) state.sightingsById.set(s.objectId, []);
      state.sightingsById.get(s.objectId).push(s);
    }
  } catch {}
  $('preview').checked = state.preview;
  renderChips();
  render();
  // cards.html#25544 opens that card straight away (used after a capture).
  const id = Number(location.hash.slice(1));
  if (id) {
    const i = state.list.findIndex((o) => o.id === id);
    if (i >= 0) openViewer(i);
  }
}

function renderChips() {
  const chips = [
    { id: 'all', label: 'All' },
    { id: 'caught', label: 'Caught' },
    ...TIERS.slice().reverse().map((t) => ({ id: `tier:${t}`, label: TIER_INFO[t].label, dot: TIER_INFO[t].color })),
    ...SETS.map((s) => ({ id: `set:${s.id}`, label: s.name, dot: s.color })),
  ];
  $('chips').innerHTML = '';
  for (const c of chips) {
    const b = document.createElement('button');
    b.className = `chip${state.filter === c.id ? ' on' : ''}`;
    b.innerHTML = `${c.dot ? `<span class="dot" style="background:${c.dot}"></span>` : ''}${c.label}`;
    b.addEventListener('click', () => { state.filter = c.id; renderChips(); render(); });
    $('chips').appendChild(b);
  }
}

function matches(o) {
  const f = state.filter;
  if (f === 'all') return true;
  if (f === 'caught') return state.sightingsById.has(o.id);
  if (f.startsWith('tier:')) return o.tier === f.slice(5);
  if (f.startsWith('set:')) return o.set === f.slice(4);
  return true;
}

function cardFor(o) {
  return renderCard(o, { sightings: state.sightingsById.get(o.id) ?? [], preview: state.preview });
}

function render() {
  const caught = state.objects.filter((o) => state.sightingsById.has(o.id)).length;
  $('count').textContent = `${caught} / ${state.objects.length} caught`;
  state.list = state.objects.filter(matches);
  const grid = $('grid');
  grid.innerHTML = '';
  if (!state.list.length) {
    grid.innerHTML = `<div class="empty">${state.filter === 'caught' ? 'No catches yet. Head outside after dusk and point at a moving light.' : 'Nothing here.'}</div>`;
    return;
  }
  const frag = document.createDocumentFragment();
  state.list.forEach((o, i) => {
    const el = cardFor(o);
    el.addEventListener('click', () => openViewer(i));
    frag.appendChild(el);
  });
  grid.appendChild(frag);
}

$('preview').addEventListener('change', (e) => {
  state.preview = e.target.checked;
  writePref('cards.preview', state.preview);
  render();
});

// ---------- viewer ----------

let stopGyro = null;
let tilt = null;

function cardFontSize() {
  const w = window.innerWidth - 32, h = window.innerHeight - 170;
  return Math.max(6, Math.min(w / 28, h / 39.2, 14));
}

function showCard() {
  const o = state.list[state.index];
  const el = cardFor(o);
  el.style.fontSize = `${cardFontSize()}px`;
  $('slot').replaceChildren(el);
  tilt = attachTilt(el);
  if (stopGyro) { stopGyro(); stopGyro = attachGyro(el, tilt); }
}

function openViewer(i) {
  state.index = i;
  $('viewer').hidden = false;
  showCard();
}

function step(d) {
  state.index = (state.index + d + state.list.length) % state.list.length;
  showCard();
}

$('v-close').addEventListener('click', () => { $('viewer').hidden = true; stopGyro?.(); stopGyro = null; });
$('v-prev').addEventListener('click', () => step(-1));
$('v-next').addEventListener('click', () => step(1));
document.addEventListener('keydown', (e) => {
  if ($('viewer').hidden) return;
  if (e.key === 'ArrowLeft') step(-1);
  if (e.key === 'ArrowRight') step(1);
  if (e.key === 'Escape') $('v-close').click();
});

// Swipe left/right on the viewer background to change cards.
let swipe = null;
$('viewer').addEventListener('pointerdown', (e) => { if (e.target === $('viewer') || e.target === $('slot')) swipe = { x: e.clientX, y: e.clientY }; });
$('viewer').addEventListener('pointerup', (e) => {
  if (!swipe) return;
  const dx = e.clientX - swipe.x;
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(e.clientY - swipe.y)) step(dx < 0 ? 1 : -1);
  swipe = null;
});

$('v-gyro').addEventListener('click', async () => {
  if (stopGyro) { stopGyro(); stopGyro = null; $('v-gyro').textContent = 'Tilt with phone'; tilt?.reset(); return; }
  try {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      if (await DeviceOrientationEvent.requestPermission() !== 'granted') return;
    }
  } catch { return; }
  stopGyro = attachGyro($('slot').firstElementChild, tilt);
  $('v-gyro').textContent = 'Stop tilt';
});

window.addEventListener('resize', () => { if (!$('viewer').hidden) $('slot').firstElementChild.style.fontSize = `${cardFontSize()}px`; });

boot();
