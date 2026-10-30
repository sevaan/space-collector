// Observer stats (free for everyone, 2026-10-12; redesigned 2026-10-16, Sevaan: "could be better designed… say how many
// badges"). Your history under the sky, from the sighting log plus what the Collection page already knows (rank,
// patches, constellations, stories, albums). computeStats(sightings, byKey, nightKey, year, ctx) -> numbers;
// statsHtml(st) -> the panel. No network; the map uses js/geo.js’s coarse outlines.
import { LAND } from './geo.js?v=0.1.1429';
import { TIER_INFO, TIERS } from './rarity.js?v=0.1.1429';

const RANK = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const n = (x) => Number(x ?? 0).toLocaleString();
const plural = (k, one, many = `${one}s`) => `${n(k)} ${k === 1 ? one : many}`;
const STORY = { gem: '❖', label: 'Story', color: '#3fc7b5' }, tierOf = (c) => (c.story ? STORY : TIER_INFO[c.tier] ?? TIER_INFO.common); // story cards wear their own label, as on the card
const day = (t, o = { month: 'short', day: 'numeric', year: 'numeric' }) => new Date(t).toLocaleDateString([], o);

// ctx (optional): { cards, rank: { name, xp, next }, patches: [done, total], events, cons: [done, total],
// stories: [done, total], albums: { bronze, silver, gold, total }, title(c), art(c) }
export function computeStats(sightings, byKey, nightKey, year = null, ctx = {}) {
  const list = sightings.filter((s) => !s.sim && (year == null || new Date(s.time).getFullYear() === year)).sort((a, b) => a.time - b.time);
  const nights = new Map(), first = new Map(), places = new Map(), months = new Array(12).fill(0), nightsOf = new Map();
  for (const s of list) {
    const nk = String(nightKey(s.time, s.lon ?? 0));
    if (!nights.has(nk)) { nights.set(nk, { t: s.time, n: 0, cards: new Set() }); months[new Date(s.time).getMonth()]++; }
    const N = nights.get(nk); N.n++; N.cards.add(s.cardKey);
    if (!first.has(s.cardKey)) first.set(s.cardKey, s);
    if (!nightsOf.has(s.cardKey)) nightsOf.set(s.cardKey, new Set()); nightsOf.get(s.cardKey).add(nk);
    if (s.lat != null && s.lon != null) { const k = `${s.lat.toFixed(1)},${s.lon.toFixed(1)}`; const p = places.get(k) ?? { lat: s.lat, lon: s.lon, n: 0 }; p.n++; places.set(k, p); }
  }
  const finds = [...first.values()].map((s) => ({ s, c: byKey.get(s.cardKey) })).filter((x) => x.c);
  const rarest = finds.slice().sort((a, b) => (RANK[b.c.tier] ?? 0) - (RANK[a.c.tier] ?? 0) || a.s.time - b.s.time).slice(0, 5);
  // Best day by calendar date (2026-10-16, Sevaan): a morning Sun and an evening Earth on the 16th are one good day,
  // though by observing night (noon to noon) they fall on two different nights.
  const days2 = new Map(); for (const s of list) { const d = new Date(s.time), k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; if (!days2.has(k)) days2.set(k, { t: s.time, cards: new Set() }); days2.get(k).cards.add(s.cardKey); }
  const busiest = [...days2.values()].sort((a, b) => b.cards.size - a.cards.size || a.t - b.t)[0] ?? null;
  // Longest run of consecutive observing nights.
  const days = [...new Set(list.map((s) => Math.floor((s.time - 12 * 3600e3 - new Date(s.time).getTimezoneOffset() * 60000) / 86400e3)))].sort((a, b) => a - b); // local noon to noon (was UTC noon: one night in Tokyo or Sydney counted as two; bug hunt 2026-10-20)
  let run = 0, best = 0; for (let i = 0; i < days.length; i++) { run = i && days[i] === days[i - 1] + 1 ? run + 1 : 1; best = Math.max(best, run); }
  // The card you’ve come back to most (most nights), and your very first.
  const most = [...nightsOf.entries()].map(([k, ns]) => ({ c: byKey.get(k), nights: ns.size })).filter((x) => x.c).sort((a, b) => b.nights - a.nights)[0] ?? null;
  const firstCard = finds[0] ?? null;
  // The collection by rarity: owned of every card that rarity (story cards have their own count).
  const owned = new Set(first.keys()), tiers = TIERS.map((t) => ({ t, have: 0, all: 0 }));
  for (const c of ctx.cards ?? []) { if (c.story || c.archived) continue; const row = tiers[RANK[c.tier] ?? 0]; row.all++; if (owned.has(c.key)) row.have++; }
  const total = tiers.reduce((a, r) => a + r.all, 0);
  const shinies = new Set(list.filter((s) => s.shiny && !byKey.get(s.cardKey)?.launches).map((s) => s.cardKey)).size;
  return { sightings: list.length, cards: first.size, nights: nights.size, places: [...places.values()], months, rarest, busiest, bestRun: best, since: list[0]?.time ?? null, year,
    most, firstCard, tiers, total, shinies, ctx };
}

