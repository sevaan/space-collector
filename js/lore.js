// Card titles and facts. Order: hand-written (data/lore.json) → researched series fact
// (data/series.json, mostly Kosmos programmes) → rocket/satellite family fact → a fact computed from
// the catalogue. Facts use **bold** for emphasis. Keep every fact TRUE: computed
// facts only state what the catalogue says today (orbit, launch date and site) or simple date
// comparisons. No extrapolating today’s orbit back over decades (lifetime laps or distance).

import { orbitStats, titleCase, siteName, ownerName } from './facts.js?v=0.1.1357';
import { localText } from './localize.js?v=0.1.1357';

const FAMILY = [
  [/^IRIDIUM 33 DEB/, 'A piece of the **first accidental collision between two intact satellites**: Iridium 33 hit the dead Kosmos 2251 in 2009.'],
  [/^COSMOS 2251 DEB/, 'Left over from the **first accidental collision between two intact satellites**, when this dead satellite hit Iridium 33 in 2009.'],
  [/^FENGYUN 1C DEB/, 'Debris from a weather satellite China **destroyed with a missile** in a 2007 test, which created a huge cloud of junk.'],
  [/^COSMOS 1408 DEB/, 'Debris from an old satellite Russia **destroyed with a missile** in 2021. The ISS crew had to shelter from the cloud.'],
  [/^SL-3\b/, 'Same rocket family that carried **Yuri Gagarin**, the first human in space, in 1961.', ['R/B']],
  [/^SL-8\b/, 'From the Kosmos-3M, a Soviet workhorse rocket that flew **more than 400 times**.'],
  [/^SL-14\b/, 'From a Tsyklon-3, a Ukrainian-built rocket launched from Plesetsk in **Russia’s far north**.'],
  [/^SL-16\b/, 'A Zenit upper stage, one of the **biggest pieces of junk** in low orbit: about the size of a bus.', ['R/B']],
  [/^CZ-/, 'Part of China’s **Long March** rocket family, named after the Red Army’s march in the 1930s.'],
  [/CENTAUR/, 'Centaur was the **first rocket stage to burn liquid hydrogen**, the same fuel as the Space Shuttle.'],
  [/AGENA/, 'Agena stages also served as **docking targets** for Gemini astronauts in 1966.'],
  [/^ARIANE/, 'Europe’s Ariane rockets launch from **French Guiana**, close to the equator, where Earth’s spin gives them a boost.'],
  // Delta facts are about the rocket this piece came from, not the whole family’s history (2026-10-12, Sevaan).
  [/^DELTA 2\b/, 'From a Delta II, a rocket that flew **155 times** between 1989 and 2018. It launched GPS satellites and the Mars rovers **Spirit and Opportunity**.'],
  [/^DELTA 1\b/, 'From an early Delta, a rocket built from the **Thor missile**. A Thor-Delta launched **Telstar**, the first satellite to relay live TV, in 1962.'],
  [/^DELTA/, 'From the Delta family of rockets, which launched from 1960 until the last **Delta IV Heavy** in 2024.'],
  [/^H-2A/, 'Japan’s H-IIA launched from **Tanegashima**, an island launch site in southern Japan.'],
  // Satellite families: only for the satellites themselves, not their debris or rocket stages.
  [/^(COSMOS|KOSMOS)/, '“Kosmos” is the name the Soviet Union, and then Russia, gave **thousands of satellites**, many of them military, without saying what each one was for.', ['PAY']],
  [/^METEOR/, 'A **weather satellite** from the Meteor family, which the Soviet Union and then Russia have flown since the 1960s.', ['PAY']],
  [/^NOAA \d/, 'An American **weather satellite** run by NOAA, part of a series that has watched the world’s weather from orbit for decades.', ['PAY']],
];

const APOLLO_11 = '1969-07-20';
const WEB = '1989-03-12';      // Tim Berners-Lee’s proposal for the World Wide Web
const GOOGLE = '1998-09-04';   // Google founded
const IPHONE = '2007-06-29';   // first iPhone on sale

