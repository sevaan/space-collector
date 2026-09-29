// Shared catalogue → card mapping. One collectible per constellation launch.
import { assignSets } from './sets.js?v=0.1.19';
import { tierFor } from './rarity.js?v=0.1.19';

export const cardKeyFor = (o) => String(o.card ?? o.key ?? o.id);
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
    cards.push({
      key, id: key, family: first.family, familyName: fam.name, maker: fam.maker, owner: fam.owner,
      name: `${fam.name} launch`, cospar: first.cospar?.slice(0, 8), launch: first.launch,
      year: first.launch ? Number(first.launch.slice(0, 4)) : null,
      kind: 'PAY', type: 'satellite', tier: 'common',
      bino: members.every((m) => m.bino) ? 1 : undefined,
      period: avg(members, 'period'), incl: avg(members, 'incl'),
      apogee: avg(members, 'apogee'), perigee: avg(members, 'perigee'),
      members: members.map((m) => m.id),
    });
  }
  assignSets(cards);
  return cards;
}

export function cardForObject(cat, id) {
  const object = cat.objects.find((o) => String(o.id) === String(id));
  return object ? buildCards(cat).find((c) => c.key === cardKeyFor(object)) : null;
}
