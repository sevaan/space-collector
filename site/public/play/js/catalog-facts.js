// Facts the catalogue file no longer carries because they follow from the orbital elements (2026-10-08 slimming):
// period, inclination, apogee and perigee from `el` (OMM order, js/orbit.js EL_FIELDS), the card key and the launch
// year. Safe to call twice. Used by js/orbit.js loadCatalog and the collection page.
const MU = 398600.4418, RE = 6378.137;
export function expandFacts(o) {
  if (o.el && o.period == null) {
    const n = o.el[1], e = o.el[2];
    if (n > 0) {
      const T = 86400 / n, a = Math.cbrt(MU * (T / (2 * Math.PI)) ** 2);
      o.period = Math.round((1440 / n) * 100) / 100; o.incl = Math.round(o.el[3] * 100) / 100;
      o.apogee = Math.round(a * (1 + e) - RE); o.perigee = Math.round(a * (1 - e) - RE);
    }
  }
  o.card ??= o.family && o.cospar ? `${o.family}:${o.cospar.slice(0, 8)}` : String(o.id);
  if (o.year == null && o.launch) o.year = Number(o.launch.slice(0, 4));
  return o;
}
