// Retro space-age cards. Text remains live; the foil follows pointer or optional phone tilt.
import { cardArt } from './art.js?v=0.1.295';
import { TIER_INFO } from './rarity.js?v=0.1.295';
import { SET_BY_ID } from './sets.js?v=0.1.295';
import { TYPE_LABEL, orbitStats, sizeLabel, formatDate } from './facts.js?v=0.1.295';
import { titleFor, factFor, yearsUp, lapsPerDay, thirdStat, richText, seriesKeyOf } from './lore.js?v=0.1.295';
import { artFileFor } from './art-keys.js?v=0.1.295';
import { ART_FILES, ART_STARS } from './art-files.js?v=0.1.295';
import { stampsIn, fleetLevel, fleetThresholds, sightingKeys } from './card-model.js?v=0.1.295';
import { nightsIn } from './observation.js?v=0.1.295';
import { CON_BY_ID, conProgress } from './constellations.js?v=0.1.295';
import { SHINY } from './shiny.js?v=0.1.295';
import { conArt } from './con-art.js?v=0.1.295';
import { CON_FIGURES } from './con-figures.js?v=0.1.295';
// The animal/symbol figure belongs to the completed (gold) constellation card only (2026-10-05): a single
// star's card draws just the star pattern with its star marked, so the figure is a reward for finishing the set.
const conFig = (id) => (CON_FIGURES.has(id) ? { figure: `assets/art/con/${id}.webp` } : {});

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
function lockedArt(o, shown, accent, size = 'full') {
  const src = !shown && artImage(o, size);
  return src ? `<span class="art-locked"><img class="card-art-image card-art-image--locked" src="${src}" alt="" loading="lazy" decoding="async"></span>` : cardArt(o, { accent, silhouette: !shown });
}
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const orbitIcon = '<svg viewBox="0 0 32 24" fill="none" aria-hidden="true"><circle cx="16" cy="12" r="7"/><ellipse cx="16" cy="12" rx="15" ry="4.5" transform="rotate(-30 16 12)"/></svg>';

