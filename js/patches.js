// Mission patches (2026-10-08, Sevaan picked design/patches.html option A): every achievement in js/progress.js is
// an embroidered roundel — stitched cream border, twill in its group's colour, the name curving over the top, the
// group (or the date earned) along the bottom, one icon in the middle. Milestones get gold foil, the rarest holo
// (css/ui.css .patch--gold / .patch--holo). Shared by Explore (the earning moment, its toast) and Collection (the wall).

export const GROUPS = {
  collect: { c: '#14284a', t: 'Collection' }, rarity: { c: '#3a2259', t: 'Rarity' }, rocket: { c: '#5a2a1a', t: 'Rockets' },
  nation: { c: '#173d5c', t: 'Nations' }, history: { c: '#4a3a22', t: 'History' }, fleet: { c: '#10433f', t: 'Fleets' },
  planet: { c: '#5a3814', t: 'Solar system' }, con: { c: '#22265a', t: 'Constellations' }, sky: { c: '#1d4a2a', t: 'Sky skills' },
  time: { c: '#4f1c27', t: 'Time' }, secret: { c: '#4a3420', t: 'Secret' },
};
export const GROUP_ORDER = ['secret', 'collect', 'rarity', 'rocket', 'nation', 'history', 'fleet', 'planet', 'con', 'sky', 'time'];

const GROUP_OF = {
  collect: 'first ten twentyfive fifty hundred archivist curator catalogue sightings100 station stations satellites50 silver gold gold3 missions10',
  rarity: 'legend epic spectrum legends5 legends25 shiny shiny5',
  rocket: 'stage stages25 junk',
  nation: 'nations diplomat bigthree redstar stripes longmarch europe japan india',
  history: 'race oldtimer sputnik coldwar decades brandnew',
  fleet: 'starlink starlink10 starlink50 fleets',
  planet: 'moon mars saturn wanderers',
  con: 'stars10 constellation cons5 zodiac cons25',
  sky: 'zenith horizon compass faint brilliant close far roadtrip',
  time: 'twilight owl dawn marathon double hattrick months3 months12 streak4 streak12 anniversary',
};
const groupById = new Map(Object.entries(GROUP_OF).flatMap(([g, ids]) => ids.split(' ').map((id) => [id, g])));
export const groupOf = (a) => (a.secret ? 'secret' : groupById.get(a.id) ?? 'collect');

// Picture icons where one reads better than the achievement's text icon.
const GLYPH = {
  first: 'star', legend: 'star5', shiny: 'spark', shiny5: 'spark', stage: 'stage', stages25: 'stage', junk: 'debris',
  station: 'station', stations: 'station', nations: 'globe', diplomat: 'globe', race: 'versus', sputnik: 'sputnik',
  oldtimer: 'sputnik', starlink: 'train', starlink10: 'train', starlink50: 'train', fleets: 'anchor', moon: 'moon', mars: 'mars',
  saturn: 'saturn', wanderers: 'saturn', stars10: 'con', constellation: 'con', cons5: 'con', cons25: 'con', zenith: 'zenith',
  compass: 'compass', faint: 'eye', owl: 'owl',
};
// Finishes: gold foil for milestones, holo for the rarest few.
const GOLD = new Set('hundred archivist curator gold gold3 zodiac starlink50 wanderers streak12 anniversary months12 cons5 legends5'.split(' '));
const HOLO = new Set('legends25 shiny5 cons25 catalogue diplomat'.split(' '));
export const finishOf = (a) => (HOLO.has(a.id) ? 'holo' : GOLD.has(a.id) ? 'gold' : '');

