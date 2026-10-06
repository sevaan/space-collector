import { renderCard, renderCardTile, renderPassport, attachTilt, attachGyro, attachFlip, artImage, throwOff } from './card.js?v=0.1.154';
import { cardArt } from './art.js?v=0.1.154';
import { buildCards, cardKeyFor, normalizeSighting } from './card-model.js?v=0.1.154';
import { applyBack } from './card-backs.js?v=0.1.154';
import { SETS, assignSets } from './sets.js?v=0.1.154';
import { TIERS, TIER_INFO } from './rarity.js?v=0.1.154';
import { loadLore, titleFor, factFor } from './lore.js?v=0.1.154';
import { loadConstellations, CONSTELLATIONS } from './constellations.js?v=0.1.154';
import { progress } from './progress.js?v=0.1.154';
import { SOLAR_SYSTEM } from './natural.js?v=0.1.154';
import { eventBadges, nextEvent, passIcs } from './events.js?v=0.1.154';
import { drawShareCard, shareCard } from './share-card.js?v=0.1.154';
import { conArt } from './con-art.js?v=0.1.154';
import { CON_BY_ID } from './constellations.js?v=0.1.154';
import { allSightings, deleteSighting } from './store.js?v=0.1.154';
import { addStarfield, attachTileTilt } from './starfield.js?v=0.1.154';

const $ = (id) => document.getElementById(id);
const state = { raw: [], cards: [], byKey: new Map(), sightingsByKey: new Map(), seenMembers: new Map(), view: 'owned', query: '', set: 'all', rarity: 'all', list: [], index: 0, preview: false, ready: false };
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
    loadConstellations(),
  ]);
  const cat = catalogueResult.status === 'fulfilled' ? catalogueResult.value : { objects: [] };
  state.cards = buildCards(cat);
  state.byKey = new Map(state.cards.map((c) => [c.key, c]));
  const keyOfId = new Map(cat.objects.map((o) => [String(o.id), cardKeyFor(o)]));
  const sightings = sightingResult.status === 'fulfilled' ? sightingResult.value : [];
  for (const raw of sightings) {
    if (raw.sim) continue;
    // Launch-keyed sightings from before fleet cards read as fleet card + stamp.
    const s = normalizeSighting(raw.cardKey ? raw : { ...raw, cardKey: keyOfId.get(String(raw.objectId)) ?? String(raw.objectId) });
    const key = s.cardKey;
    state.raw.push(s);
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
  linkConstellations();
  if (catalogueResult.status === 'rejected') notice('The catalogue could not load. Your saved field records are still shown. Refresh to try again.');
  if (sightingResult.status === 'rejected') notice('Your saved sightings could not be opened. You can explore the field guide; refresh to retry your collection.');
  state.ready = true;
  render();
  let key = '';
  try { key = decodeURIComponent(location.hash.slice(1)); } catch {}
  if (!state.byKey.has(key) && /^[A-Z]+:/.test(key)) key = key.split(':')[0]; // old launch-card link
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
    const tile = renderCardTile(c, { sightings: state.sightingsByKey.get(c.key) ?? [], ownedKeys: c.natural === 'constellation' ? ownedKeys() : undefined });
    tile.addEventListener('click', () => openViewer(state.list.findIndex((card) => card.key === c.key), tile.getBoundingClientRect()));
    target.replaceChildren(tile);
  }
}, { rootMargin: '500px 0px' });

