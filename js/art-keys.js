// Which illustration each card uses. The illustrator's brief (scripts/art-brief.py) is generated from this
// table, and when the art arrives the card renderer can load assets/art/cards/<key>.webp, falling back to
// the drawn art in js/art.js. Every card maps to exactly one key. Order of rules matters.
// No DOM.

// key: [group, priority, title, what to draw, reference, variations]. Catch-all keys get several
// variations so neighbouring cards don't look identical; artFileFor picks one by NORAD id.
export const ART = {
  // ---- Hero pieces (one card each) ----
  'iss': ['Hero', 1, 'International Space Station', 'The ISS: long main truss with its eight large solar-array wings (four pairs), radiators, and the pressurised modules in the middle.', 'https://www.nasa.gov/international-space-station/'],
  'tiangong': ['Hero', 1, 'Tiangong space station', 'T-shaped station: Tianhe core module with the Wentian and Mengtian lab modules on either side, each with long solar arrays.', 'https://en.wikipedia.org/wiki/Tiangong_space_station'],
  'hubble': ['Hero', 1, 'Hubble Space Telescope', 'Silver cylindrical telescope (about bus-sized) with its open aperture door at one end and two flat solar panels.', 'https://science.nasa.gov/mission/hubble/observatory/'],
  'vanguard-1': ['Hero', 1, 'Vanguard 1', 'Tiny 16 cm sphere with six thin antennas sticking out: the oldest satellite still in orbit.', 'https://www.nasa.gov/history/nasa-goddards-beginnings-in-project-vanguard/'],
  'ajisai': ['Hero', 1, 'Ajisai', 'Large sphere covered in 318 mirrors and laser reflectors, so it glints like a disco ball.', 'https://ilrs.gsfc.nasa.gov/missions/satellite_missions/current_missions/ajis_general.html'],
  // ---- Moon and planets ----
  'moon': ['Moon & planets', 1, 'The Moon', 'The full Moon with recognisable maria (dark seas) and bright craters.', 'https://science.nasa.gov/moon/'],
  'planet-mercury': ['Moon & planets', 1, 'Mercury', 'Small grey cratered planet.', 'https://science.nasa.gov/mercury/'],
  'planet-venus': ['Moon & planets', 1, 'Venus', 'Pale yellow-cream planet wrapped in smooth cloud.', 'https://science.nasa.gov/venus/'],
  'planet-mars': ['Moon & planets', 1, 'Mars', 'Rust-red planet with dark markings and a white polar cap.', 'https://science.nasa.gov/mars/'],
  'planet-jupiter': ['Moon & planets', 1, 'Jupiter', 'Banded gas giant with the Great Red Spot.', 'https://science.nasa.gov/jupiter/'],
  'planet-saturn': ['Moon & planets', 1, 'Saturn', 'Golden gas giant with its wide ring system, tilted.', 'https://science.nasa.gov/saturn/'],
  // ---- Satellite fleets (wide format) ----
  'fleet-starlink': ['Fleets', 1, 'Starlink', 'A "train" of flat Starlink satellites in a line, each a flat body with one long solar wing, as seen soon after launch.', 'https://en.wikipedia.org/wiki/Starlink'],
  'fleet-oneweb': ['Fleets', 1, 'OneWeb', 'A line of OneWeb satellites: small boxy bodies with two solar panels each.', 'https://en.wikipedia.org/wiki/OneWeb_satellite_constellation'],
  'fleet-qianfan': ['Fleets', 1, 'Qianfan', 'A line of Qianfan (Thousand Sails) flat-panel satellites, China\'s broadband constellation.', 'https://en.wikipedia.org/wiki/Qianfan'],
  'fleet-kuiper': ['Fleets', 1, 'Amazon Leo (formerly Project Kuiper)', 'A line of Amazon Leo broadband satellites (the constellation was called Project Kuiper until its renaming).', 'https://en.wikipedia.org/wiki/Amazon_Leo'],
  // ---- Soviet / Russian satellite programmes ----
  'strela-1m': ['Satellites', 2, 'Strela-1M message relay', 'Small (about 70 kg) Soviet relay satellite, launched eight at a time: a compact body covered in solar cells.', 'https://space.skyrocket.de/doc_sdat/strela-1m.htm'],
  'strela-3': ['Satellites', 2, 'Strela-3 / Gonets relay', 'Cylindrical relay satellite (about 1.5 m tall, 1 m wide) with a long gravity-gradient boom.', 'https://space.skyrocket.de/doc_sdat/strela-3.htm'],
  'strela-2m': ['Satellites', 2, 'Strela-2M relay', 'Larger single relay satellite (about 800 kg), cylindrical, in an 800 km orbit.', 'https://space.skyrocket.de/doc_sdat/strela-2m.htm'],
  'parus': ['Satellites', 2, 'Parus / Tsikada / Nadezhda navigation', 'Pressurised cylindrical navigation satellite with a gravity-gradient boom (Parus, Tsikada and Nadezhda share this look).', 'https://space.skyrocket.de/doc_sdat/parus.htm'],
  'us-a': ['Satellites', 2, 'US-A radar satellite (RORSAT)', 'Soviet nuclear-powered radar ocean-surveillance satellite; the reactor section was boosted to a storage orbit.', 'https://space.skyrocket.de/doc_sdat/us-a.htm'],
  'tselina': ['Satellites', 2, 'Tselina eavesdropping satellite', 'Soviet signals-intelligence satellite (Tselina-D / Tselina-2) with a gravity-gradient boom and antennas.', 'https://space.skyrocket.de/doc_sdat/tselina-2.htm'],
  'geodetic': ['Satellites', 2, 'Sfera / Geo-IK geodesy satellite', 'Cylindrical mapping satellite; Sfera carried flashing lights to be photographed against the stars.', 'https://space.skyrocket.de/doc_sdat/sfera.htm'],
  'asat-target': ['Satellites', 2, 'DS-P1-M anti-satellite target', 'Armoured Soviet target satellite built to survive interceptor tests.', 'https://space.skyrocket.de/doc_sdat/ds-p1-m.htm'],
  'asat-interceptor': ['Satellites', 3, 'IS-A / I2P interceptor', 'Soviet co-orbital anti-satellite interceptor.', 'https://space.skyrocket.de/doc_sdat/is-a.htm'],
  'taifun': ['Satellites', 3, 'Taifun-1 radar calibration ball', 'A 2-metre sphere covered in solar cells.', 'https://space.skyrocket.de/doc_sdat/taifun-1.htm'],
  'russian-recon': ['Satellites', 3, 'Persona / Bars-M / Lotos-S', 'Modern Russian reconnaissance satellite (Yantar-derived bus, solar arrays).', 'https://space.skyrocket.de/doc_sdat/persona.htm'],
  'molniya': ['Satellites', 2, 'Molniya communications', 'Distinctive "windmill": a cylindrical body with six solar-panel petals.', 'https://space.skyrocket.de/doc_sdat/molniya-1.htm'],
  'meteor': ['Satellites', 2, 'Meteor weather satellite', 'Soviet/Russian weather satellite: cylindrical body with two large solar panels and Earth-facing instruments.', 'https://space.skyrocket.de/doc_sdat/meteor-1.htm'],
  // ---- Other satellite families ----
  'globalstar': ['Satellites', 2, 'Globalstar', 'Globalstar phone satellite: trapezoidal body with two solar wings.', 'https://en.wikipedia.org/wiki/Globalstar'],
  'orbcomm': ['Satellites', 2, 'Orbcomm', 'Orbcomm messaging satellite: flat disc-shaped body with solar panels and an antenna mast.', 'https://en.wikipedia.org/wiki/Orbcomm'],
  'iridium': ['Satellites', 3, 'Iridium', 'Iridium phone satellite: long triangular body with three flat antenna panels and two solar wings.', 'https://en.wikipedia.org/wiki/Iridium_satellite_constellation'],
  'us-weather': ['Satellites', 2, 'US weather satellite (TIROS / NOAA / DMSP)', 'American polar weather satellite: box body with a long solar array and instrument platform.', 'https://en.wikipedia.org/wiki/TIROS'],
  'chinese-eo': ['Satellites', 2, 'Chinese Earth-observation satellite', 'Yaogan / Shijian / Jilin / Gaofen family: box body with deployed solar wings.', 'https://en.wikipedia.org/wiki/Yaogan'],
  'smallsat': ['Satellites', 2, 'Small satellite / CubeSat', 'Shoebox-sized satellite with fold-out solar panels (Flock, SkySat, amateur-radio OSCARs).', 'https://en.wikipedia.org/wiki/CubeSat'],
  'us-military': ['Satellites', 2, 'US military satellite (OPS / USA)', 'Classified American satellite. Mostly 1960s Air Force OPS payloads: small drums and boxes with antennas. Keep it anonymous, no real classified designs.', 'https://en.wikipedia.org/wiki/Corona_(satellite)'],
  'early-satellite': ['Satellites', 2, 'Early satellite (before 1975)', 'Space-race era satellite: a drum or sphere covered in solar cells, with whip antennas (Explorer, Transit, OV, SECOR, Cosmos).', 'https://en.wikipedia.org/wiki/Explorer_program', 3],
  'classic-satellite': ['Satellites', 2, 'Satellite, 1975 to 1999', 'Box-shaped satellite with two solar wings and a dish or antennas (Landsat, SPOT, Resurs, amateur and science satellites).', '', 3],
  'modern-satellite': ['Satellites', 2, 'Satellite, 2000 onward', 'Modern satellite with deployable solar panels: one large Earth-observation type, one mid-size, one shoebox CubeSat-style.', '', 4],
  // ---- Rocket stages ----
  'sl-8': ['Rocket stages', 2, 'Kosmos-3M rocket (SL-8)', 'The whole Kosmos-3M: a slim two-stage Soviet rocket, pale grey-green, with a small payload fairing. The spent second stage of this rocket is the most common rocket body in the sky.', 'https://space.skyrocket.de/doc_lau/kosmos-3.htm'],
  'sl-14': ['Rocket stages', 2, 'Tsyklon-3 rocket (SL-14)', 'The whole Tsyklon-3: a slim three-stage Ukrainian-built rocket (derived from the R-36 missile) with a pointed fairing.', 'https://space.skyrocket.de/doc_lau/tsiklon.htm'],
  'sl-12': ['Rocket stages', 2, 'Proton Blok-DM upper stage (SL-12)', 'Proton\'s Blok-DM upper stage with its spherical propellant tanks.', 'https://en.wikipedia.org/wiki/Blok_D'],
  'sl-3': ['Rocket stages', 3, 'Vostok rocket (SL-3)', 'The whole Vostok rocket: the R-7 core with four tapered strap-on boosters flaring out at the base, and the small Blok E upper stage on top.', 'https://en.wikipedia.org/wiki/Vostok_(rocket_family)'],
  'sl-16': ['Rocket stages', 3, 'Zenit-2 rocket (SL-16)', 'The whole Zenit-2: a big two-stage Ukrainian rocket, uniform wide body, dark grey and white.', 'https://en.wikipedia.org/wiki/Zenit-2'],
  'briz': ['Rocket stages', 3, 'Briz-M upper stage', 'Russian Briz-M upper stage: a central core inside a doughnut-shaped drop tank.', 'https://en.wikipedia.org/wiki/Briz-M'],
  'fregat': ['Rocket stages', 3, 'Fregat upper stage', 'Fregat upper stage: a ring of six spherical tanks.', 'https://en.wikipedia.org/wiki/Fregat'],
  'russian-stage': ['Rocket stages', 3, 'Other Russian upper stage', 'Generic Soviet/Russian upper stage (Molniya, Rokot, Soyuz and others).', ''],
  'ariane-early': ['Rocket stages', 2, 'Ariane 4 rocket', 'The whole Ariane 4: a slim white core with strap-on boosters around the base and a payload fairing on top.', 'https://en.wikipedia.org/wiki/Ariane_4'],
  'ariane-5': ['Rocket stages', 2, 'Ariane 5 upper stage', 'Ariane 5 upper stage (EPS / ESC-A): squat stage with a large nozzle.', 'https://en.wikipedia.org/wiki/Ariane_5'],
  'delta-early': ['Rocket stages', 2, 'Thor-Delta rocket', 'The whole early Delta rocket: a Thor first stage (tapered lower body) with a slim second stage and small fairing, often with small solid boosters around the base.', 'https://en.wikipedia.org/wiki/Thor-Delta'],
  'delta-2': ['Rocket stages', 3, 'Delta II second stage', 'Delta II second stage.', 'https://en.wikipedia.org/wiki/Delta_II'],
  'centaur': ['Rocket stages', 2, 'Centaur upper stage', 'Centaur: a slim shiny stainless-steel balloon-tank cylinder with TWO small RL10 engine nozzles side by side at the base (not one big bell).', 'https://en.wikipedia.org/wiki/Centaur_(rocket_stage)'],
  'agena': ['Rocket stages', 3, 'Agena upper stage', 'Agena: a long, slim silver-and-white cylinder with a small single engine nozzle at the aft end and a forward equipment section; slender, not stubby.', 'https://en.wikipedia.org/wiki/Agena_(rocket_stage)'],
  'thor-upper': ['Rocket stages', 3, 'Thor rocket', 'The whole Thor rocket with its upper stage: a tapered Thor first stage and a slim upper stage on top.', 'https://en.wikipedia.org/wiki/PGM-17_Thor'],
  'titan-transtage': ['Rocket stages', 3, 'Titan Transtage', 'Titan III Transtage upper stage.', 'https://en.wikipedia.org/wiki/Transtage'],
  'scout': ['Rocket stages', 3, 'Scout rocket', 'The whole Scout: a long, very slim four-stage solid-fuel rocket with fins at the base.', 'https://en.wikipedia.org/wiki/Scout_(rocket_family)'],
  'pegasus': ['Rocket stages', 3, 'Pegasus rocket', 'The whole Pegasus XL: a small black-and-white winged solid rocket, dropped from under an aircraft, with a delta wing and tail fins.', 'https://en.wikipedia.org/wiki/Pegasus_(rocket)'],
  'ius': ['Rocket stages', 3, 'Inertial Upper Stage (IUS)', 'IUS: a squat white two-stage solid motor, ribbed, with a gold foil band; no side tanks.', 'https://en.wikipedia.org/wiki/Inertial_Upper_Stage'],
  'long-march': ['Rocket stages', 2, 'Long March 2 / 4 rocket', 'The whole Long March 2C/2D/4C: a slim white Chinese rocket with no strap-on boosters, a red Chinese-style band design kept plain (no text), and a payload fairing.', 'https://en.wikipedia.org/wiki/Long_March_4C'],
  'long-march-3': ['Rocket stages', 2, 'Long March 3B rocket', 'The whole Long March 3B: a white core with four liquid strap-on boosters with pointed tops, and a large fairing.', 'https://en.wikipedia.org/wiki/Long_March_3B'],
  'h2a': ['Rocket stages', 3, 'H-IIA rocket', 'The whole H-IIA: an orange-brown foam-insulated core with two white solid boosters and a white fairing.', 'https://en.wikipedia.org/wiki/H-IIA'],
  'falcon-9': ['Rocket stages', 3, 'Falcon 9 second stage', 'Falcon 9 second stage: a long slim white cylinder with a single Merlin Vacuum engine with a very large dark nozzle extension; long, not stubby, not orange.', 'https://en.wikipedia.org/wiki/Falcon_9'],
  'electron': ['Rocket stages', 3, 'Electron kick stage', 'Rocket Lab Electron\'s small kick stage.', 'https://en.wikipedia.org/wiki/Rocket_Lab_Electron'],
  'long-march-6a': ['Rocket stages', 3, 'Long March 6A rocket', 'The whole Long March 6A: a white core with four slim solid boosters around its base.', 'https://en.wikipedia.org/wiki/Long_March_6A'],
  'pslv': ['Rocket stages', 3, 'PSLV rocket', 'The whole PSLV: a slim Indian rocket with six solid strap-on boosters around its base and a bulbous fairing.', 'https://en.wikipedia.org/wiki/Polar_Satellite_Launch_Vehicle'],
  'gslv': ['Rocket stages', 3, 'GSLV rocket', 'The whole GSLV Mk II: a core with four liquid strap-on boosters and a large bulbous fairing.', 'https://en.wikipedia.org/wiki/Geosynchronous_Satellite_Launch_Vehicle'],
  'lvm3': ['Rocket stages', 3, 'LVM3 rocket', 'The whole LVM3 (GSLV Mk III): a wide core stage flanked by two huge S200 solid boosters with pointed tops, and a big bulbous payload fairing on top.', 'https://en.wikipedia.org/wiki/LVM3'],
  'atlas': ['Rocket stages', 3, 'Atlas rocket', 'The whole Atlas: a slim silver stainless-steel "balloon tank" booster with a wider engine skirt at the base, and an upper stage and fairing on top.', 'https://en.wikipedia.org/wiki/Atlas_(rocket_family)'],
  'diamant': ['Rocket stages', 3, 'Diamant rocket', 'The whole Diamant: a small slim French three-stage rocket with fins at the base.', 'https://en.wikipedia.org/wiki/Diamant'],
  'mu-rocket': ['Rocket stages', 3, 'Mu rocket', 'The whole Japanese Mu (M-4S / M-3H): a solid-fuel rocket with slim strap-on boosters at the base.', 'https://en.wikipedia.org/wiki/Mu_(rocket_family)'],
  'n1-rocket': ['Rocket stages', 3, 'N-I / H-I rocket', 'The whole Japanese N-I/H-I rocket (a licence-built Thor-Delta): a tapered first stage with several small solid boosters around the base.', 'https://en.wikipedia.org/wiki/N-I_(rocket)'],
  'nuri': ['Rocket stages', 3, 'Nuri rocket (KSLV-II)', 'The whole Nuri: a white three-stage South Korean rocket with no boosters.', 'https://en.wikipedia.org/wiki/Nuri_(rocket)'],
  'kinetica-1': ['Rocket stages', 3, 'Kinetica-1 rocket (Lijian-1)', 'The whole Kinetica-1 (Lijian-1 / ZK-1A): a white solid-fuel Chinese rocket with no boosters.', 'https://en.wikipedia.org/wiki/Kinetica-1'],
  'epsilon': ['Rocket stages', 3, 'Epsilon rocket', 'The whole Epsilon: a small white Japanese solid-fuel rocket.', 'https://en.wikipedia.org/wiki/Epsilon_(rocket)'],
  'jielong-3': ['Rocket stages', 3, 'Jielong-3 rocket', 'The whole Jielong-3 (Smart Dragon 3): a white solid-fuel Chinese rocket launched from a ship.', 'https://en.wikipedia.org/wiki/Jielong-3'],
  'qaem': ['Rocket stages', 3, 'Qaem-100 rocket', 'The whole Qaem-100: a small Iranian solid-fuel rocket.', 'https://en.wikipedia.org/wiki/Qaem-100'],
  'firefly-alpha': ['Rocket stages', 3, 'Firefly Alpha rocket', 'The whole Firefly Alpha: a slim black carbon-composite two-stage rocket.', 'https://en.wikipedia.org/wiki/Firefly_Alpha'],
  'h3': ['Rocket stages', 3, 'H3 rocket', 'The whole H3: an orange-insulated core with two white solid boosters.', 'https://en.wikipedia.org/wiki/H3_(rocket)'],
  'kuaizhou': ['Rocket stages', 3, 'Kuaizhou rocket', 'The whole Kuaizhou: a white Chinese solid-fuel rocket launched from a truck.', 'https://en.wikipedia.org/wiki/Kuaizhou'],
  'zhuque-2': ['Rocket stages', 3, 'Zhuque-2 rocket', 'The whole Zhuque-2: a white methane-fuelled Chinese rocket, plain cylinder with a fairing.', 'https://en.wikipedia.org/wiki/Zhuque-2'],
  'dnepr': ['Rocket stages', 3, 'Dnepr rocket', 'The whole Dnepr: a converted SS-18 missile, a stout grey-green rocket rising out of a silo.', 'https://en.wikipedia.org/wiki/Dnepr_(rocket)'],
  'molniya-rocket': ['Rocket stages', 2, 'Molniya rocket (SL-6)', 'The whole Molniya-M: the R-7 core with four tapered strap-on boosters flaring out at the base, with the upper stages on top.', 'https://en.wikipedia.org/wiki/Molniya-M'],
  'rokot': ['Rocket stages', 3, 'Rokot rocket (SL-19)', 'The whole Rokot: a slim converted UR-100N missile with a Briz-KM upper stage and fairing.', 'https://en.wikipedia.org/wiki/Rokot'],
  'start-rocket': ['Rocket stages', 3, 'Start-1 rocket (SL-18)', 'The whole Start-1: a slim solid-fuel rocket (from the Topol missile) on a road launcher.', 'https://en.wikipedia.org/wiki/Start-1'],
  'soyuz-rocket': ['Rocket stages', 3, 'Soyuz rocket', 'The whole Soyuz-2: the R-7 core with four tapered strap-on boosters flaring at the base, grey-green, with a fairing on top.', 'https://en.wikipedia.org/wiki/Soyuz-2'],
  'tsyklon-2': ['Rocket stages', 3, 'Tsyklon-2 rocket (SL-11)', 'The whole Tsyklon-2: a slim two-stage Soviet rocket from the R-36 missile.', 'https://en.wikipedia.org/wiki/Tsyklon-2'],
  'vanguard-rocket': ['Rocket stages', 3, 'Vanguard rocket', 'The whole Vanguard rocket: a slim white 1950s three-stage rocket with a pointed nose.', 'https://en.wikipedia.org/wiki/Vanguard_(rocket)'],
  'chollima-1': ['Rocket stages', 3, 'Chollima-1 rocket', 'The whole Chollima-1: a North Korean two-stage liquid rocket.', 'https://en.wikipedia.org/wiki/Chollima-1'],
  'gravity-1': ['Rocket stages', 3, 'Gravity-1 rocket', 'The whole Gravity-1 (Yinli-1): a solid core with four solid boosters, launched from a ship.', 'https://en.wikipedia.org/wiki/Gravity-1'],
  'kick-motor': ['Rocket stages', 3, 'Kick motor (PAM / Star 48)', 'A spent spherical solid-fuel kick motor with a nozzle, as used to boost satellites to high orbit.', 'https://en.wikipedia.org/wiki/Payload_Assist_Module'],
  'rocket-stage': ['Rocket stages', 3, 'Rocket stage (unidentified)', 'Generic spent upper stage: a cylinder with an engine nozzle at one end, for objects whose rocket is not known.', ''],
  // ---- Debris ----
  'briz-tank': ['Debris', 2, 'Briz-M drop tank', 'The doughnut-shaped auxiliary propellant tank dropped by Briz-M stages.', 'https://en.wikipedia.org/wiki/Briz-M'],
  'debris-rocket': ['Debris', 2, 'Rocket debris', 'Tumbling pieces of old rockets: adapter rings, fairing halves, shrouds, insulation, torn tank skin.', '', 3],
  'debris-satellite': ['Debris', 2, 'Satellite fragments', 'Pieces of broken-up satellites (collisions, explosions, anti-satellite tests): bent solar panels, torn foil, shards.', 'https://en.wikipedia.org/wiki/2009_satellite_collision', 2],
};

