import { VERSION } from './version.js?v=0.1.15';
import { loadCatalog, frame, look, track, motion, nextVisiblePass, compassPoint, enuFromAzEl, DARK_SUN_ELEVATION, SkyModel, setBinocularMode } from './orbit.js?v=0.1.15';
import { startSensors, hasLiveSensors, trueBasis, basisFromAzEl, pointing, nudgeHeading, getNudge } from './sensors.js?v=0.1.15';
import { SkyView, shortName } from './sky.js?v=0.1.15';
import { loadSky, eqToEnu, solarSystem, galacticPlane } from './celestial.js?v=0.1.15';
import { addSighting, allSightings, deleteSighting } from './store.js?v=0.1.15';
import { cardArt } from './art.js?v=0.1.15';
import { TIER_INFO } from './rarity.js?v=0.1.15';
import { SETS } from './sets.js?v=0.1.15';
import { TYPE_LABEL, ownerName, orbitStats } from './facts.js?v=0.1.15';
import { loadLore, titleFor, factFor, richText } from './lore.js?v=0.1.15';

const $ = (id) => document.getElementById(id);
const RAD = Math.PI / 180;
const DEFAULT_LOCATION = { lat: 44.3091, lon: -78.3197, label: 'Peterborough (default)' };

const state = {
  catalog: null,
  observer: loadSavedLocation() ?? { ...DEFAULT_LOCATION },
  timeOffsetMs: 0,
  drag: { on: false, az: 180, el: 35 },
  showDim: false,
  showStars: true,
  showLines: true,
  night: readPref('night', false),
  sky: null,       // stars/constellations from data/sky.json (equatorial vectors)
  skyEnu: null,    // same, rotated into the local sky, refreshed every second
  milkyEq: galacticPlane(),
  milkyEnu: null,
  bodies: [],      // Sun, Moon, planets in the local sky
  captureAny: false,
  model: null,     // SkyModel: tracks what's above the horizon
  items: [],       // latest interpolated positions: [{ obj, look }]
  binoculars: readPref('binoculars', false),
  trails: new Map(),
  sticky: new Map(), // candidate id -> last time it was in the reticle
  candidates: [],
  targetId: null,
  smooth: null,
  sightings: [],
  familyCounts: new Map(), // card key -> number of satellites in that launch
};

const sky = new SkyView($('sky'));
$('version').textContent = `v${VERSION}`;

function now() { return new Date(Date.now() + state.timeOffsetMs); }
function isSim() { return state.timeOffsetMs !== 0 || state.drag.on || !hasLiveSensors(); }

// ---------- prefs & location ----------

function readPref(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v === '1'; } catch { return d; } }
function writePref(k, v) { try { localStorage.setItem(k, v ? '1' : '0'); } catch {} }

function loadSavedLocation() {
  try { return JSON.parse(localStorage.getItem('observer')); } catch { return null; }
}

function requestLocation() {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(
    (p) => {
      state.observer = { lat: p.coords.latitude, lon: p.coords.longitude, heightKm: (p.coords.altitude ?? 0) / 1000, label: 'GPS' };
      try { localStorage.setItem('observer', JSON.stringify({ ...state.observer, label: 'last GPS fix' })); } catch {}
      state.trails.clear();
      state.model?.reset();
    },
    () => {},
    { enableHighAccuracy: false, timeout: 15000, maximumAge: 10 * 60 * 1000 },
  );
}

function applyTheme() {
  document.body.classList.toggle('night', state.night);
  sky.setTheme(state.night ? 'night' : 'glass');
  document.querySelector('meta[name=theme-color]').content = state.night ? '#000000' : '#050a18';
}
applyTheme();

// ---------- sound ----------

let audio;
function unlockAudio() {
  try { audio ??= new (window.AudioContext || window.webkitAudioContext)(); audio.resume(); } catch {}
}
function chirp(freqs = [660, 990], dur = 0.09) {
  if (!audio) return;
  let t = audio.currentTime;
  for (const f of freqs) {
    const o = audio.createOscillator(), g = audio.createGain();
    o.frequency.value = f; o.type = 'sine';
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.18, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(audio.destination);
    o.start(t); o.stop(t + dur + 0.02);
    t += dur;
  }
}

// ---------- wake lock ----------