function mapSvg(places, w = 340, h = 170) {
  const X = (lon) => ((lon + 180) / 360) * w, Y = (lat) => ((90 - lat) / 180) * h;
  const land = LAND.map(([, poly]) => `<path d="M${poly.map(([lo, la]) => `${X(lo).toFixed(1)} ${Y(la).toFixed(1)}`).join('L')}Z"/>`).join('');
  const dots = places.map((p) => `<circle cx="${X(p.lon).toFixed(1)}" cy="${Y(p.lat).toFixed(1)}" r="${Math.min(7, 2.5 + Math.log2(p.n + 1))}" fill="#fa8127" stroke="#080f1b" stroke-width="1"/><circle cx="${X(p.lon).toFixed(1)}" cy="${Y(p.lat).toFixed(1)}" r="${Math.min(7, 2.5 + Math.log2(p.n + 1)) + 5}" fill="none" stroke="#fa8127" stroke-opacity=".35"/>`).join('');
  return `<svg viewBox="0 0 ${w} ${h}" class="st-map" aria-label="Where you’ve observed"><rect width="${w}" height="${h}" rx="10" fill="#0c1a2e"/><g fill="#1f3550">${land}</g>${dots}</svg>`;
}

export function statsHtml(st) {
  const x = st.ctx ?? {}, title = (c) => (x.title ? x.title(c) : c.title ?? c.name);
  const since = st.since ? day(st.since, { month: 'long', year: 'numeric' }) : '';
  const max = Math.max(1, ...st.months), nowM = new Date().getMonth();
  // Rank header, like the rank card: name, XP, how far to the next.
  // The rank as the Collection's slim dial card (2026-10-28, Sevaan; design/rank-compact.html A).
  const rk = x.rank, into = rk && rk.next ? Math.max(0, Math.min(1, (rk.xp - (rk.at ?? 0)) / (rk.next - (rk.at ?? 0)))) : 1;
  const rank = rk ? `<div class="st-rank lb-dial"><span class="lbd-ring"><svg viewBox="0 0 74 74"><circle cx="37" cy="37" r="32" fill="none" stroke="#24344a" stroke-width="5"/><circle cx="37" cy="37" r="32" fill="none" stroke="#fa8127" stroke-width="5" stroke-linecap="round" stroke-dasharray="${(into * 201.06).toFixed(1)} 202" transform="rotate(-90 37 37)"/><g stroke="#fff2b355" stroke-width="1.5"><line x1="37" y1="0" x2="37" y2="5"/><line x1="74" y1="37" x2="69" y2="37"/><line x1="37" y1="74" x2="37" y2="69"/><line x1="0" y1="37" x2="5" y2="37"/></g></svg><b>${rk.next ? `${Math.round(into * 100)}%<small>to next</small>` : 'Top<small>rank</small>'}</b></span><span class="lbd-m"><span class="lbd-l"><span class="lbd-name">${esc(rk.name)}</span><span class="lb-xp"><b>${n(rk.xp)}</b> XP</span></span><span class="lbd-l"><span class="lbd-to">${rk.next ? `${n(rk.next - rk.xp)} XP to <b>${esc(rk.nextName || 'the next rank')}</b>` : 'The top rank'}</span></span></span></div>` : '';
  // The collection, by rarity.
  const coll = `<section class="st-sec"><div class="st-head"><span>The collection</span><span class="st-big"><b>${n(st.cards)}</b> / ${n(st.total)} cards</span></div>
    <div class="st-tiers">${st.tiers.map((r) => { const t = TIER_INFO[r.t]; const pct = r.all ? r.have / r.all : 0; return `<div class="st-tier" style="--c:${t.color}"><span class="st-tl">${t.gem} ${esc(t.label)}</span><span class="st-tb"><i style="width:${Math.max(pct ? 2 : 0, pct * 100).toFixed(1)}%"></i></span><span class="st-tn">${n(r.have)} <small>/ ${n(r.all)}</small></span></div>`; }).join('')}</div></section>`;
  // Badges and goals: what you’ve earned beyond cards.
  const goal = (label, have, all, sub = '') => `<div class="st-goal"><b>${n(have)}${all != null ? `<small> / ${n(all)}</small>` : ''}</b><span>${esc(label)}</span>${sub ? `<em>${esc(sub)}</em>` : ''}${all ? `<i style="--p:${Math.min(1, have / all).toFixed(3)}"></i>` : ''}</div>`;
  const goals = `<section class="st-sec"><div class="st-head"><span>Earned</span></div><div class="st-goals">
    ${x.patches ? goal('Mission patches', x.patches[0], x.patches[1]) : ''}
    ${x.events != null ? goal(x.events === 1 ? 'Event badge' : 'Event badges', x.events, null, 'Meteor showers') : ''}
    ${x.cons ? goal('Constellations', x.cons[0], x.cons[1], 'Every star found') : ''}
    ${x.stories ? goal('Hidden stories', x.stories[0], x.stories[1]) : ''}
    ${goal(st.shinies === 1 ? 'Shiny card' : 'Shiny cards', st.shinies, null)}
    ${x.albums ? goal('Gold albums', x.albums.gold, x.albums.total, `${x.albums.silver} silver · ${x.albums.bronze} bronze`) : ''}
  </div></section>`;
  // Your time out there.
  const tiles = `<section class="st-sec"><div class="st-head"><span>Time under the sky</span>${since ? `<span class="st-since">since ${esc(since)}</span>` : ''}</div><div class="st-tiles">
    <div class="st-tile"><b>${n(st.nights)}</b><small>${st.nights === 1 ? 'night out' : 'nights out'}</small></div>
    <div class="st-tile"><b>${n(st.sightings)}</b><small>${st.sightings === 1 ? 'sighting' : 'sightings'}</small></div>
    <div class="st-tile"><b>${n(st.bestRun)}</b><small>Best night run</small></div>
    <div class="st-tile"><b>${n(st.places.length)}</b><small>${st.places.length === 1 ? 'place' : 'places'}</small></div></div>
    <div class="st-bars" aria-label="Nights out by month">${st.months.map((v, i) => `<div class="st-bar${i === nowM ? ' now' : ''}"><em>${v || ''}</em><span style="height:${(v / max) * 100}%"></span><small>${MONTHS[i][0]}</small></div>`).join('')}</div></section>`;
  // Highlights, each with its card’s picture.
  const thumb = (c) => { const u = x.art?.(c); return u ? `<img src="${u}" alt="" loading="lazy">` : `<span class="st-noart" style="color:${tierOf(c).color}">${c.natural === 'star' ? '✦' : tierOf(c).gem}</span>`; }; // stars have no painted picture: a mark, not an empty box (iOS playtest 2026-10-20)
  const hl = (label, c, line, tier) => c ? `<div class="st-hl">${thumb(c)}<div><small>${esc(label)}</small><b>${esc(title(c))}</b><span>${tier ? `<em style="color:${tierOf(c).color};font-style:normal">${tierOf(c).gem} ${tierOf(c).label}</em> · ` : ''}${esc(line)}</span></div></div>` : ''; /* the rarest find shows its rarity in its colour and shape (style audit 2026-10-28) */
  const top = st.rarest[0];
  const highlights = `<section class="st-sec"><div class="st-head"><span>Highlights</span></div><div class="st-hls">
    ${top ? hl('Rarest find', top.c, day(top.s.time), true) : ''}
    ${st.most && st.most.nights > 1 ? hl('Most seen', st.most.c, `On ${plural(st.most.nights, 'night')}`) : ''}
    ${st.firstCard ? hl('Your first card', st.firstCard.c, day(st.firstCard.s.time)) : ''}
    ${st.busiest ? `<div class="st-hl st-hl--day"><span class="st-cal"><small>${esc(day(st.busiest.t, { month: 'short' }))}</small><b>${new Date(st.busiest.t).getDate()}</b></span><div><small>Best day</small><b>${esc(day(st.busiest.t, { weekday: 'long', month: 'long', day: 'numeric' }))}</b><span>${plural(st.busiest.cards.size, 'card')} seen</span></div></div>` : ''}
  </div></section>`;
  const map = `<section class="st-sec"><div class="st-head"><span>Where you’ve looked up</span><span class="st-since">${plural(st.places.length, 'place')}</span></div>${mapSvg(st.places)}</section>`;
  const rare = st.rarest.length > 1 ? `<section class="st-sec"><div class="st-head"><span>Rarest finds</span></div><div class="st-rare">${st.rarest.map(({ s, c }) => { const t = tierOf(c); return `<div>${thumb(c)}<span class="st-rt" style="color:${t.color}">${t.gem} ${esc(t.label)}</span><b>${esc(title(c))}</b><small>${day(s.time, { month: 'short', day: 'numeric' })}</small></div>`; }).join('')}</div></section>` : '';
  if (!st.sightings) return `${rank}<p class="st-empty">Your stats start with your first card. Head outside on a clear night and collect something.</p>`;
  return `${rank}${coll}${goals}${highlights}${tiles}${map}${rare}`;
}
