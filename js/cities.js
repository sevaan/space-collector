// Offline city search for Settings → Location (2026-10-25: Open-Meteo's geocoding isn't free for an app that sells a
// subscription). data/cities.json (scripts/build-cities.py, GeoNames CC BY 4.0): every place with 15,000+ people,
// biggest first. Loaded the first time someone searches. No DOM.
let list = null, loading = null;
const ALIAS = { 'United Kingdom': 'uk britain england gb', 'United States': 'us usa america', 'United Arab Emirates': 'uae', 'Netherlands': 'holland', 'South Korea': 'korea' }; // what people type
// Folded for matching: no accents, case or punctuation ("St. John's" = "st johns"), and the usual abbreviations made
// one ("ft worth" = "fort worth", "saint" = "st"). Bug hunt 2026-10-26: "st louis", "washington dc" found nothing.
const ABBR = { ft: 'fort', mt: 'mount', saint: 'st', ste: 'sainte' };
const fold = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[.'’]/g, '').replace(/[-‐–]/g, ' ').replace(/\s+/g, ' ').trim().split(' ').map((w) => ABBR[w] ?? w).join(' ');
// US states and Canadian provinces by their postal codes ("san jose ca", "london on").
const CODES = { Alabama: 'al', Alaska: 'ak', Arizona: 'az', Arkansas: 'ar', California: 'ca', Colorado: 'co', Connecticut: 'ct', Delaware: 'de', 'District of Columbia': 'dc', Florida: 'fl', Georgia: 'ga', Hawaii: 'hi', Idaho: 'id', Illinois: 'il', Indiana: 'in', Iowa: 'ia', Kansas: 'ks', Kentucky: 'ky', Louisiana: 'la', Maine: 'me', Maryland: 'md', Massachusetts: 'ma', Michigan: 'mi', Minnesota: 'mn', Mississippi: 'ms', Missouri: 'mo', Montana: 'mt', Nebraska: 'ne', Nevada: 'nv', 'New Hampshire': 'nh', 'New Jersey': 'nj', 'New Mexico': 'nm', 'New York': 'ny', 'North Carolina': 'nc', 'North Dakota': 'nd', Ohio: 'oh', Oklahoma: 'ok', Oregon: 'or', Pennsylvania: 'pa', 'Rhode Island': 'ri', 'South Carolina': 'sc', 'South Dakota': 'sd', Tennessee: 'tn', Texas: 'tx', Utah: 'ut', Vermont: 'vt', Virginia: 'va', Washington: 'wa', 'West Virginia': 'wv', Wisconsin: 'wi', Wyoming: 'wy', Ontario: 'on', Quebec: 'qc', 'British Columbia': 'bc', Alberta: 'ab', Manitoba: 'mb', Saskatchewan: 'sk', 'Nova Scotia': 'ns', 'New Brunswick': 'nb', 'Newfoundland and Labrador': 'nl', 'Prince Edward Island': 'pe' };
async function load() {
  if (list) return list;
  loading ??= fetch('data/cities.json').then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); }).then((j) => (list = j.cities.filter((c) => !c[0].includes('(')).map((c) => ({ name: c[0], key: fold(c[0]), alt: c[1] ? fold(c[1]) : '', region: c[2], country: c[3], lat: c[4], lon: c[5], rk: ` ${fold(`${c[2]} ${CODES[c[2]] ?? ''} ${c[3]} ${ALIAS[c[3]] ?? ''}`)} ` }))));
  return loading.catch((e) => { loading = null; throw e; }); // a failed download is tried again next search
}
// "toronto", "paris, texas", "london on" → up to n places: names starting with the first part, the rest matching the
// region or country, biggest first.
export async function searchCities(text, n = 6) {
  const all = await load(), parts = String(text ?? '').split(','), head = fold(parts[0]), want = fold(parts.slice(1).join(' '));
  if (!head || head.length < 2) return [];
  // Every way of reading the words: the whole thing as a name, or the first k words as the name and the rest as the
  // region or country ("san jose ca", "washington dc", "london uk").
  const words = head.split(' '), reads = [];
  for (let k = words.length; k >= 1; k--) { const name = words.slice(0, k).join(' '), tail = [words.slice(k).join(' '), want].filter(Boolean).join(' ');
    if (k < words.length && words.slice(k).join(' ').length < 2) continue; reads.push({ name, tail }); }
  // A region word must be a whole word ("ca", "uk"), or the start of one if it's 3+ letters ("cali", "eng").
  const inRegion = (c, tail) => !tail || tail.split(' ').every((w) => c.rk.includes(` ${w} `) || (w.length >= 3 && c.rk.includes(` ${w}`)));
  const out = [], seen = new Set();
  for (const r of reads) { if (out.length) break; for (const c of all) { /* the first reading that finds anything wins */
    if (out.length >= n) return out;
    if (seen.has(c) || !(c.key.startsWith(r.name) || c.alt.startsWith(r.name)) || !inRegion(c, r.tail)) continue;
    seen.add(c); out.push(c);
  } }
  return out;
}
