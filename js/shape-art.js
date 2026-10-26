// Honest drawings for satellites that have no picture of their own (2026-10-26, Sevaan: "honest drawing", no AI
// guesses). Each one is drawn to scale from the object's own entry in GCAT (J. McDowell, CC BY): its shape words
// ("Oct Cyl + 4 Pan + Ant"), length, diameter and span. A side view on a faint blueprint grid with real dimension
// lines; nothing is added that the catalogue doesn't say. Debris gets broken fragments, never a whole stage.
// No DOM; returns SVG text sized like the card's picture window (4:3).

const W = 400, H = 300, TOP = 66, BOT = 252, PADX = 34; // under the rarity/set chips, above the dimension line
const INK = '#fff2b3', STEEL = '#8fb3cf', BODY = '#22344d', PANEL = '#14325c';
const f1 = (n) => (Math.round(n * 10) / 10).toFixed(1);

// "Oct Cyl + 4 Pan + 2 Ant + boom" → { base, sides, pan, ant, boom, cone }
export function parseShape(s = '') {
  const parts = String(s).split('+').map((p) => p.trim().toLowerCase()).filter(Boolean);
  const out = { base: 'box', sides: 0, pan: 0, ant: 0, boom: 0, cone: false };
  const b = parts[0] ?? '';
  out.base = /sphere/.test(b) ? 'sphere' : /^ell/.test(b) ? 'ell' : /dcone/.test(b) ? 'dcone' : /cone/.test(b) ? 'cone' : /cyl/.test(b) ? 'cyl'
    : /cube/.test(b) ? 'cube' : /poly|prism/.test(b) ? 'poly' : /irr/.test(b) ? 'irr' : 'box';
  out.sides = /oct/.test(b) ? 8 : /hept/.test(b) ? 7 : /hex/.test(b) ? 6 : /pent/.test(b) ? 5 : 0;
  out.taper = /taper|trunc/.test(b);
  for (const p of parts.slice(1).concat(/pan|ant|boom/.test(b) ? [b.replace(/^\S+\s*/, '')] : [])) {
    const n = Number(/(\d+)/.exec(p)?.[1] ?? 1);
    if (/pan/.test(p)) out.pan += n; else if (/ant/.test(p)) out.ant += n; else if (/boom/.test(p)) out.boom += n; else if (/cone/.test(p)) out.cone = true;
  }
  return out;
}

