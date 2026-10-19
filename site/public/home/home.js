// The homepage's sky (2026-10-19, Sevaan): the game's own SkyView, SkyModel and star chart (site/public/play/js,
// copied from the app by scripts/build-site-game.mjs) behind the page. The view holds still and drifts slowly; the
// target circle follows the mouse and names what's in it (satellites, rocket stages, debris, planets, stars) like the
// app's circle. Once in a while a UFO crosses. On touch screens, or when the mouse rests, the circle tours on its own.
import { SkyView } from '../play/js/sky.js';
import { loadCatalog, frame, enuFromAzEl, SkyModel, setSkyLimit } from '../play/js/orbit.js';
import { loadSky, eqToEnu, solarSystem, milkyWayModel, galAxes } from '../play/js/celestial.js';
import { naturalTargets } from '../play/js/natural.js';
import { skyLimit } from '../play/js/sky-limit.js';
import { loadLore, titleFor, roleOf, ownerWord } from '../play/js/lore.js';
import { placeFromTimeZone } from '../play/js/tz-places.js';
import { TIER_INFO } from '../play/js/rarity.js';
import { sfx, unlockAudio } from './audio.js';

const RAD = Math.PI / 180, $ = (id) => document.getElementById(id);
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
const place = (() => { const p = placeFromTimeZone(); return p ? { lat: p.lat, lon: p.lon, city: p.label.replace(/^Example:\s*/, '') } : { lat: 43.65, lon: -79.38, city: 'Toronto' }; })();
const observer = { lat: place.lat, lon: place.lon, heightKm: 0.1 };

const sky = new SkyView($('sky'));
sky.setTheme('glass'); sky.showShadow = false;
const state = { offset: 0, model: null, bodies: null, skyEnu: null, milkyEnu: null, limit: null, frame: null, az: 160, el: 42 };
const now = () => new Date(Date.now() + state.offset);
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
function basisFromAzEl(az, el) { // as js/sensors.js
  const a = az * RAD, e = el * RAD, back = [Math.cos(e) * Math.sin(a), Math.cos(e) * Math.cos(a), Math.sin(e)], right = [Math.cos(a), -Math.sin(a), 0];
  const up = [back[1] * right[2] - back[2] * right[1], back[2] * right[0] - back[0] * right[2], back[0] * right[1] - back[1] * right[0]];
  if (up[2] < 0) { up[0] = -up[0]; up[1] = -up[1]; up[2] = -up[2]; }
  return { right, up, back };
}
const label = (o) => (o._label ??= titleFor(o));
const idOf = (o) => o.id ?? o.key;

// If it's light out where you are, show tonight: the first moment the sky is properly dark, plus a little.
function pickTime() {
  const t0 = Date.now(); if (frame(new Date(t0), observer).sunEl < -10) return 0;
  for (let m = 10; m < 24 * 60; m += 10) if (frame(new Date(t0 + m * 60000), observer).sunEl < -12) return (m + 30) * 60000;
  return 0;
}

let milkyEq = null, skyData = null;
function refresh() {
  const d = now(), f = frame(d, observer), toEnu = eqToEnu(d, observer);
  state.frame = f;
  state.bodies = solarSystem(d, observer).map((b) => ({ ...b, enu: toEnu(b.v) }));
  const gl = sky.mwGL?.ready;
  state.milkyEnu = { spine: milkyEq.spine.map((p) => ({ enu: toEnu(p.v), width: p.width, bright: p.bright })),
    specks: gl ? [] : milkyEq.specks.map((p) => ({ enu: toEnu(p.v), a: p.a, s: p.s, w: p.w })),
    rift: gl ? [] : milkyEq.rift.map((p) => ({ enu: toEnu(p.v), w: p.w, a: p.a })),
    clouds: gl ? [] : milkyEq.clouds.map((p) => ({ enu: toEnu(p.v), r: p.r, a: p.a })), gal: galAxes().map(toEnu) };
  if (skyData) state.skyEnu = { stars: skyData.stars.map((s) => ({ ...s, enu: toEnu(s.v) })), lines: skyData.lines.map((seg) => seg.map(toEnu)), constellations: skyData.constellations.map((c) => ({ ...c, enu: toEnu(c.v) })) };
  const moon = state.bodies.find((b) => b.kind === 'moon'), moonEl = moon ? Math.asin(Math.max(-1, Math.min(1, moon.enu[2]))) / RAD : -90;
  state.limit = skyLimit({ sb: 23.4, sunEl: f.sunEl, moonEl, moonIllum: moon?.illum ?? 0 }); /* a dark site, plus a little: a lively sky */ setSkyLimit(state.limit);
}

