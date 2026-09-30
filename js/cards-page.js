import { renderCard, renderCardTile, attachTilt, attachGyro } from './card.js?v=0.1.23';
import { buildCards, cardKeyFor } from './card-model.js?v=0.1.23';
import { SETS, assignSets } from './sets.js?v=0.1.23';
import { TIERS, TIER_INFO } from './rarity.js?v=0.1.23';
import { loadLore, titleFor, factFor } from './lore.js?v=0.1.23';
import { allSightings, deleteSighting } from './store.js?v=0.1.23';

const $ = (id) => document.getElementById(id);
const state = { cards: [], byKey: new Map(), sightingsByKey: new Map(), seenMembers: new Map(), view: 'owned', query: '', set: 'all', rarity: 'all', list: [], index: 0, preview: false, ready: false };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const hasSightings = (c) => state.sightingsByKey.has(c.key);
const dateLabel = (time) => new Date(time).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function notice(message) { $('notice').hidden = !message; $('notice').textContent = message; }
function setNight(on) {
  document.documentElement.dataset.theme = on ? 'night' : 'default';
  document.body.classList.toggle('night', on);
  $('night-toggle').setAttribute('aria-pressed', String(on));
  $('night-toggle').setAttribute('aria-label', on ? 'Turn off red night mode' : 'Turn on red night mode');
  document.querySelector('meta[name=theme-color]').content = on ? '#090303' : '#080f18';
}
setNight(document.documentElement.dataset.theme === 'night');
$('night-toggle').addEventListener('click', () => {
  const on = document.documentElement.dataset.theme !== 'night';
  setNight(on);
  try { localStorage.setItem('night', on ? '1' : '0'); } catch {}
});
window.addEventListener('storage', (e) => { if (e.key === 'night') setNight(e.newValue === '1'); });

for (const set of SETS) $('set-filter').add(new Option(set.name, set.id));
for (const tier of TIERS.slice().reverse()) $('rarity-filter').add(new Option(TIER_INFO[tier].label, tier));

async function boot() {
  const [catalogueResult, sightingResult] = await Promise.allSettled([
    fetch('data/catalog.json', { cache: 'no-cache' }).then((r) => { if (!r.ok) throw new Error('catalogue'); return r.json(); }),
    allSightings(),
    loadLore(),
  ]);
  const cat = catalogueResult.status === 'fulfilled' ? catalogueResult.value : { objects: [] };
  state.cards = buildCards(cat);
  state.byKey = new Map(state.cards.map((c) => [c.key, c]));
  const keyOfId = new Map(cat.objects.map((o) => [String(o.id), cardKeyFor(o)]));
  const sightings = sightingResult.status === 'fulfilled' ? sightingResult.value : [];
  for (const s of sightings) {
    if (s.sim) continue;
    const key = String(s.cardKey ?? keyOfId.get(String(s.objectId)) ?? s.objectId);
    if (!state.sightingsByKey.has(key)) state.sightingsByKey.set(key, []);
    state.sightingsByKey.get(key).push(s);
    if (!state.seenMembers.has(key)) state.seenMembers.set(key, new Set());
    state.seenMembers.get(key).add(s.objectId);
    // A saved card stays in the collection after it leaves the current orbital catalogue.
    if (!state.byKey.has(key)) {
      const saved = s.cardSnapshot ?? { id: s.objectId, name: s.name ?? `Object ${s.objectId}`, type: s.type ?? 'satellite', year: s.year, tier: 'common' };
      const card = { ...saved, key, archived: true };
      if (!card.set) assignSets([card]);
      state.cards.push(card); state.byKey.set(key, card);
    }
  }
  if (catalogueResult.status === 'rejected') notice('The catalogue could not load. Your saved field records are still shown. Refresh to try again.');
  if (sightingResult.status === 'rejected') notice('Your saved sightings could not be opened. You can explore the field guide; refresh to retry your collection.');
  state.ready = true;
  render();
  let key = '';
  try { key = decodeURIComponent(location.hash.slice(1)); } catch {}
  if (key && state.byKey.has(key)) {
    if (!state.sightingsByKey.has(key)) setView('discover');
    openViewer(state.list.findIndex((c) => c.key === key));
  } else if (key) notice('That card is not in this catalogue or your saved collection. Search the field guide to find another target.');
}