// ---------- albums ----------
// One album per set. Goals scale with the set's size, so every album has a reachable gold:
// small sets (<= 30 cards) are completed; bigger ones aim for 100 or 200 cards.
export function albumGoals(n) { return n <= 30 ? [1, Math.ceil(n / 2), n] : n <= 300 ? [10, 50, 100] : [10, 50, 200]; }
const LEVELS = ['Bronze', 'Silver', 'Gold'];
function albumStats(setId) {
  const cards = state.cards.filter((c) => c.set === setId && !c.archived), have = cards.filter(hasSightings);
  const goals = albumGoals(cards.length), level = goals.filter((g) => have.length >= g).length; // 0..3
  return { cards, have, goals, level, next: goals[level] ?? null };
}
function albumBar({ have, goals, cards }) {
  const top = goals[2], pct = (n) => Math.min(100, (n / top) * 100);
  return `<div class="album-bar"><i style="width:${pct(have.length)}%"></i>${goals.map((g, i) => `<b class="g${i}${have.length >= g ? ' hit' : ''}" style="left:${pct(g)}%" title="${LEVELS[i]} at ${g}"></b>`).join('')}</div>`;
}
function renderAlbums() {
  $('grid').replaceChildren();
  const frag = document.createDocumentFragment();
  for (const set of SETS) {
    const st = albumStats(set.id); if (!st.cards.length) continue;
    const latest = st.have.slice().sort((a, b) => (state.sightingsByKey.get(b.key)?.[0]?.time ?? 0) - (state.sightingsByKey.get(a.key)?.[0]?.time ?? 0))[0];
    const show = latest ?? st.cards.find((c) => c.tier === 'legendary') ?? st.cards[0];
    const img = artImage(show, 'small'); // the set's best card, dimmed (CSS .album.empty) until you own one
    const b = document.createElement('button'); b.type = 'button';
    b.className = `album${st.level === 3 ? ' gold' : ''}${latest ? '' : ' empty'}`; b.style.setProperty('--set', set.color);
    b.innerHTML = `<span class="album__art">${img ? `<img src="${img}" alt="" loading="lazy">` : cardArt(show, { accent: set.color, silhouette: !latest })}</span>
      <span class="album__body"><span class="album__name">${esc(set.name)}</span>
      <span class="album__count"><b>${st.have.length.toLocaleString()}</b> / ${st.cards.length.toLocaleString()}${st.level ? ` · ${LEVELS[st.level - 1].toUpperCase()}` : ''}</span>
      ${albumBar(st)}<span class="album__next">${st.level === 3 ? 'Gold album' : `${(st.next - st.have.length).toLocaleString()} more for ${LEVELS[st.level]}`}</span></span>`;
    b.addEventListener('click', () => { state.set = set.id; $('set-filter').value = set.id; setView('discover'); window.scrollTo({ top: $('grid').offsetTop - 160, behavior: 'smooth' }); });
    frag.append(b);
  }
  $('grid').append(frag);
  $('results').textContent = 'Fill each album to turn it gold.';
}
function renderAlbumHead() {
  const head = $('album-head');
  if (state.set === 'all' || state.view === 'albums') { head.hidden = true; return; }
  const set = SETS.find((s) => s.id === state.set), st = albumStats(state.set);
  head.hidden = false; head.style.setProperty('--set', set.color); head.classList.toggle('gold', st.level === 3);
  head.innerHTML = `<div><span class="album__name">${esc(set.name)}</span><span class="album__count"><b>${st.have.length.toLocaleString()}</b> / ${st.cards.length.toLocaleString()} collected${st.level ? ` · ${LEVELS[st.level - 1]} album` : ''}</span></div>${albumBar(st)}
    <span class="album__next">${st.level === 3 ? 'Gold album. Every card here is a bonus.' : `${(st.next - st.have.length).toLocaleString()} more for a ${LEVELS[st.level]} album (${st.next.toLocaleString()} cards).`}</span>`;
}

