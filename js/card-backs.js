import { SETS, goldAlbums } from './sets.js?v=0.1.1183';
import { isPlus } from './plus.js?v=0.1.1183';
// Card backs you can choose (2026-10-16, design/card-backs.html, Sevaan liked all six). Mission Control is everyone’s;
// Plus unlocks the rest; two can also be earned free: Golden Record (find the Pale Blue Dot story) and Star Chart
// (complete 10 constellations); main.js writes what’s been earned to localStorage 'backEarned'. The choice is
// localStorage 'cardBack': a back’s id, or 'random' for a different unlocked one each time a card turns over.
export const CARD_BACKS = [
  { id: 'mission-control', bg: '#01121c', name: 'Mission Control', url: 'assets/art/backs/back-collector.webp', title: 'middle', free: true },
  { id: 'golden-record', bg: '#031622', name: 'Golden Record', url: 'assets/art/backs/back-golden-record.webp', title: 'middle', earn: 'Find the Pale Blue Dot story' },
  { id: 'star-chart', bg: '#02151e', name: 'Star Chart', url: 'assets/art/backs/back-star-chart.webp', title: 'middle', earn: 'Complete 10 constellations' },
  { id: 'mission-patch', bg: '#071723', name: 'Mission Patch', url: 'assets/art/backs/back-mission-patch.webp', title: 'middle' },
  { id: 'blueprint', bg: '#124e87', name: 'Blueprint', url: 'assets/art/backs/back-blueprint.webp', title: 'middle' },
  { id: 'aurora', bg: '#021520', name: 'Northern Lights', url: 'assets/art/backs/back-aurora.webp', title: 'middle' },
  { id: 'nebula-foil', bg: '#152338', name: 'Nebula Foil', url: 'assets/art/backs/back-nebula-foil.webp', title: 'middle' },
];
const read = (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } };
export const backEarned = () => { try { return new Set(JSON.parse(read('backEarned', '[]'))); } catch { return new Set(); } };
export const backUnlocked = (b) => !!b && (b.free || isPlus() || backEarned().has(b.id));
export const chosenBack = () => read('cardBack', 'mission-control');
export function chooseBack(id) { try { localStorage.setItem('cardBack', id); } catch {} last = null; next = pick(); preload(next); }
const pool = () => { const c = chosenBack(); if (c === 'random') { const u = CARD_BACKS.filter(backUnlocked); return u.length ? u : [CARD_BACKS[0]]; } const b = CARD_BACKS.find((x) => x.id === c); return [backUnlocked(b) ? b : CARD_BACKS[0]]; };
let last = null;
const pick = () => { const P = pool(); let b; do b = P[Math.floor(Math.random() * P.length)]; while (b === last && P.length > 1); return b; };
const preload = (b) => { const i = new Image(); i.decoding = 'async'; i.src = b.url; };

let next = pick();
preload(next);

// The very next back shown is this one, once (2026-10-24, Sevaan): the catch that earns a back is sealed in it.
let once = null;
export function showBackNext(id) { const b = CARD_BACKS.find((x) => x.id === id); if (!b) return; once = b; preload(b); }
// The back to show now ({ url, title }); queues and preloads the next one (a different one when Random is chosen).
export function nextBack() {
  if (once) { const b = once; once = null; last = b; return b; }
  const P = pool(); const b = P.includes(next) ? next : pick();
  last = b; next = pick(); preload(next);
  return b;
}

// Put a random back on an element (its background), marking where the poster’s title sits.
// o (optional): the card. A card from an album you’ve filled to gold wears that album’s back: the seal framed in the
// album’s colour with its name across the bottom (2026-10-10, playtest #17).
export function applyBack(el, o = null) {
  if (!el) return null;
  const b = nextBack();
  el.style.backgroundImage = `url('${b.url}')`; el.style.backgroundColor = b.bg ?? ''; // the picture's own edge colour fills any margin round it (2026-10-21: the reveal card is a little wider than the pictures)
  el.dataset.title = b.title;
  const set = o?.set && goldAlbums().has(o.set) ? SETS.find((s) => s.id === o.set) : null;
  el.classList.toggle('back--album', !!set);
  if (set) { el.dataset.album = `${set.name} · gold album`; el.style.setProperty('--album', set.color); } else { delete el.dataset.album; }
  return b;
}
