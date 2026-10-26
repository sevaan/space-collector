// Orbit view (2026-10-14, Sevaan; design/fun-and-learning.html). Tap a card with an orbit and its picture becomes a small
// view of that orbit. Since 2026-10-26 (Sevaan: "does debris change direction like that?" — the ground track confused)
// it shows the ORBIT ITSELF, not the ground track: one lap of real positions in space (satellite.js, the same model as
// the sky), seen from 35° above the orbit's own plane with the low point to the right, the Earth to scale in the middle
// turning underneath (your spot marked), and the object moving round at its true relative speed, a lap in 4–14 s.
// Parts of the ring behind the Earth are faint. Twinkling stars behind. Canvas only. Coastlines: js/geo.js.
import { satrecFor, overEarth } from './orbit.js?v=0.1.1209';
import * as sat from './lib/satellite.js?v=0.1.1209';
import { useMiles } from './units.js?v=0.1.1209';
import { LAND, placeName } from './geo.js?v=0.1.1209';

const RAD = Math.PI / 180, RE = 6371;
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const eci = (pv) => (pv && pv.position && Number.isFinite(pv.position.x) ? [pv.position.x, pv.position.y, pv.position.z] : null);
// A point on Earth's surface (lat, lon in degrees) in space coordinates at Greenwich sidereal angle g.
const ground = (lat, lon, g, r = RE) => { const p = lat * RAD, l = lon * RAD + g; return [r * Math.cos(p) * Math.cos(l), r * Math.cos(p) * Math.sin(l), r * Math.sin(p)]; };

