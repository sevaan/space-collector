// Player progress from the sighting log: XP and observer rank, tonight’s three missions, a weekly streak and
// achievements. Everything is derived from the saved sightings (nothing extra is stored), so it can’t drift.
// info(cardKey) -> { tier, type, owner, launch, natural, con } | null. No DOM.
import { nightKey } from './observation.js?v=0.1.1092';

// A longer climb (2026-10-12, playtest room: three ranks on night 1, Mission Control in about two weeks), with two
// prestige ranks past Mission Control. Nobody drops a rank they had on the old curve (rankFloor below).
export const RANKS = [
  [0, 'Stargazer'], [300, 'Spotter'], [1000, 'Tracker'], [3000, 'Navigator'], [8000, 'Flight Controller'], [20000, 'Mission Control'],
  [40000, 'Deep Space'], [75000, 'Voyager'],
];
const LEGACY_RANKS = [[0, 'Stargazer'], [200, 'Spotter'], [600, 'Tracker'], [1500, 'Navigator'], [4000, 'Flight Controller'], [10000, 'Mission Control']];
// The rank a player already held on the old curve, worked out once and kept (localStorage rankFloor2).
function rankFloor(xp) {
  try { const v = localStorage.getItem('rankFloor2'); if (v != null) return Number(v) || 0; } catch { return 0; }
  let li = 0; for (let k = 0; k < LEGACY_RANKS.length; k++) if (xp >= LEGACY_RANKS[k][0]) li = k;
  try { localStorage.setItem('rankFloor2', String(li)); } catch {}
  return li;
}
// Flatter since 2026-10-10 (playtest: 10 → 150 was 15×, so rank mostly counted old rocket stages and Mission Control
// arrived in ~4 months). Players who were already further along keep their rank through a one-time carry (xpCarry).
const TIER_XP = { common: 10, uncommon: 15, rare: 25, epic: 40, legendary: 60 };
const LEGACY_TIER_XP = { common: 10, uncommon: 20, rare: 40, epic: 80, legendary: 150 };
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
  { id: 'star', text: 'Collect a constellation star', done: (n) => n.some((s) => s.info?.con) },
  { id: 'recent', text: 'Catch something launched in the last 5 years', done: (n, t) => n.some((s) => !s.info?.natural && year(s.info?.launch) >= new Date(t).getFullYear() - 5) },
  { id: 'soviet', text: 'Spot something Soviet or Russian', done: (n) => n.some((s) => soviet(s.info)) },
  { id: 'epic', text: 'Catch something Epic or Legendary', done: (n) => n.some((s) => ['epic', 'legendary'].includes(s.info?.tier)) },
  { id: 'race', text: 'Space Race: a Soviet object and an American one', done: (n) => n.some((s) => soviet(s.info)) && n.some((s) => american(s.info)) },
  { id: 'high', text: 'Catch something more than 60° up', done: (n) => n.some((s) => s.el >= 60) },
  { id: 'planet', text: 'Collect a planet or the Moon', done: (n) => n.some((s) => ['planet', 'moon'].includes(s.info?.type)) },
  { id: 'junk', text: 'Spot a piece of space debris', done: (n) => n.some((s) => s.info?.type === 'debris') },
  // Deeper ones (2026-10-12, playtest room: "collect 3 new" and "log 5" were done almost every night).
  { id: 'again', text: 'See a card you own on a new night', done: (n) => n.some((s) => !s.first) },
  { id: 'conset', text: 'Find 3 stars in one constellation', done: (n) => { const c = {}; for (const s of n) if (s.info?.con && s.first) c[s.info.con] = (c[s.info.con] ?? 0) + 1; return Object.values(c).some((v) => v >= 3); } },
  { id: 'deep', text: 'Find a star cluster or galaxy', done: (n) => n.some((s) => s.info?.type === 'deepsky') },
  { id: 'rarenew', text: 'Collect a new Rare card or better', done: (n) => n.some((s) => s.first && ['rare', 'epic', 'legendary'].includes(s.info?.tier)) },
  { id: 'levelup2', text: 'Turn a card silver or gold', done: (n) => n.some((s) => s.lv) },
];
// Retired from the draw but kept so past nights still score the same.
const RETIRED = [
  { id: 'three', text: 'Collect 3 new cards', done: (n) => n.filter((s) => s.first).length >= 3 },
  { id: 'five', text: 'Log 5 sightings', done: (n) => n.length >= 5 },
];
// Tonight’s sky challenge (playtest 2026-10-09, #22): a fourth, bonus goal for nights when nothing new is overhead.
// All of them can be done with cards you already own. +50 XP; doesn’t count toward the mission patches.
export const CHALLENGES = [
  { id: 'revisit3', text: 'See 3 cards you own again', done: (n) => n.filter((s) => !s.first).length >= 3 },
  { id: 'pair10', text: 'Catch two satellites in 10 minutes', done: (n) => { const t = n.filter((s) => !s.info?.natural).map((s) => s.time); return t.some((x, i) => i && x - t[i - 1] <= 600000); } },
  { id: 'levelup', text: 'Turn a card silver or gold', done: (n) => n.some((s) => s.lv) },
  { id: 'brightstar', text: 'Find a bright named star', done: (n) => n.some((s) => /^star:(?!hip)/.test(s.cardKey)) },
  { id: 'wanderer', text: 'See a planet again', done: (n) => n.some((s) => !s.first && s.info?.type === 'planet') },
];
export function challengeFor(night) { let h = 7; for (const c of String(night)) h = Math.imul(h ^ c.charCodeAt(0), 2246822519) >>> 0; return CHALLENGES[h % CHALLENGES.length]; }

