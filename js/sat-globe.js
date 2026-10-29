// Your satellites, live (2026-10-27, Sevaan: a second card beside the rank card at the top of the Collection, swiped
// between with two dots). Every satellite, station, stage and piece of debris you own, where it is this second (the
// sky's own model, satellite.js), around a blueprint Earth (design/earth-styles.html C) that turns slowly, you marked.
// Dots are in the card's rarity colour; the rarest few in view are named. Tap a dot to open its card. Draws only while
// it's on screen. Fleet cards (Starlink and co.) aren't on it yet.
import * as sat from './lib/satellite.js?v=0.1.1397';
import { satrecFor } from './orbit.js?v=0.1.1397';
import { COAST } from './coast.js?v=0.1.1397';
import { TIER_INFO } from './rarity.js?v=0.1.1397';
import { earthMap } from './orbit-view.js?v=0.1.1397';
import { placeName } from './geo.js?v=0.1.1397';

const RAD = Math.PI / 180, RE = 6371, TILT = 20 * RAD;
// A dot's name: whole words up to about 18 letters ("THOR AGENA D", not "THOR AGENA D ROCKET ST").
const SHORT = [[/^International Space Station/i, 'ISS'], [/^Tiangong Space Station/i, 'TIANGONG'], [/^Hubble Space Telescope/i, 'HUBBLE']];
const shortLabel = (t) => { for (const [re, n] of SHORT) if (re.test(t)) return n; const w = String(t).replace(/\s*\([^)]*\)/g, '').replace(/ Rocket Stage$/i, ' stage').toUpperCase().split(' '); /* no brackets, famous ones short (playtest 2026-10-27: "INTERNATIONAL", "OPS 6182 (DMSP") */ let o = ''; for (const x of w) { if ((o + ' ' + x).trim().length > 18 && o) break; o = (o + ' ' + x).trim(); } return o; };
const RANK = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };
// How high a dot sits off the surface: true up to 2,000 km, squeezed beyond so high orbits stay in the picture.
const lift = (h) => (h < 2000 ? h : 2000 + Math.min(h - 2000, 40000) * 0.04) / RE;

