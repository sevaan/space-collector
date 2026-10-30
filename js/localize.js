// Card and patch text for the player's own conventions (2026-10-25, Sevaan: "fix all those other things"; US/UK playtest).
// The researched facts are written once, in km, metres, tonnes and °C with British spelling. When shown:
//  - Settings → Units imperial (auto in the US): km → mi, km/h → mph, km/s → mi/s, metres → feet, cm → inches,
//    kg → lb, tonnes → tons, °C → °F, keeping about as many figures as the original number had.
//  - A 24-hour clock (Settings → Clock, or the phone's): "1 AM" → "01:00".
//  - US English phones: colour → color, centre → center, catalogue → catalog… (a fixed word list, whole words only).
import { useMiles } from './units.js?v=0.1.1431';

const num = (s) => Number(String(s).replace(/,/g, ''));
// Round n to about as many significant figures as the source number showed (at least 2), and write it with commas.
function like(src, n, minSig = 2) {
  const digits = String(src).replace(/[,.~]/g, '').replace(/^0+/, ''), sig = Math.max(minSig, digits.replace(/0+$/, '').length || 1);
  if (!Number.isFinite(n) || n === 0) return String(n);
  const step = 10 ** (Math.floor(Math.log10(Math.abs(n))) + 1 - sig), r = Math.round(n / step) * step;
  const dec = step < 1 ? Math.min(3, Math.round(-Math.log10(step))) : 0;
  return r.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}
const N = '(\\d[\\d,]*(?:\\.\\d+)?)';
function imperial(t) {
  return t
    // "6 billion km", "150 million km" → miles, keeping the word (2026-10-26: the Pale Blue Dot card in the US store shots)
    .replace(new RegExp(`${N}\\s?(million|billion) (km|kilometres|kilometers)\\b`, 'g'), (_, a, w) => `${like(a, num(a) * 0.621371)} ${w} miles`)
    // ranges first, so both numbers change: "650 to 3,800 km"
    .replace(new RegExp(`${N}\\s*(to|and|–|-)\\s*${N}\\s?(km|kilometres|kilometers)\\b(?!\\/)`, 'g'), (_, a, w, b, u) => `${like(a, num(a) * 0.621371)}${w === '–' || w === '-' ? w : ` ${w} `}${like(b, num(b) * 0.621371)} ${/^k/.test(u) && u.length > 2 ? 'miles' : 'mi'}`)
    .replace(new RegExp(`(~?)${N}\\s?km\\/h\\b`, 'g'), (_, t2, a) => `${t2}${like(a, num(a) * 0.621371)} mph`)
    .replace(new RegExp(`${N}\\s?(?:km|kilometres|kilometers) (?:an|per) hour`, 'g'), (_, a) => `${like(a, num(a) * 0.621371)} miles an hour`)
    .replace(new RegExp(`${N}\\s?km\\/s\\b`, 'g'), (_, a) => `${like(a, num(a) * 0.621371)} mi/s`)
    .replace(new RegExp(`${N}\\s?(?:km|kilometres|kilometers) (?:a|per) second`, 'g'), (_, a) => `${like(a, num(a) * 0.621371)} miles a second`)
    .replace(new RegExp(`${N}\\s?(km|kilometres|kilometers)\\b(?![\\/²³])`, 'g'), (_, a, u) => `${like(a, num(a) * 0.621371)} ${u === 'km' ? 'mi' : 'miles'}`)
    .replace(new RegExp(`${N}\\s?(metres|meters|metre|meter)\\b`, 'g'), (_, a) => `${like(a, num(a) * 3.28084)} feet`)
    .replace(new RegExp(`${N}\\s?m (long|wide|across|tall|high|deep)\\b`, 'g'), (_, a, w) => `${like(a, num(a) * 3.28084)} ft ${w}`)
    .replace(new RegExp(`${N}\\s?(cm|centimetres|centimeters)\\b`, 'g'), (_, a) => `${like(a, num(a) * 0.393701)} inches`)
    .replace(new RegExp(`${N}\\s?(kg|kilograms|kilogrammes)\\b`, 'g'), (_, a) => `${like(a, num(a) * 2.20462)} lb`)
    .replace(new RegExp(`${N}(-|\\s)(tonnes?|metric tons?)\\b`, 'g'), (_, a, sep) => `${like(a, num(a) * 1.10231)}${sep}${sep === '-' ? 'ton' : 'tons'}`) /* "an 8.8-ton satellite", "8.8 tons" */
    .replace(new RegExp(`(−|-)?${N}\\s?°C\\b`, 'g'), (_, neg, a) => { const c = (neg ? -1 : 1) * num(a), f = c * 9 / 5 + 32; return `${like(a, f, Math.abs(f) >= 1000 ? 2 : 1).replace(/^-/, '−')} °F`; });
}
// Hours written into texts ("between 1 and 4 AM", "5 and 9 PM") on a 24-hour clock.
const is24Raw = () => { try { const c = localStorage.getItem('clock'); if (c === '24') return true; if (c === '12') return false; } catch {} return !/[AP]M|am|pm/i.test(new Date(2020, 0, 1, 13).toLocaleTimeString([], { hour: 'numeric' })); };
const h24 = (h, ap) => { let n = Number(h) % 12; if (/p/i.test(ap)) n += 12; return `${String(n).padStart(2, '0')}:00`; };
function hours(t) {
  return t.replace(/\b(\d{1,2}) (and|to|–) (\d{1,2}) (AM|PM|am|pm|a\.m\.|p\.m\.)/g, (_, a, w, b, ap) => `${h24(a, ap)} ${w} ${h24(b, ap)}`)
    .replace(/\b(\d{1,2}) (AM|PM|am|pm|a\.m\.|p\.m\.)/g, (_, a, ap) => h24(a, ap));
}
// US spelling: whole words, keeping the capitalisation of the original (Colour → Color, COLOUR → COLOR).
const US = { colour: 'color', colours: 'colors', coloured: 'colored', colourful: 'colorful', favourite: 'favorite', favourites: 'favorites', grey: 'gray',
  centre: 'center', centres: 'centers', centred: 'centered', metre: 'meter', metres: 'meters', kilometre: 'kilometer', kilometres: 'kilometers', litre: 'liter', litres: 'liters',
  neighbour: 'neighbor', neighbours: 'neighbors', neighbouring: 'neighboring', honour: 'honor', honours: 'honors', honoured: 'honored', harbour: 'harbor', rumour: 'rumor',
  vapour: 'vapor', armour: 'armor', behaviour: 'behavior', programme: 'program', programmes: 'programs', travelled: 'traveled', travelling: 'traveling', traveller: 'traveler',
  modelled: 'modeled', labelled: 'labeled', signalled: 'signaled', cancelled: 'canceled', fuelled: 'fueled', catalogue: 'catalog', catalogued: 'cataloged', aluminium: 'aluminum',
  defence: 'defense', licence: 'license', analyse: 'analyze', analysed: 'analyzed', organisation: 'organization', organisations: 'organizations', organised: 'organized',
  realised: 'realized', recognised: 'recognized', specialised: 'specialized', stabilised: 'stabilized', synchronised: 'synchronized', manoeuvre: 'maneuver', manoeuvres: 'maneuvers',
  manoeuvring: 'maneuvering', fibre: 'fiber', theatre: 'theater', spectre: 'specter', lustre: 'luster', sombre: 'somber', plough: 'plow', tyre: 'tire', tyres: 'tires', mould: 'mold',
  sceptical: 'skeptical', jewellery: 'jewelry', storey: 'story', storeys: 'stories', greyish: 'grayish' }; // tonnes are a unit (imperial converts them), not a spelling
