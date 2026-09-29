import { VERSION } from './version.js';
import { loadCatalog, frame, look, track, motion, nextVisiblePass, compassPoint, enuFromAzEl, DARK_SUN_ELEVATION } from './orbit.js';
import { startSensors, hasLiveSensors, trueBasis, basisFromAzEl, pointing, nudgeHeading, getNudge } from './sensors.js';
import { SkyView, shortName } from './sky.js';
import { loadSky, eqToEnu, solarSystem } from './celestial.js';
import { addSighting, allSightings, deleteSighting } from './store.js';

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
  sky: null,       // stars/constellations from data/sky.json (equatorial vectors)
  skyEnu: null,    // same, rotated into the local sky, refreshed every second
  bodies: [],      // Sun, Moon, planets in the local sky
  captureAny: false,
  above: [],       // objects above horizon, refreshed every second: [{ obj, look }]
  trails: new Map(),
  sticky: new Map(), // candidate id -> last time it was in the reticle
  smooth: null,
  sightings: [],
};

const sky = new SkyView($('sky'));
$('version').textContent = `v${VERSION}`;

function now() { return new Date(Date.now() + state.timeOffsetMs); }
function isSim() { return state.timeOffsetMs !== 0 || state.drag.on || !hasLiveSensors(); }

// ---------- location ----------

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
    },
    () => {},
    { enableHighAccuracy: false, timeout: 15000, maximumAge: 10 * 60 * 1000 },
  );
}

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
function toast(html, ms = 2200) {
  $('toast').innerHTML = html;
  $('toast').hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { $('toast').hidden = true; }, ms);
}

// ---------- sky computation ----------

function refreshAbove() {
  if (!state.catalog) return;
  const d = now();
  const f = frame(d, state.observer);
  state.frame = f;
  const above = [];
  for (const obj of state.catalog.objects) {
    const l = look(obj, f);
    if (l && l.el > -2) above.push({ obj, look: l });
  }
  state.above = above;

  // Trails for visible objects: 60 s back, 3 min ahead. Refreshed every 10 s of sky time.
  for (const { obj, look: l } of above) {
    if (!l.visible && !state.showDim) continue;
    const t = state.trails.get(obj.id);
    if (t && Math.abs(d - t.at) < 10000) continue;
    state.trails.set(obj.id, { at: d.getTime(), pts: track(obj, d, state.observer, -60, 180, 10) });
  }
  refreshCelestial(d);
  updateStatus(f);
}

function refreshCelestial(d) {
  const toEnu = eqToEnu(d, state.observer);
  state.bodies = solarSystem(d, state.observer).map((b) => ({ ...b, enu: toEnu(b.v) }));
  if (!state.sky) return;
  state.skyEnu = {
    stars: state.sky.stars.map((s) => ({ ...s, enu: toEnu(s.v) })),
    lines: state.sky.lines.map((seg) => seg.map(toEnu)),
    constellations: state.sky.constellations.map((c) => ({ ...c, enu: toEnu(c.v) })),
  };
}

