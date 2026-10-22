// Canvas renderer for the sky view. Gnomonic (pinhole camera) projection around where the phone points.
import { extinction } from './sky-limit.js?v=0.1.1021';
// Two themes: 'glass' (ink, cream and orange celestial chart) and 'night' (all red, keeps dark adaptation).
import { createMilkyGL } from './milkyway-gl.js?v=0.1.1021';

import { enuFromAzEl, compassPoint } from './orbit.js?v=0.1.1021';
import { createCloudGL } from './clouds-gl.js?v=0.1.1021';
// Cloud colours by light: sunlit tops, shadowed bellies, and the horizon haze they melt into (0–1 RGB).
const CLOUD_LIGHT = {
  day: { lit: [1, 1, 1], shade: [0.62, 0.68, 0.77], haze: [0.82, 0.87, 0.93] },
  dusk: { lit: [1, 0.8, 0.68], shade: [0.36, 0.33, 0.42], haze: [0.62, 0.5, 0.52] },
  night: { lit: [0.22, 0.25, 0.31], shade: [0.1, 0.12, 0.16], haze: [0.14, 0.15, 0.2] },
};
import { TIER_INFO } from './rarity.js?v=0.1.1021';

const RAD = Math.PI / 180;
const SECRET_PX = { santa: 24, roadster: 12.4, voyager: 14.5, voyager2: 14.5, pioneer10: 11.7, pioneer11: 11.7, newhorizons: 6.4, arecibo: 6.9, halley: 8.6, sputnik: 11.2, laika: 13.3, wow: 9.8 };
const BELOW_ICON = 10.5, BELOW_ICON_HIT = 20; // every satellite under the horizon, passes and halo alike (80% of 13 since 2026-10-13); lined up in the circle it grows
const FONT = '"SC Label", "Barlow Condensed", "Arial Narrow", sans-serif';
const DISPLAY_FONT = '"SC Display", "Russo One", sans-serif';

const THEMES = {
  glass: {
    bgTop: '#0c1d29', bgBottom: '#080f1b',
    milky: [111, 139, 154], milkyOpacity: 0.62, milkyPhoto: 0.75, riftRgb: [8, 15, 27],
    grid: 'rgba(173, 188, 200, 0.065)',
    horizon: 'rgba(255, 242, 179, 0.38)',
    ground: '#070e16', groundEdge: 'rgba(173, 188, 200, 0.10)',
    hills: '#101e29', haze: 'rgb(143, 179, 207)',
    groundInk: 'rgba(143, 179, 207, 0.20)', groundText: 'rgba(255, 242, 179, 0.53)', groundNorth: '#fa8127', ghost: '#fa8127', ghostText: 'rgba(255, 242, 179, 0.85)', ghostPill: 'rgba(8, 15, 27, 0.94)',
    label: '#fff2b3', labelDim: 'rgba(173, 188, 200, 0.83)',
    compass: 'rgba(255, 242, 179, 0.78)',
    sat: '#fff2b3', satGlow: [250, 129, 39], satHot: '#fff2b3',
    dim: 'rgba(173, 188, 200, 0.35)',
    bead: [250, 129, 39], trailPast: 'rgba(255, 242, 179, 0.26)',
    reticle: 'rgba(255, 242, 179, 0.66)', reticleSoft: 'rgba(173, 188, 200, 0.35)', tick: '#fa8127', plane: '#f16b4c', planeDim: '#be776a',
    constLine: 'rgba(143, 179, 207, 0.28)', constLabel: 'rgba(173, 188, 200, 0.73)', constCase: (s) => s.toUpperCase(),
    starRGB: [255, 242, 179], star: (a) => `rgba(255, 242, 179, ${a})`, starLabel: 'rgba(173, 188, 200, 0.78)',
    body: '#fff2b3', planet: '#fff2b3',
    moonLit: '#fff2b3', moonDark: '#18232f', moonEdge: 'rgba(173, 188, 200, 0.5)',
    sun: '#fa8127',
  },
  night: {
    bgTop: '#000', bgBottom: '#000',
    milky: [158, 25, 18],
    grid: 'rgba(255, 70, 50, 0.14)',
    horizon: 'rgba(255, 70, 50, 0.55)',
    ground: '#0a0100', groundEdge: 'rgba(255, 70, 50, 0.08)',
    hills: '#140200', haze: 'rgb(150, 30, 20)',
    groundInk: 'rgba(255, 70, 50, 0.14)', groundText: 'rgba(255, 90, 70, 0.4)', groundNorth: 'rgba(255, 110, 90, 0.7)', ghost: 'rgba(255, 106, 85, 0.9)', ghostText: 'rgba(255, 120, 100, 0.9)', ghostPill: 'rgba(12, 1, 0, 0.85)',
    label: 'rgba(255, 110, 90, 0.85)', labelDim: 'rgba(255, 110, 90, 0.55)',
    compass: 'rgba(255, 110, 90, 0.85)',
    sat: '#bb3c32', satGlow: [161, 32, 24], satHot: '#da5140',
    dim: 'rgba(255, 80, 60, 0.28)',
    bead: [255, 106, 85], trailPast: 'rgba(255, 90, 70, 0.2)',
    reticle: 'rgba(194, 50, 35, 0.8)', reticleSoft: 'rgba(194, 50, 35, 0.08)', tick: '#d94f38', plane: '#ff3b2b', planeDim: '#b8332a',
    constLine: 'rgba(255, 120, 100, 0.13)', constLabel: 'rgba(255, 120, 100, 0.3)', constCase: (s) => s.toUpperCase(),
    starRGB: [180, 44, 31], star: (a) => `rgba(180, 44, 31, ${a})`, starLabel: 'rgba(190, 57, 43, 0.55)',
    body: 'rgba(208, 61, 43, 0.9)', planet: 'rgba(218, 67, 45, 0.95)',
    moonLit: 'rgba(193, 50, 35, 0.95)', moonDark: 'rgba(32, 5, 3, 0.9)', moonEdge: 'rgba(163, 37, 26, 0.35)',
    sun: 'rgba(255, 120, 60, 0.9)',
  },
};

// Optional night landscape along the horizon: far hills and a tree line, kept low (under ~2.5°)
// so nothing real is hidden, and satellites are always drawn on top.
const LANDSCAPE = (() => {
  let seed = 4242;
  const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const hills = [];
  const p1 = r() * 6, p2 = r() * 6, p3 = r() * 6;
  for (let az = 0; az <= 360; az += 2) {
    const a = az * Math.PI / 180;
    hills.push([az, Math.max(0.3, 1.2 + 0.7 * Math.sin(a * 2 + p1) + 0.4 * Math.sin(a * 5 + p2) + 0.2 * Math.sin(a * 11 + p3))]);
  }
  // Each pine (2026-10-08, higher fidelity): [az, height, width, tiers, lean, seed]. A far row behind it, smaller and hazier.
  const trees = [], far = [];
  for (let az = 0; az < 360; az += 0.5 + r() * 1.0) {
    if (r() < 0.06) { az += 2 + r() * 6; continue; } // clearings
    trees.push([az, 1.2 + r() ** 1.6 * 2.2, 0.7 + r() * 0.9, 4 + Math.floor(r() * 3), (r() - 0.5) * 0.08, r()]);
  }
  for (let az = 0.3; az < 360; az += 0.35 + r() * 0.6) { if (r() < 0.1) { az += 1 + r() * 4; continue; } far.push([az, 0.6 + r() * 1.1, 0.45 + r() * 0.5, 3 + Math.floor(r() * 2), 0, r()]); }
  // Two more ranges for depth (2026-10-08): a distant blue ridge behind, a nearer rolling green band in front.
  const ridge = [], rolls = [];
  const q1 = r() * 6, q2 = r() * 6, q3 = r() * 6;
  for (let az = 0; az <= 360; az += 1.5) { const a = az * Math.PI / 180;
    ridge.push([az, Math.max(0.6, 2.1 + 0.9 * Math.sin(a * 3 + q1) + 0.5 * Math.sin(a * 7 + q2) + 0.25 * Math.sin(a * 17 + q3))]);
    rolls.push([az, Math.max(0.15, 0.55 + 0.35 * Math.sin(a * 4 + q2) + 0.18 * Math.sin(a * 9 + q1))]); }
  // Meadow tufts along the nearest band: [az, el (below horizon), height, lean].
  const tufts = [];
  for (let az = 0; az < 360; az += 0.25 + r() * 0.35) tufts.push([az, -0.4 - r() * 3.5, 0.25 + r() * 0.5, (r() - 0.5) * 0.6]);
  return { hills, trees, far, ridge, rolls, tufts };
})();

