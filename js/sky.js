// Canvas renderer for the sky view. Gnomonic (pinhole camera) projection around where the phone points.

import { enuFromAzEl, compassPoint } from './orbit.js';

const RAD = Math.PI / 180;

export const COLORS = {
  bg: '#000',
  grid: 'rgba(255, 70, 50, 0.16)',
  horizon: 'rgba(255, 70, 50, 0.55)',
  ground: 'rgba(40, 6, 4, 0.6)',
  label: 'rgba(255, 110, 90, 0.85)',
  dim: 'rgba(255, 80, 60, 0.28)',
  visible: '#ff6a55',
  hot: '#ffd2c8',
  reticle: 'rgba(255, 90, 70, 0.7)',
  constLine: 'rgba(255, 120, 100, 0.13)',
  constLabel: 'rgba(255, 120, 100, 0.28)',
  starLabel: 'rgba(255, 170, 150, 0.55)',
  body: 'rgba(255, 200, 150, 0.9)',
  planet: 'rgba(255, 200, 140, 0.95)',
  moonLit: 'rgba(255, 225, 210, 0.95)',
  moonDark: 'rgba(60, 20, 16, 0.9)',
  moonEdge: 'rgba(255, 150, 130, 0.35)',
};

export class SkyView {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.fovV = 70; // vertical field of view, degrees
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

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
    this.cy = this.h * 0.42; // reticle sits a bit above centre so the candidate sheet has room
  }

  // Angular radius (degrees) that the reticle circle covers.
  get reticleDeg() { return 9; }
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

  drawGrid() {
    const ctx = this.ctx;
    ctx.lineWidth = 1;
    for (const el of [30, 60]) {
      ctx.strokeStyle = COLORS.grid;
      const pts = [];
      for (let az = 0; az <= 360; az += 3) pts.push(enuFromAzEl(az, el));
      this.path(pts);
    }
    ctx.strokeStyle = COLORS.grid;
    for (let az = 0; az < 360; az += 45) {
      const pts = [];
      for (let el = 0; el <= 90; el += 3) pts.push(enuFromAzEl(az, el));
      this.path(pts);
    }
    // Horizon
    ctx.strokeStyle = COLORS.horizon;
    ctx.lineWidth = 1.5;
    const hz = [];
    for (let az = 0; az <= 360; az += 2) hz.push(enuFromAzEl(az, 0));
    this.path(hz);

    ctx.fillStyle = COLORS.label;
    ctx.font = '600 15px -apple-system, system-ui, sans-serif';
    ctx.textAlign = 'center';
    for (let az = 0; az < 360; az += 45) {
      const p = this.project(enuFromAzEl(az, 2.5));
      if (this.onScreen(p)) ctx.fillText(compassPoint(az), p.x, p.y);
    }
    ctx.font = '11px -apple-system, system-ui, sans-serif';
    for (const el of [30, 60]) {
      const b = this.basis.back;
      const az = (Math.atan2(b[0], b[1]) / RAD + 360) % 360;
      const p = this.project(enuFromAzEl(az, el));
      if (this.onScreen(p)) ctx.fillText(`${el}°`, p.x + 14, p.y - 3);
    }
  }

  dotRadius(mag) {
    if (mag === null) return 2;
    return Math.max(2.5, Math.min(9, 7 - mag * 1.1));
  }

  // Stars, constellation lines and labels. sky: { stars, lines, constellations } with ENU vectors.
  drawStars(sky, { lines }) {
    const ctx = this.ctx;
    if (lines) {
      ctx.strokeStyle = COLORS.constLine;
      ctx.lineWidth = 1;
      for (const seg of sky.lines) this.path(seg, -0.01);
      ctx.fillStyle = COLORS.constLabel;
      ctx.font = '500 11px -apple-system, system-ui, sans-serif';
      ctx.textAlign = 'center';
      for (const c of sky.constellations) {
        if (c.rank > 2 || c.enu[2] < 0) continue;
        const p = this.project(c.enu);
        if (this.onScreen(p)) ctx.fillText(c.name.toUpperCase(), p.x, p.y);
      }
    }
    ctx.font = '11px -apple-system, system-ui, sans-serif';
    ctx.textAlign = 'left';
    for (const s of sky.stars) {
      if (s.enu[2] < -0.02) continue;
      const p = this.project(s.enu);
      if (!this.onScreen(p)) continue;
      const r = Math.max(0.7, 2.6 - 0.42 * s.mag);
      const a = Math.max(0.25, Math.min(1, 0.95 - 0.13 * s.mag));
      ctx.fillStyle = `rgba(255, 215, 205, ${a})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
      if (s.name && s.mag < 1.6) {
        ctx.fillStyle = COLORS.starLabel;
        ctx.fillText(s.name, p.x + r + 4, p.y + 3);
      }
    }
  }

  // Sun, Moon and planets. bodies: [{ name, kind, enu, mag, illum, phaseAngle, phaseName }]
  drawBodies(bodies) {
    const ctx = this.ctx;
    const sun = bodies.find((b) => b.kind === 'sun');
    for (const b of bodies) {
      if (b.enu[2] < -0.02) continue;
      const p = this.project(b.enu);
      if (!this.onScreen(p, 30)) continue;
      ctx.textAlign = 'left';
      if (b.kind === 'moon') {
        const R = 15;
        this.drawMoon(p, R, this.brightLimbAngle(b.enu, sun.enu, p), b.phaseAngle);
        ctx.fillStyle = COLORS.body;
        ctx.font = '600 12px -apple-system, system-ui, sans-serif';
        ctx.fillText('Moon', p.x + R + 6, p.y);
        ctx.fillStyle = COLORS.starLabel;
        ctx.font = '11px -apple-system, system-ui, sans-serif';
        ctx.fillText(`${b.phaseName} · ${Math.round(b.illum * 100)}%`, p.x + R + 6, p.y + 14);
      } else if (b.kind === 'sun') {
        ctx.fillStyle = 'rgba(255, 120, 60, 0.9)';
        ctx.beginPath(); ctx.arc(p.x, p.y, 16, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = COLORS.body;
        ctx.font = '600 12px -apple-system, system-ui, sans-serif';
        ctx.fillText('Sun', p.x + 22, p.y + 4);
      } else {
        const r = Math.max(2.5, Math.min(5.5, 3.2 - 0.6 * b.mag));
        ctx.fillStyle = COLORS.planet;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = COLORS.planet;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(p.x, p.y, r + 3.5, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = COLORS.body;
        ctx.font = '600 12px -apple-system, system-ui, sans-serif';
        ctx.fillText(b.name, p.x + r + 8, p.y + 4);
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
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(brightAngle);
    ctx.fillStyle = COLORS.moonDark;
    ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill();
    const k = Math.cos(phaseAngle * RAD); // 1 = full, 0 = quarter, -1 = new
    ctx.fillStyle = COLORS.moonLit;
    ctx.beginPath();
    // Lit half on the Sun side (+x), closed by the terminator ellipse.
    ctx.arc(0, 0, R, -Math.PI / 2, Math.PI / 2);
    ctx.ellipse(0, 0, Math.abs(k) * R, R, 0, Math.PI / 2, -Math.PI / 2, k < 0);
    ctx.fill();
    ctx.strokeStyle = COLORS.moonEdge;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  // items: [{ obj, look, trail: [{t, az, el}], candidate, selected }]
  draw(basis, items, { showDim, sky, bodies, lines = true }) {
    this.basis = basis;
    const ctx = this.ctx;
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, this.w, this.h);
    if (sky) this.drawStars(sky, { lines });
    this.drawGrid();
    if (bodies) this.drawBodies(bodies);

    const offscreen = [];
    for (const it of items) {
      const { look } = it;
      if (!look.visible && !showDim) continue;
      // Trail: 60 s back (faint), 3 min ahead (dashed)
      if (it.trail?.length && look.visible) {
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = COLORS.dim;
        ctx.setLineDash([]);
        this.path(it.trail.filter((p) => p.t <= 0).map((p) => enuFromAzEl(p.az, p.el)));
        ctx.strokeStyle = it.candidate ? COLORS.visible : COLORS.dim;
        ctx.setLineDash([4, 6]);
        this.path(it.trail.filter((p) => p.t >= 0).map((p) => enuFromAzEl(p.az, p.el)));
        ctx.setLineDash([]);
      }
      const v = enuFromAzEl(look.az, look.el);
      const p = this.project(v);
      if (!this.onScreen(p, 10)) {
        if (look.visible) offscreen.push({ it, c: this.cam(v) });
        continue;
      }
      const r = look.visible ? this.dotRadius(look.mag) : 2;
      if (look.visible) {
        ctx.fillStyle = it.candidate ? 'rgba(255,120,100,0.25)' : 'rgba(255,90,70,0.12)';
        ctx.beginPath(); ctx.arc(p.x, p.y, r * 2.6, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = look.visible ? (it.candidate ? COLORS.hot : COLORS.visible) : COLORS.dim;
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
      if (look.visible) {
        ctx.fillStyle = it.candidate ? COLORS.hot : COLORS.label;
        ctx.font = `${it.candidate ? 600 : 500} 12px -apple-system, system-ui, sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(shortName(it.obj.name), p.x + r + 6, p.y + 4);
      }
    }

    this.drawOffscreen(offscreen);
    this.drawReticle(items.some((it) => it.candidate));
  }

  // Arrows at the screen edge pointing toward visible objects that are out of view.
  drawOffscreen(list) {
    const ctx = this.ctx;
    const margin = 26;
    for (const { it, c } of list.slice(0, 6)) {
      const ang = Math.atan2(-c.y, c.x);
      const dx = Math.cos(ang), dy = Math.sin(ang);
      const sx = dx > 0 ? (this.w - margin - this.cx) / dx : (margin - this.cx) / dx;
      const sy = dy > 0 ? (this.h - margin - this.cy) / dy : (margin - this.cy) / dy;
      const s = Math.min(Math.abs(sx), Math.abs(sy));
      const x = this.cx + dx * s, y = this.cy + dy * s;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang);
      ctx.fillStyle = COLORS.visible;
      ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-6, -7); ctx.lineTo(-6, 7); ctx.closePath(); ctx.fill();
      ctx.restore();
      ctx.fillStyle = COLORS.label;
      ctx.font = '11px -apple-system, system-ui, sans-serif';
      ctx.textAlign = x > this.cx ? 'right' : 'left';
      ctx.fillText(shortName(it.obj.name), x + (x > this.cx ? -14 : 14), y + (y > this.cy ? -12 : 20));
    }
  }

  drawReticle(active) {
    const ctx = this.ctx;
    const r = this.reticlePx;
    ctx.strokeStyle = active ? COLORS.hot : COLORS.reticle;
    ctx.lineWidth = active ? 2.5 : 1.5;
    ctx.beginPath(); ctx.arc(this.cx, this.cy, r, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath();
    for (const [a, b] of [[r + 6, r + 16]]) {
      ctx.moveTo(this.cx - b, this.cy); ctx.lineTo(this.cx - a, this.cy);
      ctx.moveTo(this.cx + a, this.cy); ctx.lineTo(this.cx + b, this.cy);
      ctx.moveTo(this.cx, this.cy - b); ctx.lineTo(this.cx, this.cy - a);
      ctx.moveTo(this.cx, this.cy + a); ctx.lineTo(this.cx, this.cy + b);
    }
    ctx.stroke();
  }
}

export function shortName(name) {
  return name.replace(/\s+/g, ' ').trim();
}
