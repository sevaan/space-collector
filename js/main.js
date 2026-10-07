import { VERSION } from './version.js?v=0.1.214';
import { loadCatalog, frame, look, track, motion, compassPoint, enuFromAzEl, DARK_SUN_ELEVATION, SkyModel, RisingSoon, setBinocularMode, setSkyLimit } from './orbit.js?v=0.1.214';
import { skyLimit, SKIES, DEFAULT_SKY, SB_MIN, SB_MAX, sbOfSky, skyNameFor } from './sky-limit.js?v=0.1.214';
import { conArt } from './con-art.js?v=0.1.214';
import { fetchWeather, tonightSky } from './weather.js?v=0.1.214';
import { CON_FIGURES } from './con-figures.js?v=0.1.214';
import { loadConstellations, CON_STARS, CON_BY_ID, conProgress } from './constellations.js?v=0.1.214';
import { shinyFor, SHINY } from './shiny.js?v=0.1.214';
import { progress as progressOf } from './progress.js?v=0.1.214';
import { activeEvent, nextEvent, passIcs } from './events.js?v=0.1.214';
import { CONSTELLATIONS } from './constellations.js?v=0.1.214';
import { startSensors, hasLiveSensors, trueBasis, basisFromAzEl, pointing, nudgeHeading, getNudge } from './sensors.js?v=0.1.214';
import { SkyView, shortName } from './sky.js?v=0.1.214';
import { loadSky, eqToEnu, solarSystem, milkyWayModel } from './celestial.js?v=0.1.214';
import { addSighting, allSightings, deleteSighting } from './store.js?v=0.1.214';
import { cardArt } from './art.js?v=0.1.214';
import { renderCard, cardLevel, artImage, attachTilt, throwOff, attachFlip } from './card.js?v=0.1.214';
import { applyBack } from './card-backs.js?v=0.1.214';
import { onRevealNews, playReveal, playView, primeReveal, stopReveal, onRevealDismiss } from './reveal.js?v=0.1.214';
import { buildCards, cardKeyFor, stampKeyFor, normalizeSighting, stampsIn, fleetLevel } from './card-model.js?v=0.1.214';
import { collectedDuringPass, collectedTonight, canCapture, nightsIn } from './observation.js?v=0.1.214';
import { naturalTargets, SOLAR_SYSTEM } from './natural.js?v=0.1.214';
import { TIER_INFO } from './rarity.js?v=0.1.214';
import { SETS } from './sets.js?v=0.1.214';
import { TYPE_LABEL, ownerName, orbitStats } from './facts.js?v=0.1.214';
import { loadLore, titleFor, factFor, richText } from './lore.js?v=0.1.214';
import { PlaneTracker, planesAvailable, aircraftName, isHelicopter, planePath } from './planes.js?v=0.1.214';

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
  lightSky: SKIES[readText('sky', DEFAULT_SKY)] ? readText('sky', DEFAULT_SKY) : DEFAULT_SKY, // light pollution where you are (old setting)
  skySb: null, // the sky slider: your sky's own darkness in mag/arcsec² (set below from storage or the old setting)
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
// What the circle highlights (2026-10-06, Sevaan): ticked kinds get the inner circle + Tap to collect; unticked
// ones (stars, by default) just brighten while the outer circle turns orange, and you tap the circle to collect.
const HL_DEFAULT = { satellite: true, rocket: true, planet: true, sun: true, star: false };
const hlOn = (kind) => readPref(`hl-${kind}`, HL_DEFAULT[kind] ?? true);
function hlKind(o) {
  if (!o) return 'satellite';
  if (o.natural) return o.type === 'sun' ? 'sun' : (o.type === 'planet' || o.type === 'moon') ? 'planet' : 'star';
  return o.type === 'rocket-body' || o.type === 'debris' ? 'rocket' : 'satellite';
}
const isQuiet = (o) => !!o && !hlOn(hlKind(o));
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
    setTimeout(() => { el.remove(); toastBusy = false; pumpToasts(); }, 320);
  }, t.ms);
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function previewArt(obj, size, fallback) {
  // Same picture as the card (js/card.js): constellation stars get their chart with the star ringed.
  if (obj.natural === 'constellation' && !obj.system) return conArt(obj.data, null, CON_FIGURES.has(obj.con) ? { figure: `assets/art/con/${obj.con}.webp` } : {});
  if (obj.con && !obj.skyName && CON_BY_ID.get(obj.con)) return conArt(CON_BY_ID.get(obj.con).data, obj.hip, {});
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
  state.limit = skyLimit({ sb: state.skySb, sunEl: f?.sunEl ?? -90, moonEl, moonIllum: moon?.illum ?? 0 });
  renderSkySlider();
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
  if (state.preview && state.followPreview && state.pinnedId && state.drag.on) { // follow only steers the drag view, never live sensors
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
// First night out: until you've collected anything, a line under the circle says what to do. It goes once
// something is lined up, after 40 s, or for good once you own a card.
let hintSince = 0, hintOff = false;
function firstNightHint(target, plane, t) {
  const g = $('guidance');
  if (hintOff || target || plane || state.preview) { if (g.classList.contains('first')) { g.hidden = true; g.classList.remove('first'); } return; }
  if (state.sightings.some((s) => !s.sim)) { hintOff = true; return; }
  hintSince ||= t;
  if (t - hintSince > 40000) { hintOff = true; g.hidden = true; g.classList.remove('first'); return; }
  if (!g.classList.contains('first')) { g.classList.add('first'); g.textContent = 'Sweep the sky slowly. Bright, steadily moving lights are satellites: line one up in the circle.'; }
  g.hidden = false; // renderTarget hides #guidance whenever nothing is lined up; keep the hint up
}
// A soft tick when the circle locks onto a target (sound stands in for haptics on the web).
function snapTick() {
  if (!audio) return;
  try { const t = audio.currentTime, o = audio.createOscillator(), g = audio.createGain(); o.type = 'sine'; o.frequency.value = 1760; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.045); o.connect(g).connect(audio.destination); o.start(t); o.stop(t + 0.06); } catch {}
}
let uiSafeTop = 202, uiSafeBottom = 320, uiCenterY; // uiCenterY: the reticle's fixed height (radar and nav only)
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
  // Settling (2026-10-06): right after opening, the view points wherever the default drag view does until the
  // motion sensors report, so whatever sat there flashed up as a mini card and vanished. Show no target (and
  // no edge arrow) until the sensors have been live for a moment, unless you're in drag mode or pinned something.
  if (hasLiveSensors()) state.liveSince ??= t; else if (!state.drag.on) state.liveSince = null;
  if (!state.drag.on && !state.pinnedId && (state.liveSince == null || t - state.liveSince < 700)) target = null;
  // "Show me" from Tonight (2026-10-06): until the pass begins, the target is the spot where it will appear,
  // so the turn arrows and the edge pointer lead you there; once it's visible it's tracked as normal.
  state.guideRise = null;
  const gp = state.guidePass;
  if (gp && (state.pinnedId !== gp.id || d.getTime() > gp.end + 120000)) state.guidePass = null;
  else if (gp && target && target.obj.id === gp.id && d.getTime() < gp.start) {
    const el = Math.max(4, gp.riseEl ?? 10), look = { ...target.look, az: gp.riseAz, el, visible: false };
    target.look = look; target.angCos = dot(enuFromAzEl(gp.riseAz, el), basis.back); target.trail = null;
    state.guideRise = { start: gp.start, aligned: target.angCos > Math.cos((sky.reticleDeg + 4) * RAD) };
  }
  state.activeTarget = target;
  // Locked on = the target is inside the circle right now and can be collected. The ring shrinks onto
  // it, and the gold circle / Collect button use the same answer.
  state.lockedOn = !!target && target.angCos > Math.cos(sky.reticleDeg * RAD) && (target.look.visible || state.captureAny);
  autoLog(target, d, t);
  const plane = findPlane(basis, t);

  sky.draw(basis, items, {
    showDim: state.showDim,
    sky: state.showStars ? state.skyEnu : null,
    starLimit: state.limit?.stars, // background stars follow the sky slider too
    sunEl: state.frame?.sunEl ?? -90, // day/twilight tone (js/sky.js dayF)
    ...(document.body.classList.toggle('day', (state.frame?.sunEl ?? -90) > -2) ? {} : {}),
    weather: state.weather?.now ?? null,
    ghosts: state.guideRise && state.activeTarget ? [{ enu: enuFromAzEl(state.activeTarget.look.az, state.activeTarget.look.el), name: 'Appears here', note: fmtTime(state.guideRise.start) }] : dayGhosts(),
    bodies: state.showStars ? state.bodies : null,
    milky: state.showStars ? state.milkyEnu : null,
    lines: state.showLines,
    targetId: state.targetId,
    lockedOn: state.lockedOn,
    naturalTarget: target?.obj.natural ? target.look.enu : null,
    naturalTargetName: target?.obj.natural ? label(target.obj) : null,
    quietTarget: isQuiet(target?.obj), // no inner circle or snap; the object brightens instead
    planes: state.planeItems,
    planeHit: plane?.plane.hex ?? null,
    planeTrail: plane ? planePath(plane.plane, state.observer) : null, // where the lined-up plane has been and is going
    newFind: !!state.newFind,
    landscape: !!state.landscape,
    rising: state.rising?.list(d).map((e) => ({ az: e.az, name: label(e.obj), mins: Math.max(1, Math.round((e.at - d.getTime()) / 60000)) })),
    time: t,
    safeTop: uiSafeTop,
    safeBottom: uiSafeBottom,
    centerY: uiCenterY,
  });

  updateCompass(basis);
  if (t - lastChip > 1000) { lastChip = t; requestTonight(); requestWeather(); updateNextPassChip(); updateEventBanner(); checkCompass(t); }
  placeDiscover();
  if (t - lastPanel > 250 || target?.obj.id !== shownTargetId || state.lockedOn !== lastLocked) {
    if (state.lockedOn && !lastLocked) snapTick(); // the circle just caught something
    lastLocked = state.lockedOn; renderTarget(target, d); measureSkySpace(); lastPanel = t; }
  firstNightHint(target, plane, t);
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
  const navInset = window.innerHeight - Math.min($('nav').getBoundingClientRect().top, $('skybar').getBoundingClientRect().top || Infinity) + 20; // the sky slider sits above the switcher
  uiSafeBottom = box.hidden ? navInset : Math.max(navInset, window.innerHeight - rect.top + 34);
  // The reticle stays put when the info card or a banner comes and goes (2026-10-06, Sevaan: it jumped).
  uiCenterY = window.innerHeight / 2; // the middle of the phone (2026-10-06, Sevaan), not of the gap between radar and nav
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
  const gr = state.guideRise;
  if (gr) {
    const mins = Math.max(0, Math.round((gr.start - now().getTime()) / 60000));
    const when = `${fmtTime(gr.start)}${mins >= 1 ? ` (in ${mins} min)` : ''}`;
    if (gr.aligned) return `You're facing the right way · it appears here at ${when}`;
  }
  if (l.el < 0) return 'This pass has ended';
  if (!l.visible && !state.captureAny && !gr) return 'Not visible right now';
  const currentAz = state.basis ? (Math.atan2(state.basis.back[0], state.basis.back[1]) / RAD + 360) % 360 : state.drag.az;
  const currentEl = state.basis ? Math.asin(state.basis.back[2]) / RAD : state.drag.el;
  const turn = ((l.az - currentAz + 540) % 360) - 180;
  const move = Math.abs(turn) > 8 ? (turn > 0 ? 'Turn right →' : '← Turn left') : l.el > currentEl ? '↑ Raise your phone' : '↓ Lower your phone';
  return gr ? `${move} · appears ${Math.round(l.el)}° up in the ${compassPoint(l.az)} at ${fmtTime(gr.start)}` : `${move} · ${Math.round(l.el)}° up in the ${compassPoint(l.az)}`;
}
const ICON_TARGET = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none"/><path d="M12 1.8v3.4M12 18.8v3.4M1.8 12h3.4M18.8 12h3.4"/></svg>';
const ICON_BELL = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path class="fillme" d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.6 2H4.4z"/><path d="M10 20.6a2.2 2.2 0 0 0 4 0" stroke-linecap="round"/></svg>';
const reminded = new Set(); // reminders set this session, so the bell stays filled
// Steer to something that's up now (the tour's first catch, and Show me for passes already under way): pin it,
// point the drag view at it if there are no sensors, and say where to look; the turn hint and edge arrow follow.
function guideTo(obj, l, hint = '') {
  cancelPassSearch();
  state.pinnedId = obj.id; state.targetId = obj.id; state.sticky.clear(); state.guidePass = null;
  if (state.drag.on || !hasLiveSensors()) { state.drag.on = true; state.drag.az = (l.az + 40) % 360; state.drag.el = Math.max(10, l.el - 10); } // close by, so the arrow has something to show
  toast(`<span class="big-line">${escapeHtml(label(obj))}</span>${escapeHtml(hint || `Up now, ${Math.round(l.el)}° up in the ${compassPoint(l.az)}.`)} Follow the arrow.`, 5000);
}
// Tonight → "Show me": pin the object and steer to it (or to where it will rise).
function showMePass(p) {
  cancelPassSearch();
  state.pinnedId = p.obj.id; state.targetId = p.obj.id; state.sticky.clear();
  state.guidePass = { id: p.obj.id, start: p.start, end: p.end, riseAz: p.riseAz, riseEl: p.riseEl };
  if (state.drag.on || !hasLiveSensors()) { state.drag.on = true; state.drag.az = p.riseAz; state.drag.el = Math.max(4, p.riseEl ?? 10); }
  closePanel('visible');
  const mins = Math.round((p.start - now().getTime()) / 60000);
  toast(`<span class="big-line">${escapeHtml(label(p.obj))}</span>${mins > 0 ? `Appears in the ${compassPoint(p.riseAz)} at ${fmtTime(p.start)}. Follow the arrow to where it will come up.` : `Up now, highest ${p.peakEl}° in the ${compassPoint(p.peakAz)}. Follow the arrow.`}`, 5000);
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

  if (o.id === state.tourCatchId || (isNewFind(o) && !collected)) { // the tour's catch always looks like a new find
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
      $('d-cta').hidden = isQuiet(o); disc.classList.toggle('quiet', isQuiet(o));
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
  if (eligible || collected) { meta.className = ''; meta.textContent = `${tier.label} · ${brightnessWord(l.mag)}`; }
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
  if (!o || o.id === state.tourCatchId || !state.lockedOn || !(target.look.visible || state.captureAny) || state.captureBusy || isNewFind(o) || !ownsCard(o)) { autoHold = null; return; }
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
  // A star's constellation, or the Solar System for the Moon and planets: progress toward the gold card.
  const conCard = (model.con && CON_BY_ID.get(model.con)) || (['moon', 'planet'].includes(model.type) ? SOLAR_SYSTEM : null);
  const con = conCard && sightings.length === 1 ? { name: conCard.name, ...conProgress(conCard, ownedCardKeys()) } : null;
  const gain = progressGain(sightings[0]); announceProgress(gain);
  playReveal({ card, o: model, seen: sightings.length, fleet, progress, collected, con, xp: gain.xp, shiny: sightings[0]?.shiny ? SHINY[sightings[0].shiny] : null, origin: { x: sky.ring?.x ?? sky.cx, y: sky.ring?.y ?? sky.cy } });
}
// The tour's catch when you already own it (replaying the tour): the same sealed-card reveal as a first catch,
// with no sighting saved, so the tour feels the same every time.
function tourReveal(obj) {
  const model = cardModel(obj), key = cardKeyFor(obj);
  const sightings = state.sightings.filter(s => !s.sim && s.cardKey === key);
  const card = renderCard(model, { sightings, seenMembers: new Set(sightings.map(s => s.objectId)).size });
  $('reveal-view').href = `cards.html#${encodeURIComponent(key)}`;
  openPanel('reveal');
  state.tourRevealed = true;
  playReveal({ card, o: model, seen: 1, progress: { level: cardLevel(sightings), before: 'none', nights: 1 }, collected: 2, origin: { x: sky.ring?.x ?? sky.cx, y: sky.ring?.y ?? sky.cy } });
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
// A Tonight row's card: the real card if you own it, otherwise a preview (art and story shown).
function showTonightCard(obj, from, eyebrow) {
  const model = cardModel(obj), key = cardKeyFor(obj);
  const sightings = state.sightings.filter(s => !s.sim && s.cardKey === key);
  const card = renderCard(model, sightings.length ? { sightings, seenMembers: new Set(sightings.map(s => s.objectId)).size } : { preview: true });
  $('reveal-view').href = `cards.html#${encodeURIComponent(key)}`;
  closePanel('visible'); openPanel('reveal');
  playView({ card, o: model, from, eyebrow });
}
async function capture(obj) {
  if (state.captureBusy) return;
  const d = now(), f = frame(d, state.observer);
  const l = obj.natural ? state.naturals?.find((n) => n.obj.id === obj.id)?.look : look(obj, f);
  const basis = currentBasis();
  const aligned = l && dot(enuFromAzEl(l.az, l.el), basis.back) > Math.cos(sky.reticleDeg * RAD);
  if (!l || !canCapture({ visible: l.visible, aligned, practice: state.captureAny, allowAny: state.captureAny })) { toast('Line up the object while it is visible to capture it.'); return; }
  if (obj.id === state.tourCatchId && !isNewFind(obj)) { tourReveal(obj); return; } // tour replay: the full reveal, nothing logged
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
  return progressOf(list, info, { constellations: [...CONSTELLATIONS, SOLAR_SYSTEM].map((c) => ({ id: c.con, stars: c.stars, zodiac: c.zodiac, system: !!c.system })), now: now().getTime() });
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
  if (!force && T && now().getTime() - T.startMs < 20 * 60000 && T.sb === state.skySb && T.lat === state.observer.lat && T.lon === state.observer.lon && T.bino === state.binoculars) return;
  tonightBusy = true;
  const requestId = ++tonightReq, startMs = now().getTime();
  try {
    tonightWorker ??= new Worker(new URL(`./tonight-worker.js?v=${VERSION}`, import.meta.url), { type: 'module' });
    tonightWorker.onmessage = ({ data }) => {
      if (data.requestId !== tonightReq) return;
      tonightBusy = false;
      if (data.error) return;
      state.tonight = { ...data, sb: state.skySb, lat: state.observer.lat, lon: state.observer.lon, bino: state.binoculars };
      if (!$('vtab-tonight').hidden) renderTonight();
      lastChip = 0;
    };
    tonightWorker.onerror = () => { tonightBusy = false; };
    const base = skyLimit({ sb: state.skySb }), faintest = (state.binoculars ? base.binoculars : base.satellites) + 0.5;
    const objects = state.catalog.objects.filter((o) => o.stdMag + 5 * Math.log10(Math.max(o.perigee ?? 400, 200) / 1000) <= faintest);
    tonightWorker.postMessage({ requestId, objects, observer: state.observer, startMs, sb: state.skySb, binoculars: state.binoculars });
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
  const ev = activeEvent(t0) ?? nextEvent(t0), evLine = ev ? (t0 >= ev.start ? `<br><b>${ev.name}</b> meteor shower tonight (${ev.rate}).` : `<br>Next event: <b>${ev.name}</b> meteor shower, ${new Date(ev.start + 30 * 3600e3).toLocaleDateString([], { month: 'short', day: 'numeric' })}.`) : '';
  const wxT = tonightWeather(), wxLine = wxT ? `<br>Sky: <b>${escapeHtml(wxT.line)}</b>${!wxT.ok && wxT.nextClear ? `. Next clear night: <b>${new Date(wxT.nextClear).toLocaleDateString([], { weekday: 'long' })}</b>.` : '.'}` : '';
  $('tonight-summary').innerHTML = (wins.length
    ? `Satellites are visible ${wins.slice(0, 3).map((w) => `<b>${fmtTime(Math.max(w.s, t0))}–${fmtTime(w.e)}</b>`).join(' and ')}. Busiest around <b>${fmtTime(peak[0])}</b>, up to ${peak[1]} at once.`
    : `No satellites bright enough for your sky until dawn. Slide the sky darker if you can see more stars than the screen, or try binocular mode.`) + wxLine + evLine;
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
    // Icon actions (2026-10-06): a target (go to it in Explore) and a bell (calendar reminder; filled once set).
    const mins = Math.round((p.start - t0) / 60000), soon = p.start <= t0 ? 'up now' : mins < 60 ? `in ${mins} min` : '';
    const belled = reminded.has(`${p.obj.id}@${p.start}`);
    row.innerHTML = `<span class="time">${fmtTime(p.start)}${soon ? `<small>${soon}</small>` : ''}</span>
      <span class="t-main"><span class="name"><span class="dot"></span>${escapeHtml(label(p.obj))}${p.fresh ? '<span class="new">NEW</span>' : ''}</span>
      <span class="meta">${tier.label} · ${brightnessWord(p.mag)} · ${compassPoint(p.riseAz)} → ${p.peakEl}° ${compassPoint(p.peakAz)}</span></span>
      <span class="t-acts"><button class="ic showme" type="button" aria-label="Show me in the sky">${ICON_TARGET}</button>${p.start > t0 + 10 * 60000 ? `<button class="ic remind${belled ? ' on' : ''}" type="button" aria-label="${belled ? 'Reminder set' : 'Remind me'}">${ICON_BELL}</button>` : '<span class="ic ic-none" aria-hidden="true"></span>'}</span>`; // keep the columns lined up when it's too soon to remind
    row.querySelector('.remind')?.addEventListener('click', (e) => { remindPass(p); reminded.add(`${p.obj.id}@${p.start}`); e.currentTarget.classList.add('on'); e.currentTarget.setAttribute('aria-label', 'Reminder set'); });
    row.querySelector('.showme').addEventListener('click', () => showMePass(p));
    // Tap the row to see the card you'd be waiting up for (owned cards open as they are; others as a preview).
    row.classList.add('tappable');
    row.addEventListener('click', (e) => { if (e.target.closest('.remind, .showme')) return; const from = row.querySelector('.name').getBoundingClientRect(); showTonightCard(p.obj, from, `TONIGHT · ${fmtTime(p.start)}`); });
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
    for (const b of bodies) if (b.kind === 'planet' && el(b.v) > 10 && (b.mag <= 3 || b.mag <= (state.limit?.stars ?? 6)) && !planets.has(b.name)) planets.set(b.name, t);
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
// ---------- daytime (2026-10-06): the sky as it is, plus tonight ----------
// Weather (js/weather.js) for the sky's clouds and the Tonight line; refreshed every half hour and when you move.
let weatherAt = 0, weatherKey = '';
function requestWeather() {
  const o = state.observer; if (!o) return;
  const key = `${o.lat.toFixed(2)},${o.lon.toFixed(2)}`;
  if (key === weatherKey && Date.now() - weatherAt < 30 * 60e3) return;
  weatherKey = key; weatherAt = Date.now();
  fetchWeather(o.lat, o.lon).then((w) => { state.weather = w; updateNextPassChip(); }).catch(() => {});
}
// Tonight's sky in words, from the forecast and tonight's dusk/dawn: { ok, line, nextClear } or null.
function tonightWeather() {
  const T = state.tonight; if (!state.weather || !T) return null;
  return tonightSky(state.weather, T.dusk ?? T.startMs, T.dawn ?? (T.startMs + 12 * 3600e3), fmtTime);
}
const isDay = () => (state.frame?.sunEl ?? -90) > -6;
// Ghost markers by day: tonight's best passes (and the ISS) wherever they are right now, so you can watch them
// cross the sky you'll see them in later. A handful, each tied to a Tonight row.
function dayGhosts() {
  if (!isDay() || !state.tonight) return null;
  const t0 = now().getTime(), passes = tonightPasses(state.tonight, t0).slice(0, 4);
  const want = new Map(passes.map((p) => [p.obj.id, p])); if (!want.has(25544)) want.set(25544, null);
  const out = [];
  for (const a of state.items ?? []) {
    if (!want.has(a.obj.id) || a.look.el < 3 || a.look.visible) continue;
    const az = a.look.az * RAD, el = a.look.el * RAD, p = want.get(a.obj.id);
    out.push({ enu: [Math.sin(az) * Math.cos(el), Math.cos(az) * Math.cos(el), Math.sin(el)], name: label(a.obj), note: p ? `you'll see it ${fmtTime(p.start)}` : `${Math.round(a.look.rangeKm ?? 0)} km away · up there now` });
  }
  return out;
}
// Compass trouble (2026-10-06, Sevaan: the sky spun until the compass sorted itself out). iOS reports how unsure its
// compass is (webkitCompassAccuracy, ± degrees; -1 = not calibrated), and js/sensors.js notices when north has to
// jump. Either way, ask for a figure-8 — at most once every few minutes, and only while using motion.
let compassAskAt = -Infinity;
// A little card-style illustration for the toast: a phone tracing a dashed figure-8 around a compass rose,
// the needle swinging and settling on N. Navy disc, cream line work, burnt-orange accents (the card palette).
const FIG8_ART = `<svg viewBox="0 0 72 72" width="64" height="64" aria-hidden="true">
  <circle cx="36" cy="36" r="34" fill="#0a1424" stroke="#bcb585" stroke-opacity=".55"/>
  <circle cx="36" cy="36" r="30" fill="none" stroke="#627a8b" stroke-opacity=".5" stroke-dasharray="1 3"/>
  <path id="f8" d="M36 36 C46 24 60 26 60 36 C60 46 46 48 36 36 C26 24 12 26 12 36 C12 46 26 48 36 36 Z" fill="none" stroke="#fa8127" stroke-width="1.6" stroke-dasharray="3 3" stroke-linecap="round"/>
  <g><g class="f8-needle" transform="rotate(40 36 36)"><path d="M36 22 L39 36 L36 40 L33 36 Z" fill="#fa8127"/><path d="M36 50 L39 36 L36 32 L33 36 Z" fill="#fff2b3" opacity=".7"/>
    <animateTransform attributeName="transform" type="rotate" values="40 36 36;-25 36 36;12 36 36;-5 36 36;0 36 36;0 36 36" keyTimes="0;.25;.5;.7;.85;1" dur="3s" repeatCount="indefinite"/></g>
    <circle cx="36" cy="36" r="2" fill="#080e1a" stroke="#fff2b3"/></g>
  <text x="36" y="13" fill="#fa8127" font-family="SC Label, Arial Narrow" font-size="7" text-anchor="middle" letter-spacing="1">N</text>
  <g><rect x="-4.5" y="-7.5" width="9" height="15" rx="2" fill="#080e1a" stroke="#fff2b3" stroke-width="1.4"/><circle cx="0" cy="4" r="1" fill="#fff2b3"/>
    <animateMotion dur="3s" repeatCount="indefinite" rotate="auto"><mpath href="#f8"/></animateMotion></g>
</svg>`;
function checkCompass(t) {
  if (state.drag.on || !hasLiveSensors() || pointing.source !== 'ios') return;
  const acc = pointing.compassAccuracy, jumped = t - pointing.compassJumpAt < 2000;
  const bad = acc === -1 || acc > 35 || jumped || pointing.compassDoubt > 0.6;
  if (!bad || t - compassAskAt < 4 * 60e3) return;
  compassAskAt = t;
  toast(`<span class="tk-art">${FIG8_ART}</span><span class="tk-text"><span class="big-line">Compass needs a nudge</span>Wave the phone in a slow figure-8 for a few seconds, away from metal, magnets and cars.</span>`, 7000);
}
// The chip in the upper right (2026-10-06, Sevaan: out of the way of the sky labels): label / name / detail ›.
// Compact (2026-10-06): a short detail rides on the label line ('NEXT UP · 9:44 PM ›' over the name); a long one gets its own line.
// One line (2026-10-06): 'NEXT UP · COSMOS 2082 · 9:44 PM ›', one size, the name bold orange (it gives way with … first).
const npChip = (k, n, m) => `<span class="np-k">${escapeHtml(k)} ·</span><b class="np-n">${escapeHtml(n)}</b><span class="np-m">${m ? `· ${escapeHtml(m)} ` : ''}›</span>`;
function updateNextPassChip() {
  const chip = $('nextpass');
  const lit = state.items?.some((i) => i.look.visible);
  const T = state.tonight, t0 = now().getTime();
  if (lit || !T || (state.timeOffsetMs && !isDay())) { if (!chip.hidden) chip.hidden = true; return; }
  const next = tonightPasses(T, t0).find((p) => p.start > t0);
  const win = tonightWindows(T).find((w) => w.s > t0);
  const dark = T.curve.length && t0 >= T.curve[0][0];
  // By day: one honest line about tonight (dark when, best pass, the sky), tap for the whole plan.
  if (isDay()) {
    const wx = tonightWeather(), best = tonightPasses(T, t0).find((p) => p.fresh) ?? next;
    const dusk = T.dusk ? fmtTime(T.dusk) : null;
    chip.innerHTML = wx && !wx.ok
      ? npChip('Not tonight', wx.line, wx.nextClear ? `Next clear ${new Date(wx.nextClear).toLocaleDateString([], { weekday: 'long' })}` : 'See the plan')
      : npChip(`Tonight${dusk ? ` from ${dusk}` : ''}`, best ? label(best.obj) : 'See the plan', best ? `${fmtTime(best.start)}${wx ? ` · ${wx.line}` : ''}` : (wx?.line ?? ''));
    chip.hidden = false; return;
  }
  chip.innerHTML = next ? npChip(dark ? 'Next up' : `From ${fmtTime(win?.s ?? next.start)}`, label(next.obj), fmtTime(next.start))
    : win ? npChip('Nothing lit right now', `Back at ${fmtTime(win.s)}`, 'See the plan') : npChip('No more satellites', 'Tonight', 'See what else is up');
  chip.hidden = false;
}
$('nextpass').addEventListener('click', () => { showVTab('tonight'); openPanel('visible'); });
// Meteor shower events (js/events.js): a banner while one is on; catching anything earns its badge.
function updateEventBanner() {
  const e = activeEvent(now().getTime()), el = $('event-banner');
  if (!e) { if (!el.hidden) el.hidden = true; return; }
  const got = state.sightings.some((s) => !s.sim && s.time >= e.start && s.time <= e.end);
  const html = `<b>${escapeHtml(e.name)}</b> meteor shower · ${got ? 'badge earned ✓' : 'catch anything to earn the badge'}`;
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
  // A manual nudge is you steering the clock, not a pass preview: stop following the pinned object, or the
  // view keeps tracking it across the sky with the phone still (2026-10-06).
  state.followPreview = false; state.preview = false;
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
      $('next-pass-info').textContent=`Showing ${label(obj)}'s pass at ${new Date(pass.dateMs).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}. Tap Now to come back.`;
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
// ---------- the sky slider (2026-10-06): an "exposure" control above the switcher ----------
// Drag until the stars and satellites on screen match what you can actually see; it's saved for next time.
// It sets your sky's own darkness; twilight and the Moon still dim things on top of it automatically.
{ const saved = Number(readText('skySb', '')); state.skySb = saved >= SB_MIN && saved <= SB_MAX ? saved : sbOfSky(state.lightSky); }
function renderSkySlider() {
  const r = $('sky-range'); if (!r || !state.limit) return;
  if (document.activeElement !== r) r.value = String(state.skySb);
  const pct = (state.skySb - SB_MIN) / (SB_MAX - SB_MIN) * 100;
  r.style.setProperty('--p', `${pct.toFixed(1)}%`);
  $('sky-name').textContent = skyNameFor(state.skySb);
  $('sky-mag').textContent = `stars to ${state.limit.stars.toFixed(1)}`;
}
let skyDragAt = 0;
$('sky-range').addEventListener('input', (e) => {
  state.skySb = Number(e.target.value);
  updateSkyLimit(state.frame);
  const t = performance.now(); if (t - skyDragAt > 120) { skyDragAt = t; refreshAbove(); } // satellites follow the slider as you drag
  $('skybar').classList.add('dragging');
});
$('sky-range').addEventListener('change', () => {
  writeText('skySb', state.skySb.toFixed(2));
  $('skybar').classList.remove('dragging');
  state.model?.reset?.(); refreshAbove(); requestTonight(true);
});
for (const ev of ['pointerdown', 'touchstart']) $('skybar').addEventListener(ev, (e) => e.stopPropagation(), { passive: true }); // never drags the sky
// Grab anywhere on the bar: the knob jumps to the finger and follows it (the native control only grabs on the knob).
{
  const bar = $('skybar'), r = $('sky-range'); let grab = null;
  const valueAt = (x) => { const b = r.getBoundingClientRect(), f = Math.max(0, Math.min(1, (x - b.left) / b.width)); return SB_MIN + f * (SB_MAX - SB_MIN); };
  bar.addEventListener('pointerdown', (e) => { if (e.target === r) return; grab = e.pointerId; bar.setPointerCapture(e.pointerId); r.value = valueAt(e.clientX).toFixed(2); r.dispatchEvent(new Event('input', { bubbles: true })); });
  bar.addEventListener('pointermove', (e) => { if (e.pointerId !== grab) return; r.value = valueAt(e.clientX).toFixed(2); r.dispatchEvent(new Event('input', { bubbles: true })); });
  const end = (e) => { if (e.pointerId !== grab) return; grab = null; r.dispatchEvent(new Event('change', { bubbles: true })); };
  bar.addEventListener('pointerup', end); bar.addEventListener('pointercancel', end);
}
$('chk-snap').checked = state.snap; sky.snap = state.snap;
document.querySelectorAll('[data-hl]').forEach((c) => { c.checked = hlOn(c.dataset.hl); c.addEventListener('change', () => { writePref(`hl-${c.dataset.hl}`, c.checked); lastLocked = !state.lockedOn; }); });
// Testing tools: run the whole first-run experience again, from the sealed welcome card, with motion and
// location switched back off so the permission steps are real steps again (the browser won't re-prompt once
// granted, but the app goes back to drag view and the example location until you allow them).
$('btn-replay-setup')?.addEventListener('click', () => {
  closePanel('debug');
  state.drag.on = true; $('chk-drag').checked = true; state.liveSince = null;
  state.locationStatus = 'example'; renderLocation();
  state.pinnedId = null; state.targetId = null; state.guidePass = null;
  wcCard = null; wcFlipped = false; wcReplay = true;
  $('wc-after').hidden = true; $('start').classList.remove('wc-open'); $('btn-start').disabled = false;
  renderStartHand();
  $('hud').hidden = true; $('start').hidden = false;
});
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
    `sky            ${skyNameFor(state.skySb)} (${state.skySb.toFixed(2)} mag/arcsec²): stars ${state.limit?.stars.toFixed(1)}, satellites ${state.limit?.satellites.toFixed(1)} (bino ${state.limit?.binoculars.toFixed(1)}), ${state.limit?.sb.toFixed(1)} mag/arcsec²`,
  ].join('\n');
}

// ---------- start and return from the collection ----------
function enterSky() {
  state.started=true; $('start').hidden=true; $('hud').hidden=false;
  if (!state.storageReady) toast('Browser storage is unavailable. Captures may not save.',5000);
  refreshAbove();
}
$('btn-start').addEventListener('click', () => {
  if (!state.catalog) { location.reload(); return; }
  welcomeGo();
});

// ---------- guided setup as cards (2026-10-06, design/tour-cards.html) ----------
// Each step is the top of a card laid over the live sky (the next ones stacked under it). Choosing throws the
// card off sideways and the sky reacts: location lines it up, motion makes it follow the phone. Then the app
// steers you to something certain to be up for a real first catch, and closes with "Tonight looks good".
let onboarding = null;
const OB_ART = {
  loc: '<svg viewBox="0 0 300 120" aria-hidden="true"><g fill="none" stroke="#627a8b" stroke-width="1"><ellipse cx="150" cy="78" rx="120" ry="26"/><ellipse cx="150" cy="78" rx="70" ry="15" stroke-dasharray="3 4"/></g><path d="M150 30c-12 0-21 9-21 21 0 16 21 34 21 34s21-18 21-34c0-12-9-21-21-21z" fill="#fa8127"/><circle cx="150" cy="51" r="7" fill="#080e1a"/><g fill="#fff2b3"><circle cx="60" cy="24" r="1.5"/><circle cx="238" cy="18" r="2"/><circle cx="262" cy="46" r="1.2"/><circle cx="40" cy="58" r="1.2"/></g></svg>',
  motion: '<svg viewBox="0 0 300 120" aria-hidden="true"><g transform="translate(150 62)"><rect x="-22" y="-40" width="44" height="80" rx="9" fill="#0c1725" stroke="#fff2b3" stroke-width="2"/><circle r="12" fill="none" stroke="#fa8127" stroke-width="2"/><circle r="2.4" fill="#fa8127"/></g><g fill="none" stroke="#fa8127" stroke-width="1.6" stroke-linecap="round"><path d="M92 40 Q70 62 92 84"/><path d="M78 30 Q48 62 78 94" opacity=".5"/><path d="M208 40 Q230 62 208 84"/><path d="M222 30 Q252 62 222 94" opacity=".5"/></g></svg>',
  sky: '<svg viewBox="0 0 300 120" aria-hidden="true"><rect x="40" y="58" width="220" height="4" rx="2" fill="#627a8b55"/><rect x="40" y="58" width="132" height="4" rx="2" fill="#fa8127"/><circle cx="172" cy="60" r="11" fill="#080e1a" stroke="#fa8127" stroke-width="2.5"/><g fill="#fff2b3"><circle cx="70" cy="28" r="1.2" opacity=".4"/><circle cx="110" cy="22" r="1.6" opacity=".6"/><circle cx="160" cy="30" r="2" opacity=".8"/><circle cx="210" cy="20" r="2.4"/><circle cx="246" cy="34" r="2.8"/></g><text x="40" y="92" fill="#bdbea9" font-family="SC Label, Arial Narrow" font-size="11" letter-spacing="2">BRIGHT</text><text x="260" y="92" fill="#bdbea9" font-family="SC Label, Arial Narrow" font-size="11" letter-spacing="2" text-anchor="end">DARK</text></svg>',
  catch: '<svg viewBox="0 0 300 120" aria-hidden="true"><circle cx="150" cy="60" r="34" fill="none" stroke="#fa8127" stroke-width="2"/><circle cx="150" cy="60" r="5" fill="#fff2b3"/><circle cx="150" cy="60" r="16" fill="#fff2b3" opacity=".18"/></svg>',
};
// steps: [{ tier, title, sub: [left, right], art, text, yes, no, gold }]; shows steps[k] with the rest stacked under it.
function obCard(steps, k) {
  const deck = $('ob-deck'); deck.replaceChildren();
  [...$('ob-pips').children].forEach((p, i) => { p.className = i < k ? 'done' : i === k ? 'on' : ''; });
  const make = (s) => { const el = document.createElement('div'); el.className = `tc${s.gold ? ' gold' : ''}`;
    el.innerHTML = `<div class="in"><div class="bar"><span>Space Collector</span><span class="tier">◆ ${escapeHtml(s.tier)}</span></div><h3>${escapeHtml(s.title)}</h3><div class="sub"><span>${escapeHtml(s.sub[0])}</span><span>${escapeHtml(s.sub[1])}</span></div><div class="art">${s.art}</div><p>${escapeHtml(s.text)}</p><div class="acts">${s.no ? `<button class="no" type="button">${escapeHtml(s.no)}</button>` : ''}<button class="yes" type="button">${escapeHtml(s.yes)}</button></div></div><div class="shine"></div>`;
    return el; };
  const cards = steps.slice(k, k + 3).map(make);
  cards.slice().reverse().forEach((c) => deck.append(c));
  cards[1]?.classList.add('under'); cards[2]?.classList.add('under2');
  const top = cards[0];
  if (k === 0) top.animate([{ transform: 'translateY(105%)' }, { transform: 'translateY(0)' }], { duration: 650, easing: 'cubic-bezier(.2,.9,.3,1)' });
  top.addEventListener('pointermove', (e) => { const r = top.getBoundingClientRect(); top.style.setProperty('--bgx', `${(30 + (e.clientX - r.left) / r.width * 40).toFixed(1)}%`); top.style.setProperty('--o', '1'); });
  top.addEventListener('pointerleave', () => top.style.setProperty('--o', '0'));
  return new Promise((resolve) => {
    onboarding = { resolve };
    const go = (yes) => { top.style.setProperty('--x', `${yes ? 130 : -130}vw`); top.style.setProperty('--r', `${yes ? 22 : -22}deg`); top.classList.add('gone'); setTimeout(() => resolve(yes), 300); };
    top.querySelector('.yes').addEventListener('click', () => { steps[k].onYes?.(); go(true); }); // onYes runs inside the tap (iOS permissions)
    top.querySelector('.no')?.addEventListener('click', () => go(false));
  });
}
function obReact(line) {
  let b = document.querySelector('.ob-bloom'); if (!b) { b = document.createElement('div'); b.className = 'ob-bloom'; document.body.append(b); }
  b.classList.remove('go'); void b.offsetWidth; b.classList.add('go');
  const l = $('ob-lock'); l.textContent = line; l.classList.add('on'); setTimeout(() => l.classList.remove('on'), 2200);
}
async function runOnboarding(force = false) {
  if (!force && state.sightings.some((x) => !x.sim)) { await enableMotion(); requestLocation(); return; } // not a first run
  const ob = $('onboard'); ob.hidden = false; $('ob-done').hidden = true; $('ob-pips').hidden = false; state.pinnedId = null; state.targetId = null;
  let skipped = false; $('ob-skip').onclick = () => { skipped = true; onboarding?.resolve(false); };
  document.body.classList.add('ob-tour');
  let motionAsk = null;
  const night = (state.frame?.sunEl ?? -90) < -6;
  const steps = [
    { tier: 'Step 1 of 3', title: 'Line up your sky', sub: ['Navigation', 'Location'], art: OB_ART.loc, text: 'Your location sets which stars and satellites are overhead. It stays on this phone.', yes: 'Allow', no: 'Not now' },
    { tier: 'Step 2 of 3', title: "Point, don't scroll", sub: ['Gyroscope', 'Motion'], art: OB_ART.motion, text: "With motion on, the circle follows the phone. Whatever sits in the circle is what you're looking at.", yes: 'Allow motion', no: 'Use a finger', onYes: () => { motionAsk = enableMotion(); } },
    { tier: 'Step 3 of 3', title: 'Match your sky', sub: ['Calibration', night ? 'Tonight' : 'After dark'], art: OB_ART.sky, text: night ? 'Look up. Drag the slider above Explore until the screen shows about as many stars as you can see.' : 'Tonight, drag the slider above Explore until the screen shows about as many stars as you can see.', yes: 'Got it' },
    { tier: 'Assignment 01', title: 'Your first catch', sub: ['Up right now', ''], art: OB_ART.catch, text: '', yes: 'Go', gold: true },
  ];
  let tgt0 = null;
  const nameTarget = () => { tgt0 = firstTarget(); if (!tgt0) return; steps[3].title = `Catch ${label(tgt0.obj)}`; steps[3].sub = [tgt0.obj.type === 'star' ? 'Bright star' : tgt0.obj.type === 'sun' ? 'Our star' : tgt0.obj.type === 'moon' ? 'The Moon' : tgt0.obj.natural ? 'Planet' : 'Satellite', `${Math.round(tgt0.look.el)}° up in the ${compassPoint(tgt0.look.az)}`]; steps[3].text = `It's up right now. ${tgt0.hint} Follow the arrow, then tap the circle to collect your first card.`;
 };
  steps[3].text = 'Sweep the sky. When something lines up in the circle, tap it to collect your first card.';
  // 1. location
  if (await obCard(steps, 0)) { const ok = requestLocation(); obReact('Sky lined up to your spot'); await ok; }
  if (skipped) return obFinish(false);
  // 2. motion (asked inside the tap above)
  if (await obCard(steps, 1)) { await motionAsk; obReact('Following your phone'); } else { state.drag.on = true; $('chk-drag').checked = true; }
  if (skipped) return obFinish(false);
  // 3. calibration, 4. the assignment
  await obCard(steps, 2); if (skipped) return obFinish(false);
  nameTarget(); // now that location and the sky are in, name what's up
  await obCard(steps, 3); if (skipped) return obFinish(false);
  $('ob-deck').replaceChildren(); $('ob-pips').hidden = true; document.body.classList.remove('ob-tour');
  // the first catch: pin the surest target; the normal aim + reveal takes over
  const target = firstTarget() ?? tgt0;
  if (target) guideTo(target.obj, target.look, target.hint); // same steering as Tonight → Show me
  ob.style.pointerEvents = 'none';
  // wait for the first card (or a skip), then close
  const had = state.sightings.filter((x) => !x.sim).length;
  state.tourCatchId = target?.obj.id ?? null; state.tourRevealed = false;
  await new Promise((resolve) => { onboarding = { resolve }; const t = setInterval(() => { if (state.tourRevealed || state.sightings.filter((x) => !x.sim).length > had) { clearInterval(t); resolve(true); } }, 500); $('ob-skip').onclick = () => { clearInterval(t); resolve(false); }; });
  if (skipped) return obFinish(false);
  // Let the full capture reveal play (2026-10-06: the close was covering it because the sighting is saved a
  // moment before the reveal opens). Wait for it to open, keep the tour chrome out of its way, then show the
  // close once it's flicked away or closed.
  ob.hidden = true;
  await new Promise((resolve) => { const t0 = Date.now(), t = setInterval(() => { if (!$('reveal').hidden || Date.now() - t0 > 4000) { clearInterval(t); resolve(); } }, 100); });
  await new Promise((resolve) => { const t = setInterval(() => { if ($('reveal').hidden) { clearInterval(t); resolve(); } }, 200); });
  ob.hidden = false;
  obFinish(true);
}
// What's certain to be up right now, with a one-line hint.
function firstTarget() {
  const nat = state.naturals ?? [];
  const sun = nat.find((n) => n.obj.key === 'sun' && n.look.visible); if (sun) return { obj: sun.obj, look: sun.look, hint: `Up in the ${compassPoint(sun.look.az)}. Aim the phone, not your eyes.` };
  const moon = nat.find((n) => n.obj.key === 'moon' && n.look.visible); if (moon) return { obj: moon.obj, look: moon.look, hint: `Bright and easy, ${Math.round(moon.look.el)}° up in the ${compassPoint(moon.look.az)}.` };
  const best = nat.filter((n) => n.look.visible && n.look.el > 15 && (n.obj.type === 'planet' || n.obj.type === 'star')).sort((a, b) => a.look.mag - b.look.mag)[0];
  if (best) return { obj: best.obj, look: best.look, hint: `The bright steady one, ${Math.round(best.look.el)}° up in the ${compassPoint(best.look.az)}.` };
  const sat = (state.items ?? []).filter((a) => a.look.visible && a.look.el > 20).sort((a, b) => a.look.mag - b.look.mag)[0];
  return sat ? { obj: sat.obj, look: sat.look, hint: `Moving steadily, ${Math.round(sat.look.el)}° up in the ${compassPoint(sat.look.az)}.` } : null;
}
function obFinish(caught) {
  const ob = $('onboard'); ob.style.pointerEvents = ''; onboarding = null; document.body.classList.remove('ob-tour'); state.tourCatchId = null; state.tourRevealed = false; $('ob-deck').replaceChildren(); $('ob-pips').hidden = false;
  if (!caught) { ob.hidden = true; return; }
  const T = state.tonight, t0 = now().getTime(), wx = tonightWeather();
  const peak = T ? T.curve.filter(([t]) => t >= t0).reduce((a, c) => (c[1] > a[1] ? c : a), [0, 0]) : null;
  const best = T ? (tonightPasses(T, t0).find((p) => p.fresh && p.start > t0) ?? tonightPasses(T, t0).find((p) => p.start > t0)) : null;
  const dark = T?.dusk && T.dusk > t0 ? fmtTime(T.dusk) : (T ? 'Now' : '—');
  $('ob-done-title').innerHTML = wx && !wx.ok ? 'Not tonight,<br>but soon.' : 'Tonight<br>looks good.';
  $('ob-stats').innerHTML = `<div><b>${escapeHtml(dark)}</b><span>Dark from</span></div><div><b>${peak ? peak[1] : '—'}</b><span>Satellites at peak</span></div><div><b>${wx ? escapeHtml(wx.line.split(' ')[0]) : '—'}</b><span>${wx ? escapeHtml(wx.line.split(' ').slice(1).join(' ')) : 'Sky'}</span></div>`;
  $('ob-best').textContent = best ? `Best one: ${label(best.obj)} at ${fmtTime(best.start)}, ${best.peakEl}° up in the ${compassPoint(best.peakAz)}.${best.fresh ? " It isn't in your collection yet." : ''}` : 'Open the Tonight line any time for the plan.';
  $('ob-remind').hidden = !best; $('ob-remind').onclick = () => { remindPass(best); };
  $('ob-explore').onclick = () => { ob.hidden = true; $('ob-done').hidden = true; };
  $('ob-done').hidden = false;
}

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
// ---------- Welcome card (2026-10-06) ----------
// The opener is a sealed card (the real card back) that rattles every few seconds. Tap: it flips to a mission
// card built with the real card renderer. Flick it up (or tap Begin): it flies off and the tour starts.
let wcCard = null, wcFlipped = false, wcReady = false, wcWantFlip = false, wcReplay = false;
function welcomeModel() {
  const n = state.catalog?.objects?.length ?? 16000;
  return {
    key: 'welcome', id: 'welcome', natural: 'welcome', type: 'welcome', name: 'Collect the Cosmos', tier: 'legendary', code: 'MISSION 01',
    stats: [['IN ORBIT', `${Math.floor(n / 1000)},000+`, ''], ['ALSO', 'Moon, planets', ''], ['YOUR RANK', 'Stargazer', '']],
    fact: 'Thousands of satellites, rocket stages and stations cross your sky every night. **Point your phone at a light**, find out what it is, and **keep its card**.',
  };
}
function renderStartHand() {
  const holder = $('wc-holder'); if (!holder || wcCard) return;
  const card = renderCard(welcomeModel(), { preview: true });
  card.classList.add('wc-mission');
  // Dress it as a briefing, not a catalogue entry.
  const sb = card.querySelector('.card__setbar > span:first-child > span'); if (sb) sb.textContent = 'MISSION CONTROL';
  const id = card.querySelector('.card__identity'); if (id) id.innerHTML = '<span>Your first mission</span><span class="card__mono">OBSERVER 001</span>';
  const art = card.querySelector('.card__art'), sys = state.cardModels.get('system:solar'), src = sys && artImage(sys);
  if (art && src) art.innerHTML = `<img class="card-art-image" src="${src}" alt="" decoding="async">`;
  const st = card.querySelector('.card__status'); if (st) st.innerHTML = '<span class="card__status-icon" aria-hidden="true">↑</span><span>SWIPE UP TO BEGIN</span>';
  // Start face-down: the card is turned half way, so its (pre-mirrored) back faces you.
  const back = card.querySelector('.card__back'); applyBack(back); back.style.opacity = '1';
  back.insertAdjacentHTML('beforeend', '<div class="tap">Tap to reveal</div>'); // on the card itself, like the old sealed reveal
  card.style.transform = 'perspective(1600px) rotateY(180deg)';
  holder.replaceChildren(card); wcCard = card;
  attachTilt(card);
  holder.classList.add('rattle');
}
async function welcomeFlip() {
  if (!wcCard || wcFlipped) return;
  if (!wcReady) { wcWantFlip = true; return; }
  wcFlipped = true;
  const holder = $('wc-holder'), back = wcCard.querySelector('.card__back');
  holder.classList.remove('rattle'); $('wc-hint').classList.add('gone'); unlockAudio();
  const ms = matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 900;
  wcCard.animate([
    { transform: 'perspective(1600px) rotateY(180deg) scale(1)', easing: 'cubic-bezier(.5,0,1,1)' },
    { transform: 'perspective(1600px) rotateY(270deg) scale(1.08)', offset: .5, easing: 'cubic-bezier(0,0,.4,1)' },
    { transform: 'perspective(1600px) rotateY(360deg) scale(1)' }], { duration: ms, fill: 'forwards' });
  setTimeout(() => { back.style.opacity = ''; }, ms / 2); // edge-on: swap faces
  await new Promise((r) => setTimeout(r, ms));
  wcCard.getAnimations().forEach((a) => a.cancel()); wcCard.style.transform = '';
  chirp([660, 990, 1320], 0.08);
  back.querySelector('.tap')?.remove(); // it's been revealed; from here a double tap flips it like any card
  attachFlip(wcCard, { onBack: applyBack });
  $('wc-hint').hidden = true; $('wc-after').hidden = false; $('start').classList.add('wc-open');
}
function welcomeGo(dx = 0, dy = -2, dt = 16) {
  if (!wcFlipped || $('btn-start').disabled) return;
  $('btn-start').disabled = true;
  const ms = throwOff(wcCard, dx, dy, dt);
  setTimeout(() => {
    keepAwake(); navigator.storage?.persist?.().catch(() => {});
    writePref('started', true);
    state.preview = false; enterSky(); runOnboarding(wcReplay); wcReplay = false;
  }, ms);
}
{
  const h = $('wc-holder'); let fl = null;
  h.addEventListener('click', () => { if (!wcFlipped) welcomeFlip(); });
  h.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); wcFlipped ? welcomeGo() : welcomeFlip(); } });
  h.addEventListener('pointerdown', (e) => { if (wcFlipped) fl = { id: e.pointerId, pts: [{ x: e.clientX, y: e.clientY, t: performance.now() }] }; });
  h.addEventListener('pointermove', (e) => { if (fl && e.pointerId === fl.id) { fl.pts.push({ x: e.clientX, y: e.clientY, t: performance.now() }); if (fl.pts.length > 12) fl.pts.shift(); } });
  h.addEventListener('pointerup', (e) => {
    if (!fl || e.pointerId !== fl.id) return; const pts = fl.pts; fl = null;
    const last = pts[pts.length - 1], now2 = performance.now(), from = pts.find((p) => now2 - p.t < 140) ?? pts[0];
    const dx = last.x - from.x, dy = last.y - from.y, dt = Math.max(16, now2 - from.t);
    if (dy < -40 && last.y - pts[0].y < -50 && Math.abs(dx) < -dy * 0.9 && -dy / dt > 0.5) welcomeGo(dx, dy, dt);
  });
}
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
    $('start-note').hidden=false; $('wc-after').hidden=false; $('start-note').textContent='Satellite data could not load. Check your connection and reload to try again.'; $('start-note').classList.add('err');
    $('btn-start').firstElementChild.textContent='Reload satellite data'; $('btn-start').disabled=false;
    $('btn-start').onclick=()=>location.reload(); $('start').classList.remove('booting'); return;
  }
  try { state.sky=await loadSky('data/sky.json'); } catch {}
  await loadLore(); await loadSightings();
  state.locationStatus=loadSavedLocation()?'saved':'example'; renderLocation();
  state.frame = frame(now(), state.observer); renderStartHand();
  $('btn-start').firstElementChild.textContent='Begin'; $('btn-start').disabled=false; wcReady = true; if (wcWantFlip) welcomeFlip();
  const params=new URLSearchParams(location.search);
  if(params.has('resume')) {
    try {
      const saved=JSON.parse(sessionStorage.getItem('space-collector.explore'));
      if(saved) {
        state.observer=saved.observer; state.locationStatus=['manual','example'].includes(saved.locationStatus)?saved.locationStatus:'saved';
        state.timeOffsetMs=saved.timeOffsetMs??0; state.drag=saved.drag; state.preview=!!saved.preview; state.followPreview=!!saved.followPreview; state.pinnedId=saved.preview ? saved.pinnedId : null; // a selection only survives a reload inside a pass preview (2026-10-06)
        if(!state.preview && !state.drag.on) { startSensors().catch(()=>{}); requestLocation(); }
        renderLocation(); enterSky();
        if(params.has('more')) openDebug();   // the Collection page's settings button lands here
      }
    } catch {}
  } else if (readPref('started', false) || loadSavedLocation()) quickStart(); // anyone who has used the app before
  $('start').classList.remove('booting'); // first visit: the welcome card is ready; returning: the sky is already up
  checkForUpdate(); requestAnimationFrame(tick);
}
boot();
