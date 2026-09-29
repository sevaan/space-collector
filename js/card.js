// Mission cards (NASA data-sheet style) and the tilt/shine interaction. All sizes are in em
// (a card is 28em × 39.2em), so the same markup works large or as a grid thumbnail.

import { cardArt } from './art.js?v=0.1.9';
import { TIER_INFO } from './rarity.js?v=0.1.9';
import { SET_BY_ID } from './sets.js?v=0.1.9';
import { TYPE_LABEL, orbitStats, sizeLabel, formatDate } from './facts.js?v=0.1.9';
import { titleFor, factFor, yearsUp, lapsPerDay, thirdStat, richText } from './lore.js?v=0.1.9';

export function levelFor(count) {
  if (count >= 25) return 'gold';
  if (count >= 5) return 'silver';
  if (count >= 1) return 'bronze';
  return 'none';
}

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function ageText(n) {
  if (n == null) return { num: '?', label: 'YEARS IN ORBIT' };
  if (n === 0) return { num: 'NEW', label: 'LAUNCHED THIS YEAR' };
  return { num: String(n), label: n === 1 ? 'YEAR IN ORBIT' : 'YEARS IN ORBIT' };
}

// opts: { sightings: [...newest first], preview: bool (render as caught), forceExtinct, forceLevel }
export function renderCard(o, opts = {}) {
  const sightings = opts.sightings ?? [];
  const caught = opts.preview || sightings.length > 0;
  const extinct = opts.forceExtinct || (caught && !!o.decay);
  const level = opts.forceLevel ?? levelFor(sightings.length);
  const tier = TIER_INFO[o.tier] ?? TIER_INFO.common;
  const set = SET_BY_ID[o.set] ?? { name: 'Unsorted', color: '#1f6fd1' };
  const stats = orbitStats(o);
  const age = ageText(yearsUp(o));
  const laps = lapsPerDay(o);
  const third = thirdStat(o, sizeLabel(o.rcs), opts.seenMembers ?? 0);
  const title = titleFor(o);
  const q = (v) => (caught ? v : '?');

  const el = document.createElement('div');
  el.className = `card tier-${o.tier} level-${level}${caught ? '' : ' uncaught'}${extinct ? ' extinct' : ''}${title.length > 24 ? ' long-name' : ''}`;
  el.style.setProperty('--set', set.color);
  el.style.setProperty('--tier', tier.color);
  el.dataset.id = o.id;

  const seen = sightings.length ? `SEEN ${sightings.length}×` : caught ? 'PREVIEW' : 'NOT CAUGHT YET';
  el.innerHTML = `
  <div class="card__rotator">
    <div class="card__face">
      <div class="card__setbar"><span>${esc(set.name.toUpperCase())}</span><span>${String(o.setNumber ?? 0).padStart(2, '0')} / ${String(o.setSize ?? 0).padStart(2, '0')}</span></div>
      <div class="card__top">
        <span class="card__tier"><i>${tier.gem}</i> ${tier.label.toUpperCase()}</span>
        <span class="card__label card__mono">${o.bino ? '<span class="card__bino">BINOCULARS</span> ' : ''}${o.members ? `LAUNCH ${esc(o.cospar ?? '')}` : `NORAD ${o.id}`}</span>
      </div>
      <h3 class="card__name">${esc(title)}</h3>
      <div class="card__art">${cardArt(o, { accent: set.color, silhouette: !caught })}<div class="card__foil"></div></div>
      <div class="card__agebar">
        <span class="card__age">${esc(age.num)} <small>${age.label}</small></span>
        <span class="card__label card__seen">${seen}</span>
      </div>
      <div class="card__fact">${caught ? richText(factFor(o)) : `Catch this ${esc((TYPE_LABEL[o.type] ?? 'object').toLowerCase())} when it passes over to unlock its fact.`}</div>
      <div class="card__stats">
        <div><span class="card__label">HEIGHT</span><b>${q(stats ? `${stats.alt.toLocaleString('en-US')} km` : '—')}</b></div>
        <div><span class="card__label">LAPS A DAY</span><b>${q(laps ? laps.toFixed(laps < 10 ? 1 : 0) : '—')}</b></div>
        <div><span class="card__label">${esc(third.label)}</span><b>${q(esc(third.value))}</b></div>
      </div>
      <div class="card__shine"></div>
      <div class="card__glare"></div>
      ${extinct ? `<div class="card__stamp">REENTERED${o.decay ? `<small>${esc(formatDate(o.decay)).toUpperCase()}</small>` : ''}</div>` : ''}
    </div>
  </div>`;
  return el;
}

// Pointer tilt: sets the CSS variables the shine layers read. Springs back when released.
export function attachTilt(el) {
  const set = (px, py) => {
    el.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
    el.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
    el.style.setProperty('--rx', `${((0.5 - py) * 18).toFixed(2)}deg`);
    el.style.setProperty('--ry', `${((px - 0.5) * 22).toFixed(2)}deg`);
    el.style.setProperty('--bgx', `${(40 + px * 20).toFixed(1)}%`);
    el.style.setProperty('--bgy', `${(40 + py * 20).toFixed(1)}%`);
    el.style.setProperty('--hyp', Math.min(1, Math.hypot(px - 0.5, py - 0.5) * 2).toFixed(3));
  };
  const onMove = (e) => {
    const b = el.getBoundingClientRect();
    el.classList.add('active');
    set(Math.max(0, Math.min(1, (e.clientX - b.left) / b.width)), Math.max(0, Math.min(1, (e.clientY - b.top) / b.height)));
  };
  const reset = () => { el.classList.remove('active'); set(0.5, 0.5); };
  el.addEventListener('pointermove', onMove);
  el.addEventListener('pointerdown', onMove);
  el.addEventListener('pointerleave', reset);
  el.addEventListener('pointercancel', reset);
  reset();
  return { set, reset };
}

// Phone tilt: the shine follows how you tilt the phone. Returns a stop function.
export function attachGyro(el, tilt) {
  let base = null;
  const onOri = (e) => {
    if (e.beta == null || e.gamma == null) return;
    base ??= { b: e.beta, g: e.gamma };
    const px = 0.5 + Math.max(-1, Math.min(1, (e.gamma - base.g) / 25)) * 0.5;
    const py = 0.5 + Math.max(-1, Math.min(1, (e.beta - base.b) / 25)) * 0.5;
    el.classList.add('active');
    tilt.set(px, py);
  };
  window.addEventListener('deviceorientation', onOri);
  return () => window.removeEventListener('deviceorientation', onOri);
}
