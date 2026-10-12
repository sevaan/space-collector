// Observer stats (Plus, 2026-10-11, design/plans.html): your history under the sky, from the sighting log.
// computeStats(sightings, byKey, nightKey) -> numbers; statsHtml(st) -> the panel; posterCanvas(st, year) -> a
// 1080 × 1350 "your sky in YEAR" image to share. No network; the map uses js/geo.js's coarse outlines.
import { LAND } from './geo.js?v=0.1.514';
import { TIER_INFO } from './rarity.js?v=0.1.514';

const RANK = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function computeStats(sightings, byKey, nightKey, year = null) {
  const list = sightings.filter((s) => !s.sim && (year == null || new Date(s.time).getFullYear() === year)).sort((a, b) => a.time - b.time);
  const nights = new Map(), first = new Map(), places = new Map(), months = new Array(12).fill(0);
  for (const s of list) {
    const nk = String(nightKey(s.time, s.lon ?? 0));
    if (!nights.has(nk)) { nights.set(nk, { t: s.time, n: 0, cards: new Set() }); months[new Date(s.time).getMonth()]++; }
    const N = nights.get(nk); N.n++; N.cards.add(s.cardKey);
    if (!first.has(s.cardKey)) first.set(s.cardKey, s);
    if (s.lat != null && s.lon != null) { const k = `${s.lat.toFixed(1)},${s.lon.toFixed(1)}`; const p = places.get(k) ?? { lat: s.lat, lon: s.lon, n: 0 }; p.n++; places.set(k, p); }
  }
  const finds = [...first.values()].map((s) => ({ s, c: byKey.get(s.cardKey) })).filter((x) => x.c);
  const rarest = finds.sort((a, b) => (RANK[b.c.tier] ?? 0) - (RANK[a.c.tier] ?? 0) || a.s.time - b.s.time).slice(0, 5);
  const busiest = [...nights.values()].sort((a, b) => b.cards.size - a.cards.size)[0] ?? null;
  // Longest run of consecutive observing nights.
  const days = [...new Set(list.map((s) => Math.floor((s.time - 12 * 3600e3) / 86400e3)))].sort((a, b) => a - b);
  let run = 0, best = 0; for (let i = 0; i < days.length; i++) { run = i && days[i] === days[i - 1] + 1 ? run + 1 : 1; best = Math.max(best, run); }
  return { sightings: list.length, cards: first.size, nights: nights.size, places: [...places.values()], months, rarest, busiest, bestRun: best, since: list[0]?.time ?? null, year };
}

function mapSvg(places, w = 340, h = 170) {
  const X = (lon) => ((lon + 180) / 360) * w, Y = (lat) => ((90 - lat) / 180) * h;
  const land = LAND.map(([, poly]) => `<path d="M${poly.map(([lo, la]) => `${X(lo).toFixed(1)} ${Y(la).toFixed(1)}`).join('L')}Z"/>`).join('');
  const dots = places.map((p) => `<circle cx="${X(p.lon).toFixed(1)}" cy="${Y(p.lat).toFixed(1)}" r="${Math.min(7, 2.5 + Math.log2(p.n + 1))}" fill="#fa8127" stroke="#080f1b" stroke-width="1"/>`).join('');
  return `<svg viewBox="0 0 ${w} ${h}" class="st-map" aria-label="Where you've observed"><rect width="${w}" height="${h}" rx="10" fill="#0c1a2e"/><g fill="#1f3550">${land}</g>${dots}</svg>`;
}