// A player’s first night gets a fixed starter set a beginner can finish (playtest 2026-10-09: the random three were
// debris, pre-1980 and a rocket stage, and the first catch left them 0 / 3).
export const STARTER = [
  { id: 'firstcard', text: 'Collect your first card', done: (n) => n.some((s) => s.first) },
  { id: 'satellite', text: 'Catch a satellite', done: (n) => n.some((s) => s.info && !s.info.natural) },
  MISSIONS.find((m) => m.id === 'planet'),
];
const MISSION_BY_ID = new Map([...MISSIONS, ...RETIRED, ...STARTER].map((m) => [m.id, m]));
// Seeded by the night (a day index from nightKey): integer mixing with Math.imul, so the picks spread evenly
// from one night to the next. (The old float LCG overflowed 2^53 and kept dealing the same few missions.)
// possible (optional): a Set of mission ids that can be done tonight from here (main.js asks the tonight worker
// which have a qualifying pass, playtest 2026-10-09); the draw skips the rest while enough remain.
export function missionsFor(night, possible = null) {
  let h = 0; for (const c of String(night)) h = Math.imul(h ^ c.charCodeAt(0), 2654435761) >>> 0;
  const next = () => { h = (h + 0x6d2b79f5) >>> 0; let t = Math.imul(h ^ (h >>> 15), 1 | h); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0); };
  const ok = possible ? MISSIONS.filter((m) => possible.has(m.id)) : [];
  const pick = [], pool = (ok.length >= 3 ? ok : MISSIONS).slice();
  while (pick.length < 3) pick.push(pool.splice(next() % pool.length, 1)[0]);
  return pick;
}
// The missions a night actually had: the starter set on a first night, else a stored deal (main.js saves tonight’s
// once, from the sky), else the plain draw. Everywhere that shows or scores missions goes through this.
function missionsOf(night, { first = false, deals = null } = {}) {
  if (first) return STARTER;
  const ids = deals?.[night];
  if (ids?.length === 3 && ids.every((id) => MISSION_BY_ID.has(id))) return ids.map((id) => MISSION_BY_ID.get(id));
  return missionsFor(night);
}

// Stored deals (see main.js dealMissions): { [nightKey]: [missionId × 3] }.
export function readDeals() { try { return JSON.parse(localStorage.getItem('missionDeals')) || {}; } catch { return {}; } }

