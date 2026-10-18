// v4 hero (2026-10-18, Sevaan): the first screen is the game's sky. Satellites, stations, rocket stages and a plane
// drift across; move the circle onto one (mouse) or tap it (touch), it locks on, Collect, and the welcome card turns
// over to explain the game. Later catches turn over that object's real card. Icons are the app's own (js/sky.js drawIcon).
const $ = (id) => document.getElementById(id);
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
const TIER = { common: ['●', 'Common', '#9aa4b1'], uncommon: ['▲', 'Uncommon', '#5fd08a'], rare: ['◆', 'Rare', '#4aa8ff'], epic: ['✦', 'Epic', '#e46ad6'], legendary: ['★', 'Legendary', '#ffc545'] };
const ROSTER = [
  { name: 'International Space Station', kind: 'station', tier: 'rare', img: '/assets/iss.webp', up: '420 km up', size: 22, speed: 1.15 },
  { name: 'Hubble Space Telescope', kind: 'sat', tier: 'rare', img: '/cards/20580.webp', up: '530 km up' },
  { name: 'Tiangong Space Station', kind: 'station', tier: 'rare', img: '/cards/48274.webp', up: '380 km up', size: 19, speed: 1.2 },
  { name: 'SL-8 Rocket Stage', kind: 'rocket', tier: 'uncommon', img: '/cards/6683.webp', up: '760 km up' },
  { name: 'Landsat 1', kind: 'sat', tier: 'uncommon', img: '/cards/6126.webp', up: '900 km up' },
  { name: 'NuSTAR', kind: 'flat', tier: 'epic', img: '/cards/38358.webp', up: '600 km up' },
  { name: 'Thor-Delta Rocket Stage', kind: 'rocket', tier: 'legendary', img: '/cards/9330.webp', up: '1,000 km up', speed: 0.8 },
  { name: 'TIROS 1', kind: 'sat', tier: 'rare', img: '/cards/29.webp', up: '690 km up' },
  { name: 'Cosmos 726', kind: 'sat', tier: 'uncommon', img: '/cards/7736.webp', up: '800 km up' },
];
const PLANE = { name: 'Just a plane', kind: 'plane', plane: true, note: 'Blinking lights mean a plane. Satellites never blink.' };

const hero = $('hero'), cv = $('field'), ctx = cv.getContext('2d');
let W = 0, H = 0, DPR = 1, R = 46, stars = [], trees = [];
let objs = [], caught = 0, seen = new Set(), planeAt = 3, last = 0, raf = 0, onScreen = true, open = false;
const ret = { x: 0, y: 0, tx: 0, ty: 0, follow: null }, lock = { obj: null, since: 0, on: false, at: 0 };
const ui = { box: $('lock-ui'), tier: $('lk-tier'), name: $('lk-name'), collect: $('h-collect'), hint: $('hint'), count: $('count') };
const rnd = (a, b) => a + Math.random() * (b - a);

function size() {
  DPR = Math.min(2, devicePixelRatio || 1); W = hero.clientWidth; H = hero.clientHeight;
  cv.width = W * DPR; cv.height = H * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  R = W < 600 ? 46 : 56;
  stars = Array.from({ length: Math.min(420, Math.round(W * H / 2400)) }, () => ({ x: Math.random() * W, y: Math.random() * (H - 50), r: Math.random() < 0.08 ? rnd(1.1, 1.7) : rnd(0.4, 1), a: rnd(0.35, 1), p: rnd(0, 6.28), s: rnd(0.6, 1.8) }));
  trees = []; let s = 11; for (let x = -10; x < W + 20; x += 7) { s = (s * 16807) % 2147483647; trees.push([x + (s % 9), 14 + (s % 30)]); }
  if (!ret.x) { ret.x = ret.tx = W * 0.5; ret.y = ret.ty = H * (W < 600 ? 0.5 : 0.52); }
}