let wakeLock = null;
async function keepAwake() {
  try { wakeLock = await navigator.wakeLock?.request('screen'); } catch {}
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') { keepAwake(); checkForUpdate(); }
});

// ---------- updates ----------

async function checkForUpdate() {
  try {
    const res = await fetch(`version.json?t=${Date.now()}`, { cache: 'no-store' });
    const { version } = await res.json();
    if (version && version !== VERSION) showBanner(`New build v${version} is out (running v${VERSION}). Tap to update.`, () => location.reload());
  } catch {}
}

// ---------- banner & toast ----------

let bannerAction = null;
let bannerKey = '';
function showBanner(text, action = null) {
  if (bannerKey === text) return;
  bannerKey = text;
  $('banner').textContent = text;
  $('banner').hidden = !text;
  bannerAction = action;
}
$('banner').addEventListener('click', () => bannerAction?.());

let toastTimer;
let toastHref = null;
function toast(html, ms = 2200, href = null) {
  $('toast').innerHTML = html;
  $('toast').hidden = false;
  toastHref = href;
  $('toast').classList.toggle('linked', !!href);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { $('toast').hidden = true; }, ms);
}
$('toast').addEventListener('click', () => { if (toastHref) location.href = toastHref; });

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ---------- object descriptions ----------

function label(obj) { return (obj._label ??= titleFor(obj)); }
function setColor(obj) { return (obj._setColor ??= (SETS.find((s) => s.test(obj)) ?? SETS[SETS.length - 1]).color); }

function brightnessWord(mag) {
  if (mag == null) return 'not lit';
  if (mag < -1) return 'very bright';
  if (mag < 1.5) return 'bright';
  if (mag < 3.5) return 'easy to see';
  if (mag < 5) return 'faint';
  return 'binoculars';
}

function familyName(obj) { return state.catalog.families?.[obj.family]?.name ?? obj.family; }

