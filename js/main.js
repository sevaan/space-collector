import * as Secrets from './secrets.js?v=0.1.371';
import { cloudsHtml, rainHtml } from './weather-art.js?v=0.1.371';
import * as Ufo from './ufo.js?v=0.1.371';
import * as Fossil from './fossil.js?v=0.1.371';
import { patchHtml, patchSvg } from './patches.js?v=0.1.371';
import { setSwitch, SLIDE_MS } from './switcher.js?v=0.1.371';
import { toast, ticket, dropToast, toastPending } from './toast.js?v=0.1.371';
import { VERSION } from './version.js?v=0.1.371';
import { loadCatalog, frame, look, track, motion, compassPoint, enuFromAzEl, DARK_SUN_ELEVATION, SkyModel, RisingSoon, setBinocularMode, setSkyLimit } from './orbit.js?v=0.1.371';
import { skyLimit, SKIES, DEFAULT_SKY, SB_MIN, SB_MAX, sbOfSky, skyNameFor } from './sky-limit.js?v=0.1.371';
import { conArt } from './con-art.js?v=0.1.371';
import { fetchWeather, tonightSky } from './weather.js?v=0.1.371';
import { CON_FIGURES } from './con-figures.js?v=0.1.371';
import { loadConstellations, CON_STARS, CON_BY_ID, conProgress } from './constellations.js?v=0.1.371';
import { shinyFor, SHINY } from './shiny.js?v=0.1.371';
import { progress as progressOf } from './progress.js?v=0.1.371';
import { eventOf, activeEvent, nextEvent, passIcs } from './events.js?v=0.1.371';
import { CONSTELLATIONS } from './constellations.js?v=0.1.371';
import { startSensors, hasLiveSensors, trueBasis, basisFromAzEl, rotateAz, pointing, nudgeHeading, getNudge, lockHeading, setCompassPlace, getDeclination } from './sensors.js?v=0.1.371';
import { SkyView, shortName } from './sky.js?v=0.1.371';
import { loadSky, eqToEnu, solarSystem, milkyWayModel, galAxes, roadster, starVector } from './celestial.js?v=0.1.371';
import { addSighting, allSightings, deleteSighting } from './store.js?v=0.1.371';
import { cardArt } from './art.js?v=0.1.371';
import { renderCard, cardLevel, artImage, attachTilt, throwOff, attachFlip } from './card.js?v=0.1.371';
import { applyBack } from './card-backs.js?v=0.1.371';
import { onRevealNews, playReveal, playView, primeReveal, stopReveal, onRevealDismiss } from './reveal.js?v=0.1.371';
import { buildCards, cardKeyFor, stampKeyFor, normalizeSighting, stampsIn, fleetLevel } from './card-model.js?v=0.1.371';
import { collectedDuringPass, collectedTonight, canCapture, nightsIn } from './observation.js?v=0.1.371';
import { naturalTargets, SOLAR_SYSTEM } from './natural.js?v=0.1.371';
import { TIER_INFO } from './rarity.js?v=0.1.371';
import { SETS } from './sets.js?v=0.1.371';
import { TYPE_LABEL, ownerName, orbitStats } from './facts.js?v=0.1.371';
import { shareCardEl } from './share-card.js?v=0.1.371';
import { loadLore, titleFor, factFor, richText } from './lore.js?v=0.1.371';
import { PlaneTracker, planesAvailable, aircraftName, isHelicopter, planePath } from './planes.js?v=0.1.371';
import { addStarfield } from './starfield.js?v=0.1.371';

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
  showStars: readPref('showStars', true), // remembered like the other display toggles (QA 2026-10-08)
  showLines: readPref('lines', false),
  landscape: readPref('landscape', true),
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
  snap: readPref('snap', false),    // the targeting circle jumps onto a locked-on object
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
async function requestLocation({ gps = false } = {}) {
  // Coordinates typed into Settings are kept until you ask for GPS again (QA 2026-10-08: they were lost on relaunch,
  // and every launch asked GPS over the top of them).
  const saved = loadSavedLocation();
  if (saved?.manual && !gps) { state.observer = { lat: saved.lat, lon: saved.lon, label: 'Chosen location' }; state.locationStatus = 'manual'; renderLocation(); return true; }
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
  if (typeof renderSettings === 'function') try { renderSettings(); } catch {} // the settings row has its own short wording
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
  if (!soundOn()) return;
  try { audio ??= new (window.AudioContext || window.webkitAudioContext)(); audio.resume().catch(() => {}); } catch {}
}
function chirp(freqs = [660, 990], dur = 0.09) {
  if (!audio || !soundOn()) return;
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
    if (version && version !== VERSION) showBanner(`New build v${version} is out (running v${VERSION}).`, () => location.reload(), { icon: GEAR, sub: 'Tap to update.' });
  } catch {}
}

// ---------- banner & toast ----------

let bannerAction = null;
let bannerKey = '';
// The standing message (new build, time travel, tap to line up, check heading) is a toast now (2026-10-07):
// it lives at the bottom of the toast stack and stays until its state clears; tap it to act.
// A gear for the update message; it turns slowly (css .banner__icon).
const GEAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M10.3 2.5h3.4l.5 2.6 1.6.7 2.2-1.5 2.4 2.4-1.5 2.2.7 1.6 2.6.5v3.4l-2.6.5-.7 1.6 1.5 2.2-2.4 2.4-2.2-1.5-1.6.7-.5 2.6h-3.4l-.5-2.6-1.6-.7-2.2 1.5-2.4-2.4 1.5-2.2-.7-1.6-2.6-.5v-3.4l2.6-.5.7-1.6-1.5-2.2 2.4-2.4 2.2 1.5 1.6-.7z"/><circle cx="12" cy="12" r="3.2"/></svg>';
function showBanner(text, action = null, { icon = '', sub = '' } = {}) {
  if (bannerKey === text) return;
  bannerKey = text;
  const el = $('banner');
  if (el.parentElement !== $('toasts')) $('toasts').prepend(el); // first child = bottom of the stack
  el.className = `ticket ticket--info ticket--standing${action ? ' linked' : ''}`;
  el.innerHTML = text ? `${icon ? `<span class="banner__icon" aria-hidden="true">${icon}</span>` : ''}<span class="ticket__body"><span class="ticket__line">${escapeHtml(text)}</span>${sub ? `<span class="ticket__line banner__sub">${escapeHtml(sub)}</span>` : ''}</span>${action ? '<span class="ticket__go">›</span>' : ''}` : '';
  bannerAction = action;
  if (!text) { el.classList.remove('in'); setTimeout(() => { if (!bannerKey) el.hidden = true; }, 320); return; }
  el.hidden = false; requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('in')));
}
$('banner').addEventListener('click', () => bannerAction?.());

// ---------- toasts: one-line tickets (2026-10-05, design canvas "Toast C") ----------
// Kinds colour the left edge: mission (orange), xp (steel blue), event / achievement / rank (gold), info.
// They queue rather than stack: one at a time, oldest first, each ~3 s, slid in under the header.
// `toast(html, ms, href)` keeps the old callers working as plain info tickets.
onRevealNews((n) => ticket(n));
// toast / ticket / dropToast live in js/toast.js (shared with the collection page).

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
  setCompassPlace(state.observer?.lat, state.observer?.lon); // true north for the iOS compass; cached, recomputes only when you move
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
    // The hand-drawn grain, clouds and dust are only the fallback for the photo (js/milkyway-gl.js), so skip them once it's in.
    specks: sky.mwGL?.ready ? [] : m.specks.map((p) => ({ enu: toEnu(p.v), a: p.a, s: p.s, w: p.w })),
    rift: sky.mwGL?.ready ? [] : m.rift.map((p) => ({ enu: toEnu(p.v), w: p.w, a: p.a })),
    clouds: sky.mwGL?.ready ? [] : m.clouds.map((p) => ({ enu: toEnu(p.v), r: p.r, a: p.a })),
    gal: galAxes().map(toEnu), // for the photographic Milky Way (js/milkyway-gl.js)
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
    if (state.timeOffsetMs) showBanner(`Sky at ${now().toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' })} · back to now`, backToNow); // one short line (2026-10-08)
    else if (state.needsMotionTap) showBanner('Tap anywhere to line the sky up with your phone.');
    // (compass trouble is the figure-8 toast in checkCompass, not a standing message)
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

