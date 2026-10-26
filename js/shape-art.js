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

// ---- Scene styles (2026-10-26, Sevaan: "how would you make them feel closer to the rest of the cards?") ----
// The same shape and proportions as shapeArt, drawn as a small scene like the painted cards: navy sky with a few stars,
// Earth's limb along the bottom, the body seen at a slight three-quarter angle and lit from the upper left. Materials
// stay neutral (bare metal body, blue solar cells): the catalogue doesn't say gold foil, so it isn't drawn.
// style 'lit' = shaded colour; 'engraved' = the same scene in fine ink hatching, like the restyled card art.
export function shapeScene(spec, { style = 'lit', seed = 1, note = '' } = {}) {
  const sh = parseShape(spec.shape);
  let L = Number(spec.L) || 0, D = Number(spec.D) || 0; const S = Number(spec.S) || 0;
  if (!L && !D) L = D = 1; if (!L) L = D; if (!D) D = L;
  if (sh.base === 'sphere' || sh.base === 'cube') L = D = Math.max(L, D);
  const wings = sh.pan > 0 && S > D * 1.15, whips = !wings && sh.ant > 0;
  const ENG = style === 'engraved', id = `s${seed}${style[0]}`;
  const across = Math.max(D, S || D) * 1.08, depthK = 0.42;
  const k = Math.min(300 / across, 150 / (L + D * depthK * 0.6));
  const cx = 200, cy = 158, bw = D * k, bh = L * k, dx = bw * depthK * 0.55, dy = -bw * depthK * 0.38; // depth goes up-right
  const bx = cx - bw / 2 - dx / 2, by = cy - bh / 2 - dy / 2;
  let rnd = (() => { let s = (Number(seed) || 7) * 9301 % 233280 || 7; return () => (s = (s * 9301 + 49297) % 233280) / 233280; })();
  // palette / fills
  const C = ENG ? { sky1: '#0e1b2e', sky2: '#060c16', light: `url(#${id}h1)`, mid: `url(#${id}h2)`, dark: `url(#${id}h3)`, panel: `url(#${id}h2)`, panelTop: `url(#${id}h1)`, line: '#efe2b8', earth: `url(#${id}h1)` }
    : { sky1: '#13264a', sky2: '#070d18', light: `url(#${id}gl)`, mid: `url(#${id}gm)`, dark: '#1d2a3c', panel: `url(#${id}gp)`, panelTop: '#2f5a9a', line: '#e9dfc2', earth: `url(#${id}ge)` };
  const hatch = (n, gap, w, ang) => `<pattern id="${id}${n}" width="${gap}" height="${gap}" patternUnits="userSpaceOnUse" patternTransform="rotate(${ang})"><rect width="${gap}" height="${gap}" fill="#0b1626"/><line x1="0" y1="0" x2="0" y2="${gap}" stroke="#efe2b8" stroke-width="${w}"/></pattern>`;
  const defs = `<defs><radialGradient id="${id}sky" cx="40%" cy="30%" r="85%"><stop offset="0" stop-color="${C.sky1}"/><stop offset="1" stop-color="${C.sky2}"/></radialGradient>`
    + (ENG ? hatch('h1', 6, 0.7, 45) + hatch('h2', 3.6, 0.8, 45) + hatch('h3', 2.4, 0.9, -45)
      : `<linearGradient id="${id}gl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d9dde2"/><stop offset=".45" stop-color="#9aa6b4"/><stop offset="1" stop-color="#4c5869"/></linearGradient>`
      + `<linearGradient id="${id}gm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c9ced6"/><stop offset="1" stop-color="#7e8a99"/></linearGradient>`
      + `<linearGradient id="${id}gp" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2d5fa8"/><stop offset=".5" stop-color="#173c76"/><stop offset="1" stop-color="#0e2550"/></linearGradient>`
      + `<radialGradient id="${id}gs" cx="35%" cy="32%" r="70%"><stop offset="0" stop-color="#eef1f4"/><stop offset=".55" stop-color="#8e9aa9"/><stop offset="1" stop-color="#2c3746"/></radialGradient>`
      + `<linearGradient id="${id}ge" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6fb2e6"/><stop offset=".08" stop-color="#2f6aa8"/><stop offset="1" stop-color="#0d2547"/></linearGradient>`)
    + `</defs>`;
  let g = `<rect width="400" height="300" fill="url(#${id}sky)"/>`;
  for (let i = 0; i < 46; i++) { const x = rnd() * 400, y = rnd() * 230; g += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(0.4 + rnd() * 0.9)}" fill="#fff2b3" opacity="${f1(0.2 + rnd() * 0.6)}"/>`; }
  g += `<path d="M-40 300 Q200 238 440 300 Z" fill="${C.earth}" stroke="${ENG ? '#efe2b8' : '#9fd0f5'}" stroke-width="${ENG ? 1 : 1.5}" stroke-opacity="${ENG ? 0.8 : 0.7}"/>`;
  if (!ENG) g += `<path d="M-40 300 Q200 232 440 300" fill="none" stroke="#8fd0ff" stroke-width="6" stroke-opacity=".18"/>`;
  const st = `stroke="${C.line}" stroke-width="${ENG ? 1.1 : 0.8}" stroke-linejoin="round"`;
  let parts = '';
  const wing = (x0, y0, len, depth, side) => { // a flat solar wing seen at the same angle
    const ex = x0 + side * len, a = [x0, y0], b = [ex, y0], c = [ex + depth * 0.9, y0 - depth * 0.62], d = [x0 + depth * 0.9, y0 - depth * 0.62];
    const pts = [a, b, c, d].map((p) => `${f1(p[0])},${f1(p[1])}`).join(' ');
    let cells = ''; const nc = Math.max(3, Math.round(Math.abs(len) / 14));
    for (let i = 1; i < nc; i++) { const t = i / nc, x1 = x0 + side * len * t; cells += `<line x1="${f1(x1)}" y1="${f1(y0)}" x2="${f1(x1 + depth * 0.9)}" y2="${f1(y0 - depth * 0.62)}"/>`; }
    cells += `<line x1="${f1(x0 + depth * 0.45)}" y1="${f1(y0 - depth * 0.31)}" x2="${f1(ex + depth * 0.45)}" y2="${f1(y0 - depth * 0.31)}"/>`;
    return `<polygon points="${pts}" fill="${C.panel}" ${st}/><g stroke="${C.line}" stroke-opacity="${ENG ? 0.55 : 0.3}" stroke-width=".6">${cells}</g>`;
  };
  // wings behind the body
  if (wings) {
    const sides = sh.pan === 1 ? [1] : [-1, 1], per = Math.max(1, Math.round(sh.pan / sides.length));
    const reach = (sh.pan === 1 ? S - D : (S - D) / 2) * k, depth = Math.min(bh * 0.55, Math.max(10, reach * 0.3));
    for (const sgn of sides) for (let i = 0; i < per; i++) {
      const y0 = by + bh * (per === 1 ? 0.6 : 0.4 + i * 0.35), x0 = sgn > 0 ? bx + bw + dx * 0.5 + 4 : bx - 4;
      parts += `<line x1="${f1(sgn > 0 ? bx + bw + dx * 0.5 : bx)}" y1="${f1(y0 - depth * 0.3)}" x2="${f1(x0)}" y2="${f1(y0 - depth * 0.3)}" stroke="${C.line}" stroke-width="1.2"/>` + wing(x0, y0, reach - 4, depth, sgn);
    }
  }
  // the body
  if (sh.base === 'sphere' || sh.base === 'ell') {
    const r = bw / 2, rcx = cx, rcy = cy;
    parts += ENG ? `<ellipse cx="${f1(rcx)}" cy="${f1(rcy)}" rx="${f1(r)}" ry="${f1(bh / 2)}" fill="${C.mid}" ${st}/><path d="M${f1(rcx - r * 0.2)} ${f1(rcy - bh / 2)} A${f1(r)} ${f1(bh / 2)} 0 0 1 ${f1(rcx + r)} ${f1(rcy)} A${f1(r * 0.6)} ${f1(bh * 0.4)} 0 0 0 ${f1(rcx - r * 0.2)} ${f1(rcy - bh / 2)}Z" fill="${C.dark}" stroke="none"/><ellipse cx="${f1(rcx)}" cy="${f1(rcy)}" rx="${f1(r)}" ry="${f1(bh / 2)}" fill="none" ${st}/>`
      : `<ellipse cx="${f1(rcx)}" cy="${f1(rcy)}" rx="${f1(r)}" ry="${f1(bh / 2)}" fill="url(#${id}gs)" ${st}/>`;
  } else if (/cyl|cone|dcone/.test(sh.base)) {
    const ry = Math.max(3, bw * 0.16), topW = sh.base === 'cone' ? bw * 0.45 : sh.taper ? bw * 0.78 : bw, x = cx - bw / 2, y = cy - bh / 2;
    const tx = cx - topW / 2;
    if (sh.base === 'dcone') parts += `<path d="M${f1(cx)} ${f1(y)} L${f1(x + bw)} ${f1(cy)} L${f1(cx)} ${f1(y + bh)} L${f1(x)} ${f1(cy)} Z" fill="${C.light}" ${st}/><path d="M${f1(cx)} ${f1(y)} L${f1(x + bw)} ${f1(cy)} L${f1(cx)} ${f1(y + bh)} Z" fill="${C.dark}" fill-opacity="${ENG ? 1 : 0.45}" ${st}/>`;
    else {
      parts += `<path d="M${f1(tx)} ${f1(y)} L${f1(x)} ${f1(y + bh)} A${f1(bw / 2)} ${f1(ry)} 0 0 0 ${f1(x + bw)} ${f1(y + bh)} L${f1(tx + topW)} ${f1(y)} Z" fill="${C.light}" ${st}/>`;
      if (sh.sides) { const vis = Math.ceil(sh.sides / 2); for (let i = 1; i < vis; i++) { const t = 0.5 - Math.cos((Math.PI * i) / vis) / 2; parts += `<line x1="${f1(tx + topW * t)}" y1="${f1(y)}" x2="${f1(x + bw * t)}" y2="${f1(y + bh + ry * Math.sin(Math.PI * t))}" stroke="${C.line}" stroke-opacity="${ENG ? 0.8 : 0.35}" stroke-width=".7"/>`; } }
      parts += `<ellipse cx="${f1(cx)}" cy="${f1(y)}" rx="${f1(topW / 2)}" ry="${f1(ry * topW / bw)}" fill="${C.mid}" ${st}/>`;
      if (sh.pan && !wings) for (let i = 0; i < 3; i++) parts += `<line x1="${f1(x + bw * 0.08)}" y1="${f1(y + bh * (0.3 + i * 0.2))}" x2="${f1(x + bw * 0.92)}" y2="${f1(y + bh * (0.3 + i * 0.2))}" stroke="${ENG ? C.line : '#2d5fa8'}" stroke-width="${ENG ? 0.7 : 2}" stroke-opacity=".7"/>`;
    }
  } else { // box (and cube / prism / irregular, drawn as a box)
    const F = [[bx, by], [bx + bw, by], [bx + bw, by + bh], [bx, by + bh]], T = [[bx, by], [bx + dx, by + dy], [bx + bw + dx, by + dy], [bx + bw, by]], R = [[bx + bw, by], [bx + bw + dx, by + dy], [bx + bw + dx, by + bh + dy], [bx + bw, by + bh]];
    const poly = (p, fill) => `<polygon points="${p.map((q) => `${f1(q[0])},${f1(q[1])}`).join(' ')}" fill="${fill}" ${st}/>`;
    parts += poly(R, C.dark) + poly(T, C.mid) + poly(F, C.light);
    if (sh.pan && !wings && bw > 14 && bh > 14) { // panels on the body itself
      const px = bx + bw * 0.14, py = by + bh * 0.2, pw = bw * 0.72, ph = bh * 0.6; let cl = '';
      for (let i = 1; i < 4; i++) cl += `<line x1="${f1(px + pw * i / 4)}" y1="${f1(py)}" x2="${f1(px + pw * i / 4)}" y2="${f1(py + ph)}"/>`;
      parts += `<rect x="${f1(px)}" y="${f1(py)}" width="${f1(pw)}" height="${f1(ph)}" fill="${C.panel}" ${st}/><g stroke="${C.line}" stroke-opacity=".35" stroke-width=".6">${cl}</g>`;
    }
  }
  if (sh.ant) { // whips from the lower corners (as long as the catalogue span says, else short stubs)
    const n = Math.min(sh.ant, 4), len = whips && S > D ? ((S - D) / 2) * k / Math.cos(0.5) : Math.max(16, bh * 0.45);
    const roots = [[cx - bw / 2, cy + bh / 2], [cx + bw / 2, cy + bh / 2], [cx - bw / 2, cy - bh / 2], [cx + bw / 2, cy - bh / 2]];
    for (let i = 0; i < n; i++) { const [x, y] = roots[i], sx = i % 2 ? 1 : -1, sy = i < 2 ? 1 : -1; parts += `<line x1="${f1(x)}" y1="${f1(y)}" x2="${f1(x + sx * len * Math.cos(0.5))}" y2="${f1(y + sy * len * Math.sin(0.5))}" stroke="${C.line}" stroke-width="1.2" stroke-linecap="round"/>`; }
  }
  if (sh.boom) parts += `<line x1="${f1(cx)}" y1="${f1(cy - bh / 2)}" x2="${f1(cx)}" y2="${f1(Math.max(40, cy - bh * 1.3))}" stroke="${C.line}" stroke-width="1.2"/><circle cx="${f1(cx)}" cy="${f1(Math.max(40, cy - bh * 1.3))}" r="3" fill="${C.line}"/>`;
  if (spec.empty) parts = ''; // just the sky and Earth (fragmentScene draws its own pieces)
  if (!ENG && parts) parts = `<g filter="drop-shadow(0 6px 8px #0008)">${parts}</g>`;
  return `<svg class="shape-art" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${defs}${g}${parts}${note ? `<text x="22" y="290" fill="#fff2b3" fill-opacity=".75" font-size="11" letter-spacing="1.2" font-family="'SC Label', 'Barlow Condensed', sans-serif">${note}</text>` : ''}</svg>`;
}

