import { pullToClose } from './pull-close.js?v=0.1.1197';
import { TESTER } from './build-flavor.js?v=0.1.1197';
import { loadComets, comets, cometAt, NAKED_EYE } from './comets.js?v=0.1.1197';
import * as Secrets from './secrets.js?v=0.1.1197';
import { STORY_BY_SECRET } from './stories.js?v=0.1.1197';
import { cloudsHtml, rainHtml } from './weather-art.js?v=0.1.1197';
import * as Ufo from './ufo.js?v=0.1.1197';
import * as Fossil from './fossil.js?v=0.1.1197';
import { patchHtml, patchSvg } from './patches.js?v=0.1.1197';
import { setSwitch, SLIDE_MS } from './switcher.js?v=0.1.1197';
import { toast, ticket, dropToast, toastPending, onTicketShown, iconSvg } from './toast.js?v=0.1.1197';
import { VERSION } from './version.js?v=0.1.1197';
import { loadCatalog, frame, look, track, motion, compassPoint, enuFromAzEl, DARK_SUN_ELEVATION, SkyModel, BelowModel, overEarth, RisingSoon, setBinocularMode, setSkyLimit, toWorker } from './orbit.js?v=0.1.1197';
import { placeName } from './geo.js?v=0.1.1197';
import { skyLimit, SKIES, DEFAULT_SKY, SB_MIN, SB_MAX, SLIDER_MAX, sbOfSky, skyNameFor } from './sky-limit.js?v=0.1.1197';
import { conArt } from './con-art.js?v=0.1.1197';
import { fetchWeather, tonightSky, skyClearAt, goodSkyAt } from './weather.js?v=0.1.1197';
import { CON_FIGURES } from './con-figures.js?v=0.1.1197';
import { loadConstellations, CON_STARS, CON_BY_ID, conProgress, starDistance } from './constellations.js?v=0.1.1197';
import { shinyFor, SHINY } from './shiny.js?v=0.1.1197';
import { progress as progressOf, missionsFor, readDeals, readWeekThemes, WEEK_THEMES, countryOf, weekStartOf, weekThemeFor, xpCarry } from './progress.js?v=0.1.1197';
import { eventOf, activeEvent, nextEvent, activeShower, nextShower, eventLine } from './events.js?v=0.1.1197';
import { localText } from './localize.js?v=0.1.1197';
import { searchCities } from './cities.js?v=0.1.1197';
import { catalogUrl, refreshCatalog, dropCatalog } from './fresh-data.js?v=0.1.1197';
import { conList } from './constellations.js?v=0.1.1197';
import { startSensors, trySensorsQuietly, hasLiveSensors, trueBasis, basisFromAzEl, rotateAz, pointing, nudgeHeading, getNudge, lockHeading, setCompassPlace, getDeclination, hasSensorView, resumeSensors, needsPermission } from './sensors.js?v=0.1.1197';
import { SkyView, shortName, stripLandscape } from './sky.js?v=0.1.1197';
import { loadSky, eqToEnu, solarSystem, milkyWayModel, galAxes, roadster, starVector } from './celestial.js?v=0.1.1197';
import { isPlus, setPlusForTesting, onPlus, PLUS_PRICES, initStore, storePlans, buyPlus, restorePlus, rcTestStore, storeOpen } from './plus.js?v=0.1.1197';
import { isNative, getPosition, saveFile, notifyAt, cancelNotify, haptic, onNative, nativeChrome, plugin } from './native.js?v=0.1.1197';
import { initBackup, onBackupChange, backupSoon, clearBackup, backupStatus } from './cloud-backup.js?v=0.1.1197';
import { addSighting, allSightings, deleteSighting } from './store.js?v=0.1.1197';
import { cardArt } from './art.js?v=0.1.1197';
import { renderCard, miniCard, cardLevel, artImage, lockedArt, attachTilt, attachGyro, throwOff, attachFlip, turnCard, phasePath } from './card.js?v=0.1.1197';
import { applyBack, CARD_BACKS, backUnlocked, chosenBack, chooseBack, backEarned, showBackNext } from './card-backs.js?v=0.1.1197';
import { sfx, loadSfx, sfxVolume } from './sfx.js?v=0.1.1197';
import { audioCtx } from './audio-ctx.js?v=0.1.1197';
import { musicOn, startMusic, setMusic, duckMusic, musicVolume, setMusicVolume, musicAway } from './music.js?v=0.1.1197';
import { onRevealNews, playReveal, playView, primeReveal, stopReveal, onRevealDismiss, onRevealSwipeIntoBinder, teachRoom } from './reveal.js?v=0.1.1197';
import { buildCards, cardKeyFor, stampKeyFor, normalizeSighting, stampsIn, fleetLevel, moonPhaseOf, moonPhaseAt, MOON_PHASES } from './card-model.js?v=0.1.1197';
import { collectedDuringPass, collectedTonight, canCapture, nightsIn, nightKey } from './observation.js?v=0.1.1197';
import { naturalTargets, SOLAR_SYSTEM, DEEP_SKY, NATURAL, NATURAL_BY_KEY } from './natural.js?v=0.1.1197';
import { placeFromTimeZone } from './tz-places.js?v=0.1.1197';
import { TIER_INFO } from './rarity.js?v=0.1.1197';
import { SETS, albumList } from './sets.js?v=0.1.1197';
import { TYPE_LABEL, ownerName, orbitStats } from './facts.js?v=0.1.1197';
import { pushConfigured, pushOn, enablePush, disablePush, schedulePush, prefetchKey } from './pass-alerts.js?v=0.1.1197';
import { note, send as sendNotes, noteError, daysSinceInstall } from './field-notes.js?v=0.1.1197';
import { shareCardEl } from './share-card.js?v=0.1.1197';
import { loadLore, titleFor, factFor, richText } from './lore.js?v=0.1.1197';
import { PlaneTracker, planesAvailable, aircraftName, isHelicopter, planePath } from './planes.js?v=0.1.1197';
import { addStarfield } from './starfield.js?v=0.1.1197';

const $ = (id) => document.getElementById(id);
const RAD = Math.PI / 180;
// No location yet: a city in the phone’s time zone (js/tz-places.js), else Peterborough (2026-10-13).
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
  showShadow: readPref('shadow', true), // Earth’s shadow at dusk and dawn (2026-10-14)
  showMilky: readPref('milky', true), showPlanes: readPref('planes', true), saver: readPref('saver', false), // Settings additions (2026-10-21, Sevaan)
  daySats: readPref('daySats', false), // satellites hidden by daylight; off by default (2026-10-12, Sevaan)
  night: readPref('night', false),
  sky: null,       // stars/constellations from data/sky.json (equatorial vectors)
  skyEnu: null,    // same, rotated into the local sky, refreshed every second
  milkyEq: milkyWayModel(),
  milkyEnu: null,
  bodies: [],      // Sun, Moon, planets in the local sky
  captureAny: false,
  model: null,     // SkyModel: tracks what’s above the horizon
  items: [],       // latest interpolated positions: [{ obj, look }]
  binoculars: false, // binocular mode is gone: the sky slider carries on into binoculars past Dark site (2026-10-16, Sevaan)
  snap: readPref('snap', false),    // the targeting circle jumps onto a locked-on object
  lightSky: SKIES[readText('sky', DEFAULT_SKY)] ? readText('sky', DEFAULT_SKY) : DEFAULT_SKY, // light pollution where you are (old setting)
  skySb: null, // the sky slider: your sky’s own darkness in mag/arcsec² (set below from storage or the old setting)
  trails: new Map(),
  sticky: new Map(), // candidate id -> last time it was in the reticle
  candidates: [],
  targetId: null,
  smooth: null,
  sightings: [],
  familyCounts: new Map(), // card key -> number of satellites in that launch
  planes: new PlaneTracker(), // live aircraft (js/planes.js), for "Just a plane"
  planeItems: null,
  planeHit: null,  // { hex, at }: the plane in the circle, kept briefly so it doesn’t flicker
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
  if (o.natural) return o.type === 'sun' ? 'sun' : (o.type === 'planet' || o.type === 'moon' || o.type === 'earth') ? 'planet' : 'star';
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
  if (saved?.manual && !gps) { state.observer = { lat: saved.lat, lon: saved.lon, label: 'Chosen location', place: saved.place ?? '' }; state.locationStatus = 'manual'; renderLocation(); return true; }
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
    // A failed update keeps a real earlier fix and says so (Android playtest 2026-10-20: "Couldn't find you" while it was
    // still using the saved spot). state.locationError says why: denied / off (the phone's location switch) / timeout.
    state.locationError = error?.code === 1 ? 'denied' : error?.code === 3 ? 'off' : 'timeout';
    const kept = saved && !saved.manual && saved.lat != null && Math.abs(saved.lat - state.observer.lat) < 1e-6;
    state.locationStatus = error?.code === 1 ? 'denied' : kept ? 'stale' : 'unavailable'; if (error?.code === 1) buzz('warning'); renderLocation(); return false;
  }
}
var exampleWarned = false; // var: renderLocation can run before this line during start-up
function warnExample() {
  return; // no "Example location" notice (2026-10-18, Sevaan: remove it); Settings → location still says which place it is
  if (exampleWarned || !['denied', 'unavailable', 'example'].includes(state.locationStatus) || !/^Example/.test(state.observer.label ?? '')) return;
  let busy = true; try { busy = !$('onboard').hidden || !!activePanel; } catch {} // (activePanel isn’t declared yet during start-up)
  if (busy) { setTimeout(warnExample, 2000); return; } // after the tour and its Tonight page, on the sky
  exampleWarned = true;
  ticket({ kind: 'info', id: 'example-loc', sticky: true, icon: 'pin', eyebrow: 'EXAMPLE LOCATION', line: `Sky over ${state.observer.label.replace(/^Example:\s*/, '')}`, go: 'Set yours', action: () => { openDebug(); openSheet('set-loc-sheet'); } });
}
function renderLocation() {
  const labels = { waiting: 'Finding your location…', ready: 'Current location', manual: 'Chosen location', denied: 'Location denied', unavailable: 'Location unavailable', example: state.observer.label ?? 'Example location', saved: 'Saved location · unverified', stale: 'Location needs refreshing' };
  const label = labels[state.locationStatus] ?? 'Location needs checking';
  $('location-note').textContent = `${label}. Sky shown for ${state.observer.lat.toFixed(2)}°, ${state.observer.lon.toFixed(2)}°. ${['ready', 'manual'].includes(state.locationStatus) ? '' : 'Use your location or choose coordinates for real observing.'}`;
  $('latitude').value = state.observer.lat; $('longitude').value = state.observer.lon;
  try { const f = frame(now(), state.observer); state.frame = f; updateSkyLimit(f); } catch {} /* the Settings sky readout follows a new place at once (iOS playtest 2026-10-19) */
  // Say so when the sky is someone else’s (playtest room 2026-10-11: with location denied it quietly showed Peterborough).
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

// Each toast’s sound as it appears: missions and sky challenges, rank ups, constellation/album completions, or the
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
  if (document.visibilityState === 'visible' && state.started) { keepAwake(); checkForUpdate(); checkMotionBack();
    // Back after a while: you may have moved, so look again quietly (iOS playtest 2026-10-20). Only with location already allowed.
    if (['ready', 'stale'].includes(state.locationStatus) && Date.now() - (state.observer.fixedAt ?? 0) > 15 * 60e3) requestLocation(); }
});
// Coming back to the app (2026-10-15, Sevaan): iPhone stops sending motion until the screen is touched again, so the
// sky sits frozen. If motion was in use and hasn’t come back within a moment, the circle asks for a tap (#wake).
function checkMotionBack() {
  if (state.drag.on || state.needsMotionTap || !needsPermission()) return; // only iPhones stop motion while away; a still Android phone just goes quiet
  state.motionCheckUntil = performance.now() + 1600; // a tap meanwhile is a tap, not a switch to finger mode (bug hunt 2026-10-20)
  setTimeout(() => { if (!state.drag.on && !hasLiveSensors() && document.visibilityState === 'visible') { state.needsMotionTap = true; state.wakeCold = false; } }, 1500);
}
function syncWake() {
  const on = !!state.needsMotionTap && !document.body.classList.contains('ob-tour') && $('onboard').hidden && !activePanel;
  if (on && hasLiveSensors() && !state.drag.on) { state.needsMotionTap = false; } // it came back by itself
  const w = $('wake'), show = on && state.needsMotionTap; if (w.hidden === !show) return;
  if (show) { const sp = w.querySelector('span'); if (sp) sp.innerHTML = state.wakeCold ? 'Tap to turn on motion<small>The sky follows your phone</small>' : 'Tap to wake the sky<small>Motion pauses while you’re away</small>'; }
  w.hidden = !show; if (show) { w.style.top = `${uiCenterY}px`; w.style.setProperty('--r', `${sky.ring?.r ?? sky.reticlePx}px`); } // the ticket sits under the circle
}

// ---------- updates ----------

async function checkForUpdate() {
  try {
    const res = await fetch(`version.json?t=${Date.now()}`, { cache: 'no-store' });
    const { version } = await res.json();
    if (version && version !== VERSION) { state.updateReady = true; updateWhenQuiet(); }
  } catch {}
}

// A new version reloads by itself (2026-10-21, Sevaan: no "Update ready" pill), at a quiet moment: nothing in the
// circle, no catch, card, page, sheet or tour on screen. In the sky it comes back straight to the sky (?resume=1, no
// loader); before that (welcome card) it's a plain reload. Checked every 2 s until then.
let updateTimer = 0;
function updateWhenQuiet() {
  clearTimeout(updateTimer);
  const quiet = !document.hidden && !activePanel && !collectionOpen && $('reveal').hidden && $('onboard').hidden && !document.body.classList.contains('ob-tour')
    && !document.querySelector('.set-sheet.in') && !state.lockedOn && !state.captureBusy && !document.querySelector('.patch-coins');
  if (!quiet) { updateTimer = setTimeout(updateWhenQuiet, 2000); return; }
  if (state.started) { try { saveExploreState(); } catch {} location.replace(`${location.pathname}?resume=1`); } else location.reload();
}

// ---------- banner & toast ----------

let bannerAction = null;
let bannerKey = '';
// The standing message (new build, time travel, tap to line up, check heading) is a toast now (2026-10-07):
// it lives at the bottom of the toast stack and stays until its state clears; tap it to act.
// A gear for the update message; it turns slowly (css .banner__icon).
const GEAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M10.3 2.5h3.4l.5 2.6 1.6.7 2.2-1.5 2.4 2.4-1.5 2.2.7 1.6 2.6.5v3.4l-2.6.5-.7 1.6 1.5 2.2-2.4 2.4-2.2-1.5-1.6.7-.5 2.6h-3.4l-.5-2.6-1.6-.7-2.2 1.5-2.4-2.4 1.5-2.2-.7-1.6-2.6-.5v-3.4l2.6-.5.7-1.6-1.5-2.2 2.4-2.4 2.2 1.5 1.6-.7z"/><circle cx="12" cy="12" r="3.2"/></svg>';
// A new version: it stays until tapped (2026-10-18: the status check’s showBanner('') cleared it within a second).
function showBanner(text, action = null, { icon = '', sub = '', eyebrow = '' } = {}) {
  if (bannerKey === text) return;
  bannerKey = text;
  const el = $('banner');
  // Standing messages (update ready, time travel, check heading) go straight into the chip under the header on the right
  // (#toast-tray: icon + kind line ›; 2026-10-18, Sevaan: the full-width banner first, then the chip, was one step too
  // many). The same kind of message changing its words (time travel’s clock) just updates in place.
  let tray = document.getElementById('toast-tray');
  if (!tray) { tray = document.createElement('div'); tray.id = 'toast-tray'; document.body.append(tray); }
  const same = el.parentElement === tray && text && el.dataset.eyebrow === eyebrow && !el.hidden;
  if (el.parentElement !== tray) tray.prepend(el);
  el.dataset.eyebrow = eyebrow;
  el.setAttribute('aria-label', [eyebrow, text, sub].filter(Boolean).join('. '));
  el.className = `ticket ticket--info tone-info ticket--standing${action ? ' linked' : ''}${same ? ' in' : ''}`;
  el.innerHTML = text ? `<span class="tn-ic" aria-hidden="true">${iconSvg(icon || 'info')}</span><span class="ticket__body">${eyebrow ? `<span class="ticket__eyebrow">${escapeHtml(eyebrow)}</span>` : `<span class="ticket__eyebrow">${escapeHtml(text)}</span>`}<span class="ticket__line">${escapeHtml(text)}</span></span><span></span>` : '';
  bannerAction = action;
  if (!text) { el.classList.remove('in'); setTimeout(() => { if (!bannerKey) el.hidden = true; }, 320); return; }
  el.hidden = false;
  if (!same) requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('in')));
}
$('banner').addEventListener('click', () => bannerAction?.());

// ---------- toasts: one-line tickets (2026-10-05, design canvas "Toast C") ----------
// Kinds colour the left edge: mission (orange), xp (steel blue), event / achievement / rank (gold), info.
// They queue rather than stack: one at a time, oldest first, each ~3 s, slid in under the header.
// `toast(html, ms, href)` keeps the old callers working as plain info tickets.
// Constellation progress ("2 of 8 stars") keeps only the newest: catching stars one after another queued a run of them
// for different constellations (2026-10-20, Sevaan).
onRevealNews((n) => { if (n.id === 'con-progress') dropToast('con-progress'); ticket(n); });
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
// UX playtest 2026-10-21: the Moon read NEW to players who own it (it's tonight's phase that's new); heights in words.
function newWord(o) { return o?.type === 'moon' && state.sightings.some((x) => !x.sim && x.cardKey === 'moon') ? 'NEW PHASE' : 'NEW'; }
function heightWord(el) { return el >= 60 ? 'high' : el >= 30 ? 'halfway up' : 'low'; }
// " · in Capricornus" for a star, so an unfamiliar name has somewhere to live (2026-10-13 playtest: "Prima Giedi").
// " · last chance" for a falling satellite (js/last-chance.js), on the line over the circle.
const lcTag = (o) => (state.cardModels?.get(cardKeyFor(o))?.fallAt ? ' · last chance' : '') + (isNewFind(o) && isHeadliner(o) ? ' · headliner' : '');
const inCon = (o) => { if (o?.natural !== 'star') return ''; const c = o.constellation ?? CON_BY_ID.get(o.con)?.name; return c ? ` · ${c}` : ''; }; /* "Common · Perseus": "· in Perseus" ran out of room beside the distance (visual playtest 2026-10-25) */
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
    const when = obj.launch ? new Date(`${obj.launch}T12:00:00Z`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'an unknown date';
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

  // Trails (60 s back, 3 min ahead) for the visible objects nearest where you’re pointing.
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

// What you can see right now: your sky’s light pollution plus twilight and the Moon (js/sky-limit.js).
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
// The slider’s readout in plain words (2026-10-12: "magnitude" lost players, and at noon it claimed stars to 2.6).
// Stars above the horizon down to a limit: roughly half of 10^(0.5·m + 0.6) over the whole sky.
function skyLimitText(L, sunEl, why = '') {
  if (sunEl > -2) return 'Daylight: only the Sun, the Moon and Venus show until dusk.';
  if (sunEl > -6) return 'Twilight: just the brightest stars, planets and satellites so far.';
  const n = Math.round(0.5 * 10 ** (0.5 * L.stars + 0.6) / 50) * 50;
  return `Right now you could see about ${n.toLocaleString()} stars${L.boost > 0 ? ', and binoculars add fainter satellites, Uranus and Neptune' : ''}${why ? `; ${why} ${why.includes(' and ') ? 'hide' : 'hides'} the faintest` : ''}.`;
}
function refreshCelestial(d) {
  const toEnu = eqToEnu(d, state.observer);
  state.bodies = solarSystem(d, state.observer).map((b) => ({ ...b, enu: toEnu(b.v) }));
  const m = state.milkyEq;
  state.milkyEnu = {
    spine: m.spine.map((p) => ({ enu: toEnu(p.v), width: p.width, bright: p.bright })),
    // The hand-drawn grain, clouds and dust are only the fallback for the photo (js/milkyway-gl.js), so skip them once it’s in.
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
  for (const c of comets()) { const p = cometAt(c, d); if (p.mag <= NAKED_EYE) state.conEnu.push({ obj: Object.assign(c, { mag: p.mag, need: Math.max(2, p.mag + 1.2) }), enu: toEnu(starVector(p.ra, p.dec)) }); } // a comet’s light is spread out: it needs a sky about a magnitude darker than a star of the same brightness (astronomers, 2026-10-11)
  state.skyEnu = {
    stars: state.sky.stars.map((s) => ({ ...s, enu: toEnu(s.v) })),
    lines: state.sky.lines.map((seg) => seg.map(toEnu)),
    constellations: state.sky.constellations.map((c) => ({ ...c, enu: toEnu(c.v) })),
  };
}

// New cards up right now: satellites, planets, the Moon and deep sky you don’t have (one per card), not every star.
// Shared by the radar badge and the Now tab so they always agree.
function newUpCount() {
  const keys = new Set();
  for (const i of state.items) if (i.look.visible && isNewFind(i.obj)) keys.add(cardKeyFor(i.obj));
  for (const n of state.naturals ?? []) if (n.obj.key !== 'earth' && n.obj.natural !== 'star' && n.obj.type !== 'deepsky' && isNewFind(n.obj)) keys.add(cardKeyFor(n.obj));
  return keys.size;
}
function updateStatus(f) {
  if (state.locationStatus === 'ready' && Date.now() - state.observer.fixedAt >= 15 * 60 * 1000) { state.locationStatus = 'stale'; renderLocation(); }
  const visible = state.items.filter(a => a.look.visible).length;
  $('visible-count').textContent = visible; $('radar-up').hidden = !visible; // "0 up" under the compass read as an angle (playtest 2026-10-09): say "2 passing", and nothing when none are
  const fresh = newUpCount(); // the same count as the Now tab’s "Now · N new" (playtests 2026-10-17: badge 4, tab 10)
  $('new-count').textContent = fresh; $('radar-new').hidden = !fresh;
  if (!bannerKey.startsWith('New build')) {
    if (state.timeOffsetMs && $('peak-toggle').classList.contains('on')) showBanner(''); // the testing ⏱ button is the way back
    else if (state.timeOffsetMs) showBanner(`Sky at ${now().toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' })}`, backToNow, { icon: 'ff', eyebrow: 'Time travel', sub: 'Back to now ›' }); // one short line (2026-10-08)
    else if (state.needsMotionTap) showBanner(''); // the circle asks instead (#wake, design/tap-to-resume.html A)
    // (compass trouble is the figure-8 toast in checkCompass, not a standing message)
    else if (pointing.source === 'relative' && !calib) showBanner('Sky drifting?', openCalib, { icon: 'compass', eyebrow: 'Compass', sub: 'Line it up with something you can see ›' }); // phones with no compass reading drift (2026-10-22)
    else showBanner('');
  }
}

// Smooth the camera basis to take the jitter out of the sensors.
function smoothBasis(b) {
  if (!state.smooth) { state.smooth = { back: [...b.back], up: [...b.up] }; }
  // Time-based, so it feels the same at 30 fps (iPhone Low Power Mode) as at 60 (bug hunt 2026-10-20).
  const now = performance.now(), dt = Math.min(100, now - (state.smooth.at ?? now - 16.7)); state.smooth.at = now;
  const k = 1 - Math.pow(0.75, dt / 16.7), s = state.smooth;
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
// Which way you face, still defined when the phone points straight up or down (bug hunt 2026-10-20: near the zenith
// atan2 of the camera axis alone is noise, so the radar spun and "Turn left/right" flipped with hand shake).
// At the horizon it equals the camera's azimuth; overhead it is the way you were facing.
function headingOf(b) {
  const x = b.back[0] - b.up[0] * b.back[2], y = b.back[1] - b.up[1] * b.back[2];
  return (Math.atan2(x, y) * 180 / Math.PI + 360) % 360;
}
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };

// The tour’s sky moments (2026-10-09, Sevaan: "the sky wakes up step by step"): a temporary turn of the whole view,
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
  const live = !state.drag.on && hasSensorView();
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
  // Finger mode, just after "Aim at it": the view rides along with the target for a few seconds (until you drag).
  if (state.dragFollow && state.drag.on) { const f = state.dragFollow, sel = performance.now() < f.until && state.items.find((x) => x.obj.id === f.id);
    if (sel?.look?.visible) { state.drag.az = sel.look.az; state.drag.el = sel.look.el; } else if (!sel) state.dragFollow = null; }
  if (state.preview && state.followPreview && state.pinnedId && state.drag.on) { // follow only steers the drag view, never live sensors
    const selected = state.items.find(it => it.obj.id === state.pinnedId);
    if (selected) { state.drag.az = selected.look.az; state.drag.el = selected.look.el; }
  }
  if (!state.drag.on && hasSensorView()) return smoothBasis(trueBasis());
  state.smooth = null;
  return basisFromAzEl(state.drag.az, state.drag.el);
}

// ---------- render loop ----------

let lastAbove = 0;
let lastPanel = 0, lastLocked = false;
// First night out: until you’ve collected anything, a line under the circle says what to do. It goes once
// something is lined up, after 40 s, or for good once you own a card.
let hintSince = 0, hintOff = false;
function firstNightHint(target, plane, t) {
  const g = $('guidance');
  if (groundShown) return; // the look-up nudge owns the line while you’re looking down
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
// Felt only for something you can collect, and once per target in 1.5 s (2026-10-17 haptics playtest: every lock on
// owned stars, and hand tremor at the ring’s edge, buzzed again and again). The ring pulse always shows.
let lockBuzz = { id: null, at: 0 };
function snapTick(audible = true) {
  const id = state.activeTarget?.obj.id, t = performance.now();
  if (audible && (id !== lockBuzz.id || t - lockBuzz.at > 1500)) { buzz(12); lockBuzz = { id, at: t }; }
  sky.lockPulseAt = t; // felt (Android) and seen: a ring pulses out from the circle
  if (audible) sfx('lock', { gap: 260 }); // short, and never twice in a quarter second: waving the phone can lock on to several things (Sevaan)
}
let lastLockId = null, planeBuzzAt = -1e9;
let uiSafeTop = 202, uiSafeBottom = 320, uiCenterY = window.innerHeight / 2; // set from the first frame, so the circle never starts high and slides down (2026-10-07)
let idleBasis = null, idleFlip = false, skyPaused = false, lastDrawnAt = 0;
function tick(ts) {
  requestAnimationFrame(tick);
  if (!state.catalog || !state.started || document.hidden || activePanel || collectionOpen) { skyPaused = true; return; }
  // The first frame back after a pause (Collection, a panel, the app in the background) only draws; the once-a-second
  // housekeeping waits a frame or two (2026-10-16 perf sweep: both at once made the Collection’s slide-down hitch).
  if (skyPaused) { skyPaused = false; lastAbove = ts - 800; lastChip = performance.now() - 600; }
  const d = now();
  state.model.update(d, state.observer);
  state.items = state.model.items(d);
  state.belowSats = belowSats(d);
  state.rising?.update(d, state.observer);
  if (ts - lastAbove > 1000) { refreshAbove(); lastAbove = ts; }

  const basis = currentBasis();
  state.basis = basis;
  // Ease off when nothing’s moving (2026-10-08 performance): if the view hasn’t turned since the last drawn frame, draw
  // every other frame (~30 fps). Satellites still move smoothly at that rate and it saves battery outside.
  { const lb = idleBasis, moved = !lb || Math.abs(lb[0] - basis.back[0]) + Math.abs(lb[1] - basis.back[1]) + Math.abs(lb[2] - basis.back[2]) > 0.0015;
    // Skip by time, not by count: at 30 fps (Low Power Mode) skipping every other frame dropped to 15 (bug hunt 2026-10-20).
    const since = performance.now() - lastDrawnAt;
    if (state.saver && since < 30) return; /* Battery saver: 30 fps at most (2026-10-21) */
    if (!moved && since < 30 && !state.lockedOn && performance.now() - (sky.lockPulseAt ?? 0) > 500) return;
    lastDrawnAt = performance.now(); idleBasis = [...basis.back]; }
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
  // join the candidates for the circle, behind any satellite (satellites don’t wait around).
  const naturals = [];
  for (const n of naturalTargets(state.bodies, state.skyEnu?.stars, state.conEnu, state.limit?.stars, state.limit?.boost ? state.limit.stars + state.limit.boost : null)) {
    if (!n.look.visible) continue;
    const angCos = dot(n.look.enu, basis.back);
    if (angCos > reticleCos) state.sticky.set(n.obj.id, t);
    naturals.push({ obj: n.obj, label: label(n.obj), look: n.look, candidate: angCos > reticleCos, angCos });
  }
  state.naturals = naturals;

  // Only what’s in the circle can be selected (2026-10-07, Sevaan); a brief 0.4 s grace stops it flickering at the
  // edge. With several in the circle, guess which one you mean: the one nearest the centre, nudged toward the one
  // you were already on (you’re tracking it), a satellite over a star, and something new over something collected.
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
    // The UFO is one more thing in the circle, like a secret (sky playtest 2026-10-25: the Moon at the circle's edge took it
    // from a UFO dead centre): anything farther from the middle than the UFO steps aside, stars included.
    { const ua = ufoAngle(basis); state.ufoAng = ua; if (ua < Infinity) for (let i = cands.length - 1; i >= 0; i--) if (Math.acos(Math.min(1, cands[i].angCos ?? 1)) / RAD > ua) cands.splice(i, 1); }
    // A secret is one more thing in the circle (2026-10-24, Sevaan): anything farther from the middle than the nearest
    // secret steps aside (state.secretAng already has the held one's 0.5° stickiness taken off), nearer things keep it.
    if (state.secretAng < Infinity) for (let i = cands.length - 1; i >= 0; i--) if (Math.acos(Math.min(1, cands[i].angCos ?? 1)) / RAD > state.secretAng) cands.splice(i, 1);
    // Tonight's pass markers by day are one more thing in the circle too (2026-10-25, Sevaan: "the Sun is being selected
    // instead even though I have the station right in the middle"): a Sun, Moon, planet or star farther from the middle
    // than the marker steps aside, so the marker's ticket (card, time, Set reminder) shows.
    if (!state.guideRise && cands.some((c) => c.obj.natural)) {
      let mk = Infinity; for (const g of dayGhosts() ?? []) { const c = dot(g.enu, basis.back); if (c > reticleCos) mk = Math.min(mk, Math.acos(Math.min(1, c)) / RAD); }
      if (mk < Infinity) for (let i = cands.length - 1; i >= 0; i--) if (cands[i].obj.natural && Math.acos(Math.min(1, cands[i].angCos ?? 1)) / RAD > mk) cands.splice(i, 1);
    }
    state.targetId = cands[0]?.obj.id ?? null;
    target = cands[0];
  }
  target ??= null;
  // Settling (2026-10-06): right after opening, the view points wherever the default drag view does until the
  // motion sensors report, so whatever sat there flashed up as a mini card and vanished. Show no target (and
  // no edge arrow) until the sensors have been live for a moment, unless you’re in drag mode or pinned something.
  if (hasSensorView()) state.liveSince ??= t; else if (!state.drag.on) state.liveSince = null;
  if (!state.drag.on && !state.pinnedId && (state.liveSince == null || t - state.liveSince < 700)) target = null;
  // "Show me" from Tonight (2026-10-06): until the pass begins, the target is the spot where it will appear,
  // so the turn arrows and the edge pointer lead you there; once it’s visible it’s tracked as normal.
  state.guideRise = null;
  const gp = state.guidePass;
  if (gp && (state.pinnedId !== gp.id || d.getTime() > gp.end + 120000)) {
    // The pass is over: let go of it too, or the circle keeps talking about it (2026-10-18 playtest).
    if (state.pinnedId === gp.id && d.getTime() > gp.end + 120000) { state.pinnedId = null; state.targetId = null; state.sticky.clear(); }
    state.guidePass = null;
  }
  else if (gp && target && target.obj.id === gp.id && d.getTime() < gp.start) {
    const el = Math.max(4, gp.riseEl ?? 10), look = { ...target.look, az: gp.riseAz, el, visible: false };
    target.look = look; target.angCos = dot(enuFromAzEl(gp.riseAz, el), basis.back); target.trail = null;
    state.guideRise = { start: gp.start, aligned: target.angCos > Math.cos((sky.reticleDeg + 4) * RAD) };
  }
  // A pinned satellite that has set or gone dark for a minute (no Show me waiting on it) is let go as well.
  if (state.pinnedId != null && !state.guidePass && state.tourCatchId !== state.pinnedId) {
    const pi = state.items.find((a) => a.obj.id === state.pinnedId);
    if (pi && !pi.look.visible) { state.pinLostAt ??= d.getTime(); if (d.getTime() - state.pinLostAt > 60000) { state.pinnedId = null; state.targetId = null; state.sticky.clear(); state.pinLostAt = null; } }
    else state.pinLostAt = null;
  } else state.pinLostAt = null;
  state.activeTarget = target;
  if (target && target.obj.id !== artWarmId) warmArt(target.obj); // its card picture loads while you line it up, not on Collect
  // Locked on = the target is inside the circle right now and can be collected. The ring shrinks onto
  // it, and the gold circle / Collect button use the same answer.
  // A little hysteresis (2026-10-17 haptics playtest): once locked, the lock holds out to 1.2× the ring, so a hand
  // trembling at the edge doesn’t lock and unlock every frame.
  const lockDeg = state.lockedOn && target && lastLockId === target.obj.id ? sky.reticleDeg * 1.2 : sky.reticleDeg;
  state.lockedOn = !!target && target.angCos > Math.cos(lockDeg * RAD) && (target.look.visible || state.captureAny);
  lastLockId = state.lockedOn ? target.obj.id : null;
  autoLog(target, d, t);
  const plane = findPlane(basis, t);
  if (plane && state.lockedOn) state.lockedOn = false; // a plane nearer the centre than the star: it’s the plane you’re looking at

  // The first catch after the tour is quiet (2026-10-17, Sevaan): no notifications while its target is still pinned,
  // until you catch it (obFinish clears tourCatchId) or tap it away (tapSky changes pinnedId). js/toast.js holds them.
  { const fc = state.tourCatchId != null && state.pinnedId === state.tourCatchId; if (fc !== document.body.classList.contains('first-catch')) document.body.classList.toggle('first-catch', fc); }
  sky.ghostId = ghostNight(d.getTime()) && !secretFound[GHOST.patch] ? ghostPass()?.id ?? null : null; // Halloween: it shimmers green
  sky.showShadow = state.showShadow && state.tourCatchId == null; sky.fade = fadeCountdown(target, d); fadeTip(sky.fade, target); moonCheck(target); // not during the first catch: noise at that moment (playtest 2026-10-17)
  // Earth’s shadow at the height of the satellite in the circle (2026-10-17, Sevaan: an SL-8 past the line was still lit;
  // the line was for 500 km and it flies far higher). Otherwise 500 km, a typical low orbit. Rounded to 50 km.
  { const l = target && !target.obj.natural && target.look?.rangeKm ? target.look : null, R = 6371;
    const h = l ? Math.sqrt(R * R + l.rangeKm ** 2 + 2 * R * l.rangeKm * Math.sin(l.el * RAD)) - R : 500;
    const km = Math.max(150, Math.round(h / 50) * 50), up = MILES ? `${Math.round(km * 0.621371 / 50) * 50 || 50} MI UP` : `${km.toLocaleString()} KM UP`;
    sky.shadowKm = km; sky.shadowLabel = [`EARTH’S SHADOW · ${up}`, l ? 'Your target goes dark past this line' : `Satellites this high go dark past this line`]; } // catch the fade: the countdown ring as it nears Earth’s shadow
  sky.draw(basis, items, {
    showDim: state.showDim,
    sky: state.showStars ? state.skyEnu : null,
    starLimit: state.limit?.stars, // background stars follow the sky slider too
    sunEl: state.frame?.sunEl ?? -90, // day/twilight tone (js/sky.js dayF)
    ...(document.body.classList.toggle('day', (state.frame?.sunEl ?? -90) > -2) ? {} : {}),
    ...(document.body.classList.toggle('bright-sky', (state.frame?.sunEl ?? -90) > -2 && !state.night) ? {} : {}), // daytime only (dusk is dark like night): chips, switcher and toasts in card paper (2026-10-08)
    weather: state.weather?.now ?? null,
    below: belowGhosts(d), // see-through Earth: what’s under the horizon and when it rises
    feet: feetItems(),     belowSats: state.belowSats, belowStarLimit: DARK_SITE.stars, daySats: daySats(d),
    ghosts: state.guideRise && state.activeTarget ? [{ enu: enuFromAzEl(state.activeTarget.look.az, state.activeTarget.look.el), name: 'Appears here', note: fmtTime(state.guideRise.start) }] : dayGhosts(),
    bodies: state.showStars ? state.bodies : null,
    milky: state.showStars && state.showMilky && !state.saver ? state.milkyEnu : null,
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
    _ud: untilDark(target), _wk: syncWake(),
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
    centerY: tourCenterY(),
    centerX: foldCX(),
  });

  updateCompass(basis);
  if (t - lastChip > 1000) { lastChip = t; requestTonight(); requestWeather(); updateNextPassChip(); updateEventBanner(); checkCompass(t);
    // The collection page wears the same sky (2026-10-07): hand it the colours Explore is painting right now.
    if (sky.tone && !state.night) try { localStorage.setItem('skyTone', JSON.stringify({ ...sky.tone, at: Date.now() })); } catch {} }
  placeDiscover(); syncTicket();
  if (t - lastPanel > 250 || target?.obj.id !== shownTargetId || state.lockedOn !== lastLocked) {
    if (state.lockedOn && !lastLocked) snapTick(target && (isNewFind(target.obj) || target.obj.id === state.tourCatchId)); // the circle just caught something
    lastLocked = state.lockedOn; renderTarget(target, d); lastPanel = t; }
  // Positions of the radar, slider and switcher only change on resize or when the slider shows/hides: measure every 2 s,
  // not right after renderTarget’s writes 4× a second (2026-10-16 perf sweep: each read forced a full layout).
  if (t - lastMeasure > 2000) { measureSkySpace(); lastMeasure = t; }
  if (t - lastUiBoxes > 400) { sky.uiBoxes = uiBoxes(); lastUiBoxes = t; } // sky names keep off the radar, chips and tickets (playtest 2026-10-22)
  // (2026-10-07: the first-night "Sweep the sky slowly…" hint is retired, like the ground nudge)
  renderPlane(plane, t);
  if (!plane) renderIdent(target, t);
}

// ---------- planes ----------
// Live aircraft only (no time travel). When no satellite is locked on and a plane is in the circle,
// the ring turns red and says what it is. A little slack on the circle: positions are a few seconds old.
function findPlane(basis, t) {
  if (!state.showPlanes || !planesAvailable() || state.timeOffsetMs) { state.planeItems = null; state.planeHit = null; return null; }
  state.planes.update(state.observer);
  const list = state.planeItems = state.planes.positions(state.observer);
  // A satellite in the circle always wins. A star, planet or deep-sky object only wins if it’s nearer the centre than
  // the plane (astronomers 2026-10-11: a plane dead centre was labelled with a star at the ring’s edge).
  const tgt = state.lockedOn ? state.activeTarget : null;
  if (tgt && !tgt.obj.natural) { state.planeHit = null; return null; }
  // Steering to something you picked (the tour’s first catch, Show me): a passing plane doesn’t take over the guidance
  // (bug hunt 2026-10-17: "JUST A PLANE" hid the arrow to the tour’s Moon).
  if (state.pinnedId != null && !state.lockedOn) { state.planeHit = null; return null; }
  // Inside the circle only (2026-10-07: a plane well outside the ring was still lit up and named).
  const inCos = Math.cos(sky.reticleDeg * RAD), keepCos = Math.cos((sky.reticleDeg + 0.75) * RAD);
  let best = null;
  for (const a of list) { a.angCos = dot(a.enu, basis.back); if (a.angCos > inCos && (!best || a.angCos > best.angCos)) best = a; }
  // Whoever is showing keeps the circle unless the other is clearly nearer the centre (2026-10-21, Sevaan: Collect flashed
  // super fast with a plane and the Sun about equally far from the middle; the hand's tremble swapped them every frame).
  if (tgt && best) { const pa = Math.acos(Math.min(1, best.angCos)) / RAD, ta = Math.acos(Math.min(1, tgt.angCos)) / RAD, m = 0.5; if (state.planeHit ? pa > ta + m : pa > ta - m) best = null; }
  if (tgt && !best) { state.planeHit = null; return null; }
  // Keep the last plane for a second after it slips out, as long as it’s still close.
  const kept = state.planeHit && list.find((a) => a.plane.hex === state.planeHit.hex);
  if (!best && kept && kept.angCos > keepCos && t - state.planeHit.at < 400) return kept;
  state.planeHit = best ? { hex: best.plane.hex, at: t } : null;
  return best;
}

// The circle names what’s in it even when it isn’t a card (2026-10-10, Sevaan: "I shouldn’t have to tap to learn
// what something is. Just put the target on it."). Planes have their own label (renderPlane); this does the same
// for named stars that aren’t cards (sky.json names: Alphard, Mirfak…), using the plane label’s look.
let identShown = null;
function renderIdent(target, t) {
  const el = $('plane'), back = state.basis?.back;
  const lim = Math.cos((sky.reticleDeg ?? 6) * RAD);
  let best = null;
  if (!target && back && !state.lockedOn && !state.secretInCircle && !state.ufoInCircle && (state.frame?.sunEl ?? -90) < -6) for (const s of state.skyEnu?.stars ?? []) { // not over a secret being held (store recording 2026-10-24: Rasalhague's label covered Voyager's)
    if (!s.name || s.enu[2] < 0) continue;
    const c = dot(s.enu, back); if (c > lim && (!best || c > best.c)) best = { s, c };
  }
  if (!best) { if (identShown) { el.hidden = true; identShown = null; } return; }
  const ring = sky.ring ?? { x: sky.cx, y: sky.cy, r: sky.reticlePx };
  el.style.setProperty('--cx', `${ring.x}px`); el.style.setProperty('--cy', `${ring.y}px`); el.style.setProperty('--r', `${ring.r}px`);
  if (identShown === best.s.name) return;
  identShown = best.s.name; el.hidden = false; el.classList.add('ident'); $('guidance').hidden = true; /* .ident: no plane card, cream not red (2026-10-25, Sevaan: Acrab showed the plane card) */
  setTxt($('p-name'), best.s.name); $('p-route').hidden = true;
  // A star that IS a card but can't be caught right now (2026-10-25, Sevaan: "Should it not become a card then if it has
  // a name?" — Acrab is a Scorpius card; it was sitting on the trees): show its card and why, not "not a card".
  const card = cardForSkyStar(best.s), mini = el.querySelector('.p-mini');
  el.classList.toggle('ident-card', !!card);
  if (card) {
    const el2 = Math.asin(Math.max(-1, Math.min(1, best.s.enu[2]))) / RAD, own = state.sightings.some((x) => !x.sim && x.cardKey === cardKeyFor(card));
    setTxt($('p-kind'), `A star card${inCon(card)}`);
    segLine($('p-info'), el2 < 3 ? 'Too low to collect · catch it once it climbs higher' : own ? 'In your collection · too faint for your sky slider right now' : 'Too faint for your sky slider · slide toward See more');
    try { mini.replaceChildren(stripCard(card, own ? 'In your collection' : 'Not yet collected')); } catch { mini.replaceChildren(); }
  } else {
    setTxt($('p-kind'), 'A star');
    segLine($('p-info'), `A named star · ${best.s.mag < 1 ? 'one of the brightest' : best.s.mag < 2.5 ? 'bright' : 'faint'} · not a card`); // no "magnitude" (writing room 2026-10-12)
  }
}
const PLANE_CARD = document.querySelector('#plane .p-mini')?.innerHTML ?? '';
// The card for a named star in the sky's star list (sky.json has names, no HIP): by name among the cards, else the
// constellation card star within 0.3° of it (the cards may carry an IAU name the sky list doesn't).
const skyStarCard = new Map();
function cardForSkyStar(s) {
  if (skyStarCard.has(s.name)) return skyStarCard.get(s.name);
  let c = NATURAL.find((o) => o.natural === 'star' && o.name === s.name) ?? null;
  if (!c && s.v) { const lim = Math.cos(0.3 * RAD); let best = lim; for (const o of CON_STARS) { if (!o.v) continue; const d = o.v[0] * s.v[0] + o.v[1] * s.v[1] + o.v[2] * s.v[2]; if (d > best) { best = d; c = NATURAL_BY_KEY.get(o.key) ?? o; } } }
  if (CON_STARS.length) skyStarCard.set(s.name, c); return c;
}
let planeShown = null, planeText = 0;
function renderPlane(hit, t) {
  if (hit && $('plane').classList.contains('ident')) { $('plane').classList.remove('ident', 'ident-card'); $('plane').querySelector('.p-mini').innerHTML = PLANE_CARD; }
  const el = $('plane');
  if (!hit) { if (planeShown) { el.hidden = true; planeShown = null; } return; } // (the same label also names stars: renderIdent)
  identShown = null; $('guidance').hidden = true;
  const ring = sky.ring ?? { x: sky.cx, y: sky.cy, r: sky.reticlePx };
  el.style.setProperty('--cx', `${ring.x}px`); el.style.setProperty('--cy', `${ring.y}px`); el.style.setProperty('--r', `${ring.r}px`);
  if (planeShown === hit.plane.hex && t - planeText < 500) return;
  if (planeShown !== hit.plane.hex) { sfx('plane', { gap: 4000 }); if (performance.now() - planeBuzzAt > 4000) { planeBuzzAt = performance.now(); buzz(8); } } // a soft "no": not a space object (2026-10-11, Sevaan)
  planeShown = hit.plane.hex; planeText = t;
  el.hidden = false;
  const p = hit.plane, route = state.planes.route(p.callsign);
  const number = route?.flight?.replace(/^[A-Z0-9]{2}(?=\d)/, '');
  setTxt($('p-kind'), isHelicopter(p) ? 'Just a helicopter' : 'Just a plane');
  setTxt($('p-name'), route?.airline && number ? `${route.airline} ${number}` : p.callsign || p.reg || 'Unknown flight');
  const km = `${(Math.round(p.hKm * 3280.84 / 100) * 100).toLocaleString('en-US')} ft up`; // aircraft height in feet everywhere: it's what aviation uses, the UK too (US/UK playtest 2026-10-25)
  const bits = [aircraftName(p), km, `${kmText(hit.rangeKm)} away`].filter(Boolean);
  setTxt($('p-route'), route?.from && route?.to ? `${route.from} → ${route.to}` : aircraftName(p) || 'Flight details');
  $('p-route').hidden = false;
  segLine($('p-info'), (route?.from && route?.to ? bits : bits.slice(1)).join(' · '));
}

// Radar (top-left), the "heat radar" chosen 2026-10-02 (design/radar-compact-options.html, option 1):
// a heading-up map of the whole sky (centre = overhead, edge = horizon) where every visible object is a
// soft glow, so busy patches simply look brighter instead of turning into a blob of dots. Only Epic and
// Legendary objects get their own dot in their rarity colour, and the target gets a steel-blue ring (all red in night mode). The
// notch at the top is the way you’re facing; the count sits in a chip to the right.
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
  const heading = headingOf(basis);
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
    const a = (az - heading) * RAD, r = R + 7.5, rel = ((az - heading) % 360 + 360) % 360;
    // Letters step aside where the facing notch (top) and the new-count badge (upper right, when shown) sit (polish 2026-10-20).
    const gap = (d) => Math.min(1, Math.max(0, (d - 6) / 14)), toTop = Math.min(rel, 360 - rel), badge = !$('radar-new').hidden ? gap(Math.abs(rel - 45) - 12) : 1;
    ctx.globalAlpha = 0.3 + 0.7 * Math.min(gap(toTop), badge); // dimmed, not gone: you still see which letter is ahead
    ctx.fillStyle = az === 0 ? C.gold : C.muted;
    ctx.fillText(L, c + r * Math.sin(a), c - r * Math.cos(a));
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = C.cyan;
  ctx.beginPath(); ctx.moveTo(c, c - R - 1); ctx.lineTo(c - 3.5, c - R - 6.5); ctx.lineTo(c + 3.5, c - R - 6.5); ctx.closePath(); ctx.fill();
}
// The empty dial is there from the first frame, north up and still, until the sky starts (2026-10-13, Sevaan).
requestAnimationFrame(() => { try { if (!state.basis) updateCompass({ right: [1, 0, 0], up: [0, 0, 1], back: [0, 1, 0] }); } catch {} });

// ---------- target: callout + card ----------

let lastMeasure = -Infinity;
addEventListener('resize', () => { lastMeasure = -Infinity; });
// During the tour cards the circle sits above them, between the header and the deck, so "the circle" the cards talk
// about is in view (2026-10-17, Sevaan). When the cards go it eases back down to the middle of the phone.
let drawCy = null, tourMeasuredAt = 0, tourTop = 0, tourDeck = 0; const cyCalm = matchMedia('(prefers-reduced-motion: reduce)');
function tourCenterY() {
  let want = uiCenterY;
  if (document.body.classList.contains('ob-tour')) {
    // Measured at most twice a second (2026-10-17 jank playtest: reading both rects every frame forced a full layout
    // per tick, up to 400 ms frames at 6× CPU).
    const t = performance.now();
    if (t - tourMeasuredAt > 500) { tourMeasuredAt = t; tourTop = $('sky-header').getBoundingClientRect().bottom; tourDeck = $('ob-deck').getBoundingClientRect().top; }
    if (tourDeck > tourTop + 120) want = Math.min(uiCenterY, (tourTop + tourDeck) / 2 + 6);
  }
  drawCy ??= want;
  drawCy = cyCalm.matches || Math.abs(want - drawCy) < 0.5 ? want : drawCy + (want - drawCy) * (document.body.classList.contains('ob-tour') ? 0.1 : 0.3); // down after the tour 3× faster (2026-10-17, Sevaan)
  return drawCy;
}
// What sky names must not sit under (playtest 2026-10-22: the Moon's name went under the radar when notices pushed it
// down; names peeked out from under the target ticket). Read twice a second; only what's showing.
let lastUiBoxes = 0;
const UI_BOX_IDS = ['radar', 'nextpass', 'event-banner', 'tk', 'guidance', 'plane', 'wake', 'until-dark', 'toast-tray'];
function uiBoxes() {
  const out = [];
  const add = (el) => { if (!el || el.hidden || !el.offsetParent && getComputedStyle(el).position !== 'fixed') return; const r = el.getBoundingClientRect(); if (r.width && r.height) out.push({ x: r.left - 4, y: r.top - 4, w: r.width + 8, h: r.height + 8 }); };
  for (const id of UI_BOX_IDS) add($(id));
  add(document.querySelector('#discover:not([hidden]) .d-ticket'));
  for (const el of document.querySelectorAll('#toasts .ticket.in')) add(el);
  return out;
}
function measureSkySpace() {
  const box = $('target');
  const rect = box.hidden ? null : box.getBoundingClientRect();
  uiSafeTop = $('radar').getBoundingClientRect().bottom + 12;
  const navInset = window.innerHeight - Math.min($('nav').getBoundingClientRect().top, $('skybar').getBoundingClientRect().top || Infinity) + 20; // the sky slider sits above the switcher
  uiSafeBottom = !rect ? navInset : Math.max(navInset, window.innerHeight - rect.top + 34);
  // The reticle stays put when the info card or a banner comes and goes (2026-10-06, Sevaan: it jumped).
  uiCenterY = window.innerHeight / 2 - (window.innerWidth > window.innerHeight && window.innerHeight < 900 ? Math.min(64, window.innerHeight * 0.09) : 0); /* short and wide (Duo on its side): the circle sits a little higher so its ticket clears the slider without covering the lower tick (iPad/Duo playtest 2026-10-24) */ document.documentElement.style.setProperty('--ucx', `${foldCX()}px`); // the middle of the phone (2026-10-06, Sevaan), not of the gap between radar and nav
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
// Two looks for the thing you’re pointing at:
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
// New to you: a card you don’t have yet, or a fleet launch you haven’t stamped.
function isNewFind(o) {
  refreshOwned();
  const stamp = stampKeyFor(o, now().getTime()); // the Moon: a phase you haven’t stamped is a new find
  return !ownedKeys.has(cardKeyFor(o)) || (!!stamp && !ownedStamps.has(stamp));
}
function turnHint(l) {
  const gr = state.guideRise;
  if (gr) {
    const mins = Math.max(0, Math.round((gr.start - now().getTime()) / 60000));
    const when = `${fmtTime(gr.start)}${mins >= 60 ? ` · in ${Math.floor(mins / 60)}h ${mins % 60}m` : mins >= 1 ? ` · in ${mins} min` : ''}`; /* short: "in 6 h 25 min" was cut off at 320 px (web QA 2026-10-24) */
    if (gr.aligned) return `Appears here at ${when}`; // no "You’re facing the right way" (2026-10-13, Sevaan)
  }
  if (l.el < 0) return 'This pass has ended';
  if (!l.visible && !state.captureAny && !gr) return 'Not visible right now';
  const sens = state.basis && !state.drag.on; // in finger mode the view is the drag, even when the phone reports a basis (2026-10-16 playtest: the hint never changed while dragging)
  const currentAz = sens ? headingOf(state.basis) : state.drag.az;
  const currentEl = sens ? Math.asin(state.basis.back[2]) / RAD : state.drag.el;
  const turn = ((l.az - currentAz + 540) % 360) - 180;
  // Once it’s on screen, say so: "Turn right" stayed up while the Moon was already half in view (iOS playtest 2026-10-19).
  const pv = sky.basis ? sky.project(enuFromAzEl(l.az, l.el)) : null, inView = !!pv && pv.x > 0 && pv.x < sky.w && pv.y > 0 && pv.y < sky.h; // on the screen, by projection (works overhead too)
  if (inView && Math.abs(turn) > 4 && !gr) return 'On screen now · put it in the circle';
  // With a finger, say which way to drag (iOS playtest 2026-10-20: "Turn right" didn't say how). Dragging left turns right.
  const move = !sens
    ? (Math.abs(turn) > 8 ? (turn > 0 ? 'To your right · drag ←' : 'To your left · drag →') : l.el > currentEl ? 'Higher · drag ↓' : 'Lower · drag ↑') /* where it is first, then the drag, so it agrees with "Turn right" on the tour card (playtest 2026-10-22) */
    : Math.abs(turn) > 8 ? (turn > 0 ? 'Turn right →' : '← Turn left') : l.el > currentEl ? '↑ Raise your phone' : '↓ Lower your phone';
  return gr ? `${move} · ${Math.round(l.el)}° up ${compassPoint(l.az)} at ${fmtTime(gr.start)}` : `${move} · ${Math.round(l.el)}° up ${compassPoint(l.az)}`; // short, so it fits one line (2026-10-09)
}
const ICON_TARGET = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none"/><path d="M12 1.8v3.4M12 18.8v3.4M1.8 12h3.4M18.8 12h3.4"/></svg>';
const ICON_BELL = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path class="fillme" d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.6 2H4.4z"/><path d="M10 20.6a2.2 2.2 0 0 0 4 0" stroke-linecap="round"/></svg>';
// Reminders kept across launches (playtest room 2026-10-11: ids restarted at 2000 each launch, so a new reminder could
// replace an older pending one, and bells came back unlit). localStorage 'reminders': [[key, id, at]], past ones dropped.
const REMS = (() => { try { return (JSON.parse(localStorage.getItem('reminders')) ?? []).filter((r) => r[2] > Date.now()); } catch { return []; } })();
const reminded = new Set(REMS.map((r) => r[0])); // bells stay filled
const remindIds = new Map(REMS.map((r) => [r[0], { id: r[1], at: r[2], title: r[3], body: r[4], paused: !!r[5] }])); // pass key -> { id, at, title, body, paused }, so a bell can be turned off, and a reminder paused for cloud put back
const newRemindId = () => { const used = new Set([...remindIds.values()].map((v) => v.id)); let id; do { id = 3000 + Math.floor((Date.now() / 1000) % 2e6) * 10 + Math.floor(Math.random() * 10); } while (used.has(id)); return id; }; // unique across launches, and never one already in use (bug hunt 2026-10-20)
// (Both were lost in 020eca4, v0.1.528, which broke every reminder in the apps until v0.1.568.)
const saveRems = () => { try { localStorage.setItem('reminders', JSON.stringify([...remindIds].map(([k, v]) => [k, v.id, v.at, v.title ?? '', v.body ?? '', v.paused ? 1 : 0]).filter((r) => r[2] > Date.now()))); } catch {} };
// Reminders skip cloudy skies (2026-10-21, Sevaan). The watched time is the pass itself (key "id@start"), else the
// reminder's own time. When the forecast says cloud then, the notification is taken off the phone but the reminder is
// kept (bell still lit); if the forecast clears it's put back. Unknown weather never pauses one.
const remWatch = (key, at) => { const m = /@(\d+)$/.exec(String(key ?? '')); return m ? Number(m[1]) : at; };
async function recheckReminders() {
  if (!isNative()) return;
  const t0 = Date.now(); let changed = false;
  for (const [key, v] of remindIds) {
    if (v.at <= t0 + 30e3) continue;
    const cloud = cloudAt(remWatch(key, v.at));
    if (cloud && !v.paused) { try { await cancelNotify(v.id); } catch {} v.paused = true; changed = true; }
    else if (!cloud && v.paused && v.title) { if ((await notifyAt(v.at, v.title, v.body, { id: v.id })) === 'on') { v.paused = false; changed = true; } }
  }
  if (changed) saveRems();
}
// Steer to something that’s up now (the tour’s first catch, and Show me for passes already under way): pin it,
// point the drag view at it if there are no sensors, and say where to look; the turn hint and edge arrow follow.
function guideTo(obj, l, hint = '') {
  cancelPassSearch();
  state.pinnedId = obj.id; state.targetId = obj.id; state.sticky.clear(); state.guidePass = null;
  // Close by, so the arrow has something to show, and on the side you were already turning toward (2026-10-18 playtest:
  // the tour said "Turn right 28°", then the sky said "← Turn left").
  if (state.drag.on || !hasSensorView()) { const was = state.drag.on ? state.drag.az : (state.basis ? headingOf(state.basis) : 0), right = ((l.az - was + 540) % 360) - 180 > 0;
    state.drag.on = true; state.drag.az = (l.az + (right ? -40 : 40) + 360) % 360; state.drag.el = Math.max(10, l.el - 10); }
  void hint; // no toast (playtest 2026-10-09): it repeated the guide pill (name · turn · height) and stayed up after you’d lined it up
}
// Tonight → "Show me": pin the object and steer to it (or to where it will rise).
function showMePass(p) {
  cancelPassSearch();
  state.pinnedId = p.obj.id; state.targetId = p.obj.id; state.sticky.clear();
  state.guidePass = { id: p.obj.id, start: p.start, end: p.end, riseAz: p.riseAz, riseEl: p.riseEl };
  if (state.drag.on || !hasSensorView()) { state.drag.on = true; state.drag.az = p.riseAz; state.drag.el = Math.max(4, p.riseEl ?? 10); }
  closePanel('visible');
  // No toast here (2026-10-13): the steering line under the circle already says what it is, which way and when, and a
  // sticky toast sat on top of it.
}
function switchLabel(o) {
  // No tap-to-switch (2026-10-07, Sevaan): a slight tilt moves the pick (pickScore), so there is nothing to say here.
  return '';
}
var sunWarned = false;
// How far away it is, for the right end of the ticket’s first line (2026-10-17, Sevaan: "satellites could be 300 km
// and stars 50.6 ly"). Satellites: the live distance to you. Stars: Hipparcos (constellation stars) or the card’s own
// figure (the bright ones, deep sky). The Moon and Sun: their average distance. Planets: none yet.
// Miles for phones set to the US (and Liberia, Myanmar), km everywhere else (2026-10-17, Sevaan).
const MILES_REGION = (() => { try { return ['US', 'LR', 'MM'].includes(new Intl.Locale(navigator.language).maximize().region); } catch { return false; } })();
let MILES = MILES_REGION; /* Settings → Units (2026-10-21): auto follows the phone's region */
const setUnits = () => { let v = 'auto'; try { v = localStorage.getItem('units') || 'auto'; } catch {} MILES = v === 'imperial' ? true : v === 'metric' ? false : MILES_REGION; };
setUnits();
const kmText = (km) => (MILES ? `${Math.round(km * 0.621371).toLocaleString('en-US')} mi` : `${Math.round(km).toLocaleString('en-US')} km`);
function distText(o, l) {
  if (l?.rangeKm) return kmText(l.rangeKm);
  if (l?.distKm) { // the Moon, Sun and planets, where they are tonight (js/celestial.js)
    const v = MILES ? l.distKm * 0.621371 : l.distKm, u = MILES ? 'mi' : 'km';
    if (v < 1e6) return `${(Math.round(v / 1000) * 1000).toLocaleString('en-US')} ${u}`;
    if (v >= 1e9) return `${(v / 1e9).toFixed(2).replace(/0$/, '')}B ${u}`; // Saturn on: "1.27B km"
    return `${(v / 1e6).toFixed(v < 1e8 ? 1 : 0).replace(/\.0$/, '')}M ${u}`;
  }
  const sd = o.hip ? starDistance(o.hip) : null;
  if (sd) { const [ly, err] = sd; const v = ly < 100 ? Math.round(ly) : ly < 1000 ? Math.round(ly / 10) * 10 : Math.round(ly / 100) * 100; return `${err > 0.1 ? '~' : ''}${v.toLocaleString('en-US')} ly`; } // the card’s own rounding (constellations.js lyText), so the two agree (iOS playtest 2026-10-20)
  if (o.far && /LIGHT-YEARS/.test(o.far[1])) return `${o.far[0]} ly`;
  return '';
}
// The mini card in the target ticket (2026-10-23, Sevaan picked design/target-minicard.html Option 1): the same mini the
// Collection draws, picture hidden until the card is yours. Rebuilt only when the target or your sightings change (the
// ticket redraws four times a second).
let dMiniKey = '';
function setDiscMini(o) {
  const key = cardKeyFor(o), k = `${key}|${state.sightings.length}|${state.sightings[0]?.time ?? 0}|${state.cardModels?.size ?? 0}|${MILES}`; /* also a restore of the same length, models loading late, Units (code review 2026-10-23) */ if (k === dMiniKey) return; dMiniKey = k;
  try { const own = state.sightings.some((x) => !x.sim && x.cardKey === key); $('d-mini').replaceChildren(stripCard(o, !own ? 'Not yet collected' : isNewFind(o) ? 'New stamp' : 'In your collection')); /* a launch or phase to stamp says so (web QA 2026-10-24) */ }
  catch { $('d-mini').replaceChildren(); }
}
function renderTarget(target, d) {
  sky.peakMark = null; // set again below for a new find with a real top (the peak bonus)
  const bar = $('target'), disc = $('discover'), guide = $('guidance');
  $('callout').hidden = true;
  document.body.classList.toggle('secret-on', !!(state.secretInCircle || state.ufoInCircle)); // a secret owns the circle: hide the star’s name at once
  if (!target) { bar.hidden = disc.hidden = guide.hidden = true; state.newFind = false; state.dismissedId = null; shownTargetId = barTargetId = null; announceTarget(''); return; }
  // The Sun’s safety line before anyone aims at it, once a session (playtest room 2026-10-11: it only showed on the card).
  if (target.obj.key === 'sun' && !sunWarned && !document.body.classList.contains('ob-tour')) { /* not during the tour, where toasts are hidden and the card says it (flow playtest 2026-10-25) */ sunWarned = true; ticket({ kind: 'info', tone: 'gold', icon: 'sun', id: 'sun-safety', ms: 3800, eyebrow: 'THE SUN', line: 'Don’t look straight at it', sub: 'Keep your eyes on the screen.' }); } // the Sun warning is a heads-up, gone after ~6 s (2026-10-13 playtest)
  shownTargetId = target.obj.id; state.shownTarget = target;
  if (state.dismissedId != null && target.obj.id !== state.dismissedId) state.dismissedId = null; // a closed mini card returns once you’ve moved on
  const o = target.obj, l = target.look;
  const tier = TIER_INFO[o.tier] ?? TIER_INFO.common;
  const aligned = state.lockedOn;
  const eligible = canCapture({ visible: l.visible, aligned, practice: state.captureAny, allowAny: state.captureAny });
  const collected = collectedThisPass(o, d);
  const sw = switchLabel(o);
  announceTarget(`${label(o)}, ${tier.label}. ${isNewFind(o) && !collected ? (eligible ? 'Double-tap to collect.' : 'Line it up to collect it.') : 'In your collection.'}`);

  if (o.id === state.tourCatchId || (isNewFind(o) && !collected)) { // the tour’s catch always looks like a new find
    // New find
    bar.hidden = true;
    state.newFind = eligible;
    if (eligible) {
      disc.hidden = false; guide.hidden = true;
      const newStamp = ownsCard(o) && o.id !== state.tourCatchId; // fleet card already owned: this launch is a new stamp (a replayed tour's catch is shown as new, not a stamp)
      const trT = trainHere(o, d.getTime());
      setTxt($('d-tier'), isGhost(o, d.getTime()) ? 'BOO · Ghost satellite' : trT ? `Train · ${trT.count} in a line` : newStamp ? 'New stamp' : tier.label + inCon(o) + lcTag(o));
      { const boo = isGhost(o, d.getTime()); $('d-tier').style.setProperty('--find-tier', boo ? (state.night ? '#ff6a55' : '#7dffb0') : newStamp ? 'var(--cyan)' : tier.color); $('d-tier').dataset.gem = boo ? '?' : newStamp ? '✦' : tier.gem; }
      const pk = peakPass(o, d.getTime()), pl = pk && peakWords(pk, d.getTime()); sky.peakMark = pk && d.getTime() < pk.peakAt + 30e3 ? { az: pk.peakAz, el: pk.peakEl, now: Math.abs(d.getTime() - pk.peakAt) <= 30e3 } : null;
      setTxt($('d-name'), label(o)); setTxt($('d-dist'), isGhost(o, d.getTime()) ? '' : pl ?? distText(o, l)); setDiscMini(o); /* the ghost's BOO needs the room */
      $('d-switch').hidden = !sw; setTxt($('d-switch'), sw);
      const quiet = isQuiet(o) && o.id !== state.tourCatchId; // the tour’s first catch is often a (quiet) star: always say what to do (playtest 2026-10-09)
      $('d-cta').hidden = false; disc.classList.toggle('quiet', quiet); disc.classList.remove('owned'); $('d-hit').setAttribute('aria-label', 'Collect this object'); // quiet targets (stars by default) keep the Collect button too (2026-10-12, Sevaan); quiet only drops the inner ring and snap. FIX 2026-10-14: this code had been swallowed by the comment, so a new find after an owned one opened as 'Seen again'
      setTxt($('d-cta'), 'Collect'); $('d-sub').hidden = true;
    } else {
      disc.hidden = true; guide.hidden = false;
      setGuide(guide, label(o), turnHint(l)); guide.classList.toggle('later', !!state.guideRise);
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
    { const boo = isGhost(o, d.getTime()); setTxt($('d-tier'), boo ? 'BOO · Ghost satellite' : tier.label + inCon(o) + lcTag(o)); $('d-tier').style.setProperty('--find-tier', boo ? (state.night ? '#ff6a55' : '#7dffb0') : tier.color); $('d-tier').dataset.gem = boo ? '?' : tier.gem; }
    setTxt($('d-name'), label(o)); setTxt($('d-dist'), isGhost(o, d.getTime()) ? '' : distText(o, l)); setDiscMini(o);
    $('d-cta').hidden = false; setTxt($('d-cta'), 'View card');
    $('d-sub').hidden = true; // no "Seen on N nights" line under View card (2026-10-14, Sevaan): the card’s footer and frame show its level
    $('d-switch').hidden = true;
  } else { disc.hidden = true; guide.hidden = false; setGuide(guide, label(o), turnHint(l)); guide.classList.toggle('later', !!state.guideRise); }
  return;
}

// The ticket under the circle (2026-10-17, design/target-states B) for what the sky itself names: a pass lined up by
// day, a satellite hidden by daylight, something below the horizon, the fossil, the UFO, a secret (js/sky.js sets
// sky.ticket). The UFO and secret buttons live in it; a new find, a plane or the steering line have their own ticket.
for (const id of ['ufo-cta', 'secret-cta']) $('tk-act').append($(id));
// Small phones (iPhone SE): a ticket can reach down to the sky slider. Then the slider steps aside until it’s gone.
let tkLowAt = 0, tkLift = 0; const TK_LIFT_MAX = 44;
// On screen and taking room. Not offsetParent: it’s always null for position:fixed (2026-10-18 playtest: #tk and the
// slider are both fixed, so this never lifted anything).
const shown = (e) => !!e && e.getClientRects().length > 0 && e.getBoundingClientRect().height > 0 && getComputedStyle(e).visibility !== 'hidden';
// Text in the circle's tickets is written only when it changes (web playtest 2026-10-24: rewriting "Collect" four times a
// second swapped the button's text node between finger down and up, and WebKit dropped about 1 tap in 4).
function setTxt(el, t) { t = String(t ?? ''); if (el && el.textContent !== t) el.textContent = t; }
function ticketClearsSlider() {
  const t = performance.now(); if (t - tkLowAt < 300) return; tkLowAt = t;
  const el = [$('tk'), $('discover').hidden ? null : document.querySelector('#discover .d-ticket'), $('plane').hidden ? null : document.querySelector('#plane .p-ticket'), $('guidance'), $('gh-remind')].find((e) => e && !e.hidden && shown(e));
  // Keep the slider (2026-10-17, Sevaan: "the slider disappears every time the target is on an item"): the ticket rises
  // by however much it would reach the slider, up to TK_LIFT_MAX (tucking toward the sight’s lower tick). Only a ticket
  // still too tall after that makes the slider step aside.
  const bottom = el ? Math.max(...[el, $('gh-remind')].filter((e) => !e.hidden).map((e) => e.getBoundingClientRect().bottom)) + tkLift : 0;
  const sb = $('skybar'), slider = !document.body.classList.contains('day') && shown(sb); // by day the slider is hidden anyway
  const over = el ? bottom - ((slider ? sb : $('nav')).getBoundingClientRect().top - 10) : 0; // …so by day the tab bar is the floor (web playtest 2026-10-22: at 320 wide Set reminder sat under it)
  const lift = Math.round(Math.max(0, Math.min(TK_LIFT_MAX, over)));
  if (lift !== tkLift) { tkLift = lift; document.body.style.setProperty('--tk-lift', `${lift}px`); }
  // The tap-to-wake card doesn't rise with the others: if it reaches the slider, the slider steps aside (web QA 2026-10-24, 320 px wide).
  const wk = $('wake').hidden ? null : $('wake').querySelector('span'), wkOver = wk && slider ? wk.getBoundingClientRect().bottom - (sb.getBoundingClientRect().top - 10) : 0;
  document.body.classList.toggle('tk-low', slider && (over > TK_LIFT_MAX || wkOver > 0));
}
function syncTicket() {
  ticketClearsSlider();
  const tk = $('tk'), t = sky.ticket, act = $('tk-act');
  const taken = !$('discover').hidden || !$('plane').hidden || !$('guidance').hidden;
  const show = !taken && (!!t || [...act.children].some((b) => !b.hidden));
  if (tk.hidden !== !show) tk.hidden = !show;
  if (!show) return;
  const rc = sky.ring ?? { x: sky.cx, y: sky.cy, r: sky.reticlePx };
  tk.style.left = `${rc.x}px`; tk.style.top = `${rc.y + rc.r + 26 - tkLift}px`;
  const key = t ? `${t.ink}|${t.k}|${t.n}|${t.m}|${t.color ?? ''}` : 'bare';
  if (tk.dataset.k === key) return;
  tk.dataset.k = key; tk.dataset.ink = t?.ink ?? 'secret'; tk.classList.toggle('bare', !t);
  setTxt($('tk-k'), t?.k ?? ''); setTxt($('tk-n'), t?.n ?? ''); setTkLine(t?.m ?? '', t?.o); $('tk-m').hidden = !t?.m;
  if (t?.color) tk.style.setProperty('--tk', t.color); else tk.style.removeProperty('--tk');
  setTkMini(t?.o);
}
// The ticket's last line: the rarity in its own colour (2026-10-25, Sevaan), and each "a · b" part kept whole so a wrapped
// line never starts with the dot.
function setTkLine(m, o) { segLine($('tk-m'), m, o); }
// Any ticket line built of "a · b" parts: each part kept whole (no line starts with the dot), the rarity in its colour.
function segLine(el, m, o) {
  const ti = o ? (() => { try { return TIER_INFO[(state.cardModels.get(cardKeyFor(o)) ?? o).tier] ?? null; } catch { return null; } })() : null, tierTxt = ti ? `${ti.gem} ${ti.label}` : null;
  const esc = (x) => x.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const parts = String(m).split(' · ');
  const html = parts.map((x, i) => { let h = esc(x); if (tierTxt && x.includes(tierTxt)) h = h.replace(esc(tierTxt), `<b class="tk-tier" style="--c:${ti.color}">${esc(tierTxt)}</b>`); return `<span class="tk-seg">${h}${i < parts.length - 1 ? ' ·' : ''}</span>`; }).join(' ');
  if (el.dataset.h !== html) { el.dataset.h = html; el.innerHTML = html; }
}
// The card it is beside the sky's own ticket (2026-10-25, Sevaan: "This card and the just a plane card should have a little
// card in it"): tonight's passes, below the horizon, hidden by daylight. Nothing for the fossil, UFO or secrets.
let tkMiniKey = '';
function setTkMini(o) {
  const el = $('tk-mini'); let k = '';
  try { if (o && (o.norad != null || o.id != null)) k = `${cardKeyFor(o)}|${state.sightings.length}|${state.cardModels?.size ?? 0}|${MILES}`; } catch { k = ''; }
  if (k === tkMiniKey) return; tkMiniKey = k;
  $('tk').classList.toggle('has-mini', !!k);
  if (!k) { el.replaceChildren(); return; }
  try { const own = state.sightings.some((x) => !x.sim && x.cardKey === cardKeyFor(o)); el.replaceChildren(stripCard(o, own ? 'In your collection' : 'Not yet collected')); }
  catch { el.replaceChildren(); $('tk').classList.remove('has-mini'); }
}
// Keep the tap-the-circle overlay on top of the reticle wherever the sky view puts it.
let toastLimit = 0;
function placeDiscover() {
  const guide = $('guidance');
  const ring = sky.ring ?? { x: sky.cx, y: sky.cy, r: sky.reticlePx };
  if (!guide.hidden) { guide.style.top = `${ring.y + ring.r + 26 - tkLift}px`; guide.style.bottom = 'auto'; } // under the sight’s ticks
  // How far down the top-right notifications may reach: the circle’s top, above its tick (js/toast.js fitStack).
  { const lim = Math.round(ring.y - ring.r - 22); if (lim !== toastLimit) { toastLimit = lim; document.documentElement.style.setProperty('--toast-limit', `${lim}px`); } }
  const disc = $('discover');
  if (disc.hidden) return;
  disc.style.setProperty('--cx', `${ring.x}px`);
  disc.style.setProperty('--cy', `${ring.y}px`);
  disc.style.setProperty('--r', `${ring.r}px`);
}
// The lit-up press stays a beat even on a quick tap, before the reveal takes over (2026-10-09).
// What the ticket showed when the finger went down is what gets collected (iOS playtest 2026-10-20: a satellite crossing a
// star took over between the label and the tap, and the reveal was a different object).
for (const id of ['d-cta', 'd-hit']) $(id).addEventListener('pointerdown', () => { state.pressTarget = state.shownTarget ?? state.activeTarget; state.pressAt = performance.now(); });
for (const ev of ['pointerdown']) $('d-cta').addEventListener(ev, () => { const b = $('d-cta'); b.classList.add('tapped'); setTimeout(() => b.classList.remove('tapped'), 280); });
$('d-hit').addEventListener('click', () => {
  unlockAudio();
  primeReveal();
  const pressed = state.pressTarget && performance.now() - (state.pressAt ?? 0) < 1500 ? state.pressTarget : null; state.pressTarget = null;
  const target = pressed ?? state.activeTarget;
  if (!target) return;
  // A tap during an automatic save (autoLog) waits for it instead of being dropped (2026-10-18 playtest: View card did nothing).
  if (state.captureBusy) { const at = performance.now(); const retry = () => { if (!state.captureBusy) $('d-hit').click(); else if (performance.now() - at < 3000) setTimeout(retry, 100); }; setTimeout(retry, 100); return; }
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
  letGoOf(o);
}
// Once you’ve collected or viewed what you were steered to (Aim at it, Show me, a tap on the sky), let go of it, so the
// circle goes back to naming whatever is in it (2026-10-18, Sevaan: after catching Saturn its View card followed the
// circle around the sky).
function letGoOf(o) {
  if (state.pinnedId !== o.id) return;
  state.pinnedId = null; state.targetId = null; state.guidePass = null; state.sticky.clear();
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
// Seeing something you already own counts on its own: hold it in the circle for a moment while it’s
// visible and the sighting is logged (once per pass; once a night for the Moon, planets and stars), so
// "When you saw it" fills in and levels grow without tapping. A level-up gets a toast.
const AUTO_LOG_MS = 1200;
let autoHold = null;
// Repeat-sighting milestones, in different nights (cards) and launches stamped (fleet cards).
const NIGHT_MILESTONES = [3, 5, 10, 25, 50, 100, 200, 365];
function autoLog(target, d, t) {
  const o = target?.obj;
  if (!o || o.id === state.tourCatchId || isGhost(o, d.getTime()) /* the ghost waits for your tap (returning playtest 2026-10-25: it auto-logged in a blink) */ || !state.lockedOn || !(target.look.visible || state.captureAny) || state.captureBusy || isNewFind(o) || !ownsCard(o)) { autoHold = null; return; }
  if (autoHold?.id !== o.id) { autoHold = { id: o.id, since: t, done: false }; return; }
  if (autoHold.done || t - autoHold.since < AUTO_LOG_MS) return;
  autoHold.done = true;
  if (collectedThisPass(o, d)) return;
  const key = cardKeyFor(o), mine = () => state.sightings.filter((s) => !s.sim && s.cardKey === key), nightsBefore = nightsIn(mine());
  recordSighting(o, d).then((saved) => {
    if (!saved) return;
    const nightsNow = nightsIn(mine()), name = label(o);
    // Only news gets a toast (2026-10-07): a shiny, or a nights milestone ("Seen on 3 different nights").
    if (saved.shiny) ticket({ kind: 'shiny', eyebrow: 'SHINY', line: name, sub: SHINY[saved.shiny].line, ms: 4500 });
    else if (!o.launches && !o.natural && nightsNow > nightsBefore && NIGHT_MILESTONES.includes(nightsNow)) ticket({ kind: 'event', icon: 'calendar', eyebrow: 'MILESTONE', line: `Seen on ${nightsNow} different nights`, sub: name, ms: 3200 });
    lastPanel = 0;
    announceProgress(progressGain(saved), 2800);
  });
}
function collectedThisPass(o, d) {
  if (o.natural) return collectedTonight(state.sightings, cardKeyFor(o), d.getTime(), state.observer.lon);
  return collectedDuringPass(state.sightings, o.id, d.getTime(), false);
}
// × closes the mini card. A selected object is let go; something you’re just pointing at stays
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
// here. If it’s in the circle and you haven’t logged it this pass (or tonight, for the Moon, planets and
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
// Card pictures warmed ahead of the reveal (2026-10-17 perf pass): the target’s full-size art is fetched and decoded as
// soon as it’s in your sights, so the reveal never shows the card before its picture. The last 12 are kept decoded.
let artWarmId = null; const artWarm = new Map();
function warmArt(obj) {
  artWarmId = obj.id;
  let src = null; try { src = artImage(cardModel(obj)); } catch {}
  if (!src || artWarm.has(src)) return;
  const im = new Image(); im.decoding = 'async'; im.src = src; im.decode?.().catch(() => {});
  artWarm.set(src, im); if (artWarm.size > 12) artWarm.delete(artWarm.keys().next().value);
}
function cardModel(obj) { return state.cardModels.get(cardKeyFor(obj)) ?? obj; }
function cardSnapshot(obj) {
  // Fleet cards list every member and launch; the snapshot keeps just the card’s own facts.
  const { satrec, _label, _setColor, members, launches, ...card } = cardModel(obj);
  return card;
}
// The magic moment (js/reveal.js): sealed card + flip for a first sighting, straight-in card with a
// count stamp for repeats, all scaled by rarity.
function showCaptureCard(obj) {
  const model = cardModel(obj), key = cardKeyFor(obj), stampKey = stampKeyFor(obj, now().getTime());
  const sightings = state.sightings.filter(s => !s.sim && s.cardKey === key);
  const card = renderCard(model, { sightings, seenMembers: new Set(sightings.map(s => s.objectId)).size, ownedKeys: ownedCardKeys() });
  $('reveal-view').href = `cards.html#${encodeURIComponent(key)}`;
  openPanel('reveal');
  // Fleet cards: a launch seen for the first time lands a stamp, and levels count stamps.
  let fleet = null;
  const phase = moonPhaseOf(stampKey);
  if (phase != null) { // the Moon: a phase seen for the first time lands a stamp (2026-10-17)
    const stamps = stampsIn(sightings).size, newStamp = sightings.filter((s) => s.stampKey === stampKey).length === 1;
    fleet = { newStamp, stamps, total: 8, level: cardLevel(sightings, model), before: cardLevel(sightings.slice(1), model), line: `${MOON_PHASES[phase].toUpperCase()} · ${stamps} OF 8 PHASES`, milestone: stamps === 8 ? 'All 8 phases of the Moon' : null };
  } else if (model.launches && stampKey) {
    const stamps = stampsIn(sightings).size;
    const newStamp = sightings.filter((s) => s.stampKey === stampKey).length === 1;
    fleet = { newStamp, stamps, total: model.launches.length, cospar: stampKey.split(':')[1],
      level: fleetLevel(model.family, stamps), before: fleetLevel(model.family, newStamp ? stamps - 1 : stamps) };
  }
  // Levels count observing nights; pass the level before and after this sighting.
  const progress = { level: cardLevel(sightings, model), before: cardLevel(sightings.slice(1), model), nights: !model.natural && nightsIn(sightings) > nightsIn(sightings.slice(1)) ? nightsIn(sightings) : 0 }; // 0 unless this sighting started a new night
  const collected = new Set(state.sightings.filter(s => !s.sim).map(s => s.cardKey)).size; // milestone stamps
  // A constellation star: the stamp shows how far along its constellation is (gold when complete).
  // A star’s constellation, or the Solar System for the Moon and planets: progress toward its mission patch.
  const conCard = (model.con && CON_BY_ID.get(model.con)) || (['moon', 'planet'].includes(model.type) ? SOLAR_SYSTEM : null);
  const owned = ownedCardKeys();
  const con = conCard && sightings.length === 1 ? { name: conCard.name, unit: conCard === SOLAR_SYSTEM ? 'worlds' : 'stars', ...conProgress(conCard, owned) } : null;
  // The toast shows the constellation filling in (2026-10-07, Sevaan): the constellation chart, found stars lit,
  // the one you just caught ringed.
  if (con && conCard.data) con.art = conArt(conCard.data, model.hip ?? null, { w: 150, h: 100, ...(CON_FIGURES.has(conCard.con) ? { figure: `assets/art/con/${conCard.con}.webp` } : {}),
    lit: new Set(conCard.stars.filter((k) => owned.has(k)).map((k) => Number(k.replace('star:hip', '')))) });
  let gain = progressGain(sightings[0]);
  // The very first card (2026-10-18 playtest: the first Moon brought XP, three patches and two missions at once): the
  // card and First Light lead; the other patches wait until you leave the Tonight page (releaseLaterPatches), and the
  // missions it completed count quietly.
  if (state.sightings.filter((x) => !x.sim).length === 1) {
    const later = gain.achievements.filter((a) => a.id !== 'first').map((a) => a.id);
    if (later.length) try { localStorage.setItem('patchLater', JSON.stringify(later)); } catch {}
    gain = { ...gain, achievements: gain.achievements.filter((a) => a.id === 'first'), missions: [] };
  }
  announceProgress(gain, 3800, { onReveal: true });
  // What it earned shows on the reveal itself, as chips (2026-10-12, playtest room): no pile of toasts afterwards.
  // A card back this catch earns (2026-10-24, Sevaan: "I still see the same default card back"): the card comes sealed in
  // it, and a chip says so; updateBackEarned saves it (and makes it yours if you were on the default) afterwards.
  const newBacks = [...backsEarnedBy(state.sightings)].filter((id) => !backEarned().has(id));
  if (newBacks.length) { showBackNext(newBacks[0]); newBacks.forEach((id) => backChipped.add(id)); }
  const news = [...newBacks.map((id) => ({ kind: 'back', text: `New card back · ${CARD_BACKS.find((x) => x.id === id)?.name ?? ''}` })),
    ...gain.missions.map((m) => ({ kind: 'mission', text: m.challenge ? 'Sky challenge' : 'Mission complete', xp: 50 })),
    ...gain.achievements.map((a) => ({ kind: 'patch', text: a.name })),
    ...(gain.event ? [{ kind: 'event', text: gain.event }] : []),
    ...(sightings[0]?.peak ? [{ kind: 'peak', text: 'Caught at its peak', xp: 10 }] : []),
    ...(sightings[0]?.train ? [{ kind: 'train', text: 'Caught as a train' }] : []),
    ...(() => { const w = progressNow(state.sightings).week, w0 = w && progressNow(state.sightings.slice(1)).week; return w && w.have >= w.need && w0 && w0.have < w0.need ? [{ kind: 'mission', text: `${w.name} done`, xp: 150 }] : []; })(), // the week's +150 says so (returning playtest 2026-10-25)
    ...(gain.rankUp ? [{ kind: 'rank', text: `New rank: ${gain.rankUp}` }] : [])];
  if ((gain.rankUp || gain.achievements.length) && reviewable()) reviewAfterReveal = true; /* a milestone: a calm moment to ask for a review once the card is put away (2026-10-24) */
  else if (sightings.length === 1) plusAfterReveal = greatNight(model); /* or a great night: the Plus invite (2026-10-24) */
  if (newBacks.length && plusSellable()) news.push({ kind: 'backs', act: 'backs', text: `${CARD_BACKS.filter((b) => backUnlocked(b) || newBacks.includes(b.id)).length} of ${CARD_BACKS.length} · see them all` });
  // Reunited (2026-10-17): this catch completes a stage-and-satellite pair from one launch.
  { const mate = sightings.length === 1 && model.partners?.find((k) => k !== key && ownedCardKeys().has(k));
    if (mate) news.unshift({ kind: 'reunion', text: `Reunited with ${label(state.cardModels.get(mate) ?? { name: mate })}` }); }
  teachNext = teachFor(model, sightings);
  $('rv-share').hidden = false; revealShare = { card, o: model };
  revealIntoBinder = sightings.length === 1 && !model.launches; revealFaced = false; // a brand-new card goes into the binder when closed (2026-10-21)
  duckMusic(true); playReveal({ card, o: model, seen: sightings.length, fleet, progress, collected, con, xp: gain.xp, rank: gain.rank, earned: news, shiny: sightings[0]?.shiny && !model.launches ? SHINY[sightings[0].shiny] : null, origin: { x: sky.ring?.x ?? sky.cx, y: sky.ring?.y ?? sky.cy } });
}
// The tour’s catch when you already own it (replaying the tour): the same sealed-card reveal as a first catch,
// with no sighting saved, so the tour feels the same every time.
function tourReveal(obj) {
  revealIntoBinder = false;
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
  revealIntoBinder = false;
  const model = cardModel(obj), key = cardKeyFor(obj);
  const sightings = state.sightings.filter(s => !s.sim && s.cardKey === key);
  const card = renderCard(model, { sightings, seenMembers: new Set(sightings.map(s => s.objectId)).size });
  $('reveal-view').href = `cards.html#${encodeURIComponent(key)}`;
  openPanel('reveal');
  let sighting = null;
  if (counted) {
    const level = model.launches ? fleetLevel(model.family, stampsIn(sightings).size) : cardLevel(sightings, model);
    const before = model.launches ? level : cardLevel(sightings.slice(1), model);
    sighting = { seen: sightings.length, nights: !model.natural && nightsIn(sightings) > nightsIn(sightings.slice(1)) ? nightsIn(sightings) : 0, level, levelUp: level !== before };
  }
  $('rv-share').hidden = !sightings.length; revealShare = { card, o: model };
  playView({ card, o: model, from, sighting });
}
// A Tonight row’s card: the real card if you own it, otherwise a preview (art and story shown).
function showTonightCard(obj, from, eyebrow, { preview = false } = {}) {
  revealIntoBinder = false;
  const model = cardModel(obj), key = cardKeyFor(obj);
  const sightings = state.sightings.filter(s => !s.sim && s.cardKey === key);
  // Not collected yet: the same hidden art as in the collection (2026-10-09, Sevaan); the fact shows (2026-10-13).
  const card = renderCard(model, sightings.length ? { sightings, seenMembers: new Set(sightings.map(s => s.objectId)).size } : { preview }); // the hero shows its real picture, so its card does too
  $('reveal-view').href = `cards.html#${encodeURIComponent(key)}`;
  openPanel('reveal'); // over Up in your sky, which comes back when the card is put away
  $('rv-share').hidden = !sightings.length; revealShare = { card, o: model };
  playView({ card, o: model, from, eyebrow });
}
// Share from the reveal (2026-10-08, design D): the same image as the collection viewer’s Share.
let revealShare = null;
$('rv-share').addEventListener('click', async () => {
  const r = revealShare, btn = $('rv-share'); if (!r) return;
  btn.disabled = true;
  try { const how = await shareCardEl(r.card, r.o, { title: titleFor(r.o), rank: progressNow(state.sightings).rank.name, fact: factFor(r.o) }); if (how === 'downloaded') toast('Saved the card image.'); else if (how === 'shared') reviewAfterReveal = true; }
  catch (e) { console.error('share failed', e?.message ?? e, e?.stack ?? ''); ticket({ kind: 'error', sticky: true, eyebrow: 'COULDN’T SHARE', line: 'The card image couldn’t be made', sub: String(e?.message ?? e).slice(0, 80) }); }
  btn.disabled = false;
});
async function capture(obj) {
  if (state.captureBusy) return;
  const d = now(), f = frame(d, state.observer);
  const l = obj.natural ? state.naturals?.find((n) => n.obj.id === obj.id)?.look : look(obj, f);
  const basis = currentBasis();
  const aligned = l && dot(enuFromAzEl(l.az, l.el), basis.back) > Math.cos(sky.reticleDeg * 1.2 * RAD); // the lock holds to 1.2× the ring, so Collect showing means Collect works (Android playtest 2026-10-20: Saturn at the edge said Not quite)
  if (!l || !canCapture({ visible: l.visible, aligned, practice: state.captureAny, allowAny: state.captureAny })) { compassMisses++; ticket({ kind: 'info', icon: 'target', eyebrow: 'NOT QUITE', line: 'Put it inside the circle', sub: 'Then tap while it’s still up.', ms: 2600 }); return; }
  if (obj.id === state.tourCatchId && !isNewFind(obj)) { tourReveal(obj); return; } // tour replay: the full reveal, nothing logged
  if (collectedThisPass(obj, d)) { showViewCard(obj, null, false); letGoOf(obj); return; }
  if (await recordSighting(obj, d, l)) { showCaptureCard(obj); letGoOf(obj); }
}

// Save a real sighting of obj at sky time d. Returns the saved record, or null (and says why).
// Constellations (js/constellations.js): owning every star turns its card gold; the capture stamp says so.
function ownedCardKeys() { return new Set(state.sightings.filter((s) => !s.sim).map((s) => s.cardKey)); }
// What a sighting earned (js/progress.js): XP, missions completed, new achievements, rank-ups. Compares the
// log with and without the newest sighting; toasts the news a moment after the card lands.
function progressNow(list) {
  const info = (k) => { const c = state.cardModels.get(k); return c ? { tier: c.tier, tier0: c.tier0, type: c.type, owner: c.owner ?? (c.family ? state.catalog.families?.[c.family]?.owner : undefined), launch: c.launch, natural: c.natural, con: c.con, reunion: c.reunion, role: c.type === 'rocket-body' ? 'stage' : 'payload' } : null; };
  state.albums ??= state.cardModels?.size ? albumList([...state.cardModels.values()]) : null;
  const opts = { constellations: conList(), albums: state.albums ?? [], now: now().getTime(), deals: readDeals(), weekThemes: readWeekThemes(), lon: state.observer?.lon ?? null };
  return progressOf(list, info, { ...opts, carry: xpCarry(state.sightings, info, opts) });
}
function progressGain(saved) {
  const after = progressNow(state.sightings), before = progressNow(state.sightings.filter((s) => s !== saved));
  const missions = after.missions.filter((m, i) => m.done && !before.missions[i]?.done);
  const achievements = after.achievements.filter((a, i) => a.done && !before.achievements[i]?.done);
  if (after.challenge?.done && !before.challenge?.done) missions.push({ ...after.challenge, challenge: true });
  const ev = eventOf(saved), firstOfEvent = ev && !state.sightings.some((s) => s !== saved && eventOf(s)?.id === ev.id);
  return { xp: after.xp - before.xp, rank: { from: before.xp, to: after.xp, name: after.rank.name, at: after.rank.at, next: after.rank.next, ...(after.rank.index > before.rank.index ? { prev: { name: before.rank.name, at: before.rank.at, next: before.rank.next } } : {}) }, missions, achievements, rankUp: after.rank.index > before.rank.index ? after.rank.name : null, event: firstOfEvent ? ev.name : null };
}
function announceProgress(g, delay = 3800, { onReveal = false } = {}) {
  // Tickets queue themselves; the delay lets the card land first. From a reveal, missions, the event badge and a rank-up
  // are chips on the reveal instead (playReveal news); patches still roll into the Collection afterwards.
  if (onReveal) { g.achievements.forEach((a) => earnPatch(a)); return; }
  if (g.event) ticket({ kind: 'event', icon: 'meteor', eyebrow: 'EVENT BADGE', line: g.event, ms: 3600, delay });
  g.missions.forEach((m) => ticket({ kind: 'mission', icon: m.challenge ? 'star' : 'diamond', eyebrow: m.challenge ? 'SKY CHALLENGE' : 'MISSION COMPLETE', line: m.text, xp: 50, ms: 3200, delay }));
  g.achievements.forEach((a) => earnPatch(a)); // mission patches (2026-10-08): a stitched-on moment, then a toast
  if (g.rankUp) ticket({ kind: 'rank', id: 'rank', sticky: true, eyebrow: 'NEW RANK', line: g.rankUp, go: 'See what’s next', ms: 4200, delay, href: 'cards.html' }); // one rank ticket, replaced by the next
}
// Catch the fade (2026-10-14, Sevaan; design/fun-and-learning.html): when what’s in the circle is about to slide into
// Earth’s shadow, a gold ring around the circle counts down the last 20 s. Collect (or view) it in the last 3 s and
// the sighting is a shiny (js/shiny.js eclipse, checked 3 s ahead in recordSighting). Looked up once a second.
let fadeMemo = { id: null, at: 0, t: null };
// Teach the fade (2026-10-25, Sevaan; design/real-sky.html 05 A): the first time the fade countdown shows on something new
// to you, a callout above the circle says what it is. Once per device: counted once it has been up 2 s (fadeTaught).
let fadeTipAt = 0, fadeTaughtC = null, moonCheckedC = null; // cached: these were read from localStorage every frame (bug hunt 2026-10-25)
// The Moon check (2026-10-25, Sevaan; design/real-sky.html 02): a compass test. Not right after the Moon's reveal (you've
// often lowered the phone by then, Sevaan asked) but the next time the Moon is back in the circle and locked, after it
// has been out of it once since you caught it. Once per device (moonChecked); motion only (not with a finger).
// "It's off" opens Line up the sky, which uses the Moon.
let mcArmed = false;
function moonCheck(target) {
  const el = $('moon-check'); if (moonCheckedC == null) { try { moonCheckedC = localStorage.getItem('moonChecked') === '1'; } catch { moonCheckedC = true; } } const done = moonCheckedC;
  if (done) { if (!el.hidden) el.hidden = true; return; }
  refreshOwned(); const onMoon = target?.obj.key === 'moon';
  if (!ownedKeys.has('moon')) { mcArmed = false; return; }
  if (!onMoon) { mcArmed = true; if (!el.hidden) el.hidden = true; return; }
  const ok = mcArmed && state.lockedOn && hasLiveSensors() && !state.drag.on && !activePanel && $('reveal').hidden && !collectionOpen && !document.body.classList.contains('ob-tour') && !document.body.classList.contains('calib');
  if (ok && el.hidden) el.hidden = false; else if (!ok && !el.hidden) el.hidden = true; // a page, the reveal or line-up opening hides it
  if (!el.hidden) placeOverRing(el);
}
$('moon-check').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; moonCheckedC = true; try { localStorage.setItem('moonChecked', '1'); } catch {} $('moon-check').hidden = true; note('calib', { s: b.classList.contains('mc-off') ? 'moon-off' : 'moon-ok' });
  if (b.classList.contains('mc-off')) openCalib(); else buzz('success'); });
// Nothing caught yet? (2026-10-25, Sevaan: the moment people quit): after ten minutes with the sky open after dark and
// no catch this session, a card above the circle offers the three things that usually fix it: be shown something sure
// (the Moon, a bright planet or star), line the sky up with the real one, or slide toward See more. Once a night.
let helpSecs = 0, helpFrom = 0, helpOff = false, helpHiddenAt = 0, helpUntil = 0;
document.addEventListener('visibilitychange', () => { if (document.hidden) helpHiddenAt = Date.now(); else if (helpHiddenAt && Date.now() - helpHiddenAt > 20 * 60e3) { helpSecs = 0; helpFrom = 0; helpOff = false; } });
function helpScene() { const c = document.body.classList; return state.started && !$('hud').hidden && !activePanel && !collectionOpen && $('reveal').hidden && $('ob-done').hidden && $('onboard').hidden && !c.contains('ob-tour') && !c.contains('calib') && !c.contains('sky-matching') && !document.querySelector('.set-sheet:not([hidden])'); }
const helpBusy = () => { const tg = state.activeTarget?.obj; if (state.planeHit) return true; if (!tg || tg.natural === 'star') return false; try { return isNewFind(tg); } catch { return true; } }; // a star or a card you own in the circle is fine (stars fill it)
function hideHelp(pick) { const el = $('help-card'); helpUntil = 0; helpOff = true; if (el.hidden) return; el.hidden = true; if (pick) note('help', { pick }); }
setInterval(() => {
  const el = $('help-card');
  if (helpUntil) { // shown: it steps aside for a catch or a page and comes back, for two minutes or until answered
    const ok = helpScene() && !helpBusy() && Date.now() < helpUntil;
    if (ok) { if (el.hidden) el.hidden = false; } else if (!el.hidden) el.hidden = true;
    if (Date.now() >= helpUntil) helpUntil = 0;
    return;
  }
  if (helpOff || document.hidden || (state.frame?.sunEl ?? 0) >= -12) return;
  const t = now().getTime(); if (!helpFrom) helpFrom = t;
  if (state.sightings.some((x) => !x.sim && x.time >= helpFrom)) { helpOff = true; return; } // caught something: no help needed
  if (!helpScene()) return;
  let wait = 600; try { wait = Number(localStorage.getItem('helpSecs')) || 600; } catch {} // testing: localStorage helpSecs shortens the wait
  if (++helpSecs < wait || helpBusy() || document.querySelector('#toasts .ticket.in')) return; // not over a notice // ten minutes in, and not over a catch
  const nk = String(nightKey(t, state.observer?.lon ?? 0)); let told = null; try { told = localStorage.getItem('helpNight'); } catch {}
  helpOff = true; if (told === nk) return;
  try { localStorage.setItem('helpNight', nk); } catch {}
  helpUntil = Date.now() + 120e3; el.hidden = false; note('help', { s: 'shown' });
}, 1000);
$('help-card').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return;
  if (b.classList.contains('hc-x')) return hideHelp('close');
  if (b.classList.contains('hc-show')) { hideHelp('show'); const tg = firstTarget(); if (tg) guideTo(tg.obj, tg.look, tg.hint); return; }
  if (b.classList.contains('hc-line')) { hideHelp('line'); openCalib(); return; }
  if (b.classList.contains('hc-more')) { hideHelp('more'); showSkyMatch(); } });
function fadeTip(f, target) {
  const el = $('fade-tip'); if (fadeTaughtC == null) { try { fadeTaughtC = localStorage.getItem('fadeTaught') === '1'; } catch { fadeTaughtC = true; } } const taught = fadeTaughtC;
  const show = !!f && !taught && !!target && isNewFind(target.obj) && !document.body.classList.contains('ob-tour') && !activePanel;
  if (!show) { if (!el.hidden) { el.hidden = true; if (fadeTipAt && performance.now() - fadeTipAt > 2000) { fadeTaughtC = true; try { localStorage.setItem('fadeTaught', '1'); } catch {} } fadeTipAt = 0; } return; }
  if (el.hidden) { el.hidden = false; fadeTipAt = performance.now(); }
  placeOverRing(el);
}
// A card above the circle (fade tip, Moon check) that keeps off the radar and its label on narrow phones (bug hunt
// 2026-10-25): centred if it clears the radar, else it starts just right of it.
let radarRight = 0, radarBottom = 0, radarAt = 0;
function placeOverRing(el) {
  const rc = sky.ring ?? { y: sky.cy, r: sky.reticlePx }, top = Math.round(rc.y - rc.r - 26); el.style.top = `${top}px`;
  if (performance.now() - radarAt > 2000) { const r = $('radar').getBoundingClientRect(), b = $('radar-new')?.getBoundingClientRect(); radarRight = Math.max(r.right, b?.width ? b.right : 0); radarBottom = r.bottom; radarAt = performance.now(); } // with its count badge
  const w = el.offsetWidth || 290, cardTop = top - (el.offsetHeight || 100), clash = cardTop < radarBottom && (innerWidth - w) / 2 < radarRight + 6;
  const left = Math.round(radarRight + 10); el.classList.toggle('by-radar', clash); el.style.left = clash ? `${left}px` : ''; el.style.setProperty('--ax', clash ? `${Math.round(innerWidth / 2 - left)}px` : '50%'); // the pointer still aims at the circle
}
function fadeCountdown(target, d) {
  if (!target || !state.lockedOn || target.obj.natural || target.obj.family || !target.look?.sunlit) return null;
  const t0 = d.getTime();
  if (fadeMemo.id !== target.obj.id || Math.abs(t0 - fadeMemo.at) > 1000) {
    let t = null;
    for (let s = 1; s <= 20 && t == null; s++) { const l = look(target.obj, frame(new Date(t0 + s * 1000), state.observer)); if (l && !l.sunlit) t = t0 + s * 1000; }
    fadeMemo = { id: target.obj.id, at: t0, t };
  }
  const left = fadeMemo.t ? (fadeMemo.t - t0) / 1000 : 0;
  return left > 0 && left <= 20 ? { left, total: 20 } : null;
}
async function recordSighting(obj, d, l = null) {
  l ??= obj.natural ? state.naturals?.find((n) => n.obj.id === obj.id)?.look : look(obj, frame(d, state.observer));
  if (!l) return null;
  const m = obj.natural ? null : motion(obj, d, state.observer), key = cardKeyFor(obj);
  // Shiny (js/shiny.js): something special happening in the sky right now.
  const moonB = state.bodies?.find((b) => b.kind === 'moon');
  // Catch the fade (2026-10-14): it has to slip into Earth’s shadow within 3 s of the tap (was 12 s, before that 45).
  const later = obj.natural ? null : look(obj, frame(new Date(d.getTime() + 3000), state.observer));
  const shiny = shinyFor(obj, { ...l, enu: l.enu ?? enuFromAzEl(l.az, l.el) }, later, moonB ? { enu: moonB.enu, illum: moonB.illum } : null, d.getTime());
  const sighting = { ...(shiny ? { shiny } : {}), objectId: obj.id, cardKey: key, ...(stampKeyFor(obj, d.getTime()) ? { stampKey: stampKeyFor(obj, d.getTime()) } : {}), name: obj.name, type: obj.type, year: obj.year, time: d.getTime(), loggedAt: Date.now(), lat: state.observer.lat, lon: state.observer.lon, az: l.az, el: l.el, mag: l.mag, rangeKm: l.rangeKm, heading: m?.heading, ...(l.phaseName ? { phase: l.phaseName } : {}), sim: false, appVersion: VERSION, ...(cardModel(obj).fallAt > d.getTime() - 86400e3 ? { lastChance: true } : {}), ...(isHeadliner(obj) ? { headliner: true } : {}), ...(isNewFind(obj) && atPeak(obj, d.getTime()) ? { peak: true } : {}), ...(isNewFind(obj) && trainHere(obj, d.getTime()) ? { train: true } : {}), cardSnapshot: cardSnapshot(obj) };
  state.captureBusy = true;
  try {
    const key = await withTimeout(addSighting(sighting), 8000); // never leaves Collect stuck (bug hunt 2026-10-20)
    collectionStale(); // the preloaded collection catches up in the background
    const saved = { ...sighting, key };
    const nightsBefore = realNights(); state.sightings.unshift(saved); session.catches++; if (realNights() > nightsBefore) noteNight(saved);
    for (const id of ['tonight', 'rank', 'sun-safety', 'guide']) dropToast(id); // a catch clears the notes that were waiting for one (playtest room 2026-10-12)
    backupSoon(); // into iCloud shortly (js/cloud-backup.js)
    checkTwoHomes(saved); checkGhost(saved);
    return saved;
  } catch {
    buzz('warning'); ticket({ kind: 'error', sticky: true, id: 'save-fail', eyebrow: 'COULDN’T SAVE', line: 'That card didn’t save', sub: 'Close private browsing or free up space, then try again.' });
    return null;
  } finally { state.captureBusy = false; }
}

// ---------- sightings ----------

// Anonymous usage notes (js/field-notes.js, 2026-10-24): a launch, each night with a catch, the end of a session, and
// how the phone steers. Only counts and states: nothing about where you are.
const session = { start: Date.now(), catches: 0 };
// Week one stays simple (2026-10-25, Sevaan): the themed week and seasonal returns (notices and the 9:30 PM notification)
// wait until a player has been out on two nights before tonight, so their third night is the first that hears about them.
const settledIn = () => { const tk = nightKey(now().getTime(), state.observer?.lon ?? 0); return new Set(state.sightings.filter((x) => !x.sim).map((x) => nightKey(x.time, x.lon ?? 0)).filter((k) => k !== tk)).size >= 2; };
const realNights = () => new Set(state.sightings.filter((x) => !x.sim).map((x) => nightKey(x.time, x.lon ?? 0))).size;
function noteOpen() {
  try { if (!localStorage.getItem('tidNight')) localStorage.setItem('tidNight', nightKey(Date.now(), state.observer?.lon ?? 0)); } catch {}
  note('open', { dsi: daysSinceInstall(), n: realNights(), cards: new Set(state.sightings.filter((x) => !x.sim).map((x) => x.cardKey)).size, dark: (state.frame?.sunEl ?? 0) < -6 ? 1 : 0 });
  setTimeout(() => note('motion', { s: hasLiveSensors() ? 'live' : state.drag.on ? 'drag' : 'none' }), 20000);
}
function noteNight(saved) {
  let first = 0; try { first = localStorage.getItem('tidNight') === nightKey(saved.time, saved.lon ?? 0) ? 1 : 0; } catch {}
  note('night', { n: realNights(), f: first, dsi: daysSinceInstall() });
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') { note('end', { c: session.catches, s: Math.round((Date.now() - session.start) / 1000), dark: (state.frame?.sunEl ?? 0) < -6 ? 1 : 0 }); sendNotes(); }
  else if (session.left && Date.now() - session.left > 30 * 60e3) { /* back after half an hour away: a new session */ session.start = Date.now(); session.catches = 0; note('open', { dsi: daysSinceInstall(), n: realNights(), back: 1, dark: (state.frame?.sunEl ?? 0) < -6 ? 1 : 0 }); }
  if (document.visibilityState === 'hidden') session.left = Date.now();
});
{ const c = $('chk-share'); if (c) { c.checked = localStorage.getItem('share') !== '0'; c.addEventListener('change', () => { try { localStorage.setItem('share', c.checked ? '1' : '0'); } catch {} if (c.checked) note('open', { dsi: daysSinceInstall(), n: realNights(), back: 1 }); }); } } // Settings → Help
addEventListener('message', (e) => { if (e.origin === location.origin && e.data?.sc === 'err') noteError(e.data.m, e.data.s, e.data.l, e.data.c); }); // the Collection's errors come through here
const withTimeout = (p, ms) => Promise.race([p, new Promise((_, no) => setTimeout(() => no(new Error('timed out')), ms))]);
async function loadSightings() {
  try { state.sightings = (await withTimeout(allSightings(), 6000)).map(normalizeSighting); state.storageReady = true; } catch { state.storageReady = false; } // never holds the loader forever (bug hunt 2026-10-20)
  setTimeout(() => { for (const id of Object.keys(secretFound)) earnStory(id, true); }, 3000); // story cards for secrets found before they existed (2026-10-14)
  if (!loadSightings.noted) { loadSightings.noted = true; noteOpen(); }
}


// ---------- visible now ----------

// Now tab (2026-10-08, design/now-tonight.html A): a map of your sky, the list split into New to you / Seen before,
// and at the end a row of mini cards for what’s new to collect. Tap a dot, row or card to aim at it.
function aimAt(it) {
  cancelPassSearch();
  state.pinnedId = it.obj.id; state.targetId = it.obj.id;
  if (state.drag.on || !hasSensorView()) { state.drag.on = true; state.drag.az = it.look.az; state.drag.el = it.look.el; state.dragFollow = { id: it.obj.id, until: performance.now() + 8000 }; } // keeps it in the circle while it moves (iOS playtest 2026-10-20: fast ones had moved on)
  closePanel('visible');
}
// The sky’s own icon for an object, drawn once per kind and colour into a small image for the Now map.
const mapIcons = new Map();
function mapIcon(o, color) {
  const kind = sky.iconKind(o), key = `${kind}|${color}`; if (mapIcons.has(key)) return mapIcons.get(key);
  const cv = document.createElement('canvas'); cv.width = cv.height = 56; const r = Object.create(Object.getPrototypeOf(sky)); r.ctx = cv.getContext('2d');
  try { r.drawIcon(kind, 28, 28, 40, color); } catch {}
  const url = cv.toDataURL(); mapIcons.set(key, url); return url;
}
const visIcon = (o, c) => o.natural ? `<svg width="18" height="18" viewBox="-9 -9 18 18"><circle r="3" fill="${c}"/><circle r="7" fill="${c}" opacity=".18"/></svg>`
  : o.type === 'debris' ? `<svg width="18" height="18" viewBox="-9 -9 18 18"><g transform="rotate(17) scale(1.25)" fill="${c}"><path d="M-4.9 -1 L-.35 -3.9 L1.4 -.35 L-.7 1.75 L-3.85 2.1Z"/><path d="M2.1 -5.25 L5.25 -3.85 L3.85 -1.75Z"/><path d="M2.45 2.1 L5.6 1.4 L4.55 4.55 L2.8 4.2Z"/></g></svg>` // the sky's debris icon (2026-10-20)
  : o.type === 'rocket-body' ? '<svg width="12" height="20" viewBox="-6 -10 12 20"><rect x="-3" y="-8" width="6" height="14" rx="2" fill="#fff2b3"/><path d="M-3 6 L-5 10 L5 10 L3 6Z" fill="#fa8127"/></svg>'
  : `<svg width="22" height="12" viewBox="-11 -6 22 12"><rect x="-3" y="-2" width="6" height="4" fill="${c}"/><rect x="-10" y="-1.5" width="6" height="3" fill="${c}" opacity=".8"/><rect x="4" y="-1.5" width="6" height="3" fill="${c}" opacity=".8"/></svg>`;
// Nothing up (2026-10-08): an empty sky map with why (daylight, cloud, a quiet gap), the next pass worth looking
// for as a tappable row, and ways on: jump the clock to the next pass, or see tonight’s plan.
// Now, the countdown (2026-10-13, Sevaan approved design/sky-pages-combined.html): one hero for the next card worth
// getting (Uncommon+ new to you; Commons only once the rest run low). Up right now → "Up now" and Aim. Coming → a ring
// in its rarity colour that fills over the last hour, a live mm:ss countdown, an arrow that turns with the phone, Show
// me and a bell. "After that" lists the next three and the evening’s best shiny chance.
let heroTimer = 0, heroRaf = 0, heroKey = null; // the card the hero shows; the sections below leave it out (2026-10-21, Sevaan: one pass showed four times)
let heroShine = false;
// A headliner's whole reward: the card's own XP when it's new to you, plus the +25 headliner bonus (2026-10-22, Sevaan:
// the hero said +25 while the list said +40 for the same pass). Same numbers as the run (renderRun XP).
const CARD_XP = { common: 10, uncommon: 15, rare: 25, epic: 40, legendary: 60 };
// The peak bonus (2026-10-25, Sevaan; design/catch-feel.html 04): a pass's highest point is marked on its path, and a new
// card caught within 30 s of it is "Caught at its peak · +10 XP". Only passes with a real top: 20°+ and not where it
// fades into Earth's shadow or rises (the planner's peakAt then sits at the edge of the pass).
// The plan steps a minute at a time, so its peak could land on the pass's edge or 30 s off (returning playtest
// 2026-10-25: the bonus came and went with when the plan was made). The real top is found from the track itself, every
// 5 s while it's sunlit, once per pass (cached): a real top is the highest sunlit point, not at either end.
const peakMemo = new Map();
function truePeak(o, q) {
  const k = `${o.id}@${q.start}`; if (peakMemo.has(k)) return peakMemo.get(k);
  const pts = []; for (let u = q.start - 120e3; u <= q.end + 120e3; u += 5000) { const l = look(o, frame(new Date(u), state.observer)); if (l && l.sunlit && l.el > 0) pts.push({ u, l }); }
  let i = -1; pts.forEach((x, j) => { if (i < 0 || x.l.el > pts[i].l.el) i = j; });
  const r = i > 0 && i < pts.length - 1 && pts[i].l.el >= 20 && pts[i].u - pts[i - 1].u === 5000 && pts[i + 1].u - pts[i].u === 5000 ? { peakAt: pts[i].u, peakEl: pts[i].l.el, peakAz: pts[i].l.az } : null;
  if (peakMemo.size > 40) peakMemo.clear(); peakMemo.set(k, r); return r;
}
function peakPass(o, t) {
  const T = state.tonight; if (!T || o.natural || o.family) return null;
  const q = T.passes.find((x) => x.id === o.id && t >= x.start - 120e3 && t <= x.end + 120e3); if (!q) return null;
  const r = truePeak(o, q); return r ? { ...q, ...r } : null;
}
const atPeak = (o, t) => { const p = peakPass(o, t); return !!p && Math.abs(t - p.peakAt) <= 30e3; };
function peakWords(p, t) { const s = Math.round((p.peakAt - t) / 1000); if (s > 120 || s < -30) return null; return Math.abs(s) <= 30 ? 'Peak · now' : `Peak in ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }
// Halloween (2026-10-25, Sevaan; design/come-back.html 05): on the night of 31 October a long-dead satellite haunts the
// sky. Which one is picked for each player from tonight's plan, so everyone has one that really passes over them: a
// member of the Dead Satellites Society set, peaking 20°+, preferring Envisat (NORAD 27386, silent since 2012, about
// mag 2), else the brightest (testing found Envisat had no pass over Peterborough that night). Lined up that night it
// shimmers green with a BOO; catching it (new or again) earns a secret patch with the year on it. The Tonight page
// teases it the week before. The night runs noon to noon, so after midnight counts.
const GHOST = { prefer: 27386, patch: 'ghost2026', year: 2026 };
const DEAD = SETS.find((x) => x.id === 'dead-sats');
function ghostPass(T = state.tonight) {
  if (!T || !ghostNight(T.dusk ?? now().getTime())) return null;
  const t = now().getTime();
  if (T._ghost !== undefined && (!T._ghost || T._ghost.end > t || t - T._ghostAt < 60000)) return T._ghost; /* once its pass is over, re-checked once a minute, not every frame (bug hunt 2026-10-26) */
  T._ghostAt = t;
  // One ghost for the whole night (playtest 2026-10-25: re-picking from a newer plan swapped satellites mid-evening): the
  // first pick is kept (localStorage ghostPick) and its next pass used while it has one.
  let keep = null; try { keep = JSON.parse(localStorage.getItem('ghostPick') ?? 'null'); } catch {}
  const withObj = (q) => ({ ...q, obj: state.byId.get(q.id) });
  if (keep?.year === GHOST.year && state.byId.get(keep.id)) { const mine = T.passes.filter((x) => x.id === keep.id).sort((a, b) => a.start - b.start); const q = mine.find((x) => x.end > t) ?? mine.at(-1); if (q) return (T._ghost = withObj(q)); } // the same ghost all night, even once its pass is over
  const ps = T.passes.filter((q) => q.peakEl >= 20 && q.end > t).map(withObj).filter((q) => q.obj && !q.obj.family && DEAD?.test(q.obj));
  const eve = eveningEnd(T), inEve = (q) => (q.start <= eve ? 1 : 0); // this evening first: a 5 AM ghost helps few people
  const g = ps.sort((a, b) => inEve(b) - inEve(a) || (b.id === GHOST.prefer) - (a.id === GHOST.prefer) || (a.mag ?? 9) - (b.mag ?? 9) || a.start - b.start)[0] ?? null;
  if (g && ['ready', 'stale', 'manual'].includes(state.locationStatus)) try { localStorage.setItem('ghostPick', JSON.stringify({ year: GHOST.year, id: g.id })); } catch {} // kept only for a real location
  return (T._ghost = g);
}
const isGhost = (o, t) => ghostNight(t) && !secretFound[GHOST.patch] && ghostPass()?.id === o.id;
const ghostNight = (t = now().getTime()) => { const d = new Date(t - 12 * 3600e3); return d.getFullYear() === GHOST.year && d.getMonth() === 9 && d.getDate() === 31; };
const ghostWeek = (t = now().getTime()) => { const d = new Date(t); return d.getFullYear() === GHOST.year && d.getMonth() === 9 && d.getDate() >= 24 && !ghostNight(t); }; // to the moment the night starts (Oct 31 morning too)
function checkGhost(s) { if (ghostNight(s.time) && !secretFound[GHOST.patch] && ghostPass()?.id === s.objectId) setTimeout(() => earnSecret(GHOST.patch), 1200); }
function ghostBox(T, t0) {
  if (secretFound[GHOST.patch]) return null;
  const el = document.createElement('div'); el.className = 'ghost-box';
  if (ghostWeek(t0)) { const today = new Date(t0).toDateString() === new Date(GHOST.year, 9, 31).toDateString(); /* on the day itself: "Tonight" (flow playtest 2026-10-25) */ el.innerHTML = `<span class="gq" aria-hidden="true">?</span><span><small>${today ? 'Tonight' : escapeHtml(new Date(GHOST.year, 9, 31).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }))} · one night only</small><b>Something’s haunting the sky</b><i>A satellite that died long ago will be out after dark. Find it ${today ? 'tonight' : 'that night'}.</i></span>`; return el; }
  if (!ghostNight(t0)) return null;
  const p0 = ghostPass(T), p = p0 && p0.end > t0 ? p0 : null, gone = p0 && p0.end <= t0;
  el.innerHTML = `<span class="gq" aria-hidden="true">?</span><span><small>Tonight only · Halloween</small><b>Something’s haunting the sky</b><i>${p ? `It passes at ${escapeHtml(fmtTime(p.start))}, ${escapeHtml(whereWords({ el: p.peakEl, az: p.peakAz }).toLowerCase())}.${cloudAt(p.start) ? ' Cloud is forecast then; a gap would do.' : ''}` : gone ? `It passed at ${escapeHtml(fmtTime(p0.start))}. Still up there, silent, until next Halloween.` : 'No ghost passes over you for the rest of tonight. Look again next Halloween.'}</i></span>${p ? `<button type="button" class="pill-o gh-go"><span class="ico-svg">${ICON_TARGET}</span> Show me</button>` : ''}`;
  if (p) el.querySelector('.gh-go').addEventListener('click', (e) => { flyToCircle(e.currentTarget); showMePass(p); });
  return el;
}
function headlinerXp(o) { return (isNewFind(o) ? CARD_XP[cardModel(o).tier] ?? 10 : 0) + 25; }
function nowHero(list, vis) {
  clearInterval(heroTimer); cancelAnimationFrame(heroRaf); heroKey = null;
  const T = state.tonight, t0 = now().getTime(), tierN = (o) => TIER_RANK[(state.cardModels.get(cardKeyFor(o)) ?? o).tier] ?? 0, tierOf = (o) => TIER_INFO[(state.cardModels.get(cardKeyFor(o)) ?? o).tier] ?? TIER_INFO.common;
  const leftBetter = (state.catalog?.objects ?? []).filter((o) => !o.family && tierN(o) >= 1 && isNewFind(o)).length;
  const upNow = (vis ?? []).filter((it) => isNewFind(it.obj) && it.obj.natural !== 'star' && it.obj.type !== 'deepsky' && (leftBetter < 10 || tierN(it.obj) >= 1)).sort((a, b) => tierN(b.obj) - tierN(a.obj) || a.look.mag - b.look.mag)[0];
  // Tonight's headliner leads while it's still ahead and new to you (2026-10-21, Sevaan): one pick, the one with the +25 XP
  // and the catch-of-the-day notification; once caught or gone, the next best catch.
  const head = !upNow && T ? headliner(T) : null, isHead = !!head && head.start > t0 && isNewFind(head.obj);
  const next = upNow ? null : isHead ? head : bestUpcoming(T, t0, eveningEnd(T)); // tonight’s window only (2026-10-18 playtest: a 5 AM pick at 1 PM)
  if (!upNow && !next) return;
  const o = upNow ? upNow.obj : next.obj, tier = tierOf(o), tgt = upNow ? upNow.look : { az: next.peakAz, el: next.peakEl }; // where it's highest, like every other line about a pass (2026-10-22, Sevaan: "north" here, "southeast" in the list); Show me still leads to where it appears
  const key = next ? `${o.id}@${next.start}` : ''; heroKey = cardKeyFor(o);
  const hero = document.createElement('div'); hero.className = 'now-hero'; hero.style.setProperty('--c', tier.color);
  const R = 70, C = 2 * Math.PI * R;
  // Not the soonest new pass (a rarer one later)? Say it’s the pick, not the next (2026-10-18 playtest).
  const notSoonest = !!next && tonightPasses(T, t0).some((p) => p.fresh && p.start > t0 && p.start < next.start);
  const kick = isHead ? `Tonight’s headliner · +${headlinerXp(o)} XP` : notSoonest ? 'Best catch tonight' : 'Next new card';
  // Cloud says so up top (Sevaan 2026-10-22: the hero said "Aim at it" under 100% overcast): a line for the night, and
  // the kicker for the pass itself.
  const wxT = tonightWeather(), wxLine = wxT && !wxT.ok && wxT.line ? `<span class="nh-wx"><span class="ico" data-ico="cloud"></span>${escapeHtml(wxT.line)}${wxT.kase === 'bad' ? ' · if it clears, these count' : ''}</span>` : '';
  hero.innerHTML = `${wxLine}<span class="nh-k">${upNow ? (cloudAt(t0) ? 'New to you · behind cloud' : 'New to you') : cloudAt(next.start) ? `${kick} · cloud forecast` : kick}</span>
    <div class="nh-top"><button type="button" class="nh-card" aria-label="See the ${escapeHtml(label(o))} card"></button>
      <div class="nh-side"><div class="nh-t">${upNow ? '<b>Up now</b>' : '<b class="nh-cd">--:--</b><small class="nh-u">to go</small>'}</div>${next ? `<span class="nh-bar"><i class="nh-fill"></i></span>` : ''}
        <span class="nh-tier">${tier.gem} ${tier.label}${upNow ? '' : ' · new'}${lcTag(o)}</span><span class="nh-name">${escapeHtml(label(o))}</span><span class="nh-what"></span></div></div>
    <span class="nh-dir"><i class="nh-arrow" aria-hidden="true"><svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 2.5 L19 10 H14.5 V21 H9.5 V10 H5 Z" fill="currentColor"/></svg></i><span class="nh-turn"></span></span>
    <div class="nh-acts"><button type="button" class="pill-o nh-go"><span class="ico-svg">${ICON_TARGET}</span> ${upNow ? 'Aim at it' : 'Show me'}</button>${next ? `<button type="button" class="pill-g nh-bell${reminded.has(key) ? ' on' : ''}${needsPlus(key)}" aria-label="Remind me"><span class="ico-svg">${ICON_BELL}</span></button>` : ''}</div>`;
  { // option B (design/next-card-art.html, 2026-10-21, Sevaan): the real mini card from the Collection, real picture, tilted
    const btn = hero.querySelector('.nh-card'), model = state.cardModels.get(cardKeyFor(o)) ?? cardModel(o);
    const mc = miniCard(model, { status: next ? fmtTime(next.start) : 'Up now', preview: true }); btn.append(mc);
    const what = mc.querySelector('.card__identity > span')?.textContent?.trim() || describe(o, { stamp: false }); // the card’s own “what it is” line
    hero.querySelector('.nh-what').textContent = next ? `${what} · ${fmtTime(next.start)}` : what;
    btn.addEventListener('click', () => showTonightCard(o, btn, next ? `${kick.toUpperCase()} · ${fmtTime(next.start)}` : 'UP NOW', { preview: true })); }
  hero.querySelector('.nh-go').addEventListener('click', (e) => { flyToCircle(e.currentTarget); upNow ? aimAt(upNow) : showMePass(next); });
  const bell = hero.querySelector('.nh-bell');
  bell?.addEventListener('click', () => bellTap(bell, next, key, (on) => bell.classList.toggle('on', on))); // choose when (2026-10-21); grey bells answer too
  if (heroShine) { heroShine = false; hero.classList.add('shine'); }
  list.appendChild(hero);
  // Countdown, once a second while the tab is open.
  if (next) {
    const cd = hero.querySelector('.nh-cd'), u = hero.querySelector('.nh-u'), fill = hero.querySelector('.nh-fill');
    const tick = () => {
      if (!hero.isConnected) { clearInterval(heroTimer); return; } /* keeps counting while the page is hidden, so it never comes back as --:-- (2026-10-21, Sevaan) */
      const left = Math.max(0, Math.round((next.start - now().getTime()) / 1000));
      if (left <= 0) { clearInterval(heroTimer); renderVisible(); return; }
      const h = Math.floor(left / 3600), m = Math.floor(left / 60) % 60, sec = left % 60;
      cd.textContent = h ? `${h} h ${m} min` : m ? `${m} min ${String(sec).padStart(2, '0')} s` : `${sec} s`; /* one style with the until-dark bar: "2 h 21 min" (US/UK playtest 2026-10-25) */ /* "21:46 to go" read like a clock time (web playtest 2026-10-22) */ u.textContent = 'to go'; /* "0:22 MIN" read as minutes for seconds (iOS playtest 2026-10-20) */ cd.classList.toggle('long', cd.textContent.length > 6);
      if (fill) fill.style.width = `${(100 * (1 - Math.min(1, left / 3600))).toFixed(1)}%`; // fills over the last hour
    };
    tick(); heroTimer = setInterval(tick, 1000);
  }
  // The arrow and words follow the phone (same source as the map: the sky loop pauses under panels).
  const arrow = hero.querySelector('.nh-arrow'), turn = hero.querySelector('.nh-turn'), where = whereWords(tgt).toLowerCase();
  let lastTxt = '';
  const spin = () => {
    if (!hero.isConnected) return;
    if ($('visible').hidden) { heroRaf = requestAnimationFrame(spin); return; } // rendered just before the panel shows
    let b0 = [0, 1, 0]; try { b0 = (!state.drag.on && hasSensorView() ? trueBasis() : basisFromAzEl(state.drag.az, state.drag.el))?.back ?? b0; } catch {}
    const hd = (Math.atan2(b0[0], b0[1]) / RAD + 360) % 360, d = ((tgt.az - hd + 540) % 360) - 180;
    arrow.style.transform = `rotate(${d.toFixed(0)}deg)`;
    const txt = Math.abs(d) < 20 ? `Ahead of you · ${where}` : Math.abs(d) > 150 ? `Behind you · ${where}` : `Turn ${d < 0 ? 'left' : 'right'}${Math.abs(d) < 60 ? ' a little' : ''} · ${where}`;
    if (txt !== lastTxt) { lastTxt = txt; turn.textContent = txt; }
    heroRaf = requestAnimationFrame(spin);
  };
  spin();
  // After that: the next three worth it, plus the evening’s best shiny chance.
  if (T) {
    const eve = eveningEnd(T), seen2 = new Set([cardKeyFor(o)]);
    const more = tonightPasses(T, t0).filter((p) => p.start > t0 && p.start <= eve && p.fresh && (leftBetter < 10 || tierN(p.obj) >= 1)).filter((p) => { const k = cardKeyFor(p.obj); if (seen2.has(k)) return false; seen2.add(k); return true; }).slice(0, 3);
    const sh = shinyChances(T, t0).filter((x) => x.t > t0 && x.t <= eve).sort((a, b) => ['eclipse', 'moon', 'overhead', 'fresh'].indexOf(a.kind) - ['eclipse', 'moon', 'overhead', 'fresh'].indexOf(b.kind))[0];
    const items = [...more.map((p) => ({ t: p.start, p, name: label(p.obj), sub: `<em style="color:${tierOf(p.obj).color}">${tierOf(p.obj).gem} ${tierOf(p.obj).label}</em> · ${whereWords({ el: p.peakEl, az: p.peakAz }).toLowerCase()}` })),
      ...(sh ? [{ t: sh.t, p: sh.p, name: label(sh.o), sub: `${escapeHtml(sh.line)} · <em style="color:var(--gold)">shiny chance</em>` }] : [])].sort((a, b) => a.t - b.t);
    if (items.length) {
      list.insertAdjacentHTML('beforeend', '<div class="t-head" id="sj-coming">Coming up</div>');
      for (const it of items) {
        const mins = Math.round((it.t - t0) / 60000), r = document.createElement('button'); r.type = 'button'; r.className = 'nh-after';
        r.innerHTML = `<span class="na-t">${mins >= 360 ? fmtTime(it.t) : fmtTime(it.t).replace(/\s?[AP]\.?M\.?$/i, '')}<small>${mins < 1 ? 'now' : mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)} h ${mins % 60} m`}</small></span><span><b>${escapeHtml(it.name)}</b><small>${it.sub}</small></span><span class="na-go">${ICON_TARGET}</span>`;
        r.addEventListener('click', () => showMePass(it.p)); list.appendChild(r);
      }
    }
  }
}
function renderVisibleEmpty(list) {
  const t0 = now().getTime(), T = state.tonight, day = isDay(), wxT = tonightWeather();
  if (!T) requestTonight();
  const next = T ? bestUpcoming(T, t0, eveningEnd(T)) : null; // worth suggesting: no Commons until the rest run low
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
  const tail = document.createElement('div'); nowHero(tail, []); list.insertBefore(tail, box); tail.replaceWith(...tail.childNodes); // the hero first, then why it’s quiet
  if (false && next) { // replaced by the countdown hero above
    const tier = TIER_INFO[next.obj.tier] ?? TIER_INFO.common, mins = Math.round((next.start - t0) / 60000);
    const when = mins < 60 ? `in ${mins} min` : `in ${Math.floor(mins / 60)} h ${mins % 60 ? `${mins % 60} min` : ''}`.trim();
    list.insertAdjacentHTML('beforeend', '<div class="t-head">Next up</div>');
    const r = document.createElement('button'); r.type = 'button'; r.className = 'vis-row2'; r.style.setProperty('--tier', tier.color);
    r.innerHTML = `<span class="vr-ic">${visIcon(next.obj, tier.color)}</span><span class="vr-main"><b>${escapeHtml(label(next.obj))}${next.fresh ? '<span class="new">NEW</span>' : ''}</b><small>${fmtTime(next.start)} · ${when} · ${brightnessWord(next.mag)}</small></span><span class="vr-dir">${compassPoint(next.riseAz)}<em>to ${next.peakEl}° up</em></span>`;
    r.addEventListener('click', () => showMePass(next)); list.appendChild(r);
  }
  const acts = document.createElement('div'); acts.className = 'vis-empty-acts';
  const b = document.createElement('button'); b.className = 'big'; b.textContent = 'See tonight’s run'; b.addEventListener('click', () => skyJumpTo('tonight')); // no more 'next bright pass' toast (2026-10-13): Tonight has the plan // it aims you; it doesn’t move the clock (QA 2026-10-08)
  const l = document.createElement('button'); l.type = 'button'; l.className = 'ui-link'; l.textContent = 'See tonight’s plan ›'; l.addEventListener('click', () => skyJumpTo('tonight'));
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
    const b0 = (!state.drag.on && hasSensorView() ? trueBasis() : basisFromAzEl(state.drag.az, state.drag.el))?.back ?? [0, 1, 0];
    if (Math.hypot(b0[0], b0[1]) > 0.15) { // straight up there’s no "facing": hold still
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
  const vis = [...state.items.filter((i) => i.look.visible), ...(state.naturals ?? []).filter((n) => n.obj.key !== 'earth')].sort((a, b) => a.look.mag - b.look.mag);
  $('visible-sub').textContent = `${state.observer.label?.replace(/^Example:\s*/, '') ?? 'Your sky'} · ${fmtTime(now().getTime())}`;
  const newUp = newUpCount(); // new cards up, not every star (2026-10-13 playtest: "305" vs "8 up at once")
  { const nb = document.querySelector('[data-jump="now"]'); if (nb) nb.textContent = newUp ? `Now · ${newUp} new` : 'Now'; }
  $('visible-hint').textContent = ''; list.innerHTML = '';
  if (!vis.length) { renderVisibleEmpty(list); return; }
  // The map turns with you (2026-10-08): whichever way you face is at the top, under a fixed soft wedge; the ring,
  // N/E/S/W and the dots rotate (labels stay upright). spinVisMap keeps it turning while the panel is open.
  const b0 = state.basis?.back ?? [0, 1, 0], heading = (Math.atan2(b0[0], b0[1]) / RAD + 360) % 360;
  const pos = (l) => { const r = 104 * (1 - Math.max(0, l.el) / 90), a = l.az * RAD; return [Math.sin(a) * r, -Math.cos(a) * r]; };
  const wedge = (() => { const a1 = -20 * RAD, a2 = 20 * RAD; return `<path d="M0 0 L${Math.sin(a1) * 104} ${-Math.cos(a1) * 104} A104 104 0 0 1 ${Math.sin(a2) * 104} ${-Math.cos(a2) * 104} Z" fill="#fa8127" opacity=".1"/>`; })();
  const up = (x, y) => `class="vm-up" data-x="${x.toFixed(1)}" data-y="${y.toFixed(1)}"`;
  // Everything but stars as its sky icon (2026-10-13, Sevaan: satellites and debris were missing or just dots).
  // Objects first so they’re never cut by the cap, then stars.
  const objsFirst = [...vis.filter((it) => it.obj.natural !== 'star'), ...vis.filter((it) => it.obj.natural === 'star')].slice(0, 70);
  const dots = objsFirst.map((it, i) => { const [x, y] = pos(it.look), isStar = it.obj.natural === 'star', nw = isNewFind(it.obj) && !isStar, c = it.obj.natural ? '#f2d8a8' : '#fff2b3', lab = i < 7; // stars stay quiet: small, no ring
    return `<g class="vd" data-i="${i}" style="cursor:pointer"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="12" fill="transparent"/>${it.obj.natural ? `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${nw ? 4 : isStar ? 1.8 : 2.8}" fill="${c}"/>` : `<image class="vm-up" data-x="${x.toFixed(1)}" data-y="${y.toFixed(1)}" href="${mapIcon(it.obj, '#fff2b3')}" x="${(x - 7).toFixed(1)}" y="${(y - 7).toFixed(1)}" width="14" height="14"/>`}${nw ? `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="8.5" fill="none" stroke="#fa8127" stroke-width="1.2"/>` : ''}${lab ? `<text ${up(x, y)} x="${(x + 11).toFixed(1)}" y="${(y + 3.5).toFixed(1)}" font-family="SC Label, Arial Narrow" font-size="9.5" letter-spacing="1" fill="#fff2b3cc">${escapeHtml(label(it.obj).toUpperCase().slice(0, 16))}</text>` : ''}</g>`; }).join('');
  const map = document.createElement('div'); map.className = 'vis-map';
  map.innerHTML = `<svg viewBox="-118 -118 236 236"><circle r="108" fill="#0b1626" stroke="#344654"/>${wedge}<g class="vm-rot" transform="rotate(${-heading.toFixed(1)})"><circle r="72" fill="none" stroke="#1c2b3c"/><circle r="36" fill="none" stroke="#1c2b3c"/><path d="M0 -108 V108 M-108 0 H108" stroke="#1c2b3c"/>
    <g font-family="SC Label, Arial Narrow" font-size="11" fill="#bdbea9" text-anchor="middle"><text ${up(0, -100)} y="-96" fill="#fa8127">N</text><text ${up(98, 0)} x="98" y="4">E</text><text ${up(0, 100)} y="104">S</text><text ${up(-98, 0)} x="-98" y="4">W</text></g>${dots}</g><circle r="2.5" fill="#fa8127"/></svg>
    <p class="vis-map-note">You’re facing <span class="vm-face">${compassPoint(heading)}</span> · tap a dot or a row to aim</p>`;
  map.addEventListener('click', (e) => { const g = e.target.closest('.vd'); if (g) aimAt(objsFirst[Number(g.dataset.i)]); });
  void map; nowHero(list, vis); // no sky map on Now (2026-10-13, Sevaan); the big next-card hero leads
  const row = (it) => { const o = it.obj, tier = TIER_INFO[o.tier] ?? TIER_INFO.common, nw = isNewFind(o), r = document.createElement('button'); r.type = 'button'; r.className = 'vis-row2';
    r.innerHTML = `<span class="vr-ic">${visIcon(o, o.natural ? '#f2d8a8' : tier.color)}</span><span class="vr-main"><b>${escapeHtml(label(o))}${nw ? `<span class="new">${newWord(o)}</span>` : ''}</b><small>${tier.label} · ${brightnessWord(it.look.mag)}</small></span><span class="vr-dir">${compassPoint(it.look.az)}<em>${heightWord(it.look.el)}</em></span>`;
    r.addEventListener('click', () => aimAt(it)); return r; };
  const once = new Set(), uniq = vis.filter((it) => { const k = it.obj.natural === 'star' ? `star:${label(it.obj)}` : cardKeyFor(it.obj); if (once.has(k)) return false; once.add(k); return true; }); // one row per card (Alioth showed twice: bright star + its constellation’s star)
  const isStar = (it) => it.obj.natural === 'star' || it.obj.type === 'deepsky'; // stars, clusters and galaxies stay off the Now lists (2026-10-13; deep sky 2026-10-20, Sevaan)
  const fresh = uniq.filter((it) => isNewFind(it.obj) && !isStar(it)), seen = uniq.filter((it) => !isNewFind(it.obj) && !isStar(it)), newStars = uniq.filter((it) => isNewFind(it.obj) && isStar(it)); // stars get their own section at the end (2026-10-13, Sevaan)
  const starLast = (a, b) => Number(a.obj.natural === 'star') - Number(b.obj.natural === 'star') || a.look.mag - b.look.mag;
  fresh.sort(starLast); seen.sort(starLast);
  const group = (title, items) => { if (!items.length) return; list.insertAdjacentHTML('beforeend', `<div class="t-head">${title} · ${items.length}</div>`);
    items.slice(0, 8).forEach((it) => list.appendChild(row(it)));
    if (items.length > 8) { const more = document.createElement('button'); more.type = 'button'; more.className = 'ui-link vis-more'; more.textContent = `Show all ${items.length} ›`;
      more.addEventListener('click', () => { const frag = document.createDocumentFragment(); items.slice(8).forEach((it) => frag.appendChild(row(it))); more.replaceWith(frag); }); list.appendChild(more); } };
  group('New to you', fresh);
  // Seen before (2026-10-09, Sevaan): the cards you’ve already collected, as a row of little cards (the "New to
  // collect" strip is gone; new things are the list above). Tap one to see the card (2026-10-21, Sevaan; it used to aim).
  if (seen.length) {
    list.insertAdjacentHTML('beforeend', `<div class="t-head">Seen before · ${seen.length}</div>`);
    const strip = document.createElement('div'); strip.className = 'mini-cards';
    seen.forEach((it) => { const o = it.obj, tier = TIER_INFO[o.tier] ?? TIER_INFO.common, c = document.createElement('button'); c.type = 'button'; c.className = 'mini-card';
      c.replaceChildren(stripCard(o, `${compassPoint(it.look.az)} · ${Math.round(it.look.el)}° up`));
      c.setAttribute('aria-label', `${label(o)}, ${compassPoint(it.look.az)}, ${Math.round(it.look.el)} degrees up: view card`);
      c.addEventListener('click', () => { if (strip.dataset.dragged) return; showViewCard(o, c); }); strip.appendChild(c); });
    dragScroll(strip);
    list.appendChild(strip);
  }
  void newStars; // no stars section (2026-10-13, Sevaan)
}
// Mouse drag scrolls a sideways strip (fingers already swipe it). A drag doesn’t count as a tap on a card.
// A small real card for the strips (2026-10-13): the card you’d see in the Collection, with a short status in its footer.
// Every pass bell answers a tap (2026-10-22/23, Sevaan + code review): already up → say so; under 10 min → too soon, head
// out; needs Plus → the Plus page; else choose when. Times are read at the tap, not when the page was drawn. A bell
// already on always opens the sheet (to turn it off).
function bellTap(bell, p, key, done, moment = null) {
  const left = (moment?.t ?? p.start) - now().getTime(), on = bell?.classList.contains('on');
  if (!on && left <= 0) { buzz('warning'); toast('It’s up now · head out and look', 2600); return; }
  if (!on && left < 10 * 60000) { buzz('warning'); toast(`Up in ${Math.max(1, Math.round(left / 60000))} min · too soon for a reminder, head out now`, 2600); return; }
  if (!on && bell?.classList.contains('needs-plus')) { openPlus('reminders'); return; }
  openPassRemind(p, key, done, moment);
}
function stripCard(o, status) {
  const key = cardKeyFor(o), model = state.cardModels.get(key) ?? cardModel(o), sightings = state.sightings.filter((x) => !x.sim && x.cardKey === key);
  return miniCard(model, { sightings, status, locked: !sightings.length });
}
function dragScroll(el) {
  // The window listeners live only for one drag (bug hunt 2026-10-20: two were added per Now-tab visit and never removed,
  // each keeping its old card strip alive).
  let x0 = null, s0 = 0;
  const move = (e) => { if (x0 == null) return; const dx = e.clientX - x0; if (Math.abs(dx) > 5) { el.dataset.dragged = '1'; el.style.scrollSnapType = 'none'; } el.scrollLeft = s0 - dx; };
  const up = () => { removeEventListener('pointermove', move); removeEventListener('pointerup', up); if (x0 == null) return; x0 = null; el.style.scrollSnapType = ''; setTimeout(() => delete el.dataset.dragged, 0); };
  el.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; x0 = e.clientX; s0 = el.scrollLeft; delete el.dataset.dragged; addEventListener('pointermove', move); addEventListener('pointerup', up); });
}

// ---------- All around you (2026-10-21, Sevaan picked design/sky-compass.html D) ----------
// Tap the radar: a 360° strip of your horizon, unrolled. The way you face is in the middle (it turns with the phone),
// height marks up the side, everything up now at its real direction and height (new ones ringed orange), and the next
// good passes as markers on the horizon where they'll rise. Drag it round; tap the big heading to come back to where
// you face; tap anything to close the page and aim at it. The sky loop pauses under panels, so this page moves the
// satellites itself (look() once a second for the ones that were up when it opened).
const AR_FOV = 180; // degrees across the strip
function arCollect() {
  const d = now(), f = frame(d, state.observer), t0 = d.getTime(); arFrame = f;
  const out = [];
  for (const it of state.items) {
    if (!it.look.visible && !it._ar) continue;
    let l = it.look; try { l = look(it.obj, f) ?? l; } catch {}
    if (!l.visible) continue;
    out.push({ kind: 'sat', obj: it.obj, it: { obj: it.obj, look: l }, az: l.az, el: l.el, mag: l.mag, isNew: isNewFind(it.obj) });
  }
  for (const n of state.naturals ?? []) {
    const o = n.obj, l = n.look; if (!l.visible || o.key === 'earth') continue;
    const star = o.natural === 'star', isNew = isNewFind(o);
    if (star && l.mag > 2.2) continue; // the brighter named stars, as quiet dots
    if (o.natural === 'deepsky') continue; // clusters and galaxies stay off this page, as on the sky page
    out.push({ kind: o.type === 'moon' ? 'moon' : o.type === 'sun' ? 'sun' : o.type === 'planet' ? 'planet' : star ? 'star' : 'deep', obj: o, it: n, az: l.az, el: l.el, mag: l.mag, isNew: isNew && !star, starNew: star && isNew });
  }
  const T = null; /* no rise markers on the horizon (2026-10-21, Sevaan: a pass sits on the horizon where it rises, not where you'd see it) */
  if (T) { const seen = new Set(); for (const p of tonightPasses(T, t0)) {
    if (p.start <= t0 || p.start > t0 + 45 * 60000 || !p.fresh || (p.peakEl ?? 0) < 30) continue; /* only passes that climb well clear of the horizon (2026-10-21, Sevaan) */ const k = cardKeyFor(p.obj); if (seen.has(k)) continue; seen.add(k);
    if ((TIER_RANK[(state.cardModels.get(k) ?? p.obj).tier] ?? 0) < 1 && !p.obj.type?.includes('station')) continue;
    out.push({ kind: 'rise', obj: p.obj, p, az: p.riseAz, el: Math.max(0, p.riseEl ?? 0), isNew: true }); if (seen.size >= 2) break; } }
  // What's worth turning for (2026-10-21, Sevaan: 194 things named at once was too much): the Moon, Sun and planets, the
  // next pass or two, and at most 8 satellites: new to you and Uncommon or rarer (Commons only once the rarer ones run
  // low, as everywhere else), rarest then brightest, one per card. Everything else is a faint, unnamed dot.
  const tierN = (o) => TIER_RANK[(state.cardModels.get(cardKeyFor(o)) ?? o).tier] ?? 0;
  if (arLeft.n !== state.sightings.length) { arLeft = { n: state.sightings.length, v: (state.catalog?.objects ?? []).filter((o) => !o.family && tierN(o) >= 1 && isNewFind(o)).length }; }
  const keys = new Set();
  const picks = out.filter((x) => x.kind === 'sat' && x.isNew && x.el >= 12 && (tierN(x.obj) >= 1 || x.obj.type === 'station' || x.obj.icon || arLeft.v < 10))
    .sort((a, b) => tierN(b.obj) - tierN(a.obj) || (a.mag ?? 9) - (b.mag ?? 9))
    .filter((x) => { const k = cardKeyFor(x.obj); if (keys.has(k)) return false; keys.add(k); return true; }).slice(0, 12); /* more on the strip (2026-10-21, Sevaan) */
  for (const x of out) x.worth = x.kind === 'moon' || x.kind === 'sun' || x.kind === 'planet' || x.kind === 'rise' || picks.includes(x);
  arItems = out; arAt = performance.now();
}
function arHeading() {
  let b; try { b = !state.drag.on && hasSensorView() ? trueBasis() : basisFromAzEl(state.drag.az, state.drag.el); } catch {}
  const h = b ? headingOf(b) : state.drag.az ?? 0;
  if (arHeadSm == null) arHeadSm = h; else arHeadSm = (arHeadSm + (((h - arHeadSm + 540) % 360) - 180) * 0.2 + 360) % 360;
  return arHeadSm;
}
const arTierColor = (o) => (TIER_INFO[(state.cardModels.get(cardKeyFor(o)) ?? o).tier] ?? TIER_INFO.common).color;
function arDraw() {
  if (activePanel !== 'around') return;
  if (performance.now() - arAt > 1000) { arCollect(); arLists(); }
  const cv = $('ar-strip'), dpr = Math.min(3, devicePixelRatio || 1), W = cv.clientWidth, H = cv.clientHeight;
  if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
  const face = arHeading(), centre = (face + arPan + 360) % 360, top = 14, hz = H - 34, k = W / AR_FOV;
  const xOf = (az) => W / 2 + ((((az - centre) + 540) % 360) - 180) * k, yOf = (el) => hz - (Math.max(0, el) / 90) * (hz - top);
  // A compass with clicks (2026-10-21, slick idea 09): passing N, E, S or W clicks and lights that letter; something
  // worth a look sliding into your view pings once.
  { const tNow = performance.now();
    // One click per real pass (bug test 2026-10-21: hand tremble across a letter clicked 59 times in 2 s): a letter
    // clicks when the heading crosses it, then re-arms only after the heading has moved 6° away. The phone's turn
    // only, not a drag of the strip (the big heading wouldn't match).
    if (arPrevFace != null) { const d = (((face - arPrevFace) + 540) % 360) - 180;
      for (const c of [0, 90, 180, 270]) { const a0 = (((arPrevFace - c) + 540) % 360) - 180, a1 = a0 + d;
        if (Math.abs(a1) > 6) arArmed[c] = true;
        if (Math.abs(d) < 45 && arArmed[c] !== false && ((a0 < 0 && a1 >= 0) || (a0 > 0 && a1 <= 0))) { arArmed[c] = false; arFlash[c] = tNow; buzz('select'); /* no sound (2026-10-22, Sevaan: "remove the sound from this radar"); the tick and the lit letter stay */ } } }
    arPrevFace = face;
    const inView = new Set(arItems.filter((x) => x.worth && x.kind !== 'rise' && Math.abs((((x.az - face) + 540) % 360) - 180) < 31).map((x) => x.obj.id));
    for (const id of inView) if (!arInView.has(id) && arInView.size + inView.size > 0 && arSeeded) { arPings.set(id, tNow); if (tNow - arPingBuzz > 400) { arPingBuzz = tNow; buzz('light'); } }
    arInView = inView; arSeeded = true; }
  // heading readout
  { const hd = Math.round(face) % 360, t = Math.abs(arPan) > 3 ? `Facing ${compassPoint(face)} · tap to come back` : `Facing ${compassPoint(face)} · ${hd}°`; if ($('ar-deg').textContent !== t) $('ar-deg').textContent = t; } /* a pill on the strip, not a big number (design A, 2026-10-21) */
  // sky + ground
  ctx.save();
  const g = ctx.createLinearGradient(0, top, 0, hz), tn = !state.night && sky.tone?.f > 0.05 ? sky.tone : null; /* by day and at dusk, Explore's own sky colours */ g.addColorStop(0, tn ? tn.a : '#0a1322'); g.addColorStop(1, tn ? tn.b : '#17283f');
  ctx.fillStyle = g; ctx.beginPath(); ctx.rect(0, -20, W, hz + 20); ctx.fill();
  // Explore's own landscape at the same bearings (2026-10-21, Sevaan), night/day colours; off with the tree line.
  stripLandscape(ctx, { W, H, hz, k, vy: 3 * (hz - top) / 90, /* 3× taller than true so it reads; everything in the sky draws over it */ centre, dF: sky.dayF ?? 0, night: state.night, trees: !!state.landscape });
  // height lines
  ctx.strokeStyle = '#1f2f45'; ctx.lineWidth = 1; ctx.fillStyle = '#5e728c'; ctx.font = '500 10px "SC Label", "Arial Narrow", sans-serif';
  for (const e of [30, 60]) { const y = yOf(e); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); ctx.fillText(`${e}°`, 6, y - 4); }
  // where the phone points (the view box) and the facing notch
  const vx = xOf(face), vw = 62 * k * 0.5; ctx.fillStyle = 'rgba(250,129,39,.08)'; ctx.strokeStyle = 'rgba(250,129,39,.45)'; ctx.setLineDash([3, 4]);
  ctx.beginPath(); ctx.rect(vx - vw, 1, vw * 2, H - 2); ctx.fill(); ctx.stroke(); ctx.setLineDash([]); /* top to bottom (2026-10-21, Sevaan) */
  // compass letters along the bottom
  ctx.textAlign = 'center'; ctx.font = '500 12px "SC Label", "Arial Narrow", sans-serif';
  const PTS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  for (let a = 0; a < 360; a += 15) { const x = xOf(a); if (x < -20 || x > W + 20) continue; const major = a % 45 === 0;
    ctx.strokeStyle = major ? '#8a97a8' : '#3a4c66'; ctx.beginPath(); ctx.moveTo(x, hz + 6); ctx.lineTo(x, hz + (major ? 13 : 9)); ctx.stroke();
    if (major) { const fl = arFlash[a] != null ? Math.max(0, 1 - (performance.now() - arFlash[a]) / 450) : 0;
      ctx.save(); if (fl > 0) { ctx.shadowColor = '#fa8127'; ctx.shadowBlur = 12 * fl; ctx.font = `600 ${12 + 4 * fl}px "SC Label", "Arial Narrow", sans-serif`; }
      ctx.fillStyle = fl > 0 ? '#ffffff' : Math.abs(((a - face + 540) % 360) - 180) < 23 ? '#fa8127' : '#bdbea9'; ctx.fillText(PTS[a / 45], x, hz + 27); ctx.restore(); } }
  // things
  const r = Object.create(Object.getPrototypeOf(sky)); r.ctx = ctx;
  arHits = []; const labels = [], arIcons = [];
  const order = [...arItems].sort((a, b) => (a.kind === 'star') - (b.kind === 'star') || (b.isNew - a.isNew));
  for (const it of order.reverse()) {
    const x = xOf(it.az); if (x < -14 || x > W + 14) continue; const y = it.kind === 'rise' ? hz - 6 : yOf(it.el);
    ctx.save();
    if (it.kind === 'star') { const s = Math.max(1.2, 3 - it.mag * 0.9); ctx.fillStyle = '#fff2b3'; ctx.globalAlpha = .55; /* stars stay quiet: you find them by panning the circle */ ctx.beginPath(); ctx.arc(x, y, s, 0, 7); ctx.fill(); if (it.mag < 1.0) labels.push({ x, y, t: label(it.obj), c: '#bdbea9', s: 10 }); }
    else if ((it.kind === 'moon' || it.kind === 'planet') && arArt(it.obj)) { const img = arArt(it.obj), S = 30; ctx.save(); ctx.beginPath(); ctx.roundRect(x - S / 2, y - S / 2, S, S, 7); ctx.clip(); arCover(ctx, img, x - S / 2, y - S / 2, S); ctx.restore(); ctx.strokeStyle = it.isNew ? arTierColor(it.obj) : '#e9dfb8'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.roundRect(x - S / 2, y - S / 2, S, S, 7); ctx.stroke(); arIcons.push([x - S / 2 - 2, y - S / 2 - 2, S + 4, S + 4]); labels.push({ x: x + 6, y, t: label(it.obj), c: it.kind === 'planet' ? '#f2c14e' : '#fff2b3', s: 11 }); }
    else if (it.kind === 'moon' || it.kind === 'sun') { ctx.fillStyle = it.kind === 'sun' ? '#ffd27a' : '#fff2b3'; ctx.beginPath(); ctx.arc(x, y, 8, 0, 7); ctx.fill(); labels.push({ x, y, t: `${label(it.obj)} ${Math.round(it.el)}°`, c: '#fff2b3', s: 11 }); }
    else if (it.kind === 'planet' || it.kind === 'deep') { ctx.fillStyle = '#f2c14e'; ctx.beginPath(); ctx.arc(x, y, it.kind === 'deep' ? 3 : 4, 0, 7); ctx.fill(); if (it.isNew) { ctx.strokeStyle = '#fa8127'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, 9, 0, 7); ctx.stroke(); } labels.push({ x, y, t: `${label(it.obj)} ${Math.round(it.el)}°`, c: it.isNew ? '#fa8127' : '#f2c14e', s: 11 }); }
    else if (it.kind === 'rise') { ctx.strokeStyle = '#6aa8ff'; ctx.setLineDash([2, 2]); ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(x, y, 7, 0, 7); ctx.stroke(); ctx.setLineDash([]); labels.push({ x, y: y - 6, t: `${label(it.obj)} ${fmtTime(it.p.start)}`, c: '#6aa8ff', s: 10.5 }); }
    else if (!it.worth) { try { r.drawIcon(sky.iconKind(it.obj), x, y, 9, it.isNew ? 'rgba(255,242,179,.5)' : 'rgba(255,242,179,.3)'); } catch { ctx.fillStyle = '#fff2b3'; ctx.globalAlpha = .28; ctx.beginPath(); ctx.arc(x, y, 1.4, 0, 7); ctx.fill(); } } /* every satellite up shows as its small icon (2026-10-21, Sevaan: show more) */
    else { const img = arArt(it.obj); /* its card picture on the sky (design A, 2026-10-21) */
      if (img) { const S = 30; ctx.save(); ctx.beginPath(); ctx.roundRect(x - S / 2, y - S / 2, S, S, 7); ctx.clip(); arCover(ctx, img, x - S / 2, y - S / 2, S); ctx.restore();
        ctx.save(); if (it.isNew) { ctx.shadowColor = arTierColor(it.obj); ctx.shadowBlur = 10; } ctx.strokeStyle = it.isNew ? arTierColor(it.obj) : '#e9dfb8'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.roundRect(x - S / 2, y - S / 2, S, S, 7); ctx.stroke(); ctx.restore();
        labels.push({ x: x + 6, y, t: label(it.obj), c: it.isNew ? arTierColor(it.obj) : '#fff2b3', s: 11 }); }
      else { const col = it.isNew ? '#fff2b3' : 'rgba(255,242,179,.55)'; try { r.drawIcon(sky.iconKind(it.obj), x, y, it.isNew ? 15 : 11, col); } catch { ctx.fillStyle = col; ctx.fillRect(x - 2, y - 2, 4, 4); }
        if (it.isNew) { ctx.strokeStyle = arTierColor(it.obj); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, 11, 0, 7); ctx.stroke(); labels.push({ x, y, t: label(it.obj), c: arTierColor(it.obj), s: 11 }); } } }
    ctx.restore();
    if (it.worth) arHits.push({ x, y, it });
    { const pt = arPings.get(it.obj.id); if (pt != null) { const k2 = (performance.now() - pt) / 650; if (k2 >= 1) arPings.delete(it.obj.id); else { ctx.save(); ctx.strokeStyle = '#fa8127'; ctx.globalAlpha = 1 - k2; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, 10 + 22 * k2, 0, 7); ctx.stroke(); ctx.restore(); } } }
  }
  // labels: right of the thing, nudged down when they'd overlap
  ctx.textAlign = 'left'; const placed = [];
  for (const l of labels) { ctx.font = `500 ${l.s}px "SC Label", "Arial Narrow", sans-serif`; const w = ctx.measureText(l.t).width; let lx = l.x + 12, ly = l.y + 4; if (lx + w > W - 4) lx = l.x - 12 - w;
    const hit = () => placed.some((p) => lx < p.x + p.w + 4 && lx + w + 4 > p.x && Math.abs(ly - p.y) < 13) || arIcons.some(([ix, iy, iw, ih]) => Math.abs(ix + iw / 2 - l.x) > 8 && lx < ix + iw && lx + w > ix && ly - l.s < iy + ih && ly + 3 > iy); /* nor over another picture (iPad/Duo playtest 2026-10-24: the Moon's name on Saturn) */
    if (hit()) ly += 13; if (hit()) ly -= 26; if (hit()) continue; // no room: no label, never a pile of names
    placed.push({ x: lx, y: ly, w }); ctx.fillStyle = 'rgba(8,15,27,.7)'; ctx.fillRect(lx - 2, ly - l.s + 1, w + 4, l.s + 3); ctx.fillStyle = l.c; ctx.fillText(l.t, lx, ly); }
  ctx.restore();
  arRaf = requestAnimationFrame(arDraw);
}
// Card pictures for the strip and the card row (small art), loaded once and drawn when ready.
const arImgs = new Map();
// The middle square of a (4:3) card picture, never stretched (2026-10-21, Sevaan: the Moon looked squished).
function arCover(ctx, img, x, y, S) { const w = img.naturalWidth, h = img.naturalHeight, m = Math.min(w, h); ctx.drawImage(img, (w - m) / 2, (h - m) / 2, m, m, x, y, S, S); }
function arArt(o) {
  let src = null; try { src = artImage(cardModel(o), 'small'); } catch {} if (!src) return null;
  let im = arImgs.get(src); if (!im) { im = new Image(); im.decoding = 'async'; im.src = src; arImgs.set(src, im); }
  return im.complete && im.naturalWidth ? im : null;
}
function arLists() {
  const face = arHeadSm ?? 0, rel = (az) => (((az - face) + 540) % 360) - 180;
  const rows = arItems.filter((x) => x.worth).map((x) => ({ ...x, d: rel(x.az) })); // only what's worth turning for
  const score = (x) => (x.isNew ? 0 : 1) * 1000 + Math.abs(x.d);
  // Worth a look (design A, 2026-10-21): a row of small cards, what's ahead first, then round you. Tap one to aim.
  const fresh = rows.filter((x) => x.kind !== 'star').sort((a, b) => (a.kind === 'rise') - (b.kind === 'rise') || Math.abs(a.d) - Math.abs(b.d));
  // The order holds while the page is open (2026-10-21, Sevaan: the cards swapped places as he turned): cards keep their
  // place, gone ones drop out, new ones join at the end. Fresh order again next time it opens.
  const keyOf = (x) => `${x.obj.id}|${x.kind}`, byKey = new Map(fresh.map((x) => [keyOf(x), x]));
  arCardOrder = [...(arCardOrder ?? []).filter((k) => byKey.has(k)), ...fresh.map(keyOf).filter((k) => !(arCardOrder ?? []).includes(k))];
  const order = arCardOrder.map((k) => byKey.get(k));
  const side = (d) => (Math.abs(d) < 25 ? 'Ahead' : Math.abs(d) > 140 ? 'Behind you' : d < 0 ? 'To your left' : 'To your right');
  const card = (x) => { const o = x.obj, src = (() => { try { return artImage(cardModel(o), 'small'); } catch { return null; } })(), tier = TIER_INFO[(state.cardModels.get(cardKeyFor(o)) ?? o).tier] ?? TIER_INFO.common;
    const sub = x.kind === 'rise' ? `Rises ${fmtTime(x.p.start)} · ${dirWord(x.az)}` : `${side(x.d)} · ${heightWord(x.el)}`;
    return `<button type="button" class="ar-card${x.isNew ? ' new' : ''}" style="--tier:${tier.color}" data-i="${arItems.indexOf(arItems.find((y) => y.obj === o && y.kind === x.kind))}"><span class="ac-art"${src ? ` style="background-image:url('${src}')"` : ''}></span><b>${escapeHtml(label(o))}</b><small>${escapeHtml(sub)}</small>${x.isNew ? `<em>${newWord(o)}</em>` : ''}</button>`; };
  const fh = order.map(card).join('');
  if ($('ar-front')._h !== fh) { $('ar-front').innerHTML = fh || '<p class="hint small">Nothing worth turning for right now. Satellites come in waves, so check back in a few minutes.</p>'; $('ar-front')._h = fh; }
  const T = state.tonight, t0 = now().getTime(), nUp = arItems.filter((x) => x.kind !== 'rise' && x.kind !== 'star').length, nNew = arItems.filter((x) => x.isNew && x.kind !== 'rise' && x.kind !== 'star').length; // one set for both numbers (UX playtest: '6 · 9 new')
  const moon = arItems.find((x) => x.kind === 'moon'), wx = tonightWeather();
  const nWorth = arItems.filter((x) => x.worth && x.kind !== 'star').length; /* the same things as the Worth a look cards (iPad playtest 2026-10-24: 2 vs 3) */ void nNew;
  // One panel, four parts (2026-10-21, Sevaan: "these could look better"): an icon and label, one big value, a short
  // line under it, thin dividers between. Heights in words; the Moon drawn at its real phase.
  const moonSvg = (f) => { const r = 9, k = Math.max(0, Math.min(1, f)), dx = k * 2 * r; /* the shadow slides off as it fills */ return `<svg class="ap-moon" viewBox="-10 -10 20 20" aria-hidden="true"><circle r="${r}" fill="#2a3446"/><clipPath id="apm"><circle r="${r}"/></clipPath><g clip-path="url(#apm)"><circle r="${r}" fill="#fff2b3"/><circle cx="${-dx}" r="${r}" fill="#2a3446"/></g></svg>`; };
  // One word big, the rest under it (playtest 2026-10-22: "Cloud now, clearing" was cut to "Clou…").
  const sky = wx ? (() => { const m = /^(\S+)\s*(.*)$/.exec(wx.line) ?? []; return { big: m[1] || wx.line, sub: m[2] || (wx.ok ? 'all evening' : '') }; })() : null;
  const darkNow = T?.dawn > t0 && (state.frame?.sunEl ?? 0) < -6;
  const parts = [
    { k: 'Up now', ic: '<span class="ico" data-ico="ring"></span>', big: String(nUp), sub: `${nWorth} worth a look` },
    darkNow ? { k: 'Dark till', ic: '<span class="ico" data-ico="stars"></span>', big: fmtTime(T.dawn).replace(/\s?([AP]M)$/i, '<i>$1</i>'), sub: 'then dawn' } : T?.dusk > t0 ? { k: 'Dark at', ic: '<span class="ico" data-ico="stars"></span>', big: fmtTime(T.dusk).replace(/\s?([AP]M)$/i, '<i>$1</i>'), sub: 'tonight' } : null,
    moon ? { k: 'Moon', ic: moonSvg(moon.it.look.illum ?? 0), big: `${Math.round((moon.it.look.illum ?? 0) * 100)}<i>%</i>`, sub: heightWord(moon.el) } : null,
    sky ? { k: 'Sky', ic: `<span class="ico" data-ico="${wx.ok ? 'stars' : 'cloud'}"></span>`, big: escapeHtml(sky.big), sub: escapeHtml(sky.sub) } : null,
  ].filter(Boolean);
  const ch = parts.map((x) => `<div class="ap"><span class="ap-k">${x.ic}${x.k}</span><b${x.k === 'Sky' && x.big.replace(/<[^>]*>/g, '').length > 6 ? ' class="long"' : ''}>${x.big}</b><small>${x.sub}</small></div>`).join(''); if ($('ar-chips')._h !== ch) { $('ar-chips').innerHTML = ch; $('ar-chips')._h = ch; $('ar-chips').style.setProperty('--n', parts.length); }
}
function arAim(x) {
  if (!x) return;
  if (x.kind === 'rise') { closePanel('around'); setTimeout(() => showMePass(x.p), 320); return; }
  const it = x.it?.look ? x.it : { obj: x.obj, look: { az: x.az, el: x.el } };
  cancelPassSearch(); state.pinnedId = it.obj.id; state.targetId = it.obj.id;
  if (state.drag.on || !hasSensorView()) { state.drag.on = true; state.drag.az = it.look.az; state.drag.el = it.look.el; state.dragFollow = { id: it.obj.id, until: performance.now() + 8000 }; }
  closePanel('around');
}
function openAround() {
  if (activePanel === 'visible') closePanel('visible');
  arPan = 0; arHeadSm = null; arPrevFace = null; arCardOrder = null; arInView = new Set(); arPings.clear(); arSeeded = false; arHeading(); arCollect(); openPanel('around'); arLists(); // heading first, so the lists are right from the start
  cancelAnimationFrame(arRaf); arRaf = requestAnimationFrame(arDraw);
}
(() => {
  const cv = $('ar-strip'); let x0 = null, p0 = 0, moved = false;
  cv.addEventListener('pointerdown', (e) => { x0 = e.clientX; p0 = arPan; moved = false; cv.setPointerCapture?.(e.pointerId); });
  cv.addEventListener('pointermove', (e) => { if (x0 == null) return; const dx = e.clientX - x0; if (Math.abs(dx) > 6) moved = true; if (moved) arPan = p0 - dx / (cv.clientWidth / AR_FOV); });
  cv.addEventListener('pointerup', (e) => { if (x0 == null) return; x0 = null; if (moved) return;
    const r = cv.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top;
    const hit = arHits.map((h) => ({ h, d: Math.hypot(h.x - px, h.y - py) })).sort((a, b) => a.d - b.d)[0];
    if (hit && hit.d < 26) { buzz('select'); arAim(hit.h.it); } });
  cv.addEventListener('pointercancel', () => { x0 = null; });
  $('ar-head').addEventListener('click', () => { arPan = 0; });
  $('ar-front').addEventListener('click', (e) => { const b = e.target.closest('.ar-card'); if (b) arAim(arItems[Number(b.dataset.i)]); });
})();

$('radar').addEventListener('click', () => { if (collectionOpen || performance.now() < navBusyUntil) return; openAround(); }); /* not mid page change: tapped as the Collection rose, it opened under it and left the header wrong (web playtest 2026-10-24) */ // the big compass: All around you (2026-10-21, Sevaan picked design/sky-compass.html D)

// ---------- tonight planner ----------
// js/tonight-worker.js forecasts every visible pass from now to dawn (same visibility rules as the live sky).
// The visible panel’s Tonight tab shows when satellites are up, a chart, the passes worth looking for, and
// what else is up (planets, constellations with stars you still need). When nothing is lit, a chip under
// the radar says when the next good pass is.
let tonightWorker = null, tonightReq = 0, tonightBusy = false, lastChip = 0;
const fmtTime = (ms) => { const t = new Date(ms).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); return /^\d:\d\d$/.test(t) ? `0${t}` : t; }; // 24-hour clocks write 01:50, not 1:50 beside 18:36 (flow playtest 2026-10-25)
let tonightAgain = false;
let tonightSentKey = '';
// Tonight's plan is kept (2026-10-21, Sevaan: the loading state "sucks"): the last finished plan for this place and sky
// shows at once on the next open the same night, while a fresh one is worked out behind it.
function tonightCacheKey() { return [state.observer.lat.toFixed(2), state.observer.lon.toFixed(2), state.skySb, state.binoculars ? 1 : 0].join('|'); }
function saveTonightCache(T) { try { localStorage.setItem('tonightCache', JSON.stringify({ k: tonightCacheKey(), T })); } catch { try { localStorage.removeItem('tonightCache'); } catch {} } }
function loadTonightCache() {
  try { const c = JSON.parse(localStorage.getItem('tonightCache') ?? 'null'); const t = now().getTime();
    if (!c || c.k !== tonightCacheKey() || !c.T?.passes || !(c.T.dawn > t) || t - c.T.startMs > 14 * 3600e3) return null; return c.T; } catch { return null; }
}
function requestTonight(force = false) {
  if (!state.catalog || !state.observer) return;
  if (!state.tonight && !force) { const c = loadTonightCache(); if (c) { state.tonight = c; dealMissions(c); chooseWeek(); shareTonight(c); if (!$('vtab-tonight').hidden) renderTonight(); } }
  if (tonightBusy) { if (force) tonightAgain = true; return; } // a forced refresh while one runs goes next (QA 2026-10-08)
  const T = state.tonight;
  if (!force && T && Math.abs(now().getTime() - T.startMs) < 20 * 60000 && T.sb === state.skySb && T.lat === state.observer.lat && T.lon === state.observer.lon && T.bino === state.binoculars) return;
  tonightBusy = true;
  const requestId = ++tonightReq, startMs = now().getTime();
  // Stamp the plan with what it was worked out for, not what’s current when it arrives (QA 2026-10-08: a location fix
  // landing mid-run left Peterborough’s plan labelled as yours for 20 minutes).
  const asked = { sb: state.skySb, lat: state.observer.lat, lon: state.observer.lon, bino: state.binoculars };
  try {
    tonightWorker ??= new Worker(new URL(`./tonight-worker.js?v=${VERSION}`, import.meta.url), { type: 'module' });
    tonightWorker.onmessage = ({ data }) => {
      if (data.requestId !== tonightReq) return;
      if (data.progress) { tonightProgress = data.progress; if (!state.tonight && !$('vtab-tonight').hidden) renderTonightLoading(); return; }
      tonightBusy = false;
      if (data.error) return;
      state.tonight = { ...data, ...asked }; tonightProgress = null; chooseWeek(); /* the week's theme is fixed by the first plan of the week, so a week done before Tonight was opened can't change theme under it (bug hunt 2026-10-26) */ recordSkyNights(); saveTonightCache(state.tonight);
      dealMissions(state.tonight); shareTonight(state.tonight);
      if (!$('vtab-tonight').hidden) renderTonight();
      lastChip = 0;
      const stale = asked.sb !== state.skySb || asked.lat !== state.observer.lat || asked.lon !== state.observer.lon || asked.bino !== state.binoculars;
      if (tonightAgain || stale) { tonightAgain = false; requestTonight(true); }
    };
    tonightWorker.onerror = () => { tonightBusy = false; };
    const base = skyLimit({ sb: state.skySb }), faintest = (state.binoculars ? base.binoculars : base.satellites) + 0.5;
    const key = `${faintest.toFixed(2)}|${state.catalog.objects.length}`, fresh = key !== tonightSentKey;
    const objects = fresh ? state.catalog.objects.filter((o) => o.stdMag + 5 * Math.log10(Math.max(o.perigee ?? 400, 200) / 1000) <= faintest) : undefined;
    tonightSentKey = key; // the worker keeps the list; only a new limit or catalogue sends it again
    tonightWorker.postMessage({ requestId, objects: objects && toWorker(objects), observer: state.observer, startMs, sb: state.skySb, binoculars: state.binoculars, progress: true });
  } catch { tonightBusy = false; }
}
// Tonight’s missions come only from ones you could do from here (playtest 2026-10-09): from tonight’s passes, work
// out which missions have something to catch, deal three from those, and keep that deal for the night (localStorage
// missionDeals) so scoring and every screen agree. Dealt once per night; the first night keeps the starter set.
// Share tonight’s catchable passes with Collection (playtest 2026-10-09, #9/#10): Discover leads with them and a small
// collection shows "Up tonight" slots. localStorage tonightPlan, plus a nudge to the frame if it’s loaded.
function shareTonight(T) {
  scheduleNotes(T).catch(() => {});
  const passes = tonightPasses(T, now().getTime()).filter((p) => p.fresh).slice(0, 80)
    .map((p) => ({ key: cardKeyFor(p.obj), id: p.obj.id, start: p.start, end: p.end, peakEl: p.peakEl, dir: compassPoint(p.peakAz) }));
  try { localStorage.setItem('tonightPlan', JSON.stringify({ at: Date.now(), passes })); } catch {}
  if (colLoaded) colFrame.contentWindow?.postMessage({ sc: 'tonight' }, location.origin);
  shareWidgets();
  if (widgetLink) setTimeout(() => widgetLink && openWidgetLink(widgetLink), 800);
}
// Widgets (2026-10-22, Sevaan; design/widgets.html, style A): the iPhone widgets run off a plan the app hands them, since
// they can't run this code. shareWidgets() builds it from tonight's plan and the forecast and passes it to the native
// Widgets plugin (native/ios/App/App/WidgetBridge.swift), which saves it in the shared App Group, copies the small card
// pictures beside it and reloads the widgets (native/ios/App/SCWidgets). `chain` is the next catch moment by moment,
// worked out here with the Now hero's own rule (tonight's headliner while it's ahead and new to you, else the best catch)
// so the widget and the app never disagree. Free: the small widget. Plus: medium, large and the lock screen (plus).
// Widget-sized names (iOS playtest 2026-10-22: "Internatio/nal Space Station" split mid-word, "SL-8 Rocket…" twice).
const widgetName = (o) => yearLabel(o).replace(/^International Space Station\b/, 'Space Station').replace(/ Rocket Stage\b/, ' stage').replace(/ \((?:Zarya|ZARYA)\)/, '');
let widgetLink = null;
function openWidgetLink(url) {
  const m = /^spacecollector:\/\/(\w+)\/?(.*)$/.exec(url || ''); if (!m) return;
  if (!state.tonight || !$('start').hidden || document.body.classList.contains('ob-tour')) { widgetLink = url; return; } // not before the sky is up
  widgetLink = null;
  const [, what, arg] = m;
  if (what === 'plus') { openPlus('widgets'); return; }
  if (what === 'tonight') { openSky('tonight'); return; }
  if (what !== 'pass') return;
  const [id, start] = decodeURIComponent(arg).split('@'), p = state.tonight.passes.find((x) => String(x.id) === id && x.start === Number(start)), obj = p && state.byId.get(p.id);
  if (!obj || p.end < now().getTime()) { openSky('tonight'); return; } // gone by: tonight's plan instead
  const away = collectionOpen || !!activePanel; if (away) $('nav-explore').click(); // back to the sky first, the usual way
  if (!$('ob-done').hidden) $('od-close').click(); // over the Tonight page too
  setTimeout(() => showMePass({ ...p, obj }), away ? 600 : 50);
}
let widgetT = 0;
function shareWidgets() { if (!isNative()) return; clearTimeout(widgetT); widgetT = setTimeout(() => sendWidgets().catch(() => {}), 1500); }
async function sendWidgets() {
  const T = state.tonight; if (!T || Math.abs(now().getTime() - Date.now()) > 60000) return; // not while time-travelling
  const t0 = Date.now(), eve = eveningEnd(T), dawn = T.dawn ?? eve;
  const tierN = (o) => TIER_RANK[cardModel(o).tier] ?? 0, TIERS5 = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
  const arts = new Set();
  const passOf = (p, kick) => { const m = cardModel(p.obj), art = artImage(m, 'small'); if (art) arts.add(art);
    return { key: `${p.obj.id}@${p.start}`, name: widgetName(p.obj), tier: TIERS5[tierN(p.obj)], icon: !!(p.obj.icon || p.obj.type === 'station'), art: art ? art.split('/').pop().replace(/\.webp$/, '') : null,
      start: p.start, end: Math.max(p.end ?? 0, p.start + 2 * 60000), where: whereWords({ el: p.peakEl, az: p.peakAz }), short: `${p.peakEl >= 60 ? 'High' : p.peakEl >= 30 ? 'Halfway' : 'Low'} · ${compassPoint(p.peakAz)}`, kick, cloud: cloudAt(p.start) }; };
  // The next catch, moment by moment until dawn.
  const chain = []; let t = t0;
  for (let i = 0; i < 14 && t < dawn; i++) {
    const head = headliner(T), isHead = !!head && head.start > t && isNewFind(head.obj);
    const p = isHead ? head : bestUpcoming(T, t, readPref('nightOwl', false) ? dawn : Math.max(eve, t + 3 * 3600e3));
    if (!p) break;
    chain.push({ from: t, pass: passOf(p, isHead ? 'headliner' : 'next') }); t = (p.end ?? p.start) + 60000;
  }
  // The passes after it (medium) and the run (large): new to you, the app's usual pool.
  const fresh = tonightPasses(T, t0).filter((p) => p.fresh && p.start > t0);
  const leftBetter = (state.catalog?.objects ?? []).filter((o) => !o.family && tierN(o) >= 1 && isNewFind(o)).length;
  const pool = leftBetter >= 10 ? fresh.filter((p) => tierN(p.obj) >= 1) : fresh;
  const once = (ps) => { const seen = new Set(), out = []; for (const p of ps) { const k = cardKeyFor(p.obj); if (!seen.has(k)) { seen.add(k); out.push(p); } } return out; };
  const uniq = once(pool.filter((p) => p.start <= eve)), all = once(fresh.filter((p) => p.start <= eve)); // the haul counts every new card this evening, like the Tonight page (iOS playtest: 35 vs 201)
  // The medium widget's rows: one pass per card, through the whole night (2026-10-22, Sevaan: on a busy night the first
  // 24 passes were all before the headliner, so the widget said "Nothing else new tonight" at 6 PM).
  const list = once(pool).slice(0, 80).map((p) => passOf(p, 'next'));
  const run = varied(uniq.slice().sort((a, b) => tierN(b.obj) - tierN(a.obj) || a.start - b.start), 4).sort((a, b) => a.start - b.start).map((p) => passOf(p, 'next'));
  const n5 = [0, 0, 0, 0, 0]; for (const p of all) n5[tierN(p.obj)]++;
  const top = n5.findLastIndex((n, i) => i >= 2 && n > 0);
  // Busyness from dusk to dawn in 16 bars.
  const a = T.dusk ?? T.startMs, b = dawn, bars = Array(16).fill(0);
  for (const [tt, c] of T.curve ?? []) { if (tt < a || tt >= b) continue; const i = Math.min(15, Math.floor((tt - a) / (b - a) * 16)); bars[i] = Math.max(bars[i], c); }
  const wx = tonightWeather(), pr = (() => { try { return progressNow(state.sightings); } catch { return null; } })();
  const back = tonightPasses(T, t0).find((p) => p.start > (chain.at(-1)?.pass.end ?? t0)) ?? null;
  const plan = { v: 1, clock: (() => { try { return localStorage.getItem('clock') || 'auto'; } catch { return 'auto'; } })(), at: t0, place: state.observer?.place || (state.observer?.label && !/^(current|chosen) location$/i.test(state.observer.label) ? state.observer.label.replace(/^Example:\s*/, '') : ''), plus: isPlus(), dusk: T.dusk ?? null, dawn, eve,
    chain, list, run, back: back ? back.start : null,
    haul: { n: all.length, top: top >= 2 ? TIERS5[top] : null, topN: top >= 2 ? n5[top] : 0 },
    bars, wx: wx ? { ok: !!wx.ok, line: wx.line, next: wx.nextClear ? dayWord(wx.nextClear) : '' } : null,
    missions: pr?.missions ? pr.missions.filter((m) => !m.done).length : 0 };
  await plugin('Widgets').save({ plan: JSON.stringify(plan), art: [...arts] });
}
// Which passes get an alert (2026-10-11, Sevaan: "we should only ever notify for stuff new to the collection… I don’t
// want people to wake up to tons of notifications overnight… limited… the most interesting first… not common or
// uncommon until they are running low on all the other rarities"):
//   · new to your collection only (a card you don’t have, or a fleet launch you haven’t stamped)
//   · never in quiet hours (11 pm – 7 am local)
//   · at most 3 a night, the most interesting first: Legendary, Epic, Rare, then brightness and height
//   · Common and Uncommon (and fleet stamps) only once fewer than 10 Rare-or-better cards are left that you could get
//   · at least 30 minutes apart
//   · never when the forecast says fog, rain, snow or cloud for that hour (2026-10-12, Sevaan got one in fog); rechecked
//     whenever the forecast refreshes, and the push relay checks the weather again just before sending
const ALERT_IDS = [7101, 7102, 7103]; // the retired automatic pass alerts: cancelled if still scheduled (2026-10-14)
// Pass alert wording (2026-10-10, Sevaan: "who cares about the degrees"). Lead with what it is (how old, whose, what for),
// then where to look in plain words. Title: "A 1979 American weather satellite at 8:13 PM". Body: "NOAA 6 rises in the
// south and climbs almost straight overhead. New to your collection."
const WORD = { N: 'north', NE: 'northeast', E: 'east', SE: 'southeast', S: 'south', SW: 'southwest', W: 'west', NW: 'northwest' };
const dirWord = (az) => WORD[compassPoint(az)] ?? compassPoint(az);
// "High in the west": where to look in words, not degrees (writing room 2026-10-12).
// "1 object up at once" / "32 objects up at once" (bug hunt 2026-10-17: "Busiest: 1 objects"). A busiest moment needs 3+.
// Rocket stages and debris share names (a dozen "SL-8 Rocket Stage"s): in Tonight’s lists they carry their launch year so
// two of them don’t read as a duplicate (playtest 2026-10-17).
function yearLabel(o) { const n = label(o); if (!['rocket-body', 'debris'].includes(o.type)) return n; const y = String(cardModel(o).launch ?? o.launch ?? o.year ?? '').slice(0, 4); return /^\d{4}$/.test(y) ? `${n} · ${y}` : n; }
const upOnce = (n) => `${n} ${n === 1 ? 'object' : 'objects'} up at once`;
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
  if (o.type === 'station') return /ISS|ZARYA/.test(o.name) ? 'The Space Station' : `China’s Tiangong station`;
  if (o.family) return stamp ? `A new ${card.familyName ?? 'fleet'} launch to stamp` : `One of the ${card.familyName ?? 'fleet'} fleet`;
  if (o.type === 'debris') return `A piece of ${year ? `${Math.floor(year / 10) * 10}s ` : ''}space junk`;
  if (o.type === 'rocket-body') return `A ${[year, adj].filter(Boolean).join(' ')} rocket stage`;
  return `A ${[year, adj].filter(Boolean).join(' ')} ${PURPOSE_WORD.find(([re]) => re.test(o.name))?.[1] ?? 'satellite'}`;
}
function alertText(p) {
  // Time first, so the lock screen never cuts it off; then where to look and why it matters (2026-10-17, Sevaan’s
  // writing agent: "9:02 PM: a rare find" / "Look south for Hubble. You haven’t collected this one yet.").
  const o = p.obj, card = state.cardModels.get(cardKeyFor(o)) ?? o, when = fmtTime(p.start), rise = dirWord(p.riseAz);
  const title = `${when}: ${o.family ? `a new ${card.familyName ?? 'fleet'} batch` : 'a rare find'}`;
  return { title, body: o.family ? `Look ${rise} for ${label(o)}. One more for your ${card.familyName ?? 'fleet'} card.` : `Look ${rise} for ${label(o)}. You haven’t collected this one yet.` };
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
  // The fifteen added 2026-10-25: dealt only when tonight can give them.
  const EUR = ['FR', 'ESA', 'UK', 'GER', 'IT', 'EUME', 'EUTE', 'SPN', 'NETH', 'SWED', 'NOR', 'DEN', 'BEL', 'POL', 'CZ', 'POR', 'LUXE', 'FIN'];
  if (has((o) => o.owner === 'PRC')) can.add('china');
  if (has((o) => year(o) >= 1960 && year(o) < 1970)) can.add('sixties');
  if (has((o) => year(o) >= 1980 && year(o) < 1990)) can.add('eighties');
  if (T.passes.some((p) => p.eclipseAt && (p.eclipseEl ?? 0) > 20)) can.add('fade');
  if (T.passes.some((p) => p.peakEl >= 20 && p.end - p.start > 120e3 && isNewFind(state.byId.get(p.id) ?? {}))) can.add('peak');
  if ((state.bodies ?? []).some((b) => b.kind === 'moon' && (b.illum ?? 0) > 0.1) && (state.naturals ?? []).some((n) => n.obj.key === 'moon' && n.look.visible)) can.add('moon');
  if (T.passes.some((p) => p.peakEl < 20)) can.add('low');
  if (has((o) => [25544, 48274].includes(o.id))) can.add('station');
  if (new Set(objs.filter((o) => o.type !== 'rocket-body' && o.type !== 'debris').map((o) => o.id)).size >= 6) can.add('sats3');
  if (new Set(objs.map((o) => countryOf(o.owner))).size >= 4) can.add('nations3');
  if (T.passes.some((p) => new Date(p.start).getHours() < 4)) can.add('late');
  if (new Set(objs.filter((o) => o.type === 'debris').map((o) => o.id)).size >= 3) can.add('debris2');
  if (has((o) => EUR.includes(o.owner))) can.add('europe');
  if (has((o) => ['JPN', 'IND'].includes(o.owner))) can.add('asia');
  if ((state.naturals ?? []).filter((n) => n.obj.type === 'planet' && n.look.visible).length >= 2) can.add('planets2');
  deals[night] = missionsFor(night, can).map((m) => m.id);
  const keep = Object.keys(deals).sort((a, b) => Number(b) - Number(a)).slice(0, 90);
  try { localStorage.setItem('missionDeals', JSON.stringify(Object.fromEntries(keep.map((k) => [k, deals[k]])))); } catch {}
}
// One page (2026-10-21, Sevaan; design/sky-page-3.html): Now and Tonight together, every section kept, with jump chips
// pinned under the title. showVTab(tab) renders both and scrolls to that part ('now' = the top, 'tonight', or any
// chip's name); the chips light up as you scroll.
const SKY_JUMPS = [['now', 'Now', null], ['coming', 'Coming up', 'sj-coming'], ['tonight', 'Tonight', 'sky-tonight-head'], ['shiny', '✦ Shiny', 'sj-shiny'], ['missions', 'Missions', 'sj-missions'], ['all', 'All passes', 'sj-all']];
// Wide screens (iPhone Duo unfolded, iPads; 2026-10-22, design/duo-layouts.html, Sevaan: "go with your picks"): the
// Tonight page is a book, what's up now on the left page and the plan for later on the right (upright: top and bottom),
// each page scrolling on its own ([data-col]); Settings is an index of its groups beside the chosen group. Same sizes
// as the book block in css/app.css; phones never match.
const bookQ = matchMedia('(min-width: 820px) and (min-height: 560px) and (orientation: landscape), (min-width: 600px) and (min-height: 900px) and (orientation: portrait)');
let skyCol = null, skyLiveSec = 'now'; // the book page last scrolled, and the section in view (kept up to date so a fold/unfold can land on it)
function skySection() {
  const book = bookQ.matches, sc = book ? (skyCol ?? $('vtab-now')) : $('visible');
  const later = book && sc === $('sky-later'); if (later && sc.scrollTop < 4) return 'tonight';
  const top = sc.getBoundingClientRect().top + (book ? 0 : $('sky-jump').offsetHeight) + 40; let on = later ? 'tonight' : 'now';
  for (const [k, , id] of SKY_JUMPS) { const el = id && $(id); if (el && sc.contains(el) && el.getBoundingClientRect().top <= top) on = k; }
  return on;
}
// A page's place: its own scroll and each book page's. Coming back in the other layout (folded or unfolded meanwhile)
// lands on the same section instead.
const panelPos = (id) => ({ p: $(id).scrollTop, cols: [...$(id).querySelectorAll('[data-col]')].map((c) => c.scrollTop), book: bookQ.matches, sec: id === 'visible' ? skySection() : null });
function panelRestore(id, pos) {
  if (id === 'visible' && pos && pos.book !== bookQ.matches) { skyJumpTo(pos.sec ?? 'now', false); return; }
  $(id).scrollTop = bookQ.matches && id === 'visible' ? 0 : pos?.p ?? 0; $(id).querySelectorAll('[data-col]').forEach((c, i) => { c.scrollTop = pos?.cols?.[i] ?? 0; });
}
let skyScroll = null, skyLeftAt = 0; // where the sky page was left (and when: after 5 minutes away it opens at the top again, playtest 2026-10-22), so the Sky tab comes back to it (2026-10-21, Sevaan)
function skyJumpTo(tab, smooth = true) {
  const id = SKY_JUMPS.find((j) => j[0] === tab)?.[2], el = id && ($(id) ?? (tab !== 'now' ? $('sky-tonight-head') : null));
  const book = bookQ.matches, panel = book ? el?.closest('[data-col]') ?? $('vtab-now') : $('visible'); // a book scrolls the page the section is on
  if (book) { $('visible').scrollTop = 0; skyCol = panel; }
  const pt = panel.getBoundingClientRect().top, barH = book ? 0 : $('sky-jump').offsetHeight + parseFloat(getComputedStyle(panel).paddingTop || 0);
  const top = el ? el.getBoundingClientRect().top - pt + panel.scrollTop - barH - 14 : 0; // lands just under the pinned chips
  panel.scrollTo({ top: Math.max(0, top), behavior: smooth && !matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'auto' });
}
function skyJumpMark() {
  const panel = $('visible'), bar = $('sky-jump'); if (!bar || panel.hidden) return;
  const pr = panel.getBoundingClientRect(), line = bar.getBoundingClientRect().bottom + Math.max(24, (pr.bottom - bar.getBoundingClientRect().bottom) * 0.4); let on = 'now'; // a section is current once its heading is in the top part of the page (UX playtest 2026-10-21: chips lit a section late)
  bar.classList.toggle('stuck', bar.getBoundingClientRect().top <= panel.getBoundingClientRect().top + parseFloat(getComputedStyle(panel).paddingTop || 0) + 1 && panel.scrollTop > 0); // pinned: cover everything above it
  const atEnd = panel.scrollTop + panel.clientHeight >= panel.scrollHeight - 4, pin = skyJumpMark.pin;
  const cut = atEnd ? bar.getBoundingClientRect().bottom + 48 : line; // at the very bottom, the section under the chips (playtest 2026-10-22: ALL PASSES lit while Missions was at the top)
  for (const [k, , id] of SKY_JUMPS) { const el = id && $(id); if (el && el.getBoundingClientRect().top <= cut) on = k; }
  if (pin && (performance.now() < pin.until || atEnd)) on = pin.k; else skyJumpMark.pin = null;
  bar.querySelectorAll('[data-jump]').forEach((b) => b.classList.toggle('on', b.dataset.jump === on));
  if (skyJumpMark.last !== on) { skyJumpMark.last = on; const b = bar.querySelector(`[data-jump="${on}"]`); if (b) { const l = b.offsetLeft - 16, r = b.offsetLeft + b.offsetWidth + 16; if (l < bar.scrollLeft) bar.scrollTo({ left: l, behavior: 'smooth' }); else if (r > bar.scrollLeft + bar.clientWidth) bar.scrollTo({ left: r - bar.clientWidth, behavior: 'smooth' }); } } // keep the lit chip in view // every chip always shows (a section still loading jumps to Tonight)
}
function showVTab(tab) {
  evGrown = false; // the Every pass bars grow in again on each visit
  setSkyPlusLine(); // one line instead of a PLUS tag on every bell (2026-10-21, Sevaan); names tonight's Rares when there are 2+ (2026-10-24)
  heroShine = true; // the next-card hero shimmers once each time you arrive (2026-10-13, Sevaan)
  $('visible-title').textContent = 'Tonight';
  $('visible-sub').textContent = `${state.observer.label?.replace(/^Example:\s*/, '') ?? 'Your sky'} · ${fmtTime(now().getTime())}`;
  renderVisible(); renderTonight();
  // The radar always opens at the top (2026-10-21, Sevaan); the Tonight links open at Tonight.
  requestAnimationFrame(() => requestAnimationFrame(() => { if (tab === 'keep') panelRestore('visible', Date.now() - skyLeftAt < 5 * 60e3 ? skyScroll : null); else skyJumpTo(tab, false); skyJumpMark(); skyLiveSec = skySection(); if (bookQ.matches) saveColAnchors(); }));
}
$('sky-plus-line').addEventListener('click', () => openPlus('reminders'));
// The book's pages scroll on their own: remember which one you were reading and where, so folding or unfolding the
// phone (or turning an iPad) keeps you on that section.
let bookResizedAt = 0; addEventListener('resize', () => { bookResizedAt = performance.now(); }); // scrolls caused by the resize itself (the layout reflowing) aren't the reader's
{ let q = 0; const live = (e) => { if (performance.now() - bookResizedAt < 500) return; if (e.currentTarget !== $('visible')) skyCol = e.currentTarget; if (!q) q = requestAnimationFrame(() => { q = 0; if (!$('visible').hidden) skyLiveSec = skySection(); }); };
  for (const id of ['visible', 'vtab-now', 'sky-later']) $(id).addEventListener('scroll', live, { passive: true }); }
// Turning a big screen that stays a book (an iPad either way up) reflows each page: hold on to the item at the top of each
// page and put it back where it was (iPad playtest 2026-10-24: back in landscape the left page jumped up to the hero).
const colAnchor = new Map();
function saveColAnchors() { for (const id of ['vtab-now', 'sky-later']) { const col = $(id), ct = col.getBoundingClientRect().top; colAnchor.delete(id);
  for (const el of col.querySelectorAll('*')) { const r = el.getBoundingClientRect(); if (r.height && r.height < 240 && r.bottom > ct + 1) { colAnchor.set(id, { el, path: elPath(col, el), off: r.top - ct }); break; } } } } // a small item, not a whole section
// Where an element sits under its column as child indexes, to find its stand-in after a re-render (the Now page redraws
// its rows; iPad playtest 2026-10-26: the left page lost its place after turning the iPad twice).
const elPath = (root, el) => { const p = []; for (let n = el; n && n !== root; n = n.parentElement) p.unshift([...n.parentElement.children].indexOf(n)); return p; };
const atPath = (root, p) => p.reduce((n, i) => n?.children[i] ?? null, root);
{ let q = 0; const save = () => { if (performance.now() - bookResizedAt < 500 || q) return; q = requestAnimationFrame(() => { q = 0; if (bookQ.matches && !$('visible').hidden) saveColAnchors(); }); };
  for (const id of ['vtab-now', 'sky-later']) $(id).addEventListener('scroll', save, { passive: true });
  let rq = 0; addEventListener('resize', () => { if (!bookQ.matches || $('visible').hidden || !colAnchor.size) return; cancelAnimationFrame(rq);
    rq = requestAnimationFrame(() => requestAnimationFrame(() => { for (const [id, a] of colAnchor) { const col = $(id); if (!a.el.isConnected) { a.el = atPath(col, a.path); if (!a.el) continue; } col.scrollTop += a.el.getBoundingClientRect().top - col.getBoundingClientRect().top - a.off; } skyLiveSec = skySection(); })); }); }
// Settings on a wide screen (2026-10-22, design/duo-layouts.html Settings A): the groups as an index (number, name, a
// line of what's in it) beside the chosen group's card, so nothing needs a long scroll; upright, a block of tabs above
// it. The chosen group is kept when the layout changes; on a phone it's where the page scrolls to.
let setGroup = 0, setLive = null;
const setGroups = () => [...$('debug').querySelectorAll(':scope > .set-group')];
function renderSetIndex() {
  let nav = $('set-index');
  if (!nav) {
    nav = document.createElement('nav'); nav.id = 'set-index'; nav.className = 'set-index'; nav.setAttribute('aria-label', 'Settings groups');
    $('debug').querySelector('.panel-head').after(nav);
    nav.addEventListener('click', (e) => { const b = e.target.closest('[data-g]'); if (b) { buzz('select'); chooseSetGroup(b.dataset.g === 't' ? 't' : Number(b.dataset.g)); } });
  }
  const label = (r) => (r.querySelector('.set-main')?.firstChild?.textContent ?? '').trim();
  const items = setGroups().map((g, i) => ({ g: i, n: g.querySelector('.set-bar b')?.textContent ?? '', name: g.querySelector('.set-bar h3')?.textContent ?? '',
    sum: [...g.querySelectorAll('.set-row')].filter((r) => !r.hidden && !r.closest('[hidden]')).map(label).filter(Boolean).slice(0, 3).join(' · ') }));
  if (!$('test-tools').hidden) items.push({ g: 't', n: 'T', name: 'Testing tools', sum: 'Time travel · Try it now · Prototypes' });
  if (setGroup === 't' && $('test-tools').hidden) setGroup = 0;
  nav.innerHTML = items.map((x) => `<button type="button" class="set-ix" data-g="${x.g}"><b>${escapeHtml(x.n)}</b><span>${escapeHtml(x.name)}<small>${escapeHtml(x.sum)}</small></span><i aria-hidden="true">›</i></button>`).join('');
  chooseSetGroup(setGroup, false);
}
function chooseSetGroup(g, scroll = true) {
  setGroup = g; const d = $('debug'), gs = setGroups();
  gs.forEach((el, i) => el.classList.toggle('on', i === g));
  d.classList.toggle('set-about', gs[g]?.querySelector('.set-bar h3')?.textContent === 'About'); d.classList.toggle('set-tools', g === 't');
  $('set-index')?.querySelectorAll('[data-g]').forEach((b) => { const on = b.dataset.g === String(g); b.classList.toggle('on', on); if (on) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
  if (scroll && bookQ.matches) d.scrollTop = 0;
}
$('debug').addEventListener('scroll', () => { if (bookQ.matches || performance.now() - bookResizedAt < 500) return; const d = $('debug'), top = d.getBoundingClientRect().top + 60; let on = 0; setGroups().forEach((g, i) => { if (g.getBoundingClientRect().top <= top) on = i; }); setLive = $('test-tools').hidden || $('test-tools').getBoundingClientRect().top > top ? on : 't'; }, { passive: true });
// Folding, unfolding or turning while a page is open keeps your place (2026-10-22).
bookQ.addEventListener('change', () => {
  colAnchor.clear(); // folding or unfolding lands on the section instead (below)
  const sky = activePanel === 'visible' && !$('visible').hidden, set = activePanel === 'debug' && !$('debug').hidden;
  if (sky) { const sec = skyLiveSec; requestAnimationFrame(() => requestAnimationFrame(() => { skyJumpTo(sec, false); skyLiveSec = skySection(); skyJumpMark(); })); }
  if (set && bookQ.matches) { if (setLive != null) chooseSetGroup(setLive); setLive = null; }
  else if (set) requestAnimationFrame(() => { const d = $('debug'), el = setGroup === 't' ? $('test-tools') : setGroups()[setGroup]; if (el) d.scrollTop = Math.max(0, el.getBoundingClientRect().top - d.getBoundingClientRect().top + d.scrollTop - 12); });
});
$('sky-jump').addEventListener('click', (e) => { const b = e.target.closest('[data-jump]'); if (!b) return; skyJumpTo(b.dataset.jump); skyJumpMark.pin = { k: b.dataset.jump, until: performance.now() + 900 }; skyJumpMark(); }); // the tapped chip stays lit, even when the page can't scroll its section to the top
$('visible').addEventListener('scroll', () => { if (!skyJumpMark._q) { skyJumpMark._q = true; requestAnimationFrame(() => { skyJumpMark._q = false; skyJumpMark(); }); } }, { passive: true });
// ---------- Shiny forecast (Plus, 2026-10-11) ----------
// The moments tonight a shiny is possible, from the planner (tonight-worker.js): a satellite fading into Earth’s
// shadow while still high up (eclipse), passing within a degree of the Moon, almost straight overhead (80°+), or
// launched under a month ago. Same rules as js/shiny.js; fleet members (Starlink…) never count.
function shinyChances(T, t0) {
  const out = [];
  for (const p of T.passes) {
    if (p.end < t0) continue;
    const o = state.byId.get(p.id); if (!o || o.family) continue;
    if (p.eclipseAt) out.push({ o, p: { ...p, obj: o }, t: p.eclipseAt, kind: 'eclipse', line: `slips into Earth’s shadow ${whereWords({ el: p.eclipseEl, az: p.eclipseAz }).toLowerCase()}` }); // words, not degrees (2026-10-13 playtest)
    if (p.moonSep != null && p.moonSep < 1) out.push({ o, p: { ...p, obj: o }, t: p.moonAt, kind: 'moon', line: 'passes right beside the Moon' });
    if (p.peakEl >= 86) out.push({ o, p: { ...p, obj: o }, t: p.peakAt, kind: 'overhead', line: 'passes almost straight overhead' });
    if (o.launch && p.start - Date.parse(`${o.launch}T00:00:00Z`) < 30 * 86400e3) out.push({ o, p: { ...p, obj: o }, t: p.start, kind: 'fresh', line: 'launched less than a month ago' });
  }
  const seen = new Set();
  return out.filter((x) => { const k = `${x.o.id}|${x.kind}`; if (seen.has(k)) return false; seen.add(k); return true; }).sort((a, b) => a.t - b.t);
}
// Shiny chances (2026-10-13, Sevaan): room under the heading, a target on each row that sets it up like Show me, and
// a short "what’s a shiny?" box above the first one that can be closed for good (localStorage shinyExplained).
// "What’s a shiny?" (2026-10-18, Sevaan: redesign it, with a tiny example of a shiny card): the same little card twice,
// plain then shiny, then the four lucky moments that make one.
const SHINY_WHAT = `<div class="shiny-what"><button type="button" class="x-close sw-x" aria-label="Got it, hide this">✕</button>
  <div class="sw-top"><div class="sw-cards" aria-hidden="true"><span class="sw-mini"><img src="assets/art/cards/sm/iss.webp" alt=""></span><span class="sw-arrow">›</span><span class="sw-mini sw-shiny"><img src="assets/art/cards/sm/iss.webp" alt=""><i>✦</i></span></div>
  <div><b>What’s a shiny?</b><p>The same card, with a finish that shimmers. Catch something at a lucky moment to get one.</p></div></div>
  <ul class="sw-moments"><li><i>◐</i>Into Earth’s shadow</li><li><i>☾</i>Right beside the Moon</li><li><i>↑</i>Straight overhead</li><li><i>✦</i>Just launched</li></ul></div>`;
function renderShinyForecast(list, T, t0) {
  const ch = shinyChances(T, t0).filter((x) => x.t > t0 && cardKeyFor(x.o) !== heroKey); if (!ch.length) return; // none that already happened (iOS playtest 2026-10-20)
  const plus = isPlus();
  const rows = plus ? ch.slice(0, 8) : [ch.find((x) => x.kind === 'eclipse' || x.kind === 'moon') ?? ch[0]];
  let explained = false; try { explained = localStorage.getItem('shinyExplained') === '1'; } catch {}
  const wrap = document.createElement('div'); wrap.className = 'shiny-sec'; wrap.id = 'sj-shiny';
  wrap.innerHTML = `<div class="t-head">Shiny chances</div>`
    + (explained ? '' : SHINY_WHAT)
    + `<div class="shiny-list">${rows.map((x, i) => `<div class="shiny-row"><b>${fmtTime(x.t)}</b><span><i>${escapeHtml(label(x.o))}</i> ${escapeHtml(x.line)}</span><small>${escapeHtml(({ eclipse: 'Catch the fade', moon: 'Beside the Moon', overhead: 'Straight overhead', fresh: 'Just launched' })[x.kind] ?? SHINY[x.kind]?.label ?? '')}</small><button class="ic showme" type="button" data-i="${i}" aria-label="Show me where to look">${ICON_TARGET}</button><button class="ic bell${reminded.has(`${x.o.id}@${x.t}`) ? ' on' : ''}${needsPlus(`${x.o.id}@${x.t}`)}" type="button" data-i="${i}" aria-label="Set a reminder"${x.t > t0 + 60e3 ? '' : ' disabled'}>${ICON_BELL}</button></div>`).join('')}</div>`
    + (plus || ch.length < 2 ? '' : `<button type="button" class="shiny-tease" id="shiny-tease">+${Math.min(ch.length, 8) - 1} more tonight <span class="plus-tag">PLUS</span></button>`);
  list.appendChild(wrap);
  wrap.querySelectorAll('.showme').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); flyToCircle(b); showMePass(rows[Number(b.dataset.i)].p); }));
  wrap.querySelectorAll('.bell').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); const x = rows[Number(b.dataset.i)];
    bellTap(b, x.p, `${x.o.id}@${x.t}`, (on) => b.classList.toggle('on', on), { t: x.t, line: x.line, label: ({ eclipse: 'Catch the fade', moon: 'Beside the Moon', overhead: 'Straight overhead', fresh: 'Just launched' })[x.kind] ?? 'Shiny chance' }); }));
  wrap.querySelector('.sw-x')?.addEventListener('click', () => { try { localStorage.setItem('shinyExplained', '1'); } catch {} wrap.querySelector('.shiny-what').remove(); });
  $('shiny-tease')?.addEventListener('click', () => openPlus('shiny'));
}
// Night helpers (the Week tab was removed 2026-10-16, Sevaan: not worth selling Plus on; planNight still uses these).
const nightNoon = (n) => { const d = new Date(now().getTime()); d.setHours(15, 0, 0, 0); d.setDate(d.getDate() + n); return d.getTime(); };
function weekKey() { return `${new Date(now().getTime()).toDateString()}|${state.observer.lat?.toFixed(2)},${state.observer.lon?.toFixed(2)}|${state.skySb}|${state.binoculars}`; }
const TIER_RANK = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };

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
// (testing hook) window.__loadDemo(T): show the planning state halfway through T.
window.__loadDemo = (T) => { tonightProgress = { t: T.dusk + 4 * 3600e3, dusk: T.dusk, found: 2300, curve: T.curve.filter(([t]) => t < T.dusk + 4 * 3600e3) }; renderTonightLoading(); };
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
  // Planning, shaped like what's coming (2026-10-21): a haul card whose chart fills in as the night is worked out, with a
  // calm progress line, then placeholder run rows; missions don't need the plan, so they show already.
  const dusk = pr?.dusk ?? null, frac = pr && dusk ? Math.max(0.04, Math.min(0.98, (pr.t - dusk) / (11 * 3600e3))) : 0.04;
  $('tonight-summary').innerHTML = `<div class="run-haul tl-plan"><span class="k">Tonight’s haul</span><b class="rh-big"><span class="tl-sh" style="width:7.5em"></span></b>
    <span class="rh-sub">Planning tonight’s sky${pr ? `: checked to ${fmtTime(pr.t)}` : '…'}</span><span class="tl-bar"><i style="width:${(frac * 100).toFixed(0)}%"></i></span></div>`;
  $('tonight-chart').innerHTML = bars ? `<svg class="tl-plan-chart" viewBox="0 0 ${W} ${H + 4}" aria-hidden="true">${bars.replace(/fill="#fa8127" opacity=".8"/g, 'fill="#3d5170"')}</svg>` : '';
  const root = $('tonight-list'); root.innerHTML = '<div class="t-head">Tonight’s run</div><div class="tl-skel"></div><div class="tl-skel"></div><div class="tl-skel"></div>';
  try { renderSkyMissions(root); } catch {}
}
// Tonight’s run (2026-10-13, Sevaan approved design/sky-pages-combined.html): the haul at the top (new cards this
// evening by rarity, the best window, XP), then a short itinerary: the rarest new cards (no Commons until the rest run
// low), the best shiny chance, moments (dark, busiest, cloud) and a dawn station as "Early riser". Each stop has a
// target (Show me) and a bell; "Set reminders" sets them all (free players: one, then the Plus sheet).
// Up to n passes, one of each name first, then repeats to fill (three "SL-8 Rocket Stage" stops read like a bug).
function varied(ps, n) {
  const names = new Set(), out = [];
  for (const p of ps) { if (out.length >= n) break; const nm = label(p.obj); if (!names.has(nm)) { names.add(nm); out.push(p); } }
  for (const p of ps) { if (out.length >= n) break; if (!out.includes(p)) out.push(p); }
  return out;
}
function renderRun(T, t0, wxT, peak) {
  const eve = eveningEnd(T), tierN = (o) => TIER_RANK[(state.cardModels.get(cardKeyFor(o)) ?? o).tier] ?? 0, tierOf = (o) => TIER_INFO[(state.cardModels.get(cardKeyFor(o)) ?? o).tier] ?? TIER_INFO.common;
  const all = tonightPasses(T, t0).filter((p) => p.start > t0), evening = all.filter((p) => p.start <= eve);
  const seen = new Set(), fresh = [];
  for (const p of evening.slice().sort((a, b) => tierN(b.obj) - tierN(a.obj) || (a.mag ?? 9) - (b.mag ?? 9))) { if (!p.fresh) continue; const k = cardKeyFor(p.obj); if (seen.has(k)) continue; seen.add(k); fresh.push(p); }
  const leftBetter = (state.catalog?.objects ?? []).filter((o) => !o.family && tierN(o) >= 1 && isNewFind(o)).length;
  const worth = (leftBetter >= 10 ? fresh.filter((p) => tierN(p.obj) >= 1) : fresh).filter((p) => cardKeyFor(p.obj) !== heroKey); // not the one the hero already shows
  // Variety first (2026-10-13 playtest: three "SL-8 Rocket Stage" stops read like a bug): one of each name, then repeats.
  const picks = varied(worth, 4);
  const sh = shinyChances(T, t0).filter((x) => x.t > t0 && x.t <= eve && !picks.some((p) => p.obj.id === x.o.id) && cardKeyFor(x.o) !== heroKey).sort((a, b) => ['eclipse', 'moon', 'overhead', 'fresh'].indexOf(a.kind) - ['eclipse', 'moon', 'overhead', 'fresh'].indexOf(b.kind))[0];
  const dawnStation = all.find((p) => p.start > eve && (p.obj.type === 'station' || p.obj.icon) && !cloudAt(p.start)); // not into forecast cloud (2026-10-18 playtest)
  const stops = [...picks.map((p) => ({ t: p.start, p, kind: 'card' })), ...(sh ? [{ t: sh.t, p: sh.p, kind: 'shiny', line: sh.line, shiny: sh.kind }] : [])];
  if (T.dusk && T.dusk > t0) stops.push({ t: T.dusk, kind: 'moment', text: 'Dark enough to start', ico: 'moon' });
  if (peak?.[1] >= 3 && peak[0] > t0) stops.push({ t: peak[0], kind: 'moment', text: `Busiest: ${upOnce(peak[1])}`, ico: 'stars' });
  if (wxT?.coverFrom > t0 && wxT.coverFrom <= eve) stops.push({ t: wxT.coverFrom, kind: 'moment', text: 'Cloud rolls in', ico: 'cloud' });
  if (wxT?.clearFrom > t0 && wxT.clearFrom <= eve) stops.push({ t: wxT.clearFrom, kind: 'moment', text: 'Clouds part', ico: 'cloud-part' });
  stops.sort((a, b) => a.t - b.t);
  if (dawnStation) stops.push({ t: dawnStation.start, p: dawnStation, kind: 'card', early: true });
  // The haul
  const XP = { common: 10, uncommon: 15, rare: 25, epic: 40, legendary: 60 }, TIERS5 = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
  const n5 = [0, 0, 0, 0, 0]; for (const p of fresh) n5[tierN(p.obj)]++;
  const top = Math.max(...fresh.map((p) => tierN(p.obj)), -1), topN = top >= 0 ? n5[top] : 0; /* the evening's new cards, like the count beside it (iOS playtest 2026-10-24: "2 Rare" came from the run's picks only) */
  const xp = picks.reduce((a, p) => a + (XP[TIERS5[tierN(p.obj)]] ?? 10), 0);
  const w0 = picks.length ? Math.min(...picks.map((p) => p.start)) : null, w1 = picks.length ? Math.max(...picks.map((p) => p.end ?? p.start)) : null;
  const sq = Math.sqrt(Math.max(1, ...n5));
  const overcast = wxT && !wxT.ok, nextDay = wxT?.nextClear ? dayWord(wxT.nextClear) : '';
  if (overcast) { // lead with the weather: the haul is behind cloud (2026-10-13 playtest)
    $('tonight-summary').innerHTML = `<div class="run-haul cloudy"><span class="k">Tonight’s sky</span>
    <b class="rh-big"><span class="ico" data-ico="${wxT.worst === 'rain' || wxT.worst === 'storm' ? 'rain' : wxT.worst === 'snow' ? 'snow' : wxT.worst === 'fog' ? 'fog' : 'cloud'}" aria-hidden="true"></span> ${escapeHtml(wxT.line)}</b>
    <span class="rh-sub">${nextDay ? `Next clear night: <b>${nextDay}</b>. ` : ''}${fresh.length} new card${fresh.length === 1 ? '' : 's'} pass over tonight behind the cloud; if you spot a gap, they still count.</span>
    ${T.dusk ? `<span class="rh-wx"><span class="ico" data-ico="moon" aria-hidden="true"></span> Dark ${fmtTime(T.dusk)}</span>` : ''}</div>`;
  } else if (!fresh.length) { // nothing new in the window: say so plainly, no empty bars (flow playtest 2026-10-25)
    const back = tonightPasses(T, t0).find((p) => p.start > t0 && (!T.dawn || p.start < T.dawn));
    $('tonight-summary').innerHTML = `<div class="run-haul"><span class="k">Tonight’s haul</span>
    <b class="rh-big">Quiet overhead</b>
    <span class="rh-sub">${back ? `No new cards in this window. Satellites pass again from ${fmtTime(back.start)}.` : 'No new cards pass before dawn. Stars, planets and the Moon are still up.'}</span>
    <span class="rh-wx">${T.dusk ? `<span class="ico" data-ico="moon" aria-hidden="true"></span> Dark ${fmtTime(T.dusk)}` : ''}${wxT ? ` · ${escapeHtml(wxT.line)}` : ''}</span></div>`;
  } else
  $('tonight-summary').innerHTML = `<div class="run-haul"><span class="k">Tonight’s haul</span>
    <b class="rh-big">${fresh.length} new card${fresh.length === 1 ? '' : 's'}${top >= 2 ? `, <em style="color:${TIER_INFO[TIERS5[top]].color}">${topN} ${TIER_INFO[TIERS5[top]].label}</em>` : ''}</b>
    <span class="rh-sub">${w0 ? `Best between ${fmtTime(w0)} and ${fmtTime(w1)}${xp ? ` · the run below: about +${xp} XP` : ''}` : 'No new cards pass in this window'}</span>
    <span class="rh-bars" aria-label="${TIERS5.map((t, i) => `${n5[i]} ${TIER_INFO[t].label}`).join(', ')}">${n5.map((c, i) => `<i style="height:${c ? Math.max(12, Math.round(Math.sqrt(c) / sq * 100)) : 4}%;background:${TIER_INFO[TIERS5[i]].color}"></i>`).join('')}<small>new by rarity</small></span>
    <span class="rh-wx">${T.dusk ? `<span class="ico" data-ico="moon" aria-hidden="true"></span> Dark ${fmtTime(T.dusk)}` : ''}${wxT ? ` · ${escapeHtml(wxT.line)}` : ''}</span></div>`;
  const box = document.createElement('div'); box.className = 'run';
  box.innerHTML = `<div class="t-head">Tonight’s run${overcast ? ' · if it clears' : ''}</div>`;
  const head = headliner(T);
  const ghostEl = ghostBox(T, t0); // Halloween (the week before, and the night itself): first thing in the run
  const almost = almostThere(T, t0); // cards one night from their next level (come-back 01)
  if (head && head.end > t0 && cardKeyFor(head.obj) !== heroKey) { // Tonight’s headliner, first thing in the tab (design/fun-and-learning.html)
    const hk = `${head.obj.id}@${head.start}`, hEl = document.createElement('div'); hEl.className = 'headliner';
    hEl.innerHTML = `<span class="k">Tonight’s headliner</span><b>${escapeHtml(yearLabel(head.obj))}</b><small>${fmtTime(head.start)} · ${escapeHtml(whereWords({ el: head.peakEl, az: head.peakAz }).toLowerCase())} · +${(isNewFind(head.obj) ? XP[(state.cardModels.get(cardKeyFor(head.obj)) ?? head.obj).tier] ?? 10 : 0) + 25} XP</small>
      <div class="hl-acts"><button type="button" class="pill-o hl-go"><span class="ico-svg">${ICON_TARGET}</span> Show me</button>${head.start > t0 + 10 * 60000 ? `<button type="button" class="pill-g hl-bell${reminded.has(hk) ? ' on' : ''}${needsPlus(hk)}" aria-label="Remind me"><span class="ico-svg">${ICON_BELL}</span></button>` : ''}</div>`;
    hEl.querySelector('.hl-go').addEventListener('click', (e) => { flyToCircle(e.currentTarget); showMePass(head); });
    hEl.querySelector('.hl-bell')?.addEventListener('click', (e) => { const b = e.currentTarget; openPassRemind(head, hk, (on) => b.classList.toggle('on', on)); });
    box.insertBefore(hEl, box.firstChild);
  }
  // A big meteor shower within the week, and constellations back this season (come-back 02).
  { const sh = showerSoon(t0), back = consBack(t0); if (sh || back.length) { const el = document.createElement('div'); el.className = 'season-box';
    const nd = new Date(sh?.night ?? 0), dayName = nd.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }), /* the phone's own date order (US/UK playtest) */ rk = sh ? `shower-${sh.e.id}` : '';
    el.innerHTML = `${sh ? `<div class="sb-shower"><span class="k">Meteor shower · in ${sh.days} day${sh.days === 1 ? '' : 's'}</span><b>${escapeHtml(sh.e.shower)}</b><i>${escapeHtml(sh.e.rate[0].toUpperCase() + sh.e.rate.slice(1))}. Peak night: ${escapeHtml(dayName)}. Catch any card that night for its badge.</i><button type="button" class="pill-g sb-remind${reminded.has(rk) ? ' on' : ''}"><span class="ico-svg">${ICON_BELL}</span> Remind me</button></div>` : ''}${back.length ? `<div class="sb-back"><span class="k">Back this season</span>${back.map((b) => `<div class="sb-row"><span>${escapeHtml(b.c.name)} · from ${escapeHtml(fmtTime(at930(t0)))}</span><i>${b.have} of ${b.c.stars.length} stars found</i></div>`).join('')}</div>` : ''}`;
    el.querySelector('.sb-remind')?.addEventListener('click', async (e) => { const btn = e.currentTarget; FREE_KEYS.add(rk); const dusk = (() => { const d = new Date(sh.night); for (let u = d.setHours(16, 0, 0, 0); u < d.getTime() + 8 * 3600e3; u += 60000) if (frame(new Date(u), state.observer).sunEl < DARK_SUN_ELEVATION) return u; return sh.night; })();
      const r = await setReminder({ at: dusk, title: `Tonight: the ${sh.e.shower}`, body: `${sh.e.rate[0].toUpperCase()}${sh.e.rate.slice(1)}. Catch any card tonight for its badge.`, key: rk }); if (reminderToast(r, dusk)) btn.classList.add('on'); });
    box.insertBefore(el, box.firstChild); } }
  { const tr = tonightTrains(T, t0 - 20 * 60e3).find((x) => x.start + 5 * 60e3 > t0); /* the same count as the circle's ticket */ if (tr) { const el = document.createElement('div'); el.className = 'train-box';
    el.innerHTML = `<span class="k">Starlink train · ${escapeHtml(fmtTime(tr.start))}${cloudAt(tr.start) ? ' · cloud forecast' : ''}</span><b>${tr.count} in a line</b><i>Launched ${tr.days === 0 ? 'today' : tr.days === 1 ? 'yesterday' : `${tr.days} days ago`}. Rises in the ${escapeHtml(dirWord(tr.first.riseAz))}. Catch any one of them for a train stamp.</i><button type="button" class="pill-o tr-go"><span class="ico-svg">${ICON_TARGET}</span> Show me</button>`;
    el.querySelector('.tr-go').addEventListener('click', (e) => { flyToCircle(e.currentTarget); showMePass(tr.first); }); box.insertBefore(el, box.firstChild); } }
  if (almost.length) { const el = document.createElement('div'); el.className = 'almost-box';
    el.innerHTML = `<span class="k">Almost there tonight</span><b>${almost.length === 1 ? '1 card can' : `${almost.length} cards can`} level up</b>${almost.slice(0, 4).map((a, i) => `<button type="button" class="al-row" data-i="${i}"><span>${escapeHtml(widgetName(a.p.obj))}</span><i>${escapeHtml(fmtTime(a.p.start))} → <em class="${a.to.toLowerCase()}">${a.to}</em></i></button>`).join('')}`;
    el.addEventListener('click', (e) => { const r = e.target.closest('.al-row'); if (r) { flyToCircle(r); showMePass(almost[Number(r.dataset.i)].p); } });
    box.insertBefore(el, box.firstChild); }
  chooseWeek(); { const w = weekBox(T, t0); if (w) box.insertBefore(w, box.querySelector('.t-head')); } // the week's theme, just above Tonight's run
  if (ghostEl) box.insertBefore(ghostEl, box.firstChild);
  { const hl = box.querySelector('.headliner'); if (hl) box.insertBefore(hl, box.firstChild); } // tonight's headliner stays first (bug hunt 2026-10-25: four new boxes buried it)
  const reminders = [];
  for (const st of stops) {
    const el = document.createElement('div');
    if (st.kind === 'moment') { el.className = 'run-stop moment'; el.innerHTML = `<b>${fmtTime(st.t)}</b>${st.ico ? `<span class="ico" data-ico="${st.ico}" aria-hidden="true"></span>` : ''}<span>${escapeHtml(st.text)}</span>`; box.appendChild(el); continue; }
    const p = st.p, o = p.obj, tier = tierOf(o), key = `${o.id}@${p.start}`, canRemind = p.start > t0 + 10 * 60000;
    const color = st.kind === 'shiny' ? 'var(--gold)' : tier.color;
    el.className = 'run-stop'; el.style.setProperty('--c', color);
    // The headliner gets its own gold pill, and its XP counts the +25 headliner bonus (2026-10-17, Sevaan: the list said
    // +15 while the headliner box said +25; it’s really 40).
    const isHead = !!head && o.id === head.obj.id && p.start === head.start, cardXp = XP[(state.cardModels.get(cardKeyFor(o)) ?? o).tier] ?? 10;
    const reunite = p.fresh && (refreshOwned(), cardModel(o).partners?.some((k) => ownedKeys.has(k))); // you own its stage or its satellite
    const gets = [isHead ? `<span class="h">Headliner</span>` : '', reunite ? `<span class="r">Reunion</span>` : '', p.fresh ? `<span>New card</span>` : '', st.kind === 'shiny' ? `<span class="s">Shiny card</span>` : '', p.fresh ? `<span>+${cardXp + (isHead ? 25 : 0)} XP</span>` : ''].join('');
    el.innerHTML = `<div class="rs-h"><b>${fmtTime(st.t)}</b><em>${st.kind === 'shiny' ? 'Shiny chance' : st.early ? 'Early riser' : `${tier.gem} ${tier.label}`}</em>${state.cardModels?.get(cardKeyFor(o))?.fallAt ? '<em class="lc-pill">Last chance</em>' : ''}</div>
      <span class="rs-n">${escapeHtml(yearLabel(o))}</span><span class="rs-w">${escapeHtml(st.kind === 'shiny' ? st.line.replace(/^./, (c) => c.toUpperCase()) : whereWords({ el: p.peakEl, az: p.peakAz }))}${p.mag <= 0 ? ' · very bright' : ''}</span>
      ${gets ? `<div class="rs-gets">${gets}</div>` : ''}
      <div class="rs-acts"><button type="button" class="ic showme" aria-label="Show me where to look">${ICON_TARGET}</button><button type="button" class="ic bell${reminded.has(key) ? ' on' : ''}${needsPlus(key)}${canRemind ? '' : ' soon'}" aria-label="Remind me">${ICON_BELL}</button></div>`;
    el.querySelector('.showme').addEventListener('click', (e) => { e.stopPropagation(); flyToCircle(e.currentTarget); showMePass(p); });
    const bell = el.querySelector('.bell');
    bell.addEventListener('click', (e) => { e.stopPropagation(); bellTap(bell, p, key, (on) => bell.classList.toggle('on', on)); });
    el.addEventListener('click', () => showTonightCard(o, el.getBoundingClientRect(), `TONIGHT · ${fmtTime(st.t)}`));
    if (canRemind) reminders.push({ p, key, bell });
    box.appendChild(el);
  }
  if (!stops.some((s) => s.kind !== 'moment')) box.insertAdjacentHTML('beforeend', '<p class="hint">No new cards pass in this window. Stars, planets and the Moon are still up.</p>');
  if (reminders.length > 1) {
    const all2 = document.createElement('button'); all2.type = 'button'; all2.className = 'd-cta o run-remind';
    all2.innerHTML = `<span><span class="ico" data-ico="bell" aria-hidden="true"></span> Set reminders</span><span>${!isPlus() && reminders.some((r) => !freeReminder(r.key)) ? '<em class="plus-tag">PLUS</em>' : reminders.length}</span>`; // says Plus when most of them need it (playtest 2026-10-17)
    all2.addEventListener('click', async () => { buzz(8); let n = 0;
      for (const r of reminders) { if (reminded.has(r.key)) { n++; continue; } if (await remindPass(r.p, r.key)) { reminded.add(r.key); r.bell.classList.add('on'); n++; } else break; }
      if (n) all2.firstElementChild.innerHTML = `<span class="ico" data-ico="bell" aria-hidden="true"></span> ${n} reminder${n === 1 ? '' : 's'} set`; });
    box.appendChild(all2);
  }
  return box;
}
// One line at the foot of Tonight (2026-10-16, Sevaan, instead of the Week tab): the next clear night after tonight,
// only when it’s within two days (where the forecast is still decent), with what’s new on it. Worked out once by
// planNight and cached; a quiet line, not a planner.
function fillNextClear() {
  const el = $('tonight-next'), T = state.tonight; if (!el) return;
  const wx = tonightWeather(), next = (wx?.nights ?? []).find((n) => n.n >= 1 && n.n <= 2 && isGoodNight(n));
  if (!next || !T) { el.hidden = true; return; }
  const day = next.n === 1 ? 'tomorrow' : new Date(next.t).toLocaleDateString([], { weekday: 'long' });
  planNight(next.n).then((N) => {
    if (!N?.passes) { el.hidden = true; return; }
    const fresh = new Map();
    for (const p of N.passes) { const obj = state.byId.get(p.id); if (obj && isNewFind(obj)) { const k = cardKeyFor(obj); fresh.set(k, Math.max(fresh.get(k) ?? 0, TIER_RANK[cardModel(obj).tier] ?? 0)); } }
    const rare = [...fresh.values()].filter((r) => r >= 2).length;
    el.innerHTML = `<span class="ico" data-ico="calendar" aria-hidden="true"></span><span>Next clear night after tonight: <b>${escapeHtml(day)}</b>${rare ? ` · ${rare} new Rare${rare === 1 ? '' : 's'} or better` : fresh.size ? ` · ${fresh.size} new card${fresh.size === 1 ? '' : 's'}` : ''}</span>`;
    el.hidden = false;
  });
}
// While Tonight is open, it refreshes once a minute so passes that have gone stop saying "up now" (iOS playtest 2026-10-20).
setInterval(() => { if (!$('visible')?.hidden && !$('vtab-tonight')?.hidden && !document.hidden && state.tonight) { const sc = $('visible').querySelector('.panel-body, .vis-body') ?? $('visible'); const y = sc.scrollTop; renderTonight(); sc.scrollTop = y; } }, 60000);
// Tonight's missions (2026-10-21, Sevaan; design/sky-page-3.html): the three for this night and the sky challenge, ticked.
function renderSkyMissions(list) {
  { let pr = null; try { pr = progressNow(state.sightings); } catch {}
    if (pr?.missions?.length) {
      const done = pr.missions.filter((m) => m.done).length;
      list.insertAdjacentHTML('beforeend', `<div class="t-head" id="sj-missions">Tonight’s missions · ${done + (pr.challenge?.done ? 1 : 0)} of ${pr.missions.length + (pr.challenge ? 1 : 0)}</div><div class="now-missions">${pr.missions.map((m) => `<div class="nm${m.done ? ' done' : ''}"><i aria-hidden="true"></i><span>${escapeHtml(m.text)}</span><b>+50 XP</b></div>`).join('')}${pr.challenge ? `<div class="nm ch${pr.challenge.done ? ' done' : ''}"><i aria-hidden="true"></i><span>${escapeHtml(pr.challenge.text)}<small>Sky challenge</small></span><b>+50 XP</b></div>` : ''}</div>`);
    } }
}
// Scrub the night (2026-10-21, slick idea 08): the Every pass bars grow up one after another when the card comes into
// view (once a visit), and a finger slid along the chart shows "11 PM · 9 up" under a line, with a tick per bar.
let evGrown = false;
function evChart(ch) {
  if (!ch) return;
  if (ch.classList.contains('pre')) {
    const io = new IntersectionObserver(([en]) => { if (!en.isIntersecting) return; io.disconnect(); evGrown = true; ch.classList.remove('pre'); ch.classList.add('grow'); }, { root: $('visible'), threshold: .6 });
    io.observe(ch);
  }
  const line = ch.querySelector('.ev-scrub'), bars = [...ch.querySelectorAll('i')];
  let head = ch.parentElement.querySelector('.ev-busy'); if (!head) { head = document.createElement('div'); head.className = 'ev-busy'; ch.before(head); } const headWas = head.textContent;
  const lab = { set textContent(v) { if (head) head.textContent = v; } }; // the reading replaces the card's headline while you scrub (it covered it)
  let on = false, last = -1, hideT = 0, x0 = 0, live = false;
  const at = (x) => { const r = ch.getBoundingClientRect(), i = Math.max(0, Math.min(bars.length - 1, Math.floor((x - r.left) / r.width * bars.length))), b = bars[i];
    line.style.left = `${((i + .5) / bars.length * 100).toFixed(2)}%`; if (i !== last) { last = i; buzz('select'); const n = Number(b.dataset.n), tt = Math.round(Number(b.dataset.t) / 1800e3) * 1800e3; lab.textContent = `${fmtTime(tt)} · ${n ? `${n} up` : 'nothing up'}`; bars.forEach((x) => x.classList.toggle('sel', x === b)); } };
  ch.addEventListener('pointerdown', (e) => { on = true; live = false; x0 = e.clientX; clearTimeout(hideT); last = -1; ch.setPointerCapture?.(e.pointerId); });
  ch.addEventListener('pointermove', (e) => { if (!on) return; if (!live && Math.abs(e.clientX - x0) < 6) return; if (!live) { live = true; line.hidden = false; } at(e.clientX); }); // a vertical scroll that starts on the chart doesn't flash it
  ch.addEventListener('click', (e) => { if (!live) { line.hidden = false; at(e.clientX); end(); } });
  const end = () => { if (!on && !live) return; on = false; hideT = setTimeout(() => { line.hidden = true; live = false; bars.forEach((x) => x.classList.remove('sel')); if (head) head.textContent = headWas; }, 1100); };
  ch.addEventListener('pointerup', end); ch.addEventListener('pointercancel', end); ch.addEventListener('lostpointercapture', end);
}
function renderTonight() {
  const T = state.tonight, t0 = now().getTime();
  fillNextClear();
  if (!T) { renderTonightLoading(); requestTonight(); return; }
  const wins = tonightWindows(T).filter((w) => w.e >= t0);
  const peak = T.curve.filter(([t]) => t >= t0 && t <= eveningEnd(T)).reduce((a, c) => (c[1] > a[1] ? c : a), [0, 0]);
  const ev = activeEvent(t0) ?? nextEvent(t0), evLine = ev ? (t0 >= ev.start ? `<br><b>${ev.name}</b>${ev.kind === 'shower' ? ` meteor shower tonight (${ev.rate})` : ' tonight'}.` : `<br>Next event: <b>${ev.name}</b>${ev.kind === 'shower' ? ' meteor shower' : ''}, ${new Date(ev.day ?? ev.peak).toLocaleDateString([], { month: 'short', day: 'numeric' })}.`) : '';
  const wxT = tonightWeather(), wxLine = wxT ? `<br>Sky: <b>${escapeHtml(wxT.line)}</b>${!wxT.ok && wxT.nextClear ? `. Next clear night: <b>${dayWord(wxT.nextClear)}</b>.` : '.'}` : '';
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
    : `<span class="ts-note">Nothing bright enough for your sky until dawn. Slide the sky darker if you can see more stars, or past Dark site for binoculars.</span>`) + dawnLine;
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
  // Tonight’s run first (2026-10-13, design/sky-pages-combined.html); the old full list sits behind "Everything tonight".
  const root = $('tonight-list'); root.innerHTML = '';
  root.appendChild(renderRun(T, t0, wxT, peak));
  renderShinyForecast(root, T, t0); renderSkyMissions(root); // missions after the shiny chances (design/sky-page-3.html) (2026-10-16, Sevaan: it was buried at the end of Everything tonight)
  // Every pass tonight (2026-10-21, Sevaan; design/everything-tonight.html B): the night's shape as a preview card, the
  // busiest moment in orange, and a button that opens the full list under it.
  const allN = tonightPasses(T, t0).length, tog = document.createElement('div'); tog.className = 'ev-card'; tog.id = 'sj-all';
  { const from = t0, to = T.dawn ?? (T.curve.at(-1)?.[0] ?? t0), bins = Array(16).fill(0), span = Math.max(1, to - from);
    for (const [t, n] of T.curve) if (t >= from && t <= to) { const i = Math.min(15, Math.floor((t - from) / span * 16)); bins[i] = Math.max(bins[i], n); }
    const mx = Math.max(1, ...bins), bi = bins.indexOf(Math.max(...bins)), pk = T.curve.filter(([t]) => t >= from && t <= to).reduce((a, c) => (c[1] > a[1] ? c : a), [0, 0]);
    tog.innerHTML = `<div class="t-head ev-head"><span>Every pass tonight</span><span>${allN}</span></div><div class="ev-box">${pk[1] >= 3 ? `<div class="ev-busy">${pk[0] > eveningEnd(T) ? 'Busiest before dawn' : 'Busiest'} at ${fmtTime(pk[0])} · ${upOnce(pk[1])}</div>` : ''}
      <div class="ev-chart${evGrown ? '' : ' pre'}" aria-hidden="true">${bins.map((n, i) => `<i class="${i === bi ? 'pk' : ''}" data-t="${Math.round(from + (i + .5) * span / 16)}" data-n="${n}" style="height:${Math.max(6, Math.round(n / mx * 100))}%;--i:${i}"></i>`).join('')}<b class="ev-scrub" hidden></b></div>
      <div class="ev-axis"><span>Now</span>${(() => { const m = new Date(from); m.setHours(24, 0, 0, 0); const f = (m - from) / span; return f > 0.15 && f < 0.85 ? `<span class="ev-mid" style="left:${(f * 100).toFixed(1)}%">Midnight</span>` : ''; })()}<span>Dawn</span></div>
      <button type="button" class="ev-btn">${tlAll ? 'Hide the list' : `See all ${allN} passes`}</button></div>`; }
  evChart(tog.querySelector('.ev-chart'));
  tog.querySelector('.ev-btn').addEventListener('click', () => { tlAll = !tlAll; renderTonight(); if (tlAll) requestAnimationFrame(() => skyJumpTo('all')); });
  root.appendChild(tog);
  const list = document.createElement('div'); list.className = 'tl-all'; list.hidden = !tlAll; root.appendChild(list);
  $('tonight-chart').hidden = !tlAll;
  // Pass list, design B (2026-10-08, design/tonight-list.html): small cards with a rarity bar, split into Up next
  // (within 10 min: aim now) and Later tonight. Swipe a row right-to-left to reveal its alarm (Sevaan’s idea); passes
  // under 10 minutes away say "Too soon" there, since the alert fires 10 minutes before. Filter: tap a rarity to show
  // it and rarer (tap again for all), plus New only. The night’s moments (cloud, busiest, dawn) sit between rows.
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
  if (peak[1] >= 3 && peak[0] > t0) marks.push([peak[0], `Busiest: ${upOnce(peak[1])}`, 'peak']);
  if (T.dawn) marks.push([T.dawn, 'Dawn: the sky closes', 'dawn']);
  const markHtml = ([t, txt, k]) => `<div class="t-mark ${k}"><span class="time">${fmtTime(t).replace(/\s?[AP]M$/i, '')}</span><span>${escapeHtml(txt)}</span></div>`;
  marks.sort((a, b) => a[0] - b[0]);
  const SOON = 10 * 60000, soonList = passes.filter((p) => p.start <= t0 + SOON), laterList = passes.filter((p) => p.start > t0 + SOON);
  const row = (p) => {
    const tier = TIER_INFO[p.obj.tier] ?? TIER_INFO.common, key = `${p.obj.id}@${p.start}`, mins = Math.round((p.start - t0) / 60000);
    const canRemind = p.start > t0 + SOON, belled = reminded.has(key);
    const when = p.start <= t0 ? 'up now' : mins < 60 ? `in ${mins} min` : `in ${Math.floor(mins / 60)} h${mins % 60 ? ` ${mins % 60} m` : ''}`; // "m" once there are hours, so it fits the column (2026-10-13)
    const el = document.createElement('div'); el.className = `b-row${canRemind ? '' : ' soon'}`; el.style.setProperty('--c', tier.color);
    el.innerHTML = `<button type="button" class="b-alarm${belled ? ' on' : ''}${needsPlus(key)}" aria-label="${canRemind ? (belled ? 'Reminder set: tap to turn off' : 'Remind me 10 minutes before') : 'Too soon for a reminder'}">${ICON_BELL}<span>${canRemind ? (belled ? 'Set' : 'Remind') : 'Too soon'}</span></button>
      <div class="b-face" role="button" tabindex="0" aria-label="${escapeHtml(label(p.obj))}, ${fmtTime(p.start)}: open the card"><span class="b-when"><b>${fmtTime(p.start).replace(/\s?[AP]\.?M\.?$/i, '')}</b><small>${when}</small></span>
      <span class="b-main"><span class="b-tier">${tier.label}${p.fresh ? ' · <em>New</em>' : ''}${belled ? ` · <em class="b-set">${ICON_BELL}${fmtTime(p.start - SOON)}</em>` : ''}</span><span class="name">${escapeHtml(label(p.obj))}</span>
      <span class="meta">Rises ${compassPoint(p.riseAz)} · up to ${p.peakEl}° in the ${compassPoint(p.peakAz)} · ${brightnessWord(p.mag)}</span></span>
      <button class="ic showme" type="button" aria-label="Show me in the sky">${ICON_TARGET}</button></div>`;
    el.querySelector('.showme').addEventListener('click', (e) => { e.stopPropagation(); flyToCircle(e.currentTarget); showMePass(p); });
    el.querySelector('.b-alarm').addEventListener('click', async (e) => {
      e.stopPropagation(); bellTap(e.currentTarget, p, key, () => renderTonight()); // choose when (2026-10-21); too soon or Plus answer too
    });
    el.querySelector('.b-face').addEventListener('click', (e) => {
      if (el.dataset.swiped || e.target.closest('.showme')) return; // a swipe isn’t a tap
      if (el.classList.contains('open')) { swipeClose(el); return; }
      const from = el.querySelector('.name').getBoundingClientRect(); showTonightCard(p.obj, from, `TONIGHT · ${fmtTime(p.start)}`);
    });
    el.querySelector('.b-face').addEventListener('keydown', (e) => { // Enter opens the card; ← reveals the alarm, → hides it
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.currentTarget.click(); }
      else if (e.key === 'ArrowLeft') { el.classList.add('open'); e.currentTarget.style.transform = `translateX(${-SWIPE_W}px)`; const a = el.querySelector('.b-alarm'); a.tabIndex = 0; a.focus(); }
      else if (e.key === 'ArrowRight') swipeClose(el);
    });
    el.querySelector('.b-alarm').tabIndex = -1; // under the row until it’s swiped open (QA 2026-10-08)
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
  // no ISS, or what’s later in the AM"). Each part leads with its best passes (new, rarer, stations, brighter, higher),
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
  part('This evening', 'Swipe left to remind', laterList.filter((p) => p.start <= eveEnd), 'later', 8, t0, eveEnd);
  part('Late night', 'The best of them', laterList.filter((p) => p.start > eveEnd && p.start <= dawnCut), 'late', 4, eveEnd, dawnCut);
  part('Before dawn', 'The best of them', laterList.filter((p) => p.start > dawnCut), 'dawn', 4, dawnCut, Infinity);
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
      c.replaceChildren(stripCard(o, `${fmtTime(p.start)} · ${compassPoint(p.peakAz)}`)); c.insertAdjacentHTML('beforeend', `<button class="ic remind${reminded.has(key) ? ' on' : ''}" type="button" aria-label="Remind me">${ICON_BELL}</button>`);
      c.addEventListener('click', (e) => { if (e.target.closest('.remind') || c.closest('.mini-cards')?.dataset.dragged) return; showTonightCard(o, c.getBoundingClientRect(), `TONIGHT · ${fmtTime(p.start)}`); }); // tap the card to see it (2026-10-13)
      c.querySelector('.remind').addEventListener('click', (e) => { const b = e.currentTarget; openPassRemind(p, key, (on) => b.classList.toggle('on', on)); });
      strip.appendChild(c); }
    list.appendChild(strip);
  }
}
// One way to set a reminder (QA 2026-10-11: the .ics download did nothing in the apps, and said it had):
// Reminders are native notifications at the right time, nothing else (2026-10-12, Sevaan: "We don’t need any reminders
// that go to a calendar"). Resolves 'on' | 'denied' | 'app-only' (the website, Sevaan’s test build) | 'unsupported'.
// Reminders (2026-10-16, Sevaan): free players can set the countdown’s "Remind me" (until dark) and any ISS pass, the
// two that bring people back outside; every other reminder is Plus ("Unlimited reminders"). Plus: anything.
const FREE_KEYS = new Set(['until-dark', 'clear-night', ...(() => { try { return JSON.parse(localStorage.getItem('freeKeys') ?? '[]'); } catch { return []; } })()]), ISS_ID = '25544'; /* + keys made free where they were set (the tour's appointment, 2026-10-25), kept across launches */
const freeKey = (k) => { FREE_KEYS.add(k); try { localStorage.setItem('freeKeys', JSON.stringify([...FREE_KEYS].filter((x) => /@\d+$/.test(x) && Number(x.split('@')[1]) > Date.now() - 864e5).slice(-20))); } catch {} }; // + the bad-weather page’s 'Remind me <day>' (playtest 2026-10-16, Sevaan)
// Until Plus can be bought on this platform (Android before the goog_ key), every reminder is free: a paywall that can't
// sell is a dead end (Android playtest 2026-10-20).
const freeReminder = (key) => FREE_KEYS.has(key) || String(key ?? '').startsWith('shower-') || String(key ?? '').startsWith('bday') || String(key ?? '').split('@')[0] === ISS_ID || (isNative() && !storeOpen());
// A bell that needs Plus says so (playtest 2026-10-17: every bell looked free; only ISS passes and the dark reminder are).
const needsPlus = (key) => (!isPlus() && !freeReminder(key) ? ' needs-plus' : '');
function reminderLimitHit(at, key) { return !isPlus() && !freeReminder(key); }
// A second tap while the first is still being set gets the same answer, and an older schedule for the same pass is
// cancelled first, so no reminder is left behind that its bell can't turn off (bug hunt 2026-10-20).
const remindPending = new Map();
function setReminder(opts) {
  const k = opts.key; if (k && remindPending.has(k)) return remindPending.get(k);
  const p = setReminderNow(opts).finally(() => { if (k) remindPending.delete(k); });
  if (k) remindPending.set(k, p);
  return p;
}
async function setReminderNow({ at, title, body, key }) {
  if (!isNative()) return 'app-only';
  if (at <= Date.now() + 30e3) { buzz('warning'); return 'past'; } // a reminder time already gone never pretends to be set (iOS playtest 2026-10-20)
  // Notifications refused: say so before anything else (iOS playtest 2026-10-20: it offered Plus, which couldn't help).
  try { const perm = await plugin('LocalNotifications')?.checkPermissions(); if (perm?.display === 'denied') { buzz('warning'); return 'denied'; } } catch {}
  if (reminderLimitHit(at, key)) { openPlus('reminders'); return 'limit'; } // over the Collection, so closing it puts you back where you were (2026-10-16 playtest)
  if (key && remindIds.has(key)) { try { await cancelNotify(remindIds.get(key).id); } catch {} }
  const id = newRemindId(); if (key) { remindIds.set(key, { id, at, title, body }); saveRems(); }
  // The one place a reminder’s result is felt (2026-10-17 haptics playtest: three different haptics, one fired before the
  // result): success when it’s set, warning when it couldn’t be.
  const r = await notifyAt(at, title, body, { id }); buzz(r === 'on' ? 'success' : 'warning');
  if (r !== 'on' && key && remindIds.get(key)?.id === id) { remindIds.delete(key); saveRems(); } /* not set (prompt declined, schedule failed): don't keep it, or the bell lights up after a relaunch (bug hunt 2026-10-22) */
  if (r === 'on' && key && cloudAt(remWatch(key, at))) { try { await cancelNotify(id); } catch {} remindIds.get(key).paused = true; saveRems(); } // cloud forecast: kept, waiting for it to clear
  return r;
}
// Reminder buttons (Tonight page, bad-weather page) are toggles (2026-10-15, Sevaan): set → an outlined "on" state with
// a success buzz; tap again → the notification is cancelled and the button goes back to how it was.
// A small sideways shake for something that didn’t work (2026-10-17 haptics playtest).
function shake(el) { if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return; el.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(-3px)' }, { transform: 'translateX(0)' }], { duration: 300, easing: 'ease-out' }); }
function remindDone(btn, ok, at, key) {
  const label = btn.firstElementChild ?? btn, side = btn.children[1];
  if (ok === null) return; // over the free limit: the Plus sheet is up
  if (ok) {
    btn.dataset.idle ??= label.innerHTML; btn.dataset.side ??= side?.textContent ?? ''; btn.dataset.key = key ?? '';
    label.innerHTML = `<span class="ico" data-ico="bell" aria-hidden="true"></span> Reminder on · ${fmtTime(at)}`;
    if (side) side.textContent = 'Turn off'; btn.classList.add('done'); btn.setAttribute('aria-pressed', 'true'); // felt in setReminder
  } else { const was = label.innerHTML; label.textContent = isNative() ? 'Couldn’t set it. Check notifications in Settings' : 'Reminders work in the app'; shake(btn); setTimeout(() => { label.innerHTML = was; }, 3500); }
}
// Undo a reminder button that’s on; true when it was on (and is now off).
function remindUndo(btn) {
  if (!btn.classList.contains('done')) return false;
  const key = btn.dataset.key; if (key) { reminded.delete(key); cancelNotify(remindIds.get(key)?.id); remindIds.delete(key); saveRems(); }
  (btn.firstElementChild ?? btn).innerHTML = btn.dataset.idle ?? 'Remind me'; if (btn.children[1]) btn.children[1].textContent = btn.dataset.side || '→';
  btn.classList.remove('done'); btn.setAttribute('aria-pressed', 'false'); buzz(8); return true;
}
const reminderWords = (r, when) => (r === 'on' ? `We’ll remind you at ${fmtTime(when)}.` : r === 'app-only' ? 'Reminders work in the Space Collector app.' : r === 'denied' ? 'Notifications are off for Space Collector. Turn them on in your phone’s Settings.' : r === 'past' ? 'It’s starting now: look up instead.' : 'Couldn’t set a reminder here.');
function reminderToast(r, when) {
  if (r === 'limit') return null; // the Plus sheet is already explaining (null: callers say nothing)
  if (collectionOpen) { colFrame.contentWindow?.postMessage({ sc: 'say', text: reminderWords(r, when) }, location.origin); return r === 'on'; } // toasts here sit behind the Collection (2026-10-14, Sevaan: "nothing happened")
  ticket(r === 'on' ? { kind: 'info', tone: 'steel', icon: 'bell', eyebrow: 'REMINDER SET', line: fmtTime(when), sub: 'We’ll nudge you then', ms: 3500 }
    : r === 'app-only' ? { kind: 'info', icon: 'bell', eyebrow: 'REMINDERS', line: 'They work in the app', sub: 'Space Collector for iPhone and Android', ms: 3500 }
    : r === 'denied' ? { kind: 'error', icon: 'belloff', eyebrow: 'NOTIFICATIONS OFF', line: 'Turn them on in Settings', sub: 'Your phone’s Settings → Space Collector', ms: 4500 }
    : { kind: 'error', icon: 'belloff', eyebrow: 'REMINDER', line: 'Couldn’t set one here', ms: 3500 });
  return r === 'on';
}
// "Remind me": a notification 10 minutes before the pass.
const remindLead = () => { try { const v = Number(localStorage.getItem('remindLead')); return [10, 5, 0].includes(v) && localStorage.getItem('remindLead') !== null ? v : 10; } catch { return 10; } }; // Settings → Reminders
async function remindPass(p, key, lead = remindLead()) {
  key ??= `${p.obj.id}@${p.start}`; // so an ISS pass is recognised as free wherever it’s set from
  const name = label(p.obj), at = p.start - lead * 60e3;
  const r = await setReminder({ at, title: lead ? `${fmtTime(p.start)}: ${name}` : `Now: ${name}`, body: `Look ${dirWord(p.riseAz)}. At its peak: ${whereWords({ el: p.peakEl, az: p.peakAz }).toLowerCase()}.`, key });
  return reminderToast(r, at);
}
// Choose when (2026-10-21, Sevaan; design/reminder-sheet.html B): what and where at the top, then three rows that each
// say who they're for. One tap sets it and closes the sheet. 10 minutes is the usual choice: a pass lasts only a few
// minutes, so "as it rises" is for people already outside. Cloud forecast then: said here, and the reminder waits for
// a clear forecast (recheckReminders).
let prPass = null, prKey = '', prChoices = [], prDone = null, prMoment = null;
const prTellCollection = (on) => { try { colFrame.contentWindow?.postMessage({ sc: 'find-reminded', key: prKey, on, set: [...reminded] }, location.origin); } catch {} };
// moment: a shiny chance { t, label, line } (2026-10-21, Sevaan): the times count back from that moment instead of the rise.
let lastPress = null; document.addEventListener('pointerdown', (e) => { lastPress = e.target; }, { capture: true, passive: true });
let prOrigin = null;
function openPassRemind(p, key, done = null, moment = null) {
  prOrigin = lastPress?.closest?.('button, [role=button]') ?? null; // the bell that opened it: the sheet folds back into it
  const t0 = now().getTime(), ref = moment?.t ?? p.start;
  prPass = p; prKey = key; prDone = done; prMoment = moment; // done(on): the bell that opened it lights or goes out
  prChoices = [[10, '10 min before', 'Time to get outside'], [5, '5 min before', 'If you’re near a door'], [0, moment ? 'At the moment' : 'As it rises', 'If you’re already out']]
    .map(([m, l, w]) => ({ lead: m, t: ref - m * 60e3, label: l, who: w })).filter((c) => c.t > t0 + 30e3);
  if (!prChoices.length) return;
  const cur = reminded.has(key) ? remindIds.get(key)?.at : null, owned = !isNewFind(p.obj);
  let img = null; try { img = artImage(cardModel(p.obj), 'small'); } catch {}
  $('pr-title').innerHTML = `<span class="pr-thumb${owned ? '' : ' hid'}"${img ? ` style="background-image:url('${img}')"` : ''}></span><span><b>${escapeHtml(label(p.obj))}</b><small>${moment ? `✦ ${escapeHtml(moment.label)} · ${escapeHtml(fmtTime(ref))}` : `Rises ${escapeHtml(fmtTime(p.start))} in the ${escapeHtml(dirWord(p.riseAz))}`}</small></span>`;
  $('pr-opts').innerHTML = (cloudAt(ref) ? '<p class="pr-cloud">Cloud is forecast then. We’ll only nudge you if it clears.</p>' : '')
    + prChoices.map((c, i) => `<button type="button" class="pr-row${cur != null && Math.abs(c.t - cur) < 60e3 ? ' on' : ''}" data-i="${i}"><span class="t">${escapeHtml(fmtTime(c.t))}</span><span class="w"><b>${escapeHtml(c.label)}${c.lead === remindLead() ? (c.lead === 10 ? '<i> · Best</i>' : '<i> · Usual</i>') : ''}</b><small>${escapeHtml(c.who)}</small></span><span class="chk" aria-hidden="true">✓</span></button>`).join('');
  $('pr-opts').onclick = (e) => { const o = e.target.closest('.pr-row'); if (o) prSet(Number(o.dataset.i), o); };
  $('pr-cancel').hidden = !reminded.has(key); openSheet('pr-sheet');
}
// The sheet folds into the bell (2026-10-21, slick idea 13): the row ticks, the sheet shrinks into the bell that opened
// it, the bell swings and chimes, and the time appears beside it for a moment. No bell on screen (e.g. from the
// Collection): the sheet just slides down as before.
function prFold(bell, time) {
  const sheet = $('pr-sheet'), card = sheet.querySelector('.set-sheet-card');
  const r = bell?.isConnected ? bell.getBoundingClientRect() : null;
  if (!r || !r.width || !card || matchMedia('(prefers-reduced-motion: reduce)').matches) { closeSheet(sheet); return; }
  const c = card.getBoundingClientRect(), dx = r.left + r.width / 2 - (c.left + c.width / 2), dy = r.top + r.height / 2 - (c.top + c.height / 2);
  setTimeout(() => {
    sheet.classList.add('folding');
    card.animate([{ transform: 'none', opacity: 1, borderRadius: getComputedStyle(card).borderRadius }, { transform: `translate(${dx}px, ${dy}px) scale(${Math.max(.04, r.width / c.width)})`, opacity: 0, borderRadius: '50%' }], { duration: 380, easing: 'cubic-bezier(.5,0,.75,.3)' })
      .finished.then(() => {
        sheet.classList.remove('in', 'folding'); sheet.hidden = true; renderSettings();
        bell.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-16deg)' }, { transform: 'rotate(12deg)' }, { transform: 'rotate(-7deg)' }, { transform: 'rotate(3deg)' }, { transform: 'rotate(0)' }], { duration: 560, easing: 'ease-out', composite: 'add' });
        sfx('stamp'); buzz('select');
        const tag = document.createElement('span'); tag.className = 'pr-fold-time'; tag.textContent = time;
        tag.style.left = `${r.left + r.width / 2}px`; tag.style.top = `${r.bottom + 6}px`; tag.classList.add('under'); // under the bell, clear of the buttons beside it (playtest 2026-10-21)
        document.body.append(tag); setTimeout(() => tag.remove(), 2400);
      }, () => closeSheet(sheet));
  }, 160); // let the row's tick show first
}
async function prSet(i, row) {
  const c = prChoices[i]; if (!c || !prPass || $('pr-sheet').classList.contains('folding') || prSet.busy) return;
  prSet.busy = true; setTimeout(() => { prSet.busy = false; }, 700);
  const m = prMoment, title = m ? (c.lead ? `${fmtTime(m.t)}: a shiny chance` : `Now: a shiny chance`) : c.lead ? `${fmtTime(prPass.start)}: ${label(prPass.obj)}` : `Now: ${label(prPass.obj)}`;
  const body = m ? `${label(prPass.obj)} ${m.line}. Catch it then for a shiny card.` : `Look ${dirWord(prPass.riseAz)}. At its peak: ${whereWords({ el: prPass.peakEl, az: prPass.peakAz }).toLowerCase()}.`;
  const r = await setReminder({ at: c.t, title, body, key: prKey });
  if (r !== 'on') {
    if (r === 'limit') { closeSheet($('pr-sheet')); return; } // the Plus sheet is explaining
    const sm = row.querySelector('small'), was = sm.textContent; // say why on the row itself: a notice would sit behind the sheet
    sm.textContent = r === 'app-only' ? 'Reminders work in the app' : r === 'denied' ? 'Notifications are off in Settings' : r === 'past' ? 'It’s starting now: look up' : 'Couldn’t set a reminder';
    shake(row); setTimeout(() => { sm.textContent = was; }, 3500); return; }
  reminded.add(prKey); row.classList.add('on'); prFold(prOrigin, fmtTime(c.t)); ghLast = ''; ghRemind(); prTellCollection(true); prDone?.(true);
  const cloudy = remindIds.get(prKey)?.paused, sub = cloudy ? 'Cloud is forecast: we’ll only nudge you if it clears' : prMoment ? `${c.lead ? `${c.lead} minutes before the` : 'At the'} shiny chance` : `${c.lead ? `${c.lead} minutes before` : 'As'} ${label(prPass.obj)}${c.lead ? '' : ' rises'}`;
  if (collectionOpen) colFrame.contentWindow?.postMessage({ sc: 'say', text: `Reminder set for ${fmtTime(c.t)}. ${sub}.` }, location.origin);
  else ticket({ kind: 'mission', tone: 'steel', icon: 'bell', eyebrow: 'REMINDER SET', line: fmtTime(c.t), sub, ms: 4000 });
}
$('pr-cancel').addEventListener('click', () => {
  if (!prKey) return; reminded.delete(prKey); cancelNotify(remindIds.get(prKey)?.id); remindIds.delete(prKey); saveRems(); buzz(8);
  closeSheet($('pr-sheet')); ghLast = ''; ghRemind(); prTellCollection(false); prDone?.(false);
  if (collectionOpen) colFrame.contentWindow?.postMessage({ sc: 'say', text: `Reminder off for ${prPass ? label(prPass.obj) : 'that pass'}.` }, location.origin);
  else ticket({ kind: 'info', icon: 'belloff', eyebrow: 'REMINDER OFF', line: prPass ? label(prPass.obj) : 'Reminder removed', ms: 2500 });
});
document.getElementById('pr-sheet').addEventListener('click', (e) => { if (e.target.id === 'pr-sheet') closeSheet(e.currentTarget); });
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
// Weather (js/weather.js) for the sky’s clouds and the Tonight line; refreshed every half hour and when you move.
let weatherAt = 0, weatherKey = '';
function requestWeather() {
  const o = state.observer; if (!o) return;
  const key = `${o.lat.toFixed(2)},${o.lon.toFixed(2)}`;
  if (key === weatherKey && Date.now() - weatherAt < 30 * 60e3) return;
  weatherKey = key; weatherAt = Date.now();
  // An older reply for a place you’ve left is dropped, and a failed fetch can retry in a minute (QA 2026-10-08).
  fetchWeather(o.lat, o.lon).then((w) => { if (key !== weatherKey) return; state.weather = w; recordSkyNights(); recheckReminders().catch(() => {}); updateNextPassChip(); if (state.tonight) scheduleNotes(state.tonight).catch(() => {}); shareWidgets(); }).catch(() => { if (key === weatherKey) weatherAt = Date.now() - 29 * 60e3; });
}
// Tonight’s sky in words, from the forecast and tonight’s dusk/dawn: { ok, line, nextClear } or null.
// 'tomorrow' for the next local day, else the weekday (playtest 2026-10-16: the tab said Saturday, the page tomorrow).
const dayWord = (t) => { const a = new Date(now().getTime()), b2 = new Date(t); a.setHours(12, 0, 0, 0); b2.setHours(12, 0, 0, 0); return Math.round((b2 - a) / 864e5) === 1 ? 'tomorrow' : b2.toLocaleDateString([], { weekday: 'long' }); };
// Each night’s forecast, kept by date, so cloudy weeks don’t break the observing streak (js/progress.js streaks).
// Nearer forecasts overwrite older ones, so tonight’s is the last word. 120 days kept.
function recordSkyNights() {
  const wx = tonightWeather(); if (!wx?.nights?.length) return;
  let m = {}; try { m = JSON.parse(localStorage.getItem('skyNights') || '{}'); } catch {}
  const day = (t) => { const d = new Date(t); d.setHours(12, 0, 0, 0); return Math.round(d.getTime() / 86400e3); };
  for (const n of wx.nights) m[day(n.t)] = isGoodNight(n) ? 0 : 1;
  const old = day(Date.now()) - 120; for (const k of Object.keys(m)) if (Number(k) < old) delete m[k];
  try { localStorage.setItem('skyNights', JSON.stringify(m)); } catch {}
}
function tonightWeather() {
  const T = state.tonight; if (!state.weather || !T) return null;
  const w = tonightSky(state.weather, T.dusk ?? T.startMs, T.dawn ?? (T.startMs + 12 * 3600e3), fmtTime, now().getTime());
  // Judged by the evening, like the Tonight page (playtest 2026-10-16: the tab said "Overcast now, clearing by 2:00 AM"
  // while the page said "Cloudy tonight"). A clearing that only comes after the evening is a cloudy evening, with the
  // late clearing as a small extra. Night owls plan to dawn, so it stays as it was for them.
  if (w && !readPref('nightOwl', false) && w.clearFrom && w.clearFrom > eveningEnd(T) && w.kase !== 'clear') {
    const word = (/^(\w+) (?:now|at dusk|for)/.exec(w.line)?.[1] ?? 'Cloud').replace(/^Cloud$/, 'Cloudy');
    return { ...w, ok: false, line: `${word} all evening · clears around ${fmtTime(w.clearFrom)}` };
  }
  return w;
}
const isDay = () => (state.frame?.sunEl ?? -90) > -6;
// Is the sky forecast to be clouded over at this moment? (2026-10-13 playtest: an overcast night still recommended passes.)
const cloudAt = (t) => !!state.weather && !skyClearAt(state.weather, t);
// Ghost markers by day: tonight’s best passes (and the ISS) wherever they are right now, so you can watch them
// cross the sky you’ll see them in later. A handful, each tied to a Tonight row.
// By day (2026-10-13, Sevaan: "circles in the sky showing where to see some cool satellites tonight and when"): tonight’s
// best passes drawn where they’ll be. A circle where it appears with the name and time (no track lines: 2026-10-13, Sevaan). Cards you don’t have first, rarest first, then brightest; up to four.
// Line one up in the circle to see when it comes and set a reminder (#gh-remind); no tapping needed.
// A pass’s short track around the moment it appears (back 2026-10-13, Sevaan: "put the trails back… style them so
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
// Worked out again only when tonight’s plan, the collection or the half-minute changes (2026-10-16 perf sweep: it ran
// every frame and was a quarter of the sky’s work by day).
let ghostMemo = { key: '', val: null };
function dayGhosts() {
  if (!isDay() || !state.tonight) return null;
  const mk = `${state.tonight.dusk}|${state.tonight._head?.start ?? ''}|${state.sightings.length}|${Math.floor(now().getTime() / 30000)}`;
  if (ghostMemo.key === mk && ghostMemo.T === state.tonight) return ghostMemo.val;
  ghostMemo = { key: mk, T: state.tonight, val: dayGhostsNow() }; return ghostMemo.val;
}
function dayGhostsNow() {
  const t0 = now().getTime(), tierOf = (o) => (state.cardModels.get(cardKeyFor(o)) ?? o).tier;
  const score = (p) => (p.fresh ? 1000 : 0) + (TIER_RANK[tierOf(p.obj)] ?? 0) * 100 + (p.obj.icon ? 60 : 0) + Math.max(0, 4 - p.mag) * 8 + p.peakEl / 4;
  const picks = tonightPasses(state.tonight, t0).filter((p) => p.start > t0 && p.start <= eveningEnd(state.tonight) && p.peakEl >= 15).sort((a, b) => score(b) - score(a))
    .filter((p, i, all) => all.findIndex((q) => cardKeyFor(q.obj) === cardKeyFor(p.obj)) === i).slice(0, 4); // the evening only; one per card (three Iridium passes are one fleet card)
  const head = headliner(state.tonight); const isHead = (p) => !!head && p.obj.id === head.obj.id && p.start === head.start;
  if (head && head.start > t0 && !picks.some(isHead)) { picks.unshift(head); picks.splice(4); } // the headliner always shows, in gold
  state.dayPicks = picks;
  return picks.map((p) => {
    const tier = TIER_INFO[tierOf(p.obj)] ?? TIER_INFO.common;
    // The circle sits where it appears, at the time on its label.
    const head = isHead(p);
    return { id: p.obj.id, obj: p.obj, pass: p, enu: enuFromAzEl(p.riseAz, p.riseEl), path: passPath(p), color: head ? '#ffc93d' : tier.color, name: label(p.obj), time: fmtTime(p.start), head: !!head, what: `${tier.gem} ${tier.label}${p.fresh ? ' · new to you' : ''}`, note: '' }; /* the headliner says so in the kicker, so the detail stays one line (visual playtest 2026-10-25) */
  });
}
// Compass trouble (2026-10-06, Sevaan: the sky spun until the compass sorted itself out). iOS reports how unsure its
// compass is (webkitCompassAccuracy, ± degrees; -1 = not calibrated), and js/sensors.js notices when north has to
// jump. Either way, ask for a figure-8 — at most once every few minutes, and only while using motion.
let compassAskAt = -Infinity, compassMisses = 0; // misses: "Not quite" taps, evidence the sky may be off (2026-10-25, rule 5)
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
  // so only ask once it’s had 20 s and is still off.
  if (state.liveSince == null || t - state.liveSince < 20000) return;
  const acc = pointing.compassAccuracy, jumped = t - pointing.compassJumpAt < 2000;
  const bad = acc === -1 || acc > 35 || jumped || pointing.compassDoubt > 0.6;
  // 2026-10-07 (Sevaan: sometimes you wave for ages): the moment the compass reads well, the nudge goes.
  if (!bad) { if (toastPending('compass')) dropToast('compass'); return; }
  if (t - compassAskAt < 4 * 60e3) return;
  // Help waits for evidence (2026-10-25, Sevaan; design/catch-feel.html 06 rule 5): never before the first catch, and only
  // after two misses (a "Not quite" tap) with the compass reading badly.
  if (!state.sightings.some((x) => !x.sim) || compassMisses < 2) return;
  compassAskAt = t; compassMisses = 0;
  ticket({ kind: 'compass', id: 'compass', sticky: true, unasked: true, eyebrow: 'COMPASS', line: 'Needs a nudge', sub: 'Wave the phone in a slow figure-8, away from metal.', ms: 7000 });
}
// ---------- below the horizon (2026-10-06) ----------
// What’s under your feet right now: the Sun, Moon and bright planets (with when they next rise) and tonight’s next
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
// A satellite’s track under the ground for the last ~12 minutes before it comes up (20 s steps), cached briefly.
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
// horizon (halo + name in the circle), never collectable. Only while it isn’t dark enough to see any.
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
// before holding the phone up"): what’s up now, placed on the ring by direction, with how high it is. The Moon,
// planets, new satellites in view (rarest first) and the brightest named stars, at most 8.
function feetItems() {
  if ((state.basis?.back?.[2] ?? 0) > -0.6) return null;
  // What’s up, for the compass map at your feet (2026-10-13, design/feet-compass.html A + C): the Moon, planets and
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
    out.push({ enu: b.enu, kind: b.kind, obj: NATURAL_BY_KEY.get(b.kind === 'sun' || b.kind === 'moon' ? b.kind : `planet:${String(b.name).toLowerCase()}`) ?? null, /* its card for the ticket (2026-10-25) */ name: b.kind === 'sun' ? 'The Sun' : b.kind === 'moon' ? 'The Moon' : b.name, note: whenOf(r), riseAz: r?.az, where: r ? compassPoint(r.az) : '', time: r ? fmtTime(r.t) : '', path: r ? [b.enu, ...r.path] : null, past: r?.past });
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
  if (groundShown) { g.hidden = false; return; } // renderTarget hides #guidance when nothing’s targeted; keep it up
  if (t - groundSince < 3000) return;
  const T = state.tonight, t0 = now().getTime(), next = T ? tonightPasses(T, t0).find((p) => p.start > t0) : null;
  g.textContent = next ? `Looking at the ground. Raise your phone: ${label(next.obj)} comes up in the ${compassPoint(next.riseAz)} at ${fmtTime(next.start)}.` : 'Looking at the ground. Raise your phone to the sky.';
  g.classList.add('ground'); g.hidden = false; groundShown = true;
}
// The chip in the upper right (2026-10-06, Sevaan: out of the way of the sky labels): label / name / detail ›.
// Compact (2026-10-06): a short detail rides on the label line ('NEXT UP · 9:44 PM ›' over the name); a long one gets its own line.
// One line (2026-10-06): 'NEXT UP · COSMOS 2082 · 9:44 PM ›', one size, the name bold orange (it gives way with … first).
// 'NEXT: COSMOS 2082 · 9:44 PM' (2026-10-07: a colon instead of a dot after the label, no ›, so the name gets the room).
const chipName = (o) => label(o).replace(/\s*\([^)]*\)\s*$/, ''); // "OPS 6182 (DMSP 5D-1 F2)" → "OPS 6182": the chip has room for a name, not its alias (iOS playtest 2026-10-20)
const npChip = (k, n, m) => `${k ? `<span class="np-k">${escapeHtml(k)}</span>` : ''}<b class="np-n"${String(n).length > 8 ? ' data-long' : ''}>${escapeHtml(n)}</b>${m ? `<span class="np-m">· ${escapeHtml(m)}</span>` : ''}`;
// The pass to suggest (2026-10-13, Sevaan: "we don’t need to tell people about common objects unless every other object
// rarity has been exhausted"): new to you, Uncommon or rarer, rarest then soonest; Commons only once fewer than 10
// Uncommon-or-better cards are left that you don’t have. Null if nothing qualifies.
// Tonight’s headliner (2026-10-14, Sevaan; design/fun-and-learning.html): one object a night, the most special evening
// pass you don’t have yet: famous icons and stations first, then a falling last-chance satellite, then rarity, height
// and brightness. Chosen once per plan (from dusk), so it doesn’t change as the evening goes on. +25 XP when caught.
function headliner(T) {
  if (!T) return null;
  // Recomputed every 10 minutes too (2026-10-18 playtest: the chip and the Tonight tab named different headliners), and
  // only from passes still to come.
  const hk = `${state.skySb}|${Math.floor(now().getTime() / 600000)}`;
  if (T._head !== undefined && T._headSb === hk) return T._head;
  T._headSb = hk;
  const tierN = (o) => TIER_RANK[cardModel(o).tier] ?? 0, from = Math.max(T.dusk ?? T.startMs ?? 0, now().getTime() - 5 * 60000);
  const score = (p) => (p.obj.icon || p.obj.type === 'station' ? 300 : 0) + (cardModel(p.obj).fallAt ? 150 : 0) + tierN(p.obj) * 100 + p.peakEl / 3 + Math.max(0, 4 - (p.mag ?? 9)) * 8;
  // Easy to see from where you are (2026-10-14, Sevaan): the slider’s sky, with room to spare, so a city-sky player is
  // never sent out for something that needs a dark site. Its brightest moment has to beat your limit by 0.8 mag.
  const lim = skyLimit({ sb: state.skySb }), easy = (p) => p.mag != null && p.mag <= (state.binoculars ? lim.binoculars : lim.satellites) - 0.8;
  const ps = tonightPasses(T, from).filter((p) => p.fresh && p.start >= from && p.start <= eveningEnd(T) && p.peakEl >= 20 && !p.obj.family && easy(p));
  return (T._head = ps.sort((a, b) => score(b) - score(a))[0] ?? null);
}
const isHeadliner = (obj) => { const h = headliner(state.tonight); return !!h && h.obj.id === obj.id; };
// Notifications (2026-10-14, Sevaan; design/notifications.html): the app sends at most two a day on its own, and the
// automatic pass alerts are gone. 1) Look up: at the start of the evening’s best hour (from dusk, never after 10:30 pm),
// only when the forecast is clear then. 2) Catch of the day: tonight’s headliner, 5 minutes before it rises (was 10; 2026-10-15), if you don’t
// have it and it’s clear. Anything else comes only from reminders you set. Native app only (local notifications);
// rescheduled whenever tonight’s plan or the forecast changes. Settings: prefs nLookUp / nCatch (both on by default).
const NOTE_LOOK = 7120, NOTE_CATCH = 7110, NOTE_RARE = [7130, 7131], NOTE_GHOST = 7150, NOTE_SEASON = 7160, NOTE_TRAIN = 7170, NOTE_BDAY = 7180;
const notePref = (k) => readPref(k, true);
async function notesAllowed() { if (!isNative()) return false; try { return (await plugin('LocalNotifications').checkPermissions()).display === 'granted'; } catch { return false; } }
function lookUpAt(T) {
  if (!T?.dusk) return null;
  const d = new Date(T.dusk), late = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 22, 30).getTime(), end = Math.min(eveningEnd(T), late);
  if (end <= T.dusk) return null;
  // The start of the busiest hour between dusk and the end of the evening.
  const pts = T.curve.filter(([t]) => t >= T.dusk && t <= end); let best = [T.dusk, -1];
  for (const [t] of pts) { if (t > end - 30 * 60000) break; const n = pts.filter(([u]) => u >= t && u < t + 3600e3).reduce((a, [, c]) => a + c, 0); if (n > best[1]) best = [t, n]; }
  return { at: best[0], until: Math.min(best[0] + 3600e3 * 1.5, end) };
}
// Runs one at a time, always with the newest plan (QA 2026-10-16): two runs overlapping could let an older run schedule
// an alert after a newer one (say, on a cloudy forecast) had cancelled it.
let notesQ = Promise.resolve(), notesT = null;
function scheduleNotes(T) { notesT = T; notesQ = notesQ.then(() => (notesT === T ? scheduleNotesNow(T) : null)).catch(() => {}); return notesQ; }
async function scheduleNotesNow(T) {
  if (!(await notesAllowed())) return;
  await cancelNotify(NOTE_LOOK); await cancelNotify(NOTE_CATCH); for (const id of ALERT_IDS) await cancelNotify(id); // old automatic pass alerts
  const t0 = Date.now(), clear = (t) => goodSkyAt(state.weather, t); // only on a good night, never on unknown weather
  const quiet = (t) => { const hr = new Date(t).getHours(); return hr >= 23 || hr < 7; }; // nothing the app sends itself between 11 pm and 7 am
  const lu = lookUpAt(T);
  if (notePref('nLookUp') && lu && lu.at > t0 + 60000 && clear(lu.at) && !(new Date(t0).getHours() >= 17 && t0 > T.dusk - 3 * 3600e3 && openedTonight)) {
    const fresh = new Set(tonightPasses(T, lu.at).filter((p) => p.fresh && p.start <= lu.until).map((p) => cardKeyFor(p.obj))).size;
    await notifyAt(lu.at, `Until ${fmtTime(lu.until)}: best viewing`, fresh ? `${fresh} card${fresh === 1 ? ' you haven’t collected passes' : 's you haven’t collected pass'} over before then. Go find one.` : 'It’s dark and clear. See what’s in your sky.', { id: NOTE_LOOK });
  }
  const h = headliner(T);
  // When the headliner is one you already have, Catch of the day's slot goes to a card one night from its next level,
  // 30 minutes before it passes (design/come-back.html 01).
  if (notePref('nCatch') && !(h && isNewFind(h.obj))) { const a = almostThere(T, t0)[0]; if (a && a.p.start - 30 * 60000 > t0 && !quiet(a.p.start - 30 * 60000) && clear(a.p.start)) {
    await notifyAt(a.p.start - 30 * 60000, `${fmtTime(a.p.start)}: one night from ${a.to}`, `Catch ${widgetName(a.p.obj)} tonight and its card turns ${a.to.toLowerCase()}. Look ${whereWords({ el: a.p.peakEl, az: a.p.peakAz }).toLowerCase()}.`, { id: NOTE_CATCH }); } }
  if (notePref('nCatch') && h && h.start - 5 * 60000 > t0 && !quiet(h.start - 5 * 60000) && isNewFind(h.obj) && clear(h.start) && !reminded.has(`${h.obj.id}@${h.start}`)) { // not as well as a reminder you set for the same pass
    await notifyAt(h.start - 5 * 60000, `${fmtTime(h.start)}: tonight’s headliner`, `Catch ${label(h.obj)} for +${headlinerXp(h.obj)} XP. Look ${whereWords({ el: h.peakEl, az: h.peakAz }).toLowerCase()}.`, { id: NOTE_CATCH });
  }
  // One special notification a night on top of the usual two (bug hunt 2026-10-25: Halloween, a birthday pass, a train
  // and a constellation could all fire on one evening). Highest first: the Halloween ghost, your birthday satellite, a
  // Starlink train, then a seasonal return. "Told" flags remember the pass they were for, so the many reschedules before
  // it (each one cancels first) put the same notification back instead of losing it.
  for (const id of [NOTE_SEASON, NOTE_BDAY, NOTE_TRAIN, NOTE_GHOST]) await cancelNotify(id); // NOTE_BDAY: cancels any birthday notification left from before it was removed
  const readJ = (k) => { try { return JSON.parse(localStorage.getItem(k) ?? '{}') ?? {}; } catch { return {}; } }, saveJ = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const special = (() => {
    if (notePref('nMeteor') && T?.dusk && ghostNight(T.dusk) && !secretFound[GHOST.patch]) { const g = ghostPass(T); if (g && g.end > t0 && T.dusk > t0 + 60000 && clear(g.start)) return { at: T.dusk, title: 'Tonight: something’s haunting the sky', body: `A satellite that died long ago passes at ${fmtTime(g.start)}. Find it tonight.`, id: NOTE_GHOST }; }
    if (notePref('nTrain')) { const told = readJ('trainTold2');
      const tr = tonightTrains(T, t0).find((x) => (!told[x.key] || told[x.key] === x.start) && x.start - 10 * 60000 > t0 && x.start <= eveningEnd(T) && !quiet(x.start - 10 * 60000) && clear(x.start));
      if (tr) return { at: tr.start - 10 * 60000, title: `${fmtTime(tr.start)}: a Starlink train`, body: `${trainWords(tr)}. Look ${dirWord(tr.first.riseAz)}: it ${tr.first.peakEl >= 60 ? 'climbs high' : tr.first.peakEl >= 30 ? 'climbs halfway up' : 'stays low'}.`, id: NOTE_TRAIN, mark: () => { const t2 = readJ('trainTold2'); t2[tr.key] = tr.start; saveJ('trainTold2', t2); } }; }
    if (notePref('nLookUp') && settledIn()) { const noted = readJ('conBackNote'), at = at930(t0), sh = showerSoon(t0), six = new Date(t0).setHours(18, 0, 0, 0);
      const b = consBack(t0).find((x) => !noted[x.c.con] || noted[x.c.con] === at);
      if (b && at > t0 + 60000 && clear(at)) return { at, title: `${fmtTime(at)}: ${b.c.name} is back`, /* the clock setting, not a fixed "9:30 PM" (US/UK playtest 2026-10-25) */ body: `${b.c.data?.nick ? `${b.c.data.nick[0].toUpperCase()}${b.c.data.nick.slice(1)} is` : 'It’s'} clear of the trees tonight, the first evening this season. ${b.c.stars.length - b.have} of its ${b.c.stars.length} stars are new to you.`, id: NOTE_SEASON, mark: () => { const n2 = readJ('conBackNote'); n2[b.c.con] = at; saveJ('conBackNote', n2); } };
      if (sh && sh.days === 7 && six > t0 + 60000) return { at: six, title: `In 7 days: the ${sh.e.shower}`, body: `${sh.e.rate[0].toUpperCase()}${sh.e.rate.slice(1)}. Peak night is ${new Date(sh.night).toLocaleDateString(undefined, { weekday: 'long' })}. Catch any card that night for its badge.`, id: NOTE_SEASON }; }
    return null;
  })();
  if (special) { await notifyAt(special.at, special.title, special.body, { id: special.id }); special.mark?.(); }
  // Rare alerts (Plus, 2026-10-16, Sevaan; off by default): up to 2 a night, for a new Rare or better (no fleets) passing
  // on a clear evening, 5 min ahead, 30 min apart, never 11 pm to 7 am, and never the headliner (Catch of the day has it).
  for (const id of NOTE_RARE) await cancelNotify(id);
  if (isPlus() && readPref('nRare', false)) {
    const tierN = (o) => TIER_RANK[(state.cardModels.get(cardKeyFor(o)) ?? o).tier] ?? 0;
    const picks = [], seen = new Set();
    for (const p of tonightPasses(T, t0).filter((p) => p.fresh && !p.obj.family && tierN(p.obj) >= 2 && p.start - 5 * 60000 > t0 && !quiet(p.start - 5 * 60000) && clear(p.start) && !(h && notePref('nCatch') && p.id === h.id && p.start === h.start))
      .sort((a, b) => tierN(b.obj) - tierN(a.obj) || a.start - b.start)) {
      const k = cardKeyFor(p.obj); if (seen.has(k) || picks.some((q) => Math.abs(q.start - p.start) < 30 * 60000)) continue;
      seen.add(k); picks.push(p); if (picks.length === NOTE_RARE.length) break;
    }
    for (const [i, p] of picks.sort((a, b) => a.start - b.start).entries()) { const m = alertText(p); await notifyAt(p.start - 5 * 60000, m.title, m.body, { id: NOTE_RARE[i] }); }
  }
}
// Opening the app in the evening means you don’t need the Look up nudge tonight.
let openedTonight = false;
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { markOpened(); if (state.tonight) shareWidgets(); } /* the widgets get a fresh plan each time you come back (2026-10-24, Sevaan: the widget kept last night's) */ else if (isNative()) sendWidgets().catch(() => {}); }); // the widgets get the latest on the way out
function markOpened() { const T = state.tonight, t = Date.now(); if (T?.dusk && t > T.dusk - 2 * 3600e3 && t < (T.dawn ?? T.dusk + 10 * 3600e3)) { openedTonight = true; cancelNotify(NOTE_LOOK).catch(() => {}); } }
function bestUpcoming(T, t0, until = Infinity) {
  if (!T) return null;
  const tierN = (o) => TIER_RANK[(state.cardModels.get(cardKeyFor(o)) ?? o).tier] ?? 0;
  const fresh = tonightPasses(T, t0).filter((p) => p.start > t0 && p.start <= until && p.fresh);
  const leftBetter = (state.catalog?.objects ?? []).filter((o) => !o.family && tierN(o) >= 1 && isNewFind(o)).length;
  const pool = leftBetter >= 10 ? fresh.filter((p) => tierN(p.obj) >= 1) : fresh;
  // The best of the next three hours before anything later (2026-10-18 playtest: a 5 AM Rare headlined over a new
  // Iridium two hours away).
  const soon = pool.filter((p) => p.start - t0 <= 3 * 3600e3);
  return (soon.length ? soon : pool).slice().sort((a, b) => tierN(b.obj) - tierN(a.obj) || a.start - b.start)[0] ?? null;
}
function updateNextPassChip() {
  // The radar fades in together with the next-up chip, once tonight’s plan is in (fallback: 4 s after the sky opens).
  if (!document.body.classList.contains('hud-ready') && (state.tonight || performance.now() - (state.skyOpenedAt ?? 0) > 4000)) { document.body.classList.add('hud-ready'); skybarRest(4000); } // the slider fades back a few seconds after Explore shows
  const chip = $('nextpass');
  const lit = state.items?.some((i) => i.look.visible);
  const T = state.tonight, t0 = now().getTime();
  if (lit || !T || (state.timeOffsetMs && !isDay())) { if (!chip.hidden) chip.hidden = true; return; }
  const next = bestUpcoming(T, t0, eveningEnd(T)); // the corner chip suggests what’s worth it, not just the soonest
  const win = tonightWindows(T).find((w) => w.s > t0);
  const dark = T.curve.length && t0 >= T.curve[0][0];
  // By day: one honest line about tonight (dark when, best pass, the sky), tap for the whole plan.
  if (isDay()) {
    const wx = tonightWeather(), best = bestUpcoming(T, t0, eveningEnd(T)), head = headliner(T);
    const dusk = T.dusk ? fmtTime(T.dusk) : null;
    chip.innerHTML = wx && !wx.ok
      // Short enough to fit whole (2026-10-11, Sevaan: "Not tonight: Rain all n… · See the …" was unreadable):
      // 'RAIN TONIGHT · CLEAR THU'.
      ? npChip('', `${({ rain: 'Rain', snow: 'Snow', storm: 'Storms', fog: 'Fog' })[wx.worst] ?? 'Cloud'} tonight`, wx.nextClear ? `Clear ${new Date(wx.nextClear).toLocaleDateString([], { weekday: 'short' })}` : '')
      // Daytime: 'TONIGHT: ISS · 7:16 PM' (2026-10-08, Sevaan: it didn’t fit and the name vanished). Dusk and a good
      // forecast are left out; bad weather has its own 'Not tonight' chip above.
      : head && head.start > t0 ? npChip('Headliner', chipName(head.obj), fmtTime(head.start))
      : npChip('Tonight', best ? label(best.obj) : 'See the plan', best ? fmtTime(best.start) : (dusk ? `dark ${dusk}` : ''));
    chip.hidden = false; return;
  }
  const head = headliner(T), headNext = head && head.start > t0 && isNewFind(head.obj) && head.start - t0 < 3 * 3600e3;
  chip.innerHTML = headNext ? npChip('Headliner', chipName(head.obj), fmtTime(head.start)) : next ? npChip(dark ? 'Next' : `From ${fmtTime(win?.s ?? next.start)}`, chipName(next.obj), fmtTime(next.start))
    : win ? npChip('Satellites back', fmtTime(win.s), '') : npChip('No more satellites', 'tonight', ''); /* short enough to never cut off (2026-10-21, Sevaan); the chip still opens the plan */
  chip.hidden = false;
}
$('nextpass').addEventListener('click', () => { showVTab('tonight'); openPanel('visible'); });

// Settings → Pass alerts (#14). Hidden until the push val is deployed (js/pass-alerts.js PUSH).
// Settings → Look up / Catch of the day (2026-10-14): app only. Turning one on asks for notifications if needed.
$('row-push').hidden = !isNative(); $('row-catch').hidden = !isNative(); $('row-train').hidden = !isNative(); $('row-rare').hidden = !isNative();
$('chk-rare').checked = isPlus() && readPref('nRare', false);
$('chk-rare').addEventListener('change', async (e) => {
  if (e.target.checked && !isPlus()) { e.target.checked = false; openPlus('rare'); return; }
  writePref('nRare', e.target.checked);
  if (e.target.checked && !(await askNotifications())) { e.target.checked = false; writePref('nRare', false); ticket({ kind: 'error', icon: 'belloff', eyebrow: 'NOTIFICATIONS OFF', line: 'Turn them on in Settings', sub: 'Your phone’s Settings → Space Collector', ms: 4500 }); return; }
  if (state.tonight) scheduleNotes(state.tonight).catch(() => {});
});
// The switches show ON only when the phone actually lets us notify (2026-10-16 playtest: both read ON before
// notifications were allowed). The preference itself is kept, so allowing them later brings them back.
async function syncNoteToggles() {
  const ok = await notesAllowed();
  $('chk-push').checked = ok && notePref('nLookUp'); $('chk-catch').checked = ok && notePref('nCatch'); $('chk-train').checked = ok && notePref('nTrain'); $('chk-rare').checked = ok && isPlus() && readPref('nRare', false);
}
syncNoteToggles();
for (const [id, k] of [['chk-push', 'nLookUp'], ['chk-catch', 'nCatch'], ['chk-train', 'nTrain']]) $(id).addEventListener('change', async (e) => {
  writePref(k, e.target.checked);
  if (e.target.checked && !(await askNotifications())) { e.target.checked = false; writePref(k, false); ticket({ kind: 'error', icon: 'belloff', eyebrow: 'NOTIFICATIONS OFF', line: 'Turn them on in Settings', sub: 'Your phone’s Settings → Space Collector', ms: 4500 }); return; }
  if (state.tonight) scheduleNotes(state.tonight).catch(() => {});
});
async function askNotifications() { if (!isNative()) { try { return 'Notification' in window && (Notification.permission === 'granted' || (await Notification.requestPermission()) === 'granted'); } catch { return false; } } /* the website asks the browser (testing; it can’t schedule) */ try { const ln = plugin('LocalNotifications'); let p = await ln.checkPermissions(); if (p.display !== 'granted') p = await ln.requestPermissions(); return p.display === 'granted'; } catch { return false; } }
if (!isNative() && pushOn()) disablePush().catch(() => {}); // the old web pass alerts are retired
// Meteor shower events (js/events.js). Catching anything during one earns its badge. (2026-10-20, Sevaan: the chip
// vanished when tapped, which felt broken.) Now it's one notice per shower, shown at a quiet moment (nothing in the
// circle, no page, reveal or tour open, for a few seconds), and tapping it opens tonight's plan. No chip.
let eventQuietSince = 0;
const eventStartedAt = Date.now();
let eventQueued = null;
function updateEventBanner() {
  const el = $('event-banner'); if (!el.hidden) el.hidden = true;
  const e = activeEvent(now().getTime()); if (!e || !readPref('nMeteor', true)) return; // Settings → Meteor showers
  if (state.sightings.some((s) => eventOf(s)?.id === e.id)) return; // badge earned already
  let told = false; try { told = localStorage.getItem('eventRead') === e.id; } catch {}
  if (told) return;
  const quiet = !state.lockedOn && !activePanel && !collectionOpen && $('reveal').hidden && $('start').hidden && $('onboard').hidden
    && !document.body.classList.contains('ob-tour') && !document.querySelector('.set-sheet.in') && Date.now() - eventStartedAt > 10000;
  if (!quiet) { eventQuietSince = 0; return; }
  if (!eventQuietSince) { eventQuietSince = Date.now(); return; }
  if (Date.now() - eventQuietSince < 4000) return;
  if (eventQueued === e.id) return; eventQueued = e.id; // queued this session; read only once it shows (bug hunt 2026-10-25)
  ticket({ kind: 'event', icon: e.kind === 'shower' ? 'meteor' : e.kind === 'planet' ? 'sparkle' : 'moon', eyebrow: e.kind === 'shower' ? 'METEOR SHOWER' : 'TONIGHT IN THE SKY', unasked: true, onShow: () => { try { localStorage.setItem('eventRead', e.id); } catch {} }, line: e.kind === 'shower' ? `${e.name.replace(/\s*\d{4}$/, '')} tonight` : e.name,
    sub: localText(eventLine(e)), ms: 8000, /* miles and US spelling where they apply */ go: 'See tonight',
    action: () => { showVTab('tonight'); openPanel('visible'); } });
}

// ---------- drag to look ----------

let dragStart = null, tapStart = null;
$('sky').addEventListener('pointerdown', (e) => {
  if (dragStart) return; // a second finger doesn't take over the drag (bug hunt 2026-10-20: the view jumped)
  tapStart = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId };
  // A phone that has given a direction keeps motion, even lying still (it sends nothing then). Only a device that never
  // sent a reading (a computer) turns to finger mode on touch (2026-10-08), and not while checking motion after a return.
  if (!state.drag.on && (hasSensorView() || performance.now() < (state.motionCheckUntil ?? 0))) return;
  if (!hasSensorView()) state.drag.on = true;
  state.followPreview = false; state.dragFollow = null;
  dragStart = { x: e.clientX, y: e.clientY, az: state.drag.az, el: state.drag.el, id: e.pointerId };
  $('sky').setPointerCapture(e.pointerId);
});
$('sky').addEventListener('pointermove', (e) => {
  if (!dragStart || e.pointerId !== dragStart.id) return;
  const degPerPx = sky.fovV / sky.h;
  state.drag.az = (dragStart.az - (e.clientX - dragStart.x) * degPerPx + 360) % 360;
  state.drag.el = Math.max(-89, Math.min(89, dragStart.el + (e.clientY - dragStart.y) * degPerPx)); // all the way down to your feet (2026-10-08)
});
$('sky').addEventListener('pointerup', (e) => {
  if ((dragStart && e.pointerId !== dragStart.id) || (tapStart && e.pointerId !== tapStart.id)) return; // the other finger
  // A tap (not a drag): select whatever is under your finger, or clear the selection.
  const tap = tapStart && Math.hypot(e.clientX - tapStart.x, e.clientY - tapStart.y) < 10 && performance.now() - tapStart.t < 500;
  dragStart = tapStart = null;
  if (tap) tapSky(e.clientX, e.clientY);
});
$('sky').addEventListener('pointercancel', (e) => { if (!dragStart || e.pointerId === dragStart.id) dragStart = tapStart = null; });

// Tap a satellite, the Moon, a planet or a bright star to select it: it stays the target and the
// guidance tells you which way to turn. Tap empty sky to let go of the selection.
const TAP_REACH = 30; // px: a fingertip
function tapSky(cx, cy) {
  if (calib) return; // lining up the sky: taps don't pick things
  const r = $('sky').getBoundingClientRect(), x = cx - r.left, y = cy - r.top;
  // A daytime pass marker lined up in the circle: tapping the circle previews its card (2026-10-13, Sevaan).
  if (sky.ghostHitId != null) {
    const rc = sky.ring ?? { x: sky.cx, y: sky.cy, r: sky.reticlePx }, p = state.dayPicks?.find((q) => q.obj.id === sky.ghostHitId);
    if (p && Math.hypot(x - rc.x, y - rc.y) <= rc.r + 10) { showTonightCard(p.obj, { left: cx - 20, top: cy - 20, width: 40, height: 40, x: cx, y: cy }, `APPEARING HERE TONIGHT AT ${fmtTime(p.start).toUpperCase()}`); return; }
  }
  let best = null, bestD = TAP_REACH;
  for (const h of sky.hits ?? []) { const d = Math.hypot(h.x - x, h.y - y); if (d < bestD) { best = h.id; bestD = d; } }
  for (const n of state.naturals ?? []) {
    if (n.obj.natural === 'star') continue; // stars aren’t tappable: you find them by panning the circle onto them (2026-10-17, Sevaan)
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
let arCardOrder = null; let arArmed = {}; let arPrevFace = null, arFlash = {}, arInView = new Set(), arPings = new Map(), arPingBuzz = 0, arSeeded = false; // compass clicks and view pings
let arLeft = { n: -1, v: 0 }; // Uncommon+ cards still to find (cached per collection size)
let arRaf = 0, arPan = 0, arHeadSm = null, arItems = [], arAt = 0, arHits = [], arFrame = null; // All around you (below)
const panelHideTimers = {}; // one per page: opening one page mustn’t cancel another page’s hide (2026-10-21: fast taps left Settings stuck over the sky page)
let settingsFrom = null; // where Settings was opened from, so closing it goes back there (2026-10-21, Sevaan)
let navSeq = 0; // the last tab tapped wins: a page change waiting on the pill’s slide is dropped when another tab is tapped
let navBusyUntil = 0; // a page change under way (its slide included): the radar waits it out (web playtest 2026-10-24)
function navLater(fn, ms = SLIDE_MS) { const n = ++navSeq; navBusyUntil = performance.now() + ms + 520; setTimeout(() => { if (n === navSeq) fn(); }, ms); }
let revealBack = null;
function openPanel(id, back = false) {
  if (id === 'visible') try { localStorage.setItem('radarTip', '1'); } catch {} // found the radar list already: no tip needed
  // A panel closed a moment ago is still sliding away: cancel its hide (QA 2026-10-08: reopening within 300 ms left
  // it hidden with the sky paused and the HUD inert, so only a reload got you out).
  clearTimeout(panelHideTimers[id]); $(id).classList.remove('leaving', 'pulled'); $(id).style.transform = ''; $(id).style.transition = '';
  // A card opened from a page (Tonight, Now…) remembers it, so putting the card away goes back there, not to the sky
  // (2026-10-20, Sevaan).
  if (id === 'reveal') revealBack = activePanel && activePanel !== 'reveal' ? { id: activePanel, pos: panelPos(activePanel) } : null;
  if (activePanel === 'visible' && id !== 'visible' && document.body.classList.contains('sky-open')) { document.body.classList.remove('sky-open'); setPageHeader('explore'); setSwitch($('nav'), 'mid', false); } // another page over the sky page
  if (activePanel === 'visible' && id !== 'visible') { skyScroll = panelPos('visible'); skyLeftAt = Date.now(); }
  if (activePanel) $(activePanel).hidden = true;
  else panelReturn = document.activeElement;
  activePanel = id; $(id).hidden = false; $('hud').inert = id !== 'visible' && id !== 'debug' && id !== 'around'; // the sky page sits under Explore's header, whose buttons stay live
  if (activePanel === 'around' && id !== 'around') { document.body.classList.remove('around-open'); cancelAnimationFrame(arRaf); }
  if (id === 'around') { document.body.classList.add('around-open'); setPageHeader('around'); }
  if (id === 'debug') { renderSetIndex(); document.body.classList.add('set-open'); setPageHeader('settings'); $('nav-more').setAttribute('aria-label', 'Close settings'); }
  if (id === 'visible' && navProto()) { document.body.classList.add('sky-open'); setPageHeader('sky'); if (navProto() !== 'stack') setSwitch($('nav'), 'left'); }
  // Android WebView kept stale tap regions in a panel that slid in (it's the scroller and the animated layer at once),
  // so taps in Up in your sky landed on another row (Android playtest 2026-10-20). Start at the top, and once the slide
  // has landed drop the animation (.opened) so the panel is a plain scroller again.
  { const el = $(id); el.classList.remove('opened'); if (id === 'visible' && !back) el.scrollTop = 0; if (back) el.classList.add('opened'); el.addEventListener('animationend', () => { if (activePanel === id) el.classList.add('opened'); }, { once: true }); }
  // Focus the panel itself, not its first button (playtest 2026-10-16: the card view’s share button showed a focus ring).
  { const el = $(id); if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1'); requestAnimationFrame(() => el.focus({ preventScroll: true })); } // a frame later, so focus doesn’t force layout in the tap (jank playtest 2026-10-17)
}
let tourRevealLeaving = null, colAfterTour = null;
// It goes into your binder (2026-10-21, slick idea 07): closing a brand-new card shrinks it into the Collection tab,
// which bumps, with a "+1". Not for a flick (the card is already thrown off), the tour's first catch, or over a page.
let revealIntoBinder = false, revealFaced = false;
addEventListener('sc:payoff', () => { revealFaced = true; });
function binderReady() { return revealIntoBinder && revealFaced && !collectionOpen && !revealBack && $('ob-done').hidden && !document.body.classList.contains('ob-tour') && state.tourCatchId == null && !matchMedia('(prefers-reduced-motion: reduce)').matches; }
onRevealSwipeIntoBinder(binderReady); // swiping a new card away sends it into the Collection tab too (2026-10-21, Sevaan)
function intoBinder() {
  const go = binderReady(); revealIntoBinder = false;
  if (!go) return;
  const front = $('reveal-card'), hr = $('rv-holder').getBoundingClientRect(), tab = $('nav-collection'), tr = tab.getBoundingClientRect();
  if (!front || !tr.width || hr.bottom < 40 || hr.top > innerHeight - 40) return;
  const fly = document.createElement('div'); fly.className = 'binder-fly';
  Object.assign(fly.style, { left: `${hr.left}px`, top: `${hr.top}px`, width: `${hr.width}px`, height: `${hr.height}px` });
  fly.style.setProperty('--cf', getComputedStyle($('reveal')).getPropertyValue('--cf') || '12px');
  const face = front.cloneNode(true); face.removeAttribute('id'); face.style.transform = 'none'; fly.append(face); document.body.append(fly);
  $('rv-holder').style.visibility = 'hidden'; setTimeout(() => { $('rv-holder').style.visibility = ''; }, 600); // only the flying copy is seen
  const ic = tab.querySelector('.ico')?.getBoundingClientRect() ?? tr, dx = ic.left + ic.width / 2 - (hr.left + hr.width / 2), dy = ic.top + ic.height / 2 - (hr.top + hr.height / 2), sc = Math.max(.06, (tr.height * .5) / hr.height);
  fly.animate([{ transform: 'none', opacity: 1 }, { transform: `translate(${dx * .35}px, ${dy * .2 - 30}px) scale(.62) rotate(-4deg)`, opacity: 1, offset: .35 }, { transform: `translate(${dx}px, ${dy}px) scale(${sc}) rotate(-8deg)`, opacity: 0 }], { duration: 560, easing: 'cubic-bezier(.45,0,.55,1)', fill: 'forwards' })
    .finished.then(() => {
      fly.remove(); buzz('light'); sfx('stamp', { gain: .7 });
      tab.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.16)' }, { transform: 'scale(.96)' }, { transform: 'scale(1)' }], { duration: 420, easing: 'ease-out' });
      const plus = document.createElement('span'); plus.className = 'binder-plus'; plus.textContent = '+1';
      plus.style.left = `${ic.right + 4}px`; plus.style.top = `${ic.top + 6}px`; document.body.append(plus); setTimeout(() => plus.remove(), 1100);
    }, () => fly.remove());
}
function closePanel(id = activePanel) {
  if (!id) return;
  if (id === 'reveal') { teachNext = null; const tp = $('rv-teach'); if (tp) setTimeout(() => { if ($('reveal').hidden || activePanel !== 'reveal') { tp.remove(); $('reveal').classList.remove('teaching'); } }, 320); }
  if (id === 'reveal' && matchMedia('(prefers-reduced-motion: reduce)').matches) revealIntoBinder = false;
  if (id === 'reveal' && reviewAfterReveal) { reviewAfterReveal = false; plusAfterReveal = null; askSoon('milestone'); }
  else if (id === 'reveal' && plusAfterReveal) { const g = plusAfterReveal; plusAfterReveal = null; inviteSoon(g); }
  if (id === 'reveal') { stopReveal(); if (tourRevealLeaving) { const go = tourRevealLeaving; tourRevealLeaving = null; go(); } }
  const el = $(id); activePanel = null; $('hud').inert = false;
  if (id === 'debug' && document.body.classList.contains('set-open')) { document.body.classList.remove('set-open'); setPageHeader(collectionOpen ? 'collection' : 'explore'); $('nav-more').setAttribute('aria-label', 'Settings'); }
  if (id === 'visible') { skyScroll = panelPos('visible'); skyLeftAt = Date.now(); }
  if (id === 'around') { document.body.classList.remove('around-open'); cancelAnimationFrame(arRaf); setPageHeader(collectionOpen ? 'collection' : 'explore'); }
  if (id === 'visible' && document.body.classList.contains('sky-open')) { setTimeout(() => { if (activePanel !== 'visible') document.body.classList.remove('sky-open'); }, 340); if (!collectionOpen) setPageHeader('explore'); /* sky-open stays while it slides away, as col-open does */ if (navProto() && navProto() !== 'stack') setSwitch($('nav'), 'mid'); }
  // Slide away, then hide (2026-10-08 polish); the reveal has its own exit.
  if (id !== 'reveal' && el.classList.contains('panel') && !matchMedia('(prefers-reduced-motion: reduce)').matches) { el.classList.add('leaving'); clearTimeout(panelHideTimers[id]); panelHideTimers[id] = setTimeout(() => { if (activePanel === id) return; el.hidden = true; el.classList.remove('leaving'); el.style.transform = ''; }, 300); }
  // The reveal fades and drops away instead of cutting to the sky (UX room 2026-10-12: closing with ✕ was an instant cut).
  else if (id === 'reveal' && !matchMedia('(prefers-reduced-motion: reduce)').matches) { intoBinder(); el.style.pointerEvents = 'none'; el.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(28px)' }], { duration: 240, easing: 'cubic-bezier(.4,0,.8,.6)' }).finished.then(() => { if (activePanel !== 'reveal') el.hidden = true; el.style.pointerEvents = ''; }, () => { el.hidden = true; el.style.pointerEvents = ''; }); }
  else el.hidden = true;
  if (id === 'debug' && settingsFrom === 'sky' && !collectionOpen) { settingsFrom = null; const v = $('visible'); v.classList.add('no-anim'); showVTab('keep'); openPanel('visible', true); setTimeout(() => v.classList.remove('no-anim'), 500); return; } // back to the sky page, already there under Settings as it slides away
  if (id === 'debug') { settingsFrom = null; if (collectionOpen) { setSwitch($('nav'), 'right', false); setTimeout(() => { if (activePanel !== 'debug') document.body.classList.remove('panel-over-col'); }, 340); } else document.body.classList.remove('panel-over-col'); }
  if (id === 'reveal' && revealBack && !collectionOpen) { const b = revealBack; revealBack = null; openPanel(b.id, true); panelRestore(b.id, b.pos); return; }
  revealBack = null;
  if (panelReturn?.isConnected) panelReturn.focus({ preventScroll: true });
}
function openDebug() {
  settingsFrom = activePanel === 'visible' ? 'sky' : collectionOpen ? 'collection' : null;
  // Leaving the tour for Settings ends the tour (2026-10-08, Sevaan).
  if (!$('onboard').hidden) { $('ob-skip').click(); $('onboard').hidden = true; $('ob-done').hidden = true; document.body.classList.remove('ob-tour'); }
  settingsAsked = 0; renderDebug(); renderLocation(); openPanel('debug'); /* asks the phone once on open, then every 15 s */
}
// The header stays put over the Collection (2026-10-17), so its Settings button opens Settings over it, the way the
// Collection’s own button used to: Settings rises on top, then the Collection closes underneath without a slide.
function settingsOverCollection() { document.body.classList.add('panel-over-col'); openDebug(); } // Settings rises over the Collection, which stays open under it, so closing Settings goes back there (2026-10-21, Sevaan)
$('nav-more').addEventListener('click', () => { ++navSeq; if (activePanel !== 'debug') setSwitch($('nav'), collectionOpen ? 'right' : activePanel === 'visible' ? 'left' : 'mid', false); }); // a tab change still waiting on its slide is dropped: Settings was the last tap
$('nav-more').addEventListener('click', () => (activePanel === 'around' ? closePanel('around') : activePanel === 'debug' ? closePanel('debug') : collectionOpen ? settingsOverCollection() : openDebug())); // on Settings this button is its ✕
$('nav-explore').addEventListener('click', () => { setSwitch($('nav'), exploreSide()); navLater(() => { if (collectionOpen) { closeCollection(); if (activePanel === 'visible') setTimeout(() => { if (!collectionOpen && activePanel === 'visible') closePanel('visible'); }, 40); return; } if (activePanel === 'visible') { closePanel('visible'); return; } if (activePanel && activePanel !== 'debug') closePanel(); }); }); // over the Collection or the sky page, this is the way back // over the Collection, this is the way back
// Use my location (iOS playtest 2026-10-20): the sheet stays open and says why when it can't, instead of closing silently.
$('retry-location').addEventListener('click', async () => {
  const note = $('loc-denied'); note.hidden = true;
  const ok = await requestLocation({ gps: true });
  if (ok) { closeSheet($('set-loc-sheet')); return; }
  note.textContent = state.locationError === 'denied'
    ? 'Location is off for Space Collector. Turn it on for Space Collector in your phone’s Settings, or search for a place below.'
    : state.locationError === 'off' ? 'Location is switched off on this phone. Turn it on in your phone’s Settings, or search for a place below.'
    : `Couldn’t find you just now${state.locationStatus === 'stale' ? ', so the sky is still your last spot' : ''}. Try again outside, or search for a place below.`;
  note.hidden = false;
});
$('retry-motion').addEventListener('click', enableMotion);
$('location-form').addEventListener('submit', e => {
  e.preventDefault();
  const lat = Number($('latitude').value), lon = Number($('longitude').value);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat)>90 || Math.abs(lon)>180) return;
  setManualLocation(lat, lon);
});
function setManualLocation(lat, lon, place = '') {
  locationRequest++;
  state.observer = { lat, lon, label: 'Chosen location', place }; state.locationStatus = 'manual';
  try { localStorage.setItem('observer', JSON.stringify({ lat, lon, label: 'Chosen location', place, manual: true })); } catch {}
  state.model?.reset(); state.rising?.reset(); state.trails.clear(); cancelPassSearch(); renderLocation(); refreshAbove();
}
// Search a place by name (iOS playtest 2026-10-20: players don't know their coordinates). Open-Meteo's free geocoding
// (the same service as the weather; the typed name is all it gets). Tap a result to use it.
{ let qt = 0, qn = 0;
  const box = $('loc-results'), q = $('loc-q');
  const show = (html) => { box.innerHTML = html; };
  q.addEventListener('input', () => {
    clearTimeout(qt); const n = ++qn, text = q.value.trim(); show(''); // invalidate the old request as soon as the text changes
    if (text.length < 2) return;
    qt = setTimeout(async () => {
      try {
        const list = (await searchCities(text)).map((c) => ({ name: c.name, admin1: c.region, country: c.country, latitude: c.lat, longitude: c.lon })); if (n !== qn) return; // offline GeoNames list (js/cities.js, 2026-10-25)
        show(list.length ? list.map((p, i) => `<button type="button" class="loc-hit" role="option" data-i="${i}"><b>${escapeHtml(p.name)}</b><small>${escapeHtml([p.admin1, p.country].filter(Boolean).join(', '))}</small></button>`).join('') : '<p class="loc-none">No places by that name</p>');
        box.querySelectorAll('.loc-hit').forEach((b) => b.addEventListener('click', () => { const p = list[Number(b.dataset.i)];
          setManualLocation(+p.latitude.toFixed(3), +p.longitude.toFixed(3), [p.name, p.admin1].filter(Boolean).join(', '));
          q.value = ''; show(''); $('loc-denied').hidden = true; closeSheet($('set-loc-sheet')); }));
      } catch { if (n === qn) show('<p class="loc-none">Couldn’t search just now.</p>'); }
    }, 350);
  });
}
document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => closePanel(b.dataset.close)));
onRevealDismiss(() => { closePanel('reveal'); duckMusic(false); });
// The Plus sheet opens from outside Settings too (the Week tab, the shiny tease), so it lives at the top level; inside
// the hidden Settings panel it never showed (playtest 2026-10-11).
document.body.append($('set-plus-sheet')); document.body.append($('pr-sheet')); // pr-sheet also opens over the Collection (its Remind me)
document.addEventListener('keydown', e => {
  // Escape closes any open sheet first, panel or not: the sign-in sheet isn’t in a panel (playtest 2026-10-11).
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

// TEMPORARY testing button (2026-10-11, Sevaan): ⏱ in the header jumps to tonight’s busiest moment (the peak of the
// Tonight curve after dusk); tapping it again comes back to now. While it’s on, the "Sky at … · back to now"
// standing message is hidden (it got in the way). Remove before launch.
// The evening (2026-10-12, playtest room: "Busiest 6:08 AM", "Remind me at 3:06"): planning looks from dusk to 11:30 pm
// (or two hours past a late summer dusk). "Night owl" in Settings plans all the way to dawn.
function eveningEnd(T) {
  if (!T) return Infinity;
  if (readPref('nightOwl', false)) return T.dawn ?? Infinity;
  const dusk = T.dusk ?? T.startMs, e = new Date(dusk); e.setHours(23, 30, 0, 0);
  if (e.getTime() < dusk - 6 * 3600e3) e.setDate(e.getDate() + 1); // dusk before midnight: 11:30 pm the same evening
  const end = Math.min(T.dawn ?? Infinity, Math.max(e.getTime(), dusk + 2 * 3600e3));
  // Already past the evening (2026-10-18 playtest: at 11:31 PM the window was over and everything read "Nothing yet"):
  // from then on the plan runs to dawn, like Night owl.
  return now().getTime() > end ? T.dawn ?? Infinity : end;
}
$('chk-owl').checked = readPref('nightOwl', false);
$('chk-owl').addEventListener('change', (e) => { writePref('nightOwl', e.target.checked); if (!$('vtab-tonight').hidden) renderTonight(); });
// Store builds (2026-10-12, playtest room: time travel let anyone collect at noon, and "Plus (testing)" was free Plus):
// the native app hides the testing tools and the ⏱ button unless they’re unlocked by tapping the version line 7 times.
// The website is the private test build and always has them.
const devMode = () => { if (!isNative() || TESTER) return true; try { return localStorage.getItem('dev') === '1'; } catch { return false; } };
function applyDevMode() { const on = devMode(); $('test-tools').hidden = !on; $('peak-toggle').hidden = !on || TESTER; } // the tester app keeps the tools but not the ⏱
{ let taps = 0, tapT = 0;
  $('set-version').addEventListener('click', () => { const t = Date.now(); taps = t - tapT < 1500 ? taps + 1 : 1; tapT = t;
    if (taps >= 7 && isNative()) { taps = 0; const on = !devMode(); try { localStorage.setItem('dev', on ? '1' : '0'); } catch {} applyDevMode(); renderSetIndex(); ticket({ kind: 'info', line: on ? 'Testing tools on' : 'Testing tools off', ms: 2200 }); } /* the index gains its entry at once, and the notice shows over Settings (iPad/Duo playtest 2026-10-24) */ }); }
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
  else { const t = peakTime(); if (!t) { toast('Tonight’s plan isn’t ready yet.', 2000); return; } state.timeOffsetMs = t - Date.now(); toast(`Busiest moment: ${fmtTime(t)}`, 1800); }
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
      $('next-pass-info').textContent=`Showing ${label(obj)}’s pass at ${new Date(pass.dateMs).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}. Tap Now to come back.`;
      ticket({ kind: 'mission', icon: 'ff', id: 'jumped', eyebrow: 'JUMPED AHEAD', line: fmtTime(pass.dateMs), sub: `${label(obj)} is up in the ${dirWord(pass.look.az)}`, ms: 4000 });
    };
    passWorker.postMessage({requestId,objects:toWorker(state.catalog.objects.filter(o=>o.stdMag<=4.5 || o.id===objectId)),objectId,dateMs:start.getTime(),observer:state.observer,binoculars:state.binoculars,limit:skyLimit({ sb: state.skySb })}); // the dark-sky limit: the search only looks at dark hours (QA 2026-10-08: by day it used the daytime limit for all 48 h)
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
  /* only once readings really arrive (iPhone playtest 2026-10-26: with no sensors, Turn on dropped finger-drag for good) */
  if (ok) { const t0 = performance.now(); while (!hasLiveSensors() && performance.now() - t0 < 1500) await new Promise((r) => setTimeout(r, 100)); ok = hasLiveSensors(); }
  if (ok) { try { localStorage.removeItem('noMotion'); } catch {} }
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
// Lights out (2026-10-21, slick idea 14): a red line sweeps down and everything behind it turns red, one soft buzz;
// turning it off sweeps back up. The sweep is the same red multiply as body.night::after, so the hand-over is seamless.
function toggleNight(on) {
  state.night = on; $('chk-night').checked = on; writePref('night', on);
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { applyTheme(); return; }
  document.querySelector('.night-sweep')?.remove();
  const sw = document.createElement('div'); sw.className = 'night-sweep'; document.body.append(sw);
  buzz('medium');
  if (on) { sw.animate([{ height: '0px' }, { height: '100%' }], { duration: 560, easing: 'cubic-bezier(.5,0,.3,1)', fill: 'forwards' }).finished.then(() => { applyTheme(); requestAnimationFrame(() => sw.remove()); }, () => { applyTheme(); sw.remove(); }); }
  else { applyTheme(); sw.animate([{ height: '100%' }, { height: '0px' }], { duration: 520, easing: 'cubic-bezier(.5,0,.3,1)', fill: 'forwards' }).finished.then(() => sw.remove(), () => sw.remove()); }
}
$('chk-night').addEventListener('change', e => toggleNight(e.target.checked));
$('night-toggle').addEventListener('click', () => toggleNight(!state.night));
$('chk-drag').addEventListener('change', (e) => {
  state.drag.on = e.target.checked;
  if (state.drag.on && state.basis) {
    const b = state.basis.back;
    state.drag.az = headingOf(state.basis);
    state.drag.el = Math.asin(b[2]) / RAD;
  }
});
$('chk-dim').addEventListener('change', (e) => { state.showDim = e.target.checked; state.trails.clear(); });
$('chk-stars').checked = state.showStars;
$('chk-stars').addEventListener('change', (e) => { state.showStars = e.target.checked; writePref('showStars', state.showStars); });
$('chk-landscape').checked = state.landscape;
$('chk-shadow').checked = state.showShadow;
$('chk-shadow').addEventListener('change', (e) => { state.showShadow = e.target.checked; writePref('shadow', state.showShadow); });
$('chk-daysats').checked = state.daySats;
$('chk-daysats').addEventListener('change', (e) => { state.daySats = e.target.checked; writePref('daySats', state.daySats); });
$('chk-landscape').addEventListener('change', (e) => { state.landscape = e.target.checked; writePref('landscape', state.landscape); });

// ---------- Settings additions (2026-10-21, Sevaan) ----------
$('chk-milky').checked = state.showMilky;
$('chk-milky').addEventListener('change', (e) => { state.showMilky = e.target.checked; writePref('milky', state.showMilky); });
$('chk-planes').checked = state.showPlanes;
$('chk-planes').addEventListener('change', (e) => { state.showPlanes = e.target.checked; writePref('planes', state.showPlanes); if (!state.showPlanes) { state.planeItems = null; state.planeHit = null; } });
// Battery saver turns the Milky Way off, so its switch says so (playtest 2026-10-22: it still read ON).
const saverMilky = () => { const m = $('chk-milky'); m.disabled = state.saver; m.checked = state.saver ? false : state.showMilky; m.closest('.set-row')?.classList.toggle('set-off', state.saver); };
$('chk-saver').checked = state.saver; sky.saver = state.saver; saverMilky();
$('chk-saver').addEventListener('change', (e) => { state.saver = sky.saver = e.target.checked; writePref('saver', state.saver); saverMilky(); });
$('chk-meteor').checked = readPref('nMeteor', true);
$('chk-meteor').addEventListener('change', (e) => writePref('nMeteor', e.target.checked));
// Choices in a row (segmented): the saved value lights its button; a tap saves it and runs its effect.
const readText2 = (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } };
function wireSeg(attr, key, def, apply) {
  const btns = [...document.querySelectorAll(`#debug [data-${attr}]`)];
  const show = () => { const v = readText2(key, def); for (const b of btns) { const on = b.dataset[attr] === v; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); } };
  for (const b of btns) b.addEventListener('click', () => { try { localStorage.setItem(key, b.dataset[attr]); } catch {} show(); buzz('select'); sfx('toggle', { gain: 0.8 }); apply?.(b.dataset[attr]); });
  show(); apply?.(readText2(key, def));
}
wireSeg('lead', 'remindLead', '10');
let unitsWired = false; wireSeg('units', 'units', 'auto', () => { setUnits(); if (unitsWired) collectionStale(); }); unitsWired = true; // the Collection's cards follow Units too (2026-10-22); not at start-up, before the Collection exists
wireSeg('clock', 'clock', 'auto');
// Sky labels: All, only cards you don't have yet, or none (compass letters and pass markers always show).
const NAT_BY_NAME = new Map(NATURAL.map((o) => [o.name, o]));
Object.defineProperty(sky, 'planetBoost', { get: () => state.limit?.boost ?? 0 }); // drawBodies: faint planets drawn when the circle can collect them (naturalTargets binoLimit = stars + boost)
sky.ownedObj = (o) => { try { return !isNewFind(o); } catch { return false; } };
sky.ownedName = (n) => { const o = NAT_BY_NAME.get(n); return o ? sky.ownedObj(o) : true; }; // a named star that isn't a card has nothing to collect
wireSeg('labels', 'skyLabels', 'all', (v) => { sky.labelMode = v; });
// Help
// How to play (2026-10-21, Sevaan: "could this be better?"): a short deck you swipe through, one idea per card, each
// with a picture from the game itself, a title and one sentence. The last one goes straight to Tonight.
const HT_STARS = '<circle cx="14" cy="16" r="1" fill="#fff2b3"/><circle cx="86" cy="12" r="1.2" fill="#fff2b3"/><circle cx="78" cy="88" r="1" fill="#fff2b3"/><circle cx="20" cy="84" r=".9" fill="#fff2b3"/>';
const htCard = (cls, art) => `<span class="ht-mini ${cls}" style="background-image:url('assets/art/cards/sm/${art}.webp')"></span>`;
const htMoon = (k) => { // phase k of 8 (0 new, 4 full): lit half on the right while waxing, left while waning, the terminator an ellipse
  const r = 7, c = Math.cos(k * Math.PI / 4), rx = Math.abs(c) * r, right = k < 4, lit = '#fff2b3', dark = '#2a3446';
  const half = `M0 ${-r} A${r} ${r} 0 0 ${right ? 1 : 0} 0 ${r} Z`;
  return `<svg viewBox="-9 -9 18 18" class="ht-ph${k === 6 ? ' new' : ''}"><circle r="${r}" fill="${dark}"/>${k === 0 ? '' : k === 4 ? `<circle r="${r}" fill="${lit}"/>` : `<path d="${half}" fill="${lit}"/><ellipse rx="${rx}" ry="${r}" fill="${c > 0 ? dark : lit}"/>`}</svg>`; };
const HT_SLIDES = [
  { t: 'Point your phone at the sky', d: 'Every light that moves up there is a card: satellites, rocket stages, the Space Station. The Moon, planets and stars too.', pic: () => WC_PICS[0].replace('xMidYMid slice', 'xMidYMid meet') },
  { t: 'Line it up, tap Collect', d: 'An orange circle means it’s new to you. Cream means you already have it.', pic: () => WC_PICS[1].replace('xMidYMid slice', 'xMidYMid meet') },
  { t: 'Come back on other nights', d: 'See a satellite on 3 nights and its card turns silver. On 10, gold.', pic: () => `<span class="ht-row">${htCard('lvl-b', 'iss')}${htCard('lvl-s', 'iss')}${htCard('lvl-g', 'iss')}</span>` },
  { t: 'Collect the stamps', d: 'Fleets like Starlink get a stamp for every launch. The Moon gets one for each of its phases.', pic: () => `<span class="ht-col">${htCard('', 'fleet-starlink')}<span class="ht-phases">${[0, 1, 2, 3, 4, 5, 6, 7].map(htMoon).join('')}</span></span>` },
  { t: 'Lucky moments shine', d: 'Catch one slipping into Earth’s shadow, beside the Moon or straight overhead for a shiny card. Missions and firsts earn patches.', pic: () => `<span class="ht-row">${htCard('shiny', 'hubble')}</span>` },
  { t: 'Look for secrets', d: 'Some things in the sky are hidden. Hold the circle still over anything odd.', pic: () => `<svg viewBox="0 0 100 100" aria-hidden="true">${HT_STARS}<circle class="ht-sec" cx="50" cy="50" r="22" fill="none" stroke="#f2c14e" stroke-width="2" stroke-dasharray="4 4"/><text x="50" y="58" text-anchor="middle" font-family="SC Display, sans-serif" font-size="22" fill="#f2c14e">?</text></svg>` },
  { t: 'Know when to look up', d: 'Tonight shows what’s worth catching and when. Tap a bell and you’ll get a reminder.', pic: () => `<span class="ht-tonight"><span class="ico" data-ico="bell"></span><b>9:41 PM</b><small>Hubble · high in the south</small></span>`, last: true },
];
let htAt = 0;
function htShow(i, smooth = true) {
  const tr = $('ht-track'); htAt = Math.max(0, Math.min(HT_SLIDES.length - 1, i));
  tr.scrollTo({ left: htAt * tr.clientWidth, behavior: smooth ? 'smooth' : 'auto' });
  [...$('ht-dots').children].forEach((d, k) => d.classList.toggle('on', k === htAt));
  const last = HT_SLIDES[htAt].last; $('ht-next').firstElementChild.textContent = last ? 'See tonight' : 'Next';
}
function openHowTo() {
  $('ht-track').innerHTML = HT_SLIDES.map((x, i) => `<div class="ht-slide" role="group" aria-label="${i + 1} of ${HT_SLIDES.length}"><div class="ht-pic">${x.pic()}</div><b class="ht-t">${escapeHtml(x.t)}</b><p class="ht-d">${escapeHtml(x.d)}</p></div>`).join('');
  $('ht-dots').innerHTML = HT_SLIDES.map(() => '<i></i>').join('');
  openSheet('set-howto-sheet'); requestAnimationFrame(() => htShow(0, false));
}
$('set-howto').addEventListener('click', openHowTo);
$('ht-track').addEventListener('scroll', () => { const tr = $('ht-track'), i = Math.round(tr.scrollLeft / Math.max(1, tr.clientWidth)); if (i !== htAt) { htAt = i; buzz('select'); [...$('ht-dots').children].forEach((d, k) => d.classList.toggle('on', k === i)); $('ht-next').firstElementChild.textContent = HT_SLIDES[i].last ? 'See tonight' : 'Next'; } }, { passive: true });
$('ht-next').addEventListener('click', () => { if (HT_SLIDES[htAt].last) { closeSheet($('set-howto-sheet')); openSky('tonight'); } else htShow(htAt + 1); });
const APP_STORE_ID = '6822096401'; // the app's Apple ID from App Store Connect → App Information; the Rate row shows once it's set
$('set-rate').hidden = !(isNative() && APP_STORE_ID && /iPhone|iPad/.test(navigator.userAgent));
$('set-rate').addEventListener('click', () => { location.href = `itms-apps://itunes.apple.com/app/id${APP_STORE_ID}?action=write-review`; });
$('chk-lines').checked = state.showLines;
$('chk-lines').addEventListener('change', (e) => { state.showLines = e.target.checked; writePref('lines', state.showLines); });
$('chk-any').addEventListener('change', (e) => { state.captureAny = e.target.checked; });
// ---------- the sky slider (2026-10-06): an "exposure" control above the switcher ----------
// Drag until the stars and satellites on screen match what you can actually see; it’s saved for next time.
// It sets your sky’s own darkness; twilight and the Moon still dim things on top of it automatically.
// The sky slider is off the Explore screen and the sky starts at its darkest (2026-10-09, Sevaan). Everyone is moved
// to the darkest once ('skyMax1'); Settings → How dark is your sky? still changes it.
// New players start halfway (2026-10-09, Sevaan; was the darkest). Anyone who has set it keeps their setting.
{ const saved = Number(readText('skySb', '')); const MID = Math.round(((SB_MIN + SB_MAX) / 2) * 20) / 20;
  state.skySb = saved >= SB_MIN && saved <= SLIDER_MAX ? saved : MID;
  if (readPref('binoculars', false)) { state.skySb = SLIDER_MAX; writeText('skySb', String(SLIDER_MAX)); writePref('binoculars', false); } } // binocular mode was on: the end of the slider is the same thing now
function renderSkySlider() {
  const r = $('sky-range'); if (!r || !state.limit) return;
  if (document.activeElement !== r) r.value = String(state.skySb);
  const pct = (state.skySb - SB_MIN) / (SLIDER_MAX - SB_MIN) * 100;
  r.style.setProperty('--p', `${pct.toFixed(1)}%`);
  $('sky-name').textContent = skyNameFor(state.skySb);
  $('sky-mag').textContent = state.limit.boost > 0 ? `+${state.limit.boost.toFixed(1)} for satellites` : `stars to ${state.limit.stars.toFixed(1)}`;
  r.setAttribute('aria-valuetext', `${skyNameFor(state.skySb)}, ${$('sky-mag').textContent}`); // a screen reader hears words, not "19.45" (Android playtest 2026-10-19)
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
// The slider steps back when you’re not using it (2026-10-09, Sevaan): full strength when Explore first shows, then
// it eases to 65% after a few seconds; touching it brings it back to full, and letting go fades it again.
let skybarRestT = 0;
function skybarRest(delay = 2500) { clearTimeout(skybarRestT); skybarRestT = setTimeout(() => $('skybar').classList.add('resting'), delay); }
function skybarWake() { clearTimeout(skybarRestT); $('skybar').classList.remove('resting'); }
for (const ev of ['pointerdown', 'touchstart', 'focusin']) $('skybar').addEventListener(ev, skybarWake, { passive: true });
// Lit while a finger is on it, not only once it moves (2026-10-17, Sevaan).
for (const ev of ['pointerdown', 'touchstart']) $('skybar').addEventListener(ev, () => $('skybar').classList.add('dragging'), { passive: true });
for (const ev of ['pointerup', 'pointercancel', 'touchend', 'touchcancel']) $('skybar').addEventListener(ev, () => $('skybar').classList.remove('dragging'), { passive: true });
for (const ev of ['pointerup', 'pointercancel', 'touchend', 'focusout']) $('skybar').addEventListener(ev, () => skybarRest(1500), { passive: true });
// Grab anywhere on the bar: the knob jumps to the finger and follows it. The native control only grabs on the knob, and
// on iPhone a touch on its track did nothing (2026-10-18, Sevaan: hard to move), so the bar handles every touch itself.
{
  const bar = $('skybar'), r = $('sky-range'); let grab = null;
  const valueAt = (x) => { const b = r.getBoundingClientRect(), f = Math.max(0, Math.min(1, (x - b.left) / b.width)); return SB_MIN + f * (SLIDER_MAX - SB_MIN); };
  bar.addEventListener('pointerdown', (e) => { if (e.button > 0) return; e.preventDefault(); grab = e.pointerId; bar.setPointerCapture(e.pointerId); r.value = valueAt(e.clientX).toFixed(2); r.dispatchEvent(new Event('input', { bubbles: true })); });
  bar.addEventListener('pointermove', (e) => { if (e.pointerId !== grab) return; r.value = valueAt(e.clientX).toFixed(2); r.dispatchEvent(new Event('input', { bubbles: true })); });
  const end = (e) => { if (e.pointerId !== grab) return; grab = null; r.dispatchEvent(new Event('change', { bubbles: true })); };
  bar.addEventListener('pointerup', end); bar.addEventListener('pointercancel', end);
}
// Match your sky (2026-10-25, Sevaan; design/tour-rethink.html 05; replaces the "compare with Orion" idea). Once, the first
// time the app is open after dark with motion live and the phone held up above 20° for 10 s with nothing in the circle,
// which means outside, looking up: a card just above the sky slider. The slider pulses; as you drag, the stars on screen
// come and go (they already do) and the card says the sky in words. Never in the tour, by day, or indoors. Settings →
// Your sky → Match opens it any time. Counted once shown (localStorage skyMatched).
const STARS_UP = [[1, 8], [2, 25], [3, 85], [4, 250], [5, 800], [6, 2400], [7, 7000]]; // roughly how many stars are up to each magnitude, half the sky
const starsUp = (m) => { const t = STARS_UP; if (m <= t[0][0]) return t[0][1]; for (let i = 1; i < t.length; i++) if (m <= t[i][0]) { const [a, na] = t[i - 1], [b, nb] = t[i]; return Math.round(na * (nb / na) ** ((m - a) / (b - a))); } return t[t.length - 1][1]; };
const roundish = (n) => n < 100 ? Math.round(n / 5) * 5 : n < 1000 ? Math.round(n / 50) * 50 : Math.round(n / 100) * 100;
let smHeldSince = 0, smOn = false, smHideT = 0;
function smRead() { const l = state.limit; if (!l) return; setTxt($('sm-read'), l.boost > 0 ? `${skyNameFor(state.skySb)} · +${l.boost.toFixed(1)} for satellites` : `${skyNameFor(state.skySb)} · about ${roundish(starsUp(l.stars)).toLocaleString()} stars`); }
function showSkyMatch() {
  if (smOn) return; smOn = true; try { localStorage.setItem('skyMatched', '1'); } catch {}
  const card = $('sky-match'), bar = $('skybar').getBoundingClientRect();
  card.style.bottom = `${Math.round(innerHeight - bar.top + 10)}px`; setTxt($('sm-done'), 'Done'); card.classList.remove('done', 'out', 'compact'); card.hidden = false;
  { const rc = sky.ring ?? { y: sky.cy, r: sky.reticlePx }; if (card.getBoundingClientRect().top - 14 < rc.y + rc.r + 12) card.classList.add('compact'); /* -14: it's measured mid-animation, 14px low (visual playtest 2026-10-25) */ } // on a short screen it keeps off the circle (returning playtest 2026-10-25)
  $('skybar').classList.add('matching'); document.body.classList.add('sky-matching'); skybarWake(); smRead(); note('sky', { s: 'match-shown' });
  clearTimeout(smHideT); smHideT = setTimeout(() => hideSkyMatch(false), 60000); // left alone, it goes after a minute
}
function hideSkyMatch(matched) {
  if (!smOn) return; smOn = false; clearTimeout(smHideT);
  const card = $('sky-match'); $('skybar').classList.remove('matching'); document.body.classList.remove('sky-matching'); skybarRest(1500);
  if (matched) { card.classList.add('done'); setTxt($('sm-done'), '✓ Matched'); note('sky', { s: 'match', sb: Number(state.skySb.toFixed(2)) }); buzz('success'); }
  setTimeout(() => card.classList.add('out'), matched ? 900 : 0); setTimeout(() => { card.hidden = true; card.classList.remove('out', 'done'); }, matched ? 1300 : 300);
}
$('sm-done').addEventListener('click', () => hideSkyMatch(true));
$('sky-range').addEventListener('input', () => { if (smOn) smRead(); });
$('sm-open').addEventListener('click', (e) => { if (document.body.classList.contains('day')) { const b = e.currentTarget; b.textContent = 'After dark'; setTimeout(() => { b.textContent = 'Match outside'; }, 2500); return; } closePanel('debug'); setTimeout(showSkyMatch, 420); }); // the slider is hidden by day (bug hunt 2026-10-25)
setInterval(() => {
  if (smOn) { if (activePanel || collectionOpen || !$('reveal').hidden || document.body.classList.contains('ob-tour') || document.body.classList.contains('calib')) hideSkyMatch(false); return; }
  let done = true; try { done = localStorage.getItem('skyMatched') === '1'; } catch {}
  const b = state.basis?.back, up = b ? Math.asin(Math.max(-1, Math.min(1, b[2]))) * 180 / Math.PI : -90;
  const ok = !done && state.started && !$('hud').hidden && (hasSensorView() || state.drag.on) /* finger players too: it's the only place the slider is taught (flow playtest 2026-10-25) */ && (state.frame?.sunEl ?? 0) < -12 && up > 20 && !document.querySelector('#toasts .ticket.in') /* not on top of a notice */
    && !activePanel && !collectionOpen && $('reveal').hidden && $('ob-done').hidden && $('onboard').hidden
    && !document.querySelector('.set-sheet:not([hidden])') && !document.body.classList.contains('calib') && getComputedStyle($('skybar')).display !== 'none';
  if (!ok) { smHeldSince = 0; return; }
  // Held up for 10 s, then it shows unless you're about to catch something (2026-10-25, Sevaan: "Ten seconds with
  // nothing in the circle is almost never going to happen" — stars fill it): a star or a card you already have is fine;
  // a new satellite, planet, Moon phase or deep-sky object lined up, or a plane, makes it wait.
  const tg = state.activeTarget?.obj; let busy = !!state.planeHit;
  if (tg && tg.natural !== 'star') { try { busy ||= isNewFind(tg); } catch { busy = true; } }
  if (!smHeldSince) smHeldSince = Date.now(); else if (Date.now() - smHeldSince > 10000 && !busy) showSkyMatch();
}, 1000);
$('chk-snap').checked = state.snap; sky.snap = state.snap;
document.querySelectorAll('[data-hl]').forEach((c) => { c.checked = hlOn(c.dataset.hl); c.addEventListener('change', () => { writePref(`hl-${c.dataset.hl}`, c.checked); lastLocked = !state.lockedOn; }); });
// Testing tools: run the whole first-run experience again, from the sealed welcome card, with motion and
// location switched back off so the permission steps are real steps again (the browser won’t re-prompt once
// granted, but the app goes back to drag view and the example location until you allow them).
$('btn-replay-setup')?.addEventListener('click', () => {
  settingsFrom = null; if (collectionOpen) closeCollection(false, true); closePanel('debug'); /* back to the sky, not the page Settings came from (iOS playtest 2026-10-24: from the Tonight tab the page stayed over the tour) */
  state.drag.on = true; $('chk-drag').checked = true; state.liveSince = null;
  state.locationStatus = 'example'; renderLocation();
  state.pinnedId = null; state.targetId = null; state.guidePass = null;
  wcCard = null; wcFlipped = false; wcReplay = true;
  $('wc-after').hidden = true; $('start').classList.remove('wc-open'); $('btn-start').disabled = false;
  renderStartHand();
  $('hud').hidden = true; $('start').hidden = false;
});
$('chk-snap').addEventListener('change', (e) => { state.snap = e.target.checked; writePref('snap', state.snap); sky.snap = state.snap; });
// Space Collector Plus (js/plus.js): the Settings row, the sheet, the testing toggle, and switching perks off when
// Plus ends. `why` names the perk that was tapped, so the sheet can lead with it.
function renderPlus() {
  const on = isPlus();
  document.body.classList.toggle('is-plus', on);
  $('set-plus-val').textContent = on ? 'Plus ✓' : 'Free';
  $('set-plus-note').textContent = on ? 'Thanks for supporting Space Collector' : 'Reminders, card backs and more';
  try { $('chk-plus-test').checked = localStorage.getItem('plusTest') === '1'; } catch {} // the testing switch only; a store purchase doesn’t flip it
  $('plus-buy').hidden = on; $('plus-thanks').hidden = !on;
  if (!on && $('chk-rare')) $('chk-rare').checked = false; // Rare alerts are a Plus perk
}
$('plus-restore').addEventListener('click', async () => {
  if (!isNative()) { toast('Purchases are in the App Store and Google Play apps.', 3500); return; }
  const b = $('plus-restore');
  if (!storeOpen()) { const was = b.textContent; b.textContent = 'Coming soon to Google Play'; clearTimeout(b._t); b._t = setTimeout(() => { b.textContent = was; }, 4000); return; }
  b.disabled = true; const was = isPlus();
  const on = await restorePlus(); b.disabled = false;
  // The answer shows on the button itself (iOS playtest 2026-10-20: a notice behind the sheet looked like nothing happened).
  const say = (t) => { const was = 'Restore purchases'; b.textContent = t; clearTimeout(b._t); b._t = setTimeout(() => { b.textContent = was; }, 4000); };
  if (on === null) say('Couldn’t reach the store. Try again');
  else if (on && was) say('Plus is already on'); // nothing changed, so onPlus says nothing (iOS QA 2026-10-23)
  else if (!on) say(`No Plus purchase on this ${/iP(hone|ad|od)|Mac/.test(navigator.userAgent) ? 'Apple Account' : 'Google account'}`);
  // on: onPlus says so
});
// Join the crew (2026-10-23, Sevaan picked design/plus-page.html B with B2's kit; replaces the Plus card sheet of
// 2026-10-16): Plus as a page. It says the game is free, shows the member patch, then the crew kit as tiles (the card
// backs fanned in theirs, the patch in its own), then the three prices. `why` is the perk that was tapped: a gold line
// says so and its tile is lit.
let plusPlan = 'year';
const KIT = {
  backs: ['', 'Pick the back every card shows, or a different one each flip.'],
  reminders: ['Pass reminders', 'Never miss the one you wanted.'],
  rare: ['Rare alerts', 'Pinged when Rare+ is coming.'],
  widgets: ['Widgets', 'Tonight, at a glance.'],
  shiny: ['Shiny forecast', 'Where shinies can happen.'],
  patch: ['The member patch', 'On your patch wall for good, even if you stop.'],
};
const KIT_ICON = { backs: '<span class="ico" data-ico="cards"></span>', reminders: '<span class="ico" data-ico="bell"></span>', rare: '<i>◆</i>', widgets: '<i>▦</i>', shiny: '<i>✦</i>', patch: '<span class="ico" data-ico="patch"></span>' };
function plusPage(why) {
  const on = isPlus(), backs = CARD_BACKS.filter((x) => !x.free), n = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight'][backs.length] ?? String(backs.length);
  const lead = (why === 'invite' ? plusInviteLead : '') || { reminders: 'Pass reminders are part of the crew kit', rare: 'Rare alerts are part of the crew kit', shiny: 'The full shiny forecast is part of the crew kit', backs: 'That card back is part of the crew kit', allbacks: 'Every card back comes with the crew kit', widgets: 'Widgets are part of the crew kit' }[why];
  $('plus-lead').innerHTML = lead ? `<span class="ico" data-ico="${why === 'reminders' ? 'bell' : 'stars'}"></span>${escapeHtml(lead)}` : ''; $('plus-lead').hidden = !lead || on;
  $('plus-head').textContent = on ? 'THE CREW' : 'JOIN THE CREW';
  $('plus-title').innerHTML = on ? 'You’re crew.' : 'Keep the lights on.<br>Wear the patch.';
  $('plus-body').textContent = on ? 'Thank you for keeping Space Collector flying. Here’s everything in your kit.' : 'Space Collector is free to play, all of it. The crew are the players who chip in to keep it flying, and get a little kit for it.';
  $('plus-patch').innerHTML = `<i class="crew-meteor"></i>${patchHtml(Secrets.SECRET_PATCHES.plus)}`; // a shooting star crosses behind it every few seconds (2026-10-23, Sevaan)
  addStarfield($('set-plus-sheet').querySelector('.set-sheet-card'), 70); // twinkling stars behind the page (2026-10-23, Sevaan)
  const fan = backs.slice(0, 5).map((x, i) => `<img src="${x.url}" alt="" decoding="async" style="left:${14 + i * 20}px;--r:${-12 + i * 6}deg">`).join(''); /* inside its tile: ±12° from the bottom centre (2026-10-23, Sevaan: it ran over the edge) */
  const tile = (k, wide = '') => `<div class="kt${wide ? ' wide' : ''}${k === why ? ' lit' : ''}"><span><span class="kt-i">${KIT_ICON[k]}</span><b>${escapeHtml(k === 'backs' ? `${n} card backs` : KIT[k][0])}</b><small>${escapeHtml(KIT[k][1])}</small></span>${wide}</div>`;
  $('plus-kit').innerHTML = tile('backs', `<span class="kt-fan">${fan}</span>`) + (globalThis.Capacitor?.getPlatform?.() === 'android' ? ['rare', 'shiny'] : ['reminders', 'rare', 'widgets', 'shiny']).map((k) => tile(k)).join('') /* Android: reminders are free there and there are no widgets yet (Android playtest 2026-10-24) */ + tile('patch', `<span class="kt-patch">${patchHtml(Secrets.SECRET_PATCHES.plus)}</span>`);
}
// The store’s own prices (local currency, the real trial) replace the list prices once they arrive (2026-10-16).
let storeP = null;
const trialDays = () => (storeP ? storeP.year?.trial || 0 : PLUS_PRICES.find((p) => p.id === 'year')?.trial || 0);
// Yearly says how much it saves against 12 months, from the prices actually shown (the store’s, in local currency),
// so it stays right in every country and after a price change (2026-10-19, Sevaan).
const priceNum = (s) => { const m = String(s ?? '').replace(/[^\d.,]/g, '').match(/^(\d+(?:[.,]\d{3})*)(?:[.,](\d{1,2}))?$/); return m ? +`${m[1].replace(/[.,]/g, '')}.${m[2] ?? 0}` : NaN; };
const shownPrices = () => {
  const ps = PLUS_PRICES.map((p) => { const s = storeP?.[p.id]; return s ? { ...p, price: s.price || p.price, trial: p.id === 'year' ? s.trial || 0 : 0 } : p; });
  const m = priceNum(ps.find((p) => p.id === 'month')?.price), y = priceNum(ps.find((p) => p.id === 'year')?.price), save = Math.round((1 - y / (12 * m)) * 100);
  return ps.map((p) => (p.id === 'year' ? { ...p, note: save > 0 && save < 100 ? `Save ${save}%` : 'Best value' } : p));
};
function renderPlusBuy() {
  const prices = shownPrices(), plan = prices.find((p) => p.id === plusPlan) ?? prices[1];
  $('plus-prices').innerHTML = prices.map((p) => `<button type="button" class="plus-pr${p.id === plusPlan ? ' on' : ''}" role="radio" aria-checked="${p.id === plusPlan}" data-plan="${p.id}"><small>${escapeHtml(p.label.toUpperCase())}</small><b>${escapeHtml(p.price)}</b><em>${escapeHtml((p.note || '').toUpperCase())}</em></button>`).join('');
  const per = plan.id === 'year' ? 'a year' : 'a month';
  // Android until its store key is in (Android playtest 2026-10-19): say so instead of a "try again" error.
  const soon = isNative() && !storeOpen(); $('plus-cta').disabled = soon;
  if (soon) { $('plus-cta').textContent = 'Coming soon to Google Play'; $('plus-fine').textContent = 'Plus is on its way to Android.'; return; }
  $('plus-cta').textContent = plan.trial ? `Join free for ${plan.trial} days` : plan.id === 'once' ? `Join for good · ${plan.price}` : `Join the crew · ${plan.price} ${per}`;
  // App Review 3.1.2 (iOS playtest 2026-10-19): say it renews, how to cancel, and link the Terms of Use and Privacy Policy.
  $('plus-fine').textContent = plan.trial ? `${plan.trial} days free, then ${plan.price} a year. Renews automatically; cancel anytime in your account settings.` : plan.id === 'once' ? 'One payment, yours for good.' : `${plan.price} ${per}. Renews automatically; cancel anytime in your account settings.`;
}
$('plus-prices').addEventListener('click', (e) => { const b = e.target.closest('[data-plan]'); if (!b) return; plusPlan = b.dataset.plan; buzz(6); renderPlusBuy(); });
$('plus-cta').addEventListener('click', async () => {
  if (!isNative()) { toast('Plus is sold in the App Store and Google Play apps.', 3500); return; }
  const b = $('plus-cta'); if (b.disabled) return; b.disabled = true;
  if (!storeP) storeP = await storePlans();
  const r = await buyPlus(storeP?.[plusPlan]); b.disabled = false; note('plus', { s: r.result === 'ok' ? 'buy' : r.result, plan: plusPlan });
  if (r.result === 'pending') toast('Waiting for approval. Plus turns on as soon as it\u2019s approved.', 4000); // Ask to Buy
  else if (r.result === 'error') { buzz('warning'); shake(b); ticket({ kind: 'error', eyebrow: 'SPACE COLLECTOR PLUS', line: 'The purchase didn’t go through', sub: 'You haven’t been charged. Try again in a moment.', ms: 4500 }); console.warn('purchase failed', r.message); } // our words, not the store's (iOS QA 2026-10-23)
  // ok: onPlus thanks them and the sheet turns to its thank-you; cancelled: nothing to say
});
// The Plus page uses the shared header like every other page (2026-10-24, Sevaan): JOIN THE CREW / SPACE COLLECTOR PLUS,
// the Settings button turns into its ✕, and whatever the header said before comes back when it closes.
let plusHdrWas = null;
function plusHeaderIn() {
  const w = document.querySelector('#sky-header .wordmark'); if (!w) return;
  if (!document.body.classList.contains('plus-open')) plusHdrWas = [w.querySelector('.hw-t')?.textContent ?? '', w.querySelector('.hw-s')?.textContent ?? ''];
  document.body.classList.add('plus-open'); headerTo(w, isPlus() ? 'THE CREW' : 'JOIN THE CREW', 'SPACE COLLECTOR PLUS');
}
function plusHeaderOut() {
  if (!document.body.classList.contains('plus-open')) return;
  document.body.classList.remove('plus-open');
  const w = document.querySelector('#sky-header .wordmark'); if (w && plusHdrWas) headerTo(w, plusHdrWas[0], plusHdrWas[1]); plusHdrWas = null;
}
$('nav-more').addEventListener('click', (e) => { if (document.body.classList.contains('stats-open') && !document.body.classList.contains('plus-open')) { e.stopImmediatePropagation(); colFrame.contentWindow?.postMessage({ sc: 'stats-close' }, location.origin); return; } if (!document.body.classList.contains('plus-open')) return; e.stopImmediatePropagation(); closeSheet($('set-plus-sheet')); }, { capture: true }); // its ✕ closes the Plus page, nothing else
// Warm the Plus page once the app is idle (2026-10-24, Sevaan: its first opening stuttered on the phone): build it, and
// decode the card-back pictures it fans, so the first slide-up only moves what's already drawn.
function warmPlus() {
  const go = () => { if (!$('set-plus-sheet').hidden) return; try { plusPage(); for (const b of CARD_BACKS.filter((x) => !x.free).slice(0, 5)) { const i = new Image(); i.decoding = 'async'; i.src = b.url; i.decode?.().catch(() => {}); } } catch {} };
  (window.requestIdleCallback ?? ((f) => setTimeout(f, 1)))(go, { timeout: 8000 });
}
setTimeout(warmPlus, 6000);
function openPlus(why) { note('plus', { s: 'open', why: String(why ?? '').slice(0, 20) }); /* the card back a picker passed is no longer shown: the kit fans them all */
  plusPage(why);
  plusHeaderIn();
  renderPlusBuy(); renderPlus(); openSheet('set-plus-sheet');
  $('set-plus-sheet').querySelector('.set-sheet-card').scrollTop = 0;
  if (!isPlus()) storePlans().then((p) => { if (!p) return; storeP = p; renderPlusBuy(); });
}
$('plus-x').addEventListener('click', () => closeSheet($('set-plus-sheet')));
$('set-plus-open').addEventListener('click', () => openPlus());
let statsReturn; // where Settings was opened from, when Observer stats is opened from it (bug hunt 2026-10-21)
// Observer stats from Settings (2026-10-24, Sevaan: after a reset the empty Collection showed before the stats page came
// over it): Settings stays up while the Collection loads underneath with the stats already open (no slide), then Settings
// slides away onto them. statsWait ends on the frame's {sc:'stats', on} or after 4 s.
let statsWait = 0;
$('set-stats-open').addEventListener('click', () => {
  statsReturn = settingsFrom ?? 'explore'; settingsFrom = null;
  document.body.classList.add('panel-over-col', 'col-instant'); openCollection('#stats', { keepHeader: true }); // under Settings: no slide, it's hidden anyway
  clearTimeout(statsWait); statsWait = setTimeout(statsReady, 4000);
});
function statsReady() { if (!statsWait) return; clearTimeout(statsWait); statsWait = 0; if (activePanel === 'debug') closePanel('debug'); setTimeout(() => document.body.classList.remove('col-instant'), 600); }
$('chk-plus-test').addEventListener('change', (e) => setPlusForTesting(e.target.checked));
$('chk-rc-test').checked = rcTestStore(); $('chk-rc-test').addEventListener('change', (e) => { rcTestStore(e.target.checked); toast(e.target.checked ? 'Test Store on. Restart the app (simulator and Xcode builds only).' : 'Test Store off. Restart the app.', 3500); });
onPlus((on, how) => {
  shareWidgets(); // medium, large and the lock screen follow Plus
  try { renderBackRow(); } catch {} // the Card back row shows the back really in use (iOS playtest 2026-10-20)
  renderPlus();
  $('sky-plus-line').hidden = isPlus() || (isNative() && !storeOpen());
  if (!$('visible').hidden) { const pos = panelPos('visible'); try { renderVisible(); renderTonight(); } catch {} panelRestore('visible', pos); } /* each book page keeps its place too (code review 2026-10-23) */ // bells, the Plus line and the shiny list change at once (2026-10-23 Plus test: they waited up to a minute)
  // Joined or restored: the sheet closes so the welcome notice is what you see (2026-10-21, Sevaan).
  if (!$('set-plus-sheet').hidden) { if (on && how !== 'testing') closeSheet($('set-plus-sheet')); else { plusPage(); plusHeaderIn(); } }
  if (on) earnSecret('plus'); // the Plus Member patch: earned once, kept if Plus ends
  if (on && how !== 'restored') { let tries = 0; const go = () => { if (document.querySelector('.overlay.panel:not([hidden]), .set-sheet.in') && tries++ < 120) { setTimeout(go, 500); return; } cardsTurnOver(); }; setTimeout(go, 700); } // every card turns over to the backs you just unlocked (slick idea 15), once you're back on the sky, not over Settings (iOS QA 2026-10-23)
  if (state.tonight) scheduleNotes(state.tonight).catch(() => {});
  ticket({ kind: 'info', tone: 'orange', icon: 'check', eyebrow: 'SPACE COLLECTOR PLUS', /* info, not mission: it answers the purchase, so it may show over the page you bought from (2026-10-23 Plus test) */ line: how === 'testing' ? (on ? 'On (testing)' : 'Off (testing)') : on ? (how === 'restored' ? 'Welcome back' : 'Welcome to Space Collector Plus') : 'Plus has ended', sub: how === 'testing' ? '' : on ? (how === 'restored' ? 'Plus is back on.' : 'Thank you for your support!') : 'Your Member patch stays on your wall.', ms: 3000 });
});
renderPlus();
// Accessibility (2026-10-11, QA): every Settings switch and slider is named after its row, for VoiceOver/TalkBack.
document.querySelectorAll('.set-row').forEach((row) => {
  const name = row.querySelector('.set-main')?.childNodes[0]?.textContent?.trim(); if (!name) return;
  row.querySelectorAll('input[type=checkbox], input[type=range]').forEach((i) => { if (!i.getAttribute('aria-label')) i.setAttribute('aria-label', name); });
});
// What’s in the circle is drawn on the canvas, so screen readers hear it from a hidden live region instead.
let srLast = '';
function announceTarget(text) { if (text === srLast) return; srLast = text; $('sr-target').textContent = text; }
// Line up the sky (2026-10-22, Sevaan; design/compass-calibrate.html A + B): Settings → Compass → Line up opens Explore
// in a lining-up mode. The app picks something real to line up against (the Moon, else the brightest planet, else a
// bright star; never the Sun) and you either point the circle at it and tap (A), or drag the sky sideways until its
// drawing sits on the real one (B). With nothing bright up you point at north (or E/S/W) instead. The result is the
// same saved compass nudge the old ±5° steps set (js/sensors.js; kept across restarts), locked against small wobbles.
// A compass the phone itself doubts gets a figure-8 first. Cancel puts the nudge back; Reset clears it to 0°.
const az180 = (d) => ((d + 540) % 360) - 180;
const enuAz = (e) => (Math.atan2(e[0], e[1]) * 180 / Math.PI + 360) % 360, enuEl = (e) => Math.asin(Math.max(-1, Math.min(1, e[2]))) * 180 / Math.PI;
let calib = null;
function calibRef() {
  const ok = (e) => { const el = enuEl(e); return el > 10 && el < 70; }; // too high and "which way" stops meaning much
  const moon = state.bodies?.find((b) => b.kind === 'moon');
  if (moon && moon.illum > 0.05 && ok(moon.enu)) return { name: 'the Moon', short: 'Moon', enu: moon.enu };
  // By day (2026-10-22, Sevaan: "if it's daytime there is no moon"): your shadow points straight away from the Sun, so
  // aiming along it lines the sky up without anyone looking at the Sun. Needs the Sun 5°+ up for a clear shadow.
  const sun = state.bodies?.find((b) => b.kind === 'sun');
  if (sun && enuEl(sun.enu) > 5) return { name: 'your shadow', short: 'your shadow', shadow: true, az: (enuAz(sun.enu) + 180) % 360 };
  if ((state.frame?.sunEl ?? 0) > -4) return null; // twilight with no Moon: point at north instead (never the Sun)
  const planet = (state.bodies ?? []).filter((b) => b.kind === 'planet' && b.mag < 1.5 && ok(b.enu)).sort((a, b) => a.mag - b.mag)[0];
  if (planet) return { name: planet.name, short: planet.name, enu: planet.enu };
  const star = (state.naturals ?? []).filter((n) => n.obj.natural === 'star' && n.look.visible && (n.look.mag ?? 9) < 1.5 && ok(n.look.enu)).sort((a, b) => a.look.mag - b.look.mag)[0];
  return star ? { name: label(star.obj), short: label(star.obj), enu: star.look.enu } : null;
}
const motionLive = () => !state.drag.on && hasSensorView();
async function calibMotion() { // turn motion on inside the tap (iPhone asks here), then wait a moment for real readings
  if (motionLive()) return true;
  if (!(await enableMotion().catch(() => false))) return false;
  for (let i = 0; i < 15 && !motionLive(); i++) await new Promise((r) => setTimeout(r, 100));
  return motionLive();
}
function calibFirst() {
  const doubt = pointing.source === 'ios' && (pointing.compassAccuracy === -1 || pointing.compassAccuracy > 35 || pointing.compassDoubt > 0.6);
  calib.ref = calibRef(); calibStep(doubt ? 'eight' : calib.ref ? 'aim' : 'north');
}
async function openCalib() {
  const motion = calibMotion(); // started inside the tap (iPhone asks here); the card shows at once and waits on it (web playtest 2026-10-22: up to 1.8 s of empty sky)
  const go = async () => {
    const mine = calib = { start: getNudge(), ref: null, step: null, x0: null, acc: 0 };
    document.body.classList.add('calib'); $('calib').hidden = false;
    [$('cb-k').textContent, $('cb-title').textContent, $('cb-text').textContent] = ['Line up the sky', 'Starting the compass…', 'One moment while your phone finds its bearings.'];
    $('cb-alt').hidden = $('cb-go').hidden = true; $('cb-dirs').hidden = $('cb-off').hidden = true;
    const live = await motion; if (calib !== mine) return; // cancelled while it waited
    $('cb-alt').hidden = $('cb-go').hidden = false;
    if (live) calibFirst(); else calibStep('motion'); // motion couldn't start: the card says so and offers it again
  };
  if (activePanel) { closePanel(activePanel); setTimeout(go, 380); } else go();
}
function calibStep(step) {
  calib.step = step; const r = calib.ref;
  const w = r && !r.shadow ? whereWords({ el: enuEl(r.enu), az: enuAz(r.enu) }) : '';
  const T = {
    motion: ['Motion is off', 'Lining up needs your phone’s compass', 'Turn on motion so the sky follows your phone, then line it up with something you can see.', 'Not now', 'Turn on motion'],
    eight: ['First, calibrate', 'Wave your phone in a slow figure-8', 'A few times, away from metal and magnets, so the compass can find north before you line up.', 'Skip', 'Done'],
    aim: r?.shadow ? ['Use your shadow', 'Point the circle along your shadow', 'Stand with the Sun behind you and aim at the top of your shadow’s head. Never look at the Sun.', 'Drag instead', 'Along my shadow'] : [`Find ${r?.name ?? ''}`, `Point the circle at the real ${r?.name.replace(/^the /, '') ?? ''}`, `${w}. Hold it in the middle of the circle, then tap.`, 'Drag instead', 'It’s in the circle'],
    drag: ['Drag to match', r && !r.shadow ? `Slide the sky until ${r.name} sits on the real one` : 'Slide the sky until it matches what you see', 'Hold the phone still and drag sideways. Only sideways moves count.', r ? 'Aim instead' : 'Point at north', 'Set'],
    north: ['Use a direction you know', 'Point the circle at north', 'Use a street you know runs north, or your phone’s Compass app. Never aim at the Sun.', 'Drag instead', 'Pointing north'],
  }[step];
  [$('cb-k').textContent, $('cb-title').textContent, $('cb-text').textContent, $('cb-alt').textContent, $('cb-go').textContent] = T;
  $('cb-dirs').hidden = step !== 'north'; $('cb-off').hidden = step !== 'drag'; calibOff();
}
function calibOff() { const d = az180(getNudge() - calib.start); $('cb-off').textContent = Math.abs(d) < 0.5 ? 'Drag sideways to turn the sky' : `Turned ${Math.abs(Math.round(d))}° ${d > 0 ? 'east' : 'west'} · drag to adjust`; }
// Where the phone points now (the true basis with the current nudge), turned so that it points at `az`.
function calibAimAt(az, ref) {
  const b = trueBasis(); if (!b) { toast('Your phone’s compass isn’t answering. Try again in a moment.', 2600); return; }
  nudgeHeading(az180(az - headingOf(b))); lockHeading(true); calibDone(ref);
}
function calibDone(ref) {
  const n = az180(getNudge()), d = az180(getNudge() - calib.start);
  note('calib', { ref: String(ref?.kind ?? ref?.name ?? ref ?? '').slice(0, 20), deg: Math.round(d), total: Math.round(n) }); // how far people turn the sky: big turns mean poor compasses (2026-10-25, Sevaan)
  try { localStorage.setItem('calibInfo', JSON.stringify({ at: Date.now(), ref, deg: Math.round(n) })); } catch {}
  calibClose();
  buzz('success'); ticket({ kind: 'info', tone: 'gold', icon: 'compass', eyebrow: 'COMPASS', line: 'Sky lined up', sub: `${Math.abs(d) < 1 ? 'It was already right' : `Turned ${Math.abs(Math.round(d))}° ${d > 0 ? 'east' : 'west'}`}, against ${ref}. Change it in Settings.`, ms: 4200 });
}
function calibClose() { calib = null; $('calib').hidden = true; document.body.classList.remove('calib'); }
$('calib-open').addEventListener('click', openCalib);
$('cb-go').addEventListener('click', () => {
  if (!calib) return;
  if (calib.step === 'motion') { calibMotion().then((ok) => { if (!calib) return; if (ok) calibFirst(); else $('cb-text').textContent = 'Motion didn’t start on this device. You can still drag the sky to look around.'; }); }
  else if (calib.step === 'eight') calibStep(calib.ref ? 'aim' : 'north');
  else if (calib.step === 'aim') calibAimAt(calib.ref.az ?? enuAz(calib.ref.enu), calib.ref.name);
  else if (calib.step === 'north') calibAimAt(0, 'north');
  else { lockHeading(true); calibDone(calib.ref ? calib.ref.name : 'the sky by eye'); }
});
$('cb-alt').addEventListener('click', () => {
  if (!calib) return;
  if (calib.step === 'motion') { calibClose(); return; }
  if (calib.step === 'eight') calibStep(calib.ref ? 'aim' : 'north');
  else if (calib.step === 'drag') calibStep(calib.ref ? 'aim' : 'north');
  else calibStep('drag');
});
$('cb-dirs').addEventListener('click', (e) => { const d = e.target.closest('[data-dir]'); if (d && calib) calibAimAt(Number(d.dataset.dir), e.target.textContent.toLowerCase()); });
$('cb-cancel').addEventListener('click', () => { if (!calib) return; nudgeHeading(az180(calib.start - getNudge())); calibClose(); });
$('cb-reset').addEventListener('click', () => { if (!calib) return; const n = getNudge(); if (n) nudgeHeading(-n); lockHeading(false); try { localStorage.removeItem('calibInfo'); } catch {} calibClose(); toast('Back to your phone’s own compass.', 2400); });
// Drag to match: a sideways drag on the sky turns it (the old camera line-up drag, now for everyone in this mode).
$('sky').addEventListener('pointerdown', (e) => { if (calib?.step !== 'drag') return; calib.x0 = e.clientX; calib.acc = 0; });
$('sky').addEventListener('pointermove', (e) => { if (calib?.step !== 'drag' || calib.x0 == null) return; const deg = -(e.clientX - calib.x0) * (sky.fovV / sky.h); const step = deg - calib.acc; if (Math.abs(step) >= 0.25) { nudgeHeading(step); calib.acc = deg; calibOff(); } });
addEventListener('pointerup', () => { if (calib) calib.x0 = null; });

setInterval(() => { if (activePanel === 'debug' && !document.hidden) renderDebug(); }, 1000); // the Sky time line ticks while Settings is open (playtest 2026-10-22)
function renderDebug() {
  const d = now();
  $('sim-time-label').textContent = `${d.toLocaleString()}${state.timeOffsetMs ? ' (simulated)' : ' (current time)'}`;
  const n = getNudge();
  $('nudge-label').textContent = `${Math.round(n > 180 ? n - 360 : n)}°`; $('nudge-reset').disabled = !Math.round(n > 180 ? n - 360 : n); // nothing to reset at 0°
  { let ci = null; try { ci = JSON.parse(localStorage.getItem('calibInfo') || 'null'); } catch {}
    $('nudge-row').hidden = !Math.round(n > 180 ? n - 360 : n); /* only when there's something to undo */
    $('calib-last').textContent = ci ? `Lined up against ${ci.ref} · ${((m) => m < 1 ? 'just now' : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`)(Math.round((Date.now() - ci.at) / 60000))}` : Math.round(n > 180 ? n - 360 : n) ? 'Lined up by hand' : 'Is the sky drifting or off to one side?'; }
  $('chk-drag').checked = state.drag.on;
  renderSettings();
  const cat = state.catalog;
  const ageH = cat ? ((Date.now() - cat.generated) / 3.6e6).toFixed(1) : '?';
  const f = state.frame;
  $('debug-info').textContent = [
    `version        v${VERSION}`,
    `screen         ${innerWidth}×${innerHeight} css px · zoom ${(window.visualViewport?.scale ?? 1).toFixed(2)} · dpr ${devicePixelRatio} · text ${document.documentElement.dataset.textScale ?? 100}% · reveal --cf ${getComputedStyle($('reveal')).getPropertyValue('--cf') || '-'}`,
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
  // Warm the Collection layer once the sky is running and the tour / Tonight page are out of the way (2026-10-16 perf
  // sweep: loading it under the Tonight page made that page stutter).
  const warmCol = () => { if (!$('onboard').hidden || !$('ob-done').hidden) { setTimeout(warmCol, 1500); return; } (window.requestIdleCallback ?? setTimeout)(() => loadCollection(), { timeout: 8000 }); };
  setTimeout(warmCol, 6000); // after the sky’s first seconds, not on top of them (jank playtest 2026-10-17: ~290 ms frames)
  state.skyOpenedAt ??= performance.now();
  state.started=true; $('start').hidden=true; $('hud').hidden=false;
  if (!state.storageReady) ticket({ kind: 'error', sticky: true, eyebrow: 'STORAGE OFF', line: 'Catches may not save', sub: 'This browser won’t let the game store anything.' });
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
// Keep the tour card’s arrow pointing at the target: angle on screen = target azimuth − your heading; it also says how far.
function obAimTick() {
  requestAnimationFrame(obAimTick);
  const g = document.querySelector('#ob-deck .ob-aim'); if (!g || !obAimTarget || !state.basis) return;
  const b = state.basis.back, heading = (Math.atan2(b[0], b[1]) / RAD + 360) % 360, myEl = Math.asin(Math.max(-1, Math.min(1, b[2]))) / RAD;
  // The target’s live position, the same one the guidance pill uses (playtest room 2026-10-11: the card said "Turn
  // right 89°" while the pill said "← Turn left" for the same star, because this kept the position from the step’s start).
  const tl = (obAimTarget.pass && now().getTime() < obAimTarget.pass.start ? obAimTarget.look : null) ?? state.items?.find((it) => it.obj.id === obAimTarget.obj.id)?.look ?? obAimTarget.look, dAz = ((tl.az - heading + 540) % 360) - 180, dEl = tl.el - myEl;
  const ang = Math.atan2(dAz, dEl) * 180 / Math.PI, off = Math.hypot(dAz, dEl);
  g.querySelector('.ob-arrow').setAttribute('transform', `rotate(${ang.toFixed(1)} 150 60)`);
  g.querySelector('.ob-arrow').style.opacity = off < 6 ? 0 : 1;
  const A = Math.abs(dAz), E = Math.abs(dEl), msg = off < 6 ? 'Right there' : `${A > 8 ? (A > 150 ? 'Turn round' : `Turn ${dAz > 0 ? 'right' : 'left'}${A < 35 ? ' a little' : ''}`) : ''}${A > 8 && E > 8 ? ' · ' : ''}${E > 8 ? `${dEl > 0 ? 'up' : 'down'}${E < 25 ? ' a little' : ''}` : ''}`; // words, not degrees (UX playtest 2026-10-21)
  const txt = msg.charAt(0).toUpperCase() + msg.slice(1), t = g.querySelector('.ob-aim-txt'); if (t.textContent !== txt) t.textContent = txt;
  // Lined up while the card is still up (2026-10-20, Sevaan): its button becomes Collect and catches it right there,
  // the same as the Collect under the circle.
  const ready = state.lockedOn && state.activeTarget?.obj.id === obAimTarget.obj.id;
  const yes = g.closest('.tc')?.querySelector('.yes');
  if (yes && ready !== (yes.dataset.collect === '1')) { if (ready) yes.dataset.label = yes.textContent; yes.dataset.collect = ready ? '1' : ''; yes.textContent = ready ? 'Collect' : (yes.dataset.label || 'Show me where'); yes.classList.toggle('ob-collect', ready); } // remember the words before Collect, so moving off the target puts them back (it stuck on Collect)
  obCollectReady = ready;
}
let obCollectReady = false, obCollectNow = null;
requestAnimationFrame(obAimTick);
const OB_ART = {
  notify: '<svg viewBox="0 0 300 120" aria-hidden="true"><rect x="118" y="10" width="64" height="100" rx="11" fill="#0c1725" stroke="#fff2b3" stroke-width="2"/><g class="ob-note"><rect x="125" y="28" width="50" height="15" rx="4" fill="#fff2b3"/><rect x="129" y="32" width="7" height="7" rx="2" fill="#fa8127"/></g><g class="ob-note ob-note2"><rect x="125" y="49" width="50" height="15" rx="4" fill="#fff2b3" opacity=".6"/><rect x="129" y="53" width="7" height="7" rx="2" fill="#fa8127"/></g><path d="M222 26a9 9 0 0 1 -9 -12 a11 11 0 1 0 9 12z" fill="#fff2b3" opacity=".9"/><circle cx="80" cy="30" r="1.4" fill="#fff2b3"/><circle cx="62" cy="76" r="1" fill="#fff2b3"/><circle cx="240" cy="84" r="1.2" fill="#fff2b3"/></svg>',
  aim: (az, el) => `<svg class="ob-aim" viewBox="0 0 300 120" aria-hidden="true"><circle cx="150" cy="60" r="30" fill="none" stroke="#fff2b3" stroke-opacity=".6" stroke-width="1.5"/><circle cx="150" cy="60" r="36" fill="none" stroke="#627a8b" stroke-opacity=".5" stroke-dasharray="2 5"/>
    <g class="ob-arrow" style="transition:opacity .3s"><path d="M150 14 L141 30 L147 30 L147 42 L153 42 L153 30 L159 30 Z" fill="#fa8127"/></g><circle cx="150" cy="60" r="3" fill="#fff2b3" opacity=".7"/>
    <text class="ob-aim-txt" x="150" y="114" text-anchor="middle" fill="#fa8127" font-family="SC Label, Arial Narrow, sans-serif" font-size="12" letter-spacing="2"></text></svg>`,
  loc: '<svg viewBox="0 0 300 120" aria-hidden="true"><g fill="none" stroke="#627a8b" stroke-width="1"><ellipse cx="150" cy="78" rx="120" ry="26"/><ellipse cx="150" cy="78" rx="70" ry="15" stroke-dasharray="3 4"/></g><ellipse class="ob-ripple" cx="150" cy="84" rx="18" ry="4" fill="none" stroke="#fa8127" stroke-width="1.5"/><g class="ob-pin"><path d="M150 30c-12 0-21 9-21 21 0 16 21 34 21 34s21-18 21-34c0-12-9-21-21-21z" fill="#fa8127"/><circle cx="150" cy="51" r="7" fill="#080e1a"/></g><g fill="#fff2b3"><circle cx="60" cy="24" r="1.5"/><circle cx="238" cy="18" r="2"/><circle cx="262" cy="46" r="1.2"/><circle cx="40" cy="58" r="1.2"/></g></svg>',
  motion: '<svg viewBox="0 0 300 120" aria-hidden="true"><g transform="translate(150 62)"><g class="ob-phone"><rect x="-22" y="-40" width="44" height="80" rx="9" fill="#0c1725" stroke="#fff2b3" stroke-width="2"/><circle r="12" fill="none" stroke="#fa8127" stroke-width="2"/><circle r="2.4" fill="#fa8127"/></g></g><g class="ob-waves" fill="none" stroke="#fa8127" stroke-width="1.6" stroke-linecap="round"><path d="M92 40 Q70 62 92 84"/><path d="M78 30 Q48 62 78 94" opacity=".5"/><path d="M208 40 Q230 62 208 84"/><path d="M222 30 Q252 62 222 94" opacity=".5"/></g></svg>',
  sky: '<svg viewBox="0 0 300 120" aria-hidden="true"><rect x="40" y="58" width="220" height="4" rx="2" fill="#627a8b55"/><rect x="40" y="58" width="132" height="4" rx="2" fill="#fa8127"/><circle cx="172" cy="60" r="11" fill="#080e1a" stroke="#fa8127" stroke-width="2.5"/><g fill="#fff2b3"><circle cx="70" cy="28" r="1.2" opacity=".4"/><circle cx="110" cy="22" r="1.6" opacity=".6"/><circle cx="160" cy="30" r="2" opacity=".8"/><circle cx="210" cy="20" r="2.4"/><circle cx="246" cy="34" r="2.8"/></g><text x="40" y="92" fill="#bdbea9" font-family="SC Label, Arial Narrow" font-size="11" letter-spacing="2">BRIGHT</text><text x="260" y="92" fill="#bdbea9" font-family="SC Label, Arial Narrow" font-size="11" letter-spacing="2" text-anchor="end">DARK</text></svg>',
  // Inside or out (2026-10-25): a house with the line of sight through the roof; open sky over pines, Moon or Sun.
  inside: '<svg viewBox="0 0 104 84" fill="none" stroke="#fff2b3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 46 L52 16 L90 46"/><path d="M24 40 V80 H80 V40"/><path d="M44 80 V62 H58 V80"/><rect x="62" y="50" width="10" height="9"/><path d="M52 58 L78 8" stroke="#fa8127" stroke-dasharray="2 4"/><circle cx="80" cy="6" r="2.2" fill="#fa8127" stroke="none"/><circle cx="20" cy="10" r="1.2" fill="#fff2b3" stroke="none"/><circle cx="34" cy="4" r="1" fill="#fff2b3" stroke="none"/></svg>',
  outside: (dark) => `<svg viewBox="0 0 104 84" fill="none" stroke="#fff2b3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 74 Q52 66 100 74"/><path d="M16 74 L22 50 L28 74 M18 64 h8 M86 74 L91 54 L96 74 M88 66 h6"/><path d="M50 74 v-10 M50 64 l-4 6 M50 64 l4 6 M50 60 a3 3 0 1 0 .1 0"/>${dark ? '<path d="M78 30a10 10 0 1 1 -13 -14a8 8 0 0 0 13 14z" fill="#fff2b3" stroke="none"/><circle cx="24" cy="18" r="1.4" fill="#fff2b3" stroke="none"/><circle cx="42" cy="8" r="1.1" fill="#fff2b3" stroke="none"/><circle cx="58" cy="30" r="1.2" fill="#fff2b3" stroke="none"/>' : '<circle cx="74" cy="22" r="8" fill="#fff2b3" stroke="none"/><path d="M74 6v4M74 34v4M58 22h4M86 22h4M63 11l3 3M82 30l3 3M85 11l-3 3M66 30l-3 3" stroke-width="1.6"/>'}<path d="M30 34 L46 26" stroke="#fa8127" stroke-dasharray="2 4"/></svg>`,
  catch: '<svg viewBox="0 0 300 120" aria-hidden="true"><circle cx="150" cy="60" r="34" fill="none" stroke="#fa8127" stroke-width="2"/><circle cx="150" cy="60" r="5" fill="#fff2b3"/><circle cx="150" cy="60" r="16" fill="#fff2b3" opacity=".18"/></svg>',
};
// steps: [{ tier, title, sub: [left, right], art, text, yes, no, gold }]; shows steps[k] with the rest stacked under it.
function obCard(steps, k) {
  const deck = $('ob-deck');
  if (k > 0) sfx('step', { gain: 0.8 });
  [...$('ob-pips').children].forEach((p, i) => { p.className = i < k ? 'done' : i === k ? 'on' : ''; });
  const make = (s) => { const el = document.createElement('div'); el.className = `tc${s.gold ? ' gold' : ''}${s.stack ? ' stack' : ''}`; el.dataset.step = steps.indexOf(s);
    el.innerHTML = `<div class="in"><div class="bar"><span>Space Collector</span><span class="tier">◆ ${escapeHtml(s.tier)}</span></div><h3>${escapeHtml(s.title)}</h3><div class="sub"><span>${escapeHtml(s.sub[0])}</span><span>${escapeHtml(s.sub[1])}</span></div>${s.art ? `<div class="art">${s.art}</div>` : ''}${s.text ? `<p>${escapeHtml(s.text)}</p>` : ''}${s.choice ? `<div class="acts pick">${s.choice.map((c, i) => `<button class="pk pk-card" type="button" data-v="${c.v}"><span class="pk-hd"><span>Where · 0${i + 1}</span><i>◆</i></span><span class="pk-art">${c.img ? `<img src="${c.img}" alt="" decoding="async">` : c.art}</span><b>${escapeHtml(c.label)}</b><small>${escapeHtml(c.sub)}</small>${c.stat ? `<span class="pk-st"><span>${escapeHtml(c.stat[0])}</span><em>${escapeHtml(c.stat[1])}</em></span>` : ''}</button>`).join('')}</div>` : `<div class="acts">${s.no ? `<button class="no" type="button">${escapeHtml(s.no)}</button>` : ''}<button class="yes" type="button">${escapeHtml(s.yes)}</button></div>`}</div><div class="shine"></div>`;
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
  // The card now on top may have been built earlier, before its step’s words were final (the Assignment is named
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
    top.querySelector('.yes')?.addEventListener('click', () => { steps[k].onYes?.(); go(true); }); // onYes runs inside the tap (iOS permissions)
    top.querySelectorAll('.pk').forEach((b) => b.addEventListener('click', () => { if (steps[k].picked) return; steps[k].picked = b.dataset.v; buzz(8); b.classList.add('on'); b.parentElement.classList.add('picked'); setTimeout(() => go(true), matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 420); })); /* the tapped card lifts and glows, the other steps back, then the deck moves on (design/where-cards.html A, 2026-10-25) */ // a choice card (inside or out)
    top.querySelector('.no')?.addEventListener('click', () => go(false));
  });
}
// Wake the sky after the location step: unblur, brighten, and swing round into place (a bigger swing when it’s
// really your sky). Then the lock line says what happened.
function obWake(real) {
  const sk = $('sky'); sk.classList.remove('asleep'); sk.classList.add('waking'); setTimeout(() => sk.classList.remove('waking'), 2200);
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) state.viewSpin = { t0: performance.now(), ms: real ? 2200 : 1400, az: real ? 140 : 50 };
  setTimeout(() => obReact(real ? 'Sky lined up to your spot' : 'An example sky for now'), real ? 1500 : 900);
}
// After the motion step: a pulse from the circle and "You’re in control", or with a finger a gentle sway of the
// sky and "Drag to look around".
function obControl(motion) {
  sky.lockPulseAt = performance.now(); buzz?.(20);
  if (!motion && !matchMedia('(prefers-reduced-motion: reduce)').matches) state.viewSpin = { t0: performance.now(), ms: 1800, az: 14, sway: true };
  // (no words over the sky: the "You’re in control" text and rocking phone were removed, 2026-10-09, Sevaan)
}
function obReact(line) {
  let b = document.querySelector('.ob-bloom'); if (!b) { b = document.createElement('div'); b.className = 'ob-bloom'; document.body.append(b); }
  b.classList.remove('go'); void b.offsetWidth; b.classList.add('go');
  void line; // the bloom only: no words over the sky during the tour (2026-10-09, Sevaan)
}
async function runOnboarding(force = false) {
  if (!force && state.sightings.some((x) => !x.sim)) { await enableMotion(); requestLocation(); return; } // not a first run
  const ob = $('onboard'); ob.hidden = false; $('ob-done').hidden = true; $('ob-pips').hidden = false; $('ob-skip').hidden = false; state.pinnedId = null; state.targetId = null;
  let skipped = false; $('ob-skip').onclick = () => { skipped = true; note('tour', { s: 'skip' }); onboarding?.resolve(false); };
  document.body.classList.add('ob-tour');
  let motionAsk = null, notesAsk = null; state.tourWhere = null;
  const night = (state.frame?.sunEl ?? -90) < -6;
  const steps = [
    // Location feels optional (2026-10-25, Sevaan; design/first-night.html 05): the second button is a real place, picked
    // from the phone’s time zone, not a "Not now". Stacked, full width.
    ...[DEFAULT_LOCATION.fromTz ? (() => { const city = String(DEFAULT_LOCATION.label).replace(/^Example:\s*/, ''); return { tier: 'Step 1 of 3', title: 'Find your sky', sub: ['', ''], art: OB_ART.loc, text: `Share your location so the sky on screen matches yours. Or start with ${city}, picked from your phone’s time zone.`, yes: 'Use my location', no: `Use ${city} · from your time zone`, stack: true }; })()
      : { tier: 'Step 1 of 3', title: 'Find your sky', sub: ['', ''], art: OB_ART.loc, text: 'What’s overhead depends on where you’re standing. Share your location so the sky on screen matches the one above you. It’s only used for that, and never sold.', yes: 'Use my location', no: 'Not now' }],
    { tier: 'Step 2 of 3', title: 'Point and look', sub: ['', ''], art: OB_ART.motion, text: 'Turn on motion and your phone becomes a window on the sky. Aim it anywhere, and the circle shows you what’s there.', yes: 'Allow motion', no: 'Use a finger', onYes: () => { motionAsk = enableMotion(); } },
    ...([{ tier: 'Step 3 of 3', title: 'Know when to look up', sub: ['', ''], art: OB_ART.notify, text: 'Get a heads-up when tonight is worth stepping outside, and just before tonight’s best catch flies over.', yes: 'Turn on', no: 'Not now', onYes: () => { notesAsk = askNotifications(); } }]), // notifications step (2026-10-14, design/notifications.html); on the website too, for testing (Sevaan) // back in the tour (2026-10-18, Sevaan: moving it after the first catch was undone)
    { tier: 'Your first card', title: 'Your first catch', sub: ['Up right now', ''], art: OB_ART.catch, text: '', yes: 'Show me where', gold: true, onYes: () => { obCollectNow = obCollectReady && obAimTarget ? obAimTarget.obj : null; if (obCollectNow) { unlockAudio(); primeReveal(); } } },
  ];
  let tgt0 = null; const A = steps.length - 1; // the assignment card
  const nameTarget = () => { tgt0 = firstTarget(); if (!tgt0) return; steps[A].title = `Catch ${['moon', 'sun'].includes(tgt0.obj.type) && !/^the /i.test(label(tgt0.obj)) ? 'the ' : ''}${label(tgt0.obj)}`; /* not "the The Sun" (text audit 2026-10-17); "Catch the Moon" (playtest 2026-10-16) */ steps[A].sub = [tgt0.obj.type === 'star' ? 'Bright star' : tgt0.obj.type === 'sun' ? 'Our star' : tgt0.obj.type === 'moon' ? 'Natural satellite' : tgt0.obj.natural ? 'Planet' : 'Satellite', whereWords(tgt0.look)]; steps[A].text = `${/^It’s /.test(tgt0.hint ?? '') ? '' : 'It’s up right now. '}${tgt0.hint} Follow the arrow, then tap Collect to keep your first card.`; /* not "It’s up right now. It’s low now." (flow playtest 2026-10-25) */
    // Said for where you are (2026-10-25, design/tour-rethink.html 02, 04): through the roof, or "you’re early".
    { const T = state.tonight, t = now().getTime(), early = T?.dusk && T.dusk - t > 20 * 60e3, the = ['moon', 'sun'].includes(tgt0.obj.type) ? 'the ' : '';
      if (state.tourWhere === 'inside') { steps[A].sub[0] = 'Through the roof'; steps[A].text = `It’s up there now, ceiling or not. Follow the arrow, then tap Collect.${tgt0.obj.type === 'sun' ? ' Aim the phone, never your eyes.' : ''}`; }
      else if (state.tourWhere === 'outside' && early) steps[A].text = `The stars come out at ${fmtTime(T.dusk).replace(' ', '\u00a0')}. Until then, ${the}${label(tgt0.obj).replace(/^the /i, '')} is the one to catch.${tgt0.obj.type === 'sun' ? ' Aim the phone, never your eyes.' : ''}`; }
    // The card’s art becomes a live pointer (2026-10-08, Sevaan): the circle with an arrow that turns toward the target as you turn.
    steps[A].art = OB_ART.aim(tgt0.look.az, tgt0.look.el); obAimTarget = tgt0;
 };
  steps[A].text = 'Sweep the sky. When something lines up in the circle, tap it to collect your first card.';
  // The sky starts asleep behind the cards: blurred, dim and turned away. Each permission wakes part of it.
  $('sky').classList.add('asleep');
  // 1. location: the sky wakes and swings round into your real sky
  // (Android playtest 2026-10-20: a slow fix held the tour 15 s with no sign of life, and a refusal or timeout quietly
  // showed another city.) Wait at most 4 s, then carry on; the next card says whose sky it is if it isn't yours.
  const exampleSky = () => { const c = String(state.observer.label ?? '').replace(/^Example:\s*/, ''); steps[1].sub = [`${c && !/location/i.test(c) ? c : 'An example'} sky for now`, 'Change it in Settings']; };
  const locYes = await obCard(steps, 0); note('tour', { s: 'loc', loc: locYes ? 'own' : skipped ? 'skip' : DEFAULT_LOCATION.fromTz ? 'tz' : 'none' });
  if (locYes) {
    const ok = requestLocation(); const r = await Promise.race([ok, new Promise((res) => setTimeout(() => res('slow'), 4000))]);
    if (r === 'slow') ok.then((v) => obWake(!!v)); else { obWake(!!r); if (!r) exampleSky(); }
  } else { obWake(false); exampleSky(); }
  if (skipped) return obFinish(false);
  // The Inside / Outside card is gone (2026-10-25, Sevaan): the slider is taught by Match your sky the first time it's dark.
  // 3. motion (asked inside the tap above): "you’re in control"; with a finger, the sky sways to show it moves
  if (await obCard(steps, 1)) { const okM = await motionAsk; obControl(!!okM); if (!okM) steps[2].sub = ['Motion didn’t start', 'Drag the sky with a finger']; /* toasts are hidden in the tour, so the next card says it (web playtest 2026-10-22) */ } else { state.drag.on = true; $('chk-drag').checked = true; obControl(false); }
  if (skipped) return obFinish(false);
  // 3. the assignment (the sky-darkness step is gone, 2026-10-09: the sky starts at its darkest)
  nameTarget(); // now that location and motion are in, name what’s up
  // 4. notifications: asked inside the tap; then the schedule is set up for tonight
  if (A === 3) { if (await obCard(steps, 2)) { await notesAsk; if (state.tonight) scheduleNotes(state.tonight).catch(() => {}); } if (skipped) return obFinish(false); }
  // 5. Outside at night, the first target can be the big one (2026-10-25, Sevaan; design/tour-rethink.html 03): the
  // Space Station or a new Rare-or-better card rising within 15 minutes, with a countdown. "Catch the Moon" (the surest
  // thing up) waits for it: the arrow points at the Moon, a FIRST TARGET pill keeps the clock, anything caught counts as
  // the first card, and at 1:00 left the arrow swings to the pass.
  const rare = await rareFirst() /* everyone at night now the Inside/Outside card is gone (2026-10-25); rareFirst checks dark, a real place and clear sky */, fb = rare ? firstTarget() : null;
  let cdT = 0;
  if (rare) {
    const nm = label(rare.obj), the = rare.obj.type === 'station' && !/^the /i.test(nm) ? 'The ' : '', fbName = fb ? `${['moon', 'sun'].includes(fb.obj.type) && !/^the /i.test(label(fb.obj)) ? 'the ' : ''}${label(fb.obj)}` : '';
    const cd = () => { const s2 = Math.max(0, Math.round((rare.start - now().getTime()) / 1000)); return `${Math.floor(s2 / 60)}:${String(s2 % 60).padStart(2, '0')}`; };
    steps[A] = { ...steps[A], tier: 'First target', title: the + nm, sub: [`Rises in the ${dirWord(rare.riseAz)} in`, cd()], art: OB_ART.aim(rare.riseAz, rare.riseEl),
      text: `${rare.obj.id === 25544 ? 'The brightest thing passing tonight' : `A ${TIER_INFO[cardModel(rare.obj).tier]?.label ?? 'rare'} card`}, and it’s nearly here.${fb ? ` Catch ${fbName} while you wait.` : ''}`, yes: 'Show me where', no: fb ? `Catch ${fbName}` : '' };
    obAimTarget = { obj: rare.obj, look: { az: rare.riseAz, el: rare.riseEl }, pass: rare };
    cdT = setInterval(() => { const sub = document.querySelector('#ob-deck .tc:not(.gone):not(.under):not(.under2) .sub'); if (!sub) return; const up = now().getTime() >= rare.start; /* at 0:00 it says it's rising (first-run playtest 2026-10-25) */
      sub.firstElementChild.textContent = up ? `Rising now in the ${dirWord(rare.riseAz)}` : `Rises in the ${dirWord(rare.riseAz)} in`; sub.lastElementChild.textContent = up ? '' : cd(); }, 500);
  }
  const chose = await obCard(steps, A); clearInterval(cdT); if (skipped) return obFinish(false);
  const waiting = !!(rare && !chose && fb);
  if (rare) note('tour', { s: 'rare', pick: waiting ? 'wait' : 'show', id: rare.obj.id === 25544 ? 'iss' : cardModel(rare.obj).tier }); // usage: how the big first target went
  $('ob-deck').replaceChildren(); $('ob-pips').hidden = true; $('ob-skip').hidden = true; document.body.classList.remove('ob-tour'); // the cards are done: hunting the target is just the app
  // the first catch: pin the surest target; the normal aim + reveal takes over
  const caught = obCollectNow; obCollectNow = null;
  const target = caught ? { obj: caught, look: state.activeTarget?.look, hint: '' } : rare && !waiting ? { obj: rare.obj, look: { az: rare.riseAz, el: rare.riseEl }, hint: '' } : waiting ? fb : firstTarget() ?? tgt0;
  if (rare && !waiting && !caught) showMePass(rare); // steered to where it rises, like Tonight → Show me
  else if (target && !caught) guideTo(target.obj, target.look, target.hint); // same steering as Tonight → Show me
  if (waiting) firstTargetPill(rare);
  ob.style.pointerEvents = 'none';
  // wait for the first card (or a skip), then close
  // QA 2026-10-08: only the tour’s own catch counts (an owned object auto-logged during a replay used to end the
  // tour), and leaving for Settings counts as skipping (it used to carry on to the finish page).
  // On a real first run any catch is the first card, named or not (first-run playtest 2026-10-25: catching another one
  // left the tour running out of sight). On a replay only the tour's own target counts (QA 2026-10-08: an owned object
  // logged automatically ended it), unless waiting for the big one.
  const firstRun = !state.sightings.some((x) => !x.sim);
  const tourCatches = () => state.sightings.filter((x) => !x.sim && (firstRun || waiting || state.tourCatchId == null || x.objectId === state.tourCatchId)).length;
  state.tourCatchId = target?.obj.id ?? null; state.tourRevealed = false;
  const had = tourCatches();
  if (caught) { sfx('collect'); buzz(16); capture(caught); } // collected from the card itself
  // If the target leaves the sky before it’s caught (a low Moon setting), the tour moves on to the next surest thing,
  // or lets go if nothing’s left (bug hunt 2026-10-17: it waited forever behind the trees).
  const upNow = (id) => (state.naturals ?? []).find((n) => n.obj.id === id)?.look.visible || (state.items ?? []).find((a) => a.obj.id === id)?.look.visible;
  let gone = 0;
  await new Promise((resolve) => { onboarding = { resolve }; const t = setInterval(() => { if (state.tourRevealed || tourCatches() > had) { clearInterval(t); resolve(true); return; }
    if (rare && state.tourCatchId === rare.obj.id && now().getTime() < rare.end + 30e3) { gone = 0; return; } // it hasn't risen yet: wait for it
    if (state.tourCatchId != null && !upNow(state.tourCatchId) && ++gone >= 6) { gone = 0; const next = firstTarget(); if (next && next.obj.id !== state.tourCatchId) { state.tourCatchId = next.obj.id; guideTo(next.obj, next.look, next.hint); } else if (!next) { skipped = true; clearInterval(t); resolve(false); } } else if (upNow(state.tourCatchId)) gone = 0; }, 500); $('ob-skip').onclick = () => { skipped = true; clearInterval(t); resolve(false); }; });
  if (skipped) return obFinish(false);
  // Let the full capture reveal play (2026-10-06: the close was covering it because the sighting is saved a
  // moment before the reveal opens). Wait for it to open, keep the tour chrome out of its way, then show the
  // close once it’s flicked away or closed.
  ob.hidden = true;
  await new Promise((resolve) => { const t0 = Date.now(), t = setInterval(() => { if (!$('reveal').hidden || Date.now() - t0 > 4000) { clearInterval(t); resolve(); } }, 100); });
  // The Tonight page is built and shown under the reveal the moment it starts to leave, so the reveal fades straight onto
  // it (2026-10-19, Sevaan: the sky flashed for a split second in between). closePanel('reveal') calls tourRevealLeaving.
  await new Promise((resolve) => { tourRevealLeaving = resolve; const t = setInterval(() => { if ($('reveal').hidden) { clearInterval(t); tourRevealLeaving = null; resolve(); } }, 200); });
  ob.hidden = false;
  obFinish(true);
}
// The big first target (design/tour-rethink.html 03): only outside, after dark, with a real location (a time-zone city
// could put the countdown minutes off) and no cloud. The Space Station first, then the rarest, then the soonest.
async function rareFirst() {
  const t0 = now().getTime();
  if (frame(new Date(t0), state.observer).sunEl >= DARK_SUN_ELEVATION || !['ready', 'stale', 'manual'].includes(state.locationStatus) || cloudAt(t0)) return null;
  for (let i = 0; i < 30 && !state.tonight; i++) await new Promise((r) => setTimeout(r, 100)); // the plan may still be on its way
  const T = state.tonight; if (!T) return null;
  const big = (p) => p.obj.id === 25544 || (TIER_RANK[cardModel(p.obj).tier] ?? 0) >= 2;
  const ps = tonightPasses(T, t0).filter((p) => p.fresh && !p.obj.family && p.end - p.start >= 180e3 /* 3+ min visible: a newcomer needs time to find it (flow playtest 2026-10-25) */ && p.start > t0 + 60e3 && p.start <= t0 + 15 * 60e3 && p.peakEl >= 20 && big(p) && !cloudAt(p.start));
  return ps.sort((a, b) => (b.obj.id === 25544) - (a.obj.id === 25544) || (TIER_RANK[cardModel(b.obj).tier] ?? 0) - (TIER_RANK[cardModel(a.obj).tier] ?? 0) || a.start - b.start)[0] ?? null;
}
// The FIRST TARGET pill under the header while you wait (Sevaan's wording). Tap it to aim at the pass. At 1:00 left it
// turns orange and the app steers to the pass (once nothing else is open). Gone when it's caught or over.
function firstTargetPill(p) {
  document.querySelector('.ft-pill')?.remove();
  const el = document.createElement('button'); el.type = 'button'; el.className = 'ft-pill';
  let img = ''; try { img = artImage(cardModel(p.obj), 'small') ?? ''; } catch {}
  el.innerHTML = `${img ? `<img src="${escapeHtml(img)}" alt="">` : '<i></i>'}<span><small>First target</small><b>${escapeHtml(widgetName(p.obj).replace(/ Space Station$/, '') || 'Space Station')} · ${escapeHtml(compassPoint(p.riseAz))}</b></span><em></em>`;
  document.body.append(el);
  let switched = false;
  const aim = () => { if (activePanel || !$('reveal').hidden || !$('ob-done').hidden || collectionOpen) return false; if (state.tourCatchId != null) state.tourCatchId = p.obj.id; showMePass(p); return true; };
  el.addEventListener('click', () => { buzz(8); aim(); });
  const tick = () => {
    if (!el.isConnected) return;
    const t = now().getTime(), left = Math.round((p.start - t) / 1000);
    if (!isNewFind(p.obj) || t > p.end + 150e3) { el.classList.add('out'); setTimeout(() => el.remove(), 400); return; }
    setTxt(el.querySelector('em'), left > 0 ? `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}` : 'Now');
    if (!switched && left <= 60 && aim()) { switched = true; el.classList.add('rising'); setTxt(el.querySelector('small'), 'First target · rising'); buzz('warning'); }
    setTimeout(tick, 500);
  };
  tick();
}
// What’s certain to be up right now, with a one-line hint.
function firstTarget() {
  const nat = state.naturals ?? [];
  const sun = nat.find((n) => n.obj.key === 'sun' && n.look.visible && n.look.el > 12); /* clear of the tree line (bug hunt 2026-10-17) */ if (sun) return { obj: sun.obj, look: sun.look, hint: 'Aim the phone, not your eyes.' };
  const moon = nat.find((n) => n.obj.key === 'moon' && n.look.visible && n.look.el > 12); if (moon) return { obj: moon.obj, look: moon.look, hint: 'Bright and easy to find.' };
  const best = nat.filter((n) => n.look.visible && n.look.el > 15 && (n.obj.type === 'planet' || n.obj.type === 'star')).sort((a, b) => a.look.mag - b.look.mag)[0];
  if (best) return { obj: best.obj, look: best.look, hint: 'That bright, steady light.' };
  const sat = (state.items ?? []).filter((a) => a.look.visible && a.look.el > 20).sort((a, b) => a.look.mag - b.look.mag)[0];
  if (sat) return { obj: sat.obj, look: sat.look, hint: 'A light moving steadily.' };
  // Around dusk nothing above may be high enough (first-run playtest 2026-10-25: from about 5 to 6:50 PM the tour named
  // nothing): a low Sun or Moon, then any visible planet, star or satellite, low over the trees.
  const lowSun = nat.find((n) => n.obj.key === 'sun' && n.look.visible && n.look.el > 3); if (lowSun) return { obj: lowSun.obj, look: lowSun.look, hint: 'It’s low now. Aim the phone, not your eyes.' };
  const lowMoon = nat.find((n) => n.obj.key === 'moon' && n.look.visible && n.look.el > 3); if (lowMoon) return { obj: lowMoon.obj, look: lowMoon.look, hint: 'It’s low, just over the trees.' };
  const low = [...nat.filter((n) => n.look.visible && n.look.el > 5 && (n.obj.type === 'planet' || n.obj.type === 'star')), ...(state.items ?? []).filter((a) => a.look.visible && a.look.el > 8)].sort((a, b) => (a.look.mag ?? 9) - (b.look.mag ?? 9))[0];
  return low ? { obj: low.obj, look: low.look, hint: 'It’s low, so look just over the trees.' } : null;
}
// After the tour, back on the sky: a one-time tip beside the radar, "Tap to see what’s up tonight" (2026-10-09,
// Sevaan). Waits 3 s (and for any patch moment or panel to clear), shows ~6 s with a soft pulse on the radar, then
// fades; tapping it opens Tonight. Once per device ('radarTip').
function radarTip(delay = 3000) {
  return; // retired 2026-10-21 (Sevaan): the Sky tab says what's up now
  try { if (localStorage.getItem('radarTip')) return; } catch {}
  setTimeout(() => {
    if (activePanel || !$('reveal').hidden || !$('ob-done').hidden || !$('recap').hidden || document.body.classList.contains('ob-tour') || document.querySelector('.set-sheet:not([hidden]), .patch-moment, .patch-coins, #toasts .ticket.in') || collectionOpen) { radarTip(1500); return; } // also any sheet (2026-10-13: it came up behind the reminder sheet) // one thing at a time (playtest 2026-10-09)
    try { localStorage.setItem('radarTip', '1'); } catch {}
    const r = $('radar').getBoundingClientRect(), tip = document.createElement('button');
    tip.type = 'button'; tip.className = 'radar-tip';
    tip.innerHTML = '<small>Tap the radar</small><b>See what’s up tonight</b>'; // no ✕ (2026-10-20: on Android it sat on the text) // two balanced lines, no orphan (2026-10-09)
    tip.style.left = `${Math.round(r.right + 10)}px`;
    const dial = ($('radar').querySelector('canvas') ?? $('radar')).getBoundingClientRect();
    document.body.append(tip); tip.style.top = `${Math.round(dial.top + dial.height / 2 - tip.offsetHeight / 2)}px`; /* centred on the dial (2026-10-16, Sevaan: it sat low) */ $('radar').classList.add('tip-pulse');
    requestAnimationFrame(() => tip.classList.add('in'));
    let gone = false;
    const hide = () => { if (gone) return; gone = true; tip.classList.remove('in'); $('radar').classList.remove('tip-pulse'); setTimeout(() => tip.remove(), 400); };
    tip.addEventListener('click', () => { hide(); showVTab('tonight'); openPanel('visible'); }); // "See what’s up tonight" opens Tonight (2026-10-12, Sevaan) // same as tapping the radar: the Now / Tonight panel
    $('radar').addEventListener('click', hide, { once: true }); // the radar itself opens the Now / Tonight panel
    // Without a ✕ it steps away by itself: when you start using the sky, or after 30 s on screen.
    $('sky').addEventListener('pointerdown', () => setTimeout(hide, 1500), { once: true }); setTimeout(hide, 30000);
    // Stays until used or closed (2026-10-11, Sevaan: "I don’t see it because it’s so fast"); steps aside for panels.
    const watch = setInterval(() => { if (gone) { clearInterval(watch); return; } tip.style.visibility = activePanel || collectionOpen || !$('reveal').hidden ? 'hidden' : ''; }, 400);
  }, delay);
}
// The Tonight page once a day (2026-10-09, Sevaan): the first time you open the app on a new day (not the first run,
// which ends on it anyway), once tonight’s plan is ready and nothing else is up. 'tonightDay' = the local date shown.
const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
function markTonightSeen() { try { localStorage.setItem('tonightDay', todayKey()); } catch {} }
// Asking for a review (2026-10-24, Sevaan; iOS only, Apple's own prompt, never our own pre-prompt). Only at calm good
// moments: the weekly recap closed, a milestone card put away, a card shared, the 5th/10th night by day. Never with
// something in the circle, a card/page/tour up, in red night mode, close to a pass, on a cloudy night, or in the dark
// outside. Gates: 3+ nights, 10+ cards, first sighting 4+ days ago, 60+ days since the last ask (Apple caps it at 3 a year).
let reviewAfterReveal = false;
function reviewReady() {
  const real = state.sightings.filter((s) => !s.sim);
  const cards = new Set(real.map((s) => s.cardKey)).size, nights = new Set(real.map((s) => nightKey(s.time, s.lon ?? 0))).size;
  const first = real.reduce((m, s) => Math.min(m, s.time), Infinity);
  let last = 0; try { last = +localStorage.getItem('reviewAsk') || 0; } catch {}
  return { ok: cards >= 10 && nights >= 3 && Date.now() - first >= 4 * 864e5 && Date.now() - last >= 60 * 864e5, nights };
}
function reviewCalm({ passes = true, owned = false, dark = false, circle = true } = {}) {
  const b = document.body.classList;
  if (activePanel || collectionOpen || !$('reveal').hidden || !$('recap').hidden || !$('ob-done').hidden || !$('start').hidden) return false;
  if (b.contains('night') || b.contains('ob-tour') || b.contains('calib') || document.querySelector('.set-sheet:not([hidden]), .patch-coins')) return false;
  if (circle && ((!$('discover').hidden && !(owned && $('discover').classList.contains('owned'))) || !$('plane').hidden || state.pinnedId)) return false; /* owned: still aimed at the card just put away is fine */
  if (dark && (state.frame?.sunEl ?? 0) < -6) return false; /* Apple's bright sheet: not in the dark outside */
  const t = now().getTime();
  try { if (passes && state.tonight && tonightPasses(state.tonight, t).some((p) => p.fresh && p.start > t - 5 * 60e3 && p.start < t + 20 * 60e3)) return false; } catch {}
  if (cloudAt?.(t)) return false;
  return true;
}
const reviewable = () => isNative() && globalThis.Capacitor?.getPlatform?.() === 'ios';
async function maybeAskReview(why, { force = false } = {}) {
  if (!isNative() || globalThis.Capacitor?.getPlatform?.() !== 'ios') { if (force) ticket({ kind: 'info', line: 'Reviews are asked in the iPhone app', ms: 2600 }); return false; }
  if (!force && (!reviewReady().ok || !reviewCalm({ owned: true, dark: true }) || sameDay(plusInviteInfo().at))) return false; /* one ask a day, review or Plus */
  try { localStorage.setItem('reviewAsk', String(Date.now())); localStorage.setItem('reviewWhy', why); } catch {}
  try { await plugin('Review')?.request(); return true; } catch { return false; }
}
// The 5th and 10th night: asked by day once the sky has settled (from quickStart).
function reviewOnNight(tries = 0) {
  let pend = ''; try { pend = localStorage.getItem('reviewPending') || ''; } catch {}
  if (pend && document.body.classList.contains('day')) { if (!reviewCalm()) { if (tries < 20) setTimeout(() => reviewOnNight(tries + 1), 6000); return; } maybeAskReview(pend).then((ok) => { if (ok || !reviewReady().ok) try { localStorage.removeItem('reviewPending'); } catch {} }); return; }
  const { ok, nights } = reviewReady(); if (!ok || ![5, 10].includes(nights)) return;
  let done = ''; try { done = localStorage.getItem('reviewNight') || ''; } catch {}
  if (done === String(nights) || !document.body.classList.contains('day')) return;
  if (!reviewCalm()) { if (tries < 20) setTimeout(() => reviewOnNight(tries + 1), 6000); return; }
  maybeAskReview(`night${nights}`).then((ok) => { if (ok) try { localStorage.setItem('reviewNight', String(nights)); } catch {} });
}
// After a card is put away: try for about a minute, from 4 s on, until the moment is calm (you're often still aimed at
// what you just caught). A review blocked only by the dark waits for the next daytime open (reviewPending).
function askSoon(why, n = 0) {
  setTimeout(async () => {
    if (await maybeAskReview(why)) return;
    if (n < 10) return askSoon(why, n + 1);
    if (reviewReady().ok && (state.frame?.sunEl ?? 0) < -6) try { localStorage.setItem('reviewPending', why); } catch {}
  }, n ? 6000 : 4000);
}
let inviteRun = 0; // one retry chain at a time: a later catch replaces the earlier one (web playtest 2026-10-24: three ran side by side)
function inviteSoon(g, n = 0, run = ++inviteRun) { setTimeout(() => { if (run !== inviteRun) return; if (!plusInvite(g) && n < 10 && !sameDay(plusInviteInfo().at)) inviteSoon(g, n + 1, run); }, n ? 6000 : 4000); }
// Plus invites (2026-10-24, Sevaan; design/plus-moments.html A): a notice that opens the Join the crew page with its
// reason, after a great night (5+ new cards, or a new Rare or better, from the 4th night on, once a night) or on the 7th
// night by day. At most every 14 days and three times ever; never the same day as a review ask; same calm rules; only
// where Plus can be bought (not Android yet; the website is the test build).
let plusAfterReveal = null, plusInviteLead = '';
const plusSellable = () => !isPlus() && !(isNative() && !storeOpen());
const sameDay = (t) => !!t && new Date(t).toDateString() === new Date().toDateString();
function plusInviteInfo() { try { return JSON.parse(localStorage.getItem('plusInvite') || '{}'); } catch { return {}; } }
const WORDS = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
function greatNight(model) {
  const real = state.sightings.filter((s) => !s.sim), k = nightKey(now().getTime(), state.observer.lon ?? 0), first = new Map();
  for (const s of real) { const c = String(s.cardKey); if (c.startsWith('story:')) continue; if (!first.has(c) || s.time < first.get(c)) first.set(c, s.time); } /* story cards are found, not caught */
  const n = [...first.values()].filter((t) => nightKey(t, state.observer.lon ?? 0) === k).length;
  let done = ''; try { done = localStorage.getItem('plusNight') || ''; } catch {}
  if (done === k) return null;
  const rare = !model.natural && !model.launches && (TIER_RANK[model.tier] ?? 0) >= 2;
  if (n < 5 && !rare) return null;
  const what = n >= 5 ? `${WORDS[n] ?? n} catches tonight` : `A new ${TIER_INFO[model.tier]?.label ?? 'Rare'} tonight`;
  return { night: k, eyebrow: what.toUpperCase(), line: 'Want a heads-up before the next good one?', lead: `${what}. Want a heads-up before the next good one?` };
}
function plusInvite(g) {
  const a = plusInviteInfo();
  if (!plusSellable() || reviewReady().nights < 4 || (a.n ?? 0) >= 3 || Date.now() - (a.at ?? 0) < 14 * 864e5) return false;
  let rv = 0; try { rv = +localStorage.getItem('reviewAsk') || 0; } catch {}
  if (sameDay(rv) || !reviewCalm({ passes: false, circle: false })) return false; /* a notice at the top doesn't need an empty circle (web playtest 2026-10-24: a star was nearly always in it at night) */ /* a notice doesn't block the sky, so a pass coming up is fine */
  try { localStorage.setItem('plusInvite', JSON.stringify({ at: Date.now(), n: (a.n ?? 0) + 1 })); if (g.night) localStorage.setItem('plusNight', g.night); } catch {}
  ticket({ kind: 'info', tone: 'orange', icon: 'star', eyebrow: g.eyebrow, line: g.line, go: 'Join the crew', sticky: true, unasked: true, id: 'plus-invite', action: () => { plusInviteLead = g.lead; openPlus('invite'); } });
  return true;
}
// The 7th night, by day once things settle (from quickStart). Reviews take the 5th and 10th.
function plusOnNight(tries = 0) {
  if (reviewReady().nights !== 7 || !plusSellable()) return;
  let done = ''; try { done = localStorage.getItem('plusSeventh') || ''; } catch {}
  if (done || !document.body.classList.contains('day')) return;
  if (!reviewCalm({ passes: false, circle: false })) { if (tries < 20) setTimeout(() => plusOnNight(tries + 1), 6000); return; }
  if (plusInvite({ eyebrow: 'SEVEN NIGHTS UNDER THE SKY', line: 'You’re one of us now', lead: 'Seven nights under the sky. You’re one of us now' })) try { localStorage.setItem('plusSeventh', '1'); } catch {}
}
// The Tonight page's Plus line names what's coming on a clear night with new Rares (or better) still ahead.
function setSkyPlusLine() {
  const l = $('sky-plus-line'); l.hidden = !plusSellable(); l.firstElementChild.innerHTML = ICON_BELL; if (l.hidden) return;
  let n = 0, mixed = false; const t = now().getTime(), tierN = (o) => TIER_RANK[(state.cardModels.get(cardKeyFor(o)) ?? o).tier] ?? 0;
  try { if (state.tonight && tonightWeather()?.ok !== false) { const eve = eveningEnd(state.tonight), keys = new Map(); for (const p of tonightPasses(state.tonight, t)) if (p.fresh && p.start > t + 10 * 60e3 && p.start <= eve && tierN(p.obj) >= 2) keys.set(cardKeyFor(p.obj), tierN(p.obj)); n = keys.size; mixed = new Set(keys.values()).size > 1 || [...keys.values()].some((v) => v > 2); } } catch {} /* the haul's window and tiers, so the numbers agree */
  const what = mixed ? `Rare${n === 1 ? '' : 's'} or better` : n === 1 ? 'Rare' : 'Rares';
  l.children[1].textContent = n >= 2 ? `${n} ${what} tonight · get a ping before each one` : n ? `A ${what === 'Rare' ? 'Rare' : 'Rare or better'} tonight · get a ping before it comes over` : 'Set reminders for passes with Space Collector Plus';
}
// Weekly recap (playtest 2026-10-09, #15): the first visit of a new week, if you observed last week, opens on a card
// summing it up: new cards, sightings, nights, XP, your rarest find, the streak, and what’s coming this week. Share it
// or swipe on. Once per week (localStorage recapWeek).
const weekStart = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime(); };
function weeklyRecap(tries = 0) {
  const daysBack = (t, n) => { const d = new Date(t); d.setDate(d.getDate() - n); return d.getTime(); }; // calendar days, right across a clock change (bug hunt 2026-10-20)
  const w0 = weekStart(now().getTime()), last = daysBack(w0, 7);
  let seen = null; try { seen = localStorage.getItem('recapWeek'); } catch { return; }
  if (seen === String(w0)) return;
  if (activePanel || collectionOpen || !$('reveal').hidden || document.body.classList.contains('ob-tour') || $('start').classList.contains('booting') || !$('ob-done').hidden || !state.cardModels?.size) {
    if (tries < 40) setTimeout(() => weeklyRecap(tries + 1), 500); return; }
  try { localStorage.setItem('recapWeek', String(w0)); } catch {}
  const real = state.sightings.filter((s) => !s.sim), week = real.filter((s) => s.time >= last && s.time < w0);
  if (new Set(week.map((s) => nightKey(s.time, s.lon ?? 0))).size < 2) return; // a one-night week isn’t much of a recap (playtest room 2026-10-11)
  const firstSeen = new Map(); for (const s of real) if (!firstSeen.has(s.cardKey) || s.time < firstSeen.get(s.cardKey)) firstSeen.set(s.cardKey, s.time);
  const fresh = [...firstSeen].filter(([, t]) => t >= last && t < w0).map(([k]) => state.cardModels.get(k)).filter(Boolean);
  const order = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
  // Rarest first; ties go to the night sky over the Sun, then to deep sky and planets over plain stars (the room’s
  // recap named the Sun, or a dim star over the Pleiades).
  const kindRank = (c) => (c?.type === 'sun' || c?.key === 'sun' ? -2 : c?.natural === 'deepsky' ? 2 : c?.type === 'planet' ? 1 : 0);
  const best = fresh.slice().sort((a, b) => order.indexOf(b.tier) - order.indexOf(a.tier) || kindRank(b) - kindRank(a))[0] ?? state.cardModels.get(week[0].cardKey); /* newest first, so week[0] is the last seen (bug hunt 2026-10-22) */
  const nights = new Set(week.map((s) => nightKey(s.time, s.lon ?? 0))).size;
  const xp = progressNow(real.filter((s) => s.time < w0)).xp - progressNow(real.filter((s) => s.time < last)).xp;
  const p = progressNow(real), streak = p.streak.current >= 2 ? `${p.streak.current}-week streak` : 'Week 1 of your streak';
  const ev = nextEvent(now().getTime()), fmtD = (t) => new Date(t).toLocaleDateString([], { day: 'numeric', month: 'short' });
  const tier = TIER_INFO[best?.tier] ?? TIER_INFO.common, img = best && artImage(best, 'small');
  const el = $('recap');
  // A real card (2026-10-12, Sevaan: "an actual card, not a square… tilt effects too"): card proportions, the retro
  // double frame, the rarest find in the art window, and the same tilt and glare as the cards.
  el.innerHTML = `<div class="rc-tilt"><div class="rc-card"><div class="rc-bar"><span>Your week</span><span>${fmtD(last)} – ${fmtD(daysBack(w0, 1))}</span></div>
    <div class="rc-big"><b>${fresh.length}</b><span>new card${fresh.length === 1 ? '' : 's'}</span></div>
    ${best ? `<div class="rc-win">${img ? `<img src="${img}" alt="">` : lockedArt(best, true, tier.color, 'small')}<div class="rc-cap"><small>${fresh.length ? 'Rarest find' : 'Last seen'}</small><b>${escapeHtml(label(best))}</b><em style="color:${tier.color}">${tier.gem} ${escapeHtml(tier.label)}</em></div></div>` : '<div class="rc-win rc-win--empty"></div>'}
    <div class="rc-stats"><div><b>${week.length}</b><span>sightings</span></div><div><b>${nights}</b><span>night${nights === 1 ? '' : 's'} out</span></div><div><b>+${xp.toLocaleString()}</b><span>XP</span></div></div>
    <div class="rc-foot"><span>${streak}</span>${ev ? `<span>Coming up: <b>${escapeHtml(ev.name.replace(/\s*\d{4}$/, ''))}</b> · ${fmtD(ev.day ?? ev.peak ?? ev.start)}</span>` : ''}</div>
    <div class="rc-glare" aria-hidden="true"></div></div></div>
    <div class="rc-actions"><button type="button" class="rc-share">Share my week</button><button type="button" class="rc-go">Explore the sky →</button></div>`;
  el.hidden = false; requestAnimationFrame(() => el.classList.add('in'));
  { const c = el.querySelector('.rc-card'); const t = attachTilt(c); try { attachGyro?.(c, t); } catch {} }
  const close = () => { el.classList.remove('in'); setTimeout(() => { el.hidden = true; }, 320); setTimeout(() => maybeAskReview('recap'), 2500); };
  el.querySelector('.rc-go').onclick = close;
  // A Plus line under the buttons on weeks the recap won't ask for a review (design/plus-moments.html, 2026-10-24).
  if (plusSellable() && reviewReady().nights >= 4 && !(reviewable() && reviewReady().ok)) { const a = document.createElement('button'); a.type = 'button'; a.className = 'rc-plus'; a.textContent = 'Put next week on your home screen · Plus ›'; a.onclick = () => { close(); setTimeout(() => openPlus('widgets'), 340); }; el.querySelector('.rc-actions').after(a); }
  el.querySelector('.rc-share').onclick = async () => {
    const text = `My week in Space Collector: ${fresh.length} new card${fresh.length === 1 ? '' : 's'}, ${week.length} sighting${week.length === 1 ? '' : 's'} over ${nights} night${nights === 1 ? '' : 's'}${best ? `. Rarest: ${label(best)} (${tier.label})` : ''}. https://spacecollector.app`;
    try { if (navigator.share) await navigator.share({ text }); else { await navigator.clipboard.writeText(text); toast('Copied. Paste it anywhere.', 2200); } } catch {}
  };
}
// ---------- Not tonight: the page for a night of bad weather (2026-10-11) ----------
// Collecting still works through a gap in the cloud (2026-10-12, Sevaan: "correct it"; the rooms caught cards through
// fog while this page said they couldn’t). So it never says you can’t: it says the sky is cloudy and gaps count.
const WX_WORD = { rain: 'Rain', snow: 'Snow', storm: 'Storms', fog: 'Fog', cloudy: 'Cloud' }, WX_ICON = Object.fromEntries(Object.entries({ clear: 'stars', mostly: 'cloud-part', cloudy: 'cloud', rain: 'rain', snow: 'snow', storm: 'storm', fog: 'fog' }).map(([k, v]) => [k, `<span class="ico" data-ico="${v}" aria-hidden="true"></span>`])); // line icons, not emoji (craft room 2026-10-12)
const isGoodNight = (n) => n.kind === 'clear' || n.kind === 'mostly';
// One later night run through the same planner as tonight (tonight-worker.js), for the next good night’s numbers.
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
    w.postMessage({ requestId: n, objects: toWorker(objects), observer: state.observer, startMs: nightNoon(n), sb: state.skySb, binoculars: state.binoculars, hours: 26, step: 120000 });
  }));
  return nightPlans.get(key);
}
function renderNotTonight(wx, T, t0) {
  const nights = wx.nights ?? [], next = nights.find((n) => n.n > 0 && isGoodNight(n));
  const dayName = (n) => (n.n === 1 ? 'Tomorrow' : new Date(n.t).toLocaleDateString([], { weekday: 'long' }));
  const short = (n) => (n.n === 0 ? 'TON' : new Date(n.t).toLocaleDateString([], { weekday: 'short' }).toUpperCase().slice(0, 3));
  const facts = [`${WX_WORD[wx.worst] ?? 'Cloud'} all night`, wx.temp != null ? (MILES ? `${Math.round(wx.temp * 9 / 5 + 32)}°F` : `${wx.temp}°C`) : '', wx.wind != null ? (MILES ? `wind ${Math.round(wx.wind * 0.621371)} mph` : `wind ${wx.wind} km/h`) : '' /* follows Units (web QA 2026-10-24) */].filter(Boolean).join(' · ');
  const passes = T ? tonightPasses(T, t0).filter((p) => p.start > t0) : [];
  const soon = passes.filter((p) => p.start <= t0 + 4 * 3600e3); // the evening, not 5 am
  // Rarest new cards first; Common and Uncommon only when that’s all that’s left (2026-10-12, Sevaan).
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
      <p class="nt-gap">Forecasts aren’t perfect. If you spot a gap, anything you can see still counts.</p></div>
    <div class="nt-week">${nights.map((n) => `<div class="${isGoodNight(n) ? 'ok' : ''}${n.n === 0 ? ' now' : ''}"><b>${short(n)}</b><i>${WX_ICON[n.kind] ?? WX_ICON.cloudy}</i><s><u style="height:${Math.max(6, n.cloud ?? 50)}%"></u></s></div>`).join('')}</div>
    <div class="nt-legend"><span>Bars show cloud after dark</span></div>
    ${next ? `<div class="nt-hero"><div class="nt-top"><span class="nt-k">Next good night</span><span class="nt-in">${next.n === 1 ? 'tomorrow' : `in ${next.n} days`}</span></div>
      <div class="nt-day">${escapeHtml(dayName(next))}</div><div class="nt-why" id="nt-why">${next.clearFrom ? `Clear from ${escapeHtml(fmtTime(next.clearFrom))}` : next.kind === 'clear' ? 'Clear all night' : 'Mostly clear'}</div>
      <div class="nt-stats"><div><b id="nt-passes">…</b><small>Passes</small></div><div><b id="nt-new">…</b><small>New to you</small></div><div><b id="nt-busy">…</b><small>Busiest</small></div></div>
      <button type="button" class="nt-bell" id="nt-remind"><span><span class="ico" data-ico="bell" aria-hidden="true"></span> Remind me ${escapeHtml(dayName(next))}</span><span aria-hidden="true">→</span></button></div>` : ''}
    ${above.length ? `<div class="nt-sec"><div class="nt-secrow"><span>Above the ${escapeHtml((WX_WORD[wx.worst] ?? 'cloud').toLowerCase())} tonight</span>${all > above.length ? `<button type="button" id="nt-all">All ${all} ›</button>` : ''}</div>
      ${above.map((p) => `<div class="nt-pass" role="button" tabindex="0" data-id="${p.obj.id}"><b>${escapeHtml(fmtTime(p.start).replace(/\s?[AP]\.?M\.?$/i, ''))}</b><span><i>${escapeHtml(label(p.obj))}</i><small>${p.peakEl >= 50 ? 'High' : p.peakEl >= 25 ? 'Well up' : 'Low'} in the ${compassPoint(p.peakAz)}${p.fresh ? ' · new to you' : ''}</small></span><em style="color:${tier(state.cardModels.get(cardKeyFor(p.obj)) ?? p.obj).color}">${tier(state.cardModels.get(cardKeyFor(p.obj)) ?? p.obj).gem} ${escapeHtml(tier(state.cardModels.get(cardKeyFor(p.obj)) ?? p.obj).label)}</em></div>`).join('')}
      <p class="nt-note">Hidden for now. Find a gap and you can still collect them.${next ? ` They’re back on a clear sky ${next.n === 1 ? 'tomorrow' : escapeHtml(dayName(next))}.` : ''}</p></div>` : ''}
    <div class="nt-sec"><div class="nt-secrow"><span>While you wait</span></div><div class="nt-tiles">
      <button type="button" class="nt-tile" id="nt-col"><span class="nt-ic"><span class="ico" data-ico="cards" aria-hidden="true"></span></span><b>Collection</b><small>${cards} card${cards === 1 ? '' : 's'}</small></button>
      <button type="button" class="nt-tile" id="nt-patch">${near ? `<span class="nt-ring" style="--f:${Math.round(near.f * 100)}%"></span><b>Patches</b><small>${escapeHtml(near.name)} ${Math.round(near.f * 100)}%</small>` : `<span class="nt-ic"><span class="ico" data-ico="patch" aria-hidden="true"></span></span><b>Patches</b><small>See them all</small>`}</button>
      ${next ? `<button type="button" class="nt-tile" id="nt-preview"><span class="nt-ic"><span class="ico" data-ico="stars" aria-hidden="true"></span></span><b>${escapeHtml(next.n === 1 ? 'Tomorrow' : new Date(next.t).toLocaleDateString([], { weekday: 'long' }))}’s sky</b><small>Preview it</small></button>` : ''}
    </div></div>`;
  const leave = () => hideDone();
  $('nt-col').onclick = () => { leave(); openCollection(); };
  $('od-body').querySelectorAll('.nt-pass[data-id]').forEach((r) => r.addEventListener('click', () => { const o = state.byId.get(Number(r.dataset.id)) ?? state.byId.get(r.dataset.id); if (o) showTonightCard(o, r.getBoundingClientRect(), 'ABOVE THE CLOUD'); })); // tap a row to preview its card
  $('nt-patch').onclick = () => { leave(); openCollection('patches'); };
  $('nt-all')?.addEventListener('click', () => { leave(); showVTab('tonight'); openPanel('visible'); });
  if (!next) return;
  let busiest = null;
  $('nt-remind').onclick = async () => { if (remindUndo($('nt-remind'))) return; const at = next.clearFrom ?? next.t; const r = await setReminder({ at, title: 'Tonight: clear skies ahead', body: 'The forecast looks good. See what’s passing over and plan a few catches.', key: 'clear-night' }); remindDone($('nt-remind'), reminderToast(r, at), at, 'clear-night'); };
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
    if (N.moonIllum != null) $('nt-why').textContent += ` · Moon ${Math.round(N.moonIllum * 100)}% full`;
  });
}
// Almost there (2026-10-25, Sevaan; design/come-back.html 01): a card you own that is one night from its next level (seen
// on 2 nights → Silver at 3, 9 → Gold at 10), not seen yet tonight, passing this evening on a clear sky, peaking 20°+.
// Satellites, stages and debris only (naturals don't level; fleets use stamps). One per card, soonest first.
function almostThere(T = state.tonight, t0 = now().getTime()) {
  if (!T) return [];
  const eve = eveningEnd(T), lon = state.observer.lon, tonight = nightKey(t0, lon), seen = new Map();
  for (const s of state.sightings) if (!s.sim) (seen.get(s.cardKey) ?? seen.set(s.cardKey, []).get(s.cardKey)).push(s);
  const out = [], used = new Set();
  for (const q of [...T.passes].sort((a, b) => a.start - b.start)) {
    if (q.start < t0 + 60e3 || q.start > eve || q.peakEl < 20 || cloudAt(q.start)) continue;
    const o = state.byId.get(q.id); if (!o || o.natural || o.family) continue;
    const key = cardKeyFor(o), ss = seen.get(key); if (!ss || used.has(key) || ss.some((s) => nightKey(s.time, s.lon) === tonight)) continue;
    const n = nightsIn(ss), to = n === 2 ? 'Silver' : n === 9 ? 'Gold' : null, lv = cardLevel(ss, cardModel(o));
    if (!to || (to === 'Silver' && lv !== 'bronze') || (to === 'Gold' && lv === 'gold')) continue; // an old legacy level may already be there
    used.add(key); out.push({ p: { ...q, obj: o }, to });
  }
  return out;
}
// Seasonal returns (2026-10-25, Sevaan; design/come-back.html 02). 1) A landmark constellation back in the evening sky:
// once a year each, the first evening every star of its figure is 10°+ up at 9:30 PM (and wasn't a week before), only
// while you still need some of its stars. 2) A big meteor shower a week ahead (Quadrantids, Perseids, Geminids).
const SEASON_CONS = ['Ori', 'Tau', 'Gem', 'Leo', 'Vir', 'Boo', 'Sco', 'Sgr', 'Lyr', 'Cyg', 'Aql', 'Peg'];
const BIG_SHOWERS = ['Quadrantids', 'Perseids', 'Geminids'];
let conStarV = null;
const at930 = (t) => { const d = new Date(t); d.setHours(21, 30, 0, 0); return d.getTime(); };
function conUpAt(con, t) { conStarV ??= new Map(CON_STARS.map((c) => [c.key, c.v])); const f = eqToEnu(new Date(t), state.observer); return con.stars.every((k) => { const v = conStarV.get(k); return v && Math.asin(Math.max(-1, Math.min(1, f(v)[2]))) * 180 / Math.PI > 10; }); }
function consBack(t = now().getTime()) {
  if (!CON_BY_ID.size || state.locationStatus === 'example') return [];
  refreshOwned(); const T930 = at930(t), out = [];
  for (const id of SEASON_CONS) { const c = CON_BY_ID.get(id); if (!c) continue; const need = c.stars.filter((k) => !ownedKeys.has(k)).length; if (!need) continue;
    if (conUpAt(c, T930) && !conUpAt(c, T930 - 7 * 864e5)) out.push({ c, need, have: c.stars.length - need }); }
  return out;
}
const showerSoon = (t = now().getTime()) => { const e = nextShower(t); if (!e || !BIG_SHOWERS.includes(e.shower)) return null; const night = new Date(e.peak - 864e5); night.setHours(20, 0, 0, 0); const days = Math.round((new Date(night).setHours(0, 0, 0, 0) - new Date(t).setHours(0, 0, 0, 0)) / 864e5); return days >= 1 && days <= 7 ? { e, days, night: night.getTime() } : null; };
function seasonNotice(tries = 0) {
  if (!CON_BY_ID.size || !state.tonight) { if (tries < 40) setTimeout(() => seasonNotice(tries + 1), 500); return; }
  if (!settledIn()) return;
  let seen = {}; try { seen = JSON.parse(localStorage.getItem('conBack') ?? '{}'); } catch {}
  const y = new Date(now()).getFullYear(), b = consBack().find((x) => seen[x.c.con] !== y); if (!b) return;
  const first = state.naturals?.find((n) => b.c.stars.includes(n.obj.key) && n.look.visible) ?? null;
  ticket({ kind: 'event', icon: 'sparkle', unasked: true, sticky: true, id: 'con-back', onShow: () => { seen[b.c.con] = y; try { localStorage.setItem('conBack', JSON.stringify(seen)); } catch {} }, eyebrow: 'Back in the evening sky', line: `${b.c.name} is back`, sub: `${b.c.data?.nick ? `${b.c.data.nick[0].toUpperCase()}${b.c.data.nick.slice(1)}, from ${fmtTime(at930(now().getTime()))}.` : `From ${fmtTime(at930(now().getTime()))}.`} ${b.have} of ${b.c.stars.length} stars found.`, ...(first ? { go: 'Show me', action: () => guideTo(first.obj, first.look) } : {}) });
}
// Themed weeks (2026-10-25, Sevaan; design/come-back.html 03). The week's theme comes from the rotation in js/progress.js;
// if this sky can't deliver it (no ISS or Tiangong pass in tonight's plan, fewer than three planets up at 9 PM), the next
// one in the rotation is chosen and kept for the week (localStorage weekThemes, backed up). One notice on the first open
// of the week; the Tonight page shows the week's card.
function chooseWeek() {
  const T = state.tonight; if (!T) return null;
  const ws = weekStartOf(now().getTime()), chosen = readWeekThemes(); if (chosen[ws]) return chosen[ws];
  const can = (th) => { if (th.id === 'stations') return [25544, 48274].every((id) => T.passes.some((q) => q.id === id));
    if (th.id === 'planets') { const d = new Date(now()); d.setHours(21, 0, 0, 0); const f = eqToEnu(d, state.observer); return solarSystem(d, state.observer).filter((b) => b.kind === 'planet' && b.mag <= 3 && Math.asin(Math.max(-1, Math.min(1, f(b.v)[2]))) * 180 / Math.PI > 10).length >= 3; }
    return true; };
  const i0 = WEEK_THEMES.indexOf(weekThemeOf(ws)); let pick = WEEK_THEMES[i0];
  for (let k = 0; k < WEEK_THEMES.length; k++) { const th = WEEK_THEMES[(i0 + k) % WEEK_THEMES.length]; if (can(th)) { pick = th; break; } }
  const keep = { ...chosen, [ws]: pick.id }; // never pruned: a past week's XP and badge depend on its theme (a few bytes a week)
  try { localStorage.setItem('weekThemes', JSON.stringify(keep)); } catch {}
  return pick.id;
}
const weekThemeOf = (ws) => weekThemeFor(ws, readWeekThemes());
// Observing nights still left in this week (it ends Monday noon): tonight if it's night now, plus each evening still to
// come. 0 on Monday morning, when the week's last night is over (flow playtest 2026-10-25: "by Sunday" on a Monday).
function weekNightsLeft(ws, t0) {
  const end = ws + 7 * 864e5 + 12 * 3600e3, h = new Date(t0).getHours(); let n = h >= 18 || h < 6 ? 1 : 0;
  const e = new Date(t0); e.setHours(18, 0, 0, 0); if (e.getTime() <= t0) e.setDate(e.getDate() + 1);
  while (e.getTime() < end) { n++; e.setDate(e.getDate() + 1); }
  return n;
}
function weekNotice(tries = 0) {
  if (!state.tonight) { if (tries < 40) setTimeout(() => weekNotice(tries + 1), 500); return; }
  if (!settledIn()) return;
  chooseWeek(); const ws = weekStartOf(now().getTime()); let seen = null; try { seen = localStorage.getItem('weekSeen'); } catch { return; }
  if (seen === String(ws) || !state.sightings.some((x) => !x.sim)) return; // not before the first card
  const th = weekThemeOf(ws), pr = progressNow(state.sightings).week; if (pr && pr.have >= pr.need) return;
  const nl = weekNightsLeft(ws, now().getTime()); if (!nl) return; // the week's last night is over: the new week's notice comes after noon
  ticket({ kind: 'event', icon: 'calendar', unasked: true, sticky: true, id: 'week', onShow: () => { try { localStorage.setItem('weekSeen', String(ws)); } catch {} }, eyebrow: 'This week', line: th.name, sub: `${th.text.replace(/\.$/, '')} ${nl === 1 ? 'tonight' : 'by Sunday night'}.`, go: 'See the week', action: () => openSky('tonight') });
}
function weekBox(T, t0) {
  const pr = progressNow(state.sightings).week; if (!pr) return null;
  const left = weekNightsLeft(pr.start, t0), wkEnd = pr.start + 7 * 864e5 + 12 * 3600e3; /* nights left; the week ends Monday noon */ if (!left) return null; const done = pr.have >= pr.need, el = document.createElement('div'); el.className = 'week-box';
  let tiles = '';
  if (pr.id === 'stages' && !done) { // countries: caught this week, or when one passes tonight
    const got = new Set(pr.sightings.filter((s) => s.info?.type === 'rocket-body').map((s) => countryOf(s.info.owner))), next = new Map();
    for (const q of [...T.passes].sort((a, b) => a.start - b.start)) { if (q.start < t0 || q.start >= wkEnd) continue; const o = state.byId.get(q.id); if (o?.type !== 'rocket-body') continue; const c = countryOf(o.owner); if (!next.has(c)) next.set(c, { q, o }); }
    const names = [...new Set([...got, ...next.keys()])].slice(0, 6);
    tiles = `<div class="wk-tiles">${names.map((c) => `<span class="${got.has(c) ? 'got' : ''}"><b>${escapeHtml(c)}</b><i>${got.has(c) ? '✓ Caught' : escapeHtml(fmtTime(next.get(c).q.start))}</i></span>`).join('')}</div>`;
  }
  el.innerHTML = `<span class="k">This week · ${left === 1 ? 'last night' : `${left} nights left`}</span><b>${escapeHtml(pr.name)}</b><i>${escapeHtml(pr.text)}</i><span class="wk-prog"><em style="--p:${(pr.have / pr.need * 100).toFixed(0)}%"></em>${done ? '✓ Done · +150 XP · week badge' : `${pr.have} of ${pr.need} · +150 XP · week badge`}</span>${tiles}`;
  return el;
}
// Starlink trains (2026-10-25, Sevaan; design/come-back.html 04): for about two weeks after a launch a new Starlink batch
// flies in a line, bunched up and bright. A launch counts as a train while it's under 14 days old with 5+ satellites;
// tonight's train is its first evening pass where 5+ of them rise within 6 minutes. Catching any one of them stamps the
// launch "caught as a train" (sighting.train), with a reveal chip, a mark on its dot, and the Choo Choo patch after five.
const TRAIN_DAYS = 14;
let trainCount = null;
function trainOf(o, t = now().getTime()) {
  if (o?.family !== 'STARLINK' || !o.launch || !o.card) return null;
  const age = (t - Date.parse(`${o.launch}T12:00:00Z`)) / 864e5; if (!(age >= 0 && age <= TRAIN_DAYS)) return null;
  if (!trainCount) { trainCount = new Map(); for (const x of state.catalog?.objects ?? []) if (x.family === 'STARLINK' && x.card) trainCount.set(x.card, (trainCount.get(x.card) ?? 0) + 1); }
  const n = trainCount.get(o.card) ?? 0; return n >= 5 ? { key: o.card, n, days: Math.floor(age), launch: o.launch } : null;
}
function tonightTrains(T, t0 = now().getTime()) {
  if (!T) return [];
  // Worked out once per plan, from all its passes (returning playtest 2026-10-25: the box and the ticket counted the same
  // train from different moments, 8 vs 7); callers get the ones not over yet.
  if (!T._trains) {
    const by = new Map();
    for (const q of T.passes) { const o = state.byId.get(q.id), tr = trainOf(o, q.start); if (!tr) continue; (by.get(tr.key) ?? by.set(tr.key, { tr, ps: [] }).get(tr.key)).ps.push({ ...q, obj: o }); }
    T._trains = [];
    for (const { tr, ps } of by.values()) { ps.sort((a, b) => a.start - b.start);
      for (const p of ps) { const c = ps.filter((x) => x.start >= p.start && x.start <= p.start + 6 * 60e3); if (c.length >= 5) { T._trains.push({ ...tr, first: p, count: c.length, start: p.start, end: Math.max(...c.map((x) => x.end)) }); break; } } }
    T._trains.sort((a, b) => a.start - b.start);
  }
  return T._trains.filter((x) => x.end >= t0);
}
// Is this object, at time t, actually flying in its launch's train (its pass starts inside the cluster)? Not just any
// member of a fresh launch (bug hunt 2026-10-25: a lone one days later was "caught as a train").
function trainHere(o, t) { const tr = trainOf(o, t); if (!tr || !state.tonight) return null;
  const c = tonightTrains(state.tonight, t - 20 * 60e3).find((x) => x.key === tr.key); if (!c) return null;
  const q = state.tonight.passes.find((x) => x.id === o.id && t >= x.start - 60e3 && t <= x.end + 60e3); return q && q.start >= c.start - 60e3 && q.start <= c.start + 6 * 60e3 ? c : null; }
const trainWords = (tr) => `${tr.count} satellites in a line, launched ${tr.days === 0 ? 'today' : tr.days === 1 ? 'yesterday' : `${tr.days} days ago`}`;
// The birthday satellite was removed (2026-10-25, Sevaan: "Remove the whole your birthday thing"); its saved date is cleared once.
try { localStorage.removeItem('birthday'); localStorage.removeItem('bdayTold2'); localStorage.removeItem('bdayTold'); } catch {}
// The in-app notice: once a day, on the first open before the pass.
function almostNotice(tries = 0) {
  if (!state.tonight) { if (tries < 40) setTimeout(() => almostNotice(tries + 1), 500); return; }
  let day = null; try { day = localStorage.getItem('almostDay'); } catch { return; }
  if (day === todayKey()) return;
  const a = almostThere()[0]; if (!a) return;
  const p = a.p;
  ticket({ kind: 'info', tone: 'steel', icon: 'star', unasked: true, sticky: true, id: 'almost', onShow: () => { try { localStorage.setItem('almostDay', todayKey()); } catch {} }, eyebrow: `One night from ${a.to}`, line: `${widgetName(p.obj)} passes at ${fmtTime(p.start)}`, sub: `See it tonight and its card turns ${a.to.toLowerCase()}. ${whereWords({ el: p.peakEl, az: p.peakAz })}.`, go: 'Show me', action: () => showMePass(p) });
}
function dailyTonight(tries = 0) {
  // No daily TONIGHT notice any more (2026-10-24, Sevaan): Tonight is a tab in the bar, so the banner and its tucked
  // chip only repeated it. The day is still marked seen, so nothing else waits on it.
  let seen = null; try { seen = localStorage.getItem('tonightDay'); } catch { return; }
  if (seen === todayKey()) return;
  if (!state.tonight) { if (tries < 40) setTimeout(() => dailyTonight(tries + 1), 500); return; }
  markTonightSeen();
}
// The Tonight page slides down and away (UX room 2026-10-12: it cut straight to the sky); it slides up on the way in (CSS).
// The Tonight page’s ✕ (2026-10-18, Sevaan: like Settings): the same as Explore the sky, whichever way the page was opened.
$('od-close').addEventListener('click', () => $('ob-explore').click());
addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('ob-done').hidden && !$('onboard').hidden && !document.querySelector('.set-sheet:not([hidden])')) $('od-close').click(); }); /* a sheet over it (Plus) closes first */ // like Settings (2026-10-18 playtest)
// The patches held back from the first catch roll in one at a time, once the first card’s moment is over.
function releaseLaterPatches() {
  let ids = []; try { ids = JSON.parse(localStorage.getItem('patchLater') || '[]'); localStorage.removeItem('patchLater'); } catch {}
  if (!ids.length) return;
  const all = progressNow(state.sightings).achievements; for (const id of ids) { const a = all.find((x) => x.id === id && x.done); if (a) earnPatch(a); }
}
function hideDone() {
  clearInterval(odNowTimer); clearTimeout(odFuseT); // the NOW line stops with the page
  const ob = $('onboard'), done = $('ob-done'), go = () => { ob.hidden = true; done.hidden = true; ob.style.opacity = ''; setTimeout(releaseLaterPatches, 1500); if (colAfterTour != null) { const k = colAfterTour === '#' ? '' : colAfterTour; colAfterTour = null; setTimeout(() => openCollection(k), 250); } };
  if (done.hidden || matchMedia('(prefers-reduced-motion: reduce)').matches) { go(); return; }
  ob.style.pointerEvents = 'none';
  done.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(6%)', opacity: 0 }], { duration: 280, easing: 'cubic-bezier(.4,0,.8,.6)' }).finished.then(go, go).finally(() => { ob.style.pointerEvents = ''; });
}
// Tonight lights like a fuse (2026-10-21, slick idea 16): a spark runs down the timeline lighting each time as it passes;
// then a small orange NOW line settles where you are in the evening and creeps down with the clock.
let odNowTimer = 0, odFuseT = 0;
function odFuse(tl) {
  clearInterval(odNowTimer); clearTimeout(odFuseT); if (!tl) return;
  const rows = [...tl.querySelectorAll('.it')], reduced = matchMedia('(prefers-reduced-motion: reduce)').matches, step = rows.length <= 5 ? 260 : 200; // starts once the page has slid in
  const placeNow = () => {
    if (!tl.isConnected || $('ob-done').hidden) return; // the page is closed (its timer is cleared by the next open or hideDone)
    const t = now().getTime(), ts = rows.map((r) => Number(r.dataset.t)); let y = null;
    for (let i = 0; i < rows.length; i++) { if (t < ts[i]) { y = rows[i].offsetTop - 10; break; } } // between the rows, never through one (playtest 2026-10-21)
    let line = tl.querySelector('.od-now');
    if (y == null) { line?.remove(); return; }
    if (!line) { line = document.createElement('div'); line.className = 'od-now'; line.innerHTML = '<span>Now</span>'; tl.append(line); }
    line.style.top = `${Math.round(y)}px`;
  };
  if (reduced || !rows.length) { placeNow(); odNowTimer = setInterval(placeNow, 30000); return; }
  tl.classList.add('fuse'); rows.forEach((r, i) => r.style.setProperty('--d', `${500 + i * step}ms`));
  const spark = document.createElement('i'); spark.className = 'od-spark'; tl.append(spark);
  requestAnimationFrame(() => { const end = rows.at(-1).offsetTop + 8; spark.animate([{ top: '6px', opacity: 1 }, { top: `${end}px`, opacity: 1, offset: .95 }, { top: `${end}px`, opacity: 0 }], { duration: rows.length * step, delay: 500, easing: 'linear', fill: 'both' }).finished.then(() => spark.remove(), () => spark.remove()); });
  odFuseT = setTimeout(() => { placeNow(); tl.querySelector('.od-now')?.classList.add('in'); odNowTimer = setInterval(placeNow, 30000); }, 500 + rows.length * step + 150);
}
function obFinish(caught) {
  if (caught) note('tour', { s: 'done', where: state.tourWhere ?? '' });
  setTimeout(warnExample, 1500); // the sky is someone else’s until you share a location
  if (caught) markTonightSeen();
  $('sky').classList.remove('asleep'); // never leave the sky asleep (a skip mid-tour)
  // Let go of the tour’s target (2026-10-09, Sevaan: Vega stayed selected with View card while pointing elsewhere).
  state.pinnedId = null; state.targetId = null; state.guidePass = null; state.sticky.clear();
  writePref('tourDone', true); // finished or skipped: a relaunch won't run it again
  const ob = $('onboard'); ob.style.pointerEvents = ''; onboarding = null; document.body.classList.remove('ob-tour'); state.tourCatchId = null; state.tourRevealed = false; $('ob-deck').replaceChildren(); $('ob-pips').hidden = false;
  if (!caught) { ob.hidden = true; return; }
  const T = state.tonight, t0 = now().getTime(), wx = tonightWeather();
  const eve = eveningEnd(T);
  const peak = T ? T.curve.filter(([t]) => t >= t0 && t <= eve).reduce((a, c) => (c[1] > a[1] ? c : a), [0, 0]) : null;
  const best = T ? (tonightPasses(T, t0).find((p) => p.fresh && p.start > t0 && p.start <= eve) ?? tonightPasses(T, t0).find((p) => p.start > t0 && p.start <= eve)) : null;
  // The page by weather (2026-10-08, design/tonight-weather.html): clear · clearing later · clouding over · bad.
  // Clearing only after the evening is over counts as a bad night (a 6 AM "Clear by" helped nobody).
  const kase0 = wx?.kase === 'clearing' && wx.clearFrom > eve ? 'bad' : wx?.kase ?? 'clear';
  // Cloud already here (web playtest 2026-10-22: "go before 8:00 PM" at 8:30): the window has passed, so it's a clearing
  // later tonight if one is coming, else a cloudy night.
  // A clearing whose time has already come is a clear night now (iOS QA 2026-10-23: "Clear by 8:00 PM" at 11:35 PM).
  const kase = kase0 === 'clearing' && wx.clearFrom <= t0 ? 'clear' : kase0 === 'closing' && wx.coverFrom <= t0 ? (wx.clearFrom > t0 && wx.clearFrom <= eve ? 'clearing' : 'bad') : kase0, dusk = T?.dusk && T.dusk > t0 ? T.dusk : t0, dawn = T?.dawn ? Math.min(T.dawn, eve) : (Number.isFinite(eve) ? eve : null);
  const passes = T ? tonightPasses(T, t0).filter((p) => p.start > t0 && p.start <= eve) : [];
  const after = (t) => passes.filter((p) => p.start >= t), before = (t) => passes.filter((p) => p.start < t);
  // The rarest new card, earliest first; Common and Uncommon only when nothing rarer is up (2026-10-12, Sevaan: "Breeze-M
  // Debris. What rarity is that? No common or uncommon cards should be here unless they are all that is left").
  const tierOf = (p) => TIER_RANK[(state.cardModels.get(cardKeyFor(p.obj)) ?? p.obj).tier] ?? 0;
  const pickBest = (list) => { const fresh = list.filter((p) => p.fresh), big = fresh.filter((p) => tierOf(p) >= 2); const pool = big.length ? big : fresh; return pool.slice().sort((a, b) => tierOf(b) - tierOf(a) || a.start - b.start)[0] ?? list[0] ?? null; };
  const peakIn = (s, e) => (T ? T.curve.filter(([t]) => t >= s && t <= e).reduce((a, c) => (c[1] > a[1] ? c : a), [0, 0]) : [0, 0]);
  // The name goes to Explore aimed at the pass (Show me); the line says its rarity and where to look in words.
  const passLine = (p) => { const t = TIER_INFO[(state.cardModels.get(cardKeyFor(p.obj)) ?? p.obj).tier] ?? TIER_INFO.common;
    return `<button type="button" class="od-pass" data-id="${p.obj.id}"><em>${escapeHtml(label(p.obj))}</em></button>&nbsp;· <b class="od-tier" style="color:${t.color}">${t.gem} ${t.label}</b>&nbsp;· ${whereWords({ el: p.peakEl, az: p.peakAz }).toLowerCase()}${p.fresh ? '&nbsp;· new to you' : ''}`; }; // a line never starts with "·" (iOS playtest 2026-10-19)
  let items = [], chosen = null;
  const done = $('ob-done'); done.className = `ob-done wx-${kase}`;
  // Twinkling, like the stars behind a card (2026-10-18, Sevaan; css/ui.css .starfield), thinning out down the page.
  let sky = `<div class="od-stars starfield">${Array.from({ length: kase === 'bad' ? 0 : 54 }, () => { const big = Math.random() < 0.15; return `<i style="left:${(Math.random() * 100).toFixed(1)}%;top:${(Math.random() ** 1.6 * 70).toFixed(1)}%;--s:${big ? 2.2 : (1 + Math.random()).toFixed(2)}px;--d:${(Math.random() * 6).toFixed(2)}s;--t:${(3 + Math.random() * 4).toFixed(2)}s;--o:${(0.35 + Math.random() * 0.5).toFixed(2)}"></i>`; }).join('')}</div>`;
  if (kase === 'clearing') {
    chosen = pickBest(after(wx.clearFrom)); const pk = peakIn(wx.clearFrom, dawn ?? Infinity);
    items = [[dusk, 'Dark, but cloudy', 'cloud'], [wx.clearFrom, 'Clouds part'], ...(chosen ? [[chosen.start, passLine(chosen), 'hot']] : []), ...(pk[1] >= 3 ? [[pk[0], `${new Date(pk[0]).getHours() < 12 ? 'Busiest before dawn' : 'Busiest this evening'}: ${upOnce(pk[1])}`]] : [])];
    if (wx.clearFrom - dusk > 90 * 60e3) items.splice(1, 0, [dusk + (wx.clearFrom - dusk) / 2, 'Still covered', 'cloud']);
    $('od-eyebrow').textContent = 'Worth the wait'; $('ob-done-title').innerHTML = `Clear<br>by ${escapeHtml(fmtTime(wx.clearFrom))}.`; $('od-sub').textContent = `Cloudy at dusk · clearing from ${fmtTime(wx.clearFrom)}`;
    sky += cloudsHtml(0.75);
  } else if (kase === 'closing') {
    const win = before(wx.coverFrom); chosen = pickBest(win); const last = win[win.length - 1];
    // Words that fit the window (iOS playtest 2026-10-19: "a short window" for 7 clear hours, "dark enough to start" after dark,
    // and "last good pass before the cloud" when the plan just ended at midnight, hours before the cloud).
    const darkNow = !(T?.dusk && T.dusk > t0), hours = (wx.coverFrom - Math.max(dusk, t0)) / 3.6e6, lastBeforeCloud = last && wx.coverFrom - last.end < 45 * 60e3;
    items = [[dusk, darkNow ? "It’s dark: go now" : 'Dark enough to start'], ...(chosen ? [[chosen.start, passLine(chosen), 'hot']] : []), ...(last && last !== chosen ? [[last.start, lastBeforeCloud ? 'Last good pass before the cloud' : "Last pass on tonight’s plan"]] : []), [wx.coverFrom, 'Clouding over', 'cloud']];
    $('od-eyebrow').textContent = hours < 2.5 ? 'Go early' : 'Clear tonight'; $('ob-done-title').innerHTML = `Clear until<br>${escapeHtml(fmtTime(wx.coverFrom))}.`;
    $('od-sub').textContent = hours < 2.5 ? `A short window · go before ${fmtTime(wx.coverFrom)}` : `Clear for ${Math.round(hours)} hours · cloud after ${fmtTime(wx.coverFrom)}`;
    sky += cloudsHtml(0.55, { side: 'right' });
  } else if (kase === 'bad') {
    // Not tonight (2026-10-11, Sevaan; design/not-tonight-combined.html: "all four in one"). One scrolling page: the
    // week’s cloud, the next good night with its numbers and the reminder, what’s passing above the cloud tonight,
    // and things to do now. Explore stays pinned at the bottom. Opened from the Tonight ticket, never on its own.
    sky += cloudsHtml(1, { dark: true }) + (['rain', 'storm'].includes(wx.worst) ? rainHtml() : '');
    $('od-sky').innerHTML = sky;
    renderNotTonight(wx, T, t0);
    $('ob-remind').hidden = true;
    $('ob-explore').firstElementChild.textContent = colAfterTour != null ? 'See your card' : 'Explore the sky anyway'; /* View in collection was tapped: this button opens it (web playtest 2026-10-22) */
    $('ob-explore').onclick = () => { hideDone(); radarTip(); };
    $('ob-done').hidden = false;
    return;
  } else {
    chosen = pickBest(passes); const pk = peakIn(t0, dawn ?? Infinity); // rarest new card first, as in the other cases
    items = [[dusk, T?.dusk && T.dusk > t0 ? 'Dark enough to start' : "It’s dark: go now"], ...(chosen ? [[chosen.start, passLine(chosen), 'hot']] : []), ...(pk[1] >= 3 ? [[pk[0], `${new Date(pk[0]).getHours() < 12 ? 'Busiest before dawn' : 'Busiest this evening'}: ${upOnce(pk[1])}`]] : []), ...(dawn ? [[dawn, T?.dawn && dawn < T.dawn ? 'The evening plan ends here' : 'Dawn: the sky closes']] : [])];
    $('od-eyebrow').textContent = "You’re set"; $('ob-done-title').innerHTML = 'Tonight<br>looks good.'; $('od-sub').textContent = `${wx ? wx.line : 'Clear skies'}${pk[1] >= 3 ? ` · ${pk[1]} objects at the peak` : ''}`;
    // Late, with no satellite passing in the window (2026-10-18, Sevaan: at 11:31 PM the page said only "go now" and
    // "the evening plan ends here"): satellites are in Earth’s shadow, so say that, name when they come back before
    // dawn, and run the timeline to dawn.
    // Minutes before dawn (2026-10-18 playtest: "Tonight looks good" with 20 minutes left).
    if (T?.dawn && T.dawn - t0 < 100 * 60000 && new Date(t0).getHours() < 12) { /* within 100 minutes of dawn, before noon (first-run playtest 2026-10-25) */ $('od-eyebrow').textContent = 'Almost dawn'; $('ob-done-title').innerHTML = 'Dawn is<br>close.'; $('od-sub').textContent = `The sky closes at ${fmtTime(T.dawn)}`; }
    if (!chosen && T) {
      const back = tonightPasses(T, t0).find((p) => p.start > t0 && (!T.dawn || p.start < T.dawn));
      chosen = back ?? null;
      items = [[t0, 'Stars, planets and the Moon are up'], ...(back ? [[back.start, `Satellites are back: ${passLine(back)}`, 'hot']] : []), ...(T.dawn ? [[T.dawn, 'Dawn: the sky closes']] : [])];
      { const hh = new Date(t0).getHours(); $('od-eyebrow').textContent = hh >= 23 || hh < 12 ? 'Late night' : 'Quiet overhead'; } $('ob-done-title').innerHTML = 'Tonight is<br>for stars.'; /* not "Late night" at 9:30 PM (flow playtest 2026-10-25) */
      $('od-sub').textContent = back ? `Satellites are in Earth’s shadow until ${fmtTime(back.start)}` : "Satellites are in Earth’s shadow until morning";
    }
  }
  // Day one ends with an appointment (2026-10-25, Sevaan; design/first-night.html 02): a first catch made before dark
  // leads with one concrete plan: tonight's Space Station pass (its reminders are free), else tonight's headliner (the
  // free Catch of the day notification). One headline, one picture, one button; dark and the busiest moment underneath.
  const appt = T?.dusk && T.dusk - t0 > 20 * 60e3 && ['ready', 'stale', 'manual'].includes(state.locationStatus) /* not from the time-zone city's sky: the minutes could be off (flow playtest 2026-10-25) */ ? (() => {
    const ok = (p) => p.start - 15 * 60e3 > t0 && (kase !== 'clearing' || p.start >= wx.clearFrom) && (kase !== 'closing' || p.start < wx.coverFrom);
    const iss = passes.find((p) => p.obj.id === 25544 && ok(p)); if (iss) return { p: iss, iss: true };
    const h = headliner(T); return h && ok(h) ? { p: h, iss: false } : null;
  })() : null;
  if (appt) {
    const apptWhere = (q) => { const up = q.peakEl >= 60 ? 'climbs high' : q.peakEl >= 30 ? 'climbs halfway up' : 'stays low', r = dirWord(q.riseAz), k = dirWord(q.peakAz);
      return r === k ? `Rises in the ${r} and ${up}` : `Rises in the ${r}, ${up} in the ${k}`; };
    const p = appt.p, m = cardModel(p.obj), ti = TIER_INFO[m.tier] ?? TIER_INFO.common, left = p.start - t0, mins = Math.round(left / 60e3), hh = Math.floor(mins / 60), mm = mins % 60; /* never "2 h 60 min" */
    const first = state.sightings.find((x) => !x.sim), fm = first && state.cardModels.get(first.cardKey);
    const nm = label(p.obj), the = ['station', 'rocket-body', 'debris'].includes(p.obj.type) && !/^the /i.test(nm) ? 'The ' : ''; // "for the SL-8 Rocket Stage" (first-run playtest 2026-10-25)
    let img = ''; try { img = artImage(m, 'small') ?? ''; } catch {}
    const frac = Math.max(0.04, Math.min(1, 1 - left / (6 * 3600e3)));
    $('od-eyebrow').textContent = state.sightings.filter((x) => !x.sim).length > 1 ? 'Tonight' : fm ? `Your first card · ${label(fm)}` : 'Your first card'; // a replay isn't a first card
    const when = escapeHtml(fmtTime(p.start).replace(' ', '\u00a0')), whereT = state.tourWhere; // said for where you are (2026-10-25, design/tour-rethink.html 02, 04)
    $('ob-done-title').innerHTML = whereT === 'inside' ? `Head out at ${when} for ${escapeHtml((the + nm).replace(/^The /, 'the '))}.` : whereT === 'outside' ? `The stars come out at ${escapeHtml(fmtTime(T.dusk).replace(' ', '\u00a0'))}.` : `${escapeHtml(the + nm)} passes over you tonight at ${when}.`; $('ob-done-title').classList.add('appt');
    // No promise before the button is tapped (first-run playtest 2026-10-25).
    $('od-sub').textContent = whereT === 'inside' ? `It’s dark from ${fmtTime(T.dusk)}. Tap below and we’ll tell you when to step outside.` : whereT === 'outside' ? `${(the + nm)} passes at ${fmtTime(p.start)}. Come back then, and tap below for a nudge.` : 'Tap below and we’ll tell you when to look up.';
    const pk = peakIn(t0, dawn ?? Infinity);
    items = [[dusk, 'Dark'], [p.start, nm], ...(pk[1] >= 3 ? [[pk[0], `Busiest · ${pk[1]} up at once`]] : [])]; // the appointment itself is on the timeline too
    chosen = p;
    $('od-sky').innerHTML = sky; items.sort((a, b) => a[0] - b[0]);
    $('od-body').innerHTML = `<div class="od-appt"><span class="od-ring" style="--f:${frac.toFixed(3)};--tier:${ti.color}">${img ? `<img src="${escapeHtml(img)}" alt="" decoding="async">` : ''}</span><span class="od-appt-t"><small style="color:${ti.color}">${ti.gem} ${escapeHtml(ti.label)} · in ${hh ? `${hh} h ` : ''}${mm} min</small><b>${escapeHtml(nm)}</b><span>${escapeHtml(apptWhere(p))}</span><i>${appt.iss ? 'Reminders for it are free' : `Tonight’s headliner · +${headlinerXp(p.obj)} XP`} /* one name everywhere (flow playtest 2026-10-25) */</i></span></div><div class="od-tl small">${items.map(([t, s2]) => `<div class="it"><b>${escapeHtml(fmtTime(t).replace(/\s?[AP]\.?M\.?$/i, ''))}</b><span>${escapeHtml(s2)}</span></div>`).join('')}</div>`;
    const at = p.start - remindLead() * 60e3, rb = $('ob-remind'), k = `${p.obj.id}@${p.start}`;
    freeKey(k); // this page’s reminder is free, the headliner too (2026-10-25, Sevaan)
    rb.hidden = false; rb.disabled = false; rb.classList.remove('done', 'needs-plus'); delete rb.dataset.idle; delete rb.dataset.side; if (rb.children[1]) rb.children[1].textContent = '→';
    rb.firstElementChild.textContent = `Remind me at ${fmtTime(at)}`; /* one wording for this button everywhere (flow playtest 2026-10-25) */
    rb.onclick = async () => {
      if (rb.classList.contains('done')) { remindUndo(rb); return; }
      let ok;
      ok = await remindPass(p, k); if (ok) reminded.add(k); remindDone(rb, ok, at, k);
      if (ok) { rb.firstElementChild.innerHTML = `<span class="ico" data-ico="bell" aria-hidden="true"></span> We’ll tell you at ${escapeHtml(fmtTime(at))}`; note('tour', { s: 'remind' }); }
    };
    $('ob-explore').firstElementChild.textContent = colAfterTour != null ? 'See your card' : 'Explore the sky';
    $('ob-explore').onclick = () => { hideDone(); radarTip(); };
    $('ob-done').hidden = false;
    return;
  }
  $('ob-done-title').classList.remove('appt');
  if (state.tourWhere === 'inside' && kase !== 'bad' && !(T?.dusk && T.dusk > t0)) $('od-sub').textContent = 'It’s dark out now. Step outside and the circle will show you more.'; // inside at night (design/tour-rethink.html 02)
  $('od-sky').innerHTML = sky;
  items.sort((a, b) => a[0] - b[0]);
  $('od-body').innerHTML = `<div class="od-tl">${items.map(([t, s, c]) => `<div class="it ${c ?? ''}" data-t="${t}"><b>${escapeHtml(fmtTime(t).replace(/\s?[AP]\.?M\.?$/i, ''))}</b><span>${s}</span></div>`).join('')}</div>`;
  odFuse($('od-body').querySelector('.od-tl'));
  // Tap the pass’s name: off to Explore, aimed at where it will be (2026-10-17, Sevaan), like every other Show me.
  $('od-body').querySelectorAll('.od-pass').forEach((b) => b.addEventListener('click', () => { if (!chosen || String(chosen.obj.id) !== b.dataset.id) return; flyToCircle(b); hideDone(); showMePass(chosen); }));
  // Tonight’s missions under the timeline (2026-10-09, Sevaan; design/tonight-missions.html A): the same three nightly
  // missions as the rank card, with the ones already done crossed out.
  // The sky challenge counts here too, as on the Tonight tab (Sevaan 2026-10-22: one said 2 / 3, the other 0 of 4).
  { const pr = progressNow(state.sightings), ms = [...(pr.missions ?? []), ...(pr.challenge ? [{ ...pr.challenge, ch: true }] : [])], done = ms.filter((m) => m.done).length;
    if (ms.length) $('od-body').insertAdjacentHTML('beforeend', `<div class="od-missions"><div class="od-mhead"><span>Tonight’s missions</span><span>${done} of ${ms.length} · +50 XP each</span></div>${ms.map((m) => `<div class="od-m${m.done ? ' done' : ''}"><i></i>${escapeHtml(m.text)}${m.ch ? ' <small class="od-ch">Sky challenge</small>' : ''}</div>`).join('')}</div>`); }
  const best2 = chosen;
  // Only offer a reminder that’s still ahead (2026-10-09 tour test: "Remind me at 7:36" showed at 7:46 for a pass up now).
  const remindable = best2 && best2.start - 10 * 60e3 > now().getTime() + 60e3;
  const rb = $('ob-remind'); rb.disabled = false; rb.classList.remove('done'); delete rb.dataset.idle; delete rb.dataset.side; if (rb.children[1]) rb.children[1].textContent = '→';
  if (remindable) freeKey(`${best2.obj.id}@${best2.start}`); // the first night's reminder is free, like the appointment's (flow playtest 2026-10-25: a Plus upsell on day one)
  rb.hidden = !remindable; if (remindable) rb.firstElementChild.textContent = `Remind me at ${fmtTime(best2.start - 10 * 60e3)}` /* with AM/PM: 5:51 could be either (iOS QA 2026-10-23) */;
  rb.classList.toggle('needs-plus', !!remindable && !!needsPlus(`${best2.obj.id}@${best2.start}`)); // say it's Plus before the tap (iOS playtest 2026-10-20)
  // The button answers for itself (2026-10-12, Sevaan: "tapping the reminder button does nothing"; the confirming toast
  // waits behind this page, so there was no sign it worked).
  $('ob-remind').onclick = async () => { if (!remindable || remindUndo($('ob-remind'))) return; const k = `${best2.obj.id}@${best2.start}`; const ok = await remindPass(best2, k); if (ok) reminded.add(k); remindDone($('ob-remind'), ok, best2.start - 10 * 60e3, k); };
  $('ob-explore').firstElementChild.textContent = colAfterTour != null ? 'See your card' : 'Explore the sky';
  $('ob-explore').onclick = () => { hideDone(); radarTip(); };
  $('ob-done').hidden = false;
}

// Returning users skip the start screen and go straight to the sky. iPhones only allow motion
// access from a tap, so if it isn’t available yet the first tap anywhere turns it on.
async function quickStart() {
  setTimeout(releaseLaterPatches, 6000); // if the app closed before the first catch’s held-back patches came in
  enterSky(); requestLocation(); keepAwake();
  setTimeout(() => weeklyRecap(), 1200); // a new week opens on last week’s recap (playtest #15)
  setTimeout(() => reviewOnNight(), 20000); /* the 5th / 10th night, by day, once things settle */
  setTimeout(() => plusOnNight(), 26000); /* the 7th night: the Plus invite */
  setTimeout(() => dailyTonight(), 1500); // the day’s first visit opens on the Tonight page (after the recap)
  setTimeout(() => almostNotice(), 9000); // a card you own one night from its next level (come-back 01)
  setTimeout(() => seasonNotice(), 12000); // a landmark constellation back in the evening sky (come-back 02)
  setTimeout(() => weekNotice(), 15000); // the week's theme, once a week (come-back 03)
  let ok = false;
  try { ok = await startSensors(); } catch {}
  if (!ok) ok = await trySensorsQuietly(); // already allowed? then motion just works, no tap
  state.drag.on = !ok;
  // A fresh launch says "turn on", not "paused while you were away"; a device that already showed it has no motion
  // (no sensors, or refused twice) goes straight to finger mode next time (iOS playtest 2026-10-20). Settings can still turn motion on.
  let noMotion = false; try { noMotion = localStorage.getItem('noMotion') === '1'; } catch {}
  state.needsMotionTap = !ok && !noMotion; state.wakeCold = true;
}
// iPhones only count a finished tap (touchend/click) as permission to ask, not a finger landing (pointerdown),
// so ask on the release. Until it works, keep asking on the next touch instead of giving up after one try.
let motionAsking = false, wakeFails = 0;
async function motionFromTap() {
  if (!state.needsMotionTap || motionAsking) return;
  motionAsking = true;
  let ok = false;
  try { ok = await resumeSensors(); } catch {} // asks inside the tap and waits for real readings (bug hunt 2026-10-20)
  motionAsking = false;
  // No motion to wake (a computer, sensors refused): the tap still clears the prompt and the sky goes to dragging
  // (2026-10-17, Sevaan: "I’m tapping to wake the screen and nothing is happening").
  if (!ok && (++wakeFails >= 2 || !('DeviceOrientationEvent' in window) || !matchMedia('(pointer: coarse)').matches)) { wakeFails = 0; state.needsMotionTap = false; state.drag.on = true; try { localStorage.setItem('noMotion', '1'); } catch {} $('chk-drag').checked = true; toast('Motion is unavailable, so drag the sky to look around.', 3500); return; }
  if (!ok) { const sp = $('wake').querySelector('span'); if (sp) sp.innerHTML = 'Motion didn’t start<small>Tap again to drag the sky with a finger</small>'; return; } // a phone: one more tap gets another try, and it says so (iOS playtest 2026-10-22: the first tap seemed to do nothing)
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
// "cards.html…" link show it instead of navigating; it posts {sc:'explore'} to come back. The sky pauses while it’s
// open. After a capture it reloads in the background so it’s current next time; back/swipe-back closes it.
let collectionOpen = false, collectionDirty = false;
const colFrame = $('collection-frame');
let colLoaded = false;
const findContext = () => JSON.stringify([state.observer?.lat, state.observer?.lon, state.skySb, state.binoculars]); // place and sky only: a time slot here dropped replies that crossed it, leaving “Finding its next pass…”
const sendFindContext = () => colFrame.contentWindow?.postMessage({ sc: 'find-context', context: findContext() }, location.origin);
// The Collection page carries the app’s version (2026-10-17): without it a phone kept a cached cards.html, with its old
// stylesheets, after an update (Sevaan saw its old header under Explore’s).
const COL_SRC = `cards.html?embed=1&v=${VERSION}`;
function loadCollection() { if (!colFrame.src) { colLoaded = false; colFrame.src = COL_SRC; } }
// After a catch: a loaded Collection re-reads the sighting log in place (no reload, so it’s ready to slide straight up).
function collectionStale() { setTimeout(() => { try { updateBackEarned(); } catch {} }, 1500); /* after the reveal has claimed a back it earned (2026-10-24) */ if (!colFrame.src) return; if (colLoaded) { colFrame.contentWindow?.postMessage({ sc: 'refresh' }, location.origin); return; } if (collectionOpen) collectionDirty = true; else { colLoaded = false; colFrame.src = COL_SRC; } }
// iPhone Duo half-folded (2026-10-22, Sevaan): the native app calls window.scFold(true/false) from its hinge signal
// (iOS 27.1's UIHingeInteraction, MainViewController in native/ios/App/App/ICloudKV.swift) when the phone is partly open.
// The circle then moves off the crease: on its side (fold running top to bottom) to the middle of the left page; upright
// (fold across the middle) to the middle of the top page. Everything under the circle follows it (--cx, --ucx).
let folded = false;
window.scFold = (on) => { folded = !!on; document.body.classList.toggle('folded', folded); window.dispatchEvent(new Event('resize')); };
if (window.__fold != null) window.scFold(window.__fold); /* a hinge update that arrived before the page did */
function foldCX() { return innerWidth / 2; } /* the circle stays in the middle even half-folded (2026-10-22, Sevaan: "seems fine in the middle"); body.folded is still set for anything that wants it */
function sendInsets() {
  const probe = document.createElement('div'); probe.style.cssText = 'position:fixed;visibility:hidden;padding:var(--safe-top) var(--safe-r) var(--safe-bottom) var(--safe-l)'; // the same insets the page uses (lower when standalone; the sides for iPhone Duo's side status bar)
  document.body.append(probe); const cs = getComputedStyle(probe), top = parseFloat(cs.paddingTop) || 0, bottom = parseFloat(cs.paddingBottom) || 0, left = parseFloat(cs.paddingLeft) || 0, right = parseFloat(cs.paddingRight) || 0; probe.remove();
  colFrame.contentWindow?.postMessage({ sc: 'insets', top, bottom, left, right }, location.origin);
}
colFrame.addEventListener('load', () => { colLoaded = true; sendFindContext(); if (collectionOpen) colFrame.classList.add('open'); else colFrame.contentWindow?.postMessage({ sc: 'away' }, location.origin); sendInsets(); if (collectionOpen && pendingKey) { colFrame.contentWindow.postMessage({ sc: 'open', key: pendingKey }, location.origin); pendingKey = ''; } });
let pendingKey = '';
function openCollection(key = '', { keepHeader = false } = {}) {
  if (activePanel === 'visible' && !collectionOpen) setTimeout(hideSkyQuietly, 460); // e.g. View in collection from a card opened on the sky page (bug hunt 2026-10-21: Back left the sky page under the Collection’s header)
  if (!keepHeader) setPageHeader('collection');
  revealBack = null; // "View in collection" from a card opened over a page: go to the Collection, not back to the page
  saveExploreState();
  if (collectionDirty && !collectionOpen) { collectionDirty = false; colLoaded = false; colFrame.src = COL_SRC; }
  loadCollection();
  if (!collectionOpen) { collectionOpen = true; try { history.pushState({ sc: 'collection' }, ''); } catch {} }
  if ($('nav').dataset.side !== 'right' && !keepHeader) setSwitch($('nav'), 'right'); /* not under Settings' stats (web playtest 2026-10-24: Collection lit while stats sat over Explore) */ // opened from a reveal, stats or the tonight page: the switcher says Collection too
  document.body.classList.add('col-open'); // Explore’s switcher stays on top while the Collection slides over (2026-10-11, Sevaan)
  // Fade in only once it has painted (2026-10-07: a not-yet-loaded frame flashed white); load does it otherwise.
  colFrame.hidden = false; if (colLoaded) colFrame.classList.add('open');
  sendFindContext();
  const w = colFrame.contentWindow;
  if (w && colFrame.contentDocument?.readyState === 'complete' && w.location.href !== 'about:blank') w.postMessage({ sc: 'show', key }, location.origin);
  else pendingKey = key;
}
async function closeCollection(fromHistory = false, instant = false) {
  document.body.classList.remove('col-modal');
  if (!collectionOpen) return;
  collectionOpen = false; if (activePanel === 'visible') setPageHeader('sky'); else if (activePanel !== 'debug') setPageHeader('explore'); /* Settings over it keeps its own header; the sky page under it gets its own back */ colFrame.contentWindow?.postMessage({ sc: 'away' }, location.origin); setSwitch($('nav'), activePanel === 'visible' ? 'left' : exploreSide(), false); if (instant) { colFrame.style.transition = 'none'; requestAnimationFrame(() => requestAnimationFrame(() => { colFrame.style.transition = ''; })); } colFrame.classList.add('closing'); colFrame.classList.remove('open'); setTimeout(() => { colFrame.classList.remove('closing'); if (!collectionOpen) { colFrame.hidden = true; document.body.classList.remove('col-open'); } }, 340); // slides back down, switcher on top throughout
  if (!fromHistory && history.state?.sc === 'collection') { try { history.back(); } catch {} }
  await loadSightings(); // a sighting may have been deleted over there
}
window.addEventListener('popstate', () => { if (collectionOpen && history.state?.sc !== 'collection') closeCollection(true); });
window.addEventListener('message', (e) => {
  if (e.origin !== location.origin || !e.data?.sc) return;
  if (e.data.sc === 'ready') { colLoaded = true; if (collectionOpen) colFrame.classList.add('open'); }
  // Settings from the Collection (2026-10-16, Sevaan: it slid in underneath): the page coming in is on top. Settings
  // rises over the Collection, which closes without its slide once Settings has landed.
  if (e.data.sc === 'explore') { if (e.data.more) { const back = statsReturn; statsReturn = undefined; settingsOverCollection(); if (back && back !== 'collection') { settingsFrom = back === 'sky' ? 'sky' : null; setTimeout(() => { if (activePanel === 'debug') closeCollection(false, true); }, 440); } } else closeCollection(); } // back from stats opened in Settings: Settings, then wherever Settings came from
  if (e.data.sc === 'modal') document.body.classList.toggle('col-modal', !!e.data.on); // a card or stats open in there
  if (e.data.sc === 'review') { const ask = (n = 0) => { if (!collectionOpen) setTimeout(() => maybeAskReview('share'), 2500); else if (n < 120) setTimeout(() => ask(n + 1), 2000); }; ask(); return; } /* asked once back on the sky */
  if (e.data.sc === 'stats') { // Observer stats open in the Collection: the shared header names it and its ✕ closes it (2026-10-24)
    if (e.data.on) statsReady(); // opened from Settings: Settings slides away onto it now
    document.body.classList.toggle('stats-open', !!e.data.on);
    const w = document.querySelector('#sky-header .wordmark');
    if (e.data.on) headerTo(w, 'OBSERVER STATS', 'YOUR NIGHTS UNDER THE SKY'); else if (collectionOpen && activePanel !== 'debug') setPageHeader('collection');
  }
  // Find tab (2026-10-13): next passes for the objects on screen, and reminders / Show me for them.
  if (e.data.sc === 'find-passes') findPasses(e.data.ids, e.data.req);
  if (e.data.sc === 'find-suggest') { // the rarest new cards with a pass tonight or this week, from the plans we already have
    const t0 = now().getTime(), tierN = (o) => TIER_RANK[(state.cardModels.get(cardKeyFor(o)) ?? o).tier] ?? 0, nights = [state.tonight && state.tonight.lat === state.observer.lat && state.tonight.lon === state.observer.lon && state.tonight.sb === state.skySb && state.tonight.bino === state.binoculars ? state.tonight : null, ...(state.week?.key === weekKey() ? state.week.nights : [])].filter(Boolean), best = new Map();
    for (const N of nights) for (const p of tonightPasses(N, t0)) { if (!p.fresh || p.start < t0 || p.obj.family || tierN(p.obj) < 1) continue; const k = cardKeyFor(p.obj), b = best.get(k); if (!b || p.start < b.start) best.set(k, p); }
    const top = [...best.values()].sort((a, b) => tierN(b.obj) - tierN(a.obj) || a.start - b.start).slice(0, 8).sort((a, b) => a.start - b.start);
    colFrame.contentWindow?.postMessage({ sc: 'find-suggest', context: findContext(), reminded: [...reminded], items: top.map(({ obj, fresh, ...p }) => ({ ...p, id: obj.id, cloud: cloudAt(p.start) })) }, location.origin); }
  if (e.data.sc === 'find-remind' || e.data.sc === 'find-show') { const p = e.data.pass, obj = p && state.byId.get(p.id); if (obj) {
    const key = `${obj.id}@${p.start}`;
    if (e.data.sc === 'find-show') { closeCollection(); setTimeout(() => showMePass({ ...p, obj }), 450); }
    else (async () => { let on;
      lastPress = null; openPassRemind({ ...p, obj }, key); void on; })(); } } // the choice of times, over the Collection (2026-10-21, Sevaan)
  // The card viewer’s "Up tonight" panel (2026-10-16, design/upnext-remind.html 1): the exact pass from tonight’s plan.
  if (e.data.sc === 'up-remind' || e.data.sc === 'up-show') {
    const p = state.tonight?.passes?.find((x) => x.id === e.data.id && x.start === e.data.start), obj = p && state.byId.get(p.id);
    if (!obj) { colFrame.contentWindow?.postMessage({ sc: 'say', text: 'That pass has moved on. Check Tonight for the next one.' }, location.origin); }
    else if (e.data.sc === 'up-show') { closeCollection(); setTimeout(() => showMePass({ ...p, obj }), 450); }
    else (async () => { const key = `${p.id}@${p.start}`; let on;
      lastPress = null; openPassRemind({ ...p, obj }, key); void on; })(); // the choice of times, over the Collection (2026-10-21, Sevaan)
  }
  if (e.data.sc === 'remind') { const p = state.tonight?.passes?.filter((x) => x.id === e.data.id && x.end > now().getTime()).sort((a, b) => a.start - b.start)[0], obj = p && state.byId.get(p.id); if (obj) remindPass({ ...p, obj }); } // an "Up tonight" slot in Collection
});
let findWorker = null, findWorkerContext = '';
function findPasses(ids, req) {
  if (!state.catalog || !state.observer) return;
  const objects = ids.map((id) => state.byId.get(id) ?? state.catalog.objects.find((o) => o.id === id)).filter((o) => o && !o.natural).map((o) => state.catalog.objects.find((x) => x.id === o.id) ?? o);
  const context = findContext();
  if (findWorkerContext !== context) { findWorker?.terminate(); findWorker = null; findWorkerContext = context; }
  findWorker ??= new Worker(new URL(`./find-worker.js?v=${VERSION}`, import.meta.url), { type: 'module' });
  findWorker.onmessage = ({ data }) => { if (data.context !== findContext()) return; const ps = data.passes ?? {}; for (const k in ps) if (ps[k]) ps[k].cloud = cloudAt(ps[k].start); colFrame.contentWindow?.postMessage({ sc: 'find-passes', context: data.context, req: data.requestId, passes: ps, reminded: [...reminded] }, location.origin); }
  findWorker.postMessage({ requestId: req, context, objects: toWorker(objects), observer: state.observer, startMs: now().getTime(), sb: state.skySb, binoculars: state.binoculars });
}
window.addEventListener('resize', () => { if (colFrame.src) sendInsets(); });
// Any link to the collection opens the layer instead of leaving the page.
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="cards.html"]'); if (!a || e.defaultPrevented || !state.started) return;
  let key = ''; try { key = decodeURIComponent((a.getAttribute('href').split('#')[1] ?? '')); } catch {}
  // The first catch's "View in collection": the tour's Tonight page comes first, then the card opens in the Collection
  // when you close it (iOS playtest 2026-10-20: both opened at once and left the Tonight page's ✕ over the Collection).
  if (tourRevealLeaving && !$('reveal').hidden) { e.preventDefault(); colAfterTour = key || '#'; $('reveal').querySelector('[data-close="reveal"]')?.click(); return; }
  e.preventDefault(); if (!$('reveal').hidden) $('reveal').querySelector('[data-close="reveal"]')?.click();
  if (a.closest('#nav')) { setSwitch($('nav'), 'right'); navLater(() => { const fromSky = activePanel === 'visible'; if (collectionOpen) return; openCollection(key); if (fromSky) setTimeout(hideSkyQuietly, 460); }); } // from Sky the Collection rises straight over it, no Explore in between (2026-10-21) // the pill slides over first
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
// The welcome card’s how-to pictures (design A, 2026-10-17): a phone tilted up at the stars, a light in the circle.
const WC_PICS = [ // gently animated (2026-10-19, Sevaan): the phone sways, the satellite slides into the circle, the card floats (css/cards.css .wa-*)
  '<svg viewBox="0 0 100 118" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><circle class="wa-tw" cx="20" cy="18" r="1.2" fill="#fff2b3"/><circle cx="74" cy="12" r="1" fill="#fff2b3"/><circle class="wa-tw wa-d2" cx="58" cy="30" r="1.4" fill="#fff2b3"/><circle class="wa-tw wa-d3" cx="86" cy="40" r=".9" fill="#fff2b3"/><circle cx="36" cy="40" r=".9" fill="#fff2b3"/><path d="M0 104 L18 96 L30 100 L44 92 L60 99 L76 94 L100 100 L100 118 L0 118 Z" fill="#0a1220"/><g class="wa-phone"><g transform="rotate(-24 50 80)"><rect x="38" y="52" width="24" height="44" rx="5" fill="#0b1220" stroke="#fff2b3" stroke-width="2"/><circle class="wa-lens" cx="50" cy="66" r="6" fill="none" stroke="#fa8127" stroke-width="1.6"/></g><path class="wa-beam" d="M58 50 L66 34" stroke="#fa8127" stroke-width="1.6" stroke-dasharray="2 3" stroke-linecap="round"/></g></svg>',
  '<svg viewBox="0 0 100 118" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><circle class="wa-tw" cx="16" cy="22" r="1" fill="#fff2b3"/><circle class="wa-tw wa-d2" cx="84" cy="18" r="1.2" fill="#fff2b3"/><circle cx="22" cy="92" r="1" fill="#fff2b3"/><circle class="wa-tw wa-d3" cx="80" cy="96" r="1.3" fill="#fff2b3"/><path class="wa-path" d="M8 100 L46 62" stroke="rgba(255,242,179,.35)" stroke-width="1" stroke-dasharray="2 3"/><g class="wa-ring"><circle cx="50" cy="58" r="24" fill="none" stroke="#fa8127" stroke-width="2.4"/><path d="M50 26v8 M50 82v8 M18 58h8 M74 58h8" stroke="#fa8127" stroke-width="2.4"/></g><g class="wa-obj"><rect x="45" y="55" width="10" height="5" rx="1" fill="#fff2b3" transform="rotate(-40 50 58)"/></g></svg>',
];
function welcomeModel() {
  return {
    key: 'welcome', id: 'welcome', natural: 'welcome', type: 'welcome', name: 'Collect the Cosmos', tier: 'legendary', code: 'MISSION 01',
    stats: [['STEP 1', 'Go outside', ''], ['STEP 2', 'Look up', ''], ['STEP 3', 'Collect', '']], // the three steps (2026-10-09, Sevaan)
    fact: 'Point your phone at the night sky. **Every light up there is a card**: satellites, rocket stages, the Space Station, planets and stars. Line one up in the circle and tap **Collect** to keep it. Come back on clear nights to level cards up, earn **mission patches** and find **secrets**.', // what the game is (2026-10-14, Sevaan)
  };
}
// Twinkling stars behind the welcome card (2026-10-09, Sevaan), the same field as behind the reveal.
addStarfield($('start'), 90);
function renderStartHand() {
  const holder = $('wc-holder'); if (!holder || wcCard) return;
  setTimeout(() => sky.warmMilky(), 1800);
  // And the rest of the sky’s first-frame setup, a bit later, one piece per idle moment: the satellite model’s first sweep
  // and the cloud shader (2026-10-16 perf sweep: the first sky frame after Begin was the app’s longest freeze).
  setTimeout(() => { try { const d = now(); state.model?.update(d, state.observer); state.model?.items(d); } catch {} }, 2600);
  setTimeout(() => sky.warmClouds(), 3200); // the Milky Way photo loads while you read the card, not as the sky starts (playtest 2026-10-09)
  const card = renderCard(welcomeModel(), { preview: true });
  card.classList.add('wc-mission');
  // Design A (2026-10-17, Sevaan, design canvas "Welcome Card Options"): at a glance, what the game is ("Every light up
  // there is a card") and how to play, in three pictures: point your phone up, put a light in the circle, tap Collect.
  // The card keeps its shell (edge, back, tilt, foil); its front is replaced. The pictures are just there when it flips.
  const face = card.querySelector('.card__face');
  face.querySelectorAll(':scope > :not(.card__shine):not(.card__glare):not(.card__back):not(.card__foil)').forEach((n) => n.remove());
  face.insertAdjacentHTML('afterbegin', `<div class="wc-a">
    <div class="wc-a-top"><span>Space Collector</span><span class="hot" id="wc-live">Your first mission</span></div>
    <h3 class="wc-a-title">The night sky is yours to collect.</h3>
    <div class="wc-a-steps">
      <div class="wc-step"><div class="wc-a-pic"><i>1</i>${WC_PICS[0]}</div><b>Point your phone at the sky.</b></div>
      <div class="wc-step"><div class="wc-a-pic"><i>2</i>${WC_PICS[1]}</div><b>Line up an object in the circle.</b></div>
      <div class="wc-step"><div class="wc-a-pic card-pic"><i>3</i><span class="wa-card"><img src="assets/art/cards/sm/iss.webp" alt="" decoding="async"></span></div><b>Tap Collect to claim its card.</b></div>
    </div>
    <p class="wc-a-text">Discover satellites, rocket stages, the Space Station, planets and stars, all really up there. Return on clear nights to level up your cards and uncover <b>secrets</b>.</p>
    <div class="wc-a-foot"><span>↑ Swipe up to begin</span><span class="brand">SPACE COLLECTOR</span></div>
  </div>`);
  // Start face-down: the card is turned half way, so its (pre-mirrored) back faces you.
  const back = card.querySelector('.card__back'); applyBack(back); back.style.opacity = '1';
  back.insertAdjacentHTML('beforeend', '<div class="tap">Tap to reveal</div>'); // on the card itself, like the old sealed reveal
  card.style.transform = 'perspective(1600px) rotateY(180deg)';
  holder.replaceChildren(card); wcCard = card;
  // A live count in the top bar (2026-10-25, Sevaan; design/first-night.html 01 A): "● 312 above you now", everything
  // tracked above your horizon (lit or not, so never zero by day), from the satellite model the card already warms.
  // Before location it's the time-zone city's sky. Until the model has a count it keeps "Your first mission".
  const live = () => { const el = card.querySelector('#wc-live'); if (!el || !card.isConnected) return; if (!$('start').hidden) { let n = 0; try { if (state.model?.primed) { const d = now(); state.model.update(d, state.observer); n = state.model.items(d).length; } } catch {} if (n > 0) { const txt = `${n.toLocaleString()} above you now`; if (el.dataset.n !== txt) { el.dataset.n = txt; el.innerHTML = `<i class="wc-dot" aria-hidden="true"></i>${txt}`; } } } setTimeout(live, 2000); };
  setTimeout(live, 2800);
  attachTilt(card);
  holder.classList.add('rattle');
  // A soft card-stock rattle with each shake (2026-10-11, Sevaan). The shake opens every CSS cycle, so play on the
  // animation’s start (after its 1 s delay) and on each repeat. Silent on the web until the first tap (browsers).
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
  // A smooth first impression (2026-10-14, Sevaan: the opening flip was janky):
  //  · the shake doesn’t snap to rest: the holder eases from wherever the shake had it, back to straight;
  //  · the card is promoted to its own layer a frame before it turns;
  //  · the faces swap on the frame the card is edge-on, read from the animation’s clock (a timer drifted);
  //  · sound starts after the first frame of the turn, so resuming audio never holds the first frame up.
  const shakeAt = getComputedStyle(holder).transform;
  holder.classList.remove('rattle'); $('wc-hint').classList.add('gone');
  if (shakeAt && shakeAt !== 'none') holder.animate([{ transform: shakeAt }, { transform: 'none' }], { duration: 200, easing: 'ease-out' });
  // 2026-10-17: the turn itself is turnCard (js/card.js), shared by every flip: compositor-only, faces swap on the
  // turn’s own clock, shimmer and tilt parked while it moves.
  wcCard.style.willChange = 'transform';
  await new Promise((r) => requestAnimationFrame(() => r()));
  const ms = matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 820;
  const turn = turnCard(wcCard, { from: 180, to: 360, ms, lift: 1.06, back, easeIn: 'cubic-bezier(.45,0,.9,.55)', easeOut: 'cubic-bezier(.1,.45,.4,1)' });
  requestAnimationFrame(() => { unlockAudio(); sfx('welcome'); });
  await turn.finished;
  back.querySelector('.tap')?.remove(); // it’s been revealed; from here a double tap flips it like any card
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
    setTimeout(() => { for (const an of wcCard.getAnimations()) an.cancel(); }, 1500); // the welcome screen is gone: drop its card’s filled animations (later, so the style flush isn’t in the sky’s first frame)
  }, ms);
}
{
  const h = $('wc-holder'); let fl = null;
  h.addEventListener('click', () => { if (!wcFlipped) welcomeFlip(); });
  h.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); wcFlipped ? welcomeGo() : welcomeFlip(); } });
  h.addEventListener('pointerdown', (e) => { if (wcFlipped) fl = { id: e.pointerId, start: { x: e.clientX, y: e.clientY }, pts: [{ x: e.clientX, y: e.clientY, t: performance.now() }] }; });
  h.addEventListener('pointermove', (e) => { if (fl && e.pointerId === fl.id) { fl.pts.push({ x: e.clientX, y: e.clientY, t: performance.now() }); if (fl.pts.length > 12) fl.pts.shift(); } });
  h.addEventListener('pointerup', (e) => {
    if (!fl || e.pointerId !== fl.id) return; const pts = fl.pts, fl0 = fl.start; fl = null;
    const last = pts[pts.length - 1], now2 = performance.now(), from = pts.find((p) => now2 - p.t < 140) ?? pts[0];
    const dx = last.x - from.x, dy = last.y - from.y, dt = Math.max(16, now2 - from.t);
    if (dy < -40 && last.y - pts[0].y < -50 && Math.abs(dx) < -dy * 0.9 && -dy / dt > 0.5) welcomeGo(dx, dy, dt);
    else if (fl0 && fl0.y - last.y > 160 && Math.abs(last.x - fl0.x) < fl0.y - last.y) welcomeGo(0, -2, 16); // a long slow drag up counts too (iOS playtest 2026-10-20: only a flick worked)
  });
}
async function boot() {
  try {
    { let bAt = 0; try { bAt = Number(localStorage.getItem(`bundledAt:${VERSION}`)) || 0; } catch {} // the app's own copy's date, once known
      const url = await catalogUrl('data/catalog.json', bAt || Infinity);
      try { state.catalog = await loadCatalog(url); if (!(state.catalog?.objects?.length > 1000)) throw new Error('short'); }
      catch (e) { if (url === 'data/catalog.json') throw e; await dropCatalog(); state.catalog = await loadCatalog('data/catalog.json'); } /* a bad kept copy falls back to the app's own */
      const at = state.catalog.generated?.getTime?.() || 0; if (!bAt) { try { localStorage.setItem(`bundledAt:${VERSION}`, String(at)); } catch {} }
      setTimeout(() => refreshCatalog(Math.max(at, bAt)), 15000); } // fresh satellite data for tomorrow's launch (js/fresh-data.js)
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
  await loadLore(); await loadSightings(); setTimeout(() => { try { updateBackEarned(); } catch {} }, 4000);
  initStore(); // the apps: is Plus on for this Apple ID / Google account? (js/plus.js, RevenueCat)
  initBackup(); // iPhone app: merge with the player’s iCloud copy in the background; nothing waits on it
  renderBackup();
  { const sv = loadSavedLocation(); state.locationStatus = sv?.manual ? 'manual' : sv ? 'saved' : 'example'; } renderLocation();
  state.frame = frame(now(), state.observer); renderStartHand(); 
  $('btn-start').firstElementChild.textContent='Swipe away'; $('btn-start').disabled=false; wcReady = true; if (wcWantFlip) welcomeFlip();
  const params=new URLSearchParams(location.search);
  if(params.has('resume')) {
    try {
      const saved=JSON.parse(sessionStorage.getItem('space-collector.explore'));
      if(saved) {
        state.observer=saved.observer; state.locationStatus=['manual','example'].includes(saved.locationStatus)?saved.locationStatus:'saved';
        state.timeOffsetMs=saved.timeOffsetMs??0; state.drag=saved.drag; state.preview=!!saved.preview; state.followPreview=!!saved.followPreview; state.pinnedId=saved.preview ? saved.pinnedId : null; // a selection only survives a reload inside a pass preview (2026-10-06)
        if(!state.preview && !state.drag.on) { (async () => { const ok = (await startSensors().catch(() => false)) || (await trySensorsQuietly()); state.needsMotionTap = !ok; })(); requestLocation(); } // no silent dead motion on return (bug hunt 2026-10-20)
        renderLocation(); enterSky();
        if(params.has('more')) openDebug();   // the Collection page’s settings button lands here
      }
    } catch {}
  } else if (readPref('started', false) || loadSavedLocation() || state.sightings.some((x) => !x.sim)) {
    quickStart();
    // Quit during the tour, before the first catch (iOS playtest 2026-10-20: the relaunch dropped you in the sky with no
    // first-catch guidance): run it again. Permissions already given go by quickly.
    if (readPref('started', false) && !readPref('tourDone', false) && !state.sightings.some((x) => !x.sim)) setTimeout(() => runOnboarding(), 600);
  } // anyone who has used the app before, or whose cards came back from a backup (bug hunt 2026-10-17)
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
  patchQueue.push(a); document.body.classList.add('patch-waiting'); setTimeout(pumpPatch, 1200);
}
function pumpPatch() {
  if (patchBusy || !patchQueue.length) return;
  if (!$('reveal').hidden || collectionOpen || activePanel || !$('ob-done').hidden) { setTimeout(pumpPatch, 700); return; } // not over the Tonight page either
  // A notification already up finishes first (2026-10-18, Sevaan: one vanished the moment a badge appeared); new ones hold
  // back meanwhile (body.patch-waiting, js/toast.js pump), so the badge is next. Stay-up notices just step aside (css).
  if (document.querySelector('#toasts .ticket.in:not(.ticket--sticky)')) { setTimeout(pumpPatch, 300); return; }
  patchBusy = true; document.body.classList.add('patch-run'); // from the first coin to the last: stay-up notices keep out of the way (css)
  // Patch coins (2026-10-09, Sevaan; design/patch-earn-options.html A2): instead of a full-screen moment, the patches
  // pop up on the left over the live sky like coins (flat spin + bounce, always round), each with a "Patch earned ·
  // name" tag to its right; ~3.5 s later they roll down into the Collection tab, which bumps "+N". Up to 5 show; more
  // are counted in the badge. Tap any to skip. The sky stays usable throughout.
  // One coin at a time, each with its own label (2026-10-18, Sevaan: an Early Bird earned with another patch showed no
  // label: it was only a "+ 1 more" under the first). The rest wait their turn; with more to come each is up 3.5 s.
  const batch = patchQueue.splice(0, 1), shown = batch, more = patchQueue.length, el = document.createElement('div');
  el.className = 'patch-coins'; el.setAttribute('role', 'status');
  el.setAttribute('aria-label', `${batch.length === 1 ? 'Patch' : `${batch.length} patches`} earned: ${batch.map((x) => x.name).join(', ')}`);
  const nav = $('nav-collection').getBoundingClientRect();
  el.innerHTML = shown.map((x, i) => `<div class="pc-coin" style="--d:${(i * 0.32).toFixed(2)}s"><span class="pc-disc">${patchHtml(x, { stitch: true })}</span><span class="pc-tag"><small>${x.secret ? 'Secret patch' : 'Patch earned'}</small><b>${escapeHtml(x.name)}</b></span></div>`).join('');
  // Above the toasts (2026-10-09, Sevaan: a coin was covering one): start from the top of the visible toast stack.
  // Now a fixed spot under the radar, clear of the target card, toasts and slider (playtest 2026-10-11: they covered
  // VIEW CARD and the slider; on the small phone a single coin did).
  // Under the radar, each coin’s centre on the radar’s centre line, as if it slid out from underneath (2026-10-12, Sevaan).
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
      patchBusy = false; if (!patchQueue.length) document.body.classList.remove('patch-waiting', 'patch-run'); setTimeout(pumpPatch, more ? 150 : 500); // notifications wait until the last patch has had its turn
    }, 650 + coins.length * 90);
  };
  const outT = setTimeout(finish, more ? 3500 : 7000); // 7 s to enjoy it (2026-10-11, Sevaan), 3.5 s when another is waiting; a tap sends it on sooner
  el.addEventListener('click', finish);
}

// ---------- the buried fossil (js/fossil.js, 2026-10-08) ----------
// In daylight, with nothing else in the circle: line the fossil up and hold it 4 s to earn the secret patch.
const SECRET_HOLD_MS = 4000, SECRET_SLACK_MS = 400; // hold-to-find secrets and the fossil (2026-10-17)
let fossilHoldFrom = 0, fossilOutAt = 0, fossilDone = !!Fossil.found();
let fossilEnu = Fossil.spot ? enuFromAzEl(Fossil.spot.az, Fossil.spot.el) : null;
function fossilState(t, basis, target) {
  if (!fossilEnu) { // place it behind you the first time you’re out in daylight, once the sky has settled
    if (!document.body.classList.contains('day') || (!state.drag.on && (state.liveSince == null || t - state.liveSince < 1500))) return null;
    const b = basis.back, s = Fossil.placeBehind((Math.atan2(b[0], b[1]) / RAD + 360) % 360); fossilEnu = enuFromAzEl(s.az, s.el);
  }
  if (!document.body.classList.contains('day') || target || state.planeHit) { fossilHoldFrom = 0; return { enu: fossilEnu, img: Fossil.loadImage(), inCircle: false, done: fossilDone }; }
  const inCircle = dot(fossilEnu, basis.back) > Math.cos((sky.reticleDeg + 4) * RAD);
  if (inCircle) { fossilHoldFrom ||= t; fossilOutAt = 0; } else if (fossilHoldFrom) { fossilOutAt ||= t; if (t - fossilOutAt > SECRET_SLACK_MS) fossilHoldFrom = 0; }
  const hold = fossilHoldFrom ? Math.min(1, (t - fossilHoldFrom) / SECRET_HOLD_MS) : 0; // 4 s like the other secrets (2026-10-17)
  if (hold >= 1 && !fossilDone) {
    fossilDone = true; Fossil.markFound(); buzz('success'); sfx('fossil');
    earnPatch({ ...Fossil.FOSSIL_PATCH, text: 'You looked through the Earth and found dinosaur bones. Most people only look up.' });
  }
  return { enu: fossilEnu, img: Fossil.loadImage(), inCircle, hold, done: fossilDone, name: Fossil.fossil.name };
}

// ---------- the UFO (js/ufo.js, 2026-10-08) ----------
// Night only, rare, only in a busy sky (3+ other things up), crosses once. Line it up and tap the green button.
let ufoCaught = !!Ufo.caught();
// The UFO's angle from the circle's middle when it's flying and could be caught, else Infinity (for the target pick).
function ufoAngle(basis) {
  if (ufoCaught || (state.frame?.sunEl ?? 0) > -6 || !basis?.back || !state.ufoBusySky) return Infinity; /* only while it's drawn (3+ things up, from ufoState); bug hunt 2026-10-26 */
  const f = Ufo.flight(now().getTime()); if (!f) return Infinity;
  const { az, el } = Ufo.where(f, now().getTime()), c = dot(enuFromAzEl(az, el), basis.back);
  return c > Math.cos((sky.reticleDeg + 1) * RAD) ? Math.acos(Math.min(1, c)) / RAD : Infinity;
}
function ufoState(t, basis, target, items) {
  const btn = $('ufo-cta'), hide = () => { if (!btn.hidden) btn.hidden = true; return null; };
  state.ufoInCircle = false;
  if (ufoCaught || (state.frame?.sunEl ?? 0) > -6) return hide();
  const f = Ufo.flight(now().getTime()); if (!f) return hide();
  const up = items.filter((it) => it.look.visible).length + (state.naturals ?? []).filter((n) => n.obj.key !== 'earth').length;
  state.ufoBusySky = up >= 3; if (up < 3) return hide();
  const { az, el } = Ufo.where(f, now().getTime()), enu = enuFromAzEl(az, el);
  // A background star doesn’t block it (2026-10-18 playtest), as with the other secrets: it takes the circle over.
  const tAng = target?.angCos != null ? Math.acos(Math.min(1, target.angCos)) / RAD : Infinity; /* nearer the middle than the target (the pick already stepped aside for it) */
  const inCircle = (!target || target.obj.id === undefined || tAng >= (state.ufoAng ?? Infinity)) && dot(enu, basis.back) > Math.cos((sky.reticleDeg + 1) * RAD);
  state.ufoInCircle = inCircle;
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
// One lesson after the first catch (2026-10-25, Sevaan; design/first-night.html 04): the reason to come back. The first
// card that levels (a satellite, stage or debris, not a fleet) teaches levels; the first Moon teaches its eight phase
// stamps. The Sun, planets and stars don't level, so their lesson waits for the first satellite. Once each, per device.
let teachNext = null;
function teachFor(model, sightings) {
  if (sightings.length !== 1 || state.sightings.filter((x) => !x.sim).length > 8) return null; // a beginner's lesson: not for veterans or restored installs (bug hunt 2026-10-25)
  const seen = (k) => { try { return localStorage.getItem(k) === '1'; } catch { return true; } };
  if (model.key === 'moon') return seen('teachPhases') ? null : { kind: 'phases', model };
  if (model.natural || model.launches) return null;
  return seen('teachLevels') ? null : { kind: 'levels', model };
}
function showTeach({ kind, model }) {
  if ($('reveal').hidden || $('rv-teach')) return;
  try { localStorage.setItem(kind === 'phases' ? 'teachPhases' : 'teachLevels', '1'); } catch {}
  const p = document.createElement('div'); p.id = 'rv-teach'; p.setAttribute('role', 'note');
  if (kind === 'phases') {
    const at = moonPhaseAt(now().getTime()), names = ['New', 'Crescent', 'Quarter', 'Gibbous', 'Full', 'Gibbous', 'Quarter', 'Crescent'];
    p.innerHTML = '<small>One more thing</small><b>The Moon has eight phases: the row of moons on this card. Catch each one to fill it.</b><button type="button" class="tc-ok">Got it</button>'; /* the card already draws the eight phases, so the panel points at them instead of drawing them again (flow playtest 2026-10-25) */
    document.querySelectorAll('#reveal .mn-phases').forEach((e) => e.classList.add('teach-glow')); void at; void names;
  } else {
    let src = ''; try { src = artImage(model, 'small') ?? ''; } catch {}
    const tile = (cls, name, when) => `<span class="tc-lv ${cls}"><span class="tc-mini">${src ? `<img src="${escapeHtml(src)}" alt="" decoding="async">` : ''}</span><b>${name}</b><i>${when}</i></span>`;
    p.innerHTML = `<small>One more thing</small><b>Come back on another night and this card levels up.</b><div class="tc-levels">${tile('bronze now', 'Bronze', 'Tonight')}<em aria-hidden="true">›</em>${tile('silver', 'Silver', '3 nights')}<em aria-hidden="true">›</em>${tile('gold', 'Gold', '10 nights')}</div><button type="button" class="tc-ok">Got it</button>`;
  }
  $('reveal').append(p);
  p.querySelector('.tc-ok').addEventListener('click', (e) => { e.stopPropagation(); buzz(8); p.classList.add('out'); teachRoom(false); document.querySelectorAll('#reveal .teach-glow').forEach((g) => g.classList.remove('teach-glow')); setTimeout(() => p.remove(), 260); });
  p.addEventListener('pointerdown', (e) => e.stopPropagation()); // not a flick of the card
  teachRoom(true);
}
addEventListener('sc:payoff', () => { const t = teachNext; teachNext = null; if (t) setTimeout(() => { if (activePanel === 'reveal' && revealShare?.o === t.model) showTeach(t); }, 1500); }); // the same reveal still up (a new one opening in the 1.5 s gets no lesson)
// The payoff haptic, timed with the card turning over (js/reveal.js 'sc:payoff'): stronger for rarer cards.
addEventListener('sc:news-act', (e) => { if (e.detail === 'backs') { closePanel('reveal'); duckMusic(false); setTimeout(() => openPlus('allbacks'), 450); } }); // the reveal's "see them all" chip
addEventListener('sc:feel', (e) => buzz(e.detail)); // reveal.js moments (rank-up chip, mission chip, rank bar wrap)
addEventListener('sc:heartbeat', (e) => buzz(e.detail?.strong ? 'heavy' : 'medium')); // the heartbeat before an Epic/Legendary turns over (2026-10-21)
addEventListener('sc:payoff', (e) => { const t = e.detail?.tier; if (!e.detail?.fresh && !e.detail?.levelUp) { buzz(e.detail?.newStamp ? 16 : 8); return; } /* a new Moon phase or launch stamp is felt more than a plain repeat (2026-10-17) */ buzz(t === 'legendary' || t === 'epic' ? [20, 40, 20] : t === 'rare' ? 28 : 16); });
function buzz(p) { if (!readPref('haptics', true)) return; haptic(typeof p === 'string' ? p : Array.isArray(p) ? 'success' : p >= 25 ? 'heavy' : p >= 14 ? 'medium' : p <= 8 ? 'select' : 'light'); } // or a kind by name: 'warning', 'success', 'select'… (2026-10-17)
const HL_NAMES = { satellite: 'Satellites', rocket: 'Rocket stages', planet: 'Moon & planets', sun: 'The Sun', star: 'Stars' };
// Settings → Collection and About → Your data say where the cards really are (2026-10-16 playtest: one row said
// "Backed up to your iCloud" while the other said "on this phone only", and neither checked iCloud was on).
// Backup is always on (2026-10-20, Sevaan): there's no switch; the row says when it last backed up. iPhone: the player's
// iCloud key-value store, written after every catch (js/cloud-backup.js, 'backupAt'). Android: the phone's own Google
// backup, which Android runs about once a day and doesn't report to apps, so no time there.
const BACKUP_ROW = {
  icloud: ['Backed up to iCloud', 'Automatic. Your cards come back on a new phone or your iPad.'],
  'icloud-off': ['Not backed up yet', 'Sign in to iCloud in your iPhone’s Settings and it backs up by itself.'],
  android: ['Backed up with your phone', 'Automatic with your phone’s Google backup, about once a day.'],
  web: ['Saved in this browser', 'Install the app to keep it backed up.'],
};
const BACKUP_WHERE = { icloud: ', backed up to iCloud', 'icloud-off': ', on this phone only', android: ', on this phone and in its backup', web: ', in this browser only' };
let backupWhere = 'web', settingsAsked = 0;
const agoWords = (t) => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : new Date(t).toLocaleDateString([], { month: 'short', day: 'numeric' }); };
async function renderBackup() {
  backupWhere = await backupStatus();
  let [name, note] = BACKUP_ROW[backupWhere];
  const at = Number(readText('backupAt', '0'));
  if (backupWhere === 'icloud' && at) { name = `Last backed up ${agoWords(at)}`; note = 'Automatic to your iCloud. Your cards come back on a new phone or your iPad.'; }
  $('set-backup-name').textContent = name; $('set-backup-note').textContent = note;
}
function renderSettings() {
  const st = state.locationStatus, o = state.observer;
  $('set-loc-name').textContent = o.label && !['ready', 'manual'].includes(st) ? o.label.replace(/^Example:\s*/, '') : st === 'ready' ? 'Your location' : st === 'manual' ? 'Chosen place' : 'Location';
  $('location-note').textContent = { ready: 'Using where you are now', manual: o.place ? `${o.place}` : /* plain words, no coordinates (Sevaan 2026-10-22) */ `${o.lat.toFixed(2)}°, ${o.lon.toFixed(2)}°`, stale: 'Your last location', saved: 'Your last location', waiting: 'Finding you…', /* stale/saved said "An example sky" (iOS playtest 2026-10-20) */ denied: 'Location is off · tap to set it', unavailable: 'Couldn\u2019t find you · tap to set it' }[st] ?? 'An example sky · tap to use yours';
  if (/^Example:/.test(o.label ?? '') && ['denied', 'unavailable'].includes(st)) $('location-note').textContent = 'From your time zone · tap to set yours'; // not "Toronto" over "Couldn’t find you" (iOS playtest 2026-10-22)
  const live = hasSensorView(); // a still phone is still "on"
  $('set-motion').innerHTML = live ? '<span class="set-ok">On</span>' : ''; /* a status in the switches' ON tag (2026-10-21, Sevaan) */ $('retry-motion').hidden = live; /* FIX 2026-10-24: this had been swallowed by a // comment, so ON and TURN ON showed together */
  const r = $('set-sky-range'); r.min = SB_MIN; r.max = SLIDER_MAX; if (document.activeElement !== r) r.value = String(state.skySb);
  r.style.setProperty('--p', `${((state.skySb - SB_MIN) / (SLIDER_MAX - SB_MIN) * 100).toFixed(1)}%`);
  $('set-sky-name').textContent = skyNameFor(state.skySb);
  $('sky-limit-info').textContent = state.limit ? skyLimitText(state.limit, state.frame?.sunEl ?? -90) : '';
  const on = [...document.querySelectorAll('[data-hl]')].filter((c) => c.checked).map((c) => HL_NAMES[c.dataset.hl]);
  $('set-hl-val').textContent = on.length ? (on.length > 3 ? `${on.slice(0, 3).join(', ')} +${on.length - 3}` : on.join(', ')) : 'None';
  $('chk-sound').checked = soundOn();
  if (Date.now() - settingsAsked > 15000) { settingsAsked = Date.now(); renderBackup(); syncNoteToggles(); } // native calls, not on every slider step
  $('set-version').textContent = `Space Collector v${VERSION}`;
  applyDevMode();
}
$('set-sky-range').addEventListener('input', (e) => { const m = $('sky-range'); m.value = e.target.value; m.dispatchEvent(new Event('input', { bubbles: true })); renderSettings(); });
$('set-sky-range').addEventListener('change', (e) => { const m = $('sky-range'); m.value = e.target.value; m.dispatchEvent(new Event('change', { bubbles: true })); });
const sheetTimers = new Map();
const openSheet = (id) => { clearTimeout(sheetTimers.get(id)); $(id).hidden = false; requestAnimationFrame(() => $(id).classList.add('in')); };
const closeSheet = (el) => { if (el.id === 'set-plus-sheet') plusHeaderOut(); el.classList.remove('in'); clearTimeout(sheetTimers.get(el.id)); sheetTimers.set(el.id, setTimeout(() => { if (!el.classList.contains('in')) el.hidden = true; }, 260)); renderSettings(); };
$('set-loc-open').addEventListener('click', () => openSheet('set-loc-sheet'));
// ---------- backup (2026-10-16, js/cloud-backup.js): no accounts; iCloud on iPhone, Android’s own backup ----------
onBackupChange(async () => { fossilDone ||= !!Fossil.found(); ufoCaught ||= !!Ufo.caught(); Object.assign(secretFound, Secrets.found()); /* restored from iCloud: don't re-earn them (bug hunt 2026-10-22) */ await loadSightings(); collectionStale(); refreshOwned(); if (!$('start').hidden && !wcFlipped && state.sightings.some((x) => !x.sim)) { writePref('started', true); quickStart(); } }); // restored cards while the welcome card is up: straight to the sky // cards arrived from iCloud (a reinstall, or the iPad)
// Card backs (2026-10-16, design/card-backs.html): a grid of every back plus Random. Locked ones show how to earn them
// or a PLUS tag (tapping opens the Plus sheet). The row in Settings shows the current choice.
// Card back picker (2026-10-16, Sevaan: two backs hid below the fold, and the notes under each were noise): all eight
// fit on one screen, four across, name only. Locked ones wear a lock; tapping an earnable one says how to earn it in
// the line at the top, tapping a Plus one opens Plus.
const LOCK = '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="7" width="10" height="7.5" rx="1.6" fill="currentColor"/><path d="M5.2 7V5.2a2.8 2.8 0 0 1 5.6 0V7" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
const BACK_HINT = 'The back you see on every card you flip.';
function renderBackPicker() {
  const cur = chosenBack(), grid = $('back-grid');
  const tile = (id, name, url, open) => `<button type="button" class="back-tile${id === cur ? ' on' : ''}${open ? '' : ' locked'}" data-back="${id}" aria-pressed="${id === cur}" aria-label="${escapeHtml(name)}${open ? '' : ', locked'}">
    <span class="back-art"${url ? ` style="background-image:url('${url}')"` : ''}>${url ? '' : '<span class="back-rand"><i></i><i></i><i></i></span>'}${open ? '' : `<span class="back-lock">${LOCK}</span>`}${id === cur ? '<span class="back-on" aria-hidden="true">✓</span>' : ''}</span><b>${escapeHtml(name)}</b></button>`;
  const randOpen = CARD_BACKS.filter(backUnlocked).length >= 2; // Random needs two backs to pick from (2026-10-21, Sevaan)
  grid.innerHTML = CARD_BACKS.map((b) => tile(b.id, b.name, b.url, backUnlocked(b))).join('') + tile('random', 'Random', null, randOpen);
  $('back-hint').textContent = BACK_HINT;
  for (const el of grid.querySelectorAll('.back-tile')) el.onclick = () => {
    const b = CARD_BACKS.find((x) => x.id === el.dataset.back);
    if (el.dataset.back === 'random' && !randOpen) { $('back-hint').textContent = 'Random shuffles the backs you have. Earn Golden Record or Star Chart, or get Plus for all of them.'; buzz(6); return; }
    if (b && !backUnlocked(b)) { if (b.earn) { $('back-hint').textContent = `${b.name}: ${b.earn.charAt(0).toLowerCase() + b.earn.slice(1)} to earn it, or get Plus.`; buzz(6); } else { closeSheet($('set-back-sheet')); openPlus('backs', { back: b.id }); } return; }
    if (el.dataset.back === chosenBack()) { closeSheet($('set-back-sheet')); return; } // already yours: just close (playtest 2026-10-22)
    chooseBack(el.dataset.back); buzz(8); renderBackPicker(); renderBackRow();
    setTimeout(() => { closeSheet($('set-back-sheet')); cardsTurnOver(); }, 280); // picked: show the choice land, then close (Sevaan); then your cards turn over to it
  };
}
// Every card turns over (2026-10-21, slick idea 15): after picking a new back (or joining Plus), a fan of five of your
// own cards flips over in a wave, left to right, to show it, with a soft shuffle and a tick per card.
function cardsTurnOver() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const keys = [...ownedCardKeys()].filter((k) => { const m = state.cardModels.get(k); return m && !m.story; }).sort(() => Math.random() - .5).slice(0, 5);
  if (keys.length < 2) return;
  document.querySelector('.back-fan')?.remove();
  const fan = document.createElement('div'); fan.className = 'back-fan'; document.body.append(fan);
  const n = keys.length, W = Math.min(110, (innerWidth - 40) / ((n - 1) * .62 + 1.15)); // the whole fan fits (playtest 2026-10-21)
  const cards = keys.map((k, i) => {
    const m = state.cardModels.get(k), ss = state.sightings.filter((x) => !x.sim && x.cardKey === k);
    const c = renderCard(m, { sightings: ss }); c.style.fontSize = `${W / 28}px`;
    const slot = document.createElement('div'); slot.className = 'bf-slot'; const off = i - (n - 1) / 2;
    slot.style.transform = `translateX(${off * W * .62}px) translateY(${Math.abs(off) * 10}px) rotate(${off * 7}deg)`; slot.append(c); fan.append(slot);
    return c;
  });
  sfx('page'); buzz('light');
  cards.forEach((c, i) => setTimeout(() => { if (!c.isConnected) return; const back = c.querySelector('.card__back'); applyBack(back); turnCard(c, { from: 0, to: 180, ms: 460, lift: 1.06, back }); buzz('select'); if (i === cards.length - 1) sfx('flip', { gain: .7 }); }, 520 + i * 120));
  setTimeout(() => { fan.classList.add('out'); setTimeout(() => fan.remove(), 380); }, 520 + n * 120 + 900);
  fan.addEventListener('click', () => { fan.classList.add('out'); setTimeout(() => fan.remove(), 380); });
}
function renderBackRow() { const c = chosenBack(); $('set-back-val').textContent = c === 'random' ? 'Random' : (CARD_BACKS.find((b) => b.id === c && backUnlocked(b)) ?? CARD_BACKS[0]).name; }
$('set-back-open').addEventListener('click', () => { renderBackPicker(); openSheet('set-back-sheet'); });
renderBackRow();
// Earned backs: Golden Record for the Pale Blue Dot story, Star Chart for 10 complete constellations. Checked after the
// sighting log loads and after each catch; a newly earned one gets a toast.
// Which card backs your sightings have earned (Golden Record: the Pale Blue Dot story; Star Chart: 10 constellations).
function backsEarnedBy(list) {
  const owned = new Set(list.filter((s) => !s.sim).map((s) => s.cardKey)), out = new Set(backEarned());
  if (owned.has('story:pale-blue-dot')) out.add('golden-record');
  if (conList().filter((c) => !c.system && c.stars?.length && c.stars.every((k) => owned.has(k))).length >= 10) out.add('star-chart');
  return out;
}
const backChipped = new Set(); // shown as a chip on the reveal that earned it, so no notice as well
function updateBackEarned() {
  const had = backEarned(), now2 = backsEarnedBy(state.sightings);
  if (now2.size === had.size) return;
  try { localStorage.setItem('backEarned', JSON.stringify([...now2])); } catch {}
  for (const id of now2) if (!had.has(id)) {
    const b = CARD_BACKS.find((x) => x.id === id), mine = chosenBack() === 'mission-control'; // still on the default: the new back becomes yours (2026-10-24, Sevaan)
    if (mine) chooseBack(id);
    if (!backChipped.has(id)) ticket({ kind: 'patch', unasked: true, eyebrow: 'NEW CARD BACK', line: b.name, sub: mine ? 'Now on all your cards · change it in Settings' : 'Choose it in Settings', ms: 6000 });
  }
  renderBackRow();
}
$('set-hl-open').addEventListener('click', () => openSheet('set-hl-sheet'));
document.querySelectorAll('.set-sheet').forEach((sh) => sh.addEventListener('click', (e) => { if (e.target === sh || e.target.closest('[data-sheet-close]')) closeSheet(sh); }));
// Swipe a sheet down to close it (2026-10-11, QA: every sheet has a grab handle that did nothing). Starts only on the
// handle or the sheet’s empty space, never on a field or button, and only when the sheet isn’t scrolled.
document.querySelectorAll('.set-sheet-card').forEach((card) => {
  let y0 = null, dy = 0, t0 = 0;
  card.addEventListener('pointerdown', (e) => { if (e.target.closest('input, button, select, textarea, a, label') || card.scrollTop > 0) return; y0 = e.clientY; dy = 0; t0 = performance.now(); card.style.transition = 'none'; });
  card.addEventListener('pointermove', (e) => { if (y0 == null) return; dy = Math.max(0, e.clientY - y0); card.style.transform = `translateY(${dy}px)`; });
  const end = () => { if (y0 == null) return; y0 = null; card.style.transition = ''; const fast = dy / Math.max(1, performance.now() - t0) > 0.5;
    card.style.transform = ''; if (dy > 110 || (fast && dy > 40)) closeSheet(card.closest('.set-sheet')); };
  card.addEventListener('pointerup', end); card.addEventListener('pointercancel', end);
});
/* (the Use my location button closes the sheet itself once it has a fix) */
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
// after boot so building the audio doesn’t land on the first frames. Browsers still wait for the first tap.
if (isNative()) setTimeout(() => { startMusic(); loadSfx(); }, 1200);
// ---------- native app: Back button, status bar, lifecycle (2026-10-11, QA) ----------
// Android Back closes the top layer, one at a time, and only leaves the app (to the background, not killed) from the
// bare sky. The Collection runs in a frame, so it’s asked to close its own viewer/patch first (sc:back).
function handleBack() {
  const sheet = [...document.querySelectorAll('.set-sheet')].find((s) => !s.hidden && s.classList.contains('in'));
  if (sheet) { closeSheet(sheet); return; }
  if (!$('recap').hidden) { $('recap').querySelector('.rc-go')?.click(); return; }
  if (!$('reveal').hidden) { $('reveal').querySelector('[data-close="reveal"]')?.click(); return; }
  if (activePanel) { closePanel(); return; }
  if (collectionOpen) { colFrame.contentWindow?.postMessage({ sc: 'back' }, location.origin); return; }
  if (state.timeOffsetMs) { backToNow(); return; }
  if (!$('ob-done').hidden && !$('onboard').hidden) { $('od-close').click(); return; } // the Tonight page closes onto the sky (Android playtest 2026-10-19: Back left the app)
  if (!$('start').hidden && wcReplay) { wcReplay = false; $('start').hidden = true; $('hud').hidden = false; enterSky(); return; } // a replayed welcome card: Back cancels the replay
  if (!$('start').hidden && $('start').classList.contains('wc-open')) { $('btn-start').click(); return; } // the flipped welcome card: Back begins, like Swipe away (it did nothing)
  if (document.body.classList.contains('ob-tour') && !$('ob-skip').hidden) { $('ob-skip').click(); return; } // Back on a tour card skips the tour, like the Skip button (2026-10-16 playtest)
  plugin('App')?.minimizeApp().catch(() => {});
}
if (isNative()) {
  nativeChrome();
  onNative('App', 'backButton', handleBack);
  // A tap on a widget (spacecollector://pass/<id>@<start>, …/tonight, …/plus): Show me for that pass, the Tonight page or
  // Plus. Kept until tonight's plan is in if the app is only just starting (widgetLink, run from shareTonight).
  onNative('App', 'appUrlOpen', ({ url }) => openWidgetLink(url));
  plugin('App')?.getLaunchUrl().then((r) => r?.url && openWidgetLink(r.url)).catch(() => {});
  // Pause the audio when the app goes to the background (QA: the AudioContext kept running and drained battery).
  let appActive = true;
  onNative('App', 'appStateChange', ({ isActive }) => { appActive = isActive; const c = audioCtx(); if (!c) return; if (isActive) { c.resume().catch(() => {}); musicAway(false); } else { musicAway(true); setTimeout(() => { if (!appActive) c.suspend().catch(() => {}); }, 90); } }); /* suspend after the fade (no click), and not if the app came straight back */ // music pauses with the context, and starts fresh on return
}
// Testing tools: tap the version five times.
// (2026-10-08: testing tools now sit at the top of Settings, always shown.)

// ---------- countdown to dark (2026-10-08) ----------
// By day, with nothing in the circle: "3 h 57 min until dark" under the circle, and when it gets dark.
let udLast = '';
$('ud-time')?.addEventListener('animationend', () => $('ud-time').classList.remove('roll')); // never left mid-roll
// The pass marker in the circle (by day) gets a Remind me pill, 10 minutes before it rises.
let ghLast = '';
// The pass Show me is steering you to (state.guidePass), while the "appears here at…" pill shows (2026-10-14, Sevaan:
// it needed a Remind me too).
function guideRemindPass() {
  const gp = state.guidePass, g = $('guidance'); if (!gp || g.hidden || gp.start - 10 * 60e3 <= now().getTime()) return null;
  const obj = state.byId.get(gp.id); return obj ? { ...gp, obj, peakEl: gp.peakEl ?? gp.riseEl, peakAz: gp.peakAz ?? gp.riseAz } : null;
}
function ghRemind() {
  const b = $('gh-remind'), dayP = sky.ghostHitId != null ? state.dayPicks?.find((x) => x.obj.id === sky.ghostHitId) : null, p = dayP ?? guideRemindPass();
  if (!p) { if (!b.hidden) { b.hidden = true; ghLast = ''; } return; }
  const key = `${p.obj.id}@${p.start}`, on = reminded.has(key), txt = on ? `Reminder at ${fmtTime(remindIds.get(key)?.at ?? p.start - 10 * 60e3)}` : 'Set reminder'; // tap for the times (2026-10-21)
  if (txt !== ghLast) { ghLast = txt; setTxt($('gh-remind-t'), txt); b.classList.toggle('on', on); b.dataset.key = key; }
  const host = dayP ? $('tk-act') : document.body; if (b.parentNode !== host) host.append(b); // in the pass’s ticket (2026-10-17)
  const rc = sky.ring ?? { y: sky.cy, r: sky.reticlePx }, g = $('guidance');
  b.style.top = dayP ? `${rc.y + rc.r + 54}px` : `${Math.round(g.getBoundingClientRect().bottom + 10)}px`; // under the steering pill
  b.hidden = false;
}
$('gh-remind').addEventListener('click', async () => {
  const b = $('gh-remind'), key = b.dataset.key, gp = guideRemindPass(), p = state.dayPicks?.find((x) => `${x.obj.id}@${x.start}` === key) ?? (gp && `${gp.obj.id}@${gp.start}` === key ? gp : null); if (!p) return;
  if (!reminded.has(key) && needsPlus(key)) { openPlus('reminders'); return; } // straight to Plus, like the bells (iPhone playtest 2026-10-26: the times came first, then the paywall)
  openPassRemind(p, key); // the sheet sets, changes or cancels it
});
function untilDark(target) {
  ghRemind();
  const el = $('until-dark'), T = state.tonight, now0 = now().getTime();
  const show = document.body.classList.contains('day') && (state.basis?.back?.[2] ?? 1) > 0 && !target && !state.planeHit && T?.dusk && T.dusk > now0 && $('discover').hidden && !sky.dayHitId && !sky.ghostHitId;
  if (!show) { if (!el.hidden) el.hidden = true; udNow(false); return; }
  // Design A (2026-10-25, Sevaan; design/first-night.html 07): "Dark at 6:43 PM" over "In 2 h 2 min", and under the bar
  // what you can catch right now. (Was "Dark in 2 h 24 min" over "At 7:00 PM", 2026-10-17.) Minutes, seconds only in the last one.
  const secs = Math.max(0, Math.floor((T.dusk - now0) / 1000)), h = Math.floor(secs / 3600), m = Math.floor(secs / 60) % 60, sc = secs % 60;
  const left = `In ${h ? `${h} h ` : ''}${h || m ? `${m} min` : `${sc} s`}`.trim(), r = udReminder();
  setTxt($('ud-time'), `Dark at ${fmtTime(T.dusk)}`); setTxt($('ud-at'), r ? `${left} · reminder ${fmtTime(r.t)} ✓` : left);
  if ($('ud-bell').dataset.dusk !== String(T.dusk)) { $('ud-bell').dataset.dusk = String(T.dusk); udRender(); }
  const rc = sky.ring ?? { y: sky.cy, r: sky.reticlePx }, top = rc.y + rc.r + 26; el.style.top = `${top}px`;
  el.hidden = false;
  udNow(true, top);
}
// "Right now you can catch" (2026-10-25, Sevaan; design/first-night.html 07 A): chips for the Sun, the Moon and any planet
// up and visible now, each saying yours or new; a tap steers you there (guideTo). Then "Tonight’s plan ›". The list is
// rebuilt at most once a second and only when it changes; it steps aside if it would reach the tab bar.
let udNowKey = '', udNowAt = 0, udNowH = 0, udNowH2 = 0, udBarH = 64, udNavTop = Infinity;
function udNow(show, top = 0) {
  const box = $('ud-now');
  if (!show) { if (!box.hidden) box.hidden = true; return; }
  const t = performance.now();
  if (t - udNowAt > 1000) {
    udNowAt = t;
    const order = { sun: 0, moon: 1, planet: 2 };
    const list = (state.naturals ?? []).filter((n) => n.look.visible && n.obj.type in order).sort((a, b) => order[a.obj.type] - order[b.obj.type] || (a.look.mag ?? 9) - (b.look.mag ?? 9)).slice(0, 3);
    const key = list.map((n) => `${n.obj.id}:${isNewFind(n.obj) ? 1 : 0}`).join(',') + `|${state.pinnedId ?? ''}`;
    if (key !== udNowKey) {
      udNowKey = key;
      $('ud-chips').innerHTML = list.map((n) => { const fresh = isNewFind(n.obj), name = label(n.obj).replace(/^the /i, ''); let src = ''; try { src = artImage(cardModel(n.obj), 'small') ?? ''; } catch {}
        return `<button type="button" class="ud-chip${fresh ? ' new' : ''}${state.pinnedId === n.obj.id ? ' on' : ''}" data-id="${escapeHtml(String(n.obj.id))}">${src ? `<img src="${escapeHtml(src)}" alt="" decoding="async">` : '<i></i>'}<span><b>${escapeHtml(name)}</b><small>${fresh ? 'New' : '✓ Yours'}</small></span></button>`; }).join('');
      box.querySelector('.ud-now-h').hidden = !list.length;
      box.hidden = false; box.classList.remove('compact'); udNowH = box.offsetHeight; box.classList.add('compact'); udNowH2 = box.offsetHeight; box.classList.remove('compact'); udBarH = $('until-dark').offsetHeight || udBarH;
    }
    udNavTop = $('nav').getBoundingClientRect().top || innerHeight;
  }
  // On a short screen the plan button goes first, then the whole row, rather than sit on the tab bar.
  const y = top + udBarH + 14, fits = y + udNowH <= udNavTop - 10, fits2 = y + udNowH2 <= udNavTop - 10;
  box.style.top = `${y}px`;
  if (box.classList.contains('compact') === fits) box.classList.toggle('compact', !fits);
  if (box.hidden === fits2) box.hidden = !fits2;
}
$('ud-chips').addEventListener('click', (e) => {
  const c = e.target.closest('.ud-chip'); if (!c) return;
  const n = (state.naturals ?? []).find((x) => String(x.obj.id) === c.dataset.id); if (!n) return;
  buzz(8); guideTo(n.obj, n.look); udNowKey = ''; udNowAt = 0; // lights the chip at the next check
});
$('ud-plan').addEventListener('click', () => openSky('tonight'));

// Countdown → reminder (2026-10-08, design/until-dark.html). A native notification (no calendar files since 2026-10-12).
// Remembered for tonight in localStorage 'udRemind' = { t, label }.
function udReminder() { try { const r = JSON.parse(localStorage.getItem('udRemind')); return r && r.t > Date.now() - 3600e3 ? r : null; } catch { return null; } }
let udPick = 0, udChoices = [];
function udOptions() {
  const T = state.tonight, t0 = now().getTime(), out = [];
  const eve = eveningEnd(T);
  // Tonight's headliner first, so the chip, Tonight's run and this sheet name the same pass (iOS playtest 2026-10-20: three different "best" picks).
  const head = T ? headliner(T) : null;
  const best = T ? ((head && head.start > t0 + 10 * 60e3 ? head : null) ?? tonightPasses(T, t0).find((p) => p.fresh && p.start > T.dusk && p.start <= eve) ?? tonightPasses(T, t0).find((p) => p.start > T.dusk && p.start <= eve)) : null;
  if (best) out.push({ t: best.start - 10 * 60e3, icon: '✦', label: `Best pass · ${label(best.obj)} at ${fmtTime(best.start).replace(' ', '\u00a0')}` /* shorter, and the time never splits from its PM (2026-10-17, Sevaan); the 10 minutes shows in the big time above */, title: `${fmtTime(best.start)}: tonight’s best pass`, msg: `Look ${dirWord(best.peakAz)} for ${label(best.obj)}, ${Math.round(best.peakEl)}° above the horizon.` });
  if (T?.dusk) out.push({ t: T.dusk, icon: '☾', label: 'When it gets dark', title: 'Now: time to look up', msg: 'It’s dark enough to start collecting. See what’s in your sky.' });
  const pk = T ? T.curve.filter(([t]) => t >= T.dusk && t <= eve).reduce((a, c) => (c[1] > a[1] ? c : a), [0, 0]) : [0, 0];
  if (pk[1] >= 3) out.push({ t: pk[0], icon: '★', label: `The busiest moment · ${upOnce(pk[1])}`, title: 'Now: rush hour overhead', msg: `${pk[1]} satellites, all up at once. How many can you catch?` });
  return out.sort((a, b) => a.t - b.t);
}
function udRender() {
  const r = udReminder(), b = $('ud-bell');
  // "Remind me at 7:00 PM" (2026-10-17, Sevaan): the time of dark is on the button, not on a line of its own.
  const dusk = state.tonight?.dusk;
  b.classList.toggle('on', !!r); b.setAttribute('aria-label', r ? `Reminder at ${fmtTime(r.t)}. Change it` : dusk ? `Remind me at ${fmtTime(dusk)}` : 'Remind me');
  // (the line under it, the countdown and the reminder, is written by untilDark each frame; 2026-10-25)
}
$('ud-bell').addEventListener('click', () => {
  udChoices = udOptions(); if (!udChoices.length) return;
  const r = udReminder(); udPick = Math.max(0, r ? udChoices.findIndex((c) => Math.abs(c.t - r.t) < 60e3) : 0);
  const draw = () => { $('ud-opts').innerHTML = udChoices.map((c, i) => `<button type="button" class="ud-opt${i === udPick ? ' sel' : ''}" data-i="${i}"><i><span class="ico" data-ico="${({ '✦': 'ring', '☾': 'moon', '★': 'stars' })[c.icon] ?? 'bell'}" aria-hidden="true"></span></i><span><b>${escapeHtml(fmtTime(c.t))}</b><small>${escapeHtml(c.label)}</small></span><em aria-hidden="true">✓</em></button>`).join(''); };
  draw(); $('ud-opts').onclick = (e) => { const o = e.target.closest('.ud-opt'); if (o) { udPick = Number(o.dataset.i); draw(); } };
  $('ud-cancel').hidden = !r; openSheet('ud-sheet');
});
$('ud-set').addEventListener('click', async () => {
  const c = udChoices[udPick]; if (!c) return;
  const r = await setReminder({ at: c.t, title: c.title ?? 'Now: time to look up', body: c.msg, key: 'until-dark' });
  if (r !== 'on') { // say why on the button itself: a toast would sit behind the sheet (2026-10-13, Sevaan: "does nothing")
    if (r === 'limit') return; // the Plus sheet is explaining
    const b = $('ud-set').firstElementChild, was = b.textContent;
    b.textContent = r === 'app-only' ? 'Reminders work in the app' : r === 'denied' ? 'Notifications are off in Settings' : "Couldn’t set a reminder";
    shake($('ud-set')); setTimeout(() => { b.textContent = was; }, 3500); return; }
  try { localStorage.setItem('udRemind', JSON.stringify({ t: c.t, label: c.label })); } catch {}
  closeSheet($('ud-sheet')); udRender(); const bl = $('ud-bell'); bl.classList.remove('ring'); void bl.offsetWidth; bl.classList.add('ring'); // felt in setReminder
  ticket({ kind: 'mission', tone: 'steel', icon: 'bell', eyebrow: 'REMINDER SET', line: fmtTime(c.t), sub: c.icon === '✦' ? `Before ${c.label.split(' · ')[1]}` : 'We’ll nudge you then', ms: 4000 });
});
$('ud-cancel').addEventListener('click', () => { try { localStorage.removeItem('udRemind'); } catch {} closeSheet($('ud-sheet')); udRender(); cancelNotify(remindIds.get('until-dark')?.id); remindIds.delete('until-dark'); saveRems(); toast('Reminder removed.', 2500); });
document.getElementById('ud-sheet').addEventListener('click', (e) => { if (e.target.id === 'ud-sheet') closeSheet(e.currentTarget); });
udRender();

// ---------- more secrets (js/secrets.js, 2026-10-08) ----------
const secretFound = Secrets.found();
if (isPlus() && !secretFound.plus) setTimeout(() => earnSecret('plus'), 4000); // Plus from before the patch existed
let secretHold = {}, secretOut = {}, secretTap = null, secretTicks = {};
// One deep-space secret a session (2026-10-13, Sevaan: New Horizons, the Wow! signal and Pioneer 11 sit close together
// in Sagittarius, so you found them all at once). After one, the others stay hidden until the app is opened again.
const DEEP_IDS = new Set(Secrets.DEEP.map((d) => d[0]).concat('voyager')); let deepThisSession = false;
const deepOnce = () => deepThisSession && !state.showDim; // the testing switch "Show items that aren't visible" lifts the one-a-session limit, since it shows them all (2026-10-24, Sevaan couldn't catch Voyager or Arecibo it was showing)
function earnSecret(id) {
  if (secretFound[id]) return; secretFound[id] = Date.now(); if (DEEP_IDS.has(id)) deepThisSession = true; Secrets.markFound(id); buzz([20, 40, 20]); sfx('secret');
  if (!Secrets.STORY_SECRETS.has(id)) earnPatch(Secrets.SECRET_PATCHES[id]); // story secrets give their story card instead
  earnStory(id);
}
// Story cards (js/stories.js): finding a story secret also adds its story card, revealed like a new catch.
async function earnStory(id, quiet = false) {
  const st = STORY_BY_SECRET.get(id); if (!st || state.sightings.some((s) => s.cardKey === st.key)) return;
  const at = secretFound[id] && quiet ? secretFound[id] : now().getTime();
  const sighting = { objectId: st.id, cardKey: st.key, name: st.name, type: 'story', time: at, loggedAt: Date.now(), lat: state.observer?.lat, lon: state.observer?.lon, sim: false, appVersion: VERSION, cardSnapshot: cardSnapshot(st) };
  try {
    const key = await addSighting(sighting); const saved = { ...sighting, key };
    state.sightings.unshift(saved); collectionStale(); backupSoon(); shareWidgets(); /* a catch changes what is new */
    if (!quiet) showCaptureCard(st);
  } catch {}
}
// Two homes: the ISS and Tiangong caught within ten minutes of each other.
function checkTwoHomes(saved) {
  if (secretFound.twohomes || !saved) return;
  const iss = '25544', css = '48274', other = String(saved.objectId) === iss ? css : String(saved.objectId) === css ? iss : null; if (!other) return;
  if (state.sightings.some((s) => !s.sim && String(s.objectId) === other && Math.abs(s.time - saved.time) <= 10 * 60000)) setTimeout(() => earnSecret('twohomes'), 4500);
}
function secretsState(t, basis, target) {
  if (!$('onboard').hidden) { secretHold = {}; state.secretAng = Infinity; return []; } // no secrets during the setup tour (2026-10-14: the sky behind the cards found Pioneer 11)
  // In the circle and nearer its middle than the target (2026-10-24, Sevaan: secrets are picked like any other object,
  // nearest the middle wins; the one being held keeps it unless the other is 0.5° nearer, like the target pick).
  const angOf = (enu) => Math.acos(Math.max(-1, Math.min(1, dot(enu, basis.back)))) / RAD, tAng = target ? Math.acos(Math.max(-1, Math.min(1, target.angCos ?? 1))) / RAD : Infinity;
  const out = [], nowMs = now().getTime(), night = (state.frame?.sunEl ?? 0) < -6, inCirc = (enu, slack = 1) => angOf(enu) < sky.reticleDeg + slack, tapAngs = [], tapAt = (enu, found) => { if (!found && inCirc(enu, 2)) tapAngs.push(angOf(enu)); }, inC = (enu, slack = 1, id = null) => inCirc(enu, slack) && tAng > angOf(enu) - (id && secretHold[id] ? 0.5 : 0);
  const toEnu = eqToEnu(now(), state.observer), b = basis.back, heading = (Math.atan2(b[0], b[1]) / RAD + 360) % 360, aimEl = Math.asin(Math.max(-1, Math.min(1, b[2]))) / RAD;
  let tap = null;
  // Santa (tap to wave)
  const sf = Secrets.santa(nowMs);
  if (sf && night) { const w = Secrets.santaWhere(sf, nowMs), enu = enuFromAzEl(w.az, w.el), c = inC(enu, 2); tapAt(enu, secretFound.santa); out.push({ kind: 'santa', enu, inCircle: c, done: !!secretFound.santa, title: "Santa’s sleigh", sub: 'NORAD tracked · S-1', color: '#ff8a6b' }); if (c && !secretFound.santa) tap = { id: 'santa', label: 'Tap to wave' }; }
  // Sputnik and Laika anniversaries (tap), Apollo 11 on 20 July (hold the Moon). 2026-10-14, js/stories.js.
  for (const [id, m, dd, title, sub, color, label] of Secrets.DATED) {
    const c0 = Secrets.datedCrossing(nowMs, m, dd, id.length * 47); if (!c0 || !night || secretFound[id]) continue;
    const w = Secrets.santaWhere(c0, nowMs), enu = enuFromAzEl(w.az, w.el), c = inC(enu, 2); tapAt(enu, false);
    out.push({ kind: id, enu, inCircle: c, done: false, title, sub, color }); if (c) tap = { id, label };
  }
  { const d0 = new Date(nowMs); if (d0.getMonth() === 6 && d0.getDate() === 20 && !secretFound.apollo11 && target?.obj?.type === 'moon' && state.lockedOn) { secretHold.apollo11 ??= t; if (t - secretHold.apollo11 > 1500) earnSecret('apollo11'); } else delete secretHold.apollo11; }
  // Roadster, Voyager and the deep-space spots: hold SECRET_HOLD_MS (2026-10-17, Sevaan: 1.2 s found the Pale Blue Dot
  // just panning past; now the sight turns the secret’s colour as you pass, and you have to come back and stay). A short
  // wobble out of the circle (SECRET_SLACK_MS) doesn’t restart the count.
  // The Moon first (2026-10-17, Sevaan: the Wow! signal sat right by the Moon and the circle flickered between them).
  // Until you’ve collected the Moon, the Wow! signal can’t be seen or found, and no secret within 10° of the Moon
  // takes the circle from it.
  const moonN = state.naturals?.find((n) => n.obj.type === 'moon'), moonFirst = moonN && (refreshOwned(), !ownedKeys.has('moon')); // owning the Moon at all, not this phase’s stamp (bug hunt 2026-10-17)
  const byMoon = (enu) => moonFirst && dot(enu, moonN.look.enu) > Math.cos(10 * RAD);
  // One secret at a time (2026-10-24, Sevaan: two secrets sat in the circle together and were both found at once): of the
  // ones in the circle, the one already being held keeps it, else the nearest the centre; the others don't count.
  const pend = [], step = (id, enu, title, sub, color, lead) => {
    if (moonFirst && (id === 'wow' || byMoon(enu))) { delete secretHold[id]; delete secretOut[id]; return; }
    const c = inC(enu, 1, id) && (!lead || lead === id);
    if (lead && lead !== id && !c) { delete secretHold[id]; delete secretOut[id]; }
    if (c) { secretHold[id] ??= t; secretOut[id] = 0; }
    else if (secretHold[id]) { secretOut[id] ||= t; if (t - secretOut[id] > SECRET_SLACK_MS) { delete secretHold[id]; delete secretOut[id]; } }
    const h = secretHold[id] ? Math.min(1, (t - secretHold[id]) / SECRET_HOLD_MS) : 0;
    { const q = Math.floor(h * 4); if (!secretHold[id]) delete secretTicks[id]; else if (q > (secretTicks[id] ?? 0) && q < 4) { secretTicks[id] = q; buzz(8); } } // a tick each second of the hold, felt without looking (2026-10-17)
    if (h >= 1 && !secretFound[id]) earnSecret(id);
    out.push({ kind: id, enu, inCircle: c, hold: h, done: !!secretFound[id], title, sub, color });
  };
  const hold = (...a) => pend.push(a);
  if (night) {
    const r = toEnu(roadster(now())); if (r[2] > 0.05) hold('roadster', r, 'Starman', 'Interplanetary · 2018-017A', '#ff6b6b');
    const v = toEnu(starVector(Secrets.VOYAGER.ra, Secrets.VOYAGER.dec)); if (v[2] > 0.05 && (!deepOnce() || secretFound.voyager)) hold('voyager', v, 'The Golden Record', 'Voyager 1 · almost 26 billion km', '#e2b53c');
    for (const [id, ra, dec, title, sub, color] of Secrets.DEEP) { if (deepOnce() && !secretFound[id]) continue; const e = toEnu(starVector(ra, dec)); if (e[2] > 0.05) hold(id, e, title, sub, color); }
  }
  { const live = pend.filter(([id, enu]) => !secretFound[id] && inCirc(enu) && !(moonFirst && (id === 'wow' || byMoon(enu))));
    const score = ([id, enu]) => angOf(enu) - (secretHold[id] ? 0.5 : 0), best = live.slice().sort((a, b) => score(a) - score(b))[0];
    state.secretAng = Math.min(best ? score(best) : Infinity, ...tapAngs); /* read by the target pick next frame; tap secrets (Santa, Sputnik, Laika) count too */
    const lead = live.length < 2 ? null : best[0]; /* nearest the middle, the held one 0.5° ahead (review 2026-10-24) */
    for (const a of pend) step(...a, lead); }
  // Testing (2026-10-21, Sevaan): "Show items that aren't visible" also shows where every secret is, found or not, by day
  // or night, as a dashed ring with its name (drawn only; finding one still means holding it in the circle).
  if (state.showDim) {
    const have = new Set(out.map((o) => o.kind)), add = (id, enu, title, color) => { if (!have.has(id) && enu[2] > -0.02) out.push({ kind: id, enu, inCircle: false, done: !!secretFound[id], title, color, xray: true }); };
    add('roadster', toEnu(roadster(now())), 'Starman', '#ff6b6b');
    add('voyager', toEnu(starVector(Secrets.VOYAGER.ra, Secrets.VOYAGER.dec)), 'The Golden Record', '#e2b53c');
    for (const [id, ra, dec, title, , color] of Secrets.DEEP) add(id, toEnu(starVector(ra, dec)), title, color);
    for (const o of out) o.xray = true;
  }
  // Shooting star (tap within the streak)
  const active = night && !!activeShower(nowMs) && aimEl > 15 && !target; // shooting stars only during a meteor shower
  const m = Secrets.meteorAt(t, active, heading, aimEl);
  if (m) { out.push({ kind: 'meteor', streak: { ...m, k: Math.min(1, (t - m.start) / (m.end - m.start)) } }); if (!secretFound.meteor) tap = { id: 'meteor', label: 'Tap now' }; }
  // Dizzy: three full turns while using the sky
  if ((hasLiveSensors() || state.drag.on) && Secrets.dizzyStep(t, heading)) { $('radar').classList.remove('dizzy'); void $('radar').offsetWidth; $('radar').classList.add('dizzy'); if (!secretFound.dizzy) earnSecret('dizzy'); else toast('Whoa. Dizzy?', 2000); }
  // The tap button for Santa / the shooting star
  const btn = $('secret-cta');
  if (tap) { const rc = sky.ring ?? { x: sky.cx, y: sky.cy, r: sky.reticlePx }; btn.style.top = `${rc.y + rc.r + 24}px`; btn.textContent = tap.label; btn.dataset.id = tap.id; btn.hidden = false; }
  else if (!btn.hidden && !(btn.dataset.id === 'meteor' && m)) btn.hidden = true;
  state.secretInCircle = out.some((x) => x.inCircle && !x.done); // read by the target pick next frame
  return out;
}
$('secret-cta').addEventListener('click', (e) => { const id = e.currentTarget.dataset.id; e.currentTarget.hidden = true; if (id) earnSecret(id); });
$('btn-santa')?.addEventListener('click', () => { Secrets.summonSanta(now().getTime()); closePanel('debug'); toast("Santa’s sleigh is crossing now (night only).", 3000); });
// Testing tools (2026-10-18, Sevaan): one of each kind of notification, queued the way real ones are, with a patch
// badge earned at the same moment so the two can be seen together. Nothing is saved.
$('btn-review')?.addEventListener('click', () => { closePanel('debug'); setTimeout(() => maybeAskReview('test', { force: true }), 700); });
$('btn-toasts')?.addEventListener('click', () => {
  closePanel('debug');
  setTimeout(() => {
    ticket({ kind: 'mission', eyebrow: 'MISSION COMPLETE', line: 'Night Shift', xp: 50, ms: 3200 });
    ticket({ kind: 'xp', eyebrow: 'NEW STAMP', line: 'Starlink', sub: '12 launches stamped', ms: 3200 });
    ticket({ kind: 'event', icon: 'meteor', eyebrow: 'EVENT BADGE', line: 'Orionid meteor shower', ms: 3600 });
    ticket({ kind: 'info', icon: 'moon', eyebrow: 'WEATHER', line: 'Clearing after 9 PM', sub: 'Cloud moves off your sky.', ms: 3200 });
    ticket({ kind: 'rank', id: 'rank-test', eyebrow: 'NEW RANK', line: 'Navigator', ms: 4200 }); // a sample: it goes away like the rest (playtest 2026-10-22: it left a lasting chip)
    const ach = progressNow(state.sightings).achievements, two = [ach.find((x) => x.id === 'first'), ach.find((x) => x.id === 'twilight')].filter(Boolean); // two at once, like a first evening catch
    if (two.length) { patchQueue.push(...two); document.body.classList.add('patch-waiting'); setTimeout(pumpPatch, 300); }
  }, 450);
});
$('btn-meteor')?.addEventListener('click', () => { Secrets.summonMeteor(); closePanel('debug'); toast('A shooting star is coming (night, meteor shower, looking up).', 3000); });

// Reset everything (2026-10-08): sightings, patches, settings and every saved flag go, then the app reloads as a brand-new
// player (welcome card and tour). The browser keeps its own location/motion permissions; the tour asks again regardless.
$('set-reset').addEventListener('click', async () => {
  const inCloud = (await backupStatus().catch(() => '')) === 'icloud'; // only mention iCloud when it’s really on (iOS playtest 2026-10-19)
  if (!confirm(`Reset everything? Your cards, patches and settings will be deleted${inCloud ? ', here and in your iCloud backup' : ' from this phone'}. This can\u2019t be undone.`)) return;
  await clearBackup(); // or iCloud would bring the old collection straight back
  try { localStorage.clear(); sessionStorage.clear(); } catch {}
  await new Promise((res) => { try { const r = indexedDB.deleteDatabase('space-collector'); r.onsuccess = r.onerror = r.onblocked = () => res(); } catch { res(); } });
  location.href = location.pathname;
});

// ---------- polish (2026-10-08) ----------
// Pull a page down to close it, from anywhere once it's at the top (2026-10-21): Settings and Up in your sky.
for (const id of ['debug', 'visible', 'around']) pullToClose($(id), () => closePanel(id));
pullToClose($('ob-done'), () => $('od-close').click()); // the Tonight page too, like every other page (2026-10-21, Sevaan)
// Drag a panel’s header down to dismiss it.
document.querySelectorAll('.overlay.panel .panel-head').forEach((h) => {
  let y0 = null; const panel = h.closest('.overlay.panel');
  h.addEventListener('pointerdown', (e) => { if (e.target.closest('button')) return; y0 = e.clientY; h.setPointerCapture(e.pointerId); panel.style.transition = 'none'; });
  h.addEventListener('pointermove', (e) => { if (y0 == null) return; const dy = Math.max(0, e.clientY - y0); panel.style.transform = `translateY(${dy}px)`; });
  const end = (e) => { if (y0 == null) return; const dy = Math.max(0, e.clientY - y0); y0 = null; panel.style.transition = 'transform var(--m-norm) var(--ease-out)';
    if (dy > 110) closePanel(panel.id); else panel.style.transform = ''; };
  h.addEventListener('pointerup', end); h.addEventListener('pointercancel', end);
});
// A tiny buzz (Android; iPhone web can’t) on the switcher and toggles.
document.addEventListener('change', (e) => { if (e.target.matches?.('input[type=checkbox]')) { buzz(8); sfx('toggle', { gain: 0.8 }); } });
$('nav-collection').addEventListener('click', () => buzz(8)); // no sound here (2026-10-11, Sevaan)

// "Show me": an orange target flies from the row’s icon to the circle as the panel slides away (2026-10-08 polish).
function flyToCircle(fromEl) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !fromEl) return;
  const a = fromEl.getBoundingClientRect(), rc = sky.ring ?? { x: sky.cx, y: sky.cy, r: sky.reticlePx };
  const dot = document.createElement('div'); dot.className = 'fly-dot'; document.body.append(dot);
  const x0 = a.left + a.width / 2, y0 = a.top + a.height / 2;
  dot.animate([{ transform: `translate(${x0}px, ${y0}px) scale(1)`, opacity: 1 }, { transform: `translate(${(x0 + rc.x) / 2}px, ${Math.min(y0, rc.y) - 60}px) scale(1.4)`, opacity: 1, offset: .5 }, { transform: `translate(${rc.x}px, ${rc.y}px) scale(${(rc.r * 2) / 22})`, opacity: 0 }], { duration: 620, easing: 'cubic-bezier(.5,0,.3,1)' }).onfinish = () => dot.remove();
}

// Offline caching (sw.js, 2026-10-08). Inside the app’s Collection layer the parent page has already registered it.
if ('serviceWorker' in navigator && window.parent === window && !isNative()) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));

// ---------- camera view prototype (2026-10-08) ----------
// The live rear camera behind the drawn sky. With motion sensors on, drag sideways to line the drawing up with the
// real sky (nudges the compass for the session). Field of view: the drawing’s vertical angle is matched to a typical
// phone main camera; adjust with Settings → Testing tools → Camera fit −/+ if things don’t line up.
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
$('nudge-reset')?.addEventListener('click', () => { const n = getNudge(); if (n) nudgeHeading(-n); lockHeading(false); try { localStorage.removeItem('calibInfo'); } catch {} renderDebug(); toast('Compass nudge reset to 0°.', 2000); });
// The steering line never shows as an empty pill (2026-10-08).
new MutationObserver(() => { const g = $('guidance'); if (!g.hidden && !g.textContent.trim()) g.hidden = true; }).observe($('guidance'), { attributes: true, attributeFilter: ['hidden'], childList: true, characterData: true, subtree: true });

// Camera view toggle in the header, left of the night-mode moon (2026-10-08).
// The header eye toggle was removed (2026-10-08, Sevaan); camera view stays in Settings → Testing tools.
function syncCamToggle() {}
document.addEventListener('visibilitychange', () => setTimeout(syncCamToggle, 50));

// ---------- Navigation prototypes (2026-10-21, Sevaan: "I need to actually feel it out on my phone") ----------
// Settings → Testing tools → Navigation prototype. Up in the sky, Explore and Collection as three places:
//  A · tabs: a three-part bar, Sky | Explore | Collection; the Sky tab is live (Next 0:14, Dark 6:50, N new); the sky page
//      slides in from the left, a flick left on it goes back; slide your thumb along the bar to pick (a tick per part).
//  B · lens: Sky and Collection wings either side of a raised round Explore lens; flick the lens left or right to open
//      that side; pages rise as sheets.
//  C · stack: today's two-way bar, plus a live strip at the top of Explore; tap or pull it down and the sky page drops
//      in from the top; swipe up on the page's header to put it back.
function navProto() { return 'tabs'; } // three tabs chosen (2026-10-21, Sevaan); the lens and stack prototypes below are no longer reachable
function exploreSide() { const p = navProto(); return p === 'tabs' || p === 'lens' ? 'mid' : 'left'; }
function openSky(where = 'keep') {
  if (activePanel && activePanel !== 'visible') closePanel(); buzz(8);
  if (collectionOpen) { closeCollection(); $('visible').classList.add('no-anim'); showVTab(where); openPanel('visible'); $('visible').classList.add('opened'); /* placed, not slid in: mark it open now, or the slide-in played once no-anim came off and the page rose over itself (Sevaan 2026-10-24) */ setTimeout(() => $('visible').classList.remove('no-anim'), 500); return; } // the Collection slides down to show the sky page already there
  showVTab(where); openPanel('visible');
}
// Put the sky page away without its slide (it's under the Collection by then).
function hideSkyQuietly() {
  if (activePanel !== 'visible' || !collectionOpen) return;
  const el = $('visible'); skyScroll = panelPos('visible'); skyLeftAt = Date.now(); el.hidden = true; activePanel = null; $('hud').inert = false; document.body.classList.remove('sky-open'); setPageHeader('collection');
}
function applyNavProto() {
  const p = navProto(), nav = $('nav'), three = p === 'tabs' || p === 'lens';
  document.body.classList.remove('nav-tabs', 'nav-lens', 'nav-stack'); if (p) document.body.classList.add(`nav-${p}`);
  $('nav-sky').hidden = !three; $('sky-strip').hidden = p !== 'stack';
  setSwitch(nav, collectionOpen ? 'right' : activePanel === 'visible' && three ? 'left' : exploreSide(), false);
  if (!three) nav.classList.remove('three');
  navLive();
}
$('nav-sky').addEventListener('click', () => { if (activePanel === 'visible' && !collectionOpen) { ++navSeq; setSwitch($('nav'), 'left'); return; } setSwitch($('nav'), 'left'); navLater(openSky); });
$('sky-strip').addEventListener('click', openSky);
// What's worth knowing right now, for the live Sky tab (A) and the strip (C).
function navLiveText() {
  const T = state.tonight, t0 = now().getTime(), day = (state.frame?.sunEl ?? -90) > -6, n = newUpCount();
  if (day && T?.dusk > t0) return { short: `Dark ${fmtTime(T.dusk).replace(/\s?[AP]M$/i, '')}`, long: `Dark at ${fmtTime(T.dusk)} · see tonight’s plan` };
  const nx = T ? bestUpcoming(T, t0, eveningEnd(T)) : null, m = nx ? Math.max(0, Math.round((nx.start - t0) / 1000)) : null;
  const cd = m != null && m < 3600 ? `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}` : null;
  if (cd) return { short: `Next ${cd}`, long: `${n ? `${n} new up · ` : ''}Next: ${label(nx.obj)} in ${cd}` };
  if (n) return { short: `${n} new`, long: `${n} new up now · see what’s in your sky` };
  return { short: 'Sky', long: 'See what’s up tonight' };
}
function navLive() {
  const p = navProto(); if (!p) return;
  const t = navLiveText();
  if (p === 'tabs') return; // the tab just says Your Sky, no countdown (2026-10-21, Sevaan)
  else if (p === 'lens') { const el = document.querySelector('#nav-sky .nav-sky-t'); if (el.textContent !== 'Up in the sky') el.textContent = 'Up in the sky'; }
  if (p === 'stack') { const h = `<span class="ss-dot"></span><span class="ss-t">${escapeHtml(t.long)}</span><span class="ss-c" aria-hidden="true">⌄</span>`; if ($('sky-strip').dataset.h !== h) { $('sky-strip').innerHTML = h; $('sky-strip').dataset.h = h; } }
}
setInterval(() => { if (!document.hidden && navProto()) navLive(); }, 1000);
// A · thumb-slide along the bar: a tick at each part, release picks it.
(() => {
  const nav = $('nav'); let on = false, pick = -1, sx = 0;
  const partAt = (x) => { const r = nav.getBoundingClientRect(); return Math.max(0, Math.min(2, Math.floor((x - r.left) / (r.width / 3)))); };
  nav.addEventListener('pointerdown', (e) => { if (navProto() !== 'tabs') return; on = true; sx = e.clientX; pick = partAt(e.clientX); });
  nav.addEventListener('pointermove', (e) => { if (!on || Math.abs(e.clientX - sx) < 12) return; const i = partAt(e.clientX); if (i !== pick) { pick = i; buzz('select'); setSwitch(nav, ['left', 'mid', 'right'][i]); } });
  const end = (e) => { if (!on) return; on = false; if (Math.abs(e.clientX - sx) < 12) return; e.preventDefault(); const i = partAt(e.clientX);
    if (i === 0) openSky(); else if (i === 2) { if (activePanel === 'visible') closePanel('visible'); openCollection(''); } else { if (collectionOpen) closeCollection(); else if (activePanel === 'visible') closePanel('visible'); } };
  nav.addEventListener('pointerup', end); nav.addEventListener('pointercancel', () => { on = false; });
  nav.addEventListener('click', (e) => { if (navProto() === 'tabs' && Math.abs(e.clientX - sx) >= 12) { e.preventDefault(); e.stopImmediatePropagation(); } }, true);
})();
// B · flick the lens left or right.
(() => {
  const lens = $('nav-explore'); let x0 = null;
  lens.addEventListener('touchstart', (e) => { if (navProto() === 'lens') x0 = e.touches[0].clientX; }, { passive: true });
  lens.addEventListener('touchend', (e) => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (dx < -40) { e.preventDefault(); openSky(); } else if (dx > 40) { e.preventDefault(); setSwitch($('nav'), 'right'); setTimeout(() => openCollection(''), SLIDE_MS); } });
})();
// A · on the sky page a sideways flick toward Explore (left) goes back. C · pull the strip down to open; swipe up on the page's header to close.
(() => {
  const pg = $('visible'); let x0 = null, y0 = 0;
  pg.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  pg.addEventListener('touchend', (e) => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null;
    if (navProto() === 'stack' && dy < -60 && e.target.closest('.panel-head, .sky-jump')) closePanel('visible'); });
  const st = $('sky-strip'); let sy = null;
  st.addEventListener('touchstart', (e) => { sy = e.touches[0].clientY; }, { passive: true });
  st.addEventListener('touchmove', (e) => { if (sy != null && e.touches[0].clientY - sy > 36) { sy = null; openSky(); } }, { passive: true });
})();
applyNavProto();

// ---------- Page transition prototypes (2026-10-21, Sevaan: "cool ways those pages can smoothly transition in") ----------
// Testing tools → Page transition prototype. The tap that opens a page sets where it grows from (--tx/--ty).
function trProto() { try { return localStorage.getItem('trProto') ?? ''; } catch { return ''; } }
function applyTrProto() { const t = trProto(); document.body.classList.remove('tr-iris', 'tr-zoom', 'tr-lift', 'tr-blur'); if (t) document.body.classList.add(`tr-${t}`); $('tr-proto').value = t; }
$('tr-proto').addEventListener('change', (e) => { try { localStorage.setItem('trProto', e.target.value); } catch {} applyTrProto(); });
document.addEventListener('pointerdown', (e) => { const r = document.documentElement.style; r.setProperty('--tx', `${e.clientX}px`); r.setProperty('--ty', `${e.clientY}px`); r.setProperty('--txp', `${(e.clientX / innerWidth * 100).toFixed(1)}%`); r.setProperty('--typ', `${(e.clientY / innerHeight * 100).toFixed(1)}%`); }, { capture: true, passive: true });
applyTrProto();

// Every place has its own header (2026-10-21, Sevaan): Explore "Space Collector / Collect the night sky"; the Collection
// keeps Explore's header bar but says "Your collection" with a count under it (Up in your sky has its own panel header).
function setPageHeader(page) {
  const w = document.querySelector('#sky-header .wordmark'); if (!w) return;
  let title, sub;
  if (page === 'collection') {
    const n = (() => { try { return ownedCardKeys().size; } catch { return 0; } })(), pr = (() => { try { return progressNow(state.sightings); } catch { return null; } })();
    title = 'YOUR COLLECTION'; sub = `${n.toLocaleString('en-US')} CARD${n === 1 ? '' : 'S'}${pr?.rank?.name ? ` · ${pr.rank.name.toUpperCase()}` : ''}`;
  } else if (page === 'settings') { title = 'SETTINGS'; sub = 'MAKE IT YOURS'; }
  else if (page === 'around') { title = 'ALL AROUND YOU'; sub = 'WHAT’S UP, AND WHICH WAY'; }
  else if (page === 'sky') { title = 'TONIGHT'; /* the tab and the page are "Tonight" (2026-10-21, Sevaan) */ sub = `${(state.observer.place || (state.observer.label && !/^(current|chosen) location$/i.test(state.observer.label) ? state.observer.label.replace(/^Example:\s*/, '') : 'Your sky')).toUpperCase()} · ${fmtTime(now().getTime())}`; }
  else { title = 'SPACE COLLECTOR'; sub = 'COLLECT THE NIGHT SKY'; }
  headerTo(w, title, sub);
}
// The header's words change with a quick effect (2026-10-21, Sevaan: "it just immediately switches"). Testing tools →
// Header text transition: slide (default, Sevaan's pick: old words lift away, new ones rise in), scramble (letters
// flicker into the new words), fade, or none. Reduce Motion: none.
function headerTo(w, title, sub) {
  let t = w.querySelector('.hw-t'); if (!t) { w.innerHTML = '<span class="hw-t"></span><span class="hw-s"></span>'; t = w.querySelector('.hw-t'); }
  const sEl = w.querySelector('.hw-s'), style = (() => { try { return localStorage.getItem('hdrFx') ?? 'slide'; } catch { return 'scramble'; } })();
  if (t.textContent === title && sEl.textContent === sub) return;
  cancelAnimationFrame(w._raf); w.classList.remove('hw-out', 'hw-in');
  if (!t.textContent || style === 'none' || matchMedia('(prefers-reduced-motion: reduce)').matches) { t.textContent = title; sEl.textContent = sub; return; }
  if (style === 'scramble') {
    const GL = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#*+<>/', from = [t.textContent, sEl.textContent], to = [title, sub], t0 = performance.now(), D = 360;
    const step = (now) => { const k = Math.min(1, (now - t0) / D);
      [t, sEl].forEach((el, j) => { const a = from[j], b = to[j], L = Math.max(a.length, b.length), done = Math.floor(k * (L + 6)) - 6; let out = '';
        for (let i = 0; i < L; i++) { const ch = b[i] ?? ''; out += i < done ? ch : ch === ' ' || ch === '·' ? ch : i < done + 6 ? GL[Math.floor(Math.random() * GL.length)] : (a[i] ?? ''); }
        el.textContent = k >= 1 ? b : out.replace(/\s+$/, ''); });
      if (k < 1) w._raf = requestAnimationFrame(step); };
    w._raf = requestAnimationFrame(step); return;
  }
  // The new words rise in; the old ones don't slide out with the page (2026-10-21, Sevaan).
  clearTimeout(w._t); t.textContent = title; sEl.textContent = sub; w.classList.remove('hw-in'); void w.offsetWidth; w.classList.add('hw-in', `hw-${style}`); w._t = setTimeout(() => w.classList.remove('hw-in', `hw-${style}`), 300);
}

{ const h = $('hdr-fx'); try { h.value = localStorage.getItem('hdrFx') ?? 'slide'; } catch {} h.addEventListener('change', () => { try { localStorage.setItem('hdrFx', h.value); } catch {} }); }
