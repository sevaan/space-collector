// Card gallery: every collectible card, caught ones in full, uncaught as silhouettes.
// Constellation satellites (Starlink, OneWeb, ...) share one card per launch.

import { renderCard, attachTilt, attachGyro } from './card.js?v=0.1.12';
import { SETS, assignSets } from './sets.js?v=0.1.12';
import { TIERS, TIER_INFO } from './rarity.js?v=0.1.12';
import { loadLore } from './lore.js?v=0.1.12';
import { allSightings } from './store.js?v=0.1.12';

const $ = (id) => document.getElementById(id);

const state = {
  cards: [],
  byKey: new Map(),
  sightingsByKey: new Map(),
  seenMembers: new Map(), // card key -> Set of object ids seen
  filter: 'all',
  preview: readPref('cards.preview', true),
  list: [],
  index: 0,
};

function readPref(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v === '1'; } catch { return d; } }
function writePref(k, v) { try { localStorage.setItem(k, v ? '1' : '0'); } catch {} }

const avg = (list, f) => {
  const v = list.map(f).filter((x) => x != null);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
};

// Turn catalogue objects into cards: one per object, or one per launch for constellations.
function buildCards(cat) {
  const groups = new Map();
  for (const o of cat.objects) {
    const key = o.card ?? String(o.id);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(o);
  }
  const cards = [];
  for (const [key, members] of groups) {
    const first = members[0];
    if (!first.family) { cards.push({ ...first, key }); continue; }
    const fam = cat.families?.[first.family] ?? { name: first.family };
    cards.push({
      key,
      id: key,
      family: first.family,
      familyName: fam.name,
      maker: fam.maker,
      owner: fam.owner,
      name: `${fam.name} launch`,
      cospar: first.cospar?.slice(0, 8),
      launch: first.launch,
      year: first.launch ? Number(first.launch.slice(0, 4)) : null,
      kind: 'PAY', type: 'satellite', tier: 'common',
      bino: members.every((m) => m.bino) ? 1 : undefined,
      period: avg(members, (m) => m.period),
      incl: avg(members, (m) => m.incl),
      apogee: avg(members, (m) => m.apogee),
      perigee: avg(members, (m) => m.perigee),
      members: members.map((m) => m.id),
    });
  }
  return cards;
}

async function boot() {
  const [cat] = await Promise.all([fetch('data/catalog.json', { cache: 'no-cache' }).then((r) => r.json()), loadLore()]);
  const keyOfId = new Map(cat.objects.map((o) => [o.id, o.card ?? String(o.id)]));
  state.cards = buildCards(cat);
  assignSets(state.cards);
  const order = Object.fromEntries(SETS.map((s, i) => [s.id, i]));
  state.cards.sort((a, b) => order[a.set] - order[b.set] || a.setNumber - b.setNumber);
  state.byKey = new Map(state.cards.map((c) => [c.key, c]));
  try {
    for (const s of await allSightings()) {
      if (s.sim) continue; // sim test captures don't count toward the collection
      const key = s.cardKey ?? keyOfId.get(s.objectId) ?? String(s.objectId);
      if (!state.sightingsByKey.has(key)) state.sightingsByKey.set(key, []);
      state.sightingsByKey.get(key).push(s);
      if (!state.seenMembers.has(key)) state.seenMembers.set(key, new Set());
      state.seenMembers.get(key).add(s.objectId);
    }
  } catch {}
  $('preview').checked = state.preview;
  renderChips();
  render();
  // cards.html#25544 or #STARLINK:2026-123 opens that card straight away (used after a capture).
  const key = decodeURIComponent(location.hash.slice(1));
  if (key) {
    state.filter = 'all';
    const i = state.list.findIndex((c) => c.key === key);
    if (i >= 0) openViewer(i);
  }
}

function renderChips() {
  const chips = [
    { id: 'all', label: 'All' },
    { id: 'caught', label: 'Caught' },
    ...TIERS.slice().reverse().map((t) => ({ id: `tier:${t}`, label: TIER_INFO[t].label, dot: TIER_INFO[t].color })),
    { id: 'bino', label: 'Binoculars', dot: '#3b6fb6' },
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

function matches(c) {
  const f = state.filter;
  if (f === 'all') return true;
  if (f === 'caught') return state.sightingsByKey.has(c.key);
  if (f === 'bino') return !!c.bino;
  if (f.startsWith('tier:')) return c.tier === f.slice(5);
  if (f.startsWith('set:')) return c.set === f.slice(4);
  return true;
}

function cardFor(c) {
  return renderCard(c, {
    sightings: state.sightingsByKey.get(c.key) ?? [],
    seenMembers: state.seenMembers.get(c.key)?.size ?? 0,
    preview: state.preview,
  });
}

// Thousands of cards: render each one only when it scrolls near the screen.
const observer = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    const slot = e.target;
    observer.unobserve(slot);
    const i = Number(slot.dataset.i);
    const el = cardFor(state.list[i]);
    el.addEventListener('click', () => openViewer(i));
    slot.replaceChildren(el);
  }
}, { rootMargin: '800px 0px' });

function render() {
  const caught = state.cards.filter((c) => state.sightingsByKey.has(c.key)).length;
  $('count').textContent = `${caught.toLocaleString()} / ${state.cards.length.toLocaleString()} caught`;
  state.list = state.cards.filter(matches);
  const grid = $('grid');
  observer.disconnect();
  grid.innerHTML = '';
  if (!state.list.length) {
    grid.innerHTML = `<div class="empty">${state.filter === 'caught' ? 'No catches yet. Head outside after dusk and point at a moving light.' : 'Nothing here.'}</div>`;
    return;
  }
  const frag = document.createDocumentFragment();
  state.list.forEach((c, i) => {
    const slot = document.createElement('div');
    slot.className = 'slot';
    slot.dataset.i = i;
    frag.appendChild(slot);
  });
  grid.appendChild(frag);
  for (const slot of grid.children) observer.observe(slot);
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
  const el = cardFor(state.list[state.index]);
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

$('v-close').addEventListener('click', () => { $('viewer').hidden = true; stopGyro?.(); stopGyro = null; $('v-gyro').textContent = 'Tilt with phone'; });
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
