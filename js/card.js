// Retro space-age cards. Text remains live; the foil follows pointer or optional phone tilt.
import { cardArt } from './art.js?v=0.1.82';
import { TIER_INFO } from './rarity.js?v=0.1.82';
import { SET_BY_ID } from './sets.js?v=0.1.82';
import { TYPE_LABEL, orbitStats, sizeLabel, formatDate } from './facts.js?v=0.1.82';
import { titleFor, factFor, yearsUp, lapsPerDay, thirdStat, richText, seriesKeyOf } from './lore.js?v=0.1.82';
import { artFileFor } from './art-keys.js?v=0.1.82';
import { ART_FILES } from './art-files.js?v=0.1.82';
import { stampsIn, fleetLevel, fleetThresholds, sightingKeys } from './card-model.js?v=0.1.82';
import { nightsIn } from './observation.js?v=0.1.82';

// Levels count observing nights (local noon to noon): bronze 1, silver 3, gold 10. Before
// 2026-10-01 levels counted sightings (5 silver, 25 gold); anything earned that way is kept.
export function levelFor(nights) {
  return nights >= 10 ? 'gold' : nights >= 3 ? 'silver' : nights >= 1 ? 'bronze' : 'none';
}
const LEGACY_UNTIL = Date.UTC(2026, 9, 1);
const RANK = { none: 0, bronze: 1, silver: 2, gold: 3 };
export function cardLevel(sightings) {
  const real = sightings.filter((s) => !s.sim);
  const old = real.filter((s) => s.time < LEGACY_UNTIL).length;
  const legacy = old >= 25 ? 'gold' : old >= 5 ? 'silver' : 'none';
  const now = levelFor(nightsIn(real));
  return RANK[legacy] > RANK[now] ? legacy : now;
}
// Illustrated art (assets/art/cards, one image shared by every card of a kind) once the card is
// revealed; the drawn art in js/art.js is the fallback and the "not yet collected" silhouette.
export function artImage(o, size = 'full') {
  const file = artFileFor(o, { [o.id]: seriesKeyOf(o) });
  return ART_FILES.has(file) ? `assets/art/cards/${size === 'small' ? 'sm/' : ''}${file}.webp` : null;
}
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const orbitIcon = '<svg viewBox="0 0 32 24" fill="none" aria-hidden="true"><circle cx="16" cy="12" r="7"/><ellipse cx="16" cy="12" rx="15" ry="4.5" transform="rotate(-30 16 12)"/></svg>';

