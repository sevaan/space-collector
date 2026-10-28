// Orbit view (2026-10-14, Sevaan; design/fun-and-learning.html). Tap a card with an orbit and its picture becomes a small
// view of that orbit. Since 2026-10-26 (Sevaan: "does debris change direction like that?" — the ground track confused)
// it shows the ORBIT ITSELF, not the ground track: one lap of real positions in space (satellite.js, the same model as
// the sky), seen from 35° above the orbit's own plane with the low point to the right, the Earth to scale in the middle
// turning underneath (your spot marked), and the object moving round at its true relative speed, a lap in 4–14 s.
// Parts of the ring behind the Earth are faint. Twinkling stars behind. Canvas only. Coastlines: js/coast.js.
import { satrecFor, overEarth } from './orbit.js?v=0.1.1257';
import * as sat from './lib/satellite.js?v=0.1.1257';
import { useMiles } from './units.js?v=0.1.1257';
import { placeName } from './geo.js?v=0.1.1257';
import { COAST } from './coast.js?v=0.1.1257';

const RAD = Math.PI / 180, RE = 6371;
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const eci = (pv) => (pv && pv.position && Number.isFinite(pv.position.x) ? [pv.position.x, pv.position.y, pv.position.z] : null);
// A point on Earth's surface (lat, lon in degrees) in space coordinates at Greenwich sidereal angle g.
const ground = (lat, lon, g, r = RE) => { const p = lat * RAD, l = lon * RAD + g; return [r * Math.cos(p) * Math.cos(l), r * Math.cos(p) * Math.sin(l), r * Math.sin(p)]; };

// The realistic Earth's map: NASA's Blue Marble (land_shallow_topo, public domain), 1024×512 in assets/sky/earth.webp,
// read once into pixels (2026-10-27, Sevaan asked for a realistic option).
let MAP = null, mapLoading = null;
export function earthMap() {
  if (MAP || mapLoading) return MAP;
  mapLoading = (async () => { try { const im = new Image(); im.src = new URL('../assets/sky/earth.webp', import.meta.url).href; await im.decode();
    const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; const x = c.getContext('2d'); x.drawImage(im, 0, 0);
    MAP = { w: c.width, h: c.height, d: x.getImageData(0, 0, c.width, c.height).data }; } catch { /* stays on the fallback */ } })();
  return null;
}

// Land as a grid of evenly spaced dots (the 'dots' style), worked out once from the coastlines.
let DOTS = null;
function landDots() { if (DOTS) return DOTS; DOTS = [];
  // Rings that cross the date line (Fiji, Chukotka) are unwrapped past 180° so the flat in-or-out test works on them.
  const rings = COAST.map((r) => (r.some(([x], i) => i && Math.abs(x - r[i - 1][0]) > 180) && Math.min(...r.map(([, y]) => y)) > -80 ? r.map(([x, y]) => [x < -150 ? x + 360 : x, y]) : r));
  const boxes = rings.map((r) => { let a = 180, b = -180, c = 90, d = -90; for (const [x, y] of r) { a = Math.min(a, x); b = Math.max(b, x); c = Math.min(c, y); d = Math.max(d, y); } return [a, b, c, d]; });
  const inRing = (x, y, r) => { let o = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) o = !o; } return o; };
  for (let la = -84; la <= 84; la += 2.6) { const st = 2.6 / Math.max(0.2, Math.cos(la * RAD)); for (let lo = -180 + st / 2; lo < 180; lo += st)
    if ([lo, lo + 360].some((x) => rings.some((r, i) => { const b = boxes[i]; return x >= b[0] && x <= b[1] && la >= b[2] && la <= b[3] && inRing(x, la, r); }))) DOTS.push([la, lo]); }
  return DOTS; }

