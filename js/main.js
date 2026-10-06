import { VERSION } from './version.js?v=0.1.129';
import { loadCatalog, frame, look, track, motion, compassPoint, enuFromAzEl, DARK_SUN_ELEVATION, SkyModel, RisingSoon, setBinocularMode, setSkyLimit } from './orbit.js?v=0.1.129';
import { skyLimit, SKIES, DEFAULT_SKY } from './sky-limit.js?v=0.1.129';
import { loadConstellations, CON_STARS, CON_BY_ID, conProgress } from './constellations.js?v=0.1.129';
import { shinyFor, SHINY } from './shiny.js?v=0.1.129';
import { progress as progressOf } from './progress.js?v=0.1.129';
import { activeEvent, nextEvent, passIcs } from './events.js?v=0.1.129';
import { CONSTELLATIONS } from './constellations.js?v=0.1.129';
import { startSensors, hasLiveSensors, trueBasis, basisFromAzEl, pointing, nudgeHeading, getNudge } from './sensors.js?v=0.1.129';
import { SkyView, shortName } from './sky.js?v=0.1.129';
import { loadSky, eqToEnu, solarSystem, milkyWayModel } from './celestial.js?v=0.1.129';
import { addSighting, allSightings, deleteSighting } from './store.js?v=0.1.129';
import { cardArt } from './art.js?v=0.1.129';
import { renderCard, cardLevel, artImage } from './card.js?v=0.1.129';
import { onRevealNews, playReveal, playView, primeReveal, stopReveal, onRevealDismiss } from './reveal.js?v=0.1.129';
import { buildCards, cardKeyFor, stampKeyFor, normalizeSighting, stampsIn, fleetLevel } from './card-model.js?v=0.1.129';
import { collectedDuringPass, collectedTonight, canCapture, nightsIn } from './observation.js?v=0.1.129';
import { naturalTargets } from './natural.js?v=0.1.129';
import { TIER_INFO } from './rarity.js?v=0.1.129';
import { SETS } from './sets.js?v=0.1.129';
import { TYPE_LABEL, ownerName, orbitStats } from './facts.js?v=0.1.129';
import { loadLore, titleFor, factFor, richText } from './lore.js?v=0.1.129';
import { PlaneTracker, planesAvailable, aircraftName, isHelicopter, planePath } from './planes.js?v=0.1.129';

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
  snap: readPref('snap', true),    // the targeting circle jumps onto a locked-on object
  lightSky: SKIES[readText('sky', DEFAULT_SKY)] ? readText('sky', DEFAULT_SKY) : DEFAULT_SKY, // light pollution where you are
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
function readText(k, d) { try { return localStorage.getItem(k) ?? d; } catch { return d; } }
function writeText(k, v) { try { localStorage.setItem(k, v); } catch {} }

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
  document.querySelector('meta[name=theme-color]').content = state.night ? '#000000' : '#080f1b';
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