// The tour's sky moments (2026-10-09, Sevaan: "the sky wakes up step by step"): a temporary turn of the whole view,
// eased to nothing, e.g. the sky swinging round into your real sky after Allow location, or a sway that shows the
// finger mode. state.viewSpin = { t0, ms, az, sway }.
function spinView(b) {
  const v = state.viewSpin; if (!v) return b;
  const k = Math.min(1, (performance.now() - v.t0) / v.ms);
  if (k >= 1) { state.viewSpin = null; return b; }
  const e = 1 - (1 - k) ** 3, deg = v.sway ? v.az * Math.sin(k * Math.PI * 2) * (1 - k) : v.az * (1 - e);
  return { right: rotateAz(b.right, deg), up: rotateAz(b.up, deg), back: rotateAz(b.back, deg) };
}
// When the phone takes over from the finger (motion just switched on, or drag mode turned off), the view sweeps
// from where it was to where the phone points over ~1.2 s instead of jumping (2026-10-09, Sevaan: turning motion on
// in the tour snapped straight to the floor).
let lastBasis = null, lastLive = false, blendFrom = null, blendT0 = 0;
const BLEND_MS = 1600;
function blendBasis(target) {
  const live = !state.drag.on && hasLiveSensors();
  if (live && !lastLive && lastBasis && !matchMedia('(prefers-reduced-motion: reduce)').matches) { blendFrom = lastBasis; blendT0 = performance.now(); }
  lastLive = live;
  let b = target;
  if (blendFrom) {
    const k = Math.min(1, (performance.now() - blendT0) / BLEND_MS), e = (1 - Math.cos(Math.PI * k)) / 2; // ease in-out
    if (k >= 1) blendFrom = null;
    else {
      // slerp: an even turn along the arc (a straight-line mix bunched the motion into the middle frames)
      const mix = (a, c) => { const d = Math.max(-1, Math.min(1, a[0] * c[0] + a[1] * c[1] + a[2] * c[2])), th = Math.acos(d);
        if (th < 1e-4) return c; const sa = Math.sin((1 - e) * th) / Math.sin(th), sc = Math.sin(e * th) / Math.sin(th);
        const v = a.map((x, i) => x * sa + c[i] * sc), n = Math.hypot(...v) || 1; return v.map((x) => x / n); };
      const back = mix(blendFrom.back, target.back), up0 = mix(blendFrom.up, target.up);
      // keep the frame square: re-orthogonalise up against back, then right from both
      const d = up0[0] * back[0] + up0[1] * back[1] + up0[2] * back[2];
      let up = up0.map((x, i) => x - d * back[i]); const nu = Math.hypot(...up) || 1; up = up.map((x) => x / nu);
      const right = [back[1] * up[2] - back[2] * up[1], back[2] * up[0] - back[0] * up[2], back[0] * up[1] - back[1] * up[0]]; // back × up (checked: az 0, el 0 → east)
      b = { right, up, back };
    }
  }
  lastBasis = b;
  return b;
}
function currentBasis() { return spinView(blendBasis(rawBasis())); }
function rawBasis() {
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
  if (groundShown) return; // the look-up nudge owns the line while you're looking down
  if (hintOff || target || plane || state.preview || (sky.feetA ?? 0) > 0.3) { /* looking at your feet: the ring has the floor */ if (g.classList.contains('first')) { g.hidden = true; g.classList.remove('first'); } return; }
  if (state.sightings.some((s) => !s.sim)) { hintOff = true; return; }
  hintSince ||= t;
  if (t - hintSince > 40000) { hintOff = true; g.hidden = true; g.classList.remove('first'); return; }
  if (!g.classList.contains('first')) { g.classList.add('first'); g.textContent = 'Sweep the sky slowly. Bright, steadily moving lights are satellites: line one up in the circle.'; }
  g.hidden = false; // renderTarget hides #guidance whenever nothing is lined up; keep the hint up
}
// Write only when it changes: #guidance is a live region, and rewriting it four times a second floods screen readers (QA 2026-10-08).
function setText(el, txt) { if (el.textContent !== txt) el.textContent = txt; }
// A soft tick when the circle locks onto a target (sound stands in for haptics on the web).
function snapTick() {
  buzz(12); sky.lockPulseAt = performance.now(); // felt (Android) and seen: a ring pulses out from the circle
  if (!audio || !soundOn()) return;
  try { const t = audio.currentTime, o = audio.createOscillator(), g = audio.createGain(); o.type = 'sine'; o.frequency.value = 1760; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.045); o.connect(g).connect(audio.destination); o.start(t); o.stop(t + 0.06); } catch {}
}
let uiSafeTop = 202, uiSafeBottom = 320, uiCenterY = window.innerHeight / 2; // set from the first frame, so the circle never starts high and slides down (2026-10-07)
let idleBasis = null, idleFlip = false;
function tick(ts) {
  requestAnimationFrame(tick);
  if (!state.catalog || !state.started || document.hidden || activePanel || collectionOpen) return;
  const d = now();
  state.model.update(d, state.observer);
  state.items = state.model.items(d);
  state.rising?.update(d, state.observer);
  if (ts - lastAbove > 1000) { refreshAbove(); lastAbove = ts; }

  const basis = currentBasis();
  state.basis = basis;
  // Ease off when nothing's moving (2026-10-08 performance): if the view hasn't turned since the last drawn frame, draw
  // every other frame (~30 fps). Satellites still move smoothly at that rate and it saves battery outside.
  { const lb = idleBasis, moved = !lb || Math.abs(lb[0] - basis.back[0]) + Math.abs(lb[1] - basis.back[1]) + Math.abs(lb[2] - basis.back[2]) > 0.0015;
    idleFlip = !idleFlip;
    if (!moved && idleFlip && !state.lockedOn && performance.now() - (sky.lockPulseAt ?? 0) > 500) return;
    idleBasis = [...basis.back]; }
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

  // Only what's in the circle can be selected (2026-10-07, Sevaan); a brief 0.4 s grace stops it flickering at the
  // edge. With several in the circle, guess which one you mean: the one nearest the centre, nudged toward the one
  // you were already on (you're tracking it), a satellite over a star, and something new over something collected.
  // Small nudges (2026-10-07): a slight tilt toward another object should hand the pick over, so the stickiness is light.
  const pickScore = (it) => Math.acos(Math.min(1, it.angCos)) / RAD - (it.obj.id === state.targetId ? 0.5 : 0) - (it.obj.natural ? 0 : 0.5) - (isNewFind(it.obj) ? 0.4 : 0);
  const cands = [...items, ...naturals]
    .filter((it) => (it.look.visible || state.captureAny) && t - (state.sticky.get(it.obj.id) ?? -1e9) < 400)
    .sort((a, b) => pickScore(a) - pickScore(b))
    .slice(0, 5);
  for (const id of state.sticky.keys()) if (t - state.sticky.get(id) > 400) state.sticky.delete(id);
  state.candidates = cands;
  let target;
  if (state.pinnedId) {
    target = items.find(it => it.obj.id === state.pinnedId) ?? naturals.find(it => it.obj.id === state.pinnedId);
    if (!target) {
      const obj = state.byId.get(state.pinnedId);
      const l = obj && look(obj, frame(d, state.observer));
      if (l) { target = { obj, label: label(obj), look: l, angCos: dot(enuFromAzEl(l.az, l.el), basis.back) }; items.push(target); }
    }
    // A pinned Moon, planet or star that has set (or faded under the sky slider) lets go, instead of leaving an
    // invisible pin that dims everything else (QA 2026-10-08).
    if (!target) { state.pinnedId = null; state.targetId = null; }
    else state.targetId = state.pinnedId;
  } else {
    state.targetId = cands[0]?.obj.id ?? null;
    target = cands[0];
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
    ...(document.body.classList.toggle('bright-sky', (state.frame?.sunEl ?? -90) > -2 && !state.night) ? {} : {}), // daytime only (dusk is dark like night): chips, switcher and toasts in card paper (2026-10-08)
    weather: state.weather?.now ?? null,
    below: belowGhosts(d), // see-through Earth: what's under the horizon and when it rises
    ghosts: state.guideRise && state.activeTarget ? [{ enu: enuFromAzEl(state.activeTarget.look.az, state.activeTarget.look.el), name: 'Appears here', note: fmtTime(state.guideRise.start) }] : dayGhosts(),
    bodies: state.showStars ? state.bodies : null,
    milky: state.showStars ? state.milkyEnu : null,
    lines: state.showLines,
    targetId: state.targetId,
    lockedOn: state.lockedOn,
    naturalTarget: target?.obj.natural ? target.look.enu : null,
    naturalTargetName: target?.obj.natural ? label(target.obj) : null,
    quietTarget: isQuiet(target?.obj), // no inner circle or snap; the object brightens instead
    fossil: fossilState(t, basis, target),
    ufo: ufoState(t, basis, target, items),
    secrets: secretsState(t, basis, target),
    _ud: untilDark(target),
    planes: state.planeItems,
    planeHit: plane?.plane.hex ?? null,
    planeTrail: plane ? planePath(plane.plane, state.observer) : null, // where the lined-up plane has been and is going
    newFind: !!state.newFind,
    ownedTarget: !!state.activeTarget && !state.newFind && !isNewFind(state.activeTarget.obj) && state.activeTarget.obj.id !== state.tourCatchId,
    landscape: !!state.landscape,
    rising: state.rising?.list(d).map((e) => ({ az: e.az, name: label(e.obj), mins: Math.max(1, Math.round((e.at - d.getTime()) / 60000)) })),
    time: t,
    safeTop: uiSafeTop,
    safeBottom: uiSafeBottom,
    centerY: uiCenterY,
  });

  updateCompass(basis);
  if (t - lastChip > 1000) { lastChip = t; requestTonight(); requestWeather(); updateNextPassChip(); updateEventBanner(); checkCompass(t);
    // The collection page wears the same sky (2026-10-07): hand it the colours Explore is painting right now.
    if (sky.tone && !state.night) try { localStorage.setItem('skyTone', JSON.stringify({ ...sky.tone, at: Date.now() })); } catch {} }
  placeDiscover();
  if (t - lastPanel > 250 || target?.obj.id !== shownTargetId || state.lockedOn !== lastLocked) {
    if (state.lockedOn && !lastLocked) snapTick(); // the circle just caught something
    lastLocked = state.lockedOn; renderTarget(target, d); measureSkySpace(); lastPanel = t; }
  // (2026-10-07: the first-night "Sweep the sky slowly…" hint is retired, like the ground nudge)
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
  // Inside the circle only (2026-10-07: a plane well outside the ring was still lit up and named).
  const inCos = Math.cos(sky.reticleDeg * RAD), keepCos = Math.cos((sky.reticleDeg + 0.75) * RAD);
  let best = null;
  for (const a of list) { a.angCos = dot(a.enu, basis.back); if (a.angCos > inCos && (!best || a.angCos > best.angCos)) best = a; }
  // Keep the last plane for a second after it slips out, as long as it's still close.
  const kept = state.planeHit && list.find((a) => a.plane.hex === state.planeHit.hex);
  if (!best && kept && kept.angCos > keepCos && t - state.planeHit.at < 400) return kept;
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
  $('p-route').textContent = route?.from && route?.to ? `${route.from} → ${route.to}` : aircraftName(p) || 'Flight details';
  $('p-route').hidden = false;
  $('p-info').textContent = (route?.from && route?.to ? bits : bits.slice(1)).join(' · ');
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
  // In daylight the disc is see-through glass, not navy (2026-10-08 playtest).
  const dayGlass = document.body.classList.contains('day');
  ctx.fillStyle = dayGlass ? 'rgba(255,255,255,.16)' : C.glass; ctx.strokeStyle = dayGlass ? 'rgba(20,48,70,.5)' : C.edge; ctx.lineWidth = 1;
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
  ticket({ kind: 'mission', eyebrow: label(obj).toUpperCase(), line: `${hint || `Up now, ${Math.round(l.el)}° up in the ${compassPoint(l.az)}.`} Follow the arrow.`, ms: 5000 }); // the same look as every other toast (2026-10-08)
}
// Tonight → "Show me": pin the object and steer to it (or to where it will rise).
function showMePass(p) {
  cancelPassSearch();
  state.pinnedId = p.obj.id; state.targetId = p.obj.id; state.sticky.clear();
  state.guidePass = { id: p.obj.id, start: p.start, end: p.end, riseAz: p.riseAz, riseEl: p.riseEl };
  if (state.drag.on || !hasLiveSensors()) { state.drag.on = true; state.drag.az = p.riseAz; state.drag.el = Math.max(4, p.riseEl ?? 10); }
  closePanel('visible');
  const mins = Math.round((p.start - now().getTime()) / 60000);
  ticket({ kind: 'mission', eyebrow: label(p.obj).toUpperCase(), ms: 5000, line: `${mins > 0 ? `Appears in the ${compassPoint(p.riseAz)} at ${fmtTime(p.start)}. Follow the arrow to where it will come up.` : `Up now, highest ${p.peakEl}° in the ${compassPoint(p.peakAz)}. Follow the arrow.`}` });
}
function switchLabel(o) {
  // No tap-to-switch (2026-10-07, Sevaan): a slight tilt moves the pick (pickScore), so there is nothing to say here.
  return '';
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
      $('d-cta').hidden = isQuiet(o); disc.classList.toggle('quiet', isQuiet(o)); disc.classList.remove('owned'); $('d-hit').setAttribute('aria-label', 'Collect this object');
      $('d-cta').textContent = 'Tap to collect'; $('d-sub').hidden = true;
    } else {
      disc.hidden = true; guide.hidden = false;
      setText(guide, `${label(o)} · ${turnHint(l)}`);
    }
    barTargetId = null;
    return;
  }

  // Seen before (2026-10-07, design/target-states.html A): the same layout as a new find, a cream circle and a
  // View card button instead of Tap to collect. No mini card.
  state.newFind = false;
  bar.hidden = true; barTargetId = null;
  if (eligible || collected) {
    disc.hidden = false; guide.hidden = true; disc.classList.add('owned'); disc.classList.remove('quiet'); $('d-hit').setAttribute('aria-label', 'View this card');
    $('d-tier').textContent = tier.label; $('d-tier').style.setProperty('--find-tier', tier.color);
    $('d-name').textContent = label(o);
    $('d-cta').hidden = false; $('d-cta').textContent = 'View card';
    const n = nightsIn(state.sightings.filter((s) => !s.sim && s.cardKey === cardKeyFor(o)));
    $('d-sub').hidden = !n; $('d-sub').textContent = `Seen on ${n} night${n === 1 ? '' : 's'}`;
    $('d-switch').hidden = true;
  } else { disc.hidden = true; guide.hidden = false; setText(guide, `${label(o)} · ${turnHint(l)}`); }
  return;
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
  if (!target || state.captureBusy) return;
  if ($('discover').classList.contains('owned')) return viewOwned(target, $('d-cta').getBoundingClientRect());
  capture(target.obj);
});
async function viewOwned(target, from) {
  const o = target.obj, d = now();
  let counted = false;
  if (state.lockedOn && (target.look.visible || state.captureAny) && !collectedThisPass(o, d)) {
    const saved = await recordSighting(o, d); counted = !!saved;
    if (saved) announceProgress(progressGain(saved)); // missions, patches and XP count here too (QA 2026-10-08)
  }
  showViewCard(o, from, counted);
}
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
// Repeat-sighting milestones, in different nights (cards) and launches stamped (fleet cards).
const NIGHT_MILESTONES = [3, 5, 10, 25, 50, 100, 200, 365];
function autoLog(target, d, t) {
  const o = target?.obj;
  if (!o || o.id === state.tourCatchId || !state.lockedOn || !(target.look.visible || state.captureAny) || state.captureBusy || isNewFind(o) || !ownsCard(o)) { autoHold = null; return; }
  if (autoHold?.id !== o.id) { autoHold = { id: o.id, since: t, done: false }; return; }
  if (autoHold.done || t - autoHold.since < AUTO_LOG_MS) return;
  autoHold.done = true;
  if (collectedThisPass(o, d)) return;
  const key = cardKeyFor(o), mine = () => state.sightings.filter((s) => !s.sim && s.cardKey === key), nightsBefore = nightsIn(mine());
  recordSighting(o, d).then((saved) => {
    if (!saved) return;
    const nightsNow = nightsIn(mine()), name = label(o);
    // Only news gets a toast (2026-10-07): a shiny, or a nights milestone ("Seen on 3 different nights").
    if (saved.shiny) toast(`✦ Shiny! ${name}: ${SHINY[saved.shiny].line}`, 4500);
    else if (!o.launches && nightsNow > nightsBefore && NIGHT_MILESTONES.includes(nightsNow)) ticket({ kind: 'event', eyebrow: name, line: `Seen on ${nightsNow} different nights`, ms: 3200 });
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
  if (state.lockedOn && (target.look.visible || state.captureAny) && !collectedThisPass(o, d)) {
    const saved = await recordSighting(o, d); counted = !!saved;
    if (saved) announceProgress(progressGain(saved)); // missions, patches and XP count here too (QA 2026-10-08)
  }
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
  const progress = { level: cardLevel(sightings), before: cardLevel(sightings.slice(1)), nights: nightsIn(sightings) > nightsIn(sightings.slice(1)) ? nightsIn(sightings) : 0 }; // 0 unless this sighting started a new night
  const collected = new Set(state.sightings.filter(s => !s.sim).map(s => s.cardKey)).size; // milestone stamps
  // A constellation star: the stamp shows how far along its constellation is (gold when complete).
  // A star's constellation, or the Solar System for the Moon and planets: progress toward the gold card.
  const conCard = (model.con && CON_BY_ID.get(model.con)) || (['moon', 'planet'].includes(model.type) ? SOLAR_SYSTEM : null);
  const owned = ownedCardKeys();
  const con = conCard && sightings.length === 1 ? { name: conCard.name, ...conProgress(conCard, owned) } : null;
  // The toast shows the constellation filling in (2026-10-07, Sevaan): the gold card's art, found stars lit,
  // the one you just caught ringed.
  if (con && conCard.data) con.art = conArt(conCard.data, model.hip ?? null, { w: 150, h: 100, ...(CON_FIGURES.has(conCard.con) ? { figure: `assets/art/con/${conCard.con}.webp` } : {}),
    lit: new Set(conCard.stars.filter((k) => owned.has(k)).map((k) => Number(k.replace('star:hip', '')))) });
  const gain = progressGain(sightings[0]); announceProgress(gain);
  $('rv-share').hidden = false; revealShare = { card, o: model };
  playReveal({ card, o: model, seen: sightings.length, fleet, progress, collected, con, xp: gain.xp, rank: gain.rank, shiny: sightings[0]?.shiny && !model.launches ? SHINY[sightings[0].shiny] : null, origin: { x: sky.ring?.x ?? sky.cx, y: sky.ring?.y ?? sky.cy } });
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
  $('rv-share').hidden = false; revealShare = { card, o: model };
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
    sighting = { seen: sightings.length, nights: nightsIn(sightings) > nightsIn(sightings.slice(1)) ? nightsIn(sightings) : 0, level, levelUp: level !== before };
  }
  $('rv-share').hidden = !sightings.length; revealShare = { card, o: model };
  playView({ card, o: model, from, sighting });
}
// A Tonight row's card: the real card if you own it, otherwise a preview (art and story shown).
function showTonightCard(obj, from, eyebrow) {
  const model = cardModel(obj), key = cardKeyFor(obj);
  const sightings = state.sightings.filter(s => !s.sim && s.cardKey === key);
  const card = renderCard(model, sightings.length ? { sightings, seenMembers: new Set(sightings.map(s => s.objectId)).size } : { preview: true });
  $('reveal-view').href = `cards.html#${encodeURIComponent(key)}`;
  closePanel('visible'); openPanel('reveal');
  $('rv-share').hidden = !sightings.length; revealShare = { card, o: model };
  playView({ card, o: model, from, eyebrow });
}
// Share from the reveal (2026-10-08, design D): the same image as the collection viewer's Share.
let revealShare = null;
$('rv-share').addEventListener('click', async () => {
  const r = revealShare, btn = $('rv-share'); if (!r) return;
  btn.disabled = true;
  try { const how = await shareCardEl(r.card, r.o, { title: titleFor(r.o), rank: progressNow(state.sightings).rank.name, fact: factFor(r.o) }); if (how === 'downloaded') toast('Saved the card image.'); }
  catch { toast('Couldn\'t make the image. Try again.'); }
  btn.disabled = false;
});
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
  const ev = eventOf(saved), firstOfEvent = ev && !state.sightings.some((s) => s !== saved && eventOf(s)?.id === ev.id);
  return { xp: after.xp - before.xp, rank: { from: before.xp, to: after.xp, name: after.rank.name, at: after.rank.at, next: after.rank.next }, missions, achievements, rankUp: after.rank.index > before.rank.index ? after.rank.name : null, event: firstOfEvent ? ev.name : null };
}
function announceProgress(g, delay = 3800) {
  // Tickets queue themselves; the delay lets the card land first.
  if (g.event) ticket({ kind: 'event', eyebrow: 'EVENT BADGE', line: g.event, ms: 3600, delay });
  g.missions.forEach((m) => ticket({ kind: 'mission', eyebrow: 'MISSION COMPLETE', line: m.text, xp: 50, ms: 3200, delay }));
  g.achievements.forEach((a) => earnPatch(a)); // mission patches (2026-10-08): a stitched-on moment, then a toast
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
    collectionStale(); // the preloaded collection catches up in the background
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

// Now tab (2026-10-08, design/now-tonight.html A): a map of your sky, the list split into New to you / Seen before,
// and at the end a row of mini cards for what's new to collect. Tap a dot, row or card to aim at it.
function aimAt(it) {
  cancelPassSearch();
  state.pinnedId = it.obj.id; state.targetId = it.obj.id;
  if (state.drag.on || !hasLiveSensors()) { state.drag.on = true; state.drag.az = it.look.az; state.drag.el = it.look.el; }
  closePanel('visible');
}
const visIcon = (o, c) => o.natural ? `<svg width="18" height="18" viewBox="-9 -9 18 18"><circle r="3" fill="${c}"/><circle r="7" fill="${c}" opacity=".18"/></svg>`
  : o.type === 'rocket-body' || o.type === 'debris' ? '<svg width="12" height="20" viewBox="-6 -10 12 20"><rect x="-3" y="-8" width="6" height="14" rx="2" fill="#fff2b3"/><path d="M-3 6 L-5 10 L5 10 L3 6Z" fill="#fa8127"/></svg>'
  : `<svg width="22" height="12" viewBox="-11 -6 22 12"><rect x="-3" y="-2" width="6" height="4" fill="${c}"/><rect x="-10" y="-1.5" width="6" height="3" fill="${c}" opacity=".8"/><rect x="4" y="-1.5" width="6" height="3" fill="${c}" opacity=".8"/></svg>`;
// Nothing up (2026-10-08): an empty sky map with why (daylight, cloud, a quiet gap), the next pass worth looking
// for as a tappable row, and ways on: jump the clock to the next pass, or see tonight's plan.
function renderVisibleEmpty(list) {
  const t0 = now().getTime(), T = state.tonight, day = isDay(), wxT = tonightWeather();
  if (!T) requestTonight();
  const next = T ? tonightPasses(T, t0).find((p) => p.start > t0) : null;
  const cloudy = wxT && !wxT.ok;
  const glyph = day ? '<circle r="13" fill="#fa8127" opacity=".9"/><circle r="22" fill="#fa8127" opacity=".12"/>'
    : cloudy ? '<path d="M-20 8 a9 9 0 0 1 3-17 a13 13 0 0 1 24-3 a10 10 0 0 1 13 20 Z" fill="#344654" stroke="#627a8b"/>'
    : '<path d="M4 -14 a14 14 0 1 0 10 22 a11 11 0 1 1 -10 -22 Z" fill="#fff2b3" opacity=".85"/>';
  const title = day ? 'The Sun has the sky' : cloudy ? 'Clouded over' : 'A quiet patch of sky';
  const why = day ? (T?.dusk > t0 ? `Satellites start to shine after dark, around <b>${fmtTime(T.dusk)}</b>.` : 'Satellites shine once the sky gets dark.')
    : cloudy ? `Sky: <b>${escapeHtml(wxT.line)}</b>. Passes still go over; you just won't see them through cloud.`
    : 'Nothing bright enough is up right now. Passes come in waves, so the next one is usually close.';
  const box = document.createElement('div'); box.className = 'vis-empty';
  box.innerHTML = `<svg viewBox="-118 -118 236 236" aria-hidden="true"><circle r="108" fill="#0b1626" stroke="#344654"/><circle r="72" fill="none" stroke="#1c2b3c"/><circle r="36" fill="none" stroke="#1c2b3c"/><path d="M0 -108 V108 M-108 0 H108" stroke="#1c2b3c"/>
    <g class="vm-rot"><g font-family="SC Label, Arial Narrow" font-size="11" fill="#bdbea9" text-anchor="middle"><text class="vm-up" data-x="0" data-y="-100" y="-96" fill="#fa8127">N</text><text class="vm-up" data-x="98" data-y="0" x="98" y="4">E</text><text class="vm-up" data-x="0" data-y="100" y="104">S</text><text class="vm-up" data-x="-98" data-y="0" x="-98" y="4">W</text></g></g><g class="ve-glyph">${glyph}</g></svg>
    <h3>${title}</h3><p>${why}</p>`;
  list.appendChild(box);
  const b0 = state.basis?.back ?? [0, 1, 0]; spinVisMap(box, (Math.atan2(b0[0], b0[1]) / RAD + 360) % 360);
  if (next) {
    const tier = TIER_INFO[next.obj.tier] ?? TIER_INFO.common, mins = Math.round((next.start - t0) / 60000);
    const when = mins < 60 ? `in ${mins} min` : `in ${Math.floor(mins / 60)} h ${mins % 60 ? `${mins % 60} min` : ''}`.trim();
    list.insertAdjacentHTML('beforeend', '<div class="t-head">Next up</div>');
    const r = document.createElement('button'); r.type = 'button'; r.className = 'vis-row2'; r.style.setProperty('--tier', tier.color);
    r.innerHTML = `<span class="vr-ic">${visIcon(next.obj, tier.color)}</span><span class="vr-main"><b>${escapeHtml(label(next.obj))}${next.fresh ? '<span class="new">NEW</span>' : ''}</b><small>${fmtTime(next.start)} · ${when} · ${brightnessWord(next.mag)}</small></span><span class="vr-dir">${compassPoint(next.riseAz)}<em>to ${next.peakEl}° up</em></span>`;
    r.addEventListener('click', () => showMePass(next)); list.appendChild(r);
  }
  const acts = document.createElement('div'); acts.className = 'vis-empty-acts';
  const b = document.createElement('button'); b.className = 'big'; b.textContent = next ? 'Show me the next pass' : 'Find the next pass'; b.addEventListener('click', () => (next ? showMePass(next) : findPass())); // it aims you; it doesn't move the clock (QA 2026-10-08)
  const l = document.createElement('button'); l.type = 'button'; l.className = 'ui-link'; l.textContent = 'See tonight’s plan ›'; l.addEventListener('click', () => showVTab('tonight'));
  acts.append(b, l); list.appendChild(acts);
}
let visMapRaf = 0;
function spinVisMap(map, start) {
  cancelAnimationFrame(visMapRaf);
  const g = map.querySelector('.vm-rot'), ups = [...map.querySelectorAll('.vm-up')], face = map.querySelector('.vm-face');
  let cur = start, shown = '';
  g.setAttribute('transform', `rotate(${(-cur).toFixed(1)})`);
  const tick = () => {
    if (!map.isConnected || $('visible').hidden) return;
    // The sky loop pauses while a panel is open, so read the phone directly (smoothed below).
    const b0 = (!state.drag.on && hasLiveSensors() ? trueBasis() : basisFromAzEl(state.drag.az, state.drag.el))?.back ?? [0, 1, 0];
    if (Math.hypot(b0[0], b0[1]) > 0.15) { // straight up there's no "facing": hold still
      const h = (Math.atan2(b0[0], b0[1]) / RAD + 360) % 360, d = ((h - cur + 540) % 360) - 180;
      if (Math.abs(d) > 0.2) {
        cur = (cur + d * 0.18 + 360) % 360;
        g.setAttribute('transform', `rotate(${(-cur).toFixed(1)})`);
        for (const t of ups) t.setAttribute('transform', `rotate(${cur.toFixed(1)} ${t.dataset.x} ${t.dataset.y})`);
        const cp = compassPoint(cur); if (face && cp !== shown) { shown = cp; face.textContent = cp; }
      }
    }
    visMapRaf = requestAnimationFrame(tick);
  };
  for (const t of ups) t.setAttribute('transform', `rotate(${cur.toFixed(1)} ${t.dataset.x} ${t.dataset.y})`);
  visMapRaf = requestAnimationFrame(tick);
}
function renderVisible() {
  const list = $('visible-list');
  const vis = [...state.items.filter((i) => i.look.visible), ...(state.naturals ?? [])].sort((a, b) => a.look.mag - b.look.mag);
  $('visible-sub').textContent = `${state.observer.label?.replace(/^Example:\s*/, '') ?? 'Your sky'} · ${fmtTime(now().getTime())}`;
  document.querySelector('[data-vtab="now"]').textContent = vis.length ? `Now · ${vis.length}` : 'Now';
  $('visible-hint').textContent = ''; list.innerHTML = '';
  if (!vis.length) { renderVisibleEmpty(list); return; }
  // The map turns with you (2026-10-08): whichever way you face is at the top, under a fixed soft wedge; the ring,
  // N/E/S/W and the dots rotate (labels stay upright). spinVisMap keeps it turning while the panel is open.
  const b0 = state.basis?.back ?? [0, 1, 0], heading = (Math.atan2(b0[0], b0[1]) / RAD + 360) % 360;
  const pos = (l) => { const r = 104 * (1 - Math.max(0, l.el) / 90), a = l.az * RAD; return [Math.sin(a) * r, -Math.cos(a) * r]; };
  const wedge = (() => { const a1 = -20 * RAD, a2 = 20 * RAD; return `<path d="M0 0 L${Math.sin(a1) * 104} ${-Math.cos(a1) * 104} A104 104 0 0 1 ${Math.sin(a2) * 104} ${-Math.cos(a2) * 104} Z" fill="#fa8127" opacity=".1"/>`; })();
  const up = (x, y) => `class="vm-up" data-x="${x.toFixed(1)}" data-y="${y.toFixed(1)}"`;
  const dots = vis.slice(0, 40).map((it, i) => { const [x, y] = pos(it.look), isStar = it.obj.natural === 'star', nw = isNewFind(it.obj) && !isStar, c = it.obj.natural ? '#f2d8a8' : '#fff2b3', lab = i < 7; // stars stay quiet: small, no ring
    return `<g class="vd" data-i="${i}" style="cursor:pointer"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="12" fill="transparent"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${nw ? 4 : isStar ? 1.8 : 2.8}" fill="${c}"/>${nw ? `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="8.5" fill="none" stroke="#fa8127" stroke-width="1.2"/>` : ''}${lab ? `<text ${up(x, y)} x="${(x + 11).toFixed(1)}" y="${(y + 3.5).toFixed(1)}" font-family="SC Label, Arial Narrow" font-size="9.5" letter-spacing="1" fill="#fff2b3cc">${escapeHtml(label(it.obj).toUpperCase().slice(0, 16))}</text>` : ''}</g>`; }).join('');
  const map = document.createElement('div'); map.className = 'vis-map';
  map.innerHTML = `<svg viewBox="-118 -118 236 236"><circle r="108" fill="#0b1626" stroke="#344654"/>${wedge}<g class="vm-rot" transform="rotate(${-heading.toFixed(1)})"><circle r="72" fill="none" stroke="#1c2b3c"/><circle r="36" fill="none" stroke="#1c2b3c"/><path d="M0 -108 V108 M-108 0 H108" stroke="#1c2b3c"/>
    <g font-family="SC Label, Arial Narrow" font-size="11" fill="#bdbea9" text-anchor="middle"><text ${up(0, -100)} y="-96" fill="#fa8127">N</text><text ${up(98, 0)} x="98" y="4">E</text><text ${up(0, 100)} y="104">S</text><text ${up(-98, 0)} x="-98" y="4">W</text></g>${dots}</g><circle r="2.5" fill="#fa8127"/></svg>
    <p class="vis-map-note">You're facing <span class="vm-face">${compassPoint(heading)}</span> · tap a dot or a row to aim</p>`;
  map.addEventListener('click', (e) => { const g = e.target.closest('.vd'); if (g) aimAt(vis[Number(g.dataset.i)]); });
  spinVisMap(map, heading);
  list.appendChild(map);
  const row = (it) => { const o = it.obj, tier = TIER_INFO[o.tier] ?? TIER_INFO.common, nw = isNewFind(o), r = document.createElement('button'); r.type = 'button'; r.className = 'vis-row2';
    r.innerHTML = `<span class="vr-ic">${visIcon(o, o.natural ? '#f2d8a8' : tier.color)}</span><span class="vr-main"><b>${escapeHtml(label(o))}${nw ? '<span class="new">NEW</span>' : ''}</b><small>${tier.label} · ${brightnessWord(it.look.mag)}</small></span><span class="vr-dir">${compassPoint(it.look.az)}<em>${Math.round(it.look.el)}° up</em></span>`;
    r.addEventListener('click', () => aimAt(it)); return r; };
  const fresh = vis.filter((it) => isNewFind(it.obj)), seen = vis.filter((it) => !isNewFind(it.obj));
  const starLast = (a, b) => Number(a.obj.natural === 'star') - Number(b.obj.natural === 'star') || a.look.mag - b.look.mag;
  fresh.sort(starLast); seen.sort(starLast);
  const group = (title, items) => { if (!items.length) return; list.insertAdjacentHTML('beforeend', `<div class="t-head">${title} · ${items.length}</div>`);
    items.slice(0, 8).forEach((it) => list.appendChild(row(it)));
    if (items.length > 8) { const more = document.createElement('button'); more.type = 'button'; more.className = 'ui-link vis-more'; more.textContent = `Show all ${items.length} ›`;
      more.addEventListener('click', () => { const frag = document.createDocumentFragment(); items.slice(8).forEach((it) => frag.appendChild(row(it))); more.replaceWith(frag); }); list.appendChild(more); } };
  group('New to you', fresh);
  // Seen before (2026-10-09, Sevaan): the cards you've already collected, as a row of little cards (the "New to
  // collect" strip is gone; new things are the list above). Tap one to aim at it.
  if (seen.length) {
    list.insertAdjacentHTML('beforeend', `<div class="t-head">Seen before · ${seen.length}</div>`);
    const strip = document.createElement('div'); strip.className = 'mini-cards';
    seen.forEach((it) => { const o = it.obj, tier = TIER_INFO[o.tier] ?? TIER_INFO.common, c = document.createElement('button'); c.type = 'button'; c.className = 'mini-card';
      c.innerHTML = `<span class="mc-art">${previewArt(o, 'small', { accent: tier.color })}</span><span class="mc-bd"><small style="color:${tier.color}">◆ ${tier.label}</small><b>${escapeHtml(label(o))}</b><span>${compassPoint(it.look.az)} · ${Math.round(it.look.el)}° up</span></span>`;
      c.setAttribute('aria-label', `${label(o)}, ${compassPoint(it.look.az)}, ${Math.round(it.look.el)} degrees up: aim at it`);
      c.addEventListener('click', () => aimAt(it)); strip.appendChild(c); });
    list.appendChild(strip);
  }
}
$('radar').addEventListener('click', () => { showVTab('now'); openPanel('visible'); });

// ---------- tonight planner ----------
// js/tonight-worker.js forecasts every visible pass from now to dawn (same visibility rules as the live sky).
// The visible panel's Tonight tab shows when satellites are up, a chart, the passes worth looking for, and
// what else is up (planets, constellations with stars you still need). When nothing is lit, a chip under
// the radar says when the next good pass is.
let tonightWorker = null, tonightReq = 0, tonightBusy = false, lastChip = 0;
const fmtTime = (ms) => new Date(ms).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
let tonightAgain = false;
function requestTonight(force = false) {
  if (!state.catalog || !state.observer) return;
  if (tonightBusy) { if (force) tonightAgain = true; return; } // a forced refresh while one runs goes next (QA 2026-10-08)
  const T = state.tonight;
  if (!force && T && Math.abs(now().getTime() - T.startMs) < 20 * 60000 && T.sb === state.skySb && T.lat === state.observer.lat && T.lon === state.observer.lon && T.bino === state.binoculars) return;
  tonightBusy = true;
  const requestId = ++tonightReq, startMs = now().getTime();
  // Stamp the plan with what it was worked out for, not what's current when it arrives (QA 2026-10-08: a location fix
  // landing mid-run left Peterborough's plan labelled as yours for 20 minutes).
  const asked = { sb: state.skySb, lat: state.observer.lat, lon: state.observer.lon, bino: state.binoculars };
  try {
    tonightWorker ??= new Worker(new URL(`./tonight-worker.js?v=${VERSION}`, import.meta.url), { type: 'module' });
    tonightWorker.onmessage = ({ data }) => {
      if (data.requestId !== tonightReq) return;
      tonightBusy = false;
      if (data.error) return;
      state.tonight = { ...data, ...asked };
      if (!$('vtab-tonight').hidden) renderTonight();
      lastChip = 0;
      const stale = asked.sb !== state.skySb || asked.lat !== state.observer.lat || asked.lon !== state.observer.lon || asked.bino !== state.binoculars;
      if (tonightAgain || stale) { tonightAgain = false; requestTonight(true); }
    };
    tonightWorker.onerror = () => { tonightBusy = false; };
    const base = skyLimit({ sb: state.skySb }), faintest = (state.binoculars ? base.binoculars : base.satellites) + 0.5;
    const objects = state.catalog.objects.filter((o) => o.stdMag + 5 * Math.log10(Math.max(o.perigee ?? 400, 200) / 1000) <= faintest);
    tonightWorker.postMessage({ requestId, objects, observer: state.observer, startMs, sb: state.skySb, binoculars: state.binoculars });
  } catch { tonightBusy = false; }
}
function showVTab(tab) {
  document.querySelectorAll('[data-vtab]').forEach((b) => { b.classList.toggle('on', b.dataset.vtab === tab); b.setAttribute('aria-selected', String(b.dataset.vtab === tab)); });
  $('vtab-now').hidden = tab !== 'now'; $('vtab-tonight').hidden = tab !== 'tonight';
  $('visible-title').textContent = 'Up in your sky';
  if (tab === 'tonight') renderTonight();
  else renderVisible(); // always fresh: switching back from Tonight used to show an old (sometimes empty) list (2026-10-08)
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
// Tonight filter (rarity and up, new only), kept while the app is open.
const tlFilter = { min: 0, newOnly: false }, tlExpanded = { next: false, later: false };
// Swipe a pass row right-to-left to reveal its alarm button (2026-10-08). Vertical drags scroll the list as usual.
const SWIPE_W = 88;
function swipeClose(el) { el.classList.remove('open'); el.querySelector('.b-face').style.transform = ''; el.querySelector('.b-alarm').tabIndex = -1; }
function swipeRow(el) {
  const face = el.querySelector('.b-face'); let x0 = 0, y0 = 0, dx = 0, mode = null, base = 0;
  face.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse' && e.button) return; x0 = e.clientX; y0 = e.clientY; dx = 0; mode = null; base = el.classList.contains('open') ? -SWIPE_W : 0; });
  face.addEventListener('pointermove', (e) => {
    if (mode === 'scroll' || (e.buttons === 0 && e.pointerType === 'mouse')) return;
    const mx = e.clientX - x0, my = e.clientY - y0;
    if (!mode) { if (Math.abs(mx) < 8 && Math.abs(my) < 8) return; mode = Math.abs(mx) > Math.abs(my) ? 'swipe' : 'scroll'; if (mode === 'swipe') { face.setPointerCapture?.(e.pointerId); face.style.transition = 'none'; document.querySelectorAll('.b-row.open').forEach((r) => r !== el && swipeClose(r)); } }
    if (mode !== 'swipe') return;
    dx = Math.max(-SWIPE_W - 24, Math.min(0, base + mx)); face.style.transform = `translateX(${dx}px)`;
  });
  const end = () => {
    if (mode !== 'swipe') return; face.style.transition = '';
    const open = dx < -SWIPE_W / 2; el.classList.toggle('open', open); face.style.transform = open ? `translateX(${-SWIPE_W}px)` : ''; el.querySelector('.b-alarm').tabIndex = open ? 0 : -1;
    el.dataset.swiped = '1'; setTimeout(() => delete el.dataset.swiped, 50); mode = null;
  };
  face.addEventListener('pointerup', end); face.addEventListener('pointercancel', end);
}
function renderTonight() {
  const T = state.tonight, t0 = now().getTime();
  if (!T) { $('tonight-summary').textContent = 'Working out tonight\'s sky…'; $('tonight-chart').innerHTML = ''; $('tonight-list').innerHTML = ''; requestTonight(); return; }
  const wins = tonightWindows(T).filter((w) => w.e >= t0);
  const peak = T.curve.filter(([t]) => t >= t0).reduce((a, c) => (c[1] > a[1] ? c : a), [0, 0]);
  const ev = activeEvent(t0) ?? nextEvent(t0), evLine = ev ? (t0 >= ev.start ? `<br><b>${ev.name}</b> meteor shower tonight (${ev.rate}).` : `<br>Next event: <b>${ev.name}</b> meteor shower, ${new Date(ev.start + 30 * 3600e3).toLocaleDateString([], { month: 'short', day: 'numeric' })}.`) : '';
  const wxT = tonightWeather(), wxLine = wxT ? `<br>Sky: <b>${escapeHtml(wxT.line)}</b>${!wxT.ok && wxT.nextClear ? `. Next clear night: <b>${new Date(wxT.nextClear).toLocaleDateString([], { weekday: 'long' })}</b>.` : '.'}` : '';
  // Compact (2026-10-08 playtest: four lines of prose was too dense): a row of stat chips, one short line under it.
  void wxLine; void evLine;
  const tchip = (k, v) => `<span class="ts-chip"><small>${k}</small><b>${v}</b></span>`;
  $('tonight-summary').innerHTML = wins.length
    ? `<span class="ts-row">${tchip('Visible', `${fmtTime(Math.max(wins[0].s, t0))}–${fmtTime(wins[wins.length - 1].e)}`)}${tchip('Busiest', `${fmtTime(peak[0])} · ${peak[1]} up`)}${wxT ? tchip('Sky', escapeHtml(wxT.line)) : ''}</span>${ev && t0 >= ev.start ? `<span class="ts-note">☄ <b>${escapeHtml(ev.name.replace(/\s*\d{4}$/, ''))}</b> meteor shower tonight · ${escapeHtml(ev.rate)}</span>` : ''}${wxT && !wxT.ok && wxT.nextClear ? `<span class="ts-note">Next clear night: <b>${new Date(wxT.nextClear).toLocaleDateString([], { weekday: 'long' })}</b></span>` : ''}`
    : `<span class="ts-note">Nothing bright enough for your sky until dawn. Slide the sky darker if you can see more stars, or try binocular mode.</span>`;
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
  // Pass list, design B (2026-10-08, design/tonight-list.html): small cards with a rarity bar, split into Up next
  // (within 10 min: aim now) and Later tonight. Swipe a row right-to-left to reveal its alarm (Sevaan's idea); passes
  // under 10 minutes away say "Too soon" there, since the alert fires 10 minutes before. Filter: tap a rarity to show
  // it and rarer (tap again for all), plus New only. The night's moments (cloud, busiest, dawn) sit between rows.
  list.classList.remove('tl-mode');
  const allPasses = tonightPasses(T, t0).slice(0, 60);
  const TIERS = ['common', 'uncommon', 'rare', 'epic', 'legendary'], tierIdx = (p) => Math.max(0, TIERS.indexOf(p.obj.tier));
  const passes = allPasses.filter((p) => tierIdx(p) >= tlFilter.min && (!tlFilter.newOnly || p.fresh)).slice(0, 40);
  const chips = document.createElement('div'); chips.className = 'tl-chips';
  chips.innerHTML = TIERS.map((k, i) => { const t = TIER_INFO[k]; const n = allPasses.filter((p) => tierIdx(p) === i).length;
    return `<button type="button" class="tl-chip${i >= tlFilter.min ? ' on' : ''}" data-min="${i}" style="--c:${t.color}"${n ? '' : ' disabled'}><i></i>${t.label}${i === tlFilter.min && i ? '+' : ''}</button>`; }).join('')
    + `<button type="button" class="tl-chip new${tlFilter.newOnly ? ' on' : ''}" data-new>New only</button>`;
  chips.addEventListener('click', (e) => { const c = e.target.closest('.tl-chip'); if (!c || c.disabled) return;
    if (c.hasAttribute('data-new')) tlFilter.newOnly = !tlFilter.newOnly; else { const m = Number(c.dataset.min); tlFilter.min = m === tlFilter.min ? 0 : m; }
    renderTonight(); });
  list.appendChild(chips);
  const marks = [];
  if (wxT?.coverFrom > t0) marks.push([wxT.coverFrom, 'Cloud rolls in', 'cloud']);
  if (wxT?.clearFrom > t0) marks.push([wxT.clearFrom, `Clears${ev && t0 >= ev.start ? ` · ${ev.name.replace(/\s*\d{4}$/, '')} best now` : ''}`, 'clear']);
  if (peak[1] && peak[0] > t0) marks.push([peak[0], `Busiest: ${peak[1]} up at once`, 'peak']);
  if (T.dawn) marks.push([T.dawn, 'Dawn: the sky closes', 'dawn']);
  const markHtml = ([t, txt, k]) => `<div class="t-mark ${k}"><span class="time">${fmtTime(t)}</span><span>${escapeHtml(txt)}</span></div>`;
  marks.sort((a, b) => a[0] - b[0]);
  const SOON = 10 * 60000, soonList = passes.filter((p) => p.start <= t0 + SOON), laterList = passes.filter((p) => p.start > t0 + SOON);
  const row = (p) => {
    const tier = TIER_INFO[p.obj.tier] ?? TIER_INFO.common, key = `${p.obj.id}@${p.start}`, mins = Math.round((p.start - t0) / 60000);
    const canRemind = p.start > t0 + SOON, belled = reminded.has(key);
    const when = p.start <= t0 ? 'up now' : mins < 60 ? `in ${mins} min` : `in ${Math.floor(mins / 60)} h${mins % 60 ? ` ${mins % 60} min` : ''}`;
    const el = document.createElement('div'); el.className = `b-row${canRemind ? '' : ' soon'}`; el.style.setProperty('--c', tier.color);
    el.innerHTML = `<button type="button" class="b-alarm${belled ? ' on' : ''}"${canRemind ? '' : ' disabled'} aria-label="${canRemind ? (belled ? 'Reminder set: tap to turn off' : 'Remind me 10 minutes before') : 'Too soon for a reminder'}">${ICON_BELL}<span>${canRemind ? (belled ? 'Set' : 'Remind') : 'Too soon'}</span></button>
      <div class="b-face" role="button" tabindex="0" aria-label="${escapeHtml(label(p.obj))}, ${fmtTime(p.start)}: open the card"><span class="b-when"><b>${fmtTime(p.start).replace(/\s?[AP]\.?M\.?$/i, '')}</b><small>${when}</small></span>
      <span class="b-main"><span class="b-tier">${tier.label}${p.fresh ? ' · <em>New</em>' : ''}${belled ? ` · <em class="b-set">${ICON_BELL}${fmtTime(p.start - SOON)}</em>` : ''}</span><span class="name">${escapeHtml(label(p.obj))}</span>
      <span class="meta">Rises ${compassPoint(p.riseAz)} · up to ${p.peakEl}° in the ${compassPoint(p.peakAz)} · ${brightnessWord(p.mag)}</span></span>
      <button class="ic showme" type="button" aria-label="Show me in the sky">${ICON_TARGET}</button></div>`;
    el.querySelector('.showme').addEventListener('click', (e) => { e.stopPropagation(); flyToCircle(e.currentTarget); showMePass(p); });
    el.querySelector('.b-alarm').addEventListener('click', (e) => {
      e.stopPropagation(); if (!canRemind) return;
      if (reminded.has(key)) { reminded.delete(key); toast(`Reminder off for ${escapeHtml(label(p.obj))}. If you added it to your calendar, delete it there too.`, 3500); }
      else { remindPass(p); reminded.add(key); }
      renderTonight();
    });
    el.querySelector('.b-face').addEventListener('click', (e) => {
      if (el.dataset.swiped || e.target.closest('.showme')) return; // a swipe isn't a tap
      if (el.classList.contains('open')) { swipeClose(el); return; }
      const from = el.querySelector('.name').getBoundingClientRect(); showTonightCard(p.obj, from, `TONIGHT · ${fmtTime(p.start)}`);
    });
    el.querySelector('.b-face').addEventListener('keydown', (e) => { // Enter opens the card; ← reveals the alarm, → hides it
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.currentTarget.click(); }
      else if (e.key === 'ArrowLeft') { el.classList.add('open'); e.currentTarget.style.transform = `translateX(${-SWIPE_W}px)`; const a = el.querySelector('.b-alarm'); a.tabIndex = 0; a.focus(); }
      else if (e.key === 'ArrowRight') swipeClose(el);
    });
    el.querySelector('.b-alarm').tabIndex = -1; // under the row until it's swiped open (QA 2026-10-08)
    swipeRow(el);
    return el;
  };
  // Ten per section, then "Show all" (2026-10-08, Sevaan: 24 in Up next was a lot).
  const section = (title, sub, items, cls) => {
    if (!items.length) return;
    list.insertAdjacentHTML('beforeend', `<div class="b-sec ${cls}"><span>${title} · ${items.length}</span><span>${sub}</span></div>`);
    const shown = tlExpanded[cls] ? items : items.slice(0, 10);
    for (const p of shown) {
      while (cls === 'later' && marks.length && marks[0][0] <= p.start) list.insertAdjacentHTML('beforeend', markHtml(marks.shift()));
      list.appendChild(row(p));
    }
    if (shown.length < items.length) {
      const more = document.createElement('button'); more.type = 'button'; more.className = 'ui-link vis-more'; more.textContent = `Show all ${items.length} ›`;
      more.addEventListener('click', () => { tlExpanded[cls] = true; const y = list.closest('.panel')?.scrollTop; renderTonight(); if (y != null) list.closest('.panel').scrollTop = y; });
      list.appendChild(more);
    }
  };
  section('Up next', 'Aim now', soonList, 'next');
  section('Later tonight', 'Swipe left for an alert', laterList, 'later');
  for (const mk of marks) list.insertAdjacentHTML('beforeend', markHtml(mk));
  if (!passes.length) list.insertAdjacentHTML('beforeend', `<p class="hint">${allPasses.length ? 'Nothing that rare left tonight. Tap a lower rarity.' : 'No standout passes left tonight.'}</p>`);
  // Show once how the alarm hides behind a row: the first Later row slides open a little and back.
  try { if (!localStorage.getItem('tlSwipeHint')) { const first = list.querySelector('.b-row:not(.soon) .b-face'); if (first && !matchMedia('(prefers-reduced-motion: reduce)').matches) { localStorage.setItem('tlSwipeHint', '1'); setTimeout(() => first.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-64px)', offset: .35 }, { transform: 'translateX(-64px)', offset: .65 }, { transform: 'translateX(0)' }], { duration: 1400, easing: 'cubic-bezier(.3,.7,.3,1)' }), 600); } } } catch {}
  list.insertAdjacentHTML('beforeend', `<div class="t-head">Also up tonight</div>` + alsoUpTonight(t0, T.dawn ?? t0 + 10 * 3600000));
  // At the end: the few worth setting an alarm for (rarest new ones still to come), as little cards with a bell.
  const rank = { legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1 };
  const alarm = tonightPasses(T, t0).filter((p) => p.start > t0 + 15 * 60000 && p.fresh).sort((a, b) => (rank[b.obj.tier] ?? 0) - (rank[a.obj.tier] ?? 0) || a.start - b.start).slice(0, 6);
  if (alarm.length) {
    list.insertAdjacentHTML('beforeend', '<div class="t-head">Worth setting an alarm for</div>');
    const strip = document.createElement('div'); strip.className = 'mini-cards';
    for (const p of alarm) { const o = p.obj, tier = TIER_INFO[o.tier] ?? TIER_INFO.common, key = `${o.id}@${p.start}`, c = document.createElement('div'); c.className = 'mini-card';
      c.innerHTML = `<span class="mc-art">${previewArt(o, 'small', { accent: tier.color })}</span><span class="mc-bd"><small style="color:${tier.color}">◆ ${tier.label}</small><b>${escapeHtml(label(o))}</b><span>${fmtTime(p.start)} · ${compassPoint(p.peakAz)}</span></span><button class="ic remind${reminded.has(key) ? ' on' : ''}" type="button" aria-label="Remind me">${ICON_BELL}</button>`;
      c.querySelector('.remind').addEventListener('click', (e) => { const b = e.currentTarget; if (reminded.has(key)) { reminded.delete(key); b.classList.remove('on'); } else { remindPass(p); reminded.add(key); b.classList.add('on'); } });
      strip.appendChild(c); }
    list.appendChild(strip);
  }
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
  // An older reply for a place you've left is dropped, and a failed fetch can retry in a minute (QA 2026-10-08).
  fetchWeather(o.lat, o.lon).then((w) => { if (key !== weatherKey) return; state.weather = w; updateNextPassChip(); }).catch(() => { if (key === weatherKey) weatherAt = Date.now() - 29 * 60e3; });
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
const FIG8_ART = `<svg viewBox="0 0 72 72" width="40" height="40" aria-hidden="true">
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
  // Not right after opening (2026-10-08, Sevaan: it flashed up on refresh): the compass settles in the first moments,
  // so only ask once it's had 20 s and is still off.
  if (state.liveSince == null || t - state.liveSince < 20000) return;
  const acc = pointing.compassAccuracy, jumped = t - pointing.compassJumpAt < 2000;
  const bad = acc === -1 || acc > 35 || jumped || pointing.compassDoubt > 0.6;
  // 2026-10-07 (Sevaan: sometimes you wave for ages): the moment the compass reads well, the nudge goes.
  if (!bad) { if (toastPending('compass')) dropToast('compass'); return; }
  if (t - compassAskAt < 4 * 60e3) return;
  compassAskAt = t;
  ticket({ kind: 'compass', id: 'compass', eyebrow: 'COMPASS NEEDS A NUDGE', html: true, ms: 7000,
    line: `<span class="tk-art">${FIG8_ART}</span><span class="tk-text">Wave the phone in a slow figure-8, away from metal and cars.</span>` });
}
// ---------- below the horizon (2026-10-06) ----------
// What's under your feet right now: the Sun, Moon and bright planets (with when they next rise) and tonight's next
// few passes (with their start time). Rise times are found by stepping the clock in 10-minute hops; cached.
let riseCache = { at: 0, map: new Map() };
function riseTimes(d) {
  if (Math.abs(d.getTime() - riseCache.at) < 5 * 60e3 && riseCache.obs === state.observer) return riseCache.map;
  const map = new Map(), toEnuAt = (t) => eqToEnu(new Date(t), state.observer), t0 = d.getTime();
  const want = new Set(['Sun', 'Moon', 'Venus', 'Jupiter', 'Mars', 'Saturn', 'Mercury']), paths = {}, pasts = {};
  for (const back of [90, 60, 30]) { const t = t0 - back * 60e3, toEnu = toEnuAt(t); for (const b of solarSystem(new Date(t), state.observer)) if (want.has(b.name)) (pasts[b.name] ??= []).push(toEnu(b.v)); }
  for (let t = t0 + 600e3; t <= t0 + 30 * 3600e3 && map.size < want.size; t += 600e3) {
    const toEnu = toEnuAt(t);
    for (const b of solarSystem(new Date(t), state.observer)) {
      if (!want.has(b.name) || map.has(b.name)) continue;
      const e = toEnu(b.v), pth = (paths[b.name] ??= []);
      pth.push(e);
      if (e[2] > 0) map.set(b.name, { t, az: (Math.atan2(e[0], e[1]) * 180 / Math.PI + 360) % 360, path: pth, past: pasts[b.name] });
    }
  }
  riseCache = { at: t0, obs: state.observer, map }; return map;
}
let belowAt = 0, belowList = null;
// …and the few minutes it has just travelled (where it came from), 20 s steps.
function satPast(o, t0) {
  const key = `past:${o.id}`, hit = satPaths.get(key);
  if (hit && Math.abs(t0 - hit.at) < 5000) return hit.path;
  const path = [];
  for (let t = t0 - 4 * 60e3; t < t0; t += 20e3) { const l = look(o, frame(new Date(t), state.observer)); if (l) path.push(enuFromAzEl(l.az, l.el)); }
  satPaths.set(key, { at: t0, path }); return path;
}
// A satellite's track under the ground for the last ~12 minutes before it comes up (20 s steps), cached briefly.
const satPaths = new Map();
function satPath(o, t0, start) {
  const key = `${o.id}:${start}`, hit = satPaths.get(key);
  if (hit && Math.abs(t0 - hit.at) < 5000) return hit.path;
  const path = [];
  // From where it is now to where it rises (2026-10-08, Sevaan: the old 12-minute tail floated free of the satellite).
  // Further off than ~25 minutes it would wrap round the Earth, so no line; the marker and its time still show.
  if (start - t0 > 25 * 60e3) { satPaths.set(key, { at: t0, path: null }); return null; }
  const step = Math.max(10e3, (start - t0) / 50);
  for (let t = t0; t <= start + 20e3; t += step) { const l = look(o, frame(new Date(t), state.observer)); if (l) path.push(enuFromAzEl(l.az, l.el)); }
  if (satPaths.size > 40) satPaths.clear();
  satPaths.set(key, { at: t0, path }); return path;
}
function belowGhosts(d) {
  const back = state.basis?.back; if (!back || back[2] > 0.15 || !state.bodies) return null;
  if (belowList && performance.now() - belowAt < 1000) return belowList;
  belowAt = performance.now();
  const out = [], rises = riseTimes(d), whenOf = (r) => (r ? `rises ${fmtTime(r.t)}` : '');
  for (const b of state.bodies) {
    if (b.enu[2] >= 0 || b.kind === 'star') continue;
    if (b.kind === 'planet' && b.mag > 2) continue;
    const r = rises.get(b.kind === 'sun' ? 'Sun' : b.kind === 'moon' ? 'Moon' : b.name);
    // path (2026-10-07, Sevaan): where it travels under the ground until it rises, as a dotted line.
    out.push({ enu: b.enu, kind: b.kind, name: b.kind === 'sun' ? 'The Sun' : b.kind === 'moon' ? 'The Moon' : b.name, note: whenOf(r), riseAz: r?.az, where: r ? compassPoint(r.az) : '', time: r ? fmtTime(r.t) : '', path: r ? [b.enu, ...r.path] : null, past: r?.past });
  }
  const T = state.tonight, t0 = d.getTime();
  if (T && state.frame) for (const p of tonightPasses(T, t0).filter((x) => x.start > t0).slice(0, 4)) {
    const o = state.byId.get(p.id); if (!o) continue;
    const l = look(o, state.frame); if (!l || l.el >= 0) continue;
    out.push({ enu: enuFromAzEl(l.az, l.el), kind: 'sat', name: label(o), note: `up ${fmtTime(p.start)}`, riseAz: p.riseAz, where: compassPoint(p.riseAz), time: fmtTime(p.start), path: satPath(o, t0, p.start), past: satPast(o, t0) });
  }
  return (belowList = out);
}
// A nudge back up after a few seconds of looking at the ground with nothing selected.
let groundSince = null, groundShown = false;
function groundHint(t) {
  const g = $('guidance'), back = state.basis?.back;
  const down = back && back[2] < -0.26 && !state.pinnedId && !state.activeTarget;
  if (!down) { groundSince = null; if (groundShown) { g.hidden = true; g.classList.remove('ground'); groundShown = false; } return; }
  groundSince ??= t;
  if (groundShown) { g.hidden = false; return; } // renderTarget hides #guidance when nothing's targeted; keep it up
  if (t - groundSince < 3000) return;
  const T = state.tonight, t0 = now().getTime(), next = T ? tonightPasses(T, t0).find((p) => p.start > t0) : null;
  g.textContent = next ? `Looking at the ground. Raise your phone: ${label(next.obj)} comes up in the ${compassPoint(next.riseAz)} at ${fmtTime(next.start)}.` : 'Looking at the ground. Raise your phone to the sky.';
  g.classList.add('ground'); g.hidden = false; groundShown = true;
}
// The chip in the upper right (2026-10-06, Sevaan: out of the way of the sky labels): label / name / detail ›.
// Compact (2026-10-06): a short detail rides on the label line ('NEXT UP · 9:44 PM ›' over the name); a long one gets its own line.
// One line (2026-10-06): 'NEXT UP · COSMOS 2082 · 9:44 PM ›', one size, the name bold orange (it gives way with … first).
// 'NEXT: COSMOS 2082 · 9:44 PM' (2026-10-07: a colon instead of a dot after the label, no ›, so the name gets the room).
const npChip = (k, n, m) => `<span class="np-k">${escapeHtml(k)}:</span><b class="np-n">${escapeHtml(n)}</b>${m ? `<span class="np-m">· ${escapeHtml(m)}</span>` : ''}`;
function updateNextPassChip() {
  // The radar fades in together with the next-up chip, once tonight's plan is in (fallback: 4 s after the sky opens).
  if (!document.body.classList.contains('hud-ready') && (state.tonight || performance.now() - (state.skyOpenedAt ?? 0) > 4000)) document.body.classList.add('hud-ready');
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
      // Daytime: 'TONIGHT: ISS · 7:16 PM' (2026-10-08, Sevaan: it didn't fit and the name vanished). Dusk and a good
      // forecast are left out; bad weather has its own 'Not tonight' chip above.
      : npChip('Tonight', best ? label(best.obj) : 'See the plan', best ? fmtTime(best.start) : (dusk ? `dark ${dusk}` : ''));
    chip.hidden = false; return;
  }
  chip.innerHTML = next ? npChip(dark ? 'Next' : `From ${fmtTime(win?.s ?? next.start)}`, label(next.obj), fmtTime(next.start))
    : win ? npChip('Nothing lit right now', `Back at ${fmtTime(win.s)}`, 'See the plan') : npChip('No more satellites', 'Tonight', 'See what else is up');
  chip.hidden = false;
}
$('nextpass').addEventListener('click', () => { showVTab('tonight'); openPanel('visible'); });
// Meteor shower events (js/events.js): a banner while one is on; catching anything earns its badge.
function updateEventBanner() {
  const e = activeEvent(now().getTime()), el = $('event-banner');
  if (!e) { if (!el.hidden) el.hidden = true; return; }
  const got = state.sightings.some((s) => eventOf(s)?.id === e.id);
  if (got) { if (!el.hidden) el.hidden = true; return; } // badge earned: the banner has done its job (2026-10-07)
  let read = false; try { read = localStorage.getItem('eventRead') === e.id; } catch {}
  if (read) { if (!el.hidden) el.hidden = true; return; } // tapped and read (2026-10-08): it goes away
  // A chip like the next-up one (2026-10-08): one line, the name bold gold.
  const html = `<span class="np-k">☄</span><b class="np-n">${escapeHtml(e.name.replace(/\s*\d{4}$/, ''))}</b><span class="np-m">· badge tonight</span>`;
  if (el.innerHTML !== html) el.innerHTML = html;
  el.hidden = false;
}
$('event-banner').addEventListener('click', () => { const e = activeEvent(now().getTime()); if (e) { try { localStorage.setItem('eventRead', e.id); } catch {} $('event-banner').hidden = true; } if (e) toast(`${e.name.replace(/\s*\d{4}$/, '')} · ${e.rate}. Catch anything tonight for the badge.`, 5500); });

// ---------- drag to look ----------

let dragStart = null, tapStart = null;
$('sky').addEventListener('pointerdown', (e) => {
  tapStart = { x: e.clientX, y: e.clientY, t: performance.now() };
  if (!state.drag.on && hasLiveSensors()) return;
  if (!hasLiveSensors()) state.drag.on = true; // no motion sensors (a computer): dragging is how you look, so targets work (2026-10-08)
  state.followPreview = false;
  dragStart = { x: e.clientX, y: e.clientY, az: state.drag.az, el: state.drag.el };
  $('sky').setPointerCapture(e.pointerId);
});
$('sky').addEventListener('pointermove', (e) => {
  if (!dragStart) return;
  const degPerPx = sky.fovV / sky.h;
  state.drag.az = (dragStart.az - (e.clientX - dragStart.x) * degPerPx + 360) % 360;
  state.drag.el = Math.max(-89, Math.min(89, dragStart.el + (e.clientY - dragStart.y) * degPerPx)); // all the way down to your feet (2026-10-08)
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
let panelHideTimer = 0;
function openPanel(id) {
  // A panel closed a moment ago is still sliding away: cancel its hide (QA 2026-10-08: reopening within 300 ms left
  // it hidden with the sky paused and the HUD inert, so only a reload got you out).
  clearTimeout(panelHideTimer); $(id).classList.remove('leaving'); $(id).style.transform = '';
  if (activePanel) $(activePanel).hidden = true;
  else panelReturn = document.activeElement;
  activePanel = id; $(id).hidden = false; $('hud').inert = true;
  $(id).querySelector('button, a, input')?.focus({ preventScroll: true });
}
function closePanel(id = activePanel) {
  if (!id) return;
  if (id === 'reveal') stopReveal();
  const el = $(id); activePanel = null; $('hud').inert = false;
  // Slide away, then hide (2026-10-08 polish); the reveal has its own exit.
  if (id !== 'reveal' && el.classList.contains('panel') && !matchMedia('(prefers-reduced-motion: reduce)').matches) { el.classList.add('leaving'); clearTimeout(panelHideTimer); panelHideTimer = setTimeout(() => { if (activePanel === id) return; el.hidden = true; el.classList.remove('leaving'); el.style.transform = ''; }, 300); }
  else el.hidden = true;
  if (panelReturn?.isConnected) panelReturn.focus({ preventScroll: true });
}
function openDebug() {
  // Leaving the tour for Settings ends the tour (2026-10-08, Sevaan).
  if (!$('onboard').hidden) { $('ob-skip').click(); $('onboard').hidden = true; $('ob-done').hidden = true; document.body.classList.remove('ob-tour'); }
  renderDebug(); renderLocation(); openPanel('debug');
}
$('nav-more').addEventListener('click', openDebug);
$('nav-explore').addEventListener('click', () => closePanel());
$('retry-location').addEventListener('click', () => requestLocation({ gps: true }));
$('retry-motion').addEventListener('click', enableMotion);
$('location-form').addEventListener('submit', e => {
  e.preventDefault();
  const lat = Number($('latitude').value), lon = Number($('longitude').value);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat)>90 || Math.abs(lon)>180) return;
  locationRequest++;
  state.observer = { lat, lon, label:'Chosen location' }; state.locationStatus='manual';
  try { localStorage.setItem('observer', JSON.stringify({ lat, lon, label: 'Chosen location', manual: true })); } catch {}
  state.model?.reset(); state.rising?.reset(); state.trails.clear(); cancelPassSearch(); renderLocation(); refreshAbove();
});
document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => closePanel(b.dataset.close)));
onRevealDismiss(() => closePanel('reveal'));
document.addEventListener('keydown', e => {
  if (!activePanel) return;
  if (e.key === 'Escape') { const sh = document.querySelector('.set-sheet.in'); if (sh) { closeSheet(sh); return; } closePanel(); return; } // an open Settings sheet first (QA 2026-10-08)
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
      // Just the time of the pass (2026-10-08, Sevaan): no pinning or following; you look around yourself.
      state.preview=false; state.followPreview=false; state.timeOffsetMs=pass.dateMs-Date.now(); state.pinnedId=null; state.targetId=null; state.sticky.clear();
      afterTimeJump(); closePanel();
      $('next-pass-info').textContent=`Showing ${label(obj)}'s pass at ${new Date(pass.dateMs).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}. Tap Now to come back.`;
      ticket({ kind: 'mission', eyebrow: 'JUMPED AHEAD', line: `${new Date(pass.dateMs).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} · ${label(obj)} is up in the ${compassPoint(pass.look.az)}`, ms: 4000 });
    };
    passWorker.postMessage({requestId,objects:state.catalog.objects.filter(o=>o.stdMag<=4.5 || o.id===objectId),objectId,dateMs:start.getTime(),observer:state.observer,binoculars:state.binoculars,limit:skyLimit({ sb: state.skySb })}); // the dark-sky limit: the search only looks at dark hours (QA 2026-10-08: by day it used the daytime limit for all 48 h)
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
  requestTonight(true); // the plan was for another time (QA 2026-10-08)
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
$('chk-stars').checked = state.showStars;
$('chk-stars').addEventListener('change', (e) => { state.showStars = e.target.checked; writePref('showStars', state.showStars); });
$('chk-landscape').checked = state.landscape;
$('chk-landscape').addEventListener('change', (e) => { state.landscape = e.target.checked; writePref('landscape', state.landscape); });
$('chk-lines').checked = state.showLines;
$('chk-lines').addEventListener('change', (e) => { state.showLines = e.target.checked; writePref('lines', state.showLines); });
$('chk-any').addEventListener('change', (e) => { state.captureAny = e.target.checked; });
// ---------- the sky slider (2026-10-06): an "exposure" control above the switcher ----------
// Drag until the stars and satellites on screen match what you can actually see; it's saved for next time.
// It sets your sky's own darkness; twilight and the Moon still dim things on top of it automatically.
// The sky slider is off the Explore screen and the sky starts at its darkest (2026-10-09, Sevaan). Everyone is moved
// to the darkest once ('skyMax1'); Settings → How dark is your sky? still changes it.
{ const saved = Number(readText('skySb', '')); let fresh = false; try { fresh = !localStorage.getItem('skyMax1'); localStorage.setItem('skyMax1', '1'); } catch {}
  state.skySb = !fresh && saved >= SB_MIN && saved <= SB_MAX ? saved : SB_MAX;
  if (fresh) try { localStorage.setItem('skySb', String(SB_MAX)); } catch {} }
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
  nudgeHeading(Number(b.dataset.nudge)); lockHeading(true); // a hand correction holds
  renderDebug();
}));

function renderDebug() {
  const d = now();
  $('sim-time-label').textContent = `${d.toLocaleString()}${state.timeOffsetMs ? ' (simulated)' : ' (current time)'}`;
  const n = getNudge();
  $('nudge-label').textContent = `${Math.round(n > 180 ? n - 360 : n)}°`;
  $('chk-drag').checked = state.drag.on;
  renderSettings();
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
    `declination  ${getDeclination().toFixed(1)}° (applied to iOS compass)`,
    `catalogue      ${cat?.objects.length ?? 0} objects, data ${ageH} h old`,
    `above horizon  ${state.model?.above.size ?? 0} (${state.items.filter((i) => i.look.visible).length} visible)`,
    `binoculars     ${state.binoculars ? 'on' : 'off'}`,
    `sky            ${skyNameFor(state.skySb)} (${state.skySb.toFixed(2)} mag/arcsec²): stars ${state.limit?.stars.toFixed(1)}, satellites ${state.limit?.satellites.toFixed(1)} (bino ${state.limit?.binoculars.toFixed(1)}), ${state.limit?.sb.toFixed(1)} mag/arcsec²`,
  ].join('\n');
}

