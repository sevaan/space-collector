// Constellation charts drawn from the real star positions (data/constellations.json) in the cards' poster
// style: navy sky, cream stars sized by brightness, thin cream lines, and the card's own star glowing
// orange. figure: an illustration of the constellation's figure (assets/art/con, same framing) shown
// behind the stars. Used for the constellation-star cards and the constellation cards. Returns an SVG string.
const RAD = Math.PI / 180;
const vec = (ra, dec) => [Math.cos(dec * RAD) * Math.cos(ra * RAD), Math.cos(dec * RAD) * Math.sin(ra * RAD), Math.sin(dec * RAD)];

export function conArt(con, highlightHip = null, { w = 360, h = 240, figure = null, bare = false, lit = null } = {}) {
  // lit (2026-10-07): a Set of HIP numbers you've found; those shine, the rest are faint dots still to collect.
  const stars = con.stars;
  // Centre of the figure (average direction), then a gnomonic projection with east on the left, as the sky looks.
  const c = stars.reduce((a, s) => { const v = vec(s.ra, s.dec); return [a[0] + v[0], a[1] + v[1], a[2] + v[2]]; }, [0, 0, 0]);
  const L = Math.hypot(...c), z = c.map((x) => x / L);
  const e = [-z[1], z[0], 0], eL = Math.hypot(...e) || 1, east = e.map((x) => x / eL);
  const north = [z[1] * east[2] - z[2] * east[1], z[2] * east[0] - z[0] * east[2], z[0] * east[1] - z[1] * east[0]];
  const proj = (ra, dec) => { const v = vec(ra, dec), d = v[0] * z[0] + v[1] * z[1] + v[2] * z[2]; return [-(v[0] * east[0] + v[1] * east[1] + v[2] * east[2]) / d, (v[0] * north[0] + v[1] * north[1] + v[2] * north[2]) / d]; };
  const pts = stars.map((s) => proj(s.ra, s.dec));
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const pad = 26, minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const k = Math.min((w - 2 * pad) / Math.max(1e-6, maxX - minX), (h - 2 * pad) / Math.max(1e-6, maxY - minY));
  const ox = w / 2 - k * (minX + maxX) / 2, oy = h / 2 + k * (minY + maxY) / 2;
  const at = (p) => [ox + k * p[0], oy - k * p[1]];
  // A seeded scatter of faint background stars, so each chart looks a little different.
  let seed = (con.id.charCodeAt(0) * 131 + con.id.length * 17) % 2147483647 || 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  let bg = '', spark = '';
  // Sparkles (2026-10-07, Sevaan: the chart's stars should twinkle like the painted cards' do): the same cross-glint
  // as js/card.js artStars, on a few background specks and on the figure's stars. Full cards only (css/cards.css).
  const glint = (x, y, s, i) => `<g class="con-spark" style="--d:${((i * 37 + seed % 50) % 50 / 10).toFixed(1)}s;--t:${(2.6 + (i * 13 % 20) / 10).toFixed(1)}s" transform="translate(${(+x).toFixed(1)} ${(+y).toFixed(1)})"><g class="con-spark__g"><circle r="${(s * 0.32).toFixed(2)}" fill="url(#csk)"/><path d="M${-s} 0H${s}M0 ${-s}V${s}" stroke="#fff6d2" stroke-width=".7" stroke-linecap="round"/></g></g>`;
  // About a third of them twinkle on full cards (css/cards.css .con-tw; gallery tiles stay still).
  for (let i = 0; i < 70; i++) {
    const x = (rnd() * w).toFixed(1), y = (rnd() * h).toFixed(1), r = (0.3 + rnd() * 0.7).toFixed(2), o = (0.15 + rnd() * 0.35).toFixed(2), tw = rnd() < 0.35;
    bg += tw ? `<circle class="con-tw" style="--o:${o};--d:${(rnd() * 5).toFixed(2)}s;--t:${(2.5 + rnd() * 3).toFixed(2)}s" cx="${x}" cy="${y}" r="${(+r + 0.25).toFixed(2)}" fill="#fff2b3" opacity="${o}"/>`
      : `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff2b3" opacity="${o}"/>`;
    if (i % 9 === 4) spark += glint(x, y, 5, i);
  }
  const lines = con.lines.map((pl) => `<polyline points="${pl.map(([ra, dec]) => at(proj(ra, dec)).map((n) => n.toFixed(1)).join(',')).join(' ')}"/>`).join('');
  let dots = '', glow = '';
  stars.forEach((s, i) => {
    const [x, y] = at(pts[i]), r = Math.max(1.1, 4.6 - s.mag * 0.75);
    if (lit && s.hip !== highlightHip && !lit.has(s.hip)) { dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r * 0.7).toFixed(2)}" fill="none" stroke="#fff2b3" stroke-opacity=".45" stroke-width=".9"/>`; return; }
    if (s.hip === highlightHip) {
      glow = `<circle cx="${x}" cy="${y}" r="${r * 5}" fill="url(#cg)"/><circle cx="${x}" cy="${y}" r="${r + 5}" fill="none" stroke="#fa8127" stroke-width="1.2"/>`
        + `<circle cx="${x}" cy="${y}" r="${r + 0.6}" fill="#ffd9a6"/>`;
    } else { spark += glint(x, y, 6 + r, i + 70); dots += `<circle class="con-tw con-tw--star" style="--o:1;--d:${(i * 0.73 % 4).toFixed(2)}s;--t:${(3.5 + (i * 1.37 % 2.5)).toFixed(2)}s" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="#fff2b3"/>`; }
  });
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs><radialGradient id="cg"><stop offset="0" stop-color="#fa8127" stop-opacity=".7"/><stop offset="1" stop-color="#fa8127" stop-opacity="0"/></radialGradient>
    <radialGradient id="csk"><stop offset="0" stop-color="#fffbe6"/><stop offset=".45" stop-color="#fff2b3" stop-opacity=".55"/><stop offset="1" stop-color="#fff2b3" stop-opacity="0"/></radialGradient><radialGradient id="cs" cx="50%" cy="40%" r="75%"><stop offset="0" stop-color="#14213a"/><stop offset="1" stop-color="#080e1a"/></radialGradient></defs>
    <rect width="${w}" height="${h}" fill="url(#cs)"/>${figure ? `<image href="${figure}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" opacity=".62"/>` : ''}${bg}<g fill="none" stroke="#fff2b3" stroke-opacity=".45" stroke-width=".9" stroke-linejoin="round">${lines}</g>${dots}${glow}${spark}</svg>`;
}
