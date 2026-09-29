// Canvas renderer for the sky view. Gnomonic (pinhole camera) projection around where the phone points.
// Two themes: 'glass' (navy sky, gold satellites, cyan reticle) and 'night' (all red, keeps dark adaptation).

import { enuFromAzEl, compassPoint } from './orbit.js?v=0.1.15';

const RAD = Math.PI / 180;
const FONT = '-apple-system, "SF Pro Text", system-ui, sans-serif';

const THEMES = {
  glass: {
    bgTop: '#0b1a3d', bgBottom: '#050a18',
    milky: [180, 195, 255],
    grid: 'rgba(130, 170, 255, 0.07)',
    horizon: 'rgba(120, 200, 255, 0.35)',
    ground: '#03060e', groundEdge: 'rgba(90, 150, 255, 0.10)',
    label: 'rgba(225, 235, 255, 0.92)', labelDim: 'rgba(200, 215, 255, 0.65)',
    compass: 'rgba(200, 220, 255, 0.75)',
    sat: '#ffc94a', satGlow: 'rgba(255, 200, 80, 0.20)', satHot: '#fff4cc',
    dim: 'rgba(170, 190, 230, 0.35)',
    bead: [255, 205, 90], trailPast: 'rgba(255, 205, 90, 0.18)',
    reticle: '#5fd4ff', reticleSoft: 'rgba(95, 212, 255, 0.25)', tick: '#ffc94a', sparkle: '#ffe08a',
    constLine: 'rgba(120, 170, 255, 0.30)', constLabel: 'rgba(205, 220, 255, 0.72)', constCase: (s) => s,
    star: (a) => `rgba(228, 236, 255, ${a})`, starLabel: 'rgba(200, 215, 255, 0.6)',
    body: 'rgba(240, 244, 255, 0.95)', planet: '#ffffff',
    moonLit: '#f4f1e8', moonDark: 'rgba(28, 38, 70, 0.95)', moonEdge: 'rgba(200, 220, 255, 0.35)',
    sun: 'rgba(255, 210, 120, 0.95)',
    trees: true,
  },
  night: {
    bgTop: '#000', bgBottom: '#000',
    milky: [255, 70, 50],
    grid: 'rgba(255, 70, 50, 0.14)',
    horizon: 'rgba(255, 70, 50, 0.55)',
    ground: '#0a0100', groundEdge: 'rgba(255, 70, 50, 0.08)',
    label: 'rgba(255, 110, 90, 0.85)', labelDim: 'rgba(255, 110, 90, 0.55)',
    compass: 'rgba(255, 110, 90, 0.85)',
    sat: '#ff6a55', satGlow: 'rgba(255, 90, 70, 0.14)', satHot: '#ffd2c8',
    dim: 'rgba(255, 80, 60, 0.28)',
    bead: [255, 106, 85], trailPast: 'rgba(255, 90, 70, 0.2)',
    reticle: 'rgba(255, 90, 70, 0.8)', reticleSoft: 'rgba(255, 90, 70, 0.2)', tick: '#ff8a70', sparkle: '#ffb3a3',
    constLine: 'rgba(255, 120, 100, 0.13)', constLabel: 'rgba(255, 120, 100, 0.3)', constCase: (s) => s.toUpperCase(),
    star: (a) => `rgba(255, 215, 205, ${a})`, starLabel: 'rgba(255, 170, 150, 0.55)',
    body: 'rgba(255, 200, 150, 0.9)', planet: 'rgba(255, 200, 140, 0.95)',
    moonLit: 'rgba(255, 225, 210, 0.95)', moonDark: 'rgba(60, 20, 16, 0.9)', moonEdge: 'rgba(255, 150, 130, 0.35)',
    sun: 'rgba(255, 120, 60, 0.9)',
    trees: true,
  },
};

// Seeded tree line along the horizon: [az, height°, width°]
const TREES = (() => {
  let s = 12345;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const out = [];
  for (let az = 0; az < 360; az += 0.8 + r() * 1.6) {
    if (r() < 0.12) { az += 4 + r() * 10; continue; } // clearings
    out.push([az, 1.2 + r() ** 1.5 * 4.2, 0.9 + r() * 1.3]);
  }
  return out;
})();