// ---------- start and return from the collection ----------
function enterSky() {
  setTimeout(loadCollection, 2500); // warm the Collection layer once the sky is running
  state.skyOpenedAt ??= performance.now();
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
let obAimTarget = null;
// Keep the tour card's arrow pointing at the target: angle on screen = target azimuth − your heading; it also says how far.
function obAimTick() {
  requestAnimationFrame(obAimTick);
  const g = document.querySelector('#ob-deck .ob-aim'); if (!g || !obAimTarget || !state.basis) return;
  const b = state.basis.back, heading = (Math.atan2(b[0], b[1]) / RAD + 360) % 360, myEl = Math.asin(Math.max(-1, Math.min(1, b[2]))) / RAD;
  const tl = obAimTarget.look, dAz = ((tl.az - heading + 540) % 360) - 180, dEl = tl.el - myEl;
  const ang = Math.atan2(dAz, dEl) * 180 / Math.PI, off = Math.hypot(dAz, dEl);
  g.querySelector('.ob-arrow').setAttribute('transform', `rotate(${ang.toFixed(1)} 150 60)`);
  g.querySelector('.ob-arrow').style.opacity = off < 6 ? 0 : 1;
  const msg = off < 6 ? 'Right there' : `${Math.abs(dAz) > 8 ? `Turn ${dAz > 0 ? 'right' : 'left'} ${Math.round(Math.abs(dAz))}°` : ''}${Math.abs(dAz) > 8 && Math.abs(dEl) > 8 ? ' · ' : ''}${Math.abs(dEl) > 8 ? `${dEl > 0 ? 'up' : 'down'} ${Math.round(Math.abs(dEl))}°` : ''}`;
  const t = g.querySelector('.ob-aim-txt'); if (t.textContent !== msg) t.textContent = msg;
}
requestAnimationFrame(obAimTick);
const OB_ART = {
  aim: (az, el) => `<svg class="ob-aim" viewBox="0 0 300 120" aria-hidden="true"><circle cx="150" cy="60" r="30" fill="none" stroke="#fff2b3" stroke-opacity=".6" stroke-width="1.5"/><circle cx="150" cy="60" r="36" fill="none" stroke="#627a8b" stroke-opacity=".5" stroke-dasharray="2 5"/>
    <g class="ob-arrow" style="transition:opacity .3s"><path d="M150 14 L141 30 L147 30 L147 42 L153 42 L153 30 L159 30 Z" fill="#fa8127"/></g><circle cx="150" cy="60" r="3" fill="#fff2b3" opacity=".7"/>
    <text class="ob-aim-txt" x="150" y="114" text-anchor="middle" fill="#fa8127" font-family="SC Label, Arial Narrow, sans-serif" font-size="12" letter-spacing="2"></text></svg>`,
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
  if (steps[k].gold && !matchMedia('(prefers-reduced-motion: reduce)').matches) setTimeout(() => top.classList.add('shimmer'), 350); // the catch card arrives with a shine (2026-10-09, Sevaan)
  top.addEventListener('pointermove', (e) => { const r = top.getBoundingClientRect(); top.style.setProperty('--bgx', `${(30 + (e.clientX - r.left) / r.width * 40).toFixed(1)}%`); top.style.setProperty('--o', '1'); });
  top.addEventListener('pointerleave', () => top.style.setProperty('--o', '0'));
  return new Promise((resolve) => {
    onboarding = { resolve };
    const go = (yes) => { top.style.setProperty('--x', `${yes ? 130 : -130}vw`); top.style.setProperty('--r', `${yes ? 22 : -22}deg`); top.classList.add('gone'); setTimeout(() => resolve(yes), 300); };
    top.querySelector('.yes').addEventListener('click', () => { steps[k].onYes?.(); go(true); }); // onYes runs inside the tap (iOS permissions)
    top.querySelector('.no')?.addEventListener('click', () => go(false));
  });
}
// Wake the sky after the location step: unblur, brighten, and swing round into place (a bigger swing when it's
// really your sky). Then the lock line says what happened.
function obWake(real) {
  const sk = $('sky'); sk.classList.remove('asleep'); sk.classList.add('waking'); setTimeout(() => sk.classList.remove('waking'), 2200);
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) state.viewSpin = { t0: performance.now(), ms: real ? 2200 : 1400, az: real ? 140 : 50 };
  setTimeout(() => obReact(real ? 'Sky lined up to your spot' : 'An example sky for now'), real ? 1500 : 900);
}
// After the motion step: a pulse from the circle and "You're in control", or with a finger a gentle sway of the
// sky and "Drag to look around".
function obControl(motion) {
  sky.lockPulseAt = performance.now(); buzz?.(20);
  if (!motion && !matchMedia('(prefers-reduced-motion: reduce)').matches) state.viewSpin = { t0: performance.now(), ms: 1800, az: 14, sway: true };
  // (no words over the sky: the "You're in control" text and rocking phone were removed, 2026-10-09, Sevaan)
}
function obReact(line) {
  let b = document.querySelector('.ob-bloom'); if (!b) { b = document.createElement('div'); b.className = 'ob-bloom'; document.body.append(b); }
  b.classList.remove('go'); void b.offsetWidth; b.classList.add('go');
  void line; // the bloom only: no words over the sky during the tour (2026-10-09, Sevaan)
}
async function runOnboarding(force = false) {
  if (!force && state.sightings.some((x) => !x.sim)) { await enableMotion(); requestLocation(); return; } // not a first run
  const ob = $('onboard'); ob.hidden = false; $('ob-done').hidden = true; $('ob-pips').hidden = false; $('ob-skip').hidden = false; state.pinnedId = null; state.targetId = null;
  let skipped = false; $('ob-skip').onclick = () => { skipped = true; onboarding?.resolve(false); };
  document.body.classList.add('ob-tour');
  let motionAsk = null;
  const night = (state.frame?.sunEl ?? -90) < -6;
  const steps = [
    { tier: 'Step 1 of 2', title: 'Set location', sub: ['Navigation', ''], art: OB_ART.loc, text: 'Your location sets which stars and satellites are overhead. It stays on this phone.', yes: 'Allow', no: 'Not now' },
    { tier: 'Step 2 of 2', title: "Point, don't scroll", sub: ['Gyroscope', ''], art: OB_ART.motion, text: "With motion on, the circle follows the phone. Whatever sits in the circle is what you're looking at.", yes: 'Allow motion', no: 'Use a finger', onYes: () => { motionAsk = enableMotion(); } },
    { tier: 'Assignment 01', title: 'Your first catch', sub: ['Up right now', ''], art: OB_ART.catch, text: '', yes: 'Go', gold: true },
  ];
  let tgt0 = null;
  const nameTarget = () => { tgt0 = firstTarget(); if (!tgt0) return; steps[2].title = `Catch ${label(tgt0.obj)}`; steps[2].sub = [tgt0.obj.type === 'star' ? 'Bright star' : tgt0.obj.type === 'sun' ? 'Our star' : tgt0.obj.type === 'moon' ? 'The Moon' : tgt0.obj.natural ? 'Planet' : 'Satellite', `${Math.round(tgt0.look.el)}° up in the ${compassPoint(tgt0.look.az)}`]; steps[2].text = `It's up right now. ${tgt0.hint} Follow the arrow, then tap the circle to collect your first card.`;
    // The card's art becomes a live pointer (2026-10-08, Sevaan): the circle with an arrow that turns toward the target as you turn.
    steps[2].art = OB_ART.aim(tgt0.look.az, tgt0.look.el); obAimTarget = tgt0;
 };
  steps[2].text = 'Sweep the sky. When something lines up in the circle, tap it to collect your first card.';
  // The sky starts asleep behind the cards: blurred, dim and turned away. Each permission wakes part of it.
  $('sky').classList.add('asleep');
  // 1. location: the sky wakes and swings round into your real sky
  if (await obCard(steps, 0)) { const ok = requestLocation(); await ok; obWake(true); } // the sky swings into place behind the next card
  else obWake(false);
  if (skipped) return obFinish(false);
  // 2. motion (asked inside the tap above): "you're in control"; with a finger, the sky sways to show it moves
  if (await obCard(steps, 1)) { await motionAsk; obControl(true); } else { state.drag.on = true; $('chk-drag').checked = true; obControl(false); }
  if (skipped) return obFinish(false);
  // 3. the assignment (the sky-darkness step is gone, 2026-10-09: the sky starts at its darkest)
  nameTarget(); // now that location and motion are in, name what's up
  await obCard(steps, 2); if (skipped) return obFinish(false);
  $('ob-deck').replaceChildren(); $('ob-pips').hidden = true; $('ob-skip').hidden = true; document.body.classList.remove('ob-tour'); // the cards are done: hunting the target is just the app
  // the first catch: pin the surest target; the normal aim + reveal takes over
  const target = firstTarget() ?? tgt0;
  if (target) guideTo(target.obj, target.look, target.hint); // same steering as Tonight → Show me
  ob.style.pointerEvents = 'none';
  // wait for the first card (or a skip), then close
  // QA 2026-10-08: only the tour's own catch counts (an owned object auto-logged during a replay used to end the
  // tour), and leaving for Settings counts as skipping (it used to carry on to the finish page).
  const tourCatches = () => state.sightings.filter((x) => !x.sim && (state.tourCatchId == null || x.objectId === state.tourCatchId)).length;
  state.tourCatchId = target?.obj.id ?? null; state.tourRevealed = false;
  const had = tourCatches();
  await new Promise((resolve) => { onboarding = { resolve }; const t = setInterval(() => { if (state.tourRevealed || tourCatches() > had) { clearInterval(t); resolve(true); } }, 500); $('ob-skip').onclick = () => { skipped = true; clearInterval(t); resolve(false); }; });
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
  $('sky').classList.remove('asleep'); // never leave the sky asleep (a skip mid-tour)
  const ob = $('onboard'); ob.style.pointerEvents = ''; onboarding = null; document.body.classList.remove('ob-tour'); state.tourCatchId = null; state.tourRevealed = false; $('ob-deck').replaceChildren(); $('ob-pips').hidden = false;
  if (!caught) { ob.hidden = true; return; }
  const T = state.tonight, t0 = now().getTime(), wx = tonightWeather();
  const peak = T ? T.curve.filter(([t]) => t >= t0).reduce((a, c) => (c[1] > a[1] ? c : a), [0, 0]) : null;
  const best = T ? (tonightPasses(T, t0).find((p) => p.fresh && p.start > t0) ?? tonightPasses(T, t0).find((p) => p.start > t0)) : null;
  // The page by weather (2026-10-08, design/tonight-weather.html): clear · clearing later · clouding over · bad.
  const kase = wx?.kase ?? 'clear', dusk = T?.dusk && T.dusk > t0 ? T.dusk : t0, dawn = T?.dawn ?? null;
  const passes = T ? tonightPasses(T, t0).filter((p) => p.start > t0) : [];
  const after = (t) => passes.filter((p) => p.start >= t), before = (t) => passes.filter((p) => p.start < t);
  const pickBest = (list) => list.find((p) => p.fresh) ?? list[0] ?? null;
  const peakIn = (s, e) => (T ? T.curve.filter(([t]) => t >= s && t <= e).reduce((a, c) => (c[1] > a[1] ? c : a), [0, 0]) : [0, 0]);
  const passLine = (p) => `<em>${escapeHtml(label(p.obj))}</em> · ${p.peakEl >= 50 ? 'high' : p.peakEl >= 25 ? 'well up' : 'low'} in the ${compassPoint(p.peakAz)}, ${p.peakEl}° up${p.fresh ? ' · new to you' : ''}`;
  let items = [], chosen = null;
  const done = $('ob-done'); done.className = `ob-done wx-${kase}`;
  let sky = `<div class="od-stars">${Array.from({ length: kase === 'bad' ? 0 : 36 }, () => `<i style="left:${(Math.random() * 100).toFixed(1)}%;top:${(Math.random() * 30).toFixed(1)}%"></i>`).join('')}</div>`;
  if (kase === 'clearing') {
    chosen = pickBest(after(wx.clearFrom)); const pk = peakIn(wx.clearFrom, dawn ?? Infinity);
    items = [[dusk, 'Dark, but cloudy', 'cloud'], [wx.clearFrom, 'Clouds part'], ...(chosen ? [[chosen.start, passLine(chosen), 'hot']] : []), ...(pk[1] ? [[pk[0], `Busiest: ${pk[1]} up at once`]] : [])];
    if (wx.clearFrom - dusk > 90 * 60e3) items.splice(1, 0, [dusk + (wx.clearFrom - dusk) / 2, 'Still covered', 'cloud']);
    $('od-eyebrow').textContent = 'Worth the wait'; $('ob-done-title').innerHTML = `Clear<br>by ${escapeHtml(fmtTime(wx.clearFrom))}.`; $('od-sub').textContent = `Cloudy at dusk · clearing from ${fmtTime(wx.clearFrom)}`;
    sky += cloudsHtml(0.75);
  } else if (kase === 'closing') {
    const win = before(wx.coverFrom); chosen = pickBest(win); const last = win[win.length - 1];
    items = [[dusk, 'Dark enough to start'], ...(chosen ? [[chosen.start, passLine(chosen), 'hot']] : []), ...(last && last !== chosen ? [[last.start, 'Last good pass before the cloud']] : []), [wx.coverFrom, 'Clouding over', 'cloud']];
    $('od-eyebrow').textContent = 'Go early'; $('ob-done-title').innerHTML = `Clear until<br>${escapeHtml(fmtTime(wx.coverFrom))}.`; $('od-sub').textContent = `A short window · go before ${fmtTime(wx.coverFrom)}`;
    sky += cloudsHtml(0.55, { side: 'right' });
  } else if (kase === 'bad') {
    const wordOf = { rain: 'Rain', snow: 'Snow', storm: 'Storms', fog: 'Fog', cloudy: 'Cloud' }, iconOf = { clear: '✦', mostly: '✦', cloudy: '☁️', rain: '🌧', snow: '❄️', storm: '⛈', fog: '🌫' };
    const next = wx.nights.find((n, i) => i > 0 && (n.kind === 'clear' || n.kind === 'mostly'));
    const day = (t) => new Date(t).toLocaleDateString([], { weekday: 'long' });
    $('od-eyebrow').textContent = `${wordOf[wx.worst] ?? 'Cloud'} all night`; $('ob-done-title').innerHTML = 'Not tonight,<br>but soon.';
    $('od-sub').textContent = next ? `Next clear night: ${day(next.t)}` : 'No clear night in the forecast yet';
    $('od-body').innerHTML = `<span class="od-sub" style="margin:0">The next few nights</span><div class="od-week">${wx.nights.map((n) => `<div class="${n.kind === 'clear' || n.kind === 'mostly' ? 'ok' : ''}"><b>${new Date(n.t).toLocaleDateString([], { weekday: 'short' })}</b><i>${iconOf[n.kind] ?? '☁️'}</i><small>${n.kind === 'mostly' ? 'Mostly clear' : n.kind === 'clear' ? 'Clear' : wordOf[n.kind] ?? 'Cloud'}</small></div>`).join('')}</div>
      ${next ? `<p class="od-note"><em>${day(next.t)}</em> looks clear. We'll have the best passes ready that evening.</p>` : ''}`;
    sky += cloudsHtml(1, { dark: true }) + (['rain', 'storm'].includes(wx.worst) ? rainHtml() : '');
    $('od-sky').innerHTML = sky;
    $('ob-remind').hidden = !next; $('ob-remind').firstElementChild.textContent = next ? `Remind me ${day(next.t)}` : 'Remind me';
    $('ob-remind').onclick = () => { if (!next) return; const url = URL.createObjectURL(new Blob([passIcs({ title: 'Clear night for Space Collector', start: next.t, end: next.t + 3600e3, description: 'The forecast says clear: open Space Collector and look up. https://sevaan.github.io/space-collector/' })], { type: 'text/calendar' })); const a = document.createElement('a'); a.href = url; a.download = 'space-collector-clear-night.ics'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 5000); toast('Added to your calendar.', 2500); };
    $('ob-explore').firstElementChild.textContent = 'Explore the sky anyway';
    $('ob-explore').onclick = () => { ob.hidden = true; $('ob-done').hidden = true; };
    $('ob-done').hidden = false;
    return;
  } else {
    chosen = best; const pk = peakIn(t0, dawn ?? Infinity);
    items = [[dusk, T?.dusk && T.dusk > t0 ? 'Dark enough to start' : "It's dark: go now"], ...(chosen ? [[chosen.start, passLine(chosen), 'hot']] : []), ...(pk[1] ? [[pk[0], `Busiest: ${pk[1]} satellites up at once`]] : []), ...(dawn ? [[dawn, 'Dawn: the sky closes']] : [])];
    $('od-eyebrow').textContent = "You're set"; $('ob-done-title').innerHTML = 'Tonight<br>looks good.'; $('od-sub').textContent = `${wx ? wx.line : 'Clear skies'}${pk[1] ? ` · ${pk[1]} satellites at the peak` : ''}`;
  }
  $('od-sky').innerHTML = sky;
  items.sort((a, b) => a[0] - b[0]);
  $('od-body').innerHTML = `<div class="od-tl">${items.map(([t, s, c]) => `<div class="it ${c ?? ''}"><b>${escapeHtml(fmtTime(t).replace(/\s?[AP]\.?M\.?$/i, ''))}</b><span>${s}</span></div>`).join('')}</div>`;
  const best2 = chosen;
  // Only offer a reminder that's still ahead (2026-10-09 tour test: "Remind me at 7:36" showed at 7:46 for a pass up now).
  const remindable = best2 && best2.start - 10 * 60e3 > now().getTime() + 60e3;
  $('ob-remind').hidden = !remindable; if (remindable) $('ob-remind').firstElementChild.textContent = `Remind me at ${fmtTime(best2.start - 10 * 60e3).replace(/\s?[AP]\.?M\.?$/i, '')}`;
  $('ob-remind').onclick = () => { if (remindable) remindPass(best2); };
  $('ob-explore').firstElementChild.textContent = 'Explore the sky';
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