const INK = '#fff2b3', OR = '#fa8127';
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const star = (r, R, n = 5, rot = -90) => Array.from({ length: n * 2 }, (_, i) => { const t = (rot + i * 180 / n) * Math.PI / 180, rr = i % 2 ? r : R; return `${(Math.cos(t) * rr).toFixed(1)},${(Math.sin(t) * rr).toFixed(1)}`; }).join(' ');
function glyph(k, text) {
  if (!k) { const s = String(text ?? ''); const fs = s.length > 3 ? 19 : s.length > 2 ? 24 : 32; return `<text y="${fs * 0.36}" text-anchor="middle" font-family="SC Display, Impact, sans-serif" font-size="${fs}" fill="${INK}">${esc(s)}</text>`; }
  return {
    star: `<polygon points="${star(5, 24, 4)}" fill="${INK}"/><circle r="4" fill="${OR}"/>`,
    star5: `<polygon points="${star(10, 25)}" fill="${OR}" stroke="${INK}" stroke-width="2"/>`,
    spark: `<polygon points="${star(4, 22, 4)}" fill="#ff8fd8"/><polygon points="${star(2, 10, 4)}" transform="translate(16 -14)" fill="#8ff0ff"/><polygon points="${star(2, 8, 4)}" transform="translate(-16 14)" fill="${INK}"/>`,
    stage: `<g transform="rotate(35)"><rect x="-8" y="-24" width="16" height="40" rx="3" fill="${INK}"/><path d="M-8 16 L-13 28 L13 28 L8 16Z" fill="${OR}"/><rect x="-8" y="-12" width="16" height="3" fill="#5a2a1a"/></g>`,
    debris: `<path d="M-14 -6 L-4 -14 L4 -8 L0 0 Z" fill="${INK}"/><path d="M6 4 L16 2 L14 12 L4 12Z" fill="${OR}"/><path d="M-12 8 L-6 6 L-6 14Z" fill="${INK}"/><circle cx="10" cy="-12" r="2.5" fill="${INK}"/>`,
    station: `<rect x="-4" y="-16" width="8" height="32" fill="${INK}"/><rect x="-26" y="-10" width="16" height="7" fill="${OR}"/><rect x="10" y="-10" width="16" height="7" fill="${OR}"/><rect x="-26" y="3" width="16" height="7" fill="${OR}"/><rect x="10" y="3" width="16" height="7" fill="${OR}"/><rect x="-10" y="-1" width="20" height="2" fill="${INK}"/>`,
    globe: `<circle r="22" fill="none" stroke="${INK}" stroke-width="3"/><ellipse rx="9" ry="22" fill="none" stroke="${INK}" stroke-width="2"/><path d="M-22 0H22M-19 -11H19M-19 11H19" stroke="${INK}" stroke-width="2"/><circle cx="14" cy="-14" r="4" fill="${OR}"/>`,
    versus: `<path d="M-20 -20 L18 18 M-20 18 L18 -20" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><circle cx="-20" cy="-20" r="5" fill="#d33"/><circle cx="18" cy="-20" r="5" fill="#4a7bd8"/>`,
    sputnik: `<circle r="10" fill="${INK}"/><path d="M6 6 L28 22 M8 2 L30 10 M-6 6 L-26 24 M-8 2 L-30 12" stroke="${INK}" stroke-width="2"/>`,
    train: Array.from({ length: 6 }, (_, i) => `<circle cx="${-25 + i * 10}" cy="${(i - 2.5) * 3}" r="3.2" fill="${i ? INK : OR}"/>`).join(''),
    anchor: `<circle cy="-18" r="5" fill="none" stroke="${INK}" stroke-width="3"/><path d="M0 -13 V20 M-12 -4 H12 M-20 6 Q-18 22 0 22 Q18 22 20 6" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>`,
    moon: `<circle r="20" fill="${INK}"/><circle cx="9" cy="-6" r="18" fill="#5a3814"/><circle cx="-10" cy="6" r="3" fill="#e3d49a"/>`,
    saturn: `<circle r="13" fill="${OR}"/><ellipse rx="27" ry="7" fill="none" stroke="${INK}" stroke-width="3" transform="rotate(-18)"/>`,
    mars: `<circle r="17" fill="#c8502e"/><path d="M-10 -6 Q0 -2 8 -9 M-6 8 Q2 4 12 9" stroke="#8a3018" stroke-width="3" fill="none"/>`,
    con: `<polyline points="-24,10 -10,-6 4,-2 14,-18 24,-8" fill="none" stroke="${INK}" stroke-width="2"/>${[[-24, 10], [-10, -6], [4, -2], [14, -18], [24, -8]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i === 2 ? 4.5 : 3}" fill="${i === 2 ? OR : INK}"/>`).join('')}`,
    zenith: `<path d="M0 22 V-20 M-9 -11 L0 -20 L9 -11" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M-24 22 H24" stroke="${OR}" stroke-width="3"/>`,
    compass: `<polygon points="0,-26 6,0 0,26 -6,0" fill="${INK}"/><polygon points="0,-26 6,0 -6,0" fill="${OR}"/><polygon points="-26,0 0,-5 26,0 0,5" fill="${INK}" opacity=".7"/>`,
    owl: `<circle cx="-9" r="8" fill="none" stroke="${INK}" stroke-width="3"/><circle cx="9" r="8" fill="none" stroke="${INK}" stroke-width="3"/><circle cx="-9" r="3" fill="${OR}"/><circle cx="9" r="3" fill="${OR}"/><path d="M-3 9 L0 14 L3 9Z" fill="${INK}"/>`,
    eye: `<path d="M-26 0 Q0 -22 26 0 Q0 22 -26 0Z" fill="none" stroke="${INK}" stroke-width="3"/><circle r="8" fill="${OR}"/><circle r="3" fill="#080e1a"/>`,
  }[k] ?? '';
}