let loreCache = null, seriesCache = null, purposeCache = null, debrisCache = null, factsCache = null, rocketFacts = [];
let srcCache = {};
export async function loadLore(url = 'data/lore.json', seriesUrl = url.replace('lore.json', 'series.json'), purposeUrl = url.replace('lore.json', 'purpose.json')) {
  const get = async (u) => { try { return await (await fetch(u)).json(); } catch { return {}; } };
  [loreCache, seriesCache, purposeCache, debrisCache, factsCache] = await Promise.all([get(url), get(seriesUrl), get(purposeUrl), get(url.replace('lore.json', 'debris.json')), get(url.replace('lore.json', 'facts.json'))]);
  rocketFacts = (factsCache?.rockets ?? []).map((r) => ({ ...r, re: new RegExp(r.match) }));
  srcCache = await get(url.replace('lore.json', 'fact-sources.json'));
  rolesCache = await get(url.replace('lore.json', 'roles.json'));
  return loreCache;
}
// Researched facts (pre-launch writing review, 2026-10-15; data/facts.json, each with its source): one per satellite in
// `sats`, and for rocket stages a few true lines per rocket in `rockets`, picked by NORAD id so neighbours differ.
const researched = (o) => factsCache?.sats?.[o.id]?.fact ?? null;
const rocketFact = (o) => { if (o.type !== 'rocket-body') return null; const r = rocketFacts.find((x) => x.re.test(o.name ?? '')); return r?.facts?.length ? r.facts[Number(o.id) % r.facts.length] : null; };
const seriesOf = (o) => seriesCache?.series?.[seriesCache?.members?.[o.id]] ?? null;
// What a debris card really is (data/debris.json, scripts/build-debris.py, 2026-10-15): { what, art?, fact }.
export const debrisOf = (o) => (o?.type === 'debris' ? debrisCache?.[o.id] ?? null : null);
// The researched programme a satellite belongs to (e.g. 'strela-1m'), once loadLore has run.
export const seriesKeyOf = (o) => seriesCache?.members?.[o.id] ?? null;

const shortDate = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

export function titleFor(o) {
  if (o.natural) return o.name;
  if (o.launches) return o.familyName;
  if (o.members) return `${o.familyName} train, ${o.launch ? shortDate(o.launch) : 'unknown date'}`;
  // A fleet member is named like its card: "Amazon Leo 00100", not "Kuiper-00100" (collectors 2026-10-11).
  if (o.family && o.familyName && !o.name.toUpperCase().startsWith(o.familyName.toUpperCase())) return `${o.familyName} ${o.name.replace(/^[A-Z]+[- ]?/i, '')}`.trim();
  const hand = loreCache?.[o.id]?.title;
  if (hand) return hand;
  return titleCase(o.name)
    .replace(/\s*\[[^\]]*\]/g, '') // "Breeze-M Deb [Tank]": the catalogue’s notes in square brackets aren’t part of the name
    .replace(/(Stage|Motor)\s+R\/B(\(\d\))?/i, '$1') // "Electron Kick Stage R/B" was "Electron Kick Stage Rocket Stage"
    .replace(/\s*&\s*([\w-]+)\s+R\/B(\(\d\))?$/i, o.type === 'rocket-body' ? ' & $1 Rocket Stage' : ' (on its $1 stage)') // a satellite still on its stage: "Rubin-3/4 (on its SL-8 stage)" read as a stage (Android playtest 2026-10-20)
    .replace(/\bR\/B(\(\d\))?/i, 'Rocket Stage')
    .replace(/\bDeb\b/i, 'Debris')
    .replace(/\bCosmos\b/g, 'Kosmos') // the Russian name (Космос), as Wikipedia and Gunter’s Space Page write it; the US catalogue says COSMOS (Sevaan 2026-10-20)
    .replace(/([^\s(])\(/g, '$1 (') // "SL-12 Rocket Stage(Aux Motor)": a space before a bracket (2026-10-14)
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

const launchDay = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });

// Facts computed from the catalogue, for objects without a hand-written or family fact. Each one is
// true as stated: today’s orbit, the launch record, or a date comparison.
export function computedFacts(o) {
  const out = [];
  const st = orbitStats(o);
  const ecc = o.apogee != null && o.perigee != null ? o.apogee - o.perigee : null;
  // What launched it, or what launch it came from (rocket stages and debris share their payload’s launch).
  if (o.parent && o.type === 'rocket-body') out.push(`It carried **${titleCase(o.parent).replace(/\bCosmos\b/g, 'Kosmos')}** into orbit, then stayed up there itself.`);
  if (o.parent && o.type === 'debris') out.push(`A piece of debris from the same launch as **${titleCase(o.parent).replace(/\bCosmos\b/g, 'Kosmos')}**.`);
  // Date comparisons.
  if (o.launch && o.launch < APOLLO_11) out.push('It was **already up there** when Apollo 11 landed on the Moon.');
  else if (o.launch && o.launch < WEB) out.push('It’s **older than the World Wide Web**.');
  else if (o.launch && o.launch < GOOGLE) out.push('It was launched **before Google existed**.');
  else if (o.launch && o.launch < IPHONE) out.push('It was launched **before the first iPhone** went on sale.');
  // Today’s orbit.
  if (ecc != null && ecc > 1500) out.push(`Its orbit is a long oval: it swoops from **${o.perigee.toLocaleString('en-US')} km** to **${o.apogee.toLocaleString('en-US')} km** above Earth.`);
  // 96–99° is a sun-synchronous orbit (most Earth-watching satellites), not a "westward" one (astronomers 2026-10-11).
  if (o.incl >= 95 && o.incl <= 100 && ecc != null && ecc < 300 && Math.abs(Math.acos(-(((6378 + (o.apogee + o.perigee) / 2) / 12352) ** 3.5)) * 180 / Math.PI - o.incl) < 1) out.push('Its near-polar orbit has the height and tilt typical of **sun-synchronous satellites**, designed to pass places at roughly the same **local solar time**.');
  else if (o.incl > 105) out.push('It orbits **against Earth’s spin**, heading west, which takes extra rocket power to reach.');
  else if (o.incl >= 80) out.push('Its orbit runs **close to the poles**, so over time it passes above almost every part of Earth.');
  if (st && ecc != null && ecc < 300) out.push(`It moves about **${st.speed.toFixed(1)} km every second**. That’s Toronto to Montreal in about ${Math.round(504 / st.speed)} seconds.`);
  if (o.period) out.push(`It goes all the way around Earth in **${Math.round(o.period)} minutes**, about ${Number((1440 / o.period).toFixed(o.period > 144 ? 1 : 0))} times a day.`);
  // The launch record.
  if (o.launch && o.site && siteName(o.site) !== o.site) out.push(`Launched on **${launchDay(o.launch)}** from ${siteName(o.site)}.`);
  else if (o.launch) out.push(`Launched on **${launchDay(o.launch)}**${o.owner && ownerName(o.owner) !== o.owner ? ` by ${ownerName(o.owner)}` : ''}.`);
  return out;
}

function familyFact(o, now) {
  const days = o.launch ? (now - new Date(`${o.launch}T00:00:00Z`)) / 86400000 : 999;
  const lead = `**${o.members.length} ${o.familyName} satellites** from one launch${o.maker ? ` by ${o.maker}` : ''}.`;
  if (days < 30) return `${lead} Fresh from launch, they still fly in a line like a **string of pearls**.`;
  return `${lead} They’ve since spread out into a web around the planet. Catch as many as you can.`;
}