function matches(c) {
  if (state.view === 'owned' && !hasSightings(c)) return false;
  if (state.set !== 'all' && c.set !== state.set) return false;
  if (state.rarity !== 'all' && c.tier !== state.rarity) return false;
  if (state.query) {
    const haystack = `${titleFor(c)} ${c.name} ${c.id} ${c.cospar ?? ''} ${factFor(c)} ${SETS.find((s) => s.id === c.set)?.name ?? ''}`.toLowerCase();
    if (!haystack.includes(state.query)) return false;
  }
  return true;
}

const observer = new IntersectionObserver((entries) => {
  for (const { isIntersecting, target } of entries) {
    if (!isIntersecting) continue;
    observer.unobserve(target);
    const c = state.byKey.get(target.dataset.key);
    if (!c) continue;
    const tile = renderCardTile(c, { sightings: state.sightingsByKey.get(c.key) ?? [] });
    tile.addEventListener('click', () => openViewer(state.list.findIndex((card) => card.key === c.key)));
    target.replaceChildren(tile);
  }
}, { rootMargin: '500px 0px' });

function render() {
  const caught = state.cards.filter(hasSightings).length;
  $('owned-count').textContent = caught.toLocaleString();
  $('count').textContent = caught ? `${caught.toLocaleString()} ${caught === 1 ? 'story' : 'stories'} collected. Every one, a moment under the sky.` : 'Real objects. Remarkable stories. Yours to discover.';
  state.list = state.cards.filter(matches).sort((a, b) => {
    if (state.view === 'owned') return (state.sightingsByKey.get(b.key)?.[0]?.time ?? 0) - (state.sightingsByKey.get(a.key)?.[0]?.time ?? 0);
    // Lead discovery with the familiar ISS and distinctive rarities, then catalogue order.
    if (String(a.id) === '25544') return -1;
    if (String(b.id) === '25544') return 1;
    return TIERS.indexOf(b.tier) - TIERS.indexOf(a.tier) || (a.set ?? '').localeCompare(b.set ?? '') || (a.setNumber ?? 0) - (b.setNumber ?? 0);
  });
  const total = state.list.length;
  $('results').textContent = `${total.toLocaleString()} ${total === 1 ? 'card' : 'cards'}${state.view === 'owned' ? ' in your collection' : ' in the field guide'}`;
  $('reset-filters').hidden = !state.query && state.set === 'all' && state.rarity === 'all';
  observer.disconnect();
  $('grid').replaceChildren();
  if (!total) {
    const empty = document.createElement('div'); empty.className = 'empty';
    if (state.view === 'owned' && !caught) {
      empty.innerHTML = '<span class="empty__orbit" aria-hidden="true">✧</span><h2>Your first story is up there.</h2><p>Record a sighting in the live sky to earn your first card. The ISS is a wonderful place to start.</p><a href="./?resume=1">Explore the sky ↗</a><button type="button" class="secondary">Browse the field guide</button>';
      empty.querySelector('button').addEventListener('click', () => setView('discover'));
    } else {
      empty.innerHTML = '<span class="empty__orbit" aria-hidden="true">⌕</span><h2>No cards found.</h2><p>Try a different name, collection or rarity.</p><button type="button">Clear filters</button>';
      empty.querySelector('button').addEventListener('click', resetFilters);
    }
    $('grid').append(empty); return;
  }
  const frag = document.createDocumentFragment();
  for (const c of state.list) {
    const slot = document.createElement('div'); slot.className = 'tile-slot'; slot.dataset.key = c.key;
    frag.append(slot);
  }
  $('grid').append(frag);
  for (const slot of $('grid').children) observer.observe(slot);
}
function setView(view) {
  state.view = view;
  $('tab-owned').setAttribute('aria-pressed', String(view === 'owned'));
  $('tab-discover').setAttribute('aria-pressed', String(view === 'discover'));
  if (state.ready) render();
}
function resetFilters() {
  state.query = ''; state.set = 'all'; state.rarity = 'all';
  $('search').value = ''; $('set-filter').value = 'all'; $('rarity-filter').value = 'all';
  if (state.ready) render();
}
$('tab-owned').addEventListener('click', () => setView('owned'));
$('tab-discover').addEventListener('click', () => setView('discover'));
$('reset-filters').addEventListener('click', resetFilters);
let searchTimer;
$('search').addEventListener('input', (e) => { clearTimeout(searchTimer); state.query = e.target.value.trim().toLowerCase(); searchTimer = setTimeout(() => { if (state.ready) render(); }, 120); });
$('set-filter').addEventListener('change', (e) => { state.set = e.target.value; if (state.ready) render(); });
$('rarity-filter').addEventListener('change', (e) => { state.rarity = e.target.value; if (state.ready) render(); });