function objectFact(obj) {
  if (obj.family) {
    const n = state.familyCounts.get(obj.card) ?? 0;
    const when = obj.launch ? new Date(`${obj.launch}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'an unknown date';
    return `One of **${n} ${familyName(obj)} satellites** launched together on ${when}. Catch more from this launch to fill its card.`;
  }
  return factFor(obj);
}

// ---------- sky computation ----------

const MAX_TRAILS = 12;

// Once a second: trails, Sun/Moon/stars, status line.
function refreshAbove() {
  if (!state.catalog) return;
  const d = now();
  const f = frame(d, state.observer);
  state.frame = f;

  // Trails (60 s back, 3 min ahead) for the visible objects nearest where you're pointing.
  // Refreshed every 10 s of sky time; capped so a sky full of Starlinks stays smooth.
  const back = state.basis?.back ?? [0, 1, 0];
  const nearest = state.items
    .filter((it) => it.look.visible || state.showDim)
    .map((it) => ({ it, c: dot(enuFromAzEl(it.look.az, it.look.el), back) }))
    .sort((a, b) => b.c - a.c)
    .slice(0, MAX_TRAILS);
  const keep = new Set();
  for (const { it } of nearest) {
    keep.add(it.obj.id);
    const t = state.trails.get(it.obj.id);
    if (t && Math.abs(d - t.at) < 10000) continue;
    state.trails.set(it.obj.id, { at: d.getTime(), pts: track(it.obj, d, state.observer, -60, 180, 10) });
  }
  for (const id of state.trails.keys()) if (!keep.has(id)) state.trails.delete(id);
  refreshCelestial(d);
  updateStatus(f);
}

function refreshCelestial(d) {
  const toEnu = eqToEnu(d, state.observer);
  state.bodies = solarSystem(d, state.observer).map((b) => ({ ...b, enu: toEnu(b.v) }));
  state.milkyEnu = state.milkyEq.map((p) => ({ enu: toEnu(p.v), weight: p.weight }));
  if (!state.sky) return;
  state.skyEnu = {
    stars: state.sky.stars.map((s) => ({ ...s, enu: toEnu(s.v) })),
    lines: state.sky.lines.map((seg) => seg.map(toEnu)),
    constellations: state.sky.constellations.map((c) => ({ ...c, enu: toEnu(c.v) })),
  };
}

function updateStatus(f) {
  const visible = state.items.filter((a) => a.look.visible).length;
  $('visible-count').textContent = visible;
  const d = now();
  const bits = [d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })];
  if (state.timeOffsetMs) bits.push('sim');
  if (f.sunEl > -0.8) bits.push('daylight');
  else if (f.sunEl > DARK_SUN_ELEVATION) bits.push('twilight');
  if (state.drag.on || !hasLiveSensors()) bits.push('drag to look');
  if (state.binoculars) bits.push('binoculars');
  $('status-line').textContent = bits.join(' · ');

  if (f.sunEl > DARK_SUN_ELEVATION && visible === 0) {
    showBanner('Sky is too bright for satellites right now. Tap More → "Jump to next visible pass" to try it out.', openDebug);
  } else if (pointing.source === 'ios' && (pointing.compassAccuracy < 0 || pointing.compassAccuracy > 25) && !state.drag.on) {
    showBanner('Compass is fuzzy. Wave your phone in a figure-8 to calibrate.');
  } else if (!bannerKey.startsWith('New build')) {
    showBanner('');
  }
}

// Smooth the camera basis to take the jitter out of the sensors.
function smoothBasis(b) {
  if (!state.smooth) { state.smooth = { back: [...b.back], up: [...b.up] }; }
  const k = 0.25, s = state.smooth;
  for (let i = 0; i < 3; i++) {
    s.back[i] += (b.back[i] - s.back[i]) * k;
    s.up[i] += (b.up[i] - s.up[i]) * k;
  }
  const back = norm(s.back);
  // Gram-Schmidt: make up perpendicular to back, then right = back × up
  const d = dot(s.up, back);
  const up = norm([s.up[0] - d * back[0], s.up[1] - d * back[1], s.up[2] - d * back[2]]);
  const right = [
    back[1] * up[2] - back[2] * up[1],
    back[2] * up[0] - back[0] * up[2],
    back[0] * up[1] - back[1] * up[0],
  ];
  return { right, up, back };
}
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };

function currentBasis() {
  if (!state.drag.on && hasLiveSensors()) return smoothBasis(trueBasis());
  state.smooth = null;
  return basisFromAzEl(state.drag.az, state.drag.el);
}

// ---------- render loop ----------

let lastAbove = 0;
let lastPanel = 0;
function tick(ts) {
  requestAnimationFrame(tick);
  if (!state.catalog || !$('start').hidden) return;
  const d = now();
  state.model.update(d, state.observer);
  state.items = state.model.items(d);
  if (ts - lastAbove > 1000) { refreshAbove(); lastAbove = ts; }

  const basis = currentBasis();
  state.basis = basis;
  const reticleCos = Math.cos(sky.reticleDeg * RAD);
  const t = performance.now();

  const items = [];
  for (const a of state.items) {
    const l = a.look;
    if (!l.visible && !state.showDim && !state.captureAny) continue;
    const trail = state.trails.get(a.obj.id);
    const pts = trail ? trail.pts.map((p) => ({ ...p, t: p.t + (trail.at - d.getTime()) / 1000 })) : null;
    const angCos = dot(enuFromAzEl(l.az, l.el), basis.back);
    const capturable = l.visible || state.captureAny;
    const inReticle = capturable && angCos > reticleCos;
    if (inReticle) state.sticky.set(a.obj.id, t);
    items.push({ obj: a.obj, label: label(a.obj), look: l, trail: pts, candidate: inReticle, angCos });
  }

  // Candidates stay selectable for 1.5 s after leaving the circle so the card doesn't flicker away.
  const cands = items
    .filter((it) => (it.look.visible || state.captureAny) && t - (state.sticky.get(it.obj.id) ?? -1e9) < 1500)
    .sort((a, b) => b.angCos - a.angCos)
    .slice(0, 5);
  for (const id of state.sticky.keys()) if (t - state.sticky.get(id) > 1500) state.sticky.delete(id);
  state.candidates = cands;
  if (!cands.some((c) => c.obj.id === state.targetId)) {
    const prev = state.targetId;
    state.targetId = cands[0]?.obj.id ?? null;
    if (state.targetId && !prev) chirp([880], 0.05);
  }
  const target = cands.find((c) => c.obj.id === state.targetId) ?? null;

  sky.draw(basis, items, {
    showDim: state.showDim,
    sky: state.showStars ? state.skyEnu : null,
    bodies: state.showStars ? state.bodies : null,
    milky: state.showStars ? state.milkyEnu : null,
    lines: state.showLines,
    targetId: state.targetId,
    time: t,
  });

  updateCompass(basis);
  placeCallout(target);
  if (t - lastPanel > 250 || target?.obj.id !== shownTargetId) { renderTarget(target, d); lastPanel = t; }
}

function updateCompass(basis) {
  const b = basis.back;
  const heading = (Math.atan2(b[0], b[1]) / RAD + 360) % 360;
  $('compass-rose').setAttribute('transform', `rotate(${(-heading).toFixed(1)} 50 50)`);
  // Letters move around the ring but stay upright.
  for (const [id, az] of [['c-N', 0], ['c-E', 90], ['c-S', 180], ['c-W', 270]]) {
    const a = (az - heading) * RAD;
    const el = $(id);
    el.setAttribute('x', (50 + Math.sin(a) * 32).toFixed(1));
    el.setAttribute('y', (55 - Math.cos(a) * 32).toFixed(1));
  }
}

// ---------- target: callout + card ----------

function placeCallout(target) {
  const el = $('callout');
  const p = sky.targetPos;
  if (!target || !p) { el.hidden = true; return; }
  el.hidden = false;
  const w = el.offsetWidth || 200, h = el.offsetHeight || 90;
  let x = p.x + sky.reticlePx * 0.5 + 18;
  if (x + w > window.innerWidth - 10) x = p.x - sky.reticlePx * 0.5 - 18 - w;
  x = Math.max(10, x);
  const y = Math.max(110, Math.min(p.y - h - 10, window.innerHeight - 380));
  el.style.transform = `translate(${x.toFixed(0)}px, ${y.toFixed(0)}px)`;
}

let shownTargetId = null;
let shownCount = 0;
function renderTarget(target, d) {
  const card = $('target');
  if (!target) { card.hidden = true; shownTargetId = null; return; }
  const o = target.obj, l = target.look;
  const tier = TIER_INFO[o.tier] ?? TIER_INFO.common;
  const st = orbitStats(o);
  const mag = l.mag != null ? l.mag.toFixed(1) : '—';

  // Callout (small, next to the object)
  $('co-name').textContent = label(o);
  $('co-tier').textContent = tier.label;
  $('co-tier').style.setProperty('--tier', tier.color);
  $('co-type').textContent = o.family ? `${familyName(o)} satellite` : (TYPE_LABEL[o.type] ?? 'Object');
  $('co-mag').textContent = `Mag ${mag} (${brightnessWord(l.mag)})`;
  $('co-motion').textContent = `${Math.round(l.el)}° up${st ? ` · ${st.speed.toFixed(1)} km/s` : ''}`;

  // Bottom card: rebuild only when the target changes, refresh the live numbers otherwise.
  if (o.id !== shownTargetId || state.candidates.length !== shownCount) {
    shownTargetId = o.id;
    shownCount = state.candidates.length;
    card.style.setProperty('--tier', tier.color);
    $('t-art').innerHTML = cardArt(o, { accent: setColor(o), w: 120, h: 130 });
    $('t-tier').textContent = tier.label;
    $('t-tier').style.setProperty('--tier', tier.color);
    $('t-name').textContent = label(o);
    const typeLabel = o.family ? `${familyName(o)} satellite` : (TYPE_LABEL[o.type] ?? 'Object');
    const who = o.family ? state.catalog.families?.[o.family]?.maker : ownerName(o.owner);
    $('t-chips').innerHTML = `<span class="chip"><span class="ico" data-ico="type"></span>${escapeHtml(typeLabel)}</span>`
      + (who ? `<span class="chip human">${escapeHtml(who)}</span>` : '')
      + (o.bino ? '<span class="chip">Binoculars</span>' : '');
    $('t-fact').innerHTML = richText(objectFact(o));
    const n = state.candidates.length;
    $('t-switch').hidden = n < 2;
    card.hidden = false;
  }
  setAction(collectedThisPass(o, d));
  const n = state.candidates.length;
  if (n > 1) $('t-switch').textContent = `${state.candidates.findIndex((c) => c.obj.id === o.id) + 1} of ${n} ›`;
  $('t-stats').innerHTML = `<span class="chip"><span class="ico" data-ico="height"></span>${Math.round(l.el)}° up</span>`
    + (st ? `<span class="chip"><span class="ico" data-ico="rocket"></span>${st.speed.toFixed(1)} km/s</span>` : '');
}

$('t-switch').addEventListener('click', () => {
  const c = state.candidates;
  if (c.length < 2) return;
  const i = c.findIndex((x) => x.obj.id === state.targetId);
  state.targetId = c[(i + 1) % c.length].obj.id;
});

// Collected during this pass (the last 20 minutes of sky time)? Then the button offers View instead.
// A later pass can be collected again, which is what levels a card up.
const PASS_MS = 20 * 60 * 1000;
function collectedThisPass(o, d) {
  return state.sightings.some((s) => s.objectId === o.id && Math.abs(d.getTime() - s.time) < PASS_MS);
}

$('t-action').addEventListener('click', () => {
  unlockAudio();
  const target = state.candidates.find((c) => c.obj.id === state.targetId);
  if (!target) return;
  if ($('t-action').dataset.state === 'view') {
    location.href = `cards.html#${encodeURIComponent(target.obj.card ?? target.obj.id)}`;
    return;
  }
  capture(target.obj);
});