const NAMED = { 25544: 'iss', 48274: 'tiangong', 20580: 'hubble', 5: 'vanguard-1', 16908: 'ajisai' };
const SERIES = { 'strela-1': 'strela-1m', 'strela-1m': 'strela-1m', 'strela-2m': 'strela-2m', 'strela-3': 'strela-3', 'strela-3-late': 'strela-3', 'strela-3m': 'strela-3',
  parus: 'parus', tsikada: 'parus', nadezhda: 'parus', 'us-a': 'us-a', 'us-a-core': 'us-a', 'us-ao': 'us-a', 'tselina-d': 'tselina', 'tselina-2': 'tselina',
  sfera: 'geodetic', 'geo-ik': 'geodetic', 'ds-p1-m': 'asat-target', 'is-a': 'asat-interceptor', i2p: 'asat-interceptor', 'taifun-1': 'taifun',
  'bars-m': 'russian-recon', persona: 'russian-recon', 'lotos-s': 'russian-recon' };

// card: a card from buildCards. seriesOf: NORAD id -> series key (data/series.json members), optional.
export function artKeyFor(card, seriesOf = {}) {
  if (card.natural) return card.type === 'moon' ? 'moon' : card.type === 'planet' ? `planet-${card.name.toLowerCase()}` : `star-${card.key.split(':')[1]}`;
  if (card.launches) return `fleet-${card.family.toLowerCase()}`;
  if (NAMED[card.id]) return NAMED[card.id];
  const n = String(card.name ?? '').toUpperCase();
  if (card.type === 'debris') return /^BREEZE/.test(n) ? 'briz-tank' : /^(ARIANE|CZ-|SL-|DELTA|THOR|TITAN|FREGAT|ATLAS|PSLV|GSLV|H-|TAURUS|PEGASUS|SCOUT|AGENA|CENTAUR|FALCON)/.test(n) ? 'debris-rocket' : 'debris-satellite';
  if (card.type === 'rocket-body') {
    const rules = [[/^SL-8\b/, 'sl-8'], [/^SL-14\b/, 'sl-14'], [/^(SL-12\b|BLOCK)/, 'sl-12'], [/^SL-3\b/, 'sl-3'], [/^SL-16\b/, 'sl-16'],
      [/^BREEZE/, 'briz'], [/^FREGAT/, 'fregat'], [/^SL-6\b/, 'molniya-rocket'], [/^(SL-24|SS-18|DNEPR)/, 'dnepr'], [/^SL-19\b/, 'rokot'], [/^SL-18\b/, 'start-rocket'], [/^(SL-4\b|VOLGA)/, 'soyuz-rocket'], [/^SL-11\b/, 'tsyklon-2'], [/^SL-\d/, 'russian-stage'], [/^ARIANE 5|^ARIANE 6/, 'ariane-5'], [/^ARIANE/, 'ariane-early'],
      [/^(THORAD |THOR )?DELTA 1|^THOR DELTA/, 'delta-early'], [/^DELTA/, 'delta-2'], [/CENTAUR/, 'centaur'], [/AGENA/, 'agena'],
      [/^THOR/, 'thor-upper'], [/^TITAN/, 'titan-transtage'], [/^SCOUT/, 'scout'], [/^(PEGASUS|MINOTAUR|TAURUS)/, 'pegasus'], [/^IUS/, 'ius'],
      [/^CZ-3/, 'long-march-3'], [/^CZ-6A/, 'long-march-6a'], [/^CZ-/, 'long-march'], [/^H-2A|^H-IIA|^H-2\b/, 'h2a'], [/^(LVM3|GSLV MK ?III)/, 'lvm3'], [/^PSLV|^IRS-P2/, 'pslv'], [/^GSLV/, 'gslv'], [/^ATLAS/, 'atlas'], [/^DIAMANT/, 'diamant'], [/^M-\d/, 'mu-rocket'], [/^(N-1|N-2|H-1)\b/, 'n1-rocket'], [/^KSLV/, 'nuri'], [/^(LIJIAN|ZK-1A)/, 'kinetica-1'], [/^EPSILON/, 'epsilon'], [/^JIELONG/, 'jielong-3'], [/^QAEM/, 'qaem'], [/^FIREFLY/, 'firefly-alpha'], [/^H-3\b/, 'h3'], [/^KZ-/, 'kuaizhou'], [/^ZHUQUE/, 'zhuque-2'], [/^VANGUARD/, 'vanguard-rocket'], [/^CHOLLIMA/, 'chollima-1'], [/^(YINLI|GRAVITY)/, 'gravity-1'], [/^FALCON/, 'falcon-9'], [/^ELECTRON/, 'electron']];
    for (const [re, key] of rules) if (re.test(n)) return key;
    // Named after the satellite it boosted (e.g. ANIK C3 R/B, LEASAT 5 PKM): a payload kick motor.
    if (/^(ANIK|LEASAT|OPTUS|SBS|TELSTAR|MORELOS|SATCOM|PALAPA|INSAT|ARABSAT|ASC|USA|SKYNET|MARCOPOLO|NATO|INMARSAT|SPACENET|AURORA|TOS|APEX|ASIASAT|ECHOSTAR|OV1)\b/.test(n) || /\b(PKM|PAM|AKM)\b/.test(n)) return 'kick-motor';
    return 'rocket-stage';
  }
  if (SERIES[seriesOf[card.id]]) return SERIES[seriesOf[card.id]];
  const rules = [[/^MOLNIYA/, 'molniya'], [/^METEOR/, 'meteor'], [/^GONETS/, 'strela-3'], [/^(NADEZHDA|TSIKADA)/, 'parus'], [/^GLOBALSTAR/, 'globalstar'],
    [/^ORBCOMM/, 'orbcomm'], [/^IRIDIUM/, 'iridium'], [/^(NOAA|TIROS|ESSA|NIMBUS|DMSP|ITOS)/, 'us-weather'],
    [/^(YAOGAN|JILIN|GAOFEN|SHIJIAN|SJ-|SHIYAN|CHUANGXIN|FENGYUN)/, 'chinese-eo'], [/^(OPS|USA)\b/, 'us-military'], [/^(FLOCK|SKYSAT|LEMUR|DOVE|CUBESAT|.*OSCAR|UOSAT|RADIO|APRIZESAT|UNISAT|SAUDISAT|BANDWAGON)/, 'smallsat']];
  for (const [re, key] of rules) if (re.test(n)) return key;
  const y = Number(String(card.launch ?? '').slice(0, 4)) || 2000;
  return y < 1975 ? 'early-satellite' : y < 2000 ? 'classic-satellite' : 'modern-satellite';
}

// The file for a card: assets/art/cards/<key>.webp, or <key>-<n>.webp for keys with variations.
export function artFileFor(card, seriesOf = {}) {
  const key = artKeyFor(card, seriesOf);
  const n = ART[key]?.[5] ?? 1;
  const id = Number(card.id) || [...String(card.id)].reduce((a, ch) => a + ch.charCodeAt(0), 0);
  return n > 1 ? `${key}-${(id % n) + 1}` : key;
}