// ---------- Collection as a layer (2026-10-07, Sevaan: one page, seamless) ----------
// cards.html runs inside #collection-frame (?embed=1), loaded quietly once the sky is up. The switcher and every
// "cards.html…" link show it instead of navigating; it posts {sc:'explore'} to come back. The sky pauses while it's
// open. After a capture it reloads in the background so it's current next time; back/swipe-back closes it.
let collectionOpen = false, collectionDirty = false;
const colFrame = $('collection-frame');
let colLoaded = false;
function loadCollection() { if (!colFrame.src) { colLoaded = false; colFrame.src = 'cards.html?embed=1'; } }
function collectionStale() { if (!colFrame.src) return; if (collectionOpen) collectionDirty = true; else { colLoaded = false; colFrame.src = 'cards.html?embed=1'; } }
function sendInsets() {
  const probe = document.createElement('div'); probe.style.cssText = 'position:fixed;visibility:hidden;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)';
  document.body.append(probe); const cs = getComputedStyle(probe), top = parseFloat(cs.paddingTop) || 0, bottom = parseFloat(cs.paddingBottom) || 0; probe.remove();
  colFrame.contentWindow?.postMessage({ sc: 'insets', top, bottom }, location.origin);
}
colFrame.addEventListener('load', () => { colLoaded = true; if (collectionOpen) colFrame.classList.add('open'); sendInsets(); if (collectionOpen && pendingKey) { colFrame.contentWindow.postMessage({ sc: 'open', key: pendingKey }, location.origin); pendingKey = ''; } });
let pendingKey = '';
function openCollection(key = '') {
  saveExploreState();
  if (collectionDirty && !collectionOpen) { collectionDirty = false; colLoaded = false; colFrame.src = 'cards.html?embed=1'; }
  loadCollection();
  if (!collectionOpen) { collectionOpen = true; try { history.pushState({ sc: 'collection' }, ''); } catch {} }
  // Fade in only once it has painted (2026-10-07: a not-yet-loaded frame flashed white); load does it otherwise.
  colFrame.hidden = false; if (colLoaded) colFrame.classList.add('open');
  const w = colFrame.contentWindow;
  if (w && colFrame.contentDocument?.readyState === 'complete' && w.location.href !== 'about:blank') w.postMessage({ sc: 'show', key }, location.origin);
  else pendingKey = key;
}
async function closeCollection(fromHistory = false) {
  if (!collectionOpen) return;
  collectionOpen = false; setSwitch($('nav'), 'left', false); colFrame.classList.remove('open'); setTimeout(() => { if (!collectionOpen) colFrame.hidden = true; }, 180);
  if (!fromHistory && history.state?.sc === 'collection') { try { history.back(); } catch {} }
  await loadSightings(); // a sighting may have been deleted over there
}
window.addEventListener('popstate', () => { if (collectionOpen && history.state?.sc !== 'collection') closeCollection(true); });
window.addEventListener('message', (e) => {
  if (e.origin !== location.origin || !e.data?.sc) return;
  if (e.data.sc === 'ready') { colLoaded = true; if (collectionOpen) colFrame.classList.add('open'); }
  if (e.data.sc === 'explore') { closeCollection(); if (e.data.more) openDebug(); }
});
window.addEventListener('resize', () => { if (colFrame.src) sendInsets(); });
// Any link to the collection opens the layer instead of leaving the page.
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="cards.html"]'); if (!a || e.defaultPrevented || !state.started) return;
  e.preventDefault(); if (!$('reveal').hidden) $('reveal').querySelector('[data-close="reveal"]')?.click();
  let key = ''; try { key = decodeURIComponent((a.getAttribute('href').split('#')[1] ?? '')); } catch {}
  if (a.closest('#nav')) { setSwitch($('nav'), 'right'); setTimeout(() => openCollection(key), SLIDE_MS); } // the pill slides over first
  else openCollection(key);
});
window.scNavigate = (href) => { if (!String(href).startsWith('cards.html') || !state.started) return false; openCollection(decodeURIComponent(href.split('#')[1] ?? '')); return true; };
// Night mode switched over there (same storage key) follows here.
window.addEventListener('storage', (e) => { if (e.key === 'night' && (e.newValue === '1') !== state.night) { state.night = e.newValue === '1'; $('chk-night').checked = state.night; applyTheme(); } });
window.addEventListener('pagehide',saveExploreState);
// ---------- Welcome card (2026-10-06) ----------
// The opener is a sealed card (the real card back) that rattles every few seconds. Tap: it flips to a mission
// card built with the real card renderer. Flick it up (or tap Begin): it flies off and the tour starts.
let wcCard = null, wcFlipped = false, wcReady = false, wcWantFlip = false, wcReplay = false;
// Welcome card = design/welcome-options.html B (2026-10-09, Sevaan): a how-to-play card that sends you outside.
function welcomeModel() {
  return {
    key: 'welcome', id: 'welcome', natural: 'welcome', type: 'welcome', name: 'Look up & collect the cosmos', tier: 'legendary', code: 'MISSION 01',
    stats: [['STEP 1', 'Go outside', ''], ['STEP 2', 'Look up', ''], ['STEP 3', 'Collect', '']],
    fact: 'No telescope, no tickets. **Every light that moves is a card**: satellites, rocket stages, the Space Station. The darker your spot, the more you can catch.',
  };
}
// Its picture: three numbered panels, out the door → look up → the phone's circle on a light.
function welcomeArt() {
  const INK = '#fff2b3', OR = '#fa8127', MU = '#8fa3b8';
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const stars = Array.from({ length: 16 }, () => `<circle cx="${(12 + rnd() * 76).toFixed(1)}" cy="${(36 + rnd() * 50).toFixed(1)}" r="${(0.5 + rnd() * 0.9).toFixed(2)}" fill="${INK}" opacity="${(0.4 + rnd() * 0.55).toFixed(2)}"/>`).join('');
  const panel = (x, inner, n, word) => `<g transform="translate(${x} 0)"><rect x="4" y="10" width="92" height="160" rx="8" fill="#0b1424" stroke="#2a3a52"/>${inner}<circle cx="18" cy="24" r="8" fill="${OR}"/><text x="18" y="27.5" text-anchor="middle" font-family="SC Display, sans-serif" font-size="10" fill="#080f1b">${n}</text><text x="50" y="158" text-anchor="middle" font-family="SC Label, sans-serif" font-size="11" letter-spacing="1.5" fill="${INK}">${word}</text></g>`;
  const door = `<rect x="34" y="42" width="34" height="62" rx="2" fill="#16294a" stroke="${INK}" stroke-width="1.4"/><path d="M34 42 L56 50 L56 112 L34 104 Z" fill="#0b1424" stroke="${INK}" stroke-width="1.2"/><circle cx="52" cy="80" r="1.6" fill="${OR}"/><path d="M24 118 L80 118" stroke="${MU}" stroke-width="1"/><path d="M70 58 l10 -6 M70 70 l12 0 M70 82 l10 6" stroke="${OR}" stroke-width="1.4" stroke-linecap="round"/>`;
  const up = `${stars}<path d="M28 120 Q50 96 72 120" fill="none" stroke="${INK}" stroke-width="1.4"/><circle cx="40" cy="112" r="2" fill="${INK}"/><circle cx="60" cy="112" r="2" fill="${INK}"/><path d="M50 92 L50 62 M44 68 L50 60 L56 68" stroke="${OR}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
  const phone = `<rect x="30" y="38" width="40" height="76" rx="6" fill="#060c1a" stroke="${INK}" stroke-width="1.4"/><circle cx="50" cy="72" r="11" fill="none" stroke="${INK}" stroke-width="1.2"/><circle cx="50" cy="72" r="2.2" fill="${INK}"/><path d="M34 98 Q44 86 50 72" fill="none" stroke="${INK}" stroke-opacity=".5" stroke-dasharray="1.5 3"/><rect x="38" y="100" width="24" height="7" rx="3.5" fill="${OR}"/>`;
  return `<svg viewBox="0 0 300 180" preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%;display:block"><rect width="300" height="180" fill="#080f1b"/>${panel(0, door, 1, 'GO OUTSIDE')}${panel(100, up, 2, 'LOOK UP')}${panel(200, phone, 3, 'COLLECT')}</svg>`;
}
// Twinkling stars behind the welcome card (2026-10-09, Sevaan), the same field as behind the reveal.
addStarfield($('start'), 90);
function renderStartHand() {
  const holder = $('wc-holder'); if (!holder || wcCard) return;
  const card = renderCard(welcomeModel(), { preview: true });
  card.classList.add('wc-mission');
  // Dress it as a briefing, not a catalogue entry.
  const sb = card.querySelector('.card__setbar > span:first-child > span'); if (sb) sb.textContent = 'HOW TO PLAY';
  const id = card.querySelector('.card__identity'); if (id) id.innerHTML = '<span>Three steps</span><span class="card__mono">OBSERVER 001</span>';
  const art = card.querySelector('.card__art'); if (art) art.innerHTML = welcomeArt();
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
  { const sv = loadSavedLocation(); state.locationStatus = sv?.manual ? 'manual' : sv ? 'saved' : 'example'; } renderLocation();
  state.frame = frame(now(), state.observer); renderStartHand();
  $('btn-start').firstElementChild.textContent='Swipe up to begin'; $('btn-start').disabled=false; wcReady = true; if (wcWantFlip) welcomeFlip();
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
  try { sessionStorage.setItem('scBooted', '1'); } catch {}
  // The loader always gets a proper moment (2026-10-08, Sevaan: after a reset it flashed straight to the welcome card):
  // at least 1.4 s from page start, then the welcome card or the sky.
  await new Promise((r) => setTimeout(r, Math.max(0, 1400 - performance.now())));
  $('start').classList.remove('booting'); // first visit: the welcome card is ready; returning: the sky is already up
  { const h = $('wc-holder'); if (h?.classList.contains('rattle')) { h.classList.remove('rattle'); void h.offsetWidth; h.classList.add('rattle'); } } // start the shake clock now the card is on screen: first shake 2 s later
  checkForUpdate(); requestAnimationFrame(tick);
}
boot();

