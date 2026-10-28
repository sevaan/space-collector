// Your satellites, live (2026-10-27, Sevaan: a second card beside the rank card at the top of the Collection, swiped
// between with two dots). Every satellite, station, stage and piece of debris you own, where it is this second (the
// sky's own model, satellite.js), around a blueprint Earth (design/earth-styles.html C) that turns slowly, you marked.
// Dots are in the card's rarity colour; the rarest few in view are named. Tap a dot to open its card. Draws only while
// it's on screen. Fleet cards (Starlink and co.) aren't on it yet.
import * as sat from './lib/satellite.js?v=0.1.1238';
import { satrecFor } from './orbit.js?v=0.1.1238';
import { COAST } from './coast.js?v=0.1.1238';
import { TIER_INFO } from './rarity.js?v=0.1.1238';
import { placeName } from './geo.js?v=0.1.1238';

const RAD = Math.PI / 180, RE = 6371, TILT = 20 * RAD;
const RANK = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };
// How high a dot sits off the surface: true up to 2,000 km, squeezed beyond so high orbits stay in the picture.
const lift = (h) => (h < 2000 ? h : 2000 + Math.min(h - 2000, 40000) * 0.04) / RE;

// cards: owned card models with orbits; host: the element to draw into; me: { lat, lon } or null; onPick(key).
// Returns { set(cards), where() } — where(): one line about one of them, a different one each call.
export function satGlobe(host, { me = null, onPick = null } = {}) {
  const cv = document.createElement('canvas'); cv.className = 'sg-canvas'; host.appendChild(cv);
  const ctx = cv.getContext('2d');
  let items = [], rot = me ? me.lon : -80, last = 0, raf = 0, shown = false, posAt = 0, turn = 0;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const io = new IntersectionObserver(([e]) => { shown = e.isIntersecting; if (shown && !raf) raf = requestAnimationFrame(draw); }, { threshold: 0.05 });
  io.observe(cv);
  const away = () => document.hidden || document.documentElement.classList.contains('away');
  function place(t) {
    const g = sat.gstime(new Date(t));
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
    const oc = ctx.createRadialGradient(cx - R * 0.4, cy - R * 0.45, R * 0.05, cx, cy, R * 1.02); oc.addColorStop(0, '#1f4369'); oc.addColorStop(0.55, '#0f2542'); oc.addColorStop(1, '#050d18'); ctx.fillStyle = oc; disc(); ctx.fill(); // lit from the upper left (2026-10-27, Sevaan: some dimension)
    ctx.save(); disc(); ctx.clip();
    ctx.strokeStyle = 'rgba(143,180,216,.2)'; ctx.lineWidth = 1;
    for (let la = -75; la <= 75; la += 15) { ctx.beginPath(); let pen = false; for (let lo = -180; lo <= 180; lo += 6) { const p = P(la, lo); if (p.z <= 0) { pen = false; continue; } pen ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); pen = true; } ctx.stroke(); }
    for (let lo = -180; lo < 180; lo += 15) { ctx.beginPath(); let pen = false; for (let la = -90; la <= 90; la += 6) { const p = P(la, lo); if (p.z <= 0) { pen = false; continue; } pen ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); pen = true; } ctx.stroke(); }
    const land = new Path2D();
    for (const ring of COAST) { const ps = ring.map(([lo, la]) => P(la, lo)); if (!ps.some((p) => p.z > 0)) continue;
      ps.forEach((p, i) => { const q = p.z > 0 ? p : (() => { const dx = p.x - cx, dy = p.y - cy, k = Math.hypot(dx, dy) || 1; return { x: cx + (dx / k) * R, y: cy + (dy / k) * R }; })(); i ? land.lineTo(q.x, q.y) : land.moveTo(q.x, q.y); }); land.closePath(); }
    const coast = new Path2D(); /* only the near side, pen lifted across the back: stroking the fill path drew chords across the globe (2026-10-27) */
    for (const ring of COAST) { let pen = false; for (const [lo, la] of ring) { const p = P(la, lo); if (p.z <= 0) { pen = false; continue; } pen ? coast.lineTo(p.x, p.y) : coast.moveTo(p.x, p.y); pen = true; } }
    ctx.fillStyle = 'rgba(143,180,216,.1)'; ctx.fill(land); ctx.strokeStyle = 'rgba(255,242,179,.85)'; ctx.lineWidth = 1; ctx.stroke(coast);
    const hi = ctx.createRadialGradient(cx - R * 0.42, cy - R * 0.48, 0, cx - R * 0.42, cy - R * 0.48, R * 0.7); hi.addColorStop(0, 'rgba(190,220,255,.16)'); hi.addColorStop(1, 'rgba(190,220,255,0)'); ctx.fillStyle = hi; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
    const sh = ctx.createRadialGradient(cx - R * 0.4, cy - R * 0.45, R * 0.2, cx - R * 0.1, cy - R * 0.1, R * 1.25); sh.addColorStop(0, 'rgba(5,12,24,0)'); sh.addColorStop(0.55, 'rgba(5,12,24,.08)'); sh.addColorStop(1, 'rgba(5,12,24,.7)');
    ctx.fillStyle = sh; ctx.fillRect(cx - R, cy - R, R * 2, R * 2); ctx.restore();
    ctx.strokeStyle = 'rgba(255,242,179,.7)'; ctx.lineWidth = 1.2; disc(); ctx.stroke();
    if (me) { const p = P(me.lat, me.lon); if (p.z > 0) { ctx.fillStyle = '#fff2b3'; ctx.beginPath(); ctx.arc(p.x, p.y, 2.4, 0, Math.PI * 2); ctx.fill(); ctx.font = '600 9px "SC Label", "Barlow Condensed", sans-serif'; ctx.fillText('YOU', p.x + 4, p.y - 3); } }
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
        return { key: c.key, s, rank, icon: c.icon ? 1 : 0, col: TIER_INFO[c.tier]?.color ?? '#fff2b3', label: (c.short ?? c.title ?? c.name ?? '').toUpperCase().slice(0, 22), name: c.title ?? c.name }; }).filter(Boolean);
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
