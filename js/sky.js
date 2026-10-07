// Canvas renderer for the sky view. Gnomonic (pinhole camera) projection around where the phone points.
import { extinction } from './sky-limit.js?v=0.1.226';
// Two themes: 'glass' (ink, cream and orange celestial chart) and 'night' (all red, keeps dark adaptation).

import { enuFromAzEl, compassPoint } from './orbit.js?v=0.1.226';
import { TIER_INFO } from './rarity.js?v=0.1.226';

const RAD = Math.PI / 180;
const FONT = '"SC Label", "Barlow Condensed", "Arial Narrow", sans-serif';

const THEMES = {
  glass: {
    bgTop: '#0c1d29', bgBottom: '#080f1b',
    milky: [111, 139, 154], milkyOpacity: 0.48, riftRgb: [8, 15, 27],
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
  const trees = [];
  for (let az = 0; az < 360; az += 0.5 + r() * 1.0) {
    if (r() < 0.06) { az += 2 + r() * 6; continue; } // clearings
    trees.push([az, 1.2 + r() ** 1.6 * 2.2, 0.7 + r() * 0.9]);
  }
  return { hills, trees };
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
    this.cy = (this.safeTop + this.h - this.safeBottom) / 2;
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
    ctx.fill();
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
        const [x, y] = candidates[pick];
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillStyle = color;
        ctx.fillText(text, x, y);
        occupied.push(box);
      }
    }
    ctx.textBaseline = 'alphabetic';
  }

  drawBackground() {
    const ctx = this.ctx, t = this.theme, f = this.dayF ?? 0;
    const g = ctx.createLinearGradient(0, 0, 0, this.h);
    if (f <= 0) { g.addColorStop(0, t.bgBottom); g.addColorStop(1, t.bgTop); }
    else {
      // The real sky by day and at dusk (2026-10-06): navy → dusk orange along the horizon → pale blue.
      const mix = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
      const rgb = (c) => `rgb(${c.join(',')})`;
      const nightTop = [12, 29, 41], nightBot = [8, 15, 27], duskTop = [27, 42, 90], duskBot = [240, 163, 90], dayTop = [63, 127, 191], dayBot = [185, 214, 234];
      const k = f < 0.5 ? f * 2 : (f - 0.5) * 2;
      const top = f < 0.5 ? mix(nightTop, duskTop, k) : mix(duskTop, dayTop, k), bot = f < 0.5 ? mix(nightBot, duskBot, k) : mix(duskBot, dayBot, k);
      g.addColorStop(0, rgb(top)); g.addColorStop(1, rgb(bot));
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
    const ctx = this.ctx, t = this.theme;
    ctx.save();
    for (const g of below) {
      if (g.enu[2] >= 0) continue;
      const p = this.project(g.enu);
      if (!this.onScreen(p, 20)) continue;
      const r = g.kind === 'sun' ? 13 : g.kind === 'moon' ? 10 : 6;
      ctx.setLineDash([3, 4]); ctx.lineWidth = 1.2;
      ctx.strokeStyle = g.kind === 'sun' ? 'rgba(250,129,39,.75)' : 'rgba(255,242,179,.5)';
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      this.queueLabel(g.note ? `${g.name} · ${g.note}` : g.name, p, { color: g.kind === 'sun' ? 'rgba(250,129,39,.9)' : 'rgba(255,242,179,.78)', size: 12, weight: 600, gap: r + 6, priority: 6 }); // one line, so the time never drifts off its name
    }
    ctx.restore();
  }
  // Local weather over the sky (js/weather.js): drifting cloud by cover, a fog wash, light rain or snow.
  // Screen-space and deliberately quiet: it should tell you why the sky looks empty, not perform.
  drawWeather(wx, time) {
    const ctx = this.ctx, f = this.dayF ?? 0, cover = Math.max(0, Math.min(1, (wx.cloud ?? 0) / 100));
    const sec = time / 1000;
    if (cover > 0.08) {
      const n = Math.round(4 + cover * 10), rgb = f > 0.5 ? [245, 248, 250] : f > 0 ? [120, 110, 120] : [40, 50, 66];
      for (let i = 0; i < n; i++) {
        const a = (i * 0.618034) % 1, b = ((i * 0.381966) + 0.17) % 1;
        const w = this.w * (0.35 + a * 0.4), h = w * 0.28, x = ((a * this.w * 1.6 + sec * (6 + b * 6)) % (this.w + w)) - w / 2, y = this.h * (0.12 + b * 0.55);
        this.blob(x, y, w, h, rgb, 0.16 + cover * 0.5 * (f > 0 ? 1 : 0.7));
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
  drawMilkyWay(milky) {
    if (!milky?.spine) return;
    const ctx = this.ctx, [r, g, b] = this.theme.milky;
    const pxPerDeg = this.f * RAD;
    const fade = (enu) => Math.max(0, Math.min(1, (enu[2] + 0.02) / 0.2)); // melt into the horizon
    ctx.save();
    ctx.globalAlpha *= this.theme.milkyOpacity ?? 1;
    ctx.lineCap = 'butt'; ctx.lineJoin = 'round';
    // 1. The glow, airbrushed: soft spots every degree along the band, overlapping so heavily that
    //    they blend into one smooth band (sparse spots are what made it look like a string of dots).
    const spine = milky.spine;
    for (const [widthK, strength] of [[1.25, 0.3], [0.55, 0.26]]) {
      for (const pt of spine) {
        const p = this.project(pt.enu);
        if (!p) continue;
        const f = fade(pt.enu);
        if (!f) continue;
        const radius = Math.min(this.w * 1.2, pt.width * widthK * pxPerDeg / Math.max(0.25, p.c.z));
        if (!this.onScreen(p, radius)) continue;
        // Divide by how many neighbours overlap this spot so the total stays even.
        const overlap = Math.max(1, (2 * pt.width * widthK) / 1);
        this.glow(p.x, p.y, radius, this.theme.milky, Math.min(0.3, strength * pt.bright * f / overlap * 3));
      }
    }
    // 2. The Great Rift: a dark lane of dust through Cygnus and Aquila, airbrushed the same way.
    const dark = this.theme.riftRgb ?? [4, 10, 22];
    for (const pt of milky.rift) {
      const p = this.project(pt.enu);
      if (!p) continue;
      const radius = pt.w * pxPerDeg / Math.max(0.25, p.c.z);
      if (!this.onScreen(p, radius)) continue;
      this.glow(p.x, p.y, radius, dark, 0.16 * fade(pt.enu));
    }
    // 3. Star-cloud grain: thousands of faint specks, batched by brightness for speed.
    const buckets = [[], [], []];
    for (const sp of milky.specks) {
      if (sp.enu[2] < 0) continue;
      const p = this.project(sp.enu);
      if (!p || p.x < 0 || p.y < 0 || p.x > this.w || p.y > this.h) continue;
      buckets[Math.min(2, Math.floor(sp.a * fade(sp.enu) * 3))].push(p.x, p.y, sp.s);
    }
    buckets.forEach((list, k) => {
      if (!list.length) return;
      ctx.fillStyle = `rgba(${Math.min(255, r + 80)}, ${Math.min(255, g + 80)}, ${Math.min(255, b + 70)}, ${[0.1, 0.17, 0.26][k]})`;
      ctx.beginPath();
      for (let i = 0; i < list.length; i += 3) ctx.rect(list[i], list[i + 1], list[i + 2], list[i + 2]);
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
    // The earth (2026-10-06): darker the further down you look, so the ground reads as ground, not more sky.
    const down = Math.max(0, Math.min(1, -this.basis.back[2] * 1.4));
    const night = this.theme === THEMES.night;
    ctx.save();
    ctx.beginPath(); ground.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath();
    ctx.fillStyle = this.theme.ground; ctx.fill();
    ctx.clip();
    if (!night) { ctx.fillStyle = `rgba(3, 6, 11, ${(0.25 + down * 0.45).toFixed(3)})`; ctx.fillRect(0, 0, this.w, this.h); }
    // a soft glow just under the horizon, warmer where the Sun is hiding
    const hz = []; for (let az = 0; az <= 360; az += 3) { const p = this.project(enuFromAzEl(az, -1.5)); if (p && this.onScreen(p, 60)) hz.push({ p, az }); }
    const sunAz = this.sunAz;
    for (const { p, az } of hz) {
      const warm = sunAz == null ? 0 : Math.max(0, Math.cos((az - sunAz) * RAD)) ** 3 * Math.max(0, Math.min(1, (this.sunEl + 18) / 16));
      const rgb = night ? [255, 70, 50] : [Math.round(98 + warm * 140), Math.round(122 + warm * 40), Math.round(139 - warm * 80)];
      this.glow(p.x, p.y, 46, rgb, (night ? 0.05 : 0.07) + warm * 0.12);
    }
    ctx.restore();
  }

  drawLandscape() {
    const ctx = this.ctx, t = this.theme;
    ctx.save();
    // Haze glowing just above the horizon (a touch of distant light pollution).
    for (const [w, alpha] of [[5, 0.05], [2.5, 0.06]]) {
      ctx.strokeStyle = t.haze ?? 'rgba(120, 150, 180, 1)';
      ctx.globalAlpha = alpha;
      ctx.lineWidth = w * this.f * RAD;
      const pts = [];
      for (let az = 0; az <= 360; az += 3) pts.push(enuFromAzEl(az, w * 0.3));
      this.path(pts);
    }
    ctx.globalAlpha = 1;
    // Far hills, a shade lighter than the ground.
    ctx.fillStyle = t.hills ?? '#0a1826';
    const h = LANDSCAPE.hills;
    for (let i = 0; i < h.length - 1; i += 3) {
      const seg = h.slice(i, i + 4);
      this.poly([...seg, [seg[seg.length - 1][0], -2], [seg[0][0], -2]]);
    }
    // Tree line: two stacked triangles make a pine.
    ctx.fillStyle = t.ground;
    for (const [az, ht, w] of LANDSCAPE.trees) {
      this.poly([[az - w / 2, -0.3], [az + w / 2, -0.3], [az, ht * 0.7]]);
      this.poly([[az - w * 0.35, ht * 0.35], [az + w * 0.35, ht * 0.35], [az, ht]]);
    }
    ctx.restore();
  }

  // A compass painted on the ground at your feet: rings, spokes every 30°, ticks every 10°,
  // bearings, and big N/E/S/W. Point the phone down to orient yourself.
  drawGroundCompass() {
    const ctx = this.ctx, t = this.theme;
    ctx.save();
    ctx.strokeStyle = t.groundInk;
    ctx.lineWidth = 1;
    // Topographic contours (2026-10-06): gently wavy rings like a survey map, instead of a sky grid on the ground.
    ctx.globalAlpha = 0.85;
    for (const [i, el] of [-8, -16, -26, -38, -52, -68].entries()) {
      const pts = [];
      for (let az = 0; az <= 360; az += 3) pts.push(enuFromAzEl(az, el + Math.sin(az * RAD * 3 + i * 1.7) * 1.6 + Math.sin(az * RAD * 7 + i) * 0.7));
      ctx.lineWidth = i % 2 ? 0.75 : 1;
      this.path(pts);
    }
    ctx.globalAlpha = 0.6;
    for (let az = 0; az < 360; az += 90) { // the four cardinal spokes only
      const pts = [];
      for (let el = -4; el >= -88; el -= 4) pts.push(enuFromAzEl(az, el));
      ctx.lineWidth = 1.2;
      this.path(pts);
    }
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1;
    for (let az = 0; az < 360; az += 10) {
      const long = az % 30 === 0;
      this.path([enuFromAzEl(az, -7), enuFromAzEl(az, long ? -13 : -10)]);
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `500 11px ${FONT}`;
    ctx.fillStyle = t.groundText;
    for (let az = 0; az < 360; az += 30) {
      if (az % 90 === 0) continue;
      const p = this.project(enuFromAzEl(az, -16));
      if (this.onScreen(p)) ctx.fillText(`${az}°`, p.x, p.y);
    }
    ctx.font = `800 24px ${FONT}`;
    for (const [az, letter] of [[0, 'N'], [90, 'E'], [180, 'S'], [270, 'W']]) {
      const p = this.project(enuFromAzEl(az, -30));
      if (!this.onScreen(p)) continue;
      ctx.fillStyle = az === 0 ? t.groundNorth : t.groundText;
      ctx.fillText(letter, p.x, p.y);
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
  draw(basis, items, { showDim, sky, bodies, milky, lines = true, targetId = null, time = 0, safeTop = 150, safeBottom = 230, centerY, starLimit = null, naturalTargetName = null, quietTarget = false, below = null, sunEl = -90, ghosts = null, weather = null, newFind = false, rising = null, landscape = false, lockedOn = null, planes = null, planeHit = null, planeTrail = null, naturalTarget = null } = {}) {
    this.basis = basis;
    this.safeTop = Math.max(12, Math.min(safeTop, this.h * 0.45));
    this.safeBottom = Math.max(12, Math.min(safeBottom, this.h - this.safeTop - 100));
    this.cy = Number.isFinite(centerY) ? Math.max(this.safeTop + 20, Math.min(centerY, this.h - this.safeBottom - 20)) : (this.safeTop + this.h - this.safeBottom) / 2;
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
    if ((this.dayF ?? 0) < 0.2) this.drawMilkyWay(milky);
    if (sky && (this.dayF ?? 0) < 0.6) this.drawStars(sky, { lines: lines && this.dayF < 0.2, time: this.reducedMotion ? 0 : time, starLimit });
    if (weather) this.drawWeather(weather, this.reducedMotion ? 0 : time);
    if (bodies) this.drawBodies(bodies);
    if (ghosts?.length) this.drawGhosts(ghosts);
    this.drawGround();
    if (landscape) this.drawLandscape();
    this.drawGroundCompass();
    if (below?.length && this.basis.back[2] < 0.15) this.drawBelow(below);
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
      const size = look.visible || isTarget ? this.iconSize(look.mag, it.obj) * (isTarget ? 1.3 : 1) : 7;
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
    else this.drawReticle(locked, this.reducedMotion ? 0 : time, newFind && locked && !quietTarget, null, quietTarget);
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
      this.drawIcon('plane', 0, 0, hit ? 13 : 10, hit ? t.plane : t.planeDim); // same scale as satellites (9–12, ×1.3 when targeted)
      ctx.restore();
      if (hit) hitAt = { x: p.x, y: p.y };
    }
    return hitAt;
  }

  drawOffscreen(list, targetId) {
    const ctx = this.ctx, t = this.theme;
    const margin = 27, top = this.safeTop + 20, bottom = this.h - this.safeBottom - 22;
    // A selected target stays findable even outside the camera view or when faint.
    const ordered = list.sort((a, b) => Number(b.isTarget) - Number(a.isTarget) || (a.it.look.mag ?? 9) - (b.it.look.mag ?? 9));
    const visible = targetId ? ordered.filter((entry) => entry.isTarget).slice(0, 1) : ordered.slice(0, 2);
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
    const activeInk = plane ? t.plane : t.tick;
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