// Sets the card's button to Collect or View.
function setAction(collected) {
  const btn = $('t-action');
  const want = collected ? 'view' : 'collect';
  if (btn.dataset.state === want) return;
  btn.dataset.state = want;
  btn.className = want;
  btn.textContent = collected ? 'View' : 'Collect';
}

async function capture(obj) {
  const d = now();
  const f = frame(d, state.observer);
  const l = look(obj, f);
  const m = motion(obj, d, state.observer);
  const sighting = {
    objectId: obj.id,
    cardKey: obj.card,
    name: obj.name,
    type: obj.type,
    year: obj.year,
    time: d.getTime(),
    loggedAt: Date.now(),
    lat: state.observer.lat,
    lon: state.observer.lon,
    az: l?.az, el: l?.el, mag: l?.mag, rangeKm: l?.rangeKm,
    heading: m?.heading,
    sim: isSim(),
    appVersion: VERSION,
  };
  await addSighting(sighting);
  const before = state.sightings.some((s) => !s.sim && (s.cardKey ?? String(s.objectId)) === obj.card);
  await loadSightings();
  if (state.targetId === obj.id) setAction(true);
  chirp([660, 880, 1320], 0.08);
  const age = obj.year ? `Launched ${obj.year}` : '';
  const cardLink = sighting.sim ? '' : '<br><small><u>Tap to see your card</u></small>';
  toast(`<span class="big-line">${before ? 'Captured!' : 'New card!'}</span>${escapeHtml(label(obj))}<br><small>${age}${before ? ' · seen before' : ' · first sighting'}</small>${cardLink}`, 3500, sighting.sim ? null : `cards.html#${encodeURIComponent(obj.card)}`);
}