// Earth’s shadow at H km (default 500) for a Sun direction s (ENU unit vector, observer at (0,0,R) from Earth’s centre).
// edges: the outline as runs of ENU directions, horizon to horizon. It is drawn straight from geometry (2026-10-17,
// Sevaan: the traced line stopped partway down where the edge runs steeply): the shadow’s edge at height H is the circle
// where the cylinder of radius R behind Earth meets the sphere of radius R + H; each of its points, seen from you, is
// one point of the line. cols: the shade as quads of ENU directions, strips 2° of azimuth wide whose top and bottom follow
// the edge at both sides (slanted, not stepped).
const SHADOW_AZ = 2;
const BELOW_SAT_A = 0.6; // satellites under the ground, at their brightest (next to the circle)
function shadowShape(s, H = 500) {
  const R = 6371, EL = 3;
  const dark = (az, el) => {
    const d = enuFromAzEl(az, el), t = -R * d[2] + Math.sqrt(R * R * d[2] * d[2] + (R + H) ** 2 - R * R);
    const v = [t * d[0], t * d[1], t * d[2] + R], proj = v[0] * s[0] + v[1] * s[1] + v[2] * s[2];
    return proj < 0 && v[0] * v[0] + v[1] * v[1] + v[2] * v[2] - proj * proj < R * R;
  };
  const cross = (az, lo, hi, loDark) => { for (let i = 0; i < 10; i++) { const m = (lo + hi) / 2; if (dark(az, m) === loDark) lo = m; else hi = m; } return (lo + hi) / 2; };
  let any = false, all = true;
  // Dark stretches of elevation [from, to] along one azimuth, ends found by bisection.
  const spans = (az) => {
    const out = []; let prev = dark(az, 0), from = prev ? 0 : null;
    for (let el = EL; el <= 90; el += EL) {
      const cur = dark(az, el);
      if (cur !== prev) { const e = cross(az, el - EL, el, prev); if (cur) from = e; else { out.push([from, e]); from = null; } }
      if (cur) any = true; else all = false; prev = cur;
    }
    if (from != null) out.push([from, 90]);
    return out;
  };
  const at = []; for (let az = 0; az <= 360; az += SHADOW_AZ) at.push(spans(az % 360));
  const cols = [];
  for (let k = 0; k < at.length - 1; k++) {
    const a0 = k * SHADOW_AZ, a1 = a0 + SHADOW_AZ, L = at[k], Rr = at[k + 1];
    if (L.length === Rr.length) L.forEach(([f0, t0], n) => { const [f1, t1] = Rr[n]; cols.push([enuFromAzEl(a0, f0), enuFromAzEl(a1, f1), enuFromAzEl(a1, t1), enuFromAzEl(a0, t0)]); });
    else for (const [f, t] of spans(a0 + SHADOW_AZ / 2)) cols.push([enuFromAzEl(a0, f), enuFromAzEl(a1, f), enuFromAzEl(a1, t), enuFromAzEl(a0, t)]); // the edge turns here: a plain strip
  }
  // The outline: P(φ) = −a·ŝ + R(cos φ·u + sin φ·w), a = √((R+H)² − R²), seen from the observer at (0, 0, R).
  const a = Math.sqrt((R + H) ** 2 - R * R), h = Math.abs(s[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
  const cr = (x, y) => [x[1] * y[2] - x[2] * y[1], x[2] * y[0] - x[0] * y[2], x[0] * y[1] - x[1] * y[0]], nz = (x) => { const m = Math.hypot(...x); return x.map((c) => c / m); };
  const u = nz(cr(s, h)), w = cr(s, u);
  const edges = []; let run = null;
  for (let deg = 0; deg <= 360; deg += 0.75) {
    const f = deg * Math.PI / 180, c = Math.cos(f), sn = Math.sin(f);
    const d = nz([-a * s[0] + R * (c * u[0] + sn * w[0]), -a * s[1] + R * (c * u[1] + sn * w[1]), -a * s[2] + R * (c * u[2] + sn * w[2]) - R]);
    if (d[2] < -0.01) { run = null; continue; } // below the horizon
    if (!run) { run = []; edges.push(run); } run.push(d);
  }
  // A run that wraps past φ = 360° joins the one that started at 0°.
  if (edges.length > 1 && edges[0].length && edges.at(-1).length) { const first = edges[0], last = edges.at(-1); const g = Math.hypot(first[0][0] - last.at(-1)[0], first[0][1] - last.at(-1)[1], first[0][2] - last.at(-1)[2]); if (g < 0.05) { edges[0] = last.concat(first); edges.pop(); } }
  return { cols, edges, any, all };
}

// Is this canvas colour dark? (#rrggbb or rgb()/rgba(), as ctx.fillStyle reports it.)
function inkIsDark(c) {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(c), n = m ? m.slice(1).map((h) => parseInt(h, 16)) : (String(c).match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
  return n.length === 3 && 0.299 * n[0] + 0.587 * n[1] + 0.114 * n[2] < 110;
}
export class SkyView {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = this.mainCtx = canvas.getContext('2d'); // mainCtx: what every frame draws to, whatever happened before
    this.fovV = 70; // vertical field of view, degrees
    this.theme = THEMES.glass;
    this.targetPos = null;
    this.safeTop = 150;
    this.safeBottom = 230;
    this.sprites = new Map();
    this.labelQueue = [];
    this.reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  setTheme(name) { this.theme = THEMES[name] ?? THEMES.glass; }

  resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.canvas.width = Math.round(this.w * dpr);
    this.canvas.height = Math.round(this.h * dpr);
    this.canvas.style.width = `${this.w}px`;
    this.canvas.style.height = `${this.h}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.f = (this.h / 2) / Math.tan((this.fovV / 2) * RAD);
    this.cx = this.w / 2;
    this.cy = this.h / 2; // the middle of the phone, same spot as the loader’s circle (index.html #ld-ret)
  }

  // Angular radius (degrees) that the reticle circle covers.
  get reticleDeg() { return 6; }
  get reticlePx() { return this.f * Math.tan(this.reticleDeg * RAD); }

  // ENU unit vector -> camera coords. z > 0 means in front of the phone.
  cam(v) {
    const b = this.basis;
    return {
      x: v[0] * b.right[0] + v[1] * b.right[1] + v[2] * b.right[2],
      y: v[0] * b.up[0] + v[1] * b.up[1] + v[2] * b.up[2],
      z: v[0] * b.back[0] + v[1] * b.back[1] + v[2] * b.back[2],
    };
  }

  project(v) {
    const c = this.cam(v);
    if (c.z <= 0.05) return null;
    return { x: this.cx + (this.f * c.x) / c.z, y: this.cy - (this.f * c.y) / c.z, c };
  }

  onScreen(p, pad = 0) {
    return p && p.x > -pad && p.x < this.w + pad && p.y > -pad && p.y < this.h + pad;
  }

  // Draw a polyline through ENU points, breaking where it goes behind the phone.
  path(vectors, minUp = -Infinity) {
    const ctx = this.ctx;
    let drawing = false;
    ctx.beginPath();
    for (const v of vectors) {
      const p = v[2] >= minUp ? this.project(v) : null;
      if (!p || Math.abs(p.x) > 1e5 || Math.abs(p.y) > 1e5) { drawing = false; continue; }
      if (drawing) ctx.lineTo(p.x, p.y); else { ctx.moveTo(p.x, p.y); drawing = true; }
    }
    ctx.stroke();
  }

  // Filled polygon from az/el corners; skipped if any corner is behind the phone.
  poly(corners) {
    const pts = [];
    for (const [az, el] of corners) {
      const p = this.project(enuFromAzEl(az, el));
      if (!p || Math.abs(p.x) > 2e4 || Math.abs(p.y) > 2e4) return false;
      pts.push(p);
    }
    const ctx = this.ctx;
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.closePath();
    if (this.outlineOnly) { ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 1.1; ctx.lineJoin = 'round'; ctx.stroke(); } else ctx.fill(); // camera view: outlines
    return true;
  }

  // Reused soft sprites avoid building radial gradients for every star, every frame.
  glowSprite(rgb) {
    const key = rgb.join(',');
    if (this.sprites.has(key)) return this.sprites.get(key);
    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = 128;
    const ctx = sprite.getContext('2d');
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, `rgba(${key}, 0.8)`);
    gradient.addColorStop(0.18, `rgba(${key}, 0.38)`);
    gradient.addColorStop(0.5, `rgba(${key}, 0.11)`);
    gradient.addColorStop(1, `rgba(${key}, 0)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    this.sprites.set(key, sprite);
    if (this.sprites.size > 48) this.sprites.delete(this.sprites.keys().next().value); // oldest out: canvas memory is precious on iPhone
    return sprite;
  }

  // A broad, even falloff (gaussian) for the Milky Way’s haze: the star-glow sprite above is bright only at its very
  // centre, which drew the band as a thin beam (2026-10-08).
  softSprite(rgb) {
    const key = `soft:${rgb.join(',')}`;
    if (this.sprites.has(key)) return this.sprites.get(key);
    const sprite = document.createElement('canvas'); sprite.width = sprite.height = 128;
    const ctx = sprite.getContext('2d'), g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    for (let i = 0; i <= 10; i++) { const t = i / 10; g.addColorStop(t, `rgba(${rgb.join(',')}, ${(Math.exp(-3.2 * t * t) - Math.exp(-3.2)) / (1 - Math.exp(-3.2))})`); }
    ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
    this.sprites.set(key, sprite);
    return sprite;
  }
  soft(x, y, radius, rgb, alpha) { const ctx = this.ctx; ctx.save(); ctx.globalAlpha *= alpha; ctx.drawImage(this.softSprite(rgb), x - radius, y - radius, radius * 2, radius * 2); ctx.restore(); }
  glow(x, y, radius, rgb, alpha = 1) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.drawImage(this.glowSprite(rgb), x - radius, y - radius, radius * 2, radius * 2);
    ctx.restore();
  }

  // In or right by the circle: on screen, whatever the HUD insets say (iOS playtest 2026-10-20: in the tour the lifted
  // circle sits above safeTop, so the Sun inside it also got an edge arrow).
  nearRing(p) { return !!p && Math.hypot(p.x - this.cx, p.y - this.cy) < this.reticlePx * 1.6; }
  inSky(p, pad = 0) {
    return p && p.x >= 16 + pad && p.x <= this.w - 16 - pad &&
      p.y >= this.safeTop + pad && p.y <= this.h - this.safeBottom - pad;
  }

  // Settings → Sky labels (2026-10-21): 'all', 'new' (only cards you don't have yet) or 'off'. main sets ownedObj/ownedName.
  labelOk(o, name) { const m = this.labelMode ?? 'all'; if (m === 'all') return true; if (m === 'off') return false; return o ? !this.ownedObj?.(o) : !this.ownedName?.(name); }
  queueLabel(text, p, { color = this.theme.labelDim, size = 12, weight = 600, gap = 9, priority = 0, align = 'auto' } = {}) {
    if (!text || !this.inSky(p)) return;
    // Keep the area around a new find clear so its name and "tap to collect" are easy to read.
    const z = this.clearZone;
    if (z && p.x > z.left && p.x < z.right && p.y > z.top && p.y < z.bottom) return;
    this.labelQueue.push({ text, p, color, size, weight, gap, priority, align });
  }

  drawLabels() {
    const ctx = this.ctx;
    if ((this.feetA ?? 0) > 0.98) { this.labelQueue.length = 0; return; } // looking down: the compass at your feet does the naming
    this.labelSide ??= new Map(); this.frameNo = (this.frameNo ?? 0) + 1;
    if (this.frameNo % 300 === 0) for (const [k, v] of this.labelSide) if (this.frameNo - (v.seen ?? 0) > 300) this.labelSide.delete(k); // forget labels long off screen
    const ring = this.ring ?? { x: this.cx, y: this.cy, r: this.reticlePx };
    const r = ring.r + 16;
    const occupied = [{ x: ring.x - r, y: ring.y - r, w: 2 * r, h: 2 * r }];
    for (const b of this.uiBoxes ?? []) occupied.push(b); // the HUD's own boxes (main.js uiBoxes)
    if (this.clearZone) {
      const z = this.clearZone;
      occupied.push({ x:z.left, y:z.top, w:z.right - z.left, h:z.bottom - z.top });
    }
    const overlaps = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    for (const label of this.labelQueue.sort((a, b) => b.priority - a.priority)) {
      const { p, color, size, weight, gap, align } = label;
      ctx.font = `${weight} ${size}px ${FONT}`;
      let text = label.text;
      const maxWidth = Math.min(170, this.w * 0.43);
      while (text.length > 3 && ctx.measureText(text).width > maxWidth) text = text.slice(0, -2) + '…';
      const width = ctx.measureText(text).width;
      const candidates = align === 'center' ? [[p.x - width / 2, p.y - size / 2]] : [
        [p.x + gap, p.y - size / 2], [p.x - gap - width, p.y - size / 2],
        [p.x - width / 2, p.y + gap], [p.x - width / 2, p.y - gap - size],
      ];
      // Near a screen edge the centred spots spill off; slide them in rather than dropping the label (2026-10-07:
      // planets beside the circle near the edge lost their names).
      const lo = 20, hi = this.w - 20 - width;
      for (const c of candidates.slice(2)) candidates.push([Math.max(lo, Math.min(hi, c[0])), c[1]]);
      // Sticky sides (2026-10-06, Sevaan: labels hopped round their stars as the phone moved): a label keeps the side
      // it last used. If that side is briefly blocked it hides for a moment instead of jumping; only after ~1/3 s
      // blocked does it move to another side, and it stays there.
      const fits = (i) => { const [x, y] = candidates[i]; const box = { x: x - 4, y: y - 3, w: width + 8, h: size + 7 };
        return this.inSky({ x: box.x, y: box.y }) && this.inSky({ x: box.x + box.w, y: box.y + box.h }) && !occupied.some((o) => overlaps(box, o)) ? box : null; };
      const mem = this.labelSide.get(label.text) ?? { i: 0, blocked: 0 };
      let pick = -1, box = null;
      if (mem.i < candidates.length && (box = fits(mem.i))) { pick = mem.i; mem.blocked = 0; }
      else if (++mem.blocked > 20 || !this.labelSide.has(label.text)) {
        for (let i = 0; i < candidates.length; i++) if (i !== mem.i && (box = fits(i))) { pick = i; break; }
        if (pick >= 0) { mem.i = pick; mem.blocked = 0; }
      }
      mem.seen = this.frameNo; this.labelSide.set(label.text, mem);
      if (pick >= 0) {
        let [x, y] = candidates[pick];
        // When a label does change sides, it slides round to the new side rather than snapping (2026-10-08).
        const ox = x - p.x, oy = y - p.y, recent = this.frameNo - (mem.lastDrawn ?? -99) <= 2;
        if (recent && mem.ox != null && !this.reducedMotion) { mem.ox += (ox - mem.ox) * 0.25; mem.oy += (oy - mem.oy) * 0.25; x = p.x + mem.ox; y = p.y + mem.oy; } else { mem.ox = ox; mem.oy = oy; }
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillStyle = color;
        // Fade in over ~1/4 s when a label first appears (2026-10-08 polish), rather than popping.
        if (!mem.shownAt || this.frameNo - (mem.lastDrawn ?? -99) > 2) mem.shownAt = this.frameNo;
        mem.lastDrawn = this.frameNo;
        const fa = this.reducedMotion ? 1 : Math.min(1, (this.frameNo - mem.shownAt) / 14);
        ctx.save(); ctx.globalAlpha *= fa; if ((this.dayF ?? 0) > 0.3 && !this.camera) { const dark = inkIsDark(ctx.fillStyle); ctx.shadowColor = dark ? 'rgba(238,243,255,.55)' : 'rgba(8,15,27,.6)'; ctx.shadowBlur = dark ? 3 : 4; } /* dark ink (the Sun’s label by day) gets a light halo, not a smudge (2026-10-18 playtest) */ ctx.fillText(text, x, y); ctx.restore(); // a soft dark halo by day, so cream text reads on the pale sky (visual playtest 2026-10-17)
        occupied.push(box);
      } else if (!this.reducedMotion && mem.lastDrawn && mem.i < candidates.length && this.frameNo - mem.lastDrawn < 10) {
        // Briefly blocked: fade out where it was over ~1/6 s instead of vanishing (2026-10-08, Sevaan: text jumping).
        const [x, y] = candidates[mem.i], fo = 1 - (this.frameNo - mem.lastDrawn) / 10;
        ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = color;
        ctx.save(); ctx.globalAlpha *= fo * Math.min(1, (mem.lastDrawn - (mem.shownAt ?? 0)) / 14); ctx.fillText(text, x, y); ctx.restore();
      }
    }
    ctx.textBaseline = 'alphabetic';
  }

  // Camera view’s ground tint: full by day, half at night (2026-10-08, Sevaan), easing across twilight with dayF.
  // The sky tint itself goes to nothing at night (drawBackground), so the real night sky shows untouched.
  camDim() { return 0.5 + 0.5 * Math.max(0, Math.min(1, this.dayF ?? 0)); }
  drawBackground() {
    const ctx = this.ctx, t = this.theme, f = this.dayF ?? 0;
    // Camera prototype (2026-10-08): the real sky is behind the canvas, so leave it clear (a faint dark veil at night).
    // Camera view (2026-10-08, Sevaan): the real sky colour for the time of day is painted see-through over the picture
    // (blue by day, dusk, night); below the horizon the camera shows through untouched (drawGround cuts the sky away).
    if (this.camera) { ctx.clearRect(0, 0, this.w, this.h); ctx.save(); ctx.globalAlpha = 0.95 * Math.max(0, Math.min(1, this.dayF ?? 0)); this.camera = false; this.drawBackground(); this.camera = true; ctx.restore(); return; }
    const g = ctx.createLinearGradient(0, 0, 0, this.h);
    if (f <= 0) { g.addColorStop(0, t.bgBottom); g.addColorStop(1, t.bgTop); this.tone = { a: t.bgBottom, b: t.bgTop, f: 0 }; }
    else {
      // The real sky by day and at dusk (2026-10-06): navy → dusk orange along the horizon → pale blue.
      const mix = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
      const rgb = (c) => `rgb(${c.join(',')})`;
      const nightTop = [12, 29, 41], nightBot = [8, 15, 27], duskTop = [27, 42, 90], duskBot = [240, 163, 90], dayTop = [63, 127, 191], dayBot = [185, 214, 234];
      const k = f < 0.5 ? f * 2 : (f - 0.5) * 2;
      const top = f < 0.5 ? mix(nightTop, duskTop, k) : mix(duskTop, dayTop, k), bot = f < 0.5 ? mix(nightBot, duskBot, k) : mix(duskBot, dayBot, k);
      g.addColorStop(0, rgb(top)); g.addColorStop(1, rgb(bot)); this.tone = { a: rgb(top), b: rgb(bot), f };
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.w, this.h);
    // Soft atmospheric light, not decorative stars. All star positions come from the catalog.
    if (f < 0.2) this.glow(this.cx, this.cy, Math.max(this.w, this.h) * 0.72, t.milky, 0.045 * (1 - f * 5));
  }

  // Dashed "ghost" markers: things up there right now that can’t be seen until dark (daytime Explore).
  // ghosts: [{ enu, name, note }]
  drawGhosts(ghosts) {
    const ctx = this.ctx; this.ghostHits = [];
    ctx.save(); ctx.lineWidth = 1.2;
    for (const g of ghosts) {
      if (g.path?.ahead) { // a soft trail in the pass’s rarity colour: faint where it comes from, fading out where it goes
        const pts = (list) => list.filter((e) => e[2] > 0).map((e) => this.project(e)).filter(Boolean);
        const cap = (ps, max) => { const out = ps.slice(0, 1); let d = 0; for (let i = 1; i < ps.length; i++) { d += Math.hypot(ps[i].x - ps[i - 1].x, ps[i].y - ps[i - 1].y); if (d > max) break; out.push(ps[i]); } return out; }; // short on screen however fast it moves
        const back = cap(pts(g.path.past).reverse(), 60).reverse(), fwd = cap(pts(g.path.ahead), 200), col = g.color ?? '#ffffff';
        ctx.save(); ctx.setLineDash([]); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        const line = (ps, w, a) => { if (ps.length < 2) return; ctx.globalAlpha = a; ctx.lineWidth = w; ctx.beginPath(); ps.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y))); ctx.stroke(); };
        ctx.strokeStyle = col; line(back, 1.2, 0.18);
        if (fwd.length > 1) { // ahead: a gradient from the circle out to nothing, over a soft wider glow
          const a0 = fwd[0], a1 = fwd[fwd.length - 1], gr = ctx.createLinearGradient(a0.x, a0.y, a1.x, a1.y);
          gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.strokeStyle = gr; line(fwd, 5, 0.12); line(fwd, 1.8, 0.55);
        }
        ctx.restore();
      }
      if (g.enu[2] < 0) continue;
      const p = this.project(g.enu);
      if (!this.onScreen(p, 20)) continue;
      this.ghostHits.push({ x: p.x, y: p.y, pass: g.pass ?? null });
      ctx.setLineDash([3, 4]); ctx.strokeStyle = g.color ?? 'rgba(255,255,255,.8)'; ctx.lineWidth = g.color ? 1.8 : 1.2;
      const big = g.time && g.id === this.ghostHitId; // lined up: it grows, like a real target in the circle
      ctx.beginPath(); ctx.arc(p.x, p.y, g.color ? (big ? 17 : 11) : 7, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 1.2;
      if (g.obj) { ctx.save(); ctx.setLineDash([]); ctx.globalAlpha = 0.5; this.drawIcon(this.iconKind(g.obj), p.x, p.y, big ? 22 : 12, 'rgba(20,34,54,1)'); ctx.restore(); } // what it is, see-through: it isn’t there yet (2026-10-13)
      if (g.time) this.queueLabel(`${g.name} · ${g.time}`, p, { color: 'rgba(255,255,255,.95)', size: 12, weight: 600, gap: 16, priority: 7 }); // tonight’s pass markers: one line
      else { this.queueLabel(g.name, p, { color: 'rgba(255,255,255,.95)', size: 12, weight: 600, gap: 16, priority: 7 });
        if (g.note) this.queueLabel(g.note, { x: p.x, y: p.y + 14 }, { color: 'rgba(255,255,255,.8)', size: 10, weight: 500, gap: 16, priority: 6 }); }
    }
    ctx.restore();
    // One in the circle: name it in full above and below the circle, like things below the horizon (2026-10-13).
    const timed = ghosts.filter((g) => g.time && g.enu[2] > 0);
    const hit = timed.length && !this.ghostBusy ? this.ghostHit(timed.map((g) => ({ ...g, kicker: `Here tonight · ${g.time}` })), '', '20,34,54', { day: true, kickerOf: (g) => g.kicker }) : null;
    this.ghostHitId = hit?.g.id ?? null;
  }

  // See-through Earth (2026-10-06): things below the horizon right now, drawn faintly where they really are, with
  // when they rise. below: [{ enu, name, note, kind }]
  drawBelow(below) {
    // Red in night mode like the rest of the sky (QA 2026-10-08: these stayed cream and orange).
    const night = this.theme === THEMES.night, INKA = night ? [255, 110, 90] : [255, 242, 179], INK = INKA.join(','), ORG = night ? '255,106,85' : '250,129,39', SUN = night ? [255, 106, 85] : [255, 180, 107];
    const ctx = this.ctx, t = this.theme, k = 1 - (this.feetA ?? 0); // fades out as the ring at your feet fades in
    ctx.save(); ctx.globalAlpha = k;
    // In the circle (2026-10-07, Sevaan): you can identify something under the ground by lining it up. Its name and
    // when it rises show above the circle in cream (it can’t be collected, so the circle doesn’t turn orange).
    let hit = null;
    this.belowHitId = null;
    if (this.belowFree && k > 0.5) {
      hit = this.ghostHit(below.filter((g) => g.enu[2] < 0), 'BELOW THE HORIZON', INK);
      this.belowHitId = hit ? (hit.g.id ?? hit.g.obj?.id ?? null) : null;
    }
    // Where each one has been and where it’s going under the ground, drawn exactly like a satellite’s trail in the
    // sky (drawTrail, 2026-10-07 consistency): a faint solid line behind it, the dotted orange prediction ahead up to
    // where it rises. Faint until you line it up in the circle, then as bright as a selected trail.
    for (const g of below) {
      if (!g.path?.length || g.enu[2] >= 0) continue;
      const hot = hit?.g === g, [r, gg, b] = t.bead;
      ctx.save(); ctx.globalAlpha = k; ctx.lineWidth = hot ? 1.6 : 1.3; ctx.lineCap = 'round'; // more visible (2026-10-08, Sevaan)
      if (g.past?.length) { ctx.strokeStyle = t.trailPast; this.path([...g.past, g.enu]); }
      ctx.setLineDash([4, 7]); ctx.strokeStyle = `rgba(${r}, ${gg}, ${b}, ${hot ? 0.95 : 0.3})`; /* 30% unless lined up (2026-10-09, Sevaan) */
      this.path(g.path.filter((e) => e[2] < 0.02));
      ctx.restore();
    }
    for (const g of below) {
      if (g.enu[2] >= 0 || g.kind === 'dot') continue; // dots (far-side satellites) are drawn by drawBelowSky
      const p = this.project(g.enu);
      if (!this.onScreen(p, 20)) continue;
      const r = g.kind === 'sun' ? 13 : g.kind === 'moon' ? 10 : 6;
      // The thing itself, faint, inside its dashed ring (2026-10-07: empty rings read as missing): a soft disc for
      // the Sun, Moon and planets, the satellite icon for passes.
      ctx.save(); ctx.globalAlpha = 0.6 * k;
      if (g.kind === 'sat') { ctx.globalAlpha = BELOW_SAT_A * k; this.drawIcon(g.obj ? this.iconKind(g.obj) : 'sat', p.x, p.y, (g.id ?? g.obj?.id) != null && (g.id ?? g.obj?.id) === this.belowHitId ? BELOW_ICON_HIT : BELOW_ICON, t.sat); } // same size and style as the halo ones, no ring (2026-10-11)
      else { const c = g.kind === 'sun' ? SUN : INKA; this.glow(p.x, p.y, r * 1.8, c, 0.3); ctx.fillStyle = `rgb(${c.join(',')})`; ctx.beginPath(); ctx.arc(p.x, p.y, g.kind === 'planet' ? 2.6 : r * 0.55, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
      if (g.kind !== 'sat') { // dashed rings stay on the Sun, Moon and planets only
        ctx.setLineDash([3, 4]); ctx.lineWidth = 1.2;
        ctx.strokeStyle = g.kind === 'sun' ? `rgba(${ORG},.75)` : `rgba(${INK},.5)`;
        ctx.beginPath(); ctx.arc(p.x, p.y, r + 3, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
      }
      if (k > 0.5 && hit?.g !== g) this.queueLabel(g.note ? `${g.name} · ${g.note}` : g.name, p, { color: g.kind === 'sun' ? `rgba(${ORG},.9)` : `rgba(${INK},.78)`, size: 12, weight: 600, gap: r + 6, priority: 6 }); // one line, so the time never drifts off its name
    }
    ctx.restore();
  }
  // Deep-sky objects (2026-10-11): faint glows where clusters, nebulae and galaxies are, only when they’d really be
  // visible tonight. Galaxies are tilted ovals, nebulae a soft pink-grey haze, clusters a little knot of specks.
  drawDeep(list) {
    const ctx = this.ctx, night = this.theme === THEMES.night, rgb = night ? [255, 90, 70] : [235, 228, 210];
    ctx.save();
    for (const d of list) {
      const p = this.project(d.enu); if (!this.onScreen(p, 30)) continue;
      const r = Math.max(6, Math.min(26, this.f * 0.012)), gal = /Galaxy/.test(d.kind), neb = /Nebula/.test(d.kind);
      if (d.kind === 'Comet') { this.drawComet(d, p, r, rgb); continue; }
      ctx.save(); ctx.translate(p.x, p.y);
      if (gal) { ctx.rotate(-0.5); ctx.scale(1.8, 0.7); }
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
      const c = neb && !night ? [235, 200, 215] : rgb;
      g.addColorStop(0, `rgba(${c},.34)`); g.addColorStop(0.45, `rgba(${c},.14)`); g.addColorStop(1, `rgba(${c},0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      if (!gal && !neb) { ctx.fillStyle = `rgba(${rgb},.55)`; let seed = d.id.length * 97; for (let i = 0; i < 9; i++) { seed = (seed * 16807) % 2147483647; const a = (seed % 628) / 100, rr = ((seed >> 5) % 100) / 100 * r * 0.7; ctx.beginPath(); ctx.arc(p.x + Math.cos(a) * rr, p.y + Math.sin(a) * rr, 0.7, 0, Math.PI * 2); ctx.fill(); } }
    }
    ctx.restore();
  }
  // A comet: a soft head and a tail pointing away from the Sun (the tangent on the sky away from the Sun’s direction).
  drawComet(d, p, r, rgb) {
    const ctx = this.ctx, c = d.enu, s = d.sun;
    let ang = -Math.PI / 4;
    if (s) {
      const dot = c[0] * s[0] + c[1] * s[1] + c[2] * s[2], t = [-(s[0] - dot * c[0]), -(s[1] - dot * c[1]), -(s[2] - dot * c[2])], n = Math.hypot(...t) || 1;
      const q = this.project([c[0] + 0.06 * t[0] / n, c[1] + 0.06 * t[1] / n, c[2] + 0.06 * t[2] / n]);
      if (q && Number.isFinite(q.x)) ang = Math.atan2(q.y - p.y, q.x - p.x);
    }
    const len = r * 3.2;
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(ang);
    const tail = ctx.createLinearGradient(0, 0, len, 0); tail.addColorStop(0, `rgba(${rgb},.32)`); tail.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = tail; ctx.beginPath(); ctx.moveTo(0, -r * 0.35); ctx.quadraticCurveTo(len * 0.6, -r * 0.7, len, -r * 0.9); ctx.lineTo(len, r * 0.9); ctx.quadraticCurveTo(len * 0.6, r * 0.7, 0, r * 0.35); ctx.closePath(); ctx.fill();
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.55); g.addColorStop(0, `rgba(${rgb},.85)`); g.addColorStop(0.5, `rgba(${rgb},.3)`); g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  // Under the horizon, a dark-site sky (2026-10-11, Sevaan): stars to the dark-sky limit and every satellite the Sun
  // lights on the far side of the Earth, faint so the ground still reads as ground. Day or night.
  drawBelowSky(sky, sats, starLimit) {
    const ctx = this.ctx, t = this.theme, k = 1 - (this.feetA ?? 0);
    if (k <= 0) return;
    ctx.save();
    if (sky?.stars) for (const s of sky.stars) {
      if (s.enu[2] >= 0 || s.mag > starLimit) continue;
      const p = this.project(s.enu); if (!this.onScreen(p, 8)) continue;
      const r = Math.max(0.38, Math.min(2.2, 1.8 - 0.27 * s.mag)), a = Math.max(0.12, Math.min(0.75, 0.75 - 0.1 * s.mag)) * Math.min(1, (starLimit - s.mag) / 0.5 + 0.15) * k;
      ctx.fillStyle = t.star(a); ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
    }
    // Constellation lines under the ground too, always on (2026-10-13, Sevaan): the far side of the sky as a star chart.
    if (sky?.lines) {
      ctx.globalAlpha = 0.7 * k; ctx.strokeStyle = t.constLine; ctx.lineWidth = 0.75;
      for (const seg of sky.lines) { let run = []; for (const e of seg) { if (e[2] < 0.01) run.push(e); else { if (run.length > 1) this.path(run); run = []; } } if (run.length > 1) this.path(run); }
      for (const c of sky.constellations ?? []) {
        if (c.enu[2] > -0.05) continue; // every one named down here: most are unfamiliar southern figures (2026-10-13)
        if (this.labelMode !== 'off') this.queueLabel(t.constCase(c.name), this.project(c.enu), { color: t.constLabel, size: 12, weight: 500, priority: 2, align: 'center' });
      }
      ctx.globalAlpha = 1;
    }
    if (sats?.length) this.drawHalo(sats, k, t.sat);
    ctx.restore();
  }
  // Satellites as their icons, revealed in a halo round the circle (2026-10-11, Sevaan): full strength near it,
  // fading out further away, so sweeping the phone across the ground (or the daytime sky) uncovers what’s there.
  drawHalo(sats, k, color) {
    const ctx = this.ctx, rc = this.ring ?? { x: this.cx, y: this.cy, r: this.reticlePx }, r1 = rc.r * 1.4, r2 = rc.r * 3.2;
    ctx.save();
    for (const s of sats) {
      const p = this.project(s.enu); if (!this.onScreen(p, 12)) continue;
      const d = Math.hypot(p.x - rc.x, p.y - rc.y); if (d >= r2) continue;
      const h = d <= r1 ? 1 : 1 - (d - r1) / (r2 - r1);
      ctx.globalAlpha = BELOW_SAT_A * h * h * (3 - 2 * h) * k; // 75% of the old 0.8 (2026-10-17, Sevaan: they got bright round the target)
      this.drawIcon(this.iconKind(s.obj), p.x, p.y, (s.id ?? s.obj?.id) != null && ((s.id ?? s.obj?.id) === this.belowHitId || (s.id ?? s.obj?.id) === this.dayHitId) ? BELOW_ICON_HIT : BELOW_ICON, color);
    }
    ctx.restore();
  }
  // In the circle: kicker, name, description and one line, for something you can see but not collect (below the
  // horizon, or up by day). Returns the hit or null.
  ghostHit(list, kicker, ink, { day = false, kickerOf = null } = {}) {
    const rc = this.ring ?? { x: this.cx, y: this.cy, r: this.reticlePx };
    let hit = null;
    for (const g of list) { const q = this.project(g.enu); if (!q) continue;
      const d = Math.hypot(q.x - rc.x, q.y - rc.y); if (d < rc.r && (!hit || d < hit.d)) hit = { g, d }; }
    if (!hit) return null;
    // Named in the ticket under the circle (2026-10-17, design/target-states B), not painted around it.
    const g = hit.g, head = kickerOf ? kickerOf(g) : g.owned === undefined ? kicker : `${kicker} · ${g.owned ? 'in your collection' : 'not collected yet'}`;
    const tail = [g.note ? g.note.replace(/^up /, 'comes up ') : '', g.where ? `in the ${g.where}` : ''].filter(Boolean).join(' · ');
    if (this.ticket?.ink !== 'fossil') this.ticket = { ink: kickerOf ? 'later' : /DAYLIGHT/.test(kicker) ? 'hidden' : 'below', k: head, n: g.name, m: [g.what, tail].filter(Boolean).join(' · ') }; // the bones you’re holding keep the label (2026-10-18 playtest)
    return hit;
  }
  // Up in the daytime sky (2026-10-11, Sevaan): the same halo and naming as below the horizon, for the bright
  // satellites overhead that daylight hides. Not collectable.
  drawDaySats(sats) {
    // Dark ink on a pale sky (cream vanished against the clouds); red in night mode.
    const night = this.theme === THEMES.night, INK = night ? '255,110,90' : '20,34,54';
    this.drawHalo(sats, 1, night ? this.theme.sat : 'rgba(24,40,62,.9)');
    this.dayHitId = null;
    if (!this.belowFree) return;
    const hit = this.ghostHit(sats, 'HIDDEN BY DAYLIGHT', INK, { day: !night });
    this.dayHitId = hit?.g.id ?? null;
  }
  // Local weather over the sky (js/weather.js): drifting cloud by cover, a fog wash, light rain or snow.
  // Screen-space and deliberately quiet: it should tell you why the sky looks empty, not perform.
  drawWeather(wx, time) {
    const ctx = this.ctx, f = this.dayF ?? 0, cover = Math.max(0, Math.min(1, (wx.cloud ?? 0) / 100));
    const sec = time / 1000;
    if (cover > 0.08) {
      // Clouds live in the sky (2026-10-07, Sevaan: they were stuck to the glass): each has a fixed spot by azimuth
      // and height, drifts slowly round, and is projected like a star, so it stays put as you move the phone.
      // The cloud deck (js/clouds-gl.js): real perspective, wind drift, lit from the Sun’s side. Falls back to the
      // old soft blobs where WebGL isn’t available.
      if (this.cloudGL?.lost) this.cloudGL = undefined;
      if (this.cloudGL === undefined) { try { this.cloudGL = createCloudGL(); } catch { this.cloudGL = null; } }
      if (this.cloudGL && this.basis && !this.saver) { // Battery saver: the light fallback clouds
        const L = f > 0.5 ? CLOUD_LIGHT.day : f > 0 ? CLOUD_LIGHT.dusk : CLOUD_LIGHT.night;
        const sun = this.sunEnu ?? [0, -0.5, 0.5];
        const out = this.cloudGL.render({ basis: this.basis, w: this.w, h: this.h, f: this.f, cx: this.cx, cy: this.cy, scale: 0.5, sun,
          wind: [sec * 0.012, sec * 0.004], cover, alpha: f > 0 ? 0.95 : 0.7, ...L });
        ctx.drawImage(out, 0, 0, this.w, this.h);
      } else {
        const n = Math.round(10 + cover * 30), rgb = f > 0.5 ? [245, 248, 250] : f > 0 ? [120, 110, 120] : [40, 50, 66];
        for (let i = 0; i < n; i++) {
          const a = (i * 0.618034) % 1, b = ((i * 0.381966) + 0.17) % 1;
          const az = (a * 360 + sec * (0.25 + b * 0.25)) % 360, el = 6 + Math.pow(b, 1.3) * 62;
          const p = this.project(enuFromAzEl(az, el)); if (!p) continue;
          const w = this.f * Math.tan((16 + a * 22) * RAD) / Math.max(0.35, p.c.z), h = w * (0.24 + (1 - el / 70) * 0.1);
          if (p.x < -w || p.x > this.w + w || p.y < -h * 2 || p.y > this.h + h * 2) continue;
          this.blob(p.x, p.y, w, h, rgb, 0.16 + cover * 0.5 * (f > 0 ? 1 : 0.7));
        }
      }
    }
    if (wx.kind === 'fog') { const g = ctx.createLinearGradient(0, this.h * 0.3, 0, this.h); g.addColorStop(0, 'rgba(225,230,233,0)'); g.addColorStop(1, f > 0 ? 'rgba(225,230,233,.75)' : 'rgba(120,128,140,.55)'); ctx.fillStyle = g; ctx.fillRect(0, 0, this.w, this.h); }
    if (wx.kind === 'rain' || wx.kind === 'storm') {
      ctx.save(); ctx.strokeStyle = f > 0 ? 'rgba(220,232,242,.45)' : 'rgba(170,190,210,.35)'; ctx.lineWidth = 1;
      for (let i = 0; i < 40; i++) { const a = (i * 0.618034) % 1, x = ((a * this.w * 1.3) - ((sec * 420 + i * 97) % (this.h + 60)) * 0.25) % (this.w + 40), y = ((sec * 420 + i * 97) % (this.h + 60)) - 40; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 5, y + 18); ctx.stroke(); }
      ctx.restore();
    }
    if (wx.kind === 'snow') {
      ctx.save(); ctx.fillStyle = 'rgba(255,255,255,.85)';
      for (let i = 0; i < 36; i++) { const a = (i * 0.618034) % 1, r = 1.5 + (i % 3), y = ((sec * 40 + i * 53) % (this.h + 20)) - 10, x = (a * this.w + Math.sin(sec * 0.8 + i) * 18 + this.w) % this.w; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    }
  }
  blob(x, y, w, h, [r, g, b], a) {
    const ctx = this.ctx; ctx.save(); ctx.translate(x, y); ctx.scale(1, h / w);
    const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, w / 2); gr.addColorStop(0, `rgba(${r},${g},${b},${a})`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, w / 2, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }

  // Each glow follows a supplied point on the true galactic equator.
  // milky: { spine: [{enu, width°, bright}], specks: [{enu, a, s}], rift: [{enu, w°}] }
  // Build the Milky Way renderer (fetch, decode, GPU upload) ahead of time, e.g. while the welcome card is up, so the
  // sky’s first frames don’t pay for it (playtest 2026-10-09).
  // The cloud deck’s shader compiles and draws once while the welcome card is up (2026-10-16 perf sweep), not in the
  // sky’s first frame.
  warmClouds() {
    if (this.cloudGL !== undefined) return;
    try { this.cloudGL = createCloudGL(); this.cloudGL?.render({ basis: { right: [1, 0, 0], up: [0, 0, 1], back: [0, -1, 0] }, w: 8, h: 8, f: 8, cx: 4, cy: 4, scale: 1, sun: [0, -0.5, 0.5], wind: [0, 0], cover: 0.5, alpha: 0, ...CLOUD_LIGHT.night }); } catch { this.cloudGL = null; }
  }
  warmMilky() { if (this.mwGL === undefined) { try { this.mwGL = createMilkyGL('assets/sky/milkyway.webp?v=2'); } catch { this.mwGL = null; } } }
  drawMilkyWay(milky) {
    if (!milky?.spine) return;
    // The real thing (2026-10-08): ESO’s all-sky photograph, mapped onto your view by js/milkyway-gl.js. The
    // drawn-by-hand version below stays as the fallback where WebGL isn’t available or the photo hasn’t loaded.
    if (milky.gal) {
      if (this.mwGL?.lost) this.mwGL = undefined; // rebuilt after the phone dropped its WebGL context
      this.warmMilky();
      if (this.mwGL?.ready) {
        // How much of it you can see: none under city lights (stars to about magnitude 3.5), all of it at a dark site.
        const vis = this.starLimit == null ? 1 : Math.max(0, Math.min(1, (this.starLimit - 3.6) / 2.4));
        if (!vis) return;
        const night = this.theme === THEMES.night;
        // Half resolution (2026-10-16 perf sweep): copying the WebGL canvas into the 2D sky was ~60% of a frame’s work; the
        // photo is soft, so a quarter of the pixels looks the same.
        const out = this.mwGL.render({ basis: this.basis, gal: milky.gal, w: this.w, h: this.h, f: this.f, cx: this.cx, cy: this.cy, scale: 0.5,
          alpha: (this.theme.milkyPhoto ?? 1) * vis * (1 - Math.min(1, (this.dayF ?? 0) / 0.2)), mono: night ? 1 : 0, tint: night ? [0.75, 0.1, 0.07] : [1, 1, 1] });
        const ctx = this.ctx; ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.drawImage(out, 0, 0, this.w, this.h); ctx.restore();
        return;
      }
    }
    const ctx = this.ctx, [r, g, b] = this.theme.milky;
    const pxPerDeg = this.f * RAD;
    const fade = (enu) => Math.max(0, Math.min(1, (enu[2] + 0.02) / 0.2)); // melt into the horizon
    ctx.save();
    ctx.globalAlpha *= this.theme.milkyOpacity ?? 1;
    ctx.lineCap = 'butt'; ctx.lineJoin = 'round';
    // 1. The glow, airbrushed: soft spots every degree along the band, overlapping so heavily that
    //    they blend into one smooth band (sparse spots are what made it look like a string of dots).
    const spine = milky.spine;
    for (const [widthK, strength] of [[1.25, 0.16], [0.6, 0.12]]) { // soft gaussian haze; the clouds and dust give the shape (2026-10-08)
      for (const pt of spine) {
        const p = this.project(pt.enu);
        if (!p) continue;
        const f = fade(pt.enu);
        if (!f) continue;
        const radius = Math.min(this.w * 1.2, pt.width * widthK * pxPerDeg / Math.max(0.25, p.c.z));
        if (!this.onScreen(p, radius)) continue;
        // Divide by how many neighbours overlap this spot so the total stays even.
        const overlap = Math.max(1, (2 * pt.width * widthK) / 1);
        this.soft(p.x, p.y, radius, this.theme.milky, Math.min(0.3, strength * pt.bright * f / overlap * 3));
      }
    }
    // 2. Star clouds (2026-10-08 fidelity): soft lighter patches of many sizes, so the band is mottled, not a smear.
    for (const c of milky.clouds ?? []) {
      const p = this.project(c.enu);
      if (!p) continue;
      const f = fade(c.enu); if (!f) continue;
      const radius = c.r * pxPerDeg / Math.max(0.25, p.c.z);
      if (!this.onScreen(p, radius)) continue;
      this.soft(p.x, p.y, radius, this.theme.milky, 0.3 * c.a * f);
    }
    // 3. Dust: the Great Rift’s two lanes, the Pipe and Ophiuchus clouds, the Coalsack and small dark knots.
    const dark = this.theme.riftRgb ?? [4, 10, 22];
    for (const pt of milky.rift) {
      const p = this.project(pt.enu);
      if (!p) continue;
      const radius = pt.w * pxPerDeg / Math.max(0.25, p.c.z);
      if (!this.onScreen(p, radius)) continue;
      this.soft(p.x, p.y, radius, dark, (pt.a ?? 0.5) * 0.7 * fade(pt.enu));
    }
    // 4. Star-cloud grain: 9,000 specks, sub-pixel to small, cool blue-white with warmer ones toward the centre,
    //    batched by brightness and tint for speed.
    const B = 4, buckets = Array.from({ length: B * 2 }, () => []);
    const minX = -2, minY = -2, maxX = this.w + 2, maxY = this.h + 2;
    for (const sp of milky.specks) {
      if (sp.enu[2] < -0.02) continue;
      const p = this.project(sp.enu);
      if (!p || p.x < minX || p.y < minY || p.x > maxX || p.y > maxY) continue;
      const k = Math.min(B - 1, Math.floor(sp.a * fade(sp.enu) * B));
      buckets[k + (sp.w ? B : 0)].push(p.x, p.y, sp.s);
    }
    const tint = [[Math.min(255, r + 95), Math.min(255, g + 90), Math.min(255, b + 85)], [255, 232, 196]];
    buckets.forEach((list, i) => {
      if (!list.length) return;
      const k = i % B, [tr, tg, tb] = tint[i < B ? 0 : 1];
      ctx.fillStyle = `rgba(${tr}, ${tg}, ${tb}, ${[0.12, 0.22, 0.34, 0.5][k]})`;
      ctx.beginPath();
      for (let j = 0; j < list.length; j += 3) { const sz = list[j + 2]; ctx.rect(list[j] - sz / 2, list[j + 1] - sz / 2, sz, sz); }
      ctx.fill();
    });
    ctx.restore();
  }


  drawGround() {
    // Clip the viewport by the real horizon plane. This also works when looking down
    // or rolling the device, without invented mountains/trees hiding real objects.
    const ctx = this.ctx;
    const level = (p) => this.basis.back[2] + (p.x - this.cx) / this.f * this.basis.right[2] - (p.y - this.cy) / this.f * this.basis.up[2];
    const corners = [{ x: 0, y: 0 }, { x: this.w, y: 0 }, { x: this.w, y: this.h }, { x: 0, y: this.h }];
    const ground = [];
    for (let i = 0; i < corners.length; i++) {
      const a = corners[i], b = corners[(i + 1) % corners.length], la = level(a), lb = level(b);
      if (la <= 0) ground.push(a);
      if ((la <= 0) !== (lb <= 0)) {
        const u = la / (la - lb);
        ground.push({ x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u });
      }
    }
    if (!ground.length) return;
    if (this.camera) {
      // Camera: cut the sky tint away below the horizon, then lay the ground colour back on as a see-through layer that
      // fades out as you look down (2026-10-08, Sevaan): strong at the horizon, gone by about 45° down, so your room
      // or the field at your feet comes through clearly.
      const poly = () => { ctx.beginPath(); ground.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath(); };
      ctx.save(); ctx.globalCompositeOperation = 'destination-out'; poly(); ctx.fill(); ctx.restore();
      // 95% from the horizon to halfway down (45°), easing to 50% at the edge of the compass ring at your feet
      // (−77°), then fading to clear at the very bottom, inside the ring (2026-10-08, Sevaan). Drawn as a radial
      // gradient around the point straight below you, so it follows the ring.
      const b = this.basis.back, az = (Math.atan2(b[0], b[1]) / RAD + 360) % 360;
      const c = this.theme === THEMES.night ? [10, 1, 0] : [8, 15, 27]; // the header’s near-black, day or night
      const n = this.project([0, 0, -1]), hm = this.project(enuFromAzEl(az, -45)), hr = this.project(enuFromAzEl(az, -77));
      ctx.save(); poly();
      if (n && hm && hr) {
        const R = Math.hypot(hm.x - n.x, hm.y - n.y), rr = Math.min(0.98, Math.hypot(hr.x - n.x, hr.y - n.y) / Math.max(1, R));
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, Math.max(1, R));
        const k = this.camDim(); g.addColorStop(0, `rgba(${c},0)`); g.addColorStop(rr, `rgba(${c},${.5 * k})`); g.addColorStop(1, `rgba(${c},${.95 * k})`);
        ctx.fillStyle = g;
      } else ctx.fillStyle = `rgba(${c},${.95 * this.camDim()})`; // looking near the horizon: the ground in view is all above 45° down
      ctx.fill(); ctx.restore();
      return;
    }
    // The earth (2026-10-06): darker the further down you look, so the ground reads as ground, not more sky.
    const down = Math.max(0, Math.min(1, -this.basis.back[2] * 1.4));
    const night = this.theme === THEMES.night;
    ctx.save();
    ctx.beginPath(); ground.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath();
    ctx.fillStyle = this.theme.ground; ctx.fill();
    ctx.clip();
    if (!night) { ctx.fillStyle = `rgba(3, 6, 11, ${(0.25 + down * 0.45).toFixed(3)})`; ctx.fillRect(0, 0, this.w, this.h); }
    // Daylight earth (2026-10-08, Sevaan: in the day it should look like dirt, not black): warm soil that deepens as
    // you look down, with grit fixed to the ground (projected, so it stays put as you move). Fades with dayF.
    const dayF = night ? 0 : (this.dayF ?? 0);
    if (dayF > 0.02) {
      ctx.globalAlpha = dayF;
      // Twilight (2026-10-08): as the Sun sets the soil cools from warm brown to a dusky violet-brown before night.
      const tw = Math.max(0, Math.min(1, (6 - (this.sunEl ?? 90)) / 12)); // 0 with the Sun 6°+ up, 1 at −6°
      const mix = (d, n) => Math.round(d + (n - d) * tw);
      ctx.fillStyle = `rgb(${mix(92, 58) - Math.round(down * 34)}, ${mix(72, 42) - Math.round(down * 26)}, ${mix(52, 48) - Math.round(down * 20)})`; ctx.fillRect(0, 0, this.w, this.h);
      // The soil texture is drawn once into an offscreen layer and reused until you’ve turned enough to move it by
      // about a pixel (2026-10-08 performance): 1,100 pebbles and 70 gradients a frame were the heaviest part of the sky.
      const bb = this.basis, key = [bb.back, bb.up].flat().map((v) => Math.round(v * 2000)).join(',') + `|${this.w}x${this.h}|${Math.round(dayF * 20)}`;
      const dpr = this.canvas.width / this.w;
      // If the layer can't be made (an iPhone out of canvas memory returns no context) or drawing it fails, the ground
      // is just its plain colour for a while: never a half-drawn layer, and the sky always goes back to the screen.
      if (Date.now() < (this.soilOffUntil ?? 0)) { /* plain ground, retry later */ } else
      if (!this.soil || this.soil.key !== key) {
        const main = this.ctx;
        try {
        const layer = this.soil?.canvas ?? (typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(1, 1) : document.createElement('canvas'));
        if (layer.width !== this.canvas.width || layer.height !== this.canvas.height) { layer.width = this.canvas.width; layer.height = this.canvas.height; }
        const lctx = layer.getContext('2d'); if (!lctx) throw new Error('no 2d context for the soil layer');
        lctx.setTransform(1, 0, 0, 1, 0, 0); lctx.clearRect(0, 0, layer.width, layer.height); lctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.ctx = lctx;
        (() => { const ctx = lctx;
      // Higher-fidelity soil (2026-10-08): all of it fixed to the ground (projected), sized by distance so it shrinks
        // toward the horizon. 1) broad soft patches of lighter and darker earth; 2) pebbles with a lit top and a shadow;
        // 3) tufts of dry grass and a few twigs on the nearer ground.
        const P = (az, el) => this.project(enuFromAzEl(az, el));
        const onS = (q, m) => q && q.x > -m && q.x < this.w + m && q.y > -m && q.y < this.h + m;
        const scale = (el) => this.f * Math.tan(1 * RAD) / Math.max(0.15, Math.sin(-el * RAD) + 0.05) * Math.sin(-el * RAD); // px per degree on the ground, foreshortened
        for (let i = 0; i < 70; i++) {
          const az = ((i * 0.618034) % 1) * 360, el = -Math.asin(0.05 + ((i * 0.381966) % 1) * 0.95) / RAD, q = P(az, el), r = 3.5 * this.f * Math.tan(RAD * (4 + (i % 5))) * Math.min(1, -el / 50 + 0.25);
          if (!onS(q, r)) continue;
          const light = i % 3 === 0, g = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, r);
          g.addColorStop(0, light ? 'rgba(160,128,92,.22)' : 'rgba(30,20,12,.22)'); g.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = g; ctx.save(); ctx.translate(q.x, q.y); ctx.scale(1, 0.35 + Math.min(0.6, -el / 120)); ctx.translate(-q.x, -q.y); ctx.beginPath(); ctx.arc(q.x, q.y, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        }
        for (let i = 0; i < 1100; i++) {
          const a = (i * 0.618034) % 1, b = ((i * 0.754877) % 1), el = -Math.asin(0.03 + b * 0.97) / RAD, az = a * 360, q = P(az, el); /* equal-area spread: no pile-up at your feet */ if (!onS(q, 10)) continue;
          const near = Math.min(1, -el / 55), r = 0.35 + near * near * 2.6 * (0.35 + ((i * 7) % 10) / 12), flat = 0.45 + near * 0.35, rot = (i % 7) * 0.45;
          if (i % 4 === 0) { // a pebble: shadow, body, lit top
            ctx.fillStyle = `rgba(25,16,10,${0.25 + near * 0.2})`; ctx.beginPath(); ctx.ellipse(q.x + r * 0.35, q.y + r * 0.45, r * 1.25, r * flat, rot, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = `rgba(${150 + (i % 3) * 15},${128 + (i % 3) * 10},${100 + (i % 5) * 6},${0.35 + near * 0.3})`; ctx.beginPath(); ctx.ellipse(q.x, q.y, r * 1.2, r * flat, rot, 0, Math.PI * 2); ctx.fill();
            if (r > 1.3) { ctx.fillStyle = `rgba(232,216,184,${0.2 + near * 0.25})`; ctx.beginPath(); ctx.ellipse(q.x - r * 0.3, q.y - r * 0.25, r * 0.5, r * flat * 0.4, rot, 0, Math.PI * 2); ctx.fill(); }
          } else { // grit and clods
            ctx.fillStyle = i % 3 ? `rgba(40,28,18,${0.16 + near * 0.16})` : `rgba(172,148,112,${0.12 + near * 0.12})`;
            ctx.beginPath(); ctx.ellipse(q.x, q.y, r * 0.9, r * flat * 0.8, rot, 0, Math.PI * 2); ctx.fill();
          }
        }
          })();
        this.soil = { key, canvas: layer };
        } catch (e) { this.soil = null; this.soilOffUntil = Date.now() + 10000; console.warn('soil layer skipped', e?.message ?? e); }
        finally { this.ctx = main; }
      }
      if (this.soil && Date.now() >= (this.soilOffUntil ?? 0)) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = dayF; ctx.drawImage(this.soil.canvas, 0, 0); ctx.restore(); }
      ctx.globalAlpha = dayF;
      // (2026-10-08: the grass tufts and twigs on the soil were removed, Sevaan didn’t like them.)
      ctx.globalAlpha = 1;
    }
    // a soft glow just under the horizon, warmer where the Sun is hiding
    const hz = []; for (let az = 0; az <= 360; az += 3) { const p = this.project(enuFromAzEl(az, -1.5)); if (p && this.onScreen(p, 60)) hz.push({ p, az }); }
    const sunAz = this.sunAz;
    for (const { p, az } of hz) {
      const warm = sunAz == null ? 0 : Math.max(0, Math.cos((az - sunAz) * RAD)) ** 3 * Math.max(0, Math.min(1, (this.sunEl + 18) / 16));
      const wq = Math.round(warm * 12) / 12; // a dozen warmth steps: the glow-sprite cache stays small (bug hunt 2026-10-20: 150 sprites a sunset)
      const rgb = night ? [255, 70, 50] : [Math.round(98 + wq * 140), Math.round(122 + wq * 40), Math.round(139 - wq * 80)];
      const twi = night ? 0 : Math.max(0, 1 - Math.abs((this.sunEl ?? -90) + 2) / 8); // peaks around sunset/sunrise
      this.glow(p.x, p.y, 46 + twi * 30, rgb, (night ? 0.05 : 0.07) + warm * (0.12 + twi * 0.3));
    }
    ctx.restore();
  }

  drawLandscape() {
    const ctx = this.ctx, t = this.theme;
    ctx.save(); const base = ctx.globalAlpha; // camera view draws the whole landscape see-through
    // Haze glowing just above the horizon (a touch of distant light pollution).
    for (const [w, alpha] of [[5, 0.05], [2.5, 0.06]]) {
      ctx.strokeStyle = t.haze ?? 'rgba(120, 150, 180, 1)';
      ctx.globalAlpha = alpha * base;
      ctx.lineWidth = w * this.f * RAD;
      const pts = [];
      for (let az = 0; az <= 360; az += 3) pts.push(enuFromAzEl(az, w * 0.3));
      this.path(pts);
    }
    ctx.globalAlpha = base;
    // Daytime colour (2026-10-08, Sevaan): by day the hills are hazy blue-green and the pines a deep green, blending back
    // to the night silhouettes through twilight (dayF).
    const dF = this.theme === THEMES.night ? 0 : (this.dayF ?? 0);
    const mix = (night, day) => { const n = night.match(/\w\w/g).map((h) => parseInt(h, 16)), d = day.match(/\w\w/g).map((h) => parseInt(h, 16)); return `rgb(${n.map((v, i) => Math.round(v + (d[i] - v) * dF)).join(',')})`; };
    // Hills in three ranges (2026-10-08, higher fidelity): a far hazy ridge, the main hills, a near rolling band, each
    // a little greener and darker than the one behind (aerial perspective), with a lighter sunlit crest by day.
    const band = (pts, fill, crest) => {
      if (this.camera) { ctx.save(); ctx.strokeStyle = 'rgba(255,242,179,.7)'; ctx.lineWidth = 1.2; ctx.lineJoin = 'round'; this.path(pts.map(([az, el]) => enuFromAzEl(az, el))); ctx.restore(); return; } // camera view: just the ridge line
      for (let i = 0; i < pts.length - 1; i += 3) { const seg = pts.slice(i, i + 4); ctx.fillStyle = fill; this.poly([...seg, [seg[seg.length - 1][0], -2], [seg[0][0], -2]]); }
      if (crest) { ctx.save(); ctx.strokeStyle = crest; ctx.lineWidth = 1.2; ctx.lineJoin = 'round'; this.path(pts.map(([az, el]) => enuFromAzEl(az, el - 0.05))); ctx.restore(); }
    };
    band(LANDSCAPE.ridge, dF > 0 ? mix('0c1a29', '8aa6b2') : (t.hills ?? '#0a1826'), dF > 0.4 ? `rgba(220,235,240,${(0.35 * dF).toFixed(2)})` : null);
    band(LANDSCAPE.hills, dF > 0 ? mix('0a1826', '6f8f78') : (t.hills ?? '#0a1826'), dF > 0.4 ? `rgba(200,225,180,${(0.4 * dF).toFixed(2)})` : null);
    // Tree lines (2026-10-08, higher fidelity): a far row, hazier, then the near row. Each pine is a trunk and a stack of
    // drooping, ragged tiers that narrow to a spike, with a lighter lit side by day.
    // Only trees in view are drawn (jank playtest 2026-10-17: ~900 pines a frame were a third of the sky’s work). A tree is
    // kept if its direction is within the screen’s half-diagonal plus a margin of where the phone points.
    const back = this.basis?.back, halfDiag = Math.atan(Math.hypot(1, this.w / Math.max(1, this.h)) * Math.tan((this.fovV / 2) * RAD)) / RAD;
    const keepCos = Math.cos(Math.min(89, halfDiag + 12) * RAD);
    const pine = ([az, ht, w, tiers, lean, sd], body, lit) => {
      if (back) { const a = az * RAD, e = Math.max(0.5, ht / 2) * RAD, ce = Math.cos(e); if (Math.sin(a) * ce * back[0] + Math.cos(a) * ce * back[1] + Math.sin(e) * back[2] < keepCos) return; }
      const base = -0.3, trunkH = ht * 0.12, top = ht, tw = w * 0.07;
      if (!this.camera) this.poly([[az - tw, base], [az + tw, base], [az + tw, base + trunkH + 0.05], [az - tw, base + trunkH + 0.05]]);
      const left = [], right = [];
      for (let k = 0; k < tiers; k++) {
        const f = k / tiers, y0 = base + trunkH + (top - trunkH - base) * f, y1 = base + trunkH + (top - trunkH - base) * ((k + 1) / tiers) * 0.98;
        const half = (w / 2) * (1 - f * 0.78) * (0.9 + ((sd * 7 + k * 0.37) % 1) * 0.2), x = az + lean * (y0 - base);
        // tier: droops at the tips, a notch back in towards the trunk, then up to the next tier
        left.push([x - half, y0 - 0.06], [x - half * 0.92, y0 + 0.02], [x - half * 0.42, y1 - 0.02]);
        right.push([x + half, y0 - 0.06], [x + half * 0.92, y0 + 0.02], [x + half * 0.42, y1 - 0.02]);
      }
      const tip = [az + lean * (top - base), top + 0.12];
      const outline = [...left, tip, ...right.reverse()];
      ctx.fillStyle = this.camera ? 'rgba(255,242,179,.85)' : body; this.outlineOnly = !!this.camera; this.poly(outline); this.outlineOnly = false;
      if (lit && !this.camera) { ctx.fillStyle = lit; this.poly([...left, tip, [az + lean * (top - base) * 0.5, base + trunkH]]); }
    };
    const farC = dF > 0 ? mix('0b1622', '557265') : (t.hills ?? '#0a1826');
    if (!this.camera) for (const tr of LANDSCAPE.far) pine(tr, farC, null); // camera view: just the near row, so the outlines stay clean
    const nearC = dF > 0 ? mix('070c13', '2a4430') : t.ground, litC = dF > 0.3 ? `rgba(120,160,110,${(0.25 * dF).toFixed(2)})` : null;
    if (!this.camera) for (const tr of LANDSCAPE.trees) pine(tr, nearC, litC); // camera view: hills only, no trees
    // The near meadow: a rolling green band in front of the trees, with grass tufts along it by day.
    band(LANDSCAPE.rolls, dF > 0 ? mix('070c13', '4f6e3e') : t.ground, dF > 0.4 ? `rgba(190,215,140,${(0.35 * dF).toFixed(2)})` : null);
    // (no grass tufts on the meadow either, 2026-10-08)
    ctx.restore();
  }

  // The ground’s markings (2026-10-07, Sevaan picked "C · Quiet ring"): the survey contours and bearing labels are
  // gone, the straight grid is back. Near the horizon: small ticks every 10° and N/E/S/W. Looking down, those give way to the quiet ring
  // at your feet (drawFeet).
  drawGroundCompass() {
    const ctx = this.ctx, t = this.theme, fade = 1 - (this.feetA ?? 0);
    ctx.save();
    ctx.strokeStyle = t.groundInk;
    ctx.lineWidth = 1;
    // The straight grid is back (2026-10-07, Sevaan: it fills the void): rings at 20°, 45° and 70° down and spokes
    // every 30°, heavier on N/E/S/W. It softens as the quiet ring at your feet comes in, so the two don’t fight.
    // By day the soil already fills the ground, so the grid all but goes; the spokes start clear of the tree line
    // (playtest 2026-10-22: thin lines ran from the horizon down across the daytime ground).
    ctx.globalAlpha = (1 - 0.55 * (this.feetA ?? 0)) * (1 - 0.85 * Math.min(1, (this.dayF ?? 0) / 0.6));
    for (const el of [-20, -45, -70]) {
      const pts = [];
      for (let az = 0; az <= 360; az += 3) pts.push(enuFromAzEl(az, el));
      this.path(pts);
    }
    for (let az = 0; az < 360; az += 30) {
      const pts = [];
      for (let el = -12; el >= -88; el -= 4) pts.push(enuFromAzEl(az, el));
      ctx.lineWidth = az % 90 ? 1 : 1.6;
      this.path(pts);
    }
    ctx.globalAlpha = 1; ctx.lineWidth = 1;
    for (let az = 0; az < 360; az += 10) {
      const long = az % 30 === 0;
      this.path([enuFromAzEl(az, -7), enuFromAzEl(az, long ? -13 : -10)]);
    }
    if (fade > 0.02) {
      ctx.globalAlpha = fade;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `800 24px ${FONT}`;
      for (const [az, letter] of [[0, 'N'], [90, 'E'], [180, 'S'], [270, 'W']]) {
        const p = this.project(enuFromAzEl(az, -24));
        if (!this.onScreen(p) || p.y > this.h - 110) continue; // not under the switcher at the bottom edge
        ctx.fillStyle = az === 0 ? t.groundNorth : t.groundText;
        ctx.fillText(letter, p.x, p.y);
      }
    }
    ctx.restore();
  }

  // The buried fossil (js/fossil.js): drawn in the daytime soil, lying along the ground (its baseline follows the
  // ground’s horizontal at that spot). Faint and blended until it’s in the circle; then full colour with a glow,
  // a quiet line above and a hold ring that fills. f: { enu, img, inCircle, hold (0..1) }.
  drawFossil(f) {
    const dayF = this.theme === THEMES.night ? 0 : (this.dayF ?? 0);
    if (!f?.img?.complete || !f.img.naturalWidth || dayF < 0.5) return;
    const p = this.project(f.enu); if (!p || !this.onScreen(p, 160)) return;
    const az = (Math.atan2(f.enu[0], f.enu[1]) / RAD + 360) % 360, el = Math.asin(f.enu[2]) / RAD;
    const a = this.project(enuFromAzEl(az - 6, el)), b = this.project(enuFromAzEl(az + 6, el)); if (!a || !b) return;
    const ang = Math.atan2(b.y - a.y, b.x - a.x), span = Math.hypot(b.x - a.x, b.y - a.y) * 1.9; // ~23° of ground
    const w = Math.max(26, Math.min(this.w * 0.28, span * 0.375)), /* half again (2026-10-13, Sevaan): 37.5% of the first size */ h = w * f.img.naturalHeight / f.img.naturalWidth;
    const ctx = this.ctx, k = Math.min(1, (dayF - 0.5) * 4);
    this.fossilGrow = (this.fossilGrow ?? 1) + ((f.inCircle ? 1.3 : 1) - (this.fossilGrow ?? 1)) * 0.15; // grows a little in the circle, eased (2026-10-13)
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(ang > Math.PI / 2 || ang < -Math.PI / 2 ? ang + Math.PI : ang); ctx.scale(this.fossilGrow, this.fossilGrow);
    // Not found yet (2026-10-18, Sevaan): plainly there at 15%, and held in the circle it fades in over the 4 s hold, the
    // glow growing with it. Once found it goes back to the soft, sunk-in look below.
    if (!f.done) { const hk = f.inCircle ? Math.max(0, Math.min(1, f.hold ?? 0)) : 0; if (hk > 0) { ctx.shadowColor = 'rgba(255,229,192,.55)'; ctx.shadowBlur = 14 * hk; } ctx.globalAlpha = (0.15 + 0.8 * hk) * k; }
    else { ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = 0.9 * k; ctx.drawImage(f.img, -w / 2, -h / 2, w, h); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 0.18 * k; }
    ctx.drawImage(f.img, -w / 2, -h / 2, w, h);
    ctx.restore();
    if (f.inCircle && !f.done) { // already found: no words around the circle (2026-10-08)
      const rc = this.ring ?? { x: this.cx, y: this.cy, r: this.reticlePx };
      this.ticket = { ink: 'fossil', k: `Below the horizon · ${Math.round(-el)}° down`, n: f.done ? 'Dino bones' : "Something’s buried here…", m: f.done ? 'A fossil, right under your feet' : 'Hold it in the circle' };
      ctx.save();
      if (!f.done && f.hold > 0) { ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(255,229,192,.95)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(rc.x, rc.y, rc.r + 9, -Math.PI / 2, -Math.PI / 2 + f.hold * Math.PI * 2); ctx.stroke(); }
      ctx.restore();
    }
  }

  // The UFO (js/ufo.js): a little saucer with a faint green glow, no label. In the circle the ring turns green and
  // "✦ UNIDENTIFIED / ???" shows above it (the Tap to collect button is #ufo-cta in the HUD). u: { enu, inCircle }.
  drawUfo(u) {
    const p = this.project(u.enu); if (!p || !this.onScreen(p, 30)) return;
    // Satellite-icon size in the open sky; in the circle it grows like any other target, easing in (2026-10-17, Sevaan:
    // "small like all the other icons until it’s in the circle"; it was a jump to a slightly bigger 1.15).
    const want = u.inCircle ? 0.9 : 0.5; this.ufoScale = this.reducedMotion ? want : (this.ufoScale ?? want) + (want - (this.ufoScale ?? want)) * 0.18;
    const ctx = this.ctx, s = this.ufoScale;
    ctx.save(); ctx.translate(p.x, p.y); ctx.scale(s, s);
    ctx.shadowColor = `rgba(125,255,138,${u.inCircle ? .8 : .45})`; ctx.shadowBlur = u.inCircle ? 12 : 7;
    ctx.fillStyle = 'rgba(207,232,255,.85)'; ctx.beginPath(); ctx.moveTo(-6, -1); ctx.quadraticCurveTo(-5, -7, 0, -7); ctx.quadraticCurveTo(5, -7, 6, -1); ctx.fill();
    ctx.fillStyle = '#fff2b3'; ctx.beginPath(); ctx.ellipse(0, 0, 14, 4.2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0; ctx.fillStyle = this.theme === THEMES.night ? '#ff6a55' : '#7dff8a'; for (const [x, y] of [[-8, .5], [0, 1.6], [8, .5]]) { ctx.beginPath(); ctx.arc(x, y, 1.3, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
    if (u.inCircle) {
      const rc = this.ring ?? { x: this.cx, y: this.cy, r: this.reticlePx };
      ctx.save(); ctx.strokeStyle = this.theme === THEMES.night ? '#ff6a55' : '#7dff8a'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(rc.x, rc.y, rc.r, 0, Math.PI * 2); ctx.stroke();
      this.ticket = { ink: 'ufo', k: '✦ Unidentified', n: '???', m: '' };
      ctx.restore();
    }
  }

  // Secrets in the sky (js/secrets.js): small icons the size of the other objects, enlarging a little in the circle,
  // with a two-line label above the circle and, for the hold-to-find ones, a filling ring. list: [{ kind, enu, inCircle,
  // hold, done, title, sub, color, streak }].
  drawSecrets(list) {
    const ctx = this.ctx, rc = this.ring ?? { x: this.cx, y: this.cy, r: this.reticlePx };
    for (const s of list) {
      if (s.kind === 'meteor') {
        const a = this.project(enuFromAzEl(...s.streak.from)), b = this.project(enuFromAzEl(...s.streak.to)); if (!a || !b) continue;
        const k = s.streak.k, hx = a.x + (b.x - a.x) * k, hy = a.y + (b.y - a.y) * k, tx = a.x + (b.x - a.x) * Math.max(0, k - 0.45), ty = a.y + (b.y - a.y) * Math.max(0, k - 0.45);
        const g = ctx.createLinearGradient(tx, ty, hx, hy); g.addColorStop(0, 'rgba(255,242,179,0)'); g.addColorStop(1, `rgba(255,255,255,${(1 - Math.max(0, k - 0.85) * 6).toFixed(2)})`);
        ctx.save(); ctx.strokeStyle = g; ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(hx, hy); ctx.stroke(); ctx.restore();
        continue;
      }
      const p = this.project(s.enu); if (!p || !this.onScreen(p, 30)) continue;
      // Deep-space spots (Voyagers, Pioneers, New Horizons, the Wow! signal) are invisible until they’re in your
      // circle, so you stumble on them (2026-10-09, Sevaan). Found ones show quietly there too, never elsewhere.
      const hidden = ['voyager', 'voyager2', 'pioneer10', 'pioneer11', 'newhorizons', 'wow', 'arecibo', 'halley'].includes(s.kind);
      if (s.xray && !s.inCircle) { // testing: where it is, found or not (Show items that aren't visible)
        ctx.save(); ctx.strokeStyle = s.color ?? '#e2b53c'; ctx.globalAlpha = s.done ? .45 : .9; ctx.setLineDash([3, 3]); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(p.x, p.y, 9, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]); ctx.fillStyle = s.color ?? '#e2b53c'; ctx.font = '600 11px "SC Label", "Arial Narrow", sans-serif'; ctx.textAlign = 'left'; ctx.fillText(`${s.title ?? s.kind}${s.done ? ' · found' : ''}`, p.x + 13, p.y + 4); ctx.restore();
        if (hidden || s.done) continue;
      }
      if (hidden && !s.inCircle) continue;
      if (s.done) continue; // once found, a secret leaves the sky for good (2026-10-09, Sevaan)
      // In the circle a secret grows to about the size a locked-on satellite or rocket stage is drawn (~16 px across, 2026-10-18 second pass: 26 still read too big;
      // 2026-10-18, Sevaan: the 4.2× of 2026-10-17 was far too big). SECRET_PX = each drawing’s width at scale 1, measured.
      const sc = s.inCircle && !s.done ? Math.max(1.2, 16 / (SECRET_PX[s.kind] ?? 12)) : 1.2;
      ctx.save(); ctx.translate(p.x, p.y); ctx.scale(sc, sc);
      if (s.kind === 'santa') {
        ctx.shadowColor = 'rgba(255,210,122,.6)'; ctx.shadowBlur = 5; ctx.fillStyle = '#fff2b3';
        for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.ellipse(-12 + k * 5, -1 - k * 0.6, 1.8, 1.1, 0, 0, Math.PI * 2); ctx.fill(); }
        ctx.fillStyle = '#ff4a3a'; ctx.beginPath(); ctx.arc(-13.6, -1.2, 0.7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#d94f38'; ctx.fillRect(1, -2.5, 8, 3.5); ctx.fillStyle = '#fff2b3'; ctx.fillRect(0, 1.3, 10, 0.8); ctx.beginPath(); ctx.arc(6, -3.6, 1.4, 0, Math.PI * 2); ctx.fill();
      } else if (s.kind === 'roadster') {
        ctx.shadowColor = 'rgba(255,90,90,.55)'; ctx.shadowBlur = 4; ctx.fillStyle = '#d22b2b';
        ctx.beginPath(); ctx.moveTo(-6, 1.5); ctx.quadraticCurveTo(-5.5, -1, -2, -1.2); ctx.lineTo(0, -2.6); ctx.lineTo(3, -2.6); ctx.lineTo(5, -1); ctx.quadraticCurveTo(6.5, -0.8, 6.5, 1.5); ctx.closePath(); ctx.fill();
        ctx.shadowBlur = 0; ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(-3.4, 1.7, 1.1, 0, Math.PI * 2); ctx.arc(3.6, 1.7, 1.1, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#f4f4f4'; ctx.beginPath(); ctx.arc(1.4, -2, 0.9, 0, Math.PI * 2); ctx.fill();
      } else if (s.kind === 'voyager' || s.kind === 'voyager2') { // the spacecraft: its big dish, the long magnetometer boom, the RTG arm
        ctx.shadowColor = 'rgba(226,181,60,.7)'; ctx.shadowBlur = 4; ctx.strokeStyle = '#e8e3c8'; ctx.lineWidth = 0.6;
        ctx.beginPath(); ctx.moveTo(0.6, 1); ctx.lineTo(-7.5, -5.5); ctx.moveTo(1, 1.4); ctx.lineTo(5.5, 4.2); ctx.stroke();
        ctx.fillStyle = '#e8e3c8'; ctx.fillRect(4.6, 3.4, 2.2, 1.6);
        ctx.fillStyle = '#e2b53c'; ctx.beginPath(); ctx.ellipse(0, -0.6, 3.4, 2.2, -0.35, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#7a5a14'; ctx.beginPath(); ctx.ellipse(0, -0.6, 1.4, 0.9, -0.35, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#c9a44a'; ctx.fillRect(-0.9, 0.9, 2, 1.5); // the bus under the dish
      } else if (s.kind === 'pioneer10' || s.kind === 'pioneer11') { // its dish face-on, two RTG arms and the magnetometer boom
        ctx.shadowColor = 'rgba(226,181,60,.6)'; ctx.shadowBlur = 4; ctx.strokeStyle = '#e8e3c8'; ctx.lineWidth = 0.55;
        ctx.beginPath(); ctx.moveTo(-1.5, 1.8); ctx.lineTo(-5, 4.6); ctx.moveTo(1.5, 1.8); ctx.lineTo(5, 4.6); ctx.moveTo(0, 2.6); ctx.lineTo(0, 8); ctx.stroke();
        ctx.fillStyle = '#e8e3c8'; ctx.fillRect(-5.9, 4.2, 1.8, 1.2); ctx.fillRect(4.1, 4.2, 1.8, 1.2);
        ctx.fillStyle = '#fff2b3'; ctx.beginPath(); ctx.arc(0, -0.6, 3.2, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#7a5a14'; ctx.lineWidth = 0.4; ctx.beginPath(); ctx.arc(0, -0.6, 1.9, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#7a5a14'; ctx.beginPath(); ctx.arc(0, -0.6, 0.55, 0, Math.PI * 2); ctx.fill();
      } else if (s.kind === 'newhorizons') { // a little triangle body with its dish
        ctx.shadowColor = 'rgba(143,208,255,.6)'; ctx.shadowBlur = 4; ctx.fillStyle = '#c9d8e6'; ctx.beginPath(); ctx.moveTo(-2.5, 2); ctx.lineTo(2.5, 2); ctx.lineTo(0, -2.2); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#fff2b3'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(0, -0.4, 3, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
      } else if (s.kind === 'arecibo') { // the message: a tiny grid of pixels
        ctx.fillStyle = '#3fc7b5'; for (const [x, y] of [[-2, -3], [0, -3], [2, -3], [-1, -1], [1, -1], [0, 1], [-2, 3], [2, 3], [0, 3]]) ctx.fillRect(x - 0.6, y - 0.6, 1.2, 1.2);
      } else if (s.kind === 'halley') { // a small comet, its short tail pointing away from the Sun
        ctx.shadowColor = 'rgba(143,208,255,.7)'; ctx.shadowBlur = 5; ctx.fillStyle = '#dff1ff'; ctx.beginPath(); ctx.arc(0, 0, 1.6, 0, Math.PI * 2); ctx.fill();
        const tg = ctx.createLinearGradient(0, 0, 9, -4); tg.addColorStop(0, 'rgba(223,241,255,.7)'); tg.addColorStop(1, 'rgba(223,241,255,0)'); ctx.strokeStyle = tg; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(9, -4); ctx.stroke();
      } else if (s.kind === 'sputnik' || s.kind === 'laika') { // a shiny ball with four swept-back antennas
        ctx.shadowColor = 'rgba(255,242,179,.7)'; ctx.shadowBlur = 5; ctx.fillStyle = '#e8e3c8'; ctx.beginPath(); ctx.arc(0, 0, 2.2, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#e8e3c8'; ctx.lineWidth = 0.6; for (const dy of [-1.4, -0.5, 0.5, 1.4]) { ctx.beginPath(); ctx.moveTo(-1.5, dy * 0.6); ctx.lineTo(-9, dy * 2.4); ctx.stroke(); }
        if (s.kind === 'laika') { ctx.fillStyle = '#ffc93d'; ctx.beginPath(); ctx.arc(3.6, -2.6, 0.9, 0, Math.PI * 2); ctx.fill(); }
      } else if (s.kind === 'wow') { // a faint radio pulse
        ctx.strokeStyle = '#ff6b6b'; ctx.lineWidth = 0.9; ctx.globalAlpha = 0.85;
        for (const r of [1.4, 3, 4.6]) { ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha *= 0.6; }
      }
      ctx.restore();
      if (s.inCircle && !s.done) {
        // The whole sight turns the secret’s colour and glows (2026-10-17, Sevaan: you should notice as you pan past),
        // breathing faster as the 4 s hold fills the outer ring.
        ctx.save(); ctx.strokeStyle = s.color; ctx.shadowColor = s.color;
        const breathe = this.reducedMotion ? 0.5 : 0.5 + 0.5 * Math.sin(performance.now() / (420 - 250 * (s.hold ?? 0)));
        ctx.shadowBlur = 10 + 10 * breathe; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(rc.x, rc.y, rc.r, 0, Math.PI * 2); ctx.stroke();
        ctx.lineWidth = 2; for (const angle of [0, 90, 180, 270]) { const a = angle * RAD; ctx.beginPath(); ctx.moveTo(rc.x + Math.cos(a) * (rc.r + 6), rc.y + Math.sin(a) * (rc.r + 6)); ctx.lineTo(rc.x + Math.cos(a) * (rc.r + 18), rc.y + Math.sin(a) * (rc.r + 18)); ctx.stroke(); }
        this.ticket = { ink: 'secret', color: s.color, k: s.sub, n: s.title, m: s.hold != null ? 'Hold steady to find it' : '' };
        if (s.hold > 0) { ctx.shadowBlur = 6; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(rc.x, rc.y, rc.r + 9, -Math.PI / 2, -Math.PI / 2 + s.hold * Math.PI * 2); ctx.stroke(); }
        ctx.restore();
      }
    }
  }

  // The compass at your feet (2026-10-13, design/feet-compass.html "A + C"): a sky map painted on the ground inside a
  // compass ring around the point straight below you. Inside, each thing sits where it really is (the ring = the
  // horizon, the middle = straight up); outside, a short spoke at its compass direction carries its name and height,
  // so labels never sit on the map. Things within 15° of each other share one spoke with a count. Stars are dots only.
  // A wedge shows the way the top of the phone points. Fades in as you look down.
  drawFeet(items) {
    const a = this.feetA ?? 0; if (a < 0.02) return;
    const ctx = this.ctx, t = this.theme, night = t === THEMES.night;
    const EL = -77, R = 13, n = this.project([0, 0, -1]); if (!n) return;
    const at = (az, el = EL) => this.project(enuFromAzEl(az, el));
    const sky = (az, h) => at(az, EL - R * Math.max(0, Math.min(90, h)) / 90); // a height above the horizon → a point on the map
    const dir = (az) => { const q = at(az); if (!q) return null; const dx = q.x - n.x, dy = q.y - n.y, l = Math.hypot(dx, dy) || 1; return [dx / l, dy / l]; };
    const ink = night ? 'rgba(255,90,70,' : 'rgba(255,242,179,', orange = night ? 'rgb(255,110,90)' : '#fa8127';
    ctx.save(); ctx.globalAlpha = a;
    const ringPts = []; for (let az = 0; az <= 360; az += 4) ringPts.push(enuFromAzEl(az, EL));
    const ring = ringPts.map((v) => this.project(v)).filter(Boolean);
    // The map’s face and its height rings (30° and 60° up).
    if (ring.length > 60) {
      ctx.beginPath(); ring.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y))); ctx.closePath();
      ctx.fillStyle = night ? 'rgba(20,2,0,.55)' : 'rgba(8,16,30,.55)'; ctx.fill();
    }
    ctx.strokeStyle = ink + '.12)'; ctx.lineWidth = 1;
    for (const h of [30, 60]) { const pts = []; for (let az = 0; az <= 360; az += 6) pts.push(enuFromAzEl(az, EL - R * h / 90)); this.path(pts); }
    // Facing wedge: the way the top of the phone points.
    const up = this.basis?.up;
    if (up && Math.hypot(up[0], up[1]) > 0.2) {
      const hd = (Math.atan2(up[0], up[1]) * 180 / Math.PI + 360) % 360, pts = [n];
      for (let d = -20; d <= 20; d += 4) { const q = at(hd + d); if (q) pts.push(q); }
      ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y))); ctx.closePath();
      ctx.fillStyle = night ? 'rgba(255,90,70,.10)' : 'rgba(250,129,39,.13)'; ctx.fill();
      const tip = at(hd, EL + 1.2), u = dir(hd);
      if (tip && u) { ctx.fillStyle = orange; ctx.beginPath(); ctx.moveTo(tip.x - u[0] * 2, tip.y - u[1] * 2); ctx.lineTo(tip.x + u[0] * 9 - u[1] * 6, tip.y + u[1] * 9 + u[0] * 6); ctx.lineTo(tip.x + u[0] * 9 + u[1] * 6, tip.y + u[1] * 9 - u[0] * 6); ctx.fill(); }
    }
    // The ring (the horizon) with ticks and N/E/S/W just inside it.
    ctx.strokeStyle = ink + '.45)'; ctx.lineWidth = 1.3; this.path(ringPts); ctx.lineWidth = 1;
    for (let az = 0; az < 360; az += 15) {
      const p0 = at(az), p1 = at(az, EL + (az % 90 === 0 ? 1.6 : 0.8)); if (!p0 || !p1) continue;
      ctx.strokeStyle = ink + (az % 45 === 0 ? '.45)' : '.25)');
      ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke();
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `400 14px ${DISPLAY_FONT}`;
    for (const [az, letter] of [[0, 'N'], [90, 'E'], [180, 'S'], [270, 'W']]) {
      const q = at(az, EL - 1.4); if (!q) continue;
      ctx.fillStyle = az === 0 ? t.groundNorth : ink + '.55)'; ctx.fillText(letter, q.x, q.y);
    }
    ctx.fillStyle = orange; ctx.beginPath(); ctx.arc(n.x, n.y, 2.5, 0, Math.PI * 2); ctx.fill();
    const list = (items ?? []).filter((g) => g.az != null && g.el != null);
    const colOf = (g) => (g.isNew ? orange : g.kind === 'sun' ? 'rgb(255,180,107)' : night ? 'rgb(255,110,90)' : 'rgb(255,242,179)');
    // Dots on the map.
    for (const g of list) {
      const q = sky(g.az, g.el); if (!q) continue; const col = colOf(g);
      if (g.kind === 'sat') { this.drawIcon(g.icon ?? 'sat', q.x, q.y, 10, col); if (g.isNew) { ctx.strokeStyle = orange; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(q.x, q.y, 9, 0, Math.PI * 2); ctx.stroke(); } }
      else if (g.kind === 'moon') { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(q.x, q.y, 5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#0a1424'; ctx.beginPath(); ctx.arc(q.x + 2.2, q.y - 1.3, 4.4, 0, Math.PI * 2); ctx.fill(); }
      else { const big = g.kind !== 'star'; if (big) this.glow(q.x, q.y, g.kind === 'sun' ? 12 : 8, g.kind === 'sun' ? [255, 180, 107] : [255, 242, 179], 0.3); ctx.fillStyle = col; ctx.globalAlpha = a * (big ? 1 : 0.7); ctx.beginPath(); ctx.arc(q.x, q.y, g.kind === 'sun' ? 4.5 : big ? 3 : 1.8, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = a; }
    }
    // Spokes and names: everything but stars, neighbours within 15° sharing one spoke.
    const rank = (g) => (g.isNew ? 0 : g.kind === 'moon' || g.kind === 'planet' ? 1 : g.kind === 'sun' ? 2 : 3);
    const named = list.filter((g) => g.kind !== 'star').sort((x, y) => x.az - y.az), groups = [];
    for (const g of named) { const last = groups[groups.length - 1]; if (last && g.az - last.az1 <= 15) { last.m.push(g); last.az1 = g.az; } else groups.push({ m: [g], az1: g.az }); }
    if (groups.length > 1) { const f = groups[0], l = groups[groups.length - 1]; if (f.m[0].az + 360 - l.az1 <= 15) { l.m.push(...f.m); groups.shift(); } }
    const mem = (this.feetMem ??= new Map()), boxes = [];
    const hit = (bx) => bx.x < 6 || bx.x + bx.w > this.w - 6 || boxes.some((o) => bx.x < o.x + o.w + 6 && bx.x + bx.w + 6 > o.x && bx.y < o.y + o.h + 3 && bx.y + bx.h + 3 > o.y);
    const SPOKES = [2.6, 5.2, 7.8, 10.4];
    for (const gr of groups) {
      const m = gr.m.sort((x, y) => rank(x) - rank(y) || y.el - x.el), top = m[0];
      const az = Math.atan2(m.reduce((s2, g) => s2 + Math.sin(g.az * Math.PI / 180), 0), m.reduce((s2, g) => s2 + Math.cos(g.az * Math.PI / 180), 0)) * 180 / Math.PI;
      const allNew = m.length > 1 && m.every((g) => g.isNew);
      const name = m.length === 1 ? top.name.replace(/^The /, '').toUpperCase() : allNew ? `${m.length} NEW SATELLITES` : `${top.name.replace(/^The /, '').toUpperCase()} +${m.length - 1}`;
      const sub = allNew ? `around ${Math.round(top.el)}° up` : `${Math.round(top.el)}° up`;
      const col = colOf(top), u = dir(az); if (!u) continue;
      const lm = mem.get(name) ?? {};
      let align = u[0] > 0.35 ? 'left' : u[0] < -0.35 ? 'right' : 'center';
      if (lm.align === 'left' && u[0] > 0.2) align = 'left'; else if (lm.align === 'right' && u[0] < -0.2) align = 'right'; else if (lm.align === 'center' && Math.abs(u[0]) < 0.5) align = 'center';
      ctx.font = `600 12px ${FONT}`; const w1 = ctx.measureText(name).width; ctx.font = `500 11px ${FONT}`; const w2 = ctx.measureText(sub).width, w = Math.max(w1, w2);
      const gap = m.length > 1 ? 22 : 14;
      const place = (i, al = align) => {
        const s1 = at(az, EL + SPOKES[i]); if (!s1) return null;
        // From the spoke tip (or past the count badge), the label sits off to the side the spoke points, so the spoke never runs into it.
        const bx0 = s1.x + u[0] * (gap - 13), by0 = s1.y + u[1] * (gap - 13), side = m.length > 1 ? 13 : 4;
        const lx = bx0 + (al === 'left' ? side : al === 'right' ? -side : 0), ly = by0 + (al === 'center' ? (u[1] < 0 ? -side - 14 : side + 14) : u[1] * 16);
        const x0 = al === 'left' ? lx : al === 'right' ? lx - w : lx - w / 2;
        // Too wide to fit beside the spoke at the screen edge: stack it above or below the tip instead.
        if (al !== 'center' && (x0 < 10 || x0 + w > this.w - 10)) return place(i, 'center');
        return { s1, ly, al, box: { x: x0, y: ly - 14, w, h: 28 } };
      };
      // Longer spokes push a crowded label outward; a label keeps its length while that’s still clear (steady text).
      let pick = null;
      for (const i of [...new Set([lm.step ?? 0, 0, 1, 2, 3])]) { const c = place(i); if (c && !hit(c.box)) { pick = c; lm.step = i; break; } }
      if (!pick) { pick = place(lm.step ?? 0) ?? place(0); if (!pick) continue; }
      lm.align = align; mem.set(name, lm); boxes.push(pick.box); align = pick.al;
      // Leaders from each dot out to the ring, then one spoke beyond it.
      ctx.strokeStyle = col; ctx.globalAlpha = a * 0.4; ctx.setLineDash([2, 3]);
      for (const g of m) { const q = sky(g.az, g.el), r0 = at(g.az); if (q && r0) { ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(r0.x, r0.y); ctx.stroke(); } }
      ctx.setLineDash([]); ctx.globalAlpha = a;
      const s0 = at(az, EL + 0.3), s1 = pick.s1; if (!s0) continue;
      ctx.lineWidth = top.isNew ? 2.5 : 1.6; ctx.beginPath(); ctx.moveTo(s0.x, s0.y); ctx.lineTo(s1.x, s1.y); ctx.stroke(); ctx.lineWidth = 1;
      if (m.length > 1) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(s1.x + u[0] * 9, s1.y + u[1] * 9, 8, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#05090f'; ctx.font = `600 11px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText(String(m.length), s1.x + u[0] * 9, s1.y + u[1] * 9 + 0.5); }
      const { box, ly } = pick, x0 = Math.max(10, Math.min(this.w - 10 - w, box.x));
      ctx.textAlign = 'left'; ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = 4;
      ctx.font = `600 12px ${FONT}`; ctx.fillStyle = col; ctx.fillText(name, x0 + (align === 'right' ? w - w1 : align === 'center' ? (w - w1) / 2 : 0), ly - 6);
      ctx.font = `500 11px ${FONT}`; ctx.fillStyle = ink + '.6)'; ctx.fillText(sub, x0 + (align === 'right' ? w - w2 : align === 'center' ? (w - w2) / 2 : 0), ly + 8);
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  }

  // "Coming up": ghosts just below the horizon where something will rise soon.
  // rising: [{ az, name, mins }]
  drawRising(rising) {
    if (!rising?.length) return;
    const ctx = this.ctx, t = this.theme;
    // Project, then merge ghosts that would sit on top of each other into one ("+ 1 more").
    const pts = [];
    for (const r of rising) {
      const p = this.project(enuFromAzEl(r.az, -3.5));
      if (!p || p.x < 40 || p.x > this.w - 40 || p.y < this.safeTop + 20 || p.y > this.h - this.safeBottom - 40) continue;
      pts.push({ ...r, x: p.x, y: p.y });
    }
    pts.sort((a, b) => a.mins - b.mins);
    const groups = [];
    for (const p of pts) {
      const g = groups.find((g) => Math.abs(g.x - p.x) < 150 && Math.abs(g.y - p.y) < 44);
      if (g) g.more++; else groups.push({ ...p, more: 0 });
    }
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const g of groups) {
      // Ghost marker
      ctx.strokeStyle = t.ghost; ctx.lineWidth = 1.5; ctx.setLineDash([2, 3]);
      ctx.beginPath(); ctx.arc(g.x, g.y, 6, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(g.x, g.y - 11); ctx.lineTo(g.x - 4, g.y - 7); ctx.moveTo(g.x, g.y - 11); ctx.lineTo(g.x + 4, g.y - 7); ctx.stroke();
      // Label on a dark pill so it reads over lines, stars and other labels.
      const name = g.more ? `${g.name} + ${g.more} more` : g.name;
      const when = g.mins <= 1 ? 'rising now' : `rises in ${g.mins} min`;
      ctx.font = `600 12px ${FONT}`;
      const w = Math.max(ctx.measureText(name).width, (ctx.font = `500 11px ${FONT}`, ctx.measureText(when).width)) + 16;
      const top = g.y + 12, h = 36;
      const x = Math.max(8 + w / 2, Math.min(this.w - 8 - w / 2, g.x));
      ctx.fillStyle = t.ghostPill ?? 'rgba(5, 12, 24, 0.82)';
      ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x - w / 2, top, w, h, 4); else ctx.rect(x - w / 2, top, w, h); ctx.fill();
      ctx.strokeStyle = t.groundInk; ctx.lineWidth = 1; ctx.stroke();
      ctx.font = `600 12px ${FONT}`; ctx.fillStyle = t.ghost;
      ctx.fillText(name, x, top + 12);
      ctx.font = `500 11px ${FONT}`; ctx.fillStyle = t.ghostText;
      ctx.fillText(when, x, top + 26);
    }
    ctx.restore();
  }


  drawGrid() {
    const ctx = this.ctx, t = this.theme;
    ctx.lineWidth = 1;
    ctx.strokeStyle = t.grid;
    for (const el of [30, 60]) {
      const pts = [];
      for (let az = 0; az <= 360; az += 3) pts.push(enuFromAzEl(az, el));
      this.path(pts);
    }
    ctx.strokeStyle = t.horizon;
    const hz = [];
    for (let az = 0; az <= 360; az += 2) hz.push(enuFromAzEl(az, 0));
    this.path(hz);

    ctx.fillStyle = t.compass;
    ctx.font = `600 14px ${FONT}`;
    ctx.textAlign = 'center';
    for (let az = 0; az < 360; az += 45) {
      const p = this.project(enuFromAzEl(az, 7));
      this.queueLabel(compassPoint(az), p, { color: t.compass, size: 13, weight: 600, priority: 5, align: 'center' });
    }
  }

  // Tiny silhouettes instead of dots: satellites get solar panels, constellation satellites one long
  // panel, rocket stages a cylinder and nozzle, stations a truss of panels, debris a shard.
  iconKind(o) {
    if (o.type === 'station') return 'station';
    if (o.type === 'rocket-body') return 'rocket';
    if (o.type === 'debris') return 'debris';
    if (o.family) return 'flat';
    return 'sat';
  }
  iconSize(mag, o) {
    const base = mag == null ? 9 : Math.max(9, Math.min(17, 13.5 - mag * 1.1));
    return o?.type === 'station' ? Math.max(base, 16) : base;
  }
  drawIcon(kind, x, y, size, color) {
    const ctx = this.ctx, u = size / 2;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color; ctx.strokeStyle = color;
    const rect = (x0, y0, w, h) => ctx.fillRect(x0 * u, y0 * u, w * u, h * u);
    if (kind === 'sat') {
      ctx.rotate(-0.35);
      rect(-0.26, -0.26, 0.52, 0.52);                 // body
      ctx.globalAlpha *= 0.85;
      rect(-1.0, -0.2, 0.62, 0.4); rect(0.38, -0.2, 0.62, 0.4);  // panels
      ctx.globalAlpha /= 0.85;
      rect(-0.4, -0.04, 0.8, 0.08);                   // boom
    } else if (kind === 'flat') {
      ctx.rotate(-0.35);
      rect(-0.75, -0.14, 0.55, 0.28);                 // flat body
      ctx.globalAlpha *= 0.85;
      rect(-0.12, -0.24, 1.0, 0.48);                  // one long panel
    } else if (kind === 'rocket') {
      ctx.rotate(-0.7);
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(-0.95 * u, -0.26 * u, 1.55 * u, 0.52 * u, 0.12 * u); else ctx.rect(-0.95 * u, -0.26 * u, 1.55 * u, 0.52 * u);
      ctx.fill();
      ctx.beginPath(); ctx.moveTo(0.6 * u, -0.2 * u); ctx.lineTo(0.98 * u, -0.34 * u); ctx.lineTo(0.98 * u, 0.34 * u); ctx.lineTo(0.6 * u, 0.2 * u); ctx.closePath(); ctx.fill(); // nozzle
    } else if (kind === 'plane') {
      // Airliner seen from above, nose along +x (the caller rotates it to the direction of travel): a
      // long fuselage with a pointed nose, swept-back wings and a small swept tail, so the heading reads.
      ctx.beginPath();
      ctx.moveTo(1.0 * u, 0);                                                    // nose
      ctx.quadraticCurveTo(0.86 * u, -0.12 * u, 0.6 * u, -0.12 * u);
      ctx.lineTo(0.12 * u, -0.12 * u); ctx.lineTo(-0.38 * u, -0.98 * u); ctx.lineTo(-0.56 * u, -0.98 * u); ctx.lineTo(-0.24 * u, -0.12 * u); // left wing
      ctx.lineTo(-0.72 * u, -0.1 * u); ctx.lineTo(-0.9 * u, -0.42 * u); ctx.lineTo(-1.0 * u, -0.42 * u); ctx.lineTo(-0.92 * u, -0.06 * u); // left tail
      ctx.lineTo(-0.98 * u, 0);
      ctx.lineTo(-0.92 * u, 0.06 * u); ctx.lineTo(-1.0 * u, 0.42 * u); ctx.lineTo(-0.9 * u, 0.42 * u); ctx.lineTo(-0.72 * u, 0.1 * u);      // right tail
      ctx.lineTo(-0.24 * u, 0.12 * u); ctx.lineTo(-0.56 * u, 0.98 * u); ctx.lineTo(-0.38 * u, 0.98 * u); ctx.lineTo(0.12 * u, 0.12 * u);   // right wing
      ctx.lineTo(0.6 * u, 0.12 * u); ctx.quadraticCurveTo(0.86 * u, 0.12 * u, 1.0 * u, 0);
      ctx.closePath(); ctx.fill();
    } else if (kind === 'heli') {
      // Helicopter from above, nose along +x: a round cabin, a thin tail boom with a small tail rotor, and a
      // two-blade main rotor across it (2026-10-07).
      ctx.beginPath(); ctx.ellipse(0.28 * u, 0, 0.42 * u, 0.3 * u, 0, 0, Math.PI * 2); ctx.fill();      // cabin
      rect(-0.95, -0.07, 1.1, 0.14);                                                                   // tail boom
      rect(-1.0, -0.3, 0.12, 0.6);                                                                     // tail rotor
      ctx.lineWidth = 0.16 * u; ctx.lineCap = 'round';
      // Main rotor turns (2026-10-13, Sevaan): four blades about the hub over the cabin, ~1.5 turns a second, with a
      // faint disc so it reads as spinning rather than flickering.
      const spin = (performance.now() / 1000) * Math.PI * 3, R = 1.12 * u;
      ctx.save(); ctx.translate(0.28 * u, 0);
      ctx.globalAlpha *= 0.18; ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha /= 0.18;
      ctx.rotate(spin); ctx.beginPath();
      for (let b = 0; b < 2; b++) { const c = Math.cos(b * Math.PI / 2) * R, d = Math.sin(b * Math.PI / 2) * R; ctx.moveTo(-c, -d); ctx.lineTo(c, d); }
      ctx.stroke(); ctx.restore(); // main rotor
    } else if (kind === 'station') {
      ctx.rotate(-0.2);
      rect(-1.0, -0.06, 2.0, 0.12);                   // truss
      ctx.globalAlpha *= 0.85;
      for (const px of [-0.85, -0.55, 0.45, 0.75]) { rect(px, -0.62, 0.22, 0.5); rect(px, 0.12, 0.22, 0.5); }  // panel pairs
      ctx.globalAlpha /= 0.85;
      rect(-0.3, -0.16, 0.6, 0.32); rect(-0.1, -0.34, 0.2, 0.68); // modules
    } else {
      // Debris (2026-10-20, Sevaan: "a better space debris icon"): three jagged fragments drifting apart, a big one and
      // two small, so it reads as broken pieces at sky size and never as a satellite or a stage.
      ctx.rotate(0.3); ctx.scale(1.25, 1.25);
      const P = (pts) => { ctx.beginPath(); pts.forEach(([px, py], i) => (i ? ctx.lineTo(px * u, py * u) : ctx.moveTo(px * u, py * u))); ctx.closePath(); ctx.fill(); };
      P([[-0.7, -0.15], [-0.05, -0.55], [0.2, -0.05], [-0.1, 0.25], [-0.55, 0.3]]);
      P([[0.3, -0.75], [0.75, -0.55], [0.55, -0.25]]);
      P([[0.35, 0.3], [0.8, 0.2], [0.65, 0.65], [0.4, 0.6]]);
    }
    ctx.restore();
  }

  dotRadius(mag) {
    if (mag == null) return 2;
    return Math.max(2, Math.min(4.6, 3.5 - mag * 0.35));
  }

  // Stars, constellation lines and labels. sky: { stars, lines, constellations } with ENU vectors.
  drawStars(sky, { lines, time = 0, starLimit = null }) {
    const ctx = this.ctx, t = this.theme;
    if (lines) {
      ctx.strokeStyle = t.constLine;
      ctx.lineWidth = 0.75;
      for (const seg of sky.lines) this.path(seg, 0.01);
      for (const c of sky.constellations) {
        if (c.rank > 2 || c.enu[2] < 0.05) continue;
        if (this.labelMode !== 'off') this.queueLabel(t.constCase(c.name), this.project(c.enu), { color: t.constLabel, size: 12, weight: 500, priority: 2, align: 'center' });
      }
    }
    // Stars towards the edges of the screen twinkle, ever so slightly; the middle, where you’re aiming,
    // stays still. Each star gets its own slow, irregular rhythm (two sines, per-star phase and speed).
    const sec = time / 1000, hw = this.w / 2, hh = this.h / 2;
    for (let i = 0; i < sky.stars.length; i++) {
      const s = sky.stars[i];
      if (s.enu[2] < 0) continue;
      // The sky slider: stars fainter than tonight’s limit (after the extra air near the horizon) aren’t drawn;
      // the last half magnitude fades, so dragging the slider brings stars up gently.
      let fade = 1;
      if (starLimit != null) { const m = s.mag + extinction(Math.asin(Math.min(1, s.enu[2])) * 180 / Math.PI); if (m > starLimit) continue; fade = Math.min(1, (starLimit - m) / 0.5 + 0.15); }
      const p = this.project(s.enu);
      if (!this.onScreen(p, 12)) continue;
      const r = Math.max(0.38, Math.min(2.4, 1.9 - 0.27 * s.mag));
      let a = Math.max(0.14, Math.min(1, 0.98 - 0.125 * s.mag)) * fade * (1 - (this.dayF ?? 0) / 0.6), tw = 1;
      if (time) {
        // 0 in the middle of the screen, rising to 1 at any edge (the outer ~40% of the way out).
        const edge = Math.max(Math.abs(p.x - hw) / hw, Math.abs(p.y - hh) / hh);
        const e = Math.min(1, Math.max(0, (edge - 0.58) / 0.38));
        if (e > 0) {
          const ph = i * 2.39996, f = 0.7 + ((i * 0.618034) % 1) * 1.3;
          const wave = 0.5 + 0.25 * Math.sin(sec * f + ph) + 0.25 * Math.sin(sec * f * 2.3 + ph * 3.1); // 0..1
          tw = 1 - 0.5 * e * e * (3 - 2 * e) * wave;
          a *= tw;
        }
      }
      if (s.mag < 2.2) this.glow(p.x, p.y, r * (s.mag < 0.6 ? 5 : 3.5), t.starRGB, (s.mag < 0.6 ? 0.34 : 0.14) * (0.4 + 0.6 * tw));
      ctx.fillStyle = t.star(a);
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
      // The brightest real stars carry the four-point mark used on the card back.
      if (s.mag < 0.6) {
        const tip = r * 3.2, shoulder = r * 0.7;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - tip); ctx.lineTo(p.x + shoulder, p.y - shoulder);
        ctx.lineTo(p.x + tip, p.y); ctx.lineTo(p.x + shoulder, p.y + shoulder);
        ctx.lineTo(p.x, p.y + tip); ctx.lineTo(p.x - shoulder, p.y + shoulder);
        ctx.lineTo(p.x - tip, p.y); ctx.lineTo(p.x - shoulder, p.y - shoulder);
        ctx.closePath(); ctx.fill();
      }
      if (s.name && s.mag < 1.2 && this.labelOk(null, s.name)) this.queueLabel(s.name, p, { color: t.starLabel, gap: r + 6, priority: 0 });
    }
  }

  // Sun, Moon and planets. bodies: [{ name, kind, enu, mag, illum, phaseAngle, phaseName }]
  drawBodies(bodies) {
    const ctx = this.ctx, t = this.theme;
    const sun = bodies.find((b) => b.kind === 'sun');
    for (const b of bodies) {
      if (b.enu[2] < -0.02) continue;
      const p = this.project(b.enu);
      if (!this.onScreen(p, 30)) continue;
      if (b.kind === 'moon') {
        // In daylight a thin or new Moon is invisible: don’t paint a black disc on a blue sky (2026-10-08 playtest).
        if ((this.dayF ?? 0) > 0.3 && (b.illum ?? 1) < 0.25) continue;
        const radius = 12;
        this.glow(p.x, p.y, 34, t.starRGB, 0.2);
        this.drawMoon(p, radius, sun ? this.brightLimbAngle(b.enu, sun.enu, p) : 0, b.phaseAngle);
        if (this.labelOk(null, 'Moon')) this.queueLabel('Moon', p, { color: t.body, size: 14, weight: 500, gap: radius + 10, priority: 8 });
      } else if (b.kind === 'sun') {
        const f = this.dayF ?? 0;
        this.glow(p.x, p.y, 70 + f * 90, f > 0 ? [255, 246, 207] : t.satGlow, 0.55);
        ctx.fillStyle = f > 0.3 ? '#fffbea' : t.sun;
        ctx.beginPath(); ctx.arc(p.x, p.y, 12 + f * 6, 0, Math.PI * 2); ctx.fill();
        // (The dashed orange guard ring by day was removed 2026-10-10, Sevaan: "I don’t want that.")
        if (this.labelOk(null, 'Sun')) this.queueLabel('Sun', p, { color: f > 0.3 ? '#143046' : t.body, size: 14, gap: 22 + f * 24, priority: 8 });
      } else {
        // Planets on the same brightness scale as the stars (2026-10-06, Sevaan: Saturn looked far brighter than
        // it is). Apparent magnitude after the air near the horizon; anything fainter than tonight’s limit (the sky
        // slider, twilight, the Moon) isn’t drawn, so Neptune no longer shows to the naked eye.
        const elDeg = Math.asin(Math.min(1, Math.max(-1, b.enu[2]))) * 180 / Math.PI, m = b.mag + extinction(elDeg);
        if (this.starLimit != null && m > this.starLimit) continue;
        // By day only Venus can show, and only when it’s well clear of the Sun (30°+), when people really can spot it;
        // closer in it’s lost in the glare and looking for it means looking near the Sun (2026-10-11, Sevaan asked).
        const sunSep = sun ? Math.acos(Math.max(-1, Math.min(1, sun.enu[0] * b.enu[0] + sun.enu[1] * b.enu[1] + sun.enu[2] * b.enu[2]))) * 180 / Math.PI : 180;
        const dayK = 1 - Math.min(1, (this.dayF ?? 0) / 0.6) * (m <= -3 && sunSep >= 30 ? 0.6 : 1);
        if (dayK <= 0.02) continue;
        const radius = Math.max(0.9, Math.min(3.4, 2.3 - 0.3 * m)), a = Math.max(0.3, Math.min(1, 1 - 0.1 * m)) * dayK;
        if (m < 0.5) this.glow(p.x, p.y, radius * (m < -2 ? 5 : 3.2), t.starRGB, (m < -2 ? 0.34 : 0.16) * dayK);
        ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = t.planet;
        ctx.beginPath(); ctx.arc(p.x, p.y, radius, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        if (this.labelOk(null, b.name)) this.queueLabel(b.name, p, { color: t.body, size: 14, weight: 500, gap: radius + 10, priority: 8 });
      }
    }
  }

  // Screen angle from the Moon toward the Sun, so the lit edge faces the right way.
  brightLimbAngle(moon, sun, p) {
    const d = moon[0] * sun[0] + moon[1] * sun[1] + moon[2] * sun[2];
    const t = [sun[0] - d * moon[0], sun[1] - d * moon[1], sun[2] - d * moon[2]];
    const l = Math.hypot(...t) || 1;
    const q = this.project([moon[0] + 0.01 * t[0] / l, moon[1] + 0.01 * t[1] / l, moon[2] + 0.01 * t[2] / l]);
    return q ? Math.atan2(q.y - p.y, q.x - p.x) : 0;
  }

  // Moon disc with the correct phase. phaseAngle: 0 = full, 180 = new.
  drawMoon(p, R, brightAngle, phaseAngle) {
    const ctx = this.ctx, t = this.theme;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(brightAngle);
    ctx.fillStyle = t.moonDark;
    ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill();
    const k = Math.cos(phaseAngle * RAD); // 1 = full, 0 = quarter, -1 = new
    ctx.fillStyle = t.moonLit;
    ctx.beginPath();
    // Lit half on the Sun side (+x), closed by the terminator ellipse.
    ctx.arc(0, 0, R, -Math.PI / 2, Math.PI / 2);
    ctx.ellipse(0, 0, Math.abs(k) * R, R, 0, Math.PI / 2, -Math.PI / 2, k < 0);
    ctx.fill();
    ctx.strokeStyle = t.moonEdge;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  // Only the focused object’s trajectory is shown. The dotted future is prediction,
  // while the faint solid segment is recent history; neither suggests actual light trails.
  drawTrail(trail, hot) {
    const ctx = this.ctx, t = this.theme, [r, g, b] = t.bead;
    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = t.trailPast;
    this.path(trail.filter((p) => p.t <= 0).map((p) => enuFromAzEl(p.az, p.el)), 0);
    const future = trail.filter((p) => p.t >= 0 && p.el > 0);
    ctx.setLineDash([4, 7]);
    ctx.lineCap = 'butt';
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${hot ? 0.60 : 0.26})`;
    this.path(future.map((p) => enuFromAzEl(p.az, p.el)), 0);
    ctx.restore();
  }

  // safeTop/safeBottom are HUD insets in CSS pixels; centerY is an optional pixel
  // override. Projection and the reticle always share the same cx/cy.
  draw(basis, items, { showDim, sky, bodies, milky, lines = true, targetId = null, time = 0, safeTop = 150, safeBottom = 230, centerY, centerX, starLimit = null, naturalTargetName = null, quietTarget = false, below = null, belowSats = null, daySats = null, deep = null, belowStarLimit = 6.5, ownedTarget = false, sunEl = -90, ghosts = null, weather = null, newFind = false, rising = null, landscape = false, lockedOn = null, planes = null, planeHit = null, planeTrail = null, naturalTarget = null, feet = null, fossil = null, ufo = null, secrets = null } = {}) {
    // Every frame starts on the screen's own canvas with a clean state (2026-10-20, Sevaan's phone: a failed daytime
    // ground layer once left the sky drawing into that hidden layer, and the screen filled with stale frames).
    this.ctx = this.mainCtx; this.ctx.setTransform(this.canvas.width / this.w, 0, 0, this.canvas.width / this.w, 0, 0); this.ctx.globalAlpha = 1; this.ctx.globalCompositeOperation = 'source-over'; this.ctx.shadowBlur = 0; this.ctx.filter = 'none';
    this.basis = basis;
    this.safeTop = Math.max(12, Math.min(safeTop, this.h * 0.45));
    this.safeBottom = Math.max(12, Math.min(safeBottom, this.h - this.safeTop - 100));
    this.cx = Number.isFinite(centerX) ? centerX : this.w / 2; // the iPhone Duo half-folded moves the circle off the crease (main.js foldCX)
    this.cy = Number.isFinite(centerY) ? centerY : this.h / 2; // fixed: no clamping to the measured UI, which shifted it on the first frames
    this.labelQueue = [];
    const r = this.reticlePx;
    const rc = this.ring ?? { x: this.cx, y: this.cy };
    this.clearZone = newFind || planeHit ? { left: this.cx - Math.min(190, this.w / 2 - 12), right: this.cx + Math.min(190, this.w / 2 - 12), top: rc.y - r - 100, bottom: rc.y + r + 75 } : null;
    const ctx = this.ctx, t = this.theme;
    // Day factor: 0 at night, 1 in full daylight (civil twilight in between). Drives the sky tone and what shows.
    this.dayF = this.theme === THEMES.night ? 0 : Math.max(0, Math.min(1, (sunEl + 8) / 12));
    this.starLimit = starLimit; this.sunEl = sunEl;
    { const s = bodies?.find?.((b) => b.kind === 'sun'); this.sunAz = s ? (Math.atan2(s.enu[0], s.enu[1]) / RAD + 360) % 360 : null; this.sunEnu = s?.enu ?? null; }
    this.drawBackground();
    if ((this.dayF ?? 0) < 0.2 && !this.camera) this.drawMilkyWay(milky); // no Milky Way in camera view
    if (sky && (this.dayF ?? 0) < 0.6) this.drawStars(sky, { lines: lines && this.dayF < 0.2, time: this.reducedMotion ? 0 : time, starLimit });
    if (this.showShadow !== false) this.drawEarthShadow();
    if (deep?.length && (this.dayF ?? 0) < 0.2) this.drawDeep(deep);
    if (weather && !this.camera) this.drawWeather(weather, this.reducedMotion || this.saver ? 0 : time); // the camera shows the real clouds
    if (bodies) this.drawBodies(bodies);
    this.ticket = null; // what the circle names this frame, for the ticket under it (js/main.js syncTicket)
    this.ghostBusy = !!targetId || !!planeHit; // the circle names a pass marker only when nothing real is in it
    if (ghosts?.length) this.drawGhosts(ghosts); else { this.ghostHits = []; this.ghostHitId = null; }
    this.feetA = Math.max(0, Math.min(1, (-this.basis.back[2] - 0.8) / 0.1)); // fades in from ~53° down, full by ~64° (it is on the ground now, so it can show sooner)
    this.drawGround();
    if (landscape) { // trees, hills and meadow; in camera view see-through like the sky and ground (an overlay of our world on yours)
      if (this.camera) { ctx.save(); ctx.globalAlpha = 0.6; this.drawLandscape(); ctx.restore(); } else this.drawLandscape();
    }
    // The Moon (and Sun) low on the horizon (2026-10-13, Sevaan: the Moon was collectable but hidden behind the trees):
    // drawn again over the landscape, clipped at the horizon line, so it peeks up above it.
    if (bodies) for (const b of bodies) {
      if ((b.kind !== 'moon' && b.kind !== 'sun') || b.enu[2] < -0.02 || b.enu[2] > 0.12) continue;
      if (b.kind === 'moon' && (this.dayF ?? 0) > 0.3 && (b.illum ?? 1) < 0.25) continue;
      const az = Math.atan2(b.enu[0], b.enu[1]) / RAD, pts = [];
      for (let d = -12; d <= 12; d += 3) { const q = this.project(enuFromAzEl(az + d, 0)); if (q) pts.push(q); }
      if (pts.length < 2) continue;
      ctx.save(); ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); for (const q of pts) ctx.lineTo(q.x, q.y);
      ctx.lineTo(pts[pts.length - 1].x, -this.h); ctx.lineTo(pts[0].x, -this.h); ctx.closePath(); ctx.clip();
      const p = this.project(b.enu);
      if (p && b.kind === 'moon') { const sun = bodies.find((x) => x.kind === 'sun'); this.glow(p.x, p.y, 34, this.theme.starRGB, 0.2); this.drawMoon(p, 12, sun ? this.brightLimbAngle(b.enu, sun.enu, p) : 0, b.phaseAngle); }
      else if (p) { const f = this.dayF ?? 0; this.glow(p.x, p.y, 70 + f * 90, f > 0 ? [255, 246, 207] : this.theme.satGlow, 0.55); ctx.fillStyle = f > 0.3 ? '#fffbea' : this.theme.sun; ctx.beginPath(); ctx.arc(p.x, p.y, 12 + f * 6, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    }
    this.drawGroundCompass();
    if (fossil && !this.camera) this.drawFossil(fossil); // not in camera view
    // Looking down: the quiet ring takes over from the see-through ghosts (same things, by rise direction).
    this.belowFree = !targetId && !planeHit; // the circle can name a below-horizon thing only when it isn’t busy
    if (below?.length && belowSats?.length) { const ids = new Set(below.filter((g) => g.obj).map((g) => g.obj.id)); belowSats = belowSats.filter((s) => !ids.has(s.obj.id)); } // a pass is drawn once
    if (this.basis.back[2] < 0.15 && this.feetA < 0.98) this.drawBelowSky(sky, belowSats, belowStarLimit);
    if (daySats?.length && this.basis.back[2] > -0.15) this.drawDaySats(daySats); else this.dayHitId = null;
    if ((below?.length || belowSats?.length) && this.basis.back[2] < 0.15 && this.feetA < 0.98) this.drawBelow([...(below ?? []), ...(belowSats ?? []).map((s) => ({ enu: s.enu, kind: 'dot', id: s.obj.id, name: s.name, what: s.what, place: s.place, note: s.note ?? '', where: '', owned: s.owned }))]);
    this.drawFeet(feet); // the ring at your feet shows what’s UP and which way to face (2026-10-13, Sevaan)
    this.drawRising(rising);
    this.drawGrid();

    const offscreen = [];
    const candidates = items.filter((it) => it.look.visible).sort((a, b) => (Number(b.candidate) - Number(a.candidate)) || (b.angCos ?? 0) - (a.angCos ?? 0));
    const focus = items.find((it) => it.obj.id === targetId) ?? (!targetId ? candidates.find((it) => it.candidate) : null);
    const labelIds = new Set(candidates.filter((it) => it.obj.id !== targetId).slice(0, targetId ? 2 : 4).map((it) => it.obj.id));
    this.targetPos = null;
    this.hits = []; // where each visible satellite was drawn, for tap-to-select (js/main.js)
    if (focus?.trail?.length && focus.look.visible) this.drawTrail(focus.trail, true);
    for (const it of items) {
      const { look } = it;
      const isTarget = it.obj.id === targetId;
      if (!look.visible && !showDim && !isTarget) continue;
      const v = enuFromAzEl(look.az, look.el);
      const p = this.project(v);
      if (!this.inSky(p, isTarget ? 10 : 0)) {
        if ((look.visible || isTarget) && !this.nearRing(p)) offscreen.push({ it, c: this.cam(v), isTarget }); // never an edge arrow for something in the circle
        // Objects under interface panels do not count as visible aiming targets.
        if (isTarget || !this.onScreen(p, 10)) continue;
      }
      if (isTarget) this.targetPos = { x: p.x, y: p.y };
      if (look.visible) this.hits.push({ id: it.obj.id, x: p.x, y: p.y });
      // In the circle the icon grows to about twice its size (2026-10-07: 1.3× read as barely bigger), easing in.
      if (isTarget) { const want = lockedOn ? 2.1 : 1; /* bigger only while it is in the circle (2026-10-07) */ this.tgtScale = (this.tgtId === it.obj.id ? this.tgtScale : 1) + (want - (this.tgtId === it.obj.id ? this.tgtScale : 1)) * (this.reducedMotion ? 1 : 0.22); this.tgtId = it.obj.id; }
      const size = look.visible || isTarget ? this.iconSize(look.mag, it.obj) * (isTarget ? this.tgtScale : 1) : 7;
      const radius = size / 2;
      ctx.save();
      if (targetId && !isTarget) ctx.globalAlpha = look.visible ? 0.60 : 0.35;
      if (look.visible || isTarget) this.glow(p.x, p.y, radius * (isTarget ? 2.5 : 1.6), t.satGlow, isTarget ? 0.36 : 0.13);
      // Locked on: the object takes its rarity colour (matching its label); Common stays cream.
      const tierColor = isTarget && this.theme !== THEMES.night && it.obj.tier && it.obj.tier !== 'common' ? TIER_INFO[it.obj.tier]?.color : null;
      this.drawIcon(this.iconKind(it.obj), p.x, p.y, size, look.visible || isTarget ? (tierColor ?? (isTarget ? t.satHot : t.sat)) : t.dim);
      if (isTarget) {
        ctx.strokeStyle = t.tick;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(p.x, p.y, radius + 7, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();
      if (look.visible && labelIds.has(it.obj.id) && this.labelOk(it.obj)) this.queueLabel(it.label ?? shortName(it.obj.name), p, { color: it.candidate ? t.label : t.labelDim, size: 13, weight: 500, gap: radius + 8, priority: it.candidate ? 7 : 4 });
    }

    // Moon, planet or star as the target: the sky already draws it, so just mark it and let the ring lock on.
    if (naturalTarget) {
      const p = this.project(naturalTarget);
      if (p && this.onScreen(p, 10)) {
        this.targetPos = { x: p.x, y: p.y };
        if (quietTarget) {
          // Not highlighted (stars, by default): the object itself brightens and grows a little, nothing drawn round it.
          this.glow(p.x, p.y, 22, t.starRGB, 0.42);
          ctx.save(); ctx.fillStyle = t.planet; ctx.beginPath(); ctx.arc(p.x, p.y, 3.2, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        } else {
          ctx.save(); ctx.strokeStyle = t.tick; ctx.lineWidth = 1; ctx.globalAlpha = 0.8;
          ctx.beginPath(); ctx.arc(p.x, p.y, 15, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
        }
      }
      // Off screen: the same pulsing edge arrow a satellite gets (2026-10-06: consistent guidance, e.g. in the tour).
      if ((!p || !this.inSky(p, 10)) && !this.nearRing(p)) offscreen.push({ it: { label: naturalTargetName ?? '', obj: { name: naturalTargetName ?? '' }, look: { mag: -9 } }, c: this.cam(naturalTarget), isTarget: true });
    }
    if (planeTrail) this.drawPlaneTrail(planeTrail);
    const planeAt = this.drawPlanes(planes, planeHit);
    this.drawOffscreen(offscreen, targetId);
    // The app decides what counts as locked on, so the ring, labels and tap area always agree.
    const locked = lockedOn ?? (!!focus && focus.obj.id === targetId && !!focus.candidate);
    // An unfound secret in the circle draws its own sight in its colour (drawSecrets); the usual one steps aside so the
    // circle doesn’t double up (2026-10-17).
    const secretSight = secrets?.some((x) => x.inCircle && !x.done && x.kind !== 'meteor');
    if (secretSight) this.updateRing(false);
    else if (planeAt && !locked) this.drawReticle(true, 0, false, planeAt);
    else { this.ownedInk = ownedTarget; this.drawReticle(locked, this.reducedMotion ? 0 : time, newFind && locked && !quietTarget, null, quietTarget); }
    if (this.fade && !planeAt) this.drawFade(this.fade, this.reducedMotion ? 0 : time);
    if (ufo) this.drawUfo(ufo);
    if (secrets?.length) this.drawSecrets(secrets);
    this.drawLabels();
  }

  // The lined-up plane’s path, like a satellite’s: faint solid for the last minute, red dashes for the
  // next two minutes (a straight line along its current track; it may turn).
  drawPlaneTrail(trail) {
    const ctx = this.ctx, t = this.theme;
    ctx.save();
    ctx.lineWidth = 1.2; ctx.lineCap = 'round';
    ctx.strokeStyle = t.planeDim; ctx.globalAlpha = 0.28;
    this.path(trail.filter((p) => p.t <= 0 && p.el > 0).map((p) => p.enu), 0);
    ctx.setLineDash([3, 8]); ctx.strokeStyle = t.plane; ctx.globalAlpha = 0.75;
    this.path(trail.filter((p) => p.t >= 0 && p.el > 0).map((p) => p.enu), 0);
    ctx.restore();
  }

  // Aircraft from js/planes.js: small red plane shapes pointing the way they’re flying. Returns the
  // screen position of the one in the circle (planeHit is its hex), if any.
  drawPlanes(planes, planeHit) {
    if (!planes?.length) return null;
    const ctx = this.ctx, t = this.theme;
    let hitAt = null;
    for (const a of planes) {
      const p = this.project(a.enu);
      if (!this.onScreen(p, 10)) continue;
      // Direction of travel on screen: project a point 1 km further along its track.
      const tr = a.plane.track * RAD, k = a.rangeKm;
      const w = [a.enu[0] * k + Math.sin(tr), a.enu[1] * k + Math.cos(tr), a.enu[2] * k], L = Math.hypot(...w);
      const q = this.project([w[0] / L, w[1] / L, w[2] / L]);
      const hit = a.plane.hex === planeHit;
      ctx.save();
      ctx.translate(p.x, p.y);
      if (q) ctx.rotate(Math.atan2(q.y - p.y, q.x - p.x));
      ctx.globalAlpha = hit ? 1 : 0.55;
      this.drawIcon(a.plane.heli ? 'heli' : 'plane', 0, 0, hit ? 20 : 10, hit ? t.plane : t.planeDim); // same scale as satellites (9–12, ×1.3 when targeted)
      ctx.restore();
      if (hit) hitAt = { x: p.x, y: p.y };
    }
    return hitAt;
  }

  drawOffscreen(list, targetId) {
    const ctx = this.ctx, t = this.theme;
    const margin = 27, top = this.safeTop + 20, bottom = this.h - this.safeBottom - 22;
    // A selected target stays findable even outside the camera view or when faint.
    // The two edge pointers keep pointing at the same two things until something clearly brighter comes along
    // (2026-10-08: near-equal satellites swapped back and forth, so the names at the edge flickered).
    const prev = this.offPrev ?? new Set(), rank = (e) => (e.it.look.mag ?? 9) - (prev.has(e.it.obj?.id) ? 1 : 0);
    const ordered = list.sort((a, b) => Number(b.isTarget) - Number(a.isTarget) || rank(a) - rank(b));
    const visible = targetId ? ordered.filter((entry) => entry.isTarget).slice(0, 1) : ordered.slice(0, 2);
    this.offPrev = new Set(visible.map((e) => e.it.obj?.id));
    for (const { it, c, isTarget } of visible) {
      let dx = c.x, dy = -c.y;
      // Behind you, "up" or "down" on screen means tipping over your head, which nobody does: point sideways,
      // the way to turn (matches the "Turn left/right" hint). Ahead, point straight at it.
      if (isTarget && (c.z ?? 1) < 0.2) { dx = c.x < 0 ? -1 : 1; dy = 0; }
      if (Math.hypot(dx, dy) < 1e-5) { dx = 1; dy = 0; }
      const length = Math.hypot(dx, dy);
      dx /= length; dy /= length;
      const sx = Math.abs(dx) < 1e-5 ? Infinity : (dx > 0 ? this.w - margin - this.cx : this.cx - margin) / Math.abs(dx);
      const sy = Math.abs(dy) < 1e-5 ? Infinity : (dy > 0 ? bottom - this.cy : this.cy - top) / Math.abs(dy);
      const distance = Math.max(0, Math.min(sx, sy));
      const x = this.cx + dx * distance, y = this.cy + dy * distance;
      const angle = Math.atan2(dy, dx);
      ctx.save();
      ctx.translate(x, y); ctx.rotate(angle);
      if (isTarget) {
        // The one you’re looking for (2026-10-06): a solid orange arrow in a ring, pulsing gently, so it reads at a glance.
        const pulse = 1 + 0.08 * Math.sin(performance.now() / 260);
        ctx.fillStyle = 'rgba(8,14,26,.82)'; ctx.beginPath(); ctx.arc(0, 0, 15 * pulse, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = t.tick; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = t.tick; ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(-5, -7); ctx.lineTo(-2, 0); ctx.lineTo(-5, 7); ctx.closePath(); ctx.fill();
      } else {
        ctx.strokeStyle = t.labelDim; ctx.lineWidth = 1.3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(-4, -5); ctx.lineTo(2, 0); ctx.lineTo(-4, 5); ctx.stroke();
      }
      ctx.restore();
      this.queueLabel(it.label ?? shortName(it.obj.name), { x: x - dx * (isTarget ? 24 : 14), y: y - dy * (isTarget ? 24 : 14) }, { color: isTarget ? t.label : t.labelDim, size: 13, weight: 500, gap: 10, priority: isTarget ? 10 : 3 });
    }
  }

  // The ring you aim with. When it locks on, it shrinks a little and glides onto the object, then
  // eases back when the lock is released. this.ring is what’s drawn (the tap area follows it).
  // snap (Settings, default on): the circle jumps onto a locked-on target. Off, it stays put in the
  // middle and only changes colour.
  updateRing(locked, at = this.targetPos) {
    const want = locked && at && this.snap !== false
      ? { x: at.x, y: at.y, r: this.reticlePx * 0.8 }
      : { x: this.cx, y: this.cy, r: this.reticlePx };
    const now = performance.now(), dt = Math.min(0.1, (now - (this._ringT ?? now)) / 1000);
    this._ringT = now;
    const k = this.reducedMotion ? 1 : 1 - Math.exp(-dt * (locked ? 14 : 9)); // snappy lock, softer release
    this.ring ??= { ...want };
    for (const key of ['x', 'y', 'r']) this.ring[key] += (want[key] - this.ring[key]) * k;
    return this.ring;
  }

  // Catch the fade (main.js fadeCountdown): a gold ring just outside the circle that runs down over the last 20 s
  // before the target slides into Earth’s shadow; in the last 3 s it turns bright and says NOW.
  drawFade({ left, total }, time = 0) {
    const ctx = this.ctx, ring = this.ring ?? { x: this.cx, y: this.cy, r: this.reticlePx }, r = ring.r + 11, now = left <= 3;
    const gold = this.theme === THEMES.night ? 'rgb(255,110,90)' : now ? '#ffd54a' : 'rgba(255,201,61,.8)';
    ctx.save(); ctx.lineCap = 'round';
    ctx.strokeStyle = this.theme === THEMES.night ? 'rgba(255,110,90,.18)' : 'rgba(255,201,61,.18)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(ring.x, ring.y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = gold; ctx.lineWidth = now ? 4 + Math.sin(time / 90) * 1.2 : 3;
    ctx.beginPath(); ctx.arc(ring.x, ring.y, r, -Math.PI / 2, -Math.PI / 2 + Math.max(0.02, left / total) * Math.PI * 2); ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = 4;
    if ('letterSpacing' in ctx) ctx.letterSpacing = '2px';
    ctx.font = `600 ${now ? 13 : 11}px ${FONT}`; ctx.fillStyle = gold; // inside the circle, at the bottom: the name sits above it, the button below
    ctx.fillText(now ? 'NOW!' : `FADES IN ${Math.ceil(left)}S`, ring.x, ring.y + ring.r - 13);
    ctx.restore();
  }
  // Earth’s shadow (2026-10-14, Sevaan: "let’s do it and I’ll feel it out"; design/fun-and-learning.html): at dusk and
  // dawn, the part of the sky where a satellite 500 km up would be in Earth’s shadow, so you can see why things blink
  // out. Line of sight from you (Earth’s centre straight below at R) meets the 500 km shell; that point is in shadow if
  // it’s behind Earth from the Sun and within R of the Sun-Earth line. Shaded faintly, its edge dashed gold.
  drawEarthShadow() {
    const s = this.sunEnu; if (!s || s[2] > -0.035 || (this.basis?.back?.[2] ?? 0) < -0.25) return; // night side only, looking up
    // Smooth edge (2026-10-17, Sevaan: "super jagged"): a 2° azimuth grid with each crossing found by bisection, instead
    // of a 6° × 3° grid joined corner to corner. The Sun barely moves, so the shape is cached until it does.
    const H = this.shadowKm ?? 500, key = `${s.map((v) => v.toFixed(4)).join()}|${H}`; // the height of the target in the circle (main.js)
    if (this._shadowKey !== key) { this._shadowKey = key; this._shadow = shadowShape(s, H); }
    const { cols, edges, any, all } = this._shadow, ctx = this.ctx;
    // The shade: every column added to one path and filled once, so neighbouring pieces don’t overlap into seams.
    ctx.save(); ctx.fillStyle = 'rgba(2,5,12,.22)'; ctx.beginPath();
    for (const q of cols) this.shadeQuad(q);
    ctx.fill(); ctx.restore();
    if (!any || all || !edges.length) return;
    // The edge: dashed gold, one stroke per run of neighbouring crossings.
    const red = this.theme === THEMES.night; // red night mode: no gold (QA 2026-10-16)
    ctx.save(); ctx.strokeStyle = red ? 'rgba(255,110,90,.5)' : 'rgba(255,201,61,.5)'; ctx.lineWidth = 1.3; ctx.setLineDash([5, 7]); ctx.lineJoin = 'round';
    let best = null;
    ctx.beginPath();
    for (const run of edges) {
      let pen = false;
      for (const e of run) {
        const p = this.project(e); if (!p) { pen = false; continue; }
        if (pen) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); pen = true;
        // The label’s own box (two lines, ~224 × 30 px) must stay on screen, off the sight and its ticks, and out of the
        // column under it where the target’s ticket sits (playtest 2026-10-16: it crowded "COMMON · MOON").
        const R = (this.reticlePx ?? 60) + 24, dd = Math.hypot(p.x - this.cx, p.y - this.cy);
        for (const dy of [-36, 12]) { // above the line, else below it
          const x0 = p.x - 112, x1 = p.x + 112, y0 = p.y + dy, y1 = y0 + 30;
          if (x0 < 8 || x1 > this.w - 8 || y0 < Math.max(this.h * 0.2, (this.safeTop ?? 0) + 6) || y1 > this.h - 200) continue; // below the radar and its 'N passing' and the corner chips (playtests 2026-10-17)
          const hitsSight = x1 > this.cx - R && x0 < this.cx + R && y1 > this.cy - R && y0 < this.cy + R;
          const hitsTicket = x1 > this.cx - 150 && x0 < this.cx + 150 && y1 > this.cy + R - 10 && y0 < this.cy + R + 170;
          if (!hitsSight && !hitsTicket && (!best || dd < best.dd)) { best = { p, dd, top: y0 }; break; }
        }
      }
    }
    ctx.stroke(); ctx.setLineDash([]);
    // Always say what the line is when there’s room for it (2026-10-17, Sevaan: "we need a label for it").
    if (best) {
      const x = best.p.x, y = best.top;
      ctx.textAlign = 'center'; if ('letterSpacing' in ctx) ctx.letterSpacing = '1.5px';
      ctx.fillStyle = red ? 'rgba(255,110,90,.85)' : 'rgba(255,201,61,.85)'; ctx.font = `600 11px ${FONT}`; ctx.fillText(this.shadowLabel?.[0] ?? "EARTH’S SHADOW", x, y + 11);
      if ('letterSpacing' in ctx) ctx.letterSpacing = '0.5px';
      ctx.fillStyle = red ? 'rgba(255,110,90,.65)' : 'rgba(255,242,179,.65)'; ctx.font = `500 11px ${FONT}`; ctx.fillText(this.shadowLabel?.[1] ?? 'Satellites past this line go dark', x, y + 25);
    }
    ctx.restore();
  }
  shadeQuad(q) { // adds one strip of shade (four ENU directions) to the current path; drawEarthShadow fills them all at once
    // A strip runs from low in the sky to high, so looking up, part of it is behind you and can't be drawn. It used to be
    // dropped whole, leaving light wedges meeting overhead (2026-10-20, Sevaan). Now it's cut into short pieces along
    // its length and only the pieces behind you are skipped.
    const N = 12, mix = (u, v, t) => { const x = u[0] + (v[0] - u[0]) * t, y = u[1] + (v[1] - u[1]) * t, z = u[2] + (v[2] - u[2]) * t, l = Math.hypot(x, y, z) || 1; return [x / l, y / l, z / l]; };
    if (q.every((e) => this.project(e))) { this.shadePiece(q); return; }
    for (let k = 0; k < N; k++) { const t0 = k / N, t1 = (k + 1) / N; this.shadePiece([mix(q[0], q[3], t0), mix(q[1], q[2], t0), mix(q[1], q[2], t1), mix(q[0], q[3], t1)]); }
  }
  shadePiece(q) {
    const pts = q.map((e) => this.project(e));
    if (pts.some((p) => !p)) return;
    // Every strip wound the same way on screen (2026-10-20, Sevaan: light triangles meeting overhead). Near the zenith
    // some strips project mirrored, and in one nonzero-filled path a mirrored strip cancels its neighbour where they meet.
    let a = 0; for (let i = 0; i < pts.length; i++) { const p = pts[i], q2 = pts[(i + 1) % pts.length]; a += p.x * q2.y - q2.x * p.y; }
    if (a < 0) pts.reverse();
    const ctx = this.ctx; pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.closePath();
  }
  drawReticle(locked, time = 0, newFind = false, plane = null, quiet = false) {
    const ctx = this.ctx, t = this.theme;
    const { r: radius, x: cx, y: cy } = this.updateRing(locked && !quiet, plane ?? this.targetPos); // quiet: no snap, the circle just turns orange
    ctx.save();
    const activeInk = plane ? t.plane : this.ownedInk ? (t.label ?? '#fff2b3') : t.tick; // orange = new, cream = collected, red = plane
    // The inner rule keeps the existing aiming radius. An outer rule and fine
    // indexed marks echo the orbital dial on the cards without obscuring the sky.
    // The sight (2026-10-17, design/target-states A, Sevaan): one ring in the state’s colour over a soft dark halo, so
    // it reads on a blue day sky as well as at night, and four ticks at the compass points. No fine dial.
    const ink = locked ? activeInk : t.reticle;
    ctx.strokeStyle = 'rgba(8,15,27,.28)'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.stroke();
    if (locked) { ctx.shadowColor = activeInk; ctx.shadowBlur = newFind ? 18 : 10; }
    ctx.strokeStyle = ink; ctx.lineWidth = locked ? 2.25 : 1.5;
    ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.stroke();
    ctx.shadowBlur = 0; ctx.lineCap = 'butt';
    for (const angle of [0, 90, 180, 270]) {
      const a = angle * RAD, inner = radius + 6, outer = radius + 18;
      ctx.strokeStyle = 'rgba(8,15,27,.28)'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner); ctx.lineTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer); ctx.stroke();
      ctx.strokeStyle = ink; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner); ctx.lineTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer); ctx.stroke();
    }
    if (newFind && time) { // a new find breathes: a soft second glow on the ring
      ctx.save(); ctx.globalAlpha = 0.25 + 0.2 * Math.sin(time / 650); ctx.strokeStyle = activeInk; ctx.lineWidth = 6; ctx.shadowColor = activeInk; ctx.shadowBlur = 22;
      ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    }
    // Lock pulse (2026-10-08 polish): a ring expands and fades from the circle the moment it catches something.
    const lp = this.lockPulseAt ? (performance.now() - this.lockPulseAt) / 450 : 2;
    if (lp < 1 && !this.reducedMotion) { ctx.save(); ctx.globalAlpha = (1 - lp) * 0.8; ctx.strokeStyle = activeInk; ctx.lineWidth = 2 * (1 - lp) + 0.5; ctx.beginPath(); ctx.arc(cx, cy, radius + 6 + lp * 34, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
    if (!locked) {
      ctx.strokeStyle = t.reticle; ctx.globalAlpha = 0.65; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - 3, cy); ctx.lineTo(cx + 3, cy);
      ctx.moveTo(cx, cy - 3); ctx.lineTo(cx, cy + 3);
      ctx.stroke();
    }
    ctx.restore();
  }

}

export function shortName(name) {
  return name.replace(/\s+/g, ' ').trim();
}

// All around you’s strip draws the same landscape as Explore (2026-10-21, Sevaan): the same hills, pines and meadow at
// the same bearings, in the same night/day colours, flattened onto the strip. x(az) gives the strip’s x for an azimuth
// (or null when off the strip), k its pixels per degree across, hz the horizon’s y, vy pixels per degree of height
// (true scale, so nothing worth seeing hides behind a tree). dF: how far into day (0 night … 1 day), as the sky uses.
export function stripLandscape(ctx, { W, H, hz, k, vy, centre, dF = 0, night = false, trees = true }) {
  const theme = night ? THEMES.night : THEMES.glass, d = night ? 0 : dF;
  const mix = (n0, d0) => { if (night) return theme.ground; const n = n0.match(/\w\w/g).map((h) => parseInt(h, 16)), dd = d0.match(/\w\w/g).map((h) => parseInt(h, 16)); return `rgb(${n.map((v, i) => Math.round(v + (dd[i] - v) * d)).join(',')})`; };
  const azAt = (x) => (((centre + (x - W / 2) / k) % 360) + 360) % 360;
  const elOn = (pts, az) => { const step = pts[1][0] - pts[0][0], i = Math.min(pts.length - 2, Math.floor(az / step)), f = (az - pts[i][0]) / step; return pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f; };
  const band = (pts, fill, crest) => {
    ctx.fillStyle = fill; ctx.beginPath(); ctx.moveTo(0, H + 20);
    const line = []; for (let x = 0; x <= W + 3; x += 3) line.push([x, hz - elOn(pts, azAt(x)) * vy]);
    for (const [x, y] of line) ctx.lineTo(x, y);
    ctx.lineTo(W + 3, H + 20); ctx.closePath(); ctx.fill();
    if (crest) { ctx.strokeStyle = crest; ctx.lineWidth = 1; ctx.beginPath(); line.forEach(([x, y], i) => (i ? ctx.lineTo(x, y + 0.5) : ctx.moveTo(x, y + 0.5))); ctx.stroke(); }
  };
  if (!trees) { ctx.fillStyle = mix('070c13', '4f6e3e'); ctx.fillRect(0, hz, W, H - hz + 20); return; }
  band(LANDSCAPE.ridge, d > 0 ? mix('0c1a29', '8aa6b2') : (theme.hills ?? '#0a1826'), d > 0.4 ? `rgba(220,235,240,${(0.35 * d).toFixed(2)})` : null);
  band(LANDSCAPE.hills, d > 0 ? mix('0a1826', '6f8f78') : (theme.hills ?? '#0a1826'), d > 0.4 ? `rgba(200,225,180,${(0.4 * d).toFixed(2)})` : null);
  const pine = ([az, ht, w, tiers, lean, sd], body, lit) => {
    const off = ((((az - centre) + 540) % 360) - 180) * k, x0 = W / 2 + off; if (x0 < -10 || x0 > W + 10) return;
    const X = (a) => x0 + (a - az) * Math.max(k, vy * 0.6), Y = (e) => hz - e * vy; // pines keep most of their shape: the strip squeezes bearings, not the trees
    const base = -0.3, trunkH = ht * 0.12, top = ht, left = [], right = [];
    for (let i = 0; i < tiers; i++) {
      const f = i / tiers, y0 = base + trunkH + (top - trunkH - base) * f, y1 = base + trunkH + (top - trunkH - base) * ((i + 1) / tiers) * 0.98;
      const half = (w / 2) * (1 - f * 0.78) * (0.9 + ((sd * 7 + i * 0.37) % 1) * 0.2), x = az + lean * (y0 - base);
      left.push([x - half, y0 - 0.06], [x - half * 0.42, y1 - 0.02]); right.push([x + half, y0 - 0.06], [x + half * 0.42, y1 - 0.02]);
    }
    const tip = [az + lean * (top - base), top + 0.12], outline = [...left, tip, ...right.reverse()];
    ctx.fillStyle = body; ctx.beginPath(); outline.forEach(([a, e], i) => (i ? ctx.lineTo(X(a), Y(e)) : ctx.moveTo(X(a), Y(e)))); ctx.closePath(); ctx.fill();
    if (lit) { ctx.fillStyle = lit; ctx.beginPath(); [...left, tip, [az, base + trunkH]].forEach(([a, e], i) => (i ? ctx.lineTo(X(a), Y(e)) : ctx.moveTo(X(a), Y(e)))); ctx.closePath(); ctx.fill(); }
  };
  const farC = d > 0 ? mix('0b1622', '557265') : (theme.hills ?? '#0a1826');
  for (const tr of LANDSCAPE.far) pine(tr, farC, null);
  const nearC = d > 0 ? mix('070c13', '2a4430') : theme.ground, litC = d > 0.3 ? `rgba(120,160,110,${(0.25 * d).toFixed(2)})` : null;
  for (const tr of LANDSCAPE.trees) pine(tr, nearC, litC);
  band(LANDSCAPE.rolls, d > 0 ? mix('070c13', '4f6e3e') : theme.ground, d > 0.4 ? `rgba(190,215,140,${(0.35 * d).toFixed(2)})` : null);
}
