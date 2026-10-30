// Settings → Units, readable from any page (the Collection is its own page): imperial, metric, or auto by the phone's
// region, the same rule as main.js setUnits (2026-10-22: cards and the Collection follow it too).
// The phone's region is worked out once per language; the setting itself is cheap to read (perf audit 2026-10-29).
const region = new Map();
export function useMiles() {
  let v = 'auto'; try { v = localStorage.getItem('units') || 'auto'; } catch {}
  if (v !== 'auto') return v === 'imperial';
  const l = navigator.language; if (!region.has(l)) { let r = false; try { r = ['US', 'LR', 'MM'].includes(new Intl.Locale(l).maximize().region); } catch {} region.set(l, r); }
  return region.get(l);
}