// The one-time carry that keeps an existing player’s rank through the flatter XP (see TIER_XP): the XP needed to
// reach the rank the old numbers gave them. Worked out once, the first time the new numbers run, and kept.
export function xpCarry(sightings, info, opts = {}) {
  try { const v = localStorage.getItem('xpCarry2'); if (v != null) return Number(v) || 0; } catch {} // v2: after the difficulty re-tier (2026-10-10)
  let carry = 0;
  if (real(sightings).length) {
    const old = progress(sightings, info, { ...opts, tierXp: LEGACY_TIER_XP }), cur = progress(sightings, info, { ...opts, carry: 0 });
    carry = Math.max(0, old.rank.at - cur.xp);
  }
  try { localStorage.setItem('xpCarry2', String(carry)); } catch {}
  return carry;
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
  { id: 'sightings100', name: 'Hundred Sightings', text: 'Log 100 sightings', icon: '§', done: (a) => a.sightings >= 100 },
  // Rarity
  { id: 'legend', name: 'Legend', text: 'Collect a Legendary card', icon: '★', done: T_HAS('legendary') },
  { id: 'epic', name: 'Epic', text: 'Collect an Epic card', icon: '✪', done: T_HAS('epic') },
  { id: 'spectrum', name: 'Full Spectrum', text: 'Collect every rarity, Common to Legendary', icon: '5', done: (a) => ['common', 'uncommon', 'rare', 'epic', 'legendary'].every((t) => a.tiers.has(t)) },
  { id: 'legends5', name: 'Hall of Legends', text: 'Collect 5 Legendary cards', icon: '★5', done: (a) => (a.tierCount.legendary ?? 0) >= 5 },
  { id: 'legends25', name: 'Pantheon', text: 'Collect 15 Legendary cards', icon: '★15', done: (a) => (a.tierCount.legendary ?? 0) >= 15 }, // was 25; only 123 Legendaries since the 2026-10-10 re-tier (id kept)
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
  { id: 'headliners', name: 'Top of the Bill', text: 'Catch 10 of tonight’s headliners', icon: 'TOP', done: (a) => (a.headliners ?? 0) >= 10 },
  { id: 'witness', name: 'Witness', text: 'Collect 3 last-chance satellites before they fall', icon: 'LC', done: (a) => (a.witness ?? 0) >= 3 },
  // Reunions (2026-10-17): own a rocket stage and the satellite it carried (card-model.js partners).
  { id: 'reunion', name: 'Reunited', text: 'Collect a rocket stage and the satellite it carried', icon: 'RU', done: (a) => (a.reunions ?? 0) >= 1 },
  { id: 'reunion10', name: 'Family Reunion', text: 'Reunite 10 rocket stages with their satellites', icon: 'RU', done: (a) => (a.reunions ?? 0) >= 10 },
  { id: 'reunion25', name: 'Mission Control Archivist', text: 'Reunite 25 rocket stages with their satellites', icon: 'RU', done: (a) => (a.reunions ?? 0) >= 25 },
  { id: 'brandnew', name: 'Fresh Off the Pad', text: 'Catch something launched within the last 30 days', icon: 'NEW', done: (a) => a.brandNew },
  // Fleets
  { id: 'starlink', name: 'Train Spotter', text: 'Stamp a Starlink launch', icon: 'SL', done: (a) => (a.fleet.STARLINK ?? 0) >= 1 },
  { id: 'starlink10', name: 'Regular Service', text: 'Stamp 10 Starlink launches', icon: 'SL10', done: (a) => (a.fleet.STARLINK ?? 0) >= 10 },
  { id: 'starlink50', name: 'Megaconstellation', text: 'Stamp 50 Starlink launches for a gold fleet card', icon: 'SL50', done: (a) => (a.fleet.STARLINK ?? 0) >= 50 },
  { id: 'fleets', name: 'Fleet Admiral', text: 'Stamp a launch from all four fleets', icon: '⚓', done: (a) => ['STARLINK', 'ONEWEB', 'KUIPER', 'QIANFAN'].every((f) => (a.fleet[f] ?? 0) >= 1) },
  // Sky
  { id: 'moon', name: 'Moonstruck', text: 'Collect the Moon', icon: '☾', done: (a) => a.naturals.has('moon') },
  { id: 'mars', name: 'Red Planet', text: 'Collect Mars', icon: '♂', done: (a) => a.naturals.has('planet:mars') },
  { id: 'saturn', name: 'Ringed', text: 'Collect Saturn', icon: '♄', done: (a) => a.naturals.has('planet:saturn') },
  { id: 'wanderers', name: 'Wanderer', text: 'Collect the Moon and the five bright planets', icon: '6', done: (a) => a.wanderers >= 6 },
  { id: 'stars10', name: 'Astronomer', text: 'Collect 10 constellation stars', icon: '✶10', done: (a) => a.stars >= 10 },
  { id: 'deep3', name: 'Deep Sky', text: 'Collect 3 star clusters, nebulae or galaxies', icon: '◌3', done: (a) => (a.deep ?? 0) >= 3 }, // 2026-10-11
  { id: 'deep10', name: 'Island Universes', text: 'Collect 10 star clusters, nebulae or galaxies', icon: '◌10', done: (a) => (a.deep ?? 0) >= 10 },
  // Star Map ('Complete a constellation') retired 2026-10-10: it always landed with that constellation’s own patch.
  { id: 'cons5', name: 'Cartographer', text: 'Complete 5 constellations', icon: '✶5', done: (a) => a.cons >= 5 },
  { id: 'zodiac', name: 'Zodiac', text: 'Complete all 12 zodiac constellations', icon: 'XII', done: (a) => a.zodiac >= 12 },
  { id: 'cons25', name: 'Atlas', text: 'Complete 18 constellations', icon: '✶18', done: (a) => a.cons >= 18 }, // any 18 of the 88 (2026-10-11); it was all 18 when there were only 18 (playtest 2026-10-09), and 25 before that; id kept so earned dates stay
  { id: 'cons44', name: 'Half the Sky', text: 'Complete 44 constellations, half of all 88', icon: '✶44', done: (a) => a.cons >= 44 }, // 2026-10-11, with all 88 added; a years-long goal
  // Where you looked
  { id: 'zenith', name: 'Straight Up', text: 'Catch something more than 85° up', icon: '90°', done: (a) => a.maxEl >= 85 },
  { id: 'horizon', name: 'Horizon Hunter', text: 'Catch a satellite under 12° up', icon: '12°', done: (a) => a.minSatEl != null && a.minSatEl <= 12 },
  { id: 'compass', name: 'Compass Rose', text: 'Sightings in all four quarters of the sky', icon: 'NESW', done: (a) => a.quadrants.size >= 4 },
  { id: 'faint', name: 'Keen Eye', text: 'Catch something fainter than magnitude 5', icon: 'mag', done: (a) => a.faintest != null && a.faintest >= 5 },
  { id: 'brilliant', name: 'Blinding', text: 'Catch a satellite brighter than magnitude 0', icon: '−0', done: (a) => a.brightestSat != null && a.brightestSat <= 0 },
  { id: 'close', name: 'Close Pass', text: 'Catch something within 450 km', icon: '450', done: (a) => a.closest != null && a.closest <= 450 },
  { id: 'far', name: 'Far Out', text: 'Catch something more than 2,000 km away', icon: '2k', done: (a) => a.farthest != null && a.farthest >= 2000 },
  // When you looked
  { id: 'twilight', name: 'Early Bird', text: 'Log a sighting between 5 and 9 PM', icon: '21', done: (a) => a.hours.some((h) => h >= 17 && h < 21) },
  { id: 'owl', name: 'Night Owl', text: 'Log a sighting between 1 and 4 AM', icon: '☾', done: (a) => a.hours.some((h) => h >= 1 && h < 4) },
  { id: 'dawn', name: 'Dawn Patrol', text: 'Log a sighting between 4 and 7 AM', icon: '☀', done: (a) => a.hours.some((h) => h >= 4 && h < 7) },
  { id: 'marathon', name: 'Marathon', text: 'Log 10 sightings in one night', icon: '10/n', done: (a) => a.maxNight >= 10 },
  { id: 'double', name: 'Double Sighting', text: 'Collect two new cards within a minute', icon: '×2', done: (a) => a.double },
  { id: 'hattrick', name: 'Hat Trick', text: 'Collect three new cards within five minutes', icon: '×3', done: (a) => a.triple },
  { id: 'months3', name: 'Season Ticket', text: 'Sightings in 3 different months', icon: '3m', done: (a) => a.months.size >= 3 },
  { id: 'months12', name: 'Full Year', text: 'Sightings in 12 different months', icon: '12m', done: (a) => a.months.size >= 12 },
  { id: 'streak4', name: 'Regular', text: 'Observe 4 weeks in a row', icon: '4w', done: (a) => a.bestStreak >= 4 },
  { id: 'streak12', name: 'Devoted', text: 'Observe 12 weeks in a row', icon: '12w', done: (a) => a.bestStreak >= 12 },
  { id: 'anniversary', name: 'Anniversary', text: 'Still observing a year after your first sighting', icon: '1y', done: (a) => a.spanDays >= 365 },
  // Coming back
  { id: 'silver', name: 'Regular Visitor', text: 'Turn a card silver: see a satellite or rocket stage on 3 different nights', icon: 'Ag', done: (a) => a.maxNightsOnCard >= 3 },
  { id: 'gold', name: 'Old Friend', text: 'Turn a card gold: see a satellite or rocket stage on 10 different nights', icon: 'Au', done: (a) => a.maxNightsOnCard >= 10 },
  { id: 'gold3', name: 'Inner Circle', text: 'Three gold cards', icon: 'Au3', done: (a) => a.goldCards >= 3 },
  { id: 'roadtrip', name: 'Road Trip', text: 'Sightings from two places more than 100 km apart', icon: '100k', done: (a) => a.spreadKm >= 100 },
  // Missions
  { id: 'missions10', name: 'On Assignment', text: 'Complete 10 missions', icon: 'M10', done: (a) => a.missionsDone >= 10 },
  { id: 'fullhouse', name: 'Full House', text: 'Complete all three missions in one night', icon: '3/3', done: (a) => a.fullHouse },
  { id: 'missions50', name: 'Veteran', text: 'Complete 50 missions', icon: 'M50', done: (a) => a.missionsDone >= 50 },
];

