// Retro space-age cards. Text remains live; the foil follows pointer or optional phone tilt.
import { fallWords } from './last-chance.js?v=0.1.766';
import { sfx } from './sfx.js?v=0.1.766';
import { cardArt } from './art.js?v=0.1.766';
import { TIER_INFO } from './rarity.js?v=0.1.766';
import { SET_BY_ID } from './sets.js?v=0.1.766';
import { TYPE_LABEL, orbitStats, sizeLabel, formatDate, titleCase } from './facts.js?v=0.1.766';
import { FLEET_ABOUT, debrisOf, roleOf, ownerWord, titleFor, factFor, yearsUp, lapsPerDay, thirdStat, richText, seriesKeyOf } from './lore.js?v=0.1.766';
import { artFileFor } from './art-keys.js?v=0.1.766';
import { ART_FILES, ART_STARS } from './art-files.js?v=0.1.766';
import { stampsIn, fleetLevel, fleetThresholds, sightingKeys } from './card-model.js?v=0.1.766';
import { nightsIn } from './observation.js?v=0.1.766';
import { CON_BY_ID, conProgress } from './constellations.js?v=0.1.766';
import { SHINY } from './shiny.js?v=0.1.766';
import { conArt, cometArt } from './con-art.js?v=0.1.766';
import { CON_FIGURES } from './con-figures.js?v=0.1.766';
// The animal/symbol figure belongs to the completed (gold) constellation card only (2026-10-05): a single
// star's card draws just the star pattern with its star marked, so the figure is a reward for finishing the set.
// A star card's constellation figure comes into focus as you collect the constellation's stars (design/con-focus.html B).
function conFocus(o, owned) {
  const con = CON_BY_ID.get(o.con); if (!con || !CON_FIGURES.has(o.con)) return {};
  const have = owned ? con.stars.filter((k) => owned.has(k)).length : 1;
  const lit = new Set(con.stars.filter((k) => owned?.has(k)).map((k) => Number(String(k).replace('star:hip', ''))).filter(Boolean));
  return { figure: `assets/art/con/${o.con}.webp`, focus: have / con.stars.length, ...(owned ? { lit } : {}) };
}
const conFig = (id) => (CON_FIGURES.has(id) ? { figure: `assets/art/con/${id}.webp` } : {});

// The footer says the card's level, not a bare count (collectors 2026-10-11: Saturn on 7 nights looked like a first
// sighting): "SILVER · 7 NIGHTS", "GOLD · 12 NIGHTS"; a first-level card just counts its nights, "1 NIGHT".
function seenLine(level, nights, count) {
  const n = nights || count, unit = nights ? `NIGHT${n === 1 ? '' : 'S'}` : `TIME${n === 1 ? '' : 'S'}`;
  return level === 'silver' || level === 'gold' ? `<b class="lvl lvl--${level}">${level.toUpperCase()}</b> · ${n} ${unit}` : `${n} ${unit}`;
}
// Levels count observing nights (local noon to noon): bronze 1, silver 3, gold 10. Before
// 2026-10-01 levels counted sightings (5 silver, 25 gold); anything earned that way is kept.
export function levelFor(nights) {
  return nights >= 10 ? 'gold' : nights >= 3 ? 'silver' : nights >= 1 ? 'bronze' : 'none';
}
const LEGACY_UNTIL = Date.UTC(2026, 9, 1);
const RANK = { none: 0, bronze: 1, silver: 2, gold: 3 };
export function cardLevel(sightings) {
  const real = sightings.filter((s) => !s.sim);
  const old = real.filter((s) => s.time < LEGACY_UNTIL).length;
  const legacy = old >= 25 ? 'gold' : old >= 5 ? 'silver' : 'none';
  const now = levelFor(nightsIn(real));
  return RANK[legacy] > RANK[now] ? legacy : now;
}
// Illustrated art (assets/art/cards, one image shared by every card of a kind) once the card is
// revealed; the drawn art in js/art.js is the fallback and the "not yet collected" silhouette.
export function artImage(o, size = 'full') {
  const file = artFileFor(o, { [o.id]: seriesKeyOf(o) });
  return ART_FILES.has(file) ? `assets/art/cards/${size === 'small' ? 'sm/' : ''}${file}.webp` : null;
}
// A few of the picture's own stars twinkle (positions found by scripts/import-art.py). The layer has the
// picture's shape and is scaled like object-fit: cover, so each sparkle lands on its star.
// Hand-placed glints for pictures whose sky the import script found no stars in (the big close-ups fill
// the frame with glare). Kept here so a re-run of scripts/import-art.py doesn't wipe them.
const STAR_CORNERS = [[0.08, 0.12], [0.12, 0.78], [0.91, 0.14], [0.89, 0.72], [0.05, 0.45], [0.95, 0.46]];
const ART_STARS_EXTRA = {
  dnepr: { r: 1.519, s: [[0.15, 0.13], [0.08, 0.45], [0.78, 0.62], [0.93, 0.42], [0.52, 0.78]] },
  'planet-jupiter': { r: 1.4907, s: [[0.07, 0.15], [0.1, 0.6], [0.9, 0.12], [0.92, 0.55], [0.86, 0.35]] },
  'star-achernar': { r: 1.4907, s: STAR_CORNERS }, 'star-altair': { r: 1.4907, s: STAR_CORNERS },
  'star-antares': { r: 1.4907, s: STAR_CORNERS }, 'star-vega': { r: 1.4907, s: STAR_CORNERS },
  'star-deneb': { r: 1.4907, s: [[0.08, 0.12], [0.1, 0.85], [0.92, 0.12], [0.9, 0.85], [0.2, 0.62]] },
};
function artStars(o) {
  const file = artFileFor(o, { [o.id]: seriesKeyOf(o) }), st = ART_STARS[file]?.s?.length ? ART_STARS[file] : ART_STARS_EXTRA[file];
  if (!st?.s.length) return '';
  const seed = (Number(o.id) || 7) % 97;
  return `<div class="art-stars" style="--ar:${st.r}">${st.s.map(([x, y], i) => `<i style="left:${(x * 100).toFixed(2)}%;top:${(y * 100).toFixed(2)}%;--d:${(((i * 37 + seed) % 50) / 10).toFixed(1)}s;--t:${(2.6 + ((i * 13 + seed) % 20) / 10).toFixed(1)}s"></i>`).join('')}</div>`;
}
// Not found yet (2026-10-07, Sevaan: no more generic placeholders): the real picture, but hidden behind heavy blur
// and darkness, so you can sense the shape and colour without seeing it. css/cards.css .card-art-image--locked.
export function lockedArt(o, shown, accent, size = 'full') {
  const src = !shown && artImage(o, size);
  return src ? `<span class="art-locked"><img class="card-art-image card-art-image--locked" src="${src}" alt="" loading="lazy" decoding="async"></span>` : cardArt(o, { accent, silhouette: !shown });
}
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const orbitIcon = '<svg viewBox="0 0 32 24" fill="none" aria-hidden="true"><circle cx="16" cy="12" r="7"/><ellipse cx="16" cy="12" rx="15" ry="4.5" transform="rotate(-30 16 12)"/></svg>';

