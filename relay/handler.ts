// Space Collector plane relay. Runs on any Deno host: paste this whole file into a Val Town HTTP val
// (val.town), or serve it with main.ts (Deno Deploy, `deno run -N relay/main.ts`).
// The app asks for planes near a point; this asks adsb.lol (which doesn't allow browser requests)
// and hands the answer back with CORS headers. Only our own pages may use it.
//   GET /?lat=44.31&lon=-78.32&dist=40   ->  adsb.lol /v2/point/{lat}/{lon}/{dist}, or adsb.fi if that one refuses

// The native apps (Capacitor) load from capacitor://localhost on iPhone and https://localhost on Android (2026-10-11).
const ALLOWED = [/^https:\/\/sevaan\.github\.io$/, /^http:\/\/localhost(:\d+)?$/, /^http:\/\/127\.0\.0\.1(:\d+)?$/, /^capacitor:\/\/localhost$/, /^https:\/\/localhost$/];
const cache = new Map<string, { at: number; body: string; status: number }>(); // 5 s, so nearby users share requests
const SOURCES = [
  { name: "adsb.lol", url: (lat: string, lon: string, d: number) => `https://api.adsb.lol/v2/point/${lat}/${lon}/${d}` },
  { name: "adsb.fi", url: (lat: string, lon: string, d: number) => `https://opendata.adsb.fi/api/v2/lat/${lat}/lon/${lon}/dist/${d}` },
];
const benched = new Map<string, number>(); // feed → until when it's skipped

export default async function handler(request: Request): Promise<Response> {
  const origin = request.headers.get("Origin") ?? "";
  if (!ALLOWED.some((re) => re.test(origin))) return new Response("Forbidden", { status: 403 });
  const cors = { "Access-Control-Allow-Origin": origin, Vary: "Origin" };
  if (request.method === "OPTIONS") return new Response(null, { headers: { ...cors, "Access-Control-Allow-Methods": "GET" } });
  if (request.method !== "GET") return new Response("Method not allowed", { status: 405, headers: cors });

  const q = new URL(request.url).searchParams;
  const lat = Number(q.get("lat")), lon = Number(q.get("lon")), dist = Math.min(100, Math.max(1, Number(q.get("dist") ?? 40)));
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return new Response("Bad lat/lon", { status: 400, headers: cors });
  }
  // Two free feeds, tried in turn (2026-10-18: adsb.lol answered every request from Val Town's shared servers with 429,
  // so the app showed no planes). A feed that refused is skipped for a minute. Both answer in the same readsb format
  // ({ now, ac } or { now, aircraft }), which js/planes.js reads either way.
  const L = lat.toFixed(2), O = lon.toFixed(2), D = Math.round(dist), key = `${L},${O},${D}`;
  let hit = cache.get(key);
  if (!hit || Date.now() - hit.at > 5000) {
    hit = null;
    for (const src of SOURCES) {
      if (Date.now() < (benched.get(src.name) ?? 0)) continue;
      try {
        const res = await fetch(src.url(L, O, D), { headers: { "User-Agent": "space-collector (https://sevaan.github.io/space-collector/)" }, signal: AbortSignal.timeout(4000) }); // a slow feed gives up after 4 s, so the relay always answers itself (with CORS) before Val Town cuts it off with a bare 502 (playtest 2026-10-22)
        if (res.status === 200) { hit = { at: Date.now(), body: await res.text(), status: 200 }; break; }
        benched.set(src.name, Date.now() + 60000);
      } catch { benched.set(src.name, Date.now() + 60000); }
    }
    if (!hit) return new Response("Upstream unavailable", { status: 502, headers: cors });
    cache.set(key, hit);
    if (cache.size > 500) for (const [k, v] of cache) if (Date.now() - v.at > 5000) cache.delete(k);
  }
  return new Response(hit.body, { status: hit.status, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" } });
}
