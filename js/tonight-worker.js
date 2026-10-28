// "Tonight" forecast (js/main.js renderTonight): every visible satellite pass from now until dawn, and how
// many satellites are visible over the night. Runs off the main thread; ~4,000 objects × 1-minute steps
// takes a few seconds. Visibility uses the same rules as the live sky: sunlit, dark sky, and brighter than
// the limit for your sky at that moment (light pollution, twilight, Moon; js/sky-limit.js).
import { frame, look, setSkyLimit, setBinocularMode, DARK_SUN_ELEVATION, withSatrecs } from './orbit.js?v=0.1.1240';
import { skyLimit } from './sky-limit.js?v=0.1.1240';
import { solarSystem, eqToEnu } from './celestial.js?v=0.1.1240';

const STEP0 = 60000;         // 1 minute (other nights in the week ahead use 2)
const GAP = 3;               // a pass ends after this many minutes out of sight
// The object list is sent once and kept here; later requests with the same list leave it out (jank playtest 2026-10-17:
// copying ~16k objects to the worker on every time jump cost ~90 ms on the main thread).
let keptObjects = null;
self.onmessage = ({ data }) => {
  if (data.objects) keptObjects = withSatrecs(data.objects);
  const objects = data.objects ?? keptObjects ?? [];
  const { requestId, observer, startMs, sky, sb, binoculars, hours = 24, step = STEP0 } = data; const STEP = step; // to dawn even from midday in winter (QA 2026-10-08; the loop stops at dawn)
  try {
    setBinocularMode(binoculars);
    const base = skyLimit({ sky, sb });
    const faintest = (binoculars ? base.binoculars : base.satellites) + 0.5;
    // Only objects that can ever get bright enough: their best case is overhead at perigee.
    const pool = objects.filter((o) => o.stdMag + 5 * Math.log10(Math.max(o.perigee ?? 400, 200) / 1000) <= faintest);
    const open = new Map(), passes = [], curve = [];
    let dusk = null, dawn = null, lastDark = false, limitAt = -1, moonEl = -90, moonIllum = 0, moonU = null;
    const sep = (a, b) => Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]))) * 180 / Math.PI;
    // Planned after dark (2026-10-18 playtest): dusk is when it really got dark, not the moment the plan was made, so
    // "Dark 6:54 PM", the evening window and the weather’s nights stay right. Stepped back 2 min at a time, up to 16 h.
    if (frame(new Date(startMs), observer).sunEl < DARK_SUN_ELEVATION) {
      let t = startMs; for (let i = 0; i < 480; i++) { const u = t - 120000; if (frame(new Date(u), observer).sunEl >= DARK_SUN_ELEVATION) break; t = u; }
      dusk = t;
    }
    for (let k = 0; k <= (hours * 3600000 / STEP); k++) {
      const t = startMs + k * STEP, d = new Date(t), f = frame(d, observer);
      const dark = f.sunEl < DARK_SUN_ELEVATION;
      if (dark && !lastDark && dusk == null) dusk = t;
      if (!dark && lastDark) { dawn = t; }
      lastDark = dark;
      if (!dark) { if (dawn) break; continue; }
      // The limit follows twilight and the Moon; refresh the Moon every 10 minutes.
      // The Moon every step (for "Moon crossing" shinies, 2026-10-11); the limit follows it.
      { const moon = solarSystem(d, observer).find((b) => b.kind === 'moon');
        if (moon) { const u = eqToEnu(d, observer)(moon.v); moonU = u; moonEl = Math.asin(Math.max(-1, Math.min(1, u[2]))) * 180 / Math.PI; moonIllum = moon.illum; } }
      setSkyLimit(skyLimit({ sky, sb, sunEl: f.sunEl, moonEl, moonIllum }));
      let count = 0;
      for (const o of pool) {
        const l = look(o, f);
        const p = open.get(o.id);
        if (l && l.visible) {
          count++;
          if (!p) open.set(o.id, { id: o.id, start: t, end: t, riseAz: l.az, riseEl: l.el, peakEl: l.el, peakAz: l.az, peakAt: t, mag: l.mag, miss: 0 });
          else { p.end = t; p.miss = 0; if (l.el > p.peakEl) { p.peakEl = l.el; p.peakAz = l.az; p.peakAt = t; } if (l.mag < p.mag) p.mag = l.mag; p.setAz = l.az; p.endEl = l.el; }
          const q = open.get(o.id);
          if (moonU && moonEl > 0) { const a = l.az * Math.PI / 180, e = l.el * Math.PI / 180, s = sep([Math.cos(e) * Math.sin(a), Math.cos(e) * Math.cos(a), Math.sin(e)], moonU); if (q.moonSep == null || s < q.moonSep) { q.moonSep = +s.toFixed(1); q.moonAt = t; } }
        } else if (p && ++p.miss > GAP) { open.delete(o.id); passes.push(p); }
        else if (p && p.miss === 1 && l && l.el >= 10 && !l.sunlit && !p.eclipseAt) { p.eclipseAt = t; p.eclipseAz = l.az; p.eclipseEl = Math.round(l.el); } // faded into Earth’s shadow, still high up
      }
      curve.push([t, count]);
      // Progress for the loading screen (2026-10-13): every ~20 sky-minutes, how far through the night and what’s found.
      if (data.progress && curve.length % Math.max(1, Math.round(20 * 60000 / STEP)) === 0) self.postMessage({ requestId, progress: { t, dusk, curve: curve.slice(), found: passes.length + open.size } });
    }
    for (const p of open.values()) passes.push(p);
    const out = passes.filter((p) => p.peakEl >= 10).map(({ miss, ...p }) => ({ ...p, mag: +p.mag.toFixed(1), peakEl: Math.round(p.peakEl) }));
    self.postMessage({ requestId, startMs, dusk, dawn, curve, passes: out, pool: pool.length, moonIllum });
  } catch (error) { self.postMessage({ requestId, error: error.message }); }
};