// Preview exposes the artwork and fact without claiming the card was earned.
// Mission card helpers (2026-10-14). Orbital speed from laps a day (circular orbit): v = 2πa / T.
const speedKmh = (laps) => { const T = 86400 / laps, a = Math.cbrt(398600.4418 * (T / (2 * Math.PI)) ** 2); return 2 * Math.PI * a / T * 3600; };
// A star's surface temperature: known values for the bright stars and the Sun, else from its B-V colour (Ballesteros 2012).
const TEMP_K = { sun: 5772, 'star:sirius': 9940, 'star:canopus': 7350, 'star:arcturus': 4290, 'star:alpha-centauri': 5790, 'star:vega': 9600, 'star:capella': 4970, 'star:rigel': 12100, 'star:procyon': 6530, 'star:achernar': 15000, 'star:betelgeuse': 3600, 'star:hadar': 25000, 'star:altair': 7700, 'star:acrux': 28000, 'star:aldebaran': 3910, 'star:antares': 3400, 'star:spica': 22400, 'star:pollux': 4670, 'star:fomalhaut': 8590, 'star:deneb': 8500, 'star:mimosa': 27000, 'star:regulus': 12460, 'star:polaris': 6000 };
const tempK = (o) => TEMP_K[o.key] ?? (o.bv != null ? 4600 * (1 / (0.92 * o.bv + 1.7) + 1 / (0.92 * o.bv + 0.62)) : null);
// The colour-temperature strip (Sevaan loved it): red-cool to blue-hot, the star marked on it.
function tempStrip(o) {
  if (o.type !== 'star' && o.type !== 'sun') return '';
  const K = tempK(o); if (!K) return '';
  const f = Math.max(0, Math.min(1, Math.log(K / 2500) / Math.log(30000 / 2500))), C = Math.round((K - 273) / 100) * 100;
  return `<div class="card__temp"><i><b style="left:${(f * 100).toFixed(1)}%"></b></i><span><span>COOL · 2,000 °C</span><em>${C.toLocaleString('en-US')} °C</em><span>30,000 °C · HOT</span></span></div>`;
}
// Last chance (js/last-chance.js): a red bar over the picture while it's falling; once it has fallen out of the
// catalogue, a "Burned up" stamp on the card you kept.
function lcMark(o) {
  if (!o.fallAt) return '';
  const day = new Date(o.fallAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase();
  if (o.archived && Date.now() > o.fallAt - 5 * 86400e3) return `<span class="card__burned">BURNED UP ~${day}</span>`;
  return `<span class="card__lc">LAST CHANCE · ${fallWords(o.fallAt).toUpperCase()}</span>`;
}
export function renderCard(o, opts = {}) {
  const sightings = (opts.sightings ?? []).filter((s) => !s.sim);
  // A constellation card is earned by its stars: opts.ownedKeys = card keys you own; opts.sightings = theirs.
  const conCard = o.natural === 'constellation', prog = conCard ? conProgress(o, opts.ownedKeys ?? new Set()) : null;
  const caught = conCard ? prog.level === 'gold' : sightings.length > 0; // a constellation joins your collection only when complete
  const shinyOf = o.launches ? null : sightings.find((x) => x.shiny && SHINY[x.shiny])?.shiny; // a shiny sighting makes the card shiny (js/shiny.js); fleet cards never are
  const revealed = caught || (opts.preview && !o.story); // a story's picture stays hidden until you find it
  const AS = opts.mini ? 'small' : 'full'; // opts.mini: the same card shrunk into a Collection tile (small pictures, no sparkles)
  const extinct = opts.forceExtinct || !!o.decay;
  const fleet = !!o.launches, stamps = fleet ? stampsIn(sightings) : null;
  const level = opts.forceLevel ?? (conCard ? prog.level : fleet ? fleetLevel(o.family, stamps.size) : cardLevel(sightings));
  const tier = o.story ? { gem: '❖', label: 'Story', color: '#3fc7b5' } : TIER_INFO[o.tier] ?? TIER_INFO.common; // story cards (js/stories.js) wear their own teal label
  const set = SET_BY_ID[o.set] ?? { name: 'Field archive', color: '#d74730' };
  const stats = orbitStats(o), age = yearsUp(o.launches ? { launch: o.launches[0]?.launch } : o), laps = lapsPerDay(o); // a fleet's age is from its FIRST launch, the date shown (Starlink said 6 years for 2019)
  // A crew count changes often and is not supplied by the orbital catalogue.
  const loreStat = thirdStat(o, sizeLabel(o.rcs), opts.seenMembers ?? 0);
  const third = loreStat.label === 'CREW' ? { label: 'LAUNCHED', value: o.launch?.slice(0, 4) ?? '—' } : loreStat;
  const secretStory = o.story && !caught; // a story you haven't found keeps its secret
  const title = secretStory ? 'Secret story' : titleFor(o);
  const el = document.createElement('article');
  el.className = `card card--retro${o.icon ? ' is-icon' : ''}${shinyOf ? ' shiny' : ''}${fleet ? ' card--fleet' : ''}${(conCard || fleet) && level === 'gold' ? ' gold-foil' : ''} tier-${o.tier ?? 'common'} level-${level}${revealed ? '' : ' uncaught'}${!caught ? ' not-owned' : ''}${extinct ? ' extinct' : ''}${title.length > 24 ? ' long-name' : ''}`;
  el.style.setProperty('--set', set.color);
  el.style.setProperty('--tier', tier.color);
  el.dataset.id = o.id;
  el.setAttribute('aria-label', `${title}, ${tier.label}, ${caught ? 'collected' : 'not collected'}`);
  // A constellation is collected the day its last star was found: the latest of each star's first sighting (QA 2026-10-08).
  const firstOf = (list) => Math.min(...list.map((s) => s.time));
  const byStar = new Map(); if (conCard) for (const s of sightings) byStar.set(s.cardKey, Math.min(byStar.get(s.cardKey) ?? Infinity, s.time));
  const first = !caught ? null : conCard && byStar.size ? Math.max(...byStar.values()) : firstOf(sightings);
  const firstDate = first != null ? new Date(first).toLocaleDateString('en-GB', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase() : '';
  const nat = !!o.natural;
  const identifier = nat ? o.code : o.members ? `${o.members.length.toLocaleString('en-US')} SATELLITES` : o.runOf > 1 ? `NO. ${o.runNo} OF ${o.runOf}` : `NORAD ${o.id}`;
  const identity = o.type === 'story' ? (secretStory ? 'Hidden somewhere in the sky' : o.when) : nat ? (conCard ? (o.system ? 'Planetary system' : o.zodiac ? 'Zodiac constellation' : 'Constellation') : o.type === 'star' ? `Star in ${o.constellation}` : o.type === 'deepsky' ? o.kind : o.type === 'comet' ? 'Comet' : o.type === 'sun' ? 'Star' : o.type === 'moon' ? 'Natural satellite' : 'Planet') : fleet ? 'Satellite fleet' : o.type === 'rocket-body' && o.parent ? `Carried ${titleCase(o.parent)}${o.launch ? ` · ${o.launch.slice(0, 4)}` : ''}` : o.type === 'debris' && o.launch ? `${debrisOf(o)?.what ?? TYPE_LABEL[o.type] ?? 'Debris'} · ${o.launch.slice(0, 4)}` : TYPE_LABEL[o.type] ?? 'Orbital object'; // what it carried and when, so same-name stages differ
  const ageText = age == null ? '' : age === 0 ? 'Less than a year ago' : `${age} ${age === 1 ? 'year' : 'years'} ago`;
  // Fleet cards: the ringed dot is your newest stamp; say which launch that was (the dots alone don't).
  const lk = fleet ? latestStamp(sightings) : null, ll = lk ? o.launches.find((l) => l.key === lk) : null;
  const latestLine = ll ? `Launched ${launchDay(ll.launch).replace(/ (\d{4})$/, ', $1')}` : ''; // sits right of the grid's heading
  const factBlock = fleet ? dotMap(o, stamps, lk, `${stamps.size} / ${o.launches.length} stamped` /* no "N more for Silver" (2026-10-12, Sevaan: it wrapped and took room from the art) */, latestLine) + (FLEET_ABOUT[o.family] ? `<div class="card__fact fl-about"><p>${richText(FLEET_ABOUT[o.family])}</p></div>` : '')
    : conCard ? `<div class="card__fact"><p>${richText(prog.level === 'gold' ? factFor(o).replace(/Collect all \d+ of its stars to turn this card \*\*gold\*\*\./, `You've found **all ${prog.total}** of its stars.`).replace(/Collect the Sun, the Moon and all \*\*seven\*\* planets to turn this card \*\*gold\*\*\./, `You've seen **all nine** of them with your own eyes.`) : factFor(o))}</p><p class="con-progress">${o.stars.map((k) => `<i class="${(opts.ownedKeys ?? new Set()).has(k) ? 'on' : ''}"></i>`).join('')}<span>${prog.have} / ${prog.total} ${o.system ? 'WORLDS' : 'STARS'}${prog.level === 'gold' ? ' · COMPLETE' : ''}</span></p></div>`
    : secretStory ? '<div class="card__fact"><p>Somewhere in the sky there\'s a story waiting. Keep looking, at night, in odd places, on special days.</p></div>'
    : `<div class="card__fact"><p>${richText(factFor(o))}</p></div>`; // the fact shows on cards you don't have too: it's what makes you want one (2026-10-13, Sevaan)
  // Long facts take room from the art, not the card: each line past three shrinks the art window (about
  // 52 characters a line), so every card stays the same height.
  // Fleet cards with a big launch grid plus the fleet's fact can run past the card's 42em: once it's on the page,
  // take the overflow out of the art window so every card stays the same height (2026-10-09).
  if (fleet) requestAnimationFrame(() => {
    const art = el.querySelector('.card__art'), face = el.querySelector('.card__face'); if (!art || !face || !el.isConnected) return;
    const fs = parseFloat(getComputedStyle(el).fontSize), over = face.offsetHeight / fs - 42;
    if (over > 0.05) art.style.height = `${Math.max(4, art.offsetHeight / fs - over).toFixed(2)}em`;
  });
  if (!fleet && revealed) { const len = factFor(o).replace(/\*\*/g, '').length; const extra = Math.max(0, Math.ceil(len / 52) - 3); if (extra) el.style.setProperty('--fact-extra', extra); }
  // Mission card front (2026-10-14, Sevaan: design/card-redesign.html style A): the picture first at a fixed 4:3 with the
  // rarity and set on it, the name, a plain "what it is" line, a colour-temperature strip for stars, four numbers, the
  // fact, and the footer.
  const fromIss = o.issDeploy && o.launch ? `${/^ISS OBJECT/.test(o.name ?? '') ? 'Unidentified CubeSat' : roleOf(o)} · from the ISS · ${o.launch.slice(0, 4)}` : null;
  const sub = fromIss ?? (nat || fleet || o.type === 'rocket-body' || o.type === 'debris' ? identity : [ownerWord(o.owner, o.year ?? Number(o.launch?.slice(0, 4))), roleOf(o).replace(/^./, (ch) => (ownerWord(o.owner) ? ch.toLowerCase() : ch))].filter(Boolean).join(' ').replace(/^./, (ch) => ch.toUpperCase()) + (o.launch ? ` · ${o.launch.slice(0, 4)}` : ''));
  const kmh = laps ? Math.round(speedKmh(laps) / 100) * 100 : null;
  const four = secretStory ? [] : nat ? o.stats.map(([label, value, unit]) => [label, value, unit])
    : fleet ? [['HEIGHT', stats ? stats.alt.toLocaleString('en-US') : '—', 'km'], ['SPEED', kmh ? kmh.toLocaleString('en-US') : '—', 'km/h'], ['FIRST', o.launch?.slice(0, 4) ?? '—', ''], ['LAUNCHES', String(o.launches.length), '']]
    : [['HEIGHT', stats ? stats.alt.toLocaleString('en-US') : '—', 'km'], ['SPEED', kmh ? kmh.toLocaleString('en-US') : '—', 'km/h'], ['LAPS A DAY', laps ? laps.toFixed(laps < 10 ? 1 : 0) : '—', ''], [o.type === 'rocket-body' || o.type === 'debris' ? 'YEARS UP' : 'LAUNCHED', o.type === 'rocket-body' || o.type === 'debris' ? (age == null ? '—' : String(age)) : (o.launch?.slice(0, 4) ?? '—'), '']];
  el.classList.add('card--mission');
  el.innerHTML = `
  <div class="card__rotator"><div class="card__face">
    <div class="card__art" data-art-slot aria-hidden="true">${lcMark(o)}${conCard && o.system ? (revealed && artImage(o) ? `<img class="card-art-image" src="${artImage(o, AS)}" alt="" decoding="async">${opts.mini ? '' : artStars(o)}` : lockedArt(o, revealed, set.color, opts.mini ? 'small' : undefined)) : conCard ? conArt(o.data, null, revealed ? conFig(o.con) : {}) : o.type === 'comet' && revealed ? cometArt(o.key) : o.type === 'deepsky' && revealed && !artImage(o) && CON_BY_ID.get(o.conId) ? conArt(CON_BY_ID.get(o.conId).data, null, { mark: o }) : o.con && !o.skyName && revealed && CON_BY_ID.get(o.con) ? conArt(CON_BY_ID.get(o.con).data, o.hip, conFocus(o, opts.ownedKeys)) : revealed && artImage(o) ? `<img class="card-art-image" src="${artImage(o, AS)}" alt="" decoding="async">${opts.mini ? '' : artStars(o)}` : lockedArt(o, revealed, set.color, opts.mini ? 'small' : undefined)}${shinyOf ? `<span class="shiny-tag">✦ SHINY · ${esc(SHINY[shinyOf].label.toUpperCase())}</span>` : ''}<span class="m-chip m-tier card__tier"><i aria-hidden="true">${tier.gem}</i>${esc(tier.label.toUpperCase())}${o.icon ? '<b class="card__icon-badge">ICON</b>' : ''}</span><span class="m-chip m-set card__setbar"><span><span>${esc(set.name.toUpperCase())}</span></span></span><div class="card__foil"></div></div>
    <div class="card__heading"><h3 class="card__name">${esc(title)}</h3>
    <div class="card__identity"><span>${esc(sub)}</span><span class="card__mono">${esc(identifier)}</span></div></div>
    ${tempStrip(o)}
    <div class="card__stats m4" style="--n:${four.length}">${four.map(([label, value, unit], i) => `<div><span class="card__label">${esc(label)}</span><b${nat ? statClass(value, unit, i) : ''}>${esc(value)}${unit ? `<small>${esc(unit)}</small>` : ''}</b></div>`).join('')}</div>
    ${factBlock}
    <div class="card__footer"><span class="card__status${caught ? ' is-collected' : ''}"><span class="card__status-icon" aria-hidden="true">${caught ? '✓' : ''}</span><span>${caught ? `COLLECTED · ${esc(firstDate)}` : 'NOT YET COLLECTED'}</span>${caught ? `<span class="card__seen-count">${seenLine(level, conCard || fleet ? 0 : nightsIn(sightings), sightings.length)}</span>` : ''}</span><span class="card__brand">${o.setNumber && o.setSize > 1 ? `<small class="card__no">${String(o.setNumber).padStart(String(o.setSize).length, '0')}/${o.setSize}</small>` : ''}SPACE COLLECTOR</span></div>
    <div class="card__shine"></div><div class="card__glare"></div>
    <div class="card__back" aria-hidden="true"><div class="back-holo"></div><div class="back-glare"></div></div>
    ${extinct ? `<div class="card__stamp">REENTERED${o.decay ? `<small>${esc(formatDate(o.decay)).toUpperCase()}</small>` : ''}</div>` : ''}
  </div></div>`;
  return el;
}

// Natural-object stats: a number and its short unit stay on one line ("10.7 h"). Only long figures
// step down a size: 10+ characters, or 8+ in the narrower second and third columns. Words (a
// constellation name) can wrap.
function statClass(value, unit, i = 0) {
  const v = String(value);
  // Words never break mid-word ("Aquariu/s"): long single words shrink to fit on one line instead.
  if (!unit) return v.length > 9 ? (/\s/.test(v) ? ' class="small"' : ' class="fit small"') : v.length > 6 ? ' class="fit long"' : '';
  const n = (v + ' ' + unit).length;
  return n >= 10 || (i > 0 && n >= 8) ? ' class="fit long"' : ' class="fit"';
}

// ---------- fleet cards ----------

// "5 more for Silver" (2026-10-06, Sevaan: "Silver at 10" read as a mystery).
function nextLevel(family, level, have = 0) {
  const [, s, g] = fleetThresholds(family);
  const more = (n) => `${Math.max(1, n - have)} MORE FOR`;
  return level === 'bronze' ? `${more(s)} SILVER` : level === 'silver' ? `${more(g)} GOLD` : level === 'gold' ? 'TOP LEVEL' : 'STAMP ONE FOR BRONZE';
}
// The stamp earned most recently (by when you first saw that launch).
function stampHistory(sightings) {
  const first = new Map();
  for (const s of sightings) {
    if (s.sim) continue;
    const k = sightingKeys(s).stampKey;
    if (k && (!first.has(k) || s.time < first.get(k))) first.set(k, s.time);
  }
  return [...first].map(([key, time]) => ({ key, time })).sort((a, b) => b.time - a.time);
}
const latestStamp = (sightings) => stampHistory(sightings.filter((s) => !s.sim))[0]?.key ?? null;

// Every launch in the fleet as a dot, oldest to newest; stamped ones filled, the newest ringed.
// summary ("4 / 421 stamped · SILVER AT 10") sits between the first and last launch years, under the dots.
function dotMap(o, stamps, latest, summary = '', latestLine = '') {
  // Huge fleets (Starlink, 400+ launches) get finer dots in about six rows, so the grid doesn't eat the picture (2026-10-14).
  const n = o.launches.length, cols = n > 200 ? Math.min(72, Math.ceil(n / 6)) : n > 60 ? 18 : Math.min(14, Math.max(10, n)), gap = n > 200 ? '.1em' : '.45em';
  const dots = o.launches.map((l) => `<i class="${stamps.has(l.key) ? 'on' : ''}${l.key === latest ? ' latest' : ''}"></i>`).join('');
  const y0 = o.launches[0]?.launch?.slice(0, 4) ?? '', y1 = o.launches.at(-1)?.launch?.slice(0, 4) ?? '';
  return `<div class="fl-dots"><div class="fl-head"><span class="card__note-label">EVERY LAUNCH</span>${latestLine ? `<span class="fl-latest"><i></i>${esc(latestLine)}</span>` : ''}</div><div class="fl-grid" style="--cols:${cols};--gap:${gap}">${dots}</div><div class="fl-years"><span>${esc(y0)}</span>${summary ? `<span class="fl-sum">${esc(summary)}</span>` : ''}<span>${esc(y1)}</span></div></div>`;
}

const shortDay = (t) => new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase();
const launchDay = (iso) => (iso ? new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'unknown date');
function inkStamp(stamp, launch, i, big = false) {
  const cospar = stamp.key.split(':')[1] ?? stamp.key;
  const r = [-8, 6, -3, 10, -12, 4, 8, -6][i % 8];
  const when = launch?.launch ? launchDay(launch.launch).toUpperCase().replace(/ \d{4}$/, '') : '';
  return `<div class="ink-stamp${big ? ' big' : ''}" style="--r:${big ? -6 : r}deg"><span><b>${esc(cospar)}</b>${esc(when)}<br>SEEN ${esc(shortDay(stamp.time))}</span></div>`;
}

// Card viewer: your stamps for a fleet card, newest first and larger, then the rest, then empty slots.
export function renderPassport(o, sightings) {
  const el = document.createElement('section');
  el.className = 'passport';
  const history = stampHistory(sightings);
  const byKey = new Map(o.launches.map((l) => [l.key, l]));
  const level = fleetLevel(o.family, history.length);
  const [newest, ...rest] = history;
  const left = o.launches.length - history.length;
  const empty = Math.min(left, rest.length % 4 ? 4 - (rest.length % 4) : 4);
  const next = nextLevel(o.family, level).toLowerCase().replace(/^./, (c) => c.toUpperCase());
  el.innerHTML = `<h2>Passport · ${history.length} of ${o.launches.length} launches</h2>
    ${newest ? `<div class="passport__latest">${inkStamp(newest, byKey.get(newest.key), 0, true)}<p>Newest stamp: <b>launch ${esc(newest.key.split(':')[1] ?? newest.key)}</b>${byKey.get(newest.key) ? `, ${byKey.get(newest.key).n} satellites launched ${esc(launchDay(byKey.get(newest.key).launch))}` : ''}.<br>Seen ${esc(new Date(newest.time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }))}. ${level === 'gold' ? 'Top level reached.' : `${esc(next)} launches.`}</p></div>` : ''}
    ${rest.length || empty ? `<div class="passport__stamps">${rest.map((st, i) => inkStamp(st, byKey.get(st.key), i + 1)).join('')}${'<div class="ink-stamp blank"><span>?</span></div>'.repeat(empty)}</div>` : ''}`;
  return el;
}

export function renderCardTile(o, opts = {}) {
  const sightings = (opts.sightings ?? []).filter((s) => !s.sim);
  // A constellation card is earned by its stars: opts.ownedKeys = card keys you own; opts.sightings = theirs.
  const conCard = o.natural === 'constellation', prog = conCard ? conProgress(o, opts.ownedKeys ?? new Set()) : null;
  const caught = conCard ? prog.level === 'gold' : sightings.length > 0; // a constellation joins your collection only when complete
  const shinyOf = o.launches ? null : sightings.find((x) => x.shiny && SHINY[x.shiny])?.shiny; // a shiny sighting makes the card shiny (js/shiny.js)
  const tier = TIER_INFO[o.tier] ?? TIER_INFO.common;
  const set = SET_BY_ID[o.set] ?? { name: 'Field archive', color: '#d74730' };
  const title = titleFor(o);
  const tile = document.createElement('button');
  tile.type = 'button';
  const conDone = (conCard && caught) || (!!o.launches && fleetLevel(o.family, stampsIn(sightings).size) === 'gold');
  const shinyTile = !o.launches && sightings.some((x) => x.shiny && SHINY[x.shiny]);
  const lvl = caught && !conCard && !o.launches ? cardLevel(sightings) : null, lvlUp = lvl === 'silver' || lvl === 'gold'; // a level badge on the tile (collectors 2026-10-11)
  tile.className = `card-tile card-tile--retro${o.icon ? ' is-icon' : ''}${caught ? ' is-owned' : ''}${conDone ? ' gold-foil' : ''}${shinyTile ? ' shiny' : ''}${lvlUp ? ` lvl-${lvl}` : ''}`;
  tile.style.setProperty('--set', set.color); tile.style.setProperty('--tier', tier.color);
  const hide = o.story && !caught; // an unfound story stays a secret, read aloud too (QA 2026-10-16)
  tile.setAttribute('aria-label', `${hide ? 'Secret story' : title}, ${hide ? 'Story' : tier.label}, ${caught ? `collected, ${sightings.length} sightings` : 'not collected'}. View card`);
  tile.innerHTML = `${lvlUp ? `<span class="tile-lvl tile-lvl--${lvl}">${lvl.toUpperCase()}</span>` : ''}<span class="card-tile__set">${esc(set.name)}</span><span class="card-tile__art">${conCard && o.system ? (caught && artImage(o, 'small') ? `<img class="card-art-image" src="${artImage(o, 'small')}" alt="" loading="lazy" decoding="async">` : lockedArt(o, caught, set.color, 'small')) : o.natural === 'constellation' ? conArt(o.data, null, caught ? conFig(o.con) : {}) : o.type === 'comet' && caught ? cometArt(o.key) : o.type === 'deepsky' && caught && !artImage(o, 'small') && CON_BY_ID.get(o.conId) ? conArt(CON_BY_ID.get(o.conId).data, null, { mark: o }) : o.con && !o.skyName && caught && CON_BY_ID.get(o.con) ? conArt(CON_BY_ID.get(o.con).data, o.hip, {}) : caught && artImage(o, 'small') ? `<img class="card-art-image" src="${artImage(o, 'small')}" alt="" loading="lazy" decoding="async">` : lockedArt(o, caught, set.color, 'small')}</span><span class="card-tile__body"><span class="card-tile__tier"><i aria-hidden="true">${tier.gem}</i> ${tier.label}</span><span class="card-tile__name">${esc(title)}</span>${opts.sub ? `<span class="card-tile__sub">${esc(opts.sub)}</span>` : ''}<span class="card-tile__status">${caught ? (o.natural === 'constellation' ? `✓ ${new Set(sightings.map((x) => x.cardKey)).size} of ${o.stars.length} ${o.system ? 'worlds' : 'stars'}` : o.launches ? `✓ ${stampsIn(sightings).size} of ${o.launches.length} launches` : `✓ Collected ${new Date(Math.min(...sightings.map((s) => s.time))).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`) : conCard && prog.have ? `${prog.have} of ${prog.total} ${o.system ? 'worlds' : 'stars'} found` : 'Not yet collected'}</span></span>`;
  return tile;
}

// Tilt, glare and foil follow the finger (or phone tilt, via attachGyro) through a spring, so the card
// overshoots a touch as you move it and wobbles gently back to rest when you let go.
const FOLLOW = { k: 0.085, d: 0.27 };   // while handled: quick and tight
const SETTLE = { k: 0.03, d: 0.13 };    // let go: slower, with a little wobble
const MAX_RX = 15, MAX_RY = 19;         // degrees
export function attachTilt(el, { scroll = false } = {}) { // scroll: let a finger still scroll the page (the logbook card)
  const cur = { x: .5, y: .5, o: 0 }, vel = { x: 0, y: 0, o: 0 }, want = { x: .5, y: .5, o: 0 };
  let spring = SETTLE, raf = 0;
  const state = { touching: false };
  const write = () => {
    const { x, y } = cur, o = Math.max(0, Math.min(1, cur.o));
    el.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
    el.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
    el.style.setProperty('--rx', `${((.5 - y) * 2 * MAX_RX).toFixed(2)}deg`);
    el.style.setProperty('--ry', `${((x - .5) * 2 * MAX_RY).toFixed(2)}deg`);
    el.style.setProperty('--bgx', `${(37 + x * 26).toFixed(1)}%`);
    el.style.setProperty('--bgy', `${(33 + y * 34).toFixed(1)}%`);
    el.style.setProperty('--hyp', Math.min(1, Math.hypot(x - .5, y - .5) * 2).toFixed(3));
    el.style.setProperty('--o', o.toFixed(3));
  };
  const step = () => {
    let moving = false;
    for (const key of ['x', 'y', 'o']) {
      vel[key] += (want[key] - cur[key]) * spring.k;
      vel[key] *= 1 - spring.d;
      cur[key] += vel[key];
      if (Math.abs(vel[key]) > 1e-4 || Math.abs(want[key] - cur[key]) > 1e-3) moving = true;
    }
    write();
    raf = moving ? requestAnimationFrame(step) : 0;
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(step); };
  const set = (px, py) => {
    if (reducedMotion()) { px = .5; py = .5; }
    want.x = px; want.y = py; want.o = 1; spring = FOLLOW;
    el.classList.add('active');
    kick();
  };
  const reset = () => {
    want.x = .5; want.y = .5; want.o = 0; spring = SETTLE;
    el.classList.remove('active');
    kick();
  };
  const onMove = (e) => {
    if (reducedMotion() || el.dataset.swiping) return;
    if (e.pointerType !== 'mouse') state.touching = true;
    const b = el.getBoundingClientRect();
    set(Math.max(0, Math.min(1, (e.clientX - b.left) / b.width)), Math.max(0, Math.min(1, (e.clientY - b.top) / b.height)));
  };
  const release = () => { state.touching = false; };
  const events = { pointermove: onMove, pointerdown: onMove, pointerleave: reset, pointercancel: release, pointerup: (e) => { if (e.pointerType !== 'mouse') release(); } };
  for (const [name, handler] of Object.entries(events)) el.addEventListener(name, handler);
  // iOS can still start a page scroll from a touch; stop it so a finger on the card only tilts it.
  const noScroll = (e) => e.preventDefault();
  if (!scroll) el.addEventListener('touchmove', noScroll, { passive: false });
  write();
  return {
    set, reset, get touching() { return state.touching; },
    destroy() { for (const [name, handler] of Object.entries(events)) el.removeEventListener(name, handler); el.removeEventListener('touchmove', noScroll); cancelAnimationFrame(raf); raf = 0; cur.x = cur.y = .5; cur.o = 0; write(); },
  };
}

// Phone tilt moves the card and its foil. The resting angle is whatever the phone was at when the
// card opened, and it slowly follows you so the card settles back if you just change how you hold it.
// A finger on the card takes over until it lifts.
// Phone tilt is measured RELATIVE to however you're holding the phone when the card appears (flat, upright,
// pointed at the sky, upside down): the card starts level and moves only as you turn the phone from there.
// Raw beta/gamma angles jump near upright and upside down (gimbal lock), which threw the card to full tilt,
// so we work with the whole orientation as a quaternion and take the small turn about the phone's own
// x (top tips toward/away) and y (sides tip) axes. The resting pose drifts slowly toward how you hold it now.
const D2R = Math.PI / 180;
const qMul = (a, b) => [
  a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3],
  a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2],
  a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1],
  a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0]];