// ---------- journal (sighting log) ----------

async function loadSightings() {
  state.sightings = await allSightings();
  $('log-count').textContent = state.sightings.length || '';
}

function renderLog() {
  const list = $('log-list');
  list.innerHTML = '';
  if (!state.sightings.length) {
    list.innerHTML = '<div class="empty">Nothing yet. Point at a moving light and tap Collect.</div>';
    return;
  }
  for (const s of state.sightings) {
    const row = document.createElement('div');
    row.className = 'sighting';
    const when = new Date(s.time).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    const where = s.el != null ? `${Math.round(s.el)}° up in the ${compassPoint(s.az)}` : '';
    const meta = [when, where, s.heading && `moving ${s.heading}`, s.year && `launched ${s.year}`, `#${s.objectId}`].filter(Boolean).join(' · ');
    row.innerHTML = `<div><div><span class="name"></span>${s.sim ? '<span class="badge">SIM</span>' : ''}</div><div class="meta"></div></div><button>Delete</button>`;
    row.querySelector('.name').textContent = shortName(s.name);
    row.querySelector('.meta').textContent = meta;
    row.querySelector('button').addEventListener('click', async () => {
      if (!confirm(`Delete this sighting of ${shortName(s.name)}?`)) return;
      await deleteSighting(s.key);
      await loadSightings();
      renderLog();
    });
    list.appendChild(row);
  }
}