// What each fleet is for, shown under the launch dots on a fleet card (2026-10-09).
export const FLEET_ABOUT = {
  STARLINK: "SpaceX’s **internet in the sky**, the largest fleet ever flown. Thousands of satellites beam broadband down to dishes on the ground.",
  ONEWEB: 'A **broadband network** flying higher than Starlink, at about 1,200 km, built to reach ships, planes and the far north.',
  QIANFAN: '“**Thousand Sails**”: China’s answer to Starlink. Shanghai Spacecom plans more than 15,000 satellites for internet worldwide.',
  KUIPER: "**Amazon’s internet fleet**, first called Project Kuiper. More than 3,000 satellites are planned to bring broadband to places cables can’t reach.",
  GLOBALSTAR: 'A **satellite phone network**. These are the satellites that carry an iPhone’s **Emergency SOS** when there’s no cell signal.',
  ORBCOMM: 'Small satellites that **pass messages for machines**: trucks, ships and shipping containers checking in from anywhere on Earth.',
  IRIDIUM: '**66 satellites cover the whole planet**, poles included, so a satellite phone works anywhere. Named after element 77, the size first planned.',
};
// More about each fleet (2026-10-20, Sevaan: a different fact each time you stamp a launch). The card shows
// FLEET_ABOUT for the first stamp, then steps through these, one per new stamp, and round again (fleetAbout).
export const FLEET_MORE = {
  STARLINK: [
    'Starlink satellites are flat and **stack like a deck of cards** inside the rocket, so one Falcon 9 can carry more than 20 at once.',
    'Their **electric thrusters** accelerate krypton or argon gas instead of burning chemical fuel. They raise the orbit and help steer satellites clear of debris.',
    'A fresh launch crosses the sky as a **string of lights** in a line, before the satellites spread out to their working orbits.',
    'They fly low on purpose. Starlink designs its satellites so thin air can pull a failed one down to **re-enter within about five years**, even without working thrusters.',
    'Newer ones pass data to each other with **laser links**, so your signal can cross an ocean without touching the ground.',
  ],
  ONEWEB: [
    'After Russia invaded Ukraine in 2022, OneWeb moved its last launches from Soyuz to **SpaceX and India’s LVM3**.',
    'The company went **bankrupt in 2020**. The UK government and India’s Bharti bought it, and it later joined Eutelsat.',
    'Flying higher than Starlink means **fewer satellites** cover the whole Earth, and each one stays up far longer.',
  ],
  QIANFAN: [
    'Its **first batches** went up **18 at a time** on Long March 6A rockets from Taiyuan, in northern China.',
    'In 2024 the upper stage that carried the first batch **broke apart in orbit**, scattering hundreds of tracked pieces.',
    'The name means **“a thousand sails”**: a fleet big enough to look like a harbour full of boats.',
  ],
  KUIPER: [
    'To launch fast enough, Amazon booked almost every big rocket going: **Atlas V, Vulcan, Falcon 9, Ariane 6 and New Glenn**.',
    'Two test satellites went up first in 2023 on an Atlas V. When the test was done, Amazon **steered them down to burn up**.',
    'The satellites fly at three heights, from about **590 to 630 km**, in shells that cover different parts of the globe.',
  ],
  GLOBALSTAR: [
    'Globalstar satellites are **“bent pipes”**: they bounce your call straight down to a ground station rather than to each other.',
    'They orbit at about **1,400 km**, high enough that each one sees a wide circle of the Earth below.',
    'The first Globalstar satellites went up in 1998. Twelve were lost at once when a **Zenit rocket failed** that September.',
  ],
  ORBCOMM: [
    'Orbcomm sends **short bursts of data**, not calls: a truck’s location, a tank’s fill level, a ship checking in.',
    'Many carry a receiver for ships’ **AIS beacons**, the signal every large ship sends to say where it is.',
    'The first two Orbcomm satellites launched in 1995 on a **Pegasus rocket**, dropped from under a plane in flight.',
  ],
  IRIDIUM: [
    'The first Iridium satellites had mirror-like antennas that caused **Iridium flares**, flashes brighter than Venus.',
    'The satellites pass calls **from one to the next** across the sky, so a call can cross the planet before it comes down.',
    'In 2009 an Iridium satellite was destroyed in the first accidental **collision between two intact satellites**, with dead Kosmos 2251.',
    'The original fleet was replaced by **Iridium NEXT** between 2017 and 2019, launched on Falcon 9s, **mostly in batches of ten**.',
  ],
};
// The fleet line for a card with n launches stamped: the first stamp gets FLEET_ABOUT, each later one the next fact.
export function fleetAbout(family, n = 1) {
  const all = [FLEET_ABOUT[family], ...(FLEET_MORE[family] ?? [])].filter(Boolean);
  return all.length ? all[Math.max(0, n - 1) % all.length] : '';
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
  [/Earth Science/i, '**studies Earth’s land, oceans and air**'],
  [/Navigation|Positioning/i, '**helps people find their position**'],
];
const PURPOSE_VERB = [
  [/Communications/i, '**relays communications**'], [/Navigation/i, '**helps people find their position**'],
  [/Earth Observation/i, '**watches Earth**'], [/Earth Science/i, '**studies Earth’s land, oceans and air**'],
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
  [/^OPS \d/, 'A **US military** satellite. From 1963 to 1984 most American military launches got a plain “OPS” number, and many missions were **secret**.'],
  [/^USA \d/, 'A **US military or intelligence** satellite. Since 1984 most American military satellites get a plain “USA” number instead of a name.'],
  [/^GLOBALSTAR/, 'A **Globalstar** satellite: it relays **satellite phone** calls and messages for people far from any phone network.'],
  [/^IRIDIUM/, 'An **Iridium** satellite: part of a network that lets **satellite phones** work anywhere on Earth, even at the poles.'],
  [/^ORBCOMM/, 'An **Orbcomm** satellite: it relays short **data messages** from trucks, ships and remote equipment.'],
  [/^MOLNIYA/, 'A **Molniya** communications satellite. Its long, looping orbit keeps it high over the **far north** for hours, where satellites above the equator can’t reach.'],
  [/^FLOCK/, 'A Planet “Dove”: a **shoebox-sized camera** satellite. Hundreds of them photograph the whole of Earth’s land again and again.'],
  [/^EXPLORER/, 'Part of NASA’s **Explorer** programme of science satellites, which began with America’s first satellite in 1958.'],
  [/OSCAR|^RADIO|^JAS|^UOSAT/, 'An **amateur radio** satellite: radio hobbyists around the world can use it to talk to each other.'],
  [/^GONETS/, 'A Russian **Gonets** satellite: it **stores and forwards messages** for remote users, a descendant of the Soviet Strela military relays.'],
  [/^OV\d/, 'A US Air Force **Orbiting Vehicle**: a small 1960s research satellite that studied **space radiation** and the upper atmosphere.'],
  [/^TIROS/, 'One of the **TIROS weather satellites**, the series that sent back the first TV pictures of clouds from space in 1960.'],
  [/^ESSA/, 'An **ESSA weather satellite** (1966–69): the first system to photograph the **whole world’s weather** every day.'],
  [/^NIMBUS/, 'A NASA **Nimbus** research satellite: it tried out the instruments behind modern **weather and climate** satellites.'],
  [/^DMSP/, 'A **US military weather satellite** (Defense Meteorological Satellite Program).'],
  [/^IRS[ -]/, 'An **Indian Remote Sensing** satellite: it photographs land for **maps, farming and water planning**.'],
  [/^NADEZHDA/, 'A Russian **Nadezhda** satellite: it helps ships find their position and picks up **distress beacons** for search and rescue (COSPAS-SARSAT).'],
  [/^TRANSIT/, 'A **Transit** navigation satellite: the US Navy’s system for ships and submarines to find their position, the **forerunner of GPS**.'],
  [/^NOVA/, 'A **NOVA** satellite: an improved version of the US Navy’s Transit **navigation** satellites.'],
  [/^JILIN/, 'A **Jilin-1** satellite: part of a large Chinese commercial fleet that **photographs and films Earth**.'],
  [/^GGSE/, 'GGSE stands for **Gravity Gradient Stabilization Experiment**: testing how to keep a satellite pointing at Earth using gravity alone.'],
  [/^SECOR/, 'A **SECOR** satellite: the US Army used these to measure exact distances between places on Earth, to make **accurate maps**.'],
  [/^SPOT/, 'A French **SPOT** satellite: it photographs Earth’s land for **maps, farming and forestry**.'],
  [/^OKEAN/, 'An **Okean** satellite: it watched the **oceans and sea ice** with radar.'],
  [/^FENGYUN|^FY-/, 'A Chinese **Fengyun weather satellite**.'],
  [/^RAPIDEYE/, 'One of five **RapidEye** satellites that photographed **farmland and forests** to monitor crops and land.'],
  [/^SOLRAD/, 'A US Navy **SOLRAD** satellite. The series watched the **Sun’s X-rays**, and the first ones secretly also eavesdropped on Soviet radar.'],
  [/^LANDSAT/, 'A **Landsat** satellite: the longest-running programme photographing Earth’s land, used for **maps, farming and tracking change**.'],
  [/^MAQSAT/, 'A **dummy satellite** (a mass model) carried to **test the Ariane rocket** on an early flight.'],
  [/^AIST/, 'An **AIST** small satellite built by **Samara University** in Russia for science experiments.'],
  [/^AUREOLE/, 'An **Aureole** satellite: a Soviet-French mission to study the **northern lights** and Earth’s magnetic field.'],
  [/^KIKU/, 'A Japanese **Kiku** engineering test satellite (ETS), built to **try out new satellite technology**.'],
  [/^INTERCOSMOS/, 'Part of **Intercosmos**, a Soviet programme that flew **science experiments** from partner countries.'],
  [/^MAGION/, 'A small **Magion** satellite, built in Prague, that studied Earth’s **magnetic field and the space around Earth**.'],
  [/^KITSAT/, 'A **KITSAT** satellite, from South Korea’s first satellite series. The first, KITSAT-1, was built with the University of Surrey in England.'],
  [/^STRV/, 'A British **Space Technology Research Vehicle**: a small satellite for **testing new technology** in space.'],
  [/^RESURS/, 'A Russian **Resurs** satellite: it **photographs Earth** for mapping and resources.'],
  [/^CBERS/, 'A **China–Brazil Earth Resources Satellite**: it photographs land for both countries.'],
  [/^SHIYAN/, 'A Chinese **Shiyan** satellite. Shiyan means "experiment": they **test new technology** in space.'],
  [/^SHIJIAN|^SJ-/, 'A Chinese **Shijian** satellite. Shijian means "practice": the series tests new technology and does experiments, and some missions are **secret**.'],
  [/^YAOGAN/, 'A Chinese **Yaogan** satellite. China calls them remote-sensing satellites; most are believed to be **military reconnaissance**.'],
  [/^TELSTAR/, 'A **Telstar** communications satellite. The first Telstar carried the first **live TV across the Atlantic**, in 1962.'],
  [/^RELAY/, 'A NASA **Relay** satellite: an early experiment in **relaying TV and phone calls** across oceans (1962–64).'],
  [/^ALOUETTE/, 'An **Alouette** satellite. Alouette 1 (1962) was Canada’s first satellite; the Alouettes studied the **upper atmosphere**.'],
];
// What it is, in two or three words, for the line under a card’s name (2026-10-14, mission card): "Weather satellite".
// The UCS database first (working satellites), then the Soviet series lists, then well-known name families.
const ROLE_DETAIL = [[/Electronic Intelligence/i, 'Signals-spy satellite'], [/AIS|Automatic Identification/i, 'Ship-tracking satellite'], [/Radar Imaging/i, 'Radar imaging satellite'],
  [/Hyperspectral|Multispectral|Optical Imaging|Infrared/i, 'Earth-imaging satellite'], [/Meteorology|Meterology/i, 'Weather satellite'], [/Earth Science/i, 'Earth science satellite'], [/Navigation|Positioning/i, 'Navigation satellite']];