// ---------- mission patches: the earning moment (2026-10-08, design/patches.html) ----------
// Waits for the card reveal to close, then: the patch drops in, its border stitches on, a soft thump, the name; then
// it shrinks away and becomes a toast with the patch as its picture. One at a time; a tap skips ahead.
const patchQueue = [];
let patchBusy = false;
function earnPatch(a) {
  try { const d = JSON.parse(localStorage.getItem('patchDates') || '{}'); d[a.id] ??= Date.now(); localStorage.setItem('patchDates', JSON.stringify(d)); } catch {}
  patchQueue.push(a); setTimeout(pumpPatch, 1200);
}
function thud() {
  if (!audio || !soundOn()) return;
  try { const t = audio.currentTime, o = audio.createOscillator(), g = audio.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(60, t + 0.18); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25); o.connect(g).connect(audio.destination); o.start(t); o.stop(t + 0.3); } catch {}
}
function pumpPatch() {
  if (patchBusy || !patchQueue.length) return;
  if (!$('reveal').hidden || collectionOpen || activePanel) { setTimeout(pumpPatch, 700); return; }
  patchBusy = true;
  // Earned together = shown together (2026-10-08 playtest: a first catch played three moments back to back).
  const batch = patchQueue.splice(0, 3), a = batch[0], many = batch.length > 1, el = document.createElement('div');
  el.className = `patch-moment${many ? ' many' : ''}`; el.setAttribute('role', 'status');
  el.innerHTML = `<div class="pm-row">${batch.map((x, i) => `<div class="pm-patch" style="animation-delay:${i * 0.12}s">${patchHtml(x, { stitch: true })}</div>`).join('')}</div>
    <div class="pm-label"><small>${many ? `${batch.length} PATCHES EARNED` : a.secret ? 'SECRET PATCH' : 'PATCH EARNED'}</small><b>${many ? batch.map((x) => escapeHtml(x.name)).join(' · ') : escapeHtml(a.name)}</b>${many ? '' : `<span>${escapeHtml(a.text)}</span>`}</div>`;
  document.body.append(el);
  let done = false;
  const landT = setTimeout(() => { el.classList.add('landed'); thud(); buzz(20); }, 1550);
  const finish = () => {
    if (done) return; done = true; clearTimeout(landT); clearTimeout(outT);
    el.classList.add('out');
    setTimeout(() => {
      el.remove();
      // No follow-up toast (2026-10-08): the moment already said it; the patches wait on the wall.
      patchBusy = false; setTimeout(pumpPatch, 500);
    }, 380);
  };
  const outT = setTimeout(finish, 3600);
  el.addEventListener('click', finish);
}

