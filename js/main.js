import { loadComets, comets, cometAt, NAKED_EYE } from './comets.js?v=0.1.675';
import * as Secrets from './secrets.js?v=0.1.675';
import { cloudsHtml, rainHtml } from './weather-art.js?v=0.1.675';
import * as Ufo from './ufo.js?v=0.1.675';
import * as Fossil from './fossil.js?v=0.1.675';
import { patchHtml, patchSvg } from './patches.js?v=0.1.675';
import { setSwitch, SLIDE_MS } from './switcher.js?v=0.1.675';
import { toast, ticket, dropToast, toastPending, onTicketShown } from './toast.js?v=0.1.675';
import { VERSION } from './version.js?v=0.1.675';
import { loadCatalog, frame, look, track, motion, compassPoint, enuFromAzEl, DARK_SUN_ELEVATION, SkyModel, BelowModel, overEarth, RisingSoon, setBinocularMode, setSkyLimit } from './orbit.js?v=0.1.675';
import { placeName } from './geo.js?v=0.1.675';
import { skyLimit, SKIES, DEFAULT_SKY, SB_MIN, SB_MAX, sbOfSky, skyNameFor } from './sky-limit.js?v=0.1.675';
import { conArt } from './con-art.js?v=0.1.675';
import { fetchWeather, tonightSky, skyClearAt } from './weather.js?v=0.1.675';
import { CON_FIGURES } from './con-figures.js?v=0.1.675';
import { loadConstellations, CON_STARS, CON_BY_ID, conProgress } from './constellations.js?v=0.1.675';
import { shinyFor, SHINY } from './shiny.js?v=0.1.675';
import { progress as progressOf, missionsFor, readDeals, xpCarry } from './progress.js?v=0.1.675';
import { eventOf, activeEvent, nextEvent } from './events.js?v=0.1.675';
import { conList } from './constellations.js?v=0.1.675';
import { startSensors, trySensorsQuietly, hasLiveSensors, trueBasis, basisFromAzEl, rotateAz, pointing, nudgeHeading, getNudge, lockHeading, setCompassPlace, getDeclination } from './sensors.js?v=0.1.675';
import { SkyView, shortName } from './sky.js?v=0.1.675';
import { loadSky, eqToEnu, solarSystem, milkyWayModel, galAxes, roadster, starVector } from './celestial.js?v=0.1.675';
import { isPlus, setPlusForTesting, onPlus, PLUS_PERKS } from './plus.js?v=0.1.675';
import { isNative, getPosition, saveFile, notifyAt, cancelNotify, haptic, onNative, nativeChrome, plugin } from './native.js?v=0.1.675';
import { initAccount, onAccount, account, signInGoogle, sendEmailLink, completeEmailLink, signOut, syncNow, pushSighting, deleteAccount, signInApple } from './account.js?v=0.1.675';
import { addSighting, allSightings, deleteSighting } from './store.js?v=0.1.675';
import { cardArt } from './art.js?v=0.1.675';
import { renderCard, miniCard, cardLevel, artImage, lockedArt, attachTilt, attachGyro, throwOff, attachFlip } from './card.js?v=0.1.675';
import { applyBack } from './card-backs.js?v=0.1.675';
import { sfx, loadSfx, sfxVolume } from './sfx.js?v=0.1.675';
import { audioCtx } from './audio-ctx.js?v=0.1.675';
import { musicOn, startMusic, setMusic, duckMusic, musicVolume, setMusicVolume } from './music.js?v=0.1.675';
import { onRevealNews, playReveal, playView, primeReveal, stopReveal, onRevealDismiss } from './reveal.js?v=0.1.675';
import { buildCards, cardKeyFor, stampKeyFor, normalizeSighting, stampsIn, fleetLevel } from './card-model.js?v=0.1.675';
import { collectedDuringPass, collectedTonight, canCapture, nightsIn, nightKey } from './observation.js?v=0.1.675';
import { naturalTargets, SOLAR_SYSTEM, DEEP_SKY } from './natural.js?v=0.1.675';
import { placeFromTimeZone } from './tz-places.js?v=0.1.675';
import { TIER_INFO } from './rarity.js?v=0.1.675';
import { SETS, albumList } from './sets.js?v=0.1.675';
import { TYPE_LABEL, ownerName, orbitStats } from './facts.js?v=0.1.675';
import { pushConfigured, pushOn, enablePush, disablePush, schedulePush, prefetchKey } from './pass-alerts.js?v=0.1.675';
import { shareCardEl } from './share-card.js?v=0.1.675';
import { loadLore, titleFor, factFor, richText } from './lore.js?v=0.1.675';
import { PlaneTracker, planesAvailable, aircraftName, isHelicopter, planePath } from './planes.js?v=0.1.675';
import { addStarfield } from './starfield.js?v=0.1.675';

const $ = (id) => document.getElementById(id);
const RAD = Math.PI / 180;
// No location yet: a city in the phone's time zone (js/tz-places.js), else Peterborough (2026-10-13).
const DEFAULT_LOCATION = placeFromTimeZone() ?? { lat: 44.3091, lon: -78.3197, label: 'Example: Peterborough' };

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
  daySats: readPref('daySats', false), // satellites hidden by daylight; off by default (2026-10-12, Sevaan)
  night: readPref('night', false),
  sky: null,       // stars/constellations from data/sky.json (equatorial vectors)
  skyEnu: null,    // same, rotated into the local sky, refreshed every second
  milkyEq: milkyWayModel(),
  milkyEnu: null,
  bodies: [],      // Sun, Moon, planets in the local sky
  captureAny: false,
  model: null,     // SkyModel: tracks what's above the horizon
  items: [],       // latest interpolated positions: [{ obj, look }]
  binoculars: readPref('binoculars', false), // free again (2026-10-12, Sevaan: every card stays collectable without Plus)
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
  if (!navigator.geolocation && !isNative()) { state.locationStatus = 'unavailable'; renderLocation(); return false; }
  try {
    const p = await getPosition({ enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 });
    if (requestId !== locationRequest) return false;
    state.observer = { lat: p.coords.latitude, lon: p.coords.longitude, heightKm: (p.coords.altitude ?? 0) / 1000, label: 'Current location', fixedAt: Date.now() };
    state.locationStatus = 'ready';
    try { localStorage.setItem('observer', JSON.stringify({ ...state.observer, label: 'Saved location' })); } catch {}
    state.trails.clear(); state.model?.reset(); state.rising?.reset(); cancelPassSearch();
    renderLocation(); return true;
  } catch (error) {
    if (requestId !== locationRequest) return false;
    state.locationStatus = error?.code === 1 ? 'denied' : 'unavailable'; renderLocation(); return false;
  }
}
var exampleWarned = false; // var: renderLocation can run before this line during start-up
function warnExample() {
  if (exampleWarned || !['denied', 'unavailable', 'example'].includes(state.locationStatus) || !/^Example/.test(state.observer.label ?? '')) return;
  let busy = true; try { busy = !$('onboard').hidden || !!activePanel; } catch {} // (activePanel isn't declared yet during start-up)
  if (busy) { setTimeout(warnExample, 2000); return; } // after the tour and its Tonight page, on the sky
  exampleWarned = true;
  ticket({ kind: 'info', id: 'example-loc', sticky: true, eyebrow: 'EXAMPLE LOCATION', line: `Sky over ${state.observer.label.replace(/^Example:\s*/, '')}`, go: 'SET YOURS', action: () => { openDebug(); openSheet('set-loc-sheet'); } });
}
function renderLocation() {
  const labels = { waiting: 'Finding your location…', ready: 'Current location', manual: 'Chosen location', denied: 'Location denied', unavailable: 'Location unavailable', example: state.observer.label ?? 'Example location', saved: 'Saved location · unverified', stale: 'Location needs refreshing' };
  const label = labels[state.locationStatus] ?? 'Location needs checking';
  $('location-note').textContent = `${label}. Sky shown for ${state.observer.lat.toFixed(2)}°, ${state.observer.lon.toFixed(2)}°. ${['ready', 'manual'].includes(state.locationStatus) ? '' : 'Use your location or choose coordinates for real observing.'}`;
  $('latitude').value = state.observer.lat; $('longitude').value = state.observer.lon;
  // Say so when the sky is someone else's (playtest room 2026-10-11: with location denied it quietly showed Peterborough).
  warnExample();
  if (['ready', 'manual'].includes(state.locationStatus) && typeof dropToast === 'function') dropToast('example-loc');
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

// Each toast's sound as it appears: missions and sky challenges, rank ups, constellation/album completions, or the
// quiet toast tone for everything else.
onTicketShown((t) => sfx(t.kind === 'rank' ? 'rankup' : t.kind === 'mission' && /COMPLETE/.test(t.eyebrow) ? 'mission' : /COMPLETE/.test(t.eyebrow ?? '') ? 'complete' : 'toast', { gain: t.kind === 'info' ? 0.7 : 1 }));
// Sound: one shared context (js/audio-ctx.js) and the designed sound set (js/sfx.js, 2026-10-11).
function unlockAudio() { if (soundOn()) { audioCtx(); loadSfx(); } }
// Making the context costs ~130 ms on a phone (it landed on the welcome flip, playtest 2026-10-09): make it, suspended,
// once the page is idle; a tap then only has to resume it.
setTimeout(() => { if (soundOn()) audioCtx(); }, 2500);

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
    if (version && version !== VERSION) showBanner('A new version is ready.', () => location.reload(), { icon: GEAR, sub: 'Tap to update.' });
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
// " · in Capricornus" for a star, so an unfamiliar name has somewhere to live (2026-10-13 playtest: "Prima Giedi").
const inCon = (o) => { if (o?.natural !== 'star') return ''; const c = o.constellation ?? CON_BY_ID.get(o.con)?.name; return c ? ` · in ${c}` : ''; };
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
    const L = state.limit, why = [moonEl > 0 && moon.illum > 0.25 ? 'moonlight' : '', (f?.sunEl ?? -90) > -18 ? 'twilight' : ''].filter(Boolean).join(' and ');
    info.textContent = skyLimitText(L, f?.sunEl ?? -90, why);
  }
}
// The slider's readout in plain words (2026-10-12: "magnitude" lost players, and at noon it claimed stars to 2.6).
// Stars above the horizon down to a limit: roughly half of 10^(0.5·m + 0.6) over the whole sky.
function skyLimitText(L, sunEl, why = '') {
  if (sunEl > -2) return 'Daylight: only the Sun, the Moon and Venus show until dusk.';
  if (sunEl > -6) return 'Twilight: just the brightest stars, planets and satellites so far.';
  const n = Math.round(0.5 * 10 ** (0.5 * L.stars + 0.6) / 50) * 50;
  return `Right now you could see about ${n.toLocaleString()} stars${state.binoculars ? ', and binoculars add many fainter satellites' : ''}${why ? `; ${why} ${why.includes(' and ') ? 'hide' : 'hides'} the faintest` : ''}.`;
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
  state.deepEnu = DEEP_SKY.map((o) => ({ obj: o, enu: toEnu(o.v ??= starVector(o.ra, o.dec)) })); // clusters, nebulae, galaxies (2026-10-11)
  state.conEnu.push(...state.deepEnu);
  // Comets bright enough tonight (js/comets.js), placed from their orbits; collectable like the deep-sky glows.
  for (const c of comets()) { const p = cometAt(c, d); if (p.mag <= NAKED_EYE) state.conEnu.push({ obj: Object.assign(c, { mag: p.mag, need: Math.max(2, p.mag + 1.2) }), enu: toEnu(starVector(p.ra, p.dec)) }); } // a comet's light is spread out: it needs a sky about a magnitude darker than a star of the same brightness (astronomers, 2026-10-11)
  state.skyEnu = {
    stars: state.sky.stars.map((s) => ({ ...s, enu: toEnu(s.v) })),
    lines: state.sky.lines.map((seg) => seg.map(toEnu)),
    constellations: state.sky.constellations.map((c) => ({ ...c, enu: toEnu(c.v) })),
  };
}

