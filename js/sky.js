// Canvas renderer for the sky view. Gnomonic (pinhole camera) projection around where the phone points.
import { extinction } from './sky-limit.js?v=0.1.438';
// Two themes: 'glass' (ink, cream and orange celestial chart) and 'night' (all red, keeps dark adaptation).
import { createMilkyGL } from './milkyway-gl.js?v=0.1.438';

import { enuFromAzEl, compassPoint } from './orbit.js?v=0.1.438';
import { TIER_INFO } from './rarity.js?v=0.1.438';

const RAD = Math.PI / 180;
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

export class SkyView {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
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
    this.cy = this.h / 2; // the middle of the phone, same spot as the loader's circle (index.html #ld-ret)
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
    return sprite;
  }

  // A broad, even falloff (gaussian) for the Milky Way's haze: the star-glow sprite above is bright only at its very
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

  inSky(p, pad = 0) {
    return p && p.x >= 16 + pad && p.x <= this.w - 16 - pad &&
      p.y >= this.safeTop + pad && p.y <= this.h - this.safeBottom - pad;
  }

  queueLabel(text, p, { color = this.theme.labelDim, size = 12, weight = 600, gap = 9, priority = 0, align = 'auto' } = {}) {
    if (!text || !this.inSky(p)) return;
    // Keep the area around a new find clear so its name and "tap to collect" are easy to read.
    const z = this.clearZone;
    if (z && p.x > z.left && p.x < z.right && p.y > z.top && p.y < z.bottom) return;
    this.labelQueue.push({ text, p, color, size, weight, gap, priority, align });
  }

  drawLabels() {
    const ctx = this.ctx;
    this.labelSide ??= new Map(); this.frameNo = (this.frameNo ?? 0) + 1;
    if (this.frameNo % 300 === 0) for (const [k, v] of this.labelSide) if (this.frameNo - (v.seen ?? 0) > 300) this.labelSide.delete(k); // forget labels long off screen
    const ring = this.ring ?? { x: this.cx, y: this.cy, r: this.reticlePx };
    const r = ring.r + 16;
    const occupied = [{ x: ring.x - r, y: ring.y - r, w: 2 * r, h: 2 * r }];
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
        ctx.save(); ctx.globalAlpha *= fa; ctx.fillText(text, x, y); ctx.restore();
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

  // Camera view's ground tint: full by day, half at night (2026-10-08, Sevaan), easing across twilight with dayF.
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

  // Dashed "ghost" markers: things up there right now that can't be seen until dark (daytime Explore).
  // ghosts: [{ enu, name, note }]
  drawGhosts(ghosts) {
    const ctx = this.ctx, t = this.theme;
    ctx.save(); ctx.setLineDash([3, 4]); ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(255,255,255,.8)';
    for (const g of ghosts) {
      if (g.enu[2] < 0) continue;
      const p = this.project(g.enu);
      if (!this.onScreen(p, 20)) continue;
      ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, Math.PI * 2); ctx.stroke();
      this.queueLabel(g.name, p, { color: 'rgba(255,255,255,.92)', size: 12, weight: 600, gap: 12, priority: 7 });
      if (g.note) this.queueLabel(g.note, { x: p.x, y: p.y + 14 }, { color: 'rgba(255,255,255,.75)', size: 10, weight: 500, gap: 12, priority: 6 });
    }
    ctx.restore();
  }

  // See-through Earth (2026-10-06): things below the horizon right now, drawn faintly where they really are, with
  // when they rise. below: [{ enu, name, note, kind }]
  drawBelow(below) {
    // Red in night mode like the rest of the sky (QA 2026-10-08: these stayed cream and orange).
    const night = this.theme === THEMES.night, INKA = night ? [255, 110, 90] : [255, 242, 179], INK = INKA.join(','), ORG = night ? '255,106,85' : '250,129,39', SUN = night ? [255, 106, 85] : [255, 180, 107];
    const ctx = this.ctx, t = this.theme, k = 1 - (this.feetA ?? 0); // fades out as the ring at your feet fades in
    ctx.save(); ctx.globalAlpha = k;
    // In the circle (2026-10-07, Sevaan): you can identify something under the ground by lining it up. Its name and
    // when it rises show above the circle in cream (it can't be collected, so the circle doesn't turn orange).
    let hit = null;
    if (this.belowFree && k > 0.5) {
      const rc = this.ring ?? { x: this.cx, y: this.cy, r: this.reticlePx };
      for (const g of below) { if (g.enu[2] >= 0) continue; const q = this.project(g.enu); if (!q) continue;
        const d = Math.hypot(q.x - rc.x, q.y - rc.y); if (d < rc.r && (!hit || d < hit.d)) hit = { g, d }; }
      if (hit) {
        const g = hit.g, y0 = rc.y - rc.r - 26;
        this.clearZone ??= { left: this.cx - Math.min(190, this.w / 2 - 12), right: this.cx + Math.min(190, this.w / 2 - 12), top: rc.y - rc.r - 100, bottom: rc.y + rc.r + 75 }; // keep sky labels off its name
        ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 4;
        ctx.font = `500 13px ${FONT}`; ctx.fillStyle = 'rgba(189,190,169,.95)';
        if ('letterSpacing' in ctx) ctx.letterSpacing = '2.5px';
        ctx.fillText('BELOW THE HORIZON', rc.x, y0 - 30);
        if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
        ctx.font = `400 26px ${DISPLAY_FONT}`; ctx.fillStyle = `rgb(${INK})`;
        ctx.fillText(g.name.toUpperCase(), rc.x, y0, this.w - 32); // squeezed rather than clipped on narrow phones (QA 2026-10-08)
        ctx.font = `500 15px ${FONT}`; ctx.fillStyle = `rgba(${INK},.75)`;
        if ('letterSpacing' in ctx) ctx.letterSpacing = '1px';
        ctx.fillText([g.note ? g.note.replace(/^up /, 'comes up ') : '', g.where ? `in the ${g.where}` : ''].filter(Boolean).join(' · ').toUpperCase(), rc.x, rc.y + rc.r + 34, this.w - 32);
        ctx.restore();
      }
    }
    // Where each one has been and where it's going under the ground, drawn exactly like a satellite's trail in the
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
      if (g.enu[2] >= 0) continue;
      const p = this.project(g.enu);
      if (!this.onScreen(p, 20)) continue;
      const r = g.kind === 'sun' ? 13 : g.kind === 'moon' ? 10 : 6;
      // The thing itself, faint, inside its dashed ring (2026-10-07: empty rings read as missing): a soft disc for
      // the Sun, Moon and planets, the satellite icon for passes.
      ctx.save(); ctx.globalAlpha = 0.6 * k;
      if (g.kind === 'sat') this.drawIcon('sat', p.x, p.y, 9, t.sat);
      else { const c = g.kind === 'sun' ? SUN : INKA; this.glow(p.x, p.y, r * 1.8, c, 0.3); ctx.fillStyle = `rgb(${c.join(',')})`; ctx.beginPath(); ctx.arc(p.x, p.y, g.kind === 'planet' ? 2.6 : r * 0.55, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
      ctx.setLineDash([3, 4]); ctx.lineWidth = 1.2;
      ctx.strokeStyle = g.kind === 'sun' ? `rgba(${ORG},.75)` : `rgba(${INK},.5)`;
      ctx.beginPath(); ctx.arc(p.x, p.y, r + 3, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      if (k > 0.5 && hit?.g !== g) this.queueLabel(g.note ? `${g.name} · ${g.note}` : g.name, p, { color: g.kind === 'sun' ? `rgba(${ORG},.9)` : `rgba(${INK},.78)`, size: 12, weight: 600, gap: r + 6, priority: 6 }); // one line, so the time never drifts off its name
    }
    ctx.restore();
  }
  // Local weather over the sky (js/weather.js): drifting cloud by cover, a fog wash, light rain or snow.
  // Screen-space and deliberately quiet: it should tell you why the sky looks empty, not perform.
  drawWeather(wx, time) {
    const ctx = this.ctx, f = this.dayF ?? 0, cover = Math.max(0, Math.min(1, (wx.cloud ?? 0) / 100));
    const sec = time / 1000;
    if (cover > 0.08) {
      // Clouds live in the sky (2026-10-07, Sevaan: they were stuck to the glass): each has a fixed spot by azimuth
      // and height, drifts slowly round, and is projected like a star, so it stays put as you move the phone.
      const n = Math.round(10 + cover * 30), rgb = f > 0.5 ? [245, 248, 250] : f > 0 ? [120, 110, 120] : [40, 50, 66];
      for (let i = 0; i < n; i++) {
        const a = (i * 0.618034) % 1, b = ((i * 0.381966) + 0.17) % 1;
        const az = (a * 360 + sec * (0.25 + b * 0.25)) % 360, el = 6 + Math.pow(b, 1.3) * 62;
        const p = this.project(enuFromAzEl(az, el)); if (!p) continue;
        const wDeg = 16 + a * 22, w = this.f * Math.tan(wDeg * RAD) / Math.max(0.35, p.c.z), h = w * (0.24 + (1 - el / 70) * 0.1);
        if (p.x < -w || p.x > this.w + w || p.y < -h * 2 || p.y > this.h + h * 2) continue;
        this.blob(p.x, p.y, w, h, rgb, 0.16 + cover * 0.5 * (f > 0 ? 1 : 0.7));
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
  // sky's first frames don't pay for it (playtest 2026-10-09).
  warmMilky() { if (this.mwGL === undefined) { try { this.mwGL = createMilkyGL('assets/sky/milkyway.webp?v=2'); } catch { this.mwGL = null; } } }
  drawMilkyWay(milky) {
    if (!milky?.spine) return;
    // The real thing (2026-10-08): ESO's all-sky photograph, mapped onto your view by js/milkyway-gl.js. The
    // drawn-by-hand version below stays as the fallback where WebGL isn't available or the photo hasn't loaded.
    if (milky.gal) {
      if (this.mwGL?.lost) this.mwGL = undefined; // rebuilt after the phone dropped its WebGL context
      this.warmMilky();
      if (this.mwGL?.ready) {
        // How much of it you can see: none under city lights (stars to about magnitude 3.5), all of it at a dark site.
        const vis = this.starLimit == null ? 1 : Math.max(0, Math.min(1, (this.starLimit - 3.6) / 2.4));
        if (!vis) return;
        const night = this.theme === THEMES.night;
        const out = this.mwGL.render({ basis: this.basis, gal: milky.gal, w: this.w, h: this.h, f: this.f, cx: this.cx, cy: this.cy, scale: 1,
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
    // 3. Dust: the Great Rift's two lanes, the Pipe and Ophiuchus clouds, the Coalsack and small dark knots.
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
      const c = this.theme === THEMES.night ? [10, 1, 0] : [8, 15, 27]; // the header's near-black, day or night
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
      // The soil texture is drawn once into an offscreen layer and reused until you've turned enough to move it by
      // about a pixel (2026-10-08 performance): 1,100 pebbles and 70 gradients a frame were the heaviest part of the sky.
      const bb = this.basis, key = [bb.back, bb.up].flat().map((v) => Math.round(v * 2000)).join(',') + `|${this.w}x${this.h}|${Math.round(dayF * 20)}`;
      const dpr = this.canvas.width / this.w;
      if (!this.soil || this.soil.key !== key) {
        const layer = this.soil?.canvas ?? (typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(1, 1) : document.createElement('canvas'));
        if (layer.width !== this.canvas.width || layer.height !== this.canvas.height) { layer.width = this.canvas.width; layer.height = this.canvas.height; }
        const lctx = layer.getContext('2d'); lctx.setTransform(1, 0, 0, 1, 0, 0); lctx.clearRect(0, 0, layer.width, layer.height); lctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const main = this.ctx; this.ctx = lctx;
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
        this.ctx = main; this.soil = { key, canvas: layer };
      }
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = dayF; ctx.drawImage(this.soil.canvas, 0, 0); ctx.restore(); ctx.globalAlpha = dayF;
      // (2026-10-08: the grass tufts and twigs on the soil were removed, Sevaan didn't like them.)
      ctx.globalAlpha = 1;
    }
    // a soft glow just under the horizon, warmer where the Sun is hiding
    const hz = []; for (let az = 0; az <= 360; az += 3) { const p = this.project(enuFromAzEl(az, -1.5)); if (p && this.onScreen(p, 60)) hz.push({ p, az }); }
    const sunAz = this.sunAz;
    for (const { p, az } of hz) {
      const warm = sunAz == null ? 0 : Math.max(0, Math.cos((az - sunAz) * RAD)) ** 3 * Math.max(0, Math.min(1, (this.sunEl + 18) / 16));
      const rgb = night ? [255, 70, 50] : [Math.round(98 + warm * 140), Math.round(122 + warm * 40), Math.round(139 - warm * 80)];
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
    const pine = ([az, ht, w, tiers, lean, sd], body, lit) => {
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

  // The ground's markings (2026-10-07, Sevaan picked "C · Quiet ring"): the survey contours and bearing labels are
  // gone, the straight grid is back. Near the horizon: small ticks every 10° and N/E/S/W. Looking down, those give way to the quiet ring
  // at your feet (drawFeet).
  drawGroundCompass() {
    const ctx = this.ctx, t = this.theme, fade = 1 - (this.feetA ?? 0);
    ctx.save();
    ctx.strokeStyle = t.groundInk;
    ctx.lineWidth = 1;
    // The straight grid is back (2026-10-07, Sevaan: it fills the void): rings at 20°, 45° and 70° down and spokes
    // every 30°, heavier on N/E/S/W. It softens as the quiet ring at your feet comes in, so the two don't fight.
    ctx.globalAlpha = 1 - 0.55 * (this.feetA ?? 0);
    for (const el of [-20, -45, -70]) {
      const pts = [];
      for (let az = 0; az <= 360; az += 3) pts.push(enuFromAzEl(az, el));
      this.path(pts);
    }
    for (let az = 0; az < 360; az += 30) {
      const pts = [];
      for (let el = -4; el >= -88; el -= 4) pts.push(enuFromAzEl(az, el));
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
  // ground's horizontal at that spot). Faint and blended until it's in the circle; then full colour with a glow,
  // a quiet line above and a hold ring that fills. f: { enu, img, inCircle, hold (0..1) }.
  drawFossil(f) {
    const dayF = this.theme === THEMES.night ? 0 : (this.dayF ?? 0);
    if (!f?.img?.complete || !f.img.naturalWidth || dayF < 0.5) return;
    const p = this.project(f.enu); if (!p || !this.onScreen(p, 160)) return;
    const az = (Math.atan2(f.enu[0], f.enu[1]) / RAD + 360) % 360, el = Math.asin(f.enu[2]) / RAD;
    const a = this.project(enuFromAzEl(az - 6, el)), b = this.project(enuFromAzEl(az + 6, el)); if (!a || !b) return;
    const ang = Math.atan2(b.y - a.y, b.x - a.x), span = Math.hypot(b.x - a.x, b.y - a.y) * 1.9; // ~23° of ground
    const w = Math.max(52, Math.min(this.w * 0.56, span * 0.75)), /* 75% of the first size (2026-10-08) */ h = w * f.img.naturalHeight / f.img.naturalWidth;
    const ctx = this.ctx, k = Math.min(1, (dayF - 0.5) * 4);
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(ang > Math.PI / 2 || ang < -Math.PI / 2 ? ang + Math.PI : ang);
    if (f.inCircle && !f.done) { ctx.shadowColor = 'rgba(255,229,192,.55)'; ctx.shadowBlur = 14; ctx.globalAlpha = 0.95 * k; }
    else { ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = 0.9 * k; ctx.drawImage(f.img, -w / 2, -h / 2, w, h); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 0.18 * k; }
    ctx.drawImage(f.img, -w / 2, -h / 2, w, h);
    ctx.restore();
    if (f.inCircle && !f.done) { // already found: no words around the circle (2026-10-08)
      const rc = this.ring ?? { x: this.cx, y: this.cy, r: this.reticlePx };
      ctx.save(); ctx.textAlign = 'center'; ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 4;
      if ('letterSpacing' in ctx) ctx.letterSpacing = '2.5px';
      ctx.font = `500 12px ${FONT}`; ctx.fillStyle = 'rgba(232,217,184,.9)'; ctx.fillText(`BELOW THE HORIZON · ${Math.round(-el)}° DOWN`, rc.x, rc.y - rc.r - 54);
      if ('letterSpacing' in ctx) ctx.letterSpacing = '1px';
      ctx.font = `400 22px ${DISPLAY_FONT}`; ctx.fillStyle = 'rgb(255,242,179)'; ctx.fillText(f.done ? 'DINO BONES' : "SOMETHING'S BURIED HERE…", rc.x, rc.y - rc.r - 26, this.w - 32);
      if ('letterSpacing' in ctx) ctx.letterSpacing = '2.5px';
      ctx.font = `500 13px ${FONT}`; ctx.fillStyle = 'rgba(232,217,184,.9)'; ctx.fillText(f.done ? 'A FOSSIL, RIGHT UNDER YOUR FEET' : 'HOLD IT IN THE CIRCLE', rc.x, rc.y + rc.r + 34);
      if (!f.done && f.hold > 0) { ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(255,229,192,.95)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(rc.x, rc.y, rc.r + 9, -Math.PI / 2, -Math.PI / 2 + f.hold * Math.PI * 2); ctx.stroke(); }
      ctx.restore();
    }
  }

  // The UFO (js/ufo.js): a little saucer with a faint green glow, no label. In the circle the ring turns green and
  // "✦ UNIDENTIFIED / ???" shows above it (the Tap to collect button is #ufo-cta in the HUD). u: { enu, inCircle }.
  drawUfo(u) {
    const p = this.project(u.enu); if (!p || !this.onScreen(p, 30)) return;
    const ctx = this.ctx, s = u.inCircle ? 1.15 : 0.5; // rocket-stage size; it enlarges only in the circle (2026-10-08)
    ctx.save(); ctx.translate(p.x, p.y); ctx.scale(s, s);
    ctx.shadowColor = `rgba(125,255,138,${u.inCircle ? .8 : .45})`; ctx.shadowBlur = u.inCircle ? 12 : 7;
    ctx.fillStyle = 'rgba(207,232,255,.85)'; ctx.beginPath(); ctx.moveTo(-6, -1); ctx.quadraticCurveTo(-5, -7, 0, -7); ctx.quadraticCurveTo(5, -7, 6, -1); ctx.fill();
    ctx.fillStyle = '#fff2b3'; ctx.beginPath(); ctx.ellipse(0, 0, 14, 4.2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0; ctx.fillStyle = this.theme === THEMES.night ? '#ff6a55' : '#7dff8a'; for (const [x, y] of [[-8, .5], [0, 1.6], [8, .5]]) { ctx.beginPath(); ctx.arc(x, y, 1.3, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
    if (u.inCircle) {
      const rc = this.ring ?? { x: this.cx, y: this.cy, r: this.reticlePx };
      ctx.save(); ctx.strokeStyle = this.theme === THEMES.night ? '#ff6a55' : '#7dff8a'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(rc.x, rc.y, rc.r, 0, Math.PI * 2); ctx.stroke();
      ctx.textAlign = 'center'; ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 4;
      if ('letterSpacing' in ctx) ctx.letterSpacing = '2.5px';
      ctx.font = `500 12px ${FONT}`; ctx.fillStyle = '#9cff9c'; ctx.fillText('✦ UNIDENTIFIED', rc.x, rc.y - rc.r - 54);
      if ('letterSpacing' in ctx) ctx.letterSpacing = '1px';
      ctx.font = `400 26px ${DISPLAY_FONT}`; ctx.fillStyle = 'rgb(255,242,179)'; ctx.fillText('???', rc.x, rc.y - rc.r - 24);
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
      // Deep-space spots (Voyagers, Pioneers, New Horizons, the Wow! signal) are invisible until they're in your
      // circle, so you stumble on them (2026-10-09, Sevaan). Found ones show quietly there too, never elsewhere.
      const hidden = ['voyager', 'voyager2', 'pioneer10', 'pioneer11', 'newhorizons', 'wow'].includes(s.kind);
      if (hidden && !s.inCircle) continue;
      if (s.done) continue; // once found, a secret leaves the sky for good (2026-10-09, Sevaan)
      const sc = s.inCircle && !s.done ? 1.6 : 1;
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
      } else if (s.kind === 'voyager' || s.kind === 'voyager2') {
        ctx.shadowColor = 'rgba(226,181,60,.7)'; ctx.shadowBlur = 5; ctx.fillStyle = '#e2b53c'; ctx.beginPath(); ctx.arc(0, 0, 2.6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#2a1a08'; ctx.beginPath(); ctx.arc(0, 0, 0.8, 0, Math.PI * 2); ctx.fill();
      } else if (s.kind === 'pioneer10' || s.kind === 'pioneer11') { // a dish with its boom
        ctx.shadowColor = 'rgba(226,181,60,.6)'; ctx.shadowBlur = 4; ctx.strokeStyle = '#fff2b3'; ctx.lineWidth = 0.9;
        ctx.beginPath(); ctx.ellipse(0, 0, 3, 1.2, -0.5, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(4.5, 2.6); ctx.stroke();
      } else if (s.kind === 'newhorizons') { // a little triangle body with its dish
        ctx.shadowColor = 'rgba(143,208,255,.6)'; ctx.shadowBlur = 4; ctx.fillStyle = '#c9d8e6'; ctx.beginPath(); ctx.moveTo(-2.5, 2); ctx.lineTo(2.5, 2); ctx.lineTo(0, -2.2); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#fff2b3'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(0, -0.4, 3, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
      } else if (s.kind === 'wow') { // a faint radio pulse
        ctx.strokeStyle = '#ff6b6b'; ctx.lineWidth = 0.9; ctx.globalAlpha = 0.85;
        for (const r of [1.4, 3, 4.6]) { ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha *= 0.6; }
      }
      ctx.restore();
      if (s.inCircle && !s.done) {
        ctx.save(); ctx.strokeStyle = s.color; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(rc.x, rc.y, rc.r, 0, Math.PI * 2); ctx.stroke();
        ctx.textAlign = 'center'; ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 4;
        if ('letterSpacing' in ctx) ctx.letterSpacing = '2.5px';
        ctx.font = `500 12px ${FONT}`; ctx.fillStyle = s.color; ctx.fillText(s.sub.toUpperCase(), rc.x, rc.y - rc.r - 54);
        if ('letterSpacing' in ctx) ctx.letterSpacing = '1px';
        ctx.font = `400 24px ${DISPLAY_FONT}`; ctx.fillStyle = 'rgb(255,242,179)'; ctx.fillText(s.title.toUpperCase(), rc.x, rc.y - rc.r - 24);
        if (s.hold > 0) { ctx.shadowBlur = 0; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(rc.x, rc.y, rc.r + 9, -Math.PI / 2, -Math.PI / 2 + s.hold * Math.PI * 2); ctx.stroke(); }
        ctx.restore();
      }
    }
  }

  // The quiet ring at your feet (design/compass-feet.html, option C): a thin compass ring drawn flat on the
  // screen around the point straight below you, turning as you turn. Everything below the horizon sits on the ring
  // at the direction it will come up, with its time. Nothing in the middle. Fades in as you look down.
  drawFeet(below) {
    const a = this.feetA ?? 0; if (a < 0.02) return;
    const ctx = this.ctx, t = this.theme;
    // Painted on the ground (2026-10-07, Sevaan: stick to the grid, don't float): the ring is the circle 13° out
    // from the point straight below you, projected like the grid lines, so it stays put as you move.
    const EL = -77, n = this.project([0, 0, -1]); if (!n) return;
    const at = (az, el = EL) => this.project(enuFromAzEl(az, el));
    const dir = (az) => { const q = at(az); if (!q) return null; const dx = q.x - n.x, dy = q.y - n.y, l = Math.hypot(dx, dy) || 1; return [dx / l, dy / l]; };
    const ink = t === THEMES.night ? 'rgba(255,90,70,' : 'rgba(255,242,179,';
    ctx.save(); ctx.globalAlpha = a;
    ctx.strokeStyle = ink + '.4)'; ctx.lineWidth = 1;
    const ringPts = []; for (let az = 0; az <= 360; az += 4) ringPts.push(enuFromAzEl(az, EL)); this.path(ringPts);
    for (let az = 0; az < 360; az += 10) {
      const p0 = at(az), p1 = at(az, EL + (az % 90 === 0 ? 2.2 : az % 30 === 0 ? 1.5 : 0.8)); if (!p0 || !p1) continue;
      ctx.strokeStyle = ink + (az % 30 === 0 ? '.45)' : '.25)');
      ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke();
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `400 15px ${DISPLAY_FONT}`;
    for (const [az, letter] of [[0, 'N'], [90, 'E'], [180, 'S'], [270, 'W']]) {
      const q = at(az, EL - 4.5); if (!q) continue;
      ctx.fillStyle = az === 0 ? t.groundNorth : ink + '.75)';
      ctx.fillText(letter, q.x, q.y);
    }
    ctx.fillStyle = ink + '.5)'; ctx.beginPath(); ctx.arc(n.x, n.y, 2, 0, Math.PI * 2); ctx.fill();
    // Things below, on the ring where they'll come up.
    const boxes = [];
    for (const g of (below ?? []).filter((g) => g.riseAz != null)) {
      const u = dir(g.riseAz), m = at(g.riseAz); if (!u || !m) continue;
      const x = m.x, y = m.y;
      const col = g.kind === 'sun' ? 'rgb(255,180,107)' : g.kind === 'sat' ? t.sat : 'rgb(255,242,179)';
      if (g.kind === 'sat') this.drawIcon('sat', x, y, 9, t.sat);
      else if (g.kind === 'moon') { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#0a1424'; ctx.beginPath(); ctx.arc(x + 2.2, y - 1.3, 4.4, 0, Math.PI * 2); ctx.fill(); }
      else { const rgb = g.kind === 'sun' ? [255, 180, 107] : [255, 242, 179]; this.glow(x, y, g.kind === 'sun' ? 12 : 8, rgb, 0.35); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, g.kind === 'sun' ? 4.5 : 2.6, 0, Math.PI * 2); ctx.fill(); }
      // Label just outside the ring along the same direction; nudged outward until it clears the others.
      const name = g.name.replace(/^The /, '').toUpperCase(), when = g.time ? ` ${g.time.replace(/\s?[AP]\.?M\.?$/i, '')}` : '';
      ctx.font = `500 11px ${FONT}`;
      const wN = ctx.measureText(name).width, wT = ctx.measureText(when).width, w = wN + wT, h = 13;
      // Steady labels (2026-10-08, Sevaan: text jumping around): each label remembers its alignment and row. The
      // alignment only changes well past the switch point, a label keeps its row while that row is free, and when it
      // does move it slides there over a few frames instead of snapping (measured: jumps of 15–75 px before).
      const mem = (this.feetMem ??= new Map()), lm = mem.get(name) ?? {};
      let align = u[0] > 0.35 ? 'left' : u[0] < -0.35 ? 'right' : 'center';
      if (lm.align === 'left' && u[0] > 0.2) align = 'left'; else if (lm.align === 'right' && u[0] < -0.2) align = 'right';
      else if (lm.align === 'center' && Math.abs(u[0]) < 0.5) align = 'center';
      // Crowded (several things rising in the east): slide the label up or down a row until it's clear.
      const out = 14, lx = x + u[0] * out, ly0 = y + u[1] * out;
      let bx = align === 'left' ? lx : align === 'right' ? lx - w : lx - w / 2, by = ly0 - h / 2, ly = ly0, row = 0;
      bx = Math.max(10, Math.min(this.w - 10 - w, bx)); // never off the screen edge
      for (const dy of [...new Set([lm.row ?? 0, 0, 15, -15, 30, -30, 45, -45, 60, -60])]) {
        ly = ly0 + dy; by = ly - h / 2; row = dy;
        if (!boxes.some((b) => bx < b[0] + b[2] + 4 && bx + w + 4 > b[0] && by < b[1] + b[3] + 2 && by + h + 2 > b[1])) break;
      }
      boxes.push([bx, by, w, h]);
      // Glide from where it was drawn last time, relative to its dot (so it still tracks the dot exactly as you turn).
      const ox = bx - x, oy = by - y;
      if (lm.ox != null && Math.hypot(ox - lm.ox, oy - lm.oy) < 140) { lm.ox += (ox - lm.ox) * 0.2; lm.oy += (oy - lm.oy) * 0.2; } else { lm.ox = ox; lm.oy = oy; }
      Object.assign(lm, { align, row }); mem.set(name, lm);
      bx = Math.max(10, Math.min(this.w - 10 - w, x + lm.ox)); by = y + lm.oy; ly = by + h / 2;
      ctx.strokeStyle = col; ctx.globalAlpha = a * (ly !== ly0 ? 0.75 : 0.45); // a nudged label gets a clearer leader back to its dot
      ctx.beginPath(); ctx.moveTo(x + u[0] * 7, y + u[1] * 7); ctx.lineTo(align === 'left' ? bx - 4 : align === 'right' ? bx + w + 4 : bx + w / 2, align === 'center' ? (u[1] > 0 ? by - 2 : by + h + 2) : ly); ctx.stroke();
      ctx.globalAlpha = a; ctx.textAlign = 'left';
      ctx.fillStyle = col; ctx.fillText(name, bx, by + h / 2);
      ctx.fillStyle = ink + '.6)'; ctx.fillText(when, bx + wN, by + h / 2);
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
      ctx.beginPath(); ctx.moveTo(-0.55 * u, -0.78 * u); ctx.lineTo(1.1 * u, 0.78 * u); ctx.moveTo(-0.55 * u, 0.78 * u); ctx.lineTo(1.1 * u, -0.78 * u); ctx.stroke(); // main rotor
    } else if (kind === 'station') {
      ctx.rotate(-0.2);
      rect(-1.0, -0.06, 2.0, 0.12);                   // truss
      ctx.globalAlpha *= 0.85;
      for (const px of [-0.85, -0.55, 0.45, 0.75]) { rect(px, -0.62, 0.22, 0.5); rect(px, 0.12, 0.22, 0.5); }  // panel pairs
      ctx.globalAlpha /= 0.85;
      rect(-0.3, -0.16, 0.6, 0.32); rect(-0.1, -0.34, 0.2, 0.68); // modules
    } else {
      ctx.rotate(0.6);
      ctx.beginPath(); ctx.moveTo(-0.7 * u, -0.2 * u); ctx.lineTo(-0.1 * u, -0.6 * u); ctx.lineTo(0.7 * u, -0.25 * u); ctx.lineTo(0.45 * u, 0.5 * u); ctx.lineTo(-0.35 * u, 0.4 * u); ctx.closePath(); ctx.fill();
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
        this.queueLabel(t.constCase(c.name), this.project(c.enu), { color: t.constLabel, size: 12, weight: 500, priority: 2, align: 'center' });
      }
    }
    // Stars towards the edges of the screen twinkle, ever so slightly; the middle, where you're aiming,
    // stays still. Each star gets its own slow, irregular rhythm (two sines, per-star phase and speed).
    const sec = time / 1000, hw = this.w / 2, hh = this.h / 2;
    for (let i = 0; i < sky.stars.length; i++) {
      const s = sky.stars[i];
      if (s.enu[2] < 0) continue;
      // The sky slider: stars fainter than tonight's limit (after the extra air near the horizon) aren't drawn;
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
      if (s.name && s.mag < 1.2) this.queueLabel(s.name, p, { color: t.starLabel, gap: r + 6, priority: 0 });
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
        // In daylight a thin or new Moon is invisible: don't paint a black disc on a blue sky (2026-10-08 playtest).
        if ((this.dayF ?? 0) > 0.3 && (b.illum ?? 1) < 0.25) continue;
        const radius = 12;
        this.glow(p.x, p.y, 34, t.starRGB, 0.2);
        this.drawMoon(p, radius, sun ? this.brightLimbAngle(b.enu, sun.enu, p) : 0, b.phaseAngle);
        this.queueLabel('Moon', p, { color: t.body, size: 14, weight: 500, gap: radius + 10, priority: 8 });
      } else if (b.kind === 'sun') {
        const f = this.dayF ?? 0;
        this.glow(p.x, p.y, 70 + f * 90, f > 0 ? [255, 246, 207] : t.satGlow, 0.55);
        ctx.fillStyle = f > 0.3 ? '#fffbea' : t.sun;
        ctx.beginPath(); ctx.arc(p.x, p.y, 12 + f * 6, 0, Math.PI * 2); ctx.fill();
        // A dashed guard ring by day: aim the phone, never your eyes.
        if (f > 0) { ctx.save(); ctx.setLineDash([4, 5]); ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(250,129,39,.85)'; ctx.beginPath(); ctx.arc(p.x, p.y, 44, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
        this.queueLabel('Sun', p, { color: f > 0.3 ? '#143046' : t.body, size: 14, gap: 22 + f * 24, priority: 8 });
      } else {
        // Planets on the same brightness scale as the stars (2026-10-06, Sevaan: Saturn looked far brighter than
        // it is). Apparent magnitude after the air near the horizon; anything fainter than tonight's limit (the sky
        // slider, twilight, the Moon) isn't drawn, so Neptune no longer shows to the naked eye.
        const elDeg = Math.asin(Math.min(1, Math.max(-1, b.enu[2]))) * 180 / Math.PI, m = b.mag + extinction(elDeg);
        if (this.starLimit != null && m > this.starLimit) continue;
        const dayK = 1 - Math.min(1, (this.dayF ?? 0) / 0.6) * (m > -3 ? 1 : 0.4); // only Venus-bright survives daylight
        if (dayK <= 0.02) continue;
        const radius = Math.max(0.9, Math.min(3.4, 2.3 - 0.3 * m)), a = Math.max(0.3, Math.min(1, 1 - 0.1 * m)) * dayK;
        if (m < 0.5) this.glow(p.x, p.y, radius * (m < -2 ? 5 : 3.2), t.starRGB, (m < -2 ? 0.34 : 0.16) * dayK);
        ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = t.planet;
        ctx.beginPath(); ctx.arc(p.x, p.y, radius, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        this.queueLabel(b.name, p, { color: t.body, size: 14, weight: 500, gap: radius + 10, priority: 8 });
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

  // Only the focused object's trajectory is shown. The dotted future is prediction,
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
  draw(basis, items, { showDim, sky, bodies, milky, lines = true, targetId = null, time = 0, safeTop = 150, safeBottom = 230, centerY, starLimit = null, naturalTargetName = null, quietTarget = false, below = null, ownedTarget = false, sunEl = -90, ghosts = null, weather = null, newFind = false, rising = null, landscape = false, lockedOn = null, planes = null, planeHit = null, planeTrail = null, naturalTarget = null, fossil = null, ufo = null, secrets = null } = {}) {
    this.basis = basis;
    this.safeTop = Math.max(12, Math.min(safeTop, this.h * 0.45));
    this.safeBottom = Math.max(12, Math.min(safeBottom, this.h - this.safeTop - 100));
    this.cy = Number.isFinite(centerY) ? centerY : this.h / 2; // fixed: no clamping to the measured UI, which shifted it on the first frames
    this.labelQueue = [];
    const r = this.reticlePx;
    const rc = this.ring ?? { x: this.cx, y: this.cy };
    this.clearZone = newFind || planeHit ? { left: this.cx - Math.min(190, this.w / 2 - 12), right: this.cx + Math.min(190, this.w / 2 - 12), top: rc.y - r - 100, bottom: rc.y + r + 75 } : null;
    const ctx = this.ctx, t = this.theme;
    // Day factor: 0 at night, 1 in full daylight (civil twilight in between). Drives the sky tone and what shows.
    this.dayF = this.theme === THEMES.night ? 0 : Math.max(0, Math.min(1, (sunEl + 8) / 12));
    this.starLimit = starLimit; this.sunEl = sunEl;
    { const s = bodies?.find?.((b) => b.kind === 'sun'); this.sunAz = s ? (Math.atan2(s.enu[0], s.enu[1]) / RAD + 360) % 360 : null; }
    this.drawBackground();
    if ((this.dayF ?? 0) < 0.2 && !this.camera) this.drawMilkyWay(milky); // no Milky Way in camera view
    if (sky && (this.dayF ?? 0) < 0.6) this.drawStars(sky, { lines: lines && this.dayF < 0.2, time: this.reducedMotion ? 0 : time, starLimit });
    if (weather && !this.camera) this.drawWeather(weather, this.reducedMotion ? 0 : time); // the camera shows the real clouds
    if (bodies) this.drawBodies(bodies);
    if (ghosts?.length) this.drawGhosts(ghosts);
    this.feetA = Math.max(0, Math.min(1, (-this.basis.back[2] - 0.8) / 0.1)); // fades in from ~53° down, full by ~64° (it is on the ground now, so it can show sooner)
    this.drawGround();
    if (landscape) { // trees, hills and meadow; in camera view see-through like the sky and ground (an overlay of our world on yours)
      if (this.camera) { ctx.save(); ctx.globalAlpha = 0.6; this.drawLandscape(); ctx.restore(); } else this.drawLandscape();
    }
    this.drawGroundCompass();
    if (fossil && !this.camera) this.drawFossil(fossil); // not in camera view
    // Looking down: the quiet ring takes over from the see-through ghosts (same things, by rise direction).
    this.belowFree = !targetId && !planeHit; // the circle can name a below-horizon thing only when it isn't busy
    if (below?.length && this.basis.back[2] < 0.15 && this.feetA < 0.98) this.drawBelow(below);
    this.drawFeet(below);
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
        if (look.visible || isTarget) offscreen.push({ it, c: this.cam(v), isTarget });
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
      if (look.visible && labelIds.has(it.obj.id)) this.queueLabel(it.label ?? shortName(it.obj.name), p, { color: it.candidate ? t.label : t.labelDim, size: 13, weight: 500, gap: radius + 8, priority: it.candidate ? 7 : 4 });
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
      if (!p || !this.inSky(p, 10)) offscreen.push({ it: { label: naturalTargetName ?? '', obj: { name: naturalTargetName ?? '' }, look: { mag: -9 } }, c: this.cam(naturalTarget), isTarget: true });
    }
    if (planeTrail) this.drawPlaneTrail(planeTrail);
    const planeAt = this.drawPlanes(planes, planeHit);
    this.drawOffscreen(offscreen, targetId);
    // The app decides what counts as locked on, so the ring, labels and tap area always agree.
    const locked = lockedOn ?? (!!focus && focus.obj.id === targetId && !!focus.candidate);
    if (planeAt && !locked) this.drawReticle(true, 0, false, planeAt);
    else { this.ownedInk = ownedTarget; this.drawReticle(locked, this.reducedMotion ? 0 : time, newFind && locked && !quietTarget, null, quietTarget); }
    if (ufo) this.drawUfo(ufo);
    if (secrets?.length) this.drawSecrets(secrets);
    this.drawLabels();
  }

  // The lined-up plane's path, like a satellite's: faint solid for the last minute, red dashes for the
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

  // Aircraft from js/planes.js: small red plane shapes pointing the way they're flying. Returns the
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
        // The one you're looking for (2026-10-06): a solid orange arrow in a ring, pulsing gently, so it reads at a glance.
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
  // eases back when the lock is released. this.ring is what's drawn (the tap area follows it).
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

  drawReticle(locked, time = 0, newFind = false, plane = null, quiet = false) {
    const ctx = this.ctx, t = this.theme;
    const { r: radius, x: cx, y: cy } = this.updateRing(locked && !quiet, plane ?? this.targetPos); // quiet: no snap, the circle just turns orange
    ctx.save();
    const activeInk = plane ? t.plane : this.ownedInk ? (t.label ?? '#fff2b3') : t.tick; // orange = new, cream = collected, red = plane
    // The inner rule keeps the existing aiming radius. An outer rule and fine
    // indexed marks echo the orbital dial on the cards without obscuring the sky.
    ctx.strokeStyle = locked ? activeInk : t.reticle;
    ctx.lineWidth = locked ? 1.5 : 1;
    ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = locked ? activeInk : t.reticleSoft;
    ctx.lineWidth = 0.75;
    ctx.globalAlpha = locked ? 0.55 : 1;
    ctx.beginPath(); ctx.arc(cx, cy, radius + 5, 0, Math.PI * 2); ctx.stroke();
    ctx.lineCap = 'butt';
    for (let angle = 0; angle < 360; angle += 15) {
      const cardinal = angle % 90 === 0;
      const a = angle * RAD, inner = radius + 5, outer = radius + (cardinal ? 13 : 9);
      ctx.strokeStyle = cardinal ? activeInk : t.reticle;
      ctx.globalAlpha = cardinal ? 0.9 : 0.42;
      ctx.lineWidth = cardinal ? 1.5 : 0.75;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
      ctx.lineTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer);
      ctx.stroke();
    }
    if (newFind) {
      // A restrained ink pulse makes a new collectible distinct from an owned target.
      ctx.globalAlpha = time ? 0.6 + 0.25 * Math.sin(time / 650) : 0.85;
      ctx.fillStyle = activeInk;
      for (const angle of [45, 135, 225, 315]) {
        const a = angle * RAD, d = radius + 11;
        ctx.beginPath(); ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 2, 0, Math.PI * 2); ctx.fill();
      }
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
