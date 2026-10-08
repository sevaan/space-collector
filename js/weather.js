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
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(3)}&longitude=${lon.toFixed(3)}&current=cloud_cover,weather_code&hourly=cloud_cover,weather_code&forecast_days=4&timeformat=unixtime&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(String(res.status));
  const j = await res.json();
  const hours = (j.hourly?.time ?? []).map((t, i) => ({ t: t * 1000, cloud: j.hourly.cloud_cover[i], code: j.hourly.weather_code[i], kind: kindOf(j.hourly.weather_code[i]) }));
  const data = { now: { cloud: j.current?.cloud_cover ?? 0, code: j.current?.weather_code ?? 0, kind: kindOf(j.current?.weather_code ?? 0) }, hours, at: Date.now() };
  cache = { key, at: Date.now(), data };
  return data;
}

const CLEAR = 40; // % cloud at or under which a sky counts as usable
const clearHour = (h) => h.cloud <= CLEAR && !['rain', 'snow', 'storm', 'fog'].includes(h.kind);

// What tonight looks like between dusk and dawn (ms). fmt(ms) -> 'h:mm PM'.
// -> { ok: boolean, line: string, nextClear: ms | null }
export function tonightSky(wx, dusk, dawn, fmt) {
  if (!wx?.hours?.length || !dusk || !dawn) return null;
  const night = wx.hours.filter((h) => h.t >= dusk - 1800e3 && h.t <= dawn);
  if (!night.length) return null;
  const clear = night.map(clearHour);
  const worst = night.reduce((a, h) => (rank(h.kind) > rank(a) ? h.kind : a), 'clear');
  let line, ok;
  if (clear.every(Boolean)) { ok = true; line = 'Clear all night'; }
  else if (!clear.some(Boolean)) { ok = false; line = `${WORD[worst] ?? 'Cloud'} all night`; }
  else if (!clear[0]) { const i = clear.indexOf(true); ok = true; line = `${WORD[night[0].kind] === 'Clear' ? 'Cloud' : WORD[night[0].kind]} now, clearing by ${fmt(night[i].t)}`; }
  else { const i = clear.indexOf(false); ok = true; line = `Clear until ${fmt(night[i].t)}`; }
  // The next night (after this one) with a mostly clear sky, for the "come back on" line.
  let nextClear = null;
  for (let n = 1; n <= 3 && !nextClear; n++) {
    const s = dusk + n * 86400e3, e = dawn + n * 86400e3;
    const hs = wx.hours.filter((h) => h.t >= s && h.t <= e);
    if (hs.length >= 4 && hs.filter(clearHour).length >= hs.length * 0.6) nextClear = s;
  }
  // For the tour's last page (2026-10-08): which of the four cases, when it clears / clouds over, the worst weather,
  // and a summary of the next few nights.
  const kase = !ok ? 'bad' : clear.every(Boolean) ? 'clear' : !clear[0] ? 'clearing' : 'closing';
  const clearFrom = kase === 'clearing' ? night[clear.indexOf(true)].t : null, coverFrom = kase === 'closing' ? night[clear.indexOf(false)].t : null;
  const nights = [];
  for (let n = 0; n <= 3; n++) {
    const s = dusk + n * 86400e3, e = dawn + n * 86400e3, hs = wx.hours.filter((h) => h.t >= s && h.t <= e);
    if (hs.length < 3) continue;
    const share = hs.filter(clearHour).length / hs.length, w = hs.reduce((a, h) => (rank(h.kind) > rank(a) ? h.kind : a), 'clear');
    nights.push({ t: s, kind: share >= 0.8 ? 'clear' : share >= 0.5 ? 'mostly' : rank(w) >= 3 ? w : 'cloudy' });
  }
  return { ok, line, nextClear, kase, clearFrom, coverFrom, worst, nights };
}
const rank = (k) => ({ clear: 0, cloudy: 1, fog: 2, snow: 3, rain: 4, storm: 5 }[k] ?? 0);
