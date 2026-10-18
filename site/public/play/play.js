// The website's playable sky (2026-10-18): the app's own SkyView, SkyModel and star chart (copied into ./js by
// scripts/build-site-game.mjs), driven by this small loop instead of main.js. Drag to look around, tap something to
// aim at it, line it up in the circle and Collect. The page that embeds it hears { type: 'sc-collect', … }.
import { SkyView } from './js/sky.js';
import { loadCatalog, frame, track, enuFromAzEl, SkyModel, setSkyLimit } from './js/orbit.js';
import { loadSky, eqToEnu, solarSystem, milkyWayModel, galAxes } from './js/celestial.js';
import { naturalTargets } from './js/natural.js';
import { skyLimit } from './js/sky-limit.js';
import { loadLore, titleFor } from './js/lore.js';
import { placeFromTimeZone } from './js/tz-places.js';
import { TIER_INFO } from './js/rarity.js';

const RAD = Math.PI / 180, $ = (id) => document.getElementById(id);
const touchOnly = matchMedia('(hover: none)').matches;
const q = new URLSearchParams(location.search);
const place = q.has('lat') ? { lat: +q.get('lat'), lon: +q.get('lon'), city: q.get('city') ?? '' } : (() => { const p = placeFromTimeZone(); return p ? { lat: p.lat, lon: p.lon, city: p.label.replace(/^Example:\s*/, '') } : { lat: 43.65, lon: -79.38, city: 'Toronto' }; })();
const observer = { lat: place.lat, lon: place.lon, heightKm: 0.1 };

const sky = new SkyView($('sky'));
sky.setTheme('glass');
sky.showShadow = false;
const state = { offset: 0, model: null, items: [], naturals: [], bodies: null, skyEnu: null, milkyEnu: null, limit: null, frame: null,
  az: 200, el: 38, pinned: null, target: null, lockedOn: false, owned: new Set(), trail: null, caught: 0 };
const now = () => new Date(Date.now() + state.offset);
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
function basisFromAzEl(az, el) { // as js/sensors.js
  const a = az * RAD, e = el * RAD, back = [Math.cos(e) * Math.sin(a), Math.cos(e) * Math.cos(a), Math.sin(e)], right = [Math.cos(a), -Math.sin(a), 0];
  const up = [back[1] * right[2] - back[2] * right[1], back[2] * right[0] - back[0] * right[2], back[0] * right[1] - back[1] * right[0]];
  if (up[2] < 0) { up[0] = -up[0]; up[1] = -up[1]; up[2] = -up[2]; }
  return { right, up, back };
}
const label = (o) => (o._label ??= titleFor(o));
const keyOf = (o) => String(o.natural ? o.key ?? o.name : o.card ?? o.id);

// If it's light out where you are, show tonight instead: the first moment the sky is properly dark, plus a little.
function pickTime() {
  const t0 = Date.now(); if (frame(new Date(t0), observer).sunEl < -10) return 0;
  for (let m = 10; m < 24 * 60; m += 10) if (frame(new Date(t0 + m * 60000), observer).sunEl < -12) return (m + 30) * 60000;
  return 0; // midsummer far north: never dark
}

let milkyEq = null, skyData = null;
function refresh() {
  const d = now(), f = frame(d, observer), toEnu = eqToEnu(d, observer);
  state.frame = f;
  state.bodies = solarSystem(d, observer).map((b) => ({ ...b, enu: toEnu(b.v) }));
  state.milkyEnu = { spine: milkyEq.spine.map((p) => ({ enu: toEnu(p.v), width: p.width, bright: p.bright })),
    specks: sky.mwGL?.ready ? [] : milkyEq.specks.map((p) => ({ enu: toEnu(p.v), a: p.a, s: p.s, w: p.w })),
    rift: sky.mwGL?.ready ? [] : milkyEq.rift.map((p) => ({ enu: toEnu(p.v), w: p.w, a: p.a })),
    clouds: sky.mwGL?.ready ? [] : milkyEq.clouds.map((p) => ({ enu: toEnu(p.v), r: p.r, a: p.a })), gal: galAxes().map(toEnu) };
  if (skyData) state.skyEnu = { stars: skyData.stars.map((s) => ({ ...s, enu: toEnu(s.v) })), lines: skyData.lines.map((seg) => seg.map(toEnu)), constellations: skyData.constellations.map((c) => ({ ...c, enu: toEnu(c.v) })) };
  const moon = state.bodies.find((b) => b.kind === 'moon'), moonEl = moon ? Math.asin(Math.max(-1, Math.min(1, moon.enu[2]))) / RAD : -90;
  state.limit = skyLimit({ sunEl: f.sunEl, moonEl, moonIllum: moon?.illum ?? 0 }); setSkyLimit(state.limit);
  const tg = state.target; // the target's path: a minute behind, three ahead
  if (tg && !tg.obj.natural && (!state.trail || state.trail.id !== tg.obj.id || Math.abs(d - state.trail.at) > 10000)) state.trail = { id: tg.obj.id, at: d.getTime(), pts: track(tg.obj, d, observer, -60, 180, 10) };
}

