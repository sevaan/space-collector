// Orbit view (2026-10-14, Sevaan; design/fun-and-learning.html): one tap on a satellite card in the collection viewer
// turns its picture into a small globe: the ground track for the orbit before and after now, where it is right now
// (moving live), and where you are. Tap again for the picture. Coarse coastlines from js/geo.js. Canvas, no DOM beyond it.
import { satrecFor, overEarth } from './orbit.js?v=0.1.728';
import { LAND, placeName } from './geo.js?v=0.1.728';

const RAD = Math.PI / 180;
// Orthographic projection of (lat, lon) onto a globe of radius R centred at (cx, cy), looking at (lat0, lon0).
function proj(lat, lon, lat0, lon0, R, cx, cy) {
  const p = lat * RAD, l = (lon - lon0) * RAD, p0 = lat0 * RAD;
  const cosc = Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(l);
  return { x: cx + R * Math.cos(p) * Math.sin(l), y: cy - R * (Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(l)), front: cosc > 0 };
}
// obj: the card (needs `el`); host: the element to fill; me: { lat, lon } or null. Returns { stop() }.
export function orbitGlobe(obj, host, me) {
  const o = { ...obj, satrec: obj.satrec ?? satrecFor(obj) };
  if (!o.satrec) return null;
  const canvas = document.createElement('canvas'); canvas.className = 'orbit-globe';
  host.appendChild(canvas);
  const ctx = canvas.getContext('2d'), still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const periodMin = obj.el ? 1440 / obj.el[1] : 95;
  let trackAt = 0, track = [], lat0 = 20, lon0 = 0, raf = 0, now0 = performance.now();
  const sample = () => {
    const t = Date.now(); track = [];
    for (let m = -periodMin * 0.5; m <= periodMin * 1.25; m += periodMin / 120) { const g = overEarth(o, new Date(t + m * 60000)); if (g) track.push({ m, lat: g.lat, lon: g.lon }); }
    trackAt = t;
  };
  const draw = (ts) => {
    const W = host.clientWidth, H = host.clientHeight, dpr = Math.min(2, devicePixelRatio || 1);
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) { canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    if (Date.now() - trackAt > 30000) sample();
    const nowP = overEarth(o, new Date());
    if (nowP) { lat0 += (Math.max(-50, Math.min(50, nowP.lat * 0.6)) - lat0) * 0.05; lon0 = nowP.lon - (still ? 0 : ((ts - now0) / 1000) % 360 * 0); } // follow the satellite
    const R = Math.min(W, H) * 0.4, cx = W / 2, cy = H / 2;
    // starry backdrop
    ctx.fillStyle = '#050a12'; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 50; i++) { ctx.fillStyle = 'rgba(255,242,179,.35)'; ctx.fillRect((i * 97.3) % W, (i * 57.1) % H, 1.2, 1.2); }
    const g = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.35, R * 0.1, cx, cy, R); g.addColorStop(0, '#3d6f9e'); g.addColorStop(1, '#122b45');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
    // graticule
    ctx.strokeStyle = 'rgba(143,180,216,.18)'; ctx.lineWidth = 1;
    for (let la = -60; la <= 60; la += 30) { ctx.beginPath(); let pen = false; for (let lo = -180; lo <= 180; lo += 6) { const p = proj(la, lo, lat0, lon0, R, cx, cy); if (!p.front) { pen = false; continue; } pen ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); pen = true; } ctx.stroke(); }
    for (let lo = -180; lo < 180; lo += 30) { ctx.beginPath(); let pen = false; for (let la = -90; la <= 90; la += 6) { const p = proj(la, lo, lat0, lon0, R, cx, cy); if (!p.front) { pen = false; continue; } pen ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); pen = true; } ctx.stroke(); }
    // land
    ctx.fillStyle = 'rgba(233,223,184,.55)';
    for (const [, poly] of LAND) { const ps = poly.map(([lo, la]) => proj(la, lo, lat0, lon0, R, cx, cy)); if (!ps.some((p) => p.front)) continue; ctx.beginPath(); ps.forEach((p, i) => { const q = p.front ? p : { x: cx + (p.x - cx) * R / Math.max(1, Math.hypot(p.x - cx, p.y - cy)), y: cy + (p.y - cy) * R / Math.max(1, Math.hypot(p.x - cx, p.y - cy)) }; i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); }); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    // limb
    ctx.strokeStyle = 'rgba(143,180,216,.5)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
    // ground track: faint behind now, orange ahead
    const tNow = (Date.now() - trackAt) / 60000;
    ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (let i = 1; i < track.length; i++) {
      const a = track[i - 1], b = track[i]; if (Math.abs(a.lon - b.lon) > 90) continue;
      const pa = proj(a.lat, a.lon, lat0, lon0, R, cx, cy), pb = proj(b.lat, b.lon, lat0, lon0, R, cx, cy); if (!pa.front || !pb.front) continue;
      ctx.strokeStyle = b.m < tNow ? 'rgba(255,242,179,.35)' : 'rgba(250,129,39,.9)'; ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
    }
    // you
    if (me) { const p = proj(me.lat, me.lon, lat0, lon0, R, cx, cy); if (p.front) { ctx.fillStyle = '#fff2b3'; ctx.beginPath(); ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2); ctx.fill(); ctx.font = '600 11px "SC Label", "Barlow Condensed", sans-serif'; ctx.fillText('YOU', p.x + 6, p.y + 4); } }
    // it, now
    if (nowP) {
      const p = proj(nowP.lat, nowP.lon, lat0, lon0, R, cx, cy), pulse = still ? 0 : (Math.sin(ts / 300) + 1) * 2;
      ctx.fillStyle = 'rgba(250,129,39,.25)'; ctx.beginPath(); ctx.arc(p.x, p.y, 8 + pulse, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fa8127'; ctx.strokeStyle = '#fff2b3'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    raf = requestAnimationFrame(draw);
  };
  raf = requestAnimationFrame(draw);
  return { stop() { cancelAnimationFrame(raf); canvas.remove(); } };
}
// One live line for under a card: "Now over the North Atlantic · 418 km up · 27,600 km/h", or null.
export function whereLine(obj, date = new Date()) {
  const o = obj.satrec ? obj : { ...obj, satrec: satrecFor(obj) };
  if (!o.satrec) return null;
  const g = overEarth(o, date); if (!g) return null;
  return `Now over ${placeName(g.lat, g.lon)} · ${Math.round(g.altKm).toLocaleString()} km up · ${(Math.round(g.kmh / 100) * 100).toLocaleString()} km/h`;
}
