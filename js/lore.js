// Card titles and facts. Order: hand-written (data/lore.json) → researched series fact
// (data/series.json, mostly Kosmos programmes) → rocket/satellite family fact → a fact computed from
// the catalogue. Facts use **bold** for emphasis. Keep every fact TRUE: computed
// facts only state what the catalogue says today (orbit, launch date and site) or simple date
// comparisons. No extrapolating today's orbit back over decades (lifetime laps or distance).

import { orbitStats, titleCase, siteName, ownerName } from './facts.js?v=0.1.256';

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

let loreCache = null, seriesCache = null, purposeCache = null;
export async function loadLore(url = 'data/lore.json', seriesUrl = url.replace('lore.json', 'series.json'), purposeUrl = url.replace('lore.json', 'purpose.json')) {
  const get = async (u) => { try { return await (await fetch(u)).json(); } catch { return {}; } };
  [loreCache, seriesCache, purposeCache] = await Promise.all([get(url), get(seriesUrl), get(purposeUrl)]);
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

// What a satellite is for. 1) The UCS Satellite Database (data/purpose.json, satellites working in 2023):
// a sentence from its users, purpose and detail. 2) Well-documented families by name (PURPOSE). Both
// must stay true: purposes only, no claims about whether it still works.
const DETAIL = [
  [/Electronic Intelligence/i, 'listens for **radio and radar signals** on the ground (electronic intelligence)'],
  [/AIS|Automatic Identification/i, '**tracks ships at sea** by picking up their radio position signals'],
  [/Radar Imaging/i, '**images Earth with radar**, which sees through cloud and works at night'],
  [/Hyperspectral|Multispectral/i, '**photographs Earth** in many colours of light, beyond what eyes can see'],
  [/Infrared/i, '**photographs Earth in infrared**'],
  [/Optical Imaging/i, '**photographs Earth**'],
  [/Meteorology|Meterology/i, '**watches the weather**'],
  [/Earth Science/i, '**studies Earth\'s land, oceans and air**'],
  [/Navigation|Positioning/i, '**helps people find their position**'],
];
const PURPOSE_VERB = [
  [/Communications/i, '**relays communications**'], [/Navigation/i, '**helps people find their position**'],
  [/Earth Observation/i, '**watches Earth**'], [/Earth Science/i, '**studies Earth\'s land, oceans and air**'],
  [/Space Science/i, '**does space science**'], [/Space Observation/i, '**watches other objects in space**'],
  [/Surveillance/i, 'is used for **surveillance**'], [/Technology/i, '**tests new technology** in space'],
  [/Educational/i, 'was built **for education**'],
];
function ucsPurpose(o) {
  const r = purposeCache?.sats?.[o.id];
  if (!r) return null;
  let [users, purpose, detail, operator] = r;
  const verb = (detail && DETAIL.find(([re]) => re.test(detail))?.[1]) ?? PURPOSE_VERB.find(([re]) => re.test(purpose))?.[1];
  if (!verb) return null;
  const who = { Military: 'military', Government: 'government', Commercial: 'commercial', Civil: 'civilian' }[users.split('/')[0]] ?? '';
  const article = /^[aeiou]/i.test(who) ? 'An' : 'A';
  operator = operator?.replace(/Admnistration/g, 'Administration');
  const op = operator && operator.length <= 42 && !/[/;]/.test(operator) ? `, run by ${operator}` : '';
  return `${who ? `${article} **${who}**` : 'A'} satellite that ${verb}${op}.`;
}
const PURPOSE = [
  [/^OPS \d/, 'A **US Air Force** satellite. From 1963 to the mid-1980s military launches were given plain "OPS" numbers, and many missions were **secret**.'],
  [/^USA \d/, 'A **US military or intelligence** satellite. Since 1984 most American military satellites get a plain "USA" number instead of a name.'],
  [/^GLOBALSTAR/, 'A **Globalstar** satellite: it relays **satellite phone** calls and messages for people far from any phone network.'],
  [/^IRIDIUM/, 'An **Iridium** satellite: part of a network that lets **satellite phones** work anywhere on Earth, even at the poles.'],
  [/^ORBCOMM/, 'An **Orbcomm** satellite: it relays short **data messages** from trucks, ships and remote equipment.'],
  [/^MOLNIYA/, 'A **Molniya** communications satellite. Its long, looping orbit keeps it high over the **far north** for hours, where satellites above the equator can\'t reach.'],
  [/^FLOCK/, 'A Planet "Dove": a **shoebox-sized camera** satellite. Hundreds of them photograph the whole of Earth\'s land again and again.'],
  [/^EXPLORER/, 'Part of NASA\'s **Explorer** programme of science satellites, which began with America\'s first satellite in 1958.'],
  [/OSCAR|^RADIO|^JAS|^UOSAT/, 'An **amateur radio** satellite: radio hobbyists around the world can use it to talk to each other.'],
  [/^GONETS/, 'A Russian **Gonets** satellite: it **stores and forwards messages** for remote users, a descendant of the Soviet Strela military relays.'],
  [/^OV\d/, 'A US Air Force **Orbiting Vehicle**: a small 1960s research satellite that studied **space radiation** and the upper atmosphere.'],
  [/^TIROS/, 'One of the **TIROS weather satellites**, the series that sent back the first TV pictures of clouds from space in 1960.'],
  [/^ESSA/, 'An **ESSA weather satellite** (1966–69): the first system to photograph the **whole world\'s weather** every day.'],
  [/^NIMBUS/, 'A NASA **Nimbus** research satellite: it tried out the instruments behind modern **weather and climate** satellites.'],
  [/^DMSP/, 'A **US military weather satellite** (Defense Meteorological Satellite Program).'],
  [/^IRS[ -]/, 'An **Indian Remote Sensing** satellite: it photographs land for **maps, farming and water planning**.'],
  [/^NADEZHDA/, 'A Russian **Nadezhda** satellite: it helps ships find their position and picks up **distress beacons** for search and rescue (COSPAS-SARSAT).'],
  [/^TRANSIT/, 'A **Transit** navigation satellite: the US Navy\'s system for ships and submarines to find their position, the **forerunner of GPS**.'],
  [/^NOVA/, 'A **NOVA** satellite: an improved version of the US Navy\'s Transit **navigation** satellites.'],
  [/^JILIN/, 'A **Jilin-1** satellite: part of a large Chinese commercial fleet that **photographs and films Earth**.'],
  [/^GGSE/, 'GGSE stands for **Gravity Gradient Stabilization Experiment**: testing how to keep a satellite pointing at Earth using gravity alone.'],
  [/^SECOR/, 'A **SECOR** satellite: the US Army used these to measure exact distances between places on Earth, to make **accurate maps**.'],
  [/^SPOT/, 'A French **SPOT** satellite: it photographs Earth\'s land for **maps, farming and forestry**.'],
  [/^OKEAN/, 'An **Okean** satellite: it watched the **oceans and sea ice** with radar.'],
  [/^FENGYUN|^FY-/, 'A Chinese **Fengyun weather satellite**.'],
  [/^RAPIDEYE/, 'One of five **RapidEye** satellites that photographed **farmland and forests** to monitor crops and land.'],
  [/^SOLRAD/, 'A US Navy **SOLRAD** satellite. The series watched the **Sun\'s X-rays**, and the first ones secretly also eavesdropped on Soviet radar.'],
  [/^LANDSAT/, 'A **Landsat** satellite: the longest-running programme photographing Earth\'s land, used for **maps, farming and tracking change**.'],
  [/^MAQSAT/, 'A **dummy satellite** (a mass model) carried to **test the Ariane rocket** on an early flight.'],
  [/^AIST/, 'An **AIST** small satellite built by **Samara University** in Russia for science experiments.'],
  [/^AUREOLE/, 'An **Aureole** satellite: a Soviet-French mission to study the **northern lights** and Earth\'s magnetic field.'],
  [/^KIKU/, 'A Japanese **Kiku** engineering test satellite (ETS), built to **try out new satellite technology**.'],
  [/^INTERCOSMOS/, 'Part of **Intercosmos**, a Soviet programme that flew **science experiments** from partner countries.'],
  [/^MAGION/, 'A small Czech **Magion** satellite that studied Earth\'s **magnetic field and the space around Earth**.'],
  [/^KITSAT/, 'A **KITSAT** satellite: South Korea\'s first satellites, built with the University of Surrey.'],
  [/^STRV/, 'A British **Space Technology Research Vehicle**: a small satellite for **testing new technology** in space.'],
  [/^RESURS/, 'A Russian **Resurs** satellite: it **photographs Earth** for mapping and resources.'],
  [/^CBERS/, 'A **China–Brazil Earth Resources Satellite**: it photographs land for both countries.'],
  [/^SHIYAN/, 'A Chinese **Shiyan** satellite. Shiyan means "experiment": they **test new technology** in space.'],
  [/^SHIJIAN|^SJ-/, 'A Chinese **Shijian** satellite. Shijian means "practice": the series tests new technology and does experiments, and some missions are **secret**.'],
  [/^YAOGAN/, 'A Chinese **Yaogan** satellite. China calls them remote-sensing satellites; most are believed to be **military reconnaissance**.'],
  [/^TELSTAR/, 'A **Telstar** communications satellite. The first Telstar carried the first **live TV across the Atlantic**, in 1962.'],
  [/^RELAY/, 'A NASA **Relay** satellite: an early experiment in **relaying TV and phone calls** across oceans (1962–64).'],
  [/^ALOUETTE/, 'An **Alouette** satellite. Alouette 1 (1962) was Canada\'s first satellite; the Alouettes studied the **upper atmosphere**.'],
];
export function purposeFact(o) {
  if (o.type !== 'satellite' || o.launches) return null;
  return PURPOSE.find(([re]) => re.test(o.name))?.[1] ?? ucsPurpose(o) ?? null;
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
  const purpose = purposeFact(o);
  if (purpose) return purpose;
  const list = computedFacts(o);
  return list.length ? list[Number(o.id) % list.length] : 'A tracked object in Earth orbit.';
}

// Where a card's fact comes from (for the catalogue export and checks).
export function factSourceFor(o) {
  if (o.natural || loreCache?.[o.id]?.fact) return 'Hand-written';
  if (o.launches) return 'Fleet summary';
  if (seriesOf(o)) return 'Researched series';
  if (FAMILY.some(([re, , kinds]) => re.test(o.name) && (!kinds || kinds.includes(o.kind)))) return 'Rocket/satellite family';
  if (PURPOSE.some(([re]) => re.test(o.name)) && o.type === 'satellite') return 'Satellite family purpose';
  if (purposeFact(o)) return 'UCS Satellite Database';
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