// Debris in the same two styles: a few broken pieces tumbling above Earth.
export function fragmentScene(seedKey = 'x', { style = 'lit' } = {}) {
  let seed = [...String(seedKey)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 2147483647, 11) || 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647, ENG = style === 'engraved', id = `f${String(seedKey).replace(/\W/g, '')}${style[0]}`;
  const svg = shapeScene({ shape: 'Box', L: 1, D: 1, empty: true }, { style, seed: seedKey });
  let g = '';
  for (let i = 0, n = 3 + Math.floor(rnd() * 2); i < n; i++) {
    const cx = 120 + rnd() * 160, cy = 95 + rnd() * 100, r = i === 0 ? 40 : 12 + rnd() * 18, m = 6 + Math.floor(rnd() * 4); let d = '';
    for (let j = 0; j < m; j++) { const a = (j / m) * Math.PI * 2 + rnd() * 0.5, rr = r * (0.55 + rnd() * 0.6); d += `${j ? 'L' : 'M'}${f1(cx + rr * Math.cos(a))} ${f1(cy + rr * Math.sin(a) * 0.8)} `; }
    g += `<path d="${d}Z" fill="${ENG ? `url(#s${seedKey}eh2)` : (i % 2 ? '#7e8a99' : '#aab3bf')}" stroke="#efe2b8" stroke-width="${ENG ? 1.1 : 0.8}" stroke-linejoin="round"/>`;
  }
  return svg.replace('</svg>', `${ENG ? g : `<g filter="drop-shadow(0 5px 6px #0008)">${g}</g>`}</svg>`);
}

// A fragment shows the object it came from, broken apart (2026-10-26, Sevaan): the parent's own picture cut into a few
// pieces by random straight cracks (seeded by the card, so it's always the same break), each piece drifting a little
// outward and turning. The gaps show dark sky. href is the parent's picture; label names it.
function splitPoly(poly, p, d) { // cut a convex polygon by the line through p with direction d → [left, right]
  const side = (q) => (q[0] - p[0]) * d[1] - (q[1] - p[1]) * d[0], A = [], B = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length], sa = side(a), sb = side(b);
    (sa >= 0 ? A : B).push(a);
    if ((sa >= 0) !== (sb >= 0)) { const t = sa / (sa - sb), x = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; A.push(x); B.push(x); }
  }
  return [A, B].filter((q) => q.length >= 3);
}
export function shatterArt(href, seedKey = 'x', label = '', { box = [0.2, 0.25, 0.8, 0.85], tint = '' } = {}) {
  let seed = [...String(seedKey)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 2147483647, 13) || 13;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  let pieces = [[[0, 0], [400, 0], [400, 300], [0, 300]]];
  const [l, t, r, b] = box.map((v, i) => v * (i % 2 ? 300 : 400));
  for (let cut = 0; cut < 3; cut++) { // three cracks, each through the object itself (its box in the picture)
    const p = [l + (r - l) * (0.25 + rnd() * 0.5), t + (b - t) * (0.25 + rnd() * 0.5)], a = (0.15 + rnd() * 0.7) * Math.PI, d = [Math.cos(a), Math.sin(a)];
    pieces = pieces.flatMap((q) => splitPoly(q, p, d));
  }
  const id = `sh${String(seedKey).replace(/\W/g, '')}`, ox = (l + r) / 2, oy = (t + b) / 2;
  let defs = `<filter id="${id}b"><feGaussianBlur stdDeviation="5"/></filter>`, g = '';
  pieces.forEach((q, i) => {
    const cx = q.reduce((s, v) => s + v[0], 0) / q.length, cy = q.reduce((s, v) => s + v[1], 0) / q.length;
    const tx = (cx - ox) * (0.06 + rnd() * 0.06), ty = (cy - oy) * (0.06 + rnd() * 0.06), rot = (rnd() - 0.5) * 7;
    defs += `<clipPath id="${id}c${i}"><polygon points="${q.map((v) => `${f1(v[0])},${f1(v[1])}`).join(' ')}"/></clipPath>`;
    g += `<g transform="translate(${f1(tx)} ${f1(ty)}) rotate(${f1(rot)} ${f1(cx)} ${f1(cy)})"><g clip-path="url(#${id}c${i})"><image href="${href}" width="400" height="300" preserveAspectRatio="xMidYMid slice"/></g></g>`;
  });
  return `<svg class="shape-art shatter-art" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"${tint ? ` style="${tint}"` : ''}><defs>${defs}</defs>`
    + `<image href="${href}" width="400" height="300" preserveAspectRatio="xMidYMid slice" filter="url(#${id}b)" opacity=".3"/>${g}</svg>`
    + (label ? `<span class="art-credit art-credit--from">${label}</span>` : '');
}