// ---- where the circle is: the mouse, or the tour ----
const aim = { x: innerWidth * 0.5, y: innerHeight * 0.5, tx: innerWidth * 0.5, ty: innerHeight * 0.5, mouseAt: 0, overUI: false, alpha: 0, tour: null, tourAt: 0 };
const hasMouse = matchMedia('(hover: hover) and (pointer: fine)').matches;
let boxes = null; // the words and the card, measured on load, resize and scroll
const uiBoxes = () => (boxes ??= [...document.querySelectorAll('[data-ui]')].map((el) => el.getBoundingClientRect()));
for (const ev of ['resize', 'scroll', 'load']) addEventListener(ev, () => { boxes = null; }, { passive: true });
const inBox = (x, y, pad = 0) => uiBoxes().some((r) => x > r.left - pad && x < r.right + pad && y > r.top - pad && y < r.bottom + pad);
addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse') return;
  aim.tx = e.clientX; aim.ty = e.clientY; aim.mouseAt = performance.now(); aim.tour = null;
  aim.overUI = !!e.target.closest?.('[data-ui], a, button');
});
document.addEventListener('mouseleave', () => { aim.mouseAt = 0; });
const touring = () => !hasMouse || performance.now() - aim.mouseAt > 5000;

// Pick something for the tour: on screen, in open sky (not behind the words or the card), a different kind each time.
let lastKind = '';
function pickTour(items, ufo) {
  if (ufo?.p && !inBox(ufo.p.x, ufo.p.y, 60)) return { ufo: true };
  const pad = 70, ok = items.filter((it) => it.p && it.p.x > pad && it.p.x < sky.w - pad && it.p.y > 170 && it.p.y < sky.h - 90 && !inBox(it.p.x, it.p.y, sky.reticlePx + 110)); // room for the label too
  if (!ok.length) return null;
  const fresh = ok.filter((it) => (it.obj.type ?? it.obj.natural) !== lastKind && idOf(it.obj) !== aim.tour?.id);
  const pool = fresh.length ? fresh : ok, pick = pool[Math.floor(Math.random() * pool.length)];
  lastKind = pick.obj.type ?? pick.obj.natural; return { id: idOf(pick.obj) };
}

// ---- the UFO: every minute or two, a 24-second crossing through the part of the sky you're looking at ----
let ufo = null, ufoNext = performance.now() + (location.search.includes('ufo') ? 3000 : 25000 + Math.random() * 25000), ufoHeard = false; // ?ufo: one straight away (testing)
function ufoAt(t) {
  if (!ufo && t > ufoNext && !document.hidden) { ufo = { start: t, end: t + 24000, az0: state.az - 55 + Math.random() * 20, dir: Math.random() < 0.5 ? 1 : -1, peak: state.el + 20 + Math.random() * 5 }; /* high, above the words and the card */ ufoHeard = false; }
  if (!ufo) return null;
  if (t > ufo.end) { ufo = null; ufoNext = t + 60000 + Math.random() * 60000; return null; }
  const k = (t - ufo.start) / (ufo.end - ufo.start), az = ufo.dir > 0 ? ufo.az0 + 110 * k : ufo.az0 + 110 * (1 - k), el = ufo.peak - 12 + 12 * Math.sin(Math.PI * k);
  return { enu: enuFromAzEl((az + 360) % 360, el) };
}