// ---------- the buried fossil (js/fossil.js, 2026-10-08) ----------
// In daylight, with nothing else in the circle: line the fossil up and hold it ~1.2 s to earn the secret patch.
let fossilHoldFrom = 0, fossilDone = !!Fossil.found();
let fossilEnu = Fossil.spot ? enuFromAzEl(Fossil.spot.az, Fossil.spot.el) : null;
function fossilState(t, basis, target) {
  if (!fossilEnu) { // place it behind you the first time you're out in daylight, once the sky has settled
    if (!document.body.classList.contains('day') || (!state.drag.on && (state.liveSince == null || t - state.liveSince < 1500))) return null;
    const b = basis.back, s = Fossil.placeBehind((Math.atan2(b[0], b[1]) / RAD + 360) % 360); fossilEnu = enuFromAzEl(s.az, s.el);
  }
  if (!document.body.classList.contains('day') || target || state.planeHit) { fossilHoldFrom = 0; return { enu: fossilEnu, img: Fossil.loadImage(), inCircle: false, done: fossilDone }; }
  const inCircle = dot(fossilEnu, basis.back) > Math.cos((sky.reticleDeg + 4) * RAD);
  if (!inCircle) fossilHoldFrom = 0; else fossilHoldFrom ||= t;
  const hold = fossilHoldFrom ? Math.min(1, (t - fossilHoldFrom) / 1200) : 0;
  if (hold >= 1 && !fossilDone) {
    fossilDone = true; Fossil.markFound(); buzz(30);
    earnPatch({ ...Fossil.FOSSIL_PATCH, text: 'You looked through the Earth and found dinosaur bones. Most people only look up.' });
  }
  return { enu: fossilEnu, img: Fossil.loadImage(), inCircle, hold, done: fossilDone, name: Fossil.fossil.name };
}