// ---------- logbook: rank, streak, tonight's missions, achievements (js/progress.js) ----------
// .ics for next Saturday 8 pm (local), so the week's streak isn't lost. Same calendar route as pass reminders.
function remindStreak() {
  const d = new Date(); d.setHours(20, 0, 0, 0);
  let ahead = (6 - d.getDay() + 7) % 7; if (ahead === 0 && d.getTime() < Date.now()) ahead = 7; // this Saturday, unless 8 pm has passed
  d.setDate(d.getDate() + ahead);
  const start = d.getTime(), url = URL.createObjectURL(new Blob([passIcs({ title: 'Look up tonight (Space Collector)', start, end: start + 3600e3, description: 'Log one sighting this week to keep your observing streak. Open https://sevaan.github.io/space-collector/' })], { type: 'text/calendar' }));
  const a = document.createElement('a'); a.href = url; a.download = 'space-collector-streak.ics'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 5000);
  notice('Reminder for Saturday evening: add it to your calendar.');
}
function renderLogbook() {
  const info = (k) => { const c = state.byKey.get(k); return c ? { tier: c.tier, type: c.type, owner: c.owner, launch: c.launch, natural: c.natural, con: c.con } : null; };
  const p = progress(state.raw, info, { constellations: [...CONSTELLATIONS, SOLAR_SYSTEM].map((c) => ({ id: c.con, stars: c.stars, zodiac: c.zodiac, system: !!c.system })) });
  const el = $('logbook'); el.hidden = false;
  const span = p.rank.next ? p.rank.next - p.rank.at : 1, into = p.rank.next ? Math.min(1, (p.xp - p.rank.at) / span) : 1;
  const done = p.achievements.filter((a) => a.done).length;
  el.onclick = (e) => { if (e.target.closest('#streak-remind')) remindStreak(); };
  el.innerHTML = `<div class="lb-rank"><div><span class="lb-label">OBSERVER RANK</span><span class="lb-name">${esc(p.rank.name)}</span></div>
      <div class="lb-xp"><b>${p.xp.toLocaleString()}</b> XP</div></div>
    <div class="lb-bar"><i style="width:${(into * 100).toFixed(1)}%"></i></div>
    <div class="lb-sub">${p.rank.next ? `${(p.rank.next - p.xp).toLocaleString()} XP to ${esc(p.rank.nextName)}` : 'Top rank reached'} · ${p.streak.current ? `${p.streak.current}-week streak${p.streak.thisWeek ? '' : ' (observe this week to keep it) <button type="button" class="lb-remind" id="streak-remind">Remind me Saturday</button>'}` : 'Observe this week to start a streak'}</div>
    <div class="lb-head">TONIGHT'S MISSIONS <span>+50 XP each · new at noon</span></div>
    ${p.missions.map((m) => `<div class="lb-mission${m.done ? ' done' : ''}"><i></i>${esc(m.text)}</div>`).join('')}
    ${(() => { const ev = eventBadges(state.raw), nx = nextEvent(); return `<div class="lb-head">EVENTS <span>${ev.length} badge${ev.length === 1 ? '' : 's'}</span></div><div class="lb-events">${ev.map((e) => `<span class="lb-event">☄ ${esc(e.name)}</span>`).join('')}${nx ? `<span class="lb-event next">Next: ${esc(nx.name)} · ${new Date(nx.start + 30 * 3600e3).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>` : ''}</div>`; })()}
    <details class="lb-ach"><summary class="lb-head">ACHIEVEMENTS <span>${done} / ${p.achievements.length}</span></summary>
      <div class="lb-badges">${p.achievements.map((a) => `<div class="lb-badge${a.done ? ' done' : ''}" title="${esc(a.text)}"><span>${esc(a.icon)}</span><b>${esc(a.name)}</b><small>${esc(a.text)}</small></div>`).join('')}</div></details>`;
}