let tilt = null, stopGyro = null, lastFocus = null;
function stopEffects() { stopGyro?.(); stopGyro = null; tilt?.destroy(); tilt = null; }

// Phone tilt is always on in the viewer. iOS needs permission once, asked from the tap that opens a card.
let motionPermission = typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function' ? 'unknown' : 'granted';
function askMotion() {
  if (motionPermission !== 'unknown') return;
  motionPermission = 'asking';
  DeviceOrientationEvent.requestPermission()
    .then((r) => { motionPermission = r === 'granted' ? 'granted' : 'denied'; if (motionPermission === 'granted' && tilt && !stopGyro) stopGyro = attachGyro($('slot').firstElementChild, tilt); })
    .catch(() => { motionPermission = 'unknown'; }); // not from a tap (e.g. a deep link); try again on the next tap
}
function showCard() {
  stopEffects();
  const c = state.list[state.index]; if (!c) return;
  const sightings = state.sightingsByKey.get(c.key) ?? [];
  const el = renderCard(c, { sightings, seenMembers: state.seenMembers.get(c.key)?.size ?? 0, preview: state.preview });
  $('slot').replaceChildren(el);
  tilt = attachTilt(el);
  if (!reducedMotion.matches && motionPermission !== 'denied') stopGyro = attachGyro(el, tilt);
  $('v-position').textContent = `${state.index + 1} / ${state.list.length.toLocaleString()}`;
  const firstTime = sightings.length ? Math.min(...sightings.map((s) => s.time)) : 0;
  $('v-status').textContent = sightings.length ? `Collected ${dateLabel(firstTime)}${c.archived ? ' · saved from an earlier catalogue' : ''}` : state.preview ? 'Artwork preview · this card has not been added to your collection.' : 'Not yet collected · record a live sighting to earn this card.';
  $('v-preview').hidden = sightings.length > 0;
  $('v-preview').textContent = state.preview ? 'Back to uncollected card' : 'Preview artwork & story';
  $('v-history').replaceChildren();
  if (sightings.length) {
    const heading = document.createElement('h2');
    heading.textContent = sightings.length === 1 ? 'When you saw it' : `When you saw it · ${sightings.length} times`;
    $('v-history').append(heading);
    const points = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    for (const s of [...sightings].sort((a, b) => b.time - a.time)) {
      const row = document.createElement('p');
      const when = `${dateLabel(s.time)} · ${new Date(s.time).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
      const where = s.el != null ? `${Math.round(s.el)}° up in the ${points[Math.round(((s.az % 360) + 360) % 360 / 45) % 8]}` : '';
      row.innerHTML = `<span>${esc(when)}</span><span>${esc(where)}</span><button type="button" class="history-delete" aria-label="Delete this sighting">×</button>`;
      row.querySelector('button').addEventListener('click', async () => {
        if (!confirm('Delete this sighting? If it was your only one, the card leaves your collection.')) return;
        try { await deleteSighting(s.key); } catch { notice('That sighting could not be deleted. Try again.'); return; }
        const left = (state.sightingsByKey.get(c.key) ?? []).filter((x) => x.key !== s.key);
        if (left.length) state.sightingsByKey.set(c.key, left); else { state.sightingsByKey.delete(c.key); state.seenMembers.delete(c.key); }
        showCard(); render();
      });
      $('v-history').append(row);
    }
  }
}
function openViewer(i) {
  if (i < 0 || i >= state.list.length) return;
  askMotion();
  state.index = i; state.preview = false;
  lastFocus = document.activeElement;
  showCard();
  $('viewer').showModal();
  document.body.style.overflow = 'hidden';
  $('v-close').focus();
  $('viewer').querySelector('.viewer-scroll').scrollTop = 0;
}
function step(d) {
  state.index = (state.index + d + state.list.length) % state.list.length;
  state.preview = false;
  showCard();
  $('viewer').querySelector('.viewer-scroll').scrollTop = 0;
}

// Swipe between cards. A clear sideways drag (or a quick flick) moves the card with your finger and
// changes card on release; anything else is a touch that tilts the card.
const slot = $('slot');
let swipe = null;
function slideTo(x, ms) {
  slot.style.transition = ms ? `transform ${ms}ms cubic-bezier(.2,.8,.3,1), opacity ${ms}ms` : 'none';
  slot.style.transform = x ? `translateX(${x}px) rotate(${x / 40}deg)` : '';
  slot.style.opacity = x ? String(Math.max(0.3, 1 - Math.abs(x) / window.innerWidth)) : '';
}
slot.addEventListener('pointerdown', (e) => {
  if (state.list.length < 2 || (e.pointerType === 'mouse' && e.button !== 0)) return;
  swipe = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), dx: 0, active: false };
});
slot.addEventListener('pointermove', (e) => {
  if (!swipe || e.pointerId !== swipe.id) return;
  const dx = e.clientX - swipe.x, dy = e.clientY - swipe.y;
  if (!swipe.active && Math.abs(dx) > 14 && Math.abs(dx) > Math.abs(dy) * 1.3) {
    swipe.active = true;
    slot.setPointerCapture(e.pointerId);
    const card = slot.firstElementChild;
    if (card) card.dataset.swiping = '1';
    tilt?.reset();
  }
  if (swipe.active) { swipe.dx = dx; slideTo(dx, 0); }
});
function endSwipe(e) {
  if (!swipe || e.pointerId !== swipe.id) return;
  const { active, dx, t } = swipe;
  swipe = null;
  const card = slot.firstElementChild;
  if (card) delete card.dataset.swiping;
  if (!active) return;
  const fast = Math.abs(dx) / Math.max(1, performance.now() - t) > 0.5; // px per ms
  if (Math.abs(dx) > window.innerWidth * 0.22 || (fast && Math.abs(dx) > 40)) {
    const dir = dx < 0 ? 1 : -1;
    slideTo(-dir * window.innerWidth, 180);
    setTimeout(() => {
      step(dir);
      slideTo(dir * window.innerWidth * 0.6, 0); // new card comes in from the other side
      requestAnimationFrame(() => requestAnimationFrame(() => slideTo(0, 220)));
    }, 180);
  } else slideTo(0, 200);
}
slot.addEventListener('pointerup', endSwipe);
slot.addEventListener('pointercancel', endSwipe);
$('v-close').addEventListener('click', () => $('viewer').close());
$('viewer').addEventListener('close', () => { stopEffects(); document.body.style.overflow = ''; lastFocus?.focus(); });
$('slot').addEventListener('pointerdown', askMotion);
$('v-preview').addEventListener('click', () => { state.preview = !state.preview; showCard(); });
$('viewer').addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); step(e.key === 'ArrowLeft' ? -1 : 1); }
});
reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) { stopGyro?.(); stopGyro = null; tilt?.reset(); } });
boot().catch(() => {
  notice('The field guide could not open. Refresh this page to try again.');
  $('count').textContent = 'Your next discovery is waiting.';
  $('grid').replaceChildren();
});