// obj: the card (needs `el`); host: the element to fill; me: { lat, lon } or null; once: draw one still frame.
export function orbitGlobe(obj, host, me, { once = false, style } = {}) {
  let look = style; if (!look) { try { look = localStorage.getItem('globeStyle'); } catch { /* storage off */ } } look ||= 'realistic'; /* Sevaan's pick, 2026-10-27 (design/earth-styles.html F; was C blueprint) */
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
  // Day and night: the Sun's direction in this view (it stays put in space while the Earth turns), and the night side as a soft mask.
  const sunE = norm(sat.sunPos(sat.jday(new Date(t0))).rsun), sunV = norm(uv(sunE)); let rc = null, rimg = null; // the Sun stays put in space while the Earth turns
  let nightCv = null; const nightMask = () => { if (nightCv) return nightCv; const N = 160; nightCv = document.createElement('canvas'); nightCv.width = nightCv.height = N; const cx2 = nightCv.getContext('2d'), im = cx2.createImageData(N, N);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const x = (i + 0.5) / N * 2 - 1, y = 1 - (j + 0.5) / N * 2, rr = x * x + y * y; if (rr > 1) continue; const z = Math.sqrt(1 - rr), d = x * sunV[0] + y * sunV[1] + z * sunV[2];
      const a = Math.min(1, Math.max(0, (0.08 - d) / 0.16)); const o = (j * N + i) * 4; im.data[o] = 4; im.data[o + 1] = 9; im.data[o + 2] = 20; im.data[o + 3] = Math.round(a * 205); }
    cx2.putImageData(im, 0, 0); return nightCv; };
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
    // the Earth, in the chosen style (design/earth-styles.html; 2026-10-27, Sevaan picks one)
    const onEarth = (lat, lon) => { const p = uv(ground(lat, lon, g)); return { x: cx + p[0] * k, y: cy - p[1] * k, front: p[2] > 0 }; };
    const disc = () => { ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); };
    const landPath = () => { const land = new Path2D();
      for (const poly of COAST) { const ps = poly.map(([lo, la]) => onEarth(la, lo)); if (!ps.some((p) => p.front)) continue;
        ps.forEach((p, i) => { const q2 = p.front ? p : (() => { const dx = p.x - cx, dy = p.y - cy, d = Math.hypot(dx, dy) || 1; return { x: cx + (dx / d) * R, y: cy + (dy / d) * R }; })(); i ? land.lineTo(q2.x, q2.y) : land.moveTo(q2.x, q2.y); }); land.closePath(); }
      return land; };
    // Coastlines to stroke: only the parts on the near side, pen lifted across the back (2026-10-27, Sevaan: a jagged line
    // crossed the globe; the fill path's back points are pulled to the rim, and stroking that drew chords across it).
    const coastPath = () => { const c = new Path2D();
      for (const poly of COAST) { let pen = false; for (const [lo, la] of poly) { const p = onEarth(la, lo); if (!p.front) { pen = false; continue; } pen ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y); pen = true; } }
      return c; };
    const grid = (alpha, step = 30) => { if (R <= 12) return; ctx.strokeStyle = alpha; ctx.lineWidth = 1;
      for (let la = -90 + step; la < 90; la += step) { ctx.beginPath(); let pen = false; for (let lo = -180; lo <= 180; lo += 6) { const p = onEarth(la, lo); if (!p.front) { pen = false; continue; } pen ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); pen = true; } ctx.stroke(); }
      for (let lo = -180; lo < 180; lo += step) { ctx.beginPath(); let pen = false; for (let la = -90; la <= 90; la += 6) { const p = onEarth(la, lo); if (!p.front) { pen = false; continue; } pen ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); pen = true; } ctx.stroke(); } };
    const glowRim = (rgb, a) => { const gl = ctx.createRadialGradient(cx, cy, R * 0.96, cx, cy, R * 1.14); gl.addColorStop(0, `rgba(${rgb},${a})`); gl.addColorStop(0.35, `rgba(${rgb},${a / 3})`); gl.addColorStop(1, `rgba(${rgb},0)`);
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(cx, cy, R * 1.14, 0, Math.PI * 2); ctx.fill(); };
    const ocean = (c0, c1, c2, lx = -0.4, ly = -0.45) => { const gr = ctx.createRadialGradient(cx + R * lx, cy + R * ly, R * 0.05, cx, cy, R * 1.02); gr.addColorStop(0, c0); gr.addColorStop(0.55, c1); gr.addColorStop(1, c2); ctx.fillStyle = gr; disc(); ctx.fill(); };
    const farShade = (a = 0.72, lx = -0.4, ly = -0.45) => { const sh = ctx.createRadialGradient(cx + R * lx, cy + R * ly, R * 0.2, cx + R * lx * 0.25, cy + R * ly * 0.25, R * 1.25); sh.addColorStop(0, 'rgba(5,12,24,0)'); sh.addColorStop(0.55, 'rgba(5,12,24,.08)'); sh.addColorStop(1, `rgba(5,12,24,${a})`); ctx.fillStyle = sh; ctx.fillRect(cx - R, cy - R, R * 2, R * 2); };
    const hatch = (clip, color, gap) => { if (R <= 18) return; ctx.save(); ctx.clip(clip); ctx.strokeStyle = color; ctx.lineWidth = 0.7; ctx.beginPath();
      for (let d = -2 * R; d <= 2 * R; d += gap) { ctx.moveTo(cx + d - R, cy - R); ctx.lineTo(cx + d + R, cy + R); } ctx.stroke(); ctx.restore(); };
    if (look === 'realistic') {
      const map = earthMap(); glowRim('120,170,255', 0.45);
      if (!map) { ocean('#2a5b8a', '#163a5e', '#081627'); } else {
        // every pixel of the disc: the point on the globe under it, turned back to latitude/longitude, looked up in the map, lit by the real Sun
        const N = Math.max(60, Math.min(320, Math.round(R * 2 * Math.min(1.5, dpr)))); if (!rc || rc.width !== N) { rc = document.createElement('canvas'); rc.width = rc.height = N; rimg = rc.getContext('2d').createImageData(N, N); }
        const px = rimg.data, sx = sunE[0], sy = sunE[1], sz = sunE[2], cg = Math.cos(g), sg = Math.sin(g);
        for (let j = 0; j < N; j++) { const yv = 1 - (j + 0.5) / N * 2; for (let i = 0; i < N; i++) { const xv = (i + 0.5) / N * 2 - 1, rr = xv * xv + yv * yv, o = (j * N + i) * 4; if (rr > 1) { px[o + 3] = 0; continue; }
          const zv = Math.sqrt(1 - rr), X = xv * right[0] + yv * up[0] + zv * c[0], Y = xv * right[1] + yv * up[1] + zv * c[1], Z = xv * right[2] + yv * up[2] + zv * c[2];
          const ex = X * cg + Y * sg, ey = -X * sg + Y * cg; // into the turning Earth's frame
          const lon = Math.atan2(ey, ex), lat = Math.asin(Math.max(-1, Math.min(1, Z)));
          const u = Math.floor(((lon / (2 * Math.PI) + 0.5) % 1 + 1) % 1 * map.w), v = Math.min(map.h - 1, Math.floor((0.5 - lat / Math.PI) * map.h)), q = (v * map.w + u) * 4;
          const sun = X * sx + Y * sy + Z * sz, day = Math.min(1, Math.max(0, (sun + 0.12) / 0.24)), lit = (0.34 + 0.66 * day) * (0.55 + 0.45 * zv); /* night side dimmed, not black: you see the continents at night too */
          px[o] = map.d[q] * lit * (1 - 0.25 * (1 - day)); px[o + 1] = map.d[q + 1] * lit * (1 - 0.1 * (1 - day)); px[o + 2] = Math.min(255, map.d[q + 2] * lit + (1 - day) * 22); px[o + 3] = 255; } }
        rc.getContext('2d').putImageData(rimg, 0, 0); ctx.save(); disc(); ctx.clip(); ctx.imageSmoothingEnabled = true; ctx.drawImage(rc, cx - R, cy - R, R * 2, R * 2); ctx.restore();
      }
      const at = ctx.createRadialGradient(cx, cy, R * 0.86, cx, cy, R * 1.01); at.addColorStop(0, 'rgba(120,180,255,0)'); at.addColorStop(1, 'rgba(140,195,255,.35)'); ctx.fillStyle = at; disc(); ctx.fill();
    } else if (look === 'blueprint') {
      ocean('#1f4369', '#0f2542', '#050d18'); /* light and shade for some dimension (2026-10-27, Sevaan) */
      ctx.save(); disc(); ctx.clip(); grid('rgba(143,180,216,.2)', 15); const land = landPath(); ctx.fillStyle = 'rgba(143,180,216,.1)'; ctx.fill(land);
      ctx.strokeStyle = 'rgba(255,242,179,.85)'; ctx.lineWidth = 1; ctx.stroke(coastPath());
      const hi = ctx.createRadialGradient(cx - R * 0.42, cy - R * 0.48, 0, cx - R * 0.42, cy - R * 0.48, R * 0.7); hi.addColorStop(0, 'rgba(190,220,255,.16)'); hi.addColorStop(1, 'rgba(190,220,255,0)'); ctx.fillStyle = hi; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
      farShade(0.7); ctx.restore();
      ctx.strokeStyle = 'rgba(255,242,179,.7)'; ctx.lineWidth = 1.2; disc(); ctx.stroke();
    } else if (look === 'dots') {
      glowRim('250,129,39', 0.32); ocean('#1d3f63', '#11294a', '#081627'); ctx.save(); disc(); ctx.clip(); ctx.fillStyle = '#efe4bf';
      const r0 = Math.max(0.7, R / 95);
      for (const [la, lo] of landDots()) { const p3 = uv(ground(la, lo, g)); if (p3[2] <= 0) continue; const z = p3[2] / RE, lit = Math.max(0, 0.55 + 0.45 * (-0.45 * p3[0] / RE + 0.5 * p3[1] / RE + 0.75 * z));
        ctx.globalAlpha = 0.35 + 0.65 * lit; ctx.beginPath(); ctx.arc(cx + p3[0] * k, cy - p3[1] * k, r0 * (0.55 + 0.45 * z), 0, Math.PI * 2); ctx.fill(); }
      ctx.globalAlpha = 1; farShade(0.55); ctx.restore();
      ctx.strokeStyle = 'rgba(250,170,100,.55)'; ctx.lineWidth = 1; disc(); ctx.stroke();
    } else if (look === 'poster') {
      ctx.fillStyle = '#2f5f87'; disc(); ctx.fill();
      ctx.save(); disc(); ctx.clip(); const land = landPath(); ctx.fillStyle = '#d9772e'; ctx.fill(land); ctx.strokeStyle = '#fff2b3'; ctx.lineWidth = 1.1; ctx.stroke(coastPath());
      const hl = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R); hl.addColorStop(0, 'rgba(255,242,179,.18)'); hl.addColorStop(0.5, 'rgba(255,242,179,0)'); hl.addColorStop(0.62, 'rgba(5,12,24,.0)'); hl.addColorStop(1, 'rgba(5,12,24,.5)');
      ctx.fillStyle = hl; ctx.fillRect(cx - R, cy - R, R * 2, R * 2); ctx.restore();
      ctx.strokeStyle = '#fff2b3'; ctx.lineWidth = 1.6; disc(); ctx.stroke();
    } else if (look === 'daynight') {
      const sv = sunV, lx = sv[0] * 0.45, ly = -sv[1] * 0.45;
      glowRim('143,190,235', 0.35); ocean('#5a93c4', '#2a5b8a', '#0e2540', lx, ly);
      ctx.save(); disc(); ctx.clip(); grid('rgba(143,180,216,.1)'); const land = landPath(); ctx.fillStyle = 'rgba(233,223,184,.92)'; ctx.fill(land);
      ctx.strokeStyle = 'rgba(12,30,52,.5)'; ctx.lineWidth = 0.7; ctx.stroke(coastPath());
      ctx.drawImage(nightMask(), cx - R, cy - R, R * 2, R * 2); ctx.restore();
      ctx.strokeStyle = 'rgba(180,210,240,.45)'; ctx.lineWidth = 1; disc(); ctx.stroke();
    } else { // engraved (the default): an orange glow on the rim, a deep ocean lit from the upper left, cream land with fine engraved hatching, the far side in shade
      glowRim('250,129,39', 0.42); ocean('#4f86b6', '#24527f', '#0b1d33');
      ctx.save(); disc(); ctx.clip(); grid('rgba(143,180,216,.12)'); const land = landPath();
      ctx.fillStyle = 'rgba(233,223,184,.9)'; ctx.fill(land); hatch(land, 'rgba(18,40,64,.22)', Math.max(2.4, R / 42));
      ctx.strokeStyle = 'rgba(12,30,52,.6)'; ctx.lineWidth = 0.8; ctx.stroke(coastPath()); farShade(); ctx.restore();
      ctx.strokeStyle = 'rgba(250,170,100,.6)'; ctx.lineWidth = 1.1; disc(); ctx.stroke();
    }
    // you
    if (me) { const p = onEarth(me.lat, me.lon); if (p.front) { ctx.save(); ctx.fillStyle = 'rgba(255,77,77,.25)'; ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ff4d4d'; ctx.strokeStyle = '#fff2b3'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(p.x, p.y, 3.6, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.font = '700 9.5px "SC Label", "Barlow Condensed", sans-serif'; ctx.fillStyle = '#ff6a6a'; ctx.fillText('YOU', p.x + 8, p.y + 3); ctx.restore(); /* you: red with a cream ring, unlike any satellite dot (2026-10-27, Sevaan) */ } }
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