// ---- looking around: drag the sky; tap something to aim at it and follow it ----
const cv = $('sky');
let drag = null;
cv.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, moved: 0, type: e.pointerType }; cv.setPointerCapture?.(e.pointerId); });
cv.addEventListener('pointermove', (e) => {
  if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY; drag.moved += Math.abs(dx) + Math.abs(dy);
  if (drag.moved < 6) return;
  const k = sky.fovV / sky.h; state.pinned = null; hint();
  state.az = (state.az - dx * k + 360) % 360;
  if (drag.type === 'mouse') state.el = Math.max(3, Math.min(88, state.el + dy * k)); // on a phone, up and down scroll the page
});
const up = (e) => {
  if (!drag) return; const d = drag; drag = null; if (d.moved >= 6) return;
  const x = e.clientX, y = e.clientY, r = sky.reticlePx;
  if (state.lockedOn && Math.hypot(x - sky.cx, y - sky.cy) < r + 16) return collect(); // tap the circle to collect
  let best = null, bd = 40;
  for (const it of [...state.items, ...state.naturals]) { const p = sky.project(enuFromAzEl(it.look.az, it.look.el)); if (!p) continue; const dd = Math.hypot(p.x - x, p.y - y) - (it.obj.natural ? 8 : 0); if (dd < bd) { bd = dd; best = it; } }
  if (best) { state.pinned = best.obj.id ?? best.obj.key; hint(); }
};
cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', () => { drag = null; });
addEventListener('keydown', (e) => { const m = { ArrowLeft: [-3, 0], ArrowRight: [3, 0], ArrowUp: [0, 3], ArrowDown: [0, -3] }[e.key];
  if (m) { state.pinned = null; state.az = (state.az + m[0] + 360) % 360; state.el = Math.max(3, Math.min(88, state.el + m[1])); e.preventDefault(); }
  if ((e.key === 'Enter' || e.key === ' ') && state.lockedOn) { collect(); e.preventDefault(); } });
let hinted = false; function hint() { if (!hinted) { hinted = true; $('hint').classList.add('done'); } }

// ---- the circle: what's in it, the label above, Collect below (the app's #discover) ----
const ui = { box: $('discover'), tier: $('d-tier'), name: $('d-name'), cta: $('d-cta') };
ui.cta.addEventListener('click', () => collect());
let shownKey = '';
function renderTarget() {
  const tg = state.lockedOn ? state.target : null, key = tg ? `${keyOf(tg.obj)}|${state.owned.has(keyOf(tg.obj))}` : '';
  document.documentElement.style.setProperty('--cx', `${sky.cx}px`); document.documentElement.style.setProperty('--cy', `${sky.cy}px`); document.documentElement.style.setProperty('--r', `${sky.reticlePx}px`);
  if (key === shownKey) return; shownKey = key;
  ui.box.hidden = !tg; if (!tg) return;
  const o = tg.obj, info = TIER_INFO[o.tier] ?? TIER_INFO.common, owned = state.owned.has(keyOf(o));
  ui.tier.textContent = owned ? 'In your collection' : `${info.gem} ${info.label}`; ui.box.style.setProperty('--find-tier', owned ? '#bdbea9' : info.color);
  ui.name.textContent = label(o); ui.cta.hidden = owned;
}

function collect() {
  const tg = state.target; if (!state.lockedOn || !tg) return; const k = keyOf(tg.obj); if (state.owned.has(k)) return;
  state.owned.add(k); state.caught++; sky.lockPulseAt = performance.now(); shownKey = '';
  try { navigator.vibrate?.(20); } catch {}
  const o = tg.obj, info = TIER_INFO[o.tier] ?? TIER_INFO.common;
  parent.postMessage({ type: 'sc-collect', name: label(o), tier: o.tier ?? 'common', gem: info.gem, tierLabel: info.label, color: info.color, id: o.natural ? null : o.id, natural: !!o.natural, n: state.caught }, '*');
}