// A path across the sky: in from one edge, out of another, at a satellite's steady pace.
function launch(o, mid = false) {
  const side = Math.floor(Math.random() * 3), m = 40;
  let x0, y0, x1, y1;
  if (side === 0) { x0 = -m; y0 = rnd(H * 0.12, H * 0.7); x1 = W + m; y1 = rnd(H * 0.05, H * 0.6); }
  else if (side === 1) { x0 = W + m; y0 = rnd(H * 0.12, H * 0.7); x1 = -m; y1 = rnd(H * 0.05, H * 0.6); }
  else { x0 = rnd(W * 0.1, W * 0.9); y0 = H - 40; x1 = rnd(-m, W + m); y1 = -m; }
  const d = Math.hypot(x1 - x0, y1 - y0), secs = (o.plane ? rnd(9, 13) : rnd(16, 30) / (o.speed ?? 1)) * (still ? 2.2 : 1);
  Object.assign(o, { x: x0, y: y0, vx: (x1 - x0) / secs, vy: (y1 - y0) / secs, len: d, gone: false, born: performance.now() });
  if (mid) { const k = rnd(0.15, 0.7); o.x += (x1 - x0) * k; o.y += (y1 - y0) * k; }
  return o;
}
function pickNext() {
  const left = ROSTER.filter((r) => !seen.has(r.name) && !objs.some((o) => o.name === r.name));
  const pool = left.length ? left : ROSTER.filter((r) => !objs.some((o) => o.name === r.name));
  return pool.length ? { ...pool[Math.floor(Math.random() * pool.length)] } : null;
}
function seed() {
  objs = [];
  const n = W < 600 ? 5 : 7;
  for (let i = 0; i < n; i++) { const r = pickNext(); if (r) objs.push(launch(r, true)); }
  // One drifts through the circle's neighbourhood soon, so the game shows itself.
  const o = objs[0]; if (o) { o.x = ret.x - o.vx * 3; o.y = ret.y - o.vy * 3; } // straight through the circle, 3 s in
}