// ---------- visible now ----------

function renderVisible() {
  const list = $('visible-list');
  const vis = state.items.filter((i) => i.look.visible).sort((a, b) => a.look.mag - b.look.mag);
  $('visible-hint').textContent = vis.length
    ? `Brightest first. ${state.drag.on || !hasLiveSensors() ? 'Tap one to look at it.' : 'Look where it says and hold your phone up.'}`
    : 'Nothing visible right now. Satellites show up after dusk and before dawn.';
  list.innerHTML = '';
  for (const it of vis.slice(0, 60)) {
    const o = it.obj, tier = TIER_INFO[o.tier] ?? TIER_INFO.common;
    const row = document.createElement('button');
    row.className = 'vis-row';
    row.style.setProperty('--tier', tier.color);
    row.innerHTML = '<span class="dot"></span><span class="grow"><div class="name"></div><div class="meta"></div></span>';
    row.querySelector('.name').textContent = label(o);
    row.querySelector('.meta').textContent = `${tier.label} · mag ${it.look.mag.toFixed(1)} (${brightnessWord(it.look.mag)}) · ${Math.round(it.look.el)}° up in the ${compassPoint(it.look.az)}`;
    row.addEventListener('click', () => {
      if (state.drag.on || !hasLiveSensors()) {
        state.drag.on = true;
        state.drag.az = it.look.az;
        state.drag.el = it.look.el;
        $('visible').hidden = true;
      } else {
        toast(`Look <b>${Math.round(it.look.el)}° up</b> in the <b>${compassPoint(it.look.az)}</b>`, 2500);
      }
    });
    list.appendChild(row);
  }
}
$('visible-pill').addEventListener('click', () => { renderVisible(); $('visible').hidden = false; });

// ---------- drag to look ----------

let dragStart = null;
$('sky').addEventListener('pointerdown', (e) => {
  if (!state.drag.on && hasLiveSensors()) return;
  dragStart = { x: e.clientX, y: e.clientY, az: state.drag.az, el: state.drag.el };
  $('sky').setPointerCapture(e.pointerId);
});
$('sky').addEventListener('pointermove', (e) => {
  if (!dragStart) return;
  const degPerPx = sky.fovV / sky.h;
  state.drag.az = (dragStart.az - (e.clientX - dragStart.x) * degPerPx + 360) % 360;
  state.drag.el = Math.max(-10, Math.min(89, dragStart.el + (e.clientY - dragStart.y) * degPerPx));
});
$('sky').addEventListener('pointerup', () => { dragStart = null; });
$('sky').addEventListener('pointercancel', () => { dragStart = null; });

// ---------- nav & panels ----------

function openDebug() { renderDebug(); $('debug').hidden = false; }
$('nav-more').addEventListener('click', openDebug);
$('nav-journal').addEventListener('click', () => { renderLog(); $('log').hidden = false; });
$('nav-explore').addEventListener('click', () => { for (const id of ['log', 'debug', 'visible']) $(id).hidden = true; });
document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => { $(b.dataset.close).hidden = true; }));

document.querySelectorAll('[data-time]').forEach((b) => b.addEventListener('click', () => {
  const v = b.dataset.time;
  state.timeOffsetMs = v === 'now' ? 0 : state.timeOffsetMs + Number(v) * 1000;
  afterTimeJump();
}));

$('btn-next-pass').addEventListener('click', () => {
  const pass = nextVisiblePass(state.catalog.objects, new Date(now().getTime() + 60000), state.observer, 48);
  if (!pass) { toast('No visible passes in the next 48 hours.'); return; }
  state.timeOffsetMs = pass.date.getTime() - Date.now();
  if (state.drag.on || !hasLiveSensors()) {
    state.drag.az = pass.look.az;
    state.drag.el = pass.look.el;
  }
  afterTimeJump();
  $('debug').hidden = true;
  toast(`<span class="big-line">${escapeHtml(label(pass.obj))}</span>${Math.round(pass.look.el)}° up in the ${compassPoint(pass.look.az)}`);
});

function afterTimeJump() {
  state.model?.reset();
  state.trails.clear();
  state.sticky.clear();
  lastAbove = 0;
  refreshAbove();
  renderDebug();
}