// ---- the loop ----
let lastRefresh = 0, lastUI = 0;
function tick(ts) {
  requestAnimationFrame(tick);
  if (!state.model || document.hidden || paused) return;
  const d = now(), t = performance.now();
  state.model.update(d, observer);
  if (ts - lastRefresh > 1000) { refresh(); lastRefresh = ts; }
  const all = state.model.items(d).filter((a) => a.look.visible);
  state.naturals = naturalTargets(state.bodies, state.skyEnu?.stars, [], state.limit?.stars ?? 5).filter((n) => n.look.visible && n.obj.key !== 'earth' && n.obj.natural !== 'sun');
  // Follow what you tapped: the view eases round to it.
  if (state.pinned != null) {
    const p = all.find((a) => a.obj.id === state.pinned) ?? state.naturals.find((n) => n.obj.key === state.pinned);
    if (!p) state.pinned = null;
    else { let da = ((p.look.az - state.az + 540) % 360) - 180; state.az = (state.az + da * 0.12 + 360) % 360; state.el += (Math.max(3, Math.min(88, p.look.el)) - state.el) * 0.12; }
  }
  const basis = basisFromAzEl(state.az, state.el), rc = Math.cos(sky.reticleDeg * RAD);
  const items = all.map((a) => { const angCos = dot(enuFromAzEl(a.look.az, a.look.el), basis.back); return { obj: a.obj, label: label(a.obj), look: a.look, candidate: angCos > rc, angCos, trail: state.trail?.id === a.obj.id ? state.trail.pts.map((p) => ({ ...p, t: p.t + (state.trail.at - d.getTime()) / 1000 })) : null }; });
  const nats = state.naturals.map((n) => { const angCos = dot(n.look.enu, basis.back); return { obj: n.obj, label: label(n.obj), look: n.look, candidate: angCos > rc, angCos }; });
  state.items = items;
  // The pick: nearest the centre, a satellite over a star, something new over something collected (as the app).
  const score = (it) => Math.acos(Math.min(1, it.angCos)) / RAD - (it.obj.natural ? 0 : 0.5) - (state.owned.has(keyOf(it.obj)) ? 0 : 0.4) - ((it.obj.id ?? it.obj.key) === state.pinned ? 1 : 0);
  const cands = [...items, ...nats].filter((it) => it.candidate).sort((a, b) => score(a) - score(b));
  const target = cands[0] ?? null, wasLocked = state.lockedOn;
  state.target = target; state.lockedOn = !!target && target.angCos > Math.cos(sky.reticleDeg * (wasLocked ? 1.2 : 1) * RAD);
  if (state.lockedOn && !wasLocked) sky.lockPulseAt = t;
  const owned = !!target && state.owned.has(keyOf(target.obj));
  sky.draw(basis, items, {
    showDim: false, sky: state.skyEnu, starLimit: state.limit?.stars, sunEl: state.frame?.sunEl ?? -90, bodies: state.bodies, milky: state.milkyEnu, lines: true,
    targetId: target?.obj.id ?? null, lockedOn: state.lockedOn, naturalTarget: target?.obj.natural ? target.look.enu : null, naturalTargetName: target?.obj.natural ? label(target.obj) : null,
    newFind: !!target && !owned, ownedTarget: owned, time: t, safeTop: 120, safeBottom: 150, centerY: sky.h * 0.52,
  });
  if (t - lastUI > 120 || state.lockedOn !== wasLocked) { renderTarget(); lastUI = t; }
}

// The embedding page pauses the sky while it's scrolled away or showing a card.
let paused = false;
addEventListener('message', (e) => { if (e.data?.type === 'sc-pause') paused = !!e.data.on; });

(async () => {
  await loadLore('data/lore.json');
  const cat = await loadCatalog('data/catalog.json');
  try { skyData = await loadSky('data/sky.json'); } catch {}
  milkyEq = milkyWayModel();
  state.offset = pickTime();
  state.model = new SkyModel(cat.objects);
  state.model.update(now(), observer); refresh();
  sky.warmMilky();
  // Start on the best thing up: the brightest lit satellite well above the horizon, already following it.
  const up = state.model.items(now()).filter((a) => a.look.visible && a.look.el > 18).sort((a, b) => (a.look.mag ?? 9) - (b.look.mag ?? 9));
  if (up[0]) { state.pinned = up[0].obj.id; state.az = (up[0].look.az + 14) % 360; state.el = Math.max(10, up[0].look.el - 6); }
  const when = new Date(now()).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  $('when').textContent = state.offset ? `Tonight over ${place.city} · ${when}` : `Live over ${place.city} right now`;
  document.body.classList.add('ready');
  parent.postMessage({ type: 'sc-ready', city: place.city, live: !state.offset }, '*');
  requestAnimationFrame(tick);
})().catch((e) => { console.error(e); $('when').textContent = 'The sky couldn’t load. Reload to try again.'; });
