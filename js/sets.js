// Card sets. Every object belongs to one primary set (its colour bar and card number) and can
// count toward others. Membership is computed from catalogue facts, so it stays automatic.

const year = (o) => (o.launch ? Number(o.launch.slice(0, 4)) : null);
const isDead = (o) => o.kind === 'PAY' && (o.ops === '-' || o.ops === 'D' || ((!o.ops || o.ops === '?') && year(o) < 2000));

// Order matters: the first matching set is the card's primary set.
export const SETS = [
  { id: 'wanderers', name: 'The Wanderers', color: '#c08a2e', test: (o) => o.type === 'sun' || o.type === 'moon' || o.type === 'planet' || !!o.system },
  { id: 'constellations', name: 'Constellations', color: '#c9a227', test: (o) => o.type === 'constellation' || (o.type === 'star' && !!o.con && !o.skyName) },
  { id: 'bright-stars', name: 'Bright Stars', color: '#3f58a8', test: (o) => o.type === 'star' },
  { id: 'stations', name: 'Stations', color: '#e8412c', test: (o) => o.type === 'station' || /^(DRAGON|CREW DRAGON|SOYUZ|PROGRESS|SHENZHOU|TIANZHOU|CYGNUS)/.test(o.name) },
  { id: 'mega', name: 'Fleets', color: '#7c8591', test: (o) => !!o.launches || !!o.family || /^(STARLINK|ONEWEB|QIANFAN|GUOWANG|KUIPER|IRIDIUM|GLOBALSTAR|ORBCOMM|SPACEMOBILE|BLUEBIRD)/.test(o.name) }, // above the age/dead sets: a fleet card is a Fleet even if its first launch was in the 1990s
  { id: 'space-race', name: 'Space Race Relics', color: '#e8a33d', test: (o) => year(o) && year(o) <= 1975 },
  { id: 'red-stars', name: 'Red Stars', color: '#8c2334', test: (o) => o.type === 'rocket-body' && o.owner === 'CIS' },
  { id: 'rocket-stages', name: 'Rocket Stages', color: '#2f3237', test: (o) => o.type === 'rocket-body' },
  { id: 'dead-sats', name: 'Dead Satellites Society', color: '#6b5b95', test: isDead },
  { id: 'junk', name: 'Space Junk', color: '#a0673a', test: (o) => o.type === 'debris' },
  { id: 'nations', name: 'Launch Nations', color: '#1f6fd1', test: () => true },
];

export const SET_BY_ID = Object.fromEntries(SETS.map((s) => [s.id, s]));

// Attach primary set and card number (within the set, oldest first) to every object.
export function assignSets(objects) {
  const members = new Map(SETS.map((s) => [s.id, []]));
  for (const o of objects) {
    const s = SETS.find((set) => set.test(o));
    o.set = s.id;
    members.get(s.id).push(o);
  }
  for (const [id, list] of members) {
    list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || (a.launch ?? '9999').localeCompare(b.launch ?? '9999') || a.id - b.id);
    list.forEach((o, i) => { o.setNumber = i + 1; o.setSize = list.length; });
  }
  return members;
}

// Albums (one per set): bronze / silver / gold goals scale with the set's size, so every album has a reachable gold.
export function albumGoals(n) { return n <= 30 ? [1, Math.ceil(n / 2), n] : n <= 300 ? [10, 50, 100] : [10, 50, 200]; }
// For progress(): each album's cards and its gold goal (a filled album earns its own patch, 2026-10-10 #17).
export function albumList(cards) {
  return SETS.map((s) => { const keys = cards.filter((c) => c.set === s.id).map((c) => String(c.key ?? c.id)); return { id: s.id, name: s.name, keys, goal: albumGoals(keys.length)[2] }; }).filter((a) => a.keys.length);
}
// Albums you've filled to gold (cards-page writes localStorage goldAlbums): their cards wear an album card back.
export function goldAlbums() { try { return new Set(JSON.parse(localStorage.getItem('goldAlbums')) || []); } catch { return new Set(); } }