function updateStatus(f) {
  const visible = state.above.filter((a) => a.look.visible).length;
  const d = now();
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  $('status-main').textContent = `${visible} visible · ${time}${state.timeOffsetMs ? ' (sim)' : ''}`;

  const sub = [];
  if (f.sunEl > -0.8) sub.push('Daylight');
  else if (f.sunEl > DARK_SUN_ELEVATION) sub.push('Twilight, too bright');
  else sub.push('Dark sky');
  if (state.drag.on || !hasLiveSensors()) sub.push('drag mode');
  $('status-sub').textContent = sub.join(' · ');

  if (f.sunEl > DARK_SUN_ELEVATION && visible === 0) {
    showBanner('Sky is too bright for satellites right now. Tap ⚙ → "Jump to next visible pass" to try it out.', openDebug);
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
function tick(ts) {
  requestAnimationFrame(tick);
  if (!state.catalog || !$('start').hidden) return;
  if (ts - lastAbove > 1000) { refreshAbove(); lastAbove = ts; }

  const d = now();
  const f = frame(d, state.observer);
  const basis = currentBasis();
  state.basis = basis;
  const reticleCos = Math.cos(sky.reticleDeg * RAD);
  const t = performance.now();

  const items = [];
  for (const a of state.above) {
    const l = look(a.obj, f) ?? a.look;
    if (l.el < 0) continue;
    const trail = state.trails.get(a.obj.id);
    const pts = trail ? trail.pts.map((p) => ({ ...p, t: p.t + (trail.at - d.getTime()) / 1000 })) : null;
    const angCos = dot(enuFromAzEl(l.az, l.el), basis.back);
    const capturable = l.visible || state.captureAny;
    const inReticle = capturable && angCos > reticleCos;
    if (inReticle) state.sticky.set(a.obj.id, t);
    items.push({ obj: a.obj, look: l, trail: pts, candidate: inReticle, angCos });
  }

  // Candidates stay listed for 1.5 s after leaving the circle so the buttons don't flicker away.
  const cands = items
    .filter((it) => (it.look.visible || state.captureAny) && t - (state.sticky.get(it.obj.id) ?? -1e9) < 1500)
    .sort((a, b) => b.angCos - a.angCos)
    .slice(0, 4);
  for (const id of state.sticky.keys()) if (t - state.sticky.get(id) > 1500) state.sticky.delete(id);

  sky.draw(basis, items, {
    showDim: state.showDim,
    sky: state.showStars ? state.skyEnu : null,
    bodies: state.showStars ? state.bodies : null,
    lines: state.showLines,
  });
  renderCandidates(cands, d);
}

// ---------- candidates & capture ----------

let lastCandKey = '';
function renderCandidates(cands, d) {
  const key = cands.map((c) => c.obj.id).join(',');
  if (key === lastCandKey) return;
  if (key && !lastCandKey) chirp([880], 0.05);
  lastCandKey = key;
  $('sheet').hidden = cands.length === 0;
  $('sheet-title').textContent = cands.length > 1 ? "Which one are you watching?" : 'Is this it?';
  const box = $('candidates');
  box.innerHTML = '';
  cands.forEach((c, i) => {
    const m = motion(c.obj, d, state.observer);
    const b = document.createElement('button');
    b.className = `cand${i === 0 ? ' top' : ''}`;
    const bits = [];
    if (c.look.mag !== null) bits.push(`mag ${c.look.mag.toFixed(1)}`);
    if (m) bits.push(`moving ${m.heading}${m.rising ? ', rising' : ', sinking'}`);
    if (c.obj.year) bits.push(`${c.obj.year}`);
    if (!c.look.visible) bits.push('not visible');
    b.innerHTML = `<span><span class="name"></span><br><span class="meta"></span></span><span class="go">Capture</span>`;
    b.querySelector('.name').textContent = shortName(c.obj.name);
    b.querySelector('.meta').textContent = bits.join(' · ');
    b.addEventListener('click', () => capture(c.obj));
    box.appendChild(b);
  });
}

async function capture(obj) {
  const d = now();
  const f = frame(d, state.observer);
  const l = look(obj, f);
  const m = motion(obj, d, state.observer);
  const sighting = {
    objectId: obj.id,
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
  const before = state.sightings.some((s) => s.objectId === obj.id);
  await loadSightings();
  chirp([660, 880, 1320], 0.08);
  const age = obj.year ? `Launched ${obj.year}` : '';
  toast(`<span class="big-line">Captured!</span>${escapeHtml(shortName(obj.name))}<br><small>${age}${before ? ' · seen before' : ' · first sighting'}</small>`);
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ---------- sighting log ----------

async function loadSightings() {
  state.sightings = await allSightings();
  $('log-count').textContent = state.sightings.length;
}

function renderLog() {
  const list = $('log-list');
  list.innerHTML = '';
  if (!state.sightings.length) {
    list.innerHTML = '<div class="empty">Nothing yet. Point at a moving light and tap Capture.</div>';
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

// ---------- panels ----------

function openDebug() { renderDebug(); $('debug').hidden = false; }
$('btn-debug').addEventListener('click', openDebug);
$('btn-log').addEventListener('click', () => { renderLog(); $('log').hidden = false; });
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
  toast(`<span class="big-line">${escapeHtml(shortName(pass.obj.name))}</span>${Math.round(pass.look.el)}° up in the ${compassPoint(pass.look.az)}`);
});

function afterTimeJump() {
  state.trails.clear();
  state.sticky.clear();
  lastAbove = 0;
  refreshAbove();
  renderDebug();
}

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
    `above horizon  ${state.above.length}`,
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
  $('topbar').hidden = false;
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
  } catch (e) {
    $('start-note').textContent = `Couldn't load satellite data: ${e.message}`;
    return;
  }
  try { state.sky = await loadSky('data/sky.json'); } catch {}
  await loadSightings();
  checkForUpdate();
  requestAnimationFrame(tick);
}
boot();
