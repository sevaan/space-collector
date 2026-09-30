// Space Collector plane relay (Deno Deploy).
// The app asks for planes near a point; this asks adsb.lol (which doesn't allow browser requests)
// and hands the answer back with CORS headers. Only our own pages may use it.
//   GET /?lat=44.31&lon=-78.32&dist=40   ->  adsb.lol /v2/point/{lat}/{lon}/{dist}

const ALLOWED = [/^https:\/\/sevaan\.github\.io$/, /^http:\/\/localhost(:\d+)?$/, /^http:\/\/127\.0\.0\.1(:\d+)?$/];
const cache = new Map<string, { at: number; body: string; status: number }>(); // 5 s, so nearby users share requests

Deno.serve(async (request) => {
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
  const upstream = `https://api.adsb.lol/v2/point/${lat.toFixed(2)}/${lon.toFixed(2)}/${Math.round(dist)}`;
  let hit = cache.get(upstream);
  if (!hit || Date.now() - hit.at > 5000) {
    try {
      const res = await fetch(upstream, { headers: { "User-Agent": "space-collector (https://sevaan.github.io/space-collector/)" } });
      hit = { at: Date.now(), body: await res.text(), status: res.status };
    } catch {
      return new Response("Upstream unavailable", { status: 502, headers: cors });
    }
    cache.set(upstream, hit);
    if (cache.size > 500) for (const [k, v] of cache) if (Date.now() - v.at > 5000) cache.delete(k);
  }
  return new Response(hit.body, { status: hit.status, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" } });
});