// ---- the label: what's in the circle, like the app's ---
const ui = { box: $('find'), tier: $('f-tier'), name: $('f-name'), kind: $('f-kind') };
function kindLine(o) {
  if (o.natural === 'star') return 'Star';
  if (o.natural === 'planet') return 'Planet';
  if (o.natural === 'moon') return "Earth's Moon";
  const y = o.year ?? (o.launch ? +String(o.launch).slice(0, 4) : null), who = ownerWord(o.owner, y);
  const what = o.type === 'rocket-body' ? 'Rocket stage' : o.type === 'debris' ? 'Space debris' : o.type === 'station' ? 'Space station' : roleOf(o);
  return [who ? `${who} ${what.toLowerCase()}` : what, y ? `launched ${y}` : ''].filter(Boolean).join(' · ').replace(/^./, (c) => c.toUpperCase());
}
let shownKey = '';
function renderLabel(tg, ufoIn, alpha) {
  const r = sky.reticlePx;
  ui.box.style.cssText = `--x:${aim.x}px; --y:${aim.y}px; --r:${r}px; opacity:${alpha.toFixed(2)}`;
  ui.box.classList.toggle('below', aim.y - r < 110); // no room above the circle: the name goes under it
  const key = ufoIn ? 'ufo' : tg ? idOf(tg.obj) : '';
  if (key === shownKey) return; shownKey = key;
  ui.box.classList.toggle('on', !!key); ui.box.classList.toggle('ufo', ufoIn);
  if (!key) return;
  if (ufoIn) { ui.tier.textContent = '✦ Unidentified'; ui.name.textContent = '???'; ui.kind.textContent = 'Not in any catalogue'; ui.box.style.setProperty('--tier', '#7dff8a'); return; }
  const o = tg.obj, info = TIER_INFO[o.tier] ?? TIER_INFO.common;
  ui.tier.textContent = `${info.gem} ${info.label}`; ui.box.style.setProperty('--tier', info.color);
  ui.name.textContent = label(o); ui.kind.textContent = kindLine(o);
}

// The game's circle is drawn at the view's centre; here it's drawn where the mouse is.
const drawReticle = sky.drawReticle.bind(sky);
sky.drawReticle = (...a) => {
  const cx = sky.cx, cy = sky.cy, ctx = sky.ctx; sky.cx = aim.x; sky.cy = aim.y; ctx.save(); ctx.globalAlpha = aim.alpha;
  try { return drawReticle(...a); } finally { ctx.restore(); sky.cx = cx; sky.cy = cy; }
};