// ---------- toasts: one-line tickets (2026-10-05, design canvas "Toast C") ----------
// Kinds colour the left edge: mission (orange), xp (steel blue), event / achievement / rank (gold), info.
// They queue rather than stack: one at a time, oldest first, each ~3 s, slid in under the header.
// `toast(html, ms, href)` keeps the old callers working as plain info tickets.
onRevealNews((n) => ticket(n));
const toastQueue = [];
let toastBusy = false;
function toast(html, ms = 2200, href = null) { ticket({ kind: 'info', line: html, html: true, ms, href }); }
function ticket({ kind = 'info', eyebrow = '', line = '', xp = 0, ms = 3000, href = null, html = false, delay = 0 }) {
  toastQueue.push({ kind, eyebrow, line, xp, ms, href, html, at: Date.now() + delay });
  pumpToasts();
}
function pumpToasts() {
  if (toastBusy || !toastQueue.length) return;
  const t = toastQueue[0], wait = t.at - Date.now();
  if (wait > 0) { toastBusy = true; setTimeout(() => { toastBusy = false; pumpToasts(); }, wait); return; }
  toastQueue.shift();
  toastBusy = true;
  const el = document.createElement('div');
  el.className = `ticket ticket--${t.kind}${t.href ? ' linked' : ''}`;
  el.innerHTML = `<i class="ticket__mark" aria-hidden="true"></i><span class="ticket__body">${t.eyebrow ? `<span class="ticket__eyebrow">${escapeHtml(t.eyebrow)}</span>` : ''}<span class="ticket__line">${t.html ? t.line : escapeHtml(t.line)}</span></span>${t.xp ? `<span class="ticket__xp">+${t.xp}<small>XP</small></span>` : t.href ? '<span class="ticket__go">OPEN ›</span>' : ''}`;
  if (t.href) el.addEventListener('click', () => { location.href = t.href; });
  $('toasts').append(el);
  requestAnimationFrame(() => el.classList.add('in'));
  setTimeout(() => {
    el.classList.remove('in');
    setTimeout(() => { el.remove(); toastBusy = false; pumpToasts(); }, 280);
  }, t.ms);
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function previewArt(obj, size, fallback) {
  const src = artImage(obj, size);
  return src ? `<img src="${escapeHtml(src)}" alt="" decoding="async">` : cardArt(obj, fallback);
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
  updateSkyLimit(f);
  updateStatus(f);
}

// What you can see right now: your sky's light pollution plus twilight and the Moon (js/sky-limit.js).
function updateSkyLimit(f) {
  const moon = state.bodies?.find((b) => b.kind === 'moon');
  const moonEl = moon ? Math.asin(Math.max(-1, Math.min(1, moon.enu[2]))) * 180 / Math.PI : -90;
  state.limit = skyLimit({ sky: state.lightSky, sunEl: f?.sunEl ?? -90, moonEl, moonIllum: moon?.illum ?? 0 });
  setSkyLimit(state.limit);
  const info = $('sky-limit-info');
  if (info) {
    const L = state.limit, why = [moonEl > 0 && moon.illum > 0.25 ? 'the Moon is up' : '', (f?.sunEl ?? -90) > -18 ? 'twilight' : ''].filter(Boolean).join(' and ');
    info.textContent = `Right now: stars to about magnitude ${L.stars.toFixed(1)}, moving satellites to ${L.satellites.toFixed(1)}${state.binoculars ? ` (${L.binoculars.toFixed(1)} with binoculars)` : ''}${why ? `, dimmed by ${why}` : ''}.`;
  }
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
  state.conEnu = CON_STARS.filter((o) => !o.skyName).map((o) => ({ obj: o, enu: toEnu(o.v) })); // constellation stars
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
  const fresh = state.items.filter(a => a.look.visible && isNewFind(a.obj)).length;
  $('new-count').textContent = fresh; $('radar-new').hidden = !fresh;
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
  for (const n of naturalTargets(state.bodies, state.skyEnu?.stars, state.conEnu, state.limit?.stars)) {
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
  autoLog(target, d, t);
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
    planeTrail: plane ? planePath(plane.plane, state.observer) : null, // where the lined-up plane has been and is going
    newFind: !!state.newFind,
    landscape: !!state.landscape,
    rising: state.rising?.list(d).map((e) => ({ az: e.az, name: label(e.obj), mins: Math.max(1, Math.round((e.at - d.getTime()) / 60000)) })),
    time: t,
    safeTop: uiSafeTop,
    safeBottom: uiSafeBottom,
  });

  updateCompass(basis);
  if (t - lastChip > 1000) { lastChip = t; requestTonight(); updateNextPassChip(); updateEventBanner(); }
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

// Radar (top-left), the "heat radar" chosen 2026-10-02 (design/radar-compact-options.html, option 1):
// a heading-up map of the whole sky (centre = overhead, edge = horizon) where every visible object is a
// soft glow, so busy patches simply look brighter instead of turning into a blob of dots. Only Epic and
// Legendary objects get their own dot in their rarity colour, and the target gets a steel-blue ring (all red in night mode). The
// notch at the top is the way you're facing; the count sits in a chip to the right.
var radarColors = null; // var: applyTheme() runs before this line and resets it
var glowSprite = null;  // one soft blob, drawn once and stamped for every object
const RADAR = 96, RADAR_R = 35;
function readRadarColors() {
  const cs = getComputedStyle(document.body), v = (n) => cs.getPropertyValue(n).trim();
  radarColors = { glass: v('--glass') || '#0c1725', edge: v('--edge') || '#627a8b', gold: v('--gold') || '#fa8127', cyan: v('--cyan') || '#8fb3cf', muted: v('--muted') || '#bdbea9', text: v('--text') || '#fff2b3' };
  glowSprite = null;
}
function makeGlow(color, dpr) {
  const r = 5.5, px = Math.ceil(r * 2 * dpr), cv = document.createElement('canvas');
  cv.width = cv.height = px;
  const g = cv.getContext('2d'), grad = g.createRadialGradient(px / 2, px / 2, 0, px / 2, px / 2, px / 2);
  grad.addColorStop(0, color); grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad; g.fillRect(0, 0, px, px);
  return { cv, r };
}
function updateCompass(basis) {
  const cv = $('radar-canvas');
  const dpr = window.devicePixelRatio || 1, size = RADAR;
  if (cv.width !== size * dpr) { cv.width = cv.height = size * dpr; }
  if (!radarColors) readRadarColors();
  const C = radarColors, ctx = cv.getContext('2d');
  glowSprite ??= makeGlow(C.gold, dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, size, size);
  const c = size / 2, R = RADAR_R;
  const b = basis.back;
  const heading = (Math.atan2(b[0], b[1]) / RAD + 360) % 360;
  const at = (az, el) => { const r = R * (1 - Math.max(0, el) / 90), a = (az - heading) * RAD; return [c + r * Math.sin(a), c - r * Math.cos(a)]; };
  ctx.fillStyle = C.glass; ctx.strokeStyle = C.edge; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(c, c, R, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // Engraved instrument ticks echo the orbital seal on the cards.
  ctx.strokeStyle = C.muted; ctx.globalAlpha = 0.5; ctx.lineWidth = 0.7;
  ctx.beginPath(); ctx.arc(c, c, R - 3, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath();
  for (let i = 0; i < 24; i++) {
    const a = i * Math.PI / 12, inner = R - (i % 6 === 0 ? 7 : 5);
    ctx.moveTo(c + Math.sin(a) * inner, c - Math.cos(a) * inner);
    ctx.lineTo(c + Math.sin(a) * (R - 2), c - Math.cos(a) * (R - 2));
  }
  ctx.stroke(); ctx.globalAlpha = 1;
  // Everything visible as a faint glow; overlapping glows build up where the sky is busy.
  ctx.save();
  ctx.beginPath(); ctx.arc(c, c, R, 0, Math.PI * 2); ctx.clip();
  ctx.globalAlpha = 0.16;
  const { cv: spr, r: sr } = glowSprite;
  let special = [], target = null;
  for (const it of state.items) {
    if (!it.look.visible) continue;
    const [x, y] = at(it.look.az, it.look.el);
    ctx.drawImage(spr, x - sr, y - sr, sr * 2, sr * 2);
    if (it.obj.tier === 'epic' || it.obj.tier === 'legendary') special.push([x, y, it.obj.tier]);
    if (it.obj.id === state.targetId) target = [x, y];
  }
  ctx.restore();
  for (const [x, y, tier] of special) {
    ctx.fillStyle = state.night ? C.gold : TIER_INFO[tier].color; ctx.strokeStyle = C.glass; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.arc(x, y, 2.4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  if (target) { ctx.strokeStyle = C.cyan; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(target[0], target[1], 4.5, 0, Math.PI * 2); ctx.stroke(); }
  // Letters around the edge (heading-up, so they turn as you turn) and the facing notch.
  ctx.font = '500 11px "SC Label", "Arial Narrow", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const [az, L] of [[0, 'N'], [90, 'E'], [180, 'S'], [270, 'W']]) {
    const a = (az - heading) * RAD, r = R + 7.5;
    ctx.fillStyle = az === 0 ? C.gold : C.muted;
    ctx.fillText(L, c + r * Math.sin(a), c - r * Math.cos(a));
  }
  ctx.fillStyle = C.cyan;
  ctx.beginPath(); ctx.moveTo(c, c - R - 1); ctx.lineTo(c - 3.5, c - R - 6.5); ctx.lineTo(c + 3.5, c - R - 6.5); ctx.closePath(); ctx.fill();
}

// ---------- target: callout + card ----------

function measureSkySpace() {
  const box = $('target');
  const rect = box.getBoundingClientRect();
  uiSafeTop = $('radar').getBoundingClientRect().bottom + 12;
  if (!$('banner').hidden) uiSafeTop = $('banner').getBoundingClientRect().bottom + 12;
  const navInset = window.innerHeight - $('nav').getBoundingClientRect().top + 20;
  uiSafeBottom = box.hidden ? navInset : Math.max(navInset, window.innerHeight - rect.top + 34);
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
//  - never collected: no card at all. An orange dial frames the find; tap the circle or collect button.
//  - already in your collection: a slim card preview; viewing it can record a repeat sighting.
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
  if (!target) { bar.hidden = disc.hidden = guide.hidden = true; state.newFind = false; state.dismissedId = null; shownTargetId = barTargetId = null; return; }
  shownTargetId = target.obj.id;
  if (state.dismissedId != null && target.obj.id !== state.dismissedId) state.dismissedId = null; // a closed mini card returns once you've moved on
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
      $('d-tier').style.setProperty('--find-tier', newStamp ? 'var(--cyan)' : tier.color);
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
  disc.hidden = true; guide.hidden = true;
  // Closed with ×: stays hidden until you point at something else.
  if (state.dismissedId === o.id) { bar.hidden = true; barTargetId = null; return; }
  state.dismissedId = null;
  bar.hidden = false;
  if (o.id !== barTargetId) {
    barTargetId = o.id;
    bar.style.setProperty('--tier', tier.color);
    $('t-art').innerHTML = previewArt(o, 'small', { accent: setColor(o), w: 80, h: 80 });
    $('t-name').textContent = label(o);
  }
  $('t-switch').hidden = !sw; $('t-switch').textContent = sw;
  bar.classList.toggle('busy', state.captureBusy);
  const meta = $('t-meta');
  if (eligible || collected) { meta.className = ''; meta.textContent = `${tier.label} · in your collection · ${brightnessWord(l.mag)}`; }
  else { meta.className = 'turn'; meta.textContent = turnHint(l); }
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
$('d-cta').addEventListener('click', () => $('d-hit').click());
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
// Seeing something you already own counts on its own: hold it in the circle for a moment while it's
// visible and the sighting is logged (once per pass; once a night for the Moon, planets and stars), so
// "When you saw it" fills in and levels grow without tapping. A level-up gets a toast.
const AUTO_LOG_MS = 1200;
let autoHold = null;
function autoLog(target, d, t) {
  const o = target?.obj;
  if (!o || !state.lockedOn || !(target.look.visible || state.captureAny) || state.captureBusy || isNewFind(o) || !ownsCard(o)) { autoHold = null; return; }
  if (autoHold?.id !== o.id) { autoHold = { id: o.id, since: t, done: false }; return; }
  if (autoHold.done || t - autoHold.since < AUTO_LOG_MS) return;
  autoHold.done = true;
  if (collectedThisPass(o, d)) return;
  const key = cardKeyFor(o), before = cardLevel(state.sightings.filter((s) => !s.sim && s.cardKey === key));
  recordSighting(o, d).then((saved) => {
    if (!saved) return;
    const after = cardLevel(state.sightings.filter((s) => !s.sim && s.cardKey === key));
    const name = label(o);
    toast(saved.shiny ? `✦ Shiny! ${name}: ${SHINY[saved.shiny].line}` : after !== before && !o.launches ? `${name}: ${after[0].toUpperCase() + after.slice(1)} card unlocked!` : `Seen again: ${name}. Logged.`, saved.shiny ? 4500 : 2600);
    lastPanel = 0;
    announceProgress(progressGain(saved), 2800);
  });
}
function collectedThisPass(o, d) {
  if (o.natural) return collectedTonight(state.sightings, cardKeyFor(o), d.getTime(), state.observer.lon);
  return collectedDuringPass(state.sightings, o.id, d.getTime(), false);
}
// × closes the mini card. A selected object is let go; something you're just pointing at stays
// hidden until you point at something else.
$('t-close').addEventListener('click', (e) => {
  e.stopPropagation();
  const id = state.activeTarget?.obj.id;
  if (state.pinnedId != null) { state.pinnedId = null; state.targetId = null; state.sticky.clear(); }
  else if (id != null) state.dismissedId = id;
  $('target').hidden = true; lastPanel = 0;
});
$('t-switch').addEventListener('click', (e) => e.stopPropagation(), true);
// Something already in your collection: tap anywhere on the mini card and the card spins out right
// here. If it's in the circle and you haven't logged it this pass (or tonight, for the Moon, planets and
// stars), viewing it also counts as seeing it again, which is what levels a card up.
$('target').addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('target').click(); } });
$('target').addEventListener('click', async () => {
  const target = state.activeTarget;
  unlockAudio();
  primeReveal();
  if (!target || state.captureBusy) return;
  const o = target.obj, d = now(), from = $('t-art').getBoundingClientRect();
  let counted = false;
  if (state.lockedOn && (target.look.visible || state.captureAny) && !collectedThisPass(o, d)) counted = !!(await recordSighting(o, d));
  showViewCard(o, from, counted);
});
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
  const collected = new Set(state.sightings.filter(s => !s.sim).map(s => s.cardKey)).size; // milestone stamps
  // A constellation star: the stamp shows how far along its constellation is (gold when complete).
  const conCard = model.con && CON_BY_ID.get(model.con);
  const con = conCard && sightings.length === 1 ? { name: conCard.name, ...conProgress(conCard, ownedCardKeys()) } : null;
  const gain = progressGain(sightings[0]); announceProgress(gain);
  playReveal({ card, o: model, seen: sightings.length, fleet, progress, collected, con, xp: gain.xp, shiny: sightings[0]?.shiny ? SHINY[sightings[0].shiny] : null, origin: { x: sky.ring?.x ?? sky.cx, y: sky.ring?.y ?? sky.cy } });
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
// Constellations (js/constellations.js): owning every star turns its card gold; the capture stamp says so.
function ownedCardKeys() { return new Set(state.sightings.filter((s) => !s.sim).map((s) => s.cardKey)); }
// What a sighting earned (js/progress.js): XP, missions completed, new achievements, rank-ups. Compares the
// log with and without the newest sighting; toasts the news a moment after the card lands.
function progressNow(list) {
  const info = (k) => { const c = state.cardModels.get(k); return c ? { tier: c.tier, type: c.type, owner: c.owner ?? (c.family ? state.catalog.families?.[c.family]?.owner : undefined), launch: c.launch, natural: c.natural, con: c.con } : null; };
  return progressOf(list, info, { constellations: CONSTELLATIONS.map((c) => ({ id: c.con, stars: c.stars, zodiac: c.zodiac })), now: now().getTime() });
}
function progressGain(saved) {
  const after = progressNow(state.sightings), before = progressNow(state.sightings.filter((s) => s !== saved));
  const missions = after.missions.filter((m, i) => m.done && !before.missions[i]?.done);
  const achievements = after.achievements.filter((a, i) => a.done && !before.achievements[i].done);
  const ev = activeEvent(saved.time), firstOfEvent = ev && !state.sightings.some((s) => s !== saved && !s.sim && s.time >= ev.start && s.time <= ev.end);
  return { xp: after.xp - before.xp, missions, achievements, rankUp: after.rank.index > before.rank.index ? after.rank.name : null, event: firstOfEvent ? ev.name : null };
}
function announceProgress(g, delay = 3800) {
  // Tickets queue themselves; the delay lets the card land first.
  if (g.event) ticket({ kind: 'event', eyebrow: 'EVENT BADGE', line: g.event, ms: 3600, delay });
  g.missions.forEach((m) => ticket({ kind: 'mission', eyebrow: 'MISSION COMPLETE', line: m.text, xp: 50, ms: 3200, delay }));
  g.achievements.forEach((a) => ticket({ kind: 'achievement', eyebrow: 'ACHIEVEMENT', line: `${a.name} · ${a.text}`, ms: 3800, delay }));
  if (g.rankUp) ticket({ kind: 'rank', eyebrow: 'RANK UP', line: `You're now a ${g.rankUp}`, ms: 4200, delay, href: 'cards.html' });
}
async function recordSighting(obj, d, l = null) {
  l ??= obj.natural ? state.naturals?.find((n) => n.obj.id === obj.id)?.look : look(obj, frame(d, state.observer));
  if (!l) return null;
  const m = obj.natural ? null : motion(obj, d, state.observer), key = cardKeyFor(obj);
  // Shiny (js/shiny.js): something special happening in the sky right now.
  const moonB = state.bodies?.find((b) => b.kind === 'moon');
  const later = obj.natural ? null : look(obj, frame(new Date(d.getTime() + 45000), state.observer));
  const shiny = shinyFor(obj, { ...l, enu: l.enu ?? enuFromAzEl(l.az, l.el) }, later, moonB ? { enu: moonB.enu, illum: moonB.illum } : null, d.getTime());
  const sighting = { ...(shiny ? { shiny } : {}), objectId: obj.id, cardKey: key, ...(stampKeyFor(obj) ? { stampKey: stampKeyFor(obj) } : {}), name: obj.name, type: obj.type, year: obj.year, time: d.getTime(), loggedAt: Date.now(), lat: state.observer.lat, lon: state.observer.lon, az: l.az, el: l.el, mag: l.mag, rangeKm: l.rangeKm, heading: m?.heading, ...(l.phaseName ? { phase: l.phaseName } : {}), sim: false, appVersion: VERSION, cardSnapshot: cardSnapshot(obj) };
  state.captureBusy = true;
  try {
    const key = await addSighting(sighting);
    const saved = { ...sighting, key };
    state.sightings.unshift(saved);
    return saved;
  } catch {
    toast('Your sighting could not be saved. Check that browser storage is available, then try again.', 5000);
    return null;
  } finally { state.captureBusy = false; }
}

// ---------- sightings ----------

async function loadSightings() {
  try { state.sightings = (await allSightings()).map(normalizeSighting); state.storageReady = true; } catch { state.storageReady = false; }
}


// ---------- visible now ----------

function renderVisible() {
  const list = $('visible-list');
  // Satellites plus the Moon, planets and bright stars that are up and collectable right now.
  const vis = [...state.items.filter((i) => i.look.visible), ...(state.naturals ?? [])].sort((a, b) => a.look.mag - b.look.mag);
  $('visible-hint').textContent = vis.length
    ? `Brightest first. ${state.drag.on || !hasLiveSensors() ? 'Tap one to look at it.' : 'Tap one to select it, then follow the directions. Tap empty sky to let go.'}`
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
    row.querySelector('.meta').textContent = `${isNewFind(o) ? 'New · ' : ''}${tier.label} · mag ${it.look.mag.toFixed(1)} (${brightnessWord(it.look.mag)}) · ${Math.round(it.look.el)}° up in the ${compassPoint(it.look.az)}`;
    row.addEventListener('click', () => {
      cancelPassSearch();
      state.pinnedId = o.id; state.targetId = o.id;
      if (state.drag.on || !hasLiveSensors()) { state.drag.on = true; state.drag.az = it.look.az; state.drag.el = it.look.el; }
      closePanel('visible');
    });
    list.appendChild(row);
  }
}
$('radar').addEventListener('click', () => { showVTab('now'); renderVisible(); openPanel('visible'); });

// ---------- tonight planner ----------
// js/tonight-worker.js forecasts every visible pass from now to dawn (same visibility rules as the live sky).
// The visible panel's Tonight tab shows when satellites are up, a chart, the passes worth looking for, and
// what else is up (planets, constellations with stars you still need). When nothing is lit, a chip under
// the radar says when the next good pass is.
let tonightWorker = null, tonightReq = 0, tonightBusy = false, lastChip = 0;
const fmtTime = (ms) => new Date(ms).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
function requestTonight(force = false) {
  if (!state.catalog || !state.observer || tonightBusy) return;
  const T = state.tonight;
  if (!force && T && now().getTime() - T.startMs < 20 * 60000 && T.sky === state.lightSky && T.lat === state.observer.lat && T.lon === state.observer.lon && T.bino === state.binoculars) return;
  tonightBusy = true;
  const requestId = ++tonightReq, startMs = now().getTime();
  try {
    tonightWorker ??= new Worker(new URL(`./tonight-worker.js?v=${VERSION}`, import.meta.url), { type: 'module' });
    tonightWorker.onmessage = ({ data }) => {
      if (data.requestId !== tonightReq) return;
      tonightBusy = false;
      if (data.error) return;
      state.tonight = { ...data, sky: state.lightSky, lat: state.observer.lat, lon: state.observer.lon, bino: state.binoculars };
      if (!$('vtab-tonight').hidden) renderTonight();
      lastChip = 0;
    };
    tonightWorker.onerror = () => { tonightBusy = false; };
    const base = skyLimit({ sky: state.lightSky }), faintest = (state.binoculars ? base.binoculars : base.satellites) + 0.5;
    const objects = state.catalog.objects.filter((o) => o.stdMag + 5 * Math.log10(Math.max(o.perigee ?? 400, 200) / 1000) <= faintest);
    tonightWorker.postMessage({ requestId, objects, observer: state.observer, startMs, sky: state.lightSky, binoculars: state.binoculars });
  } catch { tonightBusy = false; }
}
function showVTab(tab) {
  document.querySelectorAll('[data-vtab]').forEach((b) => b.classList.toggle('on', b.dataset.vtab === tab));
  $('vtab-now').hidden = tab !== 'now'; $('vtab-tonight').hidden = tab !== 'tonight';
  $('visible-title').textContent = tab === 'now' ? 'Visible now' : 'Tonight';
  if (tab === 'tonight') renderTonight();
}
document.querySelectorAll('[data-vtab]').forEach((b) => b.addEventListener('click', () => showVTab(b.dataset.vtab)));
// When satellites are visible, as merged windows: [{ s, e, max }].
function tonightWindows(T) {
  const wins = []; let cur = null;
  for (const [t, n] of T.curve) {
    if (n > 0) { if (cur && t - cur.e <= 20 * 60000) { cur.e = t; cur.max = Math.max(cur.max, n); } else { if (cur) wins.push(cur); cur = { s: t, e: t, max: n }; } }
  }
  if (cur) wins.push(cur);
  return wins.filter((w) => w.e - w.s >= 5 * 60000 || w.max > 1);
}
function tonightPasses(T, t0) {
  return T.passes.filter((p) => p.end >= t0 - 60000).map((p) => ({ ...p, obj: state.byId.get(p.id) })).filter((p) => p.obj)
    .map((p) => ({ ...p, fresh: isNewFind(p.obj) }))
    .filter((p) => p.fresh || p.mag <= 2.5 || p.peakEl >= 60 || ['rare', 'epic', 'legendary'].includes(p.obj.tier))
    .sort((a, b) => a.start - b.start);
}
function renderTonight() {
  const T = state.tonight, t0 = now().getTime();
  if (!T) { $('tonight-summary').textContent = 'Working out tonight\'s sky…'; $('tonight-chart').innerHTML = ''; $('tonight-list').innerHTML = ''; requestTonight(); return; }
  const wins = tonightWindows(T).filter((w) => w.e >= t0);
  const peak = T.curve.filter(([t]) => t >= t0).reduce((a, c) => (c[1] > a[1] ? c : a), [0, 0]);
  const ev = activeEvent(t0) ?? nextEvent(t0), evLine = ev ? (t0 >= ev.start ? `<br>☄ <b>${ev.name}</b> meteor shower tonight (${ev.rate}).` : `<br>☄ Next event: <b>${ev.name}</b> meteor shower, ${new Date(ev.start + 30 * 3600e3).toLocaleDateString([], { month: 'short', day: 'numeric' })}.`) : '';
  $('tonight-summary').innerHTML = (wins.length
    ? `Satellites are visible ${wins.slice(0, 3).map((w) => `<b>${fmtTime(Math.max(w.s, t0))}–${fmtTime(w.e)}</b>`).join(' and ')}. Busiest around <b>${fmtTime(peak[0])}</b>, up to ${peak[1]} at once.`
    : `No satellites bright enough for your sky until dawn. Try <b>Countryside</b> in settings if you're somewhere darker, or binocular mode.`) + evLine;
  // Chart: satellites visible across the night, in 10-minute bins, with a "now" line.
  const pts = T.curve; let svg = '';
  if (pts.length) {
    const W = 340, H = 64, a = pts[0][0], b = pts[pts.length - 1][0], span = Math.max(1, b - a), bins = [];
    for (const [t, n] of pts) { const i = Math.floor((t - a) / 600000); bins[i] = Math.max(bins[i] ?? 0, n); }
    const maxN = Math.max(1, ...bins.filter(Boolean)), bw = W / bins.length;
    svg += bins.map((n, i) => (n ? `<rect x="${(i * bw + 0.5).toFixed(1)}" y="${(H - (n / maxN) * H).toFixed(1)}" width="${Math.max(1, bw - 1).toFixed(1)}" height="${((n / maxN) * H).toFixed(1)}" rx="1" fill="#fa8127" opacity=".8"/>` : '')).join('');
    const xNow = ((t0 - a) / span) * W;
    if (xNow >= 0 && xNow <= W) svg += `<line x1="${xNow}" x2="${xNow}" y1="0" y2="${H}" stroke="#fff2b3" stroke-width="1.2"/><text x="${Math.min(W - 18, xNow + 4)}" y="10" fill="#fff2b3" font-size="9" font-family="SC Label, Arial Narrow">NOW</text>`;
    svg = `<svg viewBox="0 0 ${W} ${H + 16}" role="img" aria-label="Satellites visible through the night"><line x1="0" x2="${W}" y1="${H}" y2="${H}" stroke="#344654"/>${svg}
      <text x="0" y="${H + 13}" fill="#bdbea9" font-size="10" font-family="SC Label, Arial Narrow">${fmtTime(a)}</text><text x="${W}" y="${H + 13}" text-anchor="end" fill="#bdbea9" font-size="10" font-family="SC Label, Arial Narrow">${fmtTime(b)}</text></svg>`;
  }
  $('tonight-chart').innerHTML = svg;
  // Passes worth looking for, then the Moon, planets and constellations that are up.
  const list = $('tonight-list'); list.innerHTML = '';
  const passes = tonightPasses(T, t0).slice(0, 40);
  let lastHead = '';
  for (const p of passes) {
    const h = new Date(p.start).getHours(), head = p.start <= t0 ? 'Up right now' : h >= 12 ? 'This evening' : h < 5 ? 'Late night' : 'Before dawn';
    if (head !== lastHead) { list.insertAdjacentHTML('beforeend', `<div class="t-head">${head}</div>`); lastHead = head; }
    const tier = TIER_INFO[p.obj.tier] ?? TIER_INFO.common;
    const row = document.createElement('div'); row.className = 't-row'; row.style.setProperty('--tier', tier.color);
    row.innerHTML = `<span class="time">${fmtTime(p.start)}</span><span><div class="name"><span class="dot"></span>${escapeHtml(label(p.obj))}${p.fresh ? '<span class="new">NEW</span>' : ''}</div>
      <div class="meta">${tier.label} · up to mag ${p.mag} (${brightnessWord(p.mag)}) · rises in the ${compassPoint(p.riseAz)}, highest ${p.peakEl}° in the ${compassPoint(p.peakAz)} at ${fmtTime(p.peakAt)}</div>
      ${p.start > t0 + 10 * 60000 ? '<button class="remind" type="button">Remind me</button>' : ''}</span>`;
    row.querySelector('.remind')?.addEventListener('click', () => remindPass(p));
    list.appendChild(row);
  }
  if (!passes.length) list.insertAdjacentHTML('beforeend', '<p class="hint">No standout passes left tonight.</p>');
  list.insertAdjacentHTML('beforeend', `<div class="t-head">Also up tonight</div>` + alsoUpTonight(t0, T.dawn ?? t0 + 10 * 3600000));
}
// "Remind me": a calendar event with an alarm 10 minutes before the pass (iOS offers Add to Calendar).
function remindPass(p) {
  const name = label(p.obj), title = `${name} passes over (Space Collector)`;
  const description = `Look ${compassPoint(p.riseAz)} at ${fmtTime(p.start)}. Highest ${p.peakEl}° up in the ${compassPoint(p.peakAz)} at ${fmtTime(p.peakAt)}, up to magnitude ${p.mag}. Open https://sevaan.github.io/space-collector/ to collect it.`;
  const url = URL.createObjectURL(new Blob([passIcs({ title, start: p.start, end: p.end, description })], { type: 'text/calendar' }));
  const a = document.createElement('a'); a.href = url; a.download = `${name.replace(/[^\w-]+/g, '-')}.ics`; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  toast(`Reminder for ${name} at ${fmtTime(p.start)}: add it to your calendar.`, 3500);
}
// Planets and constellations (with stars you still need) above the horizon in a dark sky before dawn.
function alsoUpTonight(t0, until) {
  const planets = new Map(), cons = new Map();
  for (let t = t0; t <= until; t += 30 * 60000) {
    const d = new Date(t), toEnu = eqToEnu(d, state.observer), bodies = solarSystem(d, state.observer);
    const el = (v) => Math.asin(Math.max(-1, Math.min(1, toEnu(v)[2]))) * 180 / Math.PI;
    const sun = bodies.find((b) => b.kind === 'sun'); if (sun && el(sun.v) > -6) continue;
    for (const b of bodies) if (b.kind === 'planet' && el(b.v) > 10 && !planets.has(b.name)) planets.set(b.name, t);
    for (const o of CON_STARS) {
      if (!isNewFind(o) || el(o.v) < 20 || o.mag > (state.limit?.stars ?? 4.8)) continue;
      const c = cons.get(o.con) ?? cons.set(o.con, { best: 0, at: t, now: new Map() }).get(o.con);
      c.now.set(t, (c.now.get(t) ?? 0) + 1);
      if (c.now.get(t) > c.best) { c.best = c.now.get(t); c.at = t; }
    }
  }
  const rows = [];
  for (const [name, t] of planets) rows.push(`<div class="t-row"><span class="time">${t <= t0 ? 'Now' : fmtTime(t)}</span><span><div class="name">${name}</div><div class="meta">Planet · above the trees from ${t <= t0 ? 'now' : fmtTime(t)}</div></span></div>`);
  [...cons.entries()].sort((a, b) => b[1].best - a[1].best).slice(0, 5).forEach(([id, c]) => {
    const con = CON_BY_ID.get(id);
    rows.push(`<div class="t-row"><span class="time">${c.at <= t0 ? 'Now' : fmtTime(c.at)}</span><span><div class="name">${escapeHtml(con.name)}<span class="new">${c.best} NEW STAR${c.best > 1 ? 'S' : ''}</span></div><div class="meta">Constellation · best placed around ${fmtTime(c.at)}</div></span></div>`);
  });
  return rows.join('') || '<p class="hint">Nothing else new is well placed tonight.</p>';
}
// The chip under the radar when no satellite is lit right now.
function updateNextPassChip() {
  const chip = $('nextpass');
  const lit = state.items?.some((i) => i.look.visible);
  const T = state.tonight, t0 = now().getTime();
  if (lit || !T || state.timeOffsetMs) { if (!chip.hidden) chip.hidden = true; return; }
  const next = tonightPasses(T, t0).find((p) => p.start > t0);
  const win = tonightWindows(T).find((w) => w.s > t0);
  const dark = T.curve.length && t0 >= T.curve[0][0];
  chip.innerHTML = next ? `${dark ? 'Nothing lit right now · next: ' : 'Satellites from ' + fmtTime(win?.s ?? next.start) + ' · first: '}<b>${escapeHtml(label(next.obj))}</b> at ${fmtTime(next.start)} ›`
    : win ? `Nothing lit right now · satellites again at <b>${fmtTime(win.s)}</b> ›` : 'No more satellites tonight · see what else is up ›';
  chip.hidden = false;
}
$('nextpass').addEventListener('click', () => { showVTab('tonight'); openPanel('visible'); });
// Meteor shower events (js/events.js): a banner while one is on; catching anything earns its badge.
function updateEventBanner() {
  const e = activeEvent(now().getTime()), el = $('event-banner');
  if (!e) { if (!el.hidden) el.hidden = true; return; }
  const got = state.sightings.some((s) => !s.sim && s.time >= e.start && s.time <= e.end);
  const html = `☄ <b>${escapeHtml(e.name)}</b> meteor shower · ${got ? 'badge earned ✓' : 'catch anything to earn the badge'}`;
  if (el.innerHTML !== html) el.innerHTML = html;
  el.hidden = false;
}
$('event-banner').addEventListener('click', () => { const e = activeEvent(now().getTime()); if (e) toast(`${e.name}: ${e.rate}. Look up and away from bright lights; catch any object tonight to earn the badge.`, 5500); });

// ---------- drag to look ----------

let dragStart = null, tapStart = null;
$('sky').addEventListener('pointerdown', (e) => {
  tapStart = { x: e.clientX, y: e.clientY, t: performance.now() };
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
$('sky').addEventListener('pointerup', (e) => {
  // A tap (not a drag): select whatever is under your finger, or clear the selection.
  const tap = tapStart && Math.hypot(e.clientX - tapStart.x, e.clientY - tapStart.y) < 10 && performance.now() - tapStart.t < 500;
  dragStart = tapStart = null;
  if (tap) tapSky(e.clientX, e.clientY);
});
$('sky').addEventListener('pointercancel', () => { dragStart = tapStart = null; });

// Tap a satellite, the Moon, a planet or a bright star to select it: it stays the target and the
// guidance tells you which way to turn. Tap empty sky to let go of the selection.
const TAP_REACH = 30; // px: a fingertip
function tapSky(cx, cy) {
  const r = $('sky').getBoundingClientRect(), x = cx - r.left, y = cy - r.top;
  let best = null, bestD = TAP_REACH;
  for (const h of sky.hits ?? []) { const d = Math.hypot(h.x - x, h.y - y); if (d < bestD) { best = h.id; bestD = d; } }
  for (const n of state.naturals ?? []) {
    const p = sky.project(n.look.enu);
    if (!p) continue;
    const d = Math.hypot(p.x - x, p.y - y);
    if (d < bestD) { best = n.obj.id; bestD = d; }
  }
  if (best != null) {
    state.pinnedId = best; state.targetId = best; state.sticky.clear();
    lastPanel = 0; // refresh the guidance straight away
  } else if (state.pinnedId != null) {
    state.pinnedId = null; state.targetId = null; state.sticky.clear();
    lastPanel = 0;
  }
}

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
onRevealDismiss(() => closePanel('reveal'));
document.addEventListener('keydown', e => {
  if (!activePanel) return;
  if (e.key === 'Escape') { closePanel(); return; }
  if (e.key !== 'Tab') return;
  const focusables = [...$(activePanel).querySelectorAll('button,a[href],input,select,summary')].filter(n => !n.disabled && n.getClientRects().length);
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
    passWorker.postMessage({requestId,objects:state.catalog.objects.filter(o=>o.stdMag<=4.5 || o.id===objectId),objectId,dateMs:start.getTime(),observer:state.observer,binoculars:state.binoculars,limit:state.limit});
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
$('sel-sky').value = state.lightSky;
$('sel-sky').addEventListener('change', (e) => { state.lightSky = e.target.value; writeText('sky', state.lightSky); updateSkyLimit(state.frame); state.model?.reset?.(); refreshAbove(); });
$('chk-snap').checked = state.snap; sky.snap = state.snap;
$('chk-snap').addEventListener('change', (e) => { state.snap = e.target.checked; writePref('snap', state.snap); sky.snap = state.snap; });
$('chk-bino').checked = state.binoculars;
$('chk-bino').addEventListener('change', (e) => {
  cancelPassSearch();
  state.binoculars = e.target.checked;
  writePref('binoculars', state.binoculars);
  setBinocularMode(state.binoculars);
  updateSkyLimit(state.frame);
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
    `binoculars     ${state.binoculars ? 'on' : 'off'}`,
    `sky            ${state.lightSky}: stars ${state.limit?.stars.toFixed(1)}, satellites ${state.limit?.satellites.toFixed(1)} (bino ${state.limit?.binoculars.toFixed(1)}), ${state.limit?.sb.toFixed(1)} mag/arcsec²`,
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
    await loadConstellations();
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
  const iss=state.byId.get(25544); if (iss) $('start-art').innerHTML=previewArt(iss, 'full', {w:380,h:200});
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
        if(params.has('more')) openDebug();   // the Collection page's settings button lands here
      }
    } catch {}
  } else if (readPref('started', false) || loadSavedLocation()) quickStart(); // anyone who has used the app before
  checkForUpdate(); requestAnimationFrame(tick);
}
boot();
