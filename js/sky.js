// Canvas renderer for the sky view. Gnomonic (pinhole camera) projection around where the phone points.
// Two themes: 'glass' (navy sky, gold satellites, cyan reticle) and 'night' (all red, keeps dark adaptation).

import { enuFromAzEl, compassPoint } from './orbit.js?v=0.1.26';

const RAD = Math.PI / 180;
const FONT = '-apple-system, "SF Pro Text", system-ui, sans-serif';

const THEMES = {
  glass: {
    bgTop: '#10243b', bgBottom: '#040b16',
    milky: [111, 146, 190],
    grid: 'rgba(137, 186, 203, 0.045)',
    horizon: 'rgba(119, 174, 187, 0.30)',
    ground: '#050e17', groundEdge: 'rgba(117, 163, 171, 0.10)',
    label: 'rgba(225, 235, 255, 0.92)', labelDim: 'rgba(200, 215, 255, 0.65)',
    compass: 'rgba(200, 220, 255, 0.75)',
    sat: '#d6bb83', satGlow: [213, 177, 107], satHot: '#f6e5b8',
    dim: 'rgba(170, 190, 230, 0.35)',
    bead: [223, 196, 143], trailPast: 'rgba(223, 196, 143, 0.17)',
    reticle: '#86b9bc', reticleSoft: 'rgba(134, 185, 188, 0.08)', tick: '#dfc48f',
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
    label: 'rgba(255, 110, 90, 0.85)', labelDim: 'rgba(255, 110, 90, 0.55)',
    compass: 'rgba(255, 110, 90, 0.85)',
    sat: '#bb3c32', satGlow: [161, 32, 24], satHot: '#da5140',
    dim: 'rgba(255, 80, 60, 0.28)',
    bead: [255, 106, 85], trailPast: 'rgba(255, 90, 70, 0.2)',
    reticle: 'rgba(194, 50, 35, 0.8)', reticleSoft: 'rgba(194, 50, 35, 0.08)', tick: '#d94f38',
    constLine: 'rgba(255, 120, 100, 0.13)', constLabel: 'rgba(255, 120, 100, 0.3)', constCase: (s) => s.toUpperCase(),
    starRGB: [180, 44, 31], star: (a) => `rgba(180, 44, 31, ${a})`, starLabel: 'rgba(190, 57, 43, 0.55)',
    body: 'rgba(208, 61, 43, 0.9)', planet: 'rgba(218, 67, 45, 0.95)',
    moonLit: 'rgba(193, 50, 35, 0.95)', moonDark: 'rgba(32, 5, 3, 0.9)', moonEdge: 'rgba(163, 37, 26, 0.35)',
    sun: 'rgba(255, 120, 60, 0.9)',
  },
};

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
  drawMilkyWay(milky) {
    if (!milky) return;
    for (const point of milky) {
      if (point.enu[2] < -0.08) continue;
      const p = this.project(point.enu);
      if (!p) continue;
      const radius = Math.min(this.w * 0.85, this.f * Math.tan(9 * RAD) / p.c.z);
      if (!this.onScreen(p, radius)) continue;
      const horizonFade = Math.min(1, Math.max(0, (point.enu[2] + 0.08) / 0.25));
      this.glow(p.x, p.y, radius, this.theme.milky, (0.17 + point.weight * 0.18) * horizonFade);
    }
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

  dotRadius(mag) {
    if (mag == null) return 2;
    return Math.max(2, Math.min(4.6, 3.5 - mag * 0.35));
  }

  // Stars, constellation lines and labels. sky: { stars, lines, constellations } with ENU vectors.
  drawStars(sky, { lines }) {
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
    for (const s of sky.stars) {
      if (s.enu[2] < 0) continue;
      const p = this.project(s.enu);
      if (!this.onScreen(p, 12)) continue;
      const r = Math.max(0.38, Math.min(2.4, 1.9 - 0.27 * s.mag));
      const a = Math.max(0.14, Math.min(1, 0.98 - 0.125 * s.mag));
      if (s.mag < 2.2) this.glow(p.x, p.y, r * (s.mag < 0.6 ? 7 : 4.5), t.starRGB, s.mag < 0.6 ? 0.62 : 0.26);
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
  draw(basis, items, { showDim, sky, bodies, milky, lines = true, targetId = null, time = 0, safeTop = 150, safeBottom = 230, centerY, newFind = false } = {}) {
    this.basis = basis;
    this.safeTop = Math.max(12, Math.min(safeTop, this.h * 0.45));
    this.safeBottom = Math.max(12, Math.min(safeBottom, this.h - this.safeTop - 100));
    this.cy = Number.isFinite(centerY) ? Math.max(this.safeTop + 20, Math.min(centerY, this.h - this.safeBottom - 20)) : (this.safeTop + this.h - this.safeBottom) / 2;
    this.labelQueue = [];
    const ctx = this.ctx, t = this.theme;
    this.drawBackground();
    this.drawMilkyWay(milky);
    if (sky) this.drawStars(sky, { lines });
    if (bodies) this.drawBodies(bodies);
    this.drawGround();
    this.drawGrid();

    const offscreen = [];
    const candidates = items.filter((it) => it.look.visible).sort((a, b) => (Number(b.candidate) - Number(a.candidate)) || (b.angCos ?? 0) - (a.angCos ?? 0));
    const focus = items.find((it) => it.obj.id === targetId) ?? (!targetId ? candidates.find((it) => it.candidate) : null);
    const labelIds = new Set(candidates.filter((it) => it.obj.id !== targetId).slice(0, targetId ? 2 : 4).map((it) => it.obj.id));
    this.targetPos = null;
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
      const radius = look.visible ? this.dotRadius(look.mag) : 2;
      ctx.save();
      if (targetId && !isTarget) ctx.globalAlpha = look.visible ? 0.60 : 0.35;
      if (look.visible || isTarget) this.glow(p.x, p.y, radius * (isTarget ? 6 : 3), t.satGlow, isTarget ? 0.86 : 0.38);
      ctx.fillStyle = look.visible || isTarget ? (isTarget ? t.satHot : t.sat) : t.dim;
      ctx.beginPath(); ctx.arc(p.x, p.y, radius, 0, Math.PI * 2); ctx.fill();
      if (isTarget) {
        ctx.strokeStyle = t.tick;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(p.x, p.y, radius + 7, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();
      if (look.visible && labelIds.has(it.obj.id)) this.queueLabel(it.label ?? shortName(it.obj.name), p, { color: it.candidate ? t.label : t.labelDim, size: 11, weight: it.candidate ? 500 : 400, gap: radius + 8, priority: it.candidate ? 7 : 4 });
    }

    this.drawOffscreen(offscreen, targetId);
    const locked = !!focus && focus.obj.id === targetId && !!focus.candidate;
    this.drawReticle(locked, this.reducedMotion ? 0 : time, newFind && locked);
    this.drawLabels();
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

  drawReticle(locked, time = 0, newFind = false) {
    const ctx = this.ctx, t = this.theme;
    const radius = this.reticlePx, cx = this.cx, cy = this.cy;
    ctx.save();
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