// ---- the loop ----
let lastRefresh = 0, lockedId = null, lastLockSound = 0, last = performance.now();
function tick(ts) {
  requestAnimationFrame(tick);
  if (!state.model || document.hidden) return;
  const d = now(), t = performance.now(), dt = Math.min(0.1, (t - last) / 1000); last = t;
  if (!still) state.az = (state.az + dt * 0.35) % 360; // a slow drift, so the sky turns past
  state.model.update(d, observer);
  if (ts - lastRefresh > 1000) { refresh(); lastRefresh = ts; }
  const basis = basisFromAzEl(state.az, state.el); sky.basis = basis;
  sky.cx = sky.w / 2; sky.cy = sky.h / 2;
  const sats = state.model.items(d).filter((a) => a.look.visible).map((a) => ({ obj: a.obj, look: a.look, enu: enuFromAzEl(a.look.az, a.look.el) }));
  const nats = naturalTargets(state.bodies, state.skyEnu?.stars, [], state.limit?.stars ?? 5).filter((n) => n.look.visible && n.obj.key !== 'earth' && n.obj.natural !== 'sun').map((n) => ({ obj: n.obj, look: n.look, enu: n.look.enu }));
  for (const it of sats) it.p = sky.project(it.enu);
  const u = ufoAt(t); if (u) u.p = sky.project(u.enu);

  // Where the circle goes.
  if (touring()) {
    if (!aim.tour || t - aim.tourAt > 7000 || (u?.p && !aim.tour.ufo && !inBox(u.p.x, u.p.y, 60))) { aim.tour = pickTour(sats, u); aim.tourAt = t; } // the UFO takes over the tour
    const f = aim.tour?.ufo ? u : sats.find((s) => idOf(s.obj) === aim.tour?.id);
    if (f?.p && !inBox(f.p.x, f.p.y, 40)) { aim.tx = f.p.x; aim.ty = f.p.y; } else if (aim.tour) aim.tourAt = -1e9; // gone: pick again
  }
  const k = still ? 1 : touring() ? 0.06 : 0.35;
  aim.x += (aim.tx - aim.x) * k; aim.y += (aim.ty - aim.y) * k;
  const wantA = aim.overUI || inBox(aim.x, aim.y, sky.reticlePx + 80) ? 0 : (aim.mouseAt || !hasMouse || touring()) ? 1 : 0; // never over the words or the card
  aim.alpha += (wantA - aim.alpha) * (still ? 1 : 0.15);

  // What's in it: the mouse's own line of sight, the app's 6° circle; a satellite before a star.
  const ray = norm([basis.right[0] * (aim.x - sky.cx) / sky.f + basis.up[0] * (sky.cy - aim.y) / sky.f + basis.back[0],
    basis.right[1] * (aim.x - sky.cx) / sky.f + basis.up[1] * (sky.cy - aim.y) / sky.f + basis.back[1],
    basis.right[2] * (aim.x - sky.cx) / sky.f + basis.up[2] * (sky.cy - aim.y) / sky.f + basis.back[2]]);
  const rc = Math.cos(sky.reticleDeg * RAD), score = (it) => Math.acos(Math.min(1, it.angCos)) / RAD - (it.obj.natural ? 0 : 0.6) - (idOf(it.obj) === lockedId ? 0.8 : 0);
  const named = aim.alpha > 0.5; // no names in the sky while the circle is hidden (they'd sit behind the words)
  const items = sats.map((s) => { const angCos = dot(s.enu, ray); return { obj: s.obj, label: named ? label(s.obj) : '', look: s.look, candidate: angCos > rc, angCos }; });
  const nItems = nats.map((n) => { const angCos = dot(n.enu, ray); return { obj: n.obj, label: label(n.obj), look: n.look, candidate: angCos > rc, angCos }; });
  const ufoIn = !!u && aim.alpha > 0.5 && dot(u.enu, ray) > Math.cos((sky.reticleDeg + 1) * RAD);
  const target = aim.alpha > 0.5 && !ufoIn ? [...items, ...nItems].filter((it) => it.candidate).sort((a, b) => score(a) - score(b))[0] ?? null : null;
  const id = ufoIn ? 'ufo' : target ? idOf(target.obj) : null;
  if (id && id !== lockedId) { sky.lockPulseAt = t; if (t - lastLockSound > 400) { sfx(ufoIn ? 'ufo' : 'lock'); lastLockSound = t; } }
  lockedId = id;
  if (ufoIn && !ufoHeard) ufoHeard = true;

  sky.draw(basis, items, {
    showDim: false, sky: state.skyEnu, starLimit: state.limit?.stars, sunEl: state.frame?.sunEl ?? -90, bodies: state.bodies, milky: state.milkyEnu, lines: true,
    targetId: target && !target.obj.natural ? target.obj.id : null, lockedOn: !!target || ufoIn, naturalTarget: target?.obj.natural ? target.look.enu : null, naturalTargetName: target?.obj.natural ? label(target.obj) : null,
    newFind: !!target, time: t, safeTop: 0, safeBottom: 0, centerY: sky.h / 2, ufo: u ? { enu: u.enu, inCircle: ufoIn } : null,
  });
  renderLabel(target, ufoIn, aim.alpha);
}

(async () => {
  await loadLore('/play/data/lore.json');
  const cat = await loadCatalog('/play/data/catalog-home.json');
  try { skyData = await loadSky('/play/data/sky.json'); } catch {}
  milkyEq = milkyWayModel();
  state.offset = pickTime();
  state.model = new SkyModel(cat.objects);
  state.model.update(now(), observer); refresh();
  // Face the busiest part of the sky above 25°.
  const up = state.model.items(now()).filter((a) => a.look.visible && a.look.el > 25);
  if (up.length) { let best = 0, bn = -1; for (let a = 0; a < 360; a += 15) { const n = up.filter((s) => Math.abs(((s.look.az - a + 540) % 360) - 180) < 40).length; if (n > bn) { bn = n; best = a; } } state.az = best; }
  sky.warmMilky();
  const when = now().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  $('when').textContent = state.offset ? `The sky over ${place.city} tonight · ${when}` : `The sky over ${place.city} right now`;
  document.body.classList.add('sky-ready');
  requestAnimationFrame(tick);
})().catch((e) => { console.error(e); });

addEventListener('pointerdown', unlockAudio, { capture: true });
addEventListener('keydown', unlockAudio, { capture: true });
