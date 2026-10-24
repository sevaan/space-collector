// Shared catalogue → card mapping. Fleets (Starlink, OneWeb, Qianfan, Kuiper, Globalstar, Orbcomm, Iridium) are one fleet
// card each; every launch in the fleet is a stamp on that card. Other objects are one card each.
import { assignSets } from './sets.js?v=0.1.1100';
import { tierFor } from './rarity.js?v=0.1.1100';
import { fallAt, bumpTier } from './last-chance.js?v=0.1.1100';
import { NATURAL } from './natural.js?v=0.1.1100';

// Fleet members carry their launch key in the catalogue (`card` = 'STARLINK:2024-012'). That’s the
// stamp; the card itself is the fleet ('STARLINK').
export const cardKeyFor = (o) => String(o.family ?? o.card ?? o.key ?? o.id);
// The Moon’s phases are stamps on the Moon card, like a fleet’s launches (2026-10-17, Sevaan): eight phases, the phase
// at the moment you saw it. A mean synodic month from a known new Moon is plenty for eighths (±half a day).
export const MOON_PHASES = ['New Moon', 'Waxing crescent', 'First quarter', 'Waxing gibbous', 'Full Moon', 'Waning gibbous', 'Last quarter', 'Waning crescent'];
export function moonPhaseAt(t) { const f = ((((t - Date.UTC(2000, 0, 6, 18, 14)) / 86400e3 / 29.530588853) % 1) + 1) % 1; return Math.floor(f * 8 + 0.5) % 8; }
export const moonPhaseOf = (stampKey) => { const m = /^MOON:(\d)$/.exec(stampKey ?? ''); return m ? Number(m[1]) : null; };
// t: the sighting’s time (the Moon’s stamp depends on when you saw it; fleets' don’t).
export const stampKeyFor = (o, t = null) => (o.family && o.card ? String(o.card) : o.type === 'moon' && o.natural && t != null ? `MOON:${moonPhaseAt(t)}` : null);

// Sightings saved before fleet cards (up to v0.1.55) have cardKey = the launch key. Read them as
// fleet card + stamp without rewriting what’s stored.
// Satellites that joined a fleet later (Globalstar, Orbcomm, Iridium: 2026-10-08) have sightings saved as their own
// card (cardKey = the object id). buildCards records every fleet member’s launch key here so those read as
// fleet card + stamp too.
const fleetOf = new Map();
export function sightingKeys(s) {
  if (s.stampKey) return { cardKey: String(s.cardKey), stampKey: String(s.stampKey) };
  if (String(s.cardKey ?? s.objectId) === 'moon' && s.time) return { cardKey: 'moon', stampKey: `MOON:${moonPhaseAt(s.time)}` }; // Moon sightings from before phase stamps
  const joined = fleetOf.get(String(s.objectId));
  if (joined && String(s.cardKey ?? s.objectId) === String(s.objectId)) return joined;
  const key = String(s.cardKey ?? s.objectId);
  const m = /^([A-Z]+):(\d{4}-\d{3})$/.exec(key);
  return m ? { cardKey: m[1], stampKey: key } : { cardKey: key, stampKey: null };
}
export const normalizeSighting = (s) => ({ ...s, ...sightingKeys(s) });

// Fleet levels count launches stamped. Fixed per fleet so a level is never lost as launches are added.
const FLEET_LEVELS = { STARLINK: [1, 10, 50], GLOBALSTAR: [1, 5, 12], ORBCOMM: [1, 4, 8], IRIDIUM: [1, 5, 10] };
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
  for (const o of cat.objects ?? []) if (o.family && o.card && o.card.includes(':')) fleetOf.set(String(o.id), { cardKey: o.family, stampKey: String(o.card) });
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
      const tier = first.tier ?? tierFor(first), fall = fallAt(first); // falling: a last chance card, one rarity step up while it lasts
      cards.push({ ...record, key, tier: fall ? bumpTier(tier) : tier, ...(fall ? { fallAt: fall } : {}) });
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
      kind: 'PAY', type: 'satellite', tier: fam.tier ?? 'common',
      bino: members.every((m) => m.bino) ? 1 : undefined,
      period: avg(members, 'period'), incl: avg(members, 'incl'),
      apogee: avg(members, 'apogee'), perigee: avg(members, 'perigee'),
      members: members.map((m) => m.id),
      launches,
    });
  }
  // Same-name rocket stages and debris (286 "SL-8 R/B"s) get a number in their run, oldest first, so each card has its
  // own identity: "No. 14 of 286" (craft and collectors rooms 2026-10-11).
  { const runs = new Map();
    for (const c of cards) if (!c.family && (c.type === 'rocket-body' || c.type === 'debris')) { const k = c.name.replace(/\s*\(.*\)\s*$/, ''); if (!runs.has(k)) runs.set(k, []); runs.get(k).push(c); }
    for (const run of runs.values()) if (run.length > 1) { run.sort((a, b) => String(a.launch ?? '').localeCompare(String(b.launch ?? '')) || a.id - b.id); run.forEach((c, i) => { c.runNo = i + 1; c.runOf = run.length; }); } }
  // Reunions (2026-10-17, Sevaan approved from the fun playtest): a rocket stage and the satellite it carried share a
  // launch (the first 8 characters of COSPAR, 1965-088). Each card from a launch that has both lists its partners, so
  // owning a stage and its passenger reunites them. ~770 launches qualify.
  { const byLaunch = new Map();
    for (const c of cards) { if (c.family || !c.cospar || c.type === 'debris') continue; const k = String(c.cospar).slice(0, 8);
      let l = byLaunch.get(k); if (!l) byLaunch.set(k, (l = { stages: [], payloads: [] })); (c.type === 'rocket-body' ? l.stages : l.payloads).push(c); }
    for (const [k, l] of byLaunch) if (l.stages.length && l.payloads.length) {
      for (const c of l.stages) { c.reunion = k; c.partners = l.payloads.map((x) => x.key); }
      for (const c of l.payloads) { c.reunion = k; c.partners = l.stages.map((x) => x.key); }
    } }
  // The Moon, planets and bright stars aren’t in the orbital catalogue but are cards too.
  for (const n of NATURAL) cards.push({ ...n });
  assignSets(cards);
  return cards;
}

export function cardForObject(cat, id) {
  const object = cat.objects.find((o) => String(o.id) === String(id));
  return object ? buildCards(cat).find((c) => c.key === cardKeyFor(object)) : null;
}
