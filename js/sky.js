// Canvas renderer for the sky view. Gnomonic (pinhole camera) projection around where the phone points.
// Two themes: 'glass' (navy sky, gold satellites, cyan reticle) and 'night' (all red, keeps dark adaptation).

import { enuFromAzEl, compassPoint } from './orbit.js?v=0.1.73';
import { TIER_INFO } from './rarity.js?v=0.1.73';

const RAD = Math.PI / 180;
const FONT = '-apple-system, "SF Pro Text", system-ui, sans-serif';

const THEMES = {
  glass: {
    bgTop: '#10243b', bgBottom: '#040b16',
    milky: [111, 146, 190],
    grid: 'rgba(137, 186, 203, 0.045)',
    horizon: 'rgba(119, 174, 187, 0.30)',
    ground: '#050e17', groundEdge: 'rgba(117, 163, 171, 0.10)',
    hills: '#0e2031', haze: 'rgb(120, 150, 185)',
    groundInk: 'rgba(143, 211, 232, 0.16)', groundText: 'rgba(190, 225, 235, 0.42)', groundNorth: 'rgba(230, 198, 138, 0.75)', ghost: 'rgba(255, 214, 140, 0.95)', ghostText: 'rgba(160, 222, 240, 0.95)', ghostPill: 'rgba(5, 12, 24, 0.85)',
    label: 'rgba(225, 235, 255, 0.92)', labelDim: 'rgba(200, 215, 255, 0.65)',
    compass: 'rgba(200, 220, 255, 0.75)',
    sat: '#d6bb83', satGlow: [213, 177, 107], satHot: '#f6e5b8',
    dim: 'rgba(170, 190, 230, 0.35)',
    bead: [223, 196, 143], trailPast: 'rgba(223, 196, 143, 0.17)',
    reticle: '#86b9bc', reticleSoft: 'rgba(134, 185, 188, 0.08)', tick: '#dfc48f', plane: '#ff5a4e', planeDim: '#ff8a80',
    constLine: 'rgba(129, 170, 199, 0.19)', constLabel: 'rgba(185, 211, 223, 0.58)', constCase: (s) => s,
    starRGB: [215, 231, 245], star: (a) => `rgba(215, 231, 245, ${a})`, starLabel: 'rgba(177, 201, 216, 0.54)',
    body: 'rgba(240, 244, 255, 0.95)', planet: '#ffffff',
    moonLit: '#f4f1e8', moonDark: 'rgba(28, 38, 70, 0.95)', moonEdge: 'rgba(200, 220, 255, 0.35)',
    sun: 'rgba(255, 210, 120, 0.95)',
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

  queueLabel(text, p, { color = this.theme.labelDim, size = 11, weight = 400, gap = 9, priority = 0, align = 'auto' } = {}) {
    if (!text || !this.inSky(p)) return;
    // Keep the area around a new find clear so its name and "tap to collect" are easy to read.
    const z = this.clearZone;
    if (z && p.x > z.left && p.x < z.right && p.y > z.top && p.y < z.bottom) return;
    this.labelQueue.push({ text, p, color, size, weight, gap, priority, align });
  }

  drawLabels() {
    const ctx = this.ctx;
    const r = this.reticlePx;
    const occupied = [{ x: this.cx - r - 5, y: this.cy - r - 5, w: 2 * r + 10, h: 2 * r + 10 }];
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
      for (const [x, y] of candidates) {
        const box = { x: x - 4, y: y - 3, w: width + 8, h: size + 7 };
        if (!this.inSky({ x: box.x, y: box.y }) || !this.inSky({ x: box.x + box.w, y: box.y + box.h })) continue;
        if (occupied.some((other) => overlaps(box, other))) continue;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillStyle = color;
        ctx.fillText(text, x, y);
        occupied.push(box);
        break;
      }
    }
    ctx.textBaseline = 'alphabetic';
  }

  drawBackground() {
    const ctx = this.ctx, t = this.theme;
    const g = ctx.createLinearGradient(0, 0, 0, this.h);
    g.addColorStop(0, t.bgBottom);
    g.addColorStop(1, t.bgTop);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.w, this.h);
    // Soft atmospheric light, not decorative stars. All star positions come from the catalog.
    this.glow(this.cx, this.cy, Math.max(this.w, this.h) * 0.72, t.milky, 0.09);
  }

  // Each glow follows a supplied point on the true galactic equator.
  // milky: { spine: [{enu, width°, bright}], specks: [{enu, a, s}], rift: [{enu, w°}] }
  drawMilkyWay(milky) {
    if (!milky?.spine) return;
    const ctx = this.ctx, [r, g, b] = this.theme.milky;
    const pxPerDeg = this.f * RAD;
    const fade = (enu) => Math.max(0, Math.min(1, (enu[2] + 0.02) / 0.2)); // melt into the horizon
    ctx.save();
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
    ctx.fillStyle = this.theme.ground;
    ctx.beginPath();
    ground.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
    ctx.closePath();
    ctx.fill();
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
      ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x - w / 2, top, w, h, 9); else ctx.rect(x - w / 2, top, w, h); ctx.fill();
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
      this.queueLabel(compassPoint(az), p, { color: t.compass, size: 11, weight: 600, priority: 5, align: 'center' });
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
      // Points along +x (the caller rotates it to the direction of travel).
      rect(-0.9, -0.1, 1.8, 0.2);                     // fuselage
      ctx.beginPath(); ctx.moveTo(0.25 * u, 0); ctx.lineTo(-0.2 * u, -0.95 * u); ctx.lineTo(-0.42 * u, -0.95 * u); ctx.lineTo(-0.2 * u, 0);
      ctx.lineTo(-0.42 * u, 0.95 * u); ctx.lineTo(-0.2 * u, 0.95 * u); ctx.closePath(); ctx.fill(); // wings
      ctx.beginPath(); ctx.moveTo(-0.62 * u, 0); ctx.lineTo(-0.85 * u, -0.4 * u); ctx.lineTo(-0.98 * u, -0.4 * u); ctx.lineTo(-0.9 * u, 0);
      ctx.lineTo(-0.98 * u, 0.4 * u); ctx.lineTo(-0.85 * u, 0.4 * u); ctx.closePath(); ctx.fill(); // tail
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
  drawStars(sky, { lines, time = 0 }) {
    const ctx = this.ctx, t = this.theme;
    if (lines) {
      ctx.strokeStyle = t.constLine;
      ctx.lineWidth = 0.75;
      for (const seg of sky.lines) this.path(seg, 0.01);
      for (const c of sky.constellations) {
        if (c.rank > 2 || c.enu[2] < 0.05) continue;
        this.queueLabel(t.constCase(c.name), this.project(c.enu), { color: t.constLabel, size: 11, weight: 400, priority: 2, align: 'center' });
      }
    }
    // Stars towards the edges of the screen twinkle, ever so slightly; the middle, where you're aiming,
    // stays still. Each star gets its own slow, irregular rhythm (two sines, per-star phase and speed).
    const sec = time / 1000, hw = this.w / 2, hh = this.h / 2;
    for (let i = 0; i < sky.stars.length; i++) {
      const s = sky.stars[i];
      if (s.enu[2] < 0) continue;
      const p = this.project(s.enu);
      if (!this.onScreen(p, 12)) continue;
      const r = Math.max(0.38, Math.min(2.4, 1.9 - 0.27 * s.mag));
      let a = Math.max(0.14, Math.min(1, 0.98 - 0.125 * s.mag)), tw = 1;
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
      if (s.mag < 2.2) this.glow(p.x, p.y, r * (s.mag < 0.6 ? 7 : 4.5), t.starRGB, (s.mag < 0.6 ? 0.62 : 0.26) * (0.4 + 0.6 * tw));
      ctx.fillStyle = t.star(a);
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
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
        this.glow(p.x, p.y, 42, t.starRGB, 0.38);
        this.drawMoon(p, radius, sun ? this.brightLimbAngle(b.enu, sun.enu, p) : 0, b.phaseAngle);
        this.queueLabel('Moon', p, { color: t.body, size: 12, weight: 500, gap: radius + 10, priority: 8 });
      } else if (b.kind === 'sun') {
        this.glow(p.x, p.y, 70, t.satGlow, 0.55);
        ctx.fillStyle = t.sun;
        ctx.beginPath(); ctx.arc(p.x, p.y, 12, 0, Math.PI * 2); ctx.fill();
        this.queueLabel('Sun', p, { color: t.body, size: 12, gap: 22, priority: 8 });
      } else {
        const radius = Math.max(2.5, Math.min(4.8, 3.0 - 0.4 * b.mag));
        this.glow(p.x, p.y, radius * 6, t.starRGB, 0.75);
        ctx.fillStyle = t.planet;
        ctx.beginPath(); ctx.arc(p.x, p.y, radius, 0, Math.PI * 2); ctx.fill();
        this.queueLabel(b.name, p, { color: t.body, size: 12, weight: 500, gap: radius + 10, priority: 8 });
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
    ctx.setLineDash([2, 9]);
    ctx.lineCap = 'round';
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${hot ? 0.60 : 0.26})`;
    this.path(future.map((p) => enuFromAzEl(p.az, p.el)), 0);
    ctx.restore();
  }

  // safeTop/safeBottom are HUD insets in CSS pixels; centerY is an optional pixel
  // override. Projection and the reticle always share the same cx/cy.
  draw(basis, items, { showDim, sky, bodies, milky, lines = true, targetId = null, time = 0, safeTop = 150, safeBottom = 230, centerY, newFind = false, rising = null, landscape = false, lockedOn = null, planes = null, planeHit = null, naturalTarget = null } = {}) {
    this.basis = basis;
    this.safeTop = Math.max(12, Math.min(safeTop, this.h * 0.45));
    this.safeBottom = Math.max(12, Math.min(safeBottom, this.h - this.safeTop - 100));
    this.cy = Number.isFinite(centerY) ? Math.max(this.safeTop + 20, Math.min(centerY, this.h - this.safeBottom - 20)) : (this.safeTop + this.h - this.safeBottom) / 2;
    this.labelQueue = [];
    const r = this.reticlePx;
    const rc = this.ring ?? { x: this.cx, y: this.cy };
    this.clearZone = newFind || planeHit ? { left: rc.x - 170, right: rc.x + 170, top: rc.y - r - 90, bottom: rc.y + r + 60 } : null;
    const ctx = this.ctx, t = this.theme;
    this.drawBackground();
    this.drawMilkyWay(milky);
    if (sky) this.drawStars(sky, { lines, time: this.reducedMotion ? 0 : time });
    if (bodies) this.drawBodies(bodies);
    this.drawGround();
    if (landscape) this.drawLandscape();
    this.drawGroundCompass();
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
      if (look.visible || isTarget) this.glow(p.x, p.y, radius * (isTarget ? 3.6 : 1.8), t.satGlow, isTarget ? 0.86 : 0.32);
      // Locked on: the object takes its rarity colour (matching its label); Common stays gold.
      const tierColor = isTarget && this.theme !== THEMES.night && it.obj.tier && it.obj.tier !== 'common' ? TIER_INFO[it.obj.tier]?.color : null;
      this.drawIcon(this.iconKind(it.obj), p.x, p.y, size, look.visible || isTarget ? (tierColor ?? (isTarget ? t.satHot : t.sat)) : t.dim);
      if (isTarget) {
        ctx.strokeStyle = t.tick;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(p.x, p.y, radius + 7, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();
      if (look.visible && labelIds.has(it.obj.id)) this.queueLabel(it.label ?? shortName(it.obj.name), p, { color: it.candidate ? t.label : t.labelDim, size: 11, weight: it.candidate ? 500 : 400, gap: radius + 8, priority: it.candidate ? 7 : 4 });
    }

    // Moon, planet or star as the target: the sky already draws it, so just mark it and let the ring lock on.
    if (naturalTarget) {
      const p = this.project(naturalTarget);
      if (p && this.onScreen(p, 10)) {
        this.targetPos = { x: p.x, y: p.y };
        ctx.save(); ctx.strokeStyle = t.tick; ctx.lineWidth = 1; ctx.globalAlpha = 0.8;
        ctx.beginPath(); ctx.arc(p.x, p.y, 15, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      }
    }
    const planeAt = this.drawPlanes(planes, planeHit);
    this.drawOffscreen(offscreen, targetId);
    // The app decides what counts as locked on, so the ring, labels and tap area always agree.
    const locked = lockedOn ?? (!!focus && focus.obj.id === targetId && !!focus.candidate);
    if (planeAt && !locked) this.drawReticle(true, 0, false, planeAt);
    else this.drawReticle(locked, this.reducedMotion ? 0 : time, newFind && locked);
    this.drawLabels();
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
      this.drawIcon('plane', 0, 0, hit ? 17 : 12, hit ? t.plane : t.planeDim);
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
      ctx.strokeStyle = isTarget ? t.tick : t.labelDim;
      ctx.lineWidth = isTarget ? 2 : 1.3;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(-4, -5); ctx.lineTo(2, 0); ctx.lineTo(-4, 5); ctx.stroke();
      ctx.restore();
      this.queueLabel(it.label ?? shortName(it.obj.name), { x: x - dx * 14, y: y - dy * 14 }, { color: isTarget ? t.label : t.labelDim, size: 11, weight: isTarget ? 500 : 400, gap: 10, priority: isTarget ? 10 : 3 });
    }
  }

  // The ring you aim with. When it locks on, it shrinks a little and glides onto the object, then
  // eases back when the lock is released. this.ring is what's drawn (the tap area follows it).
  updateRing(locked, at = this.targetPos) {
    const want = locked && at
      ? { x: at.x, y: at.y, r: this.reticlePx * 0.8 }
      : { x: this.cx, y: this.cy, r: this.reticlePx };
    const now = performance.now(), dt = Math.min(0.1, (now - (this._ringT ?? now)) / 1000);
    this._ringT = now;
    const k = this.reducedMotion ? 1 : 1 - Math.exp(-dt * (locked ? 14 : 9)); // snappy lock, softer release
    this.ring ??= { ...want };
    for (const key of ['x', 'y', 'r']) this.ring[key] += (want[key] - this.ring[key]) * k;
    return this.ring;
  }

  drawReticle(locked, time = 0, newFind = false, plane = null) {
    const ctx = this.ctx, t = this.theme;
    const { r: radius, x: cx, y: cy } = this.updateRing(locked, plane ?? this.targetPos);
    ctx.save();
    if (plane) {
      // Lined up a plane, not a satellite: the ring turns solid red.
      ctx.strokeStyle = t.plane; ctx.globalAlpha = 0.16; ctx.lineWidth = 12;
      ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 0.95; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
      return;
    }
    if (newFind) {
      // Never-seen object lined up: the whole ring glows gold and gently breathes. Tap it to collect.
      const pulse = 0.75 + 0.25 * Math.sin(time / 400);
      ctx.strokeStyle = t.tick; ctx.globalAlpha = 0.18 * pulse; ctx.lineWidth = 14;
      ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 0.95; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
      return;
    }
    ctx.strokeStyle = t.reticleSoft;
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = locked ? t.tick : t.reticle;
    ctx.lineWidth = locked ? 1.5 : 1;
    ctx.lineCap = 'round';
    for (const angle of [0, 90, 180, 270]) {
      ctx.beginPath(); ctx.arc(cx, cy, radius, (angle + 12) * RAD, (angle + 78) * RAD); ctx.stroke();
    }
    ctx.globalAlpha = 0.65;
    ctx.beginPath();
    ctx.moveTo(cx - 3, cy); ctx.lineTo(cx + 3, cy);
    ctx.moveTo(cx, cy - 3); ctx.lineTo(cx, cy + 3);
    ctx.stroke();
    ctx.restore();
  }

}

export function shortName(name) {
  return name.replace(/\s+/g, ' ').trim();
}
