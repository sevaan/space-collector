// Mission patches (2026-10-08, Sevaan picked design/patches.html option A): every achievement in js/progress.js is
// an embroidered roundel — stitched cream border, twill in its group's colour, the name curving over the top, the
// group (or the date earned) along the bottom, one icon in the middle. Milestones get gold foil, the rarest holo
// (css/ui.css .patch--gold / .patch--holo). Shared by Explore (the earning moment, its toast) and Collection (the wall).

import { CON_BY_ID } from './constellations.js?v=0.1.417';

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
export const groupOf = (a) => (a.secret ? 'secret' : a.con === 'solar' ? 'planet' : a.con ? 'con' : groupById.get(a.id) ?? 'collect');

// Picture icons where one reads better than the achievement's text icon.
const GLYPH = {
  first: 'star', legend: 'star5', shiny: 'spark', shiny5: 'spark', stage: 'stage', stages25: 'stage', junk: 'debris',
  station: 'station', stations: 'station', nations: 'globe', diplomat: 'globe', race: 'versus', sputnik: 'sputnik',
  oldtimer: 'sputnik', starlink: 'train', starlink10: 'train', starlink50: 'train', fleets: 'anchor', moon: 'moon', mars: 'mars',
  saturn: 'saturn', wanderers: 'saturn', stars10: 'con', constellation: 'con', cons5: 'con', cons25: 'con', zenith: 'zenith',
  compass: 'compass', faint: 'eye', owl: 'owl',
  // Picture icons for the patches that used to show a text code (playtest 2026-10-09: "M10", "3/3", "≤90"…)
  missions10: 'clipboard', missions50: 'clipboard', fullhouse: 'three', streak4: 'calendar', streak12: 'calendar', months3: 'calendar', months12: 'calendar',
  silver: 'cardAg', gold: 'cardAu', gold3: 'cardAu3', marathon: 'tally', double: 'cards2', hattrick: 'cards3', twilight: 'sunset', dawn: 'sunrise',
  horizon: 'horizon', coldwar: 'rocketOld', decades: 'hourglass', brandnew: 'launch', anniversary: 'candle', close: 'close', far: 'far', roadtrip: 'road',
  brilliant: 'flare', spectrum: 'gems', europe: 'ring12', satellites50: 'sat',
};
// Finishes: gold foil for milestones, holo for the rarest few.
const GOLD = new Set('con-solar hundred archivist curator gold gold3 zodiac starlink50 wanderers streak12 anniversary months12 cons5 legends5'.split(' '));
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
    clipboard: `<rect x="-17" y="-22" width="34" height="44" rx="4" fill="none" stroke="${INK}" stroke-width="3"/><rect x="-8" y="-26" width="16" height="8" rx="2" fill="${INK}"/><path d="M-9 -4 L-3 2 L9 -10" stroke="${OR}" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M-9 10 H9 M-9 16 H4" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`,
    three: [-18, 0, 18].map((x) => `<polygon points="${x},-10 ${x + 8},0 ${x},10 ${x - 8},0" fill="${OR}" stroke="${INK}" stroke-width="1.6"/>`).join('') + `<path d="M-22 18 H22" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`,
    calendar: `<rect x="-20" y="-16" width="40" height="36" rx="4" fill="none" stroke="${INK}" stroke-width="3"/><path d="M-20 -6 H20" stroke="${INK}" stroke-width="3"/><path d="M-11 -22 V-12 M11 -22 V-12" stroke="${INK}" stroke-width="3" stroke-linecap="round"/><path d="M0 14 C-8 10 -6 2 0 -2 C0 4 6 4 6 9 C6 13 3 15 0 14Z" fill="${OR}"/>`,
    cardAg: `<rect x="-14" y="-21" width="28" height="40" rx="4" fill="#dfe6ee" stroke="${INK}" stroke-width="2"/><path d="M-14 -4 L14 -14 M-14 8 L14 -2" stroke="#ffffff" stroke-width="3" opacity=".7"/><circle cy="10" r="4" fill="#9aa7b4"/>`,
    cardAu: `<rect x="-14" y="-21" width="28" height="40" rx="4" fill="#f2c94c" stroke="${INK}" stroke-width="2"/><path d="M-14 -4 L14 -14 M-14 8 L14 -2" stroke="#fff6cf" stroke-width="3" opacity=".7"/><circle cy="10" r="4" fill="#c4932a"/>`,
    cardAu3: [-12, 0, 12].map((x, i) => `<rect x="${x - 10}" y="${-18 + Math.abs(i - 1) * 4}" width="20" height="30" rx="3" fill="#f2c94c" stroke="${INK}" stroke-width="1.8" transform="rotate(${(i - 1) * 12} ${x} 0)"/>`).join(''),
    tally: `<path d="M-14 -16 A14 14 0 1 0 -2 8 A11 11 0 1 1 -14 -16Z" fill="${INK}" transform="translate(-4 -2)"/>` + [0, 1, 2, 3].map((k) => `<path d="M${4 + k * 5} 4 V22" stroke="${OR}" stroke-width="2.6" stroke-linecap="round"/>`).join('') + `<path d="M1 18 L23 8" stroke="${OR}" stroke-width="2.6" stroke-linecap="round"/>`,
    cards2: `<rect x="-20" y="-16" width="22" height="32" rx="3" fill="none" stroke="${INK}" stroke-width="2.6" transform="rotate(-10)"/><rect x="-2" y="-16" width="22" height="32" rx="3" fill="${OR}" stroke="${INK}" stroke-width="2.6" transform="rotate(8)"/>`,
    cards3: [-1, 0, 1].map((k) => `<rect x="${k * 13 - 10}" y="-16" width="20" height="30" rx="3" fill="${k === 1 ? OR : 'none'}" stroke="${INK}" stroke-width="2.4" transform="rotate(${k * 10} ${k * 13} 0)"/>`).join(''),
    sunset: `<path d="M-26 8 H26" stroke="${INK}" stroke-width="3" stroke-linecap="round"/><path d="M-14 8 A14 14 0 0 1 14 8Z" fill="${OR}"/><path d="M-8 16 H8 M-14 22 H14" stroke="${INK}" stroke-width="2.4" stroke-linecap="round" opacity=".7"/><circle cx="16" cy="-16" r="2" fill="${INK}"/>`,
    sunrise: `<path d="M-26 10 H26" stroke="${INK}" stroke-width="3" stroke-linecap="round"/><path d="M-12 10 A12 12 0 0 1 12 10Z" fill="${OR}"/>` + [-60, -30, 0, 30, 60].map((d) => `<path d="M0 -6 V-14" stroke="${OR}" stroke-width="2.6" stroke-linecap="round" transform="translate(0 10) rotate(${d}) translate(0 -10)"/>`).join(''),
    horizon: `<path d="M-28 14 Q0 6 28 14" stroke="${INK}" stroke-width="3" fill="none"/><path d="M-22 6 Q0 -30 22 6" stroke="${INK}" stroke-width="1.6" stroke-dasharray="3 3" fill="none" opacity=".6"/><circle cx="-18" cy="2" r="4.5" fill="${OR}"/>`,
    rocketOld: `<path d="M0 -26 C7 -16 7 4 5 14 H-5 C-7 4 -7 -16 0 -26Z" fill="${INK}"/><path d="M-5 6 L-13 18 L-5 14Z M5 6 L13 18 L5 14Z" fill="${OR}"/><polygon points="${star(2.4, 6)}" transform="translate(0 -6)" fill="#d33"/><path d="M-3 18 L0 26 L3 18Z" fill="${OR}"/>`,
    hourglass: `<path d="M-14 -22 H14 M-14 22 H14" stroke="${INK}" stroke-width="3" stroke-linecap="round"/><path d="M-11 -20 C-11 -6 11 -6 11 -20 M-11 20 C-11 6 11 6 11 20 M-11 -20 C-11 -4 -2 -2 -2 0 C-2 2 -11 4 -11 20 M11 -20 C11 -4 2 -2 2 0 C2 2 11 4 11 20" stroke="${INK}" stroke-width="2.4" fill="none"/><path d="M-7 18 C-5 12 5 12 7 18Z" fill="${OR}"/>`,
    launch: `<path d="M0 -24 C6 -16 6 0 4 8 H-4 C-6 0 -6 -16 0 -24Z" fill="${INK}"/><path d="M-4 2 L-10 12 L-4 9Z M4 2 L10 12 L4 9Z" fill="${INK}"/><path d="M-4 10 C-6 18 -2 22 0 26 C2 22 6 18 4 10Z" fill="${OR}"/><path d="M-24 24 H24" stroke="${INK}" stroke-width="2.4" stroke-linecap="round" opacity=".6"/>`,
    candle: `<rect x="-6" y="-6" width="12" height="28" rx="2" fill="${INK}"/><path d="M0 -10 C-6 -16 -2 -22 0 -26 C2 -22 6 -16 0 -10Z" fill="${OR}"/><path d="M-22 22 H22" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/><text y="-12" x="16" font-family="SC Display, Impact, sans-serif" font-size="12" fill="${INK}">1</text>`,
    close: `<circle cx="-6" cy="6" r="14" fill="none" stroke="${INK}" stroke-width="3"/><circle cx="14" cy="-14" r="5" fill="${OR}"/><path d="M4 -4 L10 -10" stroke="${INK}" stroke-width="2" stroke-dasharray="2 2"/>`,
    far: `<circle cx="-16" cy="12" r="9" fill="none" stroke="${INK}" stroke-width="3"/><path d="M-8 6 L16 -12" stroke="${INK}" stroke-width="2" stroke-dasharray="3 3"/><circle cx="20" cy="-15" r="3.5" fill="${OR}"/>`,
    road: `<path d="M-6 26 L-2 -20 M6 26 L2 -20" stroke="${INK}" stroke-width="2.6"/><path d="M0 22 V16 M0 10 V5 M0 -1 V-5" stroke="${OR}" stroke-width="2" stroke-linecap="round"/><path d="M-20 -8 C-20 -18 -8 -18 -8 -8 C-8 -2 -14 4 -14 4 C-14 4 -20 -2 -20 -8Z M8 -14 C8 -24 20 -24 20 -14 C20 -8 14 -2 14 -2 C14 -2 8 -8 8 -14Z" fill="${OR}"/>`,
    flare: `<polygon points="${star(3, 26, 4)}" fill="${INK}"/><circle r="7" fill="#fff"/><circle r="12" fill="${OR}" opacity=".35"/>`,
    gems: ['#9aa7b4', '#4fbf7a', '#4a7bd8', '#a463e0', '#f2c94c'].map((c, i) => `<polygon points="0,-7 6,0 0,7 -6,0" fill="${c}" transform="translate(${(i - 2) * 11} ${Math.abs(i - 2) * 3 - 3})"/>`).join(''),
    ring12: Array.from({ length: 12 }, (_, i) => { const t = i / 12 * Math.PI * 2; return `<polygon points="${star(1.6, 4)}" transform="translate(${(Math.cos(t) * 20).toFixed(1)} ${(Math.sin(t) * 20).toFixed(1)})" fill="#f2c94c"/>`; }).join(''),
    sat: `<rect x="-6" y="-6" width="12" height="12" fill="${INK}"/><rect x="-26" y="-5" width="16" height="10" fill="${OR}"/><rect x="10" y="-5" width="16" height="10" fill="${OR}"/><path d="M0 6 V14 M-5 18 Q0 12 5 18" stroke="${INK}" stroke-width="2" fill="none"/>`,
    eye: `<path d="M-26 0 Q0 -22 26 0 Q0 22 -26 0Z" fill="none" stroke="${INK}" stroke-width="3"/><circle r="8" fill="${OR}"/><circle r="3" fill="#080e1a"/>`,
  }[k] ?? '';
}

