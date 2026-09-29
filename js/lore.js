// Card titles and facts. Order: hand-written (data/lore.json) → rocket/satellite family fact →
// a fact computed from the orbit. Facts use **bold** for emphasis. Keep every fact true.

import { orbitStats, titleCase } from './facts.js?v=0.1.15';

const FAMILY = [
  [/^IRIDIUM 33 DEB/, 'A piece of the **first-ever crash between two satellites**: Iridium 33 hit the dead Cosmos 2251 in 2009.'],
  [/^COSMOS 2251 DEB/, 'Left over from the **first-ever crash between two satellites**, when this dead satellite hit Iridium 33 in 2009.'],
  [/^FENGYUN 1C DEB/, 'Debris from a weather satellite China **destroyed with a missile** in a 2007 test, which created a huge cloud of junk.'],
  [/^COSMOS 1408 DEB/, 'Debris from an old satellite Russia **destroyed with a missile** in 2021. The ISS crew had to shelter from the cloud.'],
  [/^SL-3\b/, 'Same rocket family that carried **Yuri Gagarin**, the first human in space, in 1961.'],
  [/^SL-8\b/, 'From the Kosmos-3M, a Soviet workhorse rocket that flew **more than 400 times**.'],
  [/^SL-14\b/, 'From a Tsyklon-3, a Ukrainian-built rocket launched from Plesetsk in **Russia\'s far north**.'],
  [/^SL-16\b/, 'A Zenit upper stage, one of the **biggest pieces of junk** in low orbit: about the size of a bus.'],
  [/^CZ-/, 'Part of China\'s **Long March** rocket family, named after the Red Army\'s march in the 1930s.'],
  [/CENTAUR/, 'Centaur was the **first rocket stage to burn liquid hydrogen**, the same fuel as the Space Shuttle.'],
  [/AGENA/, 'Agena stages also served as **docking targets** for Gemini astronauts in 1966.'],
  [/^ARIANE/, 'Europe\'s Ariane rockets launch from **French Guiana**, close to the equator, where Earth\'s spin gives them a boost.'],
  [/^DELTA/, 'Delta rockets grew out of the Thor missile and kept flying for **more than 60 years**.'],
  [/^H-2A/, 'Japan\'s H-IIA launched from **Tanegashima**, an island launch site in southern Japan.'],
  [/^(COSMOS|KOSMOS)/, '"Kosmos" was the name the Soviets gave **thousands of satellites**, which kept their real jobs a secret.'],
  [/^METEOR/, 'A Soviet **weather satellite**, one of a family that has been photographing clouds since the 1960s.'],
  [/^NOAA/, 'An American **weather satellite**. Its pictures helped forecasters track storms around the world.'],
];

const APOLLO_11 = '1969-07-20';
const MOON_ROUND_TRIP_KM = 768800;

let loreCache = null;
export async function loadLore(url = 'data/lore.json') {
  try { loreCache = await (await fetch(url)).json(); } catch { loreCache = {}; }
  return loreCache;
}

const shortDate = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export function titleFor(o) {
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

function fmtBig(n) {
  if (n >= 1e9) return `${(n / 1e9).toFixed(n >= 1e10 ? 0 : 1)} billion`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1)} million`;
  if (n >= 10000) return (Math.round(n / 1000) * 1000).toLocaleString('en-US');
  return Math.round(n).toLocaleString('en-US');
}

// Facts computed from the orbit, for objects without a hand-written or family fact.
export function computedFacts(o, now = new Date()) {
  const out = [];
  const days = o.launch ? (now - new Date(`${o.launch}T00:00:00Z`)) / 86400000 : null;
  const st = orbitStats(o);
  if (days && o.period) {
    const laps = (days * 1440) / o.period;
    out.push(`It has lapped Earth about **${fmtBig(laps)} times** since launch.`);
    if (st) {
      const km = laps * 2 * Math.PI * (6371 + st.alt);
      const trips = km / MOON_ROUND_TRIP_KM;
      if (trips >= 2) out.push(`It has travelled about **${fmtBig(km)} km**, enough for ${fmtBig(trips)} trips to the Moon and back.`);
    }
  }
  if (o.launch && o.launch < APOLLO_11) out.push('It was **already up there** when Apollo 11 landed on the Moon.');
  else if (o.year && o.year < 1991) out.push('It\'s **older than the World Wide Web**.');
  if (st) out.push(`It moves **${st.speed.toFixed(1)} km every second**. That's Toronto to Montreal in about ${Math.round(504 / st.speed)} seconds.`);
  if (o.parent && o.type !== 'satellite') out.push(`It carried **${titleCase(o.parent)}** into orbit, then stayed up there itself.`);
  return out;
}

function familyFact(o, now) {
  const days = o.launch ? (now - new Date(`${o.launch}T00:00:00Z`)) / 86400000 : 999;
  const lead = `**${o.members.length} ${o.familyName} satellites** from one launch${o.maker ? ` by ${o.maker}` : ''}.`;
  if (days < 30) return `${lead} Fresh from launch, they still fly in a line like a **string of pearls**.`;
  return `${lead} They've since spread out into a web around the planet. Catch as many as you can.`;
}

export function factFor(o, now = new Date()) {
  if (o.members) return familyFact(o, now);
  const hand = loreCache?.[o.id]?.fact;
  if (hand) return hand;
  const fam = FAMILY.find(([re]) => re.test(o.name));
  if (fam) return fam[1];
  const list = computedFacts(o, now);
  return list.length ? list[o.id % list.length] : 'Catch it again to learn more.';
}

// Third stat on the card: hand-written override, or size.
export function thirdStat(o, sizeLabel, seenMembers = 0) {
  if (o.members) return { label: 'SEEN', value: `${seenMembers} / ${o.members.length}` };
  const s = loreCache?.[o.id]?.stat;
  return s ? { label: s[0], value: s[1] } : { label: 'SIZE', value: sizeLabel };
}

// **bold** → <b>, everything else escaped.
export function richText(s) {
  const esc = String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  return esc.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
}