// How far along a locked patch is, [have, goal], for the ones that count something (playtest 2026-10-09: a locked
// patch shows its progress stitched part-way round the border, and the detail view says "3 of 10").
const PROG = {
  witness: (a) => [a.witness ?? 0, 3], reunion: (a) => [a.reunions ?? 0, 1], reunion10: (a) => [a.reunions ?? 0, 10], reunion25: (a) => [a.reunions ?? 0, 25], headliners: (a) => [a.headliners ?? 0, 10], first: (a) => [a.cards, 1], ten: (a) => [a.cards, 10], twentyfive: (a) => [a.cards, 25], fifty: (a) => [a.cards, 50], hundred: (a) => [a.cards, 100],
  archivist: (a) => [a.cards, 250], curator: (a) => [a.cards, 500], catalogue: (a) => [a.cards, 1000], sightings100: (a) => [a.sightings, 100],
  spectrum: (a) => [a.tiers.size, 5], legends5: (a) => [a.tierCount.legendary ?? 0, 5], legends25: (a) => [a.tierCount.legendary ?? 0, 15], shiny5: (a) => [a.shinies, 5],
  stages25: (a) => [a.typeCount['rocket-body'] ?? 0, 25], stations: (a) => [a.typeCount.station ?? 0, 2], satellites50: (a) => [a.typeCount.satellite ?? 0, 50],
  nations: (a) => [a.owners.size, 8], diplomat: (a) => [a.owners.size, 15], redstar: (a) => [a.ownerCount.CIS ?? 0, 10], stripes: (a) => [a.ownerCount.US ?? 0, 10],
  longmarch: (a) => [a.ownerCount.PRC ?? 0, 10], coldwar: (a) => [a.pre1991, 10], decades: (a) => [a.decades.size, 6],
  starlink10: (a) => [a.fleet.STARLINK ?? 0, 10], starlink50: (a) => [a.fleet.STARLINK ?? 0, 50], fleets: (a) => [['STARLINK', 'ONEWEB', 'KUIPER', 'QIANFAN'].filter((f) => a.fleet[f]).length, 4],
  wanderers: (a) => [a.wanderers, 6], stars10: (a) => [a.stars, 10], deep3: (a) => [a.deep ?? 0, 3], deep10: (a) => [a.deep ?? 0, 10], cons5: (a) => [a.cons, 5], zodiac: (a) => [a.zodiac, 12], cons25: (a) => [a.cons, 18], cons44: (a) => [a.cons, 44],
  compass: (a) => [a.quadrants.size, 4], marathon: (a) => [a.maxNight, 10], months3: (a) => [a.months.size, 3], months12: (a) => [a.months.size, 12],
  streak4: (a) => [a.bestStreak, 4], streak12: (a) => [a.bestStreak, 12], silver: (a) => [a.maxNightsOnCard, 3], gold: (a) => [a.maxNightsOnCard, 10], gold3: (a) => [a.goldCards, 3],
  missions10: (a) => [a.missionsDone, 10], missions50: (a) => [a.missionsDone, 50],
};

