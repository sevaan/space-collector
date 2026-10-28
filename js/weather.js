import { SERVER } from './server.js?v=0.1.1276';
// Local weather from Open-Meteo (free, no key, CORS-open): what the sky is doing now, and whether tonight is
// worth it. No DOM. Cached half an hour per place. Everything here is best-effort: no weather, no change.
//
// WMO weather codes: 0 clear · 1–2 some cloud · 3 overcast · 45/48 fog · 51–67 drizzle and rain · 71–77 snow ·
// 80–82 rain showers · 85–86 snow showers · 95–99 thunderstorms.

const CACHE_MS = 30 * 60e3;
let cache = null;

export function kindOf(code) {
  if (code == null) return null;
  if (code >= 95) return 'storm';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  if (code === 45 || code === 48) return 'fog';
  if (code === 3) return 'cloudy';
  return 'clear';
}
const WORD = { clear: 'Clear', cloudy: 'Overcast', fog: 'Fog', rain: 'Rain', snow: 'Snow', storm: 'Storms' };

// -> { now: { cloud, code, kind }, hours: [{ t, cloud, code, kind }] } or null.
export async function fetchWeather(lat, lon) {
  const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  if (cache && cache.key === key && Date.now() - cache.at < CACHE_MS) return cache.data;
  // Our server's /wx (MET Norway, free for commercial use, 2026-10-25) once it's deployed; Open-Meteo until then.
  if (SERVER) {
    const r = await fetch(`${SERVER}/wx?lat=${lat.toFixed(1)}&lon=${lon.toFixed(1)}`, { signal: AbortSignal.timeout?.(8000) });
    if (!r.ok) throw new Error(String(r.status));
    const j = await r.json();
    const data = { now: { cloud: j.now?.cloud ?? 0, code: j.now?.code ?? 0, kind: kindOf(j.now?.code ?? 0) }, hours: (j.hours ?? []).map((h) => ({ ...h, kind: kindOf(h.code) })), at: Date.now() };
    cache = { key, at: Date.now(), data };
    return data;
  }
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(2)}&longitude=${lon.toFixed(2)}&current=cloud_cover,weather_code&hourly=cloud_cover,weather_code,temperature_2m,wind_speed_10m&forecast_days=7&timeformat=unixtime&timezone=auto`;
  const res = await fetch(url, { signal: AbortSignal.timeout?.(8000) }); // never hangs (bug hunt 2026-10-20)
  if (!res.ok) throw new Error(String(res.status));
  const j = await res.json();
  const hours = (j.hourly?.time ?? []).map((t, i) => ({ t: t * 1000, cloud: j.hourly.cloud_cover[i], code: j.hourly.weather_code[i], kind: kindOf(j.hourly.weather_code[i]), temp: j.hourly.temperature_2m?.[i] ?? null, wind: j.hourly.wind_speed_10m?.[i] ?? null }));
  const data = { now: { cloud: j.current?.cloud_cover ?? 0, code: j.current?.weather_code ?? 0, kind: kindOf(j.current?.weather_code ?? 0) }, hours, at: Date.now() };
  cache = { key, at: Date.now(), data };
  return data;
}

const CLEAR = 40; // % cloud at or under which a sky counts as usable
const clearHour = (h) => h.cloud <= CLEAR && !['rain', 'snow', 'storm', 'fog'].includes(h.kind);
// Can you see the sky at time t? The forecast hour nearest t (or right now, within the hour). Unknown -> true, so missing
// weather never silences anything. Used to skip pass alerts in fog, rain or cloud (2026-10-12, Sevaan got one in fog).
// A good night to send someone outside (2026-10-15, Sevaan got a headliner alert on a cloudy night): the forecast must be
// known and every forecast hour within 90 minutes of t clear. Unknown weather is NOT good here (unlike skyClearAt).
export function goodSkyAt(wx, t) {
  const hrs = (wx?.hours ?? []).filter((h) => Math.abs(h.t - t) <= 90 * 60e3);
  if (!hrs.length) return false;
  if (Math.abs(t - Date.now()) < 3600e3 && wx.now && Date.now() - (wx.at ?? 0) < 90 * 60e3 && !clearHour(wx.now)) return false;
  return hrs.every(clearHour);
}
export function skyClearAt(wx, t) {
  if (!wx) return true;
  if (Math.abs(t - Date.now()) < 3600e3 && wx.now && Date.now() - (wx.at ?? 0) < 90 * 60e3) return clearHour(wx.now);
  const h = (wx.hours ?? []).reduce((b, x) => (!b || Math.abs(x.t - t) < Math.abs(b.t - t) ? x : b), null);
  return !h || Math.abs(h.t - t) > 2 * 3600e3 ? true : clearHour(h);
}

// What tonight looks like between dusk and dawn (ms). fmt(ms) -> 'h:mm PM'.
// -> { ok: boolean, line: string, nextClear: ms | null }
export function tonightSky(wx, dusk, dawn, fmt, t = Date.now()) {
  if (!wx?.hours?.length || !dusk || !dawn) return null;
  const night = wx.hours.filter((h) => h.t >= dusk - 1800e3 && h.t <= dawn);
  if (!night.length) return null;
  const clear = night.map(clearHour);
  const worst = night.reduce((a, h) => (rank(h.kind) > rank(a) ? h.kind : a), 'clear');
  let line, ok;
  if (clear.every(Boolean)) { ok = true; line = 'Clear all night'; }
  else if (!clear.some(Boolean)) { ok = false; line = `${WORD[worst] ?? 'Cloud'} all night`; }
  else { ok = true; line = skyWords(night, clear, fmt, t, dusk); }
  // The next night (after this one) with a mostly clear sky, for the "come back on" line.
  let nextClear = null;
  for (let n = 1; n <= 3 && !nextClear; n++) {
    const s = dusk + n * 86400e3, e = dawn + n * 86400e3;
    const hs = wx.hours.filter((h) => h.t >= s && h.t <= e);
    if (hs.length >= 4 && hs.filter(clearHour).length >= hs.length * 0.6) nextClear = s;
  }
  // For the tour’s last page (2026-10-08): which of the four cases, when it clears / clouds over, the worst weather,
  // and a summary of the next few nights.
  const kase = !ok ? 'bad' : clear.every(Boolean) ? 'clear' : !clear[0] ? 'clearing' : 'closing';
  const clearFrom = kase === 'clearing' ? night[clear.indexOf(true)].t : null, coverFrom = kase === 'closing' ? night[clear.indexOf(false)].t : null;
  // Seven nights (2026-10-11, design/not-tonight-combined.html), each with its average cloud cover after dark.
  const nights = [];
  for (let n = 0; n <= 6; n++) {
    const s = dusk + n * 86400e3, e = dawn + n * 86400e3, hs = wx.hours.filter((h) => h.t >= s && h.t <= e);
    if (hs.length < 3) continue;
    const share = hs.filter(clearHour).length / hs.length, w = hs.reduce((a, h) => (rank(h.kind) > rank(a) ? h.kind : a), 'clear');
    nights.push({ t: s, n, cloud: Math.round(hs.reduce((a, h) => a + h.cloud, 0) / hs.length), clearFrom: hs.find(clearHour)?.t ?? null, kind: share >= 0.8 ? 'clear' : share >= 0.5 ? 'mostly' : rank(w) >= 3 ? w : 'cloudy' });
  }
  const dh = night[0], temp = dh.temp != null ? Math.round(dh.temp) : null, wind = dh.wind != null ? Math.round(dh.wind) : null;
  return { ok, line, nextClear, kase, clearFrom, coverFrom, worst, nights, temp, wind };
}
// The words follow the clock (playtest 2026-10-22: "Cloud now, clearing by 9:00 PM" at 1 PM and still at 9:30 PM).
// Before dark: what dusk looks like ("Cloud at dusk, clearing by 9 PM"). After dark: from the current hour on
// ("Clear now", "Clear until 2 AM", "Cloud now, clearing by 11 PM"). The case (clearing/closing) is still the evening's.
function skyWords(night, clear, fmt, t, dusk) {
  const cloudWord = (k) => (WORD[k] === 'Clear' || !WORD[k] ? 'Cloud' : WORD[k]);
  const dark = t >= dusk - 1800e3, from = dark ? night.findIndex((h) => h.t + 3600e3 > t) : 0;
  if (from < 0) return clear[clear.length - 1] ? 'Clear now' : `${cloudWord(night[night.length - 1].kind)} now`;
  const rest = clear.slice(from), when = dark ? 'now' : 'at dusk';
  if (rest[0]) { const j = rest.indexOf(false); return j < 0 ? (dark ? 'Clear now' : 'Clear all night') : `Clear until ${fmt(night[from + j].t)}`; }
  const j = rest.indexOf(true);
  return j < 0 ? `${cloudWord(night[from].kind)} ${dark ? 'for the rest of the night' : 'all night'}` : `${cloudWord(night[from].kind)} ${when}, clearing by ${fmt(night[from + j].t)}`;
}
const rank = (k) => ({ clear: 0, cloudy: 1, fog: 2, snow: 3, rain: 4, storm: 5 }[k] ?? 0);
