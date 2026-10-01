// Live aircraft near you, so the app can say "Just a plane" when you line one up by mistake.
// Positions come from adsb.lol (community ADS-B receivers) through our relay (relay/handler.ts), because
// adsb.lol doesn't allow browser requests directly. Routes come from adsbdb.com, which does.
// No DOM here. Positions are extrapolated between fetches using ground speed, track and climb rate.

// Set once the relay is deployed. Empty = feature off. localStorage 'planeRelay' overrides it (testing).
const RELAY = '';
const ROUTE_API = 'https://api.adsbdb.com/v0/callsign/';
const POLL_MS = 10000;
const RADIUS_NM = 40;    // ~75 km: an airliner at cruise height is ~8° up at that distance
const MAX_AGE_S = 60;    // drop planes we haven't heard about for a minute

const RAD = Math.PI / 180, A = 6378.137, E2 = 0.00669437999014; // WGS84, km
const FT = 0.0003048, KT = 0.000514444; // feet -> km, knots -> km/s

function relayUrl() {
  try { return localStorage.getItem('planeRelay') || RELAY; } catch { return RELAY; }
}
export function planesAvailable() { return !!relayUrl(); }

function ecef(lat, lon, hKm) {
  const sl = Math.sin(lat * RAD), cl = Math.cos(lat * RAD);
  const n = A / Math.sqrt(1 - E2 * sl * sl);
  return [(n + hKm) * cl * Math.cos(lon * RAD), (n + hKm) * cl * Math.sin(lon * RAD), (n * (1 - E2) + hKm) * sl];
}

// Where a point is in the observer's sky: { az, el, rangeKm, enu } (enu is a unit East-North-Up vector).
export function skyPosition(obs, lat, lon, hKm) {
  const o = ecef(obs.lat, obs.lon, obs.heightKm ?? 0), p = ecef(lat, lon, hKm);
  const dx = p[0] - o[0], dy = p[1] - o[1], dz = p[2] - o[2];
  const sf = Math.sin(obs.lat * RAD), cf = Math.cos(obs.lat * RAD), sl = Math.sin(obs.lon * RAD), cl = Math.cos(obs.lon * RAD);
  const e = -sl * dx + cl * dy;
  const n = -sf * cl * dx - sf * sl * dy + cf * dz;
  const u = cf * cl * dx + cf * sl * dy + sf * dz;
  const r = Math.hypot(e, n, u);
  return { az: (Math.atan2(e, n) / RAD + 360) % 360, el: Math.asin(u / r) / RAD, rangeKm: r, enu: [e / r, n / r, u / r] };
}

// Move a plane forward `s` seconds along its track (flat-earth step, fine for a few seconds).
function extrapolate(p, s) {
  const d = p.gs * KT * s;
  const lat = p.lat + (d * Math.cos(p.track * RAD)) / 111.195;
  const lon = p.lon + (d * Math.sin(p.track * RAD)) / (111.195 * Math.cos(p.lat * RAD));
  return { lat, lon, hKm: Math.max(0, p.hKm + (p.climb * FT / 60) * s) };
}

function parse(json) {
  const at = json.now < 1e12 ? json.now * 1000 : json.now;
  const out = [];
  for (const a of json.ac ?? json.aircraft ?? []) {
    if (a.lat == null || a.lon == null || a.alt_baro === 'ground') continue;
    const ft = typeof a.alt_geom === 'number' ? a.alt_geom : a.alt_baro;
    if (typeof ft !== 'number') continue;
    out.push({
      hex: a.hex, callsign: (a.flight ?? '').trim(), reg: a.r ?? '', type: a.t ?? '', desc: a.desc ?? '', category: a.category ?? '',
      lat: a.lat, lon: a.lon, hKm: ft * FT, altFt: ft, gs: a.gs ?? 0, track: a.track ?? a.true_heading ?? 0,
      climb: a.geom_rate ?? a.baro_rate ?? 0, at: at - (a.seen_pos ?? 0) * 1000,
    });
  }
  return out;
}

export class PlaneTracker {
  constructor() { this.planes = []; this.lastFetch = 0; this.busy = false; this.routes = new Map(); this.failures = 0; }

