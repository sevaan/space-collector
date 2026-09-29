// Card art in the flat NASA-manual style: navy space, white stars, a blue Earth limb and the object
// drawn in white with one accent in the card's set colour. Deterministic per NORAD id.
// silhouette: true draws an outline only (uncaught cards).

const NAVY = '#0b2632';
let artworkId = 0;
const EARTH = '#2466b8';

function rng(seed) {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => ((s = (s ^= s << 13, s ^= s >>> 17, s ^= s << 5) >>> 0) / 4294967296);
}

export function cardArt(o, { accent = '#d74730', silhouette = false, w = 760, h = 420 } = {}) {
  if (String(o.id) === '25544') {
    return `<img class="card-art-image${silhouette ? ' silhouette' : ''}" src="assets/art/iss-hero.svg" alt="Illustration of the International Space Station above Earth" loading="lazy" decoding="async">`;
  }
  const seed = [...String(o.id)].reduce((n, c) => Math.imul(n, 31) + c.charCodeAt(0), 7);
  const r = rng(seed);
  const id = `art-${++artworkId}`;
  let stars = '';
  for (let i = 0; i < 64; i++) {
    stars += `<circle cx="${(r() * w).toFixed(1)}" cy="${(r() * h * 0.88).toFixed(1)}" r="${(r() ** 2 * 1.8 + 0.4).toFixed(2)}" fill="#e1efeb" opacity="${(0.18 + r() * 0.65).toFixed(2)}"/>`;
  }
  const c = silhouette
    ? { fill: 'none', stroke: '#879ca1', sw: 1.4, accent: 'none', line: '#607a80' }
    : { fill: `url(#${id}-metal)`, stroke: '#8aa3a9', sw: 0.6, accent, line: '#466570' };
  const tilt = (r() * 26 - 13).toFixed(1);
  const scale = (Math.min(w / 310, h / 205)).toFixed(3);
  const earthR = w * 0.95;
  return `<svg aria-hidden="true" viewBox="0 0 ${w} ${h}" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="${id}-sky" x2="1" y2="1"><stop stop-color="#081a24"/><stop offset="1" stop-color="#214c59"/></linearGradient>
    <linearGradient id="${id}-metal"><stop stop-color="#789295"/><stop offset=".4" stop-color="#f6edcd"/><stop offset=".58" stop-color="#d5dfd5"/><stop offset="1" stop-color="#58737b"/></linearGradient>
    <linearGradient id="${id}-earth" x2=".2" y2="1"><stop stop-color="#649799"/><stop offset=".15" stop-color="#39636d"/><stop offset="1" stop-color="#173749"/></linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#${id}-sky)"/>${stars}
  <g fill="none" stroke="#93b5bb" stroke-width=".6" opacity=".14"><ellipse cx="${w * .58}" cy="${h * .48}" rx="${w * .6}" ry="${h * .29}" transform="rotate(-23 ${w * .58} ${h * .48})"/><path d="M0 ${h * .4}H${w}M${w * .7} 0V${h}"/></g>
  <circle cx="${w * .4}" cy="${h + earthR - h * .15}" r="${earthR}" fill="url(#${id}-earth)" stroke="#9acece" stroke-width="${h / 110}"/>
  <circle cx="${w * .4}" cy="${h + earthR - h * .15}" r="${earthR - 5}" fill="none" stroke="#d9e6d0" stroke-width="1" opacity=".45"/>
  <g transform="translate(${w / 2} ${h * .44}) rotate(${tilt}) scale(${scale})">${shape(o, c, r)}</g>
</svg>`;
}

const attrs = (c) => `fill="${c.fill}" stroke="${c.stroke}" stroke-width="${c.sw}"`;

function shape(o, c, r) {
  if (o.members) return train(c, r);
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

// A line of flat satellites, like a fresh Starlink train.
function train(c, r) {
  let s = '';
  for (let i = -3; i <= 3; i++) {
    const x = i * 44, y = -i * 12 + (r() - 0.5) * 6;
    s += `<g transform="translate(${x} ${y}) scale(0.42)">${flatSat(c)}</g>`;
  }
  return `<g transform="rotate(-6)">${s}</g>`;
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