function grid() {
  let g = '';
  for (let x = 0; x <= W; x += 20) g += `<line x1="${x}" y1="0" x2="${x}" y2="${H}"/>`;
  for (let y = 0; y <= H; y += 20) g += `<line x1="0" y1="${y}" x2="${W}" y2="${y}"/>`;
  return `<rect width="${W}" height="${H}" fill="url(#sa-bg)"/><g stroke="${STEEL}" stroke-opacity=".09" stroke-width=".6">${g}</g>`;
}
const defs = `<defs><radialGradient id="sa-bg" cx="50%" cy="45%" r="75%"><stop offset="0" stop-color="#132440"/><stop offset="1" stop-color="#080f1b"/></radialGradient></defs>`;
function wrap(inner, caption = '') {
  return `<svg class="shape-art" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${defs}${grid()}${inner}${caption ? `<text x="${PADX - 14}" y="${H - 10}" fill="${STEEL}" font-size="10" letter-spacing="1.2" font-family="'SC Label', 'Barlow Condensed', sans-serif">${caption}</text>` : ''}</svg>`;
}
function panel(x, y, w, h) { // a solar wing with its cells
  const cols = Math.max(2, Math.round(w / 12)), rows = Math.max(1, Math.round(h / 12)); let cells = '';
  for (let i = 1; i < cols; i++) cells += `<line x1="${f1(x + (w * i) / cols)}" y1="${f1(y)}" x2="${f1(x + (w * i) / cols)}" y2="${f1(y + h)}"/>`;
  for (let j = 1; j < rows; j++) cells += `<line x1="${f1(x)}" y1="${f1(y + (h * j) / rows)}" x2="${f1(x + w)}" y2="${f1(y + (h * j) / rows)}"/>`;
  return `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" fill="${PANEL}" stroke="${INK}" stroke-width="1.1"/><g stroke="${INK}" stroke-opacity=".35" stroke-width=".6">${cells}</g>`;
}
function dimension(x1, x2, y, label) {
  return `<g stroke="${STEEL}" stroke-width=".9"><line x1="${f1(x1)}" y1="${y}" x2="${f1(x2)}" y2="${y}"/><line x1="${f1(x1)}" y1="${y - 5}" x2="${f1(x1)}" y2="${y + 5}"/><line x1="${f1(x2)}" y1="${y - 5}" x2="${f1(x2)}" y2="${y + 5}"/></g>`
    + `<text x="${f1((x1 + x2) / 2)}" y="${y + 15}" text-anchor="middle" fill="${STEEL}" font-size="11" letter-spacing="1" font-family="'SC Label', 'Barlow Condensed', sans-serif">${label}</text>`;
}
function vdimension(x, y1, y2, label) {
  return `<g stroke="${STEEL}" stroke-width=".9"><line x1="${x}" y1="${f1(y1)}" x2="${x}" y2="${f1(y2)}"/><line x1="${x - 5}" y1="${f1(y1)}" x2="${x + 5}" y2="${f1(y1)}"/><line x1="${x - 5}" y1="${f1(y2)}" x2="${x + 5}" y2="${f1(y2)}"/></g>`
    + `<text x="${x - 8}" y="${f1((y1 + y2) / 2 + 4)}" text-anchor="end" fill="${STEEL}" font-size="11" letter-spacing="1" font-family="'SC Label', 'Barlow Condensed', sans-serif">${label}</text>`;
}