// obj: the card (needs `el`); host: the element to fill; me: { lat, lon } or null; once: draw one still frame.
export function orbitGlobe(obj, host, me, { once = false } = {}) {
  const satrec = obj.satrec ?? satrecFor(obj); if (!satrec) return null;
  const P = satrec.no ? (2 * Math.PI) / satrec.no : 95; // minutes per lap
  const t0 = Date.now(), ring = [];
  for (let i = 0; i <= 180; i++) { const r = eci(sat.propagate(satrec, new Date(t0 + (i * P * 60000) / 180))); if (r) ring.push(r); }
  if (ring.length < 20) return null;
  // The view: from 35° above the orbit plane, the low point (perigee) to the right.
  const v0 = sat.propagate(satrec, new Date(t0)).velocity, h = norm(cross(ring[0], [v0.x, v0.y, v0.z]));
  const peri = norm(ring.reduce((m, r) => (Math.hypot(...r) < Math.hypot(...m) ? r : m), ring[0])), q = norm(cross(h, peri));
  const c = norm([h[0] * Math.sin(35 * RAD) + q[0] * Math.cos(35 * RAD), h[1] * Math.sin(35 * RAD) + q[1] * Math.cos(35 * RAD), h[2] * Math.sin(35 * RAD) + q[2] * Math.cos(35 * RAD)]);
  const right = norm(cross(q, c)), up = norm(cross(c, right));
  const uv = (r) => [dot(r, right), dot(r, up), dot(r, c)];
  // Fit the Earth and the whole ring into the box.
  const pts = ring.map(uv); let x0 = -RE, x1 = RE, y0 = -RE, y1 = RE;
  for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const canvas = document.createElement('canvas'); canvas.className = 'orbit-globe'; host.appendChild(canvas);
  const ctx = canvas.getContext('2d'), still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lapSec = Math.max(4, Math.min(14, P / 12)), rate = (P * 60) / lapSec; // simulated seconds per real second
  let seed = (Number(obj.id) || 7) % 2147483646 + 1; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const stars = Array.from({ length: 70 }, () => ({ x: rnd(), y: rnd(), r: 0.4 + rnd() * 0.9, a: 0.25 + rnd() * 0.6, f: 500 + rnd() * 1400, p: rnd() * 6.3 }));
  let raf = 0; const start = performance.now();
  const draw = (ts) => {
    const W = host.clientWidth, H = host.clientHeight, dpr = Math.min(2, devicePixelRatio || 1);
    if (!W || !H) { if (!once && canvas.isConnected) raf = requestAnimationFrame(draw); return; }
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) { canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const k = Math.min((W - 24) / (x1 - x0), (H - 18) / (y1 - y0)), cx = W / 2 - ((x0 + x1) / 2) * k, cy = H / 2 + ((y0 + y1) / 2) * k;
    const S = ([x, y]) => [cx + x * k, cy - y * k], R = RE * k;
    const tSim = once || still ? t0 : t0 + (ts - start) * rate, g = sat.gstime(new Date(tSim));
    // sky
    ctx.fillStyle = '#050a12'; ctx.fillRect(0, 0, W, H);
    for (const st of stars) { const a = still || once ? st.a : st.a * (0.45 + 0.55 * (0.5 + 0.5 * Math.sin(ts / st.f + st.p))); // each star twinkles on its own beat
      ctx.fillStyle = `rgba(255,242,179,${a.toFixed(2)})`; ctx.beginPath(); ctx.arc(st.x * W, st.y * H, st.r, 0, Math.PI * 2); ctx.fill(); }
    // the ring behind the Earth first, faint
    const hidden = (p) => p[2] < 0 && Math.hypot(p[0], p[1]) < RE;
    const ringPath = (front) => { // front: every point not hidden behind the Earth; back: the far half, drawn faint first
      ctx.beginPath(); let pen = false;
      for (const p of pts) { if (front ? hidden(p) : p[2] >= 0) { pen = false; continue; } const [x, y] = S(p); pen ? ctx.lineTo(x, y) : ctx.moveTo(x, y); pen = true; }
      ctx.stroke(); };
    ctx.lineWidth = 1.6; ctx.setLineDash([]); ctx.strokeStyle = 'rgba(250,129,39,.28)'; ringPath(false);
    // the Earth
    const gr = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.35, R * 0.1, cx, cy, R); gr.addColorStop(0, '#3d6f9e'); gr.addColorStop(1, '#122b45');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
    const onEarth = (lat, lon) => { const p = uv(ground(lat, lon, g)); return { x: cx + p[0] * k, y: cy - p[1] * k, front: p[2] > 0 }; };
    if (R > 12) { ctx.strokeStyle = 'rgba(143,180,216,.16)'; ctx.lineWidth = 1;
      for (let la = -60; la <= 60; la += 30) { ctx.beginPath(); let pen = false; for (let lo = -180; lo <= 180; lo += 8) { const p = onEarth(la, lo); if (!p.front) { pen = false; continue; } pen ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); pen = true; } ctx.stroke(); }
      for (let lo = -180; lo < 180; lo += 30) { ctx.beginPath(); let pen = false; for (let la = -90; la <= 90; la += 8) { const p = onEarth(la, lo); if (!p.front) { pen = false; continue; } pen ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); pen = true; } ctx.stroke(); } }
    ctx.fillStyle = 'rgba(233,223,184,.55)';
    for (const [, poly] of LAND) { const ps = poly.map(([lo, la]) => onEarth(la, lo)); if (!ps.some((p) => p.front)) continue;
      ctx.beginPath(); ps.forEach((p, i) => { const q2 = p.front ? p : (() => { const dx = p.x - cx, dy = p.y - cy, d = Math.hypot(dx, dy) || 1; return { x: cx + (dx / d) * R, y: cy + (dy / d) * R }; })(); i ? ctx.lineTo(q2.x, q2.y) : ctx.moveTo(q2.x, q2.y); }); ctx.fill(); }
    ctx.restore();
    ctx.strokeStyle = 'rgba(143,180,216,.5)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
    // you
    if (me) { const p = onEarth(me.lat, me.lon); if (p.front) { ctx.fillStyle = '#fff2b3'; ctx.beginPath(); ctx.arc(p.x, p.y, 2.6, 0, Math.PI * 2); ctx.fill(); ctx.font = '600 9px "SC Label", "Barlow Condensed", sans-serif'; ctx.fillText('YOU', p.x + 4, p.y - 3); } }
    // the ring in front of the Earth
    ctx.lineWidth = 1.8; ctx.strokeStyle = 'rgba(250,129,39,.9)'; ringPath(true);
    // it, now (moving)
    const now = eci(sat.propagate(satrec, new Date(tSim)));
    if (now) { const p = uv(now), [x, y] = S(p), behind = hidden(p), pulse = still || once ? 0 : (Math.sin(ts / 300) + 1) * 1.5;
      ctx.globalAlpha = behind ? 0.35 : 1;
      ctx.fillStyle = 'rgba(250,129,39,.25)'; ctx.beginPath(); ctx.arc(x, y, 7 + pulse, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fa8127'; ctx.strokeStyle = '#fff2b3'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.globalAlpha = 1; }
    if (!once && canvas.isConnected) raf = requestAnimationFrame(draw); // stops by itself when its card is gone
  };
  raf = requestAnimationFrame(draw);
  return { stop() { cancelAnimationFrame(raf); canvas.remove(); } };
}
export function whereLine(obj, date = new Date()) {
  const o = obj.satrec ? obj : { ...obj, satrec: satrecFor(obj) };
  if (!o.satrec) return null;
  const g = overEarth(o, date); if (!g) return null;
  const mi = useMiles(), k = mi ? 0.621371 : 1; return `Now over ${placeName(g.lat, g.lon)}\u00a0· ${Math.round(g.altKm * k).toLocaleString()}\u00a0${mi ? 'mi' : 'km'} up\u00a0· ${(Math.round(g.kmh * k / 100) * 100).toLocaleString()}\u00a0${mi ? 'mph' : 'km/h'}`; // no number without its unit, no line starting with "·" (polish 2026-10-20)
}