// DeviceOrientation is Z (alpha), then X' (beta), then Y'' (gamma).
const qFromEuler = (al, be, ga) => {
  const z = [Math.cos(al * D2R / 2), 0, 0, Math.sin(al * D2R / 2)];
  const x = [Math.cos(be * D2R / 2), Math.sin(be * D2R / 2), 0, 0];
  const y = [Math.cos(ga * D2R / 2), 0, Math.sin(ga * D2R / 2), 0];
  return qMul(qMul(z, x), y);
};
const qNorm = (q) => { const n = Math.hypot(...q) || 1; return q.map((v) => v / n); };
export function attachGyro(el, tilt) {
  let base = null, px = .5, py = .5;
  const onOri = (e) => {
    if (e.beta == null || e.gamma == null || reducedMotion() || tilt.touching) return;
    let q = qFromEuler(e.alpha ?? 0, e.beta, e.gamma);
    if (!base) base = q;
    if (q[0] * base[0] + q[1] * base[1] + q[2] * base[2] + q[3] * base[3] < 0) q = q.map((v) => -v); // same hemisphere
    // The resting pose drifts toward how you hold the phone now: slowly for small tilts, so they read as
    // tilt, but fast for big moves (lowering the phone after catching something overhead), so the card
    // settles flat again instead of staying cranked over with the holo at full blast.
    const dev = 2 * Math.acos(Math.min(1, Math.abs(q[0] * base[0] + q[1] * base[1] + q[2] * base[2] + q[3] * base[3]))) / D2R;
    const k = dev > 12 ? Math.min(0.2, 0.01 + (dev - 12) * 0.006) : 0.01;
    base = qNorm(base.map((v, i) => v + (q[i] - v) * k));
    // Turn from the resting pose, in the phone's own frame: conj(base) * q.
    let r = qMul([base[0], -base[1], -base[2], -base[3]], q);
    if (r[0] < 0) r = r.map((v) => -v);
    const ax = 2 * Math.asin(Math.max(-1, Math.min(1, r[1]))) / D2R; // about the phone's x axis (like beta)
    const ay = 2 * Math.asin(Math.max(-1, Math.min(1, r[2]))) / D2R; // about the phone's y axis (like gamma)
    const tx = .5 + Math.max(-1, Math.min(1, ay / 20)) * .5;
    const ty = .5 + Math.max(-1, Math.min(1, ax / 20)) * .5;
    px += (tx - px) * 0.5; py += (ty - py) * 0.5; // take the edge off sensor jitter; the spring does the rest
    tilt.set(px, py);
  };
  window.addEventListener('deviceorientation', onOri);
  return () => { window.removeEventListener('deviceorientation', onOri); tilt.reset(); };
}