// Preview exposes the artwork and fact without claiming the card was earned.
export function renderCard(o, opts = {}) {
  const sightings = (opts.sightings ?? []).filter((s) => !s.sim);
  // A constellation card is earned by its stars: opts.ownedKeys = card keys you own; opts.sightings = theirs.
  const conCard = o.natural === 'constellation', prog = conCard ? conProgress(o, opts.ownedKeys ?? new Set()) : null;
  const caught = conCard ? prog.level === 'gold' : sightings.length > 0; // a constellation joins your collection only when complete
  const shinyOf = sightings.find((x) => x.shiny && SHINY[x.shiny])?.shiny; // a shiny sighting makes the card shiny (js/shiny.js)
  const revealed = caught || opts.preview;
  const extinct = opts.forceExtinct || !!o.decay;
  const fleet = !!o.launches, stamps = fleet ? stampsIn(sightings) : null;
  const level = opts.forceLevel ?? (conCard ? prog.level : fleet ? fleetLevel(o.family, stamps.size) : cardLevel(sightings));
  const tier = TIER_INFO[o.tier] ?? TIER_INFO.common;
  const set = SET_BY_ID[o.set] ?? { name: 'Field archive', color: '#d74730' };
  const stats = orbitStats(o), age = yearsUp(o), laps = lapsPerDay(o);
  // A crew count changes often and is not supplied by the orbital catalogue.
  const loreStat = thirdStat(o, sizeLabel(o.rcs), opts.seenMembers ?? 0);
  const third = loreStat.label === 'CREW' ? { label: 'LAUNCHED', value: o.launch?.slice(0, 4) ?? '—' } : loreStat;
  const title = titleFor(o);
  const el = document.createElement('article');
  el.className = `card card--retro${shinyOf ? ' shiny' : ''}${fleet ? ' card--fleet' : ''}${(conCard || fleet) && level === 'gold' ? ' gold-foil' : ''} tier-${o.tier ?? 'common'} level-${level}${revealed ? '' : ' uncaught'}${!caught ? ' not-owned' : ''}${extinct ? ' extinct' : ''}${title.length > 24 ? ' long-name' : ''}`;
  el.style.setProperty('--set', set.color);
  el.style.setProperty('--tier', tier.color);
  el.dataset.id = o.id;
  el.setAttribute('aria-label', `${title}, ${tier.label}, ${caught ? 'collected' : 'not collected'}`);
  const first = caught ? Math.min(...sightings.map((s) => s.time)) : null;
  const firstDate = first != null ? new Date(first).toLocaleDateString('en-GB', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase() : '';
  const nat = !!o.natural;
  const identifier = nat ? o.code : o.members ? `${o.members.length.toLocaleString('en-US')} SATELLITES` : `NORAD ${o.id}`;
  const identity = nat ? (conCard ? (o.system ? 'Planetary system' : o.zodiac ? 'Zodiac constellation' : 'Constellation') : o.type === 'star' ? `Star in ${o.constellation}` : o.type === 'sun' ? 'Star' : o.type === 'moon' ? 'Natural satellite' : 'Planet') : fleet ? 'Satellite fleet' : TYPE_LABEL[o.type] ?? 'Orbital object';
  const ageText = age == null ? '' : age === 0 ? 'Less than a year ago' : `${age} ${age === 1 ? 'year' : 'years'} ago`;
  // Fleet cards: the ringed dot is your newest stamp; say which launch that was (the dots alone don't).
  const lk = fleet ? latestStamp(sightings) : null, ll = lk ? o.launches.find((l) => l.key === lk) : null;
  const latestLine = ll ? `Launched ${launchDay(ll.launch).replace(/ (\d{4})$/, ', $1')}` : ''; // sits right of the grid's heading
  const factBlock = fleet ? dotMap(o, stamps, lk, `${stamps.size} / ${o.launches.length} stamped · ${nextLevel(o.family, level, stamps.size)}`, latestLine)
    : conCard ? `<div class="card__fact"><p>${richText(prog.level === 'gold' ? factFor(o).replace(/Collect all \d+ of its stars to turn this card \*\*gold\*\*\./, `You've found **all ${prog.total}** of its stars.`).replace(/Collect the Sun, the Moon and all \*\*seven\*\* planets to turn this card \*\*gold\*\*\./, `You've seen **all nine** of them with your own eyes.`) : factFor(o))}</p><p class="con-progress">${o.stars.map((k) => `<i class="${(opts.ownedKeys ?? new Set()).has(k) ? 'on' : ''}"></i>`).join('')}<span>${prog.have} / ${prog.total} ${o.system ? 'WORLDS' : 'STARS'}${prog.level === 'gold' ? ' · COMPLETE' : ''}</span></p></div>`
    : `<div class="card__fact"><p>${revealed ? richText(factFor(o)) : `Observe this ${esc((TYPE_LABEL[o.type] ?? 'object').toLowerCase())} in the live sky to add its story to your collection.`}</p></div>`;
  // Long facts take room from the art, not the card: each line past three shrinks the art window (about
  // 52 characters a line), so every card stays the same height.
  if (!fleet && revealed) { const len = factFor(o).replace(/\*\*/g, '').length; const extra = Math.max(0, Math.ceil(len / 52) - 3); if (extra) el.style.setProperty('--fact-extra', extra); }
  el.innerHTML = `
  <div class="card__rotator"><div class="card__face">
    <div class="card__setbar"><span>${orbitIcon}<span>${esc(set.name.toUpperCase())}</span></span><span class="card__tier"><i aria-hidden="true">${tier.gem}</i>${esc(tier.label.toUpperCase())}</span></div>
    <div class="card__heading"><h3 class="card__name">${String(o.id) === '25544' ? esc(title).replace('International Space Station', 'International<br>Space Station') : esc(title)}</h3>
    <div class="card__identity"><span>${esc(identity)}</span><span class="card__mono">${esc(identifier)}</span></div></div>
    <div class="card__art" data-art-slot aria-hidden="true">${conCard && o.system ? (revealed && artImage(o) ? `<img class="card-art-image" src="${artImage(o)}" alt="" decoding="async">${artStars(o)}` : lockedArt(o, revealed, set.color)) : conCard ? conArt(o.data, null, revealed ? conFig(o.con) : {}) : o.con && !o.skyName && revealed ? conArt(CON_BY_ID.get(o.con).data, o.hip, {}) : revealed && artImage(o) ? `<img class="card-art-image" src="${artImage(o)}" alt="" decoding="async">${artStars(o)}` : lockedArt(o, revealed, set.color)}${shinyOf ? `<span class="shiny-tag">✦ SHINY · ${esc(SHINY[shinyOf].label.toUpperCase())}</span>` : ''}<div class="card__foil"></div></div>
    ${nat ? `<div class="card__stats">${o.stats.map(([label, value, unit], i) => `<div><span class="card__label">${esc(label)}</span><b${statClass(value, unit, i)}>${esc(value)}${unit ? ` <small>${esc(unit)}</small>` : ''}</b></div>`).join('')}</div>` : `<div class="card__stats"><div><span class="card__label">MEAN ALTITUDE</span><b>${stats ? `${stats.alt.toLocaleString('en-US')} <small>km</small>` : '—'}</b></div><div><span class="card__label">ORBITS / DAY</span><b>${laps ? laps.toFixed(laps < 10 ? 1 : 0) : '—'}</b></div><div><span class="card__label">${esc(third.label)}</span><b>${esc(third.value)}</b>${/LAUNCH/.test(third.label) && ageText ? `<span class="card__stat-detail">${esc(ageText)}</span>` : ''}</div></div>`}
    ${factBlock}
    <div class="card__footer"><span class="card__status${caught ? ' is-collected' : ''}"><span class="card__status-icon" aria-hidden="true">${caught ? '✓' : ''}</span><span>${caught ? `COLLECTED · ${esc(firstDate)}` : 'NOT YET COLLECTED'}</span>${caught ? `<span class="card__seen-count">SEEN ${sightings.length} TIME${sightings.length === 1 ? '' : 'S'}</span>` : ''}</span><span class="card__brand">SPACE COLLECTOR</span></div>
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
  const n = o.launches.length, cols = n > 200 ? 36 : n > 60 ? 18 : Math.min(14, Math.max(10, n)), gap = n > 200 ? '.15em' : '.45em';
  const dots = o.launches.map((l) => `<i class="${stamps.has(l.key) ? 'on' : ''}${l.key === latest ? ' latest' : ''}"></i>`).join('');
  const y0 = o.launches[0]?.launch?.slice(0, 4) ?? '', y1 = o.launches.at(-1)?.launch?.slice(0, 4) ?? '';
  return `<div class="fl-dots"><div class="fl-head"><span class="card__note-label">EVERY ${esc(String(o.familyName).toUpperCase())} LAUNCH</span>${latestLine ? `<span class="fl-latest"><i></i>${esc(latestLine)}</span>` : ''}</div><div class="fl-grid" style="--cols:${cols};--gap:${gap}">${dots}</div><div class="fl-years"><span>${esc(y0)}</span>${summary ? `<span class="fl-sum">${esc(summary)}</span>` : ''}<span>${esc(y1)}</span></div></div>`;
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
  const shinyOf = sightings.find((x) => x.shiny && SHINY[x.shiny])?.shiny; // a shiny sighting makes the card shiny (js/shiny.js)
  const tier = TIER_INFO[o.tier] ?? TIER_INFO.common;
  const set = SET_BY_ID[o.set] ?? { name: 'Field archive', color: '#d74730' };
  const title = titleFor(o);
  const tile = document.createElement('button');
  tile.type = 'button';
  const conDone = (conCard && caught) || (!!o.launches && fleetLevel(o.family, stampsIn(sightings).size) === 'gold');
  const shinyTile = sightings.some((x) => x.shiny && SHINY[x.shiny]);
  tile.className = `card-tile card-tile--retro${caught ? ' is-owned' : ''}${conDone ? ' gold-foil' : ''}${shinyTile ? ' shiny' : ''}`;
  tile.style.setProperty('--set', set.color);
  tile.setAttribute('aria-label', `${title}, ${tier.label}, ${caught ? `collected, ${sightings.length} sightings` : 'not collected'}. View card`);
  tile.innerHTML = `<span class="card-tile__set">${esc(set.name)}</span><span class="card-tile__art">${conCard && o.system ? (caught && artImage(o, 'small') ? `<img class="card-art-image" src="${artImage(o, 'small')}" alt="" loading="lazy" decoding="async">` : lockedArt(o, caught, set.color, 'small')) : o.natural === 'constellation' ? conArt(o.data, null, caught ? conFig(o.con) : {}) : o.con && !o.skyName && caught ? conArt(CON_BY_ID.get(o.con).data, o.hip, {}) : caught && artImage(o, 'small') ? `<img class="card-art-image" src="${artImage(o, 'small')}" alt="" loading="lazy" decoding="async">` : lockedArt(o, caught, set.color, 'small')}</span><span class="card-tile__body"><span class="card-tile__tier">${tier.gem} ${tier.label}</span><span class="card-tile__name">${esc(title)}</span><span class="card-tile__status">${caught ? (o.natural === 'constellation' ? `✓ ${new Set(sightings.map((x) => x.cardKey)).size} of ${o.stars.length} ${o.system ? 'worlds' : 'stars'}` : o.launches ? `✓ ${stampsIn(sightings).size} of ${o.launches.length} launches` : `✓ Collected ${new Date(Math.min(...sightings.map((s) => s.time))).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`) : conCard && prog.have ? `${prog.have} of ${prog.total} ${o.system ? 'worlds' : 'stars'} found` : 'Not yet collected'}</span></span>`;
  return tile;
}

// Tilt, glare and foil follow the finger (or phone tilt, via attachGyro) through a spring, so the card
// overshoots a touch as you move it and wobbles gently back to rest when you let go.
const FOLLOW = { k: 0.085, d: 0.27 };   // while handled: quick and tight
const SETTLE = { k: 0.03, d: 0.13 };    // let go: slower, with a little wobble
const MAX_RX = 15, MAX_RY = 19;         // degrees
export function attachTilt(el) {
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
  el.addEventListener('touchmove', noScroll, { passive: false });
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
    base = qNorm(base.map((v, i) => v + (q[i] - v) * 0.01));
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
export function attachFlip(el, { onBack } = {}) {
  let flipped = false, busy = false, lastTap = 0, lastX = 0, lastY = 0;
  const back = el.querySelector('.card__back');
  const flip = () => {
    if (busy || !back) return;
    busy = true; flipped = !flipped;
    if (flipped) onBack?.(back);
    const ms = reducedMotion() ? 1 : 560, from = flipped ? 0 : 180, to = flipped ? 180 : 360;
    // Ease in to edge-on, out from it, so edge-on lands exactly at ms / 2 when the faces swap (an overall
    // ease-out passed 90° early, flashing the mirrored front and then a flat back).
    el.animate([
      { transform: `perspective(1600px) rotateY(${from}deg)`, easing: 'cubic-bezier(.5,0,1,1)' },
      { transform: `perspective(1600px) rotateY(${from + 90}deg)`, easing: 'cubic-bezier(0,0,.4,1)', offset: .5 },
      { transform: `perspective(1600px) rotateY(${to}deg)` }],
      { duration: ms, easing: 'linear', fill: 'forwards' });
    setTimeout(() => { back.style.opacity = flipped ? '1' : ''; }, ms / 2); // edge-on: swap faces
    setTimeout(() => { busy = false; }, ms);
  };
  const onUp = (e) => {
    if (e.pointerType === 'mouse' || el.dataset.swiping) return; // mice use dblclick
    const now = performance.now();
    if (now - lastTap < 320 && Math.hypot(e.clientX - lastX, e.clientY - lastY) < 30) { lastTap = 0; flip(); }
    else { lastTap = now; lastX = e.clientX; lastY = e.clientY; }
  };
  const onDbl = (e) => { e.preventDefault(); flip(); };
  el.addEventListener('pointerup', onUp);
  el.addEventListener('dblclick', onDbl);
  return {
    get flipped() { return flipped; },
    destroy() { el.removeEventListener('pointerup', onUp); el.removeEventListener('dblclick', onDbl); },
  };
}
