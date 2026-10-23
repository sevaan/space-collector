// Settings → Units, readable from any page (the Collection is its own page): imperial, metric, or auto by the phone's
// region, the same rule as main.js setUnits (2026-10-22: cards and the Collection follow it too).
export function useMiles() {
  let v = 'auto'; try { v = localStorage.getItem('units') || 'auto'; } catch {}
  if (v !== 'auto') return v === 'imperial';
  try { return ['US', 'LR', 'MM'].includes(new Intl.Locale(navigator.language).maximize().region); } catch { return false; }
}