const usRe = new RegExp(`\\b(${Object.keys(US).join('|')})\\b`, 'gi');
const fit = (from, to) => (from === from.toUpperCase() ? to.toUpperCase() : from[0] === from[0].toUpperCase() ? to[0].toUpperCase() + to.slice(1) : to);
const usEnglishRaw = () => { try { return /^en(-US)?$/i.test(navigator.language) && new Intl.Locale(navigator.language).maximize().region === 'US'; } catch { return false; } };
/* The player's settings change rarely: read them at most once a second, and remember each text's answer for those
   settings (perf audit 2026-10-29: 14 regexes plus locale and localStorage work on every call cost seconds in a
   Collection scroll). */
const usEn = new Map(); export const usEnglish = () => { const l = navigator.language; if (!usEn.has(l)) usEn.set(l, usEnglishRaw()); return usEn.get(l); };
let flags = null, flagsKey = ''; const memo = new Map();
const raw = (k) => { try { return localStorage.getItem(k) ?? ''; } catch { return ''; } };
const flagsNow = () => { const key = `${raw('units')}|${raw('clock')}|${navigator.language}`; /* the expensive parts only when a setting or the language changes */
  if (key !== flagsKey) { const f = `${useMiles() ? 1 : 0}${is24Raw() ? 1 : 0}${usEnglish() ? 1 : 0}`; if (f !== flags) memo.clear(); flags = f; flagsKey = key; } return flags; };
export function localText(t) {
  if (!t) return t;
  const f = flagsNow(), key = String(t), hit = memo.get(key); if (hit !== undefined) return hit;
  let s = key;
  if (f[0] === '1') s = imperial(s);
  if (f[1] === '1') s = hours(s);
  if (f[2] === '1') s = s.replace(usRe, (w) => fit(w, US[w.toLowerCase()]));
  if (memo.size > 4000) memo.clear(); memo.set(key, s);
  return s;
}
