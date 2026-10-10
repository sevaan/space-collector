// "Tonight" forecast (js/main.js renderTonight): every visible satellite pass from now until dawn, and how
// many satellites are visible over the night. Runs off the main thread; ~4,000 objects × 1-minute steps
// takes a few seconds. Visibility uses the same rules as the live sky: sunlit, dark sky, and brighter than
// the limit for your sky at that moment (light pollution, twilight, Moon; js/sky-limit.js).
import { frame, look, setSkyLimit, setBinocularMode, DARK_SUN_ELEVATION } from './orbit.js?v=0.1.387';
import { skyLimit } from './sky-limit.js?v=0.1.387';
import { solarSystem, eqToEnu } from './celestial.js?v=0.1.387';

const STEP = 60000;          // 1 minute
const GAP = 3;               // a pass ends after this many minutes out of sight
self.onmessage = ({ data }) => {
  const { requestId, objects, observer, startMs, sky, sb, binoculars, hours = 24 } = data; // to dawn even from midday in winter (QA 2026-10-08; the loop stops at dawn)
  try {
    setBinocularMode(binoculars);
    const base = skyLimit({ sky, sb });
    const faintest = (binoculars ? base.binoculars : base.satellites) + 0.5;
    // Only objects that can ever get bright enough: their best case is overhead at perigee.
    const pool = objects.filter((o) => o.stdMag + 5 * Math.log10(Math.max(o.perigee ?? 400, 200) / 1000) <= faintest);
    const open = new Map(), passes = [], curve = [];
    let dusk = null, dawn = null, lastDark = false, limitAt = -1, moonEl = -90, moonIllum = 0;
    for (let k = 0; k <= (hours * 60); k++) {
      const t = startMs + k * STEP, d = new Date(t), f = frame(d, observer);
      const dark = f.sunEl < DARK_SUN_ELEVATION;
      if (dark && !lastDark && dusk == null) dusk = t;
      if (!dark && lastDark) { dawn = t; }
      lastDark = dark;
      if (!dark) { if (dawn) break; continue; }
      // The limit follows twilight and the Moon; refresh the Moon every 10 minutes.
      if (k - limitAt >= 10) {
        limitAt = k;
        const moon = solarSystem(d, observer).find((b) => b.kind === 'moon');
        if (moon) { const u = eqToEnu(d, observer)(moon.v); moonEl = Math.asin(Math.max(-1, Math.min(1, u[2]))) * 180 / Math.PI; moonIllum = moon.illum; }
      }
      setSkyLimit(skyLimit({ sky, sb, sunEl: f.sunEl, moonEl, moonIllum }));
      let count = 0;
      for (const o of pool) {
        const l = look(o, f);
        const p = open.get(o.id);
        if (l && l.visible) {
          count++;
          if (!p) open.set(o.id, { id: o.id, start: t, end: t, riseAz: l.az, riseEl: l.el, peakEl: l.el, peakAz: l.az, peakAt: t, mag: l.mag, miss: 0 });
          else { p.end = t; p.miss = 0; if (l.el > p.peakEl) { p.peakEl = l.el; p.peakAz = l.az; p.peakAt = t; } if (l.mag < p.mag) p.mag = l.mag; p.setAz = l.az; }
        } else if (p && ++p.miss > GAP) { open.delete(o.id); passes.push(p); }
      }
      curve.push([t, count]);
    }
    for (const p of open.values()) passes.push(p);
    const out = passes.filter((p) => p.peakEl >= 10).map(({ miss, ...p }) => ({ ...p, mag: +p.mag.toFixed(1), peakEl: Math.round(p.peakEl) }));
    self.postMessage({ requestId, startMs, dusk, dawn, curve, passes: out, pool: pool.length });
  } catch (error) { self.postMessage({ requestId, error: error.message }); }
};
