// Procedural SVG art for cards: starfield, Earth limb, orbit ring and a silhouette of the object.
// Deterministic per NORAD id, so every card always looks the same.

import { ownerColors } from './facts.js';
import { TIER_INFO } from './rarity.js';

function rng(seed) {
  let s = seed * 2654435761 >>> 0 || 1;
  return () => ((s = (s ^= s << 13, s ^= s >>> 17, s ^= s << 5) >>> 0) / 4294967296);
}

export function cardArt(o, { silhouette = false } = {}) {
  const r = rng(o.id);
  const uid = `a${o.id}${silhouette ? 's' : ''}`;
  const tier = TIER_INFO[o.tier]?.color ?? '#9aa4b1';
  const flag = ownerColors(o.owner);

  let stars = '';
  for (let i = 0; i < 70; i++) {
    const x = (r() * 300).toFixed(1), y = (r() * 200).toFixed(1);
    const rad = (r() ** 3 * 1.4 + 0.3).toFixed(2);
    stars += `<circle cx="${x}" cy="${y}" r="${rad}" fill="#fff" opacity="${(0.3 + r() * 0.7).toFixed(2)}"/>`;
  }

  // Orbit ring tilted by inclination (purely illustrative).
  const incl = o.incl ?? 50;
  const tilt = -(incl > 90 ? 180 - incl : incl) * 0.35 - 4;
  const ry = 16 + (incl % 90) / 90 * 22;
  const orbit = `
    <ellipse cx="150" cy="128" rx="150" ry="${ry.toFixed(1)}" transform="rotate(${tilt.toFixed(1)} 150 128)"
      fill="none" stroke="${tier}" stroke-opacity="0.55" stroke-width="1.2" stroke-dasharray="3 5"/>`;

  const angle = (r() * 50 - 25).toFixed(1);
  const body = silhouette ? silhouetteOf(o, uid, r, flag, true) : silhouetteOf(o, uid, r, flag, false);

  return `
<svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" class="art">
  <defs>
    <radialGradient id="${uid}bg" cx="${30 + r() * 40}%" cy="30%" r="90%">
      <stop offset="0" stop-color="${mix(tier, '#0b1020', 0.72)}"/>
      <stop offset="0.55" stop-color="#070a16"/>
      <stop offset="1" stop-color="#02030a"/>
    </radialGradient>
    <radialGradient id="${uid}earth" cx="50%" cy="0%" r="100%">
      <stop offset="0" stop-color="#3d7fd6"/>
      <stop offset="0.25" stop-color="#1c4a8f"/>
      <stop offset="1" stop-color="#06142e"/>
    </radialGradient>
    <linearGradient id="${uid}metal" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f4f6fa"/>
      <stop offset="0.45" stop-color="#b9c0cc"/>
      <stop offset="1" stop-color="#5b6372"/>
    </linearGradient>
    <linearGradient id="${uid}foil" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffe7a3"/>
      <stop offset="0.5" stop-color="#d6a640"/>
      <stop offset="1" stop-color="#8a5f17"/>
    </linearGradient>
    <linearGradient id="${uid}panel" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#4c7fd8"/>
      <stop offset="0.5" stop-color="#1d3f86"/>
      <stop offset="1" stop-color="#0c1d45"/>
    </linearGradient>
    <pattern id="${uid}grid" width="7" height="7" patternUnits="userSpaceOnUse">
      <path d="M7 0H0V7" fill="none" stroke="#9cc0ff" stroke-opacity="0.35" stroke-width="0.6"/>
    </pattern>
  </defs>
  <rect width="300" height="200" fill="url(#${uid}bg)"/>
  ${stars}
  <circle cx="150" cy="470" r="330" fill="url(#${uid}earth)"/>
  <circle cx="150" cy="470" r="330" fill="none" stroke="#8fd0ff" stroke-opacity="0.55" stroke-width="3"/>
  <circle cx="150" cy="470" r="336" fill="none" stroke="#8fd0ff" stroke-opacity="0.15" stroke-width="8"/>
  ${orbit}
  <g transform="translate(150 92) rotate(${angle})">${body}</g>
</svg>`;
}

function silhouetteOf(o, uid, r, flag, dark) {
  const f = dark
    ? { metal: '#0a0d18', foil: '#0a0d18', panel: '#0a0d18', grid: 'none', flag: ['#0a0d18', '#0a0d18', '#0a0d18'], stroke: 'rgba(255,255,255,0.18)' }
    : { metal: `url(#${uid}metal)`, foil: `url(#${uid}foil)`, panel: `url(#${uid}panel)`, grid: `url(#${uid}grid)`, flag, stroke: 'rgba(0,0,0,0.35)' };
  if (o.type === 'rocket-body') return rocket(f, r);
  if (o.type === 'station') return station(f);
  if (o.type === 'debris') return debris(f, r);
  if (o.tier === 'common') return flatSat(f);
  return satellite(f, r);
}