export function statsHtml(st) {
  const max = Math.max(1, ...st.months), since = st.since ? new Date(st.since).toLocaleDateString([], { month: 'long', year: 'numeric' }) : '';
  const tile = (n, label) => `<div class="st-tile"><b>${Number(n).toLocaleString()}</b><small>${label}</small></div>`;
  return `<div class="st-tiles">${tile(st.cards, 'cards')}${tile(st.nights, 'nights out')}${tile(st.sightings, 'sightings')}${tile(st.places.length, st.places.length === 1 ? 'place' : 'places')}</div>
    ${since ? `<p class="st-since">Observing since ${esc(since)}${st.bestRun > 1 ? ` · longest run ${st.bestRun} nights in a row` : ''}</p>` : ''}
    <div class="st-head">Nights out by month</div>
    <div class="st-bars">${st.months.map((n, i) => `<div class="st-bar"><span style="height:${(n / max) * 100}%"></span><small>${MONTHS[i][0]}</small></div>`).join('')}</div>
    <div class="st-head">Where you've looked up</div>${mapSvg(st.places)}
    <div class="st-head">Rarest finds</div>
    <div class="st-rare">${st.rarest.map(({ s, c }) => { const t = TIER_INFO[c.tier] ?? TIER_INFO.common; return `<div><span style="color:${t.color}">◆ ${esc(t.label)}</span><b>${esc(c.title ?? c.name)}</b><small>${new Date(s.time).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</small></div>`; }).join('') || '<div>Your first catch will show here.</div>'}</div>
    ${st.busiest ? `<p class="st-since">Best night: ${new Date(st.busiest.t).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}, ${st.busiest.cards.size} cards.</p>` : ''}`;
}

// "Your sky in YEAR": a portrait image in the card style for the share sheet.
export function posterCanvas(st, rankName = '') {
  const W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  const grd = g.createRadialGradient(W * .3, H * .2, 50, W * .5, H * .5, H); grd.addColorStop(0, '#14284a'); grd.addColorStop(1, '#080f1b'); g.fillStyle = grd; g.fillRect(0, 0, W, H);
  let seed = 7; const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 260; i++) { g.globalAlpha = .2 + r() * .6; g.fillStyle = '#fff2b3'; g.beginPath(); g.arc(r() * W, r() * H, .6 + r() * 2.2, 0, 7); g.fill(); } g.globalAlpha = 1;
  g.strokeStyle = '#c9a24a'; g.lineWidth = 6; g.strokeRect(40, 40, W - 80, H - 80);
  g.fillStyle = '#fa8127'; g.font = '500 34px "SC Label", "Arial Narrow", sans-serif'; g.textAlign = 'center';
  g.fillText(`SPACE COLLECTOR · ${st.year ?? new Date().getFullYear()}`, W / 2, 130);
  g.fillStyle = '#fff2b3'; g.font = '400 96px "SC Display", Impact, sans-serif'; g.fillText('YOUR SKY', W / 2, 250); g.fillText(`IN ${st.year ?? new Date().getFullYear()}`, W / 2, 350);
  const big = [[st.cards, 'CARDS'], [st.nights, 'NIGHTS OUT'], [st.sightings, 'SIGHTINGS'], [st.places.length, 'PLACES']];
  big.forEach(([n, l], i) => { const x = 270 + (i % 2) * 540, y = 520 + Math.floor(i / 2) * 230; g.fillStyle = '#fff2b3'; g.font = '400 120px "SC Display", Impact, sans-serif'; g.fillText(Number(n).toLocaleString(), x, y); g.fillStyle = '#9fb3c8'; g.font = '500 36px "SC Label", "Arial Narrow", sans-serif'; g.fillText(l, x, y + 56); });
  const top = st.rarest[0]; if (top) { const t = TIER_INFO[top.c.tier] ?? TIER_INFO.common; g.fillStyle = t.color; g.font = '500 36px "SC Label", "Arial Narrow", sans-serif'; g.fillText(`RAREST FIND · ${t.label.toUpperCase()}`, W / 2, 1060); g.fillStyle = '#fff2b3'; g.font = '400 64px "SC Display", Impact, sans-serif'; g.fillText(String(top.c.title ?? top.c.name).toUpperCase().slice(0, 26), W / 2, 1140); }
  if (rankName) { g.fillStyle = '#9fb3c8'; g.font = '500 34px "SC Label", "Arial Narrow", sans-serif'; g.fillText(`OBSERVER RANK · ${rankName.toUpperCase()}`, W / 2, 1250); }
  return c;
}