const ROLE_PURPOSE = [[/Communications/i, 'Communications satellite'], [/Navigation/i, 'Navigation satellite'], [/Earth Observation/i, 'Earth-watching satellite'], [/Earth Science/i, 'Earth science satellite'],
  [/Space Science/i, 'Science satellite'], [/Space Observation/i, 'Space-watching satellite'], [/Surveillance/i, 'Surveillance satellite'], [/Technology/i, 'Test satellite'], [/Educational/i, 'Student satellite']];
const ROLE_SERIES = [[/^strela|^gonets/, 'Communications satellite'], [/^parus|^tsikada|^nadezhda/, 'Navigation satellite'], [/^geo-ik|^sfera|^bars/, 'Mapping satellite'], [/^us-a/, 'Ocean radar satellite'], [/^us-p|^tselina/, 'Signals-spy satellite'], [/^is-a|^i2p/, 'Anti-satellite interceptor'],
  [/^ds-p/, 'Target satellite'], [/^taifun/, 'Radar target satellite'], [/^persona/, 'Spy satellite'], [/^lotos/, 'Signals-spy satellite']];
const ROLE_NAME = [[/^NOAA|^METEOR|^GOES|^METOP|^FENGYUN|DMSP|^TIROS|^NIMBUS|^ELEKTRO\b|^HIMAWARI|^ESSA/, 'Weather satellite'], [/^NAVSTAR|^GPS|^GLONASS|^BEIDOU|^GALILEO|TRANSIT|^PARUS|^TSIKADA|^NNSS/, 'Navigation satellite'],
  [/^LANDSAT|^SPOT|^RESURS|^SENTINEL|^TERRA|^AQUA|^ENVISAT|^ERS-|^CBERS|^OKEAN|^KOMPSAT|^JILIN|^GAOFEN|^GEOSAT/, 'Earth-watching satellite'], [/^RADARSAT/, 'Radar imaging satellite'], [/^HST|HUBBLE|TELESCOPE|^SWIFT|^FERMI|^XMM|^CHANDRA/, 'Space telescope'],
  [/^IRIDIUM|^GLOBALSTAR|^ORBCOMM|^INTELSAT|^MOLNIYA|^STRELA|^GONETS|^TELSTAR|^RELAY|^ECHO/, 'Communications satellite'], [/^YAOGAN|^NROL|^LACROSSE|^KH-/, 'Spy satellite'], [/^OPS \d|^USA \d/, 'Military satellite'],
  [/^FLOCK|^DOVE \d|^SKYSAT/, 'Earth-imaging satellite'], [/^CYGFM|^CYGNSS/, 'Earth science satellite'], [/^FORTE\b/, 'Test satellite'], [/^CUBESAT|SAT-?\d*$/, 'Small satellite']];
