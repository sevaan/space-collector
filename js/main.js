import { VERSION } from './version.js?v=0.1.19';
import { loadCatalog, frame, look, track, motion, compassPoint, enuFromAzEl, DARK_SUN_ELEVATION, SkyModel, setBinocularMode } from './orbit.js?v=0.1.19';
import { startSensors, hasLiveSensors, trueBasis, basisFromAzEl, pointing, nudgeHeading, getNudge } from './sensors.js?v=0.1.19';
import { SkyView, shortName } from './sky.js?v=0.1.19';
import { loadSky, eqToEnu, solarSystem, galacticPlane } from './celestial.js?v=0.1.19';
import { addSighting, allSightings, deleteSighting } from './store.js?v=0.1.19';
import { cardArt } from './art.js?v=0.1.19';
import { renderCard, attachTilt, attachGyro } from './card.js?v=0.1.19';
import { buildCards } from './card-model.js?v=0.1.19';
import { collectedDuringPass, canCapture } from './observation.js?v=0.1.19';
import { TIER_INFO } from './rarity.js?v=0.1.19';
import { SETS } from './sets.js?v=0.1.19';
import { TYPE_LABEL, ownerName, orbitStats } from './facts.js?v=0.1.19';
import { loadLore, titleFor, factFor, richText } from './lore.js?v=0.1.19';

const $ = (id) => document.getElementById(id);
const RAD = Math.PI / 180;
const DEFAULT_LOCATION = { lat: 44.3091, lon: -78.3197, label: 'Example: Peterborough' };

const state = {
  catalog: null,
  cardModels: new Map(),
  byId: new Map(),
  preview: false,
  followPreview: false,
  locationStatus: 'example',
  pinnedId: null,
  activeTarget: null,
  captureBusy: false,
  storageReady: true,
  started: false,
  observer: loadSavedLocation() ?? { ...DEFAULT_LOCATION },
  timeOffsetMs: 0,
  drag: { on: false, az: 180, el: 35 },
  showDim: false,
  showStars: true,
  showLines: readPref('lines', false),
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
// Every sighting counts. (Older builds had a practice mode; its records carry `sim: true` and stay hidden.)

// ---------- prefs & location ----------

function readPref(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v === '1'; } catch { return d; } }
function writePref(k, v) { try { localStorage.setItem(k, v ? '1' : '0'); } catch {} }

function loadSavedLocation() {
  try { return JSON.parse(localStorage.getItem('observer')); } catch { return null; }
}

let locationRequest = 0;
async function requestLocation() {
  const requestId = ++locationRequest;
  state.locationStatus = 'waiting';
  renderLocation();
  if (!navigator.geolocation) { state.locationStatus = 'unavailable'; renderLocation(); return false; }
  return new Promise(resolve => navigator.geolocation.getCurrentPosition(
    p => {
      if (requestId !== locationRequest) { resolve(false); return; }
      state.observer = { lat: p.coords.latitude, lon: p.coords.longitude, heightKm: (p.coords.altitude ?? 0) / 1000, label: 'Current location', fixedAt: Date.now() };
      state.locationStatus = 'ready';
      try { localStorage.setItem('observer', JSON.stringify({ ...state.observer, label: 'Saved location' })); } catch {}
      state.trails.clear(); state.model?.reset(); cancelPassSearch();
      renderLocation(); resolve(true);
    },
    error => { if (requestId !== locationRequest) { resolve(false); return; } state.locationStatus = error.code === 1 ? 'denied' : 'unavailable'; renderLocation(); resolve(false); },
    { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 },
  ));
}
function renderLocation() {
  const labels = { waiting: 'Finding your location…', ready: 'Current location', manual: 'Chosen location', denied: 'Location denied', unavailable: 'Location unavailable', example: state.observer.label ?? 'Example location', saved: 'Saved location · unverified', stale: 'Location needs refreshing' };
  const label = labels[state.locationStatus] ?? 'Location needs checking';
  $('location-status').textContent = label;
  $('location-note').textContent = `${label}. Sky shown for ${state.observer.lat.toFixed(2)}°, ${state.observer.lon.toFixed(2)}°. ${['ready', 'manual'].includes(state.locationStatus) ? '' : 'Use your location or choose coordinates for real observing.'}`;
  $('latitude').value = state.observer.lat; $('longitude').value = state.observer.lon;
}

