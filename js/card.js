// Trading-card rendering and the tilt/shine interaction. Card dimensions are in em, so the same
// markup works as a big interactive card or a small grid thumbnail (just change font-size).

import { cardArt } from './art.js';
import { TIER_INFO } from './rarity.js';
import { TYPE_LABEL, ownerName, siteName, formatDate, orbitStats, sizeLabel, autoLore, titleCase } from './facts.js';

// Card level from number of sightings.
export function levelFor(count) {
  if (count >= 25) return 'gold';
  if (count >= 5) return 'silver';
  if (count >= 1) return 'bronze';
  return 'none';
}

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// o: catalogue object. opts: { number, total, sightings: [...], lore, forceState, forceLevel }
export function renderCard(o, opts = {}) {
  const sightings = opts.sightings ?? [];
  const caught = opts.forceState ? opts.forceState !== 'uncaught' : sightings.length > 0;
  const extinct = opts.forceState === 'extinct' || (caught && !!o.decay);
  const level = opts.forceLevel ?? levelFor(sightings.length);
  const tier = TIER_INFO[o.tier] ?? TIER_INFO.common;
  const stats = orbitStats(o);
  const age = o.year ? new Date().getFullYear() - o.year : null;
  const lore = opts.lore ?? autoLore(o);

  const el = document.createElement('div');
  el.className = `card tier-${o.tier} level-${level}${caught ? '' : ' uncaught'}${extinct ? ' extinct' : ''}`;
  el.style.setProperty('--tier', tier.color);
  el.dataset.id = o.id;

  const first = sightings.length ? sightings[sightings.length - 1] : null;
  const seenLine = first
    ? `First caught ${new Date(first.time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} · Seen ${sightings.length}×`
    : caught ? 'Preview' : 'Not caught yet';

  const q = (v) => (caught ? v : '?');
  el.innerHTML = `
  <div class="card__rotator">
    <div class="card__front">
      <div class="card__frame">
        <header class="card__head">
          <div class="card__title"><span class="card__gem">${tier.gem}</span><h3>${esc(titleCase(o.name))}</h3></div>
          <div class="card__age">${age != null ? `<b>${q(age)}</b><small>YRS</small>` : ''}</div>
        </header>
        <div class="card__sub">${esc(TYPE_LABEL[o.type] ?? 'Object')} · ${esc(ownerName(o.owner))}</div>
        <div class="card__art">
          ${cardArt(o, { silhouette: !caught })}
          <div class="card__holo"></div>
        </div>
        <div class="card__facts">${caught
          ? `Launched ${esc(formatDate(o.launch))} · ${esc(siteName(o.site).split(',')[0])}`
          : 'Catch it to reveal its launch details'}</div>
        <div class="card__stats">
          <div><small>ALTITUDE</small><b>${q(stats ? `${stats.alt.toLocaleString()} km` : '—')}</b></div>
          <div><small>SPEED</small><b>${q(stats ? `${stats.speed.toFixed(1)} km/s` : '—')}</b></div>
          <div><small>SIZE</small><b>${q(sizeLabel(o.rcs))}</b></div>
          <div><small>ORBIT</small><b>${q(o.incl != null ? `${Math.round(o.incl)}°` : '—')}</b></div>
        </div>
        <p class="card__lore">${caught ? esc(lore) : 'Point your phone at it when it passes over to unlock its story.'}</p>
        <div class="card__seen">${esc(seenLine)}</div>
        <footer class="card__foot">
          <span>${opts.number ? `#${String(opts.number).padStart(3, '0')}${opts.total ? ` / ${opts.total}` : ''}` : ''} · NORAD ${o.id}</span>
          <span class="card__rarity">${tier.gem} ${tier.label.toUpperCase()}</span>
        </footer>
      </div>
      <div class="card__shine"></div>
      <div class="card__glare"></div>
      ${extinct ? `<div class="card__stamp">REENTERED${o.decay ? `<br>${esc(formatDate(o.decay)).toUpperCase()}` : ''}</div>` : ''}
    </div>
  </div>`;
  return el;
}

// Pointer tilt: sets CSS variables the shine layers read. Springs back when released.
export function attachTilt(el) {
  const set = (px, py) => {
    const rx = (0.5 - py) * 22, ry = (px - 0.5) * 26;
    el.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
    el.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
    el.style.setProperty('--rx', `${rx.toFixed(2)}deg`);
    el.style.setProperty('--ry', `${ry.toFixed(2)}deg`);
    el.style.setProperty('--posx', `${(50 + (px - 0.5) * 80).toFixed(1)}%`);
    el.style.setProperty('--posy', `${(50 + (py - 0.5) * 80).toFixed(1)}%`);
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
  el.addEventListener('pointerup', (e) => { if (e.pointerType !== 'mouse') reset(); });
  reset();
  return { set, reset };
}

// Phone tilt: shine follows how you tilt the phone. Returns a stop function.
export function attachGyro(el, tilt) {
  let base = null;
  const onOri = (e) => {
    if (e.beta == null || e.gamma == null) return;
    base ??= { b: e.beta, g: e.gamma };
    const px = 0.5 + Math.max(-1, Math.min(1, (e.gamma - base.g) / 30)) * 0.5;
    const py = 0.5 + Math.max(-1, Math.min(1, (e.beta - base.b) / 30)) * 0.5;
    el.classList.add('active');
    tilt.set(px, py);
  };
  window.addEventListener('deviceorientation', onOri);
  return () => window.removeEventListener('deviceorientation', onOri);
}
