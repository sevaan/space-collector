// Human-readable names for SATCAT codes, plus accent colours for card art.

export const OWNERS = {
  US: { name: 'United States', colors: ['#3c5aa6', '#e03a3e', '#ffffff'] },
  CIS: { name: 'Soviet Union / Russia', colors: ['#d52b1e', '#ffd700', '#0039a6'] },
  PRC: { name: 'China', colors: ['#de2910', '#ffde00', '#de2910'] },
  JPN: { name: 'Japan', colors: ['#bc002d', '#ffffff', '#bc002d'] },
  FR: { name: 'France', colors: ['#0055a4', '#ffffff', '#ef4135'] },
  ESA: { name: 'European Space Agency', colors: ['#003399', '#ffcc00', '#003399'] },
  CA: { name: 'Canada', colors: ['#d80621', '#ffffff', '#d80621'] },
  IT: { name: 'Italy', colors: ['#009246', '#ffffff', '#ce2b37'] },
  IND: { name: 'India', colors: ['#ff9933', '#ffffff', '#138808'] },
  ARGN: { name: 'Argentina', colors: ['#74acdf', '#ffffff', '#f6b40e'] },
  ISS: { name: 'International partnership', colors: ['#3c5aa6', '#d52b1e', '#ffcc00'] },
  UK: { name: 'United Kingdom', colors: ['#012169', '#c8102e', '#ffffff'] },
  GER: { name: 'Germany', colors: ['#000000', '#dd0000', '#ffce00'] },
  SKOR: { name: 'South Korea', colors: ['#cd2e3a', '#0047a0', '#ffffff'] },
  ISRA: { name: 'Israel', colors: ['#0038b8', '#ffffff', '#0038b8'] },
  BRAZ: { name: 'Brazil', colors: ['#009c3b', '#ffdf00', '#002776'] },
};

export const SITES = {
  AFETR: 'Cape Canaveral, Florida',
  AFWTR: 'Vandenberg, California',
  TYMSC: 'Baikonur, Kazakhstan',
  PLMSC: 'Plesetsk, Russia',
  KYMSC: 'Kapustin Yar, Russia',
  VOSTO: 'Vostochny, Russia',
  SVOBO: 'Svobodny, Russia',
  TANSC: 'Tanegashima, Japan',
  KSCUT: 'Uchinoura, Japan',
  FRGUI: 'Kourou, French Guiana',
  WRAS: 'Wallops Island, Virginia',
  TAISC: 'Taiyuan, China',
  XICLF: 'Xichang, China',
  JSC: 'Jiuquan, China',
  WSC: 'Wenchang, China',
  SRILR: 'Sriharikota, India',
  RLLB: 'Rocket Lab, Māhia, New Zealand',
  SEAL: 'Sea Launch, Pacific Ocean',
  DLS: 'Dombarovsky, Russia',
  SNMLP: 'San Marco platform, Kenya',
};

export const TYPE_LABEL = {
  'rocket-body': 'Rocket Stage',
  satellite: 'Satellite',
  station: 'Space Station',
  debris: 'Debris',
  moon: 'Moon',
  planet: 'Planet',
  star: 'Star',
};

export function ownerName(code) { return OWNERS[code]?.name ?? code ?? 'Unknown'; }
export function ownerColors(code) { return OWNERS[code]?.colors ?? ['#8899aa', '#ccd6e0', '#8899aa']; }
export function siteName(code) { return SITES[code] ?? code ?? 'Unknown site'; }

export function formatDate(iso) {
  if (!iso) return 'Unknown';
  const d = new Date(`${iso}T12:00:00Z`);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Mean altitude (km) and orbital speed (km/s) from apogee/perigee.
export function orbitStats(o) {
  if (o.apogee == null || o.perigee == null) return null;
  const R = 6378.137, mu = 398600.4418;
  const a = R + (o.apogee + o.perigee) / 2;
  return { alt: Math.round((o.apogee + o.perigee) / 2), speed: Math.sqrt(mu / a) };
}

export function sizeLabel(rcs) {
  if (rcs == null) return '—';
  if (rcs >= 10) return 'Huge';
  if (rcs >= 1) return 'Large';
  if (rcs >= 0.1) return 'Medium';
  return 'Small';
}

// Placeholder flavour text built from catalogue facts. Written lore will replace this for top tiers.
export function autoLore(o) {
  const who = ownerName(o.owner);
  const where = siteName(o.site).split(',')[0];
  const age = o.year ? new Date().getFullYear() - o.year : null;
  if (o.type === 'station') return `A crewed outpost circling Earth every ${Math.round(o.period ?? 92)} minutes. People are living aboard as it passes over you.`;
  if (o.type === 'rocket-body') {
    const carried = o.parent ? ` It pushed ${titleCase(o.parent)} into orbit` : ' It did its job and was left behind';
    return `Upper stage of a rocket launched from ${where} in ${o.year ?? 'an unknown year'}.${carried}, and has been coasting ever since${age ? `, ${age} years and counting` : ''}.`;
  }
  if (o.type === 'debris') return `A fragment left over from a ${who} launch in ${o.year}. Small, fast and still up there.`;
  const alive = o.ops === '+' || o.ops === 'P' || o.ops === 'B' || o.ops === 'X';
  return alive
    ? `Launched by ${who} from ${where} in ${o.year}. Still working, ${Math.round(orbitStats(o)?.alt ?? 0)} km above your head.`
    : `Launched by ${who} from ${where} in ${o.year}. Long silent, it keeps circling${age ? ` ${age} years on` : ''}.`;
}

export function titleCase(s) {
  return s.toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase()).replace(/\b(Iss|Us|Usa|Noaa|Cz|Sl|Oao|Ers|Spot)\b/g, (m) => m.toUpperCase());
}