// Constellation patches (2026-10-09): the stick figure from the real star positions (the same projection as the
// cards' charts, js/con-art.js), fitted inside the inner ring; stars sized by brightness, the brightest in orange.
// Each one on its own shade of night-blue twill, so the row of them doesn't read as one patch repeated.
const RAD = Math.PI / 180, vec = (ra, dec) => [Math.cos(dec * RAD) * Math.cos(ra * RAD), Math.cos(dec * RAD) * Math.sin(ra * RAD), Math.sin(dec * RAD)];
const CON_TWILL = ['#22265a', '#1a2f52', '#2d2257', '#16324a', '#2a2350', '#1c2a5e'];
function conGlyph(data) {
  const stars = data.stars, c = stars.reduce((a, s) => { const v = vec(s.ra, s.dec); return [a[0] + v[0], a[1] + v[1], a[2] + v[2]]; }, [0, 0, 0]);
  const L = Math.hypot(...c), z = c.map((x) => x / L), e = [-z[1], z[0], 0], eL = Math.hypot(...e) || 1, east = e.map((x) => x / eL);
  const north = [z[1] * east[2] - z[2] * east[1], z[2] * east[0] - z[0] * east[2], z[0] * east[1] - z[1] * east[0]];
  const proj = (ra, dec) => { const v = vec(ra, dec), d = v[0] * z[0] + v[1] * z[1] + v[2] * z[2]; return [-(v[0] * east[0] + v[1] * east[1] + v[2] * east[2]) / d, -(v[0] * north[0] + v[1] * north[1] + v[2] * north[2]) / d]; };
  const pts = stars.map((s) => proj(s.ra, s.dec)), xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const k = 37 / Math.max(1e-6, ...pts.map(([x, y]) => Math.hypot(x - cx, y - cy))); // farthest star 37 from the centre
  const at = (ra, dec) => { const [x, y] = proj(ra, dec); return [(x - cx) * k, (y - cy) * k]; };
  const lines = data.lines.map((pl) => `<polyline points="${pl.map(([ra, dec]) => at(ra, dec).map((n) => n.toFixed(1)).join(',')).join(' ')}"/>`).join('');
  const top = Math.min(...stars.map((s) => s.mag));
  const dots = stars.map((s) => { const [x, y] = at(s.ra, s.dec), r = s.mag <= 1 ? 3.6 : s.mag <= 2 ? 3 : s.mag <= 3 ? 2.4 : s.mag <= 4 ? 1.9 : 1.5;
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${s.mag === top ? OR : INK}"/>`; }).join('');
  return `<g fill="none" stroke="${INK}" stroke-opacity=".75" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${lines}</g>${dots}`;
}
// The Solar System patch: the Sun in the middle, three orbits, a planet on each.
const SOLAR_GLYPH = `<circle r="8" fill="${OR}"/><g fill="none" stroke="${INK}" stroke-opacity=".6" stroke-width="1.3"><circle r="16"/><circle r="24"/><circle r="32"/></g><circle cx="11.3" cy="-11.3" r="2.6" fill="${INK}"/><circle cx="-22" cy="9.5" r="3.4" fill="#c8502e"/><circle cx="18" cy="26.5" r="4.4" fill="${INK}"/><ellipse cx="18" cy="26.5" rx="8" ry="2" fill="none" stroke="${INK}" stroke-width="1.2" transform="rotate(-18 18 26.5)"/>`;

// Close Encounter (design/ufo.html): the saucer over a green beam, a few stars.
const UFO_ART = (id) => `<defs><linearGradient id="${id}beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7dff8a" stop-opacity=".55"/><stop offset="1" stop-color="#7dff8a" stop-opacity="0"/></linearGradient></defs>
  ${[[-30, -22], [26, -26], [-18, -34], [34, -6], [-36, 0], [12, -38]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1" fill="${INK}" opacity=".7"/>`).join('')}
  <path d="M-9 -4 L-24 30 L24 30 L9 -4Z" fill="url(#${id}beam)"/>
  <g transform="translate(0 -8) scale(1.7)"><path d="M-6 -1 Q-5 -7 0 -7 Q5 -7 6 -1Z" fill="#cfe8ff" fill-opacity=".85"/><ellipse rx="14" ry="4.2" fill="${INK}"/><ellipse rx="14" ry="4.2" fill="none" stroke="#c9b67a" stroke-width=".8"/><circle cx="-8" cy=".5" r="1.3" fill="#7dff8a"/><circle cx="0" cy="1.6" r="1.3" fill="#7dff8a"/><circle cx="8" cy=".5" r="1.3" fill="#7dff8a"/></g>`;
const SECRET_TWILL = { santa: '#6a1d1d', roadster: '#14284a', meteor: '#22265a', voyager: '#0f1b2a', dizzy: '#3a2259', voyager2: '#0f1b2a', pioneer10: '#2a1d0c', pioneer11: '#1f1a2e', newhorizons: '#101c2c', wow: '#2a0f12' };
const SLEIGH = '<g fill="#fff2b3">' + [0, 1, 2].map((k) => `<g transform="translate(${k * 13 - 30} ${4 - k * 2})"><path d="M0 5 Q3 1 8 2 L10 0 L9.5 4 Q11 6 8 7 L3 7 Z"/><path d="M8.5 1 l1.5 -3.5 M10 1 l2 -3" stroke="#fff2b3" stroke-width=".8"/></g>`).join('') + '</g><path d="M10 6 Q11 0 20 0 L30 0 Q34 0 33 5 L32 8 L12 8 Z" fill="#d94f38"/><path d="M8 11 L34 11 Q37 11 36 8" fill="none" stroke="#fff2b3" stroke-width="1.6"/><circle cx="24" cy="-3" r="3" fill="#fff2b3"/><circle cx="-28" cy="5" r="1.4" fill="#ff4a3a"/>';
const SECRET_ART = {
  santa: () => `<g transform="translate(-2 -6) scale(1.25)">${SLEIGH}</g>`,
  roadster: () => '<g transform="translate(-27 -12)"><path d="M2 16 Q4 8 16 7 L24 2 L36 2 L44 8 Q52 9 52 16 Z" fill="#d22b2b"/><circle cx="13" cy="17" r="4" fill="#111"/><circle cx="41" cy="17" r="4" fill="#111"/><circle cx="29" cy="6" r="3.4" fill="#f4f4f4"/></g>',
  meteor: () => '<path d="M-26 -22 L10 14" stroke="#fff2b3" stroke-width="3" stroke-linecap="round"/><circle cx="10" cy="14" r="4" fill="#fff"/>',
  voyager: () => '<circle r="18" fill="#2a1a08" stroke="#e2b53c" stroke-width="7"/><circle r="4" fill="#e2b53c"/><circle cx="26" cy="-20" r="2.4" fill="#8fd0ff"/>',
  dizzy: () => '<path d="M0 0 m-4 0 a4 4 0 1 1 8 0 a8 8 0 1 1 -16 0 a12 12 0 1 1 24 0 a16 16 0 1 1 -32 0" fill="none" stroke="#fff2b3" stroke-width="2.4"/>',
  // Deep-space secrets (2026-10-09): drawn at the same fidelity as the other secret patches.
  // Voyager 2 · Grand Tour: the golden record (grooves, label, centre hole), its dotted path past the four giants.
  voyager2: () => '<path d="M-38 22 Q-10 -2 14 -6 Q30 -9 38 -26" fill="none" stroke="#fff2b3" stroke-opacity=".55" stroke-width="1.2" stroke-dasharray="1.5 3"/>'
    + [[-26, 12, 3.2, '#d9a066'], [-8, 2, 2.6, '#e8cf9a'], [10, -5, 2.2, '#9fd4dc'], [26, -14, 2.2, '#5c86d6']].map(([x, y, r, c]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`).join('')
    + '<g transform="translate(0 8)"><circle r="17" fill="#2a1a08" stroke="#e2b53c" stroke-width="6"/>' + [11, 8.5, 6].map((r) => `<circle r="${r}" fill="none" stroke="#e2b53c" stroke-opacity=".35" stroke-width=".6"/>`).join('') + '<circle r="3.6" fill="#e2b53c"/><circle r="1" fill="#2a1a08"/></g>',
  // The Plaque · Pioneer 10: the gold plaque with its line drawing of two people beside the probe's outline.
  pioneer10: () => '<rect x="-30" y="-20" width="60" height="38" rx="3" fill="#c9a24a" stroke="#f4d27a" stroke-width="1.6"/>'
    + '<g fill="none" stroke="#3a2a10" stroke-width="1.2" stroke-linecap="round"><circle cx="-6" cy="-10" r="2.4"/><path d="M-6 -7.5 V3 M-6 -4 L-10 1 M-6 -4 L-2 1 M-6 3 L-8.5 12 M-6 3 L-3.5 12"/><circle cx="4" cy="-9" r="2.2"/><path d="M4 -6.8 V3 M4 -4 L1 1 M4 -4 L7 1 M4 3 L2 12 M4 3 L6 12"/>'
    + '<path d="M14 -12 L24 -12 M19 -12 V8 M14 8 L24 8"/><path d="M-26 14 L26 14" stroke-dasharray="1.5 2.5"/><circle cx="-24" cy="-14" r="1.6"/><path d="M-24 -14 L-14 -16 M-24 -14 L-18 -6"/></g>',
  // Ringside · Pioneer 11: Saturn, its ring passing behind and in front, and the little probe on its way past.
  pioneer11: () => '<ellipse rx="34" ry="9" fill="none" stroke="#c9b67a" stroke-width="3" transform="rotate(-18)"/><circle r="17" fill="#d9a066"/>'
    + '<path d="M-16 -4 Q0 -8 16 -4 M-15 4 Q0 0 15 4" stroke="#b07a40" stroke-width="2" fill="none"/>'
    + '<path d="M-33 6 A34 9 0 0 0 33 -6" fill="none" stroke="#efe0a8" stroke-width="3" transform="rotate(-18)"/>'
    + '<g transform="translate(26 -26)"><ellipse rx="5" ry="2" fill="none" stroke="#fff2b3" stroke-width="1.4" transform="rotate(-30)"/><path d="M0 0 L6 4" stroke="#fff2b3" stroke-width="1.2"/></g>',
  // Heart of Pluto · New Horizons: Pluto with its pale heart (Tombaugh Regio), Charon behind, the probe's dish passing.
  newhorizons: () => '<circle cx="24" cy="-20" r="7" fill="#9a9a96"/><circle r="22" fill="#c08a5c"/>'
    + '<path d="M2 -2 C2 -10 12 -12 14 -4 C16 -12 26 -8 22 2 C19 9 10 13 8 16 C6 12 0 6 2 -2Z" fill="#f4e6cc"/>'
    + '<path d="M-20 -6 Q-12 -12 -4 -10 M-18 8 Q-10 4 -4 10" stroke="#8a5a36" stroke-width="2.4" fill="none" stroke-linecap="round"/>'
    + '<g transform="translate(-26 -24) rotate(-20)"><path d="M-4 3 L4 3 L0 -3 Z" fill="#c9d8e6"/><path d="M-5 -1 A5 5 0 0 1 5 -1" fill="none" stroke="#fff2b3" stroke-width="1.2"/></g>',
  // Wow! · the 1977 signal: the printout's "6EQUJ5" with Jerry Ehman's red circle and "Wow!" in the margin.
  wow: () => '<rect x="-30" y="-22" width="60" height="44" rx="2" fill="#efe6cf"/>'
    + [-14, -6, 2, 10].map((y) => `<path d="M-26 ${y} H26" stroke="#c9bf9f" stroke-width=".6"/>`).join('')
    + '<text x="-2" y="2" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="11" font-weight="600" fill="#2a2a2a" letter-spacing="1">6EQUJ5</text>'
    + '<ellipse cx="-2" cy="-2" rx="22" ry="9" fill="none" stroke="#d22b2b" stroke-width="1.6" transform="rotate(-4)"/>'
    + '<text x="16" y="17" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="10" fill="#d22b2b">Wow!</text>',
};
let uid = 0;
// The patch as an SVG string. locked: a faint stitch outline (not earned yet). date: replaces the group along the
// bottom ("EARNED 07 OCT 2026"). stitch: adds the thread that draws the border on (the earning moment).
export function patchSvg(a, opts = {}) {
  const { locked = false, date = '', stitch = false } = opts;
  const con = a.con && a.con !== 'solar' ? CON_BY_ID.get(a.con) : null;
  const g0 = GROUPS[groupOf(a)], g = con ? { ...g0, c: CON_TWILL[[...CON_BY_ID.keys()].indexOf(a.con) % CON_TWILL.length] } : a.id === 'ufo' ? { ...g0, c: '#123a2a' } : SECRET_TWILL[a.id] ? { ...g0, c: SECRET_TWILL[a.id] } : g0, id = `pt${uid++}`, R = 60, fossil = a.id === 'fossil' || a.id === 'ufo' || !!SECRET_ART[a.id];
  // Fossil Hunter (design/fossil-patch.html A): the T. rex skeleton art, centred on its bones, no inner ring.
  const ic = SECRET_ART[a.id] ? SECRET_ART[a.id](id) : a.id === 'ufo' ? UFO_ART(id) : fossil ? '<image href="assets/art/fossils/patch.svg" x="-46" y="-17.5" width="92" height="43"/>' : con ? conGlyph(con.data) : a.con === 'solar' ? SOLAR_GLYPH : glyph(GLYPH[a.id], a.icon);
  if (locked) {
    const ghost = ic.replace(/fill="(?!none)[^"]*"/g, 'fill="none"').replace(/<(polygon|rect|circle|path|ellipse|polyline|text)/g, '<$1 stroke="#627a8b" stroke-width="1.5"');
    // Not earned yet (playtest 2026-10-09, Sevaan: the empty ones should look better): the patch before it's
    // stitched. Its twill, faint; the name already marked out round the top; the icon as an outline; and for
    // the ones that count something, the border stitched part-way round with "3 / 10" along the bottom.
    const C = 2 * Math.PI * (R - 3), pr = opts.prog && opts.prog[1] > 1 ? Math.max(0, Math.min(1, opts.prog[0] / opts.prog[1])) : 0;
    const name = a.name.toUpperCase(), nameSize = name.length > 16 ? 8.5 : name.length > 12 ? 9.5 : 11;
    return `<svg class="patch-svg" viewBox="-64 -64 128 128" aria-hidden="true"><defs><path id="${id}t" d="M-42 0 A42 42 0 0 1 42 0"/><path id="${id}b" d="M-41 0 A41 41 0 0 0 41 0"/>
      <pattern id="${id}w" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="3" height="3" fill="${g.c}"/><rect width="1.4" height="3" fill="#ffffff0c"/></pattern></defs>
      <circle r="${R - 3}" fill="url(#${id}w)" fill-opacity=".55"/><circle r="${R - 3}" fill="#080f1b" fill-opacity=".35"/>
      <circle r="${R - 3}" fill="none" stroke="#bcb585" stroke-opacity=".5" stroke-width="1.2" stroke-dasharray="3 3"/>
      ${pr > 0 ? `<circle r="${R - 3}" fill="none" stroke="#efe4bb" stroke-width="3.2" stroke-linecap="round" stroke-dasharray="${(pr * C).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90)"/>` : ''}
      <circle r="${R - 22}" fill="none" stroke="#bcb585" stroke-opacity=".25" stroke-width=".9" stroke-dasharray="1.6 1.6"/>
      <text font-family="SC Label, Arial Narrow, sans-serif" font-size="${nameSize}" letter-spacing="2" fill="#bcb585" fill-opacity=".7" text-anchor="middle"><textPath href="#${id}t" startOffset="50%">${esc(name)}</textPath></text>
      ${pr > 0 ? `<text font-family="SC Label, Arial Narrow, sans-serif" font-size="9" letter-spacing="2" fill="${OR}" text-anchor="middle" dy="7"><textPath href="#${id}b" startOffset="50%">${opts.prog[0]} / ${opts.prog[1]}</textPath></text>` : ''}
      <g opacity=".6" transform="scale(.82)">${ghost.replace(/#627a8b/g, '#bcb585')}</g></svg>`;
  }
  // Higher fidelity (2026-10-08, Sevaan): a real embroidered patch.
  //  · merrowed edge: a dense satin wrap of short slanted threads in two shades, with a soft shadow under the rim
  //  · twill: woven diagonal threads plus a fine fabric noise, shaded darker toward the edge
  //  · embroidery (icon and lettering): thread texture, a raised feel (light from the top left, a shadow below)
  //  · a running-stitch ring inside the border
  const n = 160, rim = R - 1, rIn = R - 8;
  const merrow = Array.from({ length: n }, (_, i) => { const t = (i / n) * Math.PI * 2, t2 = t + 0.075; const c = i % 2 ? '#d9cc98' : '#efe4bb';
    return `<line x1="${(Math.cos(t) * rIn).toFixed(2)}" y1="${(Math.sin(t) * rIn).toFixed(2)}" x2="${(Math.cos(t2) * rim).toFixed(2)}" y2="${(Math.sin(t2) * rim).toFixed(2)}" stroke="${c}"/>`; }).join('');
  const name = a.name.toUpperCase(), nameSize = name.length > 16 ? 8.5 : name.length > 12 ? 9.5 : 11;
  const lift = `filter="url(#${id}e)"`;
  return `<svg class="patch-svg" viewBox="-64 -64 128 128" aria-hidden="true"><defs><path id="${id}t" d="M-42 0 A42 42 0 0 1 42 0"/><path id="${id}b" d="M-41 0 A41 41 0 0 0 41 0"/>
    <pattern id="${id}w" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="3" height="3" fill="${g.c}"/><rect width="1.4" height="3" fill="#ffffff10"/><rect x="1.4" width=".4" height="3" fill="#00000022"/></pattern>
    <radialGradient id="${id}s" r="1"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".38"/></radialGradient>
    <radialGradient id="${id}h" cx=".35" cy=".25" r=".9"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <filter id="${id}n" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="1.6 .35" numOctaves="2" seed="${uid}"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .22 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>
    <filter id="${id}e" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="2.2 .5" numOctaves="1" seed="${uid + 3}" result="thr"/>
      <feColorMatrix in="thr" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .35 -.05" result="thrA"/>
      <feComposite in="thrA" in2="SourceGraphic" operator="in" result="thrIn"/>
      <feComposite in="SourceGraphic" in2="thrIn" operator="arithmetic" k1="0" k2="1" k3="-.6" k4="0" result="textured"/>
      <feGaussianBlur in="SourceAlpha" stdDeviation=".7" result="b"/><feOffset in="b" dx=".5" dy="1" result="o"/>
      <feFlood flood-color="#000" flood-opacity=".55"/><feComposite in2="o" operator="in" result="sh"/>
      <feMerge><feMergeNode in="sh"/><feMergeNode in="textured"/></feMerge></filter>
    ${stitch ? `<mask id="${id}m"><circle class="patch-thread" r="${R - 3}" fill="none" stroke="#fff" stroke-width="12" pathLength="100" transform="rotate(-90)"/></mask>` : ''}</defs>
    <circle r="${R + 1.5}" fill="#00000066" transform="translate(.5 2.5)"/>
    <circle r="${R}" fill="#c9bb86"/><g stroke-width="1.15" stroke-linecap="round"${stitch ? ` mask="url(#${id}m)"` : ''}>${merrow}</g>
    <circle r="${rim}" fill="none" stroke="#7d7148" stroke-width=".6" opacity=".6"/>
    <circle r="${rIn - .2}" fill="url(#${id}w)"/><circle r="${rIn - .2}" fill="#000" filter="url(#${id}n)"/><circle r="${rIn - .2}" fill="url(#${id}s)"/>
    <circle r="${rIn - .3}" fill="none" stroke="#00000055" stroke-width="1.2"/>
    <circle r="${rIn - 1.6}" fill="none" stroke="${INK}" stroke-opacity=".45" stroke-width=".7" stroke-dasharray="1.8 1.4"/>
    ${fossil ? '' : `<circle r="${R - 22}" fill="none" stroke="${INK}" stroke-opacity=".3" stroke-width=".9" stroke-dasharray="1.6 1.6"/>`}
    <g ${lift}><text font-family="SC Label, Arial Narrow, sans-serif" font-size="${nameSize}" letter-spacing="2" fill="${INK}" text-anchor="middle"><textPath href="#${id}t" startOffset="50%">${esc(name)}</textPath></text>
    <text font-family="SC Label, Arial Narrow, sans-serif" font-size="8.5" letter-spacing="2" fill="${OR}" text-anchor="middle" dy="7"><textPath href="#${id}b" startOffset="50%">${esc(date || (a.sub ?? g.t).toUpperCase())}</textPath></text>
    ${fossil ? ic : `<g transform="scale(.82)">${ic}</g>`}</g>
    <circle r="${R}" fill="url(#${id}h)" pointer-events="none"/></svg>`;
}
// The patch wrapped with its finish layer (gold / holo sheen), as used on the wall, the detail view and the moment.
export function patchHtml(a, opts = {}) {
  const f = opts.locked ? '' : finishOf(a);
  return `<span class="patch${f ? ` patch--${f}` : ''}${opts.locked ? ' patch--locked' : ''}">${patchSvg(a, opts)}</span>`;
}
export const fmtEarned = (t) => `EARNED ${new Date(t).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}`;