// Preview exposes the artwork and fact without claiming the card was earned.
export function renderCard(o, opts = {}) {
  const sightings = (opts.sightings ?? []).filter((s) => !s.sim);
  const caught = sightings.length > 0;
  const revealed = caught || opts.preview;
  const extinct = opts.forceExtinct || !!o.decay;
  const fleet = !!o.launches, stamps = fleet ? stampsIn(sightings) : null;
  const level = opts.forceLevel ?? (fleet ? fleetLevel(o.family, stamps.size) : cardLevel(sightings));
  const tier = TIER_INFO[o.tier] ?? TIER_INFO.common;
  const set = SET_BY_ID[o.set] ?? { name: 'Field archive', color: '#d74730' };
  const stats = orbitStats(o), age = yearsUp(o), laps = lapsPerDay(o);
  // A crew count changes often and is not supplied by the orbital catalogue.
  const loreStat = thirdStat(o, sizeLabel(o.rcs), opts.seenMembers ?? 0);
  const third = loreStat.label === 'CREW' ? { label: 'LAUNCHED', value: o.launch?.slice(0, 4) ?? '—' } : loreStat;
  const title = titleFor(o);
  const el = document.createElement('article');
  el.className = `card card--retro${fleet ? ' card--fleet' : ''} tier-${o.tier ?? 'common'} level-${level}${revealed ? '' : ' uncaught'}${!caught ? ' not-owned' : ''}${extinct ? ' extinct' : ''}${title.length > 24 ? ' long-name' : ''}`;
  el.style.setProperty('--set', set.color);
  el.style.setProperty('--tier', tier.color);
  el.dataset.id = o.id;
  el.setAttribute('aria-label', `${title}, ${tier.label}, ${caught ? 'collected' : 'not collected'}`);
  const first = caught ? Math.min(...sightings.map((s) => s.time)) : null;
  const firstDate = first != null ? new Date(first).toLocaleDateString('en-GB', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase() : '';
  const nat = !!o.natural;
  const identifier = nat ? o.code : o.members ? `${o.members.length.toLocaleString('en-US')} SATELLITES` : `NORAD ${o.id}`;
  const identity = nat ? (o.type === 'star' ? `Star in ${o.constellation}` : o.type === 'moon' ? 'Natural satellite' : 'Planet') : fleet ? 'Satellite fleet' : TYPE_LABEL[o.type] ?? 'Orbital object';
  const ageText = age == null ? '' : age === 0 ? 'Less than a year ago' : `${age} ${age === 1 ? 'year' : 'years'} ago`;
  const factBlock = fleet ? dotMap(o, stamps, latestStamp(sightings), `${stamps.size} / ${o.launches.length} stamped · ${nextLevel(o.family, level)}`)
    : `<div class="card__fact"><p>${revealed ? richText(factFor(o)) : `Observe this ${esc((TYPE_LABEL[o.type] ?? 'object').toLowerCase())} in the live sky to add its story to your collection.`}</p></div>`;
  el.innerHTML = `
  <div class="card__rotator"><div class="card__face">
    <div class="card__setbar"><span>${orbitIcon}<span>${esc(set.name.toUpperCase())}</span></span><span class="card__tier"><i aria-hidden="true">${tier.gem}</i>${esc(tier.label.toUpperCase())}</span></div>
    <div class="card__heading"><h3 class="card__name">${String(o.id) === '25544' ? esc(title).replace('International Space Station', 'International<br>Space Station') : esc(title)}</h3>
    <div class="card__identity"><span>${esc(identity)}</span><span class="card__mono">${esc(identifier)}</span></div></div>
    <div class="card__art" data-art-slot aria-hidden="true">${revealed && artImage(o) ? `<img class="card-art-image" src="${artImage(o)}" alt="" decoding="async">` : cardArt(o, { accent: set.color, silhouette: !revealed })}<div class="card__foil"></div></div>
    ${nat ? `<div class="card__stats">${o.stats.map(([label, value, unit], i) => `<div><span class="card__label">${esc(label)}</span><b${statClass(value, unit, i)}>${esc(value)}${unit ? ` <small>${esc(unit)}</small>` : ''}</b></div>`).join('')}</div>` : `<div class="card__stats"><div><span class="card__label">MEAN ALTITUDE</span><b>${stats ? `${stats.alt.toLocaleString('en-US')} <small>km</small>` : '—'}</b></div><div><span class="card__label">ORBITS / DAY</span><b>${laps ? laps.toFixed(laps < 10 ? 1 : 0) : '—'}</b></div><div><span class="card__label">${esc(third.label)}</span><b>${esc(third.value)}</b>${/LAUNCH/.test(third.label) && ageText ? `<span class="card__stat-detail">${esc(ageText)}</span>` : ''}</div></div>`}
    ${factBlock}
    <div class="card__footer"><span class="card__status${caught ? ' is-collected' : ''}"><span class="card__status-icon" aria-hidden="true">${caught ? '✓' : ''}</span><span>${caught ? `COLLECTED · ${esc(firstDate)}` : 'NOT YET COLLECTED'}</span></span><span class="card__brand">SPACE COLLECTOR</span></div>
    <div class="card__shine"></div><div class="card__glare"></div>
    <div class="card__back" aria-hidden="true"><div class="back-holo"></div><div class="back-glare"></div></div>
    ${extinct ? `<div class="card__stamp">REENTERED${o.decay ? `<small>${esc(formatDate(o.decay)).toUpperCase()}</small>` : ''}</div>` : ''}
  </div></div>`;
  return el;
}

// Natural-object stats: a number and its short unit stay on one line ("10.7 h"). Only long figures
// step down a size: 10+ characters, or 8+ in the narrower second and third columns. Words (a
// constellation name) can wrap.
function statClass(value, unit, i = 0) {
  const v = String(value);
  if (!unit) return v.length > 9 ? ' class="small"' : '';
  const n = (v + ' ' + unit).length;
  return n >= 10 || (i > 0 && n >= 8) ? ' class="fit long"' : ' class="fit"';
}

// ---------- fleet cards ----------

function nextLevel(family, level) {
  const [, s, g] = fleetThresholds(family);
  return level === 'bronze' ? `SILVER AT ${s}` : level === 'silver' ? `GOLD AT ${g}` : level === 'gold' ? 'TOP LEVEL' : 'BRONZE AT 1';
}
// The stamp earned most recently (by when you first saw that launch).
function stampHistory(sightings) {
  const first = new Map();
  for (const s of sightings) {
    if (s.sim) continue;
    const k = sightingKeys(s).stampKey;
    if (k && (!first.has(k) || s.time < first.get(k))) first.set(k, s.time);
  }
  return [...first].map(([key, time]) => ({ key, time })).sort((a, b) => b.time - a.time);
}
const latestStamp = (sightings) => stampHistory(sightings.filter((s) => !s.sim))[0]?.key ?? null;

// Every launch in the fleet as a dot, oldest to newest; stamped ones filled, the newest ringed.
// summary ("4 / 421 stamped · SILVER AT 10") sits between the first and last launch years, under the dots.
function dotMap(o, stamps, latest, summary = '') {
  const n = o.launches.length, cols = n > 200 ? 36 : n > 60 ? 18 : Math.min(14, Math.max(10, n)), gap = n > 200 ? '.15em' : '.45em';
  const dots = o.launches.map((l) => `<i class="${stamps.has(l.key) ? 'on' : ''}${l.key === latest ? ' latest' : ''}"></i>`).join('');
  const y0 = o.launches[0]?.launch?.slice(0, 4) ?? '', y1 = o.launches.at(-1)?.launch?.slice(0, 4) ?? '';
  return `<div class="fl-dots"><span class="card__note-label">EVERY ${esc(String(o.familyName).toUpperCase())} LAUNCH</span><div class="fl-grid" style="--cols:${cols};--gap:${gap}">${dots}</div><div class="fl-years"><span>${esc(y0)}</span>${summary ? `<span class="fl-sum">${esc(summary)}</span>` : ''}<span>${esc(y1)}</span></div></div>`;
}

const shortDay = (t) => new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase();
const launchDay = (iso) => (iso ? new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'unknown date');
function inkStamp(stamp, launch, i, big = false) {
  const cospar = stamp.key.split(':')[1] ?? stamp.key;
  const r = [-8, 6, -3, 10, -12, 4, 8, -6][i % 8];
  const when = launch?.launch ? launchDay(launch.launch).toUpperCase().replace(/ \d{4}$/, '') : '';
  return `<div class="ink-stamp${big ? ' big' : ''}" style="--r:${big ? -6 : r}deg"><span><b>${esc(cospar)}</b>${esc(when)}<br>SEEN ${esc(shortDay(stamp.time))}</span></div>`;
}

// Card viewer: your stamps for a fleet card, newest first and larger, then the rest, then empty slots.
export function renderPassport(o, sightings) {
  const el = document.createElement('section');
  el.className = 'passport';
  const history = stampHistory(sightings);
  const byKey = new Map(o.launches.map((l) => [l.key, l]));
  const level = fleetLevel(o.family, history.length);
  const [newest, ...rest] = history;
  const left = o.launches.length - history.length;
  const empty = Math.min(left, rest.length % 4 ? 4 - (rest.length % 4) : 4);
  const next = nextLevel(o.family, level).toLowerCase().replace(/^./, (c) => c.toUpperCase());
  el.innerHTML = `<h2>Passport · ${history.length} of ${o.launches.length} launches</h2>
    ${newest ? `<div class="passport__latest">${inkStamp(newest, byKey.get(newest.key), 0, true)}<p>Newest stamp: <b>launch ${esc(newest.key.split(':')[1] ?? newest.key)}</b>${byKey.get(newest.key) ? `, ${byKey.get(newest.key).n} satellites launched ${esc(launchDay(byKey.get(newest.key).launch))}` : ''}.<br>Seen ${esc(new Date(newest.time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }))}. ${level === 'gold' ? 'Top level reached.' : `${esc(next)} launches.`}</p></div>` : ''}
    ${rest.length || empty ? `<div class="passport__stamps">${rest.map((st, i) => inkStamp(st, byKey.get(st.key), i + 1)).join('')}${'<div class="ink-stamp blank"><span>?</span></div>'.repeat(empty)}</div>` : ''}`;
  return el;
}