function applyTheme() {
  document.body.classList.toggle('night', state.night);
  document.documentElement.dataset.theme = state.night ? 'night' : 'glass';
  $('night-toggle').setAttribute('aria-pressed', String(state.night));
  $('night-toggle').setAttribute('aria-label', state.night ? 'Turn off red night mode' : 'Turn on red night mode');
  sky.setTheme(state.night ? 'night' : 'glass');
  document.querySelector('meta[name=theme-color]').content = state.night ? '#000000' : '#050a18';
}
applyTheme();

// ---------- sound ----------

let audio;
function unlockAudio() {
  try { audio ??= new (window.AudioContext || window.webkitAudioContext)(); audio.resume().catch(() => {}); } catch {}
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
  if (document.visibilityState === 'visible' && state.started) { keepAwake(); checkForUpdate(); }
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

const MAX_TRAILS = 4;

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
    .sort((a, b) => Number(b.it.obj.id === state.pinnedId) - Number(a.it.obj.id === state.pinnedId) || b.c - a.c)
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
  if (state.locationStatus === 'ready' && Date.now() - state.observer.fixedAt >= 15 * 60 * 1000) { state.locationStatus = 'stale'; renderLocation(); }
  const visible = state.items.filter(a => a.look.visible).length;
  $('visible-count').textContent = visible;
  $('btn-live').hidden = !state.timeOffsetMs;
  const d = now();
  const time = d.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  const bits = [time, f.sunEl > DARK_SUN_ELEVATION ? 'daylight / twilight' : 'dark sky'];
  if (state.drag.on || !hasLiveSensors()) bits.push('drag to explore');
  if (state.binoculars) bits.push('binoculars');
  $('status-line').textContent = bits.join(' · ');
  if (!bannerKey.startsWith('New build')) {
    if (pointing.source === 'ios' && (pointing.compassAccuracy < 0 || pointing.compassAccuracy > 25) && !state.drag.on) showBanner('Compass needs aligning. Move your phone in a figure eight, then aim at a known star.', openDebug);
    else if (pointing.source === 'relative') showBanner('Check your heading against a known landmark. Adjust the compass in settings.', openDebug);
    else showBanner('');
  }
  $('sky-empty').hidden = !!state.activeTarget;
  if (!state.activeTarget) {
    const daylight = f.sunEl > DARK_SUN_ELEVATION;
    $('empty-eyebrow').textContent = 'YOUR NEXT DISCOVERY';
    $('empty-title').textContent = visible ? 'A little space history is overhead.' : daylight ? 'Your next discovery starts after dusk.' : 'The sky is worth waiting for.';
    $('empty-copy').textContent = visible ? 'Choose an object and we’ll help you find it.' : 'Nothing bright is up right now. Find out when the next good pass is.';
    $('empty-next').textContent = passBusy ? 'Searching for a pass…' : visible ? 'Choose a visible object' : 'Find a visible pass';
    $('empty-next').disabled = passBusy;
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
  if (state.preview && state.followPreview && state.pinnedId) {
    const selected = state.items.find(it => it.obj.id === state.pinnedId);
    if (selected) { state.drag.az = selected.look.az; state.drag.el = selected.look.el; }
  }
  if (!state.drag.on && hasLiveSensors()) return smoothBasis(trueBasis());
  state.smooth = null;
  return basisFromAzEl(state.drag.az, state.drag.el);
}

// ---------- render loop ----------

let lastAbove = 0;
let lastPanel = 0;
let uiSafeTop = 202, uiSafeBottom = 320;
function tick(ts) {
  requestAnimationFrame(tick);
  if (!state.catalog || !state.started || document.hidden || activePanel) return;
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
    if (!l.visible && !state.showDim && !state.captureAny && a.obj.id !== state.pinnedId) continue;
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
  let target;
  if (state.pinnedId) {
    target = items.find(it => it.obj.id === state.pinnedId);
    if (!target) {
      const obj = state.byId.get(state.pinnedId);
      const l = obj && look(obj, frame(d, state.observer));
      if (l) { target = { obj, label: label(obj), look: l, angCos: dot(enuFromAzEl(l.az, l.el), basis.back) }; items.push(target); }
    }
    state.targetId = state.pinnedId;
  } else {
    if (!cands.some(c => c.obj.id === state.targetId)) state.targetId = cands[0]?.obj.id ?? null;
    target = cands.find(c => c.obj.id === state.targetId);
  }
  target ??= null;
  state.activeTarget = target;

  sky.draw(basis, items, {
    showDim: state.showDim,
    sky: state.showStars ? state.skyEnu : null,
    bodies: state.showStars ? state.bodies : null,
    milky: state.showStars ? state.milkyEnu : null,
    lines: state.showLines,
    targetId: state.targetId,
    time: t,
    safeTop: uiSafeTop,
    safeBottom: uiSafeBottom,
  });

  updateCompass(basis);
  placeCallout(target);
  if (t - lastPanel > 250 || target?.obj.id !== shownTargetId) { renderTarget(target, d); measureSkySpace(); lastPanel = t; }
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

function measureSkySpace() {
  const box = $('target').hidden ? $('sky-empty') : $('target');
  const rect = box.getBoundingClientRect();
  uiSafeTop = $('status-line').getBoundingClientRect().bottom + 16;
  if (!$('banner').hidden) uiSafeTop = $('banner').getBoundingClientRect().bottom + 12;
  uiSafeBottom = box.hidden ? 100 : Math.max(100, window.innerHeight - rect.top + 34);
  $('guidance').style.bottom = `${uiSafeBottom - 26}px`;
}
function placeCallout(target) {
  const el = $('callout'), p = sky.targetPos;
  if (!target || !p || !target.look.visible) { el.hidden = true; return; }
  el.hidden = false;
  const w = el.offsetWidth || 150, h = el.offsetHeight || 32;
  let x = p.x + 18;
  if (x + w > window.innerWidth - 12) x = p.x - 18 - w;
  const y = Math.max(uiSafeTop, Math.min(p.y - h - 15, window.innerHeight - uiSafeBottom - h));
  el.style.transform = `translate(${Math.max(12,x).toFixed(0)}px, ${y.toFixed(0)}px)`;
}

let shownTargetId = null;
let shownCount = 0;
function renderTarget(target, d) {
  const card = $('target');
  $('sky-empty').hidden = !!target;
  $('guidance').hidden = !target;
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
    $('t-collection').textContent = `${tier.label} · ${(SETS.find(s => s.test(o)) ?? SETS[SETS.length - 1]).name}`;
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
  const aligned = target.angCos > Math.cos(sky.reticleDeg * RAD);
  const eligible = canCapture({ visible: l.visible, aligned, practice: state.captureAny, allowAny: state.captureAny });
  $('t-unpin').hidden = !state.pinnedId;
  setAction(collectedThisPass(o, d), eligible);
  const currentAz = state.basis ? (Math.atan2(state.basis.back[0], state.basis.back[1]) / RAD + 360) % 360 : state.drag.az;
  const currentEl = state.basis ? Math.asin(state.basis.back[2]) / RAD : state.drag.el;
  const turn = ((l.az - currentAz + 540) % 360) - 180;
  $('guidance').textContent = l.el < 0 ? 'This pass has ended. Choose another object.' : !l.visible && !state.captureAny ? 'This object is not visible right now.' : aligned ? 'Target aligned · look up and confirm the moving light' : `${Math.abs(turn) > 8 ? (turn > 0 ? 'Turn right' : 'Turn left') : l.el > currentEl ? 'Raise your phone' : 'Lower your phone'} · ${Math.round(l.el)}° up in the ${compassPoint(l.az)}`;
  const n = state.candidates.length;
  const candidateIndex = state.candidates.findIndex(c => c.obj.id === o.id);
  $('t-switch').hidden = n < 2 || candidateIndex < 0;
  if (n > 1 && candidateIndex >= 0) $('t-switch').textContent = `${candidateIndex + 1} of ${n} ›`;
  $('t-stats').innerHTML = `<span class="chip">${escapeHtml(brightnessWord(l.mag))}</span><span class="chip">${Math.round(l.el)}° up · ${compassPoint(l.az)}</span>`;

}

$('t-switch').addEventListener('click', () => {
  const c = state.candidates;
  if (c.length < 2) return;
  const i = c.findIndex((x) => x.obj.id === state.targetId);
  state.targetId = c[(i + 1) % c.length].obj.id;
  state.pinnedId = state.targetId;
});

// Collected during this pass (the last 20 minutes of sky time)? Then the button offers View instead.
// A later pass can be collected again, which is what levels a card up.
function collectedThisPass(o, d) {
  return collectedDuringPass(state.sightings, o.id, d.getTime(), false);
}
$('t-unpin').addEventListener('click', () => { state.pinnedId = null; state.targetId = null; state.sticky.clear(); });
$('t-action').addEventListener('click', () => {
  const target = state.activeTarget;
  unlockAudio();
  if (!target || state.captureBusy) return;
  if (collectedThisPass(target.obj, now())) { showCaptureCard(target.obj, false); return; }
  capture(target.obj);
});
function setAction(collected, eligible = true) {
  const btn = $('t-action');
  btn.dataset.state = collected ? 'view' : 'collect';
  btn.className = collected ? 'view' : 'collect';
  btn.disabled = state.captureBusy || (!collected && !eligible);
  btn.textContent = state.captureBusy ? 'Saving…' : collected ? 'View your card' : !eligible ? 'Line up the target' : 'Collect';
}
function cardModel(obj) { return state.cardModels.get(obj.card ?? String(obj.id)) ?? obj; }
function cardSnapshot(obj) {
  const { satrec, _label, _setColor, ...card } = cardModel(obj);
  return card;
}
let revealStop = null;
function showCaptureCard(obj, fresh) {
  const model = cardModel(obj), key = obj.card ?? String(obj.id);
  const sightings = state.sightings.filter(s => !s.sim && (s.cardKey ?? String(s.objectId)) === key);
  $('reveal-eyebrow').textContent = fresh ? 'FIRST DISCOVERY' : 'SIGHTING RECORDED';
  $('reveal-title').textContent = fresh ? 'A piece of space history.' : 'A familiar light. A new memory.';
  $('reveal-note').textContent = `${label(obj)} · saved on this device`;
  const card = renderCard(model, { sightings, seenMembers: new Set(sightings.map(s => s.objectId)).size });
  revealStop?.();
  $('reveal-card').replaceChildren(card);
  const t = attachTilt(card), g = attachGyro(card, t);
  revealStop = () => { g(); t.destroy(); revealStop = null; };
  $('reveal-view').href = `cards.html#${encodeURIComponent(key)}`;
  openPanel('reveal');
}
async function capture(obj) {
  if (state.captureBusy) return;
  const d = now(), f = frame(d, state.observer), l = look(obj, f);
  const basis = currentBasis();
  const aligned = l && dot(enuFromAzEl(l.az, l.el), basis.back) > Math.cos(sky.reticleDeg * RAD);
  if (!l || !canCapture({ visible: l.visible, aligned, practice: state.captureAny, allowAny: state.captureAny })) { toast('Line up the object while it is visible to capture it.'); return; }
  if (collectedDuringPass(state.sightings, obj.id, d.getTime(), false)) { showCaptureCard(obj, false); return; }
  const m = motion(obj, d, state.observer), key = obj.card ?? String(obj.id);
  const before = state.sightings.some(s => !s.sim && (s.cardKey ?? String(s.objectId)) === key);
  const sighting = { objectId: obj.id, cardKey: key, name: obj.name, type: obj.type, year: obj.year, time: d.getTime(), loggedAt: Date.now(), lat: state.observer.lat, lon: state.observer.lon, az: l.az, el: l.el, mag: l.mag, rangeKm: l.rangeKm, heading: m?.heading, sim: false, appVersion: VERSION, cardSnapshot: cardSnapshot(obj) };
  state.captureBusy = true; setAction(false);
  try {
    const key = await addSighting(sighting);
    state.sightings.unshift({ ...sighting, key });
    $('log-count').textContent = state.sightings.filter(s => !s.sim).length || '';
    chirp([660, 880, 1320], .08);
    showCaptureCard(obj, !before);
  } catch {
    toast('Your sighting could not be saved. Check that browser storage is available, then try again.', 5000);
  } finally { state.captureBusy = false; setAction(collectedThisPass(obj, d)); }
}

// ---------- journal (sighting log) ----------

async function loadSightings() {
  try { state.sightings = await allSightings(); state.storageReady = true; } catch { state.storageReady = false; }
  $('log-count').textContent = state.sightings.filter(s => !s.sim).length || '';
}

function renderLog() {
  const list = $('log-list');
  const sightings = state.sightings.filter(s => !s.sim).sort((a,b) => (b.loggedAt ?? b.time) - (a.loggedAt ?? a.time));
  list.innerHTML = '';
  if (!sightings.length) { list.innerHTML = `<div class="empty">${state.storageReady ? 'Your story starts with a moving light. Collect your first object to begin.' : 'Your journal could not be read. Browser storage may be unavailable.'}</div>`; return; }
  let day = '';
  for (const s of sightings) {
    const date = new Date(s.loggedAt ?? s.time), group = date.toLocaleDateString([], { weekday:'long', month:'long', day:'numeric', year:'numeric' });
    if (group !== day) { const h = document.createElement('h3'); h.className='session-title'; h.textContent=group; list.appendChild(h); day=group; }
    const row = document.createElement('div'); row.className='sighting';
    const key = s.cardKey ?? String(s.objectId), model = state.cardModels.get(key) ?? s.cardSnapshot;
    const name = model ? titleFor(model) : shortName(s.name);
    row.innerHTML = `<div class="grow"><a class="name" href="cards.html#${encodeURIComponent(key)}">${escapeHtml(name)} ↗</a><div class="meta">${date.toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})}${s.el != null ? ` · ${Math.round(s.el)}° up in the ${compassPoint(s.az)}` : ''}</div></div><details><summary aria-label="Sighting actions">···</summary><button type="button">Delete sighting</button></details>`;
    row.querySelector('button').addEventListener('click', async () => {
      if (!confirm(`Delete this sighting of ${name}?`)) return;
      try { await deleteSighting(s.key); await loadSightings(); renderLog(); } catch { toast('Could not delete this sighting. Try again.'); }
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
    : 'Nothing visible right now. Find out when the next bright pass is.';
  list.innerHTML = '';
  if (!vis.length) { const b=document.createElement('button'); b.className='big'; b.textContent='Find a visible pass'; b.addEventListener('click',()=>findPass()); list.appendChild(b); }
  for (const it of vis.slice(0, 60)) {
    const o = it.obj, tier = TIER_INFO[o.tier] ?? TIER_INFO.common;
    const row = document.createElement('button');
    row.className = 'vis-row';
    row.style.setProperty('--tier', tier.color);
    row.innerHTML = '<span class="dot"></span><span class="grow"><div class="name"></div><div class="meta"></div></span>';
    row.querySelector('.name').textContent = label(o);
    row.querySelector('.meta').textContent = `${tier.label} · mag ${it.look.mag.toFixed(1)} (${brightnessWord(it.look.mag)}) · ${Math.round(it.look.el)}° up in the ${compassPoint(it.look.az)}`;
    row.addEventListener('click', () => {
      cancelPassSearch();
      state.pinnedId = o.id; state.targetId = o.id;
      if (state.drag.on || !hasLiveSensors()) { state.drag.on = true; state.drag.az = it.look.az; state.drag.el = it.look.el; }
      closePanel('visible');
    });
    list.appendChild(row);
  }
}
$('visible-pill').addEventListener('click', () => { renderVisible(); openPanel('visible'); });

// ---------- drag to look ----------

let dragStart = null;
$('sky').addEventListener('pointerdown', (e) => {
  if (!state.drag.on && hasLiveSensors()) return;
  state.followPreview = false;
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

let activePanel = null, panelReturn = null;
function openPanel(id) {
  if (activePanel) $(activePanel).hidden = true;
  else panelReturn = document.activeElement;
  activePanel = id; $(id).hidden = false; $('hud').inert = true;
  $(id).querySelector('button, a, input')?.focus({ preventScroll: true });
}
function closePanel(id = activePanel) {
  if (!id) return;
  if (id === 'reveal') revealStop?.();
  $(id).hidden = true; activePanel = null; $('hud').inert = false;
  if (panelReturn?.isConnected) panelReturn.focus({ preventScroll: true });
}
function openDebug() { renderDebug(); renderLocation(); openPanel('debug'); }
$('nav-more').addEventListener('click', openDebug);
$('nav-journal').addEventListener('click', () => { renderLog(); openPanel('log'); });
$('nav-explore').addEventListener('click', () => closePanel());
$('location-status').addEventListener('click', openDebug);
$('reveal-continue').addEventListener('click', () => closePanel('reveal'));
$('retry-location').addEventListener('click', requestLocation);
$('retry-motion').addEventListener('click', enableMotion);
$('location-form').addEventListener('submit', e => {
  e.preventDefault();
  const lat = Number($('latitude').value), lon = Number($('longitude').value);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat)>90 || Math.abs(lon)>180) return;
  locationRequest++;
  state.observer = { lat, lon, label:'Chosen location' }; state.locationStatus='manual';
  state.model?.reset(); state.trails.clear(); cancelPassSearch(); renderLocation(); refreshAbove();
});
document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => closePanel(b.dataset.close)));
document.addEventListener('keydown', e => {
  if (!activePanel) return;
  if (e.key === 'Escape') { closePanel(); return; }
  if (e.key !== 'Tab') return;
  const focusables = [...$(activePanel).querySelectorAll('button,a[href],input,summary')].filter(n => !n.disabled && n.getClientRects().length);
  const first=focusables[0], last=focusables.at(-1);
  if (e.shiftKey && document.activeElement===first) { e.preventDefault(); last?.focus(); }
  else if (!e.shiftKey && document.activeElement===last) { e.preventDefault(); first?.focus(); }
});

document.querySelectorAll('[data-time]').forEach((b) => b.addEventListener('click', () => {
  cancelPassSearch();
  const v = b.dataset.time;
  state.timeOffsetMs = v === 'now' ? 0 : state.timeOffsetMs + Number(v) * 1000;
  afterTimeJump();
}));

let passWorker = null, passRequest = 0, passBusy = false, passTimer = null;
function cancelPassSearch() { passRequest++; passWorker?.terminate(); passWorker=null; passBusy=false; clearTimeout(passTimer); $('btn-next-pass').disabled=false; $('empty-iss').disabled=false; $('empty-next').disabled=false; }
function findPass() { previewPass(null, false); }
function previewPass(objectId = null, jump = true) {
  if (!state.catalog || passBusy) return;
  cancelPassSearch(); passBusy=true;
  const requestId = ++passRequest;
  $('btn-next-pass').disabled=true; $('empty-iss').disabled=true; $('empty-next').disabled=true;
  $('next-pass-info').textContent='Searching predicted passes in the next 48 hours…';
  const start = new Date(Math.max(Date.now(), now().getTime()) + 60000);
  try {
    passWorker = new Worker(new URL(`./pass-worker.js?v=${VERSION}`, import.meta.url), { type:'module' });
    const fail = () => { if (requestId!==passRequest) return; cancelPassSearch(); $('next-pass-info').textContent='Pass search could not finish. Try again.'; toast('Pass search could not finish. You can retry or browse the visible sky.',4500); };
    passWorker.onerror = fail;
    passTimer=setTimeout(fail,45000);
    passWorker.onmessage = ({data}) => {
      if (data.requestId!==passRequest) return;
      cancelPassSearch();
      if (data.error || !data.pass) { $('next-pass-info').textContent=objectId ? 'No suitable ISS pass found in the next 48 hours for this place. Try another visible object.' : 'No bright pass found in the next 48 hours. Try another location or binocular mode.'; toast($('next-pass-info').textContent,5000); return; }
      const pass=data.pass, obj=state.byId.get(pass.objectId);
      if (!jump) {
        const when=new Date(pass.dateMs), today=when.toDateString()===new Date().toDateString();
        const whenText=`${today ? 'Tonight' : when.toLocaleDateString([], { weekday:'long' })} at ${when.toLocaleTimeString([], { hour:'numeric', minute:'2-digit' })}`;
        $('next-pass-info').textContent=`Next bright pass: ${label(obj)} · ${whenText} · ${Math.round(pass.look.el)}° up in the ${compassPoint(pass.look.az)}`;
        toast(`<span class="big-line">${escapeHtml(label(obj))}</span>${escapeHtml(whenText)}<br><small>${Math.round(pass.look.el)}° up in the ${compassPoint(pass.look.az)}</small>`,6000);
        return;
      }
      state.preview=true; state.followPreview=true; state.timeOffsetMs=pass.dateMs-Date.now(); state.drag.on=true; state.drag.az=pass.look.az; state.drag.el=pass.look.el; state.pinnedId=obj.id; state.targetId=obj.id;
      afterTimeJump(); closePanel();
      $('next-pass-info').textContent='';
      toast(`<span class="big-line">Jumped ahead</span>${escapeHtml(label(obj))}<br><small>${new Date(pass.dateMs).toLocaleString()} · ${escapeHtml(state.observer.label)}</small>`,4000);
    };
    passWorker.postMessage({requestId,objects:state.catalog.objects.filter(o=>o.stdMag<=4.5 || o.id===objectId),objectId,dateMs:start.getTime(),observer:state.observer,binoculars:state.binoculars});
  } catch { cancelPassSearch(); toast('Pass preview is unavailable in this browser. Try the visible-object list.'); }
}
$('btn-next-pass').addEventListener('click', () => previewPass());
$('empty-next').addEventListener('click', () => { if (state.items.some(i=>i.look.visible)) { renderVisible(); openPanel('visible'); } else findPass(); });
$('empty-iss').addEventListener('click', () => { saveExploreState(); location.href = 'cards.html#25544'; });
$('btn-live').addEventListener('click', async () => {
  cancelPassSearch(); state.preview=false; state.followPreview=false; state.timeOffsetMs=0; state.captureAny=false; state.showDim=false; state.pinnedId=null; $('chk-any').checked=false; $('chk-dim').checked=false;
  await enableMotion();
  if (!['ready','manual'].includes(state.locationStatus)) requestLocation();
  afterTimeJump();
});
async function enableMotion() {
  let ok=false; try { ok=await startSensors(); } catch {}
  state.drag.on=!ok;
  if (!ok) toast('Motion is unavailable, so drag the sky to look around.',4000);
  $('chk-drag').checked=state.drag.on;
  return ok;
}

function afterTimeJump() {
  state.model?.reset();
  state.trails.clear();
  state.sticky.clear();
  lastAbove = 0;
  refreshAbove();
  renderDebug();
}

$('chk-night').checked = state.night;
function toggleNight(on) { state.night=on; $('chk-night').checked=on; writePref('night',on); applyTheme(); }
$('chk-night').addEventListener('change', e => toggleNight(e.target.checked));
$('night-toggle').addEventListener('click', () => toggleNight(!state.night));
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
$('chk-lines').checked = state.showLines;
$('chk-lines').addEventListener('change', (e) => { state.showLines = e.target.checked; writePref('lines', state.showLines); });
$('chk-any').addEventListener('change', (e) => { state.captureAny = e.target.checked; });
$('chk-bino').checked = state.binoculars;
$('chk-bino').addEventListener('change', (e) => {
  cancelPassSearch();
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
  $('sim-time-label').textContent = `${d.toLocaleString()}${state.timeOffsetMs ? ' (simulated)' : ' (current time)'}`;
  const n = getNudge();
  $('nudge-label').textContent = n ? `${n > 180 ? n - 360 : n}°` : '';
  $('chk-drag').checked = state.drag.on;
  const cat = state.catalog;
  const ageH = cat ? ((Date.now() - cat.generated) / 3.6e6).toFixed(1) : '?';
  const f = state.frame;
  $('debug-info').textContent = [
    `version        v${VERSION}`,
    `location       ${state.observer.lat.toFixed(3)}, ${state.observer.lon.toFixed(3)} (${state.observer.label ?? ''})`,
    `sensors        ${pointing.source}${hasLiveSensors() ? ' (current time)' : ' (none)'}`,
    `compass acc.   ${pointing.compassAccuracy ?? 'n/a'}`,
    `heading offset ${pointing.headingOffset.toFixed(1)}°`,
    `sun elevation  ${f ? f.sunEl.toFixed(1) : '?'}°`,
    `catalogue      ${cat?.objects.length ?? 0} objects, data ${ageH} h old`,
    `above horizon  ${state.model?.above.size ?? 0} (${state.items.filter((i) => i.look.visible).length} visible)`,
    `binoculars     ${state.binoculars ? 'on (to mag 8)' : 'off (naked eye, to mag 5)'}`,
  ].join('\n');
}

// ---------- start and return from the collection ----------
function enterSky() {
  state.started=true; $('start').hidden=true; $('hud').hidden=false;
  if (!state.storageReady) toast('Browser storage is unavailable. Captures may not save.',5000);
  refreshAbove();
}
$('btn-start').addEventListener('click', async () => {
  if (!state.catalog) { location.reload(); return; }
  $('btn-start').disabled=true;
  await enableMotion();
  requestLocation(); keepAwake(); navigator.storage?.persist?.().catch(() => {});
  state.preview=false; enterSky();
});
function saveExploreState() {
  if (!state.started) return;
  try { sessionStorage.setItem('space-collector.explore',JSON.stringify({ observer:state.observer, locationStatus:state.locationStatus, timeOffsetMs:state.timeOffsetMs, drag:state.drag, preview:state.preview, followPreview:state.followPreview, pinnedId:state.pinnedId })); } catch {}
}
document.addEventListener('click', e => { if (e.target.closest('a[href^="cards.html"]')) saveExploreState(); });
window.addEventListener('pagehide',saveExploreState);
async function boot() {
  try {
    state.catalog=await loadCatalog('data/catalog.json');
    state.byId=new Map(state.catalog.objects.map(o=>[o.id,o]));
    state.cardModels=new Map(buildCards(state.catalog).map(c=>[c.key,c]));
    state.model=new SkyModel(state.catalog.objects); setBinocularMode(state.binoculars);
    for (const o of state.catalog.objects) if (o.family) state.familyCounts.set(o.card,(state.familyCounts.get(o.card)??0)+1);
  } catch {
    $('start-note').textContent='Satellite data could not load. Check your connection and reload to try again.';
    $('btn-start').textContent='Reload satellite data'; $('btn-start').disabled=false;
    $('btn-start').onclick=()=>location.reload(); return;
  }
  try { state.sky=await loadSky('data/sky.json'); } catch {}
  await loadLore(); await loadSightings();
  state.locationStatus=loadSavedLocation()?'saved':'example'; renderLocation();
  const iss=state.byId.get(25544); if (iss) $('start-art').innerHTML=cardArt(iss,{w:380,h:200});
  $('btn-start').textContent='Observe the sky'; $('btn-start').disabled=false;
  const params=new URLSearchParams(location.search);
  if(params.has('resume')) {
    try {
      const saved=JSON.parse(sessionStorage.getItem('space-collector.explore'));
      if(saved) {
        state.observer=saved.observer; state.locationStatus=['manual','example'].includes(saved.locationStatus)?saved.locationStatus:'saved';
        state.timeOffsetMs=saved.timeOffsetMs??0; state.drag=saved.drag; state.preview=!!saved.preview; state.followPreview=!!saved.followPreview; state.pinnedId=saved.pinnedId;
        if(!state.preview && !state.drag.on) { startSensors().catch(()=>{}); requestLocation(); }
        renderLocation(); enterSky();
        if(params.get('panel')==='journal') { renderLog(); openPanel('log'); }
      }
    } catch {}
  }
  checkForUpdate(); requestAnimationFrame(tick);
}
boot();