function render() {
  renderLogbook();
  renderAlbumHead();
  document.body.classList.toggle('albums-view', state.view === 'albums');
  if (state.view === 'albums') { const caught = state.cards.filter(hasSightings).length; $('owned-count').textContent = caught.toLocaleString(); renderAlbums(); return; }
  const caught = state.cards.filter(hasSightings).length;
  $('owned-count').textContent = caught.toLocaleString();
  $('count').textContent = caught ? `${caught.toLocaleString()} ${caught === 1 ? 'story' : 'stories'} collected. Every one, a moment under the sky.` : 'Real objects. Remarkable stories. Yours to discover.';
  state.list = state.cards.filter(matches).sort((a, b) => {
    // Sort menu (2026-10-06): default = newest first for your collection, featured order for the field guide.
    const newest = (c) => state.sightingsByKey.get(c.key)?.[0]?.time ?? 0;
    if (state.sort === 'newest') return newest(b) - newest(a) || titleFor(a).localeCompare(titleFor(b));
    if (state.sort === 'rarest') return TIERS.indexOf(b.tier) - TIERS.indexOf(a.tier) || titleFor(a).localeCompare(titleFor(b));
    if (state.sort === 'az') return titleFor(a).localeCompare(titleFor(b));
    if (state.view === 'owned') return newest(b) - newest(a);
    // Lead discovery with the familiar ISS and distinctive rarities, then catalogue order.
    if (String(a.id) === '25544') return -1;
    if (String(b.id) === '25544') return 1;
    return TIERS.indexOf(b.tier) - TIERS.indexOf(a.tier) || (a.set ?? '').localeCompare(b.set ?? '') || (a.setNumber ?? 0) - (b.setNumber ?? 0);
  });
  const total = state.list.length;
  $('results').textContent = `${total.toLocaleString()} ${total === 1 ? 'card' : 'cards'}${state.view === 'owned' ? ' in your collection' : ' in the field guide'}`;
  $('reset-filters').hidden = !state.query && state.set === 'all' && state.rarity === 'all' && (state.sort ?? 'auto') === 'auto';
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
  $('tab-albums').setAttribute('aria-pressed', String(view === 'albums'));
  if (state.ready) render();
}
function resetFilters() {
  state.query = ''; state.set = 'all'; state.rarity = 'all'; state.sort = 'auto'; $('sort-by').value = 'auto';
  $('search').value = ''; $('set-filter').value = 'all'; $('rarity-filter').value = 'all';
  if (state.ready) render();
}
$('tab-owned').addEventListener('click', () => setView('owned'));
$('tab-discover').addEventListener('click', () => setView('discover'));
$('tab-albums').addEventListener('click', () => { resetFilters(); setView('albums'); });
$('reset-filters').addEventListener('click', resetFilters);
let searchTimer;
$('search').addEventListener('input', (e) => { clearTimeout(searchTimer); state.query = e.target.value.trim().toLowerCase(); searchTimer = setTimeout(() => { if (state.ready) render(); }, 120); });
$('set-filter').addEventListener('change', (e) => { state.set = e.target.value; if (state.ready) render(); });
$('rarity-filter').addEventListener('change', (e) => { state.rarity = e.target.value; if (state.ready) render(); });
$('sort-by').addEventListener('change', (e) => { state.sort = e.target.value; if (state.ready) render(); });


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
  const el = renderCard(c, { sightings, seenMembers: state.seenMembers.get(c.key)?.size ?? 0, preview: state.preview, ownedKeys: ownedKeys() });
  $('v-share').hidden = !sightings.length;
  $('slot').replaceChildren(el);
  tilt = attachTilt(el);
  attachFlip(el, { onBack: applyBack });
  if (!reducedMotion.matches && motionPermission !== 'denied') stopGyro = attachGyro(el, tilt);
  $('v-position').textContent = `${state.index + 1} / ${state.list.length.toLocaleString()}`;
  const firstTime = sightings.length ? Math.min(...sightings.map((s) => s.time)) : 0;
  // The card itself shows when you collected it, so no date here (2026-10-05).
  $('v-status').textContent = sightings.length ? (c.archived ? 'Saved from an earlier catalogue' : '') : state.preview ? 'Artwork preview · this card has not been added to your collection.' : 'Not yet collected · record a live sighting to earn this card.';
  $('v-preview').hidden = sightings.length > 0;
  $('v-preview').textContent = state.preview ? 'Back to uncollected card' : 'Preview artwork & story';
  $('v-history').replaceChildren();
  if (sightings.length && c.launches) $('v-history').append(renderPassport(c, sightings));
  if (sightings.length) {
    const heading = document.createElement('h2');
    heading.textContent = c.launches ? `Every sighting · ${sightings.length}` : sightings.length === 1 ? 'When you saw it' : `When you saw it · ${sightings.length} times`;
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
        state.raw = state.raw.filter((x) => x.key !== s.key);
        const left = (state.sightingsByKey.get(c.key) ?? []).filter((x) => x.key !== s.key);
        if (left.length) state.sightingsByKey.set(c.key, left); else { state.sightingsByKey.delete(c.key); state.seenMembers.delete(c.key); }
        linkConstellations();
        showCard(); render();
      });
      $('v-history').append(row);
    }
  }
}
// from: the tile's screen rect, when opened by tapping a tile. The card rises out of it with a full
// spin (its back shows while it faces away), like taking a closer look at a real card.
function openViewer(i, from = null) {
  if (i < 0 || i >= state.list.length) return;
  askMotion();
  state.index = i; state.preview = false;
  lastFocus = document.activeElement;
  showCard();
  $('viewer').showModal();
  document.body.style.overflow = 'hidden';
  $('v-close').focus({ focusVisible: false }); // keep it focusable for screen readers without a ring on open
  $('viewer').querySelector('.viewer-scroll').scrollTop = 0;
  fadeViewer(true);
  spin($('slot').firstElementChild, from, true);
}

// The viewer's background, backdrop and text fade in (and out) around the spinning card, so you see
// it leave the grid.
function fadeViewer(opening) {
  if (reducedMotion.matches) return;
  const v = $('viewer'), bg = getComputedStyle(v).backgroundColor, ms = opening ? 450 : 420;
  const dir = opening ? 'normal' : 'reverse';
  v.animate([{ backgroundColor: 'rgba(0, 0, 0, 0)' }, { backgroundColor: bg }], { duration: ms, direction: dir, fill: opening ? 'none' : 'forwards' });
  try { v.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms, direction: dir, fill: opening ? 'none' : 'forwards', pseudoElement: '::backdrop' }); } catch {}
  for (const el of [v.querySelector('.viewer-header'), $('v-status'), $('v-history'), $('v-preview')]) {
    el?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: opening ? 350 : 200, delay: opening ? 400 : 0, direction: dir, fill: 'both' });
  }
}

