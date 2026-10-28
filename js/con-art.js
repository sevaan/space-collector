// Constellation charts drawn from the real star positions (data/constellations.json) in the cards' poster
// style: navy sky, cream stars sized by brightness, thin cream lines, and the card’s own star glowing
// orange. figure: an illustration of the constellation’s figure (assets/art/con, same framing) shown
// behind the stars. Used for the constellation-star cards and the constellation cards. Returns an SVG string.
const RAD = Math.PI / 180;
const vec = (ra, dec) => [Math.cos(dec * RAD) * Math.cos(ra * RAD), Math.cos(dec * RAD) * Math.sin(ra * RAD), Math.sin(dec * RAD)];

export function conArt(con, highlightHip = null, { w = 360, h = 240, figure = null, bare = false, lit = null, mark = null, focus = null } = {}) {
  // focus (2026-10-14, Sevaan: design/con-focus.html B): 0..1 share of the constellation’s stars you own; the figure
  // starts faint and blurred and sharpens as you collect them, crisp at 1.
  // mark (2026-10-11): a deep-sky object { ra, dec, kind } drawn as a soft glow, ringed in orange, among its constellation.
  // lit (2026-10-07): a Set of HIP numbers you’ve found; those shine, the rest are faint dots still to collect.
  const stars = con.stars;
  // Centre of the figure (average direction), then a gnomonic projection with east on the left, as the sky looks.
  const c = stars.reduce((a, s) => { const v = vec(s.ra, s.dec); return [a[0] + v[0], a[1] + v[1], a[2] + v[2]]; }, [0, 0, 0]);
  const L = Math.hypot(...c), z = c.map((x) => x / L);
  const e = [-z[1], z[0], 0], eL = Math.hypot(...e) || 1, east = e.map((x) => x / eL);
  const north = [z[1] * east[2] - z[2] * east[1], z[2] * east[0] - z[0] * east[2], z[0] * east[1] - z[1] * east[0]];
  const proj = (ra, dec) => { const v = vec(ra, dec), d = v[0] * z[0] + v[1] * z[1] + v[2] * z[2]; return [-(v[0] * east[0] + v[1] * east[1] + v[2] * east[2]) / d, (v[0] * north[0] + v[1] * north[1] + v[2] * north[2]) / d]; };
  const pts = [...stars, ...(mark ? [mark] : [])].map((s) => proj(s.ra, s.dec)); // the mark is framed too
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const pad = 26, padX = 46, minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const k = Math.min((w - 2 * padX) / Math.max(1e-6, maxX - minX), /* padX: the card's 4:3 window crops ~20 units off each side of this 3:2 chart (playtest 2026-10-27: Denebola's ring was cut) */ (h - 2 * pad) / Math.max(1e-6, maxY - minY));
  const ox = w / 2 - k * (minX + maxX) / 2, oy = h / 2 + k * (minY + maxY) / 2;
  const at = (p) => [ox + k * p[0], oy - k * p[1]];
  // A seeded scatter of faint background stars, so each chart looks a little different.
  let seed = (con.id.charCodeAt(0) * 131 + con.id.length * 17) % 2147483647 || 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  let bg = '', spark = '';
  // Sparkles (2026-10-07, Sevaan: the chart’s stars should twinkle like the painted cards' do): the same cross-glint
  // as js/card.js artStars, on a few background specks only (not the figure’s stars). Full cards only (css/cards.css).
  const glint = (x, y, s, i) => `<g class="con-spark" style="--d:${((i * 37 + seed % 50) % 50 / 10).toFixed(1)}s;--t:${(2.6 + (i * 13 % 20) / 10).toFixed(1)}s" transform="translate(${(+x).toFixed(1)} ${(+y).toFixed(1)})"><g class="con-spark__g"><circle r="${(s * 0.32).toFixed(2)}" fill="url(#csk)"/><path d="M${-s} 0H${s}M0 ${-s}V${s}" stroke="#fff6d2" stroke-width=".7" stroke-linecap="round"/></g></g>`;
  // About a third of them twinkle on full cards (css/cards.css .con-tw; gallery tiles stay still).
  for (let i = 0; i < 70; i++) {
    const x = (rnd() * w).toFixed(1), y = (rnd() * h).toFixed(1), r = (0.3 + rnd() * 0.7).toFixed(2), o = (0.15 + rnd() * 0.35).toFixed(2), tw = rnd() < 0.35;
    bg += tw ? `<circle class="con-tw" style="--o:${o};--d:${(rnd() * 5).toFixed(2)}s;--t:${(2.5 + rnd() * 3).toFixed(2)}s" cx="${x}" cy="${y}" r="${(+r + 0.25).toFixed(2)}" fill="#fff2b3" opacity="${o}"/>`
      : `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff2b3" opacity="${o}"/>`;
    if (i % 12 === 4) spark += glint(x, y, 4, i); // a few background specks only
  }
  const lines = con.lines.map((pl) => `<polyline points="${pl.map(([ra, dec]) => at(proj(ra, dec)).map((n) => n.toFixed(1)).join(',')).join(' ')}"/>`).join('');
  let dots = '', glow = '';
  stars.forEach((s, i) => {
    const [x, y] = at(pts[i]), r = Math.max(1.1, 4.6 - s.mag * 0.75);
    if (lit && s.hip !== highlightHip && !lit.has(s.hip)) { dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r * 0.7).toFixed(2)}" fill="none" stroke="#fff2b3" stroke-opacity=".45" stroke-width=".9"/>`; return; }
    if (s.hip === highlightHip) {
      glow = `<circle cx="${x}" cy="${y}" r="${r * 5}" fill="url(#cg)"/><circle cx="${x}" cy="${y}" r="${r + 5}" fill="none" stroke="#fa8127" stroke-width="1.2"/>`
        + `<circle cx="${x}" cy="${y}" r="${r + 0.6}" fill="#ffd9a6"/>`;
    } else { dots += `<circle class="con-tw con-tw--star" style="--o:1;--d:${(i * 0.73 % 4).toFixed(2)}s;--t:${(3.5 + (i * 1.37 % 2.5)).toFixed(2)}s" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="#fff2b3"/>`; }
  });
  if (mark) {
    const [mx, my] = at(pts[pts.length - 1]), gal = /Galaxy/.test(mark.kind), neb = /Nebula/.test(mark.kind);
    let fuzz = gal ? `<ellipse cx="${mx.toFixed(1)}" cy="${my.toFixed(1)}" rx="16" ry="6" transform="rotate(-30 ${mx.toFixed(1)} ${my.toFixed(1)})" fill="url(#cdeep)"/>`
      : neb ? `<circle cx="${mx.toFixed(1)}" cy="${my.toFixed(1)}" r="13" fill="url(#cneb)"/>` : `<circle cx="${mx.toFixed(1)}" cy="${my.toFixed(1)}" r="11" fill="url(#cdeep)"/>`;
    if (!gal && !neb) for (let i = 0; i < 14; i++) { const a = rnd() * 6.283, d = rnd() * 9; fuzz += `<circle cx="${(mx + Math.cos(a) * d).toFixed(1)}" cy="${(my + Math.sin(a) * d).toFixed(1)}" r="${(0.5 + rnd() * 0.8).toFixed(2)}" fill="#fff6d8"/>`; }
    glow += `${fuzz}<circle cx="${mx.toFixed(1)}" cy="${my.toFixed(1)}" r="20" fill="none" stroke="#fa8127" stroke-width="1.2"/>`;
  }
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs><radialGradient id="cg"><stop offset="0" stop-color="#fa8127" stop-opacity=".7"/><stop offset="1" stop-color="#fa8127" stop-opacity="0"/></radialGradient>
    <radialGradient id="cdeep"><stop offset="0" stop-color="#fff2d0" stop-opacity=".95"/><stop offset=".35" stop-color="#e8dcc0" stop-opacity=".45"/><stop offset="1" stop-color="#e8dcc0" stop-opacity="0"/></radialGradient><radialGradient id="cneb"><stop offset="0" stop-color="#ffd6e0" stop-opacity=".85"/><stop offset=".5" stop-color="#d07a9a" stop-opacity=".35"/><stop offset="1" stop-color="#7a4a9a" stop-opacity="0"/></radialGradient><radialGradient id="csk"><stop offset="0" stop-color="#fffbe6"/><stop offset=".45" stop-color="#fff2b3" stop-opacity=".55"/><stop offset="1" stop-color="#fff2b3" stop-opacity="0"/></radialGradient><radialGradient id="cs" cx="50%" cy="40%" r="75%"><stop offset="0" stop-color="#14213a"/><stop offset="1" stop-color="#080e1a"/></radialGradient></defs>
    <rect width="${w}" height="${h}" fill="url(#cs)"/>${figure ? `<image href="${figure}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" opacity="${focus == null ? .62 : focus >= 1 ? .9 : (.06 + .55 * focus).toFixed(2)}"${focus != null && focus < 1 ? ` style="filter:blur(${((1 - focus) * 7).toFixed(1)}px)"` : ''}/>` : ''}${bg}<g fill="none" stroke="#fff2b3" stroke-opacity=".45" stroke-width=".9" stroke-linejoin="round">${lines}</g>${dots}${glow}${spark}</svg>`;
}

// A comet (2026-10-11): bright head, soft coma, a curved dust tail and a straight blue ion tail, over a starfield.
// Same chart style as the constellations; seeded by the comet’s key so each one looks a little different.
export function cometArt(key = 'comet', { w = 360, h = 240 } = {}) {
  let seed = [...key].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 2147483647, 7) || 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  let bg = '';
  for (let i = 0; i < 80; i++) bg += `<circle cx="${(rnd() * w).toFixed(1)}" cy="${(rnd() * h).toFixed(1)}" r="${(0.3 + rnd() * 0.8).toFixed(2)}" fill="#fff2b3" opacity="${(0.15 + rnd() * 0.45).toFixed(2)}"/>`;
  const hx = w * (0.26 + rnd() * 0.08), hy = h * (0.66 + rnd() * 0.08), tilt = -18 - rnd() * 14;
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs><radialGradient id="kbg" cx="35%" cy="70%" r="80%"><stop offset="0" stop-color="#18294a"/><stop offset="1" stop-color="#080e1a"/></radialGradient>
    <linearGradient id="kdust" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff2d0" stop-opacity=".9"/><stop offset=".5" stop-color="#f0d9a8" stop-opacity=".35"/><stop offset="1" stop-color="#f0d9a8" stop-opacity="0"/></linearGradient>
    <linearGradient id="kion" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#bfe3ff" stop-opacity=".7"/><stop offset="1" stop-color="#7ab8ff" stop-opacity="0"/></linearGradient>
    <radialGradient id="kcoma"><stop offset="0" stop-color="#ffffff"/><stop offset=".25" stop-color="#e8fff4" stop-opacity=".9"/><stop offset=".6" stop-color="#9fe0c8" stop-opacity=".35"/><stop offset="1" stop-color="#9fe0c8" stop-opacity="0"/></radialGradient>
    <filter id="kblur"><feGaussianBlur stdDeviation="3"/></filter></defs>
    <rect width="${w}" height="${h}" fill="url(#kbg)"/>${bg}
    <g transform="translate(${hx.toFixed(1)} ${hy.toFixed(1)}) rotate(${tilt.toFixed(1)})">
      <path d="M0 -6 C 70 -30, 170 -60, 290 -40 L 290 30 C 170 10, 70 4, 0 6 Z" fill="url(#kdust)" filter="url(#kblur)"/>
      <path d="M0 -2 L 300 -18 L 300 -8 L 0 2 Z" fill="url(#kion)" filter="url(#kblur)"/>
      <circle r="22" fill="url(#kcoma)"/><circle r="3.2" fill="#fff"/>
    </g></svg>`;
}