// ---------- the UFO (js/ufo.js, 2026-10-08) ----------
// Night only, rare, only in a busy sky (3+ other things up), crosses once. Line it up and tap the green button.
let ufoCaught = !!Ufo.caught();
function ufoState(t, basis, target, items) {
  const btn = $('ufo-cta'), hide = () => { if (!btn.hidden) btn.hidden = true; return null; };
  if (ufoCaught || (state.frame?.sunEl ?? 0) > -6) return hide();
  const f = Ufo.flight(now().getTime()); if (!f) return hide();
  const up = items.filter((it) => it.look.visible).length + (state.naturals?.length ?? 0);
  if (up < 3) return hide();
  const { az, el } = Ufo.where(f, now().getTime()), enu = enuFromAzEl(az, el);
  const inCircle = !target && dot(enu, basis.back) > Math.cos((sky.reticleDeg + 1) * RAD);
  if (inCircle) { const rc = sky.ring ?? { x: sky.cx, y: sky.cy, r: sky.reticlePx }; btn.style.top = `${rc.y + rc.r + 24}px`; btn.hidden = false; } else hide();
  return { enu, inCircle };
}
$('ufo-cta').addEventListener('click', () => {
  if (ufoCaught) return;
  ufoCaught = true; Ufo.markCaught(); $('ufo-cta').hidden = true; buzz([20, 40, 20]);
  earnPatch(Ufo.UFO_PATCH);
});
$('btn-ufo')?.addEventListener('click', () => { ufoCaught = false; try { localStorage.removeItem('ufoFound'); } catch {} Ufo.summon(now().getTime()); closePanel('debug'); toast('A UFO is crossing your sky now (night, 3+ things up).', 3000); });

