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
  'sl-8': ['Rocket stages', 2, 'Kosmos-3M second stage (SL-8)', 'Long, slender Soviet upper stage, a cylinder with an engine at one end. The most common rocket body in the sky.', 'https://space.skyrocket.de/doc_lau/kosmos-3.htm'],
  'sl-14': ['Rocket stages', 2, 'Tsyklon-3 third stage (SL-14)', 'Ukrainian-built upper stage from the Tsyklon-3 rocket.', 'https://space.skyrocket.de/doc_lau/tsiklon.htm'],
  'sl-12': ['Rocket stages', 2, 'Proton Blok-DM upper stage (SL-12)', 'Proton\'s Blok-DM upper stage with its spherical propellant tanks.', 'https://en.wikipedia.org/wiki/Blok_D'],
  'sl-3': ['Rocket stages', 3, 'Vostok upper stage (SL-3)', 'Blok E upper stage of the Vostok rocket family (the family that launched Gagarin).', 'https://en.wikipedia.org/wiki/Vostok_(rocket_family)'],
  'sl-16': ['Rocket stages', 3, 'Zenit second stage (SL-16)', 'Big Zenit-2 second stage, about the size of a bus.', 'https://en.wikipedia.org/wiki/Zenit_(rocket_family)'],
  'briz': ['Rocket stages', 3, 'Briz-M upper stage', 'Russian Briz-M upper stage: a central core inside a doughnut-shaped drop tank.', 'https://en.wikipedia.org/wiki/Briz-M'],
  'fregat': ['Rocket stages', 3, 'Fregat upper stage', 'Fregat upper stage: a ring of six spherical tanks.', 'https://en.wikipedia.org/wiki/Fregat'],
  'russian-stage': ['Rocket stages', 3, 'Other Russian upper stage', 'Generic Soviet/Russian upper stage (Molniya, Rokot, Soyuz and others).', ''],
  'ariane-early': ['Rocket stages', 2, 'Ariane 1 to 4 third stage (H10)', 'The H10 cryogenic third stage of Ariane 1 to 4.', 'https://en.wikipedia.org/wiki/Ariane_4'],
  'ariane-5': ['Rocket stages', 2, 'Ariane 5 upper stage', 'Ariane 5 upper stage (EPS / ESC-A): squat stage with a large nozzle.', 'https://en.wikipedia.org/wiki/Ariane_5'],
  'delta-early': ['Rocket stages', 2, 'Thor-Delta second stage', 'Second stage of the early Delta rockets (grown out of the Thor missile).', 'https://en.wikipedia.org/wiki/Delta_(rocket_family)'],
  'delta-2': ['Rocket stages', 3, 'Delta II second stage', 'Delta II second stage.', 'https://en.wikipedia.org/wiki/Delta_II'],
  'centaur': ['Rocket stages', 2, 'Centaur upper stage', 'Centaur: shiny stainless-steel balloon-tank stage, the first to burn liquid hydrogen.', 'https://en.wikipedia.org/wiki/Centaur_(rocket_stage)'],
  'agena': ['Rocket stages', 3, 'Agena upper stage', 'Agena upper stage (also used as a Gemini docking target).', 'https://en.wikipedia.org/wiki/Agena_(rocket_stage)'],
  'thor-upper': ['Rocket stages', 3, 'Thor Ablestar / Burner II stage', 'Small upper stages flown on Thor rockets.', 'https://en.wikipedia.org/wiki/Thor-Ablestar'],
  'titan-transtage': ['Rocket stages', 3, 'Titan Transtage', 'Titan III Transtage upper stage.', 'https://en.wikipedia.org/wiki/Transtage'],
  'scout': ['Rocket stages', 3, 'Scout upper stage', 'Small solid-fuel upper stage of the Scout rocket.', 'https://en.wikipedia.org/wiki/Scout_(rocket_family)'],
  'pegasus': ['Rocket stages', 3, 'Pegasus / Minotaur / Taurus stage', 'Small solid-fuel upper stage of the air-launched Pegasus family.', 'https://en.wikipedia.org/wiki/Pegasus_(rocket)'],
  'ius': ['Rocket stages', 3, 'Inertial Upper Stage (IUS)', 'IUS: two-stage solid booster that carried satellites to high orbits.', 'https://en.wikipedia.org/wiki/Inertial_Upper_Stage'],
  'long-march': ['Rocket stages', 2, 'Long March upper stage', 'Upper stage of the Long March 2, 4, 6 and related rockets.', 'https://en.wikipedia.org/wiki/Long_March_(rocket_family)'],
  'long-march-3': ['Rocket stages', 2, 'Long March 3 third stage', 'The cryogenic third stage of Long March 3A / 3B / 3C.', 'https://en.wikipedia.org/wiki/Long_March_3B'],
  'h2a': ['Rocket stages', 3, 'H-IIA second stage', 'Japanese H-IIA second stage.', 'https://en.wikipedia.org/wiki/H-IIA'],
  'indian-stage': ['Rocket stages', 3, 'PSLV / GSLV upper stage', 'Indian PSLV / GSLV upper stage.', 'https://en.wikipedia.org/wiki/Polar_Satellite_Launch_Vehicle'],
  'falcon-9': ['Rocket stages', 3, 'Falcon 9 second stage', 'Falcon 9 second stage with its large nozzle extension.', 'https://en.wikipedia.org/wiki/Falcon_9'],
  'electron': ['Rocket stages', 3, 'Electron kick stage', 'Rocket Lab Electron\'s small kick stage.', 'https://en.wikipedia.org/wiki/Rocket_Lab_Electron'],
  'rocket-stage': ['Rocket stages', 2, 'Rocket stage (other)', 'Generic spent upper stage or kick motor: a cylinder with an engine nozzle at one end (Atlas, Diamant, payload kick motors, new Chinese rockets).', '', 2],
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
      [/^BREEZE/, 'briz'], [/^FREGAT/, 'fregat'], [/^SL-\d/, 'russian-stage'], [/^ARIANE 5|^ARIANE 6/, 'ariane-5'], [/^ARIANE/, 'ariane-early'],
      [/^(THORAD |THOR )?DELTA 1|^THOR DELTA/, 'delta-early'], [/^DELTA/, 'delta-2'], [/CENTAUR/, 'centaur'], [/AGENA/, 'agena'],
      [/^THOR/, 'thor-upper'], [/^TITAN/, 'titan-transtage'], [/^SCOUT/, 'scout'], [/^(PEGASUS|MINOTAUR|TAURUS)/, 'pegasus'], [/^IUS/, 'ius'],
      [/^CZ-3/, 'long-march-3'], [/^CZ-/, 'long-march'], [/^H-2A|^H-IIA|^H-2\b/, 'h2a'], [/^(PSLV|GSLV)/, 'indian-stage'], [/^FALCON/, 'falcon-9'], [/^ELECTRON/, 'electron']];
    for (const [re, key] of rules) if (re.test(n)) return key;
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