// spec: { shape, L, D, S } in metres (GCAT Length, Diameter, Span); unit(m) → "2.1 m" / "6.9 ft".
export function shapeArt(spec, { unit = (m) => `${m < 1 ? f1(m) : f1(m).replace(/\.0$/, '')} m`, caption = '' } = {}) {
  const sh = parseShape(spec.shape);
  let L = Number(spec.L) || 0, D = Number(spec.D) || 0; const S = Number(spec.S) || 0;
  if (!L && !D) { L = D = 1; }
  if (!L) L = D; if (!D) D = L;
  if (sh.base === 'sphere') L = D = Math.max(L, D);
  if (sh.base === 'cube') L = D = Math.max(L, D);
  // Where the span comes from: wings if it has panels and the span is wider than the body, else whip antennas.
  const wings = sh.pan > 0 && S > D * 1.15, whips = !wings && sh.ant > 0;
  const across = Math.max(D, S || D), tall = L;
  const k = Math.min((W - 2 * PADX) / across, (BOT - TOP) / tall);
  const cx = W / 2, cy = (TOP + BOT) / 2, bw = D * k, bh = L * k, bx = cx - bw / 2, by = cy - bh / 2;
  let body = '', extra = '';
  const stroke = `stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"`;
  if (sh.base === 'sphere') body = `<circle cx="${cx}" cy="${cy}" r="${f1(bw / 2)}" fill="${BODY}" ${stroke}/><path d="M${f1(cx - bw / 2)} ${cy} A${f1(bw / 2)} ${f1(bw / 6)} 0 0 0 ${f1(cx + bw / 2)} ${cy}" fill="none" stroke="${INK}" stroke-opacity=".35"/>`;
  else if (sh.base === 'ell') body = `<ellipse cx="${cx}" cy="${cy}" rx="${f1(bw / 2)}" ry="${f1(bh / 2)}" fill="${BODY}" ${stroke}/>`;
  else if (sh.base === 'cone') body = `<path d="M${f1(cx - bw * 0.22)} ${f1(by)} L${f1(cx + bw * 0.22)} ${f1(by)} L${f1(bx + bw)} ${f1(by + bh)} L${f1(bx)} ${f1(by + bh)} Z" fill="${BODY}" ${stroke}/>`;
  else if (sh.base === 'dcone') body = `<path d="M${cx} ${f1(by)} L${f1(bx + bw)} ${cy} L${cx} ${f1(by + bh)} L${f1(bx)} ${cy} Z" fill="${BODY}" ${stroke}/><line x1="${f1(bx)}" y1="${cy}" x2="${f1(bx + bw)}" y2="${cy}" stroke="${INK}" stroke-opacity=".4"/>`;
  else if (sh.base === 'poly') { const n = 6; let d = ''; for (let i = 0; i < n; i++) { const a = Math.PI / 6 + (i * 2 * Math.PI) / n; d += `${i ? 'L' : 'M'}${f1(cx + (bw / 2) * Math.cos(a))} ${f1(cy + (bh / 2) * Math.sin(a))} `; } body = `<path d="${d}Z" fill="${BODY}" ${stroke}/>`; }
  else if (sh.base === 'irr') body = `<path d="M${f1(bx + bw * 0.1)} ${f1(by + bh * 0.2)} L${f1(bx + bw * 0.7)} ${f1(by)} L${f1(bx + bw)} ${f1(by + bh * 0.45)} L${f1(bx + bw * 0.8)} ${f1(by + bh)} L${f1(bx + bw * 0.15)} ${f1(by + bh * 0.85)} Z" fill="${BODY}" ${stroke}/>`;
  else {
    const t = sh.taper ? bw * 0.12 : 0;
    body = `<path d="M${f1(bx + t)} ${f1(by)} L${f1(bx + bw - t)} ${f1(by)} L${f1(bx + bw)} ${f1(by + bh)} L${f1(bx)} ${f1(by + bh)} Z" fill="${BODY}" ${stroke}/>`;
    if (sh.base === 'cyl') { // round or faceted drum: an end ellipse and the visible facets
      body += `<ellipse cx="${cx}" cy="${f1(by)}" rx="${f1(bw / 2 - t)}" ry="${f1(Math.min(bw * 0.12, bh * 0.2))}" fill="${BODY}" stroke="${INK}" stroke-width="1.1" stroke-opacity=".8"/>`;
      if (sh.sides) { const n = sh.sides, vis = Math.ceil(n / 2); for (let i = 1; i < vis; i++) { const x = cx - (bw / 2) * Math.cos((Math.PI * i) / vis); body += `<line x1="${f1(x)}" y1="${f1(by)}" x2="${f1(x)}" y2="${f1(by + bh)}" stroke="${INK}" stroke-opacity=".35"/>`; } }
    } else if (sh.base === 'cube' || sh.base === 'box') {
      body += `<line x1="${f1(bx + bw * 0.12)}" y1="${f1(by + bh * 0.12)}" x2="${f1(bx + bw * 0.88)}" y2="${f1(by + bh * 0.12)}" stroke="${INK}" stroke-opacity=".3"/>`;
    }
    if (sh.pan && !wings) { // panels mounted on the body itself
      const px = bx + bw * 0.14, pw = bw * 0.72, ph = bh * 0.56, py = by + bh * 0.26; if (pw > 8 && ph > 8) body += panel(px, py, pw, ph);
    }
  }
  if (sh.cone && sh.base !== 'cone') body += `<path d="M${f1(cx - bw * 0.3)} ${f1(by + bh)} L${f1(cx + bw * 0.3)} ${f1(by + bh)} L${f1(cx + bw * 0.12)} ${f1(by + bh + Math.min(bh * 0.4, 30))} L${f1(cx - bw * 0.12)} ${f1(by + bh + Math.min(bh * 0.4, 30))} Z" fill="${BODY}" ${stroke}/>`;
  if (wings) { // solar wings out to the real span; 1 wing goes to one side, more are shared both sides and stacked
    const sides = sh.pan === 1 ? [1] : [-1, 1], perSide = Math.max(1, Math.round(sh.pan / sides.length));
    const reach = sh.pan === 1 ? (S - D) * k : ((S - D) / 2) * k, gap = Math.min(10, reach * 0.08), pw = reach - gap;
    const ph = Math.min(bh * 0.8 / perSide, Math.max(10, pw * 0.32)), stackH = perSide * ph + (perSide - 1) * 6;
    for (const sgn of sides) for (let i = 0; i < perSide; i++) {
      const y = cy - stackH / 2 + i * (ph + 6), x = sgn > 0 ? bx + bw + gap : bx - gap - pw;
      extra += `<line x1="${f1(sgn > 0 ? bx + bw : bx)}" y1="${f1(y + ph / 2)}" x2="${f1(sgn > 0 ? x : x + pw)}" y2="${f1(y + ph / 2)}" stroke="${INK}" stroke-width="1.2"/>` + panel(x, y, pw, ph);
    }
  }
  if (sh.ant) { // whip antennas from the lower corners, as long as the span says (or a short stub if it doesn't)
    const n = Math.min(sh.ant, 4), len = whips && S > D ? ((S - D) / 2) * k / Math.cos(0.5) : Math.max(18, bh * 0.5);
    const roots = [[bx, by + bh], [bx + bw, by + bh], [bx, by], [bx + bw, by]];
    for (let i = 0; i < n; i++) { const [x, y] = roots[i], sx = i % 2 ? 1 : -1, sy = i < 2 ? 1 : -1;
      extra += `<line x1="${f1(x)}" y1="${f1(y)}" x2="${f1(x + sx * len * Math.cos(0.5))}" y2="${f1(y + sy * len * Math.sin(0.5))}" stroke="${INK}" stroke-width="1.1"/>`; }
  }
  if (sh.boom) extra += `<line x1="${cx}" y1="${f1(by)}" x2="${cx}" y2="${f1(Math.max(TOP - 10, by - bh * 0.9))}" stroke="${INK}" stroke-width="1.1"/><circle cx="${cx}" cy="${f1(Math.max(TOP - 10, by - bh * 0.9))}" r="3" fill="${INK}"/>`;
  const spanX1 = cx - (across * k) / 2, spanX2 = cx + (across * k) / 2;
  const dims = dimension(spanX1, spanX2, Math.min(H - 30, BOT + 10), unit(across)) + (L > 0 && bh > 24 ? vdimension(Math.max(26, Math.min(spanX1, bx) - 14), by, by + bh, unit(L)) : '');
  return wrap(extra + body + dims, caption);
}

