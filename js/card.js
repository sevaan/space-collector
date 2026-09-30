// Archival field cards. Text remains live; the foil follows pointer or optional phone tilt.
import { cardArt } from './art.js?v=0.1.44';
import { TIER_INFO } from './rarity.js?v=0.1.44';
import { SET_BY_ID } from './sets.js?v=0.1.44';
import { TYPE_LABEL, orbitStats, sizeLabel, formatDate } from './facts.js?v=0.1.44';
import { titleFor, factFor, yearsUp, lapsPerDay, thirdStat, richText } from './lore.js?v=0.1.44';

export function levelFor(count) {
  return count >= 25 ? 'gold' : count >= 5 ? 'silver' : count >= 1 ? 'bronze' : 'none';
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
  const level = opts.forceLevel ?? levelFor(sightings.length);
  const tier = TIER_INFO[o.tier] ?? TIER_INFO.common;
  const set = SET_BY_ID[o.set] ?? { name: 'Field archive', color: '#d74730' };
  const stats = orbitStats(o), age = yearsUp(o), laps = lapsPerDay(o);
  // A crew count changes often and is not supplied by the orbital catalogue.
  const loreStat = thirdStat(o, sizeLabel(o.rcs), opts.seenMembers ?? 0);
  const third = loreStat.label === 'CREW' ? { label: 'LAUNCHED', value: o.launch?.slice(0, 4) ?? '—' } : loreStat;
  const title = titleFor(o);
  const el = document.createElement('article');
  el.className = `card tier-${o.tier ?? 'common'} level-${level}${revealed ? '' : ' uncaught'}${!caught ? ' not-owned' : ''}${extinct ? ' extinct' : ''}${title.length > 24 ? ' long-name' : ''}`;
  el.style.setProperty('--set', set.color);
  el.style.setProperty('--tier', tier.color);
  el.dataset.id = o.id;
  el.setAttribute('aria-label', `${title}, ${tier.label}, ${caught ? 'collected' : 'not collected'}`);
  const first = caught ? Math.min(...sightings.map((s) => s.time)) : null;
  const firstDate = first ? new Date(first).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase() : '';
  const seen = caught ? `COLLECTED ${firstDate}${sightings.length > 1 ? ` · SEEN ${sightings.length}×` : ''}` : opts.preview ? 'PREVIEW · NOT COLLECTED' : 'NOT YET COLLECTED';
  const ageLabel = age === 0 ? 'UNDER A YEAR IN ORBIT' : age === 1 ? 'YEAR SINCE LAUNCH' : 'YEARS SINCE LAUNCH';
  const number = o.setNumber ? `${String(o.setNumber).padStart(2, '0')} / ${String(o.setSize).padStart(2, '0')}` : 'ARCHIVE';
  el.innerHTML = `
  <div class="card__rotator"><div class="card__face">
    <div class="card__setbar"><span>${orbitIcon}${esc(set.name.toUpperCase())}</span><span title="Position in the current catalogue">${esc(number)}</span></div>
    <div class="card__top"><span class="card__tier"><i aria-hidden="true">${tier.gem}</i> ${tier.label.toUpperCase()}</span><span class="card__label card__mono">${o.members ? `${o.members.length} SATELLITES` : `NORAD ${esc(o.id)}`}</span></div>
    <h3 class="card__name">${String(o.id) === '25544' ? esc(title).replace('International Space Station', 'International<br>Space Station') : esc(title)}</h3>
    <div class="card__identity"><span>${esc(TYPE_LABEL[o.type] ?? 'Orbital object')}</span><span>${o.bino ? 'Binocular target' : 'Orbital field guide'}</span></div>
    <div class="card__art">${cardArt(o, { accent: set.color, silhouette: !revealed })}<div class="card__foil"></div></div>
    <div class="card__agebar"><span class="card__age">${age == null ? '—' : age === 0 ? 'NEW' : age}<small>${age == null ? 'LAUNCH DATE UNKNOWN' : ageLabel}</small></span><span class="card__seen">${seen}</span></div>
    <div class="card__fact"><span class="card__note-label">${revealed ? 'A NOTE FROM ORBIT' : 'YOUR NEXT DISCOVERY'}</span><p>${revealed ? richText(factFor(o)) : `Observe this ${esc((TYPE_LABEL[o.type] ?? 'object').toLowerCase())} in the live sky to add its story to your collection.`}</p></div>
    <div class="card__stats"><div><span class="card__label">MEAN ALTITUDE</span><b>${stats ? `${stats.alt.toLocaleString('en-US')} <small>km</small>` : '—'}</b></div><div><span class="card__label">ORBITS / DAY</span><b>${laps ? laps.toFixed(laps < 10 ? 1 : 0) : '—'}</b></div><div><span class="card__label">${esc(third.label)}</span><b>${esc(third.value)}</b></div></div>
    <div class="card__footer"><span>SPACE COLLECTOR</span><span>${o.archived ? 'SAVED FIELD RECORD' : 'CURRENT CATALOGUE EDITION'}</span></div>
    <div class="card__shine"></div><div class="card__glare"></div>
    ${extinct ? `<div class="card__stamp">REENTERED${o.decay ? `<small>${esc(formatDate(o.decay)).toUpperCase()}</small>` : ''}</div>` : ''}
  </div></div>`;
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
  tile.className = `card-tile${caught ? ' is-owned' : ''}`;
  tile.style.setProperty('--set', set.color);
  tile.setAttribute('aria-label', `${title}, ${tier.label}, ${caught ? `collected, ${sightings.length} sightings` : 'not collected'}. View card`);
  tile.innerHTML = `<span class="card-tile__set">${esc(set.name)}</span><span class="card-tile__art">${cardArt(o, { accent: set.color, silhouette: !caught })}</span><span class="card-tile__body"><span class="card-tile__tier">${tier.gem} ${tier.label}</span><span class="card-tile__name">${esc(title)}</span><span class="card-tile__status">${caught ? `✓ Collected ${new Date(Math.min(...sightings.map((s) => s.time))).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : 'Not yet collected'}<span aria-hidden="true">↗</span></span></span>`;
  return tile;
}

export function attachTilt(el) {
  const set = (px, py) => {
    if (reducedMotion()) { px = .5; py = .5; }
    el.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
    el.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
    el.style.setProperty('--rx', `${((.5 - py) * 18).toFixed(2)}deg`);
    el.style.setProperty('--ry', `${((px - .5) * 22).toFixed(2)}deg`);
    el.style.setProperty('--bgx', `${(40 + px * 20).toFixed(1)}%`);
    el.style.setProperty('--bgy', `${(40 + py * 20).toFixed(1)}%`);
    el.style.setProperty('--hyp', Math.min(1, Math.hypot(px - .5, py - .5) * 2).toFixed(3));
  };
  const state = { touching: false };
  const onMove = (e) => {
    if (reducedMotion() || el.dataset.swiping) return;
    if (e.pointerType !== 'mouse') state.touching = true;
    const b = el.getBoundingClientRect();
    el.classList.add('active');
    set(Math.max(0, Math.min(1, (e.clientX - b.left) / b.width)), Math.max(0, Math.min(1, (e.clientY - b.top) / b.height)));
  };
  const reset = () => { state.touching = false; el.classList.remove('active'); set(.5, .5); };
  const release = () => { state.touching = false; };
  const events = { pointermove: onMove, pointerdown: onMove, pointerleave: reset, pointercancel: release, pointerup: (e) => { if (e.pointerType !== 'mouse') release(); } };
  for (const [name, handler] of Object.entries(events)) el.addEventListener(name, handler);
  // iOS can still start a page scroll from a touch; stop it so a finger on the card only tilts it.
  const noScroll = (e) => e.preventDefault();
  el.addEventListener('touchmove', noScroll, { passive: false });
  reset();
  return {
    set, reset, get touching() { return state.touching; },
    destroy() { for (const [name, handler] of Object.entries(events)) el.removeEventListener(name, handler); el.removeEventListener('touchmove', noScroll); reset(); },
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
    px += (tx - px) * 0.35; py += (ty - py) * 0.35; // smooth out sensor jitter
    el.classList.add('active');
    tilt.set(px, py);
  };
  window.addEventListener('deviceorientation', onOri);
  return () => { window.removeEventListener('deviceorientation', onOri); tilt.reset(); };
}
