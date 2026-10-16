import { isNative, saveFile, notifyAt, shareFile } from './native.js?v=0.1.745';
import { computeStats, statsHtml } from './stats.js?v=0.1.745';
import { nightKey } from './observation.js?v=0.1.745';
import { loadComets, comets, cometAt, NAKED_EYE } from './comets.js?v=0.1.745';
import { sfx } from './sfx.js?v=0.1.745';
import { expandFacts } from './catalog-facts.js?v=0.1.745';
import { patchHtml, GROUPS, GROUP_ORDER, groupOf, finishOf, fmtEarned } from './patches.js?v=0.1.745';
import { setSwitch, SLIDE_MS } from './switcher.js?v=0.1.745';
import { ticket } from './toast.js?v=0.1.745';
import { orbitGlobe, whereLine } from './orbit-view.js?v=0.1.745';
import { renderCard, miniCard, lockedArt, renderCardTile, attachTilt, attachGyro, attachFlip, artImage, throwOff } from './card.js?v=0.1.745';
import { cardArt } from './art.js?v=0.1.745';
import { buildCards, cardKeyFor, normalizeSighting } from './card-model.js?v=0.1.745';
import { applyBack } from './card-backs.js?v=0.1.745';
import { SETS, assignSets, albumGoals, albumList } from './sets.js?v=0.1.745';
import { TIERS, TIER_INFO } from './rarity.js?v=0.1.745';
import { loadLore, titleFor, factFor } from './lore.js?v=0.1.745';
import './stories.js?v=0.1.680';
import { loadConstellations, conList } from './constellations.js?v=0.1.745';
import { RANKS, progress, readDeals, xpCarry } from './progress.js?v=0.1.745';
import { eventBadges, nextEvent } from './events.js?v=0.1.745';
import { shareCardEl } from './share-card.js?v=0.1.745';
import { removeSighting } from './account.js?v=0.1.745';
import { allSightings, deleteSighting } from './store.js?v=0.1.745';
import { addStarfield, attachTileTilt } from './starfield.js?v=0.1.745';
import { SECRET_PATCHES, hasPatch } from './secrets.js?v=0.1.745';

