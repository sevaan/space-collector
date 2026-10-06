// Player progress from the sighting log: XP and observer rank, tonight's three missions, a weekly streak and
// achievements. Everything is derived from the saved sightings (nothing extra is stored), so it can't drift.
// info(cardKey) -> { tier, type, owner, launch, natural, con } | null. No DOM.
import { nightKey } from './observation.js?v=0.1.113';

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
export function missionsFor(night) {
  let h = 0; for (const c of String(night)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const pick = [], pool = MISSIONS.slice();
  while (pick.length < 3) { h = (h * 1103515245 + 12345) >>> 0; pick.push(pool.splice(h % pool.length, 1)[0]); }
  return pick;
}

// ---------- achievements ----------
export const ACHIEVEMENTS = [
  { id: 'first', name: 'First Light', text: 'Collect your first card', icon: '✦', done: (a) => a.cards >= 1 },
  { id: 'ten', name: 'Logbook', text: 'Collect 10 cards', icon: '10', done: (a) => a.cards >= 10 },
  { id: 'hundred', name: 'Centurion', text: 'Collect 100 cards', icon: '100', done: (a) => a.cards >= 100 },
  { id: 'legend', name: 'Legend', text: 'Collect a Legendary card', icon: '★', done: (a) => a.tiers.has('legendary') },
  { id: 'shiny', name: 'Shiny Hunter', text: 'Catch a shiny', icon: '✧', done: (a) => a.shinies >= 1 },
  { id: 'owl', name: 'Night Owl', text: 'Log a sighting between 1 and 4 am', icon: '☾', done: (a) => a.hours.some((h) => h >= 1 && h < 4) },
  { id: 'dawn', name: 'Dawn Patrol', text: 'Log a sighting between 4 and 7 am', icon: '☀', done: (a) => a.hours.some((h) => h >= 4 && h < 7) },
  { id: 'double', name: 'Double Sighting', text: 'Collect two new cards within a minute', icon: '×2', done: (a) => a.double },
  { id: 'oldtimer', name: 'Old Timer', text: 'Catch something launched before 1970', icon: '1960s', done: (a) => a.oldest != null && a.oldest < 1970 },
  { id: 'race', name: 'Space Race', text: 'A Soviet object and an American one on the same night', icon: '⚔', done: (a) => a.race },
  { id: 'wanderers', name: 'Wanderer', text: 'Collect the Moon and all five planets', icon: '♄', done: (a) => a.wanderers >= 6 },
  { id: 'constellation', name: 'Star Map', text: 'Complete a constellation', icon: '✶', done: (a) => a.cons >= 1 },
  { id: 'zodiac', name: 'Zodiac', text: 'Complete all 12 zodiac constellations', icon: 'XII', done: (a) => a.zodiac >= 12 },
  { id: 'nations', name: 'Around the World', text: 'Objects from 8 different countries or agencies', icon: '8', done: (a) => a.owners.size >= 8 },
  { id: 'streak4', name: 'Regular', text: 'Observe 4 weeks in a row', icon: '4w', done: (a) => a.bestStreak >= 4 },
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
  const a = { cards: 0, tiers: new Set(), shinies: 0, hours: [], double: false, oldest: null, race: false, wanderers: 0, cons: 0, zodiac: 0, owners: new Set() };
  let lastFirst = -Infinity;
  for (const s of list) {
    const i = info(s.cardKey), night = nightKey(s.time, s.lon ?? 0), first = !seenCard.has(s.cardKey), nk = `${s.cardKey}|${night}`;
    if (first) { seenCard.add(s.cardKey); xp += TIER_XP[i?.tier] ?? 10; a.cards++; if (s.time - lastFirst <= 60000) a.double = true; lastFirst = s.time; }
    else if (!seenNight.has(nk)) xp += REPEAT_XP;
    seenNight.add(nk);
    if (s.shiny) { xp += SHINY_XP; a.shinies++; }
    if (i?.tier) a.tiers.add(i.tier);
    a.hours.push(new Date(s.time).getHours());
    if (!i?.natural && i?.launch) { const y = year(i.launch); if (y && (a.oldest == null || y < a.oldest)) a.oldest = y; }
    if (i?.owner && !i.natural) a.owners.add(i.owner);
    if (!nights.has(night)) nights.set(night, []);
    nights.get(night).push({ ...s, info: i, first });
  }
  for (const n of nights.values()) if (n.some((s) => soviet(s.info)) && n.some((s) => american(s.info))) a.race = true;
  a.wanderers = ['moon', 'planet:mercury', 'planet:venus', 'planet:mars', 'planet:jupiter', 'planet:saturn'].filter((k) => seenCard.has(k)).length;
  for (const c of constellations) if (c.stars.every((k) => seenCard.has(k))) { a.cons++; xp += CON_XP; if (c.zodiac) a.zodiac++; }
  // Missions: every completed mission on any night counts once for XP; tonight's three are shown.
  for (const [night, n] of nights) for (const m of missionsFor(night)) if (m.done(n, n[0].time)) xp += MISSION_XP;
  const st = streaks(list, now); a.bestStreak = st.best;
  const tonightKey = nightKey(now, list[list.length - 1]?.lon ?? 0), tonight = nights.get(tonightKey) ?? [];
  const missions = missionsFor(tonightKey).map((m) => ({ id: m.id, text: m.text, done: m.done(tonight, now) }));
  let ri = 0; for (let k = 0; k < RANKS.length; k++) if (xp >= RANKS[k][0]) ri = k;
  const rank = { name: RANKS[ri][1], index: ri, at: RANKS[ri][0], next: RANKS[ri + 1]?.[0] ?? null, nextName: RANKS[ri + 1]?.[1] ?? null };
  const achievements = ACHIEVEMENTS.map((x) => ({ id: x.id, name: x.name, text: x.text, icon: x.icon, done: x.done(a) }));
  return { xp, rank, missions, streak: st, achievements, cards: a.cards };
}
