// Shared catalogue → card mapping. Constellations (Starlink, OneWeb, Qianfan, Kuiper) are one fleet
// card each; every launch in the fleet is a stamp on that card. Other objects are one card each.
import { assignSets } from './sets.js?v=0.1.124';
import { tierFor } from './rarity.js?v=0.1.124';
import { NATURAL } from './natural.js?v=0.1.124';

// Fleet members carry their launch key in the catalogue (`card` = 'STARLINK:2024-012'). That's the
// stamp; the card itself is the fleet ('STARLINK').
export const cardKeyFor = (o) => String(o.family ?? o.card ?? o.key ?? o.id);
export const stampKeyFor = (o) => (o.family && o.card ? String(o.card) : null);

// Sightings saved before fleet cards (up to v0.1.55) have cardKey = the launch key. Read them as
// fleet card + stamp without rewriting what's stored.
export function sightingKeys(s) {
  if (s.stampKey) return { cardKey: String(s.cardKey), stampKey: String(s.stampKey) };
  const key = String(s.cardKey ?? s.objectId);
  const m = /^([A-Z]+):(\d{4}-\d{3})$/.exec(key);
  return m ? { cardKey: m[1], stampKey: key } : { cardKey: key, stampKey: null };
}
export const normalizeSighting = (s) => ({ ...s, ...sightingKeys(s) });

// Fleet levels count launches stamped. Fixed per fleet so a level is never lost as launches are added.
const FLEET_LEVELS = { STARLINK: [1, 10, 50] };
export const fleetThresholds = (family) => FLEET_LEVELS[family] ?? [1, 5, 10];
export function fleetLevel(family, stamps) {
  const [b, s, g] = fleetThresholds(family);
  return stamps >= g ? 'gold' : stamps >= s ? 'silver' : stamps >= b ? 'bronze' : 'none';
}
export const stampsIn = (sightings) => new Set(sightings.filter((s) => !s.sim).map((s) => sightingKeys(s).stampKey).filter(Boolean));
const avg = (list, field) => {
  const values = list.map((o) => o[field]).filter(Number.isFinite);
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
};

export function buildCards(cat) {
  const groups = new Map();
  for (const o of cat.objects ?? []) {
    const key = cardKeyFor(o);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(o);
  }
  const cards = [];
  for (const [key, members] of groups) {
    const first = members[0];
    if (!first.family) {
      const { satrec, _label, _setColor, ...record } = first;
      cards.push({ ...record, key, tier: first.tier ?? tierFor(first) });
      continue;
    }
    const fam = cat.families?.[first.family] ?? { name: first.family };
    const byLaunch = new Map();
    for (const m of members) {
      const k = stampKeyFor(m) ?? `${first.family}:?`;
      if (!byLaunch.has(k)) byLaunch.set(k, { key: k, cospar: k.split(':')[1], launch: m.launch ?? null, n: 0 });
      byLaunch.get(k).n++;
    }
    const launches = [...byLaunch.values()].sort((a, b) => (a.launch ?? '9999').localeCompare(b.launch ?? '9999') || a.key.localeCompare(b.key));
    cards.push({
      key, id: key, family: first.family, familyName: fam.name, maker: fam.maker, owner: fam.owner,
      name: fam.name, launch: launches[0]?.launch ?? null,
      year: launches[0]?.launch ? Number(launches[0].launch.slice(0, 4)) : null,
      kind: 'PAY', type: 'satellite', tier: 'common',
      bino: members.every((m) => m.bino) ? 1 : undefined,
      period: avg(members, 'period'), incl: avg(members, 'incl'),
      apogee: avg(members, 'apogee'), perigee: avg(members, 'perigee'),
      members: members.map((m) => m.id),
      launches,
    });
  }
  // The Moon, planets and bright stars aren't in the orbital catalogue but are cards too.
  for (const n of NATURAL) cards.push({ ...n });
  assignSets(cards);
  return cards;
}

export function cardForObject(cat, id) {
  const object = cat.objects.find((o) => String(o.id) === String(id));
  return object ? buildCards(cat).find((c) => c.key === cardKeyFor(object)) : null;
}
