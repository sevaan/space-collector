// spacecollector.app v2 engine (2026-10-16, design/website-plan.md v2), shared by the design options.
// Tonight's real sky for the visitor's city (from their time zone, no permission), replayed fast with a ticking clock;
// slide the sky sideways to bring the pass under the app's fixed circle; it turns orange, locks, Collect, and the real
// card flips out of a sealed one. Data: /tonight/<city>.json (scripts/build-tonight.mjs), /cards/<key>.webp
// (scripts/render-site-cards.mjs), /sky.json (the app's star chart). No orbit maths here: the build sampled each path.
const RAD = Math.PI / 180, still = matchMedia('(prefers-reduced-motion: reduce)').matches;
const BASE = new URL('..', import.meta.url).href; // site root (works in /v2/ and in artifacts)

// ---------- data ----------
export async function loadTonight(file = null) {
  const index = await (await fetch(BASE + 'tonight/index.json')).json(); // { tz: [file, city] }
  const cities = Object.values(index).sort((a, b) => a[1].localeCompare(b[1]));
  let tz = ''; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch {}
  const guess = index[tz]?.[0] ?? 'toronto';
  const pick = file ?? guess;
  const data = await (await fetch(`${BASE}tonight/${pick}.json`)).json();
  return { data, cities, guessed: !file && !!index[tz], file: pick };
}
export const time = (t, tz, opts = {}) => new Date(t).toLocaleTimeString([], { timeZone: tz, hour: 'numeric', minute: '2-digit', ...opts });
export const about = (t, tz) => time(Math.round(t / 300000) * 300000, tz); // "about 9:40": nearest 5 minutes
// The pass to show now: tonight's headliner, or the next good one if it's over, or null.
export function passNow(d, now = Date.now()) {
  const list = [d.head, ...(d.more ?? [])].filter(Boolean);
  const next = list.find((p) => p.end > now); if (next) return next;
  return d.head ? { ...d.head, over: true } : null; // all passed: still show tonight's best, marked as over
}
export const cardImg = (p) => `${BASE}cards/${p.key}.webp`;
export const TIER = { common: ['●', 'Common', '#9aa4b1'], uncommon: ['▲', 'Uncommon', '#5fd08a'], rare: ['◆', 'Rare', '#4aa8ff'], epic: ['✦', 'Epic', '#e46ad6'], legendary: ['★', 'Legendary', '#ffc545'] };
export const brightWord = (m) => (m <= 1.5 ? 'very bright' : m <= 3 ? 'bright' : 'easy to see');
export const highWord = (el) => (el >= 70 ? 'almost straight overhead' : el >= 45 ? 'high' : 'halfway up');
// Weather for the pass hour (Open-Meteo, no key). Resolves { cloudy, cover } or null when it can't tell.
export async function weatherAt(d, t) {
  try {
    const r = await (await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${d.lat}&longitude=${d.lon}&hourly=cloud_cover&forecast_days=3&timezone=UTC`)).json();
    const i = r.hourly.time.findIndex((x) => Date.parse(x + 'Z') > t - 3600e3); if (i < 0) return null;
    const cover = r.hourly.cloud_cover[i]; return { cloudy: cover >= 60, cover };
  } catch { return null; }
}

// ---------- sky ----------
let SKY = null;
async function sky() { return (SKY ??= fetch(BASE + 'sky.json').then((r) => r.json())); }
const gmst = (t) => ((280.46061837 + 360.98564736629 * (t / 86400000 + 2440587.5 - 2451545)) % 360 + 360) % 360;
function eqToAzEl(ra, dec, lat, lst) {
  const H = (lst - ra) * RAD, d = dec * RAD, la = lat * RAD;
  const el = Math.asin(Math.sin(d) * Math.sin(la) + Math.cos(d) * Math.cos(la) * Math.cos(H));
  const az = Math.atan2(-Math.sin(H) * Math.cos(d), Math.cos(la) * Math.sin(d) - Math.sin(la) * Math.cos(d) * Math.cos(H));
  return [(az / RAD + 360) % 360, el / RAD];
}
const enu = (az, el) => [Math.cos(el * RAD) * Math.sin(az * RAD), Math.cos(el * RAD) * Math.cos(az * RAD), Math.sin(el * RAD)];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => { const l = Math.hypot(...a); return a.map((x) => x / l); };

// createSky(host, { data, pass, onLock(on), onCollect(), onClock(t) }) → { catchForMe(), destroy() }
export async function createSky(host, o) {
  const { data, pass } = o, chart = await sky();
  const cv = document.createElement('canvas'); cv.className = 'sk-canvas'; cv.setAttribute('aria-hidden', 'true'); host.prepend(cv);
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, DPR = 1, f = 1;
  const FOV = 64; // vertical, degrees
  const size = () => { DPR = Math.min(2, devicePixelRatio || 1); W = host.clientWidth; H = host.clientHeight; cv.width = W * DPR; cv.height = H * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0); f = (H / 2) / Math.tan(FOV / 2 * RAD); };
  size(); const ro = new ResizeObserver(size); ro.observe(host);
  const lst = gmst(pass.peakAt) + data.lon;
  const stars = chart.stars.filter((s) => s[2] <= 4.6).map(([ra, dec, mag]) => { const [az, el] = eqToAzEl(ra, dec, data.lat, lst); return { v: enu(az, el), mag }; }).filter((s) => s.v[2] > -0.05);
  const lines = chart.lines.map((l) => l.map(([ra, dec]) => enu(...eqToAzEl(ra, dec, data.lat, lst))));
  const path = pass.path.map(([t, az, el, lit]) => ({ t, v: enu(az, el), lit })), T0 = path[0].t, T1 = path.at(-1).t;
  // Centre the view on a point the pass really goes through, at most 60° up (an overhead pass is aimed at on its way up),
  // so at yaw 0 the satellite crosses the middle of the circle.
  const aim = pass.path.filter((p) => p[3]).reduce((a, p) => (Math.abs(p[2] - Math.min(60, pass.peakEl)) < Math.abs(a[2] - Math.min(60, pass.peakEl)) ? p : a), pass.path[0]);
  const azC = aim[1], elC = aim[2], aimT = aim[0];
  let yaw = still ? 0 : 24, yawGoal = null, dragX = null, interacted = false;
  const R = () => Math.max(40, (H / 2) * Math.tan(6 * RAD) / Math.tan(35 * RAD) * 1.1);
  const basis = () => { const fwd = enu(azC + yaw, elC), right = norm(cross(fwd, [0, 0, 1])), up = cross(right, fwd); return { fwd, right, up }; };
  const proj = (v, b) => { const z = dot(v, b.fwd); if (z < 0.15) return null; return [W / 2 + dot(v, b.right) / z * f, H / 2 - dot(v, b.up) / z * f]; };
  // Replay: the real pass at speed (about 6 s across); the clock shows real time. Reduced motion: it waits at the peak.
  const SPEED = (T1 - T0) / 7, peakT = aimT;
  let t0 = performance.now(), locked = false, lockSince = 0, collected = false, raf = 0, visible = true;
  const tNow = () => (still ? peakT : T0 + ((performance.now() - t0) / 1000) * SPEED);
  const posAt = (t) => { let i = path.findIndex((p) => p.t >= t); if (i <= 0) i = 1; const a = path[i - 1], b = path[i] ?? a, k = b.t === a.t ? 0 : Math.max(0, Math.min(1, (t - a.t) / (b.t - a.t))); return { v: norm([0, 1, 2].map((j) => a.v[j] + (b.v[j] - a.v[j]) * k)), lit: k < 0.5 ? a.lit : b.lit }; };
  host.style.touchAction = 'pan-y'; // sideways drags turn the sky; up and down always scroll the page
  const down = (e) => { dragX = e.clientX; interacted = true; yawGoal = null; };
  const move = (e) => { if (dragX == null) return; const dx = e.clientX - dragX; dragX = e.clientX; yaw -= dx * (FOV / H); };
  const up = () => { dragX = null; };
  host.addEventListener('pointerdown', down); addEventListener('pointermove', move); addEventListener('pointerup', up); addEventListener('pointercancel', up);
  host.tabIndex = 0; host.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') { yaw += 3; e.preventDefault(); } if (e.key === 'ArrowRight') { yaw -= 3; e.preventDefault(); } });
  const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(frame); }); io.observe(host);
  function frame(now) {
    raf = 0; if (!visible) return;
    if (yawGoal != null) { yaw += (yawGoal - yaw) * 0.12; if (Math.abs(yaw - yawGoal) < 0.05) { yaw = yawGoal; yawGoal = null; } }
    let t = tNow(); if (t > T1 + 1.2 * SPEED && !collected) { t0 = now; t = T0; }
    o.onClock?.(pass.start + t * 1000);
    const b = basis();
    // sky
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#060c18'); g.addColorStop(1, '#122338'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(173,188,200,.16)'; ctx.lineWidth = 1;
    for (const l of lines) { ctx.beginPath(); let pen = false; for (const v of l) { const p = proj(v, b); if (!p) { pen = false; continue; } pen ? ctx.lineTo(...p) : ctx.moveTo(...p); pen = true; } ctx.stroke(); }
    for (const s of stars) { const p = proj(s.v, b); if (!p || p[0] < -4 || p[0] > W + 4 || p[1] < -4 || p[1] > H + 4) continue; const r = Math.max(0.5, 2.1 - s.mag * 0.36); ctx.fillStyle = `rgba(255,248,226,${Math.min(1, 1.15 - s.mag * 0.16)})`; ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, 6.283); ctx.fill(); }
    // horizon and tree line
    const hz = []; for (let a = -70; a <= 70; a += 5) { const p = proj(enu(azC + yaw + a, 0), b); if (p) hz.push(p); }
    if (hz.length > 1) { ctx.fillStyle = '#050a12'; ctx.beginPath(); ctx.moveTo(hz[0][0], H + 10); for (const [x, y] of hz) ctx.lineTo(x, y); ctx.lineTo(hz.at(-1)[0], H + 10); ctx.fill();
      ctx.fillStyle = '#04080f'; let s = 7; for (const [x, y] of hz) { for (let k = 0; k < 3; k++) { s = (s * 16807) % 2147483647; const tx = x + (s % 40) - 20, th = 10 + (s % 22); ctx.beginPath(); ctx.moveTo(tx - th * 0.3, y + 2); ctx.lineTo(tx, y - th); ctx.lineTo(tx + th * 0.3, y + 2); ctx.fill(); } } }
    // the pass: faint behind, orange dashes ahead
    const here = posAt(t), behind = [], ahead = [];
    for (const p of path) { const q = proj(p.v, b); if (!q) continue; (p.t <= t ? behind : ahead).push(q); }
    const hp = proj(here.v, b);
    ctx.lineWidth = 1.4; ctx.setLineDash([]); ctx.strokeStyle = 'rgba(255,242,179,.22)'; ctx.beginPath(); behind.slice(-12).forEach((q, i) => (i ? ctx.lineTo(...q) : ctx.moveTo(...q))); if (hp) ctx.lineTo(...hp); ctx.stroke();
    ctx.setLineDash([4, 7]); ctx.strokeStyle = 'rgba(250,129,39,.6)'; ctx.beginPath(); if (hp) ctx.moveTo(...hp); ahead.slice(0, 14).forEach((q) => ctx.lineTo(...q)); ctx.stroke(); ctx.setLineDash([]);
    if (hp && here.lit) { const gl = ctx.createRadialGradient(hp[0], hp[1], 0, hp[0], hp[1], 10); gl.addColorStop(0, '#fff'); gl.addColorStop(0.35, 'rgba(255,242,179,.6)'); gl.addColorStop(1, 'rgba(255,242,179,0)'); ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(hp[0], hp[1], 10, 0, 6.283); ctx.fill(); }
    // the circle (the app's reticle)
    const r = R(), cx = W / 2, cy = H / 2, inside = hp && here.lit && Math.hypot(hp[0] - cx, hp[1] - cy) < r - 4;
    if (inside && !locked) { if (!lockSince) lockSince = now; if (now - lockSince > 350) { locked = true; o.onLock?.(true); } } else if (!inside) { lockSince = 0; if (locked && !collected) { locked = false; o.onLock?.(false); } }
    const ink = locked ? '#fa8127' : 'rgba(255,242,179,.7)';
    ctx.strokeStyle = ink; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.283); ctx.stroke();
    ctx.strokeStyle = 'rgba(173,188,200,.35)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(cx, cy, r + 5, 0, 6.283); ctx.stroke();
    for (let a = 0; a < 360; a += 15) { const c = a % 90 === 0, i = r + 5, oo = r + (c ? 13 : 9), x = Math.cos(a * RAD), y = Math.sin(a * RAD); ctx.strokeStyle = c ? '#fa8127' : 'rgba(255,242,179,.4)'; ctx.lineWidth = c ? 1.5 : 0.75; ctx.beginPath(); ctx.moveTo(cx + x * i, cy + y * i); ctx.lineTo(cx + x * oo, cy + y * oo); ctx.stroke(); }
    if (locked && hp) { const k = Math.min(1, (now - lockSince) / 600); ctx.strokeStyle = `rgba(250,129,39,${(1 - k) * 0.7})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, r + 6 + k * 20, 0, 6.283); ctx.stroke(); ctx.strokeStyle = '#fa8127'; ctx.beginPath(); ctx.arc(hp[0], hp[1], 12, 0, 6.283); ctx.stroke(); }
    if (!collected || !still) raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return {
    catchForMe() { interacted = true; yawGoal = 0; t0 = performance.now() - ((peakT - T0 - 1.6) / SPEED) * 1000; },
    collected() { collected = true; },
    get interacted() { return interacted; },
    radius: R,
    destroy() { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); removeEventListener('pointermove', move); removeEventListener('pointerup', up); cv.remove(); },
  };
}

// ---------- the reveal: a sealed card shakes, then flips to the real card ----------
export function reveal(host, pass, { back = BASE + 'backs/back-collector.webp' } = {}) {
  const [gem, label, color] = TIER[pass.tier] ?? TIER.common;
  const el = document.createElement('div'); el.className = 'rv'; el.style.setProperty('--tier', color);
  el.innerHTML = `<div class="rv-card"><div class="rv-in"><img class="rv-back" src="${back}" alt=""><img class="rv-front" src="${cardImg(pass)}" alt="${pass.name}, ${label}. ${pass.fact.replace(/\*\*/g, '')}"></div></div>`;
  host.append(el);
  const inner = el.querySelector('.rv-in');
  if (still) { inner.classList.add('flipped'); return Promise.resolve(el); }
  return new Promise((done) => {
    requestAnimationFrame(() => el.classList.add('in'));
    setTimeout(() => el.classList.add('shake'), 380);
    setTimeout(() => { inner.classList.add('flipped'); done(el); }, 1250);
  });
}