  // Call every frame; fetches at most every POLL_MS (backs off after errors).
  update(obs) {
    const url = relayUrl();
    if (!url || this.busy) return;
    const wait = POLL_MS * Math.min(6, 2 ** this.failures);
    if (Date.now() - this.lastFetch < wait) return;
    this.busy = true; this.lastFetch = Date.now();
    const q = `${url.replace(/\/$/, '')}/?lat=${obs.lat.toFixed(2)}&lon=${obs.lon.toFixed(2)}&dist=${RADIUS_NM}`;
    fetch(q).then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status))))
      .then((j) => { this.planes = parse(j); this.failures = 0; })
      .catch(() => { this.failures++; })
      .finally(() => { this.busy = false; });
  }

  // Planes above the horizon right now: [{ plane, az, el, rangeKm, enu }]
  positions(obs, nowMs = Date.now()) {
    const out = [];
    for (const p of this.planes) {
      const s = (nowMs - p.at) / 1000;
      if (s > MAX_AGE_S) continue;
      const q = extrapolate(p, Math.max(0, s));
      const pos = skyPosition(obs, q.lat, q.lon, q.hKm);
      if (pos.el > 0) out.push({ plane: p, ...pos });
    }
    return out;
  }

  // Airline + origin/destination for a callsign, or null. Cached; undefined while loading.
  route(callsign) {
    if (!callsign || !/^[A-Z]{3}\d/.test(callsign)) return null; // registrations (private planes) have no route
    if (this.routes.has(callsign)) return this.routes.get(callsign);
    this.routes.set(callsign, undefined);
    fetch(ROUTE_API + encodeURIComponent(callsign))
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const f = j?.response?.flightroute;
        this.routes.set(callsign, f ? {
          airline: f.airline?.name ?? '', flight: f.callsign_iata ?? f.callsign ?? callsign,
          from: f.origin?.municipality ?? f.origin?.name ?? '', to: f.destination?.municipality ?? f.destination?.name ?? '',
        } : null);
      })
      .catch(() => this.routes.set(callsign, null));
    return undefined;
  }
}

// Friendly names for the aircraft you're most likely to see overhead.
const TYPES = {
  A19N: 'Airbus A319neo', A20N: 'Airbus A320neo', A21N: 'Airbus A321neo', A319: 'Airbus A319', A320: 'Airbus A320', A321: 'Airbus A321',
  A332: 'Airbus A330', A333: 'Airbus A330', A338: 'Airbus A330neo', A339: 'Airbus A330neo', A359: 'Airbus A350', A35K: 'Airbus A350',
  A388: 'Airbus A380', BCS1: 'Airbus A220', BCS3: 'Airbus A220',
  B737: 'Boeing 737', B738: 'Boeing 737', B739: 'Boeing 737', B38M: 'Boeing 737 MAX', B39M: 'Boeing 737 MAX', B3XM: 'Boeing 737 MAX',
  B752: 'Boeing 757', B763: 'Boeing 767', B764: 'Boeing 767', B77W: 'Boeing 777', B772: 'Boeing 777', B77L: 'Boeing 777', B744: 'Boeing 747', B748: 'Boeing 747',
  B788: 'Boeing 787', B789: 'Boeing 787', B78X: 'Boeing 787',
  CRJ2: 'Bombardier CRJ', CRJ7: 'Bombardier CRJ', CRJ9: 'Bombardier CRJ', DH8A: 'Dash 8', DH8B: 'Dash 8', DH8C: 'Dash 8', DH8D: 'Dash 8 Q400',
  E170: 'Embraer 170', E75L: 'Embraer 175', E75S: 'Embraer 175', E190: 'Embraer 190', E195: 'Embraer 195', E290: 'Embraer E2', E295: 'Embraer E2',
  AT72: 'ATR 72', AT76: 'ATR 72', C172: 'Cessna 172', C182: 'Cessna 182', C208: 'Cessna Caravan', PC12: 'Pilatus PC-12', P28A: 'Piper Cherokee', SR22: 'Cirrus SR22',
};
export function aircraftName(p) { return TYPES[p.type] ?? (p.desc ? p.desc.replace(/\b([A-Z])([A-Z]+)\b/g, (m, a, b) => a + b.toLowerCase()) : ''); }
export function isHelicopter(p) { return p.category === 'A7'; }
