import { VERSION } from './version.js?v=0.1.61';
import { loadCatalog, frame, look, track, motion, compassPoint, enuFromAzEl, DARK_SUN_ELEVATION, SkyModel, RisingSoon, setBinocularMode } from './orbit.js?v=0.1.61';
import { startSensors, hasLiveSensors, trueBasis, basisFromAzEl, pointing, nudgeHeading, getNudge } from './sensors.js?v=0.1.61';
import { SkyView, shortName } from './sky.js?v=0.1.61';
import { loadSky, eqToEnu, solarSystem, milkyWayModel } from './celestial.js?v=0.1.61';
import { addSighting, allSightings, deleteSighting } from './store.js?v=0.1.61';
import { cardArt } from './art.js?v=0.1.61';
import { renderCard, cardLevel } from './card.js?v=0.1.61';
import { playReveal, playView, primeReveal, stopReveal } from './reveal.js?v=0.1.61';
import { buildCards, cardKeyFor, stampKeyFor, normalizeSighting, stampsIn, fleetLevel } from './card-model.js?v=0.1.61';
import { collectedDuringPass, collectedTonight, canCapture, nightsIn } from './observation.js?v=0.1.61';
import { naturalTargets } from './natural.js?v=0.1.61';
import { TIER_INFO } from './rarity.js?v=0.1.61';
import { SETS } from './sets.js?v=0.1.61';
import { TYPE_LABEL, ownerName, orbitStats } from './facts.js?v=0.1.61';
import { loadLore, titleFor, factFor, richText } from './lore.js?v=0.1.61';
import { PlaneTracker, planesAvailable, aircraftName, isHelicopter } from './planes.js?v=0.1.61';

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
  landscape: readPref('landscape', false),
  night: readPref('night', false),
  sky: null,       // stars/constellations from data/sky.json (equatorial vectors)
  skyEnu: null,    // same, rotated into the local sky, refreshed every second
  milkyEq: milkyWayModel(),
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
  planes: new PlaneTracker(), // live aircraft (js/planes.js), for "Just a plane"
  planeItems: null,
  planeHit: null,  // { hex, at }: the plane in the circle, kept briefly so it doesn't flicker
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
      state.trails.clear(); state.model?.reset(); state.rising?.reset(); cancelPassSearch();
      renderLocation(); resolve(true);
    },
    error => { if (requestId !== locationRequest) { resolve(false); return; } state.locationStatus = error.code === 1 ? 'denied' : 'unavailable'; renderLocation(); resolve(false); },
    { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 },
  ));
}
function renderLocation() {
  const labels = { waiting: 'Finding your location…', ready: 'Current location', manual: 'Chosen location', denied: 'Location denied', unavailable: 'Location unavailable', example: state.observer.label ?? 'Example location', saved: 'Saved location · unverified', stale: 'Location needs refreshing' };
  const label = labels[state.locationStatus] ?? 'Location needs checking';
  $('location-note').textContent = `${label}. Sky shown for ${state.observer.lat.toFixed(2)}°, ${state.observer.lon.toFixed(2)}°. ${['ready', 'manual'].includes(state.locationStatus) ? '' : 'Use your location or choose coordinates for real observing.'}`;
  $('latitude').value = state.observer.lat; $('longitude').value = state.observer.lon;
}

