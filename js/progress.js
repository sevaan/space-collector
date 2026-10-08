// Player progress from the sighting log: XP and observer rank, tonight's three missions, a weekly streak and
// achievements. Everything is derived from the saved sightings (nothing extra is stored), so it can't drift.
// info(cardKey) -> { tier, type, owner, launch, natural, con } | null. No DOM.
import { nightKey } from './observation.js?v=0.1.283';

export const RANKS = [
  [0, 'Stargazer'], [200, 'Spotter'], [600, 'Tracker'], [1500, 'Navigator'], [4000, 'Flight Controller'], [10000, 'Mission Control'],
];
const TIER_XP = { common: 10, uncommon: 20, rare: 40, epic: 80, legendary: 150 };
const REPEAT_XP = 5, SHINY_XP = 100, MISSION_XP = 50, CON_XP = 200;
const real = (sightings) => sightings.filter((s) => !s.sim).slice().sort((a, b) => a.time - b.time);
const year = (iso) => (iso ? Number(String(iso).slice(0, 4)) : null);
const soviet = (i) => i?.owner === 'CIS';
const american = (i) => i?.owner === 'US';

// ---------- missions ----------
// Each night gets three, picked from this list by the night itself (everyone gets the same three).
export const MISSIONS = [
  { id: 'stage', text: 'Catch a rocket stage', done: (n) => n.some((s) => s.info?.type === 'rocket-body') },
  { id: 'old', text: 'Find something launched before 1980', done: (n) => n.some((s) => !s.info?.natural && year(s.info?.launch) < 1980) },
  { id: 'three', text: 'Collect 3 new cards', done: (n) => n.filter((s) => s.first).length >= 3 },
  { id: 'star', text: 'Collect a constellation star', done: (n) => n.some((s) => s.info?.con) },
  { id: 'recent', text: 'Catch a satellite launched in the last 5 years', done: (n, t) => n.some((s) => !s.info?.natural && year(s.info?.launch) >= new Date(t).getFullYear() - 5) },
  { id: 'soviet', text: 'Spot something Soviet or Russian', done: (n) => n.some((s) => soviet(s.info)) },
  { id: 'epic', text: 'Catch something Epic or Legendary', done: (n) => n.some((s) => ['epic', 'legendary'].includes(s.info?.tier)) },
  { id: 'race', text: 'Space Race: a Soviet object and an American one', done: (n) => n.some((s) => soviet(s.info)) && n.some((s) => american(s.info)) },
  { id: 'high', text: 'Catch something more than 60° up', done: (n) => n.some((s) => s.el >= 60) },
  { id: 'planet', text: 'Collect a planet or the Moon', done: (n) => n.some((s) => ['planet', 'moon'].includes(s.info?.type)) },
  { id: 'junk', text: 'Spot a piece of space debris', done: (n) => n.some((s) => s.info?.type === 'debris') },
  { id: 'five', text: 'Log 5 sightings', done: (n) => n.length >= 5 },
];
// Seeded by the night (a day index from nightKey): integer mixing with Math.imul, so the picks spread evenly
// from one night to the next. (The old float LCG overflowed 2^53 and kept dealing the same few missions.)
export function missionsFor(night) {
  let h = 0; for (const c of String(night)) h = Math.imul(h ^ c.charCodeAt(0), 2654435761) >>> 0;
  const next = () => { h = (h + 0x6d2b79f5) >>> 0; let t = Math.imul(h ^ (h >>> 15), 1 | h); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0); };
  const pick = [], pool = MISSIONS.slice();
  while (pick.length < 3) pick.push(pool.splice(next() % pool.length, 1)[0]);
  return pick;
}