export const ownerWord = (owner, year) => (owner === 'CIS' ? (year && year < 1992 ? 'Soviet' : 'Russian') : { US: 'American', PRC: 'Chinese', JPN: 'Japanese', FR: 'French', ESA: 'European', CA: 'Canadian', IT: 'Italian', IND: 'Indian', UK: 'British', GER: 'German', SKOR: 'South Korean', ISRA: 'Israeli', BRAZ: 'Brazilian', ARGN: 'Argentinian', IRAN: 'Iranian', NKOR: 'North Korean', TURK: 'Turkish', AUS: 'Australian' }[owner] ?? '');
// What each satellite does, written per card (2026-10-27 writing pass, Sevaan: "the reader should know what every satellite
// is for"): data/roles.json { NORAD id: role }. Checked first; the older rules below are the fallback.
let rolesCache = null;
export function roleOf(o) {
  if (o.type === 'station') return 'Space station';
  const written = rolesCache?.[o.id]; if (written) return written;
  const named = ROLE_NAME.slice(0, -1).find(([re]) => re.test(String(o.name ?? '').toUpperCase()))?.[1]; if (named) return named; // the hand-picked list knows the famous ones best; its last entry ("…SAT" = small satellite) is only a fallback (QA 2026-10-16)
  const r = purposeCache?.sats?.[o.id];
  if (r) { const [, purpose, detail] = r; const hit = (detail && ROLE_DETAIL.find(([re]) => re.test(detail))) || ROLE_PURPOSE.find(([re]) => re.test(purpose)); if (hit) return hit[1]; }
  const sk = seriesKeyOf(o); if (sk) { const hit = ROLE_SERIES.find(([re]) => re.test(sk)); if (hit) return hit[1]; }
  return ROLE_NAME.find(([re]) => re.test(String(o.name ?? '').toUpperCase()))?.[1] ?? 'Satellite';
}
export function purposeFact(o) {
  if (o.type !== 'satellite' || o.launches) return null;
  return PURPOSE.find(([re]) => re.test(o.name))?.[1] ?? ucsPurpose(o) ?? null;
}