// Weeks with at least one sighting -> current and best streak of consecutive weeks. Weeks run in 7-day blocks from
// your first night out, not Monday to Sunday (playtest room 2026-10-11: Sunday then Monday read "2-week streak 🔥" on
// day 2, which felt unearned).
const dayNum = (time) => { const d = new Date(time); d.setHours(12, 0, 0, 0); return Math.round(d.getTime() / 86400e3); };
// Cloudy weeks don’t break a streak (2026-10-17, Sevaan: "just don’t count cloudy days towards streaks"). Explore saves
// each night’s forecast as it learns it (localStorage skyNights: { dayNum: 1 cloudy | 0 clear }, main.js recordSkyNights);
// a week with no sighting and 4 or more cloudy nights is skipped: it neither adds to the streak nor ends it.
function cloudyDays() { try { return JSON.parse(localStorage.getItem('skyNights') || '{}'); } catch { return {}; } }
export function streaks(sightings, now = Date.now(), cloudy = cloudyDays()) {
  // Counted by observing night (noon to noon), so a session that runs past midnight is one night, not two days that
  // can land in two streak weeks (bug hunt 2026-10-20). Cloudy nights are keyed by the evening's day, which matches.
  const night = (t) => dayNum(t - 12 * 3600e3);
  const days = real(sightings).map((s) => night(s.time)); if (!days.length) return { current: 0, best: 0, thisWeek: false };
  const first = Math.min(...days), weekIndex = (t) => Math.floor((night(t) - first) / 7), cur = weekIndex(now);
  const seen = new Set(days.map((d) => Math.floor((d - first) / 7)));
  const cloudyWeek = (w) => { let n = 0; for (let d = first + w * 7; d < first + w * 7 + 7; d++) if (cloudy[d] === 1) n++; return n >= 4; };
  let best = 0, run = 0;
  for (let w = 0; w <= cur; w++) {
    if (seen.has(w)) { run++; best = Math.max(best, run); }
    else if (w === cur || cloudyWeek(w)) continue; // this week isn’t over yet; a cloudy week is skipped
    else run = 0;
  }
  return { current: run, best, thisWeek: seen.has(cur) };
}

