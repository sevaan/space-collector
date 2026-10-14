// Find (2026-10-13): the next visible pass of a few chosen objects over the next ~10 days, for the Collection's Find
// tab. Same visibility rules as the live sky and Tonight (sunlit, dark sky, bright enough for your sky). Steps a minute
// at a time but skips daylight in big jumps, so ten days for a handful of objects takes a moment.
import { frame, look, setSkyLimit, setBinocularMode, DARK_SUN_ELEVATION } from './orbit.js?v=0.1.664';
import { skyLimit } from './sky-limit.js?v=0.1.664';

self.onmessage = ({ data }) => {
  const { requestId, objects, observer, startMs, sb, binoculars, days = 10 } = data;
  try {
    setBinocularMode(binoculars);
    const out = {};
    for (const o of objects) {
      let pass = null, open = null;
      for (let t = startMs, end = startMs + days * 86400e3; t < end && !pass; t += 60000) {
        const f = frame(new Date(t), observer);
        if (f.sunEl >= DARK_SUN_ELEVATION) { if (open) { pass = open; break; } t += 9 * 60000; continue; }
        setSkyLimit(skyLimit({ sb, sunEl: f.sunEl }));
        const l = look(o, f);
        if (l && l.visible && l.el > 0) {
          if (!open) open = { id: o.id, start: t, end: t, riseAz: l.az, riseEl: l.el, peakEl: l.el, peakAz: l.az, mag: l.mag };
          else { open.end = t; if (l.el > open.peakEl) { open.peakEl = l.el; open.peakAz = l.az; } if (l.mag < open.mag) open.mag = l.mag; }
        } else if (open) { if (open.peakEl >= 10) pass = open; open = null; }
      }
      out[o.id] = pass ? { ...pass, peakEl: Math.round(pass.peakEl), mag: +pass.mag.toFixed(1) } : null;
    }
    self.postMessage({ requestId, passes: out });
  } catch (error) { self.postMessage({ requestId, error: error.message }); }
};
