// Shiny captures: a rare variant earned when something special is happening in the real sky as you
// collect. Decided once, at the moment of the sighting (js/main.js recordSighting), and saved on it.
// No DOM.
export const SHINY = {
  eclipse: { label: 'Into the shadow', line: 'You watched it slip into Earth\'s shadow.' },
  moon: { label: 'Moon crossing', line: 'Caught right beside the Moon.' },
  overhead: { label: 'Straight overhead', line: 'Caught passing almost straight overhead.' },
  fresh: { label: 'Fresh from launch', line: 'Caught within a month of its launch.' },
  fullmoon: { label: 'Full Moon', line: 'Collected under a full Moon.' },
};
const angle = (a, b) => Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]))) * 180 / Math.PI;

// obj: the object; look: its look now ({ el, enu, sunlit, illum }); later: its look ~45 s from now (or null);
// moon: { enu, illum } or null; at: Date of the sighting. Returns a SHINY key or null.
export function shinyFor(obj, look, later, moon, at) {
  if (!look) return null;
  if (obj.type === 'moon') return look.illum >= 0.98 ? 'fullmoon' : null;
  const enu = look.enu;
  if (moon && enu && angle(enu, moon.enu) < (obj.natural ? 5 : 1)) return 'moon';
  if (obj.natural) return null;
  if (obj.family) return null; // mega-constellation members: one Starlink in shadow doesn't make the whole fleet card shiny (2026-10-08, Sevaan)
  if (look.sunlit && later && !later.sunlit) return 'eclipse';
  if (look.el >= 80) return 'overhead';
  if (obj.launch && at - Date.parse(`${obj.launch}T00:00:00Z`) < 30 * 86400e3) return 'fresh';
  return null;
}