// ---------- achievements ----------
// Grouped so a collector always has a next one in reach. `icon` is the short text in the badge circle
// (≤ 4 characters). Everything is read off the accumulator `a` built in progress(); nothing is stored.
const T_HAS = (t) => (a) => a.tiers.has(t);
export const ACHIEVEMENTS = [
  // Collecting
  { id: 'first', name: 'First Light', text: 'Collect your first card', icon: '✦', done: (a) => a.cards >= 1 },
  { id: 'ten', name: 'Logbook', text: 'Collect 10 cards', icon: '10', done: (a) => a.cards >= 10 },
  { id: 'twentyfive', name: 'Field Guide', text: 'Collect 25 cards', icon: '25', done: (a) => a.cards >= 25 },
  { id: 'fifty', name: 'Half Century', text: 'Collect 50 cards', icon: '50', done: (a) => a.cards >= 50 },
  { id: 'hundred', name: 'Centurion', text: 'Collect 100 cards', icon: '100', done: (a) => a.cards >= 100 },
  { id: 'archivist', name: 'Archivist', text: 'Collect 250 cards', icon: '250', done: (a) => a.cards >= 250 },
  { id: 'curator', name: 'Curator', text: 'Collect 500 cards', icon: '500', done: (a) => a.cards >= 500 },
  { id: 'catalogue', name: 'The Catalogue', text: 'Collect 1,000 cards', icon: '1k', done: (a) => a.cards >= 1000 },
  { id: 'sightings100', name: 'Hundred Nights', text: 'Log 100 sightings', icon: '§', done: (a) => a.sightings >= 100 },
  // Rarity
  { id: 'legend', name: 'Legend', text: 'Collect a Legendary card', icon: '★', done: T_HAS('legendary') },
  { id: 'epic', name: 'Epic', text: 'Collect an Epic card', icon: '✪', done: T_HAS('epic') },
  { id: 'spectrum', name: 'Full Spectrum', text: 'Collect every rarity, Common to Legendary', icon: '5', done: (a) => ['common', 'uncommon', 'rare', 'epic', 'legendary'].every((t) => a.tiers.has(t)) },
  { id: 'legends5', name: 'Hall of Legends', text: 'Collect 5 Legendary cards', icon: '★5', done: (a) => (a.tierCount.legendary ?? 0) >= 5 },
  { id: 'legends25', name: 'Pantheon', text: 'Collect 25 Legendary cards', icon: '★25', done: (a) => (a.tierCount.legendary ?? 0) >= 25 },
  { id: 'shiny', name: 'Shiny Hunter', text: 'Catch a shiny', icon: '✧', done: (a) => a.shinies >= 1 },
  { id: 'shiny5', name: 'Shiny Collector', text: 'Catch 5 shinies', icon: '✧5', done: (a) => a.shinies >= 5 },
  // What it is
  { id: 'stage', name: 'Stage Hand', text: 'Catch a rocket stage', icon: '▲', done: (a) => (a.typeCount['rocket-body'] ?? 0) >= 1 },
  { id: 'stages25', name: 'Boneyard', text: 'Catch 25 rocket stages', icon: '▲25', done: (a) => (a.typeCount['rocket-body'] ?? 0) >= 25 },
  { id: 'junk', name: 'Junk Collector', text: 'Catch a piece of space debris', icon: '⁂', done: (a) => (a.typeCount.debris ?? 0) >= 1 },
  { id: 'station', name: 'Crewed', text: 'Catch a space station', icon: '⌂', done: (a) => (a.typeCount.station ?? 0) >= 1 },
  { id: 'stations', name: 'Both Stations', text: 'Catch the ISS and Tiangong', icon: '⌂2', done: (a) => (a.typeCount.station ?? 0) >= 2 },
  { id: 'satellites50', name: 'Payload', text: 'Catch 50 satellites', icon: '50', done: (a) => (a.typeCount.satellite ?? 0) >= 50 },
  // Whose it is
  { id: 'nations', name: 'Around the World', text: 'Objects from 8 different countries or agencies', icon: '8', done: (a) => a.owners.size >= 8 },
  { id: 'diplomat', name: 'Diplomat', text: 'Objects from 15 different countries or agencies', icon: '15', done: (a) => a.owners.size >= 15 },
  { id: 'bigthree', name: 'Big Three', text: 'American, Russian and Chinese objects', icon: '3', done: (a) => a.owners.has('US') && a.owners.has('CIS') && a.owners.has('PRC') },
  { id: 'redstar', name: 'Red Star', text: '10 Soviet or Russian objects', icon: '☭', done: (a) => (a.ownerCount.CIS ?? 0) >= 10 },
  { id: 'stripes', name: 'Stars and Stripes', text: '10 American objects', icon: 'US', done: (a) => (a.ownerCount.US ?? 0) >= 10 },
  { id: 'longmarch', name: 'Long March', text: '10 Chinese objects', icon: 'CN', done: (a) => (a.ownerCount.PRC ?? 0) >= 10 },
  { id: 'europe', name: 'Old World', text: 'A European object (ESA, France, Germany, UK or Italy)', icon: 'EU', done: (a) => ['ESA', 'FR', 'GER', 'UK', 'IT'].some((o) => a.owners.has(o)) },
  { id: 'japan', name: 'Rising Sun', text: 'A Japanese object', icon: 'JP', done: (a) => a.owners.has('JPN') },
  { id: 'india', name: 'Mangalyaan', text: 'An Indian object', icon: 'IN', done: (a) => a.owners.has('IND') },
  { id: 'race', name: 'Space Race', text: 'A Soviet object and an American one on the same night', icon: '⚔', done: (a) => a.race },
  // When it flew
  { id: 'oldtimer', name: 'Old Timer', text: 'Catch something launched before 1970', icon: '60s', done: (a) => a.oldest != null && a.oldest < 1970 },
  { id: 'sputnik', name: 'Sputnik Era', text: 'Catch something launched before 1960', icon: '58', done: (a) => a.oldest != null && a.oldest < 1960 },
  { id: 'coldwar', name: 'Cold War', text: '10 objects launched before 1991', icon: '≤90', done: (a) => a.pre1991 >= 10 },
  { id: 'decades', name: 'Time Traveller', text: 'Objects from 6 different decades', icon: '6×10', done: (a) => a.decades.size >= 6 },
  { id: 'brandnew', name: 'Fresh Off the Pad', text: 'Catch something launched within the last 30 days', icon: 'NEW', done: (a) => a.brandNew },
  // Fleets
  { id: 'starlink', name: 'Train Spotter', text: 'Stamp a Starlink launch', icon: 'SL', done: (a) => (a.fleet.STARLINK ?? 0) >= 1 },
  { id: 'starlink10', name: 'Regular Service', text: 'Stamp 10 Starlink launches', icon: 'SL10', done: (a) => (a.fleet.STARLINK ?? 0) >= 10 },
  { id: 'starlink50', name: 'Megaconstellation', text: 'Stamp 50 Starlink launches — a gold fleet card', icon: 'SL50', done: (a) => (a.fleet.STARLINK ?? 0) >= 50 },
  { id: 'fleets', name: 'Fleet Admiral', text: 'Stamp a launch from all four fleets', icon: '⚓', done: (a) => ['STARLINK', 'ONEWEB', 'KUIPER', 'QIANFAN'].every((f) => (a.fleet[f] ?? 0) >= 1) },
  // Sky
  { id: 'moon', name: 'Moonstruck', text: 'Collect the Moon', icon: '☾', done: (a) => a.naturals.has('moon') },
  { id: 'mars', name: 'Red Planet', text: 'Collect Mars', icon: '♂', done: (a) => a.naturals.has('planet:mars') },
  { id: 'saturn', name: 'Ringed', text: 'Collect Saturn', icon: '♄', done: (a) => a.naturals.has('planet:saturn') },
  { id: 'wanderers', name: 'Wanderer', text: 'Collect the Moon and the five bright planets', icon: '6', done: (a) => a.wanderers >= 6 },
  { id: 'stars10', name: 'Astronomer', text: 'Collect 10 constellation stars', icon: '✶10', done: (a) => a.stars >= 10 },
  { id: 'constellation', name: 'Star Map', text: 'Complete a constellation', icon: '✶', done: (a) => a.cons >= 1 },
  { id: 'cons5', name: 'Cartographer', text: 'Complete 5 constellations', icon: '✶5', done: (a) => a.cons >= 5 },
  { id: 'zodiac', name: 'Zodiac', text: 'Complete all 12 zodiac constellations', icon: 'XII', done: (a) => a.zodiac >= 12 },
  { id: 'cons25', name: 'Atlas', text: 'Complete 25 constellations', icon: '✶25', done: (a) => a.cons >= 25 },
  // Where you looked
  { id: 'zenith', name: 'Straight Up', text: 'Catch something more than 85° up', icon: '90°', done: (a) => a.maxEl >= 85 },
  { id: 'horizon', name: 'Horizon Hunter', text: 'Catch a satellite under 12° up', icon: '12°', done: (a) => a.minSatEl != null && a.minSatEl <= 12 },
  { id: 'compass', name: 'Compass Rose', text: 'Sightings in all four quarters of the sky', icon: 'NESW', done: (a) => a.quadrants.size >= 4 },
  { id: 'faint', name: 'Keen Eye', text: 'Catch something fainter than magnitude 5', icon: 'mag', done: (a) => a.faintest != null && a.faintest >= 5 },
  { id: 'brilliant', name: 'Blinding', text: 'Catch a satellite brighter than magnitude 0', icon: '−0', done: (a) => a.brightestSat != null && a.brightestSat <= 0 },
  { id: 'close', name: 'Close Pass', text: 'Catch something within 450 km', icon: '450', done: (a) => a.closest != null && a.closest <= 450 },
  { id: 'far', name: 'Far Out', text: 'Catch something more than 2,000 km away', icon: '2k', done: (a) => a.farthest != null && a.farthest >= 2000 },
  // When you looked
  { id: 'twilight', name: 'Early Bird', text: 'Log a sighting before 9 pm', icon: '21', done: (a) => a.hours.some((h) => h >= 17 && h < 21) },
  { id: 'owl', name: 'Night Owl', text: 'Log a sighting between 1 and 4 am', icon: '☾', done: (a) => a.hours.some((h) => h >= 1 && h < 4) },
  { id: 'dawn', name: 'Dawn Patrol', text: 'Log a sighting between 4 and 7 am', icon: '☀', done: (a) => a.hours.some((h) => h >= 4 && h < 7) },
  { id: 'marathon', name: 'Marathon', text: 'Log 10 sightings in one night', icon: '10/n', done: (a) => a.maxNight >= 10 },
  { id: 'double', name: 'Double Sighting', text: 'Collect two new cards within a minute', icon: '×2', done: (a) => a.double },
  { id: 'hattrick', name: 'Hat Trick', text: 'Collect three new cards within five minutes', icon: '×3', done: (a) => a.triple },
  { id: 'months3', name: 'Season Ticket', text: 'Sightings in 3 different months', icon: '3m', done: (a) => a.months.size >= 3 },
  { id: 'months12', name: 'Full Year', text: 'Sightings in 12 different months', icon: '12m', done: (a) => a.months.size >= 12 },
  { id: 'streak4', name: 'Regular', text: 'Observe 4 weeks in a row', icon: '4w', done: (a) => a.bestStreak >= 4 },
  { id: 'streak12', name: 'Devoted', text: 'Observe 12 weeks in a row', icon: '12w', done: (a) => a.bestStreak >= 12 },
  { id: 'anniversary', name: 'Anniversary', text: 'Still observing a year after your first sighting', icon: '1y', done: (a) => a.spanDays >= 365 },
  // Coming back
  { id: 'silver', name: 'Regular Visitor', text: 'See one object on 5 different nights — a silver card', icon: 'Ag', done: (a) => a.maxNightsOnCard >= 5 },
  { id: 'gold', name: 'Old Friend', text: 'See one object on 25 different nights — a gold card', icon: 'Au', done: (a) => a.maxNightsOnCard >= 25 },
  { id: 'gold3', name: 'Inner Circle', text: 'Three gold cards', icon: 'Au3', done: (a) => a.goldCards >= 3 },
  { id: 'roadtrip', name: 'Road Trip', text: 'Sightings from two places more than 100 km apart', icon: '100k', done: (a) => a.spreadKm >= 100 },
  // Missions
  { id: 'missions10', name: 'On Assignment', text: 'Complete 10 missions', icon: 'M10', done: (a) => a.missionsDone >= 10 },
  { id: 'fullhouse', name: 'Full House', text: 'Complete all three missions in one night', icon: '3/3', done: (a) => a.fullHouse },
  { id: 'missions50', name: 'Veteran', text: 'Complete 50 missions', icon: 'M50', done: (a) => a.missionsDone >= 50 },
];

