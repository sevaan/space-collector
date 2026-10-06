// Card titles and facts. Order: hand-written (data/lore.json) → researched series fact
// (data/series.json, mostly Kosmos programmes) → rocket/satellite family fact → a fact computed from
// the catalogue. Facts use **bold** for emphasis. Keep every fact TRUE: computed
// facts only state what the catalogue says today (orbit, launch date and site) or simple date
// comparisons. No extrapolating today's orbit back over decades (lifetime laps or distance).

import { orbitStats, titleCase, siteName, ownerName } from './facts.js?v=0.1.82';

const FAMILY = [
  [/^IRIDIUM 33 DEB/, 'A piece of the **first-ever crash between two satellites**: Iridium 33 hit the dead Cosmos 2251 in 2009.'],
  [/^COSMOS 2251 DEB/, 'Left over from the **first-ever crash between two satellites**, when this dead satellite hit Iridium 33 in 2009.'],
  [/^FENGYUN 1C DEB/, 'Debris from a weather satellite China **destroyed with a missile** in a 2007 test, which created a huge cloud of junk.'],
  [/^COSMOS 1408 DEB/, 'Debris from an old satellite Russia **destroyed with a missile** in 2021. The ISS crew had to shelter from the cloud.'],
  [/^SL-3\b/, 'Same rocket family that carried **Yuri Gagarin**, the first human in space, in 1961.', ['R/B']],
  [/^SL-8\b/, 'From the Kosmos-3M, a Soviet workhorse rocket that flew **more than 400 times**.'],
  [/^SL-14\b/, 'From a Tsyklon-3, a Ukrainian-built rocket launched from Plesetsk in **Russia\'s far north**.'],
  [/^SL-16\b/, 'A Zenit upper stage, one of the **biggest pieces of junk** in low orbit: about the size of a bus.', ['R/B']],
  [/^CZ-/, 'Part of China\'s **Long March** rocket family, named after the Red Army\'s march in the 1930s.'],
  [/CENTAUR/, 'Centaur was the **first rocket stage to burn liquid hydrogen**, the same fuel as the Space Shuttle.'],
  [/AGENA/, 'Agena stages also served as **docking targets** for Gemini astronauts in 1966.'],
  [/^ARIANE/, 'Europe\'s Ariane rockets launch from **French Guiana**, close to the equator, where Earth\'s spin gives them a boost.'],
  [/^DELTA/, 'Delta rockets grew out of the Thor missile and kept flying for **more than 60 years**.'],
  [/^H-2A/, 'Japan\'s H-IIA launched from **Tanegashima**, an island launch site in southern Japan.'],
  // Satellite families: only for the satellites themselves, not their debris or rocket stages.
  [/^(COSMOS|KOSMOS)/, '"Kosmos" is the name the Soviet Union, and then Russia, gave **thousands of satellites**, many of them military, without saying what each one was for.', ['PAY']],
  [/^METEOR/, 'A **weather satellite** from the Meteor family, which the Soviet Union and then Russia have flown since the 1960s.', ['PAY']],
  [/^NOAA \d/, 'An American **weather satellite** run by NOAA, part of a series that has watched the world\'s weather from orbit for decades.', ['PAY']],
];

const APOLLO_11 = '1969-07-20';
const WEB = '1989-03-12';      // Tim Berners-Lee's proposal for the World Wide Web
const GOOGLE = '1998-09-04';   // Google founded
const IPHONE = '2007-06-29';   // first iPhone on sale

let loreCache = null, seriesCache = null;
export async function loadLore(url = 'data/lore.json', seriesUrl = url.replace('lore.json', 'series.json')) {
  const get = async (u) => { try { return await (await fetch(u)).json(); } catch { return {}; } };
  [loreCache, seriesCache] = await Promise.all([get(url), get(seriesUrl)]);
  return loreCache;
}
const seriesOf = (o) => seriesCache?.series?.[seriesCache?.members?.[o.id]] ?? null;
// The researched programme a satellite belongs to (e.g. 'strela-1m'), once loadLore has run.
export const seriesKeyOf = (o) => seriesCache?.members?.[o.id] ?? null;

const shortDate = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export function titleFor(o) {
  if (o.natural) return o.name;
  if (o.launches) return o.familyName;
  if (o.members) return `${o.familyName} train, ${o.launch ? shortDate(o.launch) : 'unknown date'}`;
  const hand = loreCache?.[o.id]?.title;
  if (hand) return hand;
  return titleCase(o.name)
    .replace(/\bR\/B(\(\d\))?/i, 'Rocket Stage')
    .replace(/\bDeb\b/i, 'Debris')
    .replace(/\s+/g, ' ')
    .trim();
}

export function yearsUp(o, now = new Date()) {
  if (!o.launch) return null;
  const y = (now - new Date(`${o.launch}T00:00:00Z`)) / (365.25 * 86400000);
  return Math.max(0, Math.floor(y));
}

export function lapsPerDay(o) {
  return o.period ? 1440 / o.period : null;
}

const launchDay = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