function applyTheme() {
  radarColors = null;
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
  const m = state.milkyEq;
  state.milkyEnu = {
    spine: m.spine.map((p) => ({ enu: toEnu(p.v), width: p.width, bright: p.bright })),
    specks: m.specks.map((p) => ({ enu: toEnu(p.v), a: p.a, s: p.s })),
    rift: m.rift.map((p) => ({ enu: toEnu(p.v), w: p.w })),
  };
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
  $('new-count').textContent = state.items.filter(a => a.look.visible && isNewFind(a.obj)).length;
  if (!bannerKey.startsWith('New build')) {
    if (state.timeOffsetMs) showBanner(`Showing the sky at ${now().toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' })}. Tap to go back to now.`, backToNow);
    else if (state.needsMotionTap) showBanner('Tap anywhere to line the sky up with your phone.');
    else if (pointing.source === 'ios' && (pointing.compassAccuracy < 0 || pointing.compassAccuracy > 25) && !state.drag.on) showBanner('Compass needs aligning. Move your phone in a figure eight, then aim at a known star.', openDebug);
    else if (pointing.source === 'relative') showBanner('Check your heading against a known landmark. Adjust the compass in settings.', openDebug);
    else showBanner('');
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
let lastPanel = 0, lastLocked = false;
let uiSafeTop = 202, uiSafeBottom = 320;
function tick(ts) {
  requestAnimationFrame(tick);
  if (!state.catalog || !state.started || document.hidden || activePanel) return;
  const d = now();
  state.model.update(d, state.observer);
  state.items = state.model.items(d);
  state.rising?.update(d, state.observer);
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

  // The Moon, planets and bright stars (js/natural.js). The sky view draws them itself; here they only
  // join the candidates for the circle, behind any satellite (satellites don't wait around).
  const naturals = [];
  for (const n of naturalTargets(state.bodies, state.skyEnu?.stars)) {
    if (!n.look.visible) continue;
    const angCos = dot(n.look.enu, basis.back);
    if (angCos > reticleCos) state.sticky.set(n.obj.id, t);
    naturals.push({ obj: n.obj, label: label(n.obj), look: n.look, candidate: angCos > reticleCos, angCos });
  }
  state.naturals = naturals;

  // Candidates stay selectable for 1.5 s after leaving the circle so the card doesn't flicker away.
  const cands = [...items, ...naturals]
    .filter((it) => (it.look.visible || state.captureAny) && t - (state.sticky.get(it.obj.id) ?? -1e9) < 1500)
    .sort((a, b) => Number(!!a.obj.natural) - Number(!!b.obj.natural) || b.angCos - a.angCos)
    .slice(0, 5);
  for (const id of state.sticky.keys()) if (t - state.sticky.get(id) > 1500) state.sticky.delete(id);
  state.candidates = cands;
  let target;
  if (state.pinnedId) {
    target = items.find(it => it.obj.id === state.pinnedId) ?? naturals.find(it => it.obj.id === state.pinnedId);
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
  // Locked on = the target is inside the circle right now and can be collected. The ring shrinks onto
  // it, and the gold circle / Collect button use the same answer.
  state.lockedOn = !!target && target.angCos > Math.cos(sky.reticleDeg * RAD) && (target.look.visible || state.captureAny);
  const plane = findPlane(basis, t);

  sky.draw(basis, items, {
    showDim: state.showDim,
    sky: state.showStars ? state.skyEnu : null,
    bodies: state.showStars ? state.bodies : null,
    milky: state.showStars ? state.milkyEnu : null,
    lines: state.showLines,
    targetId: state.targetId,
    lockedOn: state.lockedOn,
    naturalTarget: target?.obj.natural ? target.look.enu : null,
    planes: state.planeItems,
    planeHit: plane?.plane.hex ?? null,
    newFind: !!state.newFind,
    landscape: !!state.landscape,
    rising: state.rising?.list(d).map((e) => ({ az: e.az, name: label(e.obj), mins: Math.max(1, Math.round((e.at - d.getTime()) / 60000)) })),
    time: t,
    safeTop: uiSafeTop,
    safeBottom: uiSafeBottom,
  });

  updateCompass(basis);
  placeDiscover();
  if (t - lastPanel > 250 || target?.obj.id !== shownTargetId || state.lockedOn !== lastLocked) {
    lastLocked = state.lockedOn; renderTarget(target, d); measureSkySpace(); lastPanel = t; }
  renderPlane(plane, t);
}

// ---------- planes ----------
// Live aircraft only (no time travel). When no satellite is locked on and a plane is in the circle,
// the ring turns red and says what it is. A little slack on the circle: positions are a few seconds old.
function findPlane(basis, t) {
  if (!planesAvailable() || state.timeOffsetMs) { state.planeItems = null; state.planeHit = null; return null; }
  state.planes.update(state.observer);
  const list = state.planeItems = state.planes.positions(state.observer);
  if (state.lockedOn) { state.planeHit = null; return null; }
  const inCos = Math.cos((sky.reticleDeg + 2) * RAD), keepCos = Math.cos((sky.reticleDeg + 5) * RAD);
  let best = null;
  for (const a of list) { a.angCos = dot(a.enu, basis.back); if (a.angCos > inCos && (!best || a.angCos > best.angCos)) best = a; }
  // Keep the last plane for a second after it slips out, as long as it's still close.
  const kept = state.planeHit && list.find((a) => a.plane.hex === state.planeHit.hex);
  if (!best && kept && kept.angCos > keepCos && t - state.planeHit.at < 1000) return kept;
  state.planeHit = best ? { hex: best.plane.hex, at: t } : null;
  return best;
}

let planeShown = null, planeText = 0;
function renderPlane(hit, t) {
  const el = $('plane');
  if (!hit) { if (!el.hidden) el.hidden = true; planeShown = null; return; }
  $('guidance').hidden = true;
  const ring = sky.ring ?? { x: sky.cx, y: sky.cy, r: sky.reticlePx };
  el.style.setProperty('--cx', `${ring.x}px`); el.style.setProperty('--cy', `${ring.y}px`); el.style.setProperty('--r', `${ring.r}px`);
  if (planeShown === hit.plane.hex && t - planeText < 500) return;
  planeShown = hit.plane.hex; planeText = t;
  el.hidden = false;
  const p = hit.plane, route = state.planes.route(p.callsign);
  const number = route?.flight?.replace(/^[A-Z0-9]{2}(?=\d)/, '');
  $('p-kind').textContent = isHelicopter(p) ? 'Just a helicopter' : 'Just a plane';
  $('p-name').textContent = route?.airline && number ? `${route.airline} ${number}` : p.callsign || p.reg || 'Unknown flight';
  const km = p.hKm >= 3 ? `${p.hKm.toFixed(p.hKm < 10 ? 1 : 0)} km up` : `${Math.round(p.hKm * 1000 / 10) * 10} m up`;
  const bits = [aircraftName(p), km, `${Math.round(hit.rangeKm)} km away`].filter(Boolean);
  const where = route?.from && route?.to ? `<b>${escapeHtml(route.from)} → ${escapeHtml(route.to)}</b><br>` : '';
  $('p-info').innerHTML = where + escapeHtml(bits.join(' · '));
}

// Radar (top-left): a heading-up map of the whole sky. Centre = overhead, edge = horizon. Gold dots
// are visible objects, bright white ones are new to you, the cyan wedge is what's on screen, and the
// notch at the top is the way you're facing. Doubles as the compass.
var radarColors = null; // var: applyTheme() runs before this line and resets it
function readRadarColors() {
  const cs = getComputedStyle(document.body), v = (n) => cs.getPropertyValue(n).trim();
  radarColors = { glass: v('--glass') || 'rgba(14,26,48,.82)', edge: v('--edge') || 'rgba(140,180,220,.3)', gold: v('--gold') || '#e6c68a', cyan: v('--cyan') || '#8fd3e8', muted: v('--muted') || '#9fb3dc', text: v('--text') || '#eef3ff' };
}
function updateCompass(basis) {
  const cv = $('radar-canvas');
  const dpr = window.devicePixelRatio || 1, size = 108;
  if (cv.width !== size * dpr) { cv.width = cv.height = size * dpr; }
  if (!radarColors) readRadarColors();
  const C = radarColors, ctx = cv.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, size, size);
  const c = size / 2, R = 40;
  const b = basis.back;
  const heading = (Math.atan2(b[0], b[1]) / RAD + 360) % 360;
  const at = (az, el) => { const r = R * (1 - Math.max(0, el) / 90), a = (az - heading) * RAD; return [c + r * Math.sin(a), c - r * Math.cos(a)]; };
  // Disc and rings
  ctx.fillStyle = C.glass; ctx.strokeStyle = C.edge; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(c, c, R, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.globalAlpha = 0.45;
  for (const k of [0.66, 0.33]) { ctx.beginPath(); ctx.arc(c, c, R * k, 0, Math.PI * 2); ctx.stroke(); }
  ctx.globalAlpha = 1;
  // What's on screen: a wedge as wide as the view.
  const half = Math.atan((sky.w / 2) / sky.f);
  ctx.fillStyle = 'rgba(143, 211, 232, 0.14)'; ctx.strokeStyle = 'rgba(143, 211, 232, 0.4)';
  ctx.beginPath(); ctx.moveTo(c, c); ctx.arc(c, c, R, -Math.PI / 2 - half, -Math.PI / 2 + half); ctx.closePath(); ctx.fill(); ctx.stroke();
  // Objects
  for (const it of state.items) {
    if (!it.look.visible) continue;
    const [x, y] = at(it.look.az, it.look.el);
    const isNew = isNewFind(it.obj), isTarget = it.obj.id === state.targetId;
    ctx.fillStyle = isNew ? '#ffffff' : C.gold;
    ctx.beginPath(); ctx.arc(x, y, isNew ? 1.6 : 1.3, 0, Math.PI * 2); ctx.fill();
    if (isTarget) { ctx.strokeStyle = C.cyan; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x, y, 4.5, 0, Math.PI * 2); ctx.stroke(); }
  }
  // Planes as tiny red dots.
  if (state.planeItems) {
    ctx.fillStyle = '#ff6b60';
    for (const a of state.planeItems) { const [x, y] = at(a.az, a.el); ctx.beginPath(); ctx.arc(x, y, 1.2, 0, Math.PI * 2); ctx.fill(); }
  }
  // Letters around the edge (heading-up, so they turn as you turn) and the facing notch.
  ctx.font = '700 10px -apple-system, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const [az, L] of [[0, 'N'], [90, 'E'], [180, 'S'], [270, 'W']]) {
    const a = (az - heading) * RAD, r = R + 8;
    ctx.fillStyle = az === 0 ? C.gold : C.muted;
    ctx.fillText(L, c + r * Math.sin(a), c - r * Math.cos(a));
  }
  ctx.fillStyle = C.cyan;
  ctx.beginPath(); ctx.moveTo(c, c - R - 1); ctx.lineTo(c - 4, c - R - 7); ctx.lineTo(c + 4, c - R - 7); ctx.closePath(); ctx.fill();
}

// ---------- target: callout + card ----------

function measureSkySpace() {
  const box = $('target');
  const rect = box.getBoundingClientRect();
  uiSafeTop = $('radar').getBoundingClientRect().bottom + 12;
  if (!$('banner').hidden) uiSafeTop = $('banner').getBoundingClientRect().bottom + 12;
  uiSafeBottom = box.hidden ? 100 : Math.max(100, window.innerHeight - rect.top + 34);
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

let shownTargetId = null, barTargetId = null;
// Two looks for the thing you're pointing at:
//  - never collected: no card at all. The circle glows gold, the name sits above it, tap the circle.
//  - already in your collection: a slim one-line bar with Collect (repeat sightings level cards up).
// Off target, both just say which way to turn.
let ownedKeys = null, ownedFrom = null;
let ownedStamps = null;
function refreshOwned() {
  if (ownedFrom === state.sightings && ownedKeys?.n === state.sightings.length) return;
  const real = state.sightings.filter((s) => !s.sim);
  ownedKeys = new Set(real.map((s) => s.cardKey));
  ownedStamps = new Set(real.map((s) => s.stampKey).filter(Boolean));
  ownedKeys.n = state.sightings.length; ownedFrom = state.sightings;
}
function ownsCard(o) { refreshOwned(); return ownedKeys.has(cardKeyFor(o)); }
// New to you: a card you don't have yet, or a fleet launch you haven't stamped.
function isNewFind(o) {
  refreshOwned();
  const stamp = stampKeyFor(o);
  return !ownedKeys.has(cardKeyFor(o)) || (!!stamp && !ownedStamps.has(stamp));
}
function turnHint(l) {
  if (l.el < 0) return 'This pass has ended';
  if (!l.visible && !state.captureAny) return 'Not visible right now';
  const currentAz = state.basis ? (Math.atan2(state.basis.back[0], state.basis.back[1]) / RAD + 360) % 360 : state.drag.az;
  const currentEl = state.basis ? Math.asin(state.basis.back[2]) / RAD : state.drag.el;
  const turn = ((l.az - currentAz + 540) % 360) - 180;
  const move = Math.abs(turn) > 8 ? (turn > 0 ? 'Turn right →' : '← Turn left') : l.el > currentEl ? '↑ Raise your phone' : '↓ Lower your phone';
  return `${move} · ${Math.round(l.el)}° up in the ${compassPoint(l.az)}`;
}
function switchLabel(o) {
  const n = state.candidates.length, i = state.candidates.findIndex((c) => c.obj.id === o.id);
  return n > 1 && i >= 0 ? `${i + 1} of ${n} ›` : '';
}
function renderTarget(target, d) {
  const bar = $('target'), disc = $('discover'), guide = $('guidance');
  $('callout').hidden = true;
  if (!target) { bar.hidden = disc.hidden = guide.hidden = true; state.newFind = false; shownTargetId = barTargetId = null; return; }
  shownTargetId = target.obj.id;
  const o = target.obj, l = target.look;
  const tier = TIER_INFO[o.tier] ?? TIER_INFO.common;
  const aligned = state.lockedOn;
  const eligible = canCapture({ visible: l.visible, aligned, practice: state.captureAny, allowAny: state.captureAny });
  const collected = collectedThisPass(o, d);
  const sw = switchLabel(o);

  if (isNewFind(o) && !collected) {
    // New find
    bar.hidden = true;
    state.newFind = eligible;
    if (eligible) {
      disc.hidden = false; guide.hidden = true;
      const newStamp = ownsCard(o); // fleet card already owned: this launch is a new stamp
      $('d-tier').textContent = newStamp ? 'New stamp' : tier.label;
      $('d-tier').style.color = newStamp ? '#8fb8ff' : tier.color;
      $('d-name').textContent = label(o);
      $('d-switch').hidden = !sw; $('d-switch').textContent = sw;
    } else {
      disc.hidden = true; guide.hidden = false;
      guide.textContent = `${label(o)} · ${turnHint(l)}`;
    }
    barTargetId = null;
    return;
  }

  // Seen before
  state.newFind = false;
  disc.hidden = true; guide.hidden = true; bar.hidden = false;
  if (o.id !== barTargetId) {
    barTargetId = o.id;
    bar.style.setProperty('--tier', tier.color);
    $('t-art').innerHTML = cardArt(o, { accent: setColor(o), w: 80, h: 80 });
    $('t-name').textContent = label(o);
  }
  $('t-switch').hidden = !sw; $('t-switch').textContent = sw;
  $('t-unpin').hidden = !state.pinnedId;
  const meta = $('t-meta');
  if (eligible || collected) { meta.className = ''; meta.textContent = `${tier.label} · in your collection · ${brightnessWord(l.mag)}`; }
  else { meta.className = 'turn'; meta.textContent = turnHint(l); }
  setAction();
}

// Keep the tap-the-circle overlay on top of the reticle wherever the sky view puts it.
function placeDiscover() {
  const guide = $('guidance');
  const ring = sky.ring ?? { x: sky.cx, y: sky.cy, r: sky.reticlePx };
  if (!guide.hidden) { guide.style.top = `${ring.y + ring.r + 18}px`; guide.style.bottom = 'auto'; }
  const disc = $('discover');
  if (disc.hidden) return;
  disc.style.setProperty('--cx', `${ring.x}px`);
  disc.style.setProperty('--cy', `${ring.y}px`);
  disc.style.setProperty('--r', `${ring.r}px`);
}
$('d-hit').addEventListener('click', () => {
  unlockAudio();
  primeReveal();
  const target = state.activeTarget;
  if (target && !state.captureBusy) capture(target.obj);
});
$('d-switch').addEventListener('click', () => $('t-switch').click());

$('t-switch').addEventListener('click', () => {
  const c = state.candidates;
  if (c.length < 2) return;
  const i = c.findIndex((x) => x.obj.id === state.targetId);
  state.targetId = c[(i + 1) % c.length].obj.id;
  state.pinnedId = state.targetId;
});

// Collected during this pass (the last 20 minutes of sky time)? Then the button offers View instead.
// A later pass can be collected again, which is what levels a card up.
// The Moon, planets and stars: once per observing night instead.
function collectedThisPass(o, d) {
  if (o.natural) return collectedTonight(state.sightings, cardKeyFor(o), d.getTime(), state.observer.lon);
  return collectedDuringPass(state.sightings, o.id, d.getTime(), false);
}
$('t-unpin').addEventListener('click', () => { state.pinnedId = null; state.targetId = null; state.sticky.clear(); });
// Something already in your collection: the toast's View button spins the card out right here. If it's
// in the circle and you haven't logged it this pass (or tonight, for the Moon, planets and stars),
// viewing it also counts as seeing it again, which is what levels a card up.
$('t-action').addEventListener('click', async () => {
  const target = state.activeTarget;
  unlockAudio();
  primeReveal();
  if (!target || state.captureBusy) return;
  const o = target.obj, d = now(), from = $('t-art').getBoundingClientRect();
  let counted = false;
  if (state.lockedOn && (target.look.visible || state.captureAny) && !collectedThisPass(o, d)) counted = !!(await recordSighting(o, d));
  showViewCard(o, from, counted);
});
function setAction() {
  const btn = $('t-action');
  btn.className = 'view';
  btn.disabled = state.captureBusy;
  btn.textContent = state.captureBusy ? 'Saving…' : 'View';
}
function cardModel(obj) { return state.cardModels.get(cardKeyFor(obj)) ?? obj; }
function cardSnapshot(obj) {
  // Fleet cards list every member and launch; the snapshot keeps just the card's own facts.
  const { satrec, _label, _setColor, members, launches, ...card } = cardModel(obj);
  return card;
}
// The magic moment (js/reveal.js): sealed card + flip for a first sighting, straight-in card with a
// count stamp for repeats, all scaled by rarity.
function showCaptureCard(obj) {
  const model = cardModel(obj), key = cardKeyFor(obj), stampKey = stampKeyFor(obj);
  const sightings = state.sightings.filter(s => !s.sim && s.cardKey === key);
  const card = renderCard(model, { sightings, seenMembers: new Set(sightings.map(s => s.objectId)).size });
  $('reveal-view').href = `cards.html#${encodeURIComponent(key)}`;
  openPanel('reveal');
  // Fleet cards: a launch seen for the first time lands a stamp, and levels count stamps.
  let fleet = null;
  if (model.launches && stampKey) {
    const stamps = stampsIn(sightings).size;
    const newStamp = sightings.filter((s) => s.stampKey === stampKey).length === 1;
    fleet = { newStamp, stamps, total: model.launches.length, cospar: stampKey.split(':')[1],
      level: fleetLevel(model.family, stamps), before: fleetLevel(model.family, newStamp ? stamps - 1 : stamps) };
  }
  // Levels count observing nights; pass the level before and after this sighting.
  const progress = { level: cardLevel(sightings), before: cardLevel(sightings.slice(1)), nights: nightsIn(sightings) };
  playReveal({ card, o: model, seen: sightings.length, fleet, progress, origin: { x: sky.ring?.x ?? sky.cx, y: sky.ring?.y ?? sky.cy } });
}
// Open an owned card in place, spinning out of the toast. counted: this view also logged a sighting.
function showViewCard(obj, from, counted) {
  const model = cardModel(obj), key = cardKeyFor(obj);
  const sightings = state.sightings.filter(s => !s.sim && s.cardKey === key);
  const card = renderCard(model, { sightings, seenMembers: new Set(sightings.map(s => s.objectId)).size });
  $('reveal-view').href = `cards.html#${encodeURIComponent(key)}`;
  openPanel('reveal');
  let sighting = null;
  if (counted) {
    const level = model.launches ? fleetLevel(model.family, stampsIn(sightings).size) : cardLevel(sightings);
    const before = model.launches ? level : cardLevel(sightings.slice(1));
    sighting = { seen: sightings.length, nights: nightsIn(sightings), level, levelUp: level !== before };
  }
  playView({ card, o: model, from, sighting });
}
async function capture(obj) {
  if (state.captureBusy) return;
  const d = now(), f = frame(d, state.observer);
  const l = obj.natural ? state.naturals?.find((n) => n.obj.id === obj.id)?.look : look(obj, f);
  const basis = currentBasis();
  const aligned = l && dot(enuFromAzEl(l.az, l.el), basis.back) > Math.cos(sky.reticleDeg * RAD);
  if (!l || !canCapture({ visible: l.visible, aligned, practice: state.captureAny, allowAny: state.captureAny })) { toast('Line up the object while it is visible to capture it.'); return; }
  if (collectedThisPass(obj, d)) { showViewCard(obj, null, false); return; }
  if (await recordSighting(obj, d, l)) showCaptureCard(obj);
}

// Save a real sighting of obj at sky time d. Returns the saved record, or null (and says why).
async function recordSighting(obj, d, l = null) {
  l ??= obj.natural ? state.naturals?.find((n) => n.obj.id === obj.id)?.look : look(obj, frame(d, state.observer));
  if (!l) return null;
  const m = obj.natural ? null : motion(obj, d, state.observer), key = cardKeyFor(obj);
  const sighting = { objectId: obj.id, cardKey: key, ...(stampKeyFor(obj) ? { stampKey: stampKeyFor(obj) } : {}), name: obj.name, type: obj.type, year: obj.year, time: d.getTime(), loggedAt: Date.now(), lat: state.observer.lat, lon: state.observer.lon, az: l.az, el: l.el, mag: l.mag, rangeKm: l.rangeKm, heading: m?.heading, ...(l.phaseName ? { phase: l.phaseName } : {}), sim: false, appVersion: VERSION, cardSnapshot: cardSnapshot(obj) };
  state.captureBusy = true; setAction();
  try {
    const key = await addSighting(sighting);
    const saved = { ...sighting, key };
    state.sightings.unshift(saved);
    return saved;
  } catch {
    toast('Your sighting could not be saved. Check that browser storage is available, then try again.', 5000);
    return null;
  } finally { state.captureBusy = false; setAction(); }
}

// ---------- sightings ----------

async function loadSightings() {
  try { state.sightings = (await allSightings()).map(normalizeSighting); state.storageReady = true; } catch { state.storageReady = false; }
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
$('radar').addEventListener('click', () => { renderVisible(); openPanel('visible'); });

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
  if (id === 'reveal') stopReveal();
  $(id).hidden = true; activePanel = null; $('hud').inert = false;
  if (panelReturn?.isConnected) panelReturn.focus({ preventScroll: true });
}
function openDebug() { renderDebug(); renderLocation(); openPanel('debug'); }
$('nav-more').addEventListener('click', openDebug);
$('nav-explore').addEventListener('click', () => closePanel());
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
function cancelPassSearch() { passRequest++; passWorker?.terminate(); passWorker=null; passBusy=false; clearTimeout(passTimer); $('btn-next-pass').disabled=false; }
function findPass() { previewPass(null, false); }
function previewPass(objectId = null, jump = true) {
  if (!state.catalog || passBusy) return;
  cancelPassSearch(); passBusy=true;
  const requestId = ++passRequest;
  $('btn-next-pass').disabled=true;
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
async function backToNow() {
  cancelPassSearch(); state.preview=false; state.followPreview=false; state.timeOffsetMs=0; state.captureAny=false; state.showDim=false; state.pinnedId=null; $('chk-any').checked=false; $('chk-dim').checked=false;
  await enableMotion();
  if (!['ready','manual'].includes(state.locationStatus)) requestLocation();
  afterTimeJump();
  showBanner('');
}
async function enableMotion() {
  let ok=false; try { ok=await startSensors(); } catch {}
  state.drag.on=!ok;
  if (!ok) toast('Motion is unavailable, so drag the sky to look around.',4000);
  $('chk-drag').checked=state.drag.on;
  return ok;
}

function afterTimeJump() {
  state.model?.reset();
  state.rising?.reset();
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
$('chk-landscape').checked = state.landscape;
$('chk-landscape').addEventListener('change', (e) => { state.landscape = e.target.checked; writePref('landscape', state.landscape); });
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
  writePref('started', true);
  state.preview=false; enterSky();
});

// Returning users skip the start screen and go straight to the sky. iPhones only allow motion
// access from a tap, so if it isn't available yet the first tap anywhere turns it on.
async function quickStart() {
  enterSky(); requestLocation(); keepAwake();
  let ok = false;
  try { ok = await startSensors(); } catch {}
  state.drag.on = !ok;
  state.needsMotionTap = !ok;
}
document.addEventListener('pointerdown', async () => {
  if (!state.needsMotionTap) return;
  state.needsMotionTap = false;
  let ok = false;
  try { ok = await startSensors(); } catch {}
  state.drag.on = !ok;
  $('chk-drag').checked = state.drag.on;
  if (ok) showBanner('');
}, true);
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
    state.rising=new RisingSoon(state.catalog.objects);
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
      }
    } catch {}
  } else if (readPref('started', false) || loadSavedLocation()) quickStart(); // anyone who has used the app before
  checkForUpdate(); requestAnimationFrame(tick);
}
boot();