export function renderCardTile(o, opts = {}) {
  const sightings = (opts.sightings ?? []).filter((s) => !s.sim);
  const caught = sightings.length > 0;
  const tier = TIER_INFO[o.tier] ?? TIER_INFO.common;
  const set = SET_BY_ID[o.set] ?? { name: 'Field archive', color: '#d74730' };
  const title = titleFor(o);
  const tile = document.createElement('button');
  tile.type = 'button';
  tile.className = `card-tile card-tile--retro${caught ? ' is-owned' : ''}`;
  tile.style.setProperty('--set', set.color);
  tile.setAttribute('aria-label', `${title}, ${tier.label}, ${caught ? `collected, ${sightings.length} sightings` : 'not collected'}. View card`);
  tile.innerHTML = `<span class="card-tile__set">${esc(set.name)}</span><span class="card-tile__art">${caught && artImage(o, 'small') ? `<img class="card-art-image" src="${artImage(o, 'small')}" alt="" loading="lazy" decoding="async">` : cardArt(o, { accent: set.color, silhouette: !caught })}</span><span class="card-tile__body"><span class="card-tile__tier">${tier.gem} ${tier.label}</span><span class="card-tile__name">${esc(title)}</span><span class="card-tile__status">${caught ? (o.launches ? `✓ ${stampsIn(sightings).size} of ${o.launches.length} launches` : `✓ Collected ${new Date(Math.min(...sightings.map((s) => s.time))).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`) : 'Not yet collected'}<span aria-hidden="true">↗</span></span></span>`;
  return tile;
}

// Tilt, glare and foil follow the finger (or phone tilt, via attachGyro) through a spring, so the card
// overshoots a touch as you move it and wobbles gently back to rest when you let go.
const FOLLOW = { k: 0.085, d: 0.27 };   // while handled: quick and tight
const SETTLE = { k: 0.03, d: 0.13 };    // let go: slower, with a little wobble
const MAX_RX = 15, MAX_RY = 19;         // degrees
export function attachTilt(el) {
  const cur = { x: .5, y: .5, o: 0 }, vel = { x: 0, y: 0, o: 0 }, want = { x: .5, y: .5, o: 0 };
  let spring = SETTLE, raf = 0;
  const state = { touching: false };
  const write = () => {
    const { x, y } = cur, o = Math.max(0, Math.min(1, cur.o));
    el.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
    el.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
    el.style.setProperty('--rx', `${((.5 - y) * 2 * MAX_RX).toFixed(2)}deg`);
    el.style.setProperty('--ry', `${((x - .5) * 2 * MAX_RY).toFixed(2)}deg`);
    el.style.setProperty('--bgx', `${(37 + x * 26).toFixed(1)}%`);
    el.style.setProperty('--bgy', `${(33 + y * 34).toFixed(1)}%`);
    el.style.setProperty('--hyp', Math.min(1, Math.hypot(x - .5, y - .5) * 2).toFixed(3));
    el.style.setProperty('--o', o.toFixed(3));
  };
  const step = () => {
    let moving = false;
    for (const key of ['x', 'y', 'o']) {
      vel[key] += (want[key] - cur[key]) * spring.k;
      vel[key] *= 1 - spring.d;
      cur[key] += vel[key];
      if (Math.abs(vel[key]) > 1e-4 || Math.abs(want[key] - cur[key]) > 1e-3) moving = true;
    }
    write();
    raf = moving ? requestAnimationFrame(step) : 0;
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(step); };
  const set = (px, py) => {
    if (reducedMotion()) { px = .5; py = .5; }
    want.x = px; want.y = py; want.o = 1; spring = FOLLOW;
    el.classList.add('active');
    kick();
  };
  const reset = () => {
    want.x = .5; want.y = .5; want.o = 0; spring = SETTLE;
    el.classList.remove('active');
    kick();
  };
  const onMove = (e) => {
    if (reducedMotion() || el.dataset.swiping) return;
    if (e.pointerType !== 'mouse') state.touching = true;
    const b = el.getBoundingClientRect();
    set(Math.max(0, Math.min(1, (e.clientX - b.left) / b.width)), Math.max(0, Math.min(1, (e.clientY - b.top) / b.height)));
  };
  const release = () => { state.touching = false; };
  const events = { pointermove: onMove, pointerdown: onMove, pointerleave: reset, pointercancel: release, pointerup: (e) => { if (e.pointerType !== 'mouse') release(); } };
  for (const [name, handler] of Object.entries(events)) el.addEventListener(name, handler);
  // iOS can still start a page scroll from a touch; stop it so a finger on the card only tilts it.
  const noScroll = (e) => e.preventDefault();
  el.addEventListener('touchmove', noScroll, { passive: false });
  write();
  return {
    set, reset, get touching() { return state.touching; },
    destroy() { for (const [name, handler] of Object.entries(events)) el.removeEventListener(name, handler); el.removeEventListener('touchmove', noScroll); cancelAnimationFrame(raf); raf = 0; cur.x = cur.y = .5; cur.o = 0; write(); },
  };
}

// Phone tilt moves the card and its foil. The resting angle is whatever the phone was at when the
// card opened, and it slowly follows you so the card settles back if you just change how you hold it.
// A finger on the card takes over until it lifts.
export function attachGyro(el, tilt) {
  let base = null, px = .5, py = .5;
  const onOri = (e) => {
    if (e.beta == null || e.gamma == null || reducedMotion() || tilt.touching) return;
    base ??= { b: e.beta, g: e.gamma };
    base.b += (e.beta - base.b) * 0.01;
    base.g += (e.gamma - base.g) * 0.01;
    const tx = .5 + Math.max(-1, Math.min(1, (e.gamma - base.g) / 20)) * .5;
    const ty = .5 + Math.max(-1, Math.min(1, (e.beta - base.b) / 20)) * .5;
    px += (tx - px) * 0.5; py += (ty - py) * 0.5; // take the edge off sensor jitter; the spring does the rest
    tilt.set(px, py);
  };
  window.addEventListener('deviceorientation', onOri);
  return () => { window.removeEventListener('deviceorientation', onOri); tilt.reset(); };
}

// Double-tap (or double-click) a card to flip it over and see its back; do it again to flip it back.
// onBack(backEl) dresses the back (a random poster, js/card-backs.js) each time it turns to the back.
// The back is pre-mirrored in CSS, so it reads correctly while the card faces away.
export function attachFlip(el, { onBack } = {}) {
  let flipped = false, busy = false, lastTap = 0, lastX = 0, lastY = 0;
  const back = el.querySelector('.card__back');
  const flip = () => {
    if (busy || !back) return;
    busy = true; flipped = !flipped;
    if (flipped) onBack?.(back);
    const ms = reducedMotion() ? 1 : 560, from = flipped ? 0 : 180, to = flipped ? 180 : 360;
    el.animate([{ transform: `perspective(1600px) rotateY(${from}deg)` }, { transform: `perspective(1600px) rotateY(${to}deg)` }],
      { duration: ms, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
    setTimeout(() => { back.style.opacity = flipped ? '1' : ''; }, ms / 2); // edge-on: swap faces
    setTimeout(() => { busy = false; }, ms);
  };
  const onUp = (e) => {
    if (e.pointerType === 'mouse' || el.dataset.swiping) return; // mice use dblclick
    const now = performance.now();
    if (now - lastTap < 320 && Math.hypot(e.clientX - lastX, e.clientY - lastY) < 30) { lastTap = 0; flip(); }
    else { lastTap = now; lastX = e.clientX; lastY = e.clientY; }
  };
  const onDbl = (e) => { e.preventDefault(); flip(); };
  el.addEventListener('pointerup', onUp);
  el.addEventListener('dblclick', onDbl);
  return {
    get flipped() { return flipped; },
    destroy() { el.removeEventListener('pointerup', onUp); el.removeEventListener('dblclick', onDbl); },
  };
}
