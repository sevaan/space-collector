// Card art in the flat NASA-manual style: navy space, white stars, a blue Earth limb and the object
// drawn in white with one accent in the card's set colour. Deterministic per NORAD id.
// silhouette: true draws an outline only (uncaught cards).

const NAVY = '#0f2548';
const EARTH = '#2466b8';

function rng(seed) {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => ((s = (s ^= s << 13, s ^= s >>> 17, s ^= s << 5) >>> 0) / 4294967296);
}

export function cardArt(o, { accent = '#e8412c', silhouette = false, w = 252, h = 100 } = {}) {
  const r = rng(o.id);
  let stars = '';
  for (let i = 0; i < 34; i++) {
    stars += `<circle cx="${(r() * w).toFixed(1)}" cy="${(r() * h * 0.8).toFixed(1)}" r="${(r() ** 2 * 1.1 + 0.35).toFixed(2)}" fill="#fff" opacity="${(0.35 + r() * 0.65).toFixed(2)}"/>`;
  }
  const c = silhouette
    ? { fill: 'none', stroke: 'rgba(255,255,255,0.45)', sw: 1.4, accent: 'none', line: 'rgba(255,255,255,0.25)' }
    : { fill: '#fff', stroke: 'none', sw: 0, accent, line: NAVY };
  const tilt = (r() * 30 - 15).toFixed(1);
  const scale = (h / 190).toFixed(3);
  const earthR = w * 1.1;
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
  <rect width="${w}" height="${h}" fill="${NAVY}"/>${stars}
  <circle cx="${w / 2}" cy="${h + earthR - h * 0.26}" r="${earthR}" fill="${EARTH}"/>
  <circle cx="${w / 2}" cy="${h + earthR - h * 0.26}" r="${earthR}" fill="none" stroke="#fff" stroke-width="1.2" opacity=".85"/>
  <g transform="translate(${w / 2} ${h * 0.42}) rotate(${tilt}) scale(${scale})">${shape(o, c, r)}</g>
</svg>`;
}

const attrs = (c) => `fill="${c.fill}" stroke="${c.stroke}" stroke-width="${c.sw}"`;

function shape(o, c, r) {
  if (o.type === 'station') return station(c);
  if (o.type === 'rocket-body') return rocket(c, r);
  if (o.type === 'debris') return debris(c, r);
  if (o.tier === 'common') return flatSat(c);
  if (/AJISAI/.test(o.name)) return mirrorBall(c);
  return satellite(c, r);
}

function wing(x, y, w, h, c) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" ${attrs(c)}/>
    <line x1="${x + w / 2}" x2="${x + w / 2}" y1="${y}" y2="${y + h}" stroke="${c.line}" stroke-width="1.2"/>`;
}

function station(c) {
  let s = `<rect x="-110" y="-3" width="220" height="6" ${attrs(c)}/>`;
  for (const x of [-92, -58, 58, 92]) s += wing(x - 9, -62, 18, 52, c) + wing(x - 9, 10, 18, 52, c);
  s += `<rect x="-12" y="-30" width="24" height="60" rx="11" ${attrs(c)}/>`;
  s += `<rect x="-38" y="-10" width="76" height="20" rx="9" fill="${c.accent === 'none' ? 'none' : c.accent}" stroke="${c.stroke}" stroke-width="${c.sw}"/>`;
  return s;
}

function rocket(c, r) {
  const len = 120 + r() * 25, w = 36 + r() * 8;
  const band = (p, t) => c.accent === 'none' ? '' : `<rect x="${-w / 2}" y="${-len / 2 + len * p}" width="${w}" height="${t}" fill="${c.accent}"/>`;
  return `<g transform="rotate(${55 + r() * 30})">
    <path d="M${-w * 0.42} ${len / 2} L${-w * 0.62} ${len / 2 + 24} L${w * 0.62} ${len / 2 + 24} L${w * 0.42} ${len / 2} Z" ${attrs(c)}/>
    <rect x="${-w / 2}" y="${-len / 2}" width="${w}" height="${len}" rx="3" ${attrs(c)}/>
    ${band(0.2, 9)}${band(0.62, 6)}
    <rect x="${-w / 2 - 3}" y="${-len / 2 - 5}" width="${w + 6}" height="8" rx="2" ${attrs(c)}/>
  </g>`;
}

function satellite(c, r) {
  const bw = 40 + r() * 12, bh = 40 + r() * 12, ww = 72 + r() * 18, wh = 30 + r() * 8;
  return `<line x1="${-bw / 2 - 14}" y1="0" x2="${bw / 2 + 14}" y2="0" stroke="${c.fill === 'none' ? c.stroke : '#fff'}" stroke-width="3"/>
    ${wing(-bw / 2 - 14 - ww, -wh / 2, ww, wh, c)}${wing(bw / 2 + 14, -wh / 2, ww, wh, c)}
    <rect x="${-bw / 2}" y="${-bh / 2}" width="${bw}" height="${bh}" rx="3" ${attrs(c)}/>
    ${c.accent === 'none' ? '' : `<rect x="${-bw / 2}" y="${-bh / 2 + bh * 0.4}" width="${bw}" height="${bh * 0.2}" fill="${c.accent}"/>`}
    <line x1="0" y1="${-bh / 2}" x2="0" y2="${-bh / 2 - 14}" stroke="${c.fill === 'none' ? c.stroke : '#fff'}" stroke-width="2.5"/>
    <ellipse cx="0" cy="${-bh / 2 - 19}" rx="16" ry="7" ${attrs(c)}/>`;
}

function flatSat(c) {
  return `<rect x="-30" y="-10" width="60" height="20" rx="2" ${attrs(c)}/>
    <line x1="30" y1="0" x2="42" y2="0" stroke="${c.fill === 'none' ? c.stroke : '#fff'}" stroke-width="3"/>
    ${wing(42, -18, 120, 36, c)}
    ${c.accent === 'none' ? '' : `<rect x="-30" y="-3" width="60" height="6" fill="${c.accent}"/>`}`;
}

function mirrorBall(c) {
  if (c.fill === 'none') return `<circle r="60" ${attrs(c)}/>`;
  let f = '';
  for (let lat = -75; lat <= 75; lat += 15) {
    const y = Math.sin(lat * Math.PI / 180) * 58, rw = Math.cos(lat * Math.PI / 180) * 58;
    for (let lon = -80; lon <= 80; lon += 16) {
      const x = Math.sin(lon * Math.PI / 180) * rw, sc = Math.cos(lon * Math.PI / 180) * Math.cos(lat * Math.PI / 180);
      const col = lon < -20 && lat < 10 ? '#fff' : sc > 0.7 ? '#cfe0f5' : '#8fa8c8';
      f += `<rect x="${(x - 4 * sc - 1).toFixed(1)}" y="${(y - 3.2).toFixed(1)}" width="${(8 * sc + 1).toFixed(1)}" height="6.4" fill="${col}"/>`;
    }
  }
  return `<circle r="60" fill="#5a7396"/>${f}<circle r="60" fill="none" stroke="#fff" stroke-width="1.5"/>`;
}

function debris(c, r) {
  let d = '';
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2, rad = 26 + r() * 30;
    d += `${i ? 'L' : 'M'}${(Math.cos(a) * rad).toFixed(1)} ${(Math.sin(a) * rad).toFixed(1)}`;
  }
  return `<path d="${d}Z" ${attrs(c)}/>`;
}