export function factFor(o, now = new Date()) {
  if (o.natural) return o.fact;
  if (o.launches) return fleetFact(o);
  if (o.members) return familyFact(o, now);
  const rw = factsCache?.rewrite?.[o.id]?.fact; if (rw) return rw; // the 2026-10-27 writing pass wins over everything below
  const hand = loreCache?.[o.id]?.fact;
  if (hand) return hand;
  const deb = debrisOf(o); if (deb) return deb.fact;
  const res = researched(o) ?? rocketFact(o); if (res) return res;
  // Released from the ISS but not identified yet (2026-10-15, Sevaan): objects let go together get letters (YK, YL,
  // YM…) until trackers work out which CubeSat is which; their real launch is the cargo flight that carried them up.
  if (o.issDeploy && /^ISS OBJECT/.test(o.name ?? '')) return `A small satellite **released from the International Space Station** in ${String(o.launch ?? '').slice(0, 4)}. Trackers haven’t confirmed **which CubeSat** it is yet: ones let go together get letters (YK, YL, YM…) until each is identified.`;
  const series = seriesOf(o);
  if (series) return series.facts ? series.facts[Number(o.id) % series.facts.length] : series.fact;
  const fam = FAMILY.find(([re, , kinds]) => re.test(o.name) && (!kinds || kinds.includes(o.kind)));
  if (fam) return fam[1];
  const purpose = purposeFact(o);
  if (purpose) return purpose;
  const list = computedFacts(o);
  return list.length ? list[Number(o.id) % list.length] : 'A tracked object in Earth orbit.';
}