// Weeks (Monday-based, local) with at least one sighting -> current and best streak of consecutive weeks.
function weekIndex(time) { const d = new Date(time); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return Math.round(d.getTime() / (7 * 86400e3)); }
export function streaks(sightings, now = Date.now()) {
  const weeks = [...new Set(real(sightings).map((s) => weekIndex(s.time)))].sort((a, b) => a - b);
  let best = 0, run = 0, prev = null;
  for (const w of weeks) { run = prev != null && w === prev + 1 ? run + 1 : 1; best = Math.max(best, run); prev = w; }
  const cur = weekIndex(now), last = weeks[weeks.length - 1];
  const current = last === cur || last === cur - 1 ? run : 0;
  return { current, best, thisWeek: last === cur };
}

// constellations: [{ id, stars: [cardKey], zodiac }] for completion counts.
export function progress(sightings, info, { constellations = [], now = Date.now() } = {}) {
  const list = real(sightings);
  const seenCard = new Set(), seenNight = new Set(), nights = new Map();
  let xp = 0;
  const a = { cards: 0, sightings: list.length, tiers: new Set(), tierCount: {}, typeCount: {}, shinies: 0, hours: [], double: false, triple: false,
    oldest: null, pre1991: 0, decades: new Set(), brandNew: false, race: false, wanderers: 0, naturals: new Set(), stars: 0, cons: 0, zodiac: 0,
    owners: new Set(), ownerCount: {}, fleet: {}, maxEl: -90, minSatEl: null, quadrants: new Set(), faintest: null, brightestSat: null,
    closest: null, farthest: null, maxNight: 0, months: new Set(), spanDays: 0, maxNightsOnCard: 0, goldCards: 0, spreadKm: 0, missionsDone: 0, fullHouse: false };
  const firsts = [], nightsOnCard = new Map(), fleetStamps = new Map(), places = [];
  for (const s of list) {
    const i = info(s.cardKey), night = nightKey(s.time, s.lon ?? 0), first = !seenCard.has(s.cardKey), nk = `${s.cardKey}|${night}`;
    if (first) {
      seenCard.add(s.cardKey); xp += TIER_XP[i?.tier] ?? 10; a.cards++; firsts.push(s.time);
      if (s.time - (firsts[firsts.length - 2] ?? -Infinity) <= 60000) a.double = true;
      if (firsts.length >= 3 && s.time - firsts[firsts.length - 3] <= 300000) a.triple = true;
      if (i?.tier) a.tierCount[i.tier] = (a.tierCount[i.tier] ?? 0) + 1;
      if (i?.type && !i.natural) a.typeCount[i.type] = (a.typeCount[i.type] ?? 0) + 1;
      if (i?.owner && !i.natural) a.ownerCount[i.owner] = (a.ownerCount[i.owner] ?? 0) + 1;
      if (i?.natural) a.naturals.add(s.cardKey);
      if (i?.con && i.natural !== 'constellation') a.stars++;
      if (!i?.natural && i?.launch) {
        const y = year(i.launch);
        if (y) { if (y < 1991) a.pre1991++; a.decades.add(Math.floor(y / 10)); }
        if (s.time - Date.parse(i.launch) <= 30 * 86400e3 && s.time >= Date.parse(i.launch)) a.brandNew = true;
      }
    }
    else if (!seenNight.has(nk)) xp += REPEAT_XP;
    if (!seenNight.has(nk)) { nightsOnCard.set(s.cardKey, (nightsOnCard.get(s.cardKey) ?? 0) + 1); }
    seenNight.add(nk);
    if (s.stampKey) { const fam = String(s.stampKey).split(':')[0]; if (!fleetStamps.has(fam)) fleetStamps.set(fam, new Set()); fleetStamps.get(fam).add(s.stampKey); }
    if (s.shiny) { xp += SHINY_XP; a.shinies++; }
    if (i?.tier) a.tiers.add(i.tier);
    const d = new Date(s.time); a.hours.push(d.getHours()); a.months.add(`${d.getFullYear()}-${d.getMonth()}`);
    if (!i?.natural && i?.launch) { const y = year(i.launch); if (y && (a.oldest == null || y < a.oldest)) a.oldest = y; }
    if (i?.owner && !i.natural) a.owners.add(i.owner);
    if (typeof s.el === 'number') { a.maxEl = Math.max(a.maxEl, s.el); if (!i?.natural && (a.minSatEl == null || s.el < a.minSatEl)) a.minSatEl = s.el; }
    if (typeof s.az === 'number') a.quadrants.add(Math.floor((((s.az % 360) + 360) % 360) / 90));
    if (typeof s.mag === 'number') { if (a.faintest == null || s.mag > a.faintest) a.faintest = s.mag; if (!i?.natural && (a.brightestSat == null || s.mag < a.brightestSat)) a.brightestSat = s.mag; }
    if (typeof s.rangeKm === 'number' && !i?.natural) { if (a.closest == null || s.rangeKm < a.closest) a.closest = s.rangeKm; if (a.farthest == null || s.rangeKm > a.farthest) a.farthest = s.rangeKm; }
    if (typeof s.lat === 'number' && typeof s.lon === 'number') places.push([s.lat, s.lon]);
    if (!nights.has(night)) nights.set(night, []);
    nights.get(night).push({ ...s, info: i, first });
  }
  for (const n of nights.values()) { if (n.some((s) => soviet(s.info)) && n.some((s) => american(s.info))) a.race = true; a.maxNight = Math.max(a.maxNight, n.length); }
  a.wanderers = ['moon', 'planet:mercury', 'planet:venus', 'planet:mars', 'planet:jupiter', 'planet:saturn'].filter((k) => seenCard.has(k)).length;
  for (const c of constellations) if (c.stars.every((k) => seenCard.has(k))) { if (!c.system) a.cons++; xp += CON_XP; if (c.zodiac) a.zodiac++; }
  for (const [fam, set] of fleetStamps) a.fleet[fam] = set.size;
  for (const n of nightsOnCard.values()) { a.maxNightsOnCard = Math.max(a.maxNightsOnCard, n); if (n >= 25) a.goldCards++; }
  if (list.length) a.spanDays = (list[list.length - 1].time - list[0].time) / 86400e3;
  // Farthest pair of observing places, in km (equirectangular is plenty at this scale).
  for (let x = 0; x < places.length; x++) for (let y = x + 1; y < places.length; y++) {
    const [la1, lo1] = places[x], [la2, lo2] = places[y], dLat = (la2 - la1) * 111.2, dLon = (lo2 - lo1) * 111.2 * Math.cos(((la1 + la2) / 2) * Math.PI / 180);
    a.spreadKm = Math.max(a.spreadKm, Math.hypot(dLat, dLon));
  }
  // Missions: every completed mission on any night counts once for XP; tonight's three are shown.
  for (const [night, n] of nights) {
    const done = missionsFor(night).filter((m) => m.done(n, n[0].time)).length;
    xp += done * MISSION_XP; a.missionsDone += done; if (done === 3) a.fullHouse = true;
  }
  const st = streaks(list, now); a.bestStreak = st.best;
  const tonightKey = nightKey(now, list[list.length - 1]?.lon ?? 0), tonight = nights.get(tonightKey) ?? [];
  const missions = missionsFor(tonightKey).map((m) => ({ id: m.id, text: m.text, done: m.done(tonight, now) }));
  let ri = 0; for (let k = 0; k < RANKS.length; k++) if (xp >= RANKS[k][0]) ri = k;
  const rank = { name: RANKS[ri][1], index: ri, at: RANKS[ri][0], next: RANKS[ri + 1]?.[0] ?? null, nextName: RANKS[ri + 1]?.[1] ?? null };
  const achievements = ACHIEVEMENTS.map((x) => ({ id: x.id, name: x.name, text: x.text, icon: x.icon, done: x.done(a) }));
  return { xp, rank, missions, streak: st, achievements, cards: a.cards };
}