// Close Encounter (design/ufo.html): the saucer over a green beam, a few stars.
const UFO_ART = (id) => `<defs><linearGradient id="${id}beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7dff8a" stop-opacity=".55"/><stop offset="1" stop-color="#7dff8a" stop-opacity="0"/></linearGradient></defs>
  ${[[-30, -22], [26, -26], [-18, -34], [34, -6], [-36, 0], [12, -38]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1" fill="${INK}" opacity=".7"/>`).join('')}
  <path d="M-9 -4 L-24 30 L24 30 L9 -4Z" fill="url(#${id}beam)"/>
  <g transform="translate(0 -8) scale(1.7)"><path d="M-6 -1 Q-5 -7 0 -7 Q5 -7 6 -1Z" fill="#cfe8ff" fill-opacity=".85"/><ellipse rx="14" ry="4.2" fill="${INK}"/><ellipse rx="14" ry="4.2" fill="none" stroke="#c9b67a" stroke-width=".8"/><circle cx="-8" cy=".5" r="1.3" fill="#7dff8a"/><circle cx="0" cy="1.6" r="1.3" fill="#7dff8a"/><circle cx="8" cy=".5" r="1.3" fill="#7dff8a"/></g>`;
let uid = 0;
// The patch as an SVG string. locked: a faint stitch outline (not earned yet). date: replaces the group along the
// bottom ("EARNED 07 OCT 2026"). stitch: adds the thread that draws the border on (the earning moment).
export function patchSvg(a, { locked = false, date = '', stitch = false } = {}) {
  const g0 = GROUPS[groupOf(a)], g = a.id === 'ufo' ? { ...g0, c: '#123a2a' } : g0, id = `pt${uid++}`, R = 60, fossil = a.id === 'fossil' || a.id === 'ufo';
  // Fossil Hunter (design/fossil-patch.html A): the T. rex skeleton art, centred on its bones, no inner ring.
  const ic = a.id === 'ufo' ? UFO_ART(id) : fossil ? '<image href="assets/art/fossils/patch.svg" x="-46" y="-17.5" width="92" height="43"/>' : glyph(GLYPH[a.id], a.icon);
  if (locked) {
    const ghost = ic.replace(/fill="(?!none)[^"]*"/g, 'fill="none"').replace(/<(polygon|rect|circle|path|ellipse|polyline|text)/g, '<$1 stroke="#627a8b" stroke-width="1.5"');
    // Faintly in its group's colour (2026-10-08 playtest: a new player's wall read as a dark void).
    return `<svg class="patch-svg" viewBox="-64 -64 128 128" aria-hidden="true"><circle r="${R - 3}" fill="${g.c}" fill-opacity=".45" stroke="#bcb585" stroke-opacity=".45" stroke-width="1.2" stroke-dasharray="3 3"/><g opacity=".55" transform="scale(.82)">${ghost.replace(/#627a8b/g, '#bcb585')}</g></svg>`;
  }
  const stitches = Array.from({ length: 90 }, (_, i) => { const t = i * 4 * Math.PI / 180; return `<line x1="${(Math.cos(t) * (R - 6)).toFixed(2)}" y1="${(Math.sin(t) * (R - 6)).toFixed(2)}" x2="${(Math.cos(t) * R).toFixed(2)}" y2="${(Math.sin(t) * R).toFixed(2)}"/>`; }).join('');
  const name = a.name.toUpperCase(), nameSize = name.length > 16 ? 8.5 : name.length > 12 ? 9.5 : 11;
  return `<svg class="patch-svg" viewBox="-64 -64 128 128" aria-hidden="true"><defs><path id="${id}t" d="M-42 0 A42 42 0 0 1 42 0"/><path id="${id}b" d="M-44 0 A44 44 0 0 0 44 0"/>
    <pattern id="${id}w" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="4" height="4" fill="${g.c}"/><rect width="2" height="4" fill="#ffffff08"/></pattern>
    ${stitch ? `<mask id="${id}m"><circle class="patch-thread" r="${R - 3}" fill="none" stroke="#fff" stroke-width="10" pathLength="100" transform="rotate(-90)"/></mask>` : ''}</defs>
    <circle r="${R + 1}" fill="#00000055" transform="translate(0 2)"/><circle r="${R}" fill="#e8dfb8"/><g stroke="#b9ad7e" stroke-width="1.6"${stitch ? ` mask="url(#${id}m)"` : ''}>${stitches}</g>
    <circle r="${R - 7}" fill="url(#${id}w)"/>${fossil ? '' : `<circle r="${R - 22}" fill="none" stroke="${INK}" stroke-opacity=".35" stroke-width="1"/>`}
    <text font-family="SC Label, Arial Narrow, sans-serif" font-size="${nameSize}" letter-spacing="2" fill="${INK}" text-anchor="middle"><textPath href="#${id}t" startOffset="50%">${esc(name)}</textPath></text>
    <text font-family="SC Label, Arial Narrow, sans-serif" font-size="8.5" letter-spacing="2" fill="${OR}" text-anchor="middle" dy="7"><textPath href="#${id}b" startOffset="50%">${esc(date || g.t.toUpperCase())}</textPath></text>
    ${fossil ? ic : `<g transform="scale(.82)">${ic}</g>`}</svg>`;
}
// The patch wrapped with its finish layer (gold / holo sheen), as used on the wall, the detail view and the moment.
export function patchHtml(a, opts = {}) {
  const f = opts.locked ? '' : finishOf(a);
  return `<span class="patch${f ? ` patch--${f}` : ''}${opts.locked ? ' patch--locked' : ''}">${patchSvg(a, opts)}</span>`;
}
export const fmtEarned = (t) => `EARNED ${new Date(t).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}`;