// Rocket debris: a few broken pieces, tumbling, seeded by the object so each card keeps its own. No size is known.
export function fragmentArt(seedKey = 'x', caption = 'FRAGMENT · SIZE NOT KNOWN') {
  let seed = [...String(seedKey)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 2147483647, 11) || 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  let g = '';
  const n = 3 + Math.floor(rnd() * 2);
  for (let i = 0; i < n; i++) {
    const cx = 110 + rnd() * 180, cy = 105 + rnd() * 110, r = i === 0 ? 46 : 14 + rnd() * 20, m = 6 + Math.floor(rnd() * 4); let d = '';
    for (let j = 0; j < m; j++) { const a = (j / m) * Math.PI * 2 + rnd() * 0.5, rr = r * (0.55 + rnd() * 0.6); d += `${j ? 'L' : 'M'}${f1(cx + rr * Math.cos(a))} ${f1(cy + rr * Math.sin(a) * 0.8)} `; }
    g += `<path d="${d}Z" fill="${BODY}" stroke="${INK}" stroke-width="1.3" stroke-linejoin="round"/>`;
    if (i === 0) g += `<path d="M${f1(cx - r * 0.5)} ${f1(cy - r * 0.15)} L${f1(cx + r * 0.45)} ${f1(cy + r * 0.05)}" stroke="${INK}" stroke-opacity=".35"/>`;
  }
  return wrap(g, caption);
}