// The page that backs the fact a card is showing (2026-10-26, design/nasa-ideas.html 1, Sevaan): same order as factFor.
// null when there's no single page (family lines, the generic purpose lines). data/fact-sources.json covers natural,
// story and fleet facts; the rest carry their own `source`.
export function factSourceUrl(o, factText) {
  const one = (x) => (Array.isArray(x) ? x[0] : x) || null;
  if (o.natural === 'story') return srcCache?.stories?.[o.key] ?? null;
  if (o.natural) return one(o.src) ?? srcCache?.natural?.[o.key] ?? null;
  if (o.launches) return factText ? srcCache?.fleets?.[factText] ?? null : null;
  if (o.members) return null;
  const rw = factsCache?.rewrite?.[o.id]; if (rw?.fact) return rw.source ?? null;
  const hand = loreCache?.[o.id]; if (hand?.fact) return one(hand.source);
  const deb = debrisOf(o); if (deb) return deb.source ?? null;
  if (researched(o)) return one(factsCache.sats[o.id].source);
  if (rocketFact(o)) return one(rocketFacts.find((x) => x.re.test(o.name ?? ''))?.source);
  if (o.issDeploy && /^ISS OBJECT/.test(o.name ?? '')) return (srcCache?.catalogue ?? '').replace('{id}', o.id) || null;
  const series = seriesOf(o); if (series) return one(series.source);
  if (FAMILY.some(([re, , kinds]) => re.test(o.name) && (!kinds || kinds.includes(o.kind)))) return null;
  if (purposeFact(o)) return PURPOSE.some(([re]) => re.test(o.name)) && o.type === 'satellite' ? null : srcCache?.ucs ?? null;
  return (srcCache?.catalogue ?? '').replace('{id}', o.id) || null;
}
// Where a card’s fact comes from (for the catalogue export and checks).
export function factSourceFor(o) {
  if (o.natural || loreCache?.[o.id]?.fact) return 'Hand-written';
  if (o.launches) return 'Fleet summary';
  if (debrisOf(o)?.fact) return 'Researched debris';
  if (researched(o) || rocketFact(o)) return 'Researched';
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
  // Default: the launch year, so every card shows when it’s from as well as how long it’s been up.
  return s ? { label: s[0], value: s[1] } : { label: 'LAUNCHED', value: o.launch?.slice(0, 4) ?? String(o.year ?? '—') };
}

// **bold** → <b>, everything else escaped. In the player's units, clock and spelling first (js/localize.js, 2026-10-25).
export function richText(s) {
  const esc = String(localText(s)).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  return esc.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/(\d) (km\/h|km\/s|mph|km|mi|cm|mm|m|kg|lb|t|tons?|tonnes?|°C|°F|ly|AU|light-years?|years?|days?|minutes?|hours?|metres?|meters?|feet|ft|inches)\b/g, '$1\u00a0$2'); // a number never ends a line apart from its unit (designer playtest 2026-10-28: "3.8 / cm")
}