// ---------- Settings (2026-10-08, design/settings.html) ----------
function soundOn() { return readPref('sound', true); }
function buzz(p) { if (soundOn()) navigator.vibrate?.(p); }
const HL_NAMES = { satellite: 'Satellites', rocket: 'Rocket stages', planet: 'Planets', sun: 'Sun', star: 'Stars' };
function renderSettings() {
  const st = state.locationStatus, o = state.observer;
  $('set-loc-name').textContent = o.label && !['ready', 'manual'].includes(st) ? o.label.replace(/^Example:\s*/, '') : st === 'ready' ? 'Your location' : st === 'manual' ? 'Chosen place' : 'Location';
  $('location-note').textContent = { ready: `Using your location · ${o.lat.toFixed(2)}°, ${o.lon.toFixed(2)}°`, manual: `${o.lat.toFixed(2)}°, ${o.lon.toFixed(2)}°`, waiting: 'Finding you…', denied: 'Location is off · tap to set it', unavailable: 'Couldn\u2019t find you · tap to set it' }[st] ?? 'An example sky · tap to use yours';
  const live = hasLiveSensors();
  $('set-motion').innerHTML = live ? '<span class="set-ok">On ✓</span>' : ''; $('retry-motion').hidden = live;
  const r = $('set-sky-range'); r.min = SB_MIN; r.max = SB_MAX; if (document.activeElement !== r) r.value = String(state.skySb);
  r.style.setProperty('--p', `${((state.skySb - SB_MIN) / (SB_MAX - SB_MIN) * 100).toFixed(1)}%`);
  $('set-sky-name').textContent = skyNameFor(state.skySb);
  $('sky-limit-info').textContent = state.limit ? `Stars to magnitude ${state.limit.stars.toFixed(1)}, satellites to ${state.limit.satellites.toFixed(1)}` : '';
  const on = [...document.querySelectorAll('[data-hl]')].filter((c) => c.checked).map((c) => HL_NAMES[c.dataset.hl]);
  $('set-hl-val').textContent = on.length ? (on.length > 3 ? `${on.slice(0, 3).join(', ')} +${on.length - 3}` : on.join(', ')) : 'None';
  $('chk-sound').checked = soundOn();
  const n = state.sightings.filter((x) => !x.sim).length;
  $('set-data-note').textContent = `${n} sighting${n === 1 ? '' : 's'}, on this phone only`;
  $('set-version').textContent = `Space Collector v${VERSION}`;
}
$('set-sky-range').addEventListener('input', (e) => { const m = $('sky-range'); m.value = e.target.value; m.dispatchEvent(new Event('input', { bubbles: true })); renderSettings(); });
$('set-sky-range').addEventListener('change', (e) => { const m = $('sky-range'); m.value = e.target.value; m.dispatchEvent(new Event('change', { bubbles: true })); });
const sheetTimers = new Map();
const openSheet = (id) => { clearTimeout(sheetTimers.get(id)); $(id).hidden = false; requestAnimationFrame(() => $(id).classList.add('in')); };
const closeSheet = (el) => { el.classList.remove('in'); clearTimeout(sheetTimers.get(el.id)); sheetTimers.set(el.id, setTimeout(() => { if (!el.classList.contains('in')) el.hidden = true; }, 260)); renderSettings(); };
$('set-loc-open').addEventListener('click', () => openSheet('set-loc-sheet'));
$('set-hl-open').addEventListener('click', () => openSheet('set-hl-sheet'));
document.querySelectorAll('.set-sheet').forEach((sh) => sh.addEventListener('click', (e) => { if (e.target === sh || e.target.closest('[data-sheet-close]')) closeSheet(sh); }));
$('retry-location').addEventListener('click', () => closeSheet($('set-loc-sheet')));
$('location-form').addEventListener('submit', () => setTimeout(() => closeSheet($('set-loc-sheet')), 50));
document.querySelectorAll('[data-hl]').forEach((c) => c.addEventListener('change', renderSettings));
$('chk-sound').addEventListener('change', (e) => writePref('sound', e.target.checked));
$('set-data').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ app: 'Space Collector', version: VERSION, exported: new Date().toISOString(), sightings: state.sightings.filter((x) => !x.sim) }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `space-collector-sightings-${new Date().toISOString().slice(0, 10)}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
});
// Testing tools: tap the version five times.
// (2026-10-08: testing tools now sit at the top of Settings, always shown.)

// ---------- countdown to dark (2026-10-08) ----------
// By day, with nothing in the circle: "3 h 57 min until dark" under the circle, and when it gets dark.
let udLast = '';
function untilDark(target) {
  const el = $('until-dark'), T = state.tonight, now0 = now().getTime();
  const show = document.body.classList.contains('day') && (state.basis?.back?.[2] ?? 1) > 0 && !target && !state.planeHit && T?.dusk && T.dusk > now0 && $('discover').hidden;
  if (!show) { if (!el.hidden) el.hidden = true; return; }
  const mins = Math.max(1, Math.round((T.dusk - now0) / 60000)), h = Math.floor(mins / 60), m = mins % 60;
  const txt = `${h ? `${h} h ` : ''}${m ? `${m} min` : ''} until dark`.replace('  ', ' ').trim();
  if (txt !== udLast) { const roll = !!udLast; udLast = txt; $('ud-time').textContent = txt; if (roll) { $('ud-time').classList.remove('roll'); void $('ud-time').offsetWidth; $('ud-time').classList.add('roll'); } $('ud-at').textContent = `Around ${fmtTime(T.dusk)}`; }
  const rc = sky.ring ?? { y: sky.cy, r: sky.reticlePx }; el.style.top = `${rc.y + rc.r + 26}px`;
  el.hidden = false;
}

// Countdown → reminder (2026-10-08, design/until-dark.html). Reminders are calendar alerts for now (iOS/Android
// notifications come with the native apps). Remembered for tonight in localStorage 'udRemind' = { t, label }.
function udReminder() { try { const r = JSON.parse(localStorage.getItem('udRemind')); return r && r.t > Date.now() - 3600e3 ? r : null; } catch { return null; } }
let udPick = 0, udChoices = [];
function udOptions() {
  const T = state.tonight, t0 = now().getTime(), out = [];
  const best = T ? (tonightPasses(T, t0).find((p) => p.fresh && p.start > T.dusk) ?? tonightPasses(T, t0).find((p) => p.start > T.dusk)) : null;
  if (best) out.push({ t: best.start - 10 * 60e3, icon: '✦', label: `10 min before the best pass · ${label(best.obj)} at ${fmtTime(best.start)}`, msg: `${label(best.obj)} passes at ${fmtTime(best.start)}, ${best.peakEl}° up in the ${compassPoint(best.peakAz)}. Open Space Collector to line it up.` });
  if (T?.dusk) out.push({ t: T.dusk, icon: '☾', label: 'When it gets dark', msg: "It's dark enough to start. Open Space Collector and look up." });
  const pk = T ? T.curve.filter(([t]) => t >= T.dusk).reduce((a, c) => (c[1] > a[1] ? c : a), [0, 0]) : [0, 0];
  if (pk[1]) out.push({ t: pk[0], icon: '★', label: `The busiest moment · ${pk[1]} up at once`, msg: `${pk[1]} satellites are up right now. Open Space Collector.` });
  return out.sort((a, b) => a.t - b.t);
}
function udRender() {
  const r = udReminder(), b = $('ud-bell');
  b.classList.toggle('on', !!r); b.textContent = r ? `🔔 ${fmtTime(r.t)} · set` : '🔔 Remind me';
}
$('ud-bell').addEventListener('click', () => {
  udChoices = udOptions(); if (!udChoices.length) return;
  const r = udReminder(); udPick = Math.max(0, r ? udChoices.findIndex((c) => Math.abs(c.t - r.t) < 60e3) : 0);
  const draw = () => { $('ud-opts').innerHTML = udChoices.map((c, i) => `<button type="button" class="ud-opt${i === udPick ? ' sel' : ''}" data-i="${i}"><i>${c.icon}</i><span><b>${escapeHtml(fmtTime(c.t))}</b><small>${escapeHtml(c.label)}</small></span>${i === udPick ? '<em>✓</em>' : ''}</button>`).join(''); };
  draw(); $('ud-opts').onclick = (e) => { const o = e.target.closest('.ud-opt'); if (o) { udPick = Number(o.dataset.i); draw(); } };
  $('ud-cancel').hidden = !r; openSheet('ud-sheet');
});
$('ud-set').addEventListener('click', () => {
  const c = udChoices[udPick]; if (!c) return;
  const url = URL.createObjectURL(new Blob([passIcs({ title: 'Look up: Space Collector', start: c.t, end: c.t + 30 * 60e3, description: `${c.msg} https://sevaan.github.io/space-collector/` }).replace('TRIGGER:-PT10M', 'TRIGGER:PT0M')], { type: 'text/calendar' }));
  const a = document.createElement('a'); a.href = url; a.download = 'space-collector-tonight.ics'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 5000);
  try { localStorage.setItem('udRemind', JSON.stringify({ t: c.t, label: c.label })); } catch {}
  closeSheet($('ud-sheet')); udRender(); const bl = $('ud-bell'); bl.classList.remove('ring'); void bl.offsetWidth; bl.classList.add('ring'); buzz(15);
  ticket({ kind: 'mission', eyebrow: 'REMINDER SET', line: `We'll nudge you at ${fmtTime(c.t)}${c.icon === '✦' ? `, before ${c.label.split(' · ')[1]}` : ''}.`, ms: 4000 });
});
$('ud-cancel').addEventListener('click', () => { try { localStorage.removeItem('udRemind'); } catch {} closeSheet($('ud-sheet')); udRender(); toast('Reminder removed here. Delete the calendar event too if you added it.', 4000); });
document.getElementById('ud-sheet').addEventListener('click', (e) => { if (e.target.id === 'ud-sheet') closeSheet(e.currentTarget); });
udRender();

// ---------- more secrets (js/secrets.js, 2026-10-08) ----------
const secretFound = Secrets.found();
let secretHold = {}, secretTap = null;
function earnSecret(id) {
  if (secretFound[id]) return; secretFound[id] = Date.now(); Secrets.markFound(id); buzz([20, 40, 20]);
  earnPatch(Secrets.SECRET_PATCHES[id]);
}
function secretsState(t, basis, target) {
  const out = [], nowMs = now().getTime(), night = (state.frame?.sunEl ?? 0) < -6, inC = (enu, slack = 1) => !target && dot(enu, basis.back) > Math.cos((sky.reticleDeg + slack) * RAD);
  const toEnu = eqToEnu(now(), state.observer), b = basis.back, heading = (Math.atan2(b[0], b[1]) / RAD + 360) % 360, aimEl = Math.asin(Math.max(-1, Math.min(1, b[2]))) / RAD;
  let tap = null;
  // Santa (tap to wave)
  const sf = Secrets.santa(nowMs);
  if (sf && night) { const w = Secrets.santaWhere(sf, nowMs), enu = enuFromAzEl(w.az, w.el), c = inC(enu, 2); out.push({ kind: 'santa', enu, inCircle: c, done: !!secretFound.santa, title: "Santa's sleigh", sub: 'NORAD tracked · S-1', color: '#ff8a6b' }); if (c && !secretFound.santa) tap = { id: 'santa', label: 'Tap to wave' }; }
  // Roadster and Voyager (hold ~1.2 s)
  const hold = (id, enu, title, sub, color) => {
    const c = inC(enu); if (!c) delete secretHold[id]; else secretHold[id] ??= t;
    const h = secretHold[id] ? Math.min(1, (t - secretHold[id]) / 1200) : 0;
    if (h >= 1 && !secretFound[id]) earnSecret(id);
    out.push({ kind: id, enu, inCircle: c, hold: h, done: !!secretFound[id], title, sub, color });
  };
  if (night) {
    const r = toEnu(roadster(now())); if (r[2] > 0.05) hold('roadster', r, 'Starman', 'Interplanetary · 2018-017A', '#ff6b6b');
    const v = toEnu(starVector(Secrets.VOYAGER.ra, Secrets.VOYAGER.dec)); if (v[2] > 0.05) hold('voyager', v, 'The Golden Record', 'Voyager 1 · 24 billion km', '#e2b53c');
  }
  // Shooting star (tap within the streak)
  const active = night && !!activeEvent(nowMs) && aimEl > 15 && !target;
  const m = Secrets.meteorAt(t, active, heading, aimEl);
  if (m) { out.push({ kind: 'meteor', streak: { ...m, k: Math.min(1, (t - m.start) / (m.end - m.start)) } }); if (!secretFound.meteor) tap = { id: 'meteor', label: 'Tap now' }; }
  // Dizzy: three full turns while using the sky
  if ((hasLiveSensors() || state.drag.on) && Secrets.dizzyStep(t, heading)) { $('radar').classList.remove('dizzy'); void $('radar').offsetWidth; $('radar').classList.add('dizzy'); if (!secretFound.dizzy) earnSecret('dizzy'); else toast('Woah. Dizzy?', 2000); }
  // The tap button for Santa / the shooting star
  const btn = $('secret-cta');
  if (tap) { const rc = sky.ring ?? { x: sky.cx, y: sky.cy, r: sky.reticlePx }; btn.style.top = `${rc.y + rc.r + 24}px`; btn.textContent = tap.label; btn.dataset.id = tap.id; btn.hidden = false; }
  else if (!btn.hidden && !(btn.dataset.id === 'meteor' && m)) btn.hidden = true;
  return out;
}
$('secret-cta').addEventListener('click', (e) => { const id = e.currentTarget.dataset.id; e.currentTarget.hidden = true; if (id) earnSecret(id); });
$('btn-santa')?.addEventListener('click', () => { Secrets.summonSanta(now().getTime()); closePanel('debug'); toast("Santa's sleigh is crossing now (night only).", 3000); });
$('btn-meteor')?.addEventListener('click', () => { Secrets.summonMeteor(); closePanel('debug'); toast('A shooting star is coming (night, meteor shower, looking up).', 3000); });

// Reset everything (2026-10-08): sightings, patches, settings and every saved flag go, then the app reloads as a brand-new
// player (welcome card and tour). The browser keeps its own location/motion permissions; the tour asks again regardless.
$('set-reset').addEventListener('click', async () => {
  if (!confirm('Reset everything? Your cards, patches and settings on this phone will be deleted. This can\u2019t be undone.')) return;
  try { localStorage.clear(); sessionStorage.clear(); } catch {}
  await new Promise((res) => { try { const r = indexedDB.deleteDatabase('space-collector'); r.onsuccess = r.onerror = r.onblocked = () => res(); } catch { res(); } });
  location.href = location.pathname;
});

// ---------- polish (2026-10-08) ----------
// Drag a panel's header down to dismiss it.
document.querySelectorAll('.overlay.panel .panel-head').forEach((h) => {
  let y0 = null; const panel = h.closest('.overlay.panel');
  h.addEventListener('pointerdown', (e) => { if (e.target.closest('button')) return; y0 = e.clientY; h.setPointerCapture(e.pointerId); panel.style.transition = 'none'; });
  h.addEventListener('pointermove', (e) => { if (y0 == null) return; const dy = Math.max(0, e.clientY - y0); panel.style.transform = `translateY(${dy}px)`; });
  const end = (e) => { if (y0 == null) return; const dy = Math.max(0, e.clientY - y0); y0 = null; panel.style.transition = 'transform var(--m-norm) var(--ease-out)';
    if (dy > 110) closePanel(panel.id); else panel.style.transform = ''; };
  h.addEventListener('pointerup', end); h.addEventListener('pointercancel', end);
});
// A tiny buzz (Android; iPhone web can't) on the switcher and toggles.
document.addEventListener('change', (e) => { if (e.target.matches?.('input[type=checkbox]')) buzz(8); });
$('nav-collection').addEventListener('click', () => buzz(8));

// "Show me": an orange target flies from the row's icon to the circle as the panel slides away (2026-10-08 polish).
function flyToCircle(fromEl) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !fromEl) return;
  const a = fromEl.getBoundingClientRect(), rc = sky.ring ?? { x: sky.cx, y: sky.cy, r: sky.reticlePx };
  const dot = document.createElement('div'); dot.className = 'fly-dot'; document.body.append(dot);
  const x0 = a.left + a.width / 2, y0 = a.top + a.height / 2;
  dot.animate([{ transform: `translate(${x0}px, ${y0}px) scale(1)`, opacity: 1 }, { transform: `translate(${(x0 + rc.x) / 2}px, ${Math.min(y0, rc.y) - 60}px) scale(1.4)`, opacity: 1, offset: .5 }, { transform: `translate(${rc.x}px, ${rc.y}px) scale(${(rc.r * 2) / 22})`, opacity: 0 }], { duration: 620, easing: 'cubic-bezier(.5,0,.3,1)' }).onfinish = () => dot.remove();
}

// Offline caching (sw.js, 2026-10-08). Inside the app's Collection layer the parent page has already registered it.
if ('serviceWorker' in navigator && window.parent === window) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));

// ---------- camera view prototype (2026-10-08) ----------
// The live rear camera behind the drawn sky. With motion sensors on, drag sideways to line the drawing up with the
// real sky (nudges the compass for the session). Field of view: the drawing's vertical angle is matched to a typical
// phone main camera; adjust with Settings → Testing tools → Camera fit −/+ if things don't line up.
let camStream = null;
async function camOn() {
  try {
    camStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
  } catch { toast('Camera not available (or permission declined).', 3500); return; }
  const v = $('cam'); v.srcObject = camStream; v.hidden = false; await v.play().catch(() => {});
  document.body.classList.add('cam-on'); sky.camera = true; sky.fovV = Number(readText('camFov', '62')) || 62; sky.resize?.();
  ticket({ kind: 'info', line: hasLiveSensors() ? 'Sky misaligned? Drag sideways to line it up with objects in the sky.' : 'Camera on. Drag to look around.', ms: 3500 }); // a short toast at the bottom (2026-10-08)
}
function camOff() {
  camStream?.getTracks().forEach((t) => t.stop()); camStream = null; $('cam').hidden = true; $('cam').srcObject = null;
  document.body.classList.remove('cam-on'); sky.camera = false; sky.fovV = 70; sky.resize?.();
}
for (const [id, d] of [['btn-fov-', -2], ['btn-fov+', 2]]) $(id)?.addEventListener('click', () => { const v = Math.max(40, Math.min(90, (Number(readText('camFov', '62')) || 62) + d)); writeText('camFov', String(v)); if (camStream) { sky.fovV = v; sky.resize(); } toast(`Camera fit: ${v}° tall`, 1500); });
$('btn-cam')?.addEventListener('click', async () => { closePanel('debug'); if (camStream) camOff(); else await camOn(); syncCamToggle(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && camStream) camOff(); });
// Line-up drag: with live sensors and the camera on, a sideways drag nudges the compass.
{ let x0 = null, acc = 0;
  $('sky').addEventListener('pointerdown', (e) => { if (!camStream || !hasLiveSensors() || state.drag.on) return; x0 = e.clientX; acc = 0; });
  $('sky').addEventListener('pointermove', (e) => { if (x0 == null) return; const deg = -(e.clientX - x0) * (sky.fovV / sky.h); const step = deg - acc; if (Math.abs(step) >= 0.25) { nudgeHeading(step); acc = deg; } });
  addEventListener('pointerup', () => { if (x0 != null && Math.abs(acc) > 0.5) { lockHeading(true); toast(`Lined up (${acc > 0 ? '+' : ''}${acc.toFixed(1)}°). Holding it steady.`, 2500); } x0 = null; });
}

// Compass nudge back to zero (2026-10-08): undoes the ±5° steps and any camera line-up drags.
$('nudge-reset')?.addEventListener('click', () => { const n = getNudge(); if (n) nudgeHeading(-n); lockHeading(false); renderDebug(); toast('Compass nudge reset to 0°.', 2000); });
// The steering line never shows as an empty pill (2026-10-08).
new MutationObserver(() => { const g = $('guidance'); if (!g.hidden && !g.textContent.trim()) g.hidden = true; }).observe($('guidance'), { attributes: true, attributeFilter: ['hidden'], childList: true, characterData: true, subtree: true });

// Camera view toggle in the header, left of the night-mode moon (2026-10-08).
// The header eye toggle was removed (2026-10-08, Sevaan); camera view stays in Settings → Testing tools.
function syncCamToggle() {}
document.addEventListener('visibilitychange', () => setTimeout(syncCamToggle, 50));