const $ = (id) => document.getElementById(id);
const state = { raw: [], cards: [], byKey: new Map(), sightingsByKey: new Map(), seenMembers: new Map(), view: 'owned', query: '', set: 'all', rarity: 'all', list: [], index: 0, preview: false, ready: false };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const hasSightings = (c) => state.sightingsByKey.has(c.key);
const dateLabel = (time) => new Date(time).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function notice(message) { $('notice').hidden = !message; $('notice').textContent = message; }
let hasSkyTone = false; // Explore's sky colours behind the page (applySkyTone); off in red night mode (QA 2026-10-08: they stayed on)
function setNight(on) {
  document.documentElement.dataset.theme = on ? 'night' : 'default';
  document.body.classList.toggle('night', on);
  document.body.classList.toggle('sky-tone', !on && hasSkyTone);
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

$('set-filter').add(new Option('Up tonight from here', 'tonight'));
for (const set of SETS) $('set-filter').add(new Option(set.name, set.id));
// Tonight's catchable passes from where you are (playtest 2026-10-09, #9/#10): Explore works them out and shares
// them (localStorage tonightPlan, and a sc:tonight message while this page is embedded). { at, passes: [{ key, id,
// start, end, peakEl, dir }] }, soonest first.
function readPlan() {
  let p = null; try { p = JSON.parse(localStorage.getItem('tonightPlan')); } catch {}
  if (!p || Date.now() - p.at > 18 * 3600e3) return [];
  return (p.passes ?? []).filter((x) => x.end > Date.now());
}
state.plan = readPlan();
const planStart = () => new Map(state.plan.map((x) => [x.key, x.start]).reverse()); // first (soonest) pass per card
for (const tier of TIERS.slice().reverse()) $('rarity-filter').add(new Option(TIER_INFO[tier].label, tier));

// Read the sighting log into state (boot, and 'refresh' from Explore after a catch, 2026-10-16: a whole-page reload
// made "View in collection" wait for the page, then slide and spin at once, which looked janky).
function ingest(sightings) {
  const keyOfId = state.keyOfId;
  state.raw = []; state.sightingsByKey = new Map(); state.seenMembers = new Map();
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
}
async function refreshSightings() {
  if (!state.ready) return;
  try { ingest(await allSightings()); linkConstellations(); render(); } catch {}
}
async function boot() {
  const [catalogueResult, sightingResult] = await Promise.allSettled([
    // Inside the app, borrow the catalogue Explore already loaded instead of downloading and parsing it again.
    (() => { try { const sh = window.parent !== window && window.parent.__catalogShare; if (sh) return Promise.resolve(sh); } catch {} return fetch('data/catalog.json', { cache: 'no-cache' }).then((r) => { if (!r.ok) throw new Error('catalogue'); return r.json(); }).then((d) => { for (const o of d.objects) expandFacts(o); return d; }); })(),
    allSightings(),
    loadLore(),
    loadConstellations(),
    loadComets(),
  ]);
  const cat = catalogueResult.status === 'fulfilled' ? catalogueResult.value : { objects: [] };
  // One card per key: a star in two constellations (Dubhe: Big Dipper and Ursa Major) showed twice and was counted twice
  // in Mine (collectors 2026-10-11).
  { const seen = new Set(); state.cards = buildCards(cat).filter((c) => !seen.has(c.key) && seen.add(c.key)); }
  state.byKey = new Map(state.cards.map((c) => [c.key, c]));
  const keyOfId = new Map(cat.objects.map((o) => [String(o.id), cardKeyFor(o)])); state.keyOfId = keyOfId;
  const sightings = sightingResult.status === 'fulfilled' ? sightingResult.value : [];
  ingest(sightings);
  linkConstellations();
  if (catalogueResult.status === 'rejected') notice('The catalogue could not load. Your saved field records are still shown. Refresh to try again.');
  if (sightingResult.status === 'rejected') notice('Your saved sightings could not be opened. You can explore the field guide; refresh to retry your collection.');
  state.ready = true;
  render();
  if (window.parent !== window) window.parent.postMessage({ sc: 'ready' }, location.origin); // the shell can fade us in now
  let key = '';
  try { key = decodeURIComponent(location.hash.slice(1)); } catch {}
  if (key === 'patches') { setView('patches'); return; }
  if (!state.byKey.has(key) && /^[A-Z]+:/.test(key)) key = key.split(':')[0]; // old launch-card link
  if (key && !state.byKey.has(key)) key = state.keyOfId.get(key) ?? key; // a satellite that's now part of a fleet
  if (key && state.byKey.has(key)) openKey(key);
  else if (key) notice('That card is not in this catalogue or your saved collection. Search the field guide to find another target.');
}

function matches(c) {
  if (state.view === 'owned' && !hasSightings(c)) return false;
  if (state.view === 'find') { if (!state.query) return true; const h = `${titleFor(c)} ${c.name} ${c.id} ${c.cospar ?? ''} ${c.type ?? ''} ${SETS.find((s) => s.id === c.set)?.name ?? ''}`.toLowerCase(); return state.query.split(/\s+/).every((w) => h.includes(w)); }
  if (state.set === 'tonight') { if (!state.planKeys?.has(c.key)) return false; } else if (state.set !== 'all' && c.set !== state.set) return false;
  if (state.rarity !== 'all' && c.tier !== state.rarity) return false;
  if (state.query) {
    const haystack = `${titleFor(c)} ${c.name} ${c.id} ${c.cospar ?? ''} ${factFor(c)} ${SETS.find((s) => s.id === c.set)?.name ?? ''}`.toLowerCase();
    if (!haystack.includes(state.query)) return false;
  }
  return true;
}

// Three a row (2026-10-09): names wrap at whole words; a word too long for the tile ("INTERNATIONAL") shrinks the
// name until it fits instead of breaking mid-word.
function fitTileName(tile) {
  const el = tile.querySelector('.card-tile__name'); if (!el || !/\S{9,}/.test(el.textContent)) return;
  requestAnimationFrame(() => { let fs = parseFloat(getComputedStyle(el).fontSize); while (el.scrollWidth > el.clientWidth + 1 && fs > 8.5) el.style.fontSize = `${(fs -= 0.5)}px`; });
}
// Collection tiles as small copies of the full card (2026-10-13, Sevaan: "look like the shrunken down version of the
// bigger cards… the collected info overlaid over the bottom where the text is tiny"). The tile keeps its classes,
// level badge and label; its face becomes renderCard(…, { mini }) sized by container units, and the status line
// ("✓ Collected Oct 13, 2026" / "Not yet collected" / "3 of 7 stars") sits over the card's footer.
// One scale for every tile: tile width / the card's natural 280 px, kept on the grid as --mini-s.
const miniScale = () => { const t = document.querySelector('.card-tile--mini, #grid .card-slot'); const w = t?.offsetWidth; if (w) document.getElementById('grid')?.style.setProperty('--mini-s', (w / 280).toFixed(4)); };
addEventListener('resize', () => requestAnimationFrame(miniScale));
function miniFace(tile, c) {
  const status = (tile.querySelector('.card-tile__status')?.textContent ?? '').replace(/^✓\s*Collected\s*/, '✓ '), badge = tile.querySelector('.tile-lvl');
  const face = miniCard(c, { sightings: state.sightingsByKey.get(c.key) ?? [], ownedKeys: c.natural === 'constellation' ? ownedKeys() : undefined, status, locked: !tile.classList.contains('is-owned') });
  tile.classList.add('card-tile--mini');
  tile.replaceChildren(...(badge ? [badge] : []), face);
  requestAnimationFrame(miniScale);
}
let cascadeLeft = 24; // the first screenful cascades in on open (2026-10-08 polish)
const observer = new IntersectionObserver((entries) => {
  for (const { isIntersecting, target } of entries) {
    if (!isIntersecting) continue;
    observer.unobserve(target);
    const c = state.byKey.get(target.dataset.key);
    if (!c) continue;
    // Two cards with the same name side by side ("Delta 1 Rocket Stage" ×2) say which is which (playtest 2026-10-09).
    const dup = (state.titleCount?.get(titleFor(c)) ?? 0) > 1, yr = c.launch ? String(c.launch).slice(0, 4) : '';
    const tile = renderCardTile(c, { sightings: state.sightingsByKey.get(c.key) ?? [], ownedKeys: c.natural === 'constellation' ? ownedKeys() : undefined, sub: dup ? [yr, c.id && /^\d+$/.test(String(c.id)) ? `#${c.id}` : ''].filter(Boolean).join(' · ') : '' });
    miniFace(tile, c); // the tile is the real card, shrunk, with the collected line over its footer (2026-10-13, Sevaan)
    tile.addEventListener('click', () => openViewer(state.list.findIndex((card) => card.key === c.key), tile.getBoundingClientRect()));
    target.replaceChildren(tile);
    fitTileName(tile);
    if (cascadeLeft > 0) { cascadeLeft--; target.classList.add('cascade'); target.style.setProperty('--i', String(24 - cascadeLeft)); setTimeout(() => target.classList.remove('cascade'), 1200); }
    for (const img of tile.querySelectorAll('img.card-art-image')) { if (img.complete && img.naturalWidth) img.classList.add('loaded'); else { img.addEventListener('load', () => img.classList.add('loaded'), { once: true }); img.addEventListener('error', () => img.classList.add('loaded'), { once: true }); } }
  }
}, { rootMargin: '500px 0px' });

// ---------- albums ----------
// One album per set. Goals scale with the set's size, so every album has a reachable gold:
// small sets (<= 30 cards) are completed; bigger ones aim for 100 or 200 cards.
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
    let lv = {}; try { lv = JSON.parse(localStorage.getItem('albumLevels')) || {}; } catch {}
    const crossed = (lv[set.id] ?? st.level) < st.level; lv[set.id] = st.level; try { localStorage.setItem('albumLevels', JSON.stringify(lv)); } catch {}
    b.className = `album${st.level === 3 ? ' gold' : ''}${latest ? '' : ' empty'}${crossed ? ' crossed' : ''}`; b.style.setProperty('--set', set.color);
    b.innerHTML = `<span class="album__art">${img ? `<img src="${img}" alt="" loading="lazy">` : cardArt(show, { accent: set.color, silhouette: !latest })}</span>
      <span class="album__body"><span class="album__top"><span class="album__name">${esc(set.name)}</span><span class="album__count"><b>${st.have.length.toLocaleString()}</b> / ${st.cards.length.toLocaleString()}</span></span>
      ${albumBar(st)}<span class="album__foot">${st.level ? `<span class="album__level l${st.level}">${LEVELS[st.level - 1]}</span>` : ''}<span class="album__next">${st.level === 3 ? 'Gold album' : `${(st.next - st.have.length).toLocaleString()} more for ${LEVELS[st.level]}`}</span></span></span>`;
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
// A notification next Saturday 8 pm (local), so the week's streak isn't lost. The app only: no calendar files (2026-10-12).
function remindStreak() {
  const d = new Date(); d.setHours(20, 0, 0, 0);
  let ahead = (6 - d.getDay() + 7) % 7; if (ahead === 0 && d.getTime() < Date.now()) ahead = 7; // this Saturday, unless 8 pm has passed
  d.setDate(d.getDate() + ahead);
  (isNative() ? notifyAt(d.getTime(), 'Look up tonight', 'One sighting this week keeps your observing streak going.') : Promise.resolve('app-only'))
    .then((r) => ticket({ kind: 'mission', eyebrow: 'STREAK', line: r === 'on' ? 'We\'ll remind you Saturday at 8 pm.' : r === 'app-only' ? 'Reminders work in the Space Collector app.' : r === 'denied' ? 'Notifications are off for Space Collector.' : 'Couldn\'t set a reminder here.', ms: 4000 }));
}
// Observer stats (free for everyone, 2026-10-12): a link under the rank card opens #stats-view.
function openStats() {
  $('stats-body').innerHTML = statsHtml(computeStats(state.raw, state.byKey, nightKey));
  $('stats-view').showModal();
}
$('stats-open')?.addEventListener('click', openStats);
$('stats-close')?.addEventListener('click', () => $('stats-view').close());
function renderLogbook() {
  const info = (k) => { const c = state.byKey.get(k); return c ? { tier: c.tier, tier0: c.tier0, type: c.type, owner: c.owner, launch: c.launch, natural: c.natural, con: c.con } : null; };
  const p = progress(state.raw, info, { constellations: conList(), deals: readDeals(), albums: state.albums, carry: xpCarry(state.raw, info, { constellations: conList(), deals: readDeals() }) });
  state.albums ??= albumList(state.cards);
  try { localStorage.setItem('goldAlbums', JSON.stringify(SETS.filter((s) => albumStats(s.id).level === 3).map((s) => s.id))); } catch {}
  const card = $('logbook'); card.hidden = false; $('stats-open').hidden = true; // Observer stats moved to Settings → Account (2026-10-13, Sevaan)
  // Compact until opened (UX room 2026-10-12: the rank card pushed the first card to the bottom of the screen). Remembered.
  let lbOpen = false; try { lbOpen = localStorage.getItem('lbOpen') === '1'; } catch {}
  card.classList.toggle('compact', !lbOpen);
  // The logbook is a card (2026-10-08, Sevaan): it tilts with your finger and the phone, has a glare, and a double
  // tap flips it to a card back. Built once; the contents are re-rendered inside .lb-face.
  if (!card.querySelector('.lb-face')) {
    card.classList.add('lb-card');
    card.innerHTML = '<div class="lb-rot"><div class="lb-face"></div><div class="lb-glare"></div><div class="card__back lb-back"></div></div>';
    // No tilt, glare or flip any more (2026-10-13, Sevaan): it's a plain panel you read.
  }
  const el = card.querySelector('.lb-face');
  const span = p.rank.next ? p.rank.next - p.rank.at : 1, into = p.rank.next ? Math.max(0, Math.min(1, (p.xp - p.rank.at) / span)) : 1; // a rank kept from the old curve can sit above your XP: never below 0
  const done = p.achievements.filter((a) => a.done).length;
  el.onclick = (e) => { if (e.target.closest('#streak-remind')) remindStreak(); };
  // Front (2026-10-08, design/rank-card.html C): your rank ladder as the picture (twinkling stars), the rank and
  // XP, tonight's missions, and Events at the foot.
  const ri = p.rank.index, lo = Math.max(0, Math.min(ri - 2, RANKS.length - 4)), rungs = RANKS.slice(lo, lo + 4);
  const H = 160, pts = rungs.map((_, i) => [37.5 + i * 75, H / 2 + 34 - i * 18]); // centred: 37.5 in from each side (2026-10-14, Sevaan)
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const stars = Array.from({ length: 30 }, (_, i) => `<circle class="lb-tw" style="--d:${(rnd() * 5).toFixed(2)}s;--t:${(2.5 + rnd() * 3).toFixed(2)}s" cx="${(rnd() * 300).toFixed(0)}" cy="${(rnd() * H).toFixed(0)}" r="${(0.5 + rnd() * 0.8).toFixed(1)}" fill="#fff2b3"/>`).join('');
  const cur = ri - lo, ladder = `<svg class="lb-ladder" viewBox="0 0 300 ${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${stars}
    <path d="M${pts.map((q) => q.join(' ')).join(' L')}" fill="none" stroke="#344654" stroke-dasharray="3 5"/>
    ${cur > 0 ? `<path d="M${pts.slice(0, cur + 1).map((q) => q.join(' ')).join(' L')}" fill="none" stroke="#fa8127" stroke-width="2"/>` : ''}<!-- ranks you have passed: solid (2026-10-14) -->
    ${pts[cur + 1] ? `<path d="M${pts[cur].join(' ')} L${pts[cur][0] + (pts[cur + 1][0] - pts[cur][0]) * into} ${pts[cur][1] + (pts[cur + 1][1] - pts[cur][1]) * into}" stroke="#fa8127" stroke-width="2"/>` : ''}
    ${rungs.map(([, n], i) => { const [x, y] = pts[i]; return `<circle cx="${x}" cy="${y}" r="${i === cur ? 6 : 4}" fill="${i <= cur ? '#fa8127' : '#0b1626'}" ${i > cur ? 'stroke="#fff2b3" stroke-dasharray="2 2"' : ''}/>${i === cur ? `<circle cx="${x}" cy="${y}" r="12" fill="none" stroke="#fa8127" opacity=".5"/>` : ''}<text x="${x}" y="${y + 20}" text-anchor="middle" font-family="SC Label, Arial Narrow" font-size="9.5" letter-spacing="1.5" fill="${i >= cur ? '#fff2b3' : '#bdbea9'}">${esc(n.toUpperCase())}</text>${i === cur + 1 ? `<text x="${x}" y="${y - 14}" text-anchor="middle" font-family="SC Label, Arial Narrow" font-size="9" letter-spacing="1.5" fill="#fa8127">NEXT</text>` : ''}`; }).join('')}</svg>`;
  const streak = p.streak.current >= 2 ? `${p.streak.current}-week streak` : p.streak.current ? 'Week 1 · come back next week' : 'Observe this week to start a streak'; // the flame is earned at week 2 (playtest 2026-10-09)
  const ev = eventBadges(state.raw), nx = nextEvent();
  // At risk (a streak going, nothing logged yet this week): a Remind me for Saturday evening (QA 2026-10-09: the button
  // was lost in the card redesign, so remindStreak was unreachable).
  const atRisk = p.streak.current && !p.streak.thisWeek;
  el.innerHTML = `<div class="lb-top"><span>Observer rank</span><span class="lb-streak">${streak}${atRisk ? '<button type="button" class="lb-remind" id="streak-remind">Remind me Sat</button>' : ''}</span></div>
    <div class="lb-pic">${ladder}<button type="button" class="lb-more" id="lb-more" aria-expanded="${!$('logbook').classList.contains('compact')}">${$('logbook').classList.contains('compact') ? 'Missions ›' : 'Less'}</button></div>
    <div class="lb-rankrow"><span class="lb-name">${esc(p.rank.name)}</span><span class="lb-xp"><b>${p.xp.toLocaleString()}</b>${p.rank.next ? ` / ${p.rank.next.toLocaleString()}` : ''} XP</span></div>
    ${p.rank.next ? `<div class="lb-bar"><i style="width:${(into * 100).toFixed(1)}%"></i></div><div class="lb-to"><span>${(p.rank.next - p.xp).toLocaleString()} XP to <b>${esc(RANKS[ri + 1]?.[1] ?? 'the next rank')}</b></span><span>${Math.round(into * 100)}%</span></div>` : '<div class="lb-to"><span>Top rank. Every catch still counts.</span></div>'}
    ${p.missions.map((m) => `<div class="lb-mission${m.done ? ' done' : ''}"><i></i>${esc(m.text)}</div>`).join('')}
    ${p.challenge ? `<div class="lb-mission lb-challenge${p.challenge.done ? ' done' : ''}"><i></i>${esc(p.challenge.text)}<small>Sky challenge · +50</small></div>` : ''}
    <div class="lb-foot"><div class="lb-head">EVENTS ${ev.length ? `<span>${ev.length} badge${ev.length === 1 ? '' : 's'}</span>` : ''}</div>
    <div class="lb-events">${ev.map((e) => `<span class="ui-chip ui-chip--earned">☄ <b>${esc(e.name.replace(/\s*\d{4}$/, ''))}</b></span>`).join('')}${nx ? `<span class="ui-chip"><span class="ui-chip__k">Next:</span><b>${esc(nx.name.replace(/\s*\d{4}$/, ''))}</b><span class="ui-chip__k">· ${new Date(nx.start + 30 * 3600e3).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span></span>` : ''}</div></div>`;
  state.achievements = p.achievements;
}

// Find (2026-10-13, Sevaan: "someone may want to search up an object like the ISS to preview the card and then set an
// alert for when it flies over, however long in the future"): a search-first list. Each row: art, name, rarity, whether
// you have it, and its next visible pass from here (worked out by Explore, js/find-worker.js, up to 10 days), with a
// target (be shown where) and a bell (remind me). Before you type: the famous ones you don't have yet.
const findPasses = new Map(); let findReq = 0, findReminded = new Set(), findSuggest = null;
function findPassLine(c) {
  if (c.natural) return c.natural === 'star' ? 'A star · out on clear nights' : c.type === 'sun' ? 'By day' : 'Look for it on a clear night';
  if (c.launches) return 'A fleet · passes most nights';
  if (!EMBED) return 'Open in the app for passes';
  const p = findPasses.get(c.id);
  if (p === undefined) return '<span class="fd-wait">Finding its next pass…</span>';
  if (!p) return 'Not visible from here in the next 10 days';
  const d = new Date(p.start), today = d.toDateString() === new Date().toDateString(), tmr = d.toDateString() === new Date(Date.now() + 86400e3).toDateString();
  const day = today ? 'Tonight' : tmr ? 'Tomorrow' : d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  const where = `${p.peakEl >= 60 ? 'high' : p.peakEl >= 30 ? 'halfway up' : 'low'} in the ${({ N: 'north', NE: 'northeast', E: 'east', SE: 'southeast', S: 'south', SW: 'southwest', W: 'west', NW: 'northwest' })[['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(p.peakAz / 45) % 8]]}`;
  return `<b>${day} ${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</b> · ${p.cloud ? '<span class="fd-cloud">cloud forecast</span>' : where}`;
}
const TGT = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="2.5" fill="currentColor"/><path d="M12 1.5v4M12 18.5v4M1.5 12h4M18.5 12h4"/></svg>';
const BEL = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/></svg>';
function renderFind() {
  const grid = $('grid'); grid.replaceChildren(); grid.classList.add('find-mode');
  const q = state.query;
  let list;
  // Famous things first (2026-10-13 playtest: "ISS" opened with a debris piece): an exact name, then stations and icons,
  // then names that start with it, debris last, rarer first.
  const rankQ = (c) => { const t = titleFor(c).toLowerCase(); return (t === q ? 0 : 6) + (c.icon || c.type === 'station' ? 0 : 3) + (t.startsWith(q) ? 0 : 1) + (c.type === 'debris' ? 2 : 0); };
  if (q) list = state.cards.filter((c) => !c.archived && matches(c)).sort((a, b) => rankQ(a) - rankQ(b) || TIERS.indexOf(b.tier) - TIERS.indexOf(a.tier)).slice(0, 30);
  else list = (findSuggest ?? []).map((p) => state.cards.find((c) => c.id === p.id) ?? state.byKey.get(state.keyOfId?.get(p.id))).filter(Boolean); // from Explore's plans: tonight and this week
  if (!q && !findSuggest && EMBED) { window.parent.postMessage({ sc: 'find-suggest' }, location.origin); grid.insertAdjacentHTML('beforeend', '<p class="find-none">Finding what you can see this week…</p>'); return; }
  state.list = list;
  $('results').textContent = q ? `${list.length}${list.length === 30 ? '+' : ''} found` : 'Search any satellite, rocket or planet';
  const head = document.createElement('div'); head.className = 'find-head'; head.textContent = q ? '' : 'Rare ones you can see this week'; if (!q) grid.append(head);
  if (!list.length) { grid.insertAdjacentHTML('beforeend', q ? '<p class="find-none">Nothing by that name. Try "ISS", "Hubble" or "Starlink".</p>' : '<p class="find-none">Nothing rare passes this week. Search any satellite to see when it\'s next up.</p>'); return; }
  const need = [];
  for (const c of list) {
    const t = TIER_INFO[c.tier] ?? TIER_INFO.common, owned = hasSightings(c), row = document.createElement('div'); row.className = 'find-row'; row.style.setProperty('--c', t.color);
    const art = owned && artImage(c, 'small') ? `<img src="${artImage(c, 'small')}" alt="" loading="lazy">` : lockedArt(c, owned, t.color, 'small');
    row.innerHTML = `<span class="fd-art">${art}</span><span class="fd-main"><b>${esc(titleFor(c))}</b><small><em>${t.gem} ${t.label}</em>${c.fallAt && !c.archived ? ' · <em class="lc-pill">Last chance</em>' : ''}${owned ? ' · <i>in your collection</i>' : ''}</small><span class="fd-pass" data-id="${esc(String(c.id))}">${findPassLine(c)}</span></span><span class="fd-acts"></span>`;
    row.addEventListener('click', (e) => { if (e.target.closest('.fd-acts')) return; openViewer(list.indexOf(c), row.getBoundingClientRect()); });
    grid.append(row); if (!c.natural && !c.launches && !findPasses.has(c.id)) need.push(c.id); else findActs(row, c);
  }
  findTrim();
  if (need.length && EMBED) { const req = ++findReq; window.parent.postMessage({ sc: 'find-passes', ids: need, req }, location.origin); }
}
// Suggestions (no search): keep only those with a pass in the next 10 days, soonest first, at most 8.
function findTrim() {
  if (state.view !== 'find' || state.query) return;
  const rows = [...document.querySelectorAll('.find-row')], pass = (r) => { const id = r.querySelector('.fd-pass')?.dataset.id; const k = isNaN(id) ? id : Number(id); return findPasses.get(k); };
  rows.sort((a, b) => (pass(a)?.start ?? (pass(a) === null ? Infinity : 9e15)) - (pass(b)?.start ?? (pass(b) === null ? Infinity : 9e15))).forEach((r) => r.parentNode.append(r));
  let shown = 0; for (const r of rows) { const p = pass(r); r.hidden = p === null || (p !== undefined && shown >= 8) || (p === undefined && shown >= 8); if (!r.hidden) shown++; }
}
function findActs(row, c) {
  const p = findPasses.get(c.id), acts = row.querySelector('.fd-acts'); if (!acts || !p) return;
  const key = `${p.id}@${p.start}`, far = p.start > Date.now() + 10 * 60000;
  acts.innerHTML = `<button type="button" class="ic" data-a="show" aria-label="Show me where to look">${TGT}</button>${far ? `<button type="button" class="ic${findReminded.has(key) ? ' on' : ''}" data-a="bell" aria-label="Remind me">${BEL}</button>` : ''}`;
  acts.querySelector('[data-a="show"]').onclick = () => window.parent.postMessage({ sc: 'find-show', pass: p }, location.origin);
  const b = acts.querySelector('[data-a="bell"]'); if (b) b.onclick = () => window.parent.postMessage({ sc: 'find-remind', pass: p }, location.origin);
}
window.addEventListener('message', (e) => {
  if (e.origin !== location.origin) return;
  if (e.data?.sc === 'find-suggest') { findSuggest = e.data.items; findReminded = new Set(e.data.reminded); for (const p of findSuggest) findPasses.set(p.id, p); if (state.view === 'find' && !state.query) renderFind(); }
  if (e.data?.sc === 'find-passes') { if (e.data.reminded) findReminded = new Set(e.data.reminded);
    for (const [id, p] of Object.entries(e.data.passes)) findPasses.set(isNaN(id) ? id : Number(id), p);
    for (const el of document.querySelectorAll('.fd-pass[data-id]')) { const id = isNaN(el.dataset.id) ? el.dataset.id : Number(el.dataset.id), c = state.cards.find((k) => k.id === id); if (c) { el.innerHTML = findPassLine(c); findActs(el.closest('.find-row, .v-next'), c); } } findTrim(); }
  if (e.data?.sc === 'say' && e.data.text) ticket({ kind: 'info', line: e.data.text, ms: 3500 }); // a message from Explore (reminder results)
  if (e.data?.sc === 'find-reminded') { findReminded = new Set(e.data.set); { const u = $('v-up'); if (u && !u.hidden && u._up) renderUpPanel(u._card, u._up); } for (const el of document.querySelectorAll('.fd-pass[data-id]')) { const id = isNaN(el.dataset.id) ? el.dataset.id : Number(el.dataset.id), c = state.cards.find((k) => k.id === id); if (c) findActs(el.closest('.find-row, .v-next'), c); } }
});
function render() {
  renderLogbook();
  $('grid').classList.toggle('find-mode', state.view === 'find');
  if (state.view === 'find') { $('patch-wall').hidden = true; $('grid').hidden = false; document.body.classList.remove('patches-view', 'albums-view'); renderFind(); return; }
  renderAlbumHead();
  document.body.classList.toggle('patches-view', state.view === 'patches');
  $('patch-wall').hidden = state.view !== 'patches'; $('grid').hidden = state.view === 'patches';
  if (state.view === 'patches') { $('reset-filters').hidden = true; renderPatches(); return; } // Mine's filters don't apply here (playtest room 2026-10-11)
  document.body.classList.toggle('albums-view', state.view === 'albums');
  if (state.view === 'albums') { const caught = state.cards.filter(hasSightings).length; $('owned-count').textContent = caught.toLocaleString(); renderAlbums(); return; }
  const caught = state.cards.filter(hasSightings).length;
  $('owned-count').textContent = caught.toLocaleString();
  document.body.classList.toggle('has-cards', caught > 0); // the intro banner is for an empty collection only (UX room 2026-10-12)
  renderBackupLine(caught);
  $('count').textContent = caught ? `${caught.toLocaleString()} ${caught === 1 ? 'story' : 'stories'} collected. Every one, a moment under the sky.` : 'Real objects. Remarkable stories. Yours to discover.';
  const ps = planStart(); state.planKeys = new Set(ps.keys());
  state.list = state.cards.filter(matches).sort((a, b) => {
    // Sort menu (2026-10-06): default = newest first for your collection, featured order for the field guide.
    const newest = (c) => state.sightingsByKey.get(c.key)?.[0]?.time ?? 0;
    if (state.sort === 'newest') return newest(b) - newest(a) || titleFor(a).localeCompare(titleFor(b));
    if (state.sort === 'rarest') return TIERS.indexOf(b.tier) - TIERS.indexOf(a.tier) || titleFor(a).localeCompare(titleFor(b));
    if (state.sort === 'az') return titleFor(a).localeCompare(titleFor(b));
    if (state.view === 'owned') return newest(b) - newest(a);
    // Lead discovery with what you could catch tonight from here, soonest first (playtest 2026-10-09: it opened on a
    // wall of blurred Legendaries), then the familiar ISS and distinctive rarities, then catalogue order.
    if (ps.has(a.key) || ps.has(b.key)) return (ps.get(a.key) ?? Infinity) - (ps.get(b.key) ?? Infinity);
    if (String(a.id) === '25544') return -1;
    if (String(b.id) === '25544') return 1;
    return TIERS.indexOf(b.tier) - TIERS.indexOf(a.tier) || (a.set ?? '').localeCompare(b.set ?? '') || (a.setNumber ?? 0) - (b.setNumber ?? 0);
  });
  state.titleCount = new Map(); for (const c of state.list) state.titleCount.set(titleFor(c), (state.titleCount.get(titleFor(c)) ?? 0) + 1);
  const total = state.list.length;
  $('results').textContent = `${total.toLocaleString()} ${total === 1 ? 'card' : 'cards'}${state.view === 'owned' ? ' in your collection' : ' in the field guide'}`;
  markFilters();
  $('reset-filters').hidden = state.view === 'patches' || !state.query && state.set === 'all' && state.rarity === 'all' && (state.sort ?? 'auto') === 'auto';
  observer.disconnect();
  $('grid').replaceChildren();
  if (!total) {
    const empty = document.createElement('div'); empty.className = 'empty';
    if (state.view === 'owned' && !caught) {
      empty.innerHTML = '<span class="empty__orbit" aria-hidden="true">✧</span><h2>Your first story is up there.</h2><p>Record a sighting in the live sky to earn your first card. The ISS is a wonderful place to start.</p><a href="./?resume=1">Explore the sky ↗</a><button type="button" class="secondary">Browse the field guide</button>';
      empty.querySelector('button').addEventListener('click', () => setView('discover'));
    } else {
      empty.innerHTML = '<span class="empty__orbit empty__search" aria-hidden="true"><svg viewBox="0 0 48 48" width="44" height="44" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="21" cy="21" r="12"/><path d="M30 30 L40 40"/><circle cx="21" cy="21" r="5.5" stroke-dasharray="2 3.2" opacity=".6"/><path d="M17 13.5a8 8 0 0 1 8.5-0.8" opacity=".55"/></svg></span><h2>No cards found.</h2><p>Try a different name, collection or rarity.</p><button type="button">Clear filters</button>';
      empty.querySelector('button').addEventListener('click', resetFilters);
    }
    $('grid').append(empty); appendUpNext(0); return;
  }
  const frag = document.createDocumentFragment();
  for (const c of state.list) {
    const slot = document.createElement('div'); slot.className = 'tile-slot'; slot.dataset.key = c.key;
    frag.append(slot);
  }
  $('grid').append(frag);
  appendUpNext(total);
  for (const slot of $('grid').children) if (!slot.classList.contains('up-next')) observer.observe(slot);
}
const DIR_WORD = { N: 'north', NE: 'northeast', E: 'east', SE: 'southeast', S: 'south', SW: 'southwest', W: 'west', NW: 'northwest' };
const hm = (t) => new Date(t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
function renderUpPanel(c, up) {
  const el = $('v-up'); el.hidden = !up; if (!up) return;
  const key = `${up.id}@${up.start}`, far = up.start > Date.now() + 10 * 60000, on = findReminded.has(key);
  const where = `${up.peakEl >= 70 ? 'almost overhead' : up.peakEl >= 35 ? 'high' : 'low'} in the ${DIR_WORD[up.dir] ?? up.dir}`;
  el.innerHTML = `<p class="v-up__when">Up tonight · <b>${esc(hm(up.start))}</b> · ${esc(where)}</p>
    <div class="v-up__btns">${far ? `<button type="button" class="v-up__remind${on ? ' on' : ''}" aria-pressed="${on}">${BEL}<span>${on ? `Reminder on · ${esc(hm(up.start - 10 * 60000))}` : `Remind me at ${esc(hm(up.start - 10 * 60000))}`}</span></button>` : '<span class="v-up__soon">Starting soon: look now</span>'}<button type="button" class="v-up__show">Show me</button></div>`;
  const send = (sc) => { if (EMBED) window.parent.postMessage({ sc, id: up.id, start: up.start }, location.origin); else ticket({ kind: 'info', line: sc === 'up-remind' ? 'Reminders work in the Space Collector app.' : 'Open Explore to be shown where to look.', ms: 3000 }); };
  el.querySelector('.v-up__remind')?.addEventListener('click', () => send('up-remind'));
  el.querySelector('.v-up__show').addEventListener('click', () => send('up-show'));
  el._key = key; el._card = c; el._up = up;
}
let upCards = [];
function openUpNext(i) {
  const was = state.list; state.list = upCards.slice();
  $('viewer').addEventListener('close', () => { state.list = was; }, { once: true });
  openViewer(i);
}
function appendUpNext(total) {
  const frag = document.createDocumentFragment();
  // A small collection (under 9 cards) fills the rest of its first rows with "Up tonight" slots: the next things you
  // could catch, with times. Tap one for a reminder (playtest 2026-10-09, #10).
  if (!(state.view === 'owned' && total < 9 && !state.query && state.set === 'all' && state.rarity === 'all')) return;
  {
    const seen = new Set(); upCards = [];
    for (const x of state.plan) {
      if (seen.size >= 9 - total) break;
      const c = state.byKey.get(x.key); if (!c || seen.has(x.key) || hasSightings(c)) continue; seen.add(x.key);
      const slot = document.createElement('div'); slot.className = 'tile-slot up-next';
      const tile = renderCardTile(c, { sightings: [] }); tile.classList.add('up-next__tile');
      const when = new Date(x.start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      tile.insertAdjacentHTML('afterbegin', `<span class="up-next__when"><small>Up tonight</small>${esc(when)} · ${esc(x.dir)}</span>`);
      tile.setAttribute('aria-label', `${titleFor(c)}, up tonight at ${when} in the ${x.dir}. Preview the card`);
      // Tap previews the card in the viewer (2026-10-16, Sevaan: a tap used to set a reminder blind); the viewer's
      // next-pass pill has the bell. The Up tonight cards are the viewer's list, so you can swipe through them.
      upCards.push(c); const i = upCards.length - 1;
      tile.addEventListener('click', () => openUpNext(i));
      slot.append(tile); frag.append(slot);
    }
    $('grid').append(frag);
  }
}
function setView(view) {
  const changed = state.view !== view;
  state.view = view;
  if (changed) { for (const el of [$('grid'), $('patch-wall')]) { el.classList.remove('swap'); void el.offsetWidth; el.classList.add('swap'); } cascadeLeft = 16; }
  $('tab-owned').setAttribute('aria-pressed', String(view === 'owned'));
  $('tab-discover').setAttribute('aria-pressed', String(view === 'find'));
  $('tab-albums').setAttribute('aria-pressed', String(view === 'albums' || view === 'discover')); // Discover has no tab now (2026-10-11, Sevaan): it opens from Albums, so Albums stays lit
  $('tab-patches').setAttribute('aria-pressed', String(view === 'patches'));
  moveInk();
  if (state.ready) render();
}
function resetFilters() {
  state.query = ''; state.set = 'all'; state.rarity = 'all'; state.sort = 'auto'; $('sort-by').value = 'auto';
  $('search').value = ''; $('set-filter').value = 'all'; $('rarity-filter').value = 'all';
  if (state.ready) render();
}
$('filters-btn').addEventListener('click', () => { const b = $('filters-btn'), open = b.getAttribute('aria-expanded') !== 'true'; b.setAttribute('aria-expanded', String(open)); $('filter-row').classList.toggle('open', open); });
function markFilters() { return $('filters-btn').classList.toggle('active', state.set !== 'all' || state.rarity !== 'all' || (state.sort ?? 'auto') !== 'auto'); } // a dot when a filter is on
$('tab-owned').addEventListener('click', () => setView('owned'));
$('tab-discover').addEventListener('click', () => setView('find'));
$('tab-albums').addEventListener('click', () => { resetFilters(); setView('albums'); });
$('reset-filters').addEventListener('click', resetFilters);
let searchTimer;
$('search').addEventListener('input', (e) => { clearTimeout(searchTimer); state.query = e.target.value.trim().toLowerCase(); searchTimer = setTimeout(() => { if (state.ready) (window.flipGrid ?? ((f) => f()))(render); }, 120); });
$('set-filter').addEventListener('change', (e) => { const v = e.target.value; if (state.ready) window.flipGrid(() => { state.set = v; render(); }); else state.set = v; });
$('rarity-filter').addEventListener('change', (e) => { const v = e.target.value; if (state.ready) window.flipGrid(() => { state.rarity = v; render(); }); else state.rarity = v; });
$('sort-by').addEventListener('change', (e) => { const v = e.target.value; if (state.ready) window.flipGrid(() => { state.sort = v; render(); }); else state.sort = v; });


let tilt = null, stopGyro = null, lastFocus = null;
function stopEffects() { stopGyro?.(); stopGyro = null; tilt?.destroy(); tilt = null; globe?.stop(); globe = null; clearInterval(whereTimer); }

// Phone tilt is always on in the viewer. iOS needs permission once, asked from the tap that opens a card.
let motionPermission = typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function' ? 'unknown' : 'granted';
function askMotion() {
  if (motionPermission !== 'unknown') return;
  motionPermission = 'asking';
  DeviceOrientationEvent.requestPermission()
    .then((r) => { motionPermission = r === 'granted' ? 'granted' : 'denied'; if (motionPermission === 'granted' && tilt && !stopGyro) stopGyro = attachGyro($('slot').firstElementChild, tilt); })
    .catch(() => { motionPermission = 'unknown'; }); // not from a tap (e.g. a deep link); try again on the next tap
}
let globe = null, whereTimer = 0;
const myPlace = () => { try { const o = JSON.parse(localStorage.getItem('observer')); return o && Number.isFinite(o.lat) ? { lat: o.lat, lon: o.lon } : null; } catch { return null; } };
function showCard() {
  stopEffects();
  const c = state.list[state.index]; if (!c) return;
  const sightings = state.sightingsByKey.get(c.key) ?? [];
  const el = renderCard(c, { sightings, seenMembers: state.seenMembers.get(c.key)?.size ?? 0, preview: state.preview, ownedKeys: ownedKeys() });
  $('v-share').hidden = !sightings.length;
  $('slot').replaceChildren(el);
  tilt = attachTilt(el);
  // Orbit view (js/orbit-view.js): one tap swaps the picture for a live globe of its orbit, another tap swaps back.
  const art = el.querySelector('.card__art'), canOrbit = !!c.el && !c.natural && !c.archived;
  attachFlip(el, { onBack: (b) => applyBack(b, c), onTap: canOrbit ? () => {
    if (globe) { globe.stop(); globe = null; art.classList.remove('orbiting'); return; }
    globe = orbitGlobe(c, art, myPlace()); if (globe) { art.classList.add('orbiting'); sfx('page', { gain: 0.6 }); }
  } : null });
  if (canOrbit) el.classList.add('can-orbit');
  // Where it is now, under the card, live (2026-10-14).
  const where = () => { const t = canOrbit ? whereLine(c) : null; $('v-where').hidden = !t; if (t) $('v-where').textContent = t; };
  where(); whereTimer = canOrbit ? setInterval(where, 1000) : 0;
  if (!reducedMotion.matches && motionPermission !== 'denied') stopGyro = attachGyro(el, tilt);
  $('v-position').textContent = `${state.index + 1} / ${state.list.length.toLocaleString()}`;
  const firstTime = sightings.length ? Math.min(...sightings.map((s) => s.time)) : 0;
  // The card itself shows when you collected it, so no date here (2026-10-05).
  $('v-status').textContent = sightings.length ? (c.archived ? 'Saved from an earlier catalogue' : '') : state.preview ? 'Artwork preview · this card has not been added to your collection.' : 'Not yet collected · record a live sighting to earn this card.';
  $('v-preview').hidden = sightings.length > 0;
  $('v-preview').textContent = state.preview ? 'Back to uncollected card' : 'Preview artwork';
  // Its next pass with a target and a bell, like Find (2026-10-13, Sevaan).
  // Up tonight panel (2026-10-16, design/upnext-remind.html 1): any card with a pass in tonight's plan, fleets included,
  // gets when and where plus a big Remind me and Show me. It replaces the small next-pass pill below.
  const up = state.plan.filter((x) => x.key === c.key && x.end > Date.now()).sort((a, b) => a.start - b.start)[0];
  renderUpPanel(c, up);
  const vn = $('v-next'); vn.hidden = !EMBED || !!c.natural || !!c.launches || !!up;
  if (!vn.hidden) { vn.innerHTML = `<span class="fd-pass" data-id="${esc(String(c.id))}">${findPassLine(c)}</span><span class="fd-acts"></span>`; findActs(vn, c);
    if (!findPasses.has(c.id)) window.parent.postMessage({ sc: 'find-passes', ids: [c.id], req: ++findReq }, location.origin); }
  $('v-history').replaceChildren();
  // (The cream passport block is gone, 2026-10-06: each sighting row names its launch instead.)
  if (sightings.length) {
    const heading = document.createElement('h2');
    heading.textContent = c.launches ? `Every sighting · ${sightings.length}` : sightings.length === 1 ? 'When you saw it' : `When you saw it · ${sightings.length} times`;
    $('v-history').append(heading);
    const points = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    for (const s of [...sightings].sort((a, b) => b.time - a.time)) {
      const row = document.createElement('p');
      const when = `${dateLabel(s.time)} · ${new Date(s.time).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
      const where = s.el != null ? `${Math.round(s.el)}° up in the ${points[Math.round(((s.az % 360) + 360) % 360 / 45) % 8]}` : '';
      // Fleet cards: which launch this sighting was (its stamp), with the launch date.
      const launch = c.launches && s.stampKey ? c.launches.find((l) => l.key === s.stampKey) : null;
      const launchLine = c.launches ? (launch ? `Launch ${esc(s.stampKey.split(':')[1] ?? s.stampKey)} · ${launch.n ?? ''} satellites launched ${esc(new Date(`${launch.launch}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }))}` : 'Launch unknown') : '';
      row.className = launchLine ? 'with-launch' : '';
      row.innerHTML = `<span class="h-main"><span>${esc(when)}</span>${where ? `<span> · ${esc(where)}</span>` : ''}</span>${launchLine ? `<span class="h-launch">${launchLine.replace(/\s+satellites/, ' satellites')}</span>` : ''}`; // no delete button (2026-10-14, Sevaan: people don't need to delete when they saw it)
      row.querySelector('button')?.addEventListener('click', async () => {
        if (!confirm('Delete this sighting? If it was your only one, the card leaves your collection.')) return;
        try { await deleteSighting(s.key); } catch { ticket({ kind: 'info', line: 'That sighting could not be deleted. Try again.' }); return; }
        removeSighting(s); // and from the backup, when signed in
        state.raw = state.raw.filter((x) => x.key !== s.key);
        // Remove it from its own card's list (a constellation shows its stars' sightings, so that's the star's card),
        // then re-render the grid before the viewer so the position and Next stay in step (QA 2026-10-08).
        for (const k of new Set([s.cardKey ?? c.key, c.key])) {
          const left = (state.sightingsByKey.get(k) ?? []).filter((x) => x.key !== s.key);
          if (left.length) state.sightingsByKey.set(k, left); else { state.sightingsByKey.delete(k); state.seenMembers.delete(k); }
        }
        linkConstellations();
        render();
        const i = state.list.findIndex((x) => x.key === c.key);
        if (i >= 0) state.index = i;
        else if (!state.list.length) { closeViewer(); return; }
        else state.index = Math.min(state.index, state.list.length - 1);
        showCard();
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
  if (opening) applyBack(backEl, state.list[state.index]);
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
  const card = $('slot').firstElementChild; sfx('swipe');
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
  if (!state.list.length) return;
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
    slideTo(-dir * window.innerWidth, 180); sfx('page', { gap: 120 });
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
// Same sky as Explore (2026-10-07): the page background takes the colours Explore last painted (night navy, dusk,
// day), dimmed under a scrim in brighter skies so cream text stays readable. Fresh for 3 hours, else the default.
(function applySkyTone() {
  let tone = null; try { tone = JSON.parse(localStorage.getItem('skyTone')); } catch {}
  if (!tone?.a || Date.now() - (tone.at ?? 0) > 3 * 3600e3) return;
  const scrim = Math.min(0.72, (tone.f ?? 0) * 0.9);
  const glow = (tone.f ?? 0) < 0.2 ? 'radial-gradient(ellipse 90% 70% at 50% 45%, rgba(143,179,207,.07), transparent 70%), ' : ''; // Explore's soft atmospheric glow at night
  const bg = `${glow}linear-gradient(rgba(6,10,18,${scrim.toFixed(2)}), rgba(6,10,18,${scrim.toFixed(2)})), linear-gradient(${tone.a}, ${tone.b})`;
  document.documentElement.style.setProperty('--page-sky', bg);
  hasSkyTone = true;
  document.body.classList.toggle('sky-tone', document.documentElement.dataset.theme !== 'night' && !document.body.classList.contains('night'));
})();
attachTileTilt($('grid'));
$('viewer').addEventListener('close', () => { stopEffects(); document.body.style.overflow = ''; lastFocus?.focus(); });
$('slot').addEventListener('pointerdown', askMotion);
$('v-preview').addEventListener('click', () => { state.preview = !state.preview; showCard(); });
// Share the card on screen as an image (js/share-card.js), reading what it shows so the image matches.
$('v-share').addEventListener('click', async () => {
  const c = state.list[state.index], el = $('slot').firstElementChild; if (!c || !el) return;
  const btn = $('v-share'); btn.disabled = true; btn.textContent = 'Making the image…';
  try {
    const info = (k) => { const x = state.byKey.get(k); return x ? { tier: x.tier, tier0: x.tier0, type: x.type, owner: x.owner, launch: x.launch, natural: x.natural, con: x.con } : null; };
    const how = await shareCardEl(el, c, { title: titleFor(c), rank: progress(state.raw, info, { constellations: conList(), deals: readDeals(), albums: state.albums, carry: xpCarry(state.raw, info, { constellations: conList(), deals: readDeals() }) }).rank.name, fact: factFor(c) }); // same rank as the logbook (QA 2026-10-08)
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

// Three cards per row (2026-10-09, Sevaan: the size slider is gone; three is what looks best on a phone), five on
// a wide screen.
{
  const grid = $('grid');
  const applySize = () => {
    const cols = innerWidth >= 700 ? 5 : 3;
    grid.dataset.cols = cols; grid.style.setProperty('--cols', cols);
    const w = (grid.clientWidth || innerWidth - 40) / cols;
    grid.classList.toggle('single', false); grid.classList.toggle('dense', w < 140); grid.classList.toggle('tiny', w < 92); grid.classList.toggle('micro', w < 66);
  };
  addEventListener('resize', applySize);
  applySize();
}

try { sessionStorage.setItem('scBooted', '1'); } catch {} // the app is open: going to Explore skips the loader

// Inside the app shell (index.html #collection-frame, 2026-10-07): links back to Explore tell the shell instead of
// navigating; the shell sends the safe-area insets (an iframe doesn't get them) and asks us to open a card.
// "12 cards · not backed up · Sign in ›" under the heading until you sign in (2026-10-11, design/auth-moments.html 3).
// Inside the app it asks Explore to open the sign-in sheet; on its own it goes to Settings.
function renderBackupLine(caught) {
  let signedIn = false; try { signedIn = !!JSON.parse(localStorage.getItem('acct')); } catch {}
  const el = document.getElementById('backup-line'); if (!el) return;
  el.hidden = signedIn || !caught;
  if (!el.hidden) document.getElementById('backup-text').textContent = `${caught.toLocaleString()} card${caught === 1 ? '' : 's'} · not backed up`;
}
document.getElementById('backup-line')?.addEventListener('click', () => {
  if (window.parent !== window) window.parent.postMessage({ sc: 'signin' }, location.origin); else location.href = 'index.html?resume=1&more=1';
});
window.addEventListener('storage', (e) => { if (e.key === 'acct') renderBackupLine(state.cards.filter(hasSightings).length); });
const EMBED = window.parent !== window && new URLSearchParams(location.search).has('embed');
if (EMBED) {
  document.documentElement.classList.add('embedded');
  // Explore's switcher sits over this page; while a card, patch or the stats are open it steps aside so it doesn't
  // cover their bottom rows (playtest 2026-10-11: the sighting list's delete × was under it).
  { const dlgs = ['viewer', 'patch-view', 'stats-view'].map((id) => document.getElementById(id)).filter(Boolean); let was = null;
    const tell = () => { const on = dlgs.some((d) => d.open); if (on !== was) { was = on; window.parent.postMessage({ sc: 'modal', on }, location.origin); } };
    const mo = new MutationObserver(tell); dlgs.forEach((d) => mo.observe(d, { attributes: true, attributeFilter: ['open'] })); }
  document.addEventListener('click', (e) => {
    // The Collection pill itself: already here, so stay (QA 2026-10-08: it loaded cards.html without ?embed inside
    // the frame, and the next Explore tap then ran a second copy of the whole app in there).
    if (e.target.closest('a[href^="cards.html"]')) { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    const a = e.target.closest('a[href^="./"], a[href^="index.html"]'); if (!a) return;
    e.preventDefault();
    const more = /more=1/.test(a.getAttribute('href')), sky = /sky=1/.test(a.getAttribute('href')), nav = a.closest('.sc-switch');
    if (nav) setSwitch(nav, 'left'); // slide the pill to Explore, then hand back
    setTimeout(() => window.parent.postMessage({ sc: 'explore', more, sky }, location.origin), nav ? SLIDE_MS : 0);
  });
  window.addEventListener('message', (e) => {
    if (e.origin !== location.origin || !e.data?.sc) return;
    if (e.data.sc === 'insets') { const r = document.documentElement.style; r.setProperty('--safe-top', `${e.data.top}px`); r.setProperty('--safe-bottom', `${e.data.bottom}px`); }
    if (e.data.sc === 'open' || e.data.sc === 'show') setSwitch(document.querySelector('.sc-switch'), 'right', false); // shown again: pill on Collection
    if ((e.data.sc === 'open' || e.data.sc === 'show') && e.data.key === '#stats') { const go = () => (state.ready ? openStats() : setTimeout(go, 200)); go(); } // from Settings → Observer stats
    else if ((e.data.sc === 'open' || e.data.sc === 'show') && e.data.key) openKey(e.data.key);
    if (e.data.sc === 'back') { // Android Back from the app shell: close the top thing here, else go back to Explore
      if ($('stats-view').open) $('stats-view').close(); else if ($('patch-view').open) closePatch(); else if ($('viewer').open) closeViewer();
      else window.parent.postMessage({ sc: 'explore' }, location.origin);
    }
    if (e.data.sc === 'refresh') refreshSightings();
    // Hidden behind the sky, its animations (twinkles, shimmers, drift) pause (2026-10-16 perf sweep).
    if (e.data.sc === 'away') document.documentElement.classList.add('away');
    if (e.data.sc === 'open' || e.data.sc === 'show') document.documentElement.classList.remove('away');
    if (e.data.sc === 'tonight') { state.plan = readPlan(); if (state.ready && ['owned', 'discover'].includes(state.view)) render(); }
  });
}
function openKey(key) {
  const go = () => {
    if (key === 'patches') { setView('patches'); return; }
    if (!state.byKey.has(key) && /^[A-Z]+:/.test(key)) key = key.split(':')[0];
    if (!state.byKey.has(key)) key = state.keyOfId?.get(String(key)) ?? key; // a satellite that's now part of a fleet (QA 2026-10-08)
    if (!state.byKey.has(key)) return;
    // Open it in a list that contains it: the right tab, and filters cleared if they hide it (QA 2026-10-08: a
    // leftover rarity filter, or the Albums / Patches tab, made "View in collection" open nothing).
    const want = state.sightingsByKey.has(key) ? 'owned' : 'discover';
    if (!['owned', 'discover'].includes(state.view) || (want === 'discover' && state.view !== 'discover')) setView(want);
    let i = state.list.findIndex((c) => c.key === key);
    if (i < 0) { resetFilters(); i = state.list.findIndex((c) => c.key === key); }
    if (i < 0 && state.view !== 'discover') { setView('discover'); i = state.list.findIndex((c) => c.key === key); }
    openViewer(i);
  };
  if (state.ready) go(); else { const t = setInterval(() => { if (state.ready) { clearInterval(t); go(); } }, 100); }
}

// ---------- mission patches: the wall and the detail view (2026-10-08, design/patches.html) ----------
// Every achievement is a patch; earned ones in full colour (gold foil / holo on the special ones), the rest a faint
// stitched outline with the name so you can see what's out there. Group chips filter. Tap a patch for its detail.
state.patchGroup = 'all';
$('tab-patches').addEventListener('click', () => setView('patches'));
let earnedCache = null;
function earnedDates() {
  // When each patch was earned: replay your sightings in order and note when each one first turns on. Explore also
  // records the moment it happens (localStorage patchDates), which wins when present.
  const n = state.raw.length;
  if (earnedCache?.n === n) return earnedCache.dates;
  let stored = {}; try { stored = JSON.parse(localStorage.getItem('patchDates') || '{}'); } catch {}
  const info = (k) => { const c = state.byKey.get(k); return c ? { tier: c.tier, tier0: c.tier0, type: c.type, owner: c.owner, launch: c.launch, natural: c.natural, con: c.con } : null; };
  const cons = conList();
  const list = state.raw.filter((x) => !x.sim).slice().sort((a, b) => a.time - b.time), dates = {};
  const want = new Set((state.achievements ?? []).filter((a) => a.done && !stored[a.id]).map((a) => a.id));
  for (let i = 0; i < list.length && want.size; i++) {
    const p = progress(list.slice(0, i + 1), info, { constellations: cons, albums: state.albums, now: list[i].time, deals: readDeals(), carry: xpCarry(state.raw, info, { constellations: cons, deals: readDeals() }) });
    for (const a of p.achievements) if (a.done && want.has(a.id)) { dates[a.id] = list[i].time; want.delete(a.id); }
  }
  Object.assign(dates, stored);
  earnedCache = { n, dates }; return dates;
}
function renderPatches() {
  let seenUnset = false; try { seenUnset = localStorage.getItem('patchSeen') == null; } catch {} // storage can be blocked (QA 2026-10-08)
  if (seenUnset) try { localStorage.setItem('patchSeen', JSON.stringify((state.achievements ?? []).filter((a) => a.done).map((a) => a.id))); } catch {} // existing patches start as seen
  const wall = $('patch-wall'), dates = earnedDates();
  // The secret Fossil Hunter patch only joins the wall once found (js/fossil.js); no empty slot hints at it.
  let fossil = null; try { fossil = JSON.parse(localStorage.getItem('fossilFound')); } catch {}
  let ufo = null; try { ufo = JSON.parse(localStorage.getItem('ufoFound')); } catch {}
  let sec = {}; try { sec = JSON.parse(localStorage.getItem('secrets')) || {}; } catch {}
  const SEC = Object.fromEntries(Object.values(SECRET_PATCHES).map((x) => [x.id, [x.name, x.text.replace(/\.$/, '')]])); // every secret, from js/secrets.js
  const secs = Object.keys(SEC).filter((k) => sec[k] && hasPatch(k, sec[k])).map((k) => ({ id: k, name: SEC[k][0], text: SEC[k][1], icon: '', secret: true, done: true }));
  const all = [...secs, ...(fossil ? [{ id: 'fossil', name: 'Fossil Hunter', text: 'Found dinosaur bones buried under your feet', icon: '', secret: true, done: true }] : []), ...(ufo ? [{ id: 'ufo', name: 'Close Encounter', text: "Something crossed your sky that isn't in any catalogue", icon: '', secret: true, done: true }] : []), ...(state.achievements ?? [])];
  if (ufo) dates.ufo ??= ufo.at;
  for (const k of Object.keys(sec)) dates[k] ??= sec[k];
  if (fossil) dates.fossil ??= fossil.at;
  const done = all.filter((a) => a.done).length;
  $('results').textContent = `${done} of ${all.length} patches earned`;
  const groups = GROUP_ORDER.filter((g) => all.some((a) => groupOf(a) === g));
  const shown = all.filter((a) => state.patchGroup === 'all' || groupOf(a) === state.patchGroup)
    .sort((a, b) => Number(b.done) - Number(a.done) || (a.done ? (dates[b.id] ?? 0) - (dates[a.id] ?? 0) : 0) || GROUP_ORDER.indexOf(groupOf(a)) - GROUP_ORDER.indexOf(groupOf(b))); // earned first, newest at the top (2026-10-14, Sevaan), then by group
  wall.innerHTML = `<div class="pw-chips">${['all', ...groups].map((g) => `<button type="button" class="ui-chip pw-chip${state.patchGroup === g ? ' on' : ''}" data-g="${g}"><b>${g === 'all' ? 'All' : esc(GROUPS[g].t)}</b><span class="ui-chip__k">${(g === 'all' ? all : all.filter((a) => groupOf(a) === g)).filter((a) => a.done).length}</span></button>`).join('')}</div>
    ${state.patchGroup !== 'all' && !shown.some((a) => a.done) ? `<div class="pw-empty"><span class="empty__orbit" aria-hidden="true">✦</span><span>None yet in ${esc(GROUPS[state.patchGroup]?.t ?? 'this group')}. Each outline below says what earns it.</span></div>` : ''}
    ${state.patchGroup === 'all' && all.filter((a) => a.done).length < 3 ? (() => { const easy = ['first', 'moon', 'twilight', 'station', 'stars10'].map((id) => all.find((a) => a.id === id && !a.done)).filter(Boolean).slice(0, 3);
      return easy.length ? `<div class="pw-start"><span>Start here</span><div class="pw-grid">${easy.map((a) => `<button type="button" class="pw-item" data-id="${a.id}">${patchHtml(a, { locked: true, prog: a.prog })}<span>${esc(a.name)}<small>${esc(a.text)}</small></span></button>`).join('')}</div></div><span class="lab" style="display:block;margin:0 4px 10px;color:#bdbea9;font:500 12px/1.2 'SC Label',sans-serif;letter-spacing:.16em;text-transform:uppercase">All patches</span>` : ''; })() : ''}
    <div class="pw-grid">${shown.map((a) => `<button type="button" class="pw-item${a.done ? '' : ' locked'}${a.done && !patchSeen().has(a.id) ? ' new' : ''}" data-id="${a.id}" aria-label="${esc(a.name)}${a.done ? ', earned' : ', not earned yet'}">${patchHtml(a, { locked: !a.done, prog: a.prog })}<span>${esc(a.name)}</span></button>`).join('')}</div>`;
  wall.onclick = (e) => {
    const chip = e.target.closest('.pw-chip'); if (chip) { state.patchGroup = chip.dataset.g; renderPatches(); return; }
    const it = e.target.closest('.pw-item'); if (it) { it.classList.remove('new'); markSeen(it.dataset.id); openPatch(it.dataset.id, it.querySelector('.patch')?.getBoundingClientRect()); }
  };
  void dates;
}
function openPatch(id, from = null) {
  let fossil = null; try { fossil = JSON.parse(localStorage.getItem('fossilFound')); } catch {}
  let ufo = null; try { ufo = JSON.parse(localStorage.getItem('ufoFound')); } catch {}
  let sec = {}; try { sec = JSON.parse(localStorage.getItem('secrets')) || {}; } catch {}
  const SEC = Object.fromEntries(Object.values(SECRET_PATCHES).map((x) => [x.id, [x.name, x.text.replace(/\.$/, '')]])); // every secret, from js/secrets.js
  const secs = Object.keys(SEC).filter((k) => sec[k] && hasPatch(k, sec[k])).map((k) => ({ id: k, name: SEC[k][0], text: SEC[k][1], icon: '', secret: true, done: true }));
  const all = [...secs, ...(fossil ? [{ id: 'fossil', name: 'Fossil Hunter', text: 'Found dinosaur bones buried under your feet', icon: '', secret: true, done: true }] : []), ...(ufo ? [{ id: 'ufo', name: 'Close Encounter', text: "Something crossed your sky that isn't in any catalogue", icon: '', secret: true, done: true }] : []), ...(state.achievements ?? [])], a = all.find((x) => x.id === id); if (!a) return;
  const date = earnedDates()[id] ?? (id === 'fossil' ? fossil?.at : id === 'ufo' ? ufo?.at : sec[id] ?? null), f = finishOf(a);
  $('pv-position').textContent = `PATCH · ${all.filter((x) => x.done).length} / ${all.length}`;
  // On a card (2026-10-09, Sevaan): the patch sits on a card like the collection's, which you flick up and away.
  $('pv-body').innerHTML = `<div class="pv-card${a.done ? '' : ' locked'}"><div class="pv-bar"><span>Mission patch</span><span>${esc(GROUPS[groupOf(a)].t)}</span></div>
    <div class="pv-patch">${patchHtml(a, { locked: !a.done, prog: a.prog })}</div>
    <h2>${esc(a.name)}</h2><p>${esc(a.text)}</p>
    ${!a.done && a.prog && a.prog[1] > 1 ? `<div class="pv-prog"><div class="pv-prog__bar"><i style="width:${Math.min(100, (a.prog[0] / a.prog[1]) * 100).toFixed(1)}%"></i></div><span><b>${a.prog[0].toLocaleString()}</b> of ${a.prog[1].toLocaleString()}</span></div>` : ''}
    <div class="pv-meta">${f ? `<span class="ui-chip"><b>${f === 'gold' ? 'Gold foil' : 'Holo'}</b></span>` : ''}${a.secret ? '<span class="ui-chip"><b>Secret</b></span>' : ''}${['catalogue', 'curator', 'months12', 'anniversary', 'streak12', 'cons44'].includes(a.id) && !a.done ? '<span class="ui-chip"><b>Legendary goal</b><span class="ui-chip__k">years, not weeks</span></span>' : ''}</div>
    <div class="pv-foot"><span>${a.done ? (date ? fmtEarned(date) : 'EARNED') : 'NOT YET EARNED'}</span><b>SPACE COLLECTOR</b></div></div>
    <span class="pv-hint" aria-hidden="true">Swipe up to put it away</span>`;
  const d = $('patch-view'); d.showModal();
  // Grow out of the patch you tapped (2026-10-08 polish), and shrink back into it on close.
  patchFrom = from;
  const pv = d.querySelector('.pv-patch');
  if (from && pv && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const to = pv.getBoundingClientRect(), sc = from.width / to.width;
    pv.animate([{ transform: `translate(${from.left + from.width / 2 - (to.left + to.width / 2)}px, ${from.top + from.height / 2 - (to.top + to.height / 2)}px) scale(${sc})` }, { transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.3,1.25,.5,1)' });
    for (const el of d.querySelectorAll('.pv-card > :not(.pv-patch), .pv-hint')) el.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 300, delay: 160, easing: 'ease-out', fill: 'backwards' });
  }
  const patch = d.querySelector('.patch'), host = d.querySelector('.pv-patch');
  // The patch leans toward your finger or the phone's tilt, and the foil sheen follows.
  const lean = (nx, ny) => { host.style.transform = `perspective(700px) rotateY(${(nx * 16).toFixed(1)}deg) rotateX(${(-ny * 16).toFixed(1)}deg)`; patch.classList.add('tilt'); patch.style.setProperty('--x', `${(50 + nx * 50).toFixed(0)}%`); };
  host.onpointermove = (e) => { const r = host.getBoundingClientRect(); lean((e.clientX - r.left) / r.width - 0.5, (e.clientY - r.top) / r.height - 0.5); };
  host.onpointerleave = () => { host.style.transform = ''; };
  const ori = (e) => { if (e.gamma == null) return; lean(Math.max(-0.5, Math.min(0.5, e.gamma / 50)), Math.max(-0.5, Math.min(0.5, ((e.beta ?? 45) - 45) / 50))); };
  addEventListener('deviceorientation', ori);
  d.addEventListener('close', () => removeEventListener('deviceorientation', ori), { once: true });
}
let patchFrom = null;
function closePatch() {
  const d = $('patch-view'), pv = d.querySelector('.pv-patch');
  if (!patchFrom || !pv || matchMedia('(prefers-reduced-motion: reduce)').matches) { d.close(); return; }
  const to = pv.getBoundingClientRect(), f = patchFrom, sc = f.width / to.width;
  d.classList.add('leaving');
  pv.animate([{ transform: 'none' }, { transform: `translate(${f.left + f.width / 2 - (to.left + to.width / 2)}px, ${f.top + f.height / 2 - (to.top + to.height / 2)}px) scale(${sc})` }], { duration: 300, easing: 'cubic-bezier(.4,0,.6,1)', fill: 'forwards' }).onfinish = () => { d.classList.remove('leaving'); d.close(); };
}
$('pv-close').addEventListener('click', closePatch);
// Flick the card up and away, as in the card viewer.
{
  let fl = null;
  const body = $('pv-body');
  body.addEventListener('pointerdown', (e) => { if (e.target.closest('.pv-card')) fl = { id: e.pointerId, pts: [{ x: e.clientX, y: e.clientY, t: performance.now() }] }; });
  body.addEventListener('pointermove', (e) => { if (fl && e.pointerId === fl.id) { fl.pts.push({ x: e.clientX, y: e.clientY, t: performance.now() }); if (fl.pts.length > 12) fl.pts.shift(); } });
  body.addEventListener('pointerup', async (e) => {
    if (!fl || e.pointerId !== fl.id) return;
    const pts = fl.pts; fl = null;
    const last = pts[pts.length - 1], now = performance.now(), from = pts.find((p) => now - p.t < 140) ?? pts[0];
    const dx = last.x - from.x, dy = last.y - from.y, dt = Math.max(16, now - from.t);
    if (!(dy < -45 && last.y - pts[0].y < -60 && Math.abs(dx) < -dy * 0.9 && -dy / dt > 0.6)) return;
    const d = $('patch-view'), card = d.querySelector('.pv-card');
    if (card && !reducedMotion.matches) { d.classList.add('flicked'); await new Promise((r) => setTimeout(r, throwOff(card, dx, dy, dt))); }
    d.close(); d.classList.remove('flicked');
  });
  body.addEventListener('pointercancel', () => { fl = null; });
}
addStarfield($('patch-view'));
$('patch-view').addEventListener('click', (e) => { if (e.target === $('patch-view')) closePatch(); });
$('patch-view').addEventListener('cancel', (e) => { e.preventDefault(); closePatch(); });
// Earned patches you haven't opened yet wear a NEW tag (localStorage patchSeen).
function patchSeen() { try { return new Set(JSON.parse(localStorage.getItem('patchSeen')) || []); } catch { return new Set(); } }
function markSeen(id) { const s = patchSeen(); s.add(id); try { localStorage.setItem('patchSeen', JSON.stringify([...s])); } catch {} }
addEventListener('hashchange', () => { let k = ''; try { k = decodeURIComponent(location.hash.slice(1)); } catch {} if (k) openKey(k); });

// 7 · Show the card-size slider only while there's a grid of cards on screen (2026-10-08 playtest).
{
  let onScreen = false;
  const update = () => { const has = !!$('grid').querySelector('.tile-slot') && !$('grid').hidden; document.body.classList.toggle('grid-off', !(has && onScreen)); };
  new IntersectionObserver((es) => { onScreen = es.some((e) => e.isIntersecting); update(); }, { rootMargin: '0px 0px -35% 0px' }).observe($('grid'));
  new MutationObserver(update).observe($('grid'), { childList: true, attributes: true, attributeFilter: ['hidden'] });
  update();
}

// ---------- polish (2026-10-08) ----------
// The tabs' orange underline slides to the current tab.
function moveInk() {
  const bar = document.querySelector('.collection-tabs'); if (!bar) return;
  let ink = bar.querySelector('.tab-ink'); if (!ink) { ink = document.createElement('i'); ink.className = 'tab-ink'; bar.append(ink); }
  const on = bar.querySelector('button[aria-pressed="true"]'); if (!on) return;
  ink.style.width = `${on.offsetWidth}px`; ink.style.transform = `translateX(${on.offsetLeft}px)`;
}
addEventListener('resize', moveInk); setTimeout(moveInk, 300);
// Filters, sort and search: cards that stay glide to their new place (FLIP), new ones rise in.
{
  const flip = (fn) => {
    const grid = $('grid'), before = new Map([...grid.querySelectorAll('.tile-slot')].map((el) => [el.dataset.key, el.getBoundingClientRect()]));
    fn();
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    for (const el of grid.querySelectorAll('.tile-slot')) {
      const a = before.get(el.dataset.key), b = el.getBoundingClientRect(); if (b.bottom < 0 || b.top > innerHeight) continue;
      if (a) { const dx = a.left - b.left, dy = a.top - b.top; if (Math.abs(dx) + Math.abs(dy) > 1) el.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'none' }], { duration: 300, easing: 'cubic-bezier(.2,.8,.2,1)' }); }
      else el.animate([{ opacity: 0, transform: 'translateY(10px) scale(.97)' }, { opacity: 1, transform: 'none' }], { duration: 280, easing: 'cubic-bezier(.2,.8,.2,1)' });
    }
  };
  window.flipGrid = flip;
}
// The owned count pops when it changes.
// …and ticks up through the numbers in between.
{ let last = null, busy = false; new MutationObserver(() => { if (busy) return; const el = $('owned-count'), to = Number(el.textContent.replace(/\D/g, '')), from = Number(String(last ?? '').replace(/\D/g, ''));
    if (last != null && el.textContent !== last && Number.isFinite(to) && Number.isFinite(from) && to > from && to - from < 200 && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      busy = true; const t0 = performance.now(), dur = Math.min(700, 120 + (to - from) * 60);
      const step = () => { const k = Math.min(1, (performance.now() - t0) / dur); el.textContent = Math.round(from + (to - from) * (1 - (1 - k) ** 3)).toLocaleString(); if (k < 1) requestAnimationFrame(step); else { busy = false; el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); } };
      requestAnimationFrame(step);
    }
    last = el.textContent; }).observe($('owned-count'), { childList: true, characterData: true, subtree: true }); }

// Offline caching (sw.js, 2026-10-08). Inside the app's Collection layer the parent page has already registered it.
if ('serviceWorker' in navigator && window.parent === window && !isNative()) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
// The rank card opens to show missions, the ladder and events, and remembers it (2026-10-12).
document.addEventListener('click', (e) => {
  const b = e.target.closest('#lb-more'); if (!b) return;
  e.stopPropagation();
  const card = $('logbook'), open = card.classList.toggle('compact') === false;
  b.setAttribute('aria-expanded', String(open)); b.textContent = open ? 'Less' : 'Missions ›';
  try { localStorage.setItem('lbOpen', open ? '1' : '0'); } catch {}
});
