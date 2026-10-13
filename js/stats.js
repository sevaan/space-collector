// Observer stats (free for everyone, 2026-10-12; was Plus): your history under the sky, from the sighting log.
// computeStats(sightings, byKey, nightKey) -> numbers; statsHtml(st) -> the panel. No network; the map uses js/geo.js's
// coarse outlines. The yearly poster was dropped (2026-10-12, Sevaan).
import { LAND } from './geo.js?v=0.1.543';
import { TIER_INFO } from './rarity.js?v=0.1.543';

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
    <div class="st-rare">${st.rarest.map(({ s, c }) => { const t = TIER_INFO[c.tier] ?? TIER_INFO.common; return `<div><span style="color:${t.color}">${t.gem} ${esc(t.label)}</span><b>${esc(c.title ?? c.name)}</b><small>${new Date(s.time).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</small></div>`; }).join('') || '<div>Your first catch will show here.</div>'}</div>
    ${st.busiest ? `<p class="st-since">Best night: ${new Date(st.busiest.t).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}, ${st.busiest.cards.size} cards.</p>` : ''}`;
}

// "Your sky in YEAR": a portrait image in the card style for the share sheet.