// Facts computed from the catalogue, for objects without a hand-written or family fact. Each one is
// true as stated: today's orbit, the launch record, or a date comparison.
export function computedFacts(o) {
  const out = [];
  const st = orbitStats(o);
  const ecc = o.apogee != null && o.perigee != null ? o.apogee - o.perigee : null;
  // What launched it, or what launch it came from (rocket stages and debris share their payload's launch).
  if (o.parent && o.type === 'rocket-body') out.push(`It carried **${titleCase(o.parent)}** into orbit, then stayed up there itself.`);
  if (o.parent && o.type === 'debris') out.push(`A piece left over from the launch of **${titleCase(o.parent)}**.`);
  // Date comparisons.
  if (o.launch && o.launch < APOLLO_11) out.push('It was **already up there** when Apollo 11 landed on the Moon.');
  else if (o.launch && o.launch < WEB) out.push('It\'s **older than the World Wide Web**.');
  else if (o.launch && o.launch < GOOGLE) out.push('It was launched **before Google existed**.');
  else if (o.launch && o.launch < IPHONE) out.push('It was launched **before the first iPhone** went on sale.');
  // Today's orbit.
  if (ecc != null && ecc > 1500) out.push(`Its orbit is a long oval: it swoops from **${o.perigee.toLocaleString('en-US')} km** to **${o.apogee.toLocaleString('en-US')} km** above Earth.`);
  if (o.incl > 90) out.push('It orbits **against Earth\'s spin**, heading west, which takes extra rocket power to reach.');
  else if (o.incl >= 80) out.push('Its orbit runs **over the poles**, so over time it passes above almost every part of Earth.');
  if (st && ecc != null && ecc < 300) out.push(`It moves about **${st.speed.toFixed(1)} km every second**. That's Toronto to Montreal in about ${Math.round(504 / st.speed)} seconds.`);
  if (o.period) out.push(`It goes all the way around Earth in **${Math.round(o.period)} minutes**, about ${(1440 / o.period).toFixed(o.period > 144 ? 1 : 0)} times a day.`);
  // The launch record.
  if (o.launch && o.site && siteName(o.site) !== o.site) out.push(`Launched on **${launchDay(o.launch)}** from ${siteName(o.site)}.`);
  else if (o.launch) out.push(`Launched on **${launchDay(o.launch)}**${o.owner && ownerName(o.owner) !== o.owner ? ` by ${ownerName(o.owner)}` : ''}.`);
  return out;
}

function familyFact(o, now) {
  const days = o.launch ? (now - new Date(`${o.launch}T00:00:00Z`)) / 86400000 : 999;
  const lead = `**${o.members.length} ${o.familyName} satellites** from one launch${o.maker ? ` by ${o.maker}` : ''}.`;
  if (days < 30) return `${lead} Fresh from launch, they still fly in a line like a **string of pearls**.`;
  return `${lead} They've since spread out into a web around the planet. Catch as many as you can.`;
}

function fleetFact(o) {
  const n = o.members.length.toLocaleString('en-US'), first = o.launches[0]?.launch?.slice(0, 4);
  return `**${n} ${o.familyName} satellites** from ${o.launches.length} launches${first ? ` since ${first}` : ''}. Each launch you catch adds a stamp to this card.`;
}

export function factFor(o, now = new Date()) {
  if (o.natural) return o.fact;
  if (o.launches) return fleetFact(o);
  if (o.members) return familyFact(o, now);
  const hand = loreCache?.[o.id]?.fact;
  if (hand) return hand;
  const series = seriesOf(o);
  if (series) return series.facts ? series.facts[Number(o.id) % series.facts.length] : series.fact;
  const fam = FAMILY.find(([re, , kinds]) => re.test(o.name) && (!kinds || kinds.includes(o.kind)));
  if (fam) return fam[1];
  const list = computedFacts(o);
  return list.length ? list[Number(o.id) % list.length] : 'A tracked object in Earth orbit.';
}

// Where a card's fact comes from (for the catalogue export and checks).
export function factSourceFor(o) {
  if (o.natural || loreCache?.[o.id]?.fact) return 'Hand-written';
  if (o.launches) return 'Fleet summary';
  if (seriesOf(o)) return 'Researched series';
  if (FAMILY.some(([re, , kinds]) => re.test(o.name) && (!kinds || kinds.includes(o.kind)))) return 'Rocket/satellite family';
  return 'From the catalogue';
}

// Third stat on the card: hand-written override, or size.
export function thirdStat(o, sizeLabel, seenMembers = 0) {
  if (o.launches) return { label: 'FIRST LAUNCH', value: o.launches[0]?.launch?.slice(0, 4) ?? '—' };
  if (o.members) return { label: 'SEEN', value: `${seenMembers} / ${o.members.length}` };
  const s = loreCache?.[o.id]?.stat;
  // Default: the launch year, so every card shows when it's from as well as how long it's been up.
  return s ? { label: s[0], value: s[1] } : { label: 'LAUNCHED', value: o.launch?.slice(0, 4) ?? String(o.year ?? '—') };
}

// **bold** → <b>, everything else escaped.
export function richText(s) {
  const esc = String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  return esc.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
}