// constellations: [{ id, stars: [cardKey], zodiac }] for completion counts.
export function progress(sightings, info, { constellations = [], albums = [], now = Date.now(), deals = null, carry = 0, tierXp = TIER_XP, lon = null } = {}) {
  const list = real(sightings);
  const seenCard = new Set(), seenNight = new Set(), nights = new Map();
  let xp = 0;
  const a = { cards: 0, sightings: list.length, tiers: new Set(), tierCount: {}, typeCount: {}, shinies: 0, hours: [], double: false, triple: false,
    oldest: null, pre1991: 0, decades: new Set(), brandNew: false, race: false, wanderers: 0, naturals: new Set(), stars: 0, cons: 0, zodiac: 0,
    owners: new Set(), ownerCount: {}, fleet: {}, maxEl: -90, minSatEl: null, quadrants: new Set(), faintest: null, brightestSat: null,
    closest: null, farthest: null, maxNight: 0, months: new Set(), spanDays: 0, maxNightsOnCard: 0, goldCards: 0, spreadKm: 0, missionsDone: 0, fullHouse: false };
  // (Legacy XP reads tier0, each object’s tier before the 2026-10-10 difficulty re-tier.)
  const firsts = [], nightsOnCard = new Map(), fleetStamps = new Map(), places = [], placeSeen = new Set(), reunionRoles = new Map();
  for (const s of list) {
    const i = info(s.cardKey), night = nightKey(s.time, s.lon ?? 0), first = !seenCard.has(s.cardKey), nk = `${s.cardKey}|${night}`;
    if (first) {
      seenCard.add(s.cardKey); xp += tierXp[(tierXp === LEGACY_TIER_XP && i?.tier0) || i?.tier] ?? 10; a.cards++; firsts.push(s.time);
      if (s.time - (firsts[firsts.length - 2] ?? -Infinity) <= 60000) a.double = true;
      if (firsts.length >= 3 && s.time - firsts[firsts.length - 3] <= 300000) a.triple = true;
      if (i?.tier) a.tierCount[i.tier] = (a.tierCount[i.tier] ?? 0) + 1;
      if (i?.type && !i.natural) a.typeCount[i.type] = (a.typeCount[i.type] ?? 0) + 1;
      if (i?.owner && !i.natural) a.ownerCount[i.owner] = (a.ownerCount[i.owner] ?? 0) + 1;
      if (i?.natural) a.naturals.add(s.cardKey);
      if (i?.con) a.stars++;
      if (i?.natural === 'deepsky') a.deep = (a.deep ?? 0) + 1; // clusters, nebulae, galaxies (2026-10-11)
      if (!i?.natural && i?.launch) {
        const y = year(i.launch);
        if (y) { if (y < 1991) a.pre1991++; a.decades.add(Math.floor(y / 10)); }
        if (s.time - Date.parse(i.launch) <= 30 * 86400e3 && s.time >= Date.parse(i.launch)) a.brandNew = true;
      }
      if (s.headliner) { xp += 25; a.headliners = (a.headliners ?? 0) + 1; } // tonight’s headliner (main.js headliner)
      if (s.lastChance) a.witness = (a.witness ?? 0) + 1; // collected while it was falling (js/last-chance.js)
      if (i?.reunion) { const r = reunionRoles.get(i.reunion) ?? reunionRoles.set(i.reunion, new Set()).get(i.reunion); r.add(i.role); }
    }
    else if (!seenNight.has(nk)) xp += REPEAT_XP;
    let lv = false;
    if (!seenNight.has(nk) && !i?.natural) { const c = (nightsOnCard.get(s.cardKey) ?? 0) + 1; /* no levels for the Moon, planets, stars… (2026-10-21, Sevaan) */ nightsOnCard.set(s.cardKey, c); lv = c === 3 || c === 10; }
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
    if (typeof s.lat === 'number' && typeof s.lon === 'number') { const pk = `${s.lat.toFixed(1)},${s.lon.toFixed(1)}`; if (!placeSeen.has(pk)) { placeSeen.add(pk); places.push([s.lat, s.lon]); } } // one per ~10 km spot, so the farthest-pair check stays small (QA 2026-10-08)
    if (!nights.has(night)) nights.set(night, []);
    nights.get(night).push({ ...s, info: i, first, lv });
  }
  for (const n of nights.values()) { if (n.some((s) => soviet(s.info)) && n.some((s) => american(s.info))) a.race = true; a.maxNight = Math.max(a.maxNight, n.length); }
  a.wanderers = ['moon', 'planet:mercury', 'planet:venus', 'planet:mars', 'planet:jupiter', 'planet:saturn'].filter((k) => seenCard.has(k)).length;
  for (const c of constellations) if (c.stars.every((k) => seenCard.has(k))) { if (!c.system) a.cons++; xp += CON_XP; if (c.zodiac) a.zodiac++; }
  for (const [fam, set] of fleetStamps) a.fleet[fam] = set.size;
  for (const n of nightsOnCard.values()) { a.maxNightsOnCard = Math.max(a.maxNightsOnCard, n); if (n >= 10) a.goldCards++; } // gold = 10 nights, as card.js levelFor (2026-10-12)
  if (list.length) a.spanDays = (list[list.length - 1].time - list[0].time) / 86400e3;
  // Farthest pair of observing places, in km (equirectangular is plenty at this scale).
  for (let x = 0; x < places.length; x++) for (let y = x + 1; y < places.length; y++) {
    const [la1, lo1] = places[x], [la2, lo2] = places[y], dLat = (la2 - la1) * 111.2, dLon = (lo2 - lo1) * 111.2 * Math.cos(((la1 + la2) / 2) * Math.PI / 180);
    a.spreadKm = Math.max(a.spreadKm, Math.hypot(dLat, dLon));
  }
  // Missions: every completed mission on any night counts once for XP; tonight’s three are shown.
  const firstNight = nights.keys().next().value;
  for (const [night, n] of nights) {
    const done = missionsOf(night, { first: night === firstNight, deals }).filter((m) => m.done(n, n[0].time)).length;
    xp += done * MISSION_XP; a.missionsDone += done; if (done === 3) a.fullHouse = true;
    if (night !== firstNight && challengeFor(night).done(n, n[0].time)) xp += MISSION_XP;
  }
  a.reunions = [...reunionRoles.values()].filter((r) => r.size === 2).length; // launches where you own the stage and its satellite
  const st = streaks(list, now); a.bestStreak = st.best;
  const tonightKey = nightKey(now, lon ?? list[list.length - 1]?.lon ?? 0) /* where you are now, as the deal was made (bug hunt 2026-10-22: travel split them) */, tonight = nights.get(tonightKey) ?? [];
  const missions = missionsOf(tonightKey, { first: !nights.size || tonightKey === firstNight, deals }).map((m) => ({ id: m.id, text: m.text, done: m.done(tonight, now) }));
  xp += carry;
  let ri = 0; for (let k = 0; k < RANKS.length; k++) if (xp >= RANKS[k][0]) ri = k;
  ri = Math.max(ri, rankFloor(xp));
  const rank = { name: RANKS[ri][1], index: ri, at: RANKS[ri][0], next: RANKS[ri + 1]?.[0] ?? null, nextName: RANKS[ri + 1]?.[1] ?? null };
  const achievements = ACHIEVEMENTS.map((x) => ({ id: x.id, name: x.name, text: x.text, icon: x.icon, done: x.done(a), prog: PROG[x.id]?.(a) }));
  // Every constellation is its own mission patch (2026-10-09, Sevaan: they replace the gold constellation cards),
  // and so is the Solar System. The patch art is the stick figure (js/patches.js).
  for (const c of constellations) achievements.push({ id: `con-${c.id}`, con: c.id, name: c.system ? 'Solar System' : c.name, sub: c.system ? 'Home system' : c.nick.replace(/^part of /, ''), icon: '',
    text: c.system ? 'See the Sun, the Moon and all seven planets' : `Collect all ${c.stars.length} stars of ${c.name}`, done: c.stars.every((k) => seenCard.has(k)), prog: [c.stars.filter((k) => seenCard.has(k)).length, c.stars.length] });
  const ch = challengeFor(tonightKey), challenge = list.length && tonightKey !== firstNight ? { id: ch.id, text: ch.text, done: ch.done(tonight, now) } : null; // not on a first night: the starter set is enough
  // A filled album earns its own gold-foil patch (2026-10-10, playtest #17).
  for (const al of albums) { const have = al.keys.filter((k) => seenCard.has(k)).length; achievements.push({ id: `album-${al.id}`, album: al.id, name: al.name, sub: 'Gold album', icon: '', text: `Fill the ${al.name.replace(/^The /, "")} album to gold: ${al.goal.toLocaleString("en-US")} cards`, done: have >= al.goal, prog: [Math.min(have, al.goal), al.goal] }); }
  return { xp, rank, missions, challenge, streak: st, achievements, cards: a.cards };
}