// Throw an element off the top of the screen, starting at the finger's speed (dx, dy px over dt ms) and
// keeping it fully visible until it's gone. Returns the duration in ms. Used by the reveal and the collection viewer.
export function throwOff(el, dx, dy, dt) {
  const r = el.getBoundingClientRect(), dist = r.bottom + 40;               // until its bottom edge clears the top
  const v = Math.max(1.2, -dy / dt);                                        // px per ms, at least brisk
  const ms = Math.round(Math.min(300, Math.max(160, dist * 1.25 / v)));     // quick (2026-10-06: was 200–420 ms)
  const x = Math.max(-140, Math.min(140, dx * (ms / dt) * .5)), turn = Math.max(-14, Math.min(14, x / 10));
  el.animate([{ transform: 'translate(0, 0) rotate(0)' }, { transform: `translate(${x}px, ${-dist}px) rotate(${turn}deg)` }],
    { duration: ms, easing: 'cubic-bezier(.25,.4,.55,1)', fill: 'forwards' });
  return ms;
}
// Double-tap (or double-click) a card to flip it over and see its back; do it again to flip it back.
// onBack(backEl) dresses the back (a random poster, js/card-backs.js) each time it turns to the back.
// The back is pre-mirrored in CSS, so it reads correctly while the card faces away.
export function attachFlip(el, { onBack, onTap } = {}) {
  // onTap (2026-10-14, orbit view): a single tap, fired once it's clear no second tap is coming; a double tap flips.
  let flipped = false, busy = false, lastTap = 0, lastX = 0, lastY = 0, tapTimer = 0, downX = 0, downY = 0;
  const single = () => { clearTimeout(tapTimer); if (onTap) tapTimer = setTimeout(() => { if (!flipped) onTap(); }, 330); };
  el.addEventListener('pointerdown', (e) => { downX = e.clientX; downY = e.clientY; });
  const still = (e) => Math.hypot(e.clientX - downX, e.clientY - downY) < 10;
  const back = el.querySelector('.card__back');
  // Smooth back-and-forth (2026-10-14, Sevaan: flipping back and forth was janky): the old animation is dropped instead
  // of piling up (each one used to stay with fill: forwards), the faces swap on the frame the card is edge-on (read from
  // the animation's own clock, not a timer that drifts), and a double tap during a flip is queued, not ignored.
  let anim = null, queued = false;
  const flip = () => {
    if (!back) return;
    if (busy) { queued = true; return; }
    busy = true; flipped = !flipped; sfx('flip', { gain: 0.8 });
    if (flipped) onBack?.(back);
    const ms = reducedMotion() ? 1 : 520, from = flipped ? 0 : 180, to = flipped ? 180 : 360, show = flipped;
    anim?.cancel();
    anim = el.animate([
      { transform: `perspective(1600px) rotateY(${from}deg)`, easing: 'cubic-bezier(.45,0,.9,.6)' },
      { transform: `perspective(1600px) rotateY(${from + 90}deg)`, easing: 'cubic-bezier(.1,.4,.55,1)', offset: .5 },
      { transform: `perspective(1600px) rotateY(${to}deg)` }],
      { duration: ms, easing: 'linear', fill: 'forwards' });
    const a = anim; let swapped = false;
    const tick = () => {
      if (a !== anim) return;
      const t = a.currentTime ?? ms;
      if (!swapped && t >= ms / 2) { swapped = true; back.style.opacity = show ? '1' : ''; }
      if (t < ms && a.playState !== 'finished') { requestAnimationFrame(tick); return; }
      if (!swapped) back.style.opacity = show ? '1' : '';
      busy = false;
      if (queued) { queued = false; flip(); }
    };
    requestAnimationFrame(tick);
  };
  const onUp = (e) => {
    if (el.dataset.swiping || !still(e)) return;
    if (e.pointerType === 'mouse') { single(); return; } // mice: dblclick flips and cancels the single tap
    const now = performance.now();
    if (now - lastTap < 320 && Math.hypot(e.clientX - lastX, e.clientY - lastY) < 30) { lastTap = 0; clearTimeout(tapTimer); flip(); }
    else { lastTap = now; lastX = e.clientX; lastY = e.clientY; single(); }
  };
  const onDbl = (e) => { e.preventDefault(); clearTimeout(tapTimer); flip(); };
  el.addEventListener('pointerup', onUp);
  el.addEventListener('dblclick', onDbl);
  return {
    get flipped() { return flipped; },
    destroy() { el.removeEventListener('pointerup', onUp); el.removeEventListener('dblclick', onDbl); },
  };
}

// The real card, small (2026-10-13): returns a .mini-face element holding renderCard(o, { mini }) with `status` written
// into its footer. Size it with --mini-s (width / 280) on it or any ancestor.
export function miniCard(o, { sightings = [], ownedKeys, status = '', locked = false } = {}) {
  const card = renderCard(o, { sightings, ownedKeys, mini: true });
  const foot = card.querySelector('.card__footer');
  if (foot) foot.innerHTML = `<span class="mini-status">${esc(status)}</span>`;
  const face = document.createElement('span'); face.className = `mini-face${locked ? ' locked' : ''}`; face.appendChild(card);
  return face;
}