// ---- drawing (icons ported from js/sky.js drawIcon) ----
function icon(kind, x, y, size, color, rot = 0) {
  const u = size / 2; ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = color; ctx.strokeStyle = color;
  const rect = (x0, y0, w, h) => ctx.fillRect(x0 * u, y0 * u, w * u, h * u);
  if (kind === 'sat') { ctx.rotate(-0.35); rect(-0.26, -0.26, 0.52, 0.52); ctx.globalAlpha *= 0.85; rect(-1.0, -0.2, 0.62, 0.4); rect(0.38, -0.2, 0.62, 0.4); ctx.globalAlpha /= 0.85; rect(-0.4, -0.04, 0.8, 0.08); }
  else if (kind === 'flat') { ctx.rotate(-0.35); rect(-0.75, -0.14, 0.55, 0.28); ctx.globalAlpha *= 0.85; rect(-0.12, -0.24, 1.0, 0.48); }
  else if (kind === 'rocket') { ctx.rotate(-0.7); ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-0.95 * u, -0.26 * u, 1.55 * u, 0.52 * u, 0.12 * u) : ctx.rect(-0.95 * u, -0.26 * u, 1.55 * u, 0.52 * u); ctx.fill(); ctx.beginPath(); ctx.moveTo(0.6 * u, -0.2 * u); ctx.lineTo(0.98 * u, -0.34 * u); ctx.lineTo(0.98 * u, 0.34 * u); ctx.lineTo(0.6 * u, 0.2 * u); ctx.closePath(); ctx.fill(); }
  else if (kind === 'station') { ctx.rotate(-0.2); rect(-1.0, -0.06, 2.0, 0.12); ctx.globalAlpha *= 0.85; for (const px of [-0.85, -0.55, 0.45, 0.75]) { rect(px, -0.62, 0.22, 0.5); rect(px, 0.12, 0.22, 0.5); } ctx.globalAlpha /= 0.85; rect(-0.3, -0.16, 0.6, 0.32); rect(-0.1, -0.34, 0.2, 0.68); }
  else if (kind === 'plane') {
    ctx.beginPath(); ctx.moveTo(1.0 * u, 0); ctx.quadraticCurveTo(0.86 * u, -0.12 * u, 0.6 * u, -0.12 * u);
    ctx.lineTo(0.12 * u, -0.12 * u); ctx.lineTo(-0.38 * u, -0.98 * u); ctx.lineTo(-0.56 * u, -0.98 * u); ctx.lineTo(-0.24 * u, -0.12 * u);
    ctx.lineTo(-0.72 * u, -0.1 * u); ctx.lineTo(-0.9 * u, -0.42 * u); ctx.lineTo(-1.0 * u, -0.42 * u); ctx.lineTo(-0.92 * u, -0.06 * u); ctx.lineTo(-0.98 * u, 0);
    ctx.lineTo(-0.92 * u, 0.06 * u); ctx.lineTo(-1.0 * u, 0.42 * u); ctx.lineTo(-0.9 * u, 0.42 * u); ctx.lineTo(-0.72 * u, 0.1 * u);
    ctx.lineTo(-0.24 * u, 0.12 * u); ctx.lineTo(-0.56 * u, 0.98 * u); ctx.lineTo(-0.38 * u, 0.98 * u); ctx.lineTo(0.12 * u, 0.12 * u);
    ctx.lineTo(0.6 * u, 0.12 * u); ctx.quadraticCurveTo(0.86 * u, 0.12 * u, 1.0 * u, 0); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

function frame(now) {
  raf = 0; if (!onScreen) return;
  const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
  ctx.clearRect(0, 0, W, H);
  // stars
  for (const s of stars) { ctx.globalAlpha = still ? s.a : s.a * (0.7 + 0.3 * Math.sin(now / 1000 * s.s + s.p)); ctx.fillStyle = '#fff8e2'; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill(); }
  ctx.globalAlpha = 1;
  // move
  if (!open) for (const o of objs) { o.x += o.vx * dt; o.y += o.vy * dt; if (o.x < -80 || o.x > W + 80 || o.y < -80 || o.y > H + 20) o.gone = true; }
  objs = objs.filter((o) => !o.gone || o === lock.obj);
  const want = W < 600 ? 5 : 7;
  if (objs.filter((o) => !o.plane).length < want && !open) { const r = pickNext(); if (r) objs.push(launch(r)); }
  planeAt -= dt; if (planeAt <= 0 && !objs.some((o) => o.plane)) { objs.push(launch({ ...PLANE })); planeAt = rnd(14, 22); }
  // aim
  if (ret.follow) { if (ret.follow.gone || !objs.includes(ret.follow)) ret.follow = null; else { ret.tx = ret.follow.x; ret.ty = ret.follow.y; } }
  const k = ret.follow ? 0.2 : 0.28; ret.x += (ret.tx - ret.x) * k; ret.y += (ret.ty - ret.y) * k;
  // lock on: the nearest thing inside the circle, held for a moment
  let best = null, bd = 1e9; for (const o of objs) { const d = Math.hypot(o.x - ret.x, o.y - ret.y); if (d < bd) { bd = d; best = o; } }
  if (lock.on && (lock.obj?.gone || Math.hypot(lock.obj.x - ret.x, lock.obj.y - ret.y) > R + 6)) unlock();
  if (!lock.on) { if (best && bd < R - 6) { if (lock.obj !== best) { lock.obj = best; lock.since = now; } else if (now - lock.since > 320) lockOn(best, now); } else lock.obj = null; }
  // objects: a fading trail, a soft glow, the icon
  for (const o of objs) {
    const sp = Math.hypot(o.vx, o.vy) || 1, ux = o.vx / sp, uy = o.vy / sp, tl = o.plane ? 0 : 46, hot = lock.on && lock.obj === o;
    if (tl) { const g = ctx.createLinearGradient(o.x, o.y, o.x - ux * tl, o.y - uy * tl); g.addColorStop(0, 'rgba(255,242,179,.35)'); g.addColorStop(1, 'rgba(255,242,179,0)'); ctx.strokeStyle = g; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(o.x - ux * tl, o.y - uy * tl); ctx.stroke(); }
    const col = o.plane ? '#c9d3dd' : hot ? TIER[o.tier][2] : '#fff2b3';
    const gl = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, 16); gl.addColorStop(0, hot ? 'rgba(250,129,39,.35)' : 'rgba(255,242,179,.18)'); gl.addColorStop(1, 'rgba(255,242,179,0)'); ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(o.x, o.y, 16, 0, 6.283); ctx.fill();
    const sz = (o.size ?? (o.plane ? 18 : 14)) * (hot ? 1.3 : 1);
    icon(o.kind, o.x, o.y, sz, col, o.plane ? Math.atan2(o.vy, o.vx) : 0);
    if (o.plane) { // nav lights: red left, green right, a white strobe
      const a = Math.atan2(o.vy, o.vx), px = -Math.sin(a), py = Math.cos(a), w = sz * 0.48, blink = still || Math.floor(now / 500) % 2 === 0;
      if (blink) { ctx.fillStyle = '#ff4d4d'; ctx.beginPath(); ctx.arc(o.x - px * w, o.y - py * w, 1.8, 0, 6.283); ctx.fill(); ctx.fillStyle = '#4dff88'; ctx.beginPath(); ctx.arc(o.x + px * w, o.y + py * w, 1.8, 0, 6.283); ctx.fill(); }
      if (!still && now % 1200 < 90) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(o.x, o.y, 2.6, 0, 6.283); ctx.fill(); }
    }
  }
  // trees along the bottom
  ctx.fillStyle = '#03060c'; ctx.beginPath(); ctx.moveTo(0, H); for (const [x, h] of trees) { ctx.lineTo(x - h * 0.3, H - 6); ctx.lineTo(x, H - 6 - h); ctx.lineTo(x + h * 0.3, H - 6); } ctx.lineTo(W, H); ctx.fill(); ctx.fillRect(0, H - 7, W, 7);
  // the circle (the app's reticle)
  const cx = ret.x, cy = ret.y, ink = lock.on ? '#fa8127' : 'rgba(255,242,179,.75)';
  ctx.strokeStyle = 'rgba(4,7,14,.35)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.283); ctx.stroke();
  ctx.strokeStyle = ink; ctx.lineWidth = lock.on ? 2.2 : 1.4; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.283); ctx.stroke();
  ctx.strokeStyle = 'rgba(173,188,200,.35)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(cx, cy, R + 5, 0, 6.283); ctx.stroke();
  for (let a = 0; a < 360; a += 15) { const c = a % 90 === 0, i = R + 5, oo = R + (c ? 13 : 9), x = Math.cos(a * Math.PI / 180), y = Math.sin(a * Math.PI / 180); ctx.strokeStyle = c ? '#fa8127' : 'rgba(255,242,179,.4)'; ctx.lineWidth = c ? 1.6 : 0.75; ctx.beginPath(); ctx.moveTo(cx + x * i, cy + y * i); ctx.lineTo(cx + x * oo, cy + y * oo); ctx.stroke(); }
  if (lock.on && !still) { const p = Math.min(1, (now - lock.at) / 650); ctx.strokeStyle = `rgba(250,129,39,${(1 - p) * 0.7})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, R + 6 + p * 22, 0, 6.283); ctx.stroke(); }
  placeUI();
  raf = requestAnimationFrame(frame);
}

// ---- lock-on UI ----
function lockOn(o, now) {
  lock.on = true; lock.at = now; lock.obj = o; if (!o.plane) ret.follow = o;
  if (o.plane) { ui.tier.textContent = 'Not a card'; ui.tier.style.color = '#9fb3c8'; ui.name.textContent = o.note; ui.collect.hidden = true; }
  else { const [g, l, c] = TIER[o.tier]; ui.tier.textContent = `${g} ${l} · ${o.up}`; ui.tier.style.color = c; ui.name.textContent = o.name; ui.collect.hidden = false; }
  ui.box.hidden = false; hero.classList.add('locked');
  try { navigator.vibrate?.(12); } catch {}
}
function unlock() { lock.on = false; lock.obj = null; ui.box.hidden = true; ui.collect.hidden = true; hero.classList.remove('locked'); }
function placeUI() {
  if (!lock.on) return;
  const bw = ui.box.offsetWidth, x = Math.max(12 + bw / 2, Math.min(W - 12 - bw / 2, ret.x));
  ui.box.style.transform = `translate(${x - bw / 2}px, ${ret.y - R - 22 - ui.box.offsetHeight}px)`;
  if (!ui.collect.hidden) { const cw = ui.collect.offsetWidth; ui.collect.style.transform = `translate(${Math.max(12, Math.min(W - 12 - cw, ret.x - cw / 2))}px, ${ret.y + R + 20}px)`; }
}

// ---- aiming: the mouse moves the circle; a tap sends it to what you tapped and it follows ----
const local = (e) => { const r = hero.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
const isUI = (e) => e.target.closest('a, button, select, .wc-over');
hero.addEventListener('pointermove', (e) => { if (open || e.pointerType !== 'mouse' || isUI(e)) return; const [x, y] = local(e); if (lock.on && Math.hypot(x - ret.x, y - ret.y) < R * 1.3) return; ret.tx = x; ret.ty = y; ret.follow = null; hint('desk'); }); // once locked, the circle rides along until you pull away
let downAt = null;
hero.addEventListener('pointerdown', (e) => { if (open || isUI(e)) return; downAt = local(e); });
hero.addEventListener('pointerup', (e) => {
  if (open || !downAt || isUI(e)) return; const [x, y] = local(e), moved = Math.hypot(x - downAt[0], y - downAt[1]); downAt = null; if (moved > 12) return;
  if (lock.on && !lock.obj.plane && Math.hypot(x - ret.x, y - ret.y) < R + 14) return collect(); // tap the circle (or click) to collect
  let best = null, bd = 70; for (const o of objs) { const d = Math.hypot(o.x - x, o.y - y); if (d < bd) { bd = d; best = o; } }
  ret.follow = best; if (!best) { ret.tx = x; ret.ty = y; }
  hint('tap');
});
ui.collect.addEventListener('click', () => collect());
let hinted = false;
function hint() { if (hinted) return; hinted = true; ui.hint.classList.add('done'); }

// ---- collect: the card comes out of the circle, shakes, turns over ----
const over = $('wc-over'), card = $('wc-card'), img = $('wc-img'), cap = $('wc-cap'), first = $('wc-first'), again = $('wc-again');
function collect() {
  const o = lock.obj; if (!o || o.plane || open) return;
  open = true; seen.add(o.name); caught++; o.gone = true; unlock(); ret.follow = null;
  ui.count.textContent = `${caught} / 4,850`; ui.count.classList.add('bump'); setTimeout(() => ui.count.classList.remove('bump'), 500);
  const isFirst = caught === 1, [g, l, c] = TIER[o.tier];
  img.src = isFirst ? '/assets/wc-back.webp' : '/backs/back-collector.webp'; img.alt = 'A sealed card';
  const front = isFirst ? '/assets/wc-front.webp' : o.img; new Image().src = front;
  card.style.setProperty('--tier', c); card.classList.remove('turned');
  first.hidden = !isFirst; again.hidden = isFirst;
  cap.innerHTML = isFirst ? `You caught <b style="color:${c}">${g} ${o.name}</b>. Here's how it works for real.` : `<b style="color:${c}">${g} ${l}</b> · ${o.name} · ${caught} of 4,850`;
  over.hidden = false; requestAnimationFrame(() => over.classList.add('in'));
  const r = card.getBoundingClientRect(), hr = hero.getBoundingClientRect();
  const dx = hr.left + ret.x - (r.left + r.width / 2), dy = hr.top + ret.y - (r.top + r.height / 2);
  const turn = () => {
    if (card.classList.contains('turned')) return; card.classList.add('turned');
    const swap = () => { img.src = front; img.alt = isFirst ? 'Your first mission: point your phone at the sky, line up an object in the circle, tap Collect to claim its card.' : `${o.name} card`; };
    if (still) return swap();
    card.animate([{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }], { duration: 180, easing: 'ease-in' }).finished.then(() => { swap(); card.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 240, easing: 'cubic-bezier(.2,.8,.3,1.2)' }); });
  };
  card.onclick = turn;
  if (still) { turn(); return; }
  card.animate([{ transform: `translate(${dx}px, ${dy}px) scale(.12)`, opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 480, easing: 'cubic-bezier(.2,.8,.2,1)' }).finished
    .then(() => card.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-3deg) translateY(-2px)' }, { transform: 'rotate(3deg)' }, { transform: 'rotate(-3deg)' }, { transform: 'rotate(2deg)' }, { transform: 'rotate(0)' }], { duration: 650, easing: 'ease-in-out' }).finished)
    .then(() => setTimeout(turn, 120));
}
function closeOver() { over.classList.remove('in'); setTimeout(() => { over.hidden = true; open = false; }, 250); }
$('wc-close').addEventListener('click', closeOver); $('wc-close2').addEventListener('click', closeOver);
addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) closeOver(); });

// Keyboard: arrows move the circle, Enter collects.
hero.tabIndex = -1;
addEventListener('keydown', (e) => {
  if (open || window.scrollY > H * 0.6) return; const m = { ArrowLeft: [-16, 0], ArrowRight: [16, 0], ArrowUp: [0, -16], ArrowDown: [0, 16] }[e.key];
  if (m && document.activeElement === document.body) { ret.follow = null; ret.tx = Math.max(0, Math.min(W, ret.tx + m[0])); ret.ty = Math.max(0, Math.min(H, ret.ty + m[1])); e.preventDefault(); }
  if (e.key === 'Enter' && lock.on && document.activeElement === document.body) collect();
});

size(); seed();
new ResizeObserver(() => { const w = W; size(); if (Math.abs(w - W) > 40) seed(); }).observe(hero);
new IntersectionObserver(([en]) => { onScreen = en.isIntersecting; if (onScreen && !raf) { last = 0; raf = requestAnimationFrame(frame); } }).observe(hero);
raf = requestAnimationFrame(frame);