const SPIN = { duration: 760, easing: 'cubic-bezier(.25,.8,.25,1)' };
function spin(card, rect, opening) {
  if (!card || reducedMotion.matches) return Promise.resolve();
  const to = card.getBoundingClientRect();
  const dx = rect ? rect.left + rect.width / 2 - (to.left + to.width / 2) : 0;
  const dy = rect ? rect.top + rect.height / 2 - (to.top + to.height / 2) : innerHeight * .35;
  const s = rect ? Math.max(.15, rect.width / to.width) : .3;
  const away = `perspective(1600px) translate(${dx}px, ${dy}px) scale(${s}) rotateY(0deg)`, here = 'perspective(1600px) translate(0, 0) scale(1) rotateY(360deg)';
  const opts = opening ? SPIN : { ...SPIN, duration: 520, easing: 'cubic-bezier(.5,0,.75,0)' };
  // Offsets are in eased progress (effect-level easing), so the back shows exactly while rotateY is 90°–270°.
  const back = [{ opacity: 0 }, { opacity: 0, offset: .25 }, { opacity: 1, offset: .25 }, { opacity: 1, offset: .75 }, { opacity: 0, offset: .75 }, { opacity: 0 }];
  const backEl = card.querySelector('.card__back');
  if (opening) applyBack(backEl);
  backEl?.animate(back, opts);
  // The holo sweeps across the back as it turns, finger or not.
  backEl?.querySelector('.back-holo')?.animate([
    { opacity: .55, backgroundPosition: '20% 20%, 80% 80%, 15% 25%' },
    { opacity: .55, backgroundPosition: '80% 80%, 20% 20%, 85% 75%' },
  ], opts);
  backEl?.querySelector('.back-glare')?.animate([{ opacity: .5 }, { opacity: .5 }], opts);
  const a = card.animate(opening ? [{ transform: away }, { transform: here }] : [{ transform: here }, { transform: away, opacity: rect ? 1 : 0 }], { ...opts, fill: 'forwards' });
  return new Promise((r) => setTimeout(() => { r(); if (opening) a.cancel(); }, opts.duration));
}
// Done: spin the card back into its tile if that tile is on screen, then close.
async function closeViewer() {
  const c = state.list[state.index], card = $('slot').firstElementChild;
  const tile = c && document.querySelector(`.tile-slot[data-key="${CSS.escape(c.key)}"]`);
  const r = tile?.getBoundingClientRect();
  const onScreen = r && r.bottom > 0 && r.top < innerHeight && r.width > 0;
  stopEffects();
  fadeViewer(false);
  await spin(card, onScreen ? r : null, false);
  $('viewer').close();
  const v = $('viewer'); // drop the held fade-outs (backdrop included) so the next open starts clean
  document.getAnimations().forEach((an) => { const t = an.effect?.target; if (t && (t === v || v.contains(t))) an.cancel(); });
}
// Flick the card up and away to close the viewer (like flicking away a fresh capture in the sky).
async function flickClose(dx, dy, dt) {
  const card = $('slot').firstElementChild;
  stopEffects();
  fadeViewer(false);
  if (card && !reducedMotion.matches) {
    const ms = throwOff(card, dx, dy, dt); // flies off the top at the flick's speed, fully visible 
    await new Promise((r) => setTimeout(r, ms));
  }
  $('viewer').close();
  const v = $('viewer');
  document.getAnimations().forEach((an) => { const t = an.effect?.target; if (t && (t === v || v.contains(t))) an.cancel(); });
}
let flick = null;
$('slot').addEventListener('pointerdown', (e) => { flick = { id: e.pointerId, pts: [{ x: e.clientX, y: e.clientY, t: performance.now() }] }; });
$('slot').addEventListener('pointermove', (e) => {
  if (!flick || e.pointerId !== flick.id) return;
  flick.pts.push({ x: e.clientX, y: e.clientY, t: performance.now() }); if (flick.pts.length > 12) flick.pts.shift();
});
$('slot').addEventListener('pointerup', (e) => {
  if (!flick || e.pointerId !== flick.id) return;
  const pts = flick.pts; flick = null;
  const last = pts[pts.length - 1], now = performance.now(), from = pts.find((p) => now - p.t < 140) ?? pts[0];
  const dx = last.x - from.x, dy = last.y - from.y, dt = Math.max(16, now - from.t);
  if (dy < -45 && last.y - pts[0].y < -60 && Math.abs(dx) < -dy * 0.9 && -dy / dt > 0.6) flickClose(dx, dy, dt);
});
$('slot').addEventListener('pointercancel', () => { flick = null; });
// A constellation card is owned through its stars, and only once you have ALL of them (it then arrives
// gold, 2026-10-05): it carries their sightings (for dates and counts). Before that it stays in the field
// guide, showing which stars you've found (from the star cards you own).
function linkConstellations() {
  for (const c of state.cards) {
    if (c.natural !== 'constellation') continue;
    state.sightingsByKey.delete(c.key);
    if (!c.stars.every((k) => state.sightingsByKey.has(k))) continue;
    const s = c.stars.flatMap((k) => state.sightingsByKey.get(k) ?? []);
    state.sightingsByKey.set(c.key, s.sort((a, b) => b.time - a.time));
  }
}
const ownedKeys = () => new Set([...state.sightingsByKey.keys()]);
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
$('v-close').addEventListener('click', closeViewer);
addStarfield($('viewer'));
attachTileTilt($('grid'));
$('viewer').addEventListener('close', () => { stopEffects(); document.body.style.overflow = ''; lastFocus?.focus(); });
$('slot').addEventListener('pointerdown', askMotion);
$('v-preview').addEventListener('click', () => { state.preview = !state.preview; showCard(); });
// Share the card on screen as an image (js/share-card.js), reading what it shows so the image matches.
$('v-share').addEventListener('click', async () => {
  const c = state.list[state.index], el = $('slot').firstElementChild; if (!c || !el) return;
  const btn = $('v-share'); btn.disabled = true; btn.textContent = 'Making the image…';
  try {
    const txt = (sel) => el.querySelector(sel)?.textContent.trim() ?? '';
    const img = el.querySelector('.card__art img.card-art-image'), svg = el.querySelector('.card__art svg');
    const art = img ? { src: img.src } : c.natural === 'constellation' ? { svg: conArt(c.data) } : c.con && !c.skyName ? { svg: conArt(CON_BY_ID.get(c.con).data, c.hip) } : { svg: svg ? new XMLSerializer().serializeToString(svg) : '' };
    const stats = [...el.querySelectorAll('.card__stats > div')].map((d) => [d.querySelector('.card__label')?.textContent ?? '', d.querySelector('b')?.childNodes[0]?.textContent.trim() ?? '', d.querySelector('b small')?.textContent ?? '']);
    const tier = getComputedStyle(el).getPropertyValue('--tier').trim() || '#fa8127';
    const info = (k) => { const x = state.byKey.get(k); return x ? { tier: x.tier, type: x.type, owner: x.owner, launch: x.launch, natural: x.natural, con: x.con } : null; };
    const rank = progress(state.raw, info).rank.name;
    const canvas = await drawShareCard(c, art, {
      title: titleFor(c), setName: txt('.card__setbar > span:first-child'), tierLabel: txt('.card__tier').replace(/^\W+/, ''), tierColor: tier, stats,
      fact: txt('.card__fact p'), collected: txt('.card__status > span:nth-child(2)'), seen: txt('.card__seen-count'), rank,
      gold: el.classList.contains('gold-foil'), shiny: el.querySelector('.shiny-tag')?.textContent.split('·')[1]?.trim() ?? null,
    });
    const how = await shareCard(canvas, `${titleFor(c).replace(/[^\w-]+/g, '-').toLowerCase()}.png`, `${titleFor(c)} · Space Collector`);
    btn.textContent = how === 'downloaded' ? 'Saved the image' : 'Share this card';
  } catch { btn.textContent = 'Couldn\'t make the image'; }
  btn.disabled = false; setTimeout(() => { btn.textContent = 'Share this card'; }, 2500);
});
$('viewer').addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); step(e.key === 'ArrowLeft' ? -1 : 1); }
});
reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) { stopGyro?.(); stopGyro = null; tilt?.reset(); } });
boot().catch(() => {
  notice('The field guide could not open. Refresh this page to try again.');
  $('count').textContent = 'Your next discovery is waiting.';
  $('grid').replaceChildren();
});