// cards: owned card models with orbits; host: the element to draw into; me: { lat, lon } or null; onPick(key).
// Returns { set(cards), where() } — where(): one line about one of them, a different one each call.
export function satGlobe(host, { me = null, onPick = null } = {}) {
  const cv = document.createElement('canvas'); cv.className = 'sg-canvas'; host.appendChild(cv);
  const ctx = cv.getContext('2d');
  let rc = null, rimg = null, sunV = [1, 0, 0];
  let items = [], rot = me ? me.lon : -80, last = 0, raf = 0, shown = false, posAt = 0, turn = 0;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const io = new IntersectionObserver(([e]) => { shown = e.isIntersecting; if (shown && !raf) raf = requestAnimationFrame(draw); }, { threshold: 0.05 });
  io.observe(cv);
  const away = () => document.hidden || document.documentElement.classList.contains('away');
  function place(t) {
    const g = sat.gstime(new Date(t));
    { const sv = sat.sunPos(sat.jday(new Date(t))).rsun, n = Math.hypot(...sv) || 1, x = sv[0] / n, y = sv[1] / n; sunV = [x * Math.cos(g) + y * Math.sin(g), -x * Math.sin(g) + y * Math.cos(g), sv[2] / n]; } // the Sun over the turning Earth
    for (const it of items) { const pv = sat.propagate(it.s, new Date(t)); if (!pv?.position || !Number.isFinite(pv.position.x)) { it.ok = false; continue; }
      const geo = sat.eciToGeodetic(pv.position, g); it.lat = geo.latitude / RAD; it.lon = geo.longitude / RAD; it.h = geo.height; it.ok = true; }
  }
  function draw(ts) {
    raf = 0; if (!shown || !cv.isConnected) return;
    if (away()) { raf = requestAnimationFrame(draw); return; }
    const W = cv.clientWidth, H = cv.clientHeight, d = Math.min(2, devicePixelRatio || 1);
    if (!W || !H) { raf = requestAnimationFrame(draw); return; }
    if (cv.width !== Math.round(W * d) || cv.height !== Math.round(H * d)) { cv.width = Math.round(W * d); cv.height = Math.round(H * d); }
    ctx.setTransform(d, 0, 0, d, 0, 0); ctx.clearRect(0, 0, W, H);
    const dt = last ? Math.min(0.1, (ts - last) / 1000) : 0; last = ts; if (!still) rot += dt * 6; // a slow turn, 6° a second
    if (ts - posAt > 1000 || !posAt) { place(Date.now()); posAt = ts; }
    const cx = W / 2, cy = H / 2 + 4, R = Math.min(W * 0.36, H * 0.4);
    const P = (lat, lon, h = 0) => { const la = lat * RAD, lo = (lon - rot) * RAD, r = 1 + h;
      const x = Math.cos(la) * Math.sin(lo) * r, y0 = Math.sin(la) * r, z0 = Math.cos(la) * Math.cos(lo) * r;
      const y = y0 * Math.cos(TILT) - z0 * Math.sin(TILT), z = y0 * Math.sin(TILT) + z0 * Math.cos(TILT);
      return { x: cx + x * R, y: cy - y * R, z, behind: z < 0 && x * x + y * y < 1 }; };
    const disc = () => { ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); };
    // the blueprint Earth: dark navy, a fine grid, cream coastlines, shade on the far side, a cream rim
    // the realistic Earth (2026-10-27, Sevaan's pick, design/earth-styles.html F): NASA's Blue Marble map on the globe, lit by the real Sun
    const map = earthMap();
    const glow = ctx.createRadialGradient(cx, cy, R * 0.96, cx, cy, R * 1.14); glow.addColorStop(0, 'rgba(120,170,255,.45)'); glow.addColorStop(0.35, 'rgba(120,170,255,.15)'); glow.addColorStop(1, 'rgba(120,170,255,0)'); ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(cx, cy, R * 1.14, 0, Math.PI * 2); ctx.fill();
    if (!map) { ctx.fillStyle = '#163a5e'; disc(); ctx.fill(); } else {
      const N = Math.max(80, Math.min(320, Math.round(R * 2 * Math.min(1.5, d)))); if (!rc || rc.width !== N) { rc = document.createElement('canvas'); rc.width = rc.height = N; rimg = rc.getContext('2d').createImageData(N, N); }
      const px = rimg.data, ct = Math.cos(TILT), st = Math.sin(TILT), r0 = rot * RAD;
      for (let j = 0; j < N; j++) { const yv = 1 - (j + 0.5) / N * 2; for (let i = 0; i < N; i++) { const xv = (i + 0.5) / N * 2 - 1, rr = xv * xv + yv * yv, o = (j * N + i) * 4; if (rr > 1) { px[o + 3] = 0; continue; }
        const zv = Math.sqrt(1 - rr), y0 = yv * ct + zv * st, z0 = -yv * st + zv * ct; // undo the tilt
        const lat = Math.asin(Math.max(-1, Math.min(1, y0))), lon = r0 + Math.atan2(xv, z0);
        const u = Math.floor(((lon / (2 * Math.PI) + 0.5) % 1 + 1) % 1 * map.w), v = Math.min(map.h - 1, Math.floor((0.5 - lat / Math.PI) * map.h)), q = (v * map.w + u) * 4;
        const cl = Math.cos(lat), sun = cl * Math.cos(lon) * sunV[0] + cl * Math.sin(lon) * sunV[1] + Math.sin(lat) * sunV[2], day = Math.min(1, Math.max(0, (sun + 0.12) / 0.24)), lit = (0.34 + 0.66 * day) * (0.55 + 0.45 * zv); /* night side dimmed, not black: you see the continents at night too */
        px[o] = map.d[q] * lit * (1 - 0.25 * (1 - day)); px[o + 1] = map.d[q + 1] * lit * (1 - 0.1 * (1 - day)); px[o + 2] = Math.min(255, map.d[q + 2] * lit + (1 - day) * 22); px[o + 3] = 255; } }
      rc.getContext('2d').putImageData(rimg, 0, 0); ctx.save(); disc(); ctx.clip(); ctx.drawImage(rc, cx - R, cy - R, R * 2, R * 2); ctx.restore();
    }
    const at = ctx.createRadialGradient(cx, cy, R * 0.86, cx, cy, R * 1.01); at.addColorStop(0, 'rgba(120,180,255,0)'); at.addColorStop(1, 'rgba(140,195,255,.35)'); ctx.fillStyle = at; disc(); ctx.fill();
    let youAt = null;
    if (me) { const p = P(me.lat, me.lon); if (p.z > 0) { youAt = p; ctx.save(); ctx.fillStyle = 'rgba(255,77,77,.25)'; ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ff4d4d'; ctx.strokeStyle = '#fff2b3'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(p.x, p.y, 3.6, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.font = '700 9.5px "SC Label", "Barlow Condensed", sans-serif'; ctx.fillStyle = '#ff6a6a'; ctx.fillText('YOU', p.x + 8, p.y + 3); ctx.restore(); /* you: red with a cream ring, unlike any satellite dot (2026-10-27, Sevaan) */ } }
    // your satellites: behind the Earth faint, in front bright, the rarest few in front named
    const front = [];
    for (const it of items) { if (!it.ok) continue; const p = P(it.lat, it.lon, lift(it.h)); it.p = p;
      ctx.globalAlpha = p.behind ? 0.22 : 1; ctx.fillStyle = it.col;
      if (!p.behind && it.rank >= 2) { ctx.globalAlpha = 0.25; ctx.beginPath(); ctx.arc(p.x, p.y, it.rank >= 3 ? 7 : 5.5, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; } /* a soft halo, not shadowBlur (slow on phones) */
      ctx.beginPath(); ctx.arc(p.x, p.y, it.rank >= 3 ? 3.4 : it.rank >= 2 ? 2.8 : 2.1, 0, Math.PI * 2); ctx.fill();
      if (!p.behind && p.z > -0.2) front.push(it); }
    ctx.globalAlpha = 1;
    ctx.font = '600 9.5px "SC Label", "Barlow Condensed", sans-serif'; ctx.fillStyle = '#fff2b3';
    const named = [];
    for (const it of front.sort((a, b) => b.rank - a.rank || b.icon - a.icon).slice(0, 8)) { if (named.length >= 3) break;
      if (named.some((n) => Math.abs(n.p.x - it.p.x) < 70 && Math.abs(n.p.y - it.p.y) < 14)) continue;
      if (youAt && Math.abs(youAt.y - it.p.y) < 14 && it.p.x - 10 < youAt.x + 30 && it.p.x + 110 > youAt.x) continue; // not on top of YOU
      const w = ctx.measureText(it.label).width, left = it.p.x + 6 + w > W - 4; ctx.fillText(it.label, left ? it.p.x - 6 - w : it.p.x + 6, it.p.y + 3); named.push(it); }
    raf = requestAnimationFrame(draw);
  }
  // a tap (not a swipe) on a dot opens its card
  let down = null;
  cv.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; });
  cv.addEventListener('pointerup', (e) => { if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) { down = null; return; } down = null;
    const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top; let best = null, bd = 18;
    for (const it of items) { if (!it.ok || !it.p || it.p.behind) continue; const dd = Math.hypot(it.p.x - x, it.p.y - y); if (dd < bd) { bd = dd; best = it; } }
    if (best && onPick) onPick(best.key); });
  return {
    set(cards) {
      items = cards.map((c) => { const s = c.satrec ?? satrecFor(c); if (!s) return null; const rank = RANK[c.tier] ?? 0;
        return { key: c.key, s, rank, icon: c.icon ? 1 : 0, col: TIER_INFO[c.tier]?.color ?? '#fff2b3', label: shortLabel(c.short ?? c.title ?? c.name ?? ''), name: c.title ?? c.name }; }).filter(Boolean);
      place(Date.now()); posAt = 0;
      if (shown && !raf) raf = requestAnimationFrame(draw);
      return items.length;
    },
    where() { // "Hubble is over the Pacific": the rarest first, then round the rest
      const ok = items.filter((i) => i.ok).sort((a, b) => b.rank - a.rank || b.icon - a.icon); if (!ok.length) return '';
      const it = ok[turn++ % Math.min(ok.length, 6)]; return `${it.name} is over ${placeName(it.lat, it.lon)}`;
    },
  };
}