export class SkyView {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.fovV = 70; // vertical field of view, degrees
    this.theme = THEMES.glass;
    this.targetPos = null;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  setTheme(name) { this.theme = THEMES[name] ?? THEMES.glass; }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.canvas.width = Math.round(this.w * dpr);
    this.canvas.height = Math.round(this.h * dpr);
    this.canvas.style.width = `${this.w}px`;
    this.canvas.style.height = `${this.h}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.f = (this.h / 2) / Math.tan((this.fovV / 2) * RAD);
    this.cx = this.w / 2;
    this.cy = this.h * 0.40; // reticle sits above centre so the target card has room
  }

  // Angular radius (degrees) that the reticle circle covers.
  get reticleDeg() { return 8; }
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

  drawBackground() {
    const ctx = this.ctx, t = this.theme;
    // Deep overhead, a touch lighter toward the bottom of the screen (usually the horizon).
    const g = ctx.createLinearGradient(0, 0, 0, this.h);
    g.addColorStop(0, t.bgBottom);
    g.addColorStop(1, t.bgTop);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.w, this.h);
  }

  // Soft glow along the real Milky Way. milky: [{ enu, weight }]
  drawMilkyWay(milky) {
    if (!milky) return;
    const ctx = this.ctx, [r, g, b] = this.theme.milky;
    ctx.lineCap = 'round';
    for (const [width, alpha] of [[150, 0.018], [90, 0.028], [45, 0.04], [18, 0.05]]) {
      ctx.lineWidth = width;
      for (let i = 0; i < milky.length - 1; i++) {
        const a = milky[i], c = milky[i + 1];
        if (a.enu[2] < -0.3 && c.enu[2] < -0.3) continue;
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha * a.weight})`;
        this.path([a.enu, c.enu]);
      }
    }
    ctx.lineCap = 'butt';
  }

  drawGround() {
    const ctx = this.ctx, t = this.theme;
    ctx.fillStyle = t.ground;
    for (let az = 0; az < 360; az += 6) {
      for (const [e0, e1] of [[0.2, -8], [-8, -25], [-25, -50], [-50, -89]]) this.poly([[az, e0], [az + 6.2, e0], [az + 6.2, e1], [az, e1]]);
    }
    if (t.trees) {
      for (const [az, h, w] of TREES) {
        // Two stacked triangles make a pine
        this.poly([[az - w / 2, 0.1], [az + w / 2, 0.1], [az, h * 0.7]]);
        this.poly([[az - w * 0.35, h * 0.4], [az + w * 0.35, h * 0.4], [az, h]]);
      }
    }
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
      if (this.onScreen(p)) ctx.fillText(compassPoint(az), p.x, p.y);
    }
  }

  dotRadius(mag) {
    if (mag == null) return 2;
    return Math.max(2.4, Math.min(8, 6.5 - mag * 1.0));
  }

  // Stars, constellation lines and labels. sky: { stars, lines, constellations } with ENU vectors.
  drawStars(sky, { lines }) {
    const ctx = this.ctx, t = this.theme;
    if (lines) {
      ctx.strokeStyle = t.constLine;
      ctx.lineWidth = 1;
      for (const seg of sky.lines) this.path(seg, 0.01);
      ctx.fillStyle = t.constLabel;
      ctx.font = `500 13px ${FONT}`;
      ctx.textAlign = 'center';
      for (const c of sky.constellations) {
        if (c.rank > 2 || c.enu[2] < 0.05) continue;
        const p = this.project(c.enu);
        if (this.onScreen(p)) ctx.fillText(t.constCase(c.name), p.x, p.y);
      }
    }
    ctx.font = `11px ${FONT}`;
    ctx.textAlign = 'left';
    for (const s of sky.stars) {
      if (s.enu[2] < 0) continue;
      const p = this.project(s.enu);
      if (!this.onScreen(p)) continue;
      const r = Math.max(0.6, 2.5 - 0.42 * s.mag);
      const a = Math.max(0.22, Math.min(1, 0.95 - 0.13 * s.mag));
      ctx.fillStyle = t.star(a);
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
      if (s.mag < 0.6) { // a little glow on the very brightest
        ctx.fillStyle = t.star(0.12);
        ctx.beginPath(); ctx.arc(p.x, p.y, r * 3, 0, Math.PI * 2); ctx.fill();
      }
      if (s.name && s.mag < 1.6) {
        ctx.fillStyle = t.starLabel;
        ctx.fillText(s.name, p.x + r + 4, p.y + 3);
      }
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
      ctx.textAlign = 'left';
      if (b.kind === 'moon') {
        const R = 15;
        ctx.fillStyle = t.star(0.08);
        ctx.beginPath(); ctx.arc(p.x, p.y, R * 2.2, 0, Math.PI * 2); ctx.fill();
        this.drawMoon(p, R, this.brightLimbAngle(b.enu, sun.enu, p), b.phaseAngle);
        ctx.fillStyle = t.body;
        ctx.font = `600 13px ${FONT}`;
        ctx.fillText('Moon', p.x + R + 8, p.y);
        ctx.fillStyle = t.starLabel;
        ctx.font = `11px ${FONT}`;
        ctx.fillText(`${b.phaseName} · ${Math.round(b.illum * 100)}%`, p.x + R + 8, p.y + 14);
      } else if (b.kind === 'sun') {
        ctx.fillStyle = t.sun;
        ctx.beginPath(); ctx.arc(p.x, p.y, 16, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = t.body;
        ctx.font = `600 13px ${FONT}`;
        ctx.fillText('Sun', p.x + 24, p.y + 4);
      } else {
        const r = Math.max(2.8, Math.min(6, 3.4 - 0.6 * b.mag));
        ctx.fillStyle = t.star(0.14);
        ctx.beginPath(); ctx.arc(p.x, p.y, r * 2.6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = t.planet;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = t.body;
        ctx.font = `500 14px ${FONT}`;
        ctx.fillText(b.name, p.x + r + 10, p.y + 5);
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

  // Predicted path as a string of beads that fade with time; recent past as a faint line.
  drawTrail(trail, hot) {
    const ctx = this.ctx, t = this.theme, [r, g, b] = t.bead;
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = t.trailPast;
    this.path(trail.filter((p) => p.t <= 0).map((p) => enuFromAzEl(p.az, p.el)));
    const fut = trail.filter((p) => p.t >= -10 && p.el > -1);
    let prev = null, carry = 0;
    const spacing = hot ? 14 : 18;
    for (const pt of fut) {
      const p = this.project(enuFromAzEl(pt.az, pt.el));
      if (!p || Math.abs(p.x) > 1e4 || Math.abs(p.y) > 1e4) { prev = null; continue; }
      if (prev) {
        const dx = p.x - prev.x, dy = p.y - prev.y, len = Math.hypot(dx, dy);
        let d = spacing - carry;
        while (d <= len) {
          const u = d / len, tt = prev.t + (pt.t - prev.t) * u;
          const fade = Math.max(0.15, 1 - tt / 180);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${(hot ? 0.95 : 0.5) * fade})`;
          ctx.beginPath(); ctx.arc(prev.x + dx * u, prev.y + dy * u, hot ? 2.4 : 1.6, 0, Math.PI * 2); ctx.fill();
          d += spacing;
        }
        carry = len - (d - spacing);
      }
      prev = { x: p.x, y: p.y, t: pt.t };
    }
  }

  // items: [{ obj, label, look, trail, candidate, angCos }]. targetId: the selected capture target.
  draw(basis, items, { showDim, sky, bodies, milky, lines = true, targetId = null, time = 0 }) {
    this.basis = basis;
    const ctx = this.ctx, t = this.theme;
    this.drawBackground();
    this.drawMilkyWay(milky);
    if (sky) this.drawStars(sky, { lines });
    this.drawGrid();
    if (bodies) this.drawBodies(bodies);

    const offscreen = [];
    // Label only what matters: the target, bright objects, and a few nearest the reticle.
    const labelIds = new Set(items
      .filter((it) => it.look.visible)
      .sort((a, b) => (b.candidate - a.candidate) || (b.angCos ?? 0) - (a.angCos ?? 0))
      .filter((it, i) => it.candidate || it.look.mag < 1 || i < 5)
      .map((it) => it.obj.id));
    this.targetPos = null;
    for (const it of items) {
      const { look } = it;
      if (!look.visible && !showDim) continue;
      const isTarget = it.obj.id === targetId;
      if (it.trail?.length && look.visible) this.drawTrail(it.trail, isTarget || it.candidate);
      const v = enuFromAzEl(look.az, look.el);
      const p = this.project(v);
      if (!this.onScreen(p, 10)) {
        if (look.visible) offscreen.push({ it, c: this.cam(v) });
        continue;
      }
      if (isTarget) this.targetPos = { x: p.x, y: p.y };
      const r = look.visible ? this.dotRadius(look.mag) : 2;
      if (look.visible) {
        ctx.fillStyle = isTarget ? 'rgba(255, 230, 150, 0.35)' : t.satGlow;
        ctx.beginPath(); ctx.arc(p.x, p.y, r * (isTarget ? 3.6 : 2.6), 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = look.visible ? (isTarget || it.candidate ? t.satHot : t.sat) : t.dim;
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
      if (look.visible && labelIds.has(it.obj.id) && !isTarget) {
        ctx.fillStyle = it.candidate ? t.label : t.labelDim;
        ctx.font = `${it.candidate ? 600 : 500} 12px ${FONT}`;
        ctx.textAlign = 'left';
        ctx.fillText(it.label ?? shortName(it.obj.name), p.x + r + 7, p.y + 4);
      }
    }

    this.drawOffscreen(offscreen);
    this.drawReticle(!!targetId, time);
  }

  // Arrows at the screen edge pointing toward the brightest visible objects out of view.
  drawOffscreen(list) {
    const ctx = this.ctx, t = this.theme;
    const margin = 28, top = 120, bottom = this.h - 230;
    list.sort((a, b) => (a.it.look.mag ?? 9) - (b.it.look.mag ?? 9));
    for (const { it, c } of list.slice(0, 3)) {
      const ang = Math.atan2(-c.y, c.x);
      const dx = Math.cos(ang), dy = Math.sin(ang);
      const sx = dx > 0 ? (this.w - margin - this.cx) / dx : (margin - this.cx) / dx;
      const sy = dy > 0 ? (bottom - this.cy) / dy : (top - this.cy) / dy;
      const s = Math.min(Math.abs(sx), Math.abs(sy));
      const x = this.cx + dx * s, y = this.cy + dy * s;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang);
      ctx.fillStyle = t.sat;
      ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-6, -7); ctx.lineTo(-3, 0); ctx.lineTo(-6, 7); ctx.closePath(); ctx.fill();
      ctx.restore();
      ctx.fillStyle = t.labelDim;
      ctx.font = `11px ${FONT}`;
      ctx.textAlign = x > this.cx ? 'right' : 'left';
      ctx.fillText(it.label ?? shortName(it.obj.name), x + (x > this.cx ? -14 : 14), y + (y > this.cy ? -12 : 20));
    }
  }

  sparkle(x, y, s, color) {
    const ctx = this.ctx;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y - s); ctx.quadraticCurveTo(x, y, x + s, y); ctx.quadraticCurveTo(x, y, x, y + s);
    ctx.quadraticCurveTo(x, y, x - s, y); ctx.quadraticCurveTo(x, y, x, y - s);
    ctx.fill();
  }

  drawReticle(locked, time) {
    const ctx = this.ctx, t = this.theme;
    const r = this.reticlePx, cx = this.cx, cy = this.cy;
    // Soft outer halo, then the ring
    ctx.strokeStyle = t.reticleSoft;
    ctx.lineWidth = locked ? 10 : 6;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = t.reticle;
    ctx.lineWidth = locked ? 3 : 2;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    // Gold ticks crossing the ring at N/E/S/W
    ctx.strokeStyle = t.tick;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (const a of [0, 90, 180, 270]) {
      const c = Math.cos(a * RAD), s = Math.sin(a * RAD);
      ctx.moveTo(cx + c * (r - 9), cy + s * (r - 9));
      ctx.lineTo(cx + c * (r + 9), cy + s * (r + 9));
    }
    ctx.stroke();
    ctx.lineCap = 'butt';
    if (locked) {
      const spin = time / 1400;
      [[0.6, 9], [2.2, 6], [3.7, 8], [5.1, 5]].forEach(([a, size], i) => {
        const ang = a + spin, pulse = 0.75 + 0.25 * Math.sin(time / 250 + i);
        this.sparkle(cx + Math.cos(ang) * (r + 22), cy + Math.sin(ang) * (r + 22), size * pulse, t.sparkle);
      });
    }
  }
}

export function shortName(name) {
  return name.replace(/\s+/g, ' ').trim();
}