function rocket(f, r) {
  const len = 110 + r() * 30, w = 30 + r() * 10;
  const bands = [0.18, 0.5].map((p, i) =>
    `<rect x="${-w / 2}" y="${-len / 2 + len * p}" width="${w}" height="${6 + i * 2}" fill="${f.flag[i]}" opacity="0.9"/>`).join('');
  return `
  <g transform="rotate(${60 + r() * 40})">
    <path d="M${-w / 2} ${len / 2} L${-w * 0.7} ${len / 2 + 26} L${w * 0.7} ${len / 2 + 26} L${w / 2} ${len / 2} Z" fill="#3a3f4b" stroke="${f.stroke}"/>
    <rect x="${-w / 2}" y="${-len / 2}" width="${w}" height="${len}" rx="4" fill="${f.metal}" stroke="${f.stroke}"/>
    ${bands}
    <rect x="${-w / 2 - 2}" y="${-len / 2 - 4}" width="${w + 4}" height="8" rx="2" fill="#2b2f38" stroke="${f.stroke}"/>
    <rect x="${-w / 2 + 3}" y="${-len / 2 + 6}" width="${w * 0.22}" height="${len - 14}" fill="#fff" opacity="${f.grid === 'none' ? 0 : 0.28}"/>
  </g>`;
}

function panelWing(x, y, w, h, f) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f.panel}" stroke="${f.stroke}"/>
          <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f.grid}"/>`;
}

function satellite(f, r) {
  const bw = 34 + r() * 14, bh = 34 + r() * 14, ww = 62 + r() * 20, wh = 24 + r() * 8;
  return `
  <line x1="${-bw / 2 - 12}" y1="0" x2="${bw / 2 + 12}" y2="0" stroke="#c7ccd6" stroke-width="3"/>
  ${panelWing(-bw / 2 - 12 - ww, -wh / 2, ww, wh, f)}
  ${panelWing(bw / 2 + 12, -wh / 2, ww, wh, f)}
  <rect x="${-bw / 2}" y="${-bh / 2}" width="${bw}" height="${bh}" rx="3" fill="${f.foil}" stroke="${f.stroke}"/>
  <path d="M${-bw / 2} ${-bh / 2 + bh * 0.3} h${bw} M${-bw / 2} ${-bh / 2 + bh * 0.66} h${bw}" stroke="rgba(0,0,0,0.25)"/>
  <line x1="0" y1="${-bh / 2}" x2="0" y2="${-bh / 2 - 14}" stroke="#c7ccd6" stroke-width="2"/>
  <ellipse cx="0" cy="${-bh / 2 - 18}" rx="14" ry="6" fill="${f.metal}" stroke="${f.stroke}"/>`;
}

function flatSat(f) {
  return `
  <rect x="-26" y="-9" width="52" height="18" rx="2" fill="${f.metal}" stroke="${f.stroke}"/>
  <line x1="26" y1="0" x2="38" y2="0" stroke="#c7ccd6" stroke-width="2.5"/>
  ${panelWing(38, -16, 110, 32, f)}`;
}

function station(f) {
  const wings = [-92, -58, 58, 92].map((x) =>
    `${panelWing(x - 9, -66, 18, 56, f)}${panelWing(x - 9, 10, 18, 56, f)}`).join('');
  return `
  <rect x="-110" y="-4" width="220" height="8" fill="#9aa1ad" stroke="${f.stroke}"/>
  ${wings}
  <rect x="-14" y="-34" width="28" height="68" rx="10" fill="${f.metal}" stroke="${f.stroke}"/>
  <rect x="-40" y="-11" width="80" height="22" rx="10" fill="${f.metal}" stroke="${f.stroke}"/>
  <rect x="-24" y="30" width="16" height="22" rx="5" fill="${f.foil}" stroke="${f.stroke}"/>`;
}

function debris(f, r) {
  let d = '';
  const n = 9;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, rad = 18 + r() * 22;
    d += `${i ? 'L' : 'M'}${(Math.cos(a) * rad).toFixed(1)} ${(Math.sin(a) * rad).toFixed(1)}`;
  }
  return `<path d="${d}Z" fill="${f.metal}" stroke="${f.stroke}"/>`;
}

// Blend two hex colours, t = weight of b.
function mix(a, b, t) {
  const pa = a.match(/\w\w/g).map((h) => parseInt(h, 16)), pb = b.match(/\w\w/g).map((h) => parseInt(h, 16));
  return `#${pa.map((v, i) => Math.round(v * (1 - t) + pb[i] * t).toString(16).padStart(2, '0')).join('')}`;
}