function updateStatus(f) {
  if (state.locationStatus === 'ready' && Date.now() - state.observer.fixedAt >= 15 * 60 * 1000) { state.locationStatus = 'stale'; renderLocation(); }
  const visible = state.items.filter(a => a.look.visible).length;
  $('visible-count').textContent = visible; $('radar-up').hidden = !visible; // "0 up" under the compass read as an angle (playtest 2026-10-09): say "2 passing", and nothing when none are
  const fresh = state.items.filter(a => a.look.visible && isNewFind(a.obj)).length;
  $('new-count').textContent = fresh; $('radar-new').hidden = !fresh;
  if (!bannerKey.startsWith('New build')) {
    if (state.timeOffsetMs && $('peak-toggle').classList.contains('on')) showBanner(''); // the testing ⏱ button is the way back
    else if (state.timeOffsetMs) showBanner(`Sky at ${now().toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' })} · back to now`, backToNow); // one short line (2026-10-08)
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
// The steering pill under the circle (2026-10-09, Sevaan: one long line wrapped badly): the name small on top, the move on one line.
function setGuide(el, name, hint) { const key = `${name}|${hint}`; if (el.dataset.k === key) return; el.dataset.k = key; el.innerHTML = `<small>${escapeHtml(name)}</small><span>${escapeHtml(hint)}</span>`; }
// A soft tick when the circle locks onto a target (sound stands in for haptics on the web).
// The sound only for something you can collect (2026-10-12, Sevaan: no lock sound on a card you already have); the pulse always.
function snapTick(audible = true) {
  buzz(12); sky.lockPulseAt = performance.now(); // felt (Android) and seen: a ring pulses out from the circle
  if (audible) sfx('lock', { gap: 260 }); // short, and never twice in a quarter second: waving the phone can lock on to several things (Sevaan)
}
let uiSafeTop = 202, uiSafeBottom = 320, uiCenterY = window.innerHeight / 2; // set from the first frame, so the circle never starts high and slides down (2026-10-07)
let idleBasis = null, idleFlip = false;
function tick(ts) {
  requestAnimationFrame(tick);
  if (!state.catalog || !state.started || document.hidden || activePanel || collectionOpen) return;
  const d = now();
  state.model.update(d, state.observer);
  state.items = state.model.items(d);
  state.belowSats = belowSats(d);
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
  for (const n of naturalTargets(state.bodies, state.skyEnu?.stars, state.conEnu, state.limit?.stars, state.binoculars && state.limit ? state.limit.stars + 3 : null)) {
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
    // An unfound secret in the circle takes it over from a background star (2026-10-09): the star steps aside.
    if (state.secretInCircle && cands[0]?.obj.natural === 'star') cands.shift();
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
  if (plane && state.lockedOn) state.lockedOn = false; // a plane nearer the centre than the star: it's the plane you're looking at

  sky.draw(basis, items, {
    showDim: state.showDim,
    sky: state.showStars ? state.skyEnu : null,
    starLimit: state.limit?.stars, // background stars follow the sky slider too
    sunEl: state.frame?.sunEl ?? -90, // day/twilight tone (js/sky.js dayF)
    ...(document.body.classList.toggle('day', (state.frame?.sunEl ?? -90) > -2) ? {} : {}),
    ...(document.body.classList.toggle('bright-sky', (state.frame?.sunEl ?? -90) > -2 && !state.night) ? {} : {}), // daytime only (dusk is dark like night): chips, switcher and toasts in card paper (2026-10-08)
    weather: state.weather?.now ?? null,
    below: belowGhosts(d), // see-through Earth: what's under the horizon and when it rises
    feet: feetItems(),     belowSats: state.belowSats, belowStarLimit: DARK_SITE.stars, daySats: daySats(d),
    ghosts: state.guideRise && state.activeTarget ? [{ enu: enuFromAzEl(state.activeTarget.look.az, state.activeTarget.look.el), name: 'Appears here', note: fmtTime(state.guideRise.start) }] : dayGhosts(),
    bodies: state.showStars ? state.bodies : null,
    milky: state.showStars ? state.milkyEnu : null,
    lines: state.showLines,
    targetId: state.targetId,
    lockedOn: state.lockedOn,
    naturalTarget: target?.obj.natural ? target.look.enu : null,
    deep: (state.naturals ?? []).filter((n) => (n.obj.natural === 'deepsky' || n.obj.natural === 'comet') && n.look.visible).map((n) => ({ enu: n.look.enu, kind: n.obj.natural === 'comet' ? 'Comet' : n.obj.kind, id: n.obj.key, sun: n.obj.natural === 'comet' ? state.bodies?.find((b) => b.kind === 'sun')?.enu : null })), // comets too (playtest room 2026-10-11: a comet target was invisible)
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
    if (state.lockedOn && !lastLocked) snapTick(target && (isNewFind(target.obj) || target.obj.id === state.tourCatchId)); // the circle just caught something
    lastLocked = state.lockedOn; renderTarget(target, d); measureSkySpace(); lastPanel = t; }
  // (2026-10-07: the first-night "Sweep the sky slowly…" hint is retired, like the ground nudge)
  renderPlane(plane, t);
  if (!plane) renderIdent(target, t);
}

// ---------- planes ----------
// Live aircraft only (no time travel). When no satellite is locked on and a plane is in the circle,
// the ring turns red and says what it is. A little slack on the circle: positions are a few seconds old.
function findPlane(basis, t) {
  if (!planesAvailable() || state.timeOffsetMs) { state.planeItems = null; state.planeHit = null; return null; }
  state.planes.update(state.observer);
  const list = state.planeItems = state.planes.positions(state.observer);
  // A satellite in the circle always wins. A star, planet or deep-sky object only wins if it's nearer the centre than
  // the plane (astronomers 2026-10-11: a plane dead centre was labelled with a star at the ring's edge).
  const tgt = state.lockedOn ? state.activeTarget : null;
  if (tgt && !tgt.obj.natural) { state.planeHit = null; return null; }
  // Inside the circle only (2026-10-07: a plane well outside the ring was still lit up and named).
  const inCos = Math.cos(sky.reticleDeg * RAD), keepCos = Math.cos((sky.reticleDeg + 0.75) * RAD);
  let best = null;
  for (const a of list) { a.angCos = dot(a.enu, basis.back); if (a.angCos > inCos && (!best || a.angCos > best.angCos)) best = a; }
  if (tgt && (!best || best.angCos <= tgt.angCos)) { state.planeHit = null; return null; }
  // Keep the last plane for a second after it slips out, as long as it's still close.
  const kept = state.planeHit && list.find((a) => a.plane.hex === state.planeHit.hex);
  if (!best && kept && kept.angCos > keepCos && t - state.planeHit.at < 400) return kept;
  state.planeHit = best ? { hex: best.plane.hex, at: t } : null;
  return best;
}

// The circle names what's in it even when it isn't a card (2026-10-10, Sevaan: "I shouldn't have to tap to learn
// what something is. Just put the target on it."). Planes have their own label (renderPlane); this does the same
// for named stars that aren't cards (sky.json names: Alphard, Mirfak…), using the plane label's look.
let identShown = null;
function renderIdent(target, t) {
  const el = $('plane'), back = state.basis?.back;
  const lim = Math.cos((sky.reticleDeg ?? 6) * RAD);
  let best = null;
  if (!target && back && !state.lockedOn && (state.frame?.sunEl ?? -90) < -6) for (const s of state.skyEnu?.stars ?? []) {
    if (!s.name || s.enu[2] < 0) continue;
    const c = dot(s.enu, back); if (c > lim && (!best || c > best.c)) best = { s, c };
  }
  if (!best) { if (identShown) { el.hidden = true; identShown = null; } return; }
  const ring = sky.ring ?? { x: sky.cx, y: sky.cy, r: sky.reticlePx };
  el.style.setProperty('--cx', `${ring.x}px`); el.style.setProperty('--cy', `${ring.y}px`); el.style.setProperty('--r', `${ring.r}px`);
  if (identShown === best.s.name) return;
  identShown = best.s.name; el.hidden = false; $('guidance').hidden = true;
  $('p-kind').textContent = 'A star'; $('p-name').textContent = best.s.name;
  $('p-route').hidden = true;
  $('p-info').textContent = `A named star · ${best.s.mag < 1 ? 'one of the brightest' : best.s.mag < 2.5 ? 'bright' : 'faint'} · not a card`; // no "magnitude" (writing room 2026-10-12)
}
let planeShown = null, planeText = 0;
function renderPlane(hit, t) {
  const el = $('plane');
  if (!hit) { if (planeShown) { el.hidden = true; planeShown = null; } return; } // (the same label also names stars: renderIdent)
  identShown = null; $('guidance').hidden = true;
  const ring = sky.ring ?? { x: sky.cx, y: sky.cy, r: sky.reticlePx };
  el.style.setProperty('--cx', `${ring.x}px`); el.style.setProperty('--cy', `${ring.y}px`); el.style.setProperty('--r', `${ring.r}px`);
  if (planeShown === hit.plane.hex && t - planeText < 500) return;
  if (planeShown !== hit.plane.hex) { sfx('plane', { gap: 4000 }); buzz(8); } // a soft "no": not a space object (2026-10-11, Sevaan)
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
// The empty dial is there from the first frame, north up and still, until the sky starts (2026-10-13, Sevaan).
requestAnimationFrame(() => { try { if (!state.basis) updateCompass({ right: [1, 0, 0], up: [0, 0, 1], back: [0, 1, 0] }); } catch {} });

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
    const when = `${fmtTime(gr.start)}${mins >= 60 ? ` · in ${Math.floor(mins / 60)} h ${mins % 60} min` : mins >= 1 ? ` · in ${mins} min` : ''}`;
    if (gr.aligned) return `Appears here at ${when}`; // no "You're facing the right way" (2026-10-13, Sevaan)
  }
  if (l.el < 0) return 'This pass has ended';
  if (!l.visible && !state.captureAny && !gr) return 'Not visible right now';
  const currentAz = state.basis ? (Math.atan2(state.basis.back[0], state.basis.back[1]) / RAD + 360) % 360 : state.drag.az;
  const currentEl = state.basis ? Math.asin(state.basis.back[2]) / RAD : state.drag.el;
  const turn = ((l.az - currentAz + 540) % 360) - 180;
  const move = Math.abs(turn) > 8 ? (turn > 0 ? 'Turn right →' : '← Turn left') : l.el > currentEl ? '↑ Raise your phone' : '↓ Lower your phone';
  return gr ? `${move} · ${Math.round(l.el)}° up ${compassPoint(l.az)} at ${fmtTime(gr.start)}` : `${move} · ${Math.round(l.el)}° up ${compassPoint(l.az)}`; // short, so it fits one line (2026-10-09)
}
const ICON_TARGET = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none"/><path d="M12 1.8v3.4M12 18.8v3.4M1.8 12h3.4M18.8 12h3.4"/></svg>';
const ICON_BELL = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path class="fillme" d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.6 2H4.4z"/><path d="M10 20.6a2.2 2.2 0 0 0 4 0" stroke-linecap="round"/></svg>';
// Reminders kept across launches (playtest room 2026-10-11: ids restarted at 2000 each launch, so a new reminder could
// replace an older pending one, and bells came back unlit). localStorage 'reminders': [[key, id, at]], past ones dropped.
const REMS = (() => { try { return (JSON.parse(localStorage.getItem('reminders')) ?? []).filter((r) => r[2] > Date.now()); } catch { return []; } })();
const reminded = new Set(REMS.map((r) => r[0])); // bells stay filled
const remindIds = new Map(REMS.map((r) => [r[0], { id: r[1], at: r[2] }])); // pass key -> { id, at }, so a bell can be turned off
const newRemindId = () => 3000 + Math.floor((Date.now() / 1000) % 2e6) * 10 + Math.floor(Math.random() * 10); // unique across launches
// (Both were lost in 020eca4, v0.1.528, which broke every reminder in the apps until v0.1.568.)
const saveRems = () => { try { localStorage.setItem('reminders', JSON.stringify([...remindIds].map(([k, v]) => [k, v.id, v.at]).filter((r) => r[2] > Date.now()))); } catch {} };
// Steer to something that's up now (the tour's first catch, and Show me for passes already under way): pin it,
// point the drag view at it if there are no sensors, and say where to look; the turn hint and edge arrow follow.
function guideTo(obj, l, hint = '') {
  cancelPassSearch();
  state.pinnedId = obj.id; state.targetId = obj.id; state.sticky.clear(); state.guidePass = null;
  if (state.drag.on || !hasLiveSensors()) { state.drag.on = true; state.drag.az = (l.az + 40) % 360; state.drag.el = Math.max(10, l.el - 10); } // close by, so the arrow has something to show
  void hint; // no toast (playtest 2026-10-09): it repeated the guide pill (name · turn · height) and stayed up after you'd lined it up
}
// Tonight → "Show me": pin the object and steer to it (or to where it will rise).
function showMePass(p) {
  cancelPassSearch();
  state.pinnedId = p.obj.id; state.targetId = p.obj.id; state.sticky.clear();
  state.guidePass = { id: p.obj.id, start: p.start, end: p.end, riseAz: p.riseAz, riseEl: p.riseEl };
  if (state.drag.on || !hasLiveSensors()) { state.drag.on = true; state.drag.az = p.riseAz; state.drag.el = Math.max(4, p.riseEl ?? 10); }
  closePanel('visible');
  // No toast here (2026-10-13): the steering line under the circle already says what it is, which way and when, and a
  // sticky toast sat on top of it.
}
function switchLabel(o) {
  // No tap-to-switch (2026-10-07, Sevaan): a slight tilt moves the pick (pickScore), so there is nothing to say here.
  return '';
}
var sunWarned = false;
function renderTarget(target, d) {
  const bar = $('target'), disc = $('discover'), guide = $('guidance');
  $('callout').hidden = true;
  document.body.classList.toggle('secret-on', !!state.secretInCircle); // a secret owns the circle: hide the star's name at once
  if (!target) { bar.hidden = disc.hidden = guide.hidden = true; state.newFind = false; state.dismissedId = null; shownTargetId = barTargetId = null; announceTarget(''); return; }
  // The Sun's safety line before anyone aims at it, once a session (playtest room 2026-10-11: it only showed on the card).
  if (target.obj.key === 'sun' && !sunWarned) { sunWarned = true; ticket({ kind: 'info', id: 'sun-safety', ms: 3800, eyebrow: 'THE SUN', line: 'Never look straight at it. Keep your eyes on the screen.' }); } // the Sun warning is a heads-up, gone after ~6 s (2026-10-13 playtest)
  shownTargetId = target.obj.id;
  if (state.dismissedId != null && target.obj.id !== state.dismissedId) state.dismissedId = null; // a closed mini card returns once you've moved on
  const o = target.obj, l = target.look;
  const tier = TIER_INFO[o.tier] ?? TIER_INFO.common;
  const aligned = state.lockedOn;
  const eligible = canCapture({ visible: l.visible, aligned, practice: state.captureAny, allowAny: state.captureAny });
  const collected = collectedThisPass(o, d);
  const sw = switchLabel(o);
  announceTarget(`${label(o)}, ${tier.label}. ${isNewFind(o) && !collected ? (eligible ? 'Double-tap to collect.' : 'Line it up to collect it.') : 'In your collection.'}`);

  if (o.id === state.tourCatchId || (isNewFind(o) && !collected)) { // the tour's catch always looks like a new find
    // New find
    bar.hidden = true;
    state.newFind = eligible;
    if (eligible) {
      disc.hidden = false; guide.hidden = true;
      const newStamp = ownsCard(o); // fleet card already owned: this launch is a new stamp
      $('d-tier').textContent = newStamp ? 'New stamp' : tier.label + inCon(o);
      $('d-tier').style.setProperty('--find-tier', newStamp ? 'var(--cyan)' : tier.color); $('d-tier').dataset.gem = newStamp ? '✦' : tier.gem;
      $('d-name').textContent = label(o);
      $('d-switch').hidden = !sw; $('d-switch').textContent = sw;
      const quiet = isQuiet(o) && o.id !== state.tourCatchId; // the tour's first catch is often a (quiet) star: always say what to do (playtest 2026-10-09)
      $('d-cta').hidden = false; disc.classList.toggle('quiet', quiet); // quiet targets (stars by default) keep the Collect button too (2026-10-12, Sevaan); quiet only drops the inner ring and snap disc.classList.remove('owned'); $('d-hit').setAttribute('aria-label', 'Collect this object');
      $('d-cta').textContent = 'Collect'; $('d-sub').hidden = true;
    } else {
      disc.hidden = true; guide.hidden = false;
      setGuide(guide, label(o), turnHint(l));
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
    $('d-tier').textContent = tier.label + inCon(o); $('d-tier').style.setProperty('--find-tier', tier.color); $('d-tier').dataset.gem = tier.gem;
    $('d-name').textContent = label(o);
    $('d-cta').hidden = false; $('d-cta').textContent = 'View card';
    const n = nightsIn(state.sightings.filter((s) => !s.sim && s.cardKey === cardKeyFor(o)));
    // How far to the card's next level (silver at 3 nights, gold at 10, js/card.js levelFor), so a quiet night still
    // has something to do (playtest 2026-10-09).
    const nxt = n < 3 ? [3, 'Silver'] : n < 10 ? [10, 'Gold'] : null;
    $('d-sub').hidden = !n; $('d-sub').textContent = nxt ? `Seen on ${n} night${n === 1 ? '' : 's'} · ${nxt[0] - n} more for ${nxt[1]}` : `Gold · seen on ${n} nights`;
    $('d-switch').hidden = true;
  } else { disc.hidden = true; guide.hidden = false; setGuide(guide, label(o), turnHint(l)); }
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
// The lit-up press stays a beat even on a quick tap, before the reveal takes over (2026-10-09).
for (const ev of ['pointerdown']) $('d-cta').addEventListener(ev, () => { const b = $('d-cta'); b.classList.add('tapped'); setTimeout(() => b.classList.remove('tapped'), 280); });
$('d-hit').addEventListener('click', () => {
  unlockAudio();
  primeReveal();
  const target = state.activeTarget;
  if (!target || state.captureBusy) return;
  if ($('discover').classList.contains('owned')) return viewOwned(target, $('d-cta').getBoundingClientRect());
  sfx('collect'); buzz(16); // a firm tap on collect
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
  // A star's constellation, or the Solar System for the Moon and planets: progress toward its mission patch.
  const conCard = (model.con && CON_BY_ID.get(model.con)) || (['moon', 'planet'].includes(model.type) ? SOLAR_SYSTEM : null);
  const owned = ownedCardKeys();
  const con = conCard && sightings.length === 1 ? { name: conCard.name, unit: conCard === SOLAR_SYSTEM ? 'worlds' : 'stars', ...conProgress(conCard, owned) } : null;
  // The toast shows the constellation filling in (2026-10-07, Sevaan): the constellation chart, found stars lit,
  // the one you just caught ringed.
  if (con && conCard.data) con.art = conArt(conCard.data, model.hip ?? null, { w: 150, h: 100, ...(CON_FIGURES.has(conCard.con) ? { figure: `assets/art/con/${conCard.con}.webp` } : {}),
    lit: new Set(conCard.stars.filter((k) => owned.has(k)).map((k) => Number(k.replace('star:hip', '')))) });
  const gain = progressGain(sightings[0]); announceProgress(gain, 3800, { onReveal: true });
  // What it earned shows on the reveal itself, as chips (2026-10-12, playtest room): no pile of toasts afterwards.
  const news = [...gain.missions.map((m) => ({ kind: 'mission', text: m.challenge ? 'Sky challenge' : 'Mission done', xp: 50 })),
    ...gain.achievements.map((a) => ({ kind: 'patch', text: a.name })),
    ...(gain.event ? [{ kind: 'event', text: gain.event }] : []),
    ...(gain.rankUp ? [{ kind: 'rank', text: `New rank: ${gain.rankUp}` }] : [])];
  $('rv-share').hidden = false; revealShare = { card, o: model };
  duckMusic(true); playReveal({ card, o: model, seen: sightings.length, fleet, progress, collected, con, xp: gain.xp, rank: gain.rank, earned: news, shiny: sightings[0]?.shiny && !model.launches ? SHINY[sightings[0].shiny] : null, origin: { x: sky.ring?.x ?? sky.cx, y: sky.ring?.y ?? sky.cy } });
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
  duckMusic(true); playReveal({ card, o: model, seen: 1, progress: { level: cardLevel(sightings), before: 'none', nights: 1 }, collected: 2, origin: { x: sky.ring?.x ?? sky.cx, y: sky.ring?.y ?? sky.cy } });
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
  // Not collected yet: the same hidden art as in the collection (2026-10-09, Sevaan); the fact shows (2026-10-13).
  const card = renderCard(model, sightings.length ? { sightings, seenMembers: new Set(sightings.map(s => s.objectId)).size } : {});
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
  catch (e) { console.error('share failed', e?.message ?? e, e?.stack ?? ''); toast(`Couldn't make the image (${String(e?.message ?? e).slice(0, 60)}).`, 5000, null, { sticky: true }); }
  btn.disabled = false;
});
async function capture(obj) {
  if (state.captureBusy) return;
  const d = now(), f = frame(d, state.observer);
  const l = obj.natural ? state.naturals?.find((n) => n.obj.id === obj.id)?.look : look(obj, f);
  const basis = currentBasis();
  const aligned = l && dot(enuFromAzEl(l.az, l.el), basis.back) > Math.cos(sky.reticleDeg * RAD);
  if (!l || !canCapture({ visible: l.visible, aligned, practice: state.captureAny, allowAny: state.captureAny })) { toast('Not quite. Put it inside the circle while it\'s up, then tap.'); return; }
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
  const info = (k) => { const c = state.cardModels.get(k); return c ? { tier: c.tier, tier0: c.tier0, type: c.type, owner: c.owner ?? (c.family ? state.catalog.families?.[c.family]?.owner : undefined), launch: c.launch, natural: c.natural, con: c.con } : null; };
  state.albums ??= state.cardModels?.size ? albumList([...state.cardModels.values()]) : null;
  const opts = { constellations: conList(), albums: state.albums ?? [], now: now().getTime(), deals: readDeals() };
  return progressOf(list, info, { ...opts, carry: xpCarry(state.sightings, info, opts) });
}
function progressGain(saved) {
  const after = progressNow(state.sightings), before = progressNow(state.sightings.filter((s) => s !== saved));
  const missions = after.missions.filter((m, i) => m.done && !before.missions[i]?.done);
  const achievements = after.achievements.filter((a, i) => a.done && !before.achievements[i]?.done);
  if (after.challenge?.done && !before.challenge?.done) missions.push({ ...after.challenge, challenge: true });
  const ev = eventOf(saved), firstOfEvent = ev && !state.sightings.some((s) => s !== saved && eventOf(s)?.id === ev.id);
  return { xp: after.xp - before.xp, rank: { from: before.xp, to: after.xp, name: after.rank.name, at: after.rank.at, next: after.rank.next }, missions, achievements, rankUp: after.rank.index > before.rank.index ? after.rank.name : null, event: firstOfEvent ? ev.name : null };
}
function announceProgress(g, delay = 3800, { onReveal = false } = {}) {
  // Tickets queue themselves; the delay lets the card land first. From a reveal, missions, the event badge and a rank-up
  // are chips on the reveal instead (playReveal news); patches still roll into the Collection afterwards.
  if (onReveal) { g.achievements.forEach((a) => earnPatch(a)); return; }
  if (g.event) ticket({ kind: 'event', eyebrow: 'EVENT BADGE', line: g.event, ms: 3600, delay });
  g.missions.forEach((m) => ticket({ kind: 'mission', eyebrow: m.challenge ? 'SKY CHALLENGE COMPLETE' : 'MISSION COMPLETE', line: m.text, xp: 50, ms: 3200, delay }));
  g.achievements.forEach((a) => earnPatch(a)); // mission patches (2026-10-08): a stitched-on moment, then a toast
  if (g.rankUp) ticket({ kind: 'rank', id: 'rank', sticky: true, eyebrow: 'NEW RANK', line: g.rankUp, ms: 4200, delay, href: 'cards.html' }); // one rank ticket, replaced by the next
}
async function recordSighting(obj, d, l = null) {
  l ??= obj.natural ? state.naturals?.find((n) => n.obj.id === obj.id)?.look : look(obj, frame(d, state.observer));
  if (!l) return null;
  const m = obj.natural ? null : motion(obj, d, state.observer), key = cardKeyFor(obj);
  // Shiny (js/shiny.js): something special happening in the sky right now.
  const moonB = state.bodies?.find((b) => b.kind === 'moon');
  // Rarer shinies (collectors 2026-10-11: about 1 in 20 sightings): it has to slip into Earth's shadow within 12 s, not 45.
  const later = obj.natural ? null : look(obj, frame(new Date(d.getTime() + 12000), state.observer));
  const shiny = shinyFor(obj, { ...l, enu: l.enu ?? enuFromAzEl(l.az, l.el) }, later, moonB ? { enu: moonB.enu, illum: moonB.illum } : null, d.getTime());
  const sighting = { ...(shiny ? { shiny } : {}), objectId: obj.id, cardKey: key, ...(stampKeyFor(obj) ? { stampKey: stampKeyFor(obj) } : {}), name: obj.name, type: obj.type, year: obj.year, time: d.getTime(), loggedAt: Date.now(), lat: state.observer.lat, lon: state.observer.lon, az: l.az, el: l.el, mag: l.mag, rangeKm: l.rangeKm, heading: m?.heading, ...(l.phaseName ? { phase: l.phaseName } : {}), sim: false, appVersion: VERSION, cardSnapshot: cardSnapshot(obj) };
  state.captureBusy = true;
  try {
    const key = await addSighting(sighting);
    collectionStale(); // the preloaded collection catches up in the background
    const saved = { ...sighting, key };
    state.sightings.unshift(saved);
    for (const id of ['tonight', 'rank', 'sun-safety', 'guide']) dropToast(id); // a catch clears the notes that were waiting for one (playtest room 2026-10-12)
    pushSighting(saved); // backed up straight away when signed in (js/account.js)
    return saved;
  } catch {
    toast('Couldn\'t save that card. Close private browsing or free up some space, then try again.', 5000, null, { sticky: true, id: 'save-fail' });
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
// The sky's own icon for an object, drawn once per kind and colour into a small image for the Now map.
const mapIcons = new Map();
function mapIcon(o, color) {
  const kind = sky.iconKind(o), key = `${kind}|${color}`; if (mapIcons.has(key)) return mapIcons.get(key);
  const cv = document.createElement('canvas'); cv.width = cv.height = 56; const r = Object.create(Object.getPrototypeOf(sky)); r.ctx = cv.getContext('2d');
  try { r.drawIcon(kind, 28, 28, 40, color); } catch {}
  const url = cv.toDataURL(); mapIcons.set(key, url); return url;
}
const visIcon = (o, c) => o.natural ? `<svg width="18" height="18" viewBox="-9 -9 18 18"><circle r="3" fill="${c}"/><circle r="7" fill="${c}" opacity=".18"/></svg>`
  : o.type === 'rocket-body' || o.type === 'debris' ? '<svg width="12" height="20" viewBox="-6 -10 12 20"><rect x="-3" y="-8" width="6" height="14" rx="2" fill="#fff2b3"/><path d="M-3 6 L-5 10 L5 10 L3 6Z" fill="#fa8127"/></svg>'
  : `<svg width="22" height="12" viewBox="-11 -6 22 12"><rect x="-3" y="-2" width="6" height="4" fill="${c}"/><rect x="-10" y="-1.5" width="6" height="3" fill="${c}" opacity=".8"/><rect x="4" y="-1.5" width="6" height="3" fill="${c}" opacity=".8"/></svg>`;
// Nothing up (2026-10-08): an empty sky map with why (daylight, cloud, a quiet gap), the next pass worth looking
// for as a tappable row, and ways on: jump the clock to the next pass, or see tonight's plan.
// Now, the countdown (2026-10-13, Sevaan approved design/sky-pages-combined.html): one hero for the next card worth
// getting (Uncommon+ new to you; Commons only once the rest run low). Up right now → "Up now" and Aim. Coming → a ring
// in its rarity colour that fills over the last hour, a live mm:ss countdown, an arrow that turns with the phone, Show
// me and a bell. "After that" lists the next three and the evening's best shiny chance.
let heroTimer = 0, heroRaf = 0;
let heroShine = false;
function nowHero(list, vis) {
  clearInterval(heroTimer); cancelAnimationFrame(heroRaf);
  const T = state.tonight, t0 = now().getTime(), tierN = (o) => TIER_RANK[(state.cardModels.get(cardKeyFor(o)) ?? o).tier] ?? 0, tierOf = (o) => TIER_INFO[(state.cardModels.get(cardKeyFor(o)) ?? o).tier] ?? TIER_INFO.common;
  const leftBetter = (state.catalog?.objects ?? []).filter((o) => !o.family && tierN(o) >= 1 && isNewFind(o)).length;
  const upNow = (vis ?? []).filter((it) => isNewFind(it.obj) && it.obj.natural !== 'star' && (leftBetter < 10 || tierN(it.obj) >= 1)).sort((a, b) => tierN(b.obj) - tierN(a.obj) || a.look.mag - b.look.mag)[0];
  const next = upNow ? null : bestUpcoming(T, t0);
  if (!upNow && !next) return;
  const o = upNow ? upNow.obj : next.obj, tier = tierOf(o), tgt = upNow ? upNow.look : { az: next.riseAz, el: next.riseEl };
  const key = next ? `${o.id}@${next.start}` : '';
  const hero = document.createElement('div'); hero.className = 'now-hero'; hero.style.setProperty('--c', tier.color);
  const R = 70, C = 2 * Math.PI * R;
  hero.innerHTML = `<span class="nh-k">${upNow ? 'Up now · new to you' : cloudAt(next.start) ? 'Next new card · cloud forecast' : 'Next new card'}</span>
    <div class="nh-dial"><svg viewBox="0 0 160 160" aria-hidden="true"><circle cx="80" cy="80" r="${R}" fill="none" stroke="#22344a" stroke-width="6"/><circle class="nh-arc" cx="80" cy="80" r="${R}" fill="none" stroke="var(--c)" stroke-width="6" stroke-linecap="round" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${upNow ? 0 : C.toFixed(1)}" transform="rotate(-90 80 80)"/></svg>
      <div class="nh-t">${upNow ? '<b>Up</b><small>now</small>' : '<b class="nh-cd">--:--</b><small class="nh-u">min</small>'}</div></div>
    <span class="nh-tier">${tier.gem} ${tier.label}${upNow ? '' : ' · new to you'}</span>
    <span class="nh-name">${escapeHtml(label(o))}</span>
    <span class="nh-dir"><i class="nh-arrow" aria-hidden="true"><svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 3 L19 19 L12 15 L5 19 Z" fill="currentColor"/></svg></i><span class="nh-turn"></span></span>
    <div class="nh-acts"><button type="button" class="pill-o nh-go"><span class="ico-svg">${ICON_TARGET}</span> ${upNow ? 'Aim at it' : 'Show me'}</button>${next ? `<button type="button" class="pill-g nh-bell${reminded.has(key) ? ' on' : ''}" aria-label="Remind me"${next.start > t0 + 10 * 60000 ? '' : ' disabled'}><span class="ico-svg">${ICON_BELL}</span></button>` : ''}</div>`;
  hero.querySelector('.nh-go').addEventListener('click', (e) => { flyToCircle(e.currentTarget); upNow ? aimAt(upNow) : showMePass(next); });
  const bell = hero.querySelector('.nh-bell');
  bell?.addEventListener('click', async () => { if (reminded.has(key)) { reminded.delete(key); cancelNotify(remindIds.get(key)?.id); remindIds.delete(key); saveRems(); bell.classList.remove('on'); } else if (await remindPass(next, key)) { reminded.add(key); bell.classList.add('on'); } });
  if (heroShine) { heroShine = false; hero.classList.add('shine'); }
  list.appendChild(hero);
  // Countdown, once a second while the tab is open.
  if (next) {
    const cd = hero.querySelector('.nh-cd'), u = hero.querySelector('.nh-u'), arc = hero.querySelector('.nh-arc');
    const tick = () => {
      if (!hero.isConnected || $('visible').hidden) { clearInterval(heroTimer); return; }
      const left = Math.max(0, Math.round((next.start - now().getTime()) / 1000));
      if (left <= 0) { clearInterval(heroTimer); renderVisible(); return; }
      const h = Math.floor(left / 3600), m = Math.floor(left / 60) % 60, sec = left % 60;
      cd.textContent = h ? `${h} h ${m} m` : `${m}:${String(sec).padStart(2, '0')}`; u.textContent = h ? 'to go' : 'min'; cd.classList.toggle('long', !!h);
      arc.setAttribute('stroke-dashoffset', (C * Math.min(1, left / 3600)).toFixed(1)); // fills over the last hour
    };
    tick(); heroTimer = setInterval(tick, 1000);
  }
  // The arrow and words follow the phone (same source as the map: the sky loop pauses under panels).
  const arrow = hero.querySelector('.nh-arrow'), turn = hero.querySelector('.nh-turn'), where = whereWords(tgt).toLowerCase();
  let lastTxt = '';
  const spin = () => {
    if (!hero.isConnected) return;
    if ($('visible').hidden) { heroRaf = requestAnimationFrame(spin); return; } // rendered just before the panel shows
    let b0 = [0, 1, 0]; try { b0 = (!state.drag.on && hasLiveSensors() ? trueBasis() : basisFromAzEl(state.drag.az, state.drag.el))?.back ?? b0; } catch {}
    const hd = (Math.atan2(b0[0], b0[1]) / RAD + 360) % 360, d = ((tgt.az - hd + 540) % 360) - 180;
    arrow.style.transform = `rotate(${d.toFixed(0)}deg)`;
    const txt = Math.abs(d) < 20 ? `Ahead of you · ${where}` : Math.abs(d) > 150 ? `Behind you · ${where}` : `Turn ${d < 0 ? 'left' : 'right'}${Math.abs(d) < 60 ? ' a little' : ''} · ${where}`;
    if (txt !== lastTxt) { lastTxt = txt; turn.textContent = txt; }
    heroRaf = requestAnimationFrame(spin);
  };
  spin();
  // After that: the next three worth it, plus the evening's best shiny chance.
  if (T) {
    const eve = eveningEnd(T), seen2 = new Set([cardKeyFor(o)]);
    const more = tonightPasses(T, t0).filter((p) => p.start > t0 && p.start <= eve && p.fresh && (leftBetter < 10 || tierN(p.obj) >= 1)).filter((p) => { const k = cardKeyFor(p.obj); if (seen2.has(k)) return false; seen2.add(k); return true; }).slice(0, 3);
    const sh = shinyChances(T, t0).filter((x) => x.t > t0 && x.t <= eve).sort((a, b) => ['eclipse', 'moon', 'overhead', 'fresh'].indexOf(a.kind) - ['eclipse', 'moon', 'overhead', 'fresh'].indexOf(b.kind))[0];
    const items = [...more.map((p) => ({ t: p.start, p, name: label(p.obj), sub: `<em style="color:${tierOf(p.obj).color}">${tierOf(p.obj).gem} ${tierOf(p.obj).label}</em> · ${whereWords({ el: p.peakEl, az: p.peakAz }).toLowerCase()}` })),
      ...(sh ? [{ t: sh.t, p: sh.p, name: label(sh.o), sub: `${escapeHtml(sh.line)} · <em style="color:var(--gold)">shiny chance</em>` }] : [])].sort((a, b) => a.t - b.t);
    if (items.length) {
      list.insertAdjacentHTML('beforeend', '<div class="t-head">Coming up</div>');
      for (const it of items) {
        const mins = Math.round((it.t - t0) / 60000), r = document.createElement('button'); r.type = 'button'; r.className = 'nh-after';
        r.innerHTML = `<span class="na-t">${fmtTime(it.t).replace(/\s?[AP]\.?M\.?$/i, '')}<small>${mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)} h ${mins % 60} m`}</small></span><span><b>${escapeHtml(it.name)}</b><small>${it.sub}</small></span><span class="na-go">${ICON_TARGET}</span>`;
        r.addEventListener('click', () => showMePass(it.p)); list.appendChild(r);
      }
    }
  }
}
function renderVisibleEmpty(list) {
  const t0 = now().getTime(), T = state.tonight, day = isDay(), wxT = tonightWeather();
  if (!T) requestTonight();
  const next = T ? bestUpcoming(T, t0) : null; // worth suggesting: no Commons until the rest run low
  const cloudy = wxT && !wxT.ok;
  const glyph = day ? '<circle r="13" fill="#fa8127" opacity=".9"/><circle r="22" fill="#fa8127" opacity=".12"/>'
    : cloudy ? '<path d="M-20 8 a9 9 0 0 1 3-17 a13 13 0 0 1 24-3 a10 10 0 0 1 13 20 Z" fill="#344654" stroke="#627a8b"/>'
    : '<path d="M4 -14 a14 14 0 1 0 10 22 a11 11 0 1 1 -10 -22 Z" fill="#fff2b3" opacity=".85"/>';
  const title = day ? 'The Sun has the sky' : cloudy ? 'Clouded over' : 'A quiet patch of sky';
  const why = day ? (T?.dusk > t0 ? `Satellites start to shine after dark, around <b>${fmtTime(T.dusk)}</b>.` : 'Satellites shine once the sky gets dark.')
    : cloudy ? `Sky: <b>${escapeHtml(wxT.line)}</b>. Passes still go over: find a gap in the clouds and you can still collect them.`
    : 'Nothing bright enough is up right now. Passes come in waves, so the next one is usually close.';
  const box = document.createElement('div'); box.className = 'vis-empty';
  box.innerHTML = `<svg viewBox="-118 -118 236 236" aria-hidden="true"><circle r="108" fill="#0b1626" stroke="#344654"/><circle r="72" fill="none" stroke="#1c2b3c"/><circle r="36" fill="none" stroke="#1c2b3c"/><path d="M0 -108 V108 M-108 0 H108" stroke="#1c2b3c"/>
    <g class="vm-rot"><g font-family="SC Label, Arial Narrow" font-size="11" fill="#bdbea9" text-anchor="middle"><text class="vm-up" data-x="0" data-y="-100" y="-96" fill="#fa8127">N</text><text class="vm-up" data-x="98" data-y="0" x="98" y="4">E</text><text class="vm-up" data-x="0" data-y="100" y="104">S</text><text class="vm-up" data-x="-98" data-y="0" x="-98" y="4">W</text></g></g><g class="ve-glyph">${glyph}</g></svg>
    <h3>${title}</h3><p>${why}</p>`;
  list.appendChild(box);
  box.querySelector('svg')?.remove(); // no sky map (2026-10-13)
  const tail = document.createElement('div'); nowHero(tail, []); list.insertBefore(tail, box); tail.replaceWith(...tail.childNodes); // the hero first, then why it's quiet
  if (false && next) { // replaced by the countdown hero above
    const tier = TIER_INFO[next.obj.tier] ?? TIER_INFO.common, mins = Math.round((next.start - t0) / 60000);
    const when = mins < 60 ? `in ${mins} min` : `in ${Math.floor(mins / 60)} h ${mins % 60 ? `${mins % 60} min` : ''}`.trim();
    list.insertAdjacentHTML('beforeend', '<div class="t-head">Next up</div>');
    const r = document.createElement('button'); r.type = 'button'; r.className = 'vis-row2'; r.style.setProperty('--tier', tier.color);
    r.innerHTML = `<span class="vr-ic">${visIcon(next.obj, tier.color)}</span><span class="vr-main"><b>${escapeHtml(label(next.obj))}${next.fresh ? '<span class="new">NEW</span>' : ''}</b><small>${fmtTime(next.start)} · ${when} · ${brightnessWord(next.mag)}</small></span><span class="vr-dir">${compassPoint(next.riseAz)}<em>to ${next.peakEl}° up</em></span>`;
    r.addEventListener('click', () => showMePass(next)); list.appendChild(r);
  }
  const acts = document.createElement('div'); acts.className = 'vis-empty-acts';
  const b = document.createElement('button'); b.className = 'big'; b.textContent = 'See tonight\'s run'; b.addEventListener('click', () => showVTab('tonight')); // no more 'next bright pass' toast (2026-10-13): Tonight has the plan // it aims you; it doesn't move the clock (QA 2026-10-08)
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
  const newUp = new Set(vis.filter((i) => i.obj.natural !== 'star' && isNewFind(i.obj)).map((i) => cardKeyFor(i.obj))).size; // new cards up, not every star (2026-10-13 playtest: "305" vs "8 up at once")
  document.querySelector('[data-vtab="now"]').textContent = newUp ? `Now · ${newUp} new` : 'Now';
  $('visible-hint').textContent = ''; list.innerHTML = '';
  if (!vis.length) { renderVisibleEmpty(list); return; }
  // The map turns with you (2026-10-08): whichever way you face is at the top, under a fixed soft wedge; the ring,
  // N/E/S/W and the dots rotate (labels stay upright). spinVisMap keeps it turning while the panel is open.
  const b0 = state.basis?.back ?? [0, 1, 0], heading = (Math.atan2(b0[0], b0[1]) / RAD + 360) % 360;
  const pos = (l) => { const r = 104 * (1 - Math.max(0, l.el) / 90), a = l.az * RAD; return [Math.sin(a) * r, -Math.cos(a) * r]; };
  const wedge = (() => { const a1 = -20 * RAD, a2 = 20 * RAD; return `<path d="M0 0 L${Math.sin(a1) * 104} ${-Math.cos(a1) * 104} A104 104 0 0 1 ${Math.sin(a2) * 104} ${-Math.cos(a2) * 104} Z" fill="#fa8127" opacity=".1"/>`; })();
  const up = (x, y) => `class="vm-up" data-x="${x.toFixed(1)}" data-y="${y.toFixed(1)}"`;
  // Everything but stars as its sky icon (2026-10-13, Sevaan: satellites and debris were missing or just dots).
  // Objects first so they're never cut by the cap, then stars.
  const objsFirst = [...vis.filter((it) => it.obj.natural !== 'star'), ...vis.filter((it) => it.obj.natural === 'star')].slice(0, 70);
  const dots = objsFirst.map((it, i) => { const [x, y] = pos(it.look), isStar = it.obj.natural === 'star', nw = isNewFind(it.obj) && !isStar, c = it.obj.natural ? '#f2d8a8' : '#fff2b3', lab = i < 7; // stars stay quiet: small, no ring
    return `<g class="vd" data-i="${i}" style="cursor:pointer"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="12" fill="transparent"/>${it.obj.natural ? `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${nw ? 4 : isStar ? 1.8 : 2.8}" fill="${c}"/>` : `<image class="vm-up" data-x="${x.toFixed(1)}" data-y="${y.toFixed(1)}" href="${mapIcon(it.obj, '#fff2b3')}" x="${(x - 7).toFixed(1)}" y="${(y - 7).toFixed(1)}" width="14" height="14"/>`}${nw ? `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="8.5" fill="none" stroke="#fa8127" stroke-width="1.2"/>` : ''}${lab ? `<text ${up(x, y)} x="${(x + 11).toFixed(1)}" y="${(y + 3.5).toFixed(1)}" font-family="SC Label, Arial Narrow" font-size="9.5" letter-spacing="1" fill="#fff2b3cc">${escapeHtml(label(it.obj).toUpperCase().slice(0, 16))}</text>` : ''}</g>`; }).join('');
  const map = document.createElement('div'); map.className = 'vis-map';
  map.innerHTML = `<svg viewBox="-118 -118 236 236"><circle r="108" fill="#0b1626" stroke="#344654"/>${wedge}<g class="vm-rot" transform="rotate(${-heading.toFixed(1)})"><circle r="72" fill="none" stroke="#1c2b3c"/><circle r="36" fill="none" stroke="#1c2b3c"/><path d="M0 -108 V108 M-108 0 H108" stroke="#1c2b3c"/>
    <g font-family="SC Label, Arial Narrow" font-size="11" fill="#bdbea9" text-anchor="middle"><text ${up(0, -100)} y="-96" fill="#fa8127">N</text><text ${up(98, 0)} x="98" y="4">E</text><text ${up(0, 100)} y="104">S</text><text ${up(-98, 0)} x="-98" y="4">W</text></g>${dots}</g><circle r="2.5" fill="#fa8127"/></svg>
    <p class="vis-map-note">You're facing <span class="vm-face">${compassPoint(heading)}</span> · tap a dot or a row to aim</p>`;
  map.addEventListener('click', (e) => { const g = e.target.closest('.vd'); if (g) aimAt(objsFirst[Number(g.dataset.i)]); });
  void map; nowHero(list, vis); // no sky map on Now (2026-10-13, Sevaan); the big next-card hero leads
  const row = (it) => { const o = it.obj, tier = TIER_INFO[o.tier] ?? TIER_INFO.common, nw = isNewFind(o), r = document.createElement('button'); r.type = 'button'; r.className = 'vis-row2';
    r.innerHTML = `<span class="vr-ic">${visIcon(o, o.natural ? '#f2d8a8' : tier.color)}</span><span class="vr-main"><b>${escapeHtml(label(o))}${nw ? '<span class="new">NEW</span>' : ''}</b><small>${tier.label} · ${brightnessWord(it.look.mag)}</small></span><span class="vr-dir">${compassPoint(it.look.az)}<em>${Math.round(it.look.el)}° up</em></span>`;
    r.addEventListener('click', () => aimAt(it)); return r; };
  const once = new Set(), uniq = vis.filter((it) => { const k = it.obj.natural === 'star' ? `star:${label(it.obj)}` : cardKeyFor(it.obj); if (once.has(k)) return false; once.add(k); return true; }); // one row per card (Alioth showed twice: bright star + its constellation's star)
  const isStar = (it) => it.obj.natural === 'star';
  const fresh = uniq.filter((it) => isNewFind(it.obj) && !isStar(it)), seen = uniq.filter((it) => !isNewFind(it.obj) && !isStar(it)), newStars = uniq.filter((it) => isNewFind(it.obj) && isStar(it)); // stars get their own section at the end (2026-10-13, Sevaan)
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
      c.replaceChildren(stripCard(o, `${compassPoint(it.look.az)} · ${Math.round(it.look.el)}° up`));
      c.setAttribute('aria-label', `${label(o)}, ${compassPoint(it.look.az)}, ${Math.round(it.look.el)} degrees up: aim at it`);
      c.addEventListener('click', () => aimAt(it)); strip.appendChild(c); });
    dragScroll(strip);
    list.appendChild(strip);
  }
  void newStars; // no stars section (2026-10-13, Sevaan)
}
// Mouse drag scrolls a sideways strip (fingers already swipe it). A drag doesn't count as a tap on a card.
// A small real card for the strips (2026-10-13): the card you'd see in the Collection, with a short status in its footer.
function stripCard(o, status) {
  const key = cardKeyFor(o), model = state.cardModels.get(key) ?? cardModel(o), sightings = state.sightings.filter((x) => !x.sim && x.cardKey === key);
  return miniCard(model, { sightings, status, locked: !sightings.length });
}
function dragScroll(el) {
  let x0 = null, s0 = 0;
  el.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; x0 = e.clientX; s0 = el.scrollLeft; delete el.dataset.dragged; });
  addEventListener('pointermove', (e) => { if (x0 == null) return; const dx = e.clientX - x0; if (Math.abs(dx) > 5) { el.dataset.dragged = '1'; el.style.scrollSnapType = 'none'; } el.scrollLeft = s0 - dx; });
  addEventListener('pointerup', () => { if (x0 == null) return; x0 = null; el.style.scrollSnapType = ''; setTimeout(() => delete el.dataset.dragged, 0); });
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
      if (data.progress) { tonightProgress = data.progress; if (!state.tonight && !$('vtab-tonight').hidden) renderTonightLoading(); return; }
      tonightBusy = false;
      if (data.error) return;
      state.tonight = { ...data, ...asked }; tonightProgress = null;
      dealMissions(state.tonight); shareTonight(state.tonight);
      if (isPlus()) setTimeout(requestWeek, 6000); // get the week ready in the background, so the Week tab opens done
      if (!$('vtab-tonight').hidden) renderTonight();
      lastChip = 0;
      const stale = asked.sb !== state.skySb || asked.lat !== state.observer.lat || asked.lon !== state.observer.lon || asked.bino !== state.binoculars;
      if (tonightAgain || stale) { tonightAgain = false; requestTonight(true); }
    };
    tonightWorker.onerror = () => { tonightBusy = false; };
    const base = skyLimit({ sb: state.skySb }), faintest = (state.binoculars ? base.binoculars : base.satellites) + 0.5;
    const objects = state.catalog.objects.filter((o) => o.stdMag + 5 * Math.log10(Math.max(o.perigee ?? 400, 200) / 1000) <= faintest);
    tonightWorker.postMessage({ requestId, objects, observer: state.observer, startMs, sb: state.skySb, binoculars: state.binoculars, progress: true });
  } catch { tonightBusy = false; }
}
// Tonight's missions come only from ones you could do from here (playtest 2026-10-09): from tonight's passes, work
// out which missions have something to catch, deal three from those, and keep that deal for the night (localStorage
// missionDeals) so scoring and every screen agree. Dealt once per night; the first night keeps the starter set.
// Share tonight's catchable passes with Collection (playtest 2026-10-09, #9/#10): Discover leads with them and a small
// collection shows "Up tonight" slots. localStorage tonightPlan, plus a nudge to the frame if it's loaded.
function shareTonight(T) {
  const passes = tonightPasses(T, now().getTime()).filter((p) => p.fresh).slice(0, 80)
    .map((p) => ({ key: cardKeyFor(p.obj), id: p.obj.id, start: p.start, end: p.end, peakEl: p.peakEl, dir: compassPoint(p.peakAz) }));
  try { localStorage.setItem('tonightPlan', JSON.stringify({ at: Date.now(), passes })); } catch {}
  if (colLoaded) colFrame.contentWindow?.postMessage({ sc: 'tonight' }, location.origin);
  if (pushOn()) scheduleAlerts(alertPicks(T));
}
// Which passes get an alert (2026-10-11, Sevaan: "we should only ever notify for stuff new to the collection… I don't
// want people to wake up to tons of notifications overnight… limited… the most interesting first… not common or
// uncommon until they are running low on all the other rarities"):
//   · new to your collection only (a card you don't have, or a fleet launch you haven't stamped)
//   · never in quiet hours (11 pm – 7 am local)
//   · at most 3 a night, the most interesting first: Legendary, Epic, Rare, then brightness and height
//   · Common and Uncommon (and fleet stamps) only once fewer than 10 Rare-or-better cards are left that you could get
//   · at least 30 minutes apart
//   · never when the forecast says fog, rain, snow or cloud for that hour (2026-10-12, Sevaan got one in fog); rechecked
//     whenever the forecast refreshes, and the push relay checks the weather again just before sending
const ALERT_MAX = 3, QUIET_FROM = 23, QUIET_TO = 7;
const quiet = (t) => { const h = new Date(t).getHours(); return h >= QUIET_FROM || h < QUIET_TO; };
function alertPicks(T) {
  const t0 = now().getTime();
  const fresh = tonightPasses(T, t0).filter((p) => p.fresh && p.start - 20 * 60000 > t0 && p.start <= t0 + 24 * 3600e3 && !quiet(p.start) && skyClearAt(state.weather, p.start));
  const tierOf = (o) => (state.cardModels.get(cardKeyFor(o)) ?? o).tier;
  const big = (o) => !o.family && ['rare', 'epic', 'legendary'].includes(tierOf(o));
  const leftBig = (state.catalog?.objects ?? []).filter((o) => big(o) && isNewFind(o)).length;
  const pool = leftBig >= 10 ? fresh.filter((p) => big(p.obj)) : fresh;
  const score = (p) => (big(p.obj) ? TIER_RANK[tierOf(p.obj)] * 100 : 0) + (p.obj.icon ? 40 : 0) + Math.max(0, 4 - p.mag) * 8 + p.peakEl / 3;
  const picks = [];
  for (const p of pool.slice().sort((a, b) => score(b) - score(a))) {
    if (picks.some((q) => Math.abs(q.start - p.start) < 30 * 60000)) continue;
    picks.push(p); if (picks.length >= ALERT_MAX) break;
  }
  return picks.sort((a, b) => a.start - b.start);
}
const ALERT_IDS = [7101, 7102, 7103];
async function scheduleAlerts(picks) {
  const alerts = picks.map((p) => ({ at: p.start - 5 * 60000, tag: `pass-${p.obj.id}`, ...alertText(p) }));
  if (!isNative()) { const o = state.observer; schedulePush(alerts, o ? { lat: Math.round(o.lat * 10) / 10, lon: Math.round(o.lon * 10) / 10 } : null); return; } // sent 5–20 min ahead (relay/push.ts EARLY)
  // The native app: local notifications, worked out on the phone, replaced each time tonight's plan is recalculated.
  for (const id of ALERT_IDS) await cancelNotify(id);
  for (const [i, a] of alerts.entries()) await notifyAt(a.at, a.title, a.body, { id: ALERT_IDS[i] });
}
// Pass alert wording (2026-10-10, Sevaan: "who cares about the degrees"). Lead with what it is (how old, whose, what for),
// then where to look in plain words. Title: "A 1979 American weather satellite at 8:13 PM". Body: "NOAA 6 rises in the
// south and climbs almost straight overhead. New to your collection."
const WORD = { N: 'north', NE: 'northeast', E: 'east', SE: 'southeast', S: 'south', SW: 'southwest', W: 'west', NW: 'northwest' };
const dirWord = (az) => WORD[compassPoint(az)] ?? compassPoint(az);
// "High in the west": where to look in words, not degrees (writing room 2026-10-12).
function whereWords(l) { return `${l.el >= 60 ? 'High' : l.el >= 30 ? 'Halfway up' : 'Low'} in the ${dirWord(l.az)}`; }
const PURPOSE_WORD = [[/^NOAA|^METEOR|^GOES|^METOP|^FENGYUN|^DMSP|^TIROS|^NIMBUS|^ELEKTRO|^HIMAWARI/, 'weather satellite'], [/^NAVSTAR|^GPS|^GLONASS|^BEIDOU|^GALILEO|^TRANSIT|^PARUS|^TSIKADA|^NNSS/, 'navigation satellite'],
  [/^LANDSAT|^SPOT|^RESURS|^SENTINEL|^TERRA|^AQUA|^ENVISAT|^ERS-|^CBERS|^OKEAN|^KOMPSAT/, 'Earth-watching satellite'], [/^HST|HUBBLE|TELESCOPE|^SWIFT|^FERMI|^XMM|^CHANDRA/, 'space telescope'],
  [/^IRIDIUM|^GLOBALSTAR|^ORBCOMM|^INTELSAT|^MOLNIYA|^STRELA|^GONETS|^TELSTAR|^RELAY|^ECHO/, 'communications satellite'], [/^YAOGAN|^USA \d|^NROL|^LACROSSE|^KH-/, 'spy satellite']];
function adjOf(owner, year) {
  if (owner === 'CIS') return year && year < 1992 ? 'Soviet' : 'Russian';
  return { US: 'American', PRC: 'Chinese', JPN: 'Japanese', FR: 'French', ESA: 'European', CA: 'Canadian', IT: 'Italian', IND: 'Indian', UK: 'British', GER: 'German', SKOR: 'South Korean', ISRA: 'Israeli', BRAZ: 'Brazilian', ARGN: 'Argentinian' }[owner] ?? '';
}
// "A 1998 American rocket stage": what something is, in plain words (pass alerts, the below-the-horizon circle).
function describe(o, { stamp = true } = {}) {
  const card = state.cardModels.get(cardKeyFor(o)) ?? o, year = Number(String(o.launch ?? card.launch ?? '').slice(0, 4)) || null;
  const adj = adjOf(o.owner ?? card.owner, year);
  if (o.type === 'station') return /ISS|ZARYA/.test(o.name) ? 'The Space Station' : `China's Tiangong station`;
  if (o.family) return stamp ? `A new ${card.familyName ?? 'fleet'} launch to stamp` : `One of the ${card.familyName ?? 'fleet'} fleet`;
  if (o.type === 'debris') return `A piece of ${year ? `${Math.floor(year / 10) * 10}s ` : ''}space junk`;
  if (o.type === 'rocket-body') return `A ${[year, adj].filter(Boolean).join(' ')} rocket stage`;
  return `A ${[year, adj].filter(Boolean).join(' ')} ${PURPOSE_WORD.find(([re]) => re.test(o.name))?.[1] ?? 'satellite'}`;
}
function alertText(p) {
  const o = p.obj, card = state.cardModels.get(cardKeyFor(o)) ?? o;
  const when = fmtTime(p.start), what = describe(o);
  const peak = dirWord(p.peakAz), rise = dirWord(p.riseAz), h = p.peakEl >= 75 ? 3 : p.peakEl >= 50 ? 2 : p.peakEl >= 28 ? 1 : 0;
  const climb = h === 3 ? 'passes almost straight overhead' : rise === peak ? ['stays low', 'climbs halfway up', 'climbs high'][h] : [`skims low across the ${peak}`, `arcs halfway up the ${peak} sky`, `arcs high into the ${peak}`][h];
  // Time first, so the lock screen never cuts it off (2026-10-12, Sevaan, from the writing room):
  //   "9:02 PM: an Epic card flies over" / "Hubble, a 1990 American space telescope. Look south: it climbs high."
  const tier = !o.family && { rare: 'a Rare', epic: 'an Epic', legendary: 'a Legendary' }[card.tier];
  const title = `${when}: ${o.family ? `a new ${card.familyName ?? 'fleet'} batch flies over` : `${tier ?? 'a new'} card flies over`}`;
  const what2 = o.family ? `One more for your ${card.familyName ?? 'fleet'} card` : `${label(o)}, ${what.replace(/^(A|An|The) /, (m) => m.toLowerCase())}`;
  return { title, body: `${what2}. Look ${rise}: it ${climb}.` };
}
function dealMissions(T) {
  if (!T?.passes) return;
  const night = String(nightKey(now().getTime(), state.observer.lon ?? 0)), deals = readDeals();
  if (deals[night]) return;
  const objs = T.passes.map((p) => state.byId.get(p.id)).filter(Boolean), yr = now().getFullYear();
  const has = (f) => objs.some(f), year = (o) => Number(String(o.launch ?? '').slice(0, 4)) || null;
  const can = new Set(['star', 'planet', 'conset']);
  const ownedN = new Set(state.sightings.filter((s) => !s.sim).map((s) => s.cardKey)).size;
  if (ownedN >= 3) can.add('again');
  if (ownedN >= 5) can.add('levelup2');
  if (state.naturals?.some((n) => n.obj.natural === 'deepsky' && n.look.visible)) can.add('deep');
  if (T.passes.some((p) => { const o = state.byId.get(p.id); return o && ['rare', 'epic', 'legendary'].includes(o.tier) && isNewFind(o); })) can.add('rarenew');
  if (has((o) => o.type === 'rocket-body')) can.add('stage');
  if (has((o) => year(o) && year(o) < 1980)) can.add('old');
  if (has((o) => year(o) && year(o) >= yr - 5)) can.add('recent');
  if (has((o) => o.owner === 'CIS')) can.add('soviet');
  if (has((o) => o.owner === 'CIS') && has((o) => o.owner === 'US')) can.add('race');
  if (has((o) => ['epic', 'legendary'].includes(o.tier))) can.add('epic');
  if (has((o) => o.type === 'debris')) can.add('junk');
  if (T.passes.some((p) => p.peakEl >= 60)) can.add('high');
  deals[night] = missionsFor(night, can).map((m) => m.id);
  const keep = Object.keys(deals).sort((a, b) => Number(b) - Number(a)).slice(0, 90);
  try { localStorage.setItem('missionDeals', JSON.stringify(Object.fromEntries(keep.map((k) => [k, deals[k]])))); } catch {}
}
function showVTab(tab) {
  if (tab === 'now') heroShine = true; // the next-card hero shimmers once each time you arrive on Now (2026-10-13, Sevaan)
  document.querySelectorAll('[data-vtab]').forEach((b) => { b.classList.toggle('on', b.dataset.vtab === tab); b.setAttribute('aria-selected', String(b.dataset.vtab === tab)); });
  $('vtab-now').hidden = tab !== 'now'; $('vtab-tonight').hidden = tab !== 'tonight'; $('vtab-week').hidden = tab !== 'week';
  $('visible-title').textContent = 'Up in your sky';
  $('visible-sub').textContent = `${state.observer.label?.replace(/^Example:\s*/, '') ?? 'Your sky'} · ${fmtTime(now().getTime())}`; // also when opening straight on Tonight or Week (2026-10-13)
  if (tab === 'tonight') renderTonight();
  else if (tab === 'week') renderWeek();
  else renderVisible(); // always fresh: switching back from Tonight used to show an old (sometimes empty) list (2026-10-08)
}
document.querySelectorAll('[data-vtab]').forEach((b) => b.addEventListener('click', () => showVTab(b.dataset.vtab)));
// ---------- Shiny forecast (Plus, 2026-10-11) ----------
// The moments tonight a shiny is possible, from the planner (tonight-worker.js): a satellite fading into Earth's
// shadow while still high up (eclipse), passing within a degree of the Moon, almost straight overhead (80°+), or
// launched under a month ago. Same rules as js/shiny.js; fleet members (Starlink…) never count.
function shinyChances(T, t0) {
  const out = [];
  for (const p of T.passes) {
    if (p.end < t0) continue;
    const o = state.byId.get(p.id); if (!o || o.family) continue;
    if (p.eclipseAt) out.push({ o, p: { ...p, obj: o }, t: p.eclipseAt, kind: 'eclipse', line: `slips into Earth's shadow ${whereWords({ el: p.eclipseEl, az: p.eclipseAz }).toLowerCase()}` }); // words, not degrees (2026-10-13 playtest)
    if (p.moonSep != null && p.moonSep < 1) out.push({ o, p: { ...p, obj: o }, t: p.moonAt, kind: 'moon', line: 'passes right beside the Moon' });
    if (p.peakEl >= 86) out.push({ o, p: { ...p, obj: o }, t: p.peakAt, kind: 'overhead', line: 'passes almost straight overhead' });
    if (o.launch && p.start - Date.parse(`${o.launch}T00:00:00Z`) < 30 * 86400e3) out.push({ o, p: { ...p, obj: o }, t: p.start, kind: 'fresh', line: 'launched less than a month ago' });
  }
  const seen = new Set();
  return out.filter((x) => { const k = `${x.o.id}|${x.kind}`; if (seen.has(k)) return false; seen.add(k); return true; }).sort((a, b) => a.t - b.t);
}
// Shiny chances (2026-10-13, Sevaan): room under the heading, a target on each row that sets it up like Show me, and
// a short "what's a shiny?" box above the first one that can be closed for good (localStorage shinyExplained).
function renderShinyForecast(list, T, t0) {
  const ch = shinyChances(T, t0); if (!ch.length) return;
  const plus = isPlus();
  const rows = plus ? ch.slice(0, 8) : [ch.find((x) => x.kind === 'eclipse' || x.kind === 'moon') ?? ch[0]];
  let explained = false; try { explained = localStorage.getItem('shinyExplained') === '1'; } catch {}
  const wrap = document.createElement('div'); wrap.className = 'shiny-sec';
  wrap.innerHTML = `<div class="t-head">${plus ? 'Shiny chances tonight' : "Tonight's best shiny chance"}</div>`
    + (explained ? '' : `<div class="shiny-what"><button type="button" class="x-close sw-x" aria-label="Got it, hide this">✕</button><b>What's a shiny?</b><p>A rare version of a card with a special finish, earned by catching something at a lucky moment: slipping into Earth's shadow, passing beside the Moon, straight overhead, or just launched. Same card, but it shimmers in your collection.</p></div>`)
    + `<div class="shiny-list">${rows.map((x, i) => `<div class="shiny-row"><b>${fmtTime(x.t)}</b><span><i>${escapeHtml(label(x.o))}</i> ${escapeHtml(x.line)}</span><small>${escapeHtml(SHINY[x.kind]?.label ?? '')}</small><button class="ic showme" type="button" data-i="${i}" aria-label="Show me where to look">${ICON_TARGET}</button></div>`).join('')}</div>`
    + (plus ? '' : '<button type="button" class="shiny-tease" id="shiny-tease">See every shiny chance <span class="plus-tag">PLUS</span></button>');
  list.appendChild(wrap);
  wrap.querySelectorAll('.showme').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); flyToCircle(b); showMePass(rows[Number(b.dataset.i)].p); }));
  wrap.querySelector('.sw-x')?.addEventListener('click', () => { try { localStorage.setItem('shinyExplained', '1'); } catch {} wrap.querySelector('.shiny-what').remove(); });
  $('shiny-tease')?.addEventListener('click', () => openPlus('shiny'));
}
// ---------- The week ahead (Plus, 2026-10-11, design/plans.html) ----------
// Tonight plus the next six nights: passes worth seeing, new cards, the rarest new find, the cloud forecast, and the
// best night to go out. Each later night runs through the same planner (tonight-worker.js, 2-minute steps) one after
// another in the background, only when a Plus player opens the tab; kept for the day and place.
let weekWorker = null, weekRun = 0;
const nightNoon = (n) => { const d = new Date(now().getTime()); d.setHours(15, 0, 0, 0); d.setDate(d.getDate() + n); return d.getTime(); };
function weekKey() { return `${new Date(now().getTime()).toDateString()}|${state.observer.lat?.toFixed(2)},${state.observer.lon?.toFixed(2)}|${state.skySb}|${state.binoculars}`; }
// Faster (2026-10-13, Sevaan: "loads really slow"): only the evening is worked out (15:00 to 1 AM; Night owl: to dawn),
// in 3-minute steps, three nights at once in three workers, and the result is kept for the day and place in
// localStorage 'weekCache', so reopening the tab is instant.
let weekWorkers = [];
function requestWeek() {
  if (!isPlus() || !state.catalog || !state.observer) return;
  const key = weekKey(); if (state.week?.key === key) return;
  try { const c = JSON.parse(localStorage.getItem('weekCache') ?? 'null'); if (c?.key === key && c.nights?.length === 6) { state.week = { key, nights: c.nights, busy: false }; return; } } catch {}
  const run = ++weekRun; state.week = { key, nights: [], busy: true };
  const base = skyLimit({ sb: state.skySb }), faintest = (state.binoculars ? base.binoculars : base.satellites) + 0.5;
  const objects = state.catalog.objects.filter((o) => o.stdMag + 5 * Math.log10(Math.max(o.perigee ?? 400, 200) / 1000) <= faintest);
  const W = Math.max(1, Math.min(3, (navigator.hardwareConcurrency || 4) - 1));
  while (weekWorkers.length < W) weekWorkers.push(new Worker(new URL(`./tonight-worker.js?v=${VERSION}`, import.meta.url), { type: 'module' }));
  const hours = readPref('nightOwl', false) ? 18 : 10, queue = [1, 2, 3, 4, 5, 6];
  let left = 6;
  const done = () => {
    state.week.busy = false; state.week.nights.sort((a, b) => a.n - b.n);
    try { localStorage.setItem('weekCache', JSON.stringify({ key, nights: state.week.nights.map(({ curve, ...N }) => N) })); } catch {} // the curve isn't used here; keeps it small
    if (!$('vtab-week').hidden) renderWeek();
  };
  const go = (w) => {
    if (run !== weekRun) return; const n = queue.shift(); if (n == null) return;
    w.onmessage = ({ data }) => {
      if (run !== weekRun || data.progress) return;
      if (!data.error) { state.week.nights.push({ ...data, n }); state.week.nights.sort((a, b) => a.n - b.n); }
      if (--left === 0) done(); else if (!$('vtab-week').hidden) renderWeek();
      go(w);
    };
    w.postMessage({ requestId: n, objects, observer: state.observer, startMs: nightNoon(n), sb: state.skySb, binoculars: state.binoculars, hours, step: 180000 });
  };
  weekWorkers.slice(0, W).forEach(go);
}
// One night's summary: the passes worth seeing (same filter as Tonight), new cards, rarest new tier, the weather.
const TIER_RANK = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };
function nightSummary(N) {
  const eve = eveningEnd(N), passes = tonightPasses(N, N.startMs).filter((p) => p.start <= eve), fresh = passes.filter((p) => p.fresh); // the evening, like the rest of the plan (Night owl: to dawn)
  const newKeys = new Set(fresh.map((p) => cardKeyFor(p.obj)));
  const rarest = fresh.reduce((a, p) => (!a || TIER_RANK[p.obj.tier] > TIER_RANK[a.obj.tier] ? p : a), null);
  const wx = state.weather?.hours?.length && N.dusk ? state.weather.hours.filter((h) => h.t >= N.dusk - 1800e3 && h.t <= eve) : []; // the evening, same as the passes (it rated the whole night while showing the evening)
  const clearShare = wx.length ? wx.filter((h) => h.cloud <= 40 && !['rain', 'snow', 'storm', 'fog'].includes(h.kind)).length / wx.length : null;
  const worst = wx.reduce((a, h) => (['storm', 'rain', 'snow', 'fog'].indexOf(h.kind) > ['storm', 'rain', 'snow', 'fog'].indexOf(a) ? h.kind : a), 'clear');
  const sky = clearShare == null ? 'Forecast not out yet' : clearShare >= 0.8 ? 'Clear' : clearShare >= 0.5 ? 'Mostly clear' : ['rain', 'snow', 'storm', 'fog'].includes(worst) ? worst[0].toUpperCase() + worst.slice(1) : 'Cloudy';
  const score = (clearShare ?? 0.6) * (newKeys.size * 3 + passes.length + (rarest ? TIER_RANK[rarest.obj.tier] * 4 : 0));
  return { passes, newCount: newKeys.size, rarest, sky, clearShare, score, wx };
}
let weekOpen = null, weekSel = null, weekPicked = false;
function renderWeek() {
  const el = $('week-body');
  if (!isPlus()) {
    el.innerHTML = `<div class="week-lock"><b>The week ahead</b><p>Tonight is free. Plus shows the next six nights too: every pass worth seeing, new cards, the cloud forecast and the best night to go out.</p><button class="d-cta o" type="button" id="week-plus"><span>See Space Collector Plus</span><span>→</span></button></div>`;
    $('week-plus').onclick = () => openPlus('week'); return;
  }
  requestWeek();
  // Week, round 3 (2026-10-13, design/sky-pages-combined.html): a 7-day strip (weather, Moon, a dot for each rare card
  // that night), the selected night (best by default) as a card with its rarest new catches (target + bell), "Only
  // this week" (rare cards on only one or two of the seven evenings, a meteor shower) and a weekly goal ring.
  const nights = [];
  if (state.tonight) nights.push({ ...state.tonight, n: 0 });
  nights.push(...(state.week?.nights ?? []));
  const t0 = now().getTime(), sums = nights.map((N) => ({ N, s: nightSummary(N) }));
  const dayShort = (N) => new Date(N.dusk ?? N.startMs).toLocaleDateString([], { weekday: 'short' }).toUpperCase().slice(0, 3);
  const day = (N) => (N.n === 0 ? 'Tonight' : N.n === 1 ? 'Tomorrow' : new Date(N.startMs).toLocaleDateString([], { weekday: 'long' }));
  const date = (N) => new Date(N.dusk ?? N.startMs).toLocaleDateString([], { month: 'short', day: 'numeric' });
  const clearH = (h) => h.cloud <= 40 && !['rain', 'snow', 'storm', 'fog'].includes(h.kind);
  const hr = (t) => fmtTime(t).replace(/:00(?=\s?[AP])/i, '');
  const weather = (N, s) => {
    const hs = (s.wx ?? []).filter((h) => h.t >= N.dusk - 1800e3);
    if (!hs.length) return { kind: null, phrase: 'Forecast soon', good: null };
    const c = hs.map(clearH), wet = hs.find((h) => ['rain', 'snow', 'storm'].includes(h.kind)), fog = hs.find((h) => h.kind === 'fog');
    const bad = wet ? wet.kind : fog ? 'fog' : 'cloudy', BADW = { rain: 'Rain', snow: 'Snow', storm: 'Storms', fog: 'Fog', cloudy: 'Cloudy' };
    if (c.every(Boolean)) return { kind: 'clear', phrase: 'Clear all evening', good: true };
    if (!c.some(Boolean)) return { kind: bad, phrase: `${BADW[bad]} all evening`, good: false };
    const firstClear = c.indexOf(true), lastClear = c.lastIndexOf(true), share = c.filter(Boolean).length / c.length;
    if (c[0] && c.slice(0, lastClear + 1).every(Boolean)) return { kind: 'mostly', phrase: `Clear until ${hr(hs[lastClear + 1].t)}`, good: share >= 0.4 };
    if (!c[0] && c.slice(firstClear).every(Boolean)) return { kind: 'mostly', phrase: `Clear from ${hr(hs[firstClear].t)}`, good: share >= 0.4 };
    return { kind: share >= 0.5 ? 'mostly' : bad, phrase: share >= 0.5 ? 'Mostly clear, some cloud' : 'Breaks in the cloud', good: share >= 0.5 };
  };
  const tierN = (o) => TIER_RANK[(state.cardModels.get(cardKeyFor(o)) ?? o).tier] ?? 0, tierOf = (o) => TIER_INFO[(state.cardModels.get(cardKeyFor(o)) ?? o).tier] ?? TIER_INFO.common;
  const icon = (k) => (k ? WX_ICON[k] ?? WX_ICON.cloudy : '<span class="ico" data-ico="calendar" aria-hidden="true"></span>');
  // Which nights each rare-or-better new card is up (one entry per card per night, its best pass).
  const rareBy = new Map();
  const rows = sums.map(({ N, s }) => {
    const best = new Map();
    for (const p of s.passes) { if (!p.fresh || tierN(p.obj) < 2) continue; const k = cardKeyFor(p.obj); const b = best.get(k); if (!b || p.peakEl > b.peakEl) best.set(k, p); }
    for (const [k, p] of best) { if (!rareBy.has(k)) rareBy.set(k, []); rareBy.get(k).push({ N, p }); }
    return { N, s, w: weather(N, s), rare: [...best.values()].sort((a, b) => tierN(b.obj) - tierN(a.obj)) };
  });
  const goodOnes = rows.filter((r) => r.w.good);
  const best = (goodOnes.length ? goodOnes : rows.filter((r) => r.w.good != null)).reduce((a, r) => (!a || r.s.score > a.s.score ? r : a), null) ?? rows[0];
  if (!weekPicked || !rows.some((r) => r.N.n === weekSel)) weekSel = best?.N.n ?? 0; // the best night until you pick one
  const sel = rows.find((r) => r.N.n === weekSel);
  // Moon: lit fraction from the planner, drawn as a disc with the lit part on the right.
  const moon = (f) => { const x = Math.round((1 - (f ?? 0)) * 100); return `<span class="wk4-moon" style="--lit:${x}%" aria-label="Moon ${Math.round((f ?? 0) * 100)}% lit"></span>`; };
  const strip = `<div class="wk4-days">${rows.map((r) => `<button type="button" class="wk4-day${r.N.n === weekSel ? ' sel' : ''}${r === best ? ' best' : ''}${r.w.good ? ' good' : ''}" data-n="${r.N.n}"><span>${r.N.n === 0 ? 'TON' : dayShort(r.N)}</span><i class="wk4-ic">${icon(r.w.kind)}</i>${moon(r.N.moonIllum)}<span class="wk4-dots">${r.rare.slice(0, 3).map((p) => `<i style="background:${tierOf(p.obj).color}"></i>`).join('')}</span></button>`).join('')}${'<span class="wk4-day ghost"></span>'.repeat(Math.max(0, 7 - rows.length))}</div>`;
  let card = '';
  if (sel) {
    const { N, s, w } = sel, top = sel.rare[0], isBest = sel === best;
    const moonWord = N.moonIllum == null ? '' : N.moonIllum < 0.25 ? 'a thin Moon' : N.moonIllum > 0.8 ? 'a bright Moon' : 'some Moon';
    const why = [w.phrase.replace(/^./, (c) => c.toLowerCase()), moonWord, top ? `<b style="color:${tierOf(top.obj).color}">${tierOf(top.obj).gem} ${escapeHtml(tierOf(top.obj).label)}</b> ${escapeHtml(label(top.obj))}` : ''].filter(Boolean);
    const seenK = new Set(), picks = s.passes.filter((p) => p.fresh && tierN(p.obj) >= 1).sort((a, b) => tierN(b.obj) - tierN(a.obj) || (a.mag ?? 9) - (b.mag ?? 9)).filter((p) => { const k = cardKeyFor(p.obj); if (seenK.has(k)) return false; seenK.add(k); return true; }).slice(0, 4).sort((a, b) => a.start - b.start);
    card = `<div class="wk4-pick${isBest ? '' : ' plain'}"><span class="k">${isBest ? (goodOnes.length ? 'Best night this week' : 'No clear evening yet · the best chance') : 'This night'}</span>
      <div class="wk4-d"><i class="wk4-big-ic ${w.kind ?? ''}">${icon(w.kind)}</i><b>${escapeHtml(day(N))}</b><small>${escapeHtml(date(N))}</small></div>
      <p class="wk4-why">${why.map((x, i) => (i === 0 ? x.replace(/^./, (c) => c.toUpperCase()) : x)).join(' · ')}</p>
      <div class="rs-gets"><span>${s.newCount} new cards</span>${N.dusk ? `<span>Dark ${fmtTime(N.dusk)}</span>` : ''}</div>
      <div class="wk4-stops">${picks.map((p) => `<div class="wk4-stop" style="--c:${tierOf(p.obj).color}" data-k="${p.obj.id}@${p.start}"><span class="ws-t">${fmtTime(p.start).replace(/\s?[AP]\.?M\.?$/i, '')}</span><span class="ws-m"><b>${escapeHtml(label(p.obj))}</b><small><em>${tierOf(p.obj).gem} ${tierOf(p.obj).label}</em> · ${whereWords({ el: p.peakEl, az: p.peakAz }).toLowerCase()}</small></span><span class="rs-acts"><button type="button" class="ic showme" aria-label="Show me where to look">${ICON_TARGET}</button><button type="button" class="ic bell${reminded.has(`${p.obj.id}@${p.start}`) ? ' on' : ''}" aria-label="Remind me">${ICON_BELL}</button></span></div>`).join('') || '<p class="hint">No new Uncommon or rarer cards that evening.</p>'}</div>
      ${N.n > 0 && N.dusk ? `<button type="button" class="wk4-foot" id="wk-remind"><span><span class="ico" data-ico="bell" aria-hidden="true"></span> Remind me ${escapeHtml(day(N))} at dark</span><span class="wf-t">${fmtTime(N.dusk)}</span></button>` : ''}</div>`; // the card's footer: a gold rule, the strip under it is the button (2026-10-13, Sevaan)
    sel.picks = picks;
  }
  // Only this week: rare-or-better cards up on just one or two of these evenings, rarest first; and a meteor shower.
  const only = [...rareBy.entries()].filter(([, v]) => v.length <= 2 && rows.length >= 5).map(([, v]) => v).sort((a, b) => tierN(b[0].p.obj) - tierN(a[0].p.obj)).slice(0, 4);
  const ev = nextEvent(t0), evIn = ev && ev.start < t0 + 7 * 86400e3;
  const onlyHtml = (only.length || evIn) ? `<div class="t-head">Only this week</div>${only.map((v) => { const o = v[0].p.obj, t = tierOf(o); return `<button type="button" class="wk4-only" style="--c:${t.color}" data-n="${v[0].N.n}"><i></i><span><b>${escapeHtml(label(o))}</b><small>${t.gem} ${t.label} · ${v.map((x) => `${x.N.n <= 1 ? day(x.N).toLowerCase() : day(x.N)} ${fmtTime(x.p.start)}`).join(', ')}${v.length === 1 ? ' only' : ''}</small></span><em>${v.map((x) => (x.N.n === 0 ? 'TON' : dayShort(x.N))).join(' · ')}</em></button>`; }).join('')}${evIn ? `<div class="wk4-only" style="--c:var(--cyan,#7fd3ff)"><i></i><span><b>${escapeHtml(ev.name)}</b><small>Meteor shower · a badge for any catch</small></span><em>${new Date(ev.start + 30 * 3600e3).toLocaleDateString([], { weekday: 'short' }).toUpperCase()}</em></div>` : ''}` : '';
  // Weekly goal: new cards since Monday.
  const ws = weekStart(t0), firsts = new Map(); for (const x of state.sightings) { if (x.sim) continue; const f = firsts.get(x.cardKey); if (f == null || x.time < f) firsts.set(x.cardKey, x.time); }
  const got = [...firsts.values()].filter((t) => t >= ws).length, GOAL = 5, frac = Math.min(1, got / GOAL), RC = 2 * Math.PI * 18;
  const goal = `<div class="wk4-goal"><svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="18" fill="none" stroke="#22344a" stroke-width="5"/><circle cx="22" cy="22" r="18" fill="none" stroke="var(--gold)" stroke-width="5" stroke-linecap="round" stroke-dasharray="${RC.toFixed(1)}" stroke-dashoffset="${(RC * (1 - frac)).toFixed(1)}" transform="rotate(-90 22 22)"/></svg><span><b>${Math.min(got, GOAL)} of ${GOAL} new cards this week</b><small>${got >= GOAL ? 'Goal reached. Everything else is a bonus.' : `${GOAL - got} more by Sunday keeps your streak going`}</small></span></div>`;
  el.innerHTML = strip + card + onlyHtml + goal + (state.week?.busy ? '<p class="hint">Working out the rest of the week…</p>' : '');
  el.querySelectorAll('.wk4-day[data-n], .wk4-only[data-n]').forEach((b) => b.onclick = () => { weekSel = Number(b.dataset.n); weekPicked = true; renderWeek(); el.closest('.panel')?.scrollTo({ top: 0, behavior: 'smooth' }); });
  el.querySelectorAll('.wk4-stop').forEach((r, i) => { const p = sel.picks[i];
    r.querySelector('.showme').onclick = (e) => { e.stopPropagation(); flyToCircle(e.currentTarget); showMePass(p); };
    const bell = r.querySelector('.bell'), key = r.dataset.k;
    bell.onclick = async (e) => { e.stopPropagation(); if (reminded.has(key)) { reminded.delete(key); cancelNotify(remindIds.get(key)?.id); remindIds.delete(key); saveRems(); bell.classList.remove('on'); } else if (await remindPass(p, key)) { reminded.add(key); bell.classList.add('on'); } };
    r.onclick = () => showTonightCard(p.obj, r.getBoundingClientRect(), `${day(sel.N).toUpperCase()} · ${fmtTime(p.start)}`); });
  const wr = $('wk-remind');
  if (wr && sel) wr.onclick = async () => { const N = sel.N, r = await setReminder({ at: N.dusk, title: `${day(N)}: time to look up`, body: 'It\'s dark enough. Open Space Collector and look up.', key: `week-${N.n}-${N.dusk}` }); if (r === 'on') { wr.firstElementChild.innerHTML = `<span class="ico" data-ico="bell" aria-hidden="true"></span> Reminder set`; wr.classList.add('on'); wr.disabled = true; } else if (r !== 'limit') { wr.querySelector('.wf-t').textContent = r === 'app-only' ? 'Works in the app' : 'Couldn\'t set it'; } };
}
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
let tlAll = false; // "Everything tonight" opened
const tlFilter = { min: 0, newOnly: false }, tlExpanded = { next: false, later: false, late: false, dawn: false };
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
// Loading (2026-10-13, Sevaan: "needs a better loading state"): the night being worked out, live. The chart grows as the
// planner steps through the night, with how far it has got and how many passes it has found; placeholder rows below.
let tonightProgress = null;
function renderTonightLoading() {
  const pr = tonightProgress, W = 340, H = 64;
  let bars = '';
  if (pr?.curve?.length) {
    const a = pr.dusk ?? pr.curve[0][0], bins = [];
    for (const [t, n] of pr.curve) { if (t < a) continue; const i = Math.floor((t - a) / 600000); bins[i] = Math.max(bins[i] ?? 0, n); }
    const maxN = Math.max(1, ...bins.filter(Boolean)), slots = 72, bw = W / slots; // ~12 hours of 10-minute bins
    bars = bins.map((n, i) => (n ? `<rect x="${(i * bw + 0.5).toFixed(1)}" y="${(H - (n / maxN) * H).toFixed(1)}" width="${Math.max(1, bw - 1).toFixed(1)}" height="${((n / maxN) * H).toFixed(1)}" rx="1" fill="#fa8127" opacity=".8"/>` : '')).join('');
    const xs = Math.min(W, bins.length * bw); bars += `<line x1="${xs}" x2="${xs}" y1="0" y2="${H}" stroke="#fff2b3" stroke-width="1.2" class="tl-scan"/>`;
  }
  $('tonight-summary').innerHTML = `<div class="tl-load"><span class="tl-load-dial" aria-hidden="true"><i></i></span><span><b>Working out tonight's sky</b><small>${pr ? `Checked to ${fmtTime(pr.t)} · ${pr.found} pass${pr.found === 1 ? '' : 'es'} so far` : 'Starting from dusk, minute by minute'}</small></span></div>`;
  $('tonight-chart').innerHTML = `<svg viewBox="0 0 ${W} ${H + 4}" role="img" aria-label="Satellites visible through the night, still being worked out"><line x1="0" x2="${W}" y1="${H}" y2="${H}" stroke="#344654"/>${bars}</svg>`;
  $('tonight-list').innerHTML = '<div class="tl-skel"></div><div class="tl-skel"></div><div class="tl-skel"></div><div class="tl-skel short"></div>';
}
// Tonight's run (2026-10-13, Sevaan approved design/sky-pages-combined.html): the haul at the top (new cards this
// evening by rarity, the best window, XP), then a short itinerary: the rarest new cards (no Commons until the rest run
// low), the best shiny chance, moments (dark, busiest, cloud) and a dawn station as "Early riser". Each stop has a
// target (Show me) and a bell; "Set reminders" sets them all (free players: one, then the Plus sheet).
function renderRun(T, t0, wxT, peak) {
  const eve = eveningEnd(T), tierN = (o) => TIER_RANK[(state.cardModels.get(cardKeyFor(o)) ?? o).tier] ?? 0, tierOf = (o) => TIER_INFO[(state.cardModels.get(cardKeyFor(o)) ?? o).tier] ?? TIER_INFO.common;
  const all = tonightPasses(T, t0).filter((p) => p.start > t0), evening = all.filter((p) => p.start <= eve);
  const seen = new Set(), fresh = [];
  for (const p of evening.slice().sort((a, b) => tierN(b.obj) - tierN(a.obj) || (a.mag ?? 9) - (b.mag ?? 9))) { if (!p.fresh) continue; const k = cardKeyFor(p.obj); if (seen.has(k)) continue; seen.add(k); fresh.push(p); }
  const leftBetter = (state.catalog?.objects ?? []).filter((o) => !o.family && tierN(o) >= 1 && isNewFind(o)).length;
  const worth = leftBetter >= 10 ? fresh.filter((p) => tierN(p.obj) >= 1) : fresh;
  // Variety first (2026-10-13 playtest: three "SL-8 Rocket Stage" stops read like a bug): one of each name, then repeats.
  const names = new Set(), picks = [];
  for (const p of worth) { if (picks.length >= 4) break; const n = label(p.obj); if (!names.has(n)) { names.add(n); picks.push(p); } }
  for (const p of worth) { if (picks.length >= 4) break; if (!picks.includes(p)) picks.push(p); }
  const sh = shinyChances(T, t0).filter((x) => x.t > t0 && x.t <= eve && !picks.some((p) => p.obj.id === x.o.id)).sort((a, b) => ['eclipse', 'moon', 'overhead', 'fresh'].indexOf(a.kind) - ['eclipse', 'moon', 'overhead', 'fresh'].indexOf(b.kind))[0];
  const dawnStation = all.find((p) => p.start > eve && (p.obj.type === 'station' || p.obj.icon));
  const stops = [...picks.map((p) => ({ t: p.start, p, kind: 'card' })), ...(sh ? [{ t: sh.t, p: sh.p, kind: 'shiny', line: sh.line, shiny: sh.kind }] : [])];
  if (T.dusk && T.dusk > t0) stops.push({ t: T.dusk, kind: 'moment', text: 'Dark enough to start', ico: 'moon' });
  if (peak?.[1] && peak[0] > t0) stops.push({ t: peak[0], kind: 'moment', text: `Busiest: ${peak[1]} objects up at once`, ico: 'stars' });
  if (wxT?.coverFrom > t0 && wxT.coverFrom <= eve) stops.push({ t: wxT.coverFrom, kind: 'moment', text: 'Cloud rolls in', ico: 'cloud' });
  if (wxT?.clearFrom > t0 && wxT.clearFrom <= eve) stops.push({ t: wxT.clearFrom, kind: 'moment', text: 'Clouds part', ico: 'cloud-part' });
  stops.sort((a, b) => a.t - b.t);
  if (dawnStation) stops.push({ t: dawnStation.start, p: dawnStation, kind: 'card', early: true });
  // The haul
  const XP = { common: 10, uncommon: 15, rare: 25, epic: 40, legendary: 60 }, TIERS5 = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
  const n5 = [0, 0, 0, 0, 0]; for (const p of fresh) n5[tierN(p.obj)]++;
  const top = Math.max(...picks.map((p) => tierN(p.obj)), -1), topN = picks.filter((p) => tierN(p.obj) === top).length;
  const xp = picks.reduce((a, p) => a + (XP[TIERS5[tierN(p.obj)]] ?? 10), 0);
  const w0 = picks.length ? Math.min(...picks.map((p) => p.start)) : null, w1 = picks.length ? Math.max(...picks.map((p) => p.end ?? p.start)) : null;
  const sq = Math.sqrt(Math.max(1, ...n5));
  const overcast = wxT && !wxT.ok, nextDay = wxT?.nextClear ? new Date(wxT.nextClear).toLocaleDateString([], { weekday: 'long' }) : '';
  if (overcast) { // lead with the weather: the haul is behind cloud (2026-10-13 playtest)
    $('tonight-summary').innerHTML = `<div class="run-haul cloudy"><span class="k">Tonight's sky</span>
    <b class="rh-big"><span class="ico" data-ico="${wxT.worst === 'rain' || wxT.worst === 'storm' ? 'rain' : wxT.worst === 'snow' ? 'snow' : wxT.worst === 'fog' ? 'fog' : 'cloud'}" aria-hidden="true"></span> ${escapeHtml(wxT.line)}</b>
    <span class="rh-sub">${nextDay ? `Next clear night: <b>${nextDay}</b>. ` : ''}${worth.length} new card${worth.length === 1 ? '' : 's'} pass over tonight behind the cloud; if you spot a gap, they still count.</span>
    ${T.dusk ? `<span class="rh-wx"><span class="ico" data-ico="moon" aria-hidden="true"></span> Dark ${fmtTime(T.dusk)}</span>` : ''}</div>`;
  } else
  $('tonight-summary').innerHTML = `<div class="run-haul"><span class="k">Tonight's haul</span>
    <b class="rh-big">${worth.length} new card${worth.length === 1 ? '' : 's'}${top >= 2 ? `, <em style="color:${TIER_INFO[TIERS5[top]].color}">${topN} ${TIER_INFO[TIERS5[top]].label}</em>` : ''}</b>
    <span class="rh-sub">${w0 ? `Best between ${fmtTime(w0)} and ${fmtTime(w1)}${xp ? ` · about +${xp} XP` : ''}` : 'Nothing yet…'}</span>
    <span class="rh-bars" aria-label="${TIERS5.map((t, i) => `${n5[i]} ${TIER_INFO[t].label}`).join(', ')}">${n5.map((c, i) => `<i style="height:${c ? Math.max(12, Math.round(Math.sqrt(c) / sq * 100)) : 4}%;background:${TIER_INFO[TIERS5[i]].color}"></i>`).join('')}<small>new by rarity</small></span>
    <span class="rh-wx">${T.dusk ? `<span class="ico" data-ico="moon" aria-hidden="true"></span> Dark ${fmtTime(T.dusk)}` : ''}${wxT ? ` · ${escapeHtml(wxT.line)}` : ''}</span></div>`;
  const box = document.createElement('div'); box.className = 'run';
  box.innerHTML = `<div class="t-head">Tonight's run${overcast ? ' · if it clears' : ''}</div>`;
  const reminders = [];
  for (const st of stops) {
    const el = document.createElement('div');
    if (st.kind === 'moment') { el.className = 'run-stop moment'; el.innerHTML = `<b>${fmtTime(st.t)}</b>${st.ico ? `<span class="ico" data-ico="${st.ico}" aria-hidden="true"></span>` : ''}<span>${escapeHtml(st.text)}</span>`; box.appendChild(el); continue; }
    const p = st.p, o = p.obj, tier = tierOf(o), key = `${o.id}@${p.start}`, canRemind = p.start > t0 + 10 * 60000;
    const color = st.kind === 'shiny' ? 'var(--gold)' : tier.color;
    el.className = 'run-stop'; el.style.setProperty('--c', color);
    const gets = [p.fresh ? `<span>New card</span>` : '', st.kind === 'shiny' ? `<span class="s">Shiny card</span>` : '', p.fresh ? `<span>+${XP[(state.cardModels.get(cardKeyFor(o)) ?? o).tier] ?? 10} XP</span>` : ''].join('');
    el.innerHTML = `<div class="rs-h"><b>${fmtTime(st.t)}</b><em>${st.kind === 'shiny' ? 'Shiny chance' : st.early ? 'Early riser' : `${tier.gem} ${tier.label}`}</em></div>
      <span class="rs-n">${escapeHtml(label(o))}</span><span class="rs-w">${escapeHtml(st.kind === 'shiny' ? st.line.replace(/^./, (c) => c.toUpperCase()) : whereWords({ el: p.peakEl, az: p.peakAz }))}${p.mag <= 0 ? ' · very bright' : ''}</span>
      ${gets ? `<div class="rs-gets">${gets}</div>` : ''}
      <div class="rs-acts"><button type="button" class="ic showme" aria-label="Show me where to look">${ICON_TARGET}</button><button type="button" class="ic bell${reminded.has(key) ? ' on' : ''}"${canRemind ? '' : ' disabled'} aria-label="Remind me">${ICON_BELL}</button></div>`;
    el.querySelector('.showme').addEventListener('click', (e) => { e.stopPropagation(); flyToCircle(e.currentTarget); showMePass(p); });
    const bell = el.querySelector('.bell');
    bell.addEventListener('click', async (e) => { e.stopPropagation(); if (!canRemind) return;
      if (reminded.has(key)) { reminded.delete(key); cancelNotify(remindIds.get(key)?.id); remindIds.delete(key); saveRems(); bell.classList.remove('on'); toast(`Reminder off for ${label(o)}.`, 2500); }
      else if (await remindPass(p, key)) { reminded.add(key); bell.classList.add('on'); } });
    el.addEventListener('click', () => showTonightCard(o, el.getBoundingClientRect(), `TONIGHT · ${fmtTime(st.t)}`));
    if (canRemind) reminders.push({ p, key, bell });
    box.appendChild(el);
  }
  if (!stops.some((s) => s.kind !== 'moment')) box.insertAdjacentHTML('beforeend', '<p class="hint">Nothing yet…</p>');
  if (reminders.length > 1) {
    const all2 = document.createElement('button'); all2.type = 'button'; all2.className = 'd-cta o run-remind';
    all2.innerHTML = `<span><span class="ico" data-ico="bell" aria-hidden="true"></span> Set reminders</span><span>${reminders.length}</span>`;
    all2.addEventListener('click', async () => { buzz(8); let n = 0;
      for (const r of reminders) { if (reminded.has(r.key)) { n++; continue; } if (await remindPass(r.p, r.key)) { reminded.add(r.key); r.bell.classList.add('on'); n++; } else break; }
      if (n) all2.firstElementChild.innerHTML = `<span class="ico" data-ico="bell" aria-hidden="true"></span> ${n} reminder${n === 1 ? '' : 's'} set`; });
    box.appendChild(all2);
  }
  return box;
}
function renderTonight() {
  const T = state.tonight, t0 = now().getTime();
  if (!T) { renderTonightLoading(); requestTonight(); return; }
  const wins = tonightWindows(T).filter((w) => w.e >= t0);
  const peak = T.curve.filter(([t]) => t >= t0 && t <= eveningEnd(T)).reduce((a, c) => (c[1] > a[1] ? c : a), [0, 0]);
  const ev = activeEvent(t0) ?? nextEvent(t0), evLine = ev ? (t0 >= ev.start ? `<br><b>${ev.name}</b> meteor shower tonight (${ev.rate}).` : `<br>Next event: <b>${ev.name}</b> meteor shower, ${new Date(ev.start + 30 * 3600e3).toLocaleDateString([], { month: 'short', day: 'numeric' })}.`) : '';
  const wxT = tonightWeather(), wxLine = wxT ? `<br>Sky: <b>${escapeHtml(wxT.line)}</b>${!wxT.ok && wxT.nextClear ? `. Next clear night: <b>${new Date(wxT.nextClear).toLocaleDateString([], { weekday: 'long' })}</b>.` : '.'}` : '';
  // Compact (2026-10-08 playtest: four lines of prose was too dense): a row of stat chips, one short line under it.
  void wxLine; void evLine;
  const tchip = (k, v) => `<span class="ts-chip"><small>${k}</small><b>${v}</b></span>`;
  // The best thing tonight, as one goal (playtest room 2026-10-12: "New to you · 267" was a wall of commons), and the
  // stations at dawn, which evening players never saw (every ISS pass that week was 5:50–6:40 AM).
  const eve = eveningEnd(T), all = tonightPasses(T, t0).filter((p) => p.start > t0);
  const tierN = (p) => TIER_RANK[(state.cardModels.get(cardKeyFor(p.obj)) ?? p.obj).tier] ?? 0;
  const top = all.filter((p) => p.start <= eve && p.fresh).sort((a, b) => tierN(b) - tierN(a) || (a.mag ?? 9) - (b.mag ?? 9))[0];
  const station = all.find((p) => p.start > eve && p.obj.type === 'station');
  const goal = top ? `<button type="button" class="ts-goal" id="ts-goal"><small>Best tonight</small><b>${escapeHtml(label(top.obj))}</b><span>${escapeHtml((TIER_INFO[(state.cardModels.get(cardKeyFor(top.obj)) ?? top.obj).tier] ?? TIER_INFO.common).label)} · new to you · ${fmtTime(top.start)} in the ${compassPoint(top.peakAz)}</span></button>` : '';
  const dawnLine = station ? `<span class="ts-note">Early riser? <b>${escapeHtml(label(station.obj))}</b> passes at ${fmtTime(station.start)}, ${station.mag <= -1 ? 'very bright' : 'bright'}, ${station.peakEl}° up in the ${compassPoint(station.peakAz)}.</span>` : '';
  $('tonight-summary').innerHTML = goal + (wins.length
    ? `<span class="ts-row">${tchip('Dark', T.dawn ? `until ${fmtTime(T.dawn)}` : `until ${fmtTime(wins[wins.length - 1].e)}`)}${tchip('Busiest', `${fmtTime(peak[0])} · ${peak[1]} up`)}${wxT ? tchip('Sky', escapeHtml(wxT.line)) : ''}</span>${ev && t0 >= ev.start ? `<span class="ts-note">☄ <b>${escapeHtml(ev.name.replace(/\s*\d{4}$/, ''))}</b> meteor shower tonight · ${escapeHtml(ev.rate)}</span>` : ''}${wxT && !wxT.ok && wxT.nextClear ? `<span class="ts-note">Next clear night: <b>${new Date(wxT.nextClear).toLocaleDateString([], { weekday: 'long' })}</b></span>` : ''}`
    : `<span class="ts-note">Nothing bright enough for your sky until dawn. Slide the sky darker if you can see more stars, or try binocular mode.</span>`) + dawnLine;
  $('ts-goal')?.addEventListener('click', () => showMePass(top)); // steer to it, like a Tonight row
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
  // Tonight's run first (2026-10-13, design/sky-pages-combined.html); the old full list sits behind "Everything tonight".
  const root = $('tonight-list'); root.innerHTML = '';
  root.appendChild(renderRun(T, t0, wxT, peak));
  const allN = tonightPasses(T, t0).length, tog = document.createElement('button'); tog.type = 'button'; tog.className = 'ui-link run-all';
  tog.textContent = tlAll ? 'Hide everything ‹' : `Everything tonight · ${allN} passes ›`;
  tog.addEventListener('click', () => { tlAll = !tlAll; renderTonight(); });
  root.appendChild(tog);
  const list = document.createElement('div'); list.className = 'tl-all'; list.hidden = !tlAll; root.appendChild(list);
  $('tonight-chart').hidden = !tlAll;
  // Pass list, design B (2026-10-08, design/tonight-list.html): small cards with a rarity bar, split into Up next
  // (within 10 min: aim now) and Later tonight. Swipe a row right-to-left to reveal its alarm (Sevaan's idea); passes
  // under 10 minutes away say "Too soon" there, since the alert fires 10 minutes before. Filter: tap a rarity to show
  // it and rarer (tap again for all), plus New only. The night's moments (cloud, busiest, dawn) sit between rows.
  list.classList.remove('tl-mode');
  const allPasses = tonightPasses(T, t0); // every pass to dawn (the first 60 only reached the first hour: no dawn ISS, 2026-10-13)
  const TIERS = ['common', 'uncommon', 'rare', 'epic', 'legendary'], tierIdx = (p) => Math.max(0, TIERS.indexOf(p.obj.tier));
  const passes = allPasses.filter((p) => tierIdx(p) >= tlFilter.min && (!tlFilter.newOnly || p.fresh));
  const chips = document.createElement('div'); chips.className = 'tl-chips';
  chips.innerHTML = TIERS.map((k, i) => { const t = TIER_INFO[k]; const n = allPasses.filter((p) => tierIdx(p) === i).length;
    return `<button type="button" class="tl-chip${i >= tlFilter.min ? ' on' : ''}" data-min="${i}" style="--c:${t.color}"${n ? '' : ' disabled'}><i aria-hidden="true">${t.gem}</i>${t.label}${i === tlFilter.min && i ? '+' : ''}</button>`; }).join('')
    + `<button type="button" class="tl-chip new${tlFilter.newOnly ? ' on' : ''}" data-new>New only</button>`;
  chips.addEventListener('click', (e) => { const c = e.target.closest('.tl-chip'); if (!c || c.disabled) return;
    if (c.hasAttribute('data-new')) tlFilter.newOnly = !tlFilter.newOnly; else { const m = Number(c.dataset.min); tlFilter.min = m === tlFilter.min ? 0 : m; }
    renderTonight(); });
  list.appendChild(chips);
  const marks = [];
  if (wxT?.coverFrom > t0) marks.push([wxT.coverFrom, 'Cloud rolls in', 'cloud']);
  if (wxT?.clearFrom > t0) marks.push([wxT.clearFrom, `Clears${ev && t0 >= ev.start ? ` · ${ev.name.replace(/\s*\d{4}$/, '')} best now` : ''}`, 'clear']);
  if (peak[1] && peak[0] > t0) marks.push([peak[0], `Busiest: ${peak[1]} objects up at once`, 'peak']);
  if (T.dawn) marks.push([T.dawn, 'Dawn: the sky closes', 'dawn']);
  const markHtml = ([t, txt, k]) => `<div class="t-mark ${k}"><span class="time">${fmtTime(t)}</span><span>${escapeHtml(txt)}</span></div>`;
  marks.sort((a, b) => a[0] - b[0]);
  const SOON = 10 * 60000, soonList = passes.filter((p) => p.start <= t0 + SOON), laterList = passes.filter((p) => p.start > t0 + SOON);
  const row = (p) => {
    const tier = TIER_INFO[p.obj.tier] ?? TIER_INFO.common, key = `${p.obj.id}@${p.start}`, mins = Math.round((p.start - t0) / 60000);
    const canRemind = p.start > t0 + SOON, belled = reminded.has(key);
    const when = p.start <= t0 ? 'up now' : mins < 60 ? `in ${mins} min` : `in ${Math.floor(mins / 60)} h${mins % 60 ? ` ${mins % 60} m` : ''}`; // "m" once there are hours, so it fits the column (2026-10-13)
    const el = document.createElement('div'); el.className = `b-row${canRemind ? '' : ' soon'}`; el.style.setProperty('--c', tier.color);
    el.innerHTML = `<button type="button" class="b-alarm${belled ? ' on' : ''}"${canRemind ? '' : ' disabled'} aria-label="${canRemind ? (belled ? 'Reminder set: tap to turn off' : 'Remind me 10 minutes before') : 'Too soon for a reminder'}">${ICON_BELL}<span>${canRemind ? (belled ? 'Set' : 'Remind') : 'Too soon'}</span></button>
      <div class="b-face" role="button" tabindex="0" aria-label="${escapeHtml(label(p.obj))}, ${fmtTime(p.start)}: open the card"><span class="b-when"><b>${fmtTime(p.start).replace(/\s?[AP]\.?M\.?$/i, '')}</b><small>${when}</small></span>
      <span class="b-main"><span class="b-tier">${tier.label}${p.fresh ? ' · <em>New</em>' : ''}${belled ? ` · <em class="b-set">${ICON_BELL}${fmtTime(p.start - SOON)}</em>` : ''}</span><span class="name">${escapeHtml(label(p.obj))}</span>
      <span class="meta">Rises ${compassPoint(p.riseAz)} · up to ${p.peakEl}° in the ${compassPoint(p.peakAz)} · ${brightnessWord(p.mag)}</span></span>
      <button class="ic showme" type="button" aria-label="Show me in the sky">${ICON_TARGET}</button></div>`;
    el.querySelector('.showme').addEventListener('click', (e) => { e.stopPropagation(); flyToCircle(e.currentTarget); showMePass(p); });
    el.querySelector('.b-alarm').addEventListener('click', async (e) => {
      e.stopPropagation(); if (!canRemind) return;
      if (reminded.has(key)) { reminded.delete(key); cancelNotify(remindIds.get(key)?.id); remindIds.delete(key); saveRems(); toast(`Reminder off for ${escapeHtml(label(p.obj))}.`, 2500); }
      else if (await remindPass(p, key)) reminded.add(key); // only lit once it really worked (QA 2026-10-11)
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
  // Later, in three parts of the night (2026-10-13, Sevaan: "all the ones coming up a minute or two after another, but
  // no ISS, or what's later in the AM"). Each part leads with its best passes (new, rarer, stations, brighter, higher),
  // shown in time order; "Show all" has the rest. Stations always make the cut.
  const eveEnd = eveningEnd(T), dawnCut = T.dawn ? T.dawn - 150 * 60000 : Infinity;
  const interest = (p) => (p.fresh ? 1000 : 0) + tierIdx(p) * 150 + (p.obj.type === 'station' || p.obj.icon ? 2000 : 0) + Math.max(0, 4 - (p.mag ?? 4)) * 20 + p.peakEl;
  const part = (title, sub, items, cls, n, lo, hi) => {
    if (!items.length) return;
    const best = new Set(items.slice().sort((a, b) => interest(b) - interest(a)).slice(0, n));
    const pick = tlExpanded[cls] ? items : items.filter((p) => best.has(p));
    list.insertAdjacentHTML('beforeend', `<div class="b-sec ${cls}"><span>${title} · ${items.length}</span><span>${sub}</span></div>`);
    for (const p of pick) { while (marks.length && marks[0][0] >= lo && marks[0][0] <= p.start) list.insertAdjacentHTML('beforeend', markHtml(marks.shift())); list.appendChild(row(p)); }
    while (marks.length && marks[0][0] >= lo && marks[0][0] < hi) list.insertAdjacentHTML('beforeend', markHtml(marks.shift()));
    if (pick.length < items.length) {
      const more = document.createElement('button'); more.type = 'button'; more.className = 'ui-link vis-more'; more.textContent = `Show all ${items.length} ›`;
      more.addEventListener('click', () => { tlExpanded[cls] = true; const y = list.closest('.panel')?.scrollTop; renderTonight(); if (y != null) list.closest('.panel').scrollTop = y; });
      list.appendChild(more);
    }
  };
  while (marks.length && marks[0][0] <= t0 + SOON) marks.shift();
  part('This evening', 'The best of them · swipe left to set a reminder', laterList.filter((p) => p.start <= eveEnd), 'later', 8, t0, eveEnd);
  part('Late night', 'The best of them', laterList.filter((p) => p.start > eveEnd && p.start <= dawnCut), 'late', 4, eveEnd, dawnCut);
  part('Before dawn', 'The best of them', laterList.filter((p) => p.start > dawnCut), 'dawn', 4, dawnCut, Infinity);
  for (const mk of marks) list.insertAdjacentHTML('beforeend', markHtml(mk));
  if (!passes.length) list.insertAdjacentHTML('beforeend', `<p class="hint">${allPasses.length ? 'Nothing that rare left tonight. Tap a lower rarity.' : 'No standout passes left tonight.'}</p>`);
  // Show once how the alarm hides behind a row: the first Later row slides open a little and back.
  try { if (!localStorage.getItem('tlSwipeHint')) { const first = list.querySelector('.b-row:not(.soon) .b-face'); if (first && !matchMedia('(prefers-reduced-motion: reduce)').matches) { localStorage.setItem('tlSwipeHint', '1'); setTimeout(() => first.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-64px)', offset: .35 }, { transform: 'translateX(-64px)', offset: .65 }, { transform: 'translateX(0)' }], { duration: 1400, easing: 'cubic-bezier(.3,.7,.3,1)' }), 600); } } } catch {}
  renderShinyForecast(list, T, t0);
  list.insertAdjacentHTML('beforeend', `<div class="t-head">Also up tonight</div>` + alsoUpTonight(t0, T.dawn ?? t0 + 10 * 3600000));
  // At the end: the few worth setting an alarm for (rarest new ones still to come), as little cards with a bell.
  const rank = { legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1 };
  const alarm = tonightPasses(T, t0).filter((p) => p.start > t0 + 15 * 60000 && p.fresh).sort((a, b) => (rank[b.obj.tier] ?? 0) - (rank[a.obj.tier] ?? 0) || a.start - b.start).slice(0, 6);
  if (alarm.length) {
    list.insertAdjacentHTML('beforeend', '<div class="t-head">Worth setting an alarm for</div>');
    const strip = document.createElement('div'); strip.className = 'mini-cards';
    for (const p of alarm) { const o = p.obj, tier = TIER_INFO[o.tier] ?? TIER_INFO.common, key = `${o.id}@${p.start}`, c = document.createElement('div'); c.className = 'mini-card';
      c.replaceChildren(stripCard(o, `${fmtTime(p.start)} · ${compassPoint(p.peakAz)}`)); c.insertAdjacentHTML('beforeend', `<button class="ic remind${reminded.has(key) ? ' on' : ''}" type="button" aria-label="Remind me">${ICON_BELL}</button>`);
      c.addEventListener('click', (e) => { if (e.target.closest('.remind') || c.closest('.mini-cards')?.dataset.dragged) return; showTonightCard(o, c.getBoundingClientRect(), `TONIGHT · ${fmtTime(p.start)}`); }); // tap the card to see it (2026-10-13)
      c.querySelector('.remind').addEventListener('click', async (e) => { const b = e.currentTarget; if (reminded.has(key)) { reminded.delete(key); cancelNotify(remindIds.get(key)?.id); remindIds.delete(key); saveRems(); b.classList.remove('on'); } else if (await remindPass(p, key)) { reminded.add(key); b.classList.add('on'); } });
      strip.appendChild(c); }
    list.appendChild(strip);
  }
}
// One way to set a reminder (QA 2026-10-11: the .ics download did nothing in the apps, and said it had):
// Reminders are native notifications at the right time, nothing else (2026-10-12, Sevaan: "We don't need any reminders
// that go to a calendar"). Resolves 'on' | 'denied' | 'app-only' (the website, Sevaan's test build) | 'unsupported'.
// Free players get one reminder a night; Plus, as many as they like (2026-10-13, Sevaan). Any kind counts (a pass, dark,
// a clear night); changing or re-setting the same one doesn't. Over the limit the Plus sheet explains, and nothing is set.
const FREE_REMINDERS_A_NIGHT = 1;
function reminderLimitHit(at, key) {
  if (isPlus()) return false;
  const lon = state.observer?.lon ?? 0, night = nightKey(at, lon), t0 = Date.now();
  const taken = [...remindIds].filter(([k, v]) => k !== key && v.at > t0 && nightKey(v.at, lon) === night).length;
  return taken >= FREE_REMINDERS_A_NIGHT;
}
async function setReminder({ at, title, body, key }) {
  if (!isNative()) return 'app-only';
  if (reminderLimitHit(at, key)) { openPlus('reminders'); return 'limit'; }
  const id = newRemindId(); if (key) { remindIds.set(key, { id, at }); saveRems(); }
  return notifyAt(at, title, body, { id });
}
function remindDone(btn, ok, at) {
  const label = btn.firstElementChild ?? btn;
  if (ok === null) return; // over the free limit: the Plus sheet is up
  if (ok) { label.textContent = `✓ Reminder set for ${fmtTime(at).replace(/\s?[AP]\.?M\.?$/i, '')}`; btn.disabled = true; btn.classList.add('done'); }
  else { const was = label.textContent; label.textContent = isNative() ? 'Couldn\'t set it. Check notifications in Settings' : 'Reminders work in the app'; setTimeout(() => { label.textContent = was; }, 3500); }
}
function reminderToast(r, when) {
  if (r === 'limit') return null; // the Plus sheet is already explaining (null: callers say nothing)
  toast(r === 'on' ? `We'll remind you at ${fmtTime(when)}.` : r === 'app-only' ? 'Reminders work in the Space Collector app.' : r === 'denied' ? 'Notifications are off for Space Collector. Turn them on in your phone\'s Settings.' : 'Couldn\'t set a reminder here.', 3500);
  return r === 'on';
}
// "Remind me": a notification 10 minutes before the pass.
async function remindPass(p, key) {
  const name = label(p.obj);
  const r = await setReminder({ at: p.start - 10 * 60e3, title: `${name} in 10 minutes`, body: `Look ${dirWord(p.riseAz)} at ${fmtTime(p.start)}. ${whereWords({ el: p.peakEl, az: p.peakAz })} at its highest.`, key });
  return reminderToast(r, p.start - 10 * 60e3);
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
  fetchWeather(o.lat, o.lon).then((w) => { if (key !== weatherKey) return; state.weather = w; updateNextPassChip(); if (pushOn() && state.tonight) scheduleAlerts(alertPicks(state.tonight)); }).catch(() => { if (key === weatherKey) weatherAt = Date.now() - 29 * 60e3; });
}
// Tonight's sky in words, from the forecast and tonight's dusk/dawn: { ok, line, nextClear } or null.
function tonightWeather() {
  const T = state.tonight; if (!state.weather || !T) return null;
  return tonightSky(state.weather, T.dusk ?? T.startMs, T.dawn ?? (T.startMs + 12 * 3600e3), fmtTime);
}
const isDay = () => (state.frame?.sunEl ?? -90) > -6;
// Is the sky forecast to be clouded over at this moment? (2026-10-13 playtest: an overcast night still recommended passes.)
const cloudAt = (t) => !!state.weather && !skyClearAt(state.weather, t);
// Ghost markers by day: tonight's best passes (and the ISS) wherever they are right now, so you can watch them
// cross the sky you'll see them in later. A handful, each tied to a Tonight row.
// By day (2026-10-13, Sevaan: "circles in the sky showing where to see some cool satellites tonight and when"): tonight's
// best passes drawn where they'll be. A circle where it appears with the name and time (no track lines: 2026-10-13, Sevaan). Cards you don't have first, rarest first, then brightest; up to four.
// Line one up in the circle to see when it comes and set a reminder (#gh-remind); no tapping needed.
// A pass's short track around the moment it appears (back 2026-10-13, Sevaan: "put the trails back… style them so
// they look better on the sky… give them some opacity"): 30 s before it appears (`past`) and from then until just
// after it fades, at least 90 s (`ahead`). Kept until the pass is over.
const passPaths = new Map();
function passPath(p) {
  const key = `${p.obj.id}@${p.start}`; if (passPaths.has(key)) return passPaths.get(key);
  const at = (t) => { const l = look(p.obj, frame(new Date(t), state.observer)); return l ? enuFromAzEl(l.az, l.el) : null; };
  const past = [], ahead = [], end = Math.max(p.end + 10e3, p.start + 90e3);
  for (let t = p.start - 30e3; t <= p.start; t += 5e3) { const e = at(t); if (e) past.push(e); }
  for (let t = p.start; t <= end; t += 6e3) { const e = at(t); if (e) ahead.push(e); }
  if (passPaths.size > 30) passPaths.clear();
  const out = { past, ahead }; passPaths.set(key, out); return out;
}
function dayGhosts() {
  if (!isDay() || !state.tonight) return null;
  const t0 = now().getTime(), tierOf = (o) => (state.cardModels.get(cardKeyFor(o)) ?? o).tier;
  const score = (p) => (p.fresh ? 1000 : 0) + (TIER_RANK[tierOf(p.obj)] ?? 0) * 100 + (p.obj.icon ? 60 : 0) + Math.max(0, 4 - p.mag) * 8 + p.peakEl / 4;
  const picks = tonightPasses(state.tonight, t0).filter((p) => p.start > t0 && p.start <= eveningEnd(state.tonight) && p.peakEl >= 15).sort((a, b) => score(b) - score(a))
    .filter((p, i, all) => all.findIndex((q) => cardKeyFor(q.obj) === cardKeyFor(p.obj)) === i).slice(0, 4); // the evening only; one per card (three Iridium passes are one fleet card)
  state.dayPicks = picks;
  return picks.map((p) => {
    const tier = TIER_INFO[tierOf(p.obj)] ?? TIER_INFO.common;
    // The circle sits where it appears, at the time on its label.
    return { id: p.obj.id, obj: p.obj, pass: p, enu: enuFromAzEl(p.riseAz, p.riseEl), path: passPath(p), color: tier.color, name: label(p.obj), time: fmtTime(p.start), what: `${tier.gem} ${tier.label}${p.fresh ? ' · new to you' : ''}`, note: '' };
  });
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
  ticket({ kind: 'compass', id: 'compass', sticky: true, eyebrow: 'COMPASS NEEDS A NUDGE', html: true, ms: 7000,
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
// Below the horizon always shows a dark-site sky (2026-10-11, Sevaan: "as if the slider was in dark site"): every
// satellite the Sun lights on the far side of the Earth, and stars to the dark-sky limit, whatever your own sky is.
const DARK_SITE = skyLimit({ sb: SB_MAX });
let belowModel = null;
const BELOW_SAT_MAG = 2.9;
function belowSats(d) {
  const back = state.basis?.back; if (!back || back[2] > 0.15 || !state.catalog || !state.observer) return null;
  if (!belowModel || belowModel.objects !== state.catalog.objects) belowModel = new BelowModel(state.catalog.objects);
  // Only the bright ones (2026-10-11, Sevaan: every sunlit one, ~3,800, was "definitely too many"). Standard
  // magnitude under 3 leaves a few hundred under the whole horizon, a few dozen on screen.
  belowModel.update(d, frame(d, state.observer), BELOW_SAT_MAG);
  const hitId = sky.belowHitId;
  return belowModel.items(d).map((s) => ({ ...s, name: label(s.obj), ...(s.obj.id === hitId ? belowInfo(s, d) : {}) }));
}
// More than a name for the one in the circle (2026-10-11, Sevaan): what it is, how far through the Earth, when it next
// comes up over you, and whether you have it. The next rise is a 1-minute scan of the next 12 hours, cached a minute.
let riseFor = { id: null, at: 0, t: null };
function belowInfo(s, d) {
  const o = s.obj, t0 = d.getTime();
  if (riseFor.id !== o.id || Math.abs(t0 - riseFor.at) > 60e3) {
    let t = null;
    for (let k = 1; k <= 720; k++) { const l = look(o, frame(new Date(t0 + k * 60e3), state.observer)); if (l && l.el > 10) { t = t0 + k * 60e3; break; } }
    riseFor = { id: o.id, at: t0, t };
  }
  // Height, speed and distance were dropped (2026-10-11, Sevaan: too much text below the horizon).
  const up = riseFor.t ? `in your sky at ${fmtTime(riseFor.t)}` : 'not in your sky for 12+ hours';
  const e = overEarth(o, d), note = [e ? `Over ${placeName(e.lat, e.lon)}` : '', up].filter(Boolean).join(' · ');
  return { what: describe(o, { stamp: false }), note, owned: !isNewFind(o) };
}
// Up by day (2026-10-11, Sevaan): the bright satellites overhead that daylight hides, shown like the ones below the
// horizon (halo + name in the circle), never collectable. Only while it isn't dark enough to see any.
function daySats(d) {
  const f = state.frame; if (!state.daySats || !f || f.sunEl < DARK_SUN_ELEVATION || (state.basis?.back?.[2] ?? -1) < -0.15) return null;
  const hitId = sky.dayHitId, out = [];
  for (const it of state.items) {
    const l = it.look; if (l.el <= 0 || !l.sunlit || it.obj.stdMag == null || it.obj.stdMag > BELOW_SAT_MAG) continue;
    const s = { obj: it.obj, id: it.obj.id, enu: enuFromAzEl(l.az, l.el), name: label(it.obj) };
    if (it.obj.id === hitId) {
      const p = state.tonight ? tonightPasses(state.tonight, d.getTime()).find((x) => x.id === it.obj.id && x.start > d.getTime()) : null;
      const e = overEarth(it.obj, d);
      Object.assign(s, { what: describe(it.obj, { stamp: false }), owned: !isNewFind(it.obj),
        note: [e ? `Over ${placeName(e.lat, e.lon)}` : '', p ? `see it tonight at ${fmtTime(p.start)}` : 'not visible tonight'].filter(Boolean).join(' · ') });
    }
    out.push(s);
  }
  return out;
}
// Looking down at your feet (2026-10-13, Sevaan: "it should show where stuff in the sky is… so I can turn to face it
// before holding the phone up"): what's up now, placed on the ring by direction, with how high it is. The Moon,
// planets, new satellites in view (rarest first) and the brightest named stars, at most 8.
function feetItems() {
  if ((state.basis?.back?.[2] ?? 0) > -0.6) return null;
  // What's up, for the compass map at your feet (2026-10-13, design/feet-compass.html A + C): the Moon, planets and
  // the Sun, up to 4 new satellites in view (rarest first) and the brightest named stars as plain dots.
  const out = [], tierN = (o) => TIER_RANK[(state.cardModels.get(cardKeyFor(o)) ?? o).tier] ?? 0;
  for (const n of state.naturals ?? []) { const o = n.obj, l = n.look; if (l.el <= 2 || !(o.type === 'moon' || o.type === 'planet' || o.type === 'sun')) continue; out.push({ name: label(o), az: l.az, el: l.el, kind: o.type === 'planet' ? 'planet' : o.type, isNew: isNewFind(o) && o.type !== 'sun' }); }
  const sats = (state.items ?? []).filter((i) => i.look.visible && i.look.el > 5 && isNewFind(i.obj)).sort((a, b) => tierN(b.obj) - tierN(a.obj) || a.look.mag - b.look.mag).slice(0, 4);
  for (const i of sats) out.push({ name: label(i.obj), az: i.look.az, el: i.look.el, kind: 'sat', icon: sky.iconKind(i.obj), isNew: true });
  const stars = (state.naturals ?? []).filter((n) => n.obj.natural === 'star' && n.look.el > 5 && n.look.visible).sort((a, b) => a.look.mag - b.look.mag).slice(0, 14);
  for (const n of stars) out.push({ name: label(n.obj), az: n.look.az, el: n.look.el, kind: 'star' });
  return out;
}
function belowGhosts(d) {
  const back = state.basis?.back; if (!back || back[2] > 0.15 || !state.bodies) return null;
  if (belowList && performance.now() - belowAt < 1000) return belowList;
  belowAt = performance.now();
  const out = [], rises = riseTimes(d), whenOf = (r) => (r ? `rises ${fmtTime(r.t)}` : '');
  for (const b of state.bodies) {
    if (b.enu[2] >= 0 || b.kind === 'star') continue;
    const r = rises.get(b.kind === 'sun' ? 'Sun' : b.kind === 'moon' ? 'Moon' : b.name);
    // path (2026-10-07, Sevaan): where it travels under the ground until it rises, as a dotted line.
    out.push({ enu: b.enu, kind: b.kind, name: b.kind === 'sun' ? 'The Sun' : b.kind === 'moon' ? 'The Moon' : b.name, note: whenOf(r), riseAz: r?.az, where: r ? compassPoint(r.az) : '', time: r ? fmtTime(r.t) : '', path: r ? [b.enu, ...r.path] : null, past: r?.past });
  }
  const T = state.tonight, t0 = d.getTime();
  if (T && state.frame) for (const p of tonightPasses(T, t0).filter((x) => x.start > t0).slice(0, 4)) {
    const o = state.byId.get(p.id); if (!o) continue;
    const l = look(o, state.frame); if (!l || l.el >= 0) continue;
    out.push({ enu: enuFromAzEl(l.az, l.el), kind: 'sat', obj: o, name: label(o), note: `up ${fmtTime(p.start)}`, riseAz: p.riseAz, where: compassPoint(p.riseAz), time: fmtTime(p.start), path: satPath(o, t0, p.start), past: satPast(o, t0) });
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
const npChip = (k, n, m) => `${k ? `<span class="np-k">${escapeHtml(k)}:</span>` : ''}<b class="np-n">${escapeHtml(n)}</b>${m ? `<span class="np-m">· ${escapeHtml(m)}</span>` : ''}`;
// The pass to suggest (2026-10-13, Sevaan: "we don't need to tell people about common objects unless every other object
// rarity has been exhausted"): new to you, Uncommon or rarer, rarest then soonest; Commons only once fewer than 10
// Uncommon-or-better cards are left that you don't have. Null if nothing qualifies.
function bestUpcoming(T, t0, until = Infinity) {
  if (!T) return null;
  const tierN = (o) => TIER_RANK[(state.cardModels.get(cardKeyFor(o)) ?? o).tier] ?? 0;
  const fresh = tonightPasses(T, t0).filter((p) => p.start > t0 && p.start <= until && p.fresh);
  const leftBetter = (state.catalog?.objects ?? []).filter((o) => !o.family && tierN(o) >= 1 && isNewFind(o)).length;
  const pool = leftBetter >= 10 ? fresh.filter((p) => tierN(p.obj) >= 1) : fresh;
  return pool.slice().sort((a, b) => tierN(b.obj) - tierN(a.obj) || a.start - b.start)[0] ?? null;
}
function updateNextPassChip() {
  // The radar fades in together with the next-up chip, once tonight's plan is in (fallback: 4 s after the sky opens).
  if (!document.body.classList.contains('hud-ready') && (state.tonight || performance.now() - (state.skyOpenedAt ?? 0) > 4000)) { document.body.classList.add('hud-ready'); skybarRest(4000); } // the slider fades back a few seconds after Explore shows
  const chip = $('nextpass');
  const lit = state.items?.some((i) => i.look.visible);
  const T = state.tonight, t0 = now().getTime();
  if (lit || !T || (state.timeOffsetMs && !isDay())) { if (!chip.hidden) chip.hidden = true; return; }
  const next = bestUpcoming(T, t0); // the corner chip suggests what's worth it, not just the soonest
  const win = tonightWindows(T).find((w) => w.s > t0);
  const dark = T.curve.length && t0 >= T.curve[0][0];
  // By day: one honest line about tonight (dark when, best pass, the sky), tap for the whole plan.
  if (isDay()) {
    const wx = tonightWeather(), best = bestUpcoming(T, t0, eveningEnd(T));
    const dusk = T.dusk ? fmtTime(T.dusk) : null;
    chip.innerHTML = wx && !wx.ok
      // Short enough to fit whole (2026-10-11, Sevaan: "Not tonight: Rain all n… · See the …" was unreadable):
      // 'RAIN TONIGHT · CLEAR THU'.
      ? npChip('', `${({ rain: 'Rain', snow: 'Snow', storm: 'Storms', fog: 'Fog' })[wx.worst] ?? 'Cloud'} tonight`, wx.nextClear ? `Clear ${new Date(wx.nextClear).toLocaleDateString([], { weekday: 'short' })}` : '')
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

// Settings → Pass alerts (#14). Hidden until the push val is deployed (js/pass-alerts.js PUSH).
$('row-push').hidden = !pushConfigured() && !isNative(); $('chk-push').checked = pushOn(); // the native app uses local notifications (2026-10-11)
if (pushConfigured()) setTimeout(() => prefetchKey()?.catch(() => {}), 4000); // so turning alerts on doesn't wait on the network
$('chk-push').addEventListener('change', async (e) => {
  if (!e.target.checked) { if (isNative()) { try { localStorage.removeItem('pushOn'); } catch {} for (const id of ALERT_IDS) await cancelNotify(id); } else await disablePush(); toast('Pass alerts off.', 2000); return; }
  if (!isPlus()) { e.target.checked = false; openPlus('alerts'); return; } // a Plus perk (2026-10-11)
  const r = isNative() ? await (async () => { try { const ln = plugin('LocalNotifications'); let p = await ln.checkPermissions(); if (p.display !== 'granted') p = await ln.requestPermissions(); if (p.display !== 'granted') return 'denied'; localStorage.setItem('pushOn', '1'); return 'on'; } catch (er) { return `error: ${er?.message ?? er}`; } })() : await enablePush();
  if (r === 'on') { toast('Alerts on. We\'ll ping you for up to 3 new cards a night, never after 11 pm.', 4000); lastChip = 0; if (state.tonight) shareTonight(state.tonight); return; }
  e.target.checked = false;
  toast(r === 'install' ? 'On iPhone, add Space Collector to your Home Screen first (Share → Add to Home Screen), then turn alerts on there.' : r === 'denied' ? 'Notifications are blocked. Allow them for Space Collector in Settings.' : String(r).startsWith('error') ? `Couldn't set up alerts (${String(r).slice(7, 140)}).` : 'Alerts aren\'t available in this browser.', 5000);
});
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
$('event-banner').addEventListener('click', () => { const e = activeEvent(now().getTime()); if (e) { try { localStorage.setItem('eventRead', e.id); } catch {} $('event-banner').hidden = true; } if (e) toast(`${e.name.replace(/\s*\d{4}$/, '')} · ${e.rate}. Collect any card tonight to earn its patch.`, 5500); });

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
  // A daytime pass marker lined up in the circle: tapping the circle previews its card (2026-10-13, Sevaan).
  if (sky.ghostHitId != null) {
    const rc = sky.ring ?? { x: sky.cx, y: sky.cy, r: sky.reticlePx }, p = state.dayPicks?.find((q) => q.obj.id === sky.ghostHitId);
    if (p && Math.hypot(x - rc.x, y - rc.y) <= rc.r + 10) { showTonightCard(p.obj, { left: cx - 20, top: cy - 20, width: 40, height: 40, x: cx, y: cy }, `APPEARING HERE TONIGHT AT ${fmtTime(p.start).toUpperCase()}`); return; }
  }
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
  if (id === 'visible') try { localStorage.setItem('radarTip', '1'); } catch {} // found the radar list already: no tip needed
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
  // The reveal fades and drops away instead of cutting to the sky (UX room 2026-10-12: closing with ✕ was an instant cut).
  else if (id === 'reveal' && !matchMedia('(prefers-reduced-motion: reduce)').matches) { el.style.pointerEvents = 'none'; el.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(28px)' }], { duration: 240, easing: 'cubic-bezier(.4,0,.8,.6)' }).finished.then(() => { if (activePanel !== 'reveal') el.hidden = true; el.style.pointerEvents = ''; }, () => { el.hidden = true; el.style.pointerEvents = ''; }); }
  else el.hidden = true;
  if (panelReturn?.isConnected) panelReturn.focus({ preventScroll: true });
}
function openDebug() {
  // Leaving the tour for Settings ends the tour (2026-10-08, Sevaan).
  if (!$('onboard').hidden) { $('ob-skip').click(); $('onboard').hidden = true; $('ob-done').hidden = true; document.body.classList.remove('ob-tour'); }
  renderDebug(); renderLocation(); openPanel('debug');
}
$('nav-more').addEventListener('click', openDebug);
$('nav-explore').addEventListener('click', () => { if (collectionOpen) { setSwitch($('nav'), 'left'); setTimeout(() => closeCollection(), SLIDE_MS); return; } closePanel(); }); // over the Collection, this is the way back
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
onRevealDismiss(() => { closePanel('reveal'); duckMusic(false); setTimeout(maybeAskSignIn, 700); }); // the sign-in ask waits for the reveal to close
// The Plus sheet opens from outside Settings too (the Week tab, the shiny tease), so it lives at the top level; inside
// the hidden Settings panel it never showed (playtest 2026-10-11).
document.body.append($('set-plus-sheet'));
document.addEventListener('keydown', e => {
  // Escape closes any open sheet first, panel or not: the sign-in sheet isn't in a panel (playtest 2026-10-11).
  if (e.key === 'Escape' && !activePanel) { const sh = document.querySelector('.set-sheet.in'); if (sh) { closeSheet(sh); return; } }
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

// TEMPORARY testing button (2026-10-11, Sevaan): ⏱ in the header jumps to tonight's busiest moment (the peak of the
// Tonight curve after dusk); tapping it again comes back to now. While it's on, the "Sky at … · back to now"
// standing message is hidden (it got in the way). Remove before launch.
// The evening (2026-10-12, playtest room: "Busiest 6:08 AM", "Remind me at 3:06"): planning looks from dusk to 11:30 pm
// (or two hours past a late summer dusk). "Night owl" in Settings plans all the way to dawn.
function eveningEnd(T) {
  if (!T) return Infinity;
  if (readPref('nightOwl', false)) return T.dawn ?? Infinity;
  const dusk = T.dusk ?? T.startMs, e = new Date(dusk); e.setHours(23, 30, 0, 0);
  if (e.getTime() < dusk - 6 * 3600e3) e.setDate(e.getDate() + 1); // dusk before midnight: 11:30 pm the same evening
  return Math.min(T.dawn ?? Infinity, Math.max(e.getTime(), dusk + 2 * 3600e3));
}
$('chk-owl').checked = readPref('nightOwl', false);
$('chk-owl').addEventListener('change', (e) => { writePref('nightOwl', e.target.checked); if (!$('vtab-tonight').hidden) renderTonight(); });
// Store builds (2026-10-12, playtest room: time travel let anyone collect at noon, and "Plus (testing)" was free Plus):
// the native app hides the testing tools and the ⏱ button unless they're unlocked by tapping the version line 7 times.
// The website is the private test build and always has them.
const devMode = () => { if (!isNative()) return true; try { return localStorage.getItem('dev') === '1'; } catch { return false; } };
function applyDevMode() { const on = devMode(); $('test-tools').hidden = !on; $('peak-toggle').hidden = !on; }
{ let taps = 0, tapT = 0;
  $('set-version').addEventListener('click', () => { const t = Date.now(); taps = t - tapT < 1500 ? taps + 1 : 1; tapT = t;
    if (taps >= 7 && isNative()) { taps = 0; const on = !devMode(); try { localStorage.setItem('dev', on ? '1' : '0'); } catch {} applyDevMode(); toast(on ? 'Testing tools on.' : 'Testing tools off.', 2000); } }); }
applyDevMode();
function peakTime() {
  const T = state.tonight; if (!T?.curve?.length) return null;
  const from = Math.max(T.dusk ?? 0, Date.now());
  const best = T.curve.filter(([t]) => t >= from && t <= eveningEnd(T)).reduce((a, c) => (c[1] > a[1] ? c : a), [0, -1]);
  return best[1] > 0 ? best[0] : null;
}
function renderPeakToggle() { const on = !!state.timeOffsetMs; $('peak-toggle').classList.toggle('on', on); $('peak-toggle').setAttribute('aria-pressed', String(on)); }
$('peak-toggle').addEventListener('click', () => {
  cancelPassSearch(); state.followPreview = false; state.preview = false;
  if (state.timeOffsetMs) state.timeOffsetMs = 0;
  else { const t = peakTime(); if (!t) { toast('Tonight\'s plan isn\'t ready yet.', 2000); return; } state.timeOffsetMs = t - Date.now(); toast(`Busiest moment: ${fmtTime(t)}`, 1800); }
  afterTimeJump(); renderPeakToggle(); showBanner('');
});

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
    const fail = () => { if (requestId!==passRequest) return; cancelPassSearch(); $('next-pass-info').textContent='Pass search could not finish. Try again.'; toast('Pass search could not finish. You can retry or browse the visible sky.', 4500, null, { sticky: true }); };
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
  renderPeakToggle(); // keep the TEMP ⏱ button in step with any clock change
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
$('chk-daysats').checked = state.daySats;
$('chk-daysats').addEventListener('change', (e) => { state.daySats = e.target.checked; writePref('daySats', state.daySats); });
$('chk-landscape').addEventListener('change', (e) => { state.landscape = e.target.checked; writePref('landscape', state.landscape); });
$('chk-lines').checked = state.showLines;
$('chk-lines').addEventListener('change', (e) => { state.showLines = e.target.checked; writePref('lines', state.showLines); });
$('chk-any').addEventListener('change', (e) => { state.captureAny = e.target.checked; });
// ---------- the sky slider (2026-10-06): an "exposure" control above the switcher ----------
// Drag until the stars and satellites on screen match what you can actually see; it's saved for next time.
// It sets your sky's own darkness; twilight and the Moon still dim things on top of it automatically.
// The sky slider is off the Explore screen and the sky starts at its darkest (2026-10-09, Sevaan). Everyone is moved
// to the darkest once ('skyMax1'); Settings → How dark is your sky? still changes it.
// New players start halfway (2026-10-09, Sevaan; was the darkest). Anyone who has set it keeps their setting.
{ const saved = Number(readText('skySb', '')); const MID = Math.round(((SB_MIN + SB_MAX) / 2) * 20) / 20;
  state.skySb = saved >= SB_MIN && saved <= SB_MAX ? saved : MID; }
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
// The slider steps back when you're not using it (2026-10-09, Sevaan): full strength when Explore first shows, then
// it eases to 65% after a few seconds; touching it brings it back to full, and letting go fades it again.
let skybarRestT = 0;
function skybarRest(delay = 2500) { clearTimeout(skybarRestT); skybarRestT = setTimeout(() => $('skybar').classList.add('resting'), delay); }
function skybarWake() { clearTimeout(skybarRestT); $('skybar').classList.remove('resting'); }
for (const ev of ['pointerdown', 'touchstart', 'focusin']) $('skybar').addEventListener(ev, skybarWake, { passive: true });
for (const ev of ['pointerup', 'pointercancel', 'touchend', 'focusout']) $('skybar').addEventListener(ev, () => skybarRest(1500), { passive: true });
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
  setBinoculars(e.target.checked);
});
function setBinoculars(on) {
  cancelPassSearch();
  state.binoculars = on; $('chk-bino').checked = on;
  writePref('binoculars', state.binoculars);
  setBinocularMode(state.binoculars);
  updateSkyLimit(state.frame);
  state.model?.reset();
  state.trails.clear();
}
// Space Collector Plus (js/plus.js): the Settings row, the sheet, the testing toggle, and switching perks off when
// Plus ends. `why` names the perk that was tapped, so the sheet can lead with it.
function renderPlus() {
  const on = isPlus();
  document.body.classList.toggle('is-plus', on);
  $('set-plus-val').textContent = on ? 'Plus ✓' : 'Free';
  $('set-plus-note').textContent = on ? 'Thanks for supporting Space Collector' : 'Alerts, the week ahead and more';
  $('chk-plus-test').checked = on;
  $('plus-buy').hidden = on;
}
$('plus-restore').addEventListener('click', () => toast(isPlus() ? 'Plus is already on for this account.' : 'Nothing to restore yet. Purchases open in the App Store and Google Play versions.', 3500));
function openPlus(why) {
  const first = { alerts: 'Pass alerts', week: 'The week ahead', shiny: 'Shiny forecast', reminders: 'Unlimited reminders' }[why];
  // Only what's built today (2026-10-12, store readiness: a paywall listing "coming" features can be rejected).
  const live = PLUS_PERKS.filter((p) => p.live);
  const perks = first ? [...live.filter((p) => p.name === first), ...live.filter((p) => p.name !== first)] : live;
  $('plus-lead').textContent = isPlus() ? 'You have Plus. Thank you! Here\'s what it includes.'
    : why === 'reminders' ? 'Free includes one reminder a night. Plus lets you set as many as you like.' : first ? `${first} is part of Plus. Every card, patch and mission stays free.` : 'Every card, patch and mission stays free.';
  $('plus-perks').innerHTML = perks.map((p) => `<li${p.name === first ? ' class="lead"' : ''}><i>${/^[a-z-]+$/.test(p.icon) ? `<span class="ico" data-ico="${p.icon}" aria-hidden="true"></span>` : p.icon}</i><span><b>${escapeHtml(p.name)}</b>${p.live ? '' : '<em>coming</em>'}<small>${escapeHtml(p.text)}</small></span></li>`).join('');
  renderPlus(); openSheet('set-plus-sheet');
}
$('set-plus-open').addEventListener('click', () => openPlus());
$('set-stats-open').addEventListener('click', () => { closePanel(); openCollection('#stats'); });
$('chk-plus-test').addEventListener('change', (e) => setPlusForTesting(e.target.checked));
onPlus((on) => {
  renderPlus();
  if (!on) { if (pushOn()) { disablePush().catch(() => {}); $('chk-push').checked = false; } }
  toast(on ? 'Plus is on (testing).' : 'Plus is off (testing).', 2000);
});
renderPlus();
// Accessibility (2026-10-11, QA): every Settings switch and slider is named after its row, for VoiceOver/TalkBack.
document.querySelectorAll('.set-row').forEach((row) => {
  const name = row.querySelector('.set-main')?.childNodes[0]?.textContent?.trim(); if (!name) return;
  row.querySelectorAll('input[type=checkbox], input[type=range]').forEach((i) => { if (!i.getAttribute('aria-label')) i.setAttribute('aria-label', name); });
});
// What's in the circle is drawn on the canvas, so screen readers hear it from a hidden live region instead.
let srLast = '';
function announceTarget(text) { if (text === srLast) return; srLast = text; $('sr-target').textContent = text; }
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
  if (!state.storageReady) toast('Browser storage is unavailable. Captures may not save.', 5000, null, { sticky: true });
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
  // The target's live position, the same one the guidance pill uses (playtest room 2026-10-11: the card said "Turn
  // right 89°" while the pill said "← Turn left" for the same star, because this kept the position from the step's start).
  const tl = state.items?.find((it) => it.obj.id === obAimTarget.obj.id)?.look ?? obAimTarget.look, dAz = ((tl.az - heading + 540) % 360) - 180, dEl = tl.el - myEl;
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
  const deck = $('ob-deck');
  if (k > 0) sfx('step', { gain: 0.8 });
  [...$('ob-pips').children].forEach((p, i) => { p.className = i < k ? 'done' : i === k ? 'on' : ''; });
  const make = (s) => { const el = document.createElement('div'); el.className = `tc${s.gold ? ' gold' : ''}`; el.dataset.step = steps.indexOf(s);
    el.innerHTML = `<div class="in"><div class="bar"><span>Space Collector</span><span class="tier">◆ ${escapeHtml(s.tier)}</span></div><h3>${escapeHtml(s.title)}</h3><div class="sub"><span>${escapeHtml(s.sub[0])}</span><span>${escapeHtml(s.sub[1])}</span></div><div class="art">${s.art}</div><p>${escapeHtml(s.text)}</p><div class="acts">${s.no ? `<button class="no" type="button">${escapeHtml(s.no)}</button>` : ''}<button class="yes" type="button">${escapeHtml(s.yes)}</button></div></div><div class="shine"></div>`;
    return el; };
  // Smooth hand-off (2026-10-09, Sevaan: the next card snapped into place): cards already in the deck are kept and
  // promoted (under → top, under2 → under) so their transition carries them up and straight; only the newcomer is
  // built, and it fades in at the back.
  const keep = new Map([...deck.querySelectorAll('.tc:not(.gone)')].map((el) => [Number(el.dataset.step), el]));
  deck.querySelectorAll('.tc.gone').forEach((el) => setTimeout(() => el.remove(), 450));
  const cards = steps.slice(k, k + 3).map((st, i) => {
    const old = keep.get(k + i); keep.delete(k + i);
    if (old) return old;
    const el = make(st);
    if (k > 0) { el.style.opacity = '0'; requestAnimationFrame(() => requestAnimationFrame(() => { el.style.opacity = ''; })); }
    return el;
  });
  for (const el of keep.values()) el.remove();
  // Only add the new cards; kept ones stay where they are in the DOM (re-inserting a node restarts it, which
  // skipped its transition). Newcomers go at the back (first in the deck).
  cards.forEach((c) => { if (!c.isConnected) deck.prepend(c); });
  cards.forEach((c, i) => { c.classList.toggle('under', i === 1); c.classList.toggle('under2', i === 2); });
  // The card now on top may have been built earlier, before its step's words were final (the Assignment is named
  // just before it shows): refresh its inside in place, so it moves smoothly but reads right.
  const top = cards[0];
  { const fresh = make(steps[k]); top.innerHTML = fresh.innerHTML; top.className = fresh.className; top.dataset.step = String(k); }
  cards.forEach((c, i) => { c.classList.toggle('under', i === 1); c.classList.toggle('under2', i === 2); });
  // The first time, the whole stack is dealt in together (2026-10-09, Sevaan: the top card rose over the ones already
  // sitting there), so slide the deck, not just the top card.
  if (k === 0) deck.animate([{ transform: 'translateY(105%)' }, { transform: 'translateY(0)' }], { duration: 650, easing: 'cubic-bezier(.2,.9,.3,1)' });
  if (steps[k].gold && !matchMedia('(prefers-reduced-motion: reduce)').matches) setTimeout(() => top.classList.add('shimmer'), 350); // the catch card arrives with a shine (2026-10-09, Sevaan)
  top.addEventListener('pointermove', (e) => { const r = top.getBoundingClientRect(); top.style.setProperty('--bgx', `${(30 + (e.clientX - r.left) / r.width * 40).toFixed(1)}%`); top.style.setProperty('--o', '1'); });
  top.addEventListener('pointerleave', () => top.style.setProperty('--o', '0'));
  return new Promise((resolve) => {
    onboarding = { resolve };
    const go = (yes) => { top.style.setProperty('--x', `${yes ? 130 : -130}vw`); top.style.setProperty('--r', `${yes ? 22 : -22}deg`); top.classList.add('gone'); setTimeout(() => resolve(yes), 120); }; // the next card rises while this one is still leaving
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
    { tier: 'Step 1 of 2', title: 'Where are you?', sub: ['', ''], art: OB_ART.loc, text: 'Your location sets which stars and satellites are overhead. It\'s only used to work out your sky, never sold or shared.', yes: 'Use my location', no: 'Not now' },
    { tier: 'Step 2 of 2', title: 'Move your phone', sub: ['', ''], art: OB_ART.motion, text: "With motion on, the circle follows the phone. Whatever sits in the circle is what you're looking at.", yes: 'Allow motion', no: 'Use a finger', onYes: () => { motionAsk = enableMotion(); } },
    { tier: 'Your first card', title: 'Your first catch', sub: ['Up right now', ''], art: OB_ART.catch, text: '', yes: 'Show me where', gold: true },
  ];
  let tgt0 = null;
  const nameTarget = () => { tgt0 = firstTarget(); if (!tgt0) return; steps[2].title = `Catch ${label(tgt0.obj)}`; steps[2].sub = [tgt0.obj.type === 'star' ? 'Bright star' : tgt0.obj.type === 'sun' ? 'Our star' : tgt0.obj.type === 'moon' ? 'The Moon' : tgt0.obj.natural ? 'Planet' : 'Satellite', whereWords(tgt0.look)]; steps[2].text = `It's up right now. ${tgt0.hint} Follow the arrow, then tap the circle to collect your first card.`;
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
  const sun = nat.find((n) => n.obj.key === 'sun' && n.look.visible); if (sun) return { obj: sun.obj, look: sun.look, hint: `${whereWords(sun.look)}. Aim the phone, not your eyes.` };
  const moon = nat.find((n) => n.obj.key === 'moon' && n.look.visible); if (moon) return { obj: moon.obj, look: moon.look, hint: `Bright and easy, ${whereWords(moon.look).toLowerCase()}.` };
  const best = nat.filter((n) => n.look.visible && n.look.el > 15 && (n.obj.type === 'planet' || n.obj.type === 'star')).sort((a, b) => a.look.mag - b.look.mag)[0];
  if (best) return { obj: best.obj, look: best.look, hint: `That bright, steady light, ${whereWords(best.look).toLowerCase()}.` };
  const sat = (state.items ?? []).filter((a) => a.look.visible && a.look.el > 20).sort((a, b) => a.look.mag - b.look.mag)[0];
  return sat ? { obj: sat.obj, look: sat.look, hint: `Moving steadily, ${whereWords(sat.look).toLowerCase()}.` } : null;
}
// After the tour, back on the sky: a one-time tip beside the radar, "Tap to see what's up tonight" (2026-10-09,
// Sevaan). Waits 3 s (and for any patch moment or panel to clear), shows ~6 s with a soft pulse on the radar, then
// fades; tapping it opens Tonight. Once per device ('radarTip').
function radarTip(delay = 3000) {
  try { if (localStorage.getItem('radarTip')) return; } catch {}
  setTimeout(() => {
    if (activePanel || !$('reveal').hidden || !$('auth-sheet').hidden || !$('ob-done').hidden || !$('recap').hidden || document.body.classList.contains('ob-tour') || document.querySelector('.set-sheet:not([hidden]), .patch-moment, .patch-coins, #toasts .ticket.in') || collectionOpen) { radarTip(1500); return; } // also any sheet (2026-10-13: it came up behind the reminder sheet) // one thing at a time (playtest 2026-10-09)
    try { localStorage.setItem('radarTip', '1'); } catch {}
    const r = $('radar').getBoundingClientRect(), tip = document.createElement('button');
    tip.type = 'button'; tip.className = 'radar-tip';
    tip.innerHTML = '<small>Tap the radar</small><b>See what\'s up tonight</b><span class="rt-x" role="button" aria-label="Dismiss">✕</span>'; // two balanced lines, no orphan (2026-10-09)
    tip.style.left = `${Math.round(r.right + 10)}px`; tip.style.top = `${Math.round(r.top + r.height * 0.36)}px`;
    document.body.append(tip); $('radar').classList.add('tip-pulse');
    requestAnimationFrame(() => tip.classList.add('in'));
    let gone = false;
    const hide = () => { if (gone) return; gone = true; tip.classList.remove('in'); $('radar').classList.remove('tip-pulse'); setTimeout(() => tip.remove(), 400); };
    tip.addEventListener('click', (e) => { hide(); if (!e.target.closest('.rt-x')) { showVTab('tonight'); openPanel('visible'); } }); // "See what's up tonight" opens Tonight (2026-10-12, Sevaan) // same as tapping the radar: the Now / Tonight panel
    $('radar').addEventListener('click', hide, { once: true }); // the radar itself opens the Now / Tonight panel
    // Stays until used or closed (2026-10-11, Sevaan: "I don't see it because it's so fast"); steps aside for panels.
    const watch = setInterval(() => { if (gone) { clearInterval(watch); return; } tip.style.visibility = activePanel || collectionOpen || !$('reveal').hidden ? 'hidden' : ''; }, 400);
  }, delay);
}
// The Tonight page once a day (2026-10-09, Sevaan): the first time you open the app on a new day (not the first run,
// which ends on it anyway), once tonight's plan is ready and nothing else is up. 'tonightDay' = the local date shown.
const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
function markTonightSeen() { try { localStorage.setItem('tonightDay', todayKey()); } catch {} }
// Weekly recap (playtest 2026-10-09, #15): the first visit of a new week, if you observed last week, opens on a card
// summing it up: new cards, sightings, nights, XP, your rarest find, the streak, and what's coming this week. Share it
// or swipe on. Once per week (localStorage recapWeek).
const weekStart = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime(); };
function weeklyRecap(tries = 0) {
  const w0 = weekStart(now().getTime()), last = w0 - 7 * 86400e3;
  let seen = null; try { seen = localStorage.getItem('recapWeek'); } catch { return; }
  if (seen === String(w0)) return;
  if (activePanel || collectionOpen || !$('reveal').hidden || document.body.classList.contains('ob-tour') || $('start').classList.contains('booting') || !$('ob-done').hidden || !state.cardModels?.size) {
    if (tries < 40) setTimeout(() => weeklyRecap(tries + 1), 500); return; }
  try { localStorage.setItem('recapWeek', String(w0)); } catch {}
  const real = state.sightings.filter((s) => !s.sim), week = real.filter((s) => s.time >= last && s.time < w0);
  if (new Set(week.map((s) => nightKey(s.time, s.lon ?? 0))).size < 2) return; // a one-night week isn't much of a recap (playtest room 2026-10-11)
  const firstSeen = new Map(); for (const s of real) if (!firstSeen.has(s.cardKey) || s.time < firstSeen.get(s.cardKey)) firstSeen.set(s.cardKey, s.time);
  const fresh = [...firstSeen].filter(([, t]) => t >= last && t < w0).map(([k]) => state.cardModels.get(k)).filter(Boolean);
  const order = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
  // Rarest first; ties go to the night sky over the Sun, then to deep sky and planets over plain stars (the room's
  // recap named the Sun, or a dim star over the Pleiades).
  const kindRank = (c) => (c?.type === 'sun' || c?.key === 'sun' ? -2 : c?.natural === 'deepsky' ? 2 : c?.type === 'planet' ? 1 : 0);
  const best = fresh.slice().sort((a, b) => order.indexOf(b.tier) - order.indexOf(a.tier) || kindRank(b) - kindRank(a))[0] ?? state.cardModels.get(week[week.length - 1].cardKey);
  const nights = new Set(week.map((s) => nightKey(s.time, s.lon ?? 0))).size;
  const xp = progressNow(real.filter((s) => s.time < w0)).xp - progressNow(real.filter((s) => s.time < last)).xp;
  const p = progressNow(real), streak = p.streak.current >= 2 ? `${p.streak.current}-week streak` : 'Week 1 of your streak';
  const ev = nextEvent(now().getTime()), fmtD = (t) => new Date(t).toLocaleDateString([], { day: 'numeric', month: 'short' });
  const tier = TIER_INFO[best?.tier] ?? TIER_INFO.common, img = best && artImage(best, 'small');
  const el = $('recap');
  // A real card (2026-10-12, Sevaan: "an actual card, not a square… tilt effects too"): card proportions, the retro
  // double frame, the rarest find in the art window, and the same tilt and glare as the cards.
  el.innerHTML = `<div class="rc-tilt"><div class="rc-card"><div class="rc-bar"><span>Your week</span><span>${fmtD(last)} – ${fmtD(w0 - 86400e3)}</span></div>
    <div class="rc-big"><b>${fresh.length}</b><span>new card${fresh.length === 1 ? '' : 's'}</span></div>
    ${best ? `<div class="rc-win">${img ? `<img src="${img}" alt="">` : lockedArt(best, true, tier.color, 'small')}<div class="rc-cap"><small>${fresh.length ? 'Rarest find' : 'Last seen'}</small><b>${escapeHtml(label(best))}</b><em style="color:${tier.color}">${tier.gem} ${escapeHtml(tier.label)}</em></div></div>` : '<div class="rc-win rc-win--empty"></div>'}
    <div class="rc-stats"><div><b>${week.length}</b><span>sightings</span></div><div><b>${nights}</b><span>night${nights === 1 ? '' : 's'} out</span></div><div><b>+${xp.toLocaleString()}</b><span>XP</span></div></div>
    <div class="rc-foot"><span>${streak}</span>${ev ? `<span>Coming up: <b>${escapeHtml(ev.name.replace(/\s*\d{4}$/, ''))}</b> · ${fmtD(ev.peak ?? ev.start)}</span>` : ''}</div>
    <div class="rc-glare" aria-hidden="true"></div></div></div>
    <div class="rc-actions"><button type="button" class="rc-share">Share my week</button><button type="button" class="rc-go">Explore the sky →</button></div>`;
  el.hidden = false; requestAnimationFrame(() => el.classList.add('in'));
  { const c = el.querySelector('.rc-card'); const t = attachTilt(c); try { attachGyro?.(c, t); } catch {} }
  const close = () => { el.classList.remove('in'); setTimeout(() => { el.hidden = true; }, 320); };
  el.querySelector('.rc-go').onclick = close;
  el.querySelector('.rc-share').onclick = async () => {
    const text = `My week in Space Collector: ${fresh.length} new card${fresh.length === 1 ? '' : 's'}, ${week.length} sightings over ${nights} night${nights === 1 ? '' : 's'}${best ? `. Rarest: ${label(best)} (${tier.label})` : ''}. https://sevaan.github.io/space-collector/`;
    try { if (navigator.share) await navigator.share({ text }); else { await navigator.clipboard.writeText(text); toast('Copied. Paste it anywhere.', 2200); } } catch {}
  };
}
// ---------- Not tonight: the page for a night of bad weather (2026-10-11) ----------
// Collecting still works through a gap in the cloud (2026-10-12, Sevaan: "correct it"; the rooms caught cards through
// fog while this page said they couldn't). So it never says you can't: it says the sky is cloudy and gaps count.
const WX_WORD = { rain: 'Rain', snow: 'Snow', storm: 'Storms', fog: 'Fog', cloudy: 'Cloud' }, WX_ICON = Object.fromEntries(Object.entries({ clear: 'stars', mostly: 'cloud-part', cloudy: 'cloud', rain: 'rain', snow: 'snow', storm: 'storm', fog: 'fog' }).map(([k, v]) => [k, `<span class="ico" data-ico="${v}" aria-hidden="true"></span>`])); // line icons, not emoji (craft room 2026-10-12)
const isGoodNight = (n) => n.kind === 'clear' || n.kind === 'mostly';
// One later night run through the same planner as tonight (tonight-worker.js), for the next good night's numbers.
const nightPlans = new Map();
function planNight(n) {
  const key = `${weekKey()}|${n}`;
  if (state.week?.key === weekKey()) { const w = state.week.nights.find((x) => x.n === n); if (w) return Promise.resolve(w); }
  if (!nightPlans.has(key)) nightPlans.set(key, new Promise((resolve) => {
    if (!state.catalog || !state.observer) { resolve(null); return; }
    const base = skyLimit({ sb: state.skySb }), faintest = (state.binoculars ? base.binoculars : base.satellites) + 0.5;
    const objects = state.catalog.objects.filter((o) => o.stdMag + 5 * Math.log10(Math.max(o.perigee ?? 400, 200) / 1000) <= faintest);
    const w = new Worker(new URL(`./tonight-worker.js?v=${VERSION}`, import.meta.url), { type: 'module' });
    const done = (v) => { w.terminate(); resolve(v); };
    w.onmessage = ({ data }) => done(data.error ? null : { ...data, n }); w.onerror = () => done(null);
    setTimeout(() => done(null), 30000);
    w.postMessage({ requestId: n, objects, observer: state.observer, startMs: nightNoon(n), sb: state.skySb, binoculars: state.binoculars, hours: 26, step: 120000 });
  }));
  return nightPlans.get(key);
}
function renderNotTonight(wx, T, t0) {
  const nights = wx.nights ?? [], next = nights.find((n) => n.n > 0 && isGoodNight(n));
  const dayName = (n) => (n.n === 1 ? 'Tomorrow' : new Date(n.t).toLocaleDateString([], { weekday: 'long' }));
  const short = (n) => (n.n === 0 ? 'TON' : new Date(n.t).toLocaleDateString([], { weekday: 'short' }).toUpperCase().slice(0, 3));
  const facts = [`${WX_WORD[wx.worst] ?? 'Cloud'} all night`, wx.temp != null ? `${wx.temp}°` : '', wx.wind != null ? `wind ${wx.wind} km/h` : ''].filter(Boolean).join(' · ');
  const passes = T ? tonightPasses(T, t0).filter((p) => p.start > t0) : [];
  const soon = passes.filter((p) => p.start <= t0 + 4 * 3600e3); // the evening, not 5 am
  // Rarest new cards first; Common and Uncommon only when that's all that's left (2026-10-12, Sevaan).
  const tN = (p) => TIER_RANK[(state.cardModels.get(cardKeyFor(p.obj)) ?? p.obj).tier] ?? 0, src = soon.length >= 2 ? soon : passes;
  const freshAll = src.filter((p) => p.fresh), bigAll = freshAll.filter((p) => tN(p) >= 2);
  const above = (bigAll.length ? bigAll : freshAll.length ? freshAll : src).slice().sort((a, b) => tN(b) - tN(a) || a.start - b.start).slice(0, 3).sort((a, b) => a.start - b.start);
  const all = new Set(passes.map((p) => p.id)).size;
  const cards = new Set(state.sightings.filter((s) => !s.sim).map((s) => s.cardKey)).size;
  const near = (progressNow(state.sightings).achievements ?? []).filter((x) => !x.done && x.prog && x.prog[0] > 0).map((x) => ({ ...x, f: x.prog[0] / x.prog[1] })).sort((a, b) => b.f - a.f)[0];
  const tier = (o) => TIER_INFO[o.tier] ?? TIER_INFO.common;
  $('ob-done').classList.add('nt');
  $('od-eyebrow').textContent = ''; $('ob-done-title').innerHTML = ''; $('od-sub').textContent = '';
  $('od-body').innerHTML = `<div class="nt-head"><span class="eyebrow nt-eyebrow">${escapeHtml(facts)}</span><h2 class="d-title small">${({ rain: 'Rainy', snow: 'Snowy', storm: 'Stormy', fog: 'Foggy' })[wx.worst] ?? 'Cloudy'} tonight.</h2>
      <span class="od-sub">${next ? `Clear again ${next.n === 1 ? '<em>tomorrow</em>' : `in <em>${next.n} days</em>`}` : 'No clear night in the forecast yet'}</span>
      <p class="nt-gap">Forecasts aren't perfect. If you spot a gap, anything you can see still counts.</p></div>
    <div class="nt-week">${nights.map((n) => `<div class="${isGoodNight(n) ? 'ok' : ''}${n.n === 0 ? ' now' : ''}"><b>${short(n)}</b><i>${WX_ICON[n.kind] ?? WX_ICON.cloudy}</i><s><u style="height:${Math.max(6, n.cloud ?? 50)}%"></u></s></div>`).join('')}</div>
    <div class="nt-legend"><span>Bars: cloud after dark</span>${nights.length < 7 ? '<span>Forecast ends here</span>' : ''}</div>
    ${next ? `<div class="nt-hero"><div class="nt-top"><span class="nt-k">Next good night</span><span class="nt-in">${next.n === 1 ? 'tomorrow' : `in ${next.n} days`}</span></div>
      <div class="nt-day">${escapeHtml(dayName(next))}</div><div class="nt-why" id="nt-why">${next.clearFrom ? `Clear from ${escapeHtml(fmtTime(next.clearFrom))}` : next.kind === 'clear' ? 'Clear all night' : 'Mostly clear'}</div>
      <div class="nt-stats"><div><b id="nt-passes">…</b><small>Passes</small></div><div><b id="nt-new">…</b><small>New to you</small></div><div><b id="nt-busy">…</b><small>Busiest</small></div></div>
      <button type="button" class="nt-bell" id="nt-remind"><span><span class="ico" data-ico="bell" aria-hidden="true"></span> Remind me ${escapeHtml(dayName(next))}</span><span aria-hidden="true">→</span></button></div>` : ''}
    ${above.length ? `<div class="nt-sec"><div class="nt-secrow"><span>Above the ${escapeHtml((WX_WORD[wx.worst] ?? 'cloud').toLowerCase())} tonight</span>${all > above.length ? `<button type="button" id="nt-all">All ${all} ›</button>` : ''}</div>
      ${above.map((p) => `<div class="nt-pass" role="button" tabindex="0" data-id="${p.obj.id}"><b>${escapeHtml(fmtTime(p.start).replace(/\s?[AP]\.?M\.?$/i, ''))}</b><span><i>${escapeHtml(label(p.obj))}</i><small>${p.peakEl >= 50 ? 'High' : p.peakEl >= 25 ? 'Well up' : 'Low'} in the ${compassPoint(p.peakAz)}${p.fresh ? ' · new to you' : ''}</small></span><em style="color:${tier(state.cardModels.get(cardKeyFor(p.obj)) ?? p.obj).color}">${tier(state.cardModels.get(cardKeyFor(p.obj)) ?? p.obj).gem} ${escapeHtml(tier(state.cardModels.get(cardKeyFor(p.obj)) ?? p.obj).label)}</em></div>`).join('')}
      <p class="nt-note">Hidden for now. Find a gap and you can still collect them.${next ? ` They're back on a clear sky ${next.n === 1 ? 'tomorrow' : escapeHtml(dayName(next))}.` : ''}</p></div>` : ''}
    <div class="nt-sec"><div class="nt-secrow"><span>While you wait</span></div><div class="nt-tiles">
      <button type="button" class="nt-tile" id="nt-col"><span class="nt-ic"><span class="ico" data-ico="cards" aria-hidden="true"></span></span><b>Collection</b><small>${cards} card${cards === 1 ? '' : 's'}</small></button>
      <button type="button" class="nt-tile" id="nt-patch">${near ? `<span class="nt-ring" style="--f:${Math.round(near.f * 100)}%"></span><b>Patches</b><small>${escapeHtml(near.name)} ${Math.round(near.f * 100)}%</small>` : `<span class="nt-ic"><span class="ico" data-ico="patch" aria-hidden="true"></span></span><b>Patches</b><small>See them all</small>`}</button>
      ${next ? `<button type="button" class="nt-tile" id="nt-preview"><span class="nt-ic"><span class="ico" data-ico="stars" aria-hidden="true"></span></span><b>${escapeHtml(next.n === 1 ? 'Tomorrow' : new Date(next.t).toLocaleDateString([], { weekday: 'long' }))}'s sky</b><small>Preview it</small></button>` : ''}
    </div></div>`;
  const leave = () => hideDone();
  $('nt-col').onclick = () => { leave(); openCollection(); };
  $('od-body').querySelectorAll('.nt-pass[data-id]').forEach((r) => r.addEventListener('click', () => { const o = state.byId.get(Number(r.dataset.id)) ?? state.byId.get(r.dataset.id); if (o) showTonightCard(o, r.getBoundingClientRect(), 'ABOVE THE CLOUD'); })); // tap a row to preview its card
  $('nt-patch').onclick = () => { leave(); openCollection('patches'); };
  $('nt-all')?.addEventListener('click', () => { leave(); showVTab('tonight'); openPanel('visible'); });
  if (!next) return;
  let busiest = null;
  $('nt-remind').onclick = async () => { if ($('nt-remind').disabled) return; const at = next.clearFrom ?? next.t; const r = await setReminder({ at, title: 'A clear night for Space Collector', body: 'The forecast says clear. Open Space Collector and look up.', key: 'clear-night' }); remindDone($('nt-remind'), reminderToast(r, at), at); };
  $('nt-preview').onclick = () => { const t = busiest ?? (next.clearFrom ?? next.t) + 3600e3; leave(); state.timeOffsetMs = t - Date.now(); state.pinnedId = null; state.targetId = null; afterTimeJump(); renderPeakToggle(); };
  planNight(next.n).then((N) => {
    if (!N || !document.getElementById('nt-passes')) { for (const id of ['nt-passes', 'nt-new', 'nt-busy']) { const e = document.getElementById(id); if (e) e.textContent = '–'; } return; }
    // The bright and the rare (not every new-to-you pass, or a first-week player sees "722"), and the busiest moment
    // in the first five hours of dark, when people are actually out.
    const from = N.dusk ?? N.startMs, to = Math.min(N.dawn ?? Infinity, from + 5 * 3600e3);
    const good = tonightPasses(N, N.startMs).filter((p) => p.start >= from && p.start <= to && (p.mag <= 2.5 || p.peakEl >= 60 || ['rare', 'epic', 'legendary'].includes(p.obj.tier)));
    const fresh = new Set(good.filter((p) => p.fresh).map((p) => cardKeyFor(p.obj))).size;
    const pk = N.curve.filter(([t]) => t >= from && t <= to).reduce((a, c) => (c[1] > a[1] ? c : a), [0, 0]);
    busiest = pk[1] ? pk[0] : null;
    $('nt-passes').textContent = new Set(good.map((p) => p.id)).size; $('nt-new').textContent = fresh;
    $('nt-busy').textContent = busiest ? fmtTime(busiest).replace(/\s?[AP]\.?M\.?$/i, '') : '–';
    if (N.moonIllum != null) $('nt-why').textContent += ` · moon ${Math.round(N.moonIllum * 100)}% full`;
  });
}
function dailyTonight(tries = 0) {
  let seen = null; try { seen = localStorage.getItem('tonightDay'); } catch { return; }
  if (seen === todayKey()) return;
  if (!state.tonight || activePanel || collectionOpen || !$('reveal').hidden || document.body.classList.contains('ob-tour') || $('start').classList.contains('booting') || !$('ob-done').hidden || !$('recap').hidden) {
    if (tries < 40) setTimeout(() => dailyTonight(tries + 1), 500); return; }
  markTonightSeen();
  // A ticket, not the whole page (2026-10-11, Sevaan: it opened right after a catch, "a weak time to show it. Would
  // have been nice to not be interrupted… a toast that I could click to go to it"). It stays until tapped or closed.
  const wx = tonightWeather(), T = state.tonight, t0 = now().getTime();
  const peak = T ? T.curve.filter(([t]) => t >= t0 && t <= eveningEnd(T)).reduce((a, c) => (c[1] > a[1] ? c : a), [0, 0]) : [0, 0];
  const line = !wx ? (peak[1] ? `Busiest at ${fmtTime(peak[0])}: ${peak[1]} objects up at once` : 'See tonight\'s plan')
    : wx.kase === 'bad' ? `${wx.line}. See the nights ahead` : `${wx.line}${peak[1] ? ` · busiest at ${fmtTime(peak[0])}` : ''}`;
  ticket({ kind: 'event', id: 'tonight', sticky: true, eyebrow: 'TONIGHT', line, go: 'SEE', action: () => { if (activePanel || collectionOpen) return; $('onboard').hidden = false; obFinish(true); } });
}
// The Tonight page slides down and away (UX room 2026-10-12: it cut straight to the sky); it slides up on the way in (CSS).
function hideDone() {
  const ob = $('onboard'), done = $('ob-done'), go = () => { ob.hidden = true; done.hidden = true; ob.style.opacity = ''; };
  if (done.hidden || matchMedia('(prefers-reduced-motion: reduce)').matches) { go(); return; }
  ob.style.pointerEvents = 'none';
  done.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(6%)', opacity: 0 }], { duration: 280, easing: 'cubic-bezier(.4,0,.8,.6)' }).finished.then(go, go).finally(() => { ob.style.pointerEvents = ''; });
}
function obFinish(caught) {
  setTimeout(warnExample, 1500); // the sky is someone else's until you share a location
  if (caught) markTonightSeen();
  $('sky').classList.remove('asleep'); // never leave the sky asleep (a skip mid-tour)
  // Let go of the tour's target (2026-10-09, Sevaan: Vega stayed selected with View card while pointing elsewhere).
  state.pinnedId = null; state.targetId = null; state.guidePass = null; state.sticky.clear();
  const ob = $('onboard'); ob.style.pointerEvents = ''; onboarding = null; document.body.classList.remove('ob-tour'); state.tourCatchId = null; state.tourRevealed = false; $('ob-deck').replaceChildren(); $('ob-pips').hidden = false;
  if (!caught) { ob.hidden = true; return; }
  const T = state.tonight, t0 = now().getTime(), wx = tonightWeather();
  const eve = eveningEnd(T);
  const peak = T ? T.curve.filter(([t]) => t >= t0 && t <= eve).reduce((a, c) => (c[1] > a[1] ? c : a), [0, 0]) : null;
  const best = T ? (tonightPasses(T, t0).find((p) => p.fresh && p.start > t0 && p.start <= eve) ?? tonightPasses(T, t0).find((p) => p.start > t0 && p.start <= eve)) : null;
  // The page by weather (2026-10-08, design/tonight-weather.html): clear · clearing later · clouding over · bad.
  // Clearing only after the evening is over counts as a bad night (a 6 AM "Clear by" helped nobody).
  const kase = wx?.kase === 'clearing' && wx.clearFrom > eve ? 'bad' : wx?.kase ?? 'clear', dusk = T?.dusk && T.dusk > t0 ? T.dusk : t0, dawn = T?.dawn ? Math.min(T.dawn, eve) : (Number.isFinite(eve) ? eve : null);
  const passes = T ? tonightPasses(T, t0).filter((p) => p.start > t0 && p.start <= eve) : [];
  const after = (t) => passes.filter((p) => p.start >= t), before = (t) => passes.filter((p) => p.start < t);
  // The rarest new card, earliest first; Common and Uncommon only when nothing rarer is up (2026-10-12, Sevaan: "Breeze-M
  // Debris. What rarity is that? No common or uncommon cards should be here unless they are all that is left").
  const tierOf = (p) => TIER_RANK[(state.cardModels.get(cardKeyFor(p.obj)) ?? p.obj).tier] ?? 0;
  const pickBest = (list) => { const fresh = list.filter((p) => p.fresh), big = fresh.filter((p) => tierOf(p) >= 2); const pool = big.length ? big : fresh; return pool.slice().sort((a, b) => tierOf(b) - tierOf(a) || a.start - b.start)[0] ?? list[0] ?? null; };
  const peakIn = (s, e) => (T ? T.curve.filter(([t]) => t >= s && t <= e).reduce((a, c) => (c[1] > a[1] ? c : a), [0, 0]) : [0, 0]);
  // The name opens a preview of the card; the line says its rarity and where to look in words.
  const passLine = (p) => { const t = TIER_INFO[(state.cardModels.get(cardKeyFor(p.obj)) ?? p.obj).tier] ?? TIER_INFO.common;
    return `<button type="button" class="od-pass" data-id="${p.obj.id}"><em>${escapeHtml(label(p.obj))}</em></button> · <b class="od-tier" style="color:${t.color}">${t.gem} ${t.label}</b> · ${whereWords({ el: p.peakEl, az: p.peakAz }).toLowerCase()}${p.fresh ? ' · new to you' : ''}`; };
  let items = [], chosen = null;
  const done = $('ob-done'); done.className = `ob-done wx-${kase}`;
  let sky = `<div class="od-stars">${Array.from({ length: kase === 'bad' ? 0 : 36 }, () => `<i style="left:${(Math.random() * 100).toFixed(1)}%;top:${(Math.random() * 30).toFixed(1)}%"></i>`).join('')}</div>`;
  if (kase === 'clearing') {
    chosen = pickBest(after(wx.clearFrom)); const pk = peakIn(wx.clearFrom, dawn ?? Infinity);
    items = [[dusk, 'Dark, but cloudy', 'cloud'], [wx.clearFrom, 'Clouds part'], ...(chosen ? [[chosen.start, passLine(chosen), 'hot']] : []), ...(pk[1] ? [[pk[0], `Busiest: ${pk[1]} objects up at once`]] : [])];
    if (wx.clearFrom - dusk > 90 * 60e3) items.splice(1, 0, [dusk + (wx.clearFrom - dusk) / 2, 'Still covered', 'cloud']);
    $('od-eyebrow').textContent = 'Worth the wait'; $('ob-done-title').innerHTML = `Clear<br>by ${escapeHtml(fmtTime(wx.clearFrom))}.`; $('od-sub').textContent = `Cloudy at dusk · clearing from ${fmtTime(wx.clearFrom)}`;
    sky += cloudsHtml(0.75);
  } else if (kase === 'closing') {
    const win = before(wx.coverFrom); chosen = pickBest(win); const last = win[win.length - 1];
    items = [[dusk, 'Dark enough to start'], ...(chosen ? [[chosen.start, passLine(chosen), 'hot']] : []), ...(last && last !== chosen ? [[last.start, 'Last good pass before the cloud']] : []), [wx.coverFrom, 'Clouding over', 'cloud']];
    $('od-eyebrow').textContent = 'Go early'; $('ob-done-title').innerHTML = `Clear until<br>${escapeHtml(fmtTime(wx.coverFrom))}.`; $('od-sub').textContent = `A short window · go before ${fmtTime(wx.coverFrom)}`;
    sky += cloudsHtml(0.55, { side: 'right' });
  } else if (kase === 'bad') {
    // Not tonight (2026-10-11, Sevaan; design/not-tonight-combined.html: "all four in one"). One scrolling page: the
    // week's cloud, the next good night with its numbers and the reminder, what's passing above the cloud tonight,
    // and things to do now. Explore stays pinned at the bottom. Opened from the Tonight ticket, never on its own.
    sky += cloudsHtml(1, { dark: true }) + (['rain', 'storm'].includes(wx.worst) ? rainHtml() : '');
    $('od-sky').innerHTML = sky;
    renderNotTonight(wx, T, t0);
    $('ob-remind').hidden = true;
    $('ob-explore').firstElementChild.textContent = 'Explore the sky anyway';
    $('ob-explore').onclick = () => { hideDone(); setTimeout(maybeAskSignIn, 600); radarTip(); };
    $('ob-done').hidden = false;
    return;
  } else {
    chosen = pickBest(passes); const pk = peakIn(t0, dawn ?? Infinity); // rarest new card first, as in the other cases
    items = [[dusk, T?.dusk && T.dusk > t0 ? 'Dark enough to start' : "It's dark: go now"], ...(chosen ? [[chosen.start, passLine(chosen), 'hot']] : []), ...(pk[1] ? [[pk[0], `Busiest: ${pk[1]} objects up at once`]] : []), ...(dawn ? [[dawn, T?.dawn && dawn < T.dawn ? 'The evening plan ends here' : 'Dawn: the sky closes']] : [])];
    $('od-eyebrow').textContent = "You're set"; $('ob-done-title').innerHTML = 'Tonight<br>looks good.'; $('od-sub').textContent = `${wx ? wx.line : 'Clear skies'}${pk[1] ? ` · ${pk[1]} satellites at the peak` : ''}`;
  }
  $('od-sky').innerHTML = sky;
  items.sort((a, b) => a[0] - b[0]);
  $('od-body').innerHTML = `<div class="od-tl">${items.map(([t, s, c]) => `<div class="it ${c ?? ''}"><b>${escapeHtml(fmtTime(t).replace(/\s?[AP]\.?M\.?$/i, ''))}</b><span>${s}</span></div>`).join('')}</div>`;
  $('od-body').querySelectorAll('.od-pass').forEach((b) => b.addEventListener('click', () => { const o = state.byId.get(Number(b.dataset.id)) ?? state.byId.get(b.dataset.id); if (o) showTonightCard(o, b.getBoundingClientRect(), 'TONIGHT'); }));
  // Tonight's missions under the timeline (2026-10-09, Sevaan; design/tonight-missions.html A): the same three nightly
  // missions as the rank card, with the ones already done crossed out.
  { const ms = progressNow(state.sightings).missions ?? [], done = ms.filter((m) => m.done).length;
    if (ms.length) $('od-body').insertAdjacentHTML('beforeend', `<div class="od-missions"><div class="od-mhead"><span>Tonight's missions</span><span>${done} / ${ms.length} · +50 XP each</span></div>${ms.map((m) => `<div class="od-m${m.done ? ' done' : ''}"><i></i>${escapeHtml(m.text)}</div>`).join('')}</div>`); }
  const best2 = chosen;
  // Only offer a reminder that's still ahead (2026-10-09 tour test: "Remind me at 7:36" showed at 7:46 for a pass up now).
  const remindable = best2 && best2.start - 10 * 60e3 > now().getTime() + 60e3;
  $('ob-remind').disabled = false; $('ob-remind').classList.remove('done');
  $('ob-remind').hidden = !remindable; if (remindable) $('ob-remind').firstElementChild.textContent = `Remind me at ${fmtTime(best2.start - 10 * 60e3).replace(/\s?[AP]\.?M\.?$/i, '')}`;
  // The button answers for itself (2026-10-12, Sevaan: "tapping the reminder button does nothing"; the confirming toast
  // waits behind this page, so there was no sign it worked).
  $('ob-remind').onclick = async () => { if (!remindable || $('ob-remind').disabled) return; buzz(8); const ok = await remindPass(best2); remindDone($('ob-remind'), ok, best2.start - 10 * 60e3); };
  $('ob-explore').firstElementChild.textContent = 'Explore the sky';
  $('ob-explore').onclick = () => { hideDone(); setTimeout(maybeAskSignIn, 600); radarTip(); };
  $('ob-done').hidden = false;
}

// Returning users skip the start screen and go straight to the sky. iPhones only allow motion
// access from a tap, so if it isn't available yet the first tap anywhere turns it on.
async function quickStart() {
  enterSky(); requestLocation(); keepAwake();
  setTimeout(() => weeklyRecap(), 1200); // a new week opens on last week's recap (playtest #15)
  setTimeout(() => dailyTonight(), 1500); // the day's first visit opens on the Tonight page (after the recap)
  let ok = false;
  try { ok = await startSensors(); } catch {}
  if (!ok) ok = await trySensorsQuietly(); // already allowed? then motion just works, no tap
  state.drag.on = !ok;
  state.needsMotionTap = !ok;
}
// iPhones only count a finished tap (touchend/click) as permission to ask, not a finger landing (pointerdown),
// so ask on the release. Until it works, keep asking on the next touch instead of giving up after one try.
let motionAsking = false;
async function motionFromTap() {
  if (!state.needsMotionTap || motionAsking) return;
  motionAsking = true;
  let ok = false;
  try { ok = await startSensors(); } catch {}
  motionAsking = false;
  if (!ok) return;
  state.needsMotionTap = false;
  state.drag.on = false;
  $('chk-drag').checked = false;
  showBanner('');
}
document.addEventListener('touchend', motionFromTap, true);
document.addEventListener('click', motionFromTap, true);
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
  const probe = document.createElement('div'); probe.style.cssText = 'position:fixed;visibility:hidden;padding-top:var(--safe-top);padding-bottom:var(--safe-bottom)'; // the same insets the page uses (lower when standalone)
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
  document.body.classList.add('col-open'); // Explore's switcher stays on top while the Collection slides over (2026-10-11, Sevaan)
  // Fade in only once it has painted (2026-10-07: a not-yet-loaded frame flashed white); load does it otherwise.
  colFrame.hidden = false; if (colLoaded) colFrame.classList.add('open');
  const w = colFrame.contentWindow;
  if (w && colFrame.contentDocument?.readyState === 'complete' && w.location.href !== 'about:blank') w.postMessage({ sc: 'show', key }, location.origin);
  else pendingKey = key;
}
async function closeCollection(fromHistory = false) {
  document.body.classList.remove('col-modal');
  if (!collectionOpen) return;
  collectionOpen = false; setSwitch($('nav'), 'left', false); colFrame.classList.add('closing'); colFrame.classList.remove('open'); setTimeout(() => { colFrame.classList.remove('closing'); if (!collectionOpen) { colFrame.hidden = true; document.body.classList.remove('col-open'); } }, 340); // slides back down, switcher on top throughout
  if (!fromHistory && history.state?.sc === 'collection') { try { history.back(); } catch {} }
  await loadSightings(); // a sighting may have been deleted over there
}
window.addEventListener('popstate', () => { if (collectionOpen && history.state?.sc !== 'collection') closeCollection(true); });
window.addEventListener('message', (e) => {
  if (e.origin !== location.origin || !e.data?.sc) return;
  if (e.data.sc === 'ready') { colLoaded = true; if (collectionOpen) colFrame.classList.add('open'); }
  if (e.data.sc === 'explore') { closeCollection(); if (e.data.more) openDebug(); }
  if (e.data.sc === 'modal') document.body.classList.toggle('col-modal', !!e.data.on); // a card or stats open in there
  if (e.data.sc === 'signin') openAuth('collection'); // the Collection's "not backed up" line
  // Find tab (2026-10-13): next passes for the objects on screen, and reminders / Show me for them.
  if (e.data.sc === 'find-passes') findPasses(e.data.ids, e.data.req);
  if (e.data.sc === 'find-suggest') { // the rarest new cards with a pass tonight or this week, from the plans we already have
    const t0 = now().getTime(), tierN = (o) => TIER_RANK[(state.cardModels.get(cardKeyFor(o)) ?? o).tier] ?? 0, nights = [state.tonight, ...(state.week?.nights ?? [])].filter(Boolean), best = new Map();
    for (const N of nights) for (const p of tonightPasses(N, t0)) { if (!p.fresh || p.start < t0 || p.obj.family || tierN(p.obj) < 1) continue; const k = cardKeyFor(p.obj), b = best.get(k); if (!b || p.start < b.start) best.set(k, p); }
    const top = [...best.values()].sort((a, b) => tierN(b.obj) - tierN(a.obj) || a.start - b.start).slice(0, 8).sort((a, b) => a.start - b.start);
    colFrame.contentWindow?.postMessage({ sc: 'find-suggest', reminded: [...reminded], items: top.map(({ obj, fresh, ...p }) => ({ ...p, id: obj.id, cloud: cloudAt(p.start) })) }, location.origin); }
  if (e.data.sc === 'find-remind' || e.data.sc === 'find-show') { const p = e.data.pass, obj = p && state.byId.get(p.id); if (obj) {
    const key = `${obj.id}@${p.start}`;
    if (e.data.sc === 'find-show') { closeCollection(); setTimeout(() => showMePass({ ...p, obj }), 450); }
    else (async () => { let on;
      if (reminded.has(key)) { reminded.delete(key); cancelNotify(remindIds.get(key)?.id); remindIds.delete(key); saveRems(); on = false; }
      else { const ok = await remindPass({ ...p, obj }, key); if (ok) reminded.add(key); on = !!ok; }
      colFrame.contentWindow?.postMessage({ sc: 'find-reminded', key, on, set: [...reminded] }, location.origin); })(); } }
  if (e.data.sc === 'remind') { const p = state.tonight?.passes?.filter((x) => x.id === e.data.id && x.end > now().getTime()).sort((a, b) => a.start - b.start)[0], obj = p && state.byId.get(p.id); if (obj) remindPass({ ...p, obj }); } // an "Up tonight" slot in Collection
});
let findWorker = null;
function findPasses(ids, req) {
  if (!state.catalog || !state.observer) return;
  const objects = ids.map((id) => state.byId.get(id) ?? state.catalog.objects.find((o) => o.id === id)).filter((o) => o && !o.natural).map((o) => state.catalog.objects.find((x) => x.id === o.id) ?? o);
  findWorker ??= new Worker(new URL(`./find-worker.js?v=${VERSION}`, import.meta.url), { type: 'module' });
  findWorker.onmessage = ({ data }) => { const ps = data.passes ?? {}; for (const k in ps) if (ps[k]) ps[k].cloud = cloudAt(ps[k].start); colFrame.contentWindow?.postMessage({ sc: 'find-passes', req: data.requestId, passes: ps, reminded: [...reminded] }, location.origin); }
  findWorker.postMessage({ requestId: req, objects, observer: state.observer, startMs: now().getTime(), sb: state.skySb, binoculars: state.binoculars });
}
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
// Welcome card: the original "Collect the Cosmos" mission card (Solar System art, In orbit / Also / Your rank) with
// the newer description (2026-10-09, Sevaan: back to the original card, keeping this text).
function welcomeModel() {
  return {
    key: 'welcome', id: 'welcome', natural: 'welcome', type: 'welcome', name: 'Collect the Cosmos', tier: 'legendary', code: 'MISSION 01',
    stats: [['STEP 1', 'Go outside', ''], ['STEP 2', 'Look up', ''], ['STEP 3', 'Collect', '']], // the three steps (2026-10-09, Sevaan)
    fact: 'No telescope, no tickets. **Every light that moves is a card**: satellites, rocket stages, the Space Station. The darker your spot, the more you can catch.',
  };
}
// Twinkling stars behind the welcome card (2026-10-09, Sevaan), the same field as behind the reveal.
addStarfield($('start'), 90);
function renderStartHand() {
  const holder = $('wc-holder'); if (!holder || wcCard) return;
  setTimeout(() => sky.warmMilky(), 1800); // the Milky Way photo loads while you read the card, not as the sky starts (playtest 2026-10-09)
  const card = renderCard(welcomeModel(), { preview: true });
  card.classList.add('wc-mission');
  // Dress it as a briefing, not a catalogue entry.
  const sb = card.querySelector('.card__setbar > span:first-child > span'); if (sb) sb.textContent = 'MISSION CONTROL';
  const id = card.querySelector('.card__identity'); if (id) id.innerHTML = '<span>Your first mission</span><span class="card__mono">OBSERVER 001</span>';
  const art = card.querySelector('.card__art'), sys = SOLAR_SYSTEM, src = artImage(sys);
  if (art && src) art.innerHTML = `<img class="card-art-image" src="${src}" alt="" decoding="async">`;
  const st = card.querySelector('.card__status'); if (st) st.innerHTML = '<span class="card__status-icon" aria-hidden="true">↑</span><span>SWIPE AWAY TO BEGIN</span>' /* matches the "Swipe away" under the card (playtest 2026-10-09) */;
  // Start face-down: the card is turned half way, so its (pre-mirrored) back faces you.
  const back = card.querySelector('.card__back'); applyBack(back); back.style.opacity = '1';
  back.insertAdjacentHTML('beforeend', '<div class="tap">Tap to reveal</div>'); // on the card itself, like the old sealed reveal
  card.style.transform = 'perspective(1600px) rotateY(180deg)';
  holder.replaceChildren(card); wcCard = card;
  attachTilt(card);
  holder.classList.add('rattle');
  // A soft card-stock rattle with each shake (2026-10-11, Sevaan). The shake opens every CSS cycle, so play on the
  // animation's start (after its 1 s delay) and on each repeat. Silent on the web until the first tap (browsers).
  if (!holder.dataset.rattleSound) {
    holder.dataset.rattleSound = '1';
    const shake = (e) => { if (e.animationName === 'wcRattle' && holder.classList.contains('rattle') && !$('start').hidden) sfx('rattle', { gap: 1000 }); };
    holder.addEventListener('animationstart', shake); holder.addEventListener('animationiteration', shake);
  }
}
async function welcomeFlip() {
  if (!wcCard || wcFlipped) return;
  if (!wcReady) { wcWantFlip = true; return; }
  wcFlipped = true;
  const holder = $('wc-holder'), back = wcCard.querySelector('.card__back');
  holder.classList.remove('rattle'); $('wc-hint').classList.add('gone'); unlockAudio(); sfx('welcome');
  const ms = matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 900;
  wcCard.animate([
    { transform: 'perspective(1600px) rotateY(180deg) scale(1)', easing: 'cubic-bezier(.5,0,1,1)' },
    { transform: 'perspective(1600px) rotateY(270deg) scale(1.08)', offset: .5, easing: 'cubic-bezier(0,0,.4,1)' },
    { transform: 'perspective(1600px) rotateY(360deg) scale(1)' }], { duration: ms, fill: 'forwards' });
  setTimeout(() => { back.style.opacity = ''; }, ms / 2); // edge-on: swap faces
  await new Promise((r) => setTimeout(r, ms));
  wcCard.getAnimations().forEach((a) => a.cancel()); wcCard.style.transform = '';
  back.querySelector('.tap')?.remove(); // it's been revealed; from here a double tap flips it like any card
  attachFlip(wcCard, { onBack: applyBack });
  $('wc-hint').hidden = true; $('wc-after').hidden = false; $('start').classList.add('wc-open');
}
function welcomeGo(dx = 0, dy = -2, dt = 16) {
  if (!wcFlipped || $('btn-start').disabled) return;
  $('btn-start').disabled = true; sfx('swipe');
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
    await loadConstellations(); await loadComets();
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
  initAccount(); renderAccount(); // signed-in phones sync in the background; nothing waits on it
  { const sv = loadSavedLocation(); state.locationStatus = sv?.manual ? 'manual' : sv ? 'saved' : 'example'; } renderLocation();
  state.frame = frame(now(), state.observer); renderStartHand(); 
  $('btn-start').firstElementChild.textContent='Swipe away'; $('btn-start').disabled=false; wcReady = true; if (wcWantFlip) welcomeFlip();
  $('wc-signin').hidden = !!account() || state.sightings.some((x) => !x.sim); // "Already collecting? Sign in", not for someone replaying the tour with cards
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
function pumpPatch() {
  if (patchBusy || !patchQueue.length) return;
  if (!$('reveal').hidden || collectionOpen || activePanel || !$('ob-done').hidden) { setTimeout(pumpPatch, 700); return; } // not over the Tonight page either
  patchBusy = true;
  // Patch coins (2026-10-09, Sevaan; design/patch-earn-options.html A2): instead of a full-screen moment, the patches
  // pop up on the left over the live sky like coins (flat spin + bounce, always round), each with a "Patch earned ·
  // name" tag to its right; ~3.5 s later they roll down into the Collection tab, which bumps "+N". Up to 5 show; more
  // are counted in the badge. Tap any to skip. The sky stays usable throughout.
  const batch = patchQueue.splice(0), shown = batch.slice(0, 1), el = document.createElement('div'); // one coin, "+ N more" (playtest room 2026-10-12: a column of coins covered the circle)
  el.className = 'patch-coins'; el.setAttribute('role', 'status');
  el.setAttribute('aria-label', `${batch.length === 1 ? 'Patch' : `${batch.length} patches`} earned: ${batch.map((x) => x.name).join(', ')}`);
  const nav = $('nav-collection').getBoundingClientRect();
  el.innerHTML = shown.map((x, i) => `<div class="pc-coin" style="--d:${(i * 0.32).toFixed(2)}s"><span class="pc-disc">${patchHtml(x, { stitch: true })}</span><span class="pc-tag"><small>${x.secret ? 'Secret patch' : 'Patch earned'}</small><b>${escapeHtml(x.name)}</b></span></div>`).join('')
    + (batch.length > shown.length ? `<div class="pc-more">+ ${batch.length - shown.length} more</div>` : '');
  // Above the toasts (2026-10-09, Sevaan: a coin was covering one): start from the top of the visible toast stack.
  // Now a fixed spot under the radar, clear of the target card, toasts and slider (playtest 2026-10-11: they covered
  // VIEW CARD and the slider; on the small phone a single coin did).
  // Under the radar, each coin's centre on the radar's centre line, as if it slid out from underneath (2026-10-12, Sevaan).
  { const rc = $('radar-canvas')?.getBoundingClientRect(), rb = $('radar')?.getBoundingClientRect();
    if (rc?.width && rb) { el.style.left = `${Math.round(rc.left + rc.width / 2 - 29)}px`; el.style.top = `${Math.round(rb.bottom + 10)}px`; } }
  document.body.append(el);
  const coins = [...el.querySelectorAll('.pc-coin')];
  coins.forEach((c, i) => setTimeout(() => { c.classList.add('in'); if (i === 0) { sfx('patch'); buzz(20); } }, i * 320));
  let done = false;
  const finish = () => {
    if (done) return; done = true; clearTimeout(outT);
    // roll each coin into the Collection tab
    coins.forEach((c, i) => { const d = c.querySelector('.pc-disc').getBoundingClientRect();
      c.style.setProperty('--tx', `${(nav.left + nav.width / 2 - (d.left + d.width / 2)).toFixed(0)}px`); c.style.setProperty('--ty', `${(nav.top + nav.height / 2 - (d.top + d.height / 2)).toFixed(0)}px`);
      setTimeout(() => c.classList.add('out'), i * 90); });
    sfx('coinroll', { gain: 0.8 });
    setTimeout(() => {
      el.remove();
      const badge = document.createElement('span'); badge.className = 'pc-badge'; badge.textContent = `+${batch.length}`;
      badge.style.left = `${Math.round(nav.right - 22)}px`; badge.style.top = `${Math.round(nav.top - 10)}px`;
      document.body.append(badge); setTimeout(() => badge.remove(), 2400);
      patchBusy = false; setTimeout(pumpPatch, 500);
    }, 650 + coins.length * 90);
  };
  const outT = setTimeout(finish, 7000 + shown.length * 320); // 7 s to enjoy them (2026-10-11, Sevaan); a tap sends them on sooner
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
    fossilDone = true; Fossil.markFound(); buzz(30); sfx('fossil');
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
  ufoCaught = true; Ufo.markCaught(); $('ufo-cta').hidden = true; buzz([20, 40, 20]); sfx('ufo');
  earnPatch(Ufo.UFO_PATCH);
});
$('btn-ufo')?.addEventListener('click', () => { ufoCaught = false; try { localStorage.removeItem('ufoFound'); } catch {} Ufo.summon(now().getTime()); closePanel('debug'); toast('A UFO is crossing your sky now (night, 3+ things up).', 3000); });

// ---------- Settings (2026-10-08, design/settings.html) ----------
function soundOn() { return readPref('sound', true); }
// Haptics (QA 2026-10-11: navigator.vibrate does nothing on iPhone). Old call sites pass milliseconds or a pattern;
// they map to a feel: a tick for small taps, a thud for bigger moments, a success pattern for celebrations.
// Vibration has its own switch (UX room 2026-10-12: muting sound took the haptics with it, when they matter most).
$('chk-haptics').checked = readPref('haptics', true);
$('chk-haptics').addEventListener('change', (e) => { writePref('haptics', e.target.checked); if (e.target.checked) buzz(14); });
// The payoff haptic, timed with the card turning over (js/reveal.js 'sc:payoff'): stronger for rarer cards.
addEventListener('sc:payoff', (e) => { const t = e.detail?.tier; if (!e.detail?.fresh && !e.detail?.levelUp) { buzz(8); return; } buzz(t === 'legendary' || t === 'epic' ? [20, 40, 20] : t === 'rare' ? 28 : 16); });
function buzz(p) { if (!readPref('haptics', true)) return; haptic(Array.isArray(p) ? 'success' : p >= 25 ? 'heavy' : p >= 14 ? 'medium' : p <= 8 ? 'select' : 'light'); }
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
  $('sky-limit-info').textContent = state.limit ? skyLimitText(state.limit, state.frame?.sunEl ?? -90) : '';
  const on = [...document.querySelectorAll('[data-hl]')].filter((c) => c.checked).map((c) => HL_NAMES[c.dataset.hl]);
  $('set-hl-val').textContent = on.length ? (on.length > 3 ? `${on.slice(0, 3).join(', ')} +${on.length - 3}` : on.join(', ')) : 'None';
  $('chk-sound').checked = soundOn();
  const n = state.sightings.filter((x) => !x.sim).length;
  $('set-data-note').textContent = `${n} sighting${n === 1 ? '' : 's'}, on this phone only`;
  $('set-version').textContent = `Space Collector v${VERSION}`;
  applyDevMode();
}
$('set-sky-range').addEventListener('input', (e) => { const m = $('sky-range'); m.value = e.target.value; m.dispatchEvent(new Event('input', { bubbles: true })); renderSettings(); });
$('set-sky-range').addEventListener('change', (e) => { const m = $('sky-range'); m.value = e.target.value; m.dispatchEvent(new Event('change', { bubbles: true })); });
const sheetTimers = new Map();
const openSheet = (id) => { clearTimeout(sheetTimers.get(id)); $(id).hidden = false; requestAnimationFrame(() => $(id).classList.add('in')); };
const closeSheet = (el) => { el.classList.remove('in'); clearTimeout(sheetTimers.get(el.id)); sheetTimers.set(el.id, setTimeout(() => { if (!el.classList.contains('in')) el.hidden = true; }, 260)); renderSettings(); };
$('set-loc-open').addEventListener('click', () => openSheet('set-loc-sheet'));
// ---------- account (2026-10-10, js/account.js) ----------
// The emailed link can't open this copy of the app: the iPhone Home Screen web app, or the native app (2026-10-11).
const standaloneIOS = () => isNative() || ((navigator.standalone === true || matchMedia('(display-mode: standalone)').matches) && /iP(hone|ad|od)/.test(navigator.userAgent));
function renderAccount(extra = {}) {
  const a = account(), ago = (t) => { if (!t) return 'not yet'; const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : new Date(t).toLocaleDateString(); };
  const n = state.sightings.filter((s) => !s.sim).length;
  $('set-acct-name').textContent = a ? (a.name || a.email || 'Signed in') : 'Back up your collection';
  $('set-acct-note').textContent = a ? (a.syncedAt ? `Backed up ${ago(a.syncedAt)}` : 'Backing up…') : 'Sign in to keep your cards safe and on every device';
  $('acct-out').hidden = !!a; $('acct-in').hidden = !a;
  if (a) { $('acct-who').textContent = a.name || a.email || 'Signed in'; $('acct-status').textContent = `${a.email ?? ''}${a.email ? ' · ' : ''}${n.toLocaleString()} sighting${n === 1 ? '' : 's'} · ${a.syncedAt ? `backed up ${ago(a.syncedAt)}` : 'backing up…'}`; }
  $('acct-paste-form').hidden = !standaloneIOS() || !localStorage.getItem('emailForSignIn');
  if (extra.msg != null) $('acct-msg').textContent = extra.msg;
}
onAccount(async (a) => {
  if (a.changed) { await loadSightings(); collectionStale(); refreshOwned(); } // another device added or deleted sightings
  renderAccount();
});
$('set-acct-open').addEventListener('click', () => { renderAccount({ msg: '' }); openSheet('set-acct-sheet'); });
const acctBusy = (on) => document.querySelectorAll('#set-acct-sheet button').forEach((b) => { b.disabled = on; });
$('acct-google').addEventListener('click', async () => {
  acctBusy(true); renderAccount({ msg: '' });
  try { await signInGoogle(); renderAccount({ msg: '' }); toast('Signed in. Your collection is backing up.', 3000); }
  catch (e) { console.error('google sign-in failed', e?.code, e?.message); renderAccount({ msg: signInError(e) }); }
  acctBusy(false);
});
$('acct-email-form').addEventListener('submit', async (e) => {
  e.preventDefault(); acctBusy(true);
  try { await sendEmailLink($('acct-email').value.trim()); renderAccount({ msg: `Check ${$('acct-email').value.trim()} for a sign-in link.${standaloneIOS() ? ' If it opens in Safari, copy the address and paste it below.' : ''}` }); }
  catch (er) { renderAccount({ msg: `Couldn't send the link (${er?.code ?? er?.message ?? 'error'}).` }); }
  acctBusy(false);
});
$('acct-paste-form').addEventListener('submit', async (e) => {
  e.preventDefault(); acctBusy(true);
  try { await completeEmailLink($('acct-paste').value.trim()); renderAccount({ msg: '' }); toast('Signed in. Your collection is backing up.', 3000); }
  catch (er) { renderAccount({ msg: er?.message === 'need-email' ? 'Enter your email above first, then paste the link.' : `That link didn't work (${er?.code ?? er?.message}).` }); }
  acctBusy(false);
});
$('acct-delete').addEventListener('click', () => { $('acct-confirm').hidden = false; $('acct-delete').hidden = true; });
$('acct-delete-no').addEventListener('click', () => { $('acct-confirm').hidden = true; $('acct-delete').hidden = false; });
$('acct-delete-yes').addEventListener('click', async () => {
  acctBusy(true);
  try { await deleteAccount(() => (APPLE_SIGNIN && account()?.provider === 'apple' ? signInApple() : signInGoogle())); renderAccount({ msg: '' }); $('acct-confirm').hidden = true; $('acct-delete').hidden = false; toast('Account deleted. Your cards are still on this phone.', 3500); }
  catch (e) { console.error('delete account failed', e?.code, e?.message); renderAccount({ msg: /network|offline/i.test(`${e?.code}${e?.message}`) ? 'Couldn\'t reach the server. Check your connection and try again.' : `Couldn't delete the account. Sign out, sign in again, then try once more. (${e?.code ?? e?.message ?? 'error'})` }); }
  acctBusy(false);
});
$('acct-signout').addEventListener('click', async () => { acctBusy(true); try { await signOut(); } catch {} renderAccount({ msg: '' }); acctBusy(false); toast('Signed out. Your collection stays on this phone.', 2600); });
// ---------- sign-in moments (2026-10-11, design/auth-moments.html) ----------
// One sheet (#auth-sheet), worded for what opened it: the welcome card's "Already collecting?" link (restore), the
// first card's reveal closing (first), a first night of 3+ cards (night), the Collection's "not backed up" line.
// Every one but Plus has "Not now". The Apple button waits for Sign in with Apple (paid developer account).
const APPLE_SIGNIN = isNative() && /iP(hone|ad|od)|Mac/.test(navigator.userAgent); // the native iPhone app (2026-10-12: paid developer account, App ID capability, Firebase provider)
const realSightings = () => state.sightings.filter((s) => !s.sim);
const cardCount = () => new Set(realSightings().map((s) => s.cardKey)).size;
const AUTH_COPY = {
  restore: () => ({ eyebrow: 'Welcome back', title: 'Pick up where you left off', body: 'Sign in with the account you used before. Your cards, patches and rank come back, and the tour is skipped.', later: 'Back' }),
  first: () => ({ eyebrow: `${cardCount()} cards so far`, title: 'Keep your cards safe', body: 'Right now your collection lives only on this phone. Sign in and it\'s backed up, and it follows you to any phone.', later: 'Not now' }),
  night: () => ({ eyebrow: `${cardCount()} cards and counting`, title: 'Keep your cards safe', body: 'Your collection lives only on this phone. Sign in and it\'s backed up, and it follows you to any phone.', later: 'Not now' }),
  collection: () => ({ eyebrow: `${cardCount()} card${cardCount() === 1 ? '' : 's'} · not backed up`, title: 'Keep your cards safe', body: 'Sign in and your collection is backed up, and it follows you to any phone.', later: 'Not now' }),
};
let authMode = null;
function authMsg(t) { $('auth-msg').textContent = t || ''; }
function openAuth(mode) {
  if (account()) return;
  authMode = mode; const c = AUTH_COPY[mode]();
  $('auth-eyebrow').textContent = c.eyebrow; $('auth-title').textContent = c.title; $('auth-body').textContent = c.body; $('auth-later').textContent = c.later;
  $('auth-apple').hidden = !APPLE_SIGNIN; $('auth-email-form').hidden = true; $('auth-email-open').hidden = false;
  $('auth-paste-form').hidden = !standaloneIOS() || !localStorage.getItem('emailForSignIn');
  $('auth-google').hidden = false; $('auth-next').hidden = true; authLater = null;
  authMsg(''); openSheet('auth-sheet');
}
const authBusy = (on) => document.querySelectorAll('#auth-sheet button').forEach((b) => { b.disabled = on; });
// Sign-in failures in plain words (2026-10-11, Sevaan: a raw error code, then a weak "nothing to restore" toast).
function signInError(e) {
  const code = e?.code ?? '', msg = e?.message ?? '';
  if (/popup-closed|cancelled-popup|cancel/i.test(code + msg)) return '';
  if (standaloneIOS() && !isNative()) return 'Google sign-in needs Safari here. Try the email link instead.';
  if (/No credentials available/i.test(msg)) return 'Add a Google account to this phone first (Settings → Accounts), or use the email link.';
  if (/network|offline|Failed to fetch|dynamically imported/i.test(code + msg)) return 'Couldn\'t reach Google. Check your connection and try again.';
  if (/popup-blocked/.test(code)) return 'The Google window was blocked. Allow pop-ups for this site, or use the email link.';
  if (/account-exists-with-different-credential/.test(code)) return 'That email already signs in another way. Use the email link instead.';
  if (/too-many-requests/.test(code)) return 'Too many tries. Wait a minute and try again.';
  return 'Couldn\'t sign in. Try again, or use the email link.'; // the code goes to the console, not the screen (writing room)
}
// The sheet's end states: "restored", "nothing on this account", or "couldn't reach the backup". Shown in the sheet
// itself, not a toast, so the answer stays in front of you until you choose what's next.
function authResult({ eyebrow, title, body, next, later, onNext, onLater }) {
  $('auth-eyebrow').textContent = eyebrow; $('auth-title').textContent = title; $('auth-body').textContent = body; authMsg('');
  for (const id of ['auth-apple', 'auth-google', 'auth-email-open', 'auth-email-form', 'auth-paste-form']) $(id).hidden = true;
  $('auth-next').hidden = false; $('auth-next').firstElementChild.textContent = next; $('auth-next').onclick = onNext;
  $('auth-later').textContent = later; authLater = onLater;
}
let authLater = null;
async function authDone() {
  renderAccount();
  if (authMode !== 'restore') { closeSheet($('auth-sheet')); toast('Signed in. Your collection is backing up.', 3000); return; }
  // Restore: pull the collection down, then skip the tour if there was anything to bring back.
  const who = account()?.email ?? 'This account';
  $('auth-title').textContent = 'Looking for your cards…'; $('auth-body').textContent = ''; authBusy(true);
  let failed = null;
  try { await syncNow(); } catch (e) { failed = e; console.error('restore sync failed', e); }
  authBusy(false);
  await loadSightings(); refreshOwned();
  const n = cardCount();
  if (n) {
    writePref('started', true); collectionStale(); closeSheet($('auth-sheet')); quickStart();
    toast(`Welcome back. ${n.toLocaleString()} card${n === 1 ? '' : 's'} restored.`, 3500); return;
  }
  const switchAccount = async () => { try { await signOut(); } catch {} renderAccount(); openAuth('restore'); };
  if (failed) authResult({ eyebrow: 'Signed in', title: 'Couldn\'t reach your backup', body: `You're signed in as ${who}, but your cards didn't come down (${failed?.code ?? failed?.message ?? 'error'}). Check your connection and try again.`, next: 'Try again', later: 'Use a different account', onNext: () => authDone(), onLater: switchAccount });
  else authResult({ eyebrow: who, title: 'No cards on this account yet', body: 'Nothing has been backed up with this account. If you collected with a different Google account or email, switch to it. Otherwise, start fresh and your cards will back up as you go.', next: 'Start collecting', later: 'Use a different account', onNext: () => closeSheet($('auth-sheet')), onLater: switchAccount });
}
$('auth-apple').addEventListener('click', async () => {
  authBusy(true); authMsg('');
  try { await signInApple(); } catch (e) { console.error('apple sign-in failed', e?.code, e?.message); authMsg(signInError(e)); authBusy(false); return; }
  authBusy(false); await authDone();
});
$('acct-apple').hidden = !APPLE_SIGNIN;
$('acct-apple').addEventListener('click', async () => {
  acctBusy(true); renderAccount({ msg: '' });
  try { await signInApple(); renderAccount({ msg: '' }); toast('Signed in. Your collection is backing up.', 3000); }
  catch (e) { console.error('apple sign-in failed', e?.code, e?.message); renderAccount({ msg: signInError(e) }); }
  acctBusy(false);
});
$('auth-google').addEventListener('click', async () => {
  authBusy(true); authMsg('');
  try { await signInGoogle(); } catch (e) { console.error('google sign-in failed', e?.code, e?.message); authMsg(signInError(e)); authBusy(false); return; }
  authBusy(false); await authDone();
});
$('auth-email-open').addEventListener('click', () => { $('auth-email-open').hidden = true; $('auth-email-form').hidden = false; $('auth-email').focus(); });
$('auth-email-form').addEventListener('submit', async (e) => {
  e.preventDefault(); authBusy(true);
  const email = $('auth-email').value.trim();
  try { await sendEmailLink(email); authMsg(`Check ${email} for a sign-in link.${standaloneIOS() ? ' If it opens in Safari, copy the address and paste it below.' : ''}`); $('auth-paste-form').hidden = !standaloneIOS(); }
  catch (er) { authMsg(`Couldn't send the link (${er?.code ?? er?.message ?? 'error'}).`); }
  authBusy(false);
});
$('auth-paste-form').addEventListener('submit', async (e) => {
  e.preventDefault(); authBusy(true);
  try { await completeEmailLink($('auth-paste').value.trim()); await authDone(); }
  catch (er) { authMsg(er?.message === 'need-email' ? 'Enter your email above first, then paste the link.' : `That link didn't work (${er?.code ?? er?.message}).`); }
  authBusy(false);
});
$('auth-later').addEventListener('click', () => { const f = authLater; authLater = null; f ? f() : closeSheet($('auth-sheet')); });
$('wc-signin').addEventListener('click', (e) => { e.stopPropagation(); openAuth('restore'); });
// The two asks: once after the first card, once more after a first night of 3+ cards, then never.
function maybeAskSignIn() {
  if (account() || !$('onboard').hidden || !$('reveal').hidden || activePanel || collectionOpen || !$('auth-sheet').hidden) return;
  let asked = 0; try { asked = Number(localStorage.getItem('authAsked') ?? 0); } catch {}
  const n = cardCount();
  const tonight = String(nightKey(now().getTime(), state.observer.lon ?? 0));
  const tonightCards = new Set(realSightings().filter((s) => String(nightKey(s.time, s.lon ?? 0)) === tonight).map((s) => s.cardKey)).size;
  const mode = asked === 0 && n >= 3 ? 'first' : asked === 1 && tonightCards >= 3 ? 'night' : null;
  if (!mode) return;
  try { localStorage.setItem('authAsked', String(asked + 1)); } catch {}
  openAuth(mode);
}
$('set-hl-open').addEventListener('click', () => openSheet('set-hl-sheet'));
document.querySelectorAll('.set-sheet').forEach((sh) => sh.addEventListener('click', (e) => { if (e.target === sh || e.target.closest('[data-sheet-close]')) closeSheet(sh); }));
// Swipe a sheet down to close it (2026-10-11, QA: every sheet has a grab handle that did nothing). Starts only on the
// handle or the sheet's empty space, never on a field or button, and only when the sheet isn't scrolled.
document.querySelectorAll('.set-sheet-card').forEach((card) => {
  let y0 = null, dy = 0, t0 = 0;
  card.addEventListener('pointerdown', (e) => { if (e.target.closest('input, button, select, textarea, a, label') || card.scrollTop > 0) return; y0 = e.clientY; dy = 0; t0 = performance.now(); card.style.transition = 'none'; });
  card.addEventListener('pointermove', (e) => { if (y0 == null) return; dy = Math.max(0, e.clientY - y0); card.style.transform = `translateY(${dy}px)`; });
  const end = () => { if (y0 == null) return; y0 = null; card.style.transition = ''; const fast = dy / Math.max(1, performance.now() - t0) > 0.5;
    card.style.transform = ''; if (dy > 110 || (fast && dy > 40)) closeSheet(card.closest('.set-sheet')); };
  card.addEventListener('pointerup', end); card.addEventListener('pointercancel', end);
});
$('retry-location').addEventListener('click', () => closeSheet($('set-loc-sheet')));
$('location-form').addEventListener('submit', () => setTimeout(() => closeSheet($('set-loc-sheet')), 50));
document.querySelectorAll('[data-hl]').forEach((c) => c.addEventListener('change', renderSettings));
$('chk-sound').addEventListener('change', (e) => writePref('sound', e.target.checked));
$('chk-music').checked = musicOn();
$('rng-sfx').value = Math.round(sfxVolume() * 100);
$('rng-music').value = Math.round(musicVolume() * 100);
$('rng-sfx').addEventListener('change', (e) => { try { localStorage.setItem('sfxVol', String(e.target.value / 100)); } catch {} sfx('collect'); }); // play a sample at the new level
$('rng-music').addEventListener('input', (e) => setMusicVolume(e.target.value / 100));
$('chk-music').addEventListener('change', (e) => setMusic(e.target.checked));
// The music starts with the first tap anywhere (browsers need one before any sound).
document.addEventListener('pointerdown', () => startMusic(), { once: true, capture: true });
// The native apps may play sound without a tap, so the music starts as the app opens (2026-10-11, Sevaan), a beat
// after boot so building the audio doesn't land on the first frames. Browsers still wait for the first tap.
if (isNative()) setTimeout(() => { startMusic(); loadSfx(); }, 1200);
// ---------- native app: Back button, status bar, lifecycle (2026-10-11, QA) ----------
// Android Back closes the top layer, one at a time, and only leaves the app (to the background, not killed) from the
// bare sky. The Collection runs in a frame, so it's asked to close its own viewer/patch first (sc:back).
function handleBack() {
  const sheet = [...document.querySelectorAll('.set-sheet')].find((s) => !s.hidden && s.classList.contains('in'));
  if (sheet) { closeSheet(sheet); return; }
  if (!$('recap').hidden) { $('recap').querySelector('.rc-go')?.click(); return; }
  if (!$('reveal').hidden) { $('reveal').querySelector('[data-close="reveal"]')?.click(); return; }
  if (activePanel) { closePanel(); return; }
  if (collectionOpen) { colFrame.contentWindow?.postMessage({ sc: 'back' }, location.origin); return; }
  if (state.timeOffsetMs) { backToNow(); return; }
  if (!$('start').hidden && $('start').classList.contains('wc-open')) { return; }
  plugin('App')?.minimizeApp().catch(() => {});
}
if (isNative()) {
  nativeChrome();
  onNative('App', 'backButton', handleBack);
  // Pause the audio when the app goes to the background (QA: the AudioContext kept running and drained battery).
  onNative('App', 'appStateChange', ({ isActive }) => { const c = audioCtx(); if (!c) return; if (isActive) c.resume().catch(() => {}); else c.suspend().catch(() => {}); });
}
$('set-data').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ app: 'Space Collector', version: VERSION, exported: new Date().toISOString(), sightings: state.sightings.filter((x) => !x.sim) }, null, 2)], { type: 'application/json' });
  saveFile(blob, `Space Collector - Sightings ${new Date().toISOString().slice(0, 10)}.json`, { title: 'Your Space Collector sightings' }).then((ok) => { if (!ok) toast('Couldn\'t export here.', 2500); });
});
// Testing tools: tap the version five times.
// (2026-10-08: testing tools now sit at the top of Settings, always shown.)

// ---------- countdown to dark (2026-10-08) ----------
// By day, with nothing in the circle: "3 h 57 min until dark" under the circle, and when it gets dark.
let udLast = '';
// The pass marker in the circle (by day) gets a Remind me pill, 10 minutes before it rises.
let ghLast = '';
function ghRemind() {
  const b = $('gh-remind'), p = sky.ghostHitId != null ? state.dayPicks?.find((x) => x.obj.id === sky.ghostHitId) : null;
  if (!p) { if (!b.hidden) { b.hidden = true; ghLast = ''; } return; }
  const key = `${p.obj.id}@${p.start}`, on = reminded.has(key), at = fmtTime(p.start - 10 * 60e3), txt = on ? `Reminder at ${at}` : `Remind me at ${at}`;
  if (txt !== ghLast) { ghLast = txt; $('gh-remind-t').textContent = txt; b.classList.toggle('on', on); b.dataset.key = key; }
  const rc = sky.ring ?? { y: sky.cy, r: sky.reticlePx }; b.style.top = `${rc.y + rc.r + 54}px`;
  b.hidden = false;
}
$('gh-remind').addEventListener('click', async () => {
  const b = $('gh-remind'), key = b.dataset.key, p = state.dayPicks?.find((x) => `${x.obj.id}@${x.start}` === key); if (!p) return;
  buzz(8);
  if (reminded.has(key)) { reminded.delete(key); cancelNotify(remindIds.get(key)?.id); remindIds.delete(key); saveRems(); toast(`Reminder off for ${label(p.obj)}.`, 2500); }
  else if (await remindPass(p, key)) reminded.add(key);
  ghLast = ''; ghRemind();
});
function untilDark(target) {
  ghRemind();
  const el = $('until-dark'), T = state.tonight, now0 = now().getTime();
  const show = document.body.classList.contains('day') && (state.basis?.back?.[2] ?? 1) > 0 && !target && !state.planeHit && T?.dusk && T.dusk > now0 && $('discover').hidden && !sky.dayHitId && !sky.ghostHitId;
  if (!show) { if (!el.hidden) el.hidden = true; return; }
  // With seconds (2026-10-11, Sevaan). Only a new minute rolls; the seconds just tick.
  const secs = Math.max(0, Math.floor((T.dusk - now0) / 1000)), h = Math.floor(secs / 3600), m = Math.floor(secs / 60) % 60, sc = secs % 60;
  const txt = `${h ? `${h} h ` : ''}${h || m ? `${m} min ` : ''}${sc} s until dark`;
  if (txt !== udLast) { const roll = !!udLast && txt.replace(/\d+ s/, '') !== udLast.replace(/\d+ s/, ''); udLast = txt; $('ud-time').textContent = txt; if (roll) { $('ud-time').classList.remove('roll'); void $('ud-time').offsetWidth; $('ud-time').classList.add('roll'); } $('ud-at').textContent = `Around ${fmtTime(T.dusk)}`; }
  const rc = sky.ring ?? { y: sky.cy, r: sky.reticlePx }; el.style.top = `${rc.y + rc.r + 26}px`;
  el.hidden = false;
}

// Countdown → reminder (2026-10-08, design/until-dark.html). A native notification (no calendar files since 2026-10-12).
// Remembered for tonight in localStorage 'udRemind' = { t, label }.
function udReminder() { try { const r = JSON.parse(localStorage.getItem('udRemind')); return r && r.t > Date.now() - 3600e3 ? r : null; } catch { return null; } }
let udPick = 0, udChoices = [];
function udOptions() {
  const T = state.tonight, t0 = now().getTime(), out = [];
  const eve = eveningEnd(T);
  const best = T ? (tonightPasses(T, t0).find((p) => p.fresh && p.start > T.dusk && p.start <= eve) ?? tonightPasses(T, t0).find((p) => p.start > T.dusk && p.start <= eve)) : null;
  if (best) out.push({ t: best.start - 10 * 60e3, icon: '✦', label: `10 min before the best pass · ${label(best.obj)} at ${fmtTime(best.start)}`, msg: `${label(best.obj)} passes at ${fmtTime(best.start)}, ${best.peakEl}° up in the ${compassPoint(best.peakAz)}. Open Space Collector to line it up.` });
  if (T?.dusk) out.push({ t: T.dusk, icon: '☾', label: 'When it gets dark', msg: "It's dark enough to start. Open Space Collector and look up." });
  const pk = T ? T.curve.filter(([t]) => t >= T.dusk && t <= eve).reduce((a, c) => (c[1] > a[1] ? c : a), [0, 0]) : [0, 0];
  if (pk[1]) out.push({ t: pk[0], icon: '★', label: `The busiest moment · ${pk[1]} objects up at once`, msg: `${pk[1]} satellites are up right now. Open Space Collector.` });
  return out.sort((a, b) => a.t - b.t);
}
function udRender() {
  const r = udReminder(), b = $('ud-bell');
  b.classList.toggle('on', !!r); b.innerHTML = r ? `<span class="ico" data-ico="bell" aria-hidden="true"></span> ${fmtTime(r.t)} · set` : `<span class="ico" data-ico="bell" aria-hidden="true"></span> Remind me`;
}
$('ud-bell').addEventListener('click', () => {
  udChoices = udOptions(); if (!udChoices.length) return;
  const r = udReminder(); udPick = Math.max(0, r ? udChoices.findIndex((c) => Math.abs(c.t - r.t) < 60e3) : 0);
  const draw = () => { $('ud-opts').innerHTML = udChoices.map((c, i) => `<button type="button" class="ud-opt${i === udPick ? ' sel' : ''}" data-i="${i}"><i><span class="ico" data-ico="${({ '✦': 'ring', '☾': 'moon', '★': 'stars' })[c.icon] ?? 'bell'}" aria-hidden="true"></span></i><span><b>${escapeHtml(fmtTime(c.t))}</b><small>${escapeHtml(c.label)}</small></span>${i === udPick ? '<em>✓</em>' : ''}</button>`).join(''); };
  draw(); $('ud-opts').onclick = (e) => { const o = e.target.closest('.ud-opt'); if (o) { udPick = Number(o.dataset.i); draw(); } };
  $('ud-cancel').hidden = !r; openSheet('ud-sheet');
});
$('ud-set').addEventListener('click', async () => {
  const c = udChoices[udPick]; if (!c) return;
  const r = await setReminder({ at: c.t, title: 'Look up! It\'s dark enough.', body: c.msg, key: 'until-dark' });
  if (r !== 'on') { // say why on the button itself: a toast would sit behind the sheet (2026-10-13, Sevaan: "does nothing")
    if (r === 'limit') return; // the Plus sheet is explaining
    const b = $('ud-set').firstElementChild, was = b.textContent;
    b.textContent = r === 'app-only' ? 'Reminders work in the app' : r === 'denied' ? 'Notifications are off in Settings' : "Couldn't set a reminder";
    setTimeout(() => { b.textContent = was; }, 3500); return; }
  try { localStorage.setItem('udRemind', JSON.stringify({ t: c.t, label: c.label })); } catch {}
  closeSheet($('ud-sheet')); udRender(); const bl = $('ud-bell'); bl.classList.remove('ring'); void bl.offsetWidth; bl.classList.add('ring'); buzz(15);
  ticket({ kind: 'mission', eyebrow: 'REMINDER SET', line: `We'll nudge you at ${fmtTime(c.t)}${c.icon === '✦' ? `, before ${c.label.split(' · ')[1]}` : ''}.`, ms: 4000 });
});
$('ud-cancel').addEventListener('click', () => { try { localStorage.removeItem('udRemind'); } catch {} closeSheet($('ud-sheet')); udRender(); cancelNotify(remindIds.get('until-dark')?.id); remindIds.delete('until-dark'); saveRems(); toast('Reminder removed.', 2500); });
document.getElementById('ud-sheet').addEventListener('click', (e) => { if (e.target.id === 'ud-sheet') closeSheet(e.currentTarget); });
udRender();

// ---------- more secrets (js/secrets.js, 2026-10-08) ----------
const secretFound = Secrets.found();
let secretHold = {}, secretTap = null;
// One deep-space secret a session (2026-10-13, Sevaan: New Horizons, the Wow! signal and Pioneer 11 sit close together
// in Sagittarius, so you found them all at once). After one, the others stay hidden until the app is opened again.
const DEEP_IDS = new Set(Secrets.DEEP.map((d) => d[0]).concat('voyager')); let deepThisSession = false;
function earnSecret(id) {
  if (secretFound[id]) return; secretFound[id] = Date.now(); if (DEEP_IDS.has(id)) deepThisSession = true; Secrets.markFound(id); buzz([20, 40, 20]); sfx('secret');
  earnPatch(Secrets.SECRET_PATCHES[id]);
}
function secretsState(t, basis, target) {
  const out = [], nowMs = now().getTime(), night = (state.frame?.sunEl ?? 0) < -6, inC = (enu, slack = 1) => (!target || target.obj?.natural === 'star') && dot(enu, basis.back) > Math.cos((sky.reticleDeg + slack) * RAD); // a background star doesn't block a secret (2026-10-09)
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
    const v = toEnu(starVector(Secrets.VOYAGER.ra, Secrets.VOYAGER.dec)); if (v[2] > 0.05 && (!deepThisSession || secretFound.voyager)) hold('voyager', v, 'The Golden Record', 'Voyager 1 · 24 billion km', '#e2b53c');
    for (const [id, ra, dec, title, sub, color] of Secrets.DEEP) { if (deepThisSession && !secretFound[id]) continue; const e = toEnu(starVector(ra, dec)); if (e[2] > 0.05) hold(id, e, title, sub, color); }
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
  state.secretInCircle = out.some((x) => x.inCircle && !x.done); // read by the target pick next frame
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
document.addEventListener('change', (e) => { if (e.target.matches?.('input[type=checkbox]')) { buzz(8); sfx('toggle', { gain: 0.8 }); } });
$('nav-collection').addEventListener('click', () => buzz(8)); // no sound here (2026-10-11, Sevaan)

// "Show me": an orange target flies from the row's icon to the circle as the panel slides away (2026-10-08 polish).
function flyToCircle(fromEl) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !fromEl) return;
  const a = fromEl.getBoundingClientRect(), rc = sky.ring ?? { x: sky.cx, y: sky.cy, r: sky.reticlePx };
  const dot = document.createElement('div'); dot.className = 'fly-dot'; document.body.append(dot);
  const x0 = a.left + a.width / 2, y0 = a.top + a.height / 2;
  dot.animate([{ transform: `translate(${x0}px, ${y0}px) scale(1)`, opacity: 1 }, { transform: `translate(${(x0 + rc.x) / 2}px, ${Math.min(y0, rc.y) - 60}px) scale(1.4)`, opacity: 1, offset: .5 }, { transform: `translate(${rc.x}px, ${rc.y}px) scale(${(rc.r * 2) / 22})`, opacity: 0 }], { duration: 620, easing: 'cubic-bezier(.5,0,.3,1)' }).onfinish = () => dot.remove();
}

// Offline caching (sw.js, 2026-10-08). Inside the app's Collection layer the parent page has already registered it.
if ('serviceWorker' in navigator && window.parent === window && !isNative()) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));

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
