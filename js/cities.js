// Offline city search for Settings → Location (2026-10-25: Open-Meteo's geocoding isn't free for an app that sells a
// subscription). data/cities.json (scripts/build-cities.py, GeoNames CC BY 4.0): every place with 15,000+ people,
// biggest first. Loaded the first time someone searches. No DOM.
let list = null, loading = null;
const ALIAS = { 'United Kingdom': 'uk britain england gb', 'United States': 'us usa america', 'United Arab Emirates': 'uae', 'Netherlands': 'holland', 'South Korea': 'korea' }; // what people type
const fold = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
async function load() {
  if (list) return list;
  loading ??= fetch('data/cities.json').then((r) => r.json()).then((j) => (list = j.cities.filter((c) => !c[0].includes('(')).map((c) => ({ name: c[0], key: fold(c[0]), alt: c[1] ? fold(c[1]) : '', region: c[2], country: c[3], lat: c[4], lon: c[5], rk: fold(`${c[2]} ${c[3]} ${ALIAS[c[3]] ?? ''}`) }))));
  return loading;
}
// "toronto", "paris, texas", "london on" → up to n places: names starting with the first part, the rest matching the
// region or country, biggest first.
export async function searchCities(text, n = 6) {
  const all = await load(), [head, ...rest] = fold(text).split(/[,]+|\s{2,}/), want = rest.join(' ').trim();
  if (!head || head.length < 2) return [];
  const words = head.split(/\s+/), out = [];
  const tail = want || (words.length > 1 ? words.slice(1).join(' ') : ''), firstOnly = words.length > 1 && !want ? words[0] : null;
  for (const c of all) {
    const hit = c.key.startsWith(head) || c.alt.startsWith(head);
    const split = !hit && firstOnly && tail.length >= 2 && (c.key.startsWith(firstOnly) || c.alt.startsWith(firstOnly)) && c.rk.includes(tail);
    if ((hit && (!want || c.rk.includes(want))) || split) { out.push(c); if (out.length >= n) break; }
  }
  return out;
}