$('chk-night').checked = state.night;
$('chk-night').addEventListener('change', (e) => { state.night = e.target.checked; writePref('night', state.night); applyTheme(); });
$('chk-drag').addEventListener('change', (e) => {
  state.drag.on = e.target.checked;
  if (state.drag.on && state.basis) {
    const b = state.basis.back;
    state.drag.az = (Math.atan2(b[0], b[1]) / RAD + 360) % 360;
    state.drag.el = Math.asin(b[2]) / RAD;
  }
});
$('chk-dim').addEventListener('change', (e) => { state.showDim = e.target.checked; state.trails.clear(); });
$('chk-stars').addEventListener('change', (e) => { state.showStars = e.target.checked; });
$('chk-lines').addEventListener('change', (e) => { state.showLines = e.target.checked; });
$('chk-any').addEventListener('change', (e) => { state.captureAny = e.target.checked; });
$('chk-bino').checked = state.binoculars;
$('chk-bino').addEventListener('change', (e) => {
  state.binoculars = e.target.checked;
  writePref('binoculars', state.binoculars);
  setBinocularMode(state.binoculars);
  state.model?.reset();
  state.trails.clear();
});
document.querySelectorAll('[data-nudge]').forEach((b) => b.addEventListener('click', () => {
  nudgeHeading(Number(b.dataset.nudge));
  renderDebug();
}));

function renderDebug() {
  const d = now();
  $('sim-time-label').textContent = `${d.toLocaleString()}${state.timeOffsetMs ? ' (simulated)' : ' (live)'}`;
  const n = getNudge();
  $('nudge-label').textContent = n ? `${n > 180 ? n - 360 : n}°` : '';
  $('chk-drag').checked = state.drag.on;
  const cat = state.catalog;
  const ageH = cat ? ((Date.now() - cat.generated) / 3.6e6).toFixed(1) : '?';
  const f = state.frame;
  $('debug-info').textContent = [
    `version        v${VERSION}`,
    `location       ${state.observer.lat.toFixed(3)}, ${state.observer.lon.toFixed(3)} (${state.observer.label ?? ''})`,
    `sensors        ${pointing.source}${hasLiveSensors() ? ' (live)' : ' (none)'}`,
    `compass acc.   ${pointing.compassAccuracy ?? 'n/a'}`,
    `heading offset ${pointing.headingOffset.toFixed(1)}°`,
    `sun elevation  ${f ? f.sunEl.toFixed(1) : '?'}°`,
    `catalogue      ${cat?.objects.length ?? 0} objects, data ${ageH} h old`,
    `above horizon  ${state.model?.above.size ?? 0} (${state.items.filter((i) => i.look.visible).length} visible)`,
    `binoculars     ${state.binoculars ? 'on (to mag 8)' : 'off (naked eye, to mag 5)'}`,
  ].join('\n');
}

// ---------- start ----------

$('btn-start').addEventListener('click', async () => {
  unlockAudio();
  $('btn-start').disabled = true;
  $('btn-start').textContent = 'Starting…';
  let sensorsOk = false;
  try { sensorsOk = await startSensors(); } catch {}
  requestLocation();
  keepAwake();
  navigator.storage?.persist?.();
  $('start').hidden = true;
  $('hud').hidden = false;
  // Desktop / no sensors: fall back to drag mode after a moment with no orientation events.
  setTimeout(() => {
    if (!hasLiveSensors()) {
      state.drag.on = true;
      toast(sensorsOk ? 'No motion data yet, so drag to look around.' : 'No motion sensors here. Drag to look around.');
    }
  }, 1500);
});

async function boot() {
  try {
    state.catalog = await loadCatalog('data/catalog.json');
    state.model = new SkyModel(state.catalog.objects);
    setBinocularMode(state.binoculars);
    for (const o of state.catalog.objects) if (o.family) state.familyCounts.set(o.card, (state.familyCounts.get(o.card) ?? 0) + 1);
  } catch (e) {
    $('start-note').textContent = `Couldn't load satellite data: ${e.message}`;
    return;
  }
  try { state.sky = await loadSky('data/sky.json'); } catch {}
  await loadLore();
  await loadSightings();
  checkForUpdate();
  requestAnimationFrame(tick);
}
boot();
